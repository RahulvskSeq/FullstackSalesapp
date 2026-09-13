/**
 * Salesman incentive — the scheme in "Sequence Surfaces Sales Incentive
 * Scheme v1.0" (12 May 2026).
 *
 * Separate from lib/incentive.js, which is the BILLING team's scheme. The two
 * share nothing but the word "incentive": this one is gated on laminate,
 * pays per sheet in rupees, and has no points.
 *
 * The shape of it:
 *   1. Laminate is a gate. Miss the laminate basic target and the month pays
 *      zero on everything — laminate, other products, display, all of it.
 *   2. Above basic, laminate earns on a ramp that becomes retroactive: past
 *      1,000 sheets of excess one rate applies to the WHOLE excess.
 *   3. Other products earn a flat rate on units above their own derived
 *      target, which is a percentage of the laminate basic.
 *   4. Display earns 3% of value.
 * Project sales, late payment and bad debt adjust the result afterwards.
 */

export const DEFAULT_SALES_CONFIG = {
  gateCategory: 'LAMINATE',

  // Phase 1 — the first 1,000 sheets above basic, charged in bands.
  starterTiers: [
    { upTo: 250,  rate: 15 },
    { upTo: 500,  rate: 20 },
    { upTo: 1000, rate: 25 },
  ],

  // Phase 2 — from 1,000 sheets of excess, one rate applies to the entire
  // excess and climbs by `retroStep` for every further 1,000, up to the cap.
  retroFrom:  1000,
  retroBase:  25,
  retroStep:  5,
  retroBlock: 1000,
  retroCap:   40,

  // Every other product: target is a share of the laminate basic, and only
  // units ABOVE that target earn. Hitting the target exactly earns nothing.
  products: [
    { key: 'decorative', label: 'Decorative', category: 'POLYMER SHEET', targetPct: 0.10, rate: 50 },
    { key: 'louvres',    label: 'Louvers',    category: 'LOUVRES',       targetPct: 0.30, rate: 20 },
    { key: 'rolls',      label: 'Rolls',      category: 'ROLLS',         fixedTarget: 20, rate: 100 },
    { key: 'liner',      label: 'Liner',      category: 'LINER',         targetPct: 1.00, rate: 3 },
  ],

  displayPct:      0.03,   // 3% of display value sold
  projectCredit:   0.50,   // a project sale counts half toward target
  badDebtClawback: 0.25,   // 25% of a month's incentive, until recovered

  // Taken off what is left after the bad-debt recovery, as the last step
  // before payment. Its own step rather than folded into the rates, so the
  // screens can show what the scheme earned and what was deducted separately.
  deductionPct:    0.30,

  // Points are not part of the published sales scheme; they are here so the
  // two incentives can be spoken about in the same units. Same conversion as
  // the billing scheme: 4 points = ₹1.
  pointsPerRupee:  4,
};

const r2 = n => Math.round((Number(n) || 0) * 100) / 100;

/**
 * What the excess laminate earns.
 *
 * Below `retroFrom` the starter bands apply and each band earns its own rate.
 * At or above it, ONE rate applies to every sheet of the excess — so crossing
 * a thousand re-prices sheets already earned, which is why the payout jumps
 * rather than rising smoothly.
 *
 * The rate is derived as "base + step per additional block", which is the
 * rule as the document states it in prose and as all seven of its worked
 * examples compute it. Its own Phase 2 *table* disagrees at the exact
 * boundaries (it reads 2,000 as Rs 25 where the examples pay Rs 30); the
 * examples win here, and the discrepancy is flagged rather than silently
 * resolved.
 */
export function laminateExcessPay(excess, config = DEFAULT_SALES_CONFIG) {
  const c = config;
  const x = Math.max(0, Math.round(Number(excess) || 0));
  if (x <= 0) return { excess: 0, rate: 0, amount: 0, mode: 'none', bands: [] };

  if (x < c.retroFrom) {
    let amount = 0, prev = 0;
    const bands = [];
    for (const t of c.starterTiers) {
      const inBand = Math.min(x, t.upTo) - prev;
      if (inBand > 0) { amount += inBand * t.rate; bands.push({ sheets: inBand, rate: t.rate }); }
      prev = t.upTo;
      if (x <= t.upTo) break;
    }
    return { excess: x, rate: null, amount: r2(amount), mode: 'starter', bands };
  }

  const blocks = Math.floor(x / c.retroBlock);
  const rate = Math.min(c.retroCap, c.retroBase + c.retroStep * (blocks - 1));
  return { excess: x, rate, amount: r2(x * rate), mode: 'retroactive', bands: [{ sheets: x, rate }] };
}

