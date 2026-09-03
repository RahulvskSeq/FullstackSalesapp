/**
 * set-dealer-info.mjs
 *
 * Bulk-update dealer city / state / address from a TSV:
 *   "<dealer name>\t<city>\t<state>\t<address>"
 *
 * Empty columns are LEFT ALONE rather than blanked, so a sheet that only
 * fills in the state cannot wipe an address that is already correct.
 *
 * Matching uses the same identity key as the ERP import (punctuation, spacing
 * and legal forms stripped). Fuzzy matches are reported but never applied
 * without --fuzzy: writing an address onto the wrong dealer is silent damage.
 *
 * Writes through PUT /api/dealers/:id, the same path as an edit in the UI.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Usage:
 *   node scripts/set-dealer-info.mjs --file info.tsv
 *   node scripts/set-dealer-info.mjs --file info.tsv --apply
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

if (!FILE) { console.error('Usage: --file <tsv> [--apply] [--fuzzy]'); process.exit(1); }

const rows = fs.readFileSync(FILE, 'utf8').replace(/\r/g, '').trim().split('\n')
  .map(l => { const p = l.split('\t'); return {
    name: (p[0] || '').trim(), city: (p[1] || '').trim(),
    state: (p[2] || '').trim(), address: (p[3] || '').trim(),
  }; })
  .filter(r => r.name);

console.log(`file : ${FILE}  (${rows.length} rows)`);
console.log(`mode : ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}\n`);

const conn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
const dealers = await conn.db.collection('dealers')
  .find({}, { projection: { _id: 1, name: 1, city: 1, state: 1, address: 1 } }).toArray();
const index = new Map(), list = [];
for (const d of dealers) {
  const k = dealerKey(d.name);
  if (!k) continue;
  if (!index.has(k)) index.set(k, d);
  list.push([k, d]);
}
const memo = new Map();

const plan = [], skipped = [];
for (const r of rows) {
  const m = matchDealer(r.name, index, list, memo);
  if (!m.dealer) { skipped.push({ r, why: `no match (closest ${m.suggestion || '-'} ${(m.score * 100).toFixed(0)}%)` }); continue; }
  if (m.reason === 'fuzzy' && !ALLOW_FUZZY) { skipped.push({ r, why: `fuzzy ${(m.score * 100).toFixed(0)}% -> "${m.dealer.name}" (pass --fuzzy)` }); continue; }

  // Only send fields the sheet actually supplies, and only when different.
  const patch = {};
  for (const f of ['city', 'state', 'address']) {
    if (r[f] && String(m.dealer[f] || '') !== r[f]) patch[f] = r[f];
  }
  if (!Object.keys(patch).length) { skipped.push({ r, why: 'already correct' }); continue; }
  plan.push({ d: m.dealer, patch, reason: m.reason });
}

console.log(`to update : ${plan.length}`);
console.log(`skipped   : ${skipped.length}\n`);
for (const p of plan) {
  console.log(`   ${p.d.name}${p.reason === 'fuzzy' ? '  [FUZZY]' : ''}`);
  for (const [k, v] of Object.entries(p.patch))
    console.log(`      ${k}: "${p.d[k] || ''}" -> "${v}"`);
}
for (const s of skipped) console.log(`   SKIP  "${s.r.name}" — ${s.why}`);

if (!APPLY) {
  console.log('\nDry run — nothing written. Re-run with --apply.');
  await conn.close();
  process.exit(0);
}

const token = jwt.sign({ id: 'admin', role: 'superadmin', name: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

let ok = 0, failed = 0;
for (const p of plan) {
  try {
    const res = await fetch(`${API}/dealers/${p.d._id}`, { method: 'PUT', headers: H, body: JSON.stringify(p.patch) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    ok++;
  } catch (e) { failed++; console.warn(`   FAILED ${p.d.name}: ${e.message}`); }
}
console.log(`\nupdated : ${ok}`);
console.log(`failed  : ${failed}`);
await conn.close();
