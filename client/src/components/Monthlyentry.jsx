// import React, { useState, useMemo } from 'react';
// import { Save, Search, ChevronDown, CheckCircle, Edit3, Filter, AlertCircle } from 'lucide-react';
// import { useMonth } from '../context';
// import { MO as MO_DEFAULT } from '../constants';
// import { num, pct, spct, pclr } from '../utils';
// import { api } from '../api';
// import { Avatar } from './UI';

// const STATUSES = ['STAR','ACTIVE','KEY ACCOUNT','ACHIVERS','REACTIVE','INACTIVE','DEAD','NEW','PROSPECT'];

// export default function MonthlyEntry({ dealers, users, currentUser, onUpdateDealer }) {
//   const { MO:ctxMO, currentMonthIdx } = useMonth();
//   const MO = ctxMO || MO_DEFAULT;

//   const isAdmin = currentUser?.role === 'admin';
//   const [month, setMonth]       = useState(MO[currentMonthIdx] || MO[MO.length-1]);
//   const [salesman, setSalesman] = useState(isAdmin ? 'all' : currentUser?.id || '');
//   const [search, setSearch]     = useState('');
//   const [changes, setChanges]   = useState({}); // { dealerId: { achieved, target, status } }
//   const [saving, setSaving]     = useState(false);
//   const [saved, setSaved]       = useState(false);
//   const [errors, setErrors]     = useState([]);

//   const moIdx = MO.indexOf(month);
//   const salesmen = Object.values(users).filter(u => u.role === 'salesman');

//   const filtered = useMemo(() => {
//     let d = dealers;
//     if(salesman !== 'all') d = d.filter(x => x.salesman === salesman);
//     if(search) d = d.filter(x =>
//       x.name.toLowerCase().includes(search.toLowerCase()) ||
//       (x.city||'').toLowerCase().includes(search.toLowerCase())
//     );
//     return [...d].sort((a,b) => a.name.localeCompare(b.name));
//   }, [dealers, salesman, search]);

//   const getVal = (dealerId, field) => {
//     if(changes[dealerId]?.[field] !== undefined) return changes[dealerId][field];
//     const d = dealers.find(x => x.id === dealerId);
//     if(!d) return field === 'status' ? 'ACTIVE' : 0;
//     if(field === 'achieved') return moIdx >= 0 ? (d.months[moIdx] || 0) : 0;
//     if(field === 'target')   return moIdx >= 0 ? (d.monthTargets?.[moIdx] ?? d.target ?? 0) : (d.target || 0);
//     if(field === 'status')   return d.status || 'ACTIVE';
//     return '';
//   };

//   const setVal = (dealerId, field, value) => {
//     setChanges(prev => ({ ...prev, [dealerId]: { ...prev[dealerId], [field]: value } }));
//     setSaved(false);
//   };

//   const changedCount = Object.keys(changes).length;

//   const saveAll = async () => {
//     if(!changedCount) return;
//     setSaving(true); setErrors([]); setSaved(false);

//     const errs = [];
//     let ok = 0;
//     const token = localStorage.getItem('stp_jwt');

//     if(!token) {
//       setErrors(['Not connected to server. Start server and re-login to save data to database.']);
//       setSaving(false);
//       return;
//     }

//     for(const [dealerId, vals] of Object.entries(changes)) {
//       const dealer = dealers.find(d => d.id === dealerId);
//       if(!dealer) continue;

//       // Build updated months array
//       const newMonths = [...(dealer.months || new Array(MO.length).fill(0))];
//       // Extend if needed
//       while(newMonths.length < MO.length) newMonths.push(0);

//       if(moIdx >= 0 && vals.achieved !== undefined) newMonths[moIdx] = num(vals.achieved);

//       const newTargets = { ...(dealer.monthTargets || {}) };
//       if(moIdx >= 0 && vals.target !== undefined) newTargets[moIdx] = num(vals.target);

//       const newStatus = vals.status || dealer.status;

//       // Update local state immediately
//       onUpdateDealer(dealerId, {
//         months: newMonths,
//         monthTargets: newTargets,
//         status: newStatus,
//         achieved: moIdx >= 0 ? newMonths[moIdx] : dealer.achieved,
//       });

//       // Save to DB
//       try {
//         const updatePayload = {};

//         // Monthly data
//         if(moIdx >= 0 && (vals.achieved !== undefined || vals.target !== undefined)) {
//           updatePayload[`monthlyData.${month}`] = {
//             achieved: num(vals.achieved ?? newMonths[moIdx]),
//             target:   num(vals.target   ?? newTargets[moIdx] ?? dealer.target ?? 0),
//           };
//         }

//         // Status
//         if(vals.status !== undefined) updatePayload.status = vals.status;

//         if(Object.keys(updatePayload).length > 0) {
//           await api.updateDealer(dealerId, updatePayload);
//         }
//         ok++;
//       } catch(e) {
//         errs.push(`${dealer.name}: ${e.message}`);
//       }
//     }

//     setErrors(errs);
//     setSaved(true);
//     setChanges({});
//     setSaving(false);
//   };

//   return (
//     <div className="fade">
//       <div style={{marginBottom:16}}>
//         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Data Entry</div>
//         <div style={{fontSize:22,fontWeight:700}}>Monthly Entry</div>
//         <div style={{fontSize:13,color:'var(--t3)',marginTop:4}}>Enter or update target, achieved & status for any month inline.</div>
//       </div>

//       {/* Controls */}
//       <div className="card" style={{marginBottom:14}}>
//         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:changedCount>0||saved?14:0}}>
//           <div>
//             <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Month</label>
//             <div style={{position:'relative'}}>
//               <select className="inp" value={month} onChange={e=>{setMonth(e.target.value);setChanges({});setSaved(false);}} style={{width:'100%',paddingRight:28,appearance:'none'}}>
//                 {[...MO].reverse().map(m=>(
//                   <option key={m} value={m}>{m}{m===MO[currentMonthIdx]?' ← current':''}</option>
//                 ))}
//               </select>
//               <ChevronDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
//             </div>
//           </div>

//           {isAdmin&&(
//             <div>
//               <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Salesman</label>
//               <div style={{position:'relative'}}>
//                 <select className="inp" value={salesman} onChange={e=>setSalesman(e.target.value)} style={{width:'100%',paddingRight:28,appearance:'none'}}>
//                   <option value="all">All Salesmen</option>
//                   {salesmen.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
//                 </select>
//                 <ChevronDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
//               </div>
//             </div>
//           )}

//           <div>
//             <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Search</label>
//             <div style={{position:'relative'}}>
//               <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//               <input className="inp" style={{paddingLeft:28,width:'100%'}} placeholder="Name or city..." value={search} onChange={e=>setSearch(e.target.value)}/>
//             </div>
//           </div>
//         </div>

//         {moIdx < 0 && month && (
//           <div style={{padding:'8px 12px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:8,fontSize:12,color:'#fbbf24',marginBottom:12}}>
//             ⚠ "{month}" not in month list. Go to Admin Panel → Month Settings → Add Month first.
//           </div>
//         )}

//         {changedCount > 0 && (
//           <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'rgba(99,102,241,0.08)',borderRadius:8,border:'1px solid rgba(99,102,241,0.2)',flexWrap:'wrap'}}>
//             <Edit3 size={14} color="var(--acc)"/>
//             <span style={{fontSize:13,fontWeight:600,color:'var(--acc)'}}>{changedCount} dealer{changedCount>1?'s':''} modified</span>
//             <div style={{flex:1}}/>
//             <button onClick={()=>{setChanges({});setSaved(false);}} className="btn" style={{fontSize:12}}>Discard</button>
//             <button onClick={saveAll} disabled={saving} className="btnp" style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
//               {saving ? <><div style={{width:11,height:11,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Saving...</> : <><Save size={12}/> Save {changedCount} Changes</>}
//             </button>
//           </div>
//         )}

//         {saved && !changedCount && (
//           <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'rgba(52,211,153,0.08)',borderRadius:8,border:'1px solid rgba(52,211,153,0.2)'}}>
//             <CheckCircle size={14} color="#34d399"/>
//             <span style={{fontSize:12,color:'#34d399',fontWeight:600}}>Saved to database ✓</span>
//           </div>
//         )}

