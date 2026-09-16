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
  // If a statement already showed this money going out, the record is confirmed right away —
  // against a decrease still open, or against a payment the statement wrote on its own.
  try {
    const done = await autoConfirmFromStatements(dealerId, {});
    if (done.some(id => String(id) === String(p._id))) return ColPayment.findById(p._id);
    if (await absorbIntoStatementPayments(p._id, {})) return ColPayment.findById(p._id);
  } catch (e) { console.warn('[COL AUTO-CONFIRM]', e.message); }
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
  const came = await cameSoFar(items);
  return { items: items.map(i => ({ ...i, dealer: names.get(String(i.dealerId)) || null, buckets: asObj(bm.get(String(i.dealerId))?.buckets), balanceTotal: bm.get(String(i.dealerId))?.total ?? null, cameSoFar: came.get(String(i._id)) ?? null })), total, page, limit };
}

/* ─────────────────── statement decreases awaiting approval ───────────────────
 * The morning statement shows a dealer owing less than yesterday. The engine
 * records the gap (RECONCILIATION_DIFFERENCE, amount = decrease not explained
 * by confirmed payments). Accounts then say what it was: money received
 * (approve → a confirmed payment is written against the dealer, promises are
 * credited, the cycle's paid total moves) or not a payment (dismiss → credit
 * note, return, correction). The balance itself is not touched either way —
 * the statement already moved it. */
