import mongoose from 'mongoose';
import { opts } from './_common.js';
export const PAYMENT_MODES = ['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'CARD', 'OTHER'];
/** Explicit money received. Never inferred from a statement; never deleted by an import. */
const S = new mongoose.Schema({
  paymentNo:     { type: Number, required: true, unique: true },
  dealerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  cycleId:       { type: mongoose.Schema.Types.ObjectId, ref: 'ColCycle', default: null },
  salesmanId:    { type: String, default: '', index: true },
  date:          { type: String, required: true },     // YYYY-MM-DD
  amount:        { type: Number, required: true },
  mode:          { type: String, enum: PAYMENT_MODES, default: 'OTHER' },
  reference:     { type: String, default: '' },
  bankReference: { type: String, default: '' },
  collectedBy:   { type: String, default: '' },
  enteredBy:     { type: String, default: '' },
  remarks:       { type: String, default: '' },
  proofId:       { type: mongoose.Schema.Types.ObjectId, ref: 'ColAttachment', default: null },
  status:        { type: String, enum: ['RECORDED', 'CONFIRMED', 'BOUNCED', 'CANCELLED'], default: 'RECORDED', index: true },
  allocated:     { type: Number, default: 0 },
  unallocated:   { type: Number, default: 0 },
  confirmedBy:   { type: String, default: '' },
  confirmedAt:   { type: Date, default: null },
  cancelledBy:   { type: String, default: '' },
  cancelReason:  { type: String, default: '' },
  source:        { type: String, enum: ['manual', 'migrated', 'statement'], default: 'manual' },
  legacyId:      { type: String, default: '' },
}, opts('col_payments'));
S.index({ dealerId: 1, date: -1 });
S.index({ date: -1 });
export default mongoose.models.ColPayment || mongoose.model('ColPayment', S);
