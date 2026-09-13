import mongoose from 'mongoose';
import { opts } from './_common.js';
const S = new mongoose.Schema({
  type:        { type: String, required: true },
  status:      { type: String, enum: ['QUEUED', 'RUNNING', 'DONE', 'FAILED'], default: 'QUEUED', index: true },
  payload:     { type: mongoose.Schema.Types.Mixed, default: {} },
  progress:    { done: { type: Number, default: 0 }, total: { type: Number, default: 0 }, note: { type: String, default: '' } },
  result:      { type: mongoose.Schema.Types.Mixed, default: null },
  error:       { type: String, default: '' },
  attempts:    { type: Number, default: 0 },
  by:          { type: String, default: '' },
  heartbeatAt: { type: Date, default: null },
  startedAt:   { type: Date, default: null },
  finishedAt:  { type: Date, default: null },
}, opts('col_jobs'));
S.index({ status: 1, createdAt: 1 });
export default mongoose.models.ColJob || mongoose.model('ColJob', S);
