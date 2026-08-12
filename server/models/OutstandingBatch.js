import mongoose from 'mongoose';

// One Saturday upload = one batch. The batch is the audit anchor: it records
// what file was uploaded, when, by whom, which months it touched, how many
// parties matched the Dealer master and which didn't. Batches are NEVER
// deleted — a bad upload is marked REVERTED (values restored from history)
// but its record and rows remain for audit.
const S = new mongoose.Schema({
  fileName:       { type:String, default:'' },
  // Canonical month labels this upload wrote (e.g. ['Jun-26','Jul-26','Aug-26'])
  months:         { type:[String], default:[] },
  uploadedBy:     { type:String, default:'' },   // user id
  uploadedByName: { type:String, default:'' },
  totalRecords:   { type:Number, default:0 },    // rows in the file
  matchedRecords: { type:Number, default:0 },
  unmappedRecords:{ type:Number, default:0 },
  totalAmount:    { type:Number, default:0 },    // sum of the latest-month column
  // Parties that matched no dealer in the Dealer master. Amounts kept so an
  // admin can map them to a dealer later without re-uploading the file.
  // [{ party:'ABC Traders', amounts:{ 'Aug-26': 150000 } }]
  unmapped:       { type:[{ party:String, amounts:{} }], default:[] },
  status:         { type:String, enum:['ACTIVE','REVERTED'], default:'ACTIVE' },
  revertedBy:     { type:String, default:'' },
  revertedAt:     { type:Date,   default:null },
  revertReason:   { type:String, default:'' },
}, { timestamps:true });

S.index({ createdAt:-1 });

export default mongoose.models.OutstandingBatch || mongoose.model('OutstandingBatch', S);
