import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
import { ColBalance, ColCycle } from '../models/index.js';
/** Balances at ₹0 that never had a cycle read NIL, not CLEARED. Idempotent. */
const { dryRun, db } = args();
await connect({ db });
const zero = await ColBalance.find({ total: { $lte: 0 }, status: { $ne: 'NIL' } }, 'dealerId status').lean();
const withCycle = new Set((await ColCycle.distinct('dealerId', { dealerId: { $in: zero.map(b => b.dealerId) } })).map(String));
const ids = zero.filter(b => !withCycle.has(String(b.dealerId))).map(b => b._id);
console.log(`zero balances ${zero.length} · never had a cycle ${ids.length} → NIL`);
if (!dryRun && ids.length) console.log('updated', (await ColBalance.updateMany({ _id: { $in: ids } }, { $set: { status: 'NIL' } })).modifiedCount);
else if (dryRun) console.log('DRY RUN — re-run with --apply');
await mongoose.disconnect();
