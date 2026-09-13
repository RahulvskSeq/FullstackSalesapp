import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import '../../models/Dealer.js';
import { ColImport, ColImportRow, ColSnapshot, ColBalance, ColCycle, ColEvent } from '../models/index.js';
import { stageFile, buildPreview, createDealerFromRow } from '../engines/importEngine.js';
import { applyImport } from '../engines/reconcile.js';

const DB = 'test_col_int_' + Date.now();
const Dealer = () => mongoose.models.Dealer;
const xlsx = aoa => XLSX.write({ SheetNames: ['S'], Sheets: { S: XLSX.utils.aoa_to_sheet(aoa) } }, { type: 'buffer', bookType: 'xlsx' });
const user = { id: 'tester', name: 'Tester' };
async function run(buffer, fileName, opts = {}) {
  const st = await stageFile({ buffer, fileName, size: buffer.length, user, ...opts });
  if (st.duplicate) return { duplicate: true, ...st };
  const preview = await buildPreview(st.import._id);
  const imp = await applyImport(st.import._id, { by: user.id });
  return { duplicate: false, imp, preview, staged: st };
}

before(async () => {
  await mongoose.connect(process.env.MONGO_URI);                   // live, read-only
  const dealers = await Dealer().find({}).lean();
  await mongoose.disconnect();
  await mongoose.connect(process.env.MONGO_URI, { dbName: DB });
  await Dealer().insertMany(dealers.map(({ _id, ...d }) => ({ ...d, _id })));
  await Promise.all([ColImport, ColImportRow, ColSnapshot, ColBalance, ColCycle, ColEvent].map(m => m.syncIndexes()));
  await Dealer().syncIndexes();
});
after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

