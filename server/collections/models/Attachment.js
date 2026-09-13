import mongoose from 'mongoose';
import { opts } from './_common.js';
/** Kept out of the documents that reference it so lists stay light. */
const S = new mongoose.Schema({
  kind:       { type: String, enum: ['payment_proof', 'other'], default: 'other' },
  mime:       { type: String, default: '' },
  size:       { type: Number, default: 0 },
  data:       { type: Buffer, select: false },
  dealerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', default: null },
  uploadedBy: { type: String, default: '' },
}, opts('col_attachments'));
export default mongoose.models.ColAttachment || mongoose.model('ColAttachment', S);
