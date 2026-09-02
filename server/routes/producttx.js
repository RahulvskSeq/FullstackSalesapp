import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import crypto from 'crypto';
import ProductMaster from '../models/ProductMaster.js';
import ProductTxn from '../models/ProductTxn.js';
import Dealer from '../models/Dealer.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';
import {
  normCategory, normSubCategory, parseErpDate, nameKey, matchSalesman, str as S,
  dealerKey, matchDealer,
} from '../lib/productTaxonomy.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 60 * 1024 * 1024 } });

const newBatchId = () => crypto.randomBytes(8).toString('hex');
const num = v => { const n = parseFloat(String(v ?? '').replace(/,/g, '')); return isNaN(n) ? 0 : n; };

/** Read the first sheet of an uploaded workbook into row objects. */
function readSheet(buf) {
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('Workbook has no sheets');
  return XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });
}

/** Require a set of columns, so a wrong file fails loudly instead of importing nothing. */
function requireCols(rows, cols, label) {
  const have = new Set(Object.keys(rows[0] || {}));
  const missing = cols.filter(c => !have.has(c));
  if (missing.length) {
    throw new Error(
      `This does not look like a ${label} export - missing column(s): ${missing.join(', ')}`
    );
  }
}

/**
 * Restrict a query to the caller's own rows when they are a salesman.
 * Mirrors the short-circuit used by dealerScope() in routes/dealers.js:
 * a salesman sees their own data and nothing else, with no permission
 * lookup that could widen the scope.
 */
async function scopeFor(req) {
  if (req.user?.role !== 'salesman') return {};
  const u = await User.findOne({ id: req.user.id }).select('name').lean();
  return { salesman: u?.name || ' no-match ' };
}

/* ----------------------------------------------------------------
   PRODUCT MASTER
   ---------------------------------------------------------------- */

/**
 * POST /api/producttx/master/upload
 * Two-phase: without ?commit=1 this only reports what WOULD happen.
 */
router.post('/master/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const commit = String(req.query.commit || '') === '1';

    const rows = readSheet(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: 'Sheet is empty' });
    requireCols(rows, ['ProductId', 'Category', 'Category Type', 'Product Type'], 'Product Master');

    const batchId = newBatchId();
    const docs = [];
    const catCount = new Map();
    const seen = new Set();
    let noType = 0, dupes = 0;

    for (const r of rows) {
      const productId = S(r['ProductId']);
      if (!productId) continue;
      if (seen.has(productId)) { dupes++; continue; }
      seen.add(productId);

      const categoryType = S(r['Category Type']);
      const productType = S(r['Product Type']);
      const category = normCategory(categoryType);
      const subCategory = normSubCategory(productType);
      if (!category) noType++;
      else catCount.set(category, (catCount.get(category) || 0) + 1);

      docs.push({
        productId,
        pdId: S(r['Pd-Id']),
        name: S(r['Product Name']),
        code: S(r['Product Code']),
        brand: S(r['Category']),
        categoryType, productType, category, subCategory,
        hsn: S(r['HSNCode']), gst: S(r['GST']),
        size: S(r['Size']), unit: S(r['Unit']),
        unmapped: !category,
        uploadedBy: req.user?.id || '',
        uploadBatchId: batchId,
      });
    }

    const summary = {
      commit,
      batchId: commit ? batchId : null,
      rowsRead: rows.length,
      products: docs.length,
      duplicateProductIds: dupes,
      withoutCategoryType: noType,
      byCategory: [...catCount].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ category: k, products: v })),
      brands: new Set(docs.map(d => d.brand).filter(Boolean)).size,
    };

    if (!commit) return res.json({ ok: true, preview: true, ...summary });

    // Upsert in chunks - keeps memory flat on a 46k-row master.
    let written = 0;
    for (let i = 0; i < docs.length; i += 1000) {
      const ops = docs.slice(i, i + 1000).map(d => ({
        updateOne: { filter: { productId: d.productId }, update: { $set: d }, upsert: true },
      }));
      const r2 = await ProductMaster.bulkWrite(ops, { ordered: false });
      written += (r2.upsertedCount || 0) + (r2.modifiedCount || 0);
    }
    summary.written = written;
    summary.totalInDb = await ProductMaster.countDocuments();
    res.json({ ok: true, preview: false, ...summary });
  } catch (e) {
    console.error('[producttx/master/upload]', e);
    res.status(400).json({ error: e.message });
  }
});

