// App-wide feature switches.

// Google Sheets sync — hidden from the UI.
//
// The sync upserted dealers keyed on {name, salesman}. When a dealer's rep
// changed in the sheet that query matched nothing, so the upsert INSERTED a
// second dealer record instead of reassigning the existing one: history stayed
// under the old rep, a duplicate appeared under the new one, and both were
// counted. A single run produced 88 duplicates across 87 dealer names and
// inflated org-wide totals by ~12,900 units.
//
// The server-side bug is fixed (see routes/dealers.js — the upsert now matches
// on name alone and preserves per-month salesman stamps), so this is a policy
// switch rather than a workaround: the button stays hidden until the sheet is
// trusted as a source of truth again. The POST /dealers/sync-db route is
// untouched and still works if called directly.
export const SHEET_SYNC_ENABLED = false;
