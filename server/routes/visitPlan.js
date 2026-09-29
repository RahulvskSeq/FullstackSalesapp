import express from 'express';
import { protect, hasFeature } from '../middleware/auth.js';
import Dealer from '../models/Dealer.js';
import User from '../models/User.js';
import VisitPlan from '../models/VisitPlan.js';
import Visit from '../models/Visit.js';
import mongoose from 'mongoose';
import SampleAllocation from '../models/SampleAllocation.js';
import { sampleListsFor } from './dealerVisit.js';

/**
 * Visit calendar.
 *   GET    /api/visit-plan?from&to[&salesmanId]   plans in a date range (+ canPlan for the caller)
 *   POST   /api/visit-plan                          { date, salesmanId, dealerId, note, collectTarget }
 *   PUT    /api/visit-plan/:id                      { note, salesmanNote, order, status, date, dealerId (replace) }
 *   DELETE /api/visit-plan/:id
 *   GET    /api/visit-plan/carry?date[&salesmanId]   the "to be shown" samples to pack for that day
 *   GET    /api/visit-plan/coverage?month[&salesmanId] STAR / KEY ACCOUNT / ACHIEVER dealers: met, planned only, not met
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
    const dealers = new Map((await Dealer.find({ _id: { $in: ids.filter(i => mongoose.isValidObjectId(i)) } }, 'name zone city status perfStatus phone').lean()).map(d => [String(d._id), d]));
    const users = new Map((await User.find({}, 'id name').lean()).map(u => [u.id, u.name]));
    const planner = await canPlan(req);
    const today = todayYmd();
    // Visits made without a plan: a check-in on a day where that dealer was
    // not on the salesman's calendar. Shown on the calendar as "unplanned".
    const vf = {};
    if (from || to) vf.dateStr = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    if (!isStaff(req)) vf.userId = req.user.id;
    else if (req.query.salesmanId) vf.userId = String(req.query.salesmanId);
    const visits = await Visit.find(vf, 'userId dealerId dealerName dateStr status checkInTime checkOutTime checkInCity planId').sort({ checkInTime: 1 }).lean();
    const nm = s => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const planned = new Set();
    for (const i of items) {
      planned.add(i.date + '|' + i.salesmanId + '|' + i.dealerId);
      planned.add(i.date + '|' + i.salesmanId + '|n:' + nm(dealers.get(i.dealerId)?.name || i.dealerName));
    }
    const seen = new Set();
    const unplanned = [];
    for (const v of visits) {
      if (!v.dateStr || v.planId) continue;                       // a visit made from a plan is planned
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

// What to pack before leaving: every "to be shown" sample for the dealers on a day's
// calendar (same rule as the dealer popup). A sample wanted by two dealers is carried
// once, so the answer gives one de-duplicated list per salesman plus the per-dealer view.
router.get('/carry', protect, async (req, res) => {
  try {
    const date = YMD.test(req.query.date || '') ? req.query.date : todayYmd();
    const salesmanId = !isStaff(req) ? req.user.id : (req.query.salesmanId ? String(req.query.salesmanId) : '');
    res.json(await carryList({ date, salesmanId }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// The month's top dealers — STAR, KEY ACCOUNT, ACHIEVER — and whether anyone met them:
// MET (a visit that month), PLANNED_ONLY (on the calendar but no visit) or NOT_MET (neither).
// A salesman sees his own dealers; the office sees everyone's, or one salesman's.
router.get('/coverage', protect, async (req, res) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || '') ? req.query.month : todayYmd().slice(0, 7);
    const salesmanId = !isStaff(req) ? req.user.id : (req.query.salesmanId ? String(req.query.salesmanId) : '');
    res.json(await coverage({ month, salesmanId }));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export const TOP_TIERS = ['STAR', 'KEY ACCOUNT', 'ACHIEVER'];
/** Exported so it can be checked without HTTP. */
export async function coverage({ month, salesmanId = '' }) {
  const from = month + '-01', to = month + '-31', today = todayYmd();
  const df = { status: { $in: TOP_TIERS }, active: { $ne: false } };
  if (salesmanId) df.salesman = salesmanId;
  const dealers = await Dealer.find(df, 'name status zone city salesman perfQty').lean();
  const ids = dealers.map(d => String(d._id));
  const nm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const byName = new Map(dealers.map(d => [nm(d.name), String(d._id)]));
  const [users, plans, visits, lastEver] = await Promise.all([
    User.find({}, 'id name').lean(),
    VisitPlan.find({ date: { $gte: from, $lte: to }, dealerId: { $in: ids } }, 'dealerId date salesmanId status').lean(),
    Visit.find({ dateStr: { $gte: from, $lte: to }, $or: [{ dealerId: { $in: ids } }, { dealerName: { $in: dealers.map(d => d.name) } }] }, 'dealerId dealerName dateStr userId status').lean(),
    Visit.aggregate([{ $match: { dealerId: { $in: ids } } }, { $group: { _id: '$dealerId', at: { $max: '$dateStr' } } }]),
  ]);
  const nameOf = Object.fromEntries(users.map(u => [u.id, u.name]));
  const last = new Map(lastEver.map(r => [String(r._id), r.at]));
  const met = new Map();       // dealerId -> [{ date, by }]
  for (const v of visits) {
    const id = v.dealerId && ids.includes(String(v.dealerId)) ? String(v.dealerId) : byName.get(nm(v.dealerName));
    if (!id) continue;
    (met.get(id) || met.set(id, []).get(id)).push({ date: v.dateStr, by: nameOf[v.userId] || v.userId });
    if (!last.get(id) || v.dateStr > last.get(id)) last.set(id, v.dateStr);
  }
  const planned = new Map();   // dealerId -> [{ date, status }]
  for (const p of plans) (planned.get(p.dealerId) || planned.set(p.dealerId, []).get(p.dealerId)).push({ date: p.date, status: p.status, upcoming: p.date >= today && p.status === 'PLANNED' });
  const rank = t => TOP_TIERS.indexOf(t);
  const rows = dealers.map(d => {
    const id = String(d._id), m = (met.get(id) || []).sort((a, b) => a.date.localeCompare(b.date)), pl = (planned.get(id) || []).sort((a, b) => a.date.localeCompare(b.date));
    return { id, name: d.name, tier: d.status, zone: d.zone || '', city: d.city || '', salesmanId: d.salesman || '', salesmanName: nameOf[d.salesman] || d.salesman || '',
      status: m.length ? 'MET' : pl.length ? 'PLANNED_ONLY' : 'NOT_MET', visits: m, planned: pl, lastVisit: last.get(id) || '', perfQty: d.perfQty || 0 };
  }).sort((a, b) => rank(a.tier) - rank(b.tier) || (b.perfQty - a.perfQty) || a.name.localeCompare(b.name));
  const count = s => rows.filter(r => r.status === s).length;
  return { month, rows, totals: { dealers: rows.length, met: count('MET'), plannedOnly: count('PLANNED_ONLY'), notMet: count('NOT_MET') } };
}

