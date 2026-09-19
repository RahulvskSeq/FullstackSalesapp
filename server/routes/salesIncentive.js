import express from 'express';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';
import Sale from '../models/Sale.js';
import ProductTxn from '../models/ProductTxn.js';
import SalesTarget from '../models/SalesTarget.js';
import SalesIncentiveAdj from '../models/SalesIncentiveAdj.js';
import Setting from '../models/Setting.js';
import User from '../models/User.js';
import { salesIncentiveFor, targetFor, payoutSchedule, DEFAULT_SALES_CONFIG } from '../lib/salesIncentive.js';
import { monthFacts, lateFacts } from '../lib/salesIncentiveFacts.js';

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
    excludePartyRoles: Array.isArray(v.excludePartyRoles) ? v.excludePartyRoles : DEFAULT_SALES_CONFIG.excludePartyRoles,
    displayCategories: Array.isArray(v.displayCategories) ? v.displayCategories : DEFAULT_SALES_CONFIG.displayCategories,
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
const prevMonthOf = m => monthsEndingAt(m, 2)[0];
const isNum = v => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));

/**
 * Score one month from figures already fetched.
 *
 * `carry` is the bad-debt balance each salesman brings into the month from
 * the one before (declared amount minus what earlier months recovered); a
 * balance typed for THIS month replaces it.
 */
function scoreSalesMonth(month, facts, late, targetsByMonth, adjByMonth, config, catTargetsByMonth = {}, carry = {}, today = new Date()) {
  const per = facts?.per || {};
  const basicOf = targetsByMonth[month] || {};
  const catT = catTargetsByMonth[month] || {};
  const adj = adjByMonth[month] || {};
  const sched = payoutSchedule(month, config, today);
  const ids = [...new Set([...Object.keys(per), ...Object.keys(basicOf)])];
  const people = ids.map(id => {
    const a = adj[id] || {};
    const f = per[id] || { qty: {}, project: { sheets: 0, lines: [] }, displayValue: 0, excluded: { units: 0, lines: 0, byReason: {} }, returns: { units: 0, lines: 0 } };
    const l = late?.bySalesman?.[id] || { final: !!sched?.final, lateByCategory: {}, dealers: [], atRiskUnits: 0 };

    const auto = {
      displayValue: f.displayValue || 0,
      projectSheets: f.project?.sheets || 0,
      projectLines: f.project?.lines || [],
      lateByCategory: l.lateByCategory || {},
      lateSheets: Object.values(l.lateByCategory || {}).reduce((x, v) => x + v, 0),
      lateDealers: l.dealers || [],
      lateFinal: !!l.final,
      atRiskUnits: l.atRiskUnits || 0,
      excluded: f.excluded, returns: f.returns,
      badDebtCarried: Math.max(0, Math.round((carry[id] || 0) * 100) / 100),
    };
    // typed figures override what the system found; null = auto
    const displayValue       = isNum(a.displayValue)       ? Number(a.displayValue)       : auto.displayValue;
    const projectSheets      = isNum(a.projectSheets)      ? Number(a.projectSheets)      : auto.projectSheets;
    const lateOverride       = isNum(a.latePaymentSheets);
    const latePaymentSheets  = lateOverride ? Number(a.latePaymentSheets) : 0;
    const lateByCategory     = lateOverride ? {} : auto.lateByCategory;
    const badDebtOutstanding = isNum(a.badDebtOutstanding) ? Number(a.badDebtOutstanding) : auto.badDebtCarried;

    const scored = salesIncentiveFor(basicOf[id] || 0, f.qty || {}, {
      displayValue, projectSheets, latePaymentSheets, lateByCategory, badDebtOutstanding,
      categoryTargets: catT[id] || {},
    }, config);

    const needsApproval = projectSheets > 0 && !a.projectApproved;
    const paid = a.paidAt ? { at: a.paidAt, by: a.paidBy || '', ...(a.paid || {}) } : null;
    return {
      salesmanId: id,
      adjustments: {
        displayValue: isNum(a.displayValue) ? Number(a.displayValue) : null,
        projectSheets: isNum(a.projectSheets) ? Number(a.projectSheets) : null,
        latePaymentSheets: isNum(a.latePaymentSheets) ? Number(a.latePaymentSheets) : null,
        badDebtOutstanding: isNum(a.badDebtOutstanding) ? Number(a.badDebtOutstanding) : null,
        note: a.note || '', projectApproved: !!a.projectApproved,
      },
      auto,
      effective: { displayValue, projectSheets, latePaymentSheets: latePaymentSheets + auto.lateSheets * (lateOverride ? 0 : 1), badDebtOutstanding },
      needsApproval,
      paid,
      payout: { ...(sched || {}), status: paid ? 'paid' : (sched?.status || 'open') },
      ...scored,
      // a paid month shows what was actually paid, whatever the data says now
      ...(paid && isNum(paid.payable) ? { payable: paid.payable, points: paid.points ?? Math.round(paid.payable * (Number(config.pointsPerRupee) || 0)) } : {}),
    };
  });
  const sum = f => Math.round(people.reduce((x, p) => x + f(p), 0) * 100) / 100;
  return {
    people, sched,
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
      late:     people.reduce((a, p) => a + (p.auto?.lateSheets || 0) + (p.adjustments?.latePaymentSheets || 0), 0),
      atRisk:   people.reduce((a, p) => a + (p.auto?.atRiskUnits || 0), 0),
      needsApproval: people.filter(p => p.needsApproval).length,
      paid:     people.filter(p => p.paid).length,
    },
  };
}

