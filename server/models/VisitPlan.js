import mongoose from 'mongoose';

/**
 * VisitPlan — "Rakesh, on the 24th, go to these four dealers."
 *
 * Written by the office from the Visit calendar, one row per dealer per
 * day per salesman, with the office's note for that visit. The salesman
 * sees his day on the same calendar and in the dealer's visit summary;
 * saving the MOM for that dealer that day marks the plan DONE.
 */
const S = new mongoose.Schema({
  date:        { type: String, required: true, index: true },      // YYYY-MM-DD
  salesmanId:  { type: String, required: true, index: true },
  dealerId:    { type: String, required: true, index: true },
  dealerName:  { type: String, default: '' },
  order:       { type: Number, default: 0 },                       // visit sequence for the day
  note:        { type: String, default: '' },                      // the office's instruction for this visit
  collectTarget: { type: Number, default: 0 },                     // rupees the office wants collected on this visit
  salesmanNote:{ type: String, default: '' },                      // what the salesman adds
  status:      { type: String, enum: ['PLANNED', 'DONE', 'SKIPPED'], default: 'PLANNED', index: true },
  momId:       { type: String, default: '' },
  plannedBy:   { type: String, default: '' },
  plannedByName: { type: String, default: '' },
  // A party not in the dealer list yet: dealerId is 'new:<id>' and dealerName is what the
  // salesman typed. At check-out he must give the real details, which land in `party`
  // (the name may be corrected then) and in a Lead for the office.
  newParty:    { type: Boolean, default: false },
  // A same-day UNPLANNED new party, added from the calendar's Unplanned visit box so it
  // can be checked in from there. Never a plan: not counted, not 'not visited'.
  walkIn:      { type: Boolean, default: false },
  party: {
    name: { type: String, default: '' }, gst: { type: String, default: '' }, noGst: { type: Boolean, default: false },
    city: { type: String, default: '' }, state: { type: String, default: '' }, phone: { type: String, default: '' },
  },
  visitId:     { type: String, default: '' },
  leadId:      { type: String, default: '' },
}, { timestamps: true });

S.index({ date: 1, salesmanId: 1, order: 1 });
S.index({ date: 1, salesmanId: 1, dealerId: 1 }, { unique: true });

export default mongoose.models.VisitPlan || mongoose.model('VisitPlan', S);
