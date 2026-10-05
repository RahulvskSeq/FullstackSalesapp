import mongoose from 'mongoose';
import Lead from '../models/Lead.js';
import Dealer from '../models/Dealer.js';
import Sale from '../models/Sale.js';
import VisitPlan from '../models/VisitPlan.js';

/**
 * A lead that starts buying becomes our dealer, on its own.
 *
 * Sales uploads create a dealer for a name they have not seen; once a lead's name
 * (ignoring spacing, punctuation and "M/S") matches a dealer — or one of its
 * aliases — that has sales, the lead is marked WON and linked to that dealer, and its
 * planned calendar visits stop being "new party" and point at the dealer.
 * Runs at start-up and every few minutes; nothing is done twice.
 */
const norm = s => String(s || '').toUpperCase().replace(/^M\s*\/\s*S\.?\s*/, '').replace(/[^A-Z0-9]/g, '');

export async function convertLeadsWithSales({ log = true, dryRun = false } = {}) {
  const open = await Lead.find({ status: { $nin: ['WON', 'LOST'] } }, 'name company status assignedTo').lean();
  if (!open.length) return { checked: 0, converted: [] };
  const dealers = await Dealer.find({}, 'name aliases monthlyData salesman').lean();
  const byName = new Map();
  for (const d of dealers) for (const n of [d.name, ...(d.aliases || [])]) { const k = norm(n); if (k && !byName.has(k)) byName.set(k, d); }
  const converted = [];
  for (const l of open) {
    const d = byName.get(norm(l.company)) || byName.get(norm(l.name));
    if (!d) continue;
    const md = d.monthlyData instanceof Map ? Object.fromEntries(d.monthlyData) : (d.monthlyData || {});
    const sold = Object.values(md).some(m => Number(m?.achieved) > 0) || !!(await Sale.exists({ $or: [{ dealerId: d._id }, { dealerName: d.name }] }));
    if (!sold) continue;
    if (dryRun) { converted.push(`${l.company || l.name} → ${d.name}`); continue; }
    const line = `Converted to dealer "${d.name}" — first sales found in the uploaded data`;
    await Lead.updateOne({ _id: l._id, status: { $nin: ['WON', 'LOST'] } }, {
      $set: { status: 'WON', dealerId: String(d._id), dealerName: d.name, convertedAt: new Date() },
      $push: { updates: { by: 'system', byName: 'Auto', comment: line, status: 'WON', at: new Date() } },
    });
    // planned visits for this party now visit the dealer
    await VisitPlan.updateMany({ $or: [{ leadId: String(l._id) }, { newParty: true, dealerName: new RegExp('^\\s*' + String(l.company || l.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i') }], status: 'PLANNED' },
      { $set: { dealerId: String(d._id), dealerName: d.name, newParty: false } });
    converted.push(`${l.company || l.name} → ${d.name}`);
  }
  if (log && converted.length) console.log('[LEADS] converted to dealers:', converted.join(' · '));
  return { checked: open.length, converted };
}
