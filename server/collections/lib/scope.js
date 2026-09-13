import mongoose from 'mongoose';
/**
 * The caller's dealer scope, resolved once per request and applied to every
 * query. Same rules as routes/dealers.js so the module can never show more
 * than the rest of the application does:
 *   superadmin → everything
 *   salesman   → dealers where salesman = their id, full stop
 *   others     → permissions.states/cities/zones OR'd, salesmen AND-narrows;
 *                no permissions at all → everything
 * Cached per user for 60 s because it is consulted on every request.
 */
const cache = new Map();   // userId → { at, scope }
const TTL = 60_000;
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ci = v => new RegExp('^\\s*' + esc(v) + '\\s*$', 'i');

export async function resolveScope(user) {
  if (!user) return { all: false, dealerIds: [], salesmanIds: [], key: 'anon' };
  if (user.role === 'superadmin') return { all: true, dealerIds: null, salesmanIds: null, key: 'all' };
  const hit = cache.get(user.id);
  if (hit && Date.now() - hit.at < TTL) return hit.scope;

  const Dealer = mongoose.models.Dealer || (await import('../../models/Dealer.js')).default;
  const User   = mongoose.models.User   || (await import('../../models/User.js')).default;
  let scope;
  if (user.role === 'salesman') {
    const ds = await Dealer.find({ salesman: user.id }, '_id').lean();
    scope = { all: false, dealerIds: ds.map(d => String(d._id)), salesmanIds: [user.id], key: 'sm:' + user.id };
  } else {
    const u = await User.findOne({ id: user.id }, 'permissions').lean();
    const p = u?.permissions || {};
    const has = k => Array.isArray(p[k]) && p[k].length > 0;
    if (!has('states') && !has('cities') && !has('zones') && !has('salesmen')) {
      scope = { all: true, dealerIds: null, salesmanIds: null, key: 'all' };
    } else {
      const f = {}; const geo = [];
      if (has('states')) geo.push({ state: { $in: p.states.map(ci) } });
      if (has('cities')) geo.push({ city:  { $in: p.cities.map(ci) } });
      if (has('zones'))  geo.push({ zone:  { $in: p.zones.map(ci) } });
      if (geo.length) f.$or = geo;
      if (has('salesmen')) f.salesman = { $in: p.salesmen };
      const ds = await Dealer.find(f, '_id').lean();
      scope = { all: false, dealerIds: ds.map(d => String(d._id)), salesmanIds: has('salesmen') ? p.salesmen : null, key: 'u:' + user.id };
    }
  }
  cache.set(user.id, { at: Date.now(), scope });
  return scope;
}

/** Add the scope to a Mongo filter on `dealerId`. */
export function scopeFilter(scope, field = 'dealerId') {
  if (scope.all) return {};
  return { [field]: { $in: scope.dealerIds.map(id => new mongoose.Types.ObjectId(id)) } };
}
export function inScope(scope, dealerId) {
  return scope.all || scope.dealerIds.includes(String(dealerId));
}
export function clearScopeCache(userId) { if (userId) cache.delete(userId); else cache.clear(); }
