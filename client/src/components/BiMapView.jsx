// Map View — a BI-style territory map: India → state → district → taluka.
// Regions are drawn flat (no street map), shaded green by sales, silver where
// there were none and pink where the trend fell. The view flies smoothly into
// whatever you click. Customers / Selected / Average sit on top; on the right,
// two Territory boxes you can drag regions into, the legend, and Compare.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Map as MapIcon, Globe, ChevronRight, X, Search, GitCompare, TrendingUp, Maximize2, List, Plus, Trash2, Columns3, Download, Loader2 } from 'lucide-react';
import { MO as MO_CONST } from '../constants';
import { monthTarget, pct, spct, pclr } from '../utils';
import { useMonth } from '../context';
import { PageHead } from '../collections/ui';
import {
  loadLeaflet, loadStates, loadDistricts, loadTalukas, assignDealers, makeColour, ensureDefs, labelPoint, boundsOf,
  fmtIN, signedIN, POS, NEG, PERIODS, periodRange, sumMonths, tierOf,
} from '../lib/biMap';

const MapCompare = React.lazy(() => import('./MapCompare'));

const STATUS = [['billed', 'Billed'], ['unbilled', 'Unbilled'], ['inactive', 'Inactive'], ['lost', 'Lost']];
const LIST_COLS = [
  ['city', 'City'], ['state', 'State'], ['salesman', 'Salesman'], ['zone', 'Zone'], ['tier', 'Tier'], ['status', 'Status'],
  ['last', 'Last billed'], ['qty', 'Qty'], ['target', 'Target'], ['ach', 'Ach %'], ['prev', 'vs prev'],
];
const LIST_DEFAULT = ['city', 'salesman', 'last', 'qty', 'target', 'prev'];
const readLS = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };

