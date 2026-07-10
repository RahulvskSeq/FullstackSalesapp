import mongoose from 'mongoose';
const S = new mongoose.Schema({
  id:              { type:String, required:true, unique:true },
  name:            { type:String, required:true },
  pass:            { type:String, required:true },
  // Roles (ascending privilege):
  //   salesman   — sees only their own dealers, follow-ups, monthly entries
  //   employee   — admin-level VISIBILITY (sees all data) but cannot manage users,
  //                delete, sync or upload; sections granted per-user via permissions.features
  //   admin      — sees all data, can manage salesmen, cannot manage admins/superadmins, cannot impersonate
  //   superadmin — full access including managing all users and impersonating any user
  role:            { type:String, enum:['salesman','employee','admin','superadmin'], default:'salesman' },
  color:           { type:String, default:'#818cf8' },
  ini:             { type:String, default:'??' },
  url:             { type:String, default:null },
  url2:            { type:String, default:null },
  url_outstanding: { type:String, default:null },
  // CRM: id of the user (manager / admin) who reviews this salesman's leaves
  // and visits. Empty = any admin/superadmin can approve.
  approver:        { type:String, default:'' },
  // Soft-disable. When false, the user can't log in and is hidden from
  // search / dropdowns, but their historic records (visits, leads, sales
  // entries, dealers) remain intact in the DB.
  active:          { type:Boolean, default:true },
  // Per-user UI preferences. Stored on the server so the user's choices
  // survive APK reinstall, incognito, different browser, different device.
  // `excludedCategories` is the live filter selection; `defaultExcludedCategories`
  // is the "save as default" snapshot that gets re-applied on a Reset click.
  prefs: {
    excludedCategories:        { type:[String], default: [] },
    defaultExcludedCategories: { type:[String], default: [] },
  },
  // Data-access scope. When any of these arrays is non-empty, the user's
  // reads (dealers, outstanding, sales, etc.) are restricted to dealers
  // whose state / zone / salesman matches. Superadmin ignores these and
  // sees everything. Salesmen still see only their own dealers (their
  // existing scope rule wins). Useful for a "regional manager" who should
  // only see Karnataka + Tamil Nadu data without being a salesman.
  permissions: {
    states:    { type:[String], default: [] },   // empty = no state restriction
    cities:    { type:[String], default: [] },   // empty = no city restriction (finer-grained than state)
    zones:     { type:[String], default: [] },   // empty = no zone restriction
    salesmen:  { type:[String], default: [] },   // empty = all salesmen
    // App-section access. Empty array uses role-based defaults
    // (admin = all features; salesman = read-only data views).
    // When non-empty, ONLY these feature keys are granted.
    // Recognised keys:
    //   'monthlyEntry'  → Monthly Entry sidebar item + write routes
    //   'manageMonths'  → Manage Months tools (dedupe, normalize, etc.)
    //   'uploadData'    → Outstanding Excel upload + dealer/sales uploads
    //   'manageCategories' → Admin Panel categories CRUD
    //   'wipeData'      → Wipe all data (superadmin only by default)
    features:  { type:[String], default: [] },
  },
}, { timestamps:true });
export default mongoose.models.User || mongoose.model('User', S);
