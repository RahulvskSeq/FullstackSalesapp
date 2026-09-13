import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
import { stageFile, buildPreview } from '../engines/importEngine.js';
import { applyImport } from '../engines/reconcile.js';
import '../engines/automation.js';
/**
 * Import a statement from the command line — the same path as the Imports
 * screen (stage → preview → apply), for when the UI is not at hand.
 *   node collections/migrations/import-file.mjs --file "<xlsx>" [--asOn YYYY-MM-DD] [--mode buckets|snapshot] [--by admin] [--apply]
 * Without --apply it stages and prints the preview only (the staged import
 * can then be applied from the Imports screen).
 */
const { dryRun, db, file } = args();
const get = k => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : ''; };
if (!file) { console.error('--file is required'); process.exit(2); }
await connect({ db });
const buffer = fs.readFileSync(file);
const st = await stageFile({ buffer, fileName: path.basename(file), size: buffer.length, user: { id: get('--by') || 'admin', name: get('--by') || 'admin' }, asOn: get('--asOn'), balanceMode: get('--mode') });
if (st.duplicate) { console.log(`DUPLICATE of "${st.duplicateOf.fileName}" (applied ${st.duplicateOf.appliedAt}); nothing staged.`); await mongoose.disconnect(); process.exit(1); }
const pv = await buildPreview(st.import._id);
const i = pv.import;
console.log(`staged ${i.fileName}  asOn ${i.asOn}  mode ${i.balanceMode} (detected ${i.balanceModeDetected} ${JSON.stringify(st.detection)})  months ${i.periods.join(', ')}`);
console.log(`rows ${i.stats.rows}  matched ${i.stats.matched}  unmapped ${i.stats.unmapped}  errors ${i.stats.errors}  dup-in-file ${i.stats.duplicatesInFile}`);
console.log(`new ${i.stats.new}  increased ${i.stats.increased}  decreased ${i.stats.decreased}  cleared ${i.stats.cleared}  unchanged ${i.stats.unchanged}  reopened ${i.stats.reopened}  total ${i.stats.totalBefore.toLocaleString('en-IN')} → ${i.stats.totalAfter.toLocaleString('en-IN')}`);
if (pv.unmapped.length) console.log('unmapped:', pv.unmapped.slice(0, 50).map(u => u.rawParty).join(' | '));
if (dryRun) { console.log('staged only — apply from the Imports screen, or re-run with --apply'); await mongoose.disconnect(); process.exit(0); }
const done = await applyImport(st.import._id, { by: get('--by') || 'admin' });
console.log(`APPLIED  total now ${done.stats.totalAfter.toLocaleString('en-IN')}  new ${done.stats.new}  unchanged ${done.stats.unchanged}`);
await mongoose.disconnect();
