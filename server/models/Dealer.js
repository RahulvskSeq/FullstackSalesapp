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
}, { _id:false });

const dealerSchema = new mongoose.Schema({
  name:         { type:String, required:true },
  salesman:     { type:String, required:true },
  // Global info (updated each upload, used as fallback)
  city:         { type:String, default:'' },
  state:        { type:String, default:'' },
  zone:         { type:String, default:'' },
  status:       { type:String, default:'ACTIVE' },
  // Full postal address + PIN, used by the Map View / DealerModal for a
  // more precise deep-drill and by external navigation apps.
  address:      { type:String, default:'' },
  pincode:      { type:String, default:'' },
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