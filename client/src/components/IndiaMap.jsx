
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronDown, Globe, Layers, Hash, Type, TrendingUp, Award, ArrowLeft, MapPin, Sun, Map as MapIcon, CalendarRange, GitCompare, Shapes, Search } from 'lucide-react';
import { MO as MO_CONST, DEALER_TYPES } from '../constants';
import { StatusBadge } from './UI';   // per-status colours + palette-aware solid fill
import { pct, spct, pclr, monthTarget } from '../utils';
import { useMonth } from '../context';
import { PageHead } from '../collections/ui';

// ────────────────────────────────────────────────────────────────────────────
// State name aliases
// ────────────────────────────────────────────────────────────────────────────
const STATE_ALIASES = {
  'j&k':'Jammu and Kashmir','jammu and kashmir':'Jammu and Kashmir','jammu':'Jammu and Kashmir','kashmir':'Jammu and Kashmir','ladakh':'Ladakh',
  'hp':'Himachal Pradesh','himachal':'Himachal Pradesh',
  'up':'Uttar Pradesh','u.p.':'Uttar Pradesh',
  'mp':'Madhya Pradesh','m.p.':'Madhya Pradesh',
  'ap':'Andhra Pradesh','andhra':'Andhra Pradesh',
  'tn':'Tamil Nadu','tamilnadu':'Tamil Nadu','tamil':'Tamil Nadu','tamil nadu':'Tamil Nadu',
  'wb':'West Bengal','bengal':'West Bengal','west bengal':'West Bengal',
  'uk':'Uttarakhand','uttaranchal':'Uttarakhand','uttarakhand':'Uttarakhand',
  'orissa':'Odisha','odisha':'Odisha',
  'cg':'Chhattisgarh','chattisgarh':'Chhattisgarh','chhattisgarh':'Chhattisgarh',
  'ts':'Telangana','telangana':'Telangana',
  'karnataka':'Karnataka','karnatka':'Karnataka',
  'maharashtra':'Maharashtra',
  'gujarat':'Gujarat','gj':'Gujarat',
  'rajasthan':'Rajasthan','raj':'Rajasthan',
  'punjab':'Punjab','pb':'Punjab',
  'haryana':'Haryana','hr':'Haryana',
  'delhi':'Delhi','new delhi':'Delhi','ncr':'Delhi','nd':'Delhi','nct of delhi':'Delhi',
  'goa':'Goa',
  'kerala':'Kerala','kl':'Kerala',
  'assam':'Assam','bihar':'Bihar','br':'Bihar',
  'jharkhand':'Jharkhand','jh':'Jharkhand',
  'sikkim':'Sikkim','nagaland':'Nagaland','manipur':'Manipur','mizoram':'Mizoram','tripura':'Tripura','meghalaya':'Meghalaya',
  'arunachal':'Arunachal Pradesh','arunachal pradesh':'Arunachal Pradesh',
  'puducherry':'Puducherry','pondicherry':'Puducherry',
  'andaman':'Andaman and Nicobar Islands','andaman and nicobar':'Andaman and Nicobar Islands','andaman and nicobar islands':'Andaman and Nicobar Islands',
  'lakshadweep':'Lakshadweep','chandigarh':'Chandigarh',
  'dadra and nagar haveli':'Dadra and Nagar Haveli and Daman and Diu','daman and diu':'Dadra and Nagar Haveli and Daman and Diu',
};

export const normalizeState = s => {
  if(!s) return null;
  const l = String(s).toLowerCase().trim();
  return STATE_ALIASES[l] || String(s).trim();
};

// ── HUBS — regional groupings of STATES. The Map View hub filter scopes all
// data (map, lists, summary) to the states its hub contains. Add more hubs and
// states here as needed — e.g. 'North Hub': ['Delhi','Punjab','Haryana'].
const HUBS = {
  'Karnataka Hub':  ['Karnataka'],
  'Tamil Nadu Hub': ['Tamil Nadu'],
  'Kerala Hub':     ['Kerala'],
};
const hubStateSet = (hub) => new Set((HUBS[hub] || []).map(s => String(s).toLowerCase().trim()));

export const getFeatureStateName = feature => {
  const p = feature?.properties || {};
  const raw = p.ST_NM || p.st_nm || p.NAME_1 || p.name || p.NAME || p.state || p.State || p.STATE || p.DISTRICT;
  return normalizeState(raw);
};

// ────────────────────────────────────────────────────────────────────────────
// City coordinates (130+ major Indian cities)
// ────────────────────────────────────────────────────────────────────────────
// ── Pincode → coordinate lookup ─────────────────────────────────────────
// Nominatim (OpenStreetMap) resolves an Indian PIN to a lat/lng. Results
// are cached permanently in localStorage so we hit the API only once per
// PIN in the app's lifetime. Nominatim's usage policy is ≤1 req/sec, so
// requests are serialised through a tiny queue.
const PIN_CACHE_KEY = 'stp_pincode_coords_v1';
const _pinCache = (() => {
  try { return JSON.parse(localStorage.getItem(PIN_CACHE_KEY) || '{}'); }
  catch { return {}; }
})();
const _persistPinCache = () => {
  try { localStorage.setItem(PIN_CACHE_KEY, JSON.stringify(_pinCache)); } catch {}
};
let _pinQueue = Promise.resolve();
const _geocodePin = (pin) => {
  if (_pinCache[pin] !== undefined) return Promise.resolve(_pinCache[pin]);
  _pinQueue = _pinQueue.then(async () => {
    if (_pinCache[pin] !== undefined) return;
    try {
      await new Promise(r => setTimeout(r, 1100));  // ≤1 req/sec
      const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=in&postalcode=${encodeURIComponent(pin)}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const arr = await res.json();
      if (Array.isArray(arr) && arr.length && arr[0].lat && arr[0].lon) {
        const a = arr[0].address || {};
        // Pick the most specific locality-ish name Nominatim returns.
        const area = a.suburb || a.neighbourhood || a.city_district
                  || a.town || a.village || a.city || a.county || '';
        _pinCache[pin] = {
          lat: parseFloat(arr[0].lat),
          lng: parseFloat(arr[0].lon),
          area: String(area).trim(),
        };
      } else {
        _pinCache[pin] = null;
      }
      _persistPinCache();
    } catch {
      _pinCache[pin] = null;
    }
  });
  return _pinQueue.then(() => _pinCache[pin]);
};
// Reads the current cache value; returns undefined when the PIN hasn't
// been fetched yet, null when Nominatim couldn't resolve it, or
// {lat,lng,area}.
const _pinCoord = (pin) => _pinCache[pin];

const CITY_COORDS = {
  // Andhra Pradesh
  'visakhapatnam':[17.686,83.218],'vijayawada':[16.506,80.648],'guntur':[16.300,80.437],
  'tirupati':[13.628,79.419],'kakinada':[16.989,82.247],'rajahmundry':[17.005,81.804],
  'nellore':[14.443,79.987],'kurnool':[15.829,78.037],'anantapur':[14.681,77.600],
  // Assam
  'guwahati':[26.144,91.736],'dibrugarh':[27.472,94.911],'silchar':[24.834,92.797],
  // Bihar
  'patna':[25.594,85.138],'gaya':[24.796,85.003],'muzaffarpur':[26.122,85.391],
  'bhagalpur':[25.245,86.971],'darbhanga':[26.157,85.897],
  // Chhattisgarh
  'raipur':[21.251,81.633],'bhilai':[21.218,81.379],'bilaspur':[22.080,82.155],
  // Delhi
  'delhi':[28.679,77.213],'new delhi':[28.613,77.209],
  // Goa
  'panaji':[15.495,73.827],'margao':[15.288,73.962],'vasco':[15.396,73.811],
  // Gujarat
  'ahmedabad':[23.023,72.572],'surat':[21.170,72.831],'vadodara':[22.307,73.181],
  'rajkot':[22.303,70.802],'bhavnagar':[21.764,72.151],'jamnagar':[22.470,70.057],
  'gandhinagar':[23.223,72.650],'anand':[22.563,72.928],'mehsana':[23.598,72.395],
  // Haryana
  'gurugram':[28.459,77.026],'gurgaon':[28.459,77.026],'faridabad':[28.408,77.317],
  'panipat':[29.391,76.963],'ambala':[30.378,76.778],'karnal':[29.685,76.989],
  'hisar':[29.149,75.722],'rohtak':[28.895,76.606],'sonipat':[28.992,77.022],
  // Himachal Pradesh
  'shimla':[31.105,77.173],'dharamshala':[32.219,76.323],'manali':[32.244,77.189],
  // Jammu and Kashmir
  'srinagar':[34.084,74.797],'jammu':[32.728,74.857],
  // Jharkhand
  'ranchi':[23.344,85.310],'jamshedpur':[22.802,86.183],'dhanbad':[23.795,86.430],
  'bokaro':[23.669,86.151],
  // Karnataka
  'bangalore':[12.972,77.594],'bengaluru':[12.972,77.594],'mysore':[12.295,76.639],
  'mysuru':[12.295,76.639],'mangalore':[12.914,74.856],'hubli':[15.365,75.124],
  'dharwad':[15.458,75.008],'belgaum':[15.852,74.498],'gulbarga':[17.329,76.834],
  'bellary':[15.139,76.922],'bijapur':[16.828,75.715],
  // Kerala
  'thiruvananthapuram':[8.524,76.936],'trivandrum':[8.524,76.936],
  'kochi':[9.931,76.267],'cochin':[9.931,76.267],'kozhikode':[11.258,75.781],
  'kollam':[8.893,76.614],'thrissur':[10.527,76.214],'kannur':[11.874,75.370],
  // Madhya Pradesh
  'bhopal':[23.259,77.413],'indore':[22.719,75.857],'gwalior':[26.228,78.182],
  'jabalpur':[23.181,79.987],'ujjain':[23.179,75.785],'sagar':[23.838,78.738],
  // Maharashtra
  'mumbai':[19.076,72.877],'pune':[18.520,73.856],'nagpur':[21.146,79.089],
  'nashik':[19.990,73.791],'aurangabad':[19.877,75.324],'solapur':[17.687,75.904],
  'kolhapur':[16.706,74.243],'thane':[19.218,72.978],'navi mumbai':[19.033,73.030],
  'nanded':[19.160,77.314],'amravati':[20.937,77.779],'jalgaon':[21.005,75.564],
  // Odisha
  'bhubaneswar':[20.296,85.825],'cuttack':[20.462,85.879],'rourkela':[22.260,84.854],
  // Punjab
  'ludhiana':[30.901,75.857],'amritsar':[31.634,74.873],'jalandhar':[31.326,75.576],
  'patiala':[30.339,76.386],'bathinda':[30.211,74.945],
  // Rajasthan
  'jaipur':[26.912,75.787],'jodhpur':[26.295,73.017],'udaipur':[24.585,73.713],
  'kota':[25.182,75.866],'bikaner':[28.022,73.312],'ajmer':[26.449,74.638],
  'alwar':[27.566,76.617],
  // Tamil Nadu
  'chennai':[13.083,80.270],'coimbatore':[11.017,76.955],'madurai':[9.925,78.120],
  'tiruchirappalli':[10.790,78.704],'salem':[11.664,78.146],'tirunelveli':[8.713,77.756],
  'tiruppur':[11.108,77.341],'vellore':[12.916,79.132],'erode':[11.341,77.717],
  // Telangana
  'hyderabad':[17.385,78.487],'warangal':[17.978,79.598],'nizamabad':[18.672,78.094],
  'karimnagar':[18.434,79.131],
  // Tripura
  'agartala':[23.832,91.286],
  // Uttar Pradesh
  'lucknow':[26.847,80.947],'kanpur':[26.449,80.331],'agra':[27.176,78.008],
  'varanasi':[25.318,83.004],'meerut':[28.984,77.706],'allahabad':[25.435,81.846],
  'prayagraj':[25.435,81.846],'bareilly':[28.347,79.420],'aligarh':[27.882,78.082],
  'moradabad':[28.839,78.776],'saharanpur':[29.968,77.546],'noida':[28.535,77.391],
  'ghaziabad':[28.669,77.453],'gorakhpur':[26.760,83.374],'mathura':[27.492,77.673],
  // Uttarakhand
  'dehradun':[30.316,78.032],'haridwar':[29.946,78.164],'roorkee':[29.866,77.892],
  // West Bengal
  'kolkata':[22.563,88.363],'howrah':[22.586,88.270],'durgapur':[23.480,87.320],
  'asansol':[23.673,86.952],'siliguri':[26.726,88.395],
  // Chandigarh UT
  'chandigarh':[30.733,76.779],
  // Pondicherry
  'puducherry':[11.913,79.812],'pondicherry':[11.913,79.812],
};

// ────────────────────────────────────────────────────────────────────────────
// DARK theme tokens
// ────────────────────────────────────────────────────────────────────────────
const T = {
  bg0:   '#08081a',   // page-level dark
  bg1:   '#0c0c1e',   // card background
  bg2:   '#11122a',   // toolbar / inset
  bg3:   '#161836',   // KPI inner cell
  bd1:   '#1e1e38',   // soft border
  bd2:   '#252548',   // stronger border
  t1:    '#e2e0f0',   // primary text
  t2:    '#a5a4b8',   // secondary text
  t3:    '#6c6b85',   // muted
  acc:   '#22c55e',   // green primary
  accD:  'var(--grn)',   // green dark
  accBg: '#0e2a18',   // soft green tint
  hot:   '#ef4444',   // selected city / lost
  hot2:  '#f59e0b',   // star
  blue:  '#3b82f6',
  cyan:  '#0ea5e9',
};

// ────────────────────────────────────────────────────────────────────────────
// Follow the app theme.
//
// The values above are only DEFAULTS. syncTokens() re-reads the app's CSS
// variables and mutates T in place, so the map matches whichever theme/palette
// is active instead of always rendering dark.
//
// Why resolve to literal colours rather than just writing var(--bg1) into T:
// Leaflet styles polygons through SVG *presentation attributes*
// (stroke / fill), and those do not accept var(). Resolving here keeps one
// token object valid for both React inline styles and Leaflet paths.
// ────────────────────────────────────────────────────────────────────────────
function syncTokens(){
  if(typeof document === 'undefined' || typeof getComputedStyle !== 'function') return false;
  let cs;
  try { cs = getComputedStyle(document.documentElement); } catch { return false; }
  const v = (name, fallback) => {
    const x = (cs.getPropertyValue(name) || '').trim();
    return x || fallback;
  };
  const next = {
    bg0: v('--bg',  '#08081a'), bg1: v('--bg1','#0c0c1e'), bg2: v('--bg2','#11122a'),
    bg3: v('--bg3', '#161836'), bd1: v('--b1', '#1e1e38'), bd2: v('--b2', '#252548'),
    t1:  v('--t1',  '#e2e0f0'), t2:  v('--t2', '#a5a4b8'), t3:  v('--t3', '#6c6b85'),
    acc: v('--grn', '#22c55e'), hot: v('--red','#ef4444'), hot2:v('--yel','#f59e0b'),
    blue:v('--acc', '#3b82f6'),
  };
  // The accent tint / border used by active toolbar buttons and status pills.
  // Derived from the resolved accent as an ALPHA wash so it sits correctly on
  // whatever surface is behind it — a fixed dark green (#0e2a18) was the
  // reason those controls stayed dark on light themes.
  next.accD  = next.acc;
  next.accBg = next.acc + '26';
  let changed = false;
  for(const k in next){ if(T[k] !== next[k]){ T[k] = next[k]; changed = true; } }
  return changed;
}

// True when the active theme uses light surfaces — drives the default basemap
// and the label/tooltip treatment.
function themeIsLight(){
  const hex = String(T.bg1 || '').trim();
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if(!m) return false;
  let h = m[1];
  if(h.length === 3) h = h.split('').map(c => c + c).join('');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  return (0.2126*r + 0.7152*g + 0.0722*b) / 255 > 0.55;
}

// Diverging RED → GREEN heatmap (BI style): low/zero sales = red/salmon,
// high sales = green, with a neutral light band in the middle.
const GREEN_SCALE = ['#e79a9a','#ecb3ad','#e7d7bf','#dbe8cf','#bcdcb0','#95cc8c','#6fbf6f'];
export const colorForRatio = ratio => {
  if(!ratio || ratio <= 0) return '#e79a9a';   // no sales → red / salmon
  if(ratio <= 0.15) return '#ecb3ad';          // very low → light red
  if(ratio <= 0.35) return '#e7d7bf';          // low-mid → neutral
  if(ratio <= 0.55) return '#dbe8cf';          // mid → very light green
  if(ratio <= 0.70) return '#bcdcb0';          // good → light green
  if(ratio <= 0.85) return '#95cc8c';          // high → green
  return '#6fbf6f';                            // top → strong green
};

export const fmtIN = n => {
  if(n === null || n === undefined || isNaN(n)) return '0';
  const num = Number(n);
  if(num === 0) return '0';
  return num.toLocaleString('en-IN');
};

export const shortName = name => {
  if(!name) return '';
  const shorts = {
    'Jammu and Kashmir':'J&K','Himachal Pradesh':'H.P.','Uttar Pradesh':'U.P.',
    'Madhya Pradesh':'M.P.','Andhra Pradesh':'A.P.','Tamil Nadu':'T.N.',
    'West Bengal':'W.B.','Uttarakhand':'UK','Chhattisgarh':'C.G.',
    'Arunachal Pradesh':'Arunachal','Andaman and Nicobar Islands':'A&N',
    'Dadra and Nagar Haveli and Daman and Diu':'D&NH','Telangana':'T.S.',
  };
  return shorts[name] || name;
};

// ── Period (duration) ────────────────────────────────────────────────────
// Every figure on the map is a sum over a run of months. The presets count
// back from the month chosen at the top of the app; Trend compares the
// period with the same number of months just before it.
export const PERIODS = [
  ['month','Selected month'], ['prev','Previous month'], ['3m','Last 3 months'], ['6m','Last 6 months'],
  ['quarter','This quarter'], ['fy','Financial year to date'], ['custom','Custom range…'],
];
const MON3 = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const monthNum = lbl => MON3.indexOf(String(lbl||'').slice(0,3).toLowerCase()) + 1;   // 1–12, 0 = unknown
const spanLabel = (MO, idx) => !idx.length ? '' : idx.length === 1 ? MO[idx[0]] : MO[idx[0]] + ' – ' + MO[idx[idx.length-1]];
export function periodRange(key, sel, MO, from, to){
  const n = MO.length;
  sel = Math.max(0, Math.min(n - 1, sel));
  let a = sel, b = sel;
  const m = monthNum(MO[sel]);
  if(key === 'prev')          { a = b = sel - 1; }
  else if(key === '3m')       { a = sel - 2; }
  else if(key === '6m')       { a = sel - 5; }
  else if(key === 'quarter')  { a = m ? sel - ((m - 1) % 3) : sel; }
  else if(key === 'fy')       { a = m ? sel - ((m + 12 - 4) % 12) : sel; }   // April starts the year
  else if(key === 'custom')   { a = from ?? sel; b = to ?? sel; if(a > b) [a, b] = [b, a]; }
  a = Math.max(0, Math.min(n - 1, a)); b = Math.max(a, Math.min(n - 1, b));
  const idx = []; for(let i = a; i <= b; i++) idx.push(i);
  const prev = []; for(let i = a - idx.length; i < a; i++) if(i >= 0) prev.push(i);
  return { idx, prev, prevFull: prev.length === idx.length, label: spanLabel(MO, idx), prevLabel: spanLabel(MO, prev), sig: a + ':' + b };
}
// Sum one dealer's months over a period. With a salesman chosen, only the
// months that salesman owned the dealer count (a handed-over dealer's older
// months were someone else's sales).
export const sumMonths = (d, idx, sm) => {
  let t = 0;
  for(const i of idx){
    if(sm && (d.monthSalesman?.[i] || d.salesman) !== sm) continue;
    t += Number(d.months?.[i]) || 0;
  }
  return t;
};
// Trend colours: red = down, green = up, grey = no change.
const UP_SCALE   = ['#dbe8cf','#bcdcb0','#95cc8c','#6fbf6f','#4ea65a'];
const DOWN_SCALE = ['#f3d6d2','#ecb3ad','#e79a9a','#de7b7b','#cf5b5b'];
export const colorForGrowth = (diff, maxAbs) => {
  if(!diff) return '#e5e7eb';
  const r = Math.min(1, Math.abs(diff) / Math.max(1, maxAbs));
  const k = Math.min(4, Math.floor(r * 5));
  return diff > 0 ? UP_SCALE[k] : DOWN_SCALE[k];
};
export const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmtIN(Math.abs(n));
// Which KPI bucket a dealer falls in (from the calculated tier).
const bucketOf = d => {
  const s = (d.perfStatus || '').toUpperCase();
  if(s === 'TOP PERFORMER' || s === 'PRIORITY ACCOUNT') return 'star';
  if(s === 'DEAD')               return 'lost';
  if(s.includes('INACTIVE'))     return 'inactive';
  return 'active';
};

