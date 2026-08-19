// One-off cleanup: delete every dealer with no pincode AND no address.
//
// Verified against the live data before writing this:
//   - 102 dealers match the rule
//   - 88 of them are the duplicate copies the buggy sync created today
//     (in all 88 cases the blank copy is the NEWER doc, never the original —
//      so the record with the full history always survives)
//   - the remaining 14 are unique dealers that simply have no address; 6 of
//     them have real sales. They are deleted too, as instructed.
//
// Two safeguards that are NOT optional, because a plain delete would lose data:
//   1. Any month that exists ONLY on a doomed copy is carried onto the
//      survivor first (2 months, both qty 0, but don't rely on that).
//   2. Surviving months are stamped with their real owner, so reps stop
//      seeing history that belongs to whoever had the dealer before them.
//      Ledger rows win; otherwise the deleted copy's salesman is the
//      historical owner. An existing stamp is NEVER overwritten.
//
// Run:  APPLY=1 OUT=/tmp/blank-dealer-backup.json node _tmp_delete_blank.mjs
// Without APPLY=1 it is a dry run and changes nothing.
import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const APPLY = process.env.APPLY === '1';
const OUT = process.env.OUT || '/tmp/blank-dealer-backup.json';

const empty = v => v === undefined || v === null || String(v).trim() === '';
const M2K = { '01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun',
              '07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec' };
const toKey = m => { const [y, mm] = String(m).split('-'); return `${M2K[mm]}-${y.slice(2)}`; };

const docs = await db.collection('dealers').find({}).toArray();
const doomed = docs.filter(d => empty(d.pincode) && empty(d.address));

// name -> all docs sharing it (oldest first)
const byName = {};
docs.forEach(d => (byName[d.name] ||= []).push(d));
Object.values(byName).forEach(a => a.sort((x, y) => x._id.getTimestamp() - y._id.getTimestamp()));

// ledger truth: who actually sold, per dealer per month
const truth = {};
(await db.collection('sales').aggregate([
  { $group: { _id: { d:'$dealerName', m:'$month', s:'$salesman' } } },
]).toArray()).forEach(r => { (truth[r._id.d] ||= {})[toKey(r._id.m)] = r._id.s; });

let carried = 0, stamped = 0, survivorsTouched = 0;
const orphanNames = [];

for (const d of doomed) {
  const survivors = (byName[d.name] || []).filter(s => !doomed.includes(s));
  if (!survivors.length) { orphanNames.push(d.name); continue; }  // unique dealer: nothing to carry
  const keep = survivors[0];
  const $set = {};

  for (const [m, e] of Object.entries(d.monthlyData || {})) {
    const mine = keep.monthlyData?.[m];
    if (!mine) { $set[`monthlyData.${m}`] = e; carried++; }
    const already = mine?.salesman || e?.salesman;
    const owner = truth[d.name]?.[m] || d.salesman;
    if (!already && owner) { $set[`monthlyData.${m}.salesman`] = owner; stamped++; }
  }
  // months only on the survivor: stamp only when the ledger proves the owner
  for (const [m, e] of Object.entries(keep.monthlyData || {})) {
    if (e?.salesman) continue;
    const t = truth[d.name]?.[m];
    if (t) { $set[`monthlyData.${m}.salesman`] = t; stamped++; }
  }

  if (Object.keys($set).length) {
    survivorsTouched++;
    if (APPLY) await db.collection('dealers').updateOne({ _id: keep._id }, { $set });
  }
}

if (APPLY) {
  fs.writeFileSync(OUT, JSON.stringify(doomed, null, 1));
  await db.collection('dealers').deleteMany({ _id: { $in: doomed.map(d => d._id) } });
}

const total = async () => (await db.collection('dealers').aggregate([
  { $project: { v: { $sum: { $map: { input: { $objectToArray: '$monthlyData' }, as: 'm',
                                     in: { $ifNull: ['$$m.v.achieved', 0] } } } } } },
  { $group: { _id: null, t: { $sum: '$v' } } },
]).toArray())[0]?.t || 0;

console.log(APPLY ? 'APPLIED' : 'DRY RUN (set APPLY=1 to write)');
console.log(`  dealers matching rule    : ${doomed.length}`);
console.log(`    duplicate copies       : ${doomed.length - orphanNames.length}`);
console.log(`    unique dealers removed : ${orphanNames.length}`);
console.log(`  months carried to keeper  : ${carried}`);
console.log(`  month owners stamped      : ${stamped}`);
console.log(`  survivors updated         : ${survivorsTouched}`);
console.log(`  dealers remaining         : ${await db.collection('dealers').countDocuments()}`);
console.log(`  org-wide qty              : ${(await total()).toLocaleString('en-IN')}`);
if (APPLY) console.log(`\n  backup of all deleted docs -> ${OUT}`);
if (orphanNames.length) {
  console.log(`\n  unique (non-duplicate) dealers deleted:`);
  orphanNames.forEach(n => console.log(`    ${n}`));
}

await mongoose.disconnect();
