import express from 'express';
import Setting from '../models/Setting.js';
import { protect, adminOnly, requireFeature } from '../middleware/auth.js';
import { TOGGLEABLE, getDisabled, setDisabled } from '../lib/featureFlags.js';
import { ACTION_PERMISSIONS, groupedActions } from '../lib/actionPermissions.js';
import { loadRolePermissions, saveRolePermissions, ROLES } from '../lib/rolePermissions.js';
import { superAdminOnly } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// GET /api/settings/months
// Returns the saved config PLUS the DB updatedAt timestamp (as ms-epoch) so
// the client can compare against its own localStorage timestamp and pick the
// most-recent version — preventing stale DB from clobbering local edits.
router.get('/months', protect, async (req, res) => {
  const s = await Setting.findOne({ key:'monthConfig' });
  if(!s) return res.json(null);
  const val = s.value || {};
  res.json({
    ...val,
    updatedAt: s.updatedAt ? s.updatedAt.getTime() : 0,
  });
});

// POST /api/settings/months — admin only
router.post('/months', protect, adminOnly, requireFeature('manageMonths'), async (req, res) => {
  const { MO, currentIdx, label, short } = req.body;
  if(!MO || !MO.length) return res.status(400).json({ error:'MO required' });
  const s = await Setting.findOneAndUpdate(
    { key:'monthConfig' },
    { value:{ MO, currentIdx, label, short } },
    { upsert:true, new:true }
  );
  res.json(s.value);
});


/* ------------------------------------------------------------------ *
 *  Feature switches — which parts of the app are turned on.          *
 *                                                                     *
 *  Any signed-in user may READ them (the client needs the list to     *
 *  build its menu); only an admin may change them.                    *
 * ------------------------------------------------------------------ */
// The catalogue of per-user action permissions, so the Users screen renders
// exactly what the server enforces instead of keeping its own copy.
router.get('/action-permissions', protect, (req, res) => {
  res.json({ actions: ACTION_PERMISSIONS, groups: groupedActions() });
});

// Role-level page / action defaults. Any signed-in user may read them (the
// client builds its menu from them); only a superadmin may change them.
router.get('/role-permissions', protect, async (req, res) => {
  try { res.json({ roles: ROLES, permissions: await loadRolePermissions() }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/role-permissions', protect, superAdminOnly, async (req, res) => {
  try { res.json({ ok: true, permissions: await saveRolePermissions(req.body?.permissions) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/features', protect, async (req, res) => {
  try {
    res.json({ features: TOGGLEABLE, disabled: await getDisabled() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/features', protect, adminOnly, requireFeature('manageFeatures'), async (req, res) => {
  try {
    // Unknown ids are dropped rather than stored, so a typo can't switch off
    // something that does not exist and quietly stay in the list forever.
    const disabled = await setDisabled(req.body?.disabled);
    res.json({ ok: true, disabled });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ------------------------------------------------------------------ *
 *  GET /api/settings/audit — who changed what.                       *
 *                                                                    *
 *  Admin only: the trail names users and echoes request bodies, so it *
 *  is not something a salesman should be able to read.               *
 * ------------------------------------------------------------------ */
router.get('/audit', protect, adminOnly, async (req, res) => {
  try {
    const q = {};
    if (req.query.by) q.by = String(req.query.by);
    if (req.query.from || req.query.to) {
      q.createdAt = {};
      if (req.query.from) q.createdAt.$gte = new Date(String(req.query.from) + 'T00:00:00');
      if (req.query.to)   q.createdAt.$lte = new Date(String(req.query.to)   + 'T23:59:59');
    }
    // Free-text across the action and the dealer name a diff recorded, so
    // "who touched PT LAM" is answerable without knowing the route.
    if (req.query.q) {
      const rx = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      q.$or = [{ action: rx }, { byName: rx }, { 'detail.changed.dealer': rx }];
    }
    // Failed attempts are worth seeing — a refused permission is a real event.
    if (req.query.failedOnly === '1') q['detail.status'] = { $gte: 400 };

    const limit = Math.min(Math.max(Number(req.query.limit) || 200, 1), 1000);
    const [rows, total, users] = await Promise.all([
      AuditLog.find(q).sort({ createdAt: -1 }).limit(limit).lean(),
      AuditLog.countDocuments(q),
      AuditLog.distinct('byName'),
    ]);
    res.json({ rows, total, shown: rows.length, users: users.filter(Boolean).sort() });
  } catch (e) {
    console.error('[AUDIT GET]', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;