/** Everything the dashboard needs for the six months ending at `month`. */
async function computeWindow(month, config, { from = '', to = '' } = {}) {
  const trendMonths = monthsEndingAt(month, 6);
  const today = new Date();
  const [targets, adjRows, users, factsList] = await Promise.all([
    SalesTarget.find({ month: { $in: trendMonths } }).lean(),
    SalesIncentiveAdj.find({ month: { $lte: month } }).lean(),
    User.find({}, 'id userId name role').lean(),
    Promise.all(trendMonths.map(m => monthFacts(m, config))),
  ]);
  const factsByMonth = Object.fromEntries(trendMonths.map((m, i) => [m, factsList[i]]));

  // In range mode the scored month's quantities are replaced by the window's.
  // Targets and adjustments stay monthly: the scheme is monthly, and giving a
  // five-day window its own basic target would invent a bar nobody agreed to.
  let rangeInfo = null;
  if (from && to) {
    const lines = await ProductTxn.aggregate([
      { $match: { dateStr: { $gte: from, $lte: to } } },
      { $group: { _id: { s: '$salesmanId', c: '$category' }, qty: { $sum: '$qty' } } },
    ]);
    const per = {};
    for (const r of lines) {
      const sm = r._id.s || '';
      if (!sm || sm === 'none') continue;
      (per[sm] ||= { qty: {}, dealers: {}, dealerNames: {}, project: { sheets: 0, lines: [] }, displayValue: 0, excluded: { units: 0, lines: 0, byReason: {} }, returns: { units: 0, lines: 0 } }).qty[r._id.c] = (per[sm].qty[r._id.c] || 0) + (r.qty || 0);
    }
    const haveDays = await ProductTxn.distinct('dateStr', { dateStr: { $gte: from, $lte: to } });
    factsByMonth[month] = { source: 'erp-lines', per };
    rangeInfo = { from, to, days: haveDays.filter(Boolean).length, source: 'erp-lines' };
  }

  const lateByMonth = Object.fromEntries(await Promise.all(trendMonths.map(async m => [m, await lateFacts(m, factsByMonth[m], config, today)])));

  const nameOf = Object.fromEntries(users.map(u => [u.id || u.userId, u.name || u.id || u.userId]));
  const targetsByMonth = {}, adjByMonth = {}, catTargetsByMonth = {};
  for (const t of targets) {
    ((catTargetsByMonth[t.month] ||= {})[t.salesmanId] ||= {})[t.category] = Number(t.target) || 0;
    if (t.category !== config.gateCategory) continue;
    (targetsByMonth[t.month] ||= {})[t.salesmanId] = Number(t.target) || 0;
  }
  for (const a of adjRows) (adjByMonth[a.month] ||= {})[a.salesmanId] = a;

  // Bad debt carried in: the latest declared balance before the window, less
  // what each paid month recovered since (frozen on the paid slip).
  const carry = {};
  const before = adjRows.filter(a => a.month < trendMonths[0]).sort((x, y) => x.month.localeCompare(y.month));
  const declaredAt = {};
  for (const a of before) if (isNum(a.badDebtOutstanding)) { declaredAt[a.salesmanId] = a.month; carry[a.salesmanId] = Number(a.badDebtOutstanding); }
  for (const a of before) if (declaredAt[a.salesmanId] && a.month >= declaredAt[a.salesmanId] && a.paid?.clawback) carry[a.salesmanId] = Math.max(0, carry[a.salesmanId] - a.paid.clawback);

  const scored = {};
  let carryIn = { ...carry };
  for (const m of trendMonths) {
    scored[m] = scoreSalesMonth(m, factsByMonth[m], lateByMonth[m], targetsByMonth, adjByMonth, config, catTargetsByMonth, carryIn, today);
    const next = {};
    for (const p of scored[m].people) {
      const claw = p.paid && isNum(p.paid.clawback) ? p.paid.clawback : p.clawback;
      next[p.salesmanId] = Math.max(0, Math.round((p.badDebtOutstanding - claw) * 100) / 100);
    }
    carryIn = next;
  }
  return { trendMonths, scored, nameOf, rangeInfo, factsByMonth };
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

    const isDay = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
    const from = isDay(req.query.from) ? String(req.query.from) : '';
    const to   = isDay(req.query.to)   ? String(req.query.to)   : '';
    const ranged = !!(from && to && from <= to);

    const month = ranged
      ? to.slice(0, 7)
      : (/^\d{4}-\d{2}$/.test(String(req.query.month || ''))
          ? String(req.query.month) : (months[0] || ''));
    if (!month) return res.json({ month: '', months: [], config, people: [], totals: {} });

    const { trendMonths, scored, nameOf, rangeInfo, factsByMonth } = await computeWindow(month, config, ranged ? { from, to } : {});

    // "My incentive": keep one person everywhere — the list, the totals and
    // the trend — so nothing about colleagues leaves the server.
    if (mineId) {
      for (const m of Object.keys(scored)) {
        const only = scored[m].people.filter(p => p.salesmanId === mineId);
        const sum = f => Math.round(only.reduce((x, p) => x + f(p), 0) * 100) / 100;
        scored[m] = { people: only, sched: scored[m].sched, totals: {
          people: only.length, gateOpen: only.filter(p => p.gateOpen).length, gateShut: only.filter(p => !p.gateOpen).length,
          laminate: sum(p => p.laminate.amount), products: sum(p => p.products.reduce((a, q) => a + q.amount, 0)),
          display: sum(p => p.display), earned: sum(p => p.earned), clawback: sum(p => p.clawback), deduction: sum(p => p.deduction),
          payable: sum(p => p.payable), points: only.reduce((a, p) => a + (p.points || 0), 0), grossPoints: only.reduce((a, p) => a + (p.grossPoints || 0), 0),
          units: only.reduce((a, p) => a + p.credited, 0),
          late: only.reduce((a, p) => a + (p.auto?.lateSheets || 0), 0), atRisk: only.reduce((a, p) => a + (p.auto?.atRiskUnits || 0), 0),
          needsApproval: only.filter(p => p.needsApproval).length, paid: only.filter(p => p.paid).length,
        } };
      }
    }
    const curScored = scored[month];

    const people = curScored.people
      .map(p => ({ ...p, name: nameOf[p.salesmanId] || p.salesmanId }))
      .sort((x, y) => y.payable - x.payable || y.credited - x.credited);

    const prevMonth = trendMonths[trendMonths.length - 2] || '';
    const prev = prevMonth ? scored[prevMonth] : null;
    const delta = (now, before) =>
      (before > 0) ? Math.round(((now - before) / before) * 1000) / 10 : null;

    res.json({
      month, months, config,
      mine: !!mineId,
      canPay: role === 'admin' || role === 'superadmin',
      range: rangeInfo,
      source: factsByMonth[month]?.source || 'none',
      schedule: curScored.sched,
      people,
      totals: curScored.totals,
      previous: prev ? { month: prevMonth, ...prev.totals } : null,
      change: prev ? {
        payable:  delta(curScored.totals.payable,  prev.totals.payable),
        earned:   delta(curScored.totals.earned,   prev.totals.earned),
        units:    delta(curScored.totals.units,    prev.totals.units),
        gateOpen: delta(curScored.totals.gateOpen, prev.totals.gateOpen),
      } : null,
      trend: trendMonths.map(m => ({ month: m, status: scored[m].people.some(p => p.paid) && scored[m].people.every(p => p.paid) ? 'paid' : scored[m].sched?.status, ...scored[m].totals })),
      noTarget: people.filter(p => !p.basic).map(p => p.name),
    });
  } catch (e) {
    console.error('[SALES INCENTIVE]', e.message);
    res.status(500).json({ error: e.message });
  }
});

