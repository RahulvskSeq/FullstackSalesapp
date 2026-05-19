// import React, { useState, useMemo } from 'react';
// import { Save, Search, ChevronDown, CheckCircle, Edit3, Filter, AlertCircle } from 'lucide-react';
// import { useMonth } from '../context';
// import { MO as MO_DEFAULT } from '../constants';
// import { num, pct, spct, pclr } from '../utils';
// import { api } from '../api';
// import { Avatar } from './UI';

// const STATUSES = ['STAR','ACTIVE','KEY ACCOUNT','ACHIVERS','RECENTLY INACTIVE','INACTIVE','DEAD','NEW','PROSPECT'];

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

// const STATUSES = ['STAR','ACTIVE','KEY ACCOUNT','ACHIVERS','RECENTLY INACTIVE','INACTIVE','DEAD','NEW','PROSPECT'];

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


import React, { useState, useMemo } from 'react';
import { Save, Search, ChevronDown, CheckCircle, Edit3, Filter, AlertCircle } from 'lucide-react';
import { useMonth } from '../context';
import { MO as MO_DEFAULT } from '../constants';
import { num, pct, spct, pclr } from '../utils';
import { api } from '../api';
import { Avatar } from './UI';

const STATUSES = ['STAR','ACTIVE','KEY ACCOUNT','ACHIVERS','RECENTLY INACTIVE','INACTIVE','DEAD','NEW','PROSPECT'];

export default function MonthlyEntry({ dealers, users, currentUser, onUpdateDealer }) {
  const { MO:ctxMO, currentMonthIdx } = useMonth();
  const MO = ctxMO || MO_DEFAULT;

  const isAdmin = currentUser?.role === 'admin';
  const [month, setMonth]       = useState(MO[currentMonthIdx] || MO[MO.length-1]);
  const [salesman, setSalesman] = useState(isAdmin ? 'all' : currentUser?.id || '');
  const [search, setSearch]     = useState('');
  const [changes, setChanges]   = useState({}); // { dealerId: { achieved, target, status } }
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [errors, setErrors]     = useState([]);

  const moIdx = MO.indexOf(month);
  const salesmen = Object.values(users).filter(u => u.role === 'salesman');

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