// CSS for map labels + tooltips (DARK theme)
const MAP_CSS = `
  .stp-mapview { font-family: Inter, system-ui, sans-serif; }
  /* Side-by-side: map on the left, data panels on the right (stacks on mobile) */
  .stp-split { display:grid; grid-template-columns:1fr; gap:10px; align-items:start; }
  .stp-right-col { display:flex; flex-direction:column; gap:10px; min-width:0; }
  @media (min-width: 1000px) {
    .stp-split { grid-template-columns: minmax(0,1fr) 400px; }
    /* Right column flows to its full height (no cropping) — the page scrolls. */
  }
  .stp-period { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
  .stp-kpi-click { transition: border-color .15s, transform .15s; }
  .stp-kpi-click:hover { border-color: var(--acc) !important; transform: translateY(-1px); }
  .stp-legend-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:10px 14px; border-top:1px solid var(--b1); }
  .stp-legend { display:flex; align-items:center; gap:3px; flex-wrap:wrap; font-size:11px; color:var(--t3); font-weight:700; flex:1; min-width:0; }
  .stp-legend i { width:22px; height:10px; border-radius:2px; display:inline-block; }
  .stp-legend span { margin:0 4px; }
  .stp-legend em { font-style:normal; font-weight:500; margin-left:8px; }
  .stp-compare-btn { display:inline-flex; align-items:center; gap:6px; font-size:12px; }
  .stp-terr { padding:12px !important; }
  .stp-terr-empty { font-size:12px; color:var(--t3); line-height:1.5; padding:4px 2px; }
  .stp-terr-chips { display:flex; flex-wrap:wrap; gap:6px; }
  .stp-terr-chip { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:700; color:var(--t1);
    padding:3px 4px 3px 10px; border-radius:20px; border:1.5px dashed #2563eb; background:color-mix(in srgb,#2563eb 8%,transparent); }
  .stp-terr-chip small { font-size:9.5px; color:var(--t3); font-weight:600; }
  .stp-terr-chip b { color:var(--grn); }
  .stp-terr-chip button { background:none; border:none; color:var(--t3); cursor:pointer; display:flex; padding:2px; }
  .stp-terr-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-top:10px; }
  .stp-terr-kpis div { background:var(--bg2); border:1px solid var(--b1); border-radius:8px; padding:6px 8px; min-width:0; }
  .stp-terr-kpis span { display:block; font-size:9.5px; font-weight:800; letter-spacing:.05em; text-transform:uppercase; color:var(--t3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .stp-terr-kpis b { font-size:14px; color:var(--t1); }
  .stp-list-ov { position:fixed; inset:0; background:rgba(6,6,16,.6); backdrop-filter:blur(3px); z-index:1900; display:flex; align-items:center; justify-content:center; padding:16px; }
  .stp-list { background:var(--bg1); border:1px solid var(--b1); border-radius:16px; width:900px; max-width:100%; max-height:88vh; display:flex; flex-direction:column; box-shadow:0 24px 60px rgba(0,0,0,.4); }
  .stp-list-head { display:flex; align-items:flex-start; gap:10px; padding:14px 16px 8px; }
  .stp-list-title { font-size:15px; font-weight:800; color:var(--t1); }
  .stp-list-sub { font-size:11.5px; color:var(--t3); margin-top:2px; }
  .stp-x { background:none; border:none; color:var(--t3); cursor:pointer; }
  .stp-list-search { display:flex; align-items:center; gap:8px; margin:0 16px 8px; padding:7px 10px; border:1px solid var(--b2); border-radius:10px; background:var(--bg2); color:var(--t3); }
  .stp-list-search input { flex:1; border:none; outline:none; background:transparent; color:var(--t1); font-size:13px; }
  .stp-list-body { overflow:auto; border-top:1px solid var(--b1); }
  .stp-list-body table { width:100%; border-collapse:collapse; font-size:12.5px; }
  .stp-list-body th { position:sticky; top:0; background:var(--bg2); text-align:left; font-size:10.5px; text-transform:uppercase; letter-spacing:.05em; color:var(--t3); padding:8px 10px; z-index:1; }
  .stp-list-body td { padding:8px 10px; border-bottom:1px solid var(--b1); color:var(--t2); white-space:nowrap; }
  .stp-list-body tr { cursor:pointer; }
  .stp-list-body tbody tr:hover { background:var(--bg2); }
  .stp-list-body .r { text-align:right; }
  .stp-list-body .nm { font-weight:700; color:var(--t1); white-space:normal; }
  .stp-list-body .stpl-narrow { display:none; font-size:10.5px; color:var(--t3); }
  @media (max-width: 640px) {
    .stp-list-body .stpl-wide { display:none; }
    .stp-list-body .stpl-narrow { display:block; }
    .stp-terr-kpis { grid-template-columns:repeat(2,1fr); }
    .stp-compare-btn { width:100%; justify-content:center; }
  }
  .stp-state-label, .stp-city-label {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    pointer-events: none;
    transition: opacity .25s;
  }
  .stp-state-label::before, .stp-city-label::before { display:none !important; }
  .stp-state-label-inner {
    color: #e2e0f0;
    font-size: 9px;
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
    text-shadow: none;
    white-space: nowrap;
  }
  .stp-state-label-inner .lbl-val {
    color: var(--grn); font-size: 9px; font-weight: 700;
    display: block; margin-top: 1px;
  }
  .stp-city-label-inner {
    color: #e2e0f0;
    font-size: 10px;
    font-weight: 700;
    text-align: center;
    line-height: 1.2;
    white-space: nowrap;
    padding: 2px 6px;
    background: rgba(12,12,30,.88);
    border-radius: 4px;
    border: 1px solid rgba(34,197,94,.45);
    box-shadow: 0 2px 8px rgba(0,0,0,.4);
  }
  .stp-city-label-inner .lbl-val {
    color: var(--grn); font-weight: 800; font-size: 10px;
    display: block; margin-top: 1px;
  }
  /* Light basemap: dark, clearly-readable labels on white */
  .stp-mapview.lightmap .stp-state-label-inner { color:#0f172a; text-shadow:none; font-weight:800; }
  .stp-mapview.lightmap .stp-state-label-inner .lbl-val { color:'+T.acc+'; }
  .stp-mapview.lightmap .stp-city-label-inner { background:#ffffff; color:#0f172a; border-color:'+T.acc+'; box-shadow:0 2px 8px rgba(0,0,0,.18); }
  .stp-mapview.lightmap .stp-city-label-inner .lbl-val { color:'+T.acc+'; }
  .stp-mapview.lightmap .leaflet-bar a { background-color:#ffffff !important; color:#0f172a !important; border-color:#d0d0d8 !important; }
  /* Dim the light basemap so it's soft, not blinding white */
  .stp-mapview.lightmap .leaflet-tile-pane { filter: brightness(0.88) contrast(1.03); }
  .stp-tooltip {
    background: #0c0c1e !important;
    border: 1px solid var(--grn) !important;
    border-radius: 8px !important;
    padding: 0 !important;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
  }
  .stp-tooltip::before { display:none !important; }
  /* Make Leaflet zoom control match dark theme */
  .leaflet-bar a, .leaflet-bar a:hover {
    background-color: #11122a !important;
    color: #e2e0f0 !important;
    border-bottom: 1px solid #1e1e38 !important;
  }
  .leaflet-bar a:hover { background-color: #1e1e38 !important; }
`;

