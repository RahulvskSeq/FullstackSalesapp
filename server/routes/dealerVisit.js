import express from 'express';
import mongoose from 'mongoose';
import { protect, requireFeature } from '../middleware/auth.js';
import Dealer from '../models/Dealer.js';
import User from '../models/User.js';
import Visit from '../models/Visit.js';
import DealerMom from '../models/DealerMom.js';
import SampleAllocation from '../models/SampleAllocation.js';
import VisitPlan from '../models/VisitPlan.js';
import Sale from '../models/Sale.js';
import { ColBalance, ColPromise, ColPayment } from '../collections/models/index.js';
import { collectionMonthOf } from '../collections/engines/reconcile.js';

/**
 * Dealer visit — what a salesman needs in his hand when he walks into a
 * counter, in the company's MOM format, and the MOM he writes afterwards.
 *
 *   GET  /api/dealer-visit/:dealerId/summary   everything on one screen
 *   GET  /api/dealer-visit/:dealerId/moms      previous MOMs
 *   POST /api/dealer-visit/:dealerId/mom       save this visit's MOM
 *
 * Nothing here changes how any existing screen works; it reads the same
 * dealer, sales, collections and sample records they do.
 */
const router = express.Router();
const isStaff = req => ['admin', 'superadmin', 'employee'].includes(req.user?.role);

/** The same answer requireFeature() gives, as a boolean — so the screen can hide what the server would refuse. */
async function hasFeature(req, key) {
  const role = req.user?.role;
  if (role === 'superadmin') return true;
  const u = await User.findOne({ id: req.user.id }, 'permissions role').lean();
  const features = Array.isArray(u?.permissions?.features) ? u.permissions.features : [];
  if (features.length) return features.includes(key);
  const { loadRolePermissions } = await import('../lib/rolePermissions.js');
  const roleFeatures = (await loadRolePermissions())[role]?.features || [];
  if (roleFeatures.length) return roleFeatures.includes(key);
  return role === 'admin';
}
const todayYmd = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);   // IST

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const periodLabelSrv = ym => { const m = /^(\d{4})-(\d{2})$/.exec(ym || ''); return m ? `${MONTHS[+m[2] - 1]}-${m[1].slice(2)}` : ym; };
/** 'Sep-26' → '2026-09', for sorting the monthlyData keys. */
const labelToYm = l => { const m = /^([A-Za-z]{3})-(\d{2})$/.exec(String(l || '')); if (!m) return ''; const i = MONTHS.findIndex(x => x.toLowerCase() === m[1].toLowerCase()); return i < 0 ? '' : `20${m[2]}-${String(i + 1).padStart(2, '0')}`; };

async function loadDealerFor(req, res) {
  const d = await Dealer.findById(req.params.dealerId).lean();
  if (!d) { res.status(404).json({ error: 'dealer not found' }); return null; }
  if (!isStaff(req) && d.salesman !== req.user.id) { res.status(403).json({ error: 'not your dealer' }); return null; }
  return d;
}

