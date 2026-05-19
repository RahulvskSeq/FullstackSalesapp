import mongoose from 'mongoose';
const S = new mongoose.Schema({
  dealerName:         { type:String, required:true, unique:true },
  monthlyOutstanding: { type:Map, of:Number, default:{} },
}, { timestamps:true });
export default mongoose.models.Outstanding || mongoose.model('Outstanding', S);
