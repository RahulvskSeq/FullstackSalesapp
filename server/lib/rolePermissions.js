import Setting from '../models/Setting.js';

/**
 * Role-level defaults for pages and actions.
 *
 * A user with no explicit page / action list falls back to their role. The
 * role's own lists live here, set by a superadmin under Settings →
 * Permissions → Roles. An empty list for a role means "the built-in
 * default" (the code's legacy behaviour), so nothing changes until someone
 * ticks a box. Per-user lists still override the role, as before.
 *
 *   Setting `rolePermissions` = { salesman:{pages:[],features:[]}, employee:{…}, admin:{…} }
 */
export const SETTING_KEY = 'rolePermissions';
export const ROLES = ['salesman', 'employee', 'admin'];

let cache = { at: 0, value: null };
export async function loadRolePermissions({ fresh = false } = {}) {
  if (!fresh && cache.value && Date.now() - cache.at < 10_000) return cache.value;
  const s = await Setting.findOne({ key: SETTING_KEY }).lean();
  const v = s?.value && typeof s.value === 'object' ? s.value : {};
  const out = {};
  for (const r of ROLES) {
    const e = v[r] || {};
    out[r] = {
      pages:    Array.isArray(e.pages)    ? e.pages.filter(x => typeof x === 'string')    : [],
      features: Array.isArray(e.features) ? e.features.filter(x => typeof x === 'string') : [],
    };
  }
  cache = { at: Date.now(), value: out };
  return out;
}

export async function saveRolePermissions(map) {
  const clean = {};
  for (const r of ROLES) {
    const e = (map && map[r]) || {};
    clean[r] = {
      pages:    [...new Set((Array.isArray(e.pages) ? e.pages : []).map(String).filter(Boolean))],
      features: [...new Set((Array.isArray(e.features) ? e.features : []).map(String).filter(Boolean))],
    };
  }
  await Setting.findOneAndUpdate({ key: SETTING_KEY }, { $set: { value: clean } }, { upsert: true });
  cache = { at: 0, value: null };
  return clean;
}
