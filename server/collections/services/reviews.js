import mongoose from 'mongoose';
import { ColEmployeeActivity, ColEmployeeReview, ColFollowUp, ColTask, ColPromise, ColPayment, ColBalance, ColSnapshot } from '../models/index.js';
import { getSetting } from '../lib/settings.js';
import { todayYmd } from '../lib/periods.js';
import { writeAudit } from '../lib/audit.js';
/** A Map field is a Map on a document and a plain object after .lean(); either way, an object. */
const asObj = b => b instanceof Map ? Object.fromEntries(b) : (b && typeof b === 'object' ? b : {});

const ymd = d => new Date(d).toISOString().slice(0, 10);
const bad = m => { const e = new Error(m); e.status = 400; return e; };
const pct = (num, den) => den > 0 ? Math.max(0, Math.min(100, Math.round((num / den) * 100))) : null;

/** Rebuild the daily rollup for a date range from the event tables. Derived data; safe to run any time. */
export async function rebuildActivity({ from, to }) {
  const rows = new Map();
  const at = (employeeId, date) => { const k = employeeId + '|' + date; if (!rows.has(k)) rows.set(k, { employeeId, date, followups: 0, calls: 0, visits: 0, whatsapps: 0, tasksDone: 0, tasksOverdue: 0, promisesTaken: 0, promisesKept: 0, promisesBroken: 0, collected: 0, points: 0 }); return rows.get(k); };
  for (const f of await ColFollowUp.find({ date: { $gte: from, $lte: to } }, 'employeeId date channel').lean()) { const r = at(f.employeeId, f.date); r.followups++; if (f.channel === 'CALL') r.calls++; if (f.channel === 'VISIT') r.visits++; if (f.channel === 'WHATSAPP') r.whatsapps++; }
  for (const t of await ColTask.find({ status: 'DONE', completedAt: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } }, 'employeeId completedAt points').lean()) { const r = at(t.employeeId, ymd(t.completedAt)); r.tasksDone++; r.points += t.points || 0; }
  for (const p of await ColPromise.find({ $or: [{ createdAt: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } }, { fulfilledAt: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } }, { brokenAt: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } }] }, 'employeeId createdAt fulfilledAt brokenAt').lean()) {
    const c = ymd(p.createdAt); if (c >= from && c <= to) at(p.employeeId, c).promisesTaken++;
    if (p.fulfilledAt) { const d = ymd(p.fulfilledAt); if (d >= from && d <= to) at(p.employeeId, d).promisesKept++; }
    if (p.brokenAt) { const d = ymd(p.brokenAt); if (d >= from && d <= to) at(p.employeeId, d).promisesBroken++; }
  }
  for (const p of await ColPayment.find({ status: 'CONFIRMED', date: { $gte: from, $lte: to } }, 'collectedBy salesmanId date amount').lean()) at(p.collectedBy || p.salesmanId, p.date).collected += p.amount;
  const today = todayYmd();
  if (today >= from && today <= to) for (const t of await ColTask.aggregate([{ $match: { status: { $in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { $lt: today } } }, { $group: { _id: '$employeeId', n: { $sum: 1 } } }])) at(t._id, today).tasksOverdue = t.n;
  await ColEmployeeActivity.deleteMany({ date: { $gte: from, $lte: to } });
  if (rows.size) await ColEmployeeActivity.insertMany([...rows.values()]);
  return { days: rows.size };
}

