import mongoose from 'mongoose';
import { opts } from './_common.js';
/** Bill-level pending, where the source provides it. */
const S = new mongoose.Schema({
  dealerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  cycleId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ColCycle', default: null },
  billRef:   { type: String, required: true },
  billDate:  { type: String, default: '' },
  dueDate:   { type: String, default: '' },
  period:    { type: String, default: '' },         // YYYY-MM of billDate
  amount:    { type: Number, default: 0 },
  pending:   { type: Number, default: 0 },
  status:    { type: String, enum: ['OPEN', 'SETTLED', 'WRITTEN_OFF'], default: 'OPEN' },
  source:    { type: String, default: '' },
  firstSeenImportId: { type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', default: null },
  lastSeenImportId:  { type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', default: null },
  settledAt: { type: Date, default: null },
}, opts('col_invoices'));
S.index({ dealerId: 1, billRef: 1 }, { unique: true });
S.index({ dealerId: 1, status: 1 });
S.index({ dueDate: 1 });
export default mongoose.models.ColInvoice || mongoose.model('ColInvoice', S);
