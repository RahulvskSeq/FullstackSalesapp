import fs from 'fs';
import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
/**
 * Blank the Collections module for a fresh start: every follow-up, promise,
 * payment, task, event, balance, statement and import goes. Dealers, users,
 * settings, WhatsApp templates and the audit log stay. Backs everything up
 * to ~/Downloads first. `--dry-run` prints, `--apply` does.
 */
const WIPE = ['col_followups', 'col_promises', 'col_payments', 'col_payment_allocations', 'col_attachments', 'col_tasks',
  'col_events', 'col_balances', 'col_snapshots', 'col_cycles', 'col_invoices', 'col_imports', 'col_import_rows',
  'col_employee_activity', 'col_employee_reviews', 'col_notifications', 'col_jobs', 'col_whatsapp_messages'];
const { dryRun, db } = args();
await connect({ db });
const D = mongoose.connection.db;
const counts = {};
for (const c of WIPE) counts[c] = await D.collection(c).countDocuments();
const promises = await D.collection('col_promises').find({}, { projection: { amount: 1 } }).toArray();
for (const [c, n] of Object.entries(counts)) if (n) console.log(`  ${c.padEnd(26)} ${n}`);
console.log(`  promise amounts Σ ₹${promises.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString('en-IN')}`);
if (dryRun) { console.log('DRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }

const dir = `${process.env.HOME}/Downloads/collections-wipe-backup-${new Date().toISOString().slice(0, 10)}`;
fs.mkdirSync(dir, { recursive: true });
for (const c of WIPE) {
  if (!counts[c]) continue;
  fs.writeFileSync(`${dir}/${c}.json`, JSON.stringify(await D.collection(c).find({}).toArray()));
  const r = await D.collection(c).deleteMany({});
  console.log(`  ${c.padEnd(26)} backed up ${counts[c]} → deleted ${r.deletedCount}`);
}
console.log(`backup in ${dir}`);
await mongoose.disconnect();
