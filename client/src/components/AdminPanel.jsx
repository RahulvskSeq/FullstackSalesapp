// import React, { useState, useMemo } from 'react';
// import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// import { Users, Target, Award, Activity, RefreshCw, Calendar, Plus, Trash2, Check } from 'lucide-react';
// import { MO as MO_CONST } from '../constants';
// import { pct, spct, pclr } from '../utils';
// import { useMonth } from '../context';
// import { Avatar, KPI, StatCard } from './UI';
// import CategoryDrillChart from './CategoryDrillChart';

// const AdminPanel=({dealers,users,setUsers,setShowUM,onSync,syncing,lastSync,syncErrs,onNavigate,onOpenDealer,monthConfig,saveMonthConfig})=>{
//   const {selectedMonthIdx, MO:ctxMO}=useMonth();
//   const MO = monthConfig?.MO || ctxMO || MO_CONST;
//   const selMoLabel=(MO[selectedMonthIdx]||MO[MO.length-1]||'').slice(0,3);
//   const [tab,setTab]=useState('summary');
//   const [newMonth,setNewMonth]=useState('');
//   const [newMonthErr,setNewMonthErr]=useState('');
//   const sms=Object.values(users).filter(u=>u.role==='salesman');
//   const dealersForMonth=useMemo(()=>dealers.map(d=>({...d,achieved:d.months[selectedMonthIdx]||0,target:(d.monthTargets?.[selectedMonthIdx] ?? d.target)})),[dealers,selectedMonthIdx]);
//   const tt=dealersForMonth.reduce((s,x)=>s+x.target,0),ta=dealersForMonth.reduce((s,x)=>s+x.achieved,0);
//   const active=dealersForMonth.filter(x=>['ACTIVE','ACHIVERS','KEY ACCOUNT'].includes((x.status||'').toUpperCase())).length;
//   const compareData=sms.map(s=>{const sd=dealersForMonth.filter(d=>d.salesman===s.id);return{name:s.name,Target:sd.reduce((a,x)=>a+x.target,0),Achieved:sd.reduce((a,x)=>a+x.achieved,0),smId:s.id,color:s.color};});

//   return(
//     <div className="fade">
//       <div style={{marginBottom:18}}>
//         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:2}}>Admin · {MO[selectedMonthIdx]}</div>
//         <div className="row">
//           <div style={{fontSize:22,fontWeight:700}}>Control Panel</div>
//           <div className="spacer"/>
//           <button onClick={()=>setShowUM(true)} className="btn" style={{display:'flex',alignItems:'center',gap:6}}><Users size={13}/> Users</button>
//           <button onClick={onSync} className="btnp" style={{display:'flex',alignItems:'center',gap:8}} disabled={syncing}><RefreshCw size={13} className={syncing?'spin':''}/> {syncing?'Syncing...':'Sync Sheets'}</button>
//         </div>
//       </div>
//       <div className="tabs">
//         <button className={`tab ${tab==='summary'?'active':''}`} onClick={()=>setTab('summary')}>Summary</button>
//         <button className={`tab ${tab==='compare'?'active':''}`} onClick={()=>setTab('compare')}>Salesman Compare</button>
//         <button className={`tab ${tab==='category'?'active':''}`} onClick={()=>setTab('category')}>Categories</button>
//         <button className={`tab ${tab==='months'?'active':''}`} onClick={()=>setTab('months')} style={{color:tab==='months'?'var(--acc)':'var(--t3)'}}>📅 Month Settings</button>
//       </div>
//       {tab==='summary'&&(
//         <>
//           <div className="stat-grid">
//             <StatCard label="Total Dealers" value={dealers.length} sub={`${active} active`} icon={Users}/>
//             <StatCard label={`${selMoLabel} Target`} value={tt} icon={Target}/>
//             <StatCard label={`${selMoLabel} Achieved`} value={ta} valueColor="#34d399" icon={Award}/>
//             <StatCard label="Overall %" value={spct(tt,ta)} valueColor={pclr(pct(tt,ta))} progress={pct(tt,ta)} icon={Activity}/>
//           </div>
//           <div className="card" style={{marginBottom:16}}>
//             <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>Target vs Achieved by Salesman — {MO[selectedMonthIdx]}</div>
//             <ResponsiveContainer width="100%" height={280}>
//               <BarChart data={compareData} margin={{top:24,right:20,bottom:5,left:0}}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
//                 <XAxis dataKey="name" tick={{fill:'var(--t3)',fontSize:11}}/><YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
//                 <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/><Legend wrapperStyle={{fontSize:12}}/>
//                 <Bar dataKey="Target" fill="#6366f1" radius={[4,4,0,0]} label={{position:'top',fill:'#6366f1',fontSize:11,fontWeight:700}} style={{cursor:'pointer'}} onClick={d=>onNavigate('dealers',{sm:d.smId})}/>
//                 <Bar dataKey="Achieved" fill="#34d399" radius={[4,4,0,0]} label={{position:'top',fill:'#34d399',fontSize:11,fontWeight:700}} style={{cursor:'pointer'}} onClick={d=>onNavigate('dealers',{sm:d.smId})}/>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//           <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14,marginBottom:16}}>
//             {sms.map(s=>{
//               const sd=dealersForMonth.filter(d=>d.salesman===s.id);
//               const st=sd.reduce((a,x)=>a+x.target,0),sa=sd.reduce((a,x)=>a+x.achieved,0),sp=pct(st,sa);
//               const mT=MO.map((_,i)=>dealers.filter(d=>d.salesman===s.id).reduce((a,d)=>a+(d.months[i]||0),0));
//               return(
//                 <div key={s.id} className="card" style={{borderColor:s.color+'44',cursor:'pointer',transition:'transform .15s'}}
//                   onClick={()=>onNavigate('dealers',{sm:s.id})}
//                   onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
//                   onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
//                   <div className="row" style={{marginBottom:12}}>
//                     <Avatar user={s} size={34}/>
//                     <div><div style={{fontSize:15,fontWeight:700}}>{s.name}</div><div style={{fontSize:11,color:'var(--t3)'}}>{sd.length} dealers</div></div>
//                     <div className="spacer"/>
//                     <div style={{fontSize:22,fontWeight:700,color:pclr(sp)}}>{spct(st,sa)}</div>
//                   </div>
//                   <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6,marginBottom:10}}>
//                     <KPI label={`${selMoLabel} Target`} value={st}/>
//                     <KPI label={`${selMoLabel} Achieved`} value={sa} color="#34d399"/>
//                   </div>
//                   <ResponsiveContainer width="100%" height={80}>
//                     <BarChart data={mT.map((v,i)=>({m:MO[i].slice(0,3),v}))} margin={{top:14,right:0,bottom:0,left:0}}>
//                       <XAxis dataKey="m" tick={{fill:'var(--t3)',fontSize:9}} axisLine={false} tickLine={false} interval={0}/>
//                       <Bar dataKey="v" radius={[2,2,0,0]} label={{position:'top',fill:s.color,fontSize:9,fontWeight:600}}>
//                         {mT.map((_,idx)=>(<Cell key={idx} fill={idx===selectedMonthIdx?'#fbbf24':s.color}/>))}
//                       </Bar>
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               );
//             })}
//           </div>
//         </>
//       )}
//       {tab==='compare'&&(
//         <div className="card">
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>All Salesmen — Month by Month</div>
//           <div className="scroll">
//             <table>
//               <thead>
//                 <tr><th>Salesman</th>{[...MO].map((_,di)=>{const i=MO.length-1-di;return<th key={i} style={{textAlign:'right',background:i===selectedMonthIdx?'rgba(99,102,241,.08)':'var(--bg1)'}}>{MO[i]}</th>;})}<th style={{textAlign:'right'}}>Tgt</th><th style={{textAlign:'right'}}>Ach</th><th style={{textAlign:'right'}}>%</th></tr>
//               </thead>
//               <tbody>
//                 {sms.map(s=>{
//                   const sd=dealersForMonth.filter(d=>d.salesman===s.id);
//                   const st=sd.reduce((a,x)=>a+x.target,0),sa=sd.reduce((a,x)=>a+x.achieved,0);
//                   const mT=MO.map((_,i)=>dealers.filter(d=>d.salesman===s.id).reduce((a,d)=>a+(d.months[i]||0),0));
//                   return(
//                     <tr key={s.id} onClick={()=>onNavigate('dealers',{sm:s.id})} style={{cursor:'pointer'}}>
//                       <td><div style={{display:'flex',alignItems:'center',gap:8}}><Avatar user={s} size={22}/><span style={{fontWeight:600}}>{s.name}</span></div></td>
//                       {[...mT].map((_,di)=>{const i=mT.length-1-di;const v=mT[i];return<td key={i} style={{textAlign:'right',color:i===selectedMonthIdx?'#fbbf24':'var(--t2)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'rgba(251,191,36,.05)':'transparent'}}>{v||'—'}</td>;})}
//                       <td style={{textAlign:'right'}}>{st}</td>
//                       <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{sa}</td>
//                       <td style={{textAlign:'right',fontWeight:700,color:pclr(pct(st,sa))}}>{spct(st,sa)}</td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//       {tab==='category'&&<CategoryDrillChart dealers={dealers} selectedMonthIdx={selectedMonthIdx} onNavigate={onNavigate}/>}

