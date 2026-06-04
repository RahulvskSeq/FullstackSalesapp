import mongoose from 'mongoose';

// One visit by a salesman to a dealer/party. Multiple per day is fine.
const S = new mongoose.Schema({
  userId:     { type:String, required:true },      // salesman id
  userName:   { type:String, default:'' },         // snapshot
  dealerId:   { type:String, default:'' },         // Mongo _id of dealer, if known
  dealerName: { type:String, required:true },      // free text — can also be a lead's company
  comment:    { type:String, default:'' },         // what was discussed
  // Base64 data URL of the photo captured at the visit
  photo:      { type:String, default:'' },
  // Optional location
  lat:        { type:Number, default:null },
  lng:        { type:Number, default:null },
  // Reverse-geocoded address + city + state
  address:    { type:String, default:'' },
  city:       { type:String, default:'' },
  state:      { type:String, default:'' },
  // ISO date YYYY-MM-DD for fast filtering
  dateStr:    { type:String, default:'' },
}, { timestamps:true });

S.index({ userId:1, dateStr:1 });
S.index({ dealerName:1 });
S.index({ dealerId:1 });

export default mongoose.models.Visit || mongoose.model('Visit', S);
