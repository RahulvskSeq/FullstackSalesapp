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
}, { timestamps:true });

export default mongoose.models.OutstandingFollowup || mongoose.model('OutstandingFollowup', followupSchema);