// Remove the false money booked by the 26 Sep "absent = paid" clearing for the 31 dealers the 28 Sep
// statement shows are still outstanding. The 28th has already reopened their balances, so only the
// money side is wrong now: 39 statement payments, their events, and 8 promises marked kept.
// Uses ~/Downloads/absent-26sep-backup-2026-09-26.json. DRY=1 prints only.
import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import './models/Dealer.js';
import { ColImport, ColBalance, ColCycle, ColEvent, ColPayment, ColPromise } from './collections/models/index.js';
import { refreshBalance } from './collections/engines/reconcile.js';
const DRY = process.env.DRY === '1';
await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const bk = JSON.parse(fs.readFileSync(process.env.HOME + '/Downloads/absent-26sep-backup-2026-09-26.json'));
const back = new Set(JSON.parse(fs.readFileSync('/private/tmp/claude-501/-Users-rahulvsk-Desktop-Claude-Software-fixed-project/978197b3-cac0-49ed-a584-35dc81003547/scratchpad/back28.json')).map(norm));
const targets = bk.balances.filter(b => back.has(norm(b.dealerName)));
const ids = targets.map(b => new mongoose.Types.ObjectId(b.dealerId));
const imp26 = await ColImport.findOne({ asOn: '2026-09-26', status: 'APPLIED' });
const T0 = new Date('2026-09-26T08:00:00Z'), T1 = new Date('2026-09-26T09:00:00Z');   // the clearing ran in this window
const stmtPays = await ColPayment.find({ dealerId: { $in: ids }, source: 'statement', date: '2026-09-25', createdAt: { $gte: T0, $lte: T1 } }).lean();
const payEvents = await ColEvent.find({ dealerId: { $in: ids }, type: { $in: ['PAYMENT_CONFIRMED', 'PROMISE_KEPT'] }, at: { $gte: T0, $lte: T1 } }).lean();
const promises = await ColPromise.find({ dealerId: { $in: ids }, fulfilledAt: { $gte: T0, $lte: T1 } }).lean();
const clrEvents = await ColEvent.find({ importId: imp26._id, dealerId: { $in: ids }, type: { $in: ['CLEARED', 'RECONCILIATION_DIFFERENCE'] } }).lean();
const oldCycles = await ColCycle.find({ dealerId: { $in: ids }, closedByImportId: imp26._id }).lean();
const amount = stmtPays.reduce((a, p) => a + p.amount, 0);
console.log(DRY ? 'DRY RUN' : 'LIVE', '· dealers:', targets.length, '| false statement payments:', stmtPays.length, '₹' + amount, '| payment events:', payEvents.length, '| promises marked kept:', promises.length, '| 26 Sep clearing events to mark:', clrEvents.length, '| cycles closed by it:', oldCycles.length);
if (DRY) { await mongoose.disconnect(); process.exit(0); }

fs.writeFileSync(process.env.HOME + '/Downloads/undo-26sep-before-2026-09-28.json', JSON.stringify({ stmtPays, payEvents, promises, clrEvents, oldCycles }, null, 1));
await ColPayment.deleteMany({ _id: { $in: stmtPays.map(p => p._id) } });
await ColEvent.deleteMany({ _id: { $in: payEvents.map(e => e._id) } });
for (const pr of promises) await ColPromise.updateOne({ _id: pr._id }, { $set: { status: pr.promiseDate < '2026-09-28' ? 'BROKEN' : 'PENDING', received: 0, fulfilledAt: null } });
// the cycles the clearing closed take back the money it credited; the history keeps the event, marked as a Tally gap
for (const c of oldCycles) { const paid = stmtPays.filter(p => String(p.cycleId) === String(c._id)).reduce((a, p) => a + p.amount, 0); if (paid) await ColCycle.updateOne({ _id: c._id }, { $inc: { paidTotal: -paid } }); }
await ColEvent.updateMany({ _id: { $in: clrEvents.map(e => e._id) } }, { $set: { 'meta.reversed': true, 'meta.reversedNote': 'Tally export gap on 26 Sep — the dealer had not paid; the 28 Sep statement showed the balance again', 'meta.autoConfirmed': [] } });
for (const id of ids) await refreshBalance(id);
const st = imp26.stats || {};
imp26.stats = { ...st, absentReversed: targets.length, absentReversedAmount: amount };
imp26.markModified('stats'); await imp26.save();
console.log('false money left on them:', await ColPayment.countDocuments({ dealerId: { $in: ids }, source: 'statement', date: '2026-09-25', status: 'CONFIRMED' }));
console.log('their balances:', (await ColBalance.find({ dealerId: { $in: ids } }, 'total').lean()).filter(b => b.total > 0).length, 'of', targets.length, 'owing');
await mongoose.disconnect(); process.exit(0);