test('the real ERP file: staged, unmapped resolved, applied, everything adds up', async () => {
  const buf = fs.readFileSync('/Users/rahulvsk/Downloads/Outstanding Till june.xlsx');
  const st = await stageFile({ buffer: buf, fileName: 'Outstanding Till june.xlsx', size: buf.length, user, asOn: '2026-07-04' });
  assert.equal(st.duplicate, false);
  const imp0 = st.import;
  assert.equal(imp0.status, 'VALIDATED');
  assert.deepEqual(imp0.periods, ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']);
  assert.equal(imp0.balanceModeDetected, 'buckets', JSON.stringify(st.detection));
  assert.equal(imp0.balanceMode, 'buckets');
  console.log('      staged:', JSON.stringify(imp0.stats), 'detection', JSON.stringify(st.detection));
  assert.equal(imp0.stats.rows, 380);
  assert.equal(imp0.stats.errors, 0);
  assert.equal(imp0.stats.duplicatesInFile, 0);
  assert.ok(imp0.stats.unmapped >= 370, 'the master knows almost none of these parties');

  // A person resolves the unmapped parties: they are new dealers.
  const un = await ColImportRow.find({ importId: imp0._id, status: 'UNMAPPED' }).lean();
  for (const r of un) await createDealerFromRow(imp0._id, r.rowNo, { salesman: 'none', by: user.id });
  const after0 = await ColImport.findById(imp0._id).lean();
  assert.equal(after0.stats.unmapped, 0);
  assert.equal(after0.stats.matched, 380);

  const pv = await buildPreview(imp0._id);
  assert.equal(pv.import.stats.new + pv.import.stats.unchanged, 380, 'first statement: every party is NEW or (if zero) UNCHANGED');
  const imp = await applyImport(imp0._id, { by: user.id });
  assert.equal(imp.status, 'APPLIED');
  console.log('      applied:', JSON.stringify(imp.stats), imp.durationMs + 'ms');

  const rows = await ColImportRow.find({ importId: imp._id, status: 'OK' }).lean();
  const expectTotal = rows.reduce((s, r) => s + r.total, 0);
  const balances = await ColBalance.find({}).lean();
  const gotTotal = balances.reduce((s, b) => s + b.total, 0);
  assert.equal(gotTotal, expectTotal, 'Σ balances = Σ statement rows (bucket mode: sum of columns)');
  assert.equal(await ColSnapshot.countDocuments({ importId: imp._id }), 380);
  assert.equal(await ColCycle.countDocuments({ status: 'OPEN' }), balances.filter(b => b.total > 0).length, 'one open cycle per dealer that owes');
  assert.equal(await ColCycle.countDocuments({ status: 'OPEN' }), await ColEvent.countDocuments({ importId: imp._id, type: 'NEW_OUTSTANDING' }));
  const casa = await ColBalance.findOne({ dealerCode: 'SSL14140' }).lean();
  assert.equal(casa.total, 16500, 'CASA LUSSO: Jan 16,000 + Jun 500');
  assert.equal(casa.oldestPeriod, '2026-01');
  assert.ok(casa.ageDays > 150 && casa.ageDays < 190, 'ageing from the oldest bucket, ' + casa.ageDays);
  const bound = await Dealer().countDocuments({ code: { $regex: /^SSL\d+$/ } });
  assert.ok(bound >= 369, 'codes bound onto the master: ' + bound);
});

test('edge 1 — the same file again is a DUPLICATE and writes nothing', async () => {
  const buf = fs.readFileSync('/Users/rahulvsk/Downloads/Outstanding Till june.xlsx');
  const snaps = await ColSnapshot.countDocuments();
  const r = await run(buf, 'Outstanding Till june.xlsx', { asOn: '2026-07-04' });
  assert.equal(r.duplicate, true);
  assert.equal(r.import.status, 'DUPLICATE');
  assert.equal(await ColSnapshot.countDocuments(), snaps);
});

test('edges 2–4 — decrease is not a payment; zero clears the cycle; new money opens cycle 2, cycle 1 stays closed', async () => {
  await Dealer().create({ name: 'ZZ TEST CO', code: 'SSL99901', salesman: 'rakesh', status: 'ACTIVE' });
  const H = ['Party Name', 'Jun', 'Jul'];
  await run(xlsx([H, ['ZZ TEST CO-SSL99901', 100000, 0]]), 'a.xlsx', { asOn: '2026-07-05' });
  let b = await ColBalance.findOne({ dealerCode: 'SSL99901' }).lean();
  assert.equal(b.total, 100000); assert.equal(b.status, 'NEW');
  const c1 = await ColCycle.findOne({ dealerId: b.dealerId, cycleNo: 1 }).lean();
  assert.equal(c1.status, 'OPEN'); assert.equal(c1.openingTotal, 100000);

  const r2 = await run(xlsx([H, ['ZZ TEST CO-SSL99901', 70000, 0]]), 'b.xlsx', { asOn: '2026-07-12' });
  assert.equal(r2.imp.stats.decreased, 1);
  b = await ColBalance.findOne({ dealerCode: 'SSL99901' }).lean();
  assert.equal(b.total, 70000);
  const dec = await ColEvent.findOne({ dealerId: b.dealerId, type: 'DECREASED' }).lean();
  assert.equal(dec.amount, 30000); assert.equal(dec.cause, 'UNKNOWN');
  assert.equal(await ColEvent.countDocuments({ dealerId: b.dealerId, type: /PAYMENT/ }), 0, 'no payment was invented');

  const r3 = await run(xlsx([H, ['ZZ TEST CO-SSL99901', 0, 0]]), 'c.xlsx', { asOn: '2026-07-19' });
  assert.equal(r3.imp.stats.cleared, 1);
  b = await ColBalance.findOne({ dealerCode: 'SSL99901' }).lean();
  assert.equal(b.total, 0); assert.equal(b.status, 'CLEARED'); assert.equal(b.openCycleId, null);
  const c1c = await ColCycle.findOne({ dealerId: b.dealerId, cycleNo: 1 }).lean();
  assert.equal(c1c.status, 'CLEARED'); assert.equal(c1c.finalTotal, 0); assert.equal(c1c.observedDecreaseTotal, 30000);

  const r4 = await run(xlsx([H, ['ZZ TEST CO-SSL99901', 0, 50000]]), 'd.xlsx', { asOn: '2026-07-26' });
  assert.equal(r4.imp.stats.reopened, 1);
  b = await ColBalance.findOne({ dealerCode: 'SSL99901' }).lean();
  assert.equal(b.total, 50000);
  const c2 = await ColCycle.findOne({ dealerId: b.dealerId, cycleNo: 2 }).lean();
  assert.equal(c2.status, 'OPEN'); assert.equal(c2.openingTotal, 50000);
  const c1again = await ColCycle.findOne({ dealerId: b.dealerId, cycleNo: 1 }).lean();
  assert.equal(c1again.status, 'CLEARED', 'cycle 1 did not reopen');
  assert.equal(String(b.openCycleId), String(c2._id));
  assert.equal(await ColEvent.countDocuments({ dealerId: b.dealerId, type: 'REOPENED' }), 1);
});

test('edge 5 — a month that drops out of the file stays in history', async () => {
  const b = await ColBalance.findOne({ dealerCode: 'SSL99901' }).lean();
  assert.deepEqual(Object.keys(b.buckets).filter(k => b.buckets[k] > 0), ['2026-07'], 'current buckets follow the latest file');
  const withJune = await ColSnapshot.find({ dealerId: b.dealerId, 'buckets.2026-06': { $gt: 0 } }).lean();
  assert.ok(withJune.length >= 2, 'June figures still readable from earlier statements: ' + withJune.length);
  assert.equal(await ColSnapshot.countDocuments({ dealerId: b.dealerId }), 4, 'every statement retained');
});

test('older statement is recorded but never moves the current figure', async () => {
  const H = ['Party Name', 'Jun', 'Jul'];
  const r = await run(xlsx([H, ['ZZ TEST CO-SSL99901', 999, 0]]), 'late-arrival.xlsx', { asOn: '2026-07-01' });
  assert.equal(r.imp.status, 'APPLIED');
  const b = await ColBalance.findOne({ dealerCode: 'SSL99901' }).lean();
  assert.equal(b.total, 50000, 'current still the 26 Jul figure');
  assert.equal(b.lastSnapshotAsOn, '2026-07-26');
  assert.equal(await ColSnapshot.countDocuments({ dealerId: b.dealerId, asOn: '2026-07-01' }), 1, 'but the statement is on record');
});

test('edge 6 — name changes, code same: same dealer, alias learned, nothing unmapped', async () => {
  const H = ['Party Name', 'Jul'];
  const r = await run(xlsx([H, ['ZZ TEST COMPANY LTD-SSL99901', 50000]]), 'renamed.xlsx', { asOn: '2026-08-02' });
  assert.equal(r.imp.stats.unmapped, 0);
  const row = await ColImportRow.findOne({ importId: r.imp._id }).lean();
  assert.equal(row.matchMethod, 'code');
  const d = await Dealer().findOne({ code: 'SSL99901' }).lean();
  assert.equal(d.name, 'ZZ TEST CO', 'master name untouched');
  assert.ok(d.aliases.includes('ZZ TEST COMPANY LTD'), 'new spelling kept as an alias');
  assert.equal(await ColBalance.countDocuments({ dealerCode: 'SSL99901' }), 1, 'still one dealer');
});

test('edge 13 — invalid files are refused with a reason; a bad cell fails its row only', async () => {
  await assert.rejects(() => stageFile({ buffer: xlsx([['Dealer', 'Salesman', 'Total'], ['X', 'Y', 5]]), fileName: 'nomonths.xlsx', size: 1, user }), /No month columns/);
  await assert.rejects(() => stageFile({ buffer: xlsx([['Party', 'Jun-26', 'June 2026'], ['X', 1, 2]]), fileName: 'dupcol.xlsx', size: 1, user, asOn: '2026-07-01' }), /same month/);
  const st = await stageFile({ buffer: xlsx([['Party Name', 'Jul'], ['ZZ TEST CO-SSL99901', 'abc'], ['ZZ OTHER-SSL99902', 10]]), fileName: 'badcell.xlsx', size: 1, user, asOn: '2026-08-09' });
  assert.equal(st.import.stats.errors, 1);
  assert.match(st.import.errorReport[0].message, /not an amount/);
  const rows = await ColImportRow.find({ importId: st.import._id }).sort({ rowNo: 1 }).lean();
  assert.equal(rows[0].status, 'ERROR');
  assert.equal(rows[1].status, 'UNMAPPED');
});

test('edge 14 — failure mid-apply leaves completed chunks intact; resume finishes with no duplicates', async () => {
  const N = 1200;
  const aoa = [['Party Name', 'Aug']];
  const dealers = [];
  for (let i = 1; i <= N; i++) { const code = 'SSL8' + String(i).padStart(4, '0'); dealers.push({ name: 'ZZ BULK ' + i, code, salesman: 'none', status: 'ACTIVE' }); aoa.push([`ZZ BULK ${i}-${code}`, 100 + i]); }
  await Dealer().insertMany(dealers);
  const st = await stageFile({ buffer: xlsx(aoa), fileName: 'bulk.xlsx', size: 1, user, asOn: '2026-09-01' });
  assert.equal(st.import.stats.matched, N);

  // Break the second chunk: from the second bulk snapshot write on, the process is "dead".
  const realInsert = ColSnapshot.insertMany.bind(ColSnapshot);
  let calls = 0;
  ColSnapshot.insertMany = async (...a) => { if (++calls >= 2) throw new Error('simulated crash'); return realInsert(...a); };
  await assert.rejects(() => applyImport(st.import._id, { by: user.id }), /simulated crash/);
  ColSnapshot.insertMany = realInsert;
  const failed = await ColImport.findById(st.import._id).lean();
  assert.equal(failed.status, 'FAILED');
  assert.deepEqual(failed.appliedChunks, [0], 'chunk 1 recorded, chunk 2 not');
  const partial = await ColSnapshot.countDocuments({ importId: st.import._id });
  assert.ok(partial === 500 || (partial >= 500 && partial < 700), 'chunk 1 complete, chunk 2 rolled back or partial-but-idempotent: ' + partial);

  const done = await applyImport(st.import._id, { by: user.id });
  assert.equal(done.status, 'APPLIED');
  assert.deepEqual(done.appliedChunks.sort(), [0, 1, 2]);
  assert.equal(await ColSnapshot.countDocuments({ importId: st.import._id }), N, 'exactly one snapshot per row');
  assert.equal(await ColCycle.countDocuments({ dealerId: { $in: (await Dealer().find({ name: /^ZZ BULK/ }, '_id').lean()).map(d => d._id) } }), N, 'exactly one cycle per dealer');
  assert.equal(done.stats.new, N);
});
