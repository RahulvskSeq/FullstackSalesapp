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
import { Eye, EyeOff, Sun, Moon, Server, WifiOff, Settings } from 'lucide-react';
import { getApiBase } from '../api';
import ApiUrlSettings from './ApiUrlSettings';

export default function LoginPage({users,onLogin,theme,toggleTheme}){
  const [uid_,setUid]=useState('');
  const [pw,setPw]=useState('');
  const [showPw,setShowPw]=useState(false);
  const [err,setErr]=useState('');
  const [loading,setLoading]=useState(false);
  const [serverOk,setServerOk]=useState(null); // null=checking, true=up, false=down
  const [showApiSettings, setShowApiSettings] = useState(false);

  // Check if server is running
  useEffect(()=>{
    const BASE = getApiBase();
    fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) })
      .then(r=>r.ok?r.json():null)
      .then(d=>setServerOk(!!d?.ok))
      .catch(()=>setServerOk(false));
  },[]);

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

  const sms=Object.values(users).filter(x=>x.role==='salesman');

  return(
    <div style={{height:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-200,right:-200,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',filter:'blur(40px)'}}/>
      <div style={{position:'absolute',bottom:-200,left:-200,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(167,139,250,0.12), transparent 70%)',filter:'blur(40px)'}}/>
      <div style={{width:400,padding:'0 16px',position:'relative',zIndex:1}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontFamily:'"JetBrains Mono",monospace',fontSize:11,color:'var(--acc)',letterSpacing:4,marginBottom:10}}>▸ SALES TRACKER PRO</div>
          <div style={{fontSize:32,fontWeight:700,letterSpacing:'-0.02em'}}>Welcome back</div>
          <div style={{fontSize:13,color:'var(--t3)',marginTop:6}}>Sign in to your dashboard</div>
        </div>

        {/* Server status indicator */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:8,fontSize:11}}>
          {serverOk===null&&<><div style={{width:8,height:8,borderRadius:'50%',background:'#fbbf24',animation:'spin 1s linear infinite'}}/><span style={{color:'var(--t3)'}}>Checking server...</span></>}
          {serverOk===true&&<><Server size={12} color="#34d399"/><span style={{color:'#34d399',fontWeight:600}}>Server connected — full features available</span></>}
          {serverOk===false&&<><WifiOff size={12} color="#fbbf24"/><span style={{color:'#fbbf24'}}>Server offline — sheet mode (uploads disabled)</span></>}
        </div>

        {/* Backend URL config — essential for mobile/APK installs */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:14,fontSize:10,color:'var(--t3)'}}>
          <span>Server: <code style={{background:'var(--bg2)',padding:'1px 4px',borderRadius:3}}>{getApiBase()}</code></span>
          <button onClick={()=>setShowApiSettings(true)}
            style={{display:'flex',alignItems:'center',gap:3,background:'transparent',border:'1px solid var(--b1)',borderRadius:5,color:'var(--t2)',padding:'2px 8px',fontSize:10,cursor:'pointer'}}>
            <Settings size={10}/> Change
          </button>
        </div>
        {showApiSettings && <ApiUrlSettings onClose={()=>setShowApiSettings(false)}/>}

        <div className="card" style={{padding:28}}>
          <div className="field">
            <label>User</label>
            <select className="sel inp" style={{padding:'10px 12px'}} value={uid_} onChange={e=>{setUid(e.target.value);setErr('');}}>
              <option value="">Choose...</option>
              <option value="admin">Admin (all data)</option>
              {sms.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Password</label>
            <div style={{position:'relative'}}>
              <input type={showPw?'text':'password'} className="inp" style={{padding:'10px 40px 10px 12px'}} value={pw} onChange={e=>{setPw(e.target.value);setErr('');}} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Enter password"/>
              <button onClick={()=>setShowPw(s=>!s)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t3)',cursor:'pointer'}}>{showPw?<EyeOff size={16}/>:<Eye size={16}/>}</button>
            </div>
          </div>
          {err&&<div style={{fontSize:12,color:'var(--red)',textAlign:'center',marginBottom:10,padding:'6px 10px',background:'rgba(248,113,113,0.08)',borderRadius:6}}>{err}</div>}
          <button onClick={submit} disabled={loading} className="btnp" style={{width:'100%',padding:12,fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {loading?<><div style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Signing in...</>:'Sign in →'}
          </button>
        </div>
        <div style={{textAlign:'center',marginTop:14}}>
          <button onClick={toggleTheme} className="btn" style={{fontSize:12,display:'inline-flex',alignItems:'center',gap:6}}>{theme==='dark'?<Sun size={13}/>:<Moon size={13}/>} Toggle theme</button>
        </div>
      </div>
    </div>
  );
}