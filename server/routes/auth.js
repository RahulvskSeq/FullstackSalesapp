import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';

const router = express.Router();

// ── Helper: build a login response (token + user) ─────────────────────────
const buildLoginResponse = (user, extraTokenClaims = {}) => {
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, ...extraTokenClaims },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  return {
    token,
    user: {
      id: user.id, name: user.name, role: user.role,
      color: user.color, ini: user.ini,
      url: user.url, url2: user.url2, url_outstanding: user.url_outstanding,
    },
    ...(extraTokenClaims.impersonatedBy ? { impersonatedBy: extraTokenClaims.impersonatedBy } : {}),
  };
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { id, pass } = req.body;
  if(!id || !pass) return res.status(400).json({ error:'id and pass required' });
  const user = await User.findOne({ id });
  if(!user) return res.status(401).json({ error:'User not found' });
  if(user.pass !== pass) return res.status(401).json({ error:'Wrong password' });
  // Soft-disable: inactive users can't sign in, but their data stays in the DB.
  if(user.active === false) return res.status(403).json({ error:'This account is inactive. Ask an admin to re-activate it.' });
  res.json(buildLoginResponse(user));
});

// GET /api/auth/users — get users (no passwords)
// By default, returns ONLY active users (so login dropdowns, salesman
// pickers etc. don't show de-activated accounts). UserManagement calls
// with ?includeInactive=1 so admins can still see and re-activate them.
router.get('/users', async (req, res) => {
  const includeInactive = String(req.query.includeInactive || '') === '1';
  const filter = includeInactive ? {} : { active: { $ne: false } };
  const users = await User.find(filter, '-pass -__v');
  const map = {};
  users.forEach(u => { const o=u.toObject(); delete o._id; map[o.id]=o; });
  res.json(map);
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findOne({ id:req.user.id }, '-pass');
  res.json(user);
});

// GET /api/auth/me/prefs — fetch this user's UI preferences (category filter etc.)
router.get('/me/prefs', protect, async (req, res) => {
  const user = await User.findOne({ id:req.user.id }, 'prefs');
  res.json(user?.prefs || { excludedCategories: [], defaultExcludedCategories: [] });
});

// PUT /api/auth/me/prefs — merge in partial pref updates
// Body: { excludedCategories?: [String], defaultExcludedCategories?: [String] }
router.put('/me/prefs', protect, async (req, res) => {
  const set = {};
  if (Array.isArray(req.body.excludedCategories)) {
    set['prefs.excludedCategories'] = req.body.excludedCategories;
  }
  if (Array.isArray(req.body.defaultExcludedCategories)) {
    set['prefs.defaultExcludedCategories'] = req.body.defaultExcludedCategories;
  }
  if (!Object.keys(set).length) return res.status(400).json({ error: 'No valid fields to update' });
  const user = await User.findOneAndUpdate(
    { id:req.user.id }, { $set: set }, { new:true, select:'prefs' }
  );
  res.json(user?.prefs || {});
});

// ── PUT /api/auth/users/:id ────────────────────────────────────────────────
// Permission rules:
//   - Salesman:   can edit ONLY themselves, ONLY their password
//   - Admin:      can edit themselves and any SALESMAN. Cannot promote/demote
//                 anyone to/from admin or superadmin. Cannot edit other admins.
//   - Superadmin: can edit anyone, including assigning roles up to superadmin.
router.put('/users/:id', protect, async (req, res) => {
  const targetId = req.params.id;
  const me = req.user;
  const target = await User.findOne({ id: targetId });
  if(!target) return res.status(404).json({ error:'User not found' });

  const isSelf       = me.id === targetId;
  const isSuperAdmin = me.role === 'superadmin';
  const isAdmin      = me.role === 'admin';

  // Authorize the edit
  let allowed = [];
  if(isSuperAdmin){
    allowed = ['url','url2','url_outstanding','pass','name','color','ini','role','approver','active'];
  } else if(isAdmin){
    if(isSelf) {
      // editing own profile
      allowed = ['url','url2','url_outstanding','pass','name','color','ini'];
    } else if(target.role === 'salesman') {
      // admin editing a salesman — can also activate / deactivate
      allowed = ['url','url2','url_outstanding','pass','name','color','ini','approver','active'];
    } else {
      return res.status(403).json({ error:'Admins cannot edit other admins or superadmins' });
    }
  } else {
    // salesman
    if(!isSelf) return res.status(403).json({ error:'Not allowed' });
    allowed = ['pass'];
  }

  const update = {};
  allowed.forEach(k => { if(req.body[k] !== undefined) update[k] = req.body[k]; });
  // Extra safety: prevent role escalation by non-superadmin
  if(!isSuperAdmin && update.role) delete update.role;

  const user = await User.findOneAndUpdate({ id: targetId }, update, { new:true, select:'-pass' });
  res.json(user);
});

