import mongoose from 'mongoose';
import { opts } from './_common.js';
/** Who changed what, with before and after. Append-only. */
const S = new mongoose.Schema({
  entity:   { type: String, required: true },
  entityId: { type: String, default: '' },
  action:   { type: String, required: true },
  before:   { type: mongoose.Schema.Types.Mixed, default: null },
  after:    { type: mongoose.Schema.Types.Mixed, default: null },
  by:       { type: String, default: '' },
  byName:   { type: String, default: '' },
  at:       { type: Date, default: Date.now },
  source:   { type: String, enum: ['ui', 'import', 'automation', 'tally', 'migration', 'system'], default: 'ui' },
  importId: { type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', default: null },
  ip:       { type: String, default: '' },
}, opts('col_audit'));
S.index({ entity: 1, entityId: 1, at: -1 });
S.index({ by: 1, at: -1 });
S.index({ at: -1 });
export default mongoose.models.ColAudit || mongoose.model('ColAudit', S);
