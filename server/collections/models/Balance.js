import mongoose from 'mongoose';
import { opts } from './_common.js';
export const BALANCE_STATUS = ['NEW', 'OPEN', 'FOLLOW_UP_REQUIRED', 'PROMISED', 'PARTIAL_PAYMENT', 'OVERDUE', 'HIGH_PRIORITY', 'CLEARED', 'CLOSED'];
export const PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
/** CURRENT state, one per dealer. The only collection the Outstanding list reads. */
const S = new mongoose.Schema({
  dealerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true, unique: true },
  dealerName:     { type: String, default: '' },     // denormalised for lists and search
  dealerCode:     { type: String, default: '' },
  salesmanId:     { type: String, default: '', index: true },
  total:          { type: Number, default: 0 },
  buckets:        { type: Map, of: Number, default: {} },
  balanceMode:    { type: String, enum: ['buckets', 'snapshot'], default: 'buckets' },
  oldestPeriod:   { type: String, default: '' },
  ageDays:        { type: Number, default: null },
  openCycleId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ColCycle', default: null },
  status:         { type: String, enum: BALANCE_STATUS, default: 'NEW', index: true },
  priority:       { type: String, enum: PRIORITY, default: 'MEDIUM' },
  lastImportId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', default: null },
  lastSnapshotAsOn: { type: String, default: '' },
  lastChangeAt:   { type: Date, default: null },
  lastPaymentAt:  { type: Date, default: null },
  lastFollowupAt: { type: Date, default: null },
  nextFollowupAt: { type: String, default: '' },      // YYYY-MM-DD
  promise:        { id: { type: mongoose.Schema.Types.ObjectId, ref: 'ColPromise' }, amount: Number, date: String },
  brokenPromises: { type: Number, default: 0 },
  version:        { type: Number, default: 0 },
}, opts('col_balances'));
S.index({ total: -1 });
S.index({ salesmanId: 1, status: 1 });
S.index({ nextFollowupAt: 1 });
S.index({ dealerName: 'text', dealerCode: 'text' });
export default mongoose.models.ColBalance || mongoose.model('ColBalance', S);
