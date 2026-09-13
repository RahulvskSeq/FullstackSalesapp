/**
 * Account status — two independent dimensions.
 *
 *  Type 1 "perfStatus"  — AUTO. Derived from sales; nobody types it.
 *  Type 2 "status"      — MANUAL. The salesman's own label for the account.
 *
 * They were previously crammed into one `status` field, which is why a key
 * account could not also read as dead: the field could only hold one answer.
 */

// Only these count toward the performance tier. Deliberately excludes LINER
// (the second-largest category by volume), FOLDERS, EDGE BANDING and OTHER.
export const TIER_CATEGORIES = [
  'LAMINATE', 'LOUVRES', 'POLYMER SHEET', 'ROLLS', 'DECORATIVE - SPECIAL',
];

// Type 1 — auto-calculated, ordered best to worst.
export const PERF_STATUSES = [
  'TOP PERFORMER',     // 250+ in the latest month
  'PRIORITY ACCOUNT',  // 101–250
  'RISING STAR',       // 50–100
  'ACTIVE',            // 1–49
  'RECENTLY INACTIVE', // nothing this month, but ordered last month
  'INACTIVE',          // nothing for two months, ordered three months ago
  'DEAD',              // nothing in three months
];


// Type 2 — chosen by the salesman. 'NONE' means unlabelled.
export const ACCOUNT_STATUSES = ['NONE', 'STAR', 'KEY ACCOUNT', 'ACHIEVER', 'REACTIVE'];

export const TIER_THRESHOLDS = { top: 250, priority: 101, rising: 50 };

/**
 * @param qtyByMonth  { 'YYYY-MM': qty } for ONE dealer, already restricted to
 *                    TIER_CATEGORIES.
 * @param months      every month present in the data, ascending.
 *
 * Recency note: sales carry no per-order date — one row is a dealer x
 * sub-category x MONTH — so "no order in 30/60/90 days" is evaluated at month
 * resolution as 1/2/3 months. A dealer who ordered on the 2nd of last month
 * and one who ordered on the 28th are indistinguishable in this data.
 */
export function perfStatusFor(qtyByMonth, months) {
  if (!months || !months.length) return 'DEAD';
  const q = (m) => (m ? Number(qtyByMonth?.[m]) || 0 : 0);
  const [m0, m1, m2] = [months.at(-1), months.at(-2), months.at(-3)];

  const cur = q(m0);
  if (cur >= TIER_THRESHOLDS.top)      return 'TOP PERFORMER';
  if (cur >= TIER_THRESHOLDS.priority) return 'PRIORITY ACCOUNT';
  if (cur >= TIER_THRESHOLDS.rising)   return 'RISING STAR';
  if (cur >= 1)                        return 'ACTIVE';

  // Nothing this month — how long since the last order?
  if (q(m1) > 0) return 'RECENTLY INACTIVE';
  if (q(m2) > 0) return 'INACTIVE';
  return 'DEAD';
}

/**
 * Recompute Type 1 (perfStatus) for every dealer from the Sale rows.
 *
 * One implementation on purpose. This existed three times — in the manual
 * Monthly Entry upload, in the recompute endpoint, and nowhere at all in the
 * ERP sync — and the path that was missing it is why the Performance Tiers
 * row went stale: an ERP upload wrote new Sale rows and left every dealer's
 * tier describing the month before.
 *
 * Pass dry:true to find out what would change without writing.
 */
export async function recomputePerfStatus({ dry = false } = {}) {
  const Sale   = (await import('../models/Sale.js')).default;
  const Dealer = (await import('../models/Dealer.js')).default;

  const months = (await Sale.distinct('month')).filter(Boolean).sort();
  if (!months.length) return { months: 0, dealers: 0, counts: {}, changed: [] };

  const agg = await Sale.aggregate([
    { $match: { category: { $in: TIER_CATEGORIES } } },
    { $group: { _id: { d: '$dealerName', m: '$month' }, qty: { $sum: '$qty' } } },
  ]);
  const byDealer = {};
  for (const r of agg) (byDealer[r._id.d] ||= {})[r._id.m] = r.qty;

  // Every dealer, not just those with sale rows — an absence of rows is
  // exactly what makes a dealer DEAD.
  const dealers = await Dealer.find({}, 'name perfStatus').lean();
  const latest = months.at(-1);
  const ops = [], counts = {}, changed = [];
  for (const d of dealers) {
    const q = byDealer[d.name] || {};
    const next = perfStatusFor(q, months);
    counts[next] = (counts[next] || 0) + 1;
    if (next !== (d.perfStatus || '')) {
      changed.push({ name: d.name, from: d.perfStatus || '(unset)', to: next });
    }
    ops.push({ updateOne: { filter: { _id: d._id }, update: { $set: {
      perfStatus: next, perfQty: Number(q[latest]) || 0, perfMonth: latest,
    } } } });
  }
  if (!dry && ops.length) await Dealer.bulkWrite(ops, { ordered: false });
  return { month: latest, months: months.length, dealers: dealers.length, counts, changed };
}

/** Normalise whatever is in the manual field to a valid Type 2 value. */
export function normalizeAccountStatus(v) {
  const s = String(v || '').trim().toUpperCase();
  return ACCOUNT_STATUSES.includes(s) ? s : 'NONE';
}
