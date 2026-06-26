// // // // // // // // // import React, { useState, useMemo } from 'react';
// // // // // // // // // import { AlertTriangle, RefreshCw, Search, X } from 'lucide-react';
// // // // // // // // // import { fetchCSV, parseOutstandingCSV } from '../utils';
// // // // // // // // // import { Avatar, MultiSelect } from './UI';
// // // // // // // // // import { useMonth } from '../context';

// // // // // // // // // const fmt = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';

// // // // // // // // // export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
// // // // // // // // //   const { selectedMonthIdx } = useMonth();
// // // // // // // // //   const isAdmin = currentUser?.role === 'admin';
// // // // // // // // //   const [loading, setLoading]   = useState(false);
// // // // // // // // //   const [error, setError]       = useState('');
// // // // // // // // //   const [search, setSearch]     = useState('');
// // // // // // // // //   const [smFilter, setSmFilter] = useState([]);
// // // // // // // // //   const [tab, setTab]           = useState('outstanding');
// // // // // // // // //   const [expanded, setExpanded] = useState({});

// // // // // // // // //   const loadOutstanding = async () => {
// // // // // // // // //     setLoading(true); setError('');
// // // // // // // // //     try {
// // // // // // // // //       const allUsers = Object.values(users);
// // // // // // // // //       const source = allUsers.find(u => u.role==='admin' && u.url_outstanding)
// // // // // // // // //                   || allUsers.find(u => u.url_outstanding);
// // // // // // // // //       if(!source){ setError('No outstanding URL set. Add url_outstanding in constants.js'); setLoading(false); return; }
// // // // // // // // //       const csv  = await fetchCSV(source.url_outstanding);
// // // // // // // // //       const rows = parseOutstandingCSV(csv, source.id);
// // // // // // // // //       if(setOutstandingData) setOutstandingData(rows);
// // // // // // // // //       setLoading(false);
// // // // // // // // //     } catch(e) { setError('Failed: '+e.message); setLoading(false); }
// // // // // // // // //   };

// // // // // // // // //   const allMonthCols = useMemo(()=>{
// // // // // // // // //     const cols=new Set();
// // // // // // // // //     outstandingData.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
// // // // // // // // //     return [...cols];
// // // // // // // // //   },[outstandingData]);

// // // // // // // // //   // Build name→salesman lookup from dealers data
// // // // // // // // //   const dealerSmMap = useMemo(()=>{
// // // // // // // // //     const map = {};
// // // // // // // // //     dealers.forEach(d => {
// // // // // // // // //       const key = d.name.toLowerCase().trim();
// // // // // // // // //       if(d.salesman && users[d.salesman]) map[key] = users[d.salesman];
// // // // // // // // //     });
// // // // // // // // //     return map;
// // // // // // // // //   }, [dealers, users]);

// // // // // // // // //   const filtered = useMemo(()=>{
// // // // // // // // //     let d = outstandingData.map(x => ({
// // // // // // // // //       ...x,
// // // // // // // // //       matchedSalesman: dealerSmMap[x.name.toLowerCase().trim()] || null,
// // // // // // // // //     }));
// // // // // // // // //     if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
// // // // // // // // //     if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
// // // // // // // // //     if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
// // // // // // // // //     if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));
// // // // // // // // //     return d;
// // // // // // // // //   },[outstandingData,dealerSmMap,tab,search,smFilter,isAdmin]);

// // // // // // // // //   const totalOut     = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
// // // // // // // // //   const countOut     = outstandingData.filter(d=>d.latestOutstanding>0).length;
// // // // // // // // //   const countCleared = outstandingData.filter(d=>d.latestOutstanding===0).length;
// // // // // // // // //   const hasUrl       = Object.values(users).some(u=>u.url_outstanding);
// // // // // // // // //   const smOptions    = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
// // // // // // // // //   const toggle       = id => setExpanded(e=>({...e,[id]:!e[id]}));

// // // // // // // // //   return (
// // // // // // // // //     <div className="fade">
// // // // // // // // //       <div style={{marginBottom:16}}>
// // // // // // // // //         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
// // // // // // // // //         <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
// // // // // // // // //       </div>

// // // // // // // // //       {/* Setup notice */}
// // // // // // // // //       {!hasUrl && outstandingData.length===0 && (
// // // // // // // // //         <div className="card" style={{marginBottom:14,background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.2)'}}>
// // // // // // // // //           <div style={{fontSize:13,fontWeight:600,color:'var(--acc)',marginBottom:8}}>📋 Setup Outstanding Sheet</div>
// // // // // // // // //           <div style={{fontSize:12,color:'var(--t2)',marginBottom:10}}>Create a Google Sheet with dealer outstanding amounts:</div>
// // // // // // // // //           <div style={{background:'var(--bg2)',borderRadius:8,padding:12,fontFamily:'monospace',fontSize:11,color:'#34d399',marginBottom:10}}>
// // // // // // // // //             Dealer Name | FEB | MAR | APR | MAY<br/>
// // // // // // // // //             AADINATH PLYWOOD | 36000 | 100625 | 169650 | 200000
// // // // // // // // //           </div>
// // // // // // // // //           <div style={{fontSize:12,color:'var(--t3)'}}>
// // // // // // // // //             Publish as CSV → add URL to <code style={{background:'var(--bg2)',padding:'1px 5px',borderRadius:3}}>url_outstanding</code> in <code style={{background:'var(--bg2)',padding:'1px 5px',borderRadius:3}}>constants.js</code> under admin user.
// // // // // // // // //           </div>
// // // // // // // // //         </div>
// // // // // // // // //       )}

// // // // // // // // //       {/* Load button */}
// // // // // // // // //       {hasUrl && (
// // // // // // // // //         <div style={{marginBottom:14,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
// // // // // // // // //           <button onClick={loadOutstanding} disabled={loading} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
// // // // // // // // //             <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Load Outstanding Data'}
// // // // // // // // //           </button>
// // // // // // // // //           {outstandingData.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{outstandingData.length} dealers loaded</span>}
// // // // // // // // //           {error&&<span style={{fontSize:11,color:'var(--red)'}}>{error}</span>}
// // // // // // // // //         </div>
// // // // // // // // //       )}

// // // // // // // // //       {/* KPI cards */}
// // // // // // // // //       {outstandingData.length>0&&(
// // // // // // // // //         <div className="stat-grid" style={{marginBottom:14}}>
// // // // // // // // //           {[
// // // // // // // // //             {l:'Total Outstanding',v:fmt(totalOut),c:'#f87171'},
// // // // // // // // //             {l:'Dealers with Due',v:countOut,c:'#fbbf24'},
// // // // // // // // //             {l:'Cleared',v:countCleared,c:'#34d399'},
// // // // // // // // //             {l:'Avg Outstanding',v:fmt(countOut?Math.round(totalOut/countOut):0),c:'var(--acc)'},
// // // // // // // // //           ].map(k=>(
// // // // // // // // //             <div key={k.l} className="stat-card">
// // // // // // // // //               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
// // // // // // // // //               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
// // // // // // // // //             </div>
// // // // // // // // //           ))}
// // // // // // // // //         </div>
// // // // // // // // //       )}

// // // // // // // // //       {/* Month-wise summary table */}
// // // // // // // // //       {allMonthCols.length>0&&(
// // // // // // // // //         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
// // // // // // // // //           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600,color:'var(--t2)'}}>Month-wise Summary</div>
// // // // // // // // //           <div style={{overflowX:'auto'}}>
// // // // // // // // //             <table>
// // // // // // // // //               <thead>
// // // // // // // // //                 <tr>
// // // // // // // // //                   <th>Month</th>
// // // // // // // // //                   <th style={{textAlign:'right'}}>Total Outstanding</th>
// // // // // // // // //                   <th style={{textAlign:'right'}}>Dealers with Due</th>
// // // // // // // // //                   <th style={{textAlign:'right'}}>Highest</th>
// // // // // // // // //                   <th style={{textAlign:'right'}}>Change</th>
// // // // // // // // //                 </tr>
// // // // // // // // //               </thead>
// // // // // // // // //               <tbody>
// // // // // // // // //                 {allMonthCols.map((month,mi)=>{
// // // // // // // // //                   const vals=outstandingData.map(d=>d.monthlyOutstanding[month]||0);
// // // // // // // // //                   const total=vals.reduce((a,b)=>a+b,0);
// // // // // // // // //                   const withDue=vals.filter(v=>v>0).length;
// // // // // // // // //                   const highest=Math.max(...vals,0);
// // // // // // // // //                   const prev=mi>0?outstandingData.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
// // // // // // // // //                   const change=mi>0?total-prev:0;
// // // // // // // // //                   return(
// // // // // // // // //                     <tr key={month}>
// // // // // // // // //                       <td style={{fontWeight:600,color:'var(--t1)'}}>{month}</td>
// // // // // // // // //                       <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
// // // // // // // // //                       <td style={{textAlign:'right',color:'var(--t2)'}}>{withDue}</td>
// // // // // // // // //                       <td style={{textAlign:'right',color:'#fbbf24'}}>{fmt(highest)}</td>
// // // // // // // // //                       <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>
// // // // // // // // //                         {change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}
// // // // // // // // //                       </td>
// // // // // // // // //                     </tr>
// // // // // // // // //                   );
// // // // // // // // //                 })}
// // // // // // // // //               </tbody>
// // // // // // // // //             </table>
// // // // // // // // //           </div>
// // // // // // // // //         </div>
// // // // // // // // //       )}

// // // // // // // // //       {/* Dealer list */}
// // // // // // // // //       {outstandingData.length>0&&(
// // // // // // // // //         <>
// // // // // // // // //           <div className="tabs">
// // // // // // // // //             {[
// // // // // // // // //               {id:'outstanding',label:`Outstanding (${countOut})`},
// // // // // // // // //               {id:'cleared',    label:`Cleared (${countCleared})`},
// // // // // // // // //               {id:'all',        label:`All (${outstandingData.length})`},
// // // // // // // // //             ].map(t=>(
// // // // // // // // //               <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
// // // // // // // // //             ))}
// // // // // // // // //           </div>

// // // // // // // // //           <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
// // // // // // // // //             <div style={{position:'relative'}}>
// // // // // // // // //               <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
// // // // // // // // //               <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..." value={search} onChange={e=>setSearch(e.target.value)}/>
// // // // // // // // //             </div>
// // // // // // // // //             {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
// // // // // // // // //               renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
// // // // // // // // //             {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
// // // // // // // // //             <div style={{flex:1}}/>
// // // // // // // // //             <span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
// // // // // // // // //           </div>

// // // // // // // // //           <div className="card" style={{padding:0,overflow:'hidden'}}>
// // // // // // // // //             <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
// // // // // // // // //               <table>
// // // // // // // // //                 <thead>
// // // // // // // // //                   <tr>
// // // // // // // // //                     <th style={{width:30}}>#</th>
// // // // // // // // //                     <th>Dealer Name</th>
// // // // // // // // //                     {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
// // // // // // // // //                     <th style={{textAlign:'right'}}>Latest</th>
// // // // // // // // //                     <th style={{textAlign:'right'}}>Trend</th>
// // // // // // // // //                   </tr>
// // // // // // // // //                 </thead>
// // // // // // // // //                 <tbody>
// // // // // // // // //                   {filtered.map((d,i)=>{
// // // // // // // // //                     const sm=users[d.salesman];
// // // // // // // // //                     const isOpen=expanded[d.id];
// // // // // // // // //                     const cleared=d.latestOutstanding===0;
// // // // // // // // //                     return(
// // // // // // // // //                       <React.Fragment key={d.id}>
// // // // // // // // //                         <tr style={{cursor:'pointer',background:cleared?'rgba(52,211,153,0.04)':'transparent'}}
// // // // // // // // //                           onClick={()=>toggle(d.id)}>
// // // // // // // // //                           <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
// // // // // // // // //                           <td>
// // // // // // // // //                             <div style={{fontWeight:600,color:'var(--t1)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
// // // // // // // // //                             <div style={{display:'flex',gap:4,marginTop:2,flexWrap:'wrap',alignItems:'center'}}>
// // // // // // // // //                               {cleared&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
// // // // // // // // //                               {d.matchedSalesman&&<div style={{display:'flex',alignItems:'center',gap:3}}>
// // // // // // // // //                                 <Avatar user={d.matchedSalesman} size={14}/>
// // // // // // // // //                                 <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
// // // // // // // // //                               </div>}
// // // // // // // // //                               {!d.matchedSalesman&&<span style={{fontSize:9,color:'var(--t3)'}}>—</span>}
// // // // // // // // //                             </div>
// // // // // // // // //                           </td>
// // // // // // // // //                           {allMonthCols.map(m=>{
// // // // // // // // //                             const v=d.monthlyOutstanding[m]||0;
// // // // // // // // //                             const mi2=allMonthCols.indexOf(m);
// // // // // // // // //                             const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
// // // // // // // // //                             return(
// // // // // // // // //                               <td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
// // // // // // // // //                                 {v>0?fmt(v):'—'}
// // // // // // // // //                               </td>
// // // // // // // // //                             );
// // // // // // // // //                           })}
// // // // // // // // //                           <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
// // // // // // // // //                             {cleared?'✓ Nil':fmt(d.latestOutstanding)}
// // // // // // // // //                           </td>
// // // // // // // // //                           <td style={{textAlign:'right'}}>
// // // // // // // // //                             {d.trend>0?<span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
// // // // // // // // //                             :d.trend<0?<span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
// // // // // // // // //                             :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
// // // // // // // // //                           </td>
// // // // // // // // //                         </tr>
// // // // // // // // //                         {isOpen&&(
// // // // // // // // //                           <tr>
// // // // // // // // //                             <td colSpan={99} style={{background:'var(--bg2)',padding:'10px 14px'}}>
// // // // // // // // //                               <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
// // // // // // // // //                                 <div style={{fontSize:11,color:'var(--t3)'}}>Outstanding trend:</div>
// // // // // // // // //                                 <div style={{display:'flex',gap:3,alignItems:'flex-end',height:30}}>
// // // // // // // // //                                   {allMonthCols.map(m=>{
// // // // // // // // //                                     const v=d.monthlyOutstanding[m]||0;
// // // // // // // // //                                     const mx=Math.max(...allMonthCols.map(mc=>d.monthlyOutstanding[mc]||0),1);
// // // // // // // // //                                     return(<div key={m} style={{width:18,display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
// // // // // // // // //                                       <div style={{width:'100%',height:Math.max((v/mx)*26,v>0?3:1),background:v===0?'var(--b1)':'#f87171',borderRadius:'2px 2px 0 0'}}/>
// // // // // // // // //                                       <div style={{fontSize:6,color:'var(--t3)'}}>{m.slice(0,3)}</div>
// // // // // // // // //                                     </div>);
// // // // // // // // //                                   })}
// // // // // // // // //                                 </div>
// // // // // // // // //                                 <button className="btnp" style={{fontSize:11,padding:'5px 12px',marginLeft:8}}
// // // // // // // // //                                   onClick={()=>{
// // // // // // // // //                                     const dealer=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());
// // // // // // // // //                                     if(dealer) onOpenDealer(dealer.id);
// // // // // // // // //                                   }}>View Dealer</button>
// // // // // // // // //                               </div>
// // // // // // // // //                             </td>
// // // // // // // // //                           </tr>
// // // // // // // // //                         )}
// // // // // // // // //                       </React.Fragment>
// // // // // // // // //                     );
// // // // // // // // //                   })}
// // // // // // // // //                   {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
// // // // // // // // //                 </tbody>
// // // // // // // // //                 <tfoot>
// // // // // // // // //                   <tr>
// // // // // // // // //                     <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
// // // // // // // // //                     {allMonthCols.map(m=>{
// // // // // // // // //                       const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
// // // // // // // // //                       return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
// // // // // // // // //                     })}
// // // // // // // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
// // // // // // // // //                     <td/>
// // // // // // // // //                   </tr>
// // // // // // // // //                 </tfoot>
// // // // // // // // //               </table>
// // // // // // // // //             </div>
// // // // // // // // //           </div>
// // // // // // // // //         </>
// // // // // // // // //       )}
// // // // // // // // //     </div>
// // // // // // // // //   );
// // // // // // // // // }



// // // // // // // // // import React, { useState, useMemo, useEffect, useRef } from 'react';
// // // // // // // // // import { RefreshCw, Search, X, Upload, AlertTriangle } from 'lucide-react';
// // // // // // // // // import { fetchCSV, parseOutstandingCSV } from '../utils';
// // // // // // // // // import { api, dbOutstandingToApp } from '../api';
// // // // // // // // // import { Avatar, MultiSelect } from './UI';

// // // // // // // // // const fmt = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';

// // // // // // // // // export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
// // // // // // // // //   const isAdmin     = currentUser?.role === 'admin';
// // // // // // // // //   const [loading, setLoading]         = useState(false);
// // // // // // // // //   const [uploading, setUploading]     = useState(false);
// // // // // // // // //   const [error, setError]             = useState('');
// // // // // // // // //   const [uploadMsg, setUploadMsg]     = useState('');
// // // // // // // // //   const [search, setSearch]           = useState('');
// // // // // // // // //   const [smFilter, setSmFilter]       = useState([]);
// // // // // // // // //   const [tab, setTab]                 = useState('outstanding');
// // // // // // // // //   const [expanded, setExpanded]       = useState({});
// // // // // // // // //   const fileRef = useRef();

// // // // // // // // //   // ── Auto-load from DB on mount ──────────────────────────────────────────────
// // // // // // // // //   useEffect(() => {
// // // // // // // // //     loadFromDB();
// // // // // // // // //   }, []);

// // // // // // // // //   // ── Load from DB ────────────────────────────────────────────────────────────
// // // // // // // // //   const loadFromDB = async () => {
// // // // // // // // //     setLoading(true); setError('');
// // // // // // // // //     try {
// // // // // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // // // // //       if(token) {
// // // // // // // // //         const data = await api.getOutstanding();
// // // // // // // // //         if(data?.length > 0) {
// // // // // // // // //           if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
// // // // // // // // //           setLoading(false);
// // // // // // // // //           return;
// // // // // // // // //         }
// // // // // // // // //       }
// // // // // // // // //       // DB empty — try sheet URL as fallback
// // // // // // // // //       await loadFromSheet();
// // // // // // // // //     } catch(e) {
// // // // // // // // //       await loadFromSheet();
// // // // // // // // //     }
// // // // // // // // //     setLoading(false);
// // // // // // // // //   };

// // // // // // // // //   // ── Load from Google Sheet (fallback) ───────────────────────────────────────
// // // // // // // // //   const loadFromSheet = async () => {
// // // // // // // // //     const allUsers = Object.values(users);
// // // // // // // // //     const source   = allUsers.find(u => u.role==='admin' && u.url_outstanding)
// // // // // // // // //                   || allUsers.find(u => u.url_outstanding);
// // // // // // // // //     if(!source?.url_outstanding) return;
// // // // // // // // //     try {
// // // // // // // // //       const csv  = await fetchCSV(source.url_outstanding);
// // // // // // // // //       const rows = parseOutstandingCSV(csv, source.id);
// // // // // // // // //       if(setOutstandingData) setOutstandingData(rows);
// // // // // // // // //     } catch(e) { setError('Sheet load failed: ' + e.message); }
// // // // // // // // //   };

// // // // // // // // //   // ── Upload Excel → save to DB → reload ─────────────────────────────────────
// // // // // // // // //   const handleUpload = async (file) => {
// // // // // // // // //     if(!file) return;
// // // // // // // // //     setUploading(true); setUploadMsg(''); setError('');
// // // // // // // // //     try {
// // // // // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // // // // //       if(!token) throw new Error('Not logged in to server. Start server and re-login.');
// // // // // // // // //       const res = await api.uploadOutstanding(file);
// // // // // // // // //       setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
// // // // // // // // //       // Reload from DB after upload
// // // // // // // // //       await loadFromDB();
// // // // // // // // //     } catch(e) { setError('Upload failed: ' + e.message); }
// // // // // // // // //     setUploading(false);
// // // // // // // // //   };

// // // // // // // // //   // ── Derived data ────────────────────────────────────────────────────────────
// // // // // // // // //   const allMonthCols = useMemo(() => {
// // // // // // // // //     const cols = new Set();
// // // // // // // // //     outstandingData.forEach(d => d.monthCols?.forEach(m => cols.add(m)));
// // // // // // // // //     return [...cols];
// // // // // // // // //   }, [outstandingData]);

// // // // // // // // //   const dealerSmMap = useMemo(() => {
// // // // // // // // //     const map = {};
// // // // // // // // //     dealers.forEach(d => {
// // // // // // // // //       if(d.salesman && users[d.salesman])
// // // // // // // // //         map[d.name.toLowerCase().trim()] = users[d.salesman];
// // // // // // // // //     });
// // // // // // // // //     return map;
// // // // // // // // //   }, [dealers, users]);

// // // // // // // // //   const filtered = useMemo(() => {
// // // // // // // // //     let d = outstandingData.map(x => ({
// // // // // // // // //       ...x,
// // // // // // // // //       matchedSalesman: dealerSmMap[x.name.toLowerCase().trim()] || null,
// // // // // // // // //     }));
// // // // // // // // //     if(tab==='outstanding') d = d.filter(x => x.latestOutstanding > 0);
// // // // // // // // //     if(tab==='cleared')     d = d.filter(x => x.latestOutstanding === 0);
// // // // // // // // //     if(search) d = d.filter(x => x.name.toLowerCase().includes(search.toLowerCase()));
// // // // // // // // //     if(isAdmin && smFilter.length > 0)
// // // // // // // // //       d = d.filter(x => x.matchedSalesman && smFilter.includes(x.matchedSalesman.id));
// // // // // // // // //     return d;
// // // // // // // // //   }, [outstandingData, dealerSmMap, tab, search, smFilter, isAdmin]);

// // // // // // // // //   const totalOut     = filtered.reduce((s,d) => s + d.latestOutstanding, 0);
// // // // // // // // //   const countOut     = outstandingData.filter(d => d.latestOutstanding > 0).length;
// // // // // // // // //   const countCleared = outstandingData.filter(d => d.latestOutstanding === 0).length;
// // // // // // // // //   const smOptions    = Object.values(users).filter(u => u.role==='salesman').map(s => s.id);
// // // // // // // // //   const toggle       = id => setExpanded(e => ({...e, [id]: !e[id]}));

// // // // // // // // //   return (
// // // // // // // // //     <div className="fade">
// // // // // // // // //       <div style={{marginBottom:16}}>
// // // // // // // // //         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
// // // // // // // // //         <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
// // // // // // // // //       </div>

// // // // // // // // //       {/* Action bar */}
// // // // // // // // //       <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
// // // // // // // // //         {/* Upload Excel (admin only) */}
// // // // // // // // //         {isAdmin && <>
// // // // // // // // //           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
// // // // // // // // //             onChange={e => { if(e.target.files[0]) handleUpload(e.target.files[0]); e.target.value=''; }}/>
// // // // // // // // //           <button onClick={()=>fileRef.current?.click()} disabled={uploading}
// // // // // // // // //             className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
// // // // // // // // //             <Upload size={13}/>{uploading ? 'Uploading...' : 'Upload Outstanding Excel'}
// // // // // // // // //           </button>
// // // // // // // // //         </>}

// // // // // // // // //         {/* Refresh from DB */}
// // // // // // // // //         <button onClick={loadFromDB} disabled={loading}
// // // // // // // // //           className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
// // // // // // // // //           <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
// // // // // // // // //         </button>

// // // // // // // // //         {outstandingData.length > 0 &&
// // // // // // // // //           <span style={{fontSize:12,color:'var(--t3)'}}>{outstandingData.length} dealers loaded</span>}
// // // // // // // // //         {uploadMsg && <span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
// // // // // // // // //         {error && <span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
// // // // // // // // //       </div>

// // // // // // // // //       {/* Format guide (when empty) */}
// // // // // // // // //       {outstandingData.length === 0 && !loading && (
// // // // // // // // //         <div className="card" style={{marginBottom:14,background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.2)'}}>
// // // // // // // // //           <div style={{fontSize:13,fontWeight:600,color:'var(--acc)',marginBottom:8}}>📋 How to add outstanding data</div>
// // // // // // // // //           <div style={{fontSize:12,color:'var(--t2)',marginBottom:10}}>
// // // // // // // // //             <strong>Option 1 — Upload Excel</strong> (recommended): Click "Upload Outstanding Excel" above with this format:
// // // // // // // // //           </div>
// // // // // // // // //           <div style={{background:'var(--bg2)',borderRadius:8,padding:12,fontFamily:'monospace',fontSize:11,color:'#34d399',marginBottom:12}}>
// // // // // // // // //             Dealer Name | Jul-25 | Aug-25 | Sep-25 | ...<br/>
// // // // // // // // //             AADINATH PLYWOOD | 36000 | 100625 | 169650<br/>
// // // // // // // // //             BHATTAD PLYWOODS | 51125 | 56625 | 60875
// // // // // // // // //           </div>
// // // // // // // // //           <div style={{fontSize:12,color:'var(--t2)'}}>
// // // // // // // // //             <strong>Option 2 — Google Sheet</strong>: Add <code style={{background:'var(--bg2)',padding:'1px 5px',borderRadius:3}}>url_outstanding</code> in constants.js under admin.
// // // // // // // // //           </div>
// // // // // // // // //         </div>
// // // // // // // // //       )}

// // // // // // // // //       {/* KPI cards */}
// // // // // // // // //       {outstandingData.length > 0 && (
// // // // // // // // //         <div className="stat-grid" style={{marginBottom:14}}>
// // // // // // // // //           {[
// // // // // // // // //             {l:'Total Outstanding', v:fmt(totalOut),                                    c:'#f87171'},
// // // // // // // // //             {l:'Dealers with Due',  v:countOut,                                         c:'#fbbf24'},
// // // // // // // // //             {l:'Cleared',           v:countCleared,                                     c:'#34d399'},
// // // // // // // // //             {l:'Avg Outstanding',   v:fmt(countOut ? Math.round(totalOut/countOut) : 0),c:'var(--acc)'},
// // // // // // // // //           ].map(k=>(
// // // // // // // // //             <div key={k.l} className="stat-card">
// // // // // // // // //               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
// // // // // // // // //               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
// // // // // // // // //             </div>
// // // // // // // // //           ))}
// // // // // // // // //         </div>
// // // // // // // // //       )}

// // // // // // // // //       {/* Month-wise summary */}
// // // // // // // // //       {allMonthCols.length > 0 && (
// // // // // // // // //         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
// // // // // // // // //           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600,color:'var(--t2)'}}>
// // // // // // // // //             Month-wise Summary
// // // // // // // // //           </div>
// // // // // // // // //           <div style={{overflowX:'auto'}}>
// // // // // // // // //             <table>
// // // // // // // // //               <thead>
// // // // // // // // //                 <tr>
// // // // // // // // //                   <th>Month</th>
// // // // // // // // //                   <th style={{textAlign:'right'}}>Total Outstanding</th>
// // // // // // // // //                   <th style={{textAlign:'right'}}>Dealers with Due</th>
// // // // // // // // //                   <th style={{textAlign:'right'}}>Highest</th>
// // // // // // // // //                   <th style={{textAlign:'right'}}>Change</th>
// // // // // // // // //                 </tr>
// // // // // // // // //               </thead>
// // // // // // // // //               <tbody>
// // // // // // // // //                 {allMonthCols.map((month,mi) => {
// // // // // // // // //                   const vals   = outstandingData.map(d => d.monthlyOutstanding[month]||0);
// // // // // // // // //                   const total  = vals.reduce((a,b)=>a+b,0);
// // // // // // // // //                   const withDue= vals.filter(v=>v>0).length;
// // // // // // // // //                   const highest= Math.max(...vals,0);
// // // // // // // // //                   const prev   = mi>0 ? outstandingData.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0) : 0;
// // // // // // // // //                   const change = mi>0 ? total-prev : 0;
// // // // // // // // //                   return (
// // // // // // // // //                     <tr key={month}>
// // // // // // // // //                       <td style={{fontWeight:600,color:'var(--t1)'}}>{month}</td>
// // // // // // // // //                       <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
// // // // // // // // //                       <td style={{textAlign:'right',color:'var(--t2)'}}>{withDue}</td>
// // // // // // // // //                       <td style={{textAlign:'right',color:'#fbbf24'}}>{fmt(highest)}</td>
// // // // // // // // //                       <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>
// // // // // // // // //                         {change!==0 ? (change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN') : '—'}
// // // // // // // // //                       </td>
// // // // // // // // //                     </tr>
// // // // // // // // //                   );
// // // // // // // // //                 })}
// // // // // // // // //               </tbody>
// // // // // // // // //             </table>
// // // // // // // // //           </div>
// // // // // // // // //         </div>
// // // // // // // // //       )}

// // // // // // // // //       {/* Dealer list */}
// // // // // // // // //       {outstandingData.length > 0 && (<>
// // // // // // // // //         <div className="tabs">
// // // // // // // // //           {[
// // // // // // // // //             {id:'outstanding', label:`Outstanding (${countOut})`},
// // // // // // // // //             {id:'cleared',     label:`Cleared (${countCleared})`},
// // // // // // // // //             {id:'all',         label:`All (${outstandingData.length})`},
// // // // // // // // //           ].map(t=>(
// // // // // // // // //             <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>
// // // // // // // // //           ))}
// // // // // // // // //         </div>

// // // // // // // // //         <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
// // // // // // // // //           <div style={{position:'relative'}}>
// // // // // // // // //             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
// // // // // // // // //             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
// // // // // // // // //               value={search} onChange={e=>setSearch(e.target.value)}/>
// // // // // // // // //           </div>
// // // // // // // // //           {isAdmin && <MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
// // // // // // // // //             renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
// // // // // // // // //           {(search||smFilter.length>0) && <button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
// // // // // // // // //           <div style={{flex:1}}/>
// // // // // // // // //           <span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
// // // // // // // // //         </div>

// // // // // // // // //         <div className="card" style={{padding:0,overflow:'hidden'}}>
// // // // // // // // //           <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
// // // // // // // // //             <table>
// // // // // // // // //               <thead>
// // // // // // // // //                 <tr>
// // // // // // // // //                   <th>#</th>
// // // // // // // // //                   <th>Dealer Name</th>
// // // // // // // // //                   {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
// // // // // // // // //                   <th style={{textAlign:'right'}}>Latest</th>
// // // // // // // // //                   <th style={{textAlign:'right'}}>Trend</th>
// // // // // // // // //                 </tr>
// // // // // // // // //               </thead>
// // // // // // // // //               <tbody>
// // // // // // // // //                 {filtered.map((d,i) => {
// // // // // // // // //                   const isOpen  = expanded[d.id];
// // // // // // // // //                   const cleared = d.latestOutstanding === 0;
// // // // // // // // //                   return (
// // // // // // // // //                     <React.Fragment key={d.id}>
// // // // // // // // //                       <tr style={{cursor:'pointer',background:cleared?'rgba(52,211,153,0.04)':'transparent'}}
// // // // // // // // //                         onClick={()=>toggle(d.id)}>
// // // // // // // // //                         <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
// // // // // // // // //                         <td>
// // // // // // // // //                           <div style={{fontWeight:600,color:'var(--t1)',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
// // // // // // // // //                           <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center'}}>
// // // // // // // // //                             {cleared && <span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
// // // // // // // // //                             {d.matchedSalesman && <div style={{display:'flex',alignItems:'center',gap:3}}>
// // // // // // // // //                               <Avatar user={d.matchedSalesman} size={14}/>
// // // // // // // // //                               <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
// // // // // // // // //                             </div>}
// // // // // // // // //                           </div>
// // // // // // // // //                         </td>
// // // // // // // // //                         {allMonthCols.map(m => {
// // // // // // // // //                           const v   = d.monthlyOutstanding[m]||0;
// // // // // // // // //                           const mi2 = allMonthCols.indexOf(m);
// // // // // // // // //                           const prev= mi2>0 ? d.monthlyOutstanding[allMonthCols[mi2-1]]||0 : v;
// // // // // // // // //                           return (
// // // // // // // // //                             <td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
// // // // // // // // //                               {v>0 ? fmt(v) : '—'}
// // // // // // // // //                             </td>
// // // // // // // // //                           );
// // // // // // // // //                         })}
// // // // // // // // //                         <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
// // // // // // // // //                           {cleared ? '✓ Nil' : fmt(d.latestOutstanding)}
// // // // // // // // //                         </td>
// // // // // // // // //                         <td style={{textAlign:'right'}}>
// // // // // // // // //                           {d.trend>0 ? <span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
// // // // // // // // //                           :d.trend<0  ? <span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
// // // // // // // // //                           :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
// // // // // // // // //                         </td>
// // // // // // // // //                       </tr>
// // // // // // // // //                       {isOpen && (
// // // // // // // // //                         <tr>
// // // // // // // // //                           <td colSpan={99} style={{background:'var(--bg2)',padding:'10px 14px'}}>
// // // // // // // // //                             <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
// // // // // // // // //                               <div style={{fontSize:11,color:'var(--t3)'}}>Trend:</div>
// // // // // // // // //                               <div style={{display:'flex',gap:3,alignItems:'flex-end',height:30}}>
// // // // // // // // //                                 {allMonthCols.map(m=>{
// // // // // // // // //                                   const v  = d.monthlyOutstanding[m]||0;
// // // // // // // // //                                   const mx = Math.max(...allMonthCols.map(mc=>d.monthlyOutstanding[mc]||0),1);
// // // // // // // // //                                   return(
// // // // // // // // //                                     <div key={m} style={{width:18,display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
// // // // // // // // //                                       <div style={{width:'100%',height:Math.max((v/mx)*26,v>0?3:1),background:v===0?'var(--b1)':'#f87171',borderRadius:'2px 2px 0 0'}}/>
// // // // // // // // //                                       <div style={{fontSize:6,color:'var(--t3)'}}>{m.slice(0,3)}</div>
// // // // // // // // //                                     </div>
// // // // // // // // //                                   );
// // // // // // // // //                                 })}
// // // // // // // // //                               </div>
// // // // // // // // //                               <button className="btnp" style={{fontSize:11,padding:'5px 12px',marginLeft:8}}
// // // // // // // // //                                 onClick={()=>{
// // // // // // // // //                                   const dealer=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());
// // // // // // // // //                                   if(dealer) onOpenDealer(dealer.id);
// // // // // // // // //                                 }}>View Dealer</button>
// // // // // // // // //                             </div>
// // // // // // // // //                           </td>
// // // // // // // // //                         </tr>
// // // // // // // // //                       )}
// // // // // // // // //                     </React.Fragment>
// // // // // // // // //                   );
// // // // // // // // //                 })}
// // // // // // // // //                 {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
// // // // // // // // //               </tbody>
// // // // // // // // //               <tfoot>
// // // // // // // // //                 <tr>
// // // // // // // // //                   <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
// // // // // // // // //                   {allMonthCols.map(m=>{
// // // // // // // // //                     const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
// // // // // // // // //                     return <td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
// // // // // // // // //                   })}
// // // // // // // // //                   <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
// // // // // // // // //                   <td/>
// // // // // // // // //                 </tr>
// // // // // // // // //               </tfoot>
// // // // // // // // //             </table>
// // // // // // // // //           </div>
// // // // // // // // //         </div>
// // // // // // // // //       </>)}
// // // // // // // // //     </div>
// // // // // // // // //   );
// // // // // // // // // }


// // // // // // // // import React, { useState, useMemo, useEffect, useRef } from 'react';
// // // // // // // // import { RefreshCw, Search, X, Upload, Plus, Check, Trash2, Calendar, MessageSquare, Bell, AlertCircle } from 'lucide-react';
// // // // // // // // import { fetchCSV, parseOutstandingCSV } from '../utils';
// // // // // // // // import { api, dbOutstandingToApp } from '../api';
// // // // // // // // import { Avatar, MultiSelect } from './UI';

// // // // // // // // const fmt  = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';
// // // // // // // // const today = () => new Date().toISOString().slice(0,10);
// // // // // // // // const daysUntil = (dateStr) => {
// // // // // // // //   const d = new Date(dateStr) - new Date(today());
// // // // // // // //   return Math.ceil(d / 86400000);
// // // // // // // // };

// // // // // // // // // ── Followup Modal ────────────────────────────────────────────────────────────
// // // // // // // // function FollowupModal({ dealer, outAmt, existingFollowups, currentUser, onClose, onSaved }) {
// // // // // // // //   const [date,    setDate]    = useState(today());
// // // // // // // //   const [comment, setComment] = useState('');
// // // // // // // //   const [amount,  setAmount]  = useState(outAmt||0);
// // // // // // // //   const [saving,  setSaving]  = useState(false);
// // // // // // // //   const [err,     setErr]     = useState('');

// // // // // // // //   const handleAdd = async () => {
// // // // // // // //     if(!date){ setErr('Date required'); return; }
// // // // // // // //     setSaving(true); setErr('');
// // // // // // // //     try {
// // // // // // // //       await api.addFollowup({
// // // // // // // //         dealerName:   dealer.name,
// // // // // // // //         salesman:     dealer.matchedSalesman?.id || '',
// // // // // // // //         amount:       Number(amount)||0,
// // // // // // // //         followupDate: date,
// // // // // // // //         comment:      comment.trim(),
// // // // // // // //       });
// // // // // // // //       onSaved();
// // // // // // // //       onClose();
// // // // // // // //     } catch(e){ setErr(e.message); }
// // // // // // // //     setSaving(false);
// // // // // // // //   };

// // // // // // // //   const handleMark = async (id, status) => {
// // // // // // // //     await api.updateFollowup(id, { status });
// // // // // // // //     onSaved();
// // // // // // // //   };

// // // // // // // //   const handleDelete = async (id) => {
// // // // // // // //     if(!confirm('Delete this follow-up?')) return;
// // // // // // // //     await api.deleteFollowup(id);
// // // // // // // //     onSaved();
// // // // // // // //   };

// // // // // // // //   const mine = existingFollowups.filter(f =>
// // // // // // // //     f.dealerName.toLowerCase().trim() === dealer.name.toLowerCase().trim()
// // // // // // // //   );

