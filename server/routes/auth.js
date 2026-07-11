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
      // Include the data-scope permissions so the client knows a salesman is
      // permission-scoped (and shouldn't be re-filtered to own dealers only).
      permissions: user.permissions || {},
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

// GET /api/auth/users/:id/debug-scope — diagnostic: shows the target
// user's permissions, the resolved dealer filter, the count of dealers
// that match, AND a list of distinct dealer.state values currently in
// the DB. Lets an admin verify in one click whether a user's state
// permissions are saved correctly and whether dealer state values match.
// Admin only.
router.get('/users/:id/debug-scope', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id }, '-pass').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    const Dealer = (await import('../models/Dealer.js')).default;
    const p = user.permissions || {};
    const hasStates   = Array.isArray(p.states)   && p.states.length   > 0;
    const hasZones    = Array.isArray(p.zones)    && p.zones.length    > 0;
    const hasSalesmen = Array.isArray(p.salesmen) && p.salesmen.length > 0;
    let filter = {};
    if (user.role === 'superadmin') {
      filter = {};
    } else if (hasStates || hasZones || hasSalesmen) {
      const escape = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const ciMatch = v => new RegExp('^\\s*' + escape(v) + '\\s*$', 'i');
      if (hasStates)   filter.state    = { $in: p.states.map(ciMatch) };
      if (hasZones)    filter.zone     = { $in: p.zones.map(ciMatch) };
      if (hasSalesmen) filter.salesman = { $in: p.salesmen };
    } else if (user.role === 'salesman') {
      filter = { salesman: user.id };
    }
    const matching = await Dealer.countDocuments(filter);
    const totalAll = await Dealer.countDocuments({});
    const dbStates = (await Dealer.distinct('state')).filter(Boolean).sort();
    // Echo `resolvedFilter` as plain strings (regex doesn't JSON.stringify well)
    const printable = {};
    if (filter.state)    printable.state    = '[case-insensitive match] ' + p.states.join(', ');
    if (filter.zone)     printable.zone     = '[case-insensitive match] ' + p.zones.join(', ');
    if (filter.salesman) printable.salesman = p.salesmen?.join(', ') || filter.salesman;
    if (Object.keys(filter).length === 0) printable.note = 'No filter — sees all dealers';
    res.json({
      user: { id: user.id, name: user.name, role: user.role, permissions: user.permissions },
      resolvedFilter:      printable,
      matchingDealerCount: matching,
      totalDealersInDb:    totalAll,
      dbDistinctStates:    dbStates,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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
    allowed = ['url','url2','url_outstanding','pass','name','color','ini','role','approver','active','permissions'];
  } else if(isAdmin){
    if(isSelf) {
      // editing own profile
      allowed = ['url','url2','url_outstanding','pass','name','color','ini'];
    } else if(target.role === 'salesman') {
      // admin editing a salesman — can activate / deactivate, but NOT grant
      // data permissions (only superadmin may set permissions).
      allowed = ['url','url2','url_outstanding','pass','name','color','ini','approver','active'];
    } else if(target.role === 'admin') {
      // Admins can (de)activate other admins but cannot set permissions or role.
      allowed = ['active'];
    } else {
      return res.status(403).json({ error:'Admins cannot edit other admins or superadmins' });
    }
  } else {
    // salesman
    if(!isSelf) return res.status(403).json({ error:'Not allowed' });
    allowed = ['pass'];
  }

  const update = {};
  let permsToWrite = null;
  allowed.forEach(k => {
    if (req.body[k] === undefined) return;
    if (k === 'permissions') {
      // Use dot-notation $set so each array writes independently and we
      // can't accidentally drop sibling sub-fields. Also normalize: drop
      // empties, dedupe, trim.
      const p = req.body.permissions || {};
      const clean = arr => Array.isArray(arr)
        ? [...new Set(arr.map(v => String(v).trim()).filter(Boolean))]
        : [];
      permsToWrite = {
        states:   clean(p.states),
        cities:   clean(p.cities),      // ← was missing; caused city ticks to
                                        //   silently drop on save while states saved fine
        zones:    clean(p.zones),
        salesmen: clean(p.salesmen),
        features: clean(p.features),    // ← same story for the feature toggles
        pages:    clean(p.pages),       // left-nav page access allowlist
      };
      update['permissions.states']   = permsToWrite.states;
      update['permissions.cities']   = permsToWrite.cities;
      update['permissions.zones']    = permsToWrite.zones;
      update['permissions.salesmen'] = permsToWrite.salesmen;
      update['permissions.features'] = permsToWrite.features;
      update['permissions.pages']    = permsToWrite.pages;
    } else {
      update[k] = req.body[k];
    }
  });
  // Extra safety: prevent role escalation by non-superadmin
  if(!isSuperAdmin && update.role) delete update.role;

  // Diagnostic — log permission writes so we can confirm they actually
  // land in MongoDB. Remove once the feature is verified working.
  if (permsToWrite) {
    console.log('[USER PUT] permissions write — target=%s by=%s value=%s',
      targetId, me.id, JSON.stringify(permsToWrite));
  }

  const user = await User.findOneAndUpdate(
    { id: targetId },
    { $set: update },
    { new:true, select:'-pass' }
  );
  if (permsToWrite) {
    console.log('[USER PUT] permissions after-save —', JSON.stringify(user?.permissions));
  }
  res.json(user);
});

