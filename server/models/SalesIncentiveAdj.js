import mongoose from 'mongoose';

/**
 * SalesIncentiveAdj — the parts of the salesman incentive the system cannot
 * see, entered per salesman per month.
 *
 * Display value, project sales, late-paid sales and bad debt all change the
 * payout, and none of them exist in the sales data: an invoice line does not
 * record whether it was discounted below the project threshold, and nothing
 * links a sale to the date its payment cleared. Rather than guess at those,
 * they are typed in here and the calculation stays honest about where each
 * number came from.
 *
 * One document per salesman per month. Absent means all zero, which is the
 * same as "no adjustments", so a month nobody has touched still computes.
 */
const S = new mongoose.Schema({
  month:      { type: String, required: true, index: true },   // YYYY-MM
  salesmanId: { type: String, required: true, index: true },

  // Each figure is worked out from the data when it can be (see
  // lib/salesIncentiveFacts.js). A number here OVERRIDES that; null means
  // "use what the system found".
  // Rupee value of display material sold to dealers — earns displayPct.
  displayValue:       { type: Number, default: null },
  // Laminate sheets sold at or below the project-sale price: half credit.
  projectSheets:      { type: Number, default: null },
  // Laminate sheets on sales not collected inside the 90-day window: no credit.
  latePaymentSheets:  { type: Number, default: null },
  // Balance still to recover; 25% of each month's incentive goes against it.
  // Set when accounts declare it; later months carry it forward minus what
  // each month recovered, unless typed again.
  badDebtOutstanding: { type: Number, default: null },

  // Section 3: a project-sale payout needs management approval.
  projectApproved:    { type: Boolean, default: false },
  projectApprovedBy:  { type: String, default: '' },
  projectApprovedAt:  { type: Date, default: null },

  // Section 4: the month is paid once, in full, after the hold. The figures
  // are frozen here so a later return or upload cannot rewrite a paid slip.
  paidAt:     { type: Date, default: null },
  paidBy:     { type: String, default: '' },
  paid:       { type: mongoose.Schema.Types.Mixed, default: null },

  note:       { type: String, default: '' },
  updatedBy:  { type: String, default: '' },
}, { timestamps: true });

S.index({ month: 1, salesmanId: 1 }, { unique: true });

export default mongoose.models.SalesIncentiveAdj || mongoose.model('SalesIncentiveAdj', S);
