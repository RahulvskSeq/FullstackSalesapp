import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
import { ColImport, ColImportRow, ColSnapshot, ColBalance, ColCycle, ColFollowUp, ColPromise, ColPayment, ColEvent } from '../models/index.js';
const { db } = args();
await connect({ db });
const L = mongoose.connection.db;
const legacyOut = await L.collection('outstandings').find({}).toArray();
const legacySum = legacyOut.reduce((s, r) => { const v = Object.values(r.monthlyOutstanding || {}); return s + (Number(v[v.length - 1]) || 0); }, 0);
const imp = await ColImport.findOne({ source: 'legacy' }).lean();
// Legacy rows split three ways: applied (a dealer matched), folded (a second
// spelling of a dealer with a zero balance) and name-only (no dealer at all).
// Only the applied rows can be in the balances, so that is the figure to match.
const byStatus = imp ? await ColImportRow.aggregate([{ $match: { importId: imp._id } }, { $group: { _id: '$status', n: { $sum: 1 }, sum: { $sum: '$total' } } }]) : [];
const st = Object.fromEntries(byStatus.map(x => [x._id, x]));
const balancesNow = (await ColBalance.aggregate([{ $group: { _id: null, s: { $sum: '$total' } } }]))[0]?.s || 0;
const paidSince = (await ColPayment.aggregate([{ $match: { status: 'CONFIRMED', source: { $ne: 'migrated' } } }, { $group: { _id: null, s: { $sum: '$amount' } } }]))[0]?.s || 0;
const laterImports = imp ? await ColImport.countDocuments({ status: 'APPLIED', _id: { $ne: imp._id } }) : 0;
const rows = [
  ['legacy balances', legacyOut.length, 'snapshots from M2', imp ? await ColSnapshot.countDocuments({ importId: imp._id }) : 0],
  ['Σ legacy latest month (all rows)', legacySum, 'Σ applied + folded + name-only', (st.OK?.sum || 0) + (st.DUPLICATE?.sum || 0) + (st.UNMAPPED?.sum || 0)],
  [`Σ legacy rows applied (${st.OK?.n || 0} dealers)`, st.OK?.sum || 0, laterImports || paidSince ? 'Σ balances now (moved since)' : 'Σ balances now', balancesNow],
  [`name-only rows (no dealer) ${st.UNMAPPED?.n || 0}`, st.UNMAPPED?.sum || 0, `zero-balance spellings folded`, st.DUPLICATE?.n || 0],
  ['balances owing', await ColBalance.countDocuments({ total: { $gt: 0 } }), 'open cycles', await ColCycle.countDocuments({ status: 'OPEN' })],
  ['legacy follow-ups', await L.collection('outstandingfollowups').countDocuments(), 'migrated follow-ups', await ColFollowUp.countDocuments({ source: 'migrated' })],
  ['legacy promises (amount>0, not collection)', await L.collection('outstandingfollowups').countDocuments({ amount: { $gt: 0 }, type: { $ne: 'collection' } }), 'promises', await ColPromise.countDocuments({ legacyId: { $ne: '' } })],
  ['legacy manual credits', (await L.collection('outstandingfollowups').aggregate([{ $unwind: '$credits' }, { $match: { 'credits.source': 'manual' } }, { $count: 'n' }]).toArray())[0]?.n || 0, 'migrated payments', await ColPayment.countDocuments({ source: 'migrated' })],
  ['legacy upload credits', (await L.collection('outstandingfollowups').aggregate([{ $unwind: '$credits' }, { $match: { 'credits.source': 'upload' } }, { $count: 'n' }]).toArray())[0]?.n || 0, 'ADJUSTMENT events', await ColEvent.countDocuments({ type: 'ADJUSTMENT', cause: 'LEGACY_SHEET_DROP' })],
];
for (const [a, x, b, y] of rows) console.log(`  ${a.padEnd(44)} ${String(x).padStart(10)}   ${b.padEnd(30)} ${String(y).padStart(10)}   ${x === y ? 'OK' : (String(b).includes('name-only') || String(b).includes('folded') || String(b).includes('moved since') ? 'info' : 'CHECK')}`);
if (laterImports || paidSince) console.log(`  (balances have moved since M2: ${laterImports} later statement(s), ₹${paidSince.toLocaleString('en-IN')} confirmed payments)`);
await mongoose.disconnect();
