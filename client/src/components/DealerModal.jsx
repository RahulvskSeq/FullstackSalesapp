// // // // import React, { useState } from 'react';
// // // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // // import { useMonth } from '../context';
// // // // import { StatusBadge, Avatar, KPI } from './UI';
// // // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // // import { Layers } from 'lucide-react';

// // // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // // //   const {selectedMonthIdx}=useMonth();
// // // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // // //   const isAdmin=currentUser.role==='admin';
// // // //   const [tab,setTab]=useState('overview');
// // // //   const [edit,setEdit]=useState({
// // // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // // //     city:dealer.city||'',state:dealer.state||'',
// // // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // // //   });
// // // //   const [newNote,setNewNote]=useState('');
// // // //   const [noteType,setNoteType]=useState('note');
// // // //   const [dueDate,setDueDate]=useState('');

// // // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // // //   const tp=trendPct(dealer.months);
// // // //   const fc=forecast(dealer.months);

// // // //   const chartData=dealer.months.map((v,i)=>({
// // // //     month:MO[i].slice(0,3),units:v,
// // // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // // //     isSelected:i===selectedMonthIdx
// // // //   }));

// // // //   const save=()=>{
// // // //     const newMonths=[...dealer.months];
// // // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // // //       target:num(edit.target),achieved:num(edit.achieved),
// // // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // // //       city:edit.city.trim(),state:edit.state.trim(),
// // // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // // //       months:newMonths});
// // // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // // //     onClose();
// // // //   };

// // // //   const addNote=()=>{
// // // //     if(!newNote.trim())return;
// // // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // // //     setNewNote('');setDueDate('');
// // // //   };

// // // //   return(
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // // //           <div style={{flex:1,minWidth:200}}>
// // // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // // //               <StatusBadge status={dealer.status}/>
// // // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // // //             </div>
// // // //           </div>
// // // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // // //           </div>
// // // //         </div>

// // // //         <div className="tabs">
// // // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // // //           </button>
// // // //         </div>

// // // //         {tab==='overview'&&(
// // // //           <div>
// // // //             {/* Full KPI grid */}
// // // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // // //             </div>

// // // //             <div style={{marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // // //               </div>
// // // //               <ResponsiveContainer width="100%" height={220}>
// // // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // // //                   </Bar>
// // // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // // //                 </ComposedChart>
// // // //               </ResponsiveContainer>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='monthly'&&(
// // // //           <div>
// // // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // // //             <div className="scroll">
// // // //               <table>
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Month</th>
// // // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // // //                     <th style={{textAlign:'right'}}>Target</th>
// // // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // // //                     <th>Bar</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {[...dealer.months].map((_,di)=>{
// // // //                     const i=dealer.months.length-1-di;
// // // //                     const v=dealer.months[i];
// // // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // // //                     const prev=i>0?dealer.months[i-1]:null;
// // // //                     const diff=prev!=null?v-prev:null;
// // // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // // //                     const maxV=Math.max(...dealer.months,1);
// // // //                     return(
// // // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // // //                         <td style={{minWidth:80}}>
// // // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // // //                             </div>
// // // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // // //                             </div>}
// // // //                           </div>
// // // //                         </td>
// // // //                       </tr>
// // // //                     );
// // // //                   })}
// // // //                 </tbody>
// // // //                 <tfoot>
// // // //                   <tr>
// // // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // // //                     <td colSpan="4"/>
// // // //                   </tr>
// // // //                 </tfoot>
// // // //               </table>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='edit'&&(
// // // //           <div className="g2">
// // // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // // //             <div className="field"><label>Zone</label>
// // // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // // //                 <option value="">None</option>
// // // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>Status</label>
// // // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // // //             {isAdmin&&(
// // // //               <div className="field"><label>Salesman</label>
// // // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // // //                 </select>
// // // //               </div>
// // // //             )}
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // // //             <div className="field full row" style={{gap:8}}>
// // // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // // //               <button className="btn" onClick={onClose}>Cancel</button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='notes'&&(
// // // //           <div>
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // // //                   <option value="note">📝 Note</option>
// // // //                   <option value="call">📞 Call log</option>
// // // //                   <option value="visit">📍 Visit log</option>
// // // //                   <option value="followup">⏰ Follow-up</option>
// // // //                 </select>
// // // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // // //               </div>
// // // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // // //             </div>
// // // //             {followups.length>0&&(
// // // //               <div style={{marginBottom:14}}>
// // // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // // //                 {followups.map(n=>{
// // // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // // //                   return(
// // // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // // //                       <div className="row" style={{marginBottom:4}}>
// // // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // // //                         <span className="spacer"/>
// // // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                       </div>
// // // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // // //                     </div>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}
// // // //             {regularNotes.length>0&&(
// // // //               <div>
// // // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // // //                 {regularNotes.map(n=>(
// // // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // // //                     <div className="row" style={{marginBottom:4}}>
// // // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // // //                       <span className="spacer"/>
// // // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                     </div>
// // // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DealerModal;



// // // // import React, { useState } from 'react';
// // // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // // import { useMonth } from '../context';
// // // // import { StatusBadge, Avatar, KPI } from './UI';
// // // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // // import { Layers } from 'lucide-react';

// // // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[]})=>{
// // // //   const {selectedMonthIdx}=useMonth();
// // // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // // //   const isAdmin=currentUser.role==='admin';
// // // //   const [tab,setTab]=useState('overview');
// // // //   // Match this dealer in outstandingData by name
// // // //   const outRecord = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// // // //   const [edit,setEdit]=useState({
// // // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // // //     city:dealer.city||'',state:dealer.state||'',
// // // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // // //   });
// // // //   const [newNote,setNewNote]=useState('');
// // // //   const [noteType,setNoteType]=useState('note');
// // // //   const [dueDate,setDueDate]=useState('');

// // // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // // //   const tp=trendPct(dealer.months);
// // // //   const fc=forecast(dealer.months);

// // // //   const chartData=dealer.months.map((v,i)=>({
// // // //     month:MO[i].slice(0,3),units:v,
// // // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // // //     isSelected:i===selectedMonthIdx
// // // //   }));

// // // //   const save=()=>{
// // // //     const newMonths=[...dealer.months];
// // // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // // //       target:num(edit.target),achieved:num(edit.achieved),
// // // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // // //       city:edit.city.trim(),state:edit.state.trim(),
// // // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // // //       months:newMonths});
// // // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // // //     onClose();
// // // //   };

// // // //   const addNote=()=>{
// // // //     if(!newNote.trim())return;
// // // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // // //     setNewNote('');setDueDate('');
// // // //   };

// // // //   return(
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // // //           <div style={{flex:1,minWidth:200}}>
// // // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // // //               <StatusBadge status={dealer.status}/>
// // // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // // //             </div>
// // // //           </div>
// // // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // // //           </div>
// // // //         </div>

// // // //         <div className="tabs">
// // // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // // //           </button>
// // // //           <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit'}}>
// // // //             Outstanding {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// // // //           </button>
// // // //         </div>

// // // //         {tab==='overview'&&(
// // // //           <div>
// // // //             {/* Full KPI grid */}
// // // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // // //             </div>

// // // //             <div style={{marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // // //               </div>
// // // //               <ResponsiveContainer width="100%" height={220}>
// // // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // // //                   </Bar>
// // // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // // //                 </ComposedChart>
// // // //               </ResponsiveContainer>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='monthly'&&(
// // // //           <div>
// // // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // // //             <div className="scroll">
// // // //               <table>
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Month</th>
// // // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // // //                     <th style={{textAlign:'right'}}>Target</th>
// // // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // // //                     <th>Bar</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {[...dealer.months].map((_,di)=>{
// // // //                     const i=dealer.months.length-1-di;
// // // //                     const v=dealer.months[i];
// // // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // // //                     const prev=i>0?dealer.months[i-1]:null;
// // // //                     const diff=prev!=null?v-prev:null;
// // // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // // //                     const maxV=Math.max(...dealer.months,1);
// // // //                     return(
// // // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // // //                         <td style={{minWidth:80}}>
// // // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // // //                             </div>
// // // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // // //                             </div>}
// // // //                           </div>
// // // //                         </td>
// // // //                       </tr>
// // // //                     );
// // // //                   })}
// // // //                 </tbody>
// // // //                 <tfoot>
// // // //                   <tr>
// // // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // // //                     <td colSpan="4"/>
// // // //                   </tr>
// // // //                 </tfoot>
// // // //               </table>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='edit'&&(
// // // //           <div className="g2">
// // // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // // //             <div className="field"><label>Zone</label>
// // // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // // //                 <option value="">None</option>
// // // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>Status</label>
// // // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // // //             {isAdmin&&(
// // // //               <div className="field"><label>Salesman</label>
// // // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // // //                 </select>
// // // //               </div>
// // // //             )}
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // // //             <div className="field full row" style={{gap:8}}>
// // // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // // //               <button className="btn" onClick={onClose}>Cancel</button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='notes'&&(
// // // //           <div>
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // // //                   <option value="note">📝 Note</option>
// // // //                   <option value="call">📞 Call log</option>
// // // //                   <option value="visit">📍 Visit log</option>
// // // //                   <option value="followup">⏰ Follow-up</option>
// // // //                 </select>
// // // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // // //               </div>
// // // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // // //             </div>
// // // //             {followups.length>0&&(
// // // //               <div style={{marginBottom:14}}>
// // // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // // //                 {followups.map(n=>{
// // // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // // //                   return(
// // // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // // //                       <div className="row" style={{marginBottom:4}}>
// // // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // // //                         <span className="spacer"/>
// // // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                       </div>
// // // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // // //                     </div>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}
// // // //             {regularNotes.length>0&&(
// // // //               <div>
// // // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // // //                 {regularNotes.map(n=>(
// // // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // // //                     <div className="row" style={{marginBottom:4}}>
// // // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // // //                       <span className="spacer"/>
// // // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                     </div>
// // // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // // //           </div>
// // // //         )}

// // // //         {tab==='outstanding'&&(
// // // //           <div>
// // // //             {!outRecord?(
// // // //               <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
// // // //                 <div style={{fontSize:28,marginBottom:8}}>💳</div>
// // // //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// // // //                 <div style={{fontSize:11}}>Load outstanding data from the Outstanding section first</div>
// // // //               </div>
// // // //             ):(
// // // //               <div>
// // // //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// // // //                   {[
// // // //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// // // //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// // // //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// // // //                   ].map(k=>(
// // // //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// // // //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// // // //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// // // //                   <div style={{overflowX:'auto'}}>
// // // //                     <table>
// // // //                       <thead>
// // // //                         <tr>
// // // //                           <th>Month</th>
// // // //                           <th style={{textAlign:'right'}}>Outstanding</th>
// // // //                           <th style={{textAlign:'right'}}>Change</th>
// // // //                           <th>Bar</th>
// // // //                         </tr>
// // // //                       </thead>
// // // //                       <tbody>
// // // //                         {outRecord.monthCols.map((m,mi)=>{
// // // //                           const v=outRecord.monthlyOutstanding[m]||0;
// // // //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// // // //                           const change=mi>0?v-prev:0;
// // // //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// // // //                           const barW=Math.round((v/maxV)*120);
// // // //                           return(
// // // //                             <tr key={m}>
// // // //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// // // //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// // // //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// // // //                               <td>
// // // //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// // // //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// // // //                                 </div>
// // // //                               </td>
// // // //                             </tr>
// // // //                           );
// // // //                         })}
// // // //                       </tbody>
// // // //                     </table>
// // // //                   </div>
// // // //                 )}
// // // //               </div>
// // // //             )}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DealerModal;


// // // // import React, { useState } from 'react';
// // // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // // import { useMonth } from '../context';
// // // // import { StatusBadge, Avatar, KPI } from './UI';
// // // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // // import { Layers } from 'lucide-react';

// // // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // // //   const MO=ctxMO||MO_CONST;
// // // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // // //   const isAdmin=currentUser.role==='admin';
// // // //   const [tab,setTab]=useState('overview');
// // // //   const [edit,setEdit]=useState({
// // // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // // //     city:dealer.city||'',state:dealer.state||'',
// // // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // // //   });
// // // //   const [newNote,setNewNote]=useState('');
// // // //   const [noteType,setNoteType]=useState('note');
// // // //   const [dueDate,setDueDate]=useState('');

// // // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // // //   const tp=trendPct(dealer.months);
// // // //   const fc=forecast(dealer.months);

// // // //   const chartData=dealer.months.map((v,i)=>({
// // // //     month:MO[i].slice(0,3),units:v,
// // // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // // //     isSelected:i===selectedMonthIdx
// // // //   }));

// // // //   const save=()=>{
// // // //     const newMonths=[...dealer.months];
// // // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // // //       target:num(edit.target),achieved:num(edit.achieved),
// // // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // // //       city:edit.city.trim(),state:edit.state.trim(),
// // // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // // //       months:newMonths});
// // // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // // //     onClose();
// // // //   };

// // // //   const addNote=()=>{
// // // //     if(!newNote.trim())return;
// // // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // // //     setNewNote('');setDueDate('');
// // // //   };

// // // //   return(
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // // //           <div style={{flex:1,minWidth:200}}>
// // // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // // //               <StatusBadge status={dealer.status}/>
// // // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // // //             </div>
// // // //           </div>
// // // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // // //           </div>
// // // //         </div>

// // // //         <div className="tabs">
// // // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // // //           </button>
// // // //         </div>

// // // //         {tab==='overview'&&(
// // // //           <div>
// // // //             {/* Full KPI grid */}
// // // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // // //             </div>

// // // //             <div style={{marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // // //               </div>
// // // //               <ResponsiveContainer width="100%" height={220}>
// // // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // // //                   </Bar>
// // // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // // //                 </ComposedChart>
// // // //               </ResponsiveContainer>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='monthly'&&(
// // // //           <div>
// // // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // // //             <div className="scroll">
// // // //               <table>
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Month</th>
// // // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // // //                     <th style={{textAlign:'right'}}>Target</th>
// // // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // // //                     <th>Bar</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {[...dealer.months].map((_,di)=>{
// // // //                     const i=dealer.months.length-1-di;
// // // //                     const v=dealer.months[i];
// // // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // // //                     const prev=i>0?dealer.months[i-1]:null;
// // // //                     const diff=prev!=null?v-prev:null;
// // // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // // //                     const maxV=Math.max(...dealer.months,1);
// // // //                     return(
// // // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // // //                         <td style={{minWidth:80}}>
// // // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // // //                             </div>
// // // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // // //                             </div>}
// // // //                           </div>
// // // //                         </td>
// // // //                       </tr>
// // // //                     );
// // // //                   })}
// // // //                 </tbody>
// // // //                 <tfoot>
// // // //                   <tr>
// // // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // // //                     <td colSpan="4"/>
// // // //                   </tr>
// // // //                 </tfoot>
// // // //               </table>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='edit'&&(
// // // //           <div className="g2">
// // // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // // //             <div className="field"><label>Zone</label>
// // // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // // //                 <option value="">None</option>
// // // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>Status</label>
// // // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // // //             {isAdmin&&(
// // // //               <div className="field"><label>Salesman</label>
// // // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // // //                 </select>
// // // //               </div>
// // // //             )}
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // // //             <div className="field full row" style={{gap:8}}>
// // // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // // //               <button className="btn" onClick={onClose}>Cancel</button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='notes'&&(
// // // //           <div>
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // // //                   <option value="note">📝 Note</option>
// // // //                   <option value="call">📞 Call log</option>
// // // //                   <option value="visit">📍 Visit log</option>
// // // //                   <option value="followup">⏰ Follow-up</option>
// // // //                 </select>
// // // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // // //               </div>
// // // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // // //             </div>
// // // //             {followups.length>0&&(
// // // //               <div style={{marginBottom:14}}>
// // // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // // //                 {followups.map(n=>{
// // // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // // //                   return(
// // // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // // //                       <div className="row" style={{marginBottom:4}}>
// // // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // // //                         <span className="spacer"/>
// // // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                       </div>
// // // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // // //                     </div>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}
// // // //             {regularNotes.length>0&&(
// // // //               <div>
// // // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // // //                 {regularNotes.map(n=>(
// // // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // // //                     <div className="row" style={{marginBottom:4}}>
// // // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // // //                       <span className="spacer"/>
// // // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                     </div>
// // // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DealerModal;



// // // // import React, { useState } from 'react';
// // // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // // import { useMonth } from '../context';
// // // // import { StatusBadge, Avatar, KPI } from './UI';
// // // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // // import { Layers } from 'lucide-react';

// // // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[]})=>{
// // // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // // //   const MO=ctxMO||MO_CONST;
// // // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // // //   const isAdmin=currentUser.role==='admin';
// // // //   const [tab,setTab]=useState('overview');
// // // //   // Match this dealer in outstandingData by name
// // // //   const outRecord = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// // // //   const [edit,setEdit]=useState({
// // // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // // //     city:dealer.city||'',state:dealer.state||'',
// // // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // // //   });
// // // //   const [newNote,setNewNote]=useState('');
// // // //   const [noteType,setNoteType]=useState('note');
// // // //   const [dueDate,setDueDate]=useState('');

// // // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // // //   const tp=trendPct(dealer.months);
// // // //   const fc=forecast(dealer.months);

// // // //   const chartData=dealer.months.map((v,i)=>({
// // // //     month:MO[i].slice(0,3),units:v,
// // // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // // //     isSelected:i===selectedMonthIdx
// // // //   }));

// // // //   const [saving,setSaving]=useState(false);
// // // //   const [saveErr,setSaveErr]=useState('');

// // // //   const save=async()=>{
// // // //     if(!edit.name.trim()){setSaveErr('Name required');return;}
// // // //     setSaving(true);setSaveErr('');
// // // //     try{
// // // //       const newMonths=[...dealer.months];
// // // //       newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // // //       const updated={...dealer,
// // // //         name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // // //         target:num(edit.target),achieved:num(edit.achieved),
// // // //         creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // // //         city:edit.city.trim(),state:edit.state.trim(),
// // // //         category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // // //         months:newMonths,
// // // //       };
// // // //       // Save to DB if available
// // // //       const token=localStorage.getItem('stp_jwt');
// // // //       if(token&&dealer.id&&!dealer.id.startsWith('local_')){
// // // //         try{
// // // //           await api.updateDealer(dealer.id,{
// // // //             name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
// // // //             target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
// // // //             city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
// // // //           });
// // // //         }catch(e){console.warn('DB update failed:',e.message);}
// // // //       }
// // // //       onSave(updated);
// // // //       onLog('edit',`Updated: ${updated.name}`);
// // // //       onClose();
// // // //     }catch(e){setSaveErr(e.message);}
// // // //     setSaving(false);
// // // //   };

// // // //   const addNote=()=>{
// // // //     if(!newNote.trim())return;
// // // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // // //     setNewNote('');setDueDate('');
// // // //   };

// // // //   return(
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // // //           <div style={{flex:1,minWidth:200}}>
// // // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // // //               <StatusBadge status={dealer.status}/>
// // // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // // //             </div>
// // // //           </div>
// // // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // // //           </div>
// // // //         </div>

// // // //         <div className="tabs">
// // // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // // //           </button>
// // // //           <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit'}}>
// // // //             Outstanding {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// // // //           </button>
// // // //         </div>

// // // //         {tab==='overview'&&(
// // // //           <div>
// // // //             {/* Full KPI grid */}
// // // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // // //             </div>

