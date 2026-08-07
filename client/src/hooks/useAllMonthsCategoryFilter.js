import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useGlobalCategoryFilter } from './useGlobalCategoryFilter';

/**
 * useAllMonthsCategoryFilteredDealers — adjusts EVERY month in each dealer's
 * `months` array by subtracting the qty of any globally-excluded categories
 * for that month, and recomputes `avg6m` from the adjusted figures.
 *
 * This is the app-wide category filter: All Dealers, Overview, Monthly Trend,
 * Compare, MapView, Reports and Admin Panel all read the result, so picking a
 * category is reflected on every page and in every month column.
 *
 * Months from BEFORE the category feature went live have no Sale rows, so
 * there is nothing to subtract and they pass through at their original value.
 * That's deliberate — those months predate category tracking and can't be
 * broken down, so they must not be zeroed or scaled.
 *
 * When nothing is excluded it returns the input array unchanged (cheap
 * pass-through, no fetch) and each dealer keeps its stored `avg6m`.
 */

/**
 * Mean of the 6 months ending at `endIdx` (inclusive), over the adjusted
 * months array. Divides by the number of months actually in the window, so a
 * dealer near the start of the timeline isn't penalised by missing history.
 */
function avg6(months, endIdx) {
  const hi = Math.min(endIdx, (months?.length || 0) - 1);
  if (hi < 0) return 0;
  const lo = Math.max(0, hi - 5);
  let sum = 0;
  for (let i = lo; i <= hi; i++) sum += Number(months[i]) || 0;
  return Math.round(sum / (hi - lo + 1));
}

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

export function useAllMonthsCategoryFilteredDealers(dealers, MO, selectedMonthIdx = null) {
  const { excluded } = useGlobalCategoryFilter();
  const excludedKey = useMemo(() => [...(excluded || [])].sort().join('|'), [excluded]);

  // Per-dealer × per-month category breakdown for the current selection.
  const [cat, setCat] = useState(null);   // { included, monthsWithData:Set }
  useEffect(() => {
    if (!excluded || excluded.size === 0) { setCat(null); return; }
    let cancelled = false;
    api.salesByDealerMonths([...excluded])
      .then(r => {
        if (cancelled) return;
        setCat({
          included:      r.includedByDealerMonth || {},
          totalByMonth:  r.includedTotalByMonth  || {},
          monthsWithData:new Set(r.monthsWithCategoryData || []),
        });
      })
      .catch(() => { if (!cancelled) setCat({ included:{}, totalByMonth:{}, monthsWithData:new Set() }); });
    return () => { cancelled = true; };
  }, [excludedKey]); // eslint-disable-line

  // Map each MO label → its YYYY-MM key once.
  const ymOf = useMemo(() => (MO || []).map(moToYM), [MO]);

  const filtered = useMemo(() => {
    if (!excluded || excluded.size === 0 || !cat) return dealers;
    if (!Array.isArray(dealers)) return dealers;

    const endIdx = (selectedMonthIdx == null || selectedMonthIdx < 0)
      ? (MO?.length || 0) - 1
      : selectedMonthIdx;

    return dealers.map(d => {
      const per    = cat.included[String(d.name || '').toLowerCase().trim()] || null;
      const months = Array.isArray(d.months) ? d.months : [];
      const next = months.map((v, i) => {
        const ym = ymOf[i];
        // Month predates category tracking — no breakdown exists, so the
        // stored achieved stands untouched.
        if (!ym || !cat.monthsWithData.has(ym)) return v;
        // Month HAS category data: the included-category qty IS the value.
        // A dealer with no rows for an included category genuinely sold none
        // of it that month, so 0 is the right answer — not the raw achieved.
        return per?.[ym] || 0;
      });
      // Recompute the 6-month average off the adjusted figures. Every dealer
      // gets the computed value while a filter is active, so the column isn't
      // a mix of stored and derived numbers.
      return { ...d, months: next, avg6m: avg6(next, endIdx) };
    });
  }, [dealers, excluded, cat, ymOf, selectedMonthIdx, MO]);

  // `dealers` — the category-adjusted array.
  // `includedTotalByMonth` — { 'YYYY-MM': qty } across ALL Sale rows, so a
  //   headline total can be read straight from it instead of summing the
  //   per-dealer rows. Those two differ whenever a Sale row's dealerName
  //   matches no dealer record; this is the figure the Category-wise Sales
  //   panel shows, so use it wherever the two must agree.
  //   null when no category filter is active.
  return useMemo(() => ({
    dealers: filtered,
    includedTotalByMonth: (excluded && excluded.size > 0 && cat) ? (cat.totalByMonth || {}) : null,
  }), [filtered, excluded, cat]);
}