// // // // // // // //   return (
// // // // // // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // // // // // //       <div className="modal" style={{maxWidth:480}}>
// // // // // // // //         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
// // // // // // // //           <div>
// // // // // // // //             <div style={{fontSize:16,fontWeight:700}}>{dealer.name}</div>
// // // // // // // //             <div style={{fontSize:12,color:'#f87171',marginTop:2}}>Outstanding: {fmt(dealer.latestOutstanding)}</div>
// // // // // // // //           </div>
// // // // // // // //           <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:18}}>×</button>
// // // // // // // //         </div>

// // // // // // // //         {/* Add new followup */}
// // // // // // // //         <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // // // // // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
// // // // // // // //             <Plus size={13} color="var(--acc)"/> Add Follow-up
// // // // // // // //           </div>
// // // // // // // //           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
// // // // // // // //             <div>
// // // // // // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Follow-up Date *</label>
// // // // // // // //               <input type="date" className="inp" value={date} min={today()} onChange={e=>setDate(e.target.value)}
// // // // // // // //                 style={{width:'100%'}}/>
// // // // // // // //             </div>
// // // // // // // //             <div>
// // // // // // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Expected Payment ₹</label>
// // // // // // // //               <input type="number" className="inp" value={amount} onChange={e=>setAmount(e.target.value)}
// // // // // // // //                 style={{width:'100%'}} placeholder="0"/>
// // // // // // // //             </div>
// // // // // // // //           </div>
// // // // // // // //           <div style={{marginBottom:10}}>
// // // // // // // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Comment / Note</label>
// // // // // // // //             <textarea className="inp" value={comment} onChange={e=>setComment(e.target.value)}
// // // // // // // //               placeholder="e.g. Will pay after 15th, cheque promised..." rows={2}
// // // // // // // //               style={{width:'100%',resize:'vertical',fontFamily:'inherit'}}/>
// // // // // // // //           </div>
// // // // // // // //           {err&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>{err}</div>}
// // // // // // // //           <button onClick={handleAdd} disabled={saving} className="btnp"
// // // // // // // //             style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
// // // // // // // //             {saving?<RefreshCw size={12} style={{animation:'spin .7s linear infinite'}}/>:<Plus size={12}/>}
// // // // // // // //             {saving?'Saving...':'Add Follow-up'}
// // // // // // // //           </button>
// // // // // // // //         </div>

// // // // // // // //         {/* Existing followups */}
// // // // // // // //         {mine.length>0&&(
// // // // // // // //           <div>
// // // // // // // //             <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>History ({mine.length})</div>
// // // // // // // //             {mine.sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate)).map(f=>{
// // // // // // // //               const days   = daysUntil(f.followupDate);
// // // // // // // //               const isDone = f.status==='done';
// // // // // // // //               const isOver = !isDone && days < 0;
// // // // // // // //               return(
// // // // // // // //                 <div key={f._id} style={{
// // // // // // // //                   padding:'10px 12px',borderRadius:8,marginBottom:8,
// // // // // // // //                   background:isDone?'rgba(52,211,153,0.06)':isOver?'rgba(248,113,113,0.06)':'var(--bg2)',
// // // // // // // //                   border:`1px solid ${isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'var(--b2)'}`,
// // // // // // // //                   opacity:isDone?0.7:1,
// // // // // // // //                 }}>
// // // // // // // //                   <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
// // // // // // // //                     <div style={{flex:1}}>
// // // // // // // //                       <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
// // // // // // // //                         <Calendar size={12} color={isDone?'#34d399':isOver?'#f87171':'var(--acc)'}/>
// // // // // // // //                         <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>
// // // // // // // //                           {f.followupDate}
// // // // // // // //                         </span>
// // // // // // // //                         <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,
// // // // // // // //                           background:isDone?'rgba(52,211,153,0.15)':isOver?'rgba(248,113,113,0.15)':'rgba(99,102,241,0.12)',
// // // // // // // //                           color:isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// // // // // // // //                           {isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// // // // // // // //                         </span>
// // // // // // // //                         {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>{fmt(f.amount)}</span>}
// // // // // // // //                       </div>
// // // // // // // //                       {f.comment&&(
// // // // // // // //                         <div style={{fontSize:11,color:'var(--t3)',display:'flex',gap:4}}>
// // // // // // // //                           <MessageSquare size={10} style={{marginTop:1,flexShrink:0}}/>
// // // // // // // //                           {f.comment}
// // // // // // // //                         </div>
// // // // // // // //                       )}
// // // // // // // //                     </div>
// // // // // // // //                     <div style={{display:'flex',gap:4}}>
// // // // // // // //                       {!isDone&&(
// // // // // // // //                         <button onClick={()=>handleMark(f._id,'done')} title="Mark done"
// // // // // // // //                           style={{background:'none',border:'1px solid #34d399',color:'#34d399',borderRadius:4,padding:'3px 6px',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:3}}>
// // // // // // // //                           <Check size={10}/> Done
// // // // // // // //                         </button>
// // // // // // // //                       )}
// // // // // // // //                       <button onClick={()=>handleDelete(f._id)} title="Delete"
// // // // // // // //                         style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3}}>
// // // // // // // //                         <Trash2 size={12}/>
// // // // // // // //                       </button>
// // // // // // // //                     </div>
// // // // // // // //                   </div>
// // // // // // // //                 </div>
// // // // // // // //               );
// // // // // // // //             })}
// // // // // // // //           </div>
// // // // // // // //         )}
// // // // // // // //         {mine.length===0&&<div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:12}}>No follow-ups yet for this dealer</div>}
// // // // // // // //       </div>
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // }

// // // // // // // // // ── Main Outstanding Component ────────────────────────────────────────────────
// // // // // // // // export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
// // // // // // // //   const isAdmin = currentUser?.role === 'admin';
// // // // // // // //   const [loading,    setLoading]    = useState(false);
// // // // // // // //   const [uploading,  setUploading]  = useState(false);
// // // // // // // //   const [error,      setError]      = useState('');
// // // // // // // //   const [uploadMsg,  setUploadMsg]  = useState('');
// // // // // // // //   const [search,     setSearch]     = useState('');
// // // // // // // //   const [smFilter,   setSmFilter]   = useState([]);
// // // // // // // //   const [tab,        setTab]        = useState('outstanding');
// // // // // // // //   const [expanded,   setExpanded]   = useState({});
// // // // // // // //   const [followups,  setFollowups]  = useState([]);
// // // // // // // //   const [activeDealer, setActiveDealer] = useState(null); // dealer to show followup modal
// // // // // // // //   const fileRef = useRef();

// // // // // // // //   useEffect(() => { loadFromDB(); loadFollowups(); }, []);

// // // // // // // //   const loadFollowups = async () => {
// // // // // // // //     try {
// // // // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // // // //       if(!token) return;
// // // // // // // //       const data = await api.getFollowups();
// // // // // // // //       setFollowups(data||[]);
// // // // // // // //     } catch(e) { console.warn('Followups load failed:', e.message); }
// // // // // // // //   };

// // // // // // // //   const loadFromDB = async () => {
// // // // // // // //     setLoading(true); setError('');
// // // // // // // //     try {
// // // // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // // // //       if(token) {
// // // // // // // //         const data = await api.getOutstanding();
// // // // // // // //         if(data?.length > 0) {
// // // // // // // //           if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
// // // // // // // //           setLoading(false); return;
// // // // // // // //         }
// // // // // // // //       }
// // // // // // // //       // fallback to sheet
// // // // // // // //       const allUsers = Object.values(users);
// // // // // // // //       const source   = allUsers.find(u=>u.role==='admin'&&u.url_outstanding)||allUsers.find(u=>u.url_outstanding);
// // // // // // // //       if(source?.url_outstanding){
// // // // // // // //         const csv  = await fetchCSV(source.url_outstanding);
// // // // // // // //         const rows = parseOutstandingCSV(csv, source.id);
// // // // // // // //         if(setOutstandingData) setOutstandingData(rows);
// // // // // // // //       }
// // // // // // // //     } catch(e){ setError('Load failed: '+e.message); }
// // // // // // // //     setLoading(false);
// // // // // // // //   };

// // // // // // // //   const handleUpload = async (file) => {
// // // // // // // //     if(!file) return;
// // // // // // // //     setUploading(true); setUploadMsg(''); setError('');
// // // // // // // //     try {
// // // // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // // // //       if(!token) throw new Error('Not logged in to server');
// // // // // // // //       const res = await api.uploadOutstanding(file);
// // // // // // // //       setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
// // // // // // // //       await loadFromDB();
// // // // // // // //     } catch(e){ setError('Upload failed: '+e.message); }
// // // // // // // //     setUploading(false);
// // // // // // // //   };

// // // // // // // //   const allMonthCols = useMemo(()=>{
// // // // // // // //     const cols=new Set();
// // // // // // // //     outstandingData.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
// // // // // // // //     return [...cols];
// // // // // // // //   },[outstandingData]);

// // // // // // // //   const dealerSmMap = useMemo(()=>{
// // // // // // // //     const map={};
// // // // // // // //     dealers.forEach(d=>{ if(d.salesman&&users[d.salesman]) map[d.name.toLowerCase().trim()]=users[d.salesman]; });
// // // // // // // //     return map;
// // // // // // // //   },[dealers,users]);

// // // // // // // //   const followupMap = useMemo(()=>{
// // // // // // // //     const map={};
// // // // // // // //     followups.forEach(f=>{
// // // // // // // //       const k=f.dealerName.toLowerCase().trim();
// // // // // // // //       if(!map[k]) map[k]=[];
// // // // // // // //       map[k].push(f);
// // // // // // // //     });
// // // // // // // //     return map;
// // // // // // // //   },[followups]);

// // // // // // // //   const filtered = useMemo(()=>{
// // // // // // // //     let d=outstandingData.map(x=>({
// // // // // // // //       ...x,
// // // // // // // //       matchedSalesman: dealerSmMap[x.name.toLowerCase().trim()]||null,
// // // // // // // //       dealerFollowups: followupMap[x.name.toLowerCase().trim()]||[],
// // // // // // // //     }));
// // // // // // // //     if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
// // // // // // // //     if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
// // // // // // // //     if(tab==='followups')   d=d.filter(x=>x.dealerFollowups.some(f=>f.status==='pending'));
// // // // // // // //     if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
// // // // // // // //     if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));
// // // // // // // //     return d;
// // // // // // // //   },[outstandingData,dealerSmMap,followupMap,tab,search,smFilter,isAdmin]);

// // // // // // // //   const totalOut     = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
// // // // // // // //   const countOut     = outstandingData.filter(d=>d.latestOutstanding>0).length;
// // // // // // // //   const countCleared = outstandingData.filter(d=>d.latestOutstanding===0).length;
// // // // // // // //   const pendingFollowups = followups.filter(f=>f.status==='pending');
// // // // // // // //   const overdueFollowups = pendingFollowups.filter(f=>daysUntil(f.followupDate)<0);
// // // // // // // //   const smOptions    = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
// // // // // // // //   const toggle       = id=>setExpanded(e=>({...e,[id]:!e[id]}));

// // // // // // // //   return (
// // // // // // // //     <div className="fade">
// // // // // // // //       <div style={{marginBottom:16}}>
// // // // // // // //         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
// // // // // // // //         <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
// // // // // // // //           <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
// // // // // // // //           {overdueFollowups.length>0&&(
// // // // // // // //             <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:6,padding:'3px 10px'}}>
// // // // // // // //               <Bell size={12} color="#f87171"/>
// // // // // // // //               <span style={{fontSize:11,color:'#f87171',fontWeight:600}}>{overdueFollowups.length} overdue follow-up{overdueFollowups.length>1?'s':''}</span>
// // // // // // // //             </div>
// // // // // // // //           )}
// // // // // // // //         </div>
// // // // // // // //       </div>

// // // // // // // //       {/* Action bar */}
// // // // // // // //       <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
// // // // // // // //         {isAdmin&&<>
// // // // // // // //           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
// // // // // // // //             onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
// // // // // // // //           <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp"
// // // // // // // //             style={{display:'flex',alignItems:'center',gap:6}}>
// // // // // // // //             <Upload size={13}/>{uploading?'Uploading...':'Upload Outstanding Excel'}
// // // // // // // //           </button>
// // // // // // // //         </>}
// // // // // // // //         <button onClick={()=>{loadFromDB();loadFollowups();}} disabled={loading} className="btn"
// // // // // // // //           style={{display:'flex',alignItems:'center',gap:6}}>
// // // // // // // //           <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
// // // // // // // //         </button>
// // // // // // // //         {outstandingData.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{outstandingData.length} dealers</span>}
// // // // // // // //         {uploadMsg&&<span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
// // // // // // // //         {error&&<span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
// // // // // // // //       </div>

// // // // // // // //       {/* KPI cards */}
// // // // // // // //       {outstandingData.length>0&&(
// // // // // // // //         <div className="stat-grid" style={{marginBottom:14}}>
// // // // // // // //           {[
// // // // // // // //             {l:'Total Outstanding', v:fmt(totalOut),                                    c:'#f87171'},
// // // // // // // //             {l:'Dealers with Due',  v:countOut,                                         c:'#fbbf24'},
// // // // // // // //             {l:'Cleared',           v:countCleared,                                     c:'#34d399'},
// // // // // // // //             {l:'Pending Follow-ups',v:pendingFollowups.length,                          c:'var(--acc)'},
// // // // // // // //           ].map(k=>(
// // // // // // // //             <div key={k.l} className="stat-card">
// // // // // // // //               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
// // // // // // // //               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
// // // // // // // //             </div>
// // // // // // // //           ))}
// // // // // // // //         </div>
// // // // // // // //       )}

// // // // // // // //       {/* Month summary */}
// // // // // // // //       {allMonthCols.length>0&&(
// // // // // // // //         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
// // // // // // // //           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600}}>Month-wise Summary</div>
// // // // // // // //           <div style={{overflowX:'auto'}}>
// // // // // // // //             <table>
// // // // // // // //               <thead><tr>
// // // // // // // //                 <th>Month</th><th style={{textAlign:'right'}}>Total Outstanding</th>
// // // // // // // //                 <th style={{textAlign:'right'}}>Dealers Due</th><th style={{textAlign:'right'}}>Change</th>
// // // // // // // //               </tr></thead>
// // // // // // // //               <tbody>
// // // // // // // //                 {allMonthCols.map((month,mi)=>{
// // // // // // // //                   const vals  = outstandingData.map(d=>d.monthlyOutstanding[month]||0);
// // // // // // // //                   const total = vals.reduce((a,b)=>a+b,0);
// // // // // // // //                   const due   = vals.filter(v=>v>0).length;
// // // // // // // //                   const prev  = mi>0?outstandingData.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
// // // // // // // //                   const chg   = mi>0?total-prev:0;
// // // // // // // //                   return(<tr key={month}>
// // // // // // // //                     <td style={{fontWeight:600}}>{month}</td>
// // // // // // // //                     <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
// // // // // // // //                     <td style={{textAlign:'right'}}>{due}</td>
// // // // // // // //                     <td style={{textAlign:'right',color:chg>0?'#f87171':chg<0?'#34d399':'var(--t3)',fontWeight:600}}>
// // // // // // // //                       {chg!==0?(chg>0?'▲':'▼')+'₹'+Number(Math.abs(chg)).toLocaleString('en-IN'):'—'}
// // // // // // // //                     </td>
// // // // // // // //                   </tr>);
// // // // // // // //                 })}
// // // // // // // //               </tbody>
// // // // // // // //             </table>
// // // // // // // //           </div>
// // // // // // // //         </div>
// // // // // // // //       )}

// // // // // // // //       {/* Tabs + list */}
// // // // // // // //       {outstandingData.length>0&&(<>
// // // // // // // //         <div className="tabs">
// // // // // // // //           {[
// // // // // // // //             {id:'outstanding',label:`Due (${countOut})`},
// // // // // // // //             {id:'cleared',    label:`Cleared (${countCleared})`},
// // // // // // // //             {id:'followups',  label:`Follow-ups (${pendingFollowups.length})`,badge:overdueFollowups.length},
// // // // // // // //             {id:'all',        label:`All (${outstandingData.length})`},
// // // // // // // //           ].map(t=>(
// // // // // // // //             <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}
// // // // // // // //               style={{position:'relative'}}>
// // // // // // // //               {t.label}
// // // // // // // //               {t.badge>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'#f87171',borderRadius:'50%',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
// // // // // // // //             </button>
// // // // // // // //           ))}
// // // // // // // //         </div>

// // // // // // // //         <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
// // // // // // // //           <div style={{position:'relative'}}>
// // // // // // // //             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
// // // // // // // //             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
// // // // // // // //               value={search} onChange={e=>setSearch(e.target.value)}/>
// // // // // // // //           </div>
// // // // // // // //           {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
// // // // // // // //             renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
// // // // // // // //           {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
// // // // // // // //           <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
// // // // // // // //         </div>

// // // // // // // //         <div className="card" style={{padding:0,overflow:'hidden'}}>
// // // // // // // //           <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
// // // // // // // //             <table>
// // // // // // // //               <thead><tr>
// // // // // // // //                 <th>#</th><th>Dealer</th>
// // // // // // // //                 {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
// // // // // // // //                 <th style={{textAlign:'right'}}>Latest</th>
// // // // // // // //                 <th style={{textAlign:'right'}}>Trend</th>
// // // // // // // //                 <th style={{textAlign:'center'}}>Follow-up</th>
// // // // // // // //               </tr></thead>
// // // // // // // //               <tbody>
// // // // // // // //                 {filtered.map((d,i)=>{
// // // // // // // //                   const isOpen  = expanded[d.id];
// // // // // // // //                   const cleared = d.latestOutstanding===0;
// // // // // // // //                   const dFu     = d.dealerFollowups.filter(f=>f.status==='pending');
// // // // // // // //                   const nextFu  = dFu.sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate))[0];
// // // // // // // //                   const fuDays  = nextFu ? daysUntil(nextFu.followupDate) : null;
// // // // // // // //                   const fuOver  = fuDays !== null && fuDays < 0;

// // // // // // // //                   return(
// // // // // // // //                     <React.Fragment key={d.id}>
// // // // // // // //                       <tr style={{background:cleared?'rgba(52,211,153,0.04)':'transparent',cursor:'pointer'}}
// // // // // // // //                         onClick={()=>toggle(d.id)}>
// // // // // // // //                         <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
// // // // // // // //                         <td>
// // // // // // // //                           <div style={{fontWeight:600,color:'var(--t1)',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
// // // // // // // //                           <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center'}}>
// // // // // // // //                             {cleared&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
// // // // // // // //                             {d.matchedSalesman&&<div style={{display:'flex',alignItems:'center',gap:3}}>
// // // // // // // //                               <Avatar user={d.matchedSalesman} size={13}/>
// // // // // // // //                               <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
// // // // // // // //                             </div>}
// // // // // // // //                           </div>
// // // // // // // //                         </td>
// // // // // // // //                         {allMonthCols.map(m=>{
// // // // // // // //                           const v=d.monthlyOutstanding[m]||0;
// // // // // // // //                           const mi2=allMonthCols.indexOf(m);
// // // // // // // //                           const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
// // // // // // // //                           return(<td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
// // // // // // // //                             {v>0?fmt(v):'—'}
// // // // // // // //                           </td>);
// // // // // // // //                         })}
// // // // // // // //                         <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
// // // // // // // //                           {cleared?'✓ Nil':fmt(d.latestOutstanding)}
// // // // // // // //                         </td>
// // // // // // // //                         <td style={{textAlign:'right'}}>
// // // // // // // //                           {d.trend>0?<span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
// // // // // // // //                           :d.trend<0?<span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
// // // // // // // //                           :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
// // // // // // // //                         </td>
// // // // // // // //                         <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
// // // // // // // //                           <button
// // // // // // // //                             onClick={()=>setActiveDealer(d)}
// // // // // // // //                             style={{
// // // // // // // //                               padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',
// // // // // // // //                               background:nextFu?(fuOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.12)'):'transparent',
// // // // // // // //                               border:nextFu?(fuOver?'1px solid #f87171':'1px solid var(--acc)'):'1px solid var(--b2)',
// // // // // // // //                               color:nextFu?(fuOver?'#f87171':'var(--acc)'):'var(--t3)',
// // // // // // // //                               display:'flex',alignItems:'center',gap:4,margin:'0 auto',
// // // // // // // //                             }}>
// // // // // // // //                             <Calendar size={10}/>
// // // // // // // //                             {nextFu
// // // // // // // //                               ? (fuOver?`${Math.abs(fuDays)}d over`:fuDays===0?'Today':`${fuDays}d`)
// // // // // // // //                               : <Plus size={10}/>}
// // // // // // // //                           </button>
// // // // // // // //                           {nextFu&&nextFu.comment&&(
// // // // // // // //                             <div style={{fontSize:9,color:'var(--t3)',marginTop:2,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>
// // // // // // // //                               {nextFu.comment}
// // // // // // // //                             </div>
// // // // // // // //                           )}
// // // // // // // //                         </td>
// // // // // // // //                       </tr>
// // // // // // // //                       {isOpen&&(
// // // // // // // //                         <tr><td colSpan={99} style={{background:'var(--bg2)',padding:'10px 14px'}}>
// // // // // // // //                           <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
// // // // // // // //                             <div style={{display:'flex',gap:3,alignItems:'flex-end',height:30}}>
// // // // // // // //                               {allMonthCols.map(m=>{
// // // // // // // //                                 const v=d.monthlyOutstanding[m]||0;
// // // // // // // //                                 const mx=Math.max(...allMonthCols.map(mc=>d.monthlyOutstanding[mc]||0),1);
// // // // // // // //                                 return(<div key={m} style={{width:18,display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
// // // // // // // //                                   <div style={{width:'100%',height:Math.max((v/mx)*26,v>0?3:1),background:v===0?'var(--b1)':'#f87171',borderRadius:'2px 2px 0 0'}}/>
// // // // // // // //                                   <div style={{fontSize:6,color:'var(--t3)'}}>{m.slice(0,3)}</div>
// // // // // // // //                                 </div>);
// // // // // // // //                               })}
// // // // // // // //                             </div>
// // // // // // // //                             <button className="btnp" style={{fontSize:11,padding:'5px 12px'}}
// // // // // // // //                               onClick={()=>{const dl=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());if(dl)onOpenDealer(dl.id);}}>
// // // // // // // //                               View Dealer
// // // // // // // //                             </button>
// // // // // // // //                             <button className="btn" style={{fontSize:11,padding:'5px 12px',display:'flex',alignItems:'center',gap:4}}
// // // // // // // //                               onClick={()=>setActiveDealer(d)}>
// // // // // // // //                               <Calendar size={11}/> Add Follow-up
// // // // // // // //                             </button>
// // // // // // // //                           </div>
// // // // // // // //                         </td></tr>
// // // // // // // //                       )}
// // // // // // // //                     </React.Fragment>
// // // // // // // //                   );
// // // // // // // //                 })}
// // // // // // // //                 {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
// // // // // // // //               </tbody>
// // // // // // // //               <tfoot><tr>
// // // // // // // //                 <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
// // // // // // // //                 {allMonthCols.map(m=>{
// // // // // // // //                   const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
// // // // // // // //                   return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
// // // // // // // //                 })}
// // // // // // // //                 <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
// // // // // // // //                 <td/><td/>
// // // // // // // //               </tr></tfoot>
// // // // // // // //             </table>
// // // // // // // //           </div>
// // // // // // // //         </div>
// // // // // // // //       </>)}

// // // // // // // //       {/* Followup Modal */}
// // // // // // // //       {activeDealer&&(
// // // // // // // //         <FollowupModal
// // // // // // // //           dealer={activeDealer}
// // // // // // // //           outAmt={activeDealer.latestOutstanding}
// // // // // // // //           existingFollowups={followups}
// // // // // // // //           currentUser={currentUser}
// // // // // // // //           onClose={()=>setActiveDealer(null)}
// // // // // // // //           onSaved={loadFollowups}
// // // // // // // //         />
// // // // // // // //       )}
// // // // // // // //     </div>
// // // // // // // //   );
// // // // // // // // }



// // // // // // // import React, { useState, useMemo, useEffect, useRef } from 'react';
// // // // // // // import { RefreshCw, Search, X, Upload, Plus, Check, Trash2, Calendar, MessageSquare, Bell, Phone, PhoneMissed } from 'lucide-react';
// // // // // // // import { fetchCSV, parseOutstandingCSV } from '../utils';
// // // // // // // import { api, dbOutstandingToApp } from '../api';
// // // // // // // import { Avatar, MultiSelect } from './UI';

// // // // // // // const fmt      = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';
// // // // // // // const todayStr = () => new Date().toISOString().slice(0,10);
// // // // // // // const daysUntil= d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

// // // // // // // // ── Followup Modal ────────────────────────────────────────────────────────────
// // // // // // // function FollowupModal({ dealer, existingFollowups, onClose, onSaved }) {
// // // // // // //   const [date,    setDate]    = useState(todayStr());
// // // // // // //   const [comment, setComment] = useState('');
// // // // // // //   const [amount,  setAmount]  = useState(dealer.latestOutstanding||0);
// // // // // // //   const [saving,  setSaving]  = useState(false);
// // // // // // //   const [err,     setErr]     = useState('');

// // // // // // //   // 3 comment quick-fill boxes
// // // // // // //   const [quickComments, setQuickComments] = useState(['','','']);
// // // // // // //   const setQC = (i,v) => setQuickComments(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // // // // // //   const mine = existingFollowups.filter(f=>
// // // // // // //     f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim()
// // // // // // //   ).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));

// // // // // // //   const handleAdd = async (type='followup') => {
// // // // // // //     if(type==='followup' && !date){ setErr('Date required'); return; }
// // // // // // //     setSaving(true); setErr('');
// // // // // // //     try {
// // // // // // //       const allComments = [comment, ...quickComments].filter(Boolean).join(' | ');
// // // // // // //       await api.addFollowup({
// // // // // // //         dealerName:   dealer.name,
// // // // // // //         salesman:     dealer.matchedSalesman?.id || '',
// // // // // // //         amount:       Number(amount)||0,
// // // // // // //         followupDate: type==='no-pickup' ? todayStr() : date,
// // // // // // //         comment:      type==='no-pickup' ? '📵 Did not pick call' + (allComments?` — ${allComments}`:'') : allComments,
// // // // // // //         type,
// // // // // // //       });
// // // // // // //       setDate(todayStr()); setComment(''); setQuickComments(['','','']); setAmount(dealer.latestOutstanding||0);
// // // // // // //       onSaved();
// // // // // // //     } catch(e){ setErr(e.message); }
// // // // // // //     setSaving(false);
// // // // // // //   };

// // // // // // //   const handleMark = async (id,status) => {
// // // // // // //     await api.updateFollowup(id,{status}); onSaved();
// // // // // // //   };
// // // // // // //   const handleDelete = async (id) => {
// // // // // // //     if(!confirm('Delete this follow-up?')) return;
// // // // // // //     await api.deleteFollowup(id); onSaved();
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // // // // //       <div className="modal" style={{maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
// // // // // // //         {/* Header */}
// // // // // // //         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
// // // // // // //           <div>
// // // // // // //             <div style={{fontSize:16,fontWeight:700}}>{dealer.name}</div>
// // // // // // //             <div style={{fontSize:12,color:'#f87171',marginTop:2}}>
// // // // // // //               Outstanding: {fmt(dealer.latestOutstanding)}
// // // // // // //             </div>
// // // // // // //           </div>
// // // // // // //           <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
// // // // // // //         </div>

// // // // // // //         {/* Add new follow-up */}
// // // // // // //         <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // // // // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
// // // // // // //             <Plus size={13} color="var(--acc)"/> Add Follow-up / Comment
// // // // // // //           </div>

// // // // // // //           {/* Date + Amount */}
// // // // // // //           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
// // // // // // //             <div>
// // // // // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Next Follow-up Date</label>
// // // // // // //               <input type="date" className="inp" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%'}}/>
// // // // // // //             </div>
// // // // // // //             <div>
// // // // // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Expected Payment ₹</label>
// // // // // // //               <input type="number" className="inp" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //           {/* Main comment */}
// // // // // // //           <div style={{marginBottom:8}}>
// // // // // // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Comment</label>
// // // // // // //             <textarea className="inp" value={comment} onChange={e=>setComment(e.target.value)}
// // // // // // //               placeholder="e.g. Will pay after 15th, cheque promised..."
// // // // // // //               rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit'}}/>
// // // // // // //           </div>

// // // // // // //           {/* 3 quick comment boxes */}
// // // // // // //           <div style={{marginBottom:12}}>
// // // // // // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:6,textTransform:'uppercase'}}>Quick Notes (3 fields)</label>
// // // // // // //             <div style={{display:'flex',flexDirection:'column',gap:6}}>
// // // // // // //               {quickComments.map((v,i)=>(
// // // // // // //                 <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
// // // // // // //                   <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right',flexShrink:0}}>{i+1}.</span>
// // // // // // //                   <input className="inp" value={v} onChange={e=>setQC(i,e.target.value)}
// // // // // // //                     placeholder={['Dealer response...','Next action...','Additional info...'][i]}
// // // // // // //                     style={{flex:1,fontSize:12}}/>
// // // // // // //                   {v&&<button onClick={()=>setQC(i,'')} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><X size={11}/></button>}
// // // // // // //                 </div>
// // // // // // //               ))}
// // // // // // //             </div>
// // // // // // //           </div>

// // // // // // //           {err&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>{err}</div>}

// // // // // // //           {/* Action buttons */}
// // // // // // //           <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
// // // // // // //             <button onClick={()=>handleAdd('followup')} disabled={saving} className="btnp"
// // // // // // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
// // // // // // //               {saving?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Calendar size={11}/>}
// // // // // // //               Save Follow-up
// // // // // // //             </button>
// // // // // // //             <button onClick={()=>handleAdd('no-pickup')} disabled={saving} className="btn"
// // // // // // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // // // // // //               <PhoneMissed size={11}/> Did Not Pick Call
// // // // // // //             </button>
// // // // // // //           </div>
// // // // // // //         </div>

// // // // // // //         {/* History */}
// // // // // // //         <div>
// // // // // // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
// // // // // // //             History ({mine.length})
// // // // // // //           </div>
// // // // // // //           {mine.length===0&&(
// // // // // // //             <div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:12}}>No follow-ups yet</div>
// // // // // // //           )}
// // // // // // //           {mine.map(f=>{
// // // // // // //             const days   = daysUntil(f.followupDate);
// // // // // // //             const isDone = f.status==='done';
// // // // // // //             const isOver = !isDone && days<0;
// // // // // // //             const isNoPickup = f.type==='no-pickup' || f.comment?.startsWith('📵');
// // // // // // //             return(
// // // // // // //               <div key={f._id} style={{
// // // // // // //                 padding:'10px 12px',borderRadius:8,marginBottom:8,
// // // // // // //                 background:isNoPickup?'rgba(248,113,113,0.04)':isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.05)':'var(--bg2)',
// // // // // // //                 border:`1px solid ${isNoPickup?'rgba(248,113,113,0.15)':isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'var(--b2)'}`,
// // // // // // //                 opacity:isDone?0.65:1,
// // // // // // //               }}>
// // // // // // //                 <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
// // // // // // //                   <div style={{flex:1,minWidth:0}}>
// // // // // // //                     <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
// // // // // // //                       {isNoPickup
// // // // // // //                         ? <PhoneMissed size={12} color="#f87171"/>
// // // // // // //                         : <Calendar size={12} color={isDone?'#34d399':isOver?'#f87171':'var(--acc)'}/>}
// // // // // // //                       <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>
// // // // // // //                         {f.followupDate}
// // // // // // //                       </span>
// // // // // // //                       <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:600,
// // // // // // //                         background:isNoPickup?'rgba(248,113,113,0.12)':isDone?'rgba(52,211,153,0.12)':isOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.1)',
// // // // // // //                         color:isNoPickup?'#f87171':isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// // // // // // //                         {isNoPickup?'📵 No Pickup':isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// // // // // // //                       </span>
// // // // // // //                       {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// // // // // // //                     </div>
// // // // // // //                     {f.comment&&(
// // // // // // //                       <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5}}>
// // // // // // //                         {f.comment.split(' | ').map((part,i)=>(
// // // // // // //                           <div key={i} style={{display:'flex',gap:4,alignItems:'flex-start'}}>
// // // // // // //                             <MessageSquare size={9} style={{marginTop:2,flexShrink:0}}/>
// // // // // // //                             <span>{part}</span>
// // // // // // //                           </div>
// // // // // // //                         ))}
// // // // // // //                       </div>
// // // // // // //                     )}
// // // // // // //                     <div style={{fontSize:9,color:'var(--t3)',marginTop:4}}>
// // // // // // //                       {new Date(f.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
// // // // // // //                     </div>
// // // // // // //                   </div>
// // // // // // //                   <div style={{display:'flex',flexDirection:'column',gap:4}}>
// // // // // // //                     {!isDone&&!isNoPickup&&(
// // // // // // //                       <button onClick={()=>handleMark(f._id,'done')}
// // // // // // //                         style={{background:'none',border:'1px solid #34d399',color:'#34d399',borderRadius:4,padding:'3px 6px',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:3}}>
// // // // // // //                         <Check size={9}/> Done
// // // // // // //                       </button>
// // // // // // //                     )}
// // // // // // //                     <button onClick={()=>handleDelete(f._id)}
// // // // // // //                       style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3}}>
// // // // // // //                       <Trash2 size={11}/>
// // // // // // //                     </button>
// // // // // // //                   </div>
// // // // // // //                 </div>
// // // // // // //               </div>
// // // // // // //             );
// // // // // // //           })}
// // // // // // //         </div>
// // // // // // //       </div>
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // }


// // // // // // // // ── Inline expanded row with 3 comment boxes + no-pickup ─────────────────────
// // // // // // // function ExpandedRow({ d, dealers, onOpenDealer, setActiveDealer, allMonthCols, loadFollowups }) {
// // // // // // //   const [notes, setNotes]     = useState(['','','']);
// // // // // // //   const [saving, setSaving]   = useState(false);
// // // // // // //   const [saved,  setSaved]    = useState(false);

// // // // // // //   const setNote = (i,v) => setNotes(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // // // // // //   const saveNotes = async () => {
// // // // // // //     const text = notes.filter(Boolean).join(' | ');
// // // // // // //     if(!text) return;
// // // // // // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in to save notes.'); return; }
// // // // // // //     setSaving(true);
// // // // // // //     try {
// // // // // // //       await api.addFollowup({
// // // // // // //         dealerName:   d.name,
// // // // // // //         salesman:     d.matchedSalesman?.id||'',
// // // // // // //         amount:       d.latestOutstanding,
// // // // // // //         followupDate: todayStr(),
// // // // // // //         comment:      text,
// // // // // // //         type:         'comment',
// // // // // // //       });
// // // // // // //       setNotes(['','','']); setSaved(true);
// // // // // // //       setTimeout(()=>setSaved(false), 2000);
// // // // // // //       loadFollowups();
// // // // // // //     } catch(e){ console.warn(e); }
// // // // // // //     setSaving(false);
// // // // // // //   };

// // // // // // //   const logNoPickup = async () => {
// // // // // // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in.'); return; }
// // // // // // //     try {
// // // // // // //       await api.addFollowup({
// // // // // // //         dealerName:   d.name,
// // // // // // //         salesman:     d.matchedSalesman?.id||'',
// // // // // // //         amount:       d.latestOutstanding,
// // // // // // //         followupDate: todayStr(),
// // // // // // //         comment:      '📵 Did not pick call',
// // // // // // //         type:         'no-pickup',
// // // // // // //       });
// // // // // // //       loadFollowups();
// // // // // // //     } catch(e){ console.warn(e); }
// // // // // // //   };

// // // // // // //   return (
// // // // // // //     <tr>
// // // // // // //       <td colSpan={99} style={{background:'var(--bg2)',padding:'12px 14px',borderBottom:'1px solid var(--b1)'}}>
// // // // // // //         <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>

// // // // // // //           {/* 1. View Dealer */}
// // // // // // //           <button onClick={()=>{const dl=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());if(dl)onOpenDealer(dl.id);}}
// // // // // // //             className="btnp" style={{fontSize:11,padding:'6px 12px',whiteSpace:'nowrap',flexShrink:0}}>
// // // // // // //             👤 View Dealer
// // // // // // //           </button>

// // // // // // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // // // // // //           {/* 2. Comment boxes */}
// // // // // // //           <div style={{display:'flex',gap:6,alignItems:'center',flex:1,minWidth:200,flexWrap:'wrap'}}>
// // // // // // //             {notes.map((v,i)=>(
// // // // // // //               <input key={i} className="inp" value={v} onChange={e=>setNote(i,e.target.value)}
// // // // // // //                 placeholder={`Comment ${i+1}...`}
// // // // // // //                 style={{flex:1,minWidth:100,fontSize:11}}
// // // // // // //                 onKeyDown={e=>e.key==='Enter'&&saveNotes()}/>
// // // // // // //             ))}
// // // // // // //             <button onClick={saveNotes} disabled={saving||!notes.some(Boolean)}
// // // // // // //               className="btn" style={{fontSize:11,padding:'5px 10px',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4,
// // // // // // //                 color:saved?'#34d399':'var(--t2)',border:saved?'1px solid #34d399':'1px solid var(--b2)'}}>
// // // // // // //               {saving?<RefreshCw size={10} style={{animation:'spin .7s linear infinite'}}/>:saved?<Check size={10}/>:<MessageSquare size={10}/>}
// // // // // // //               {saved?'Saved!':'Save'}
// // // // // // //             </button>
// // // // // // //           </div>

// // // // // // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // // // // // //           {/* 3. Follow-up date */}
// // // // // // //           <button onClick={()=>setActiveDealer(d)}
// // // // // // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // // // // // //               color:'var(--acc)',border:'1px solid rgba(99,102,241,0.3)'}}>
// // // // // // //             <Calendar size={12}/> Add Follow-up Date
// // // // // // //           </button>

// // // // // // //           {/* 4. Did not pick */}
// // // // // // //           <button onClick={logNoPickup}
// // // // // // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // // // // // //               color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // // // // // //             <PhoneMissed size={12}/> Did Not Pick Call
// // // // // // //           </button>

