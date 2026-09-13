import express from 'express';
import mongoose from 'mongoose';
import { protect } from '../../middleware/auth.js';
import { ColBalance, ColFollowUp, ColPromise } from '../models/index.js';
import { withScope, scopeFilter, fail } from '../lib/http.js';
import { sortPeriods, OLDER } from '../lib/periods.js';
import { cancelPromise } from '../services/followups.js';
/** A Map field is a Map on a document and a plain object after .lean(); either way, an object. */
const asObj = b => b instanceof Map ? Object.fromEntries(b) : (b && typeof b === 'object' ? b : {});

/**
 * The shapes the untouched consumers expect (App.jsx → SalesByCategory,
 * Reports, DealerModal, FollowupsHub), served from the new tables. Removed
 * with the legacy module one release after cutover.
 */
const router = express.Router();
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const label = p => p === OLDER ? 'Older' : `${MON[+p.slice(5) - 1]}-${p.slice(2, 4)}`;

router.get('/outstanding', protect, withScope, async (req, res) => {
  try {
    const rows = await ColBalance.find(scopeFilter(req.scope), 'dealerId dealerName buckets total').lean();
    // Last key is what the legacy reader treats as "latest", so it is the total.
    res.json(rows.map(b => {
      const mo = {}; const buckets = asObj(b.buckets);
      for (const p of sortPeriods(Object.keys(buckets))) mo[label(p)] = buckets[p];
      mo.Total = b.total;
      return { _id: String(b.dealerId), dealerName: b.dealerName, monthlyOutstanding: mo };
    }));
  } catch (e) { fail(res, e); }
});

const legacyRow = (f, p, name) => ({
  _id: String(f._id), dealerName: name, salesman: f.employeeId, amount: p ? p.amount : 0,
  followupDate: p ? p.promiseDate : (f.nextFollowupDate || f.date), comment: f.discussion || f.remarks || '',
  reason: f.outcome, months: [], status: p ? (['PENDING', 'PARTIALLY_FULFILLED', 'BROKEN'].includes(p.status) ? 'pending' : 'done') : (f.nextFollowupDate && f.nextFollowupDate >= new Date().toISOString().slice(0, 10) ? 'pending' : 'done'),
  type: 'followup', createdBy: f.createdBy, collectedAmount: p ? p.received : 0, createdAt: f.createdAt, promiseId: p ? String(p._id) : null,
});

router.get('/followups', protect, withScope, async (req, res) => {
  try {
    const fus = await ColFollowUp.find(scopeFilter(req.scope)).sort({ createdAt: -1 }).limit(2000).lean();
    const promises = new Map((await ColPromise.find({ _id: { $in: fus.map(f => f.promiseId).filter(Boolean) } }).lean()).map(p => [String(p._id), p]));
    const Dealer = mongoose.models.Dealer;
    const names = new Map((await Dealer.find({ _id: { $in: fus.map(f => f.dealerId) } }, 'name').lean()).map(d => [String(d._id), d.name]));
    res.json(fus.map(f => legacyRow(f, f.promiseId ? promises.get(String(f.promiseId)) : null, names.get(String(f.dealerId)) || '')));
  } catch (e) { fail(res, e); }
});

// The legacy screen's "mark done" on a promise means the promise is no longer chased.
router.put('/followups/:id', protect, withScope, async (req, res) => {
  try {
    const f = await ColFollowUp.findById(req.params.id).lean();
    if (!f) return res.status(404).json({ error: 'not found' });
    if (req.body?.status === 'done' && f.promiseId) await cancelPromise(f.promiseId, { by: req.user.id, reason: 'marked done in the Follow-ups screen' });
    res.json({ ok: true });
  } catch (e) { fail(res, e); }
});
export default router;
