// import React, { useState, useMemo } from 'react';
// import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
// import { Users, Target, Award, Activity, TrendingUp, Clock, Bell, AlertTriangle, Search, MapPin, Star, ArrowUpRight, ArrowDownRight, X, GripVertical, Hash } from 'lucide-react';
// import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
// import { pct, spct, pclr, trendPct, forecast } from '../utils';
// import { useMonth } from '../context';
// import { StatusBadge, Avatar, MiniBars, StatCard, MultiSelect } from './UI';
// import MapView from './MapView';
// import CategoryDrillChart from './CategoryDrillChart';

// const Overview=({dealers,currentUser,users,notes,onOpenDealer,onNavigate})=>{
//   const {selectedMonthIdx, MO:ctxMO}=useMonth();
//   const MO = ctxMO || MO_CONST;
//   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
//   const selMoFull=MO[selectedMonthIdx];

//   const dealersForMonth=useMemo(()=>dealers.map(d=>({
//     ...d,
//     achieved:d.months[selectedMonthIdx]||0,
//     target:(d.monthTargets?.[selectedMonthIdx] ?? d.target),
//   })),[dealers,selectedMonthIdx]);

//   const myD=dealersForMonth;
//   const [overviewSearch,setOverviewSearch]=useState('');
//   const [overviewSm,setOverviewSm]=useState('');
//   const [overviewSort,setOverviewSort]=useState('achieved');
//   const [attentionThreshold,setAttentionThreshold]=useState(60);
//   const [attentionDirection,setAttentionDirection]=useState('lt');
//   const [attentionExpanded,setAttentionExpanded]=useState(false);
//   const [geoFilter,setGeoFilter]=useState({city:'',state:''});
//   const [dealerSearch,setDealerSearch]=useState('');
//   const [showSearchResults,setShowSearchResults]=useState(false);
//   const [insightPopup,setInsightPopup]=useState(null);
//   const [tierPopup,setTierPopup]=useState(null);
//   const [popupSearch,setPopupSearch]=useState('');

//   // Drag-reorder for status sections
//   const CORE_STATUSES = ['ACTIVE','KEY ACCOUNT','ACHIVERS','ACHIEVERS','ACHIEVER','STAR'];
//   const [coreOrder,setCoreOrder]=useState(()=>{
//     try{ const s=JSON.parse(localStorage.getItem('stp_core_status_order')||'null'); if(s&&s.includes('KEY ACCOUNT'))return s; return ['ACTIVE','KEY ACCOUNT','ACHIVERS','ACHIEVERS','ACHIEVER','STAR']; }catch{ return ['ACTIVE','KEY ACCOUNT','ACHIVERS','ACHIEVERS','ACHIEVER','STAR']; }
//   });
//   const [otherOrder,setOtherOrder]=useState(null); // null = auto from data
//   const [dragStatus,setDragStatus]=useState(null);
//   const [dragSection,setDragSection]=useState(null);
//   const [overStatus,setOverStatus]=useState(null);

//   const allCitiesOv=useMemo(()=>[...new Set(dealers.map(x=>(x.city||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allStatesOv=useMemo(()=>[...new Set(dealers.map(x=>(x.state||'').trim()).filter(Boolean))].sort(),[dealers]);

//   const geoFilteredDealers=useMemo(()=>{
//     let d=dealers;
//     if(geoFilter.city)d=d.filter(x=>(x.city||'').toLowerCase()===geoFilter.city.toLowerCase());
//     if(geoFilter.state)d=d.filter(x=>(x.state||'').toLowerCase()===geoFilter.state.toLowerCase());
//     return d;
//   },[dealers,geoFilter]);

//   const dealerMatches=dealerSearch.trim()?myD.filter(d=>d.name.toLowerCase().includes(dealerSearch.toLowerCase())).slice(0,8):[];

//   const tt=myD.reduce((s,x)=>s+x.target,0);
//   const ta=myD.reduce((s,x)=>s+x.achieved,0);
//   const ap=pct(tt,ta);
//   // Full status breakdown for territory overview
//   const statusMap = {};
//   myD.forEach(x=>{ const s=(x.status||'OTHER').trim(); statusMap[s]=(statusMap[s]||0)+1; });
//   const active = (statusMap['ACTIVE']||0)+(statusMap['ACHIVERS']||0)+(statusMap['ACHIEVERS']||0)+(statusMap['KEY ACCOUNT']||0);
//   const inactive = (statusMap['INACTIVE']||0)+(statusMap['REACTIVE']||0);
//   const dead = statusMap['DEAD']||0;
//   const other = myD.length - active - inactive - dead;

//   // Insight calculations — ALL dealers, real thresholds
//   const risingList=dealers.filter(x=>trendPct(x.months)>30&&x.months.slice(-3).reduce((a,b)=>a+b,0)>0);
//   const decliningList=dealers.filter(x=>trendPct(x.months)<-20&&x.months.slice(-6,-3).reduce((a,b)=>a+b,0)>0);
//   const dormantList=dealers.filter(x=>x.months.slice(-3).reduce((a,b)=>a+b,0)===0&&x.months.slice(0,8).reduce((a,b)=>a+b,0)>0);
//   const recentlyInactiveList=dealers.filter(x=>x.months[CURRENT_MONTH_IDX]===0&&x.months.slice(0,CURRENT_MONTH_IDX).reduce((a,b)=>a+b,0)>0);
//   // Dead by data = zero for 6+ months; inactive by data = zero last 2-3 months
//   const inactiveByData=dealers.filter(x=>{const last3=x.months.slice(-3).reduce((a,b)=>a+b,0);const prev=x.months.slice(-6,-3).reduce((a,b)=>a+b,0);return last3===0&&prev>0;});
//   const deadByData=dealers.filter(x=>x.months.slice(-6).reduce((a,b)=>a+b,0)===0&&x.months.reduce((a,b)=>a+b,0)>0);
//   // Also count by status field
//   const inactiveByStatus=dealers.filter(x=>['INACTIVE','REACTIVE'].includes((x.status||'').toUpperCase()));
//   const deadByStatus=dealers.filter(x=>(x.status||'').toUpperCase()==='DEAD');
//   const overdueFollowups=notes.filter(n=>n.type==='followup'&&!n.completed&&new Date(n.dueDate)<new Date()).length;

//   const top5=[...myD].filter(x=>x.achieved>0).sort((a,b)=>b.achieved-a.achieved).slice(0,5);
//   const lowAll=myD.filter(x=>{
//     if(!x.target)return false;
//     const p=pct(x.target,x.achieved)||0;
//     return attentionDirection==='lt'?p<attentionThreshold:p>attentionThreshold;
//   }).sort((a,b)=>{
//     const pa=pct(a.target,a.achieved)||0,pb=pct(b.target,b.achieved)||0;
//     return attentionDirection==='lt'?pa-pb:pb-pa;
//   });
//   const low=attentionExpanded?lowAll:lowAll.slice(0,8);

//   const trendData=MO.map((m,i)=>({
//     month:m.slice(0,3),
//     units:geoFilteredDealers.reduce((s,d)=>s+(d.months[i]||0),0),
//   }));
//   const projected=trendData.slice(-3).reduce((s,d)=>s+d.units,0)/3;

//   const statusColorMap={'ACTIVE':'#34d399','ACHIVERS':'#10b981','KEY ACCOUNT':'#a78bfa','INACTIVE':'#fb923c','REACTIVE':'#f59e0b','DEAD':'#f87171','NEW':'#22d3ee','PROSPECT':'#818cf8'};
//   const fallbackPalette=['#6366f1','#34d399','#fbbf24','#f472b6','#22d3ee','#fb923c','#a78bfa','#f87171','#84cc16','#e879f9'];
//   const colorForStatus=(name,idx)=>statusColorMap[name.toUpperCase()]||fallbackPalette[idx%fallbackPalette.length];
//   const statusCounts=(()=>{
//     const map={};
//     myD.forEach(x=>{const s=(x.status||'—').trim()||'—';map[s]=(map[s]||0)+1;});
//     return Object.entries(map).map(([name,value],i)=>({name,value,color:colorForStatus(name,i)})).sort((a,b)=>b.value-a.value);
//   })();

//   const topPerformers=myD.filter(x=>x.achieved>250);
//   const priorityAccount=myD.filter(x=>x.achieved>=100&&x.achieved<=250);
//   const risingStar=myD.filter(x=>x.achieved>=50&&x.achieved<100);
//   const hasGeoFilter=geoFilter.city||geoFilter.state;
//   const viewingLabel=selectedMonthIdx===CURRENT_MONTH_IDX?`${selMoFull} (Current)`:selMoFull;

//   return(
//     <div className="fade">
//       <div style={{marginBottom:22}}>
//         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:4}}>
//           {viewingLabel}
//           {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{marginLeft:8,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4,fontSize:10}}>HISTORICAL VIEW</span>}
//         </div>
//         <div style={{fontSize:24,fontWeight:700,letterSpacing:'-0.02em'}}>
//           {currentUser.role==='admin'?'All Territories':'Your Territory'} — Overview
//         </div>
//       </div>

//       {/* Insight chips — all based on real data calculations */}
//       <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:18}}>
//         {risingList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'TRENDING UP',color:'#34d399',icon:'📈',sub:'sales up >30% last 3 vs prior 3 months',list:risingList})} style={{background:'rgba(52,211,153,0.1)',color:'#34d399',cursor:'pointer'}}><TrendingUp size={13}/> {risingList.length} dealers trending up</div>}
//         {decliningList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'DECLINING SHARPLY',color:'#f87171',icon:'📉',sub:'sales down >20% last 3 vs prior 3 months',list:decliningList})} style={{background:'rgba(248,113,113,0.1)',color:'#f87171',cursor:'pointer'}}><ArrowDownRight size={13}/> {decliningList.length} declining sharply</div>}
//         {dormantList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'DORMANT 3+ MONTHS',color:'#fbbf24',icon:'💤',sub:'zero sales last 3 months but had history',list:dormantList})} style={{background:'rgba(251,191,36,0.1)',color:'#fbbf24',cursor:'pointer'}}><Clock size={13}/> {dormantList.length} dormant 3+ months</div>}
//         {recentlyInactiveList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'REACTIVE',color:'#fb923c',icon:'⏸',sub:'no orders this month but had orders before',list:recentlyInactiveList})} style={{background:'rgba(251,146,60,0.1)',color:'#fb923c',cursor:'pointer'}}><Clock size={13}/> {recentlyInactiveList.length} recently inactive</div>}
//         {inactiveByStatus.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'INACTIVE (STATUS)',color:'#fbbf24',icon:'⚠️',sub:'marked as Inactive or Recently Inactive',list:inactiveByStatus})} style={{background:'rgba(251,191,36,0.08)',color:'#fbbf24',cursor:'pointer'}}><AlertTriangle size={13}/> {inactiveByStatus.length} inactive</div>}
//         {deadByStatus.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'DEAD CUSTOMERS',color:'#f87171',icon:'✕',sub:'marked as Dead',list:deadByStatus})} style={{background:'rgba(248,113,113,0.08)',color:'#f87171',cursor:'pointer'}}><X size={13}/> {deadByStatus.length} dead customers</div>}
//         {overdueFollowups>0&&<div className="insight-chip" onClick={()=>onNavigate('followups')} style={{background:'rgba(99,102,241,0.1)',color:'var(--acc)',cursor:'pointer'}}><Bell size={13}/> {overdueFollowups} overdue follow-ups</div>}
//       </div>

//       <div className="stat-grid">
//         <StatCard label="Total Dealers" value={myD.length} sub={`${active} active · ${inactive} inactive · ${dead} dead`} icon={Users}/>
//         <StatCard label={`${selMoLabel} Target`} value={tt} sub="total units" icon={Target}/>
//         <StatCard label={`${selMoLabel} Achieved`} value={ta} sub={`${selMoFull} total`} valueColor="#34d399" icon={Award}/>
//         <StatCard label="Achievement" value={spct(tt,ta)} valueColor={pclr(ap)} progress={ap} icon={Activity}/>
//       </div>

//       {/* Dealer quick search */}
//       <div className="card" style={{marginBottom:16,padding:'12px 16px'}}>
//         <div style={{position:'relative'}}>
//           <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//           <input className="inp" style={{paddingLeft:36}} placeholder="🔍 Search any dealer by name..."
//             value={dealerSearch} onChange={e=>{setDealerSearch(e.target.value);setShowSearchResults(true);}}
//             onFocus={()=>setShowSearchResults(true)}/>
//           {dealerSearch&&<button onClick={()=>{setDealerSearch('');setShowSearchResults(false);}}
//             style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t3)',cursor:'pointer'}}><X size={14}/></button>}
//           {showSearchResults&&dealerSearch&&(
//             <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:6,background:'var(--bg1)',border:'1px solid var(--b2)',borderRadius:8,zIndex:10,maxHeight:320,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
//               {dealerMatches.length>0?dealerMatches.map(d=>{
//                 const p=pct(d.target,d.achieved);const sm=users[d.salesman];
//                 return(
//                   <div key={d.id} onClick={()=>{onOpenDealer(d.id);setDealerSearch('');setShowSearchResults(false);}}
//                     style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:10}}
//                     onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
//                     onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
//                     <div style={{flex:1,minWidth:0}}>
//                       <div style={{fontSize:13,fontWeight:600,color:'var(--t1)',marginBottom:2}}>{d.name}</div>
//                       <div style={{display:'flex',gap:8,alignItems:'center',fontSize:11,color:'var(--t3)'}}>
//                         <StatusBadge status={d.status}/>
//                         {d.zone&&<span>· {d.zone}</span>}
//                         {(d.city||d.state)&&<span>· {[d.city,d.state].filter(Boolean).join(', ')}</span>}
//                         {d.category&&<span>· {d.category}</span>}
//                         {sm&&<span>· {sm.name}</span>}
//                       </div>
//                     </div>
//                     <div style={{textAlign:'right',fontSize:11}}>
//                       <div style={{color:'var(--t3)'}}>{selMoLabel}</div>
//                       <div style={{fontWeight:700,color:pclr(p)}}>{d.achieved}/{d.target} · {spct(d.target,d.achieved)}</div>
//                     </div>
//                   </div>
//                 );
//               }):<div style={{padding:16,color:'var(--t3)',fontSize:13,textAlign:'center'}}>No dealers match "{dealerSearch}"</div>}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Performance Tiers */}
//       <div className="card" style={{marginBottom:12}}>
//         <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
//           <Award size={14} color="#fbbf24"/> Performance Tiers
//           <span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:4}}>({selMoLabel} units · click to view)</span>
//         </div>
//         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
//           {[
//             {label:'TOP PERFORMER',sub:'> 250 units',count:topPerformers.length,color:'#fbbf24',icon:'⭐',list:topPerformers},
//             {label:'PRIORITY ACCOUNT',sub:'100 – 250 units',count:priorityAccount.length,color:'#a78bfa',icon:'◆',list:priorityAccount},
//             {label:'RISING STAR',sub:'50 – 100 units',count:risingStar.length,color:'#22d3ee',icon:'★',list:risingStar},
//           ].map(t=>(
//             <div key={t.label} onClick={()=>{if(t.list.length>0)setTierPopup(t);}}
//               style={{background:`linear-gradient(135deg, ${t.color}1a, ${t.color}08)`,border:`1px solid ${t.color}44`,borderRadius:12,padding:'14px 16px',cursor:'pointer',transition:'transform .15s'}}
//               onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
//               onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}>
//               <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
//                 <span style={{fontSize:18}}>{t.icon}</span>
//                 <div><div style={{fontSize:11,color:t.color,fontWeight:700}}>{t.label}</div><div style={{fontSize:10,color:'var(--t3)'}}>{t.sub}</div></div>
//               </div>
//               <div style={{fontSize:30,fontWeight:700,color:'var(--t1)',lineHeight:1,marginBottom:6}}>{t.count}<span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:6}}>dealers</span></div>
//               {t.list.slice(0,3).map(d=>(
//                 <span key={d.id} onClick={e=>{e.stopPropagation();onOpenDealer(d.id);}}
//                   style={{display:'inline-block',fontSize:10,padding:'2px 8px',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:4,color:'var(--t2)',cursor:'pointer',margin:'2px',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
//                   {d.name} · {d.achieved}
//                 </span>
//               ))}
//               {t.list.length>3&&<span style={{fontSize:10,color:'var(--t3)',marginLeft:4}}>+{t.list.length-3} more</span>}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ── Status: TWO drag-reorder sections ── */}
//       {(()=>{
//         // Build map of all status counts
//         const smap={};
//         myD.forEach(x=>{const s=(x.status||'NONE').trim()||'NONE';smap[s]=(smap[s]||0)+1;});
//         const coreKeys=CORE_STATUSES.filter(s=>smap[s]>0);
//         const otherKeys=Object.keys(smap).filter(s=>!CORE_STATUSES.includes(s));
//         // Apply saved orders
//         const orderedCore=[...coreOrder.filter(s=>coreKeys.includes(s)),...coreKeys.filter(s=>!coreOrder.includes(s))];
//         const savedOther=otherOrder||[...otherKeys];
//         const orderedOther=[...savedOther.filter(s=>otherKeys.includes(s)),...otherKeys.filter(s=>!savedOther.includes(s))];