// // // // // // //         </div>
// // // // // // //       </td>
// // // // // // //     </tr>
// // // // // // //   );
// // // // // // // }

// // // // // // // // ── Main Outstanding Component ────────────────────────────────────────────────
// // // // // // // export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
// // // // // // //   const isAdmin = currentUser?.role === 'admin';
// // // // // // //   const [loading,      setLoading]    = useState(false);
// // // // // // //   const [uploading,    setUploading]  = useState(false);
// // // // // // //   const [error,        setError]      = useState('');
// // // // // // //   const [uploadMsg,    setUploadMsg]  = useState('');
// // // // // // //   const [search,       setSearch]     = useState('');
// // // // // // //   const [smFilter,     setSmFilter]   = useState([]);
// // // // // // //   const [tab,          setTab]        = useState('outstanding');
// // // // // // //   const [expanded,     setExpanded]   = useState({});
// // // // // // //   const [followups,    setFollowups]  = useState([]);
// // // // // // //   const [activeDealer, setActiveDealer] = useState(null);
// // // // // // //   const fileRef = useRef();

// // // // // // //   useEffect(()=>{ loadFromDB(); loadFollowups(); },[]);

// // // // // // //   const loadFollowups = async () => {
// // // // // // //     try {
// // // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // // //       if(!token) return;
// // // // // // //       const data = await api.getFollowups();
// // // // // // //       setFollowups(data||[]);
// // // // // // //     } catch(e){ console.warn('Followups load failed:',e.message); }
// // // // // // //   };

// // // // // // //   const loadFromDB = async () => {
// // // // // // //     setLoading(true); setError('');
// // // // // // //     try {
// // // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // // //       if(token){
// // // // // // //         const data = await api.getOutstanding();
// // // // // // //         if(data?.length>0){
// // // // // // //           if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
// // // // // // //           setLoading(false); return;
// // // // // // //         }
// // // // // // //       }
// // // // // // //       const allUsers = Object.values(users);
// // // // // // //       const source   = allUsers.find(u=>u.role==='admin'&&u.url_outstanding)||allUsers.find(u=>u.url_outstanding);
// // // // // // //       if(source?.url_outstanding){
// // // // // // //         const csv  = await fetchCSV(source.url_outstanding);
// // // // // // //         const rows = parseOutstandingCSV(csv,source.id);
// // // // // // //         if(setOutstandingData) setOutstandingData(rows);
// // // // // // //       }
// // // // // // //     } catch(e){ setError('Load failed: '+e.message); }
// // // // // // //     setLoading(false);
// // // // // // //   };

// // // // // // //   const handleUpload = async (file) => {
// // // // // // //     if(!file) return;
// // // // // // //     setUploading(true); setUploadMsg(''); setError('');
// // // // // // //     try {
// // // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // // //       if(!token) throw new Error('Not logged in to server');
// // // // // // //       const res = await api.uploadOutstanding(file);
// // // // // // //       setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
// // // // // // //       await loadFromDB();
// // // // // // //     } catch(e){ setError('Upload failed: '+e.message); }
// // // // // // //     setUploading(false);
// // // // // // //   };

// // // // // // //   const allMonthCols = useMemo(()=>{
// // // // // // //     const cols=new Set();
// // // // // // //     outstandingData.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
// // // // // // //     return [...cols];
// // // // // // //   },[outstandingData]);

// // // // // // //   const dealerSmMap = useMemo(()=>{
// // // // // // //     const map={};
// // // // // // //     dealers.forEach(d=>{ if(d.salesman&&users[d.salesman]) map[d.name.toLowerCase().trim()]=users[d.salesman]; });
// // // // // // //     return map;
// // // // // // //   },[dealers,users]);

// // // // // // //   const followupMap = useMemo(()=>{
// // // // // // //     const map={};
// // // // // // //     followups.forEach(f=>{
// // // // // // //       const k=f.dealerName?.toLowerCase().trim();
// // // // // // //       if(k){ if(!map[k])map[k]=[]; map[k].push(f); }
// // // // // // //     });
// // // // // // //     return map;
// // // // // // //   },[followups]);

// // // // // // //   const filtered = useMemo(()=>{
// // // // // // //     let d=outstandingData.map(x=>({
// // // // // // //       ...x,
// // // // // // //       matchedSalesman: dealerSmMap[x.name.toLowerCase().trim()]||null,
// // // // // // //       dealerFollowups: followupMap[x.name.toLowerCase().trim()]||[],
// // // // // // //     }));
// // // // // // //     if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
// // // // // // //     if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
// // // // // // //     if(tab==='followups')   d=d.filter(x=>x.dealerFollowups.some(f=>f.status==='pending'));
// // // // // // //     if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
// // // // // // //     if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));
// // // // // // //     return d;
// // // // // // //   },[outstandingData,dealerSmMap,followupMap,tab,search,smFilter,isAdmin]);

// // // // // // //   const totalOut       = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
// // // // // // //   const countOut       = outstandingData.filter(d=>d.latestOutstanding>0).length;
// // // // // // //   const countCleared   = outstandingData.filter(d=>d.latestOutstanding===0).length;
// // // // // // //   const pendingFu      = followups.filter(f=>f.status==='pending');
// // // // // // //   const overdueFu      = pendingFu.filter(f=>daysUntil(f.followupDate)<0);
// // // // // // //   const smOptions      = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
// // // // // // //   const toggle         = id=>setExpanded(e=>({...e,[id]:!e[id]}));

// // // // // // //   return (
// // // // // // //     <div className="fade">
// // // // // // //       <div style={{marginBottom:16}}>
// // // // // // //         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
// // // // // // //         <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
// // // // // // //           <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
// // // // // // //           {overdueFu.length>0&&(
// // // // // // //             <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:6,padding:'3px 10px'}}>
// // // // // // //               <Bell size={12} color="#f87171"/>
// // // // // // //               <span style={{fontSize:11,color:'#f87171',fontWeight:600}}>{overdueFu.length} overdue</span>
// // // // // // //             </div>
// // // // // // //           )}
// // // // // // //         </div>
// // // // // // //       </div>

// // // // // // //       {/* Action bar */}
// // // // // // //       <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
// // // // // // //         {isAdmin&&<>
// // // // // // //           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
// // // // // // //             onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
// // // // // // //           <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
// // // // // // //             <Upload size={13}/>{uploading?'Uploading...':'Upload Outstanding'}
// // // // // // //           </button>
// // // // // // //         </>}
// // // // // // //         <button onClick={()=>{loadFromDB();loadFollowups();}} disabled={loading} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
// // // // // // //           <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
// // // // // // //         </button>
// // // // // // //         {outstandingData.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{outstandingData.length} dealers</span>}
// // // // // // //         {uploadMsg&&<span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
// // // // // // //         {error&&<span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
// // // // // // //       </div>

// // // // // // //       {/* KPI */}
// // // // // // //       {outstandingData.length>0&&(
// // // // // // //         <div className="stat-grid" style={{marginBottom:14}}>
// // // // // // //           {[
// // // // // // //             {l:'Total Outstanding', v:fmt(totalOut),       c:'#f87171'},
// // // // // // //             {l:'Dealers with Due',  v:countOut,            c:'#fbbf24'},
// // // // // // //             {l:'Cleared',           v:countCleared,        c:'#34d399'},
// // // // // // //             {l:'Pending Follow-ups',v:pendingFu.length,    c:'var(--acc)'},
// // // // // // //           ].map(k=>(
// // // // // // //             <div key={k.l} className="stat-card">
// // // // // // //               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
// // // // // // //               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
// // // // // // //             </div>
// // // // // // //           ))}
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {/* Month summary */}
// // // // // // //       {allMonthCols.length>0&&(
// // // // // // //         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
// // // // // // //           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600}}>Month-wise Summary</div>
// // // // // // //           <div style={{overflowX:'auto'}}>
// // // // // // //             <table>
// // // // // // //               <thead><tr>
// // // // // // //                 <th>Month</th><th style={{textAlign:'right'}}>Total</th>
// // // // // // //                 <th style={{textAlign:'right'}}>Dealers Due</th><th style={{textAlign:'right'}}>Change</th>
// // // // // // //               </tr></thead>
// // // // // // //               <tbody>
// // // // // // //                 {allMonthCols.map((month,mi)=>{
// // // // // // //                   const vals=outstandingData.map(d=>d.monthlyOutstanding[month]||0);
// // // // // // //                   const total=vals.reduce((a,b)=>a+b,0);
// // // // // // //                   const due=vals.filter(v=>v>0).length;
// // // // // // //                   const prev=mi>0?outstandingData.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
// // // // // // //                   const chg=mi>0?total-prev:0;
// // // // // // //                   return(<tr key={month}>
// // // // // // //                     <td style={{fontWeight:600}}>{month}</td>
// // // // // // //                     <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
// // // // // // //                     <td style={{textAlign:'right'}}>{due}</td>
// // // // // // //                     <td style={{textAlign:'right',color:chg>0?'#f87171':chg<0?'#34d399':'var(--t3)',fontWeight:600}}>
// // // // // // //                       {chg!==0?(chg>0?'▲':'▼')+'₹'+Number(Math.abs(chg)).toLocaleString('en-IN'):'—'}
// // // // // // //                     </td>
// // // // // // //                   </tr>);
// // // // // // //                 })}
// // // // // // //               </tbody>
// // // // // // //             </table>
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       )}

// // // // // // //       {/* Dealer list */}
// // // // // // //       {outstandingData.length>0&&(<>
// // // // // // //         <div className="tabs">
// // // // // // //           {[
// // // // // // //             {id:'outstanding',label:`Due (${countOut})`},
// // // // // // //             {id:'cleared',    label:`Cleared (${countCleared})`},
// // // // // // //             {id:'followups',  label:`Follow-ups (${pendingFu.length})`,badge:overdueFu.length},
// // // // // // //             {id:'all',        label:`All (${outstandingData.length})`},
// // // // // // //           ].map(t=>(
// // // // // // //             <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)} style={{position:'relative'}}>
// // // // // // //               {t.label}
// // // // // // //               {t.badge>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'#f87171',borderRadius:'50%',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
// // // // // // //             </button>
// // // // // // //           ))}
// // // // // // //         </div>

// // // // // // //         <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
// // // // // // //           <div style={{position:'relative'}}>
// // // // // // //             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
// // // // // // //             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
// // // // // // //               value={search} onChange={e=>setSearch(e.target.value)}/>
// // // // // // //           </div>
// // // // // // //           {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
// // // // // // //             renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
// // // // // // //           {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
// // // // // // //           <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
// // // // // // //         </div>

// // // // // // //         <div className="card" style={{padding:0,overflow:'hidden'}}>
// // // // // // //           <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
// // // // // // //             <table>
// // // // // // //               <thead><tr>
// // // // // // //                 <th>#</th><th>Dealer</th>
// // // // // // //                 {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
// // // // // // //                 <th style={{textAlign:'right'}}>Latest</th>
// // // // // // //                 <th style={{textAlign:'right'}}>Trend</th>
// // // // // // //                 <th style={{textAlign:'center'}}>Follow-up</th>
// // // // // // //               </tr></thead>
// // // // // // //               <tbody>
// // // // // // //                 {filtered.map((d,i)=>{
// // // // // // //                   const isOpen  = expanded[d.id];
// // // // // // //                   const cleared = d.latestOutstanding===0;
// // // // // // //                   const dFu     = d.dealerFollowups.filter(f=>f.status==='pending');
// // // // // // //                   const nextFu  = [...dFu].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate))[0];
// // // // // // //                   const fuDays  = nextFu ? daysUntil(nextFu.followupDate) : null;
// // // // // // //                   const fuOver  = fuDays!==null && fuDays<0;
// // // // // // //                   const noPickups = d.dealerFollowups.filter(f=>f.type==='no-pickup'||f.comment?.startsWith('📵'));
// // // // // // //                   const latestNP = noPickups[noPickups.length-1];

// // // // // // //                   return(
// // // // // // //                     <React.Fragment key={d.id}>
// // // // // // //                       <tr style={{background:cleared?'rgba(52,211,153,0.03)':'transparent',cursor:'pointer'}} onClick={()=>toggle(d.id)}>
// // // // // // //                         <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
// // // // // // //                         <td style={{maxWidth:220}}>
// // // // // // //                           <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
// // // // // // //                           {/* Salesman + status badges */}
// // // // // // //                           <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center',flexWrap:'wrap'}}>
// // // // // // //                             {cleared&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
// // // // // // //                             {d.matchedSalesman&&<div style={{display:'flex',alignItems:'center',gap:3}}>
// // // // // // //                               <Avatar user={d.matchedSalesman} size={13}/>
// // // // // // //                               <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
// // // // // // //                             </div>}
// // // // // // //                           </div>
// // // // // // //                           {/* Latest comment / no-pickup — clearly visible */}
// // // // // // //                           {(()=>{
// // // // // // //                             const allFu = [...d.dealerFollowups].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
// // // // // // //                             const latest = allFu[0];
// // // // // // //                             if(!latest) return null;
// // // // // // //                             const isNP  = latest.type==='no-pickup'||latest.comment?.startsWith('📵');
// // // // // // //                             const isComment = latest.type==='comment';
// // // // // // //                             const txt = latest.comment?.replace('📵 Did not pick call','').replace('—','').trim();
// // // // // // //                             return(
// // // // // // //                               <div style={{marginTop:4,padding:'3px 6px',borderRadius:5,
// // // // // // //                                 background:isNP?'rgba(248,113,113,0.1)':isComment?'rgba(99,102,241,0.08)':'rgba(52,211,153,0.07)',
// // // // // // //                                 border:`1px solid ${isNP?'rgba(248,113,113,0.25)':isComment?'rgba(99,102,241,0.2)':'rgba(52,211,153,0.2)'}`,
// // // // // // //                                 maxWidth:200,
// // // // // // //                               }}>
// // // // // // //                                 <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // // // // //                                   {isNP
// // // // // // //                                     ? <><PhoneMissed size={10} color="#f87171"/><span style={{fontSize:10,color:'#f87171',fontWeight:600}}>Did not pick call</span></>
// // // // // // //                                     : <><MessageSquare size={10} color="var(--acc)"/><span style={{fontSize:10,color:'var(--acc)',fontWeight:600}}>Note</span></>}
// // // // // // //                                   <span style={{fontSize:9,color:'var(--t3)',marginLeft:'auto'}}>
// // // // // // //                                     {latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
// // // // // // //                                   </span>
// // // // // // //                                 </div>
// // // // // // //                                 {txt&&<div style={{fontSize:10,color:'var(--t2)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{txt}</div>}
// // // // // // //                               </div>
// // // // // // //                             );
// // // // // // //                           })()}
// // // // // // //                         </td>
// // // // // // //                         {allMonthCols.map(m=>{
// // // // // // //                           const v=d.monthlyOutstanding[m]||0;
// // // // // // //                           const mi2=allMonthCols.indexOf(m);
// // // // // // //                           const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
// // // // // // //                           return(<td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
// // // // // // //                             {v>0?fmt(v):'—'}
// // // // // // //                           </td>);
// // // // // // //                         })}
// // // // // // //                         <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
// // // // // // //                           {cleared?'✓ Nil':fmt(d.latestOutstanding)}
// // // // // // //                         </td>
// // // // // // //                         <td style={{textAlign:'right'}}>
// // // // // // //                           {d.trend>0?<span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
// // // // // // //                           :d.trend<0?<span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
// // // // // // //                           :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
// // // // // // //                         </td>
// // // // // // //                         <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
// // // // // // //                           <button onClick={()=>setActiveDealer(d)} style={{
// // // // // // //                             padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',
// // // // // // //                             background:nextFu?(fuOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.12)'):'transparent',
// // // // // // //                             border:nextFu?(fuOver?'1px solid #f87171':'1px solid var(--acc)'):'1px solid var(--b2)',
// // // // // // //                             color:nextFu?(fuOver?'#f87171':'var(--acc)'):'var(--t3)',
// // // // // // //                             display:'flex',alignItems:'center',gap:4,margin:'0 auto',
// // // // // // //                           }}>
// // // // // // //                             <Calendar size={10}/>
// // // // // // //                             {nextFu?(fuOver?`${Math.abs(fuDays)}d over`:fuDays===0?'Today':`${fuDays}d`):<Plus size={10}/>}
// // // // // // //                           </button>
// // // // // // //                           {nextFu?.comment&&(
// // // // // // //                             <div style={{fontSize:8,color:'var(--t3)',marginTop:2,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>
// // // // // // //                               {nextFu.comment.split(' | ')[0]}
// // // // // // //                             </div>
// // // // // // //                           )}
// // // // // // //                         </td>
// // // // // // //                       </tr>
// // // // // // //                       {isOpen&&<ExpandedRow d={d} dealers={dealers} onOpenDealer={onOpenDealer} setActiveDealer={setActiveDealer} allMonthCols={allMonthCols} loadFollowups={loadFollowups}/>}
// // // // // // //                     </React.Fragment>
// // // // // // //                   );
// // // // // // //                 })}
// // // // // // //                 {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
// // // // // // //               </tbody>
// // // // // // //               <tfoot><tr>
// // // // // // //                 <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
// // // // // // //                 {allMonthCols.map(m=>{
// // // // // // //                   const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
// // // // // // //                   return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
// // // // // // //                 })}
// // // // // // //                 <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
// // // // // // //                 <td/><td/>
// // // // // // //               </tr></tfoot>
// // // // // // //             </table>
// // // // // // //           </div>
// // // // // // //         </div>
// // // // // // //       </>)}

// // // // // // //       {activeDealer&&(
// // // // // // //         <FollowupModal
// // // // // // //           dealer={activeDealer}
// // // // // // //           existingFollowups={followups}
// // // // // // //           currentUser={currentUser}
// // // // // // //           onClose={()=>setActiveDealer(null)}
// // // // // // //           onSaved={loadFollowups}
// // // // // // //         />
// // // // // // //       )}
// // // // // // //     </div>
// // // // // // //   );
// // // // // // // }


// // // // // // import React, { useState, useMemo, useEffect, useRef } from 'react';
// // // // // // import { RefreshCw, Search, X, Upload, Plus, Check, Trash2, Calendar, MessageSquare, Bell, Phone, PhoneMissed } from 'lucide-react';
// // // // // // import { fetchCSV, parseOutstandingCSV } from '../utils';
// // // // // // import { api, dbOutstandingToApp } from '../api';
// // // // // // import { Avatar, MultiSelect } from './UI';

// // // // // // const fmt      = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';
// // // // // // const todayStr = () => new Date().toISOString().slice(0,10);
// // // // // // const daysUntil= d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

// // // // // // // ── Followup Modal ────────────────────────────────────────────────────────────
// // // // // // function FollowupModal({ dealer, existingFollowups, onClose, onSaved }) {
// // // // // //   const [date,    setDate]    = useState(todayStr());
// // // // // //   const [comment, setComment] = useState('');
// // // // // //   const [amount,  setAmount]  = useState(dealer.latestOutstanding||0);
// // // // // //   const [saving,  setSaving]  = useState(false);
// // // // // //   const [err,     setErr]     = useState('');

// // // // // //   // 3 comment quick-fill boxes
// // // // // //   const [quickComments, setQuickComments] = useState(['','','']);
// // // // // //   const setQC = (i,v) => setQuickComments(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // // // // //   const mine = existingFollowups.filter(f=>
// // // // // //     f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim()
// // // // // //   ).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));

// // // // // //   const handleAdd = async (type='followup') => {
// // // // // //     if(type==='followup' && !date){ setErr('Date required'); return; }
// // // // // //     setSaving(true); setErr('');
// // // // // //     try {
// // // // // //       const allComments = [comment, ...quickComments].filter(Boolean).join(' | ');
// // // // // //       await api.addFollowup({
// // // // // //         dealerName:   dealer.name,
// // // // // //         salesman:     dealer.matchedSalesman?.id || '',
// // // // // //         amount:       Number(amount)||0,
// // // // // //         followupDate: type==='no-pickup' ? todayStr() : date,
// // // // // //         comment:      type==='no-pickup' ? '📵 Did not pick call' + (allComments?` — ${allComments}`:'') : allComments,
// // // // // //         type,
// // // // // //       });
// // // // // //       setDate(todayStr()); setComment(''); setQuickComments(['','','']); setAmount(dealer.latestOutstanding||0);
// // // // // //       onSaved();
// // // // // //     } catch(e){ setErr(e.message); }
// // // // // //     setSaving(false);
// // // // // //   };

// // // // // //   const handleMark = async (id,status) => {
// // // // // //     await api.updateFollowup(id,{status}); onSaved();
// // // // // //   };
// // // // // //   const handleDelete = async (id) => {
// // // // // //     if(!confirm('Delete this follow-up?')) return;
// // // // // //     await api.deleteFollowup(id); onSaved();
// // // // // //   };

// // // // // //   return (
// // // // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // // // //       <div className="modal" style={{maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
// // // // // //         {/* Header */}
// // // // // //         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
// // // // // //           <div>
// // // // // //             <div style={{fontSize:16,fontWeight:700}}>{dealer.name}</div>
// // // // // //             <div style={{fontSize:12,color:'#f87171',marginTop:2}}>
// // // // // //               Outstanding: {fmt(dealer.latestOutstanding)}
// // // // // //             </div>
// // // // // //           </div>
// // // // // //           <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
// // // // // //         </div>

// // // // // //         {/* Add new follow-up */}
// // // // // //         <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // // // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
// // // // // //             <Plus size={13} color="var(--acc)"/> Add Follow-up / Comment
// // // // // //           </div>

// // // // // //           {/* Date + Amount */}
// // // // // //           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
// // // // // //             <div>
// // // // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Next Follow-up Date</label>
// // // // // //               <input type="date" className="inp" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%'}}/>
// // // // // //             </div>
// // // // // //             <div>
// // // // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Expected Payment ₹</label>
// // // // // //               <input type="number" className="inp" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// // // // // //             </div>
// // // // // //           </div>

// // // // // //           {/* Main comment */}
// // // // // //           <div style={{marginBottom:8}}>
// // // // // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Comment</label>
// // // // // //             <textarea className="inp" value={comment} onChange={e=>setComment(e.target.value)}
// // // // // //               placeholder="e.g. Will pay after 15th, cheque promised..."
// // // // // //               rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit'}}/>
// // // // // //           </div>

// // // // // //           {/* 3 quick comment boxes */}
// // // // // //           <div style={{marginBottom:12}}>
// // // // // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:6,textTransform:'uppercase'}}>Quick Notes (3 fields)</label>
// // // // // //             <div style={{display:'flex',flexDirection:'column',gap:6}}>
// // // // // //               {quickComments.map((v,i)=>(
// // // // // //                 <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
// // // // // //                   <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right',flexShrink:0}}>{i+1}.</span>
// // // // // //                   <input className="inp" value={v} onChange={e=>setQC(i,e.target.value)}
// // // // // //                     placeholder={['Dealer response...','Next action...','Additional info...'][i]}
// // // // // //                     style={{flex:1,fontSize:12}}/>
// // // // // //                   {v&&<button onClick={()=>setQC(i,'')} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><X size={11}/></button>}
// // // // // //                 </div>
// // // // // //               ))}
// // // // // //             </div>
// // // // // //           </div>

// // // // // //           {err&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>{err}</div>}

// // // // // //           {/* Action buttons */}
// // // // // //           <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
// // // // // //             <button onClick={()=>handleAdd('followup')} disabled={saving} className="btnp"
// // // // // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
// // // // // //               {saving?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Calendar size={11}/>}
// // // // // //               Save Follow-up
// // // // // //             </button>
// // // // // //             <button onClick={()=>handleAdd('no-pickup')} disabled={saving} className="btn"
// // // // // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // // // // //               <PhoneMissed size={11}/> Did Not Pick Call
// // // // // //             </button>
// // // // // //           </div>
// // // // // //         </div>

// // // // // //         {/* History */}
// // // // // //         <div>
// // // // // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
// // // // // //             History ({mine.length})
// // // // // //           </div>
// // // // // //           {mine.length===0&&(
// // // // // //             <div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:12}}>No follow-ups yet</div>
// // // // // //           )}
// // // // // //           {mine.map(f=>{
// // // // // //             const days   = daysUntil(f.followupDate);
// // // // // //             const isDone = f.status==='done';
// // // // // //             const isOver = !isDone && days<0;
// // // // // //             const isNoPickup = f.type==='no-pickup' || f.comment?.startsWith('📵');
// // // // // //             return(
// // // // // //               <div key={f._id} style={{
// // // // // //                 padding:'10px 12px',borderRadius:8,marginBottom:8,
// // // // // //                 background:isNoPickup?'rgba(248,113,113,0.04)':isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.05)':'var(--bg2)',
// // // // // //                 border:`1px solid ${isNoPickup?'rgba(248,113,113,0.15)':isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'var(--b2)'}`,
// // // // // //                 opacity:isDone?0.65:1,
// // // // // //               }}>
// // // // // //                 <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
// // // // // //                   <div style={{flex:1,minWidth:0}}>
// // // // // //                     <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
// // // // // //                       {isNoPickup
// // // // // //                         ? <PhoneMissed size={12} color="#f87171"/>
// // // // // //                         : <Calendar size={12} color={isDone?'#34d399':isOver?'#f87171':'var(--acc)'}/>}
// // // // // //                       <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>
// // // // // //                         {f.followupDate}
// // // // // //                       </span>
// // // // // //                       <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:600,
// // // // // //                         background:isNoPickup?'rgba(248,113,113,0.12)':isDone?'rgba(52,211,153,0.12)':isOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.1)',
// // // // // //                         color:isNoPickup?'#f87171':isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// // // // // //                         {isNoPickup?'📵 No Pickup':isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// // // // // //                       </span>
// // // // // //                       {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// // // // // //                     </div>
// // // // // //                     {f.comment&&(
// // // // // //                       <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5}}>
// // // // // //                         {f.comment.split(' | ').map((part,i)=>(
// // // // // //                           <div key={i} style={{display:'flex',gap:4,alignItems:'flex-start'}}>
// // // // // //                             <MessageSquare size={9} style={{marginTop:2,flexShrink:0}}/>
// // // // // //                             <span>{part}</span>
// // // // // //                           </div>
// // // // // //                         ))}
// // // // // //                       </div>
// // // // // //                     )}
// // // // // //                     <div style={{fontSize:9,color:'var(--t3)',marginTop:4}}>
// // // // // //                       {new Date(f.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
// // // // // //                     </div>
// // // // // //                   </div>
// // // // // //                   <div style={{display:'flex',flexDirection:'column',gap:4}}>
// // // // // //                     {!isDone&&!isNoPickup&&(
// // // // // //                       <button onClick={()=>handleMark(f._id,'done')}
// // // // // //                         style={{background:'none',border:'1px solid #34d399',color:'#34d399',borderRadius:4,padding:'3px 6px',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:3}}>
// // // // // //                         <Check size={9}/> Done
// // // // // //                       </button>
// // // // // //                     )}
// // // // // //                     <button onClick={()=>handleDelete(f._id)}
// // // // // //                       style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3}}>
// // // // // //                       <Trash2 size={11}/>
// // // // // //                     </button>
// // // // // //                   </div>
// // // // // //                 </div>
// // // // // //               </div>
// // // // // //             );
// // // // // //           })}
// // // // // //         </div>
// // // // // //       </div>
// // // // // //     </div>
// // // // // //   );
// // // // // // }


// // // // // // // ── Inline expanded row with 3 comment boxes + no-pickup ─────────────────────
// // // // // // function ExpandedRow({ d, dealers, onOpenDealer, setActiveDealer, allMonthCols, loadFollowups }) {
// // // // // //   const [notes, setNotes]     = useState(['','','']);
// // // // // //   const [saving, setSaving]   = useState(false);
// // // // // //   const [saved,  setSaved]    = useState(false);

// // // // // //   const setNote = (i,v) => setNotes(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // // // // //   const saveNotes = async () => {
// // // // // //     const text = notes.filter(Boolean).join(' | ');
// // // // // //     if(!text) return;
// // // // // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in to save notes.'); return; }
// // // // // //     setSaving(true);
// // // // // //     try {
// // // // // //       await api.addFollowup({
// // // // // //         dealerName:   d.name,
// // // // // //         salesman:     d.matchedSalesman?.id||'',
// // // // // //         amount:       d.latestOutstanding,
// // // // // //         followupDate: todayStr(),
// // // // // //         comment:      text,
// // // // // //         type:         'comment',
// // // // // //       });
// // // // // //       setNotes(['','','']); setSaved(true);
// // // // // //       setTimeout(()=>setSaved(false), 2000);
// // // // // //       loadFollowups();
// // // // // //     } catch(e){ console.warn(e); }
// // // // // //     setSaving(false);
// // // // // //   };

// // // // // //   const logNoPickup = async () => {
// // // // // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in.'); return; }
// // // // // //     try {
// // // // // //       await api.addFollowup({
// // // // // //         dealerName:   d.name,
// // // // // //         salesman:     d.matchedSalesman?.id||'',
// // // // // //         amount:       d.latestOutstanding,
// // // // // //         followupDate: todayStr(),
// // // // // //         comment:      '📵 Did not pick call',
// // // // // //         type:         'no-pickup',
// // // // // //       });
// // // // // //       loadFollowups();
// // // // // //     } catch(e){ console.warn(e); }
// // // // // //   };

// // // // // //   return (
// // // // // //     <tr>
// // // // // //       <td colSpan={99} style={{background:'var(--bg2)',padding:'12px 14px',borderBottom:'1px solid var(--b1)'}}>
// // // // // //         <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>

// // // // // //           {/* 1. View Dealer */}
// // // // // //           <button onClick={()=>{const dl=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());if(dl)onOpenDealer(dl.id);}}
// // // // // //             className="btnp" style={{fontSize:11,padding:'6px 12px',whiteSpace:'nowrap',flexShrink:0}}>
// // // // // //             👤 View Dealer
// // // // // //           </button>

// // // // // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // // // // //           {/* 2. Comment boxes */}
// // // // // //           <div style={{display:'flex',gap:6,alignItems:'center',flex:1,minWidth:200,flexWrap:'wrap'}}>
// // // // // //             {notes.map((v,i)=>(
// // // // // //               <input key={i} className="inp" value={v} onChange={e=>setNote(i,e.target.value)}
// // // // // //                 placeholder={`Comment ${i+1}...`}
// // // // // //                 style={{flex:1,minWidth:100,fontSize:11}}
// // // // // //                 onKeyDown={e=>e.key==='Enter'&&saveNotes()}/>
// // // // // //             ))}
// // // // // //             <button onClick={saveNotes} disabled={saving||!notes.some(Boolean)}
// // // // // //               className="btn" style={{fontSize:11,padding:'5px 10px',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4,
// // // // // //                 color:saved?'#34d399':'var(--t2)',border:saved?'1px solid #34d399':'1px solid var(--b2)'}}>
// // // // // //               {saving?<RefreshCw size={10} style={{animation:'spin .7s linear infinite'}}/>:saved?<Check size={10}/>:<MessageSquare size={10}/>}
// // // // // //               {saved?'Saved!':'Save'}
// // // // // //             </button>
// // // // // //           </div>

// // // // // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // // // // //           {/* 3. Follow-up date */}
// // // // // //           <button onClick={()=>setActiveDealer(d)}
// // // // // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // // // // //               color:'var(--acc)',border:'1px solid rgba(99,102,241,0.3)'}}>
// // // // // //             <Calendar size={12}/> Add Follow-up Date
// // // // // //           </button>

// // // // // //           {/* 4. Did not pick */}
// // // // // //           <button onClick={logNoPickup}
// // // // // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // // // // //               color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // // // // //             <PhoneMissed size={12}/> Did Not Pick Call
// // // // // //           </button>

// // // // // //         </div>
// // // // // //       </td>
// // // // // //     </tr>
// // // // // //   );
// // // // // // }

// // // // // // // ── Main Outstanding Component ────────────────────────────────────────────────
// // // // // // export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
// // // // // //   const isAdmin = currentUser?.role === 'admin';
// // // // // //   const [loading,      setLoading]    = useState(false);
// // // // // //   const [uploading,    setUploading]  = useState(false);
// // // // // //   const [error,        setError]      = useState('');
// // // // // //   const [uploadMsg,    setUploadMsg]  = useState('');
// // // // // //   const [search,       setSearch]     = useState('');
// // // // // //   const [smFilter,     setSmFilter]   = useState([]);
// // // // // //   const [tab,          setTab]        = useState('outstanding');
// // // // // //   const [expanded,     setExpanded]   = useState({});
// // // // // //   const [followups,    setFollowups]  = useState([]);
// // // // // //   const [activeDealer, setActiveDealer] = useState(null);
// // // // // //   const fileRef = useRef();

// // // // // //   useEffect(()=>{ loadFromDB(); loadFollowups(); },[]);

// // // // // //   const loadFollowups = async () => {
// // // // // //     try {
// // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // //       if(!token) return;
// // // // // //       const data = await api.getFollowups();
// // // // // //       setFollowups(data||[]);
// // // // // //     } catch(e){ console.warn('Followups load failed:',e.message); }
// // // // // //   };

// // // // // //   const loadFromDB = async () => {
// // // // // //     setLoading(true); setError('');
// // // // // //     try {
// // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // //       if(token){
// // // // // //         const data = await api.getOutstanding();
// // // // // //         if(data?.length>0){
// // // // // //           if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
// // // // // //           setLoading(false); return;
// // // // // //         }
// // // // // //       }
// // // // // //       const allUsers = Object.values(users);
// // // // // //       const source   = allUsers.find(u=>u.role==='admin'&&u.url_outstanding)||allUsers.find(u=>u.url_outstanding);
// // // // // //       if(source?.url_outstanding){
// // // // // //         const csv  = await fetchCSV(source.url_outstanding);
// // // // // //         const rows = parseOutstandingCSV(csv,source.id);
// // // // // //         if(setOutstandingData) setOutstandingData(rows);
// // // // // //       }
// // // // // //     } catch(e){ setError('Load failed: '+e.message); }
// // // // // //     setLoading(false);
// // // // // //   };

// // // // // //   const handleUpload = async (file) => {
// // // // // //     if(!file) return;
// // // // // //     setUploading(true); setUploadMsg(''); setError('');
// // // // // //     try {
// // // // // //       const token = localStorage.getItem('stp_jwt');
// // // // // //       if(!token) throw new Error('Not logged in to server');
// // // // // //       const res = await api.uploadOutstanding(file);
// // // // // //       setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
// // // // // //       await loadFromDB();
// // // // // //     } catch(e){ setError('Upload failed: '+e.message); }
// // // // // //     setUploading(false);
// // // // // //   };

// // // // // //   const allMonthCols = useMemo(()=>{
// // // // // //     const cols=new Set();
// // // // // //     outstandingData.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
// // // // // //     return [...cols];
// // // // // //   },[outstandingData]);

// // // // // //   const dealerSmMap = useMemo(()=>{
// // // // // //     const map={};
// // // // // //     dealers.forEach(d=>{ if(d.salesman&&users[d.salesman]) map[d.name.toLowerCase().trim()]=users[d.salesman]; });
// // // // // //     return map;
// // // // // //   },[dealers,users]);

// // // // // //   const followupMap = useMemo(()=>{
// // // // // //     const map={};
// // // // // //     followups.forEach(f=>{
// // // // // //       const k=f.dealerName?.toLowerCase().trim();
// // // // // //       if(k){ if(!map[k])map[k]=[]; map[k].push(f); }
// // // // // //     });
// // // // // //     return map;
// // // // // //   },[followups]);

// // // // // //   const filtered = useMemo(()=>{
// // // // // //     let d=outstandingData.map(x=>({
// // // // // //       ...x,
// // // // // //       matchedSalesman: dealerSmMap[x.name.toLowerCase().trim()]||null,
// // // // // //       dealerFollowups: followupMap[x.name.toLowerCase().trim()]||[],
// // // // // //     }));
// // // // // //     if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
// // // // // //     if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
// // // // // //     if(tab==='followups')   d=d.filter(x=>x.dealerFollowups.some(f=>f.status==='pending'));
// // // // // //     if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
// // // // // //     if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));
// // // // // //     return d;
// // // // // //   },[outstandingData,dealerSmMap,followupMap,tab,search,smFilter,isAdmin]);

// // // // // //   const totalOut       = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
// // // // // //   const countOut       = outstandingData.filter(d=>d.latestOutstanding>0).length;
// // // // // //   const countCleared   = outstandingData.filter(d=>d.latestOutstanding===0).length;
// // // // // //   const pendingFu      = followups.filter(f=>f.status==='pending');
// // // // // //   const overdueFu      = pendingFu.filter(f=>daysUntil(f.followupDate)<0);
// // // // // //   const smOptions      = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
// // // // // //   const toggle         = id=>setExpanded(e=>({...e,[id]:!e[id]}));

// // // // // //   return (
// // // // // //     <div className="fade">
// // // // // //       <div style={{marginBottom:16}}>
// // // // // //         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
// // // // // //         <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
// // // // // //           <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
// // // // // //           {overdueFu.length>0&&(
// // // // // //             <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:6,padding:'3px 10px'}}>
// // // // // //               <Bell size={12} color="#f87171"/>
// // // // // //               <span style={{fontSize:11,color:'#f87171',fontWeight:600}}>{overdueFu.length} overdue</span>
// // // // // //             </div>
// // // // // //           )}
// // // // // //         </div>
// // // // // //       </div>

// // // // // //       {/* Action bar */}
// // // // // //       <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
// // // // // //         {isAdmin&&<>
// // // // // //           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
// // // // // //             onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
// // // // // //           <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
// // // // // //             <Upload size={13}/>{uploading?'Uploading...':'Upload Outstanding'}
// // // // // //           </button>
// // // // // //         </>}
// // // // // //         <button onClick={()=>{loadFromDB();loadFollowups();}} disabled={loading} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
// // // // // //           <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
// // // // // //         </button>
// // // // // //         {outstandingData.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{outstandingData.length} dealers</span>}
// // // // // //         {uploadMsg&&<span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
// // // // // //         {error&&<span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
// // // // // //       </div>

