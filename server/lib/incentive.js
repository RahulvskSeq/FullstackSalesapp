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
  lookbackMonths: 3,      // months of history the average is taken over
  // The target is the recent average plus this much. Beating your own past
  // average is not the bar — beating it by 10% is.
  targetUplift:   0.10,
  pointsPerRupee: 4,      // 1 point = ₹0.25, so 4 points = ₹1
  // Taken off what the rule works out, before it is paid. Kept as its own
  // step rather than folded into the rates so the screens can show what was
  // earned and what was deducted separately — a rate quietly reduced by 30%
  // is impossible to check against the scheme anybody agreed to.
  deductionPct:   0.30,
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
  // Words that are the company or the job, not part of anybody's name.
  companyWords: ['sequence surfaces', 'sequence surface', 'seq billing'],
  // Who is on the incentive.
  //
  // Taken from the billing users marked Active in the ERP. Anyone billing
  // under a name that is not on this list still has their units stored — they
  // are simply not scored or paid, and the screens say how many units that
  // covers so nothing disappears quietly. Excluding somebody never changes
  // anybody else's figure: each person is measured against their own average.
  //
  // Keep it current as people join and leave. An empty list means "everybody",
  // so a misconfiguration opens the gate rather than silently paying nobody.
  // Each entry is one person:
  //   key      the stored identity. Every IncentivePeriod row and every
  //            openingAverage is filed under this, so it must not be renamed
  //            casually — change it and that person's history detaches.
  //   name     what HR calls them, shown on screen.
  //   code     employee code, for matching against payroll.
  //   aliases  every spelling the ERP has written for them. Matched after the
  //            company words are stripped, so "SAHANA SEQUENCE SURFACE" only
  //            needs "sahana" here.
  roster: [
    { key: 'Sahana',      code: 'SSL 81',  name: 'Sahana V Naik',    aliases: ['sahana', 'sahana v'] },
    { key: 'Sridevi',     code: 'SSL 133', name: 'Sridevi Srinivas', aliases: ['sridevi'] },
    { key: 'Lavanya',     code: 'SSL 41',  name: 'Kc Lavanya Shetty',aliases: ['lavanya', 'lavanya shetty', 'kc lavanya'] },
    { key: 'Gajender',    code: 'SSL 80',  name: 'Gajendra Sarswat', aliases: ['gajender', 'gajendra', 'gajendra sarswat'] },
    { key: 'Shashikala',  code: 'SSL 84',  name: 'Shashikala P',     aliases: ['shashikala', 'shashi kala', 'shashikala p'] },
    { key: 'Anu',         code: 'SSL 149', name: 'Anu N',            aliases: ['anu', 'anu n'] },
    { key: 'Yogeeshwari', code: 'SSL 160', name: 'Yogeeshwari D M',  aliases: ['yogeeshwari', 'yogeeshwari d m'] },
    // On the ERP's Active billing list but not on the HR sheet — kept so their
    // units are still paid, and flagged on screen rather than dropped quietly.
    { key: 'Siji',        code: '',        name: 'Siji',             aliases: ['siji'] },
    { key: 'Manjula',     code: '',        name: 'Manjula',          aliases: ['manjula', 'manjula seq billing'] },
  ],
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
  // A roster saved before people had names is a plain array of strings; read
  // it as keys so an old config keeps working and nobody stops being paid.
  const rawRoster = Array.isArray(c.roster) ? c.roster : DEFAULT_CONFIG.roster;
  const seen = new Set();
  const roster = [];
  for (const r of rawRoster) {
    const e = (r && typeof r === 'object') ? r : { key: r };
    const key = String(e.key ?? '').trim();
    if (!key || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    roster.push({
      key,
      // Switched off rather than deleted: somebody who stops billing for a
      // month keeps their code, their name and every spelling the ERP has
      // used, so turning them back on needs no retyping and no re-upload.
      // Absent means on — a roster written before this existed still pays.
      active: e.active !== false,
      code: String(e.code ?? '').trim(),
      name: String(e.name ?? '').trim() || key,
      // The key and the display name are always matchable without anyone
      // having to remember to type them in as aliases as well.
      aliases: [...new Set([
        key.toLowerCase(),
        String(e.name ?? '').trim().toLowerCase(),
        ...(Array.isArray(e.aliases) ? e.aliases : [])
          .map(a => String(a ?? '').trim().toLowerCase()).filter(Boolean),
      ].filter(Boolean))],
    });
  }
  return {
    openingAverage, aliases, companyWords, roster,
    rateLow:        num(c.rateLow,  DEFAULT_CONFIG.rateLow),
    rateHigh:       num(c.rateHigh, DEFAULT_CONFIG.rateHigh),
    bandWidth:      Math.round(num(c.bandWidth, DEFAULT_CONFIG.bandWidth)),
    lookbackMonths: Math.max(1, Math.round(num(c.lookbackMonths, DEFAULT_CONFIG.lookbackMonths, 1))),
    // Clamped at 0: a negative uplift would set a target below the average,
    // paying the high rate for doing less than usual.
    targetUplift:   Math.max(0, num(c.targetUplift, DEFAULT_CONFIG.targetUplift, 0)),
    // Clamped to 0–1: a deduction above 100% would invert the payout.
    deductionPct:   Math.min(1, Math.max(0, num(c.deductionPct, DEFAULT_CONFIG.deductionPct, 0))),
    pointsPerRupee: num(c.pointsPerRupee, DEFAULT_CONFIG.pointsPerRupee),
    minAverage:     Math.round(num(c.minAverage, DEFAULT_CONFIG.minAverage)),
    mapping,
  };
}

