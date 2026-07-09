import mongoose from 'mongoose';

// A visit by a salesman to a dealer/party.
// Flow: CHECK-IN (selfie + optional note + GPS) → meeting happens →
//       CHECK-OUT (selfie + REQUIRED discussion notes + GPS).
// Multiple visits per day per salesman are fine.

const S = new mongoose.Schema({
  userId:     { type:String, required:true },     // salesman id
  userName:   { type:String, default:'' },        // snapshot of name
  dealerId:   { type:String, default:'' },        // Mongo _id of dealer if known
  dealerName: { type:String, required:true },     // free text — also fits leads

  // ── Lifecycle ────────────────────────────────────────────────────────
  // 'in-progress' = checked in but not yet checked out
  // 'completed'   = both events recorded
  status:     { type:String, enum:['in-progress','completed'], default:'in-progress' },

  // ── Check-in (start of visit) ───────────────────────────────────────
  checkInTime:   { type:Date,   default:Date.now },
  checkInPhoto:  { type:String, default:'' },     // base64 data URL
  checkInNote:   { type:String, default:'' },     // optional
  checkInLat:    { type:Number, default:null },
  checkInLng:    { type:Number, default:null },
  checkInAddress:{ type:String, default:'' },
  checkInCity:   { type:String, default:'' },
  checkInState:  { type:String, default:'' },

  // ── Check-out (end of visit) — set when salesman closes the visit ───
  checkOutTime:    { type:Date,   default:null },
  checkOutPhoto:   { type:String, default:'' },
  // REQUIRED at check-out: what was discussed in the meeting
  checkOutNote:    { type:String, default:'' },
  checkOutLat:     { type:Number, default:null },
  checkOutLng:     { type:Number, default:null },
  checkOutAddress: { type:String, default:'' },
  checkOutCity:    { type:String, default:'' },
  checkOutState:   { type:String, default:'' },

  // Cached: durationMinutes once completed. Computed server-side at checkout.
  durationMinutes: { type:Number, default:0 },

  // True when the visit was closed automatically (forgot to check out, then
  // checked in again later) or force-closed by a superadmin — rather than
  // through a normal check-out with discussion notes.
  autoClosed: { type:Boolean, default:false },

  // ── Legacy single-shot fields (kept so old documents still render) ──
  comment:    { type:String, default:'' },        // legacy: pre-checkout combined comment
  photo:      { type:String, default:'' },        // legacy
  lat:        { type:Number, default:null },
  lng:        { type:Number, default:null },
  address:    { type:String, default:'' },
  city:       { type:String, default:'' },
  state:      { type:String, default:'' },

  // ISO date YYYY-MM-DD for fast same-day querying
  dateStr:    { type:String, default:'' },
}, { timestamps:true });

S.index({ userId:1, dateStr:1 });
S.index({ userId:1, status:1 });
S.index({ dealerName:1 });
S.index({ dealerId:1 });

export default mongoose.models.Visit || mongoose.model('Visit', S);