// // // // // //       {/* KPI */}
// // // // // //       {outstandingData.length>0&&(
// // // // // //         <div className="stat-grid" style={{marginBottom:14}}>
// // // // // //           {[
// // // // // //             {l:'Total Outstanding', v:fmt(totalOut),       c:'#f87171'},
// // // // // //             {l:'Dealers with Due',  v:countOut,            c:'#fbbf24'},
// // // // // //             {l:'Cleared',           v:countCleared,        c:'#34d399'},
// // // // // //             {l:'Pending Follow-ups',v:pendingFu.length,    c:'var(--acc)'},
// // // // // //           ].map(k=>(
// // // // // //             <div key={k.l} className="stat-card">
// // // // // //               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
// // // // // //               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
// // // // // //             </div>
// // // // // //           ))}
// // // // // //         </div>
// // // // // //       )}

// // // // // //       {/* Month summary */}
// // // // // //       {allMonthCols.length>0&&(
// // // // // //         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
// // // // // //           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600}}>Month-wise Summary</div>
// // // // // //           <div style={{overflowX:'auto'}}>
// // // // // //             <table>
// // // // // //               <thead><tr>
// // // // // //                 <th>Month</th><th style={{textAlign:'right'}}>Total</th>
// // // // // //                 <th style={{textAlign:'right'}}>Dealers Due</th><th style={{textAlign:'right'}}>Change</th>
// // // // // //               </tr></thead>
// // // // // //               <tbody>
// // // // // //                 {allMonthCols.map((month,mi)=>{
// // // // // //                   const vals=outstandingData.map(d=>d.monthlyOutstanding[month]||0);
// // // // // //                   const total=vals.reduce((a,b)=>a+b,0);
// // // // // //                   const due=vals.filter(v=>v>0).length;
// // // // // //                   const prev=mi>0?outstandingData.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
// // // // // //                   const chg=mi>0?total-prev:0;
// // // // // //                   return(<tr key={month}>
// // // // // //                     <td style={{fontWeight:600}}>{month}</td>
// // // // // //                     <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
// // // // // //                     <td style={{textAlign:'right'}}>{due}</td>
// // // // // //                     <td style={{textAlign:'right',color:chg>0?'#f87171':chg<0?'#34d399':'var(--t3)',fontWeight:600}}>
// // // // // //                       {chg!==0?(chg>0?'▲':'▼')+'₹'+Number(Math.abs(chg)).toLocaleString('en-IN'):'—'}
// // // // // //                     </td>
// // // // // //                   </tr>);
// // // // // //                 })}
// // // // // //               </tbody>
// // // // // //             </table>
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       )}

// // // // // //       {/* Dealer list */}
// // // // // //       {outstandingData.length>0&&(<>
// // // // // //         <div className="tabs">
// // // // // //           {[
// // // // // //             {id:'outstanding',label:`Due (${countOut})`},
// // // // // //             {id:'cleared',    label:`Cleared (${countCleared})`},
// // // // // //             {id:'followups',  label:`Follow-ups (${pendingFu.length})`,badge:overdueFu.length},
// // // // // //             {id:'all',        label:`All (${outstandingData.length})`},
// // // // // //           ].map(t=>(
// // // // // //             <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)} style={{position:'relative'}}>
// // // // // //               {t.label}
// // // // // //               {t.badge>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'#f87171',borderRadius:'50%',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
// // // // // //             </button>
// // // // // //           ))}
// // // // // //         </div>

// // // // // //         <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
// // // // // //           <div style={{position:'relative'}}>
// // // // // //             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
// // // // // //             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
// // // // // //               value={search} onChange={e=>setSearch(e.target.value)}/>
// // // // // //           </div>
// // // // // //           {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
// // // // // //             renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
// // // // // //           {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
// // // // // //           <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
// // // // // //         </div>

// // // // // //         <div className="card" style={{padding:0,overflow:'hidden'}}>
// // // // // //           <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
// // // // // //             <table>
// // // // // //               <thead><tr>
// // // // // //                 <th>#</th><th>Dealer</th>
// // // // // //                 {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
// // // // // //                 <th style={{textAlign:'right'}}>Latest</th>
// // // // // //                 <th style={{textAlign:'right'}}>Trend</th>
// // // // // //                 <th style={{textAlign:'center'}}>Follow-up</th>
// // // // // //               </tr></thead>
// // // // // //               <tbody>
// // // // // //                 {filtered.map((d,i)=>{
// // // // // //                   const isOpen  = expanded[d.id];
// // // // // //                   const cleared = d.latestOutstanding===0;
// // // // // //                   const dFu     = d.dealerFollowups.filter(f=>f.status==='pending');
// // // // // //                   const nextFu  = [...dFu].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate))[0];
// // // // // //                   const fuDays  = nextFu ? daysUntil(nextFu.followupDate) : null;
// // // // // //                   const fuOver  = fuDays!==null && fuDays<0;
// // // // // //                   const noPickups = d.dealerFollowups.filter(f=>f.type==='no-pickup'||f.comment?.startsWith('📵'));
// // // // // //                   const latestNP = noPickups[noPickups.length-1];

// // // // // //                   return(
// // // // // //                     <React.Fragment key={d.id}>
// // // // // //                       <tr style={{background:cleared?'rgba(52,211,153,0.03)':'transparent',cursor:'pointer'}} onClick={()=>toggle(d.id)}>
// // // // // //                         <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
// // // // // //                         <td style={{maxWidth:220}}>
// // // // // //                           <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
// // // // // //                           {/* Salesman + status badges */}
// // // // // //                           <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center',flexWrap:'wrap'}}>
// // // // // //                             {cleared&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
// // // // // //                             {d.matchedSalesman&&<div style={{display:'flex',alignItems:'center',gap:3}}>
// // // // // //                               <Avatar user={d.matchedSalesman} size={13}/>
// // // // // //                               <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
// // // // // //                             </div>}
// // // // // //                           </div>
// // // // // //                           {/* Latest comment / no-pickup — clearly visible */}
// // // // // //                           {(()=>{
// // // // // //                             const allFu = [...d.dealerFollowups].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
// // // // // //                             const latest = allFu[0];
// // // // // //                             if(!latest) return null;
// // // // // //                             const isNP  = latest.type==='no-pickup'||latest.comment?.startsWith('📵');
// // // // // //                             const isComment = latest.type==='comment';
// // // // // //                             const txt = latest.comment?.replace('📵 Did not pick call','').replace('—','').trim();
// // // // // //                             return(
// // // // // //                               <div style={{marginTop:4,padding:'3px 6px',borderRadius:5,
// // // // // //                                 background:isNP?'rgba(248,113,113,0.1)':isComment?'rgba(99,102,241,0.08)':'rgba(52,211,153,0.07)',
// // // // // //                                 border:`1px solid ${isNP?'rgba(248,113,113,0.25)':isComment?'rgba(99,102,241,0.2)':'rgba(52,211,153,0.2)'}`,
// // // // // //                                 maxWidth:200,
// // // // // //                               }}>
// // // // // //                                 <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // // // //                                   {isNP
// // // // // //                                     ? <><PhoneMissed size={10} color="#f87171"/><span style={{fontSize:10,color:'#f87171',fontWeight:600}}>Did not pick call</span></>
// // // // // //                                     : <><MessageSquare size={10} color="var(--acc)"/><span style={{fontSize:10,color:'var(--acc)',fontWeight:600}}>Note</span></>}
// // // // // //                                   <span style={{fontSize:9,color:'var(--t3)',marginLeft:'auto'}}>
// // // // // //                                     {latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
// // // // // //                                   </span>
// // // // // //                                 </div>
// // // // // //                                 {txt&&<div style={{fontSize:10,color:'var(--t2)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{txt}</div>}
// // // // // //                               </div>
// // // // // //                             );
// // // // // //                           })()}
// // // // // //                         </td>
// // // // // //                         {allMonthCols.map(m=>{
// // // // // //                           const v=d.monthlyOutstanding[m]||0;
// // // // // //                           const mi2=allMonthCols.indexOf(m);
// // // // // //                           const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
// // // // // //                           return(<td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
// // // // // //                             {v>0?fmt(v):'—'}
// // // // // //                           </td>);
// // // // // //                         })}
// // // // // //                         <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
// // // // // //                           {cleared?'✓ Nil':fmt(d.latestOutstanding)}
// // // // // //                         </td>
// // // // // //                         <td style={{textAlign:'right'}}>
// // // // // //                           {d.trend>0?<span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
// // // // // //                           :d.trend<0?<span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
// // // // // //                           :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
// // // // // //                         </td>
// // // // // //                         <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
// // // // // //                           <button onClick={()=>setActiveDealer(d)} style={{
// // // // // //                             padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',
// // // // // //                             background:nextFu?(fuOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.12)'):'transparent',
// // // // // //                             border:nextFu?(fuOver?'1px solid #f87171':'1px solid var(--acc)'):'1px solid var(--b2)',
// // // // // //                             color:nextFu?(fuOver?'#f87171':'var(--acc)'):'var(--t3)',
// // // // // //                             display:'flex',alignItems:'center',gap:4,margin:'0 auto',
// // // // // //                           }}>
// // // // // //                             <Calendar size={10}/>
// // // // // //                             {nextFu?(fuOver?`${Math.abs(fuDays)}d over`:fuDays===0?'Today':`${fuDays}d`):<Plus size={10}/>}
// // // // // //                           </button>
// // // // // //                           {nextFu?.comment&&(
// // // // // //                             <div style={{fontSize:8,color:'var(--t3)',marginTop:2,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>
// // // // // //                               {nextFu.comment.split(' | ')[0]}
// // // // // //                             </div>
// // // // // //                           )}
// // // // // //                         </td>
// // // // // //                       </tr>
// // // // // //                       {isOpen&&<ExpandedRow d={d} dealers={dealers} onOpenDealer={onOpenDealer} setActiveDealer={setActiveDealer} allMonthCols={allMonthCols} loadFollowups={loadFollowups}/>}
// // // // // //                     </React.Fragment>
// // // // // //                   );
// // // // // //                 })}
// // // // // //                 {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
// // // // // //               </tbody>
// // // // // //               <tfoot><tr>
// // // // // //                 <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
// // // // // //                 {allMonthCols.map(m=>{
// // // // // //                   const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
// // // // // //                   return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
// // // // // //                 })}
// // // // // //                 <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
// // // // // //                 <td/><td/>
// // // // // //               </tr></tfoot>
// // // // // //             </table>
// // // // // //           </div>
// // // // // //         </div>
// // // // // //       </>)}

// // // // // //       {activeDealer&&(
// // // // // //         <FollowupModal
// // // // // //           dealer={activeDealer}
// // // // // //           existingFollowups={followups}
// // // // // //           currentUser={currentUser}
// // // // // //           onClose={()=>setActiveDealer(null)}
// // // // // //           onSaved={loadFollowups}
// // // // // //         />
// // // // // //       )}
// // // // // //     </div>
// // // // // //   );
// // // // // // }

// // // // // import React, { useState, useMemo, useEffect, useRef } from 'react';
// // // // // import { RefreshCw, Search, X, Upload, Plus, Check, Trash2, Calendar, MessageSquare, Bell, Phone, PhoneMissed } from 'lucide-react';
// // // // // import { fetchCSV, parseOutstandingCSV } from '../utils';
// // // // // import { api, dbOutstandingToApp } from '../api';
// // // // // import { Avatar, MultiSelect } from './UI';

// // // // // const fmt      = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';
// // // // // const todayStr = () => new Date().toISOString().slice(0,10);
// // // // // const daysUntil= d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

// // // // // // ── Followup Modal ────────────────────────────────────────────────────────────
// // // // // function FollowupModal({ dealer, existingFollowups, onClose, onSaved }) {
// // // // //   const [date,    setDate]    = useState(todayStr());
// // // // //   const [comment, setComment] = useState('');
// // // // //   const [amount,  setAmount]  = useState(dealer.latestOutstanding||0);
// // // // //   const [saving,  setSaving]  = useState(false);
// // // // //   const [err,     setErr]     = useState('');

// // // // //   // 3 comment quick-fill boxes
// // // // //   const [quickComments, setQuickComments] = useState(['','','']);
// // // // //   const setQC = (i,v) => setQuickComments(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // // // //   const mine = existingFollowups.filter(f=>
// // // // //     f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim()
// // // // //   ).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));

// // // // //   const handleAdd = async (type='followup') => {
// // // // //     if(type==='followup' && !date){ setErr('Date required'); return; }
// // // // //     setSaving(true); setErr('');
// // // // //     try {
// // // // //       const allComments = [comment, ...quickComments].filter(Boolean).join(' | ');
// // // // //       await api.addFollowup({
// // // // //         dealerName:   dealer.name,
// // // // //         salesman:     dealer.matchedSalesman?.id || '',
// // // // //         amount:       Number(amount)||0,
// // // // //         followupDate: type==='no-pickup' ? todayStr() : date,
// // // // //         comment:      type==='no-pickup' ? '📵 Did not pick call' + (allComments?` — ${allComments}`:'') : allComments,
// // // // //         type,
// // // // //       });
// // // // //       setDate(todayStr()); setComment(''); setQuickComments(['','','']); setAmount(dealer.latestOutstanding||0);
// // // // //       onSaved();
// // // // //     } catch(e){ setErr(e.message); }
// // // // //     setSaving(false);
// // // // //   };

// // // // //   const handleMark = async (id,status) => {
// // // // //     await api.updateFollowup(id,{status}); onSaved();
// // // // //   };
// // // // //   const handleDelete = async (id) => {
// // // // //     if(!confirm('Delete this follow-up?')) return;
// // // // //     await api.deleteFollowup(id); onSaved();
// // // // //   };

// // // // //   return (
// // // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // // //       <div className="modal" style={{maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
// // // // //         {/* Header */}
// // // // //         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
// // // // //           <div>
// // // // //             <div style={{fontSize:16,fontWeight:700}}>{dealer.name}</div>
// // // // //             <div style={{fontSize:12,color:'#f87171',marginTop:2}}>
// // // // //               Outstanding: {fmt(dealer.latestOutstanding)}
// // // // //             </div>
// // // // //           </div>
// // // // //           <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
// // // // //         </div>

// // // // //         {/* Add new follow-up */}
// // // // //         <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
// // // // //             <Plus size={13} color="var(--acc)"/> Add Follow-up / Comment
// // // // //           </div>

// // // // //           {/* Date + Amount */}
// // // // //           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
// // // // //             <div>
// // // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Next Follow-up Date</label>
// // // // //               <input type="date" className="inp" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%'}}/>
// // // // //             </div>
// // // // //             <div>
// // // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Expected Payment ₹</label>
// // // // //               <input type="number" className="inp" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// // // // //             </div>
// // // // //           </div>

// // // // //           {/* Main comment */}
// // // // //           <div style={{marginBottom:8}}>
// // // // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Comment</label>
// // // // //             <textarea className="inp" value={comment} onChange={e=>setComment(e.target.value)}
// // // // //               placeholder="e.g. Will pay after 15th, cheque promised..."
// // // // //               rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit'}}/>
// // // // //           </div>

// // // // //           {/* 3 quick comment boxes */}
// // // // //           <div style={{marginBottom:12}}>
// // // // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:6,textTransform:'uppercase'}}>Quick Notes (3 fields)</label>
// // // // //             <div style={{display:'flex',flexDirection:'column',gap:6}}>
// // // // //               {quickComments.map((v,i)=>(
// // // // //                 <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
// // // // //                   <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right',flexShrink:0}}>{i+1}.</span>
// // // // //                   <input className="inp" value={v} onChange={e=>setQC(i,e.target.value)}
// // // // //                     placeholder={['Dealer response...','Next action...','Additional info...'][i]}
// // // // //                     style={{flex:1,fontSize:12}}/>
// // // // //                   {v&&<button onClick={()=>setQC(i,'')} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><X size={11}/></button>}
// // // // //                 </div>
// // // // //               ))}
// // // // //             </div>
// // // // //           </div>

// // // // //           {err&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>{err}</div>}

// // // // //           {/* Action buttons */}
// // // // //           <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
// // // // //             <button onClick={()=>handleAdd('followup')} disabled={saving} className="btnp"
// // // // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
// // // // //               {saving?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Calendar size={11}/>}
// // // // //               Save Follow-up
// // // // //             </button>
// // // // //             <button onClick={()=>handleAdd('no-pickup')} disabled={saving} className="btn"
// // // // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // // // //               <PhoneMissed size={11}/> Did Not Pick Call
// // // // //             </button>
// // // // //           </div>
// // // // //         </div>

// // // // //         {/* History */}
// // // // //         <div>
// // // // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
// // // // //             History ({mine.length})
// // // // //           </div>
// // // // //           {mine.length===0&&(
// // // // //             <div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:12}}>No follow-ups yet</div>
// // // // //           )}
// // // // //           {mine.map(f=>{
// // // // //             const days   = daysUntil(f.followupDate);
// // // // //             const isDone = f.status==='done';
// // // // //             const isOver = !isDone && days<0;
// // // // //             const isNoPickup = f.type==='no-pickup' || f.comment?.startsWith('📵');
// // // // //             return(
// // // // //               <div key={f._id} style={{
// // // // //                 padding:'10px 12px',borderRadius:8,marginBottom:8,
// // // // //                 background:isNoPickup?'rgba(248,113,113,0.04)':isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.05)':'var(--bg2)',
// // // // //                 border:`1px solid ${isNoPickup?'rgba(248,113,113,0.15)':isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'var(--b2)'}`,
// // // // //                 opacity:isDone?0.65:1,
// // // // //               }}>
// // // // //                 <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
// // // // //                   <div style={{flex:1,minWidth:0}}>
// // // // //                     <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
// // // // //                       {isNoPickup
// // // // //                         ? <PhoneMissed size={12} color="#f87171"/>
// // // // //                         : <Calendar size={12} color={isDone?'#34d399':isOver?'#f87171':'var(--acc)'}/>}
// // // // //                       <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>
// // // // //                         {f.followupDate}
// // // // //                       </span>
// // // // //                       <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:600,
// // // // //                         background:isNoPickup?'rgba(248,113,113,0.12)':isDone?'rgba(52,211,153,0.12)':isOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.1)',
// // // // //                         color:isNoPickup?'#f87171':isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// // // // //                         {isNoPickup?'📵 No Pickup':isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// // // // //                       </span>
// // // // //                       {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// // // // //                     </div>
// // // // //                     {f.comment&&(
// // // // //                       <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5}}>
// // // // //                         {f.comment.split(' | ').map((part,i)=>(
// // // // //                           <div key={i} style={{display:'flex',gap:4,alignItems:'flex-start'}}>
// // // // //                             <MessageSquare size={9} style={{marginTop:2,flexShrink:0}}/>
// // // // //                             <span>{part}</span>
// // // // //                           </div>
// // // // //                         ))}
// // // // //                       </div>
// // // // //                     )}
// // // // //                     <div style={{fontSize:9,color:'var(--t3)',marginTop:4}}>
// // // // //                       {new Date(f.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
// // // // //                     </div>
// // // // //                   </div>
// // // // //                   <div style={{display:'flex',flexDirection:'column',gap:4}}>
// // // // //                     {!isDone&&!isNoPickup&&(
// // // // //                       <button onClick={()=>handleMark(f._id,'done')}
// // // // //                         style={{background:'none',border:'1px solid #34d399',color:'#34d399',borderRadius:4,padding:'3px 6px',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:3}}>
// // // // //                         <Check size={9}/> Done
// // // // //                       </button>
// // // // //                     )}
// // // // //                     <button onClick={()=>handleDelete(f._id)}
// // // // //                       style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3}}>
// // // // //                       <Trash2 size={11}/>
// // // // //                     </button>
// // // // //                   </div>
// // // // //                 </div>
// // // // //               </div>
// // // // //             );
// // // // //           })}
// // // // //         </div>
// // // // //       </div>
// // // // //     </div>
// // // // //   );
// // // // // }


// // // // // // ── Inline expanded row with 3 comment boxes + no-pickup ─────────────────────
// // // // // function ExpandedRow({ d, dealers, onOpenDealer, setActiveDealer, allMonthCols, loadFollowups }) {
// // // // //   const [notes, setNotes]     = useState(['','','']);
// // // // //   const [saving, setSaving]   = useState(false);
// // // // //   const [saved,  setSaved]    = useState(false);

// // // // //   const setNote = (i,v) => setNotes(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // // // //   const saveNotes = async () => {
// // // // //     const text = notes.filter(Boolean).join(' | ');
// // // // //     if(!text) return;
// // // // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in to save notes.'); return; }
// // // // //     setSaving(true);
// // // // //     try {
// // // // //       await api.addFollowup({
// // // // //         dealerName:   d.name,
// // // // //         salesman:     d.matchedSalesman?.id||'',
// // // // //         amount:       d.latestOutstanding,
// // // // //         followupDate: todayStr(),
// // // // //         comment:      text,
// // // // //         type:         'comment',
// // // // //       });
// // // // //       setNotes(['','','']); setSaved(true);
// // // // //       setTimeout(()=>setSaved(false), 2000);
// // // // //       loadFollowups();
// // // // //     } catch(e){ console.warn(e); }
// // // // //     setSaving(false);
// // // // //   };

// // // // //   const logNoPickup = async () => {
// // // // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in.'); return; }
// // // // //     try {
// // // // //       await api.addFollowup({
// // // // //         dealerName:   d.name,
// // // // //         salesman:     d.matchedSalesman?.id||'',
// // // // //         amount:       d.latestOutstanding,
// // // // //         followupDate: todayStr(),
// // // // //         comment:      '📵 Did not pick call',
// // // // //         type:         'no-pickup',
// // // // //       });
// // // // //       loadFollowups();
// // // // //     } catch(e){ console.warn(e); }
// // // // //   };

// // // // //   return (
// // // // //     <tr>
// // // // //       <td colSpan={99} style={{background:'var(--bg2)',padding:'12px 14px',borderBottom:'1px solid var(--b1)'}}>
// // // // //         <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>

// // // // //           {/* 1. View Dealer */}
// // // // //           <button onClick={()=>{const dl=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());if(dl)onOpenDealer(dl.id);}}
// // // // //             className="btnp" style={{fontSize:11,padding:'6px 12px',whiteSpace:'nowrap',flexShrink:0}}>
// // // // //             👤 View Dealer
// // // // //           </button>

// // // // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // // // //           {/* 2. Comment boxes */}
// // // // //           <div style={{display:'flex',gap:6,alignItems:'center',flex:1,minWidth:200,flexWrap:'wrap'}}>
// // // // //             {notes.map((v,i)=>(
// // // // //               <input key={i} className="inp" value={v} onChange={e=>setNote(i,e.target.value)}
// // // // //                 placeholder={`Comment ${i+1}...`}
// // // // //                 style={{flex:1,minWidth:100,fontSize:11}}
// // // // //                 onKeyDown={e=>e.key==='Enter'&&saveNotes()}/>
// // // // //             ))}
// // // // //             <button onClick={saveNotes} disabled={saving||!notes.some(Boolean)}
// // // // //               className="btn" style={{fontSize:11,padding:'5px 10px',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4,
// // // // //                 color:saved?'#34d399':'var(--t2)',border:saved?'1px solid #34d399':'1px solid var(--b2)'}}>
// // // // //               {saving?<RefreshCw size={10} style={{animation:'spin .7s linear infinite'}}/>:saved?<Check size={10}/>:<MessageSquare size={10}/>}
// // // // //               {saved?'Saved!':'Save'}
// // // // //             </button>
// // // // //           </div>

// // // // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // // // //           {/* 3. Follow-up date */}
// // // // //           <button onClick={()=>setActiveDealer(d)}
// // // // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // // // //               color:'var(--acc)',border:'1px solid rgba(99,102,241,0.3)'}}>
// // // // //             <Calendar size={12}/> Add Follow-up Date
// // // // //           </button>

// // // // //           {/* 4. Did not pick */}
// // // // //           <button onClick={logNoPickup}
// // // // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // // // //               color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // // // //             <PhoneMissed size={12}/> Did Not Pick Call
// // // // //           </button>

// // // // //         </div>
// // // // //       </td>
// // // // //     </tr>
// // // // //   );
// // // // // }

// // // // // // ── Main Outstanding Component ────────────────────────────────────────────────
// // // // // export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
// // // // //   const isAdmin = currentUser?.role === 'admin';
// // // // //   const [loading,      setLoading]    = useState(false);
// // // // //   const [uploading,    setUploading]  = useState(false);
// // // // //   const [error,        setError]      = useState('');
// // // // //   const [uploadMsg,    setUploadMsg]  = useState('');
// // // // //   const [search,       setSearch]     = useState('');
// // // // //   const [smFilter,     setSmFilter]   = useState([]);
// // // // //   const [tab,          setTab]        = useState('outstanding');
// // // // //   const [expanded,     setExpanded]   = useState({});
// // // // //   const [followups,    setFollowups]  = useState([]);
// // // // //   const [activeDealer, setActiveDealer] = useState(null);
// // // // //   const fileRef = useRef();

// // // // //   useEffect(()=>{ loadFromDB(); loadFollowups(); },[]);

// // // // //   const loadFollowups = async () => {
// // // // //     try {
// // // // //       const token = localStorage.getItem('stp_jwt');
// // // // //       if(!token) return;
// // // // //       const data = await api.getFollowups();
// // // // //       setFollowups(data||[]);
// // // // //     } catch(e){ console.warn('Followups load failed:',e.message); }
// // // // //   };

// // // // //   const loadFromDB = async () => {
// // // // //     setLoading(true); setError('');
// // // // //     try {
// // // // //       const token = localStorage.getItem('stp_jwt');
// // // // //       if(token){
// // // // //         const data = await api.getOutstanding();
// // // // //         if(data?.length>0){
// // // // //           if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
// // // // //           setLoading(false); return;
// // // // //         }
// // // // //       }
// // // // //       const allUsers = Object.values(users);
// // // // //       const source   = allUsers.find(u=>u.role==='admin'&&u.url_outstanding)||allUsers.find(u=>u.url_outstanding);
// // // // //       if(source?.url_outstanding){
// // // // //         const csv  = await fetchCSV(source.url_outstanding);
// // // // //         const rows = parseOutstandingCSV(csv,source.id);
// // // // //         if(setOutstandingData) setOutstandingData(rows);
// // // // //       }
// // // // //     } catch(e){ setError('Load failed: '+e.message); }
// // // // //     setLoading(false);
// // // // //   };

// // // // //   const handleUpload = async (file) => {
// // // // //     if(!file) return;
// // // // //     setUploading(true); setUploadMsg(''); setError('');
// // // // //     try {
// // // // //       const token = localStorage.getItem('stp_jwt');
// // // // //       if(!token) throw new Error('Not logged in to server');
// // // // //       const res = await api.uploadOutstanding(file);
// // // // //       setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
// // // // //       await loadFromDB();
// // // // //     } catch(e){ setError('Upload failed: '+e.message); }
// // // // //     setUploading(false);
// // // // //   };

// // // // //   // Filter outstanding to only show salesman's dealers when not admin
// // // // //   const myDealerNames = useMemo(()=>{
// // // // //     if(isAdmin) return null; // null = show all
// // // // //     return new Set(dealers.map(d=>d.name.toLowerCase().trim()));
// // // // //   },[dealers,isAdmin]);

// // // // //   const filteredOutstanding = useMemo(()=>{
// // // // //     if(!myDealerNames) return outstandingData; // admin sees all
// // // // //     return outstandingData.filter(o=>myDealerNames.has(o.name?.toLowerCase().trim()));
// // // // //   },[outstandingData, myDealerNames]);

// // // // //   const allMonthCols = useMemo(()=>{
// // // // //     const cols=new Set();
// // // // //     filteredOutstanding.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
// // // // //     return [...cols];
// // // // //   },[filteredOutstanding]);

// // // // //   const dealerSmMap = useMemo(()=>{
// // // // //     const map={};
// // // // //     dealers.forEach(d=>{ if(d.salesman&&users[d.salesman]) map[d.name.toLowerCase().trim()]=users[d.salesman]; });
// // // // //     return map;
// // // // //   },[dealers,users]);

// // // // //   const followupMap = useMemo(()=>{
// // // // //     const map={};
// // // // //     followups.forEach(f=>{
// // // // //       const k=f.dealerName?.toLowerCase().trim();
// // // // //       if(k){ if(!map[k])map[k]=[]; map[k].push(f); }
// // // // //     });
// // // // //     return map;
// // // // //   },[followups]);

// // // // //   const filtered = useMemo(()=>{
// // // // //     let d=filteredOutstanding.map(x=>({
// // // // //       ...x,
// // // // //       matchedSalesman: dealerSmMap[x.name.toLowerCase().trim()]||null,
// // // // //       dealerFollowups: followupMap[x.name.toLowerCase().trim()]||[],
// // // // //     }));
// // // // //     if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
// // // // //     if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
// // // // //     if(tab==='followups')   d=d.filter(x=>x.dealerFollowups.some(f=>f.status==='pending'));
// // // // //     if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
// // // // //     if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));
// // // // //     return d;
// // // // //   },[outstandingData,dealerSmMap,followupMap,tab,search,smFilter,isAdmin]);

// // // // //   const totalOut       = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
// // // // //   const countOut       = filteredOutstanding.filter(d=>d.latestOutstanding>0).length;
// // // // //   const countCleared   = filteredOutstanding.filter(d=>d.latestOutstanding===0).length;
// // // // //   const pendingFu      = followups.filter(f=>f.status==='pending');
// // // // //   const overdueFu      = pendingFu.filter(f=>daysUntil(f.followupDate)<0);
// // // // //   const smOptions      = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
// // // // //   const toggle         = id=>setExpanded(e=>({...e,[id]:!e[id]}));

// // // // //   return (
// // // // //     <div className="fade">
// // // // //       <div style={{marginBottom:16}}>
// // // // //         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
// // // // //         <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
// // // // //           <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
// // // // //           {overdueFu.length>0&&(
// // // // //             <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:6,padding:'3px 10px'}}>
// // // // //               <Bell size={12} color="#f87171"/>
// // // // //               <span style={{fontSize:11,color:'#f87171',fontWeight:600}}>{overdueFu.length} overdue</span>
// // // // //             </div>
// // // // //           )}
// // // // //         </div>
// // // // //       </div>

// // // // //       {/* Action bar */}
// // // // //       <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
// // // // //         {isAdmin&&<>
// // // // //           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
// // // // //             onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
// // // // //           <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
// // // // //             <Upload size={13}/>{uploading?'Uploading...':'Upload Outstanding'}
// // // // //           </button>
// // // // //         </>}
// // // // //         <button onClick={()=>{loadFromDB();loadFollowups();}} disabled={loading} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
// // // // //           <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
// // // // //         </button>
// // // // //         {filteredOutstanding.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{filteredOutstanding.length} dealers</span>}
// // // // //         {uploadMsg&&<span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
// // // // //         {error&&<span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
// // // // //       </div>

// // // // //       {/* KPI */}
// // // // //       {filteredOutstanding.length>0&&(
// // // // //         <div className="stat-grid" style={{marginBottom:14}}>
// // // // //           {[
// // // // //             {l:'Total Outstanding', v:fmt(totalOut),       c:'#f87171'},
// // // // //             {l:'Dealers with Due',  v:countOut,            c:'#fbbf24'},
// // // // //             {l:'Cleared',           v:countCleared,        c:'#34d399'},
// // // // //             {l:'Pending Follow-ups',v:pendingFu.length,    c:'var(--acc)'},
// // // // //           ].map(k=>(
// // // // //             <div key={k.l} className="stat-card">
// // // // //               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
// // // // //               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
// // // // //             </div>
// // // // //           ))}
// // // // //         </div>
// // // // //       )}

// // // // //       {/* Month summary */}
// // // // //       {allMonthCols.length>0&&(
// // // // //         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
// // // // //           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600}}>Month-wise Summary</div>
// // // // //           <div style={{overflowX:'auto'}}>
// // // // //             <table>
// // // // //               <thead><tr>
// // // // //                 <th>Month</th><th style={{textAlign:'right'}}>Total</th>
// // // // //                 <th style={{textAlign:'right'}}>Dealers Due</th><th style={{textAlign:'right'}}>Change</th>
// // // // //               </tr></thead>
// // // // //               <tbody>
// // // // //                 {allMonthCols.map((month,mi)=>{
// // // // //                   const vals=filteredOutstanding.map(d=>d.monthlyOutstanding[month]||0);
// // // // //                   const total=vals.reduce((a,b)=>a+b,0);
// // // // //                   const due=vals.filter(v=>v>0).length;
// // // // //                   const prev=mi>0?filteredOutstanding.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
// // // // //                   const chg=mi>0?total-prev:0;
// // // // //                   return(<tr key={month}>
// // // // //                     <td style={{fontWeight:600}}>{month}</td>
// // // // //                     <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
// // // // //                     <td style={{textAlign:'right'}}>{due}</td>
// // // // //                     <td style={{textAlign:'right',color:chg>0?'#f87171':chg<0?'#34d399':'var(--t3)',fontWeight:600}}>
// // // // //                       {chg!==0?(chg>0?'▲':'▼')+'₹'+Number(Math.abs(chg)).toLocaleString('en-IN'):'—'}
// // // // //                     </td>
// // // // //                   </tr>);
// // // // //                 })}
// // // // //               </tbody>
// // // // //             </table>
// // // // //           </div>
// // // // //         </div>
// // // // //       )}

// // // // //       {/* Dealer list */}
// // // // //       {filteredOutstanding.length>0&&(<>
// // // // //         <div className="tabs">
// // // // //           {[
// // // // //             {id:'outstanding',label:`Due (${countOut})`},
// // // // //             {id:'cleared',    label:`Cleared (${countCleared})`},
// // // // //             {id:'followups',  label:`Follow-ups (${pendingFu.length})`,badge:overdueFu.length},
// // // // //             {id:'all',        label:`All (${filteredOutstanding.length})`},
// // // // //           ].map(t=>(
// // // // //             <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)} style={{position:'relative'}}>
// // // // //               {t.label}
// // // // //               {t.badge>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'#f87171',borderRadius:'50%',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
// // // // //             </button>
// // // // //           ))}
// // // // //         </div>

// // // // //         <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
// // // // //           <div style={{position:'relative'}}>
// // // // //             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
// // // // //             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
// // // // //               value={search} onChange={e=>setSearch(e.target.value)}/>
// // // // //           </div>
// // // // //           {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
// // // // //             renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
// // // // //           {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
// // // // //           <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
// // // // //         </div>

// // // // //         <div className="card" style={{padding:0,overflow:'hidden'}}>
// // // // //           <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
// // // // //             <table>
// // // // //               <thead><tr>
// // // // //                 <th>#</th><th>Dealer</th>
// // // // //                 {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
// // // // //                 <th style={{textAlign:'right'}}>Latest</th>
// // // // //                 <th style={{textAlign:'right'}}>Trend</th>
// // // // //                 <th style={{textAlign:'center'}}>Follow-up</th>
// // // // //               </tr></thead>
// // // // //               <tbody>
// // // // //                 {filtered.map((d,i)=>{
// // // // //                   const isOpen  = expanded[d.id];
// // // // //                   const cleared = d.latestOutstanding===0;
// // // // //                   const dFu     = d.dealerFollowups.filter(f=>f.status==='pending');
// // // // //                   const nextFu  = [...dFu].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate))[0];
// // // // //                   const fuDays  = nextFu ? daysUntil(nextFu.followupDate) : null;
// // // // //                   const fuOver  = fuDays!==null && fuDays<0;
// // // // //                   const noPickups = d.dealerFollowups.filter(f=>f.type==='no-pickup'||f.comment?.startsWith('📵'));
// // // // //                   const latestNP = noPickups[noPickups.length-1];

// // // // //                   return(
// // // // //                     <React.Fragment key={d.id}>
// // // // //                       <tr style={{background:cleared?'rgba(52,211,153,0.03)':'transparent',cursor:'pointer'}} onClick={()=>toggle(d.id)}>
// // // // //                         <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
// // // // //                         <td style={{maxWidth:220}}>
// // // // //                           <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
// // // // //                           {/* Salesman + status badges */}
// // // // //                           <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center',flexWrap:'wrap'}}>
// // // // //                             {cleared&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
// // // // //                             {d.matchedSalesman&&<div style={{display:'flex',alignItems:'center',gap:3}}>
// // // // //                               <Avatar user={d.matchedSalesman} size={13}/>
// // // // //                               <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
// // // // //                             </div>}
// // // // //                           </div>
// // // // //                           {/* Latest comment / no-pickup — clearly visible */}
// // // // //                           {(()=>{
// // // // //                             const allFu = [...d.dealerFollowups].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
// // // // //                             const latest = allFu[0];
// // // // //                             if(!latest) return null;
// // // // //                             const isNP  = latest.type==='no-pickup'||latest.comment?.startsWith('📵');
// // // // //                             const isComment = latest.type==='comment';
// // // // //                             const txt = latest.comment?.replace('📵 Did not pick call','').replace('—','').trim();
// // // // //                             return(
// // // // //                               <div style={{marginTop:4,padding:'3px 6px',borderRadius:5,
// // // // //                                 background:isNP?'rgba(248,113,113,0.1)':isComment?'rgba(99,102,241,0.08)':'rgba(52,211,153,0.07)',
// // // // //                                 border:`1px solid ${isNP?'rgba(248,113,113,0.25)':isComment?'rgba(99,102,241,0.2)':'rgba(52,211,153,0.2)'}`,
// // // // //                                 maxWidth:200,
// // // // //                               }}>
// // // // //                                 <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // // //                                   {isNP
// // // // //                                     ? <><PhoneMissed size={10} color="#f87171"/><span style={{fontSize:10,color:'#f87171',fontWeight:600}}>Did not pick call</span></>
// // // // //                                     : <><MessageSquare size={10} color="var(--acc)"/><span style={{fontSize:10,color:'var(--acc)',fontWeight:600}}>Note</span></>}
// // // // //                                   <span style={{fontSize:9,color:'var(--t3)',marginLeft:'auto'}}>
// // // // //                                     {latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
// // // // //                                   </span>
// // // // //                                 </div>
// // // // //                                 {txt&&<div style={{fontSize:10,color:'var(--t2)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{txt}</div>}
// // // // //                               </div>
// // // // //                             );
// // // // //                           })()}
// // // // //                         </td>
// // // // //                         {allMonthCols.map(m=>{
// // // // //                           const v=d.monthlyOutstanding[m]||0;
// // // // //                           const mi2=allMonthCols.indexOf(m);
// // // // //                           const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
// // // // //                           return(<td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
// // // // //                             {v>0?fmt(v):'—'}
// // // // //                           </td>);
// // // // //                         })}
// // // // //                         <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
// // // // //                           {cleared?'✓ Nil':fmt(d.latestOutstanding)}
// // // // //                         </td>
// // // // //                         <td style={{textAlign:'right'}}>
// // // // //                           {d.trend>0?<span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
// // // // //                           :d.trend<0?<span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
// // // // //                           :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
// // // // //                         </td>
// // // // //                         <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
// // // // //                           <button onClick={()=>setActiveDealer(d)} style={{
// // // // //                             padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',
// // // // //                             background:nextFu?(fuOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.12)'):'transparent',
// // // // //                             border:nextFu?(fuOver?'1px solid #f87171':'1px solid var(--acc)'):'1px solid var(--b2)',
// // // // //                             color:nextFu?(fuOver?'#f87171':'var(--acc)'):'var(--t3)',
// // // // //                             display:'flex',alignItems:'center',gap:4,margin:'0 auto',
// // // // //                           }}>
// // // // //                             <Calendar size={10}/>
// // // // //                             {nextFu?(fuOver?`${Math.abs(fuDays)}d over`:fuDays===0?'Today':`${fuDays}d`):<Plus size={10}/>}
// // // // //                           </button>
// // // // //                           {nextFu?.comment&&(
// // // // //                             <div style={{fontSize:8,color:'var(--t3)',marginTop:2,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>
// // // // //                               {nextFu.comment.split(' | ')[0]}
// // // // //                             </div>
// // // // //                           )}
// // // // //                         </td>
// // // // //                       </tr>
// // // // //                       {isOpen&&<ExpandedRow d={d} dealers={dealers} onOpenDealer={onOpenDealer} setActiveDealer={setActiveDealer} allMonthCols={allMonthCols} loadFollowups={loadFollowups}/>}
// // // // //                     </React.Fragment>
// // // // //                   );
// // // // //                 })}
// // // // //                 {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
// // // // //               </tbody>
// // // // //               <tfoot><tr>
// // // // //                 <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
// // // // //                 {allMonthCols.map(m=>{
// // // // //                   const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
// // // // //                   return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
// // // // //                 })}
// // // // //                 <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
// // // // //                 <td/><td/>
// // // // //               </tr></tfoot>
// // // // //             </table>
// // // // //           </div>
// // // // //         </div>
// // // // //       </>)}