//         const dragStart=(e,s,sec)=>{setDragStatus(s);setDragSection(sec);e.dataTransfer.effectAllowed='move';};
//         const dragOver=(e,s)=>{e.preventDefault();setOverStatus(s);};
//         const dragEnd=()=>{setDragStatus(null);setDragSection(null);setOverStatus(null);};
//         const reorder=(arr,from,to)=>{const a=[...arr];const fi=a.indexOf(from),ti=a.indexOf(to);if(fi<0||ti<0)return arr;a.splice(fi,1);a.splice(ti,0,from);return a;};
//         const drop=(e,target,targetSec)=>{
//           e.preventDefault();
//           if(!dragStatus||dragStatus===target)return;
//           const fromSec=dragSection;
//           if(fromSec===targetSec){
//             if(targetSec==='core'){const n=reorder(orderedCore,dragStatus,target);setCoreOrder(n);localStorage.setItem('stp_core_status_order',JSON.stringify(n));}
//             else{setOtherOrder(reorder(orderedOther,dragStatus,target));}
//           } else if(targetSec==='core'){
//             const newOther=orderedOther.filter(s=>s!==dragStatus);
//             const newCore=[...orderedCore];
//             const ti=newCore.indexOf(target);
//             newCore.splice(ti>=0?ti:newCore.length,0,dragStatus);
//             setCoreOrder(newCore);setOtherOrder(newOther);
//             localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));
//           } else {
//             const newCore=orderedCore.filter(s=>s!==dragStatus);
//             const newOther=[...orderedOther];
//             const ti=newOther.indexOf(target);
//             newOther.splice(ti>=0?ti:newOther.length,0,dragStatus);
//             setCoreOrder(newCore);setOtherOrder(newOther);
//             localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));
//           }
//           setDragStatus(null);setDragSection(null);setOverStatus(null);
//         };
//         const StatusCard=({s,sec})=>{
//           const v=smap[s]||0;
//           const pctOfTotal=myD.length?Math.round((v/myD.length)*100):0;
//           const clr=statusColorMap[s.toUpperCase()]||fallbackPalette[Object.keys(smap).indexOf(s)%fallbackPalette.length];
//           const isOver=overStatus===s&&dragStatus&&dragStatus!==s;
//           return(
//             <div draggable onDragStart={e=>dragStart(e,s,sec)} onDragOver={e=>dragOver(e,s)} onDrop={e=>drop(e,s,sec)} onDragEnd={dragEnd}
//               onClick={()=>onNavigate('dealers',{status:s})}
//               style={{background:isOver?clr+'30':clr+'14',border:`1px solid ${isOver?clr:clr+'33'}`,borderRadius:10,padding:'12px 14px',cursor:'pointer',
//                 opacity:dragStatus===s?0.5:1,transition:'all .15s',position:'relative'}}>
//               <div style={{position:'absolute',top:6,right:6,opacity:0.3,cursor:'grab'}}><GripVertical size={10}/></div>
//               <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
//                 <span style={{width:8,height:8,borderRadius:'50%',background:clr,flexShrink:0}}/>
//                 <span style={{fontSize:11,color:clr,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s}</span>
//               </div>
//               <div style={{fontSize:24,fontWeight:700,color:'var(--t1)',lineHeight:1}}>{v}<span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:6}}>{pctOfTotal}%</span></div>
//               <div style={{height:3,background:'var(--b1)',borderRadius:2,marginTop:8,overflow:'hidden'}}>
//                 <div style={{height:'100%',width:pctOfTotal+'%',background:clr,borderRadius:2,transition:'width .8s ease'}}/>
//               </div>
//             </div>
//           );
//         };
//         return(<>
//           {orderedCore.length>0&&(
//             <div className="card" style={{marginBottom:12}}>
//               <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
//                 <Star size={14} color="#34d399"/> Core Status
//                 <span style={{fontSize:11,color:'var(--t3)',fontWeight:400}}>(drag to reorganize · click to filter)</span>
//               </div>
//               <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}
//                 onDragOver={e=>e.preventDefault()}
//                 onDrop={e=>{ if(dragSection==='other'&&dragStatus){ const newOther=orderedOther.filter(s=>s!==dragStatus);const newCore=[...orderedCore,dragStatus];setCoreOrder(newCore);setOtherOrder(newOther);localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));setDragStatus(null);setDragSection(null);setOverStatus(null); } }}>
//                 {orderedCore.map(s=><StatusCard key={s} s={s} sec="core"/>)}
//               </div>
//             </div>
//           )}
//           {orderedOther.length>0&&(
//             <div className="card" style={{marginBottom:12}}>
//               <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
//                 <Hash size={14} color="var(--t3)"/> Other Statuses
//                 <span style={{fontSize:11,color:'var(--t3)',fontWeight:400}}>({orderedOther.length} · drag to reorganize)</span>
//               </div>
//               <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}
//                 onDragOver={e=>e.preventDefault()}
//                 onDrop={e=>{ if(dragSection==='core'&&dragStatus){ const newCore=orderedCore.filter(s=>s!==dragStatus);const newOther=[...orderedOther,dragStatus];setCoreOrder(newCore);setOtherOrder(newOther);localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));setDragStatus(null);setDragSection(null);setOverStatus(null); } }}>
//                 {orderedOther.map(s=><StatusCard key={s} s={s} sec="other"/>)}
//               </div>
//             </div>
//           )}
//         </>);
//       })()}

//       {/* Map View */}
//       <MapView dealers={dealers} selectedMonthIdx={selectedMonthIdx}/>

//       {/* Category drill chart */}
//       <CategoryDrillChart dealers={dealers} selectedMonthIdx={selectedMonthIdx} onNavigate={onNavigate}/>

//       {/* Geo filter */}
//       {(allCitiesOv.length>0||allStatesOv.length>0)&&(
//         <div className="card" style={{marginBottom:16,padding:'12px 16px'}}>
//           {/* <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
//             <MapPin size={13} color="var(--acc)"/> Geography Filter
//             {hasGeoFilter&&<button onClick={()=>setGeoFilter({city:'',state:''})} className="btn" style={{fontSize:10,padding:'2px 8px',marginLeft:'auto',color:'var(--red)'}}><X size={10} style={{display:'inline',verticalAlign:'middle'}}/> Clear</button>}
//           </div> */}
//           {/* <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
//             {allStatesOv.map(s=>(
//               <button key={s} onClick={()=>setGeoFilter(f=>({...f,state:f.state===s?'':s,city:''}))} className="btn"
//                 style={{fontSize:11,padding:'4px 10px',background:geoFilter.state===s?'var(--accL)':'var(--bg2)',color:geoFilter.state===s?'var(--acc)':'var(--t2)',borderColor:geoFilter.state===s?'var(--acc)':'var(--b2)'}}>
//                 {s}
//               </button>
//             ))}
//             {allCitiesOv.map(c=>(
//               <button key={c} onClick={()=>setGeoFilter(f=>({...f,city:f.city===c?'':c}))} className="btn"
//                 style={{fontSize:11,padding:'4px 10px',background:geoFilter.city===c?'rgba(34,211,238,0.15)':'var(--bg2)',color:geoFilter.city===c?'#22d3ee':'var(--t2)',borderColor:geoFilter.city===c?'#22d3ee':'var(--b2)'}}>
//                 {c}
//               </button>
//             ))}
//           </div> */}
//         </div>
//       )}

//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16,marginBottom:16}}>
//         <div className="card">
//           <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
//             <div style={{fontSize:13,fontWeight:600,color:'var(--t2)'}}>
//               11-Month Sales Trend
//               {hasGeoFilter&&<span style={{fontSize:10,color:'var(--acc)',marginLeft:6}}>({geoFilter.state||''}{geoFilter.city?(geoFilter.state?' · ':'')+geoFilter.city:''})</span>}
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)'}}>Forecast: <strong style={{color:'var(--acc)'}}>{Math.round(projected)}</strong></div>
//           </div>
//           <ResponsiveContainer width="100%" height={200}>
//             <AreaChart data={trendData}>
//               <defs>
//                 <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
//                   <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
//               <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}} stroke="var(--b2)"/>
//               <YAxis tick={{fill:'var(--t3)',fontSize:11}} stroke="var(--b2)"/>
//               <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
//               <Area type="monotone" dataKey="units" stroke="#6366f1" strokeWidth={2} fill="url(#grad1)" label={{position:'top',fill:'var(--t2)',fontSize:10}}/>
//               <ReferenceLine x={MO[selectedMonthIdx].slice(0,3)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 3"/>
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>
//         <div className="card">
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>Status Distribution</div>
//           <ResponsiveContainer width="100%" height={200}>
//             <PieChart>
//               <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value"
//                 onClick={d=>onNavigate('dealers',{status:d.name})} style={{cursor:'pointer'}}
//                 label={({value})=>value}>
//                 {statusCounts.map((d,i)=><Cell key={i} fill={d.color}/>)}
//               </Pie>
//               <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
//               <Legend wrapperStyle={{fontSize:11}} iconType="circle"/>
//             </PieChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14,marginBottom:14}}>
//         <div className="card">
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>🏆 Top 5 — {selMoLabel}</div>
//           {top5.length>0?top5.map((x,i)=>{
//             const p=pct(x.target,x.achieved);
//             return(
//               <div key={x.id} onClick={()=>onOpenDealer(x.id)}
//                 style={{display:'flex',alignItems:'center',gap:10,marginBottom:11,cursor:'pointer',padding:'4px 6px',borderRadius:6,transition:'background .15s'}}
//                 onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
//                 onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
//                 <span style={{fontSize:12,color:'var(--t3)',width:14,textAlign:'right'}}>{i+1}</span>
//                 <div style={{flex:1,minWidth:0}}>
//                   <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
//                     <span style={{fontSize:12,color:'var(--t1)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{x.name}</span>
//                     <span style={{fontSize:12,fontWeight:700,color:pclr(p),marginLeft:6}}>{spct(x.target,x.achieved)}</span>
//                   </div>
//                   <div style={{height:4,background:'var(--b1)',borderRadius:2,overflow:'hidden'}}>
//                     <div style={{height:'100%',width:`${Math.min(p||0,100)}%`,background:pclr(p),borderRadius:2,transition:'width .8s ease'}}/>
//                   </div>
//                 </div>
//                 <span style={{fontSize:12,color:'var(--t3)',width:22,textAlign:'right'}}>{x.achieved}</span>
//               </div>
//             );
//           }):<div style={{color:'var(--t3)',fontSize:13,padding:'10px 0'}}>No data yet</div>}
//         </div>

//         <div className="card">
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>📊 Achievement Distribution</div>
//           {(()=>{
//             const buckets={'0%':0,'1-50%':0,'51-99%':0,'100%+':0};
//             myD.forEach(x=>{if(!x.target)return;const p=pct(x.target,x.achieved)||0;if(p===0)buckets['0%']++;else if(p<51)buckets['1-50%']++;else if(p<100)buckets['51-99%']++;else buckets['100%+']++;});
//             const colors={'0%':'#f87171','1-50%':'#fb923c','51-99%':'#fbbf24','100%+':'#34d399'};
//             const data=Object.entries(buckets).map(([k,v])=>({name:k,value:v,fill:colors[k]}));
//             return(
//               <ResponsiveContainer width="100%" height={180}>
//                 <BarChart data={data}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
//                   <XAxis dataKey="name" tick={{fill:'var(--t3)',fontSize:11}}/>
//                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
//                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
//                   <Bar dataKey="value" radius={[4,4,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:11,fontWeight:600}}>
//                     {data.map((d,i)=><Cell key={i} fill={d.fill}/>)}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             );
//           })()}
//         </div>
//       </div>

//       {/* Needs Attention */}
//       <div className="card">
//         <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:10}}>
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
//             <AlertTriangle size={14} color={attentionDirection==='lt'?'#fbbf24':'#34d399'}/>
//             {attentionDirection==='lt'?'Needs Attention':'High Performers'} — {attentionDirection==='lt'?'below':'above'} {attentionThreshold}%
//             <span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:4}}>({lowAll.length} dealers)</span>
//           </div>
//           <div className="spacer"/>
//           <div className="row" style={{gap:4,flexWrap:'wrap'}}>
//             <div style={{display:'flex',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:6,overflow:'hidden'}}>
//               <button onClick={()=>setAttentionDirection('lt')} style={{background:attentionDirection==='lt'?'#fbbf24':'transparent',color:attentionDirection==='lt'?'#1a1a2e':'var(--t2)',border:'none',padding:'4px 12px',fontSize:12,fontWeight:700,cursor:'pointer'}}>&lt; Below</button>
//               <button onClick={()=>setAttentionDirection('gt')} style={{background:attentionDirection==='gt'?'#34d399':'transparent',color:attentionDirection==='gt'?'#1a1a2e':'var(--t2)',border:'none',padding:'4px 12px',fontSize:12,fontWeight:700,cursor:'pointer',borderLeft:'1px solid var(--b2)'}}>&gt; Above</button>
//             </div>
//             {[50,60,75,90,100].map(t=>{
//               const ac=attentionDirection==='lt'?'#fbbf24':'#34d399';
//               return(<button key={t} onClick={()=>setAttentionThreshold(t)}
//                 style={{background:attentionThreshold===t?ac:'var(--bg2)',color:attentionThreshold===t?'#1a1a2e':'var(--t2)',border:`1px solid ${attentionThreshold===t?ac:'var(--b2)'}`,borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:attentionThreshold===t?700:500,cursor:'pointer'}}>
//                 {attentionDirection==='lt'?'<':'>'}{t}%
//               </button>);
//             })}
//           </div>
//         </div>
//         {lowAll.length>0?(
//           <>
//             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10}}>
//               {low.map(x=>{
//                 const p=pct(x.target,x.achieved)||0;
//                 const sm=users[x.salesman];
//                 const cardClr=attentionDirection==='lt'?(p<30?'#f87171':p<60?'#fb923c':'#fbbf24'):(p>=150?'#34d399':p>=100?'#22d3ee':'#a78bfa');
//                 return(
//                   <div key={x.id} onClick={()=>onOpenDealer(x.id)}
//                     style={{background:cardClr+'14',border:`1px solid ${cardClr}33`,borderRadius:8,padding:'11px 13px',cursor:'pointer',transition:'transform .15s'}}
//                     onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
//                     onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
//                     <div style={{fontSize:12,color:'var(--t1)',fontWeight:500,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{x.name}</div>
//                     <div style={{fontSize:20,fontWeight:700,color:cardClr}}>{spct(x.target,x.achieved)}</div>
//                     <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{x.achieved}/{x.target} units</div>
//                     {x.category&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{x.category}</div>}
//                     {currentUser.role==='admin'&&sm&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2,display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:sm.color}}/>{sm.name}</div>}
//                     <div style={{marginTop:6}}><MiniBars months={x.months} highlightIdx={selectedMonthIdx}/></div>
//                   </div>
//                 );
//               })}
//             </div>
//             {lowAll.length>8&&<div style={{marginTop:12,textAlign:'center'}}><button onClick={()=>setAttentionExpanded(e=>!e)} className="btn" style={{fontSize:12}}>{attentionExpanded?`Show fewer`:`Show all ${lowAll.length} dealers`}</button></div>}
//           </>
//         ):<div style={{color:'var(--t3)',textAlign:'center',padding:20,fontSize:13}}>🎉 No dealers {attentionDirection==='lt'?'below':'above'} {attentionThreshold}%</div>}
//       </div>

