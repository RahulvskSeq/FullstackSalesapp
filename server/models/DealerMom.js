import mongoose from 'mongoose';

/**
 * DealerMom — minutes of a dealer visit, in the company's fixed format.
 *
 * One document per visit. The summary the salesman sees before the visit
 * (target vs achievement, outstanding, samples, previous MOM) is computed
 * live; what he decides and observes on the spot is written here.
 */
const S = new mongoose.Schema({
  dealerId:    { type: String, required: true, index: true },
  dealerName:  { type: String, default: '' },
  userId:      { type: String, required: true, index: true },   // salesman
  userName:    { type: String, default: '' },
  date:        { type: String, required: true, index: true },   // YYYY-MM-DD
  visitId:     { type: String, default: '' },                   // check-in visit, when one is open

  // snapshot of the figures the visit was based on, so the MOM reads the
  // same next month even after uploads move the live numbers
  zone:        { type: String, default: '' },
  volume:      { type: mongoose.Schema.Types.Mixed, default: null },   // { month, target, achieved }
  outstanding: { type: mongoose.Schema.Types.Mixed, default: null },   // { total, due, dueMonth }

  dealerFormFilled: { type: Boolean, default: false },
  samplesShown:     { type: String, default: '' },
  samplesGiven:     { type: String, default: '' },
  samplesTakenBack: { type: String, default: '' },
  // Threatening / Motivation / Appreciation / Close the counter — any one
  action:           { type: String, enum: ['', 'THREATENING', 'MOTIVATION', 'APPRECIATION', 'CLOSE_COUNTER'], default: '' },
  actionNote:       { type: String, default: '' },     // what was said
  paymentStatus:    { type: String, default: '' },     // status / follow-up note
  paymentCollected: { type: Number, default: 0 },      // collected on the visit
  paymentCollectionNote: { type: String, default: '' },
  reviewPaymentTerms: { type: String, default: '' },
  relineTerms:      { creditDays: { type: Number, default: null }, creditLimit: { type: Number, default: null }, note: { type: String, default: '' }, applied: { type: Boolean, default: false } },
  appUsageShown:    { type: Boolean, default: false },
  remarks:          { type: String, default: '' },
  previousReviewed: { type: Boolean, default: false },
  previousMomId:    { type: String, default: '' },
}, { timestamps: true });

S.index({ dealerId: 1, date: -1 });

export default mongoose.models.DealerMom || mongoose.model('DealerMom', S);
