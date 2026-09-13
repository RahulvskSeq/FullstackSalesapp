import mongoose from 'mongoose';
import { opts } from './_common.js';
export const CHANNELS = ['CALL', 'VISIT', 'WHATSAPP', 'EMAIL', 'SMS', 'OTHER'];
export const OUTCOMES = ['NO_ANSWER', 'CALLBACK', 'PROMISED', 'DISPUTED', 'PARTIAL', 'PAID', 'NOT_REACHABLE', 'OTHER'];
/** Every interaction, permanent. */
const S = new mongoose.Schema({
  dealerId:         { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', required: true },
  cycleId:          { type: mongoose.Schema.Types.ObjectId, ref: 'ColCycle', default: null },
  employeeId:       { type: String, required: true, index: true },
  date:             { type: String, required: true },   // YYYY-MM-DD
  time:             { type: String, default: '' },      // HH:MM
  channel:          { type: String, enum: CHANNELS, default: 'CALL' },
  discussion:       { type: String, default: '' },
  outcome:          { type: String, enum: OUTCOMES, default: 'OTHER' },
  customerResponse: { type: String, default: '' },
  promiseId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ColPromise', default: null },
  nextFollowupDate: { type: String, default: '' },
  nextAction:       { type: String, default: '' },
  remarks:          { type: String, default: '' },
  createdBy:        { type: String, default: '' },
  source:           { type: String, enum: ['app', 'migrated', 'automation'], default: 'app' },
  legacyId:         { type: String, default: '' },
  legacy:           { type: mongoose.Schema.Types.Mixed, default: null },   // reason/months/type from the old record
}, opts('col_followups'));
S.index({ dealerId: 1, date: -1 });
S.index({ employeeId: 1, date: -1 });
S.index({ nextFollowupDate: 1 });
export default mongoose.models.ColFollowUp || mongoose.model('ColFollowUp', S);