// ── POST /api/auth/users ───────────────────────────────────────────────────
// Admin can create salesmen only. Superadmin can create any role.
router.post('/users', protect, adminOnly, async (req, res) => {
  const { id, name, pass, role, color, ini } = req.body;
  if(!id||!name||!pass) return res.status(400).json({ error:'id, name, pass required' });
  const exists = await User.findOne({ id });
  if(exists) return res.status(400).json({ error:'User already exists' });

  const wantRole = role || 'salesman';
  // Only superadmin can create admins or other superadmins
  if(req.user.role !== 'superadmin' && (wantRole === 'admin' || wantRole === 'superadmin')){
    return res.status(403).json({ error:'Only superadmin can create admins or superadmins' });
  }

  const user = await User.create({
    id, name, pass,
    role: wantRole,
    color: color || '#818cf8',
    ini: ini || name.slice(0, 2).toUpperCase(),
  });
  res.json(user);
});

// ── DELETE /api/auth/users/:id ─────────────────────────────────────────────
// Admin can delete salesmen only. Superadmin can delete anyone except themselves.
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  const target = await User.findOne({ id: req.params.id });
  if(!target) return res.status(404).json({ error:'User not found' });
  if(target.id === req.user.id) return res.status(400).json({ error:'Cannot delete yourself' });
  if(req.params.id === 'admin') return res.status(400).json({ error:'Cannot delete the built-in admin' });
  if(req.user.role !== 'superadmin' && target.role !== 'salesman'){
    return res.status(403).json({ error:'Only superadmin can delete admins or superadmins' });
  }
  await User.findOneAndDelete({ id: req.params.id });
  res.json({ ok:true });
});

// ── POST /api/auth/impersonate/:id ─────────────────────────────────────────
// Superadmin-only: issues a JWT for the target user. The token embeds the
// original superadmin's id under `impersonatedBy` so the client can show a
// banner and offer one-click return.
router.post('/impersonate/:id', protect, superAdminOnly, async (req, res) => {
  const target = await User.findOne({ id: req.params.id });
  if(!target) return res.status(404).json({ error:'User not found' });
  if(target.id === req.user.id) return res.status(400).json({ error:'Already logged in as this user' });
  res.json(buildLoginResponse(target, { impersonatedBy: req.user.id, impersonatedByName: req.user.name }));
});

// ── POST /api/auth/return-to-self ─────────────────────────────────────────
// While impersonating, issue a new JWT for the ORIGINAL superadmin so they
// can return to their own account without re-entering a password.
router.post('/return-to-self', protect, async (req, res) => {
  if(!req.user.impersonatedBy) return res.status(400).json({ error:'Not currently impersonating' });
  const original = await User.findOne({ id: req.user.impersonatedBy });
  if(!original) return res.status(404).json({ error:'Original user not found' });
  if(original.role !== 'superadmin') return res.status(403).json({ error:'Original user is no longer superadmin' });
  res.json(buildLoginResponse(original));
});

// POST /api/auth/change-password
router.post('/change-password', protect, async (req, res) => {
  // Prevent password change while impersonating — too easy to accidentally
  // change the wrong account's password
  if(req.user.impersonatedBy) return res.status(403).json({ error:'Cannot change password while impersonating. Return to your account first.' });
  const { oldPass, newPass } = req.body;
  if(!newPass || newPass.length < 4) return res.status(400).json({ error:'New password too short' });
  const user = await User.findOne({ id:req.user.id });
  if(user.pass !== oldPass) return res.status(401).json({ error:'Wrong current password' });
  user.pass = newPass;
  await user.save();
  res.json({ ok:true });
});

export default router;
