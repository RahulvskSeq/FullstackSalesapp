import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
import { ColEvent, ColPayment, ColPromise, ColImport } from '../models/index.js';
import { autoConfirmFromStatements, listPendingApprovals } from '../services/payments.js';
/**
 * Run the "sheet as proof" rule over every decrease still waiting: recorded
 * payments and promises the statement accounts for are confirmed, the rest
 * stays for accounts. For statements applied before the rule existed.
 *   --dry-run (default) shows what would match · --apply does it
 */
const { dryRun, db } = args();
await connect({ db });
const PENDING = { type: 'RECONCILIATION_DIFFERENCE', amount: { $gt: 0 }, 'meta.approved': { $exists: false } };
const last = await ColImport.findOne({ status: 'APPLIED' }).sort({ asOn: -1 }).lean();
console.log(`latest statement: ${last?.fileName} (${last?.asOn})`);
const before = await listPendingApprovals({}, { limit: 1000 });
console.log(`pending decreases: ${before.total} · ₹${before.sum.toLocaleString('en-IN')}`);
let wouldRec = 0, wouldProm = 0, amtRec = 0, amtProm = 0;
for (const e of before.items) {
  const rec = await ColPayment.find({ dealerId: e.dealerId, status: 'RECORDED', date: { $lte: e.meta?.to || '9999' } }).sort({ date: 1 }).lean();
  let left = e.amount;
  for (const p of rec) if (p.amount <= left) { left -= p.amount; wouldRec++; amtRec += p.amount; if (left <= 0) break; }
  if (left > 0) for (const pr of await ColPromise.find({ dealerId: e.dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED', 'BROKEN'] } }).sort({ promiseDate: 1 }).lean()) { const due = pr.amount - (pr.received || 0); if (due > 0 && due <= left) { left -= due; wouldProm++; amtProm += due; if (left <= 0) break; } }
}
console.log(`would confirm: ${wouldRec} recorded payment(s) ₹${amtRec.toLocaleString('en-IN')} · ${wouldProm} promise(s) ₹${amtProm.toLocaleString('en-IN')}`);
if (dryRun) { console.log('DRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }
const dealers = await ColEvent.distinct('dealerId', PENDING);
let n = 0; for (const d of dealers) n += (await autoConfirmFromStatements(d, { by: 'statement' })).length;
const after = await listPendingApprovals({}, { limit: 1 });
console.log(`confirmed ${n} payment(s) · pending now: ${after.total} · ₹${after.sum.toLocaleString('en-IN')}`);
await mongoose.disconnect();
