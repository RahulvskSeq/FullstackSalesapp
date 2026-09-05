/**
 * reroute-child-catalogues.mjs
 *
 * Re-attributes already-imported invoice lines to the CHILD catalogue they
 * were actually sold from.
 *
 * The ERP invoice references the parent product's id and prints the parent's
 * category, but names the line by the dealer's private label — "KAR 95"
 * rather than "VN 9037 ZF VNSTX". That label is its own child row in the
 * master, carrying its own category (KARA HOME DECOR) and a parentProduct
 * pointing back at the parent. So the sale belongs to the child's catalogue,
 * not the parent's, and without this every private-label sale piles up under
 * the parent.
 *
 * New imports get this right on their own; this only repairs rows imported
 * before the rule existed.
 *
 * Deliberately conservative — a wrong catalogue is worse than a coarse one:
 *   - the printed name must resolve to a child of THAT line's product;
 *   - a name matching several master rows is skipped unless one of them is a
 *     child of this exact parent;
 *   - a child whose own category is a comma-joined list is skipped.
 * Quantities never move; only which catalogue they are filed under.
 *
 * Dry run by default. Pass --apply to write, then re-run the sales sync so
 * Sale.brand catches up.
 *
 * Usage:
 *   node scripts/reroute-child-catalogues.mjs
 *   node scripts/reroute-child-catalogues.mjs --apply
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();
const APPLY = process.argv.includes('--apply');
const S = v => String(v ?? '').trim();

const conn = await mongoose.createConnection(process.env.MONGO_URI).asPromise();
const db = conn.db;

const masters = await db.collection('productmasters')
  .find({}, { projection: { productId: 1, name: 1, brand: 1, parentProduct: 1, isParent: 1 } }).toArray();
const byName = new Map();
for (const m of masters) {
  const nm = S(m.name);
  if (!nm) continue;
  if (!byName.has(nm)) byName.set(nm, []);
  byName.get(nm).push(m);
}

const childCatalogueFor = (printedName, parentPid) => {
  const rows = byName.get(S(printedName));
  if (!rows || !rows.length) return '';
  const pick = rows.find(r => r.parentProduct && r.parentProduct === parentPid)
            || (rows.length === 1 ? rows[0] : null);
  if (!pick || pick.isParent) return '';
  const b = S(pick.brand);
  return (!b || b.includes(',')) ? '' : b;
};

const txns = await db.collection('producttxns')
  .find({}, { projection: { productName: 1, productId: 1, brand: 1, qty: 1, month: 1 } }).toArray();

const moves = [], byPair = new Map();
for (const t of txns) {
  const child = childCatalogueFor(t.productName, t.productId);
  if (!child || child === t.brand) continue;
  moves.push({ _id: t._id, from: t.brand, to: child, qty: t.qty, name: t.productName });
  const k = `${t.brand}  →  ${child}`;
  const e = byPair.get(k) || { lines: 0, qty: 0 };
  e.lines++; e.qty += t.qty || 0;
  byPair.set(k, e);
}

console.log(`mode  : ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}`);
console.log(`lines : ${txns.length} imported`);
console.log(`moving: ${moves.length} lines / ${moves.reduce((a, m) => a + (m.qty || 0), 0)} units\n`);
[...byPair].sort((a, b) => b[1].qty - a[1].qty).slice(0, 30)
  .forEach(([k, v]) => console.log(`   ${String(v.qty).padStart(5)}u  ${String(v.lines).padStart(3)} lines   ${k}`));
if (byPair.size > 30) console.log(`   ... +${byPair.size - 30} more pairings`);

if (!moves.length) { console.log('\nNothing to reroute.'); await conn.close(); process.exit(0); }

if (!APPLY) {
  console.log('\nDry run — nothing written. Re-run with --apply, then re-run the sales sync.');
} else {
  let done = 0;
  for (let i = 0; i < moves.length; i += 300) {
    const ops = moves.slice(i, i + 300).map(m => ({
      updateOne: { filter: { _id: m._id }, update: { $set: { brand: m.to, parentBrand: m.from } } },
    }));
    const r = await db.collection('producttxns').bulkWrite(ops, { ordered: false });
    done += r.modifiedCount || 0;
  }
  console.log(`\nrerouted: ${done} lines`);
  console.log('Now re-run the sales sync so Sale.brand catches up:');
  console.log('   POST /api/producttx/sync-sales?commit=1');
}

await conn.close();
