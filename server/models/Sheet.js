// Sheet — an online spreadsheet stored entirely in the app (no download needed).
// The whole workbook (all worksheets: cells, formulas, styles, column widths,
// merges, etc.) is serialized to `worksheets` as JSON exactly as jspreadsheet's
// getConfig() returns it, so a saved sheet round-trips perfectly on reload.
import mongoose from 'mongoose';

const sheetSchema = new mongoose.Schema({
  name:       { type: String, default: 'Untitled sheet' },
  // Array of jspreadsheet WorksheetOptions (one per tab). Kept schemaless so any
  // spreadsheet feature the library supports is persisted without model changes.
  worksheets: { type: mongoose.Schema.Types.Mixed, default: [] },
  // Owner = the user id (string id, same convention as the rest of the app).
  owner:      { type: String, index: true },
  ownerName:  { type: String, default: '' },
  // Optional list of user ids this sheet is shared with (read/write).
  sharedWith: { type: [String], default: [] },
}, { timestamps: true, minimize: false });

export default mongoose.models.Sheet || mongoose.model('Sheet', sheetSchema);
