import { collectionMonthOf } from '../engines/reconcile.js';
import express from 'express';
import { protect } from '../../middleware/auth.js';
import { ColTask, ColPromise, ColBalance, ColPayment, ColEvent, ColImport } from '../models/index.js';
import { createTask, completeTask, cancelTask, addComment, listTasks } from '../services/tasks.js';
import { withScope, ensureInScope, paging, fail, scopeFilter, isStaff } from '../lib/http.js';
import { todayYmd } from '../lib/periods.js';
import { pendingByDealer } from '../services/payments.js';

const router = express.Router();
router.use(protect, withScope);

router.post('/', async (req, res) => {
  try {
    if (!ensureInScope(req, res, req.body?.dealerId)) return;
    const employeeId = isStaff(req) ? String(req.body?.employeeId || '') : req.user.id;    // a salesman can only assign to themselves
    res.status(201).json(await createTask({ ...req.body, employeeId }, { by: req.user.id }));
  } catch (e) { fail(res, e); }
});
router.get('/', async (req, res) => {
  try {
    const f = { ...scopeFilter(req.scope) };
    if (!isStaff(req)) f.employeeId = req.user.id;
    else if (req.query.employeeId) f.employeeId = String(req.query.employeeId);
    if (req.query.dealerId) { if (!ensureInScope(req, res, req.query.dealerId)) return; f.dealerId = req.query.dealerId; }
    if (req.query.status) f.status = { $in: String(req.query.status).split(',') };
    if (req.query.due === 'today') f.dueDate = todayYmd(); else if (req.query.due === 'overdue') { f.dueDate = { $lt: todayYmd() }; f.status = { $in: ['OPEN', 'IN_PROGRESS'] }; }
    res.json(await listTasks(f, paging(req.query)));
  } catch (e) { fail(res, e); }
});