/** Exported so it can be checked without HTTP. */
export async function carryList({ date, salesmanId = '' }) {
    const f = { date, status: { $ne: 'SKIPPED' } };
    if (salesmanId) f.salesmanId = salesmanId;
    const plans = await VisitPlan.find(f).sort({ salesmanId: 1, order: 1, createdAt: 1 }).lean();
    const ids = [...new Set(plans.map(p => String(p.dealerId)).filter(Boolean))];
    const Sample = mongoose.models.Sample, SampleGiven = mongoose.models.SampleGiven;
    const oids = ids.filter(i => mongoose.isValidObjectId(i));
    const [dealerRows, users, allocs, master] = await Promise.all([
      Dealer.find({ _id: { $in: oids } }, 'name zone city').lean(),
      User.find({}, 'id name').lean(),
      SampleAllocation.find({ dealerId: { $in: ids }, status: { $in: ['REQUESTED', 'ALLOCATED', 'GIVEN'] } }).lean(),
      Sample ? Sample.find({ active: true }).sort({ createdAt: -1, name: 1 }).lean() : [],
    ]);
    const dealers = new Map(dealerRows.map(d => [String(d._id), d]));
    const esc = x => String(x).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const names = dealerRows.map(d => d.name).filter(Boolean);
    const given = SampleGiven ? await SampleGiven.find({ $or: [{ dealerId: { $in: ids } }, ...(names.length ? [{ dealerName: { $in: names.map(n => new RegExp(`^${esc(n)}$`, 'i')) } }] : [])] }, 'dealerId dealerName sampleId').lean() : [];
    const nameOf = Object.fromEntries(users.map(u => [u.id, u.name]));
    const norm = x => String(x || '').toUpperCase().replace(/\s+/g, ' ').trim();

    const groups = new Map();   // salesmanId -> { dealers: [], carry: Map(key -> row) }
    const done = new Set();
    for (const p of plans) {
      const id = String(p.dealerId), d = dealers.get(id);
      if (done.has(p.salesmanId + '|' + id)) continue;           // same dealer twice on one day: pack once
      done.add(p.salesmanId + '|' + id);
      let items = [];
      if (d) {
        const mine = allocs.filter(a => String(a.dealerId) === id);
        const his = given.filter(g => String(g.dealerId) === id || norm(g.dealerName) === norm(d.name));
        const { toGive, toShow } = sampleListsFor(d, { allocs: mine, master, given: his });
        items = [
          ...toGive.map(a => ({ key: a.sampleId ? 's:' + a.sampleId : 'n:' + norm(a.sampleName), name: a.sampleName, give: true })),
          ...toShow.map(x => ({ key: 's:' + String(x._id), name: x.name, zone: x.zone || '', stock: x.stock || 0 })),
        ];
        const seen = new Set(); items = items.filter(i => !seen.has(i.key) && seen.add(i.key));
      }
      if (!groups.has(p.salesmanId)) groups.set(p.salesmanId, { dealers: [], carry: new Map() });
      const g = groups.get(p.salesmanId);
      const dealerName = d?.name || p.dealerName || id;
      g.dealers.push({ dealerId: id, name: dealerName, city: d?.city || '', zone: d?.zone || '', status: p.status, samples: items.map(i => i.name), give: items.filter(i => i.give).map(i => i.name) });
      for (const i of items) {
        const row = g.carry.get(i.key) || { name: i.name, zone: i.zone || '', stock: i.stock || 0, dealers: [], giveTo: [] };
        row.dealers.push(dealerName);
        if (i.give) row.giveTo.push(dealerName);
        g.carry.set(i.key, row);
      }
    }
    const salesmen = [...groups.entries()].map(([sid, g]) => ({
      salesmanId: sid, salesmanName: nameOf[sid] || sid,
      dealers: g.dealers,
      carry: [...g.carry.values()].sort((a, b) => b.dealers.length - a.dealers.length || a.name.localeCompare(b.name)),
    })).sort((a, b) => a.salesmanName.localeCompare(b.salesmanName));
    return { date, salesmen };
}