// ── POST /api/auth/users ───────────────────────────────────────────────────
// Admin can create salesmen only. Superadmin can create any role.
router.post('/users', protect, adminOnly, async (req, res) => {
  const { id, name, pass, role, color, ini, permissions } = req.body;
  if(!id||!name||!pass) return res.status(400).json({ error:'id, name, pass required' });
  const exists = await User.findOne({ id });
  if(exists) return res.status(400).json({ error:'User already exists' });

  const wantRole = role || 'salesman';
  // Only superadmin can create elevated roles (employee/admin/superadmin).
  if(req.user.role !== 'superadmin' && (wantRole === 'employee' || wantRole === 'admin' || wantRole === 'superadmin')){
    return res.status(403).json({ error:'Only superadmin can create employees, admins or superadmins' });
  }

  const doc = {
    id, name, pass,
    role: wantRole,
    color: color || '#818cf8',
    ini: ini || name.slice(0, 2).toUpperCase(),
  };
  // Only superadmin can attach data permissions at creation time.
  if (req.user.role === 'superadmin' && permissions && typeof permissions === 'object') {
    const clean = arr => Array.isArray(arr)
      ? [...new Set(arr.map(v => String(v).trim()).filter(Boolean))]
      : [];
    doc.permissions = {
      states:   clean(permissions.states),
      cities:   clean(permissions.cities),    // ← was dropped on create; city ticks vanished
      zones:    clean(permissions.zones),
      salesmen: clean(permissions.salesmen),
      features: clean(permissions.features),  // ← same story for feature toggles
      pages:    clean(permissions.pages),     // left-nav page access
    };
  }
  const user = await User.create(doc);
  res.json(user);
});

// ── POST /api/auth/users/:id/reassign ──────────────────────────────────────
// Move a salesman's dealers AND all their related records to another user —
// e.g. when a salesman resigns. Reassigns: dealers, sales, outstanding
// follow-ups, visits, attendance, tasks and leads. Admin/superadmin only.
router.post('/users/:id/reassign', protect, adminOnly, async (req, res) => {
  try {
    const fromId = req.params.id;
    const toId = String(req.body?.toId || '').trim();
    if(!toId) return res.status(400).json({ error:'toId (target salesman) required' });
    if(toId === fromId) return res.status(400).json({ error:'Source and target are the same user' });
    const to = await User.findOne({ id: toId }, 'id name').lean();
    if(!to) return res.status(404).json({ error:'Target user not found' });
    const toName = to.name || toId;

    const moved = {};
    const Dealer = (await import('../models/Dealer.js')).default;
    moved.dealers = (await Dealer.updateMany({ salesman: fromId }, { $set:{ salesman: toId } })).modifiedCount || 0;

    // Best-effort for the rest — a missing collection shouldn't abort the move.
    const tryMove = async (key, path, filter, set) => {
      try { const M = (await import(path)).default; moved[key] = (await M.updateMany(filter, { $set:set })).modifiedCount || 0; }
      catch(e){ console.warn('[REASSIGN] ' + key + ' skipped:', e.message); moved[key] = 0; }
    };
    await tryMove('sales',      '../models/Sale.js',                { salesman: fromId }, { salesman: toId });
    await tryMove('followups',  '../models/Outstandingfollowup.js', { salesman: fromId }, { salesman: toId });
    await tryMove('visits',     '../models/Visit.js',               { userId: fromId },   { userId: toId, userName: toName });
    await tryMove('attendance', '../models/Attendance.js',          { userId: fromId },   { userId: toId, userName: toName });
    await tryMove('tasks',      '../models/Task.js',                { assignedTo: fromId },{ assignedTo: toId });
    await tryMove('leads',      '../models/Lead.js',                { assignedTo: fromId },{ assignedTo: toId });

    console.log('[REASSIGN] ' + fromId + ' → ' + toId, moved);
    res.json({ ok:true, from:fromId, to:toId, toName, moved });
  } catch(e){ console.error('[REASSIGN]', e.message); res.status(500).json({ error:e.message }); }
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
