import mongoose from 'mongoose';

// One pending bill as reported by Tally. The Excel flow only ever gave a
// month-total per dealer; Tally gives the individual invoices behind it, which
// buys real ageing and a bill number the salesman can quote on the phone.
//
// Each sync REPLACES the bill set for the parties it reports — a bill that has
// been paid simply stops appearing in Tally's receivables report — so this
// collection always mirrors "what is pending right now".
const S = new mongoose.Schema({
  dealerName: { type:String, required:true, index:true },  // matched Dealer master name
  partyName:  { type:String, default:'' },                 // raw Tally ledger name
  partyGuid:  { type:String, default:'', index:true },
  billNumber: { type:String, default:'' },
  billDate:   { type:String, default:'' },                 // 'YYYY-MM-DD'
  dueDate:    { type:String, default:'' },
  month:      { type:String, default:'', index:true },     // derived label, e.g. 'Jun-26'
  pending:    { type:Number, default:0 },
  ageDays:    { type:Number, default:0 },                  // asOn − billDate
  voucherType:{ type:String, default:'' },
  batchId:    { type:mongoose.Schema.Types.ObjectId, ref:'OutstandingBatch' },
  asOn:       { type:String, default:'' },
}, { timestamps:true });

S.index({ dealerName:1, month:1 });

export default mongoose.models.OutstandingBill || mongoose.model('OutstandingBill', S);
