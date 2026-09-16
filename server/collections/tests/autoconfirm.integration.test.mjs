import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import '../../models/Dealer.js';
import '../../models/User.js';
import { ColImport, ColImportRow, ColSnapshot, ColBalance, ColCycle, ColEvent, ColPayment, ColPromise, ColFollowUp } from '../models/index.js';
import { stageFile } from '../engines/importEngine.js';
import { applyImport } from '../engines/reconcile.js';
import '../engines/automation.js';
import { recordPayment, listPendingApprovals } from '../services/payments.js';
import { recordFollowup } from '../services/followups.js';

/** The sheet is the proof: a recorded payment the statement can account for confirms itself. */
const DB = 'test_col_auto_' + Date.now();
const Dealer = () => mongoose.models.Dealer;
const user = { id: 'tester', name: 'Tester' };
const xlsx = aoa => XLSX.write({ SheetNames: ['S'], Sheets: { S: XLSX.utils.aoa_to_sheet(aoa) } }, { type: 'buffer', bookType: 'xlsx' });
let A, B, C, seq = 0;
async function statement(asOn, rows) {
  const aoa = [['Party Name', 'Aug', 'Sep'], ...rows.map(([name, code, a, b]) => [`${name}-${code}`, a, b])];
  const st = await stageFile({ buffer: xlsx(aoa), fileName: `auto-${++seq}-${asOn}.xlsx`, size: 1, user, asOn, balanceMode: 'snapshot' });
  const imp = await applyImport(st.import._id, { by: user.id });
  await new Promise(r => setTimeout(r, 1500));      // the hook runs after apply returns
  return imp;
}
const bal = id => ColBalance.findOne({ dealerId: id }).lean();
before(async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: DB });
  await mongoose.models.User.create({ id: 'sm1', name: 'Salesman One', pass: 'x', role: 'salesman' });
  A = await Dealer().create({ name: 'AUTO A', code: 'SSL72001', salesman: 'sm1', status: 'ACTIVE' });
  B = await Dealer().create({ name: 'AUTO B', code: 'SSL72002', salesman: 'sm1', status: 'ACTIVE' });
  C = await Dealer().create({ name: 'AUTO C', code: 'SSL72003', salesman: 'sm1', status: 'ACTIVE' });
  await Promise.all([ColImport, ColImportRow, ColSnapshot, ColBalance, ColCycle, ColEvent, ColPayment, ColPromise, ColFollowUp].map(m => m.syncIndexes()));
  await statement('2026-09-12', [['AUTO A', 'SSL72001', 5000, 5000], ['AUTO B', 'SSL72002', 5000, 5000], ['AUTO C', 'SSL72003', 5000, 5000]]);
});
after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

test('A: recorded 3,000 then the sheet shows 2,000 → confirmed by itself, nothing pending', async () => {
  await recordFollowup({ dealerId: A._id, channel: 'CALL', outcome: 'PROMISED', promise: { amount: 3000, date: '2026-09-20' } }, { by: 'sm1' });
  const p = await recordPayment({ dealerId: A._id, date: '2026-09-13', amount: 3000, mode: 'UPI', reference: 'UTR-A' }, { by: 'sm1' });
  assert.equal(p.status, 'RECORDED');
  await statement('2026-09-15', [['AUTO A', 'SSL72001', 5000, 2000], ['AUTO B', 'SSL72002', 5000, 0], ['AUTO C', 'SSL72003', 5000, 1000]]);
  const p2 = await ColPayment.findById(p._id).lean();
  assert.equal(p2.status, 'CONFIRMED', 'the statement proved it'); assert.match(p2.remarks, /auto-confirmed/);
  assert.equal((await bal(A._id)).total, 2000, 'balance is the sheet figure, not reduced twice');
  assert.equal((await ColPromise.findOne({ dealerId: A._id }).lean()).status, 'FULFILLED', 'promise kept');
  const pend = (await listPendingApprovals({})).items.filter(e => String(e.dealerId) === String(A._id));
  assert.equal(pend.length, 0, 'nothing left for accounts on A');
});

test('B: sheet dropped 5,000 (written as collected), then the salesman records 3,000 → his record is confirmed and takes over 3,000 of it', async () => {
  // B's payment was recorded before the 15-Sep statement in the same setup step below; here we assert the split
  const pB = await recordPayment({ dealerId: B._id, date: '2026-09-14', amount: 3000, mode: 'CASH' }, { by: 'sm1' });
  // recording after the statement already showed the drop confirms it straight away
  assert.equal(pB.status, 'CONFIRMED', 'confirmed on record: the 15-Sep statement had already written the 5,000 as collected');
  const fromSheet = await ColPayment.find({ dealerId: B._id, source: 'statement' }).lean();
  assert.equal(fromSheet.reduce((a, x) => a + x.amount, 0), 2000, 'the statement payment shrinks by the 3,000 the salesman recorded — counted once');
  const total = await ColPayment.aggregate([{ $match: { dealerId: B._id, status: 'CONFIRMED' } }, { $group: { _id: null, s: { $sum: '$amount' } } }]);
  assert.equal(total[0].s, 5000, 'collected on B is exactly what the sheet dropped');
  assert.equal((await bal(B._id)).status, 'CLEARED');
});