//       {tab==='months'&&(
//         <div className="fade">
//           <div style={{fontSize:13,color:'var(--t3)',marginBottom:14}}>Control which months appear in the app. Changes apply instantly — no code editing needed.</div>

//           {/* Current Month */}
//           <div className="card" style={{marginBottom:14}}>
//             <div style={{fontSize:13,fontWeight:700,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
//               <Calendar size={14} color="var(--acc)"/> Set Current Month
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>Click any month to make it the current/default month shown everywhere.</div>
//             <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
//               {(monthConfig?.MO||MO).map((m,i)=>{
//                 const isCurrent=i===(monthConfig?.currentIdx??10);
//                 return(
//                   <button key={m} onClick={()=>{
//                     const fullMap={Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May',Jun:'June',Jul:'July',Aug:'August',Sep:'September',Oct:'October',Nov:'November',Dec:'December'};
//                     const [mon,yr]=m.split('-');
//                     if(saveMonthConfig) saveMonthConfig({currentIdx:i,label:`${fullMap[mon]||mon} 20${yr}`,short:mon});
//                   }} style={{
//                     padding:'5px 12px',borderRadius:6,fontSize:12,cursor:'pointer',
//                     border:`1.5px solid ${isCurrent?'var(--acc)':'var(--b2)'}`,
//                     background:isCurrent?'var(--accL)':'var(--bg2)',
//                     color:isCurrent?'var(--acc)':'var(--t2)',
//                     fontWeight:isCurrent?700:400,
//                     display:'flex',alignItems:'center',gap:4,
//                   }}>
//                     {isCurrent&&<Check size={10}/>}{m}
//                   </button>
//                 );
//               })}
//             </div>
//             <div style={{marginTop:10,fontSize:11,color:'var(--t3)'}}>
//               Current: <strong style={{color:'var(--acc)'}}>{monthConfig?.label||'May 2026'}</strong>
//             </div>
//           </div>

//           {/* Add Month */}
//           <div className="card" style={{marginBottom:14}}>
//             <div style={{fontSize:13,fontWeight:700,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
//               <Plus size={14} color="#34d399"/> Add Month
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>Format: <strong>Jun-26</strong>, <strong>Jul-26</strong>, <strong>Aug-26</strong></div>
//             <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
//               <input className="inp" style={{width:110}} placeholder="e.g. Jun-26"
//                 value={newMonth} onChange={e=>{setNewMonth(e.target.value);setNewMonthErr('');}}
//                 onKeyDown={e=>{
//                   if(e.key==='Enter'){
//                     const m=newMonth.trim();
//                     if(!m){setNewMonthErr('Enter a month');return;}
//                     if(!/^[A-Za-z]{3}-\d{2}$/.test(m)){setNewMonthErr('Format: Jun-26');return;}
//                     const curMO=monthConfig?.MO||MO;
//                     if(curMO.includes(m)){setNewMonthErr('Already exists');return;}
//                     if(saveMonthConfig) saveMonthConfig({MO:[...curMO,m]});
//                     setNewMonth('');setNewMonthErr('');
//                   }
//                 }}
//               />
//               <button className="btnp" onClick={()=>{
//                 const m=newMonth.trim();
//                 if(!m){setNewMonthErr('Enter a month');return;}
//                 if(!/^[A-Za-z]{3}-\d{2}$/.test(m)){setNewMonthErr('Format: Jun-26');return;}
//                 const curMO=monthConfig?.MO||MO;
//                 if(curMO.includes(m)){setNewMonthErr('Already exists');return;}
//                 if(saveMonthConfig) saveMonthConfig({MO:[...curMO,m]});
//                 setNewMonth('');setNewMonthErr('');
//               }} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
//                 <Plus size={12}/> Add
//               </button>
//               <button className="btn" style={{fontSize:12}} onClick={()=>{
//                 const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//                 const curMO=monthConfig?.MO||MO;
//                 const last=curMO[curMO.length-1];
//                 const [mon,yr]=last.split('-');
//                 let mi=months.indexOf(mon),y=parseInt(yr);
//                 const toAdd=[];
//                 for(let j=0;j<6;j++){
//                   mi++;if(mi>=12){mi=0;y++;}
//                   const nm=`${months[mi]}-${String(y).padStart(2,'0')}`;
//                   if(!curMO.includes(nm))toAdd.push(nm);
//                 }
//                 if(toAdd.length&&saveMonthConfig) saveMonthConfig({MO:[...curMO,...toAdd]});
//               }}>+ Next 6 Months</button>
//               {newMonthErr&&<span style={{fontSize:11,color:'#f87171'}}>{newMonthErr}</span>}
//             </div>
//           </div>

//           {/* All months list */}
//           <div className="card">
//             <div style={{fontSize:13,fontWeight:700,marginBottom:12}}>All Months ({(monthConfig?.MO||MO).length})</div>
//             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:8}}>
//               {(monthConfig?.MO||MO).map((m,i)=>{
//                 const isCurrent=i===(monthConfig?.currentIdx??10);
//                 return(
//                   <div key={m} style={{
//                     display:'flex',alignItems:'center',justifyContent:'space-between',
//                     padding:'8px 12px',borderRadius:8,
//                     background:isCurrent?'var(--accL)':'var(--bg2)',
//                     border:`1px solid ${isCurrent?'var(--acc)':'var(--b2)'}`,
//                   }}>
//                     <div>
//                       <div style={{fontSize:12,fontWeight:600,color:isCurrent?'var(--acc)':'var(--t1)'}}>{m}</div>
//                       {isCurrent&&<div style={{fontSize:9,color:'var(--acc)'}}>CURRENT</div>}
//                     </div>
//                     {!isCurrent&&(
//                       <button onClick={()=>{
//                         if(!confirm(`Remove ${m} from selector? Data is NOT deleted.`))return;
//                         const curMO=(monthConfig?.MO||MO).filter(x=>x!==m);
//                         const curIdx=monthConfig?.currentIdx??10;
//                         const newIdx=curIdx>i?curIdx-1:curIdx;
//                         if(saveMonthConfig) saveMonthConfig({MO:curMO,currentIdx:Math.min(newIdx,curMO.length-1)});
//                       }} style={{background:'none',border:'none',color:'#f87171',cursor:'pointer',padding:2}}>
//                         <Trash2 size={12}/>
//                       </button>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//             <button className="btn" style={{marginTop:12,fontSize:11,color:'var(--t3)'}} onClick={()=>{
//               if(!confirm('Reset months to default (Jul-25 → Dec-26)?'))return;
//               const def=['Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26','Jun-26','Jul-26','Aug-26','Sep-26','Oct-26','Nov-26','Dec-26'];
//               if(saveMonthConfig) saveMonthConfig({MO:def,currentIdx:10,label:'May 2026',short:'May'});
//             }}>Reset to Default</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdminPanel;




// sample confrigaruon

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronRight, Users, Target, Award, Activity, RefreshCw, Calendar, Plus, Trash2, Check, LogIn, UserPlus, ChevronDown, ShieldCheck, Shield, Edit3, Settings, BarChart3, PieChart, ToggleRight, History, Tag, Package } from 'lucide-react';
import { PageHead } from '../collections/ui';
import { MO as MO_CONST } from '../constants';
import { pct, spct, pclr, monthTarget } from '../utils';
import { useMonth } from '../context';
import { Avatar, KPI, StatCard } from './UI';
import CategoryDrillChart from './CategoryDrillChart';
import SampleMasterTab from './SampleMasterTab';
import ManageCategories from './ManageCategories';
import PermissionsMatrix from './PermissionsMatrix';
import ActivityLog from './ActivityLog';
import UserManagement from './UserManagement';
import CategoryFilter from './CategoryFilter';
import { useGlobalCategoryFilter } from '../hooks/useGlobalCategoryFilter';
import { api } from '../api';
import { notify, confirmDialog } from './Toast';
import { SHEET_SYNC_ENABLED } from '../featureFlags';


/**
 * FeatureSwitches — turn parts of the app on and off for everyone.
 *
 * Not the same thing as a user's permissions: this decides whether a feature
 * exists at all. Switching one off hides its menu entry for every user and
 * makes the server refuse its endpoints, so an old tab or the mobile app
 * can't keep using it.
 */
