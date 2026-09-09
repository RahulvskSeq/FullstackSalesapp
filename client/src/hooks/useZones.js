import { useState, useEffect } from 'react';
import { api } from '../api';

/**
 * The zones that actually exist on dealer records.
 *
 * The Zone dropdowns used to carry a hardcoded ['ZONE 1','ZONE 2','ZONE 3'],
 * which stopped being true the moment zones 4–7 were used: a dealer already in
 * ZONE 6 opened the editor showing a list that could not represent them, and
 * picking anything silently moved them. Reading the live list means a zone
 * added tomorrow appears on its own.
 */
const NOT_A_ZONE = new Set(['', 'NONE', 'N/A', '#N/A', '-', '(BLANK)']);

// "ZONE 10" must sort after "ZONE 9", which a plain string sort gets wrong.
const natural = (a, b) =>
  String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

export function useZones() {
  const [zones, setZones] = useState([]);
  useEffect(() => {
    let dead = false;
    api.dealerDistinctZones()
      .then(r => {
        if (dead) return;
        const seen = new Map();
        for (const z of (r?.zones || [])) {
          const t = String(z || '').trim();
          if (!t || NOT_A_ZONE.has(t.toUpperCase())) continue;
          const k = t.toUpperCase();
          if (!seen.has(k)) seen.set(k, t);      // keep first spelling seen
        }
        setZones([...seen.values()].sort(natural));
      })
      .catch(() => { if (!dead) setZones([]); });
    return () => { dead = true; };
  }, []);
  return zones;
}
