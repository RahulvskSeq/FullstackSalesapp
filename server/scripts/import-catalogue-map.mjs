/**
 * import-catalogue-map.mjs
 *
 * Loads the "CHILD CODE / DESIGN CODE / Catalog name" master sheet into the
 * CatalogueMap collection, then optionally re-files already-imported invoice
 * lines onto the catalogue that sheet says they belong to.
 *
 * Matching is by CHILD CODE only, against the invoice line's Product name.
 * Design codes are stored but not matched on: in the supplied file 623 of
 * 1,570 design codes appear under more than one catalogue, so using them would
 * be guessing. Anything the child code cannot resolve keeps the catalogue it
 * already had.
 *
 * Dry run by default.
 *
 *   node scripts/import-catalogue-map.mjs --file "<path to .xlsx>"
 *   node scripts/import-catalogue-map.mjs --file "<path>" --apply
 *   node scripts/import-catalogue-map.mjs --file "<path>" --apply --backfill
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ExcelJS from 'exceljs';
import fs from 'fs';

dotenv.config();
const arg = (n, d = '') => { const i = process.argv.indexOf(n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const APPLY    = process.argv.includes('--apply');
const BACKFILL = process.argv.includes('--backfill');
const FILE     = arg('--file');
if (!FILE) { console.error('Usage: --file "<sheet.xlsx>" [--apply] [--backfill]'); process.exit(1); }

const val = v => (v && typeof v === 'object') ? (v.result ?? v.text ?? '') : v;
const key = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const conn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
const db = conn.db;

/* ── read the master sheet ─────────────────────────────────────────── */
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(FILE);
const ws = wb.worksheets[0];

// Find the columns by name rather than position, so a re-ordered export works.
const hdr = ws.getRow(1).values.slice(1).map(h => String(val(h) || '').trim().toLowerCase());
const find = (...names) => {
  for (const n of names) { const i = hdr.findIndex(h => h.replace(/[^a-z]/g, '') === n); if (i >= 0) return i + 1; }
  return 0;
};
const cChild  = find('childcode');
const cDesign = find('designcode');
const cCat    = find('catalogname', 'cataloguename', 'catalog', 'catalogue');
if (!cChild || !cCat) { console.error('Need a CHILD CODE and a Catalog name column; saw: ' + hdr.join(', ')); process.exit(1); }

const rows = new Map();                 // childKey → row
let blank = 0, dupes = 0, conflicts = [];
for (let r = 2; r <= ws.rowCount; r++) {
  const childCode = String(val(ws.getRow(r).getCell(cChild).value) || '').trim();
  const catalogue = String(val(ws.getRow(r).getCell(cCat).value) || '').trim();
  const designCode = cDesign ? String(val(ws.getRow(r).getCell(cDesign).value) || '').trim() : '';
  const k = key(childCode);
  if (!k || !catalogue) { blank++; continue; }
  if (rows.has(k)) {
    dupes++;
    // A code claiming two catalogues is the one thing that would silently
    // misfile sales, so it is surfaced rather than last-write-wins.
    if (rows.get(k).catalogue !== catalogue && conflicts.length < 20)
      conflicts.push(`${childCode}: ${rows.get(k).catalogue} vs ${catalogue}`);
    continue;
  }
  rows.set(k, { childKey: k, childCode, designCode, catalogue });
}

console.log(`mode      : ${APPLY ? 'APPLY' : 'DRY RUN'}${BACKFILL ? ' + BACKFILL' : ''}`);
console.log(`sheet     : ${FILE.split('/').pop()}`);
console.log(`child codes: ${rows.size}   catalogues: ${new Set([...rows.values()].map(r => r.catalogue)).size}`);
console.log(`skipped   : ${blank} blank, ${dupes} repeated`);
if (conflicts.length) {
  console.log('\nCODES CLAIMING TWO CATALOGUES — first spelling kept:');
  conflicts.forEach(c => console.log('   ' + c));
}

/* ── what re-filing would do ───────────────────────────────────────── */
const txns = await db.collection('producttxns')
  .find({}, { projection: { productName: 1, brand: 1, qty: 1 } }).toArray();
const moves = [];
for (const t of txns) {
  const hit = rows.get(key(t.productName));
  if (!hit) continue;
  if (String(t.brand || '').trim() === hit.catalogue) continue;
  moves.push({ _id: t._id, from: t.brand || '', to: hit.catalogue, qty: t.qty || 0 });
}
const byPair = new Map();
for (const m of moves) {
  const k = `${m.from || '(blank)'}  →  ${m.to}`;
  const e = byPair.get(k) || { lines: 0, units: 0 };
  e.lines++; e.units += m.qty; byPair.set(k, e);
}
console.log(`\ninvoice lines: ${txns.length}`);
console.log(`would re-file: ${moves.length} lines / ${moves.reduce((a, m) => a + m.qty, 0)} units`);
[...byPair].sort((a, b) => b[1].units - a[1].units).slice(0, 25)
  .forEach(([k, v]) => console.log(`   ${String(v.units).padStart(5)}u ${String(v.lines).padStart(4)} lines   ${k}`));
if (byPair.size > 25) console.log(`   … +${byPair.size - 25} more pairings`);

if (!APPLY) {
  console.log('\nDry run — nothing written. Add --apply to store the map, and --backfill to re-file existing lines.');
  await conn.close();
  process.exit(0);
}

/* ── store the map ─────────────────────────────────────────────────── */
const all = [...rows.values()];
await db.collection('cataloguemaps').createIndex({ childKey: 1 }, { unique: true }).catch(() => {});
let wrote = 0;
for (let i = 0; i < all.length; i += 1000) {
  const ops = all.slice(i, i + 1000).map(r => ({
    updateOne: { filter: { childKey: r.childKey }, update: { $set: r }, upsert: true },
  }));
  const res = await db.collection('cataloguemaps').bulkWrite(ops, { ordered: false });
  wrote += (res.upsertedCount || 0) + (res.modifiedCount || 0);
}
console.log(`\nstored: ${all.length} child codes (${wrote} new or changed)`);

/* ── re-file existing lines ────────────────────────────────────────── */
if (BACKFILL && moves.length) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = `/tmp/catalogue-backfill-${stamp}.json`;
  fs.writeFileSync(backup, JSON.stringify(moves.map(m => ({ _id: String(m._id), from: m.from, to: m.to })), null, 1));
  console.log(`backup : ${backup}`);
  let n = 0;
  for (let i = 0; i < moves.length; i += 500) {
    const ops = moves.slice(i, i + 500).map(m => ({
      // parentBrand keeps what it used to say, the same field the earlier
      // child-catalogue rerouting used, so the move stays traceable.
      updateOne: { filter: { _id: m._id }, update: { $set: { brand: m.to, parentBrand: m.from } } },
    }));
    const res = await db.collection('producttxns').bulkWrite(ops, { ordered: false });
    n += res.modifiedCount || 0;
  }
  console.log(`re-filed: ${n} lines`);
  console.log('\nNow re-run the sales sync so Sale.brand catches up:');
  console.log('   POST /api/producttx/sync-sales?commit=1');
}

await conn.close();
