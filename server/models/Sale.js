import mongoose from 'mongoose';

/**
 * Sale — one line item = one dealer × one sub-category × one month.
 *
 * The wide Excel upload (one row per dealer, columns = product types) is
 * exploded server-side into many of these documents so we can aggregate
 * cleanly later (by category, by dealer, by salesman).
 *
 * The month string is normalized to YYYY-MM (e.g. "2026-06") so queries
 * can use simple equality/range filters without needing Date parsing.
 */

const SaleSchema = new mongoose.Schema({
  dealerName:    { type: String, required: true, trim: true, index: true },
  dealerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },

  salesman:      { type: String, trim: true, index: true },

  month:         { type: String, required: true, index: true },     // "YYYY-MM"

  category:      { type: String, required: true, trim: true, index: true },
  subCategory:   { type: String, required: true, trim: true, index: true },

  // The ERP "Category" on the transaction line - the collection actually
  // sold ("VN-TEX", "PASTELO"). Blank on manually keyed rows, which have no
  // such concept. Adding it splits rows more finely but changes no total:
  // every read of Sale groups and sums qty.
  brand:         { type: String, default: '', trim: true, index: true },

  qty:           { type: Number, default: 0 },

  uploadedBy:    { type: String, default: '' },
  uploadBatchId: { type: String, index: true },                     // groups one upload together

  // Where this row came from. 'manual' is the wide Monthly Entry upload;
  // 'erp' is derived from imported ProductTxn invoice lines. Kept so an
  // ERP re-sync can replace only its own rows and never silently clobber
  // a month that was keyed in by hand.
  source:        { type: String, default: 'manual', index: true },  // 'manual' | 'erp'
}, { timestamps: true });

// Each combination (dealer + sub-cat + month) is unique per upload batch.
SaleSchema.index({ dealerName: 1, subCategory: 1, month: 1 }, { unique: false });

export default mongoose.models.Sale || mongoose.model('Sale', SaleSchema);
