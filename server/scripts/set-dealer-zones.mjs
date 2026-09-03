/**
 * set-dealer-zones.mjs
 *
 * Bulk-set dealer zones from a two-column TSV: "<dealer name>\t<zone>".
 *
 * Names are matched with the same identity key the ERP import uses — spaces,
 * punctuation and legal forms stripped — so "M/s SAMBHAGGYA TRADE LINKS"
 * finds "M/S Sambhaggya Trade Links". A fuzzy fallback exists but is
 * reported separately and never applied silently: a near-miss here would set
 * the wrong dealer's zone, which nothing downstream would flag.
 *
 * Writes through PUT /api/dealers/:id so the change goes down the same path
 * as an edit in the UI.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Usage:
 *   node scripts/set-dealer-zones.mjs --file zones.tsv
 *   node scripts/set-dealer-zones.mjs --file zones.tsv --apply
 *   ...optionally --api http://127.0.0.1:5000/api  --fuzzy   (allow fuzzy matches)
 */
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { dealerKey, matchDealer } from '../lib/productTaxonomy.js';

dotenv.config();

const arg = (name, fallback = '') => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const APPLY = process.argv.includes('--apply');
const ALLOW_FUZZY = process.argv.includes('--fuzzy');
const FILE = arg('--file');
const API = arg('--api', 'http://127.0.0.1:5000/api').replace(/\/$/, '');

if (!FILE) { console.error('Usage: --file <tsv> [--apply] [--fuzzy] [--api <url>]'); process.exit(1); }
if (!process.env.MONGO_URI || !process.env.JWT_SECRET) { console.error('MONGO_URI / JWT_SECRET missing'); process.exit(1); }

const rows = fs.readFileSync(FILE, 'utf8').trim().split('\n')
  .map(l => { const [n, z] = l.split('\t'); return { name: (n || '').trim(), zone: (z || '').trim() }; })
  .filter(r => r.name && r.zone);

console.log(`file : ${FILE}  (${rows.length} rows)`);
console.log(`api  : ${API}`);
console.log(`mode : ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}${ALLOW_FUZZY ? '  [fuzzy allowed]' : ''}\n`);

const conn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
const dealers = await conn.db.collection('dealers').find({}, { projection: { _id: 1, name: 1, zone: 1 } }).toArray();
const index = new Map(), list = [];
for (const d of dealers) {
  const k = dealerKey(d.name);
  if (!k) continue;
  if (!index.has(k)) index.set(k, d);
  list.push([k, d]);
}
const memo = new Map();

const change = [], unchanged = [], fuzzy = [], missing = [];
for (const r of rows) {
  const m = matchDealer(r.name, index, list, memo);
  if (!m.dealer) { missing.push({ r, m }); continue; }
  const rec = { r, d: m.dealer, reason: m.reason, score: m.score };
  if (m.reason === 'fuzzy') fuzzy.push(rec);
  if ((m.dealer.zone || '') === r.zone) unchanged.push(rec);
  else change.push(rec);
}

const applicable = change.filter(c => ALLOW_FUZZY || c.reason !== 'fuzzy');
console.log(`matched exactly : ${rows.length - fuzzy.length - missing.length}`);
console.log(`fuzzy matches   : ${fuzzy.length}${fuzzy.length && !ALLOW_FUZZY ? '  (skipped — pass --fuzzy to include)' : ''}`);
console.log(`unmatched       : ${missing.length}`);
console.log(`already correct : ${unchanged.length}`);
console.log(`to change       : ${applicable.length}\n`);

for (const c of applicable.slice(0, 60))
  console.log(`   ${(c.d.zone || '(blank)').padEnd(9)} -> ${c.r.zone.padEnd(8)} ${c.d.name}`);
if (applicable.length > 60) console.log(`   ... +${applicable.length - 60} more`);

for (const { r, m } of missing) console.log(`   UNMATCHED  "${r.name}"  closest: ${m.suggestion || '(none)'} ${(m.score * 100).toFixed(0)}%`);
for (const c of fuzzy) console.log(`   FUZZY      "${c.r.name}" -> "${c.d.name}" ${(c.score * 100).toFixed(0)}%`);

if (!APPLY) {
  console.log('\nDry run — nothing written. Re-run with --apply.');
  await conn.close();
  process.exit(0);
}

const token = jwt.sign({ id: 'admin', role: 'superadmin', name: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

let ok = 0, failed = 0;
for (const c of applicable) {
  try {
    const res = await fetch(`${API}/dealers/${c.d._id}`, {
      method: 'PUT', headers: H, body: JSON.stringify({ zone: c.r.zone }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    ok++;
  } catch (e) {
    failed++;
    console.warn(`   FAILED  ${c.d.name}: ${e.message}`);
  }
}
console.log(`\nupdated : ${ok}`);
console.log(`failed  : ${failed}`);
await conn.close();
