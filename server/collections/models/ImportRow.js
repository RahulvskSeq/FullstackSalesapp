import mongoose from 'mongoose';
import { opts } from './_common.js';
/** Staged, validated rows. Amounts kept so an unmapped party can be mapped later without re-upload. */
const S = new mongoose.Schema({
  importId:        { type: mongoose.Schema.Types.ObjectId, ref: 'ColImport', required: true },
  rowNo:           { type: Number, required: true },
  rawParty:        { type: String, default: '' },
  partyName:       { type: String, default: '' },     // name with the code removed
  code:            { type: String, default: '' },     // SSL14140
  matchedDealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dealer', default: null },
  matchMethod:     { type: String, enum: ['code', 'guid', 'name', 'alias', 'manual', 'none'], default: 'none' },
  buckets:         { type: Map, of: Number, default: {} },   // YYYY-MM → rupees
  total:           { type: Number, default: 0 },
  status:          { type: String, enum: ['OK', 'UNMAPPED', 'ERROR', 'DUPLICATE'], default: 'OK' },
  error:           { type: String, default: '' },
  appliedAt:       { type: Date, default: null },
}, opts('col_import_rows'));
S.index({ importId: 1, rowNo: 1 }, { unique: true });
S.index({ importId: 1, status: 1 });
S.index({ importId: 1, matchedDealerId: 1 });
export default mongoose.models.ColImportRow || mongoose.model('ColImportRow', S);
