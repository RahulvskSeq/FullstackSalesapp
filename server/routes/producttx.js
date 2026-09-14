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
         bandsFor, canonicalPerson, onRoster, personFor, normaliseConfig,
         DEFAULT_CONFIG } from '../lib/incentive.js';
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
/* ------------------------------------------------------------------ *
 *  GET /api/producttx/incentive/dashboard?month=YYYY-MM                *
 *                                                                     *
 *  Everything the incentive home screen shows, in one call: the        *
 *  month's totals, the same month last time for comparison, a six-     *
 *  month trend and the split across the three bands.                   *
 * ------------------------------------------------------------------ */
router.get('/incentive/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const config = await getIncentiveConfig();
    const months = await allIncentiveMonths();
    // A date range answers "what happened between these dates". The bands and
    // the target still come from the month the range ends in — the rule is
    // monthly, and pretending a five-day window has its own target would
    // invent a bar nobody agreed to.
    const isDay = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
    const from = isDay(req.query.from) ? String(req.query.from) : '';
    const to   = isDay(req.query.to)   ? String(req.query.to)   : '';
    const ranged = !!(from && to && from <= to);

    const month = ranged
      ? to.slice(0, 7)
      : (/^\d{4}-\d{2}$/.test(String(req.query.month || ''))
          ? String(req.query.month) : (months[0] || ''));
    if (!month) {
      return res.json({ month: '', months: [], config, empty: true,
        people: [], trend: [], bands: [], totals: { people: 0, units: 0, amount: 0, points: 0 } });
    }

    // Six months of trend, each scored against its own lookback window. All
    // the months any of that needs are fetched once.
    const trendMonths = monthsEndingAt(month, 6);
    const needed = new Set();
    for (const m of trendMonths) {
      needed.add(m);
      for (const lm of lookbackMonthsFor(m, config)) needed.add(lm);
    }
    const { byMonth, source, unassigned, offRoster } = await unitsByMonth([...needed], config);

    // In range mode the scored month's units are replaced by the range's, so
    // the history behind the target is untouched but the figure on screen is
    // the window the user asked for.
    let rangeInfo = null;
    if (ranged) {
      const r = await unitsBetween(from, to, config);
      rangeInfo = { from, to, days: r.days.length, missingMonths: r.missingMonths };
      const filtered = new Map();
      for (const [person, e] of r.byPerson) {
        if (!onRoster(person, config)) continue;
        filtered.set(person, e);
      }
      byMonth.set(month, filtered);
    }

    const scored = new Map(trendMonths.map(m => [m, scoreMonth(m, byMonth, config)]));
    const cur  = scored.get(month);
    const prevMonth = trendMonths[trendMonths.length - 2] || '';
    const prev = prevMonth ? scored.get(prevMonth) : null;

    // Percentage change, but only where there is something to compare against:
    // "+100% from nothing" reads as growth when it is really a first month.
    const delta = (now, before) =>
      (before > 0) ? Math.round(((now - before) / before) * 1000) / 10 : null;

    const bandOrder = ['base', 'mid', 'top'];
    const bands = bandOrder.map(b => {
      const inBand = cur.people.filter(p => p.band === b);
      return {
        band: b,
        people: inBand.length,
        units:  inBand.reduce((a, p) => a + p.units, 0),
        amount: Math.round(inBand.reduce((a, p) => a + p.amount, 0) * 100) / 100,
        points: inBand.reduce((a, p) => a + p.points, 0),
      };
    });

    const orphans = unassigned.filter(u => u.month === month);

    res.json({
      month, months, config,
      // Present only when a date range was asked for, so the UI can say what
      // window the figures cover instead of implying a whole month.
      range: rangeInfo,
      source: source.get(month) || 'erp',
      totals: cur.totals,
      previous: prev ? { month: prevMonth, ...prev.totals } : null,
      change: prev ? {
        units:  delta(cur.totals.units,  prev.totals.units),
        amount: delta(cur.totals.amount, prev.totals.amount),
        points: delta(cur.totals.points, prev.totals.points),
        people: delta(cur.totals.people, prev.totals.people),
      } : null,
      trend: trendMonths.map(m => ({
        month: m,
        source: source.get(m) || 'erp',
        ...scored.get(m).totals,
      })),
      bands,
      people: cur.people,
      // People still measured against nothing pay the top rate on every unit,
      // which is the single biggest thing that can be wrong on this screen.
      noHistory: cur.people.filter(p => p.averageSource === 'none').map(p => p.name),
      unassigned: {
        units: orphans.reduce((a, u) => a + u.units, 0),
        salesmen: orphans.sort((a, b) => b.units - a.units),
      },
      // Billed under a name that is not on the roster: stored, not paid.
      offRoster: offRoster.filter(u => u.month === month).sort((a, b) => b.units - a.units),
      roster: config.roster,
    });
  } catch (e) {
    console.error('[PTX INCENTIVE DASHBOARD]', e.message);
    res.status(500).json({ error: e.message });
  }
});

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

