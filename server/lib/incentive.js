/**
 * incentive.js — what a billing person earns on the units they billed.
 *
 * Each person is measured against THEIR OWN recent record, not a fixed
 * company-wide number: the threshold is their average monthly units over the
 * preceding months (6 by default). Someone who normally bills 600 and someone
 * who normally bills 2,600 are both being asked to beat themselves.
 *
 * With the defaults, for a person whose average is A:
 *
 *   up to A            ₹0.50 each
 *   A+1 … A+500        the first A at ₹0.50, the rest at ₹1.00
 *   beyond A+500       ₹1.00 on EVERY unit, including the first A
 *
 * The last line is the part to watch: passing the second threshold does not
 * just price the excess, it re-prices everything already billed, so the payout
 * jumps rather than rising smoothly. For A = 2,000:
 *
 *   2,500 units → ₹1,500
 *   2,501 units → ₹2,501      (one more unit is worth ₹1,001)
 *
 * That mirrors the scheme this replaces and was confirmed before it was
 * written. The UI says it in words, because a cliff that size reads as a bug.
 *
 * Earnings are also expressed in POINTS so people can track them without
 * thinking in rupees: pointsPerRupee (2 by default) means ₹1 = 2 points.
 *
 * Everything here is configurable and stored in the database (Setting key
 * `incentiveConfig`) — rates and thresholds are a business decision that
 * should not need a deploy.
 */

export const DEFAULT_CONFIG = {
  rateLow:        0.50,   // ₹ per unit up to the person's average
  rateHigh:       1.00,   // ₹ per unit above it
  bandWidth:      500,    // how far past the average the middle band runs
  lookbackMonths: 6,      // months of history the average is taken over
  pointsPerRupee: 2,      // 2 points = ₹1
  // A floor for people with little or no history. Without it someone's first
  // month would have an average of 0, so every unit would land in the top band
  // and pay ₹1 — the scheme would reward having no record.
  minAverage:     100,
  // A starting bar per person, used only until they have real history.
  //
  // The average needs months of ERP data behind it, and billing-person data
  // only begins when the "Created By" import starts. Without this, everyone's
  // first months would compute an average of 0, land in the top band, and pay
  // ₹1 on every unit — the scheme would pay the most to the people it knows
  // the least about. Real history replaces these the moment it exists.
  openingAverage: {},
  // Spellings that mean the same person. The ERP writes "SAHANA SEQUENCE
  // SURFACE", "Lavanya Shetty", "Shashi Kala"; left alone each becomes its own
  // row, and splitting one person's units across two rows pays LESS than one
  // combined total, because the rate bands are reached later.
  // Keyed lowercase, matched after the company words have been stripped.
  aliases: {
    'lavanya shetty': 'Lavanya',
    'shashi kala':    'Shashikala',
  },
  // Words that are the company, not part of anybody's name.
  companyWords: ['sequence surfaces', 'sequence surface'],
  // Who raises the invoices for each salesman. Only a fallback: the ERP's
  // "Created By" column is used when present, and that is the real biller.
  // Keyed on salesman id, which is stable where the display name is not.
  mapping: {
    rakesh:  'Lavanya',
    pranav:  'Sahana',
    ratish:  'Anu',
    senthil: 'Shashikala',
    joseph:  'Shashikala',
    kenadi:  'Shashikala',
    udai:    'Sridevi',
  },
};

const round2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => Number(n).toLocaleString('en-IN');
const money = (n) => '₹' + Number(n).toFixed(2);

/** Fill in anything missing and coerce types, so a partial save can't break the maths. */
export function normaliseConfig(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const num = (v, d, min = 0) => { const n = Number(v); return Number.isFinite(n) && n >= min ? n : d; };
  const mapping = {};
  const src = (c.mapping && typeof c.mapping === 'object') ? c.mapping : DEFAULT_CONFIG.mapping;
  for (const [k, v] of Object.entries(src)) {
    const id = String(k || '').trim().toLowerCase();
    const person = String(v || '').trim();
    if (id && person) mapping[id] = person;
  }
  const openingAverage = {};
  const oa = (c.openingAverage && typeof c.openingAverage === 'object') ? c.openingAverage : {};
  for (const [k, v] of Object.entries(oa)) {
    const name = String(k || '').trim();
    const n = Math.round(Number(v) || 0);
    if (name && n > 0) openingAverage[name] = n;
  }
  const aliases = {};
  const al = (c.aliases && typeof c.aliases === 'object') ? c.aliases : DEFAULT_CONFIG.aliases;
  for (const [k, v] of Object.entries(al)) {
    const from = String(k || '').trim().toLowerCase();
    const to = String(v || '').trim();
    if (from && to) aliases[from] = to;
  }
  const companyWords = (Array.isArray(c.companyWords) && c.companyWords.length
    ? c.companyWords : DEFAULT_CONFIG.companyWords)
    .map(w => String(w || '').trim().toLowerCase()).filter(Boolean)
    // Longest first, so "sequence surfaces" is taken before "sequence surface"
    // can bite off its prefix.
    .sort((a, b) => b.length - a.length);
  return {
    openingAverage, aliases, companyWords,
    rateLow:        num(c.rateLow,  DEFAULT_CONFIG.rateLow),
    rateHigh:       num(c.rateHigh, DEFAULT_CONFIG.rateHigh),
    bandWidth:      Math.round(num(c.bandWidth, DEFAULT_CONFIG.bandWidth)),
    lookbackMonths: Math.max(1, Math.round(num(c.lookbackMonths, DEFAULT_CONFIG.lookbackMonths, 1))),
    pointsPerRupee: num(c.pointsPerRupee, DEFAULT_CONFIG.pointsPerRupee),
    minAverage:     Math.round(num(c.minAverage, DEFAULT_CONFIG.minAverage)),
    mapping,
  };
}