/** "What do I need to do today?" — one call, one screen. */
router.get('/today', async (req, res) => {
  try {
    const today = todayYmd();
    const me = isStaff(req) && req.query.employeeId ? String(req.query.employeeId) : req.user.id;
    const sf = scopeFilter(req.scope);
    const mine = isStaff(req) && !req.query.employeeId ? {} : { employeeId: me };
    const since = new Date(Date.now() - 7 * 86400000);
    const [tasksToday, tasksOverdue, followupsDue, followupsOverdue, promisesToday, promisesBroken, highPriority, recentPayments, newOutstanding, recentlyCleared, overdueBalances] = await Promise.all([
      ColTask.find({ ...sf, ...mine, status: { $in: ['OPEN', 'IN_PROGRESS'] }, dueDate: today }).sort({ priority: -1 }).limit(100).lean(),
      ColTask.find({ ...sf, ...mine, status: { $in: ['OPEN', 'IN_PROGRESS'] }, dueDate: { $lt: today } }).sort({ dueDate: 1 }).limit(100).lean(),
      ColBalance.find({ ...sf, ...(mine.employeeId ? { salesmanId: mine.employeeId } : {}), nextFollowupAt: today, total: { $gt: 0 } }).sort({ total: -1 }).limit(100).lean(),
      ColBalance.find({ ...sf, ...(mine.employeeId ? { salesmanId: mine.employeeId } : {}), nextFollowupAt: { $gt: '', $lt: today }, total: { $gt: 0 } }).sort({ nextFollowupAt: 1 }).limit(100).lean(),
      ColPromise.find({ ...sf, ...mine, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] }, promiseDate: today }).limit(100).lean(),
      ColPromise.find({ ...sf, ...mine, status: 'BROKEN' }).sort({ promiseDate: 1 }).limit(100).lean(),
      ColBalance.find({ ...sf, ...(mine.employeeId ? { salesmanId: mine.employeeId } : {}), priority: { $in: ['HIGH', 'CRITICAL'] }, total: { $gt: 0 } }).sort({ total: -1 }).limit(50).lean(),
      // what came in over the last week — every confirmed payment, statement-seen or recorded-then-confirmed
      ColPayment.find({ ...sf, ...(mine.employeeId ? { salesmanId: mine.employeeId } : {}), status: 'CONFIRMED', $or: [{ confirmedAt: { $gte: since } }, { date: { $gte: since.toISOString().slice(0, 10) } }] }).sort({ date: -1, confirmedAt: -1 }).limit(150).lean(),
      ColEvent.find({ ...sf, type: { $in: ['NEW_OUTSTANDING', 'REOPENED'] }, at: { $gte: since } }).sort({ at: -1 }).limit(20).lean(),
      ColEvent.find({ ...sf, type: 'CLEARED', at: { $gte: since } }).sort({ at: -1 }).limit(20).lean(),
      // oldest unpaid month older than the dealer's credit days (or the default)
      ColBalance.find({ ...sf, ...(mine.employeeId ? { salesmanId: mine.employeeId } : {}), overdue: true, total: { $gt: 0 } }).sort({ dueAmount: -1, total: -1 }).limit(100).lean(),
    ]);
    const Dealer = (await import('mongoose')).default.models.Dealer;
    const ids = [...new Set([...tasksToday, ...tasksOverdue, ...promisesToday, ...promisesBroken, ...followupsDue, ...followupsOverdue, ...highPriority, ...recentPayments, ...newOutstanding, ...recentlyCleared, ...overdueBalances].map(t => String(t.dealerId)))];
    const names = new Map((await Dealer.find({ _id: { $in: ids } }, 'name code phone').lean()).map(d => [String(d._id), d]));
    // Month buckets travel with every dealer row (tasks and promises included), so each list can show the same columns as Outstanding.
    const balById = new Map((await ColBalance.find({ dealerId: { $in: ids } }, 'dealerId buckets total status priority nextFollowupAt ageDays oldestPeriod creditDays overdue dueAmount lastPaymentAt lastPaymentAmount').lean()).map(b => [String(b.dealerId), b]));
    const asObj = b => b instanceof Map ? Object.fromEntries(b) : (b && typeof b === 'object' ? b : {});
    const pend = await pendingByDealer(ids);
    const named = a => a.map(t => { const b = balById.get(String(t.dealerId)); return { ...t, pendingApproval: pend.get(String(t.dealerId))?.amount || 0, pendingRecorded: pend.get(String(t.dealerId))?.recorded || 0, balStatus: b?.status, balPriority: b?.priority, balNextFollowupAt: b?.nextFollowupAt || '', balAgeDays: b?.ageDays ?? null, balOldestPeriod: b?.oldestPeriod || '', balOverdue: !!b?.overdue, balDueAmount: b?.dueAmount || 0, balCreditDays: b?.creditDays || 0, balLastPaymentAt: b?.lastPaymentAt || null, balLastPaymentAmount: b?.lastPaymentAmount || 0, came30: pend.get(String(t.dealerId))?.came30 || 0, came30Count: pend.get(String(t.dealerId))?.came30Count || 0, buckets: asObj(t.buckets && Object.keys(asObj(t.buckets)).length ? t.buckets : b?.buckets), balanceTotal: b?.total ?? t.total, dealerName: t.dealerName || names.get(String(t.dealerId))?.name || '', dealerCode: t.dealerCode || names.get(String(t.dealerId))?.code || '', phone: names.get(String(t.dealerId))?.phone || '' }; });
    // The banner counts everything waiting for accounts in scope: statement decreases to approve and payments recorded by salesmen to confirm.
    const [decAll, recAll] = await Promise.all([
      ColEvent.aggregate([{ $match: { ...sf, type: 'RECONCILIATION_DIFFERENCE', amount: { $gt: 0 }, 'meta.approved': { $exists: false } } }, { $group: { _id: null, sum: { $sum: '$amount' }, n: { $sum: 1 } } }]),
      ColPayment.aggregate([{ $match: { ...sf, status: 'RECORDED' } }, { $group: { _id: null, sum: { $sum: '$amount' }, n: { $sum: 1 } } }])]);
    const pendAll = { sum: (decAll[0]?.sum || 0) + (recAll[0]?.sum || 0), n: (decAll[0]?.n || 0) + (recAll[0]?.n || 0), decreases: decAll[0]?.n || 0, recorded: recAll[0]?.n || 0 };
    // Payments the latest statement brought in (auto-confirmed or written from the statement) — what every salesman wants to see first.
    const latest = await ColImport.findOne({ status: 'APPLIED' }, 'asOn fileName').sort({ asOn: -1, appliedAt: -1 }).lean();
    const came = latest ? await ColPayment.find({ ...sf, ...(mine.employeeId ? { salesmanId: mine.employeeId } : {}), status: 'CONFIRMED', $or: [{ source: 'statement', date: latest.asOn }, { confirmedBy: 'statement', remarks: new RegExp('statement of ' + latest.asOn) }] }).sort({ amount: -1 }).limit(200).lean() : [];
    const cameIds = [...new Set(came.map(p => String(p.dealerId)))].filter(i => !names.has(i));
    for (const d of await Dealer.find({ _id: { $in: cameIds } }, 'name code phone').lean()) names.set(String(d._id), d);
    const collectionMonth = await collectionMonthOf();
    res.json({ today, collectionMonth, employeeId: me, latestStatement: latest ? { asOn: latest.asOn, fileName: latest.fileName } : null, paymentsCame: named(came), paymentsCameSum: came.reduce((a, p) => a + p.amount, 0),
      pendingApprovals: pendAll.sum, pendingApprovalsCount: pendAll.n, pendingDecreases: pendAll.decreases, pendingRecorded: pendAll.recorded, tasksToday: named(tasksToday), tasksOverdue: named(tasksOverdue), followupsDue, followupsOverdue, promisesToday: named(promisesToday).filter(p => (p.balanceTotal ?? 1) > 0), promisesBroken: named(promisesBroken).filter(p => (p.balanceTotal ?? 1) > 0), followupsDue: named(followupsDue), followupsOverdue: named(followupsOverdue), highPriority: named(highPriority), overdue: named(overdueBalances), recentPayments: named(recentPayments), newOutstanding: named(newOutstanding), recentlyCleared: named(recentlyCleared) });
  } catch (e) { fail(res, e); }
});

const own = async (req, res) => { const t = await ColTask.findById(req.params.id, 'dealerId employeeId').lean(); if (!t) { res.status(404).json({ error: 'not found' }); return null; } if (!ensureInScope(req, res, t.dealerId)) return null; if (t.employeeId !== req.user.id && !isStaff(req)) { res.status(403).json({ error: 'not your task' }); return null; } return t; };
router.post('/:id/complete', async (req, res) => { try { if (!await own(req, res)) return; res.json(await completeTask(req.params.id, { by: req.user.id, comment: req.body?.comment, amount: Number(req.body?.amount) || 0 })); } catch (e) { fail(res, e); } });
router.post('/:id/cancel',   async (req, res) => { try { if (!await own(req, res)) return; res.json(await cancelTask(req.params.id, { by: req.user.id, reason: req.body?.reason })); } catch (e) { fail(res, e); } });
router.post('/:id/comment',  async (req, res) => { try { if (!await own(req, res)) return; res.json(await addComment(req.params.id, { by: req.user.id, text: req.body?.text })); } catch (e) { fail(res, e); } });
export default router;
