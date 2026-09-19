import mongoose from 'mongoose';
import ProductTxn from '../models/ProductTxn.js';
import Sale from '../models/Sale.js';
import { ColSnapshot, ColBalance } from '../collections/models/index.js';
import { payoutSchedule } from './salesIncentive.js';

/**
 * The facts of a sales month that section 3 and 4 of the scheme need and the
 * monthly rollup cannot answer:
 *
 *   - which units never count (samples, stock transfers, free display, lines
 *     that are not sales invoices), and returns that reverse units;
 *   - which laminate lines were project sales (priced under regular);
 *   - what each dealer bought, so a late payment can forfeit the whole sale;
 *   - the rupee value of display material, when a display category is set.
 *
 * Read from the ERP invoice lines where a month has them, and from the Sale
 * rollup otherwise (older months uploaded by hand). Nothing here writes.
 */

const esc = s => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const rx  = (pat) => { const p = String(pat || '').trim(); if (!p) return null; try { return new RegExp(p, 'i'); } catch { return new RegExp(esc(p), 'i'); } };
const key = t => (t.pdId && String(t.pdId)) || (t.productId && String(t.productId)) || String(t.productCode || t.productName || '');

/**
 * The regular price of each product: the price it most often sold at, by
 * quantity, across the lines given. A discount of `projectBelow` or more
 * under that is a project sale.
 */
function regularPrices(lines) {
  const by = new Map();                          // product → Map(price → qty)
  for (const t of lines) {
    if (!(t.price > 0) || !(t.qty > 0)) continue;
    const k = key(t); if (!k) continue;
    const m = by.get(k) || new Map(); by.set(k, m);
    const p = Math.round(t.price * 100) / 100;
    m.set(p, (m.get(p) || 0) + t.qty);
  }
  const out = {};
  for (const [k, m] of by) {
    let best = 0, bestQ = -1;
    for (const [p, q] of m) if (q > bestQ || (q === bestQ && p > best)) { best = p; bestQ = q; }
    out[k] = best;
  }
  return out;
}

/**
 * One month's facts, per salesman. Returns null when the month has neither
 * invoice lines nor rollup rows.
 */
export async function monthFacts(month, config) {
  const countRx  = rx(config.countStatusPattern)  || /sales invoice/i;
  const returnRx = rx(config.returnStatusPattern);
  const nameRx   = rx(config.excludeNamePattern);
  const roles    = new Set((config.excludePartyRoles || []).map(s => String(s).trim().toLowerCase()).filter(Boolean));
  const dispCats = new Set((config.displayCategories || []).map(s => String(s).trim().toUpperCase()).filter(Boolean));
  const below    = Math.max(0, Number(config.projectBelow) || 0);
  const gate     = config.gateCategory || 'LAMINATE';

  const lines = await ProductTxn.find({ month, resolved: true, dealerName: { $ne: '' } },
    'status qty price netTotal amount productId pdId productCode productName category categoryType partyRole dealerId dealerName salesmanId voucherNo dateStr').lean();

  const per = {};                                // salesmanId → facts
  const P = id => (per[id] ||= { qty: {}, dealers: {}, dealerNames: {}, project: { sheets: 0, lines: [] }, displayValue: 0, excluded: { units: 0, lines: 0, byReason: {} }, returns: { units: 0, lines: 0 } });

  if (lines.length) {
    const regular = config.projectDetect ? regularPrices(lines.filter(t => (t.category || t.categoryType) === gate)) : {};
    for (const t of lines) {
      const sm = t.salesmanId || ''; if (!sm || sm === 'none') continue;
      const f = P(sm);
      const cat = t.category || t.categoryType || 'OTHER';
      const status = String(t.status || '');
      const isReturn = !!(returnRx && returnRx.test(status));
      const q = Math.round(Number(t.qty) || 0);
      const skip = (why) => { f.excluded.units += Math.abs(q); f.excluded.lines++; f.excluded.byReason[why] = (f.excluded.byReason[why] || 0) + Math.abs(q); };

      if (!isReturn && !countRx.test(status)) { skip('status: ' + (status || 'blank')); continue; }
      if (roles.has(String(t.partyRole || '').toLowerCase())) { skip('party: ' + t.partyRole); continue; }
      if (nameRx && nameRx.test(t.productName || '')) { skip('product name'); continue; }
      if (!isReturn && !(t.price > 0) && !(t.netTotal > 0)) { skip('free of charge'); continue; }

      // display value earns on rupees, not units; it is not a target product
      if (dispCats.has(String(t.categoryType || '').toUpperCase()) || dispCats.has(String(cat).toUpperCase())) {
        f.displayValue += isReturn ? -Math.abs(Number(t.netTotal || t.amount) || 0) : (Number(t.netTotal || t.amount) || 0);
        continue;
      }

      const units = isReturn ? -Math.abs(q) : q;
      if (isReturn) { f.returns.units += Math.abs(q); f.returns.lines++; }
      f.qty[cat] = (f.qty[cat] || 0) + units;
      if (t.dealerId) {
        const d = String(t.dealerId);
        (f.dealers[d] ||= {})[cat] = (f.dealers[d][cat] || 0) + units;
        f.dealerNames[d] = t.dealerName || '';
      }
      // project sale: laminate under regular by the threshold
      if (!isReturn && cat === gate && below > 0 && t.price > 0) {
        const reg = regular[key(t)] || 0;
        if (reg > 0 && t.price <= reg - below) {
          f.project.sheets += q;
          f.project.lines.push({ voucherNo: t.voucherNo, date: t.dateStr, dealer: t.dealerName, product: t.productName, qty: q, price: t.price, regular: reg });
        }
      }
    }
    for (const f of Object.values(per)) { f.displayValue = Math.round(f.displayValue); f.project.lines.sort((a, b) => (b.regular - b.price) - (a.regular - a.price)); }
    return { source: 'erp-lines', per };
  }

  // No invoice lines: the rollup knows units per dealer and category only.
  const rows = await Sale.find({ month }, 'salesman dealerId dealerName category qty').lean();
  if (!rows.length) return null;
  for (const r of rows) {
    const sm = r.salesman || ''; if (!sm || sm === 'none') continue;
    const f = P(sm);
    f.qty[r.category] = (f.qty[r.category] || 0) + (r.qty || 0);
    if (r.dealerId) {
      const d = String(r.dealerId);
      (f.dealers[d] ||= {})[r.category] = (f.dealers[d][r.category] || 0) + (r.qty || 0);
      f.dealerNames[d] = r.dealerName || '';
    }
  }
  return { source: 'rollup', per };
}

