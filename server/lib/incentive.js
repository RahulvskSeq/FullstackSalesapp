/**
 * incentive.js — what a billing person earns on the units they billed.
 *
 * The rule, per person per month:
 *
 *   up to 2,500 units      ₹0.50 each
 *   2,501 – 3,000          the first 2,500 at ₹0.50, the rest at ₹1.00
 *   over 3,000             ₹1.00 on EVERY unit, including the first 2,500
 *
 * That last line is the part to be careful with: crossing 3,000 does not just
 * price the excess, it re-prices everything already billed. So the payout
 * jumps at the threshold rather than rising smoothly:
 *
 *   3,000 units → ₹1,750
 *   3,001 units → ₹3,001      (one more unit is worth ₹1,251)
 *
 * That is deliberate and was confirmed before this was written. It is called
 * out in the UI too, because a cliff that size invites disputes if it looks
 * like a bug.
 */

/**
 * Who raises the invoices for each salesman.
 *
 * Keyed on the salesman ID rather than the display name: the name is spelled
 * several ways across the ERP exports ("Rakesh Boriwal", "rakesh"), while the
 * id is stable.
 *
 * One billing person can cover several reps — Shashikala handles three — so
 * their units add up into a single total before the rate is worked out. That
 * matters: three reps at 1,000 each is 3,000 for her, not three lots of 1,000.
 *
 * A "Billed By" column in the sheet still wins when present; this is the
 * fallback, and it means the incentive works on data already imported rather
 * than only on future uploads.
 */
export const BILLING_BY_SALESMAN = {
  rakesh:  'Lavanya',
  pranav:  'Sahana',
  ratish:  'Anu',
  senthil: 'Shashikala',
  joseph:  'Shashikala',
  kenadi:  'Shashikala',
  udai:    'Sridevi',
};

/** The billing person for a line: the sheet's own value, else the map. */
export function billingPersonFor({ billedBy, salesmanId } = {}) {
  const explicit = String(billedBy || '').trim();
  if (explicit) return explicit;
  return BILLING_BY_SALESMAN[String(salesmanId || '').trim().toLowerCase()] || '';
}

export const TIER_1_LIMIT = 2500;   // paid at RATE_LOW up to here
export const TIER_2_LIMIT = 3000;   // above here, everything re-rates
export const RATE_LOW     = 0.50;
export const RATE_HIGH    = 1.00;

/**
 * @param {number} units  units billed by one person in the period
 * @returns {{units:number, amount:number, band:string, detail:string}}
 */
export function incentiveFor(units) {
  const u = Math.max(0, Math.round(Number(units) || 0));

  if (u > TIER_2_LIMIT) {
    return {
      units: u,
      amount: round2(u * RATE_HIGH),
      band: 'over-3000',
      detail: `${fmt(u)} × ₹${RATE_HIGH.toFixed(2)} (all units re-rated)`,
    };
  }
  if (u > TIER_1_LIMIT) {
    const excess = u - TIER_1_LIMIT;
    return {
      units: u,
      amount: round2(TIER_1_LIMIT * RATE_LOW + excess * RATE_HIGH),
      band: '2501-3000',
      detail: `${fmt(TIER_1_LIMIT)} × ₹${RATE_LOW.toFixed(2)} + ${fmt(excess)} × ₹${RATE_HIGH.toFixed(2)}`,
    };
  }
  return {
    units: u,
    amount: round2(u * RATE_LOW),
    band: 'upto-2500',
    detail: `${fmt(u)} × ₹${RATE_LOW.toFixed(2)}`,
  };
}

/** How many more units until the payout jumps, and by how much. */
export function nextThreshold(units) {
  const u = Math.max(0, Math.round(Number(units) || 0));
  if (u > TIER_2_LIMIT) return null;                 // nothing further to reach
  const target = u > TIER_1_LIMIT ? TIER_2_LIMIT + 1 : TIER_1_LIMIT + 1;
  return {
    unitsAway: target - u,
    at: target,
    gain: round2(incentiveFor(target).amount - incentiveFor(u).amount),
  };
}

const round2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => Number(n).toLocaleString('en-IN');
