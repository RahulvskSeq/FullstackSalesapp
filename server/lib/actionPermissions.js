/**
 * actionPermissions.js — the catalogue of things a user may be allowed to DO.
 *
 * Three different questions are easy to confuse, so to be explicit:
 *
 *   featureFlags.js   is this part of the app switched on at all?  (global)
 *   permissions.pages which screens does this user see?            (per user)
 *   this file         which ACTIONS may this user perform?         (per user)
 *
 * Enforced by requireFeature() in middleware/auth.js. The rule there:
 *   - superadmin always passes;
 *   - a user with an EMPTY list falls back to role defaults (admin = all,
 *     everyone else = denied);
 *   - a user with a non-empty list is granted exactly what it contains.
 *
 * So ticking one box for an admin narrows them to that one action. The UI
 * says so, and offers Select all.
 */
// Deliberately NOT listed: adding/editing dealers, and approving leaves.
// Those endpoints are shared with salesmen (a rep creates their own dealers
// and cancels their own leave through the same route), and requireFeature
// denies anyone whose list is non-empty but lacks the key — so offering them
// here would take away access people rely on today. They need the handler
// split by intent first.
export const ACTION_PERMISSIONS = [
  { key:'monthlyEntry',      group:'Data entry',  label:'Monthly Entry',        desc:'Save monthly figures and upload the filled sheet' },
  { key:'uploadData',        group:'Data entry',  label:'Upload data',          desc:'Product transactions, dealer sheets, sales uploads' },
  { key:'manageOutstanding', group:'Data entry',  label:'Outstanding',          desc:'Upload and revert outstanding batches' },
  // Collections module (Outstanding + Collection CRM). Role defaults: admin and
  // superadmin hold all of these; employee needs them granted; salesman none.
  { key:'collections.import',   group:'Collections', label:'Import statements',    desc:'Upload, preview and apply outstanding statements' },
  { key:'collections.payments', group:'Collections', label:'Confirm payments',     desc:'Record and confirm money received (accounts)' },
  { key:'collections.settings', group:'Collections', label:'Collection settings',  desc:'Task points, review weights, automation rules, templates' },
  { key:'collections.whatsapp', group:'Collections', label:'WhatsApp reminders',   desc:'Send templated WhatsApp reminders to dealers' },
  { key:'collections.reviews',  group:'Collections', label:'Employee reviews',     desc:'Generate and finalise employee review scores' },

  { key:'deleteDealers',     group:'Dealers',     label:'Delete dealers',       desc:'Remove dealer records' },

  { key:'manageCategories',  group:'Setup',       label:'Manage categories',    desc:'Add, edit and delete categories and sub-categories' },
  { key:'manageMonths',      group:'Setup',       label:'Manage months',        desc:'Change which months the app shows' },
  { key:'manageSamples',     group:'Setup',       label:'Manage samples',       desc:'Sample master and sample distribution' },
  { key:'manageFeatures',    group:'Setup',       label:'Feature switches',     desc:'Turn parts of the app on and off for everyone' },

  { key:'manageLeads',       group:'CRM',         label:'Manage leads',         desc:'Create, import and delete leads' },
  { key:'manageVisits',      group:'CRM',         label:'Manage visits',        desc:'Delete or force-close other people’s visits' },

  { key:'manageUsers',       group:'Administration', label:'Manage users',      desc:'Create users, set permissions, reassign work' },
  { key:'wipeData',          group:'Administration', label:'Delete in bulk',    desc:'Remove upload batches and wipe data. Destructive.' },
];

export const ACTION_KEYS = new Set(ACTION_PERMISSIONS.map(a => a.key));

/** Group the catalogue for rendering, preserving the order above. */
export function groupedActions() {
  const out = [];
  for (const a of ACTION_PERMISSIONS) {
    let g = out.find(x => x.group === a.group);
    if (!g) { g = { group: a.group, items: [] }; out.push(g); }
    g.items.push(a);
  }
  return out;
}
