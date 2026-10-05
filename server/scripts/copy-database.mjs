// Copy the whole app database to another MongoDB, as-is: every collection, every
// document (same _id), every index — including the APK update file (apk.files/chunks).
//
//   FROM  = MONGO_URI      in server/.env   (the database in use now)
//   TO    = NEW_MONGO_URI  in server/.env   (the new one — paste it there yourself)
//
//   node scripts/copy-database.mjs            → check both, list what would be copied (writes nothing)
//   node scripts/copy-database.mjs copy       → copy (refuses if the new database already has data)
//   node scripts/copy-database.mjs copy fresh → empty the NEW database first, then copy (for the final copy)
//   node scripts/copy-database.mjs verify     → compare document counts, collection by collection
//
// Connection strings are never printed. The old database is only ever read.
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const mode = process.argv[2] || 'check', fresh = process.argv[3] === 'fresh';
const FROM = process.env.MONGO_URI || process.env.MONGODB_URI, TO = process.env.NEW_MONGO_URI;
if (!FROM || !TO) { console.error('Set MONGO_URI (old) and NEW_MONGO_URI (new) in server/.env'); process.exit(1); }
const host = u => { try { const x = new URL(u); return { host: x.host, db: x.pathname.slice(1) || 'test', user: decodeURIComponent(x.username) }; } catch { return { host: '?', db: 'test', user: '?' }; } };
const A = host(FROM), B = host(TO);
// the app uses the database named in its connection string (none → "test"); keep the same name on the new side
const DB = A.db, DBNEW = new URL(TO).pathname.slice(1) || A.db;
if (A.host === B.host && DB === DBNEW) { console.error('NEW_MONGO_URI points at the same database as MONGO_URI — stopping.'); process.exit(1); }
console.log(`from  ${A.user}@${A.host} / ${DB}\nto    ${B.user}@${B.host} / ${DBNEW}`);

const src = new MongoClient(FROM), dst = new MongoClient(TO);
await src.connect(); await dst.connect();
const sdb = src.db(DB), ddb = dst.db(DBNEW);
const cols = (await sdb.listCollections().toArray()).filter(c => c.type !== 'view' && !c.name.startsWith('system.')).map(c => c.name).sort();

const counts = async (db, names) => Object.fromEntries(await Promise.all(names.map(async n => [n, await db.collection(n).estimatedDocumentCount().catch(() => 0)])));

if (mode === 'check') {
  const have = (await ddb.listCollections().toArray()).filter(c => !c.name.startsWith('system.'));
  const c = await counts(sdb, cols);
  console.log(`\n${cols.length} collections, ${Object.values(c).reduce((a, b) => a + b, 0)} documents to copy`);
  console.log(`new database right now: ${have.length ? have.length + ' collections (use "copy fresh" to replace them)' : 'empty — ready'}`);
  console.log('\nconnection to both databases OK. Nothing was written.');
} else if (mode === 'copy') {
  const existing = (await ddb.listCollections().toArray()).filter(c => !c.name.startsWith('system.'));
  if (existing.length && !fresh) { console.error(`The new database already has ${existing.length} collections. Run "copy fresh" to empty it first.`); process.exit(1); }
  if (fresh) { for (const c of existing) await ddb.collection(c.name).drop(); if (existing.length) console.log(`emptied ${existing.length} collections in the new database`); }
  const t0 = Date.now();
  for (const name of cols) {
    const s = sdb.collection(name), d = ddb.collection(name);
    await ddb.createCollection(name).catch(() => {});
    let n = 0, batch = [];
    for await (const doc of s.find({}, { batchSize: 200 })) {
      batch.push(doc);
      if (batch.length >= 200) { await d.insertMany(batch, { ordered: false }); n += batch.length; batch = []; }
    }
    if (batch.length) { await d.insertMany(batch, { ordered: false }); n += batch.length; }
    // the same indexes (unique ones included), apart from the built-in _id one
    const idx = (await s.indexes()).filter(i => i.name !== '_id_').map(({ v, ns, ...i }) => i);
    if (idx.length) await d.createIndexes(idx).catch(e => console.warn(`  ! ${name}: index ${e.message}`));
    console.log(`  ${name.padEnd(30)} ${String(n).padStart(8)} docs  ${idx.length} indexes`);
  }
  console.log(`copied ${cols.length} collections in ${Math.round((Date.now() - t0) / 1000)}s — now run: node scripts/copy-database.mjs verify`);
} else if (mode === 'verify') {
  const [a, b] = await Promise.all([counts(sdb, cols), counts(ddb, cols)]);
  let bad = 0;
  for (const n of cols) { const ok = a[n] === b[n]; if (!ok) bad++; console.log(`  ${ok ? '✓' : '✗'} ${n.padEnd(30)} old ${String(a[n]).padStart(8)}  new ${String(b[n]).padStart(8)}`); }
  console.log(bad ? `\n${bad} collection(s) differ — copy again with "copy fresh"` : `\nAll ${cols.length} collections match.`);
}
await src.close(); await dst.close();
