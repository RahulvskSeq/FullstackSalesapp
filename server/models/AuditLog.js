import mongoose from 'mongoose';

// Append-only audit trail for the Outstanding module (and anything else that
// wants one): uploads, reverts, unmapped-party mappings, month edits.
const S = new mongoose.Schema({
  by:     { type:String, default:'' },   // user id
  byName: { type:String, default:'' },
  action: { type:String, required:true, index:true }, // e.g. 'outstanding.upload'
  detail: { type:mongoose.Schema.Types.Mixed, default:{} },
}, { timestamps:true });

S.index({ createdAt:-1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', S);