// // // // //       {activeDealer&&(
// // // // //         <FollowupModal
// // // // //           dealer={activeDealer}
// // // // //           existingFollowups={followups}
// // // // //           currentUser={currentUser}
// // // // //           onClose={()=>setActiveDealer(null)}
// // // // //           onSaved={loadFollowups}
// // // // //         />
// // // // //       )}
// // // // //     </div>
// // // // //   );
// // // // // }


// // // // import React, { useState, useMemo, useEffect, useRef } from 'react';
// // // // import { RefreshCw, Search, X, Upload, Plus, Check, Trash2, Calendar, MessageSquare, Bell, Phone, PhoneMissed } from 'lucide-react';
// // // // import { fetchCSV, parseOutstandingCSV } from '../utils';
// // // // import { api, dbOutstandingToApp } from '../api';
// // // // import { Avatar, MultiSelect } from './UI';

// // // // const fmt      = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';
// // // // const todayStr = () => new Date().toISOString().slice(0,10);
// // // // const daysUntil= d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

// // // // // ── Followup Modal ────────────────────────────────────────────────────────────
// // // // function FollowupModal({ dealer, existingFollowups, onClose, onSaved }) {
// // // //   const [date,    setDate]    = useState(todayStr());
// // // //   const [comment, setComment] = useState('');
// // // //   const [amount,  setAmount]  = useState(dealer.latestOutstanding||0);
// // // //   const [saving,  setSaving]  = useState(false);
// // // //   const [err,     setErr]     = useState('');

// // // //   // 3 comment quick-fill boxes
// // // //   const [quickComments, setQuickComments] = useState(['','','']);
// // // //   const setQC = (i,v) => setQuickComments(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // // //   const mine = existingFollowups.filter(f=>
// // // //     f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim()
// // // //   ).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));

// // // //   const handleAdd = async (type='followup') => {
// // // //     if(type==='followup' && !date){ setErr('Date required'); return; }
// // // //     setSaving(true); setErr('');
// // // //     try {
// // // //       const allComments = [comment, ...quickComments].filter(Boolean).join(' | ');
// // // //       await api.addFollowup({
// // // //         dealerName:   dealer.name,
// // // //         salesman:     dealer.matchedSalesman?.id || '',
// // // //         amount:       Number(amount)||0,
// // // //         followupDate: type==='no-pickup' ? todayStr() : date,
// // // //         comment:      type==='no-pickup' ? '📵 Did not pick call' + (allComments?` — ${allComments}`:'') : allComments,
// // // //         type,
// // // //       });
// // // //       setDate(todayStr()); setComment(''); setQuickComments(['','','']); setAmount(dealer.latestOutstanding||0);
// // // //       onSaved();
// // // //     } catch(e){ setErr(e.message); }
// // // //     setSaving(false);
// // // //   };

// // // //   const handleMark = async (id,status) => {
// // // //     await api.updateFollowup(id,{status}); onSaved();
// // // //   };
// // // //   const handleDelete = async (id) => {
// // // //     if(!confirm('Delete this follow-up?')) return;
// // // //     await api.deleteFollowup(id); onSaved();
// // // //   };

// // // //   return (
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
// // // //         {/* Header */}
// // // //         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
// // // //           <div>
// // // //             <div style={{fontSize:16,fontWeight:700}}>{dealer.name}</div>
// // // //             <div style={{fontSize:12,color:'#f87171',marginTop:2}}>
// // // //               Outstanding: {fmt(dealer.latestOutstanding)}
// // // //             </div>
// // // //           </div>
// // // //           <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
// // // //         </div>

// // // //         {/* Add new follow-up */}
// // // //         <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
// // // //             <Plus size={13} color="var(--acc)"/> Add Follow-up / Comment
// // // //           </div>

// // // //           {/* Date + Amount */}
// // // //           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
// // // //             <div>
// // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Next Follow-up Date</label>
// // // //               <input type="date" className="inp" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%'}}/>
// // // //             </div>
// // // //             <div>
// // // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Expected Payment ₹</label>
// // // //               <input type="number" className="inp" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// // // //             </div>
// // // //           </div>

// // // //           {/* Main comment */}
// // // //           <div style={{marginBottom:8}}>
// // // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Comment</label>
// // // //             <textarea className="inp" value={comment} onChange={e=>setComment(e.target.value)}
// // // //               placeholder="e.g. Will pay after 15th, cheque promised..."
// // // //               rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit'}}/>
// // // //           </div>

// // // //           {/* 3 quick comment boxes */}
// // // //           <div style={{marginBottom:12}}>
// // // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:6,textTransform:'uppercase'}}>Quick Notes (3 fields)</label>
// // // //             <div style={{display:'flex',flexDirection:'column',gap:6}}>
// // // //               {quickComments.map((v,i)=>(
// // // //                 <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
// // // //                   <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right',flexShrink:0}}>{i+1}.</span>
// // // //                   <input className="inp" value={v} onChange={e=>setQC(i,e.target.value)}
// // // //                     placeholder={['Dealer response...','Next action...','Additional info...'][i]}
// // // //                     style={{flex:1,fontSize:12}}/>
// // // //                   {v&&<button onClick={()=>setQC(i,'')} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><X size={11}/></button>}
// // // //                 </div>
// // // //               ))}
// // // //             </div>
// // // //           </div>

// // // //           {err&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>{err}</div>}

// // // //           {/* Action buttons */}
// // // //           <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
// // // //             <button onClick={()=>handleAdd('followup')} disabled={saving} className="btnp"
// // // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
// // // //               {saving?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Calendar size={11}/>}
// // // //               Save Follow-up
// // // //             </button>
// // // //             <button onClick={()=>handleAdd('no-pickup')} disabled={saving} className="btn"
// // // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // // //               <PhoneMissed size={11}/> Did Not Pick Call
// // // //             </button>
// // // //           </div>
// // // //         </div>

// // // //         {/* History */}
// // // //         <div>
// // // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
// // // //             History ({mine.length})
// // // //           </div>
// // // //           {mine.length===0&&(
// // // //             <div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:12}}>No follow-ups yet</div>
// // // //           )}
// // // //           {mine.map(f=>{
// // // //             const days   = daysUntil(f.followupDate);
// // // //             const isDone = f.status==='done';
// // // //             const isOver = !isDone && days<0;
// // // //             const isNoPickup = f.type==='no-pickup' || f.comment?.startsWith('📵');
// // // //             return(
// // // //               <div key={f._id} style={{
// // // //                 padding:'10px 12px',borderRadius:8,marginBottom:8,
// // // //                 background:isNoPickup?'rgba(248,113,113,0.04)':isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.05)':'var(--bg2)',
// // // //                 border:`1px solid ${isNoPickup?'rgba(248,113,113,0.15)':isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'var(--b2)'}`,
// // // //                 opacity:isDone?0.65:1,
// // // //               }}>
// // // //                 <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
// // // //                   <div style={{flex:1,minWidth:0}}>
// // // //                     <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
// // // //                       {isNoPickup
// // // //                         ? <PhoneMissed size={12} color="#f87171"/>
// // // //                         : <Calendar size={12} color={isDone?'#34d399':isOver?'#f87171':'var(--acc)'}/>}
// // // //                       <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>
// // // //                         {f.followupDate}
// // // //                       </span>
// // // //                       <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:600,
// // // //                         background:isNoPickup?'rgba(248,113,113,0.12)':isDone?'rgba(52,211,153,0.12)':isOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.1)',
// // // //                         color:isNoPickup?'#f87171':isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// // // //                         {isNoPickup?'📵 No Pickup':isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// // // //                       </span>
// // // //                       {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// // // //                     </div>
// // // //                     {f.comment&&(
// // // //                       <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5}}>
// // // //                         {f.comment.split(' | ').map((part,i)=>(
// // // //                           <div key={i} style={{display:'flex',gap:4,alignItems:'flex-start'}}>
// // // //                             <MessageSquare size={9} style={{marginTop:2,flexShrink:0}}/>
// // // //                             <span>{part}</span>
// // // //                           </div>
// // // //                         ))}
// // // //                       </div>
// // // //                     )}
// // // //                     <div style={{fontSize:9,color:'var(--t3)',marginTop:4}}>
// // // //                       {new Date(f.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
// // // //                     </div>
// // // //                   </div>
// // // //                   <div style={{display:'flex',flexDirection:'column',gap:4}}>
// // // //                     {!isDone&&!isNoPickup&&(
// // // //                       <button onClick={()=>handleMark(f._id,'done')}
// // // //                         style={{background:'none',border:'1px solid #34d399',color:'#34d399',borderRadius:4,padding:'3px 6px',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:3}}>
// // // //                         <Check size={9}/> Done
// // // //                       </button>
// // // //                     )}
// // // //                     <button onClick={()=>handleDelete(f._id)}
// // // //                       style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3}}>
// // // //                       <Trash2 size={11}/>
// // // //                     </button>
// // // //                   </div>
// // // //                 </div>
// // // //               </div>
// // // //             );
// // // //           })}
// // // //         </div>
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // }


// // // // // ── Inline expanded row with 3 comment boxes + no-pickup ─────────────────────
// // // // function ExpandedRow({ d, dealers, onOpenDealer, setActiveDealer, allMonthCols, loadFollowups }) {
// // // //   const [notes, setNotes]     = useState(['','','']);
// // // //   const [saving, setSaving]   = useState(false);
// // // //   const [saved,  setSaved]    = useState(false);

// // // //   const setNote = (i,v) => setNotes(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // // //   const saveNotes = async () => {
// // // //     const text = notes.filter(Boolean).join(' | ');
// // // //     if(!text) return;
// // // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in to save notes.'); return; }
// // // //     setSaving(true);
// // // //     try {
// // // //       await api.addFollowup({
// // // //         dealerName:   d.name,
// // // //         salesman:     d.matchedSalesman?.id||'',
// // // //         amount:       d.latestOutstanding,
// // // //         followupDate: todayStr(),
// // // //         comment:      text,
// // // //         type:         'comment',
// // // //       });
// // // //       setNotes(['','','']); setSaved(true);
// // // //       setTimeout(()=>setSaved(false), 2000);
// // // //       loadFollowups();
// // // //     } catch(e){ console.warn(e); }
// // // //     setSaving(false);
// // // //   };

// // // //   const logNoPickup = async () => {
// // // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in.'); return; }
// // // //     try {
// // // //       await api.addFollowup({
// // // //         dealerName:   d.name,
// // // //         salesman:     d.matchedSalesman?.id||'',
// // // //         amount:       d.latestOutstanding,
// // // //         followupDate: todayStr(),
// // // //         comment:      '📵 Did not pick call',
// // // //         type:         'no-pickup',
// // // //       });
// // // //       loadFollowups();
// // // //     } catch(e){ console.warn(e); }
// // // //   };

// // // //   return (
// // // //     <tr>
// // // //       <td colSpan={99} style={{background:'var(--bg2)',padding:'12px 14px',borderBottom:'1px solid var(--b1)'}}>
// // // //         <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>

// // // //           {/* 1. View Dealer */}
// // // //           <button onClick={()=>{const dl=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());if(dl)onOpenDealer(dl.id);}}
// // // //             className="btnp" style={{fontSize:11,padding:'6px 12px',whiteSpace:'nowrap',flexShrink:0}}>
// // // //             👤 View Dealer
// // // //           </button>

// // // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // // //           {/* 2. Comment boxes */}
// // // //           <div style={{display:'flex',gap:6,alignItems:'center',flex:1,minWidth:200,flexWrap:'wrap'}}>
// // // //             {notes.map((v,i)=>(
// // // //               <input key={i} className="inp" value={v} onChange={e=>setNote(i,e.target.value)}
// // // //                 placeholder={`Comment ${i+1}...`}
// // // //                 style={{flex:1,minWidth:100,fontSize:11}}
// // // //                 onKeyDown={e=>e.key==='Enter'&&saveNotes()}/>
// // // //             ))}
// // // //             <button onClick={saveNotes} disabled={saving||!notes.some(Boolean)}
// // // //               className="btn" style={{fontSize:11,padding:'5px 10px',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4,
// // // //                 color:saved?'#34d399':'var(--t2)',border:saved?'1px solid #34d399':'1px solid var(--b2)'}}>
// // // //               {saving?<RefreshCw size={10} style={{animation:'spin .7s linear infinite'}}/>:saved?<Check size={10}/>:<MessageSquare size={10}/>}
// // // //               {saved?'Saved!':'Save'}
// // // //             </button>
// // // //           </div>

// // // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // // //           {/* 3. Follow-up date */}
// // // //           <button onClick={()=>setActiveDealer(d)}
// // // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // // //               color:'var(--acc)',border:'1px solid rgba(99,102,241,0.3)'}}>
// // // //             <Calendar size={12}/> Add Follow-up Date
// // // //           </button>

// // // //           {/* 4. Did not pick */}
// // // //           <button onClick={logNoPickup}
// // // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // // //               color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // // //             <PhoneMissed size={12}/> Did Not Pick Call
// // // //           </button>

// // // //         </div>
// // // //       </td>
// // // //     </tr>
// // // //   );
// // // // }

// // // // // ── Main Outstanding Component ────────────────────────────────────────────────
// // // // export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
// // // //   const isAdmin = currentUser?.role === 'admin';
// // // //   const [loading,      setLoading]    = useState(false);
// // // //   const [uploading,    setUploading]  = useState(false);
// // // //   const [error,        setError]      = useState('');
// // // //   const [uploadMsg,    setUploadMsg]  = useState('');
// // // //   const [search,       setSearch]     = useState('');
// // // //   const [smFilter,     setSmFilter]   = useState([]);
// // // //   const [tab,          setTab]        = useState('outstanding');
// // // //   const [expanded,     setExpanded]   = useState({});
// // // //   const [followups,    setFollowups]  = useState([]);
// // // //   const [activeDealer, setActiveDealer] = useState(null);
// // // //   const fileRef = useRef();

// // // //   useEffect(()=>{ loadFromDB(); loadFollowups(); },[]);

// // // //   const loadFollowups = async () => {
// // // //     try {
// // // //       const token = localStorage.getItem('stp_jwt');
// // // //       if(!token) return;
// // // //       const data = await api.getFollowups();
// // // //       setFollowups(data||[]);
// // // //     } catch(e){ console.warn('Followups load failed:',e.message); }
// // // //   };

// // // //   const loadFromDB = async () => {
// // // //     setLoading(true); setError('');
// // // //     try {
// // // //       const token = localStorage.getItem('stp_jwt');
// // // //       if(token){
// // // //         const data = await api.getOutstanding();
// // // //         if(data?.length>0){
// // // //           if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
// // // //           setLoading(false); return;
// // // //         }
// // // //       }
// // // //       const allUsers = Object.values(users);
// // // //       const source   = allUsers.find(u=>u.role==='admin'&&u.url_outstanding)||allUsers.find(u=>u.url_outstanding);
// // // //       if(source?.url_outstanding){
// // // //         const csv  = await fetchCSV(source.url_outstanding);
// // // //         const rows = parseOutstandingCSV(csv,source.id);
// // // //         if(setOutstandingData) setOutstandingData(rows);
// // // //       }
// // // //     } catch(e){ setError('Load failed: '+e.message); }
// // // //     setLoading(false);
// // // //   };

// // // //   const handleUpload = async (file) => {
// // // //     if(!file) return;
// // // //     setUploading(true); setUploadMsg(''); setError('');
// // // //     try {
// // // //       const token = localStorage.getItem('stp_jwt');
// // // //       if(!token) throw new Error('Not logged in to server');
// // // //       const res = await api.uploadOutstanding(file);
// // // //       setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
// // // //       await loadFromDB();
// // // //     } catch(e){ setError('Upload failed: '+e.message); }
// // // //     setUploading(false);
// // // //   };

// // // //   // Filter outstanding to only show salesman's dealers when not admin
// // // //   const myDealerNames = useMemo(()=>{
// // // //     if(isAdmin) return null; // null = show all
// // // //     return new Set(dealers.map(d=>d.name.toLowerCase().trim()));
// // // //   },[dealers,isAdmin]);

// // // //   const filteredOutstanding = useMemo(()=>{
// // // //     if(!myDealerNames) return outstandingData; // admin sees all
// // // //     return outstandingData.filter(o=>myDealerNames.has(o.name?.toLowerCase().trim()));
// // // //   },[outstandingData, myDealerNames]);

// // // //   const allMonthCols = useMemo(()=>{
// // // //     const cols=new Set();
// // // //     filteredOutstanding.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
// // // //     return [...cols];
// // // //   },[filteredOutstanding]);

// // // //   const dealerSmMap = useMemo(()=>{
// // // //     const map={};
// // // //     dealers.forEach(d=>{ if(d.salesman&&users[d.salesman]) map[d.name.toLowerCase().trim()]=users[d.salesman]; });
// // // //     return map;
// // // //   },[dealers,users]);

// // // //   const followupMap = useMemo(()=>{
// // // //     const map={};
// // // //     followups.forEach(f=>{
// // // //       const k=(f.dealerName||'').toLowerCase().trim();
// // // //       if(k){ if(!map[k])map[k]=[]; map[k].push(f); }
// // // //     });
// // // //     return map;
// // // //   },[followups]);

// // // //   const filtered = useMemo(()=>{
// // // //     let d=filteredOutstanding.map(x=>({
// // // //       ...x,
// // // //       matchedSalesman: dealerSmMap[x.name.toLowerCase().trim()]||null,
// // // //       dealerFollowups: followupMap[x.name.toLowerCase().trim()]||[],
// // // //     }));
// // // //     if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
// // // //     if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
// // // //     if(tab==='followups')   d=d.filter(x=>x.dealerFollowups.some(f=>f.status==='pending'));
// // // //     if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
// // // //     if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));
// // // //     return d;
// // // //   },[outstandingData,dealerSmMap,followupMap,tab,search,smFilter,isAdmin]);

// // // //   const totalOut       = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
// // // //   const countOut       = filteredOutstanding.filter(d=>d.latestOutstanding>0).length;
// // // //   const countCleared   = filteredOutstanding.filter(d=>d.latestOutstanding===0).length;
// // // //   const pendingFu      = followups.filter(f=>f.status==='pending');
// // // //   const overdueFu      = pendingFu.filter(f=>daysUntil(f.followupDate)<0);
// // // //   const smOptions      = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
// // // //   const toggle         = id=>setExpanded(e=>({...e,[id]:!e[id]}));

// // // //   return (
// // // //     <div className="fade">
// // // //       <div style={{marginBottom:16}}>
// // // //         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
// // // //         <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
// // // //           <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
// // // //           {overdueFu.length>0&&(
// // // //             <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:6,padding:'3px 10px'}}>
// // // //               <Bell size={12} color="#f87171"/>
// // // //               <span style={{fontSize:11,color:'#f87171',fontWeight:600}}>{overdueFu.length} overdue</span>
// // // //             </div>
// // // //           )}
// // // //         </div>
// // // //       </div>

// // // //       {/* Action bar */}
// // // //       <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
// // // //         {isAdmin&&<>
// // // //           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
// // // //             onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
// // // //           <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
// // // //             <Upload size={13}/>{uploading?'Uploading...':'Upload Outstanding'}
// // // //           </button>
// // // //         </>}
// // // //         <button onClick={()=>{loadFromDB();loadFollowups();}} disabled={loading} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
// // // //           <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
// // // //         </button>
// // // //         {filteredOutstanding.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{filteredOutstanding.length} dealers</span>}
// // // //         {uploadMsg&&<span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
// // // //         {error&&<span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
// // // //       </div>

// // // //       {/* KPI */}
// // // //       {filteredOutstanding.length>0&&(
// // // //         <div className="stat-grid" style={{marginBottom:14}}>
// // // //           {[
// // // //             {l:'Total Outstanding', v:fmt(totalOut),       c:'#f87171'},
// // // //             {l:'Dealers with Due',  v:countOut,            c:'#fbbf24'},
// // // //             {l:'Cleared',           v:countCleared,        c:'#34d399'},
// // // //             {l:'Pending Follow-ups',v:pendingFu.length,    c:'var(--acc)'},
// // // //           ].map(k=>(
// // // //             <div key={k.l} className="stat-card">
// // // //               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
// // // //               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
// // // //             </div>
// // // //           ))}
// // // //         </div>
// // // //       )}

// // // //       {/* Month summary */}
// // // //       {allMonthCols.length>0&&(
// // // //         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
// // // //           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600}}>Month-wise Summary</div>
// // // //           <div style={{overflowX:'auto'}}>
// // // //             <table>
// // // //               <thead><tr>
// // // //                 <th>Month</th><th style={{textAlign:'right'}}>Total</th>
// // // //                 <th style={{textAlign:'right'}}>Dealers Due</th><th style={{textAlign:'right'}}>Change</th>
// // // //               </tr></thead>
// // // //               <tbody>
// // // //                 {allMonthCols.map((month,mi)=>{
// // // //                   const vals=filteredOutstanding.map(d=>d.monthlyOutstanding[month]||0);
// // // //                   const total=vals.reduce((a,b)=>a+b,0);
// // // //                   const due=vals.filter(v=>v>0).length;
// // // //                   const prev=mi>0?filteredOutstanding.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
// // // //                   const chg=mi>0?total-prev:0;
// // // //                   return(<tr key={month}>
// // // //                     <td style={{fontWeight:600}}>{month}</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
// // // //                     <td style={{textAlign:'right'}}>{due}</td>
// // // //                     <td style={{textAlign:'right',color:chg>0?'#f87171':chg<0?'#34d399':'var(--t3)',fontWeight:600}}>
// // // //                       {chg!==0?(chg>0?'▲':'▼')+'₹'+Number(Math.abs(chg)).toLocaleString('en-IN'):'—'}
// // // //                     </td>
// // // //                   </tr>);
// // // //                 })}
// // // //               </tbody>
// // // //             </table>
// // // //           </div>
// // // //         </div>
// // // //       )}

// // // //       {/* Dealer list */}
// // // //       {filteredOutstanding.length>0&&(<>
// // // //         <div className="tabs">
// // // //           {[
// // // //             {id:'outstanding',label:`Due (${countOut})`},
// // // //             {id:'cleared',    label:`Cleared (${countCleared})`},
// // // //             {id:'followups',  label:`Follow-ups (${pendingFu.length})`,badge:overdueFu.length},
// // // //             {id:'all',        label:`All (${filteredOutstanding.length})`},
// // // //           ].map(t=>(
// // // //             <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)} style={{position:'relative'}}>
// // // //               {t.label}
// // // //               {t.badge>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'#f87171',borderRadius:'50%',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
// // // //             </button>
// // // //           ))}
// // // //         </div>

// // // //         <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
// // // //           <div style={{position:'relative'}}>
// // // //             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
// // // //             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
// // // //               value={search} onChange={e=>setSearch(e.target.value)}/>
// // // //           </div>
// // // //           {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
// // // //             renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
// // // //           {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
// // // //           <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
// // // //         </div>

// // // //         <div className="card" style={{padding:0,overflow:'hidden'}}>
// // // //           <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
// // // //             <table>
// // // //               <thead><tr>
// // // //                 <th>#</th><th>Dealer</th>
// // // //                 {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
// // // //                 <th style={{textAlign:'right'}}>Latest</th>
// // // //                 <th style={{textAlign:'right'}}>Trend</th>
// // // //                 <th style={{textAlign:'center'}}>Follow-up</th>
// // // //               </tr></thead>
// // // //               <tbody>
// // // //                 {filtered.map((d,i)=>{
// // // //                   const isOpen  = expanded[d.id];
// // // //                   const cleared = d.latestOutstanding===0;
// // // //                   const dFu     = d.dealerFollowups.filter(f=>f.status==='pending');
// // // //                   const nextFu  = [...dFu].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate))[0];
// // // //                   const fuDays  = nextFu ? daysUntil(nextFu.followupDate) : null;
// // // //                   const fuOver  = fuDays!==null && fuDays<0;
// // // //                   const noPickups = d.dealerFollowups.filter(f=>f.type==='no-pickup'||f.comment?.startsWith('📵'));
// // // //                   const latestNP = noPickups[noPickups.length-1];

// // // //                   return(
// // // //                     <React.Fragment key={d.id}>
// // // //                       <tr style={{background:cleared?'rgba(52,211,153,0.03)':'transparent',cursor:'pointer'}} onClick={()=>toggle(d.id)}>
// // // //                         <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
// // // //                         <td style={{maxWidth:220}}>
// // // //                           <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
// // // //                           {/* Salesman + status badges */}
// // // //                           <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center',flexWrap:'wrap'}}>
// // // //                             {cleared&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
// // // //                             {d.matchedSalesman&&<div style={{display:'flex',alignItems:'center',gap:3}}>
// // // //                               <Avatar user={d.matchedSalesman} size={13}/>
// // // //                               <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
// // // //                             </div>}
// // // //                           </div>
// // // //                           {/* Latest comment / no-pickup — clearly visible */}
// // // //                           {(()=>{
// // // //                             const allFu = [...d.dealerFollowups].sort((a,b)=>{ const ta=new Date(b.createdAt||b.updatedAt||0); const tb=new Date(a.createdAt||a.updatedAt||0); return ta-tb; });
// // // //                             const latest = allFu[0];
// // // //                             if(!latest) return null;
// // // //                             const isNP  = latest.type==='no-pickup'||latest.comment?.startsWith('📵');
// // // //                             const isFollowup = latest.type==='followup';
// // // //                             const isComment = !isNP && !isFollowup;
// // // //                             const txt = (latest.comment||'').replace('📵 Did not pick call','').replace(/^\s*[|—]\s*/,'').trim();
// // // //                             return(
// // // //                               <div style={{marginTop:4,padding:'3px 6px',borderRadius:5,
// // // //                                 background:isNP?'rgba(248,113,113,0.1)':isComment?'rgba(99,102,241,0.08)':'rgba(52,211,153,0.07)',
// // // //                                 border:`1px solid ${isNP?'rgba(248,113,113,0.25)':isComment?'rgba(99,102,241,0.2)':'rgba(52,211,153,0.2)'}`,
// // // //                                 maxWidth:200,
// // // //                               }}>
// // // //                                 <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                                   {isNP
// // // //                                     ? <><PhoneMissed size={10} color="#f87171"/><span style={{fontSize:10,color:'#f87171',fontWeight:600}}>Did not pick call</span></>
// // // //                                     : isFollowup
// // // //                                     ? <><Calendar size={10} color="#34d399"/><span style={{fontSize:10,color:'#34d399',fontWeight:600}}>Follow-up: {latest.followupDate}</span></>
// // // //                                     : <><MessageSquare size={10} color="var(--acc)"/><span style={{fontSize:10,color:'var(--acc)',fontWeight:600}}>Note</span></>}
// // // //                                   <span style={{fontSize:9,color:'var(--t3)',marginLeft:'auto'}}>
// // // //                                     {latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
// // // //                                   </span>
// // // //                                 </div>
// // // //                                 {txt&&<div style={{fontSize:10,color:'var(--t2)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{txt}</div>}
// // // //                               </div>
// // // //                             );
// // // //                           })()}
// // // //                         </td>
// // // //                         {allMonthCols.map(m=>{
// // // //                           const v=d.monthlyOutstanding[m]||0;
// // // //                           const mi2=allMonthCols.indexOf(m);
// // // //                           const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
// // // //                           return(<td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
// // // //                             {v>0?fmt(v):'—'}
// // // //                           </td>);
// // // //                         })}
// // // //                         <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
// // // //                           {cleared?'✓ Nil':fmt(d.latestOutstanding)}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right'}}>
// // // //                           {d.trend>0?<span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
// // // //                           :d.trend<0?<span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
// // // //                           :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
// // // //                         </td>
// // // //                         <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
// // // //                           <button onClick={()=>setActiveDealer(d)} style={{
// // // //                             padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',
// // // //                             background:nextFu?(fuOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.12)'):'transparent',
// // // //                             border:nextFu?(fuOver?'1px solid #f87171':'1px solid var(--acc)'):'1px solid var(--b2)',
// // // //                             color:nextFu?(fuOver?'#f87171':'var(--acc)'):'var(--t3)',
// // // //                             display:'flex',alignItems:'center',gap:4,margin:'0 auto',
// // // //                           }}>
// // // //                             <Calendar size={10}/>
// // // //                             {nextFu?(fuOver?`${Math.abs(fuDays)}d over`:fuDays===0?'Today':`${fuDays}d`):<Plus size={10}/>}
// // // //                           </button>
// // // //                           {nextFu?.comment&&(
// // // //                             <div style={{fontSize:8,color:'var(--t3)',marginTop:2,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>
// // // //                               {nextFu.comment.split(' | ')[0]}
// // // //                             </div>
// // // //                           )}
// // // //                         </td>
// // // //                       </tr>
// // // //                       {isOpen&&<ExpandedRow d={d} dealers={dealers} onOpenDealer={onOpenDealer} setActiveDealer={setActiveDealer} allMonthCols={allMonthCols} loadFollowups={loadFollowups}/>}
// // // //                     </React.Fragment>
// // // //                   );
// // // //                 })}
// // // //                 {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
// // // //               </tbody>
// // // //               <tfoot><tr>
// // // //                 <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
// // // //                 {allMonthCols.map(m=>{
// // // //                   const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
// // // //                   return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
// // // //                 })}
// // // //                 <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
// // // //                 <td/><td/>
// // // //               </tr></tfoot>
// // // //             </table>
// // // //           </div>
// // // //         </div>
// // // //       </>)}

// // // //       {activeDealer&&(
// // // //         <FollowupModal
// // // //           dealer={activeDealer}
// // // //           existingFollowups={followups}
// // // //           currentUser={currentUser}
// // // //           onClose={()=>setActiveDealer(null)}
// // // //           onSaved={loadFollowups}
// // // //         />
// // // //       )}
// // // //     </div>
// // // //   );
// // // // }


// // // import React, { useState, useMemo, useEffect, useRef } from 'react';
// // // import { RefreshCw, Search, X, Upload, Plus, Check, Trash2, Calendar, MessageSquare, Bell, Phone, PhoneMissed } from 'lucide-react';
// // // import { dbOutstandingToApp } from '../api';
// // // import { Avatar, MultiSelect } from './UI';

// // // const fmt      = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';
// // // const todayStr = () => new Date().toISOString().slice(0,10);
// // // const daysUntil= d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

// // // // ── Followup Modal ────────────────────────────────────────────────────────────
// // // function FollowupModal({ dealer, existingFollowups, onClose, onSaved }) {
// // //   const [date,    setDate]    = useState(todayStr());
// // //   const [comment, setComment] = useState('');
// // //   const [amount,  setAmount]  = useState(dealer.latestOutstanding||0);
// // //   const [saving,  setSaving]  = useState(false);
// // //   const [err,     setErr]     = useState('');

// // //   // 3 comment quick-fill boxes
// // //   const [quickComments, setQuickComments] = useState(['','','']);
// // //   const setQC = (i,v) => setQuickComments(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // //   const mine = existingFollowups.filter(f=>
// // //     f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim()
// // //   ).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));

// // //   const handleAdd = async (type='followup') => {
// // //     if(type==='followup' && !date){ setErr('Date required'); return; }
// // //     setSaving(true); setErr('');
// // //     try {
// // //       const allComments = [comment, ...quickComments].filter(Boolean).join(' | ');
// // //       await api.addFollowup({
// // //         dealerName:   dealer.name,
// // //         salesman:     dealer.matchedSalesman?.id || '',
// // //         amount:       Number(amount)||0,
// // //         followupDate: type==='no-pickup' ? todayStr() : date,
// // //         comment:      type==='no-pickup' ? '📵 Did not pick call' + (allComments?` — ${allComments}`:'') : allComments,
// // //         type,
// // //       });
// // //       setDate(todayStr()); setComment(''); setQuickComments(['','','']); setAmount(dealer.latestOutstanding||0);
// // //       onSaved();
// // //     } catch(e){ setErr(e.message); }
// // //     setSaving(false);
// // //   };

// // //   const handleMark = async (id,status) => {
// // //     await api.updateFollowup(id,{status}); onSaved();
// // //   };
// // //   const handleDelete = async (id) => {
// // //     if(!confirm('Delete this follow-up?')) return;
// // //     await api.deleteFollowup(id); onSaved();
// // //   };

// // //   return (
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
// // //         {/* Header */}
// // //         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
// // //           <div>
// // //             <div style={{fontSize:16,fontWeight:700}}>{dealer.name}</div>
// // //             <div style={{fontSize:12,color:'#f87171',marginTop:2}}>
// // //               Outstanding: {fmt(dealer.latestOutstanding)}
// // //             </div>
// // //           </div>
// // //           <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
// // //         </div>

// // //         {/* Add new follow-up */}
// // //         <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
// // //             <Plus size={13} color="var(--acc)"/> Add Follow-up / Comment
// // //           </div>

// // //           {/* Date + Amount */}
// // //           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
// // //             <div>
// // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Next Follow-up Date</label>
// // //               <input type="date" className="inp" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%'}}/>
// // //             </div>
// // //             <div>
// // //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Expected Payment ₹</label>
// // //               <input type="number" className="inp" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// // //             </div>
// // //           </div>

// // //           {/* Main comment */}
// // //           <div style={{marginBottom:8}}>
// // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Comment</label>
// // //             <textarea className="inp" value={comment} onChange={e=>setComment(e.target.value)}
// // //               placeholder="e.g. Will pay after 15th, cheque promised..."
// // //               rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit'}}/>
// // //           </div>

// // //           {/* 3 quick comment boxes */}
// // //           <div style={{marginBottom:12}}>
// // //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:6,textTransform:'uppercase'}}>Quick Notes (3 fields)</label>
// // //             <div style={{display:'flex',flexDirection:'column',gap:6}}>
// // //               {quickComments.map((v,i)=>(
// // //                 <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
// // //                   <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right',flexShrink:0}}>{i+1}.</span>
// // //                   <input className="inp" value={v} onChange={e=>setQC(i,e.target.value)}
// // //                     placeholder={['Dealer response...','Next action...','Additional info...'][i]}
// // //                     style={{flex:1,fontSize:12}}/>
// // //                   {v&&<button onClick={()=>setQC(i,'')} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><X size={11}/></button>}
// // //                 </div>
// // //               ))}
// // //             </div>
// // //           </div>

// // //           {err&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>{err}</div>}

// // //           {/* Action buttons */}
// // //           <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
// // //             <button onClick={()=>handleAdd('followup')} disabled={saving} className="btnp"
// // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
// // //               {saving?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Calendar size={11}/>}
// // //               Save Follow-up
// // //             </button>
// // //             <button onClick={()=>handleAdd('no-pickup')} disabled={saving} className="btn"
// // //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // //               <PhoneMissed size={11}/> Did Not Pick Call
// // //             </button>
// // //           </div>
// // //         </div>

