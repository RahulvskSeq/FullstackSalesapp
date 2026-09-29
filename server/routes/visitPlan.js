import express from 'express';
import { protect, hasFeature } from '../middleware/auth.js';
import Dealer from '../models/Dealer.js';
import User from '../models/User.js';
import VisitPlan from '../models/VisitPlan.js';
import Visit from '../models/Visit.js';

/**
 * Visit calendar.
 *   GET    /api/visit-plan?from&to[&salesmanId]   plans in a date range (+ canPlan for the caller)
 *   POST   /api/visit-plan                          { date, salesmanId, dealerId, note, collectTarget }
 *   PUT    /api/visit-plan/:id                      { note, salesmanNote, order, status, date, dealerId (replace) }
 *   DELETE /api/visit-plan/:id
 *
 * Who may do what:
 *   - a planner (admin, or anyone with the "visitPlan" permission — the sales
 *     head) puts dealers on any salesman's day, replaces or cancels them, and
 *     can mark a visit done;
 *   - a salesman adds dealers to his own day, writes his own note, and removes
 *     a dealer he added himself while the visit is still open. He cannot touch
 *     what the office put there.
 */
const router = express.Router();
const isStaff = req => ['admin', 'superadmin', 'employee'].includes(req.user?.role);
const canPlan = req => hasFeature(req, 'visitPlan');
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const todayYmd = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);   // IST
const MAX_PER_DAY = 5;   // a salesman's day holds at most this many planned visits

