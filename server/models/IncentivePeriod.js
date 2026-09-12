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
const rowSchema = new mongoose.Schema({
  person:   { type: String, required: true },
  units:    { type: Number, default: 0 },
  invoices: { type: Number, default: 0 },
  lines:    { type: Number, default: 0 },
}, { _id: false });

const S = new mongoose.Schema({
  month:      { type: String, required: true, unique: true, index: true },  // YYYY-MM
  rows:       { type: [rowSchema], default: [] },
  fileName:   { type: String, default: '' },
  uploadedBy: { type: String, default: '' },
  // What the previous upload for this month held, so replacing one is not a
  // one-way door.
  replaced:   { type: [rowSchema], default: [] },
}, { timestamps: true });

export default mongoose.models.IncentivePeriod || mongoose.model('IncentivePeriod', S);
