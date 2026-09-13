import Setting from '../../models/Setting.js';
/**
 * Every business number the module uses lives here, editable from the
 * Settings screen, with sane defaults. Nothing below is referenced as a
 * literal anywhere else in the module.
 */
export const DEFAULTS = {
  'collections.balanceModeDefault': 'buckets',
  'collections.workingDays': [1, 2, 3, 4, 5, 6],            // Mon–Sat; Sunday closed
  'collections.agingBuckets': [30, 60, 90, 180],             // day boundaries
  'collections.overdueDays': 90,
  'collections.highValue': 500000,
  'collections.priorityThresholds': { critical: { total: 1000000, ageDays: 120 }, high: { total: 300000, ageDays: 90 }, medium: { total: 50000, ageDays: 30 } },
  'collections.taskPoints': { CALL: 1, FOLLOW_UP: 2, VISIT: 3, WHATSAPP: 1, SEND_STATEMENT: 1, SEND_INVOICE: 1, VERIFICATION: 2,
    ESCALATION: 2, PROMISE_FOLLOW_UP: 2, PAYMENT_COLLECTION: 5, HIGH_VALUE_COLLECTION: 10, CUSTOM: 1, highValueThreshold: 100000 },
  'collections.reviewWeights': { followupDiscipline: 15, taskCompletion: 15, onTimeUpdates: 5, dealerVisits: 10, promiseFollowUp: 10,
    dataAccuracy: 5, customerManagement: 10, communicationQuality: 5, systemUsage: 5, taskPoints: 5, collectionActivity: 10, managerReview: 5 },
  'collections.automationRules': [
    { id: 'stale-high-balance', name: 'High balance with no follow-up', enabled: true, trigger: 'tick',
      conditions: { minTotal: 300000, noFollowupDays: 7 }, action: 'createTask', params: { type: 'FOLLOW_UP', priority: 'HIGH' } },
    { id: 'promise-due-today', name: 'Promise due today', enabled: true, trigger: 'tick',
      conditions: {}, action: 'createTask', params: { type: 'PROMISE_FOLLOW_UP', priority: 'MEDIUM' } },
    { id: 'promise-broken', name: 'Promise broken', enabled: true, trigger: 'tick',
      conditions: {}, action: 'breakPromise', params: { type: 'PROMISE_FOLLOW_UP', priority: 'HIGH' } },
    { id: 'cleared-close-tasks', name: 'Cleared: close collection tasks', enabled: true, trigger: 'event:CLEARED',
      conditions: {}, action: 'cancelOpenTasks', params: {} },
    { id: 'reopened-call', name: 'New outstanding after clearance', enabled: true, trigger: 'event:REOPENED',
      conditions: {}, action: 'createTask', params: { type: 'CALL', priority: 'MEDIUM' } },
    { id: 'long-overdue-escalate', name: 'Long overdue: escalate', enabled: true, trigger: 'tick',
      conditions: { minAgeDays: 120, noPaymentDays: 30 }, action: 'createTask', params: { type: 'ESCALATION', priority: 'URGENT', assignTo: 'approver' } },
    { id: 'promise-reminder-tomorrow', name: 'WhatsApp reminder the day before a promise', enabled: false, trigger: 'tick',
      conditions: {}, action: 'sendWhatsApp', params: { templateKey: 'promise_reminder' } },
  ],
  'collections.whatsappRatePerMinute': 20,
  'collections.companyName': 'Sequence Surfaces',
  'collections.visitTargetPerMonth': 20,
  'collections.followupEditWindowMinutes': 15,
};

const cache = new Map();
const TTL = 30_000;
export async function getSetting(key) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const row = await Setting.findOne({ key }).lean();
  const def = DEFAULTS[key];
  let value = row?.value;
  if (value === undefined || value === null) value = def;
  else if (def && typeof def === 'object' && !Array.isArray(def)) value = { ...def, ...value };
  cache.set(key, { at: Date.now(), value });
  return value;
}
export async function setSetting(key, value) {
  if (!(key in DEFAULTS)) throw new Error('Unknown setting: ' + key);
  await Setting.findOneAndUpdate({ key }, { $set: { key, value } }, { upsert: true });
  cache.delete(key);
  return getSetting(key);
}
export async function allSettings() {
  const out = {};
  for (const k of Object.keys(DEFAULTS)) out[k] = await getSetting(k);
  return out;
}
export function clearSettingsCache() { cache.clear(); }
