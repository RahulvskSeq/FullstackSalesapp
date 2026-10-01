import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, adminOnly, superAdminOnly, requireFeature, forgetAccount } from '../middleware/auth.js';

const router = express.Router();
// any change to an account (role, active, deleted) takes effect at once, not after the 30 s account cache
router.use((req, res, next) => { if (req.method !== 'GET') res.on('finish', () => forgetAccount()); next(); });

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
      color: user.color, ini: user.ini, avatar: user.avatar || '',
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
// Optional auth. The login page needs a roster before anyone holds a token,
// so this stays reachable without one — but an anonymous caller gets ONLY the
// fields that dropdown renders.
//
// It previously returned the full document to anyone on the internet: every
// role (naming the superadmin to target), every user's permission set, and
// url / url2 / url_outstanding — which are Google "publish to web" CSV links
// that serve live sales data to anyone who opens them, no login required.
router.get('/users', async (req, res) => {
  let authed = false;
  const hdr = req.headers.authorization;
  if (hdr?.startsWith('Bearer ')) {
    try { jwt.verify(hdr.split(' ')[1], process.env.JWT_SECRET); authed = true; } catch { /* treat as anonymous */ }
  }
  const includeInactive = authed && String(req.query.includeInactive || '') === '1';
  const filter = includeInactive ? {} : { active: { $ne: false } };
  const users = await User.find(filter, authed ? '-pass -__v -photo -profile' : 'id name color ini active');
  const map = {};
  users.forEach(u => { const o=u.toObject(); delete o._id; map[o.id]=o; });
  res.json(map);
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findOne({ id:req.user.id }, '-pass -photo');
  res.json(user);
});

// ── Profile: each person edits their own details ───────────────────────────
// Only the fields below can change here. Name, id, role, empCode, email and
// permissions are deliberately not accepted — dealers, sales and access are
// tied to them, so they stay with the admin.
const PROFILE_FIELDS = {
  phone:30, whatsapp:30, altPhone:30, personalEmail:120, dob:10, bloodGroup:5,
  address:300, city:60, state:60, pincode:10, emergencyName:80, emergencyRel:40,
  emergencyPhone:30, languages:120, bio:500,
};
const PHOTO_MAX  = 400 * 1024;   // ~512px JPEG as a data URL
const AVATAR_MAX = 40 * 1024;    // ~96px thumbnail
const isImg = v => typeof v === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v);
const PROFILE_VIEW = 'id name role empCode email color ini photo avatar profile createdAt';

// GET /api/auth/me/profile — the full profile including the photo
router.get('/me/profile', protect, async (req, res) => {
  const u = await User.findOne({ id:req.user.id }, PROFILE_VIEW).lean();
  if(!u) return res.status(404).json({ error:'User not found' });
  delete u._id;
  res.json(u);
});

