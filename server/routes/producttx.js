import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import crypto from 'crypto';
import ProductMaster from '../models/ProductMaster.js';
import ProductTxn from '../models/ProductTxn.js';
import Dealer from '../models/Dealer.js';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
import { protect, adminOnly, superAdminOnly, requireFeature } from '../middleware/auth.js';
import Setting from '../models/Setting.js';
import IncentivePeriod from '../models/IncentivePeriod.js';
import { incentiveFor, nextThreshold, billingPersonFor, lookbackMonthsFor,
         bandsFor, canonicalPerson, normaliseConfig, DEFAULT_CONFIG } from '../lib/incentive.js';
import {
  normCategory, normSubCategory, parseErpDate, nameKey, matchSalesman, str as S,
  dealerKey, matchDealer, salesmanOnDate,
} from '../lib/productTaxonomy.js';

const router = express.Router();

// Declared here rather than further down: routes registered above that point
// would otherwise reference it before initialisation and the module would
// fail to load.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 60 * 1024 * 1024 } });

/* The incentive rule is a business decision, so it is stored rather than
 * compiled in. Cached briefly because every incentive request reads it, and
 * the cache is dropped the moment it is saved. */
const INCENTIVE_KEY = 'incentiveConfig';
let cfgCache = null, cfgAt = 0;
async function getIncentiveConfig({ fresh = false } = {}) {
  if (!fresh && cfgCache && Date.now() - cfgAt < 10_000) return cfgCache;
  const row = await Setting.findOne({ key: INCENTIVE_KEY }).lean();
  cfgCache = normaliseConfig(row?.value);
  cfgAt = Date.now();
  return cfgCache;
}

/* ------------------------------------------------------------------ *
 *  GET /api/producttx/incentive?month=YYYY-MM                        *
 *                                                                    *
 *  What each billing person earned on the units they invoiced.       *
 *                                                                    *
 *  Admin only: this is pay. The rule itself is in lib/incentive.js so *
 *  the figure shown and the figure calculated can never drift apart. *
 * ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ *
 *  GET  /api/producttx/incentive-config                              *
 *  PUT  /api/producttx/incentive-config                              *
 *                                                                    *
 *  The thresholds, the rates, and who bills for whom. Admin only —    *
 *  this decides what people are paid.                                *
 * ------------------------------------------------------------------ */
