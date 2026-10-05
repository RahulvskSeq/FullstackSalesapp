import { useEffect, useState } from 'react';
import { api } from '../api';
import { useGlobalCategoryFilter } from './useGlobalCategoryFilter';
import { targetFactor, withRolls } from '../lib/targetRule';

// Month totals per salesman from GET /api/sales/month-totals — counted on the dealers
// each salesman owned THAT month, the same rule as the admin salesman cards, so a
// salesman's own Home and the admin view show the same numbers.
const TTL = 2 * 60e3;
const cache = new Map();   // "YYYY-MM|excluded" → { at, v, p }

function load(key, ym, ex) {
  const hit = cache.get(key);
  if (hit && (hit.p || Date.now() - hit.at < TTL)) return hit.p || Promise.resolve(hit.v);
  const p = api.salesMonthTotals(ym, ex)
    .then(v => { cache.set(key, { at: Date.now(), v }); return v; })
    .catch(e => { cache.delete(key); throw e; });
  cache.set(key, { ...(hit || {}), p });
  return p;
}

export function useMonthTotals(ym) {
  const { excluded } = useGlobalCategoryFilter();
  const ex = [...excluded].sort();
  const key = ym ? ym + '|' + ex.join(',') : '';
  const [state, setState] = useState(() => ({ key, data: cache.get(key)?.v || null }));
  useEffect(() => {
    if (!key) return;
    let dead = false;
    load(key, ym, ex).then(v => { if (!dead) setState({ key, data: v }); }).catch(() => {});
    return () => { dead = true; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data: state.key === key ? state.data : cache.get(key)?.v || null, filterOn: ex.length > 0, excluded };
}

// Target / achieved to show for the viewer, or null to keep the dealer-list sums.
// Target is always the dealer target; with a category filter on, achieved counts
// only the selected categories.
//   salesman            → his own row
//   office, sm picked   → that salesman's row
export function pickTotals(data, filterOn, { user, isStaff, sm, excluded } = {}) {
  if (!data || !Array.isArray(data.rows)) return null;
  const cat = filterOn && data.hasSales;
  // the dealer target is a laminate target: scaled to the selected categories, + Rolls per salesman
  const f = targetFactor(excluded || new Set());
  const one = r => ({ target: withRolls(Math.round((r.dealerTarget || 0) * f), excluded || new Set(), (r.dealerTarget || 0) > 0), achieved: cat ? r.catAchieved : r.dealerAchieved });
  const p = user?.permissions || {};
  if (!isStaff) {
    // granted a wider book: the dealer list is the truth
    if (['states', 'cities', 'zones', 'salesmen'].some(k => Array.isArray(p[k]) && p[k].length)) return null;
    const r = data.rows.find(x => x.salesmanId === user?.id);
    return r ? one(r) : null;
  }
  const r = sm && data.rows.find(x => x.salesmanId === sm);
  return r ? one(r) : null;
}
