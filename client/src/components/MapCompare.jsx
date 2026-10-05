// Map Compare View — two BI maps side by side, each with its own duration, so a
// region in one timeline can be read against another (Sep vs Oct, this quarter
// vs last). Both maps share one colour scale and one drill (India → state →
// district) and move together.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ArrowLeft, ChevronRight, Globe, GitCompare, Loader2 } from 'lucide-react';
import { loadLeaflet, loadStates, loadDistricts, loadTalukas, assignDealers, makeColour, ensureDefs, labelPoint, boundsOf, fmtIN, signedIN, PERIODS, periodRange, sumMonths } from '../lib/biMap';

const CSS = `
.mc-ov{position:fixed;inset:0;z-index:1800;background:var(--bg);display:flex;flex-direction:column;overflow:auto}
.mc-top{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--b1);background:var(--bg1);position:sticky;top:0;z-index:5;flex-wrap:wrap}
.mc-title{font-size:16px;font-weight:850;color:var(--t1);display:flex;align-items:center;gap:8px}
.mc-crumb{display:flex;align-items:center;gap:5px;font-size:13px;font-weight:700;color:var(--t3)}
.mc-crumb a{color:#2563eb;cursor:pointer}
.mc-crumb b{color:var(--t1)}
.mc-x{margin-left:auto;background:none;border:1px solid var(--b2);border-radius:10px;color:var(--t2);cursor:pointer;padding:6px 8px;display:flex}
.mc-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;padding:12px 16px;align-items:start}
.mc-pane{background:var(--bg1);border:1px solid var(--b1);border-radius:14px;overflow:hidden;min-width:0}
.mc-pane-h{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:9px 12px;border-bottom:1px solid var(--b1)}
.mc-pane-h select{background:var(--bg1);color:var(--t1);border:1px solid var(--b2);border-radius:8px;padding:5px 8px;font-size:12px;font-weight:700}
.mc-pane-h b{font-size:12.5px;color:#2563eb}
.mc-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:8px 12px;border-bottom:1px solid var(--b1)}
.mc-kpis div{text-align:center}
.mc-kpis span{display:block;font-size:11px;font-weight:700;color:var(--t3)}
.mc-kpis b{font-size:16px;font-weight:850;color:var(--t1)}
.mc-mapwrap{position:relative}
.mc-map{height:clamp(300px,52vh,560px);background:color-mix(in srgb,#4caf50 7%,var(--bg1)) !important;outline:none}
.mc-map path.bi-path{transition:fill-opacity .35s ease,stroke-opacity .35s ease,fill .4s ease;cursor:pointer}
.mc-mid{display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:90px;min-width:120px}
.mc-chg{background:var(--bg1);border:1px solid var(--b1);border-radius:14px;padding:12px;text-align:center;min-width:120px}
.mc-chg span{display:block;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--t3)}
.mc-chg b{font-size:20px;font-weight:850}
.mc-tbl{margin:0 16px 16px;background:var(--bg1);border:1px solid var(--b1);border-radius:14px;overflow:hidden}
.mc-tbl-h{padding:10px 12px;font-size:13px;font-weight:800;color:var(--t1);border-bottom:1px solid var(--b1);background:var(--bg2)}
.mc-tbl table{width:100%;border-collapse:collapse;font-size:12.5px}
.mc-tbl th{text-align:right;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--t3);padding:8px 10px;border-bottom:1px solid var(--b1)}
.mc-tbl th:first-child,.mc-tbl td:first-child{text-align:left}
.mc-tbl td{text-align:right;padding:7px 10px;border-bottom:1px solid var(--b1);color:var(--t2)}
.mc-tbl tr.click{cursor:pointer}
.mc-tbl tr.click:hover{background:var(--bg2)}
.mc-load{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:8px;color:var(--t3);font-weight:700;font-size:13px;pointer-events:none;z-index:600}
@media (max-width:860px){
  .mc-grid{grid-template-columns:1fr}
  .mc-mid{padding-top:0;flex-direction:row;justify-content:center;flex-wrap:wrap}
}
`;

