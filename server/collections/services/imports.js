import { register } from '../jobs/runner.js';
import { applyImport } from '../engines/reconcile.js';
/** Job handler: apply a staged import in the background. Resumable. */
register('collections.applyImport', async (payload, { progress, by }) => {
  const imp = await applyImport(payload.importId, { by: payload.by || by, progress });
  return { importId: String(imp._id), status: imp.status, stats: imp.stats };
});
export const APPLY_INLINE_MAX_ROWS = 1000;
