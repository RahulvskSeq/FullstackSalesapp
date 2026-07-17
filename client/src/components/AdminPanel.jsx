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
import { Users, Target, Award, Activity, RefreshCw, Calendar, Plus, Trash2, Check, LogIn, UserPlus, ChevronDown, ShieldCheck, Shield, Edit3 } from 'lucide-react';
import { MO as MO_CONST } from '../constants';
import { pct, spct, pclr, monthTarget } from '../utils';
import { useMonth } from '../context';
import { Avatar, KPI, StatCard } from './UI';
import CategoryDrillChart from './CategoryDrillChart';
import SampleMasterTab from './SampleMasterTab';
import ManageCategories from './ManageCategories';
import CategoryFilter from './CategoryFilter';
import { useGlobalCategoryFilter } from '../hooks/useGlobalCategoryFilter';
import { api } from '../api';
import { notify, confirmDialog } from './Toast';

const AdminPanel=({dealers,users,setUsers,setShowUM,onSync,syncing,lastSync,syncErrs,onNavigate,onOpenDealer,monthConfig,saveMonthConfig,currentUser,onLoginAs})=>{
  const {selectedMonthIdx, MO:ctxMO}=useMonth();
  const MO = monthConfig?.MO || ctxMO || MO_CONST;
  const selMoLabel=(MO[selectedMonthIdx]||MO[MO.length-1]||'').slice(0,3);
  const [tab,setTab]=useState('summary');
  const [newMonth,setNewMonth]=useState('');
  const [newMonthErr,setNewMonthErr]=useState('');
  // Trash icons next to each month are hidden by default — only revealed
  // when the user explicitly enters "Edit" mode. Prevents accidental
  // remove-month clicks while just browsing.
  const [monthsEditMode, setMonthsEditMode] = useState(false);
  const sms=Object.values(users).filter(u=>u.role==='salesman');

  // ── Login-as dropdown (superadmin only) ─────────────────────────────────
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isStaff      = isSuperAdmin || currentUser?.role === 'admin';
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
      .filter(u => u.id !== currentUser?.id)
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
  const active=dealersForMonth.filter(x=>['ACTIVE','ACHIVERS','KEY ACCOUNT'].includes((x.status||'').toUpperCase())).length;
  const compareData=sms.map(s=>{const sd=dealersForMonth.filter(d=>d.salesman===s.id);return{name:s.name,Target:sd.reduce((a,x)=>a+x.target,0),Achieved:sd.reduce((a,x)=>a+x.achieved,0),smId:s.id,color:s.color};});

  return(
    <div className="fade">
      <div style={{marginBottom:18}}>
        <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:2}}>
          {isSuperAdmin?'Superadmin':'Admin'} · {MO[selectedMonthIdx]}
        </div>
        <div className="row" style={{flexWrap:'wrap', gap:8}}>
          <div style={{fontSize:22,fontWeight:700}}>Control Panel</div>
          <div className="spacer"/>

          {/* ── Login as ▼ — superadmin only ──────────────────────────── */}
          {isSuperAdmin && (
            <div ref={laRef} style={{position:'relative'}}>
              <button onClick={()=>setLaOpen(o=>!o)} className="btn"
                style={{
                  display:'flex', alignItems:'center', gap:6,
                  background:'rgba(251,191,36,0.10)',
                  border:'1px solid rgba(251,191,36,0.35)',
                  color:'#fbbf24', fontWeight:700,
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
                      fontSize:11, color:'#fca5a5', padding:'6px 10px',
                      background:'rgba(248,113,113,0.10)',
                      border:'1px solid #7f1d1d', borderRadius:6, margin:'4px 6px',
                    }}>{laErr}</div>
                  )}
                  {impersonableUsers.length === 0 && (
                    <div style={{fontSize:11, color:'var(--t3)', padding:'10px'}}>No other users yet.</div>
                  )}
                  {impersonableUsers.map(u => {
                    const isSA = u.role === 'superadmin';
                    const isAd = u.role === 'admin';
                    const RoleIcon = isSA ? ShieldCheck : isAd ? Shield : null;
                    const roleColor = isSA ? '#fbbf24' : isAd ? '#a5b4fc' : '#86efac';
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
                        <LogIn size={12} style={{color:'#fbbf24', flexShrink:0}}/>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Add user (admin & superadmin) — opens UserManagement modal */}
          {isStaff && (
            <button onClick={()=>setShowUM(true)} className="btn"
              style={{display:'flex',alignItems:'center',gap:6}}
              title="Create a new user, change roles, or reset passwords">
              <UserPlus size={13}/> Add / Manage Users
            </button>
          )}

          {/* ── Global Category Filter ───────────────────────────────── */}
          <AdminCategoryFilterButton dealers={dealers} selectedMonthIdx={selectedMonthIdx} MO={MO}/>

          {/* ── Sync sheets (admin & superadmin) ─────────────────────── */}
          <button onClick={onSync} className="btnp" style={{display:'flex',alignItems:'center',gap:8}} disabled={syncing}><RefreshCw size={13} className={syncing?'spin':''}/> {syncing?'Syncing...':'Sync Sheets'}</button>
        </div>
      </div>
      <div className="tabs">
        <button className={`tab ${tab==='summary'?'active':''}`} onClick={()=>setTab('summary')}>Summary</button>
        <button className={`tab ${tab==='compare'?'active':''}`} onClick={()=>setTab('compare')}>Salesman Compare</button>
        <button className={`tab ${tab==='category'?'active':''}`} onClick={()=>setTab('category')}>Categories</button>
        <button className={`tab ${tab==='months'?'active':''}`} onClick={()=>setTab('months')} style={{color:tab==='months'?'var(--acc)':'var(--t3)'}}>📅 Month Settings</button>
        <button className={`tab ${tab==='samples'?'active':''}`} onClick={()=>setTab('samples')} style={{color:tab==='samples'?'var(--acc)':'var(--t3)'}}>📦 Sample Master</button>
        <button className={`tab ${tab==='cats'?'active':''}`} onClick={()=>setTab('cats')} style={{color:tab==='cats'?'var(--acc)':'var(--t3)'}}>🏷️ Categories</button>
      </div>
      {tab==='summary'&&(
        <>
          <div className="stat-grid">
            <StatCard label="Total Dealers" value={dealers.length} sub={`${active} active`} icon={Users}/>
            <StatCard label={`${selMoLabel} Target`} value={tt} icon={Target}/>
            <StatCard label={`${selMoLabel} Achieved`} value={ta} valueColor="#34d399" icon={Award}/>
            <StatCard label="Overall %" value={spct(tt,ta)} valueColor={pclr(pct(tt,ta))} progress={pct(tt,ta)} icon={Activity}/>
          </div>
          <div className="card" style={{marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>Target vs Achieved by Salesman — {MO[selectedMonthIdx]}</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={compareData} margin={{top:24,right:20,bottom:5,left:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
                <XAxis dataKey="name" tick={{fill:'var(--t3)',fontSize:11}}/><YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
                <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/><Legend wrapperStyle={{fontSize:12}}/>
                <Bar dataKey="Target" fill="#6366f1" radius={[4,4,0,0]} label={{position:'top',fill:'#6366f1',fontSize:11,fontWeight:700}} style={{cursor:'pointer'}} onClick={d=>onNavigate('dealers',{sm:d.smId})}/>
                <Bar dataKey="Achieved" fill="#34d399" radius={[4,4,0,0]} label={{position:'top',fill:'#34d399',fontSize:11,fontWeight:700}} style={{cursor:'pointer'}} onClick={d=>onNavigate('dealers',{sm:d.smId})}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14,marginBottom:16}}>
            {sms.map(s=>{
              const sd=dealersForMonth.filter(d=>d.salesman===s.id);
              const st=sd.reduce((a,x)=>a+x.target,0),sa=sd.reduce((a,x)=>a+x.achieved,0),sp=pct(st,sa);
              // Sparkline: raw monthly sums for every month EXCEPT the
              // current one, which uses the filtered achieved so the bar
              // height matches the KPI card above it.
              const mT=MO.map((_,i)=>{
                if (i === selectedMonthIdx) {
                  return sd.reduce((a,x)=>a+x.achieved,0);
                }
                return dealers.filter(d=>d.salesman===s.id).reduce((a,d)=>a+(d.months[i]||0),0);
              });
              return(
                <div key={s.id} className="card" style={{borderColor:s.color+'44',cursor:'pointer',transition:'transform .15s'}}
                  onClick={()=>onNavigate('dealers',{sm:s.id})}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                  <div className="row" style={{marginBottom:12}}>
                    <Avatar user={s} size={34}/>
                    <div><div style={{fontSize:15,fontWeight:700}}>{s.name}</div><div style={{fontSize:11,color:'var(--t3)'}}>{sd.length} dealers</div></div>
                    <div className="spacer"/>
                    <div style={{fontSize:22,fontWeight:700,color:pclr(sp)}}>{spct(st,sa)}</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6,marginBottom:10}}>
                    <KPI label={`${selMoLabel} Target`} value={st}/>
                    <KPI label={`${selMoLabel} Achieved`} value={sa} color="#34d399"/>
                  </div>
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={mT.map((v,i)=>({m:MO[i].slice(0,3),v}))} margin={{top:14,right:0,bottom:0,left:0}}>
                      <XAxis dataKey="m" tick={{fill:'var(--t3)',fontSize:9}} axisLine={false} tickLine={false} interval={0}/>
                      <Bar dataKey="v" radius={[2,2,0,0]} label={{position:'top',fill:s.color,fontSize:9,fontWeight:600}}>
                        {mT.map((_,idx)=>(<Cell key={idx} fill={idx===selectedMonthIdx?'#fbbf24':s.color}/>))}
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
          <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>All Salesmen — Month by Month</div>
          <div className="scroll">
            <table>
              <thead>
                <tr><th>Salesman</th>{[...MO].map((_,di)=>{const i=MO.length-1-di;return<th key={i} style={{textAlign:'right',background:i===selectedMonthIdx?'rgba(99,102,241,.08)':'var(--bg1)'}}>{MO[i]}</th>;})}<th style={{textAlign:'right'}}>Tgt</th><th style={{textAlign:'right'}}>Ach</th><th style={{textAlign:'right'}}>%</th></tr>
              </thead>
              <tbody>
                {sms.map(s=>{
                  const sd=dealersForMonth.filter(d=>d.salesman===s.id);
                  const st=sd.reduce((a,x)=>a+x.target,0),sa=sd.reduce((a,x)=>a+x.achieved,0);
                  const mT=MO.map((_,i)=>dealers.filter(d=>d.salesman===s.id).reduce((a,d)=>a+(d.months[i]||0),0));
                  return(
                    <tr key={s.id} onClick={()=>onNavigate('dealers',{sm:s.id})} style={{cursor:'pointer'}}>
                      <td><div style={{display:'flex',alignItems:'center',gap:8}}><Avatar user={s} size={22}/><span style={{fontWeight:600}}>{s.name}</span></div></td>
                      {[...mT].map((_,di)=>{const i=mT.length-1-di;const v=mT[i];return<td key={i} style={{textAlign:'right',color:i===selectedMonthIdx?'#fbbf24':'var(--t2)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'rgba(251,191,36,.05)':'transparent'}}>{v||'—'}</td>;})}
                      <td style={{textAlign:'right'}}>{st}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{sa}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:pclr(pct(st,sa))}}>{spct(st,sa)}</td>
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
      {tab==='months'&&(
        <div className="fade">
          <div style={{fontSize:13,color:'var(--t3)',marginBottom:14}}>Control which months appear in the app. Changes apply instantly — no code editing needed.</div>

          {/* Current Month */}
          <div className="card" style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <Calendar size={14} color="var(--acc)"/> Set Current Month
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
            <div style={{fontSize:13,fontWeight:700,marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
              <Plus size={14} color="#34d399"/> Add Month
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
              {newMonthErr&&<span style={{fontSize:11,color:'#f87171'}}>{newMonthErr}</span>}
            </div>
          </div>

          {/* All months list */}
          <div className="card">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700}}>All Months ({(monthConfig?.MO||MO).length})</div>
              <button
                onClick={()=>setMonthsEditMode(v=>!v)}
                className="btn"
                title={monthsEditMode ? 'Hide trash icons' : 'Show trash icons so you can remove months'}
                style={{
                  fontSize:11, padding:'4px 10px',
                  display:'flex', alignItems:'center', gap:5,
                  background: monthsEditMode ? 'rgba(248,113,113,0.10)' : 'transparent',
                  borderColor: monthsEditMode ? '#7f1d1d' : 'var(--b2)',
                  color: monthsEditMode ? '#fca5a5' : 'var(--t2)',
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
                      }} style={{background:'none',border:'none',color:'#f87171',cursor:'pointer',padding:2}}
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
    </div>
  );
};

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
      label="Categories"
      compact
    />
  );
}

export default AdminPanel;