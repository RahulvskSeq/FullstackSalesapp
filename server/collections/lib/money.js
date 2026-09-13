/**
 * Money is whole rupees (integers), matching the rest of the application.
 * Accepts what spreadsheets actually contain: "1,23,456.00", "₹ 5,000",
 * "(500)" for a negative, "12,000 Dr", 12000, "", null.
 * Returns an integer, or NaN when the cell is not a number at all.
 */
export function toRupees(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : NaN;
  let s = String(v).trim();
  if (s === '' || s === '-' || s === '—') return 0;
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (/\bcr\b/i.test(s)) neg = true;           // credit balance
  s = s.replace(/\b(dr|cr)\b/ig, '').replace(/[₹,\s]/g, '');
  if (s.startsWith('-')) { neg = !neg; s = s.slice(1); }
  if (!/^\d*\.?\d+$/.test(s)) return NaN;
  const n = Math.round(parseFloat(s));
  return neg ? -n : n;
}
export const fmtINR = n => '₹' + Number(n || 0).toLocaleString('en-IN');
