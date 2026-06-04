import mongoose from 'mongoose';

const S = new mongoose.Schema({
  userId:    { type:String, required:true },
  userName:  { type:String, default:'' },
  // ISO date strings YYYY-MM-DD inclusive
  fromDate:  { type:String, required:true },
  toDate:    { type:String, required:true },
  // CASUAL | SICK | EARNED | UNPAID | OTHER
  leaveType: { type:String, default:'CASUAL' },
  reason:    { type:String, default:'' },
  // PENDING | APPROVED | REJECTED
  status:    { type:String, default:'PENDING' },
  // Admin's note when approving/rejecting
  reviewedBy:     { type:String, default:'' },
  reviewedByName: { type:String, default:'' },
  reviewComment:  { type:String, default:'' },
  reviewedAt:     { type:Date,   default:null },
}, { timestamps:true });

S.index({ userId:1, fromDate:1 });
S.index({ status:1 });

export default mongoose.models.Leave || mongoose.model('Leave', S);
