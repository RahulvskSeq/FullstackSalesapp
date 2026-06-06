import mongoose from 'mongoose';

const updateSchema = new mongoose.Schema({
  by:       { type:String, default:'' },
  byName:   { type:String, default:'' },
  comment:  { type:String, default:'' },
  status:   { type:String, default:'' },
  at:       { type:Date,   default: Date.now },
}, { _id:true });

// A task is something an admin / superadmin assigns to a salesman.
// Salesmen can change status + add comments; cannot delete or reassign.
const S = new mongoose.Schema({
  title:        { type:String, required:true },
  description:  { type:String, default:'' },
  // Pipeline. NEW → IN_PROGRESS → COMPLETED. Or CANCELLED.
  status:       { type:String, default:'NEW' },
  priority:     { type:String, default:'MEDIUM' }, // LOW | MEDIUM | HIGH | URGENT
  dueDate:      { type:String, default:'' },       // YYYY-MM-DD
  assignedTo:   { type:String, default:'' },       // user id of salesman
  assignedName: { type:String, default:'' },
  createdBy:     { type:String, default:'' },
  createdByName: { type:String, default:'' },
  // Optional linked dealer / lead reference for context
  refType:      { type:String, default:'' },       // 'dealer' | 'lead' | ''
  refId:        { type:String, default:'' },
  refName:      { type:String, default:'' },
  updates:      [updateSchema],
}, { timestamps:true });

S.index({ assignedTo:1, status:1 });
S.index({ createdBy:1 });

export default mongoose.models.Task || mongoose.model('Task', S);
