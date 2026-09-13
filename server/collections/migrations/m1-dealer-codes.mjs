import fs from 'fs';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import { args, connect, normName } from './_shared.mjs';
import { parseParty, isNoiseParty } from '../lib/periods.js';
/**
 * M1 — bind ERP codes onto the Dealer master from any statement file(s).
 * A code is bound only where exactly one dealer matches the stripped name
 * and that dealer has no other code. Everything else is reported, not guessed.
 */
const { dryRun, db, file } = args();
const files = (file || '/Users/rahulvsk/Downloads/Outstanding Till june.xlsx').split(',');
await connect({ db });
const Dealer = mongoose.models.Dealer;
const dealers = await Dealer.find({}, 'name code').lean();
const byNorm = new Map();
for (const d of dealers) { const k = normName(d.name); if (!byNorm.has(k)) byNorm.set(k, []); byNorm.get(k).push(d); }
const byCode = new Map(dealers.filter(d => d.code).map(d => [d.code, d]));

const seen = new Map(); const report = { bind: [], alreadyBound: 0, ambiguous: [], conflict: [], notInMaster: [] };
for (const f of files) {
  const wb = XLSX.read(fs.readFileSync(f), { type: 'buffer' });
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
  const hi = aoa.findIndex(r => r.some(c => /dealer|party|name/i.test(String(c)))); const pc = Math.max(0, aoa[hi].findIndex(c => /dealer|party|name/i.test(String(c))));
  for (const r of aoa.slice(hi + 1)) {
    const raw = String(r[pc] || '').trim(); if (isNoiseParty(raw)) continue;
    const { name, code } = parseParty(raw); if (!code || seen.has(code)) continue; seen.set(code, name);
    if (byCode.has(code)) { report.alreadyBound++; continue; }
    const cands = byNorm.get(normName(name)) || [];
    if (cands.length === 0) report.notInMaster.push(`${name} [${code}]`);
    else if (cands.length > 1) report.ambiguous.push(`${name} [${code}] → ${cands.map(c => c.name).join(' | ')}`);
    else if (cands[0].code && cands[0].code !== code) report.conflict.push(`${name} [${code}] → ${cands[0].name} already ${cands[0].code}`);
    else report.bind.push({ _id: cands[0]._id, name: cands[0].name, code });
  }
}
// Two different codes resolving to the same master dealer are two branches
// sharing a name: binding either would be a guess. Report, bind neither.
const perDealer = new Map();
for (const b of report.bind) { const k = String(b._id); if (!perDealer.has(k)) perDealer.set(k, []); perDealer.get(k).push(b); }
for (const [, group] of perDealer) if (group.length > 1) { for (const g of group) report.ambiguous.push(`${g.name} has ${group.length} codes in the file: ${group.map(x => x.code).join(', ')} — two branches; add the others as new dealers`); report.bind = report.bind.filter(b => !group.includes(b)); }
console.log(`\nparties with codes: ${seen.size}`);
console.log(`  would bind      : ${report.bind.length}`); for (const b of report.bind) console.log(`      ${b.name} ← ${b.code}`);
console.log(`  already bound   : ${report.alreadyBound}`);
console.log(`  ambiguous       : ${report.ambiguous.length}`); for (const x of report.ambiguous) console.log('      ' + x);
console.log(`  conflict        : ${report.conflict.length}`); for (const x of report.conflict) console.log('      ' + x);
console.log(`  not in master   : ${report.notInMaster.length}   (resolve from the Imports screen: map, or add as new dealer)`);
if (!dryRun && report.bind.length) {
  const ops = report.bind.map(b => ({ updateOne: { filter: { _id: b._id, $or: [{ code: '' }, { code: { $exists: false } }] }, update: { $set: { code: b.code } } } }));
  const r = await Dealer.bulkWrite(ops); console.log(`\nbound ${r.modifiedCount} codes`);
} else if (dryRun) console.log('\nDRY RUN — nothing written. Re-run with --apply.');
await mongoose.disconnect();
