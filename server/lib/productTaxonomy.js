/**
 * productTaxonomy — normalisation helpers shared by the Product Master and
 * Product Transaction imports.
 *
 * The ERP's "Category Type" / "Product Type" columns line up almost exactly
 * with the app's own Category / Sub-Category taxonomy (see
 * routes/categories.js DEFAULT_TAXONOMY). The differences are spelling only,
 * so they are handled by an explicit alias table — nothing is inferred.
 */

/** ERP Category Type → app Category. */
export const CATEGORY_ALIASES = {
  'LOUVERS': 'LOUVRES',   // ERP spells it with an E, the app with RE
  'OTHERS':  'OTHER',
};

/** ERP Product Type → app Sub-Category. */
export const SUBCATEGORY_ALIASES = {
  'FOLDERS': 'FOLDER',
  'OTHERS':  'OTHER',
};

const S = v => String(v ?? '').trim();
const U = v => S(v).toUpperCase().replace(/\s+/g, ' ');

/** Map an ERP "Category Type" onto the app's Category name. */
export function normCategory(v) {
  const k = U(v);
  if (!k) return '';
  return CATEGORY_ALIASES[k] || k;
}

/** Map an ERP "Product Type" onto the app's Sub-Category name. */
export function normSubCategory(v) {
  const k = U(v);
  if (!k) return '';
  return SUBCATEGORY_ALIASES[k] || k;
}

/**
 * Parse the ERP date cell, which looks like "02-09-2026 | 12:35 PM"
 * (DD-MM-YYYY). Returns { date, dateStr, month, timeStr } or nulls.
 */
export function parseErpDate(raw) {
  const s = S(raw);
  if (!s) return { date: null, dateStr: '', month: '', timeStr: '' };
  const [datePart, timePart = ''] = s.split('|').map(x => x.trim());
  const m = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (!m) return { date: null, dateStr: '', month: '', timeStr: timePart };
  const [, dd, mm, yyyy] = m;
  const D = dd.padStart(2, '0'), M = mm.padStart(2, '0');
  const dateStr = `${yyyy}-${M}-${D}`;
  // Midday UTC keeps the calendar day stable regardless of server timezone.
  const date = new Date(`${dateStr}T12:00:00Z`);
  return {
    date: isNaN(date) ? null : date,
    dateStr,
    month: `${yyyy}-${M}`,
    timeStr: timePart,
  };
}

/** Loose key for comparing company / person names across systems. */
export function nameKey(s) {
  return U(s)
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\b(PVT|PRIVATE|LTD|LIMITED|LLP|AND|THE|SEQUENCE|SURFACE|SURFACES)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * ERP "Sales Person" values arrive with the name repeated, e.g.
 * "Rakesh Boriwal Rakesh Boriwal Sequence" or "Kennady Kennady".
 * Collapse the immediate repetition so the value can be matched to a user.
 */
export function dedupeSalesPerson(raw) {
  const k = nameKey(raw);
  if (!k) return '';
  const t = k.split(' ');
  // Find the shortest prefix that, repeated, covers the whole string.
  for (let n = 1; n <= Math.floor(t.length / 2); n++) {
    const head = t.slice(0, n).join(' ');
    if (t.slice(n, n * 2).join(' ') === head) return head;
  }
  return k;
}

/**
 * Match an ERP sales-person string to one of the app's users.
 * Returns the user's `name`, or '' when there is no confident match —
 * an unmatched salesman is parked, never guessed.
 */
export function matchSalesman(raw, users) {
  const k = dedupeSalesPerson(raw);
  if (!k) return '';
  const full = nameKey(raw);
  for (const u of users) {
    const un = nameKey(u.name);
    if (!un) continue;
    if (un === k || un === full) return u.name;
  }
  // Fall back to first-token match (app users are stored as short first names).
  const first = k.split(' ')[0];
  const hits = users.filter(u => {
    const un = nameKey(u.name);
    return un && (un === first || un.split(' ')[0] === first);
  });
  return hits.length === 1 ? hits[0].name : '';
}

export { S as str, U as upper };