/* Save the per-salesman overrides. Blank = let the system work it out. */
router.put('/adjustments', protect, adminOnly, async (req, res) => {
  try {
    const { month, salesmanId } = req.body || {};
    if (!/^\d{4}-\d{2}$/.test(String(month || '')) || !salesmanId) {
      return res.status(400).json({ error: 'month and salesmanId are required' });
    }
    const cur = await SalesIncentiveAdj.findOne({ month, salesmanId }).lean();
    if (cur?.paidAt) return res.status(409).json({ error: 'This month is already paid. Un-mark it (superadmin) before changing the figures.' });
    const n = (v) => isNum(v) ? Math.max(0, Number(v)) : null;
    const ni = (v) => isNum(v) ? Math.round(Math.max(0, Number(v))) : null;
    const doc = await SalesIncentiveAdj.findOneAndUpdate(
      { month, salesmanId },
      { $set: {
          month, salesmanId,
          displayValue:       n(req.body.displayValue),
          projectSheets:      ni(req.body.projectSheets),
          latePaymentSheets:  ni(req.body.latePaymentSheets),
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

/* Section 3: a project-sale payout needs management approval. */
router.post('/approve-project', protect, adminOnly, async (req, res) => {
  try {
    const { month, salesmanId, approved } = req.body || {};
    if (!/^\d{4}-\d{2}$/.test(String(month || '')) || !salesmanId) return res.status(400).json({ error: 'month and salesmanId are required' });
    const doc = await SalesIncentiveAdj.findOneAndUpdate({ month, salesmanId },
      { $set: { month, salesmanId, projectApproved: approved !== false, projectApprovedBy: approved !== false ? (req.user?.id || '') : '', projectApprovedAt: approved !== false ? new Date() : null } },
      { upsert: true, new: true });
    res.json({ ok: true, adjustment: doc });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* Section 4: mark a salesman's month (or every payable one) as paid, freezing the figures. */
router.post('/paid', protect, adminOnly, async (req, res) => {
  try {
    const { month, salesmanId, force } = req.body || {};
    if (!/^\d{4}-\d{2}$/.test(String(month || ''))) return res.status(400).json({ error: 'month is required' });
    const config = await getConfig();
    const { scored, nameOf } = await computeWindow(month, config);
    const sched = scored[month].sched;
    if (sched.status !== 'payable' && !(force && req.user?.role === 'superadmin')) {
      return res.status(409).json({ error: `${month} is ${sched.status === 'open' ? 'still open' : 'held'} until ${sched.holdEnd}; it can be paid from ${sched.payDate}.` });
    }
    const targets = scored[month].people.filter(p => (!salesmanId || p.salesmanId === salesmanId) && !p.paid && p.basic > 0);
    const blocked = targets.filter(p => p.needsApproval);
    if (blocked.length && !salesmanId) return res.status(409).json({ error: 'Project sales awaiting approval: ' + blocked.map(p => nameOf[p.salesmanId] || p.salesmanId).join(', ') });
    if (blocked.length) return res.status(409).json({ error: 'Approve the project sales first.' });
    let marked = 0;
    for (const p of targets) {
      await SalesIncentiveAdj.findOneAndUpdate({ month, salesmanId: p.salesmanId }, { $set: {
        month, salesmanId: p.salesmanId, paidAt: new Date(), paidBy: req.user?.id || '',
        paid: { payable: p.payable, points: p.points, earned: p.earned, clawback: p.clawback, deduction: p.deduction, credited: p.credited,
                late: p.effective.latePaymentSheets, project: p.effective.projectSheets, badDebtOutstanding: p.badDebtOutstanding, payDate: sched.payDate },
      } }, { upsert: true });
      marked++;
    }
    res.json({ ok: true, marked });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/unpaid', protect, superAdminOnly, async (req, res) => {
  try {
    const { month, salesmanId } = req.body || {};
    if (!/^\d{4}-\d{2}$/.test(String(month || '')) || !salesmanId) return res.status(400).json({ error: 'month and salesmanId are required' });
    await SalesIncentiveAdj.updateOne({ month, salesmanId }, { $set: { paidAt: null, paidBy: '', paid: null } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/config', protect, adminOnly, async (req, res) => {
  // Section 6: targets, rates and the gate are changed by the CEO only.
  res.json({ config: await getConfig(), defaults: DEFAULT_SALES_CONFIG, canEdit: req.user?.role === 'superadmin' });
});

router.put('/config', protect, superAdminOnly, async (req, res) => {
  try {
    await Setting.findOneAndUpdate({ key: KEY },
      { $set: { key: KEY, value: req.body || {} } }, { upsert: true });
    res.json({ ok: true, config: await getConfig() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export { computeWindow, getConfig };
export default router;
