import mongoose from 'mongoose';

/**
 * SampleAllocation — a sample earmarked for a dealer, before it is given.
 *
 * Stock arrives zone-wise (sample master upload). It is allotted first to
 * the dealers the salesmen have marked STAR, KEY ACCOUNT or ACHIEVER in
 * that zone; whatever is left is tagged by hand from the software. When
 * the salesman hands it over on a visit, the allocation becomes GIVEN and
 * a SampleGiven record is written, so the existing "samples given" screens
 * keep working unchanged.
 */
const S = new mongoose.Schema({
  sampleId:   { type: String, required: true, index: true },
  sampleName: { type: String, default: '' },
  zone:       { type: String, default: '' },          // the sample's zone, as uploaded
  dealerId:   { type: String, required: true, index: true },
  dealerName: { type: String, default: '' },
  dealerZone: { type: String, default: '' },
  salesman:   { type: String, default: '', index: true },
  status:     { type: String, enum: ['REQUESTED', 'ALLOCATED', 'GIVEN', 'RETURNED', 'CANCELLED'], default: 'ALLOCATED', index: true },   // REQUESTED = a salesman asked, admin to approve
  source:     { type: String, enum: ['auto', 'sheet', 'manual', 'salesman'], default: 'auto' },
  reason:     { type: String, default: '' },          // e.g. "STAR · ZONE 2"
  takeBack:   { type: Boolean, default: false },      // admin wants it collected back on the next visit
  givenId:    { type: String, default: '' },          // SampleGiven _id once given
  givenDate:  { type: String, default: '' },
  returnedDate: { type: String, default: '' },
  createdBy:  { type: String, default: '' },
}, { timestamps: true });

S.index({ sampleId: 1, dealerId: 1 });

export default mongoose.models.SampleAllocation || mongoose.model('SampleAllocation', S);
