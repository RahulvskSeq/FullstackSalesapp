import mongoose from 'mongoose';
import { ColImport, ColImportRow, ColSnapshot, ColBalance, ColCycle, ColEvent, ColPayment } from '../models/index.js';
import { OLDER, periodKey, sortPeriods, daysSincePeriodStart, todayYmd } from '../lib/periods.js';
import { getSetting } from '../lib/settings.js';
import { writeAudit } from '../lib/audit.js';
import * as hooks from './hooks.js';

/* ────────────────────────────── pure ────────────────────────────── */

/** The classification table from reconciliation-engine.md. */
export function classify({ prevExists, prevTotal, curTotal, priorCycleStatus }) {
  const prev = prevExists ? (Number(prevTotal) || 0) : 0;
  const cur = Number(curTotal) || 0;
  if (!prevExists || prev === 0) {
    if (cur > 0) return priorCycleStatus === 'CLEARED' || priorCycleStatus === 'CLOSED_MANUAL' ? 'REOPENED' : 'NEW';
    return 'UNCHANGED';
  }
  if (cur > prev) return 'INCREASED';
  if (cur === 0) return 'CLEARED';
  if (cur < prev) return 'DECREASED';
  return 'UNCHANGED';
}

/** Total owed according to the statement's own meaning of a column. */
export function computeTotal(buckets, mode) {
  const entries = Object.entries(buckets || {});
  if (!entries.length) return 0;
  if (mode === 'snapshot') {
    const dated = entries.filter(([p]) => p !== OLDER);
    const pool = dated.length ? dated : entries;
    const latest = pool.reduce((a, b) => periodKey(b[0]) > periodKey(a[0]) ? b : a);
    return Math.max(0, Number(latest[1]) || 0);
  }
  return entries.reduce((s, [, v]) => s + Math.max(0, Number(v) || 0), 0);
}

/** Oldest bucket still carrying money, for ageing (buckets mode). */
export function oldestPeriodOf(buckets) {
  const live = Object.entries(buckets || {}).filter(([, v]) => (Number(v) || 0) > 0).map(([p]) => p);
  return live.length ? sortPeriods(live)[0] : '';
}

export function derivePriority({ total, ageDays, brokenPromises }, thresholds) {
  const t = thresholds || {};
  const hit = lvl => t[lvl] && ((t[lvl].total && total >= t[lvl].total) || (t[lvl].ageDays && ageDays !== null && ageDays >= t[lvl].ageDays));
  const order = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  let i = hit('critical') ? 3 : hit('high') ? 2 : hit('medium') ? 1 : 0;
  if ((brokenPromises || 0) >= 2) i = Math.min(3, i + 1);
  return order[i];
}

export function deriveStatus(b, cycle, cfg, today = todayYmd()) {
  if ((b.total || 0) <= 0) return cycle && cycle.status === 'CLOSED_MANUAL' ? 'CLOSED' : 'CLEARED';
  if (b.promise?.date && b.promise.date >= today && b.promise.amount > 0) return 'PROMISED';
  if ((b.brokenPromises || 0) > 0) return 'FOLLOW_UP_REQUIRED';
  if (b.lastPaymentAt && cycle && b.lastPaymentAt >= cycle.openedAt) return 'PARTIAL_PAYMENT';
  if ((b.total || 0) >= (cfg.highValue || Infinity)) return 'HIGH_PRIORITY';
  if (b.ageDays !== null && b.ageDays !== undefined && b.ageDays > (cfg.overdueDays || Infinity)) return 'OVERDUE';
  if (!b.lastFollowupAt || (cycle && b.lastFollowupAt < cycle.openedAt)) return 'NEW';
  return 'OPEN';
}

/* ─────────────────────────── transactions ─────────────────────────── */

let txnSupported = null;
const isTransient = e => typeof e?.hasErrorLabel === 'function' && e.hasErrorLabel('TransientTransactionError');
const unsupported = e => /Transaction numbers|replica set|not supported|IllegalOperation/i.test(String(e?.message));
/**
 * Run `fn(session)` in a transaction, under manual control.
 *
 * Not the driver's withTransaction: that retries the whole callback for up to
 * two minutes on anything it considers transient and, when the callback
 * itself failed, surfaces its own "transaction aborted" error instead of the
 * cause. Here a failure aborts once and rethrows the real error; only a
 * genuine write conflict (TransientTransactionError) is retried, three times.
 * Where the deployment has no replica set the work runs without a
 * transaction — every step is idempotent on (importId, dealerId), so a
 * partial run leaves nothing that a re-run cannot complete.
 */
