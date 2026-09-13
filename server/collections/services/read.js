import mongoose from 'mongoose';
import { ColBalance, ColCycle, ColSnapshot, ColEvent, ColInvoice, ColPayment, ColPaymentAllocation, ColFollowUp, ColPromise, ColTask, ColEmployeeActivity, ColImport, ColWhatsAppMessage } from '../models/index.js';
import { getSetting } from '../lib/settings.js';
import { todayYmd } from '../lib/periods.js';
/** A Map field is a Map on a document and a plain object after .lean(); either way, an object. */
const asObj = b => b instanceof Map ? Object.fromEntries(b) : (b && typeof b === 'object' ? b : {});

const oid = v => new mongoose.Types.ObjectId(String(v));
const Dealer = () => mongoose.models.Dealer;
const User = () => mongoose.models.User;

/** The Outstanding screen: current state only, paginated, filtered and searched on the server. */
export async function listBalances(scopeF, q = {}) {
  const page = Math.max(1, +q.page || 1), limit = Math.min(200, Math.max(1, +q.limit || 50));
  const f = { ...scopeF };
  if (q.status) f.status = { $in: String(q.status).split(',') };
  if (q.priority) f.priority = { $in: String(q.priority).split(',') };
  if (q.salesmanId) f.salesmanId = String(q.salesmanId);
  if (q.minTotal) f.total = { ...(f.total || {}), $gte: +q.minTotal };
  if (q.owing === '1') f.total = { ...(f.total || {}), $gt: 0 };
  if (q.q) { const rx = new RegExp(String(q.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); f.$or = [{ dealerName: rx }, { dealerCode: rx }]; }
  const sortKey = ['total', 'ageDays', 'dealerName', 'nextFollowupAt', 'lastPaymentAt', 'priority'].includes(q.sort) ? q.sort : 'total';
  const sort = { [sortKey]: q.dir === 'asc' ? 1 : -1, _id: 1 };
  const [items, total, agg] = await Promise.all([
    ColBalance.find(f).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    ColBalance.countDocuments(f),
    ColBalance.aggregate([{ $match: f }, { $group: { _id: null, sum: { $sum: '$total' }, owing: { $sum: { $cond: [{ $gt: ['$total', 0] }, 1, 0] } } } }]),
  ]);
  const names = new Map((await User().find({ id: { $in: [...new Set(items.map(i => i.salesmanId))] } }, 'id name').lean()).map(u => [u.id, u.name]));
  const phones = new Map((await Dealer().find({ _id: { $in: items.map(i => i.dealerId) } }, 'phone whatsappOptOut').lean()).map(d => [String(d._id), d]));
  return { items: items.map(i => ({ ...i, buckets: asObj(i.buckets), salesmanName: names.get(i.salesmanId) || i.salesmanId, phone: phones.get(String(i.dealerId))?.phone || '', whatsappOptOut: !!phones.get(String(i.dealerId))?.whatsappOptOut })), total, page, limit, sum: agg[0]?.sum || 0, owing: agg[0]?.owing || 0 };
}

/** Everything about one dealer, in the sections the Dealer 360 screen shows. */
export async function dealer360(dealerId) {
  const id = oid(dealerId);
  const [dealer, balance, cycles, invoices, payments, followups, promises, tasksOpen, tasksDone, snapshots, whatsapp] = await Promise.all([
    Dealer().findById(id).lean(),
    ColBalance.findOne({ dealerId: id }).lean(),
    ColCycle.find({ dealerId: id }).sort({ cycleNo: -1 }).lean(),
    ColInvoice.find({ dealerId: id }).sort({ status: 1, billDate: 1 }).limit(200).lean(),
    ColPayment.find({ dealerId: id }).sort({ date: -1 }).limit(50).lean(),
    ColFollowUp.find({ dealerId: id }).sort({ date: -1, createdAt: -1 }).limit(50).lean(),
    ColPromise.find({ dealerId: id }).sort({ promiseDate: -1 }).limit(50).lean(),
    ColTask.find({ dealerId: id, status: { $in: ['OPEN', 'IN_PROGRESS'] } }).sort({ dueDate: 1 }).lean(),
    ColTask.find({ dealerId: id, status: { $nin: ['OPEN', 'IN_PROGRESS'] } }).sort({ completedAt: -1 }).limit(20).lean(),
    ColSnapshot.find({ dealerId: id }).sort({ asOn: -1, createdAt: -1 }).limit(24).lean(),
    ColWhatsAppMessage.find({ dealerId: id }).sort({ createdAt: -1 }).limit(20).lean(),
  ]);
  if (!dealer) return null;
  const allocations = await ColPaymentAllocation.find({ paymentId: { $in: payments.map(p => p._id) } }).lean();
  const sm = dealer.salesman ? await User().findOne({ id: dealer.salesman }, 'id name').lean() : null;
  const cycleStats = cycles.map(c => ({ ...c, daysOpen: Math.round(((c.closedAt || new Date()) - c.openedAt) / 86400000) }));
  return {
    dealer: { ...dealer, salesmanName: sm?.name || dealer.salesman },
    balance: balance ? { ...balance, buckets: asObj(balance.buckets) } : null,
    cycles: cycleStats, invoices, payments, allocations, followups, promises, tasks: { open: tasksOpen, recent: tasksDone },
    snapshots: snapshots.map(s => ({ ...s, buckets: asObj(s.buckets) })), whatsapp,
    imports: await ColImport.find({ _id: { $in: snapshots.map(s => s.importId) } }, 'fileName asOn source').lean(),
  };
}

/** The timeline, newest first, cursor-paginated on (at, _id). */
export async function timeline(dealerId, { limit = 50, before = null, types = null } = {}) {
  const f = { dealerId: oid(dealerId) };
  if (types) f.type = { $in: types };
  if (before) { const [at, id] = String(before).split('|'); f.$or = [{ at: { $lt: new Date(at) } }, { at: new Date(at), _id: { $lt: oid(id) } }]; }
  const items = await ColEvent.find(f).sort({ at: -1, _id: -1 }).limit(Math.min(200, limit) + 1).lean();
  const more = items.length > limit; if (more) items.pop();
  const last = items[items.length - 1];
  return { items, next: more && last ? `${last.at.toISOString()}|${last._id}` : null };
}

export async function history(dealerId) {
  const id = oid(dealerId);
  const [snapshots, cycles] = await Promise.all([
    ColSnapshot.find({ dealerId: id }).sort({ asOn: 1, createdAt: 1 }).lean(),
    ColCycle.find({ dealerId: id }).sort({ cycleNo: 1 }).lean()]);
  const imports = new Map((await ColImport.find({ _id: { $in: snapshots.map(s => s.importId) } }, 'fileName asOn source status').lean()).map(i => [String(i._id), i]));
  return { snapshots: snapshots.map(s => ({ ...s, buckets: asObj(s.buckets), import: imports.get(String(s.importId)) || null })), cycles };
}

/** The tiles and charts on the module dashboard, scoped, in a handful of aggregations. */
export async function dashboard(scopeF) {
  const today = todayYmd(), monthStart = today.slice(0, 7) + '-01';
  const [overdueDays, agingBuckets] = await Promise.all([getSetting('collections.overdueDays'), getSetting('collections.agingBuckets')]);
  const since7 = new Date(Date.now() - 7 * 86400000), since30 = new Date(Date.now() - 30 * 86400000);
  const [bal, todayPay, monthPay, fuToday, fuOverdue, prToday, prBroken, newOut, clearedToday, hi, bySm, act, imports] = await Promise.all([
    ColBalance.aggregate([{ $match: scopeF }, { $group: { _id: null, total: { $sum: '$total' }, owing: { $sum: { $cond: [{ $gt: ['$total', 0] }, 1, 0] } }, overdue: { $sum: { $cond: [{ $gt: ['$ageDays', overdueDays] }, '$total', 0] } }, overdueDealers: { $sum: { $cond: [{ $gt: ['$ageDays', overdueDays] }, 1, 0] } } } }]),
    ColPayment.aggregate([{ $match: { ...scopeF, status: 'CONFIRMED', date: today } }, { $group: { _id: null, sum: { $sum: '$amount' }, n: { $sum: 1 } } }]),
    ColPayment.aggregate([{ $match: { ...scopeF, status: 'CONFIRMED', date: { $gte: monthStart } } }, { $group: { _id: null, sum: { $sum: '$amount' }, n: { $sum: 1 } } }]),
    ColBalance.countDocuments({ ...scopeF, nextFollowupAt: today, total: { $gt: 0 } }),
    ColBalance.countDocuments({ ...scopeF, nextFollowupAt: { $gt: '', $lt: today }, total: { $gt: 0 } }),
    ColPromise.aggregate([{ $match: { ...scopeF, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] }, promiseDate: today } }, { $group: { _id: null, sum: { $sum: { $subtract: ['$amount', '$received'] } }, n: { $sum: 1 } } }]),
    ColPromise.aggregate([{ $match: { ...scopeF, status: 'BROKEN' } }, { $group: { _id: null, sum: { $sum: { $subtract: ['$amount', '$received'] } }, n: { $sum: 1 } } }]),
    ColEvent.aggregate([{ $match: { ...scopeF, type: { $in: ['NEW_OUTSTANDING', 'REOPENED'] }, at: { $gte: since7 } } }, { $group: { _id: null, sum: { $sum: '$amount' }, n: { $sum: 1 } } }]),
    ColEvent.aggregate([{ $match: { ...scopeF, type: 'CLEARED', at: { $gte: new Date(today + 'T00:00:00') } } }, { $group: { _id: null, sum: { $sum: '$amount' }, n: { $sum: 1 } } }]),
    ColBalance.find({ ...scopeF, priority: { $in: ['HIGH', 'CRITICAL'] }, total: { $gt: 0 } }).sort({ total: -1 }).limit(10).lean(),
    ColBalance.aggregate([{ $match: { ...scopeF, total: { $gt: 0 } } }, { $group: { _id: '$salesmanId', total: { $sum: '$total' }, dealers: { $sum: 1 }, overdue: { $sum: { $cond: [{ $gt: ['$ageDays', overdueDays] }, '$total', 0] } } } }, { $sort: { total: -1 } }]),
    ColEmployeeActivity.aggregate([{ $match: { date: { $gte: new Date(since30).toISOString().slice(0, 10) } } }, { $group: { _id: '$employeeId', followups: { $sum: '$followups' }, visits: { $sum: '$visits' }, calls: { $sum: '$calls' }, tasksDone: { $sum: '$tasksDone' }, promisesKept: { $sum: '$promisesKept' }, promisesBroken: { $sum: '$promisesBroken' }, collected: { $sum: '$collected' }, points: { $sum: '$points' } } }]),
    ColImport.find({ status: 'APPLIED' }, 'asOn stats.totalAfter fileName').sort({ asOn: -1 }).limit(12).lean(),
  ]);
  // Ageing bands from settings: [30,60,90,180] → 0-30, 31-60, 61-90, 91-180, 181+
  const edges = [0, ...agingBuckets, Infinity];
  const bands = edges.slice(0, -1).map((lo, i) => ({ label: edges[i + 1] === Infinity ? `${lo + (i ? 1 : 0)}+` : `${lo + (i ? 1 : 0)}–${edges[i + 1]}`, lo: lo + (i ? 1 : 0), hi: edges[i + 1], total: 0, dealers: 0 }));
  for (const b of await ColBalance.find({ ...scopeF, total: { $gt: 0 } }, 'total ageDays').lean()) {
    const a = b.ageDays ?? -1; const band = bands.find(x => a >= x.lo && a <= x.hi) || bands[0];
    if (a < 0) continue; band.total += b.total; band.dealers++;
  }
  const users = new Map((await User().find({}, 'id name').lean()).map(u => [u.id, u.name]));
  const smCollected = new Map((await ColPayment.aggregate([{ $match: { ...scopeF, status: 'CONFIRMED', date: { $gte: monthStart } } }, { $group: { _id: '$salesmanId', sum: { $sum: '$amount' } } }])).map(x => [x._id, x.sum]));
  return {
    today,
    tiles: {
      totalOutstanding: bal[0]?.total || 0, owingDealers: bal[0]?.owing || 0,
      overdueOutstanding: bal[0]?.overdue || 0, overdueDealers: bal[0]?.overdueDealers || 0,
      todayCollection: todayPay[0]?.sum || 0, todayPayments: todayPay[0]?.n || 0,
      monthCollection: monthPay[0]?.sum || 0, monthPayments: monthPay[0]?.n || 0,
      followupsToday: fuToday, followupsOverdue: fuOverdue,
      promisesToday: prToday[0]?.sum || 0, promisesTodayCount: prToday[0]?.n || 0,
      brokenPromises: prBroken[0]?.sum || 0, brokenPromisesCount: prBroken[0]?.n || 0,
      newOutstanding7d: newOut[0]?.sum || 0, newOutstanding7dCount: newOut[0]?.n || 0,
      clearedToday: clearedToday[0]?.sum || 0, clearedTodayCount: clearedToday[0]?.n || 0,
      highPriorityDealers: hi.length,
    },
    highPriority: await (async () => { const ph = new Map((await Dealer().find({ _id: { $in: hi.map(b => b.dealerId) } }, 'phone').lean()).map(d => [String(d._id), d.phone || ''])); return hi.map(b => ({ dealerId: b.dealerId, dealerName: b.dealerName, dealerCode: b.dealerCode, total: b.total, ageDays: b.ageDays, priority: b.priority, status: b.status, salesmanName: users.get(b.salesmanId) || b.salesmanId, phone: ph.get(String(b.dealerId)) || '' })); })(),
    aging: bands,
    bySalesman: bySm.map(s => ({ salesmanId: s._id, name: users.get(s._id) || s._id || '(unassigned)', total: s.total, dealers: s.dealers, overdue: s.overdue, collectedThisMonth: smCollected.get(s._id) || 0 })),
    activity30d: act.map(a => ({ ...a, employeeId: a._id, name: users.get(a._id) || a._id })),
    trend: imports.reverse().map(i => ({ asOn: i.asOn, total: i.stats?.totalAfter || 0, fileName: i.fileName })),
  };
}

