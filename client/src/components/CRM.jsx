// CRM hub — Attendance, Visits, Leads, Leaves.
// Uses a hidden <input type="file" accept="image/*" capture="environment">
// to grab a fresh camera photo on phones and a file picker on desktop.
// Photos are downscaled to ≤900px and JPEG-encoded to keep payloads small.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera, LogIn as IconIn, LogOut as IconOut, MapPin, Calendar, Plus,
  X, Phone, Mail, Building2, Trash2, Send, RefreshCw, Image as ImageIcon,
  CheckCircle2, AlertCircle, Briefcase, ClipboardList, Users as UsersIcon,
  Filter, Upload, Download, Search,
} from 'lucide-react';
import { api } from '../api';
import { Avatar } from './UI';
import { notify, confirmDialog } from './Toast';
import { VoiceTextarea, VoiceInput } from './VoiceInput';

const todayStr = () => new Date().toISOString().slice(0,10);
const fmtTime  = (d) => new Date(d).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' });
const fmtDate  = (d) => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

// Generic CSV exporter — UTF-8 BOM so Excel opens Indian rupees / accents
// without garbling them.
function exportCSV(filename, headers, rows){
  if(!rows || rows.length === 0){
    notify.info('Nothing to export');
    return;
  }
  const esc = v => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
  notify.success('Exported ' + rows.length + ' rows');
}

// Common pipeline statuses for leads
const LEAD_STATUSES = ['NEW','CONTACTED','QUALIFIED','NEGOTIATION','WON','LOST'];
const LEAD_COLORS   = {
  NEW:         '#a5b4fc',
  CONTACTED:   '#38bdf8',
  QUALIFIED:   '#fbbf24',
  NEGOTIATION: '#fb923c',
  WON:         '#34d399',
  LOST:        '#f87171',
};
const LEAVE_TYPES   = ['CASUAL','SICK','EARNED','UNPAID','OTHER'];

