import mongoose from 'mongoose';
import { opts } from './_common.js';
export const EVENT_TYPES = ['NEW_OUTSTANDING', 'INCREASED', 'DECREASED', 'CLEARED', 'UNCHANGED', 'REOPENED',
  'INVOICE_SEEN', 'INVOICE_SETTLED', 'PAYMENT_RECORDED', 'PAYMENT_CONFIRMED', 'PAYMENT_CANCELLED', 'PAYMENT_BOUNCED',
  'ADJUSTMENT', 'RECONCILIATION_DIFFERENCE', 'FOLLOWUP', 'PROMISE_MADE', 'PROMISE_KEPT', 'PROMISE_BROKEN', 'PROMISE_CANCELLED',
  'TASK_CREATED', 'TASK_DONE', 'TASK_CANCELLED', 'WHATSAPP_QUEUED', 'WHATSAPP_SENT', 'WHATSAPP_DELIVERED', 'WHATSAPP_FAILED',
  'MANUAL_EDIT', 'ASSIGNMENT_CHANGED', 'CYCLE_CLOSED_MANUAL'];
/** The Dealer 360 timeline. Append-only. */
const S = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  cycleId:  { type: mongoose.Schema.Types.ObjectId, ref: 'ColCycle', default: null },
  type:     { type: String, enum: EVENT_TYPES, required: true },
  amount:   { type: Number, default: null },
  before:   { type: Number, default: null },
  after:    { type: Number, default: null },
  cause:    { type: String, default: '' },     // for DECREASED: UNKNOWN | PAYMENT | ADJUSTMENT | INVOICE_SETTLED
  importId: { type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', default: null },
  refType:  { type: String, default: '' },
  refId:    { type: mongoose.Schema.Types.ObjectId, default: null },
  by:       { type: String, default: '' },
  at:       { type: Date, default: Date.now },
  note:     { type: String, default: '' },
  meta:     { type: mongoose.Schema.Types.Mixed, default: {} },
}, opts('col_events'));
S.index({ dealerId: 1, at: -1, _id: -1 });
S.index({ type: 1, at: -1 });
S.index({ importId: 1 });
export default mongoose.models.ColEvent || mongoose.model('ColEvent', S);
