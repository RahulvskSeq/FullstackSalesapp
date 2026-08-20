import mongoose from 'mongoose';

/**
 * SalesDelta — one row per change to a dealer's monthly "achieved" figure.
 *
 * Why this exists: sales themselves are stored per MONTH (see models/Sale.js —
 * one dealer x sub-category x month), so there is no trade date to report on
 * and day-level questions were unanswerable.
 *
 * But the team edits Monthly Entry every day, and the difference between the
 * old figure and the new one IS that day's business. Recording each change
 * turns those edits into genuine day-level data.
 *
 * Two things this is NOT:
 *   - It is not backfillable. Past edits overwrote the previous value with no
 *     record, so history starts the day this is switched on.
 *   - It is not an invoice ledger. A correction shows up as a negative delta,
 *     and a bulk upload rewrites a whole month at once (recorded with
 *     source:'upload' so reports can exclude it rather than show a fake spike).
 */
const S = new mongoose.Schema({
  dealerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', index: true },
  dealerName: { type: String, index: true },
  salesman:   { type: String, index: true },     // owner at the time of the change
  month:      { type: String, index: true },     // month the figure belongs to, e.g. "Aug-26"
  dateStr:    { type: String, index: true },     // day the change was recorded, "YYYY-MM-DD"
  prev:       { type: Number, default: 0 },
  next:       { type: Number, default: 0 },
  delta:      { type: Number, default: 0 },      // next - prev; the day's movement
  by:         { type: String, default: '' },     // user id who made the change
  source:     { type: String, default: 'entry', index: true },  // 'entry' | 'upload' | 'sync'
}, { timestamps: true });

// Day-wise rollups, optionally per salesman.
S.index({ dateStr: 1, salesman: 1 });
// "How did this month build up, day by day?"
S.index({ month: 1, dateStr: 1 });

export default mongoose.models.SalesDelta || mongoose.model('SalesDelta', S);
