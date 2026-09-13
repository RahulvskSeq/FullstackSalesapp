import mongoose from 'mongoose';
import { opts } from './_common.js';
/** Per employee per day. Derived; can always be rebuilt from the event tables. */
const S = new mongoose.Schema({
  employeeId:     { type: String, required: true },
  date:           { type: String, required: true },
  followups:      { type: Number, default: 0 },
  calls:          { type: Number, default: 0 },
  visits:         { type: Number, default: 0 },
  whatsapps:      { type: Number, default: 0 },
  tasksDone:      { type: Number, default: 0 },
  tasksOverdue:   { type: Number, default: 0 },
  promisesTaken:  { type: Number, default: 0 },
  promisesKept:   { type: Number, default: 0 },
  promisesBroken: { type: Number, default: 0 },
  collected:      { type: Number, default: 0 },
  points:         { type: Number, default: 0 },
}, opts('col_employee_activity'));
S.index({ employeeId: 1, date: 1 }, { unique: true });
export default mongoose.models.ColEmployeeActivity || mongoose.model('ColEmployeeActivity', S);