/** The two thresholds for someone whose recent average is `average`. */
export function bandsFor(average, config = DEFAULT_CONFIG) {
  const c = normaliseConfig(config);
  const base = Math.max(c.minAverage, Math.round(Number(average) || 0));
  return { base, top: base + c.bandWidth };
}

/**
 * @param {number} units    units billed this period
 * @param {number} average  that person's average monthly units before it
 */
export function incentiveFor(units, average, config = DEFAULT_CONFIG) {
  const c = normaliseConfig(config);
  const u = Math.max(0, Math.round(Number(units) || 0));
  const { base, top } = bandsFor(average, c);

  let amount, band, detail;
  if (u > top) {
    amount = u * c.rateHigh;
    band = 'top';
    detail = `${fmt(u)} × ${money(c.rateHigh)} (all units re-rated)`;
  } else if (u > base) {
    const excess = u - base;
    amount = base * c.rateLow + excess * c.rateHigh;
    band = 'mid';
    detail = `${fmt(base)} × ${money(c.rateLow)} + ${fmt(excess)} × ${money(c.rateHigh)}`;
  } else {
    amount = u * c.rateLow;
    band = 'base';
    detail = `${fmt(u)} × ${money(c.rateLow)}`;
  }
  amount = round2(amount);
  return {
    units: u, average: base, base, top, band, detail,
    amount,
    points: Math.round(amount * c.pointsPerRupee),
  };
}

/** How many more units until the payout jumps, and by how much. */
export function nextThreshold(units, average, config = DEFAULT_CONFIG) {
  const c = normaliseConfig(config);
  const u = Math.max(0, Math.round(Number(units) || 0));
  const { base, top } = bandsFor(average, c);
  if (u > top) return null;                        // already in the top band
  const target = u > base ? top + 1 : base + 1;
  const now = incentiveFor(u, average, c);
  const then = incentiveFor(target, average, c);
  const gain = round2(then.amount - now.amount);
  if (gain <= 0) return null;                      // rates equal — no step to show
  return {
    unitsAway: target - u,
    at: target,
    gain,
    points: then.points - now.points,
  };
}

/* Compiled company-word patterns, cached: canonicalPerson runs once per sheet
 * row and a large sheet is tens of thousands of rows. */
const reCache = new Map();
function companyRe(word) {
  let re = reCache.get(word);
  if (!re) {
    re = new RegExp(
      '\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*') + '\\b',
      'gi');
    reCache.set(word, re);
  }
  return re;
}

/**
 * One spelling per person.
 *
 * Strips the company words, tidies spacing and case, then applies an explicit
 * alias. Deliberately conservative — nothing beyond that is guessed, so two
 * genuinely different people are never merged by an over-eager rule. A name it
 * does not recognise is passed through tidied but otherwise untouched.
 *
 * Takes an already-normalised config (what getIncentiveConfig returns); it
 * falls back to the defaults rather than normalising again per row.
 */
export function canonicalPerson(raw, config = DEFAULT_CONFIG) {
  const aliases = (config && config.aliases) || DEFAULT_CONFIG.aliases;
  const words = (config && Array.isArray(config.companyWords) && config.companyWords.length)
    ? config.companyWords : DEFAULT_CONFIG.companyWords;
  let s = String(raw === null || raw === undefined ? '' : raw);
  for (const w of words) s = s.replace(companyRe(w), ' ');
  s = s.replace(/[-–—_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const titled = s.toLowerCase().replace(/\b[a-z]/g, ch => ch.toUpperCase());
  return aliases[titled.toLowerCase()] || titled;
}

/** The billing person for a line: the ERP's own value, else the mapping. */
export function billingPersonFor({ billedBy, salesmanId } = {}, config = DEFAULT_CONFIG) {
  const explicit = String(billedBy || '').trim();
  if (explicit) return explicit;
  const c = normaliseConfig(config);
  return c.mapping[String(salesmanId || '').trim().toLowerCase()] || '';
}

/** The `lookbackMonths` months immediately before `month` ("2026-09" → [...]). */
export function lookbackMonthsFor(month, config = DEFAULT_CONFIG) {
  const c = normaliseConfig(config);
  const m = /^(\d{4})-(\d{2})$/.exec(String(month || ''));
  if (!m) return [];
  let y = +m[1], mo = +m[2];
  const out = [];
  for (let i = 0; i < c.lookbackMonths; i++) {
    mo -= 1;
    if (mo === 0) { mo = 12; y -= 1; }
    out.push(`${y}-${String(mo).padStart(2, '0')}`);
  }
  return out.reverse();
}
