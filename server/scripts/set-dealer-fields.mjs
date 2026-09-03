/**
 * set-dealer-fields.mjs
 *
 * Bulk-update any dealer fields from a TSV whose FIRST ROW names the columns:
 *
 *   Dealer Name<TAB>creditDays<TAB>creditLimit
 *   AADINATH PLYWOOD AND HARDWARE<TAB>30<TAB>100000
 *
 * The first column is always the dealer name; every other column is a field
 * on the dealer. Header aliases are accepted, so "Credit Days", "credit_days"
 * and "creditDays" all resolve.
 *
 * Supersedes the single-purpose set-dealer-zones.mjs / set-dealer-info.mjs —
 * those are kept only because their data files are checked in beside them.
 *
 * Rules that make bulk edits safe:
 *   - empty cells are LEFT ALONE, never written as blanks;
 *   - a value equal to what is already stored is skipped, so re-running is a
 *     no-op and doubles as a verification pass;
 *   - names match on the same identity key the ERP import uses; a fuzzy match
 *     is reported but never applied without --fuzzy, because writing a credit
 *     limit onto the wrong dealer is silent damage;
 *   - numeric fields are parsed and rejected if they are not numbers.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Usage:
 *   node scripts/set-dealer-fields.mjs --file credit.tsv
 *   node scripts/set-dealer-fields.mjs --file credit.tsv --apply
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

/** Header text -> dealer field. Anything unrecognised is rejected loudly. */
const FIELDS = {
  creditdays: 'creditDays', creditlimit: 'creditLimit',
  city: 'city', state: 'state', zone: 'zone', address: 'address',
  pincode: 'pincode', status: 'status', target: 'target',
  dealertype: 'dealerType', salesman: 'salesman',
};
const NUMERIC = new Set(['creditDays', 'creditLimit', 'target']);
const norm = h => String(h || '').toLowerCase().replace(/[^a-z]/g, '');

const lines = fs.readFileSync(FILE, 'utf8').replace(/\r/g, '').trim().split('\n');
const header = lines[0].split('\t').map(h => h.trim());
const cols = header.slice(1).map(h => {
  const f = FIELDS[norm(h)];
  if (!f) { console.error(`Unknown column "${h}". Known: ${Object.values(FIELDS).join(', ')}`); process.exit(1); }
  return f;
});

const rows = lines.slice(1).map(l => {
  const p = l.split('\t');
  const out = { name: (p[0] || '').trim(), vals: {} };
  cols.forEach((f, i) => {
    const raw = (p[i + 1] || '').trim();
    if (!raw) return;
    if (NUMERIC.has(f)) {
      const n = Number(raw.replace(/[, ]/g, ''));
      if (!Number.isFinite(n)) { console.error(`Row "${out.name}": "${raw}" is not a number for ${f}`); process.exit(1); }
      out.vals[f] = n;
    } else out.vals[f] = raw;
  });
  return out;
}).filter(r => r.name);

console.log(`file   : ${FILE}  (${rows.length} rows)`);
console.log(`fields : ${cols.join(', ')}`);
console.log(`mode   : ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}\n`);

const conn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
const proj = { _id: 1, name: 1 };
for (const f of cols) proj[f] = 1;
const dealers = await conn.db.collection('dealers').find({}, { projection: proj }).toArray();
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
  const patch = {};
  for (const [f, v] of Object.entries(r.vals)) {
    const cur = m.dealer[f];
    if (NUMERIC.has(f) ? Number(cur || 0) !== v : String(cur || '') !== v) patch[f] = v;
  }
  if (!Object.keys(patch).length) { skipped.push({ r, why: 'already correct' }); continue; }
  plan.push({ d: m.dealer, patch, reason: m.reason });
}

console.log(`to update : ${plan.length}`);
console.log(`skipped   : ${skipped.length}\n`);
for (const p of plan) {
  const parts = Object.entries(p.patch).map(([k, v]) => `${k}: ${p.d[k] ?? '(unset)'} -> ${v}`);
  console.log(`   ${p.d.name}${p.reason === 'fuzzy' ? '  [FUZZY]' : ''}`);
  parts.forEach(t => console.log(`      ${t}`));
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
