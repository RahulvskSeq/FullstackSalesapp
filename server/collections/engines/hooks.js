/**
 * A small in-process event bus so the automation engine can react to what
 * the reconciliation and payment engines do without either importing the
 * other. Listeners never throw into the emitter; failures are logged.
 */
const listeners = new Map();
export function on(event, fn) { if (!listeners.has(event)) listeners.set(event, []); listeners.get(event).push(fn); }
export async function emit(event, payload) {
  for (const fn of listeners.get(event) || []) {
    try { await fn(payload); } catch (e) { console.warn('[COL HOOK]', event, e.message); }
  }
}
