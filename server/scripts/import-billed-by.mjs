/**
 * import-billed-by.mjs
 *
 * Stamps the billing person onto already-imported invoice lines from the
 * ERP's voucher export, which carries a "Created By" column — the person who
 * actually raised the voucher.
 *
 * That is better than inferring the biller from the salesman: it is the real
 * creator, it covers people who bill for nobody in particular, and it changes
 * when the work does. `billedBy` takes priority over the salesman mapping in
 * lib/incentive.js, so stamping it is all that is needed.
 *
 * The join is Voucher No → Created By.
 *
 * Names arrive with company suffixes ("SAHANA SEQUENCE SURFACE", "Anu
 * Sequencesurfaces"), so they are normalised to one spelling per person —
 * otherwise the same biller would appear two or three times in the incentive
 * table and each slice would be rated separately, which pays less than it
 * should.
 *
 * Dry run by default.
 *
 *   node scripts/import-billed-by.mjs --file "<voucher export.csv>"
 *   node scripts/import-billed-by.mjs --file "<...>.csv" --apply
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
const arg = (n, d = '') => { const i = process.argv.indexOf(n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const APPLY = process.argv.includes('--apply');
const FILE  = arg('--file');
if (!FILE) { console.error('Usage: --file "<voucher export.csv>" [--apply]'); process.exit(1); }

/* ── CSV, quote-aware ──────────────────────────────────────────────── */
const parseRow = (line) => {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
};

/**
 * One spelling per person.
 *
 * Only the company suffix is stripped — the part that is obviously not a name.
 * Anything else is left alone and simply title-cased, so two genuinely
 * different people are never merged by an over-eager rule.
 */
/**
 * Spellings that are the same person under a different name.
 *
 * The export writes "Lavanya Shetty" and "Shashi Kala", while the salesman
 * mapping in lib/incentive.js says "Lavanya" and "Shashikala". Left alone,
 * each person would appear twice in the incentive table and each slice would
 * be rated on its own — which pays LESS than one combined total, because the
 * rate bands are reached later. Aliases keep one row per person.
 *
 * Add to this when a new spelling appears; the dry run prints every spelling
 * it folded, so a new one is visible before anything is written.
 */
const ALIASES = {
  'lavanya shetty': 'Lavanya',
  'shashi kala':    'Shashikala',
};

const COMPANY = /\b(sequence\s*surfaces?|sequencesurfaces?)\b/gi;
const titleCase = s => s.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
function canonical(raw) {
  let s = String(raw || '').replace(COMPANY, ' ');
  s = s.replace(/[-–—]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const t = titleCase(s);
  return ALIASES[t.toLowerCase()] || t;
}

const txt = fs.readFileSync(FILE, 'utf8').replace(/\r\n/g, '\n');
const lines = txt.split('\n').filter(l => l.trim());
const hdr = parseRow(lines[0]).map(h => h.trim());
const iV = hdr.indexOf('Voucher No');
const iC = hdr.indexOf('Created By');
if (iV < 0 || iC < 0) { console.error('Need "Voucher No" and "Created By" columns; saw: ' + hdr.join(', ')); process.exit(1); }

const byVoucher = new Map();          // voucher → canonical name
const rawSeen = new Map();            // canonical → Set(raw spellings)
const disagree = [];
for (let i = 1; i < lines.length; i++) {
  const r = parseRow(lines[i]);
  const v = String(r[iV] || '').trim();
  const raw = String(r[iC] || '').trim();
  if (!v || !raw) continue;
  const name = canonical(raw);
  if (!name) continue;
  if (!rawSeen.has(name)) rawSeen.set(name, new Set());
  rawSeen.get(name).add(raw);
  if (byVoucher.has(v)) {
    // One voucher created by two different people would make the stamp
    // arbitrary, so it is surfaced rather than last-write-wins.
    if (byVoucher.get(v) !== name && disagree.length < 10) disagree.push(`${v}: ${byVoucher.get(v)} vs ${name}`);
    continue;
  }
  byVoucher.set(v, name);
}

console.log(`mode     : ${APPLY ? 'APPLY' : 'DRY RUN'}`);
console.log(`file     : ${FILE.split('/').pop()}`);
console.log(`vouchers : ${byVoucher.size}`);
console.log('\nbilling people, and the spellings folded into each:');
for (const [name, raws] of [...rawSeen].sort()) {
  console.log(`   ${name.padEnd(18)} ← ${[...raws].join(' | ')}`);
}
if (disagree.length) {
  console.log('\nVOUCHERS WITH TWO CREATORS — first kept:');
  disagree.forEach(d => console.log('   ' + d));
}

/* ── what stamping would do ────────────────────────────────────────── */
const conn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
const db = conn.db;
const txns = await db.collection('producttxns')
  .find({}, { projection: { voucherNo: 1, qty: 1, billedBy: 1 } }).toArray();

const updates = [];
const tally = new Map();
let unmatchedLines = 0, unmatchedUnits = 0;
for (const t of txns) {
  const name = byVoucher.get(String(t.voucherNo || '').trim());
  if (!name) { unmatchedLines++; unmatchedUnits += t.qty || 0; continue; }
  const e = tally.get(name) || { lines: 0, units: 0 };
  e.lines++; e.units += t.qty || 0; tally.set(name, e);
  if (String(t.billedBy || '') !== name) updates.push({ _id: t._id, name });
}

console.log(`\ninvoice lines : ${txns.length}`);
console.log(`would stamp   : ${updates.length}`);
console.log(`no voucher match: ${unmatchedLines} lines / ${unmatchedUnits} units — these keep the salesman mapping`);
console.log('\nunits per billing person once stamped:');
[...tally].sort((a, b) => b[1].units - a[1].units)
  .forEach(([k, v]) => console.log(`   ${k.padEnd(18)} ${String(v.units).padStart(6)} units  ${String(v.lines).padStart(5)} lines`));

if (!APPLY) {
  console.log('\nDry run — nothing written. Add --apply to stamp these onto the invoice lines.');
  await conn.close();
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = `/tmp/billedby-${stamp}.json`;
fs.writeFileSync(backup, JSON.stringify(
  txns.filter(t => updates.some(u => String(u._id) === String(t._id)))
      .map(t => ({ _id: String(t._id), billedBy: t.billedBy || '' })), null, 1));
console.log(`\nbackup: ${backup}`);

let n = 0;
for (let i = 0; i < updates.length; i += 500) {
  const ops = updates.slice(i, i + 500).map(u => ({
    updateOne: { filter: { _id: u._id }, update: { $set: { billedBy: u.name } } },
  }));
  const res = await db.collection('producttxns').bulkWrite(ops, { ordered: false });
  n += res.modifiedCount || 0;
}
console.log(`stamped: ${n} lines`);
await conn.close();