export async function withTxn(fn) {
  if (txnSupported === false) return fn(null);
  for (let attempt = 1; ; attempt++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const out = await fn(session);
      await session.commitTransaction();
      txnSupported = true;
      return out;
    } catch (e) {
      try { if (session.inTransaction()) await session.abortTransaction(); } catch { /* already aborted */ }
      if (txnSupported !== true && unsupported(e)) {
        txnSupported = false;
        console.warn('[COL] transactions unavailable on this deployment — applying without them');
        return fn(null);
      }
      if (isTransient(e) && attempt < 3) { console.warn(`[COL] write conflict, retrying (${attempt})`); continue; }
      throw e;
    } finally { await session.endSession(); }
  }
}

/* ────────────────────────── the apply step ────────────────────────── */

const asDate = ymd => new Date(ymd + 'T00:00:00');
const toObj = m => m instanceof Map ? Object.fromEntries(m) : (m || {});

/** Everything a chunk of rows needs to read, in five queries. Lean documents. */
export async function preloadCtx(imp, ids, { session = null } = {}) {
  const cfg = { overdueDays: await getSetting('collections.overdueDays'), highValue: await getSetting('collections.highValue'), thresholds: await getSetting('collections.priorityThresholds') };
  // Sequential on purpose: operations inside one transaction share a session,
  // and the driver requires them one at a time — firing them together makes
  // the server reject the later ones with NoSuchTransaction.
  const existing = await ColSnapshot.find({ importId: imp._id, dealerId: { $in: ids } }, 'dealerId classification').session(session).lean();
  const prevs = await ColSnapshot.aggregate([{ $match: { dealerId: { $in: ids }, source: imp.source, superseded: false, asOn: { $lt: imp.asOn } } },
      { $sort: { asOn: -1, createdAt: -1 } }, { $group: { _id: '$dealerId', doc: { $first: '$$ROOT' } } }]).session(session);
  const cycles = await ColCycle.find({ dealerId: { $in: ids } }).sort({ cycleNo: -1 }).session(session).lean();
  const balances = await ColBalance.find({ dealerId: { $in: ids } }).session(session).lean();
  const payments = await ColPayment.find({ dealerId: { $in: ids }, status: 'CONFIRMED', date: { $lte: imp.asOn } }, 'dealerId date amount').session(session).lean();
  const ctx = { cfg, existing: new Map(), prev: new Map(), openCycle: new Map(), lastCycle: new Map(), balance: new Map(), payments: new Map() };
  for (const x of existing) ctx.existing.set(String(x.dealerId), x);
  for (const p of prevs) ctx.prev.set(String(p._id), p.doc);
  for (const cy of cycles) { const k = String(cy.dealerId); if (cy.status === 'OPEN') ctx.openCycle.set(k, cy); if (!ctx.lastCycle.has(k)) ctx.lastCycle.set(k, cy); }
  for (const b of balances) ctx.balance.set(String(b.dealerId), b);
  for (const p of payments) { const k = String(p.dealerId); if (!ctx.payments.has(k)) ctx.payments.set(k, []); ctx.payments.get(k).push(p); }
  return ctx;
}

/**
 * Plan one row: every write it implies, computed from the context, with no
 * I/O. Idempotent — a dealer that already has a snapshot for this import
 * plans nothing. The writes are then issued for the whole chunk in a handful
 * of bulk operations, which is what keeps a chunk inside a transaction's
 * lifetime against a remote database and makes a 50k-row file practical.
 */
