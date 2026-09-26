import express from 'express';
import Sale from '../models/Sale.js';
import User from '../models/User.js';
import { computeWindow, getConfig } from './salesIncentive.js';

/**
 * Read-only SALESMAN-incentive API for other software (the laminate scheme).
 *
 *   GET /api/external/sales-incentive/months              → months that have figures
 *   GET /api/external/sales-incentive?month=YYYY-MM       → every salesman for that month
 *   GET /api/external/sales-incentive?month=…&person=rakesh
 *                                                        → one salesman (user id or name, case-insensitive)
 *   GET /api/external/sales-incentive?from=YYYY-MM-DD&to=YYYY-MM-DD
 *                                                        → invoice lines in that window, scored against
 *                                                          the targets of the month `to` falls in
 *
 * Auth: header `X-API-Key: <INCENTIVE_API_KEY>` (or `?key=`) — the same key as
 * the billing-incentive API. Nothing here writes.
 *
 * The figures come from the same code the Sales Incentive page uses, so the
 * other system and the dashboard can never disagree.
 */
const router = express.Router();

const requireKey = (req, res, next) => {
  const expected = process.env.SALES_INCENTIVE_API_KEY || process.env.INCENTIVE_API_KEY;
  if (!expected) return res.status(503).json({ error: 'Incentive API not configured — set INCENTIVE_API_KEY in server .env' });
  const key = req.headers['x-api-key'] || req.query.key;
  if (!key || String(key) !== String(expected)) return res.status(401).json({ error: 'Invalid API key' });
  next();
};
router.use(requireKey);

const isMonth = v => /^\d{4}-\d{2}$/.test(String(v || ''));
const isDay   = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;

/** A salesman as the outside world should see them — no dealer lists, no invoice lines. */
const publicPerson = (p, name, empCode = '') => ({
  salesmanId: p.salesmanId,
  empCode,                                          // HR code, e.g. "SSL 12"
  name,
  basic: p.basic,                                   // laminate basic target, sheets
  laminate: {
    sold: p.gross, project: p.project, late: p.late, credited: p.credited,
    gateOpen: p.gateOpen, shortfall: p.shortfall,
    excess: p.laminate.excess, rate: p.laminate.rate, mode: p.laminate.mode, amount: p.laminate.amount,
  },
  products: p.products.map(x => ({ key: x.key, label: x.label, category: x.category, target: x.target, targetSource: x.targetSource, actual: x.actual, late: x.late, excess: x.excess, rate: x.rate, amount: x.amount })),
  display: { value: p.displayValue, amount: p.display },
  earned: p.earned,                                 // before bad-debt recovery and deduction
  badDebt: { outstanding: p.badDebtOutstanding, recovered: p.clawback, carriedForward: r2(Math.max(0, p.badDebtOutstanding - p.clawback)) },
  deductionPct: p.deductionPct, deduction: p.deduction,
  amount: p.payable,                                // net, what is paid
  grossPoints: p.grossPoints, points: p.points,
  projectApproval: p.effective?.projectSheets > 0 ? (p.needsApproval ? 'pending' : 'approved') : 'not-needed',
  atRiskUnits: p.auto?.lateFinal ? 0 : (p.auto?.atRiskUnits || 0),   // on dealers still outstanding, decided at holdEnd
  excludedUnits: p.auto?.excluded?.units || 0,
  returnedUnits: p.auto?.returns?.units || 0,
  payout: { status: p.payout?.status, monthEnd: p.payout?.monthEnd, holdEnd: p.payout?.holdEnd, payDate: p.payout?.payDate, payMonth: p.payout?.payMonth,
            paidAt: p.paid?.at || null, paidBy: p.paid?.by || '' },
});

router.get('/months', async (req, res) => {
  try { res.json({ months: (await Sale.distinct('month')).filter(Boolean).sort().reverse() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const config = await getConfig();
    const months = (await Sale.distinct('month')).filter(Boolean).sort().reverse();
    const from = isDay(req.query.from) ? String(req.query.from) : '';
    const to   = isDay(req.query.to)   ? String(req.query.to)   : '';
    const ranged = !!(from && to && from <= to);
    const month = ranged ? to.slice(0, 7) : (isMonth(req.query.month) ? String(req.query.month) : (months[0] || ''));
    if (!month) return res.json({ month: '', range: null, people: [], totals: {}, months: [] });
    if (!ranged && !months.includes(month)) return res.status(404).json({ error: `No figures for ${month}`, months });

    const { scored, nameOf, rangeInfo, factsByMonth } = await computeWindow(month, config, ranged ? { from, to } : {});
    const cur = scored[month];
    // only salesmen in the scheme this month (a laminate basic is set) — same as the dashboard list
    let people = cur.people.filter(p => p.basic > 0);
    const users = await User.find({ id: { $in: people.map(p => p.salesmanId) } }, 'id name active empCode').lean();
    const active = new Set(users.filter(u => u.active !== false).map(u => u.id));
    const codeOf = Object.fromEntries(users.map(u => [u.id, u.empCode || '']));
    people = people.filter(p => active.has(p.salesmanId));

    // person = user id, name, or employee code ("SSL 12" / "ssl12"), case-insensitive
    const q = String(req.query.person || '').trim().toLowerCase();
    const squash = v => String(v || '').toLowerCase().replace(/\s+/g, '');
    const list = q ? people.filter(p => [p.salesmanId, nameOf[p.salesmanId]].some(v => String(v || '').toLowerCase() === q) || (codeOf[p.salesmanId] && squash(codeOf[p.salesmanId]) === squash(q))) : people;
    if (q && !list.length) return res.status(404).json({ error: `No salesman "${req.query.person}" in ${month}`, people: people.map(p => ({ salesmanId: p.salesmanId, empCode: codeOf[p.salesmanId] || '', name: nameOf[p.salesmanId] || p.salesmanId })) });

    const sum = f => r2(list.reduce((a, p) => a + f(p), 0));
    res.json({
      month,
      range: rangeInfo,
      source: factsByMonth[month]?.source || 'none',            // erp-lines | rollup
      scheme: {
        gateCategory: config.gateCategory, gateAll: !!config.gateAll,
        starterTiers: config.starterTiers, retroFrom: config.retroFrom, retroBase: config.retroBase, retroStep: config.retroStep, retroBlock: config.retroBlock, retroCap: config.retroCap,
        products: config.products, displayPct: config.displayPct, projectCredit: config.projectCredit, projectBelow: config.projectBelow,
        badDebtClawback: config.badDebtClawback, deductionPct: config.deductionPct, pointsPerRupee: config.pointsPerRupee,
        holdDays: config.holdDays, salaryDay: config.salaryDay,
      },
      payout: cur.sched,
      totals: {
        people: list.length,
        gateOpen: list.filter(p => p.gateOpen).length,
        laminateSheets: list.reduce((a, p) => a + p.credited, 0),
        earned: sum(p => p.earned), badDebtRecovered: sum(p => p.clawback), deduction: sum(p => p.deduction),
        amount: sum(p => p.payable),
        grossPoints: list.reduce((a, p) => a + (p.grossPoints || 0), 0), points: list.reduce((a, p) => a + (p.points || 0), 0),
        paid: list.filter(p => p.paid).length, projectApprovalsPending: list.filter(p => p.needsApproval).length,
      },
      people: list.sort((a, b) => b.payable - a.payable || b.credited - a.credited).map(p => publicPerson(p, nameOf[p.salesmanId] || p.salesmanId, codeOf[p.salesmanId] || '')),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[SALES INCENTIVE API]', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