function FeatureSwitches() {
  const [features, setFeatures] = useState([]);
  const [off, setOff]          = useState(new Set());
  const [saved, setSaved]      = useState(new Set());
  const [busy, setBusy]        = useState(false);
  const [err, setErr]          = useState('');

  useEffect(() => {
    api.featuresGet()
      .then(r => {
        setFeatures(r?.features || []);
        const d = new Set(r?.disabled || []);
        setOff(d); setSaved(new Set(d));
      })
      .catch(e => setErr(e?.message || 'Could not load feature switches'));
  }, []);

  const dirty = off.size !== saved.size || [...off].some(k => !saved.has(k));

  const toggle = (id) => {
    const next = new Set(off);
    next.has(id) ? next.delete(id) : next.add(id);
    setOff(next);
  };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api.featuresSet([...off]);
      const d = new Set(r?.disabled || []);
      setOff(d); setSaved(new Set(d));
    } catch (e) { setErr(e?.message || 'Save failed'); }
    setBusy(false);
  };

  return (
    <div style={{maxWidth:760}}>
      <div style={{fontSize:12,color:'var(--t3)',marginBottom:14,lineHeight:1.6}}>
        Switch a feature off and it disappears from the menu for <b>everyone</b>, including you,
        and the server stops answering its requests. Switch it back on here at any time.
        Admin Panel is deliberately not in this list, so you can always get back.
      </div>

      {err && (
        <div style={{padding:'8px 12px',borderRadius:7,marginBottom:12,fontSize:12,
          background:'color-mix(in srgb, var(--red) 10%, transparent)',border:'1px solid color-mix(in srgb, var(--red) 33%, transparent)',color:'var(--red)'}}>{err}</div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',gap:8,marginBottom:16}}>
        {features.map(f => {
          const isOff = off.has(f.id);
          return (
            <label key={f.id} style={{
              display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',
              background: isOff ? 'color-mix(in srgb, var(--red) 7%, transparent)' : 'var(--bg2)',
              border:'1px solid '+(isOff ? 'color-mix(in srgb, var(--red) 35%, transparent)' : 'var(--b1)')}}>
              <input type="checkbox" className="adm-sw" checked={!isOff} onChange={()=>toggle(f.id)} style={{'--tone':'var(--grn)'}}/>
              <span style={{flex:1,fontSize:12.5,fontWeight:600,
                color: isOff ? 'var(--t3)' : 'var(--t1)',
                textDecoration: isOff ? 'line-through' : 'none'}}>{f.label}</span>
              <span style={{fontSize:10,fontWeight:700,letterSpacing:'.06em',
                color: isOff ? 'var(--red)' : 'var(--grn)'}}>{isOff ? 'OFF' : 'ON'}</span>
            </label>
          );
        })}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <button className="btnp" onClick={save} disabled={!dirty || busy}
          style={{opacity:(!dirty||busy)?0.5:1,cursor:(!dirty||busy)?'not-allowed':'pointer'}}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        {dirty && !busy && (
          <button className="btn" onClick={()=>setOff(new Set(saved))}>Cancel</button>
        )}
        <span style={{fontSize:11,color:'var(--t3)',marginLeft:'auto'}}>
          {saved.size === 0 ? 'Everything is on' : saved.size + ' feature' + (saved.size===1?'':'s') + ' switched off'}
        </span>
      </div>
    </div>
  );
}

const AdminPanel=({section,onSection,hideRail,modules=[],renderPage,dealers,users,setUsers,setShowUM,onSync,syncing,lastSync,syncErrs,onNavigate,onOpenDealer,monthConfig,saveMonthConfig,currentUser,onLoginAs,hasFeature,canLoginAs:canLoginAsProp})=>{
  // Each admin area is an action in Permissions; a tab shows only when the
  // person may actually do what is behind it (falls back to staff-only when
  // App has not passed the check, e.g. older mounts).
  const can = (k) => hasFeature ? !!hasFeature(k) : (currentUser?.role === 'admin' || currentUser?.role === 'superadmin');
  const {selectedMonthIdx, MO:ctxMO, viewIdx}=useMonth();
  const MO = monthConfig?.MO || ctxMO || MO_CONST;
  const selMoLabel=(MO[selectedMonthIdx]||MO[MO.length-1]||'').slice(0,3);
  // months of the chosen view cycle (oldest → newest), and newest-first for tables
  const vIdx=(viewIdx&&viewIdx.length?viewIdx:MO.map((_,i)=>i)).filter(i=>i<MO.length);
  const vRev=[...vIdx].reverse();
  const [tab,setTab]=useState(()=>section && !String(section).startsWith('sec:') ? section : (section ? 'features' : 'summary'));
  // open a section by its key: 'summary', 'sec:users', 'page:visits' …
  const openKey = (key) => {
    if (!key) return;
    if (key.startsWith('sec:')) { setTab('features'); setAdminSec(key.slice(4)); }
    else setTab(key);
  };
  // rail groups that are expanded on desktop (the one holding the open page always is)
  const [railGroups,setRailGroups]=useState(()=>new Set(['Overview','People & access']));
  const [phoneGroup,setPhoneGroup]=useState(null);
  const [newMonth,setNewMonth]=useState('');
  const [newMonthErr,setNewMonthErr]=useState('');
  // Trash icons next to each month are hidden by default — only revealed
  // when the user explicitly enters "Edit" mode. Prevents accidental
  // remove-month clicks while just browsing.
  const [monthsEditMode, setMonthsEditMode] = useState(false);
  const sms=Object.values(users).filter(u=>u.role==='salesman');

  // ── Login-as dropdown (superadmin only) ─────────────────────────────────
  // Which section of the Permissions hub is open.
  const [adminSec, setAdminSec] = useState(()=>section && String(section).startsWith('sec:') ? section.slice(4) : 'users');
  // land on the first section the person may open, not on a blank one
  const SEC_NEEDS = { users:'manageUsers', perms:'manageUsers', features:'manageFeatures', activity:'manageUsers', months:'manageMonths' };
  useEffect(() => {
    if (tab !== 'features') return;
    if (can(SEC_NEEDS[adminSec])) return;
    const first = Object.keys(SEC_NEEDS).find(k => can(SEC_NEEDS[k]));
    if (first) setAdminSec(first);
  }, [tab, adminSec, hasFeature]);
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isStaff      = isSuperAdmin || currentUser?.role === 'admin';
  // "Login as" is for superadmins and for anyone explicitly granted the action
  const canLoginAs   = canLoginAsProp !== undefined ? !!canLoginAsProp : (isSuperAdmin || (Array.isArray(currentUser?.permissions?.features) && currentUser.permissions.features.includes('loginAs')));
  const [laOpen, setLaOpen]   = useState(false);
  const [laBusy, setLaBusy]   = useState(false);
  const [laErr,  setLaErr]    = useState(null);
  const laRef = useRef(null);
  // Close dropdown on outside click
  useEffect(()=>{
    if(!laOpen) return;
    const onDoc = (e) => { if(laRef.current && !laRef.current.contains(e.target)) setLaOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return ()=>document.removeEventListener('mousedown', onDoc);
  },[laOpen]);

  // Users available for impersonation: everyone except yourself.
  const impersonableUsers = useMemo(()=>{
    const all = Object.values(users || {});
    // Sort: salesman first (most common), then admin, then superadmin
    const order = { salesman:0, admin:1, superadmin:2 };
    return all
      .filter(u => u.id !== currentUser?.id && u.active !== false && (isSuperAdmin || u.role !== 'superadmin'))
      .sort((a,b)=>{
        const r = (order[a.role]??9) - (order[b.role]??9);
        if(r !== 0) return r;
        return (a.name||'').localeCompare(b.name||'');
      });
  },[users, currentUser]);

  const doLoginAs = async (uid, name) => {
    if(laBusy) return;
    const okLA = await confirmDialog({
      title: 'Login as ' + name + '?',
      message: 'You will see exactly what they see. Use the yellow banner at the top to return to your own account at any time.',
      confirmText: 'Login as ' + name,
    });
    if(!okLA) return;
    setLaBusy(true); setLaErr(null);
    try {
      const res = await api.impersonate(uid);
      onLoginAs?.(res.token, res.user, {
        id:    currentUser.id,
        name:  currentUser.name,
        ini:   currentUser.ini,
        color: currentUser.color,
      });
      setLaOpen(false);
    } catch(e){
      setLaErr(e.message || 'Login-as failed');
    } finally { setLaBusy(false); }
  };
  // ── Global category filter applied to this month's achieved per dealer ──
  // Same logic Overview uses: pull dealer × category breakdown from /api/sales,
  // subtract excluded categories' qty from each dealer's current-month achieved,
  // then drive all KPIs / compare chart / per-salesman cards from that.
  // The `dealers` we receive are ALREADY category-filtered across every month
  // (App applies the global category filter via useAllMonthsCategoryFilteredDealers),
  // so we just read the (already-adjusted) months here. This keeps the KPIs, the
  // compare chart AND each salesman's monthly history all consistent with the
  // selected categories.
  // Smart per-month target — see utils.monthTarget.
  const dealersForMonth=useMemo(()=>dealers.map(d=>({
    ...d,
    achieved: d.months[selectedMonthIdx]||0,
    target: monthTarget(d, selectedMonthIdx),
  })),[dealers, selectedMonthIdx]);

  const tt=dealersForMonth.reduce((s,x)=>s+x.target,0),ta=dealersForMonth.reduce((s,x)=>s+x.achieved,0);
  // "Active" is a performance statement, so it reads the calculated tier.
  // This used to match ACTIVE / ACHIVERS / KEY ACCOUNT on `status` — after the
  // stale sheet values were cleared, ACTIVE no longer exists there and the
  // count silently became 'dealers a rep tagged Key Account'.
  const ACTIVE_TIERS=['TOP PERFORMER','PRIORITY ACCOUNT','RISING STAR','ACTIVE'];
  const active=dealersForMonth.filter(x=>ACTIVE_TIERS.includes((x.perfStatus||'').toUpperCase())).length;
  // Month-aware attribution: month i of a dealer belongs to whoever owned the
  // dealer THAT month (stamped on reassignment), not the current owner. A
  // salesman who received a dealer mid-year gets credit only from the handover
  // month; the predecessor keeps the earlier months on their own card.
  const ownerOf=(d,i)=>d.monthSalesman?.[i]||d.salesman;

  // Only the salesmen who have something in the month being viewed.
  //
  // A rep whose dealers were handed over shows an empty card for every later
  // month — 0 dealers, 0 target, 0 achieved — which is noise in the grid and
  // an empty column in the chart. Attribution is per-month (see ownerOf), so
  // stepping back to a month they actually worked brings them straight back;
  // nothing is deleted, it is only hidden where there is nothing to show.
  //
  // "Something" is deliberately generous: any dealer attributed that month, or
  // any target, or any achieved. A rep with dealers who simply sold nothing
  // still appears — that is a result worth seeing, not an absence.
  const activeInMonth = (sm) => {
    const sd = dealersForMonth.filter(d => ownerOf(d, selectedMonthIdx) === sm.id);
    if (sd.length) return true;
    return sd.reduce((a,x)=>a+x.target,0) > 0 || sd.reduce((a,x)=>a+x.achieved,0) > 0;
  };
  const smsActive = sms.filter(activeInMonth);
  const smsHidden = sms.length - smsActive.length;
  const compareData=smsActive.map(s=>{const sd=dealersForMonth.filter(d=>ownerOf(d,selectedMonthIdx)===s.id);return{name:s.name,Target:sd.reduce((a,x)=>a+x.target,0),Achieved:sd.reduce((a,x)=>a+x.achieved,0),smId:s.id,color:s.color};});

  // ── Section rail ──────────────────────────────────────────────────────
  // Pure navigation: every item maps onto the tab / adminSec state that
  // already existed, and is shown under exactly the same checks as before.
  const userCount = Object.keys(users || {}).length;
  const monthCount = (monthConfig?.MO || MO).length;
  const RAIL = buildAdminRail({ can, isStaff, modules, userCount, monthCount })
    .map(g => ({ ...g, items: g.items.map(it => ({ ...it, go: () => openKey(it.key) })) }));
  const activeKey = tab === 'features' ? 'sec:' + adminSec : tab;
  // the left menu picks the section; tell it back what is open so it highlights
  useEffect(() => { if (section && section !== activeKey) openKey(section); }, [section]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (onSection && activeKey !== section) onSection(activeKey); }, [activeKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeItem = RAIL.flatMap(g => g.items).find(i => i.key === activeKey);
  const activeGroup = (RAIL.find(g => g.items.some(i => i.key === activeKey)) || RAIL[0] || {}).group;
  const shownGroup = railGroups.has(activeGroup) ? railGroups : new Set([...railGroups, activeGroup]);

  return(
    <div className="fade adm">
      <style>{ADM_CSS}</style>
      <PageHead icon={Settings} tone="var(--acc)"
        eyebrow={`${isSuperAdmin?'Superadmin':'Admin'} · ${MO[selectedMonthIdx]}`}
        title="Control Panel"
        sub="People, access, data and performance — all in one place"
        right={<>

          {/* ── Login as ▼ — superadmin or granted the loginAs action ── */}
          {canLoginAs && (
            <div ref={laRef} style={{position:'relative'}}>
              <button onClick={()=>setLaOpen(o=>!o)} className="btn"
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:'color-mix(in srgb, var(--yel) 10%, transparent)',
                  border:'1px solid color-mix(in srgb, var(--yel) 35%, transparent)',
                  color:'var(--yel)', fontWeight:700,
                }}
                title="Quick-switch into another account">
                <LogIn size={13}/> Login as
                <ChevronDown size={12} style={{
                  transform: laOpen?'rotate(180deg)':'rotate(0)',
                  transition:'transform .15s',
                }}/>
              </button>
              {laOpen && (
                <div style={{
                  position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:50,
                  background:'var(--bg2)', border:'1px solid var(--b2)',
                  borderRadius:8, minWidth:240, maxHeight:360, overflowY:'auto',
                  boxShadow:'0 10px 30px rgba(0,0,0,0.45)',
                  padding:6,
                }}>
                  <div style={{
                    fontSize:9, color:'var(--t3)', letterSpacing:'.12em',
                    textTransform:'uppercase', padding:'6px 10px 4px',
                  }}>Pick a user</div>
                  {laErr && (
                    <div style={{
                      fontSize:11, color:'var(--red)', padding:'6px 10px',
                      background:'color-mix(in srgb, var(--red) 10%, transparent)',
                      border:'1px solid color-mix(in srgb, var(--red) 45%, transparent)', borderRadius:6, margin:'4px 6px',
                    }}>{laErr}</div>
                  )}
                  {impersonableUsers.length === 0 && (
                    <div style={{fontSize:11, color:'var(--t3)', padding:'10px'}}>No other users yet.</div>
                  )}
                  {impersonableUsers.map(u => {
                    const isSA = u.role === 'superadmin';
                    const isAd = u.role === 'admin';
                    const RoleIcon = isSA ? ShieldCheck : isAd ? Shield : null;
                    const roleColor = isSA ? 'var(--yel)' : isAd ? 'var(--acc)' : 'var(--grn)';
                    return (
                      <div key={u.id}
                        onClick={()=>doLoginAs(u.id, u.name)}
                        style={{
                          display:'flex', alignItems:'center', gap:8,
                          padding:'8px 10px', borderRadius:6, cursor: laBusy?'wait':'pointer',
                          opacity: laBusy?0.6:1,
                        }}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg1)'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <Avatar user={u} size={26}/>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:6}}>
                            <span style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{u.name}</span>
                            {RoleIcon && <RoleIcon size={10} style={{color:roleColor, flexShrink:0}}/>}
                          </div>
                          <div style={{fontSize:10, color:'var(--t3)'}}>{u.id} · <span style={{color:roleColor}}>{u.role}</span></div>
                        </div>
                        <LogIn size={12} style={{color:'var(--yel)', flexShrink:0}}/>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Users now live in the Permissions tab alongside what they may
              see and do. This jumps there rather than opening a second copy
              in a modal — two ways in was the thing worth removing. */}
          {isStaff && (
            <button onClick={()=>{ setTab('features'); setAdminSec('users'); }} className="btn"
              style={{display:'flex',alignItems:'center',gap:6}}
              title="Create a user, change roles, reset passwords, set permissions">
              <UserPlus size={13}/> Add / Manage Users
            </button>
          )}

          {/* ── Global Category Filter ───────────────────────────────── */}
          <AdminCategoryFilterButton dealers={dealers} selectedMonthIdx={selectedMonthIdx} MO={MO}/>

          {/* ── Sync sheets (admin & superadmin) ─────────────────────── */}
          {SHEET_SYNC_ENABLED && <button onClick={onSync} className="btnp" style={{display:'flex',alignItems:'center',gap:8}} disabled={syncing}><RefreshCw size={13} className={syncing?'spin':''}/> {syncing?'Syncing...':'Sync Sheets'}</button>}
        </>} />
      <div className={"adm-shell" + (hideRail ? " norail" : "")}>
        {/* ── Section rail: vertical on desktop, a scrolling pill bar on a phone ── */}
        {/* phones: pick the group first, then its sections */}
        <div className="adm-gtabs">
          {RAIL.map(g => (
            <button key={g.group} className={'thr' + ((phoneGroup||activeGroup) === g.group ? ' on' : '')} style={{'--tone':'var(--acc)'}}
              onClick={()=>setPhoneGroup(g.group)}>{g.group}<i>{g.items.length}</i></button>
          ))}
        </div>
        <nav className="adm-rail card" aria-label="Admin sections">
          {RAIL.map(g => {
            const open = shownGroup.has(g.group);
            const hasOn = g.items.some(i => i.key === activeKey);
            return (
            <React.Fragment key={g.group}>
              <button className={'adm-grp' + (open ? ' open' : '')} disabled={hasOn}
                onClick={()=>setRailGroups(prev => { const n = new Set(prev); n.has(g.group) ? n.delete(g.group) : n.add(g.group); return n; })}>
                <span>{g.group}</span>
                {!open && <span className="adm-grp-n">{g.items.length}</span>}
                {!hasOn && <ChevronRight size={12} className="adm-grp-chev"/>}
              </button>
              {g.items.map(it => {
                const on = it.key === activeKey;
                const Ico = it.icon;
                const cls = (open ? '' : ' dk-hide') + ((phoneGroup||activeGroup) === g.group ? '' : ' ph-hide');
                return (
                  <button key={it.key} className={'adm-it' + (on ? ' on' : '') + cls} style={{'--tone':it.tone}}
                    onClick={()=>{ it.go(); setPhoneGroup(null); }} title={it.desc} aria-current={on ? 'page' : undefined}>
                    <span className="adm-ico"><Ico size={15}/></span>
                    <span className="adm-lbl">{it.label}</span>
                    {it.n !== undefined && <span className="adm-n">{it.n}</span>}
                  </button>
                );
              })}
            </React.Fragment>
            );
          })}
        </nav>

        <div className="adm-main">
          {activeItem?.page && renderPage && (
            <div className="adm-embed">{renderPage(tab.slice(5))}</div>
          )}
          {activeItem && !activeItem.page && activeKey !== 'samples' && (
            <div className="adm-sechead" style={{'--tone':activeItem.tone}}>
              <span className="adm-sechead-ico"><activeItem.icon size={18}/></span>
              <div style={{minWidth:0}}>
                <div style={{fontSize:16, fontWeight:800, color:'var(--t1)', letterSpacing:'-.01em'}}>{activeItem.label}</div>
                <div style={{fontSize:12, color:'var(--t3)'}}>{activeItem.desc}</div>
              </div>
            </div>
          )}
      {tab==='summary'&&(
        <>
          <div className="adm-kpis">
            {[
              { label:'Total dealers',          value:dealers.length, sub:`${active} active`,        icon:Users,    tone:'var(--acc)' },
              { label:`${selMoLabel} target`,   value:tt,             sub:MO[selectedMonthIdx],      icon:Target,   tone:'#3b82f6' },
              { label:`${selMoLabel} achieved`, value:ta,             sub:MO[selectedMonthIdx],      icon:Award,    tone:'#10b981' },
              { label:'Overall achievement',    value:spct(tt,ta),    sub:'achieved ÷ target',       icon:Activity, tone:pclr(pct(tt,ta)), p:pct(tt,ta) },
            ].map(k => (
              <div key={k.label} className="adm-kpi" style={{'--tone':k.tone}}>
                <span className="adm-kpi-ico"><k.icon size={19}/></span>
                <div style={{minWidth:0, flex:1}}>
                  <div className="adm-kpi-lbl">{k.label}</div>
                  <div className="adm-kpi-n">{k.value}</div>
                  {k.p !== undefined
                    ? <div className="pbar" style={{width:'100%', marginLeft:0, marginTop:6}}><div style={{width:Math.min(k.p||0,100)+'%', background:k.tone}}/></div>
                    : <div style={{fontSize:11, color:'var(--t3)', marginTop:2}}>{k.sub}</div>}
                </div>
              </div>
            ))}
          </div>
          <div className="card" style={{marginBottom:16}}>
            <div className="sec-title" style={{marginBottom:14}}><span className="sec-ico" style={{'--tone':'var(--grn)'}}><Target size={15}/></span> Target vs Achieved by Salesman <span className="sec-note">{MO[selectedMonthIdx]} · click a bar to open their dealers</span></div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={compareData} margin={{top:24,right:20,bottom:5,left:0}}>
                <defs>
                  <linearGradient id="apTgt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.55}/></linearGradient>
                  <linearGradient id="apAch" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={1}/><stop offset="100%" stopColor="#10b981" stopOpacity={0.55}/></linearGradient>
                </defs>
                <CartesianGrid vertical={false}/>
                <XAxis dataKey="name" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false} width={44}/>
                <Tooltip/><Legend wrapperStyle={{fontSize:12}} iconType="circle" iconSize={8}/>
                <Bar dataKey="Target" fill="url(#apTgt)" radius={[8,8,0,0]} maxBarSize={46} label={{position:'top',fill:'#3b82f6',fontSize:11,fontWeight:700}} style={{cursor:'pointer'}} onClick={d=>onNavigate('dealers',{sm:d.smId})}/>
                <Bar dataKey="Achieved" fill="url(#apAch)" radius={[8,8,0,0]} maxBarSize={46} label={{position:'top',fill:'#10b981',fontSize:11,fontWeight:700}} style={{cursor:'pointer'}} onClick={d=>onNavigate('dealers',{sm:d.smId})}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="sec-title">
            <span className="sec-ico" style={{'--tone':'var(--acc)'}}><Users size={15}/></span> Salesmen <span className="count-pill">{smsActive.length}</span>
            <span className="sec-note">{MO[selectedMonthIdx]}</span>
          </div>
          {smsHidden > 0 && (
            <div style={{fontSize:11.5, color:'var(--t3)', marginBottom:10}}>
              {smsHidden} salesman{smsHidden===1?'':'en'} hidden — nothing recorded for {MO[selectedMonthIdx]}.
              Pick an earlier month to see them.
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(280px,100%),1fr))',gap:14,marginBottom:16}}>
            {smsActive.map(s=>{
              const sd=dealersForMonth.filter(d=>ownerOf(d,selectedMonthIdx)===s.id);
              const ownedNow=dealersForMonth.filter(d=>d.salesman===s.id).length;
              const st=sd.reduce((a,x)=>a+x.target,0),sa=sd.reduce((a,x)=>a+x.achieved,0),sp=pct(st,sa);
              // Sparkline: each month sums the dealers this salesman owned
              // THAT month (per-month attribution). The selected month uses
              // the filtered achieved so the bar matches the KPI card.
              const mT=MO.map((_,i)=>{
                if (i === selectedMonthIdx) {
                  return sd.reduce((a,x)=>a+x.achieved,0);
                }
                return dealers.reduce((a,d)=>ownerOf(d,i)===s.id?a+(d.months[i]||0):a,0);
              });
              return(
                <div key={s.id} className="att-card" style={{'--tone':pclr(sp),padding:'14px 16px 12px 18px'}}
                  onClick={()=>onNavigate('dealers',{sm:s.id})}>
                  <div className="row" style={{marginBottom:10,flexWrap:'nowrap'}}>
                    <span className="ini" style={{'--h':(s.name||'?').charCodeAt(0)*37%360,width:38,height:38,borderRadius:12,fontSize:12.5}}>{(s.name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span>
                    <div style={{minWidth:0,flex:1}}>
                      <div style={{fontSize:14.5,fontWeight:750,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                      <div style={{fontSize:11,color:'var(--t3)'}}>{ownedNow} dealers · {sd.length} in {selMoLabel}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={{fontSize:22,fontWeight:850,color:pclr(sp),letterSpacing:'-.02em',lineHeight:1}}>{spct(st,sa)}</div>
                      <div style={{fontSize:9.5,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginTop:3}}>achieved</div>
                    </div>
                  </div>
                  {st>0&&<div className="pbar" style={{width:'100%',marginLeft:0,marginBottom:10,height:6}}><div style={{width:Math.min(sp||0,100)+'%',background:pclr(sp)}}/></div>}
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6,marginBottom:10}}>
                    <KPI label={`${selMoLabel} Target`} value={st}/>
                    <KPI label={`${selMoLabel} Achieved`} value={sa} color="#10b981"/>
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={vIdx.map(i=>({m:MO[i].slice(0,3),v:mT[i]||0}))} margin={{top:14,right:0,bottom:0,left:0}}>
                      <XAxis dataKey="m" tick={{fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={14}/>
                      <Tooltip formatter={v=>[v,'Achieved']} cursor={false}/>
                      <Bar dataKey="v" radius={[4,4,0,0]} maxBarSize={18}>
                        {vIdx.map(idx=>(<Cell key={idx} fill={idx===selectedMonthIdx?'#f59e0b':s.color}/>))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })}
          </div>
        </>
      )}
      {tab==='compare'&&(
        <div className="card">
          <div className="sec-title" style={{marginBottom:14}}><span className="sec-ico" style={{'--tone':'var(--pur)'}}><Calendar size={15}/></span> All Salesmen — Month by Month</div>
          <div className="scroll">
            <table>
              <thead>
                <tr><th>Salesman</th>{vRev.map(i=>{return<th key={i} style={{textAlign:'right',background:i===selectedMonthIdx?'color-mix(in srgb, var(--acc) 8%, transparent)':'var(--bg1)'}}>{MO[i]}</th>;})}<th style={{textAlign:'right'}}>Tgt</th><th style={{textAlign:'right'}}>Ach</th><th style={{textAlign:'right'}}>%</th></tr>
              </thead>
              <tbody>
                {smsActive.map(s=>{
                  const sd=dealersForMonth.filter(d=>ownerOf(d,selectedMonthIdx)===s.id);
                  const st=sd.reduce((a,x)=>a+x.target,0),sa=sd.reduce((a,x)=>a+x.achieved,0);
                  const mT=MO.map((_,i)=>dealers.reduce((a,d)=>ownerOf(d,i)===s.id?a+(d.months[i]||0):a,0));
                  return(
                    <tr key={s.id} onClick={()=>onNavigate('dealers',{sm:s.id})} style={{cursor:'pointer'}}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:9,minWidth:0}}>
                          <span className="ini" style={{'--h':(s.name||'?').charCodeAt(0)*37%360}}>{(s.name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span>
                          <div style={{minWidth:0}}><div style={{fontWeight:700,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis'}}>{s.name}</div><div style={{fontSize:10.5,color:'var(--t3)'}}>{sd.length} dealers · {MO[selectedMonthIdx]}</div></div>
                        </div>
                      </td>
                      {vRev.map(i=>{const v=mT[i];return<td key={i} style={{textAlign:'right',color:i===selectedMonthIdx?'var(--yel)':'var(--t2)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'color-mix(in srgb, var(--yel) 5%, transparent)':'transparent'}}>{v||'—'}</td>;})}
                      <td style={{textAlign:'right'}}>{st}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:'var(--grn)'}}>{sa}</td>
                      <td style={{textAlign:'right',minWidth:92}}>
                        <div style={{fontWeight:800,color:pclr(pct(st,sa))}}>{spct(st,sa)}</div>
                        {st>0&&<div className="pbar"><div style={{width:Math.min(pct(st,sa)||0,100)+'%',background:pclr(pct(st,sa))}}/></div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab==='category'&&<CategoryDrillChart dealers={dealers} selectedMonthIdx={selectedMonthIdx} onNavigate={onNavigate}/>}

      {tab==='samples'&&(
        <div style={{padding:'4px 0'}}>
          <SampleMasterTab/>
        </div>
      )}
      {tab==='cats'&&(
        <div style={{padding:'4px 0'}}>
          <ManageCategories currentUser={currentUser}/>
        </div>
      )}

      {tab==='features'&&isStaff&&(
        <div>
          {/* Four questions that belong together: who exists, what they may
              see and do, what the company has switched on, and what everyone
              actually did. The section rail on the left picks which one. */}
          {adminSec==='users' && can('manageUsers') && (
            <UserManagement users={users} setUsers={setUsers} currentUser={currentUser}
              onClose={()=>{}} onLoginAs={onLoginAs} canLoginAs={canLoginAs} inline/>
          )}
          {adminSec==='perms' && can('manageUsers') && (
            <PermissionsMatrix setUsers={setUsers} currentUser={currentUser}/>
          )}
          {adminSec==='features' && can('manageFeatures') && (
            <div className="card">
              <div className="sec-title" style={{marginBottom:8}}><span className="sec-ico" style={{'--tone':'var(--yel)'}}><ToggleRight size={15}/></span> Available features</div>
              <FeatureSwitches/>
            </div>
          )}
          {adminSec==='activity' && can('manageUsers') && <ActivityLog/>}
        </div>
      )}
      {tab==='features'&&isStaff&&can('manageMonths')&&adminSec==='months'&&(
        <div className="fade">
          <div style={{fontSize:13,color:'var(--t3)',marginBottom:14}}>Control which months appear in the app. Changes apply instantly — no code editing needed.</div>

          {/* Current Month */}
          <div className="card" style={{marginBottom:14}}>
            <div className="sec-title" style={{marginBottom:10}}>
              <span className="sec-ico" style={{'--tone':'var(--acc)'}}><Calendar size={15}/></span> Set Current Month
            </div>
            <div style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>Click any month to make it the current/default month shown everywhere.</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {(monthConfig?.MO||MO).map((m,i)=>{
                const isCurrent=i===(monthConfig?.currentIdx??10);
                return(
                  <button key={m} onClick={()=>{
                    const fullMap={Jan:'January',Feb:'February',Mar:'March',Apr:'April',May:'May',Jun:'June',Jul:'July',Aug:'August',Sep:'September',Oct:'October',Nov:'November',Dec:'December'};
                    const [mon,yr]=m.split('-');
                    if(saveMonthConfig) saveMonthConfig({currentIdx:i,label:`${fullMap[mon]||mon} 20${yr}`,short:mon});
                  }} style={{
                    padding:'5px 12px',borderRadius:6,fontSize:12,cursor:'pointer',
                    border:`1.5px solid ${isCurrent?'var(--acc)':'var(--b2)'}`,
                    background:isCurrent?'var(--accL)':'var(--bg2)',
                    color:isCurrent?'var(--acc)':'var(--t2)',
                    fontWeight:isCurrent?700:400,
                    display:'flex',alignItems:'center',gap:4,
                  }}>
                    {isCurrent&&<Check size={10}/>}{m}
                  </button>
                );
              })}
            </div>
            <div style={{marginTop:10,fontSize:11,color:'var(--t3)'}}>
              Current: <strong style={{color:'var(--acc)'}}>{monthConfig?.label||'May 2026'}</strong>
            </div>
          </div>

          {/* Add Month */}
          <div className="card" style={{marginBottom:14}}>
            <div className="sec-title" style={{marginBottom:10}}>
              <span className="sec-ico" style={{'--tone':'var(--grn)'}}><Plus size={15}/></span> Add Month
            </div>
            <div style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>Format: <strong>Jun-26</strong>, <strong>Jul-26</strong>, <strong>Aug-26</strong></div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
              <input className="inp" style={{width:110}} placeholder="e.g. Jun-26"
                value={newMonth} onChange={e=>{setNewMonth(e.target.value);setNewMonthErr('');}}
                onKeyDown={e=>{
                  if(e.key==='Enter'){
                    const m=newMonth.trim();
                    if(!m){setNewMonthErr('Enter a month');return;}
                    if(!/^[A-Za-z]{3}-\d{2}$/.test(m)){setNewMonthErr('Format: Jun-26');return;}
                    const curMO=monthConfig?.MO||MO;
                    if(curMO.includes(m)){setNewMonthErr('Already exists');return;}
                    if(saveMonthConfig) saveMonthConfig({MO:[...curMO,m]});
                    setNewMonth('');setNewMonthErr('');
                  }
                }}
              />
              <button className="btnp" onClick={()=>{
                const m=newMonth.trim();
                if(!m){setNewMonthErr('Enter a month');return;}
                if(!/^[A-Za-z]{3}-\d{2}$/.test(m)){setNewMonthErr('Format: Jun-26');return;}
                const curMO=monthConfig?.MO||MO;
                if(curMO.includes(m)){setNewMonthErr('Already exists');return;}
                if(saveMonthConfig) saveMonthConfig({MO:[...curMO,m]});
                setNewMonth('');setNewMonthErr('');
              }} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                <Plus size={12}/> Add
              </button>
              <button className="btn" style={{fontSize:12}} onClick={()=>{
                const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const curMO=monthConfig?.MO||MO;
                const last=curMO[curMO.length-1];
                const [mon,yr]=last.split('-');
                let mi=months.indexOf(mon),y=parseInt(yr);
                const toAdd=[];
                for(let j=0;j<6;j++){
                  mi++;if(mi>=12){mi=0;y++;}
                  const nm=`${months[mi]}-${String(y).padStart(2,'0')}`;
                  if(!curMO.includes(nm))toAdd.push(nm);
                }
                if(toAdd.length&&saveMonthConfig) saveMonthConfig({MO:[...curMO,...toAdd]});
              }}>+ Next 6 Months</button>
              {newMonthErr&&<span style={{fontSize:11,color:'var(--red)'}}>{newMonthErr}</span>}
            </div>
          </div>

          {/* All months list */}
          <div className="card">
            <div className="sec-title">
              <span className="sec-ico" style={{'--tone':'var(--acc)'}}><Calendar size={15}/></span> All Months ({(monthConfig?.MO||MO).length})
              <div style={{flex:1}}/>
              <button
                onClick={()=>setMonthsEditMode(v=>!v)}
                className="btn"
                title={monthsEditMode ? 'Hide trash icons' : 'Show trash icons so you can remove months'}
                style={{
                  fontSize:11, padding:'4px 10px',
                  display:'flex', alignItems:'center', gap:5,
                  background: monthsEditMode ? 'color-mix(in srgb, var(--red) 10%, transparent)' : 'transparent',
                  borderColor: monthsEditMode ? 'color-mix(in srgb, var(--red) 45%, transparent)' : 'var(--b2)',
                  color: monthsEditMode ? 'var(--red)' : 'var(--t2)',
                }}>
                {monthsEditMode ? (<><Check size={12}/> Done</>) : (<><Edit3 size={12}/> Manage</>)}
              </button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:8}}>
              {(monthConfig?.MO||MO).map((m,i)=>{
                const isCurrent=i===(monthConfig?.currentIdx??10);
                return(
                  <div key={m} style={{
                    display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'8px 12px',borderRadius:8,
                    background:isCurrent?'var(--accL)':'var(--bg2)',
                    border:`1px solid ${isCurrent?'var(--acc)':'var(--b2)'}`,
                  }}>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:isCurrent?'var(--acc)':'var(--t1)'}}>{m}</div>
                      {isCurrent&&<div style={{fontSize:9,color:'var(--acc)'}}>CURRENT</div>}
                    </div>
                    {/* Trash icon only visible when user clicked "Manage" */}
                    {!isCurrent && monthsEditMode &&(
                      <button onClick={async ()=>{
                        const curIdx=monthConfig?.currentIdx??10;
                        // A "future" month sits at an index after the current
                        // month. For those we actually DELETE the data so a
                        // re-add later starts clean. For past months we keep
                        // the safer "hide only" behaviour.
                        const isFuture = i > curIdx;
                        const ok = await confirmDialog({
                          title: (isFuture?'Delete future month ':'Remove ') + m + (isFuture?'?':' from selector?'),
                          message: isFuture
                            ? 'This will permanently DELETE ' + m + ' data from every dealer in the database. If you add ' + m + ' back later, it will start empty.'
                            : 'Data is NOT deleted — just hidden from the selector. You can re-add ' + m + ' later and the old data will still be there.',
                          confirmText: isFuture ? 'Delete ' + m : 'Hide ' + m,
                          danger: true,
                        });
                        if(!ok) return;
                        try {
                          if(isFuture){
                            const res = await api.deleteMonth(m);
                            notify.success('Deleted ' + m + ' from ' + (res?.dealersTouched ?? 0) + ' dealers');
                          } else {
                            notify.info(m + ' hidden from selector (data kept)');
                          }
                        } catch(err){
                          notify.error('Failed to delete ' + m + ': ' + err.message);
                          return;
                        }
                        const curMO=(monthConfig?.MO||MO).filter(x=>x!==m);
                        const newIdx=curIdx>i?curIdx-1:curIdx;
                        if(saveMonthConfig) saveMonthConfig({MO:curMO,currentIdx:Math.min(newIdx,curMO.length-1)});
                      }} style={{background:'none',border:'none',color:'var(--red)',cursor:'pointer',padding:2}}
                      title={i > (monthConfig?.currentIdx??10) ? 'Delete future month (data + slot)' : 'Hide from selector (keeps data)'}>
                        <Trash2 size={12}/>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn" style={{marginTop:12,fontSize:11,color:'var(--t3)'}} onClick={async ()=>{
              const ok = await confirmDialog({ title:'Reset months to default?', message:'Months will be reset to Jul-25 → Dec-26.', confirmText:'Reset' });
              if(!ok) return;
              const def=['Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26','Jun-26','Jul-26','Aug-26','Sep-26','Oct-26','Nov-26','Dec-26'];
              if(saveMonthConfig) saveMonthConfig({MO:def,currentIdx:10,label:'May 2026',short:'May'});
            }}>Reset to Default</button>
          </div>
        </div>
      )}

      {/* Sync — the same button as the header, plus what the last run said */}
      {tab==='sync'&&SHEET_SYNC_ENABLED&&(
        <div className="card">
          <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--grn)'}}><RefreshCw size={15}/></span> Sheet sync
            {lastSync && <span className="kpi-pill">Last run <b>{lastSync}</b></span>}
          </div>
          <div style={{fontSize:12.5, color:'var(--t2)', marginBottom:12}}>
            {lastSync ? 'Data was last pulled from the sheets at ' + lastSync + '.' : 'No sync has run in this session yet.'}
          </div>
          {Array.isArray(syncErrs) && syncErrs.length > 0 && (
            <div style={{display:'flex', flexDirection:'column', gap:6, marginBottom:12}}>
              {syncErrs.map((e,i)=>(
                <div key={i} style={{fontSize:12, padding:'7px 10px', borderRadius:8, color:'var(--red)',
                  background:'color-mix(in srgb, var(--red) 8%, transparent)', border:'1px solid color-mix(in srgb, var(--red) 30%, transparent)'}}>{String(e)}</div>
              ))}
            </div>
          )}
          <button onClick={onSync} className="btnp" style={{display:'inline-flex',alignItems:'center',gap:8}} disabled={syncing}>
            <RefreshCw size={13} className={syncing?'spin':''}/> {syncing?'Syncing...':'Sync Sheets'}
          </button>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

// Scoped styles for the admin console layout (rail + content, KPI tiles).

// Every admin section, grouped — shared by the console's own rail and the
// left menu's Admin Panel dropdown so both always list the same things,
// under exactly the checks the console used before.
export function buildAdminRail({ can, isStaff, modules = [], userCount = 0, monthCount = 0 }) {
  const RAIL = [
    { group:'Overview', items:[
      { key:'summary',  label:'Summary',          desc:'Targets, achievement and every salesman at a glance', icon:Activity, tone:'var(--acc)', show:true },
      { key:'compare',  label:'Salesman compare', desc:'Every salesman, month by month',                     icon:BarChart3, tone:'var(--pur)', show:true },
      { key:'category', label:'Category drill',   desc:'Sales broken down by category',                      icon:PieChart, tone:'#06b6d4', show:true },
    ]},
    { group:'People & access', items:[
      { key:'sec:users',    label:'Users',       desc:'Accounts, passwords, region scope',               icon:Users,       tone:'var(--acc)', n:userCount, show:isStaff && can('manageUsers') },
      { key:'sec:perms',    label:'Permissions', desc:'Which screens and actions each person gets',      icon:ShieldCheck, tone:'var(--grn)', show:isStaff && can('manageUsers') },
      { key:'sec:features', label:'Features',    desc:'Switch parts of the app on or off for everyone',  icon:ToggleRight, tone:'var(--yel)', show:isStaff && can('manageFeatures') },
      { key:'sec:activity', label:'Activity',    desc:'Who changed what',                                icon:History,     tone:'var(--pur)', show:isStaff && can('manageUsers') },
    ]},
    { group:'Data', items:[
      { key:'cats',       label:'Categories',    desc:'Product categories and how they group',           icon:Tag,       tone:'#ec4899', show:can('manageCategories') },
      { key:'samples',    label:'Sample master', desc:'Samples handed out to dealers',                   icon:Package,   tone:'#06b6d4', show:can('manageSamples') },
      { key:'sec:months', label:'Months',        desc:'Which months the app shows, and which is current', icon:Calendar, tone:'var(--acc)', n:monthCount, show:isStaff && can('manageMonths') },
      { key:'sync',       label:'Sync',          desc:'Pull the latest data from the sheets',            icon:RefreshCw, tone:'var(--grn)', show:SHEET_SYNC_ENABLED },
    ]},
  ];
  // The app's own modules, opened inside the console. Only pages this person
  // can already open appear (App passes them pre-filtered by the same rule as
  // the menu), and each renders exactly as it does on its own screen.
  const MOD_GROUPS = [
    { group:'CRM',         ids:['visits','calendar','tasks','followups','attendance','leaves'] },
    { group:'Reports',     ids:['reports','coverage','leads'] },
    { group:'Incentives',  ids:['incentiveHome','incentive','incentiveUpload','incentiveHistory','incentiveRule','salesIncentive','salesIncentiveRule'] },
    { group:'Collections', ids:['colDashboard','colToday','colOutstanding','colPayments','colFollowups','colImports','colReconciliation','colReports','colEmployees','colSettings'] },
    { group:'Data',        ids:['entry','upload','months','salesUpload','producttx','sheets'] },
  ];
  const MOD_LABEL = {
    incentiveHome:'Billing · dashboard', incentive:'Billing · this month', incentiveUpload:'Billing · upload sheet',
    incentiveHistory:'Billing · history', incentiveRule:'Billing · rules', salesIncentive:'Sales incentive', salesIncentiveRule:'Sales incentive · rules',
    colDashboard:'Dashboard', months:'Month uploads', upload:'Upload data', reports:'Reports (sales)', colReports:'Reports',
  };
  const MOD_DESC = {
    visits:'Every visit, check-in photo and MOM', calendar:'Plan who visits which dealer, and when', coverage:'STAR / KEY ACCOUNT / ACHIEVER dealers nobody met this month', leads:'New prospects and where they stand',
    tasks:'Work handed to the team', followups:'Calls and reminders due on dealers', attendance:'Who checked in, and where', leaves:'Leave requests and approvals',
    incentiveHome:'Billing team points at a glance', incentive:'This month\'s billing incentive', incentiveUpload:'Upload the billing sheet',
    incentiveHistory:'Past months, person by person', incentiveRule:'How billing points are worked out',
    salesIncentive:'Salesman rupees earned this month', salesIncentiveRule:'How the sales incentive is worked out',
    colDashboard:'Money due, collected and promised', colToday:'Dealers to chase today', colOutstanding:'Who owes what, by age',
    colPayments:'Payments that came in', colFollowups:'Collection calls and promises', colImports:'Upload the outstanding statement',
    colReconciliation:'Match the statement against payments', colReports:'Collection reports', colEmployees:'Who collected how much', colSettings:'Collection rules and reminders',
    entry:'Type or bulk-upload each month\'s figures', upload:'Upload a month from a sheet', months:'Upload and check month data',
    salesUpload:'Category-wise sales upload', producttx:'Raw ERP product transactions', sheets:'Shared spreadsheets', reports:'Sales reports and downloads',
  };
  const byId = Object.fromEntries((modules||[]).map(m => [m.id, m]));
  MOD_GROUPS.forEach(mg => {
    const items = mg.ids.filter(id => byId[id]).map(id => ({
      key:'page:'+id, page:true, label:MOD_LABEL[id]||byId[id].label, desc:MOD_DESC[id]||'',
      icon:byId[id].icon||Settings, tone:byId[id].tone||'var(--acc)', show:true,
    }));
    if(!items.length) return;
    const g = RAIL.find(x => x.group === mg.group);
    if (g) g.items.push(...items); else RAIL.splice(RAIL.length-1, 0, { group:mg.group, items });
  });
  RAIL.forEach(g => { g.items = g.items.filter(i => i.show); });
  for (let k = RAIL.length-1; k >= 0; k--) if (!RAIL[k].items.length) RAIL.splice(k,1);
  return RAIL;
}

const ADM_CSS = `
  .adm-shell{display:grid;grid-template-columns:236px minmax(0,1fr);gap:18px;align-items:start}
  .adm-rail.card{position:sticky;top:12px;padding:10px;display:flex;flex-direction:column;gap:2px;min-width:0}
  .adm-grp{display:flex;align-items:center;gap:6px;width:100%;border:none;background:transparent;font-family:inherit;cursor:pointer;text-align:left;
    font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);padding:12px 10px 5px;border-radius:8px}
  .adm-grp:hover:not(:disabled){color:var(--t1)}
  .adm-grp:disabled{cursor:default;color:var(--acc)}
  .adm-grp span:first-child{flex:1}
  .adm-grp:first-child{padding-top:4px}
  .adm-grp-n{font-size:10px;letter-spacing:0;font-weight:800;color:var(--t3);background:var(--bg2);padding:0 7px;border-radius:10px}
  .adm-grp-chev{transition:transform .15s}
  .adm-grp.open .adm-grp-chev{transform:rotate(90deg)}
  .adm-gtabs{display:none}
  .adm-embed{min-width:0;animation:pageIn .25s ease}
  @media(min-width:861px){.adm-it.dk-hide{display:none}
    .adm-shell.norail{grid-template-columns:minmax(0,1fr)}
    .adm-shell.norail .adm-rail{display:none}}
  .adm-it{--tone:var(--acc);display:flex;align-items:center;gap:10px;width:100%;border:none;background:transparent;color:var(--t2);
    font-size:13px;font-weight:650;padding:6px 8px;border-radius:11px;cursor:pointer;text-align:left;transition:background .15s,color .15s;font-family:inherit}
  .adm-it:hover{background:var(--bg2);color:var(--t1)}
  .adm-ico{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;color:var(--t3);background:var(--bg2);transition:all .15s}
  .adm-it.on{background:color-mix(in srgb,var(--tone) 11%,transparent);color:var(--t1);font-weight:750}
  .adm-it.on .adm-ico{color:var(--tone);background:color-mix(in srgb,var(--tone) 20%,transparent)}
  .adm-lbl{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .adm-n{font-size:10.5px;font-weight:800;color:var(--t3);background:var(--bg2);padding:1px 8px;border-radius:20px}
  .adm-it.on .adm-n{color:var(--tone);background:color-mix(in srgb,var(--tone) 16%,transparent)}
  .adm-main{min-width:0}
  .adm-sw{appearance:none;-webkit-appearance:none;margin:0;width:34px;height:20px;border-radius:20px;background:var(--bg3);border:1px solid var(--b2);position:relative;cursor:pointer;flex-shrink:0;transition:background .15s,border-color .15s}
  .adm-sw::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--bg1);box-shadow:0 1px 3px rgba(16,24,40,.3);transition:transform .15s}
  .adm-sw:checked{background:var(--tone,var(--acc));border-color:var(--tone,var(--acc))}
  .adm-sw:checked::after{transform:translateX(14px)}
  .adm-sechead{display:flex;align-items:center;gap:12px;margin-bottom:14px}
  .adm-sechead-ico{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
  .adm-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px}
  .adm-kpi{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:16px;background:var(--bg1);border:1px solid var(--b1);box-shadow:var(--shadow);min-width:0}
  .adm-kpi-ico{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
  [data-tone="dark"] .adm-kpi-ico,[data-tone="dark"] .adm-sechead-ico{background:color-mix(in srgb,var(--tone) 24%,transparent)}
  .adm-kpi-lbl{font-size:10.5px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.08em}
  .adm-kpi-n{font-size:24px;font-weight:850;line-height:1.1;letter-spacing:-.02em;color:var(--t1);margin-top:2px}
  @media(max-width:860px){
    .adm-shell{grid-template-columns:minmax(0,1fr);gap:12px}
    .adm-rail.card{position:static;flex-direction:row;overflow-x:auto;padding:6px;gap:6px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
    .adm-rail::-webkit-scrollbar{display:none}
    .adm-grp{display:none}
    .adm-it.ph-hide{display:none}
    .adm-gtabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin-bottom:-4px}
    .adm-gtabs::-webkit-scrollbar{display:none}
    .adm-gtabs .thr{white-space:nowrap;flex-shrink:0;display:inline-flex;align-items:center;gap:6px}
    .adm-gtabs .thr i{font-style:normal;font-size:10px;font-weight:800;opacity:.75}
    .adm-it{width:auto;flex-shrink:0;white-space:nowrap;padding:4px 12px 4px 4px;border-radius:20px;font-size:12.5px}
    .adm-ico{width:26px;height:26px;border-radius:50%}
    .adm-lbl{overflow:visible}
    .adm-sechead{display:none}
    .adm-kpis{grid-template-columns:1fr 1fr;gap:10px}
    .adm-kpi{padding:12px;gap:10px;flex-direction:column;align-items:flex-start}
    .adm-kpi-ico{width:36px;height:36px;border-radius:11px}
    .adm-kpi-n{font-size:20px}
    .adm-kpi>div{width:100%}
  }
`;

/**
 * AdminCategoryFilterButton — fetches category totals for the active month
 * and wires the SHARED (global) include/exclude state to the dropdown.
 * Toggling here updates the same state used by Overview, Sales by Category,
 * the Dealer Modal, and the Category Drill chart.
 */
function AdminCategoryFilterButton({ dealers, selectedMonthIdx, MO }) {
  const g = useGlobalCategoryFilter();
  const [totals, setTotals] = useState([]);
  const moLabel = MO && MO[selectedMonthIdx];

  useEffect(() => {
    if (!moLabel) { setTotals([]); return; }
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(String(moLabel).trim());
    if (!m) { setTotals([]); return; }
    const mi = months.indexOf(m[1].slice(0,3).toLowerCase());
    if (mi < 0) { setTotals([]); return; }
    let y = +m[2]; if (y < 100) y += 2000;
    const ym = `${y}-${String(mi+1).padStart(2,'0')}`;
    let cancelled = false;
    api.salesByCategory({ month: ym })
      .then(r => {
        if (cancelled) return;
        const map = new Map();
        for (const row of (r.rows || [])) map.set(row.category, (map.get(row.category)||0) + (row.qty||0));
        setTotals([...map.entries()].map(([category, total]) => ({ category, total })).sort((a,b) => b.total - a.total));
      })
      .catch(() => { if (!cancelled) setTotals([]); });
    return () => { cancelled = true; };
  }, [moLabel]);

  if (totals.length === 0) return null;
  return (
    <CategoryFilter
      categories={totals}
      excluded={g.excluded}
      onToggle={g.toggle}
      onClear={g.clear}
      onSelectOnly={(cat) => g.set(new Set(totals.map(t=>t.category).filter(c=>c!==cat)))}
      onSetExcluded={g.set}
      label="Categories"
      compact
    />
  );
}

export default AdminPanel;