export function planRow(imp, row, dealer, ctx, { by = '' } = {}) {
  const dealerId = row.matchedDealerId, k = String(dealerId);
  const existing = ctx.existing.get(k);
  if (existing) return { skipped: true, classification: existing.classification };

  const buckets = Object.fromEntries(Object.entries(toObj(row.buckets)).map(([p, v]) => [p, Math.max(0, Number(v) || 0)]));
  const total = computeTotal(buckets, imp.balanceMode);
  const prev = ctx.prev.get(k) || null;
  const openCycle = ctx.openCycle.get(k) || null;
  const lastCycle = openCycle || ctx.lastCycle.get(k) || null;
  const classification = classify({ prevExists: !!prev, prevTotal: prev?.total, curTotal: total, priorCycleStatus: openCycle ? 'OPEN' : lastCycle?.status });
  const plan = {
    skipped: false, classification, dealerId, events: [], cycleInsert: null, cycleUpdate: null, balance: null, historical: false,
    snapshot: { _id: new mongoose.Types.ObjectId(), importId: imp._id, dealerId, source: imp.source, asOn: imp.asOn, balanceMode: imp.balanceMode,
      buckets, total, prevSnapshotId: prev?._id || null, prevTotal: prev ? prev.total : null, delta: total - (prev ? prev.total : 0), classification },
  };

  // A statement older than what the balance already reflects is history
  // only: recorded, never allowed to move the current figure backwards.
  const balance = ctx.balance.get(k) || null;
  const isLatest = !balance || !balance.lastSnapshotAsOn || imp.asOn >= balance.lastSnapshotAsOn;
  if (!isLatest) { plan.historical = true; return plan; }

  const at = asDate(imp.asOn);
  const before = balance ? balance.total : (prev ? prev.total : 0);
  const ev = (type, extra = {}) => plan.events.push({ dealerId, type, importId: imp._id, by, at, before, after: total, meta: { appliedAt: new Date() }, ...extra });

  let cycleId = openCycle?._id || null, cycleForStatus = openCycle;
  if (total > 0 && !openCycle) {
    cycleId = new mongoose.Types.ObjectId();
    plan.cycleInsert = { _id: cycleId, dealerId, cycleNo: (lastCycle?.cycleNo || 0) + 1, status: 'OPEN', openedAt: at, openedByImportId: imp._id, openingTotal: total, peakTotal: total, paidTotal: 0, observedDecreaseTotal: 0 };
    cycleForStatus = plan.cycleInsert;
    ev(classification === 'REOPENED' ? 'REOPENED' : 'NEW_OUTSTANDING', { cycleId, amount: total });
  } else if (openCycle) {
    const set = {}, inc = {};
    if (total > openCycle.peakTotal) set.peakTotal = total;
    if (classification === 'INCREASED') ev('INCREASED', { cycleId, amount: total - before });
    if (classification === 'DECREASED') { inc.observedDecreaseTotal = before - total; ev('DECREASED', { cycleId, amount: before - total, cause: 'UNKNOWN' }); }
    if (total === 0) { Object.assign(set, { status: 'CLEARED', closedAt: at, closedByImportId: imp._id, finalTotal: 0 }); cycleForStatus = { ...openCycle, ...set }; ev('CLEARED', { cycleId, amount: before }); }
    if (Object.keys(set).length || Object.keys(inc).length) plan.cycleUpdate = { _id: openCycle._id, update: { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(inc).length ? { $inc: inc } : {}) } };
  }

  // The accounting rule, measured: what the statement says went out against
  // what accounts confirmed came in over the same interval. Neither side is
  // altered; a gap is recorded so a person can look.
  if (prev) {
    const observed = Math.max(0, prev.total - total);
    const explained = (ctx.payments.get(k) || []).filter(p => p.date > prev.asOn && p.date <= imp.asOn).reduce((s, p) => s + p.amount, 0);
    if (observed !== explained) ev('RECONCILIATION_DIFFERENCE', { cycleId, amount: observed - explained, meta: { observed, explained, from: prev.asOn, to: imp.asOn, appliedAt: new Date() } });
  }

  const oldest = imp.balanceMode === 'buckets' ? oldestPeriodOf(buckets) : '';
  const next = {
    ...balance,
    dealerName: dealer?.name || balance?.dealerName || '', dealerCode: dealer?.code || row.code || balance?.dealerCode || '', salesmanId: dealer?.salesman || balance?.salesmanId || '',
    total, buckets, balanceMode: imp.balanceMode, oldestPeriod: oldest, ageDays: oldest ? daysSincePeriodStart(oldest, imp.asOn) : null,
    lastImportId: imp._id, lastSnapshotAsOn: imp.asOn, lastChangeAt: classification !== 'UNCHANGED' ? at : (balance?.lastChangeAt || null),
    openCycleId: cycleForStatus && cycleForStatus.status === 'OPEN' ? cycleId : null,
  };
  next.priority = derivePriority({ total, ageDays: next.ageDays, brokenPromises: balance?.brokenPromises || 0 }, ctx.cfg.thresholds);
  next.status = deriveStatus(next, cycleForStatus, ctx.cfg);
  const { _id, dealerId: _d, createdAt, updatedAt, __v, version, ...set } = next;
  plan.balance = { dealerId, set };
  return plan;
}

