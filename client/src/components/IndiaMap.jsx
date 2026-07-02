import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, ChevronRight, Globe, Layers, Hash, Type, TrendingUp, Award, ArrowLeft, MapPin } from 'lucide-react';
import { MO } from '../constants';
import { pct, spct, pclr, monthTarget } from '../utils';
import { useMonth } from '../context';

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

const normalizeState = s => {
  if(!s) return null;
  const l = String(s).toLowerCase().trim();
  return STATE_ALIASES[l] || String(s).trim();
};

const getFeatureStateName = feature => {
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
  accD:  '#15803d',   // green dark
  accBg: '#0e2a18',   // soft green tint
  hot:   '#ef4444',   // selected city / lost
  hot2:  '#fbbf24',   // star
  blue:  '#6366f1',
  cyan:  '#0ea5e9',
};

// Green choropleth scale tuned for dark background
const GREEN_SCALE = ['#0e2a18','#1b5e20','#2e7d32','#43a047','#66bb6a','#a5d6a7'];

const colorForRatio = ratio => {
  if(!ratio || ratio <= 0) return '#1a1d36';
  if(ratio > 0.83) return GREEN_SCALE[5];
  if(ratio > 0.66) return GREEN_SCALE[4];
  if(ratio > 0.50) return GREEN_SCALE[3];
  if(ratio > 0.33) return GREEN_SCALE[2];
  if(ratio > 0.16) return GREEN_SCALE[1];
  return GREEN_SCALE[0];
};

const fmtIN = n => {
  if(n === null || n === undefined || isNaN(n)) return '0';
  const num = Number(n);
  if(num === 0) return '0';
  return num.toLocaleString('en-IN');
};

