import express from 'express';
import { protect, requireFeature } from '../../middleware/auth.js';
import { listBalances, dealer360, timeline, history, dashboard, reconciliation, globalSearch } from '../services/read.js';
import { REPORTS, streamReport } from '../services/reports.js';
import { withScope, ensureInScope, fail, scopeFilter, paging } from '../lib/http.js';
import { DEFAULTS, getSetting, setSetting, allSettings } from '../lib/settings.js';
import { writeAudit } from '../lib/audit.js';
import { ColNotification } from '../models/index.js';

const router = express.Router();
router.use(protect, withScope);

router.get('/outstanding', async (req, res) => { try { res.json(await listBalances(scopeFilter(req.scope), req.query)); } catch (e) { fail(res, e); } });
router.get('/dashboard',   async (req, res) => { try { res.json(await dashboard(scopeFilter(req.scope))); } catch (e) { fail(res, e); } });
router.get('/search',      async (req, res) => { try { if (!req.query.q) return res.json({}); res.json(await globalSearch(scopeFilter(req.scope), String(req.query.q))); } catch (e) { fail(res, e); } });
router.get('/reconciliation', async (req, res) => { try { res.json(await reconciliation(scopeFilter(req.scope), { from: req.query.from, to: req.query.to, ...paging(req.query) })); } catch (e) { fail(res, e); } });

router.get('/dealers/:id/360', async (req, res) => {
  try { if (!ensureInScope(req, res, req.params.id)) return; const d = await dealer360(req.params.id); if (!d) return res.status(404).json({ error: 'dealer not found' }); res.json(d); } catch (e) { fail(res, e); }
});
router.get('/dealers/:id/timeline', async (req, res) => {
  try { if (!ensureInScope(req, res, req.params.id)) return; res.json(await timeline(req.params.id, { limit: +req.query.limit || 50, before: req.query.before || null, types: req.query.types ? String(req.query.types).split(',') : null })); } catch (e) { fail(res, e); }
});
router.get('/dealers/:id/history', async (req, res) => {
  try { if (!ensureInScope(req, res, req.params.id)) return; res.json(await history(req.params.id)); } catch (e) { fail(res, e); }
});

router.get('/reports', (req, res) => res.json(Object.entries(REPORTS).map(([id, r]) => ({ id, label: r.label }))));
router.get('/reports/:kind', async (req, res) => {
  try {
    const r = REPORTS[req.params.kind]; if (!r) return res.status(404).json({ error: 'unknown report' });
    if (req.query.dealerId && !ensureInScope(req, res, req.query.dealerId)) return;
    const data = await r.build(scopeFilter(req.scope), req.query);
    if (req.query.format === 'xlsx' || req.query.format === 'csv') return streamReport(res, req.params.kind, data, req.query.format);
    res.json({ ...data, rows: data.rows.slice(0, 500), truncated: data.rows.length > 500, count: data.rows.length });
  } catch (e) { fail(res, e); }
});

router.get('/notifications', async (req, res) => {
  try { const items = await ColNotification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(50).lean(); res.json({ items, unread: items.filter(i => !i.readAt).length }); } catch (e) { fail(res, e); }
});
router.post('/notifications/read', async (req, res) => {
  try { await ColNotification.updateMany({ userId: req.user.id, readAt: null, ...(req.body?.ids ? { _id: { $in: req.body.ids } } : {}) }, { $set: { readAt: new Date() } }); res.json({ ok: true }); } catch (e) { fail(res, e); }
});

router.get('/settings', requireFeature('collections.settings'), async (req, res) => { try { res.json({ settings: await allSettings(), defaults: DEFAULTS }); } catch (e) { fail(res, e); } });
router.put('/settings/:key', requireFeature('collections.settings'), async (req, res) => {
  try {
    const key = req.params.key; const value = req.body?.value;
    if (!(key in DEFAULTS)) return res.status(404).json({ error: 'unknown setting' });
    if (key === 'collections.reviewWeights') { const sum = Object.values(value || {}).reduce((s, v) => s + (Number(v) || 0), 0); if (Math.round(sum) !== 100) return res.status(400).json({ error: `weights must total 100 (they total ${sum})` }); }
    if (key === 'collections.taskPoints' && (typeof value !== 'object' || Object.values(value).some(v => !Number.isFinite(Number(v)) || Number(v) < 0))) return res.status(400).json({ error: 'points must be non-negative numbers' });
    if (key === 'collections.automationRules' && (!Array.isArray(value) || value.some(r => !r.id || !r.trigger || !r.action))) return res.status(400).json({ error: 'each rule needs id, trigger and action' });
    if (key === 'collections.balanceModeDefault' && !['buckets', 'snapshot'].includes(value)) return res.status(400).json({ error: 'buckets or snapshot' });
    const before = await getSetting(key);
    const after = await setSetting(key, value);
    await writeAudit({ entity: 'setting', entityId: key, action: 'changed', before, after, by: req.user.id });
    res.json({ key, value: after });
  } catch (e) { fail(res, e); }
});
export default router;
