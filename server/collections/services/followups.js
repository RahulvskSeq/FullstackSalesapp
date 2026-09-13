import mongoose from 'mongoose';
import { ColFollowUp, ColPromise, ColBalance, ColEvent, ColEmployeeActivity, CHANNELS, OUTCOMES } from '../models/index.js';
import { refreshBalance } from '../engines/reconcile.js';
import { todayYmd } from '../lib/periods.js';
import { getSetting } from '../lib/settings.js';
import { writeAudit } from '../lib/audit.js';
import * as hooks from '../engines/hooks.js';

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const oid = v => new mongoose.Types.ObjectId(String(v));
const bad = m => { const e = new Error(m); e.status = 400; return e; };
const bump = (employeeId, date, inc) => ColEmployeeActivity.updateOne({ employeeId, date }, { $inc: inc, $setOnInsert: { employeeId, date } }, { upsert: true }).catch(() => {});

async function setNextPromise(dealerId) {
  const balance = await ColBalance.findOne({ dealerId });
  if (!balance) return;
  const next = await ColPromise.findOne({ dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).lean();
  balance.promise = next ? { id: next._id, amount: next.amount - next.received, date: next.promiseDate } : undefined;
  balance.brokenPromises = await ColPromise.countDocuments({ dealerId, status: 'BROKEN' });
  await balance.save();
}

/** One form, one request: the interaction, the promise it produced, the next date. */
export async function recordFollowup(input, { by }) {
  const dealerId = oid(input.dealerId);
  const Dealer = mongoose.models.Dealer;
  const dealer = await Dealer.findById(dealerId, 'name salesman').lean();
  if (!dealer) throw bad('dealer not found');
  const date = String(input.date || todayYmd());
  if (!YMD.test(date)) throw bad('date must be YYYY-MM-DD');
  const channel = String(input.channel || 'CALL').toUpperCase(); if (!CHANNELS.includes(channel)) throw bad('bad channel');
  const outcome = String(input.outcome || 'OTHER').toUpperCase(); if (!OUTCOMES.includes(outcome)) throw bad('bad outcome');
  if (input.nextFollowupDate && !YMD.test(String(input.nextFollowupDate))) throw bad('nextFollowupDate must be YYYY-MM-DD');
  const balance = await ColBalance.findOne({ dealerId }).lean();
  const employeeId = String(input.employeeId || by);

  const f = await ColFollowUp.create({
    dealerId, cycleId: balance?.openCycleId || null, employeeId, date, time: String(input.time || '').slice(0, 5), channel,
    discussion: String(input.discussion || '').slice(0, 4000), outcome, customerResponse: String(input.customerResponse || '').slice(0, 2000),
    nextFollowupDate: String(input.nextFollowupDate || ''), nextAction: String(input.nextAction || '').slice(0, 500), remarks: String(input.remarks || '').slice(0, 2000),
    createdBy: by, source: 'app',
  });
  const events = [{ dealerId, cycleId: f.cycleId, type: 'FOLLOWUP', refType: 'followup', refId: f._id, by, at: new Date(date + 'T' + (f.time || '00:00') + ':00'), note: `${channel} · ${outcome}` }];

  let promise = null;
  const pa = Math.round(Number(input.promise?.amount)); const pd = String(input.promise?.date || '');
  if (outcome === 'PROMISED' || (pa > 0 && pd)) {
    if (!(pa > 0)) throw bad('a promise needs an amount');
    if (!YMD.test(pd)) throw bad('promise date must be YYYY-MM-DD');
    if (pd < date) throw bad('promise date cannot be before the follow-up');
    promise = await ColPromise.create({ dealerId, cycleId: f.cycleId, employeeId, amount: pa, promiseDate: pd, followupId: f._id, notes: String(input.promise?.notes || '').slice(0, 1000) });
    f.promiseId = promise._id; await f.save();
    events.push({ dealerId, cycleId: f.cycleId, type: 'PROMISE_MADE', amount: pa, refType: 'promise', refId: promise._id, by, at: new Date(), note: 'by ' + pd });
    await bump(employeeId, date, { promisesTaken: 1 });
  }
  await ColEvent.insertMany(events);
  await bump(employeeId, date, { followups: 1, ...(channel === 'CALL' ? { calls: 1 } : channel === 'VISIT' ? { visits: 1 } : channel === 'WHATSAPP' ? { whatsapps: 1 } : {}) });

  if (balance) {
    await ColBalance.updateOne({ dealerId }, { $set: { lastFollowupAt: new Date(date + 'T00:00:00'), nextFollowupAt: f.nextFollowupDate || '' } });
    await setNextPromise(dealerId);
    await refreshBalance(dealerId);
  }
  await writeAudit({ entity: 'followup', entityId: f._id, action: 'recorded', after: { dealer: dealer.name, date, channel, outcome, promise: promise ? { amount: pa, date: pd } : null }, by });
  await hooks.emit('followup.recorded', { followupId: f._id, dealerId, by, taskId: input.completeTaskId || null });
  return { followup: f, promise };
}

/** A typo fix by its author inside the edit window; anything else is a new follow-up. */
export async function updateFollowup(id, patch, { by }) {
  const f = await ColFollowUp.findById(id);
  if (!f) throw bad('follow-up not found');
  const mins = await getSetting('collections.followupEditWindowMinutes');
  if (f.createdBy !== by || Date.now() - f.createdAt.getTime() > mins * 60_000) throw bad(`follow-ups can only be corrected by their author within ${mins} minutes; record a new one instead`);
  const before = {}; const after = {};
  for (const k of ['discussion', 'customerResponse', 'remarks', 'nextAction', 'time']) if (patch[k] !== undefined) { before[k] = f[k]; f[k] = String(patch[k]).slice(0, 4000); after[k] = f[k]; }
  await f.save();
  await writeAudit({ entity: 'followup', entityId: f._id, action: 'corrected', before, after, by });
  return f;
}

export async function cancelPromise(id, { by, reason }) {
  const p = await ColPromise.findById(id);
  if (!p) throw bad('promise not found');
  if (['FULFILLED', 'CANCELLED'].includes(p.status)) throw bad(`promise is ${p.status}`);
  p.status = 'CANCELLED'; p.cancelledBy = by; p.cancelReason = String(reason || '').slice(0, 500);
  await p.save();
  await ColEvent.create({ dealerId: p.dealerId, cycleId: p.cycleId, type: 'PROMISE_CANCELLED', amount: p.amount, refType: 'promise', refId: p._id, by, note: p.cancelReason });
  await setNextPromise(p.dealerId); await refreshBalance(p.dealerId);
  await writeAudit({ entity: 'promise', entityId: p._id, action: 'cancelled', after: { reason }, by });
  return p;
}

/** The daily sweep: a PENDING promise whose date has passed is BROKEN. Returns what it broke so automation can act. */
export async function breakOverduePromises(today = todayYmd()) {
  const due = await ColPromise.find({ status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] }, promiseDate: { $lt: today } });
  const broken = [];
  for (const p of due) {
    p.status = 'BROKEN'; p.brokenAt = new Date(); await p.save();
    await ColEvent.create({ dealerId: p.dealerId, cycleId: p.cycleId, type: 'PROMISE_BROKEN', amount: p.amount - p.received, refType: 'promise', refId: p._id, by: 'automation' });
    await bump(p.employeeId, today, { promisesBroken: 1 });
    await setNextPromise(p.dealerId); await refreshBalance(p.dealerId);
    broken.push(p);
  }
  return broken;
}

const withDealer = async items => {
  const Dealer = mongoose.models.Dealer;
  const names = new Map((await Dealer.find({ _id: { $in: [...new Set(items.map(i => String(i.dealerId)))] } }, 'name code').lean()).map(d => [String(d._id), d]));
  return items.map(i => ({ ...i, dealer: names.get(String(i.dealerId)) || null }));
};
export async function listFollowups(filter, { page = 1, limit = 50 } = {}) {
  const [items, total] = await Promise.all([ColFollowUp.find(filter).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), ColFollowUp.countDocuments(filter)]);
  return { items: await withDealer(items), total, page, limit };
}
export async function listPromises(filter, { page = 1, limit = 50 } = {}) {
  const [items, total] = await Promise.all([ColPromise.find(filter).sort({ promiseDate: 1 }).skip((page - 1) * limit).limit(limit).lean(), ColPromise.countDocuments(filter)]);
  return { items: await withDealer(items), total, page, limit };
}
