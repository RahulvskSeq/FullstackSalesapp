import mongoose from 'mongoose';
const S = new mongoose.Schema({
  dealerId:  { type:String, required:true },
  userId:    { type:String, required:true },
  type:      { type:String, enum:['note','followup','call'], default:'note' },
  text:      { type:String, required:true },
  dueDate:   { type:String, default:null },
  completed: { type:Boolean, default:false },
}, { timestamps:true });
export default mongoose.models.Note || mongoose.model('Note', S);
