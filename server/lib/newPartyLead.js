import Lead from '../models/Lead.js';

/**
 * A new party put on the visit calendar is a lead from that moment (status NEW), so
 * nothing the salesmen plan to meet is lost. Same name → the existing lead, with a
 * line added. Check-out later fills in that same lead with the party's real details.
 */
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// route names, not parties: ".Karatgi", ".Sindhnur & Manvi", "New", "New dealer"
export const isPlaceholderParty = name => { const n = String(name || '').trim(); return !n || n.startsWith('.') || /^new( dealer| party)?$/i.test(n); };

export async function leadForPlannedParty({ name, salesmanId, salesmanName, date, by, byName, source = 'Visit calendar — planned' }) {
  const clean = String(name || '').replace(/\s+/g, ' ').trim();
  if (isPlaceholderParty(clean)) return '';
  const line = `Planned on the visit calendar for ${date}${salesmanName ? ' · ' + salesmanName : ''}`;
  const found = await Lead.findOne({ company: new RegExp('^\\s*' + esc(clean) + '\\s*$', 'i') });
  if (found) { found.updates.push({ by: by || salesmanId, byName: byName || salesmanName || '', comment: line }); await found.save(); return String(found._id); }
  const lead = await Lead.create({
    name: clean, company: clean, source, status: 'NEW',
    assignedTo: salesmanId, assignedName: salesmanName || salesmanId, createdBy: by || salesmanId, createdByName: byName || salesmanName || '',
    notes: line, updates: [{ by: by || salesmanId, byName: byName || salesmanName || '', comment: line, status: 'NEW' }],
  });
  return String(lead._id);
}