//       {/* All dealers table */}
//       <div className="card" style={{marginTop:14}}>
//         <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:8}}>
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}><Users size={14}/> All Dealers ({myD.length})</div>
//           <div className="spacer"/>
//           <div style={{position:'relative'}}>
//             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Quick search..." value={overviewSearch} onChange={e=>setOverviewSearch(e.target.value)}/>
//           </div>
//           {currentUser.role==='admin'&&(
//             <MultiSelect options={Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id)} selected={overviewSm?[overviewSm]:[]}
//               onChange={v=>setOverviewSm(v.length?v[v.length-1]:'')} placeholder="All Salesmen"
//               renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={18}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>
//           )}
//           <select className="sel" style={{fontSize:12}} value={overviewSort} onChange={e=>setOverviewSort(e.target.value)}>
//             <option value="achieved">Sort: Achieved</option>
//             <option value="target">Sort: Target</option>
//             <option value="pct">Sort: Achievement %</option>
//             <option value="name">Sort: Name A-Z</option>
//             <option value="status">Sort: Status</option>
//             <option value="category">Sort: Category</option>
//           </select>
//         </div>
//         <div className="scroll" style={{maxHeight:'50vh',overflowY:'auto'}}>
//           <table>
//             <thead>
//               <tr>
//                 <th style={{width:30}}>#</th>
//                 <th>Dealer Name</th>
//                 <th>Salesman</th>
//                 <th>Zone</th>
//                 <th>City / State</th>
//                 <th>Category</th>
//                 <th>Cat Type</th>
//                 <th>Status</th>
//                 <th style={{textAlign:'right'}}>Tgt</th>
//                 <th style={{textAlign:'right'}}>Ach</th>
//                 <th style={{textAlign:'right'}}>%</th>
//                 <th>Trend</th>
//                 <th>Sparkline</th>
//               </tr>
//             </thead>
//             <tbody>
//               {(()=>{
//                 let list=myD;
//                 if(overviewSearch)list=list.filter(x=>x.name.toLowerCase().includes(overviewSearch.toLowerCase())||(users[x.salesman]?.name||'').toLowerCase().includes(overviewSearch.toLowerCase()));
//                 if(overviewSm)list=list.filter(x=>x.salesman===overviewSm);
//                 list=[...list].sort((a,b)=>{
//                   if(overviewSort==='achieved')return b.achieved-a.achieved;
//                   if(overviewSort==='target')return b.target-a.target;
//                   if(overviewSort==='pct')return(pct(b.target,b.achieved)||0)-(pct(a.target,a.achieved)||0);
//                   if(overviewSort==='name')return a.name.localeCompare(b.name);
//                   if(overviewSort==='status')return(a.status||'').localeCompare(b.status||'');
//                   if(overviewSort==='category')return(a.category||'').localeCompare(b.category||'');
//                   return 0;
//                 });
//                 return list.map((x,i)=>{
//                   const p=pct(x.target,x.achieved);
//                   const tp=trendPct(x.months);
//                   const sm=users[x.salesman];
//                   return(
//                     <tr key={x.id} onClick={()=>onOpenDealer(x.id)} style={{cursor:'pointer'}}>
//                       <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
//                       <td style={{fontWeight:600,color:'var(--t1)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
//                       <td>{sm?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={sm} size={20}/><span style={{fontSize:12}}>{sm.name}</span></div>:<span style={{color:'var(--t3)'}}>—</span>}</td>
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t2)'}}>{[x.city,x.state].filter(Boolean).join(', ')||'—'}</td>
//                       <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
//                       <td><StatusBadge status={x.status}/></td>
//                       <td style={{textAlign:'right'}}>{x.target||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:600,color:x.achieved>0?'var(--t1)':'var(--t3)'}}>{x.achieved||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
//                       <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'inline-flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
//                       <td><MiniBars months={x.months} highlightIdx={selectedMonthIdx}/></td>
//                     </tr>
//                   );
//                 });
//               })()}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Popup */}
//       {(tierPopup||insightPopup)&&(()=>{
//         const popup=tierPopup||insightPopup;
//         const closePopup=()=>{setTierPopup(null);setInsightPopup(null);setPopupSearch('');};
//         const filteredList=popupSearch.trim()?popup.list.filter(d=>d.name.toLowerCase().includes(popupSearch.toLowerCase())):popup.list;
//         const pListForMonth=filteredList.map(d=>({...d,achieved:d.months[selectedMonthIdx]||0,target:(d.monthTargets?.[selectedMonthIdx] ?? d.target)}));
//         return(
//           <div className="overlay" onClick={e=>e.target===e.currentTarget&&closePopup()}>
//             <div className="modal" style={{maxWidth:1100,padding:0}}>
//               <div style={{padding:'20px 26px',background:`linear-gradient(135deg, ${popup.color}22, ${popup.color}08)`,borderBottom:`1px solid ${popup.color}33`,display:'flex',alignItems:'center',gap:14,position:'sticky',top:0,zIndex:5,flexWrap:'wrap'}}>
//                 <span style={{fontSize:32}}>{popup.icon}</span>
//                 <div style={{flex:1,minWidth:200}}>
//                   <div style={{fontSize:11,color:popup.color,fontWeight:700,letterSpacing:'.1em',marginBottom:2}}>{popup.label}</div>
//                   <div style={{fontSize:18,fontWeight:700}}>{popup.list.length} dealers <span style={{fontSize:12,color:'var(--t3)',fontWeight:400}}>· {popup.sub}</span></div>
//                 </div>
//                 <button onClick={closePopup} className="btn"><X size={14}/></button>
//               </div>
//               <div style={{padding:'12px 26px 0'}}>
//                 <div style={{position:'relative'}}>
//                   <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//                   <input className="inp" style={{paddingLeft:36}} placeholder={`Search ${popup.list.length} dealers...`} value={popupSearch} onChange={e=>setPopupSearch(e.target.value)}/>
//                 </div>
//               </div>
//               <div style={{padding:'12px 26px 26px'}}>
//                 <div className="scroll" style={{maxHeight:'70vh',overflowY:'auto',marginTop:4}}>
//                   <table>
//                     <thead>
//                       <tr>
//                         <th>#</th><th>Dealer Name</th><th>Salesman</th><th>Zone</th><th>City</th><th>State</th><th>Cat</th><th>Cat Type</th><th>Status</th>
//                         <th style={{textAlign:'right'}}>Tgt</th><th style={{textAlign:'right'}}>Ach</th><th style={{textAlign:'right'}}>%</th>
//                         <th style={{textAlign:'right'}}>6m Avg</th><th>Trend</th><th style={{textAlign:'right'}}>Fcst</th>
//                         {[...MO].map((_,di)=>{const i=MO.length-1-di;return<th key={i} style={{textAlign:'right',background:i===selectedMonthIdx?'rgba(99,102,241,.08)':'var(--bg1)'}}>{MO[i]}</th>;})}
//                         <th>Bars</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {[...pListForMonth].sort((a,b)=>b.achieved-a.achieved).map((x,idx)=>{
//                         const p=pct(x.target,x.achieved);const tp=trendPct(x.months);const fc=forecast(x.months);const sm=users[x.salesman];
//                         return(
//                           <tr key={x.id} onClick={()=>{onOpenDealer(x.id);closePopup();}} style={{cursor:'pointer'}}>
//                             <td style={{color:'var(--t3)',fontSize:11}}>{idx+1}</td>
//                             <td style={{fontWeight:600,color:'var(--t1)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
//                             <td>{sm?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={sm} size={18}/><span style={{fontSize:11}}>{sm.name}</span></div>:<span style={{color:'var(--t3)'}}>—</span>}</td>
//                             <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
//                             <td style={{fontSize:11}}>{x.city||'—'}</td>
//                             <td style={{fontSize:11}}>{x.state||'—'}</td>
//                             <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
//                             <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
//                             <td><StatusBadge status={x.status}/></td>
//                             <td style={{textAlign:'right'}}>{x.target||'—'}</td>
//                             <td style={{textAlign:'right',fontWeight:700,color:popup.color}}>{x.achieved}</td>
//                             <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
//                             <td style={{textAlign:'right',color:'var(--t3)'}}>{x.avg6m||'—'}</td>
//                             <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'inline-flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
//                             <td style={{textAlign:'right',color:'var(--acc)',fontWeight:600}}>{fc||'—'}</td>
//                             {[...x.months].map((_,di)=>{const i=x.months.length-1-di;const v=x.months[i];return<td key={i} style={{textAlign:'right',fontSize:12,color:i===selectedMonthIdx?'var(--acc)':v>0?'var(--t2)':'var(--t3)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{v||'—'}</td>;})}
//                             <td><MiniBars months={x.months} highlightIdx={selectedMonthIdx}/></td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       })()}
//     </div>
//   );
// };

// export default Overview;


// import React, { useState, useMemo } from 'react';
// import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
// import { Users, Target, Award, Activity, TrendingUp, Clock, Bell, AlertTriangle, Search, MapPin, Star, ArrowUpRight, ArrowDownRight, X, GripVertical, Hash } from 'lucide-react';
// import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
// import { pct, spct, pclr, trendPct, forecast } from '../utils';
// import { useMonth } from '../context';
// import { StatusBadge, Avatar, MiniBars, StatCard, MultiSelect } from './UI';
// import MapView from './MapView';
// import CategoryDrillChart from './CategoryDrillChart';

// const Overview=({dealers,currentUser,users,notes,onOpenDealer,onNavigate})=>{
//   const {selectedMonthIdx, MO:ctxMO}=useMonth();
//   const MO = ctxMO || MO_CONST;
//   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
//   const selMoFull=MO[selectedMonthIdx];

//   const dealersForMonth=useMemo(()=>dealers.map(d=>({
//     ...d,
//     achieved:d.months[selectedMonthIdx]||0,
//     target:(d.monthTargets?.[selectedMonthIdx] ?? d.target),
//   })),[dealers,selectedMonthIdx]);

//   const myD=dealersForMonth;
//   const [overviewSearch,setOverviewSearch]=useState('');
//   const [overviewSm,setOverviewSm]=useState('');
//   const [overviewSort,setOverviewSort]=useState('achieved');
//   const [attentionThreshold,setAttentionThreshold]=useState(60);
//   const [attentionDirection,setAttentionDirection]=useState('lt');
//   const [attentionExpanded,setAttentionExpanded]=useState(false);
//   const [geoFilter,setGeoFilter]=useState({city:'',state:''});
//   const [dealerSearch,setDealerSearch]=useState('');
//   const [showSearchResults,setShowSearchResults]=useState(false);
//   const [insightPopup,setInsightPopup]=useState(null);
//   const [tierPopup,setTierPopup]=useState(null);
//   const [popupSearch,setPopupSearch]=useState('');

//   // Drag-reorder for status sections
//   const CORE_STATUSES = ['ACTIVE','KEY ACCOUNT','ACHIVERS','ACHIEVERS','ACHIEVER','STAR'];
//   const [coreOrder,setCoreOrder]=useState(()=>{
//     try{ const s=JSON.parse(localStorage.getItem('stp_core_status_order')||'null'); if(s&&s.includes('KEY ACCOUNT'))return s; return ['ACTIVE','KEY ACCOUNT','ACHIVERS','ACHIEVERS','ACHIEVER','STAR']; }catch{ return ['ACTIVE','KEY ACCOUNT','ACHIVERS','ACHIEVERS','ACHIEVER','STAR']; }
//   });
//   const [otherOrder,setOtherOrder]=useState(null); // null = auto from data
//   const [dragStatus,setDragStatus]=useState(null);
//   const [dragSection,setDragSection]=useState(null);
//   const [overStatus,setOverStatus]=useState(null);

//   const allCitiesOv=useMemo(()=>[...new Set(dealers.map(x=>(x.city||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allStatesOv=useMemo(()=>[...new Set(dealers.map(x=>(x.state||'').trim()).filter(Boolean))].sort(),[dealers]);

//   const geoFilteredDealers=useMemo(()=>{
//     let d=dealers;
//     if(geoFilter.city)d=d.filter(x=>(x.city||'').toLowerCase()===geoFilter.city.toLowerCase());
//     if(geoFilter.state)d=d.filter(x=>(x.state||'').toLowerCase()===geoFilter.state.toLowerCase());
//     return d;
//   },[dealers,geoFilter]);

//   const dealerMatches=dealerSearch.trim()?myD.filter(d=>d.name.toLowerCase().includes(dealerSearch.toLowerCase())).slice(0,8):[];

//   const tt=myD.reduce((s,x)=>s+x.target,0);
//   const ta=myD.reduce((s,x)=>s+x.achieved,0);
//   const ap=pct(tt,ta);
//   // Full status breakdown for territory overview
//   const statusMap = {};
//   myD.forEach(x=>{ const s=(x.status||'OTHER').trim(); statusMap[s]=(statusMap[s]||0)+1; });
//   const active = (statusMap['ACTIVE']||0)+(statusMap['ACHIVERS']||0)+(statusMap['ACHIEVERS']||0)+(statusMap['KEY ACCOUNT']||0);
//   const inactive = (statusMap['INACTIVE']||0)+(statusMap['REACTIVE']||0);
//   const dead = statusMap['DEAD']||0;
//   const other = myD.length - active - inactive - dead;

//   // Insight calculations — ALL dealers, real thresholds
//   const risingList=dealers.filter(x=>trendPct(x.months)>30&&x.months.slice(-3).reduce((a,b)=>a+b,0)>0);
//   const decliningList=dealers.filter(x=>trendPct(x.months)<-20&&x.months.slice(-6,-3).reduce((a,b)=>a+b,0)>0);
//   const dormantList=dealers.filter(x=>x.months.slice(-3).reduce((a,b)=>a+b,0)===0&&x.months.slice(0,8).reduce((a,b)=>a+b,0)>0);
//   const recentlyInactiveList=dealers.filter(x=>x.months[CURRENT_MONTH_IDX]===0&&x.months.slice(0,CURRENT_MONTH_IDX).reduce((a,b)=>a+b,0)>0);
//   // Dead by data = zero for 6+ months; inactive by data = zero last 2-3 months
//   const inactiveByData=dealers.filter(x=>{const last3=x.months.slice(-3).reduce((a,b)=>a+b,0);const prev=x.months.slice(-6,-3).reduce((a,b)=>a+b,0);return last3===0&&prev>0;});
//   const deadByData=dealers.filter(x=>x.months.slice(-6).reduce((a,b)=>a+b,0)===0&&x.months.reduce((a,b)=>a+b,0)>0);
//   // Also count by status field
//   const inactiveByStatus=dealers.filter(x=>['INACTIVE','REACTIVE'].includes((x.status||'').toUpperCase()));
//   const deadByStatus=dealers.filter(x=>(x.status||'').toUpperCase()==='DEAD');
//   const overdueFollowups=notes.filter(n=>n.type==='followup'&&!n.completed&&new Date(n.dueDate)<new Date()).length;

//   const top5=[...myD].filter(x=>x.achieved>0).sort((a,b)=>b.achieved-a.achieved).slice(0,5);
//   const lowAll=myD.filter(x=>{
//     if(!x.target)return false;
//     const p=pct(x.target,x.achieved)||0;
//     return attentionDirection==='lt'?p<attentionThreshold:p>attentionThreshold;
//   }).sort((a,b)=>{
//     const pa=pct(a.target,a.achieved)||0,pb=pct(b.target,b.achieved)||0;
//     return attentionDirection==='lt'?pa-pb:pb-pa;
//   });
//   const low=attentionExpanded?lowAll:lowAll.slice(0,8);

//   const trendData=MO.map((m,i)=>({
//     month:m.slice(0,3),
//     units:geoFilteredDealers.reduce((s,d)=>s+(d.months[i]||0),0),
//   }));
//   const projected=trendData.slice(-3).reduce((s,d)=>s+d.units,0)/3;

//   const statusColorMap={'ACTIVE':'#34d399','ACHIVERS':'#10b981','KEY ACCOUNT':'#a78bfa','INACTIVE':'#fb923c','REACTIVE':'#f59e0b','DEAD':'#f87171','NEW':'#22d3ee','PROSPECT':'#818cf8'};
//   const fallbackPalette=['#6366f1','#34d399','#fbbf24','#f472b6','#22d3ee','#fb923c','#a78bfa','#f87171','#84cc16','#e879f9'];
//   const colorForStatus=(name,idx)=>statusColorMap[name.toUpperCase()]||fallbackPalette[idx%fallbackPalette.length];
//   const statusCounts=(()=>{
//     const map={};
//     myD.forEach(x=>{const s=(x.status||'—').trim()||'—';map[s]=(map[s]||0)+1;});
//     return Object.entries(map).map(([name,value],i)=>({name,value,color:colorForStatus(name,i)})).sort((a,b)=>b.value-a.value);
//   })();

//   const topPerformers=myD.filter(x=>x.achieved>250);
//   const priorityAccount=myD.filter(x=>x.achieved>=100&&x.achieved<=250);
//   const risingStar=myD.filter(x=>x.achieved>=50&&x.achieved<100);
//   const hasGeoFilter=geoFilter.city||geoFilter.state;
//   const viewingLabel=selectedMonthIdx===CURRENT_MONTH_IDX?`${selMoFull} (Current)`:selMoFull;

