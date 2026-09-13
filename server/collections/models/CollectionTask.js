import mongoose from 'mongoose';
import { opts } from './_common.js';
export const TASK_TYPES = ['CALL', 'VISIT', 'PAYMENT_COLLECTION', 'WHATSAPP', 'SEND_STATEMENT', 'SEND_INVOICE',
  'FOLLOW_UP', 'ESCALATION', 'VERIFICATION', 'PROMISE_FOLLOW_UP', 'CUSTOM'];
export const TASK_PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const TASK_STATUS = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'EXPIRED'];
/** Collection tasks — distinct from the application's generic `tasks` collection. */
const S = new mongoose.Schema({
  taskNo:      { type: Number, required: true, unique: true },
  dealerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  cycleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'ColCycle', default: null },
  employeeId:  { type: String, required: true },
  type:        { type: String, enum: TASK_TYPES, required: true },
  priority:    { type: String, enum: TASK_PRIORITY, default: 'MEDIUM' },
  dueDate:     { type: String, required: true },
  dueTime:     { type: String, default: '' },
  status:      { type: String, enum: TASK_STATUS, default: 'OPEN' },
  points:      { type: Number, default: 0 },
  description: { type: String, default: '' },
  comments:    { type: [{ by: String, at: { type: Date, default: Date.now }, text: String }], default: [] },
  createdBy:   { type: String, default: '' },
  source:      { type: String, enum: ['manual', 'automation', 'promise', 'import'], default: 'manual' },
  ruleId:      { type: String, default: '' },
  dedupeKey:   { type: String, default: '' },     // (ruleId, dealerId, cycleId, day) — automation never repeats itself
  promiseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'ColPromise', default: null },
  completedBy: { type: String, default: '' },
  completedAt: { type: Date, default: null },
}, opts('col_tasks'));
S.index({ employeeId: 1, status: 1, dueDate: 1 });
S.index({ dealerId: 1, status: 1 });
S.index({ dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string', $gt: '' } } });
export default mongoose.models.ColTask || mongoose.model('ColTask', S);
