import express from 'express';
import Dealer from '../models/Dealer.js';
import User from '../models/User.js';
import DealerTarget from '../models/DealerTarget.js';
import { protect, hasFeature } from '../middleware/auth.js';
import { ACCOUNT_STATUSES, normalizeAccountStatus } from '../lib/accountStatus.js';

/**
 * Sheets → Dealers target.
 *
 * One row per dealer for a month: the last 6 months' sales, their 6- and 3-month
 * averages, a suggested target (3-month average + 10%), and the status and target
 * for the month. The office edits it; a salesman sees his own dealers and edits
 * them only when he holds the `editDealerTargets` action.
 *
 * Rule: a dealer with no sales in the last 3 months gets a target only after its
 * status is set to REACTIVE.
 */
const router = express.Router();
const STAFF = ['admin', 'superadmin', 'employee'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YM = /^\d{4}-(0[1-9]|1[0-2])$/;
const nowYM = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 7);   // IST
const label = (y, m) => MON[m - 1] + '-' + String(y).slice(-2);                        // 2026,4 → 'Apr-26'
const TIER = { STAR: 0, 'KEY ACCOUNT': 1, ACHIEVER: 2, REACTIVE: 3 };

// the 6 months before `ym`, oldest first
function prevMonths(ym, n = 6) {
  let [y, m] = ym.split('-').map(Number);
  const out = [];
  for (let i = 0; i < n; i++) { m--; if (m < 1) { m = 12; y--; } out.unshift(label(y, m)); }
  return out;
}

async function canEdit(req) {
  if (req.user?.role === 'superadmin') return true;
  return hasFeature(req, 'editDealerTargets');
}

async function sheetFor(req, month) {
  const own = req.user.role === 'salesman' ? req.user.id : '';
  const want = !own && req.query.salesmanId ? String(req.query.salesmanId) : '';
  const q = own ? { salesman: own } : want ? { salesman: want } : {};
  const labels = prevMonths(month, 6);
  const proj = 'name city zone state salesman status perfStatus ' + labels.map(l => 'monthlyData.' + l).join(' ');
  const [dealers, saved, users] = await Promise.all([
    Dealer.find(q, proj).lean(),
    DealerTarget.find({ month, ...(own ? { salesmanId: own } : want ? { salesmanId: want } : {}) }).lean(),
    User.find({}, 'id name').lean(),
  ]);
  const savedBy = new Map(saved.map(s => [s.dealerId, s]));
  const nameOf = new Map(users.map(u => [u.id, u.name]));
  const rows = dealers.map(d => {
    const md = d.monthlyData instanceof Map ? Object.fromEntries(d.monthlyData) : (d.monthlyData || {});
    const sales = labels.map(l => Math.round(Number(md[l]?.achieved) || 0));
    const avg6 = Math.round(sales.reduce((a, b) => a + b, 0) / 6);
    const avg3raw = sales.slice(3).reduce((a, b) => a + b, 0) / 3;
    const avg3 = Math.round(avg3raw);
    const auto = Math.round(avg3raw * 1.1);
    const statusNow = normalizeAccountStatus(d.status) || 'NONE';
    const s = savedBy.get(String(d._id));
    return {
      dealerId: String(d._id), name: d.name, city: d.city || '', zone: d.zone || '', state: d.state || '',
      salesmanId: d.salesman || '', salesmanName: nameOf.get(d.salesman) || d.salesman || '',
      statusNow, perfStatus: d.perfStatus || '', sales, avg6, avg3, auto, noSales: sales.slice(3).every(v => !v),
      saved: s ? { status: s.status, target: s.target, by: s.changedByName || s.changedBy, at: s.updatedAt } : null,
    };
  });
  rows.sort((a, b) => ((TIER[a.saved?.status ?? a.statusNow] ?? 9) - (TIER[b.saved?.status ?? b.statusNow] ?? 9)) || (b.avg3 - a.avg3) || a.name.localeCompare(b.name));
  return { month, monthLabel: label(...month.split('-').map(Number)), salesMonths: labels, rows };
}

// GET /api/dealer-targets?month=YYYY-MM[&salesmanId=]
router.get('/', protect, async (req, res) => {
  try {
    const month = YM.test(req.query.month || '') ? req.query.month : nowYM();
    const out = await sheetFor(req, month);
    res.json({ ...out, canEdit: await canEdit(req), statuses: ACCOUNT_STATUSES });
  } catch (e) { console.error('[DEALER-TARGETS]', e.message); res.status(500).json({ error: e.message }); }
});