//   return(
//     <div className="fade">
//       <div style={{marginBottom:22}}>
//         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:4}}>
//           {viewingLabel}
//           {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{marginLeft:8,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4,fontSize:10}}>HISTORICAL VIEW</span>}
//         </div>
//         <div style={{fontSize:24,fontWeight:700,letterSpacing:'-0.02em'}}>
//           {currentUser.role==='admin'?'All Territories':'Your Territory'} — Overview
//         </div>
//       </div>

//       {/* Insight chips — all based on real data calculations */}
//       <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:18}}>
//         {risingList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'TRENDING UP',color:'#34d399',icon:'📈',sub:'sales up >30% last 3 vs prior 3 months',list:risingList})} style={{background:'rgba(52,211,153,0.1)',color:'#34d399',cursor:'pointer'}}><TrendingUp size={13}/> {risingList.length} dealers trending up</div>}
//         {decliningList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'DECLINING SHARPLY',color:'#f87171',icon:'📉',sub:'sales down >20% last 3 vs prior 3 months',list:decliningList})} style={{background:'rgba(248,113,113,0.1)',color:'#f87171',cursor:'pointer'}}><ArrowDownRight size={13}/> {decliningList.length} declining sharply</div>}
//         {dormantList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'DORMANT 3+ MONTHS',color:'#fbbf24',icon:'💤',sub:'zero sales last 3 months but had history',list:dormantList})} style={{background:'rgba(251,191,36,0.1)',color:'#fbbf24',cursor:'pointer'}}><Clock size={13}/> {dormantList.length} dormant 3+ months</div>}
//         {recentlyInactiveList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'REACTIVE',color:'#fb923c',icon:'⏸',sub:'no orders this month but had orders before',list:recentlyInactiveList})} style={{background:'rgba(251,146,60,0.1)',color:'#fb923c',cursor:'pointer'}}><Clock size={13}/> {recentlyInactiveList.length} recently inactive</div>}
//         {inactiveByStatus.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'INACTIVE (STATUS)',color:'#fbbf24',icon:'⚠️',sub:'marked as Inactive or Recently Inactive',list:inactiveByStatus})} style={{background:'rgba(251,191,36,0.08)',color:'#fbbf24',cursor:'pointer'}}><AlertTriangle size={13}/> {inactiveByStatus.length} inactive</div>}
//         {deadByStatus.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'DEAD CUSTOMERS',color:'#f87171',icon:'✕',sub:'marked as Dead',list:deadByStatus})} style={{background:'rgba(248,113,113,0.08)',color:'#f87171',cursor:'pointer'}}><X size={13}/> {deadByStatus.length} dead customers</div>}
//         {overdueFollowups>0&&<div className="insight-chip" onClick={()=>onNavigate('followups')} style={{background:'rgba(99,102,241,0.1)',color:'var(--acc)',cursor:'pointer'}}><Bell size={13}/> {overdueFollowups} overdue follow-ups</div>}
//       </div>

//       <div className="stat-grid">
//         <StatCard label="Total Dealers" value={myD.length} sub={`${active} active · ${inactive} inactive · ${dead} dead`} icon={Users}/>
//         <StatCard label={`${selMoLabel} Target`} value={tt} sub="total units" icon={Target}/>
//         <StatCard label={`${selMoLabel} Achieved`} value={ta} sub={`${selMoFull} total`} valueColor="#34d399" icon={Award}/>
//         <StatCard label="Achievement" value={spct(tt,ta)} valueColor={pclr(ap)} progress={ap} icon={Activity}/>
//       </div>

//       {/* Dealer quick search */}
//       <div className="card" style={{marginBottom:16,padding:'12px 16px'}}>
//         <div style={{position:'relative'}}>
//           <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//           <input className="inp" style={{paddingLeft:36}} placeholder="🔍 Search any dealer by name..."
//             value={dealerSearch} onChange={e=>{setDealerSearch(e.target.value);setShowSearchResults(true);}}
//             onFocus={()=>setShowSearchResults(true)}/>
//           {dealerSearch&&<button onClick={()=>{setDealerSearch('');setShowSearchResults(false);}}
//             style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t3)',cursor:'pointer'}}><X size={14}/></button>}
//           {showSearchResults&&dealerSearch&&(
//             <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:6,background:'var(--bg1)',border:'1px solid var(--b2)',borderRadius:8,zIndex:10,maxHeight:320,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
//               {dealerMatches.length>0?dealerMatches.map(d=>{
//                 const p=pct(d.target,d.achieved);const sm=users[d.salesman];
//                 return(
//                   <div key={d.id} onClick={()=>{onOpenDealer(d.id);setDealerSearch('');setShowSearchResults(false);}}
//                     style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:10}}
//                     onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
//                     onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
//                     <div style={{flex:1,minWidth:0}}>
//                       <div style={{fontSize:13,fontWeight:600,color:'var(--t1)',marginBottom:2}}>{d.name}</div>
//                       <div style={{display:'flex',gap:8,alignItems:'center',fontSize:11,color:'var(--t3)'}}>
//                         <StatusBadge status={d.status}/>
//                         {d.zone&&<span>· {d.zone}</span>}
//                         {(d.city||d.state)&&<span>· {[d.city,d.state].filter(Boolean).join(', ')}</span>}
//                         {d.category&&<span>· {d.category}</span>}
//                         {sm&&<span>· {sm.name}</span>}
//                       </div>
//                     </div>
//                     <div style={{textAlign:'right',fontSize:11}}>
//                       <div style={{color:'var(--t3)'}}>{selMoLabel}</div>
//                       <div style={{fontWeight:700,color:pclr(p)}}>{d.achieved}/{d.target} · {spct(d.target,d.achieved)}</div>
//                     </div>
//                   </div>
//                 );
//               }):<div style={{padding:16,color:'var(--t3)',fontSize:13,textAlign:'center'}}>No dealers match "{dealerSearch}"</div>}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Performance Tiers */}
//       <div className="card" style={{marginBottom:12}}>
//         <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
//           <Award size={14} color="#fbbf24"/> Performance Tiers
//           <span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:4}}>({selMoLabel} units · click to view)</span>
//         </div>
//         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
//           {[
//             {label:'TOP PERFORMER',sub:'> 250 units',count:topPerformers.length,color:'#fbbf24',icon:'⭐',list:topPerformers},
//             {label:'PRIORITY ACCOUNT',sub:'100 – 250 units',count:priorityAccount.length,color:'#a78bfa',icon:'◆',list:priorityAccount},
//             {label:'RISING STAR',sub:'50 – 100 units',count:risingStar.length,color:'#22d3ee',icon:'★',list:risingStar},
//           ].map(t=>(
//             <div key={t.label} onClick={()=>{if(t.list.length>0)setTierPopup(t);}}
//               style={{background:`linear-gradient(135deg, ${t.color}1a, ${t.color}08)`,border:`1px solid ${t.color}44`,borderRadius:12,padding:'14px 16px',cursor:'pointer',transition:'transform .15s'}}
//               onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
//               onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}>
//               <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
//                 <span style={{fontSize:18}}>{t.icon}</span>
//                 <div><div style={{fontSize:11,color:t.color,fontWeight:700}}>{t.label}</div><div style={{fontSize:10,color:'var(--t3)'}}>{t.sub}</div></div>
//               </div>
//               <div style={{fontSize:30,fontWeight:700,color:'var(--t1)',lineHeight:1,marginBottom:6}}>{t.count}<span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:6}}>dealers</span></div>
//               {t.list.slice(0,3).map(d=>(
//                 <span key={d.id} onClick={e=>{e.stopPropagation();onOpenDealer(d.id);}}
//                   style={{display:'inline-block',fontSize:10,padding:'2px 8px',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:4,color:'var(--t2)',cursor:'pointer',margin:'2px',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
//                   {d.name} · {d.achieved}
//                 </span>
//               ))}
//               {t.list.length>3&&<span style={{fontSize:10,color:'var(--t3)',marginLeft:4}}>+{t.list.length-3} more</span>}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* ── Status: TWO drag-reorder sections ── */}
//       {(()=>{
//         // Build map of all status counts
//         const smap={};
//         myD.forEach(x=>{const s=(x.status||'NONE').trim()||'NONE';smap[s]=(smap[s]||0)+1;});
//         const coreKeys=CORE_STATUSES.filter(s=>smap[s]>0);
//         const otherKeys=Object.keys(smap).filter(s=>!CORE_STATUSES.includes(s));
//         // Apply saved orders
//         const orderedCore=[...coreOrder.filter(s=>coreKeys.includes(s)),...coreKeys.filter(s=>!coreOrder.includes(s))];
//         const savedOther=otherOrder||[...otherKeys];
//         const orderedOther=[...savedOther.filter(s=>otherKeys.includes(s)),...otherKeys.filter(s=>!savedOther.includes(s))];

//         const dragStart=(e,s,sec)=>{setDragStatus(s);setDragSection(sec);e.dataTransfer.effectAllowed='move';};
//         const dragOver=(e,s)=>{e.preventDefault();setOverStatus(s);};
//         const dragEnd=()=>{setDragStatus(null);setDragSection(null);setOverStatus(null);};
//         const reorder=(arr,from,to)=>{const a=[...arr];const fi=a.indexOf(from),ti=a.indexOf(to);if(fi<0||ti<0)return arr;a.splice(fi,1);a.splice(ti,0,from);return a;};
//         const drop=(e,target,targetSec)=>{
//           e.preventDefault();
//           if(!dragStatus||dragStatus===target)return;
//           const fromSec=dragSection;
//           if(fromSec===targetSec){
//             if(targetSec==='core'){const n=reorder(orderedCore,dragStatus,target);setCoreOrder(n);localStorage.setItem('stp_core_status_order',JSON.stringify(n));}
//             else{setOtherOrder(reorder(orderedOther,dragStatus,target));}
//           } else if(targetSec==='core'){
//             const newOther=orderedOther.filter(s=>s!==dragStatus);
//             const newCore=[...orderedCore];
//             const ti=newCore.indexOf(target);
//             newCore.splice(ti>=0?ti:newCore.length,0,dragStatus);
//             setCoreOrder(newCore);setOtherOrder(newOther);
//             localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));
//           } else {
//             const newCore=orderedCore.filter(s=>s!==dragStatus);
//             const newOther=[...orderedOther];
//             const ti=newOther.indexOf(target);
//             newOther.splice(ti>=0?ti:newOther.length,0,dragStatus);
//             setCoreOrder(newCore);setOtherOrder(newOther);
//             localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));
//           }
//           setDragStatus(null);setDragSection(null);setOverStatus(null);
//         };
//         const StatusCard=({s,sec})=>{
//           const v=smap[s]||0;
//           const pctOfTotal=myD.length?Math.round((v/myD.length)*100):0;
//           const clr=statusColorMap[s.toUpperCase()]||fallbackPalette[Object.keys(smap).indexOf(s)%fallbackPalette.length];
//           const isOver=overStatus===s&&dragStatus&&dragStatus!==s;
//           return(
//             <div draggable onDragStart={e=>dragStart(e,s,sec)} onDragOver={e=>dragOver(e,s)} onDrop={e=>drop(e,s,sec)} onDragEnd={dragEnd}
//               onClick={()=>onNavigate('dealers',{status:s})}
//               style={{background:isOver?clr+'30':clr+'14',border:`1px solid ${isOver?clr:clr+'33'}`,borderRadius:10,padding:'12px 14px',cursor:'pointer',
//                 opacity:dragStatus===s?0.5:1,transition:'all .15s',position:'relative'}}>
//               <div style={{position:'absolute',top:6,right:6,opacity:0.3,cursor:'grab'}}><GripVertical size={10}/></div>
//               <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
//                 <span style={{width:8,height:8,borderRadius:'50%',background:clr,flexShrink:0}}/>
//                 <span style={{fontSize:11,color:clr,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s}</span>
//               </div>
//               <div style={{fontSize:24,fontWeight:700,color:'var(--t1)',lineHeight:1}}>{v}<span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:6}}>{pctOfTotal}%</span></div>
//               <div style={{height:3,background:'var(--b1)',borderRadius:2,marginTop:8,overflow:'hidden'}}>
//                 <div style={{height:'100%',width:pctOfTotal+'%',background:clr,borderRadius:2,transition:'width .8s ease'}}/>
//               </div>
//             </div>
//           );
//         };
//         return(<>
//           {orderedCore.length>0&&(
//             <div className="card" style={{marginBottom:12}}>
//               <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
//                 <Star size={14} color="#34d399"/> Core Status
//                 <span style={{fontSize:11,color:'var(--t3)',fontWeight:400}}>(drag to reorganize · click to filter)</span>
//               </div>
//               <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}
//                 onDragOver={e=>e.preventDefault()}
//                 onDrop={e=>{ if(dragSection==='other'&&dragStatus){ const newOther=orderedOther.filter(s=>s!==dragStatus);const newCore=[...orderedCore,dragStatus];setCoreOrder(newCore);setOtherOrder(newOther);localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));setDragStatus(null);setDragSection(null);setOverStatus(null); } }}>
//                 {orderedCore.map(s=><StatusCard key={s} s={s} sec="core"/>)}
//               </div>
//             </div>
//           )}
//           {orderedOther.length>0&&(
//             <div className="card" style={{marginBottom:12}}>
//               <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
//                 <Hash size={14} color="var(--t3)"/> Other Statuses
//                 <span style={{fontSize:11,color:'var(--t3)',fontWeight:400}}>({orderedOther.length} · drag to reorganize)</span>
//               </div>
//               <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}
//                 onDragOver={e=>e.preventDefault()}
//                 onDrop={e=>{ if(dragSection==='core'&&dragStatus){ const newCore=orderedCore.filter(s=>s!==dragStatus);const newOther=[...orderedOther,dragStatus];setCoreOrder(newCore);setOtherOrder(newOther);localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));setDragStatus(null);setDragSection(null);setOverStatus(null); } }}>
//                 {orderedOther.map(s=><StatusCard key={s} s={s} sec="other"/>)}
//               </div>
//             </div>
//           )}
//         </>);
//       })()}

//       {/* Map View */}
//       <MapView dealers={dealers} selectedMonthIdx={selectedMonthIdx}/>

//       {/* Category drill chart */}
//       <CategoryDrillChart dealers={dealers} selectedMonthIdx={selectedMonthIdx} onNavigate={onNavigate}/>

//       {/* Geo filter */}
//       {(allCitiesOv.length>0||allStatesOv.length>0)&&(
//         <div className="card" style={{marginBottom:16,padding:'12px 16px'}}>
//           {/* <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
//             <MapPin size={13} color="var(--acc)"/> Geography Filter
//             {hasGeoFilter&&<button onClick={()=>setGeoFilter({city:'',state:''})} className="btn" style={{fontSize:10,padding:'2px 8px',marginLeft:'auto',color:'var(--red)'}}><X size={10} style={{display:'inline',verticalAlign:'middle'}}/> Clear</button>}
//           </div> */}
//           {/* <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
//             {allStatesOv.map(s=>(
//               <button key={s} onClick={()=>setGeoFilter(f=>({...f,state:f.state===s?'':s,city:''}))} className="btn"
//                 style={{fontSize:11,padding:'4px 10px',background:geoFilter.state===s?'var(--accL)':'var(--bg2)',color:geoFilter.state===s?'var(--acc)':'var(--t2)',borderColor:geoFilter.state===s?'var(--acc)':'var(--b2)'}}>
//                 {s}
//               </button>
//             ))}
//             {allCitiesOv.map(c=>(
//               <button key={c} onClick={()=>setGeoFilter(f=>({...f,city:f.city===c?'':c}))} className="btn"
//                 style={{fontSize:11,padding:'4px 10px',background:geoFilter.city===c?'rgba(34,211,238,0.15)':'var(--bg2)',color:geoFilter.city===c?'#22d3ee':'var(--t2)',borderColor:geoFilter.city===c?'#22d3ee':'var(--b2)'}}>
//                 {c}
//               </button>
//             ))}
//           </div> */}
//         </div>
//       )}

