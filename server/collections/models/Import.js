import mongoose from 'mongoose';
import { opts } from './_common.js';
/** One per file received. Immutable once APPLIED; DUPLICATE/FAILED are kept too. */
const S = new mongoose.Schema({
  fileName:    { type: String, default: '' },
  fileHash:    { type: String, index: true },
  fileSize:    { type: Number, default: 0 },
  source:      { type: String, enum: ['excel', 'tally', 'legacy', 'manual', 'invoice'], default: 'excel', index: true },
  balanceMode: { type: String, enum: ['buckets', 'snapshot'], default: 'buckets' },
  balanceModeDetected: { type: String, default: '' },
  asOn:        { type: String, default: '' },          // YYYY-MM-DD the statement represents
  periods:     { type: [String], default: [] },        // YYYY-MM present in the file
  uploadedBy:  { type: String, default: '' },
  uploadedByName: { type: String, default: '' },
  status:      { type: String, enum: ['STAGED', 'VALIDATED', 'PREVIEWED', 'APPLYING', 'APPLIED', 'FAILED', 'DUPLICATE', 'REVERTED', 'SUPERSEDED'], default: 'STAGED', index: true },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', default: null },
  stats: {
    rows: { type: Number, default: 0 }, parties: { type: Number, default: 0 },
    matched: { type: Number, default: 0 }, unmapped: { type: Number, default: 0 }, errors: { type: Number, default: 0 },
    duplicatesInFile: { type: Number, default: 0 },
    new: { type: Number, default: 0 }, increased: { type: Number, default: 0 }, decreased: { type: Number, default: 0 },
    cleared: { type: Number, default: 0 }, unchanged: { type: Number, default: 0 }, reopened: { type: Number, default: 0 },
    // parties left out of the file (nil in Tally): cleared, or held back when a whole block / too many are missing
    absentCleared: { type: Number, default: 0 }, absentClearedAmount: { type: Number, default: 0 },
    absentSkipped: { type: Number, default: 0 }, absentSkippedAmount: { type: Number, default: 0 },
    absentSkippedBlocks: { type: [{ salesmanId: String, n: Number, amount: Number }], default: [] }, absentTooMany: { type: Boolean, default: false },
    absentMissing: { type: Number, default: 0 }, absentMissingAmount: { type: Number, default: 0 },
    // dealers whose older columns moved against the previous statement; too many = file on a different basis
    columnShift: { type: Number, default: 0 }, columnShiftPct: { type: Number, default: 0 }, columnShiftTooMany: { type: Boolean, default: false },
    totalBefore: { type: Number, default: 0 }, totalAfter: { type: Number, default: 0 },
  },
  errorReport: { type: [{ row: Number, message: String }], default: [] },
  jobId:       { type: mongoose.Schema.Types.ObjectId, ref: 'ColJob', default: null },
  appliedBy:   { type: String, default: '' },
  appliedAt:   { type: Date, default: null },
  durationMs:  { type: Number, default: 0 },
  appliedChunks: { type: [Number], default: [] },
  reverted:    { by: String, at: Date, reason: String },
}, opts('col_imports'));
S.index({ createdAt: -1 });
S.index({ source: 1, asOn: 1, status: 1 });
export default mongoose.models.ColImport || mongoose.model('ColImport', S);