function PeriodPick({ value, onChange, MO, period }){
  return (<>
    <select value={value.key} onChange={e => onChange({ ...value, key: e.target.value, from: value.from ?? period.idx[0], to: value.to ?? period.idx[period.idx.length - 1] })}>
      {PERIODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
    {value.key === 'custom' && (<>
      <select value={value.from ?? period.idx[0]} onChange={e => onChange({ ...value, from: +e.target.value })}>{MO.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
      <span style={{ fontSize: 12, color: 'var(--t3)' }}>to</span>
      <select value={value.to ?? period.idx[period.idx.length - 1]} onChange={e => onChange({ ...value, to: +e.target.value })}>{MO.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
    </>)}
    <b>{period.label}</b>
  </>);
}

export default function MapCompare({ dealers = [], users = {}, MO, selectedMonthIdx, sm = '', initialPath = [], onClose }){
  const [path, setPath] = useState(initialPath.slice(0, 2));
  const [pA, setPA] = useState({ key: 'prev', from: null, to: null });
  const [pB, setPB] = useState({ key: 'month', from: null, to: null });
  const perA = useMemo(() => periodRange(pA.key, selectedMonthIdx, MO, pA.from, pA.to), [pA, selectedMonthIdx, MO]);
  const perB = useMemo(() => periodRange(pB.key, selectedMonthIdx, MO, pB.from, pB.to), [pB, selectedMonthIdx, MO]);
  const [geo, setGeo] = useState({ states: null, districts: {}, talukas: {} });
  const level = path.length === 0 ? 'india' : path.length === 1 ? 'state' : 'district';

  useEffect(() => { const k = e => { if(e.key === 'Escape') onClose?.(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  useEffect(() => { loadStates().then(g => setGeo(x => ({ ...x, states: g }))).catch(() => {}); }, []);
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
    return t.length ? t : dg.features.filter(f => f.properties.name === path[1]);
  }, [level, geo, path]);
  const assigned = useMemo(() => assignDealers({ dealers, level, state: path[0], district: path[1], statesGeo: geo.states, districtsGeo: geo.districts[path[0]], talukasGeo: geo.talukas[path[0]] }), [dealers, level, path, geo]);

  const regions = useMemo(() => {
    const out = new Map();
    for(const f of features || []){
      const name = f.properties.name;
      const ds = assigned.by.get(name) || (level === 'district' && features.length === 1 ? assigned.scope : []);
      const r = { name, f, a: 0, b: 0, ba: 0, bb: 0, n: ds.length };
      for(const d of ds){ const a = sumMonths(d, perA.idx, sm), b = sumMonths(d, perB.idx, sm); r.a += a; r.b += b; if(a > 0) r.ba++; if(b > 0) r.bb++; }
      out.set(name, r);
    }
    return out;
  }, [features, assigned, perA, perB, sm, level]);
  const totals = useMemo(() => {
    const t = { a: 0, b: 0, ba: 0, bb: 0, n: assigned.scope.length };
    for(const d of assigned.scope){ const a = sumMonths(d, perA.idx, sm), b = sumMonths(d, perB.idx, sm); t.a += a; t.b += b; if(a > 0) t.ba++; if(b > 0) t.bb++; }
    return t;
  }, [assigned, perA, perB, sm]);
  // one scale for both maps, so the same shade means the same qty on either side
  const colour = useMemo(() => makeColour([...regions.values()].flatMap(r => [r.a, r.b])), [regions]);

  // ── two Leaflet maps that move together ──
  const elA = useRef(null), elB = useRef(null);
  const maps = useRef({ A: null, B: null }), layers = useRef({ A: [], B: [] }), syncing = useRef(false), drawnKey = useRef(null);
  const [ready, setReady] = useState(0);
  const live = useRef({}); live.current = { regions, level, path };
  useEffect(() => {
    let dead = false;
    loadLeaflet().then(L => {
      if(dead || !elA.current || !elB.current) return;
      const make = el => {
        const m = L.map(el, { zoomControl: false, attributionControl: false, zoomSnap: 0, zoomDelta: 0.5, wheelPxPerZoomLevel: 120, minZoom: 3, maxZoom: 13, renderer: L.svg({ padding: 0.8 }) });
        m.setView([22, 80], 4.2, { animate: false });
        m.createPane('biLabels'); m.getPane('biLabels').style.zIndex = 450; m.getPane('biLabels').style.pointerEvents = 'none';
        return m;
      };
      const A = make(elA.current), B = make(elB.current);
      const link = (src, dst) => src.on('move', () => {
        if(syncing.current) return;
        syncing.current = true; dst.setView(src.getCenter(), src.getZoom(), { animate: false }); syncing.current = false;
      });
      link(A, B); link(B, A);
      maps.current = { A, B };
      setTimeout(() => { A.invalidateSize(); B.invalidateSize(); }, 60);
      setReady(n => n + 1);
    });
    return () => { dead = true; const { A, B } = maps.current; A?.remove(); B?.remove(); maps.current = { A: null, B: null }; layers.current = { A: [], B: [] }; drawnKey.current = null; };
  }, []);

  useEffect(() => {
    const L = window.L, { A, B } = maps.current;
    if(!ready || !L || !A || !B || !features) return;
    const key = path.join('>');
    const newLevel = drawnKey.current !== key;
    drawnKey.current = key;
    const draw = (map, side, per) => {
      layers.current[side].forEach(l => { try { l.remove(); } catch { /* gone */ } });
      layers.current[side] = [];
      const val = r => r ? (side === 'A' ? r.a : r.b) : 0;
      const lyr = L.geoJSON({ type: 'FeatureCollection', features }, {
        style: f => ({ className: 'bi-path', color: '#7d887d', weight: 0.7, fillColor: colour(val(regions.get(f.properties.name))), fillOpacity: 1, opacity: 1 }),
        onEachFeature: (f, layer) => {
          const nm = f.properties.name;
          layer.bindTooltip(() => {
            const r = live.current.regions.get(nm), v = val(r), d = (r?.b || 0) - (r?.a || 0);
            return '<div class="bi-tip-t">' + nm + '</div><div><span>' + per.label + ' :</span> <b class="q">Q : ' + fmtIN(v) + '</b></div>' +
              (r ? '<div><span>Customers :</span> ' + r.n + ' · billed ' + (side === 'A' ? r.ba : r.bb) + '</div>' : '') +
              '<div><span>Change :</span> <b class="' + (d > 0 ? 'up' : d < 0 ? 'dn' : '') + '">' + signedIN(d) + '</b></div>' +
              (live.current.level !== 'district' ? '<div class="bi-tip-h">Click to open ' + (live.current.level === 'india' ? 'districts' : 'talukas') + '</div>' : '');
          }, { sticky: true, direction: 'top', offset: [0, -8], className: 'bi-tip', opacity: 1 });
          layer.on('mouseover', () => { layer.setStyle({ weight: 2.6, color: '#1b5e20' }); layer.bringToFront(); });
          layer.on('mouseout', () => layer.setStyle({ weight: 0.7, color: '#7d887d' }));
          layer.on('click', () => {
            const { level: lv, path: P } = live.current;
            if(lv === 'india') setPath([nm]); else if(lv === 'state') setPath([P[0], nm]);
          });
        },
      }).addTo(map);
      layers.current[side].push(lyr);
      ensureDefs(map);
      for(const f of features){
        const p = labelPoint(f); if(!p) continue;
        const v = val(regions.get(f.properties.name));
        const m = L.marker(p, { pane: 'biLabels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'bi-lbl', iconSize: [0, 0], html: '<div class="bi-lbl-in"><b>' + fmtIN(v) + '</b></div>' }) }).addTo(map);
        layers.current[side].push(m);
      }
      return lyr;
    };
    draw(A, 'A', perA); draw(B, 'B', perB);
    if(newLevel){
      const b = boundsOf(features);
      if(b){ syncing.current = true; A.flyToBounds(b, { padding: [12, 12], duration: 0.8 }); B.flyToBounds(b, { padding: [12, 12], duration: 0.8 }); setTimeout(() => { syncing.current = false; }, 900); }
    }
  }, [ready, features, regions, colour, perA, perB, path]);

  const diff = totals.b - totals.a, diffPct = totals.a ? Math.round(diff / totals.a * 100) : null;
  const rows = [...regions.values()].filter(r => r.a || r.b).sort((x, y) => (y.b - y.a) - (x.b - x.a));
  const unit = level === 'india' ? 'State' : level === 'state' ? 'District' : 'Taluka';

  return (
    <div className="mc-ov bi-page">
      <style>{CSS}</style>
      <div className="mc-top">
        <div className="mc-title"><GitCompare size={17} color="#2563eb"/> Map Compare View</div>
        <div className="mc-crumb">
          <Globe size={13}/>
          {path.length ? <a onClick={() => setPath([])}>India</a> : <b>India</b>}
          {path[0] && <><ChevronRight size={12}/>{path[1] ? <a onClick={() => setPath([path[0]])}>{path[0]}</a> : <b>{path[0]}</b>}</>}
          {path[1] && <><ChevronRight size={12}/><b>{path[1]}</b></>}
          {path.length > 0 && <button className="btn" style={{ fontSize: 11, padding: '3px 8px', marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 3 }} onClick={() => setPath(path.slice(0, -1))}><ArrowLeft size={11}/> Back</button>}
        </div>
        {sm && <span style={{ fontSize: 12, color: 'var(--t3)' }}>Salesperson: <b style={{ color: 'var(--t1)' }}>{users?.[sm]?.name || sm}</b></span>}
        <button className="mc-x" onClick={onClose} title="Close"><X size={18}/></button>
      </div>

      <div className="mc-grid">
        {[['A', pA, setPA, perA, totals.a, totals.ba, elA], ['B', pB, setPB, perB, totals.b, totals.bb, elB]].map(([side, p, setP, per, val, billed, el], i) => (
          <React.Fragment key={side}>
            {i === 1 && (
              <div className="mc-mid">
                <div className="mc-chg"><span>Change</span>
                  <b style={{ color: diff >= 0 ? 'var(--grn)' : 'var(--red)' }}>{signedIN(diff)}</b>
                  {diffPct !== null && <div style={{ fontSize: 12, fontWeight: 700, color: diff >= 0 ? 'var(--grn)' : 'var(--red)' }}>{diffPct > 0 ? '+' : ''}{diffPct}%</div>}
                </div>
                <div className="mc-chg"><span>Billed customers</span><b style={{ color: totals.bb >= totals.ba ? 'var(--grn)' : 'var(--red)' }}>{signedIN(totals.bb - totals.ba)}</b></div>
              </div>
            )}
            <div className="mc-pane">
              <div className="mc-pane-h"><PeriodPick value={p} onChange={setP} MO={MO} period={per}/></div>
              <div className="mc-kpis">
                <div><span>Qty</span><b style={{ color: 'var(--grn)' }}>{fmtIN(val)}</b></div>
                <div><span>Billed</span><b>{billed}</b></div>
                <div><span>Customers</span><b>{totals.n}</b></div>
              </div>
              <div className="mc-mapwrap">
                <div ref={el} className="mc-map"/>
                {(!ready || !features) && <div className="mc-load"><Loader2 size={16} className="spin"/> Loading map…</div>}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="mc-tbl">
        <div className="mc-tbl-h">{level === 'india' ? 'States' : level === 'state' ? 'Districts of ' + path[0] : 'Talukas of ' + path[1]} · {perA.label} vs {perB.label}</div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead><tr><th>{unit}</th><th>{perA.label}</th><th>{perB.label}</th><th>Change</th><th>%</th><th>Billed</th></tr></thead>
            <tbody>
              {rows.map(r => {
                const d = r.b - r.a, pc = r.a ? Math.round(d / r.a * 100) : null;
                const canOpen = level !== 'district';
                return (
                  <tr key={r.name} className={canOpen ? 'click' : ''} onClick={canOpen ? () => setPath(level === 'india' ? [r.name] : [path[0], r.name]) : undefined}>
                    <td style={{ fontWeight: 700, color: 'var(--t1)' }}>{r.name}</td>
                    <td>{fmtIN(r.a)}</td><td>{fmtIN(r.b)}</td>
                    <td style={{ fontWeight: 800, color: d > 0 ? 'var(--grn)' : d < 0 ? 'var(--red)' : 'var(--t3)' }}>{d ? signedIN(d) : '—'}</td>
                    <td style={{ color: d > 0 ? 'var(--grn)' : d < 0 ? 'var(--red)' : 'var(--t3)' }}>{pc === null ? '—' : (pc > 0 ? '+' : '') + pc + '%'}</td>
                    <td>{r.ba} → {r.bb}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--t3)', padding: 18 }}>No sales in either period.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
