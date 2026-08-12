import mongoose from 'mongoose';

// One row per dealer × month × upload — the permanent weekly trail. The main
// Outstanding record always holds the LATEST value per month; this collection
// answers "what did each Saturday's file say?" and powers batch revert
// (prevAmount = the value that month held immediately before this upload;
// null = the month didn't exist yet for this dealer).
const S = new mongoose.Schema({
  batchId:    { type:mongoose.Schema.Types.ObjectId, ref:'OutstandingBatch', required:true, index:true },
  dealerName: { type:String, required:true, index:true },
  month:      { type:String, required:true },       // canonical label, e.g. 'Aug-26'
  amount:     { type:Number, default:0 },
  prevAmount: { type:Number, default:null },
  uploadedBy: { type:String, default:'' },
}, { timestamps:true });

S.index({ dealerName:1, month:1, createdAt:-1 });

export default mongoose.models.OutstandingHistory || mongoose.model('OutstandingHistory', S);
