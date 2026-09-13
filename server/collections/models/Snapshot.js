import mongoose from 'mongoose';
import { opts } from './_common.js';
/** What a source said about a party at a point in time. Append-only. */
const S = new mongoose.Schema({
  importId:       { type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', required: true },
  dealerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  source:         { type: String, default: 'excel' },
  asOn:           { type: String, required: true },
  balanceMode:    { type: String, enum: ['buckets', 'snapshot'], required: true },
  buckets:        { type: Map, of: Number, default: {} },
  total:          { type: Number, default: 0 },
  prevSnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ColSnapshot', default: null },
  prevTotal:      { type: Number, default: null },
  delta:          { type: Number, default: 0 },
  classification: { type: String, enum: ['NEW', 'INCREASED', 'DECREASED', 'CLEARED', 'UNCHANGED', 'REOPENED'], required: true },
  superseded:     { type: Boolean, default: false },
}, opts('col_snapshots'));
S.index({ dealerId: 1, asOn: -1, createdAt: -1 });
S.index({ importId: 1, dealerId: 1 }, { unique: true });
export default mongoose.models.ColSnapshot || mongoose.model('ColSnapshot', S);