/** A product's derived target: a share of the laminate basic, or a fixed count. */
export function targetFor(product, laminateBasic) {
  if (product.fixedTarget !== undefined && product.fixedTarget !== null) {
    return Math.round(Number(product.fixedTarget) || 0);
  }
  return Math.round((Number(laminateBasic) || 0) * (Number(product.targetPct) || 0));
}

/**
 * One salesman, one month.
 *
 * @param basic        laminate basic target, in sheets
 * @param qty          { CATEGORY: units } achieved
 * @param opts.projectSheets    laminate sheets sold as project sales (half credit)
 * @param opts.latePaymentSheets laminate sheets on sales not collected in 90 days
 * @param opts.displayValue      rupee value of display material sold
 * @param opts.badDebtOutstanding balance still to recover
 */
export function salesIncentiveFor(basic, qty = {}, opts = {}, config = DEFAULT_SALES_CONFIG) {
  const c = config;
  const b = Math.max(0, Math.round(Number(basic) || 0));
  const gross = Math.max(0, Math.round(Number(qty[c.gateCategory]) || 0));

  // Project sales count half toward target; late-paid sales do not count at
  // all. Both reduce the laminate figure the gate and the ramp see.
  const project = Math.max(0, Math.round(Number(opts.projectSheets) || 0));
  const late    = Math.max(0, Math.round(Number(opts.latePaymentSheets) || 0));
  const credited = Math.max(0, gross - project + Math.round(project * c.projectCredit) - late);

  const gateOpen = b > 0 && credited >= b;
  const excess = gateOpen ? credited - b : 0;
  const lam = gateOpen ? laminateExcessPay(excess, c)
                       : { excess: 0, rate: 0, amount: 0, mode: 'gate-closed', bands: [] };

  const products = c.products.map(p => {
    const target = targetFor(p, b);
    const actual = Math.max(0, Math.round(Number(qty[p.category]) || 0));
    const over = Math.max(0, actual - target);
    return {
      key: p.key, label: p.label, category: p.category,
      target, actual, excess: over,
      rate: p.rate,
      amount: gateOpen ? r2(over * p.rate) : 0,
    };
  });

  const displayValue = Math.max(0, Number(opts.displayValue) || 0);
  const display = gateOpen ? r2(displayValue * c.displayPct) : 0;

  const earned = r2(lam.amount + products.reduce((a, p) => a + p.amount, 0) + display);

  // Bad debt takes a fixed share of what a month earns, and never more than
  // the month earned or the balance still owed.
  const owed = Math.max(0, Number(opts.badDebtOutstanding) || 0);
  const clawback = r2(Math.min(earned * c.badDebtClawback, owed));
  const afterClawback = r2(earned - clawback);

  // The deduction is applied last, to what is left after the recovery. The
  // published scheme defines the clawback as a share of the month's incentive,
  // so that is computed on the earned figure and left exactly as written;
  // the deduction then applies to the remainder.
  const deductionPct = Math.min(1, Math.max(0, Number(c.deductionPct) || 0));
  const deduction = r2(afterClawback * deductionPct);
  const payable = r2(afterClawback - deduction);
  const pointsPerRupee = Number(c.pointsPerRupee) || 0;

  return {
    basic: b,
    gross, project, late, credited,
    gateOpen,
    shortfall: gateOpen ? 0 : Math.max(0, b - credited),
    laminate: lam,
    products,
    displayValue, display,
    earned,
    badDebtOutstanding: owed, clawback,
    afterClawback,
    deductionPct, deduction,
    payable,
    // Points follow what is actually paid, so nobody is shown a figure that
    // will not arrive.
    points:      Math.round(payable * pointsPerRupee),
    grossPoints: Math.round(earned  * pointsPerRupee),
  };
}