//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16,marginBottom:16}}>
//         <div className="card">
//           <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
//             <div style={{fontSize:13,fontWeight:600,color:'var(--t2)'}}>
//               11-Month Sales Trend
//               {hasGeoFilter&&<span style={{fontSize:10,color:'var(--acc)',marginLeft:6}}>({geoFilter.state||''}{geoFilter.city?(geoFilter.state?' · ':'')+geoFilter.city:''})</span>}
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)'}}>Forecast: <strong style={{color:'var(--acc)'}}>{Math.round(projected)}</strong></div>
//           </div>
//           <ResponsiveContainer width="100%" height={200}>
//             <AreaChart data={trendData}>
//               <defs>
//                 <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
//                   <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
//                   <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
//                 </linearGradient>
//               </defs>
//               <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
//               <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}} stroke="var(--b2)"/>
//               <YAxis tick={{fill:'var(--t3)',fontSize:11}} stroke="var(--b2)"/>
//               <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
//               <Area type="monotone" dataKey="units" stroke="#6366f1" strokeWidth={2} fill="url(#grad1)" label={{position:'top',fill:'var(--t2)',fontSize:10}}/>
//               <ReferenceLine x={MO[selectedMonthIdx].slice(0,3)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 3"/>
//             </AreaChart>
//           </ResponsiveContainer>
//         </div>
//         <div className="card">
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>Status Distribution</div>
//           <ResponsiveContainer width="100%" height={200}>
//             <PieChart>
//               <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value"
//                 onClick={d=>onNavigate('dealers',{status:d.name})} style={{cursor:'pointer'}}
//                 label={({value})=>value}>
//                 {statusCounts.map((d,i)=><Cell key={i} fill={d.color}/>)}
//               </Pie>
//               <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
//               <Legend wrapperStyle={{fontSize:11}} iconType="circle"/>
//             </PieChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14,marginBottom:14}}>
//         <div className="card">
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>🏆 Top 5 — {selMoLabel}</div>
//           {top5.length>0?top5.map((x,i)=>{
//             const p=pct(x.target,x.achieved);
//             return(
//               <div key={x.id} onClick={()=>onOpenDealer(x.id)}
//                 style={{display:'flex',alignItems:'center',gap:10,marginBottom:11,cursor:'pointer',padding:'4px 6px',borderRadius:6,transition:'background .15s'}}
//                 onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
//                 onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
//                 <span style={{fontSize:12,color:'var(--t3)',width:14,textAlign:'right'}}>{i+1}</span>
//                 <div style={{flex:1,minWidth:0}}>
//                   <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
//                     <span style={{fontSize:12,color:'var(--t1)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{x.name}</span>
//                     <span style={{fontSize:12,fontWeight:700,color:pclr(p),marginLeft:6}}>{spct(x.target,x.achieved)}</span>
//                   </div>
//                   <div style={{height:4,background:'var(--b1)',borderRadius:2,overflow:'hidden'}}>
//                     <div style={{height:'100%',width:`${Math.min(p||0,100)}%`,background:pclr(p),borderRadius:2,transition:'width .8s ease'}}/>
//                   </div>
//                 </div>
//                 <span style={{fontSize:12,color:'var(--t3)',width:22,textAlign:'right'}}>{x.achieved}</span>
//               </div>
//             );
//           }):<div style={{color:'var(--t3)',fontSize:13,padding:'10px 0'}}>No data yet</div>}
//         </div>

//         <div className="card">
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>📊 Achievement Distribution</div>
//           {(()=>{
//             const buckets={'0%':0,'1-50%':0,'51-99%':0,'100%+':0};
//             myD.forEach(x=>{if(!x.target)return;const p=pct(x.target,x.achieved)||0;if(p===0)buckets['0%']++;else if(p<51)buckets['1-50%']++;else if(p<100)buckets['51-99%']++;else buckets['100%+']++;});
//             const colors={'0%':'#f87171','1-50%':'#fb923c','51-99%':'#fbbf24','100%+':'#34d399'};
//             const data=Object.entries(buckets).map(([k,v])=>({name:k,value:v,fill:colors[k]}));
//             return(
//               <ResponsiveContainer width="100%" height={180}>
//                 <BarChart data={data}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
//                   <XAxis dataKey="name" tick={{fill:'var(--t3)',fontSize:11}}/>
//                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
//                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
//                   <Bar dataKey="value" radius={[4,4,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:11,fontWeight:600}}>
//                     {data.map((d,i)=><Cell key={i} fill={d.fill}/>)}
//                   </Bar>
//                 </BarChart>
//               </ResponsiveContainer>
//             );
//           })()}
//         </div>
//       </div>

//       {/* Needs Attention */}
//       <div className="card">
//         <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:10}}>
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
//             <AlertTriangle size={14} color={attentionDirection==='lt'?'#fbbf24':'#34d399'}/>
//             {attentionDirection==='lt'?'Needs Attention':'High Performers'} — {attentionDirection==='lt'?'below':'above'} {attentionThreshold}%
//             <span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:4}}>({lowAll.length} dealers)</span>
//           </div>
//           <div className="spacer"/>
//           <div className="row" style={{gap:4,flexWrap:'wrap'}}>
//             <div style={{display:'flex',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:6,overflow:'hidden'}}>
//               <button onClick={()=>setAttentionDirection('lt')} style={{background:attentionDirection==='lt'?'#fbbf24':'transparent',color:attentionDirection==='lt'?'#1a1a2e':'var(--t2)',border:'none',padding:'4px 12px',fontSize:12,fontWeight:700,cursor:'pointer'}}>&lt; Below</button>
//               <button onClick={()=>setAttentionDirection('gt')} style={{background:attentionDirection==='gt'?'#34d399':'transparent',color:attentionDirection==='gt'?'#1a1a2e':'var(--t2)',border:'none',padding:'4px 12px',fontSize:12,fontWeight:700,cursor:'pointer',borderLeft:'1px solid var(--b2)'}}>&gt; Above</button>
//             </div>
//             {[50,60,75,90,100].map(t=>{
//               const ac=attentionDirection==='lt'?'#fbbf24':'#34d399';
//               return(<button key={t} onClick={()=>setAttentionThreshold(t)}
//                 style={{background:attentionThreshold===t?ac:'var(--bg2)',color:attentionThreshold===t?'#1a1a2e':'var(--t2)',border:`1px solid ${attentionThreshold===t?ac:'var(--b2)'}`,borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:attentionThreshold===t?700:500,cursor:'pointer'}}>
//                 {attentionDirection==='lt'?'<':'>'}{t}%
//               </button>);
//             })}
//           </div>
//         </div>
//         {lowAll.length>0?(
//           <>
//             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10}}>
//               {low.map(x=>{
//                 const p=pct(x.target,x.achieved)||0;
//                 const sm=users[x.salesman];
//                 const cardClr=attentionDirection==='lt'?(p<30?'#f87171':p<60?'#fb923c':'#fbbf24'):(p>=150?'#34d399':p>=100?'#22d3ee':'#a78bfa');
//                 return(
//                   <div key={x.id} onClick={()=>onOpenDealer(x.id)}
//                     style={{background:cardClr+'14',border:`1px solid ${cardClr}33`,borderRadius:8,padding:'11px 13px',cursor:'pointer',transition:'transform .15s'}}
//                     onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
//                     onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
//                     <div style={{fontSize:12,color:'var(--t1)',fontWeight:500,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{x.name}</div>
//                     <div style={{fontSize:20,fontWeight:700,color:cardClr}}>{spct(x.target,x.achieved)}</div>
//                     <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{x.achieved}/{x.target} units</div>
//                     {x.category&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{x.category}</div>}
//                     {currentUser.role==='admin'&&sm&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2,display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:sm.color}}/>{sm.name}</div>}
//                     <div style={{marginTop:6}}><MiniBars months={x.months} highlightIdx={selectedMonthIdx}/></div>
//                   </div>
//                 );
//               })}
//             </div>
//             {lowAll.length>8&&<div style={{marginTop:12,textAlign:'center'}}><button onClick={()=>setAttentionExpanded(e=>!e)} className="btn" style={{fontSize:12}}>{attentionExpanded?`Show fewer`:`Show all ${lowAll.length} dealers`}</button></div>}
//           </>
//         ):<div style={{color:'var(--t3)',textAlign:'center',padding:20,fontSize:13}}>🎉 No dealers {attentionDirection==='lt'?'below':'above'} {attentionThreshold}%</div>}
//       </div>

//       {/* All dealers table */}
//       <div className="card" style={{marginTop:14}}>
//         <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:8}}>
//           <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}><Users size={14}/> All Dealers ({myD.length})</div>
//           <div className="spacer"/>
//           <div style={{position:'relative'}}>
//             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Quick search..." value={overviewSearch} onChange={e=>setOverviewSearch(e.target.value)}/>
//           </div>
//           {currentUser.role==='admin'&&(
//             <MultiSelect options={Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id)} selected={overviewSm?[overviewSm]:[]}
//               onChange={v=>setOverviewSm(v.length?v[v.length-1]:'')} placeholder="All Salesmen"
//               renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={18}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>
//           )}
//           <select className="sel" style={{fontSize:12}} value={overviewSort} onChange={e=>setOverviewSort(e.target.value)}>
//             <option value="achieved">Sort: Achieved</option>
//             <option value="target">Sort: Target</option>
//             <option value="pct">Sort: Achievement %</option>
//             <option value="name">Sort: Name A-Z</option>
//             <option value="status">Sort: Status</option>
//             <option value="category">Sort: Category</option>
//           </select>
//         </div>
//         <div className="scroll" style={{maxHeight:'50vh',overflowY:'auto'}}>
//           <table>
//             <thead>
//               <tr>
//                 <th style={{width:30}}>#</th>
//                 <th>Dealer Name</th>
//                 <th>Salesman</th>
//                 <th>Zone</th>
//                 <th>City / State</th>
//                 <th>Category</th>
//                 <th>Cat Type</th>
//                 <th>Status</th>
//                 <th style={{textAlign:'right'}}>Tgt</th>
//                 <th style={{textAlign:'right'}}>Ach</th>
//                 <th style={{textAlign:'right'}}>%</th>
//                 <th>Trend</th>
//                 <th>Sparkline</th>
//               </tr>
//             </thead>
//             <tbody>
//               {(()=>{
//                 let list=myD;
//                 if(overviewSearch)list=list.filter(x=>x.name.toLowerCase().includes(overviewSearch.toLowerCase())||(users[x.salesman]?.name||'').toLowerCase().includes(overviewSearch.toLowerCase()));
//                 if(overviewSm)list=list.filter(x=>x.salesman===overviewSm);
//                 list=[...list].sort((a,b)=>{
//                   if(overviewSort==='achieved')return b.achieved-a.achieved;
//                   if(overviewSort==='target')return b.target-a.target;
//                   if(overviewSort==='pct')return(pct(b.target,b.achieved)||0)-(pct(a.target,a.achieved)||0);
//                   if(overviewSort==='name')return a.name.localeCompare(b.name);
//                   if(overviewSort==='status')return(a.status||'').localeCompare(b.status||'');
//                   if(overviewSort==='category')return(a.category||'').localeCompare(b.category||'');
//                   return 0;
//                 });
//                 return list.map((x,i)=>{
//                   const p=pct(x.target,x.achieved);
//                   const tp=trendPct(x.months);
//                   const sm=users[x.salesman];
//                   return(
//                     <tr key={x.id} onClick={()=>onOpenDealer(x.id)} style={{cursor:'pointer'}}>
//                       <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
//                       <td style={{fontWeight:600,color:'var(--t1)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
//                       <td>{sm?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={sm} size={20}/><span style={{fontSize:12}}>{sm.name}</span></div>:<span style={{color:'var(--t3)'}}>—</span>}</td>
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t2)'}}>{[x.city,x.state].filter(Boolean).join(', ')||'—'}</td>
//                       <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
//                       <td><StatusBadge status={x.status}/></td>
//                       <td style={{textAlign:'right'}}>{x.target||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:600,color:x.achieved>0?'var(--t1)':'var(--t3)'}}>{x.achieved||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
//                       <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'inline-flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
//                       <td><MiniBars months={x.months} highlightIdx={selectedMonthIdx}/></td>
//                     </tr>
//                   );
//                 });
//               })()}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Popup */}
//       {(tierPopup||insightPopup)&&(()=>{
//         const popup=tierPopup||insightPopup;
//         const closePopup=()=>{setTierPopup(null);setInsightPopup(null);setPopupSearch('');};
//         const filteredList=popupSearch.trim()?popup.list.filter(d=>d.name.toLowerCase().includes(popupSearch.toLowerCase())):popup.list;
//         const pListForMonth=filteredList.map(d=>({...d,achieved:d.months[selectedMonthIdx]||0,target:(d.monthTargets?.[selectedMonthIdx] ?? d.target)}));
//         return(
//           <div className="overlay" onClick={e=>e.target===e.currentTarget&&closePopup()}>
//             <div className="modal" style={{maxWidth:1100,padding:0}}>
//               <div style={{padding:'20px 26px',background:`linear-gradient(135deg, ${popup.color}22, ${popup.color}08)`,borderBottom:`1px solid ${popup.color}33`,display:'flex',alignItems:'center',gap:14,position:'sticky',top:0,zIndex:5,flexWrap:'wrap'}}>
//                 <span style={{fontSize:32}}>{popup.icon}</span>
//                 <div style={{flex:1,minWidth:200}}>
//                   <div style={{fontSize:11,color:popup.color,fontWeight:700,letterSpacing:'.1em',marginBottom:2}}>{popup.label}</div>
//                   <div style={{fontSize:18,fontWeight:700}}>{popup.list.length} dealers <span style={{fontSize:12,color:'var(--t3)',fontWeight:400}}>· {popup.sub}</span></div>
//                 </div>
//                 <button onClick={closePopup} className="btn"><X size={14}/></button>
//               </div>
//               <div style={{padding:'12px 26px 0'}}>
//                 <div style={{position:'relative'}}>
//                   <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//                   <input className="inp" style={{paddingLeft:36}} placeholder={`Search ${popup.list.length} dealers...`} value={popupSearch} onChange={e=>setPopupSearch(e.target.value)}/>
//                 </div>
//               </div>
//               <div style={{padding:'12px 26px 26px'}}>
//                 <div className="scroll" style={{maxHeight:'70vh',overflowY:'auto',marginTop:4}}>
//                   <table>
//                     <thead>
//                       <tr>
//                         <th>#</th><th>Dealer Name</th><th>Salesman</th><th>Zone</th><th>City</th><th>State</th><th>Cat</th><th>Cat Type</th><th>Status</th>
//                         <th style={{textAlign:'right'}}>Tgt</th><th style={{textAlign:'right'}}>Ach</th><th style={{textAlign:'right'}}>%</th>
//                         <th style={{textAlign:'right'}}>6m Avg</th><th>Trend</th><th style={{textAlign:'right'}}>Fcst</th>
//                         {[...MO].map((_,di)=>{const i=MO.length-1-di;return<th key={i} style={{textAlign:'right',background:i===selectedMonthIdx?'rgba(99,102,241,.08)':'var(--bg1)'}}>{MO[i]}</th>;})}
//                         <th>Bars</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {[...pListForMonth].sort((a,b)=>b.achieved-a.achieved).map((x,idx)=>{
//                         const p=pct(x.target,x.achieved);const tp=trendPct(x.months);const fc=forecast(x.months);const sm=users[x.salesman];
//                         return(
//                           <tr key={x.id} onClick={()=>{onOpenDealer(x.id);closePopup();}} style={{cursor:'pointer'}}>
//                             <td style={{color:'var(--t3)',fontSize:11}}>{idx+1}</td>
//                             <td style={{fontWeight:600,color:'var(--t1)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
//                             <td>{sm?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={sm} size={18}/><span style={{fontSize:11}}>{sm.name}</span></div>:<span style={{color:'var(--t3)'}}>—</span>}</td>
//                             <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
//                             <td style={{fontSize:11}}>{x.city||'—'}</td>
//                             <td style={{fontSize:11}}>{x.state||'—'}</td>
//                             <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
//                             <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
//                             <td><StatusBadge status={x.status}/></td>
//                             <td style={{textAlign:'right'}}>{x.target||'—'}</td>
//                             <td style={{textAlign:'right',fontWeight:700,color:popup.color}}>{x.achieved}</td>
//                             <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
//                             <td style={{textAlign:'right',color:'var(--t3)'}}>{x.avg6m||'—'}</td>
//                             <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'inline-flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
//                             <td style={{textAlign:'right',color:'var(--acc)',fontWeight:600}}>{fc||'—'}</td>
//                             {[...x.months].map((_,di)=>{const i=x.months.length-1-di;const v=x.months[i];return<td key={i} style={{textAlign:'right',fontSize:12,color:i===selectedMonthIdx?'var(--acc)':v>0?'var(--t2)':'var(--t3)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{v||'—'}</td>;})}
//                             <td><MiniBars months={x.months} highlightIdx={selectedMonthIdx}/></td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       })()}
//     </div>
//   );
// };