/**
 * Late payment, per the scheme: the customer must clear 100% within 90 days.
 *
 * The Collections module keeps every outstanding upload as a dated snapshot
 * with a bucket per sale month, so "was the July bucket nil 90 days after
 * July ended?" is answerable for each dealer. Before the hold ends the answer
 * is provisional — shown as at risk, not deducted.
 *
 * @returns { sched, bySalesman: { id: { final, lateByCategory, dealers: [...], atRisk } } }
 */
export async function lateFacts(month, facts, config, today = new Date()) {
  const sched = payoutSchedule(month, config, today);
  const out = { sched, bySalesman: {} };
  if (!sched || !config.lateDetect || !facts) return out;

  const dealerIds = new Set();
  for (const f of Object.values(facts.per)) for (const d of Object.keys(f.dealers)) dealerIds.add(d);
  if (!dealerIds.size) return out;
  const ids = [...dealerIds].filter(mongoose.isValidObjectId).map(d => new mongoose.Types.ObjectId(d));

  // the latest snapshot on or before the evaluation day, per dealer
  const snaps = await ColSnapshot.aggregate([
    { $match: { dealerId: { $in: ids }, asOn: { $lte: sched.evalDate }, superseded: { $ne: true } } },
    { $sort: { asOn: -1, createdAt: -1 } },
    { $group: { _id: '$dealerId', asOn: { $first: '$asOn' }, buckets: { $first: '$buckets' }, total: { $first: '$total' } } },
  ]);
  const pendingOf = new Map();                   // dealerId → { pending, asOn }
  for (const s of snaps) {
    const b = s.buckets || {};
    const pending = Number(b[month] ?? (b.get ? b.get(month) : 0)) || 0;
    pendingOf.set(String(s._id), { pending, asOn: s.asOn });
  }
  // dealers with no snapshot at all: fall back to the live balance when the
  // evaluation day is today (nothing dated exists to look back at)
  const missing = ids.filter(i => !pendingOf.has(String(i)));
  if (missing.length && !sched.final) {
    const bals = await ColBalance.find({ dealerId: { $in: missing } }, 'dealerId buckets lastSnapshotAsOn').lean();
    for (const b of bals) {
      const bk = b.buckets || {};
      pendingOf.set(String(b.dealerId), { pending: Number(bk[month]) || 0, asOn: b.lastSnapshotAsOn || '' });
    }
  }

  for (const [sm, f] of Object.entries(facts.per)) {
    const lateBy = {}; const dealers = []; let atRiskUnits = 0;
    for (const [d, cats] of Object.entries(f.dealers)) {
      const p = pendingOf.get(d);
      if (!p || !(p.pending > 0)) continue;
      const units = Object.values(cats).reduce((a, v) => a + Math.max(0, v), 0);
      if (!units) continue;
      dealers.push({ dealerId: d, name: f.dealerNames[d] || d, pending: Math.round(p.pending), asOn: p.asOn, units, byCategory: cats });
      atRiskUnits += units;
      if (sched.final) for (const [c, v] of Object.entries(cats)) if (v > 0) lateBy[c] = (lateBy[c] || 0) + v;
    }
    dealers.sort((a, b) => b.units - a.units);
    out.bySalesman[sm] = { final: sched.final, evalDate: sched.evalDate, lateByCategory: lateBy, dealers, atRiskUnits };
  }
  return out;
}