// // //         {/* History */}
// // //         <div>
// // //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
// // //             History ({mine.length})
// // //           </div>
// // //           {mine.length===0&&(
// // //             <div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:12}}>No follow-ups yet</div>
// // //           )}
// // //           {mine.map(f=>{
// // //             const days   = daysUntil(f.followupDate);
// // //             const isDone = f.status==='done';
// // //             const isOver = !isDone && days<0;
// // //             const isNoPickup = f.type==='no-pickup' || f.comment?.startsWith('📵');
// // //             return(
// // //               <div key={f._id} style={{
// // //                 padding:'10px 12px',borderRadius:8,marginBottom:8,
// // //                 background:isNoPickup?'rgba(248,113,113,0.04)':isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.05)':'var(--bg2)',
// // //                 border:`1px solid ${isNoPickup?'rgba(248,113,113,0.15)':isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'var(--b2)'}`,
// // //                 opacity:isDone?0.65:1,
// // //               }}>
// // //                 <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
// // //                   <div style={{flex:1,minWidth:0}}>
// // //                     <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
// // //                       {isNoPickup
// // //                         ? <PhoneMissed size={12} color="#f87171"/>
// // //                         : <Calendar size={12} color={isDone?'#34d399':isOver?'#f87171':'var(--acc)'}/>}
// // //                       <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>
// // //                         {f.followupDate}
// // //                       </span>
// // //                       <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:600,
// // //                         background:isNoPickup?'rgba(248,113,113,0.12)':isDone?'rgba(52,211,153,0.12)':isOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.1)',
// // //                         color:isNoPickup?'#f87171':isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// // //                         {isNoPickup?'📵 No Pickup':isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// // //                       </span>
// // //                       {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// // //                     </div>
// // //                     {f.comment&&(
// // //                       <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5}}>
// // //                         {f.comment.split(' | ').map((part,i)=>(
// // //                           <div key={i} style={{display:'flex',gap:4,alignItems:'flex-start'}}>
// // //                             <MessageSquare size={9} style={{marginTop:2,flexShrink:0}}/>
// // //                             <span>{part}</span>
// // //                           </div>
// // //                         ))}
// // //                       </div>
// // //                     )}
// // //                     <div style={{fontSize:9,color:'var(--t3)',marginTop:4}}>
// // //                       {new Date(f.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
// // //                     </div>
// // //                   </div>
// // //                   <div style={{display:'flex',flexDirection:'column',gap:4}}>
// // //                     {!isDone&&!isNoPickup&&(
// // //                       <button onClick={()=>handleMark(f._id,'done')}
// // //                         style={{background:'none',border:'1px solid #34d399',color:'#34d399',borderRadius:4,padding:'3px 6px',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:3}}>
// // //                         <Check size={9}/> Done
// // //                       </button>
// // //                     )}
// // //                     <button onClick={()=>handleDelete(f._id)}
// // //                       style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3}}>
// // //                       <Trash2 size={11}/>
// // //                     </button>
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //             );
// // //           })}
// // //         </div>
// // //       </div>
// // //     </div>
// // //   );
// // // }


// // // // ── Inline expanded row with 3 comment boxes + no-pickup ─────────────────────
// // // function ExpandedRow({ d, dealers, onOpenDealer, setActiveDealer, allMonthCols, loadFollowups }) {
// // //   const [notes, setNotes]     = useState(['','','']);
// // //   const [saving, setSaving]   = useState(false);
// // //   const [saved,  setSaved]    = useState(false);

// // //   const setNote = (i,v) => setNotes(prev=>{ const a=[...prev]; a[i]=v; return a; });

// // //   const saveNotes = async () => {
// // //     const text = notes.filter(Boolean).join(' | ');
// // //     if(!text) return;
// // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in to save notes.'); return; }
// // //     setSaving(true);
// // //     try {
// // //       await api.addFollowup({
// // //         dealerName:   d.name,
// // //         salesman:     d.matchedSalesman?.id||'',
// // //         amount:       d.latestOutstanding,
// // //         followupDate: todayStr(),
// // //         comment:      text,
// // //         type:         'comment',
// // //       });
// // //       setNotes(['','','']); setSaved(true);
// // //       setTimeout(()=>setSaved(false), 2000);
// // //       loadFollowups();
// // //     } catch(e){ console.warn(e); }
// // //     setSaving(false);
// // //   };

// // //   const logNoPickup = async () => {
// // //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in.'); return; }
// // //     try {
// // //       await api.addFollowup({
// // //         dealerName:   d.name,
// // //         salesman:     d.matchedSalesman?.id||'',
// // //         amount:       d.latestOutstanding,
// // //         followupDate: todayStr(),
// // //         comment:      '📵 Did not pick call',
// // //         type:         'no-pickup',
// // //       });
// // //       loadFollowups();
// // //     } catch(e){ console.warn(e); }
// // //   };

// // //   return (
// // //     <tr>
// // //       <td colSpan={99} style={{background:'var(--bg2)',padding:'12px 14px',borderBottom:'1px solid var(--b1)'}}>
// // //         <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>

// // //           {/* 1. View Dealer */}
// // //           <button onClick={()=>{const dl=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());if(dl)onOpenDealer(dl.id);}}
// // //             className="btnp" style={{fontSize:11,padding:'6px 12px',whiteSpace:'nowrap',flexShrink:0}}>
// // //             👤 View Dealer
// // //           </button>

// // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // //           {/* 2. Comment boxes */}
// // //           <div style={{display:'flex',gap:6,alignItems:'center',flex:1,minWidth:200,flexWrap:'wrap'}}>
// // //             {notes.map((v,i)=>(
// // //               <input key={i} className="inp" value={v} onChange={e=>setNote(i,e.target.value)}
// // //                 placeholder={`Comment ${i+1}...`}
// // //                 style={{flex:1,minWidth:100,fontSize:11}}
// // //                 onKeyDown={e=>e.key==='Enter'&&saveNotes()}/>
// // //             ))}
// // //             <button onClick={saveNotes} disabled={saving||!notes.some(Boolean)}
// // //               className="btn" style={{fontSize:11,padding:'5px 10px',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4,
// // //                 color:saved?'#34d399':'var(--t2)',border:saved?'1px solid #34d399':'1px solid var(--b2)'}}>
// // //               {saving?<RefreshCw size={10} style={{animation:'spin .7s linear infinite'}}/>:saved?<Check size={10}/>:<MessageSquare size={10}/>}
// // //               {saved?'Saved!':'Save'}
// // //             </button>
// // //           </div>

// // //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// // //           {/* 3. Follow-up date */}
// // //           <button onClick={()=>setActiveDealer(d)}
// // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // //               color:'var(--acc)',border:'1px solid rgba(99,102,241,0.3)'}}>
// // //             <Calendar size={12}/> Add Follow-up Date
// // //           </button>

// // //           {/* 4. Did not pick */}
// // //           <button onClick={logNoPickup}
// // //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// // //               color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// // //             <PhoneMissed size={12}/> Did Not Pick Call
// // //           </button>

// // //         </div>
// // //       </td>
// // //     </tr>
// // //   );
// // // }

// // // // ── Main Outstanding Component ────────────────────────────────────────────────
// // // export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
// // //   const isAdmin = currentUser?.role === 'admin';
// // //   const [loading,      setLoading]    = useState(false);
// // //   const [uploading,    setUploading]  = useState(false);
// // //   const [error,        setError]      = useState('');
// // //   const [uploadMsg,    setUploadMsg]  = useState('');
// // //   const [search,       setSearch]     = useState('');
// // //   const [smFilter,     setSmFilter]   = useState([]);
// // //   const [tab,          setTab]        = useState('outstanding');
// // //   const [expanded,     setExpanded]   = useState({});
// // //   const [followups,    setFollowups]  = useState([]);
// // //   const [activeDealer, setActiveDealer] = useState(null);
// // //   const fileRef = useRef();

// // //   useEffect(()=>{ loadFromDB(); loadFollowups(); },[]);

// // //   const loadFollowups = async () => {
// // //     try {
// // //       const data = await api.getFollowups();
// // //       setFollowups(data||[]);
// // //     } catch(e){ console.warn('Followups load failed:',e.message); }
// // //   };

// // //   const loadFromDB = async () => {
// // //     setLoading(true); setError('');
// // //     try {
// // //       const token = localStorage.getItem('stp_jwt');
// // //       if(token){
// // //         const data = await api.getOutstanding();
// // //         if(data?.length>0){
// // //           if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
// // //         }
// // //       }
// // //     } catch(e){ setError('Load failed: '+e.message); }
// // //     setLoading(false);
// // //   };

// // //   const handleUpload = async (file) => {
// // //     if(!file) return;
// // //     setUploading(true); setUploadMsg(''); setError('');
// // //     try {
// // //       const token = localStorage.getItem('stp_jwt');
// // //       if(!token) throw new Error('Not logged in to server');
// // //       const res = await api.uploadOutstanding(file);
// // //       setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
// // //       await loadFromDB();
// // //     } catch(e){ setError('Upload failed: '+e.message); }
// // //     setUploading(false);
// // //   };

// // //   // Filter outstanding to only show salesman's dealers when not admin
// // //   const myDealerNames = useMemo(()=>{
// // //     if(isAdmin) return null; // null = show all
// // //     return new Set(dealers.map(d=>d.name.toLowerCase().trim()));
// // //   },[dealers,isAdmin]);

// // //   const filteredOutstanding = useMemo(()=>{
// // //     if(!myDealerNames) return outstandingData; // admin sees all
// // //     return outstandingData.filter(o=>myDealerNames.has(o.name?.toLowerCase().trim()));
// // //   },[outstandingData, myDealerNames]);

// // //   const allMonthCols = useMemo(()=>{
// // //     const cols=new Set();
// // //     filteredOutstanding.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
// // //     return [...cols];
// // //   },[filteredOutstanding]);

// // //   const dealerSmMap = useMemo(()=>{
// // //     const map={};
// // //     dealers.forEach(d=>{ if(d.salesman&&users[d.salesman]) map[d.name.toLowerCase().trim()]=users[d.salesman]; });
// // //     return map;
// // //   },[dealers,users]);

// // //   const followupMap = useMemo(()=>{
// // //     const map={};
// // //     followups.forEach(f=>{
// // //       const k=(f.dealerName||'').toLowerCase().trim();
// // //       if(k){ if(!map[k])map[k]=[]; map[k].push(f); }
// // //     });
// // //     return map;
// // //   },[followups]);

// // //   const filtered = useMemo(()=>{
// // //     let d=filteredOutstanding.map(x=>{
// // //       const nameKey = x.name.toLowerCase().trim();
// // //       // Try exact match first, then partial match for name variations
// // //       const dFu = followupMap[nameKey] || 
// // //         Object.entries(followupMap).find(([k])=>k.includes(nameKey)||nameKey.includes(k))?.[1] || [];
// // //       return {
// // //         ...x,
// // //         matchedSalesman: dealerSmMap[nameKey]||null,
// // //         dealerFollowups: dFu,
// // //       };
// // //     });
// // //     if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
// // //     if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
// // //     if(tab==='followups')   d=d.filter(x=>x.dealerFollowups.some(f=>f.status==='pending'));
// // //     if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
// // //     if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));
// // //     return d;
// // //   },[outstandingData,dealerSmMap,followupMap,tab,search,smFilter,isAdmin]);

// // //   const totalOut       = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
// // //   const countOut       = filteredOutstanding.filter(d=>d.latestOutstanding>0).length;
// // //   const countCleared   = filteredOutstanding.filter(d=>d.latestOutstanding===0).length;
// // //   const pendingFu      = followups.filter(f=>f.status==='pending');
// // //   const overdueFu      = pendingFu.filter(f=>daysUntil(f.followupDate)<0);
// // //   const smOptions      = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
// // //   const toggle         = id=>setExpanded(e=>({...e,[id]:!e[id]}));

// // //   return (
// // //     <div className="fade">
// // //       <div style={{marginBottom:16}}>
// // //         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
// // //         <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
// // //           <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
// // //           {overdueFu.length>0&&(
// // //             <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:6,padding:'3px 10px'}}>
// // //               <Bell size={12} color="#f87171"/>
// // //               <span style={{fontSize:11,color:'#f87171',fontWeight:600}}>{overdueFu.length} overdue</span>
// // //             </div>
// // //           )}
// // //         </div>
// // //       </div>

// // //       {/* Action bar */}
// // //       <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
// // //         {isAdmin&&<>
// // //           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
// // //             onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
// // //           <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
// // //             <Upload size={13}/>{uploading?'Uploading...':'Upload Outstanding'}
// // //           </button>
// // //         </>}
// // //         <button onClick={()=>{loadFromDB();loadFollowups();}} disabled={loading} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
// // //           <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
// // //         </button>
// // //         {filteredOutstanding.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{filteredOutstanding.length} dealers</span>}
// // //         {uploadMsg&&<span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
// // //         {error&&<span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
// // //       </div>

// // //       {/* KPI */}
// // //       {filteredOutstanding.length>0&&(
// // //         <div className="stat-grid" style={{marginBottom:14}}>
// // //           {[
// // //             {l:'Total Outstanding', v:fmt(totalOut),       c:'#f87171'},
// // //             {l:'Dealers with Due',  v:countOut,            c:'#fbbf24'},
// // //             {l:'Cleared',           v:countCleared,        c:'#34d399'},
// // //             {l:'Pending Follow-ups',v:pendingFu.length,    c:'var(--acc)'},
// // //           ].map(k=>(
// // //             <div key={k.l} className="stat-card">
// // //               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
// // //               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
// // //             </div>
// // //           ))}
// // //         </div>
// // //       )}

// // //       {/* Month summary */}
// // //       {allMonthCols.length>0&&(
// // //         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
// // //           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600}}>Month-wise Summary</div>
// // //           <div style={{overflowX:'auto'}}>
// // //             <table>
// // //               <thead><tr>
// // //                 <th>Month</th><th style={{textAlign:'right'}}>Total</th>
// // //                 <th style={{textAlign:'right'}}>Dealers Due</th><th style={{textAlign:'right'}}>Change</th>
// // //               </tr></thead>
// // //               <tbody>
// // //                 {allMonthCols.map((month,mi)=>{
// // //                   const vals=filteredOutstanding.map(d=>d.monthlyOutstanding[month]||0);
// // //                   const total=vals.reduce((a,b)=>a+b,0);
// // //                   const due=vals.filter(v=>v>0).length;
// // //                   const prev=mi>0?filteredOutstanding.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
// // //                   const chg=mi>0?total-prev:0;
// // //                   return(<tr key={month}>
// // //                     <td style={{fontWeight:600}}>{month}</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
// // //                     <td style={{textAlign:'right'}}>{due}</td>
// // //                     <td style={{textAlign:'right',color:chg>0?'#f87171':chg<0?'#34d399':'var(--t3)',fontWeight:600}}>
// // //                       {chg!==0?(chg>0?'▲':'▼')+'₹'+Number(Math.abs(chg)).toLocaleString('en-IN'):'—'}
// // //                     </td>
// // //                   </tr>);
// // //                 })}
// // //               </tbody>
// // //             </table>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* Dealer list */}
// // //       {filteredOutstanding.length>0&&(<>
// // //         <div className="tabs">
// // //           {[
// // //             {id:'outstanding',label:`Due (${countOut})`},
// // //             {id:'cleared',    label:`Cleared (${countCleared})`},
// // //             {id:'followups',  label:`Follow-ups (${pendingFu.length})`,badge:overdueFu.length},
// // //             {id:'all',        label:`All (${filteredOutstanding.length})`},
// // //           ].map(t=>(
// // //             <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)} style={{position:'relative'}}>
// // //               {t.label}
// // //               {t.badge>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'#f87171',borderRadius:'50%',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
// // //             </button>
// // //           ))}
// // //         </div>

// // //         <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
// // //           <div style={{position:'relative'}}>
// // //             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
// // //             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
// // //               value={search} onChange={e=>setSearch(e.target.value)}/>
// // //           </div>
// // //           {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
// // //             renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
// // //           {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
// // //           <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
// // //         </div>

// // //         <div className="card" style={{padding:0,overflow:'hidden'}}>
// // //           <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
// // //             <table>
// // //               <thead><tr>
// // //                 <th>#</th><th>Dealer</th>
// // //                 {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
// // //                 <th style={{textAlign:'right'}}>Latest</th>
// // //                 <th style={{textAlign:'right'}}>Trend</th>
// // //                 <th style={{textAlign:'center'}}>Follow-up</th>
// // //               </tr></thead>
// // //               <tbody>
// // //                 {filtered.map((d,i)=>{
// // //                   const isOpen  = expanded[d.id];
// // //                   const cleared = d.latestOutstanding===0;
// // //                   const dFu     = d.dealerFollowups.filter(f=>f.status==='pending');
// // //                   const nextFu  = [...dFu].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate))[0];
// // //                   const fuDays  = nextFu ? daysUntil(nextFu.followupDate) : null;
// // //                   const fuOver  = fuDays!==null && fuDays<0;
// // //                   const noPickups = d.dealerFollowups.filter(f=>f.type==='no-pickup'||f.comment?.startsWith('📵'));
// // //                   const latestNP = noPickups[noPickups.length-1];

// // //                   return(
// // //                     <React.Fragment key={d.id}>
// // //                       <tr style={{background:cleared?'rgba(52,211,153,0.03)':'transparent',cursor:'pointer'}} onClick={()=>toggle(d.id)}>
// // //                         <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
// // //                         <td style={{maxWidth:220}}>
// // //                           <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
// // //                           {/* Salesman + status badges */}
// // //                           <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center',flexWrap:'wrap'}}>
// // //                             {cleared&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
// // //                             {d.matchedSalesman&&<div style={{display:'flex',alignItems:'center',gap:3}}>
// // //                               <Avatar user={d.matchedSalesman} size={13}/>
// // //                               <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
// // //                             </div>}
// // //                           </div>
// // //                           {/* Latest comment / no-pickup — clearly visible */}
// // //                           {(()=>{
// // //                             const allFu = [...d.dealerFollowups].sort((a,b)=>{ const ta=new Date(b.createdAt||b.updatedAt||0); const tb=new Date(a.createdAt||a.updatedAt||0); return ta-tb; });
// // //                             const latest = allFu[0];
// // //                             if(!latest) return null;
// // //                             const isNP  = latest.type==='no-pickup'||latest.comment?.startsWith('📵');
// // //                             const isFollowup = latest.type==='followup';
// // //                             const isComment = !isNP && !isFollowup;
// // //                             const txt = (latest.comment||'').replace('📵 Did not pick call','').replace(/^\s*[|—]\s*/,'').trim();
// // //                             return(
// // //                               <div style={{marginTop:4,padding:'3px 6px',borderRadius:5,
// // //                                 background:isNP?'rgba(248,113,113,0.1)':isComment?'rgba(99,102,241,0.08)':'rgba(52,211,153,0.07)',
// // //                                 border:`1px solid ${isNP?'rgba(248,113,113,0.25)':isComment?'rgba(99,102,241,0.2)':'rgba(52,211,153,0.2)'}`,
// // //                                 maxWidth:200,
// // //                               }}>
// // //                                 <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                                   {isNP
// // //                                     ? <><PhoneMissed size={10} color="#f87171"/><span style={{fontSize:10,color:'#f87171',fontWeight:600}}>Did not pick call</span></>
// // //                                     : isFollowup
// // //                                     ? <><Calendar size={10} color="#34d399"/><span style={{fontSize:10,color:'#34d399',fontWeight:600}}>Follow-up: {latest.followupDate}</span></>
// // //                                     : <><MessageSquare size={10} color="var(--acc)"/><span style={{fontSize:10,color:'var(--acc)',fontWeight:600}}>Note</span></>}
// // //                                   <span style={{fontSize:9,color:'var(--t3)',marginLeft:'auto'}}>
// // //                                     {latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
// // //                                   </span>
// // //                                 </div>
// // //                                 {txt&&<div style={{fontSize:10,color:'var(--t2)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{txt}</div>}
// // //                               </div>
// // //                             );
// // //                           })()}
// // //                         </td>
// // //                         {allMonthCols.map(m=>{
// // //                           const v=d.monthlyOutstanding[m]||0;
// // //                           const mi2=allMonthCols.indexOf(m);
// // //                           const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
// // //                           return(<td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
// // //                             {v>0?fmt(v):'—'}
// // //                           </td>);
// // //                         })}
// // //                         <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
// // //                           {cleared?'✓ Nil':fmt(d.latestOutstanding)}
// // //                         </td>
// // //                         <td style={{textAlign:'right'}}>
// // //                           {d.trend>0?<span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
// // //                           :d.trend<0?<span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
// // //                           :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
// // //                         </td>
// // //                         <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
// // //                           <button onClick={()=>setActiveDealer(d)} style={{
// // //                             padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',
// // //                             background:nextFu?(fuOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.12)'):'transparent',
// // //                             border:nextFu?(fuOver?'1px solid #f87171':'1px solid var(--acc)'):'1px solid var(--b2)',
// // //                             color:nextFu?(fuOver?'#f87171':'var(--acc)'):'var(--t3)',
// // //                             display:'flex',alignItems:'center',gap:4,margin:'0 auto',
// // //                           }}>
// // //                             <Calendar size={10}/>
// // //                             {nextFu?(fuOver?`${Math.abs(fuDays)}d over`:fuDays===0?'Today':`${fuDays}d`):<Plus size={10}/>}
// // //                           </button>
// // //                           {nextFu?.comment&&(
// // //                             <div style={{fontSize:8,color:'var(--t3)',marginTop:2,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>
// // //                               {nextFu.comment.split(' | ')[0]}
// // //                             </div>
// // //                           )}
// // //                         </td>
// // //                       </tr>
// // //                       {isOpen&&<ExpandedRow d={d} dealers={dealers} onOpenDealer={onOpenDealer} setActiveDealer={setActiveDealer} allMonthCols={allMonthCols} loadFollowups={loadFollowups}/>}
// // //                     </React.Fragment>
// // //                   );
// // //                 })}
// // //                 {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
// // //               </tbody>
// // //               <tfoot><tr>
// // //                 <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
// // //                 {allMonthCols.map(m=>{
// // //                   const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
// // //                   return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
// // //                 })}
// // //                 <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
// // //                 <td/><td/>
// // //               </tr></tfoot>
// // //             </table>
// // //           </div>
// // //         </div>
// // //       </>)}

// // //       {activeDealer&&(
// // //         <FollowupModal
// // //           dealer={activeDealer}
// // //           existingFollowups={followups}
// // //           currentUser={currentUser}
// // //           onClose={()=>setActiveDealer(null)}
// // //           onSaved={loadFollowups}
// // //         />
// // //       )}
// // //     </div>
// // //   );
// // // }

// // import React, { useState, useMemo, useEffect, useRef } from 'react';
// // import { RefreshCw, Search, X, Upload, Plus, Check, Trash2, Calendar, MessageSquare, Bell, Phone, PhoneMissed } from 'lucide-react';
// // import { api, dbOutstandingToApp } from '../api';
// // import { Avatar, MultiSelect } from './UI';

// // const fmt      = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';
// // const todayStr = () => new Date().toISOString().slice(0,10);
// // const daysUntil= d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

// // // ── Followup Modal ────────────────────────────────────────────────────────────
// // function FollowupModal({ dealer, existingFollowups, onClose, onSaved }) {
// //   const [date,    setDate]    = useState(todayStr());
// //   const [comment, setComment] = useState('');
// //   const [amount,  setAmount]  = useState(dealer.latestOutstanding||0);
// //   const [saving,  setSaving]  = useState(false);
// //   const [err,     setErr]     = useState('');

// //   // 3 comment quick-fill boxes
// //   const [quickComments, setQuickComments] = useState(['','','']);
// //   const setQC = (i,v) => setQuickComments(prev=>{ const a=[...prev]; a[i]=v; return a; });

// //   const mine = existingFollowups.filter(f=>
// //     f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim()
// //   ).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));

// //   const handleAdd = async (type='followup') => {
// //     if(type==='followup' && !date){ setErr('Date required'); return; }
// //     setSaving(true); setErr('');
// //     try {
// //       const allComments = [comment, ...quickComments].filter(Boolean).join(' | ');
// //       await api.addFollowup({
// //         dealerName:   dealer.name,
// //         salesman:     dealer.matchedSalesman?.id || '',
// //         amount:       Number(amount)||0,
// //         followupDate: type==='no-pickup' ? todayStr() : date,
// //         comment:      type==='no-pickup' ? '📵 Did not pick call' + (allComments?` — ${allComments}`:'') : allComments,
// //         type,
// //       });
// //       setDate(todayStr()); setComment(''); setQuickComments(['','','']); setAmount(dealer.latestOutstanding||0);
// //       onSaved();
// //     } catch(e){ setErr(e.message); }
// //     setSaving(false);
// //   };

// //   const handleMark = async (id,status) => {
// //     await api.updateFollowup(id,{status}); onSaved();
// //   };
// //   const handleDelete = async (id) => {
// //     if(!confirm('Delete this follow-up?')) return;
// //     await api.deleteFollowup(id); onSaved();
// //   };

// //   return (
// //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// //       <div className="modal" style={{maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
// //         {/* Header */}
// //         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
// //           <div>
// //             <div style={{fontSize:16,fontWeight:700}}>{dealer.name}</div>
// //             <div style={{fontSize:12,color:'#f87171',marginTop:2}}>
// //               Outstanding: {fmt(dealer.latestOutstanding)}
// //             </div>
// //           </div>
// //           <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
// //         </div>

// //         {/* Add new follow-up */}
// //         <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
// //             <Plus size={13} color="var(--acc)"/> Add Follow-up / Comment
// //           </div>

// //           {/* Date + Amount */}
// //           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
// //             <div>
// //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Next Follow-up Date</label>
// //               <input type="date" className="inp" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%'}}/>
// //             </div>
// //             <div>
// //               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Expected Payment ₹</label>
// //               <input type="number" className="inp" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// //             </div>
// //           </div>

// //           {/* Main comment */}
// //           <div style={{marginBottom:8}}>
// //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Comment</label>
// //             <textarea className="inp" value={comment} onChange={e=>setComment(e.target.value)}
// //               placeholder="e.g. Will pay after 15th, cheque promised..."
// //               rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit'}}/>
// //           </div>

// //           {/* 3 quick comment boxes */}
// //           <div style={{marginBottom:12}}>
// //             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:6,textTransform:'uppercase'}}>Quick Notes (3 fields)</label>
// //             <div style={{display:'flex',flexDirection:'column',gap:6}}>
// //               {quickComments.map((v,i)=>(
// //                 <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
// //                   <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right',flexShrink:0}}>{i+1}.</span>
// //                   <input className="inp" value={v} onChange={e=>setQC(i,e.target.value)}
// //                     placeholder={['Dealer response...','Next action...','Additional info...'][i]}
// //                     style={{flex:1,fontSize:12}}/>
// //                   {v&&<button onClick={()=>setQC(i,'')} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><X size={11}/></button>}
// //                 </div>
// //               ))}
// //             </div>
// //           </div>

// //           {err&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>{err}</div>}

// //           {/* Action buttons */}
// //           <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
// //             <button onClick={()=>handleAdd('followup')} disabled={saving} className="btnp"
// //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
// //               {saving?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Calendar size={11}/>}
// //               Save Follow-up
// //             </button>
// //             <button onClick={()=>handleAdd('no-pickup')} disabled={saving} className="btn"
// //               style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// //               <PhoneMissed size={11}/> Did Not Pick Call
// //             </button>
// //           </div>
// //         </div>

// //         {/* History */}
// //         <div>
// //           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
// //             History ({mine.length})
// //           </div>
// //           {mine.length===0&&(
// //             <div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:12}}>No follow-ups yet</div>
// //           )}
// //           {mine.map(f=>{
// //             const days   = daysUntil(f.followupDate);
// //             const isDone = f.status==='done';
// //             const isOver = !isDone && days<0;
// //             const isNoPickup = f.type==='no-pickup' || f.comment?.startsWith('📵');
// //             return(
// //               <div key={f._id} style={{
// //                 padding:'10px 12px',borderRadius:8,marginBottom:8,
// //                 background:isNoPickup?'rgba(248,113,113,0.04)':isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.05)':'var(--bg2)',
// //                 border:`1px solid ${isNoPickup?'rgba(248,113,113,0.15)':isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'var(--b2)'}`,
// //                 opacity:isDone?0.65:1,
// //               }}>
// //                 <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
// //                   <div style={{flex:1,minWidth:0}}>
// //                     <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
// //                       {isNoPickup
// //                         ? <PhoneMissed size={12} color="#f87171"/>
// //                         : <Calendar size={12} color={isDone?'#34d399':isOver?'#f87171':'var(--acc)'}/>}
// //                       <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>
// //                         {f.followupDate}
// //                       </span>
// //                       <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:600,
// //                         background:isNoPickup?'rgba(248,113,113,0.12)':isDone?'rgba(52,211,153,0.12)':isOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.1)',
// //                         color:isNoPickup?'#f87171':isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// //                         {isNoPickup?'📵 No Pickup':isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// //                       </span>
// //                       {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// //                     </div>
// //                     {f.comment&&(
// //                       <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5}}>
// //                         {f.comment.split(' | ').map((part,i)=>(
// //                           <div key={i} style={{display:'flex',gap:4,alignItems:'flex-start'}}>
// //                             <MessageSquare size={9} style={{marginTop:2,flexShrink:0}}/>
// //                             <span>{part}</span>
// //                           </div>
// //                         ))}
// //                       </div>
// //                     )}
// //                     <div style={{fontSize:9,color:'var(--t3)',marginTop:4}}>
// //                       {new Date(f.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
// //                     </div>
// //                   </div>
// //                   <div style={{display:'flex',flexDirection:'column',gap:4}}>
// //                     {!isDone&&!isNoPickup&&(
// //                       <button onClick={()=>handleMark(f._id,'done')}
// //                         style={{background:'none',border:'1px solid #34d399',color:'#34d399',borderRadius:4,padding:'3px 6px',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:3}}>
// //                         <Check size={9}/> Done
// //                       </button>
// //                     )}
// //                     <button onClick={()=>handleDelete(f._id)}
// //                       style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3}}>
// //                       <Trash2 size={11}/>
// //                     </button>
// //                   </div>
// //                 </div>
// //               </div>
// //             );
// //           })}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }


// // // ── Inline expanded row with 3 comment boxes + no-pickup ─────────────────────
// // function ExpandedRow({ d, dealers, onOpenDealer, setActiveDealer, allMonthCols, loadFollowups }) {
// //   const [notes, setNotes]     = useState(['','','']);
// //   const [saving, setSaving]   = useState(false);
// //   const [saved,  setSaved]    = useState(false);

// //   const setNote = (i,v) => setNotes(prev=>{ const a=[...prev]; a[i]=v; return a; });

// //   const saveNotes = async () => {
// //     const text = notes.filter(Boolean).join(' | ');
// //     if(!text) return;
// //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in to save notes.'); return; }
// //     setSaving(true);
// //     try {
// //       await api.addFollowup({
// //         dealerName:   d.name,
// //         salesman:     d.matchedSalesman?.id||'',
// //         amount:       d.latestOutstanding,
// //         followupDate: todayStr(),
// //         comment:      text,
// //         type:         'comment',
// //       });
// //       setNotes(['','','']); setSaved(true);
// //       setTimeout(()=>setSaved(false), 2000);
// //       loadFollowups();
// //     } catch(e){ console.warn(e); }
// //     setSaving(false);
// //   };

// //   const logNoPickup = async () => {
// //     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in.'); return; }
// //     try {
// //       await api.addFollowup({
// //         dealerName:   d.name,
// //         salesman:     d.matchedSalesman?.id||'',
// //         amount:       d.latestOutstanding,
// //         followupDate: todayStr(),
// //         comment:      '📵 Did not pick call',
// //         type:         'no-pickup',
// //       });
// //       loadFollowups();
// //     } catch(e){ console.warn(e); }
// //   };

// //   return (
// //     <tr>
// //       <td colSpan={99} style={{background:'var(--bg2)',padding:'12px 14px',borderBottom:'1px solid var(--b1)'}}>
// //         <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>

// //           {/* 1. View Dealer */}
// //           <button onClick={()=>{const dl=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());if(dl)onOpenDealer(dl.id);}}
// //             className="btnp" style={{fontSize:11,padding:'6px 12px',whiteSpace:'nowrap',flexShrink:0}}>
// //             👤 View Dealer
// //           </button>

// //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// //           {/* 2. Comment boxes */}
// //           <div style={{display:'flex',gap:6,alignItems:'center',flex:1,minWidth:200,flexWrap:'wrap'}}>
// //             {notes.map((v,i)=>(
// //               <input key={i} className="inp" value={v} onChange={e=>setNote(i,e.target.value)}
// //                 placeholder={`Comment ${i+1}...`}
// //                 style={{flex:1,minWidth:100,fontSize:11}}
// //                 onKeyDown={e=>e.key==='Enter'&&saveNotes()}/>
// //             ))}
// //             <button onClick={saveNotes} disabled={saving||!notes.some(Boolean)}
// //               className="btn" style={{fontSize:11,padding:'5px 10px',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4,
// //                 color:saved?'#34d399':'var(--t2)',border:saved?'1px solid #34d399':'1px solid var(--b2)'}}>
// //               {saving?<RefreshCw size={10} style={{animation:'spin .7s linear infinite'}}/>:saved?<Check size={10}/>:<MessageSquare size={10}/>}
// //               {saved?'Saved!':'Save'}
// //             </button>
// //           </div>

// //           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

// //           {/* 3. Follow-up date */}
// //           <button onClick={()=>setActiveDealer(d)}
// //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// //               color:'var(--acc)',border:'1px solid rgba(99,102,241,0.3)'}}>
// //             <Calendar size={12}/> Add Follow-up Date
// //           </button>

// //           {/* 4. Did not pick */}
// //           <button onClick={logNoPickup}
// //             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
// //               color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
// //             <PhoneMissed size={12}/> Did Not Pick Call
// //           </button>

// //         </div>
// //       </td>
// //     </tr>
// //   );
// // }

// // // ── Main Outstanding Component ────────────────────────────────────────────────
// // export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
// //   const isAdmin = currentUser?.role === 'admin';
// //   const [loading,      setLoading]    = useState(false);
// //   const [uploading,    setUploading]  = useState(false);
// //   const [error,        setError]      = useState('');
// //   const [uploadMsg,    setUploadMsg]  = useState('');
// //   const [search,       setSearch]     = useState('');
// //   const [smFilter,     setSmFilter]   = useState([]);
// //   const [tab,          setTab]        = useState('outstanding');
// //   const [expanded,     setExpanded]   = useState({});
// //   const [followups,    setFollowups]  = useState([]);
// //   const [activeDealer, setActiveDealer] = useState(null);
// //   const fileRef = useRef();

// //   useEffect(()=>{ loadFromDB(); loadFollowups(); },[]);

// //   const loadFollowups = async () => {
// //     try {
// //       const data = await api.getFollowups();
// //       setFollowups(data||[]);
// //     } catch(e){ console.warn('Followups load failed:',e.message); }
// //   };

// //   const loadFromDB = async () => {
// //     setLoading(true); setError('');
// //     try {
// //       const token = localStorage.getItem('stp_jwt');
// //       if(token){
// //         const data = await api.getOutstanding();
// //         if(data?.length>0){
// //           if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
// //         }
// //       }
// //     } catch(e){ setError('Load failed: '+e.message); }
// //     setLoading(false);
// //   };

// //   const handleUpload = async (file) => {
// //     if(!file) return;
// //     setUploading(true); setUploadMsg(''); setError('');
// //     try {
// //       const token = localStorage.getItem('stp_jwt');
// //       if(!token) throw new Error('Not logged in to server');
// //       const res = await api.uploadOutstanding(file);
// //       setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
// //       await loadFromDB();
// //     } catch(e){ setError('Upload failed: '+e.message); }
// //     setUploading(false);
// //   };

// //   // Filter outstanding to only show salesman's dealers when not admin
// //   const myDealerNames = useMemo(()=>{
// //     if(isAdmin) return null; // null = show all
// //     return new Set(dealers.map(d=>d.name.toLowerCase().trim()));
// //   },[dealers,isAdmin]);

// //   const filteredOutstanding = useMemo(()=>{
// //     if(!myDealerNames) return outstandingData; // admin sees all
// //     return outstandingData.filter(o=>myDealerNames.has(o.name?.toLowerCase().trim()));
// //   },[outstandingData, myDealerNames]);

// //   const allMonthCols = useMemo(()=>{
// //     const cols=new Set();
// //     filteredOutstanding.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
// //     return [...cols];
// //   },[filteredOutstanding]);

// //   const dealerSmMap = useMemo(()=>{
// //     const map={};
// //     dealers.forEach(d=>{ if(d.salesman&&users[d.salesman]) map[d.name.toLowerCase().trim()]=users[d.salesman]; });
// //     return map;
// //   },[dealers,users]);

// //   const followupMap = useMemo(()=>{
// //     const map={};
// //     followups.forEach(f=>{
// //       const k=(f.dealerName||'').toLowerCase().trim();
// //       if(k){ if(!map[k])map[k]=[]; map[k].push(f); }
// //     });
// //     return map;
// //   },[followups]);

// //   const filtered = useMemo(()=>{
// //     let d=filteredOutstanding.map(x=>{
// //       const nameKey = x.name.toLowerCase().trim();
// //       // Try exact match first, then partial match for name variations
// //       const dFu = followupMap[nameKey] || 
// //         Object.entries(followupMap).find(([k])=>k.includes(nameKey)||nameKey.includes(k))?.[1] || [];
// //       return {
// //         ...x,
// //         matchedSalesman: dealerSmMap[nameKey]||null,
// //         dealerFollowups: dFu,
// //       };
// //     });
// //     if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
// //     if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
// //     if(tab==='followups')   d=d.filter(x=>x.dealerFollowups.some(f=>f.status==='pending'));
// //     if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
// //     if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));
// //     return d;
// //   },[outstandingData,dealerSmMap,followupMap,tab,search,smFilter,isAdmin]);

// //   const totalOut       = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
// //   const countOut       = filteredOutstanding.filter(d=>d.latestOutstanding>0).length;
// //   const countCleared   = filteredOutstanding.filter(d=>d.latestOutstanding===0).length;
// //   const pendingFu      = followups.filter(f=>f.status==='pending');
// //   const overdueFu      = pendingFu.filter(f=>daysUntil(f.followupDate)<0);
// //   const smOptions      = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
// //   const toggle         = id=>setExpanded(e=>({...e,[id]:!e[id]}));

// //   return (
// //     <div className="fade">
// //       <div style={{marginBottom:16}}>
// //         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
// //         <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
// //           <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
// //           {overdueFu.length>0&&(
// //             <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:6,padding:'3px 10px'}}>
// //               <Bell size={12} color="#f87171"/>
// //               <span style={{fontSize:11,color:'#f87171',fontWeight:600}}>{overdueFu.length} overdue</span>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       {/* Action bar */}
// //       <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
// //         {isAdmin&&<>
// //           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
// //             onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
// //           <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
// //             <Upload size={13}/>{uploading?'Uploading...':'Upload Outstanding'}
// //           </button>
// //         </>}
// //         <button onClick={()=>{loadFromDB();loadFollowups();}} disabled={loading} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
// //           <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
// //         </button>
// //         {filteredOutstanding.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{filteredOutstanding.length} dealers</span>}
// //         {uploadMsg&&<span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
// //         {error&&<span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
// //       </div>

