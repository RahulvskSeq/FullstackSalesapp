import mongoose from 'mongoose';
import { opts } from './_common.js';
/** Kept out of the documents that reference it so lists stay light. */
const S = new mongoose.Schema({
  kind:       { type: String, enum: ['payment_proof', 'other'], default: 'other' },
  mime:       { type: String, default: '' },
  size:       { type: Number, default: 0 },
  // Either the bytes (legacy / no Cloudinary) or a Cloudinary URL — never both.
  data:       { type: Buffer, select: false },
  url:        { type: String, default: '' },
  publicId:   { type: String, default: '' },
  resourceType: { type: String, default: '' },
  provider:   { type: String, enum: ['mongo', 'cloudinary'], default: 'mongo' },
  dealerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', default: null },
  uploadedBy: { type: String, default: '' },
}, opts('col_attachments'));
export default mongoose.models.ColAttachment || mongoose.model('ColAttachment', S);
