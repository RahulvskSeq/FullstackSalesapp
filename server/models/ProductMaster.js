import mongoose from 'mongoose';

/**
 * ProductMaster — one document per product row of the ERP "Product Master"
 * export. This is the lookup table that lets a raw Product Transaction row
 * be resolved to the app's own taxonomy.
 *
 * The ERP sheet carries three useful levels, which map onto the app like so:
 *
 *   ERP column        →  app concept        example
 *   ────────────────     ─────────────      ───────────────────────
 *   Category          →  brand/collection   "VN-TEX", "GROW (9.25X4)"
 *   Category Type     →  Category           "LAMINATE", "ROLLS"
 *   Product Type      →  Sub-Category       "1 MM", "WEAVED CANE"
 *
 * `productId` (ERP "ProductId") is the join key used by the transaction
 * import — NOT `code`. 2,535 of 5,362 product codes in the master are
 * duplicated across brands, so a code-only join silently picks the wrong
 * product.
 */
const ProductMasterSchema = new mongoose.Schema({
  productId:    { type: String, required: true, unique: true, index: true }, // ERP ProductId
  pdId:         { type: String, index: true },                               // ERP Pd-Id (size/variant row)

  // ERP "Parent Product". When it equals ProductId the row IS the parent —
  // the real catalogue entry. When it differs, the row is the same product
  // re-listed under another name (PASTELO -> PLATTER (PASTELO), RAJENDRA,
  // SRI RAM; AJMER -> QR CODES, AURA, ESSENCE). Sales are booked against
  // parents, so the child listings are noise on a sales report.
  parentProduct: { type: String, default: '', index: true },
  isParent:      { type: Boolean, default: false, index: true },

  name:         { type: String, trim: true },
  code:         { type: String, trim: true, index: true },

  brand:        { type: String, trim: true, index: true },   // ERP "Category"
  categoryType: { type: String, trim: true, index: true },   // ERP "Category Type" → app Category
  productType:  { type: String, trim: true, index: true },   // ERP "Product Type"  → app Sub-Category

  // Taxonomy after alias-normalisation onto the app's own Category list.
  category:     { type: String, trim: true, index: true },
  subCategory:  { type: String, trim: true, index: true },

  hsn:          { type: String, trim: true },
  gst:          { type: String, trim: true },
  size:         { type: String, trim: true },
  unit:         { type: String, trim: true },

  // Blank when the ERP master itself has no Category Type for this product.
  // These are surfaced in the import report rather than guessed at.
  unmapped:     { type: Boolean, default: false, index: true },

  uploadedBy:    { type: String, default: '' },
  uploadBatchId: { type: String, index: true },
}, { timestamps: true });

ProductMasterSchema.index({ categoryType: 1, productType: 1 });

export default mongoose.models.ProductMaster
  || mongoose.model('ProductMaster', ProductMasterSchema);
