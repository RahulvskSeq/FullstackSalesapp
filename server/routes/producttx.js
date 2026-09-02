import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import crypto from 'crypto';
import ProductMaster from '../models/ProductMaster.js';
import ProductTxn from '../models/ProductTxn.js';
import Dealer from '../models/Dealer.js';
import User from '../models/User.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';
import {
  normCategory, normSubCategory, parseErpDate, nameKey, matchSalesman, str as S,
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

    if (!(await ProductMaster.countDocuments())) {
      return res.status(400).json({ error: 'Upload the Product Master first - there is nothing to map products against.' });
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
    const byDealer = new Map();
    for (const d of dealers) { const k = nameKey(d.name); if (k && !byDealer.has(k)) byDealer.set(k, d); }

    const users = await User.find({}).select('name role').lean();

    const batchId = newBatchId();
    const docs = [];
    const lineSeq = new Map();
    const unresolvedProducts = new Map();
    const unmatchedDealers = new Map();
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
      const category = m?.category || '';
      if (!category) {
        const k = `${S(r['Category'])} / ${S(r['Product'])} / ${productCode}`;
        unresolvedProducts.set(k, (unresolvedProducts.get(k) || 0) + 1);
      }

      // Dealer.
      const companyName = S(r['Company Name']) || S(r['Party Name']);
      const d = byDealer.get(nameKey(companyName));
      if (!d && companyName) unmatchedDealers.set(companyName, (unmatchedDealers.get(companyName) || 0) + 1);

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
        categoryType: m?.categoryType || '',
        productType: m?.productType || '',
        category, subCategory: m?.subCategory || '',
        resolved: !!category,
        qty: num(r['Qty']), price: num(r['Price']),
        amount: num(r['Amount']), netTotal: num(r['Net Total']),
        size: S(r['Size']), unit: S(r['Unit']),
        partyName: S(r['Party Name']), companyName, partyRole: S(r['Party Role']),
        dealerId: d?._id || null, dealerName: d?.name || '',
        city: S(r['City']), state: S(r['State']),
        salesPersonRaw, salesman,
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
    };

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
