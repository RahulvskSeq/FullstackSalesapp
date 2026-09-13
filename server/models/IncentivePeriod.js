import mongoose from 'mongoose';

/**
 * IncentivePeriod — units billed per person for one month, from an uploaded
 * sheet rather than from the ERP invoice lines.
 *
 * Kept separate from ProductTxn on purpose. The ERP import exists to answer
 * "what was sold"; this answers "what does each person get paid on". Writing
 * uploaded figures into ProductTxn would mix a payroll input into the sales
 * data and quietly change every sales report built on it.
 *
 * One document per month. Re-uploading the same month replaces it, so a
 * corrected sheet is just uploaded again — and the previous rows are kept in
 * `replaced` so a mistake is recoverable without a database restore.
 */
/**
 * One day's billing for one person.
 *
 * The month totals are kept alongside, but the days are what make a repeat
 * upload safe: the export is a rolling window (it came through as 31 Aug to
 * 12 Sep), so replacing a whole month with whatever the latest file happens to
 * cover would delete the days that have scrolled out of that window. Uploading
 * replaces only the days the sheet actually contains.
 */
const daySchema = new mongoose.Schema({
  day:      { type: String, required: true },   // YYYY-MM-DD
  units:    { type: Number, default: 0 },
  invoices: { type: Number, default: 0 },
  lines:    { type: Number, default: 0 },
}, { _id: false });

const rowSchema = new mongoose.Schema({
  person:   { type: String, required: true },
  units:    { type: Number, default: 0 },
  invoices: { type: Number, default: 0 },
  lines:    { type: Number, default: 0 },
  days:     { type: [daySchema], default: [] },
}, { _id: false });

const S = new mongoose.Schema({
  month:      { type: String, required: true, unique: true, index: true },  // YYYY-MM
  rows:       { type: [rowSchema], default: [] },
  fileName:   { type: String, default: '' },
  uploadedBy: { type: String, default: '' },
  // Days deliberately closed — a holiday, a shutdown, anything with no
  // billing that is not a missed upload. Without this every closed day would
  // sit in the gap list for ever and the reminder would cry wolf.
  holidays:   { type: [String], default: [] },   // YYYY-MM-DD

  // What the previous upload for this month held, so replacing one is not a
  // one-way door.
  replaced:   { type: [rowSchema], default: [] },
}, { timestamps: true });

export default mongoose.models.IncentivePeriod || mongoose.model('IncentivePeriod', S);