/** GET /api/producttx/master/stats - is a master loaded, and what does it cover? */
router.get('/master/stats', protect, async (_req, res) => {
  try {
    const total = await ProductMaster.countDocuments();
    const byCategory = await ProductMaster.aggregate([
      { $match: { category: { $ne: '' } } },
      { $group: { _id: { c: '$category', s: '$subCategory' }, n: { $sum: 1 } } },
      { $sort: { n: -1 } },
    ]);
    const unmapped = await ProductMaster.countDocuments({ unmapped: true });
    const brands = (await ProductMaster.distinct('brand')).filter(Boolean).length;
    const last = await ProductMaster.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean();
    res.json({
      total, unmapped, brands,
      updatedAt: last?.updatedAt || null,
      byCategory: byCategory.map(r => ({ category: r._id.c, subCategory: r._id.s, products: r.n })),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ----------------------------------------------------------------
   PRODUCT TRANSACTIONS
   ---------------------------------------------------------------- */

/**
 * POST /api/producttx/upload
 * Resolves each line against ProductMaster (by ProductId), the dealer list
 * and the user list. Anything that cannot be resolved is reported and
 * imported with a blank field - never guessed onto a wrong bucket.
 */
router.post('/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const commit = String(req.query.commit || '') === '1';

    const rows = readSheet(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: 'Sheet is empty' });
    requireCols(rows, ['Voucher No', 'Date', 'Qty', 'PID'], 'Product Transaction');

    // The export can now carry "Category Type" / "Product Type" itself, in
    // which case the master is not needed at all. Only insist on a master
    // when the sheet has no taxonomy of its own to fall back on.
    const sheetHasTaxonomy =
      Object.keys(rows[0] || {}).includes('Category Type') &&
      Object.keys(rows[0] || {}).includes('Product Type');
    if (!sheetHasTaxonomy && !(await ProductMaster.countDocuments())) {
      return res.status(400).json({
        error: 'This sheet has no "Category Type" / "Product Type" columns, and no Product Master is loaded. '
             + 'Either export the transaction report with those two columns, or upload the Product Master first.',
      });
    }

    // lookup tables
    const masters = await ProductMaster.find({})
      .select('productId pdId code brand categoryType productType category subCategory').lean();
    const byPid = new Map(), byPdid = new Map(), byCode = new Map();
    for (const m of masters) {
      if (m.productId) byPid.set(m.productId, m);
      if (m.pdId) byPdid.set(m.pdId, m);
      if (m.code && !byCode.has(m.code)) byCode.set(m.code, m);
    }

    const dealers = await Dealer.find({}).select('name salesman').lean();
    const dealerIndex = new Map(), dealerList = [];
    for (const d of dealers) {
      const k = dealerKey(d.name);
      if (!k) continue;
      if (!dealerIndex.has(k)) dealerIndex.set(k, d);
      dealerList.push([k, d]);
    }
    const dealerMemo = new Map();

    const users = await User.find({}).select('id name role').lean();
    const userIdByName = new Map(users.map(u => [u.name, u.id]));

    const batchId = newBatchId();
    const docs = [];
    const lineSeq = new Map();
    const unresolvedProducts = new Map();
    const unmatchedDealers = new Map();
    const fuzzyDealers = new Map();
    const unmatchedSalesmen = new Map();
    const days = new Set();
    let skipped = 0;

    for (const r of rows) {
      const voucherNo = S(r['Voucher No']);
      const pdId = S(r['PDID']);
      const productId = S(r['PID']);
      if (!voucherNo) { skipped++; continue; }

      const { date, dateStr, month, timeStr } = parseErpDate(r['Date']);
      if (!dateStr) { skipped++; continue; }
      days.add(dateStr);

      // The same product can legitimately appear twice on one voucher.
      const seqKey = `${voucherNo}|${pdId}`;
      const lineNo = lineSeq.get(seqKey) || 0;
      lineSeq.set(seqKey, lineNo + 1);

      // Product: ID join first (codes are not unique in the master).
      const productCode = S(r['Product Code']);
      const m = byPid.get(productId) || byPdid.get(pdId) || byCode.get(productCode) || null;

      // The sheet's own Category Type / Product Type win when present: they
      // describe the line as invoiced, and they skip the master entirely.
      const rawCatType = S(r['Category Type']);
      const rawProdType = S(r['Product Type']);
      const category    = normCategory(rawCatType)    || m?.category    || '';
      const subCategory = normSubCategory(rawProdType) || m?.subCategory || '';
      const taxonomyFrom = rawCatType ? 'sheet' : (m?.category ? 'master' : '');
      if (!category) {
        const k = `${S(r['Category'])} / ${S(r['Product'])} / ${productCode}`;
        unresolvedProducts.set(k, (unresolvedProducts.get(k) || 0) + 1);
      }

      // Dealer. Special characters and spacing differ between the two
      // systems, so matching is done on a stripped identity key, with a
      // fuzzy fallback that refuses near-ties.
      const companyName = S(r['Company Name']) || S(r['Party Name']);
      const dm = matchDealer(companyName, dealerIndex, dealerList, dealerMemo);
      const d = dm.dealer;
      if (!d && companyName) {
        const note = dm.suggestion
          ? `${companyName}   [closest: ${dm.suggestion} @ ${(dm.score * 100).toFixed(0)}%]`
          : companyName;
        unmatchedDealers.set(note, (unmatchedDealers.get(note) || 0) + 1);
      } else if (d && dm.reason === 'fuzzy') {
        fuzzyDealers.set(`${companyName}  ->  ${d.name}  (${(dm.score * 100).toFixed(0)}%)`,
          (fuzzyDealers.get(`${companyName}  ->  ${d.name}  (${(dm.score * 100).toFixed(0)}%)`) || 0) + 1);
      }

      // Salesman - prefer the sheet, fall back to the dealer's owner.
      const salesPersonRaw = S(r['Sales Person']);
      let salesman = matchSalesman(salesPersonRaw, users);
      if (!salesman && d?.salesman) salesman = d.salesman;
      if (!salesman && salesPersonRaw) {
        unmatchedSalesmen.set(salesPersonRaw, (unmatchedSalesmen.get(salesPersonRaw) || 0) + 1);
      }

      docs.push({
        voucherNo, lineNo, status: S(r['Status']),
        date, dateStr, month, timeStr,
        productId, pdId,
        productName: S(r['Product']), productCode,
        txnBrand: S(r['Category']),
        // The transaction sheet names ONE collection for the line actually
        // sold. The master's "Category" is a comma-joined list of every
        // collection the product belongs to ("MONTX,SAI LAKSHMI VENEERS,URO
        // VNR"), which is useless as a filter value - so the sheet wins.
        brand: S(r['Category']) || m?.brand || '',
        masterBrand: m?.brand || '',
        categoryType: rawCatType || m?.categoryType || '',
        productType: rawProdType || m?.productType || '',
        // Use the values derived above, which already prefer the sheet's own
        // Category Type / Product Type over the master lookup.
        category, subCategory,
        resolved: !!category,
        qty: num(r['Qty']), price: num(r['Price']),
        amount: num(r['Amount']), netTotal: num(r['Net Total']),
        size: S(r['Size']), unit: S(r['Unit']),
        partyName: S(r['Party Name']), companyName, partyRole: S(r['Party Role']),
        dealerId: d?._id || null, dealerName: d?.name || '',
        city: S(r['City']), state: S(r['State']),
        salesPersonRaw, salesman,
        // Sale.salesman and Dealer.salesman hold the user *id* ("rakesh"),
        // not the display name. Carry it so the sales sync writes rows the
        // rest of the app can actually filter on.
        salesmanId: d?.salesman || userIdByName.get(salesman) || '',
        taxonomyFrom,
        uploadedBy: req.user?.id || '',
        uploadBatchId: batchId,
      });
    }

    const top = m => [...m].sort((a, b) => b[1] - a[1]).slice(0, 50).map(([k, n]) => ({ value: k, lines: n }));
    const dayList = [...days].sort();
    const rollup = new Map();
    for (const d of docs) {
      if (!d.category) continue;
      const k = `${d.category}||${d.subCategory}`;
      const a = rollup.get(k) || { qty: 0, lines: 0, amount: 0 };
      a.qty += d.qty; a.lines++; a.amount += d.amount; rollup.set(k, a);
    }

    const summary = {
      commit,
      batchId: commit ? batchId : null,
      rowsRead: rows.length,
      lines: docs.length,
      skipped,
      resolved: docs.filter(d => d.resolved).length,
      unresolved: docs.filter(d => !d.resolved).length,
      dealersMatched: docs.filter(d => d.dealerName).length,
      dealersUnmatched: docs.filter(d => !d.dealerName).length,
      salesmenMatched: docs.filter(d => d.salesman).length,
      totalQty: docs.reduce((s, d) => s + d.qty, 0),
      totalAmount: docs.reduce((s, d) => s + d.amount, 0),
      vouchers: new Set(docs.map(d => d.voucherNo)).size,
      dateFrom: dayList[0] || '', dateTo: dayList[dayList.length - 1] || '',
      days: dayList.length,
      byCategory: [...rollup]
        .map(([k, v]) => { const [c, s] = k.split('||'); return { category: c, subCategory: s, ...v }; })
        .sort((a, b) => b.qty - a.qty),
      unresolvedProducts: top(unresolvedProducts),
      unmatchedDealers: top(unmatchedDealers),
      unmatchedSalesmen: top(unmatchedSalesmen),
      fuzzyDealers: top(fuzzyDealers),
      taxonomySource: sheetHasTaxonomy ? 'sheet' : 'master',
    };

    // What this upload would do to monthly sales, computed WITHOUT writing.
    // The sync rebuilds a month from every line in it, so the projection is
    // (existing lines for that month, minus any this upload replaces by key)
    // plus this upload's lines.
    const wantSync = String(req.query.syncSales || '') === '1';
    if (wantSync) summary.salesImpact = await projectSalesImpact(docs);

    if (!commit) return res.json({ ok: true, preview: true, ...summary });

    let written = 0;
    for (let i = 0; i < docs.length; i += 500) {
      const ops = docs.slice(i, i + 500).map(d => ({
        updateOne: {
          filter: { voucherNo: d.voucherNo, pdId: d.pdId, lineNo: d.lineNo },
          update: { $set: d }, upsert: true,
        },
      }));
      const r2 = await ProductTxn.bulkWrite(ops, { ordered: false });
      written += (r2.upsertedCount || 0) + (r2.modifiedCount || 0);
    }
    summary.written = written;
    summary.totalInDb = await ProductTxn.countDocuments();

    // One-step path: roll the freshly imported lines into Sale immediately,
    // so a daily upload updates the dashboards without a second action.
    if (wantSync) {
      const touched = [...new Set(docs.map(d => d.month).filter(Boolean))].sort();
      const synced = await applySalesSync(touched, req.user?.id || '');
      summary.sales = synced;
    }
    res.json({ ok: true, preview: false, ...summary });
  } catch (e) {
    console.error('[producttx/upload]', e);
    res.status(400).json({ error: e.message });
  }
});

/* ----------------------------------------------------------------
   REPORTING
   ---------------------------------------------------------------- */

/** Build the $match stage shared by /report and /lines. */
async function buildMatch(req) {
  const q = { ...(await scopeFor(req)) };
  const { from, to, brand, category, subCategory, salesman, dealer, resolved } = req.query;
  if (from || to) {
    q.dateStr = {};
    if (from) q.dateStr.$gte = String(from);
    if (to) q.dateStr.$lte = String(to);
  }
  const list = v => String(v).split(',').map(s => s.trim()).filter(Boolean);
  if (brand)       q.brand       = { $in: list(brand) };
  if (category)    q.category    = { $in: list(category) };
  if (subCategory) q.subCategory = { $in: list(subCategory) };
  if (dealer)      q.dealerName  = { $in: list(dealer) };
  // A salesman's own scope always wins over a query parameter.
  if (salesman && !q.salesman) q.salesman = { $in: list(salesman) };
  if (resolved === '0') q.resolved = false;
  if (resolved === '1') q.resolved = true;
  return q;
}

const GROUP_FIELDS = {
  brand: '$brand', category: '$category', subCategory: '$subCategory',
  salesman: '$salesman', dealer: '$dealerName', city: '$city',
  day: '$dateStr', month: '$month', product: '$productName',
};

/**
 * GET /api/producttx/report?groupBy=brand&from=&to=&category=...
 * groupBy accepts up to two comma-separated dimensions.
 */
router.get('/report', protect, async (req, res) => {
  try {
    const match = await buildMatch(req);
    const dims = String(req.query.groupBy || 'category')
      .split(',').map(s => s.trim()).filter(k => GROUP_FIELDS[k]).slice(0, 2);
    if (!dims.length) dims.push('category');

    const id = {};
    for (const d of dims) id[d] = GROUP_FIELDS[d];

    const rows = await ProductTxn.aggregate([
      { $match: match },
      { $group: {
          _id: id,
          qty: { $sum: '$qty' },
          amount: { $sum: '$amount' },
          lines: { $sum: 1 },
          vouchers: { $addToSet: '$voucherNo' },
          dealers: { $addToSet: '$dealerName' },
      } },
      { $project: {
          _id: 0, key: '$_id', qty: 1, amount: 1, lines: 1,
          vouchers: { $size: '$vouchers' },
          dealers: { $size: { $setDifference: ['$dealers', ['']] } },
      } },
      { $sort: { qty: -1 } },
      { $limit: 2000 },
    ]);

    const totals = await ProductTxn.aggregate([
      { $match: match },
      { $group: { _id: null, qty: { $sum: '$qty' }, amount: { $sum: '$amount' }, lines: { $sum: 1 },
                  vouchers: { $addToSet: '$voucherNo' } } },
      { $project: { _id: 0, qty: 1, amount: 1, lines: 1, vouchers: { $size: '$vouchers' } } },
    ]);

    res.json({ ok: true, dims, rows, totals: totals[0] || { qty: 0, amount: 0, lines: 0, vouchers: 0 } });
  } catch (e) {
    console.error('[producttx/report]', e);
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/producttx/lines - the underlying invoice lines behind a slice. */
router.get('/lines', protect, async (req, res) => {
  try {
    const match = await buildMatch(req);
    const limit = Math.min(parseInt(req.query.limit, 10) || 300, 2000);
    const rows = await ProductTxn.find(match)
      .sort({ date: -1, voucherNo: 1 })
      .limit(limit)
      .select('dateStr timeStr voucherNo productName productCode brand category subCategory qty amount dealerName companyName salesman city resolved')
      .lean();
    res.json({ ok: true, count: rows.length, rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/** GET /api/producttx/facets - values available for the filter controls. */
router.get('/facets', protect, async (req, res) => {
  try {
    const scope = await scopeFor(req);
    const [brands, categories, subCategories, salesmen, range, total] = await Promise.all([
      ProductTxn.distinct('brand', scope),
      ProductTxn.distinct('category', scope),
      ProductTxn.distinct('subCategory', scope),
      ProductTxn.distinct('salesman', scope),
      ProductTxn.aggregate([
        { $match: scope },
        { $group: { _id: null, min: { $min: '$dateStr' }, max: { $max: '$dateStr' } } },
      ]),
      ProductTxn.countDocuments(scope),
    ]);
    const clean = a => a.filter(Boolean).sort();
    res.json({
      ok: true, total,
      brands: clean(brands), categories: clean(categories),
      subCategories: clean(subCategories), salesmen: clean(salesmen),
      dateFrom: range[0]?.min || '', dateTo: range[0]?.max || '',
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ----------------------------------------------------------------
   SYNC INTO Sale  (what Monthly Entry / Overview / MTD read)
   ---------------------------------------------------------------- */

/**
 * Recompute Sale rows for a set of months from the imported invoice lines.
 *
 * Sale is (dealer x sub-category x month). ProductTxn is invoice lines with
 * real dates. Rolling the lines up per month reproduces exactly the shape
 * Monthly Entry writes, so the dashboards need no changes.
 *
 * The recompute is wholesale per month, never incremental: the month's ERP
 * rows are rebuilt from every ProductTxn line in that month. Uploading one
 * more day and re-syncing therefore yields the correct running total rather
 * than adding a day twice.
 *
 * Returns { months: [...] } describing, per month, what the sync would do.
 */
async function buildSalesSync(monthList) {
  const out = [];
  for (const month of monthList) {
    // Roll the invoice lines up to Sale's grain.
    const rolled = await ProductTxn.aggregate([
      { $match: { month, resolved: true, dealerName: { $ne: '' } } },
      { $group: {
          _id: {
            dealerName: '$dealerName', category: '$category',
            subCategory: '$subCategory', brand: '$brand',
          },
          qty: { $sum: '$qty' },
          dealerId: { $first: '$dealerId' },
          salesmanId: { $first: '$salesmanId' },
      } },
    ]);

    // What the month looks like today, and how it is currently sourced.
    const [cur] = await Sale.aggregate([
      { $match: { month } },
      { $group: { _id: null, qty: { $sum: '$qty' }, rows: { $sum: 1 } } },
    ]);
    const bySource = await Sale.aggregate([
      { $match: { month } },
      { $group: { _id: '$source', qty: { $sum: '$qty' }, rows: { $sum: 1 } } },
    ]);

    // Lines that cannot become Sale rows, so the delta is explainable.
    const [dropped] = await ProductTxn.aggregate([
      { $match: { month, $or: [{ resolved: false }, { dealerName: '' }] } },
      { $group: { _id: null, qty: { $sum: '$qty' }, lines: { $sum: 1 } } },
    ]);

    const newQty = rolled.reduce((a, r) => a + r.qty, 0);
    const curQty = cur?.qty || 0;

    const byCat = new Map();
    for (const r of rolled) {
      const k = `${r._id.category}||${r._id.subCategory}`;
      byCat.set(k, (byCat.get(k) || 0) + r.qty);
    }
    const curByCat = await Sale.aggregate([
      { $match: { month } },
      { $group: { _id: { c: '$category', s: '$subCategory' }, qty: { $sum: '$qty' } } },
    ]);
    const curCatMap = new Map(curByCat.map(r => [`${r._id.c}||${r._id.s}`, r.qty]));
    const cats = [...new Set([...byCat.keys(), ...curCatMap.keys()])].sort().map(k => {
      const [category, subCategory] = k.split('||');
      const before = curCatMap.get(k) || 0, after = byCat.get(k) || 0;
      return { category, subCategory, before, after, delta: after - before };
    });

    out.push({
      month,
      newRows: rolled.length,
      newQty,
      currentRows: cur?.rows || 0,
      currentQty: curQty,
      delta: newQty - curQty,
      bySource: bySource.map(b => ({ source: b._id || 'manual', qty: b.qty, rows: b.rows })),
      droppedLines: dropped?.lines || 0,
      droppedQty: dropped?.qty || 0,
      categories: cats,
      // A recompute that lowers a month is the dangerous case: it usually
      // means the imported lines cover only part of that month.
      warnLowers: newQty < curQty,
      rows: rolled.map(r => ({
        dealerName: r._id.dealerName,
        category: r._id.category,
        subCategory: r._id.subCategory,
        brand: r._id.brand || '',
        qty: r.qty,
        dealerId: r.dealerId,
        salesmanId: r.salesmanId,
      })),
    });
  }
  return out;
}

/**
 * Apply the sales sync for a set of months. Shared by the standalone
 * /sync-sales route and the one-step upload, so both behave identically.
 */
async function applySalesSync(monthList, byUser) {
  const months = await buildSalesSync(monthList);
  const batchId = newBatchId();
  let deleted = 0, inserted = 0;
  for (const m of months) {
    const del = await Sale.deleteMany({ month: m.month });
    deleted += del.deletedCount || 0;
    if (m.rows.length) {
      const ins = await Sale.insertMany(m.rows.map(r => ({
        dealerName: r.dealerName,
        dealerId: r.dealerId || undefined,
        salesman: r.salesmanId || '',
        month: m.month,
        category: r.category,
        subCategory: r.subCategory,
        brand: r.brand || '',
        qty: r.qty,
        uploadedBy: byUser,
        uploadBatchId: batchId,
        source: 'erp',
      })), { ordered: false });
      inserted += ins.length;
    }
  }
  return { batchId, deleted, inserted, months: months.map(({ rows, ...m }) => m) };
}

/**
 * Project what a pending upload would do to monthly sales, without writing
 * anything. Mirrors the sync exactly: a month is rebuilt from every line it
 * contains, so the projection overlays the incoming lines onto the stored
 * ones by their unique key before rolling up.
 */
async function projectSalesImpact(docs) {
  const monthList = [...new Set(docs.map(d => d.month).filter(Boolean))].sort();
  const out = [];
  for (const month of monthList) {
    const existing = await ProductTxn.find({ month })
      .select('voucherNo pdId lineNo qty category subCategory dealerName resolved').lean();

    // Key on the same triple the import upserts on, so a re-upload of the
    // same line replaces rather than adds.
    const merged = new Map();
    for (const e of existing) merged.set(`${e.voucherNo}|${e.pdId}|${e.lineNo}`, e);
    for (const d of docs) {
      if (d.month !== month) continue;
      merged.set(`${d.voucherNo}|${d.pdId}|${d.lineNo}`, d);
    }

    let newQty = 0, droppedLines = 0, droppedQty = 0;
    const byCat = new Map();
    const keys = new Set();
    for (const r of merged.values()) {
      if (!r.resolved || !r.dealerName) { droppedLines++; droppedQty += r.qty || 0; continue; }
      newQty += r.qty || 0;
      const k = `${r.category}||${r.subCategory}`;
      byCat.set(k, (byCat.get(k) || 0) + (r.qty || 0));
      keys.add(`${r.dealerName}||${r.category}||${r.subCategory}`);
    }

    const [cur] = await Sale.aggregate([
      { $match: { month } },
      { $group: { _id: null, qty: { $sum: '$qty' }, rows: { $sum: 1 } } },
    ]);
    const curByCat = await Sale.aggregate([
      { $match: { month } },
      { $group: { _id: { c: '$category', s: '$subCategory' }, qty: { $sum: '$qty' } } },
    ]);
    const curMap = new Map(curByCat.map(r => [`${r._id.c}||${r._id.s}`, r.qty]));
    const cats = [...new Set([...byCat.keys(), ...curMap.keys()])].sort().map(k => {
      const [category, subCategory] = k.split('||');
      const before = curMap.get(k) || 0, after = byCat.get(k) || 0;
      return { category, subCategory, before, after, delta: after - before };
    });

    const curQty = cur?.qty || 0;
    out.push({
      month,
      currentQty: curQty, currentRows: cur?.rows || 0,
      newQty, newRows: keys.size,
      delta: newQty - curQty,
      droppedLines, droppedQty,
      warnLowers: newQty < curQty,
      categories: cats,
    });
  }
  return out;
}

/**
 * POST /api/producttx/sync-sales?commit=1&months=2026-09
 * Without commit, reports exactly what would change. Never partial: each
 * month is replaced as a whole or not at all.
 */
router.post('/sync-sales', protect, adminOnly, async (req, res) => {
  try {
    const commit = String(req.query.commit || '') === '1';
    let monthList = String(req.query.months || '').split(',').map(x => x.trim()).filter(Boolean);
    if (!monthList.length) monthList = (await ProductTxn.distinct('month')).filter(Boolean).sort();
    if (!monthList.length) return res.status(400).json({ error: 'No imported transactions to sync.' });

    const months = await buildSalesSync(monthList);

    if (!commit) {
      return res.json({ ok: true, preview: true, months: months.map(({ rows, ...m }) => m) });
    }

    const applied = await applySalesSync(monthList, req.user?.id || '');
    res.json({ ok: true, preview: false, ...applied });
  } catch (e) {
    console.error('[producttx/sync-sales]', e);
    res.status(500).json({ error: e.message });
  }
});

/* ----------------------------------------------------------------
   BATCHES / REVERT
   ---------------------------------------------------------------- */

/** GET /api/producttx/batches - every import, newest first, so any can be undone. */
router.get('/batches', protect, adminOnly, async (_req, res) => {
  try {
    const rows = await ProductTxn.aggregate([
      { $group: {
          _id: '$uploadBatchId',
          lines: { $sum: 1 }, qty: { $sum: '$qty' }, amount: { $sum: '$amount' },
          from: { $min: '$dateStr' }, to: { $max: '$dateStr' },
          at: { $max: '$createdAt' }, by: { $first: '$uploadedBy' },
      } },
      { $sort: { at: -1 } },
      { $limit: 100 },
    ]);
    res.json({ ok: true, batches: rows.map(r => ({ batchId: r._id, ...r, _id: undefined })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/** DELETE /api/producttx/batch/:id - remove one import. */
router.delete('/batch/:id', protect, superAdminOnly, async (req, res) => {
  try {
    const r = await ProductTxn.deleteMany({ uploadBatchId: req.params.id });
    res.json({ ok: true, deleted: r.deletedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/** DELETE /api/producttx/all - clear every imported transaction (not the master). */
router.delete('/all', protect, superAdminOnly, async (_req, res) => {
  try {
    const r = await ProductTxn.deleteMany({});
    res.json({ ok: true, deleted: r.deletedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
