import express from 'express';
import { protect } from '../middleware/auth.js';
import Dealer from '../models/Dealer.js';
import User from '../models/User.js';
import VisitPlan from '../models/VisitPlan.js';
import DealerMom from '../models/DealerMom.js';

/**
 * Visit calendar.
 *   GET    /api/visit-plan?from&to[&salesmanId]   plans in a date range
 *   POST   /api/visit-plan                          { date, salesmanId, dealerId, note }
 *   PUT    /api/visit-plan/:id                      { note, salesmanNote, order, status }
 *   DELETE /api/visit-plan/:id
 * Staff plan for anyone; a salesman sees and comments on his own days.
 */
const router = express.Router();
const isStaff = req => ['admin', 'superadmin', 'employee'].includes(req.user?.role);
const YMD = /^\d{4}-\d{2}-\d{2}$/;

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
    res.json({ items: items.map(i => { const d = dealers.get(i.dealerId); return { ...i, dealerName: d?.name || i.dealerName, zone: d?.zone || '', city: d?.city || '', accountStatus: d?.status || '', perfStatus: d?.perfStatus || '', phone: d?.phone || '', salesmanName: users.get(i.salesmanId) || i.salesmanId }; }) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { date, salesmanId, dealerId, note, collectTarget } = req.body || {};
    if (!YMD.test(date || '') || !salesmanId || !dealerId) return res.status(400).json({ error: 'date, salesmanId and dealerId are required' });
    if (!isStaff(req)) return res.status(403).json({ error: 'the office plans the calendar; salesmen only see it' });
    const d = await Dealer.findById(dealerId, 'name').lean(); if (!d) return res.status(404).json({ error: 'dealer not found' });
    const me = await User.findOne({ id: req.user.id }, 'name').lean();
    const dup = await VisitPlan.findOne({ date, salesmanId, dealerId }).lean();
    if (dup) return res.status(400).json({ error: `${d.name} is already on ${salesmanId}'s list for ${date}` });
    const order = await VisitPlan.countDocuments({ date, salesmanId });
    const p = await VisitPlan.create({ date, salesmanId, dealerId: String(d._id), dealerName: d.name, order, note: String(note || '').slice(0, 1000), collectTarget: Math.max(0, Number(collectTarget) || 0), plannedBy: req.user.id, plannedByName: me?.name || req.user.id });
    res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const p = await VisitPlan.findById(req.params.id); if (!p) return res.status(404).json({ error: 'not found' });
    if (!isStaff(req)) return res.status(403).json({ error: 'the office plans the calendar; salesmen only see it' });
    const b = req.body || {};
    if (b.note !== undefined) p.note = String(b.note || '').slice(0, 1000);
    if (b.collectTarget !== undefined) p.collectTarget = Math.max(0, Number(b.collectTarget) || 0);
    if (b.order !== undefined) p.order = Number(b.order) || 0;
    if (YMD.test(b.date || '')) p.date = b.date;
    if (b.salesmanNote !== undefined) p.salesmanNote = String(b.salesmanNote || '').slice(0, 1000);
    if (['PLANNED', 'DONE', 'SKIPPED'].includes(b.status)) p.status = b.status;
    await p.save(); res.json(p);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const p = await VisitPlan.findById(req.params.id); if (!p) return res.status(404).json({ error: 'not found' });
    if (!isStaff(req)) return res.status(403).json({ error: 'the office plans the calendar; salesmen only see it' });
    await VisitPlan.deleteOne({ _id: p._id }); res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
