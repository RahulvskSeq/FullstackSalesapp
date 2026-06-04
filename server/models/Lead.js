import mongoose from 'mongoose';

// Inline schema for follow-up entries inside a lead. Avoids a separate
// collection for simplicity.
const updateSchema = new mongoose.Schema({
  by:       { type:String, default:'' },   // userId who wrote it
  byName:   { type:String, default:'' },   // snapshot
  comment:  { type:String, default:'' },
  status:   { type:String, default:'' },   // optional status change at this update
  at:       { type:Date,   default: Date.now },
}, { _id:true });

const S = new mongoose.Schema({
  // Basic lead info
  name:        { type:String, required:true },     // person / decision-maker
  company:     { type:String, default:'' },
  phone:       { type:String, default:'' },
  email:       { type:String, default:'' },
  city:        { type:String, default:'' },
  state:       { type:String, default:'' },
  source:      { type:String, default:'' },        // referral, walk-in, website, ad...
  // Sales pipeline
  status:      { type:String, default:'NEW' },
                 // common values: NEW, CONTACTED, QUALIFIED, NEGOTIATION, WON, LOST
  // Assignment
  assignedTo:    { type:String, default:'' },      // salesman userId
  assignedName:  { type:String, default:'' },
  createdBy:     { type:String, default:'' },      // admin who created it
  createdByName: { type:String, default:'' },
  // Notes from the admin when creating
  notes:        { type:String, default:'' },
  // Estimated value (rupees), optional
  value:        { type:Number, default:0 },
  // History of updates the salesman / admin add over time
  updates:      [updateSchema],
}, { timestamps:true });

S.index({ assignedTo:1, status:1 });
S.index({ createdBy:1 });

export default mongoose.models.Lead || mongoose.model('Lead', S);
