import mongoose from 'mongoose';
import { resolveScope, scopeFilter, inScope } from './scope.js';
/** Resolve the caller's scope once and attach it. Every route in the module uses it. */
export const withScope = async (req, res, next) => {
  try { req.scope = await resolveScope(req.user); next(); }
  catch (e) { res.status(500).json({ error: e.message }); }
};
export const ensureInScope = (req, res, dealerId) => {
  if (!mongoose.isValidObjectId(String(dealerId))) { res.status(400).json({ error: 'dealerId is not valid' }); return false; }
  if (!inScope(req.scope, dealerId)) { res.status(403).json({ error: 'That dealer is outside your scope' }); return false; }
  return true;
};
export const isStaff = req => ['admin', 'superadmin', 'employee'].includes(req.user?.role);
export const paging = q => ({ page: Math.max(1, +q.page || 1), limit: Math.min(200, Math.max(1, +q.limit || 50)) });
export const fail = (res, e) => { if (e?.status) return res.status(e.status).json({ error: e.message }); console.error('[COL]', e); res.status(500).json({ error: 'Something went wrong; the details are in the server log' }); };
export { scopeFilter };
