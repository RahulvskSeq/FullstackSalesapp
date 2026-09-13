import mongoose from 'mongoose';
import { opts } from './_common.js';
const S = new mongoose.Schema({
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ColPayment', required: true },
  dealerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  cycleId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ColCycle', default: null },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ColInvoice', default: null },
  period:    { type: String, default: '' },         // bucket reduced, when no invoice
  amount:    { type: Number, required: true },
  by:        { type: String, default: '' },
}, opts('col_payment_allocations'));
S.index({ paymentId: 1 });
S.index({ invoiceId: 1 });
export default mongoose.models.ColPaymentAllocation || mongoose.model('ColPaymentAllocation', S);