router.post('/', protect, async (req, res) => {
  try {
    const { date, salesmanId, dealerId, note, collectTarget } = req.body || {};
    const newPartyName = String(req.body?.newPartyName || '').replace(/\s+/g, ' ').trim().slice(0, 150);
    if (!YMD.test(date || '') || !salesmanId || (!dealerId && !newPartyName)) return res.status(400).json({ error: 'date, salesmanId and a dealer (or a new party name) are required' });
    const planner = await canPlan(req);
    const self = !planner && salesmanId === req.user.id && !isStaff(req);
    if (!planner && !self) return res.status(403).json({ error: 'you can add dealers to your own day only' });
    if (self && date < todayYmd()) return res.status(400).json({ error: 'that day is over' });
    if (!dealerId) {
      // a party that is not in the dealer list yet — its real details are taken at check-out
      if (newPartyName.length < 3) return res.status(400).json({ error: 'type the party name (at least 3 letters)' });
      const esc = newPartyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (await VisitPlan.exists({ date, salesmanId, dealerName: new RegExp(`^\\s*${esc}\\s*$`, 'i') })) return res.status(400).json({ error: `${newPartyName} is already on the list for ${date}` });
      const known = await Dealer.findOne({ name: new RegExp(`^\\s*${esc}\\s*$`, 'i') }, 'name').lean();
      if (known) return res.status(400).json({ error: `${known.name} is already in the dealer list — pick it from the list instead` });
      const count = await VisitPlan.countDocuments({ date, salesmanId });
      if (count >= MAX_PER_DAY) return res.status(400).json({ error: `${MAX_PER_DAY} dealers a day is the limit — ${date} is full` });
      const me = await User.findOne({ id: req.user.id }, 'name').lean();
      const text = String(note || '').slice(0, 1000);
      const p = await VisitPlan.create({ date, salesmanId, dealerId: 'new:' + new mongoose.Types.ObjectId().toString(), dealerName: newPartyName, newParty: true, order: count,
        note: self ? '' : text, salesmanNote: self ? text : '', collectTarget: 0, plannedBy: req.user.id, plannedByName: me?.name || req.user.id });
      return res.json(p);
    }
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
        p.dealerId = String(d._id); p.dealerName = d.name; p.status = 'PLANNED'; p.momId = ''; p.newParty = false;
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
