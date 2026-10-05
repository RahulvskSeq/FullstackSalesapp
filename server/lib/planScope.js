import User from '../models/User.js';
import { hasFeature } from '../middleware/auth.js';

/**
 * Whose days may this user plan on the visit calendar?
 *
 *   permissions.planFor = ['ratish', …]  → only those salesmen's days, with their dealers
 *   else the "visitPlan" action            → every salesman
 *   else                                   → nobody else's (a salesman still plans his own day)
 *
 * Set per user in Settings → Users → Permissions → "Plan visits for".
 */
export async function planScope(req) {
  if (req.user?.role === 'superadmin') return { all: true, ids: null };
  const u = await User.findOne({ id: req.user.id }, 'permissions').lean();
  const pf = (u?.permissions?.planFor || []).map(String).filter(Boolean);
  if (pf.length) return { all: false, ids: new Set(pf) };
  if (await hasFeature(req, 'visitPlan')) return { all: true, ids: null };
  return null;
}
export const mayPlanFor = (scope, salesmanId) => !!scope && (scope.all || scope.ids.has(String(salesmanId || '')));