//         {errors.length > 0 && (
//           <div style={{padding:'8px 12px',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:8,marginTop:8}}>
//             <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><AlertCircle size={13} color="#f87171"/><span style={{fontSize:12,fontWeight:600,color:'#f87171'}}>Some errors:</span></div>
//             {errors.map((e,i)=><div key={i} style={{fontSize:11,color:'#f87171'}}>· {e}</div>)}
//           </div>
//         )}
//       </div>

//       {/* Table */}
//       <div className="card" style={{padding:0,overflow:'hidden'}}>
//         <div style={{padding:'10px 14px',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
//           <Filter size={13} color="var(--t3)"/>
//           <span style={{fontSize:12,fontWeight:600,color:'var(--t2)'}}>{filtered.length} dealers — {month}</span>
//           <span style={{fontSize:11,color:'var(--t3)'}}>Click any cell to edit</span>
//         </div>
//         <div style={{overflowX:'auto',maxHeight:'65vh',overflowY:'auto'}}>
//           <table>
//             <thead>
//               <tr>
//                 <th>Dealer</th>
//                 {isAdmin&&<th>Salesman</th>}
//                 <th>City</th>
//                 <th style={{textAlign:'right',color:'var(--acc)',background:'rgba(99,102,241,.06)'}}>Target</th>
//                 <th style={{textAlign:'right',color:'#34d399',background:'rgba(52,211,153,.06)'}}>Achieved</th>
//                 <th style={{textAlign:'right'}}>Ach%</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map(dealer => {
//                 const changed  = !!changes[dealer.id];
//                 const achieved = num(getVal(dealer.id, 'achieved'));
//                 const target   = num(getVal(dealer.id, 'target'));
//                 const status   = getVal(dealer.id, 'status');
//                 const achPct   = pct(target, achieved);
//                 const sm       = users[dealer.salesman];
//                 return (
//                   <tr key={dealer.id} style={{
//                     background: changed ? 'rgba(99,102,241,0.04)' : 'transparent',
//                     borderLeft: `3px solid ${changed ? 'var(--acc)' : 'transparent'}`,
//                   }}>
//                     <td style={{maxWidth:180}}>
//                       <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dealer.name}</div>
//                       {(dealer.category||dealer.categoryType)&&(
//                         <div style={{fontSize:9,color:'#818cf8'}}>{dealer.category}{dealer.categoryType?` · ${dealer.categoryType}`:''}</div>
//                       )}
//                     </td>
//                     {isAdmin&&<td>{sm&&<div style={{display:'flex',alignItems:'center',gap:4}}><Avatar user={sm} size={15}/><span style={{fontSize:11}}>{sm.name}</span></div>}</td>}
//                     <td style={{fontSize:11,color:'var(--t3)'}}>{dealer.city||'—'}</td>

//                     {/* Target - editable */}
//                     <td style={{background:'rgba(99,102,241,.04)',padding:'4px 8px'}}>
//                       <input type="number" min="0" value={getVal(dealer.id,'target')}
//                         onChange={e=>setVal(dealer.id,'target',e.target.value)}
//                         style={{width:'100%',minWidth:70,textAlign:'right',background:'transparent',border:'none',
//                           borderBottom:`1px solid ${changes[dealer.id]?.target!==undefined?'var(--acc)':'var(--b2)'}`,
//                           color:'var(--t1)',fontSize:13,fontWeight:600,padding:'2px 0',outline:'none'}}/>
//                     </td>

//                     {/* Achieved - editable */}
//                     <td style={{background:'rgba(52,211,153,.04)',padding:'4px 8px'}}>
//                       <input type="number" min="0" value={getVal(dealer.id,'achieved')}
//                         onChange={e=>setVal(dealer.id,'achieved',e.target.value)}
//                         style={{width:'100%',minWidth:70,textAlign:'right',background:'transparent',border:'none',
//                           borderBottom:`1px solid ${changes[dealer.id]?.achieved!==undefined?'#34d399':'var(--b2)'}`,
//                           color:'#34d399',fontSize:13,fontWeight:700,padding:'2px 0',outline:'none'}}/>
//                     </td>

//                     <td style={{textAlign:'right',fontWeight:700,color:pclr(achPct),fontSize:12,whiteSpace:'nowrap'}}>
//                       {target>0 ? spct(target,achieved) : '—'}
//                     </td>

//                     {/* Status - editable */}
//                     <td style={{padding:'4px 8px'}}>
//                       <select value={status} onChange={e=>setVal(dealer.id,'status',e.target.value)}
//                         style={{background:'transparent',border:'none',
//                           borderBottom:`1px solid ${changes[dealer.id]?.status!==undefined?'var(--acc)':'var(--b2)'}`,
//                           color:'var(--t2)',fontSize:11,padding:'2px 0',outline:'none',cursor:'pointer',width:'100%'}}>
//                         {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
//                       </select>
//                     </td>
//                   </tr>
//                 );
//               })}
//               {filtered.length===0&&(
//                 <tr><td colSpan={isAdmin?7:6} style={{textAlign:'center',padding:40,color:'var(--t3)'}}>No dealers found</td></tr>
//               )}
//             </tbody>
//             {filtered.length>0&&(
//               <tfoot>
//                 <tr>
//                   <td colSpan={isAdmin?3:2} style={{fontWeight:700}}>TOTAL ({filtered.length})</td>
//                   <td style={{textAlign:'right',fontWeight:700,color:'var(--acc)',background:'rgba(99,102,241,.04)'}}>
//                     {filtered.reduce((s,d)=>s+num(getVal(d.id,'target')),0).toLocaleString('en-IN')}
//                   </td>
//                   <td style={{textAlign:'right',fontWeight:700,color:'#34d399',background:'rgba(52,211,153,.04)'}}>
//                     {filtered.reduce((s,d)=>s+num(getVal(d.id,'achieved')),0).toLocaleString('en-IN')}
//                   </td>
//                   <td style={{textAlign:'right',fontWeight:700,color:'var(--t2)'}}>
//                     {(()=>{
//                       const t=filtered.reduce((s,d)=>s+num(getVal(d.id,'target')),0);
//                       const a=filtered.reduce((s,d)=>s+num(getVal(d.id,'achieved')),0);
//                       return t>0?spct(t,a):'—';
//                     })()}
//                   </td>
//                   <td/>
//                 </tr>
//               </tfoot>
//             )}
//           </table>
//         </div>
//       </div>

//       <div style={{marginTop:10,fontSize:11,color:'var(--t3)'}}>
//         💡 Click any Target, Achieved or Status cell → edit → <strong>Save Changes</strong> saves all to MongoDB.
//         Purple highlight = unsaved change.
//       </div>
//     </div>
//   );
// }

// import React, { useState, useMemo } from 'react';
// import { Save, Search, ChevronDown, CheckCircle, Edit3, Filter, AlertCircle } from 'lucide-react';
// import { useMonth } from '../context';
// import { MO as MO_DEFAULT } from '../constants';
// import { num, pct, spct, pclr } from '../utils';
// import { api } from '../api';
// import { Avatar } from './UI';

// const STATUSES = ['STAR','ACTIVE','KEY ACCOUNT','ACHIVERS','REACTIVE','INACTIVE','DEAD','NEW','PROSPECT'];

// export default function MonthlyEntry({ dealers, users, currentUser, onUpdateDealer }) {
//   const { MO:ctxMO, currentMonthIdx } = useMonth();
//   const MO = ctxMO || MO_DEFAULT;

//   const isAdmin = currentUser?.role === 'admin';
//   const [month, setMonth]       = useState(MO[currentMonthIdx] || MO[MO.length-1]);
//   const [salesman, setSalesman] = useState(isAdmin ? 'all' : currentUser?.id || '');
//   const [search, setSearch]     = useState('');
//   const [changes, setChanges]   = useState({}); // { dealerId: { achieved, target, status } }
//   const [saving, setSaving]     = useState(false);
//   const [saved, setSaved]       = useState(false);
//   const [errors, setErrors]     = useState([]);

//   const moIdx = MO.indexOf(month);
//   const salesmen = Object.values(users).filter(u => u.role === 'salesman');

