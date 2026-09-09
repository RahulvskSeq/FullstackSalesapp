import express from 'express';
import Setting from '../models/Setting.js';
import { protect, adminOnly, requireFeature } from '../middleware/auth.js';
import { TOGGLEABLE, getDisabled, setDisabled } from '../lib/featureFlags.js';
import { ACTION_PERMISSIONS, groupedActions } from '../lib/actionPermissions.js';

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

export default router;
