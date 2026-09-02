/**
 * restore-missing-dealers.mjs
 *
 * Re-inserts dealers that exist in a mongodump backup but are missing from a
 * live database. Written after 64 dealers disappeared from production between
 * a backup and an import, which caused 45 units of sales to be parked as
 * "dealer not matched".
 *
 * It is deliberately additive and conservative:
 *   - inserts ONLY rows missing by BOTH _id and normalised name key, so
 *     nothing existing is overwritten and no duplicate name is reintroduced;
 *   - preserves the original _id, so any existing reference still resolves;
 *   - prints a dry run by default. Pass --apply to actually write.
 *
 * Usage:
 *   node scripts/restore-missing-dealers.mjs --from <backupDbUri> --to <targetUri>
 *   node scripts/restore-missing-dealers.mjs --from ... --to ... --apply
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dealerKey } from '../lib/productTaxonomy.js';

dotenv.config();

const arg = (name, fallback = '') => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const APPLY = process.argv.includes('--apply');
const FROM = arg('--from', 'mongodb://127.0.0.1:27017/bkcheck');
const TO = arg('--to', process.env.MONGO_URI);

if (!TO) { console.error('No --to target and no MONGO_URI in .env'); process.exit(1); }

const mask = u => String(u).replace(/:\/\/[^@]*@/, '://***:***@');
console.log(`from : ${mask(FROM)}`);
console.log(`to   : ${mask(TO)}`);
console.log(`mode : ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}\n`);

const src = await mongoose.createConnection(FROM).asPromise();
const dst = await mongoose.createConnection(TO).asPromise();

const backup = await src.db.collection('dealers').find({}).toArray();
const live = await dst.db.collection('dealers').find({}, { projection: { _id: 1, name: 1 } }).toArray();

const liveIds = new Set(live.map(d => String(d._id)));
const liveKeys = new Set(live.map(d => dealerKey(d.name)));

const missing = backup.filter(d =>
  !liveIds.has(String(d._id)) && !liveKeys.has(dealerKey(d.name)));

console.log(`backup dealers : ${backup.length}`);
console.log(`live dealers   : ${live.length}`);
console.log(`missing        : ${missing.length}\n`);

if (!missing.length) {
  console.log('Nothing to restore.');
} else {
  missing.slice(0, 20).forEach(d => console.log(`   ${d.name}`));
  if (missing.length > 20) console.log(`   ... +${missing.length - 20} more`);

  if (APPLY) {
    const r = await dst.db.collection('dealers').insertMany(missing, { ordered: false });
    console.log(`\ninserted     : ${r.insertedCount}`);
    console.log(`live dealers : ${await dst.db.collection('dealers').countDocuments()}`);
  } else {
    console.log('\nDry run — nothing written. Re-run with --apply to insert these.');
  }
}

await src.close();
await dst.close();
