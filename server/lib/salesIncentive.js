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

  // Laminate basic is the gate for the whole month: miss it and nothing
  // pays — not laminate, not the other products, not display. Cross it and
  // the other products start earning on units above their own targets.
  // Set gateAll false to let other products earn regardless of laminate.
  gateAll:         true,

  displayPct:      0.03,   // 3% of display value sold
  // The published table has no adjustments: a project sale counts in full,
  // nothing is clawed back and nothing is deducted. Each can be switched on
  // under Rule & setup if the company decides otherwise.
  projectCredit:   0.50,   // a project sale (Rs 50+ below regular price) counts half toward target
  badDebtClawback: 0.25,   // 25% of each earning month's incentive until the bad debt is recovered
  // The same 30% deduction the billing scheme applies, taken before payment.
  deductionPct:    0.30,

  // Points are not part of the published sales scheme; they are here so the
  // two incentives can be spoken about in the same units. Same conversion as
  // the billing scheme: 4 points = ₹1.
  pointsPerRupee:  4,

  // ── Section 3/4 of the one-page scheme: what never counts, and timing ──
  // Money is held `holdDays` after the month ends so collections can be
  // checked; the month is then paid in the next salary cycle, on `salaryDay`.
  holdDays:   90,
  salaryDay:  7,
  // A laminate line priced this many rupees (or more) under the product's
  // regular price is a project sale. Regular price = the price the product
  // most often sells at. Set projectDetect false to type project sheets by hand.
  projectDetect: true,
  projectBelow:  50,
  // Late payment: at holdEnd the dealer's outstanding for the sale month must
  // be nil; otherwise every unit sold to that dealer that month is forfeit.
  lateDetect:    true,
  // Invoice lines that never count toward target or incentive.
  countStatusPattern:  'sales invoice',          // only these ERP statuses are sales
  returnStatusPattern: 'return|credit note',     // these reverse units, in the month they happen
  excludePartyRoles:   ['Showroom'],             // internal locations — stock transfers
  excludeNamePattern:  'sample kit|sample box|stock transfer|free display',
  // Category types whose VALUE (not units) earns displayPct. Empty = display
  // value is typed by hand per salesman.
  displayCategories:   [],
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

  // Slabs as the one-page scheme reads them: 1,000–1,999 above pays the base
  // rate on every sheet, 2,000–2,999 base + step, 3,000–3,999 base + 2 steps,
  // 4,000 and above the cap — the rate steps up on reaching each block.
  const steps = Math.max(0, Math.floor(x / c.retroBlock) - 1);
  const rate = Math.min(c.retroCap, c.retroBase + c.retroStep * steps);
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
 * @param opts.lateByCategory   { CATEGORY: units } forfeit for late payment, every product
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
  const lateBy  = opts.lateByCategory && typeof opts.lateByCategory === 'object' ? opts.lateByCategory : {};
  const late    = Math.max(0, Math.round(Number(opts.latePaymentSheets) || 0))
                + Math.max(0, Math.round(Number(lateBy[c.gateCategory]) || 0));
  const credited = Math.max(0, gross - project + Math.round(project * c.projectCredit) - late);

  const gateOpen = b > 0 && credited >= b;
  const excess = gateOpen ? credited - b : 0;
  const lam = gateOpen ? laminateExcessPay(excess, c)
                       : { excess: 0, rate: 0, amount: 0, mode: 'gate-closed', bands: [] };

  // Other products earn above their own target whether or not laminate made
  // basic — unless the scheme is configured to gate everything.
  const othersOpen = c.gateAll ? gateOpen : true;
  const own = opts.categoryTargets || {};
  const products = c.products.map(p => {
    // Target precedence, per the scheme: the salesman's OWN target for the
    // category (Sales by Category → Salesman-wise — "fixed roll count, set per
    // rep") wins; the rule's fixed count or % share of the laminate basic is
    // the fallback when none is set for them.
    const fixed = (p.fixedTarget !== undefined && p.fixedTarget !== null && p.fixedTarget !== '') ? Math.round(Number(p.fixedTarget) || 0) : 0;
    const ownT = Math.round(Number(own[p.category]) || 0);
    const target = ownT > 0 ? ownT : fixed > 0 ? fixed : targetFor(p, b);
    // a late-paid sale earns nothing on any product it carried
    const lateHere = Math.max(0, Math.round(Number(lateBy[p.category]) || 0));
    const actual = Math.max(0, Math.round(Number(qty[p.category]) || 0) - lateHere);
    // no target at all (none set, and no basic to derive one from) → nothing
    // to be above, so nothing earns; a zero target must not pay on every unit
    const over = target > 0 ? Math.max(0, actual - target) : 0;
    return {
      key: p.key, label: p.label, category: p.category,
      target, targetSource: ownT > 0 ? 'own' : fixed > 0 ? 'rule' : (target > 0 ? 'derived' : 'none'), actual, late: lateHere, excess: over,
      rate: p.rate,
      amount: othersOpen && target > 0 ? r2(over * p.rate) : 0,
    };
  });

  const displayValue = Math.max(0, Number(opts.displayValue) || 0);
  const display = othersOpen ? r2(displayValue * c.displayPct) : 0;

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
    gateOpen, gateAll: !!c.gateAll,
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

/* ------------------------------------------------------------------ *
 *  Section 4 — when a month is paid                                   *
 * ------------------------------------------------------------------ */
const ymd = d => d.toISOString().slice(0, 10);

/**
 * The timeline of one sales month: sales close at month end, the money is
 * held `holdDays` for collections, then paid in the first salary cycle on or
 * after the hold ends. January → held to 1 May → paid 7 May, as the scheme's
 * own example has it.
 */
export function payoutSchedule(month, config = DEFAULT_SALES_CONFIG, today = new Date()) {
  const [y, m] = String(month).split('-').map(Number);
  if (!y || !m) return null;
  const hold = Math.max(0, Math.round(Number(config.holdDays) || 0));
  const salaryDay = Math.min(28, Math.max(1, Math.round(Number(config.salaryDay) || 7)));
  const monthEnd = new Date(Date.UTC(y, m, 0));                         // last day of the month
  const holdEnd  = new Date(Date.UTC(y, m, 0 + hold));
  let pay = new Date(Date.UTC(holdEnd.getUTCFullYear(), holdEnd.getUTCMonth(), salaryDay));
  if (pay < holdEnd) pay = new Date(Date.UTC(holdEnd.getUTCFullYear(), holdEnd.getUTCMonth() + 1, salaryDay));
  const t = ymd(today);
  const status = t <= ymd(monthEnd) ? 'open' : t < ymd(holdEnd) ? 'held' : 'payable';
  return {
    month, monthEnd: ymd(monthEnd), holdEnd: ymd(holdEnd), payDate: ymd(pay),
    payMonth: ymd(pay).slice(0, 7), holdDays: hold, status,
    // the day the late-payment check is final: the hold end, or today if sooner
    evalDate: t < ymd(holdEnd) ? t : ymd(holdEnd),
    final: t >= ymd(holdEnd),
  };
}