function periodRange(period) {
  if (!/^\d{4}-\d{2}$/.test(period)) throw bad('period must be YYYY-MM');
  const [y, m] = period.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${period}-01`, to: `${period}-${String(last).padStart(2, '0')}`, y, m, last };
}
const nextWorkingDays = (ymdStr, n, workingDays) => { let d = new Date(ymdStr + 'T00:00:00'), left = n; while (left > 0) { d = new Date(d.getTime() + 86400000); if (workingDays.includes(d.getDay())) left--; } return ymd(d); };

/** Compute every metric for one employee and one month; the weights in force are stored with it. */
export async function generateReview(employeeId, period, { by }) {
  const { from, to, y, m, last } = periodRange(period);
  const [weights, workingDays, visitTarget] = await Promise.all([getSetting('collections.reviewWeights'), getSetting('collections.workingDays'), getSetting('collections.visitTargetPerMonth')]);
  const Dealer = mongoose.models.Dealer;
  const assigned = await Dealer.find({ salesman: employeeId }, '_id').lean();
  const assignedIds = assigned.map(d => d._id);
  const inputs = {};

  // followupDiscipline: of follow-ups scheduled (nextFollowupDate) in the period, how many were met by a follow-up on/before that date
  const scheduled = await ColFollowUp.find({ employeeId, nextFollowupDate: { $gte: from, $lte: to } }, 'dealerId nextFollowupDate').lean();
  let met = 0;
  for (const s of scheduled) if (await ColFollowUp.exists({ dealerId: s.dealerId, employeeId, date: { $gt: s.nextFollowupDate.slice(0, 0) + from, $lte: s.nextFollowupDate }, _id: { $ne: s._id } })) met++;
  inputs.followupDiscipline = { scheduled: scheduled.length, met };

  const dueTasks = await ColTask.find({ employeeId, dueDate: { $gte: from, $lte: to }, status: { $nin: ['CANCELLED'] } }, 'dueDate status completedAt').lean();
  const onTime = dueTasks.filter(t => t.status === 'DONE' && t.completedAt && ymd(t.completedAt) <= t.dueDate).length;
  inputs.taskCompletion = { due: dueTasks.length, onTime };

  const fus = await ColFollowUp.find({ employeeId, date: { $gte: from, $lte: to } }, 'date createdAt channel dealerId').lean();
  inputs.onTimeUpdates = { followups: fus.length, sameDay: fus.filter(f => ymd(f.createdAt) === f.date).length };
  inputs.dealerVisits = { visits: fus.filter(f => f.channel === 'VISIT').length, target: visitTarget };

  const broken = await ColPromise.find({ employeeId, brokenAt: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } }, 'dealerId brokenAt').lean();
  let chased = 0;
  for (const b of broken) { const limit = nextWorkingDays(ymd(b.brokenAt), 2, workingDays); if (await ColFollowUp.exists({ dealerId: b.dealerId, employeeId, date: { $gte: ymd(b.brokenAt), $lte: limit } })) chased++; }
  inputs.promiseFollowUp = { broken: broken.length, chased };

  const [corrected, cancelledPays, cancelledProm, pays, proms] = await Promise.all([
    mongoose.models.ColAudit.countDocuments({ entity: 'followup', action: 'corrected', by: employeeId, at: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } }),
    ColPayment.countDocuments({ enteredBy: employeeId, status: 'CANCELLED', createdAt: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } }),
    ColPromise.countDocuments({ employeeId, status: 'CANCELLED', createdAt: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } }),
    ColPayment.countDocuments({ enteredBy: employeeId, createdAt: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } }),
    ColPromise.countDocuments({ employeeId, createdAt: { $gte: new Date(from), $lte: new Date(to + 'T23:59:59') } })]);
  inputs.dataAccuracy = { records: fus.length + pays + proms, corrections: corrected + cancelledPays + cancelledProm };

  const owing = await ColBalance.find({ dealerId: { $in: assignedIds }, total: { $gt: 0 } }, 'dealerId').lean();
  const contacted = new Set(fus.map(f => String(f.dealerId)));
  inputs.customerManagement = { owing: owing.length, contacted: owing.filter(o => contacted.has(String(o.dealerId))).length };

  const activeDays = new Set([...fus.map(f => f.date), ...dueTasks.filter(t => t.completedAt).map(t => ymd(t.completedAt))]);
  let wd = 0; for (let d = 1; d <= last; d++) if (workingDays.includes(new Date(y, m - 1, d).getDay())) wd++;
  inputs.systemUsage = { activeDays: activeDays.size, workingDays: wd };

  const pts = await ColEmployeeActivity.aggregate([{ $match: { date: { $gte: from, $lte: to } } }, { $group: { _id: '$employeeId', points: { $sum: '$points' } } }]);
  const mine = pts.find(p => p._id === employeeId)?.points || 0;
  const sorted = pts.map(p => p.points).sort((a, b) => a - b); const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
  inputs.taskPoints = { points: mine, teamMedian: median };

  const collected = (await ColPayment.aggregate([{ $match: { status: 'CONFIRMED', date: { $gte: from, $lte: to }, $or: [{ collectedBy: employeeId }, { salesmanId: employeeId, collectedBy: '' }] } }, { $group: { _id: null, s: { $sum: '$amount' } } }]))[0]?.s || 0;
  const opening = (await ColSnapshot.aggregate([{ $match: { dealerId: { $in: assignedIds }, asOn: { $lt: from }, superseded: false } }, { $sort: { asOn: -1 } }, { $group: { _id: '$dealerId', total: { $first: '$total' } } }, { $group: { _id: null, s: { $sum: '$total' } } }]))[0]?.s
    ?? (await ColBalance.aggregate([{ $match: { dealerId: { $in: assignedIds } } }, { $group: { _id: null, s: { $sum: '$total' } } }]))[0]?.s ?? 0;
  inputs.collectionActivity = { collected, opening };

  const existing = await ColEmployeeReview.findOne({ employeeId, period }).lean();
  const metrics = {
    followupDiscipline: pct(met, scheduled.length), taskCompletion: pct(onTime, dueTasks.length), onTimeUpdates: pct(inputs.onTimeUpdates.sameDay, fus.length),
    dealerVisits: pct(inputs.dealerVisits.visits, visitTarget), promiseFollowUp: pct(chased, broken.length),
    dataAccuracy: inputs.dataAccuracy.records ? Math.max(0, 100 - Math.round((inputs.dataAccuracy.corrections / inputs.dataAccuracy.records) * 100)) : null,
    customerManagement: pct(inputs.customerManagement.contacted, owing.length), communicationQuality: existing?.metrics?.get?.('communicationQuality') ?? existing?.metrics?.communicationQuality ?? null,
    systemUsage: pct(activeDays.size, wd), taskPoints: median > 0 ? Math.min(100, Math.round((mine / median) * 100)) : (mine > 0 ? 100 : null),
    collectionActivity: opening > 0 ? Math.min(100, Math.round((collected / opening) * 100)) : null, managerReview: existing?.managerReview?.score ?? null,
  };
  const score = scoreOf(metrics, weights);
  const doc = await ColEmployeeReview.findOneAndUpdate({ employeeId, period },
    { $set: { metrics, inputs, weights, score, generatedBy: by }, $setOnInsert: { status: 'DRAFT' } }, { upsert: true, new: true });
  await writeAudit({ entity: 'review', entityId: doc._id, action: 'generated', after: { employeeId, period, score }, by });
  return doc;
}

/** Weighted mean over the metrics that have a value; unrated ones neither help nor hurt. */
export function scoreOf(metrics, weights) {
  let num = 0, den = 0;
  for (const [k, w] of Object.entries(weights)) { const v = metrics[k]; if (v === null || v === undefined || !Number.isFinite(Number(v))) continue; num += Number(v) * w; den += w; }
  return den ? Math.round(num / den) : 0;
}

export async function setManagerReview(id, { managerReview, communicationQuality, notes, by }) {
  const r = await ColEmployeeReview.findById(id); if (!r) throw bad('review not found');
  if (r.status === 'FINAL') throw bad('review is final');
  const m = asObj(r.metrics);
  if (managerReview !== undefined) { const v = Number(managerReview); if (!(v >= 0 && v <= 100)) throw bad('managerReview must be 0–100'); m.managerReview = v; r.managerReview = { score: v, notes: String(notes || ''), by, at: new Date() }; }
  if (communicationQuality !== undefined) { const v = Number(communicationQuality); if (!(v >= 0 && v <= 100)) throw bad('communicationQuality must be 0–100'); m.communicationQuality = v; }
  r.metrics = m; r.score = scoreOf(m, asObj(r.weights));
  await r.save();
  await writeAudit({ entity: 'review', entityId: r._id, action: 'manager-rated', after: { managerReview, communicationQuality, score: r.score }, by });
  return r;
}
export async function finalizeReview(id, { by }) {
  const r = await ColEmployeeReview.findById(id); if (!r) throw bad('review not found');
  r.status = 'FINAL'; await r.save();
  await writeAudit({ entity: 'review', entityId: r._id, action: 'finalised', after: { score: r.score }, by });
  return r;
}
