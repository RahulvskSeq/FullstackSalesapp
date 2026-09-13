import 'dotenv/config';
import mongoose from 'mongoose';
import '../../models/Dealer.js';
import '../../models/User.js';
/**
 * Every migration: --dry-run prints what would happen and writes nothing;
 * --apply writes; --db <name> targets a scratch database instead of the live
 * one (used by the test harness). Each script is idempotent: running it
 * twice does not duplicate anything.
 */
export function args() {
  const a = process.argv.slice(2);
  const get = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  return { dryRun: !a.includes('--apply'), db: get('--db'), file: get('--file') };
}
export async function connect({ db }) {
  await mongoose.connect(process.env.MONGO_URI, db ? { dbName: db } : {});
  console.log(`database: ${mongoose.connection.name}`);
}
export const normName = s => String(s ?? '').toLowerCase().replace(/[.,'"&/\-–—()]/g, ' ').replace(/\s+/g, ' ').trim();
export const ymd = d => new Date(d).toISOString().slice(0, 10);
