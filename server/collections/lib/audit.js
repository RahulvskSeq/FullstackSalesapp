import ColAudit from '../models/Audit.js';
import AuditLog from '../../models/AuditLog.js';
/**
 * One call, two records: the module's structured audit (entity, before,
 * after) and a compact line in the application's existing AuditLog so the
 * Settings → Activity screen keeps seeing everything in one place.
 * Never throws — an audit failure must not fail the action it describes.
 */
export async function writeAudit({ entity, entityId = '', action, before = null, after = null, req = null, by = '', byName = '', source = 'ui', importId = null, ip = '' }) {
  const who = by || req?.user?.id || '';
  const whoName = byName || req?.user?.name || who;
  const addr = ip || req?.ip || '';
  try {
    await ColAudit.create({ entity, entityId: String(entityId || ''), action, before, after, by: who, byName: whoName, source, importId, ip: addr });
  } catch (e) { console.warn('[COL AUDIT]', e.message); }
  try {
    await AuditLog.create({ by: who, byName: whoName, action: `collections.${entity}.${action}`,
      detail: { entityId: String(entityId || ''), source, importId: importId ? String(importId) : undefined, summary: summarise(before, after) } });
  } catch (e) { /* mirror is best-effort */ }
}
function summarise(before, after) {
  if (!before && !after) return undefined;
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
  const out = {};
  for (const k of keys) {
    const b = before?.[k], a = after?.[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) out[k] = { from: b, to: a };
  }
  return out;
}