// // // //             <div style={{marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // // //               </div>
// // // //               <ResponsiveContainer width="100%" height={220}>
// // // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // // //                   </Bar>
// // // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // // //                 </ComposedChart>
// // // //               </ResponsiveContainer>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='monthly'&&(
// // // //           <div>
// // // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // // //             <div className="scroll">
// // // //               <table>
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Month</th>
// // // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // // //                     <th style={{textAlign:'right'}}>Target</th>
// // // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // // //                     <th>Bar</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {[...dealer.months].map((_,di)=>{
// // // //                     const i=dealer.months.length-1-di;
// // // //                     const v=dealer.months[i];
// // // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // // //                     const prev=i>0?dealer.months[i-1]:null;
// // // //                     const diff=prev!=null?v-prev:null;
// // // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // // //                     const maxV=Math.max(...dealer.months,1);
// // // //                     return(
// // // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // // //                         <td style={{minWidth:80}}>
// // // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // // //                             </div>
// // // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // // //                             </div>}
// // // //                           </div>
// // // //                         </td>
// // // //                       </tr>
// // // //                     );
// // // //                   })}
// // // //                 </tbody>
// // // //                 <tfoot>
// // // //                   <tr>
// // // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // // //                     <td colSpan="4"/>
// // // //                   </tr>
// // // //                 </tfoot>
// // // //               </table>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='edit'&&(
// // // //           <div className="g2">
// // // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // // //             <div className="field"><label>Zone</label>
// // // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // // //                 <option value="">None</option>
// // // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>Status</label>
// // // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // // //             {isAdmin&&(
// // // //               <div className="field"><label>Salesman</label>
// // // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // // //                 </select>
// // // //               </div>
// // // //             )}
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // // //             <div className="field full row" style={{gap:8}}>
// // // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // // //               <button className="btn" onClick={onClose}>Cancel</button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='notes'&&(
// // // //           <div>
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // // //                   <option value="note">📝 Note</option>
// // // //                   <option value="call">📞 Call log</option>
// // // //                   <option value="visit">📍 Visit log</option>
// // // //                   <option value="followup">⏰ Follow-up</option>
// // // //                 </select>
// // // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // // //               </div>
// // // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // // //             </div>
// // // //             {followups.length>0&&(
// // // //               <div style={{marginBottom:14}}>
// // // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // // //                 {followups.map(n=>{
// // // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // // //                   return(
// // // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // // //                       <div className="row" style={{marginBottom:4}}>
// // // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // // //                         <span className="spacer"/>
// // // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                       </div>
// // // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // // //                     </div>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}
// // // //             {regularNotes.length>0&&(
// // // //               <div>
// // // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // // //                 {regularNotes.map(n=>(
// // // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // // //                     <div className="row" style={{marginBottom:4}}>
// // // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // // //                       <span className="spacer"/>
// // // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                     </div>
// // // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // // //           </div>
// // // //         )}

// // // //         {tab==='outstanding'&&(
// // // //           <div>
// // // //             {!outRecord?(
// // // //               <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
// // // //                 <div style={{fontSize:28,marginBottom:8}}>💳</div>
// // // //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// // // //                 <div style={{fontSize:11}}>Load outstanding data from the Outstanding section first</div>
// // // //               </div>
// // // //             ):(
// // // //               <div>
// // // //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// // // //                   {[
// // // //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// // // //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// // // //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// // // //                   ].map(k=>(
// // // //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// // // //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// // // //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// // // //                   <div style={{overflowX:'auto'}}>
// // // //                     <table>
// // // //                       <thead>
// // // //                         <tr>
// // // //                           <th>Month</th>
// // // //                           <th style={{textAlign:'right'}}>Outstanding</th>
// // // //                           <th style={{textAlign:'right'}}>Change</th>
// // // //                           <th>Bar</th>
// // // //                         </tr>
// // // //                       </thead>
// // // //                       <tbody>
// // // //                         {outRecord.monthCols.map((m,mi)=>{
// // // //                           const v=outRecord.monthlyOutstanding[m]||0;
// // // //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// // // //                           const change=mi>0?v-prev:0;
// // // //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// // // //                           const barW=Math.round((v/maxV)*120);
// // // //                           return(
// // // //                             <tr key={m}>
// // // //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// // // //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// // // //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// // // //                               <td>
// // // //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// // // //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// // // //                                 </div>
// // // //                               </td>
// // // //                             </tr>
// // // //                           );
// // // //                         })}
// // // //                       </tbody>
// // // //                     </table>
// // // //                   </div>
// // // //                 )}
// // // //               </div>
// // // //             )}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DealerModal;


// // // // import React, { useState } from 'react';
// // // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // // import { useMonth } from '../context';
// // // // import { StatusBadge, Avatar, KPI } from './UI';
// // // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // // import { Layers } from 'lucide-react';

// // // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // // //   const MO=ctxMO||MO_CONST;
// // // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // // //   const isAdmin=currentUser.role==='admin';
// // // //   const [tab,setTab]=useState('overview');
// // // //   const [edit,setEdit]=useState({
// // // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // // //     city:dealer.city||'',state:dealer.state||'',
// // // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // // //   });
// // // //   const [newNote,setNewNote]=useState('');
// // // //   const [noteType,setNoteType]=useState('note');
// // // //   const [dueDate,setDueDate]=useState('');

// // // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // // //   const tp=trendPct(dealer.months);
// // // //   const fc=forecast(dealer.months);

// // // //   const chartData=dealer.months.map((v,i)=>({
// // // //     month:MO[i].slice(0,3),units:v,
// // // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // // //     isSelected:i===selectedMonthIdx
// // // //   }));

// // // //   const save=()=>{
// // // //     const newMonths=[...dealer.months];
// // // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // // //       target:num(edit.target),achieved:num(edit.achieved),
// // // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // // //       city:edit.city.trim(),state:edit.state.trim(),
// // // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // // //       months:newMonths});
// // // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // // //     onClose();
// // // //   };

// // // //   const addNote=()=>{
// // // //     if(!newNote.trim())return;
// // // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // // //     setNewNote('');setDueDate('');
// // // //   };

// // // //   return(
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // // //           <div style={{flex:1,minWidth:200}}>
// // // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // // //               <StatusBadge status={dealer.status}/>
// // // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // // //             </div>
// // // //           </div>
// // // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // // //           </div>
// // // //         </div>

// // // //         <div className="tabs">
// // // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // // //           </button>
// // // //         </div>

// // // //         {tab==='overview'&&(
// // // //           <div>
// // // //             {/* Full KPI grid */}
// // // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // // //             </div>

// // // //             <div style={{marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // // //               </div>
// // // //               <ResponsiveContainer width="100%" height={220}>
// // // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // // //                   </Bar>
// // // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // // //                 </ComposedChart>
// // // //               </ResponsiveContainer>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='monthly'&&(
// // // //           <div>
// // // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // // //             <div className="scroll">
// // // //               <table>
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Month</th>
// // // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // // //                     <th style={{textAlign:'right'}}>Target</th>
// // // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // // //                     <th>Bar</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {[...dealer.months].map((_,di)=>{
// // // //                     const i=dealer.months.length-1-di;
// // // //                     const v=dealer.months[i];
// // // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // // //                     const prev=i>0?dealer.months[i-1]:null;
// // // //                     const diff=prev!=null?v-prev:null;
// // // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // // //                     const maxV=Math.max(...dealer.months,1);
// // // //                     return(
// // // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // // //                         <td style={{minWidth:80}}>
// // // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // // //                             </div>
// // // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // // //                             </div>}
// // // //                           </div>
// // // //                         </td>
// // // //                       </tr>
// // // //                     );
// // // //                   })}
// // // //                 </tbody>
// // // //                 <tfoot>
// // // //                   <tr>
// // // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // // //                     <td colSpan="4"/>
// // // //                   </tr>
// // // //                 </tfoot>
// // // //               </table>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='edit'&&(
// // // //           <div className="g2">
// // // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // // //             <div className="field"><label>Zone</label>
// // // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // // //                 <option value="">None</option>
// // // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>Status</label>
// // // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // // //             {isAdmin&&(
// // // //               <div className="field"><label>Salesman</label>
// // // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // // //                 </select>
// // // //               </div>
// // // //             )}
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // // //             <div className="field full row" style={{gap:8}}>
// // // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // // //               <button className="btn" onClick={onClose}>Cancel</button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='notes'&&(
// // // //           <div>
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // // //                   <option value="note">📝 Note</option>
// // // //                   <option value="call">📞 Call log</option>
// // // //                   <option value="visit">📍 Visit log</option>
// // // //                   <option value="followup">⏰ Follow-up</option>
// // // //                 </select>
// // // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // // //               </div>
// // // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // // //             </div>
// // // //             {followups.length>0&&(
// // // //               <div style={{marginBottom:14}}>
// // // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // // //                 {followups.map(n=>{
// // // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // // //                   return(
// // // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // // //                       <div className="row" style={{marginBottom:4}}>
// // // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // // //                         <span className="spacer"/>
// // // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                       </div>
// // // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // // //                     </div>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}
// // // //             {regularNotes.length>0&&(
// // // //               <div>
// // // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // // //                 {regularNotes.map(n=>(
// // // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // // //                     <div className="row" style={{marginBottom:4}}>
// // // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // // //                       <span className="spacer"/>
// // // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                     </div>
// // // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DealerModal;



// // // // import React, { useState } from 'react';
// // // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // // import { useMonth } from '../context';
// // // // import { StatusBadge, Avatar, KPI } from './UI';
// // // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // // import { Layers } from 'lucide-react';

// // // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[]})=>{
// // // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // // //   const MO=ctxMO||MO_CONST;
// // // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // // //   const isAdmin=currentUser.role==='admin';
// // // //   const [tab,setTab]=useState('overview');
// // // //   // Match this dealer in outstandingData by name
// // // //   const outRecord = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// // // //   const [edit,setEdit]=useState({
// // // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // // //     city:dealer.city||'',state:dealer.state||'',
// // // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // // //   });
// // // //   const [newNote,setNewNote]=useState('');
// // // //   const [noteType,setNoteType]=useState('note');
// // // //   const [dueDate,setDueDate]=useState('');

// // // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // // //   const tp=trendPct(dealer.months);
// // // //   const fc=forecast(dealer.months);

// // // //   const chartData=dealer.months.map((v,i)=>({
// // // //     month:MO[i].slice(0,3),units:v,
// // // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // // //     isSelected:i===selectedMonthIdx
// // // //   }));

// // // //   const [saving,setSaving]=useState(false);
// // // //   const [saveErr,setSaveErr]=useState('');

// // // //   const save=async()=>{
// // // //     if(!edit.name.trim()){setSaveErr('Name required');return;}
// // // //     setSaving(true);setSaveErr('');
// // // //     try{
// // // //       const newMonths=[...dealer.months];
// // // //       newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // // //       const updated={...dealer,
// // // //         name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // // //         target:num(edit.target),achieved:num(edit.achieved),
// // // //         creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // // //         city:edit.city.trim(),state:edit.state.trim(),
// // // //         category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // // //         months:newMonths,
// // // //       };
// // // //       // Save to DB if available
// // // //       const token=localStorage.getItem('stp_jwt');
// // // //       if(token&&dealer.id&&!dealer.id.startsWith('local_')){
// // // //         try{
// // // //           await api.updateDealer(dealer.id,{
// // // //             name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
// // // //             target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
// // // //             city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
// // // //           });
// // // //         }catch(e){console.warn('DB update failed:',e.message);}
// // // //       }
// // // //       onSave(updated);
// // // //       onLog('edit',`Updated: ${updated.name}`);
// // // //       onClose();
// // // //     }catch(e){setSaveErr(e.message);}
// // // //     setSaving(false);
// // // //   };

// // // //   const addNote=()=>{
// // // //     if(!newNote.trim())return;
// // // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // // //     setNewNote('');setDueDate('');
// // // //   };

// // // //   return(
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // // //           <div style={{flex:1,minWidth:200}}>
// // // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // // //               <StatusBadge status={dealer.status}/>
// // // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // // //             </div>
// // // //           </div>
// // // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // // //           </div>
// // // //         </div>

// // // //         <div className="tabs">
// // // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // // //           </button>
// // // //           <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit'}}>
// // // //             Outstanding {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// // // //           </button>
// // // //         </div>

// // // //         {tab==='overview'&&(
// // // //           <div>
// // // //             {/* Full KPI grid */}
// // // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // // //             </div>

// // // //             <div style={{marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // // //               </div>
// // // //               <ResponsiveContainer width="100%" height={220}>
// // // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // // //                   </Bar>
// // // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // // //                 </ComposedChart>
// // // //               </ResponsiveContainer>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='monthly'&&(
// // // //           <div>
// // // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // // //             <div className="scroll">
// // // //               <table>
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Month</th>
// // // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // // //                     <th style={{textAlign:'right'}}>Target</th>
// // // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // // //                     <th>Bar</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {[...dealer.months].map((_,di)=>{
// // // //                     const i=dealer.months.length-1-di;
// // // //                     const v=dealer.months[i];
// // // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // // //                     const prev=i>0?dealer.months[i-1]:null;
// // // //                     const diff=prev!=null?v-prev:null;
// // // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // // //                     const maxV=Math.max(...dealer.months,1);
// // // //                     return(
// // // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // // //                         <td style={{minWidth:80}}>
// // // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // // //                             </div>
// // // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // // //                             </div>}
// // // //                           </div>
// // // //                         </td>
// // // //                       </tr>
// // // //                     );
// // // //                   })}
// // // //                 </tbody>
// // // //                 <tfoot>
// // // //                   <tr>
// // // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // // //                     <td colSpan="4"/>
// // // //                   </tr>
// // // //                 </tfoot>
// // // //               </table>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='edit'&&(
// // // //           <div className="g2">
// // // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // // //             <div className="field"><label>Zone</label>
// // // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // // //                 <option value="">None</option>
// // // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>Status</label>
// // // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // // //             {isAdmin&&(
// // // //               <div className="field"><label>Salesman</label>
// // // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // // //                 </select>
// // // //               </div>
// // // //             )}
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // // //             <div className="field full row" style={{gap:8}}>
// // // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // // //               <button className="btn" onClick={onClose}>Cancel</button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='notes'&&(
// // // //           <div>
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // // //                   <option value="note">📝 Note</option>
// // // //                   <option value="call">📞 Call log</option>
// // // //                   <option value="visit">📍 Visit log</option>
// // // //                   <option value="followup">⏰ Follow-up</option>
// // // //                 </select>
// // // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // // //               </div>
// // // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // // //             </div>
// // // //             {followups.length>0&&(
// // // //               <div style={{marginBottom:14}}>
// // // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // // //                 {followups.map(n=>{
// // // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // // //                   return(
// // // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // // //                       <div className="row" style={{marginBottom:4}}>
// // // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // // //                         <span className="spacer"/>
// // // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                       </div>
// // // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // // //                     </div>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}
// // // //             {regularNotes.length>0&&(
// // // //               <div>
// // // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // // //                 {regularNotes.map(n=>(
// // // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // // //                     <div className="row" style={{marginBottom:4}}>
// // // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // // //                       <span className="spacer"/>
// // // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                     </div>
// // // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // // //           </div>
// // // //         )}

// // // //         {tab==='outstanding'&&(
// // // //           <div>
// // // //             {!outRecord?(
// // // //               <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
// // // //                 <div style={{fontSize:28,marginBottom:8}}>💳</div>
// // // //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// // // //                 <div style={{fontSize:11}}>Load outstanding data from the Outstanding section first</div>
// // // //               </div>
// // // //             ):(
// // // //               <div>
// // // //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// // // //                   {[
// // // //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// // // //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// // // //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// // // //                   ].map(k=>(
// // // //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// // // //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// // // //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// // // //                   <div style={{overflowX:'auto'}}>
// // // //                     <table>
// // // //                       <thead>
// // // //                         <tr>
// // // //                           <th>Month</th>
// // // //                           <th style={{textAlign:'right'}}>Outstanding</th>
// // // //                           <th style={{textAlign:'right'}}>Change</th>
// // // //                           <th>Bar</th>
// // // //                         </tr>
// // // //                       </thead>
// // // //                       <tbody>
// // // //                         {outRecord.monthCols.map((m,mi)=>{
// // // //                           const v=outRecord.monthlyOutstanding[m]||0;
// // // //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// // // //                           const change=mi>0?v-prev:0;
// // // //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// // // //                           const barW=Math.round((v/maxV)*120);
// // // //                           return(
// // // //                             <tr key={m}>
// // // //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// // // //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// // // //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// // // //                               <td>
// // // //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// // // //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// // // //                                 </div>
// // // //                               </td>
// // // //                             </tr>
// // // //                           );
// // // //                         })}
// // // //                       </tbody>
// // // //                     </table>
// // // //                   </div>
// // // //                 )}
// // // //               </div>
// // // //             )}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DealerModal;


// // // // import React, { useState } from 'react';
// // // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // // import { useMonth } from '../context';
// // // // import { StatusBadge, Avatar, KPI } from './UI';
// // // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // // import { Layers } from 'lucide-react';

// // // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // // //   const MO=ctxMO||MO_CONST;
// // // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // // //   const isAdmin=currentUser.role==='admin';
// // // //   const [tab,setTab]=useState('overview');
// // // //   const [showFuModal,setShowFuModal]=useState(false);
// // // //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// // // //   const [fuComment,setFuComment]=useState('');
// // // //   const [fuAmount,setFuAmount]=useState('');
// // // //   const [fuSaving,setFuSaving]=useState(false);
// // // //   const [edit,setEdit]=useState({
// // // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // // //     city:dealer.city||'',state:dealer.state||'',
// // // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // // //   });
// // // //   const [newNote,setNewNote]=useState('');
// // // //   const [noteType,setNoteType]=useState('note');
// // // //   const [dueDate,setDueDate]=useState('');

// // // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // // //   const tp=trendPct(dealer.months);
// // // //   const fc=forecast(dealer.months);

// // // //   const chartData=dealer.months.map((v,i)=>({
// // // //     month:MO[i].slice(0,3),units:v,
// // // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // // //     isSelected:i===selectedMonthIdx
// // // //   }));

// // // //   const save=()=>{
// // // //     const newMonths=[...dealer.months];
// // // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // // //       target:num(edit.target),achieved:num(edit.achieved),
// // // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // // //       city:edit.city.trim(),state:edit.state.trim(),
// // // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // // //       months:newMonths});
// // // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // // //     onClose();
// // // //   };

// // // //   const addNote=()=>{
// // // //     if(!newNote.trim())return;
// // // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // // //     setNewNote('');setDueDate('');
// // // //   };

// // // //   return(
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // // //           <div style={{flex:1,minWidth:200}}>
// // // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // // //               <StatusBadge status={dealer.status}/>
// // // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // // //             </div>
// // // //           </div>
// // // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // // //           </div>
// // // //         </div>

// // // //         <div className="tabs">
// // // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // // //           </button>
// // // //         </div>

// // // //         {tab==='overview'&&(
// // // //           <div>
// // // //             {/* Full KPI grid */}
// // // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // // //             </div>

// // // //             <div style={{marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // // //               </div>
// // // //               <ResponsiveContainer width="100%" height={220}>
// // // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // // //                   </Bar>
// // // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // // //                 </ComposedChart>
// // // //               </ResponsiveContainer>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='monthly'&&(
// // // //           <div>
// // // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // // //             <div className="scroll">
// // // //               <table>
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Month</th>
// // // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // // //                     <th style={{textAlign:'right'}}>Target</th>
// // // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // // //                     <th>Bar</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {[...dealer.months].map((_,di)=>{
// // // //                     const i=dealer.months.length-1-di;
// // // //                     const v=dealer.months[i];
// // // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // // //                     const prev=i>0?dealer.months[i-1]:null;
// // // //                     const diff=prev!=null?v-prev:null;
// // // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // // //                     const maxV=Math.max(...dealer.months,1);
// // // //                     return(
// // // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // // //                         <td style={{minWidth:80}}>
// // // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // // //                             </div>
// // // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // // //                             </div>}
// // // //                           </div>
// // // //                         </td>
// // // //                       </tr>
// // // //                     );
// // // //                   })}
// // // //                 </tbody>
// // // //                 <tfoot>
// // // //                   <tr>
// // // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // // //                     <td colSpan="4"/>
// // // //                   </tr>
// // // //                 </tfoot>
// // // //               </table>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='edit'&&(
// // // //           <div className="g2">
// // // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // // //             <div className="field"><label>Zone</label>
// // // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // // //                 <option value="">None</option>
// // // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>Status</label>
// // // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // // //             {isAdmin&&(
// // // //               <div className="field"><label>Salesman</label>
// // // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // // //                 </select>
// // // //               </div>
// // // //             )}
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // // //             <div className="field full row" style={{gap:8}}>
// // // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // // //               <button className="btn" onClick={onClose}>Cancel</button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='notes'&&(
// // // //           <div>
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // // //                   <option value="note">📝 Note</option>
// // // //                   <option value="call">📞 Call log</option>
// // // //                   <option value="visit">📍 Visit log</option>
// // // //                   <option value="followup">⏰ Follow-up</option>
// // // //                 </select>
// // // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // // //               </div>
// // // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // // //             </div>
// // // //             {followups.length>0&&(
// // // //               <div style={{marginBottom:14}}>
// // // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // // //                 {followups.map(n=>{
// // // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // // //                   return(
// // // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // // //                       <div className="row" style={{marginBottom:4}}>
// // // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // // //                         <span className="spacer"/>
// // // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                       </div>
// // // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // // //                     </div>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}
// // // //             {regularNotes.length>0&&(
// // // //               <div>
// // // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // // //                 {regularNotes.map(n=>(
// // // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // // //                     <div className="row" style={{marginBottom:4}}>
// // // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // // //                       <span className="spacer"/>
// // // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                     </div>
// // // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DealerModal;



