import mongoose from 'mongoose';
import Counter from '../../models/Counter.js';
import { ColPayment, ColPaymentAllocation, ColAttachment, ColBalance, ColCycle, ColInvoice, ColPromise, ColEvent, PAYMENT_MODES } from '../models/index.js';
import { withTxn, refreshBalance, oldestPeriodOf } from '../engines/reconcile.js';
import { sortPeriods, daysSincePeriodStart, todayYmd } from '../lib/periods.js';
import { writeAudit } from '../lib/audit.js';
import * as hooks from '../engines/hooks.js';
/** A Map field is a Map on a document and a plain object after .lean(); either way, an object. */
const asObj = b => b instanceof Map ? Object.fromEntries(b) : (b && typeof b === 'object' ? b : {});

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const oid = v => new mongoose.Types.ObjectId(String(v));
const bad = m => { const e = new Error(m); e.status = 400; return e; };

/** Salesmen record; only accounts confirms. Recording never touches the balance. */
export async function recordPayment(input, { by }) {
  const amount = Math.round(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) throw bad('amount must be a positive whole-rupee figure');
  if (!YMD.test(String(input.date || ''))) throw bad('date must be YYYY-MM-DD');
  if (input.date > todayYmd()) throw bad('a payment cannot be dated in the future');
  const mode = String(input.mode || 'OTHER').toUpperCase();
  if (!PAYMENT_MODES.includes(mode)) throw bad('mode must be one of ' + PAYMENT_MODES.join(', '));
  const dealerId = oid(input.dealerId);
  const Dealer = mongoose.models.Dealer;
  const dealer = await Dealer.findById(dealerId, 'name salesman').lean();
  if (!dealer) throw bad('dealer not found');
  const balance = await ColBalance.findOne({ dealerId }).lean();

  let proofId = null;
  if (input.proof?.data) {
    const buf = Buffer.from(String(input.proof.data).replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (buf.length > 5 * 1024 * 1024) throw bad('proof is larger than 5 MB');
    const att = await ColAttachment.create({ kind: 'payment_proof', mime: String(input.proof.mime || 'image/jpeg'), size: buf.length, data: buf, dealerId, uploadedBy: by });
    proofId = att._id;
  }

  // Allocations are validated now so a bad one is refused before anything is written.
  const allocs = Array.isArray(input.allocations) ? input.allocations : [];
  let allocated = 0;
  const cleanAllocs = [];
  for (const a of allocs) {
    const amt = Math.round(Number(a.amount));
    if (!Number.isFinite(amt) || amt <= 0) throw bad('each allocation needs a positive amount');
    if (a.invoiceId) {
      const inv = await ColInvoice.findOne({ _id: oid(a.invoiceId), dealerId, status: 'OPEN' }).lean();
      if (!inv) throw bad('invoice not found for this dealer, or not open');
      if (amt > inv.pending) throw bad(`allocation ${amt} exceeds pending ${inv.pending} on ${inv.billRef}`);
      cleanAllocs.push({ invoiceId: inv._id, period: '', amount: amt });
    } else if (a.period) {
      if (!balance || !(a.period in asObj(balance.buckets))) throw bad(`the dealer has no ${a.period} bucket`);
      cleanAllocs.push({ invoiceId: null, period: String(a.period), amount: amt });
    } else throw bad('an allocation needs an invoiceId or a period');
    allocated += amt;
  }
  if (allocated > amount) throw bad(`allocations (${allocated}) exceed the payment (${amount})`);

  const paymentNo = await Counter.next('col_payment');
  const p = await ColPayment.create({
    paymentNo, dealerId, cycleId: balance?.openCycleId || null, salesmanId: dealer.salesman || '',
    date: input.date, amount, mode, reference: String(input.reference || '').slice(0, 120), bankReference: String(input.bankReference || '').slice(0, 120),
    collectedBy: String(input.collectedBy || by), enteredBy: by, remarks: String(input.remarks || '').slice(0, 1000),
    proofId, status: 'RECORDED', allocated, unallocated: amount - allocated,
  });
  if (cleanAllocs.length) await ColPaymentAllocation.insertMany(cleanAllocs.map(a => ({ ...a, paymentId: p._id, dealerId, cycleId: p.cycleId, by })));
  await ColEvent.create({ dealerId, cycleId: p.cycleId, type: 'PAYMENT_RECORDED', amount, refType: 'payment', refId: p._id, by, at: new Date(input.date + 'T00:00:00'), note: `${mode} ${input.reference || ''}`.trim() });
  await writeAudit({ entity: 'payment', entityId: p._id, action: 'recorded', after: { paymentNo, dealer: dealer.name, amount, mode, date: input.date }, by });
  return p;
}

/**
 * Money is real once accounts confirms it. In one transaction: balance,
 * buckets/invoices, cycle, promises, events — and enough recorded on the
 * payment to reverse every one of them exactly if the cheque bounces.
 */
export async function confirmPayment(paymentId, { by }) {
  return withTxn(async session => {
    const p = await ColPayment.findById(paymentId).session(session);
    if (!p) throw bad('payment not found');
    if (p.status === 'CONFIRMED') return p;
    if (p.status !== 'RECORDED') throw bad(`payment is ${p.status}; only RECORDED payments can be confirmed`);

    const balance = await ColBalance.findOne({ dealerId: p.dealerId }).session(session);
    const cycle = balance?.openCycleId ? await ColCycle.findById(balance.openCycleId).session(session) : null;
    const allocs = await ColPaymentAllocation.find({ paymentId: p._id }).session(session).lean();
    const applied = { buckets: {}, invoices: [], promises: [], before: balance?.total || 0 };

    if (balance) {
      const buckets = asObj(balance.buckets);
      const reduceBucket = (period, amt) => { const take = Math.min(amt, buckets[period] || 0); if (take > 0) { buckets[period] -= take; applied.buckets[period] = (applied.buckets[period] || 0) + take; } return amt - take; };
      let left = p.amount;
      for (const a of allocs) {
        if (a.invoiceId) {
          const inv = await ColInvoice.findById(a.invoiceId).session(session);
          if (inv) { const take = Math.min(a.amount, inv.pending); inv.pending -= take; if (inv.pending === 0) { inv.status = 'SETTLED'; inv.settledAt = new Date(); } await inv.save({ session }); applied.invoices.push({ invoiceId: inv._id, amount: take }); if (inv.period) reduceBucket(inv.period, take); left -= take; }
        } else if (a.period) { left -= (a.amount - reduceBucket(a.period, a.amount)); }
      }
      // Whatever is not allocated by hand clears the oldest money first.
      for (const period of sortPeriods(Object.keys(buckets))) { if (left <= 0) break; left = reduceBucket(period, left); }
      balance.buckets = buckets;
      balance.total = Math.max(0, (balance.total || 0) - p.amount);
      balance.lastPaymentAt = new Date(p.date + 'T00:00:00');
      const oldest = balance.balanceMode === 'buckets' ? oldestPeriodOf(buckets) : balance.oldestPeriod;
      balance.oldestPeriod = oldest; balance.ageDays = oldest ? daysSincePeriodStart(oldest, todayYmd()) : balance.ageDays;
      balance.version = (balance.version || 0) + 1;
    }
    if (cycle) { cycle.paidTotal += p.amount; if (balance.total === 0) { cycle.status = 'CLEARED'; cycle.closedAt = new Date(); cycle.finalTotal = 0; cycle.closedBy = by; balance.openCycleId = null; } await cycle.save({ session }); }

    // Money goes to the promises still standing first, oldest first; a broken
    // one only gets what is left over. Otherwise a fresh "1L by the 20th" would
    // be starved by an old broken promise sitting ahead of it in date order,
    // and the dealer's kept word would show as a late payment on the wrong one.
    let toCredit = p.amount;
    const promises = [
      ...await ColPromise.find({ dealerId: p.dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).session(session),
      ...await ColPromise.find({ dealerId: p.dealerId, status: 'BROKEN' }).sort({ promiseDate: 1 }).session(session),
    ];
    for (const pr of promises) {
      if (toCredit <= 0) break;
      const gap = Math.max(0, pr.amount - pr.received); const give = Math.min(gap, toCredit);
      if (give <= 0) continue;
      pr.received += give; toCredit -= give;
      if (pr.received >= pr.amount) { pr.status = 'FULFILLED'; pr.fulfilledAt = new Date(); } else pr.status = 'PARTIALLY_FULFILLED';
      await pr.save({ session });
      applied.promises.push({ promiseId: pr._id, amount: give, wasStatus: pr.status });
      if (pr.status === 'FULFILLED') await ColEvent.create([{ dealerId: p.dealerId, cycleId: p.cycleId, type: 'PROMISE_KEPT', amount: pr.amount, refType: 'promise', refId: pr._id, by }], { session });
    }
    if (balance) {
      const next = await ColPromise.findOne({ dealerId: p.dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).session(session).lean();
      balance.promise = next ? { id: next._id, amount: next.amount - next.received, date: next.promiseDate } : undefined;
      balance.brokenPromises = await ColPromise.countDocuments({ dealerId: p.dealerId, status: 'BROKEN' }).session(session);
      await balance.save({ session });
    }

    p.status = 'CONFIRMED'; p.confirmedBy = by; p.confirmedAt = new Date();
    p.set('reversal', applied, { strict: false });
    await p.save({ session });
    const events = [{ dealerId: p.dealerId, cycleId: p.cycleId, type: 'PAYMENT_CONFIRMED', amount: p.amount, before: applied.before, after: balance?.total ?? null, refType: 'payment', refId: p._id, by, at: new Date(p.date + 'T00:00:00') }];
    if (cycle && cycle.status === 'CLEARED') events.push({ dealerId: p.dealerId, cycleId: cycle._id, type: 'CLEARED', amount: applied.before, before: applied.before, after: 0, cause: 'PAYMENT', refType: 'payment', refId: p._id, by });
    await ColEvent.insertMany(events, { session });
    await writeAudit({ entity: 'payment', entityId: p._id, action: 'confirmed', before: { status: 'RECORDED' }, after: { status: 'CONFIRMED', balanceBefore: applied.before, balanceAfter: balance?.total }, by });
    return p;
  }).then(async p => { await refreshBalance(p.dealerId); await hooks.emit('payment.confirmed', { paymentId: p._id, dealerId: p.dealerId, by }); if (p.cycleId) await hooks.emit('cycle.check', { dealerId: p.dealerId }); return p; });
}

/** Cheque bounced: put back exactly what confirm took out. A cycle closed by this money opens again as a new cycle — the old one stays closed on record. */
export async function bouncePayment(paymentId, { by, reason }) {
  return withTxn(async session => {
    const p = await ColPayment.findById(paymentId).session(session);
    if (!p) throw bad('payment not found');
    if (p.status !== 'CONFIRMED') throw bad(`payment is ${p.status}; only CONFIRMED payments can bounce`);
    const rev = p.get('reversal') || {};
    const balance = await ColBalance.findOne({ dealerId: p.dealerId }).session(session);
    if (balance) {
      const buckets = asObj(balance.buckets);
      for (const [period, amt] of Object.entries(rev.buckets || {})) buckets[period] = (buckets[period] || 0) + amt;
      balance.buckets = buckets; balance.total = (balance.total || 0) + p.amount;
      const oldest = balance.balanceMode === 'buckets' ? oldestPeriodOf(buckets) : balance.oldestPeriod;
      balance.oldestPeriod = oldest; balance.ageDays = oldest ? daysSincePeriodStart(oldest, todayYmd()) : balance.ageDays;
    }
    for (const iv of rev.invoices || []) { const inv = await ColInvoice.findById(iv.invoiceId).session(session); if (inv) { inv.pending += iv.amount; inv.status = 'OPEN'; inv.settledAt = null; await inv.save({ session }); } }
    for (const pc of rev.promises || []) { const pr = await ColPromise.findById(pc.promiseId).session(session); if (pr) { pr.received = Math.max(0, pr.received - pc.amount); pr.status = pr.received >= pr.amount ? 'FULFILLED' : (pr.promiseDate < todayYmd() ? 'BROKEN' : (pr.received > 0 ? 'PARTIALLY_FULFILLED' : 'PENDING')); pr.fulfilledAt = pr.status === 'FULFILLED' ? pr.fulfilledAt : null; await pr.save({ session }); } }
    let cycle = p.cycleId ? await ColCycle.findById(p.cycleId).session(session) : null;
    if (cycle) { cycle.paidTotal = Math.max(0, cycle.paidTotal - p.amount); await cycle.save({ session }); }
    if (balance && balance.total > 0 && !balance.openCycleId) {
      const last = await ColCycle.findOne({ dealerId: p.dealerId }).sort({ cycleNo: -1 }).session(session).lean();
      const [nc] = await ColCycle.create([{ dealerId: p.dealerId, cycleNo: (last?.cycleNo || 0) + 1, status: 'OPEN', openedAt: new Date(), openingTotal: balance.total, peakTotal: balance.total }], { session });
      balance.openCycleId = nc._id;
      await ColEvent.create([{ dealerId: p.dealerId, cycleId: nc._id, type: 'REOPENED', amount: balance.total, cause: 'BOUNCE', refType: 'payment', refId: p._id, by, note: `payment #${p.paymentNo} bounced` }], { session });
    }
    if (balance) {
      // The status is derived from these three, so they must reflect the reversal too.
      const next = await ColPromise.findOne({ dealerId: p.dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).session(session).lean();
      balance.promise = next ? { id: next._id, amount: next.amount - next.received, date: next.promiseDate } : undefined;
      balance.brokenPromises = await ColPromise.countDocuments({ dealerId: p.dealerId, status: 'BROKEN' }).session(session);
      const lastPaid = await ColPayment.findOne({ dealerId: p.dealerId, status: 'CONFIRMED', _id: { $ne: p._id } }, 'date').sort({ date: -1 }).session(session).lean();
      balance.lastPaymentAt = lastPaid ? new Date(lastPaid.date + 'T00:00:00') : null;
      balance.version = (balance.version || 0) + 1; await balance.save({ session });
    }
    p.status = 'BOUNCED'; p.cancelReason = String(reason || '').slice(0, 500); p.cancelledBy = by; await p.save({ session });
    await ColEvent.create([{ dealerId: p.dealerId, cycleId: p.cycleId, type: 'PAYMENT_BOUNCED', amount: p.amount, refType: 'payment', refId: p._id, by, note: p.cancelReason }], { session });
    await writeAudit({ entity: 'payment', entityId: p._id, action: 'bounced', before: { status: 'CONFIRMED' }, after: { status: 'BOUNCED', reason }, by });
    return p;
  }).then(async p => { await refreshBalance(p.dealerId); await hooks.emit('payment.bounced', { paymentId: p._id, dealerId: p.dealerId, by }); return p; });
}

/** A RECORDED payment that was a mistake. Nothing was ever applied, so nothing is reversed. */
export async function cancelPayment(paymentId, { by, reason }) {
  const p = await ColPayment.findById(paymentId);
  if (!p) throw bad('payment not found');
  if (p.status !== 'RECORDED') throw bad(`payment is ${p.status}; only RECORDED payments can be cancelled (confirmed ones bounce)`);
  p.status = 'CANCELLED'; p.cancelledBy = by; p.cancelReason = String(reason || '').slice(0, 500);
  await p.save();
  await ColEvent.create({ dealerId: p.dealerId, cycleId: p.cycleId, type: 'PAYMENT_CANCELLED', amount: p.amount, refType: 'payment', refId: p._id, by, note: p.cancelReason });
  await writeAudit({ entity: 'payment', entityId: p._id, action: 'cancelled', before: { status: 'RECORDED' }, after: { status: 'CANCELLED', reason }, by });
  return p;
}

export async function listPayments(filter, { page = 1, limit = 50 } = {}) {
  const [items, total] = await Promise.all([
    ColPayment.find(filter).sort({ date: -1, paymentNo: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ColPayment.countDocuments(filter)]);
  const Dealer = mongoose.models.Dealer;
  const names = new Map((await Dealer.find({ _id: { $in: items.map(i => i.dealerId) } }, 'name code').lean()).map(d => [String(d._id), d]));
  const bm = new Map((await ColBalance.find({ dealerId: { $in: items.map(i => i.dealerId) } }, 'dealerId buckets total').lean()).map(b => [String(b.dealerId), b]));
  return { items: items.map(i => ({ ...i, dealer: names.get(String(i.dealerId)) || null, buckets: asObj(bm.get(String(i.dealerId))?.buckets), balanceTotal: bm.get(String(i.dealerId))?.total ?? null })), total, page, limit };
}
