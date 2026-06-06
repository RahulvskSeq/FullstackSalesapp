import mongoose from 'mongoose';

const followupSchema = new mongoose.Schema({
  dealerName:  { type:String, required:true },
  salesman:    { type:String, default:'' },
  amount:      { type:Number, default:0 },
  followupDate:{ type:String, required:true }, // 'YYYY-MM-DD'
  comment:     { type:String, default:'' },
  status:      { type:String, enum:['pending','done','overdue'], default:'pending' },
  type:        { type:String, default:'followup' }, // followup | no-pickup
  createdBy:   { type:String, default:'' },
  // Optional payment proof — base64 image (receipt, cheque pic, screenshot)
  // attached when the user marks the followup as Collected.
  paymentProof:{ type:String, default:'' },
  // Amount actually collected (when status flips to 'done')
  collectedAmount: { type:Number, default:0 },
  collectedAt:     { type:Date,   default:null },
}, { timestamps:true });

export default mongoose.models.OutstandingFollowup || mongoose.model('OutstandingFollowup', followupSchema);