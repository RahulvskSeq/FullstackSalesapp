import React, { useState } from 'react';
import { Server, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { getApiBase, setApiBase } from '../api';

// Standalone modal so the user (especially on mobile / APK install) can point
// the app at the correct backend URL without rebuilding. The URL is stored in
// localStorage and survives reloads.
export default function ApiUrlSettings({ onClose }) {
  const [url, setUrl]   = useState(getApiBase());
  const [test, setTest] = useState(null);    // {ok:bool, msg:string}
  const [busy, setBusy] = useState(false);

  const handleTest = async () => {
    setBusy(true); setTest(null);
    try {
      const cleanUrl = url.trim().replace(/\/$/, '');
      const r = await fetch(cleanUrl + '/health', { signal: AbortSignal.timeout(5000) });
      const data = await r.json().catch(() => ({}));
      if(r.ok && data.ok){
        setTest({ ok:true, msg:'Connected. Server responded healthy.' });
      } else {
        setTest({ ok:false, msg:'Reached server but health check failed (' + r.status + ').' });
      }
    } catch(e){
      setTest({ ok:false, msg:'Could not reach: ' + e.message });
    } finally { setBusy(false); }
  };

  const handleSave = () => {
    const cleaned = url.trim().replace(/\/$/, '');
    if(!cleaned){
      setTest({ ok:false, msg:'URL is empty. Enter a URL like https://api.example.com/api' });
      return;
    }
    setApiBase(cleaned);   // reloads the page automatically
  };

  const handleReset = () => {
    setApiBase('');   // clears localStorage; reloads
  };

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:10000,
      display:'flex', alignItems:'center', justifyContent:'center', padding:14,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--bg1)', border:'1px solid var(--b1)',
        borderRadius:12, padding:0, width:'100%', maxWidth:480,
      }}>
        <div style={{
          padding:'14px 18px', background:'var(--bg2)',
          borderBottom:'1px solid var(--b1)',
          display:'flex', alignItems:'center', gap:10,
        }}>
          <Server size={16} color="#a5b4fc"/>
          <span style={{fontSize:14, fontWeight:700, color:'var(--t1)', flex:1}}>Backend URL</span>
          <button onClick={onClose} style={{background:'none', border:'1px solid var(--b1)', borderRadius:5, color:'var(--t2)', padding:'3px 8px', cursor:'pointer', fontSize:11}}><X size={12}/></button>
        </div>

        <div style={{padding:18}}>
          <div style={{fontSize:11, color:'var(--t3)', marginBottom:10, lineHeight:1.5}}>
            Where is the Sales Tracker server running? Enter the full URL including <code style={{background:'var(--bg2)', padding:'1px 4px', borderRadius:3}}>/api</code> at the end.
            Examples:
            <ul style={{margin:'6px 0 0 16px', padding:0, color:'var(--t3)'}}>
              <li>https://salestracker.yourdomain.com/api</li>
              <li>http://192.168.1.5:5000/api &nbsp;(same WiFi)</li>
            </ul>
          </div>

          <label style={{display:'block', fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:5}}>API URL</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)}
            placeholder="https://api.example.com/api"
            style={{
              width:'100%', padding:'10px 12px',
              background:'var(--bg2)', color:'var(--t1)',
              border:'1px solid var(--b1)', borderRadius:6,
              fontSize:13, fontFamily:'monospace', marginBottom:10,
            }}/>

          {test && (
            <div style={{
              padding:'8px 12px', borderRadius:7, marginBottom:10, fontSize:12,
              background: test.ok ? 'rgba(34,197,94,0.10)' : 'rgba(248,113,113,0.10)',
              border: '1px solid ' + (test.ok ? '#15803d' : '#7f1d1d'),
              color: test.ok ? '#86efac' : '#fca5a5',
              display:'flex', alignItems:'center', gap:6,
            }}>
              {test.ok ? <CheckCircle size={13}/> : <AlertCircle size={13}/>}
              <span>{test.msg}</span>
            </div>
          )}

          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            <button onClick={handleTest} disabled={busy}
              style={{
                flex:'1 1 100px', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'transparent', color:'#a5b4fc',
                border:'1px solid #6366f1', borderRadius:6,
                padding:'8px 12px', fontSize:12, fontWeight:700,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}>
              {busy ? 'Testing…' : 'Test connection'}
            </button>
            <button onClick={handleSave} disabled={busy}
              style={{
                flex:'1 1 100px', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'#22c55e', color:'#0c0c1e', border:'none',
                padding:'8px 12px', borderRadius:6, fontSize:12, fontWeight:700,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}>
              <Save size={13}/> Save &amp; reload
            </button>
          </div>

          <button onClick={handleReset}
            style={{
              width:'100%', marginTop:8,
              background:'transparent', color:'var(--t3)',
              border:'1px solid var(--b1)', borderRadius:6,
              padding:'6px 12px', fontSize:11, fontWeight:600,
              cursor:'pointer',
            }}>
            Reset to default
          </button>

          <div style={{fontSize:10, color:'var(--t3)', marginTop:10, textAlign:'center'}}>
            Current default (from build): {(import.meta.env?.VITE_API_URL || 'http://localhost:5000/api')}
          </div>
        </div>
      </div>
    </div>
  );
}