// PUT /api/dealer-targets  { month, items:[{ dealerId, status, target }] }
router.put('/', protect, async (req, res) => {
  try {
    if (!(await canEdit(req))) return res.status(403).json({ error: 'You are not allowed to edit dealer targets — ask the admin.' });
    const month = YM.test(req.body?.month || '') ? req.body.month : '';
    if (!month) return res.status(400).json({ error: 'month (YYYY-MM) required' });
    const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 5000) : [];
    if (!items.length) return res.json({ saved: 0 });
    const labels = prevMonths(month, 6);
    const ids = items.map(i => String(i.dealerId || '')).filter(id => /^[a-f0-9]{24}$/i.test(id));
    const dealers = new Map((await Dealer.find({ _id: { $in: ids } }, 'name salesman status ' + labels.map(l => 'monthlyData.' + l).join(' ')).lean()).map(d => [String(d._id), d]));
    const me = await User.findOne({ id: req.user.id }, 'name').lean();
    const own = req.user.role === 'salesman' ? req.user.id : '';
    const problems = [], ops = [];
    for (const it of items) {
      const d = dealers.get(String(it.dealerId));
      if (!d) { problems.push(`${it.dealerId}: dealer not found`); continue; }
      if (own && d.salesman !== own) { problems.push(`${d.name}: not your dealer`); continue; }
      const status = normalizeAccountStatus(it.status) || 'NONE';
      if (!ACCOUNT_STATUSES.includes(status)) { problems.push(`${d.name}: unknown status ${it.status}`); continue; }
      const target = Math.round(Number(it.target));
      if (!Number.isFinite(target) || target < 0) { problems.push(`${d.name}: target must be 0 or more`); continue; }
      const md = d.monthlyData instanceof Map ? Object.fromEntries(d.monthlyData) : (d.monthlyData || {});
      const sales = labels.map(l => Math.round(Number(md[l]?.achieved) || 0));
      const last3 = sales.slice(3);
      const avg3raw = last3.reduce((a, b) => a + b, 0) / 3;
      // no sales in 3 months: a target only once the party is marked REACTIVE
      if (target > 0 && last3.every(v => !v) && status !== 'REACTIVE') { problems.push(`${d.name}: no sales in 3 months — set status REACTIVE first`); continue; }
      ops.push({ updateOne: { filter: { month, dealerId: String(d._id) }, upsert: true, update: { $set: {
        dealerName: d.name, salesmanId: d.salesman || '', status, statusBefore: normalizeAccountStatus(d.status) || 'NONE', target,
        auto: Math.round(avg3raw * 1.1), avg3: Math.round(avg3raw), avg6: Math.round(sales.reduce((a, b) => a + b, 0) / 6),
        sales, salesMonths: labels, changedBy: req.user.id, changedByName: me?.name || req.user.id,
      } } } });
    }
    if (problems.length) return res.status(400).json({ error: problems.slice(0, 5).join(' · ') + (problems.length > 5 ? ` (+${problems.length - 5} more)` : ''), problems });
    if (ops.length) await DealerTarget.bulkWrite(ops, { ordered: false });
    res.json({ saved: ops.length });
  } catch (e) { console.error('[DEALER-TARGETS save]', e.message); res.status(500).json({ error: e.message }); }
});

// GET /api/dealer-targets/xlsx?month=&salesmanId= — the same sheet as an Excel file
router.get('/xlsx', protect, async (req, res) => {
  try {
    const month = YM.test(req.query.month || '') ? req.query.month : nowYM();
    const { monthLabel, salesMonths, rows } = await sheetFor(req, month);
    const { default: ExcelJS } = await import('exceljs');
    const wb = new ExcelJS.Workbook(); wb.creator = 'Sales Tracker Pro';
    const ws = wb.addWorksheet('Dealers target ' + monthLabel, { views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] });
    ws.columns = [
      { header: 'Dealer', key: 'name', width: 34 }, { header: 'City', key: 'city', width: 16 }, { header: 'Zone', key: 'zone', width: 10 },
      { header: 'Salesman', key: 'sm', width: 16 }, { header: 'Performance', key: 'perf', width: 18 }, { header: 'Status now', key: 'now', width: 13 },
      { header: 'Status ' + monthLabel, key: 'st', width: 14 }, { header: 'Auto (3M +10%)', key: 'auto', width: 14 }, { header: 'Target ' + monthLabel, key: 'tg', width: 13 },
      ...salesMonths.map(l => ({ header: l, key: l, width: 9 })),
      { header: '6M avg', key: 'avg6', width: 9 }, { header: '3M avg', key: 'avg3', width: 9 }, { header: 'Saved by', key: 'by', width: 16 },
    ];
    for (const r of rows) ws.addRow({ name: r.name, city: r.city, zone: r.zone, sm: r.salesmanName, perf: r.perfStatus, now: r.statusNow,
      ...Object.fromEntries(salesMonths.map((l, i) => [l, r.sales[i]])), avg6: r.avg6, avg3: r.avg3, auto: r.auto,
      st: r.saved?.status ?? r.statusNow, tg: r.saved ? r.saved.target : (r.noSales ? 0 : r.auto), by: r.saved?.by || '' });
    const h = ws.getRow(1); h.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    h.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="dealers-target-${monthLabel}.xlsx"`);
    await wb.xlsx.write(res); res.end();
  } catch (e) { console.error('[DEALER-TARGETS xlsx]', e.message); res.status(500).json({ error: e.message }); }
});

export default router;
