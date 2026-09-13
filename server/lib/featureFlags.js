/**
 * featureFlags.js — one global on/off switch per feature, set by an admin.
 *
 * Distinct from permissions: `requireFeature()` in middleware/auth.js asks
 * "may THIS user do this?", while this asks "is this part of the app switched
 * on at all?". Turning Attendance off here removes it for everyone, rather
 * than editing every user's permission list.
 *
 * Stored as one Setting document so it survives restarts, and cached for a
 * few seconds so a switch that every request consults doesn't become a
 * per-request database round-trip.
 */
import Setting from '../models/Setting.js';

export const SETTING_KEY = 'disabledFeatures';

// Everything an admin may switch off. Mirrors NAV_PAGES in the client, minus
// the Admin Panel itself — disabling that would hide the only screen where it
// could be switched back on.
export const TOGGLEABLE = [
  { id:'overview',    label:'Overview' },
  { id:'dealers',     label:'All Dealers' },
  { id:'monthly',     label:'Monthly Trend' },
  { id:'compare',     label:'Compare' },
  { id:'map',         label:'Map View' },
  { id:'outstanding', label:'Outstanding' },
  { id:'collections', label:'Collections' },
  { id:'salesCat',    label:'Sales by Category' },
  { id:'upload',      label:'Upload Data' },
  { id:'entry',       label:'Monthly Entry' },
  { id:'months',      label:'Manage Months' },
  { id:'followups',   label:'Follow-ups' },
  { id:'attendance',  label:'Attendance' },
  { id:'visits',      label:'Visits (CRM)' },
  { id:'leads',       label:'Leads (CRM)' },
  { id:'tasks',       label:'Tasks (CRM)' },
  { id:'leaves',      label:'Leaves' },
  { id:'tickets',     label:'Support' },
  { id:'reports',     label:'Reports' },
  { id:'producttx',   label:'Product Transactions' },
  { id:'sheets',      label:'Sheets' },
];
const VALID = new Set(TOGGLEABLE.map(f => f.id));

let cache = null, cachedAt = 0;
const TTL_MS = 10_000;

export async function getDisabled({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cachedAt < TTL_MS) return cache;
  const s = await Setting.findOne({ key: SETTING_KEY }).lean();
  const list = Array.isArray(s?.value) ? s.value.filter(k => VALID.has(k)) : [];
  cache = list; cachedAt = Date.now();
  return list;
}

export async function setDisabled(ids) {
  const clean = [...new Set((Array.isArray(ids) ? ids : []).filter(k => VALID.has(k)))];
  await Setting.findOneAndUpdate(
    { key: SETTING_KEY },
    { $set: { value: clean } },
    { upsert: true, new: true },
  );
  cache = clean; cachedAt = Date.now();
  return clean;
}

/**
 * Route guard. A switched-off feature must fail on the server too — hiding
 * the menu entry alone still leaves the endpoints open to anyone who knows
 * the URL or has an old tab open.
 *
 * Superadmin is deliberately NOT exempt: the point is that the feature is off.
 */
export const featureEnabled = (key) => async (req, res, next) => {
  try {
    const off = await getDisabled();
    if (off.includes(key)) {
      return res.status(403).json({ error: `"${key}" is switched off`, featureDisabled: key });
    }
    next();
  } catch (e) { next(); }   // a settings read failure must not take the app down
};
