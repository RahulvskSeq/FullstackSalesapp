import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
import { DEFAULTS } from '../lib/settings.js';
/**
 * Tasks are created by people, not rules: switch off every rule that creates
 * a task and remove the tasks the rules already made. Rules that only tidy
 * up (close tasks when a dealer clears) stay on. --dry-run / --apply.
 */
const { dryRun, db } = args();
await connect({ db });
const D = mongoose.connection.db;
const CREATORS = new Set(['createTask', 'breakPromise', 'sendWhatsApp']);
const cur = (await D.collection('settings').findOne({ key: 'collections.automationRules' }))?.value || DEFAULTS['collections.automationRules'];
const next = cur.map(r => CREATORS.has(r.action) ? { ...r, enabled: false } : r);
console.log(next.map(r => `  ${r.enabled ? 'on ' : 'off'}  ${r.id.padEnd(26)} ${r.action}`).join('\n'));
const auto = await D.collection('col_tasks').countDocuments({ source: 'automation' });
console.log(`automatic tasks to remove: ${auto}`);
if (dryRun) { console.log('DRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }
await D.collection('settings').updateOne({ key: 'collections.automationRules' }, { $set: { key: 'collections.automationRules', value: next } }, { upsert: true });
const ids = (await D.collection('col_tasks').find({ source: 'automation' }, { projection: { _id: 1 } }).toArray()).map(t => t._id);
console.log('tasks removed        ', (await D.collection('col_tasks').deleteMany({ _id: { $in: ids } })).deletedCount);
console.log('task events removed  ', (await D.collection('col_events').deleteMany({ refType: 'task', refId: { $in: ids } })).deletedCount);
console.log('notifications removed', (await D.collection('col_notifications').deleteMany({ refType: 'task', refId: { $in: ids } })).deletedCount);
await mongoose.disconnect();
