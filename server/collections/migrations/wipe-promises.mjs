import fs from 'fs';
import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
/**
 * Remove every promise (and its events) — the last figures left after the
 * outstanding was cleared for a fresh start. Follow-up notes are kept, just
 * unlinked. Backs up to ~/Downloads first. `--dry-run` prints, `--apply` does.
 */
const { dryRun, db } = args();
await connect({ db });
const D = mongoose.connection.db;
const promises = await D.collection('col_promises').find({}).toArray();
const events = await D.collection('col_events').find({ type: /^PROMISE_/ }).toArray();
const linked = await D.collection('col_followups').countDocuments({ promiseId: { $ne: null } });
console.log(`promises: ${promises.length}   Σ ₹${promises.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString('en-IN')}   promise events: ${events.length}   follow-ups linked: ${linked}`);
if (dryRun) { console.log('DRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }

const dir = `${process.env.HOME}/Downloads/collections-outstanding-backup-2026-09-13`;
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(`${dir}/col_promises.json`, JSON.stringify(promises));
fs.writeFileSync(`${dir}/col_events_promises.json`, JSON.stringify(events));
console.log(`backup written to ${dir}`);
console.log('deleted promises      ', (await D.collection('col_promises').deleteMany({})).deletedCount);
console.log('deleted promise events', (await D.collection('col_events').deleteMany({ type: /^PROMISE_/ })).deletedCount);
console.log('follow-ups unlinked   ', (await D.collection('col_followups').updateMany({ promiseId: { $ne: null } }, { $set: { promiseId: null } })).modifiedCount);
await mongoose.disconnect();
