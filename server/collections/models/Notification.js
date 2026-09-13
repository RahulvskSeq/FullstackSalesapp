import mongoose from 'mongoose';
import { opts } from './_common.js';
const S = new mongoose.Schema({
  userId:  { type: String, required: true },
  type:    { type: String, default: '' },
  title:   { type: String, default: '' },
  body:    { type: String, default: '' },
  refType: { type: String, default: '' },
  refId:   { type: mongoose.Schema.Types.ObjectId, default: null },
  readAt:  { type: Date, default: null },
}, opts('col_notifications'));
S.index({ userId: 1, readAt: 1, createdAt: -1 });
export default mongoose.models.ColNotification || mongoose.model('ColNotification', S);
