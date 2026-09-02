import mongoose from 'mongoose';

/**
 * ProductTxn — one document per line of the ERP "Product Transaction" export.
 *
 * Unlike Sale (which is dealer × sub-category × MONTH and has no day-level
 * date), this keeps the real invoice date and time, so genuine day-wise and
 * brand-wise reporting is possible.
 *
 * Idempotency: (voucherNo + pdId + lineNo) is unique. Re-uploading an export
 * that overlaps a previous one updates the existing rows instead of
 * double-counting, so overlapping date ranges are safe to drop in.
 */
const ProductTxnSchema = new mongoose.Schema({
  voucherNo:  { type: String, required: true, index: true },
  lineNo:     { type: Number, default: 0 },      // disambiguates repeated products on one voucher
  status:     { type: String, trim: true },      // ERP "Status" e.g. "Sales Invoice"

  date:       { type: Date, index: true },
  dateStr:    { type: String, index: true },     // "YYYY-MM-DD"
  month:      { type: String, index: true },     // "YYYY-MM" — matches Sale.month
  timeStr:    { type: String, default: '' },

  // ── product identity (from the transaction sheet) ──
  productId:   { type: String, index: true },    // ERP PID
  pdId:        { type: String, index: true },    // ERP PDID
  productName: { type: String, trim: true },
  productCode: { type: String, trim: true },
  txnBrand:    { type: String, trim: true, index: true }, // the sheet's own "Category"

  // ── taxonomy resolved via ProductMaster ──
  brand:        { type: String, trim: true, index: true },  // the sold collection, from the txn sheet
  masterBrand:  { type: String, trim: true },                // every collection the product sits in
  categoryType: { type: String, trim: true, index: true },
  productType:  { type: String, trim: true, index: true },
  category:     { type: String, trim: true, index: true }, // normalised to app Category
  subCategory:  { type: String, trim: true, index: true },
  resolved:     { type: Boolean, default: false, index: true },

  // ── quantities / money ──
  qty:        { type: Number, default: 0 },
  price:      { type: Number, default: 0 },
  amount:     { type: Number, default: 0 },
  netTotal:   { type: Number, default: 0 },
  size:       { type: String, trim: true },
  unit:       { type: String, trim: true },

  // ── party ──
  partyName:   { type: String, trim: true },
  companyName: { type: String, trim: true, index: true },
  partyRole:   { type: String, trim: true },
  dealerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer' },
  dealerName:  { type: String, trim: true, index: true },   // '' when not matched
  city:        { type: String, trim: true },
  state:       { type: String, trim: true },

  // ── salesman ──
  salesPersonRaw: { type: String, trim: true },
  salesman:       { type: String, trim: true, index: true }, // display name; '' when not matched
  // Sale.salesman / Dealer.salesman store the user *id* ("rakesh"), not the
  // display name. Kept separately so the sales sync writes rows that the
  // rest of the app can filter on.
  salesmanId:     { type: String, trim: true, index: true },
  // 'sheet' when the export carried Category Type / Product Type itself,
  // 'master' when the taxonomy came from a ProductMaster lookup.
  taxonomyFrom:   { type: String, trim: true, default: '' },

  uploadedBy:    { type: String, default: '' },
  uploadBatchId: { type: String, index: true },
}, { timestamps: true });

ProductTxnSchema.index({ voucherNo: 1, pdId: 1, lineNo: 1 }, { unique: true });
ProductTxnSchema.index({ dateStr: 1, category: 1 });
ProductTxnSchema.index({ month: 1, salesman: 1 });

export default mongoose.models.ProductTxn
  || mongoose.model('ProductTxn', ProductTxnSchema);
