import fs from 'fs';
import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
/**
 * Remove every uploaded statement and the figures built from it — imports,
 * rows, snapshots, balances, cycles and statement events — so the book can
 * be uploaded afresh. Follow-ups, promises, payments and tasks are kept and
 * unlinked from the cycles that go. Backs up first. --dry-run / --apply.
 */
const WIPE = ['col_imports', 'col_import_rows', 'col_snapshots', 'col_balances', 'col_cycles', 'col_invoices', 'col_jobs'];
const STATEMENT_EVENTS = ['NEW_OUTSTANDING', 'INCREASED', 'DECREASED', 'CLEARED', 'UNCHANGED', 'REOPENED', 'RECONCILIATION_DIFFERENCE', 'ADJUSTMENT'];
const { dryRun, db } = args();
await connect({ db });
const D = mongoose.connection.db;
for (const c of WIPE) console.log(`  ${c.padEnd(18)} ${await D.collection(c).countDocuments()}`);
console.log(`  ${'statement events'.padEnd(18)} ${await D.collection('col_events').countDocuments({ type: { $in: STATEMENT_EVENTS } })}`);
for (const c of ['col_followups', 'col_promises', 'col_payments', 'col_tasks']) console.log(`  kept: ${c.padEnd(14)} ${await D.collection(c).countDocuments()}`);
if (dryRun) { console.log('DRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }
const dir = `${process.env.HOME}/Downloads/collections-statements-backup-${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16)}`;
fs.mkdirSync(dir, { recursive: true });
for (const c of WIPE) { const rows = await D.collection(c).find({}).toArray(); if (!rows.length) continue; fs.writeFileSync(`${dir}/${c}.json`, JSON.stringify(rows)); console.log(`  ${c.padEnd(18)} backed up ${rows.length} → deleted ${(await D.collection(c).deleteMany({})).deletedCount}`); }
const ev = await D.collection('col_events').find({ type: { $in: STATEMENT_EVENTS } }).toArray();
if (ev.length) { fs.writeFileSync(`${dir}/col_events.json`, JSON.stringify(ev)); console.log(`  ${'statement events'.padEnd(18)} backed up ${ev.length} → deleted ${(await D.collection('col_events').deleteMany({ type: { $in: STATEMENT_EVENTS } })).deletedCount}`); }
for (const c of ['col_followups', 'col_promises', 'col_payments', 'col_tasks', 'col_events']) { const r = await D.collection(c).updateMany({ cycleId: { $ne: null } }, { $set: { cycleId: null } }); if (r.modifiedCount) console.log(`  ${c.padEnd(18)} unlinked from cycles ${r.modifiedCount}`); }
console.log(`backup in ${dir}`);
await mongoose.disconnect();