/** Issue a chunk's planned writes: snapshots, supersessions, cycles, balances, events. */
export async function applyPlans(imp, plans, { session = null } = {}) {
  const live = plans.filter(p => !p.skipped);
  if (!live.length) return;
  await ColSnapshot.insertMany(live.map(p => p.snapshot), { session, ordered: true });
  await ColSnapshot.updateMany({ source: imp.source, asOn: imp.asOn, importId: { $ne: imp._id }, superseded: false, dealerId: { $in: live.map(p => p.dealerId) } }, { $set: { superseded: true } }).session(session);
  const ins = live.map(p => p.cycleInsert).filter(Boolean);
  if (ins.length) await ColCycle.insertMany(ins, { session });
  const upd = live.map(p => p.cycleUpdate).filter(Boolean);
  if (upd.length) await ColCycle.bulkWrite(upd.map(u => ({ updateOne: { filter: { _id: u._id }, update: u.update } })), { session });
  const bal = live.map(p => p.balance).filter(Boolean);
  if (bal.length) await ColBalance.bulkWrite(bal.map(b => ({ updateOne: { filter: { dealerId: b.dealerId }, update: { $set: b.set, $inc: { version: 1 }, $setOnInsert: { dealerId: b.dealerId } }, upsert: true } })), { session });
  const evs = live.flatMap(p => p.events);
  if (evs.length) await ColEvent.insertMany(evs, { session });
}

/** One row on its own (an unmapped party mapped after the import was applied). */
export async function applyRow(imp, row, dealer, { session = null, by = '' } = {}) {
  const ctx = await preloadCtx(imp, [row.matchedDealerId], { session });
  const plan = planRow(imp, row, dealer, ctx, { by });
  await applyPlans(imp, [plan], { session });
  return plan.skipped ? { skipped: true, classification: plan.classification } : { skipped: false, classification: plan.classification, snapshotId: plan.snapshot._id, cycleId: plan.cycleInsert?._id || plan.cycleUpdate?._id || null, events: plan.events.map(e => e.type), historical: plan.historical };
}

/**
 * Bind identity learned from a statement onto the master. Outside the
 * transaction (it is the dealer master, not this module's data), idempotent,
 * audited. A code already bound to a different dealer is a conflict and is
 * left for a person to resolve.
 */
export async function bindDealerIdentity(row, dealer, { by, importId }) {
  const Dealer = mongoose.models.Dealer;
  const set = {}, before = {};
  if (row.code && !dealer.code) {
    const clash = await Dealer.findOne({ code: row.code, _id: { $ne: dealer._id } }, '_id name').lean();
    if (clash) return { conflict: `code ${row.code} is bound to ${clash.name}` };
    set.code = row.code; before.code = dealer.code || '';
  }
  const known = new Set([dealer.name, ...(dealer.aliases || [])].map(s => String(s || '').toLowerCase().trim()));
  if (row.partyName && !known.has(row.partyName.toLowerCase().trim())) {
    set.aliases = [...(dealer.aliases || []), row.partyName]; before.aliases = dealer.aliases || [];
  }
  if (!Object.keys(set).length) return { bound: false };
  await Dealer.updateOne({ _id: dealer._id }, { $set: set });
  Object.assign(dealer, set);
  await writeAudit({ entity: 'dealer', entityId: dealer._id, action: 'identity-bound', before, after: set, by, source: 'import', importId });
  return { bound: true, set };
}

/**
 * Apply a whole import: identity binds, then 500-dealer chunks, each planned
 * in memory and written in a handful of bulk operations inside one
 * transaction, skipping chunks already recorded on the import so a resumed
 * job continues where it stopped. Ends with stats and APPLIED, or FAILED with
 * the completed chunks intact.
 */
