// CRM hub — Attendance, Visits, Leads, Leaves.
// Uses a hidden <input type="file" accept="image/*" capture="environment">
// to grab a fresh camera photo on phones and a file picker on desktop.
// Photos are downscaled to ≤900px and JPEG-encoded to keep payloads small.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera, LogIn as IconIn, LogOut as IconOut, MapPin, Calendar, Plus,
  X, Phone, Mail, Building2, Trash2, Send, RefreshCw, Image as ImageIcon,
  CheckCircle2, AlertCircle, Briefcase, ClipboardList, Users as UsersIcon,
  Filter,
} from 'lucide-react';
import { api } from '../api';
import { Avatar } from './UI';
import { notify, confirmDialog } from './Toast';

const todayStr = () => new Date().toISOString().slice(0,10);
const fmtTime  = (d) => new Date(d).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' });
const fmtDate  = (d) => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });

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
function LocationCapture({ loc, setLoc }){
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
          <input className="inp" placeholder="Note (optional)" value={note} onChange={e=>setNote(e.target.value)}
            style={{flex:'1 1 200px', minWidth:160}}/>
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
// VISITS PAGE
export function VisitsPage({ dealers, users, currentUser }){
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto]     = useState('');
  const [loc,   setLoc]       = useState({ lat:null, lng:null });
  const [dealerName, setDealerName] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy]       = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [zoom, setZoom]       = useState('');

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

  const submit = async () => {
    if(!dealerName.trim()){ notify.error('Party / Dealer name required'); return; }
    if(!photo){ notify.error('Capture a photo first'); return; }
    setBusy(true);
    // Try matching against existing dealer roster to set dealerId
    const match = (dealers || []).find(d => (d.name||'').toUpperCase().trim() === dealerName.toUpperCase().trim());
    try {
      await api.visitsCreate({
        dealerId: match?.id || '',
        dealerName: dealerName.trim(),
        comment, photo,
        lat: loc.lat, lng: loc.lng,
        address: loc.address || '',
        city:    loc.city    || '',
        state:   loc.state   || '',
      });
      notify.success('Visit logged');
      setDealerName(''); setComment(''); setPhoto('');
      load();
    } catch(e){ notify.error('Save: ' + e.message); }
    setBusy(false);
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

  // Datalist of dealer names for quick autocomplete
  const dealerOptions = useMemo(()=>(dealers||[]).map(d=>d.name).filter(Boolean).slice(0, 1200), [dealers]);

  return (
    <div className="fade" style={{display:'flex', flexDirection:'column', gap:14}}>
      <div>
        <div style={{fontSize:11, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.15em', marginBottom:4}}>CRM</div>
        <div className="crm-page-title" style={{fontSize:22, fontWeight:700}}>Visits</div>
        <div className="crm-page-sub" style={{fontSize:13, color:'var(--t3)', marginTop:4}}>
          Log every dealer / party visit with photo + GPS + discussion notes.
        </div>
      </div>
      <div className="card">
        <div style={{fontSize:13, fontWeight:700, marginBottom:10, display:'flex', alignItems:'center', gap:8}}>
          <ClipboardList size={14}/> Log a visit
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          <input className="inp" list="crm-dealer-list" placeholder="Party / Dealer name"
            value={dealerName} onChange={e=>setDealerName(e.target.value)}/>
          <datalist id="crm-dealer-list">
            {dealerOptions.map(n => <option key={n} value={n}/>)}
          </datalist>
          <textarea className="inp" placeholder="What was discussed?" value={comment} onChange={e=>setComment(e.target.value)}
            rows={3} style={{resize:'vertical', fontFamily:'inherit'}}/>
          <div className="crm-row">
            <PhotoCapture photo={photo} setPhoto={setPhoto} label="Capture visit photo"/>
            <LocationCapture loc={loc} setLoc={setLoc}/>
            <button onClick={submit} disabled={busy} className="btnp"
              style={{display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6}}>
              <Send size={13}/> {busy ? 'Saving…' : 'Save visit'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{marginBottom:10}}>
          <div style={{fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6}}>
            <Calendar size={13}/> Visit history {items.length ? `(${items.length})` : ''}
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
          <button onClick={load} className="btn" style={{padding:'4px 10px', fontSize:11}}>
            <RefreshCw size={11}/>
          </button>
        </div>
        {loading ? <div style={{padding:14, color:'var(--t3)'}}>Loading…</div> : items.length === 0 ? (
          <div style={{padding:14, color:'var(--t3)', textAlign:'center'}}>No visits yet.</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:540, overflowY:'auto'}}>
            {items.map(v => (
              <div key={v._id} style={{
                display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px',
                background:'var(--bg2)', borderRadius:8, borderLeft:'3px solid var(--acc)',
              }}>
                {v.photo
                  ? <img src={v.photo} alt="" onClick={()=>setZoom(v.photo)}
                      style={{width:60, height:60, objectFit:'cover', borderRadius:6, cursor:'zoom-in', border:'1px solid var(--b2)', flexShrink:0}}/>
                  : <div style={{width:60, height:60, borderRadius:6, background:'var(--bg1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', flexShrink:0}}><ImageIcon size={18}/></div>}
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                    <div style={{fontSize:13, fontWeight:700}}>{v.dealerName}</div>
                    <span style={{fontSize:10, color:'var(--t3)'}}>by {v.userName || v.userId}</span>
                    <span style={{marginLeft:'auto', fontSize:10, color:'var(--t3)'}}>{fmtTime(v.createdAt)}</span>
                  </div>
                  {v.comment && <div style={{fontSize:12, color:'var(--t2)', marginTop:4, whiteSpace:'pre-wrap'}}>{v.comment}</div>}
                  {v.address && (
                    <div style={{fontSize:10, color:'#a5b4fc', marginTop:4, display:'flex', alignItems:'center', gap:3}}>
                      <MapPin size={10}/> {v.address}
                    </div>
                  )}
                  {(v.lat || v.lng) && !v.address && (
                    <div style={{fontSize:10, color:'var(--t3)', marginTop:4, display:'flex', alignItems:'center', gap:3}}>
                      <MapPin size={10}/> {v.lat?.toFixed(4)}, {v.lng?.toFixed(4)}
                    </div>
                  )}
                </div>
                {(isStaff || v.userId === currentUser.id) && (
                  <button onClick={()=>removeVisit(v._id)} title="Delete visit"
                    style={{background:'none', border:'none', color:'#f87171', cursor:'pointer', padding:4}}>
                    <Trash2 size={13}/>
                  </button>
                )}
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

  // Form state for create
  const [form, setForm] = useState({
    name:'', company:'', phone:'', email:'', city:'', state:'', source:'',
    status:'NEW', assignedTo:'', notes:'', value:0,
  });

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
            <button onClick={()=>setShowForm(s=>!s)} className="btnp"
              style={{display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11}}>
              <Plus size={11}/> New Lead
            </button>
          )}
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
              <Field label="Notes"><textarea className="inp" rows={2} value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}/></Field>
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
          <textarea className="inp" rows={2} placeholder="What happened? Any next steps?"
            value={comment} onChange={e=>setComment(e.target.value)}
            style={{resize:'vertical', fontFamily:'inherit', marginBottom:8}}/>
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
              <Field label="Reason"><textarea className="inp" rows={2} value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})}/></Field>
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
                    {l.reviewComment && (
                      <div style={{fontSize:11, color:'var(--t3)', marginTop:4}}>
                        Reviewed by {l.reviewedByName}: {l.reviewComment}
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