// //       {/* KPI */}
// //       {filteredOutstanding.length>0&&(
// //         <div className="stat-grid" style={{marginBottom:14}}>
// //           {[
// //             {l:'Total Outstanding', v:fmt(totalOut),       c:'#f87171'},
// //             {l:'Dealers with Due',  v:countOut,            c:'#fbbf24'},
// //             {l:'Cleared',           v:countCleared,        c:'#34d399'},
// //             {l:'Pending Follow-ups',v:pendingFu.length,    c:'var(--acc)'},
// //           ].map(k=>(
// //             <div key={k.l} className="stat-card">
// //               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
// //               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
// //             </div>
// //           ))}
// //         </div>
// //       )}

// //       {/* Month summary */}
// //       {allMonthCols.length>0&&(
// //         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
// //           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600}}>Month-wise Summary</div>
// //           <div style={{overflowX:'auto'}}>
// //             <table>
// //               <thead><tr>
// //                 <th>Month</th><th style={{textAlign:'right'}}>Total</th>
// //                 <th style={{textAlign:'right'}}>Dealers Due</th><th style={{textAlign:'right'}}>Change</th>
// //               </tr></thead>
// //               <tbody>
// //                 {allMonthCols.map((month,mi)=>{
// //                   const vals=filteredOutstanding.map(d=>d.monthlyOutstanding[month]||0);
// //                   const total=vals.reduce((a,b)=>a+b,0);
// //                   const due=vals.filter(v=>v>0).length;
// //                   const prev=mi>0?filteredOutstanding.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
// //                   const chg=mi>0?total-prev:0;
// //                   return(<tr key={month}>
// //                     <td style={{fontWeight:600}}>{month}</td>
// //                     <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
// //                     <td style={{textAlign:'right'}}>{due}</td>
// //                     <td style={{textAlign:'right',color:chg>0?'#f87171':chg<0?'#34d399':'var(--t3)',fontWeight:600}}>
// //                       {chg!==0?(chg>0?'▲':'▼')+'₹'+Number(Math.abs(chg)).toLocaleString('en-IN'):'—'}
// //                     </td>
// //                   </tr>);
// //                 })}
// //               </tbody>
// //             </table>
// //           </div>
// //         </div>
// //       )}

// //       {/* Dealer list */}
// //       {filteredOutstanding.length>0&&(<>
// //         <div className="tabs">
// //           {[
// //             {id:'outstanding',label:`Due (${countOut})`},
// //             {id:'cleared',    label:`Cleared (${countCleared})`},
// //             {id:'followups',  label:`Follow-ups (${pendingFu.length})`,badge:overdueFu.length},
// //             {id:'all',        label:`All (${filteredOutstanding.length})`},
// //           ].map(t=>(
// //             <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)} style={{position:'relative'}}>
// //               {t.label}
// //               {t.badge>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'#f87171',borderRadius:'50%',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
// //             </button>
// //           ))}
// //         </div>

// //         <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
// //           <div style={{position:'relative'}}>
// //             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
// //             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
// //               value={search} onChange={e=>setSearch(e.target.value)}/>
// //           </div>
// //           {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
// //             renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
// //           {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
// //           <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
// //         </div>

// //         <div className="card" style={{padding:0,overflow:'hidden'}}>
// //           <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
// //             <table>
// //               <thead><tr>
// //                 <th>#</th><th>Dealer</th>
// //                 {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
// //                 <th style={{textAlign:'right'}}>Latest</th>
// //                 <th style={{textAlign:'right'}}>Trend</th>
// //                 <th style={{textAlign:'center'}}>Follow-up</th>
// //               </tr></thead>
// //               <tbody>
// //                 {filtered.map((d,i)=>{
// //                   const isOpen  = expanded[d.id];
// //                   const cleared = d.latestOutstanding===0;
// //                   const dFu     = d.dealerFollowups.filter(f=>f.status==='pending');
// //                   const nextFu  = [...dFu].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate))[0];
// //                   const fuDays  = nextFu ? daysUntil(nextFu.followupDate) : null;
// //                   const fuOver  = fuDays!==null && fuDays<0;
// //                   const noPickups = d.dealerFollowups.filter(f=>f.type==='no-pickup'||f.comment?.startsWith('📵'));
// //                   const latestNP = noPickups[noPickups.length-1];

// //                   return(
// //                     <React.Fragment key={d.id}>
// //                       <tr style={{background:cleared?'rgba(52,211,153,0.03)':'transparent',cursor:'pointer'}} onClick={()=>toggle(d.id)}>
// //                         <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
// //                         <td style={{maxWidth:220}}>
// //                           <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
// //                           {/* Salesman + status badges */}
// //                           <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center',flexWrap:'wrap'}}>
// //                             {cleared&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
// //                             {d.matchedSalesman&&<div style={{display:'flex',alignItems:'center',gap:3}}>
// //                               <Avatar user={d.matchedSalesman} size={13}/>
// //                               <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
// //                             </div>}
// //                           </div>
// //                           {/* Latest comment / no-pickup — clearly visible */}
// //                           {(()=>{
// //                             const allFu = [...d.dealerFollowups].sort((a,b)=>{ const ta=new Date(b.createdAt||b.updatedAt||0); const tb=new Date(a.createdAt||a.updatedAt||0); return ta-tb; });
// //                             const latest = allFu[0];
// //                             if(!latest) return null;
// //                             const isNP  = latest.type==='no-pickup'||latest.comment?.startsWith('📵');
// //                             const isFollowup = latest.type==='followup';
// //                             const isComment = !isNP && !isFollowup;
// //                             const txt = (latest.comment||'').replace('📵 Did not pick call','').replace(/^\s*[|—]\s*/,'').trim();
// //                             return(
// //                               <div style={{marginTop:4,padding:'3px 6px',borderRadius:5,
// //                                 background:isNP?'rgba(248,113,113,0.1)':isComment?'rgba(99,102,241,0.08)':'rgba(52,211,153,0.07)',
// //                                 border:`1px solid ${isNP?'rgba(248,113,113,0.25)':isComment?'rgba(99,102,241,0.2)':'rgba(52,211,153,0.2)'}`,
// //                                 maxWidth:200,
// //                               }}>
// //                                 <div style={{display:'flex',alignItems:'center',gap:4}}>
// //                                   {isNP
// //                                     ? <><PhoneMissed size={10} color="#f87171"/><span style={{fontSize:10,color:'#f87171',fontWeight:600}}>Did not pick call</span></>
// //                                     : isFollowup
// //                                     ? <><Calendar size={10} color="#34d399"/><span style={{fontSize:10,color:'#34d399',fontWeight:600}}>Follow-up: {latest.followupDate}</span></>
// //                                     : <><MessageSquare size={10} color="var(--acc)"/><span style={{fontSize:10,color:'var(--acc)',fontWeight:600}}>Note</span></>}
// //                                   <span style={{fontSize:9,color:'var(--t3)',marginLeft:'auto'}}>
// //                                     {latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
// //                                   </span>
// //                                 </div>
// //                                 {txt&&<div style={{fontSize:10,color:'var(--t2)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{txt}</div>}
// //                               </div>
// //                             );
// //                           })()}
// //                         </td>
// //                         {allMonthCols.map(m=>{
// //                           const v=d.monthlyOutstanding[m]||0;
// //                           const mi2=allMonthCols.indexOf(m);
// //                           const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
// //                           return(<td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
// //                             {v>0?fmt(v):'—'}
// //                           </td>);
// //                         })}
// //                         <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
// //                           {cleared?'✓ Nil':fmt(d.latestOutstanding)}
// //                         </td>
// //                         <td style={{textAlign:'right'}}>
// //                           {d.trend>0?<span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
// //                           :d.trend<0?<span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
// //                           :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
// //                         </td>
// //                         <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
// //                           <button onClick={()=>setActiveDealer(d)} style={{
// //                             padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',
// //                             background:nextFu?(fuOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.12)'):'transparent',
// //                             border:nextFu?(fuOver?'1px solid #f87171':'1px solid var(--acc)'):'1px solid var(--b2)',
// //                             color:nextFu?(fuOver?'#f87171':'var(--acc)'):'var(--t3)',
// //                             display:'flex',alignItems:'center',gap:4,margin:'0 auto',
// //                           }}>
// //                             <Calendar size={10}/>
// //                             {nextFu?(fuOver?`${Math.abs(fuDays)}d over`:fuDays===0?'Today':`${fuDays}d`):<Plus size={10}/>}
// //                           </button>
// //                           {nextFu?.comment&&(
// //                             <div style={{fontSize:8,color:'var(--t3)',marginTop:2,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>
// //                               {nextFu.comment.split(' | ')[0]}
// //                             </div>
// //                           )}
// //                         </td>
// //                       </tr>
// //                       {isOpen&&<ExpandedRow d={d} dealers={dealers} onOpenDealer={onOpenDealer} setActiveDealer={setActiveDealer} allMonthCols={allMonthCols} loadFollowups={loadFollowups}/>}
// //                     </React.Fragment>
// //                   );
// //                 })}
// //                 {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
// //               </tbody>
// //               <tfoot><tr>
// //                 <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
// //                 {allMonthCols.map(m=>{
// //                   const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
// //                   return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
// //                 })}
// //                 <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
// //                 <td/><td/>
// //               </tr></tfoot>
// //             </table>
// //           </div>
// //         </div>
// //       </>)}

// //       {activeDealer&&(
// //         <FollowupModal
// //           dealer={activeDealer}
// //           existingFollowups={followups}
// //           currentUser={currentUser}
// //           onClose={()=>setActiveDealer(null)}
// //           onSaved={loadFollowups}
// //         />
// //       )}
// //     </div>
// //   );
// // }

// import React, { useState, useMemo, useEffect, useRef } from 'react';
// import { RefreshCw, Search, X, Upload, Plus, Check, Trash2, Calendar, MessageSquare, Bell, Phone, PhoneMissed } from 'lucide-react';
// import { api, dbOutstandingToApp } from '../api';
// import { Avatar, MultiSelect } from './UI';

// const fmt      = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';
// const todayStr = () => new Date().toISOString().slice(0,10);
// const daysUntil= d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

// // ── Followup Modal ────────────────────────────────────────────────────────────
// function FollowupModal({ dealer, existingFollowups, onClose, onSaved }) {
//   const [date,    setDate]    = useState(todayStr());
//   const [comment, setComment] = useState('');
//   const [amount,  setAmount]  = useState(dealer.latestOutstanding||0);
//   const [saving,  setSaving]  = useState(false);
//   const [err,     setErr]     = useState('');

//   // 3 comment quick-fill boxes
//   const [quickComments, setQuickComments] = useState(['','','']);
//   const setQC = (i,v) => setQuickComments(prev=>{ const a=[...prev]; a[i]=v; return a; });

//   const mine = existingFollowups.filter(f=>
//     f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim()
//   ).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));

//   const handleAdd = async (type='followup') => {
//     if(type==='followup' && !date){ setErr('Date required'); return; }
//     setSaving(true); setErr('');
//     try {
//       const allComments = [comment, ...quickComments].filter(Boolean).join(' | ');
//       await api.addFollowup({
//         dealerName:   dealer.name,
//         salesman:     dealer.matchedSalesman?.id || '',
//         amount:       Number(amount)||0,
//         followupDate: type==='no-pickup' ? todayStr() : date,
//         comment:      type==='no-pickup' ? '📵 Did not pick call' + (allComments?` — ${allComments}`:'') : allComments,
//         type,
//       });
//       setDate(todayStr()); setComment(''); setQuickComments(['','','']); setAmount(dealer.latestOutstanding||0);
//       onSaved();
//     } catch(e){ setErr(e.message); }
//     setSaving(false);
//   };

//   const handleMark = async (id,status) => {
//     await api.updateFollowup(id,{status}); onSaved();
//   };
//   const handleDelete = async (id) => {
//     if(!confirm('Delete this follow-up?')) return;
//     await api.deleteFollowup(id); onSaved();
//   };

//   return (
//     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
//       <div className="modal" style={{maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
//         {/* Header */}
//         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
//           <div>
//             <div style={{fontSize:16,fontWeight:700}}>{dealer.name}</div>
//             <div style={{fontSize:12,color:'#f87171',marginTop:2}}>
//               Outstanding: {fmt(dealer.latestOutstanding)}
//             </div>
//           </div>
//           <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
//         </div>

//         {/* Add new follow-up */}
//         <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
//           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
//             <Plus size={13} color="var(--acc)"/> Add Follow-up / Comment
//           </div>

//           {/* Date + Amount */}
//           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
//             <div>
//               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Next Follow-up Date</label>
//               <input type="date" className="inp" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%'}}/>
//             </div>
//             <div>
//               <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Expected Payment ₹</label>
//               <input type="number" className="inp" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
//             </div>
//           </div>

//           {/* Main comment */}
//           <div style={{marginBottom:8}}>
//             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Comment</label>
//             <textarea className="inp" value={comment} onChange={e=>setComment(e.target.value)}
//               placeholder="e.g. Will pay after 15th, cheque promised..."
//               rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit'}}/>
//           </div>

//           {/* 3 quick comment boxes */}
//           <div style={{marginBottom:12}}>
//             <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:6,textTransform:'uppercase'}}>Quick Notes (3 fields)</label>
//             <div style={{display:'flex',flexDirection:'column',gap:6}}>
//               {quickComments.map((v,i)=>(
//                 <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
//                   <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right',flexShrink:0}}>{i+1}.</span>
//                   <input className="inp" value={v} onChange={e=>setQC(i,e.target.value)}
//                     placeholder={['Dealer response...','Next action...','Additional info...'][i]}
//                     style={{flex:1,fontSize:12}}/>
//                   {v&&<button onClick={()=>setQC(i,'')} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><X size={11}/></button>}
//                 </div>
//               ))}
//             </div>
//           </div>

//           {err&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>{err}</div>}

//           {/* Action buttons */}
//           <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
//             <button onClick={()=>handleAdd('followup')} disabled={saving} className="btnp"
//               style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
//               {saving?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Calendar size={11}/>}
//               Save Follow-up
//             </button>
//             <button onClick={()=>handleAdd('no-pickup')} disabled={saving} className="btn"
//               style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
//               <PhoneMissed size={11}/> Did Not Pick Call
//             </button>
//           </div>
//         </div>

//         {/* History */}
//         <div>
//           <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
//             History ({mine.length})
//           </div>
//           {mine.length===0&&(
//             <div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:12}}>No follow-ups yet</div>
//           )}
//           {mine.map(f=>{
//             const days   = daysUntil(f.followupDate);
//             const isDone = f.status==='done';
//             const isOver = !isDone && days<0;
//             const isNoPickup = f.type==='no-pickup' || f.comment?.startsWith('📵');
//             return(
//               <div key={f._id} style={{
//                 padding:'10px 12px',borderRadius:8,marginBottom:8,
//                 background:isNoPickup?'rgba(248,113,113,0.04)':isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.05)':'var(--bg2)',
//                 border:`1px solid ${isNoPickup?'rgba(248,113,113,0.15)':isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'var(--b2)'}`,
//                 opacity:isDone?0.65:1,
//               }}>
//                 <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
//                   <div style={{flex:1,minWidth:0}}>
//                     <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
//                       {isNoPickup
//                         ? <PhoneMissed size={12} color="#f87171"/>
//                         : <Calendar size={12} color={isDone?'#34d399':isOver?'#f87171':'var(--acc)'}/>}
//                       <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>
//                         {f.followupDate}
//                       </span>
//                       <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:600,
//                         background:isNoPickup?'rgba(248,113,113,0.12)':isDone?'rgba(52,211,153,0.12)':isOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.1)',
//                         color:isNoPickup?'#f87171':isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
//                         {isNoPickup?'📵 No Pickup':isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
//                       </span>
//                       {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
//                     </div>
//                     {f.comment&&(
//                       <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5}}>
//                         {f.comment.split(' | ').map((part,i)=>(
//                           <div key={i} style={{display:'flex',gap:4,alignItems:'flex-start'}}>
//                             <MessageSquare size={9} style={{marginTop:2,flexShrink:0}}/>
//                             <span>{part}</span>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                     <div style={{fontSize:9,color:'var(--t3)',marginTop:4}}>
//                       {new Date(f.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
//                     </div>
//                   </div>
//                   <div style={{display:'flex',flexDirection:'column',gap:4}}>
//                     {!isDone&&!isNoPickup&&(
//                       <button onClick={()=>handleMark(f._id,'done')}
//                         style={{background:'none',border:'1px solid #34d399',color:'#34d399',borderRadius:4,padding:'3px 6px',cursor:'pointer',fontSize:10,display:'flex',alignItems:'center',gap:3}}>
//                         <Check size={9}/> Done
//                       </button>
//                     )}
//                     <button onClick={()=>handleDelete(f._id)}
//                       style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3}}>
//                       <Trash2 size={11}/>
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }


// // ── Inline expanded row with 3 comment boxes + no-pickup ─────────────────────
// function ExpandedRow({ d, dealers, onOpenDealer, setActiveDealer, allMonthCols, loadFollowups }) {
//   const [notes, setNotes]     = useState(['','','']);
//   const [saving, setSaving]   = useState(false);
//   const [saved,  setSaved]    = useState(false);

//   const setNote = (i,v) => setNotes(prev=>{ const a=[...prev]; a[i]=v; return a; });

//   const saveNotes = async () => {
//     const text = notes.filter(Boolean).join(' | ');
//     if(!text) return;
//     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in to save notes.'); return; }
//     setSaving(true);
//     try {
//       await api.addFollowup({
//         dealerName:   d.name,
//         salesman:     d.matchedSalesman?.id||'',
//         amount:       d.latestOutstanding,
//         followupDate: todayStr(),
//         comment:      text,
//         type:         'comment',
//       });
//       setNotes(['','','']); setSaved(true);
//       setTimeout(()=>setSaved(false), 2000);
//       loadFollowups();
//     } catch(e){ console.warn(e); }
//     setSaving(false);
//   };

//   const logNoPickup = async () => {
//     if(!localStorage.getItem('stp_jwt')){ alert('Please log out and log back in.'); return; }
//     try {
//       await api.addFollowup({
//         dealerName:   d.name,
//         salesman:     d.matchedSalesman?.id||'',
//         amount:       d.latestOutstanding,
//         followupDate: todayStr(),
//         comment:      '📵 Did not pick call',
//         type:         'no-pickup',
//       });
//       loadFollowups();
//     } catch(e){ console.warn(e); }
//   };

//   return (
//     <tr>
//       <td colSpan={99} style={{background:'var(--bg2)',padding:'12px 14px',borderBottom:'1px solid var(--b1)'}}>
//         <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>

//           {/* 1. View Dealer */}
//           <button onClick={()=>{const dl=dealers.find(x=>x.name.toUpperCase().trim()===d.name.toUpperCase().trim());if(dl)onOpenDealer(dl.id);}}
//             className="btnp" style={{fontSize:11,padding:'6px 12px',whiteSpace:'nowrap',flexShrink:0}}>
//             👤 View Dealer
//           </button>

//           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

//           {/* 2. Comment boxes */}
//           <div style={{display:'flex',gap:6,alignItems:'center',flex:1,minWidth:200,flexWrap:'wrap'}}>
//             {notes.map((v,i)=>(
//               <input key={i} className="inp" value={v} onChange={e=>setNote(i,e.target.value)}
//                 placeholder={`Comment ${i+1}...`}
//                 style={{flex:1,minWidth:100,fontSize:11}}
//                 onKeyDown={e=>e.key==='Enter'&&saveNotes()}/>
//             ))}
//             <button onClick={saveNotes} disabled={saving||!notes.some(Boolean)}
//               className="btn" style={{fontSize:11,padding:'5px 10px',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:4,
//                 color:saved?'#34d399':'var(--t2)',border:saved?'1px solid #34d399':'1px solid var(--b2)'}}>
//               {saving?<RefreshCw size={10} style={{animation:'spin .7s linear infinite'}}/>:saved?<Check size={10}/>:<MessageSquare size={10}/>}
//               {saved?'Saved!':'Save'}
//             </button>
//           </div>

//           <div style={{width:1,height:28,background:'var(--b2)',flexShrink:0}}/>

//           {/* 3. Follow-up date */}
//           <button onClick={()=>setActiveDealer(d)}
//             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
//               color:'var(--acc)',border:'1px solid rgba(99,102,241,0.3)'}}>
//             <Calendar size={12}/> Add Follow-up Date
//           </button>

//           {/* 4. Did not pick */}
//           <button onClick={logNoPickup}
//             className="btn" style={{fontSize:11,padding:'6px 12px',display:'flex',alignItems:'center',gap:5,whiteSpace:'nowrap',flexShrink:0,
//               color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
//             <PhoneMissed size={12}/> Did Not Pick Call
//           </button>

//         </div>
//       </td>
//     </tr>
//   );
// }

// // ── Main Outstanding Component ────────────────────────────────────────────────
// export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
//   const isAdmin = currentUser?.role === 'admin';
//   const [loading,      setLoading]    = useState(false); // don't show loading if data passed from parent
//   const [uploading,    setUploading]  = useState(false);
//   const [error,        setError]      = useState('');
//   const [uploadMsg,    setUploadMsg]  = useState('');
//   const [search,       setSearch]     = useState('');
//   const [smFilter,     setSmFilter]   = useState([]);
//   const [tab,          setTab]        = useState('outstanding');
//   const [expanded,     setExpanded]   = useState({});
//   const [followups,    setFollowups]  = useState([]);
//   const [activeDealer, setActiveDealer] = useState(null);
//   const fileRef = useRef();

//   useEffect(()=>{
//     loadFollowups();
//     // Only hit API if no data from parent
//     if(!outstandingData?.length) loadFromDB();
//   },[]);

//   const loadFollowups = async () => {
//     try {
//       const data = await api.getFollowups();
//       setFollowups(data||[]);
//     } catch(e){ console.warn('Followups load failed:',e.message); }
//   };

//   const loadFromDB = async () => {
//     setLoading(true); setError('');
//     try {
//       const token = localStorage.getItem('stp_jwt');
//       if(token){
//         const data = await api.getOutstanding();
//         if(data?.length>0){
//           if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
//         }
//       }
//     } catch(e){ setError('Load failed: '+e.message); }
//     setLoading(false);
//   };

//   const handleUpload = async (file) => {
//     if(!file) return;
//     setUploading(true); setUploadMsg(''); setError('');
//     try {
//       const token = localStorage.getItem('stp_jwt');
//       if(!token) throw new Error('Not logged in to server');
//       const res = await api.uploadOutstanding(file);
//       setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
//       await loadFromDB();
//     } catch(e){ setError('Upload failed: '+e.message); }
//     setUploading(false);
//   };

//   // Filter outstanding to only show salesman's dealers when not admin
//   const myDealerNames = useMemo(()=>{
//     if(isAdmin) return null; // null = show all
//     return new Set(dealers.map(d=>d.name.toLowerCase().trim()));
//   },[dealers,isAdmin]);

//   const filteredOutstanding = useMemo(()=>{
//     if(!myDealerNames) return outstandingData; // admin sees all
//     return outstandingData.filter(o=>myDealerNames.has(o.name?.toLowerCase().trim()));
//   },[outstandingData, myDealerNames]);

//   const allMonthCols = useMemo(()=>{
//     const cols=new Set();
//     filteredOutstanding.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
//     return [...cols];
//   },[filteredOutstanding]);

//   const dealerSmMap = useMemo(()=>{
//     const map={};
//     dealers.forEach(d=>{ if(d.salesman&&users[d.salesman]) map[d.name.toLowerCase().trim()]=users[d.salesman]; });
//     return map;
//   },[dealers,users]);

//   const followupMap = useMemo(()=>{
//     const map={};
//     followups.forEach(f=>{
//       const k=(f.dealerName||'').toLowerCase().trim();
//       if(k){ if(!map[k])map[k]=[]; map[k].push(f); }
//     });
//     return map;
//   },[followups]);

//   const filtered = useMemo(()=>{
//     let d=filteredOutstanding.map(x=>{
//       const nameKey = x.name.toLowerCase().trim();
//       // Try exact match first, then partial match for name variations
//       const dFu = followupMap[nameKey] || 
//         Object.entries(followupMap).find(([k])=>k.includes(nameKey)||nameKey.includes(k))?.[1] || [];
//       return {
//         ...x,
//         matchedSalesman: dealerSmMap[nameKey]||null,
//         dealerFollowups: dFu,
//       };
//     });
//     if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
//     if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
//     if(tab==='followups')   d=d.filter(x=>x.dealerFollowups.some(f=>f.status==='pending'));
//     if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
//     if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));
//     return d;
//   },[outstandingData,dealerSmMap,followupMap,tab,search,smFilter,isAdmin]);

//   const totalOut       = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
//   const countOut       = filteredOutstanding.filter(d=>d.latestOutstanding>0).length;
//   const countCleared   = filteredOutstanding.filter(d=>d.latestOutstanding===0).length;
//   const pendingFu      = followups.filter(f=>f.status==='pending');
//   const overdueFu      = pendingFu.filter(f=>daysUntil(f.followupDate)<0);
//   const smOptions      = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
//   const toggle         = id=>setExpanded(e=>({...e,[id]:!e[id]}));

//   return (
//     <div className="fade">
//       <div style={{marginBottom:16}}>
//         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
//         <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
//           <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
//           {overdueFu.length>0&&(
//             <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:6,padding:'3px 10px'}}>
//               <Bell size={12} color="#f87171"/>
//               <span style={{fontSize:11,color:'#f87171',fontWeight:600}}>{overdueFu.length} overdue</span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Action bar */}
//       <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
//         {isAdmin&&<>
//           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
//             onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
//           <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
//             <Upload size={13}/>{uploading?'Uploading...':'Upload Outstanding'}
//           </button>
//         </>}
//         <button onClick={()=>{loadFromDB();loadFollowups();}} disabled={loading} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
//           <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
//         </button>
//         {filteredOutstanding.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{filteredOutstanding.length} dealers</span>}
//         {uploadMsg&&<span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
//         {error&&<span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
//       </div>

//       {/* KPI */}
//       {filteredOutstanding.length>0&&(
//         <div className="stat-grid" style={{marginBottom:14}}>
//           {[
//             {l:'Total Outstanding', v:fmt(totalOut),       c:'#f87171'},
//             {l:'Dealers with Due',  v:countOut,            c:'#fbbf24'},
//             {l:'Cleared',           v:countCleared,        c:'#34d399'},
//             {l:'Pending Follow-ups',v:pendingFu.length,    c:'var(--acc)'},
//           ].map(k=>(
//             <div key={k.l} className="stat-card">
//               <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
//               <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Month summary */}
//       {allMonthCols.length>0&&(
//         <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
//           <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600}}>Month-wise Summary</div>
//           <div style={{overflowX:'auto'}}>
//             <table>
//               <thead><tr>
//                 <th>Month</th><th style={{textAlign:'right'}}>Total</th>
//                 <th style={{textAlign:'right'}}>Dealers Due</th><th style={{textAlign:'right'}}>Change</th>
//               </tr></thead>
//               <tbody>
//                 {allMonthCols.map((month,mi)=>{
//                   const vals=filteredOutstanding.map(d=>d.monthlyOutstanding[month]||0);
//                   const total=vals.reduce((a,b)=>a+b,0);
//                   const due=vals.filter(v=>v>0).length;
//                   const prev=mi>0?filteredOutstanding.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
//                   const chg=mi>0?total-prev:0;
//                   return(<tr key={month}>
//                     <td style={{fontWeight:600}}>{month}</td>
//                     <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
//                     <td style={{textAlign:'right'}}>{due}</td>
//                     <td style={{textAlign:'right',color:chg>0?'#f87171':chg<0?'#34d399':'var(--t3)',fontWeight:600}}>
//                       {chg!==0?(chg>0?'▲':'▼')+'₹'+Number(Math.abs(chg)).toLocaleString('en-IN'):'—'}
//                     </td>
//                   </tr>);
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Dealer list */}
//       {filteredOutstanding.length>0&&(<>
//         <div className="tabs">
//           {[
//             {id:'outstanding',label:`Due (${countOut})`},
//             {id:'cleared',    label:`Cleared (${countCleared})`},
//             {id:'followups',  label:`Follow-ups (${pendingFu.length})`,badge:overdueFu.length},
//             {id:'all',        label:`All (${filteredOutstanding.length})`},
//           ].map(t=>(
//             <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)} style={{position:'relative'}}>
//               {t.label}
//               {t.badge>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'#f87171',borderRadius:'50%',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
//             </button>
//           ))}
//         </div>

//         <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
//           <div style={{position:'relative'}}>
//             <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//             <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
//               value={search} onChange={e=>setSearch(e.target.value)}/>
//           </div>
//           {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
//             renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
//           {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
//           <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
//         </div>

//         <div className="card" style={{padding:0,overflow:'hidden'}}>
//           <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
//             <table>
//               <thead><tr>
//                 <th>#</th><th>Dealer</th>
//                 {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
//                 <th style={{textAlign:'right'}}>Latest</th>
//                 <th style={{textAlign:'right'}}>Trend</th>
//                 <th style={{textAlign:'center'}}>Follow-up</th>
//               </tr></thead>
//               <tbody>
//                 {filtered.map((d,i)=>{
//                   const isOpen  = expanded[d.id];
//                   const cleared = d.latestOutstanding===0;
//                   const dFu     = d.dealerFollowups.filter(f=>f.status==='pending');
//                   const nextFu  = [...dFu].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate))[0];
//                   const fuDays  = nextFu ? daysUntil(nextFu.followupDate) : null;
//                   const fuOver  = fuDays!==null && fuDays<0;
//                   const noPickups = d.dealerFollowups.filter(f=>f.type==='no-pickup'||f.comment?.startsWith('📵'));
//                   const latestNP = noPickups[noPickups.length-1];

//                   return(
//                     <React.Fragment key={d.id}>
//                       <tr style={{background:cleared?'rgba(52,211,153,0.03)':'transparent',cursor:'pointer'}} onClick={()=>toggle(d.id)}>
//                         <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
//                         <td style={{maxWidth:220}}>
//                           <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
//                           {/* Salesman + status badges */}
//                           <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center',flexWrap:'wrap'}}>
//                             {cleared&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>}
//                             {d.matchedSalesman&&<div style={{display:'flex',alignItems:'center',gap:3}}>
//                               <Avatar user={d.matchedSalesman} size={13}/>
//                               <span style={{fontSize:9,color:d.matchedSalesman.color}}>{d.matchedSalesman.name}</span>
//                             </div>}
//                           </div>
//                           {/* Latest comment / no-pickup — clearly visible */}
//                           {(()=>{
//                             const allFu = [...d.dealerFollowups].sort((a,b)=>{ const ta=new Date(b.createdAt||b.updatedAt||0); const tb=new Date(a.createdAt||a.updatedAt||0); return ta-tb; });
//                             const latest = allFu[0];
//                             if(!latest) return null;
//                             const isNP  = latest.type==='no-pickup'||latest.comment?.startsWith('📵');
//                             const isFollowup = latest.type==='followup';
//                             const isComment = !isNP && !isFollowup;
//                             const txt = (latest.comment||'').replace('📵 Did not pick call','').replace(/^\s*[|—]\s*/,'').trim();
//                             return(
//                               <div style={{marginTop:4,padding:'3px 6px',borderRadius:5,
//                                 background:isNP?'rgba(248,113,113,0.1)':isComment?'rgba(99,102,241,0.08)':'rgba(52,211,153,0.07)',
//                                 border:`1px solid ${isNP?'rgba(248,113,113,0.25)':isComment?'rgba(99,102,241,0.2)':'rgba(52,211,153,0.2)'}`,
//                                 maxWidth:200,
//                               }}>
//                                 <div style={{display:'flex',alignItems:'center',gap:4}}>
//                                   {isNP
//                                     ? <><PhoneMissed size={10} color="#f87171"/><span style={{fontSize:10,color:'#f87171',fontWeight:600}}>Did not pick call</span></>
//                                     : isFollowup
//                                     ? <><Calendar size={10} color="#34d399"/><span style={{fontSize:10,color:'#34d399',fontWeight:600}}>Follow-up: {latest.followupDate}</span></>
//                                     : <><MessageSquare size={10} color="var(--acc)"/><span style={{fontSize:10,color:'var(--acc)',fontWeight:600}}>Note</span></>}
//                                   <span style={{fontSize:9,color:'var(--t3)',marginLeft:'auto'}}>
//                                     {latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
//                                   </span>
//                                 </div>
//                                 {txt&&<div style={{fontSize:10,color:'var(--t2)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{txt}</div>}
//                               </div>
//                             );
//                           })()}
//                         </td>
//                         {allMonthCols.map(m=>{
//                           const v=d.monthlyOutstanding[m]||0;
//                           const mi2=allMonthCols.indexOf(m);
//                           const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
//                           return(<td key={m} style={{textAlign:'right',color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',fontWeight:v>0?600:400,fontSize:12}}>
//                             {v>0?fmt(v):'—'}
//                           </td>);
//                         })}
//                         <td style={{textAlign:'right',fontWeight:700,color:cleared?'#34d399':'#f87171',fontSize:13}}>
//                           {cleared?'✓ Nil':fmt(d.latestOutstanding)}
//                         </td>
//                         <td style={{textAlign:'right'}}>
//                           {d.trend>0?<span style={{color:'#f87171',fontSize:11}}>▲{fmt(d.trend)}</span>
//                           :d.trend<0?<span style={{color:'#34d399',fontSize:11}}>▼{fmt(Math.abs(d.trend))}</span>
//                           :<span style={{color:'var(--t3)',fontSize:11}}>—</span>}
//                         </td>
//                         <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
//                           <button onClick={()=>setActiveDealer(d)} style={{
//                             padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',
//                             background:nextFu?(fuOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.12)'):'transparent',
//                             border:nextFu?(fuOver?'1px solid #f87171':'1px solid var(--acc)'):'1px solid var(--b2)',
//                             color:nextFu?(fuOver?'#f87171':'var(--acc)'):'var(--t3)',
//                             display:'flex',alignItems:'center',gap:4,margin:'0 auto',
//                           }}>
//                             <Calendar size={10}/>
//                             {nextFu?(fuOver?`${Math.abs(fuDays)}d over`:fuDays===0?'Today':`${fuDays}d`):<Plus size={10}/>}
//                           </button>
//                           {nextFu?.comment&&(
//                             <div style={{fontSize:8,color:'var(--t3)',marginTop:2,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>
//                               {nextFu.comment.split(' | ')[0]}
//                             </div>
//                           )}
//                         </td>
//                       </tr>
//                       {isOpen&&<ExpandedRow d={d} dealers={dealers} onOpenDealer={onOpenDealer} setActiveDealer={setActiveDealer} allMonthCols={allMonthCols} loadFollowups={loadFollowups}/>}
//                     </React.Fragment>
//                   );
//                 })}
//                 {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
//               </tbody>
//               <tfoot><tr>
//                 <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
//                 {allMonthCols.map(m=>{
//                   const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
//                   return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
//                 })}
//                 <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
//                 <td/><td/>
//               </tr></tfoot>
//             </table>
//           </div>
//         </div>
//       </>)}

//       {activeDealer&&(
//         <FollowupModal
//           dealer={activeDealer}
//           existingFollowups={followups}
//           currentUser={currentUser}
//           onClose={()=>setActiveDealer(null)}
//           onSaved={loadFollowups}
//         />
//       )}
//     </div>
//   );
// }

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RefreshCw, Search, X, Upload, Plus, Check, Trash2, Calendar, MessageSquare, Bell, Phone, PhoneMissed, Download } from 'lucide-react';
import { fetchCSV, parseOutstandingCSV } from '../utils';
import { api, dbOutstandingToApp } from '../api';
import { Avatar, MultiSelect } from './UI';
import { notify, confirmDialog } from './Toast';
import { VoiceTextarea } from './VoiceInput';

const fmt      = v => v > 0 ? '₹' + Number(v).toLocaleString('en-IN') : '—';
const todayStr = () => new Date().toISOString().slice(0,10);
const daysUntil= d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

// ── Followup Modal ────────────────────────────────────────────────────────────
// `prefillMonth` / `prefillAmount` are set when the popup was opened by
// clicking a specific month-amount cell — the modal then highlights that
// month and pre-fills the amount field with that month's value (instead of
// the dealer's latest outstanding).
// Preset reasons shown in the dropdown. Picking "Others" reveals the free-text
// comment box so the salesman can type anything that doesn't fit a preset.
const FOLLOWUP_REASONS = [
  'Payment Collected',
  'Follow-up Required / Funds Not Available',
  'Invoice / Material Dispute',
  'Credit Note Issue',
  'Dealer is not Genuine',
  'Dealer Not Available',
  'Postponed the Payment Date',
  'Ledger Statement',
  'Others',
];