test('C: recorded 6,000 but the sheet dropped only 4,000 → cannot be proved, stays recorded; the 4,000 waits', async () => {
  const pC = await recordPayment({ dealerId: C._id, date: '2026-09-14', amount: 6000, mode: 'CHEQUE' }, { by: 'sm1' });
  assert.equal(pC.status, 'RECORDED', 'a payment bigger than the drop is not confirmed by it — it waits for a sheet that shows it');
  const fromSheet = await ColPayment.findOne({ dealerId: C._id, source: 'statement' }).lean();
  assert.equal(fromSheet.amount, 4000, 'the 4,000 the sheet shows is collected regardless');
});

test('D: promised 3,000, nothing recorded, sheet shows the drop → promise kept, payment written, nothing pending', async () => {
  const D = await Dealer().create({ name: 'AUTO D', code: 'SSL72004', salesman: 'sm1', status: 'ACTIVE' });
  const E = await Dealer().create({ name: 'AUTO E', code: 'SSL72005', salesman: 'sm1', status: 'ACTIVE' });
  await statement('2026-09-16', [['AUTO D', 'SSL72004', 8000, 8000], ['AUTO E', 'SSL72005', 8000, 8000]]);
  await recordFollowup({ dealerId: D._id, channel: 'CALL', outcome: 'PROMISED', promise: { amount: 3000, date: '2026-09-17' } }, { by: 'sm1' });
  await recordFollowup({ dealerId: E._id, channel: 'CALL', outcome: 'PROMISED', promise: { amount: 3000, date: '2026-09-17' } }, { by: 'sm1' });
  await statement('2026-09-17', [['AUTO D', 'SSL72004', 8000, 5000], ['AUTO E', 'SSL72005', 8000, 6000]]);
  const prD = await ColPromise.findOne({ dealerId: D._id }).lean();
  assert.equal(prD.status, 'FULFILLED', 'D promised 3,000 and the sheet dropped 3,000');
  const payD = await ColPayment.findOne({ dealerId: D._id }).lean();
  assert.equal(payD.status, 'CONFIRMED'); assert.equal(payD.amount, 3000); assert.equal(payD.source, 'statement');
  assert.equal((await listPendingApprovals({})).items.filter(e => String(e.dealerId) === String(D._id)).length, 0);
  // E promised 3,000 but only 2,000 went out: the 2,000 is still money — recorded from the statement and credited to the promise
  const prE = await ColPromise.findOne({ dealerId: E._id }).lean();
  assert.equal(prE.status, 'PARTIALLY_FULFILLED', 'the 2,000 that came is credited to the promise');
  assert.equal((await ColPayment.findOne({ dealerId: E._id, source: 'statement' }).lean()).amount, 2000);
  assert.equal((await listPendingApprovals({})).items.filter(e => String(e.dealerId) === String(E._id)).length, 0);
});

test('C again: the next sheet clears the last 1,000 → 5,000 came in total; the 6,000 record shows 5,000 came so far and stays pending', async () => {
  const { listPayments } = await import('../services/payments.js');
  const before = (await listPayments({ dealerId: C._id, status: 'RECORDED' })).items[0];
  assert.equal(before.cameSoFar, 4000, 'the pending entry shows how much has come so far');
  await statement('2026-09-18', [['AUTO C', 'SSL72003', 5000, 0]]);     // the last 1,000 goes too
  const pC = await ColPayment.findOne({ dealerId: C._id, mode: 'CHEQUE' }).lean();
  const stmt = await ColPayment.find({ dealerId: C._id, source: 'statement' }).lean();
  const collected = await ColPayment.aggregate([{ $match: { dealerId: C._id, status: 'CONFIRMED' } }, { $group: { _id: null, s: { $sum: '$amount' } } }]);
  // C owed 5,000; the sheets showed 4,000 then 1,000 → 5,000 came in total. The 6,000 record is more than ever came, so it cannot be confirmed; what came is collected.
  assert.equal(collected[0].s, 5000, 'collected equals what the sheets showed');
  assert.equal(pC.status, 'RECORDED');
  assert.equal((await listPayments({ dealerId: C._id, status: 'RECORDED' })).items[0].cameSoFar, 5000, '5,000 of the 6,000 told has come');
});
