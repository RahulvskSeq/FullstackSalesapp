import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';

/**
 * useGlobalCategoryFilter — single source of truth for "which categories are
 * excluded from totals" across the whole app.
 *
 * Persistence layers (in priority order):
 *   1. Server (User.prefs.excludedCategories) — survives APK reinstall,
 *      incognito, different browser, different device. THIS IS THE SOURCE
 *      OF TRUTH.
 *   2. localStorage — instant boot cache so the UI doesn't flash an empty
 *      selection while the server reply is in flight.
 *
 * Returns:
 *   excluded       : Set<string>   — categories currently OFF
 *   toggle(c)      : flip include/exclude for one category
 *   set(set)       : replace the entire excluded set
 *   clear()        : reset to the saved default (or all-on if none)
 *   saveAsDefault(): persist the current excluded set as the user's default
 *   isOff(c)       : convenience boolean check
 */

const STORAGE_KEY = 'stp_global_cat_excluded';
const DEFAULT_KEY = 'stp_global_cat_excluded_DEFAULT';
const EVENT_NAME  = 'stp:global-cat-filter';

function readLS(key) {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
  catch { return new Set(); }
}
function writeLS(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch {}
}

function readCurrent() { return readLS(STORAGE_KEY); }
function readDefault() { return readLS(DEFAULT_KEY); }

function writeCurrent(set) {
  writeLS(STORAGE_KEY, set);
  try { window.dispatchEvent(new CustomEvent(EVENT_NAME)); } catch {}
}
function writeDefault(set) {
  writeLS(DEFAULT_KEY, set);
}

// Fire-and-forget server sync. We don't await — UI updates are instant and
// the server catches up. If the request fails (offline), localStorage still
// holds the choice and the next successful boot will reconcile.
function pushToServer(patch) {
  try { api.updateMyPrefs(patch).catch(() => {}); } catch {}
}

// One-time-per-page-load fetch from the server, which then overwrites
// localStorage. Components mounted later read the synced value.
let _bootFetched = false;
async function bootSyncFromServer() {
  if (_bootFetched) return;
  _bootFetched = true;
  try {
    const prefs = await api.getMyPrefs();
    if (prefs && Array.isArray(prefs.excludedCategories)) {
      writeCurrent(new Set(prefs.excludedCategories));
    }
    if (prefs && Array.isArray(prefs.defaultExcludedCategories)) {
      writeDefault(new Set(prefs.defaultExcludedCategories));
    }
  } catch {
    // Not logged in yet, or network blip — silently keep using LS values.
  }
}

export function useGlobalCategoryFilter() {
  const [excluded, setExcluded] = useState(() => readCurrent());

  // On first mount of any component using the hook, fetch from server.
  // The `_bootFetched` guard ensures we only hit the API once per page load
  // no matter how many components use the hook.
  useEffect(() => {
    let cancelled = false;
    bootSyncFromServer().then(() => {
      if (!cancelled) setExcluded(readCurrent());
    });
    return () => { cancelled = true; };
  }, []);

  // Cross-component + cross-tab sync via custom event + storage event.
  useEffect(() => {
    const onChange = () => setExcluded(readCurrent());
    window.addEventListener(EVENT_NAME, onChange);
    const onStorage = (e) => { if (e.key === STORAGE_KEY) onChange(); };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const commit = useCallback((nextSet) => {
    const s = nextSet instanceof Set ? nextSet : new Set(nextSet || []);
    writeCurrent(s);
    setExcluded(s);
    pushToServer({ excludedCategories: [...s] });
  }, []);

  const toggle = useCallback((cat) => {
    const next = new Set(readCurrent());
    next.has(cat) ? next.delete(cat) : next.add(cat);
    commit(next);
  }, [commit]);

  const set = useCallback((nextSet) => commit(nextSet), [commit]);

  // Reset the current selection back to whatever the user saved as default.
  const clear = useCallback(() => {
    const dflt = readDefault();
    commit(dflt);
  }, [commit]);

  // Save the CURRENT excluded set as the default so it auto-applies on
  // future loads (or after Clear). Stored both locally AND on the server.
  const saveAsDefault = useCallback(() => {
    writeDefault(excluded);
    pushToServer({ defaultExcludedCategories: [...excluded] });
  }, [excluded]);

  const isOff = useCallback((cat) => excluded.has(cat), [excluded]);

  return { excluded, toggle, set, clear, saveAsDefault, isOff };
}
