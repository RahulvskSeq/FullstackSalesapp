// import React, { useState } from 'react';
// import { Eye, EyeOff, Sun, Moon } from 'lucide-react';

// export default function LoginPage({users,onLogin,theme,toggleTheme}){
//   const [uid_,setUid]=useState('');
//   const [pw,setPw]=useState('');
//   const [showPw,setShowPw]=useState(false);
//   const [err,setErr]=useState('');
//   const submit = async () => {
//     if(!uid_||!pw){ setErr('Choose user and enter password'); return; }
//     // Try API login first
//     try {
//       const { api: apiMod } = await import('../api.js');
//       const res = await apiMod.login(uid_, pw);
//       if(res?.token && res?.user){ onLogin(res.user, res.token); return; }
//     } catch(e) {
//       // API not available - fallback to local auth
//     }
//     // Local fallback
//     const u = users[uid_];
//     if(!u || u.pass !== pw){ setErr('Wrong username or password'); return; }
//     onLogin(u, null);
//   };
//   const sms=Object.values(users).filter(x=>x.role==='salesman');
//   return(
//     <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
//       <div style={{position:'absolute',top:-200,right:-200,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',filter:'blur(40px)'}}/>
//       <div style={{position:'absolute',bottom:-200,left:-200,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(167,139,250,0.12), transparent 70%)',filter:'blur(40px)'}}/>
//       <div style={{width:400,padding:'0 16px',position:'relative',zIndex:1}}>
//         <div style={{textAlign:'center',marginBottom:32}}>
//           <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--acc)',letterSpacing:4,marginBottom:10}}>▸ SALES TRACKER PRO</div>
//           <div style={{fontSize:32,fontWeight:700,letterSpacing:'-0.02em'}}>Welcome back</div>
//           <div style={{fontSize:13,color:'var(--t3)',marginTop:6}}>Sign in to your dashboard</div>
//         </div>
//         <div className="card" style={{padding:28}}>
//           <div className="field">
//             <label>User</label>
//             <select className="sel inp" style={{padding:'10px 12px'}} value={uid_} onChange={e=>{setUid(e.target.value);setErr('');}}>
//               <option value="">Choose...</option>
//               <option value="admin">Admin (all data)</option>
//               {sms.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
//             </select>
//           </div>
//           <div className="field">
//             <label>Password</label>
//             <div style={{position:'relative'}}>
//               <input type={showPw?'text':'password'} className="inp" style={{padding:'10px 40px 10px 12px'}} value={pw} onChange={e=>{setPw(e.target.value);setErr('');}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Enter password"/>
//               <button onClick={()=>setShowPw(s=>!s)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t3)',cursor:'pointer'}}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
//             </div>
//           </div>
//           {err&&<div style={{fontSize:12,color:'var(--red)',textAlign:'center',marginBottom:10}}>{err}</div>}
//           <button onClick={submit} className="btnp" style={{width:'100%',padding:12,fontSize:14}}>Sign in →</button>
//         </div>
//         <div style={{textAlign:'center',marginTop:14}}>
//           <button onClick={toggleTheme} className="btn" style={{fontSize:12,display:'inline-flex',alignItems:'center',gap:6}}>{theme==='dark'?<Sun size={13}/>:<Moon size={13}/>} Toggle theme</button>
//         </div>
//       </div>
//     </div>
//   );
// }



// import React, { useState, useEffect } from 'react';
// import { Eye, EyeOff, Sun, Moon, Server, WifiOff } from 'lucide-react';

// export default function LoginPage({users,onLogin,theme,toggleTheme}){
//   const [uid_,setUid]=useState('');
//   const [pw,setPw]=useState('');
//   const [showPw,setShowPw]=useState(false);
//   const [err,setErr]=useState('');
//   const [loading,setLoading]=useState(false);
//   const [serverOk,setServerOk]=useState(null); // null=checking, true=up, false=down

//   // Check if server is running
//   useEffect(()=>{
//     const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
//     fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) })
//       .then(r=>r.ok?r.json():null)
//       .then(d=>setServerOk(!!d?.ok))
//       .catch(()=>setServerOk(false));
//   },[]);