const shortName = name => {
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

// CSS for map labels + tooltips (DARK theme)
const MAP_CSS = `
  .stp-mapview { font-family: Inter, system-ui, sans-serif; }
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
    text-shadow: 0 0 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.9);
    white-space: nowrap;
  }
  .stp-state-label-inner .lbl-val {
    color: #86efac; font-size: 9px; font-weight: 700;
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
    color: #86efac; font-weight: 800; font-size: 10px;
    display: block; margin-top: 1px;
  }
  .stp-tooltip {
    background: #0c0c1e !important;
    border: 1px solid #22c55e44 !important;
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
const KpiCell = ({label, value, color=T.acc, sub}) => (
  <div style={{
    background:T.bg3, borderRadius:6, padding:'8px 10px',
    border:'1px solid '+T.bd1, minWidth:0, textAlign:'center'
  }}>
    <div style={{fontSize:10, color:T.blue, fontWeight:700, marginBottom:4, letterSpacing:'.02em'}}>{label}</div>
    <div style={{fontSize:18, fontWeight:800, color, lineHeight:1.1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{value}</div>
    {sub && <div style={{fontSize:9, color:T.t3, marginTop:2}}>{sub}</div>}
  </div>
);

const KpiGroup = ({title, accent=T.blue, children}) => (
  <div style={{
    background:T.bg2, borderRadius:10, padding:'10px 12px',
    border:'1px solid '+T.bd1
  }}>
    <div style={{fontSize:11, fontWeight:700, color:accent, textAlign:'center', marginBottom:8, letterSpacing:'.03em'}}>{title}</div>
    <div style={{display:'grid', gap:6}}>{children}</div>
  </div>
);

const ToolBtn = ({active, onClick, icon:Icon, label, disabled=false}) => (
  <button onClick={onClick} disabled={disabled} style={{
    display:'flex', alignItems:'center', gap:4,
    background: active ? T.accBg : T.bg2,
    color: active ? '#86efac' : T.t2,
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
export default function IndiaMap({ dealers=[], users={}, onOpenDealer }) {
  const { selectedMonthIdx } = useMonth();

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
  const maskLyrRef    = useRef(null);   // mask polygon that hides everything outside selected state
  const baseTileRef   = useRef(null);   // base dark tiles ref (so we can hide them when drilled)

  const [selected, setSelected]     = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
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
  const [viewMode, setViewMode]     = useState('sales');
  const [showLabels, setShowLabels] = useState(true);    // our state name labels
  const [showCount, setShowCount]   = useState(true);
  const [showNames, setShowNames]   = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);    // map's built-in places (cities/towns/roads)
  const [showDistricts, setShowDistricts] = useState(true); // district boundaries when drilled in
  const [districtsReady, setDistrictsReady] = useState(false);
  const [hoverDistrict, setHoverDistrict]   = useState(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [geoReady, setGeoReady]         = useState(false);

  const drillLevel = selected ? 'state' : 'india';

  // ── Aggregate dealers per state ──────────────────────────────────────────
  const stateData = useMemo(() => {
    const map = {};
    dealers.forEach(d => {
      const norm = normalizeState(d.state);
      if(!norm) return;
      const key = norm.toLowerCase();
      if(!map[key]) map[key] = { name:norm, dealers:[], total:0, target:0, bySM:{} };
      const ach = Number(d.months?.[selectedMonthIdx] || 0);
      const tgt = monthTarget(d, selectedMonthIdx);
      map[key].dealers.push(d);
      map[key].total  += ach;
      map[key].target += tgt;
      const smKey = d.salesman || 'Unassigned';
      if(!map[key].bySM[smKey]) map[key].bySM[smKey] = { u:0, n:0 };
      map[key].bySM[smKey].u += ach;
      map[key].bySM[smKey].n += 1;
    });
    return map;
  }, [dealers, selectedMonthIdx]);

  const maxStateVal = useMemo(() => {
    const vals = Object.values(stateData).map(d => {
      if(viewMode === 'dealers')     return d.dealers.length;
      if(viewMode === 'achievement') return d.target ? Math.round((d.total/d.target)*100) : 0;
      return d.total;
    });
    return Math.max(...vals, 1);
  }, [stateData, viewMode]);

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
      const ach = Number(d.months?.[selectedMonthIdx] || 0);
      const tgt = monthTarget(d, selectedMonthIdx);
      map[key].dealers.push(d);
      map[key].total  += ach;
      map[key].target += tgt;
      if(ach > 0) map[key].qty++;
    });
    return Object.values(map).sort((a,b) => b.total - a.total);
  }, [selected, stateData, selectedMonthIdx]);

  const maxCityVal = useMemo(() => Math.max(1, ...cityData.map(c => c.total)), [cityData]);

  // ── KPI cards ────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const det  = selected ? stateData[selected.toLowerCase()] : null;
    const list = det ? det.dealers : dealers;
    const k = { active:0, star:0, inactive:0, lost:0, total:list.length, sales:0, target:0, qty:0 };
    list.forEach(d => {
      const s = (d.status || '').toUpperCase();
      if(s.includes('STAR'))                          k.star++;
      else if(s.includes('LOST'))                     k.lost++;
      else if(s.includes('INACTIVE') || s === 'DEAD') k.inactive++;
      else                                            k.active++;
      const ach = Number(d.months?.[selectedMonthIdx] || 0);
      const tgt = monthTarget(d, selectedMonthIdx);
      k.sales  += ach;
      k.target += tgt;
      if(ach > 0) k.qty++;
    });
    k.ach = k.target ? Math.round((k.sales / k.target) * 100) : 0;
    k.avgSales = k.total ? Math.round(k.sales / k.total) : 0;
    return k;
  }, [dealers, stateData, selected, selectedMonthIdx]);

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
      center:[22, 80], zoom:4.4, zoomControl:true, scrollWheelZoom:true,
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
    baseTileRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
      attribution:'© CartoDB', subdomains:'abcd', maxZoom:19,
    }).addTo(map);

    // Overlay — only the place labels (cities, towns, roads, water features)
    placeLayerRef.current = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      { attribution:'', subdomains:'abcd', maxZoom:19, pane:'placesPane' }
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

  // ── Render choropleth + state labels ─────────────────────────────────────
  useEffect(() => {
    if(!leafletReady || !geoReady || !mapObjRef.current || !geoRef.current) return;
    const L = window.L, map = mapObjRef.current;

    if(stateLyrRef.current){ stateLyrRef.current.remove(); stateLyrRef.current = null; }
    labelLyrRef.current.forEach(l => l.remove());
    labelLyrRef.current = [];

    const getVal = key => {
      const d = stateData[key]; if(!d) return 0;
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

        // When drilled into a state, other states are hidden by the mask
        // anyway, but keep them invisible/non-interactive to be safe.
        if(drillLevel === 'state' && !isSel){
          return { color:'transparent', weight:0, fillOpacity:0, opacity:0 };
        }
        return {
          color: isSel ? T.acc : T.bd2,
          weight: isSel ? 2.5 : 0.8,
          // selected state: light fill so the districts show through clearly
          fillColor: isSel ? colorForRatio(ratio || 0.4) : colorForRatio(ratio),
          fillOpacity: isSel ? 0.35 : 0.82,
          opacity: 1,
        };
      },
      onEachFeature: (feature, layer) => {
        const name = getFeatureStateName(feature);
        const key  = name?.toLowerCase();
        const d    = key ? stateData[key] : null;
        const sales       = d?.total || 0;
        const dealerCount = d?.dealers?.length || 0;
        const qty         = (d?.dealers || []).filter(x => Number(x.months?.[selectedMonthIdx]||0) > 0).length;
        const target      = d?.target || 0;
        const achPct      = target ? Math.round((sales/target)*100) : 0;

        layer.bindTooltip(
          '<div style="font-family:Inter,system-ui;background:#0c0c1e;border-radius:8px;padding:10px 12px;min-width:170px;color:#e2e0f0">' +
          '<div style="font-size:13px;font-weight:800;color:#e2e0f0;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #1e1e38">' + (d?.name || name || '—') + '</div>' +
          '<div style="font-size:11px;color:#a5a4b8;display:flex;align-items:center;gap:6px;margin-bottom:3px">' +
            '<span style="font-weight:700;color:#86efac">Sales :</span>' +
            '<span style="color:#fbbf24;font-weight:700">V : ' + fmtIN(sales) + '</span>' +
            '<span style="color:#6c6b85">|</span>' +
            '<span style="color:#fbbf24;font-weight:700">Q : ' + qty + '</span>' +
          '</div>' +
          '<div style="font-size:11px;color:#a5a4b8"><span style="font-weight:700;color:#e2e0f0">Count :</span> ' + dealerCount + (target ? ' | ' + achPct + '%' : '') + '</div>' +
          (drillLevel === 'india' ? '<div style="font-size:10px;color:#6c6b85;margin-top:6px;padding-top:5px;border-top:1px dashed #1e1e38">Click to see city-wise sales →</div>' : '') +
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

    if(showLabels && drillLevel === 'india'){
      geoRef.current.features.forEach(feature => {
        const name = getFeatureStateName(feature);
        const key  = name?.toLowerCase();
        const val  = key ? getVal(key) : 0;
        try {
          const tmp    = L.geoJSON(feature);
          const center = tmp.getBounds().getCenter();
          const sn     = shortName(name || '?');
          const showVal = showCount && val > 0;
          const showNm  = showNames;
          if(!showVal && !showNm) return;
          const label = L.tooltip({
            permanent: true, direction:'center',
            className:'stp-state-label', interactive:false, opacity:1,
          })
          .setContent(
            '<div class="stp-state-label-inner">' +
              (showNm ? sn : '') +
              (showVal ? '<span class="lbl-val">' + fmtIN(val) + '</span>' : '') +
            '</div>'
          )
          .setLatLng(center);
          label.addTo(map);
          labelLyrRef.current.push(label);
        } catch {}
      });
    }
  }, [leafletReady, geoReady, stateData, viewMode, maxStateVal, selected, showLabels, showCount, showNames, drillLevel, selectedMonthIdx]);

  // ── Render CITY markers when drilled in ──────────────────────────────────
  useEffect(() => {
    if(!leafletReady || !mapObjRef.current) return;
    const L = window.L, map = mapObjRef.current;

    cityLyrRef.current.forEach(m => { try { map.removeLayer(m); } catch {} });
    cityLyrRef.current = [];
    cityLblRef.current.forEach(l => { try { l.remove(); } catch {} });
    cityLblRef.current = [];

    if(drillLevel !== 'state') return;

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
        fillColor: isSel ? '#fbbf24' : colorForRatio(0.5 + ratio * 0.5),
        color: isSel ? '#f59e0b' : T.acc,
        weight: isSel ? 3 : 2,
        fillOpacity: 0.9,
      });

      marker.bindTooltip(
        '<div style="font-family:Inter,system-ui;background:#0c0c1e;border-radius:8px;padding:10px 12px;min-width:170px;color:#e2e0f0">' +
        '<div style="font-size:13px;font-weight:800;color:#e2e0f0;margin-bottom:6px;padding-bottom:5px;border-bottom:1px solid #1e1e38">' + city.name + '</div>' +
        '<div style="font-size:11px;color:#a5a4b8;display:flex;align-items:center;gap:6px;margin-bottom:3px">' +
          '<span style="font-weight:700;color:#86efac">Sales :</span>' +
          '<span style="color:#fbbf24;font-weight:700">V : ' + fmtIN(city.total) + '</span>' +
          '<span style="color:#6c6b85">|</span>' +
          '<span style="color:#fbbf24;font-weight:700">Q : ' + city.qty + '</span>' +
        '</div>' +
        '<div style="font-size:11px;color:#a5a4b8"><span style="font-weight:700;color:#e2e0f0">Dealers :</span> ' + city.dealers.length + (city.target ? ' | ' + Math.round((city.total/city.target)*100) + '% of target' : '') + '</div>' +
        '<div style="font-size:10px;color:#6c6b85;margin-top:6px;padding-top:5px;border-top:1px dashed #1e1e38">Click to see dealers →</div>' +
        '</div>',
        { sticky:true, opacity:1, className:'stp-tooltip', direction:'top' }
      );

      marker.on('click', () => setSelectedCity(city.name));
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
  }, [leafletReady, drillLevel, selected, cityData, maxCityVal, selectedCity]);

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
    if (!zoomTrigger && !cityTrigger) return;

    // Pool of candidate dealers (any dealer with a pincode is eligible —
    // GPS is a bonus, not a requirement, so sales-only records still show).
    //   - drilled into a city → just that city's dealers
    //   - zoomed only        → every dealer, then filter by viewport after
    //                          we've resolved coordinates below.
    let poolDealers;
    if (cityTrigger) {
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
      g.total  += Number(d.months?.[selectedMonthIdx] || 0);
      g.target += Number(monthTarget(d, selectedMonthIdx) || 0);
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
        if (zoomTrigger && !cityTrigger) {
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
      const fillColor = hasSales ? '#fbbf24' : '#818cf8';
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
        '<div style="font-size:12px;font-weight:800;color:' + (hasSales ? '#fbbf24' : '#a5b4fc') + ';margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid #1e1e38">' +
          (g.area ? g.area + ' · ' : '') + 'PIN ' + g.pin +
          (g.city ? '<div style="font-size:10px;color:#a5a4b8;font-weight:500;margin-top:2px">' + g.city + '</div>' : '') +
        '</div>' +
        '<div style="font-size:11px;color:#a5a4b8;margin-bottom:2px">' +
          '<b style="color:#86efac">Sales:</b> ' + fmtIN(g.total) +
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

      // Permanent floating label — area name (highlighted amber where sales
      // exist) + PIN + sales value. Users see the area name immediately
      // without needing to hover.
      const areaLabel = g.area
        ? '<span class="lbl-area" style="color:' + (hasSales ? '#fbbf24' : '#a5b4fc') + ';font-weight:700">' + g.area + '</span> · '
        : '';
      const label = L.tooltip({
        permanent: true, direction: 'top', offset: [0, -radius - 2],
        className: 'stp-city-label', interactive: false, opacity: 1,
      })
        .setContent(
          '<div class="stp-city-label-inner">' +
            areaLabel + g.pin +
            (hasSales ? '<span class="lbl-val" style="color:#fbbf24">' + fmtIN(g.total) + '</span>' : '') +
          '</div>'
        )
        .setLatLng([lat, lng]);
      label.addTo(map);
      pincodeLblRef.current.push(label);
    }
  }, [leafletReady, drillLevel, selectedCity, cityData, selectedMonthIdx, mapZoom, dealers]);

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
      let total = 0, target = 0;
      matched.forEach(d => {
        total  += Number(d.months?.[selectedMonthIdx] || 0);
        target += monthTarget(d, selectedMonthIdx);
      });
      out[key] = { name:dname, dealers:matched, total, target };
    });
    return out;
  }, [selected, districtsReady, stateData, selectedMonthIdx]);

  const maxDistrictVal = useMemo(
    () => Math.max(1, ...Object.values(districtData).map(d => d.total)),
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
        const d     = districtData[dname];
        const ratio = d && maxDistrictVal ? d.total / maxDistrictVal : 0;
        return {
          color: T.acc,
          weight: 1,
          dashArray: '3,3',
          fillColor: d && d.total > 0 ? colorForRatio(0.3 + ratio * 0.7) : 'transparent',
          fillOpacity: d && d.total > 0 ? 0.55 : 0,
          opacity: 0.8,
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
        layer.bindTooltip(
          '<div style="font-family:Inter,system-ui;background:#0c0c1e;border-radius:8px;padding:9px 12px;min-width:160px;color:#e2e0f0">' +
          '<div style="font-size:12px;font-weight:800;color:#86efac;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #1e1e38">' + dname + ' District</div>' +
          '<div style="font-size:11px;color:#a5a4b8;margin-bottom:2px"><b style="color:#fbbf24">Sales :</b> V : ' + fmtIN(total) + '</div>' +
          '<div style="font-size:11px;color:#a5a4b8"><b style="color:#fbbf24">Dealers :</b> ' + cnt + (tgt ? ' | ' + pctv + '% of target' : '') + '</div>' +
          (cnt === 0 ? '<div style="font-size:10px;color:#6c6b85;margin-top:5px;padding-top:4px;border-top:1px dashed #1e1e38">No dealers in this district yet</div>' : '') +
          '</div>',
          { sticky:true, opacity:1, className:'stp-tooltip', direction:'top' }
        );
        layer.on({
          mouseover: e => { e.target.setStyle({ weight:2.5, fillOpacity:0.75, dashArray:'' }); setHoverDistrict(dname); },
          mouseout:  e => { if(districtLyrRef.current) districtLyrRef.current.resetStyle(e.target); setHoverDistrict(null); },
        });
      },
    }).addTo(map);
    districtLyrRef.current = districtLayer;

    // District name labels — small, light
    stateFeatures.forEach(f => {
      try {
        const dname = getDistrictName(f);
        if(!dname) return;
        const tmp = L.geoJSON(f);
        const center = tmp.getBounds().getCenter();
        const d = districtData[dname.toLowerCase()];
        const label = L.tooltip({
          permanent:true, direction:'center',
          className:'stp-state-label', interactive:false, opacity:1,
        })
        .setContent(
          '<div class="stp-state-label-inner" style="font-size:8px;opacity:.9">' + dname +
          (d && d.total > 0 ? '<span class="lbl-val" style="font-size:8px">' + fmtIN(d.total) + '</span>' : '') +
          '</div>'
        )
        .setLatLng(center);
        label.addTo(map);
        districtLblRef.current.push(label);
      } catch {}
    });
  }, [leafletReady, drillLevel, selected, showDistricts, districtsReady, districtData, maxDistrictVal]);

  const districtList = useMemo(
    () => Object.values(districtData).sort((a,b) => b.total - a.total),
    [districtData]
  );
  const districtsWithSales = districtList.filter(d => d.total > 0).length;

  const backToIndia = () => {
    setSelected(null);
    setSelectedCity(null);
    try {
      if(mapObjRef.current){
        mapObjRef.current.setMaxBounds(null);   // release the state lock
        mapObjRef.current.setView([22, 80], 4.4);
      }
    } catch {}
  };

  const selectedCityObj = selectedCity ? cityData.find(c => c.name.toLowerCase() === selectedCity.toLowerCase()) : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fade stp-mapview" style={{padding:0, color:T.t1}}>
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:10, flexWrap:'wrap'}}>
        <Globe size={14} color={T.acc}/>
        <span style={{color:T.acc, fontSize:13, fontWeight:700, cursor:'pointer'}} onClick={backToIndia}>World</span>
        <ChevronRight size={13} color={T.t3}/>
        <span style={{color: selected ? T.acc : T.t1, fontSize:13, fontWeight:700, cursor:'pointer'}} onClick={backToIndia}>India</span>
        {selected && (
          <>
            <ChevronRight size={13} color={T.t3}/>
            <span style={{color: selectedCity ? T.acc : T.t1, fontSize:13, fontWeight:800, cursor:'pointer'}} onClick={() => setSelectedCity(null)}>{selected}</span>
          </>
        )}
        {selectedCity && (
          <>
            <ChevronRight size={13} color={T.t3}/>
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
        <span style={{fontSize:11, color:T.t2}}>Period: <b style={{color:T.acc}}>{MO[selectedMonthIdx]}</b></span>
      </div>

      {/* ── KPI Cards Row ─────────────────────────────────────────────── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',
        gap:10, marginBottom:10,
      }}>
        <KpiGroup title={selected ? (selected + ' — Dealers') : 'Dealers'} accent={T.blue}>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6}}>
            <KpiCell label="Active"   value={kpis.active}   color="#86efac"/>
            <KpiCell label="Star"     value={kpis.star}     color={T.hot2}/>
            <KpiCell label="Inactive" value={kpis.inactive} color={T.t2}/>
            <KpiCell label="Lost"     value={kpis.lost}     color={T.hot}/>
          </div>
        </KpiGroup>

        <KpiGroup title={selected ? 'In ' + selected : 'Selected'} accent={T.hot2}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
            <KpiCell label="Qty"   value={fmtIN(kpis.qty)} color="#86efac"/>
            <KpiCell label="Value" value={fmtIN(kpis.sales)} color="#86efac"/>
          </div>
        </KpiGroup>

        <KpiGroup title={selected ? 'Cities (' + cityData.length + ')' : 'Average (' + Object.keys(stateData).length + ')'} accent={T.cyan}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
            {selected ? (
              <>
                <KpiCell label="Total" value={cityData.length} color={T.cyan}/>
                <KpiCell label="Top"   value={cityData[0]?.name || '—'} color="#86efac" sub={cityData[0] ? fmtIN(cityData[0].total) : null}/>
              </>
            ) : (
              <>
                <KpiCell label="Qty"   value={kpis.total ? Math.round(kpis.qty / Math.max(Object.keys(stateData).length,1)) : 0} color={T.cyan}/>
                <KpiCell label="Value" value={fmtIN(kpis.avgSales)} color="#86efac" sub={kpis.ach ? kpis.ach + '% of target' : null}/>
              </>
            )}
          </div>
        </KpiGroup>
      </div>

      {/* ── Map Card ──────────────────────────────────────────────────── */}
      <div style={{
        background:T.bg1, borderRadius:12, border:'1px solid '+T.bd1,
        overflow:'hidden', marginBottom:10,
        boxShadow:'0 1px 2px rgba(0,0,0,.2)',
      }}>
        {/* Toolbar */}
        <div style={{
          padding:'10px 14px', background:T.bg2,
          borderBottom:'1px solid '+T.bd1,
          display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
        }}>
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

          <ToolBtn active={false}     icon={TrendingUp} label="Trend"  onClick={() => {}}/>
          <ToolBtn active={showNames}  icon={Type}      label="Name"   onClick={() => setShowNames(s => !s)}/>
          <ToolBtn active={showCount}  icon={Hash}      label="Count"  onClick={() => setShowCount(s => !s)}/>
          <ToolBtn active={showLabels} icon={Layers}    label="Labels" onClick={() => setShowLabels(s => !s)}/>
          <ToolBtn active={showPlaces} icon={MapPin}    label="Places" onClick={() => setShowPlaces(s => !s)}/>
          {drillLevel === 'state' && (
            <ToolBtn active={showDistricts} icon={Layers} label="Districts" onClick={() => setShowDistricts(s => !s)}/>
          )}

          <div style={{flex:1}}/>

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
          <div ref={mapRef} style={{height:'clamp(360px, 62vw, 600px)', width:'100%', background:T.bg0}}/>

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
            const ach = d.months?.[selectedMonthIdx] || 0;
            const tgt = monthTarget(d, selectedMonthIdx);
            return (
              <div style={{
                position:'absolute', top:12, right:12, bottom:12, width:360, maxWidth:'92%',
                background:'#0c0c1e', border:'1px solid '+T.bd1, borderRadius:12,
                boxShadow:'0 20px 40px rgba(0,0,0,0.5)',
                display:'flex', flexDirection:'column', zIndex:400,
                overflow:'hidden',
              }}>
                {/* Header */}
                <div style={{padding:'12px 14px', borderBottom:'1px solid '+T.bd1, display:'flex', alignItems:'center', gap:8}}>
                  {d.city && (
                    <span style={{fontSize:10, padding:'3px 8px', borderRadius:5, background:'rgba(129,140,248,0.15)', color:'#a5b4fc', fontWeight:800, textTransform:'uppercase', letterSpacing:'.05em'}}>{d.city}</span>
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
                    <div style={{padding:'10px 12px', background:'rgba(129,140,248,0.10)', border:'1px solid rgba(129,140,248,0.25)', borderRadius:8}}>
                      <div style={{fontSize:14, fontWeight:800, color:'#a5b4fc', textTransform:'uppercase'}}>{d.city || '—'}</div>
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
                        <span style={{color:'#86efac'}}>{fmtIN(ach)}</span>
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
                    <div style={{border:'1px solid rgba(52,211,153,0.35)', borderRadius:10, padding:10, background:'rgba(52,211,153,0.05)'}}>
                      <div style={{fontSize:10, fontWeight:800, color:'#86efac', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8, display:'flex', alignItems:'center', gap:6}}>
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
                            <span style={{width:8, height:8, borderRadius:'50%', background:'#818cf8', flexShrink:0}}/>
                            <span style={{flex:1, minWidth:0, fontSize:11, fontWeight:700, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{n.name}</span>
                            <span style={{fontSize:9, color:T.t3, whiteSpace:'nowrap'}}>{n.city || ''}</span>
                            <span style={{fontSize:11, color:'#86efac', fontWeight:800, whiteSpace:'nowrap'}}>{n._dist.toFixed(1)}km</span>
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
                background:'rgba(12,12,30,0.95)', padding:'8px 14px',
                borderRadius:7, border:'1px solid '+T.bd1,
              }}>Add a “State” column to your dealer data to see the map.</div>
            </div>
          )}
          {drillLevel === 'state' && cityData.length > 0 && unmappedCities.length > 0 && (
            <div style={{
              position:'absolute', top:14, left:14, zIndex:1000,
              background:'#3a2a05', border:'1px solid #92400e',
              borderRadius:7, padding:'6px 10px', fontSize:11, color:'#fbbf24',
              maxWidth:260,
            }}>
              ⚠ No coordinates for: {unmappedCities.slice(0, 3).map(c => c.name).join(', ')}
              {unmappedCities.length > 3 ? ` + ${unmappedCities.length - 3} more` : ''}
            </div>
          )}
          {drillLevel === 'state' && !districtsReady && (
            <div style={{
              position:'absolute', top:14, right:14, zIndex:1000,
              background:'rgba(12,12,30,.95)', border:'1px solid '+T.bd2,
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
              background:'rgba(12,12,30,.95)', border:'1px solid '+T.accD,
              borderRadius:7, padding:'5px 10px', fontSize:11, color:'#86efac',
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
          <span style={{fontSize:11, fontWeight:700, color:'#86efac'}}>High</span>
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
      </div>

      {/* ── Bottom row ──────────────────────────────────────────────────── */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:10}}>
        {drillLevel === 'state' && (
          <div className="card" style={{padding:0, overflow:'hidden', background:T.bg1, border:'1px solid '+T.bd1}}>
            <div style={{
              padding:'10px 12px', background:T.accBg,
              borderBottom:'1px solid '+T.accD,
              display:'flex', alignItems:'center', gap:8,
            }}>
              <MapPin size={13} color="#86efac"/>
              <span style={{fontSize:13, fontWeight:700, color:'#86efac', flex:1}}>
                Cities in {selected} ({cityData.length})
              </span>
              <span style={{fontSize:11, color:T.t3}}>— {MO[selectedMonthIdx]}</span>
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
                            <span style={{fontSize:10, color:T.t3, width:16, textAlign:'right'}}>{i+1}</span>
                            <span style={{fontSize:12, fontWeight:700, color:isSel ? '#86efac' : T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{city.name}</span>
                            {!hasCoord && <span style={{fontSize:9, color:T.hot2, background:'#3a2a05', padding:'0 4px', borderRadius:3, border:'1px solid #92400e'}}>no map</span>}
                          </div>
                          <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            <span style={{fontSize:10, color:T.t3}}>{city.dealers.length}d</span>
                            <span style={{fontSize:13, fontWeight:800, color:'#86efac'}}>{fmtIN(city.total)}</span>
                          </div>
                        </div>
                        <div style={{height:4, background:T.bd1, borderRadius:2, marginLeft:22}}>
                          <div style={{height:'100%', width:bar+'%', background:'linear-gradient(90deg,'+T.acc+',#86efac)', borderRadius:2, transition:'width .5s'}}/>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}

        {drillLevel === 'state' && selectedCityObj && (
          <div className="card" style={{padding:0, overflow:'hidden', background:T.bg1, border:'1px solid '+T.bd1}}>
            <div style={{
              padding:'10px 12px', background:'#2a0e0e',
              borderBottom:'1px solid #7f1d1d',
              display:'flex', alignItems:'center', gap:8,
            }}>
              <div style={{width:8, height:8, borderRadius:'50%', background:T.hot2}}/>
              <span style={{fontSize:13, fontWeight:700, color:T.hot2, flex:1}}>{selectedCityObj.name}</span>
              <button onClick={() => setSelectedCity(null)} style={{background:'none', border:'none', color:T.t3, cursor:'pointer'}}>
                <X size={13}/>
              </button>
            </div>
            <div style={{padding:12}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:12}}>
                <KpiCell label="Sales"   value={fmtIN(selectedCityObj.total)}   color="#86efac"/>
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
                  g.total  += Number(d.months?.[selectedMonthIdx] || 0);
                  g.target += Number(monthTarget(d, selectedMonthIdx) || 0);
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
                              <span style={{fontSize:11, fontWeight:700, color:'#86efac', minWidth:60, textAlign:'right'}}>{fmtIN(a.total)}</span>
                              {a.target > 0 && (
                                <span style={{fontSize:10, color:pclr(ap), minWidth:40, textAlign:'right'}}>{spct(a.target, a.total)}</span>
                              )}
                            </button>
                            {open && (
                              <div style={{background:T.bg2, borderTop:'1px solid '+T.bd1}}>
                                {a.dealers
                                  .sort((x,y) => (y.months?.[selectedMonthIdx]||0) - (x.months?.[selectedMonthIdx]||0))
                                  .map(d => {
                                    const ach = d.months?.[selectedMonthIdx] || 0;
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
                                        <span style={{fontSize:11, fontWeight:700, color:'#86efac'}}>{fmtIN(ach)}</span>
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
                      .sort((a,b) => (b.months?.[selectedMonthIdx]||0) - (a.months?.[selectedMonthIdx]||0))
                      .map(d => {
                        const ach = d.months?.[selectedMonthIdx] || 0;
                        const tgt = monthTarget(d, selectedMonthIdx);  // per-month only
                        const dp  = pct(tgt, ach);
                        return (
                          <tr key={d.id}
                              onClick={() => onOpenDealer?.(d.id)}
                              style={{cursor:'pointer', borderBottom:'1px solid '+T.bd1}}
                              onMouseEnter={e => e.currentTarget.style.background = T.bg2}
                              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{padding:'5px 8px', maxWidth:180}}>
                              <div style={{fontWeight:600, color:T.t1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</div>
                              {(d.address || d.pincode) && (
                                <div title={d.address || ''} style={{fontSize:9, color:T.t3, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                                  {d.address ? d.address : ''}{(d.address && d.pincode) ? ' · ' : ''}{d.pincode ? d.pincode : ''}
                                </div>
                              )}
                            </td>
                            <td style={{padding:'5px 8px'}}>
                              {d.status && <span style={{fontSize:9, color:'#86efac', background:T.accBg, padding:'1px 6px', borderRadius:3, whiteSpace:'nowrap', border:'1px solid '+T.accD}}>{d.status}</span>}
                            </td>
                            <td style={{padding:'5px 8px', textAlign:'right', fontWeight:700, color:'#86efac', whiteSpace:'nowrap'}}>{fmtIN(ach)}</td>
                            <td style={{padding:'5px 8px', textAlign:'right', fontSize:10, color:pclr(dp), whiteSpace:'nowrap'}}>{spct(tgt, ach)}</td>
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

        {drillLevel === 'india' && (
          <div className="card" style={{padding:0, overflow:'hidden', background:T.bg1, border:'1px solid '+T.bd1}}>
            <div style={{padding:'10px 12px', borderBottom:'1px solid '+T.bd1, display:'flex', alignItems:'center', gap:6, background:T.bg2}}>
              <Award size={13} color={T.hot2}/>
              <span style={{fontSize:13, fontWeight:700, color:T.t1}}>Top States</span>
              <span style={{fontSize:11, color:T.t3, marginLeft:2}}>— {MO[selectedMonthIdx]}</span>
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
                            <span style={{fontSize:10, color:T.t3, width:16, textAlign:'right'}}>{i+1}</span>
                            <span style={{fontSize:12, fontWeight:700, color:T.t1}}>{name}</span>
                          </div>
                          <div style={{display:'flex', gap:8, alignItems:'center'}}>
                            <span style={{fontSize:10, color:T.t3}}>{dl.length}d</span>
                            <span style={{fontSize:13, fontWeight:800, color:'#86efac'}}>{fmtIN(total)}</span>
                          </div>
                        </div>
                        <div style={{height:4, background:T.bd1, borderRadius:2, marginLeft:22}}>
                          <div style={{height:'100%', width:bar+'%', background:'linear-gradient(90deg,'+T.acc+',#86efac)', borderRadius:2, transition:'width .5s'}}/>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        )}

        <div className="card" style={{background:T.bg1, border:'1px solid '+T.bd1}}>
          <div style={{fontSize:10, fontWeight:700, color:T.t3, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>
            {selected ? selected + ' Summary' : 'India Summary'}
          </div>
          {selected ? [
            {l:'Total dealers',    v:det?.dealers.length || 0, c:T.blue},
            {l:'Districts (total)',v:districtList.length || (districtsReady ? 0 : '…'), c:T.cyan},
            {l:'Districts with sales', v:districtsWithSales, c:'#86efac'},
            {l:'Cities covered',   v:cityData.length, c:'#86efac'},
            {l:'Total sales',      v:fmtIN(det?.total || 0), c:'#86efac'},
            {l:'Total target',     v:fmtIN(det?.target || 0), c:T.cyan},
            {l:'Achievement',      v:det?.target ? pct(det.target, det.total)+'%' : 'N/T', c:pclr(det?.target ? pct(det.target, det.total) : null)},
            {l:'Unmapped cities',  v:unmappedCities.length, c:unmappedCities.length > 0 ? T.hot2 : T.t3},
          ].map(k => (
            <div key={k.l} style={{display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid '+T.bd1, fontSize:12}}>
              <span style={{color:T.t2}}>{k.l}</span>
              <span style={{fontWeight:700, color:k.c}}>{k.v}</span>
            </div>
          )) : [
            {l:'States covered',  v:Object.keys(stateData).length, c:'#86efac'},
            {l:'Total sales',     v:fmtIN(Object.values(stateData).reduce((s,d) => s + d.total, 0)), c:'#86efac'},
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
    </div>
  );
}
