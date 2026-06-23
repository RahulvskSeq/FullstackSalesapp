import mongoose from 'mongoose';

/**
 * SalesTarget — per (salesman × category × month) volume target.
 *
 * Drives the "Volume Target" columns of the MTD Sales Summary table in
 * Sales by Category → Salesman-wise. One document per cell.
 */
const SalesTargetSchema = new mongoose.Schema({
  salesmanId: { type: String, required: true, index: true },   // userId of the salesman
  category:   { type: String, required: true, trim: true },    // e.g. "LAMINATE"
  month:      { type: String, required: true, index: true },   // "YYYY-MM"
  target:     { type: Number, default: 0 },
  setBy:      { type: String, default: '' },                   // who last edited
}, { timestamps: true });

// Each (salesman, category, month) combination is unique.
SalesTargetSchema.index({ salesmanId: 1, category: 1, month: 1 }, { unique: true });

export default mongoose.models.SalesTarget || mongoose.model('SalesTarget', SalesTargetSchema);
