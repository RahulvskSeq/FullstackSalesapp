import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if(!auth?.startsWith('Bearer ')) return res.status(401).json({ error:'No token' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error:'Invalid token' });
  }
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
