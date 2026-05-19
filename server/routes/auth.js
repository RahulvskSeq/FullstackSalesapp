import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { id, pass } = req.body;
  if(!id || !pass) return res.status(400).json({ error:'id and pass required' });
  const user = await User.findOne({ id });
  if(!user) return res.status(401).json({ error:'User not found' });
  if(user.pass !== pass) return res.status(401).json({ error:'Wrong password' });
  const token = jwt.sign(
    { id:user.id, role:user.role, name:user.name },
    process.env.JWT_SECRET,
    { expiresIn:'30d' }
  );
  res.json({
    token,
    user:{ id:user.id, name:user.name, role:user.role, color:user.color, ini:user.ini, url:user.url, url2:user.url2, url_outstanding:user.url_outstanding }
  });
});

// GET /api/auth/users — get all users (no passwords)
router.get('/users', async (req, res) => {
  const users = await User.find({}, '-pass -__v');
  const map = {};
  users.forEach(u => { const o=u.toObject(); delete o._id; map[o.id]=o; });
  res.json(map);
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findOne({ id:req.user.id }, '-pass');
  res.json(user);
});

// PUT /api/auth/users/:id — admin updates any user; salesman updates own
router.put('/users/:id', protect, async (req, res) => {
  // Salesmen can only update themselves, and only certain fields
  if(req.user.role !== 'admin' && req.user.id !== req.params.id)
    return res.status(403).json({ error:'Not allowed' });
  const allowed = req.user.role==='admin'
    ? ['url','url2','url_outstanding','pass','name','color','ini','role']
    : ['pass']; // salesman can only change own password
  const update = {};
  allowed.forEach(k => { if(req.body[k] !== undefined) update[k] = req.body[k]; });
  const user = await User.findOneAndUpdate({ id:req.params.id }, update, { new:true, select:'-pass' });
  if(!user) return res.status(404).json({ error:'User not found' });
  res.json(user);
});

// POST /api/auth/users — admin only
router.post('/users', protect, adminOnly, async (req, res) => {
  const { id, name, pass, role, color, ini } = req.body;
  if(!id||!name||!pass) return res.status(400).json({ error:'id, name, pass required' });
  const exists = await User.findOne({ id });
  if(exists) return res.status(400).json({ error:'User already exists' });
  const user = await User.create({ id, name, pass, role:role||'salesman', color:color||'#818cf8', ini:ini||name.slice(0,2).toUpperCase() });
  res.json(user);
});

// DELETE /api/auth/users/:id — admin only
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  if(req.params.id==='admin') return res.status(400).json({ error:'Cannot delete admin' });
  await User.findOneAndDelete({ id:req.params.id });
  res.json({ ok:true });
});

// POST /api/auth/change-password
router.post('/change-password', protect, async (req, res) => {
  const { oldPass, newPass } = req.body;
  if(!newPass || newPass.length < 4) return res.status(400).json({ error:'New password too short' });
  const user = await User.findOne({ id:req.user.id });
  if(user.pass !== oldPass) return res.status(401).json({ error:'Wrong current password' });
  user.pass = newPass;
  await user.save();
  res.json({ ok:true });
});

export default router;
