import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import '../../models/Dealer.js';
import '../../models/User.js';
import { ColImport, ColImportRow, ColSnapshot, ColBalance, ColCycle, ColEvent, ColInvoice, ColPayment, ColPromise, ColTask, ColFollowUp } from '../models/index.js';
import { stageFile } from '../engines/importEngine.js';
import { applyImport } from '../engines/reconcile.js';
import { tick, syncOwnership } from '../engines/automation.js';     // importing wires the hooks
import { recordPayment, confirmPayment, bouncePayment } from '../services/payments.js';
import { recordFollowup } from '../services/followups.js';
import { createTask } from '../services/tasks.js';

/**
 * Required tests 7–12 and the hand-over rule, on a scratch database with
 * synthetic dealers. Each scenario is one dealer so they cannot bleed into
 * each other.
 */
const DB = 'test_col_flow_' + Date.now();
const Dealer = () => mongoose.models.Dealer;
const user = { id: 'tester', name: 'Tester' };
const xlsx = aoa => XLSX.write({ SheetNames: ['S'], Sheets: { S: XLSX.utils.aoa_to_sheet(aoa) } }, { type: 'buffer', bookType: 'xlsx' });
const today = new Date().toISOString().slice(0, 10);
const CODES = { D1: 'SSL70001', D2: 'SSL70002', D3: 'SSL70003', D4: 'SSL70004', D5: 'SSL70005' };
const ids = {};
let seq = 0;
/** One statement with the given Aug/Sep buckets per dealer key; other dealers absent (unchanged). */
async function statement(asOn, rows) {
  const aoa = [['Party Name', 'Aug', 'Sep'], ...Object.entries(rows).map(([k, [a, b]]) => [`FLOW ${k}-${CODES[k]}`, a, b])];
  const st = await stageFile({ buffer: xlsx(aoa), fileName: `flow-${++seq}-${asOn}.xlsx`, size: 1, user, asOn });
  assert.equal(st.duplicate, false);
  return applyImport(st.import._id, { by: user.id });
}
const bal = k => ColBalance.findOne({ dealerId: ids[k] }).lean();