router.get('/incentive-config', protect, adminOnly, async (req, res) => {
  try {
    const config = await getIncentiveConfig({ fresh: true });
    // The salesmen actually present in the data, so the mapping editor can
    // offer real options instead of a free-text box.
    const ids = (await ProductTxn.distinct('salesmanId')).filter(Boolean).sort();
    res.json({ config, defaults: DEFAULT_CONFIG, salesmanIds: ids });
  } catch (e) {
    console.error('[PTX INCENTIVE-CONFIG GET]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.put('/incentive-config', protect, adminOnly, async (req, res) => {
  try {
    // normaliseConfig drops junk and floors tier2 at tier1, so a half-filled
    // form cannot leave the maths in an impossible state.
    const clean = normaliseConfig(req.body);
    await Setting.findOneAndUpdate(
      { key: INCENTIVE_KEY },
      { $set: { value: clean } },
      { upsert: true, new: true },
    );
    cfgCache = clean; cfgAt = Date.now();
    res.json({ ok: true, config: clean });
  } catch (e) {
    console.error('[PTX INCENTIVE-CONFIG PUT]', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ------------------------------------------------------------------ *
 *  POST /api/producttx/incentive/upload                              *
 *                                                                    *
 *  Work the incentive out from an uploaded sheet instead of from the  *
 *  ERP invoice lines.                                                *
 *                                                                    *
 *  Previews by default and only writes when ?commit=1, because the    *
 *  figures decide what people are paid and a wrong column mapping     *
 *  should be seen before it is stored, not after.                    *
 * ------------------------------------------------------------------ */

/** Column names, matched with case and punctuation ignored. */
const PERSON_KEYS = new Set(['createdby','billedby','billingperson','biller','billingby',
                             'invoiceby','billingname','billedperson','person','name']);
const QTY_KEYS    = new Set(['qty','quantity','units','unit','nos','pcs','totalqty']);
const MONTH_KEYS  = new Set(['month','period']);
const DATE_KEYS   = new Set(['date','invoicedate','voucherdate','billdate']);
const VOUCHER_KEYS= new Set(['voucherno','invoiceno','billno','voucher','invoice']);
const norm = k => String(k).toLowerCase().replace(/[^a-z]/g, '');
const pickCol = (headers, keys) => headers.find(h => keys.has(norm(h))) || '';

/** "11-09-2026", a Date, or an Excel serial → "2026-09". */
function monthOf(v) {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date && !isNaN(v)) return v.getFullYear() + '-' + String(v.getMonth() + 1).padStart(2, '0');
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{2})/.exec(s);                        // 2026-09-11 or 2026-09
  if (m) return m[1] + '-' + m[2];
  m = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(s);       // 11-09-2026 (d-m-y)
  if (m) return m[3] + '-' + String(m[2]).padStart(2, '0');
  const n = Number(s);                                        // Excel serial
  if (Number.isFinite(n) && n > 20000 && n < 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
  }
  return '';
}

router.post('/incentive/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const commit = String(req.query.commit || '') === '1';
    const config = await getIncentiveConfig();

    const wb = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!rows.length) return res.status(400).json({ error: 'That sheet has no rows' });

    const headers = Object.keys(rows[0]);
    const cPerson  = pickCol(headers, PERSON_KEYS);
    const cQty     = pickCol(headers, QTY_KEYS);
    const cMonth   = pickCol(headers, MONTH_KEYS);
    const cDate    = pickCol(headers, DATE_KEYS);
    const cVoucher = pickCol(headers, VOUCHER_KEYS);
    if (!cPerson || !cQty) {
      return res.status(400).json({
        error: 'Could not find the columns needed',
        needed: { person: [...PERSON_KEYS].slice(0, 6), qty: [...QTY_KEYS].slice(0, 4) },
        headers,
      });
    }

    // The month may be stated, derived from a date column, or forced by the
    // caller. Whichever it is, every row must agree — a sheet spanning two
    // months would otherwise be filed under one of them silently.
    const forced = /^\d{4}-\d{2}$/.test(String(req.body?.month || '')) ? String(req.body.month) : '';
    const monthTally = new Map();
    const spellings = new Map();
    const usable = [];
    let skipped = 0;
    for (const r of rows) {
      // Fold the spellings together before grouping, or one person splits into
      // two rows and is paid less than their real total — see canonicalPerson.
      const rawName = S(r[cPerson]);
      const person = canonicalPerson(rawName, config);
      const qty = Number(r[cQty]);
      if (!person || !Number.isFinite(qty)) { skipped++; continue; }
      // The row's OWN month, never the forced one: forcing a month says which
      // month to work out, not that every row belongs to it. Stamping `forced`
      // here would make every row match and nothing could be excluded.
      const m = (cMonth ? monthOf(r[cMonth]) : '') || (cDate ? monthOf(r[cDate]) : '');
      if (m) monthTally.set(m, (monthTally.get(m) || 0) + 1);
      if (rawName && rawName !== person) {
        if (!spellings.has(person)) spellings.set(person, new Set());
        spellings.get(person).add(rawName);
      }
      usable.push({ person, qty, m, voucher: cVoucher ? S(r[cVoucher]) : '' });
    }

    const monthsSeen = [...monthTally.entries()].sort((a, b) => b[1] - a[1]);
    const month = forced || (monthsSeen[0]?.[0] || '');
    if (!month) {
      return res.status(400).json({
        error: 'Could not tell which month this sheet is for — add a Month or Date column, or pick one before uploading',
        headers,
      });
    }

    // Only this month's rows count towards this month's incentive. An export
    // that runs over a month boundary is normal — the last file carried 113
    // August rows alongside September's — and adding those units to September
    // would pay people twice for the same sales. Rows whose month cannot be
    // read at all are kept, since dropping them would silently lose units.
    const byPerson = new Map();
    let otherMonthRows = 0, otherMonthUnits = 0;
    for (const r of usable) {
      if (r.m && r.m !== month) { otherMonthRows++; otherMonthUnits += r.qty; continue; }
      const e = byPerson.get(r.person) || { person: r.person, units: 0, lines: 0, invoices: new Set() };
      e.units += r.qty;
      e.lines++;
      if (r.voucher) e.invoices.add(r.voucher);
      byPerson.set(r.person, e);
    }

    const people = [...byPerson.values()]
      .map(e => ({ person: e.person, units: Math.round(e.units), lines: e.lines, invoices: e.invoices.size }))
      .sort((a, b) => b.units - a.units);

    // What each person earns, using the same history-based bar the rest of the
    // section uses, so an uploaded month is rated exactly like an ERP one.
    const lookback = lookbackMonthsFor(month, config);
    const priorPeriods = await IncentivePeriod.find({ month: { $in: lookback } }).lean();
    const priorByPerson = new Map();
    for (const p of priorPeriods) {
      for (const r of (p.rows || [])) {
        if (!priorByPerson.has(r.person)) priorByPerson.set(r.person, []);
        priorByPerson.get(r.person).push(r.units || 0);
      }
    }
    const priced = people.map(p => {
      const past = priorByPerson.get(p.person) || [];
      const withData = past.filter(u => u > 0);
      const computed = withData.length ? Math.round(withData.reduce((a, b) => a + b, 0) / withData.length) : 0;
      const opening = Number(config.openingAverage?.[p.person] || 0);
      const average = withData.length ? computed : opening;
      return {
        ...p,
        averageSource: withData.length ? 'history' : (opening > 0 ? 'opening' : 'none'),
        monthsOfHistory: withData.length,
        ...incentiveFor(p.units, average, config),
        next: nextThreshold(p.units, average, config),
      };
    });

    const existing = await IncentivePeriod.findOne({ month }).lean();
    const payload = {
      month, commit,
      columns: { person: cPerson, qty: cQty, month: cMonth || null, date: cDate || null, voucher: cVoucher || null },
      headers,
      rowsRead: rows.length,
      skipped,
      // Which raw spellings were folded into each name. An unfamiliar one
      // showing up here is the cue to add an alias, before the figures are
      // stored rather than after somebody has been paid on them.
      spellings: [...spellings].map(([name, raw]) => ({ name, raw: [...raw] })),
      // A sheet covering more than one month is worth seeing before it is filed.
      monthsSeen: monthsSeen.map(([m, n]) => ({ month: m, rows: n })),
      // Rows left out because they belong to a different month.
      excluded: { rows: otherMonthRows, units: Math.round(otherMonthUnits) },
      replacing: existing ? { rows: existing.rows?.length || 0, uploadedAt: existing.updatedAt } : null,
      people: priced,
      totals: {
        people: priced.length,
        units:  priced.reduce((a, p) => a + p.units, 0),
        amount: Math.round(priced.reduce((a, p) => a + p.amount, 0) * 100) / 100,
        points: priced.reduce((a, p) => a + p.points, 0),
      },
    };

    if (!commit) return res.json({ ...payload, preview: true });

    await IncentivePeriod.findOneAndUpdate(
      { month },
      { $set: {
          month,
          rows: people,
          fileName: req.file.originalname || '',
          uploadedBy: req.user?.id || '',
          replaced: existing?.rows || [],
      } },
      { upsert: true, new: true },
    );
    res.json({ ...payload, saved: true });
  } catch (e) {
    console.error('[PTX INCENTIVE UPLOAD]', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* Months that came from an uploaded sheet, so the UI can say which source a
 * month is using and offer to remove one. */
router.get('/incentive/periods', protect, adminOnly, async (req, res) => {
  try {
    const rows = await IncentivePeriod.find({}, { month: 1, fileName: 1, uploadedBy: 1, rows: 1, updatedAt: 1 })
      .sort({ month: -1 }).lean();
    res.json({ periods: rows.map(r => ({
      month: r.month, fileName: r.fileName, uploadedBy: r.uploadedBy,
      people: (r.rows || []).length,
      units: (r.rows || []).reduce((a, x) => a + (x.units || 0), 0),
      updatedAt: r.updatedAt,
    })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/incentive/periods/:month', protect, adminOnly, async (req, res) => {
  try {
    const r = await IncentivePeriod.deleteOne({ month: String(req.params.month) });
    res.json({ ok: true, deleted: r.deletedCount || 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/incentive', protect, adminOnly, async (req, res) => {
  try {
    const config = await getIncentiveConfig();

    const months = (await ProductTxn.distinct('month')).filter(Boolean).sort().reverse();
    const month = /^\d{4}-\d{2}$/.test(String(req.query.month || ''))
      ? String(req.query.month)
      : (months[0] || '');
    if (!month) {
      return res.json({ month: '', months: [], config, people: [], unassigned: { units: 0, lines: 0, salesmen: [] }, totals: { people: 0, units: 0, amount: 0, points: 0 } });
    }

    // Every month that feeds a decision: the one being scored plus the
    // lookback window the average is taken over. Fetched in one pass so a
    // person's history and their current figure come from the same read.
    const lookback = lookbackMonthsFor(month, config);
    const wanted = [...new Set([month, ...lookback])];

    const raw = await ProductTxn.aggregate([
      { $match: { month: { $in: wanted } } },
      { $group: {
          _id: {
            month: '$month',
            billedBy: { $trim: { input: { $ifNull: ['$billedBy', ''] } } },
            salesmanId: { $ifNull: ['$salesmanId', ''] },
          },
          units:    { $sum: '$qty' },
          lines:    { $sum: 1 },
          invoices: { $addToSet: '$voucherNo' },
      } },
    ]);

    // Fold each bucket into its billing person. One person may cover several
    // reps, so their units combine before any rate is worked out.
    const now = new Map();          // person → { units, lines, invoices, reps }
    const history = new Map();      // person → Map(month → units)
    const unmapped = new Map();
    for (const g of raw) {
      const person = billingPersonFor(
        { billedBy: g._id.billedBy, salesmanId: g._id.salesmanId }, config);
      const isScored = g._id.month === month;
      if (!person) {
        if (!isScored) continue;    // only the scored month's orphans matter
        const sid = g._id.salesmanId || '(none)';
        const u = unmapped.get(sid) || { salesmanId: sid, units: 0, lines: 0 };
        u.units += g.units || 0; u.lines += g.lines || 0;
        unmapped.set(sid, u);
        continue;
      }
      if (!history.has(person)) history.set(person, new Map());
      const h = history.get(person);
      h.set(g._id.month, (h.get(g._id.month) || 0) + (g.units || 0));
      if (!isScored) continue;
      const e = now.get(person) || { units: 0, lines: 0, invoices: new Set(), reps: new Set() };
      e.units += g.units || 0;
      e.lines += g.lines || 0;
      for (const v of (g.invoices || [])) if (v) e.invoices.add(v);
      if (g._id.salesmanId) e.reps.add(g._id.salesmanId);
      now.set(person, e);
    }

    const people = [];
    for (const [name, e] of now) {
      const h = history.get(name) || new Map();
      // Average over the months that actually have data, not over all six —
      // dividing a newcomer's two months by six would invent a low bar and
      // pay them the top rate for ordinary volume.
      const past = lookback.map(m => ({ month: m, units: h.get(m) || 0 }));
      const withData = past.filter(p => p.units > 0);
      // Real history wins; the opening figure is only a stand-in until there
      // is some. Recorded either way so the UI can say which one is in play.
      const computed = withData.length
        ? Math.round(withData.reduce((a, p) => a + p.units, 0) / withData.length)
        : 0;
      const opening = Number(config.openingAverage?.[name] || 0);
      const average = withData.length ? computed : opening;
      const averageSource = withData.length ? 'history' : (opening > 0 ? 'opening' : 'none');
      const calc = incentiveFor(e.units, average, config);
      people.push({
        name,
        units: e.units,
        lines: e.lines,
        invoices: e.invoices.size,
        reps: [...e.reps].sort(),
        rawAverage: average,
        averageSource,
        openingAverage: opening,
        monthsOfHistory: withData.length,
        history: past,
        ...calc,
        next: nextThreshold(e.units, average, config),
      });
    }
    people.sort((a, b) => b.amount - a.amount);

    res.json({
      month, months, lookback, config,
      people,
      unassigned: {
        units: [...unmapped.values()].reduce((a, u) => a + u.units, 0),
        lines: [...unmapped.values()].reduce((a, u) => a + u.lines, 0),
        salesmen: [...unmapped.values()].sort((a, b) => b.units - a.units),
      },
      totals: {
        people: people.length,
        units:  people.reduce((a, p) => a + p.units, 0),
        amount: Math.round(people.reduce((a, p) => a + p.amount, 0) * 100) / 100,
        points: people.reduce((a, p) => a + p.points, 0),
      },
    });
  } catch (e) {
    console.error('[PTX INCENTIVE]', e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * The "Billed By" column, however it happens to be spelled.
 *
 * Exports label this inconsistently — Billed By, Billing Person, Biller,
 * Invoice By. Matching on a key with case and punctuation stripped means a new
 * spelling does not quietly import a whole sheet with no biller on it, which
 * would show as everyone earning nothing.
 */
const BILLED_BY_KEYS = new Set([
  'billedby','billingperson','biller','billingby','invoiceby','billingname','billedperson',
]);
const billedByOf = (row) => {
  for (const [k, v] of Object.entries(row || {})) {
    if (BILLED_BY_KEYS.has(String(k).toLowerCase().replace(/[^a-z]/g, ''))) {
      const t = S(v);
      if (t) return t;
    }
  }
  return '';
};

/* ------------------------------------------------------------------ *
 *  GET /api/producttx/last-upload                                    *
 *                                                                    *
 *  When the ERP sheet was last brought in.                           *
 *                                                                    *
 *  The Overview stamp used to read the newest dealer write, which     *
 *  moves whenever anyone edits a zone or a credit limit — so it       *
 *  answered "when did someone touch a dealer", not "how fresh is the  *
 *  sales data". Those are different questions and the second is the   *
 *  one that matters on a sales dashboard.                            *
 *                                                                    *
 *  Sorted on updatedAt, not createdAt: re-uploading a day's sheet     *
 *  upserts the same lines, which touches updatedAt but leaves         *
 *  createdAt at the original import.                                 *
 * ------------------------------------------------------------------ */
router.get('/last-upload', protect, async (req, res) => {
  try {
    const latest = await ProductTxn
      .findOne({}, { updatedAt: 1, createdAt: 1, uploadBatchId: 1, month: 1 })
      .sort({ updatedAt: -1 })
      .lean();
    if (!latest) return res.json({ lastUploadAt: null });
    // How much arrived in that same batch, so the stamp can say what landed
    // and not only when.
    const lines = latest.uploadBatchId
      ? await ProductTxn.countDocuments({ uploadBatchId: latest.uploadBatchId })
      : 0;
    res.json({
      lastUploadAt: latest.updatedAt || latest.createdAt || null,
      batchId: latest.uploadBatchId || '',
      lines,
      month: latest.month || '',
    });
  } catch (e) {
    console.error('[PTX LAST-UPLOAD]', e.message);
    res.status(500).json({ error: e.message });
  }
});

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
router.post('/master/upload', protect, adminOnly, requireFeature('uploadData'), upload.single('file'), async (req, res) => {
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

      const parentProduct = S(r['Parent Product']);
      docs.push({
        productId,
        pdId: S(r['Pd-Id']),
        parentProduct,
        // A blank Parent Product cannot be shown to be a child, so it counts
        // as a parent: never hide something we cannot positively classify.
        isParent: !parentProduct || parentProduct === productId,
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
router.post('/upload', protect, adminOnly, requireFeature('uploadData'), upload.single('file'), async (req, res) => {
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
      .select('productId pdId code name brand parentProduct isParent categoryType productType category subCategory').lean();
    const byPid = new Map(), byPdid = new Map(), byCode = new Map(), byName = new Map();
    for (const m of masters) {
      if (m.productId) byPid.set(m.productId, m);
      if (m.pdId) byPdid.set(m.pdId, m);
      if (m.code && !byCode.has(m.code)) byCode.set(m.code, m);
      // A private-label listing is found by the name printed on the invoice.
      const nm = S(m.name);
      if (nm) { if (!byName.has(nm)) byName.set(nm, []); byName.get(nm).push(m); }
    }

    /**
     * Which catalogue did this line actually sell FROM?
     *
     * The ERP invoice references the PARENT product's id and prints the
     * PARENT's category, but names the line by the dealer's private label —
     * "KAR 95" rather than "VN 9037 ZF VNSTX". That label is itself a child
     * row in the master, carrying its own category (KARA HOME DECOR) and a
     * parentProduct pointing back at the parent.
     *
     * So when the printed name resolves to a child of THIS line's product,
     * the sale belongs to the child's catalogue, not the parent's. Anything
     * ambiguous — no match, several matches, or a child whose own category is
     * a comma-joined list — falls back to the sheet, because a wrong
     * catalogue is worse than a coarse one.
     */
    const childCatalogueFor = (printedName, parentPid) => {
      const rows = byName.get(S(printedName));
      if (!rows || !rows.length) return '';
      const pick = rows.find(r => r.parentProduct && r.parentProduct === parentPid)
                || (rows.length === 1 ? rows[0] : null);
      if (!pick || pick.isParent) return '';
      const b = S(pick.brand);
      return (!b || b.includes(',')) ? '' : b;
    };

    const dealers = await Dealer.find({}).select('name salesman salesmanHistory').lean();
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
        // Keep the party's full details, not just its name: everything needed
        // to create the dealer is on this row, so the user should not have to
        // re-key it from the sheet.
        const u = unmatchedDealers.get(companyName) || {
          name: companyName,
          city: S(r['City']) || S(r['Buyer City']),
          state: S(r['State']) || S(r['Buyer State']),
          pincode: S(r['Buyer Pin Code']),
          address: S(r['Buyer Address']),
          mobile: S(r['Mobile No.']) || S(r['Buyer Contact']),
          gst: S(r['Buyer Gstno']),
          salesPersonRaw: S(r['Sales Person']),
          billedBy: billedByOf(r),
          closest: dm.suggestion || '',
          score: Math.round((dm.score || 0) * 100),
          lines: 0, qty: 0,
        };
        u.lines += 1; u.qty += num(r['Qty']);
        unmatchedDealers.set(companyName, u);
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
        // The sheet's Category is the PARENT catalogue. If the printed name
        // resolves to a child listing of this same product, credit the child's
        // catalogue instead — that is the catalogue the dealer actually bought
        // from. Falls back to the sheet whenever that cannot be established.
        brand: childCatalogueFor(S(r['Product']), productId)
             || S(r['Category']) || m?.brand || '',
        parentBrand: S(r['Category']) || '',
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
        // Credit the line to whoever owned the dealer ON THE INVOICE DATE, not
        // to the current owner — otherwise reassigning a dealer silently moves
        // every past sale with it.
        salesmanId: (d ? salesmanOnDate(d, dateStr) : '') || userIdByName.get(salesman) || '',
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
      unmatchedDealers: [...unmatchedDealers.values()]
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 200),
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

/**
 * POST /api/producttx/create-dealers
 * Body: { dealers: [{ name, city, state, pincode, address, mobile, gst,
 *                     salesPersonRaw }] }
 *
 * Creates dealers for parties the import could not match. Everything comes
 * from the transaction sheet itself, so nothing is re-keyed by hand.
 *
 * Re-checks each name against the live list before inserting: the preview
 * may be minutes old, and creating a duplicate of an existing dealer is
 * exactly the problem this whole feature exists to avoid.
 */
router.post('/create-dealers', protect, adminOnly, async (req, res) => {
  try {
    const wanted = Array.isArray(req.body?.dealers) ? req.body.dealers : [];
    if (!wanted.length) return res.status(400).json({ error: 'No dealers supplied' });

    const existing = await Dealer.find({}).select('name salesman').lean();
    const index = new Map(), list = [];
    for (const d of existing) {
      const k = dealerKey(d.name);
      if (!k) continue;
      if (!index.has(k)) index.set(k, d);
      list.push([k, d]);
    }
    const users = await User.find({}).select('id name role').lean();
    const memo = new Map();

    const created = [], skipped = [];
    for (const w of wanted) {
      const name = S(w.name);
      if (!name) continue;

      // Guard against a stale preview.
      const hit = matchDealer(name, index, list, memo);
      if (hit.dealer) { skipped.push({ name, reason: `already exists as "${hit.dealer.name}"` }); continue; }

      // Salesman is required by the schema. Fall back to 'none', which is an
      // existing convention in this data, rather than refusing the row.
      const matched = matchSalesman(S(w.salesPersonRaw), users);
      const salesman = users.find(u => u.name === matched)?.id || 'none';

      const doc = await Dealer.create({
        name,
        salesman,
        city: S(w.city),
        state: S(w.state),
        pincode: S(w.pincode),
        address: S(w.address),
        status: 'ACTIVE',
        source: 'ptx-import',
      });
      created.push({ name: doc.name, salesman: doc.salesman, city: doc.city });

      // Keep the index current so two spellings in one batch cannot both insert.
      const k = dealerKey(doc.name);
      if (k) { index.set(k, doc); list.push([k, doc]); memo.clear(); }
    }

    res.json({ ok: true, created: created.length, skipped: skipped.length, createdList: created, skippedList: skipped });
  } catch (e) {
    console.error('[producttx/create-dealers]', e);
    res.status(500).json({ error: e.message });
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

/**
 * GET /api/producttx/catalogue-detail?brand=VN-TEX&month=2026-09
 *
 * Everything behind one catalogue card: the products actually invoiced (with
 * names and codes), the dealers who bought them, the salesmen, and the daily
 * split. Sale rows only carry category and sub-category, so the product names
 * can only come from the invoice lines — this reads ProductTxn.
 *
 * Honours the same salesman scoping as every other endpoint here.
 */
router.get('/catalogue-detail', protect, async (req, res) => {
  try {
    const brand = S(req.query.brand);
    if (!brand) return res.status(400).json({ error: 'brand required' });

    const match = { ...(await scopeFor(req)), brand };
    if (S(req.query.month)) match.month = S(req.query.month);
    if (S(req.query.from) || S(req.query.to)) {
      match.dateStr = {};
      if (S(req.query.from)) match.dateStr.$gte = S(req.query.from);
      if (S(req.query.to)) match.dateStr.$lte = S(req.query.to);
    }

    const g = (id, extra = {}) => ([
      { $match: match },
      { $group: { _id: id, qty: { $sum: '$qty' }, amount: { $sum: '$amount' }, lines: { $sum: 1 }, ...extra } },
      { $sort: { qty: -1 } },
      { $limit: 500 },
    ]);

    const [products, dealers, salesmen, days, cats, totals] = await Promise.all([
      // Group products by productId, NOT by the name on the invoice.
      // The ERP names each line by the DEALER'S private-label name, so one
      // product reaches several dealers under several names — "KAR 95" and
      // "DST 695" are both (9037 ZF) = VN 9037 ZF VNSTX. Grouping by name
      // splits one product into several rows and inflates the product count.
      // The canonical name comes from the master; the invoice labels are kept
      // as aliases so a salesman can still find the name they know.
      ProductTxn.aggregate([
        { $match: match },
        { $group: {
            _id: '$productId',
            qty: { $sum: '$qty' }, amount: { $sum: '$amount' }, lines: { $sum: 1 },
            buyers: { $addToSet: '$dealerName' },
            aliases: { $addToSet: '$productName' },
            code: { $first: '$productCode' },
            category: { $first: '$category' },
            subCategory: { $first: '$subCategory' },
        } },
        { $lookup: { from: 'productmasters', localField: '_id',
                     foreignField: 'productId', as: 'm' } },
        { $sort: { qty: -1 } },
        { $limit: 500 },
      ]),
      ProductTxn.aggregate(g({ dealer: '$dealerName', salesman: '$salesman' })),
      ProductTxn.aggregate(g({ salesman: '$salesman' }, { buyers: { $addToSet: '$dealerName' } })),
      ProductTxn.aggregate([
        { $match: match },
        { $group: { _id: '$dateStr', qty: { $sum: '$qty' }, amount: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),
      ProductTxn.aggregate(g({ category: '$category', subCategory: '$subCategory' })),
      ProductTxn.aggregate([
        { $match: match },
        { $group: {
            _id: null, qty: { $sum: '$qty' }, amount: { $sum: '$amount' }, lines: { $sum: 1 },
            vouchers: { $addToSet: '$voucherNo' }, buyers: { $addToSet: '$dealerName' },
        } },
        { $project: { _id: 0, qty: 1, amount: 1, lines: 1,
                      vouchers: { $size: '$vouchers' },
                      dealers: { $size: { $setDifference: ['$buyers', ['']] } } } },
      ]),
    ]);

    res.json({
      ok: true, brand,
      totals: totals[0] || { qty: 0, amount: 0, lines: 0, vouchers: 0, dealers: 0 },
      products: products.map(p => {
        const m = (p.m || [])[0];
        const canonical = m?.name || (p.aliases || [])[0] || '';
        // Only surface aliases that differ from the canonical name.
        const aliases = (p.aliases || []).filter(a => a && a !== canonical);
        return {
          name: canonical, code: m?.code || p.code,
          category: p.category, subCategory: p.subCategory,
          qty: p.qty, amount: p.amount, lines: p.lines,
          dealers: (p.buyers || []).filter(Boolean).length,
          aliases,
        };
      }),
      dealers: dealers.map(d => ({ dealer: d._id.dealer, salesman: d._id.salesman, qty: d.qty, amount: d.amount, lines: d.lines })),
      salesmen: salesmen.map(s => ({ salesman: s._id.salesman, qty: s.qty, amount: s.amount,
                                     dealers: (s.buyers || []).filter(Boolean).length })),
      categories: cats.map(c => ({ category: c._id.category, subCategory: c._id.subCategory, qty: c.qty, amount: c.amount })),
      days: days.map(d => ({ date: d._id, qty: d.qty, amount: d.amount })),
    });
  } catch (e) {
    console.error('[producttx/catalogue-detail]', e);
    res.status(500).json({ error: e.message });
  }
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
          // salesmanId is part of the KEY, not a $first pick. A dealer
          // reassigned mid-month has lines under both owners; grouping on it
          // splits the month between them instead of handing the whole month
          // to whichever line the database happened to return first.
          _id: {
            dealerName: '$dealerName', category: '$category',
            subCategory: '$subCategory', brand: '$brand',
            salesmanId: '$salesmanId',
          },
          qty: { $sum: '$qty' },
          dealerId: { $first: '$dealerId' },
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
        salesmanId: r._id.salesmanId || '',
      })),
    });
  }
  return out;
}

/**
 * Apply the sales sync for a set of months. Shared by the standalone
 * /sync-sales route and the one-step upload, so both behave identically.
 */
// '2026-09' → 'Sep-26', the key dealer.monthlyData is stored under.
const ymToMonthLabel = (ym) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ym || ''));
  if (!m) return '';
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return MON[+m[2] - 1] + '-' + m[1].slice(2);
};

async function applySalesSync(monthList, byUser) {
  const months = await buildSalesSync(monthList);
  const batchId = newBatchId();
  let deleted = 0, inserted = 0, achievedWritten = 0;
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

    // Mirror the month total onto the dealer record.
    //
    // Sale rows are the truth, but the Monthly Entry grid and the download
    // template both read dealer.monthlyData[label].achieved, and nothing was
    // writing it — so a month imported from the ERP showed 45 units against
    // 3,843 actually sold. Roll the rebuilt rows up per dealer and store the
    // total under the same label the app reads.
    //
    // Only dealers that HAVE rows this month are written. A dealer with an
    // achieved typed by hand in Monthly Entry and no ERP lines keeps it —
    // zeroing those would silently destroy manual entry.
    const label = ymToMonthLabel(m.month);
    if (label) {
      const totals = await Sale.aggregate([
        { $match: { month: m.month } },
        { $group: { _id: '$dealerName', qty: { $sum: '$qty' } } },
      ]);
      for (let i = 0; i < totals.length; i += 400) {
        const ops = totals.slice(i, i + 400)
          .filter(t => t._id)
          .map(t => ({
            updateOne: {
              filter: { name: t._id },
              update: { $set: { ['monthlyData.' + label + '.achieved']: t.qty } },
            },
          }));
        if (ops.length) await Dealer.bulkWrite(ops, { ordered: false });
      }
      achievedWritten += totals.length;
    }
  }
  return { batchId, deleted, inserted, achievedWritten, months: months.map(({ rows, ...m }) => m) };
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
router.post('/sync-sales', protect, adminOnly, requireFeature('uploadData'), async (req, res) => {
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
router.delete('/batch/:id', protect, superAdminOnly, requireFeature('wipeData'), async (req, res) => {
  try {
    const r = await ProductTxn.deleteMany({ uploadBatchId: req.params.id });
    res.json({ ok: true, deleted: r.deletedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/** DELETE /api/producttx/all - clear every imported transaction (not the master). */
router.delete('/all', protect, superAdminOnly, requireFeature('wipeData'), async (_req, res) => {
  try {
    const r = await ProductTxn.deleteMany({});
    res.json({ ok: true, deleted: r.deletedCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
