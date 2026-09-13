import mongoose from 'mongoose';
import { opts } from './_common.js';
const T = new mongoose.Schema({
  key:       { type: String, required: true, unique: true },
  metaName:  { type: String, default: '' },
  language:  { type: String, default: 'en' },
  body:      { type: String, default: '' },
  variables: { type: [String], default: [] },
  category:  { type: String, default: 'UTILITY' },
  active:    { type: Boolean, default: true },
}, opts('col_whatsapp_templates'));
export const ColWhatsAppTemplate = mongoose.models.ColWhatsAppTemplate || mongoose.model('ColWhatsAppTemplate', T);

const M = new mongoose.Schema({
  templateKey:       { type: String, required: true },
  dealerId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', default: null },
  to:                { type: String, required: true },
  variables:         { type: Map, of: String, default: {} },
  status:            { type: String, enum: ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'OPTED_OUT'], default: 'QUEUED', index: true },
  providerMessageId: { type: String, default: '', index: true },
  error:             { type: String, default: '' },
  events:            { type: [{ status: String, at: Date, raw: mongoose.Schema.Types.Mixed }], default: [] },
  sentBy:            { type: String, default: '' },
  refType:           { type: String, default: '' },
  refId:             { type: mongoose.Schema.Types.ObjectId, default: null },
  attempts:          { type: Number, default: 0 },
}, opts('col_whatsapp_messages'));
M.index({ dealerId: 1, createdAt: -1 });
export const ColWhatsAppMessage = mongoose.models.ColWhatsAppMessage || mongoose.model('ColWhatsAppMessage', M);