/**
 * Units per billing person, for each month asked for.
 *
 * An uploaded sheet wins over the ERP invoice lines for that month. The sheet
 * is what the incentive was agreed on, and once a month has been uploaded the
 * ERP copy is at best a second opinion — having two numbers for one month is
 * how people end up paid on the wrong one. Months with no upload fall back to
 * ProductTxn, so months imported before any of this still work.
 *
 * Returns byMonth: month -> (person -> {units, lines, invoices, reps}).
 */
async function unitsByMonth(months, config) {
  const byMonth = new Map();
  const source  = new Map();
  const unassigned = new Map();
  // Units billed under a name that is not on the roster. Kept and reported,
  // never quietly discarded — a name missing from the roster is usually a
  // spelling to add, not units that should vanish.
  const offRoster = new Map();
  const note = (month, person, units, lines) => {
    const k = month + '|' + person;
    const e = offRoster.get(k) || { month, person, units: 0, lines: 0 };
    e.units += units || 0; e.lines += lines || 0;
    offRoster.set(k, e);
  };

  const uploaded = await IncentivePeriod.find({ month: { $in: months } }).lean();
  for (const p of uploaded) {
    const m = new Map();
    for (const r of (p.rows || [])) {
      const person = canonicalPerson(r.person, config);
      if (!person) continue;
      if (!onRoster(person, config)) { note(p.month, person, r.units, r.lines); continue; }
      const e = m.get(person) || { units: 0, lines: 0, invoices: 0, reps: new Set() };
      e.units    += r.units || 0;
      e.lines    += r.lines || 0;
      e.invoices += r.invoices || 0;
      m.set(person, e);
    }
    byMonth.set(p.month, m);
    source.set(p.month, 'upload');
  }

  const missing = months.filter(m => !byMonth.has(m));
  if (missing.length) {
    const raw = await ProductTxn.aggregate([
      { $match: { month: { $in: missing } } },
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
    for (const m of missing) { byMonth.set(m, new Map()); source.set(m, 'erp'); }
    for (const g of raw) {
      const person = canonicalPerson(
        billingPersonFor({ billedBy: g._id.billedBy, salesmanId: g._id.salesmanId }, config), config);
      if (!person) {
        const key = g._id.month + '|' + (g._id.salesmanId || '(none)');
        const u = unassigned.get(key) ||
          { month: g._id.month, salesmanId: g._id.salesmanId || '(none)', units: 0, lines: 0 };
        u.units += g.units || 0; u.lines += g.lines || 0;
        unassigned.set(key, u);
        continue;
      }
      if (!onRoster(person, config)) { note(g._id.month, person, g.units, g.lines); continue; }
      const m = byMonth.get(g._id.month);
      const e = m.get(person) || { units: 0, lines: 0, invoices: 0, reps: new Set() };
      e.units    += g.units || 0;
      e.lines    += g.lines || 0;
      e.invoices += (g.invoices || []).filter(Boolean).length;
      if (g._id.salesmanId) e.reps.add(g._id.salesmanId);
      m.set(person, e);
    }
  }
  return { byMonth, source, unassigned: [...unassigned.values()], offRoster: [...offRoster.values()] };
}

/**
 * Score one month: what each person earned, measured against their own recent
 * average. Pure — everything it needs is already in byMonth, so the same read
 * serves the month on screen and the five behind it in the trend.
 */
function scoreMonth(month, byMonth, config) {
  const cur = byMonth.get(month) || new Map();
  const lookback = lookbackMonthsFor(month, config);
  const people = [];
  for (const [name, e] of cur) {
    // Average over the months that actually have data, not over all six —
    // dividing a newcomer's two months by six would invent a low bar and pay
    // them the top rate for ordinary volume.
    const past = lookback.map(lm => ({ month: lm, units: byMonth.get(lm)?.get(name)?.units || 0 }));
    const withData = past.filter(p => p.units > 0);
    const computed = withData.length
      ? Math.round(withData.reduce((a, p) => a + p.units, 0) / withData.length) : 0;
    const opening = Number(config.openingAverage?.[name] || 0);
    const average = withData.length ? computed : opening;
    const who = personFor(name, config);
    people.push({
      // `name` stays the stored key so nothing downstream has to change;
      // display and code are what a human should read.
      name,
      display: who?.name || name,
      code: who?.code || '',
      units: e.units,
      lines: e.lines,
      invoices: e.invoices,
      reps: [...(e.reps || [])].sort(),
      rawAverage: average,
      averageSource: withData.length ? 'history' : (opening > 0 ? 'opening' : 'none'),
      openingAverage: opening,
      monthsOfHistory: withData.length,
      history: past,
      ...incentiveFor(e.units, average, config),
      next: nextThreshold(e.units, average, config),
    });
  }
  people.sort((a, b) => b.amount - a.amount);
  return {
    people,
    totals: {
      people: people.length,
      units:  people.reduce((a, p) => a + p.units, 0),
      // amount/points are net of the deduction; the gross and the deduction
      // are alongside so the screens can show the three lines rather than
      // leaving a reader to work out the difference.
      grossAmount: Math.round(people.reduce((a, p) => a + p.grossAmount, 0) * 100) / 100,
      deduction:   Math.round(people.reduce((a, p) => a + p.deduction, 0) * 100) / 100,
      amount:      Math.round(people.reduce((a, p) => a + p.amount, 0) * 100) / 100,
      grossPoints: people.reduce((a, p) => a + p.grossPoints, 0),
      points:      people.reduce((a, p) => a + p.points, 0),
    },
  };
}

/**
 * Units per person billed between two dates, from the stored day detail.
 *
 * The month view answers "what has this month earned"; this answers "what
 * happened between these two dates", which is the question a daily upload
 * raises. Only uploaded months have day detail — ERP-only months are month
 * totals with no breakdown — so the caller is told which months could not be
 * answered rather than being shown a silent zero.
 */
async function unitsBetween(from, to, config) {
  const fromM = from.slice(0, 7), toM = to.slice(0, 7);
  const docs = await IncentivePeriod.find({ month: { $gte: fromM, $lte: toM } }).lean();
  const byPerson = new Map();
  const daysSeen = new Set();
  const covered = new Set();
  for (const d of docs) {
    covered.add(d.month);
    for (const r of (d.rows || [])) {
      const person = canonicalPerson(r.person, config);
      if (!person) continue;
      for (const day of (r.days || [])) {
        if (!day.day || day.day < from || day.day > to) continue;
        daysSeen.add(day.day);
        const e = byPerson.get(person) || { units: 0, lines: 0, invoices: 0, reps: new Set() };
        e.units    += day.units || 0;
        e.lines    += day.lines || 0;
        e.invoices += day.invoices || 0;
        byPerson.set(person, e);
      }
    }
  }
  // Months inside the range that have no uploaded day detail at all.
  const wanted = [];
  for (let y = +fromM.slice(0, 4), m = +fromM.slice(5); ; m++) {
    if (m > 12) { m = 1; y++; }
    const k = y + '-' + String(m).padStart(2, '0');
    wanted.push(k);
    if (k >= toM) break;
    if (wanted.length > 60) break;
  }
  return {
    byPerson,
    days: [...daysSeen].sort(),
    missingMonths: wanted.filter(m => !covered.has(m)),
  };
}

/** Every month there are figures for, uploaded or imported, newest first. */
async function allIncentiveMonths() {
  const [up, erp] = await Promise.all([
    IncentivePeriod.distinct('month'),
    ProductTxn.distinct('month'),
  ]);
  return [...new Set([...up, ...erp])].filter(Boolean).sort().reverse();
}

/** The n months ending at `month`, oldest first. */
function monthsEndingAt(month, n) {
  const [y, m] = month.split('-').map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'));
  }
  return out;
}

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

/**
 * "30-05-2026 | 12:57 PM", "2026-09-11", a Date or an Excel serial → "2026-05-30".
 *
 * The ERP writes the time after the date; it is ignored on purpose. Which day
 * a line belongs to is what decides the month and what makes a repeat upload
 * safe — the hour it was raised changes nothing about the incentive.
 */
function dayOf(v) {
  if (v === null || v === undefined || v === '') return '';
  const p = (y, m, d) => y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  if (v instanceof Date && !isNaN(v)) return p(v.getFullYear(), v.getMonth() + 1, v.getDate());
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);             // 2026-09-11
  if (m) return p(m[1], m[2], m[3]);
  m = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/.exec(s);        // 11-09-2026 (d-m-y)
  if (m) return p(m[3], m[2], m[1]);
  const n = Number(s);                                         // Excel serial
  if (Number.isFinite(n) && n > 20000 && n < 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return p(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  return '';
}

/** The month a value falls in, or '' — "2026-09" from anything dayOf reads. */
function monthOf(v) {
  const d = dayOf(v);
  if (d) return d.slice(0, 7);
  const s = String(v ?? '').trim();
  const m = /^(\d{4})-(\d{2})$/.exec(s);          // a bare "2026-09" column
  return m ? m[1] + '-' + m[2] : '';
}

/**
 * Fold rows into month → person → day.
 *
 * Day level so that uploading a sheet replaces only the days it covers.
 */
function groupByDay(rows) {
  const g = new Map();
  for (const r of rows) {
    if (!r.m) continue;
    if (!g.has(r.m)) g.set(r.m, new Map());
    const byPerson = g.get(r.m);
    if (!byPerson.has(r.person)) byPerson.set(r.person, new Map());
    const byDayFor = byPerson.get(r.person);
    const key = r.day || (r.m + '-01');
    const e = byDayFor.get(key) || { units: 0, lines: 0, invoices: new Set() };
    e.units += r.qty;
    e.lines++;
    if (r.voucher) e.invoices.add(r.voucher);
    byDayFor.set(key, e);
  }
  return g;
}

/** Month totals rebuilt from a person's days. */
function rollUp(person, days) {
  const list = [...days].map(([day, e]) => ({
    day, units: Math.round(e.units), lines: e.lines,
    invoices: e.invoices instanceof Set ? e.invoices.size : (e.invoices || 0),
  })).sort((a, b) => a.day.localeCompare(b.day));
  return {
    person,
    units:    list.reduce((a, d) => a + d.units, 0),
    lines:    list.reduce((a, d) => a + d.lines, 0),
    invoices: list.reduce((a, d) => a + d.invoices, 0),
    days: list,
  };
}

/**
 * Write one month, keeping the days this sheet does not mention.
 *
 * Returns what changed, so the caller can say whether a day was added or
 * overwritten rather than just "saved".
 */
async function mergeMonth(month, byPerson, fileName, uploadedBy) {
  const daysInSheet = new Set();
  for (const days of byPerson.values()) for (const d of days.keys()) daysInSheet.add(d);

  const existing = await IncentivePeriod.findOne({ month }).lean();
  const merged = new Map();
  let keptDays = 0;
  for (const r of (existing?.rows || [])) {
    for (const d of (r.days || [])) {
      if (daysInSheet.has(d.day)) continue;          // the sheet supersedes this day
      if (!merged.has(r.person)) merged.set(r.person, new Map());
      merged.get(r.person).set(d.day, { units: d.units || 0, lines: d.lines || 0, invoices: d.invoices || 0 });
      keptDays++;
    }
  }
  for (const [person, days] of byPerson) {
    if (!merged.has(person)) merged.set(person, new Map());
    const into = merged.get(person);
    for (const [day, e] of days) into.set(day, e);
  }

  const rows = [...merged].map(([person, days]) => rollUp(person, days))
    .filter(r => r.days.length)
    .sort((a, b) => b.units - a.units);

  await IncentivePeriod.findOneAndUpdate(
    { month },
    { $set: { month, rows, fileName, uploadedBy, replaced: existing?.rows || [] } },
    { upsert: true, new: true },
  );
  return {
    month,
    people: rows.length,
    units: rows.reduce((a, r) => a + r.units, 0),
    daysWritten: daysInSheet.size,
    daysKept: new Set((existing?.rows || []).flatMap(r => (r.days || []).map(d => d.day))
      .filter(d => !daysInSheet.has(d))).size,
  };
}

router.post('/incentive/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const commit = String(req.query.commit || '') === '1';
    // Seed mode: file every month the sheet contains, not just the main one.
    // This is how the six-month history report goes in — without it each month
    // would have to be uploaded separately, and until the history exists every
    // person is measured against nothing and paid the top rate on every unit.
    const saveAll = String(req.query.all || '') === '1';
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
    // A sheet can be filed under one chosen day: rows with no date take it,
    // rows dated another day are left out (and counted), so yesterday's
    // export can be uploaded today without the rest of its window coming
    // along. The month follows the day unless one was picked outright.
    const forcedDay = /^\d{4}-\d{2}-\d{2}$/.test(String(req.body?.day || '')) ? String(req.body.day) : '';
    const forced = /^\d{4}-\d{2}$/.test(String(req.body?.month || '')) ? String(req.body.month) : (forcedDay ? forcedDay.slice(0, 7) : '');
    let otherDayRows = 0, otherDayUnits = 0;
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
      const day = (cDate ? dayOf(r[cDate]) : '') || forcedDay;
      if (forcedDay && day !== forcedDay) { otherDayRows++; otherDayUnits += Number.isFinite(qty) ? qty : 0; continue; }
      // day is YYYY-MM-DD; the month is its first seven characters. Letting the
      // day fall through here filed a whole sheet under "2026-09-07".
      const m = (cMonth ? monthOf(r[cMonth]) : '')
             || (day ? day.slice(0, 7) : '')
             || (cDate ? monthOf(r[cDate]) : '');
      if (m) monthTally.set(m, (monthTally.get(m) || 0) + 1);
      if (rawName && rawName !== person) {
        if (!spellings.has(person)) spellings.set(person, new Set());
        spellings.get(person).add(rawName);
      }
      usable.push({ person, qty, m, day, voucher: cVoucher ? S(r[cVoucher]) : '' });
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
    // The preview has to answer "what will be paid", not "who is in the file".
    // Showing somebody here who the roster excludes would have the figures on
    // screen disagree with the figures after saving.
    const priced = people.filter(p => onRoster(p.person, config)).map(p => {
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

    // Seed mode groups by each row's own month instead of scoring just one.
    const perMonth = [];
    if (saveAll) {
      const g = new Map();
      let undated = 0;
      for (const r of usable) {
        if (!r.m) { undated++; continue; }
        if (!g.has(r.m)) g.set(r.m, new Map());
        const mm = g.get(r.m);
        const e = mm.get(r.person) || { person: r.person, units: 0, lines: 0, invoices: new Set() };
        e.units += r.qty;
        e.lines++;
        if (r.voucher) e.invoices.add(r.voucher);
        mm.set(r.person, e);
      }
      for (const [m, mm] of [...g].sort((a, b) => a[0].localeCompare(b[0]))) {
        const rows = [...mm.values()]
          .map(e => ({ person: e.person, units: Math.round(e.units), lines: e.lines, invoices: e.invoices.size }))
          .sort((a, b) => b.units - a.units);
        perMonth.push({
          month: m,
          rows,
          people: rows.length,
          units: rows.reduce((a, r) => a + r.units, 0),
        });
      }
      if (undated) perMonth.undated = undated;
    }

    // month -> person -> day, for whichever months are about to be written.
    const dayGroups = groupByDay(usable);
    const daysHere = [...(dayGroups.get(month)?.values() || [])]
      .flatMap(days => [...days.keys()]);
    const coversDays = [...new Set(daysHere)].sort();

    const existing = await IncentivePeriod.findOne({ month }).lean();
    // Days already stored for this month that the sheet does not mention.
    // They survive the upload, and saying so up front is the difference
    // between a safe daily upload and quietly losing the start of the month.
    const knownDays = new Set((existing?.rows || []).flatMap(r => (r.days || []).map(d => d.day)));
    const keptDays = [...knownDays].filter(d => !coversDays.includes(d)).sort();

    const payload = {
      month, commit,
      columns: { person: cPerson, qty: cQty, month: cMonth || null, date: cDate || null, voucher: cVoucher || null },
      headers,
      rowsRead: rows.length,
      skipped,
      // Filed under one chosen day, and how many rows belonged to other days and were left out.
      forcedDay: forcedDay || null,
      otherDayRows, otherDayUnits: Math.round(otherDayUnits),
      // Which raw spellings were folded into each name. An unfamiliar one
      // showing up here is the cue to add an alias, before the figures are
      // stored rather than after somebody has been paid on them.
      spellings: [...spellings].map(([name, raw]) => ({ name, raw: [...raw] })),
      // A sheet covering more than one month is worth seeing before it is filed.
      monthsSeen: monthsSeen.map(([m, n]) => ({ month: m, rows: n })),
      // Rows left out because they belong to a different month.
      excluded: { rows: otherMonthRows, units: Math.round(otherMonthUnits) },
      replacing: existing ? { rows: existing.rows?.length || 0, uploadedAt: existing.updatedAt } : null,
      // Which days this sheet covers, and which already-stored days it leaves
      // alone. A rolling export shrinks at the front; those days stay put.
      coversDays,
      keptDays,
      people: priced,
      // In the sheet but not on the roster: stored, never paid.
      offRoster: people.filter(p => !onRoster(p.person, config))
        .map(p => ({ person: p.person, units: p.units, lines: p.lines, invoices: p.invoices }))
        .sort((a, b) => b.units - a.units),
      // Seed mode: what each month in the sheet would be filed as. Units only —
      // the rates are worked out after the whole history is stored, since each
      // month's bar depends on the months before it.
      saveAll,
      perMonth: perMonth.map(({ month: m, people, units }) => ({ month: m, people, units })),
      undated: perMonth.undated || 0,
      totals: {
        people: priced.length,
        units:  priced.reduce((a, p) => a + p.units, 0),
        amount: Math.round(priced.reduce((a, p) => a + p.amount, 0) * 100) / 100,
        points: priced.reduce((a, p) => a + p.points, 0),
      },
    };

    if (!commit) return res.json({ ...payload, preview: true });

    const fileName = req.file.originalname || '';
    const by = req.user?.id || '';

    // Both paths merge by day rather than replacing the month outright.
    const targets = saveAll ? [...dayGroups.keys()].sort() : [month];
    if (saveAll && !targets.length) {
      return res.status(400).json({ error: 'No dated rows to file — the sheet needs a Date or Month column' });
    }
    const written = [];
    for (const m of targets) {
      const byPerson = dayGroups.get(m);
      if (!byPerson || !byPerson.size) continue;
      written.push(await mergeMonth(m, byPerson, fileName, by));
    }
    res.json({ ...payload, saved: true, savedMonths: written.map(w => w.month), written });
  } catch (e) {
    console.error('[PTX INCENTIVE UPLOAD]', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* ------------------------------------------------------------------ *
 *  GET /api/producttx/incentive/days?month=YYYY-MM                     *
 *                                                                      *
 *  Which days of the month have billing, which are closed, and which   *
 *  are simply missing. A daily upload is only trustworthy if a day     *
 *  that never arrived is visible instead of silently reading as zero.  *
 * ------------------------------------------------------------------ */

// Sunday. Every one of the 31 Sundays across the stored history has no
// billing at all, so treating them as working days would fill the gap list
// with noise and train everyone to ignore it.
const WEEKLY_CLOSED = 0;

router.get('/incentive/days', protect, adminOnly, async (req, res) => {
  try {
    const config = await getIncentiveConfig();
    const months = await allIncentiveMonths();
    const month = /^\d{4}-\d{2}$/.test(String(req.query.month || ''))
      ? String(req.query.month) : (months[0] || '');
    if (!month) return res.json({ month: '', months: [], days: [], missing: [] });

    const doc = await IncentivePeriod.findOne({ month }).lean();
    const holidays = new Set(doc?.holidays || []);

    // Units per day, and how many people billed on it.
    const byDay = new Map();
    for (const r of (doc?.rows || [])) {
      const person = canonicalPerson(r.person, config);
      const paid = onRoster(person, config);
      for (const d of (r.days || [])) {
        const e = byDay.get(d.day) || { units: 0, paidUnits: 0, people: new Set(), invoices: 0 };
        e.units += d.units || 0;
        if (paid) e.paidUnits += d.units || 0;
        e.invoices += d.invoices || 0;
        if (d.units) e.people.add(person);
        byDay.set(d.day, e);
      }
    }

    const [y, m] = month.split('-').map(Number);
    const lastDate = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const now = new Date();
    const todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0')
                   + '-' + String(now.getDate()).padStart(2, '0');

    const days = [];
    for (let i = 1; i <= lastDate; i++) {
      const day = month + '-' + String(i).padStart(2, '0');
      const dow = new Date(Date.UTC(y, m - 1, i)).getUTCDay();
      const e = byDay.get(day);
      // A day is only "missing" once it is in the past, is not the weekly
      // closed day, and has not been marked closed by hand.
      const status = e ? 'uploaded'
        : day > todayKey ? 'future'
        : holidays.has(day) ? 'holiday'
        : dow === WEEKLY_CLOSED ? 'weekly-closed'
        : 'missing';
      days.push({
        day, dow, status,
        today: day === todayKey,
        units: e ? Math.round(e.units) : 0,
        paidUnits: e ? Math.round(e.paidUnits) : 0,
        people: e ? e.people.size : 0,
        invoices: e ? e.invoices : 0,
      });
    }

    res.json({
      month, months, days,
      missing: days.filter(d => d.status === 'missing').map(d => d.day),
      today: todayKey,
      todayInMonth: todayKey.slice(0, 7) === month,
      todayUploaded: !!byDay.get(todayKey),
      lastUploadedDay: [...byDay.keys()].sort().pop() || '',
      fileName: doc?.fileName || '',
      uploadedAt: doc?.updatedAt || null,
    });
  } catch (e) {
    console.error('[PTX INCENTIVE DAYS]', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* Mark a day closed, or take the mark off again. */
router.put('/incentive/days/holiday', protect, adminOnly, async (req, res) => {
  try {
    const day = String(req.body?.day || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return res.status(400).json({ error: 'A date is required' });
    const month = day.slice(0, 7);
    const closed = req.body?.holiday !== false;

    const doc = await IncentivePeriod.findOne({ month });
    // A month nobody has uploaded to yet still needs somewhere to keep this.
    const holidays = new Set(doc?.holidays || []);
    if (closed) holidays.add(day); else holidays.delete(day);

    await IncentivePeriod.findOneAndUpdate(
      { month },
      { $set: { month, holidays: [...holidays].sort() } },
      { upsert: true, new: true },
    );
    res.json({ ok: true, day, holiday: closed, holidays: [...holidays].sort() });
  } catch (e) {
    console.error('[PTX INCENTIVE HOLIDAY]', e.message);
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

    const months = await allIncentiveMonths();
    const month = /^\d{4}-\d{2}$/.test(String(req.query.month || ''))
      ? String(req.query.month)
      : (months[0] || '');
    if (!month) {
      return res.json({ month: '', months: [], config, people: [],
        unassigned: { units: 0, lines: 0, salesmen: [] },
        totals: { people: 0, units: 0, amount: 0, points: 0 } });
    }

    // The month being scored plus the window its average is taken over, in one
    // read, so a person's history and their current figure agree.
    const lookback = lookbackMonthsFor(month, config);
    const { byMonth, source, unassigned, offRoster } = await unitsByMonth(
      [...new Set([month, ...lookback])], config);
    const { people, totals } = scoreMonth(month, byMonth, config);
    const orphans = unassigned.filter(u => u.month === month);
    const notPaid = offRoster.filter(u => u.month === month).sort((a, b) => b.units - a.units);

    res.json({
      month, months, lookback, config,
      source: source.get(month) || 'erp',
      people,
      unassigned: {
        units: orphans.reduce((a, u) => a + u.units, 0),
        lines: orphans.reduce((a, u) => a + u.lines, 0),
        salesmen: orphans.sort((a, b) => b.units - a.units),
      },
      totals,
      offRoster: notPaid,
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

  // The dealer performance tiers are derived from these Sale rows, so they are
  // stale the moment a sync lands. The manual Monthly Entry upload has always
  // recomputed them; this path never did, which is why Performance Tiers went
  // on describing the previous month after every ERP upload — 5 Rising Star on
  // screen against 35 in the data. Never let it fail the sync: the rows are
  // already written and a stale tier is recoverable, a half-written sync is not.
  let perfRecount = null;
  try {
    const { recomputePerfStatus } = await import('../lib/accountStatus.js');
    const r = await recomputePerfStatus();
    perfRecount = { dealers: r.dealers, changed: r.changed.length, month: r.month };
  } catch (e) {
    console.warn('[SYNC-SALES] tier recompute skipped:', e.message);
  }

  return { batchId, deleted, inserted, achievedWritten, perfRecount,
           months: months.map(({ rows, ...m }) => m) };
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
