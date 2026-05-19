import express from 'express';
import Setting from '../models/Setting.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /api/settings/months
router.get('/months', protect, async (req, res) => {
  const s = await Setting.findOne({ key:'monthConfig' });
  if(!s) return res.json(null);
  res.json(s.value);
});

// POST /api/settings/months — admin only
router.post('/months', protect, adminOnly, async (req, res) => {
  const { MO, currentIdx, label, short } = req.body;
  if(!MO || !MO.length) return res.status(400).json({ error:'MO required' });
  const s = await Setting.findOneAndUpdate(
    { key:'monthConfig' },
    { value:{ MO, currentIdx, label, short } },
    { upsert:true, new:true }
  );
  res.json(s.value);
});

export default router;