//   const filtered = useMemo(() => {
//     let d = dealers;
//     if(salesman !== 'all') d = d.filter(x => x.salesman === salesman);
//     if(search) d = d.filter(x =>
//       x.name.toLowerCase().includes(search.toLowerCase()) ||
//       (x.city||'').toLowerCase().includes(search.toLowerCase())
//     );
//     return [...d].sort((a,b) => a.name.localeCompare(b.name));
//   }, [dealers, salesman, search]);

//   const getVal = (dealerId, field) => {
//     if(changes[dealerId]?.[field] !== undefined) return changes[dealerId][field];
//     const d = dealers.find(x => x.id === dealerId);
//     if(!d) return field === 'status' ? 'ACTIVE' : 0;
//     if(field === 'achieved') return moIdx >= 0 ? (d.months[moIdx] || 0) : 0;
//     if(field === 'target')   return moIdx >= 0 ? (d.monthTargets?.[moIdx] ?? d.target ?? 0) : (d.target || 0);
//     if(field === 'status')   return d.monthStatus?.[moIdx] || d.status || 'ACTIVE';
//     return '';
//   };

//   const setVal = (dealerId, field, value) => {
//     setChanges(prev => ({ ...prev, [dealerId]: { ...prev[dealerId], [field]: value } }));
//     setSaved(false);
//   };

//   const changedCount = Object.keys(changes).length;

//   const saveAll = async () => {
//     if(!changedCount) return;
//     setSaving(true); setErrors([]); setSaved(false);

//     const errs = [];
//     let ok = 0;
//     const token = localStorage.getItem('stp_jwt');

//     if(!token) {
//       setErrors(['Not connected to server. Start server and re-login to save data to database.']);
//       setSaving(false);
//       return;
//     }

//     for(const [dealerId, vals] of Object.entries(changes)) {
//       const dealer = dealers.find(d => d.id === dealerId);
//       if(!dealer) continue;

//       // Build updated months array
//       const newMonths = [...(dealer.months || new Array(MO.length).fill(0))];
//       // Extend if needed
//       while(newMonths.length < MO.length) newMonths.push(0);

//       if(moIdx >= 0 && vals.achieved !== undefined) newMonths[moIdx] = num(vals.achieved);

//       const newTargets = { ...(dealer.monthTargets || {}) };
//       if(moIdx >= 0 && vals.target !== undefined) newTargets[moIdx] = num(vals.target);

//       const newStatus = vals.status || dealer.status;

//       // Update local state immediately
//       onUpdateDealer(dealerId, {
//         months: newMonths,
//         monthTargets: newTargets,
//         status: newStatus,
//         achieved: moIdx >= 0 ? newMonths[moIdx] : dealer.achieved,
//       });

//       // Save to DB
//       try {
//         const updatePayload = {};

//         // Monthly data — includes achieved, target, status, zone for this month
//         if(moIdx >= 0) {
//           updatePayload[`monthlyData.${month}`] = {
//             achieved: num(vals.achieved ?? newMonths[moIdx]),
//             target:   num(vals.target   ?? newTargets[moIdx] ?? 0),
//             ...(vals.status ? { status:vals.status } : {}),
//             ...(dealer.zone ? { zone:dealer.zone }   : {}),
//           };
//         }

//         // Also update dealer's current status
//         if(vals.status !== undefined) updatePayload.status = vals.status;

//         if(Object.keys(updatePayload).length > 0) {
//           await api.updateDealer(dealerId, updatePayload);
//         }
//         ok++;
//       } catch(e) {
//         errs.push(`${dealer.name}: ${e.message}`);
//       }
//     }

//     setErrors(errs);
//     setSaved(true);
//     setChanges({});
//     setSaving(false);
//   };

//   return (
//     <div className="fade">
//       <div style={{marginBottom:16}}>
//         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Data Entry</div>
//         <div style={{fontSize:22,fontWeight:700}}>Monthly Entry</div>
//         <div style={{fontSize:13,color:'var(--t3)',marginTop:4}}>Enter or update target, achieved & status for any month inline.</div>
//       </div>

//       {/* Controls */}
//       <div className="card" style={{marginBottom:14}}>
//         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:changedCount>0||saved?14:0}}>
//           <div>
//             <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Month</label>
//             <div style={{position:'relative'}}>
//               <select className="inp" value={month} onChange={e=>{setMonth(e.target.value);setChanges({});setSaved(false);}} style={{width:'100%',paddingRight:28,appearance:'none'}}>
//                 {[...MO].reverse().map(m=>(
//                   <option key={m} value={m}>{m}{m===MO[currentMonthIdx]?' ← current':''}</option>
//                 ))}
//               </select>
//               <ChevronDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
//             </div>
//           </div>

//           {isAdmin&&(
//             <div>
//               <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Salesman</label>
//               <div style={{position:'relative'}}>
//                 <select className="inp" value={salesman} onChange={e=>setSalesman(e.target.value)} style={{width:'100%',paddingRight:28,appearance:'none'}}>
//                   <option value="all">All Salesmen</option>
//                   {salesmen.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
//                 </select>
//                 <ChevronDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
//               </div>
//             </div>
//           )}

//           <div>
//             <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Search</label>
//             <div style={{position:'relative'}}>
//               <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//               <input className="inp" style={{paddingLeft:28,width:'100%'}} placeholder="Name or city..." value={search} onChange={e=>setSearch(e.target.value)}/>
//             </div>
//           </div>
//         </div>

//         {moIdx < 0 && month && (
//           <div style={{padding:'8px 12px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:8,fontSize:12,color:'#fbbf24',marginBottom:12}}>
//             ⚠ "{month}" not in month list. Go to Admin Panel → Month Settings → Add Month first.
//           </div>
//         )}

//         {changedCount > 0 && (
//           <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'rgba(99,102,241,0.08)',borderRadius:8,border:'1px solid rgba(99,102,241,0.2)',flexWrap:'wrap'}}>
//             <Edit3 size={14} color="var(--acc)"/>
//             <span style={{fontSize:13,fontWeight:600,color:'var(--acc)'}}>{changedCount} dealer{changedCount>1?'s':''} modified</span>
//             <div style={{flex:1}}/>
//             <button onClick={()=>{setChanges({});setSaved(false);}} className="btn" style={{fontSize:12}}>Discard</button>
//             <button onClick={saveAll} disabled={saving} className="btnp" style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
//               {saving ? <><div style={{width:11,height:11,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Saving...</> : <><Save size={12}/> Save {changedCount} Changes</>}
//             </button>
//           </div>
//         )}

//         {saved && !changedCount && (
//           <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'rgba(52,211,153,0.08)',borderRadius:8,border:'1px solid rgba(52,211,153,0.2)'}}>
//             <CheckCircle size={14} color="#34d399"/>
//             <span style={{fontSize:12,color:'#34d399',fontWeight:600}}>Saved to database ✓</span>
//           </div>
//         )}

//         {errors.length > 0 && (
//           <div style={{padding:'8px 12px',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:8,marginTop:8}}>
//             <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><AlertCircle size={13} color="#f87171"/><span style={{fontSize:12,fontWeight:600,color:'#f87171'}}>Some errors:</span></div>
//             {errors.map((e,i)=><div key={i} style={{fontSize:11,color:'#f87171'}}>· {e}</div>)}
//           </div>
//         )}
//       </div>