// ────────────────────────────────────────────────────────────────────────────
// Reusable UI bits (dark)
// ────────────────────────────────────────────────────────────────────────────
const KpiCell = ({label, value, color=T.acc, sub, onClick}) => (
  <div onClick={onClick} title={onClick ? 'Tap to see the dealers' : undefined} className={onClick ? 'stp-kpi-click' : undefined} style={{
    background:T.bg3, borderRadius:6, padding:'8px 10px',
    border:'1px solid '+T.bd1, minWidth:0, textAlign:'center', cursor:onClick ? 'pointer' : undefined,
  }}>
    <div style={{fontSize:10, color:T.blue, fontWeight:700, marginBottom:4, letterSpacing:'.02em'}}>{label}</div>
    <div style={{fontSize:18, fontWeight:800, color, lineHeight:1.1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{value}</div>
    {sub && <div style={{fontSize:9, color:T.t3, marginTop:2}}>{sub}</div>}
  </div>
);

const KpiGroup = ({title, accent=T.blue, children}) => (
  <div className="card" style={{
    padding:'10px 12px',
  }}>
    <div style={{fontSize:11, fontWeight:700, color:accent, textAlign:'center', marginBottom:8, letterSpacing:'.03em'}}>{title}</div>
    <div style={{display:'grid', gap:6}}>{children}</div>
  </div>
);

const ToolBtn = ({active, onClick, icon:Icon, label, disabled=false}) => (
  <button onClick={onClick} disabled={disabled} style={{
    display:'flex', alignItems:'center', gap:4,
    background: active ? T.accBg : T.bg2,
    color: active ? T.acc : T.t2,
    border: '1px solid ' + (active ? T.accD : T.bd2),
    borderRadius: 6, padding:'5px 10px', fontSize:11, fontWeight:600,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    transition:'all .15s'
  }}>
    {Icon && <Icon size={12}/>} {label}
  </button>
);

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
// Initials avatar (design kit) — display only.
const Ini = ({ name, size }) => (
  <span className="ini" style={{'--h':String(name||'?').charCodeAt(0)*37%360, ...(size ? {width:size, height:size, fontSize:size<26?9.5:11, borderRadius:size<26?7:10} : {})}}>
    {String(name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}
  </span>
);

const MapCompare = React.lazy(() => import('./MapCompare'));

export default function IndiaMap({ dealers: allDealers=[], users={}, onOpenDealer }) {
  const { selectedMonthIdx, MO: ctxMO } = useMonth();
  const MO = ctxMO || MO_CONST;

  const mapRef     = useRef(null);
  const mapObjRef  = useRef(null);
  const stateLyrRef= useRef(null);
  const labelLyrRef= useRef([]);
  const cityLyrRef = useRef([]);
  const cityLblRef = useRef([]);
  // Pincode (area) marker layer — shown only when the user drills into a
  // city AND at least some of that city's dealers have GPS from CRM visits.
  // Each pincode is plotted at the centroid of its dealers' locations.
  const pincodeLyrRef = useRef([]);
  const pincodeLblRef = useRef([]);
  const geoRef     = useRef(null);
  const placeLayerRef = useRef(null);   // map's built-in labels (cities/towns/roads)
  const districtGeoRef= useRef(null);   // cached all-India district GeoJSON
  const districtLyrRef= useRef(null);   // current districts polygon layer
  const districtLblRef= useRef([]);     // current district name labels
  const subGeoRef     = useRef(null);   // cached all-India sub-district (taluka) GeoJSON
  const subLyrRef     = useRef(null);   // current sub-district polygon layer
  const subLblRef     = useRef([]);     // current sub-district name labels
  const restoredRef   = useRef(false);  // did we restore drill state from the URL yet?
  const pendingDrillRef = useRef(null); // { dt, ar } to open after geojson loads
  const maskLyrRef    = useRef(null);   // mask polygon that hides everything outside selected state
  const focusLyrRef   = useRef(null);   // mask that isolates a clicked city/district ("open" view)
  const baseTileRef   = useRef(null);   // base dark tiles ref (so we can hide them when drilled)

  const [selected, setSelected]     = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  // A city or district that's been "opened" (isolated) into its own map view.
  // { type:'city'|'district', name, holes:[ ring[[lng,lat]...] ], boundsArr:[[latS,lngW],[latN,lngE]] }
  const [focusArea, setFocusArea] = useState(null);
  // Right-side panel filters for an opened district: salesman filter and the
  // view mode (aggregate by salesman, or a flat dealer list).
  const [panelSalesman, setPanelSalesman] = useState('');       // '' = all salesmen
  const [panelMode, setPanelMode]         = useState('salesman'); // 'salesman' | 'dealer'
  // Track the map's live zoom level so the pincode/area layer can appear
  // automatically once the user zooms in past a threshold — no clicks needed.
  const [mapZoom, setMapZoom] = useState(4);
  // Which "areas" (pincodes) are expanded inside the current city drill-down.
  // A Set of pincode strings. Empty = no expansion; user clicks a pin to see
  // its dealers, or "Show all" to reveal every dealer in the city.
  const [expandedPincodes, setExpandedPincodes] = useState(new Set());
  // Which dealer's detail panel is showing on the right side of the map.
  // Set by clicking a dealer in the accordion or a pincode marker; cleared
  // via the X button. Independent of the drill-down state.
  const [detailDealer, setDetailDealer] = useState(null);
  const [showAllDealers, setShowAllDealers]     = useState(true);
  // Reset the area accordion whenever the user drills into a new city so we
  // don't carry over stale pincodes from the previously selected city.
  useEffect(() => { setExpandedPincodes(new Set()); setShowAllDealers(true); }, [selectedCity]);
  // Clear the side-panel salesman filter each time a new area is opened.
  useEffect(() => { setPanelSalesman(''); }, [focusArea]);
  const [viewMode, setViewMode]     = useState('sales');
  const [showLabels, setShowLabels] = useState(true);    // our state name labels
  const [showCount, setShowCount]   = useState(true);
  const [showNames, setShowNames]   = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);    // map's built-in places (cities/towns/roads)
  const [showDistricts, setShowDistricts] = useState(true); // district boundaries when drilled in
  const [lightMap, setLightMap] = useState(true);           // light ("clear") basemap is the default
  // Bumped whenever the app theme/palette changes so every colour-bearing
  // effect below re-runs against the freshly-resolved tokens.
  const [tokenVer, setTokenVer] = useState(() => { syncTokens(); return 0; });
  useEffect(() => {
    if(syncTokens()) setTokenVer(v => v + 1);
    let obs = null;
    try {
      obs = new MutationObserver(() => { if(syncTokens()) setTokenVer(v => v + 1); });
      // data-theme = dark/light toggle, data-palette = extra palettes,
      // style = the inline CSS variables applyTheme() writes on <html>.
      obs.observe(document.documentElement, { attributes:true, attributeFilter:['data-theme','data-palette','style'] });
    } catch {}
    return () => { try { obs && obs.disconnect(); } catch {} };
  }, []);
  const [summaryView, setSummaryView] = useState(null);     // 'customers'|'sales'|'salesmen'|'zones'|null
  const [districtsReady, setDistrictsReady] = useState(false);
  const [subReady, setSubReady] = useState(false);   // sub-district (taluka) geojson loaded?
  const [hoverDistrict, setHoverDistrict]   = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [geoReady, setGeoReady]         = useState(false);
  const [hub, setHub] = useState('');   // '' = all hubs; otherwise a HUBS key
  const [dealerTypeFilter, setDealerTypeFilter] = useState(''); // '' = all dealer types
  const [categoryFilter, setCategoryFilter]     = useState(''); // '' = all categories (legacy field)
  // Searchable city picker in the toolbar (shown when a state is selected).
  const cityPickRef = useRef(null);
  const [cityPickOpen, setCityPickOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  // ── Period, salesman, trend, territory, lists, compare ─────────────────
  const [periodKey, setPeriodKey]   = useState('month');
  const [customFrom, setCustomFrom] = useState(null);
  const [customTo, setCustomTo]     = useState(null);
  const [smFilter, setSmFilter]     = useState('');      // '' = every salesman
  const [trendOn, setTrendOn]       = useState(false);   // colour by growth vs the previous period
  const [territoryMode, setTerritoryMode] = useState(false); // tap regions to collect them
  const [territory, setTerritory]   = useState([]);      // [{ key, type:'state'|'district', name, ids:[] }]
  const [listView, setListView]     = useState(null);    // { title, dealers } — the "List customers" popup
  const [listQ, setListQ]           = useState('');
  const [compareOpen, setCompareOpen] = useState(false);
  const period = useMemo(() => periodRange(periodKey, selectedMonthIdx, MO, customFrom, customTo),
    [periodKey, selectedMonthIdx, MO, customFrom, customTo]);
  const trendLive = trendOn && period.prevFull;
  // One signature for every memo/effect that sums months.
  const periodSig = period.sig + '|' + smFilter;
  const achOf  = d => sumMonths(d, period.idx, smFilter);
  const prevOf = d => sumMonths(d, period.prev, smFilter);
  const tgtOf  = d => period.idx.reduce((t, i) => (smFilter && (d.monthSalesman?.[i] || d.salesman) !== smFilter) ? t : t + (Number(monthTarget(d, i)) || 0), 0);
  // Last month (up to the period's end) the dealer bought anything.
  const lastBilled = d => { for(let i = period.idx[period.idx.length-1]; i >= 0; i--) if((Number(d.months?.[i]) || 0) > 0) return MO[i]; return ''; };
  const salesmanOptions = useMemo(() => {
    const ids = new Set();
    (allDealers || []).forEach(d => { if(d.salesman) ids.add(d.salesman); });
    return [...ids].map(id => ({ id, name: users?.[id]?.name || id })).sort((a,b) => a.name.localeCompare(b.name));
  }, [allDealers, users]);
  const territoryModeRef = useRef(false); territoryModeRef.current = territoryMode;
  const toggleTerritory = (type, name, list) => {
    const key = type + ':' + String(name).toLowerCase();
    setTerritory(t => t.some(r => r.key === key) ? t.filter(r => r.key !== key)
      : [...t, { key, type, name, ids: (list || []).map(d => d.id) }]);
  };
  const toggleTerritoryRef = useRef(toggleTerritory); toggleTerritoryRef.current = toggleTerritory;
  const territorySig = territory.map(r => r.key).join(',');

  // Distinct legacy "category" values present in the data (for the category dropdown).
  const categoryOptions = useMemo(() => {
    const s = new Set();
    (allDealers || []).forEach(d => { const c = (d.category || '').trim(); if(c) s.add(c); });
    return Array.from(s).sort((a,b) => a.localeCompare(b));
  }, [allDealers]);

  // Hub + Dealer-Type + Category filter: scope every dealer used by the map.
  // Because we shadow the `dealers` prop, ALL downstream aggregation
  // (stateData, cityData, summary, lists, markers, heat) is filtered automatically.
  const dealers = useMemo(() => {
    let list = allDealers;
    if(hub){
      const states = hubStateSet(hub);
      list = list.filter(d => states.has((normalizeState(d.state) || '').toLowerCase()));
    }
    if(dealerTypeFilter){
      list = list.filter(d => (d.dealerType || 'None') === dealerTypeFilter);
    }
    if(categoryFilter){
      list = list.filter(d => (d.category || '').trim() === categoryFilter);
    }
    if(smFilter){
      // his dealers now, plus any he owned during the period (or the trend period)
      const own = [...period.idx, ...period.prev];
      list = list.filter(d => d.salesman === smFilter || own.some(i => d.monthSalesman?.[i] === smFilter));
    }
    return list;
  }, [allDealers, hub, dealerTypeFilter, categoryFilter, smFilter, period]);

  // Reset the drill-down whenever any top-level filter changes.
  useEffect(() => { setSelected(null); setSelectedCity(null); setFocusArea(null); }, [hub, dealerTypeFilter, categoryFilter]);
  // Close the city picker on outside click; clear its search when it closes.
  useEffect(() => {
    const onDoc = (e) => { if(cityPickRef.current && !cityPickRef.current.contains(e.target)) setCityPickOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const drillLevel = selected ? 'state' : 'india';

  // ── Aggregate dealers per state ──────────────────────────────────────────
  const stateData = useMemo(() => {
    const map = {};
    dealers.forEach(d => {
      const norm = normalizeState(d.state);
      if(!norm) return;
      const key = norm.toLowerCase();
      if(!map[key]) map[key] = { name:norm, dealers:[], total:0, target:0, prev:0, bySM:{} };
      const ach = achOf(d);
      const tgt = tgtOf(d);
      map[key].dealers.push(d);
      map[key].prev   += prevOf(d);
      map[key].total  += ach;
      map[key].target += tgt;
      const smKey = d.salesman || 'Unassigned';
      if(!map[key].bySM[smKey]) map[key].bySM[smKey] = { u:0, n:0 };
      map[key].bySM[smKey].u += ach;
      map[key].bySM[smKey].n += 1;
    });
    return map;
  }, [dealers, periodSig]);

  const maxStateVal = useMemo(() => {
    const vals = Object.values(stateData).map(d => {
      if(trendLive)                  return Math.abs(d.total - d.prev);
      if(viewMode === 'dealers')     return d.dealers.length;
      if(viewMode === 'achievement') return d.target ? Math.round((d.total/d.target)*100) : 0;
      return d.total;
    });
    return Math.max(...vals, 1);
  }, [stateData, viewMode, trendLive]);

  // ── Aggregate cities for the SELECTED state ──────────────────────────────
  const cityData = useMemo(() => {
    if(!selected) return [];
    const stateKey = selected.toLowerCase();
    const list = stateData[stateKey]?.dealers || [];
    const map = {};
    list.forEach(d => {
      const city = (d.city || '').trim();
      if(!city) return;
      const key = city.toLowerCase();
      if(!map[key]) map[key] = { name:city, dealers:[], total:0, target:0, qty:0 };
      const ach = achOf(d);
      const tgt = tgtOf(d);
      map[key].dealers.push(d);
      map[key].total  += ach;
      map[key].target += tgt;
      if(ach > 0) map[key].qty++;
    });
    return Object.values(map).sort((a,b) => b.total - a.total);
  }, [selected, stateData, periodSig]);

  const maxCityVal = useMemo(() => Math.max(1, ...cityData.map(c => c.total)), [cityData]);

  // ── KPI cards ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const det  = selected ? stateData[selected.toLowerCase()] : null;
    const list = det ? det.dealers : dealers;
    const k = { active:0, star:0, inactive:0, lost:0, total:list.length, sales:0, target:0, qty:0, prev:0 };
    list.forEach(d => {
      // Activity buckets come from the calculated tier, not the rep's Potential
      // label. 'RISING STAR' is a performance tier and must not fall into the
      // star bucket, so match it before the generic STAR test.
      k[bucketOf(d)]++;
      k.prev += prevOf(d);
      const ach = achOf(d);
      const tgt = tgtOf(d);
      k.sales  += ach;
      k.target += tgt;
      if(ach > 0) k.qty++;
    });
    k.ach = k.target ? Math.round((k.sales / k.target) * 100) : 0;
    k.avgSales = k.total ? Math.round(k.sales / k.total) : 0;
    return k;
  }, [dealers, stateData, selected, periodSig]);

  const topStates = useMemo(
    () => Object.values(stateData).sort((a,b) => b.total - a.total).slice(0, 12),
    [stateData]
  );
  const unmapped = useMemo(() => dealers.filter(d => !d.state?.trim()).length, [dealers]);
  const det      = selected ? stateData[selected.toLowerCase()] : null;
  const unmappedCities = useMemo(
    () => cityData.filter(c => !CITY_COORDS[c.name.toLowerCase()]),
    [cityData]
  );

  // ── Load Leaflet ──────────────────────────────────────────────────────────
  useEffect(() => {
    if(!document.getElementById('leaflet-css')){
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    // Replace any older injected CSS so dark style always wins
    const old = document.getElementById('stp-mapview-css');
    if(old) old.remove();
    const s = document.createElement('style');
    s.id = 'stp-mapview-css'; s.textContent = MAP_CSS;
    document.head.appendChild(s);

    if(window.L){ setLeafletReady(true); return; }
    let script = document.getElementById('leaflet-js');
    if(!script){
      script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      document.head.appendChild(script);
    }
    const onLoad = () => setLeafletReady(true);
    script.addEventListener('load', onLoad);
    return () => script.removeEventListener('load', onLoad);
  }, []);

  // ── Load India GeoJSON ───────────────────────────────────────────────────
  useEffect(() => {
    if(geoRef.current){ setGeoReady(true); return; }
    fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson')
      .then(r => r.json()).then(data => { geoRef.current = data; setGeoReady(true); })
      .catch(() => {
        fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
          .then(r => r.json()).then(data => { geoRef.current = data; setGeoReady(true); })
          .catch(e => console.error('GeoJSON failed:', e));
      });
  }, []);

  // ── Init Leaflet map with DARK tiles + labels overlay + custom panes ────
  useEffect(() => {
    if(!leafletReady || !geoReady || !mapRef.current) return;
    if(mapObjRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      // Wheel over the map zooms; the right data column scrolls independently,
      // so the map no longer blocks reaching the lists.
      center:[22, 80], zoom:4.4, zoomControl:true, scrollWheelZoom:true, doubleClickZoom:true,
      attributionControl:false, minZoom:3, maxZoom:18,
    });

    // Custom panes — z-index ordering matters for the state-only mask view.
    //   tilePane          200  base dark tiles (Leaflet default)
    //   placesPane        300  built-in labels (cities/towns/roads)
    //   maskPane          400  black mask that covers everything OUTSIDE selected state
    //   statePane         500  state choropleth (above mask — only state shows)
    //   districtPane      550  district polygons (above state fill)
    //   markerPane        600  city markers (Leaflet default)
    //   tooltipPane       650  tooltips (Leaflet default)
    map.createPane('placesPane');   map.getPane('placesPane').style.zIndex = 300;  map.getPane('placesPane').style.pointerEvents = 'none';
    map.createPane('maskPane');     map.getPane('maskPane').style.zIndex   = 400;  map.getPane('maskPane').style.pointerEvents = 'none';
    map.createPane('statePane');    map.getPane('statePane').style.zIndex  = 500;
    map.createPane('districtPane'); map.getPane('districtPane').style.zIndex = 550;

    // Base — dark land with no text labels
    baseTileRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution:'© Esri', maxZoom:16,
    }).addTo(map);

    // Overlay — only the place labels (cities, towns, roads, water features)
    placeLayerRef.current = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      { attribution:'', maxZoom:16, pane:'placesPane' }
    ).addTo(map);

    mapObjRef.current = map;
    // Track live zoom so the pincode/area layer can auto-appear when the
    // user zooms in without needing to click a state or city first.
    setMapZoom(map.getZoom());
    map.on('zoomend', () => setMapZoom(map.getZoom()));
    // Also re-run the area layer effect when the user pans, by nudging the
    // zoom-state to a fractional value that differs slightly (React skips
    // updates for identical values, so we add a microscopic jitter to force
    // the useEffect to re-evaluate the visible-bounds filter).
    map.on('moveend', () => setMapZoom(z => z + 1e-9));
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapObjRef.current = null; stateLyrRef.current = null; placeLayerRef.current = null; baseTileRef.current = null; };
  }, [leafletReady, geoReady]);

  // ── Render MASK polygon so only selected state is visible ────────────────
  // When drilled in: build a world-sized polygon with a hole shaped like the
  // selected state. Fill the polygon with the page background → everything
  // outside the state is hidden, leaving a clean state-only view.
  useEffect(() => {
    if(!leafletReady || !geoReady || !mapObjRef.current || !geoRef.current) return;
    const L = window.L, map = mapObjRef.current;

    if(maskLyrRef.current){ try { maskLyrRef.current.remove(); } catch {} maskLyrRef.current = null; }
    if(drillLevel !== 'state') return;

    const stateFeature = geoRef.current.features.find(f => {
      const n = getFeatureStateName(f);
      return n && selected && n.toLowerCase() === selected.toLowerCase();
    });
    if(!stateFeature) return;

    // Collect all outer rings of the state (handles Polygon AND MultiPolygon)
    const geom = stateFeature.geometry;
    const holes = [];
    if(geom?.type === 'Polygon')      geom.coordinates.forEach((ring, i) => { if(i === 0) holes.push(ring); });
    else if(geom?.type === 'MultiPolygon') geom.coordinates.forEach(poly => holes.push(poly[0]));
    if(holes.length === 0) return;

    // World ring (GeoJSON format: [lng, lat])
    const worldRing = [[-180,-85.05],[180,-85.05],[180,85.05],[-180,85.05],[-180,-85.05]];

    const maskFeature = {
      type:'Feature',
      properties:{},
      geometry: { type:'Polygon', coordinates: [worldRing, ...holes] }
    };

    maskLyrRef.current = L.geoJSON(maskFeature, {
      pane:'maskPane',
      interactive:false,
      style: { color:'transparent', weight:0, fillColor:T.bg0, fillOpacity:1 },
    }).addTo(map);

    // Lock the view so you can't pan back to see the rest of India
    try {
      const stateLayer = L.geoJSON(stateFeature);
      const b = stateLayer.getBounds().pad(0.05);
      map.setMaxBounds(b);
      map.fitBounds(b, { padding:[20,20], maxZoom:9 });
    } catch {}

  }, [leafletReady, geoReady, drillLevel, selected]);

  // ── "Open" a clicked city/district: mask everything outside it and lock
  //    the view to it — a dedicated area view, not just a zoom. Clearing the
  //    focus restores the parent state view. ────────────────────────────────
  useEffect(() => {
    if(!leafletReady || !mapObjRef.current) return;
    const L = window.L, map = mapObjRef.current;

    if(focusLyrRef.current){ try { focusLyrRef.current.remove(); } catch {} focusLyrRef.current = null; }

    if(!focusArea){
      // Focus cleared → restore the parent state view (or release at India).
      try {
        if(selected && geoRef.current){
          const feat = geoRef.current.features.find(f => {
            const n = getFeatureStateName(f);
            return n && n.toLowerCase() === selected.toLowerCase();
          });
          if(feat){
            const b = L.geoJSON(feat).getBounds().pad(0.05);
            map.setMaxBounds(b);
            map.fitBounds(b, { padding:[20,20], maxZoom:9 });
          }
        } else {
          map.setMaxBounds(null);
        }
      } catch {}
      return;
    }

    // World polygon with the focused area punched out as a hole, filled with
    // the background so only the clicked city/district remains visible.
    const worldRing = [[-180,-85.05],[180,-85.05],[180,85.05],[-180,85.05],[-180,-85.05]];
    const maskFeature = {
      type:'Feature', properties:{},
      geometry:{ type:'Polygon', coordinates:[worldRing, ...focusArea.holes] },
    };
    focusLyrRef.current = L.geoJSON(maskFeature, {
      pane:'maskPane', interactive:false,
      style:{ color:'transparent', weight:0, fillColor:T.bg0, fillOpacity:1 },
    }).addTo(map);

    try {
      if(focusArea.boundsArr){
        const b = L.latLngBounds(focusArea.boundsArr);
        map.setMaxBounds(b.pad(0.15));
        map.fitBounds(b, { padding:[20,20], maxZoom: focusArea.type === 'city' ? 11 : 10 });
      }
    } catch {}
  }, [focusArea, leafletReady, selected]);

  // ── Release the bounds lock when returning to India view ────────────────
  useEffect(() => {
    if(drillLevel === 'india' && mapObjRef.current){
      try { mapObjRef.current.setMaxBounds(null); } catch {}
    }
  }, [drillLevel]);

  // ── Toggle the map's built-in place labels on/off ────────────────────────
  useEffect(() => {
    if(!mapObjRef.current || !placeLayerRef.current) return;
    const map = mapObjRef.current;
    if(showPlaces){ if(!map.hasLayer(placeLayerRef.current)) placeLayerRef.current.addTo(map); }
    else          { if(map.hasLayer(placeLayerRef.current))  map.removeLayer(placeLayerRef.current); }
  }, [showPlaces]);

  // ── Light ("clear") vs dark basemap ─────────────────────────────────────
  // Swaps the Esri tile set (Carto's free tiles now demand an API key and
  // draw an "API KEY REQUIRED" watermark instead of the map) so districts + green fills stand out on a
  // clean white background (like a BI dashboard), without re-creating the map.
  useEffect(() => {
    if(!leafletReady || !mapObjRef.current) return;
    const map = mapObjRef.current;
    try {
      if(baseTileRef.current){
        if(lightMap){
          // BI-dashboard look: REMOVE the street tiles entirely so it's just
          // the region polygons + green fills on a clean flat background.
          if(map.hasLayer(baseTileRef.current)) map.removeLayer(baseTileRef.current);
        } else {
          baseTileRef.current.setUrl('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}');
          if(!map.hasLayer(baseTileRef.current)) baseTileRef.current.addTo(map);
        }
      }
      if(placeLayerRef.current){
        placeLayerRef.current.setUrl(lightMap
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
          : 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}');
      }
      if(mapRef.current) mapRef.current.style.background = lightMap ? '#eef2f0' : T.bg0;
    } catch {}
  }, [lightMap, leafletReady, tokenVer]);

  // Recalculate the map size after the side-by-side layout mounts / on resize
  // (Leaflet needs invalidateSize when its container width changes).
  useEffect(() => {
    if(!leafletReady || !mapObjRef.current) return;
    const map = mapObjRef.current;
    // Re-measure AND re-frame. invalidateSize alone keeps the old zoom, so a
    // sidebar collapse or window resize left the country mis-framed (this is
    // what made India render tiny inside a very wide panel).
    const fix = () => {
      try {
        map.invalidateSize();
        const b = stateLyrRef.current?.getBounds?.();
        if(drillLevel === 'india' && b && b.isValid()) map.fitBounds(b, { padding:[12,12] });
      } catch {}
    };
    const t = setTimeout(fix, 120);
    window.addEventListener('resize', fix);
    // The panel also resizes when the app sidebar opens/closes, which fires no
    // window resize event — observe the container itself.
    let ro = null;
    try {
      if(mapRef.current && typeof ResizeObserver !== 'undefined'){
        ro = new ResizeObserver(() => fix());
        ro.observe(mapRef.current);
      }
    } catch {}
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', fix);
      try { ro && ro.disconnect(); } catch {}
    };
  }, [leafletReady, drillLevel]);

  // ── Render choropleth + state labels ─────────────────────────────────────
  useEffect(() => {
    if(!leafletReady || !geoReady || !mapObjRef.current || !geoRef.current) return;
    const L = window.L, map = mapObjRef.current;

    if(stateLyrRef.current){ stateLyrRef.current.remove(); stateLyrRef.current = null; }
    labelLyrRef.current.forEach(l => l.remove());
    labelLyrRef.current = [];

    const getVal = key => {
      const d = stateData[key]; if(!d) return 0;
      if(trendLive)                  return d.total - d.prev;
      if(viewMode === 'dealers')     return d.dealers.length;
      if(viewMode === 'achievement') return d.target ? Math.round((d.total/d.target)*100) : 0;
      return d.total;
    };

    const geoLayer = L.geoJSON(geoRef.current, {
      pane: 'statePane',
      style: feature => {
        const name  = getFeatureStateName(feature);
        const key   = name?.toLowerCase();
        const value = key ? getVal(key) : 0;
        const ratio = maxStateVal ? value / maxStateVal : 0;
        const isSel = selected && name && selected.toLowerCase() === name.toLowerCase();

        // When a single district is "opened", hide the whole state polygon so
        // only that district remains visible.
        if(focusArea?.type === 'district'){
          return { color:'transparent', weight:0, fillOpacity:0, opacity:0 };
        }

        // When drilled into a state, other states are hidden by the mask
        // anyway, but keep them invisible/non-interactive to be safe.
        if(drillLevel === 'state' && !isSel){
          return { color:'transparent', weight:0, fillOpacity:0, opacity:0 };
        }
        const inTerr = key && territory.some(r => r.key === 'state:' + key);
        return {
          // BI style → thin black borders between states, thick black on the
          // selected one; territory states get a blue dashed edge.
          color: inTerr ? '#2563eb' : isSel ? '#111827' : (lightMap ? '#333333' : T.bd2),
          weight: inTerr ? 3 : isSel ? 3 : (lightMap ? 0.9 : 0.8),
          dashArray: inTerr ? '6 4' : '',
          // selected state: light fill so the districts show through clearly
          fillColor: isSel ? colorForRatio(ratio || 0.4) : trendLive ? colorForGrowth(value, maxStateVal) : colorForRatio(ratio),
          fillOpacity: isSel ? 0.35 : (lightMap ? 0.92 : 0.82),
          opacity: 1,
        };
      },
      onEachFeature: (feature, layer) => {
        const name = getFeatureStateName(feature);
        const key  = name?.toLowerCase();
        const d    = key ? stateData[key] : null;
        const sales       = d?.total || 0;
        const dealerCount = d?.dealers?.length || 0;
        const qty         = (d?.dealers || []).filter(x => achOf(x) > 0).length;
        const target      = d?.target || 0;
        const achPct      = target ? Math.round((sales/target)*100) : 0;
        const diff        = sales - (d?.prev || 0);
        const diffPct     = d?.prev ? Math.round((diff / d.prev) * 100) : null;
        const trendLine   = period.prevFull
          ? '<div style="font-size:11px;color:#a5a4b8;margin-top:3px"><span style="font-weight:700;color:#e2e0f0">vs ' + period.prevLabel + ' :</span> ' +
            '<span style="font-weight:800;color:' + (diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : '#a5a4b8') + '">' + signed(diff) + (diffPct !== null ? ' (' + (diffPct > 0 ? '+' : '') + diffPct + '%)' : '') + '</span></div>'
          : '';

        layer.bindTooltip(
          '<div style="font-family:Inter,system-ui;background:#0c0c1e;border-radius:8px;padding:10px 12px;min-width:170px;color:#e2e0f0">' +
          '<div style="font-size:13px;font-weight:800;color:#e2e0f0;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #1e1e38">' + (d?.name || name || '—') + '</div>' +
          '<div style="font-size:11px;color:#a5a4b8;display:flex;align-items:center;gap:6px;margin-bottom:3px">' +
            '<span style="font-weight:700;color:'+T.acc+'">Sales :</span>' +
            '<span style="color:#f59e0b;font-weight:700">V : ' + fmtIN(sales) + '</span>' +
            '<span style="color:#6c6b85">|</span>' +
            '<span style="color:#f59e0b;font-weight:700">Q : ' + qty + '</span>' +
          '</div>' +
          '<div style="font-size:11px;color:#a5a4b8"><span style="font-weight:700;color:#e2e0f0">Count :</span> ' + dealerCount + (target ? ' | ' + achPct + '%' : '') + '</div>' +
          trendLine +
          (drillLevel === 'india' ? '<div style="font-size:10px;color:#6c6b85;margin-top:6px;padding-top:5px;border-top:1px dashed #1e1e38">' + (territoryModeRef.current ? 'Tap to add to / remove from the territory' : 'Click to see city-wise sales →') + '</div>' : '') +
          '</div>',
          { sticky:true, opacity:1, className:'stp-tooltip', direction:'top' }
        );

        layer.on({
          mouseover: e => {
            if(drillLevel === 'state' && (!d || d.name.toLowerCase() !== selected.toLowerCase())) return;
            e.target.setStyle({ weight:2, color:T.acc, fillOpacity:0.95 });
            if(!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) e.target.bringToFront();
          },
          mouseout: e => { if(stateLyrRef.current) stateLyrRef.current.resetStyle(e.target); },
          click: e => {
            if(drillLevel === 'state' && (!d || d.name.toLowerCase() !== selected.toLowerCase())) return;
            if(territoryModeRef.current && drillLevel === 'india'){
              if(name) toggleTerritoryRef.current('state', d?.name || name, d?.dealers || []);
              return;
            }
            const target = d?.name || name;
            if(target){
              setSelected(target);
              setSelectedCity(null);
            }
            try { map.fitBounds(e.target.getBounds(), { padding:[40,40], maxZoom:8 }); } catch {}
          },
        });
      },
    }).addTo(map);

    stateLyrRef.current = geoLayer;

    // Frame the country. Nothing ever fitted the all-India view — it kept the
    // hard-coded zoom 4.4 from map creation, which on a wide, short panel
    // renders half the world with India as a speck in the middle. Fitting to
    // the real geometry makes it fill the panel at any window size, and the
    // padded maxBounds stops you panning off into open ocean.
    if(drillLevel === 'india'){
      try {
        const ib = geoLayer.getBounds();
        if(ib.isValid()){
          map.setMaxBounds(ib.pad(0.45));
          map.fitBounds(ib, { padding:[12,12] });
        }
      } catch {}
    }

    if(showLabels && drillLevel === 'india'){
      geoRef.current.features.forEach(feature => {
        const name = getFeatureStateName(feature);
        const key  = name?.toLowerCase();
        const val  = key ? getVal(key) : 0;
        try {
          const tmp    = L.geoJSON(feature);
          const center = tmp.getBounds().getCenter();
          const sn     = shortName(name || '?');
          const showVal = showCount && (trendLive ? val !== 0 : val > 0);
          const showNm  = showNames;
          if(!showVal && !showNm) return;
          const label = L.tooltip({
            permanent: true, direction:'center',
            className:'stp-state-label', interactive:false, opacity:1,
          })
          .setContent(
            '<div class="stp-state-label-inner">' +
              (showNm ? sn : '') +
              (showVal ? '<span class="lbl-val"' + (trendLive && val < 0 ? ' style="color:#dc2626"' : '') + '>' + (trendLive ? signed(val) : fmtIN(val)) + '</span>' : '') +
            '</div>'
          )
          .setLatLng(center);
          label.addTo(map);
          labelLyrRef.current.push(label);
        } catch {}
      });
    }
  }, [tokenVer, leafletReady, geoReady, stateData, viewMode, maxStateVal, selected, showLabels, showCount, showNames, drillLevel, periodSig, focusArea, lightMap, trendLive, territorySig]);

  // ── Render CITY markers when drilled in ──────────────────────────────────
  useEffect(() => {
    if(!leafletReady || !mapObjRef.current) return;
    const L = window.L, map = mapObjRef.current;

    cityLyrRef.current.forEach(m => { try { map.removeLayer(m); } catch {} });
    cityLyrRef.current = [];
    cityLblRef.current.forEach(l => { try { l.remove(); } catch {} });
    cityLblRef.current = [];

    if(drillLevel !== 'state') return;
    // When a district is opened, don't draw the state-wide city markers or
    // re-fit to the whole state — only the district's own pincode markers show.
    if(focusArea?.type === 'district') return;

    try {
      const feat = geoRef.current?.features?.find(f => {
        const n = getFeatureStateName(f);
        return n && selected && n.toLowerCase() === selected.toLowerCase();
      });
      if(feat){
        const layer = L.geoJSON(feat);
        map.fitBounds(layer.getBounds(), { padding:[40,40], maxZoom:8 });
      }
    } catch {}

    cityData.forEach(city => {
      const coords = CITY_COORDS[city.name.toLowerCase()];
      if(!coords) return;
      const ratio = maxCityVal ? city.total / maxCityVal : 0;
      const radius = Math.max(8, Math.min(32, 8 + ratio * 24));
      const isSel = selectedCity && selectedCity.toLowerCase() === city.name.toLowerCase();

      const marker = L.circleMarker(coords, {
        radius,
        fillColor: isSel ? '#f59e0b' : colorForRatio(0.5 + ratio * 0.5),
        color: isSel ? '#f59e0b' : T.acc,
        weight: isSel ? 3 : 2,
        fillOpacity: 0.9,
      });

      marker.bindTooltip(
        '<div style="font-family:Inter,system-ui;background:#0c0c1e;border-radius:8px;padding:10px 12px;min-width:170px;color:#e2e0f0">' +
        '<div style="font-size:13px;font-weight:800;color:#e2e0f0;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #1e1e38">' + city.name + '</div>' +
        '<div style="font-size:11px;color:#a5a4b8;display:flex;align-items:center;gap:6px;margin-bottom:3px">' +
          '<span style="font-weight:700;color:'+T.acc+'">Sales :</span>' +
          '<span style="color:#f59e0b;font-weight:700">V : ' + fmtIN(city.total) + '</span>' +
          '<span style="color:#6c6b85">|</span>' +
          '<span style="color:#f59e0b;font-weight:700">Q : ' + city.qty + '</span>' +
        '</div>' +
        '<div style="font-size:11px;color:#a5a4b8"><span style="font-weight:700;color:#e2e0f0">Dealers :</span> ' + city.dealers.length + (city.target ? ' | ' + Math.round((city.total/city.target)*100) + '% of target' : '') + '</div>' +
        '<div style="font-size:10px;color:#6c6b85;margin-top:6px;padding-top:5px;border-top:1px dashed #1e1e38">Click to see dealers →</div>' +
        '</div>',
        { sticky:true, opacity:1, className:'stp-tooltip', direction:'top' }
      );

      marker.on('click', () => {
        setSelectedCity(city.name);
        // Open (isolate) the clicked city as its own map view.
        const [lat, lng] = coords, dlt = 0.25;
        setFocusArea({
          type:'city', name:city.name,
          holes:[[[lng-dlt,lat-dlt],[lng+dlt,lat-dlt],[lng+dlt,lat+dlt],[lng-dlt,lat+dlt],[lng-dlt,lat-dlt]]],
          boundsArr:[[lat-dlt,lng-dlt],[lat+dlt,lng+dlt]],
        });
      });
      marker.addTo(map);
      cityLyrRef.current.push(marker);

      const label = L.tooltip({
        permanent: true, direction:'top', offset:[0, -radius - 2],
        className:'stp-city-label', interactive:false, opacity:1,
      })
      .setContent(
        '<div class="stp-city-label-inner">' + city.name +
        (city.total > 0 ? '<span class="lbl-val">' + fmtIN(city.total) + '</span>' : '') +
        '</div>'
      )
      .setLatLng(coords);
      label.addTo(map);
      cityLblRef.current.push(label);
    });
  }, [leafletReady, drillLevel, selected, cityData, maxCityVal, selectedCity, focusArea]);

  // ── Pincode-level markers (Area zoom) ────────────────────────────────────
  // When a city is selected, group its dealers by pincode and plot a marker
  // at each pincode's centroid using dealer.locLat/locLng (auto-captured on
  // CRM visits). If NO dealer in that city has GPS, we simply don't draw
  // anything — the side panel still shows the pincode list.
  useEffect(() => {
    if (!leafletReady || !mapObjRef.current) return;
    const L = window.L, map = mapObjRef.current;

    // Clear previous pincode markers
    pincodeLyrRef.current.forEach(m => { try { map.removeLayer(m); } catch {} });
    pincodeLyrRef.current = [];
    pincodeLblRef.current.forEach(l => { try { l.remove(); } catch {} });
    pincodeLblRef.current = [];

    // Show pincode markers when EITHER:
    //   (a) the user has drilled into a specific city, OR
    //   (b) the map is zoomed in past level 8 — so casually scrolling the
    //       wheel over any state or region reveals the PIN-level detail
    //       automatically.
    const zoomTrigger = mapZoom >= 8;
    const cityTrigger = drillLevel === 'state' && !!selectedCity;
    const districtTrigger = drillLevel === 'state' && focusArea?.type === 'district';
    if (!zoomTrigger && !cityTrigger && !districtTrigger) return;

    // Pool of candidate dealers (any dealer with a pincode is eligible —
    // GPS is a bonus, not a requirement, so sales-only records still show).
    //   - drilled into a city → just that city's dealers
    //   - zoomed only        → every dealer, then filter by viewport after
    //                          we've resolved coordinates below.
    let poolDealers;
    if (districtTrigger) {
      // A district is open → show ONLY that district's dealers, nothing outside.
      const dObj = districtData[focusArea.name.toLowerCase()];
      poolDealers = dObj?.dealers || [];
    } else if (cityTrigger) {
      const cityObj = cityData.find(c => c.name.toLowerCase() === selectedCity.toLowerCase());
      if (!cityObj) return;
      poolDealers = cityObj.dealers;
    } else {
      poolDealers = dealers;
    }

    // Group by pincode, aggregate sales, and resolve a coordinate:
    //   1. Average the dealer GPS pins (dealer.locLat/locLng) if any exist —
    //      most precise when CRM visits have been logged.
    //   2. Fall back to the CITY_COORDS lookup so cities with no visits
    //      still show markers based on sales.
    //   3. Space multiple pincodes in the same city out in a small ring so
    //      they don't overlap on the map.
    const groups = new Map();
    for (const d of poolDealers) {
      const pin = String(d.pincode || '').trim();
      if (!pin) continue;
      if (!groups.has(pin)) groups.set(pin, { pin, dealers: [], total: 0, target: 0, latSum: 0, lngSum: 0, geoCount: 0, city: d.city || '' });
      const g = groups.get(pin);
      g.dealers.push(d);
      g.total  += achOf(d);
      g.target += tgtOf(d);
      if (Number.isFinite(d.locLat) && Number.isFinite(d.locLng)) {
        g.latSum += d.locLat;
        g.lngSum += d.locLng;
        g.geoCount++;
      }
    }
    // Bucket pincodes by city so we can spread them in a ring when they
    // share the same city center (avoids overlapping markers).
    const byCity = new Map();
    for (const g of groups.values()) {
      const key = (g.city || '').toLowerCase();
      if (!byCity.has(key)) byCity.set(key, []);
      byCity.get(key).push(g);
    }
    // Resolve coordinates for every pincode group.
    // Priority: real Nominatim geocode → dealer GPS avg → city center + ring.
    const groupsArr = [];
    const pinsToFetch = [];
    for (const [cityKey, list] of byCity) {
      const cityCoord = CITY_COORDS[cityKey];
      list.sort((a, b) => b.total - a.total);
      const ringR = 0.02;   // ~2 km at India latitudes
      list.forEach((g, i) => {
        let lat, lng, source = 'unknown', area = '';
        // 1) Best: Nominatim-geocoded PIN centroid + area name
        const nomCoord = _pinCoord(g.pin);
        if (nomCoord && typeof nomCoord === 'object' && Number.isFinite(nomCoord.lat)) {
          lat = nomCoord.lat;
          lng = nomCoord.lng;
          area = nomCoord.area || '';
          source = 'pin';
        } else if (g.geoCount > 0) {
          // 2) Dealer GPS from CRM visits (only used if Nominatim missed)
          lat = g.latSum / g.geoCount;
          lng = g.lngSum / g.geoCount;
          source = 'gps';
        } else if (cityCoord) {
          // 3) City center with a small ring offset so multiple PINs in the
          // same city don't stack on top of each other.
          const angle = (2 * Math.PI * i) / Math.max(list.length, 1);
          lat = cityCoord[0] + ringR * Math.sin(angle);
          lng = cityCoord[1] + ringR * Math.cos(angle);
          source = 'city';
        } else {
          // No coord source available yet — but if Nominatim hasn't tried
          // this PIN yet, queue a lookup and skip the marker for now.
          if (nomCoord === undefined) pinsToFetch.push(g.pin);
          return;
        }
        // Queue a Nominatim lookup for PINs we're currently placing via
        // fallback, so subsequent renders can use the precise coordinate.
        if (source !== 'pin' && nomCoord === undefined) pinsToFetch.push(g.pin);
        // In zoom-only mode, drop pincodes outside the current viewport.
        if (zoomTrigger && !cityTrigger && !districtTrigger) {
          const bounds = map.getBounds();
          if (!bounds.contains([lat, lng])) return;
        }
        groupsArr.push({ ...g, lat, lng, source, area });
      });
    }
    // Fire off Nominatim lookups for the pincodes we don't have yet. When
    // each resolves, nudge our state so the effect re-runs and the marker
    // snaps to the accurate location.
    if (pinsToFetch.length) {
      pinsToFetch.forEach(pin => {
        _geocodePin(pin).then(() => setMapZoom(z => z + 1e-9));
      });
    }
    if (groupsArr.length === 0) return;
    const maxPin = Math.max(...groupsArr.map(g => g.total), 1);

    // Auto-zoom only when explicitly drilling into a city — never when the
    // user is just scrolling around (they control zoom themselves then).
    if (cityTrigger) {
      try {
        const centroids = groupsArr.map(g => [g.lat, g.lng]);
        const bounds = L.latLngBounds(centroids);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch {}
    }

    for (const g of groupsArr) {
      const { lat, lng } = g;
      const ratio = g.total / maxPin;
      const radius = Math.max(6, Math.min(22, 6 + ratio * 16));
      const hasSales = g.total > 0;
      // Amber highlight where sales exist, muted purple where they don't.
      const fillColor = hasSales ? '#f59e0b' : '#6366f1';
      const strokeColor = hasSales ? '#f59e0b' : '#a5b4fc';

      const marker = L.circleMarker([lat, lng], {
        radius,
        fillColor,
        color: strokeColor,
        weight: hasSales ? 3 : 2,
        fillOpacity: hasSales ? 0.95 : 0.75,
      });
      marker.bindTooltip(
        '<div style="font-family:Inter,system-ui;background:#0c0c1e;border-radius:8px;padding:10px 12px;min-width:190px;color:#e2e0f0">' +
        '<div style="font-size:12px;font-weight:800;color:' + (hasSales ? '#f59e0b' : '#a5b4fc') + ';margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #1e1e38">' +
          (g.area ? g.area + ' · ' : '') + 'PIN ' + g.pin +
          (g.city ? '<div style="font-size:10px;color:#a5a4b8;font-weight:500;margin-top:2px">' + g.city + '</div>' : '') +
        '</div>' +
        '<div style="font-size:11px;color:#a5a4b8;margin-bottom:2px">' +
          '<b style="color:'+T.acc+'">Sales:</b> ' + fmtIN(g.total) +
        '</div>' +
        '<div style="font-size:11px;color:#a5a4b8;margin-bottom:2px">' +
          '<b style="color:#e2e0f0">Dealers:</b> ' + g.dealers.length +
          (g.target ? ' · <b>' + Math.round((g.total/g.target)*100) + '%</b> of target' : '') +
        '</div>' +
        '</div>',
        { sticky: true, opacity: 1, className: 'stp-tooltip', direction: 'top' }
      );
      marker.on('click', () => {
        setExpandedPincodes(prev => new Set([...prev, g.pin]));
        setShowAllDealers(false);
      });
      marker.addTo(map);
      pincodeLyrRef.current.push(marker);

      // NOTE: the permanent floating "area · PIN · sales" labels were removed —
      // at the pincode drill level they overlapped heavily and cluttered the
      // map. The dot marker still conveys where sales are (amber) and hovering
      // it shows the full area name, PIN, sales, dealer count & % of target.
    }
    // NOTE: districtData is intentionally NOT in the deps — it's declared
    // later in the component, so listing it here would hit a temporal-dead-zone
    // ReferenceError during render. focusArea + selectedMonthIdx already cover
    // the cases where the district's dealers change.
  }, [leafletReady, drillLevel, selectedCity, cityData, periodSig, mapZoom, dealers, focusArea]);

  // ── Lazy-load India DISTRICT GeoJSON (only when first drill-down) ────────
  useEffect(() => {
    if(drillLevel !== 'state' || districtGeoRef.current) return;
    const SOURCES = [
      'https://raw.githubusercontent.com/datameet/maps/master/Districts/Census_2011/2011_Dist.geojson',
      'https://raw.githubusercontent.com/geohacker/india/master/district/india_district.geojson',
      'https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_DISTRICTS.geojson',
    ];
    (async () => {
      for(const url of SOURCES){
        try {
          const res = await fetch(url);
          if(!res.ok) continue;
          const data = await res.json();
          if(data?.features?.length){
            districtGeoRef.current = data;
            setDistrictsReady(true);
            return;
          }
        } catch {}
      }
      console.warn('Could not load district GeoJSON from any source');
    })();
  }, [drillLevel]);

  // ── District-name property resolver (sources use different keys) ─────────
  const getDistrictName = feature => {
    const p = feature?.properties || {};
    return p.DISTRICT || p.district || p.dtname || p.NAME_2 || p.name || p.District || p.NAME || '';
  };
  const getDistrictStateName = feature => {
    const p = feature?.properties || {};
    return normalizeState(p.ST_NM || p.st_nm || p.NAME_1 || p.statename || p.state || p.STATE);
  };
  // Build a district focusArea (holes + bounds) from a GeoJSON feature — used
  // by both the click handler and URL-restore.
  const buildDistrictFocus = (feature, name) => {
    const geom = feature?.geometry, holes = [];
    if(geom?.type === 'Polygon')           geom.coordinates.forEach((r,i)=>{ if(i===0) holes.push(r); });
    else if(geom?.type === 'MultiPolygon') geom.coordinates.forEach(p=>holes.push(p[0]));
    if(!holes.length) return null;
    let minLat=90, maxLat=-90, minLng=180, maxLng=-180;
    holes.forEach(r => r.forEach(([lng,lat]) => {
      if(lat<minLat) minLat=lat; if(lat>maxLat) maxLat=lat;
      if(lng<minLng) minLng=lng; if(lng>maxLng) maxLng=lng;
    }));
    return { type:'district', name, holes, boundsArr:[[minLat,minLng],[maxLat,maxLng]] };
  };

  // ── Reflect the drill state into the URL (so a link opens that view) ──────
  useEffect(() => {
    if(!restoredRef.current) return;   // don't overwrite the URL before we restore
    const params = new URLSearchParams();
    if(selected) params.set('st', selected);
    if(focusArea?.type === 'district') params.set('dt', focusArea.name);
    if(selectedCity) params.set('ar', selectedCity);
    const qs = params.toString();
    const base = (window.location.hash.split('?')[0]) || '#/map';
    const newHash = base + (qs ? '?' + qs : '');
    if(window.location.hash !== newHash){
      try { window.history.replaceState(null, '', newHash); } catch {}
    }
  }, [selected, focusArea, selectedCity]);

  // ── Restore drill state FROM the URL on load ─────────────────────────────
  useEffect(() => {
    if(restoredRef.current || !geoReady) return;
    restoredRef.current = true;
    const qi = window.location.hash.indexOf('?');
    if(qi < 0) return;
    const p = new URLSearchParams(window.location.hash.slice(qi + 1));
    const st = p.get('st');
    if(st){
      setSelected(st);
      pendingDrillRef.current = { dt: p.get('dt'), ar: p.get('ar') };
    }
  }, [geoReady]);

  // After the district geojson loads, open the pending district + area.
  useEffect(() => {
    const pend = pendingDrillRef.current;
    if(!pend || !selected) return;
    if(pend.dt){
      if(!districtsReady || !districtGeoRef.current) return;
      const feat = districtGeoRef.current.features.find(f =>
        (getDistrictName(f) || '').toLowerCase().trim() === pend.dt.toLowerCase().trim() &&
        (getDistrictStateName(f) || '').toLowerCase() === selected.toLowerCase());
      if(feat){
        const fa = buildDistrictFocus(feat, getDistrictName(feat));
        if(fa){ setFocusArea(fa); if(pend.ar) setSelectedCity(pend.ar); }
      }
      pendingDrillRef.current = null;
    } else if(pend.ar){
      setSelectedCity(pend.ar);
      pendingDrillRef.current = null;
    }
  }, [districtsReady, selected]);

  // Sub-district (taluka) property resolvers.
  const getSubName = feature => {
    const p = feature?.properties || {};
    return p.SUB_DIST || p.subdistrict || p.SUBDISTRICT || p.sdtname || p.TEHSIL || p.tehsil ||
           p.taluk || p.TALUK || p.NAME_3 || p.name || '';
  };
  const getSubParentDistrict = feature => {
    const p = feature?.properties || {};
    return p.DISTRICT || p.district || p.dtname || p.NAME_2 || p.District || '';
  };

  // ── Lazy-load India SUB-DISTRICT (taluka) GeoJSON — only when a district is
  //    opened. If no source has it, we silently keep the pincode markers. ──────
  useEffect(() => {
    if(focusArea?.type !== 'district' || subGeoRef.current) return;
    const SOURCES = [
      'https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIAN_SUB_DISTRICTS.geojson',
    ];
    (async () => {
      for(const url of SOURCES){
        try {
          const res = await fetch(url);
          if(!res.ok) continue;
          const data = await res.json();
          if(data?.features?.length){ subGeoRef.current = data; setSubReady(true); return; }
        } catch {}
      }
      console.warn('[MAP] sub-district (taluka) GeoJSON unavailable — showing pincode markers instead');
    })();
  }, [focusArea]);

  // ── Aggregate dealers per district (by matching dealer.city to district) ──
  const districtData = useMemo(() => {
    if(!selected || !districtsReady || !districtGeoRef.current) return {};
    const stateLower = selected.toLowerCase();
    // index dealer cities for fast lookup
    const cityMap = {};
    (stateData[stateLower]?.dealers || []).forEach(d => {
      const c = (d.city || '').trim().toLowerCase();
      if(!c) return;
      if(!cityMap[c]) cityMap[c] = [];
      cityMap[c].push(d);
    });
    const out = {};
    districtGeoRef.current.features.forEach(f => {
      const stateName = getDistrictStateName(f);
      if(!stateName || stateName.toLowerCase() !== stateLower) return;
      const dname = (getDistrictName(f) || '').trim();
      if(!dname) return;
      const key = dname.toLowerCase();
      const matched = cityMap[key] || [];
      // also catch dealer cities that contain the district name (e.g. "Ahmedabad West")
      Object.keys(cityMap).forEach(c => {
        if(c !== key && (c.includes(key) || key.includes(c)) && c.length > 3) {
          cityMap[c].forEach(d => { if(!matched.includes(d)) matched.push(d); });
        }
      });
      let total = 0, target = 0, prev = 0;
      matched.forEach(d => {
        total  += achOf(d);
        target += tgtOf(d);
        prev   += prevOf(d);
      });
      out[key] = { name:dname, dealers:matched, total, target, prev };
    });
    return out;
  }, [selected, districtsReady, stateData, periodSig]);

  const maxDistrictVal = useMemo(
    () => Math.max(1, ...Object.values(districtData).map(d => d.total)),
    [districtData]
  );
  const maxDistrictDiff = useMemo(
    () => Math.max(1, ...Object.values(districtData).map(d => Math.abs(d.total - (d.prev || 0)))),
    [districtData]
  );

  // ── Render DISTRICT polygons + labels when drilled into a state ──────────
  useEffect(() => {
    if(!leafletReady || !mapObjRef.current) return;
    const L = window.L, map = mapObjRef.current;

    if(districtLyrRef.current){ districtLyrRef.current.remove(); districtLyrRef.current = null; }
    districtLblRef.current.forEach(l => { try { l.remove(); } catch {} });
    districtLblRef.current = [];

    if(drillLevel !== 'state' || !showDistricts || !districtsReady || !districtGeoRef.current) return;

    const stateLower = selected.toLowerCase();
    const stateFeatures = districtGeoRef.current.features.filter(f => {
      const sn = getDistrictStateName(f);
      return sn && sn.toLowerCase() === stateLower;
    });
    if(stateFeatures.length === 0) return;

    const districtLayer = L.geoJSON({ type:'FeatureCollection', features:stateFeatures }, {
      pane: 'districtPane',
      style: feature => {
        const dname = (getDistrictName(feature) || '').toLowerCase();
        if(focusArea?.type === 'district'){
          // Hide every other district…
          if(focusArea.name.toLowerCase() !== dname) return { opacity:0, fillOpacity:0, weight:0 };
          // …and show the opened district as a clean edge only (no fill), so
          // its inner detail/markers read clearly.
          return { color:T.acc, weight:2.5, dashArray:'', fillColor:'transparent', fillOpacity:0, opacity:1 };
        }
        const d     = districtData[dname];
        const ratio = d && maxDistrictVal ? d.total / maxDistrictVal : 0;
        const inTerr = territory.some(r => r.key === 'district:' + dname);
        return {
          // BI style: solid thin black borders + red↔green diverging fill
          // (low/zero = red, high = green) so every district reads as a heat cell.
          // Trend: red = fell, green = grew vs the previous period.
          color: inTerr ? '#2563eb' : '#333333',
          weight: inTerr ? 3 : 0.9,
          dashArray: inTerr ? '6 4' : '',
          fillColor: trendLive ? colorForGrowth(d ? d.total - (d.prev || 0) : 0, maxDistrictDiff) : colorForRatio(d && d.total > 0 ? ratio : 0),
          fillOpacity: 0.9,
          opacity: 1,
        };
      },
      onEachFeature: (feature, layer) => {
        const dname = getDistrictName(feature) || '—';
        const key   = dname.toLowerCase();
        const d     = districtData[key];
        const total = d?.total || 0;
        const cnt   = d?.dealers?.length || 0;
        const tgt   = d?.target || 0;
        const pctv  = tgt ? Math.round((total/tgt)*100) : 0;
        const diff  = total - (d?.prev || 0);
        layer.bindTooltip(
          '<div style="font-family:Inter,system-ui;background:#0c0c1e;border-radius:8px;padding:9px 12px;min-width:160px;color:#e2e0f0">' +
          '<div style="font-size:12px;font-weight:800;color:'+T.acc+';margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #1e1e38">' + dname + ' District</div>' +
          '<div style="font-size:11px;color:#a5a4b8;margin-bottom:2px"><b style="color:#f59e0b">Sales :</b> V : ' + fmtIN(total) + '</div>' +
          '<div style="font-size:11px;color:#a5a4b8"><b style="color:#f59e0b">Dealers :</b> ' + cnt + (tgt ? ' | ' + pctv + '% of target' : '') + '</div>' +
          (period.prevFull ? '<div style="font-size:11px;color:#a5a4b8;margin-top:2px"><b style="color:#e2e0f0">vs ' + period.prevLabel + ' :</b> <b style="color:' + (diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : '#a5a4b8') + '">' + signed(diff) + '</b></div>' : '') +
          (territoryModeRef.current ? '<div style="font-size:10px;color:#93c5fd;margin-top:5px">Tap to add to / remove from the territory</div>' : '') +
          (cnt === 0 ? '<div style="font-size:10px;color:#6c6b85;margin-top:5px;padding-top:4px;border-top:1px dashed #1e1e38">No dealers in this district yet</div>' : '') +
          '</div>',
          { sticky:true, opacity:1, className:'stp-tooltip', direction:'top' }
        );
        layer.on({
          mouseover: e => { e.target.setStyle({ weight:2.5, fillOpacity:0.75, dashArray:'' }); setHoverDistrict(dname); },
          mouseout:  e => { if(districtLyrRef.current) districtLyrRef.current.resetStyle(e.target); setHoverDistrict(null); },
          // Open (isolate) the clicked district as its own map view —
          // or, in Territory mode, add/remove it from the territory.
          click:     e => {
            if(territoryModeRef.current && focusArea?.type !== 'district'){
              toggleTerritoryRef.current('district', dname, d?.dealers || []);
              return;
            }
            const geom = feature.geometry, holes = [];
            if(geom?.type === 'Polygon')           geom.coordinates.forEach((r,i)=>{ if(i===0) holes.push(r); });
            else if(geom?.type === 'MultiPolygon') geom.coordinates.forEach(p=>holes.push(p[0]));
            if(!holes.length) return;
            // Bounds straight from the ring coords (reliable, no Leaflet dep).
            let minLat=90, maxLat=-90, minLng=180, maxLng=-180;
            holes.forEach(r => r.forEach(([lng,lat]) => {
              if(lat<minLat) minLat=lat; if(lat>maxLat) maxLat=lat;
              if(lng<minLng) minLng=lng; if(lng>maxLng) maxLng=lng;
            }));
            setSelectedCity(null);
            setFocusArea({ type:'district', name:dname, holes, boundsArr:[[minLat,minLng],[maxLat,maxLng]] });
          },
        });
      },
    }).addTo(map);
    districtLyrRef.current = districtLayer;

    // District name labels — small, light
    stateFeatures.forEach(f => {
      try {
        const dname = getDistrictName(f);
        if(!dname) return;
        if(focusArea?.type === 'district' && dname.toLowerCase() !== focusArea.name.toLowerCase()) return;
        const tmp = L.geoJSON(f);
        const center = tmp.getBounds().getCenter();
        const d = districtData[dname.toLowerCase()];
        const label = L.tooltip({
          permanent:true, direction:'center',
          className:'stp-state-label', interactive:false, opacity:1,
        })
        .setContent(
          '<div class="stp-state-label-inner" style="font-size:10px">' + dname +
          (trendLive
            ? (d && d.total - (d.prev || 0) !== 0 ? '<span class="lbl-val" style="font-size:9px' + (d.total < (d.prev || 0) ? ';color:#dc2626' : '') + '">' + signed(d.total - (d.prev || 0)) + '</span>' : '')
            : (d && d.total > 0 ? '<span class="lbl-val" style="font-size:9px">' + fmtIN(d.total) + '</span>' : '')) +
          '</div>'
        )
        .setLatLng(center);
        label.addTo(map);
        districtLblRef.current.push(label);
      } catch {}
    });
  }, [leafletReady, drillLevel, selected, showDistricts, districtsReady, districtData, maxDistrictVal, maxDistrictDiff, focusArea, trendLive, territorySig]);

  // ── Render SUB-DISTRICT (taluka) AREAS when a district is opened ──────────
  // Shows each taluka's border + name, heat-colored by the sales of dealers
  // whose city matches that taluka. Falls back silently if data isn't loaded.
  useEffect(() => {
    if(!leafletReady || !mapObjRef.current) return;
    const L = window.L, map = mapObjRef.current;
    if(subLyrRef.current){ try { subLyrRef.current.remove(); } catch {} subLyrRef.current = null; }
    subLblRef.current.forEach(l => { try { l.remove(); } catch {} });
    subLblRef.current = [];

    if(focusArea?.type !== 'district' || !subReady || !subGeoRef.current) return;

    const distLower = focusArea.name.toLowerCase().trim();
    let feats = subGeoRef.current.features.filter(f =>
      (getSubParentDistrict(f) || '').toLowerCase().trim() === distLower);
    // Fallback: if district names don't line up between the two datasets,
    // keep sub-districts whose centre falls inside the opened district bounds.
    if(!feats.length && focusArea.boundsArr){
      const [[s,w],[n,e]] = focusArea.boundsArr;
      feats = subGeoRef.current.features.filter(f => {
        try { const c = L.geoJSON(f).getBounds().getCenter();
          return c.lat>=s && c.lat<=n && c.lng>=w && c.lng<=e; } catch { return false; }
      });
    }
    if(!feats.length) return;

    // Sales per taluka — match dealer.city to the taluka name.
    const dealersInDist = districtData[distLower]?.dealers || [];
    const salesBySub = {};
    dealersInDist.forEach(d => {
      const c = (d.city || '').trim().toLowerCase();
      if(!c) return;
      salesBySub[c] = (salesBySub[c] || 0) + achOf(d);
    });
    const maxSub = Math.max(1, ...Object.values(salesBySub));

    const layer = L.geoJSON({ type:'FeatureCollection', features:feats }, {
      pane: 'districtPane',
      style: f => {
        const sales = salesBySub[(getSubName(f) || '').toLowerCase()] || 0;
        return { color:'#333333', weight:0.7, fillColor: colorForRatio(sales > 0 ? sales/maxSub : 0), fillOpacity:0.85, opacity:1 };
      },
      onEachFeature: (f, lyr) => {
        const sn = getSubName(f) || '—';
        const sales = salesBySub[(sn || '').toLowerCase()] || 0;
        lyr.bindTooltip(
          '<div style="font-family:Inter,system-ui;background:#fff;color:#0f172a;border-radius:8px;padding:8px 11px;min-width:130px">' +
          '<div style="font-weight:800;margin-bottom:3px">' + sn + '</div>' +
          '<div style="font-size:11px;color:#475569">Sales : <b style="color:'+T.acc+'">' + fmtIN(sales) + '</b></div>' +
          '<div style="font-size:9px;color:#94a3b8;margin-top:4px">Click to open this area →</div></div>',
          { sticky:true, opacity:1, className:'stp-tooltip', direction:'top' }
        );
        lyr.on({
          mouseover: ev => { ev.target.setStyle({ weight:2, color:'#111827' }); try{ ev.target.bringToFront(); }catch{} },
          mouseout:  ev => { if(subLyrRef.current) subLyrRef.current.resetStyle(ev.target); },
          // Open (drill into) the clicked area — surfaces its dealers/pincodes
          // and zooms to it.
          click: ev => {
            setSelectedCity(sn);
            try { map.fitBounds(ev.target.getBounds(), { padding:[30,30], maxZoom:12 }); } catch {}
          },
        });
      },
    }).addTo(map);
    subLyrRef.current = layer;

    feats.forEach(f => {
      try {
        const sn = getSubName(f); if(!sn) return;
        const center = L.geoJSON(f).getBounds().getCenter();
        const lbl = L.tooltip({ permanent:true, direction:'center', className:'stp-state-label', interactive:false, opacity:1 })
          .setContent('<div class="stp-state-label-inner" style="font-size:8px">' + sn + '</div>')
          .setLatLng(center);
        lbl.addTo(map);
        subLblRef.current.push(lbl);
      } catch {}
    });
  }, [leafletReady, focusArea, subReady, districtData, periodSig]);

  const districtList = useMemo(
    () => Object.values(districtData).sort((a,b) => b.total - a.total),
    [districtData]
  );
  const districtsWithSales = districtList.filter(d => d.total > 0).length;

  const backToIndia = () => {
    setSelected(null);
    setSelectedCity(null);
    setFocusArea(null);
    try {
      if(mapObjRef.current){
        mapObjRef.current.setMaxBounds(null);   // release the state lock
        // Re-fit to the country rather than restoring the fixed zoom 4.4,
        // which framed far more than India on wide panels.
        const b = stateLyrRef.current?.getBounds?.();
        if(b && b.isValid()) mapObjRef.current.fitBounds(b, { padding:[12,12] });
        else mapObjRef.current.setView([22, 80], 4.4);
      }
    } catch {}
  };

  // Step up ONE drill level: taluka/city → district → state → India.
  const goBackOneStep = () => {
    if(selectedCity){
      setSelectedCity(null);
      if(focusArea?.type === 'city') setFocusArea(null);
      return;
    }
    if(focusArea){ setFocusArea(null); return; }   // district → state
    if(selected){ backToIndia(); return; }          // state → India
  };
  const canGoBack = !!(selected || focusArea || selectedCity);

  const selectedCityObj = selectedCity ? cityData.find(c => c.name.toLowerCase() === selectedCity.toLowerCase()) : null;
  // The opened district's aggregated data ({ name, dealers, total, target }).
  const districtObj = focusArea?.type === 'district' ? districtData[focusArea.name.toLowerCase()] : null;

  // KPI tiles → "List customers" popup, same dealers the KPI counted.
  const kpiList = selected ? (stateData[selected.toLowerCase()]?.dealers || []) : dealers;
  const openList = (bucket) => {
    const where = selected || 'All India';
    const names = { active:'Active', star:'Star', inactive:'Inactive', lost:'Lost', billed:'Billed', all:'All dealers' };
    const rows = bucket === 'all'    ? kpiList
               : bucket === 'billed' ? kpiList.filter(d => achOf(d) > 0)
               :                       kpiList.filter(d => bucketOf(d) === bucket);
    setListQ('');
    setListView({ title: names[bucket] + ' · ' + where, dealers: rows });
  };

  // ── Summary box data — scoped to the CURRENT view (district → city → state → India)
  const viewDealers =
      focusArea?.type === 'district' ? (districtObj?.dealers || [])
    : selectedCity                   ? (selectedCityObj?.dealers || [])
    : selected                       ? (stateData[selected.toLowerCase()]?.dealers || [])
    :                                  (dealers || []);
  const viewLabel =
      focusArea?.type === 'district' ? focusArea.name + ' district'
    : selectedCity                   ? selectedCity
    : selected                       ? selected
    :                                  'All India';
  const viewSales   = viewDealers.reduce((s,d)=>s+achOf(d),0);
  const viewBilled  = viewDealers.filter(d=>achOf(d)>0).length;
  const viewSalesmen= [...new Set(viewDealers.map(d=>d.salesman).filter(Boolean))];
  const viewZones   = [...new Set(viewDealers.map(d=>(d.zone||'').trim()).filter(Boolean))];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={"fade stp-mapview" + (lightMap ? " lightmap" : "")} style={{padding:0, color:T.t1}}>
      <PageHead icon={MapIcon} tone="#0891b2" eyebrow="Dealer Geography" title="Map View"/>
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:10, flexWrap:'wrap'}}>
        {canGoBack && (
          <button onClick={goBackOneStep} title="Go back one step"
            style={{display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:700,
              background:'var(--bg2)', color:T.t1, border:'1px solid var(--bd2)',
              borderRadius:8, padding:'4px 10px', cursor:'pointer', marginRight:4}}>
            <ArrowLeft size={13}/> Back
          </button>
        )}
        <Globe size={14} color={T.acc}/>
        <span style={{color: selected ? T.acc : T.t1, fontSize:13, fontWeight:700, cursor:'pointer'}} onClick={backToIndia}>India</span>
        {selected && (
          <>
            <ChevronRight size={13} color={T.t3}/>
            {/* State — click to go back to the state view */}
            <span style={{color: (selectedCity||focusArea) ? T.acc : T.t1, fontSize:13, fontWeight:800, cursor:'pointer'}}
              onClick={() => { setSelectedCity(null); setFocusArea(null); }}>{selected}</span>
          </>
        )}
        {focusArea?.type === 'district' && (
          <>
            <ChevronRight size={13} color={T.t3}/>
            {/* District — click to (re)open the district view: clear the area
                AND zoom the map back to the district. */}
            <span style={{color: selectedCity ? T.acc : T.t1, fontSize:13, fontWeight:800, cursor:'pointer'}}
              onClick={() => {
                setSelectedCity(null);
                try {
                  const map = mapObjRef.current, L = window.L;
                  if(map && L && focusArea?.boundsArr){
                    const b = L.latLngBounds(focusArea.boundsArr);
                    map.setMaxBounds(b.pad(0.15));
                    map.fitBounds(b, { padding:[20,20], maxZoom:10 });
                  }
                } catch {}
              }}>{focusArea.name} <span style={{fontWeight:500, color:T.t3}}>District</span></span>
          </>
        )}
        {selectedCity && (
          <>
            <ChevronRight size={13} color={T.t3}/>
            {/* Area / taluka — the current level */}
            <span style={{color:T.t1, fontSize:13, fontWeight:800}}>{selectedCity}</span>
          </>
        )}
        {selected && (
          <button onClick={backToIndia} style={{
            marginLeft:6, background:T.bg2, border:'1px solid '+T.bd2,
            borderRadius:5, color:T.t2, padding:'3px 8px', fontSize:11,
            cursor:'pointer', display:'flex', alignItems:'center', gap:3, fontWeight:600,
          }}><ArrowLeft size={11}/>Back to India</button>
        )}
        <div style={{flex:1}}/>
        {/* ── Duration: preset or custom month range ── */}
        <div className="stp-period">
          <CalendarRange size={14} color={T.acc}/>
          <select value={periodKey} onChange={e => {
              const k = e.target.value;
              if(k === 'custom' && customFrom === null){ setCustomFrom(period.idx[0]); setCustomTo(period.idx[period.idx.length-1]); }
              setPeriodKey(k);
            }} title="Period" style={{background:T.bg1, color:T.t1, border:'1px solid '+T.bd2, borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, cursor:'pointer'}}>
            {PERIODS.map(([k,l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          {periodKey === 'custom' && (<>
            <select value={customFrom ?? period.idx[0]} onChange={e => setCustomFrom(+e.target.value)} style={{background:T.bg1, color:T.t1, border:'1px solid '+T.bd2, borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, cursor:'pointer'}}>
              {MO.map((m,i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <span style={{color:T.t3, fontSize:12}}>to</span>
            <select value={customTo ?? period.idx[period.idx.length-1]} onChange={e => setCustomTo(+e.target.value)} style={{background:T.bg1, color:T.t1, border:'1px solid '+T.bd2, borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, cursor:'pointer'}}>
              {MO.map((m,i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </>)}
          <b style={{color:T.acc, fontSize:12, whiteSpace:'nowrap'}}>{period.label}</b>
        </div>
      </div>

      {/* ── KPI Cards Row ─────────────────────────────────────────────── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
        gap:10, marginBottom:10,
      }}>
        <KpiGroup title={selected ? (selected + ' — Dealers') : 'Dealers'} accent={T.blue}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6}}>
            <KpiCell label="Active"   value={kpis.active}   color="var(--grn)" onClick={() => openList('active')}/>
            <KpiCell label="Star"     value={kpis.star}     color={T.hot2}      onClick={() => openList('star')}/>
            <KpiCell label="Inactive" value={kpis.inactive} color={T.t2}        onClick={() => openList('inactive')}/>
            <KpiCell label="Lost"     value={kpis.lost}     color={T.hot}       onClick={() => openList('lost')}/>
          </div>
        </KpiGroup>

        <KpiGroup title={selected ? 'In ' + selected : 'Selected'} accent={T.hot2}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
            <KpiCell label="Billed" value={fmtIN(kpis.qty)} color="var(--grn)" onClick={() => openList('billed')} sub="dealers who bought"/>
            <KpiCell label="Value"  value={fmtIN(kpis.sales)} color="var(--grn)" onClick={() => openList('all')}
              sub={period.prevFull ? <span style={{color:kpis.sales>=kpis.prev?'var(--grn)':'var(--red)',fontWeight:700}}>{signed(kpis.sales-kpis.prev)} vs {period.prevLabel}</span> : null}/>
          </div>
        </KpiGroup>

        <KpiGroup title={selected ? 'Cities (' + cityData.length + ')' : 'Average (' + Object.keys(stateData).length + ')'} accent={T.cyan}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
            {selected ? (
              <>
                <KpiCell label="Total" value={cityData.length} color={T.cyan}/>
                <KpiCell label="Top"   value={cityData[0]?.name || '—'} color="var(--grn)" sub={cityData[0] ? fmtIN(cityData[0].total) : null}/>
              </>
            ) : (
              <>
                <KpiCell label="Qty"   value={kpis.total ? Math.round(kpis.qty / Math.max(Object.keys(stateData).length,1)) : 0} color={T.cyan}/>
                <KpiCell label="Value" value={fmtIN(kpis.avgSales)} color="var(--grn)" sub={kpis.ach ? kpis.ach + '% of target' : null}/>
              </>
            )}
          </div>
        </KpiGroup>
      </div>

      {/* ── Split: map (left) + data panels (right) ─────────────────────── */}
      <div className="stp-split">
      {/* ── Map Card ──────────────────────────────────────────────────── */}
      <div className="card" style={{
        padding:0,
        overflow:'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          padding:'10px 14px', background:T.bg2,
          borderBottom:'1px solid '+T.bd1,
          display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
        }}>
          {/* Hub filter — scopes the whole map to a hub's states */}
          <select
            value={hub}
            onChange={e => setHub(e.target.value)}
            title="Filter by hub"
            style={{
              background: hub ? T.acc : T.bg1, color: hub ? '#fff' : T.t1,
              border:'1px solid '+(hub ? T.acc : T.bd2),
              borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, cursor:'pointer',
            }}>
            <option value="">🏢 All Hubs</option>
            {Object.keys(HUBS).map(h => <option key={h} value={h}>{h}</option>)}
          </select>

          {/* Searchable city picker — shown when a state is selected */}
          {drillLevel === 'state' && cityData.length > 0 && (() => {
            const ql = citySearch.trim().toLowerCase();
            const opts = (ql ? cityData.filter(c => c.name.toLowerCase().includes(ql)) : cityData).slice(0, 300);
            const hl = (name) => {
              if(!ql) return name;
              const i = name.toLowerCase().indexOf(ql);
              if(i < 0) return name;
              return <>{name.slice(0,i)}<b style={{color:T.acc}}>{name.slice(i, i+ql.length)}</b>{name.slice(i+ql.length)}</>;
            };
            const pickCity = (c) => {
              setSelectedCity(c.name);
              const coords = CITY_COORDS[c.name.toLowerCase()];
              if(coords){ const [lat,lng]=coords, dlt=0.25;
                setFocusArea({ type:'city', name:c.name,
                  holes:[[[lng-dlt,lat-dlt],[lng+dlt,lat-dlt],[lng+dlt,lat+dlt],[lng-dlt,lat+dlt],[lng-dlt,lat-dlt]]],
                  boundsArr:[[lat-dlt,lng-dlt],[lat+dlt,lng+dlt]] });
              }
              setCityPickOpen(false); setCitySearch('');
            };
            return (
              <div ref={cityPickRef} style={{position:'relative', width:180}}>
                <button type="button" onClick={()=>setCityPickOpen(o=>!o)}
                  style={{display:'flex', alignItems:'center', gap:6, width:'100%', textAlign:'left', cursor:'pointer',
                    background:T.bg1, color: selectedCity ? T.t1 : T.t3, border:'1px solid '+T.bd2,
                    borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:600}}>
                  <MapPin size={12} style={{color:T.acc, flexShrink:0}}/>
                  <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{selectedCity || 'Select city'}</span>
                  {selectedCity && <X size={13} style={{color:T.t3, flexShrink:0}} onClick={(e)=>{ e.stopPropagation(); setSelectedCity(null); setFocusArea(null); }}/>}
                  <ChevronDown size={13} style={{color:T.t3, flexShrink:0, transform: cityPickOpen?'rotate(180deg)':'none', transition:'transform .15s'}}/>
                </button>
                {cityPickOpen && (
                  <div style={{position:'absolute', top:'calc(100% + 5px)', left:0, right:0, zIndex:100000,
                    background:T.bg1, border:'1px solid '+T.bd2, borderRadius:10, boxShadow:'0 14px 34px rgba(0,0,0,0.5)', overflow:'hidden', minWidth:220}}>
                    <div style={{padding:6, borderBottom:'1px solid '+T.bd1}}>
                      <input autoFocus value={citySearch} onChange={e=>setCitySearch(e.target.value)}
                        placeholder="Search city…"
                        style={{width:'100%', background:T.bg2, color:T.t1, border:'1px solid '+T.bd2, borderRadius:7, padding:'7px 9px', fontSize:12}}/>
                    </div>
                    <div style={{maxHeight:260, overflowY:'auto'}}>
                      {opts.length === 0
                        ? <div style={{padding:'10px 12px', fontSize:11.5, color:T.t3}}>No matching city</div>
                        : opts.map(c => (
                          <div key={c.name} onClick={()=>pickCity(c)}
                            style={{display:'flex', alignItems:'center', gap:8, padding:'9px 12px', fontSize:12.5, cursor:'pointer',
                              color:T.t1, borderBottom:'1px solid '+T.bd1,
                              background: selectedCity===c.name ? T.bg2 : 'transparent'}}
                            onMouseEnter={e=>e.currentTarget.style.background=T.bg2}
                            onMouseLeave={e=>e.currentTarget.style.background = selectedCity===c.name?T.bg2:'transparent'}>
                            <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{hl(c.name)}</span>
                            <span style={{fontSize:11, fontWeight:700, color:T.acc}}>{fmtIN(c.total)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <select
            value={viewMode}
            onChange={e => setViewMode(e.target.value)}
            disabled={drillLevel === 'state'}
            style={{
              background:T.bg1, color:T.t1, border:'1px solid '+T.bd2,
              borderRadius:6, padding:'5px 10px', fontSize:12, fontWeight:600,
              cursor: drillLevel === 'state' ? 'not-allowed' : 'pointer',
              opacity: drillLevel === 'state' ? 0.5 : 1,
              minWidth:110,
            }}
          >
            <option value="sales">Sales</option>
            <option value="dealers">Dealers</option>
            <option value="achievement">Achievement %</option>
          </select>

          <ToolBtn active={trendLive} icon={TrendingUp} label="Trend" disabled={!period.prevFull}
            onClick={() => setTrendOn(t => !t)}/>
          <ToolBtn active={territoryMode} icon={Shapes} label="Territory" onClick={() => setTerritoryMode(t => !t)}/>
          <ToolBtn active={showNames}  icon={Type}      label="Name"   onClick={() => setShowNames(s => !s)}/>
          <ToolBtn active={showCount}  icon={Hash}      label="Count"  onClick={() => setShowCount(s => !s)}/>
          <ToolBtn active={showLabels} icon={Layers}    label="Labels" onClick={() => setShowLabels(s => !s)}/>
          <ToolBtn active={showPlaces} icon={MapPin}    label="Places" onClick={() => setShowPlaces(s => !s)}/>
          {drillLevel === 'state' && (
            <ToolBtn active={showDistricts} icon={Layers} label="Districts" onClick={() => setShowDistricts(s => !s)}/>
          )}
          <ToolBtn active={lightMap} icon={Sun} label="Light" onClick={() => setLightMap(s => !s)}/>

          <div style={{flex:1}}/>

          {/* Salesman filter — only his months count (month ownership) */}
          {salesmanOptions.length > 1 && (
            <select value={smFilter} onChange={e => setSmFilter(e.target.value)} title="Filter by salesman"
              style={{background: smFilter ? T.acc : T.bg1, color: smFilter ? '#fff' : T.t1,
                border:'1px solid '+(smFilter ? T.acc : T.bd2), borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, cursor:'pointer'}}>
              <option value="">👤 All Salesmen</option>
              {salesmanOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}

          {/* ── Category filters (top-right): Dealer Type + legacy Category ── */}
          {/* Dealer Type filter — scopes map/summary/lists/heat to one dealer type */}
          <select
            value={dealerTypeFilter}
            onChange={e => setDealerTypeFilter(e.target.value)}
            title="Filter by dealer type"
            style={{
              background: dealerTypeFilter ? T.acc : T.bg1, color: dealerTypeFilter ? '#fff' : T.t1,
              border:'1px solid '+(dealerTypeFilter ? T.acc : T.bd2),
              borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, cursor:'pointer',
            }}>
            <option value="">🏷️ All Dealer Types</option>
            {DEALER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Category filter — legacy category field (shown only if data has categories) */}
          {categoryOptions.length > 0 && (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              title="Filter by category"
              style={{
                background: categoryFilter ? T.acc : T.bg1, color: categoryFilter ? '#fff' : T.t1,
                border:'1px solid '+(categoryFilter ? T.acc : T.bd2),
                borderRadius:8, padding:'6px 10px', fontSize:12, fontWeight:700, cursor:'pointer',
              }}>
              <option value="">📂 All Categories</option>
              {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          {drillLevel === 'state' ? (
            <span style={{fontSize:11, color:T.acc, fontWeight:600, display:'flex', alignItems:'center', gap:4}}>
              <MapPin size={12}/> Showing city-wise sales — click a city marker
            </span>
          ) : (
            <span style={{fontSize:11, color:T.t3}}>hover for details • click a state to drill in</span>
          )}
        </div>

        {/* Map area */}
        <div style={{position:'relative', background:T.bg0}}>
          <div ref={mapRef} style={{height:'clamp(300px, 46vw, 460px)', width:'100%', background:lightMap ? '#eef2f0' : T.bg0}}/>

          {/* ── Right-side dealer detail panel ────────────────────────
              Shows when the user clicks a dealer in the accordion or a
              pincode marker's popup. Slides in from the right without
              covering the map. */}
          {detailDealer && (() => {
            const d = detailDealer;
            // Haversine distance to every other dealer with lat/lng, sorted.
            const nearby = (() => {
              if (!Number.isFinite(d.locLat) || !Number.isFinite(d.locLng)) return [];
              const toRad = deg => deg * Math.PI / 180;
              const R = 6371;
              const hav = (aLat, aLng, bLat, bLng) => {
                const dLat = toRad(bLat - aLat);
                const dLng = toRad(bLng - aLng);
                const s = Math.sin(dLat/2)**2 + Math.cos(toRad(aLat))*Math.cos(toRad(bLat))*Math.sin(dLng/2)**2;
                return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1-s));
              };
              return dealers
                .filter(x => x.id !== d.id && Number.isFinite(x.locLat) && Number.isFinite(x.locLng))
                .map(x => ({...x, _dist: hav(d.locLat, d.locLng, x.locLat, x.locLng)}))
                .filter(x => x._dist <= 15)
                .sort((a,b) => a._dist - b._dist)
                .slice(0, 8);
            })();
            const ach = achOf(d);
            const tgt = tgtOf(d);
            return (
              <div style={{
                position:'absolute', top:12, right:12, bottom:12, width:360, maxWidth:'92%',
                background:'var(--bg1)', border:'1px solid '+T.bd1, borderRadius:12,
                boxShadow:'0 20px 40px rgba(0,0,0,0.5)',
                display:'flex', flexDirection:'column', zIndex:400,
                overflow:'hidden',
              }}>
                {/* Header */}
                <div style={{padding:'12px 14px', borderBottom:'1px solid '+T.bd1, display:'flex', alignItems:'center', gap:8}}>
                  {d.city && (
                    <span style={{fontSize:10, padding:'3px 8px', borderRadius:5, background:'color-mix(in srgb, var(--acc) 15%, transparent)', color:'var(--acc)', fontWeight:800, textTransform:'uppercase', letterSpacing:'.05em'}}>{d.city}</span>
                  )}
                  {d.state && (
                    <span style={{fontSize:10, padding:'3px 8px', borderRadius:5, background:T.bg2, color:T.t2, fontWeight:600}}>{d.state}</span>
                  )}
                  <div style={{flex:1}}/>
                  <button
                    onClick={() => onOpenDealer?.(d.id)}
                    title="Open full dealer view"
                    style={{background:'transparent', border:'1px solid '+T.bd1, borderRadius:5, color:T.t3, cursor:'pointer', padding:'3px 6px'}}>
                    <ChevronRight size={12}/>
                  </button>
                  <button
                    onClick={() => setDetailDealer(null)}
                    title="Close"
                    style={{background:'transparent', border:'1px solid '+T.bd1, borderRadius:5, color:T.t3, cursor:'pointer', padding:'3px 6px'}}>
                    <X size={12}/>
                  </button>
                </div>

                {/* Scrollable body */}
                <div style={{flex:1, overflowY:'auto', padding:14, display:'flex', flexDirection:'column', gap:12}}>
                  {/* Name */}
                  <div style={{fontSize:16, fontWeight:800, color:T.t1, lineHeight:1.2}}>{d.name}</div>

                  {/* KPI grid: City, Zone, PIN, Status */}
                  <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                    <div style={{padding:'10px 12px', background:'color-mix(in srgb, var(--acc) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--acc) 25%, transparent)', borderRadius:8}}>
                      <div style={{fontSize:14, fontWeight:800, color:'var(--acc)', textTransform:'uppercase'}}>{d.city || '—'}</div>
                      <div style={{fontSize:10, color:T.t3, marginTop:2}}>City</div>
                    </div>
                    <div style={{padding:'10px 12px', background:T.bg1, border:'1px solid '+T.bd1, borderRadius:8}}>
                      <div style={{fontSize:14, fontWeight:800, color:T.t1, textTransform:'uppercase'}}>{d.zone || 'NONE'}</div>
                      <div style={{fontSize:10, color:T.t3, marginTop:2}}>Zone</div>
                    </div>
                    <div style={{padding:'10px 12px', background:T.bg1, border:'1px solid '+T.bd1, borderRadius:8, gridColumn:'span 1'}}>
                      <div style={{fontFamily:'"JetBrains Mono", monospace', fontSize:13, fontWeight:800, color:T.t1}}>{d.pincode || '—'}</div>
                      <div style={{fontSize:10, color:T.t3, marginTop:2}}>Pincode</div>
                    </div>
                    <div style={{padding:'10px 12px', background:T.bg1, border:'1px solid '+T.bd1, borderRadius:8}}>
                      <div style={{fontSize:14, fontWeight:800, color:T.t1, textTransform:'uppercase'}}>{d.status || 'NONE'}</div>
                      <div style={{fontSize:10, color:T.t3, marginTop:2}}>Status</div>
                    </div>
                  </div>

                  {/* State + Address rows */}
                  <div>
                    <div style={{display:'flex', gap:12, padding:'6px 0', borderBottom:'1px solid '+T.bd1}}>
                      <div style={{fontSize:11, color:T.t3, width:80}}>State</div>
                      <div style={{fontSize:11, color:T.t1, flex:1, textAlign:'right', fontWeight:600}}>{d.state || '—'}</div>
                    </div>
                    {d.address && (
                      <div style={{display:'flex', gap:12, padding:'6px 0', borderBottom:'1px solid '+T.bd1}}>
                        <div style={{fontSize:11, color:T.t3, width:80, flexShrink:0}}>Address</div>
                        <div style={{fontSize:11, color:T.t1, flex:1, textAlign:'right', fontWeight:500, lineHeight:1.4}}>{d.address}</div>
                      </div>
                    )}
                    <div style={{display:'flex', gap:12, padding:'6px 0', borderBottom:'1px solid '+T.bd1}}>
                      <div style={{fontSize:11, color:T.t3, width:80}}>Salesman</div>
                      <div style={{fontSize:11, color:T.t1, flex:1, textAlign:'right', fontWeight:600}}>{users?.[d.salesman]?.name || d.salesman || '—'}</div>
                    </div>
                    <div style={{display:'flex', gap:12, padding:'6px 0'}}>
                      <div style={{fontSize:11, color:T.t3, width:80}}>Sales · Tgt</div>
                      <div style={{fontSize:11, flex:1, textAlign:'right', fontWeight:700}}>
                        <span style={{color:T.acc}}>{fmtIN(ach)}</span>
                        <span style={{color:T.t3, fontWeight:400}}> / </span>
                        <span style={{color:T.t2}}>{fmtIN(tgt)}</span>
                        {tgt > 0 && (
                          <span style={{color:pclr(pct(tgt,ach)), marginLeft:6}}> · {spct(tgt, ach)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nearby parties */}
                  {nearby.length > 0 && (
                    <div style={{border:'1px solid color-mix(in srgb, var(--grn) 35%, transparent)', borderRadius:10, padding:10, background:'color-mix(in srgb, var(--grn) 5%, transparent)'}}>
                      <div style={{fontSize:10, fontWeight:800, color:T.acc, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8, display:'flex', alignItems:'center', gap:6}}>
                        💡 Nearby Parties (15 km)
                      </div>
                      <div style={{display:'flex', flexDirection:'column'}}>
                        {nearby.map(n => (
                          <div key={n.id}
                            onClick={() => setDetailDealer(n)}
                            style={{
                              padding:'6px 0', borderBottom:'1px solid '+T.bd1,
                              display:'flex', alignItems:'center', gap:8, cursor:'pointer',
                            }}>
                            <span style={{width:8, height:8, borderRadius:'50%', background:'var(--acc)', flexShrink:0}}/>
                            <span style={{flex:1, minWidth:0, fontSize:11, fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{n.name}</span>
                            <span style={{fontSize:9, color:T.t3, whiteSpace:'nowrap'}}>{n.city || ''}</span>
                            <span style={{fontSize:11, color:T.acc, fontWeight:800, whiteSpace:'nowrap'}}>{n._dist.toFixed(1)}km</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {nearby.length === 0 && Number.isFinite(d.locLat) && (
                    <div style={{fontSize:10, color:T.t3, textAlign:'center', padding:6}}>
                      No other geo-located dealers within 15 km.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          {(!leafletReady || !geoReady) && (
            <div style={{
              position:'absolute', inset:0, background:T.bg0,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10,
            }}>
              <div style={{
                width:28, height:28, border:'3px solid '+T.bd1,
                borderTop:'3px solid '+T.acc, borderRadius:'50%',
                animation:'spin .7s linear infinite',
              }}/>
              <div style={{fontSize:12, color:T.t3}}>Loading map…</div>
            </div>
          )}
          {leafletReady && geoReady && Object.keys(stateData).length === 0 && (
            <div style={{
              position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
              textAlign:'center', pointerEvents:'none', zIndex:1000,
            }}>
              <div style={{
                fontSize:12, color:T.t2,
                background:'color-mix(in srgb, var(--bg1) 95%, transparent)', padding:'8px 14px',
                borderRadius:7, border:'1px solid '+T.bd1,
              }}>Add a “State” column to your dealer data to see the map.</div>
            </div>
          )}
          {drillLevel === 'state' && cityData.length > 0 && unmappedCities.length > 0 && (
            <div style={{
              position:'absolute', top:14, right:14, zIndex:1000,
              background:'color-mix(in srgb, var(--yel) 15%, var(--bg1))', border:'1px solid color-mix(in srgb, var(--yel) 45%, transparent)',
              borderRadius:7, padding:'6px 10px', fontSize:11, color:'var(--yel)',
              maxWidth:260,
            }}>
              ⚠ No coordinates for: {unmappedCities.slice(0, 3).map(c => c.name).join(', ')}
              {unmappedCities.length > 3 ? ` + ${unmappedCities.length - 3} more` : ''}
            </div>
          )}
          {drillLevel === 'state' && !districtsReady && (
            <div style={{
              position:'absolute', top:14, right:14, zIndex:1000,
              background:'color-mix(in srgb, var(--bg1) 95%, transparent)', border:'1px solid '+T.bd2,
              borderRadius:7, padding:'5px 10px', fontSize:11, color:T.t2,
              display:'flex', alignItems:'center', gap:6,
            }}>
              <div style={{
                width:11, height:11, border:'2px solid '+T.bd2,
                borderTop:'2px solid '+T.acc, borderRadius:'50%',
                animation:'spin .7s linear infinite',
              }}/>
              Loading districts…
            </div>
          )}
          {drillLevel === 'state' && districtsReady && hoverDistrict && (
            <div style={{
              position:'absolute', bottom:14, left:14, zIndex:1000,
              background:'color-mix(in srgb, var(--bg1) 95%, transparent)', border:'1px solid '+T.accD,
              borderRadius:7, padding:'5px 10px', fontSize:11, color:T.acc,
              fontWeight:700,
            }}>
              District: {hoverDistrict}
            </div>
          )}
        </div>

        {/* Color legend bar */}
        <div style={{
          padding:'10px 14px', background:T.bg2,
          borderTop:'1px solid '+T.bd1,
          display:'flex', alignItems:'center', gap:10,
        }}>
          <span style={{fontSize:11, fontWeight:700, color:T.acc}}>High</span>
          <div style={{
            flex:1, height:14, borderRadius:4,
            background:'linear-gradient(90deg,' + GREEN_SCALE.slice().reverse().join(',') + ')',
            border:'1px solid '+T.bd1,
          }}/>
          <span style={{fontSize:11, fontWeight:700, color:T.t3}}>Low</span>
          <div style={{flex:1}}/>
          <button style={{
            background:'#1e3a8a', color:'#dbeafe', border:'1px solid #2563eb',
            borderRadius:6, padding:'6px 14px', fontSize:12, fontWeight:700,
            cursor:'pointer', boxShadow:'0 1px 2px rgba(0,0,0,.3)',
          }}>Compare Multiple Timelines</button>
        </div>

        {/* ── Details below the map — top dealers in the current view ────── */}
        <div style={{borderTop:'1px solid '+T.bd1, padding:'12px 14px'}}>
          <div style={{fontSize:11, color:T.t3, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8, display:'flex', alignItems:'center', gap:8}}>
            Top dealers · {viewLabel}
            <span className="count-pill" style={{textTransform:'none', letterSpacing:0}}>{viewDealers.length}</span>
            <span style={{color:T.t3, textTransform:'none', fontWeight:400}}>({viewDealers.length} customers · {fmtIN(viewSales)})</span>
          </div>
          {viewDealers.length === 0 ? (
            <div style={{fontSize:12, color:T.t3, padding:'6px 0'}}>No dealer data in this view.</div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:8}}>
              {[...viewDealers]
                .sort((a,b)=>achOf(b)-achOf(a))
                .slice(0, 8)
                .map(d => {
                  const ach = achOf(d);
                  return (
                    <div key={d.id} onClick={()=>onOpenDealer?.(d.id)}
                      style={{display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10,
                        background:T.bg2, border:'1px solid '+T.bd1, cursor:'pointer'}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=T.acc}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=T.bd1}>
                      <Ini name={d.name}/>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:12, fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</div>
                        <div style={{fontSize:9, color:T.t3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                          {[d.city, d.state].filter(Boolean).join(', ') || '—'} · {users?.[d.salesman]?.name || d.salesman || 'Unassigned'}
                        </div>
                      </div>
                      <div style={{fontSize:13, fontWeight:700, color: ach>0?T.acc:T.t3, whiteSpace:'nowrap'}}>{ach>0?fmtIN(ach):'—'}</div>
                    </div>
                  );
                })}
            </div>
          )}
          {/* Full dealer list for the current view — fills the space below the map */}
          {viewDealers.length > 0 && (
            <div style={{marginTop:12}}>
              <div style={{fontSize:11, color:T.t3, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6}}>
                All dealers · {viewLabel} <span className="count-pill" style={{textTransform:'none', letterSpacing:0}}>{viewDealers.length}</span>
              </div>
              <div style={{border:'1px solid '+T.bd1, borderRadius:10, overflow:'hidden'}}>
                <div style={{maxHeight:520, overflowY:'auto'}}>
                  <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
                    <thead>
                      <tr style={{position:'sticky', top:0, background:T.bg2, zIndex:2}}>
                        {[['Dealer','left'],['City','left'],['Salesman','left'],['Status','left'],['Sales','right']].map(([h,al])=>(
                          <th key={h} style={{textAlign:al, padding:'8px 10px', color:T.t3, fontSize:9, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid '+T.bd1, whiteSpace:'nowrap'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...viewDealers].sort((a,b)=>achOf(b)-achOf(a)).map(d=>{
                        const ach=achOf(d);
                        return (
                          <tr key={d.id} onClick={()=>onOpenDealer?.(d.id)} style={{cursor:'pointer', borderBottom:'1px solid '+T.bd1}}
                            onMouseEnter={e=>e.currentTarget.style.background=T.bg2}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <td style={{padding:'8px 10px', fontWeight:600, color:T.t1, maxWidth:240}}>
                              <div style={{display:'flex', alignItems:'center', gap:9, minWidth:0}}>
                                <Ini name={d.name}/>
                                <div style={{minWidth:0}}>
                                  <div style={{fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</div>
                                  {(d.zone||d.city) && <div style={{fontSize:10.5, color:T.t3, fontWeight:500}}>{[d.zone, d.city].filter(Boolean).join(' · ')}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{padding:'8px 10px', color:T.t2, whiteSpace:'nowrap'}}>{d.city||'—'}</td>
                            <td style={{padding:'8px 10px', color:T.t2, whiteSpace:'nowrap'}}>{users?.[d.salesman]?.name||d.salesman||'—'}</td>
                            <td style={{padding:'8px 10px'}}><StatusBadge status={d.perfStatus} emptyLabel="NEW DEALER"/>{d.status && d.status!=='NONE' && <StatusBadge status={d.status}/>}</td>
                            <td style={{padding:'8px 10px', textAlign:'right', fontWeight:700, color: ach>0?T.acc:T.t3, whiteSpace:'nowrap'}}>{ach>0?fmtIN(ach):'—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Legend + compare (as in the BI map view) */}
        <div className="stp-legend-row">
          {trendLive ? (
            <div className="stp-legend">
              <span>▼ Down</span>
              {[...DOWN_SCALE].reverse().map(c => <i key={c} style={{background:c}}/>)}
              <i style={{background:'#e5e7eb'}}/>
              {UP_SCALE.map(c => <i key={c} style={{background:c}}/>)}
              <span>Up ▲</span>
              <em>{period.label} vs {period.prevLabel}</em>
            </div>
          ) : (
            <div className="stp-legend">
              <span>Low</span>
              {GREEN_SCALE.map(c => <i key={c} style={{background:c}}/>)}
              <span>High</span>
              {period.prevFull && <em>Tip: tap Trend to see growth vs {period.prevLabel}</em>}
            </div>
          )}
          <button className="btnp stp-compare-btn" onClick={() => setCompareOpen(true)}>
            <GitCompare size={14}/> Compare Multiple Timelines
          </button>
        </div>
      </div>

      {/* ── Right column: data panels (drill: state → city → district) ──── */}
      <div className="stp-right-col">
        {/* ── Territory — regions collected by tapping them in Territory mode ── */}
        {(territoryMode || territory.length > 0) && (() => {
          const byId = new Map(dealers.map(d => [d.id, d]));
          const seen = new Set(), list = [];
          territory.forEach(r => r.ids.forEach(id => { if(!seen.has(id) && byId.has(id)){ seen.add(id); list.push(byId.get(id)); } }));
          const val = list.reduce((t,d) => t + achOf(d), 0);
          const prv = list.reduce((t,d) => t + prevOf(d), 0);
          const tgt = list.reduce((t,d) => t + tgtOf(d), 0);
          const billed = list.filter(d => achOf(d) > 0).length;
          const regionVal = r => r.ids.reduce((t,id) => t + (byId.has(id) ? achOf(byId.get(id)) : 0), 0);
          return (
            <div className="card stp-terr">
              <div className="sec-title" style={{marginBottom:6}}>
                <span className="sec-ico" style={{'--tone':'#2563eb'}}><Shapes size={15}/></span>
                <span>Territory</span>
                {territory.length > 0 && <span className="count-pill">{territory.length}</span>}
                <div style={{flex:1}}/>
                <button className={'btn'+(territoryMode?' on':'')} style={{fontSize:11,padding:'4px 10px'}} onClick={() => setTerritoryMode(t => !t)}>
                  {territoryMode ? 'Done adding' : 'Add regions'}
                </button>
              </div>
              {territory.length === 0 ? (
                <div className="stp-terr-empty">Tap states{drillLevel === 'state' ? ' or districts' : ''} on the map to add them here. Their dealers and sales add up below.</div>
              ) : (<>
                <div className="stp-terr-chips">
                  {territory.map(r => (
                    <span key={r.key} className="stp-terr-chip">
                      {r.name}<small>{r.type === 'district' ? 'dist.' : 'state'}</small><b>{fmtIN(regionVal(r))}</b>
                      <button onClick={() => setTerritory(t => t.filter(x => x.key !== r.key))} title="Remove"><X size={11}/></button>
                    </span>
                  ))}
                </div>
                <div className="stp-terr-kpis">
                  <div><span>Dealers</span><b>{list.length}</b></div>
                  <div><span>Billed</span><b>{billed}</b></div>
                  <div><span>Value</span><b style={{color:'var(--grn)'}}>{fmtIN(val)}</b></div>
                  <div><span>Target</span><b>{tgt ? fmtIN(tgt) : '—'}</b></div>
                  <div><span>Ach %</span><b style={{color:pclr(tgt ? pct(tgt,val) : null)}}>{tgt ? spct(tgt,val) : 'N/T'}</b></div>
                  <div><span>vs {period.prevFull ? period.prevLabel : 'prev'}</span><b style={{color:val>=prv?'var(--grn)':'var(--red)'}}>{period.prevFull ? signed(val-prv) : '—'}</b></div>
                </div>
                <div style={{display:'flex', gap:8, marginTop:8}}>
                  <button className="btn" style={{flex:1, fontSize:12}} onClick={() => { setListQ(''); setListView({ title:'Territory · ' + territory.map(r => r.name).join(', '), dealers:list }); }}>View dealers</button>
                  <button className="btn" style={{fontSize:12}} onClick={() => setTerritory([])}>Clear</button>
                </div>
              </>)}
            </div>
          );
        })()}
        {/* ── Summary box — Total Customers / Sales / Salesmen / Zones ──────
            Scoped to the current view. Click a tile to see the full list. */}
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div className="sec-title" style={{padding:'10px 12px', borderBottom:'1px solid '+T.bd1, background:T.bg2, marginBottom:0}}>
            <span className="sec-ico" style={{'--tone':'var(--acc)'}}><Award size={15}/></span>
            <span>Summary</span>
            <div style={{flex:1}}/>
            <span className="sec-note" style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:130}}>{viewLabel}</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, padding:10}}>
            {[
              { key:'customers', label:'Customers', val:viewDealers.length,        color:T.blue },
              { key:'sales',     label:'Sales',     val:fmtIN(viewSales),           color:T.acc },
              { key:'salesmen',  label:'Salesmen',  val:viewSalesmen.length,        color:'#f59e0b' },
              { key:'zones',     label:'Zones',     val:viewZones.length,           color:'#a5b4fc' },
            ].map(t => (
              <button key={t.key} type="button" onClick={()=>setSummaryView(t.key)}
                style={{
                  textAlign:'left', cursor:'pointer', padding:'10px 12px', borderRadius:12,
                  background:T.bg2, border:'1px solid '+T.bd1, transition:'border-color .15s',
                }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=t.color}
                onMouseLeave={e=>e.currentTarget.style.borderColor=T.bd1}>
                <div style={{fontSize:10, color:T.t3, textTransform:'uppercase', letterSpacing:'.06em'}}>{t.label}</div>
                <div style={{fontSize:20, fontWeight:800, color:t.color, marginTop:2}}>{t.val}</div>
                <div style={{fontSize:9, color:T.t3, marginTop:2}}>tap to view →</div>
              </button>
            ))}
          </div>
        </div>

        {drillLevel === 'state' && (
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div className="sec-title" style={{
              padding:'10px 12px', background:T.accBg,
              borderBottom:'1px solid '+T.accD, marginBottom:0,
            }}>
              <span className="sec-ico" style={{'--tone':'#0891b2'}}><MapPin size={15}/></span>
              <span>
                Cities in {selected}
              </span>
              <span className="count-pill">{cityData.length}</span>
              <div style={{flex:1}}/>
              <span className="sec-note">— {period.label}</span>
            </div>
            <div style={{padding:'4px 0', maxHeight:320, overflowY:'auto'}}>
              {cityData.length === 0
                ? <div style={{padding:16, color:T.t3, fontSize:12, textAlign:'center'}}>
                    No city data for dealers in {selected}.<br/>
                    Add a “City” column to your dealer sheet.
                  </div>
                : cityData.map((city, i) => {
                    const bar = Math.round((city.total / Math.max(maxCityVal,1)) * 100);
                    const isSel = selectedCity === city.name;
                    const hasCoord = !!CITY_COORDS[city.name.toLowerCase()];
                    return (
                      <div key={city.name}
                           onClick={() => setSelectedCity(s => s === city.name ? null : city.name)}
                           style={{
                             padding:'8px 12px', cursor:'pointer',
                             background: isSel ? T.accBg : 'transparent',
                             borderLeft:'3px solid '+(isSel ? T.acc : 'transparent'),
                             transition:'all .15s',
                           }}
                           onMouseEnter={e => e.currentTarget.style.background = isSel ? T.accBg : T.bg2}
                           onMouseLeave={e => e.currentTarget.style.background = isSel ? T.accBg : 'transparent'}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                          <div style={{display:'flex', alignItems:'center', gap:6, flex:1, minWidth:0}}>
                            <span className={'rank rank-'+(i+1)} style={{width:20, height:20, fontSize:10, borderRadius:6}}>{i+1}</span>
                            <span style={{fontSize:12, fontWeight:700, color:isSel ? T.acc : T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{city.name}</span>
                          </div>
                          <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            <span style={{fontSize:10, color:T.t3}}>{city.dealers.length}d</span>
                            <span style={{fontSize:13, fontWeight:800, color:T.acc}}>{fmtIN(city.total)}</span>
                          </div>
                        </div>
                        <div style={{height:5, background:'var(--bg3)', borderRadius:3, marginLeft:26, overflow:'hidden'}}>
                          <div style={{height:'100%', width:bar+'%', background:'linear-gradient(90deg, color-mix(in srgb, '+T.acc+' 55%, transparent), '+T.acc+')', borderRadius:3, transition:'width .5s'}}/>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}

        {drillLevel === 'state' && selectedCityObj && (
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div className="sec-title" style={{
              padding:'10px 12px', background:'color-mix(in srgb, var(--red) 10%, transparent)',
              borderBottom:'1px solid color-mix(in srgb, var(--red) 30%, transparent)', marginBottom:0,
            }}>
              <span className="sec-ico" style={{'--tone':'#0891b2'}}><MapPin size={15}/></span>
              <span>{selectedCityObj.name}</span>
              <div style={{flex:1}}/>
              <button onClick={() => setSelectedCity(null)} style={{background:'none', border:'none', color:T.t3, cursor:'pointer'}}>
                <X size={13}/>
              </button>
            </div>
            <div style={{padding:12}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12}}>
                <KpiCell label="Sales"   value={fmtIN(selectedCityObj.total)}   color="var(--grn)"/>
                <KpiCell label="Dealers" value={selectedCityObj.dealers.length} color={T.blue}/>
                <KpiCell label="Target"  value={selectedCityObj.target ? fmtIN(selectedCityObj.target) : '—'} color={T.t2}/>
              </div>

              {/* ── Areas (pincode-wise) grouping ──────────────────────
                  Aggregates the city's dealers by their pincode so the
                  admin can see which neighborhoods are driving sales.
                  Each area is a collapsible card — click to see its
                  dealers. Areas with no pincode fall into a "No PIN"
                  bucket so no dealer is lost. */}
              {(() => {
                const areaMap = new Map();
                for (const d of selectedCityObj.dealers) {
                  const key = String(d.pincode || '').trim() || '__nopin__';
                  if (!areaMap.has(key)) {
                    areaMap.set(key, { pin: key === '__nopin__' ? 'No PIN' : key, dealers: [], total: 0, target: 0 });
                  }
                  const g = areaMap.get(key);
                  g.dealers.push(d);
                  g.total  += achOf(d);
                  g.target += tgtOf(d);
                }
                const areas = [...areaMap.values()].sort((a,b) => b.total - a.total);
                if (areas.length <= 1) return null;   // no benefit if everyone shares one pin
                return (
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10, color:T.t3, marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em', display:'flex', alignItems:'center', gap:8}}>
                      Areas · {areas.length} PIN{areas.length===1?'':'s'}
                      <span style={{color:T.t3, textTransform:'none', fontWeight:400}}>· click any to expand</span>
                    </div>
                    <div style={{display:'grid', gap:4, maxHeight:220, overflowY:'auto', border:'1px solid '+T.bd1, borderRadius:6, padding:6}}>
                      {areas.map(a => {
                        const open = expandedPincodes.has(a.pin);
                        const ap   = pct(a.target, a.total);
                        return (
                          <div key={a.pin} style={{borderRadius:5, border:'1px solid '+T.bd1, overflow:'hidden'}}>
                            <button
                              onClick={() => {
                                const next = new Set(expandedPincodes);
                                open ? next.delete(a.pin) : next.add(a.pin);
                                setExpandedPincodes(next);
                                setShowAllDealers(false);
                              }}
                              style={{
                                width:'100%', display:'flex', alignItems:'center', gap:8,
                                padding:'6px 10px', background: open ? T.bg2 : 'transparent',
                                border:'none', cursor:'pointer', color:T.t1, textAlign:'left',
                              }}>
                              <span style={{fontSize:10, color:T.t3, minWidth:12}}>{open?'▼':'▶'}</span>
                              <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:12, fontWeight:700, color:T.t1, minWidth:60}}>{a.pin}</span>
                              <span style={{flex:1}}/>
                              <span style={{fontSize:10, color:T.t3}}>{a.dealers.length} deal.</span>
                              <span style={{fontSize:11, fontWeight:700, color:T.acc, minWidth:60, textAlign:'right'}}>{fmtIN(a.total)}</span>
                              {a.target > 0 && (
                                <span style={{fontSize:10, color:pclr(ap), minWidth:40, textAlign:'right'}}>{spct(a.target, a.total)}</span>
                              )}
                            </button>
                            {open && (
                              <div style={{background:T.bg2, borderTop:'1px solid '+T.bd1}}>
                                {a.dealers
                                  .sort((x,y) => achOf(y) - achOf(x))
                                  .map(d => {
                                    const ach = achOf(d);
                                    return (
                                      <div key={d.id}
                                        onClick={(e) => { e.stopPropagation(); setDetailDealer(d); }}
                                        style={{
                                          padding:'5px 10px 5px 30px', cursor:'pointer',
                                          borderBottom:'1px solid '+T.bd1,
                                          display:'flex', alignItems:'center', gap:8,
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = T.bg1}
                                        onMouseLeave={e => e.currentTarget.style.background = T.bg2}>
                                        <div style={{flex:1, minWidth:0}}>
                                          <div style={{fontSize:11, fontWeight:600, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</div>
                                          {d.address && (
                                            <div title={d.address} style={{fontSize:9, color:T.t3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.address}</div>
                                          )}
                                        </div>
                                        <span style={{fontSize:11, fontWeight:700, color:T.acc}}>{fmtIN(ach)}</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setShowAllDealers(s => !s)}
                      style={{
                        marginTop:6, fontSize:11, padding:'4px 10px', borderRadius:5,
                        background:'transparent', border:'1px solid '+T.bd1, color:T.t2, cursor:'pointer',
                      }}>
                      {showAllDealers ? 'Hide flat dealer list' : 'Show flat dealer list (all areas)'}
                    </button>
                  </div>
                );
              })()}

              {showAllDealers && (
              <div style={{fontSize:10, color:T.t3, marginBottom:5, textTransform:'uppercase', letterSpacing:'.07em'}}>
                Dealers ({selectedCityObj.dealers.length})
              </div>
              )}
              {showAllDealers && (
              <div style={{maxHeight:200, overflowY:'auto', border:'1px solid '+T.bd1, borderRadius:6}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
                  <thead>
                    <tr style={{position:'sticky', top:0, background:T.bg2, zIndex:2}}>
                      {['Dealer','Status','Sales','Ach%'].map((h, i) => (
                        <th key={h} style={{
                          textAlign: i >= 2 ? 'right' : 'left',
                          padding:'5px 8px', color:T.t3, fontSize:9,
                          fontWeight:700, textTransform:'uppercase',
                          borderBottom:'1px solid '+T.bd1,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedCityObj.dealers]
                      .sort((a,b) => achOf(b) - achOf(a))
                      .map(d => {
                        const ach = achOf(d);
                        const tgt = tgtOf(d);  // per-month only
                        const dp  = pct(tgt, ach);
                        return (
                          <tr key={d.id}
                              onClick={() => onOpenDealer?.(d.id)}
                              style={{cursor:'pointer', borderBottom:'1px solid '+T.bd1}}
                              onMouseEnter={e => e.currentTarget.style.background = T.bg2}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{padding:'5px 8px', maxWidth:200}}>
                              <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0}}>
                                <Ini name={d.name} size={24}/>
                                <div style={{minWidth:0}}>
                                  <div style={{fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</div>
                                  {(d.address || d.pincode) && (
                                    <div title={d.address || ''} style={{fontSize:9, color:T.t3, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                      {d.address ? d.address : ''}{(d.address && d.pincode) ? ' · ' : ''}{d.pincode ? d.pincode : ''}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{padding:'5px 8px'}}>
                              <StatusBadge status={d.perfStatus} emptyLabel="NEW DEALER"/>{d.status && d.status!=='NONE' && <StatusBadge status={d.status}/>}
                            </td>
                            <td style={{padding:'5px 8px', textAlign:'right', fontWeight:700, color:T.acc, whiteSpace:'nowrap'}}>{fmtIN(ach)}</td>
                            <td style={{padding:'5px 8px', textAlign:'right', fontSize:10, whiteSpace:'nowrap'}}>
                              <div style={{fontWeight:800, color:pclr(dp)}}>{spct(tgt, ach)}</div>
                              {tgt > 0 && <div className="pbar" style={{width:48}}><div style={{width:Math.min(dp||0,100)+'%', background:pclr(dp)}}/></div>}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ── Opened DISTRICT panel — salesman-wise / dealer-wise ──────────── */}
        {drillLevel === 'state' && districtObj && (
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div className="sec-title" style={{padding:'10px 12px', background:'color-mix(in srgb, var(--grn) 10%, transparent)', borderBottom:'1px solid color-mix(in srgb, var(--grn) 30%, transparent)', marginBottom:0}}>
              <span className="sec-ico" style={{'--tone':'#0891b2'}}><MapIcon size={15}/></span>
              <span>{districtObj.name}</span> <span className="sec-note">District</span>
              <div style={{flex:1}}/>
              <button onClick={() => setFocusArea(null)} style={{background:'none', border:'none', color:T.t3, cursor:'pointer'}}>
                <X size={13}/>
              </button>
            </div>
            <div style={{padding:12}}>
              {(() => {
                const all     = districtObj.dealers || [];
                const dealers = panelSalesman ? all.filter(d => (d.salesman||'') === panelSalesman) : all;
                const salesmen = [...new Set(all.map(d => d.salesman).filter(Boolean))]
                  .sort((a,b) => (users?.[a]?.name||a).localeCompare(users?.[b]?.name||b));
                const totalSales = dealers.reduce((s,d) => s + achOf(d), 0);
                const qty = dealers.filter(d => achOf(d) > 0).length;

                // Aggregate by salesman for the "By salesman" view.
                const bySm = {};
                dealers.forEach(d => {
                  const k = d.salesman || '__none__';
                  if(!bySm[k]) bySm[k] = { salesman:k, dealers:0, sales:0, qty:0 };
                  bySm[k].dealers++;
                  const a = achOf(d);
                  bySm[k].sales += a;
                  if(a > 0) bySm[k].qty++;
                });
                const smRows = Object.values(bySm).sort((a,b) => b.sales - a.sales);

                return (
                  <>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:10}}>
                      <KpiCell label="Sales"   value={fmtIN(totalSales)} color="var(--grn)"/>
                      <KpiCell label="Dealers" value={dealers.length}    color={T.blue}/>
                      <KpiCell label="Qty"     value={qty}               color="#f59e0b"/>
                    </div>

                    {/* Salesman filter + view toggle */}
                    <div style={{display:'flex', gap:6, marginBottom:10, flexWrap:'wrap'}}>
                      <select value={panelSalesman} onChange={e => setPanelSalesman(e.target.value)}
                        style={{flex:'1 1 120px', background:T.bg2, color:T.t1, border:'1px solid '+T.bd1, borderRadius:6, padding:'5px 8px', fontSize:11}}>
                        <option value="">All salesmen ({all.length})</option>
                        {salesmen.map(s => <option key={s} value={s}>{users?.[s]?.name || s}</option>)}
                      </select>
                      <div className="seg">
                        {['salesman','dealer'].map(m => (
                          <button key={m} onClick={() => setPanelMode(m)}
                            className={'seg-b'+(panelMode===m?' on':'')}
                            style={{'--tone':'var(--acc)', fontSize:11, padding:'4px 10px'}}>
                            By {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table */}
                    <div style={{maxHeight:280, overflowY:'auto', border:'1px solid '+T.bd1, borderRadius:6}}>
                      <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
                        <thead>
                          <tr style={{position:'sticky', top:0, background:T.bg2, zIndex:2}}>
                            {(panelMode==='salesman'
                              ? [['Salesman','left'],['Dealers','right'],['Sales','right'],['Qty','right']]
                              : [['Dealer','left'],['Salesman','left'],['Sales','right']]
                            ).map(([h,al]) => (
                              <th key={h} style={{textAlign:al, padding:'5px 8px', color:T.t3, fontSize:9, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid '+T.bd1}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {panelMode==='salesman'
                            ? smRows.map(r => (
                                <tr key={r.salesman} style={{borderBottom:'1px solid '+T.bd1, cursor:'pointer'}}
                                  onClick={() => setPanelSalesman(r.salesman==='__none__' ? '' : r.salesman)}
                                  onMouseEnter={e => e.currentTarget.style.background = T.bg2}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <td style={{padding:'5px 8px', fontWeight:600, color:T.t1}}>
                                    <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0}}>
                                      <Ini name={r.salesman==='__none__' ? 'Unassigned' : (users?.[r.salesman]?.name || r.salesman)} size={24}/>
                                      <div style={{minWidth:0}}>
                                        <div style={{fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.salesman==='__none__' ? 'Unassigned' : (users?.[r.salesman]?.name || r.salesman)}</div>
                                        <div style={{fontSize:9.5, color:T.t3, fontWeight:500}}>{r.qty} of {r.dealers} billed</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td style={{padding:'5px 8px', textAlign:'right', color:T.blue}}>{r.dealers}</td>
                                  <td style={{padding:'5px 8px', textAlign:'right', fontWeight:700, color:T.acc}}>{fmtIN(r.sales)}</td>
                                  <td style={{padding:'5px 8px', textAlign:'right', color:'var(--yel)'}}>{r.qty}</td>
                                </tr>
                              ))
                            : [...dealers].sort((a,b)=>achOf(b)-achOf(a)).map(d => {
                                const ach = achOf(d);
                                return (
                                  <tr key={d.id} onClick={() => onOpenDealer?.(d.id)} style={{borderBottom:'1px solid '+T.bd1, cursor:'pointer'}}
                                    onMouseEnter={e => e.currentTarget.style.background = T.bg2}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{padding:'5px 8px', maxWidth:170}}>
                                      <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0}}>
                                        <Ini name={d.name} size={24}/>
                                        <div style={{minWidth:0}}>
                                          <div style={{fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</div>
                                          {(d.zone||d.city) && <div style={{fontSize:9.5, color:T.t3}}>{[d.zone, d.city].filter(Boolean).join(' · ')}</div>}
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{padding:'5px 8px', color:T.t2}}>{users?.[d.salesman]?.name || d.salesman || '—'}</td>
                                    <td style={{padding:'5px 8px', textAlign:'right', fontWeight:700, color:T.acc}}>{fmtIN(ach)}</td>
                                  </tr>
                                );
                              })}
                          {dealers.length===0 && (
                            <tr><td colSpan={panelMode==='salesman'?4:3} style={{padding:16, textAlign:'center', color:T.t3}}>No dealers{panelSalesman?' for this salesman':''} in this district.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {drillLevel === 'india' && (
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div className="sec-title" style={{padding:'10px 12px', borderBottom:'1px solid '+T.bd1, background:T.bg2, marginBottom:0}}>
              <span className="sec-ico" style={{'--tone':'#0891b2'}}><Award size={15}/></span>
              <span>Top States</span>
              <span className="sec-note">— {period.label}</span>
            </div>
            <div style={{padding:'4px 0', maxHeight:320, overflowY:'auto'}}>
              {topStates.length === 0
                ? <div style={{padding:16, color:T.t3, fontSize:12, textAlign:'center'}}>No state data</div>
                : topStates.map(({name, total, dealers:dl}, i) => {
                    const bar = Math.round((total / (topStates[0]?.total || 1)) * 100);
                    return (
                      <div key={name}
                           onClick={() => setSelected(name)}
                           style={{
                             padding:'8px 12px', cursor:'pointer',
                             background:'transparent',
                             borderLeft:'3px solid transparent',
                             transition:'all .15s',
                           }}
                           onMouseEnter={e => e.currentTarget.style.background = T.bg2}
                           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                          <div style={{display:'flex', alignItems:'center', gap:6}}>
                            <span className={'rank rank-'+(i+1)} style={{width:20, height:20, fontSize:10, borderRadius:6}}>{i+1}</span>
                            <span style={{fontSize:12, fontWeight:700, color:T.t1}}>{name}</span>
                          </div>
                          <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            <span style={{fontSize:10, color:T.t3}}>{dl.length}d</span>
                            <span style={{fontSize:13, fontWeight:800, color:T.acc}}>{fmtIN(total)}</span>
                          </div>
                        </div>
                        <div style={{height:5, background:'var(--bg3)', borderRadius:3, marginLeft:26, overflow:'hidden'}}>
                          <div style={{height:'100%', width:bar+'%', background:'linear-gradient(90deg, color-mix(in srgb, '+T.acc+' 55%, transparent), '+T.acc+')', borderRadius:3, transition:'width .5s'}}/>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}

        <div className="card">
          <div className="sec-title">
            <span className="sec-ico" style={{'--tone':'#0891b2'}}><Globe size={15}/></span>
            {selected ? selected + ' Summary' : 'India Summary'}
          </div>
          {selected ? [
            {l:'Total dealers',    v:det?.dealers.length || 0, c:T.blue},
            {l:'Districts (total)',v:districtList.length || (districtsReady ? 0 : '…'), c:T.cyan},
            {l:'Districts with sales', v:districtsWithSales, c:T.acc},
            {l:'Cities covered',   v:cityData.length, c:T.acc},
            {l:'Total sales',      v:fmtIN(det?.total || 0), c:T.acc},
            {l:'Total target',     v:fmtIN(det?.target || 0), c:T.cyan},
            {l:'Achievement',      v:det?.target ? pct(det.target, det.total)+'%' : 'N/T', c:pclr(det?.target ? pct(det.target, det.total) : null)},
            {l:'Unmapped cities',  v:unmappedCities.length, c:unmappedCities.length > 0 ? T.hot2 : T.t3},
          ].map(k => (
            <div key={k.l} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid '+T.bd1, fontSize:12}}>
              <span style={{color:T.t2}}>{k.l}</span>
              <span style={{fontWeight:700, color:k.c}}>{k.v}</span>
            </div>
          )) : [
            {l:'States covered',  v:Object.keys(stateData).length, c:T.acc},
            {l:'Total sales',     v:fmtIN(Object.values(stateData).reduce((s,d) => s + d.total, 0)), c:T.acc},
            {l:'Total target',    v:fmtIN(Object.values(stateData).reduce((s,d) => s + d.target, 0)), c:T.blue},
            {l:'Mapped dealers',  v:dealers.length - unmapped, c:T.t1},
            {l:'Unmapped',        v:unmapped, c:unmapped > 0 ? T.hot2 : T.t3},
          ].map(k => (
            <div key={k.l} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid '+T.bd1, fontSize:12}}>
              <span style={{color:T.t2}}>{k.l}</span>
              <span style={{fontWeight:700, color:k.c}}>{k.v}</span>
            </div>
          ))}
        </div>
      </div>
      </div>{/* /stp-split */}

      {/* Summary drill-down modal — Customers / Sales / Salesmen / Zones list */}
      {summaryView && (() => {
        const close = () => setSummaryView(null);
        const title = ({customers:'Customers', sales:'Customers · by sales', salesmen:'Salesmen', zones:'Zones'})[summaryView] || 'Details';
        const dealerRows = [...viewDealers].sort((a,b)=>achOf(b)-achOf(a));
        const group = (keyFn) => {
          const m = {};
          viewDealers.forEach(d => {
            const k = keyFn(d) || '__none__';
            if(!m[k]) m[k] = { key:k, dealers:0, sales:0, billed:0 };
            m[k].dealers++;
            const a = achOf(d);
            m[k].sales += a; if(a>0) m[k].billed++;
          });
          return Object.values(m).sort((a,b)=>b.sales-a.sales);
        };
        const smGroups   = group(d => d.salesman);
        const zoneGroups = group(d => (d.zone||'').trim());
        return (
          <div onClick={close} style={{position:'fixed', inset:0, background:'rgba(6,6,16,0.8)', backdropFilter:'blur(3px)',
            zIndex:4000, display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
            <div onClick={e=>e.stopPropagation()} style={{background:T.bg1, border:'1px solid '+T.bd1, borderRadius:16,
              width:660, maxWidth:'96%', maxHeight:'86vh', display:'flex', flexDirection:'column', boxShadow:'0 24px 60px rgba(0,0,0,0.55)'}}>
              <div style={{padding:'14px 16px', borderBottom:'1px solid '+T.bd1, display:'flex', alignItems:'center', gap:8}}>
                <span style={{fontSize:15, fontWeight:800, color:T.t1, flex:1}}>
                  {title} <span style={{fontWeight:500, color:T.t3, fontSize:12}}>· {viewLabel}</span>
                </span>
                <button onClick={close} style={{background:'none', border:'none', color:T.t3, cursor:'pointer'}}><X size={18}/></button>
              </div>
              <div style={{overflowY:'auto', padding:'4px 0'}}>
                {(summaryView==='customers' || summaryView==='sales') && dealerRows.map(d => {
                  const ach = achOf(d);
                  return (
                    <div key={d.id} onClick={()=>{ onOpenDealer?.(d.id); close(); }}
                      style={{display:'flex', alignItems:'center', gap:10, padding:'9px 16px', borderBottom:'1px solid '+T.bd1, cursor:'pointer'}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bg2}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <Ini name={d.name}/>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:13, fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</div>
                        <div style={{fontSize:10, color:T.t3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                          {[d.city, d.state].filter(Boolean).join(', ') || '—'} · {users?.[d.salesman]?.name || d.salesman || 'Unassigned'}
                        </div>
                      </div>
                      <StatusBadge status={d.perfStatus} emptyLabel="NEW DEALER"/>{d.status && d.status!=='NONE' && <StatusBadge status={d.status}/>}
                      <div style={{minWidth:72, textAlign:'right', fontSize:13, fontWeight:700, color: ach>0?T.acc:T.t3}}>{ach>0?fmtIN(ach):'—'}</div>
                    </div>
                  );
                })}
                {summaryView==='salesmen' && smGroups.map(r => (
                  <div key={r.key} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid '+T.bd1}}>
                    <Ini name={r.key==='__none__'?'Unassigned':(users?.[r.key]?.name||r.key)}/>
                    <div style={{flex:1, fontSize:13, fontWeight:700, color:T.t1}}>{r.key==='__none__'?'Unassigned':(users?.[r.key]?.name||r.key)}</div>
                    <span style={{fontSize:11, color:T.blue}}>{r.dealers} cust.</span>
                    <span style={{fontSize:11, color:'var(--yel)'}}>{r.billed} billed</span>
                    <div style={{minWidth:82, textAlign:'right', fontSize:13, fontWeight:700, color:T.acc}}>{fmtIN(r.sales)}</div>
                  </div>
                ))}
                {summaryView==='zones' && zoneGroups.map(r => (
                  <div key={r.key} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'1px solid '+T.bd1}}>
                    <div style={{flex:1, fontSize:13, fontWeight:600, color:T.t1}}>{r.key==='__none__'?'No zone':r.key}</div>
                    <span style={{fontSize:11, color:T.blue}}>{r.dealers} cust.</span>
                    <div style={{minWidth:82, textAlign:'right', fontSize:13, fontWeight:700, color:T.acc}}>{fmtIN(r.sales)}</div>
                  </div>
                ))}
                {viewDealers.length===0 && <div style={{padding:22, textAlign:'center', color:T.t3, fontSize:12}}>No data in this view.</div>}
              </div>
            </div>
          </div>
        );
      })()}

      {/* "List customers" — opened from the KPI tiles and the territory box */}
      {listView && (() => {
        const close = () => setListView(null);
        const q = listQ.trim().toLowerCase();
        const rows = listView.dealers
          .filter(d => !q || (d.name||'').toLowerCase().includes(q) || (d.city||'').toLowerCase().includes(q))
          .map(d => ({ d, ach: achOf(d), prev: prevOf(d), tgt: tgtOf(d), last: lastBilled(d) }))
          .sort((a,b) => b.ach - a.ach || a.d.name.localeCompare(b.d.name));
        const tot = rows.reduce((t,r) => t + r.ach, 0);
        return (
          <div className="stp-list-ov" onClick={close}>
            <div className="stp-list" onClick={e => e.stopPropagation()}>
              <div className="stp-list-head">
                <div style={{flex:1, minWidth:0}}>
                  <div className="stp-list-title">{listView.title}</div>
                  <div className="stp-list-sub">{rows.length} dealers · {period.label} · value {fmtIN(tot)}{smFilter ? ' · ' + (users?.[smFilter]?.name || smFilter) : ''}</div>
                </div>
                <button onClick={close} className="stp-x"><X size={18}/></button>
              </div>
              <div className="stp-list-search"><Search size={14}/><input value={listQ} onChange={e => setListQ(e.target.value)} placeholder="Search dealer or city…"/></div>
              <div className="stp-list-body">
                <table>
                  <thead><tr>
                    <th>Dealer</th><th className="stpl-wide">City</th><th className="stpl-wide">Salesman</th><th>Last billed</th>
                    <th className="r">Value</th><th className="r stpl-wide">Target</th>{period.prevFull && <th className="r">vs prev</th>}
                  </tr></thead>
                  <tbody>
                    {rows.map(({d, ach, prev, tgt, last}) => (
                      <tr key={d.id} onClick={() => { onOpenDealer?.(d.id); }}>
                        <td><div className="nm">{d.name}</div><div className="stpl-narrow">{[d.city, users?.[d.salesman]?.name].filter(Boolean).join(' · ')}</div></td>
                        <td className="stpl-wide">{d.city || '—'}</td>
                        <td className="stpl-wide">{users?.[d.salesman]?.name || d.salesman || '—'}</td>
                        <td>{last || <span style={{color:'var(--red)'}}>never</span>}</td>
                        <td className="r" style={{fontWeight:800, color: ach > 0 ? 'var(--grn)' : 'var(--t3)'}}>{ach ? fmtIN(ach) : '—'}</td>
                        <td className="r stpl-wide">{tgt ? fmtIN(tgt) : '—'}</td>
                        {period.prevFull && <td className="r" style={{fontWeight:700, color: ach > prev ? 'var(--grn)' : ach < prev ? 'var(--red)' : 'var(--t3)'}}>{ach - prev ? signed(ach - prev) : '—'}</td>}
                      </tr>
                    ))}
                    {rows.length === 0 && <tr><td colSpan={7} style={{textAlign:'center', padding:20, color:'var(--t3)'}}>No dealers.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {compareOpen && (
        <React.Suspense fallback={null}>
          <MapCompare dealers={dealers} users={users} MO={MO} selectedMonthIdx={selectedMonthIdx} smFilter={smFilter}
            stateGeo={geoRef.current} districtGeoRef={districtGeoRef} initialState={selected}
            onOpenDealer={onOpenDealer} onClose={() => setCompareOpen(false)}/>
        </React.Suspense>
      )}
    </div>
  );
}
