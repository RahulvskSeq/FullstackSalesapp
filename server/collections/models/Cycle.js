import mongoose from 'mongoose';
import { opts } from './_common.js';
/** One continuous period of indebtedness. CLEARED is permanent. */
const S = new mongoose.Schema({
  dealerId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  cycleNo:         { type: Number, required: true },
  status:          { type: String, enum: ['OPEN', 'CLEARED', 'CLOSED_MANUAL'], default: 'OPEN' },
  openedAt:        { type: Date, required: true },
  openedByImportId:{ type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', default: null },
  openingTotal:    { type: Number, default: 0 },
  peakTotal:       { type: Number, default: 0 },
  closedAt:        { type: Date, default: null },
  closedByImportId:{ type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', default: null },
  closedBy:        { type: String, default: '' },
  closeReason:     { type: String, default: '' },
  finalTotal:      { type: Number, default: null },
  paidTotal:       { type: Number, default: 0 },
  observedDecreaseTotal: { type: Number, default: 0 },
}, opts('col_cycles'));
S.index({ dealerId: 1, cycleNo: 1 }, { unique: true });
S.index({ dealerId: 1, status: 1 });
// At most one OPEN cycle per dealer — enforced by the database, not by hope.
S.index({ dealerId: 1 }, { unique: true, partialFilterExpression: { status: 'OPEN' } });
export default mongoose.models.ColCycle || mongoose.model('ColCycle', S);