//       {/* Table */}
//       <div className="card" style={{padding:0,overflow:'hidden'}}>
//         <div style={{padding:'10px 14px',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
//           <Filter size={13} color="var(--t3)"/>
//           <span style={{fontSize:12,fontWeight:600,color:'var(--t2)'}}>{filtered.length} dealers — {month}</span>
//           <span style={{fontSize:11,color:'var(--t3)'}}>Click any cell to edit</span>
//         </div>
//         <div style={{overflowX:'auto',maxHeight:'65vh',overflowY:'auto'}}>
//           <table>
//             <thead>
//               <tr>
//                 <th>Dealer</th>
//                 {isAdmin&&<th>Salesman</th>}
//                 <th>City</th>
//                 <th style={{textAlign:'right',color:'var(--acc)',background:'rgba(99,102,241,.06)'}}>Target</th>
//                 <th style={{textAlign:'right',color:'#34d399',background:'rgba(52,211,153,.06)'}}>Achieved</th>
//                 <th style={{textAlign:'right'}}>Ach%</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map(dealer => {
//                 const changed  = !!changes[dealer.id];
//                 const achieved = num(getVal(dealer.id, 'achieved'));
//                 const target   = num(getVal(dealer.id, 'target'));
//                 const status   = getVal(dealer.id, 'status');
//                 const achPct   = pct(target, achieved);
//                 const sm       = users[dealer.salesman];
//                 return (
//                   <tr key={dealer.id} style={{
//                     background: changed ? 'rgba(99,102,241,0.04)' : 'transparent',
//                     borderLeft: `3px solid ${changed ? 'var(--acc)' : 'transparent'}`,
//                   }}>
//                     <td style={{maxWidth:180}}>
//                       <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dealer.name}</div>
//                       {(dealer.category||dealer.categoryType)&&(
//                         <div style={{fontSize:9,color:'#818cf8'}}>{dealer.category}{dealer.categoryType?` · ${dealer.categoryType}`:''}</div>
//                       )}
//                     </td>
//                     {isAdmin&&<td>{sm&&<div style={{display:'flex',alignItems:'center',gap:4}}><Avatar user={sm} size={15}/><span style={{fontSize:11}}>{sm.name}</span></div>}</td>}
//                     <td style={{fontSize:11,color:'var(--t3)'}}>{dealer.city||'—'}</td>

//                     {/* Target - editable */}
//                     <td style={{background:'rgba(99,102,241,.04)',padding:'4px 8px'}}>
//                       <input type="number" min="0" value={getVal(dealer.id,'target')}
//                         onChange={e=>setVal(dealer.id,'target',e.target.value)}
//                         style={{width:'100%',minWidth:70,textAlign:'right',background:'transparent',border:'none',
//                           borderBottom:`1px solid ${changes[dealer.id]?.target!==undefined?'var(--acc)':'var(--b2)'}`,
//                           color:'var(--t1)',fontSize:13,fontWeight:600,padding:'2px 0',outline:'none'}}/>
//                     </td>

//                     {/* Achieved - editable */}
//                     <td style={{background:'rgba(52,211,153,.04)',padding:'4px 8px'}}>
//                       <input type="number" min="0" value={getVal(dealer.id,'achieved')}
//                         onChange={e=>setVal(dealer.id,'achieved',e.target.value)}
//                         style={{width:'100%',minWidth:70,textAlign:'right',background:'transparent',border:'none',
//                           borderBottom:`1px solid ${changes[dealer.id]?.achieved!==undefined?'#34d399':'var(--b2)'}`,
//                           color:'#34d399',fontSize:13,fontWeight:700,padding:'2px 0',outline:'none'}}/>
//                     </td>

//                     <td style={{textAlign:'right',fontWeight:700,color:pclr(achPct),fontSize:12,whiteSpace:'nowrap'}}>
//                       {target>0 ? spct(target,achieved) : '—'}
//                     </td>

//                     {/* Status - editable */}
//                     <td style={{padding:'4px 8px'}}>
//                       <select value={status} onChange={e=>setVal(dealer.id,'status',e.target.value)}
//                         style={{background:'transparent',border:'none',
//                           borderBottom:`1px solid ${changes[dealer.id]?.status!==undefined?'var(--acc)':'var(--b2)'}`,
//                           color:'var(--t2)',fontSize:11,padding:'2px 0',outline:'none',cursor:'pointer',width:'100%'}}>
//                         {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
//                       </select>
//                     </td>
//                   </tr>
//                 );
//               })}
//               {filtered.length===0&&(
//                 <tr><td colSpan={isAdmin?7:6} style={{textAlign:'center',padding:40,color:'var(--t3)'}}>No dealers found</td></tr>
//               )}
//             </tbody>
//             {filtered.length>0&&(
//               <tfoot>
//                 <tr>
//                   <td colSpan={isAdmin?3:2} style={{fontWeight:700}}>TOTAL ({filtered.length})</td>
//                   <td style={{textAlign:'right',fontWeight:700,color:'var(--acc)',background:'rgba(99,102,241,.04)'}}>
//                     {filtered.reduce((s,d)=>s+num(getVal(d.id,'target')),0).toLocaleString('en-IN')}
//                   </td>
//                   <td style={{textAlign:'right',fontWeight:700,color:'#34d399',background:'rgba(52,211,153,.04)'}}>
//                     {filtered.reduce((s,d)=>s+num(getVal(d.id,'achieved')),0).toLocaleString('en-IN')}
//                   </td>
//                   <td style={{textAlign:'right',fontWeight:700,color:'var(--t2)'}}>
//                     {(()=>{
//                       const t=filtered.reduce((s,d)=>s+num(getVal(d.id,'target')),0);
//                       const a=filtered.reduce((s,d)=>s+num(getVal(d.id,'achieved')),0);
//                       return t>0?spct(t,a):'—';
//                     })()}
//                   </td>
//                   <td/>
//                 </tr>
//               </tfoot>
//             )}
//           </table>
//         </div>
//       </div>

//       <div style={{marginTop:10,fontSize:11,color:'var(--t3)'}}>
//         💡 Click any Target, Achieved or Status cell → edit → <strong>Save Changes</strong> saves all to MongoDB.
//         Purple highlight = unsaved change.
//       </div>
//     </div>
//   );
// }


import React, { useState, useMemo, useRef } from 'react';
import { Save, Search, ChevronDown, CheckCircle, Edit3, Filter, AlertCircle, Download, Upload, FileSpreadsheet, Trash2 } from 'lucide-react';
import { useMonth } from '../context';
import { MO as MO_DEFAULT } from '../constants';
import { num, pct, spct, pclr, monthTarget } from '../utils';
import { api } from '../api';
import { Avatar } from './UI';
import { confirmDialog, notify } from './Toast';

const STATUSES = ['STAR','ACTIVE','KEY ACCOUNT','ACHIVERS','REACTIVE','INACTIVE','DEAD','NEW','PROSPECT'];