function FollowupModal({ dealer, existingFollowups, onClose, onSaved, prefillMonth, prefillAmount }) {
  const [date,    setDate]    = useState(todayStr());
  const [reason,  setReason]  = useState('');     // preset reason from dropdown
  const [comment, setComment] = useState('');     // free-text note (only when reason === 'Others' or as add-on)
  const [amount,  setAmount]  = useState(
    typeof prefillAmount === 'number' ? prefillAmount : (dealer.latestOutstanding||0)
  );
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');
  // Zoom modal for clicking on a payment-proof image in the history.
  const [zoomImg, setZoomImg] = useState('');

  const mine = existingFollowups.filter(f=>
    f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim()
  ).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));

  // Follow-up date cap — max 7 days from today. The native date picker
  // enforces this via its `max` attribute, but we re-check at save time
  // in case someone types a date directly.
  const todayLocal = todayStr();
  const maxFollowupDate = (() => {
    const d = new Date(); d.setDate(d.getDate() + 7);
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  })();

  const handleAdd = async (type='followup') => {
    if(type==='followup' && !date){ setErr('Date required'); return; }
    // For follow-up entries: require either a preset reason or a comment when
    // "Others" is chosen. (no-pickup still gets through with no reason.)
    if (type === 'followup') {
      if (!reason) { setErr('Pick a reason'); return; }
      if (reason === 'Others' && !(comment || '').trim()) {
        setErr('Add a note for the "Others" reason'); return;
      }
      // Enforce the 7-day cap server-side too
      if (date > maxFollowupDate) {
        setErr(`Follow-up date can't be more than 7 days from today (latest: ${maxFollowupDate})`);
        return;
      }
      if (date < todayLocal) {
        setErr(`Follow-up date can't be in the past`);
        return;
      }
    }
    setSaving(true); setErr('');
    try {
      const note = (comment || '').trim();
      // Compose the final saved comment: "<Reason>" or "<Reason> — <note>"
      // so the history strip in this modal shows the reason clearly.
      let saved = '';
      if (type === 'no-pickup') {
        saved = '📵 Did not pick call' + (note ? ` — ${note}` : '');
      } else if (reason === 'Others') {
        saved = note;                              // "Others" is just the note text
      } else if (reason) {
        saved = note ? `${reason} — ${note}` : reason;
      } else {
        saved = note;
      }
      // Tag the follow-up with whichever specific month the user clicked on
      // (if they opened the popup from a month cell). Otherwise no month tag
      // — the comment is still saved at the dealer level and will show up in
      // the dealer's full history.
      const chosenMonths = prefillMonth ? [prefillMonth] : [];
      await api.addFollowup({
        dealerName:   dealer.name,
        salesman:     dealer.matchedSalesman?.id || '',
        amount:       Number(amount)||0,
        followupDate: type==='no-pickup' ? todayStr() : date,
        comment:      saved,
        type,
        reason:       type === 'followup' ? reason : '',
        months:       chosenMonths,
      });
      setDate(todayStr()); setReason(''); setComment(''); setAmount(dealer.latestOutstanding||0);
      onSaved();
    } catch(e){ setErr(e.message); }
    setSaving(false);
  };

  const handleMark = async (id,status) => {
    // When marking a follow-up as 'done' (collected), let the user attach an
    // optional payment proof. We open a tiny inline file input. Cancel = skip.
    if(status === 'done'){
      // Use a one-off file input — auto-compressed to ≤900px JPEG.
      const proofUrl = await new Promise((resolve) => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'image/*';
        inp.onchange = async (e) => {
          const f = e.target.files?.[0];
          if(!f){ resolve(''); return; }
          try {
            const reader = new FileReader();
            reader.onload = () => {
              const img = new Image();
              img.onload = () => {
                const scale = Math.min(1, 900 / Math.max(img.width, img.height));
                const w = Math.round(img.width * scale);
                const h = Math.round(img.height * scale);
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL('image/jpeg', 0.75));
              };
              img.onerror = () => resolve('');
              img.src = reader.result;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(f);
          } catch{ resolve(''); }
        };
        // If the picker is dismissed without choosing, resolve empty after a tick
        setTimeout(()=>{ try{ inp.click(); }catch{} }, 0);
        // Safety: if user cancels the dialog, the change event never fires.
        // Treat onfocus on body as cancel after ~1s.
        const onFocus = () => {
          setTimeout(()=>{
            if(!inp.files || !inp.files[0]) resolve('');
            window.removeEventListener('focus', onFocus);
          }, 800);
        };
        window.addEventListener('focus', onFocus, { once:true });
      });
      const patch = { status, collectedAt: new Date() };
      if(proofUrl) patch.paymentProof = proofUrl;
      await api.updateFollowup(id, patch);
      notify.success(proofUrl ? 'Marked collected (with proof attached)' : 'Marked collected');
      onSaved();
      return;
    }
    await api.updateFollowup(id,{status}); onSaved();
  };
  const handleDelete = async (id) => {
    const okDel = await confirmDialog({ title:'Delete this follow-up?', confirmText:'Delete', danger:true });
    if(!okDel) return;
    await api.deleteFollowup(id); onSaved();
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:500,maxHeight:'90vh',overflowY:'auto'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:700}}>{dealer.name}</div>
            {prefillMonth ? (
              <div style={{fontSize:12,color:'#fbbf24',marginTop:2,fontWeight:600}}>
                {prefillMonth} Outstanding: {fmt(typeof prefillAmount === 'number' ? prefillAmount : 0)}
              </div>
            ) : (
              <div style={{fontSize:12,color:'#f87171',marginTop:2}}>
                Outstanding: {fmt(dealer.latestOutstanding)}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
        </div>

        {/* Add new follow-up */}
        <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
            <Plus size={13} color="var(--acc)"/> Add Follow-up / Comment
          </div>

          {/* Date + Amount */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>
                Next Follow-up Date
                <span style={{color:'var(--t3)', fontWeight:400, marginLeft:6, textTransform:'none'}}>
                  (within 7 days)
                </span>
              </label>
              <input
                type="date"
                className="inp"
                value={date}
                min={todayLocal}
                max={maxFollowupDate}
                onChange={e=>setDate(e.target.value)}
                title={`Pick any date between today and ${maxFollowupDate}`}
                style={{width:'100%'}}
              />
            </div>
            <div>
              <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Expected Payment ₹</label>
              <input type="number" className="inp" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
            </div>
          </div>

          {/* Reason dropdown — required. Picking "Others" reveals the
              free-text comment box for a custom note. */}
          <div style={{marginBottom:8}}>
            <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>
              Reason {reason && <span style={{color:'var(--acc)'}}>· {reason}</span>}
            </label>
            <select className="inp" value={reason} onChange={e=>setReason(e.target.value)}
              style={{width:'100%'}}>
              <option value="">— Select reason —</option>
              {FOLLOWUP_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Free-text note — shown ONLY when reason is "Others" */}
          {reason === 'Others' && (
            <div style={{marginBottom:8}}>
              <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>
                Note <span style={{color:'#f87171'}}>*</span>
              </label>
              <VoiceTextarea value={comment} onChange={setComment}
                placeholder="Describe the reason… (tap 🎤 to speak)"
                rows={2}/>
            </div>
          )}

          {err&&<div style={{fontSize:11,color:'#f87171',marginBottom:8}}>{err}</div>}

          {/* Action buttons */}
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={()=>handleAdd('followup')} disabled={saving} className="btnp"
              style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
              {saving?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Calendar size={11}/>}
              Save Follow-up
            </button>
            <button onClick={()=>handleAdd('no-pickup')} disabled={saving} className="btn"
              style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#f87171',border:'1px solid rgba(248,113,113,0.3)'}}>
              <PhoneMissed size={11}/> Did Not Pick Call
            </button>
          </div>
        </div>

        {/* History */}
        <div>
          <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
            History ({mine.length})
          </div>
          {mine.length===0&&(
            <div style={{textAlign:'center',padding:20,color:'var(--t3)',fontSize:12}}>No follow-ups yet</div>
          )}
          {mine.map(f=>{
            const days   = daysUntil(f.followupDate);
            const isDone = f.status==='done';
            const isOver = !isDone && days<0;
            const isNoPickup = f.type==='no-pickup' || f.comment?.startsWith('📵');
            return(
              <div key={f._id} style={{
                padding:'10px 12px',borderRadius:8,marginBottom:8,
                background:isNoPickup?'rgba(248,113,113,0.04)':isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.05)':'var(--bg2)',
                border:`1px solid ${isNoPickup?'rgba(248,113,113,0.15)':isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'var(--b2)'}`,
                opacity:isDone?0.65:1,
              }}>
                <div style={{display:'flex',gap:8,justifyContent:'space-between'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
                      {isNoPickup
                        ? <PhoneMissed size={12} color="#f87171"/>
                        : <Calendar size={12} color={isDone?'#34d399':isOver?'#f87171':'var(--acc)'}/>}
                      <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>
                        {f.followupDate}
                      </span>
                      <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,fontWeight:600,
                        background:isNoPickup?'rgba(248,113,113,0.12)':isDone?'rgba(52,211,153,0.12)':isOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.1)',
                        color:isNoPickup?'#f87171':isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
                        {isNoPickup?'📵 No Pickup':isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
                      </span>
                      {Array.isArray(f.months) && f.months.length > 0 && (
                        f.months.map(m => (
                          <span key={m} style={{
                            fontSize:10, padding:'1px 6px', borderRadius:4, fontWeight:700,
                            background:'rgba(251,191,36,0.14)', color:'#fbbf24',
                          }}>{m}</span>
                        ))
                      )}
                      {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
                    </div>
                    {f.comment&&(
                      <div style={{fontSize:11,color:'var(--t3)',lineHeight:1.5}}>
                        {f.comment.split(' | ').map((part,i)=>(
                          <div key={i} style={{display:'flex',gap:4,alignItems:'flex-start'}}>
                            <MessageSquare size={9} style={{marginTop:2,flexShrink:0}}/>
                            <span>{part}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Payment proof — shown only when collected with a proof */}
                    {f.paymentProof && (
                      <div style={{marginTop:6, display:'flex', alignItems:'center', gap:6}}>
                        <img src={f.paymentProof} alt="payment proof"
                          onClick={()=>setZoomImg(f.paymentProof)}
                          style={{width:46, height:46, objectFit:'cover', borderRadius:6, border:'1px solid #15803d', cursor:'zoom-in'}}/>
                        <span style={{fontSize:9, color:'#34d399', fontWeight:600}}>✓ Payment proof attached</span>
                      </div>
                    )}
                    <div style={{fontSize:9,color:'var(--t3)',marginTop:4}}>
                      {new Date(f.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                  {/* Mark Collected button removed at user request — the
                      Excel re-upload is the canonical way to clear a balance. */}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {zoomImg && (
        <div onClick={()=>setZoomImg('')} style={{
          position:'fixed', inset:0, zIndex:10002, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:24,
        }}>
          <img src={zoomImg} alt="payment proof" style={{maxWidth:'95vw', maxHeight:'92vh', borderRadius:10, boxShadow:'0 30px 60px rgba(0,0,0,0.6)'}}/>
        </div>
      )}
    </div>
  );
}


// ── Inline expanded row with 3 comment boxes + no-pickup ─────────────────────
function ExpandedRow({ d, dealers, onOpenDealer, setActiveDealer, allMonthCols, loadFollowups }) {
  const [notes, setNotes]     = useState(['','','']);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);

  const setNote = (i,v) => setNotes(prev=>{ const a=[...prev]; a[i]=v; return a; });

  const saveNotes = async () => {
    const text = notes.filter(Boolean).join(' | ');
    if(!text) return;
    if(!localStorage.getItem('stp_jwt')){ notify.error('Please log out and log back in to save notes.'); return; }
    setSaving(true);
    try {
      await api.addFollowup({
        dealerName:   d.name,
        salesman:     d.matchedSalesman?.id||'',
        amount:       d.latestOutstanding,
        followupDate: todayStr(),
        comment:      text,
        type:         'comment',
      });
      setNotes(['','','']); setSaved(true);
      setTimeout(()=>setSaved(false), 2000);
      loadFollowups();
    } catch(e){ console.warn(e); }
    setSaving(false);
  };

  const logNoPickup = async () => {
    if(!localStorage.getItem('stp_jwt')){ notify.error('Please log out and log back in.'); return; }
    try {
      await api.addFollowup({
        dealerName:   d.name,
        salesman:     d.matchedSalesman?.id||'',
        amount:       d.latestOutstanding,
        followupDate: todayStr(),
        comment:      '📵 Did not pick call',
        type:         'no-pickup',
      });
      loadFollowups();
    } catch(e){ console.warn(e); }
  };

  return (
    // No spacer/divider — this row continues the dealer row above. Same
    // background, no top border, normal bottom border to separate from the
    // NEXT dealer.
    <tr className="os-expanded-row">
      {/* Single colSpan cell across ALL columns. Setting an explicit width
          on the # column (like the previous 2-cell layout did) caused the
          table to re-compute column widths when the row was expanded, which
          shifted the dealer name to the left. Using one cell with padding-left
          leaves all column widths untouched. */}
      <td colSpan={99} style={{
        background:'var(--bg2)',
        // padding-left aligns content under the Dealer Name column above.
        // Bigger padding (~96px) since the # column + cell padding adds up to
        // roughly that on a standard table layout.
        padding:'4px 10px 8px 96px',
        borderBottom:'1px solid var(--b1)',
        borderLeft:'2px solid var(--acc)',
        overflow:'hidden',
      }}>
        {/* Expanded row is intentionally empty — all actions moved:
            - Dealer name in the row above opens the dealer modal
            - Each month-amount cell opens the Follow-up popup
            We keep the row so the dealer's bottom border still expands when
            clicked, leaving room for future contextual content if needed. */}
      </td>
    </tr>
  );
}

// ── Main Outstanding Component ────────────────────────────────────────────────
export default function Outstanding({ dealers, users, onOpenDealer, currentUser, outstandingData=[], setOutstandingData }) {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [loading,      setLoading]    = useState(false); // don't show loading if data passed from parent
  const [uploading,    setUploading]  = useState(false);
  const [error,        setError]      = useState('');
  const [uploadMsg,    setUploadMsg]  = useState('');
  const [search,       setSearch]     = useState('');
  const [smFilter,     setSmFilter]   = useState([]);
  const [tab,          setTab]        = useState('outstanding');
  const [expanded,     setExpanded]   = useState({});
  const [followups,    setFollowups]  = useState([]);
  const [activeDealer, setActiveDealer] = useState(null);
  // When the popup was opened by clicking a specific month-amount cell, store
  // the month label + amount so the FollowupModal can pre-fill them.
  const [popupContext, setPopupContext] = useState(null); // { month, amount } | null
  const fileRef = useRef();

  useEffect(()=>{ loadFromDB(); loadFollowups(); },[]);

  const loadFollowups = async () => {
    try {
      const data = await api.getFollowups();
      setFollowups(data||[]);
    } catch(e){ console.warn('Followups load failed:',e.message); }
  };

  const loadFromDB = async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('stp_jwt');
      if(token){
        const data = await api.getOutstanding();
        if(data?.length>0){
          if(setOutstandingData) setOutstandingData(dbOutstandingToApp(data));
          setLoading(false);
          return;
        }
      }
      // DB empty — try loading from sheet URL
      const allUsers = Object.values(users);
      const source = allUsers.find(u=>(u.role==='admin'||u.role==='superadmin')&&u.url_outstanding)||allUsers.find(u=>u.url_outstanding);
      if(source?.url_outstanding){
        const csv  = await fetchCSV(source.url_outstanding);
        const rows = parseOutstandingCSV(csv, source.id);
        if(rows.length > 0 && setOutstandingData) setOutstandingData(rows);
      }
    } catch(e){ setError('Load failed: '+e.message); }
    setLoading(false);
  };

  const handleUpload = async (file) => {
    if(!file) return;
    setUploading(true); setUploadMsg(''); setError('');
    try {
      const token = localStorage.getItem('stp_jwt');
      if(!token) throw new Error('Not logged in to server');
      const res = await api.uploadOutstanding(file);
      setUploadMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
      await loadFromDB();
    } catch(e){ setError('Upload failed: '+e.message); }
    setUploading(false);
  };

  // Filter outstanding to only show salesman's dealers when not admin
  const myDealerNames = useMemo(()=>{
    if(isAdmin) return null; // null = show all
    return new Set(dealers.map(d=>d.name.toLowerCase().trim()));
  },[dealers,isAdmin]);

  const filteredOutstanding = useMemo(()=>{
    if(!myDealerNames) return outstandingData; // admin sees all
    return outstandingData.filter(o=>myDealerNames.has(o.name?.toLowerCase().trim()));
  },[outstandingData, myDealerNames]);

  const allMonthCols = useMemo(()=>{
    const cols=new Set();
    filteredOutstanding.forEach(d=>d.monthCols?.forEach(m=>cols.add(m)));
    return [...cols];
  },[filteredOutstanding]);

  const dealerSmMap = useMemo(()=>{
    const map={};
    dealers.forEach(d=>{ if(d.salesman&&users[d.salesman]) map[d.name.toLowerCase().trim()]=users[d.salesman]; });
    return map;
  },[dealers,users]);

  const followupMap = useMemo(()=>{
    const map={};
    followups.forEach(f=>{
      const k=(f.dealerName||'').toLowerCase().trim();
      if(k){ if(!map[k])map[k]=[]; map[k].push(f); }
    });
    return map;
  },[followups]);

  const filtered = useMemo(()=>{
    // Today as a YYYY-MM-DD string in local time, e.g. "2026-06-01"
    const todayStrLocal = (() => {
      const t = new Date();
      return t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0');
    })();
    const todayMs = new Date(todayStrLocal + 'T00:00:00').getTime();

    let d=filteredOutstanding.map(x=>{
      const nameKey = x.name.toLowerCase().trim();
      // Try exact match first, then partial match for name variations
      const dFu = followupMap[nameKey] ||
        Object.entries(followupMap).find(([k])=>k.includes(nameKey)||nameKey.includes(k))?.[1] || [];

      // ── Compute a sort bucket for this dealer ───────────────────────
      // Bucket 0 (TOP):    has any follow-up dated EXACTLY TODAY
      // Bucket 1:          has overdue follow-ups (date < today) — most recent overdue first
      // Bucket 2:          has upcoming follow-ups (date > today) — closest future first
      // Bucket 3 (BOTTOM): no follow-up records at all
      //
      // Within a bucket we use a secondary timestamp for ordering:
      //   - Bucket 0: most-recent createdAt first (newest activity today on top)
      //   - Bucket 1: most-recent past date (smallest "days overdue")
      //   - Bucket 2: closest future date (smallest "days until")
      //   - Bucket 3: largest outstanding amount first
      let bucket = 3;       // default: no follow-up
      let sortKey = 0;       // smaller = higher within the bucket
      let mostRecentToday = -Infinity;
      let mostRecentPast  = -Infinity;
      let closestFuture   = Infinity;

      for(const f of dFu){
        if(!f.followupDate) continue;
        // followupDate is 'YYYY-MM-DD'
        const fDateMs = new Date(f.followupDate + 'T00:00:00').getTime();
        if(isNaN(fDateMs)) continue;
        if(f.followupDate === todayStrLocal){
          // TODAY — use createdAt for tie-breaking (latest entry of today on top)
          const cMs = new Date(f.createdAt || f.updatedAt || todayMs).getTime();
          if(cMs > mostRecentToday) mostRecentToday = cMs;
        } else if(fDateMs < todayMs){
          if(fDateMs > mostRecentPast) mostRecentPast = fDateMs;
        } else {
          if(fDateMs < closestFuture)  closestFuture  = fDateMs;
        }
      }

      if(mostRecentToday > -Infinity){
        bucket = 0; sortKey = -mostRecentToday;  // negative so larger createdAt → higher
      } else if(mostRecentPast > -Infinity){
        bucket = 1; sortKey = -mostRecentPast;   // negative so most-recent past → higher
      } else if(closestFuture < Infinity){
        bucket = 2; sortKey = closestFuture;     // positive so soonest future → higher
      }

      return {
        ...x,
        matchedSalesman: dealerSmMap[nameKey]||null,
        dealerFollowups: dFu,
        _bucket: bucket,
        _sortKey: sortKey,
      };
    });
    if(tab==='outstanding') d=d.filter(x=>x.latestOutstanding>0);
    if(tab==='cleared')     d=d.filter(x=>x.latestOutstanding===0);
    if(tab==='followups')   d=d.filter(x=>x.dealerFollowups.some(f=>f.status==='pending'));
    if(search) d=d.filter(x=>x.name.toLowerCase().includes(search.toLowerCase()));
    if(isAdmin&&smFilter.length>0) d=d.filter(x=>x.matchedSalesman&&smFilter.includes(x.matchedSalesman.id));

    d.sort((a, b) => {
      // First by bucket (0 → top, 3 → bottom)
      if(a._bucket !== b._bucket) return a._bucket - b._bucket;
      // Then by sortKey within the same bucket
      if(a._sortKey !== b._sortKey) return a._sortKey - b._sortKey;
      // Last tiebreaker: bigger outstanding first
      return (b.latestOutstanding || 0) - (a.latestOutstanding || 0);
    });

    // DEBUG: print the top 8 dealers and their bucket assignments so we can
    // verify the sort is doing what we expect. Bucket 0=TODAY, 1=overdue,
    // 2=future, 3=no follow-up. Comment out if too noisy.
    console.log('[Outstanding sort] today =', todayStrLocal, '— top 8:',
      d.slice(0, 8).map(x => ({
        name: x.name,
        bucket: x._bucket,
        followups: (x.dealerFollowups || []).map(f => f.followupDate).filter(Boolean),
      }))
    );

    return d;
  },[outstandingData,dealerSmMap,followupMap,tab,search,smFilter,isAdmin]);

  const totalOut       = filtered.reduce((s,d)=>s+d.latestOutstanding,0);
  const countOut       = filteredOutstanding.filter(d=>d.latestOutstanding>0).length;
  const countCleared   = filteredOutstanding.filter(d=>d.latestOutstanding===0).length;
  const pendingFu      = followups.filter(f=>f.status==='pending');
  const overdueFu      = pendingFu.filter(f=>daysUntil(f.followupDate)<0);
  const smOptions      = Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id);
  // Accordion: only ONE row open at a time. Clicking the same row again closes
  // it; clicking a different row closes the previous and opens the new one.
  const toggle         = id=>setExpanded(e=>(e[id] ? {} : { [id]: true }));

  return (
    <div className="fade">
      {/* Scoped CSS to make the expanded row feel continuous with its dealer
          row above (no horizontal divider between them). */}
      <style>{`
        tr.os-row-open > td {
          border-bottom: 0 !important;
        }
        tr.os-expanded-row > td {
          border-top: 0 !important;
        }
      `}</style>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Payments</div>
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
          <div style={{fontSize:22,fontWeight:700}}>Outstanding</div>
          {overdueFu.length>0&&(
            <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(248,113,113,0.12)',border:'1px solid rgba(248,113,113,0.3)',borderRadius:6,padding:'3px 10px'}}>
              <Bell size={12} color="#f87171"/>
              <span style={{fontSize:11,color:'#f87171',fontWeight:600}}>{overdueFu.length} overdue</span>
            </div>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
        {isAdmin&&<>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
            onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
          <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
            <Upload size={13}/>{uploading?'Uploading...':'Upload Outstanding'}
          </button>
          <button onClick={async () => {
            // One-time clean-slate wipe of every follow-up so the user can
            // start fresh under the new month-tagged scheme. Outstanding
            // amounts are NOT touched.
            const ok = await confirmDialog({
              title: 'Wipe ALL follow-up history?',
              message:
                'This deletes every comment, "Did not pick", scheduled follow-up, ' +
                'and payment-collected entry for every dealer.\n\n' +
                'Outstanding amounts and all other data are NOT touched. Use this ' +
                'to start fresh now that follow-ups can be tagged by month.\n\n' +
                'This cannot be undone.',
              confirmText: 'Yes, wipe all follow-ups',
              danger: true,
            });
            if (!ok) return;
            try {
              const r = await api.wipeAllFollowups();
              setUploadMsg(`✓ Wiped ${r.deletedCount || 0} follow-up record${r.deletedCount===1?'':'s'}.`);
              await loadFollowups();
            } catch(e) {
              setError('Wipe failed: ' + e.message);
            }
          }} style={{
            display:'flex', alignItems:'center', gap:6,
            background:'transparent', color:'#fca5a5',
            border:'1px solid rgba(248,113,113,0.4)',
            padding:'8px 12px', borderRadius:6, fontSize:12, fontWeight:600,
            cursor:'pointer',
          }}>
            <Trash2 size={12}/> Wipe all follow-up history
          </button>
          <button onClick={() => {
            // Build sample CSV in the exact format the upload route expects:
            //   first column = "Dealer Name", remaining columns = months
            //   from the current MO list (each column gets a sample amount).
            const months = (allMonthCols && allMonthCols.length > 0)
              ? allMonthCols
              : ['Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26'];
            const headers = ['Dealer Name', ...months];
            const sampleRows = [
              ['AADINATH PLYWOOD AND HARDWARE', ...months.map((_,i) => [36000, 100625, 169650, 200000, 185000, 170000, 155000, 140000, 120000, 100000, 80000][i] || 50000)],
              ['BHATTAD PLYWOODS',              ...months.map((_,i) => [25000,  60000,  90000, 110000, 100000,  95000,  80000,  70000,  60000,  50000, 30000][i] || 40000)],
              ['YOUR DEALER NAME HERE',         ...months.map(() => 0)],
            ];
            const escape = v => '"' + String(v ?? '').replace(/"/g,'""') + '"';
            const csv = [headers, ...sampleRows].map(r => r.map(escape).join(',')).join('\n');
            const a = document.createElement('a');
            a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
            a.download = 'Outstanding_Template.csv';
            a.click();
          }}
            className="btn"
            style={{display:'flex',alignItems:'center',gap:6,color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.4)'}}>
            <Download size={13}/> Download Sample
          </button>
        </>}
        <button onClick={()=>{loadFromDB();loadFollowups();}} disabled={loading} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
          <RefreshCw size={13} className={loading?'spin':''}/>{loading?'Loading...':'Refresh'}
        </button>
        {filteredOutstanding.length>0&&<span style={{fontSize:12,color:'var(--t3)'}}>{filteredOutstanding.length} dealers</span>}
        {uploadMsg&&<span style={{fontSize:11,color:'#34d399',fontWeight:600}}>{uploadMsg}</span>}
        {error&&<span style={{fontSize:11,color:'#f87171'}}>{error}</span>}
      </div>

      {/* KPI */}
      {filteredOutstanding.length>0&&(
        <div className="stat-grid" style={{marginBottom:14}}>
          {[
            {l:'Total Outstanding', v:fmt(totalOut),       c:'#f87171'},
            {l:'Dealers with Due',  v:countOut,            c:'#fbbf24'},
            {l:'Cleared',           v:countCleared,        c:'#34d399'},
            {l:'Pending Follow-ups',v:pendingFu.length,    c:'var(--acc)'},
          ].map(k=>(
            <div key={k.l} className="stat-card">
              <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
              <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Month summary */}
      {allMonthCols.length>0&&(
        <div className="card" style={{marginBottom:14,padding:0,overflow:'hidden'}}>
          <div style={{padding:'12px 14px',borderBottom:'1px solid var(--b1)',fontSize:12,fontWeight:600}}>Month-wise Summary</div>
          <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr>
                <th>Month</th><th style={{textAlign:'right'}}>Total</th>
                <th style={{textAlign:'right'}}>Dealers Due</th><th style={{textAlign:'right'}}>Change</th>
              </tr></thead>
              <tbody>
                {allMonthCols.map((month,mi)=>{
                  const vals=filteredOutstanding.map(d=>d.monthlyOutstanding[month]||0);
                  const total=vals.reduce((a,b)=>a+b,0);
                  const due=vals.filter(v=>v>0).length;
                  const prev=mi>0?filteredOutstanding.map(d=>d.monthlyOutstanding[allMonthCols[mi-1]]||0).reduce((a,b)=>a+b,0):0;
                  const chg=mi>0?total-prev:0;
                  return(<tr key={month}>
                    <td style={{fontWeight:600}}>{month}</td>
                    <td style={{textAlign:'right',fontWeight:700,color:total>0?'#f87171':'#34d399'}}>{fmt(total)}</td>
                    <td style={{textAlign:'right'}}>{due}</td>
                    <td style={{textAlign:'right',color:chg>0?'#f87171':chg<0?'#34d399':'var(--t3)',fontWeight:600}}>
                      {chg!==0?(chg>0?'▲':'▼')+'₹'+Number(Math.abs(chg)).toLocaleString('en-IN'):'—'}
                    </td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dealer list */}
      {filteredOutstanding.length>0&&(<>
        <div className="tabs">
          {[
            {id:'outstanding',label:`Due (${countOut})`},
            {id:'cleared',    label:`Cleared (${countCleared})`},
            {id:'followups',  label:`Follow-ups (${pendingFu.length})`,badge:overdueFu.length},
            {id:'all',        label:`All (${filteredOutstanding.length})`},
          ].map(t=>(
            <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)} style={{position:'relative'}}>
              {t.label}
              {t.badge>0&&<span style={{position:'absolute',top:-4,right:-4,width:14,height:14,background:'#f87171',borderRadius:'50%',fontSize:8,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}>{t.badge}</span>}
            </button>
          ))}
        </div>

        <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
          <div style={{position:'relative'}}>
            <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
            <input className="inp" style={{width:200,paddingLeft:30,fontSize:12}} placeholder="Search dealer..."
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          {isAdmin&&<MultiSelect options={smOptions} selected={smFilter} onChange={setSmFilter} placeholder="All Salesmen"
            renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={16}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
          {(search||smFilter.length>0)&&<button onClick={()=>{setSearch('');setSmFilter([]);}} className="btn" style={{fontSize:11,color:'var(--red)'}}><X size={11}/> Clear</button>}
          <div style={{flex:1}}/><span style={{fontSize:12,color:'var(--t3)'}}>{filtered.length} dealers · {fmt(totalOut)}</span>
        </div>

        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div style={{overflowX:'auto',maxHeight:'60vh',overflowY:'auto'}}>
            <table>
              <thead><tr>
                <th>#</th><th>Dealer</th>
                {allMonthCols.map(m=><th key={m} style={{textAlign:'right'}}>{m}</th>)}
                <th style={{textAlign:'center'}}>Follow-up</th>
              </tr></thead>
              <tbody>
                {filtered.map((d,i)=>{
                  const isOpen  = expanded[d.id];
                  const cleared = d.latestOutstanding===0;
                  const dFu     = d.dealerFollowups.filter(f=>f.status==='pending');
                  const nextFu  = [...dFu].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate))[0];
                  const fuDays  = nextFu ? daysUntil(nextFu.followupDate) : null;
                  const fuOver  = fuDays!==null && fuDays<0;
                  const noPickups = d.dealerFollowups.filter(f=>f.type==='no-pickup'||f.comment?.startsWith('📵'));
                  const latestNP = noPickups[noPickups.length-1];

                  return(
                    <React.Fragment key={d.id}>
                      <tr
                        style={{
                          background: cleared ? 'rgba(52,211,153,0.03)' : 'transparent',
                        }}
                        // Row click no longer toggles an empty expanded panel.
                        // All actions live on the row itself (dealer name +
                        // amount cells).
                        className="os-row"
                      >
                        <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
                        <td style={{maxWidth:220}}>
                          {/* Dealer name — click to open the dealer modal.
                              Stop propagation so the row's accordion toggle
                              doesn't also fire. */}
                          <div
                            onClick={(e)=>{
                              e.stopPropagation();
                              const dl = dealers.find(x => x.name.toUpperCase().trim() === d.name.toUpperCase().trim());
                              if(dl) onOpenDealer(dl.id);
                            }}
                            title="Open dealer details"
                            style={{
                              fontWeight:600, color:'var(--t1)',
                              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                              cursor:'pointer',
                            }}>
                            {d.name}
                          </div>
                          {/* CLEARED badge only — salesman badge moved into
                              the latest-comment chip (right of the date). */}
                          {cleared && (
                            <div style={{display:'flex',gap:4,marginTop:2,alignItems:'center',flexWrap:'wrap'}}>
                              <span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:3}}>CLEARED</span>
                            </div>
                          )}
                          {/* Latest comment / no-pickup — clearly visible */}
                          {(()=>{
                            const allFu = [...d.dealerFollowups].sort((a,b)=>{ const ta=new Date(b.createdAt||b.updatedAt||0); const tb=new Date(a.createdAt||a.updatedAt||0); return ta-tb; });
                            const latest = allFu[0];
                            if(!latest) return null;
                            const isNP  = latest.type==='no-pickup'||latest.comment?.startsWith('📵');
                            const isFollowup = latest.type==='followup';
                            const isComment = !isNP && !isFollowup;
                            const txt = (latest.comment||'').replace('📵 Did not pick call','').replace(/^\s*[|—]\s*/,'').trim();
                            return(
                              <div style={{marginTop:4, display:'flex', alignItems:'center', gap:8, maxWidth:340}}>
                                {/* Chip — single line, fixed height. The
                                    comment text sits INSIDE this chip on the
                                    same line as the icon/date, with ellipsis
                                    so adding more comment never grows the
                                    chip's height. */}
                                <div style={{
                                  padding:'3px 6px', borderRadius:5,
                                  display:'inline-flex', alignItems:'center', gap:6,
                                  background:isNP?'rgba(248,113,113,0.1)':isComment?'rgba(99,102,241,0.08)':'rgba(52,211,153,0.07)',
                                  border:`1px solid ${isNP?'rgba(248,113,113,0.25)':isComment?'rgba(99,102,241,0.2)':'rgba(52,211,153,0.2)'}`,
                                  minWidth:0,        // so flex child can shrink
                                  overflow:'hidden',
                                  flex:'0 1 auto',
                                }}>
                                  {isNP
                                    ? <><PhoneMissed size={10} color="#f87171" style={{flexShrink:0}}/><span style={{fontSize:10,color:'#f87171',fontWeight:600,whiteSpace:'nowrap'}}>Did not pick call</span></>
                                    : isFollowup
                                    ? <><Calendar size={10} color="#34d399" style={{flexShrink:0}}/><span style={{fontSize:10,color:'#34d399',fontWeight:600,whiteSpace:'nowrap'}}>Follow-up: {latest.followupDate}</span></>
                                    : <><MessageSquare size={10} color="var(--acc)" style={{flexShrink:0}}/><span style={{fontSize:10,color:'var(--acc)',fontWeight:600,whiteSpace:'nowrap'}}>Note</span></>}
                                  <span style={{fontSize:9,color:'var(--t3)',whiteSpace:'nowrap',flexShrink:0}}>
                                    {latest.createdAt ? new Date(latest.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : ''}
                                  </span>
                                  {txt && (
                                    <span style={{
                                      fontSize:10, color:'var(--t2)',
                                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                                      minWidth:0,
                                    }}>· {txt}</span>
                                  )}
                                </div>

                                {/* Salesman badge OUTSIDE the chip — no
                                    border, sits to the right. */}
                                {d.matchedSalesman && (
                                  <span style={{
                                    display:'inline-flex', alignItems:'center', gap:3,
                                    fontSize:9, color:d.matchedSalesman.color, fontWeight:600,
                                    flexShrink:0, whiteSpace:'nowrap',
                                  }}>
                                    <Avatar user={d.matchedSalesman} size={12}/>
                                    {d.matchedSalesman.name}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                          {/* If there are NO follow-ups yet, still show the
                              salesman badge under the name so admins can see
                              who owns each dealer. */}
                          {(!d.dealerFollowups || d.dealerFollowups.length === 0) && d.matchedSalesman && (
                            <div style={{marginTop:4,display:'flex',alignItems:'center',gap:3}}>
                              <Avatar user={d.matchedSalesman} size={12}/>
                              <span style={{fontSize:9,color:d.matchedSalesman.color,fontWeight:600}}>{d.matchedSalesman.name}</span>
                            </div>
                          )}
                        </td>
                        {allMonthCols.map(m=>{
                          const v=d.monthlyOutstanding[m]||0;
                          const mi2=allMonthCols.indexOf(m);
                          const prev=mi2>0?d.monthlyOutstanding[allMonthCols[mi2-1]]||0:v;
                          return(
                            <td
                              key={m}
                              onClick={(e)=>{
                                e.stopPropagation();
                                setPopupContext({ month: m, amount: v });
                                setActiveDealer(d);
                              }}
                              title={v>0 ? `Open follow-up for ${m} (₹${v.toLocaleString('en-IN')})` : `Open follow-up for ${m}`}
                              style={{
                                textAlign:'right',
                                color:v===0?'#34d399':v>prev&&mi2>0?'#f87171':'#fbbf24',
                                fontWeight:v>0?600:400, fontSize:12,
                                cursor:'pointer',
                              }}
                              onMouseEnter={e=>{ e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; }}
                              onMouseLeave={e=>{ e.currentTarget.style.background = 'transparent'; }}>
                              {v>0?fmt(v):'—'}
                            </td>
                          );
                        })}
                        <td style={{textAlign:'center'}} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>setActiveDealer(d)} style={{
                            padding:'4px 8px',borderRadius:6,fontSize:10,cursor:'pointer',
                            background:nextFu?(fuOver?'rgba(248,113,113,0.12)':'rgba(99,102,241,0.12)'):'transparent',
                            border:nextFu?(fuOver?'1px solid #f87171':'1px solid var(--acc)'):'1px solid var(--b2)',
                            color:nextFu?(fuOver?'#f87171':'var(--acc)'):'var(--t3)',
                            display:'flex',alignItems:'center',gap:4,margin:'0 auto',
                          }}>
                            <Calendar size={10}/>
                            {nextFu?(fuOver?`${Math.abs(fuDays)}d over`:fuDays===0?'Today':`${fuDays}d`):<Plus size={10}/>}
                          </button>
                          {nextFu?.comment&&(
                            <div style={{fontSize:8,color:'var(--t3)',marginTop:2,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'center'}}>
                              {nextFu.comment.split(' | ')[0]}
                            </div>
                          )}
                        </td>
                      </tr>
                      {/* Row no longer expands — dealer name + amount cells handle all actions */}
                    </React.Fragment>
                  );
                })}
                {filtered.length===0&&<tr><td colSpan={99} style={{textAlign:'center',padding:30,color:'var(--t3)'}}>No records</td></tr>}
              </tbody>
              <tfoot><tr>
                <td colSpan={2} style={{fontWeight:700}}>TOTAL</td>
                {allMonthCols.map(m=>{
                  const t=filtered.reduce((s,d)=>s+(d.monthlyOutstanding[m]||0),0);
                  return<td key={m} style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{t>0?fmt(t):'—'}</td>;
                })}
                <td style={{textAlign:'right',fontWeight:700,color:'#f87171'}}>{fmt(filtered.reduce((s,d)=>s+d.latestOutstanding,0))}</td>
                <td/><td/>
              </tr></tfoot>
            </table>
          </div>
        </div>
      </>)}

      {activeDealer&&(
        <FollowupModal
          dealer={activeDealer}
          existingFollowups={followups}
          currentUser={currentUser}
          prefillMonth={popupContext?.month}
          prefillAmount={popupContext?.amount}
          onClose={()=>{ setActiveDealer(null); setPopupContext(null); }}
          onSaved={loadFollowups}
        />
      )}
    </div>
  );
}