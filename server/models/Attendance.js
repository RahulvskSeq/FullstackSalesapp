import mongoose from 'mongoose';

// One document per check-in OR check-out. The pair is matched on the client
// by user + date.
const S = new mongoose.Schema({
  userId:    { type:String, required:true },      // salesman id ('pranav', 'joseph', etc.)
  userName:  { type:String, default:'' },         // snapshot at the time
  type:      { type:String, enum:['in','out'], required:true },
  // Base64 data URL of the captured photo (selfie or office photo)
  photo:     { type:String, default:'' },
  // Optional GPS coords if the browser permitted it
  lat:       { type:Number, default:null },
  lng:       { type:Number, default:null },
  // Reverse-geocoded address + city + state for human-readable display
  address:   { type:String, default:'' },
  city:      { type:String, default:'' },
  state:     { type:String, default:'' },
  // ISO date string YYYY-MM-DD for fast same-day querying
  dateStr:   { type:String, default:'' },
  // Free-text note
  note:      { type:String, default:'' },
}, { timestamps:true });

S.index({ userId:1, dateStr:1 });

export default mongoose.models.Attendance || mongoose.model('Attendance', S);