//   const submit = async () => {
//     if(!uid_||!pw){ setErr('Choose user and enter password'); return; }
//     setLoading(true); setErr('');

//     // Try API login first (gets JWT token for uploads etc)
//     try {
//       const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
//       const res = await fetch(`${BASE}/auth/login`,{
//         method:'POST',
//         headers:{'Content-Type':'application/json'},
//         body: JSON.stringify({id:uid_, pass:pw}),
//         signal: AbortSignal.timeout(3000),
//       }).then(r=>r.json());

//       if(res?.token && res?.user){
//         setLoading(false);
//         onLogin(res.user, res.token);
//         return;
//       }
//       if(res?.error){ setErr(res.error); setLoading(false); return; }
//     } catch(e) {
//       // Server not available — use local auth
//     }

//     // Local fallback (no server)
//     const u = users[uid_];
//     if(!u || u.pass !== pw){ setErr('Wrong username or password'); setLoading(false); return; }
//     setLoading(false);
//     onLogin(u, null);
//   };

//   const sms=Object.values(users).filter(x=>x.role==='salesman');

//   return(
//     <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
//       <div style={{position:'absolute',top:-200,right:-200,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',filter:'blur(40px)'}}/>
//       <div style={{position:'absolute',bottom:-200,left:-200,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(167,139,250,0.12), transparent 70%)',filter:'blur(40px)'}}/>
//       <div style={{width:400,padding:'0 16px',position:'relative',zIndex:1}}>
//         <div style={{textAlign:'center',marginBottom:32}}>
//           <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--acc)',letterSpacing:4,marginBottom:10}}>▸ SALES TRACKER PRO</div>
//           <div style={{fontSize:32,fontWeight:700,letterSpacing:'-0.02em'}}>Welcome back</div>
//           <div style={{fontSize:13,color:'var(--t3)',marginTop:6}}>Sign in to your dashboard</div>
//         </div>

//         {/* Server status indicator */}
//         <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:14,fontSize:11}}>
//           {serverOk===null&&<><div style={{width:8,height:8,borderRadius:'50%',background:'#fbbf24',animation:'spin 1s linear infinite'}}/><span style={{color:'var(--t3)'}}>Checking server...</span></>}
//           {serverOk===true&&<><Server size={12} color="#34d399"/><span style={{color:'#34d399',fontWeight:600}}>Server connected — full features available</span></>}
//           {serverOk===false&&<><WifiOff size={12} color="#fbbf24"/><span style={{color:'#fbbf24'}}>Server offline — sheet mode (uploads disabled)</span></>}
//         </div>

//         <div className="card" style={{padding:28}}>
//           <div className="field">
//             <label>User</label>
//             <select className="sel inp" style={{padding:'10px 12px'}} value={uid_} onChange={e=>{setUid(e.target.value);setErr('');}}>
//               <option value="">Choose...</option>
//               <option value="admin">Admin (all data)</option>
//               {sms.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
//             </select>
//           </div>
//           <div className="field">
//             <label>Password</label>
//             <div style={{position:'relative'}}>
//               <input type={showPw?'text':'password'} className="inp" style={{padding:'10px 40px 10px 12px'}} value={pw} onChange={e=>{setPw(e.target.value);setErr('');}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Enter password"/>
//               <button onClick={()=>setShowPw(s=>!s)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t3)',cursor:'pointer'}}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
//             </div>
//           </div>
//           {err&&<div style={{fontSize:12,color:'var(--red)',textAlign:'center',marginBottom:10,padding:'6px 10px',background:'rgba(248,113,113,0.08)',borderRadius:6}}>{err}</div>}
//           <button onClick={submit} disabled={loading} className="btnp" style={{width:'100%',padding:12,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
//             {loading?<><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Signing in...</>:'Sign in →'}
//           </button>
//         </div>
//         <div style={{textAlign:'center',marginTop:14}}>
//           <button onClick={toggleTheme} className="btn" style={{fontSize:12,display:'inline-flex',alignItems:'center',gap:6}}>{theme==='dark'?<Sun size={13}/>:<Moon size={13}/>} Toggle theme</button>
//         </div>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Sun, Moon, Server, WifiOff, Settings, TrendingUp, Users, MapPin, ArrowRight } from 'lucide-react';
import { getApiBase, api } from '../api';
import ApiUrlSettings from './ApiUrlSettings';