export default function BiMapView({ dealers: allDealers = [], users = {}, onOpenDealer }){
  const { selectedMonthIdx, MO: ctxMO } = useMonth();
  const MO = ctxMO || MO_CONST;

  // ── filters ──
  const [periodKey, setPeriodKey] = useState('month');
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo] = useState(null);
  const [sm, setSm] = useState('');
  const [status, setStatus] = useState('');            // '' | billed | unbilled | inactive | lost
  const [metric, setMetric] = useState('qty');         // qty | customers | ach
  const [trend, setTrend] = useState(false);
  const [show, setShowRaw] = useState(() => readLS('bi_map_labels', { name: false, number: true, count: false }));
  const setShow = k => setShowRaw(s => { const n = { ...s, [k]: !s[k] }; writeLS('bi_map_labels', n); return n; });
  const [path, setPath] = useState([]);                // [] India · [state] · [state, district]
  const [geo, setGeo] = useState({ states: null, districts: {}, talukas: {} });
  const [geoErr, setGeoErr] = useState('');
  const [list, setList] = useState(null);              // { title, dealers }
  const [terr, setTerr] = useState({ A: [], B: [] });  // regions collected into the two Territory boxes
  const [armed, setArmed] = useState(null);            // 'A' | 'B' while tapping regions in (phones)
  const [over, setOver] = useState(null);              // the Territory box a drag is over
  const [compareOpen, setCompareOpen] = useState(false);

  const period = useMemo(() => periodRange(periodKey, selectedMonthIdx, MO, customFrom, customTo), [periodKey, selectedMonthIdx, MO, customFrom, customTo]);
  const trendOn = trend && period.prevFull;
  const level = path.length === 0 ? 'india' : path.length === 1 ? 'state' : 'district';

  // ── dealers in play (salesman filter by month ownership) ──
  const base = useMemo(() => {
    if(!sm) return allDealers;
    const own = [...period.idx, ...period.prev];
    return allDealers.filter(d => d.salesman === sm || own.some(i => d.monthSalesman?.[i] === sm));
  }, [allDealers, sm, period]);
  // every dealer's figures for the period, worked out once
  const stats = useMemo(() => {
    const m = new Map();
    for(const d of base){
      const qty = sumMonths(d, period.idx, sm), prev = sumMonths(d, period.prev, sm);
      const tgt = period.idx.reduce((t, i) => (sm && (d.monthSalesman?.[i] || d.salesman) !== sm) ? t : t + (Number(monthTarget(d, i)) || 0), 0);
      const t = tierOf(d);
      let last = '';
      for(let i = period.idx[period.idx.length - 1]; i >= 0; i--) if((Number(d.months?.[i]) || 0) > 0){ last = MO[i]; break; }
      m.set(d, { qty, prev, tgt, last, st: qty > 0 ? 'billed' : t === 'inactive' ? 'inactive' : t === 'lost' ? 'lost' : 'unbilled' });
    }
    return m;
  }, [base, period, sm, MO]);
  const S = d => stats.get(d) || { qty: 0, prev: 0, tgt: 0, last: '', st: 'unbilled' };
  const keep = d => !status || S(d).st === status;

  // ── boundaries ──
  useEffect(() => { loadStates().then(g => setGeo(x => ({ ...x, states: g }))).catch(e => setGeoErr(e.message)); }, []);
  useEffect(() => {
    const st = path[0]; if(!st) return;
    if(!geo.districts[st]) loadDistricts(st).then(g => setGeo(x => ({ ...x, districts: { ...x.districts, [st]: g } }))).catch(() => setGeo(x => ({ ...x, districts: { ...x.districts, [st]: { features: [] } } })));
    if(path[1] && !geo.talukas[st]) loadTalukas(st).then(g => setGeo(x => ({ ...x, talukas: { ...x.talukas, [st]: g } }))).catch(() => setGeo(x => ({ ...x, talukas: { ...x.talukas, [st]: { features: [] } } })));
  }, [path, geo.districts, geo.talukas]);

  const features = useMemo(() => {
    if(level === 'india') return geo.states?.features || null;
    const dg = geo.districts[path[0]]; if(!dg) return null;
    if(level === 'state') return dg.features;
    const tg = geo.talukas[path[0]]; if(!tg) return null;
    const t = tg.features.filter(f => f.properties.d === path[1]);
    return t.length ? t : dg.features.filter(f => f.properties.name === path[1]);   // no talukas → the district itself
  }, [level, geo, path]);

  const assigned = useMemo(() => assignDealers({
    dealers: base, level, state: path[0], district: path[1],
    statesGeo: geo.states, districtsGeo: geo.districts[path[0]], talukasGeo: geo.talukas[path[0]],
  }), [base, level, path, geo]);

  // ── per-region figures ──
  const regions = useMemo(() => {
    const out = new Map();
    for(const f of features || []){
      const name = f.properties.name;
      const all = assigned.by.get(name) || (level === 'district' && features.length === 1 ? assigned.scope : []);
      const shown = all.filter(keep);
      let qty = 0, prev = 0, tgt = 0, billed = 0;
      for(const d of shown){ const s = S(d); qty += s.qty; prev += s.prev; tgt += s.tgt; if(s.qty > 0) billed++; }
      out.set(name, { name, feature: f, all, shown, qty, prev, tgt, billed, n: shown.length });
    }
    return out;
  }, [features, assigned, stats, status, level]); // eslint-disable-line react-hooks/exhaustive-deps
  const valueOf = r => !r ? 0 : trendOn ? r.qty - r.prev : metric === 'customers' ? r.n : metric === 'ach' ? (r.tgt ? Math.round(r.qty / r.tgt * 100) : 0) : r.qty;
  const colour = useMemo(() => makeColour([...regions.values()].map(valueOf)), [regions, trendOn, metric]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── KPIs for the view ──
  const kpi = useMemo(() => {
    const c = { billed: 0, unbilled: 0, inactive: 0, lost: 0 };
    let qty = 0, tgt = 0, prev = 0, billed = 0;
    for(const d of assigned.scope){ const s = S(d); c[s.st]++; if(!keep(d)) continue; qty += s.qty; tgt += s.tgt; prev += s.prev; if(s.qty > 0) billed++; }
    const active = [...regions.values()].filter(r => r.qty > 0).length;
    return { c, total: assigned.scope.length, qty, tgt, prev, billed, regions: active, avgQty: active ? Math.round(qty / active) : 0, perCust: billed ? Math.round(qty / billed) : 0 };
  }, [assigned, stats, status, regions]); // eslint-disable-line react-hooks/exhaustive-deps
  const unmapped = useMemo(() => assigned.unmapped.filter(keep), [assigned, stats, status]); // eslint-disable-line react-hooks/exhaustive-deps
  const unmappedQty = unmapped.reduce((t, d) => t + S(d).qty, 0);

  // ── the map ──
  const mapEl = useRef(null), mapRef = useRef(null), layerRef = useRef(null), labelsRef = useRef([]), drawnKey = useRef(null);
  const [ready, setReady] = useState(0);   // bumps each time a map is created, so it is always drawn
  const [mapErr, setMapErr] = useState('');
  const live = useRef({});                 // latest figures/handlers for Leaflet callbacks
  live.current = { regions, valueOf, colour, level, path, trendOn, metric, show, period, armed, terr, features };
  useEffect(() => {
    let dead = false;
    loadLeaflet().then(L => {
      if(dead || mapRef.current || !mapEl.current) return;
      const map = L.map(mapEl.current, {
        zoomControl: false, attributionControl: false, boxZoom: false,
        zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, wheelDebounceTime: 12,
        minZoom: 3, maxZoom: 13, inertia: true, renderer: L.svg({ padding: 0.8 }),
      });
      map.setView([22, 80], 4.4, { animate: false });
      map.createPane('biLabels'); map.getPane('biLabels').style.zIndex = 450; map.getPane('biLabels').style.pointerEvents = 'none';
      map.on('zoomend moveend', () => placeLabels());
      mapRef.current = map; setReady(n => n + 1);
    }).catch(e => setMapErr(e.message || 'Map did not load'));
    return () => { dead = true; if(mapRef.current){ mapRef.current.remove(); mapRef.current = null; } layerRef.current = null; labelsRef.current = []; drawnKey.current = null; };
  }, []);

  // re-measure when the panel changes size (sidebar, rotation)
  useEffect(() => {
    if(!ready || !mapEl.current || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { const m = mapRef.current; if(!m) return; m.invalidateSize({ animate: false }); fit(false); });
    ro.observe(mapEl.current);
    return () => ro.disconnect();
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const fit = (animate = true) => {
    const map = mapRef.current, fs = live.current.features, b = fs && boundsOf(fs); if(!map || !b) return;
    const pad = map.getSize().x < 500 ? 8 : 18;
    if(animate) map.flyToBounds(b, { padding: [pad, pad], duration: 0.8, easeLinearity: 0.25 });
    else map.fitBounds(b, { padding: [pad, pad], animate: false });
  };

  const styleOf = f => {
    const { regions: R, valueOf: V, colour: C, terr: T } = live.current;
    const r = R.get(f.properties.name), inT = ['A', 'B'].find(k => T[k].some(x => x.key === regionKey(f.properties.name)));
    return { className: 'bi-path', color: inT ? (inT === 'A' ? '#2563eb' : '#7c3aed') : '#7d887d', weight: inT ? 2.4 : 0.7, dashArray: inT ? '6 4' : null, fillColor: C(V(r)), fillOpacity: 1, opacity: 1 };
  };
  const regionKey = name => live.current.path.join('>') + '>' + name;

  const tipOf = f => {
    const { regions: R, period: P, level: lv, armed: A } = live.current;
    const r = R.get(f.properties.name) || { qty: 0, prev: 0, tgt: 0, billed: 0, n: 0 };
    const d = r.qty - r.prev, dp = r.prev ? Math.round(d / r.prev * 100) : null;
    return '<div class="bi-tip-t">' + f.properties.name + '</div>' +
      '<div><span>Sales :</span> <b class="q">Q : ' + fmtIN(r.qty) + '</b> | <b class="v">' + r.billed + ' billed</b></div>' +
      '<div><span>Count :</span> ' + r.n + ' customer' + (r.n === 1 ? '' : 's') + (r.tgt ? ' · ' + Math.round(r.qty / r.tgt * 100) + '% of ' + fmtIN(r.tgt) : '') + '</div>' +
      (P.prevFull ? '<div><span>vs ' + P.prevLabel + ' :</span> <b class="' + (d > 0 ? 'up' : d < 0 ? 'dn' : '') + '">' + signedIN(d) + (dp !== null ? ' (' + (dp > 0 ? '+' : '') + dp + '%)' : '') + '</b></div>' : '') +
      '<div class="bi-tip-h">' + (A ? 'Tap to add to Territory ' + (A === 'A' ? 1 : 2) : lv === 'india' ? 'Click for districts · hold & drag to a Territory' : lv === 'state' ? 'Click for talukas · hold & drag to a Territory' : 'Click to list customers') + '</div>';
  };

  const labelHtml = f => {
    const { regions: R, valueOf: V, trendOn: TR, metric: M, show: SH } = live.current;
    const r = R.get(f.properties.name), v = V(r);
    const num = TR ? (v ? signedIN(v) : '0') : M === 'ach' ? v + '%' : fmtIN(v);
    return '<div class="bi-lbl-in">' + (SH.name ? '<em>' + f.properties.name + '</em>' : '') +
      (SH.number ? '<b' + (TR && v < 0 ? ' class="neg"' : '') + '>' + num + '</b>' : '') +
      (SH.count ? '<i>(' + (r?.n || 0) + ')</i>' : '') + '</div>';
  };
  const placeLabels = () => {
    const map = mapRef.current; if(!map) return;
    for(const l of labelsRef.current){
      const el = l.marker.getElement(); if(!el) continue;
      const a = map.latLngToContainerPoint(l.b[0]), b = map.latLngToContainerPoint(l.b[1]);
      const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
      el.classList.toggle('hide', w < 26 || h < 14);
      el.classList.toggle('small', w < 70);
    }
  };

  // draw a level: new regions fade in while the old ones fade out, and the view flies over
  const levelKey = path.join('>');
  useEffect(() => {
    const L = window.L, map = mapRef.current;
    if(!ready || !map || !features) return;
    if(drawnKey.current === levelKey && layerRef.current){
      // same level — just recolour and relabel
      layerRef.current.setStyle(styleOf);
      for(const l of labelsRef.current){ const el = l.marker.getElement(); if(el) el.innerHTML = labelHtml(l.f); }
      placeLabels();
      return;
    }
    const first = drawnKey.current === null;
    drawnKey.current = levelKey;
    const old = layerRef.current, oldLabels = labelsRef.current;
    if(old){ old.setStyle({ fillOpacity: 0, opacity: 0 }); setTimeout(() => { try { old.remove(); } catch { /* gone */ } }, 380); }
    oldLabels.forEach(l => { const el = l.marker.getElement(); if(el) el.classList.add('out'); setTimeout(() => { try { l.marker.remove(); } catch { /* gone */ } }, 300); });
    const layer = L.geoJSON({ type: 'FeatureCollection', features }, {
      style: f => ({ ...styleOf(f), fillOpacity: 0, opacity: 0 }),
      onEachFeature: (f, lyr) => {
        lyr.bindTooltip(() => tipOf(f), { sticky: true, direction: 'top', offset: [0, -8], className: 'bi-tip', opacity: 1 });
        lyr.on('mouseover', () => { lyr.setStyle({ weight: 2.6, color: '#1b5e20' }); lyr.bringToFront(); });
        lyr.on('mouseout', () => lyr.setStyle(styleOf(f)));
        lyr.on('click', () => onRegionClick(f));
        lyr.on('mousedown', e => onRegionDown(e, f));
      },
    }).addTo(map);
    layerRef.current = layer;
    ensureDefs(map);
    requestAnimationFrame(() => layer.setStyle(styleOf));
    labelsRef.current = features.map(f => {
      const p = labelPoint(f); if(!p) return null;
      const marker = L.marker(p, { pane: 'biLabels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'bi-lbl', html: labelHtml(f), iconSize: [0, 0] }) }).addTo(map);
      return { marker, f, b: boundsOf(f) };
    }).filter(Boolean);
    fit(!first);
    setTimeout(placeLabels, first ? 0 : 850);
  }, [ready, features, levelKey, regions, colour, show, trendOn, metric, terr]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── clicking and dragging regions ──
  const suppressClick = useRef(0);
  const onRegionClick = f => {
    if(Date.now() < suppressClick.current) return;
    const { level: lv, path: P, armed: A, regions: R } = live.current;
    const name = f.properties.name;
    if(A){ toggleTerr(A, f); return; }
    if(lv === 'india'){ mapRef.current?.flyToBounds(boundsOf(f), { padding: [18, 18], duration: 0.8, easeLinearity: 0.25 }); setPath([name]); }
    else if(lv === 'state'){ mapRef.current?.flyToBounds(boundsOf(f), { padding: [18, 18], duration: 0.8, easeLinearity: 0.25 }); setPath([P[0], name]); }
    else { const r = R.get(name); openList(name + ' · ' + P[1], r ? r.shown : []); }
  };
  const ghostRef = useRef(null);
  const onRegionDown = (e, f) => {
    const oe = e.originalEvent; const map = mapRef.current;
    if(!oe || oe.button !== 0 || oe.pointerType === 'touch' || !map) return;
    const st = { x: oe.clientX, y: oe.clientY, moved: false, active: false };
    st.timer = setTimeout(() => {
      if(st.moved) return;
      st.active = true; map.dragging.disable();
      const r = live.current.regions.get(f.properties.name);
      const g = document.createElement('div');
      g.className = 'bi-ghost'; g.innerHTML = '<b>' + f.properties.name + '</b><span>' + fmtIN(r?.qty || 0) + '</span>';
      g.style.left = st.x + 'px'; g.style.top = st.y + 'px';
      document.body.appendChild(g); ghostRef.current = g;
      mapEl.current?.classList.add('grabbing');
    }, 220);
    const zoneAt = ev => document.elementFromPoint(ev.clientX, ev.clientY)?.closest?.('[data-terr]')?.dataset.terr || null;
    const move = ev => {
      if(!st.active){ if(Math.hypot(ev.clientX - st.x, ev.clientY - st.y) > 5){ st.moved = true; clearTimeout(st.timer); } return; }
      if(ghostRef.current){ ghostRef.current.style.left = ev.clientX + 'px'; ghostRef.current.style.top = ev.clientY + 'px'; }
      setOver(zoneAt(ev));
    };
    const up = ev => {
      clearTimeout(st.timer);
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up);
      if(!st.active) return;
      const z = zoneAt(ev);
      if(z) addTerr(z, f);
      suppressClick.current = Date.now() + 400;
      ghostRef.current?.remove(); ghostRef.current = null; setOver(null);
      mapEl.current?.classList.remove('grabbing');
      map.dragging.enable();
    };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  };

  // ── territories ──
  const terrItem = f => {
    const { regions: R, path: P, level: lv } = live.current;
    const r = R.get(f.properties.name);
    return { key: P.join('>') + '>' + f.properties.name, name: f.properties.name, kind: lv === 'india' ? 'state' : lv === 'state' ? 'district' : 'taluka', ids: (r?.all || []).map(d => d.id) };
  };
  const addTerr = (k, f) => { const it = terrItem(f); setTerr(t => t[k].some(x => x.key === it.key) ? t : { ...t, [k]: [...t[k], it] }); };
  const toggleTerr = (k, f) => { const it = terrItem(f); setTerr(t => ({ ...t, [k]: t[k].some(x => x.key === it.key) ? t[k].filter(x => x.key !== it.key) : [...t[k], it] })); };
  const byId = useMemo(() => new Map(base.map(d => [d.id, d])), [base]);
  const terrSum = items => {
    const seen = new Set(), ds = [];
    items.forEach(it => it.ids.forEach(id => { if(!seen.has(id) && byId.has(id)){ seen.add(id); ds.push(byId.get(id)); } }));
    const shown = ds.filter(keep);
    let qty = 0, prev = 0, tgt = 0, billed = 0;
    shown.forEach(d => { const s = S(d); qty += s.qty; prev += s.prev; tgt += s.tgt; if(s.qty > 0) billed++; });
    return { dealers: shown, qty, prev, tgt, billed };
  };

  // ── lists ──
  const openList = (title, ds) => setList({ title, dealers: ds });
  const scopeName = level === 'india' ? 'All India' : level === 'state' ? path[0] : path[1] + ', ' + path[0];

  // ── navigation ──
  const goTo = p => setPath(p);
  const crumbs = [['India', []], ...(path[0] ? [[path[0], [path[0]]]] : []), ...(path[1] ? [[path[1], path]] : [])];

  const regionRows = [...regions.values()].sort((a, b) => b.qty - a.qty || b.n - a.n);
  const smOptions = useMemo(() => [...new Set(allDealers.map(d => d.salesman).filter(Boolean))].map(id => ({ id, name: users?.[id]?.name || id })).sort((a, b) => a.name.localeCompare(b.name)), [allDealers, users]);
  const legendPos = [...POS].reverse();

  return (
    <div className="fade bi-page">
      <style>{CSS}</style>
      <PageHead icon={MapIcon} tone="#16a34a" eyebrow="Dealer Geography" title="Map View"/>

      {/* ── Customers · Selected · Average ── */}
      <div className="card bi-kpis">
        <div className="bi-kg">
          <div className="bi-kg-t">Customers</div>
          <div className="bi-kg-row">
            {STATUS.map(([k, l]) => (
              <button key={k} type="button" className={'bi-kc' + (status === k ? ' on' : '')} onClick={() => setStatus(s => s === k ? '' : k)} title={status === k ? 'Showing only ' + l.toLowerCase() + ' — tap again for all' : 'Show only ' + l.toLowerCase() + ' customers on the map'}>
                <span className="l">{l}</span>
                <b>{fmtIN(kpi.c[k])}</b>
                <i className="bar"><u style={{ width: (kpi.total ? kpi.c[k] / kpi.total * 100 : 0) + '%' }}/></i>
                <span className="li" role="button" tabIndex={0} title={'List ' + l.toLowerCase() + ' customers'} onClick={e => { e.stopPropagation(); openList(l + ' · ' + scopeName, assigned.scope.filter(d => S(d).st === k)); }}><List size={12}/></span>
              </button>
            ))}
          </div>
        </div>
        <div className="bi-kg">
          <div className="bi-kg-t k-sel">Selected</div>
          <div className="bi-kg-row">
            <button type="button" className="bi-kc" onClick={() => openList((status ? STATUS.find(s => s[0] === status)[1] + ' · ' : '') + scopeName, assigned.scope.filter(keep))}>
              <span className="l">Qty</span><b>{fmtIN(kpi.qty)}</b><i className="bar"><u style={{ width: '100%' }}/></i>
            </button>
            <div className="bi-kc ro"><span className="l">Target</span><b>{kpi.tgt ? fmtIN(kpi.tgt) : '—'}</b><i className="bar"><u style={{ width: Math.min(100, kpi.tgt ? kpi.qty / kpi.tgt * 100 : 0) + '%', background: pclr(kpi.tgt ? pct(kpi.tgt, kpi.qty) : null) }}/></i></div>
            <div className="bi-kc ro"><span className="l">{period.prevFull ? 'vs ' + period.prevLabel : 'Ach %'}</span>
              {period.prevFull ? <b style={{ color: kpi.qty >= kpi.prev ? 'var(--grn)' : 'var(--red)' }}>{signedIN(kpi.qty - kpi.prev)}</b> : <b style={{ color: pclr(kpi.tgt ? pct(kpi.tgt, kpi.qty) : null) }}>{kpi.tgt ? spct(kpi.tgt, kpi.qty) : 'N/T'}</b>}
              <i className="bar"><u/></i></div>
          </div>
        </div>
        <div className="bi-kg">
          <div className="bi-kg-t k-avg">Average ({kpi.regions})</div>
          <div className="bi-kg-row">
            <div className="bi-kc ro" title={'Qty per ' + (level === 'india' ? 'state' : level === 'state' ? 'district' : 'taluka') + ' with sales'}><span className="l">Qty</span><b>{fmtIN(kpi.avgQty)}</b><i className="bar"><u/></i></div>
            <div className="bi-kc ro" title="Qty per billed customer"><span className="l">Per customer</span><b>{fmtIN(kpi.perCust)}</b><i className="bar"><u/></i></div>
          </div>
        </div>
      </div>

      <div className="bi-split">
        {/* ── map ── */}
        <div className="card bi-mapcard">
          <div className="bi-tb">
            <nav className="bi-crumb">
              <Globe size={14}/>
              <span className="w">World</span><ChevronRight size={12}/>
              {crumbs.map(([l, p], i) => (
                <React.Fragment key={l + i}>
                  {i > 0 && <ChevronRight size={12}/>}
                  {i < crumbs.length - 1 ? <a onClick={() => goTo(p)}>{l}</a> : <b>{l}</b>}
                </React.Fragment>
              ))}
            </nav>
            <div className="bi-tools">
              <select value={periodKey} onChange={e => { const k = e.target.value; if(k === 'custom' && customFrom === null){ setCustomFrom(period.idx[0]); setCustomTo(period.idx[period.idx.length - 1]); } setPeriodKey(k); }} title="Duration">
                {PERIODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              {periodKey === 'custom' && <>
                <select value={customFrom ?? period.idx[0]} onChange={e => setCustomFrom(+e.target.value)}>{MO.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
                <select value={customTo ?? period.idx[period.idx.length - 1]} onChange={e => setCustomTo(+e.target.value)}>{MO.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
              </>}
              {smOptions.length > 1 && <select value={sm} onChange={e => setSm(e.target.value)} title="Salesperson" className={sm ? 'on' : ''}>
                <option value="">All salespersons</option>{smOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>}
              <select value={metric} onChange={e => setMetric(e.target.value)} title="Colour the map by" disabled={trendOn}>
                <option value="qty">Qty</option><option value="customers">Customers</option><option value="ach">Achievement %</option>
              </select>
              <div className="bi-seg">
                {[['name', 'Name'], ['number', 'Number'], ['count', 'Count']].map(([k, l]) => <button key={k} type="button" className={show[k] ? 'on' : ''} onClick={() => setShow(k)}>{l}</button>)}
              </div>
              <button type="button" className={'bi-ib' + (trendOn ? ' on' : '')} disabled={!period.prevFull} onClick={() => setTrend(t => !t)} title={period.prevFull ? 'Trend: growth vs ' + period.prevLabel : 'No earlier period to compare with'}><TrendingUp size={14}/> Trend</button>
              <button type="button" className="bi-ib" onClick={() => fit(true)} title="Fit the view"><Maximize2 size={14}/></button>
            </div>
          </div>
          <div className="bi-mapwrap">
            <div ref={mapEl} className="bi-map"/>
            {unmapped.length > 0 && (
              <button type="button" className="bi-unmapped" onClick={() => openList('Not on the map · ' + scopeName, unmapped)} title="Customers whose city could not be placed on this map — tap to list them">
                <b>{fmtIN(unmappedQty)}</b><span>{unmapped.length} not on map</span>
              </button>
            )}
            {status && <div className="bi-filterpill">{STATUS.find(s => s[0] === status)[1]} only <button onClick={() => setStatus('')}><X size={11}/></button></div>}
            {(!features || !ready) && !mapErr && !geoErr && <div className="bi-loading"><Loader2 size={18} className="spin"/> Loading map…</div>}
            {(mapErr || geoErr) && <div className="bi-loading err">{mapErr || geoErr}</div>}
            <div className="bi-period">{period.label}{trendOn ? ' vs ' + period.prevLabel : ''}</div>
          </div>
        </div>

        {/* ── territories · legend · compare ── */}
        <div className="bi-side">
          {['A', 'B'].map(k => {
            const items = terr[k], t = terrSum(items);
            return (
              <div key={k} className={'card bi-terr' + (over === k ? ' over' : '') + (armed === k ? ' armed' : '')} data-terr={k} style={{ '--tc': k === 'A' ? '#2563eb' : '#7c3aed' }}>
                <div className="bi-terr-h">
                  <span>Territory {k === 'A' ? 1 : 2}</span>
                  {items.length > 0 && <em>{items.length}</em>}
                  <div style={{ flex: 1 }}/>
                  <button type="button" className={'bi-terr-add' + (armed === k ? ' on' : '')} onClick={() => setArmed(a => a === k ? null : k)} title="Tap regions on the map to add them">{armed === k ? 'Done' : <><Plus size={12}/> Add</>}</button>
                  {items.length > 0 && <button type="button" className="bi-terr-x" onClick={() => setTerr(x => ({ ...x, [k]: [] }))} title="Clear"><Trash2 size={12}/></button>}
                </div>
                {items.length === 0 ? (
                  <div className="bi-drop">{armed === k ? 'Tap regions on the map to add them' : 'Drag Region to below area'}<small>{armed === k ? 'Tap Done when finished.' : 'Press and hold a region, then drag it here — or tap Add.'}</small></div>
                ) : (<>
                  <div className="bi-chips">
                    {items.map(it => <span key={it.key} className="bi-chip">{it.name}<small>{it.kind}</small><button onClick={() => setTerr(x => ({ ...x, [k]: x[k].filter(y => y.key !== it.key) }))}><X size={10}/></button></span>)}
                  </div>
                  <div className="bi-tk">
                    <div><span>Customers</span><b>{t.dealers.length}</b></div>
                    <div><span>Billed</span><b>{t.billed}</b></div>
                    <div><span>Qty</span><b className="g">{fmtIN(t.qty)}</b></div>
                    <div><span>Target</span><b>{t.tgt ? fmtIN(t.tgt) : '—'}</b></div>
                    <div><span>Ach %</span><b style={{ color: pclr(t.tgt ? pct(t.tgt, t.qty) : null) }}>{t.tgt ? spct(t.tgt, t.qty) : 'N/T'}</b></div>
                    <div><span>{period.prevFull ? 'vs ' + period.prevLabel : 'vs prev'}</span><b style={{ color: t.qty >= t.prev ? 'var(--grn)' : 'var(--red)' }}>{period.prevFull ? signedIN(t.qty - t.prev) : '—'}</b></div>
                  </div>
                  <button type="button" className="bi-terr-list" onClick={() => openList('Territory ' + (k === 'A' ? 1 : 2) + ' · ' + items.map(i => i.name).join(', '), t.dealers)}><List size={13}/> List customers</button>
                </>)}
              </div>
            );
          })}
          <div className="bi-legend">
            {trendOn ? <>
              {[...POS].reverse().map((c, i) => <i key={c} style={{ background: c }}>{i === 0 ? 'Up' : ''}</i>)}
              {NEG.map((c, i) => <i key={c} style={{ background: c }}>{i === NEG.length - 1 ? 'Down' : ''}</i>)}
            </> : legendPos.map((c, i) => <i key={c} style={{ background: c }}>{i === 0 ? 'High' : i === legendPos.length - 1 ? 'Low' : ''}</i>)}
          </div>
          <button type="button" className="bi-compare" onClick={() => setCompareOpen(true)}><GitCompare size={15}/> Compare Multiple Timelines</button>
        </div>
      </div>

      {/* ── regions in this view ── */}
      <div className="card bi-regions">
        <div className="sec-title" style={{ marginBottom: 8 }}>
          <span className="sec-ico" style={{ '--tone': '#16a34a' }}><MapIcon size={15}/></span>
          {level === 'india' ? 'States' : level === 'state' ? 'Districts of ' + path[0] : 'Talukas of ' + path[1]}
          <span className="count-pill">{regionRows.filter(r => r.n).length}</span>
          <span className="sec-note">{period.label}{status ? ' · ' + STATUS.find(s => s[0] === status)[1] + ' only' : ''}</span>
        </div>
        <div className="bi-rt">
          <table>
            <thead><tr><th>{level === 'india' ? 'State' : level === 'state' ? 'District' : 'Taluka'}</th><th>Customers</th><th>Billed</th><th>Qty</th><th className="hs">Target</th><th className="hs">Ach %</th>{period.prevFull && <th>vs prev</th>}</tr></thead>
            <tbody>
              {regionRows.filter(r => r.n || r.qty).map(r => (
                <tr key={r.name} onClick={() => onRegionClick(r.feature)}>
                  <td><i className="sw" style={{ background: (c => c.startsWith('url') ? '#e5e7e5' : c)(colour(valueOf(r))) }}/>{r.name}</td>
                  <td>{r.n}</td><td>{r.billed}</td><td className="b">{fmtIN(r.qty)}</td>
                  <td className="hs">{r.tgt ? fmtIN(r.tgt) : '—'}</td>
                  <td className="hs" style={{ color: pclr(r.tgt ? pct(r.tgt, r.qty) : null), fontWeight: 700 }}>{r.tgt ? spct(r.tgt, r.qty) : '—'}</td>
                  {period.prevFull && <td style={{ color: r.qty > r.prev ? 'var(--grn)' : r.qty < r.prev ? 'var(--red)' : 'var(--t3)', fontWeight: 700 }}>{r.qty - r.prev ? signedIN(r.qty - r.prev) : '—'}</td>}
                </tr>
              ))}
              {unmapped.length > 0 && <tr className="um" onClick={() => openList('Not on the map · ' + scopeName, unmapped)}><td><i className="sw" style={{ background: 'transparent', border: '1px dashed var(--t3)' }}/>Not on the map</td><td>{unmapped.length}</td><td>{unmapped.filter(d => S(d).qty > 0).length}</td><td className="b">{fmtIN(unmappedQty)}</td><td className="hs"/><td className="hs"/>{period.prevFull && <td/>}</tr>}
              {!regionRows.some(r => r.n) && !unmapped.length && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--t3)', padding: 18 }}>No customers here.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {list && <CustomerList list={list} onClose={() => setList(null)} S={S} users={users} period={period} onOpenDealer={onOpenDealer}/>}
      {compareOpen && (
        <React.Suspense fallback={null}>
          <MapCompare dealers={base} users={users} MO={MO} selectedMonthIdx={selectedMonthIdx} sm={sm} initialPath={path}
            onOpenDealer={onOpenDealer} onClose={() => setCompareOpen(false)}/>
        </React.Suspense>
      )}
    </div>
  );
}

// ── "List customers" — with the columns you choose ──────────────────────────
function CustomerList({ list, onClose, S, users, period, onOpenDealer }){
  const [q, setQ] = useState('');
  const [cols, setColsRaw] = useState(() => readLS('bi_list_cols', LIST_DEFAULT));
  const setCols = c => { setColsRaw(c); writeLS('bi_list_cols', c); };
  const [pick, setPick] = useState(false);
  const [sort, setSort] = useState({ c: 'qty', d: -1 });
  useEffect(() => { const k = e => { if(e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  const cell = (d, c) => {
    const s = S(d);
    switch(c){
      case 'city': return d.city || '';
      case 'state': return d.state || '';
      case 'salesman': return users?.[d.salesman]?.name || d.salesman || '';
      case 'zone': return d.zone || '';
      case 'tier': return d.perfStatus || 'NEW DEALER';
      case 'status': return ({ billed: 'Billed', unbilled: 'Unbilled', inactive: 'Inactive', lost: 'Lost' })[s.st];
      case 'last': return s.last;
      case 'qty': return s.qty;
      case 'target': return s.tgt;
      case 'ach': return s.tgt ? Math.round(s.qty / s.tgt * 100) : null;
      case 'prev': return s.qty - s.prev;
      default: return '';
    }
  };
  const shownCols = LIST_COLS.filter(([k]) => cols.includes(k) && (k !== 'prev' || period.prevFull));
  const ql = q.trim().toLowerCase();
  const rows = list.dealers.filter(d => !ql || (d.name || '').toLowerCase().includes(ql) || (d.city || '').toLowerCase().includes(ql))
    .sort((a, b) => {
      const x = sort.c === 'name' ? a.name : cell(a, sort.c), y = sort.c === 'name' ? b.name : cell(b, sort.c);
      if(typeof x === 'number' || typeof y === 'number') return ((x ?? -1e9) - (y ?? -1e9)) * sort.d;
      return String(x || '').localeCompare(String(y || '')) * sort.d;
    });
  const total = rows.reduce((t, d) => t + S(d).qty, 0);
  const th = (k, l) => <th key={k} className={['qty', 'target', 'ach', 'prev'].includes(k) ? 'r' : ''} onClick={() => setSort(s => ({ c: k, d: s.c === k ? -s.d : (k === 'name' ? 1 : -1) }))}>{l}{sort.c === k ? (sort.d > 0 ? ' ↑' : ' ↓') : ''}</th>;
  const exportCsv = () => {
    const h = ['Customer', ...shownCols.map(c => c[1])];
    const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = [h, ...rows.map(d => [d.name, ...shownCols.map(([k]) => cell(d, k))])].map(r => r.map(esc).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'customers_' + list.title.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40) + '.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  return (
    <div className="bi-ov" onClick={onClose}>
      <div className="bi-list" onClick={e => e.stopPropagation()}>
        <div className="bi-list-h">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">List Customers <span>· {list.title}</span></div>
            <div className="s">{rows.length} customers · {period.label} · qty {fmtIN(total)}</div>
          </div>
          <button type="button" className="bi-ib" onClick={() => setPick(p => !p)} title="Choose columns"><Columns3 size={15}/></button>
          <button type="button" className="bi-ib" onClick={exportCsv} title="Download as CSV"><Download size={15}/></button>
          <button type="button" className="bi-ib" onClick={onClose} title="Close"><X size={16}/></button>
        </div>
        {pick && (
          <div className="bi-cols">
            <div className="t">Choose Columns</div>
            <div className="g">
              {LIST_COLS.map(([k, l]) => <label key={k}><input type="checkbox" checked={cols.includes(k)} onChange={() => setCols(cols.includes(k) ? cols.filter(x => x !== k) : [...cols, k])}/>{l}</label>)}
            </div>
          </div>
        )}
        <div className="bi-list-q"><Search size={14}/><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search customer or city…" autoFocus/></div>
        <div className="bi-list-b">
          <table>
            <thead><tr>{th('name', 'Customer Name')}{shownCols.map(([k, l]) => th(k, l))}</tr></thead>
            <tbody>
              {rows.map(d => (
                <tr key={d.id} onClick={() => onOpenDealer?.(d.id)}>
                  <td className="nm">{d.name}</td>
                  {shownCols.map(([k]) => {
                    const v = cell(d, k);
                    if(k === 'qty') return <td key={k} className="r" style={{ fontWeight: 800, color: v > 0 ? 'var(--grn)' : 'var(--t3)' }}>{v ? fmtIN(v) : '—'}</td>;
                    if(k === 'target') return <td key={k} className="r">{v ? fmtIN(v) : '—'}</td>;
                    if(k === 'ach') return <td key={k} className="r" style={{ color: pclr(v), fontWeight: 700 }}>{v === null ? '—' : v + '%'}</td>;
                    if(k === 'prev') return <td key={k} className="r" style={{ fontWeight: 700, color: v > 0 ? 'var(--grn)' : v < 0 ? 'var(--red)' : 'var(--t3)' }}>{v ? signedIN(v) : '—'}</td>;
                    if(k === 'last') return <td key={k}>{v || <span style={{ color: 'var(--red)' }}>never</span>}</td>;
                    return <td key={k}>{v || '—'}</td>;
                  })}
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={shownCols.length + 1} style={{ textAlign: 'center', color: 'var(--t3)', padding: 20 }}>No customers.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.bi-page { --bi-bg: color-mix(in srgb, #4caf50 7%, var(--bg1)); }
.bi-kpis { display:grid; grid-template-columns: 4fr 3fr 2fr; gap:0; padding:10px 6px !important; margin-bottom:12px; }
.bi-kg { padding:0 10px; min-width:0; }
.bi-kg + .bi-kg { border-left:1px solid var(--b1); }
.bi-kg-t { text-align:center; font-size:12px; font-weight:800; color:#2563eb; margin-bottom:6px; letter-spacing:.02em; }
.bi-kg-t.k-sel { color:#c2410c; } .bi-kg-t.k-avg { color:#0e7490; }
.bi-kg-row { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(0,1fr); gap:6px; }
.bi-kc { position:relative; display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 4px 7px; border-radius:10px; border:1px solid transparent; background:transparent; cursor:pointer; min-width:0; font:inherit; color:var(--t1); transition:background .15s, border-color .15s; }
.bi-kc:hover { background:var(--bg2); }
.bi-kc.ro { cursor:default; } .bi-kc.ro:hover { background:transparent; }
.bi-kc.on { background:color-mix(in srgb,#2563eb 12%,var(--bg1)); border-color:color-mix(in srgb,#2563eb 45%,transparent); }
.bi-kc .l { font-size:11px; font-weight:700; color:var(--t3); white-space:nowrap; }
.bi-kc b { font-size:17px; font-weight:850; letter-spacing:-.01em; white-space:nowrap; }
.bi-kc .bar { display:block; width:72%; height:3px; border-radius:2px; background:var(--b1); overflow:hidden; margin-top:3px; }
.bi-kc .bar u { display:block; height:100%; background:#2563eb; border-radius:2px; transition:width .4s; }
.bi-kc .li { position:absolute; top:4px; right:4px; display:none; color:var(--t3); padding:2px; border-radius:5px; }
.bi-kc:hover .li, .bi-kc.on .li { display:flex; }
.bi-kc .li:hover { color:#2563eb; background:var(--bg1); }
.bi-split { display:grid; grid-template-columns: minmax(0,1fr) 300px; gap:12px; align-items:start; }
.bi-mapcard { padding:0 !important; overflow:hidden; }
.bi-tb { display:flex; align-items:center; gap:8px; flex-wrap:wrap; padding:9px 12px; border-bottom:1px solid var(--b1); background:var(--bg1); }
.bi-crumb { display:flex; align-items:center; gap:4px; font-size:13px; color:var(--t3); min-width:0; flex-wrap:wrap; }
.bi-crumb a { color:#2563eb; font-weight:700; cursor:pointer; } .bi-crumb a:hover { text-decoration:underline; }
.bi-crumb b { color:var(--t1); font-weight:800; } .bi-crumb .w { color:var(--t3); font-weight:600; }
.bi-tools { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-left:auto; }
.bi-tools select { background:var(--bg1); color:var(--t1); border:1px solid var(--b2); border-radius:8px; padding:5px 8px; font-size:12px; font-weight:700; max-width:170px; }
.bi-tools select.on { border-color:#2563eb; color:#2563eb; }
.bi-seg { display:inline-flex; border:1px solid var(--b2); border-radius:8px; overflow:hidden; }
.bi-seg button { border:none; background:var(--bg1); color:var(--t2); font-size:11.5px; font-weight:700; padding:5px 9px; cursor:pointer; }
.bi-seg button + button { border-left:1px solid var(--b2); }
.bi-seg button.on { background:#2563eb; color:#fff; }
.bi-ib { display:inline-flex; align-items:center; gap:4px; border:1px solid var(--b2); background:var(--bg1); color:var(--t2); border-radius:8px; padding:5px 8px; font-size:11.5px; font-weight:700; cursor:pointer; }
.bi-ib:hover:not(:disabled) { color:#2563eb; border-color:#2563eb; }
.bi-ib.on { background:#2563eb; border-color:#2563eb; color:#fff; }
.bi-ib:disabled { opacity:.45; cursor:not-allowed; }
.bi-mapwrap { position:relative; }
.bi-map { height: clamp(360px, 62vh, 640px); width:100%; background: var(--bi-bg) !important; outline:none; font-family: inherit; }
.bi-map.grabbing, .bi-map.grabbing * { cursor: grabbing !important; }
.bi-map path.bi-path { transition: fill-opacity .35s ease, stroke-opacity .35s ease, fill .4s ease; cursor:pointer; }
.bi-lbl { pointer-events:none; }
.bi-lbl-in { position:absolute; transform:translate(-50%,-50%); text-align:center; white-space:nowrap; line-height:1.1; animation: biIn .45s ease both; }
.bi-lbl.out .bi-lbl-in { opacity:0; transition:opacity .25s; }
.bi-lbl.hide .bi-lbl-in { display:none; }
.bi-lbl-in em { display:block; font-style:normal; font-family: Inter, system-ui, sans-serif; font-size:10px; font-weight:700; color:#334155; }
.bi-lbl-in b { display:block; font-family: Georgia, 'Times New Roman', serif; font-size:12.5px; font-weight:500; color:#1f2a1f; }
.bi-lbl-in b.neg { color:#b91c1c; }
.bi-lbl-in i { display:block; font-style:normal; font-size:9.5px; color:#475569; }
.bi-lbl.small .bi-lbl-in em { display:none; }
.bi-lbl.small .bi-lbl-in b { font-size:10.5px; }
@keyframes biIn { from { opacity:0; } to { opacity:1; } }
.leaflet-tooltip.bi-tip { background:#fff; color:#334155; border:1px solid #e2e8f0; border-radius:10px; box-shadow:0 10px 28px rgba(15,23,42,.18); padding:9px 12px; font: 12px/1.55 Inter, system-ui, sans-serif; min-width:180px; }
.leaflet-tooltip.bi-tip::before { display:none; }
.bi-tip-t { font-weight:850; font-size:13px; color:#0f172a; margin-bottom:3px; }
.bi-tip span { color:#64748b; font-weight:600; }
.bi-tip b.q { color:#b45309; } .bi-tip b.v { color:#15803d; } .bi-tip b.up { color:#15803d; } .bi-tip b.dn { color:#b91c1c; }
.bi-tip-h { margin-top:5px; padding-top:5px; border-top:1px dashed #e2e8f0; font-size:10.5px; color:#94a3b8; }
.bi-unmapped { position:absolute; top:12px; left:12px; z-index:500; display:flex; flex-direction:column; align-items:center; gap:0; padding:6px 14px; border-radius:10px; border:1px solid #d4d4d4; background:linear-gradient(90deg,#d4d6d4,#f3f4f3 45%,#eceeec 55%,#d8dad8); color:#1f2a1f; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,.08); }
.bi-unmapped b { font-family: Georgia, 'Times New Roman', serif; font-weight:500; font-size:14px; }
.bi-unmapped span { font-size:9.5px; font-weight:700; color:#475569; }
.bi-filterpill { position:absolute; top:12px; left:50%; transform:translateX(-50%); z-index:500; display:flex; align-items:center; gap:6px; padding:4px 6px 4px 12px; border-radius:20px; background:#2563eb; color:#fff; font-size:11.5px; font-weight:800; box-shadow:0 4px 12px rgba(37,99,235,.3); }
.bi-filterpill button { border:none; background:rgba(255,255,255,.25); color:#fff; border-radius:50%; width:18px; height:18px; display:grid; place-items:center; cursor:pointer; }
.bi-period { position:absolute; right:12px; bottom:10px; z-index:500; font-size:11px; font-weight:800; color:var(--t3); background:color-mix(in srgb,var(--bg1) 80%,transparent); padding:3px 9px; border-radius:20px; }
.bi-loading { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; gap:8px; font-size:13px; font-weight:700; color:var(--t3); z-index:600; pointer-events:none; }
.bi-loading.err { color:var(--red); }
.bi-loading .spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.bi-side { display:flex; flex-direction:column; gap:10px; min-width:0; }
.bi-terr { padding:10px 12px !important; border:1.5px solid var(--b1); transition:border-color .15s, box-shadow .15s, background .15s; }
.bi-terr.over { border-color:var(--tc); box-shadow:0 0 0 3px color-mix(in srgb,var(--tc) 20%,transparent); background:color-mix(in srgb,var(--tc) 5%,var(--bg1)); }
.bi-terr.armed { border-color:var(--tc); }
.bi-terr-h { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:800; color:var(--tc); }
.bi-terr-h em { font-style:normal; font-size:10.5px; background:var(--tc); color:#fff; border-radius:10px; padding:0 6px; }
.bi-terr-add, .bi-terr-x { display:inline-flex; align-items:center; gap:3px; border:1px solid var(--b2); background:var(--bg1); color:var(--t2); border-radius:7px; font-size:11px; font-weight:700; padding:3px 8px; cursor:pointer; }
.bi-terr-add.on { background:var(--tc); color:#fff; border-color:var(--tc); }
.bi-terr-x { color:var(--red); padding:3px 6px; }
.bi-drop { margin-top:8px; border:1.5px dashed var(--b2); border-radius:10px; padding:16px 10px; text-align:center; font-size:12.5px; font-weight:700; color:var(--t2); display:flex; flex-direction:column; gap:3px; }
.bi-drop small { font-size:10.5px; font-weight:500; color:var(--t3); }
.bi-terr.over .bi-drop { border-color:var(--tc); color:var(--tc); }
.bi-chips { display:flex; flex-wrap:wrap; gap:5px; margin-top:8px; }
.bi-chip { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:700; padding:2px 3px 2px 9px; border-radius:20px; border:1.5px dashed var(--tc); background:color-mix(in srgb,var(--tc) 7%,var(--bg1)); color:var(--t1); }
.bi-chip small { font-size:9px; color:var(--t3); font-weight:600; }
.bi-chip button { border:none; background:none; color:var(--t3); cursor:pointer; display:flex; padding:2px; }
.bi-tk { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin-top:8px; }
.bi-tk div { background:var(--bg2); border-radius:8px; padding:5px 7px; min-width:0; }
.bi-tk span { display:block; font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:var(--t3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.bi-tk b { font-size:13.5px; color:var(--t1); } .bi-tk b.g { color:var(--grn); }
.bi-terr-list { margin-top:8px; width:100%; display:inline-flex; align-items:center; justify-content:center; gap:5px; border:1px solid var(--b2); background:var(--bg1); color:var(--t1); border-radius:8px; padding:6px; font-size:12px; font-weight:700; cursor:pointer; }
.bi-terr-list:hover { border-color:var(--tc); color:var(--tc); }
.bi-legend { display:grid; grid-auto-flow:column; grid-auto-columns:1fr; gap:3px; }
.bi-legend i { height:16px; border-radius:3px; font-style:normal; font-size:9.5px; font-weight:800; color:#1f2a1f; display:flex; align-items:center; justify-content:center; }
.bi-compare { display:inline-flex; align-items:center; justify-content:center; gap:7px; width:100%; border:none; background:#3b82f6; color:#fff; border-radius:10px; padding:10px; font-size:13px; font-weight:800; cursor:pointer; box-shadow:0 6px 16px rgba(59,130,246,.3); }
.bi-compare:hover { background:#2563eb; }
.bi-ghost { position:fixed; z-index:5000; pointer-events:none; transform:translate(12px,12px); display:flex; flex-direction:column; padding:6px 12px; border-radius:10px; background:#fff; color:#0f172a; border:1.5px solid #2563eb; box-shadow:0 10px 26px rgba(15,23,42,.25); font-size:12px; }
.bi-ghost span { font-family: Georgia, serif; color:#15803d; }
.bi-regions { margin-top:12px; }
.bi-rt { overflow:auto; max-height:420px; }
.bi-rt table { width:100%; border-collapse:collapse; font-size:12.5px; }
.bi-rt th { position:sticky; top:0; background:var(--bg2); text-align:right; font-size:10.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--t3); padding:7px 10px; z-index:1; }
.bi-rt th:first-child, .bi-rt td:first-child { text-align:left; }
.bi-rt td { text-align:right; padding:7px 10px; border-bottom:1px solid var(--b1); color:var(--t2); white-space:nowrap; }
.bi-rt td:first-child { font-weight:700; color:var(--t1); }
.bi-rt td.b { font-weight:800; color:var(--t1); }
.bi-rt tbody tr { cursor:pointer; } .bi-rt tbody tr:hover { background:var(--bg2); }
.bi-rt tr.um td:first-child { color:var(--t3); font-style:italic; }
.bi-rt .sw { display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:8px; vertical-align:-1px; }
.bi-ov { position:fixed; inset:0; background:rgba(6,6,16,.55); backdrop-filter:blur(3px); z-index:1900; display:flex; align-items:center; justify-content:center; padding:16px; }
.bi-list { position:relative; background:var(--bg1); border:1px solid var(--b1); border-radius:16px; width:1000px; max-width:100%; max-height:88vh; display:flex; flex-direction:column; box-shadow:0 24px 60px rgba(0,0,0,.35); }
.bi-list-h { display:flex; align-items:flex-start; gap:6px; padding:14px 16px 8px; }
.bi-list-h .t { font-size:15px; font-weight:850; color:#2563eb; } .bi-list-h .t span { color:var(--t1); font-weight:700; }
.bi-list-h .s { font-size:11.5px; color:var(--t3); margin-top:2px; }
.bi-cols { position:absolute; top:52px; right:16px; z-index:3; width:min(440px, calc(100% - 32px)); background:var(--bg1); border:1px solid var(--b2); border-radius:12px; box-shadow:0 16px 40px rgba(0,0,0,.25); padding:12px 14px; }
.bi-cols .t { font-size:13px; font-weight:850; color:#2563eb; margin-bottom:8px; }
.bi-cols .g { display:grid; grid-template-columns:repeat(3,1fr); gap:6px 10px; }
.bi-cols label { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--t1); cursor:pointer; }
.bi-cols input { accent-color:#2563eb; }
.bi-list-q { display:flex; align-items:center; gap:8px; margin:0 16px 8px; padding:7px 10px; border:1px solid var(--b2); border-radius:10px; background:var(--bg2); color:var(--t3); }
.bi-list-q input { flex:1; border:none; outline:none; background:transparent; color:var(--t1); font-size:13px; }
.bi-list-b { overflow:auto; border-top:1px solid var(--b1); }
.bi-list-b table { width:100%; border-collapse:collapse; font-size:12.5px; }
.bi-list-b th { position:sticky; top:0; z-index:1; background:var(--bg2); text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--t3); padding:8px 10px; cursor:pointer; white-space:nowrap; user-select:none; }
.bi-list-b th.r, .bi-list-b td.r { text-align:right; }
.bi-list-b td { padding:8px 10px; border-bottom:1px solid var(--b1); color:var(--t2); white-space:nowrap; }
.bi-list-b td.nm { font-weight:750; color:var(--t1); white-space:normal; min-width:160px; }
.bi-list-b tbody tr { cursor:pointer; } .bi-list-b tbody tr:hover { background:var(--bg2); }
@media (max-width: 1000px) {
  .bi-split { grid-template-columns: 1fr; }
  .bi-side { display:grid; grid-template-columns: 1fr 1fr; }
  .bi-legend, .bi-compare { grid-column: 1 / -1; }
}
@media (max-width: 760px) {
  .bi-kpis { grid-template-columns: 1fr; gap:8px; }
  .bi-kg + .bi-kg { border-left:none; border-top:1px solid var(--b1); padding-top:8px; }
  .bi-kc b { font-size:15px; }
  .bi-tools { margin-left:0; }
  .bi-map { height: 58vh; }
  .bi-side { grid-template-columns: 1fr; }
  .bi-rt .hs { display:none; }
  .bi-cols .g { grid-template-columns: repeat(2,1fr); }
}
`;
