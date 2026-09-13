/**
 * Period and party normalisation. Pure functions — no database, fully unit-tested.
 *
 * A period is 'YYYY-MM'. The special period 'OLDER' is a bucket for amounts
 * older than the file's first named month (the templates carry an "OLD" column).
 */
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
export const OLDER = 'OLDER';

const pad = n => String(n).padStart(2, '0');
export const ym = (y, mi) => `${y}-${pad(mi + 1)}`;                    // mi 0-based
export const ymOfDate = d => ym(d.getFullYear(), d.getMonth());
export const ymdOfDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayYmd = () => ymdOfDate(new Date());

/** 'aug', 'August', '(3)\r\nAug', 'AUG', 'Sept' → 0-based index, or -1. */
export function monthIndex(s) {
  const t = String(s || '').toLowerCase().replace(/^\(\s*\d+\s*\)/, '').replace(/[^a-z]/g, ' ').trim();
  const w = t.split(/\s+/).find(Boolean) || '';
  if (!w) return -1;
  const i = MONTHS.findIndex(m => w.startsWith(m));
  return i;
}

/**
 * Parse one header cell to { mi, year|null } or { older:true } or null.
 * Handles Date objects, ISO strings, Excel serials, 'Aug-26', 'Aug 2026',
 * '2026-08', 'August', '(3)\nAug', 'OLD'.
 */
export function parsePeriodHeader(h) {
  if (h instanceof Date && !isNaN(h)) return { mi: h.getMonth(), year: h.getFullYear() };
  const raw = String(h ?? '').trim();
  if (!raw) return null;
  if (/^(old|older|previous|opening|b\/?f|earlier)\b/i.test(raw)) return { older: true };
  let m;
  if ((m = /^(\d{4})-(\d{2})(?:-\d{2})?(?:T.*)?$/.exec(raw))) return { mi: +m[2] - 1, year: +m[1] };
  if ((m = /^(\d{1,2})[-\/](\d{4})$/.exec(raw))) return { mi: +m[1] - 1, year: +m[2] };            // 08/2026
  const n = Number(raw);
  if (Number.isFinite(n) && n > 20000 && n < 80000) {                                             // Excel serial
    const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
    return { mi: d.getUTCMonth(), year: d.getUTCFullYear() };
  }
  const mi = monthIndex(raw);
  if (mi < 0) return null;
  const y = /(?:^|[^\d])((?:20)?\d{2})\s*$/.exec(raw.replace(/^\(\s*\d+\s*\)/, ''));
  let year = null;
  if (y) { const yy = +y[1]; year = yy < 100 ? 2000 + yy : yy; }
  return { mi, year };
}

/**
 * Resolve a row of header cells to periods, inferring years for bare month
 * names so the sequence ascends and ends no later than `asOn`.
 * Returns an array aligned to `headers`: 'YYYY-MM' | 'OLDER' | null.
 */
export function resolvePeriods(headers, { asOn } = {}) {
  const ref = asOn ? new Date(asOn + 'T00:00:00') : new Date();
  const refY = ref.getFullYear(), refMi = ref.getMonth();
  const parsed = headers.map(parsePeriodHeader);
  const out = new Array(headers.length).fill(null);
  // Explicit years stand on their own. Bare months form their own ascending
  // sequence anchored to asOn: right to left, the latest bare month is the
  // most recent one not after asOn, and each earlier bare month steps back a
  // year whenever its month index does not descend. A bare month is never
  // inferred from an explicit-year neighbour — a file can carry two blocks
  // of columns (the template does), and the blocks are not one sequence.
  let curY = null, curMi = null;
  for (let i = parsed.length - 1; i >= 0; i--) {
    const p = parsed[i];
    if (!p) continue;
    if (p.older) { out[i] = OLDER; continue; }
    if (p.year !== null) { out[i] = ym(p.year, p.mi); continue; }
    const year = curY === null ? ((p.mi <= refMi) ? refY : refY - 1)
                               : ((p.mi < curMi) ? curY : curY - 1);
    out[i] = ym(year, p.mi);
    curY = year; curMi = p.mi;
  }
  return out;
}

/** Chronological sort key; OLDER sorts first, unknown last. */
export const periodKey = p => p === OLDER ? -1 : (/^\d{4}-\d{2}$/.test(p) ? (+p.slice(0, 4)) * 12 + (+p.slice(5) - 1) : 1e9);
export const sortPeriods = ps => [...ps].sort((a, b) => periodKey(a) - periodKey(b));

/** Whole months between a period and a day (for ageing). */
export function monthsBetween(period, asOnYmd) {
  if (period === OLDER || !/^\d{4}-\d{2}$/.test(period)) return null;
  const a = new Date(asOnYmd + 'T00:00:00');
  return (a.getFullYear() - +period.slice(0, 4)) * 12 + (a.getMonth() - (+period.slice(5) - 1));
}
export function daysSincePeriodStart(period, asOnYmd) {
  if (period === OLDER || !/^\d{4}-\d{2}$/.test(period)) return null;
  const start = new Date(+period.slice(0, 4), +period.slice(5) - 1, 1);
  return Math.max(0, Math.round((new Date(asOnYmd + 'T00:00:00') - start) / 86400000));
}

/** 'CASA LUSSO-SSL14140', 'CASA LUSSO - SSL 14140', 'CASA LUSSO (SSL14140)' → { name, code }. */
export function parseParty(raw) {
  const s = String(raw ?? '').replace(/\s+/g, ' ').trim();
  // Anything after the code ("… -SSL15821 (ONLY DISPLAY)") is a remark the ERP
  // user typed, not part of the name; the raw text is kept on the row anyway.
  const m = /^(.*?)[\s\-–—(]*\(?\s*(SSL\s*\d{3,})\s*\)?(?:[\s\-–—(].*)?$/i.exec(s);
  if (m && m[1].trim()) return { name: m[1].replace(/[\s\-–—]+$/, '').trim(), code: m[2].replace(/\s+/g, '').toUpperCase() };
  const c = /^(SSL\s*\d{3,})$/i.exec(s);
  if (c) return { name: '', code: c[1].replace(/\s+/g, '').toUpperCase() };
  return { name: s, code: '' };
}

/** Case, spacing and punctuation-insensitive name key. Never fuzzy. */
export const normName = s => String(s ?? '').toLowerCase().replace(/[.,'"&/\-–—()]/g, ' ').replace(/\s+/g, ' ').trim();

/** Rows that are not parties: totals, headers repeated, blank, numeric. */
export function isNoiseParty(name) {
  const n = String(name || '').trim().toLowerCase();
  if (n.length < 2) return true;
  if (/^[\d\s,.₹()-]+$/.test(n)) return true;
  return ['total', 'totals', 'grand total', 'sub total', 'dealer name', 'dealer', 'name', 'party name', 'party'].includes(n);
}
