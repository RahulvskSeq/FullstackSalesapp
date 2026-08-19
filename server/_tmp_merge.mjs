import 'dotenv/config';
import fs from 'fs';
import mongoose from 'mongoose';
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const APPLY = process.env.APPLY === '1';

const M2K={'01':'Jan','02':'Feb','03':'Mar','04':'Apr','05':'May','06':'Jun','07':'Jul','08':'Aug','09':'Sep','10':'Oct','11':'Nov','12':'Dec'};
const toKey=m=>{const[y,mm]=String(m).split('-');return `${M2K[mm]}-${y.slice(2)}`;};

const groups = await db.collection('dealers').aggregate([
  { $group:{ _id:'$name', n:{$sum:1}, ids:{$push:'$_id'} } }, { $match:{ n:{$gt:1} } }
]).toArray();
const names = groups.map(g=>g._id);

// ground truth per dealer+month from sale rows
const sales = await db.collection('sales').aggregate([
  { $match:{ dealerName:{$in:names} } },
  { $group:{ _id:{d:'$dealerName',m:'$month',s:'$salesman'}, q:{$sum:'$qty'} } },
]).toArray();
const truth={}; sales.forEach(r=>{(truth[r._id.d] ||= {})[toKey(r._id.m)] = r._id.s;});

const backup=[]; let merged=0, deleted=0, monthsMoved=0, monthsRaised=0, stamped=0;
const conflictLog=[];

for (const g of groups) {
  const docs = await db.collection('dealers').find({ _id:{$in:g.ids} }).toArray();
  docs.sort((a,b)=>a._id.getTimestamp()-b._id.getTimestamp());
  const keep = docs[0], drop = docs.slice(1);
  backup.push(...docs.map(d=>({name:g._id, role:d===keep?'kept':'deleted', doc:d})));

  const $set = {};
  const keepMd = keep.monthlyData || {};

  for (const dd of drop) {
    for (const [m, e] of Object.entries(dd.monthlyData || {})) {
      const mine = keepMd[m];
      const dv = Number(e?.achieved)||0, kv = Number(mine?.achieved)||0;
      if (!mine) { $set[`monthlyData.${m}`] = e; monthsMoved++; }
      else if (dv > kv) {
        if (kv > 0) conflictLog.push(`${g._id} | ${m} | kept ${dv} (was ${kv})`);
        $set[`monthlyData.${m}.achieved`] = dv; monthsRaised++;
      } else if (kv > dv && dv > 0) conflictLog.push(`${g._id} | ${m} | kept ${kv} (other ${dv})`);
      // month came from this dropped doc -> its owner is the historical owner
      const existingStamp = mine?.salesman || e?.salesman;
      const stamp = truth[g._id]?.[m] || dd.salesman;
      if (!existingStamp && stamp) { $set[`monthlyData.${m}.salesman`] = stamp; stamped++; }
    }
  }
  // months only on the kept doc: stamp ONLY when sale rows prove the owner
  for (const [m, e] of Object.entries(keepMd)) {
    if (e?.salesman) continue;
    const t = truth[g._id]?.[m];
    if (t) { $set[`monthlyData.${m}.salesman`] = t; stamped++; }
  }

  if (APPLY) {
    if (Object.keys($set).length) await db.collection('dealers').updateOne({_id:keep._id},{$set});
    for (const d of drop) await db.collection('dealers').deleteOne({_id:d._id});
  }
  merged++; deleted += drop.length;
}

if (APPLY) {
  fs.writeFileSync(process.env.OUT, JSON.stringify(backup,null,1));
  fs.writeFileSync(process.env.OUTC, conflictLog.join('\n'));
}
console.log(`${APPLY?'APPLIED':'DRY RUN'}`);
console.log(`  dealer names merged   : ${merged}`);
console.log(`  documents deleted     : ${deleted}`);
console.log(`  months moved onto keep: ${monthsMoved}`);
console.log(`  months raised to max  : ${monthsRaised}`);
console.log(`  month owners stamped  : ${stamped}`);
console.log(`  value conflicts logged: ${conflictLog.length}`);
await mongoose.disconnect();
