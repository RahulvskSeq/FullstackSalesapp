import fs from 'fs';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import { args, connect, normName } from './_shared.mjs';
import { ColBalance, ColFollowUp, ColPromise } from '../models/index.js';
import { recordFollowup } from '../services/followups.js';
/**
 * Seed the "amount will come / on this date / remarks / concerns" sheet:
 * one follow-up per dealer (notes = remarks + concern) and, where an amount
 * and a date are given, a promise. Matched by exact normalised name only.
 *   node collections/migrations/seed-promises.mjs --file "<xlsx>" [--apply] [--by admin]
 */
const { dryRun, db, file } = args();
const get = k => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : ''; };
if (!file) { console.error('--file is required'); process.exit(2); }
await connect({ db });
const Dealer = mongoose.models.Dealer;
const today = new Date().toISOString().slice(0, 10);
const Y = +today.slice(0, 4), M = +today.slice(5, 7);
const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };
/** "16th Sep" → 2026-09-16 · "Sep" → last day of Sep · "5th Oct" → 2026-10-05 · Excel dates · else '' */
function parseWhen(v) {
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  const s = String(v ?? '').trim().toLowerCase().replace(/^(\d{1,2})[a-z]{1,3}\b/, '$1'); if (!s || s === '0') return '';   // "20tjh sep" → "20 sep"
  let m = /^(\d{1,2})(?:st|nd|rd|th)?[\s-]*([a-z]+)/.exec(s);
  if (m && MON[m[2]]) { const mo = MON[m[2]]; const y = mo < M - 1 ? Y + 1 : Y; return `${y}-${String(mo).padStart(2, '0')}-${String(+m[1]).padStart(2, '0')}`; }
  m = /^([a-z]+)$/.exec(s);
  if (m && MON[m[1]]) { const mo = MON[m[1]]; const y = mo < M - 1 ? Y + 1 : Y; return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10); }   // month only → its last day
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return m[0];
  return '';
}
const CONCERN_OUTCOME = c => /collected|received/i.test(c) ? 'PAID' : /follow/i.test(c) ? 'CALLBACK' : /cn|credit note|dispute|sample/i.test(c) ? 'DISPUTED' : 'CALLBACK';
const aoa = XLSX.utils.sheet_to_json(XLSX.readFile(file, { cellDates: true }).Sheets[XLSX.readFile(file).SheetNames[0]], { header: 1, defval: '' });
const dealers = await Dealer.find({}, 'name salesman').lean();
const byName = new Map(dealers.map(d => [normName(d.name), d]));
const rows = [];
for (const r of aoa.slice(1)) {
  const name = String(r[0] || '').trim(); if (!name) continue;
  const amount = Math.round(Number(r[1]) || 0), when = parseWhen(r[2]), remarks = [r[3], r[4]].map(x => String(x ?? '').trim()).filter(x => x && x !== '0');
  const d = byName.get(normName(name));
  const empty = !amount && !when && !remarks.length;
  rows.push({ name, amount, rawWhen: String(r[2] ?? ''), when, remarks: remarks.join(' · '), concern: String(r[4] ?? '').trim(), dealer: d, empty,
    kind: !d ? 'UNMATCHED' : empty ? 'EMPTY' : (amount > 0 && when) ? 'PROMISE' : (amount > 0 && !when) ? 'AMOUNT_NO_DATE' : 'NOTE' });
}
const by = {}; for (const x of rows) by[x.kind] = (by[x.kind] || 0) + 1;
console.log(`rows ${rows.length}`, JSON.stringify(by));
console.log('promise dates already past:', rows.filter(x => x.kind === 'PROMISE' && x.when < today).length, '· today or later:', rows.filter(x => x.kind === 'PROMISE' && x.when >= today).length);
console.log('promises Σ', rows.filter(x => x.kind === 'PROMISE').reduce((s, x) => s + x.amount, 0).toLocaleString('en-IN'), '· amount but no date Σ', rows.filter(x => x.kind === 'AMOUNT_NO_DATE').reduce((s, x) => s + x.amount, 0).toLocaleString('en-IN'));
console.log('date spellings:', JSON.stringify([...new Set(rows.map(x => x.rawWhen).filter(x => x && x !== '0'))].slice(0, 40)));
console.log('concerns:', JSON.stringify(Object.entries(rows.reduce((a, x) => { if (x.concern && x.concern !== '0') a[x.concern] = (a[x.concern] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 15)));
console.log('unmatched:', rows.filter(x => x.kind === 'UNMATCHED').map(x => x.name).slice(0, 30).join(' | '));
console.log('amount but no date:', rows.filter(x => x.kind === 'AMOUNT_NO_DATE').map(x => `${x.name} ₹${x.amount} "${x.rawWhen}"`).slice(0, 12).join(' | '));
if (dryRun) { console.log('DRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }
const byUser = get('--by') || 'admin'; let fu = 0, pr = 0;
for (const x of rows) {
  if (!x.dealer || x.empty) continue;
  const already = await ColFollowUp.exists({ dealerId: x.dealer._id, source: 'app', remarks: 'seed:' + file.split('/').pop() });
  if (already) continue;                                      // idempotent per file
  const input = { dealerId: x.dealer._id, date: x.kind === 'PROMISE' && x.when < today ? x.when : today, channel: 'OTHER', outcome: x.kind === 'PROMISE' || x.kind === 'AMOUNT_NO_DATE' ? 'PROMISED' : CONCERN_OUTCOME(x.concern),
    discussion: x.remarks || (x.amount ? `Amount expected ₹${x.amount.toLocaleString('en-IN')}` : ''), remarks: 'seed:' + file.split('/').pop(),
    nextFollowupDate: x.when || '', employeeId: x.dealer.salesman && x.dealer.salesman !== 'none' ? x.dealer.salesman : byUser };
  if (x.kind === 'PROMISE') input.promise = { amount: x.amount, date: x.when };
  if (x.kind === 'AMOUNT_NO_DATE') { input.outcome = 'CALLBACK'; }             // an amount with no date is a note, not a promise
  const r = await recordFollowup(input, { by: byUser }); fu++; if (r.promise) pr++;
}
console.log(`written: follow-ups ${fu}, promises ${pr}`);
await mongoose.disconnect();
