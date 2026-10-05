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
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
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
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
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
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
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
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
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
// //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
// // import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
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
// //                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
//                 {['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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



import React, { useState, useMemo, useEffect } from 'react';
import { ComposedChart, Bar, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { X, Trash2, Save, Bell, CheckSquare, Square, MapPin, Camera, Share2, Plus, Check, Calendar, BarChart3, MessageSquare,
  LayoutGrid, Pencil, Package, Wallet, Tag, Compass, User, TrendingUp, TrendingDown, Target, Activity, Filter, Gauge, Lock, CreditCard, Phone, StickyNote } from 'lucide-react';
import { MO as MO_CONST, CURRENT_MONTH_IDX, CURRENT_MONTH_SHORT, DEALER_TYPES } from '../constants';
import { pct, spct, pclr, fcash, num, uid, isoNow, trendPct, forecast, monthTarget } from '../utils';
import { api } from '../api';
import SamplesTab from './SamplesTab';
import CategorySalesPanel from './CategorySalesPanel';
import CategoryFilter from './CategoryFilter';
import { useMonth } from '../context';
import { useGlobalCategoryFilter } from '../hooks/useGlobalCategoryFilter';
import { StatusBadge, Avatar, KPI } from './UI';
import { downloadDealerCard, shareDealerCard } from './dealerCard';
import { notify, confirmDialog } from './Toast';
import { VoiceTextarea } from './VoiceInput';
import { Layers } from 'lucide-react';
import { useZones } from '../hooks/useZones';
import { catTargets, includedFactor } from '../lib/targetRule';

// Local-calendar helpers. toISOString() is UTC, so before 05:30 IST it
// reports yesterday; parsing 'YYYY-MM-DD' with new Date() is also UTC.
const localYmd=(dt=new Date())=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
const daysUntil=d=>{const [y,m,dd]=String(d).slice(0,10).split('-').map(Number);const t=new Date();return Math.round((new Date(y,m-1,dd)-new Date(t.getFullYear(),t.getMonth(),t.getDate()))/864e5);};

// ── Visits tab for this dealer (read-only timeline) ──────────────────────
function DealerVisitsTab({ dealer }){
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom]     = useState('');

  const [visitPhotos, setVisitPhotos] = React.useState({});
  React.useEffect(()=>{
    let cancelled = false;
    (async()=>{
      setLoading(true);
      try {
        // Light first so the tab appears at once, then the photos for the
        // rows it actually shows — a dealer with many visits used to drag
        // megabytes of base64 before anything rendered.
        const data = await api.visitsList({ dealerName: dealer.name || '', light: 1 });
        if(cancelled) return;
        setItems(data || []);
        const ids = (data || []).slice(0, 60).map(v => v._id).filter(Boolean);
        if (ids.length) {
          try {
            const map = await api.visitPhotos(ids);
            if (!cancelled) setVisitPhotos(map || {});
          } catch { /* thumbnails stay blank; the list still works */ }
        }
      } catch(e){ notify.error('Visits: ' + e.message); }
      if(!cancelled) setLoading(false);
    })();
    return ()=>{ cancelled = true; };
  }, [dealer?.name]);

  return (
    <div className="dm-card">
      <div className="sec-title">
        <span className="sec-ico" style={{'--tone':'var(--acc)'}}><MapPin size={15}/></span> Field visits for {dealer.name}
        <span className="count-pill">{items.length}</span>
      </div>
      {loading ? (
        <div style={{padding:14, color:'var(--t3)'}}>Loading…</div>
      ) : items.length === 0 ? (
        <div className="dm-empty" style={{border:'none'}}>
          <span className="sec-ico lg" style={{'--tone':'var(--acc)'}}><MapPin size={18}/></span>
          No visits logged for this dealer yet.
          <span style={{fontSize:11}}>Salesmen can log visits from the CRM tab.</span>
        </div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:520, overflowY:'auto'}}>
          {items.map(v => (
            <div key={v._id} className="att-card" style={{
              '--tone':'var(--acc)', cursor:'default',
              display:'flex', alignItems:'flex-start', gap:12,
            }}>
              {(v.photo || visitPhotos[v._id]?.in)
                ? <img src={v.photo || visitPhotos[v._id]?.in} alt=""
                    onClick={()=>setZoom(v.photo || visitPhotos[v._id]?.in)}
                    style={{width:60, height:60, objectFit:'cover', borderRadius:10, cursor:'zoom-in', border:'1px solid var(--b2)', flexShrink:0}}/>
                : <div style={{width:60, height:60, borderRadius:10, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', flexShrink:0}}>—</div>}
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                  <span style={{fontSize:12.5, fontWeight:700, color:'var(--t1)'}}>{v.userName || v.userId}</span>
                  <span style={{marginLeft:'auto', fontSize:10, color:'var(--t3)'}}>
                    {new Date(v.createdAt).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}
                  </span>
                </div>
                {v.comment && <div style={{fontSize:12, color:'var(--t2)', marginTop:4, whiteSpace:'pre-wrap'}}>{v.comment}</div>}
                {v.address && (
                  <div style={{fontSize:10, color:'var(--acc)', marginTop:4, display:'flex', alignItems:'center', gap:3}}>
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

// ── Dealer record screen styles (scoped with the dm- prefix) ─────────────
const DM_CSS=`
.modal.dm-modal{max-width:940px;width:95vw;padding:0!important;overflow-x:hidden}
.dm-hero{position:relative;padding:22px 24px 18px;border-bottom:1px solid var(--b1);
  background:linear-gradient(135deg,color-mix(in srgb,var(--acc) 11%,var(--bg1)) 0%,var(--bg1) 62%)}
.dm-x{position:absolute;top:14px;right:14px;width:34px;height:34px;padding:0!important;display:grid!important;place-items:center;border-radius:10px!important}
.dm-id{display:flex;gap:16px;align-items:flex-start;padding-right:44px}
.dm-ava{width:60px;height:60px;border-radius:18px;font-size:21px;letter-spacing:.01em}
.dm-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--acc);margin-bottom:2px}
.dm-name{font-size:22px;font-weight:850;letter-spacing:-.02em;color:var(--t1);line-height:1.2;overflow-wrap:anywhere}
.dm-subline{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:5px;font-size:12.5px;color:var(--t2)}
.dm-subline span{display:inline-flex;align-items:center;gap:5px;min-width:0}
.dm-subline svg{color:var(--t3);flex-shrink:0}
.dm-pills{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px}
.dm-pill{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;white-space:nowrap;
  color:var(--tone,var(--acc));background:color-mix(in srgb,var(--tone,var(--acc)) 13%,transparent)}
.dm-addr{max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dm-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;padding-left:76px}
.dm-acts>button{display:inline-flex;align-items:center;gap:6px;font-size:12.5px}
.dm-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:16px}
.dm-kpi{background:var(--bg1);border:1px solid var(--b1);border-radius:14px;padding:12px 14px;box-shadow:var(--shadow,none);min-width:0;cursor:pointer;transition:transform .15s,box-shadow .15s}
.dm-kpi:hover{transform:translateY(-2px);box-shadow:var(--shadowHover,none)}
.dm-kpi-top{display:flex;align-items:center;gap:8px;margin-bottom:8px;min-width:0}
.dm-kpi-ico{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
[data-tone="dark"] .dm-kpi-ico{background:color-mix(in srgb,var(--tone) 24%,transparent)}
.dm-kpi-lbl{font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dm-kpi-v{font-size:22px;font-weight:850;letter-spacing:-.02em;line-height:1.1;color:var(--tone);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dm-kpi-sub{font-size:11px;color:var(--t3);margin-top:5px;min-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pbar.dm-pbar{width:100%;height:6px;margin-top:9px}
.dm-cattgt{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px;font-size:11.5px}
.dm-cattgt-l{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin-right:2px}
.dm-cattgt-c{padding:3px 10px;border-radius:20px;border:1px solid var(--b1);background:var(--bg1);color:var(--t2);white-space:nowrap}
.dm-cattgt-c b{color:var(--acc);font-weight:800;margin-left:2px}
.dm-cattgt-c.off{opacity:.45}
.dm-cattgt-c.off b{color:var(--t3)}
.dm-tabbar{position:sticky;top:0;z-index:6;background:var(--bg1);padding:10px 24px;border-bottom:1px solid var(--b1)}
.seg.dm-seg{display:flex;max-width:100%;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.dm-seg::-webkit-scrollbar{display:none}
.dm-seg .seg-b{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;flex-shrink:0;padding:7px 13px}
.dm-due{font-size:10.5px;font-weight:800;color:#fff;background:var(--red);padding:1px 7px;border-radius:20px}
.dm-body{padding:18px 24px 24px}
.dm-stack{display:flex;flex-direction:column;gap:14px}
.dm-card{background:var(--bg1);border:1px solid var(--b1);border-radius:16px;padding:16px 18px;box-shadow:var(--shadow,none);min-width:0}
.dm-tint{background:color-mix(in srgb,var(--acc) 5%,var(--bg1))}
.dm-inner{border:1px solid var(--b2);border-radius:14px;padding:14px;margin-bottom:12px}
.dm-filter{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:12px 14px}
.dm-lbl{display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:800;color:var(--t3);text-transform:uppercase;letter-spacing:.08em}
.dm-minis{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px}
.dm-minis.dm-minis3{grid-template-columns:repeat(3,minmax(0,1fr))}
.dm-mini{background:var(--bg2);border:1px solid var(--b1);border-radius:12px;padding:10px 12px;min-width:0}
.dm-mini-l{font-size:10px;font-weight:800;color:var(--t3);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
.dm-mini-v{font-size:17px;font-weight:800;letter-spacing:-.01em;overflow-wrap:anywhere}
.dm-mini-s{font-size:10.5px;color:var(--t3);margin-top:2px}
.dm-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 14px}
.dm-form.dm-form2{grid-template-columns:repeat(2,minmax(0,1fr))}
.dm-form .field{margin:0;min-width:0}
.dm-form .field label{font-size:10.5px;font-weight:700;letter-spacing:.07em;display:flex;align-items:center}
.dm-form .inp,.dm-form .sel{width:100%;max-width:100%}
.dm-full{grid-column:1/-1}
.dm-lock{margin-left:5px;color:var(--t3)}
.dm-savebar{position:sticky;bottom:0;z-index:4;display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 14px;
  border:1px solid var(--b1);border-radius:14px;background:var(--bg1);box-shadow:0 -6px 20px rgba(16,24,40,.08)}
.dm-err{color:var(--red);font-size:12px;font-weight:700;padding:4px 10px;border-radius:8px;background:color-mix(in srgb,var(--red) 10%,transparent)}
.dm-list{display:flex;flex-direction:column;gap:8px}
.dm-meta{font-size:10.5px;color:var(--t3);margin-top:5px}
.dm-icobtn{width:28px;height:28px;display:grid;place-items:center;flex-shrink:0;border-radius:8px;border:1px solid var(--b1);background:var(--bg1);color:var(--t3);cursor:pointer;transition:color .15s,border-color .15s}
.dm-icobtn:hover{color:var(--red);border-color:color-mix(in srgb,var(--red) 40%,transparent)}
.dm-done{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:4px 9px;border-radius:8px;cursor:pointer;
  border:1px solid color-mix(in srgb,var(--grn) 45%,transparent);color:var(--grn);background:color-mix(in srgb,var(--grn) 10%,transparent)}
.dm-empty{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:34px 16px;color:var(--t3);font-size:13px;
  background:var(--bg1);border:1px dashed var(--b2);border-radius:16px}
.dm-bar{height:7px;flex:1;background:var(--bg3);border-radius:4px;overflow:hidden}
.dm-bar>div{height:100%;border-radius:4px}
@media(max-width:900px){.dm-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:640px){
  .overlay.dm-ov{padding:0;align-items:flex-end}
  .modal.dm-modal{width:100vw;max-width:100vw;max-height:94vh;max-height:94dvh;border-radius:20px 20px 0 0!important}
  .dm-hero{padding:18px 16px 14px}
  .dm-id{gap:12px}
  .dm-ava{width:48px;height:48px;border-radius:14px;font-size:17px}
  .dm-name{font-size:19px}
  .dm-acts{padding-left:0}
  .dm-acts>button{flex:1 1 auto;justify-content:center}
  /* phone: five small figure tiles (3 + 2) instead of a whole screen of cards */
  .dm-kpis{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:12px}
  .dm-kpi{padding:8px 9px;border-radius:11px}
  .dm-kpi-top{margin-bottom:3px}
  .dm-kpi-ico{display:none}
  .dm-kpi-lbl{font-size:9px;letter-spacing:.04em}
  .dm-kpi-v{font-size:16px}
  .dm-kpi-sub{display:none}
  .dm-kpi .pbar,.dm-kpi [class*="bar"]{margin-top:4px}
  .dm-addr{display:none}
  .dm-pills{margin-top:6px;gap:4px}
  .dm-acts>button{padding:6px 10px!important;font-size:12px!important}
  .dm-tabbar{padding:8px 16px}
  .dm-body{padding:14px 16px calc(20px + env(safe-area-inset-bottom))}
  .dm-card{padding:14px}
  .dm-form,.dm-form.dm-form2{grid-template-columns:1fr}
  .dm-minis{grid-template-columns:repeat(2,minmax(0,1fr))}
  .dm-minis.dm-minis3{grid-template-columns:1fr}
  .dm-addr{max-width:100%}
}
`;

const DmStat=({label,value,color='var(--t1)',sub})=>(
  <div className="dm-mini">
    <div className="dm-mini-l">{label}</div>
    <div className="dm-mini-v" style={{color}}>{value}</div>
    {sub&&<div className="dm-mini-s">{sub}</div>}
  </div>
);

const DealerModal=({dealer,users,currentUser,onSave,onDelete,onClose,notes,onAddNote,onUpdateNote,onDeleteNote,onLog,outstandingData=[],outFollowups=[],onFollowupSaved})=>{
  // Zone list comes from the dealer records, not a hardcoded three.
  const zoneOptions = useZones();
  const {selectedMonthIdx,MO:ctxMO,viewIdx}=useMonth();
  const MO=ctxMO||MO_CONST;
  // Months of the global view cycle — only changes which months are listed/charted.
  const vIdx=(viewIdx&&viewIdx.length?viewIdx:MO.map((_,i)=>i)).filter(i=>i<MO.length);
  const selMoLabel=MO[selectedMonthIdx].slice(0,3);
  const isAdmin=currentUser.role==='admin'||currentUser.role==='superadmin';
  // name, zone and credit terms belong to the office — a salesman sees them, the server would ignore his changes
  const officeOnly=!['admin','superadmin','employee'].includes(currentUser.role);
  const lockedTip='Only the office can change this';
  const [tab,setTab]=useState('overview');
  const [showFuModal,setShowFuModal]=useState(false);
  const [fuDate,setFuDate]=useState(()=>localYmd());
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
    dealerType:dealer.dealerType||'None',
    // Month-scoped: the Edit tab edits the month being VIEWED (topbar month),
    // not the hardcoded "current" month from constants.
    target:dealer.monthTargets?.[selectedMonthIdx]||0,
    achieved:dealer.months[selectedMonthIdx]||0,
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

  // ── Per-dealer category filter ─────────────────────────────────────────
  // Fetch this dealer's category-wise history once. Drives an in-modal
  // category/sub-category picker (separate from the global filter), so the
  // KPIs + bar chart can be sliced to "only LAMINATE" or "only 1 MM".
  const [dealerCatHistory, setDealerCatHistory] = useState(null);   // { months:[{month, byCategory:{cat:{sub:qty}}}] }
  const [dCatSel, setDCatSel] = useState(new Set());   // selected categories (empty = ALL)
  const [dSubSel, setDSubSel] = useState(new Set());   // selected sub-cats (empty = ALL within selected cats)
  useEffect(() => {
    if (!dealer?.name) return;
    let cancelled = false;
    api.salesForDealer(dealer.name)
      .then(r => { if (!cancelled) setDealerCatHistory(r); })
      .catch(() => { if (!cancelled) setDealerCatHistory(null); });
    return () => { cancelled = true; };
  }, [dealer?.name]);

  // Distinct categories + sub-categories for this dealer (used to populate
  // the in-modal filter dropdowns).
  const dealerCats = useMemo(() => {
    if (!dealerCatHistory) return [];
    const set = new Set();
    for (const m of (dealerCatHistory.months || [])) {
      for (const c of Object.keys(m.byCategory || {})) set.add(c);
    }
    return [...set].sort();
  }, [dealerCatHistory]);

  // Seed the in-modal picker from the HOME (global) category selection, once,
  // when the dealer's history arrives. From there the picker is local state:
  // adding/removing categories changes only this popup, and the state dies
  // with the popup — the home filter is never written to. Reopening reseeds
  // from home again.
  const { excluded: globalExcluded } = useGlobalCategoryFilter();
  const seededRef = React.useRef(false);
  useEffect(() => {
    if (seededRef.current || !dealerCatHistory) return;
    seededRef.current = true;
    if (!globalExcluded || globalExcluded.size === 0) return;   // home = All → picker stays All
    const included = dealerCats.filter(c => !globalExcluded.has(c));
    if (included.length === dealerCats.length) return;          // nothing excluded for this dealer
    // Dealer sells none of the home-selected categories → match no category,
    // so category-era months show 0 (empty set would mean "All" here).
    setDCatSel(new Set(included.length ? included : ['__none__']));
  }, [dealerCatHistory, dealerCats, globalExcluded]);

  const dealerSubs = useMemo(() => {
    if (!dealerCatHistory) return [];
    const set = new Set();
    for (const m of (dealerCatHistory.months || [])) {
      for (const [c, subs] of Object.entries(m.byCategory || {})) {
        if (dCatSel.size > 0 && !dCatSel.has(c)) continue;
        for (const s of Object.keys(subs || {})) set.add(s);
      }
    }
    return [...set].sort();
  }, [dealerCatHistory, dCatSel]);

  // Per-month filtered achieved for THIS dealer. Map: "2026-06" → qty.
  const filteredByYM = useMemo(() => {
    const out = new Map();
    if (!dealerCatHistory) return out;
    for (const m of (dealerCatHistory.months || [])) {
      let total = 0;
      for (const [c, subs] of Object.entries(m.byCategory || {})) {
        if (dCatSel.size > 0 && !dCatSel.has(c)) continue;
        for (const [s, q] of Object.entries(subs || {})) {
          if (dSubSel.size > 0 && !dSubSel.has(s)) continue;
          total += (q || 0);
        }
      }
      out.set(m.month, total);
    }
    return out;
  }, [dealerCatHistory, dCatSel, dSubSel]);

  // Per-month category split for the chart tooltip: "2026-06" -> [{cat, qty}].
  // Filtered exactly like filteredByYM above, so the rows in the tooltip always
  // add up to the bar being hovered rather than to some other total.
  const breakdownByYM = useMemo(() => {
    const out = new Map();
    if (!dealerCatHistory) return out;
    for (const m of (dealerCatHistory.months || [])) {
      const rows = [];
      for (const [c, subs] of Object.entries(m.byCategory || {})) {
        if (dCatSel.size > 0 && !dCatSel.has(c)) continue;
        let q = 0;
        for (const [sub, v] of Object.entries(subs || {})) {
          if (dSubSel.size > 0 && !dSubSel.has(sub)) continue;
          q += (v || 0);
        }
        if (q) rows.push({ cat: c, qty: q });
      }
      rows.sort((a, b) => b.qty - a.qty);
      out.set(m.month, rows);
    }
    return out;
  }, [dealerCatHistory, dCatSel, dSubSel]);

  // Helper: "Jun-26" → "2026-06"
  const _ymOf = (lbl) => {
    if (!lbl) return '';
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(String(lbl).trim());
    if (!m) return '';
    const mi = months.indexOf(m[1].slice(0,3).toLowerCase());
    if (mi < 0) return '';
    let y = +m[2]; if (y < 100) y += 2000;
    return `${y}-${String(mi+1).padStart(2,'0')}`;
  };

  // Filter active when the user has picked any category OR any sub-category
  const dFilterActive = dCatSel.size > 0 || dSubSel.size > 0;

  // Build a months[] array that respects the in-modal filter when active.
  // Same rule as the app-wide category filter: every month that HAS a
  // category breakdown for this dealer shows the filtered qty; months from
  // before category tracking (no Sale rows) keep their raw historical value —
  // they can't be split by category, so zeroing them would erase real history.
  const monthsForView = useMemo(() => {
    if (!dFilterActive) return dealer.months;
    return MO.map((lbl, i) => {
      const ym = _ymOf(lbl);
      if (!ym || !filteredByYM.has(ym)) {
        return Number(dealer.months?.[i]) || 0;     // pre-category month — untouched
      }
      return filteredByYM.get(ym) || 0;
    });
  }, [dFilterActive, dealer.months, MO, filteredByYM]);

  const viewAchieved = monthsForView[selectedMonthIdx]||0;
  // 6-month average over the SAME series the chart draws, so the KPI agrees
  // with the bars. Mean of the up-to-6 months ending at the selected month.
  const viewAvg6 = useMemo(() => {
    if (!dFilterActive) return dealer.avg6m || 0;
    const hi = Math.min(selectedMonthIdx, monthsForView.length - 1);
    if (hi < 0) return 0;
    const lo = Math.max(0, hi - 5);
    let s = 0;
    for (let i = lo; i <= hi; i++) s += Number(monthsForView[i]) || 0;
    return Math.round(s / (hi - lo + 1));
  }, [dFilterActive, dealer.avg6m, monthsForView, selectedMonthIdx]);
  // Smart per-month target — see utils.monthTarget. Each month gets its own
  // target if uploaded; otherwise we fall back to the dealer's global target
  // ONLY for months that have actual sales (so historical Sheets data is OK).
  // The stored target is the LAMINATE target; the categories picked in this
  // popup turn it into theirs (Liner 100%, Louvres 30%, Polymer 10%), so the
  // target always measures the same categories as the achieved figure.
  const tgtFactor=includedFactor(dCatSel.has('__none__')?new Set(['__none__']):dCatSel);
  const tgtOf=i=>Math.round((monthTarget(dealer, i)||0)*tgtFactor);
  const lamViewTarget=monthTarget(dealer, selectedMonthIdx)||0;
  const viewTarget=tgtOf(selectedMonthIdx);
  const p=viewTarget?pct(viewTarget,viewAchieved):(viewAchieved>0?null:0);
  const tp=trendPct(monthsForView);
  const fc=forecast(monthsForView);

  // Chart / breakdown rows: view-cycle months this dealer's series has.
  const dmIdx=vIdx.filter(i=>i<monthsForView.length);
  const dmRev=[...dmIdx].reverse();
  const chartData=dmIdx.map(i=>({
    month:MO[i].slice(0,3),units:monthsForView[i]||0,
    target:tgtOf(i) || null,
    isSelected:i===selectedMonthIdx,
    label:MO[i],
    // null = this month predates category tracking, so it cannot be split.
    breakdown: breakdownByYM.get(_ymOf(MO[i])) || null,
  }));
  // Hovering a bar shows what made up that month: the split by category,
  // biggest first, with each one's share. The old tooltip only repeated the
  // number already printed above the bar.
  const CatTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    const rows = d.breakdown, total = d.units || 0;
    const num = n => Number(n || 0).toLocaleString('en-IN');
    return (
      <div style={{background:'var(--bg1)',border:'1px solid var(--b1)',borderRadius:12,
                   padding:'9px 12px',minWidth:190,boxShadow:'var(--shadowHover)'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:10,
                     paddingBottom:5,borderBottom:'1px solid var(--b1)'}}>
          <span style={{fontSize:12,fontWeight:700,color:'var(--t1)'}}>{d.label}</span>
          <span style={{marginLeft:'auto',fontSize:13,fontWeight:700,color:'var(--acc)',
                        fontVariantNumeric:'tabular-nums'}}>{num(total)}</span>
        </div>
        {d.target > 0 && (
          <div style={{fontSize:10.5,color:'var(--t3)',marginTop:4}}>Target {num(d.target)}</div>
        )}
        <div style={{marginTop:5}}>
          {rows === null
            ? <div style={{fontSize:10.5,color:'var(--t3)'}}>No category breakdown for this month</div>
            : rows.length === 0
              ? <div style={{fontSize:10.5,color:'var(--t3)'}}>No sales</div>
              : rows.map(r => (
                  <div key={r.cat} style={{display:'flex',gap:10,fontSize:11,lineHeight:1.65}}>
                    <span style={{color:'var(--t2)',maxWidth:150,overflow:'hidden',
                                  textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.cat}</span>
                    <span style={{marginLeft:'auto',fontWeight:700,color:'var(--t1)',
                                  fontVariantNumeric:'tabular-nums'}}>{num(r.qty)}</span>
                    <span style={{color:'var(--t3)',width:36,textAlign:'right',
                                  fontVariantNumeric:'tabular-nums'}}>
                      {total ? Math.round((r.qty / total) * 100) : 0}%
                    </span>
                  </div>
                ))}
        </div>
      </div>
    );
  };

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
      setFuDate(localYmd());
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
    if(saving)return;
    if(!edit.name.trim()){setSaveErr('Name required');return;}
    setSaving(true);setSaveErr('');
    try{
      const moLabel=MO[selectedMonthIdx];
      const newMonths=[...dealer.months];
      newMonths[selectedMonthIdx]=num(edit.achieved);
      const newMonthTargets={...(dealer.monthTargets||{}),[selectedMonthIdx]:num(edit.target)};
      const updated={...dealer,
        name:edit.name.trim(),zone:edit.zone,status:edit.status,salesman:edit.salesman,
        dealerType:edit.dealerType,
        achieved:num(edit.achieved),
        creditDays:num(edit.creditDays),creditLimit:num(edit.creditLimit),
        city:edit.city.trim(),state:edit.state.trim(),
        category:edit.category.trim(),categoryType:edit.categoryType.trim(),
        months:newMonths,
        monthTargets:newMonthTargets,
        monthlyData:{...(dealer.monthlyData||{}),
          [moLabel]:{...(dealer.monthlyData?.[moLabel]||{}),achieved:num(edit.achieved),target:num(edit.target)}},
      };
      // Save to DB if available
      const token=localStorage.getItem('stp_jwt');
      if(token&&dealer.id&&!dealer.id.startsWith('local_')){
        // No inner catch: a failed save must reach the outer catch so the
        // error is shown and the modal stays open instead of looking saved.
        await api.updateDealer(dealer.id,{
          name:updated.name,zone:updated.zone,status:updated.status,salesman:updated.salesman,
          dealerType:updated.dealerType,
          creditDays:updated.creditDays,creditLimit:updated.creditLimit,
          city:updated.city,state:updated.state,category:updated.category,categoryType:updated.categoryType,
          // Target + Achieved land on the VIEWED month only — same
          // monthlyData mechanism Monthly Entry uses. The server $sets the
          // two sub-fields, so the month's status/zone are preserved, and
          // other months are never touched.
          [`monthlyData.${moLabel}`]:{achieved:num(edit.achieved),target:num(edit.target)},
        });
      }
      onSave(updated);
      onLog('edit',`Updated: ${updated.name} (${moLabel})`);
      onClose();
    }catch(e){setSaveErr('Save failed: '+(e?.message||'please try again'));}
    setSaving(false);
  };

  const addNote=()=>{
    if(!newNote.trim())return;
    onAddNote({id:uid(),dealerId:dealer.id,content:newNote.trim(),type:noteType,dueDate:noteType==='followup'?dueDate:null,completed:false,createdAt:isoNow(),createdBy:currentUser.id});
    setNewNote('');setDueDate('');
  };

  // ── Purely presentational values for the hero (derived from data above) ──
  const dmName=dealer.name||'?';
  const dmInitials=(dmName.replace(/[^A-Za-z0-9 ]/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('')||'?').toUpperCase();
  const dmHue=dmName.charCodeAt(0)*37%360;
  const dmLoc=[dealer.city,dealer.state].filter(Boolean).join(', ')+(dealer.pincode?` — ${dealer.pincode}`:'');
  const dmSalesName=users[dealer.salesman]?.name||dealer.salesman;
  const dmOutDue=outRecord?.latestOutstanding>0;
  const dmPClr=pclr(p);
  const dmTabs=[
    {k:'overview',l:'Overview',I:LayoutGrid},
    {k:'monthly',l:'Monthly Detail',I:Calendar},
    {k:'edit',l:'Edit',I:Pencil},
    {k:'notes',l:'Notes & Follow-ups',I:MessageSquare,badge:dealerNotes.length>0?<span className="count-pill">{dealerNotes.length}</span>:null},
    {k:'samples',l:'Samples',I:Package},
    {k:'visits',l:'Visits',I:MapPin},
    {k:'outstanding',l:'Outstanding & Follow-ups',I:Wallet,tone:dmOutDue?'var(--red)':undefined,
      badge:dmOutDue?<span className="dm-due">₹{Number(outRecord.latestOutstanding).toLocaleString('en-IN')}</span>:null},
    {k:'categories',l:'Categories',I:Tag},
  ];

  return(
    <div className="overlay dm-ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <style>{DM_CSS}</style>
      <div className="modal dm-modal">
        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="dm-hero">
          <button className="btn dm-x" onClick={onClose} title="Close"><X size={16}/></button>
          <div className="dm-id">
            <span className="ini dm-ava" style={{'--h':dmHue}}>{dmInitials}</span>
            <div style={{minWidth:0,flex:1}}>
              <div className="dm-eyebrow">Dealer record</div>
              <div className="dm-name">{dealer.name}</div>
              <div className="dm-subline">
                {dmLoc&&<span><MapPin size={12}/> {dmLoc}</span>}
                {dealer.zone&&<span><Compass size={12}/> {dealer.zone}</span>}
                {isAdmin&&<span><User size={12}/> {dmSalesName}</span>}
              </div>
              <div className="dm-pills">
                <StatusBadge status={dealer.perfStatus} emptyLabel="NEW DEALER"/>{dealer.status && dealer.status!=='NONE' && <StatusBadge status={dealer.status}/>}
                {dealer.dealerType&&dealer.dealerType!=='None'&&<span className="dm-pill" style={{'--tone':'var(--pur)'}}>{dealer.dealerType}</span>}
                {dealer.category&&<span className="dm-pill" style={{'--tone':'var(--acc)'}}><Layers size={10}/>{dealer.category}{dealer.categoryType?` / ${dealer.categoryType}`:''}</span>}
                {dealer.address&&<span className="chip dm-addr" title={dealer.address}>{dealer.address}</span>}
                {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span className="dm-pill" style={{'--tone':'var(--yel)'}}><Calendar size={10}/>Viewing {MO[selectedMonthIdx]}</span>}
              </div>
            </div>
          </div>
          <div className="dm-acts">
            <button className="btn" title="Download full dealer card as PNG" onClick={()=>downloadDealerCard(dealer,users,selectedMonthIdx,ctxMO)}><Camera size={13}/> Download</button>
            <button className="btn" title="Share dealer info" onClick={()=>shareDealerCard(dealer,users,selectedMonthIdx,ctxMO)}><Share2 size={13}/> Share</button>
            {isAdmin&&<button className="btnd" onClick={async()=>{
              // Wait for the confirm dialog + delete to finish before closing.
              // onDelete may resolve true/false (deleted / cancelled); if it
              // resolves undefined (older handler) we still close — but only
              // after it has settled. A throw keeps the modal open.
              let r;
              try{ r=await onDelete(dealer.id); }catch(e){ console.warn('Delete failed:',e?.message); return; }
              if(r===undefined||r) onClose();
            }}><Trash2 size={13}/> Delete</button>}
          </div>

          {/* KPI tiles */}
          <div className="dm-kpis">
            <div className="dm-kpi" style={{'--tone':'var(--grn)'}} onClick={()=>setTab('monthly')}>
              <div className="dm-kpi-top"><span className="dm-kpi-ico"><TrendingUp size={15}/></span><span className="dm-kpi-lbl">{selMoLabel} Achieved</span></div>
              <div className="dm-kpi-v">{viewAchieved}</div>
              <div className="dm-kpi-sub">6-mo avg {viewAvg6||'—'}{dFilterActive?' · filtered':''}</div>
            </div>
            <div className="dm-kpi" style={{'--tone':'var(--acc)'}} onClick={()=>setTab('monthly')}>
              <div className="dm-kpi-top"><span className="dm-kpi-ico"><Target size={15}/></span><span className="dm-kpi-lbl">{selMoLabel} Target</span></div>
              <div className="dm-kpi-v">{viewTarget||'—'}</div>
              <div className="dm-kpi-sub">Forecast {fc} next month</div>
            </div>
            <div className="dm-kpi" style={{'--tone':dmPClr}} onClick={()=>setTab('monthly')}>
              <div className="dm-kpi-top"><span className="dm-kpi-ico"><Activity size={15}/></span><span className="dm-kpi-lbl">Achievement</span></div>
              <div className="dm-kpi-v">{p!==null?spct(viewTarget,viewAchieved):'N/T'}</div>
              <div className="pbar dm-pbar"><div style={{width:Math.min(p||0,100)+'%',background:dmPClr}}/></div>
            </div>
            <div className="dm-kpi" style={{'--tone':outRecord?(dmOutDue?'var(--red)':'var(--grn)'):'var(--t3)'}} onClick={()=>setTab('outstanding')}>
              <div className="dm-kpi-top"><span className="dm-kpi-ico"><Wallet size={15}/></span><span className="dm-kpi-lbl">Outstanding</span></div>
              <div className="dm-kpi-v">{outRecord?'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'):'—'}</div>
              <div className="dm-kpi-sub">
                {!outRecord?'No outstanding data'
                  :outRecord.trend>0?<span className="trend down">▲ ₹{Number(outRecord.trend).toLocaleString('en-IN')}</span>
                  :outRecord.trend<0?<span className="trend up">▼ ₹{Number(Math.abs(outRecord.trend)).toLocaleString('en-IN')}</span>
                  :'Stable'}
              </div>
            </div>
            <div className="dm-kpi" style={{'--tone':tp>0?'var(--grn)':tp<0?'var(--red)':'var(--t3)'}}>
              <div className="dm-kpi-top"><span className="dm-kpi-ico">{tp<0?<TrendingDown size={15}/>:<TrendingUp size={15}/>}</span><span className="dm-kpi-lbl">Trend</span></div>
              <div className="dm-kpi-v">{(tp>0?'+':'')+tp+'%'}</div>
              <div className="dm-kpi-sub">3m vs 3m</div>
            </div>
          </div>
          {lamViewTarget>0&&(
            <div className="dm-cattgt">
              <span className="dm-cattgt-l">{selMoLabel} target by category</span>
              {catTargets(lamViewTarget).map(c=>{
                const on=dCatSel.size===0||dCatSel.has(c.cat);
                return <span key={c.cat} className={'dm-cattgt-c'+(on?'':' off')}>{c.label} <b>{c.value.toLocaleString('en-IN')}</b></span>;
              })}
            </div>
          )}
        </div>

        {/* ── Sticky pill tab bar ─────────────────────────────────────── */}
        <div className="dm-tabbar">
          <div className="seg dm-seg">
            {dmTabs.map(t=>(
              <button key={t.k} className={'seg-b'+(tab===t.k?' on':'')} onClick={()=>setTab(t.k)}
                style={{'--tone':t.tone||'var(--acc)',...(t.tone&&tab!==t.k?{color:t.tone}:null)}}>
                <t.I size={13}/> {t.l}{t.badge}
              </button>
            ))}
          </div>
        </div>

        <div className="dm-body">
        {tab==='overview'&&(
          <div className="dm-stack">
            {/* ── In-modal category + sub-category filter ────────────── */}
            {dealerCats.length > 0 && (
              <div className="dm-card dm-filter">
                <span className="dm-lbl">
                  <Filter size={12}/> Show data for
                </span>
                <CategoryFilter
                  categories={dealerCats}
                  excluded={new Set(dealerCats.filter(c => !(dCatSel.size === 0 || dCatSel.has(c))))}
                  onToggle={(c) => {
                    setDCatSel(prev => {
                      // Translate include/exclude UX from CategoryFilter (excluded) into our
                      // "selected" semantic. If currently ALL (size 0), clicking c means
                      // "exclude c" → select everything except c.
                      const allCats = dealerCats;
                      let cur = prev.size === 0 ? new Set(allCats) : new Set(prev);
                      cur.has(c) ? cur.delete(c) : cur.add(c);
                      // If everything is selected, collapse back to "ALL" sentinel
                      if (cur.size === allCats.length) cur = new Set();
                      return cur;
                    });
                    setDSubSel(new Set());   // reset sub-cat when cat changes
                  }}
                  onClear={() => { setDCatSel(new Set()); setDSubSel(new Set()); }}
                  onSelectOnly={(c) => { setDCatSel(new Set([c])); setDSubSel(new Set()); }}
                  label="Categories"
                  compact
                />
                {dealerSubs.length > 1 && (
                  <CategoryFilter
                    categories={dealerSubs}
                    excluded={new Set(dealerSubs.filter(s => !(dSubSel.size === 0 || dSubSel.has(s))))}
                    onToggle={(s) => {
                      setDSubSel(prev => {
                        const allSubs = dealerSubs;
                        let cur = prev.size === 0 ? new Set(allSubs) : new Set(prev);
                        cur.has(s) ? cur.delete(s) : cur.add(s);
                        if (cur.size === allSubs.length) cur = new Set();
                        return cur;
                      });
                    }}
                    onClear={() => setDSubSel(new Set())}
                    onSelectOnly={(s) => setDSubSel(new Set([s]))}
                    label="Sub-Categories"
                    compact
                  />
                )}
                {dFilterActive && (
                  <span className="dm-pill" style={{'--tone':'var(--yel)'}}>
                    Showing only {[...(dCatSel.size?dCatSel:[])].join(', ')}
                    {dSubSel.size > 0 && <> · {[...dSubSel].join(', ')}</>}
                  </span>
                )}
              </div>
            )}

            <div className="dm-card">
              <div className="sec-title">
                <span className="sec-ico" style={{'--tone':'var(--acc)'}}><BarChart3 size={15}/></span> {dmIdx.length}-Month Performance {dmIdx.length>0&&<span className="sec-note">{MO[dmIdx[0]]} → {MO[dmIdx[dmIdx.length-1]]}</span>} {dealer.target>0&&<span className="sec-note" style={{color:'var(--grn)'}}>— dashed = target</span>}
                {selectedMonthIdx!==CURRENT_MONTH_IDX&&<span className="sec-note" style={{color:'var(--yel)'}}>(yellow bar = selected: {MO[selectedMonthIdx]})</span>}
                {dFilterActive && <span className="sec-note" style={{color:'var(--yel)'}}>· filtered</span>}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={chartData} margin={{top:20,right:8,bottom:0,left:-4}}>
                  <defs>
                    <linearGradient id="dmBarFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={.55}/>
                    </linearGradient>
                    <linearGradient id="dmBarSel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={.55}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false}/>
                  <XAxis dataKey="month" tickLine={false} axisLine={false}/>
                  <YAxis tickLine={false} axisLine={false} width={44}/>
                  <Tooltip content={<CatTooltip/>}/>
                  <Bar dataKey="units" radius={[8,8,0,0]} maxBarSize={46} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:700}}>
                    {chartData.map((entry,index)=>(<Cell key={index} fill={entry.isSelected?'url(#dmBarSel)':'url(#dmBarFill)'}/>))}
                  </Bar>
                  {dealer.target>0&&<Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{r:5}}/>}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Full KPI grid */}
            <div className="dm-card">
              <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--pur)'}}><Gauge size={15}/></span> Key figures <span className="sec-note">{MO[selectedMonthIdx]}</span></div>
              <div className="dm-minis">
                <DmStat label={`${selMoLabel} Target`} value={viewTarget||'—'}/>
                <DmStat label={`${selMoLabel} Achieved`} value={viewAchieved} color="var(--grn)"/>
                <DmStat label="Achievement" value={p!==null?spct(viewTarget,viewAchieved):'N/T'} color={pclr(p)}/>
                <DmStat label="6-mo Avg" value={viewAvg6||'—'}/>
                <DmStat label="Forecast" value={fc} color="var(--acc)" sub="next month"/>
                <DmStat label="Trend" value={(tp>0?'+':'')+tp+'%'} color={tp>0?'var(--grn)':tp<0?'var(--red)':'var(--t3)'} sub="3m vs 3m"/>
                <DmStat label="Credit Days" value={dealer.creditDays?dealer.creditDays+'d':'—'}/>
                <DmStat label="Credit Limit" value={fcash(dealer.creditLimit)}/>
                <DmStat label={`${dmIdx.length}-mo Total`} value={dmIdx.reduce((a,i)=>a+(Number(monthsForView[i])||0),0)}/>
                <DmStat label={`${dmIdx.length}-mo High`} value={Math.max(0,...dmIdx.map(i=>Number(monthsForView[i])||0))}/>
                <DmStat label="Active Months" value={dmIdx.filter(i=>(Number(monthsForView[i])||0)>0).length+'/'+dmIdx.length}/>
                {/* {dealer.category&&<KPI label="Category" value={dealer.category} color="#6366f1"/>}
                {dealer.categoryType&&<KPI label="Cat Type" value={dealer.categoryType} color="#6366f1"/>} */}
                {dealer.city&&<DmStat label="City" value={dealer.city}/>}
                {dealer.state&&<DmStat label="State" value={dealer.state}/>}
                {dealer.zone&&<DmStat label="Zone" value={dealer.zone}/>}
              </div>
            </div>
          </div>
        )}

        {tab==='monthly'&&(
          <div className="dm-card">
            <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--acc)'}}><Calendar size={15}/></span> Month-by-Month Breakdown <span className="sec-note">Full detail · newest first</span></div>
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
                  {dmRev.map(i=>{
                    const v=monthsForView[i];
                    const mt=tgtOf(i);
                    const prev=i>0?monthsForView[i-1]:null;
                    const diff=prev!=null?v-prev:null;
                    const diffP=prev&&prev>0?Math.round((diff/prev)*100):null;
                    const vsPct=mt?Math.round((v/mt)*100):null;
                    const maxV=Math.max(...dmIdx.map(j=>Number(monthsForView[j])||0),1);
                    return(
                      <tr key={i} style={{background:i===selectedMonthIdx?'color-mix(in srgb, var(--yel) 8%, transparent)':'transparent'}}>
                        <td style={{fontWeight:i===selectedMonthIdx?700:500,color:i===selectedMonthIdx?'var(--yel)':i===CURRENT_MONTH_IDX?'var(--acc)':'var(--t2)',whiteSpace:'nowrap'}}>
                          {MO[i]}{i===selectedMonthIdx?' ◀':''}{i===CURRENT_MONTH_IDX?' ★':''}
                        </td>
                        <td style={{textAlign:'right',fontWeight:700,color:v>0?'var(--t1)':'var(--t3)'}}>{v||'—'}</td>
                        <td style={{textAlign:'right',color:'var(--t3)'}}>{mt||'—'}</td>
                        <td style={{textAlign:'right'}}>{vsPct!==null
                          ?<span className="dm-pill" style={{'--tone':vsPct>=100?'var(--grn)':vsPct>=60?'var(--yel)':'var(--red)'}}>{vsPct+'%'}</span>
                          :<span style={{color:'var(--t3)'}}>—</span>}</td>
                        <td style={{textAlign:'right',fontWeight:600,color:diff>0?'var(--grn)':diff<0?'var(--red)':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
                        <td style={{textAlign:'right'}}>{diffP!=null
                          ?<span className={'trend '+(diffP>0?'up':diffP<0?'down':'')}>{(diffP>0?'+':'')+diffP+'%'}</span>
                          :<span style={{color:'var(--t3)'}}>—</span>}</td>
                        <td style={{minWidth:90}}>
                          <div style={{display:'flex',alignItems:'center',gap:4}}>
                            <div className="dm-bar"><div style={{width:Math.round((v/maxV)*100)+'%',background:i===selectedMonthIdx?'var(--yel)':'var(--acc)'}}/></div>
                            {mt>0&&<div className="dm-bar"><div style={{width:Math.min(Math.round((v/mt)*100),100)+'%',background:vsPct>=100?'var(--grn)':vsPct>=60?'var(--yel)':'var(--red)'}}/></div>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{color:'var(--t1)',fontWeight:800}}>TOTAL <span style={{fontWeight:600,color:'var(--t3)',fontSize:10.5}}>{dmIdx.length?`${MO[dmIdx[0]]} → ${MO[dmIdx[dmIdx.length-1]]}`:''}</span></td>
                    <td style={{textAlign:'right',fontWeight:800,color:'var(--grn)'}}>{dmIdx.reduce((a,i)=>a+(Number(monthsForView[i])||0),0)}</td>
                    <td style={{textAlign:'right',color:'var(--t3)'}}>—</td>
                    <td colSpan="4"/>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {tab==='edit'&&(
          <div className="dm-stack">
            <div className="dm-card">
              <div className="sec-title">
                <span className="sec-ico" style={{'--tone':'var(--acc)'}}><User size={15}/></span> Dealer profile
                {officeOnly&&<span className="sec-note" style={{display:'inline-flex',alignItems:'center',gap:4}}><Lock size={11}/> Name, zone &amp; credit terms are office-only</span>}
              </div>
              <div className="dm-form">
                <div className="field dm-full"><label>Dealer Name{officeOnly&&<Lock size={10} className="dm-lock"/>}</label><input className="inp" value={edit.name} disabled={officeOnly} title={officeOnly?lockedTip:undefined} onChange={e=>setEdit({...edit,name:e.target.value})}/></div>
                <div className="field"><label>Zone{officeOnly&&<Lock size={10} className="dm-lock"/>}</label>
                  <select className="sel inp" value={edit.zone} disabled={officeOnly} title={officeOnly?lockedTip:undefined} onChange={e=>setEdit({...edit,zone:e.target.value})}>
                    <option value="">None</option>
                    {zoneOptions.map(z=><option key={z}>{z}</option>)}
                  </select>
                </div>
                <div className="field"><label>Dealer Type</label>
                  <select className="sel inp" value={edit.dealerType} onChange={e=>setEdit({...edit,dealerType:e.target.value})}>
                    {DEALER_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="field"><label>Selected User</label>
                  <select className="sel inp" value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>
                    {['NONE','STAR','KEY ACCOUNT','ACHIEVER','REACTIVE'].map(s=><option key={s}>{s}</option>)}
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
              </div>
            </div>

            <div className="dm-card">
              <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--grn)'}}><Target size={15}/></span> Target &amp; achievement <span className="sec-note">{MO[selectedMonthIdx]} only</span></div>
              <div className="dm-form">
                <div className="field"><label>{MO[selectedMonthIdx]} Target</label><input type="number" className="inp" value={edit.target} onChange={e=>setEdit({...edit,target:e.target.value})}/></div>
                <div className="field"><label>{MO[selectedMonthIdx]} Achieved</label><input type="number" className="inp" value={edit.achieved} onChange={e=>setEdit({...edit,achieved:e.target.value})}/></div>
              </div>
            </div>

            <div className="dm-card">
              <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--yel)'}}><CreditCard size={15}/></span> Credit terms</div>
              <div className="dm-form">
                <div className="field"><label>Credit Days{officeOnly&&<Lock size={10} className="dm-lock"/>}</label><input type="number" className="inp" disabled={officeOnly} title={officeOnly?lockedTip:undefined} value={edit.creditDays} onChange={e=>setEdit({...edit,creditDays:e.target.value})}/></div>
                <div className="field"><label>Credit Limit ₹{officeOnly&&<Lock size={10} className="dm-lock"/>}</label><input type="number" className="inp" disabled={officeOnly} title={officeOnly?lockedTip:undefined} value={edit.creditLimit} onChange={e=>setEdit({...edit,creditLimit:e.target.value})}/></div>
              </div>
            </div>

            <div className="dm-savebar">
              {saveErr&&<span role="alert" className="dm-err">{saveErr}</span>}
              <span className="spacer"/>
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btnp" onClick={save} disabled={saving} style={saving?{opacity:.6,cursor:'wait'}:undefined}><Save size={13} style={{marginRight:6}}/>{saving?'Saving…':'Save Changes'}</button>
            </div>
          </div>
        )}

        {tab==='notes'&&(
          <div className="dm-stack">
            <div className="dm-card dm-tint">
              <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--acc)'}}><Plus size={15}/></span> Add new entry</div>
              <div className="row" style={{gap:8,marginBottom:8,flexWrap:'wrap'}}>
                <select className="sel" value={noteType} onChange={e=>setNoteType(e.target.value)}>
                  <option value="note">📝 Note</option>
                  <option value="call">📞 Call log</option>
                  <option value="visit">📍 Visit log</option>
                  <option value="followup">⏰ Follow-up</option>
                </select>
                {noteType==='followup'&&(<input type="date" className="inp" style={{width:170,maxWidth:'100%'}} value={dueDate} onChange={e=>setDueDate(e.target.value)}/>)}
              </div>
              <textarea className="inp" style={{minHeight:70,resize:'vertical',fontFamily:'inherit',width:'100%'}} placeholder={noteType==='followup'?'What needs following up?':'Write a note...'} value={newNote} onChange={e=>setNewNote(e.target.value)}/>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                <button className="btnp" onClick={addNote} style={{display:'inline-flex',alignItems:'center',gap:5}}><Plus size={13}/> Add</button>
              </div>
            </div>
            {followups.length>0&&(
              <div className="dm-card">
                <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--yel)'}}><Bell size={15}/></span> Follow-ups <span className="count-pill">{followups.length}</span></div>
                <div className="dm-list">
                {followups.map(n=>{
                  const overdue=!n.completed&&n.dueDate&&new Date(n.dueDate)<new Date();
                  return(
                    <div key={n.id} className="att-card" style={{'--tone':overdue?'var(--red)':n.completed?'var(--grn)':'var(--yel)',cursor:'default',opacity:n.completed?0.55:1,background:overdue?'color-mix(in srgb, var(--red) 6%, var(--bg1))':undefined}}>
                      <div className="row" style={{marginBottom:4}}>
                        <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})} style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'var(--grn)':'var(--t3)',padding:0,display:'grid'}}>{n.completed?<CheckSquare size={16}/>:<Square size={16}/>}</button>
                        <span className="dm-pill" style={{'--tone':overdue?'var(--red)':n.completed?'var(--grn)':'var(--yel)'}}>{overdue&&'⚠ Overdue · '}Due {new Date(n.dueDate).toLocaleDateString('en-IN')}</span>
                        <span className="spacer"/>
                        <button onClick={()=>onDeleteNote(n.id)} className="dm-icobtn" title="Delete"><Trash2 size={12}/></button>
                      </div>
                      <div style={{fontSize:13,color:'var(--t1)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
                      <div className="dm-meta">by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleDateString('en-IN')}</div>
                    </div>
                  );
                })}
                </div>
              </div>
            )}
            {regularNotes.length>0&&(
              <div className="dm-card">
                <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--acc)'}}><MessageSquare size={15}/></span> Activity <span className="count-pill">{regularNotes.length}</span></div>
                <div className="dm-list">
                {regularNotes.map(n=>{
                  const tone=n.type==='call'?'var(--acc)':n.type==='visit'?'var(--grn)':'var(--pur)';
                  const TI=n.type==='call'?Phone:n.type==='visit'?MapPin:StickyNote;
                  return(
                  <div key={n.id} className="att-card" style={{'--tone':tone,cursor:'default'}}>
                    <div className="row" style={{marginBottom:4}}>
                      <span className="dm-pill" style={{'--tone':tone,textTransform:'capitalize'}}><TI size={10}/>{n.type}</span>
                      <span className="spacer"/>
                      <button onClick={()=>onDeleteNote(n.id)} className="dm-icobtn" title="Delete"><Trash2 size={12}/></button>
                    </div>
                    <div style={{fontSize:13,color:'var(--t1)'}}>{n.content}</div>
                    <div className="dm-meta">by {users[n.createdBy]?.name||n.createdBy} · {new Date(n.createdAt).toLocaleString('en-IN')}</div>
                  </div>
                  );
                })}
                </div>
              </div>
            )}
            {dealerNotes.length===0&&(
              <div className="dm-empty"><span className="sec-ico lg" style={{'--tone':'var(--acc)'}}><MessageSquare size={18}/></span><div>No notes yet.</div></div>
            )}
          </div>
        )}

        {tab==='samples'&&(
          <SamplesTab dealer={dealer} currentUser={currentUser}/>
        )}
        {tab==='visits'&&(
          <DealerVisitsTab dealer={dealer}/>
        )}
        {tab==='categories'&&(
          <div style={{padding:'4px 0'}}>
            <CategorySalesPanel dealerName={dealer.name}/>
          </div>
        )}
        {tab==='outstanding'&&(
          <div className="dm-stack">
            {/* Follow-up section — always visible */}
            <div className="dm-card">
              <div className="sec-title">
                <span className="sec-ico" style={{'--tone':'var(--yel)'}}><Calendar size={15}/></span> Payment Follow-ups
                {pendingFollowups.length>0&&<span className="dm-pill" style={{'--tone':'var(--red)'}}>{pendingFollowups.length} follow-up{pendingFollowups.length>1?'s':''}</span>}
                <div style={{flex:1}}/>
                <button onClick={()=>setShowFuModal(s=>!s)} className="btnp" style={{fontSize:12,display:'flex',alignItems:'center',gap:5}}>
                  <Plus size={13}/> Add Follow-up
                </button>
              </div>

              {/* Add followup form */}
              {showFuModal&&(
                <div className="dm-tint dm-inner">
                  <div className="dm-form dm-form2" style={{marginBottom:10}}>
                    <div className="field">
                      <label>Follow-up Date *</label>
                      <input type="date" className="inp" value={fuDate} min={localYmd()} onChange={e=>setFuDate(e.target.value)} style={{width:'100%'}}/>
                    </div>
                    <div className="field">
                      <label>Expected ₹</label>
                      <input type="number" className="inp" value={fuAmount} onChange={e=>setFuAmount(e.target.value)} placeholder="0" style={{width:'100%'}}/>
                    </div>
                  </div>
                  <div style={{marginBottom:10}}>
                    <VoiceTextarea value={fuComment} onChange={setFuComment}
                      placeholder="Comment e.g. Cheque promised, Will pay after 15th… (tap 🎤 to speak)"
                      rows={2}/>
                  </div>
                  <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                    <button onClick={()=>setShowFuModal(false)} className="btn" style={{fontSize:12}}>Cancel</button>
                    <button onClick={addOutFollowup} disabled={fuSaving} className="btnp" style={{fontSize:12,display:'flex',alignItems:'center',gap:4}}>
                      {fuSaving?'Saving...':'Save Follow-up'}
                    </button>
                  </div>
                </div>
              )}

              {/* Existing followups */}
              {dealerFollowups.length>0?(
                <div className="dm-list">
                  {[...dealerFollowups].sort((a,b)=>new Date(a.followupDate)-new Date(b.followupDate)).map(f=>{
                    const days    = daysUntil(f.followupDate);
                    const isDone  = f.status==='done';
                    const isOver  = !isDone&&days<0;
                    const tone    = isDone?'var(--grn)':isOver?'var(--red)':'var(--acc)';
                    return(
                      <div key={f._id} className="att-card" style={{'--tone':tone,cursor:'default',opacity:isDone?0.6:1}}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3,flexWrap:'wrap'}}>
                              <span style={{fontSize:12.5,fontWeight:700,color:isDone?'var(--grn)':isOver?'var(--red)':'var(--t1)'}}>{f.followupDate}</span>
                              <span className="dm-pill" style={{'--tone':tone}}>
                                {isDone?'✓ Done':isOver?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
                              </span>
                              {f.amount>0&&<span style={{fontSize:11,color:'var(--yel)',fontWeight:700}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
                            </div>
                            {f.comment&&<div style={{fontSize:11.5,color:'var(--t2)'}}>{f.comment}</div>}
                          </div>
                          <div style={{display:'flex',gap:4,alignItems:'center'}}>
                            {!isDone&&<button onClick={()=>markFollowupDone(f._id)} className="dm-done"><Check size={11}/> Done</button>}
                            <button onClick={()=>deleteFollowup(f._id)} className="dm-icobtn" title="Delete"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ):<div style={{fontSize:12,color:'var(--t3)',textAlign:'center',padding:'12px 0'}}>No follow-ups yet — add one above</div>}
            </div>

            {!outRecord?(
              <div className="dm-empty">
                <span className="sec-ico lg" style={{'--tone':'var(--t3)'}}><Wallet size={18}/></span>
                <div style={{fontSize:13,color:'var(--t2)',fontWeight:700}}>No outstanding data found</div>
                <div style={{fontSize:11.5}}>Upload outstanding Excel from the Outstanding section</div>
              </div>
            ):(
              <div className="dm-card">
                <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--red)'}}><Wallet size={15}/></span> Outstanding history</div>
                <div className="dm-minis dm-minis3" style={{marginBottom:14}}>
                  {[
                    {l:'Latest Outstanding',v:'₹'+Number(outRecord.latestOutstanding).toLocaleString('en-IN'),c:outRecord.latestOutstanding>0?'var(--red)':'var(--grn)'},
                    {l:'Highest Ever',v:'₹'+Number(outRecord.maxOutstanding).toLocaleString('en-IN'),c:'var(--yel)'},
                    {l:'Trend',v:outRecord.trend>0?'▲ ₹'+Number(outRecord.trend).toLocaleString('en-IN'):outRecord.trend<0?'▼ ₹'+Number(Math.abs(outRecord.trend)).toLocaleString('en-IN'):'Stable',c:outRecord.trend>0?'var(--red)':outRecord.trend<0?'var(--grn)':'var(--t3)'},
                  ].map(k=>(
                    <DmStat key={k.l} label={k.l} value={k.v} color={k.c}/>
                  ))}
                </div>
                {outRecord.monthCols&&outRecord.monthCols.length>0&&(
                  <div className="scroll">
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
                              <td style={{textAlign:'right',fontWeight:700,color:v===0?'var(--grn)':'var(--red)'}}>{v>0?'₹'+Number(v).toLocaleString('en-IN'):'✓ Nil'}</td>
                              <td style={{textAlign:'right',color:change>0?'var(--red)':change<0?'var(--grn)':'var(--t3)',fontWeight:600}}>{change!==0?(change>0?'▲':'▼')+'₹'+Number(Math.abs(change)).toLocaleString('en-IN'):'—'}</td>
                              <td>
                                <div className="dm-bar" style={{width:120,flex:'none'}}>
                                  <div style={{width:barW,background:v===0?'var(--grn)':'var(--red)'}}/>
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
    </div>
  );
};

export default DealerModal;
