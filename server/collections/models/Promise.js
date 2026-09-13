import mongoose from 'mongoose';
import { opts } from './_common.js';
export const PROMISE_STATUS = ['PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'BROKEN', 'CANCELLED'];
const S = new mongoose.Schema({
  dealerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  cycleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'ColCycle', default: null },
  employeeId:  { type: String, required: true },
  amount:      { type: Number, required: true },
  promiseDate: { type: String, required: true },
  status:      { type: String, enum: PROMISE_STATUS, default: 'PENDING' },
  received:    { type: Number, default: 0 },
  followupId:  { type: mongoose.Schema.Types.ObjectId, ref: 'ColFollowUp', default: null },
  notes:       { type: String, default: '' },
  brokenAt:    { type: Date, default: null },
  fulfilledAt: { type: Date, default: null },
  cancelledBy: { type: String, default: '' },
  cancelReason:{ type: String, default: '' },
  legacyId:    { type: String, default: '' },
}, opts('col_promises'));
S.index({ dealerId: 1, status: 1 });
S.index({ promiseDate: 1, status: 1 });
S.index({ employeeId: 1, status: 1 });
export default mongoose.models.ColPromise || mongoose.model('ColPromise', S);
