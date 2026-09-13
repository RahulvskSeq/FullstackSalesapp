import express from 'express';
import { protect } from '../../middleware/auth.js';
import { ColPromise } from '../models/index.js';
import { recordFollowup, updateFollowup, cancelPromise, listFollowups, listPromises } from '../services/followups.js';
import { withScope, ensureInScope, paging, fail, scopeFilter, isStaff } from '../lib/http.js';

const router = express.Router();
router.use(protect, withScope);

router.post('/', async (req, res) => {
  try {
    if (!ensureInScope(req, res, req.body?.dealerId)) return;
    // A salesman records their own interactions; staff may record on behalf of someone.
    const employeeId = isStaff(req) && req.body?.employeeId ? String(req.body.employeeId) : req.user.id;
    res.status(201).json(await recordFollowup({ ...req.body, employeeId }, { by: req.user.id }));
  } catch (e) { fail(res, e); }
});
router.put('/:id', async (req, res) => { try { res.json(await updateFollowup(req.params.id, req.body || {}, { by: req.user.id })); } catch (e) { fail(res, e); } });
router.get('/', async (req, res) => {
  try {
    const f = { ...scopeFilter(req.scope) };
    if (req.query.dealerId) { if (!ensureInScope(req, res, req.query.dealerId)) return; f.dealerId = req.query.dealerId; }
    if (req.query.employeeId) f.employeeId = String(req.query.employeeId);
    if (req.query.from || req.query.to) f.date = { ...(req.query.from ? { $gte: String(req.query.from) } : {}), ...(req.query.to ? { $lte: String(req.query.to) } : {}) };
    res.json(await listFollowups(f, paging(req.query)));
  } catch (e) { fail(res, e); }
});
router.get('/promises', async (req, res) => {
  try {
    const f = { ...scopeFilter(req.scope) };
    if (req.query.dealerId) { if (!ensureInScope(req, res, req.query.dealerId)) return; f.dealerId = req.query.dealerId; }
    if (req.query.status) f.status = { $in: String(req.query.status).split(',') };
    if (req.query.employeeId) f.employeeId = String(req.query.employeeId);
    res.json(await listPromises(f, paging(req.query)));
  } catch (e) { fail(res, e); }
});
router.post('/promises/:id/cancel', async (req, res) => {
  try {
    const p = await ColPromise.findById(req.params.id, 'dealerId employeeId').lean(); if (!p) return res.status(404).json({ error: 'not found' });
    if (!ensureInScope(req, res, p.dealerId)) return;
    if (p.employeeId !== req.user.id && !isStaff(req)) return res.status(403).json({ error: 'only the promising employee or staff can cancel a promise' });
    res.json(await cancelPromise(req.params.id, { by: req.user.id, reason: req.body?.reason }));
  } catch (e) { fail(res, e); }
});
export default router;
