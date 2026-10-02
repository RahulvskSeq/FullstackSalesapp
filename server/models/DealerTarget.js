import mongoose from 'mongoose';

/**
 * DealerTarget — the plan for one dealer in one month, set in Sheets → Dealers target.
 *
 * The sheet suggests a target (last 3 months' average + 10%) and the office — or a
 * salesman allowed to — sets the status and target for the month. Saved here as a
 * plan of its own; nothing is written onto the dealer record. The sales it was
 * based on are kept with it, so the plan can be read back later as it was made.
 */
const S = new mongoose.Schema({
  month:       { type: String, required: true, index: true },   // 'YYYY-MM' the target is for
  dealerId:    { type: String, required: true, index: true },
  dealerName:  { type: String, default: '' },
  salesmanId:  { type: String, default: '', index: true },      // owner when the plan was saved
  status:      { type: String, default: 'NONE' },               // STAR / KEY ACCOUNT / ACHIEVER / REACTIVE / NONE
  statusBefore:{ type: String, default: '' },                   // the dealer's status when the plan was made
  target:      { type: Number, default: 0 },
  auto:        { type: Number, default: 0 },                    // suggested: 3-month average + 10%
  avg3:        { type: Number, default: 0 },
  avg6:        { type: Number, default: 0 },
  sales:       { type: [Number], default: [] },                 // the 6 months before, oldest first
  salesMonths: { type: [String], default: [] },                 // their labels, e.g. 'Apr-26'
  changedBy:   { type: String, default: '' },
  changedByName: { type: String, default: '' },
}, { timestamps: true });

S.index({ month: 1, dealerId: 1 }, { unique: true });

export default mongoose.models.DealerTarget || mongoose.model('DealerTarget', S);
