// Shared pieces of the BI-style map (Map View and its Compare view):
// boundary files, dealer → region matching, colours and drawing helpers.
//
// Boundaries live in client/public/geo (simplified from datta07/INDIAN-SHAPEFILES,
// MIT): states.json, districts/<state>.json, talukas/<state>.json. Each is a few
// KB to a few hundred KB, fetched once and cached.

const GEO_BASE = '/geo/';

// ── Leaflet (loaded from the CDN once, shared with the old map) ──────────────
let leafletP = null;
export function loadLeaflet(){
  if(typeof window !== 'undefined' && window.L) return Promise.resolve(window.L);
  if(leafletP) return leafletP;
  leafletP = new Promise((resolve, reject) => {
    if(!document.getElementById('leaflet-css')){
      const l = document.createElement('link');
      l.id = 'leaflet-css'; l.rel = 'stylesheet'; l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }
    let s = document.getElementById('leaflet-js');
    if(!s){
      s = document.createElement('script');
      s.id = 'leaflet-js'; s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener('load', () => resolve(window.L));
    s.addEventListener('error', () => { leafletP = null; reject(new Error('Map library did not load')); });
  });
  return leafletP;
}

// ── Boundary files ───────────────────────────────────────────────────────────
const geoCache = {};
const getGeo = path => geoCache[path] || (geoCache[path] = fetch(GEO_BASE + path)
  .then(r => { if(!r.ok) throw new Error('No map for ' + path); return r.json(); })
  .catch(e => { delete geoCache[path]; throw e; }));
export const stateSlug = n => String(n || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const loadStates    = ()  => getGeo('states.json');
export const loadDistricts = st  => getGeo('districts/' + stateSlug(st) + '.json');
export const loadTalukas   = st  => getGeo('talukas/' + stateSlug(st) + '.json');

// ── Names ────────────────────────────────────────────────────────────────────
const STATE_ALIAS = {
  orissa:'odisha', pondicherry:'puducherry', uttaranchal:'uttarakhand', nctofdelhi:'delhi', newdelhi:'delhi',
  jammukashmir:'jammuandkashmir', telengana:'telangana', chattisgarh:'chhattisgarh', tamilnad:'tamilnadu',
  andamanandnicobarislands:'andamanandnicobar', dadraandnagarhavelianddamananddiu:'dadraandnagarhaveli',
};
/** One key for every spelling of a state ("Tamilnadu", "Tamil Nadu", "TAMIL NADU" → "tamilnadu"). */
export const stateKey = s => { const k = String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, ''); return STATE_ALIAS[k] || k; };
/** A spelling-proof skeleton: first letter + consonants, repeats collapsed
 *  ("Chamarajanagara" and "Chamrajnagar" both → "cmrjngr"). */
export const skel = s => {
  const t = String(s || '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z]/g, '');
  if(!t) return '';
  return (t[0] + t.slice(1).replace(/[aeiouyh]/g, '')).replace(/(.)\1+/g, '$1');
};

// City / town → its district, where the two names differ. Keys are lower case.
const CITY_DISTRICT = {
  // Karnataka
  bangalore:'bengaluru urban', bengaluru:'bengaluru urban', jnanabharathi:'bengaluru urban', sahakarnagar:'bengaluru urban', doddakanahalli:'bengaluru urban',
  yelahanka:'bengaluru urban', whitefield:'bengaluru urban', peenya:'bengaluru urban', anekal:'bengaluru urban', kengeri:'bengaluru urban',
  hoskote:'bengaluru rural', dodballapur:'bengaluru rural', doddaballapur:'bengaluru rural', nelamangala:'bengaluru rural', devanahalli:'bengaluru rural',
  hubballi:'dharwad', hubli:'dharwad', 'hubli dharwad':'dharwad',
  mangaluru:'dakshina kannada', mangalore:'dakshina kannada', surathkal:'dakshina kannada', mulki:'dakshina kannada', thumbay:'dakshina kannada',
  puttur:'dakshina kannada', sullia:'dakshina kannada', bantwal:'dakshina kannada', moodbidri:'dakshina kannada', ullal:'dakshina kannada',
  shimoga:'shivamogga', sagar:'shivamogga', bhadravati:'shivamogga', shikaripura:'shivamogga',
  hosapete:'vijayanagara', hospet:'vijayanagara', 'hagaribommanahalli':'vijayanagara',
  mudhol:'bagalkote', jamkhandi:'bagalkote', bagalkot:'bagalkote', ilkal:'bagalkote',
  ramanagaram:'ramanagara', channapatna:'ramanagara', kanakapura:'ramanagara',
  gokak:'belagavi', athani:'belagavi', chikkodi:'belagavi', chikodi:'belagavi', borgaon:'belagavi', ugar:'belagavi', belgaum:'belagavi', nippani:'belagavi', bailhongal:'belagavi',
  malur:'kolar', bangarpet:'kolar', kgf:'kolar', mulbagal:'kolar',
  kundapura:'udupi', kundapur:'udupi', manipal:'udupi', karkala:'udupi',
  gangavathi:'koppal', gangavati:'koppal', karatgi:'koppal',
  channagiri:'davanagere', davangere:'davanagere', harihar:'davanagere',
  haliyal:'uttara kannada', karwar:'uttara kannada', sirsi:'uttara kannada', bhatkal:'uttara kannada', dandeli:'uttara kannada', kumta:'uttara kannada',
  gajendragada:'gadag', muddebihal:'vijayapura', bijapur:'vijayapura', sindagi:'vijayapura',
  sindhur:'raichur', sindhanur:'raichur', manvi:'raichur', hunsur:'mysuru', mysore:'mysuru', nanjangud:'mysuru',
  yadagiri:'yadgir', kadur:'chikkamagaluru', chikmagalur:'chikkamagaluru', tiptur:'tumakuru', tumkur:'tumakuru',
  kushalnagar:'kodagu', virajpet:'kodagu', madikeri:'kodagu', ranibennur:'haveri', chintamani:'chikkaballapura',
  gulbarga:'kalaburagi', bellary:'ballari', sandur:'ballari', siruguppa:'ballari', bidar:'bidar', basavakalyan:'bidar',
  // Kerala
  kochi:'ernakulam', cochin:'ernakulam', aluva:'ernakulam', kakkanad:'ernakulam', angamally:'ernakulam', angamaly:'ernakulam',
  edapally:'ernakulam', edappally:'ernakulam', kalamassery:'ernakulam', irumpanam:'ernakulam', 'elamakkara p o':'ernakulam', elamakkara:'ernakulam',
  varappuzha:'ernakulam', kaloor:'ernakulam', vennala:'ernakulam', muvattupuzha:'ernakulam', perumbavoor:'ernakulam', koothattukulam:'ernakulam',
  thiruvankulam:'ernakulam', manakunnam:'ernakulam', thiruvaniyur:'ernakulam', tripunithura:'ernakulam', vyttila:'ernakulam',
  manjeri:'malappuram', moonniyoor:'malappuram', 'a r nagar':'malappuram', changaramkulam:'malappuram', thirunavaya:'malappuram',
  perinthalmanna:'malappuram', mampad:'malappuram', tirur:'malappuram', kottakkal:'malappuram', ponnani:'malappuram',
  payyannur:'kannur', thalassery:'kannur', tellicherry:'kannur', chirakkal:'kannur', thaliparamba:'kannur', taliparamba:'kannur', cannanore:'kannur',
  kanhangad:'kasaragod', pullur:'kasaragod', vorkady:'kasaragod', kasaragoda:'kasaragod', kasargod:'kasaragod',
  muttil:'wayanad', mananthavady:'wayanad', kalpetta:'wayanad', 'sulthan bathery':'wayanad',
  vadakara:'kozhikode', atholi:'kozhikode', thamarassery:'kozhikode', kallai:'kozhikode', feroke:'kozhikode', koyilandy:'kozhikode',
  koduvally:'kozhikode', nadapuram:'kozhikode', chevayur:'kozhikode', thiruvannur:'kozhikode', calicut:'kozhikode', kottappally:'kozhikode',
  ottapalam:'palakkad', palghat:'palakkad', cherthala:'alappuzha', alleppey:'alappuzha', eramalloor:'alappuzha',
  changanacherry:'kottayam', kodungallur:'thrissur', trichur:'thrissur', chalakudy:'thrissur', irinjalakuda:'thrissur', guruvayur:'thrissur',
  mallappally:'pathanamthitta', thiruvalla:'pathanamthitta', trivandrum:'thiruvananthapuram', kunnumpuram:'thiruvananthapuram',
  quilon:'kollam', karunagappally:'kollam',
  // Tamil Nadu
  choolai:'chennai', ambattur:'chennai', kodambakkam:'chennai', channi:'chennai', 'ashok nagar':'chennai', teynampet:'chennai', porur:'chennai',
  maduravoyal:'chennai', alapakkam:'chennai', karapakkam:'chennai', madras:'chennai', 't nagar':'chennai', egmore:'chennai', 'anna nagar':'chennai',
  kattupakkam:'tiruvallur', kaghitapattarai:'vellore',
  hosur:'krishnagiri', shoolagiri:'krishnagiri', kaveripattinam:'krishnagiri',
  pollachi:'coimbatore', peelamedu:'coimbatore', madukkarai:'coimbatore', mettupalayam:'coimbatore',
  ambur:'tirupathur', vaniyambadi:'tirupathur', tiruppattur:'tirupathur', tirupattur:'tirupathur',
  palani:'dindigul', oddanchatram:'dindigul', kangayam:'tiruppur', udumalpet:'tiruppur', vellakoil:'tiruppur', palladam:'tiruppur', tirupur:'tiruppur',
  palayapalayam:'erode', gobichettypalyam:'erode', gobichettipalayam:'erode', sathamangalam:'erode', sathyamangalam:'erode', bhavani:'erode',
  nagercoil:'kanniyakumari', kovilpatti:'thoothukudi', tuticorin:'thoothukudi', kumbakonam:'thanjavur', mannargudi:'tiruvarur',
  dindivanam:'viluppuram', tindivanam:'viluppuram', villupuram:'viluppuram', shivagangai:'sivaganga', sivagangai:'sivaganga',
  sevilimedu:'kancheepuram', kanchipuram:'kancheepuram', puduvayal:'pudukkottai', trichy:'tiruchirappalli', tiruchy:'tiruchirappalli',
  ooty:'the nilgiris', udhagamandalam:'the nilgiris', coonoor:'the nilgiris',
  // elsewhere
  vasai:'palghar', virar:'palghar', panaji:'north goa', panjim:'north goa', porvorim:'north goa', mapusa:'north goa', margao:'south goa', nuvem:'south goa', vasco:'south goa',
  guwahati:'kamrup metro', nellore:'sri potti sriramulu nellore', vizag:'visakhapatnam', secunderabad:'hyderabad', gurgaon:'gurugram',
};

// City → its taluka where today's spelling differs from the 2011 taluka name.
const CITY_TALUKA = {
  belagavi:'belgaum', mysuru:'mysore', kalaburagi:'gulbarga', vijayapura:'bijapur', ballari:'bellary', hosapete:'hospet',
  shivamogga:'shimoga', tumakuru:'tumkur', mangaluru:'mangalore', hubballi:'hubli', bagalkote:'bagalkot', chikkamagaluru:'chikmagalur',
  davanagere:'davangere', chamarajanagara:'chamarajanagar', chikkaballapura:'chikballapur', ramanagaram:'ramanagara', yadagiri:'yadgir',
  belgaum:'belgaum', mysore:'mysore', gulbarga:'gulbarga', bijapur:'bijapur', bellary:'bellary', hospet:'hospet', shimoga:'shimoga', tumkur:'tumkur',
  mangalore:'mangalore', hubli:'hubli', kozhikode:'kozhikode', calicut:'kozhikode', trivandrum:'thiruvananthapuram', trichur:'thrissur',
  trichy:'tiruchirappalli', tiruchy:'tiruchirappalli', tuticorin:'thoothukkudi', thoothukudi:'thoothukkudi', ooty:'udhagamandalam',
};

/** A function city → one of `names` (or null). `pickUrban` breaks a tie toward the
 *  "… Urban" district (Bangalore → Bengaluru Urban); otherwise a tie gives null. */
export function makeMatcher(names, { pickUrban = true, aliases = CITY_DISTRICT } = {}){
  const list = names.map(n => ({ n, k: skel(n), lk: String(n).toLowerCase() }));
  const memo = new Map();
  const tryName = q => {
    const k = skel(q);
    if(k.length < 2) return null;
    const exact = list.filter(x => x.k === k);
    if(exact.length === 1) return exact[0].n;
    if(exact.length > 1) return pickUrban ? (exact.find(x => /urban/.test(x.lk)) || exact[0]).n : null;
    if(k.length < 4) return null;
    const near = list.filter(x => x.k.startsWith(k) || (x.k.length >= 4 && k.startsWith(x.k)));
    if(near.length === 1) return near[0].n;
    if(near.length > 1 && pickUrban) { const u = near.find(x => /urban/.test(x.lk)); if(u) return u.n; }
    return null;
  };
  return raw => {
    const c = String(raw || '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
    if(!c) return null;
    if(memo.has(c)) return memo.get(c);
    let r = (aliases[c] && tryName(aliases[c])) || tryName(c);
    if(!r){
      // "chintamani , bangalore" / "kakkanad kochi": try each word
      for(const w of c.split(' ').filter(w => w.length >= 4)){
        r = (aliases[w] && tryName(aliases[w])) || tryName(w);
        if(r) break;
      }
    }
    memo.set(c, r);
    return r;
  };
}

// ── Colours (as in the BI map: green by value, silver for zero, pink below zero)
export const POS = ['#d6efd0', '#aedea4', '#82ca78', '#55b04f'];   // low → high
export const NEG = ['#f8d3d2', '#f2aba9', '#e98482'];              // small → big drop
export const ZERO = 'url(#bi-zero)';
/** A colour function for a set of values, by rank: the top quarter of the
 *  positive values in the darkest green, and so on down; drops in pink the same
 *  way; zero/none in silver. */
export function makeColour(values){
  const pos = values.filter(v => v > 0).sort((a, b) => a - b), neg = values.filter(v => v < 0).map(v => -v).sort((a, b) => a - b);
  const rank = (arr, v) => { let lo = 0, hi = arr.length; while(lo < hi){ const m = (lo + hi) >> 1; if(arr[m] <= v) lo = m + 1; else hi = m; } return lo / arr.length; };  // share at or below v
  const pick = (arr, scale, v) => scale[Math.max(0, Math.min(scale.length - 1, Math.ceil(rank(arr, v) * scale.length) - 1))];
  return v => !v ? ZERO : v > 0 ? pick(pos, POS, v) : pick(neg, NEG, -v);
}
/** The silver gradient used for zero-value regions, added to a map's SVG once. */
export function ensureDefs(map){
  const svg = map?.getPane?.('overlayPane')?.querySelector('svg') || null;
  const panes = map ? [...map.getContainer().querySelectorAll('svg.leaflet-zoom-animated')] : [];
  for(const el of [svg, ...panes]){
    if(!el || el.querySelector('#bi-zero')) continue;
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = '<linearGradient id="bi-zero" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#b9bdb9"/><stop offset=".45" stop-color="#e9ebe9"/><stop offset=".55" stop-color="#e2e4e2"/><stop offset="1" stop-color="#c2c6c2"/></linearGradient>';
    el.insertBefore(defs, el.firstChild);
  }
}

// ── Geometry ─────────────────────────────────────────────────────────────────
/** Where to put a region's label: the centroid of its largest ring, [lat, lng]. */
export function labelPoint(f){
  const g = f?.geometry; if(!g) return null;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
  let best = null, bestA = 0;
  for(const p of polys){
    const ring = p[0]; if(!ring || ring.length < 3) continue;
    let a = 0, cx = 0, cy = 0;
    for(let i = 0, j = ring.length - 1; i < ring.length; j = i++){
      const [x0, y0] = ring[j], [x1, y1] = ring[i], k = x0 * y1 - x1 * y0;
      a += k; cx += (x0 + x1) * k; cy += (y0 + y1) * k;
    }
    a /= 2;
    if(Math.abs(a) > bestA){ bestA = Math.abs(a); best = a ? [cy / (6 * a), cx / (6 * a)] : [ring[0][1], ring[0][0]]; }
  }
  return best;
}
/** [[south, west], [north, east]] of a feature or feature list. */
export function boundsOf(features){
  let s = 90, w = 180, n = -90, e = -180;
  const walk = c => { if(typeof c[0] === 'number'){ const [x, y] = c; if(y < s) s = y; if(y > n) n = y; if(x < w) w = x; if(x > e) e = x; } else c.forEach(walk); };
  (Array.isArray(features) ? features : [features]).forEach(f => f?.geometry && walk(f.geometry.coordinates));
  return s > n ? null : [[s, w], [n, e]];
}

export const fmtIN = n => Number(n || 0).toLocaleString('en-IN');
export const signedIN = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmtIN(Math.abs(n));

// ── Dealers → regions ────────────────────────────────────────────────────────
// level 'india' → states; 'state' → that state's districts; 'district' → its talukas.
// Returns { scope: dealers in the view, by: Map(region name → dealers[]), unmapped: dealers[] }.
const matcherCache = new WeakMap();
const cachedMatcher = (geo, names, opts) => {
  let m = matcherCache.get(geo);
  if(!m){ m = makeMatcher(names, opts); matcherCache.set(geo, m); }
  return m;
};
export function assignDealers({ dealers, level, state, district, statesGeo, districtsGeo, talukasGeo }){
  const by = new Map(), unmapped = [];
  const put = (k, d) => { const a = by.get(k); if(a) a.push(d); else by.set(k, [d]); };
  if(level === 'india'){
    const names = new Map((statesGeo?.features || []).map(f => [stateKey(f.properties.name), f.properties.name]));
    for(const d of dealers){ const n = names.get(stateKey(d.state)); if(n) put(n, d); else unmapped.push(d); }
    return { scope: dealers, by, unmapped };
  }
  const sk = stateKey(state);
  const inState = dealers.filter(d => stateKey(d.state) === sk);
  const dNames = (districtsGeo?.features || []).map(f => f.properties.name);
  const toDistrict = districtsGeo ? cachedMatcher(districtsGeo, dNames, { pickUrban: true }) : () => null;
  if(level === 'state'){
    for(const d of inState){ const n = toDistrict(d.city); if(n) put(n, d); else unmapped.push(d); }
    return { scope: inState, by, unmapped };
  }
  const inDistrict = inState.filter(d => toDistrict(d.city) === district);
  const tFeats = (talukasGeo?.features || []).filter(f => f.properties.d === district);
  const toTaluka = makeMatcher(tFeats.map(f => f.properties.name), { pickUrban: false, aliases: CITY_TALUKA });
  for(const d of inDistrict){ const n = toTaluka(d.city); if(n) put(n, d); else unmapped.push(d); }
  return { scope: inDistrict, by, unmapped };
}

// ── Period (duration) ────────────────────────────────────────────────────────
// Figures are sums over a run of months, counted back from the month picked at
// the top of the app. Trend compares with the same number of months just before.
export const PERIODS = [
  ['month', 'This month'], ['prev', 'Last month'], ['3m', 'Last 3 months'], ['6m', 'Last 6 months'],
  ['quarter', 'This quarter'], ['fy', 'Year to date (Apr–)'], ['custom', 'Custom range…'],
];
const MON3 = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const monthNum = lbl => MON3.indexOf(String(lbl || '').slice(0, 3).toLowerCase()) + 1;
const spanLabel = (MO, idx) => !idx.length ? '' : idx.length === 1 ? MO[idx[0]] : MO[idx[0]] + ' – ' + MO[idx[idx.length - 1]];
export function periodRange(key, sel, MO, from, to){
  const n = MO.length;
  sel = Math.max(0, Math.min(n - 1, sel));
  let a = sel, b = sel;
  const m = monthNum(MO[sel]);
  if(key === 'prev')         { a = b = sel - 1; }
  else if(key === '3m')      { a = sel - 2; }
  else if(key === '6m')      { a = sel - 5; }
  else if(key === 'quarter') { a = m ? sel - ((m - 1) % 3) : sel; }
  else if(key === 'fy')      { a = m ? sel - ((m + 12 - 4) % 12) : sel; }
  else if(key === 'custom')  { a = from ?? sel; b = to ?? sel; if(a > b) [a, b] = [b, a]; }
  a = Math.max(0, Math.min(n - 1, a)); b = Math.max(a, Math.min(n - 1, b));
  const idx = []; for(let i = a; i <= b; i++) idx.push(i);
  const prev = []; for(let i = a - idx.length; i < a; i++) if(i >= 0) prev.push(i);
  return { idx, prev, prevFull: prev.length === idx.length, label: spanLabel(MO, idx), prevLabel: spanLabel(MO, prev), sig: a + ':' + b };
}
/** One dealer's units over some months; with a salesman chosen, only the months he owned it. */
export const sumMonths = (d, idx, sm) => {
  let t = 0;
  for(const i of idx){
    if(sm && (d.monthSalesman?.[i] || d.salesman) !== sm) continue;
    t += Number(d.months?.[i]) || 0;
  }
  return t;
};
/** Customer status for the period: billed if he bought, else by his tier. */
export const tierOf = d => {
  const s = String(d.perfStatus || '').toUpperCase();
  if(s === 'DEAD') return 'lost';
  if(s.includes('INACTIVE')) return 'inactive';
  return 'active';
};
