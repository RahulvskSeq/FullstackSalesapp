/**
 * incentive.js — what a billing person earns on the units they billed.
 *
 * The rule is configurable and stored in the database (Setting key
 * `incentiveConfig`), because thresholds and rates are a business decision
 * that changes without a deploy. The shape:
 *
 *   tier1      units up to here are paid at rateLow          (default 2500)
 *   tier2      above here, EVERY unit is paid at rateHigh    (default 3000)
 *   rateLow    ₹ per unit in the first band                  (default 0.50)
 *   rateHigh   ₹ per unit above tier1                        (default 1.00)
 *   mapping    { salesmanId: 'Billing person' }
 *
 * How it pays, with the defaults:
 *
 *   up to 2,500        ₹0.50 each
 *   2,501 – 3,000      the first 2,500 at ₹0.50, the rest at ₹1.00
 *   over 3,000         ₹1.00 on every unit, including the first 2,500
 *
 * That last line is the part to be careful with: crossing tier2 does not just
 * price the excess, it re-prices everything already billed, so the payout
 * jumps rather than rising smoothly —
 *
 *   3,000 units → ₹1,750
 *   3,001 units → ₹3,001      (one more unit is worth ₹1,251)
 *
 * That is deliberate and was confirmed before it was written. The UI says so
 * in words, because a cliff that size reads as a bug otherwise.
 */

export const DEFAULT_CONFIG = {
  tier1:    2500,
  tier2:    3000,
  rateLow:  0.50,
  rateHigh: 1.00,
  // Who raises the invoices for each salesman. Keyed on the salesman ID, not
  // the display name: exports spell the same person several ways ("Rakesh
  // Boriwal", "rakesh") while the id is stable. One billing person may cover
  // several reps, and their units combine before the rate is applied.
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
  const num = (v, d) => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : d; };
  const tier1 = Math.round(num(c.tier1, DEFAULT_CONFIG.tier1));
  // tier2 below tier1 would make the middle band impossible, so it is floored.
  const tier2 = Math.max(tier1, Math.round(num(c.tier2, DEFAULT_CONFIG.tier2)));
  const mapping = {};
  for (const [k, v] of Object.entries(c.mapping && typeof c.mapping === 'object' ? c.mapping : DEFAULT_CONFIG.mapping)) {
    const id = String(k || '').trim().toLowerCase();
    const person = String(v || '').trim();
    if (id && person) mapping[id] = person;
  }
  return {
    tier1, tier2,
    rateLow:  num(c.rateLow,  DEFAULT_CONFIG.rateLow),
    rateHigh: num(c.rateHigh, DEFAULT_CONFIG.rateHigh),
    mapping,
  };
}

/**
 * @param {number} units   units billed by one person in the period
 * @param {object} config  see DEFAULT_CONFIG
 */
export function incentiveFor(units, config = DEFAULT_CONFIG) {
  const c = normaliseConfig(config);
  const u = Math.max(0, Math.round(Number(units) || 0));

  if (u > c.tier2) {
    return {
      units: u,
      amount: round2(u * c.rateHigh),
      band: 'over-tier2',
      detail: `${fmt(u)} × ${money(c.rateHigh)} (all units re-rated)`,
    };
  }
  if (u > c.tier1) {
    const excess = u - c.tier1;
    return {
      units: u,
      amount: round2(c.tier1 * c.rateLow + excess * c.rateHigh),
      band: 'mid',
      detail: `${fmt(c.tier1)} × ${money(c.rateLow)} + ${fmt(excess)} × ${money(c.rateHigh)}`,
    };
  }
  return {
    units: u,
    amount: round2(u * c.rateLow),
    band: 'upto-tier1',
    detail: `${fmt(u)} × ${money(c.rateLow)}`,
  };
}

/** How many more units until the payout jumps, and by how much. */
export function nextThreshold(units, config = DEFAULT_CONFIG) {
  const c = normaliseConfig(config);
  const u = Math.max(0, Math.round(Number(units) || 0));
  if (u > c.tier2) return null;                       // nothing further to reach
  const target = u > c.tier1 ? c.tier2 + 1 : c.tier1 + 1;
  const gain = round2(incentiveFor(target, c).amount - incentiveFor(u, c).amount);
  if (gain <= 0) return null;                         // rates equal — no cliff to show
  return { unitsAway: target - u, at: target, gain };
}

/** The billing person for a line: the sheet's own value, else the mapping. */
export function billingPersonFor({ billedBy, salesmanId } = {}, config = DEFAULT_CONFIG) {
  const explicit = String(billedBy || '').trim();
  if (explicit) return explicit;
  const c = normaliseConfig(config);
  return c.mapping[String(salesmanId || '').trim().toLowerCase()] || '';
}
