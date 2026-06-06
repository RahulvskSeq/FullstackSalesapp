import mongoose from 'mongoose';

const updateSchema = new mongoose.Schema({
  by:       { type:String, default:'' },
  byName:   { type:String, default:'' },
  comment:  { type:String, default:'' },
  status:   { type:String, default:'' },
  // attach a screenshot to the update (optional)
  screenshot: { type:String, default:'' },
  at:       { type:Date,   default: Date.now },
}, { _id:true });

// Support / complaint ticket — JIRA-style.
// Anyone with an account can raise a ticket. Only admin/superadmin can
// resolve / close / reassign. The raiser sees own tickets + their status.
const S = new mongoose.Schema({
  // Pretty number shown in the UI, e.g. STP-0001
  ticketNo:    { type:String, required:true, unique:true },
  title:       { type:String, required:true },
  description: { type:String, default:'' },
  // base64 data URL — the screenshot the user pasted/uploaded
  screenshot:  { type:String, default:'' },
  // Bug | Feature | Question | Other
  category:    { type:String, default:'Bug' },
  // OPEN → IN_PROGRESS → RESOLVED → CLOSED. Or REOPENED.
  status:      { type:String, default:'OPEN' },
  // LOW | MEDIUM | HIGH | URGENT
  priority:    { type:String, default:'MEDIUM' },
  // Who raised it
  createdBy:     { type:String, default:'' },
  createdByName: { type:String, default:'' },
  // Optional dev / admin assigned to fix it
  assignedTo:    { type:String, default:'' },
  assignedName:  { type:String, default:'' },
  // History of changes (status / comments / screenshots)
  updates:       [updateSchema],
}, { timestamps:true });

S.index({ createdBy:1, status:1 });
S.index({ status:1 });

export default mongoose.models.Ticket || mongoose.model('Ticket', S);