const PENDING = { type: 'RECONCILIATION_DIFFERENCE', amount: { $gt: 0 }, 'meta.approved': { $exists: false } };
// Set COLLECTIONS_APPROVALS=1 to keep unexplained decreases for a person to approve. Off by default: the statement is the record.
const needsApproval = () => process.env.COLLECTIONS_APPROVALS === '1';
/** The statement is uploaded in the morning; whatever it shows as paid came in the day before. */
const cameOn = asOn => { const d = new Date((asOn || todayYmd()) + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };

export async function listPendingApprovals(scopeF, { page = 1, limit = 50 } = {}) {
  const f = { ...scopeF, ...PENDING };
  const [items, total, agg] = await Promise.all([
    ColEvent.find(f).sort({ at: -1 }).skip((page - 1) * limit).limit(limit).lean(), ColEvent.countDocuments(f),
    ColEvent.aggregate([{ $match: f }, { $group: { _id: null, sum: { $sum: '$amount' } } }])]);
  const ids = items.map(i => i.dealerId);
  const Dealer = mongoose.models.Dealer;
  const [names, bals, promises] = await Promise.all([
    Dealer.find({ _id: { $in: ids } }, 'name code phone').lean(),
    ColBalance.find({ dealerId: { $in: ids } }, 'dealerId buckets total status priority').lean(),
    ColPromise.find({ dealerId: { $in: ids }, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED', 'BROKEN'] } }, 'dealerId amount received promiseDate status').lean()]);
  const nm = new Map(names.map(d => [String(d._id), d])), bm = new Map(bals.map(b => [String(b.dealerId), b]));
  const pm = new Map(); for (const pr of promises) { const k = String(pr.dealerId); if (!pm.has(k)) pm.set(k, []); pm.get(k).push(pr); }
  return { items: items.map(e => { const b = bm.get(String(e.dealerId)); return { ...e, dealer: nm.get(String(e.dealerId)) || null, buckets: asObj(b?.buckets), balanceTotal: b?.total ?? null, status: b?.status, priority: b?.priority, promises: pm.get(String(e.dealerId)) || [] }; }), total, page, limit, sum: agg[0]?.sum || 0 };
}

/** Unapproved decrease per dealer — what a row shows as "₹X came · pending approval". */
export async function pendingByDealer(dealerIds) {
  const ids = dealerIds.map(oid);
  const [dec, rec] = await Promise.all([
    ColEvent.aggregate([{ $match: { ...PENDING, dealerId: { $in: ids } } }, { $group: { _id: '$dealerId', sum: { $sum: '$amount' }, n: { $sum: 1 } } }]),
    ColPayment.aggregate([{ $match: { status: 'RECORDED', dealerId: { $in: ids } } }, { $group: { _id: '$dealerId', sum: { $sum: '$amount' }, n: { $sum: 1 } } }])]);
  const m = new Map();
  for (const a of dec) m.set(String(a._id), { amount: a.sum, count: a.n, recorded: 0, recordedCount: 0 });
  for (const a of rec) { const k = String(a._id); const cur = m.get(k) || { amount: 0, count: 0, recorded: 0, recordedCount: 0 }; cur.recorded = a.sum; cur.recordedCount = a.n; m.set(k, cur); }
  return m;
}

export async function approveDecrease(eventId, { by }) {
  return withTxn(async session => {
    const e = await ColEvent.findById(eventId).session(session);
    if (!e || e.type !== 'RECONCILIATION_DIFFERENCE') throw bad('not a statement decrease');
    if (e.meta?.approved !== undefined) throw bad('already decided');
    if (!(e.amount > 0)) throw bad('nothing to approve');
    const Dealer = mongoose.models.Dealer;
    const dealer = await Dealer.findById(e.dealerId, 'name salesman').session(session).lean();
    const balance = await ColBalance.findOne({ dealerId: e.dealerId }).session(session);
    const paymentNo = await Counter.next('col_payment');
    const date = cameOn(e.meta?.to);
    const [p] = await ColPayment.create([{
      paymentNo, dealerId: e.dealerId, cycleId: e.cycleId || balance?.openCycleId || null, salesmanId: dealer?.salesman || '',
      date, amount: e.amount, mode: 'OTHER', reference: `statement ${e.meta?.to}`, collectedBy: '', enteredBy: by, remarks: `Decrease in the statement of ${e.meta?.to}, approved as money received`,
      status: 'CONFIRMED', allocated: 0, unallocated: e.amount, confirmedBy: by, confirmedAt: new Date(), source: 'statement',
    }], { session });
    // The same crediting a confirmed payment does — promises first, then the cycle — but the balance stays: the statement already moved it.
    let toCredit = e.amount;
    const promises = [
      ...await ColPromise.find({ dealerId: e.dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).session(session),
      ...await ColPromise.find({ dealerId: e.dealerId, status: 'BROKEN' }).sort({ promiseDate: 1 }).session(session)];
    for (const pr of promises) {
      if (toCredit <= 0) break;
      const gap = Math.max(0, pr.amount - pr.received); const give = Math.min(gap, toCredit); if (give <= 0) continue;
      pr.received += give; toCredit -= give;
      if (pr.received >= pr.amount) { pr.status = 'FULFILLED'; pr.fulfilledAt = new Date(); } else pr.status = 'PARTIALLY_FULFILLED';
      await pr.save({ session });
      if (pr.status === 'FULFILLED') await ColEvent.create([{ dealerId: e.dealerId, cycleId: e.cycleId, type: 'PROMISE_KEPT', amount: pr.amount, refType: 'promise', refId: pr._id, by }], { session });
    }
    const cycle = e.cycleId ? await ColCycle.findById(e.cycleId).session(session) : null;
    if (cycle) { cycle.paidTotal += e.amount; await cycle.save({ session }); }
    if (balance) {
      const next = await ColPromise.findOne({ dealerId: e.dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).session(session).lean();
      balance.promise = next ? { id: next._id, amount: next.amount - next.received, date: next.promiseDate } : undefined;
      balance.brokenPromises = await ColPromise.countDocuments({ dealerId: e.dealerId, status: 'BROKEN' }).session(session);
      balance.lastPaymentAt = new Date(date + 'T00:00:00');
      await balance.save({ session });
    }
    e.set('meta', { ...(e.meta || {}), approved: true, approvedBy: by, approvedAt: new Date(), paymentId: p._id }); e.markModified('meta'); await e.save({ session });
    await ColEvent.create([{ dealerId: e.dealerId, cycleId: e.cycleId, type: 'PAYMENT_CONFIRMED', amount: e.amount, refType: 'payment', refId: p._id, by, note: `from statement ${date} · approved` }], { session });
    await writeAudit({ entity: 'payment', entityId: p._id, action: 'approved-from-statement', after: { dealer: dealer?.name, amount: e.amount, statement: date, eventId: e._id }, by });
    return p;
  }).then(async p => { await refreshBalance(p.dealerId); return p; });
}

export async function dismissDecrease(eventId, { by, reason }) {
  const e = await ColEvent.findById(eventId);
  if (!e || e.type !== 'RECONCILIATION_DIFFERENCE') throw bad('not a statement decrease');
  if (e.meta?.approved !== undefined) throw bad('already decided');
  e.set('meta', { ...(e.meta || {}), approved: false, dismissedBy: by, dismissedAt: new Date(), reason: String(reason || '').slice(0, 300) }); e.markModified('meta'); await e.save();
  await writeAudit({ entity: 'event', entityId: e._id, action: 'decrease-not-a-payment', after: { amount: e.amount, reason }, by });
  return e;
}

/* ───────────── the sheet as proof: recorded payments confirmed by a decrease ─────────────
 * A salesman records ₹3,000. The next statement shows the dealer down by
 * ₹3,000 (or more). The money is evidently in — nobody needs to click. The
 * recorded payment is confirmed on its own (balance untouched: the statement
 * already moved it), promises are credited, and the decrease is marked
 * explained to that extent. Whatever the sheet cannot account for stays in
 * the approval queue. Runs after every statement, and again whenever a
 * payment is recorded (the sheet may already have shown the drop). */
async function creditMoney(dealerId, amount, cycleId, by, session) {
  let toCredit = amount;
  const promises = [
    ...await ColPromise.find({ dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).session(session),
    ...await ColPromise.find({ dealerId, status: 'BROKEN' }).sort({ promiseDate: 1 }).session(session)];
  for (const pr of promises) {
    if (toCredit <= 0) break;
    const gap = Math.max(0, pr.amount - pr.received); const give = Math.min(gap, toCredit); if (give <= 0) continue;
    pr.received += give; toCredit -= give;
    if (pr.received >= pr.amount) { pr.status = 'FULFILLED'; pr.fulfilledAt = new Date(); } else pr.status = 'PARTIALLY_FULFILLED';
    await pr.save({ session });
    if (pr.status === 'FULFILLED') await ColEvent.create([{ dealerId, cycleId, type: 'PROMISE_KEPT', amount: pr.amount, refType: 'promise', refId: pr._id, by }], { session });
  }
  const cycle = cycleId ? await ColCycle.findById(cycleId).session(session) : null;
  if (cycle) { cycle.paidTotal += amount; await cycle.save({ session }); }
}

export async function autoConfirmFromStatements(dealerId, { by = 'statement' } = {}) {
  const did = [];
  await withTxn(async session => {
    const diffs = await ColEvent.find({ dealerId: oid(dealerId), ...PENDING }).sort({ at: 1 }).session(session);
    if (!diffs.length) return;
    const recorded = await ColPayment.find({ dealerId: oid(dealerId), status: 'RECORDED' }).sort({ date: 1, createdAt: 1 }).session(session);
    for (const e of diffs) {
      let left = e.amount; const used = [];
      for (const p of recorded) {
        if (p.status !== 'RECORDED' || p.date > (e.meta?.to || '9999')) continue;   // a payment dated after the statement cannot be in it
        if (p.amount > left) continue;
        p.status = 'CONFIRMED'; p.confirmedBy = by; p.confirmedAt = new Date();
        p.set('remarks', [p.remarks, `auto-confirmed: statement of ${e.meta?.to} shows the decrease`].filter(Boolean).join(' · ').slice(0, 1000));
        await p.save({ session });
        await creditMoney(e.dealerId, p.amount, p.cycleId || e.cycleId, by, session);
        await ColEvent.create([{ dealerId: e.dealerId, cycleId: p.cycleId || e.cycleId, type: 'PAYMENT_CONFIRMED', amount: p.amount, refType: 'payment', refId: p._id, by, note: `auto-confirmed by statement ${e.meta?.to}` }], { session });
        await writeAudit({ entity: 'payment', entityId: p._id, action: 'auto-confirmed', after: { amount: p.amount, statement: e.meta?.to, eventId: e._id }, by });
        left -= p.amount; used.push({ paymentId: p._id, amount: p.amount }); did.push(p._id);
        if (left <= 0) break;
      }
      // A promise is proof too: the dealer said how much, the sheet shows that
      // much (or more) went out. Written as a confirmed payment from the
      // statement, the promise kept. Less than promised is left for a person.
      if (left > 0) {
        const open = [
          ...await ColPromise.find({ dealerId: e.dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).session(session),
          ...await ColPromise.find({ dealerId: e.dealerId, status: 'BROKEN' }).sort({ promiseDate: 1 }).session(session)];
        for (const pr of open) {
          const due = Math.max(0, pr.amount - (pr.received || 0));
          if (due <= 0 || due > left) continue;
          const paymentNo = await Counter.next('col_payment');
          const date = cameOn(e.meta?.to);
          const [p] = await ColPayment.create([{ paymentNo, dealerId: e.dealerId, cycleId: e.cycleId, salesmanId: pr.employeeId || '', date, amount: due, mode: 'OTHER', reference: `statement ${e.meta?.to}`, enteredBy: by, remarks: `Promised ${pr.amount.toLocaleString('en-IN')} by ${pr.promiseDate}; the statement of ${e.meta?.to} shows it came`, status: 'CONFIRMED', allocated: 0, unallocated: due, confirmedBy: by, confirmedAt: new Date(), source: 'statement' }], { session });
          pr.received = pr.amount; pr.status = 'FULFILLED'; pr.fulfilledAt = new Date(); await pr.save({ session });
          await ColEvent.create([{ dealerId: e.dealerId, cycleId: e.cycleId, type: 'PROMISE_KEPT', amount: pr.amount, refType: 'promise', refId: pr._id, by, note: `statement ${date}` },
                                 { dealerId: e.dealerId, cycleId: e.cycleId, type: 'PAYMENT_CONFIRMED', amount: due, refType: 'payment', refId: p._id, by, note: `promise kept · statement ${date}` }], { session, ordered: true });
          const cycle = e.cycleId ? await ColCycle.findById(e.cycleId).session(session) : null;
          if (cycle) { cycle.paidTotal += due; await cycle.save({ session }); }
          await writeAudit({ entity: 'payment', entityId: p._id, action: 'auto-confirmed-promise', after: { amount: due, promiseId: pr._id, statement: date, eventId: e._id }, by });
          left -= due; used.push({ paymentId: p._id, promiseId: pr._id, amount: due }); did.push(p._id);
          if (left <= 0) break;
        }
      }
      // The rest is money too. The statement is the book of record: a dealer
      // owing less is a dealer who paid. Written as a confirmed payment from
      // the statement so it shows as collected — for the salesman, the
      // dashboard and the reports — with no one having to press anything.
      if (left > 0 && !needsApproval()) {
        const Dealer = mongoose.models.Dealer;
        const dealer = await Dealer.findById(e.dealerId, 'salesman').session(session).lean();
        const paymentNo = await Counter.next('col_payment');
        const date = cameOn(e.meta?.to);
        const [p] = await ColPayment.create([{ paymentNo, dealerId: e.dealerId, cycleId: e.cycleId, salesmanId: dealer?.salesman || '', date, amount: left, mode: 'OTHER', reference: `statement ${e.meta?.to}`, enteredBy: by, remarks: `Statement of ${e.meta?.to} shows ${left.toLocaleString('en-IN')} less owed`, status: 'CONFIRMED', allocated: 0, unallocated: left, confirmedBy: by, confirmedAt: new Date(), source: 'statement' }], { session });
        p.set('unmatched', left, { strict: false }); await p.save({ session });   // how much of it no record or promise has claimed yet
        await creditMoney(e.dealerId, left, e.cycleId, by, session);
        await ColEvent.create([{ dealerId: e.dealerId, cycleId: e.cycleId, type: 'PAYMENT_CONFIRMED', amount: left, refType: 'payment', refId: p._id, by, note: `from statement ${date}` }], { session });
        await writeAudit({ entity: 'payment', entityId: p._id, action: 'from-statement', after: { amount: left, statement: date, eventId: e._id }, by });
        used.push({ paymentId: p._id, amount: left, unmatched: true }); did.push(p._id); left = 0;
      }
      if (used.length) {
        const meta = { ...(e.meta || {}), autoConfirmed: [...(e.meta?.autoConfirmed || []), ...used], explained: (e.meta?.explained || 0) + (e.amount - left) };
        if (left <= 0) Object.assign(meta, { approved: true, approvedBy: by, approvedAt: new Date(), auto: true });
        e.amount = left; e.set('meta', meta); e.markModified('meta'); await e.save({ session });
      }
    }
    const balance = await ColBalance.findOne({ dealerId: oid(dealerId) }).session(session);
    if (balance && did.length) {
      const next = await ColPromise.findOne({ dealerId: oid(dealerId), status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }).sort({ promiseDate: 1 }).session(session).lean();
      balance.promise = next ? { id: next._id, amount: next.amount - next.received, date: next.promiseDate } : undefined;
      balance.brokenPromises = await ColPromise.countDocuments({ dealerId: oid(dealerId), status: 'BROKEN' }).session(session);
      const lastPaid = await ColPayment.findOne({ dealerId: oid(dealerId), status: 'CONFIRMED' }, 'date').sort({ date: -1 }).session(session).lean();
      if (lastPaid) balance.lastPaymentAt = new Date(lastPaid.date + 'T00:00:00');
      await balance.save({ session });
    }
  });
  if (did.length) await refreshBalance(dealerId);
  return did;
}

// After a statement: every dealer it left a decrease on gets the check.
hooks.on('import.applied', async ({ importId }) => {
  const dealers = await ColEvent.distinct('dealerId', { importId: oid(importId), ...PENDING });
  let n = 0, m = 0;
  for (const d of dealers) {
    try { n += (await autoConfirmFromStatements(d)).length; } catch (e) { console.warn('[COL AUTO-CONFIRM]', String(d), e.message); }
    // A record bigger than any single day's drop is covered once enough days add up.
    for (const r of await ColPayment.find({ dealerId: d, status: 'RECORDED' }).sort({ date: 1 }).lean()) {
      try { if (await absorbIntoStatementPayments(r._id, {})) m++; } catch (e) { console.warn('[COL AUTO-CONFIRM]', String(r._id), e.message); }
    }
  }
  if (n || m) console.log('[COL AUTO-CONFIRM]', n + m, 'recorded payment(s) confirmed by the statement');
});

/** For a RECORDED entry: how much the statements have shown coming in since it was recorded (capped at the entry). */
export async function cameSoFar(items) {
  const rec = items.filter(p => p.status === 'RECORDED'); if (!rec.length) return new Map();
  const pool = await ColPayment.find({ dealerId: { $in: rec.map(p => p.dealerId) }, source: 'statement', status: 'CONFIRMED', unmatched: { $gt: 0 } }, 'dealerId date unmatched').lean();
  const out = new Map();
  for (const p of rec) { const avail = pool.filter(x => String(x.dealerId) === String(p.dealerId) && x.date >= p.date).reduce((a, x) => a + (x.unmatched || 0), 0); out.set(String(p._id), Math.min(p.amount, avail)); }
  return out;
}

/**
 * A salesman records a payment the statement has already written on its own
 * (the drop showed up before he got to the app). His record is confirmed
 * against those statement payments and takes over that much of them, so the
 * money is counted once and the collection is his. Needs statement payments
 * dated on/after his payment adding up to at least his amount.
 */
export async function absorbIntoStatementPayments(paymentId, { by = 'statement' } = {}) {
  return withTxn(async session => {
    const p = await ColPayment.findById(paymentId).session(session);
    if (!p || p.status !== 'RECORDED') return null;
    const pool = await ColPayment.find({ dealerId: p.dealerId, source: 'statement', status: 'CONFIRMED', date: { $gte: p.date }, unmatched: { $gt: 0 } }).sort({ date: 1 }).session(session);
    const available = pool.reduce((a, x) => a + (x.get('unmatched') || 0), 0);
    if (available < p.amount) return null;
    let need = p.amount; const took = [];
    for (const x of pool) {
      if (need <= 0) break;
      const u = x.get('unmatched') || 0; const take = Math.min(u, need); if (take <= 0) continue;
      x.amount -= take; x.unallocated = Math.max(0, (x.unallocated || 0) - take); x.set('unmatched', u - take, { strict: false });
      if (x.amount <= 0) { await ColEvent.deleteMany({ refType: 'payment', refId: x._id }).session(session); await ColPayment.deleteOne({ _id: x._id }).session(session); }
      else await x.save({ session });
      need -= take; took.push({ paymentId: x._id, amount: take, date: x.date });
    }
    p.status = 'CONFIRMED'; p.confirmedBy = by; p.confirmedAt = new Date();
    p.set('remarks', [p.remarks, `confirmed: statement of ${took[took.length - 1].date} already showed it`].filter(Boolean).join(' · ').slice(0, 1000));
    await p.save({ session });
    await ColEvent.create([{ dealerId: p.dealerId, cycleId: p.cycleId, type: 'PAYMENT_CONFIRMED', amount: p.amount, refType: 'payment', refId: p._id, by, note: `matches statement ${took[took.length - 1].date}` }], { session });
    await writeAudit({ entity: 'payment', entityId: p._id, action: 'confirmed-against-statement', after: { amount: p.amount, took }, by });
    return p;
  });
}