// PUT /api/auth/me/profile — Body: { profile?:{…}, color?, photo?, avatar?, removePhoto? }
router.put('/me/profile', protect, async (req, res) => {
  // edits land on whoever is signed in — never on an account opened with Login as
  if(req.user.impersonatedBy) return res.status(403).json({ error:'Return to your own account to edit a profile.' });
  const b = req.body || {};
  const set = {};
  if(b.profile && typeof b.profile === 'object'){
    for(const [k, max] of Object.entries(PROFILE_FIELDS)){
      if(b.profile[k] === undefined) continue;
      const v = String(b.profile[k] ?? '').trim();
      if(v.length > max) return res.status(400).json({ error:`${k} is too long` });
      if(k === 'dob' && v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return res.status(400).json({ error:'Date of birth must be YYYY-MM-DD' });
      if(k === 'personalEmail' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return res.status(400).json({ error:'Personal email looks wrong' });
      if(/phone|whatsapp/i.test(k) && v && !/^[+\d][\d\s-]{5,}$/.test(v)) return res.status(400).json({ error:'Phone numbers may use digits, spaces, - and a leading +' });
      if(k === 'pincode' && v && !/^\d{6}$/.test(v)) return res.status(400).json({ error:'PIN code must be 6 digits' });
      set['profile.' + k] = v;
    }
  }
  if(b.color !== undefined){
    if(!/^#[0-9a-fA-F]{6}$/.test(String(b.color))) return res.status(400).json({ error:'Colour must look like #3b82f6' });
    set.color = b.color;
  }
  if(b.removePhoto){ set.photo = ''; set.avatar = ''; }
  else if(b.photo !== undefined || b.avatar !== undefined){
    if(!isImg(b.photo) || !isImg(b.avatar)) return res.status(400).json({ error:'Photo must be a JPEG, PNG or WebP image' });
    if(b.photo.length > PHOTO_MAX || b.avatar.length > AVATAR_MAX) return res.status(413).json({ error:'Photo too large — pick a smaller picture' });
    set.photo = b.photo; set.avatar = b.avatar;
  }
  if(!Object.keys(set).length) return res.status(400).json({ error:'Nothing to update' });
  const u = await User.findOneAndUpdate({ id:req.user.id }, { $set:set }, { new:true, projection:PROFILE_VIEW }).lean();
  if(!u) return res.status(404).json({ error:'User not found' });
  delete u._id;
  res.json(u);
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
    allowed = ['url','url2','url_outstanding','pass','name','color','ini','role','approver','active','permissions','email','empCode'];
  } else if(isAdmin){
    if(isSelf) {
      // editing own profile
      allowed = ['url','url2','url_outstanding','pass','name','color','ini','email','empCode'];
    } else if(target.role === 'salesman') {
      // admin editing a salesman — can activate / deactivate, but NOT grant
      // data permissions (only superadmin may set permissions).
      allowed = ['url','url2','url_outstanding','pass','name','color','ini','approver','active','email','empCode'];
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

  // Same rules as create: an obvious non-address is rejected rather than
  // stored, and one address can't sit on two accounts. Clearing it is fine.
  if (allowed.includes('email') && req.body.email !== undefined) {
    const e = String(req.body.email || '').trim().toLowerCase();
    if (e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return res.status(400).json({ error:'That email address is not valid' });
    }
    if (e) {
      const taken = await User.findOne({ email: e, id: { $ne: targetId } });
      if (taken) return res.status(400).json({ error:`That email is already on ${taken.id}` });
    }
    req.body.email = e;
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
    { new:true, select:'-pass -photo' }
  );
  if (permsToWrite) {
    console.log('[USER PUT] permissions after-save —', JSON.stringify(user?.permissions));
  }
  res.json(user);
});

// ── POST /api/auth/users ───────────────────────────────────────────────────
// Admin can create salesmen only. Superadmin can create any role.
router.post('/users', protect, adminOnly, requireFeature('manageUsers'), async (req, res) => {
  const { id, name, pass, role, color, ini, permissions, email, url } = req.body;
  if(!id||!name||!pass) return res.status(400).json({ error:'id, name, pass required' });
  const exists = await User.findOne({ id });
  if(exists) return res.status(400).json({ error:'User already exists' });

  // Optional, but reject something that plainly isn't an address rather than
  // storing a typo everyone later trusts.
  const cleanEmail = String(email || '').trim().toLowerCase();
  if(cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)){
    return res.status(400).json({ error:'That email address is not valid' });
  }
  if(cleanEmail){
    const taken = await User.findOne({ email: cleanEmail });
    if(taken) return res.status(400).json({ error:`That email is already on ${taken.id}` });
  }

  const wantRole = role || 'salesman';
  // Only superadmin can create elevated roles (employee/admin/superadmin).
  if(req.user.role !== 'superadmin' && (wantRole === 'employee' || wantRole === 'admin' || wantRole === 'superadmin')){
    return res.status(403).json({ error:'Only superadmin can create employees, admins or superadmins' });
  }

  const doc = {
    id, name, pass,
    role: wantRole,
    email: cleanEmail,
    empCode: String(req.body.empCode || '').trim().toUpperCase().replace(/\s+/g, ' '),
    color: color || '#818cf8',
    ini: ini || name.slice(0, 2).toUpperCase(),
    ...(url ? { url: String(url).trim() } : {}),
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
// Body: { toId, fromMonth? } — fromMonth is an MO label like "Jul-26".
// WITH fromMonth: the handover is effective THAT month. Sales history before
// it stays attributed to the old salesman (per-month `salesman` stamp on the
// dealer + untouched Sale rows); the dealer, its Sale rows from that month
// onward, and open work (follow-ups, tasks, leads) move to the new salesman.
// Personal history (visits, attendance) stays with the old user.
// WITHOUT fromMonth: legacy full move (resignation), everything transfers.
router.post('/users/:id/reassign', protect, adminOnly, requireFeature('manageUsers'), async (req, res) => {
  try {
    const fromId = req.params.id;
    const toId = String(req.body?.toId || '').trim();
    const fromMonth = String(req.body?.fromMonth || '').trim();   // MO label
    if(!toId) return res.status(400).json({ error:'toId (target salesman) required' });
    if(toId === fromId) return res.status(400).json({ error:'Source and target are the same user' });
    const to = await User.findOne({ id: toId }, 'id name').lean();
    if(!to) return res.status(404).json({ error:'Target user not found' });
    const toName = to.name || toId;

    // "Jul-26" → "2026-07" for comparing against Sale.month / MO labels.
    const toYM = (lbl) => {
      const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(String(lbl||'').trim());
      if(!m) return '';
      const mi = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
        .indexOf(m[1].slice(0,3).toLowerCase());
      if(mi < 0) return '';
      let y = +m[2]; if(y < 100) y += 2000;
      return `${y}-${String(mi+1).padStart(2,'0')}`;
    };
    const cutYM = toYM(fromMonth);
    if(fromMonth && !cutYM) return res.status(400).json({ error:`Could not parse fromMonth "${fromMonth}"` });

    const moved = {};
    const Dealer = (await import('../models/Dealer.js')).default;

    if(cutYM){
      // Stamp each pre-cutoff month that has data with the OLD salesman so
      // that month's numbers remain attributed to them after the handover.
      const dealers = await Dealer.find({ salesman: fromId });
      moved.monthsStamped = 0;
      for(const d of dealers){
        const md = d.monthlyData || new Map();
        const entries = typeof md.forEach === 'function' ? md : new Map(Object.entries(md));
        let touched = false;
        entries.forEach((e, label) => {
          const ym = toYM(label);
          if(!ym || ym >= cutYM) return;                        // cutoff month onward → new owner
          if(!e || (!(e.achieved > 0) && !(e.target > 0))) return;  // no data — nothing to attribute
          if(e.salesman) return;                                // already attributed (earlier handover)
          e.salesman = fromId;
          touched = true;
          moved.monthsStamped++;
        });
        if(touched){ d.markModified('monthlyData'); await d.save(); }
      }
    }
    moved.dealers = (await Dealer.updateMany({ salesman: fromId }, { $set:{ salesman: toId } })).modifiedCount || 0;

    // Best-effort for the rest — a missing collection shouldn't abort the move.
    const tryMove = async (key, path, filter, set) => {
      try { const M = (await import(path)).default; moved[key] = (await M.updateMany(filter, { $set:set })).modifiedCount || 0; }
      catch(e){ console.warn('[REASSIGN] ' + key + ' skipped:', e.message); moved[key] = 0; }
    };
    // Sale rows: with a cutoff, only rows from that month onward change hands.
    await tryMove('sales', '../models/Sale.js',
      cutYM ? { salesman: fromId, month: { $gte: cutYM } } : { salesman: fromId },
      { salesman: toId });
    await tryMove('followups',  '../models/Outstandingfollowup.js', { salesman: fromId }, { salesman: toId });
    if(!cutYM){
      // Full resignation move only — with a dated handover, the old user keeps
      // their own visit/attendance history.
      await tryMove('visits',     '../models/Visit.js',      { userId: fromId }, { userId: toId, userName: toName });
      await tryMove('attendance', '../models/Attendance.js', { userId: fromId }, { userId: toId, userName: toName });
    }
    await tryMove('tasks', '../models/Task.js', { assignedTo: fromId },{ assignedTo: toId });
    // Collections module: the balance's copy of the salesman, and open work.
    await tryMove('colBalances', '../collections/models/Balance.js',        { salesmanId: fromId }, { salesmanId: toId });
    await tryMove('colTasks',    '../collections/models/CollectionTask.js', { employeeId: fromId, status: { $in: ['OPEN', 'IN_PROGRESS'] } }, { employeeId: toId });
    await tryMove('colPromises', '../collections/models/Promise.js',        { employeeId: fromId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }, { employeeId: toId });
    await tryMove('leads', '../models/Lead.js', { assignedTo: fromId },{ assignedTo: toId });

    console.log('[REASSIGN] ' + fromId + ' → ' + toId + (cutYM ? ' from ' + fromMonth : ' (full)'), moved);
    res.json({ ok:true, from:fromId, to:toId, toName, fromMonth: fromMonth || null, moved });
  } catch(e){ console.error('[REASSIGN]', e.message); res.status(500).json({ error:e.message }); }
});

// ── DELETE /api/auth/users/:id ─────────────────────────────────────────────
// Admin can delete salesmen only. Superadmin can delete anyone except themselves.
router.delete('/users/:id', protect, adminOnly, requireFeature('manageUsers'), async (req, res) => {
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
// Also open to any user explicitly granted the `loginAs` action — checked
// against the stored record, not the token, so revoking it takes effect at
// once. A grantee can never enter a superadmin's account.
const canLoginAs = async (user) => {
  if (user?.role === 'superadmin') return true;
  const u = await User.findOne({ id: user?.id }, 'permissions role').lean();
  const own = Array.isArray(u?.permissions?.features) ? u.permissions.features : [];
  if (own.length) return own.includes('loginAs');
  // no list of their own → the role's list (Settings → Permissions → By role);
  // an empty role list is the built-in default, which gives admins Login as
  const { loadRolePermissions } = await import('../lib/rolePermissions.js');
  const rl = (await loadRolePermissions())[u?.role]?.features || [];
  return rl.length ? rl.includes('loginAs') : u?.role === 'admin';
};
router.post('/impersonate/:id', protect, async (req, res) => {
  if(!(await canLoginAs(req.user))) return res.status(403).json({ error:'Login as is not granted to you' });
  const target = await User.findOne({ id: req.params.id });
  if(!target) return res.status(404).json({ error:'User not found' });
  if(target.id === req.user.id) return res.status(400).json({ error:'Already logged in as this user' });
  if(target.role === 'superadmin' && req.user.role !== 'superadmin') return res.status(403).json({ error:'Only a superadmin can log in as a superadmin' });
  res.json(buildLoginResponse(target, { impersonatedBy: req.user.id, impersonatedByName: req.user.name }));
});

// ── POST /api/auth/return-to-self ─────────────────────────────────────────
// While impersonating, issue a new JWT for the ORIGINAL superadmin so they
// can return to their own account without re-entering a password.
router.post('/return-to-self', protect, async (req, res) => {
  if(!req.user.impersonatedBy) return res.status(400).json({ error:'Not currently impersonating' });
  const original = await User.findOne({ id: req.user.impersonatedBy });
  if(!original) return res.status(404).json({ error:'Original user not found' });
  if(!(await canLoginAs(original))) return res.status(403).json({ error:'Original user may no longer log in as others' });
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