export default function MonthlyEntry({ dealers, users, currentUser, onUpdateDealer, onSaved }) {
  const { MO:ctxMO, currentMonthIdx } = useMonth();
  const MO = ctxMO || MO_DEFAULT;

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [month, setMonth]       = useState(MO[currentMonthIdx] || MO[MO.length-1]);
  const [salesman, setSalesman] = useState(isAdmin ? 'all' : currentUser?.id || '');
  const [search, setSearch]     = useState('');
  const [changes, setChanges]   = useState({}); // { dealerId: { achieved, target, status } }
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [errors, setErrors]     = useState([]);

  // ── Bulk Excel: download/upload per-salesman template ──────────────────────
  const fileRef = useRef(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg]   = useState(null); // { type:'success'|'error', text }

  // ── Category-wise Sales: download dynamic template + upload wide Excel ─────
  // Uses the new /api/sales endpoints. The "month" state already holds an
  // MO label like "Jun-26" — the server's normaliser handles that just fine.
  const catFileRef            = useRef(null);
  const [catBusy, setCatBusy] = useState(false);
  const [catTplBusy, setCatTplBusy] = useState(false);
  const [catMsg, setCatMsg]   = useState(null); // { type, text, detail? }
  const [catReplace, setCatReplace] = useState(true);

  // Convert MO label "Jun-26" → "2026-06" for the server's normalised month field
  const toYearMonth = (lbl) => {
    if (!lbl) return '';
    const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(lbl.trim());
    if (!m) return '';
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const mi = months.indexOf(m[1].slice(0,3).toLowerCase());
    if (mi < 0) return '';
    let y = +m[2]; if (y < 100) y += 2000;
    return `${y}-${String(mi+1).padStart(2,'0')}`;
  };

  const handleCatTemplate = async () => {
    setCatBusy(true); setCatTplBusy(true); setCatMsg(null);
    try {
      // Pre-fill with current dealer data for the selected month + salesman filter
      await api.salesDownloadTemplate({
        monthLabel: month,
        salesman: (isAdmin && salesman !== 'all') ? salesman : '',
      });
      const who = isAdmin && salesman === 'all'
        ? 'All Salesmen'
        : (users[salesman]?.name || salesman || 'you');
      setCatMsg({ type:'success', text:`Template downloaded for ${who} — ${month}. Pre-filled with current dealer data. Edit and upload below.` });
    } catch(e) {
      setCatMsg({ type:'error', text:`Template download failed: ${e.message}` });
    } finally {
      setCatBusy(false); setCatTplBusy(false);
    }
  };

  const handleCatUploadClick = () => catFileRef.current?.click();

  // Admin: full clean-slate for a month.
  // Wipes BOTH (a) category-wise Sale rows for the month, AND (b) each dealer's
  // monthlyData[month] (Target / Achieved / Status / Zone / City / etc.). Then
  // runs dealer dedupe so any duplicate dealer rows from a bad upload are
  // collapsed too. Dealer master fields (name, salesman, city, etc.) are kept.
  const handleCatDeleteMonth = async () => {
    const ym = toYearMonth(month);
    if (!ym) { setCatMsg({ type:'error', text:`Could not understand month "${month}".` }); return; }
    const ok = await confirmDialog({
      title: `Reset ALL data for ${month}?`,
      message: [
        `This will wipe everything for ${month} so you can re-upload cleanly:`,
        '',
        `• Every category-wise sale row for ${month}`,
        `• Every dealer's Target / Achieved / Status / Zone / City for ${month}`,
        `• Duplicate dealer rows (same name + same salesman) created during the bad upload`,
        '',
        'Dealer master records and OTHER months are NOT touched.',
      ].join('\n'),
      confirmText: `Yes, reset ${month}`,
      cancelText: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    setCatBusy(true); setCatMsg(null);
    try {
      // 1. Delete category sale rows for the YYYY-MM month
      const r1 = await api.salesDeleteMonth(ym).catch(e => ({ deleted: 0, _err: e.message }));
      // 2. Delete dealer.monthlyData[label] for all dealers
      const r2 = await api.deleteMonth(month).catch(e => ({ dealersTouched: 0, _err: e.message }));
      // 3. Remove every dealer created by the category-wise Excel upload
      //    (those carry source='cat-upload' from the server). Sale rows are
      //    re-pointed at the matching original dealer first.
      const r0 = await api.deleteDealersBySource('cat-upload', false)
                          .catch(e => ({ deleted: 0, migrated: 0, _err: e.message }));
      // 4a. Dedupe exact-match dealers (same name + same salesman)
      const r3 = await api.dedupeDealers(false).catch(e => ({ duplicatesRemoved: 0, _err: e.message }));
      // 4b. Dedupe suffix-dupes ("X pranav" when "X" exists for salesman Pranav)
      const r4 = await api.cleanupSuffixDupes(false).catch(e => ({ deleted: 0, _err: e.message }));

      const parts = [
        `Reset complete for ${month}.`,
        `Bad-upload dealers removed: ${r0.deleted || 0} (sale rows migrated: ${r0.migrated || 0}).`,
        `Category sale rows deleted: ${r1.deleted || 0}.`,
        `Dealer-month records cleared: ${r2.dealersTouched || 0}.`,
        `Exact duplicate dealers removed: ${r3.duplicatesRemoved ?? r3.removed ?? 0}.`,
        `Salesman-suffix duplicate dealers removed: ${r4.deleted || 0} (sale rows migrated: ${r4.migrated || 0}).`,
        `You can re-upload cleanly now.`,
      ];
      setCatMsg({ type:'success', text: parts.join(' ') });
      if (onSaved) onSaved(); // refresh Monthly Entry table
    } catch(e) {
      setCatMsg({ type:'error', text: `Reset failed: ${e.message}` });
    } finally {
      setCatBusy(false);
    }
  };

  // ── Merge name-variant duplicate dealers ──────────────────────────────
  // This is the FIX for "upload created 1300 duplicates because the Excel
  // had names without spaces" (e.g. "76EAST" in Excel vs "76 EAST" in DB).
  // Non-destructive: it keeps the OLDER dealer (with its full history) and
  // re-points the new upload's sale rows + merges the upload's monthlyData
  // into the original before deleting the duplicate.
  const handleMergeNameVariants = async () => {
    // Quick dry-run preview first so the user sees what's about to happen
    setCatBusy(true); setCatMsg(null);
    let preview;
    try {
      preview = await api.dedupeStripped(true);
    } catch (e) {
      setCatBusy(false);
      setCatMsg({ type:'error', text: `Preview failed: ${e.message}` });
      return;
    }
    setCatBusy(false);

    if (!preview.duplicatesRemoved) {
      setCatMsg({ type:'success', text:'No name-variant duplicates found — your dealer list is already clean.' });
      return;
    }

    const ok = await confirmDialog({
      title: `Merge ${preview.duplicatesRemoved} duplicate dealer${preview.duplicatesRemoved===1?'':'s'}?`,
      message: [
        `Found ${preview.groupsFound} groups of dealers whose names differ only by spaces or punctuation`,
        `(e.g. "1000 Kitchens Interiors" and "1000KITCHENSINTERIORS").`,
        ``,
        `For each group, the ORIGINAL dealer is kept and the upload-created duplicate is merged in:`,
        `  • All its sale rows are re-pointed to the original dealer`,
        `  • Any new monthly data (Target / Achieved) is copied over`,
        `  • Then the duplicate dealer record is deleted`,
        ``,
        `${preview.duplicatesRemoved} duplicate dealer record${preview.duplicatesRemoved===1?'':'s'} will be removed.`,
        `No sale data is lost.`,
      ].join('\n'),
      confirmText: `Yes, merge ${preview.duplicatesRemoved} duplicates`,
      cancelText: 'Cancel',
      danger: false,
    });
    if (!ok) return;

    setCatBusy(true);
    try {
      const r = await api.dedupeStripped(false);
      setCatMsg({
        type:'success',
        text: `Done. Merged ${r.duplicatesRemoved} duplicate dealers across ${r.groupsFound} groups. Sale rows migrated: ${r.salesMigrated}.`,
      });
      if (onSaved) onSaved();
    } catch(e) {
      setCatMsg({ type:'error', text:`Merge failed: ${e.message}` });
    } finally {
      setCatBusy(false);
    }
  };

  const handleCatFileChosen = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // allow re-uploading the same file
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      setCatMsg({ type:'error', text:'Please pick an .xlsx file.' });
      return;
    }
    setCatBusy(true); setCatMsg(null);
    try {
      const ym  = toYearMonth(month) || month;   // YYYY-MM for Sale rows
      const res = await api.salesUpload(f, ym, catReplace, month /* MO label */);
      const parts = [`${month}: ${res.inserted} category-sale rows inserted.`];
      if (res.dealersUpdated)     parts.push(`${res.dealersUpdated} dealers updated.`);
      if (res.dealersCreated)     parts.push(`${res.dealersCreated} new dealers created.`);
      if (res.monthlyDataUpdated) parts.push(`${res.monthlyDataUpdated} dealer-month records written.`);
      if (res.unknownSubCategories?.length) {
        parts.push(`Unknown sub-cats bucketed under OTHER: ${res.unknownSubCategories.join(', ')}.`);
      }
      if (res.unmatchedDealersCount > 0) {
        parts.push(`${res.unmatchedDealersCount} dealer name(s) didn't match master list.`);
      }
      setCatMsg({ type:'success', text: parts.join(' ') });
      // Refresh the Monthly Entry table from DB so updates show
      if (onSaved) onSaved();
    } catch(e) {
      setCatMsg({ type:'error', text: `Upload failed: ${e.message}` });
    } finally {
      setCatBusy(false);
    }
  };

  const moIdx = MO.indexOf(month);
  const salesmen = Object.values(users).filter(u => u.role === 'salesman');

  // Replace / reassign the currently-selected salesman — move ALL their
  // dealers & records to another salesman (e.g. when someone resigns). After
  // this the target salesman sees all the data.
  const replaceSalesman = async () => {
    if(!isAdmin || salesman === 'all') return;
    const from = salesman;
    const fromName = users[from]?.name || from;
    const list = Object.values(users)
      .filter(u => u.id !== from && u.active !== false)
      .map(u => u.id + ' — ' + u.name).join('\n');
    const raw = window.prompt(
      'Replace "' + fromName + '" — move ALL their dealers & records to which user?\n' +
      'Type the target user id:\n\n' + list
    );
    if(raw === null) return;
    const toId = String(raw).trim();
    if(!toId || !users[toId]){ notify.error('No user with id "' + toId + '"'); return; }
    if(toId === from){ notify.error('Pick a different user'); return; }
    const ok = await confirmDialog({
      title: 'Replace salesman?',
      message: 'Move all dealers, sales, follow-ups, visits, attendance, tasks & leads from "' +
        fromName + '" → "' + (users[toId]?.name || toId) + '"? This cannot be auto-undone.',
      confirmText: 'Replace', danger: true,
    });
    if(!ok) return;
    try {
      const r = await api.reassignSalesman(from, toId);
      const m = r?.moved || {};
      notify.success('Moved ' + (m.dealers||0) + ' dealers (+' + (m.sales||0) + ' sales, ' +
        (m.followups||0) + ' follow-ups, ' + (m.visits||0) + ' visits) to ' + (users[toId]?.name || toId));
      setSalesman(toId);          // switch the view to the new salesman
      if(onSaved) onSaved();      // reload dealers so the change is visible
    } catch(e){ notify.error(e.message || 'Replace failed'); }
  };

  const filtered = useMemo(() => {
    let d = dealers;
    if(salesman !== 'all') d = d.filter(x => x.salesman === salesman);
    if(search) d = d.filter(x =>
      x.name.toLowerCase().includes(search.toLowerCase()) ||
      (x.city||'').toLowerCase().includes(search.toLowerCase())
    );
    return [...d].sort((a,b) => a.name.localeCompare(b.name));
  }, [dealers, salesman, search]);

  const getVal = (dealerId, field) => {
    if(changes[dealerId]?.[field] !== undefined) return changes[dealerId][field];
    const d = dealers.find(x => x.id === dealerId);
    if(!d) return field === 'status' ? 'ACTIVE' : 0;
    // Use per-month data — strictly from monthlyData for that month
    const md = d.monthlyData?.[month];
    if(field === 'achieved') return moIdx >= 0 ? (d.months?.[moIdx]||0) : 0;
    if(field === 'target')   return moIdx >= 0 ? (d.monthTargets?.[moIdx]||0) : 0;
    if(field === 'status')   return d.monthStatus?.[moIdx] || d.status || 'ACTIVE';
    return '';
  };

  const setVal = (dealerId, field, value) => {
    setChanges(prev => ({ ...prev, [dealerId]: { ...prev[dealerId], [field]: value } }));
    setSaved(false);
  };

  const changedCount = Object.keys(changes).length;

  const saveAll = async () => {
    if(!changedCount) return;
    setSaving(true); setErrors([]); setSaved(false);

    const errs = [];
    let ok = 0;
    const token = localStorage.getItem('stp_jwt');

    if(!token) {
      setErrors(['Not connected to server. Start server and re-login to save data to database.']);
      setSaving(false);
      return;
    }

    for(const [dealerId, vals] of Object.entries(changes)) {
      const dealer = dealers.find(d => d.id === dealerId);
      if(!dealer) continue;

      // Build updated months array
      const newMonths = [...(dealer.months || new Array(MO.length).fill(0))];
      // Extend if needed
      while(newMonths.length < MO.length) newMonths.push(0);

      if(moIdx >= 0 && vals.achieved !== undefined) newMonths[moIdx] = num(vals.achieved);

      const newTargets = { ...(dealer.monthTargets || {}) };
      if(moIdx >= 0 && vals.target !== undefined) newTargets[moIdx] = num(vals.target);

      const newStatus = vals.status || dealer.status;

      // Update local state immediately
      onUpdateDealer(dealerId, {
        months: newMonths,
        monthTargets: newTargets,
        status: newStatus,
        achieved: moIdx >= 0 ? newMonths[moIdx] : dealer.achieved,
      });

      // Save to DB
      try {
        const updatePayload = {};

        // Monthly data — includes achieved, target, status, zone for this month
        if(moIdx >= 0) {
          updatePayload[`monthlyData.${month}`] = {
            achieved: num(vals.achieved ?? newMonths[moIdx]),
            target:   num(vals.target   ?? newTargets[moIdx] ?? 0),
            ...(vals.status ? { status:vals.status } : {}),
            ...(dealer.zone ? { zone:dealer.zone }   : {}),
          };
        }

        // Also update dealer's current status
        if(vals.status !== undefined) updatePayload.status = vals.status;

        if(Object.keys(updatePayload).length > 0) {
          await api.updateDealer(dealerId, updatePayload);
        }
        ok++;
      } catch(e) {
        errs.push(`${dealer.name}: ${e.message}`);
      }
    }

    setErrors(errs);
    setSaved(true);
    setChanges({});
    setSaving(false);
    if(ok > 0 && onSaved) onSaved();   // refresh dashboard data after successful save
  };

  // ── Bulk Excel handlers (download pre-filled template / upload back) ─────
  const csvEscape = v => {
    const s = (v === null || v === undefined) ? '' : String(v);
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const handleDownloadTemplate = () => {
    setBulkMsg(null);
    if(!month || moIdx < 0){
      setBulkMsg({type:'error', text:'Pick a valid month first.'});
      return;
    }
    const list = filtered;
    if(!list.length){
      setBulkMsg({type:'error', text:'No dealers to export with current filters.'});
      return;
    }

    // Columns: include the editable Salesman column for admins in BOTH the
    // "All Salesmen" and single-salesman exports — so an admin can change a
    // dealer's salesman in the sheet and re-upload to reassign it.
    const includeSalesman = isAdmin;
    const headers = [
      ...(includeSalesman ? ['Salesman'] : []),
      'Dealer Name', 'City', 'State', 'Zone', 'Status',
      'Target', 'Achieved',
      'Category Type', 'Sub Category',
      'Credit Days', 'Credit Limit',
    ];

    const rows = list.map(d => {
      const ach = Number(d.months?.[moIdx]) || 0;
      const tgt = monthTarget(d, moIdx);
      const cells = [
        ...(includeSalesman ? [users[d.salesman]?.name || d.salesman || ''] : []),
        d.name || '',
        d.city || '',
        d.state || '',
        d.zone || '',
        d.status || 'ACTIVE',
        tgt || 0,
        ach || 0,
        d.category || '',
        d.categoryType || '',
        d.creditDays || 0,
        d.creditLimit || 0,
      ];
      return cells.map(csvEscape).join(',');
    });

    const csv = [headers.map(csvEscape).join(','), ...rows].join('\n');
    const smName = includeSalesman ? 'All_Salesmen' : (users[salesman]?.name || salesman || 'Unknown').replace(/\s+/g,'_');
    const filename = `MonthlyEntry_${month}_${smName}.csv`;
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv); // BOM so Excel opens UTF-8 cleanly
    a.download = filename;
    a.click();
    setBulkMsg({
      type:'success',
      text: `Downloaded ${rows.length} dealer rows for ${smName.replace(/_/g,' ')} — ${month}. Edit Target/Achieved in Excel, save as .csv or .xlsx, then click "Upload Filled".`,
    });
  };

  const handleUploadClick = () => {
    setBulkMsg(null);
    if(!month || moIdx < 0){
      setBulkMsg({type:'error', text:'Pick a valid month first.'});
      return;
    }
    fileRef.current?.click();
  };

  const handleFileChosen = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if(!f) return;
    setBulkBusy(true); setBulkMsg(null);
    try {
      // When admin selects "All Salesmen", send '_all' so the server reads the
      // per-row Salesman column. Otherwise send the picked salesman id.
      const targetSm = isAdmin ? (salesman === 'all' ? '_all' : salesman) : currentUser?.id;
      const res = await api.uploadMonth(f, month, targetSm);

      // Build a readable summary, including per-salesman counts for all-mode.
      let summary = '';
      if(res.mode === 'all' && res.perSalesman){
        const parts = Object.entries(res.perSalesman)
          .map(([uid,c]) => (users[uid]?.name || uid) + ': ' + (c.added+c.updated) + ' rows');
        summary = `${month} (All Salesmen): ${res.added||0} added, ${res.updated||0} updated${res.skipped?', '+res.skipped+' skipped':''}. ${parts.join(' · ')}`;
      } else {
        summary = `${month} → ${users[targetSm]?.name || targetSm}: ${res.added||0} added, ${res.updated||0} updated${res.skipped?', '+res.skipped+' skipped':''}`;
      }
      setBulkMsg({ type:'success', text: summary });
      if(onSaved) onSaved();    // refresh dashboard data
    } catch(err){
      setBulkMsg({type:'error', text:'Upload failed: ' + err.message});
    } finally { setBulkBusy(false); }
  };

  return (
    <div className="fade">
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Data Entry</div>
        <div style={{fontSize:22,fontWeight:700}}>Monthly Entry</div>
        <div style={{fontSize:13,color:'var(--t3)',marginTop:4}}>Enter or update target, achieved & status for any month inline.</div>
      </div>

      {/* Controls */}
      <div className="card" style={{marginBottom:14}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:changedCount>0||saved?14:0}}>
          <div>
            <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Month</label>
            <div style={{position:'relative'}}>
              <select className="inp" value={month} onChange={e=>{setMonth(e.target.value);setChanges({});setSaved(false);}} style={{width:'100%',paddingRight:28,appearance:'none'}}>
                {[...MO].reverse().map(m=>(
                  <option key={m} value={m}>{m}{m===MO[currentMonthIdx]?' ← current':''}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
            </div>
          </div>

          {isAdmin&&(
            <div>
              <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Salesman</label>
              <div style={{position:'relative'}}>
                <select className="inp" value={salesman} onChange={e=>setSalesman(e.target.value)} style={{width:'100%',paddingRight:28,appearance:'none'}}>
                  <option value="all">All Salesmen</option>
                  {salesmen.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
              </div>
              {salesman !== 'all' && (
                <button type="button" onClick={replaceSalesman}
                  title="Replace this salesman — move all their dealers & records to another user"
                  style={{marginTop:6, display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700,
                    color:'#fbbf24', background:'rgba(251,191,36,0.10)', border:'1px solid rgba(251,191,36,0.35)',
                    borderRadius:7, padding:'6px 10px', cursor:'pointer'}}>
                  ⇄ Replace salesman
                </button>
              )}
            </div>
          )}

          <div>
            <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Search</label>
            <div style={{position:'relative'}}>
              <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
              <input className="inp" style={{paddingLeft:28,width:'100%'}} placeholder="Name or city..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
          </div>
        </div>

        {moIdx < 0 && month && (
          <div style={{padding:'8px 12px',background:'rgba(251,191,36,0.08)',border:'1px solid rgba(251,191,36,0.2)',borderRadius:8,fontSize:12,color:'#fbbf24',marginBottom:12}}>
            ⚠ "{month}" not in month list. Go to Admin Panel → Month Settings → Add Month first.
          </div>
        )}

        {changedCount > 0 && (
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:'rgba(99,102,241,0.08)',borderRadius:8,border:'1px solid rgba(99,102,241,0.2)',flexWrap:'wrap'}}>
            <Edit3 size={14} color="var(--acc)"/>
            <span style={{fontSize:13,fontWeight:600,color:'var(--acc)'}}>{changedCount} dealer{changedCount>1?'s':''} modified</span>
            <div style={{flex:1}}/>
            <button onClick={()=>{setChanges({});setSaved(false);}} className="btn" style={{fontSize:12}}>Discard</button>
            <button onClick={saveAll} disabled={saving} className="btnp" style={{display:'flex',alignItems:'center',gap:6,fontSize:12}}>
              {saving ? <><div style={{width:11,height:11,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Saving...</> : <><Save size={12}/> Save {changedCount} Changes</>}
            </button>
          </div>
        )}

        {saved && !changedCount && (
          <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'rgba(52,211,153,0.08)',borderRadius:8,border:'1px solid rgba(52,211,153,0.2)'}}>
            <CheckCircle size={14} color="#34d399"/>
            <span style={{fontSize:12,color:'#34d399',fontWeight:600}}>Saved to database ✓</span>
          </div>
        )}

        {errors.length > 0 && (
          <div style={{padding:'8px 12px',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:8,marginTop:8}}>
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><AlertCircle size={13} color="#f87171"/><span style={{fontSize:12,fontWeight:600,color:'#f87171'}}>Some errors:</span></div>
            {errors.map((e,i)=><div key={i} style={{fontSize:11,color:'#f87171'}}>· {e}</div>)}
          </div>
        )}
      </div>

      {/* ── ONE Bulk Excel: download pre-filled, edit, upload back ────────── */}
      {isAdmin && (
        <div className="card" style={{marginBottom:14, padding:14, background:'rgba(34,197,94,0.04)', border:'1px solid rgba(34,197,94,0.20)'}}>
          {/* hidden file input for the category upload */}
          <input ref={catFileRef} type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={handleCatFileChosen}/>

          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap'}}>
            <FileSpreadsheet size={15} color="#34d399"/>
            <span style={{fontSize:13, fontWeight:700, color:'var(--t1)'}}>Bulk Excel — Download &amp; Upload</span>
            <span style={{fontSize:10, color:'var(--t3)', background:'rgba(34,197,94,0.14)', padding:'2px 7px', borderRadius:4, fontWeight:700, letterSpacing:'.04em'}}>
              {month}{salesman !== 'all' ? ' · ' + (users[salesman]?.name || salesman) : ' · All salesmen'}
            </span>
            <span style={{fontSize:10, color:'var(--t3)'}}>· {filtered.length} dealers</span>
          </div>
          <div style={{fontSize:11, color:'var(--t3)', marginBottom:10, lineHeight:1.5}}>
            ONE Excel does everything — pre-filled with current dealer info (City, State, Zone, Status, Target, Credit) plus a column for every Product Type from your taxonomy.
            Fill the product-type quantity cells, save, and upload. Updates dealer info + per-month numbers + category-wise sales in one shot.
            View results under <b>Sales by Category</b>. Manage product types under <b>Admin Panel → Categories</b>.
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
            <button onClick={handleCatTemplate} disabled={catBusy}
              style={{
                display:'flex', alignItems:'center', gap:6,
                background:'#0ea5e9', color:'#fff', border:'none',
                padding:'8px 14px', borderRadius:6, fontSize:12, fontWeight:700,
                cursor: catBusy ? 'not-allowed' : 'pointer', opacity: catBusy ? 0.6 : 1,
              }}>
              <Download size={13}/> {catTplBusy ? 'Building…' : `Download Template (${filtered.length} dealers)`}
            </button>
            <button onClick={handleCatUploadClick} disabled={catBusy}
              title={`Upload your filled Excel for ${month}`}
              style={{
                display:'flex', alignItems:'center', gap:6,
                background:'#22c55e', color:'#0c0c1e',
                border:'1px solid #15803d',
                padding:'8px 14px', borderRadius:6, fontSize:12, fontWeight:700,
                cursor: catBusy ? 'not-allowed' : 'pointer', opacity: catBusy ? 0.6 : 1,
              }}>
              {catBusy && !catTplBusy
                ? <><div style={{width:11,height:11,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/> Uploading…</>
                : <><Upload size={13}/> Upload Filled Excel</>}
            </button>
            <button onClick={handleMergeNameVariants} disabled={catBusy}
              title="Merge dealers whose names differ only by spaces or punctuation (e.g. '76 EAST' and '76EAST') — sale rows are preserved. Use this AFTER an upload that created duplicates."
              style={{
                display:'flex', alignItems:'center', gap:6,
                color:'#fde68a',
                background:'rgba(251,191,36,0.10)',
                border:'1px solid rgba(251,191,36,0.45)',
                padding:'8px 12px', borderRadius:6, fontSize:11, fontWeight:700,
                cursor: catBusy ? 'not-allowed' : 'pointer', opacity: catBusy ? 0.6 : 1,
              }}>
              Merge name-variant dupes
            </button>
            <button
              onClick={async ()=>{
                const ok = await confirmDialog({
                  title:'Normalize city & state?',
                  message:'Standardizes the spelling & casing of city and state on ALL dealers — e.g. "BANGALORE", "bengaluru ", "Banglore" all become "Bangalore". Safe and recommended so filters/permissions match.',
                  confirmText:'Normalize', danger:false,
                });
                if(!ok) return;
                try {
                  const r = await api.normalizeGeo();
                  notify.success('Normalized city/state on ' + (r?.changed||0) + ' of ' + (r?.scanned||0) + ' dealers. Reload to see.');
                  if(onSaved) onSaved();
                } catch(e){ notify.error(e.message || 'Normalize failed'); }
              }}
              title="Standardize city & state spelling/casing across all dealers"
              style={{
                display:'flex', alignItems:'center', gap:6,
                color:'#93c5fd', background:'rgba(99,102,241,0.10)',
                border:'1px solid rgba(99,102,241,0.45)',
                padding:'8px 12px', borderRadius:6, fontSize:11, fontWeight:700, cursor:'pointer',
              }}>
              Normalize City / State
            </button>
            <button onClick={handleCatDeleteMonth} disabled={catBusy}
              title={`Wipe ${month}: category sales + per-dealer target/achieved/status + duplicate dealers (so you can re-upload cleanly)`}
              style={{
                display:'flex', alignItems:'center', gap:6,
                color:'#fca5a5',
                background:'rgba(248,113,113,0.08)',
                border:'1px solid rgba(248,113,113,0.4)',
                padding:'8px 12px', borderRadius:6, fontSize:11, fontWeight:600,
                cursor: catBusy ? 'not-allowed' : 'pointer', opacity: catBusy ? 0.6 : 1,
              }}>
              <Trash2 size={12}/> Reset {month} (clean slate)
            </button>
            <label style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'var(--t3)',marginLeft:6}}>
              <input type="checkbox" checked={catReplace} onChange={e=>setCatReplace(e.target.checked)} />
              Replace existing data for {month}
            </label>
          </div>

          {catMsg && (
            <div style={{
              marginTop:10, padding:'8px 12px', borderRadius:7, fontSize:12, lineHeight:1.4,
              background: catMsg.type === 'success' ? 'rgba(34,197,94,0.10)' : 'rgba(248,113,113,0.10)',
              border: '1px solid ' + (catMsg.type === 'success' ? '#15803d55' : '#7f1d1d55'),
              color:  catMsg.type === 'success' ? '#86efac' : '#fca5a5',
              display:'flex', alignItems:'flex-start', gap:6,
            }}>
              {catMsg.type === 'success' ? <CheckCircle size={13} style={{flexShrink:0, marginTop:1}}/> : <AlertCircle size={13} style={{flexShrink:0, marginTop:1}}/>}
              <span style={{flex:1}}>{catMsg.text}</span>
              <button onClick={() => setCatMsg(null)} style={{background:'none', border:'none', color:'inherit', cursor:'pointer', padding:0}}>×</button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'10px 14px',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
          <Filter size={13} color="var(--t3)"/>
          <span style={{fontSize:12,fontWeight:600,color:'var(--t2)'}}>{filtered.length} dealers — {month}</span>
          <span style={{fontSize:11,color:'var(--t3)'}}>Click any cell to edit</span>
        </div>
        <div style={{overflowX:'auto',maxHeight:'65vh',overflowY:'auto'}}>
          <table>
            <thead>
              <tr>
                <th>Dealer</th>
                {isAdmin&&<th>Salesman</th>}
                <th>City</th>
                <th style={{textAlign:'right',color:'var(--acc)',background:'rgba(99,102,241,.06)'}}>Target</th>
                <th style={{textAlign:'right',color:'#34d399',background:'rgba(52,211,153,.06)'}}>Achieved</th>
                <th style={{textAlign:'right'}}>Ach%</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(dealer => {
                const changed  = !!changes[dealer.id];
                const achieved = num(getVal(dealer.id, 'achieved'));
                const target   = num(getVal(dealer.id, 'target'));
                const status   = getVal(dealer.id, 'status');
                const achPct   = pct(target, achieved);
                const sm       = users[dealer.salesman];
                return (
                  <tr key={dealer.id} style={{
                    background: changed ? 'rgba(99,102,241,0.04)' : 'transparent',
                    borderLeft: `3px solid ${changed ? 'var(--acc)' : 'transparent'}`,
                  }}>
                    <td style={{maxWidth:180}}>
                      <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{dealer.name}</div>
                      {(dealer.category||dealer.categoryType)&&(
                        <div style={{fontSize:9,color:'#818cf8'}}>{dealer.category}{dealer.categoryType?` · ${dealer.categoryType}`:''}</div>
                      )}
                    </td>
                    {isAdmin&&<td>{sm&&<div style={{display:'flex',alignItems:'center',gap:4}}><Avatar user={sm} size={15}/><span style={{fontSize:11}}>{sm.name}</span></div>}</td>}
                    <td style={{fontSize:11,color:'var(--t3)'}}>{dealer.city||'—'}</td>

                    {/* Target - editable */}
                    <td style={{background:'rgba(99,102,241,.04)',padding:'4px 8px'}}>
                      <input type="number" min="0" value={getVal(dealer.id,'target')}
                        onChange={e=>setVal(dealer.id,'target',e.target.value)}
                        style={{width:'100%',minWidth:70,textAlign:'right',background:'transparent',border:'none',
                          borderBottom:`1px solid ${changes[dealer.id]?.target!==undefined?'var(--acc)':'var(--b2)'}`,
                          color:'var(--t1)',fontSize:13,fontWeight:600,padding:'2px 0',outline:'none'}}/>
                    </td>

                    {/* Achieved - editable */}
                    <td style={{background:'rgba(52,211,153,.04)',padding:'4px 8px'}}>
                      <input type="number" min="0" value={getVal(dealer.id,'achieved')}
                        onChange={e=>setVal(dealer.id,'achieved',e.target.value)}
                        style={{width:'100%',minWidth:70,textAlign:'right',background:'transparent',border:'none',
                          borderBottom:`1px solid ${changes[dealer.id]?.achieved!==undefined?'#34d399':'var(--b2)'}`,
                          color:'#34d399',fontSize:13,fontWeight:700,padding:'2px 0',outline:'none'}}/>
                    </td>

                    <td style={{textAlign:'right',fontWeight:700,color:pclr(achPct),fontSize:12,whiteSpace:'nowrap'}}>
                      {target>0 ? spct(target,achieved) : '—'}
                    </td>

                    {/* Status - editable */}
                    <td style={{padding:'4px 8px'}}>
                      <select value={status} onChange={e=>setVal(dealer.id,'status',e.target.value)}
                        style={{background:'transparent',border:'none',
                          borderBottom:`1px solid ${changes[dealer.id]?.status!==undefined?'var(--acc)':'var(--b2)'}`,
                          color:'var(--t2)',fontSize:11,padding:'2px 0',outline:'none',cursor:'pointer',width:'100%'}}>
                        {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length===0&&(
                <tr><td colSpan={isAdmin?7:6} style={{textAlign:'center',padding:40,color:'var(--t3)'}}>No dealers found</td></tr>
              )}
            </tbody>
            {filtered.length>0&&(
              <tfoot>
                <tr>
                  <td colSpan={isAdmin?3:2} style={{fontWeight:700}}>TOTAL ({filtered.length})</td>
                  <td style={{textAlign:'right',fontWeight:700,color:'var(--acc)',background:'rgba(99,102,241,.04)'}}>
                    {filtered.reduce((s,d)=>s+num(getVal(d.id,'target')),0).toLocaleString('en-IN')}
                  </td>
                  <td style={{textAlign:'right',fontWeight:700,color:'#34d399',background:'rgba(52,211,153,.04)'}}>
                    {filtered.reduce((s,d)=>s+num(getVal(d.id,'achieved')),0).toLocaleString('en-IN')}
                  </td>
                  <td style={{textAlign:'right',fontWeight:700,color:'var(--t2)'}}>
                    {(()=>{
                      const t=filtered.reduce((s,d)=>s+num(getVal(d.id,'target')),0);
                      const a=filtered.reduce((s,d)=>s+num(getVal(d.id,'achieved')),0);
                      return t>0?spct(t,a):'—';
                    })()}
                  </td>
                  <td/>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div style={{marginTop:10,fontSize:11,color:'var(--t3)'}}>
        💡 Click any Target, Achieved or Status cell → edit → <strong>Save Changes</strong> saves all to MongoDB.
        Purple highlight = unsaved change.
      </div>
    </div>
  );
}