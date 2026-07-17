import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useGlobalCategoryFilter } from './useGlobalCategoryFilter';

/**
 * useAllMonthsCategoryFilteredDealers — like useFilteredDealers, but adjusts
 * EVERY month in each dealer's `months` array (not just the current one) by
 * subtracting the qty of any globally-excluded categories for that month.
 *
 * This powers pages that show a full timeline (Monthly Trend, Admin Panel's
 * per-salesman history) so the category filter is reflected across all months,
 * not only the selected one.
 *
 * When nothing is excluded it returns the input array unchanged (cheap
 * pass-through, no fetch).
 */

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
export function moToYM(lbl) {
  if (!lbl) return '';
  const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(String(lbl).trim());
  if (!m) return '';
  const mi = MONTHS.indexOf(m[1].slice(0,3).toLowerCase());
  if (mi < 0) return '';
  let y = +m[2]; if (y < 100) y += 2000;
  return `${y}-${String(mi+1).padStart(2,'0')}`;
}

export function useAllMonthsCategoryFilteredDealers(dealers, MO) {
  const { excluded } = useGlobalCategoryFilter();
  const excludedKey = useMemo(() => [...(excluded || [])].sort().join('|'), [excluded]);

  // Fetch per-dealer × per-month excluded-category qty for the current selection.
  const [byDealerMonth, setByDealerMonth] = useState(null);
  useEffect(() => {
    if (!excluded || excluded.size === 0) { setByDealerMonth(null); return; }
    let cancelled = false;
    api.salesByDealerMonths([...excluded])
      .then(r => { if (!cancelled) setByDealerMonth(r.byDealerMonth || {}); })
      .catch(() => { if (!cancelled) setByDealerMonth({}); });
    return () => { cancelled = true; };
  }, [excludedKey]); // eslint-disable-line

  // Map each MO label → its YYYY-MM key once.
  const ymOf = useMemo(() => (MO || []).map(moToYM), [MO]);

  return useMemo(() => {
    if (!excluded || excluded.size === 0 || !byDealerMonth) return dealers;
    if (!Array.isArray(dealers)) return dealers;
    return dealers.map(d => {
      const per = byDealerMonth[String(d.name || '').toLowerCase().trim()];
      if (!per) return d;
      const months = Array.isArray(d.months) ? d.months : [];
      let changed = false;
      const next = months.map((v, i) => {
        const q = per[ymOf[i]] || 0;
        if (!q) return v;
        changed = true;
        return Math.max(0, (Number(v) || 0) - q);
      });
      return changed ? { ...d, months: next } : d;
    });
  }, [dealers, excluded, byDealerMonth, ymOf]);
}