/** The two thresholds for someone whose recent average is `average`. */
export function bandsFor(average, config = DEFAULT_CONFIG) {
  const c = normaliseConfig(config);
  // The target is the recent average lifted by targetUplift — the average is
  // what someone already does, so paying the high rate at exactly that level
  // would reward standing still. The minimum bar is applied after the lift,
  // so a thin record cannot produce a target of nearly nothing.
  const avg = Math.max(0, Math.round(Number(average) || 0));
  const base = Math.max(c.minAverage, Math.round(avg * (1 + c.targetUplift)));
  return { base, top: base + c.bandWidth, average: avg };
}

/**
 * @param {number} units    units billed this period
 * @param {number} average  that person's average monthly units before it
 */
export function incentiveFor(units, average, config = DEFAULT_CONFIG) {
  const c = normaliseConfig(config);
  const u = Math.max(0, Math.round(Number(units) || 0));
  const { base, top, average: avg } = bandsFor(average, c);

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
  const gross = round2(amount);
  const deduction = round2(gross * c.deductionPct);
  const net = round2(gross - deduction);
  // Points follow the net, because points are what a person is told they
  // earned and they should not be told a figure nobody will pay.
  const pts = n => Math.round(n * c.pointsPerRupee);
  return {
    units: u,
    // `target` is the bar that must be beaten (average + uplift); `average`
    // is the plain recent average it was derived from. They stopped being the
    // same number when the uplift arrived, so both are reported by name.
    target: base, average: avg,
    base, top, band, detail,
    // `amount` and `points` are what is actually paid, after the deduction.
    // The gross figures are alongside so the deduction can be shown, never
    // inferred from a difference.
    grossAmount: gross, deduction, deductionPct: c.deductionPct,
    amount: net,
    grossPoints: pts(gross), deductionPoints: pts(gross) - pts(net),
    points: pts(net),
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

/**
 * Is this person on the incentive?
 *
 * An empty roster means everybody — see the note on DEFAULT_CONFIG.roster.
 * Matched case-insensitively on the canonical name.
 */
export function onRoster(name, config = DEFAULT_CONFIG) {
  const roster = (config && Array.isArray(config.roster)) ? config.roster : DEFAULT_CONFIG.roster;
  if (!roster.length) return true;
  const p = personFor(name, config);
  // Somebody switched off is treated exactly like somebody not on the list:
  // their units are still stored and reported, they are simply not paid.
  return !!p && p.active !== false;
}

/** The roster entry a name belongs to, by key or by any of its aliases. */
export function personFor(name, config = DEFAULT_CONFIG) {
  const roster = (config && Array.isArray(config.roster)) ? config.roster : DEFAULT_CONFIG.roster;
  const want = String(name || '').trim().toLowerCase();
  if (!want) return null;
  for (const r of roster) {
    const e = (r && typeof r === 'object') ? r : { key: r, aliases: [] };
    const key = String(e.key ?? '').trim().toLowerCase();
    if (key === want) return e;
    const al = Array.isArray(e.aliases) ? e.aliases : [];
    if (al.some(a => String(a).trim().toLowerCase() === want)) return e;
  }
  return null;
}

/** What to show for a stored key: the HR name where there is one. */
export function displayNameFor(key, config = DEFAULT_CONFIG) {
  const p = personFor(key, config);
  return (p && (p.name || p.key)) || String(key || '');
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
  const viaAlias = aliases[titled.toLowerCase()] || titled;
  // The roster is the authority on identity. If this spelling belongs to
  // somebody on it, their key is the answer — that is what lets a new ERP
  // spelling be absorbed by adding one alias, with no re-upload, because the
  // stored history is filed under the key and not under what the sheet said.
  const person = personFor(viaAlias, config) || personFor(titled, config);
  return person ? person.key : viaAlias;
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