/** Where the statement and the books disagree. */
export async function reconciliation(scopeF, { from, to, page = 1, limit = 50 } = {}) {
  const f = { ...scopeF, type: 'RECONCILIATION_DIFFERENCE' };
  if (from || to) f.at = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to + 'T23:59:59') } : {}) };
  const [items, total, agg] = await Promise.all([
    ColEvent.find(f).sort({ at: -1 }).skip((page - 1) * limit).limit(limit).lean(), ColEvent.countDocuments(f),
    ColEvent.aggregate([{ $match: f }, { $group: { _id: null, unexplained: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } }, unreflected: { $sum: { $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0] } } } }])]);
  const names = new Map((await Dealer().find({ _id: { $in: items.map(i => i.dealerId) } }, 'name code').lean()).map(d => [String(d._id), d]));
  return { items: items.map(i => ({ ...i, dealer: names.get(String(i.dealerId)) || null })), total, page, limit, unexplained: agg[0]?.unexplained || 0, unreflected: agg[0]?.unreflected || 0 };
}

export async function globalSearch(scopeF, q, limit = 20) {
  const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [dealers, payments, tasks, followups] = await Promise.all([
    ColBalance.find({ ...scopeF, $or: [{ dealerName: rx }, { dealerCode: rx }] }, 'dealerId dealerName dealerCode total status').limit(limit).lean(),
    ColPayment.find({ ...scopeF, $or: [{ reference: rx }, { bankReference: rx }] }, 'dealerId paymentNo amount date reference').limit(limit).lean(),
    ColTask.find({ ...scopeF, $or: [{ description: rx }, { 'comments.text': rx }] }, 'dealerId taskNo type status dueDate description').limit(limit).lean(),
    ColFollowUp.find({ ...scopeF, $or: [{ discussion: rx }, { remarks: rx }, { customerResponse: rx }] }, 'dealerId date channel outcome discussion').limit(limit).lean(),
  ]);
  const phoneHits = await Dealer().find({ $or: [{ phone: rx }, { name: rx }, { code: rx }] }, 'name code phone').limit(limit).lean();
  return { dealers, payments, tasks, followups, dealerMaster: phoneHits };
}
