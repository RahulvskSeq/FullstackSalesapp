// import mongoose from 'mongoose';
// const S = new mongoose.Schema({
//   name:         { type:String, required:true },
//   salesman:     { type:String, required:true },
//   city:         { type:String, default:'' },
//   state:        { type:String, default:'' },
//   zone:         { type:String, default:'' },
//   status:       { type:String, default:'ACTIVE' },
//   category:     { type:String, default:'' },
//   categoryType: { type:String, default:'' },
//   target:       { type:Number, default:0 },
//   creditDays:   { type:Number, default:0 },
//   creditLimit:  { type:Number, default:0 },
//   avg6m:        { type:Number, default:0 },
//   // monthlyData: { 'Jul-25': { achieved:320, target:500 }, 'Aug-25': {...} }
//   monthlyData:  { type:Map, of:new mongoose.Schema({ achieved:{type:Number,default:0}, target:{type:Number,default:0} },{ _id:false }), default:{} },
//   source:       { type:String, default:'sheet' },
// }, { timestamps:true });
// S.index({ name:1, salesman:1 }, { unique:true });
// export default mongoose.models.Dealer || mongoose.model('Dealer', S);

// import mongoose from 'mongoose';
// const S = new mongoose.Schema({
//   name:         { type:String, required:true },
//   salesman:     { type:String, required:true },
//   city:         { type:String, default:'' },
//   state:        { type:String, default:'' },
//   zone:         { type:String, default:'' },
//   status:       { type:String, default:'ACTIVE' },
//   category:     { type:String, default:'' },
//   categoryType: { type:String, default:'' },
//   target:       { type:Number, default:0 },
//   creditDays:   { type:Number, default:0 },
//   creditLimit:  { type:Number, default:0 },
//   avg6m:        { type:Number, default:0 },
//   // monthlyData: { 'Jul-25': { achieved:320, target:500 }, 'Aug-25': {...} }
//   monthlyData:  { type:Map, of:new mongoose.Schema({ achieved:{type:Number,default:0}, target:{type:Number,default:0} },{ _id:false }), default:{} },
//   source:       { type:String, default:'sheet' },
// }, { timestamps:true });
// S.index({ name:1, salesman:1 }, { unique:true });
// export default mongoose.models.Dealer || mongoose.model('Dealer', S);


import mongoose from 'mongoose';

// Each month stored as: { 'Jun-26': { achieved:320, target:500, status:'STAR', zone:'ZONE 1', city:'Hyd', state:'TG' } }
// Months are COMPLETELY INDEPENDENT - changing Jun does NOT affect May or Jul
const monthEntrySchema = new mongoose.Schema({
  achieved:    { type:Number, default:0 },
  target:      { type:Number, default:0 },
  status:      { type:String, default:'' },
  zone:        { type:String, default:'' },
  category:    { type:String, default:'' },
  categoryType:{ type:String, default:'' },
  city:        { type:String, default:'' },
  state:       { type:String, default:'' },
  creditDays:  { type:Number, default:0 },
  creditLimit: { type:Number, default:0 },
  // Who owned this dealer for THIS month. Stamped with the OLD salesman when
  // the dealer is reassigned, so history stays attributed to whoever actually
  // made those sales. Empty = fall back to dealer.salesman (current owner).
  salesman:    { type:String, default:'' },
}, { _id:false });

const dealerSchema = new mongoose.Schema({
  name:         { type:String, required:true },
  salesman:     { type:String, required:true },

  // When the dealer changed hands. Each entry records the date a salesman
  // TOOK OVER, so a sale can be attributed to whoever owned the dealer on
  // the day it was invoiced — rather than to the current owner, which would
  // silently rewrite history, or to one owner per month, which cannot split
  // a mid-month handover.
  //
  // Empty means "never reassigned": `salesman` applies to every date. On the
  // first reassignment the outgoing owner is seeded with from:'0000-00-00'
  // so every earlier date still resolves.
  salesmanHistory: [{
    _id: false,
    salesman: { type:String, default:'' },
    from:     { type:String, default:'' },   // 'YYYY-MM-DD', inclusive
  }],

  // Global info (updated each upload, used as fallback)
  city:         { type:String, default:'' },
  state:        { type:String, default:'' },
  zone:         { type:String, default:'' },
  status:       { type:String, default:'ACTIVE' },
  // Type 1 — auto-calculated performance tier (see lib/accountStatus.js).
  // Never typed by a human; recomputed from Sale rows after every upload.
  perfStatus:   { type:String, default:'' },
  // Qty in the tier categories for the month perfStatus came from — kept so
  // the UI can explain WHY a dealer landed in a tier.
  perfQty:      { type:Number, default:0 },
  perfMonth:    { type:String, default:'' },
  // Commercial classification, editable by the salesperson.
  // One of: 'None' | 'Regular Dealer' | 'Premium Dealer' | 'OEM/SEMI OEM' | 'ENTERPRISE'
  dealerType:   { type:String, default:'None' },
  // Full postal address + PIN, used by the Map View / DealerModal for a
  // more precise deep-drill and by external navigation apps.
  address:      { type:String, default:'' },
  pincode:      { type:String, default:'' },
  // Tally ledger GUID, bound on the first successful name match during a
  // Tally sync. Once set, the link survives a ledger rename in Tally.
  tallyGuid:    { type:String, default:'', index:true },
  category:     { type:String, default:'' },
  categoryType: { type:String, default:'' },
  target:       { type:Number, default:0 },
  creditDays:   { type:Number, default:0 },
  creditLimit:  { type:Number, default:0 },
  avg6m:        { type:Number, default:0 },
  // Per-month data — fully independent per month
  monthlyData:  { type:Map, of:monthEntrySchema, default:{} },
  source:       { type:String, default:'sheet' },
  // Auto-learned GPS (set on first CRM visit check-in with valid lat/lng).
  // Used by Visits page to suggest nearby dealers.
  locLat:       { type:Number, default:null },
  locLng:       { type:Number, default:null },
  locUpdatedAt: { type:Date,   default:null },
  locAccuracy:  { type:Number, default:null },
}, { timestamps:true });

dealerSchema.index({ name:1, salesman:1 }, { unique:true });
export default mongoose.models.Dealer || mongoose.model('Dealer', dealerSchema);