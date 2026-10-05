// Dealer targets are LAMINATE targets. With the category filter, a dealer's target for
// the selected categories is worked out from it — the same ratios the category targets
// use (Sales by Category → "Typing a LAMINATE target fills the rest"):
//   Laminate 100% · Liner 100% · Louvres 30% · Polymer Sheet 10% · anything else 0
// Rolls is not a share of laminate: a flat ROLLS_PER_SALESMAN on each salesman's total.
export const TARGET_RATIO = { 'LAMINATE': 1, 'LINER': 1, 'LOUVRES': 0.3, 'POLYMER SHEET': 0.1 };
export const ROLLS_PER_SALESMAN = 35;

const has = (excluded, c) => !!excluded && (typeof excluded.has === 'function' ? excluded.has(c) : excluded.includes?.(c));
/** How much of a laminate target the selected categories add up to (all selected → 2.4). */
export const targetFactor = excluded => Object.entries(TARGET_RATIO).reduce((a, [c, r]) => a + (has(excluded, c) ? 0 : r), 0);
/** Is Rolls among the selected categories? */
export const rollsOn = excluded => !has(excluded, 'ROLLS');
/** A salesman total with Rolls added — when Rolls is selected and he has a (laminate) target at all. */
export const withRolls = (total, excluded, hasTarget = total > 0) => (hasTarget && rollsOn(excluded) ? total + ROLLS_PER_SALESMAN : total);
/** The dealer's entered (laminate) target for a month, before any category scaling. */
export const lamTarget = (d, idx) => Number((d?.monthTargetsRaw || d?.monthTargets)?.[idx]) || 0;

/** The categories a dealer target splits into, in display order. */
export const TARGET_CATS = [['LAMINATE','Laminate'],['LINER','Liner'],['LOUVRES','Louvres'],['POLYMER SHEET','Polymer']];
/** One dealer's laminate target split by category: [{cat, label, value}]. */
export const catTargets = lam => TARGET_CATS.map(([cat, label]) => ({ cat, label, value: Math.round((Number(lam) || 0) * TARGET_RATIO[cat]) }));
/** Factor for a set of INCLUDED categories (empty = every category). */
export const includedFactor = included => (!included || included.size === 0) ? targetFactor(null)
  : Object.entries(TARGET_RATIO).reduce((a, [c, r]) => a + (included.has(c) ? r : 0), 0);