/** The pre-visit summary. Exported so it can be checked without HTTP. */
export async function visitSummary(dealerId) {
  const d = await Dealer.findById(dealerId).lean();
  if (!d) return null;
  const id = String(d._id);
  const Sample = mongoose.models.Sample, SampleGiven = mongoose.models.SampleGiven;
  const ym3 = [0, 1, 2].map(i => { const t = new Date(); t.setMonth(t.getMonth() - i); return t.toISOString().slice(0, 7); });
  // one round trip for everything: Atlas is ~150 ms away, so sequential reads add up fast
  const t0 = todayYmd(); const back7 = new Date(Date.now() - 7 * 86400000 + 5.5 * 3600e3).toISOString().slice(0, 10);
  const [users, bal, promises, pendingRec, allocs, moms, visits, cm, master, given, bought, plans] = await Promise.all([
    User.find({}, 'id name role active').lean(),
    ColBalance.findOne({ dealerId: d._id }).lean(),
    ColPromise.find({ dealerId: d._id, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED', 'BROKEN'] } }).sort({ promiseDate: 1 }).lean(),
    ColPayment.find({ dealerId: d._id, status: 'RECORDED' }, 'date amount mode').lean(),
    SampleAllocation.find({ dealerId: id, status: { $in: ['REQUESTED', 'ALLOCATED', 'GIVEN'] } }).sort({ createdAt: -1 }).lean(),
    DealerMom.find({ dealerId: id }).sort({ date: -1, createdAt: -1 }).limit(5).lean(),
    Visit.find({ dealerId: id }).sort({ checkInTime: -1 }).limit(5).lean(),
    collectionMonthOf(),
    Sample.find({ active: true }).sort({ createdAt: -1, name: 1 }).lean(),   // newest sample first
    SampleGiven.find({ $or: [{ dealerId: id }, { dealerName: new RegExp(`^${d.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }] }).sort({ givenDate: -1 }).lean(),
    Sale.aggregate([{ $match: { dealerId: d._id, month: { $in: ym3 } } }, { $group: { _id: '$brand', qty: { $sum: '$qty' } } }]),
    VisitPlan.find({ dealerId: id, date: { $gte: back7 } }).sort({ date: 1 }).lean(),
  ]);
  const nameOf = Object.fromEntries(users.map(u => [u.id, u.name]));

  // samples: master of this zone, what he has, what is earmarked, what is to come back
  const zoneNum = (d.zone || '').match(/\d+/)?.[0];
  // zone rows: 'ZONE 5' for a Zone 5 dealer, 'All Zones' for everyone; special tags (NEW DEALERS ONLY, Architects) stay with the office
  const inZone = master.filter(s => { const z = String(s.zone || '').trim(); if (/^(all\s*zones?|general|all)$/i.test(z)) return true; const nums = [...z.matchAll(/\d+/g)].map(m => m[0]); return nums.length > 0 && zoneNum && nums.includes(zoneNum); });
  const givenIds = new Set(given.map(g => String(g.sampleId)));
  const toGive = allocs.filter(a => a.status === 'ALLOCATED');
  const toTakeBack = allocs.filter(a => a.status === 'GIVEN' && a.takeBack);
  const requested = allocs.filter(a => a.status === 'REQUESTED');
  const toShow = inZone.filter(s => !givenIds.has(String(s._id)) && !toGive.some(a => a.sampleId === String(s._id)) && !requested.some(a => a.sampleId === String(s._id)));

  // volume: this month against target, and the average of the six months before it
  const md = d.monthlyData instanceof Map ? Object.fromEntries(d.monthlyData) : (d.monthlyData || {});
  const all = Object.keys(md).map(l => ({ label: l, ym: labelToYm(l), target: Number(md[l]?.target) || 0, achieved: Number(md[l]?.achieved) || 0 }))
    .filter(m => m.ym).sort((a, b) => a.ym.localeCompare(b.ym));
  const nowYm = todayYmd().slice(0, 7);
  const cur = all.find(m => m.ym === nowYm) || all.filter(m => m.ym <= nowYm).slice(-1)[0] || null;
  const prev6 = all.filter(m => m.ym < (cur?.ym || nowYm)).slice(-6);
  const avg6 = prev6.length ? Math.round(prev6.reduce((a, m) => a + m.achieved, 0) / prev6.length) : 0;
  const months = [...prev6, ...(cur ? [cur] : [])].map(m => ({ ...m, pct: m.target > 0 ? Math.round(m.achieved / m.target * 100) : null }));
  const current = cur ? { ...cur, pct: cur.target > 0 ? Math.round(cur.achieved / cur.target * 100) : null, toGo: Math.max(0, cur.target - cur.achieved), isThisMonth: cur.ym === nowYm } : null;

  // what the dealer actually buys (last 3 months, by catalogue) — decides which samples earn their place
  const brandQty = new Map(bought.map(b => [String(b._id || '').toUpperCase(), b.qty]));
  const STOP = new Set(['FOLDER', 'FOLDERS', 'SET', 'KIT', 'KITS', 'CATALOGE', 'CATALOGUE', 'CATALOG', 'SAMPLE', 'BOX', 'BOOK', 'SHADE', 'CARD', 'CHAIN', 'SWATCH', 'THE', 'AND', 'WITH', 'NEW', 'ZONE', 'ONLY', 'DEALERS']);
  const soldFor = (sampleName) => {
    const toks = String(sampleName || '').toUpperCase().replace(/\(.*?\)/g, ' ').split(/[^A-Z0-9]+/).filter(t => t.length >= 3 && !STOP.has(t) && !/^\d+$/.test(t));
    let qty = 0, hit = '';
    for (const [brand, q] of brandQty) if (toks.some(t => brand.includes(t))) { qty += q; hit = hit || brand; }
    return { qty, brand: hit, tokens: toks };
  };
  const dealerDead = ['DEAD', 'INACTIVE', 'RECENTLY INACTIVE'].includes(d.perfStatus || '');

  const buckets = bal?.buckets instanceof Map ? Object.fromEntries(bal.buckets) : (bal?.buckets || {});
  const missing = ['phone', 'address', 'city', 'state', 'pincode'].filter(k => !String(d[k] || '').trim());

  return {
    dealer: {
      id, name: d.name, code: d.code || '', zone: d.zone || '', city: d.city || '', state: d.state || '', address: d.address || '', pincode: d.pincode || '',
      phone: d.phone || '', salesman: d.salesman || '', salesmanName: nameOf[d.salesman] || d.salesman || '',
      accountStatus: d.status || 'NONE', perfStatus: d.perfStatus || '', perfQty: d.perfQty || 0, perfMonth: d.perfMonth || '', dealerType: d.dealerType || 'None',
      creditDays: d.creditDays || 0, creditLimit: d.creditLimit || 0,
      dealerFormDone: !!d.dealerFormDone, dealerFormDoneAt: d.dealerFormDoneAt || null, dealerFormBy: nameOf[d.dealerFormBy] || d.dealerFormBy || '',
      masterMissing: missing,
    },
    volume: { months, current, avg6, avgMonths: prev6.length, latest: current },
    collections: bal ? {
      total: bal.total || 0, buckets, collectionMonth: cm, dueAmount: bal.dueAmount || 0, overdue: !!bal.overdue,
      oldestPeriod: bal.oldestPeriod || '', ageDays: bal.ageDays ?? null, status: bal.status || '', priority: bal.priority || '',
      lastPaymentAt: bal.lastPaymentAt || null, lastPaymentAmount: bal.lastPaymentAmount || 0, lastSnapshotAsOn: bal.lastSnapshotAsOn || '',
      nextFollowupAt: bal.nextFollowupAt || '', brokenPromises: bal.brokenPromises || 0,
      promises: promises.map(p => ({ id: p._id, amount: p.amount, received: p.received || 0, date: p.promiseDate, status: p.status })),
      pendingRecorded: pendingRec.reduce((a, p) => a + p.amount, 0), pendingRecordedCount: pendingRec.length,
      overLimit: (d.creditLimit || 0) > 0 && (bal.total || 0) > d.creditLimit,
      // a payment score like a credit bureau's, 300–900, with the reasons that moved it
      ...(() => {
        let sc = 850; const why = [];                                                          // 900 is earned by paying recently with nothing overdue
        const total = bal.total || 0, due = bal.dueAmount || 0;
        if (total > 0 && due > 0) { const cut = Math.round(250 * Math.min(1, due / total)); sc -= cut; why.push({ text: `${Math.round(due / total * 100)}% of the balance is past ${cm ? periodLabelSrv(cm) : 'the collection month'} (₹${Math.round(due).toLocaleString('en-IN')})`, delta: -cut }); }
        const limitDays = (d.creditDays || 0) > 0 ? d.creditDays : 90;
        if (bal.ageDays != null && bal.ageDays > limitDays) { const cut = bal.ageDays > 2 * limitDays ? 150 : 100; sc -= cut; why.push({ text: `oldest bill is ${bal.ageDays} days old against ${limitDays} credit days`, delta: -cut }); }
        if (bal.brokenPromises > 0) { const cut = Math.min(150, 50 * bal.brokenPromises); sc -= cut; why.push({ text: `${bal.brokenPromises} promise${bal.brokenPromises === 1 ? '' : 's'} not kept`, delta: -cut }); }
        if ((d.creditLimit || 0) > 0 && total > d.creditLimit) { sc -= 100; why.push({ text: `over the credit limit of ₹${Math.round(d.creditLimit).toLocaleString('en-IN')}`, delta: -100 }); }
        const daysSincePay = bal.lastPaymentAt ? Math.round((Date.now() - new Date(bal.lastPaymentAt)) / 86400000) : null;
        if (daysSincePay != null && daysSincePay <= 30) { sc += 50; why.push({ text: `paid ₹${Math.round(bal.lastPaymentAmount || 0).toLocaleString('en-IN')} ${daysSincePay === 0 ? 'today' : daysSincePay + ' days ago'}`, delta: +50 }); }
        else if (total > 0 && (daysSincePay == null || daysSincePay > 90)) { sc -= 100; why.push({ text: daysSincePay == null ? 'no payment on record' : `no payment for ${daysSincePay} days`, delta: -100 }); }
        if (total <= 0) { sc = 900; why.length = 0; why.push({ text: 'nothing outstanding', delta: 0 }); }
        return { score: Math.max(300, Math.min(900, sc)), scoreReasons: why };
      })(),
    } : null,
    samples: {
      toShow: toShow.map(s => ({ id: s._id, name: s.name, zone: s.zone, stock: s.stock || 0, addedAt: s.createdAt })),
      toGive: toGive.map(a => ({ id: a._id, sampleId: a.sampleId, name: a.sampleName, reason: a.reason, source: a.source })),
      toTakeBack: toTakeBack.map(a => ({ id: a._id, sampleId: a.sampleId, name: a.sampleName, givenDate: a.givenDate })),
      requested: requested.map(a => ({ id: a._id, sampleId: a.sampleId, name: a.sampleName, reason: a.reason, at: a.createdAt })),
      given: given.map(g => {
        const alloc = allocs.find(a => a.givenId === String(g._id) || (a.status === 'GIVEN' && a.sampleId === String(g.sampleId)));
        const sold = soldFor(g.sampleName);
        const flagged = !!alloc?.takeBack;
        // a sample needs time to earn its place: judge it only after 60 days with the dealer
        const daysHeld = g.givenDate ? Math.round((Date.now() - new Date(g.givenDate + 'T00:00:00').getTime()) / 86400000) : 999;
        const suggest = daysHeld < 60 ? '' : dealerDead ? `dealer is ${(d.perfStatus || '').toLowerCase()} — no orders` : (!sold.qty ? 'no sales of this catalogue in 3 months' : '');
        return { id: g._id, allocId: alloc?._id || null, name: g.sampleName, qty: g.qty || 1, date: g.givenDate, by: nameOf[g.givenBy] || g.givenBy || '',
          sold3m: sold.qty, soldBrand: sold.brand, takeBack: flagged || !!suggest, takeBackReason: flagged ? 'flagged by office' : suggest };
      }),
      bought3m: [...brandQty.entries()].filter(([b]) => b).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([brand, qty]) => ({ brand, qty })),
    },
    moms: moms.map(m => ({ ...m, userName: m.userName || nameOf[m.userId] || m.userId })),
    visits: visits.map(v => ({ id: v._id, date: v.checkInTime, out: v.checkOutTime || null, by: v.userName || nameOf[v.userId] || v.userId, status: v.status,
      inNote: v.checkInNote || '', outNote: v.checkOutNote || '', place: [v.checkInAddress, v.checkInCity].filter(Boolean).join(', '),
      minutes: v.checkOutTime && v.checkInTime ? Math.max(0, Math.round((new Date(v.checkOutTime) - new Date(v.checkInTime)) / 60000)) : null,
      mom: moms.find(m => m.visitId === String(v._id) || (m.date === new Date(new Date(v.checkInTime).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10) && m.userId === v.userId)) ? true : false })),
    lastVisit: (() => { const real = visits.find(v => v.checkInNote !== 'Visit recorded from MOM' || v.userId === d.salesman); return real ? { date: real.checkInTime, by: real.userName || nameOf[real.userId] || real.userId } : null; })(),
    // one timeline: a visit and the MOM written for it are the same event
    history: (() => {
      const dayOf = t => new Date(new Date(t).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10);
      const used = new Set();
      const rows = visits.map(v => {
        const m = moms.find(x => x.visitId === String(v._id)) || moms.find(x => !used.has(String(x._id)) && x.date === dayOf(v.checkInTime) && x.userId === v.userId);
        if (m) used.add(String(m._id));
        return { kind: 'visit', id: String(v._id), at: v.checkInTime, day: dayOf(v.checkInTime), out: v.checkOutTime || null, by: v.userName || nameOf[v.userId] || v.userId, status: v.status,
          inNote: v.checkInNote || '', outNote: v.checkOutNote || v.comment || '', place: [v.checkInCity || v.city, v.checkInState || v.state].filter(Boolean).join(', '),
          fromMom: v.checkInNote === 'Visit recorded from MOM',
          minutes: v.checkOutTime && v.checkInTime ? Math.max(0, Math.round((new Date(v.checkOutTime) - new Date(v.checkInTime)) / 60000)) : null,
          mom: m ? { ...m, userName: m.userName || nameOf[m.userId] || m.userId } : null };
      });
      for (const m of moms) if (!used.has(String(m._id))) rows.push({ kind: 'mom', id: String(m._id), at: m.createdAt, day: m.date, by: m.userName || nameOf[m.userId] || m.userId, mom: { ...m } });
      return rows.sort((a, b) => new Date(b.at) - new Date(a.at));
    })(),
    // what the office planned for this dealer: today first, then upcoming, then the last week
    plans: plans.map(p => ({ id: p._id, date: p.date, salesmanId: p.salesmanId, salesmanName: nameOf[p.salesmanId] || p.salesmanId, note: p.note, collectTarget: p.collectTarget || 0, salesmanNote: p.salesmanNote, status: p.status, plannedByName: p.plannedByName, isToday: p.date === t0, upcoming: p.date > t0 })),
    salesmen: users.filter(u => u.role === 'salesman' && u.active !== false).map(u => ({ id: u.id, name: u.name || u.id })).sort((a, b) => a.name.localeCompare(b.name)),
    today: todayYmd(),
  };
}

router.get('/:dealerId/summary', protect, async (req, res) => {
  try { const d = await loadDealerFor(req, res); if (!d) return; const s = await visitSummary(d._id); res.json({ ...s, canPlan: isStaff(req), canEdit: await hasFeature(req, 'visitMom') }); }
  catch (e) { console.error('[DEALER VISIT]', e.message); res.status(500).json({ error: e.message }); }
});

router.get('/:dealerId/moms', protect, async (req, res) => {
  try { const d = await loadDealerFor(req, res); if (!d) return; res.json({ items: await DealerMom.find({ dealerId: String(d._id) }).sort({ date: -1, createdAt: -1 }).limit(50).lean() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:dealerId/mom', protect, requireFeature('visitMom'), async (req, res) => {
  try {
    const d = await loadDealerFor(req, res); if (!d) return;
    const b = req.body || {};
    const me = await User.findOne({ id: req.user.id }, 'name').lean();
    const s = await visitSummary(d._id);
    const num = v => (v === '' || v === null || v === undefined) ? null : Number(v);
    const mom = await DealerMom.create({
      dealerId: String(d._id), dealerName: d.name, userId: req.user.id, userName: me?.name || req.user.id,
      date: /^\d{4}-\d{2}-\d{2}$/.test(b.date || '') ? b.date : todayYmd(), visitId: b.visitId || '',
      zone: d.zone || '',
      volume: s?.volume?.latest ? { month: s.volume.latest.label, target: s.volume.latest.target, achieved: s.volume.latest.achieved } : null,
      outstanding: s?.collections ? { total: s.collections.total, due: s.collections.dueAmount, dueMonth: s.collections.collectionMonth } : null,
      dealerFormFilled: !!b.dealerFormFilled,
      samplesShown: String(b.samplesShown || '').slice(0, 1000), samplesGiven: String(b.samplesGiven || '').slice(0, 1000), samplesTakenBack: String(b.samplesTakenBack || '').slice(0, 1000),
      action: ['THREATENING', 'MOTIVATION', 'APPRECIATION', 'CLOSE_COUNTER'].includes(b.action) ? b.action : '',
      actionNote: String(b.actionNote || '').slice(0, 1000),
      paymentStatus: String(b.paymentStatus || '').slice(0, 1000),
      paymentCollected: Math.max(0, Number(b.paymentCollected) || 0), paymentCollectionNote: String(b.paymentCollectionNote || '').slice(0, 500),
      reviewPaymentTerms: String(b.reviewPaymentTerms || '').slice(0, 1000),
      relineTerms: { creditDays: num(b.relineCreditDays), creditLimit: num(b.relineCreditLimit), note: String(b.relineNote || '').slice(0, 500), applied: false },
      appUsageShown: !!b.appUsageShown,
      remarks: String(b.remarks || '').slice(0, 2000),
      previousReviewed: !!b.previousReviewed, previousMomId: b.previousMomId || '',
    });

    // The MOM is the visit. Link it to today's check-in by the same person;
    // without one, write a completed visit so the visit history has it.
    if (!mom.visitId) {
      const dayStart = new Date(mom.date + 'T00:00:00+05:30'), dayEnd = new Date(mom.date + 'T23:59:59+05:30');
      // the CRM check-in at this dealer that day: the writer's own, or the dealer's salesman's when the office writes it
      let v = await Visit.findOne({ dealerId: String(d._id), userId: { $in: [req.user.id, d.salesman || ''] }, checkInTime: { $gte: dayStart, $lte: dayEnd } }).sort({ checkInTime: -1 });
      // the MOM never creates a visit: a visit is a CRM check-in only. Without one the MOM stands on its own.
      if (v) { mom.visitId = String(v._id); await mom.save(); }
    }
    // the day's plan for this dealer is done once the MOM is written
    // only the salesman's own MOM counts as the visit; the office writing from a desk does not tick his plan
    if (!isStaff(req) && mom.visitId) await VisitPlan.updateMany({ dealerId: String(d._id), date: mom.date, status: 'PLANNED', salesmanId: req.user.id }, { $set: { status: 'DONE', momId: String(mom._id) } });
    // side effects the MOM asks for
    if (b.dealerFormFilled && !d.dealerFormDone) await Dealer.updateOne({ _id: d._id }, { $set: { dealerFormDone: true, dealerFormDoneAt: new Date(), dealerFormBy: req.user.id } });
    // relined terms: an admin's MOM applies them; a salesman's is a proposal for the office
    if (isStaff(req) && (mom.relineTerms.creditDays !== null || mom.relineTerms.creditLimit !== null)) {
      const set = {};
      if (mom.relineTerms.creditDays !== null) set.creditDays = Math.max(0, mom.relineTerms.creditDays);
      if (mom.relineTerms.creditLimit !== null) set.creditLimit = Math.max(0, mom.relineTerms.creditLimit);
      await Dealer.updateOne({ _id: d._id }, { $set: set });
      mom.relineTerms.applied = true; await mom.save();
    }
    // samples handed over / taken back on this visit
    const SampleGiven = mongoose.models.SampleGiven;
    for (const aid of Array.isArray(b.givenAllocationIds) ? b.givenAllocationIds : []) {
      const a = await SampleAllocation.findById(aid); if (!a || a.status !== 'ALLOCATED' || a.dealerId !== String(d._id)) continue;
      const g = await SampleGiven.create({ dealerName: d.name, dealerId: String(d._id), sampleId: a.sampleId, sampleName: a.sampleName, zone: a.zone, salesman: d.salesman || req.user.id, givenBy: req.user.id, givenDate: mom.date, notes: 'given on visit · MOM' });
      a.status = 'GIVEN'; a.givenId = String(g._id); a.givenDate = mom.date; await a.save();
    }
    for (const gid of Array.isArray(b.returnedGivenIds) ? b.returnedGivenIds : []) {
      const g = await SampleGiven.findById(gid); if (!g || (g.dealerId && g.dealerId !== String(d._id) && g.dealerName.toUpperCase() !== d.name.toUpperCase())) continue;
      const a = await SampleAllocation.findOne({ givenId: String(g._id) });
      if (a) { a.status = 'RETURNED'; a.returnedDate = mom.date; a.takeBack = false; await a.save(); }
      else await SampleAllocation.create({ sampleId: g.sampleId, sampleName: g.sampleName, zone: g.zone, dealerId: String(d._id), dealerName: d.name, dealerZone: d.zone || '', salesman: d.salesman || req.user.id, status: 'RETURNED', source: 'manual', reason: 'taken back on visit · MOM', returnedDate: mom.date, createdBy: req.user.id });
      await SampleGiven.deleteOne({ _id: g._id });
    }
    for (const aid of Array.isArray(b.returnedAllocationIds) ? b.returnedAllocationIds : []) {
      const a = await SampleAllocation.findById(aid); if (!a || a.status !== 'GIVEN' || a.dealerId !== String(d._id)) continue;
      if (a.givenId) await SampleGiven.deleteOne({ _id: a.givenId });
      a.status = 'RETURNED'; a.returnedDate = mom.date; a.takeBack = false; await a.save();
    }
    res.json({ ok: true, mom });
  } catch (e) { console.error('[DEALER VISIT MOM]', e.message); res.status(500).json({ error: e.message }); }
});

export default router;