// Downscale + compress an image File to a base64 JPEG data URL ≤900px
async function fileToCompressedDataURL(file, maxDim=900, quality=0.72){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Cannot read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Bad image'));
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width  = Math.round(width  * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Best-effort GPS. On native (Capacitor APK) we use @capacitor/geolocation
// because navigator.geolocation in the Android WebView needs the host
// activity to override onGeolocationPermissionsShowPrompt — without the
// plugin, the WebView silently denies the prompt.
//
// On web, falls back to the standard browser API.
async function getLocation(timeoutMs=10000){
  // Detect Capacitor native platform (APK)
  const isNative = !!(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform());

  if(isNative){
    try {
      const mod = await import('@capacitor/geolocation');
      const Geo = mod.Geolocation;
      // Ask for permission first (a no-op if already granted)
      try { await Geo.requestPermissions({ permissions:['location'] }); } catch{}
      const pos = await Geo.getCurrentPosition({ enableHighAccuracy:true, timeout: timeoutMs, maximumAge: 30000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy };
    } catch(e){
      console.warn('[geo native]', e?.message || e);
      // Fall through to browser API just in case
    }
  }

  return new Promise(resolve => {
    if(!navigator.geolocation) return resolve({ lat:null, lng:null });
    const timer = setTimeout(()=>resolve({ lat:null, lng:null }), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      pos => { clearTimeout(timer); resolve({ lat:pos.coords.latitude, lng:pos.coords.longitude, acc:pos.coords.accuracy }); },
      ()  => { clearTimeout(timer); resolve({ lat:null, lng:null }); },
      { enableHighAccuracy:true, maximumAge:60_000, timeout:timeoutMs },
    );
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Reverse-geocode lat/lng → { address, city, state }.
// PRIMARY: OpenStreetMap Nominatim — returns a full street-level address
//   like "123, MG Road, Shanti Nagar, Bengaluru, Karnataka 560027, India".
// FALLBACK: BigDataCloud — returns city/state only but is fast and tolerant.
async function reverseGeocode(lat, lng){
  // 1) Nominatim — detailed display_name
  try {
    const url = 'https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=' + lat + '&lon=' + lng;
    const r = await fetch(url, {
      headers: { 'Accept':'application/json' },
    });
    if(r.ok){
      const j = await r.json();
      if(j && j.display_name){
        const a = j.address || {};
        // Build a tighter address (skip country/postcode duplication in the
        // short city/state fields). display_name still has the full string.
        return {
          address: j.display_name,
          city:    a.city || a.town || a.village || a.county || a.suburb || '',
          state:   a.state || a.region || '',
        };
      }
    }
  } catch(e){ console.warn('[geocode nominatim]', e.message); }

  // 2) BigDataCloud fallback
  try {
    const url2 = 'https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lng + '&localityLanguage=en';
    const r = await fetch(url2, { headers:{ 'Accept':'application/json' } });
    if(r.ok){
      const j = await r.json();
      const parts = [j.locality, j.city, j.principalSubdivision, j.countryName]
        .filter(Boolean).filter((v,i,arr)=>arr.indexOf(v) === i);
      return {
        address: parts.join(', '),
        city:    j.city || j.locality || '',
        state:   j.principalSubdivision || '',
      };
    }
  } catch(e){ console.warn('[geocode bigdatacloud]', e.message); }

  return { address:'', city:'', state:'' };
}

// Reusable: AUTOMATIC location capture. Fetches GPS on mount, reverse-geocodes
// to a human address, and just shows the captured info. No manual button.
function LocationCapture({ loc, setLoc, hidden=false }){
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fetchLocation = async () => {
    setBusy(true); setError('');
    const r = await getLocation();
    if(r.lat == null){
      setError('GPS unavailable. Check permission / signal.');
      setBusy(false);
      return;
    }
    const geo = await reverseGeocode(r.lat, r.lng);
    setLoc({ ...r, ...geo });
    setBusy(false);
  };
  useEffect(()=>{ fetchLocation(); /* eslint-disable-next-line */ }, []);

  // Silent mode: GPS is still captured (the effect above ran), but nothing is
  // rendered — the location box is hidden from the user.
  if(hidden) return null;

  const okay = loc && loc.lat != null;
  return (
    <div className="crm-loc-pill" style={{
      display:'flex', alignItems:'center', gap:8,
      padding:'8px 12px', borderRadius:7,
      background: okay ? 'rgba(52,211,153,0.08)' : (error ? 'rgba(251,191,36,0.08)' : 'var(--bg2)'),
      border: '1px solid ' + (okay ? '#15803d' : error ? '#92400e' : 'var(--b2)'),
    }}>
      <MapPin size={14} style={{color: okay ? '#34d399' : error ? '#fbbf24' : 'var(--t3)', flexShrink:0}}/>
      <div style={{flex:1, minWidth:0, fontSize:11, lineHeight:1.35}}>
        {busy && <span style={{color:'var(--t2)'}}>📡 Locating you…</span>}
        {!busy && okay && (
          <>
            {/* Address can wrap up to 2 lines on phones — full street is
                shown so the salesman can verify before saving. */}
            <div style={{
              color:'#34d399', fontWeight:700,
              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
              overflow:'hidden', wordBreak:'break-word',
            }}>
              {loc.address || (loc.lat.toFixed(5) + ', ' + loc.lng.toFixed(5))}
            </div>
            <div style={{fontSize:9, color:'var(--t3)', marginTop:2}}>
              {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
              {loc.acc ? ' · ±' + Math.round(loc.acc) + 'm' : ''}
            </div>
          </>
        )}
        {!busy && !okay && error && <span style={{color:'#fbbf24'}}>{error}</span>}
      </div>
      <button type="button" onClick={fetchLocation} title="Refresh location"
        style={{background:'none', border:'none', color:'var(--t3)', cursor:'pointer', padding:4, flexShrink:0}}>
        <RefreshCw size={12}/>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable: photo capture button. Renders a button + thumbnail of last shot.
function PhotoCapture({ photo, setPhoto, label='Capture photo' }){
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const onPick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if(!f) return;
    setBusy(true);
    try {
      const dataUrl = await fileToCompressedDataURL(f);
      setPhoto(dataUrl);
    } catch(err){ notify.error('Photo: ' + err.message); }
    finally { setBusy(false); }
  };
  return (
    <div style={{display:'flex', alignItems:'center', gap:10}}>
      <input ref={ref} type="file" accept="image/*" capture="environment"
        style={{display:'none'}} onChange={onPick}/>
      <button type="button" onClick={()=>ref.current?.click()} disabled={busy} className="btn"
        style={{
          display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px',
          background: photo ? 'rgba(52,211,153,0.10)' : 'var(--bg2)',
          color: photo ? '#34d399' : 'var(--t1)',
          border: '1px solid ' + (photo ? '#15803d' : 'var(--b2)'),
          borderRadius:7, fontSize:12, fontWeight:600,
        }}>
        <Camera size={14}/> {busy ? 'Compressing…' : (photo ? 'Retake' : label)}
      </button>
      {photo && (
        <div style={{position:'relative'}}>
          <img src={photo} alt="capture" style={{width:46, height:46, objectFit:'cover', borderRadius:6, border:'1px solid var(--b2)'}}/>
          <button type="button" onClick={()=>setPhoto('')}
            title="Remove photo"
            style={{
              position:'absolute', top:-6, right:-6, background:'#dc2626', color:'#fff',
              border:'none', borderRadius:'50%', width:18, height:18, cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', padding:0,
            }}><X size={10}/></button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Big image preview modal
function ImageModal({ src, onClose }){
  if(!src) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, zIndex:10002, background:'rgba(0,0,0,0.85)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:24,
    }}>
      <img src={src} alt="" style={{maxWidth:'95vw', maxHeight:'92vh', borderRadius:10, boxShadow:'0 30px 60px rgba(0,0,0,0.6)'}}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE PAGE
export function AttendancePage({ users, currentUser }){
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto]   = useState('');
  const [loc,   setLoc]     = useState({ lat:null, lng:null });
  const [note, setNote]     = useState('');
  const [busy, setBusy]     = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [zoom, setZoom]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const q = isStaff && filterUser ? { userId: filterUser } : {};
      const data = await api.attListAttendance(q);
      setItems(data || []);
    } catch(e){ notify.error('Load attendance: ' + e.message); }
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [filterUser]);

  // Today's status for the CURRENT user
  const todays = items.filter(x => x.userId === currentUser.id && x.dateStr === todayStr())
    .sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  const lastType = todays.length ? todays[todays.length-1].type : null;

  const punch = async (type) => {
    if(!photo){ notify.error('Capture a photo first'); return; }
    setBusy(true);
    try {
      await api.attPunch({
        type, photo, note,
        lat: loc.lat, lng: loc.lng,
        address: loc.address || '',
        city:    loc.city    || '',
        state:   loc.state   || '',
      });
      notify.success(type === 'in' ? 'Checked in' : 'Checked out');
      setPhoto(''); setNote('');
      load();
    } catch(e){ notify.error('Punch: ' + e.message); }
    setBusy(false);
  };

  return (
    <div className="fade" style={{display:'flex', flexDirection:'column', gap:14}}>
      <div>
        <div style={{fontSize:11, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.15em', marginBottom:4}}>CRM</div>
        <div className="crm-page-title" style={{fontSize:22, fontWeight:700}}>Attendance</div>
        <div className="crm-page-sub" style={{fontSize:13, color:'var(--t3)', marginTop:4}}>
          Check in / out with selfie + GPS location.
        </div>
      </div>
      {/* Punch card for the current user */}
      <div className="card">
        <div style={{fontSize:13, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:8}}>
          <Briefcase size={14}/> Mark your attendance — {fmtDate(new Date())}
        </div>
        <div className="crm-row">
          <PhotoCapture photo={photo} setPhoto={setPhoto} label="Take selfie"/>
          <LocationCapture loc={loc} setLoc={setLoc}/>
          <div style={{flex:'1 1 200px', minWidth:160}}>
            <VoiceInput placeholder="Note (optional) — tap 🎤 to speak"
              value={note} onChange={setNote}/>
          </div>
          <button onClick={()=>punch('in')} disabled={busy || !photo || lastType === 'in'}
            className="btnp"
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              opacity:(!photo || lastType==='in') ? 0.5 : 1,
              cursor:(!photo || lastType==='in') ? 'not-allowed' : 'pointer',
            }}>
            <IconIn size={13}/> Check In
          </button>
          <button onClick={()=>punch('out')} disabled={busy || !photo || lastType !== 'in'}
            className="btn"
            style={{
              display:'inline-flex', alignItems:'center', gap:6,
              background:'#dc2626', color:'#fff', border:'1px solid #b91c1c',
              opacity:(!photo || lastType !== 'in') ? 0.5 : 1,
              cursor:(!photo || lastType !== 'in') ? 'not-allowed' : 'pointer',
            }}>
            <IconOut size={13}/> Check Out
          </button>
        </div>
        {todays.length > 0 && (
          <div style={{marginTop:10, fontSize:12, color:'var(--t3)'}}>
            Today: {todays.map(t => t.type.toUpperCase() + ' @ ' + new Date(t.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})).join('  ·  ')}
            {lastType && <span style={{marginLeft:8, color: lastType === 'in' ? '#34d399' : '#fbbf24', fontWeight:700}}>
              {lastType === 'in' ? '· Currently checked in' : '· Last action was check out'}
            </span>}
          </div>
        )}
      </div>

      {/* History */}
      <div className="card">
        <div className="row" style={{marginBottom:10}}>
          <div style={{fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6}}>
            <Calendar size={13}/> History {items.length ? `(${items.length})` : ''}
          </div>
          <div className="spacer"/>
          {isStaff && (
            <select className="inp" value={filterUser} onChange={e=>setFilterUser(e.target.value)}
              style={{padding:'4px 10px', fontSize:11, width:'auto'}}>
              <option value="">All users</option>
              {Object.values(users || {}).filter(u=>u.role==='salesman').map(u=>(
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          <button onClick={()=>exportCSV(
            'Attendance_' + todayStr() + '.csv',
            ['User','Type','Date','Time','Address','City','State','Latitude','Longitude','Note'],
            items.map(x => [
              x.userName || x.userId,
              x.type === 'in' ? 'IN' : 'OUT',
              x.dateStr || (x.createdAt||'').slice(0,10),
              x.createdAt ? new Date(x.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '',
              x.address || '', x.city || '', x.state || '',
              x.lat ?? '', x.lng ?? '',
              x.note || '',
            ])
          )} className="btn" title="Export attendance to Excel/CSV"
            style={{padding:'4px 10px', fontSize:11, display:'inline-flex', alignItems:'center', gap:4}}>
            <Download size={11}/> Export
          </button>
          <button onClick={load} className="btn" style={{padding:'4px 10px', fontSize:11}}>
            <RefreshCw size={11}/>
          </button>
        </div>
        {loading ? <div style={{padding:14, color:'var(--t3)'}}>Loading…</div> : items.length === 0 ? (
          <div style={{padding:14, color:'var(--t3)', textAlign:'center'}}>No attendance yet.</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:480, overflowY:'auto'}}>
            {items.map(x => (
              <div key={x._id} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                background:'var(--bg2)', borderRadius:8,
                borderLeft:'3px solid ' + (x.type==='in' ? '#34d399' : '#fbbf24'),
              }}>
                {x.photo
                  ? <img src={x.photo} alt="" onClick={()=>setZoom(x.photo)}
                      style={{width:40, height:40, objectFit:'cover', borderRadius:6, cursor:'zoom-in', border:'1px solid var(--b2)'}}/>
                  : <div style={{width:40, height:40, borderRadius:6, background:'var(--bg1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)'}}><ImageIcon size={16}/></div>}
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:12, fontWeight:600}}>
                    {x.userName || x.userId} ·{' '}
                    <span style={{color: x.type==='in' ? '#34d399' : '#fbbf24'}}>
                      {x.type === 'in' ? 'IN' : 'OUT'}
                    </span>
                  </div>
                  <div style={{fontSize:10, color:'var(--t3)'}}>
                    {fmtTime(x.createdAt)}
                  </div>
                  {x.address && (
                    <div style={{fontSize:10, color:'#a5b4fc', marginTop:2, display:'flex', alignItems:'center', gap:3}}>
                      <MapPin size={9}/> {x.address}
                    </div>
                  )}
                  {x.note && <div style={{fontSize:11, color:'var(--t2)', marginTop:2}}>{x.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ImageModal src={zoom} onClose={()=>setZoom('')}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VISITS PAGE — Check-in / Check-out workflow
//   * Salesman taps "Check in", captures selfie + (optional) note + GPS.
//   * They go meet the party. Visit shows as IN-PROGRESS with a live timer.
//   * On "Check out" they MUST enter discussion notes + selfie + GPS.
//   * App shows today's total time spent on visits.
//   * Salesman sees ONLY their own history; admin can filter by user.
//   * Salesman cannot delete history. Admin/superadmin can.
function fmtDuration(min){
  if(!min || min < 0) return '0m';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return (h>0 ? h+'h ' : '') + m + 'm';
}
function liveDuration(start){
  if(!start) return 0;
  return Math.max(0, Math.round((Date.now() - new Date(start).getTime()) / 60000));
}
function fmtClock(d){
  if(!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
}

// Preset reasons shown in the "Purpose of Visit" dropdown — required at
// check-in so every visit has a recorded objective.
const VISIT_PURPOSES = [
  'Business Approach',
  'Sample Submission',
  'Order Follow Up',
  'Payment Follow Up',
  'Cheque Collection',
  'New Dealer Meet',
  'Service / Product Issue',
  'App Installation',
  'Presentation',
];

export function VisitsPage({ dealers, users, currentUser }){
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuper = currentUser?.role === 'superadmin';

  // Check-in form state
  const [ciPhoto, setCiPhoto] = useState('');
  const [ciLoc,   setCiLoc]   = useState({ lat:null, lng:null });
  const [ciDealer, setCiDealer] = useState('');
  const [ciNote,   setCiNote]   = useState('');
  const [ciBusy,   setCiBusy]   = useState(false);
  // "New Dealer" mode — when user picks the special "+ New Dealer" pill, we
  // switch the dealer field into a free-text input and tag the visit with
  // isNewDealer:true so it's easy to spot in history/reports.
  const [ciNewDealerMode, setCiNewDealerMode] = useState(false);
  // Purpose of Visit — required preset reason for every check-in.
  const [ciPurpose, setCiPurpose] = useState('');
  // Camera-first check-in: a hidden <input capture> opened by the Check-in
  // button, and a preview modal shown after the photo is taken.
  const ciCamRef = useRef(null);
  const [ciPreview, setCiPreview] = useState(false);
  // Which required fields are missing — used to highlight them in red when the
  // user taps Check in without filling everything.
  const [ciMissing, setCiMissing] = useState({ dealer:false, purpose:false });

  // Check-out form state (per active visit)
  const [coPhoto, setCoPhoto] = useState('');
  const [coLoc,   setCoLoc]   = useState({ lat:null, lng:null });
  const [coNote,  setCoNote]  = useState('');
  const [coBusy,  setCoBusy]  = useState(false);

  // List
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterUser, setFilterUser] = useState('');
  const [partyQuery, setPartyQuery] = useState('');   // search visit history by party/dealer name
  const [zoom, setZoom] = useState('');
  // Tick once per minute so the active-visit clock updates
  const [, setTick] = useState(0);
  useEffect(()=>{ const t = setInterval(()=>setTick(x=>x+1), 60000); return ()=>clearInterval(t); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const q = isStaff && filterUser ? { userId: filterUser } : {};
      const data = await api.visitsList(q);
      setItems(data || []);
    } catch(e){ notify.error('Load visits: ' + e.message); }
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [filterUser]);

  // Salesman's own dealer roster — only these names appear in the search.
  const myDealerOptions = useMemo(()=>(dealers||[]).map(d=>d.name).filter(Boolean).slice(0, 1500), [dealers]);

  // ── Nearby-dealer suggestions ─────────────────────────────────────────
  // Once GPS is captured, pick dealers whose auto-learned location is within
  // 1km of the user. If none, fall back to dealers in the same reverse-geo
  // city. Sorted by distance so the closest party appears first.
  const nearbyDealers = useMemo(() => {
    if(!ciLoc || ciLoc.lat == null) return [];
    const myLat = ciLoc.lat, myLng = ciLoc.lng;
    // Haversine distance (metres) — accurate enough for "is this dealer near me"
    const distance = (lat1, lng1, lat2, lng2) => {
      const R = 6371000; // earth radius m
      const toRad = (x)=>x*Math.PI/180;
      const dLat = toRad(lat2-lat1);
      const dLng = toRad(lng2-lng1);
      const a = Math.sin(dLat/2)**2 +
                Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
      return 2 * R * Math.asin(Math.sqrt(a));
    };
    const scored = (dealers||[])
      .filter(d => typeof d.locLat === 'number' && typeof d.locLng === 'number')
      .map(d => ({ d, m: distance(myLat, myLng, d.locLat, d.locLng) }))
      .filter(x => x.m <= 1500) // within 1.5 km
      .sort((a,b) => a.m - b.m)
      .slice(0, 6);
    if(scored.length > 0) return scored;
    // Fallback: dealers in the same city (no distance available yet)
    const city = (ciLoc.city || '').toLowerCase().trim();
    if(!city) return [];
    return (dealers||[])
      .filter(d => (d.city || '').toLowerCase().trim() === city)
      .slice(0, 6)
      .map(d => ({ d, m: null }));
  }, [ciLoc, dealers]);

  // Pretty-print a distance in m / km
  const fmtMeters = (m) => {
    if(m == null) return '';
    if(m < 1000) return Math.round(m) + 'm';
    return (m/1000).toFixed(1) + 'km';
  };

  // Active visit (in-progress) belonging to the current user
  const myActive = items.find(v => v.status === 'in-progress' && v.userId === currentUser.id);

  // Today's visits for current user — used for the day-total card
  const today = todayStr();
  const myToday = items.filter(v => v.userId === currentUser.id && v.dateStr === today);
  const totalMins = myToday.reduce((sum, v) => {
    if(v.status === 'completed') return sum + (v.durationMinutes || 0);
    if(v.status === 'in-progress') return sum + liveDuration(v.checkInTime);
    return sum;
  }, 0);

  // Step 1 of the easy flow: validate the form, then open the camera directly.
  const startCheckIn = () => {
    const missing = { dealer: !ciDealer.trim(), purpose: !ciPurpose };
    if(missing.dealer || missing.purpose){
      setCiMissing(missing);
      notify.error(
        missing.dealer && missing.purpose ? 'Enter the dealer name and pick a purpose'
        : missing.dealer ? (ciNewDealerMode ? 'Type the new dealer name' : 'Party / Dealer name required')
        : 'Pick a Purpose of Visit'
      );
      return;
    }
    setCiMissing({ dealer:false, purpose:false });
    ciCamRef.current?.click();   // open the phone camera
  };
  // Step 2: photo taken → compress → show it in a confirm modal.
  const onCiPhotoPicked = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if(!f) return;
    setCiBusy(true);
    try {
      const dataUrl = await fileToCompressedDataURL(f);
      setCiPhoto(dataUrl);
      setCiPreview(true);
    } catch(err){ notify.error('Photo: ' + err.message); }
    setCiBusy(false);
  };

  const checkIn = async () => {
    if(!ciDealer.trim()){
      notify.error(ciNewDealerMode ? 'Type the new dealer name' : 'Party / Dealer name required');
      return;
    }
    if(!ciPurpose){ notify.error('Pick a Purpose of Visit'); return; }
    if(!ciPhoto){ notify.error('Capture a check-in photo first'); return; }
    setCiBusy(true);
    // If user is logging a brand-new dealer, there's no match — keep dealerId empty.
    const match = ciNewDealerMode
      ? null
      : (dealers || []).find(d => (d.name||'').toUpperCase().trim() === ciDealer.toUpperCase().trim());
    try {
      await api.visitsCreate({
        dealerId:   match?.id || '',
        dealerName: ciDealer.trim(),
        isNewDealer: ciNewDealerMode || !match,
        purpose:    ciPurpose,
        // Prepend purpose to the note so existing CSV exports/history strips
        // see the reason inline too.
        note:       ciNote ? `[${ciPurpose}] ${ciNote}` : `[${ciPurpose}]`,
        photo:      ciPhoto,
        lat:        ciLoc.lat,
        lng:        ciLoc.lng,
        address:    ciLoc.address || '',
        city:       ciLoc.city    || '',
        state:      ciLoc.state   || '',
      });
      notify.success('Checked in — visit started');
      setCiDealer(''); setCiNote(''); setCiPhoto(''); setCiPurpose('');
      setCiNewDealerMode(false);
      setCiPreview(false);
      load();
    } catch(e){ notify.error('Check-in: ' + e.message); }
    setCiBusy(false);
  };

  const checkOut = async () => {
    if(!myActive) return;
    if(!coNote || !coNote.trim()){ notify.error('Discussion notes are required at check-out'); return; }
    if(!coPhoto){ notify.error('Capture a check-out photo first'); return; }
    setCoBusy(true);
    try {
      await api.visitsCheckout(myActive._id, {
        photo: coPhoto,
        note:  coNote,
        lat:   coLoc.lat,
        lng:   coLoc.lng,
        address: coLoc.address || '',
        city:    coLoc.city    || '',
        state:   coLoc.state   || '',
      });
      notify.success('Checked out — visit completed');
      setCoNote(''); setCoPhoto(''); setCoLoc({ lat:null, lng:null });
      load();
    } catch(e){ notify.error('Check-out: ' + e.message); }
    setCoBusy(false);
  };

  const removeVisit = async (id) => {
    const ok = await confirmDialog({ title:'Delete this visit?', danger:true, confirmText:'Delete' });
    if(!ok) return;
    try {
      await api.visitsDelete(id);
      notify.success('Visit deleted');
      load();
    } catch(e){ notify.error(e.message); }
  };

  // Superadmin: correct a stuck visit (salesman forgot to check out) by
  // force-closing it, which frees them to start a fresh visit.
  const forceCloseVisit = async (id) => {
    const ok = await confirmDialog({
      title:'Reset this stuck visit?',
      message:'This force-closes the visit (marks it checked out now) so the salesman can start a fresh check-in. Use this when someone forgot to check out.',
      confirmText:'Reset / Close',
    });
    if(!ok) return;
    try {
      await api.visitsForceClose(id);
      notify.success('Visit reset — salesman can check in again');
      load();
    } catch(e){ notify.error(e.message); }
  };

  return (
    <div className="fade" style={{display:'flex', flexDirection:'column', gap:14}}>
      <div>
        <div style={{fontSize:11, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.15em', marginBottom:4}}>CRM</div>
        <div className="crm-page-title" style={{fontSize:22, fontWeight:700}}>Visits</div>
        <div className="crm-page-sub" style={{fontSize:13, color:'var(--t3)', marginTop:4}}>
          Check in to a party, do the meeting, then check out with your discussion notes.
        </div>
      </div>

      {/* Today summary */}
      <div className="card" style={{display:'flex', alignItems:'center', gap:14, flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.12em'}}>Today</div>
          <div style={{fontSize:18, fontWeight:700}}>{myToday.length} visit{myToday.length===1?'':'s'}</div>
        </div>
        <div style={{width:1, height:30, background:'var(--b1)'}}/>
        <div>
          <div style={{fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.12em'}}>Total time</div>
          <div style={{fontSize:18, fontWeight:700, color:'#34d399'}}>{fmtDuration(totalMins)}</div>
        </div>
        {myActive && (
          <>
            <div style={{width:1, height:30, background:'var(--b1)'}}/>
            <div>
              <div style={{fontSize:10, color:'#fbbf24', textTransform:'uppercase', letterSpacing:'.12em'}}>In progress</div>
              <div style={{fontSize:14, fontWeight:700, color:'#fbbf24'}}>
                {myActive.dealerName} · {fmtDuration(liveDuration(myActive.checkInTime))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active visit — show check-out card */}
      {myActive ? (
        <div className="card" style={{borderColor:'#fbbf24'}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:6, display:'flex', alignItems:'center', gap:8, color:'#fbbf24'}}>
            <ClipboardList size={14}/> Currently visiting · {myActive.dealerName}
          </div>
          <div style={{fontSize:11, color:'var(--t3)', marginBottom:10}}>
            Checked in at {fmtClock(myActive.checkInTime)} · {fmtDuration(liveDuration(myActive.checkInTime))} elapsed
            {myActive.checkInAddress ? ' · ' + myActive.checkInAddress : ''}
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            <VoiceTextarea
              placeholder="REQUIRED: what was discussed in the meeting…"
              value={coNote} onChange={setCoNote} rows={6}/>
            <div className="crm-row">
              <PhotoCapture photo={coPhoto} setPhoto={setCoPhoto} label="Take check-out photo"/>
              <LocationCapture loc={coLoc} setLoc={setCoLoc}/>
              <button onClick={checkOut} disabled={coBusy || !coNote.trim() || !coPhoto} className="btnp"
                style={{display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
                        background:'#dc2626', borderColor:'#b91c1c'}}>
                <IconOut size={13}/> {coBusy ? 'Saving…' : 'Check out'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // No active visit — show check-in form
        <div className="card crm-checkin" style={{borderRadius:18}}>
          <style>{`
            .crm-checkin input.inp, .crm-checkin select.inp, .crm-checkin textarea {
              border-radius: 13px !important;
              padding: 12px 14px !important;
              background: var(--bg2);
              border: 1px solid var(--b2);
              transition: border-color .15s ease, box-shadow .15s ease;
            }
            .crm-checkin input.inp:focus, .crm-checkin select.inp:focus, .crm-checkin textarea:focus {
              border-color: var(--acc);
              box-shadow: 0 0 0 3px rgba(99,102,241,0.18);
              outline: none;
            }
            .crm-checkin .btnp { border-radius: 14px; }
          `}</style>
          <div style={{fontSize:14, fontWeight:800, marginBottom:12, display:'flex', alignItems:'center', gap:8}}>
            <span style={{width:30, height:30, borderRadius:'50%', background:'rgba(99,102,241,0.15)', display:'inline-flex', alignItems:'center', justifyContent:'center'}}>
              <IconIn size={15} style={{color:'var(--acc)'}}/>
            </span>
            Check in to a party
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {/* Nearby dealer suggestions — built from GPS once a fix lands.
                Shows the 6 closest parties (within 1.5km) sorted by distance,
                or falls back to same-city dealers when no GPS-tagged dealer
                is near yet. Tap a pill → name fills in instantly. */}
            {nearbyDealers.length > 0 && (
              <div style={{
                background:'var(--bg2)', borderRadius:14, padding:'10px 12px',
                border:'1px solid var(--b2)',
              }}>
                <div style={{fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>
                  📍 You're near {nearbyDealers[0].m == null ? '(' + (ciLoc?.city || 'nearby') + ')' : ''}
                </div>
                <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                  {nearbyDealers.map(({d, m}) => (
                    <button key={d.id}
                      type="button"
                      onClick={()=>setCiDealer(d.name)}
                      title={'Tap to use ' + d.name + (m != null ? ' (' + fmtMeters(m) + ' away)' : '')}
                      style={{
                        display:'inline-flex', alignItems:'center', gap:6,
                        padding:'6px 10px', borderRadius:18,
                        background: ciDealer === d.name ? 'rgba(52,211,153,0.18)' : 'var(--bg1)',
                        color:      ciDealer === d.name ? '#34d399' : 'var(--t1)',
                        border: '1px solid ' + (ciDealer === d.name ? '#15803d' : 'var(--b2)'),
                        cursor:'pointer', fontSize:11, fontWeight:600,
                      }}>
                      <MapPin size={11} style={{flexShrink:0, color: m != null ? '#34d399' : '#a5b4fc'}}/>
                      <span style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</span>
                      {m != null && (
                        <span style={{fontSize:9, color:'var(--t3)', fontWeight:500}}>{fmtMeters(m)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Existing-dealer vs New-dealer toggle. New-dealer mode swaps the
                autocomplete input for a plain text box so salesman can type
                a name that isn't in the roster yet. */}
            <div style={{display:'flex', gap:8, padding:4, background:'var(--bg2)', borderRadius:14, border:'1px solid var(--b2)'}}>
              <button type="button"
                onClick={()=>{ setCiNewDealerMode(false); setCiDealer(''); }}
                style={{
                  flex:1, minWidth:120,
                  padding:'9px 12px', borderRadius:11, fontSize:12.5, fontWeight:700, cursor:'pointer',
                  background: !ciNewDealerMode ? 'var(--acc)' : 'transparent',
                  border: 'none',
                  color: !ciNewDealerMode ? '#fff' : 'var(--t2)',
                  transition:'all .15s ease',
                }}>
                Existing Dealer
              </button>
              <button type="button"
                onClick={()=>{ setCiNewDealerMode(true); setCiDealer(''); }}
                style={{
                  flex:1, minWidth:120,
                  padding:'9px 12px', borderRadius:11, fontSize:12.5, fontWeight:700, cursor:'pointer',
                  background: ciNewDealerMode ? '#fbbf24' : 'transparent',
                  border: 'none',
                  color: ciNewDealerMode ? '#111' : 'var(--t2)',
                  transition:'all .15s ease',
                }}>
                + New Dealer
              </button>
            </div>

            {ciNewDealerMode ? (
              <input className="inp" placeholder="Type new dealer / party name"
                value={ciDealer}
                onChange={e=>{ setCiDealer(e.target.value); if(ciMissing.dealer) setCiMissing(m=>({...m, dealer:false})); }}
                style={ciMissing.dealer ? { borderColor:'#f87171', boxShadow:'0 0 0 1px #f87171' } : undefined}
                autoFocus/>
            ) : (
              <>
                <input className="inp" list="crm-dealer-list" placeholder="Party / Dealer name"
                  value={ciDealer}
                  onChange={e=>{ setCiDealer(e.target.value); if(ciMissing.dealer) setCiMissing(m=>({...m, dealer:false})); }}
                  style={ciMissing.dealer ? { borderColor:'#f87171', boxShadow:'0 0 0 1px #f87171' } : undefined}/>
                <datalist id="crm-dealer-list">
                  {myDealerOptions.map(n => <option key={n} value={n}/>)}
                </datalist>
              </>
            )}
            {ciMissing.dealer && (
              <div style={{fontSize:11, color:'#f87171', marginTop:-4}}>
                {ciNewDealerMode ? 'Type the new dealer name' : 'Party / Dealer name is required'}
              </div>
            )}

            {/* Purpose of Visit — required */}
            <select className="inp" value={ciPurpose}
              onChange={e=>{ setCiPurpose(e.target.value); if(ciMissing.purpose) setCiMissing(m=>({...m, purpose:false})); }}
              style={ciMissing.purpose ? { borderColor:'#f87171', boxShadow:'0 0 0 1px #f87171' } : undefined}>
              <option value="">— Purpose of Visit —</option>
              {VISIT_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {ciMissing.purpose && (
              <div style={{fontSize:11, color:'#f87171', marginTop:-4}}>Pick a Purpose of Visit</div>
            )}

            <VoiceTextarea placeholder="Quick note (optional)"
              value={ciNote} onChange={setCiNote} rows={3}/>
            {/* GPS is captured silently in the background — box hidden. */}
            <LocationCapture loc={ciLoc} setLoc={setCiLoc} hidden/>
            {/* Hidden camera — the Check-in button opens it directly. */}
            <input ref={ciCamRef} type="file" accept="image/*" capture="environment"
              style={{display:'none'}} onChange={onCiPhotoPicked}/>
            <button onClick={startCheckIn}
              disabled={ciBusy || !ciDealer.trim() || !ciPurpose}
              title={!ciPurpose ? 'Pick a Purpose of Visit' : ''}
              style={{
                display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%',
                padding:'14px', borderRadius:15, border:'none', cursor:'pointer',
                fontSize:15, fontWeight:800, color:'#fff', marginTop:2,
                background:'linear-gradient(135deg, #6366f1, #818cf8)',
                boxShadow:'0 8px 22px rgba(99,102,241,0.35)',
                opacity: (ciBusy || !ciDealer.trim() || !ciPurpose) ? 0.55 : 1,
                transition:'opacity .15s ease, transform .1s ease',
              }}
              onMouseDown={e=>e.currentTarget.style.transform='scale(0.985)'}
              onMouseUp={e=>e.currentTarget.style.transform='scale(1)'}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
              <IconIn size={16}/> {ciBusy ? 'Opening camera…' : 'Check in'}
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <div className="row" style={{marginBottom:10}}>
          <div style={{fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6}}>
            <Calendar size={13}/> Visit history {items.length ? `(${items.length})` : ''}
          </div>
          <div className="spacer"/>
          {/* Search visit history by party / dealer name */}
          <div style={{position:'relative', display:'inline-flex', alignItems:'center'}}>
            <Search size={12} style={{position:'absolute', left:8, color:'var(--t3)', pointerEvents:'none'}}/>
            <input className="inp" value={partyQuery} onChange={e=>setPartyQuery(e.target.value)}
              placeholder="Search party name…"
              style={{padding:'4px 24px 4px 26px', fontSize:11, width:170}}/>
            {partyQuery && (
              <button type="button" onClick={()=>setPartyQuery('')} title="Clear"
                style={{position:'absolute', right:6, background:'none', border:'none', color:'var(--t3)', cursor:'pointer', padding:0, display:'flex'}}>
                <X size={12}/>
              </button>
            )}
          </div>
          {isStaff && (
            <select className="inp" value={filterUser} onChange={e=>setFilterUser(e.target.value)}
              style={{padding:'4px 10px', fontSize:11, width:'auto'}}>
              <option value="">All users</option>
              {Object.values(users || {}).filter(u=>u.role==='salesman').map(u=>(
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          <button onClick={()=>{
            // ── Grouped-by-user Visit Report (.xlsx) ──────────────────────
            // Rows are grouped like this:
            //   ┌ Header row     : [<User Name>, <total dealers met>, ...blanks]
            //   ├ Visit row      : [ , , <UserID>, Active, <Role>, <In Date>, <In Image>, ...]
            //   ├ Visit row      : ...
            //   └ ...next user starts with a new header row.
            const HEADERS = [
              'User', 'Dealers Met', 'User ID', 'Status', 'Role',
              'In Date', 'In Image', 'In Address', 'Purpose', 'In Remarks',
              'Out Date', 'Out Image', 'Out Address', 'Reason', 'Out Remarks',
              'Time Spent', 'Party', 'party ID', 'Device',
            ];
            // Bucket visits by salesman id, preserving the current display order.
            const byUser = new Map();
            for (const v of items) {
              const uid = v.userId || v.salesman || '_none';
              if (!byUser.has(uid)) byUser.set(uid, { userName: v.userName || users?.[uid]?.name || uid, list: [] });
              byUser.get(uid).list.push(v);
            }
            const rows = [HEADERS];
            for (const [uid, bucket] of byUser) {
              // Group header row — only User + Dealers Met filled
              rows.push([bucket.userName, bucket.list.length, ...Array(HEADERS.length - 2).fill('')]);
              for (const v of bucket.list) {
                const user = users?.[uid] || {};
                const secToHHMMSS = (mins) => {
                  const s = Math.max(0, Math.round((mins || 0) * 60));
                  const h = Math.floor(s / 3600);
                  const m = Math.floor((s % 3600) / 60);
                  const ss = s % 60;
                  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
                };
                // Photos: base64 data URIs bloat the file by hundreds of KB
                // per row and are useless in a spreadsheet. Replace them with
                // a short marker; keep real URLs/paths as-is.
                const cleanPhoto = (p) => {
                  if (!p) return '';
                  const s = String(p);
                  if (s.startsWith('data:image')) return '[photo captured]';
                  return s;
                };
                // Purpose sometimes arrives wrapped like "[New Dealer Meet]"
                // — strip the surrounding brackets for cleanliness.
                const cleanPurpose = (p) => {
                  if (!p) return '';
                  return String(p).trim().replace(/^\[|\]$/g, '').trim();
                };
                rows.push([
                  '',                                                                 // User
                  '',                                                                 // Dealers Met
                  uid,                                                                // User ID
                  user.active === false ? 'Inactive' : 'Active',                      // Status
                  user.role === 'salesman' ? 'Sales Executive' : (user.role || ''),   // Role
                  v.checkInTime  ? new Date(v.checkInTime)  : '',                     // In Date
                  cleanPhoto(v.checkInPhoto || v.photo),                              // In Image
                  v.checkInAddress || v.address || '',                                // In Address
                  cleanPurpose(v.purpose),                                            // Purpose
                  v.checkInNote || '',                                                // In Remarks
                  v.checkOutTime ? new Date(v.checkOutTime) : '',                     // Out Date
                  cleanPhoto(v.checkOutPhoto),                                        // Out Image
                  v.checkOutAddress || '',                                            // Out Address
                  cleanPurpose(v.reason || v.purpose),                                // Reason
                  v.checkOutNote || v.comment || '',                                  // Out Remarks
                  secToHHMMSS(v.durationMinutes),                                     // Time Spent
                  v.dealerName || '',                                                 // Party
                  v.dealerId || 0,                                                    // party ID
                  v.device || 'Android',                                              // Device
                ]);
              }
            }
            // Serialise to CSV (opens perfectly in Excel — no xlsx dep needed).
            // Cells with commas, quotes, or newlines get quoted per RFC 4180.
            const csvCell = (v) => {
              if (v === null || v === undefined) return '';
              let s;
              if (v instanceof Date) {
                // "YYYY-MM-DD HH:MM:SS" — Excel picks this up as a datetime.
                const pad = n => String(n).padStart(2,'0');
                s = `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())} `
                  + `${pad(v.getHours())}:${pad(v.getMinutes())}:${pad(v.getSeconds())}`;
              } else {
                s = String(v);
              }
              if (/[",\r\n]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
              return s;
            };
            const csv = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
            const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
            const url  = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Visits_${todayStr()}.csv`;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }} className="btn" title="Export grouped Visit Report as Excel"
            style={{padding:'4px 10px', fontSize:11, display:'inline-flex', alignItems:'center', gap:4}}>
            <Download size={11}/> Export
          </button>
          <button onClick={load} className="btn" style={{padding:'4px 10px', fontSize:11}}>
            <RefreshCw size={11}/>
          </button>
        </div>
        {(() => {
          const q = partyQuery.trim().toLowerCase();
          const shown = q ? items.filter(v => (v.dealerName||'').toLowerCase().includes(q)) : items;
          return loading ? <div style={{padding:14, color:'var(--t3)'}}>Loading…</div> : items.length === 0 ? (
          <div style={{padding:14, color:'var(--t3)', textAlign:'center'}}>No visits yet.</div>
        ) : shown.length === 0 ? (
          <div style={{padding:14, color:'var(--t3)', textAlign:'center'}}>No visits for “{partyQuery}”.</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:540, overflowY:'auto'}}>
            {shown.map(v => {
              const ciPhoto = v.checkInPhoto  || v.photo || '';
              const coPhoto = v.checkOutPhoto || '';
              const dur     = v.status === 'completed' ? (v.durationMinutes || 0) : liveDuration(v.checkInTime);
              const inAddr  = v.checkInAddress  || v.address || '';
              const outAddr = v.checkOutAddress || '';
              const inNote  = v.checkInNote  || '';
              // Hide any auto/force-close placeholder log (starts with "⏱"),
              // including old records saved before this was cleaned up.
              const rawOut  = v.checkOutNote || v.comment || '';
              const outNote = /^⏱/.test(rawOut.trim()) ? '' : rawOut;
              const autoClosed = v.autoClosed || /^⏱/.test((v.checkOutNote||'').trim());
              return (
                <div key={v._id} style={{
                  display:'flex', flexDirection:'column', gap:8, padding:'10px 12px',
                  background:'var(--bg2)', borderRadius:8,
                  borderLeft:'3px solid ' + (v.status === 'in-progress' ? '#fbbf24' : '#34d399'),
                }}>
                  {/* Header line */}
                  <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                    <div style={{fontSize:13, fontWeight:700}}>{v.dealerName}</div>
                    <span style={{fontSize:10, color:'var(--t3)'}}>by {v.userName || v.userId}</span>
                    <span style={{
                      fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3,
                      background: v.status==='in-progress' ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)',
                      color:      v.status==='in-progress' ? '#fbbf24' : '#34d399',
                    }}>{v.status === 'in-progress' ? 'IN PROGRESS' : 'COMPLETED'}</span>
                    {v.status === 'completed' && autoClosed && (
                      <span style={{fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, background:'rgba(148,163,184,0.15)', color:'#94a3b8'}}
                        title="Closed without a check-out (forgot to check out / reset by admin)">AUTO-CLOSED</span>
                    )}
                    <span style={{marginLeft:'auto', fontSize:11, color:'var(--t2)', fontWeight:700}}>
                      {fmtDuration(dur)}
                    </span>
                  </div>

                  {/* Times row */}
                  <div style={{display:'flex', gap:18, fontSize:11, color:'var(--t3)', flexWrap:'wrap'}}>
                    <span>📥 In: <b style={{color:'#34d399'}}>{fmtClock(v.checkInTime)}</b></span>
                    {v.checkOutTime
                      ? <span>📤 Out: <b style={{color:'#fbbf24'}}>{fmtClock(v.checkOutTime)}</b></span>
                      : <span style={{color:'#fbbf24'}}>Awaiting check-out</span>}
                  </div>

                  {/* Photos row */}
                  <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                    {ciPhoto && (
                      <div>
                        <div style={{fontSize:9, color:'var(--t3)', marginBottom:3}}>Check-in</div>
                        <img src={ciPhoto} alt="" onClick={()=>setZoom(ciPhoto)} className="crm-photo-thumb-lg"/>
                      </div>
                    )}
                    {coPhoto && (
                      <div>
                        <div style={{fontSize:9, color:'var(--t3)', marginBottom:3}}>Check-out</div>
                        <img src={coPhoto} alt="" onClick={()=>setZoom(coPhoto)} className="crm-photo-thumb-lg"/>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {inNote && (
                    <div style={{fontSize:11, color:'var(--t2)'}}>
                      <span style={{color:'var(--t3)'}}>Check-in note: </span>{inNote}
                    </div>
                  )}
                  {outNote && (
                    <div style={{fontSize:12, color:'var(--t1)', background:'var(--bg1)', padding:'6px 10px', borderRadius:6, borderLeft:'2px solid var(--acc)'}}>
                      <span style={{color:'var(--t3)', fontSize:10}}>Discussion: </span>{outNote}
                    </div>
                  )}

                  {/* Addresses */}
                  {(inAddr || outAddr) && (
                    <div style={{fontSize:10, color:'#a5b4fc', display:'flex', flexDirection:'column', gap:2}}>
                      {inAddr  && <span><MapPin size={9} style={{display:'inline'}}/> In:  {inAddr}</span>}
                      {outAddr && <span><MapPin size={9} style={{display:'inline'}}/> Out: {outAddr}</span>}
                    </div>
                  )}

                  {/* Footer actions — staff only (salesmen can't tamper history) */}
                  {isStaff && (
                    <div style={{display:'flex', justifyContent:'flex-end', gap:14, alignItems:'center'}}>
                      {/* Superadmin: reset a stuck / forgotten-checkout visit so
                          the salesman can start fresh. */}
                      {isSuper && v.status === 'in-progress' && (
                        <button onClick={()=>forceCloseVisit(v._id)} title="Force-close this stuck visit so the salesman can check in again"
                          style={{background:'none', border:'1px solid #fbbf24', borderRadius:6, color:'#fbbf24', cursor:'pointer', padding:'4px 10px', fontSize:11, display:'inline-flex', alignItems:'center', gap:4}}>
                          <RefreshCw size={11}/> Reset / Force close
                        </button>
                      )}
                      <button onClick={()=>removeVisit(v._id)} title="Delete visit"
                        style={{background:'none', border:'none', color:'#f87171', cursor:'pointer', padding:4, fontSize:11, display:'inline-flex', alignItems:'center', gap:4}}>
                        <Trash2 size={11}/> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
        })()}
      </div>
      <ImageModal src={zoom} onClose={()=>setZoom('')}/>

      {/* Photo-preview confirm modal — the easy check-in flow:
          Check in → camera → take photo → this preview → Confirm. */}
      {ciPreview && (
        <div onClick={()=>!ciBusy && setCiPreview(false)}
          style={{position:'fixed', inset:0, background:'rgba(6,6,16,0.82)', backdropFilter:'blur(4px)',
            zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:16}}>
          <div onClick={e=>e.stopPropagation()}
            style={{
              background:'var(--bg1)', border:'1px solid var(--b2)', borderRadius:22,
              padding:18, width:380, maxWidth:'94%',
              display:'flex', flexDirection:'column', gap:14,
              boxShadow:'0 24px 60px rgba(0,0,0,0.55)',
            }}>
            {/* Header */}
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <div style={{width:30, height:30, borderRadius:'50%', background:'rgba(99,102,241,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <Camera size={15} style={{color:'var(--acc)'}}/>
              </div>
              <div style={{fontSize:14, fontWeight:800, color:'var(--t1)', flex:1}}>Confirm check-in</div>
              <button onClick={()=>!ciBusy && setCiPreview(false)} disabled={ciBusy}
                style={{background:'none', border:'none', color:'var(--t3)', cursor:'pointer', padding:2, lineHeight:1}}>
                <X size={18}/>
              </button>
            </div>

            {/* Rounded photo */}
            {ciPhoto && (
              <div style={{position:'relative', borderRadius:20, overflow:'hidden',
                border:'1px solid var(--b2)', boxShadow:'0 8px 24px rgba(0,0,0,0.35)'}}>
                <img src={ciPhoto} alt="check-in"
                  style={{width:'100%', maxHeight:340, objectFit:'cover', display:'block'}}/>
                {/* soft bottom gradient with the dealer + purpose over the photo */}
                <div style={{position:'absolute', left:0, right:0, bottom:0, padding:'22px 14px 12px',
                  background:'linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0))'}}>
                  <div style={{fontSize:14, fontWeight:800, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,0.6)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{ciDealer || '—'}</div>
                  {ciPurpose && (
                    <div style={{marginTop:4, display:'inline-flex', alignItems:'center', gap:5,
                      background:'rgba(99,102,241,0.9)', color:'#fff', fontSize:10, fontWeight:700,
                      padding:'2px 9px', borderRadius:999}}>{ciPurpose}</div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{display:'flex', gap:10}}>
              <button onClick={()=>ciCamRef.current?.click()} disabled={ciBusy} className="btn"
                style={{flex:1, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'11px', borderRadius:12, fontWeight:600}}>
                <Camera size={14}/> Retake
              </button>
              <button onClick={checkIn} disabled={ciBusy || !ciPhoto} className="btnp"
                style={{flex:2, display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
                  padding:'11px', borderRadius:12, fontWeight:700}}>
                <IconIn size={14}/> {ciBusy ? 'Checking in…' : 'Confirm Check in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEADS PAGE
export function LeadsPage({ users, currentUser }){
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  return <_LeadsBody users={users} currentUser={currentUser} isStaff={isStaff}/>;
}
function _LeadsBody({ users, currentUser, isStaff }){
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser]     = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [editing, setEditing]           = useState(null); // lead being viewed/updated
  const [bulkBusy, setBulkBusy]         = useState(false);
  const bulkFileRef = useRef(null);

  // Form state for create
  const [form, setForm] = useState({
    name:'', company:'', phone:'', email:'', city:'', state:'', source:'',
    status:'NEW', assignedTo:'', notes:'', value:0,
  });

  // ── Bulk upload: download a starter template + handle file upload ────
  const downloadLeadsTemplate = () => {
    const headers = ['Name','Company','Phone','Email','City','State','Source','Status','AssignedTo','Value','Notes'];
    const sampleAssignee = Object.values(users||{}).find(u=>u.role==='salesman');
    const sample = [
      ['Anil Kumar','Shree Plywoods','9876543210','anil@example.com','Pune','Maharashtra','Referral','NEW',
       sampleAssignee?.name || '', 50000, 'Interested in 18mm sheets'],
      ['Priya Sharma','Modern Interiors','9123456789','priya@example.com','Bengaluru','Karnataka','Website','CONTACTED',
       sampleAssignee?.id || '', 120000, 'Quoted last week, follow up Mon'],
    ];
    const esc = v => { const s=String(v??''); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };
    const csv = [headers.map(esc).join(','), ...sample.map(r=>r.map(esc).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
    a.download = 'Leads_Template.csv';
    a.click();
    notify.info('Template downloaded. Fill it and click "Upload Leads".');
  };
  const onBulkFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if(!f) return;
    setBulkBusy(true);
    try {
      const res = await api.leadsUpload(f);
      const errLine = res.errors?.length ? ' · ' + res.errors.length + ' warnings' : '';
      notify.success(`Uploaded ${res.added || 0} leads (skipped ${res.skipped || 0}${errLine})`);
      if(res.errors?.length){ console.warn('[leads upload warnings]', res.errors); }
      load();
    } catch(err){ notify.error('Upload failed: ' + err.message); }
    setBulkBusy(false);
  };

  const load = async () => {
    setLoading(true);
    try {
      const q = {};
      if(filterStatus) q.status = filterStatus;
      if(isStaff && filterUser) q.assignedTo = filterUser;
      const data = await api.leadsList(q);
      setItems(data || []);
    } catch(e){ notify.error('Load leads: ' + e.message); }
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [filterStatus, filterUser]);

  const submit = async () => {
    if(!form.name.trim()){ notify.error('Name required'); return; }
    try {
      await api.leadsCreate(form);
      notify.success('Lead created');
      setForm({ name:'', company:'', phone:'', email:'', city:'', state:'', source:'', status:'NEW', assignedTo:'', notes:'', value:0 });
      setShowForm(false);
      load();
    } catch(e){ notify.error('Create: ' + e.message); }
  };

  const removeLead = async (id) => {
    const ok = await confirmDialog({ title:'Delete this lead?', danger:true, confirmText:'Delete' });
    if(!ok) return;
    try { await api.leadsDelete(id); notify.success('Deleted'); load(); }
    catch(e){ notify.error(e.message); }
  };

  return (
    <div className="fade" style={{display:'flex', flexDirection:'column', gap:14}}>
      <div>
        <div style={{fontSize:11, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.15em', marginBottom:4}}>CRM</div>
        <div className="crm-page-title" style={{fontSize:22, fontWeight:700}}>Leads</div>
        <div className="crm-page-sub" style={{fontSize:13, color:'var(--t3)', marginTop:4}}>
          {isStaff ? 'Create leads, assign to salesmen, track the pipeline.' : 'Leads assigned to you. Update status as you progress.'}
        </div>
      </div>
      <div className="card">
        <div className="row" style={{marginBottom:10}}>
          <div style={{fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6}}>
            <UsersIcon size={14}/> Leads {items.length ? `(${items.length})` : ''}
          </div>
          <div className="spacer"/>
          <select className="inp" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            style={{padding:'4px 10px', fontSize:11, width:'auto'}}>
            <option value="">All statuses</option>
            {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {isStaff && (
            <select className="inp" value={filterUser} onChange={e=>setFilterUser(e.target.value)}
              style={{padding:'4px 10px', fontSize:11, width:'auto'}}>
              <option value="">All assignees</option>
              {Object.values(users || {}).filter(u=>u.role==='salesman').map(u=>(
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          {isStaff && (
            <>
              <input ref={bulkFileRef} type="file" accept=".csv,.xlsx,.xls"
                style={{display:'none'}} onChange={onBulkFile}/>
              <button onClick={downloadLeadsTemplate} className="btn"
                title="Download a CSV template you can fill and upload"
                style={{display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11}}>
                <Download size={11}/> Template
              </button>
              <button onClick={()=>bulkFileRef.current?.click()} disabled={bulkBusy} className="btn"
                title="Bulk-upload leads from CSV / Excel"
                style={{
                  display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11,
                  background:'rgba(52,211,153,0.10)', color:'#34d399', border:'1px solid #15803d',
                }}>
                <Upload size={11}/> {bulkBusy ? 'Uploading…' : 'Upload Leads'}
              </button>
              <button onClick={()=>setShowForm(s=>!s)} className="btnp"
                style={{display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11}}>
                <Plus size={11}/> New Lead
              </button>
            </>
          )}
          <button onClick={()=>exportCSV(
            'Leads_' + todayStr() + '.csv',
            ['Name','Company','Phone','Email','City','State','Source','Status','AssignedTo','Value','Notes','Updates','CreatedAt'],
            items.map(L => [
              L.name, L.company || '', L.phone || '', L.email || '', L.city || '', L.state || '',
              L.source || '', L.status || 'NEW',
              L.assignedName || L.assignedTo || '',
              L.value || 0,
              L.notes || '',
              (L.updates || []).map(u => (u.byName||u.by) + ': ' + (u.comment || u.status || '')).join(' | '),
              L.createdAt || '',
            ])
          )} className="btn" title="Export leads to Excel/CSV"
            style={{padding:'4px 10px', fontSize:11, display:'inline-flex', alignItems:'center', gap:4}}>
            <Download size={11}/> Export
          </button>
          <button onClick={load} className="btn" style={{padding:'4px 10px', fontSize:11}}>
            <RefreshCw size={11}/>
          </button>
        </div>

        {/* Create form (admin) */}
        {showForm && isStaff && (
          <div style={{background:'var(--bg2)', borderRadius:8, padding:14, marginBottom:12, border:'1px solid var(--b2)'}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:10}}>
              <Field label="Name *"><input className="inp" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/></Field>
              <Field label="Company"><input className="inp" value={form.company} onChange={e=>setForm({...form, company:e.target.value})}/></Field>
              <Field label="Phone"><input className="inp" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})}/></Field>
              <Field label="Email"><input className="inp" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/></Field>
              <Field label="City"><input className="inp" value={form.city} onChange={e=>setForm({...form, city:e.target.value})}/></Field>
              <Field label="State"><input className="inp" value={form.state} onChange={e=>setForm({...form, state:e.target.value})}/></Field>
              <Field label="Source"><input className="inp" placeholder="Referral, website…" value={form.source} onChange={e=>setForm({...form, source:e.target.value})}/></Field>
              <Field label="Value (₹)"><input className="inp" type="number" value={form.value} onChange={e=>setForm({...form, value:e.target.value})}/></Field>
              <Field label="Status">
                <select className="inp" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Assign to salesman">
                <select className="inp" value={form.assignedTo} onChange={e=>setForm({...form, assignedTo:e.target.value})}>
                  <option value="">— Unassigned —</option>
                  {Object.values(users || {}).filter(u=>u.role==='salesman').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{marginTop:8}}>
              <Field label="Notes">
                <VoiceTextarea rows={4} value={form.notes}
                  onChange={v=>setForm({...form, notes:v})}
                  placeholder="Initial notes…"/>
              </Field>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:10}}>
              <button onClick={()=>setShowForm(false)} className="btn" style={{fontSize:12}}>Cancel</button>
              <button onClick={submit} className="btnp" style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12}}>
                <Plus size={12}/> Create
              </button>
            </div>
          </div>
        )}

        {loading ? <div style={{padding:14, color:'var(--t3)'}}>Loading…</div> : items.length === 0 ? (
          <div style={{padding:14, color:'var(--t3)', textAlign:'center'}}>No leads.</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:560, overflowY:'auto'}}>
            {items.map(L => {
              const color = LEAD_COLORS[L.status] || 'var(--acc)';
              return (
                <div key={L._id} onClick={()=>setEditing(L)} style={{
                  cursor:'pointer', padding:'10px 12px', borderRadius:8,
                  background:'var(--bg2)', border:'1px solid var(--b2)',
                  borderLeft:'3px solid ' + color,
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                    <div style={{fontSize:13, fontWeight:700}}>{L.name}</div>
                    {L.company && <span style={{fontSize:11, color:'var(--t3)'}}>· {L.company}</span>}
                    <span style={{
                      fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3,
                      background:color + '22', color,
                    }}>{L.status}</span>
                    <div style={{flex:1}}/>
                    {L.assignedName && (
                      <span style={{fontSize:10, color:'var(--t3)'}}>→ {L.assignedName}</span>
                    )}
                    {L.value > 0 && (
                      <span style={{fontSize:10, color:'#34d399', fontWeight:600}}>
                        ₹{Number(L.value).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <div style={{display:'flex', gap:10, marginTop:4, flexWrap:'wrap'}}>
                    {L.phone && <span style={{fontSize:11, color:'var(--t3)', display:'inline-flex', alignItems:'center', gap:3}}><Phone size={10}/> {L.phone}</span>}
                    {L.email && <span style={{fontSize:11, color:'var(--t3)', display:'inline-flex', alignItems:'center', gap:3}}><Mail size={10}/> {L.email}</span>}
                    {L.city  && <span style={{fontSize:11, color:'var(--t3)', display:'inline-flex', alignItems:'center', gap:3}}><MapPin size={10}/> {L.city}{L.state?', '+L.state:''}</span>}
                  </div>
                  {L.updates?.length > 0 && (
                    <div style={{fontSize:10, color:'var(--t2)', marginTop:6, fontStyle:'italic'}}>
                      Last: {L.updates[L.updates.length-1].comment || '(status change)'} — {fmtTime(L.updates[L.updates.length-1].at)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <LeadDetailModal
          lead={editing}
          users={users}
          currentUser={currentUser}
          isStaff={isStaff}
          onClose={()=>setEditing(null)}
          onSaved={()=>{ setEditing(null); load(); }}
          onDelete={()=>{ removeLead(editing._id); setEditing(null); }}/>
      )}
    </div>
  );
}

// Tiny Field wrapper for leads form
function Field({ label, children }){
  return (
    <div>
      <label style={{fontSize:10, color:'var(--t3)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em'}}>{label}</label>
      {children}
    </div>
  );
}

// Lead detail / update modal
function LeadDetailModal({ lead, users, currentUser, isStaff, onClose, onSaved, onDelete }){
  const [draft, setDraft] = useState(lead);
  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const body = {};
      // Allow admin to edit full record
      if(isStaff){
        ['name','company','phone','email','city','state','source','status','assignedTo','notes','value'].forEach(k => {
          body[k] = draft[k];
        });
      } else {
        // Salesman can only nudge status
        if(newStatus) body.status = newStatus;
      }
      if(comment || newStatus){
        body.update = { comment, status: newStatus };
      }
      const res = await api.leadsUpdate(lead._id, body);
      notify.success('Lead updated');
      setDraft(res);
      setComment(''); setNewStatus('');
      onSaved();
    } catch(e){ notify.error('Save: ' + e.message); }
    setBusy(false);
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:640}}>
        <div className="row" style={{marginBottom:12}}>
          <div style={{fontSize:17, fontWeight:700}}>{draft.name}</div>
          <span style={{
            fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3,
            background: (LEAD_COLORS[draft.status]||'#888')+'22', color: LEAD_COLORS[draft.status]||'#888',
          }}>{draft.status}</span>
          <div className="spacer"/>
          <button onClick={onClose} className="btn"><X size={13}/></button>
        </div>

        {/* Editable fields (admin) — read-only display (salesman) */}
        {isStaff ? (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:10, marginBottom:14}}>
            <Field label="Name"><input className="inp" value={draft.name||''} onChange={e=>setDraft({...draft, name:e.target.value})}/></Field>
            <Field label="Company"><input className="inp" value={draft.company||''} onChange={e=>setDraft({...draft, company:e.target.value})}/></Field>
            <Field label="Phone"><input className="inp" value={draft.phone||''} onChange={e=>setDraft({...draft, phone:e.target.value})}/></Field>
            <Field label="Email"><input className="inp" value={draft.email||''} onChange={e=>setDraft({...draft, email:e.target.value})}/></Field>
            <Field label="City"><input className="inp" value={draft.city||''} onChange={e=>setDraft({...draft, city:e.target.value})}/></Field>
            <Field label="State"><input className="inp" value={draft.state||''} onChange={e=>setDraft({...draft, state:e.target.value})}/></Field>
            <Field label="Source"><input className="inp" value={draft.source||''} onChange={e=>setDraft({...draft, source:e.target.value})}/></Field>
            <Field label="Value (₹)"><input className="inp" type="number" value={draft.value||0} onChange={e=>setDraft({...draft, value:Number(e.target.value)||0})}/></Field>
            <Field label="Status">
              <select className="inp" value={draft.status||'NEW'} onChange={e=>setDraft({...draft, status:e.target.value})}>
                {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Assigned to">
              <select className="inp" value={draft.assignedTo||''} onChange={e=>setDraft({...draft, assignedTo:e.target.value})}>
                <option value="">— Unassigned —</option>
                {Object.values(users || {}).filter(u=>u.role==='salesman').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
          <div style={{background:'var(--bg2)', borderRadius:8, padding:12, marginBottom:14}}>
            {lead.company && <div style={{fontSize:12, color:'var(--t2)'}}>{lead.company}</div>}
            <div style={{display:'flex', gap:14, flexWrap:'wrap', marginTop:6}}>
              {lead.phone && <a href={`tel:${lead.phone}`} style={{fontSize:12, color:'var(--acc)', display:'inline-flex', alignItems:'center', gap:4}}><Phone size={11}/> {lead.phone}</a>}
              {lead.email && <a href={`mailto:${lead.email}`} style={{fontSize:12, color:'var(--acc)', display:'inline-flex', alignItems:'center', gap:4}}><Mail size={11}/> {lead.email}</a>}
              {(lead.city || lead.state) && <span style={{fontSize:12, color:'var(--t3)', display:'inline-flex', alignItems:'center', gap:4}}><MapPin size={11}/> {[lead.city, lead.state].filter(Boolean).join(', ')}</span>}
            </div>
            {lead.notes && <div style={{fontSize:12, color:'var(--t2)', marginTop:8, whiteSpace:'pre-wrap'}}>{lead.notes}</div>}
            {lead.value > 0 && <div style={{fontSize:12, color:'#34d399', fontWeight:700, marginTop:6}}>Value: ₹{Number(lead.value).toLocaleString('en-IN')}</div>}
          </div>
        )}

        {/* Add an update */}
        <div style={{background:'var(--bg2)', borderRadius:8, padding:12, marginBottom:12}}>
          <div style={{fontSize:12, fontWeight:700, marginBottom:8}}>Add update</div>
          <div style={{marginBottom:8}}>
            <VoiceTextarea rows={4}
              placeholder="What happened? Any next steps?"
              value={comment} onChange={setComment}/>
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
            <select className="inp" value={newStatus} onChange={e=>setNewStatus(e.target.value)}
              style={{padding:'6px 10px', fontSize:12, width:'auto'}}>
              <option value="">— Keep status —</option>
              {LEAD_STATUSES.map(s => <option key={s} value={s}>Set: {s}</option>)}
            </select>
            <div style={{flex:1}}/>
            {isStaff && <button onClick={onDelete} className="btn" style={{color:'#f87171', border:'1px solid #7f1d1d', fontSize:12, display:'inline-flex', alignItems:'center', gap:4}}><Trash2 size={11}/> Delete</button>}
            <button onClick={save} disabled={busy} className="btnp" style={{display:'inline-flex', alignItems:'center', gap:6}}>
              <Send size={12}/> {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Update history */}
        <div style={{fontSize:12, fontWeight:700, marginBottom:6}}>Activity ({lead.updates?.length || 0})</div>
        <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:240, overflowY:'auto'}}>
          {(lead.updates || []).slice().reverse().map((u, idx) => (
            <div key={idx} style={{background:'var(--bg2)', borderRadius:6, padding:'8px 10px'}}>
              <div style={{fontSize:11, color:'var(--t3)'}}>{u.byName || u.by} · {fmtTime(u.at)}{u.status?` · → ${u.status}`:''}</div>
              {u.comment && <div style={{fontSize:12, color:'var(--t1)', marginTop:2}}>{u.comment}</div>}
            </div>
          ))}
          {(!lead.updates || lead.updates.length === 0) && (
            <div style={{fontSize:11, color:'var(--t3)', padding:8, textAlign:'center'}}>No updates yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAVES PAGE
export function LeavesPage({ users, currentUser }){
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  return <_LeavesBody users={users} currentUser={currentUser} isStaff={isStaff}/>;
}
function _LeavesBody({ users, currentUser, isStaff }){
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fromDate:todayStr(), toDate:todayStr(), leaveType:'CASUAL', reason:'' });
  const [filterUser, setFilterUser] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const q = isStaff && filterUser ? { userId: filterUser } : {};
      const data = await api.leavesList(q);
      setItems(data || []);
    } catch(e){ notify.error('Load leaves: ' + e.message); }
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [filterUser]);

  const apply = async () => {
    if(!form.fromDate || !form.toDate){ notify.error('Pick from/to dates'); return; }
    if(form.toDate < form.fromDate){ notify.error('To date is before From date'); return; }
    try {
      await api.leavesApply(form);
      notify.success('Leave application sent');
      setForm({ fromDate:todayStr(), toDate:todayStr(), leaveType:'CASUAL', reason:'' });
      setShowForm(false);
      load();
    } catch(e){ notify.error(e.message); }
  };

  const review = async (l, status) => {
    if(!isStaff) return;
    try {
      await api.leavesUpdate(l._id, { status });
      notify.success('Leave ' + status.toLowerCase());
      load();
    } catch(e){ notify.error(e.message); }
  };

  return (
    <div className="fade" style={{display:'flex', flexDirection:'column', gap:14}}>
      <div>
        <div style={{fontSize:11, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.15em', marginBottom:4}}>CRM</div>
        <div className="crm-page-title" style={{fontSize:22, fontWeight:700}}>Leaves</div>
        <div className="crm-page-sub" style={{fontSize:13, color:'var(--t3)', marginTop:4}}>
          {isStaff ? 'Approve / reject leave applications.' : 'Apply for leave and track approval status.'}
        </div>
      </div>
      <div className="card">
        <div className="row" style={{marginBottom:10}}>
          <div style={{fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6}}>
            <Calendar size={13}/> Leave applications {items.length ? `(${items.length})` : ''}
          </div>
          <div className="spacer"/>
          {isStaff && (
            <select className="inp" value={filterUser} onChange={e=>setFilterUser(e.target.value)}
              style={{padding:'4px 10px', fontSize:11, width:'auto'}}>
              <option value="">All users</option>
              {Object.values(users || {}).filter(u=>u.role==='salesman').map(u=>(
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          <button onClick={()=>setShowForm(s=>!s)} className="btnp"
            style={{display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11}}>
            <Plus size={11}/> Apply
          </button>
          <button onClick={()=>exportCSV(
            'Leaves_' + todayStr() + '.csv',
            ['User','Type','From','To','DaysApplied','Status','Reason','ReviewedBy','ReviewComment','AppliedOn'],
            items.map(l => {
              const days = Math.max(1, Math.round(
                (new Date(l.toDate) - new Date(l.fromDate)) / (1000*60*60*24)
              ) + 1);
              return [
                l.userName || l.userId,
                l.leaveType || '',
                l.fromDate || '', l.toDate || '',
                days,
                l.status || '',
                l.reason || '',
                l.reviewedByName || '',
                l.reviewComment || '',
                l.createdAt || '',
              ];
            })
          )} className="btn" title="Export leaves to Excel/CSV"
            style={{padding:'4px 10px', fontSize:11, display:'inline-flex', alignItems:'center', gap:4}}>
            <Download size={11}/> Export
          </button>
          <button onClick={load} className="btn" style={{padding:'4px 10px', fontSize:11}}>
            <RefreshCw size={11}/>
          </button>
        </div>

        {showForm && (
          <div style={{background:'var(--bg2)', borderRadius:8, padding:14, marginBottom:12, border:'1px solid var(--b2)'}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px,1fr))', gap:10}}>
              <Field label="From"><input className="inp" type="date" value={form.fromDate} onChange={e=>setForm({...form, fromDate:e.target.value})}/></Field>
              <Field label="To"><input className="inp" type="date" value={form.toDate} onChange={e=>setForm({...form, toDate:e.target.value})}/></Field>
              <Field label="Type">
                <select className="inp" value={form.leaveType} onChange={e=>setForm({...form, leaveType:e.target.value})}>
                  {LEAVE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <div style={{marginTop:8}}>
              <Field label="Reason">
                <VoiceTextarea rows={4} value={form.reason}
                  onChange={v=>setForm({...form, reason:v})}
                  placeholder="Why are you taking leave?"/>
              </Field>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:10}}>
              <button onClick={()=>setShowForm(false)} className="btn" style={{fontSize:12}}>Cancel</button>
              <button onClick={apply} className="btnp" style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12}}>
                <Send size={12}/> Submit
              </button>
            </div>
          </div>
        )}

        {loading ? <div style={{padding:14, color:'var(--t3)'}}>Loading…</div> : items.length === 0 ? (
          <div style={{padding:14, color:'var(--t3)', textAlign:'center'}}>No leaves yet.</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:540, overflowY:'auto'}}>
            {items.map(l => {
              const statusColor = l.status === 'APPROVED' ? '#34d399'
                                : l.status === 'REJECTED' ? '#f87171'
                                : l.status === 'CANCELLED' ? '#94a3b8'
                                : '#fbbf24';
              return (
                <div key={l._id} style={{
                  display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px',
                  background:'var(--bg2)', borderRadius:8,
                  borderLeft:'3px solid ' + statusColor,
                }}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                      <span style={{fontSize:13, fontWeight:700}}>{l.userName || l.userId}</span>
                      <span style={{fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, background:statusColor+'22', color:statusColor}}>{l.status}</span>
                      <span style={{fontSize:10, color:'var(--t3)'}}>{l.leaveType}</span>
                    </div>
                    <div style={{fontSize:12, color:'var(--t2)', marginTop:4}}>
                      {l.fromDate} → {l.toDate}
                    </div>
                    {l.reason && <div style={{fontSize:11, color:'var(--t2)', marginTop:4, fontStyle:'italic'}}>{l.reason}</div>}
                    {/* Show who is the designated approver for this salesman */}
                    {(() => {
                      const ap = users[l.userId]?.approver;
                      const apName = ap ? (users[ap]?.name || ap) : null;
                      return apName && l.status === 'PENDING' ? (
                        <div style={{fontSize:10, color:'#a5b4fc', marginTop:4}}>
                          Waiting on approver: {apName}
                        </div>
                      ) : null;
                    })()}
                    {l.reviewedByName && l.status !== 'PENDING' && (
                      <div style={{fontSize:11, color:'var(--t3)', marginTop:4}}>
                        Reviewed by <b>{l.reviewedByName}</b>{l.reviewComment ? ': ' + l.reviewComment : ''}
                      </div>
                    )}
                  </div>
                  {isStaff && l.status === 'PENDING' && (
                    <div style={{display:'flex', gap:4}}>
                      <button onClick={()=>review(l,'APPROVED')} className="btn" title="Approve"
                        style={{background:'rgba(52,211,153,0.10)', color:'#34d399', border:'1px solid #15803d', padding:'4px 8px', fontSize:11}}>
                        <CheckCircle2 size={11}/>
                      </button>
                      <button onClick={()=>review(l,'REJECTED')} className="btn" title="Reject"
                        style={{background:'rgba(248,113,113,0.10)', color:'#f87171', border:'1px solid #7f1d1d', padding:'4px 8px', fontSize:11}}>
                        <X size={11}/>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY CRM hub kept for backwards compatibility. The new sidebar exposes
// each section as its own page (AttendancePage / VisitsPage / LeadsPage /
// LeavesPage). This default export just delegates to VisitsPage so any old
// /#/crm link still lands on something useful.
export default function CRM({ dealers, users, currentUser }){
  return (
    <VisitsPage dealers={dealers} users={users} currentUser={currentUser}/>
  );
}
