import mongoose from 'mongoose';
import { args, connect, normName, ymd } from './_shared.mjs';
import { ColImport, ColImportRow, ColCycle } from '../models/index.js';
import { resolvePeriods } from '../lib/periods.js';
import { applyImport } from '../engines/reconcile.js';
/**
 * M2 — the 1,583 legacy balances become one snapshot-mode import, dated to
 * their last update, so they are history and current state until the first
 * ERP statement supersedes them. Nothing in `outstandings` is touched.
 */
const { dryRun, db } = args();
await connect({ db });
const Dealer = mongoose.models.Dealer;
const legacy = mongoose.connection.db.collection('outstandings');
const FILE = 'legacy-google-sheet';
const prior = await ColImport.findOne({ source: 'legacy', fileName: FILE }).lean();
if (prior?.status === 'APPLIED') { console.log('already migrated — nothing to do'); await mongoose.disconnect(); process.exit(0); }
if (prior) {
  // A previous run staged the rows and stopped part-way: finish it. applyImport skips chunks already written.
  console.log(`resuming import ${prior._id} (${prior.status}, chunks done: ${prior.appliedChunks?.length || 0})`);
  if (dryRun) { console.log('DRY RUN — would resume. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }
  const done = await applyImport(prior._id, { by: 'migration' });
  console.log(`applied: ${JSON.stringify(done.stats)}`); await mongoose.disconnect(); process.exit(0);
}

const rows = await legacy.find({}).toArray();
const asOn = ymd(rows.reduce((m, r) => r.updatedAt > m ? r.updatedAt : m, rows[0]?.updatedAt || new Date()));
const labels = [...new Set(rows.flatMap(r => Object.keys(r.monthlyOutstanding || {})))];
const periodOf = Object.fromEntries(labels.map((l, i) => [l, resolvePeriods(labels, { asOn })[i]]));
console.log(`legacy rows: ${rows.length}   asOn: ${asOn}   periods: ${JSON.stringify(periodOf)}`);

const dealers = await Dealer.find({}, 'name').lean();
const byNorm = new Map(dealers.map(d => [normName(d.name), d]));
let matched = 0, unmapped = 0, sum = 0; const staged = [];
rows.forEach((r, i) => {
  const d = byNorm.get(normName(r.dealerName));
  const buckets = {}; for (const [l, v] of Object.entries(r.monthlyOutstanding || {})) if (periodOf[l]) buckets[periodOf[l]] = Math.max(0, Math.round(Number(v) || 0));
  const latest = Object.keys(buckets).sort().pop(); const total = latest ? buckets[latest] : 0; sum += total;
  if (d) matched++; else unmapped++;
  staged.push({ rowNo: i + 1, rawParty: r.dealerName, partyName: r.dealerName, code: '', matchedDealerId: d?._id || null, matchMethod: d ? 'name' : 'none', buckets, total, status: d ? 'OK' : 'UNMAPPED', legacyCreatedAt: r.createdAt });
});
// The sheet spelt some dealers more than one way ("U & CO", "U CO", "U  CO")
// and each spelling got its own row — but in every such case only one of the
// spellings carries money, the rest are zero rows. One snapshot per dealer per
// import, so the row with the balance is kept and the zero spellings are
// recorded as DUPLICATE: visible in the import, never applied. A dealer with
// two money-carrying spellings would be a real conflict and is refused here,
// because guessing which balance is right is not this script's call.
const byDealer = new Map();
for (const s of staged) if (s.matchedDealerId) { const k = String(s.matchedDealerId); if (!byDealer.has(k)) byDealer.set(k, []); byDealer.get(k).push(s); }
let folded = 0;
for (const group of byDealer.values()) {
  if (group.length < 2) continue;
  const nonZero = group.filter(s => Object.values(s.buckets).some(v => v > 0));
  if (nonZero.length > 1) { console.error(`CONFLICT: ${group.map(s => `${s.rawParty} (${s.total})`).join(' | ')} — two spellings both carry a balance; fix the legacy rows first`); process.exit(2); }
  const keep = nonZero[0] || group.find(s => s.rawParty === byNorm.get(normName(s.rawParty))?.name) || group[0];
  for (const s of group) if (s !== keep) { s.status = 'DUPLICATE'; s.reason = `same dealer as row ${keep.rowNo} (${keep.rawParty}); zero balance spelling`; matched--; folded++; }
}
console.log(`matched ${matched}   unmapped ${unmapped}   duplicate spellings folded ${folded}   Σ latest-month balance ${sum.toLocaleString('en-IN')}`);
if (dryRun) { console.log('\nDRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }

const imp = await ColImport.create({ fileName: FILE, fileHash: 'legacy:' + asOn, source: 'legacy', balanceMode: 'snapshot', balanceModeDetected: 'snapshot', asOn, periods: Object.values(periodOf).filter(Boolean).sort(), uploadedBy: 'migration', uploadedByName: 'Migration M2', status: 'VALIDATED', stats: { rows: rows.length, parties: rows.length - folded, matched, unmapped, duplicatesInFile: folded } });
await ColImportRow.insertMany(staged.map(({ legacyCreatedAt, ...s }) => ({ ...s, importId: imp._id })));
const done = await applyImport(imp._id, { by: 'migration' });
// A cycle opened by this import really opened when the legacy row was first written.
const created = new Map(staged.filter(s => s.matchedDealerId).map(s => [String(s.matchedDealerId), s.legacyCreatedAt]));
const cycles = await ColCycle.find({ openedByImportId: imp._id });
for (const c of cycles) { const at = created.get(String(c.dealerId)); if (at && at < c.openedAt) { c.openedAt = at; await c.save(); } }
console.log(`applied: ${JSON.stringify(done.stats)}   cycles opened: ${cycles.length}`);
await mongoose.disconnect();
