import mongoose from 'mongoose';
import Counter from '../../models/Counter.js';
import { args, connect, normName, ymd } from './_shared.mjs';
import { ColFollowUp, ColPromise, ColPayment, ColAttachment, ColBalance, ColEvent } from '../models/index.js';
import { commitmentState, receivedOn } from '../../lib/commitments.js';
import { refreshBalance } from '../engines/reconcile.js';
/**
 * M3 — every legacy follow-up becomes a follow-up event; those carrying a
 * promised amount also become promises; manual credits become confirmed
 * payments (balance untouched — the legacy snapshot is assumed to include
 * them); credits inferred from a sheet drop become ADJUSTMENT events.
 */
const { dryRun, db } = args();
await connect({ db });
const Dealer = mongoose.models.Dealer;
const legacy = mongoose.connection.db.collection('outstandingfollowups');
const rows = await legacy.find({}).sort({ createdAt: 1 }).toArray();
const dealers = new Map((await Dealer.find({}, 'name salesman').lean()).map(d => [normName(d.name), d]));
const done = new Set((await ColFollowUp.find({ source: 'migrated' }, 'legacyId').lean()).map(f => f.legacyId));
const outcomeOf = f => f.type === 'no-pickup' ? 'NO_ANSWER' : (f.status === 'done' && (f.collectedAmount > 0 || receivedOn(f) > 0)) ? 'PAID' : (Number(f.amount) > 0 ? 'PROMISED' : 'OTHER');
const statusOf = f => ({ SETTLED: 'FULFILLED', BROKEN: 'BROKEN', OPEN: 'PENDING' })[commitmentState(f)] || 'PENDING';

