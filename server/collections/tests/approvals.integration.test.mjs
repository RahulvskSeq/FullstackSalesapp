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
import { recordFollowup } from '../services/followups.js';
import { listPendingApprovals, approveDecrease, dismissDecrease, pendingByDealer } from '../services/payments.js';

/** The morning statement shows less owed; accounts approves it as money (or not). The balance never moves twice. */
const DB = 'test_col_appr_' + Date.now();
const Dealer = () => mongoose.models.Dealer;
const user = { id: 'tester', name: 'Tester' };
const xlsx = aoa => XLSX.write({ SheetNames: ['S'], Sheets: { S: XLSX.utils.aoa_to_sheet(aoa) } }, { type: 'buffer', bookType: 'xlsx' });
let D1, D2, seq = 0;
async function statement(asOn, rows) {
  const aoa = [['Party Name', 'Aug', 'Sep'], ...rows.map(([name, code, a, b]) => [`${name}-${code}`, a, b])];
  const st = await stageFile({ buffer: xlsx(aoa), fileName: `appr-${++seq}-${asOn}.xlsx`, size: 1, user, asOn, balanceMode: 'snapshot' });
  return applyImport(st.import._id, { by: user.id });
}
before(async () => {
  process.env.COLLECTIONS_APPROVALS = '1';   // this suite covers the manual-approval mode
  await mongoose.connect(process.env.MONGO_URI, { dbName: DB });
  await mongoose.models.User.create({ id: 'sm1', name: 'Salesman One', pass: 'x', role: 'salesman' });
  D1 = await Dealer().create({ name: 'APPR ONE', code: 'SSL71001', salesman: 'sm1', status: 'ACTIVE' });
  D2 = await Dealer().create({ name: 'APPR TWO', code: 'SSL71002', salesman: 'sm1', status: 'ACTIVE' });
  await Promise.all([ColImport, ColImportRow, ColSnapshot, ColBalance, ColCycle, ColEvent, ColPayment, ColPromise, ColFollowUp].map(m => m.syncIndexes()));
});
after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

test('statement 1: both owe; a promise is taken on ONE', async () => {
  await statement('2026-09-12', [['APPR ONE', 'SSL71001', 90000, 100000], ['APPR TWO', 'SSL71002', 40000, 50000]]);
  assert.equal((await ColBalance.findOne({ dealerId: D1._id }).lean()).total, 100000);
  const r = await recordFollowup({ dealerId: D1._id, channel: 'CALL', outcome: 'PROMISED', promise: { amount: 60000, date: '2026-09-20' } }, { by: 'sm1' });
  assert.equal(r.promise.status, 'PENDING');
});

test('statement 2: ONE paid 40,000 (per Tally), TWO cleared — both become pending approvals, balances follow the sheet', async () => {
  await statement('2026-09-13', [['APPR ONE', 'SSL71001', 90000, 60000], ['APPR TWO', 'SSL71002', 40000, 0]]);
  const b1 = await ColBalance.findOne({ dealerId: D1._id }).lean(), b2 = await ColBalance.findOne({ dealerId: D2._id }).lean();
  assert.equal(b1.total, 60000); assert.equal(b2.total, 0); assert.equal(b2.status, 'CLEARED');
  const pend = await listPendingApprovals({});
  assert.equal(pend.total, 2); assert.equal(pend.sum, 90000);
  const byD = await pendingByDealer([String(D1._id), String(D2._id)]);
  assert.equal(byD.get(String(D1._id)).amount, 40000); assert.equal(byD.get(String(D2._id)).amount, 50000);
});

test('approve ONE: confirmed payment written from the statement, promise credited, balance NOT moved again', async () => {
  const ev = (await listPendingApprovals({})).items.find(e => String(e.dealerId) === String(D1._id));
  const p = await approveDecrease(ev._id, { by: 'accounts' });
  assert.equal(p.status, 'CONFIRMED'); assert.equal(p.source, 'statement'); assert.equal(p.amount, 40000); assert.equal(p.date, '2026-09-13');
  const b1 = await ColBalance.findOne({ dealerId: D1._id }).lean();
  assert.equal(b1.total, 60000, 'the statement already moved it; approval must not subtract again');
  const pr = await ColPromise.findOne({ dealerId: D1._id }).lean();
  assert.equal(pr.status, 'PARTIALLY_FULFILLED'); assert.equal(pr.received, 40000);
  assert.equal(b1.promise.amount, 20000, 'what is still promised');
  const cyc = await ColCycle.findOne({ dealerId: D1._id, status: 'OPEN' }).lean();
  assert.equal(cyc.paidTotal, 40000);
  const e2 = await ColEvent.findById(ev._id).lean();
  assert.equal(e2.meta.approved, true);
  assert.equal((await pendingByDealer([String(D1._id)])).get(String(D1._id)), undefined, 'nothing pending on ONE now');
  await assert.rejects(() => approveDecrease(ev._id, { by: 'accounts' }), /already decided/);
});

test('dismiss TWO as not a payment: no payment written, cleared stays cleared, nothing pending', async () => {
  const ev = (await listPendingApprovals({})).items.find(e => String(e.dealerId) === String(D2._id));
  await dismissDecrease(ev._id, { by: 'accounts', reason: 'credit note' });
  assert.equal(await ColPayment.countDocuments({ dealerId: D2._id }), 0);
  assert.equal((await ColBalance.findOne({ dealerId: D2._id }).lean()).status, 'CLEARED');
  assert.equal((await listPendingApprovals({})).total, 0);
});

test('statement 3: a decrease already covered by a confirmed payment needs no approval', async () => {
  await statement('2026-09-14', [['APPR ONE', 'SSL71001', 90000, 60000]]);   // unchanged
  assert.equal((await listPendingApprovals({})).total, 0);
});
