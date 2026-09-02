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

/* ------------------------------------------------------------------
   Dealer-name matching

   The ERP and the app hold the same companies under cosmetically
   different names: "M/S. SHREE RAM PLY & BOARDS" vs "SHREE RAM PLY
   AND BOARDS". Matching therefore strips everything that is not a
   letter or a digit, and drops legal-form words that carry no
   identity, before comparing.
   ------------------------------------------------------------------ */

/** Words that say nothing about which company this is. */
const NOISE = new Set([
  'PVT', 'PRIVATE', 'LTD', 'LIMITED', 'LLP', 'INC', 'CORP',
  'AND', 'THE', 'MS', 'M', 'S', 'CO',
]);

/**
 * Aggressive identity key: upper-cased, legal-form words removed, then
 * every non-alphanumeric character (spaces included) stripped out.
 * "M/s. Shree-Ram Ply & Boards Pvt Ltd" -> "SHREERAMPLYBOARDS"
 */
export function dealerKey(s) {
  const words = String(s ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w && !NOISE.has(w));
  return words.join('');
}

/** Levenshtein distance, capped for speed on long strings. */
function lev(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/** 0..1 similarity between two identity keys. */
export function similarity(a, b) {
  if (!a || !b) return 0;
  const n = Math.max(a.length, b.length);
  return n === 0 ? 1 : 1 - lev(a, b) / n;
}

/**
 * Match one ERP party name against the app's dealers.
 *
 * Returns { dealer, score, reason, runnerUp }. A match is only returned
 * when it is unambiguous: either the identity keys are identical, or the
 * best candidate clears MIN_SCORE *and* beats the next-best by MARGIN.
 * A near-tie is reported instead of guessed — attaching a sale to the
 * wrong dealer is far worse than leaving it parked.
 *
 * `index` is a Map of dealerKey -> dealer, `list` the [key, dealer] pairs.
 */
export const MIN_SCORE = 0.90;
export const MARGIN = 0.04;

export function matchDealer(rawName, index, list, memo) {
  const key = dealerKey(rawName);
  if (!key) return { dealer: null, score: 0, reason: 'empty' };
  if (memo?.has(key)) return memo.get(key);

  let out;
  const exact = index.get(key);
  if (exact) {
    out = { dealer: exact, score: 1, reason: 'exact' };
  } else {
    let best = null, bestScore = 0, second = 0, runnerUp = null;
    for (const [k, d] of list) {
      // Length prefilter: a 90% match cannot differ in length by more than 10%.
      if (Math.abs(k.length - key.length) > Math.ceil(key.length * 0.15)) continue;
      const s = similarity(key, k);
      if (s > bestScore) { second = bestScore; runnerUp = best; best = d; bestScore = s; }
      else if (s > second) { second = s; runnerUp = d; }
    }
    if (best && bestScore >= MIN_SCORE && (bestScore - second) >= MARGIN) {
      out = { dealer: best, score: bestScore, reason: 'fuzzy' };
    } else {
      out = {
        dealer: null, score: bestScore, reason: bestScore >= MIN_SCORE ? 'ambiguous' : 'no-match',
        suggestion: best?.name || '', runnerUp: runnerUp?.name || '',
      };
    }
  }
  memo?.set(key, out);
  return out;
}
