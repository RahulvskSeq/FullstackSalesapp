import jwt from 'jsonwebtoken';

// A token lives 30 days, so on its own it would keep a deactivated or
// demoted user's old access for weeks. Each request re-reads the account
// (cached for 30 s, so this costs one small query per user per half-minute):
// a disabled or deleted account is refused, and the role always comes from
// the account, not from the token. If the lookup itself fails, the token's
// own claims are used — a database blip must never lock everyone out.
const accountCache = new Map();   // id → { at, u }
const ACCOUNT_TTL = 30 * 1000;
async function account(id) {
  const hit = accountCache.get(id);
  if (hit && Date.now() - hit.at < ACCOUNT_TTL) return hit.u;
  const User = (await import('../models/User.js')).default;
  const u = await User.findOne({ id }, 'id role name active').lean();
  accountCache.set(id, { at: Date.now(), u: u || null });
  return u || null;
}
export const forgetAccount = id => { if (id) accountCache.delete(id); else accountCache.clear(); };

export const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if(!auth?.startsWith('Bearer ')) return res.status(401).json({ error:'No token' });
  let claims;
  try { claims = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error:'Invalid token' }); }
  req.user = claims;
  try {
    const u = await account(claims.id);
    if (!u) return res.status(401).json({ error:'This account no longer exists' });
    if (u.active === false) return res.status(401).json({ error:'This account has been disabled' });
    req.user = { ...claims, role: u.role || claims.role, name: u.name || claims.name };
  } catch (e) {
    console.warn('[auth] account check skipped:', e.message);
  }
  next();
};

// Accept BOTH admin and superadmin everywhere we previously accepted "admin".
// This keeps existing routes working while adding superadmin as the elevated tier.
export const adminOnly = (req, res, next) => {
  const role = req.user?.role;
  if(role !== 'admin' && role !== 'superadmin') return res.status(403).json({ error:'Admins only' });
  next();
};

// New: superadmin-only routes (impersonation, managing admins, etc.)
export const superAdminOnly = (req, res, next) => {
  if(req.user?.role !== 'superadmin') return res.status(403).json({ error:'Superadmin only' });
  next();
};

// Feature-gate middleware. Returns Express middleware that allows the
// request when the user has the named feature granted in their
// permissions.features list (or is superadmin / a plain admin with no
// explicit features list — they keep the legacy "all features" default).
/** The same answer requireFeature() gives, as a boolean — so a screen can hide what the server would refuse. */
export const hasFeature = async (req, featureKey) => {
  const role = req.user?.role;
  if (role === 'superadmin') return true;
  const User = (await import('../models/User.js')).default;
  const u = await User.findOne({ id: req.user.id }, 'permissions role').lean();
  const features = Array.isArray(u?.permissions?.features) ? u.permissions.features : [];
  if (features.length) return features.includes(featureKey);
  const { loadRolePermissions } = await import('../lib/rolePermissions.js');
  const roleFeatures = (await loadRolePermissions())[role]?.features || [];
  if (roleFeatures.length) return roleFeatures.includes(featureKey);
  return role === 'admin';
};

export const requireFeature = (featureKey) => async (req, res, next) => {
  const role = req.user?.role;
  if (role === 'superadmin') return next();   // always allowed
  try {
    const User = (await import('../models/User.js')).default;
    const u = await User.findOne({ id: req.user.id }, 'permissions role').lean();
    const features = Array.isArray(u?.permissions?.features) ? u.permissions.features : [];
    if (features.length === 0) {
      // No per-user list: the role's own list decides when one is set
      // (Settings → Permissions → Roles) …
      const { loadRolePermissions } = await import('../lib/rolePermissions.js');
      const roleFeatures = (await loadRolePermissions())[role]?.features || [];
      if (roleFeatures.length) {
        if (roleFeatures.includes(featureKey)) return next();
        return res.status(403).json({ error: `Feature "${featureKey}" not granted to role ${role}` });
      }
      // … else the built-in default: an admin keeps full access, a salesman
      // has none of these write features.
      if (role === 'admin') return next();
      return res.status(403).json({ error: `Feature "${featureKey}" not granted` });
    }
    if (features.includes(featureKey)) return next();
    return res.status(403).json({ error: `Feature "${featureKey}" not granted` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
