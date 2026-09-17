import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import Sale from '../models/Sale.js';
import ProductTxn from '../models/ProductTxn.js';
import SalesTarget from '../models/SalesTarget.js';
import SalesIncentiveAdj from '../models/SalesIncentiveAdj.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import { salesIncentiveFor, targetFor, DEFAULT_SALES_CONFIG } from '../lib/salesIncentive.js';

const router = express.Router();
const KEY = 'salesIncentive.config';

/** Stored overrides layered onto the published scheme. */
async function getConfig() {
  const row = await Setting.findOne({ key: KEY }).lean();
  const v = row?.value && typeof row.value === 'object' ? row.value : {};
  return {
    ...DEFAULT_SALES_CONFIG,
    ...v,
    // Arrays must be replaced wholesale, never merged key-by-key.
    starterTiers: Array.isArray(v.starterTiers) && v.starterTiers.length
      ? v.starterTiers : DEFAULT_SALES_CONFIG.starterTiers,
    products: Array.isArray(v.products) && v.products.length
      ? v.products : DEFAULT_SALES_CONFIG.products,
  };
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

/**
 * Score one month from figures already fetched.
 *
 * Pure so the trend can reuse it for five earlier months without another
 * round trip per month.
 */
function scoreSalesMonth(month, qtyByMonth, targetsByMonth, adjByMonth, config, catTargetsByMonth = {}) {
  const qty = qtyByMonth[month] || {};
  const basicOf = targetsByMonth[month] || {};
  const catT = catTargetsByMonth[month] || {};
  const adj = adjByMonth[month] || {};
  const ids = [...new Set([...Object.keys(qty), ...Object.keys(basicOf)])];
  const people = ids.map(id => {
    const a = adj[id] || {};
    return {
      salesmanId: id,
      adjustments: {
        displayValue: a.displayValue || 0, projectSheets: a.projectSheets || 0,
        latePaymentSheets: a.latePaymentSheets || 0, badDebtOutstanding: a.badDebtOutstanding || 0,
        note: a.note || '',
      },
      ...salesIncentiveFor(basicOf[id] || 0, qty[id] || {}, {
        displayValue: a.displayValue, projectSheets: a.projectSheets,
        latePaymentSheets: a.latePaymentSheets, badDebtOutstanding: a.badDebtOutstanding,
        categoryTargets: catT[id] || {},
      }, config),
    };
  });
  const sum = f => Math.round(people.reduce((x, p) => x + f(p), 0) * 100) / 100;
  return {
    people,
    totals: {
      people:   people.length,
      gateOpen: people.filter(p => p.gateOpen).length,
      gateShut: people.filter(p => !p.gateOpen).length,
      laminate: sum(p => p.laminate.amount),
      products: sum(p => p.products.reduce((a, q) => a + q.amount, 0)),
      display:  sum(p => p.display),
      earned:   sum(p => p.earned),
      clawback: sum(p => p.clawback),
      deduction: sum(p => p.deduction),
      payable:  sum(p => p.payable),
      points:      people.reduce((a, p) => a + (p.points || 0), 0),
      grossPoints: people.reduce((a, p) => a + (p.grossPoints || 0), 0),
      units:    people.reduce((a, p) => a + p.credited, 0),
    },
  };
}

/* ------------------------------------------------------------------ *
 *  GET /api/sales-incentive?month=YYYY-MM                             *
 *  Every salesman's incentive for the month, fully worked out.        *
 * ------------------------------------------------------------------ */
router.get('/', protect, async (req, res) => {
  try {
    // Admins see everyone; a salesman sees only their own row ("My incentive").
    const role = req.user?.role;
    const mineId = role === 'salesman' ? req.user.id : null;
    if (!mineId && role !== 'admin' && role !== 'superadmin') return res.status(403).json({ error: 'Sales incentive is for salesmen and admins' });
    const config = await getConfig();
    const months = (await Sale.distinct('month')).filter(Boolean).sort().reverse();

    // A date window comes from the ERP invoice lines, which carry a date per
    // line. The monthly Sale rollup does not — it is one row per dealer x
    // sub-category x MONTH — so a range can only be answered where the lines
    // were imported, and the caller is told when they were not.
    const isDay = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
    const from = isDay(req.query.from) ? String(req.query.from) : '';
    const to   = isDay(req.query.to)   ? String(req.query.to)   : '';
    const ranged = !!(from && to && from <= to);

    const month = ranged
      ? to.slice(0, 7)
      : (/^\d{4}-\d{2}$/.test(String(req.query.month || ''))
          ? String(req.query.month) : (months[0] || ''));
    if (!month) return res.json({ month: '', months: [], config, people: [], totals: {} });

    // Six months in one read: the month on screen plus five behind it for the
    // trend. Fetching per month would be six round trips for one chart.
    const trendMonths = monthsEndingAt(month, 6);
    const [sales, targets, adjRows, users] = await Promise.all([
      Sale.aggregate([
        { $match: { month: { $in: trendMonths } } },
        { $group: { _id: { m: '$month', s: '$salesman', c: '$category' }, qty: { $sum: '$qty' } } },
      ]),
      SalesTarget.find({ month: { $in: trendMonths } }).lean(),
      SalesIncentiveAdj.find({ month: { $in: trendMonths } }).lean(),
      User.find({}, 'userId name role').lean(),
    ]);

    const nameOf = Object.fromEntries(users.map(u => [u.userId, u.name || u.userId]));

    const qtyByMonth = {}, targetsByMonth = {}, adjByMonth = {};
    for (const r of sales) {
      const s = r._id.s || '';
      if (!s || s === 'none') continue;          // unattributed rows belong to nobody
      ((qtyByMonth[r._id.m] ||= {})[s] ||= {})[r._id.c] =
        ((qtyByMonth[r._id.m][s][r._id.c]) || 0) + (r.qty || 0);
    }
    // every category's target, so other products use the salesman's own
    // figure; the gate category's one is the basic
    const catTargetsByMonth = {};
    for (const t of targets) {
      ((catTargetsByMonth[t.month] ||= {})[t.salesmanId] ||= {})[t.category] = Number(t.target) || 0;
      if (t.category !== config.gateCategory) continue;
      (targetsByMonth[t.month] ||= {})[t.salesmanId] = Number(t.target) || 0;
    }
    for (const a of adjRows) (adjByMonth[a.month] ||= {})[a.salesmanId] = a;

    // In range mode the scored month's quantities are replaced by the window's.
    // Targets and adjustments stay monthly: the scheme is monthly, and giving a
    // five-day window its own basic target would invent a bar nobody agreed to.
    let rangeInfo = null;
    if (ranged) {
      const lines = await ProductTxn.aggregate([
        { $match: { dateStr: { $gte: from, $lte: to } } },
        // salesmanId, not salesman: ProductTxn keeps the ERP's display name in
        // `salesman` ("Rakesh Boriwal") and the app's id in `salesmanId`
        // ("rakesh"). Targets and the Sale rollup both key on the id, so
        // grouping by the name matches nothing and every basic reads as zero.
        { $group: { _id: { s: '$salesmanId', c: '$category' }, qty: { $sum: '$qty' } } },
      ]);
      const inRange = {};
      for (const r of lines) {
        const sm = r._id.s || '';
        if (!sm || sm === 'none') continue;
        (inRange[sm] ||= {})[r._id.c] = (inRange[sm][r._id.c] || 0) + (r.qty || 0);
      }
      const haveDays = await ProductTxn.distinct('dateStr', { dateStr: { $gte: from, $lte: to } });
      qtyByMonth[month] = inRange;
      rangeInfo = { from, to, days: haveDays.filter(Boolean).length, source: 'erp-lines' };
    }

    const scored = Object.fromEntries(trendMonths.map(m =>
      [m, scoreSalesMonth(m, qtyByMonth, targetsByMonth, adjByMonth, config, catTargetsByMonth)]));
    const cur = scored[month];

    // "My incentive": keep one person everywhere — the list, the totals and
    // the trend — so nothing about colleagues leaves the server.
    if (mineId) {
      for (const m of Object.keys(scored)) {
        const only = scored[m].people.filter(p => p.salesmanId === mineId);
        const sum = f => Math.round(only.reduce((x, p) => x + f(p), 0) * 100) / 100;
        scored[m] = { people: only, totals: {
          people: only.length, gateOpen: only.filter(p => p.gateOpen).length, gateShut: only.filter(p => !p.gateOpen).length,
          laminate: sum(p => p.laminate.amount), products: sum(p => p.products.reduce((a, q) => a + q.amount, 0)),
          display: sum(p => p.display), earned: sum(p => p.earned), clawback: sum(p => p.clawback), deduction: sum(p => p.deduction),
          payable: sum(p => p.payable), points: only.reduce((a, p) => a + (p.points || 0), 0), grossPoints: only.reduce((a, p) => a + (p.grossPoints || 0), 0),
          units: only.reduce((a, p) => a + p.credited, 0),
        } };
      }
    }
    const curScored = scored[month];

    const people = curScored.people
      .map(p => ({ ...p, name: nameOf[p.salesmanId] || p.salesmanId }))
      .sort((x, y) => y.payable - x.payable || y.credited - x.credited);

    const prevMonth = trendMonths[trendMonths.length - 2] || '';
    const prev = prevMonth ? scored[prevMonth] : null;
    // Only compare where there is something to compare against: "+100% from
    // nothing" reads as growth when it is really a first month.
    const delta = (now, before) =>
      (before > 0) ? Math.round(((now - before) / before) * 1000) / 10 : null;

    res.json({
      month, months, config,
      mine: !!mineId,
      // Present only when a date window was asked for.
      range: rangeInfo,
      people,
      totals: curScored.totals,
      previous: prev ? { month: prevMonth, ...prev.totals } : null,
      change: prev ? {
        payable:  delta(curScored.totals.payable,  prev.totals.payable),
        earned:   delta(curScored.totals.earned,   prev.totals.earned),
        units:    delta(curScored.totals.units,    prev.totals.units),
        gateOpen: delta(curScored.totals.gateOpen, prev.totals.gateOpen),
      } : null,
      trend: trendMonths.map(m => ({ month: m, ...scored[m].totals })),
      // Nobody can earn without a basic target, so an unset target is a
      // silent zero unless it is called out.
      noTarget: people.filter(p => !p.basic).map(p => p.name),
    });
  } catch (e) {
    console.error('[SALES INCENTIVE]', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* Save the per-salesman adjustments the sales data cannot supply. */
router.put('/adjustments', protect, adminOnly, async (req, res) => {
  try {
    const { month, salesmanId } = req.body || {};
    if (!/^\d{4}-\d{2}$/.test(String(month || '')) || !salesmanId) {
      return res.status(400).json({ error: 'month and salesmanId are required' });
    }
    const n = (v) => Math.max(0, Number(v) || 0);
    const doc = await SalesIncentiveAdj.findOneAndUpdate(
      { month, salesmanId },
      { $set: {
          month, salesmanId,
          displayValue:       n(req.body.displayValue),
          projectSheets:      Math.round(n(req.body.projectSheets)),
          latePaymentSheets:  Math.round(n(req.body.latePaymentSheets)),
          badDebtOutstanding: n(req.body.badDebtOutstanding),
          note: String(req.body.note || '').slice(0, 500),
          updatedBy: req.user?.id || '',
      } },
      { upsert: true, new: true },
    );
    res.json({ ok: true, adjustment: doc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/config', protect, adminOnly, async (req, res) => {
  res.json({ config: await getConfig(), defaults: DEFAULT_SALES_CONFIG });
});

router.put('/config', protect, adminOnly, async (req, res) => {
  try {
    await Setting.findOneAndUpdate({ key: KEY },
      { $set: { key: KEY, value: req.body || {} } }, { upsert: true });
    res.json({ ok: true, config: await getConfig() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