export async function applyImport(importId, { by = '', progress = async () => {} } = {}) {
  const t0 = Date.now();
  const imp = await ColImport.findById(importId);
  if (!imp) throw new Error('Import not found');
  if (imp.status === 'APPLIED') return imp;
  if (!['VALIDATED', 'PREVIEWED', 'APPLYING', 'FAILED'].includes(imp.status)) throw new Error(`Import is ${imp.status}; it cannot be applied`);
  if (!imp.asOn) throw new Error('The statement date (asOn) must be set before applying');

  imp.status = 'APPLYING'; imp.appliedBy = by; await imp.save();
  try {
    const rows = await ColImportRow.find({ importId: imp._id, status: 'OK', matchedDealerId: { $ne: null } }).sort({ rowNo: 1 }).lean();
    const Dealer = mongoose.models.Dealer;
    const dealers = new Map((await Dealer.find({ _id: { $in: rows.map(r => r.matchedDealerId) } }, 'name code aliases salesman').lean()).map(d => [String(d._id), d]));

    let conflicts = 0;
    for (const r of rows) {
      const d = dealers.get(String(r.matchedDealerId)); if (!d) continue;
      const b = await bindDealerIdentity(r, d, { by, importId: imp._id });
      if (b.conflict) conflicts++;
    }

    const CHUNK = 500;
    const chunks = Math.ceil(rows.length / CHUNK);
    // Tracked in a plain Set, not on the document: a push on a Mongoose array
    // becomes a $push at save time, which on a failure re-recorded a chunk the
    // transaction had already recorded with $addToSet — and a chunk listed twice
    // is a chunk that looks finished when it may not be.
    const done = new Set(imp.appliedChunks);
    for (let c = 0; c < chunks; c++) {
      if (done.has(c)) continue;
      const slice = rows.slice(c * CHUNK, (c + 1) * CHUNK);
      await withTxn(async session => {
        const ctx = await preloadCtx(imp, slice.map(r => r.matchedDealerId), { session });
        const plans = slice.map(r => planRow(imp, r, dealers.get(String(r.matchedDealerId)), ctx, { by }));
        await applyPlans(imp, plans, { session });
        await ColImport.updateOne({ _id: imp._id }, { $addToSet: { appliedChunks: c } }).session(session);
      });
      done.add(c);
      await progress(Math.min(rows.length, (c + 1) * CHUNK), rows.length, `chunk ${c + 1}/${chunks}`);
    }
    await ColImportRow.updateMany({ importId: imp._id, status: 'OK', matchedDealerId: { $ne: null } }, { $set: { appliedAt: new Date() } });

    const agg = await ColSnapshot.aggregate([{ $match: { importId: imp._id } },
      { $group: { _id: '$classification', n: { $sum: 1 }, before: { $sum: { $ifNull: ['$prevTotal', 0] } }, after: { $sum: '$total' } } }]);
    const st = { new: 0, increased: 0, decreased: 0, cleared: 0, unchanged: 0, reopened: 0, totalBefore: 0, totalAfter: 0 };
    for (const a of agg) { st[a._id.toLowerCase()] = a.n; st.totalBefore += a.before; st.totalAfter += a.after; }
    Object.assign(imp.stats, st, { identityConflicts: conflicts });
    imp.appliedChunks = [...done].sort((a, b) => a - b);
    imp.status = 'APPLIED'; imp.appliedAt = new Date(); imp.durationMs = Date.now() - t0;
    await imp.save();
    await writeAudit({ entity: 'import', entityId: imp._id, action: 'applied', after: { fileName: imp.fileName, asOn: imp.asOn, ...st }, by, source: 'import', importId: imp._id });
    await hooks.emit('import.applied', { importId: imp._id, by });
    return imp;
  } catch (e) {
    imp.status = 'FAILED';
    imp.errorReport.push({ row: 0, message: String(e.message || e).slice(0, 500) });
    await imp.save();
    throw e;
  }
}

/** Recompute status/priority for one dealer after payments, promises or follow-ups change. */
export async function refreshBalance(dealerId, { session = null } = {}) {
  const balance = await ColBalance.findOne({ dealerId }).session(session);
  if (!balance) return null;
  const cycle = balance.openCycleId ? await ColCycle.findById(balance.openCycleId).session(session) : await ColCycle.findOne({ dealerId }).sort({ cycleNo: -1 }).session(session);
  const cfg = { overdueDays: await getSetting('collections.overdueDays'), highValue: await getSetting('collections.highValue'), thresholds: await getSetting('collections.priorityThresholds') };
  balance.priority = derivePriority({ total: balance.total, ageDays: balance.ageDays, brokenPromises: balance.brokenPromises }, cfg.thresholds);
  balance.status = deriveStatus(balance, cycle, cfg);
  await balance.save({ session });
  return balance;
}
