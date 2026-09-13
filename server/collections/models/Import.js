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