let n = { followups: 0, promises: 0, payments: 0, adjustments: 0, skippedNoDealer: 0, already: 0 };
const touched = new Set();
for (const f of rows) {
  const lid = String(f._id);
  if (done.has(lid)) { n.already++; continue; }
  const d = dealers.get(normName(f.dealerName));
  if (!d) { n.skippedNoDealer++; continue; }
  const employeeId = f.salesman || d.salesman || f.createdBy || 'none';
  const isPromise = Number(f.amount) > 0 && f.type !== 'collection';
  n.followups++; if (isPromise) n.promises++;
  for (const c of f.credits || []) { if (c.source === 'manual') n.payments++; else n.adjustments++; }
  if (dryRun) continue;

  const balance = await ColBalance.findOne({ dealerId: d._id }, 'openCycleId').lean();
  const fu = await ColFollowUp.create({
    dealerId: d._id, cycleId: balance?.openCycleId || null, employeeId, date: ymd(f.createdAt), time: new Date(f.createdAt).toTimeString().slice(0, 5),
    channel: 'CALL', outcome: outcomeOf(f), discussion: f.comment || '', remarks: f.reason || '', customerResponse: '',
    nextFollowupDate: (!isPromise && f.status === 'pending' && f.followupDate) ? f.followupDate : '',
    createdBy: f.createdBy || employeeId, source: 'migrated', legacyId: lid, legacy: { reason: f.reason, months: f.months, type: f.type, status: f.status, followupDate: f.followupDate },
  });
  await ColEvent.create({ dealerId: d._id, cycleId: fu.cycleId, type: 'FOLLOWUP', refType: 'followup', refId: fu._id, by: fu.createdBy, at: f.createdAt, note: `migrated · ${f.reason || f.type}` });
  if (isPromise) {
    const pr = await ColPromise.create({ dealerId: d._id, cycleId: fu.cycleId, employeeId, amount: Math.round(f.amount), promiseDate: f.followupDate, status: statusOf(f), received: Math.round(receivedOn(f)), followupId: fu._id, notes: f.comment || '', legacyId: lid,
      brokenAt: statusOf(f) === 'BROKEN' ? f.updatedAt : null, fulfilledAt: statusOf(f) === 'FULFILLED' ? (f.settledAt || f.collectedAt || f.updatedAt) : null });
    fu.promiseId = pr._id; await fu.save();
    await ColEvent.create({ dealerId: d._id, cycleId: fu.cycleId, type: 'PROMISE_MADE', amount: pr.amount, refType: 'promise', refId: pr._id, by: employeeId, at: f.createdAt, note: 'migrated · by ' + f.followupDate });
    if (pr.status === 'BROKEN') await ColEvent.create({ dealerId: d._id, type: 'PROMISE_BROKEN', amount: pr.amount - pr.received, refType: 'promise', refId: pr._id, by: 'migration', at: pr.brokenAt || new Date() });
    if (pr.status === 'FULFILLED') await ColEvent.create({ dealerId: d._id, type: 'PROMISE_KEPT', amount: pr.amount, refType: 'promise', refId: pr._id, by: 'migration', at: pr.fulfilledAt || new Date() });
  }
  let proofId = null;
  if (f.paymentProof) { const buf = Buffer.from(String(f.paymentProof).replace(/^data:[^;]+;base64,/, ''), 'base64'); const att = await ColAttachment.create({ kind: 'payment_proof', mime: 'image/jpeg', size: buf.length, data: buf, dealerId: d._id, uploadedBy: f.createdBy || 'migration' }); proofId = att._id; }
  for (const c of f.credits || []) {
    if (c.source === 'manual') {
      const p = await ColPayment.create({ paymentNo: await Counter.next('col_payment'), dealerId: d._id, cycleId: fu.cycleId, salesmanId: employeeId, date: ymd(c.at || f.updatedAt), amount: Math.round(c.amount), mode: 'OTHER',
        reference: '', collectedBy: employeeId, enteredBy: c.by || 'migration', remarks: `migrated${c.note ? ' · ' + c.note : ''} · balance not adjusted (legacy snapshot assumed to include it)`, proofId, status: 'CONFIRMED', allocated: 0, unallocated: Math.round(c.amount), confirmedBy: c.by || 'migration', confirmedAt: c.at || f.updatedAt, source: 'migrated', legacyId: lid });
      await ColEvent.create({ dealerId: d._id, cycleId: fu.cycleId, type: 'PAYMENT_CONFIRMED', amount: p.amount, refType: 'payment', refId: p._id, by: p.enteredBy, at: c.at || f.updatedAt, note: 'migrated', meta: { migrated: true, balanceAdjusted: false } });
    } else {
      await ColEvent.create({ dealerId: d._id, cycleId: fu.cycleId, type: 'ADJUSTMENT', amount: Math.round(c.amount), refType: 'followup', refId: fu._id, by: c.by || 'migration', at: c.at || f.updatedAt, cause: 'LEGACY_SHEET_DROP', note: c.note || 'credit inferred from a weekly sheet drop (not evidence of payment)' });
    }
  }
  touched.add(String(d._id));
}
console.log(JSON.stringify(n));
if (dryRun) { console.log('\nDRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }
for (const id of touched) {
  const dealerId = new mongoose.Types.ObjectId(id);
  const last = await ColFollowUp.findOne({ dealerId }).sort({ date: -1 }).lean();
  const nextP = await ColPromise.findOne({ dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).lean();
  const nextF = await ColFollowUp.findOne({ dealerId, nextFollowupDate: { $gt: '' } }).sort({ nextFollowupDate: 1 }).lean();
  await ColBalance.updateOne({ dealerId }, { $set: { lastFollowupAt: last ? new Date(last.date + 'T00:00:00') : null, nextFollowupAt: nextF?.nextFollowupDate || '', promise: nextP ? { id: nextP._id, amount: nextP.amount - nextP.received, date: nextP.promiseDate } : undefined, brokenPromises: await ColPromise.countDocuments({ dealerId, status: 'BROKEN' }) } });
  await refreshBalance(dealerId);
}
console.log(`balances refreshed for ${touched.size} dealers`);
await mongoose.disconnect();