// // // // import React, { useState } from 'react';
// // // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // // import { useMonth } from '../context';
// // // // import { StatusBadge, Avatar, KPI } from './UI';
// // // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // // import { Layers } from 'lucide-react';

// // // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[],outFollowups=[],onFollowupSaved})=>{
// // // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // // //   const MO=ctxMO||MO_CONST;
// // // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // // //   const isAdmin=currentUser.role==='admin';
// // // //   const [tab,setTab]=useState('overview');
// // // //   const [showFuModal,setShowFuModal]=useState(false);
// // // //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// // // //   const [fuComment,setFuComment]=useState('');
// // // //   const [fuAmount,setFuAmount]=useState('');
// // // //   const [fuSaving,setFuSaving]=useState(false);
// // // //   // Match this dealer in outstandingData by name
// // // //   const outRecord      = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// // // //   const dealerFollowups= outFollowups.filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim());
// // // //   const pendingFollowups=dealerFollowups.filter(f=>f.status==='pending');
// // // //   const [edit,setEdit]=useState({
// // // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // // //     city:dealer.city||'',state:dealer.state||'',
// // // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // // //   });
// // // //   const [newNote,setNewNote]=useState('');
// // // //   const [noteType,setNoteType]=useState('note');
// // // //   const [dueDate,setDueDate]=useState('');

// // // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // // //   const tp=trendPct(dealer.months);
// // // //   const fc=forecast(dealer.months);

// // // //   const chartData=dealer.months.map((v,i)=>({
// // // //     month:MO[i].slice(0,3),units:v,
// // // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // // //     isSelected:i===selectedMonthIdx
// // // //   }));

// // // //   const addOutFollowup = async () => {
// // // //     if(!fuDate) return;
// // // //     setFuSaving(true);
// // // //     try {
// // // //       await api.addFollowup({
// // // //         dealerName:   dealer.name,
// // // //         salesman:     dealer.salesman,
// // // //         amount:       Number(fuAmount)||0,
// // // //         followupDate: fuDate,
// // // //         comment:      fuComment.trim(),
// // // //       });
// // // //       setFuDate(new Date().toISOString().slice(0,10));
// // // //       setFuComment(''); setFuAmount('');
// // // //       setShowFuModal(false);
// // // //       if(onFollowupSaved) onFollowupSaved();
// // // //     } catch(e){ alert('Failed: '+e.message); }
// // // //     setFuSaving(false);
// // // //   };

// // // //   const markFollowupDone = async (id) => {
// // // //     try {
// // // //       await api.updateFollowup(id, { status:'done' });
// // // //       if(onFollowupSaved) onFollowupSaved();
// // // //     } catch(e){ console.warn(e); }
// // // //   };

// // // //   const deleteFollowup = async (id) => {
// // // //     if(!confirm('Delete follow-up?')) return;
// // // //     try {
// // // //       await api.deleteFollowup(id);
// // // //       if(onFollowupSaved) onFollowupSaved();
// // // //     } catch(e){ console.warn(e); }
// // // //   };

// // // //   const [saving,setSaving]=useState(false);
// // // //   const [saveErr,setSaveErr]=useState('');

// // // //   const save=async()=>{
// // // //     if(!edit.name.trim()){setSaveErr('Name required');return;}
// // // //     setSaving(true);setSaveErr('');
// // // //     try{
// // // //       const newMonths=[...dealer.months];
// // // //       newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // // //       const updated={...dealer,
// // // //         name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // // //         target:num(edit.target),achieved:num(edit.achieved),
// // // //         creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // // //         city:edit.city.trim(),state:edit.state.trim(),
// // // //         category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // // //         months:newMonths,
// // // //       };
// // // //       // Save to DB if available
// // // //       const token=localStorage.getItem('stp_jwt');
// // // //       if(token&&dealer.id&&!dealer.id.startsWith('local_')){
// // // //         try{
// // // //           await api.updateDealer(dealer.id,{
// // // //             name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
// // // //             target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
// // // //             city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
// // // //           });
// // // //         }catch(e){console.warn('DB update failed:',e.message);}
// // // //       }
// // // //       onSave(updated);
// // // //       onLog('edit',`Updated: ${updated.name}`);
// // // //       onClose();
// // // //     }catch(e){setSaveErr(e.message);}
// // // //     setSaving(false);
// // // //   };

// // // //   const addNote=()=>{
// // // //     if(!newNote.trim())return;
// // // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // // //     setNewNote('');setDueDate('');
// // // //   };

// // // //   return(
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // // //           <div style={{flex:1,minWidth:200}}>
// // // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // // //               <StatusBadge status={dealer.status}/>
// // // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // // //             </div>
// // // //           </div>
// // // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // // //           </div>
// // // //         </div>

// // // //         <div className="tabs">
// // // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // // //           </button>
// // // //           <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit',position:'relative'}}>
// // // //             Outstanding {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// // // //           </button>
// // // //         </div>

// // // //         {tab==='overview'&&(
// // // //           <div>
// // // //             {/* Full KPI grid */}
// // // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // // //             </div>

// // // //             <div style={{marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // // //               </div>
// // // //               <ResponsiveContainer width="100%" height={220}>
// // // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // // //                   </Bar>
// // // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // // //                 </ComposedChart>
// // // //               </ResponsiveContainer>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='monthly'&&(
// // // //           <div>
// // // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // // //             <div className="scroll">
// // // //               <table>
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Month</th>
// // // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // // //                     <th style={{textAlign:'right'}}>Target</th>
// // // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // // //                     <th>Bar</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {[...dealer.months].map((_,di)=>{
// // // //                     const i=dealer.months.length-1-di;
// // // //                     const v=dealer.months[i];
// // // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // // //                     const prev=i>0?dealer.months[i-1]:null;
// // // //                     const diff=prev!=null?v-prev:null;
// // // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // // //                     const maxV=Math.max(...dealer.months,1);
// // // //                     return(
// // // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // // //                         <td style={{minWidth:80}}>
// // // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // // //                             </div>
// // // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // // //                             </div>}
// // // //                           </div>
// // // //                         </td>
// // // //                       </tr>
// // // //                     );
// // // //                   })}
// // // //                 </tbody>
// // // //                 <tfoot>
// // // //                   <tr>
// // // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // // //                     <td colSpan="4"/>
// // // //                   </tr>
// // // //                 </tfoot>
// // // //               </table>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='edit'&&(
// // // //           <div className="g2">
// // // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // // //             <div className="field"><label>Zone</label>
// // // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // // //                 <option value="">None</option>
// // // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>Status</label>
// // // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // // //             {isAdmin&&(
// // // //               <div className="field"><label>Salesman</label>
// // // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // // //                 </select>
// // // //               </div>
// // // //             )}
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // // //             <div className="field full row" style={{gap:8}}>
// // // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // // //               <button className="btn" onClick={onClose}>Cancel</button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='notes'&&(
// // // //           <div>
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // // //                   <option value="note">📝 Note</option>
// // // //                   <option value="call">📞 Call log</option>
// // // //                   <option value="visit">📍 Visit log</option>
// // // //                   <option value="followup">⏰ Follow-up</option>
// // // //                 </select>
// // // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // // //               </div>
// // // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // // //             </div>
// // // //             {followups.length>0&&(
// // // //               <div style={{marginBottom:14}}>
// // // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // // //                 {followups.map(n=>{
// // // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // // //                   return(
// // // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // // //                       <div className="row" style={{marginBottom:4}}>
// // // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // // //                         <span className="spacer"/>
// // // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                       </div>
// // // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // // //                     </div>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}
// // // //             {regularNotes.length>0&&(
// // // //               <div>
// // // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // // //                 {regularNotes.map(n=>(
// // // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // // //                     <div className="row" style={{marginBottom:4}}>
// // // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // // //                       <span className="spacer"/>
// // // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                     </div>
// // // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // // //           </div>
// // // //         )}

// // // //         {tab==='outstanding'&&(
// // // //           <div>
// // // //             {/* Follow-up section — always visible */}
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
// // // //                 <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
// // // //                   <Calendar size={13} color="var(--acc)"/> Payment Follow-ups
// // // //                   {pendingFollowups.length>0&&<span style={{background:'var(--accL)',color:'var(--acc)',fontSize:10,padding:'1px 6px',borderRadius:4}}>{pendingFollowups.length} pending</span>}
// // // //                 </div>
// // // //                 <button onClick={()=>setShowFuModal(s=>!s)} className="btnp" style={{fontSize:11,padding:'4px 10px',display:'flex',alignItems:'center',gap:4}}>
// // // //                   <Plus size={11}/> Add Follow-up
// // // //                 </button>
// // // //               </div>

// // // //               {/* Add followup form */}
// // // //               {showFuModal&&(
// // // //                 <div style={{background:'var(--bg1)',borderRadius:8,padding:12,marginBottom:12,border:'1px solid var(--b2)'}}>
// // // //                   <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
// // // //                     <div>
// // // //                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Follow-up Date *</label>
// // // //                       <input type="date" className="inp" value={fuDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setFuDate(e.target.value)} style={{width:'100%'}}/>
// // // //                     </div>
// // // //                     <div>
// // // //                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Expected ₹</label>
// // // //                       <input type="number" className="inp" value={fuAmount} onChange={e=>setFuAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// // // //                     </div>
// // // //                   </div>
// // // //                   <textarea className="inp" value={fuComment} onChange={e=>setFuComment(e.target.value)}
// // // //                     placeholder="Comment e.g. Cheque promised, Will pay after 15th..."
// // // //                     rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit',marginBottom:8}}/>
// // // //                   <div style={{display:'flex',gap:6}}>
// // // //                     <button onClick={addOutFollowup} disabled={fuSaving} className="btnp" style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
// // // //                       {fuSaving?'Saving...':'Save Follow-up'}
// // // //                     </button>
// // // //                     <button onClick={()=>setShowFuModal(false)} className="btn" style={{fontSize:11}}>Cancel</button>
// // // //                   </div>
// // // //                 </div>
// // // //               )}

// // // //               {/* Existing followups */}
// // // //               {dealerFollowups.length>0?(
// // // //                 <div>
// // // //                   {[...dealerFollowups].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate)).map(f=>{
// // // //                     const days    = Math.ceil((new Date(f.followupDate)-new Date().setHours(0,0,0,0))/86400000);
// // // //                     const isDone  = f.status==='done';
// // // //                     const isOver  = !isDone&&days<0;
// // // //                     return(
// // // //                       <div key={f._id} style={{padding:'8px 12px',borderRadius:8,marginBottom:6,
// // // //                         background:isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.06)':'rgba(99,102,241,0.05)',
// // // //                         border:`1px solid ${isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'rgba(99,102,241,0.15)'}`,
// // // //                         opacity:isDone?0.6:1}}>
// // // //                         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
// // // //                           <div style={{flex:1}}>
// // // //                             <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
// // // //                               <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>{f.followupDate}</span>
// // // //                               <span style={{fontSize:10,padding:'1px 5px',borderRadius:4,
// // // //                                 background:isDone?'rgba(52,211,153,0.15)':isOver?'rgba(248,113,113,0.15)':'rgba(99,102,241,0.1)',
// // // //                                 color:isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// // // //                                 {isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// // // //                               </span>
// // // //                               {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// // // //                             </div>
// // // //                             {f.comment&&<div style={{fontSize:11,color:'var(--t3)'}}>{f.comment}</div>}
// // // //                           </div>
// // // //                           <div style={{display:'flex',gap:4}}>
// // // //                             {!isDone&&<button onClick={()=>markFollowupDone(f._id)} style={{fontSize:10,padding:'2px 6px',borderRadius:4,border:'1px solid #34d399',color:'#34d399',background:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Check size={9}/> Done</button>}
// // // //                             <button onClick={()=>deleteFollowup(f._id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><Trash2 size={11}/></button>
// // // //                           </div>
// // // //                         </div>
// // // //                       </div>
// // // //                     );
// // // //                   })}
// // // //                 </div>
// // // //               ):<div style={{fontSize:11,color:'var(--t3)',textAlign:'center',padding:'10px 0'}}>No follow-ups yet — add one above</div>}
// // // //             </div>

// // // //             {!outRecord?(
// // // //               <div style={{textAlign:'center',padding:30,color:'var(--t3)'}}>
// // // //                 <div style={{fontSize:24,marginBottom:8}}>💳</div>
// // // //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// // // //                 <div style={{fontSize:11}}>Upload outstanding Excel from the Outstanding section</div>
// // // //               </div>
// // // //             ):(
// // // //               <div>
// // // //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// // // //                   {[
// // // //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// // // //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// // // //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// // // //                   ].map(k=>(
// // // //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// // // //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// // // //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// // // //                     </div>
// // // //                   ))}
// // // //                 </div>
// // // //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// // // //                   <div style={{overflowX:'auto'}}>
// // // //                     <table>
// // // //                       <thead>
// // // //                         <tr>
// // // //                           <th>Month</th>
// // // //                           <th style={{textAlign:'right'}}>Outstanding</th>
// // // //                           <th style={{textAlign:'right'}}>Change</th>
// // // //                           <th>Bar</th>
// // // //                         </tr>
// // // //                       </thead>
// // // //                       <tbody>
// // // //                         {outRecord.monthCols.map((m,mi)=>{
// // // //                           const v=outRecord.monthlyOutstanding[m]||0;
// // // //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// // // //                           const change=mi>0?v-prev:0;
// // // //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// // // //                           const barW=Math.round((v/maxV)*120);
// // // //                           return(
// // // //                             <tr key={m}>
// // // //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// // // //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// // // //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// // // //                               <td>
// // // //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// // // //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// // // //                                 </div>
// // // //                               </td>
// // // //                             </tr>
// // // //                           );
// // // //                         })}
// // // //                       </tbody>
// // // //                     </table>
// // // //                   </div>
// // // //                 )}
// // // //               </div>
// // // //             )}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DealerModal;


// // // // import React, { useState } from 'react';
// // // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // // import { useMonth } from '../context';
// // // // import { StatusBadge, Avatar, KPI } from './UI';
// // // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // // import { Layers } from 'lucide-react';

// // // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // // //   const MO=ctxMO||MO_CONST;
// // // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // // //   const isAdmin=currentUser.role==='admin';
// // // //   const [tab,setTab]=useState('overview');
// // // //   const [showFuModal,setShowFuModal]=useState(false);
// // // //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// // // //   const [fuComment,setFuComment]=useState('');
// // // //   const [fuAmount,setFuAmount]=useState('');
// // // //   const [fuSaving,setFuSaving]=useState(false);
// // // //   const [edit,setEdit]=useState({
// // // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // // //     city:dealer.city||'',state:dealer.state||'',
// // // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // // //   });
// // // //   const [newNote,setNewNote]=useState('');
// // // //   const [noteType,setNoteType]=useState('note');
// // // //   const [dueDate,setDueDate]=useState('');

// // // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // // //   const tp=trendPct(dealer.months);
// // // //   const fc=forecast(dealer.months);

// // // //   const chartData=dealer.months.map((v,i)=>({
// // // //     month:MO[i].slice(0,3),units:v,
// // // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // // //     isSelected:i===selectedMonthIdx
// // // //   }));

// // // //   const save=()=>{
// // // //     const newMonths=[...dealer.months];
// // // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // // //       target:num(edit.target),achieved:num(edit.achieved),
// // // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // // //       city:edit.city.trim(),state:edit.state.trim(),
// // // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // // //       months:newMonths});
// // // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // // //     onClose();
// // // //   };

// // // //   const addNote=()=>{
// // // //     if(!newNote.trim())return;
// // // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // // //     setNewNote('');setDueDate('');
// // // //   };

// // // //   return(
// // // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // // //           <div style={{flex:1,minWidth:200}}>
// // // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // // //               <StatusBadge status={dealer.status}/>
// // // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // // //             </div>
// // // //           </div>
// // // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // // //           </div>
// // // //         </div>

// // // //         <div className="tabs">
// // // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // // //           </button>
// // // //         </div>

// // // //         {tab==='overview'&&(
// // // //           <div>
// // // //             {/* Full KPI grid */}
// // // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // // //             </div>

// // // //             <div style={{marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // // //               </div>
// // // //               <ResponsiveContainer width="100%" height={220}>
// // // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // // //                   </Bar>
// // // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // // //                 </ComposedChart>
// // // //               </ResponsiveContainer>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='monthly'&&(
// // // //           <div>
// // // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // // //             <div className="scroll">
// // // //               <table>
// // // //                 <thead>
// // // //                   <tr>
// // // //                     <th>Month</th>
// // // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // // //                     <th style={{textAlign:'right'}}>Target</th>
// // // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // // //                     <th>Bar</th>
// // // //                   </tr>
// // // //                 </thead>
// // // //                 <tbody>
// // // //                   {[...dealer.months].map((_,di)=>{
// // // //                     const i=dealer.months.length-1-di;
// // // //                     const v=dealer.months[i];
// // // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // // //                     const prev=i>0?dealer.months[i-1]:null;
// // // //                     const diff=prev!=null?v-prev:null;
// // // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // // //                     const maxV=Math.max(...dealer.months,1);
// // // //                     return(
// // // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // // //                         </td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // // //                         <td style={{minWidth:80}}>
// // // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // // //                             </div>
// // // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // // //                             </div>}
// // // //                           </div>
// // // //                         </td>
// // // //                       </tr>
// // // //                     );
// // // //                   })}
// // // //                 </tbody>
// // // //                 <tfoot>
// // // //                   <tr>
// // // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // // //                     <td colSpan="4"/>
// // // //                   </tr>
// // // //                 </tfoot>
// // // //               </table>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='edit'&&(
// // // //           <div className="g2">
// // // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // // //             <div className="field"><label>Zone</label>
// // // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // // //                 <option value="">None</option>
// // // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>Status</label>
// // // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // // //               </select>
// // // //             </div>
// // // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // // //             {isAdmin&&(
// // // //               <div className="field"><label>Salesman</label>
// // // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // // //                 </select>
// // // //               </div>
// // // //             )}
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // // //             <div className="field full row" style={{gap:8}}>
// // // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // // //               <button className="btn" onClick={onClose}>Cancel</button>
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //         {tab==='notes'&&(
// // // //           <div>
// // // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // // //                   <option value="note">📝 Note</option>
// // // //                   <option value="call">📞 Call log</option>
// // // //                   <option value="visit">📍 Visit log</option>
// // // //                   <option value="followup">⏰ Follow-up</option>
// // // //                 </select>
// // // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // // //               </div>
// // // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // // //             </div>
// // // //             {followups.length>0&&(
// // // //               <div style={{marginBottom:14}}>
// // // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // // //                 {followups.map(n=>{
// // // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // // //                   return(
// // // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // // //                       <div className="row" style={{marginBottom:4}}>
// // // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // // //                         <span className="spacer"/>
// // // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                       </div>
// // // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // // //                     </div>
// // // //                   );
// // // //                 })}
// // // //               </div>
// // // //             )}
// // // //             {regularNotes.length>0&&(
// // // //               <div>
// // // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // // //                 {regularNotes.map(n=>(
// // // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // // //                     <div className="row" style={{marginBottom:4}}>
// // // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // // //                       <span className="spacer"/>
// // // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // // //                     </div>
// // // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // // //                   </div>
// // // //                 ))}
// // // //               </div>
// // // //             )}
// // // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // // //           </div>
// // // //         )}
// // // //       </div>
// // // //     </div>
// // // //   );
// // // // };

