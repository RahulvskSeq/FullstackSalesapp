import mongoose from 'mongoose';
import { opts } from './_common.js';
const S = new mongoose.Schema({
  employeeId:    { type: String, required: true },
  period:        { type: String, required: true },      // YYYY-MM
  metrics:       { type: Map, of: Number, default: {} },
  inputs:        { type: mongoose.Schema.Types.Mixed, default: {} },   // what each metric was computed from
  weights:       { type: Map, of: Number, default: {} },   // snapshot of settings at generation
  score:         { type: Number, default: 0 },
  managerReview: { score: Number, notes: String, by: String, at: Date },
  status:        { type: String, enum: ['DRAFT', 'FINAL'], default: 'DRAFT' },
  generatedBy:   { type: String, default: '' },
}, opts('col_employee_reviews'));
S.index({ employeeId: 1, period: 1 }, { unique: true });
export default mongoose.models.ColEmployeeReview || mongoose.model('ColEmployeeReview', S);