router.get('/', protect, async (req, res) => {
  try {
    const f = {};
    const from = YMD.test(req.query.from || '') ? req.query.from : '', to = YMD.test(req.query.to || '') ? req.query.to : '';
    if (from || to) f.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    if (!isStaff(req)) f.salesmanId = req.user.id;
    else if (req.query.salesmanId) f.salesmanId = String(req.query.salesmanId);
    const items = await VisitPlan.find(f).sort({ date: 1, salesmanId: 1, order: 1, createdAt: 1 }).lean();
    const ids = [...new Set(items.map(i => i.dealerId))];
    const dealers = new Map((await Dealer.find({ _id: { $in: ids } }, 'name zone city status perfStatus phone').lean()).map(d => [String(d._id), d]));
    const users = new Map((await User.find({}, 'id name').lean()).map(u => [u.id, u.name]));
    const planner = await canPlan(req);
    const today = todayYmd();
    // Visits made without a plan: a check-in on a day where that dealer was
    // not on the salesman's calendar. Shown on the calendar as "unplanned".
    const vf = {};
    if (from || to) vf.dateStr = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    if (!isStaff(req)) vf.userId = req.user.id;
    else if (req.query.salesmanId) vf.userId = String(req.query.salesmanId);
    const visits = await Visit.find(vf, 'userId dealerId dealerName dateStr status checkInTime checkOutTime checkInCity').sort({ checkInTime: 1 }).lean();
    const nm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const planned = new Set();
    for (const i of items) {
      planned.add(i.date + '|' + i.salesmanId + '|' + i.dealerId);
      planned.add(i.date + '|' + i.salesmanId + '|n:' + nm(dealers.get(i.dealerId)?.name || i.dealerName));
    }
    const seen = new Set();
    const unplanned = [];
    for (const v of visits) {
      if (!v.dateStr) continue;
      const k1 = v.dateStr + '|' + v.userId + '|' + (v.dealerId || '-'), k2 = v.dateStr + '|' + v.userId + '|n:' + nm(v.dealerName);
      if (planned.has(k1) || planned.has(k2) || seen.has(k2)) continue;
      seen.add(k2);
      unplanned.push({ _id: String(v._id), date: v.dateStr, salesmanId: v.userId, salesmanName: users.get(v.userId) || v.userId,
        dealerId: v.dealerId || '', dealerName: v.dealerName, city: v.checkInCity || '',
        status: v.status === 'completed' ? 'VISITED' : 'IN_PROGRESS', checkInTime: v.checkInTime, checkOutTime: v.checkOutTime });
    }
    res.json({
      unplanned,
      canPlan: planner, maxPerDay: MAX_PER_DAY,
      items: items.map(i => {
        const d = dealers.get(i.dealerId);
        const missed = i.status === 'PLANNED' && i.date < today;   // the day passed and no check-out happened
        const own = i.plannedBy === req.user.id && i.salesmanId === req.user.id;   // he put it there himself
        return { ...i, dealerName: d?.name || i.dealerName, zone: d?.zone || '', city: d?.city || '', accountStatus: d?.status || '', perfStatus: d?.perfStatus || '', phone: d?.phone || '',
          salesmanName: users.get(i.salesmanId) || i.salesmanId, plannedByName: i.plannedByName || users.get(i.plannedBy) || i.plannedBy || '',
          missed, selfAdded: i.plannedBy === i.salesmanId, canRemove: planner || (own && i.status !== 'DONE'), canEditNote: planner || own };
      }),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { date, salesmanId, dealerId, note, collectTarget } = req.body || {};
    if (!YMD.test(date || '') || !salesmanId || !dealerId) return res.status(400).json({ error: 'date, salesmanId and dealerId are required' });
    const planner = await canPlan(req);
    const self = !planner && salesmanId === req.user.id && !isStaff(req);
    if (!planner && !self) return res.status(403).json({ error: 'you can add dealers to your own day only' });
    if (self && date < todayYmd()) return res.status(400).json({ error: 'that day is over' });
    const d = await Dealer.findById(dealerId, 'name salesman').lean(); if (!d) return res.status(404).json({ error: 'dealer not found' });
    // a salesman plans his own dealers — another rep's dealer would open to him as 'not your dealer'
    if (self && d.salesman !== req.user.id) return res.status(403).json({ error: 'you can add only your own dealers' });
    const me = await User.findOne({ id: req.user.id }, 'name').lean();
    const dup = await VisitPlan.findOne({ date, salesmanId, dealerId }).lean();
    if (dup) return res.status(400).json({ error: `${d.name} is already on the list for ${date}` });
    const order = await VisitPlan.countDocuments({ date, salesmanId });
    if (order >= MAX_PER_DAY) return res.status(400).json({ error: `${MAX_PER_DAY} dealers a day is the limit — ${date} is full` });
    const text = String(note || '').slice(0, 1000);
    const p = await VisitPlan.create({ date, salesmanId, dealerId: String(d._id), dealerName: d.name, order,
      // the office writes the instruction; a salesman's own words stay his note
      note: self ? '' : text, salesmanNote: self ? text : '',
      collectTarget: self ? 0 : Math.max(0, Number(collectTarget) || 0), plannedBy: req.user.id, plannedByName: me?.name || req.user.id });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const p = await VisitPlan.findById(req.params.id); if (!p) return res.status(404).json({ error: 'not found' });
    const planner = await canPlan(req);
    const mine = p.salesmanId === req.user.id;
    const own = mine && p.plannedBy === req.user.id;
    if (!planner && !mine) return res.status(403).json({ error: 'not your day' });
    const b = req.body || {};
    // a salesman can always write his own note on his own day
    if (b.salesmanNote !== undefined && (planner || mine)) p.salesmanNote = String(b.salesmanNote || '').slice(0, 1000);
    if (planner || own) {
      if (b.note !== undefined) p.note = String(b.note || '').slice(0, 1000);
      if (b.order !== undefined) p.order = Number(b.order) || 0;
      if (YMD.test(b.date || '') && b.date !== p.date) {
        // moving to another day follows the same rules as adding to it
        if (!planner && b.date < todayYmd()) return res.status(400).json({ error: 'that day is over' });
        if (await VisitPlan.exists({ date: b.date, salesmanId: p.salesmanId, dealerId: p.dealerId, _id: { $ne: p._id } })) return res.status(400).json({ error: `${p.dealerName} is already on ${b.date}` });
        if (await VisitPlan.countDocuments({ date: b.date, salesmanId: p.salesmanId, _id: { $ne: p._id } }) >= MAX_PER_DAY) return res.status(400).json({ error: `${MAX_PER_DAY} dealers a day is the limit — ${b.date} is full` });
        p.date = b.date;
      }
      // replace the dealer, keeping the note and the slot
      if (b.dealerId && String(b.dealerId) !== p.dealerId) {
        const d = await Dealer.findById(b.dealerId, 'name').lean(); if (!d) return res.status(404).json({ error: 'dealer not found' });
        const dup = await VisitPlan.findOne({ date: p.date, salesmanId: p.salesmanId, dealerId: String(d._id), _id: { $ne: p._id } }).lean();
        if (dup) return res.status(400).json({ error: `${d.name} is already on that day` });
        p.dealerId = String(d._id); p.dealerName = d.name; p.status = 'PLANNED'; p.momId = '';
      }
    }
    if (planner) {
      if (b.collectTarget !== undefined) p.collectTarget = Math.max(0, Number(b.collectTarget) || 0);
      if (['PLANNED', 'DONE', 'SKIPPED'].includes(b.status)) p.status = b.status;
    }
    await p.save(); res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const p = await VisitPlan.findById(req.params.id); if (!p) return res.status(404).json({ error: 'not found' });
    const planner = await canPlan(req);
    const own = p.salesmanId === req.user.id && p.plannedBy === req.user.id;
    if (!planner && !(own && p.status !== 'DONE')) return res.status(403).json({ error: 'only the office can remove a dealer it planned' });
    await VisitPlan.deleteOne({ _id: p._id }); res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