// // // // export default DealerModal;



// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { api } from '../api';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[],outFollowups=[],onFollowupSaved})=>{
// // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // //   const MO=ctxMO||MO_CONST;
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   const [showFuModal,setShowFuModal]=useState(false);
// // //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// // //   const [fuComment,setFuComment]=useState('');
// // //   const [fuAmount,setFuAmount]=useState('');
// // //   const [fuSaving,setFuSaving]=useState(false);
// // //   // Match this dealer in outstandingData by name
// // //   const outRecord      = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// // //   // Load followups fresh when modal opens
// // //   const [localFollowups, setLocalFollowups] = useState(
// // //     outFollowups.filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim())
// // //   );
// // //   const [fuLoadErr, setFuLoadErr] = useState('');

// // //   const refreshFollowups = async () => {
// // //     try {
// // //       const all = await api.getFollowups();
// // //       const mine = (all||[]).filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim());
// // //       setLocalFollowups(mine);
// // //       if(onFollowupSaved) onFollowupSaved();
// // //     } catch(e){ setFuLoadErr(e.message); }
// // //   };

// // //   // Load on mount
// // //   React.useEffect(()=>{ refreshFollowups(); },[]);

// // //   const dealerFollowups  = localFollowups;
// // //   const pendingFollowups = dealerFollowups.filter(f=>f.status==='pending');
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const addOutFollowup = async () => {
// // //     if(!fuDate) return;
// // //     setFuSaving(true);
// // //     try {
// // //       await api.addFollowup({
// // //         dealerName:   dealer.name,
// // //         salesman:     dealer.salesman,
// // //         amount:       Number(fuAmount)||0,
// // //         followupDate: fuDate,
// // //         comment:      fuComment.trim(),
// // //       });
// // //       setFuDate(new Date().toISOString().slice(0,10));
// // //       setFuComment(''); setFuAmount('');
// // //       setShowFuModal(false);
// // //       await refreshFollowups();
// // //     } catch(e){ alert('Failed: '+e.message); }
// // //     setFuSaving(false);
// // //   };

// // //   const markFollowupDone = async (id) => {
// // //     try {
// // //       await api.updateFollowup(id, { status:'done' });
// // //       await refreshFollowups();
// // //     } catch(e){ console.warn(e); }
// // //   };

// // //   const deleteFollowup = async (id) => {
// // //     if(!confirm('Delete follow-up?')) return;
// // //     try {
// // //       await api.deleteFollowup(id);
// // //       await refreshFollowups();
// // //     } catch(e){ console.warn(e); }
// // //   };

// // //   const [saving,setSaving]=useState(false);
// // //   const [saveErr,setSaveErr]=useState('');

// // //   const save=async()=>{
// // //     if(!edit.name.trim()){setSaveErr('Name required');return;}
// // //     setSaving(true);setSaveErr('');
// // //     try{
// // //       const newMonths=[...dealer.months];
// // //       newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //       const updated={...dealer,
// // //         name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //         target:num(edit.target),achieved:num(edit.achieved),
// // //         creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //         city:edit.city.trim(),state:edit.state.trim(),
// // //         category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //         months:newMonths,
// // //       };
// // //       // Save to DB if available
// // //       const token=localStorage.getItem('stp_jwt');
// // //       if(token&&dealer.id&&!dealer.id.startsWith('local_')){
// // //         try{
// // //           await api.updateDealer(dealer.id,{
// // //             name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
// // //             target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
// // //             city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
// // //           });
// // //         }catch(e){console.warn('DB update failed:',e.message);}
// // //       }
// // //       onSave(updated);
// // //       onLog('edit',`Updated: ${updated.name}`);
// // //       onClose();
// // //     }catch(e){setSaveErr(e.message);}
// // //     setSaving(false);
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //           <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit',position:'relative'}}>
// // //             Outstanding & Follow-ups {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}

// // //         {tab==='outstanding'&&(
// // //           <div>
// // //             {/* Follow-up section — always visible */}
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
// // //                 <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
// // //                   <Calendar size={13} color="var(--acc)"/> Payment Follow-ups
// // //                   {pendingFollowups.length>0&&<span style={{background:'rgba(248,113,113,0.15)',color:'#f87171',fontSize:10,padding:'1px 6px',borderRadius:4,marginLeft:4}}>{pendingFollowups.length} follow-up{pendingFollowups.length>1?'s':''}</span>}
// // //                 </div>
// // //                 <button onClick={()=>setShowFuModal(s=>!s)} className="btnp" style={{fontSize:11,padding:'4px 10px',display:'flex',alignItems:'center',gap:4}}>
// // //                   <Plus size={11}/> Add Follow-up
// // //                 </button>
// // //               </div>

// // //               {/* Add followup form */}
// // //               {showFuModal&&(
// // //                 <div style={{background:'var(--bg1)',borderRadius:8,padding:12,marginBottom:12,border:'1px solid var(--b2)'}}>
// // //                   <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
// // //                     <div>
// // //                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Follow-up Date *</label>
// // //                       <input type="date" className="inp" value={fuDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setFuDate(e.target.value)} style={{width:'100%'}}/>
// // //                     </div>
// // //                     <div>
// // //                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Expected ₹</label>
// // //                       <input type="number" className="inp" value={fuAmount} onChange={e=>setFuAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// // //                     </div>
// // //                   </div>
// // //                   <textarea className="inp" value={fuComment} onChange={e=>setFuComment(e.target.value)}
// // //                     placeholder="Comment e.g. Cheque promised, Will pay after 15th..."
// // //                     rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit',marginBottom:8}}/>
// // //                   <div style={{display:'flex',gap:6}}>
// // //                     <button onClick={addOutFollowup} disabled={fuSaving} className="btnp" style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
// // //                       {fuSaving?'Saving...':'Save Follow-up'}
// // //                     </button>
// // //                     <button onClick={()=>setShowFuModal(false)} className="btn" style={{fontSize:11}}>Cancel</button>
// // //                   </div>
// // //                 </div>
// // //               )}

// // //               {/* Existing followups */}
// // //               {dealerFollowups.length>0?(
// // //                 <div>
// // //                   {[...dealerFollowups].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate)).map(f=>{
// // //                     const days    = Math.ceil((new Date(f.followupDate)-new Date().setHours(0,0,0,0))/86400000);
// // //                     const isDone  = f.status==='done';
// // //                     const isOver  = !isDone&&days<0;
// // //                     return(
// // //                       <div key={f._id} style={{padding:'8px 12px',borderRadius:8,marginBottom:6,
// // //                         background:isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.06)':'rgba(99,102,241,0.05)',
// // //                         border:`1px solid ${isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'rgba(99,102,241,0.15)'}`,
// // //                         opacity:isDone?0.6:1}}>
// // //                         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
// // //                           <div style={{flex:1}}>
// // //                             <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
// // //                               <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>{f.followupDate}</span>
// // //                               <span style={{fontSize:10,padding:'1px 5px',borderRadius:4,
// // //                                 background:isDone?'rgba(52,211,153,0.15)':isOver?'rgba(248,113,113,0.15)':'rgba(99,102,241,0.1)',
// // //                                 color:isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// // //                                 {isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// // //                               </span>
// // //                               {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// // //                             </div>
// // //                             {f.comment&&<div style={{fontSize:11,color:'var(--t3)'}}>{f.comment}</div>}
// // //                           </div>
// // //                           <div style={{display:'flex',gap:4}}>
// // //                             {!isDone&&<button onClick={()=>markFollowupDone(f._id)} style={{fontSize:10,padding:'2px 6px',borderRadius:4,border:'1px solid #34d399',color:'#34d399',background:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Check size={9}/> Done</button>}
// // //                             <button onClick={()=>deleteFollowup(f._id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><Trash2 size={11}/></button>
// // //                           </div>
// // //                         </div>
// // //                       </div>
// // //                     );
// // //                   })}
// // //                 </div>
// // //               ):<div style={{fontSize:11,color:'var(--t3)',textAlign:'center',padding:'10px 0'}}>No follow-ups yet — add one above</div>}
// // //             </div>

// // //             {!outRecord?(
// // //               <div style={{textAlign:'center',padding:30,color:'var(--t3)'}}>
// // //                 <div style={{fontSize:24,marginBottom:8}}>💳</div>
// // //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// // //                 <div style={{fontSize:11}}>Upload outstanding Excel from the Outstanding section</div>
// // //               </div>
// // //             ):(
// // //               <div>
// // //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// // //                   {[
// // //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// // //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// // //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// // //                   ].map(k=>(
// // //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// // //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// // //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// // //                   <div style={{overflowX:'auto'}}>
// // //                     <table>
// // //                       <thead>
// // //                         <tr>
// // //                           <th>Month</th>
// // //                           <th style={{textAlign:'right'}}>Outstanding</th>
// // //                           <th style={{textAlign:'right'}}>Change</th>
// // //                           <th>Bar</th>
// // //                         </tr>
// // //                       </thead>
// // //                       <tbody>
// // //                         {outRecord.monthCols.map((m,mi)=>{
// // //                           const v=outRecord.monthlyOutstanding[m]||0;
// // //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// // //                           const change=mi>0?v-prev:0;
// // //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// // //                           const barW=Math.round((v/maxV)*120);
// // //                           return(
// // //                             <tr key={m}>
// // //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// // //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// // //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// // //                               <td>
// // //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// // //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// // //                                 </div>
// // //                               </td>
// // //                             </tr>
// // //                           );
// // //                         })}
// // //                       </tbody>
// // //                     </table>
// // //                   </div>
// // //                 )}
// // //               </div>
// // //             )}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;

// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // //   const MO=ctxMO||MO_CONST;
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   const [showFuModal,setShowFuModal]=useState(false);
// // //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// // //   const [fuComment,setFuComment]=useState('');
// // //   const [fuAmount,setFuAmount]=useState('');
// // //   const [fuSaving,setFuSaving]=useState(false);
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const save=()=>{
// // //     const newMonths=[...dealer.months];
// // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //       target:num(edit.target),achieved:num(edit.achieved),
// // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //       city:edit.city.trim(),state:edit.state.trim(),
// // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //       months:newMonths});
// // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // //     onClose();
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;



// // import React, { useState } from 'react';
// // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // import { api } from '../api';
// // import { useMonth } from '../context';
// // import { StatusBadge, Avatar, KPI } from './UI';
// // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // import { Layers } from 'lucide-react';

// // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[],outFollowups=[],onFollowupSaved})=>{
// //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// //   const MO=ctxMO||MO_CONST;
// //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// //   const isAdmin=currentUser.role==='admin';
// //   const [tab,setTab]=useState('overview');
// //   const [showFuModal,setShowFuModal]=useState(false);
// //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// //   const [fuComment,setFuComment]=useState('');
// //   const [fuAmount,setFuAmount]=useState('');
// //   const [fuSaving,setFuSaving]=useState(false);

// //   // Load fresh outstanding for this dealer from DB
// //   const [localOutRecord, setLocalOutRecord] = useState(
// //     outstandingData.find(o=>o.name?.toLowerCase().trim()===dealer.name?.toLowerCase().trim())||null
// //   );

// //   React.useEffect(()=>{
// //     api.getOutstanding().then(data=>{
// //       if(!data?.length) return;
// //       const found = data.find(r=>r.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim());
// //       if(!found) return;
// //       const raw  = found.monthlyOutstanding||{};
// //       const mo   = typeof raw.forEach==='function' ? Object.fromEntries([...raw]) : raw;
// //       const vals = Object.values(mo).map(Number);
// //       setLocalOutRecord({
// //         id:   found._id?.toString(),
// //         name: found.dealerName,
// //         latestOutstanding: vals[vals.length-1]||0,
// //         maxOutstanding:    Math.max(...vals,0),
// //         monthlyOutstanding:mo,
// //         monthCols:         Object.keys(mo),
// //         trend: vals.length>=2?vals[vals.length-1]-vals[vals.length-2]:0,
// //       });
// //     }).catch(()=>{});
// //   },[]);

// //   const outRecord = localOutRecord;
// //   // Load followups fresh when modal opens
// //   const [localFollowups, setLocalFollowups] = useState(
// //     outFollowups.filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim())
// //   );
// //   const [fuLoadErr, setFuLoadErr] = useState('');

// //   const refreshFollowups = async () => {
// //     try {
// //       const all = await api.getFollowups();
// //       const mine = (all||[]).filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim());
// //       setLocalFollowups(mine);
// //       if(onFollowupSaved) onFollowupSaved();
// //     } catch(e){ setFuLoadErr(e.message); }
// //   };

// //   // Load on mount
// //   React.useEffect(()=>{ refreshFollowups(); },[]);

// //   const dealerFollowups  = localFollowups;
// //   const pendingFollowups = dealerFollowups.filter(f=>f.status==='pending');
// //   const [edit,setEdit]=useState({
// //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// //     city:dealer.city||'',state:dealer.state||'',
// //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// //   });
// //   const [newNote,setNewNote]=useState('');
// //   const [noteType,setNoteType]=useState('note');
// //   const [dueDate,setDueDate]=useState('');

// //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// //   const followups=dealerNotes.filter(n=>n.type==='followup');
// //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// //   const tp=trendPct(dealer.months);
// //   const fc=forecast(dealer.months);

// //   const chartData=dealer.months.map((v,i)=>({
// //     month:MO[i].slice(0,3),units:v,
// //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// //     isSelected:i===selectedMonthIdx
// //   }));

// //   const addOutFollowup = async () => {
// //     if(!fuDate) return;
// //     setFuSaving(true);
// //     try {
// //       await api.addFollowup({
// //         dealerName:   dealer.name,
// //         salesman:     dealer.salesman,
// //         amount:       Number(fuAmount)||0,
// //         followupDate: fuDate,
// //         comment:      fuComment.trim(),
// //       });
// //       setFuDate(new Date().toISOString().slice(0,10));
// //       setFuComment(''); setFuAmount('');
// //       setShowFuModal(false);
// //       await refreshFollowups();
// //     } catch(e){ alert('Failed: '+e.message); }
// //     setFuSaving(false);
// //   };

// //   const markFollowupDone = async (id) => {
// //     try {
// //       await api.updateFollowup(id, { status:'done' });
// //       await refreshFollowups();
// //     } catch(e){ console.warn(e); }
// //   };

// //   const deleteFollowup = async (id) => {
// //     if(!confirm('Delete follow-up?')) return;
// //     try {
// //       await api.deleteFollowup(id);
// //       await refreshFollowups();
// //     } catch(e){ console.warn(e); }
// //   };

// //   const [saving,setSaving]=useState(false);
// //   const [saveErr,setSaveErr]=useState('');

// //   const save=async()=>{
// //     if(!edit.name.trim()){setSaveErr('Name required');return;}
// //     setSaving(true);setSaveErr('');
// //     try{
// //       const newMonths=[...dealer.months];
// //       newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// //       const updated={...dealer,
// //         name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
// //         target:num(edit.target),achieved:num(edit.achieved),
// //         creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// //         city:edit.city.trim(),state:edit.state.trim(),
// //         category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// //         months:newMonths,
// //       };
// //       // Save to DB if available
// //       const token=localStorage.getItem('stp_jwt');
// //       if(token&&dealer.id&&!dealer.id.startsWith('local_')){
// //         try{
// //           await api.updateDealer(dealer.id,{
// //             name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
// //             target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
// //             city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
// //           });
// //         }catch(e){console.warn('DB update failed:',e.message);}
// //       }
// //       onSave(updated);
// //       onLog('edit',`Updated: ${updated.name}`);
// //       onClose();
// //     }catch(e){setSaveErr(e.message);}
// //     setSaving(false);
// //   };

// //   const addNote=()=>{
// //     if(!newNote.trim())return;
// //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// //     setNewNote('');setDueDate('');
// //   };

// //   return(
// //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// //           <div style={{flex:1,minWidth:200}}>
// //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// //               <StatusBadge status={dealer.status}/>
// //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// //             </div>
// //           </div>
// //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// //             <button className="btn" onClick={onClose}><X size={14}/></button>
// //           </div>
// //         </div>

// //         <div className="tabs">
// //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// //           </button>
// //           <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit',position:'relative'}}>
// //             Outstanding & Follow-ups {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// //           </button>
// //         </div>

// //         {tab==='overview'&&(
// //           <div>
// //             {/* Full KPI grid */}
// //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// //             </div>

// //             <div style={{marginBottom:14}}>
// //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// //               </div>
// //               <ResponsiveContainer width="100%" height={220}>
// //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// //                   </Bar>
// //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// //                 </ComposedChart>
// //               </ResponsiveContainer>
// //             </div>
// //           </div>
// //         )}

// //         {tab==='monthly'&&(
// //           <div>
// //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// //             <div className="scroll">
// //               <table>
// //                 <thead>
// //                   <tr>
// //                     <th>Month</th>
// //                     <th style={{textAlign:'right'}}>Achieved</th>
// //                     <th style={{textAlign:'right'}}>Target</th>
// //                     <th style={{textAlign:'right'}}>vs Target</th>
// //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// //                     <th>Bar</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {[...dealer.months].map((_,di)=>{
// //                     const i=dealer.months.length-1-di;
// //                     const v=dealer.months[i];
// //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// //                     const prev=i>0?dealer.months[i-1]:null;
// //                     const diff=prev!=null?v-prev:null;
// //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// //                     const vsPct=mt?Math.round((v/mt)*100):null;
// //                     const maxV=Math.max(...dealer.months,1);
// //                     return(
// //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// //                         </td>
// //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// //                         <td style={{minWidth:80}}>
// //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// //                             </div>
// //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// //                             </div>}
// //                           </div>
// //                         </td>
// //                       </tr>
// //                     );
// //                   })}
// //                 </tbody>
// //                 <tfoot>
// //                   <tr>
// //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// //                     <td colSpan="4"/>
// //                   </tr>
// //                 </tfoot>
// //               </table>
// //             </div>
// //           </div>
// //         )}

// //         {tab==='edit'&&(
// //           <div className="g2">
// //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// //             <div className="field"><label>Zone</label>
// //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// //                 <option value="">None</option>
// //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// //               </select>
// //             </div>
// //             <div className="field"><label>Status</label>
// //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// //               </select>
// //             </div>
// //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// //             {isAdmin&&(
// //               <div className="field"><label>Salesman</label>
// //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// //                 </select>
// //               </div>
// //             )}
// //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// //             <div className="field full row" style={{gap:8}}>
// //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// //               <button className="btn" onClick={onClose}>Cancel</button>
// //             </div>
// //           </div>
// //         )}

// //         {tab==='notes'&&(
// //           <div>
// //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// //               <div className="row" style={{gap:8,marginBottom:8}}>
// //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// //                   <option value="note">📝 Note</option>
// //                   <option value="call">📞 Call log</option>
// //                   <option value="visit">📍 Visit log</option>
// //                   <option value="followup">⏰ Follow-up</option>
// //                 </select>
// //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// //               </div>
// //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// //             </div>
// //             {followups.length>0&&(
// //               <div style={{marginBottom:14}}>
// //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// //                 {followups.map(n=>{
// //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// //                   return(
// //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// //                       <div className="row" style={{marginBottom:4}}>
// //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// //                         <span className="spacer"/>
// //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// //                       </div>
// //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //             )}
// //             {regularNotes.length>0&&(
// //               <div>
// //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// //                 {regularNotes.map(n=>(
// //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// //                     <div className="row" style={{marginBottom:4}}>
// //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// //                       <span className="spacer"/>
// //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// //                     </div>
// //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// //                   </div>
// //                 ))}
// //               </div>
// //             )}
// //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// //           </div>
// //         )}

// //         {tab==='outstanding'&&(
// //           <div>
// //             {/* Follow-up section — always visible */}
// //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// //               <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
// //                 <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
// //                   <Calendar size={13} color="var(--acc)"/> Payment Follow-ups
// //                   {pendingFollowups.length>0&&<span style={{background:'rgba(248,113,113,0.15)',color:'#f87171',fontSize:10,padding:'1px 6px',borderRadius:4,marginLeft:4}}>{pendingFollowups.length} follow-up{pendingFollowups.length>1?'s':''}</span>}
// //                 </div>
// //                 <button onClick={()=>setShowFuModal(s=>!s)} className="btnp" style={{fontSize:11,padding:'4px 10px',display:'flex',alignItems:'center',gap:4}}>
// //                   <Plus size={11}/> Add Follow-up
// //                 </button>
// //               </div>

// //               {/* Add followup form */}
// //               {showFuModal&&(
// //                 <div style={{background:'var(--bg1)',borderRadius:8,padding:12,marginBottom:12,border:'1px solid var(--b2)'}}>
// //                   <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
// //                     <div>
// //                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Follow-up Date *</label>
// //                       <input type="date" className="inp" value={fuDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setFuDate(e.target.value)} style={{width:'100%'}}/>
// //                     </div>
// //                     <div>
// //                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Expected ₹</label>
// //                       <input type="number" className="inp" value={fuAmount} onChange={e=>setFuAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// //                     </div>
// //                   </div>
// //                   <textarea className="inp" value={fuComment} onChange={e=>setFuComment(e.target.value)}
// //                     placeholder="Comment e.g. Cheque promised, Will pay after 15th..."
// //                     rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit',marginBottom:8}}/>
// //                   <div style={{display:'flex',gap:6}}>
// //                     <button onClick={addOutFollowup} disabled={fuSaving} className="btnp" style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
// //                       {fuSaving?'Saving...':'Save Follow-up'}
// //                     </button>
// //                     <button onClick={()=>setShowFuModal(false)} className="btn" style={{fontSize:11}}>Cancel</button>
// //                   </div>
// //                 </div>
// //               )}

// //               {/* Existing followups */}
// //               {dealerFollowups.length>0?(
// //                 <div>
// //                   {[...dealerFollowups].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate)).map(f=>{
// //                     const days    = Math.ceil((new Date(f.followupDate)-new Date().setHours(0,0,0,0))/86400000);
// //                     const isDone  = f.status==='done';
// //                     const isOver  = !isDone&&days<0;
// //                     return(
// //                       <div key={f._id} style={{padding:'8px 12px',borderRadius:8,marginBottom:6,
// //                         background:isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.06)':'rgba(99,102,241,0.05)',
// //                         border:`1px solid ${isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'rgba(99,102,241,0.15)'}`,
// //                         opacity:isDone?0.6:1}}>
// //                         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
// //                           <div style={{flex:1}}>
// //                             <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
// //                               <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>{f.followupDate}</span>
// //                               <span style={{fontSize:10,padding:'1px 5px',borderRadius:4,
// //                                 background:isDone?'rgba(52,211,153,0.15)':isOver?'rgba(248,113,113,0.15)':'rgba(99,102,241,0.1)',
// //                                 color:isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// //                                 {isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// //                               </span>
// //                               {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// //                             </div>
// //                             {f.comment&&<div style={{fontSize:11,color:'var(--t3)'}}>{f.comment}</div>}
// //                           </div>
// //                           <div style={{display:'flex',gap:4}}>
// //                             {!isDone&&<button onClick={()=>markFollowupDone(f._id)} style={{fontSize:10,padding:'2px 6px',borderRadius:4,border:'1px solid #34d399',color:'#34d399',background:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Check size={9}/> Done</button>}
// //                             <button onClick={()=>deleteFollowup(f._id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><Trash2 size={11}/></button>
// //                           </div>
// //                         </div>
// //                       </div>
// //                     );
// //                   })}
// //                 </div>
// //               ):<div style={{fontSize:11,color:'var(--t3)',textAlign:'center',padding:'10px 0'}}>No follow-ups yet — add one above</div>}
// //             </div>

// //             {!outRecord?(
// //               <div style={{textAlign:'center',padding:30,color:'var(--t3)'}}>
// //                 <div style={{fontSize:24,marginBottom:8}}>💳</div>
// //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// //                 <div style={{fontSize:11}}>Upload outstanding Excel from the Outstanding section</div>
// //               </div>
// //             ):(
// //               <div>
// //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// //                   {[
// //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// //                   ].map(k=>(
// //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// //                   <div style={{overflowX:'auto'}}>
// //                     <table>
// //                       <thead>
// //                         <tr>
// //                           <th>Month</th>
// //                           <th style={{textAlign:'right'}}>Outstanding</th>
// //                           <th style={{textAlign:'right'}}>Change</th>
// //                           <th>Bar</th>
// //                         </tr>
// //                       </thead>
// //                       <tbody>
// //                         {outRecord.monthCols.map((m,mi)=>{
// //                           const v=outRecord.monthlyOutstanding[m]||0;
// //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// //                           const change=mi>0?v-prev:0;
// //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// //                           const barW=Math.round((v/maxV)*120);
// //                           return(
// //                             <tr key={m}>
// //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// //                               <td>
// //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// //                                 </div>
// //                               </td>
// //                             </tr>
// //                           );
// //                         })}
// //                       </tbody>
// //                     </table>
// //                   </div>
// //                 )}
// //               </div>
// //             )}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default DealerModal;



// // sample confrugration







// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // //   const {selectedMonthIdx}=useMonth();
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const save=()=>{
// // //     const newMonths=[...dealer.months];
// // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //       target:num(edit.target),achieved:num(edit.achieved),
// // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //       city:edit.city.trim(),state:edit.state.trim(),
// // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //       months:newMonths});
// // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // //     onClose();
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;



// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[]})=>{
// // //   const {selectedMonthIdx}=useMonth();
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   // Match this dealer in outstandingData by name
// // //   const outRecord = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const save=()=>{
// // //     const newMonths=[...dealer.months];
// // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //       target:num(edit.target),achieved:num(edit.achieved),
// // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //       city:edit.city.trim(),state:edit.state.trim(),
// // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //       months:newMonths});
// // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // //     onClose();
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //           <button className={`tab ${tab==='samples'?'active':''}`} onClick={()=>setTab('samples')}>
//                   📦 Samples
//                 </button>
//                 <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit'}}>
// // //             Outstanding {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}

// // //         {tab==='samples'&&(
//           <SamplesTab dealer={dealer} currentUser={currentUser}/>
//         )}
//         {tab==='outstanding'&&(
// // //           <div>
// // //             {!outRecord?(
// // //               <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
// // //                 <div style={{fontSize:28,marginBottom:8}}>💳</div>
// // //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// // //                 <div style={{fontSize:11}}>Load outstanding data from the Outstanding section first</div>
// // //               </div>
// // //             ):(
// // //               <div>
// // //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// // //                   {[
// // //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// // //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// // //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// // //                   ].map(k=>(
// // //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// // //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// // //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// // //                   <div style={{overflowX:'auto'}}>
// // //                     <table>
// // //                       <thead>
// // //                         <tr>
// // //                           <th>Month</th>
// // //                           <th style={{textAlign:'right'}}>Outstanding</th>
// // //                           <th style={{textAlign:'right'}}>Change</th>
// // //                           <th>Bar</th>
// // //                         </tr>
// // //                       </thead>
// // //                       <tbody>
// // //                         {outRecord.monthCols.map((m,mi)=>{
// // //                           const v=outRecord.monthlyOutstanding[m]||0;
// // //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// // //                           const change=mi>0?v-prev:0;
// // //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// // //                           const barW=Math.round((v/maxV)*120);
// // //                           return(
// // //                             <tr key={m}>
// // //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// // //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// // //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// // //                               <td>
// // //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// // //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// // //                                 </div>
// // //                               </td>
// // //                             </tr>
// // //                           );
// // //                         })}
// // //                       </tbody>
// // //                     </table>
// // //                   </div>
// // //                 )}
// // //               </div>
// // //             )}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;


// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // //   const MO=ctxMO||MO_CONST;
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const save=()=>{
// // //     const newMonths=[...dealer.months];
// // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //       target:num(edit.target),achieved:num(edit.achieved),
// // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //       city:edit.city.trim(),state:edit.state.trim(),
// // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //       months:newMonths});
// // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // //     onClose();
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;



// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[]})=>{
// // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // //   const MO=ctxMO||MO_CONST;
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   // Match this dealer in outstandingData by name
// // //   const outRecord = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const [saving,setSaving]=useState(false);
// // //   const [saveErr,setSaveErr]=useState('');

// // //   const save=async()=>{
// // //     if(!edit.name.trim()){setSaveErr('Name required');return;}
// // //     setSaving(true);setSaveErr('');
// // //     try{
// // //       const newMonths=[...dealer.months];
// // //       newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //       const updated={...dealer,
// // //         name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //         target:num(edit.target),achieved:num(edit.achieved),
// // //         creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //         city:edit.city.trim(),state:edit.state.trim(),
// // //         category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //         months:newMonths,
// // //       };
// // //       // Save to DB if available
// // //       const token=localStorage.getItem('stp_jwt');
// // //       if(token&&dealer.id&&!dealer.id.startsWith('local_')){
// // //         try{
// // //           await api.updateDealer(dealer.id,{
// // //             name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
// // //             target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
// // //             city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
// // //           });
// // //         }catch(e){console.warn('DB update failed:',e.message);}
// // //       }
// // //       onSave(updated);
// // //       onLog('edit',`Updated: ${updated.name}`);
// // //       onClose();
// // //     }catch(e){setSaveErr(e.message);}
// // //     setSaving(false);
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //           <button className={`tab ${tab==='samples'?'active':''}`} onClick={()=>setTab('samples')}>
//                   📦 Samples
//                 </button>
//                 <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit'}}>
// // //             Outstanding {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}

// // //         {tab==='samples'&&(
//           <SamplesTab dealer={dealer} currentUser={currentUser}/>
//         )}
//         {tab==='outstanding'&&(
// // //           <div>
// // //             {!outRecord?(
// // //               <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
// // //                 <div style={{fontSize:28,marginBottom:8}}>💳</div>
// // //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// // //                 <div style={{fontSize:11}}>Load outstanding data from the Outstanding section first</div>
// // //               </div>
// // //             ):(
// // //               <div>
// // //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// // //                   {[
// // //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// // //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// // //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// // //                   ].map(k=>(
// // //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// // //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// // //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// // //                   <div style={{overflowX:'auto'}}>
// // //                     <table>
// // //                       <thead>
// // //                         <tr>
// // //                           <th>Month</th>
// // //                           <th style={{textAlign:'right'}}>Outstanding</th>
// // //                           <th style={{textAlign:'right'}}>Change</th>
// // //                           <th>Bar</th>
// // //                         </tr>
// // //                       </thead>
// // //                       <tbody>
// // //                         {outRecord.monthCols.map((m,mi)=>{
// // //                           const v=outRecord.monthlyOutstanding[m]||0;
// // //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// // //                           const change=mi>0?v-prev:0;
// // //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// // //                           const barW=Math.round((v/maxV)*120);
// // //                           return(
// // //                             <tr key={m}>
// // //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// // //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// // //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// // //                               <td>
// // //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// // //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// // //                                 </div>
// // //                               </td>
// // //                             </tr>
// // //                           );
// // //                         })}
// // //                       </tbody>
// // //                     </table>
// // //                   </div>
// // //                 )}
// // //               </div>
// // //             )}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;


// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // //   const MO=ctxMO||MO_CONST;
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const save=()=>{
// // //     const newMonths=[...dealer.months];
// // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //       target:num(edit.target),achieved:num(edit.achieved),
// // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //       city:edit.city.trim(),state:edit.state.trim(),
// // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //       months:newMonths});
// // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // //     onClose();
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;



// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2 } from 'lucide-react';
// // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[]})=>{
// // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // //   const MO=ctxMO||MO_CONST;
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   // Match this dealer in outstandingData by name
// // //   const outRecord = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const [saving,setSaving]=useState(false);
// // //   const [saveErr,setSaveErr]=useState('');

// // //   const save=async()=>{
// // //     if(!edit.name.trim()){setSaveErr('Name required');return;}
// // //     setSaving(true);setSaveErr('');
// // //     try{
// // //       const newMonths=[...dealer.months];
// // //       newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //       const updated={...dealer,
// // //         name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //         target:num(edit.target),achieved:num(edit.achieved),
// // //         creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //         city:edit.city.trim(),state:edit.state.trim(),
// // //         category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //         months:newMonths,
// // //       };
// // //       // Save to DB if available
// // //       const token=localStorage.getItem('stp_jwt');
// // //       if(token&&dealer.id&&!dealer.id.startsWith('local_')){
// // //         try{
// // //           await api.updateDealer(dealer.id,{
// // //             name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
// // //             target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
// // //             city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
// // //           });
// // //         }catch(e){console.warn('DB update failed:',e.message);}
// // //       }
// // //       onSave(updated);
// // //       onLog('edit',`Updated: ${updated.name}`);
// // //       onClose();
// // //     }catch(e){setSaveErr(e.message);}
// // //     setSaving(false);
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //           <button className={`tab ${tab==='samples'?'active':''}`} onClick={()=>setTab('samples')}>
//                   📦 Samples
//                 </button>
//                 <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit'}}>
// // //             Outstanding {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}

// // //         {tab==='samples'&&(
//           <SamplesTab dealer={dealer} currentUser={currentUser}/>
//         )}
//         {tab==='outstanding'&&(
// // //           <div>
// // //             {!outRecord?(
// // //               <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
// // //                 <div style={{fontSize:28,marginBottom:8}}>💳</div>
// // //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// // //                 <div style={{fontSize:11}}>Load outstanding data from the Outstanding section first</div>
// // //               </div>
// // //             ):(
// // //               <div>
// // //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// // //                   {[
// // //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// // //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// // //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// // //                   ].map(k=>(
// // //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// // //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// // //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// // //                   <div style={{overflowX:'auto'}}>
// // //                     <table>
// // //                       <thead>
// // //                         <tr>
// // //                           <th>Month</th>
// // //                           <th style={{textAlign:'right'}}>Outstanding</th>
// // //                           <th style={{textAlign:'right'}}>Change</th>
// // //                           <th>Bar</th>
// // //                         </tr>
// // //                       </thead>
// // //                       <tbody>
// // //                         {outRecord.monthCols.map((m,mi)=>{
// // //                           const v=outRecord.monthlyOutstanding[m]||0;
// // //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// // //                           const change=mi>0?v-prev:0;
// // //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// // //                           const barW=Math.round((v/maxV)*120);
// // //                           return(
// // //                             <tr key={m}>
// // //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// // //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// // //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// // //                               <td>
// // //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// // //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// // //                                 </div>
// // //                               </td>
// // //                             </tr>
// // //                           );
// // //                         })}
// // //                       </tbody>
// // //                     </table>
// // //                   </div>
// // //                 )}
// // //               </div>
// // //             )}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;


// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // //   const MO=ctxMO||MO_CONST;
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   const [showFuModal,setShowFuModal]=useState(false);
// // //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// // //   const [fuComment,setFuComment]=useState('');
// // //   const [fuAmount,setFuAmount]=useState('');
// // //   const [fuSaving,setFuSaving]=useState(false);
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const save=()=>{
// // //     const newMonths=[...dealer.months];
// // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //       target:num(edit.target),achieved:num(edit.achieved),
// // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //       city:edit.city.trim(),state:edit.state.trim(),
// // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //       months:newMonths});
// // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // //     onClose();
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;



// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[],outFollowups=[],onFollowupSaved})=>{
// // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // //   const MO=ctxMO||MO_CONST;
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   const [showFuModal,setShowFuModal]=useState(false);
// // //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// // //   const [fuComment,setFuComment]=useState('');
// // //   const [fuAmount,setFuAmount]=useState('');
// // //   const [fuSaving,setFuSaving]=useState(false);
// // //   // Match this dealer in outstandingData by name
// // //   const outRecord      = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// // //   const dealerFollowups= outFollowups.filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim());
// // //   const pendingFollowups=dealerFollowups.filter(f=>f.status==='pending');
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const addOutFollowup = async () => {
// // //     if(!fuDate) return;
// // //     setFuSaving(true);
// // //     try {
// // //       await api.addFollowup({
// // //         dealerName:   dealer.name,
// // //         salesman:     dealer.salesman,
// // //         amount:       Number(fuAmount)||0,
// // //         followupDate: fuDate,
// // //         comment:      fuComment.trim(),
// // //       });
// // //       setFuDate(new Date().toISOString().slice(0,10));
// // //       setFuComment(''); setFuAmount('');
// // //       setShowFuModal(false);
// // //       if(onFollowupSaved) onFollowupSaved();
// // //     } catch(e){ alert('Failed: '+e.message); }
// // //     setFuSaving(false);
// // //   };

// // //   const markFollowupDone = async (id) => {
// // //     try {
// // //       await api.updateFollowup(id, { status:'done' });
// // //       if(onFollowupSaved) onFollowupSaved();
// // //     } catch(e){ console.warn(e); }
// // //   };

// // //   const deleteFollowup = async (id) => {
// // //     if(!confirm('Delete follow-up?')) return;
// // //     try {
// // //       await api.deleteFollowup(id);
// // //       if(onFollowupSaved) onFollowupSaved();
// // //     } catch(e){ console.warn(e); }
// // //   };

// // //   const [saving,setSaving]=useState(false);
// // //   const [saveErr,setSaveErr]=useState('');

// // //   const save=async()=>{
// // //     if(!edit.name.trim()){setSaveErr('Name required');return;}
// // //     setSaving(true);setSaveErr('');
// // //     try{
// // //       const newMonths=[...dealer.months];
// // //       newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //       const updated={...dealer,
// // //         name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //         target:num(edit.target),achieved:num(edit.achieved),
// // //         creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //         city:edit.city.trim(),state:edit.state.trim(),
// // //         category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //         months:newMonths,
// // //       };
// // //       // Save to DB if available
// // //       const token=localStorage.getItem('stp_jwt');
// // //       if(token&&dealer.id&&!dealer.id.startsWith('local_')){
// // //         try{
// // //           await api.updateDealer(dealer.id,{
// // //             name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
// // //             target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
// // //             city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
// // //           });
// // //         }catch(e){console.warn('DB update failed:',e.message);}
// // //       }
// // //       onSave(updated);
// // //       onLog('edit',`Updated: ${updated.name}`);
// // //       onClose();
// // //     }catch(e){setSaveErr(e.message);}
// // //     setSaving(false);
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //           <button className={`tab ${tab==='samples'?'active':''}`} onClick={()=>setTab('samples')}>
//                   📦 Samples
//                 </button>
//                 <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit',position:'relative'}}>
// // //             Outstanding {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}

// // //         {tab==='samples'&&(
//           <SamplesTab dealer={dealer} currentUser={currentUser}/>
//         )}
//         {tab==='outstanding'&&(
// // //           <div>
// // //             {/* Follow-up section — always visible */}
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
// // //                 <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
// // //                   <Calendar size={13} color="var(--acc)"/> Payment Follow-ups
// // //                   {pendingFollowups.length>0&&<span style={{background:'var(--accL)',color:'var(--acc)',fontSize:10,padding:'1px 6px',borderRadius:4}}>{pendingFollowups.length} pending</span>}
// // //                 </div>
// // //                 <button onClick={()=>setShowFuModal(s=>!s)} className="btnp" style={{fontSize:11,padding:'4px 10px',display:'flex',alignItems:'center',gap:4}}>
// // //                   <Plus size={11}/> Add Follow-up
// // //                 </button>
// // //               </div>

// // //               {/* Add followup form */}
// // //               {showFuModal&&(
// // //                 <div style={{background:'var(--bg1)',borderRadius:8,padding:12,marginBottom:12,border:'1px solid var(--b2)'}}>
// // //                   <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
// // //                     <div>
// // //                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Follow-up Date *</label>
// // //                       <input type="date" className="inp" value={fuDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setFuDate(e.target.value)} style={{width:'100%'}}/>
// // //                     </div>
// // //                     <div>
// // //                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Expected ₹</label>
// // //                       <input type="number" className="inp" value={fuAmount} onChange={e=>setFuAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
// // //                     </div>
// // //                   </div>
// // //                   <textarea className="inp" value={fuComment} onChange={e=>setFuComment(e.target.value)}
// // //                     placeholder="Comment e.g. Cheque promised, Will pay after 15th..."
// // //                     rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit',marginBottom:8}}/>
// // //                   <div style={{display:'flex',gap:6}}>
// // //                     <button onClick={addOutFollowup} disabled={fuSaving} className="btnp" style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
// // //                       {fuSaving?'Saving...':'Save Follow-up'}
// // //                     </button>
// // //                     <button onClick={()=>setShowFuModal(false)} className="btn" style={{fontSize:11}}>Cancel</button>
// // //                   </div>
// // //                 </div>
// // //               )}

// // //               {/* Existing followups */}
// // //               {dealerFollowups.length>0?(
// // //                 <div>
// // //                   {[...dealerFollowups].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate)).map(f=>{
// // //                     const days    = Math.ceil((new Date(f.followupDate)-new Date().setHours(0,0,0,0))/86400000);
// // //                     const isDone  = f.status==='done';
// // //                     const isOver  = !isDone&&days<0;
// // //                     return(
// // //                       <div key={f._id} style={{padding:'8px 12px',borderRadius:8,marginBottom:6,
// // //                         background:isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.06)':'rgba(99,102,241,0.05)',
// // //                         border:`1px solid ${isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'rgba(99,102,241,0.15)'}`,
// // //                         opacity:isDone?0.6:1}}>
// // //                         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
// // //                           <div style={{flex:1}}>
// // //                             <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
// // //                               <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>{f.followupDate}</span>
// // //                               <span style={{fontSize:10,padding:'1px 5px',borderRadius:4,
// // //                                 background:isDone?'rgba(52,211,153,0.15)':isOver?'rgba(248,113,113,0.15)':'rgba(99,102,241,0.1)',
// // //                                 color:isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
// // //                                 {isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
// // //                               </span>
// // //                               {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
// // //                             </div>
// // //                             {f.comment&&<div style={{fontSize:11,color:'var(--t3)'}}>{f.comment}</div>}
// // //                           </div>
// // //                           <div style={{display:'flex',gap:4}}>
// // //                             {!isDone&&<button onClick={()=>markFollowupDone(f._id)} style={{fontSize:10,padding:'2px 6px',borderRadius:4,border:'1px solid #34d399',color:'#34d399',background:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Check size={9}/> Done</button>}
// // //                             <button onClick={()=>deleteFollowup(f._id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><Trash2 size={11}/></button>
// // //                           </div>
// // //                         </div>
// // //                       </div>
// // //                     );
// // //                   })}
// // //                 </div>
// // //               ):<div style={{fontSize:11,color:'var(--t3)',textAlign:'center',padding:'10px 0'}}>No follow-ups yet — add one above</div>}
// // //             </div>

// // //             {!outRecord?(
// // //               <div style={{textAlign:'center',padding:30,color:'var(--t3)'}}>
// // //                 <div style={{fontSize:24,marginBottom:8}}>💳</div>
// // //                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
// // //                 <div style={{fontSize:11}}>Upload outstanding Excel from the Outstanding section</div>
// // //               </div>
// // //             ):(
// // //               <div>
// // //                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
// // //                   {[
// // //                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
// // //                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
// // //                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
// // //                   ].map(k=>(
// // //                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// // //                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
// // //                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
// // //                     </div>
// // //                   ))}
// // //                 </div>
// // //                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
// // //                   <div style={{overflowX:'auto'}}>
// // //                     <table>
// // //                       <thead>
// // //                         <tr>
// // //                           <th>Month</th>
// // //                           <th style={{textAlign:'right'}}>Outstanding</th>
// // //                           <th style={{textAlign:'right'}}>Change</th>
// // //                           <th>Bar</th>
// // //                         </tr>
// // //                       </thead>
// // //                       <tbody>
// // //                         {outRecord.monthCols.map((m,mi)=>{
// // //                           const v=outRecord.monthlyOutstanding[m]||0;
// // //                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
// // //                           const change=mi>0?v-prev:0;
// // //                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
// // //                           const barW=Math.round((v/maxV)*120);
// // //                           return(
// // //                             <tr key={m}>
// // //                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
// // //                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
// // //                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
// // //                               <td>
// // //                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
// // //                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
// // //                                 </div>
// // //                               </td>
// // //                             </tr>
// // //                           );
// // //                         })}
// // //                       </tbody>
// // //                     </table>
// // //                   </div>
// // //                 )}
// // //               </div>
// // //             )}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;


// // // import React, { useState } from 'react';
// // // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // // import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // // import { useMonth } from '../context';
// // // import { StatusBadge, Avatar, KPI } from './UI';
// // // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // // import { Layers } from 'lucide-react';

// // // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
// // //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// // //   const MO=ctxMO||MO_CONST;
// // //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// // //   const isAdmin=currentUser.role==='admin';
// // //   const [tab,setTab]=useState('overview');
// // //   const [showFuModal,setShowFuModal]=useState(false);
// // //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// // //   const [fuComment,setFuComment]=useState('');
// // //   const [fuAmount,setFuAmount]=useState('');
// // //   const [fuSaving,setFuSaving]=useState(false);
// // //   const [edit,setEdit]=useState({
// // //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// // //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// // //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// // //     city:dealer.city||'',state:dealer.state||'',
// // //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// // //   });
// // //   const [newNote,setNewNote]=useState('');
// // //   const [noteType,setNoteType]=useState('note');
// // //   const [dueDate,setDueDate]=useState('');

// // //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// // //   const followups=dealerNotes.filter(n=>n.type==='followup');
// // //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// // //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// // //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// // //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// // //   const tp=trendPct(dealer.months);
// // //   const fc=forecast(dealer.months);

// // //   const chartData=dealer.months.map((v,i)=>({
// // //     month:MO[i].slice(0,3),units:v,
// // //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// // //     isSelected:i===selectedMonthIdx
// // //   }));

// // //   const save=()=>{
// // //     const newMonths=[...dealer.months];
// // //     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// // //     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
// // //       target:num(edit.target),achieved:num(edit.achieved),
// // //       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// // //       city:edit.city.trim(),state:edit.state.trim(),
// // //       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// // //       months:newMonths});
// // //     onLog('edit',`Updated dealer: ${edit.name}`);
// // //     onClose();
// // //   };

// // //   const addNote=()=>{
// // //     if(!newNote.trim())return;
// // //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// // //     setNewNote('');setDueDate('');
// // //   };

// // //   return(
// // //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// // //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// // //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// // //           <div style={{flex:1,minWidth:200}}>
// // //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// // //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// // //               <StatusBadge status={dealer.status}/>
// // //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// // //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// // //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// // //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// // //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// // //             </div>
// // //           </div>
// // //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// // //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// // //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// // //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// // //             <button className="btn" onClick={onClose}><X size={14}/></button>
// // //           </div>
// // //         </div>

// // //         <div className="tabs">
// // //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// // //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// // //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// // //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// // //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// // //           </button>
// // //         </div>

// // //         {tab==='overview'&&(
// // //           <div>
// // //             {/* Full KPI grid */}
// // //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// // //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// // //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// // //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// // //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// // //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// // //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// // //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// // //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// // //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// // //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// // //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// // //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// // //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// // //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// // //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// // //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// // //             </div>

// // //             <div style={{marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// // //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// // //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// // //               </div>
// // //               <ResponsiveContainer width="100%" height={220}>
// // //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// // //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// // //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// // //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// // //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// // //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// // //                   </Bar>
// // //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// // //                 </ComposedChart>
// // //               </ResponsiveContainer>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='monthly'&&(
// // //           <div>
// // //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// // //             <div className="scroll">
// // //               <table>
// // //                 <thead>
// // //                   <tr>
// // //                     <th>Month</th>
// // //                     <th style={{textAlign:'right'}}>Achieved</th>
// // //                     <th style={{textAlign:'right'}}>Target</th>
// // //                     <th style={{textAlign:'right'}}>vs Target</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// // //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// // //                     <th>Bar</th>
// // //                   </tr>
// // //                 </thead>
// // //                 <tbody>
// // //                   {[...dealer.months].map((_,di)=>{
// // //                     const i=dealer.months.length-1-di;
// // //                     const v=dealer.months[i];
// // //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// // //                     const prev=i>0?dealer.months[i-1]:null;
// // //                     const diff=prev!=null?v-prev:null;
// // //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// // //                     const vsPct=mt?Math.round((v/mt)*100):null;
// // //                     const maxV=Math.max(...dealer.months,1);
// // //                     return(
// // //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// // //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// // //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// // //                         </td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// // //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// // //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// // //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// // //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// // //                         <td style={{minWidth:80}}>
// // //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// // //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// // //                             </div>
// // //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// // //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// // //                             </div>}
// // //                           </div>
// // //                         </td>
// // //                       </tr>
// // //                     );
// // //                   })}
// // //                 </tbody>
// // //                 <tfoot>
// // //                   <tr>
// // //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// // //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// // //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// // //                     <td colSpan="4"/>
// // //                   </tr>
// // //                 </tfoot>
// // //               </table>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='edit'&&(
// // //           <div className="g2">
// // //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// // //             <div className="field"><label>Zone</label>
// // //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// // //                 <option value="">None</option>
// // //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>Status</label>
// // //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// // //               </select>
// // //             </div>
// // //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// // //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// // //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// // //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// // //             {isAdmin&&(
// // //               <div className="field"><label>Salesman</label>
// // //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// // //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// // //                 </select>
// // //               </div>
// // //             )}
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// // //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// // //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// // //             <div className="field full row" style={{gap:8}}>
// // //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// // //               <button className="btn" onClick={onClose}>Cancel</button>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {tab==='notes'&&(
// // //           <div>
// // //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// // //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// // //               <div className="row" style={{gap:8,marginBottom:8}}>
// // //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// // //                   <option value="note">📝 Note</option>
// // //                   <option value="call">📞 Call log</option>
// // //                   <option value="visit">📍 Visit log</option>
// // //                   <option value="followup">⏰ Follow-up</option>
// // //                 </select>
// // //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// // //               </div>
// // //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// // //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// // //             </div>
// // //             {followups.length>0&&(
// // //               <div style={{marginBottom:14}}>
// // //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// // //                 {followups.map(n=>{
// // //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// // //                   return(
// // //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// // //                       <div className="row" style={{marginBottom:4}}>
// // //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// // //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// // //                         <span className="spacer"/>
// // //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                       </div>
// // //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// // //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// // //                     </div>
// // //                   );
// // //                 })}
// // //               </div>
// // //             )}
// // //             {regularNotes.length>0&&(
// // //               <div>
// // //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// // //                 {regularNotes.map(n=>(
// // //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// // //                     <div className="row" style={{marginBottom:4}}>
// // //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// // //                       <span className="spacer"/>
// // //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// // //                     </div>
// // //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// // //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// // //                   </div>
// // //                 ))}
// // //               </div>
// // //             )}
// // //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default DealerModal;



// // import React, { useState } from 'react';
// // import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// // import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// // import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// // import { api } from '../api';
// import SamplesTab from './SamplesTab';
// // import { useMonth } from '../context';
// // import { StatusBadge, Avatar, KPI } from './UI';
// // import { downloadDealerCard, shareDealerCard } from './dealerCard';
// // import { Layers } from 'lucide-react';

// // const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[],outFollowups=[],onFollowupSaved})=>{
// //   const {selectedMonthIdx,MO:ctxMO}=useMonth();
// //   const MO=ctxMO||MO_CONST;
// //   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
// //   const isAdmin=currentUser.role==='admin';
// //   const [tab,setTab]=useState('overview');
// //   const [showFuModal,setShowFuModal]=useState(false);
// //   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
// //   const [fuComment,setFuComment]=useState('');
// //   const [fuAmount,setFuAmount]=useState('');
// //   const [fuSaving,setFuSaving]=useState(false);
// //   // Match this dealer in outstandingData by name
// //   const outRecord      = outstandingData.find(o=>o.name.toLowerCase().trim()===dealer.name.toLowerCase().trim())||null;
// //   // Load followups fresh when modal opens
// //   const [localFollowups, setLocalFollowups] = useState(
// //     outFollowups.filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim())
// //   );
// //   const [fuLoadErr, setFuLoadErr] = useState('');

// //   const refreshFollowups = async () => {
// //     try {
// //       const all = await api.getFollowups();
// //       const mine = (all||[]).filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim());
// //       setLocalFollowups(mine);
// //       if(onFollowupSaved) onFollowupSaved();
// //     } catch(e){ setFuLoadErr(e.message); }
// //   };

// //   // Load on mount
// //   React.useEffect(()=>{ refreshFollowups(); },[]);

// //   const dealerFollowups  = localFollowups;
// //   const pendingFollowups = dealerFollowups.filter(f=>f.status==='pending');
// //   const [edit,setEdit]=useState({
// //     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
// //     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
// //     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
// //     city:dealer.city||'',state:dealer.state||'',
// //     category:dealer.category||'',categoryType:dealer.categoryType||'',
// //   });
// //   const [newNote,setNewNote]=useState('');
// //   const [noteType,setNoteType]=useState('note');
// //   const [dueDate,setDueDate]=useState('');

// //   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
// //   const followups=dealerNotes.filter(n=>n.type==='followup');
// //   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

// //   const viewAchieved=dealer.months[selectedMonthIdx]||0;
// //   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
// //   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
// //   const tp=trendPct(dealer.months);
// //   const fc=forecast(dealer.months);

// //   const chartData=dealer.months.map((v,i)=>({
// //     month:MO[i].slice(0,3),units:v,
// //     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
// //     isSelected:i===selectedMonthIdx
// //   }));

// //   const addOutFollowup = async () => {
// //     if(!fuDate) return;
// //     setFuSaving(true);
// //     try {
// //       await api.addFollowup({
// //         dealerName:   dealer.name,
// //         salesman:     dealer.salesman,
// //         amount:       Number(fuAmount)||0,
// //         followupDate: fuDate,
// //         comment:      fuComment.trim(),
// //       });
// //       setFuDate(new Date().toISOString().slice(0,10));
// //       setFuComment(''); setFuAmount('');
// //       setShowFuModal(false);
// //       await refreshFollowups();
// //     } catch(e){ alert('Failed: '+e.message); }
// //     setFuSaving(false);
// //   };

// //   const markFollowupDone = async (id) => {
// //     try {
// //       await api.updateFollowup(id, { status:'done' });
// //       await refreshFollowups();
// //     } catch(e){ console.warn(e); }
// //   };

// //   const deleteFollowup = async (id) => {
// //     if(!confirm('Delete follow-up?')) return;
// //     try {
// //       await api.deleteFollowup(id);
// //       await refreshFollowups();
// //     } catch(e){ console.warn(e); }
// //   };

// //   const [saving,setSaving]=useState(false);
// //   const [saveErr,setSaveErr]=useState('');

// //   const save=async()=>{
// //     if(!edit.name.trim()){setSaveErr('Name required');return;}
// //     setSaving(true);setSaveErr('');
// //     try{
// //       const newMonths=[...dealer.months];
// //       newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
// //       const updated={...dealer,
// //         name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
// //         target:num(edit.target),achieved:num(edit.achieved),
// //         creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
// //         city:edit.city.trim(),state:edit.state.trim(),
// //         category:edit.category.trim(),categoryType:edit.categoryType.trim(),
// //         months:newMonths,
// //       };
// //       // Save to DB if available
// //       const token=localStorage.getItem('stp_jwt');
// //       if(token&&dealer.id&&!dealer.id.startsWith('local_')){
// //         try{
// //           await api.updateDealer(dealer.id,{
// //             name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
// //             target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
// //             city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
// //           });
// //         }catch(e){console.warn('DB update failed:',e.message);}
// //       }
// //       onSave(updated);
// //       onLog('edit',`Updated: ${updated.name}`);
// //       onClose();
// //     }catch(e){setSaveErr(e.message);}
// //     setSaving(false);
// //   };

// //   const addNote=()=>{
// //     if(!newNote.trim())return;
// //     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
// //     setNewNote('');setDueDate('');
// //   };

// //   return(
// //     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
// //       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
// //         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
// //           <div style={{flex:1,minWidth:200}}>
// //             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
// //             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
// //               <StatusBadge status={dealer.status}/>
// //               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
// //               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
// //               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
// //               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
// //               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
// //             </div>
// //           </div>
// //           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
// //             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
// //             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
// //             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
// //             <button className="btn" onClick={onClose}><X size={14}/></button>
// //           </div>
// //         </div>

// //         <div className="tabs">
// //           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
// //           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
// //           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
// //           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
// //             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
// //           </button>
// //           <button className={`tab ${tab==='samples'?'active':''}`} onClick={()=>setTab('samples')}>
//                   📦 Samples
//                 </button>
//                 <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit',position:'relative'}}>
// //             Outstanding & Follow-ups {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
// //           </button>
// //         </div>

// //         {tab==='overview'&&(
// //           <div>
// //             {/* Full KPI grid */}
// //             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
// //               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
// //               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
// //               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
// //               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
// //               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
// //               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
// //               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
// //               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
// //               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
// //               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
// //               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
// //               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
// //               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
// //               {dealer.city&&<KPI label="City" value={dealer.city}/>}
// //               {dealer.state&&<KPI label="State" value={dealer.state}/>}
// //               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
// //             </div>

// //             <div style={{marginBottom:14}}>
// //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
// //                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
// //                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
// //               </div>
// //               <ResponsiveContainer width="100%" height={220}>
// //                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
// //                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
// //                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
// //                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
// //                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
// //                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
// //                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
// //                   </Bar>
// //                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
// //                 </ComposedChart>
// //               </ResponsiveContainer>
// //             </div>
// //           </div>
// //         )}

// //         {tab==='monthly'&&(
// //           <div>
// //             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
// //             <div className="scroll">
// //               <table>
// //                 <thead>
// //                   <tr>
// //                     <th>Month</th>
// //                     <th style={{textAlign:'right'}}>Achieved</th>
// //                     <th style={{textAlign:'right'}}>Target</th>
// //                     <th style={{textAlign:'right'}}>vs Target</th>
// //                     <th style={{textAlign:'right'}}>Δ MoM</th>
// //                     <th style={{textAlign:'right'}}>Δ MoM %</th>
// //                     <th>Bar</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {[...dealer.months].map((_,di)=>{
// //                     const i=dealer.months.length-1-di;
// //                     const v=dealer.months[i];
// //                     const mt=dealer.monthTargets?.[i]??dealer.target;
// //                     const prev=i>0?dealer.months[i-1]:null;
// //                     const diff=prev!=null?v-prev:null;
// //                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
// //                     const vsPct=mt?Math.round((v/mt)*100):null;
// //                     const maxV=Math.max(...dealer.months,1);
// //                     return(
// //                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
// //                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
// //                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
// //                         </td>
// //                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
// //                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
// //                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
// //                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
// //                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
// //                         <td style={{minWidth:80}}>
// //                           <div style={{display:'flex',alignItems:'center',gap:4}}>
// //                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// //                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
// //                             </div>
// //                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
// //                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
// //                             </div>}
// //                           </div>
// //                         </td>
// //                       </tr>
// //                     );
// //                   })}
// //                 </tbody>
// //                 <tfoot>
// //                   <tr>
// //                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
// //                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
// //                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
// //                     <td colSpan="4"/>
// //                   </tr>
// //                 </tfoot>
// //               </table>
// //             </div>
// //           </div>
// //         )}

// //         {tab==='edit'&&(
// //           <div className="g2">
// //             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
// //             <div className="field"><label>Zone</label>
// //               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
// //                 <option value="">None</option>
// //                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
// //               </select>
// //             </div>
// //             <div className="field"><label>Status</label>
// //               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
// //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
// //               </select>
// //             </div>
// //             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
// //             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
// //             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
// //             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
// //             {isAdmin&&(
// //               <div className="field"><label>Salesman</label>
// //                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
// //                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
// //                 </select>
// //               </div>
// //             )}
// //             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
// //             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
// //             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
// //             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
// //             <div className="field full row" style={{gap:8}}>
// //               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
// //               <button className="btn" onClick={onClose}>Cancel</button>
// //             </div>
// //           </div>
// //         )}

// //         {tab==='notes'&&(
// //           <div>
// //             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
// //               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
// //               <div className="row" style={{gap:8,marginBottom:8}}>
// //                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
// //                   <option value="note">📝 Note</option>
// //                   <option value="call">📞 Call log</option>
// //                   <option value="visit">📍 Visit log</option>
// //                   <option value="followup">⏰ Follow-up</option>
// //                 </select>
// //                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
// //               </div>
// //               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
// //               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
// //             </div>
// //             {followups.length>0&&(
// //               <div style={{marginBottom:14}}>
// //                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
// //                 {followups.map(n=>{
// //                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
// //                   return(
// //                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
// //                       <div className="row" style={{marginBottom:4}}>
// //                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
// //                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
// //                         <span className="spacer"/>
// //                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// //                       </div>
// //                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
// //                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //             )}
// //             {regularNotes.length>0&&(
// //               <div>
// //                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
// //                 {regularNotes.map(n=>(
// //                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
// //                     <div className="row" style={{marginBottom:4}}>
// //                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
// //                       <span className="spacer"/>
// //                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
// //                     </div>
// //                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
// //                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
// //                   </div>
// //                 ))}
// //               </div>
// //             )}
// //             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
// //           </div>
// //         )}

// //         {tab==='samples'&&(
//           <SamplesTab dealer={dealer} currentUser={currentUser}/>
//         )}
//         {tab==='outstanding'&&(
//           <div>
//             {/* Follow-up section — always visible */}
//             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
//               <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
//                 <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
//                   <Calendar size={13} color="var(--acc)"/> Payment Follow-ups
//                   {pendingFollowups.length>0&&<span style={{background:'rgba(248,113,113,0.15)',color:'#f87171',fontSize:10,padding:'1px 6px',borderRadius:4,marginLeft:4}}>{pendingFollowups.length} follow-up{pendingFollowups.length>1?'s':''}</span>}
//                 </div>
//                 <button onClick={()=>setShowFuModal(s=>!s)} className="btnp" style={{fontSize:11,padding:'4px 10px',display:'flex',alignItems:'center',gap:4}}>
//                   <Plus size={11}/> Add Follow-up
//                 </button>
//               </div>

//               {/* Add followup form */}
//               {showFuModal&&(
//                 <div style={{background:'var(--bg1)',borderRadius:8,padding:12,marginBottom:12,border:'1px solid var(--b2)'}}>
//                   <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
//                     <div>
//                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Follow-up Date *</label>
//                       <input type="date" className="inp" value={fuDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setFuDate(e.target.value)} style={{width:'100%'}}/>
//                     </div>
//                     <div>
//                       <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Expected ₹</label>
//                       <input type="number" className="inp" value={fuAmount} onChange={e=>setFuAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
//                     </div>
//                   </div>
//                   <textarea className="inp" value={fuComment} onChange={e=>setFuComment(e.target.value)}
//                     placeholder="Comment e.g. Cheque promised, Will pay after 15th..."
//                     rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit',marginBottom:8}}/>
//                   <div style={{display:'flex',gap:6}}>
//                     <button onClick={addOutFollowup} disabled={fuSaving} className="btnp" style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
//                       {fuSaving?'Saving...':'Save Follow-up'}
//                     </button>
//                     <button onClick={()=>setShowFuModal(false)} className="btn" style={{fontSize:11}}>Cancel</button>
//                   </div>
//                 </div>
//               )}

//               {/* Existing followups */}
//               {dealerFollowups.length>0?(
//                 <div>
//                   {[...dealerFollowups].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate)).map(f=>{
//                     const days    = Math.ceil((new Date(f.followupDate)-new Date().setHours(0,0,0,0))/86400000);
//                     const isDone  = f.status==='done';
//                     const isOver  = !isDone&&days<0;
//                     return(
//                       <div key={f._id} style={{padding:'8px 12px',borderRadius:8,marginBottom:6,
//                         background:isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.06)':'rgba(99,102,241,0.05)',
//                         border:`1px solid ${isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'rgba(99,102,241,0.15)'}`,
//                         opacity:isDone?0.6:1}}>
//                         <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
//                           <div style={{flex:1}}>
//                             <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
//                               <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>{f.followupDate}</span>
//                               <span style={{fontSize:10,padding:'1px 5px',borderRadius:4,
//                                 background:isDone?'rgba(52,211,153,0.15)':isOver?'rgba(248,113,113,0.15)':'rgba(99,102,241,0.1)',
//                                 color:isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
//                                 {isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
//                               </span>
//                               {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
//                             </div>
//                             {f.comment&&<div style={{fontSize:11,color:'var(--t3)'}}>{f.comment}</div>}
//                           </div>
//                           <div style={{display:'flex',gap:4}}>
//                             {!isDone&&<button onClick={()=>markFollowupDone(f._id)} style={{fontSize:10,padding:'2px 6px',borderRadius:4,border:'1px solid #34d399',color:'#34d399',background:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Check size={9}/> Done</button>}
//                             <button onClick={()=>deleteFollowup(f._id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><Trash2 size={11}/></button>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               ):<div style={{fontSize:11,color:'var(--t3)',textAlign:'center',padding:'10px 0'}}>No follow-ups yet — add one above</div>}
//             </div>

//             {!outRecord?(
//               <div style={{textAlign:'center',padding:30,color:'var(--t3)'}}>
//                 <div style={{fontSize:24,marginBottom:8}}>💳</div>
//                 <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
//                 <div style={{fontSize:11}}>Upload outstanding Excel from the Outstanding section</div>
//               </div>
//             ):(
//               <div>
//                 <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
//                   {[
//                     {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
//                     {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
//                     {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
//                   ].map(k=>(
//                     <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
//                       <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
//                       <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
//                     </div>
//                   ))}
//                 </div>
//                 {outRecord.monthCols&&outRecord.monthCols.length>0&&(
//                   <div style={{overflowX:'auto'}}>
//                     <table>
//                       <thead>
//                         <tr>
//                           <th>Month</th>
//                           <th style={{textAlign:'right'}}>Outstanding</th>
//                           <th style={{textAlign:'right'}}>Change</th>
//                           <th>Bar</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {outRecord.monthCols.map((m,mi)=>{
//                           const v=outRecord.monthlyOutstanding[m]||0;
//                           const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
//                           const change=mi>0?v-prev:0;
//                           const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
//                           const barW=Math.round((v/maxV)*120);
//                           return(
//                             <tr key={m}>
//                               <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
//                               <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
//                               <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
//                               <td>
//                                 <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
//                                   <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
//                                 </div>
//                               </td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DealerModal;

// import React, { useState } from 'react';
// import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
// import { MO, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
// import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast } from '../utils';
// import { useMonth } from '../context';
// import { StatusBadge, Avatar, KPI } from './UI';
// import { downloadDealerCard, shareDealerCard } from './dealerCard';
// import { Layers } from 'lucide-react';

// const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog})=>{
//   const {selectedMonthIdx,MO:ctxMO}=useMonth();
//   const MO=ctxMO||MO_CONST;
//   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
//   const isAdmin=currentUser.role==='admin';
//   const [tab,setTab]=useState('overview');
//   const [showFuModal,setShowFuModal]=useState(false);
//   const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
//   const [fuComment,setFuComment]=useState('');
//   const [fuAmount,setFuAmount]=useState('');
//   const [fuSaving,setFuSaving]=useState(false);
//   const [edit,setEdit]=useState({
//     name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
//     target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
//     creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
//     city:dealer.city||'',state:dealer.state||'',
//     category:dealer.category||'',categoryType:dealer.categoryType||'',
//   });
//   const [newNote,setNewNote]=useState('');
//   const [noteType,setNoteType]=useState('note');
//   const [dueDate,setDueDate]=useState('');

//   const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
//   const followups=dealerNotes.filter(n=>n.type==='followup');
//   const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

//   const viewAchieved=dealer.months[selectedMonthIdx]||0;
//   const viewTarget=dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
//   const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
//   const tp=trendPct(dealer.months);
//   const fc=forecast(dealer.months);

//   const chartData=dealer.months.map((v,i)=>({
//     month:MO[i].slice(0,3),units:v,
//     target:(dealer.monthTargets?.[i] ?? dealer.target) || null,
//     isSelected:i===selectedMonthIdx
//   }));

//   const save=()=>{
//     const newMonths=[...dealer.months];
//     newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
//     onSave({...dealer,name:edit.name,zone:edit.zone,status:edit.status,salesman:edit.salesman,
//       target:num(edit.target),achieved:num(edit.achieved),
//       creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
//       city:edit.city.trim(),state:edit.state.trim(),
//       category:edit.category.trim(),categoryType:edit.categoryType.trim(),
//       months:newMonths});
//     onLog('edit',`Updated dealer: ${edit.name}`);
//     onClose();
//   };

//   const addNote=()=>{
//     if(!newNote.trim())return;
//     onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
//     setNewNote('');setDueDate('');
//   };

//   return(
//     <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
//       <div className="modal" style={{maxWidth:860,width:'95vw'}}>
//         <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
//           <div style={{flex:1,minWidth:200}}>
//             <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
//             <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
//               <StatusBadge status={dealer.status}/>
//               {dealer.zone&&<span className="chip">{dealer.zone}</span>}
//               {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
//               {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
//               {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
//               {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
//             </div>
//           </div>
//           <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
//             <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
//             <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
//             {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
//             <button className="btn" onClick={onClose}><X size={14}/></button>
//           </div>
//         </div>

//         <div className="tabs">
//           <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
//           <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
//           <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
//           <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
//             Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
//           </button>
//         </div>

//         {tab==='overview'&&(
//           <div>
//             {/* Full KPI grid */}
//             <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
//               <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
//               <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
//               <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
//               <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
//               <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
//               <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
//               <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
//               <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
//               <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
//               <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
//               <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
//               {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
//               {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
//               {dealer.city&&<KPI label="City" value={dealer.city}/>}
//               {dealer.state&&<KPI label="State" value={dealer.state}/>}
//               {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
//             </div>

//             <div style={{marginBottom:14}}>
//               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
//                 11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
//                 {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
//               </div>
//               <ResponsiveContainer width="100%" height={220}>
//                 <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
//                   <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
//                   <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
//                   <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
//                   <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
//                     {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
//                   </Bar>
//                   {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
//                 </ComposedChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         )}

//         {tab==='monthly'&&(
//           <div>
//             <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
//             <div className="scroll">
//               <table>
//                 <thead>
//                   <tr>
//                     <th>Month</th>
//                     <th style={{textAlign:'right'}}>Achieved</th>
//                     <th style={{textAlign:'right'}}>Target</th>
//                     <th style={{textAlign:'right'}}>vs Target</th>
//                     <th style={{textAlign:'right'}}>Δ MoM</th>
//                     <th style={{textAlign:'right'}}>Δ MoM %</th>
//                     <th>Bar</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {[...dealer.months].map((_,di)=>{
//                     const i=dealer.months.length-1-di;
//                     const v=dealer.months[i];
//                     const mt=dealer.monthTargets?.[i]??dealer.target;
//                     const prev=i>0?dealer.months[i-1]:null;
//                     const diff=prev!=null?v-prev:null;
//                     const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
//                     const vsPct=mt?Math.round((v/mt)*100):null;
//                     const maxV=Math.max(...dealer.months,1);
//                     return(
//                       <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
//                         <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
//                           {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
//                         </td>
//                         <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
//                         <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
//                         <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
//                         <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
//                         <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
//                         <td style={{minWidth:80}}>
//                           <div style={{display:'flex',alignItems:'center',gap:4}}>
//                             <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
//                               <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
//                             </div>
//                             {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
//                               <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
//                             </div>}
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//                 <tfoot>
//                   <tr>
//                     <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
//                     <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
//                     <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
//                     <td colSpan="4"/>
//                   </tr>
//                 </tfoot>
//               </table>
//             </div>
//           </div>
//         )}

//         {tab==='edit'&&(
//           <div className="g2">
//             <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
//             <div className="field"><label>Zone</label>
//               <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
//                 <option value="">None</option>
//                 {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
//               </select>
//             </div>
//             <div className="field"><label>Status</label>
//               <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
//                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
//               </select>
//             </div>
//             <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
//             <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
//             <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div>
//             <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div>
//             {isAdmin&&(
//               <div className="field"><label>Salesman</label>
//                 <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
//                   {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
//                 </select>
//               </div>
//             )}
//             <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
//             <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
//             <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
//             <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
//             <div className="field full row" style={{gap:8}}>
//               <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
//               <button className="btn" onClick={onClose}>Cancel</button>
//             </div>
//           </div>
//         )}

//         {tab==='notes'&&(
//           <div>
//             <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
//               <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
//               <div className="row" style={{gap:8,marginBottom:8}}>
//                 <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
//                   <option value="note">📝 Note</option>
//                   <option value="call">📞 Call log</option>
//                   <option value="visit">📍 Visit log</option>
//                   <option value="followup">⏰ Follow-up</option>
//                 </select>
//                 {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
//               </div>
//               <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
//               <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
//             </div>
//             {followups.length>0&&(
//               <div style={{marginBottom:14}}>
//                 <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
//                 {followups.map(n=>{
//                   const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
//                   return(
//                     <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
//                       <div className="row" style={{marginBottom:4}}>
//                         <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
//                         <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
//                         <span className="spacer"/>
//                         <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
//                       </div>
//                       <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
//                       <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//             {regularNotes.length>0&&(
//               <div>
//                 <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
//                 {regularNotes.map(n=>(
//                   <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
//                     <div className="row" style={{marginBottom:4}}>
//                       <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
//                       <span className="spacer"/>
//                       <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
//                     </div>
//                     <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
//                     <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
//                   </div>
//                 ))}
//               </div>
//             )}
//             {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default DealerModal;



import React, { useState } from 'react';
import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar } from 'lucide-react';
import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT } from '../constants';
import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast, monthTarget } from '../utils';
import { api } from '../api';
import SamplesTab from './SamplesTab';
import { useMonth } from '../context';
import { StatusBadge, Avatar, KPI } from './UI';
import { downloadDealerCard, shareDealerCard } from './dealerCard';
import { notify, confirmDialog } from './Toast';
import { Layers } from 'lucide-react';

// ── Visits tab for this dealer (read-only timeline) ──────────────────────
function DealerVisitsTab({ dealer }){
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom]     = useState('');

  React.useEffect(()=>{
    let cancelled = false;
    (async()=>{
      setLoading(true);
      try {
        const data = await api.visitsList({ dealerName: dealer.name || '' });
        if(!cancelled) setItems(data || []);
      } catch(e){ notify.error('Visits: ' + e.message); }
      if(!cancelled) setLoading(false);
    })();
    return ()=>{ cancelled = true; };
  }, [dealer?.name]);

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
        <div style={{fontSize:13, fontWeight:700}}>Field visits for {dealer.name}</div>
        <span style={{fontSize:11, color:'var(--t3)'}}>· {items.length} total</span>
      </div>
      {loading ? (
        <div style={{padding:14, color:'var(--t3)'}}>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{padding:24, textAlign:'center', color:'var(--t3)', fontSize:13}}>
          No visits logged for this dealer yet.<br/>
          <span style={{fontSize:11}}>Salesmen can log visits from the CRM tab.</span>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:520, overflowY:'auto'}}>
          {items.map(v => (
            <div key={v._id} style={{
              display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px',
              background:'var(--bg2)', borderRadius:8, borderLeft:'3px solid var(--acc)',
            }}>
              {v.photo
                ? <img src={v.photo} alt="" onClick={()=>setZoom(v.photo)}
                    style={{width:60, height:60, objectFit:'cover', borderRadius:6, cursor:'zoom-in', border:'1px solid var(--b2)', flexShrink:0}}/>
                : <div style={{width:60, height:60, borderRadius:6, background:'var(--bg1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', flexShrink:0}}>—</div>}
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                  <span style={{fontSize:12, fontWeight:600}}>{v.userName || v.userId}</span>
                  <span style={{marginLeft:'auto', fontSize:10, color:'var(--t3)'}}>
                    {new Date(v.createdAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
                  </span>
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
            </div>
          ))}
        </div>
      )}
      {zoom && (
        <div onClick={()=>setZoom('')} style={{
          position:'fixed', inset:0, zIndex:10002, background:'rgba(0,0,0,0.85)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:24,
        }}>
          <img src={zoom} alt="" style={{maxWidth:'95vw', maxHeight:'92vh', borderRadius:10}}/>
        </div>
      )}
    </div>
  );
}

const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[],outFollowups=[],onFollowupSaved})=>{
  const {selectedMonthIdx,MO:ctxMO}=useMonth();
  const MO=ctxMO||MO_CONST;
  const selMoLabel=MO[selectedMonthIdx].slice(0,3);
  const isAdmin=currentUser.role==='admin'||currentUser.role==='superadmin';
  const [tab,setTab]=useState('overview');
  const [showFuModal,setShowFuModal]=useState(false);
  const [fuDate,setFuDate]=useState(new Date().toISOString().slice(0,10));
  const [fuComment,setFuComment]=useState('');
  const [fuAmount,setFuAmount]=useState('');
  const [fuSaving,setFuSaving]=useState(false);

  // Load fresh outstanding for this dealer from DB
  const [localOutRecord, setLocalOutRecord] = useState(
    outstandingData.find(o=>o.name?.toLowerCase().trim()===dealer.name?.toLowerCase().trim())||null
  );

  React.useEffect(()=>{
    api.getOutstanding().then(data=>{
      if(!data?.length) return;
      const found = data.find(r=>r.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim());
      if(!found) return;
      const raw  = found.monthlyOutstanding||{};
      const mo   = typeof raw.forEach==='function' ? Object.fromEntries([...raw]) : raw;
      const vals = Object.values(mo).map(Number);
      setLocalOutRecord({
        id:   found._id?.toString(),
        name: found.dealerName,
        latestOutstanding: vals[vals.length-1]||0,
        maxOutstanding:    Math.max(...vals,0),
        monthlyOutstanding:mo,
        monthCols:         Object.keys(mo),
        trend: vals.length>=2?vals[vals.length-1]-vals[vals.length-2]:0,
      });
    }).catch(()=>{});
  },[]);

  const outRecord = localOutRecord;
  // Load followups fresh when modal opens
  const [localFollowups, setLocalFollowups] = useState(
    outFollowups.filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim())
  );
  const [fuLoadErr, setFuLoadErr] = useState('');

  const refreshFollowups = async () => {
    try {
      const all = await api.getFollowups();
      const mine = (all||[]).filter(f=>f.dealerName?.toLowerCase().trim()===dealer.name?.toLowerCase().trim());
      setLocalFollowups(mine);
      if(onFollowupSaved) onFollowupSaved();
    } catch(e){ setFuLoadErr(e.message); }
  };

  // Load on mount
  React.useEffect(()=>{ refreshFollowups(); },[]);

  const dealerFollowups  = localFollowups;
  const pendingFollowups = dealerFollowups.filter(f=>f.status==='pending');
  const [edit,setEdit]=useState({
    name:dealer.name,zone:dealer.zone,status:dealer.status,salesman:dealer.salesman,
    target:dealer.target,achieved:dealer.months[CURRENT_MONTH_IDX]||0,
    creditDays:dealer.creditDays,creditLimit:dealer.creditLimit,
    city:dealer.city||'',state:dealer.state||'',
    category:dealer.category||'',categoryType:dealer.categoryType||'',
  });
  const [newNote,setNewNote]=useState('');
  const [noteType,setNoteType]=useState('note');
  const [dueDate,setDueDate]=useState('');

  const dealerNotes=notes.filter(n=>n.dealerId===dealer.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const followups=dealerNotes.filter(n=>n.type==='followup');
  const regularNotes=dealerNotes.filter(n=>n.type!=='followup');

  const viewAchieved=dealer.months[selectedMonthIdx]||0;
  // Smart per-month target — see utils.monthTarget. Each month gets its own
  // target if uploaded; otherwise we fall back to the dealer's global target
  // ONLY for months that have actual sales (so historical Sheets data is OK).
  const viewTarget=monthTarget(dealer, selectedMonthIdx);
  const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
  const tp=trendPct(dealer.months);
  const fc=forecast(dealer.months);

  const chartData=dealer.months.map((v,i)=>({
    month:MO[i].slice(0,3),units:v,
    target:monthTarget(dealer, i) || null,
    isSelected:i===selectedMonthIdx
  }));

  const addOutFollowup = async () => {
    if(!fuDate) return;
    setFuSaving(true);
    try {
      await api.addFollowup({
        dealerName:   dealer.name,
        salesman:     dealer.salesman,
        amount:       Number(fuAmount)||0,
        followupDate: fuDate,
        comment:      fuComment.trim(),
      });
      setFuDate(new Date().toISOString().slice(0,10));
      setFuComment(''); setFuAmount('');
      setShowFuModal(false);
      await refreshFollowups();
    } catch(e){ notify.error('Failed: '+e.message); }
    setFuSaving(false);
  };

  const markFollowupDone = async (id) => {
    try {
      await api.updateFollowup(id, { status:'done' });
      await refreshFollowups();
    } catch(e){ console.warn(e); }
  };

  const deleteFollowup = async (id) => {
    const okDel = await confirmDialog({ title:'Delete follow-up?', confirmText:'Delete', danger:true });
    if(!okDel) return;
    try {
      await api.deleteFollowup(id);
      await refreshFollowups();
    } catch(e){ console.warn(e); }
  };

  const [saving,setSaving]=useState(false);
  const [saveErr,setSaveErr]=useState('');

  const save=async()=>{
    if(!edit.name.trim()){setSaveErr('Name required');return;}
    setSaving(true);setSaveErr('');
    try{
      const newMonths=[...dealer.months];
      newMonths[CURRENT_MONTH_IDX]=num(edit.achieved);
      const updated={...dealer,
        name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
        target:num(edit.target),achieved:num(edit.achieved),
        creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
        city:edit.city.trim(),state:edit.state.trim(),
        category:edit.category.trim(),categoryType:edit.categoryType.trim(),
        months:newMonths,
      };
      // Save to DB if available
      const token=localStorage.getItem('stp_jwt');
      if(token&&dealer.id&&!dealer.id.startsWith('local_')){
        try{
          await api.updateDealer(dealer.id,{
            name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
            target:updated.target,creditDays:updated.creditDays,creditLimit:updated.creditLimit,
            city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
          });
        }catch(e){console.warn('DB update failed:',e.message);}
      }
      onSave(updated);
      onLog('edit',`Updated: ${updated.name}`);
      onClose();
    }catch(e){setSaveErr(e.message);}
    setSaving(false);
  };

  const addNote=()=>{
    if(!newNote.trim())return;
    onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
    setNewNote('');setDueDate('');
  };

  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:860,width:'95vw'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:18,flexWrap:'wrap',gap:10}}>
          <div style={{flex:1,minWidth:200}}>
            <div style={{fontSize:20,fontWeight:700,marginBottom:6}}>{dealer.name}</div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
              <StatusBadge status={dealer.status}/>
              {dealer.zone&&<span className="chip">{dealer.zone}</span>}
              {(dealer.city||dealer.state)&&<span className="chip" style={{display:'inline-flex',alignItems:'center',gap:4}}><MapPin size={10}/> {[dealer.city,dealer.state].filter(Boolean).join(', ')}</span>}
              {dealer.category&&<span className="chip" style={{color:'#818cf8',borderColor:'#818cf844'}}><Layers size={9} style={{display:'inline',verticalAlign:'middle',marginRight:3}}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
              {isAdmin&&<span style={{fontSize:11,color:'var(--t3)'}}>· {users[dealer.salesman]?.name||dealer.salesman}</span>}
              {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{fontSize:10,background:'rgba(251,191,36,0.15)',color:'#fbbf24',padding:'2px 8px',borderRadius:4}}>Viewing {MO[selectedMonthIdx]}</span>}
            </div>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Camera size={13}/> Download</button>
            <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx)} style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}><Share2 size={13}/> Share</button>
            {isAdmin&&<button className="btnd" onClick={()=>{onDelete(dealer.id);onClose();}}><Trash2 size={12}/> Delete</button>}
            <button className="btn" onClick={onClose}><X size={14}/></button>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab==='overview'?'active':''}`} onClick={()=>setTab('overview')}>Overview</button>
          <button className={`tab ${tab==='monthly'?'active':''}`} onClick={()=>setTab('monthly')}>Monthly Detail</button>
          <button className={`tab ${tab==='edit'?'active':''}`} onClick={()=>setTab('edit')}>Edit</button>
          <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>
            Notes & Follow-ups {dealerNotes.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>{dealerNotes.length}</span>}
          </button>
          <button className={`tab ${tab==='samples'?'active':''}`} onClick={()=>setTab('samples')}>
                  📦 Samples
                </button>
                <button className={`tab ${tab==='visits'?'active':''}`} onClick={()=>setTab('visits')}>
                  📍 Visits
                </button>
                <button className={`tab ${tab==='outstanding'?'active':''}`} onClick={()=>setTab('outstanding')} style={{color:outRecord?.latestOutstanding>0?'#f87171':'inherit',position:'relative'}}>
            Outstanding & Follow-ups {outRecord?.latestOutstanding>0&&<span style={{background:'#f87171',color:'#fff',borderRadius:8,padding:'1px 6px',fontSize:10,marginLeft:4}}>₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>}
          </button>
        </div>

        {tab==='overview'&&(
          <div>
            {/* Full KPI grid */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:8,marginBottom:18}}>
              <KPI label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
              <KPI label={`${selMoLabel} Achieved`} value={viewAchieved} color="#34d399"/>
              <KPI label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
              <KPI label="6-mo Avg" value={dealer.avg6m||'—'}/>
              <KPI label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
              <KPI label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'#34d399':tp<0?'#f87171':'var(--t3)'} sub="3m vs 3m"/>
              <KPI label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
              <KPI label="Credit Limit" value={fcash(dealer.creditLimit)}/>
              <KPI label="11-mo Total" value={dealer.months.reduce((a,b)=>a+b,0)}/>
              <KPI label="11-mo High" value={Math.max(...dealer.months)}/>
              <KPI label="Active Months" value={dealer.months.filter(v=>v>0).length+'/11'}/>
              {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#818cf8"/>}
              {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#818cf8"/>} */}
              {dealer.city&&<KPI label="City" value={dealer.city}/>}
              {dealer.state&&<KPI label="State" value={dealer.state}/>}
              {dealer.zone&&<KPI label="Zone" value={dealer.zone}/>}
            </div>

            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>
                11-Month Performance {dealer.target>0&&<span style={{color:'#34d399',marginLeft:8}}>— dashed = target</span>}
                {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span style={{color:'#fbbf24',marginLeft:8}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData} margin={{top:18,right:10,bottom:5,left:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
                  <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
                  <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
                  <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(value,name)=>[value,name==='units'?'Achieved':'Target']}/>
                  <Bar dataKey="units" radius={[3,3,0,0]} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}>
                    {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'#fbbf24':'#6366f1'}/>))}
                  </Bar>
                  {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab==='monthly'&&(
          <div>
            <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Month-by-Month Breakdown — Full Detail</div>
            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th style={{textAlign:'right'}}>Achieved</th>
                    <th style={{textAlign:'right'}}>Target</th>
                    <th style={{textAlign:'right'}}>vs Target</th>
                    <th style={{textAlign:'right'}}>Δ MoM</th>
                    <th style={{textAlign:'right'}}>Δ MoM %</th>
                    <th>Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {[...dealer.months].map((_,di)=>{
                    const i=dealer.months.length-1-di;
                    const v=dealer.months[i];
                    const mt=monthTarget(dealer, i);
                    const prev=i>0?dealer.months[i-1]:null;
                    const diff=prev!=null?v-prev:null;
                    const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
                    const vsPct=mt?Math.round((v/mt)*100):null;
                    const maxV=Math.max(...dealer.months,1);
                    return(
                      <tr key={i} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
                        <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)'}}>
                          {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
                        </td>
                        <td style={{textAlign:'right',fontWeight:600,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
                        <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
                        <td style={{textAlign:'right',fontWeight:600,color:vsPct===null?'var(--t3)':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171'}}>{vsPct!==null?vsPct+'%':'—'}</td>
                        <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
                        <td style={{textAlign:'right',color:diffP>0?'#34d399':diffP<0?'#f87171':'var(--t3)'}}>{diffP!=null?(diffP>0?'+':'')+diffP+'%':'—'}</td>
                        <td style={{minWidth:80}}>
                          <div style={{display:'flex',alignItems:'center',gap:4}}>
                            <div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
                              <div style={{height:'100%',width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'#fbbf24':'#6366f1',borderRadius:4}}/>
                            </div>
                            {mt>0&&<div style={{height:8,flex:1,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}>
                              <div style={{height:'100%',width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171',borderRadius:4}}/>
                            </div>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{color:'var(--t1)',fontWeight:700}}>TOTAL</td>
                    <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{dealer.months.reduce((a,b)=>a+b,0)}</td>
                    <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
                    <td colSpan="4"/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {tab==='edit'&&(
          <div className="g2">
            <div className="field full"><label>Dealer Name</label><input className="inp" value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
            <div className="field"><label>Zone</label>
              <select className="sel inp" value={edit.zone} onChange={e=>setEdit({...edit,zone:e.target.value})}>
                <option value="">None</option>
                {['ZONE 1','ZONE 2','ZONE 3'].map(z=><option key={z}>{z}</option>)}
              </select>
            </div>
            <div className="field"><label>Status</label>
              <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
                {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','RECENTLY INACTIVE'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field"><label>City</label><input className="inp" value={edit.city} onChange={e=>setEdit({...edit,city:e.target.value})} placeholder="e.g. Bengaluru"/></div>
            <div className="field"><label>State</label><input className="inp" value={edit.state} onChange={e=>setEdit({...edit,state:e.target.value})} placeholder="e.g. Karnataka"/></div>
             {/* <div className="field"><label>Category</label><input className="inp" value={edit.category} onChange={e=>setEdit({...edit,category:e.target.value})} placeholder="e.g. Laminate"/></div> */}
            {/* <div className="field"><label>Category Type</label><input className="inp" value={edit.categoryType} onChange={e=>setEdit({...edit,categoryType:e.target.value})} placeholder="e.g. 1mm"/></div> */}
            {isAdmin&&(
              <div className="field"><label>Salesman</label>
                <select className="sel inp" value={edit.salesman} onChange={e=>setEdit({...edit,salesman:e.target.value})}>
                  {Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}
            <div className="field"><label>{CURRENT_MONTH_SHORT} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
            <div className="field"><label>{CURRENT_MONTH_SHORT} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
            <div className="field"><label>Credit Days</label><input type="number" className="inp" value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
            <div className="field"><label>Credit Limit ₹</label><input type="number" className="inp" value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
            <div className="field full row" style={{gap:8}}>
              <button className="btnp" onClick={save}><Save size={13} style={{marginRight:6}}/>Save Changes</button>
              <button className="btn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {tab==='notes'&&(
          <div>
            <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
              <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:10}}>Add new entry</div>
              <div className="row" style={{gap:8,marginBottom:8}}>
                <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
                  <option value="note">📝 Note</option>
                  <option value="call">📞 Call log</option>
                  <option value="visit">📍 Visit log</option>
                  <option value="followup">⏰ Follow-up</option>
                </select>
                {noteType==='followup'&&(<input type="date" className="inp" style={{width:160}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
              </div>
              <textarea className="inp" style={{minHeight:60,resize:'vertical',fontFamily:'inherit'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
              <button className="btnp" style={{marginTop:8}} onClick={addNote}>Add</button>
            </div>
            {followups.length>0&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8,display:'flex',alignItems:'center',gap:6}}><Bell size={12}/> Follow-ups ({followups.length})</div>
                {followups.map(n=>{
                  const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
                  return(
                    <div key={n.id} style={{background:overdue?'rgba(248,113,113,0.08)':n.completed?'var(--bg2)':'rgba(251,191,36,0.06)',border:`1px solid ${overdue?'rgba(248,113,113,0.2)':'var(--b2)'}`,borderRadius:8,padding:12,marginBottom:8,opacity:n.completed?0.5:1}}>
                      <div className="row" style={{marginBottom:4}}>
                        <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
                        <span style={{fontSize:11,color:overdue?'#f87171':'var(--t3)',fontWeight:overdue?600:400}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
                        <span className="spacer"/>
                        <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
                      </div>
                      <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
                      <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  );
                })}
              </div>
            )}
            {regularNotes.length>0&&(
              <div>
                <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.1em',marginBottom:8}}>Activity ({regularNotes.length})</div>
                {regularNotes.map(n=>(
                  <div key={n.id} style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:8}}>
                    <div className="row" style={{marginBottom:4}}>
                      <span style={{fontSize:11}}>{n.type==='call'?'📞':n.type==='visit'?'📍':'📝'} <strong style={{color:'var(--t2)'}}>{n.type}</strong></span>
                      <span className="spacer"/>
                      <button onClick={()=>onDeleteNote(n.id)} className="btn" style={{padding:3,fontSize:11}}><Trash2 size={11}/></button>
                    </div>
                    <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
                    <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            )}
            {dealerNotes.length===0&&<div style={{color:'var(--t3)',textAlign:'center',padding:30,fontSize:13}}>No notes yet.</div>}
          </div>
        )}

        {tab==='samples'&&(
          <SamplesTab dealer={dealer} currentUser={currentUser}/>
        )}
        {tab==='visits'&&(
          <DealerVisitsTab dealer={dealer}/>
        )}
        {tab==='outstanding'&&(
          <div>
            {/* Follow-up section — always visible */}
            <div style={{background:'var(--bg2)',borderRadius:10,padding:14,marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',display:'flex',alignItems:'center',gap:6}}>
                  <Calendar size={13} color="var(--acc)"/> Payment Follow-ups
                  {pendingFollowups.length>0&&<span style={{background:'rgba(248,113,113,0.15)',color:'#f87171',fontSize:10,padding:'1px 6px',borderRadius:4,marginLeft:4}}>{pendingFollowups.length} follow-up{pendingFollowups.length>1?'s':''}</span>}
                </div>
                <button onClick={()=>setShowFuModal(s=>!s)} className="btnp" style={{fontSize:11,padding:'4px 10px',display:'flex',alignItems:'center',gap:4}}>
                  <Plus size={11}/> Add Follow-up
                </button>
              </div>

              {/* Add followup form */}
              {showFuModal&&(
                <div style={{background:'var(--bg1)',borderRadius:8,padding:12,marginBottom:12,border:'1px solid var(--b2)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                    <div>
                      <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Follow-up Date *</label>
                      <input type="date" className="inp" value={fuDate} min={new Date().toISOString().slice(0,10)} onChange={e=>setFuDate(e.target.value)} style={{width:'100%'}}/>
                    </div>
                    <div>
                      <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:3,textTransform:'uppercase'}}>Expected ₹</label>
                      <input type="number" className="inp" value={fuAmount} onChange={e=>setFuAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
                    </div>
                  </div>
                  <textarea className="inp" value={fuComment} onChange={e=>setFuComment(e.target.value)}
                    placeholder="Comment e.g. Cheque promised, Will pay after 15th..."
                    rows={2} style={{width:'100%',resize:'vertical',fontFamily:'inherit',marginBottom:8}}/>
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={addOutFollowup} disabled={fuSaving} className="btnp" style={{fontSize:11,display:'flex',alignItems:'center',gap:4}}>
                      {fuSaving?'Saving...':'Save Follow-up'}
                    </button>
                    <button onClick={()=>setShowFuModal(false)} className="btn" style={{fontSize:11}}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Existing followups */}
              {dealerFollowups.length>0?(
                <div>
                  {[...dealerFollowups].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate)).map(f=>{
                    const days    = Math.ceil((new Date(f.followupDate)-new Date().setHours(0,0,0,0))/86400000);
                    const isDone  = f.status==='done';
                    const isOver  = !isDone&&days<0;
                    return(
                      <div key={f._id} style={{padding:'8px 12px',borderRadius:8,marginBottom:6,
                        background:isDone?'rgba(52,211,153,0.05)':isOver?'rgba(248,113,113,0.06)':'rgba(99,102,241,0.05)',
                        border:`1px solid ${isDone?'rgba(52,211,153,0.2)':isOver?'rgba(248,113,113,0.2)':'rgba(99,102,241,0.15)'}`,
                        opacity:isDone?0.6:1}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                          <div style={{flex:1}}>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                              <span style={{fontSize:12,fontWeight:600,color:isDone?'#34d399':isOver?'#f87171':'var(--t1)'}}>{f.followupDate}</span>
                              <span style={{fontSize:10,padding:'1px 5px',borderRadius:4,
                                background:isDone?'rgba(52,211,153,0.15)':isOver?'rgba(248,113,113,0.15)':'rgba(99,102,241,0.1)',
                                color:isDone?'#34d399':isOver?'#f87171':'var(--acc)'}}>
                                {isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
                              </span>
                              {f.amount>0&&<span style={{fontSize:10,color:'#fbbf24',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
                            </div>
                            {f.comment&&<div style={{fontSize:11,color:'var(--t3)'}}>{f.comment}</div>}
                          </div>
                          <div style={{display:'flex',gap:4}}>
                            {!isDone&&<button onClick={()=>markFollowupDone(f._id)} style={{fontSize:10,padding:'2px 6px',borderRadius:4,border:'1px solid #34d399',color:'#34d399',background:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Check size={9}/> Done</button>}
                            <button onClick={()=>deleteFollowup(f._id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:2}}><Trash2 size={11}/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ):<div style={{fontSize:11,color:'var(--t3)',textAlign:'center',padding:'10px 0'}}>No follow-ups yet — add one above</div>}
            </div>

            {!outRecord?(
              <div style={{textAlign:'center',padding:30,color:'var(--t3)'}}>
                <div style={{fontSize:24,marginBottom:8}}>💳</div>
                <div style={{fontSize:13,color:'var(--t2)',marginBottom:4}}>No outstanding data found</div>
                <div style={{fontSize:11}}>Upload outstanding Excel from the Outstanding section</div>
              </div>
            ):(
              <div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                  {[
                    {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'#f87171':'#34d399'},
                    {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'#fbbf24'},
                    {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'#f87171':outRecord.trend<0?'#34d399':'var(--t3)'},
                  ].map(k=>(
                    <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
                      <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
                      <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                {outRecord.monthCols&&outRecord.monthCols.length>0&&(
                  <div style={{overflowX:'auto'}}>
                    <table>
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th style={{textAlign:'right'}}>Outstanding</th>
                          <th style={{textAlign:'right'}}>Change</th>
                          <th>Bar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outRecord.monthCols.map((m,mi)=>{
                          const v=outRecord.monthlyOutstanding[m]||0;
                          const prev=mi>0?outRecord.monthlyOutstanding[outRecord.monthCols[mi-1]]||0:v;
                          const change=mi>0?v-prev:0;
                          const maxV=Math.max(...outRecord.monthCols.map(mc=>outRecord.monthlyOutstanding[mc]||0),1);
                          const barW=Math.round((v/maxV)*120);
                          return(
                            <tr key={m}>
                              <td style={{fontWeight:600,color:'var(--t1)'}}>{m}</td>
                              <td style={{textAlign:'right',fontWeight:700,color:v===0?'#34d399':'#f87171'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
                              <td style={{textAlign:'right',color:change>0?'#f87171':change<0?'#34d399':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
                              <td>
                                <div style={{height:6,background:'var(--b1)',borderRadius:3,width:120,overflow:'hidden'}}>
                                  <div style={{height:'100%',width:barW,background:v===0?'#34d399':'#f87171',borderRadius:3}}/>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerModal;