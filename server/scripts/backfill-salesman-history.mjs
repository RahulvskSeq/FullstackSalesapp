/**
 * backfill-salesman-history.mjs
 *
 * Repairs dealers that were reassigned before `salesmanHistory` was being
 * saved. routes/dealers.js registers the Dealer model from its OWN schema and
 * models/Dealer.js declares a second copy; the field had been added to only
 * one, so Mongoose's strict mode silently dropped it on write. The salesman
 * changed, the handover date did not get recorded.
 *
 * Without that date, an ERP re-import credits EVERY line to the new owner —
 * quietly moving past sales. This restores the record from a reference copy
 * of the dealers (a backup, or the pre-change sandbox), so lines before the
 * handover stay with the outgoing salesman.
 *
 * Only touches dealers that:
 *   - currently have NO salesmanHistory, and
 *   - have a DIFFERENT salesman than the reference copy.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Usage:
 *   node scripts/backfill-salesman-history.mjs --ref mongodb://127.0.0.1:27017/bkcheck --on 2026-09-03
 *   ... --apply
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const arg = (name, fallback = '') => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const APPLY = process.argv.includes('--apply');
const REF = arg('--ref', 'mongodb://127.0.0.1:27017/bkcheck');
const TARGET = arg('--target', process.env.MONGO_URI);
const ON = arg('--on', new Date().toISOString().slice(0, 10));

if (!TARGET) { console.error('No --target and no MONGO_URI'); process.exit(1); }
if (!/^\d{4}-\d{2}-\d{2}$/.test(ON)) { console.error('--on must be YYYY-MM-DD'); process.exit(1); }

const mask = u => String(u).replace(/:\/\/[^@]*@/, '://***:***@');
console.log(`reference    : ${mask(REF)}`);
console.log(`target       : ${mask(TARGET)}`);
console.log(`handover date: ${ON}`);
console.log(`mode         : ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}\n`);

const ref = await mongoose.createConnection(REF).asPromise();
const dst = await mongoose.createConnection(TARGET).asPromise();

const refDealers = await ref.db.collection('dealers').find({}, { projection: { _id: 1, name: 1, salesman: 1 } }).toArray();
const refById = new Map(refDealers.map(d => [String(d._id), d]));

const live = await dst.db.collection('dealers')
  .find({}, { projection: { _id: 1, name: 1, salesman: 1, salesmanHistory: 1 } }).toArray();

const todo = [];
for (const d of live) {
  if (Array.isArray(d.salesmanHistory) && d.salesmanHistory.length) continue;  // already recorded
  const was = refById.get(String(d._id));
  if (!was || !was.salesman) continue;                                          // no reference
  if (was.salesman === d.salesman) continue;                                    // never changed
  todo.push({ _id: d._id, name: d.name, from: was.salesman, to: d.salesman });
}

console.log(`reference dealers : ${refDealers.length}`);
console.log(`live dealers      : ${live.length}`);
console.log(`needing repair    : ${todo.length}\n`);

const byPair = {};
for (const t of todo) { const k = `${t.from} -> ${t.to}`; byPair[k] = (byPair[k] || 0) + 1; }
for (const [k, v] of Object.entries(byPair)) console.log(`   ${k}: ${v}`);

if (!todo.length) { console.log('\nNothing to repair.'); await ref.close(); await dst.close(); process.exit(0); }

if (!APPLY) {
  console.log('\nsample:');
  todo.slice(0, 10).forEach(t => console.log(`   ${t.name}  ${t.from} -> ${t.to}`));
  console.log('\nDry run — nothing written. Re-run with --apply.');
} else {
  const ops = todo.map(t => ({
    updateOne: {
      filter: { _id: t._id },
      update: { $set: { salesmanHistory: [
        { salesman: t.from, from: '0000-00-00' },
        { salesman: t.to,   from: ON },
      ] } },
    },
  }));
  let done = 0;
  for (let i = 0; i < ops.length; i += 200) {
    const r = await dst.db.collection('dealers').bulkWrite(ops.slice(i, i + 200), { ordered: false });
    done += r.modifiedCount || 0;
  }
  console.log(`\nrepaired: ${done}`);
}

await ref.close();
await dst.close();