export default function LoginPage({users:propUsers,onLogin,theme,toggleTheme}){
  // Start with whatever was in the parent's local cache, then merge in fresh
  // server data once the connectivity check succeeds. This ensures users that
  // were created on another device (or by an admin after the local cache was
  // last written) show up in the dropdown.
  const [users, setLocalUsers] = useState(propUsers || {});
  useEffect(()=>{ setLocalUsers(propUsers || {}); }, [propUsers]);

  const [uid_,setUid]=useState('');
  const [pw,setPw]=useState('');
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState('');
  const [loading,setLoading]=useState(false);
  const [serverOk,setServerOk]=useState(null); // null=checking, true=up, false=down
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Check if server is running. Mobile networks + Railway cold-start can
  // easily take 5–8 seconds, so the previous 2-second cap was firing false
  // negatives in the APK. We now try once with 12s, and if it fails (cold
  // start) we wait 2s and retry once more.
  useEffect(()=>{
    let cancelled = false;
    const BASE = getApiBase();
    const ping = (timeoutMs) =>
      fetch(`${BASE}/health`, { signal: AbortSignal.timeout(timeoutMs), cache:'no-store' })
        .then(r => r.ok ? r.json() : null)
        .catch(()=>null);

    (async () => {
      let d = await ping(12000);
      if(!d?.ok){
        // Railway may have been asleep — wait then retry once with a longer cap
        await new Promise(r => setTimeout(r, 2000));
        d = await ping(15000);
      }
      if(!cancelled) setServerOk(!!d?.ok);
    })();
    return ()=>{ cancelled = true; };
  },[]);

  // Once the server check passes, pull the live user list so newly-created
  // accounts appear in the dropdown immediately (no reinstall, no refresh).
  useEffect(()=>{
    if(serverOk !== true) return;
    let cancelled = false;
    (async()=>{
      try {
        const fresh = await api.getUsers();   // returns { id: user, ... } map
        if(!cancelled && fresh && typeof fresh === 'object'){
          setLocalUsers(prev => ({ ...prev, ...fresh }));
        }
      } catch(e){
        // Server is up but call failed — keep the local cache, no UI noise.
        console.warn('[LoginPage] getUsers failed:', e?.message);
      }
    })();
    return ()=>{ cancelled = true; };
  }, [serverOk]);

  const submit = async () => {
    if(!uid_||!pw){ setErr('Choose user and enter password'); return; }
    setLoading(true); setErr('');

    // Try API login first (gets JWT token for uploads etc)
    try {
      const BASE = getApiBase();
      const res = await fetch(`${BASE}/auth/login`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({id:uid_, pass:pw}),
        signal: AbortSignal.timeout(3000),
      }).then(r=>r.json());

      if(res?.token && res?.user){
        setLoading(false);
        onLogin(res.user, res.token, pw);
        return;
      }
      if(res?.error){ setErr(res.error); setLoading(false); return; }
    } catch(e) {
      // Server not available — use local auth
    }

    // Local fallback (no server)
    const u = users[uid_];
    if(!u || u.pass !== pw){ setErr('Wrong username or password'); setLoading(false); return; }
    setLoading(false);
    onLogin(u, null, pw);
  };

  // Every user shows up in the login picker, ordered by role (superadmin →
  // admin → salesman) then alphabetical. New accounts of ANY role appear
  // immediately after a server refresh.
  const allLoginUsers = Object.values(users || {})
    .filter(x => x && x.id && x.name)
    .sort((a,b) => {
      const order = { superadmin: 0, admin: 1, salesman: 2 };
      const r = (order[a.role] ?? 9) - (order[b.role] ?? 9);
      if(r !== 0) return r;
      return (a.name || '').localeCompare(b.name || '');
    });

  return(
    <div className="lg-root">
      {/* Scoped to this screen — the only full-bleed layout in the app. */}
      <style>{`
        .lg-root{
          min-height:100dvh; position:relative; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
          padding:28px 20px calc(28px + env(safe-area-inset-bottom));
          background:var(--bg); color:var(--t1);
        }
        /* Ambient wash, tuned to show in both themes — the original page had
           two blurred circles that were invisible on a light background. */
        .lg-root::before, .lg-root::after{
          content:''; position:absolute; border-radius:50%; pointer-events:none; filter:blur(70px);
        }
        .lg-root::before{
          width:620px; height:620px; top:-260px; left:-180px;
          background:radial-gradient(circle, rgba(99,102,241,.30), transparent 68%);
        }
        .lg-root::after{
          width:560px; height:560px; bottom:-240px; right:-160px;
          background:radial-gradient(circle, rgba(56,189,248,.24), transparent 68%);
        }

        .lg-col{ position:relative; z-index:1; width:100%; max-width:424px }

        /* Everything lives in the one card — brand, status, form and the
           server row. Nothing floats loose on the background. */
        .lg-card{
          background:var(--bg1); border:1px solid var(--b1); border-radius:18px;
          padding:40px 34px 26px;
          box-shadow:0 1px 2px rgba(16,24,40,.04), 0 18px 44px -18px rgba(16,24,40,.30);
        }

        .lg-brandmark{
          display:flex; align-items:center; justify-content:center; gap:11px; margin-bottom:26px;
        }
        .lg-logo{
          width:38px; height:38px; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          background:linear-gradient(135deg, #4f46e5, #6366f1 55%, #38bdf8);
          box-shadow:0 9px 20px -10px rgba(79,70,229,.85);
          color:#fff;
        }
        .lg-wordmark{
          font-family:"JetBrains Mono", ui-monospace, monospace;
          font-size:10.5px; letter-spacing:.24em; text-transform:uppercase;
          color:var(--t2); font-weight:700;
        }

        .lg-statusrow{ display:flex; justify-content:center; margin-bottom:22px }
        .lg-status{
          display:inline-flex; align-items:center; gap:7px;
          padding:5px 11px; border-radius:999px; font-size:11.5px; font-weight:600;
          border:1px solid var(--b1); background:var(--bg2);
        }

        .lg-title{ font-size:27px; font-weight:750; letter-spacing:-.02em; text-align:center }
        .lg-lede{ font-size:13.5px; color:var(--t3); text-align:center; margin:7px 0 30px }

        .lg-label{
          display:block; font-size:11px; font-weight:700; letter-spacing:.07em;
          text-transform:uppercase; color:var(--t3); margin-bottom:7px;
        }
        .lg-field{ margin-bottom:20px }
        .lg-input{
          width:100%; box-sizing:border-box; padding:14px 14px;
          background:var(--bg); color:var(--t1);
          border:1px solid var(--b2); border-radius:10px;
          font-size:14.5px; outline:none; transition:border-color .14s, box-shadow .14s;
        }
        .lg-input::placeholder{ color:var(--t3); opacity:.7 }
        .lg-input:focus{ border-color:var(--acc); box-shadow:0 0 0 3.5px rgba(99,102,241,.16) }
        .lg-eye{
          position:absolute; right:6px; top:50%; transform:translateY(-50%);
          background:none; border:none; color:var(--t3); cursor:pointer;
          padding:7px; border-radius:7px; display:flex;
        }
        .lg-eye:hover{ color:var(--t1); background:var(--bg2) }

        .lg-go{
          width:100%; margin-top:10px; padding:15px; border:none; border-radius:10px;
          cursor:pointer; font-size:14.5px; font-weight:700; color:#fff;
          background:linear-gradient(135deg, #4f46e5, #4338ca);
          display:flex; align-items:center; justify-content:center; gap:9px;
          box-shadow:0 9px 20px -9px rgba(79,70,229,.8);
          transition:transform .1s, box-shadow .16s, opacity .16s;
        }
        .lg-go:hover:not(:disabled){ box-shadow:0 13px 26px -9px rgba(79,70,229,.9) }
        .lg-go:active:not(:disabled){ transform:translateY(1px) }
        .lg-go:disabled{ opacity:.65; cursor:not-allowed }

        .lg-err{
          font-size:12.5px; color:#dc2626; margin-bottom:13px; padding:9px 12px;
          background:rgba(220,38,38,.09); border:1px solid rgba(220,38,38,.25); border-radius:9px;
        }

        /* Server address and theme: inside the card, but separated by a rule
           and quieter, since neither is part of signing in. The address has to
           stay reachable — on the APK it is set by hand. */
        .lg-meta{
          margin-top:26px; padding-top:16px; border-top:1px solid var(--b1);
          display:flex; align-items:center; justify-content:center;
          gap:7px; flex-wrap:wrap; font-size:11px; color:var(--t3);
        }
        /* Truncate rather than wrap: a real server address is longer than
           localhost and would push the buttons onto their own line. */
        .lg-url{
          background:var(--bg2); padding:2px 6px; border-radius:5px; font-size:10.5px;
          max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .lg-chip{
          background:transparent; border:1px solid var(--b1); border-radius:7px;
          color:var(--t2); padding:3px 9px; font-size:11px; cursor:pointer;
          display:inline-flex; align-items:center; gap:5px;
        }
        .lg-chip:hover{ background:var(--bg2); color:var(--t1) }
      `}</style>

      <div className="lg-col">
        <div className="lg-card">
          <div className="lg-brandmark">
            <span className="lg-logo"><TrendingUp size={19}/></span>
            <span className="lg-wordmark">Sales Tracker Pro</span>
          </div>

          {/* Shown only when there is something to say. "Connected" is the
              normal case and adds nothing, but offline genuinely matters —
              uploads are disabled — so that one stays. */}
          {serverOk !== true && (
            <div className="lg-statusrow">
              <div className="lg-status">
                {serverOk===null && <>
                  <span style={{width:7,height:7,borderRadius:'50%',background:'#f59e0b'}}/>
                  <span style={{color:'var(--t3)'}}>Checking server…</span>
                </>}
                {serverOk===false && <>
                  <WifiOff size={12} color="#f59e0b"/>
                  <span style={{color:'#b45309'}}>Offline — sheet mode</span>
                </>}
              </div>
            </div>
          )}

          <div className="lg-title">Welcome back</div>
          <div className="lg-lede">Sign in to your dashboard.</div>

          <div className="lg-field">
            <label className="lg-label" htmlFor="lg-user">Username</label>
            <input
              id="lg-user"
              type="text"
              className="lg-input"
              value={uid_}
              onChange={e=>{ setUid(e.target.value.trim().toLowerCase()); setErr(''); }}
              onKeyDown={e=>e.key==='Enter'&&submit()}
              placeholder="your username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <div className="lg-field">
            <label className="lg-label" htmlFor="lg-pass">Password</label>
            <div style={{position:'relative'}}>
              <input
                id="lg-pass"
                type={showPw?'text':'password'}
                className="lg-input"
                style={{paddingRight:46}}
                value={pw}
                onChange={e=>{setPw(e.target.value);setErr('');}}
                onKeyDown={e=>e.key==='Enter'&&submit()}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" className="lg-eye" onClick={()=>setShowPw(s=>!s)}
                aria-label={showPw?'Hide password':'Show password'}>
                {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
          </div>

          {err && <div className="lg-err">{err}</div>}

          <button onClick={submit} disabled={loading} className="lg-go">
            {loading
              ? <><span style={{width:15,height:15,border:'2px solid rgba(255,255,255,.35)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Signing in…</>
              : <>Sign in <ArrowRight size={16}/></>}
          </button>

          <div className="lg-meta">
            <span>Server</span>
            <code className="lg-url" title={getApiBase()}>{getApiBase()}</code>
            <button className="lg-chip" onClick={()=>setShowApiSettings(true)}>
              <Settings size={10}/> Change
            </button>
            <button className="lg-chip" onClick={toggleTheme}>
              {theme==='dark'?<Sun size={11}/>:<Moon size={11}/>} Theme
            </button>
          </div>
        </div>

        {showApiSettings && <ApiUrlSettings onClose={()=>setShowApiSettings(false)}/>}
      </div>
    </div>
  );
}