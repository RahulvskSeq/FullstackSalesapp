import mongoose from 'mongoose';

/**
 * CatalogueMap — child code → the catalogue it belongs to.
 *
 * The ERP prints a private-label code on the invoice line (KAR 95, MHL 104)
 * while its "Category" column carries whatever the dealer's label is called.
 * That is not the catalogue the product actually comes from, so sales pile up
 * under the wrong name. This master sheet is the authority: one row per child
 * code, and in the supplied file 28,630 codes resolve to 60 catalogues with no
 * code claiming two.
 *
 * `designCode` is kept for reference but deliberately NOT used for matching —
 * 623 of 1,570 design codes appear under more than one catalogue, so resolving
 * by design would be a guess. A line that cannot be matched by child code
 * keeps whatever the sheet said.
 */
const S = new mongoose.Schema({
  // Uppercased, punctuation stripped — the form everything is matched on.
  childKey:   { type: String, required: true, unique: true, index: true },
  childCode:  { type: String, default: '' },   // as written in the sheet
  designCode: { type: String, default: '' },
  catalogue:  { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.CatalogueMap || mongoose.model('CatalogueMap', S);