before(async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: DB });
  await mongoose.models.User.create([{ id: 'sm1', name: 'Salesman One', pass: 'x', role: 'salesman' }, { id: 'sm2', name: 'Salesman Two', pass: 'x', role: 'salesman' }]);
  for (const k of Object.keys(CODES)) { const d = await Dealer().create({ name: 'FLOW ' + k, code: CODES[k], salesman: 'sm1', status: 'ACTIVE' }); ids[k] = d._id; }
  await Promise.all([ColImport, ColImportRow, ColSnapshot, ColBalance, ColCycle, ColEvent, ColInvoice, ColPayment, ColPromise, ColTask].map(m => m.syncIndexes()));
});
after(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

test('opening statement: every dealer NEW, one open cycle each', async () => {
  const imp = await statement('2026-09-01', { D1: [50000, 0], D2: [40000, 0], D3: [25000, 0], D4: [10000, 15000], D5: [8000, 0] });
  assert.equal(imp.stats.new, 5);
  assert.equal(await ColCycle.countDocuments({ status: 'OPEN' }), 5);
});

test('test 9 — a payment confirmed here, then a statement showing the same decrease: explained, nothing to reconcile', async () => {
  const p = await recordPayment({ dealerId: ids.D1, date: '2026-09-10', amount: 20000, mode: 'NEFT', reference: 'UTR-9' }, { by: user.id });
  await confirmPayment(p._id, { by: 'accounts' });
  let b = await bal('D1');
  assert.equal(b.total, 30000, 'confirmed payment moves the balance');
  const imp = await statement('2026-09-13', { D1: [30000, 0] });
  assert.equal(imp.stats.decreased, 1);
  b = await bal('D1');
  assert.equal(b.total, 30000);
  const diff = await ColEvent.find({ dealerId: ids.D1, type: 'RECONCILIATION_DIFFERENCE' }).lean();
  assert.equal(diff.reduce((s, e) => s + Math.abs(e.amount || 0), 0), 0, 'decrease fully explained by the confirmed payment: ' + JSON.stringify(diff.map(e => e.amount)));
  assert.equal(await ColCycle.countDocuments({ dealerId: ids.D1 }), 1, 'same cycle');
});

test('test 10 — a promise past its date is broken by the sweep and a follow-up task appears', async () => {
  const r = await recordFollowup({ dealerId: ids.D2, date: '2026-09-01', channel: 'CALL', outcome: 'PROMISED', discussion: 'will pay', promise: { amount: 10000, date: '2026-09-05' } }, { by: 'sm1' });
  assert.equal(r.promise.status, 'PENDING');
  // Backfilled with a date already gone: the balance carries the promise but
  // the status is not PROMISED — that word is for a date still ahead.
  assert.equal((await bal('D2')).promise?.amount, 10000);
  assert.notEqual((await bal('D2')).status, 'PROMISED');
  const out = await tick();
  assert.ok(out.promisesBroken >= 1, JSON.stringify(out));
  const pr = await ColPromise.findById(r.promise._id).lean();
  assert.equal(pr.status, 'BROKEN');
  const task = await ColTask.findOne({ dealerId: ids.D2, promiseId: pr._id }).lean();
  assert.ok(task, 'task for the broken promise');
  assert.equal(task.type, 'PROMISE_FOLLOW_UP'); assert.equal(task.employeeId, 'sm1');
  const b = await bal('D2');
  assert.equal(b.brokenPromises, 1); assert.equal(b.status, 'FOLLOW_UP_REQUIRED');
  const again = await tick();
  assert.equal(await ColTask.countDocuments({ dealerId: ids.D2, promiseId: pr._id }), 1, 'the sweep never repeats itself');
});

test('test 11 — cleared by the statement: cycle CLEARED, open tasks cancelled', async () => {
  const t = await createTask({ dealerId: ids.D3, type: 'CALL', priority: 'HIGH', dueDate: today, description: 'chase' }, { by: 'sm1' });
  assert.equal(t.status, 'OPEN');
  const imp = await statement('2026-09-13', { D3: [0, 0] });
  assert.equal(imp.stats.cleared, 1);
  const b = await bal('D3');
  assert.equal(b.total, 0); assert.equal(b.status, 'CLEARED'); assert.equal(b.openCycleId, null);
  const c = await ColCycle.findOne({ dealerId: ids.D3, cycleNo: 1 }).lean();
  assert.equal(c.status, 'CLEARED');
  const t2 = await ColTask.findById(t._id).lean();
  assert.equal(t2.status, 'CANCELLED', 'the cleared rule closes the task');
});

test('test 12 — money again after clearance: REOPENED, cycle 2, cycle 1 untouched, a call task', async () => {
  const imp = await statement('2026-09-14', { D3: [0, 15000] });
  assert.equal(imp.stats.reopened, 1);
  const cycles = await ColCycle.find({ dealerId: ids.D3 }).sort({ cycleNo: 1 }).lean();
  assert.deepEqual(cycles.map(c => [c.cycleNo, c.status]), [[1, 'CLEARED'], [2, 'OPEN']]);
  const b = await bal('D3');
  assert.equal(b.total, 15000); assert.equal(String(b.openCycleId), String(cycles[1]._id));
  assert.ok(await ColEvent.exists({ dealerId: ids.D3, type: 'REOPENED' }));
  const call = await ColTask.findOne({ dealerId: ids.D3, type: 'CALL', status: 'OPEN', source: 'automation' }).lean();
  assert.ok(call, 'reopened rule creates a call task');
});

test('tests 7 & 8 — invoices and allocation: exact, refuses over-allocation, reverses on bounce', async () => {
  const [i1, i2] = await ColInvoice.create([
    { dealerId: ids.D4, billRef: 'INV-1', billDate: '2026-08-05', dueDate: '2026-09-04', period: '2026-08', amount: 10000, pending: 10000, source: 'test' },
    { dealerId: ids.D4, billRef: 'INV-2', billDate: '2026-09-02', dueDate: '2026-10-02', period: '2026-09', amount: 15000, pending: 15000, source: 'test' }]);
  await assert.rejects(() => recordPayment({ dealerId: ids.D4, date: today, amount: 12000, mode: 'CASH', allocations: [{ invoiceId: i1._id, amount: 11000 }] }, { by: 'sm1' }), /exceeds pending/);
  await assert.rejects(() => recordPayment({ dealerId: ids.D4, date: today, amount: 5000, mode: 'CASH', allocations: [{ invoiceId: i1._id, amount: 6000 }] }, { by: 'sm1' }), /exceed the payment/);
  const p = await recordPayment({ dealerId: ids.D4, date: today, amount: 12000, mode: 'CHEQUE', reference: 'CHQ-1', allocations: [{ invoiceId: i1._id, amount: 10000 }, { invoiceId: i2._id, amount: 2000 }] }, { by: 'sm1' });
  assert.equal(p.allocated, 12000); assert.equal(p.unallocated, 0);
  await confirmPayment(p._id, { by: 'accounts' });
  let [a, b] = await Promise.all([ColInvoice.findById(i1._id).lean(), ColInvoice.findById(i2._id).lean()]);
  assert.equal(a.status, 'SETTLED'); assert.equal(a.pending, 0);
  assert.equal(b.status, 'OPEN'); assert.equal(b.pending, 13000);
  assert.equal((await bal('D4')).total, 13000);
  await bouncePayment(p._id, { by: 'accounts', reason: 'returned' });
  [a, b] = await Promise.all([ColInvoice.findById(i1._id).lean(), ColInvoice.findById(i2._id).lean()]);
  assert.equal(a.status, 'OPEN'); assert.equal(a.pending, 10000); assert.equal(b.pending, 15000);
  assert.equal((await bal('D4')).total, 25000, 'bounce restores the balance exactly');
});

test('hand-over — the dealer moves to another salesman: balance scope and open work follow', async () => {
  const t = await createTask({ dealerId: ids.D5, type: 'VISIT', dueDate: today }, { by: 'sm1' });
  await Dealer().updateOne({ _id: ids.D5 }, { $set: { salesman: 'sm2' } });
  const out = await syncOwnership();
  assert.ok(out.balances >= 1, JSON.stringify(out));
  assert.equal((await bal('D5')).salesmanId, 'sm2');
  assert.equal((await ColTask.findById(t._id).lean()).employeeId, 'sm2');
  assert.deepEqual(await syncOwnership(), { dealers: 0, balances: 0, tasks: 0, promises: 0 }, 'nothing left to move');
});
