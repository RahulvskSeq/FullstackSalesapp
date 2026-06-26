import mongoose from 'mongoose';

const followupSchema = new mongoose.Schema({
  dealerName:  { type:String, required:true },
  salesman:    { type:String, default:'' },
  amount:      { type:Number, default:0 },
  followupDate:{ type:String, required:true }, // 'YYYY-MM-DD'
  comment:     { type:String, default:'' },
  // Preset reason chosen from the dropdown (e.g. 'Payment Collected',
  // 'Postponed the Payment Date'). Empty for 'Others'/free-text.
  reason:      { type:String, default:'' },
  // Which outstanding-month(s) this follow-up applies to. Tagging here lets
  // the dealer's history strip show "[Jun-26] Postponed payment" etc., and
  // lets us answer "what did I say about Jul-26 last month?" later.
  // Empty array = applies generally (back-compat with old rows).
  months:      { type:[String], default: [] },
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