// export default Overview;



import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Users, Target, Award, Activity, TrendingUp, Clock, Bell, AlertTriangle, Search, MapPin, Star, ArrowUpRight, ArrowDownRight, X, GripVertical, Hash } from 'lucide-react';
import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
import { pct, spct, pclr, trendPct, forecast, monthTarget } from '../utils';
import { useMonth } from '../context';
import { StatusBadge, Avatar, MiniBars, StatCard, MultiSelect } from './UI';
import MapView from './MapView';
import CategoryDrillChart from './CategoryDrillChart';
import CategorySalesPanel from './CategorySalesPanel';
import CategoryFilter from './CategoryFilter';
import { useGlobalCategoryFilter } from '../hooks/useGlobalCategoryFilter';
import { api } from '../api';

// MO label like "Jun-26" → YYYY-MM ("2026-06") used by the Sales collection.
const _moMonths = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function _moLabelToYM(lbl) {
  if (!lbl) return '';
  const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(String(lbl).trim());
  if (!m) return '';
  const mi = _moMonths.indexOf(m[1].slice(0,3).toLowerCase());
  if (mi < 0) return '';
  let y = +m[2]; if (y < 100) y += 2000;
  return `${y}-${String(mi+1).padStart(2,'0')}`;
}

const Overview=({dealers,currentUser,users,notes,onOpenDealer,onNavigate})=>{
  const {selectedMonthIdx, MO:ctxMO}=useMonth();
  const MO = ctxMO || MO_CONST;
  const selMoLabel=MO[selectedMonthIdx].slice(0,3);
  const selMoFull=MO[selectedMonthIdx];

  // ── Category-wise sales for the selected month — fetched from the Sale
  // collection. Used for (a) the include/exclude filter, (b) adjusting the
  // Achieved KPI, AND (c) adjusting every dealer's per-month achieved value
  // so the status chips (trending up, dormant, top performer, …) recompute
  // based on just the selected categories.
  const [catRowsMo,   setCatRowsMo]   = useState([]);   // [{category, subCategory, qty}]
  const [dealerCatMo, setDealerCatMo] = useState([]);   // [{dealer, byCategory, total}]
  useEffect(() => {
    const ym = _moLabelToYM(selMoFull);
    if (!ym) { setCatRowsMo([]); setDealerCatMo([]); return; }
    let cancelled = false;
    api.salesByCategory({ month: ym })
      .then(r => { if (!cancelled) setCatRowsMo(r.rows || []); })
      .catch(() => { if (!cancelled) setCatRowsMo([]); });
    api.salesByDealer({ month: ym })
      .then(r => { if (!cancelled) setDealerCatMo(r.rows || []); })
      .catch(() => { if (!cancelled) setDealerCatMo([]); });
    return () => { cancelled = true; };
  }, [selMoFull]);

  // Map dealerName.lower → { categoryName: qty } so we can subtract excluded
  // categories' qty from each dealer's current-month achieved.
  const dealerCatMap = useMemo(() => {
    const m = new Map();
    for (const r of dealerCatMo) {
      const subs = r.byCategory || {};
      const perCat = {};
      for (const [cat, subMap] of Object.entries(subs)) {
        perCat[cat] = Object.values(subMap).reduce((s,v) => s + (v||0), 0);
      }
      m.set(String(r.dealer || '').toLowerCase().trim(), perCat);
    }
    return m;
  }, [dealerCatMo]);

  const allCatTotals = useMemo(() => {
    const m = new Map();
    for (const r of catRowsMo) m.set(r.category, (m.get(r.category)||0) + (r.qty||0));
    return [...m.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a,b) => b.total - a.total);
  }, [catRowsMo]);

  // Global filter shared with Sales by Category, Admin Panel, DealerModal etc.
  const { excluded: catExcluded, toggle: toggleCatExcluded, clear: clearCatExcluded, set: setCatExcluded }
    = useGlobalCategoryFilter();
  const excludedQty = useMemo(
    () => allCatTotals.filter(t => catExcluded.has(t.category)).reduce((s,t) => s + t.total, 0),
    [allCatTotals, catExcluded],
  );

  // `dealers` is already category-filtered by the App-level useFilteredDealers
  // hook — it substituted dealer.months[currentMonthIdx] with the filtered
  // achieved before this component ever saw it. So just read it straight.
  const dealersForMonth=useMemo(()=>dealers.map(d=>({
    ...d,
    achieved: d.months[selectedMonthIdx] || 0,
    target:   monthTarget(d, selectedMonthIdx),
  })),[dealers,selectedMonthIdx]);

  const myD=dealersForMonth;
  const [overviewSearch,setOverviewSearch]=useState('');
  const [overviewSm,setOverviewSm]=useState('');
  const [overviewSort,setOverviewSort]=useState('achieved');
  const [attentionThreshold,setAttentionThreshold]=useState(60);
  const [attentionDirection,setAttentionDirection]=useState('lt');
  const [attentionExpanded,setAttentionExpanded]=useState(false);
  const [geoFilter,setGeoFilter]=useState({city:'',state:''});
  const [dealerSearch,setDealerSearch]=useState('');
  const [showSearchResults,setShowSearchResults]=useState(false);
  const [insightPopup,setInsightPopup]=useState(null);
  const [tierPopup,setTierPopup]=useState(null);
  const [popupSearch,setPopupSearch]=useState('');

  // Drag-reorder for status sections
  const CORE_STATUSES = ['ACTIVE','KEY ACCOUNT','ACHIVERS','ACHIEVERS','ACHIEVER','STAR'];
  const [coreOrder,setCoreOrder]=useState(()=>{
    try{ const s=JSON.parse(localStorage.getItem('stp_core_status_order')||'null'); if(s&&s.includes('KEY ACCOUNT'))return s; return ['ACTIVE','KEY ACCOUNT','ACHIVERS','ACHIEVERS','ACHIEVER','STAR']; }catch{ return ['ACTIVE','KEY ACCOUNT','ACHIVERS','ACHIEVERS','ACHIEVER','STAR']; }
  });
  const [otherOrder,setOtherOrder]=useState(null); // null = auto from data
  const [dragStatus,setDragStatus]=useState(null);
  const [dragSection,setDragSection]=useState(null);
  const [overStatus,setOverStatus]=useState(null);

  const allCitiesOv=useMemo(()=>[...new Set(dealers.map(x=>(x.city||'').trim()).filter(Boolean))].sort(),[dealers]);
  const allStatesOv=useMemo(()=>[...new Set(dealers.map(x=>(x.state||'').trim()).filter(Boolean))].sort(),[dealers]);

  const geoFilteredDealers=useMemo(()=>{
    let d=dealers;
    if(geoFilter.city)d=d.filter(x=>(x.city||'').toLowerCase()===geoFilter.city.toLowerCase());
    if(geoFilter.state)d=d.filter(x=>(x.state||'').toLowerCase()===geoFilter.state.toLowerCase());
    return d;
  },[dealers,geoFilter]);

  const dealerMatches=dealerSearch.trim()?myD.filter(d=>d.name.toLowerCase().includes(dealerSearch.toLowerCase())).slice(0,8):[];

  const tt=myD.reduce((s,x)=>s+x.target,0);
  // myD.achieved is ALREADY category-filtered (subtractions happen in
  // dealersForMonth above), so summing it directly gives the correct filtered
  // total. Don't double-subtract excludedQty again.
  const ta=myD.reduce((s,x)=>s+x.achieved,0);
  // For the "(−X)" sub-text on the KPI card, compute the delta directly from
  // the per-dealer category map — sum of every excluded category's qty across
  // all dealers. This is the exact amount removed from the visible total.
  const filteredDelta = useMemo(() => {
    if (!catExcluded || catExcluded.size === 0) return 0;
    let sum = 0;
    for (const perCat of dealerCatMap.values()) {
      for (const c of catExcluded) sum += (perCat[c] || 0);
    }
    return sum;
  }, [catExcluded, dealerCatMap]);
  const ap=pct(tt,ta);
  // Full status breakdown for territory overview
  const statusMap = {};
  myD.forEach(x=>{ const s=(x.status||'OTHER').trim(); statusMap[s]=(statusMap[s]||0)+1; });
  const active = (statusMap['ACTIVE']||0)+(statusMap['ACHIVERS']||0)+(statusMap['ACHIEVERS']||0)+(statusMap['KEY ACCOUNT']||0);
  const inactive = (statusMap['INACTIVE']||0)+(statusMap['REACTIVE']||0);
  const dead = statusMap['DEAD']||0;
  const other = myD.length - active - inactive - dead;

  // Insight calculations — ALL dealers, real thresholds
  // Smart trend that works regardless of how many empty future months are in
  // the MO array. We find each dealer's latest month with actual data and
  // compare to the previous month with data, not blindly to MO's last index.
  const monthlyTrend = (months) => {
    if(!Array.isArray(months) || months.length === 0) return 0;
    // Latest non-zero month
    let latest = -1;
    for(let i = months.length - 1; i >= 0; i--){
      if(Number(months[i]) > 0){ latest = i; break; }
    }
    if(latest < 0) return 0;   // dealer has no data at all
    const cur = Number(months[latest]) || 0;
    // Previous month (any value, including 0 — but only if it makes sense)
    if(latest === 0) return cur > 0 ? 100 : 0;
    const prev = Number(months[latest - 1]) || 0;
    if(!prev) return cur > 0 ? 100 : 0;
    return Math.round(((cur - prev) / prev) * 100);
  };
  const hasAnyData = months => Array.isArray(months) && months.some(v => Number(v) > 0);
  // ── Build a category-filtered view of every dealer ──────────────────────
  // When the user has excluded one or more categories, we substitute the
  // CURRENT month's achieved with (originalAchieved − sum of excluded
  // categories' qty for that dealer). All status lists below — rising,
  // declining, dormant, top performer, needs attention, priority account,
  // achievement %, salesman performance — recompute from this filtered set
  // so they reflect "only the selected categories".
  const ci = selectedMonthIdx;
  // `dealers` is already category-filtered upstream — alias for clarity.
  const dealersFiltered = dealers;

  const risingList    = dealersFiltered.filter(x => hasAnyData(x.months) && monthlyTrend(x.months) > 30);
  const decliningList = dealersFiltered.filter(x => hasAnyData(x.months) && monthlyTrend(x.months) < -20);
  const sumRange = (arr, from, to) => arr.slice(Math.max(0, from), Math.max(0, to)).reduce((a,b) => a + Number(b||0), 0);
  const dormantList = dealersFiltered.filter(x => {
    if(!Array.isArray(x.months)) return false;
    const last3   = sumRange(x.months, ci - 2, ci + 1);
    const before  = sumRange(x.months, 0, ci - 2);
    return last3 === 0 && before > 0;
  });
  const recentlyInactiveList = dealersFiltered.filter(x => {
    if(!Array.isArray(x.months)) return false;
    const thisMonth = Number(x.months[ci]) || 0;
    const earlier   = sumRange(x.months, 0, ci);
    return thisMonth === 0 && earlier > 0;
  });
  const inactiveByData = dealersFiltered.filter(x => {
    if(!Array.isArray(x.months)) return false;
    const last3 = sumRange(x.months, ci - 2, ci + 1);
    const prev  = sumRange(x.months, ci - 5, ci - 2);
    return last3 === 0 && prev > 0;
  });
  const deadByData = dealers.filter(x => {
    if(!Array.isArray(x.months)) return false;
    const last6 = sumRange(x.months, ci - 5, ci + 1);
    const everAny = x.months.reduce((a,b) => a + Number(b||0), 0);
    return last6 === 0 && everAny > 0;
  });
  // Also count by status field
  const inactiveByStatus=dealers.filter(x=>['INACTIVE','REACTIVE'].includes((x.status||'').toUpperCase()));
  const deadByStatus=dealers.filter(x=>(x.status||'').toUpperCase()==='DEAD');
  const overdueFollowups=notes.filter(n=>n.type==='followup'&&!n.completed&&new Date(n.dueDate)<new Date()).length;

  const top5=[...myD].filter(x=>x.achieved>0).sort((a,b)=>b.achieved-a.achieved).slice(0,5);
  const lowAll=myD.filter(x=>{
    if(!x.target)return false;
    const p=pct(x.target,x.achieved)||0;
    return attentionDirection==='lt'?p<attentionThreshold:p>attentionThreshold;
  }).sort((a,b)=>{
    const pa=pct(a.target,a.achieved)||0,pb=pct(b.target,b.achieved)||0;
    return attentionDirection==='lt'?pa-pb:pb-pa;
  });
  const low=attentionExpanded?lowAll:lowAll.slice(0,8);

  const trendData=MO.map((m,i)=>({
    month:m.slice(0,3),
    units:geoFilteredDealers.reduce((s,d)=>s+(d.months[i]||0),0),
  }));
  const projected=trendData.slice(-3).reduce((s,d)=>s+d.units,0)/3;

  const statusColorMap={'ACTIVE':'#34d399','ACHIVERS':'#10b981','KEY ACCOUNT':'#a78bfa','INACTIVE':'#fb923c','REACTIVE':'#f59e0b','DEAD':'#f87171','NEW':'#22d3ee','PROSPECT':'#818cf8'};
  const fallbackPalette=['#6366f1','#34d399','#fbbf24','#f472b6','#22d3ee','#fb923c','#a78bfa','#f87171','#84cc16','#e879f9'];
  const colorForStatus=(name,idx)=>statusColorMap[name.toUpperCase()]||fallbackPalette[idx%fallbackPalette.length];
  const statusCounts=(()=>{
    const map={};
    myD.forEach(x=>{const s=(x.status||'—').trim()||'—';map[s]=(map[s]||0)+1;});
    return Object.entries(map).map(([name,value],i)=>({name,value,color:colorForStatus(name,i)})).sort((a,b)=>b.value-a.value);
  })();

  const topPerformers=myD.filter(x=>x.achieved>250);
  const priorityAccount=myD.filter(x=>x.achieved>=100&&x.achieved<=250);
  const risingStar=myD.filter(x=>x.achieved>=50&&x.achieved<100);
  const hasGeoFilter=geoFilter.city||geoFilter.state;
  const viewingLabel=selectedMonthIdx===CURRENT_MONTH_IDX?`${selMoFull} (Current)`:selMoFull;

  // ── Last-updated stamp ─────────────────────────────────────────────────
  // Ping the server every 60s for the DB's most-recent dealer write time.
  // This reflects the REAL last data-update moment (any user, any field —
  // Achieved, Target, Status, Zone, etc.), not when this page was loaded.
  const [dbLastUpdatedAt, setDbLastUpdatedAt] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await api.dealersLastUpdated();
        if (cancelled) return;
        setDbLastUpdatedAt(r?.lastUpdatedAt ? new Date(r.lastUpdatedAt) : null);
      } catch { /* network blip — keep showing the previous value */ }
    };
    tick();                                         // fire immediately on mount
    const id = setInterval(tick, 60_000);           // and refresh every minute
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  // Also fall back to the dealers prop in case the endpoint hasn't replied yet
  const lastUpdatedAt = useMemo(() => {
    if (dbLastUpdatedAt) return dbLastUpdatedAt;
    let max = 0;
    for (const d of (dealers || [])) {
      const t = d.updatedAt ? new Date(d.updatedAt).getTime() : 0;
      if (t > max) max = t;
    }
    return max ? new Date(max) : null;
  }, [dbLastUpdatedAt, dealers]);
  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdatedAt) return '';
    const diffMs = Date.now() - lastUpdatedAt.getTime();
    const sec  = Math.floor(diffMs/1000);
    if (sec < 45)    return 'just now';
    const min  = Math.floor(sec/60);
    if (min < 60)    return `${min}m ago`;
    const hr   = Math.floor(min/60);
    if (hr  < 24)    return `${hr}h ago`;
    const day  = Math.floor(hr/24);
    if (day < 7)     return `${day}d ago`;
    return lastUpdatedAt.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  }, [lastUpdatedAt]);
  // Full human-readable date + time, e.g. "25 Jun 2026, 2:32 PM"
  const lastUpdatedFull = useMemo(() => {
    if (!lastUpdatedAt) return '';
    return lastUpdatedAt.toLocaleString('en-IN', {
      day:'numeric', month:'short', year:'numeric',
      hour:'numeric', minute:'2-digit', hour12:true,
    });
  }, [lastUpdatedAt]);

  // `ta` is already filtered (myD.achieved was pre-adjusted per-dealer).
  // Use it directly — earlier the code subtracted `excludedQty` again here,
  // which double-counted. Keep aliases so the KPI JSX below doesn't need
  // changes.
  const taAdj = ta;
  const apAdj = ap;

  return(
    <div className="fade">
      <div style={{marginBottom:22, display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap'}}>
        <div style={{flex:'1 1 auto', minWidth:240}}>
          <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:4}}>
            {viewingLabel}
            {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{marginLeft:8,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4,fontSize:10}}>HISTORICAL VIEW</span>}
          </div>
          <div style={{fontSize:24,fontWeight:700,letterSpacing:'-0.02em'}}>
            {(currentUser.role==='admin'||currentUser.role==='superadmin')?'All Territories':'Your Territory'} — Overview
          </div>
          {lastUpdatedFull && (
            <div style={{
              marginTop:8,
              display:'inline-flex', alignItems:'center', gap:8,
              padding:'6px 12px', borderRadius:8,
              background:'rgba(52,211,153,0.10)',
              border:'1px solid rgba(52,211,153,0.30)',
              fontSize:12, color:'#86efac', fontWeight:600,
            }}
              title="Most recent change to any dealer's Target / Achieved / Status / Zone / etc.">
              <span style={{
                width:8, height:8, borderRadius:'50%', background:'#34d399',
                boxShadow:'0 0 8px rgba(52,211,153,0.7)',
              }}/>
              <span style={{color:'var(--t3)', fontWeight:500}}>Last updated on</span>
              <b style={{color:'#86efac'}}>{lastUpdatedFull}</b>
              <span style={{color:'var(--t3)', fontWeight:500, fontSize:11}}>({lastUpdatedLabel})</span>
            </div>
          )}
        </div>

        {/* ── Include / exclude category filter — top-right ─────────── */}
        {allCatTotals.length > 0 && (
          <CategoryFilter
            categories={allCatTotals}
            excluded={catExcluded}
            onToggle={toggleCatExcluded}
            onClear={clearCatExcluded}
            onSelectOnly={(cat)=>{
              // include only the selected category — exclude everything else
              setCatExcluded(new Set(allCatTotals.map(t=>t.category).filter(c=>c!==cat)));
            }}
            label="Categories"
          />
        )}
      </div>

      {/* Insight chips — all based on real data calculations */}
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:18}}>
        <div className="insight-chip" onClick={()=>setInsightPopup({label:'TRENDING UP',color:'#34d399',icon:'📈',sub:'sales up >30% vs previous month',list:risingList})} style={{background:'rgba(52,211,153,0.1)',color:'#34d399',cursor:'pointer'}}><TrendingUp size={13}/> {risingList.length} dealers trending up</div>
        <div className="insight-chip" onClick={()=>setInsightPopup({label:'DECLINING SHARPLY',color:'#f87171',icon:'📉',sub:'sales down >20% vs previous month',list:decliningList})} style={{background:'rgba(248,113,113,0.1)',color:'#f87171',cursor:'pointer'}}><ArrowDownRight size={13}/> {decliningList.length} declining sharply</div>
        {dormantList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'DORMANT 3+ MONTHS',color:'#fbbf24',icon:'💤',sub:'zero sales last 3 months but had history',list:dormantList})} style={{background:'rgba(251,191,36,0.1)',color:'#fbbf24',cursor:'pointer'}}><Clock size={13}/> {dormantList.length} dormant 3+ months</div>}
        {recentlyInactiveList.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'REACTIVE',color:'#fb923c',icon:'⏸',sub:'no orders this month but had orders before',list:recentlyInactiveList})} style={{background:'rgba(251,146,60,0.1)',color:'#fb923c',cursor:'pointer'}}><Clock size={13}/> {recentlyInactiveList.length} reactive</div>}
        {inactiveByStatus.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'INACTIVE (STATUS)',color:'#fbbf24',icon:'⚠️',sub:'marked as Inactive or Reactive',list:inactiveByStatus})} style={{background:'rgba(251,191,36,0.08)',color:'#fbbf24',cursor:'pointer'}}><AlertTriangle size={13}/> {inactiveByStatus.length} inactive</div>}
        {deadByStatus.length>0&&<div className="insight-chip" onClick={()=>setInsightPopup({label:'DEAD CUSTOMERS',color:'#f87171',icon:'✕',sub:'marked as Dead',list:deadByStatus})} style={{background:'rgba(248,113,113,0.08)',color:'#f87171',cursor:'pointer'}}><X size={13}/> {deadByStatus.length} dead customers</div>}
        {overdueFollowups>0&&<div className="insight-chip" onClick={()=>onNavigate('followups')} style={{background:'rgba(99,102,241,0.1)',color:'var(--acc)',cursor:'pointer'}}><Bell size={13}/> {overdueFollowups} overdue follow-ups</div>}
      </div>

      <div className="stat-grid">
        <StatCard label="Total Dealers" value={myD.length} sub={`${active} active · ${inactive} inactive · ${dead} dead`} icon={Users}/>
        <StatCard label={`${selMoLabel} Target`} value={tt} sub="total units" icon={Target}/>
        <StatCard
          label={`${selMoLabel} Achieved${catExcluded.size>0 ? ' (excl.)' : ''}`}
          value={taAdj}
          sub={catExcluded.size>0
            ? `excludes ${[...catExcluded].join(', ')} (−${Number(filteredDelta).toLocaleString('en-IN')})`
            : `${selMoFull} total`}
          valueColor="#34d399" icon={Award}/>
        <StatCard
          label={`Achievement${catExcluded.size>0 ? ' (excl.)' : ''}`}
          value={spct(tt, taAdj)}
          valueColor={pclr(apAdj)}
          progress={apAdj}
          icon={Activity}/>
      </div>

      {/* ── Category-wise Sales overview (live from /api/sales) ────────────── */}
      <div className="card" style={{marginBottom:16, padding:14}}>
        <CategorySalesPanel
          monthLabel={MO[selectedMonthIdx]}
          excluded={catExcluded}
          onToggleExcluded={toggleCatExcluded}
          hideToggleChips
          onSeeAll={() => onNavigate && onNavigate('salesCat')}
        />
      </div>

      {/* Dealer quick search */}
      <div className="card" style={{marginBottom:16,padding:'12px 16px'}}>
        <div style={{position:'relative'}}>
          <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
          <input className="inp" style={{paddingLeft:36}} placeholder="🔍 Search any dealer by name..."
            value={dealerSearch} onChange={e=>{setDealerSearch(e.target.value);setShowSearchResults(true);}}
            onFocus={()=>setShowSearchResults(true)}/>
          {dealerSearch&&<button onClick={()=>{setDealerSearch('');setShowSearchResults(false);}}
            style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t3)',cursor:'pointer'}}><X size={14}/></button>}
          {showSearchResults&&dealerSearch&&(
            <div style={{position:'absolute',top:'100%',left:0,right:0,marginTop:6,background:'var(--bg1)',border:'1px solid var(--b2)',borderRadius:8,zIndex:10,maxHeight:320,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
              {dealerMatches.length>0?dealerMatches.map(d=>{
                const p=pct(d.target,d.achieved);const sm=users[d.salesman];
                return(
                  <div key={d.id} onClick={()=>{onOpenDealer(d.id);setDealerSearch('');setShowSearchResults(false);}}
                    style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:10}}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'var(--t1)',marginBottom:2}}>{d.name}</div>
                      <div style={{display:'flex',gap:8,alignItems:'center',fontSize:11,color:'var(--t3)'}}>
                        <StatusBadge status={d.status}/>
                        {d.zone&&<span>· {d.zone}</span>}
                        {(d.city||d.state)&&<span>· {[d.city,d.state].filter(Boolean).join(', ')}</span>}
                        {d.category&&<span>· {d.category}</span>}
                        {sm&&<span>· {sm.name}</span>}
                      </div>
                    </div>
                    <div style={{textAlign:'right',fontSize:11}}>
                      <div style={{color:'var(--t3)'}}>{selMoLabel}</div>
                      <div style={{fontWeight:700,color:pclr(p)}}>{d.achieved}/{d.target} · {spct(d.target,d.achieved)}</div>
                    </div>
                  </div>
                );
              }):<div style={{padding:16,color:'var(--t3)',fontSize:13,textAlign:'center'}}>No dealers match "{dealerSearch}"</div>}
            </div>
          )}
        </div>
      </div>

      {/* Performance Tiers */}
      <div className="card" style={{marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
          <Award size={14} color="#fbbf24"/> Performance Tiers
          <span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:4}}>({selMoLabel} units · click to view)</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
          {[
            {label:'TOP PERFORMER',sub:'> 250 units',count:topPerformers.length,color:'#fbbf24',icon:'⭐',list:topPerformers},
            {label:'PRIORITY ACCOUNT',sub:'100 – 250 units',count:priorityAccount.length,color:'#a78bfa',icon:'◆',list:priorityAccount},
            {label:'RISING STAR',sub:'50 – 100 units',count:risingStar.length,color:'#22d3ee',icon:'★',list:risingStar},
          ].map(t=>(
            <div key={t.label} onClick={()=>{if(t.list.length>0)setTierPopup(t);}}
              style={{background:`linear-gradient(135deg, ${t.color}1a, ${t.color}08)`,border:`1px solid ${t.color}44`,borderRadius:12,padding:'14px 16px',cursor:'pointer',transition:'transform .15s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span style={{fontSize:18}}>{t.icon}</span>
                <div><div style={{fontSize:11,color:t.color,fontWeight:700}}>{t.label}</div><div style={{fontSize:10,color:'var(--t3)'}}>{t.sub}</div></div>
              </div>
              <div style={{fontSize:30,fontWeight:700,color:'var(--t1)',lineHeight:1,marginBottom:6}}>{t.count}<span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:6}}>dealers</span></div>
              {t.list.slice(0,3).map(d=>(
                <span key={d.id} onClick={e=>{e.stopPropagation();onOpenDealer(d.id);}}
                  style={{display:'inline-block',fontSize:10,padding:'2px 8px',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:4,color:'var(--t2)',cursor:'pointer',margin:'2px',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                  {d.name} · {d.achieved}
                </span>
              ))}
              {t.list.length>3&&<span style={{fontSize:10,color:'var(--t3)',marginLeft:4}}>+{t.list.length-3} more</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Status: TWO drag-reorder sections ── */}
      {(()=>{
        // Build map of all status counts
        const smap={};
        myD.forEach(x=>{const s=(x.status||'NONE').trim()||'NONE';smap[s]=(smap[s]||0)+1;});
        const coreKeys=CORE_STATUSES.filter(s=>smap[s]>0);
        const otherKeys=Object.keys(smap).filter(s=>!CORE_STATUSES.includes(s));
        // Apply saved orders
        const orderedCore=[...coreOrder.filter(s=>coreKeys.includes(s)),...coreKeys.filter(s=>!coreOrder.includes(s))];
        const savedOther=otherOrder||[...otherKeys];
        const orderedOther=[...savedOther.filter(s=>otherKeys.includes(s)),...otherKeys.filter(s=>!savedOther.includes(s))];

        const dragStart=(e,s,sec)=>{setDragStatus(s);setDragSection(sec);e.dataTransfer.effectAllowed='move';};
        const dragOver=(e,s)=>{e.preventDefault();setOverStatus(s);};
        const dragEnd=()=>{setDragStatus(null);setDragSection(null);setOverStatus(null);};
        const reorder=(arr,from,to)=>{const a=[...arr];const fi=a.indexOf(from),ti=a.indexOf(to);if(fi<0||ti<0)return arr;a.splice(fi,1);a.splice(ti,0,from);return a;};
        const drop=(e,target,targetSec)=>{
          e.preventDefault();
          if(!dragStatus||dragStatus===target)return;
          const fromSec=dragSection;
          if(fromSec===targetSec){
            if(targetSec==='core'){const n=reorder(orderedCore,dragStatus,target);setCoreOrder(n);localStorage.setItem('stp_core_status_order',JSON.stringify(n));}
            else{setOtherOrder(reorder(orderedOther,dragStatus,target));}
          } else if(targetSec==='core'){
            const newOther=orderedOther.filter(s=>s!==dragStatus);
            const newCore=[...orderedCore];
            const ti=newCore.indexOf(target);
            newCore.splice(ti>=0?ti:newCore.length,0,dragStatus);
            setCoreOrder(newCore);setOtherOrder(newOther);
            localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));
          } else {
            const newCore=orderedCore.filter(s=>s!==dragStatus);
            const newOther=[...orderedOther];
            const ti=newOther.indexOf(target);
            newOther.splice(ti>=0?ti:newOther.length,0,dragStatus);
            setCoreOrder(newCore);setOtherOrder(newOther);
            localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));
          }
          setDragStatus(null);setDragSection(null);setOverStatus(null);
        };
        const StatusCard=({s,sec})=>{
          const v=smap[s]||0;
          const pctOfTotal=myD.length?Math.round((v/myD.length)*100):0;
          const clr=statusColorMap[s.toUpperCase()]||fallbackPalette[Object.keys(smap).indexOf(s)%fallbackPalette.length];
          const isOver=overStatus===s&&dragStatus&&dragStatus!==s;
          return(
            <div draggable onDragStart={e=>dragStart(e,s,sec)} onDragOver={e=>dragOver(e,s)} onDrop={e=>drop(e,s,sec)} onDragEnd={dragEnd}
              onClick={()=>onNavigate('dealers',{status:s})}
              style={{background:isOver?clr+'30':clr+'14',border:`1px solid ${isOver?clr:clr+'33'}`,borderRadius:10,padding:'12px 14px',cursor:'pointer',
                opacity:dragStatus===s?0.5:1,transition:'all .15s',position:'relative'}}>
              <div style={{position:'absolute',top:6,right:6,opacity:0.3,cursor:'grab'}}><GripVertical size={10}/></div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:clr,flexShrink:0}}/>
                <span style={{fontSize:11,color:clr,fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s}</span>
              </div>
              <div style={{fontSize:24,fontWeight:700,color:'var(--t1)',lineHeight:1}}>{v}<span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:6}}>{pctOfTotal}%</span></div>
              <div style={{height:3,background:'var(--b1)',borderRadius:2,marginTop:8,overflow:'hidden'}}>
                <div style={{height:'100%',width:pctOfTotal+'%',background:clr,borderRadius:2,transition:'width .8s ease'}}/>
              </div>
            </div>
          );
        };
        return(<>
          {orderedCore.length>0&&(
            <div className="card" style={{marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                <Star size={14} color="#34d399"/> Core Status
                <span style={{fontSize:11,color:'var(--t3)',fontWeight:400}}>(drag to reorganize · click to filter)</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{ if(dragSection==='other'&&dragStatus){ const newOther=orderedOther.filter(s=>s!==dragStatus);const newCore=[...orderedCore,dragStatus];setCoreOrder(newCore);setOtherOrder(newOther);localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));setDragStatus(null);setDragSection(null);setOverStatus(null); } }}>
                {orderedCore.map(s=><StatusCard key={s} s={s} sec="core"/>)}
              </div>
            </div>
          )}
          {orderedOther.length>0&&(
            <div className="card" style={{marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                <Hash size={14} color="var(--t3)"/> Other Statuses
                <span style={{fontSize:11,color:'var(--t3)',fontWeight:400}}>({orderedOther.length} · drag to reorganize)</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{ if(dragSection==='core'&&dragStatus){ const newCore=orderedCore.filter(s=>s!==dragStatus);const newOther=[...orderedOther,dragStatus];setCoreOrder(newCore);setOtherOrder(newOther);localStorage.setItem('stp_core_status_order',JSON.stringify(newCore));setDragStatus(null);setDragSection(null);setOverStatus(null); } }}>
                {orderedOther.map(s=><StatusCard key={s} s={s} sec="other"/>)}
              </div>
            </div>
          )}
        </>);
      })()}

      {/* Map View */}
      <MapView dealers={dealers} selectedMonthIdx={selectedMonthIdx}/>

      {/* Category drill chart */}
      <CategoryDrillChart dealers={dealers} selectedMonthIdx={selectedMonthIdx} onNavigate={onNavigate}/>

      {/* Geo filter */}
      {(allCitiesOv.length>0||allStatesOv.length>0)&&(
        <div className="card" style={{marginBottom:16,padding:'12px 16px'}}>
          {/* <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
            <MapPin size={13} color="var(--acc)"/> Geography Filter
            {hasGeoFilter&&<button onClick={()=>setGeoFilter({city:'',state:''})} className="btn" style={{fontSize:10,padding:'2px 8px',marginLeft:'auto',color:'var(--red)'}}><X size={10} style={{display:'inline',verticalAlign:'middle'}}/> Clear</button>}
          </div> */}
          {/* <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {allStatesOv.map(s=>(
              <button key={s} onClick={()=>setGeoFilter(f=>({...f,state:f.state===s?'':s,city:''}))} className="btn"
                style={{fontSize:11,padding:'4px 10px',background:geoFilter.state===s?'var(--accL)':'var(--bg2)',color:geoFilter.state===s?'var(--acc)':'var(--t2)',borderColor:geoFilter.state===s?'var(--acc)':'var(--b2)'}}>
                {s}
              </button>
            ))}
            {allCitiesOv.map(c=>(
              <button key={c} onClick={()=>setGeoFilter(f=>({...f,city:f.city===c?'':c}))} className="btn"
                style={{fontSize:11,padding:'4px 10px',background:geoFilter.city===c?'rgba(34,211,238,0.15)':'var(--bg2)',color:geoFilter.city===c?'#22d3ee':'var(--t2)',borderColor:geoFilter.city===c?'#22d3ee':'var(--b2)'}}>
                {c}
              </button>
            ))}
          </div> */}
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:16,marginBottom:16}}>
        <div className="card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,color:'var(--t2)'}}>
              11-Month Sales Trend
              {hasGeoFilter&&<span style={{fontSize:10,color:'var(--acc)',marginLeft:6}}>({geoFilter.state||''}{geoFilter.city?(geoFilter.state?' · ':'')+geoFilter.city:''})</span>}
            </div>
            <div style={{fontSize:11,color:'var(--t3)'}}>Forecast: <strong style={{color:'var(--acc)'}}>{Math.round(projected)}</strong></div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
              <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}} stroke="var(--b2)"/>
              <YAxis tick={{fill:'var(--t3)',fontSize:11}} stroke="var(--b2)"/>
              <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
              <Area type="monotone" dataKey="units" stroke="#6366f1" strokeWidth={2} fill="url(#grad1)" label={{position:'top',fill:'var(--t2)',fontSize:10}}/>
              <ReferenceLine x={MO[selectedMonthIdx].slice(0,3)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 3"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>Status Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value"
                onClick={d=>onNavigate('dealers',{status:d.name})} style={{cursor:'pointer'}}
                label={({value})=>value}>
                {statusCounts.map((d,i)=><Cell key={i} fill={d.color}/>)}
              </Pie>
              <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
              <Legend wrapperStyle={{fontSize:11}} iconType="circle"/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:14,marginBottom:14}}>
        <div className="card">
          <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>🏆 Top 5 — {selMoLabel}</div>
          {top5.length>0?top5.map((x,i)=>{
            const p=pct(x.target,x.achieved);
            return(
              <div key={x.id} onClick={()=>onOpenDealer(x.id)}
                style={{display:'flex',alignItems:'center',gap:10,marginBottom:11,cursor:'pointer',padding:'4px 6px',borderRadius:6,transition:'background .15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <span style={{fontSize:12,color:'var(--t3)',width:14,textAlign:'right'}}>{i+1}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:12,color:'var(--t1)',fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{x.name}</span>
                    <span style={{fontSize:12,fontWeight:700,color:pclr(p),marginLeft:6}}>{spct(x.target,x.achieved)}</span>
                  </div>
                  <div style={{height:4,background:'var(--b1)',borderRadius:2,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${Math.min(p||0,100)}%`,background:pclr(p),borderRadius:2,transition:'width .8s ease'}}/>
                  </div>
                </div>
                <span style={{fontSize:12,color:'var(--t3)',width:22,textAlign:'right'}}>{x.achieved}</span>
              </div>
            );
          }):<div style={{color:'var(--t3)',fontSize:13,padding:'10px 0'}}>No data yet</div>}
        </div>

        <div className="card">
          <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>📊 Achievement Distribution</div>
          {(()=>{
            const buckets={'0%':0,'1-50%':0,'51-99%':0,'100%+':0};
            myD.forEach(x=>{if(!x.target)return;const p=pct(x.target,x.achieved)||0;if(p===0)buckets['0%']++;else if(p<51)buckets['1-50%']++;else if(p<100)buckets['51-99%']++;else buckets['100%+']++;});
            const colors={'0%':'#f87171','1-50%':'#fb923c','51-99%':'#fbbf24','100%+':'#34d399'};
            const data=Object.entries(buckets).map(([k,v])=>({name:k,value:v,fill:colors[k]}));
            return(
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
                  <XAxis dataKey="name" tick={{fill:'var(--t3)',fontSize:11}}/>
                  <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
                  <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
                  <Bar dataKey="value" radius={[4,4,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:11,fontWeight:600}}>
                    {data.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      </div>

      {/* Needs Attention */}
      <div className="card">
        <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:10}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
            <AlertTriangle size={14} color={attentionDirection==='lt'?'#fbbf24':'#34d399'}/>
            {attentionDirection==='lt'?'Needs Attention':'High Performers'} — {attentionDirection==='lt'?'below':'above'} {attentionThreshold}%
            <span style={{fontSize:11,color:'var(--t3)',fontWeight:400,marginLeft:4}}>({lowAll.length} dealers)</span>
          </div>
          <div className="spacer"/>
          <div className="row" style={{gap:4,flexWrap:'wrap'}}>
            <div style={{display:'flex',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:6,overflow:'hidden'}}>
              <button onClick={()=>setAttentionDirection('lt')} style={{background:attentionDirection==='lt'?'#fbbf24':'transparent',color:attentionDirection==='lt'?'#1a1a2e':'var(--t2)',border:'none',padding:'4px 12px',fontSize:12,fontWeight:700,cursor:'pointer'}}>&lt; Below</button>
              <button onClick={()=>setAttentionDirection('gt')} style={{background:attentionDirection==='gt'?'#34d399':'transparent',color:attentionDirection==='gt'?'#1a1a2e':'var(--t2)',border:'none',padding:'4px 12px',fontSize:12,fontWeight:700,cursor:'pointer',borderLeft:'1px solid var(--b2)'}}>&gt; Above</button>
            </div>
            {[50,60,75,90,100].map(t=>{
              const ac=attentionDirection==='lt'?'#fbbf24':'#34d399';
              return(<button key={t} onClick={()=>setAttentionThreshold(t)}
                style={{background:attentionThreshold===t?ac:'var(--bg2)',color:attentionThreshold===t?'#1a1a2e':'var(--t2)',border:`1px solid ${attentionThreshold===t?ac:'var(--b2)'}`,borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:attentionThreshold===t?700:500,cursor:'pointer'}}>
                {attentionDirection==='lt'?'<':'>'}{t}%
              </button>);
            })}
          </div>
        </div>
        {lowAll.length>0?(
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10}}>
              {low.map(x=>{
                const p=pct(x.target,x.achieved)||0;
                const sm=users[x.salesman];
                const cardClr=attentionDirection==='lt'?(p<30?'#f87171':p<60?'#fb923c':'#fbbf24'):(p>=150?'#34d399':p>=100?'#22d3ee':'#a78bfa');
                return(
                  <div key={x.id} onClick={()=>onOpenDealer(x.id)}
                    style={{background:cardClr+'14',border:`1px solid ${cardClr}33`,borderRadius:8,padding:'11px 13px',cursor:'pointer',transition:'transform .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
                    onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                    <div style={{fontSize:12,color:'var(--t1)',fontWeight:500,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{x.name}</div>
                    <div style={{fontSize:20,fontWeight:700,color:cardClr}}>{spct(x.target,x.achieved)}</div>
                    <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>{x.achieved}/{x.target} units</div>
                    {x.category&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{x.category}</div>}
                    {(currentUser.role==='admin'||currentUser.role==='superadmin')&&sm&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2,display:'flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:sm.color}}/>{sm.name}</div>}
                    <div style={{marginTop:6}}><MiniBars months={x.months} highlightIdx={selectedMonthIdx}/></div>
                  </div>
                );
              })}
            </div>
            {lowAll.length>8&&<div style={{marginTop:12,textAlign:'center'}}><button onClick={()=>setAttentionExpanded(e=>!e)} className="btn" style={{fontSize:12}}>{attentionExpanded?`Show fewer`:`Show all ${lowAll.length} dealers`}</button></div>}
          </>
        ):<div style={{color:'var(--t3)',textAlign:'center',padding:20,fontSize:13}}>🎉 No dealers {attentionDirection==='lt'?'below':'above'} {attentionThreshold}%</div>}
      </div>

      {/* All dealers table */}
      <div className="card" style={{marginTop:14}}>
        <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:8}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}><Users size={14}/> All Dealers ({myD.length})</div>
          <div className="spacer"/>
          <div style={{position:'relative'}}>
            <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
            <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Quick search..." value={overviewSearch} onChange={e=>setOverviewSearch(e.target.value)}/>
          </div>
          {(currentUser.role==='admin'||currentUser.role==='superadmin')&&(
            <MultiSelect options={Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id)} selected={overviewSm?[overviewSm]:[]}
              onChange={v=>setOverviewSm(v.length?v[v.length-1]:'')} placeholder="All Salesmen"
              renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={18}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>
          )}
          <select className="sel" style={{fontSize:12}} value={overviewSort} onChange={e=>setOverviewSort(e.target.value)}>
            <option value="achieved">Sort: Achieved</option>
            <option value="target">Sort: Target</option>
            <option value="pct">Sort: Achievement %</option>
            <option value="name">Sort: Name A-Z</option>
            <option value="status">Sort: Status</option>
            <option value="category">Sort: Category</option>
          </select>
        </div>
        <div className="scroll" style={{maxHeight:'50vh',overflowY:'auto'}}>
          <table>
            <thead>
              <tr>
                <th style={{width:30}}>#</th>
                <th>Dealer Name</th>
                <th>Salesman</th>
                <th>Zone</th>
                <th>City / State</th>
                <th>Category</th>
                <th>Cat Type</th>
                <th>Status</th>
                <th style={{textAlign:'right'}}>Tgt</th>
                <th style={{textAlign:'right'}}>Ach</th>
                <th style={{textAlign:'right'}}>%</th>
                <th>Trend</th>
                <th>Sparkline</th>
              </tr>
            </thead>
            <tbody>
              {(()=>{
                let list=myD;
                if(overviewSearch)list=list.filter(x=>x.name.toLowerCase().includes(overviewSearch.toLowerCase())||(users[x.salesman]?.name||'').toLowerCase().includes(overviewSearch.toLowerCase()));
                if(overviewSm)list=list.filter(x=>x.salesman===overviewSm);
                list=[...list].sort((a,b)=>{
                  if(overviewSort==='achieved')return b.achieved-a.achieved;
                  if(overviewSort==='target')return b.target-a.target;
                  if(overviewSort==='pct')return(pct(b.target,b.achieved)||0)-(pct(a.target,a.achieved)||0);
                  if(overviewSort==='name')return a.name.localeCompare(b.name);
                  if(overviewSort==='status')return(a.status||'').localeCompare(b.status||'');
                  if(overviewSort==='category')return(a.category||'').localeCompare(b.category||'');
                  return 0;
                });
                return list.map((x,i)=>{
                  const p=pct(x.target,x.achieved);
                  const tp=trendPct(x.months);
                  const sm=users[x.salesman];
                  return(
                    <tr key={x.id} onClick={()=>onOpenDealer(x.id)} style={{cursor:'pointer'}}>
                      <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
                      <td style={{fontWeight:600,color:'var(--t1)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
                      <td>{sm?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={sm} size={20}/><span style={{fontSize:12}}>{sm.name}</span></div>:<span style={{color:'var(--t3)'}}>—</span>}</td>
                      <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
                      <td style={{fontSize:11,color:'var(--t2)'}}>{[x.city,x.state].filter(Boolean).join(', ')||'—'}</td>
                      <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
                      <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
                      <td><StatusBadge status={x.status}/></td>
                      <td style={{textAlign:'right'}}>{x.target||'—'}</td>
                      <td style={{textAlign:'right',fontWeight:600,color:x.achieved>0?'var(--t1)':'var(--t3)'}}>{x.achieved||'—'}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
                      <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'inline-flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
                      <td><MiniBars months={x.months} highlightIdx={selectedMonthIdx}/></td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup */}
      {(tierPopup||insightPopup)&&(()=>{
        const popup=tierPopup||insightPopup;
        const closePopup=()=>{setTierPopup(null);setInsightPopup(null);setPopupSearch('');};
        const filteredList=popupSearch.trim()?popup.list.filter(d=>d.name.toLowerCase().includes(popupSearch.toLowerCase())):popup.list;
        const pListForMonth=filteredList.map(d=>({...d,achieved:d.months[selectedMonthIdx]||0,target:monthTarget(d, selectedMonthIdx)}));
        return(
          <div className="overlay" onClick={e=>e.target===e.currentTarget&&closePopup()}>
            <div className="modal" style={{maxWidth:1100,padding:0}}>
              <div style={{padding:'20px 26px',background:`linear-gradient(135deg, ${popup.color}22, ${popup.color}08)`,borderBottom:`1px solid ${popup.color}33`,display:'flex',alignItems:'center',gap:14,position:'sticky',top:0,zIndex:5,flexWrap:'wrap'}}>
                <span style={{fontSize:32}}>{popup.icon}</span>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontSize:11,color:popup.color,fontWeight:700,letterSpacing:'.1em',marginBottom:2}}>{popup.label}</div>
                  <div style={{fontSize:18,fontWeight:700}}>{popup.list.length} dealers <span style={{fontSize:12,color:'var(--t3)',fontWeight:400}}>· {popup.sub}</span></div>
                </div>
                <button onClick={closePopup} className="btn"><X size={14}/></button>
              </div>
              <div style={{padding:'12px 26px 0'}}>
                <div style={{position:'relative'}}>
                  <Search size={14} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
                  <input className="inp" style={{paddingLeft:36}} placeholder={`Search ${popup.list.length} dealers...`} value={popupSearch} onChange={e=>setPopupSearch(e.target.value)}/>
                </div>
              </div>
              <div style={{padding:'12px 26px 26px'}}>
                <div className="scroll" style={{maxHeight:'70vh',overflowY:'auto',marginTop:4}}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th><th>Dealer Name</th><th>Salesman</th><th>Zone</th><th>City</th><th>State</th><th>Cat</th><th>Cat Type</th><th>Status</th>
                        <th style={{textAlign:'right'}}>Tgt</th><th style={{textAlign:'right'}}>Ach</th><th style={{textAlign:'right'}}>%</th>
                        <th style={{textAlign:'right'}}>6m Avg</th><th>Trend</th><th style={{textAlign:'right'}}>Fcst</th>
                        {[...MO].map((_,di)=>{const i=MO.length-1-di;return<th key={i} style={{textAlign:'right',background:i===selectedMonthIdx?'rgba(99,102,241,.08)':'var(--bg1)'}}>{MO[i]}</th>;})}
                        <th>Bars</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...pListForMonth].sort((a,b)=>b.achieved-a.achieved).map((x,idx)=>{
                        const p=pct(x.target,x.achieved);const tp=trendPct(x.months);const fc=forecast(x.months);const sm=users[x.salesman];
                        return(
                          <tr key={x.id} onClick={()=>{onOpenDealer(x.id);closePopup();}} style={{cursor:'pointer'}}>
                            <td style={{color:'var(--t3)',fontSize:11}}>{idx+1}</td>
                            <td style={{fontWeight:600,color:'var(--t1)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
                            <td>{sm?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={sm} size={18}/><span style={{fontSize:11}}>{sm.name}</span></div>:<span style={{color:'var(--t3)'}}>—</span>}</td>
                            <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
                            <td style={{fontSize:11}}>{x.city||'—'}</td>
                            <td style={{fontSize:11}}>{x.state||'—'}</td>
                            <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
                            <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
                            <td><StatusBadge status={x.status}/></td>
                            <td style={{textAlign:'right'}}>{x.target||'—'}</td>
                            <td style={{textAlign:'right',fontWeight:700,color:popup.color}}>{x.achieved}</td>
                            <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
                            <td style={{textAlign:'right',color:'var(--t3)'}}>{x.avg6m||'—'}</td>
                            <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'inline-flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
                            <td style={{textAlign:'right',color:'var(--acc)',fontWeight:600}}>{fc||'—'}</td>
                            {[...x.months].map((_,di)=>{const i=x.months.length-1-di;const v=x.months[i];return<td key={i} style={{textAlign:'right',fontSize:12,color:i===selectedMonthIdx?'var(--acc)':v>0?'var(--t2)':'var(--t3)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{v||'—'}</td>;})}
                            <td><MiniBars months={x.months} highlightIdx={selectedMonthIdx}/></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Overview;