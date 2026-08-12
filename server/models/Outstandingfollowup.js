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

  // ── Payment commitment tracking ──────────────────────────────────────
  // A follow-up with `amount > 0` is a COMMITMENT: the dealer promised to
  // pay that much by `followupDate`. Its life-cycle:
  //   received  = creditedManual + creditedFromUpload
  //   OPEN      → promise date not yet passed, received < amount
  //   BROKEN    → promise date passed,  received < amount  (Commitments tab)
  //   SETTLED   → received >= amount                       (back to normal)
  // Only staff (admin / superadmin / accounts) may credit money; salesmen
  // set the promise (date + comment + amount) but never the receipt.
  creditedManual:     { type:Number, default:0 },   // entered by admin/accounts
  creditedFromUpload: { type:Number, default:0 },   // inferred from a Saturday sheet drop
  settledAt:          { type:Date,   default:null },
  // Audit of every credit applied to this commitment.
  credits: {
    type: [{
      amount: Number,
      source: { type:String, enum:['manual','upload'], default:'manual' },
      by:     String,
      at:     { type:Date, default:Date.now },
      note:   String,
      batchId:String,
    }],
    default: [],
  },
}, { timestamps:true });

// Open commitments for a dealer, oldest promise first — the order auto-credit
// from a Saturday upload is applied in.
followupSchema.index({ dealerName:1, followupDate:1 });

export default mongoose.models.OutstandingFollowup || mongoose.model('OutstandingFollowup', followupSchema);