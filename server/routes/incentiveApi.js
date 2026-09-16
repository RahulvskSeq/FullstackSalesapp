import express from 'express';
import { getIncentiveConfig, allIncentiveMonths, unitsByMonth, unitsBetween, scoreMonth } from './producttx.js';
import { lookbackMonthsFor, onRoster } from '../lib/incentive.js';

/**
 * Read-only billing-incentive API for other software.
 *
 *   GET /api/external/incentive/months                 → months that have figures
 *   GET /api/external/incentive?month=YYYY-MM          → everyone's incentive for that month
 *   GET /api/external/incentive?from=YYYY-MM-DD&to=YYYY-MM-DD
 *                                                     → units billed in that window, scored
 *                                                       against the target of the month `to` is in
 *   GET /api/external/incentive?month=…&person=Shashikala
 *                                                     → one person (name or code, case-insensitive)
 *
 * Auth: header `X-API-Key: <INCENTIVE_API_KEY>` (or `?key=`). No login, no
 * cookies — the key lives in the server .env only. Nothing here writes.
 *
 * The numbers come from the same functions the Incentive page uses, so what
 * the other system shows and what accounts sees here can never disagree.
 */
const router = express.Router();

const requireKey = (req, res, next) => {
  const expected = process.env.INCENTIVE_API_KEY;
  if (!expected) return res.status(503).json({ error: 'Incentive API not configured — set INCENTIVE_API_KEY in server .env' });
  const key = req.headers['x-api-key'] || req.query.key;
  if (!key || String(key) !== String(expected)) return res.status(401).json({ error: 'Invalid API key' });
  next();
};
router.use(requireKey);

const isMonth = v => /^\d{4}-\d{2}$/.test(String(v || ''));
const isDay   = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || ''));

/** A person as the outside world should see it — no internal history arrays. */
const publicPerson = p => ({
  name: p.display || p.name,
  code: p.code || '',
  key: p.name,
  units: p.units,
  lines: p.lines,
  invoices: p.invoices,
  average: p.average,
  averageSource: p.averageSource,           // history | opening | none
  monthsOfHistory: p.monthsOfHistory,
  target: p.target,                          // units that must be beaten for the higher rate
  topThreshold: p.top,                       // units above which every unit is paid at the high rate
  band: p.band,                              // base | mid | top
  calculation: p.detail,                     // e.g. "1,200 × ₹2 + 300 × ₹5"
  grossAmount: p.grossAmount,
  deduction: p.deduction,
  deductionPct: p.deductionPct,
  amount: p.amount,                          // net, what is paid
  grossPoints: p.grossPoints,
  points: p.points,
  unitsToNextBand: p.next?.units ?? null,
});

router.get('/months', async (req, res) => {
  try { res.json({ months: await allIncentiveMonths() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', async (req, res) => {
  try {
    const config = await getIncentiveConfig();
    const months = await allIncentiveMonths();
    const from = isDay(req.query.from) ? String(req.query.from) : '';
    const to   = isDay(req.query.to)   ? String(req.query.to)   : '';
    const ranged = !!(from && to && from <= to);
    const month = ranged ? to.slice(0, 7) : (isMonth(req.query.month) ? String(req.query.month) : (months[0] || ''));
    if (!month) return res.json({ month: '', range: null, source: '', people: [], totals: { people: 0, units: 0, grossAmount: 0, deduction: 0, amount: 0, grossPoints: 0, points: 0 }, months: [] });
    if (!ranged && !months.includes(month)) return res.status(404).json({ error: `No figures for ${month}`, months });

    const lookback = lookbackMonthsFor(month, config);
    const { byMonth, source } = await unitsByMonth([...new Set([month, ...lookback])], config);
    let range = null;
    if (ranged) {
      const r = await unitsBetween(from, to, config);
      range = { from, to, daysWithData: r.days.length, missingMonths: r.missingMonths };
      const filtered = new Map();
      for (const [person, e] of r.byPerson) if (onRoster(person, config)) filtered.set(person, e);
      byMonth.set(month, filtered);
    }
    const { people, totals } = scoreMonth(month, byMonth, config);

    const q = String(req.query.person || '').trim().toLowerCase();
    const list = q ? people.filter(p => [p.name, p.display, p.code].some(v => String(v || '').toLowerCase() === q)) : people;
    if (q && !list.length) return res.status(404).json({ error: `No person "${req.query.person}" in ${month}`, people: people.map(p => ({ name: p.display || p.name, code: p.code || '' })) });

    res.json({
      month,
      range,
      source: ranged ? 'upload' : (source.get(month) || 'erp'),   // upload = sheet, erp = invoice lines
      rates: { low: config.rateLow, high: config.rateHigh, deductionPct: config.deductionPct, pointsPerRupee: config.pointsPerRupee },
      lookbackMonths: lookback,
      totals: q ? {
        people: list.length,
        units: list.reduce((a, p) => a + p.units, 0),
        grossAmount: Math.round(list.reduce((a, p) => a + p.grossAmount, 0) * 100) / 100,
        deduction: Math.round(list.reduce((a, p) => a + p.deduction, 0) * 100) / 100,
        amount: Math.round(list.reduce((a, p) => a + p.amount, 0) * 100) / 100,
        grossPoints: list.reduce((a, p) => a + p.grossPoints, 0),
        points: list.reduce((a, p) => a + p.points, 0),
      } : totals,
      people: list.map(publicPerson),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[INCENTIVE API]', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
