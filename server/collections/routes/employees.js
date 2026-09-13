import express from 'express';
import { protect, requireFeature } from '../../middleware/auth.js';
import { ColEmployeeActivity, ColEmployeeReview } from '../models/index.js';
import { rebuildActivity, generateReview, setManagerReview, finalizeReview } from '../services/reviews.js';
import { withScope, fail, isStaff } from '../lib/http.js';

const router = express.Router();
router.use(protect, withScope);
router.get('/activity', async (req, res) => {
  try {
    const f = {}; if (req.query.from || req.query.to) f.date = { ...(req.query.from ? { $gte: String(req.query.from) } : {}), ...(req.query.to ? { $lte: String(req.query.to) } : {}) };
    if (!isStaff(req)) f.employeeId = req.user.id; else if (req.query.employeeId) f.employeeId = String(req.query.employeeId);
    res.json(await ColEmployeeActivity.find(f).sort({ date: -1 }).limit(2000).lean());
  } catch (e) { fail(res, e); }
});
router.post('/activity/rebuild', requireFeature('collections.reviews'), async (req, res) => {
  try { const { from, to } = req.body || {}; if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return res.status(400).json({ error: 'from and to (YYYY-MM-DD) are required' }); res.json(await rebuildActivity({ from, to })); } catch (e) { fail(res, e); }
});
router.get('/reviews', async (req, res) => {
  try { const f = {}; if (req.query.period) f.period = String(req.query.period); if (!isStaff(req)) f.employeeId = req.user.id; res.json(await ColEmployeeReview.find(f).sort({ period: -1, score: -1 }).lean()); } catch (e) { fail(res, e); }
});
router.post('/reviews/generate', requireFeature('collections.reviews'), async (req, res) => {
  try {
    const period = String(req.body?.period || ''); const ids = Array.isArray(req.body?.employeeIds) && req.body.employeeIds.length ? req.body.employeeIds : null;
    const User = (await import('../../models/User.js')).default;
    const emps = ids || (await User.find({ role: 'salesman', active: { $ne: false } }, 'id').lean()).map(u => u.id);
    const out = []; for (const e of emps) out.push(await generateReview(e, period, { by: req.user.id }));
    res.json(out);
  } catch (e) { fail(res, e); }
});
router.put('/reviews/:id/manager', requireFeature('collections.reviews'), async (req, res) => { try { res.json(await setManagerReview(req.params.id, { ...req.body, by: req.user.id })); } catch (e) { fail(res, e); } });
router.post('/reviews/:id/finalize', requireFeature('collections.reviews'), async (req, res) => { try { res.json(await finalizeReview(req.params.id, { by: req.user.id })); } catch (e) { fail(res, e); } });
export default router;
