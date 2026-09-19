import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
import { ColBalance, ColCycle, ColPayment } from '../models/index.js';
import { oldestPeriodOf, derivePriority, deriveStatus } from '../engines/reconcile.js';
import { daysSincePeriodStart, todayYmd } from '../lib/periods.js';
import { getSetting } from '../lib/settings.js';
/**
 * Fill in what snapshot-mode imports never wrote: the oldest unpaid month,
 * its age, the dealer's credit days and the last payment amount — then
 * re-derive priority and status so OVERDUE can finally appear.
 * Derived fields only; nothing about money changes. Re-runnable.
 * `--dry-run` prints, `--apply` writes.
 */
const { dryRun, db } = args();
await connect({ db });
await import('../../models/Dealer.js');
const Dealer = mongoose.models.Dealer;
const cfg = { overdueDays: await getSetting('collections.overdueDays'), highValue: await getSetting('collections.highValue'), thresholds: await getSetting('collections.priorityThresholds') };
const today = todayYmd();
const bals = await ColBalance.find({}).lean();
const dealers = new Map((await Dealer.find({ _id: { $in: bals.map(b => b.dealerId) } }, 'creditDays').lean()).map(d => [String(d._id), d]));
const lastPay = new Map((await ColPayment.aggregate([{ $match: { status: 'CONFIRMED' } }, { $sort: { date: -1, createdAt: -1 } }, { $group: { _id: '$dealerId', date: { $first: '$date' }, amount: { $first: '$amount' } } }])).map(p => [String(p._id), p]));
const cycles = new Map((await ColCycle.find({}).sort({ cycleNo: 1 }).lean()).map(c => [String(c.dealerId), c]));   // last wins = latest cycle
let n = 0, overdue = 0, changedStatus = 0;
const ops = [];
for (const b of bals) {
  const buckets = b.buckets instanceof Map ? Object.fromEntries(b.buckets) : (b.buckets || {});
  const oldest = oldestPeriodOf(buckets);
  const ageDays = oldest ? daysSincePeriodStart(oldest, today) : null;
  const creditDays = Number(dealers.get(String(b.dealerId))?.creditDays) || 0;
  const lp = lastPay.get(String(b.dealerId));
  const next = { ...b, oldestPeriod: oldest, ageDays, creditDays, lastPaymentAmount: lp?.amount || b.lastPaymentAmount || 0 };
  const cycle = b.openCycleId ? await ColCycle.findById(b.openCycleId).lean() : cycles.get(String(b.dealerId)) || null;
  next.priority = derivePriority({ total: b.total, ageDays, brokenPromises: b.brokenPromises || 0 }, cfg.thresholds);
  next.status = deriveStatus(next, cycle, cfg, today);
  if (next.status === 'OVERDUE') overdue++;
  if (next.status !== b.status) changedStatus++;
  n++;
  ops.push({ updateOne: { filter: { _id: b._id }, update: { $set: { oldestPeriod: oldest, ageDays, creditDays, lastPaymentAmount: next.lastPaymentAmount, priority: next.priority, status: next.status } } } });
}
console.log(`${n} balances · ${overdue} would be OVERDUE · ${changedStatus} status changes · default overdue after ${cfg.overdueDays} days`);
if (dryRun) { console.log('DRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }
for (let i = 0; i < ops.length; i += 500) await ColBalance.bulkWrite(ops.slice(i, i + 500), { ordered: false });
console.log('written');
await mongoose.disconnect();
