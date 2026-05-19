// import React, { useState, useMemo, useEffect, useRef } from 'react';
// import { Search, Plus, Download, Trash2, X, CheckSquare, Square, ArrowUpRight, ArrowDownRight, MessageSquare, Columns, List, GripVertical } from 'lucide-react';
// import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
// import { pct, spct, pclr, fcash, num, trendPct } from '../utils';
// import { useMonth } from '../context';
// import { StatusBadge, Avatar, MiniBars, MultiSelect } from './UI';

// // ── Drag-and-drop Kanban board ────────────────────────────
// const STATUS_COLORS = {
//   'ACTIVE':'#34d399','ACHIVERS':'#34d399','ACHIEVERS':'#34d399',
//   'KEY ACCOUNT':'#a78bfa','INACTIVE':'#fbbf24','RECENTLY INACTIVE':'#fb923c',
//   'DEAD':'#f87171','NEW':'#22d3ee','PROSPECT':'#818cf8'
// };
// const getStatusColor = s => STATUS_COLORS[(s||'').toUpperCase()] || '#55546a';

// function KanbanBoard({ dealers, selectedMonthIdx, users, onEdit, onUpdateStatus, isAdmin }) {
//   // ordered columns — persisted in localStorage for drag reorder
//   const defaultCols = [...new Set(dealers.map(d=>(d.status||'OTHER').trim()))].filter(Boolean);
//   const [cols, setCols] = useState(() => {
//     try {
//       const saved = JSON.parse(localStorage.getItem('stp_kanban_cols')||'null');
//       if(saved) {
//         // merge: add new statuses from data, keep saved order
//         const merged = [...saved.filter(c=>defaultCols.includes(c)), ...defaultCols.filter(c=>!saved.includes(c))];
//         return merged;
//       }
//     } catch {}
//     return defaultCols;
//   });
//   const [dragCol, setDragCol] = useState(null);       // col being reordered
//   const [dragCard, setDragCard] = useState(null);     // {dealerId, fromStatus}
//   const [overCol, setOverCol] = useState(null);
//   const [overCard, setOverCard] = useState(null);

//   // keep cols in sync when new statuses appear
//   useEffect(()=>{
//     const current = [...new Set(dealers.map(d=>(d.status||'OTHER').trim()))].filter(Boolean);
//     setCols(prev => {
//       const merged = [...prev.filter(c=>current.includes(c)), ...current.filter(c=>!prev.includes(c))];
//       localStorage.setItem('stp_kanban_cols', JSON.stringify(merged));
//       return merged;
//     });
//   },[dealers]);

//   // ── Column drag ────────────────────────────────────────
//   const onColDragStart = (e, col) => { setDragCol(col); e.dataTransfer.effectAllowed='move'; };
//   const onColDragOver  = (e, col) => { e.preventDefault(); setOverCol(col); };
//   const onColDrop      = (e, targetCol) => {
//     e.preventDefault();
//     if(!dragCol||dragCol===targetCol)return;
//     setCols(prev=>{
//       const next=[...prev];
//       const fi=next.indexOf(dragCol), ti=next.indexOf(targetCol);
//       if(fi<0||ti<0)return prev;
//       next.splice(fi,1); next.splice(ti,0,dragCol);
//       localStorage.setItem('stp_kanban_cols', JSON.stringify(next));
//       return next;
//     });
//     setDragCol(null); setOverCol(null);
//   };

//   // ── Card drag (move dealer to different status) ────────
//   const onCardDragStart = (e, dealerId, status) => {
//     setDragCard({dealerId, fromStatus:status});
//     e.dataTransfer.effectAllowed='move';
//     e.stopPropagation();
//   };
//   const onCardDrop = (e, targetStatus) => {
//     e.preventDefault();
//     if(!dragCard||dragCard.fromStatus===targetStatus)return;
//     onUpdateStatus(dragCard.dealerId, targetStatus);
//     setDragCard(null); setOverCol(null);
//   };

//   const dealersByStatus = useMemo(()=>{
//     const map={};
//     dealers.forEach(d=>{
//       const s=(d.status||'OTHER').trim();
//       if(!map[s])map[s]=[];
//       map[s].push(d);
//     });
//     return map;
//   },[dealers]);

//   return(
//     <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:12,alignItems:'flex-start',minHeight:400}}>
//       {cols.map(col=>{
//         const colDealers=(dealersByStatus[col]||[]).sort((a,b)=>(b.months[selectedMonthIdx]||0)-(a.months[selectedMonthIdx]||0));
//         const colTotal=colDealers.reduce((s,d)=>s+(d.months[selectedMonthIdx]||0),0);
//         const clr=getStatusColor(col);
//         const isOver=overCol===col&&dragCard&&dragCard.fromStatus!==col;
//         return(
//           <div key={col}
//             draggable onDragStart={e=>onColDragStart(e,col)} onDragOver={e=>onColDragOver(e,col)}
//             onDrop={e=>{ dragCol?onColDrop(e,col):onCardDrop(e,col); }} onDragEnd={()=>{setDragCol(null);setDragCard(null);setOverCol(null);}}
//             style={{
//               minWidth:220, maxWidth:240, flexShrink:0,
//               background: isOver?`${clr}18`:'var(--bg1)',
//               border:`1.5px solid ${isOver?clr:dragCol===col?clr+'66':'var(--b1)'}`,
//               borderRadius:10, overflow:'hidden',
//               transition:'border .15s,background .15s',
//               opacity: dragCol===col?0.5:1,
//             }}>
//             {/* Column header */}
//             <div style={{padding:'10px 12px',background:`${clr}18`,borderBottom:`1px solid ${clr}33`,
//               display:'flex',alignItems:'center',gap:6,cursor:'grab',userSelect:'none'}}>
//               <GripVertical size={12} color={clr} style={{flexShrink:0}}/>
//               <span style={{width:8,height:8,borderRadius:'50%',background:clr,flexShrink:0}}/>
//               <span style={{fontSize:12,fontWeight:700,color:clr,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{col}</span>
//               <span style={{fontSize:11,color:clr,fontWeight:700,background:`${clr}22`,padding:'1px 6px',borderRadius:8}}>{colDealers.length}</span>
//               <span style={{fontSize:10,color:'var(--t3)'}}>·{colTotal}</span>
//             </div>
//             {/* Cards */}
//             <div style={{padding:8,display:'flex',flexDirection:'column',gap:6,maxHeight:500,overflowY:'auto'}}>
//               {colDealers.map(d=>{
//                 const ach=d.months[selectedMonthIdx]||0;
//                 const tgt=d.monthTargets?.[selectedMonthIdx]??d.target;
//                 const p=pct(tgt,ach);
//                 const sm=users[d.salesman];
//                 return(
//                   <div key={d.id}
//                     draggable onDragStart={e=>onCardDragStart(e,d.id,col)}
//                     onClick={()=>onEdit(d.id)}
//                     style={{background:'var(--bg2)',borderRadius:8,padding:'9px 11px',cursor:'pointer',
//                       border:`1px solid ${overCard===d.id?clr:'var(--b2)'}`,
//                       boxShadow:dragCard?.dealerId===d.id?'0 4px 12px rgba(0,0,0,.4)':'none',
//                       opacity:dragCard?.dealerId===d.id?0.6:1,
//                       transition:'border .1s,opacity .1s'}}
//                     onMouseEnter={e=>{e.currentTarget.style.borderColor=clr;}}
//                     onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b2)';}}>
//                     <div style={{fontSize:12,fontWeight:600,color:'var(--t1)',marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
//                     <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:11}}>
//                       <span style={{color:'var(--t3)'}}>{MO[selectedMonthIdx].slice(0,3)}: <strong style={{color:ach>0?'var(--t1)':'var(--t3)'}}>{ach||'—'}</strong></span>
//                       <span style={{color:pclr(p),fontWeight:700}}>{spct(tgt,ach)}</span>
//                     </div>
//                     {tgt>0&&<div style={{height:3,background:'var(--b1)',borderRadius:2,marginBottom:6,overflow:'hidden'}}>
//                       <div style={{height:'100%',width:`${Math.min(p||0,100)}%`,background:pclr(p),borderRadius:2}}/>
//                     </div>}
//                     <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
//                       <MiniBars months={d.months} highlightIdx={selectedMonthIdx}/>
//                       {isAdmin&&sm&&<Avatar user={sm} size={18}/>}
//                     </div>
//                     {d.category&&<div style={{fontSize:10,color:'#818cf8',marginTop:4}}>{d.category}{d.categoryType?` · ${d.categoryType}`:''}</div>}
//                   </div>
//                 );
//               })}
//               {colDealers.length===0&&(
//                 <div style={{textAlign:'center',padding:'20px 8px',color:'var(--t3)',fontSize:12,border:'1px dashed var(--b2)',borderRadius:8}}>Drop here</div>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ── Main DealersList ──────────────────────────────────────
// const DealersList=({dealers,currentUser,users,onEdit,onDelete,onAdd,selected,setSelected,onBulkAction,notes,pendingFilters,clearPending,onUpdateDealer})=>{
//   const {selectedMonthIdx, MO:ctxMO}=useMonth();
//   const MO = ctxMO || MO_CONST;
//   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
//   const isAdmin=currentUser.role==='admin';
//   const [viewMode,setViewMode]=useState('table'); // 'table' | 'kanban'
//   const [filters,setFilters]=useState({q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]});
//   const [sort,setSort]=useState({col:'name',dir:1});

//   useEffect(()=>{
//     if(pendingFilters){
//       const f={q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]};
//       Object.keys(pendingFilters).forEach(k=>{
//         if(k==='_ts')return;
//         if(['status','category','categoryType','sm','city','state','zone'].includes(k))f[k]=[pendingFilters[k]];
//         else f[k]=pendingFilters[k];
//       });
//       setFilters(f);
//       clearPending&&clearPending();
//     }
//   },[pendingFilters,clearPending]);

//   const dealersForMonth=useMemo(()=>dealers.map(d=>({...d,
//     achieved:d.months[selectedMonthIdx]||0,
//     target:d.monthTargets?.[selectedMonthIdx] ?? (d.months[selectedMonthIdx]>0 ? d.target : 0)
//   })),[dealers,selectedMonthIdx]);

//   const allStatuses    =useMemo(()=>[...new Set(dealers.map(x=>(x.status||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allZones       =useMemo(()=>[...new Set(dealers.map(x=>x.zone).filter(Boolean))].sort(),[dealers]);
//   const allCities      =useMemo(()=>[...new Set(dealers.map(x=>(x.city||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allStates      =useMemo(()=>[...new Set(dealers.map(x=>(x.state||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allCategories  =useMemo(()=>[...new Set(dealers.map(x=>(x.category||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allCategoryTypes=useMemo(()=>[...new Set(dealers.map(x=>(x.categoryType||'').trim()).filter(Boolean))].sort(),[dealers]);

//   const filtered=useMemo(()=>{
//     let d=dealersForMonth;
//     if(filters.q)d=d.filter(x=>x.name.toLowerCase().includes(filters.q.toLowerCase())||(x.city||'').toLowerCase().includes(filters.q.toLowerCase())||(x.state||'').toLowerCase().includes(filters.q.toLowerCase()));
//     if(filters.zone.length>0)d=d.filter(x=>filters.zone.includes(x.zone||''));
//     if(filters.status.length>0)d=d.filter(x=>filters.status.map(s=>s.toUpperCase()).includes((x.status||'').toUpperCase()));
//     if(isAdmin&&filters.sm.length>0)d=d.filter(x=>filters.sm.includes(x.salesman));
//     if(filters.credit==='yes')d=d.filter(x=>x.creditLimit>0);
//     if(filters.credit==='no')d=d.filter(x=>!x.creditLimit);
//     if(filters.city.length>0)d=d.filter(x=>filters.city.includes((x.city||'').trim()));
//     if(filters.state.length>0)d=d.filter(x=>filters.state.includes((x.state||'').trim()));
//     if(filters.category.length>0)d=d.filter(x=>filters.category.includes(x.category||''));
//     if(filters.categoryType.length>0)d=d.filter(x=>filters.categoryType.includes(x.categoryType||''));
//     if(filters.minPct)d=d.filter(x=>(pct(x.target,x.achieved)||0)>=num(filters.minPct));
//     if(filters.maxPct)d=d.filter(x=>(pct(x.target,x.achieved)||0)<=num(filters.maxPct));
//     return[...d].sort((a,b)=>{
//       let av=(a[sort.col]??''),bv=(b[sort.col]??'');
//       if(typeof av==='string'){av=av.toLowerCase();bv=bv.toLowerCase();}
//       return av<bv?-sort.dir:av>bv?sort.dir:0;
//     });
//   },[dealersForMonth,filters,sort,isAdmin]);

//   const tt=filtered.reduce((s,x)=>s+x.target,0);
//   const ta=filtered.reduce((s,x)=>s+x.achieved,0);
//   const noteCount    =id=>notes.filter(n=>n.dealerId===id).length;
//   const overdueCount =id=>notes.filter(n=>n.dealerId===id&&n.type==='followup'&&!n.completed&&new Date(n.dueDate)<new Date()).length;
//   const toggleSel    =id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
//   const toggleAll    =()=>{if(selected.length===filtered.length)setSelected([]);else setSelected(filtered.map(x=>x.id));};
//   const hasF=filters.q||filters.zone.length>0||filters.status.length>0||filters.sm.length>0||filters.credit||filters.city.length>0||filters.state.length>0||filters.category.length>0||filters.categoryType.length>0||filters.minPct||filters.maxPct;
//   const clearFilters =()=>setFilters({q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]});

//   const onUpdateStatus=(dealerId,newStatus)=>{
//     onUpdateDealer&&onUpdateDealer(dealerId,{status:newStatus});
//   };

//   const exportCsv=()=>{
//     const h=['Dealer','Salesman','Zone','City','State','Category','Cat Type','Status','Target','Achieved','Ach%',...MO,'Cr Days','Cr Limit'];
//     const rows=filtered.map(x=>[x.name,users[x.salesman]?.name||x.salesman,x.zone,x.city||'',x.state||'',x.category||'',x.categoryType||'',x.status,x.target,x.achieved,spct(x.target,x.achieved),...x.months,x.creditDays,x.creditLimit]);
//     const csv=[h,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
//     const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='dealers_'+Date.now()+'.csv';a.click();
//   };

//   const sh=(col,lbl)=>(
//     <th className="sort" onClick={()=>setSort(s=>s.col===col?{col,dir:-s.dir}:{col,dir:1})}>
//       {lbl}{sort.col===col?(sort.dir>0?' ↑':' ↓'):''}
//     </th>
//   );

//   return(
//     <div className="fade">
//       {/* Header */}
//       <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:10}}>
//         <div>
//           <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:2}}>Dealer Records · {MO[selectedMonthIdx]}</div>
//           <div style={{fontSize:20,fontWeight:700}}>{filtered.length} dealers <span style={{fontSize:13,color:'var(--t3)',fontWeight:400}}>· Tgt {tt} · Ach {ta} · {spct(tt,ta)}</span></div>
//         </div>
//         <div className="spacer"/>
//         {selected.length>0&&(
//           <div style={{display:'flex',gap:6,alignItems:'center',background:'var(--accL)',padding:'6px 10px',borderRadius:6}}>
//             <span style={{fontSize:12,color:'var(--acc)',fontWeight:600}}>{selected.length} selected</span>
//             <button className="btn" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>onBulkAction('status')}>Change Status</button>
//             {isAdmin&&<button className="btn" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>onBulkAction('salesman')}>Reassign</button>}
//             <button className="btnd" style={{fontSize:11}} onClick={()=>onBulkAction('delete')}>Delete</button>
//             <button className="btn" style={{fontSize:11,padding:'4px 8px'}} onClick={()=>setSelected([])}><X size={12}/></button>
//           </div>
//         )}
//         {/* View toggle */}
//         <div style={{display:'flex',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:7,overflow:'hidden'}}>
//           <button onClick={()=>setViewMode('table')} style={{background:viewMode==='table'?'var(--acc)':'transparent',color:viewMode==='table'?'#fff':'var(--t3)',border:'none',padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,transition:'all .15s'}}><List size={13}/> Table</button>
//           <button onClick={()=>setViewMode('kanban')} style={{background:viewMode==='kanban'?'var(--acc)':'transparent',color:viewMode==='kanban'?'#fff':'var(--t3)',border:'none',padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,borderLeft:'1px solid var(--b2)',transition:'all .15s'}}><Columns size={13}/> Kanban</button>
//         </div>
//         <button onClick={exportCsv} className="btn" style={{fontSize:12,display:'flex',alignItems:'center',gap:5}}><Download size={13}/> Export</button>
//         <button onClick={onAdd} className="btnp" style={{display:'flex',alignItems:'center',gap:5}}><Plus size={14}/> Add Dealer</button>
//       </div>

//       {/* Filters */}
//       <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
//         <div style={{position:'relative'}}>
//           <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//           <input className="inp" style={{width:200,paddingLeft:32}} placeholder="Search name/city/state..." value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
//         </div>
//         <MultiSelect options={allStatuses} selected={filters.status} onChange={v=>setFilters({...filters,status:v})} placeholder="Status (All)"
//           renderOption={s=><StatusBadge status={s}/>}/>
//         <MultiSelect options={allZones} selected={filters.zone} onChange={v=>setFilters({...filters,zone:v})} placeholder="Zone (All)"/>
//         {allCategories.length>0&&<MultiSelect options={allCategories} selected={filters.category} onChange={v=>setFilters({...filters,category:v})} placeholder="Category (All)"
//           renderOption={c=><span style={{fontSize:12,color:'#818cf8'}}>{c}</span>}/>}
//         {allCategoryTypes.length>0&&<MultiSelect options={allCategoryTypes} selected={filters.categoryType} onChange={v=>setFilters({...filters,categoryType:v})} placeholder="Cat Type (All)"/>}
//         {allCities.length>0&&<MultiSelect options={allCities} selected={filters.city} onChange={v=>setFilters({...filters,city:v})} placeholder="City (All)"/>}
//         {allStates.length>0&&<MultiSelect options={allStates} selected={filters.state} onChange={v=>setFilters({...filters,state:v})} placeholder="State (All)"/>}
//         {isAdmin&&<MultiSelect options={Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id)} selected={filters.sm}
//           onChange={v=>setFilters({...filters,sm:v})} placeholder="Salesman (All)"
//           renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={18}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
//         <input className="inp" style={{width:80}} type="number" placeholder="Min %" value={filters.minPct} onChange={e=>setFilters({...filters,minPct:e.target.value})}/>
//         <input className="inp" style={{width:80}} type="number" placeholder="Max %" value={filters.maxPct} onChange={e=>setFilters({...filters,maxPct:e.target.value})}/>
//         {hasF&&<button onClick={clearFilters} className="btn" style={{color:'var(--red)',fontSize:12}}><X size={12} style={{display:'inline',verticalAlign:'middle'}}/> Clear</button>}
//       </div>

//       {/* Kanban view */}
//       {viewMode==='kanban'&&(
//         <div className="card" style={{padding:14,marginBottom:0}}>
//           <div style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>
//             Drag columns to reorder · Drag cards to change status
//           </div>
//           <KanbanBoard
//             dealers={filtered}
//             selectedMonthIdx={selectedMonthIdx}
//             users={users}
//             onEdit={onEdit}
//             onUpdateStatus={onUpdateStatus}
//             isAdmin={isAdmin}
//           />
//         </div>
//       )}

//       {/* Table view */}
//       {viewMode==='table'&&(
//         <div className="card" style={{padding:0,overflow:'hidden'}}>
//           <div className="scroll" style={{maxHeight:'60vh',overflowY:'auto'}}>
//             <table>
//               <thead>
//                 <tr>
//                   <th style={{width:30}}><button onClick={toggleAll} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',display:'flex'}}>{selected.length===filtered.length&&filtered.length>0?<CheckSquare size={14}/>:<Square size={14}/>}</button></th>
//                   {sh('name','Dealer Name')}
//                   {isAdmin&&<th>Salesman</th>}
//                   {sh('zone','Zone')}
//                   {sh('city','City')}{sh('state','State')}
//                   {sh('category','Category')}{sh('categoryType','Cat Type')}
//                   {sh('status','Status')}
//                   {sh('target','Tgt')}{sh('achieved','Ach')}<th>%</th><th>Trend</th>
//                   {sh('avg6m','6m Avg')}
//                   {[...MO].map((_,di)=>{const i=MO.length-1-di;return<th key={i} style={{background:i===selectedMonthIdx?'rgba(99,102,241,.08)':'var(--bg1)'}}>{MO[i]}</th>;})}
//                   {sh('creditDays','CrD')}{sh('creditLimit','Cr Limit')}
//                   <th>Notes</th><th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map(x=>{
//                   const p=pct(x.target,x.achieved);const tp=trendPct(x.months);const nc=noteCount(x.id);const oc=overdueCount(x.id);
//                   return(
//                     <tr key={x.id} onClick={()=>onEdit(x.id)} style={{cursor:'pointer',background:selected.includes(x.id)?'var(--accL)':'transparent'}}>
//                       <td onClick={e=>{e.stopPropagation();toggleSel(x.id);}}>{selected.includes(x.id)?<CheckSquare size={14} color="var(--acc)"/>:<Square size={14} color="var(--t3)"/>}</td>
//                       <td style={{fontWeight:600,color:'var(--t1)',maxWidth:190,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
//                       {isAdmin&&<td><div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={users[x.salesman]} size={20}/><span style={{fontSize:12}}>{users[x.salesman]?.name||x.salesman}</span></div></td>}
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t2)'}}>{x.city||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t2)'}}>{x.state||'—'}</td>
//                       <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
//                       <td><StatusBadge status={x.status}/></td>
//                       <td style={{textAlign:'right'}}>{x.target||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:600,color:x.achieved>0?'var(--t1)':'var(--t3)'}}>{x.achieved||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
//                       <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
//                       <td style={{textAlign:'right',color:'var(--t3)'}}>{x.avg6m||'—'}</td>
//                       {[...x.months].map((_,di)=>{const i=x.months.length-1-di;const v=x.months[i];return(<td key={i} style={{textAlign:'right',fontSize:12,color:i===selectedMonthIdx?'var(--acc)':v>0?'var(--t2)':'var(--t3)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{v||'—'}</td>);})}
//                       <td style={{textAlign:'right',color:'var(--t3)'}}>{x.creditDays?x.creditDays+'d':'—'}</td>
//                       <td style={{textAlign:'right',color:'var(--t3)'}}>{fcash(x.creditLimit)}</td>
//                       <td onClick={e=>e.stopPropagation()}>{nc>0?<span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:11,color:oc>0?'#fbbf24':'var(--t2)'}}><MessageSquare size={11}/> {nc}{oc>0&&<span style={{color:'#f87171',fontWeight:700}}>!</span>}</span>:<span style={{color:'var(--t3)'}}>—</span>}</td>
//                       <td onClick={e=>e.stopPropagation()}>
//                         <div style={{display:'flex',gap:5}}>
//                           <button className="btne" onClick={e=>{e.stopPropagation();onEdit(x.id);}}>Open</button>
//                           {isAdmin&&<button className="btnd" onClick={e=>{e.stopPropagation();onDelete(x.id);}}><Trash2 size={11}/></button>}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//                 {filtered.length===0&&<tr><td colSpan="30" style={{textAlign:'center',color:'var(--t3)',padding:40}}>No dealers match your filters</td></tr>}
//               </tbody>
//               <tfoot>
//                 <tr>
//                   <td colSpan={isAdmin?8:7} style={{color:'var(--t1)'}}>TOTAL</td>
//                   <td style={{textAlign:'right'}}>{tt}</td>
//                   <td style={{textAlign:'right',color:'#34d399'}}>{ta}</td>
//                   <td style={{textAlign:'right',color:pclr(pct(tt,ta))}}>{spct(tt,ta)}</td>
//                   <td colSpan="2"/>
//                   {[...MO].map((_,di)=>{const i=MO.length-1-di;const s=filtered.reduce((a,x)=>a+(x.months[i]||0),0);return<td key={i} style={{textAlign:'right',color:i===selectedMonthIdx?'var(--acc)':'var(--t1)',background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{s||''}</td>;})}
//                   <td colSpan="4"/>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DealersList;


// import React, { useState, useMemo, useEffect, useRef } from 'react';
// import { Search, Plus, Download, Trash2, X, CheckSquare, Square, ArrowUpRight, ArrowDownRight, MessageSquare, Columns, List, GripVertical } from 'lucide-react';
// import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
// import { pct, spct, pclr, fcash, num, trendPct } from '../utils';
// import { useMonth } from '../context';
// import { StatusBadge, Avatar, MiniBars, MultiSelect } from './UI';

// // ── Drag-and-drop Kanban board ────────────────────────────
// const STATUS_COLORS = {
//   'ACTIVE':'#34d399','ACHIVERS':'#34d399','ACHIEVERS':'#34d399',
//   'KEY ACCOUNT':'#a78bfa','INACTIVE':'#fbbf24','RECENTLY INACTIVE':'#fb923c',
//   'DEAD':'#f87171','NEW':'#22d3ee','PROSPECT':'#818cf8'
// };
// const getStatusColor = s => STATUS_COLORS[(s||'').toUpperCase()] || '#55546a';

// function KanbanBoard({ dealers, selectedMonthIdx, users, onEdit, onUpdateStatus, isAdmin }) {
//   // ordered columns — persisted in localStorage for drag reorder
//   const defaultCols = [...new Set(dealers.map(d=>(d.status||'OTHER').trim()))].filter(Boolean);
//   const [cols, setCols] = useState(() => {
//     try {
//       const saved = JSON.parse(localStorage.getItem('stp_kanban_cols')||'null');
//       if(saved) {
//         // merge: add new statuses from data, keep saved order
//         const merged = [...saved.filter(c=>defaultCols.includes(c)), ...defaultCols.filter(c=>!saved.includes(c))];
//         return merged;
//       }
//     } catch {}
//     return defaultCols;
//   });
//   const [dragCol, setDragCol] = useState(null);       // col being reordered
//   const [dragCard, setDragCard] = useState(null);     // {dealerId, fromStatus}
//   const [overCol, setOverCol] = useState(null);
//   const [overCard, setOverCard] = useState(null);

//   // keep cols in sync when new statuses appear
//   useEffect(()=>{
//     const current = [...new Set(dealers.map(d=>(d.status||'OTHER').trim()))].filter(Boolean);
//     setCols(prev => {
//       const merged = [...prev.filter(c=>current.includes(c)), ...current.filter(c=>!prev.includes(c))];
//       localStorage.setItem('stp_kanban_cols', JSON.stringify(merged));
//       return merged;
//     });
//   },[dealers]);

//   // ── Column drag ────────────────────────────────────────
//   const onColDragStart = (e, col) => { setDragCol(col); e.dataTransfer.effectAllowed='move'; };
//   const onColDragOver  = (e, col) => { e.preventDefault(); setOverCol(col); };
//   const onColDrop      = (e, targetCol) => {
//     e.preventDefault();
//     if(!dragCol||dragCol===targetCol)return;
//     setCols(prev=>{
//       const next=[...prev];
//       const fi=next.indexOf(dragCol), ti=next.indexOf(targetCol);
//       if(fi<0||ti<0)return prev;
//       next.splice(fi,1); next.splice(ti,0,dragCol);
//       localStorage.setItem('stp_kanban_cols', JSON.stringify(next));
//       return next;
//     });
//     setDragCol(null); setOverCol(null);
//   };

//   // ── Card drag (move dealer to different status) ────────
//   const onCardDragStart = (e, dealerId, status) => {
//     setDragCard({dealerId, fromStatus:status});
//     e.dataTransfer.effectAllowed='move';
//     e.stopPropagation();
//   };
//   const onCardDrop = (e, targetStatus) => {
//     e.preventDefault();
//     if(!dragCard||dragCard.fromStatus===targetStatus)return;
//     onUpdateStatus(dragCard.dealerId, targetStatus);
//     setDragCard(null); setOverCol(null);
//   };

//   const dealersByStatus = useMemo(()=>{
//     const map={};
//     dealers.forEach(d=>{
//       const s=(d.status||'OTHER').trim();
//       if(!map[s])map[s]=[];
//       map[s].push(d);
//     });
//     return map;
//   },[dealers]);

//   return(
//     <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:12,alignItems:'flex-start',minHeight:400}}>
//       {cols.map(col=>{
//         const colDealers=(dealersByStatus[col]||[]).sort((a,b)=>(b.months[selectedMonthIdx]||0)-(a.months[selectedMonthIdx]||0));
//         const colTotal=colDealers.reduce((s,d)=>s+(d.months[selectedMonthIdx]||0),0);
//         const clr=getStatusColor(col);
//         const isOver=overCol===col&&dragCard&&dragCard.fromStatus!==col;
//         return(
//           <div key={col}
//             draggable onDragStart={e=>onColDragStart(e,col)} onDragOver={e=>onColDragOver(e,col)}
//             onDrop={e=>{ dragCol?onColDrop(e,col):onCardDrop(e,col); }} onDragEnd={()=>{setDragCol(null);setDragCard(null);setOverCol(null);}}
//             style={{
//               minWidth:220, maxWidth:240, flexShrink:0,
//               background: isOver?`${clr}18`:'var(--bg1)',
//               border:`1.5px solid ${isOver?clr:dragCol===col?clr+'66':'var(--b1)'}`,
//               borderRadius:10, overflow:'hidden',
//               transition:'border .15s,background .15s',
//               opacity: dragCol===col?0.5:1,
//             }}>
//             {/* Column header */}
//             <div style={{padding:'10px 12px',background:`${clr}18`,borderBottom:`1px solid ${clr}33`,
//               display:'flex',alignItems:'center',gap:6,cursor:'grab',userSelect:'none'}}>
//               <GripVertical size={12} color={clr} style={{flexShrink:0}}/>
//               <span style={{width:8,height:8,borderRadius:'50%',background:clr,flexShrink:0}}/>
//               <span style={{fontSize:12,fontWeight:700,color:clr,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{col}</span>
//               <span style={{fontSize:11,color:clr,fontWeight:700,background:`${clr}22`,padding:'1px 6px',borderRadius:8}}>{colDealers.length}</span>
//               <span style={{fontSize:10,color:'var(--t3)'}}>·{colTotal}</span>
//             </div>
//             {/* Cards */}
//             <div style={{padding:8,display:'flex',flexDirection:'column',gap:6,maxHeight:500,overflowY:'auto'}}>
//               {colDealers.map(d=>{
//                 const ach=d.months[selectedMonthIdx]||0;
//                 const tgt=d.monthTargets?.[selectedMonthIdx]??d.target;
//                 const p=pct(tgt,ach);
//                 const sm=users[d.salesman];
//                 return(
//                   <div key={d.id}
//                     draggable onDragStart={e=>onCardDragStart(e,d.id,col)}
//                     onClick={()=>onEdit(d.id)}
//                     style={{background:'var(--bg2)',borderRadius:8,padding:'9px 11px',cursor:'pointer',
//                       border:`1px solid ${overCard===d.id?clr:'var(--b2)'}`,
//                       boxShadow:dragCard?.dealerId===d.id?'0 4px 12px rgba(0,0,0,.4)':'none',
//                       opacity:dragCard?.dealerId===d.id?0.6:1,
//                       transition:'border .1s,opacity .1s'}}
//                     onMouseEnter={e=>{e.currentTarget.style.borderColor=clr;}}
//                     onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b2)';}}>
//                     <div style={{fontSize:12,fontWeight:600,color:'var(--t1)',marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
//                     <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:11}}>
//                       <span style={{color:'var(--t3)'}}>{MO[selectedMonthIdx].slice(0,3)}: <strong style={{color:ach>0?'var(--t1)':'var(--t3)'}}>{ach||'—'}</strong></span>
//                       <span style={{color:pclr(p),fontWeight:700}}>{spct(tgt,ach)}</span>
//                     </div>
//                     {tgt>0&&<div style={{height:3,background:'var(--b1)',borderRadius:2,marginBottom:6,overflow:'hidden'}}>
//                       <div style={{height:'100%',width:`${Math.min(p||0,100)}%`,background:pclr(p),borderRadius:2}}/>
//                     </div>}
//                     <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
//                       <MiniBars months={d.months} highlightIdx={selectedMonthIdx}/>
//                       {isAdmin&&sm&&<Avatar user={sm} size={18}/>}
//                     </div>
//                     {d.category&&<div style={{fontSize:10,color:'#818cf8',marginTop:4}}>{d.category}{d.categoryType?` · ${d.categoryType}`:''}</div>}
//                   </div>
//                 );
//               })}
//               {colDealers.length===0&&(
//                 <div style={{textAlign:'center',padding:'20px 8px',color:'var(--t3)',fontSize:12,border:'1px dashed var(--b2)',borderRadius:8}}>Drop here</div>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ── Main DealersList ──────────────────────────────────────
// const DealersList=({dealers,currentUser,users,onEdit,onDelete,onAdd,selected,setSelected,onBulkAction,notes,pendingFilters,clearPending,onUpdateDealer})=>{
//   const {selectedMonthIdx, MO:ctxMO}=useMonth();
//   const MO = ctxMO || MO_CONST;
//   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
//   const isAdmin=currentUser.role==='admin';
//   const [viewMode,setViewMode]=useState('table'); // 'table' | 'kanban'
//   const [filters,setFilters]=useState({q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]});
//   const [sort,setSort]=useState({col:'name',dir:1});

//   useEffect(()=>{
//     if(pendingFilters){
//       const f={q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]};
//       Object.keys(pendingFilters).forEach(k=>{
//         if(k==='_ts')return;
//         if(['status','category','categoryType','sm','city','state','zone'].includes(k))f[k]=[pendingFilters[k]];
//         else f[k]=pendingFilters[k];
//       });
//       setFilters(f);
//       clearPending&&clearPending();
//     }
//   },[pendingFilters,clearPending]);

//   const dealersForMonth=useMemo(()=>dealers.map(d=>({
//     ...d,
//     achieved: d.months[selectedMonthIdx]||0,
//     target:   d.monthTargets?.[selectedMonthIdx]||0,
//     // Use per-month status/zone if available, else fall back to current
//     status: d.monthStatus?.[selectedMonthIdx] || d.status || 'ACTIVE',
//     zone:   d.monthZone?.[selectedMonthIdx]   || d.zone   || '',
//   })),[dealers,selectedMonthIdx]);

//   const allStatuses    =useMemo(()=>[...new Set(dealers.map(x=>(x.status||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allZones       =useMemo(()=>[...new Set(dealers.map(x=>x.zone).filter(Boolean))].sort(),[dealers]);
//   const allCities      =useMemo(()=>[...new Set(dealers.map(x=>(x.city||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allStates      =useMemo(()=>[...new Set(dealers.map(x=>(x.state||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allCategories  =useMemo(()=>[...new Set(dealers.map(x=>(x.category||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allCategoryTypes=useMemo(()=>[...new Set(dealers.map(x=>(x.categoryType||'').trim()).filter(Boolean))].sort(),[dealers]);

//   const filtered=useMemo(()=>{
//     let d=dealersForMonth;
//     if(filters.q)d=d.filter(x=>x.name.toLowerCase().includes(filters.q.toLowerCase())||(x.city||'').toLowerCase().includes(filters.q.toLowerCase())||(x.state||'').toLowerCase().includes(filters.q.toLowerCase()));
//     if(filters.zone.length>0)d=d.filter(x=>filters.zone.includes(x.zone||''));
//     if(filters.status.length>0)d=d.filter(x=>filters.status.map(s=>s.toUpperCase()).includes((x.status||'').toUpperCase()));
//     if(isAdmin&&filters.sm.length>0)d=d.filter(x=>filters.sm.includes(x.salesman));
//     if(filters.credit==='yes')d=d.filter(x=>x.creditLimit>0);
//     if(filters.credit==='no')d=d.filter(x=>!x.creditLimit);
//     if(filters.city.length>0)d=d.filter(x=>filters.city.includes((x.city||'').trim()));
//     if(filters.state.length>0)d=d.filter(x=>filters.state.includes((x.state||'').trim()));
//     if(filters.category.length>0)d=d.filter(x=>filters.category.includes(x.category||''));
//     if(filters.categoryType.length>0)d=d.filter(x=>filters.categoryType.includes(x.categoryType||''));
//     if(filters.minPct)d=d.filter(x=>(pct(x.target,x.achieved)||0)>=num(filters.minPct));
//     if(filters.maxPct)d=d.filter(x=>(pct(x.target,x.achieved)||0)<=num(filters.maxPct));
//     return[...d].sort((a,b)=>{
//       let av=(a[sort.col]??''),bv=(b[sort.col]??'');
//       if(typeof av==='string'){av=av.toLowerCase();bv=bv.toLowerCase();}
//       return av<bv?-sort.dir:av>bv?sort.dir:0;
//     });
//   },[dealersForMonth,filters,sort,isAdmin]);

//   const tt=filtered.reduce((s,x)=>s+x.target,0);
//   const ta=filtered.reduce((s,x)=>s+x.achieved,0);
//   const noteCount    =id=>notes.filter(n=>n.dealerId===id).length;
//   const overdueCount =id=>notes.filter(n=>n.dealerId===id&&n.type==='followup'&&!n.completed&&new Date(n.dueDate)<new Date()).length;
//   const toggleSel    =id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
//   const toggleAll    =()=>{if(selected.length===filtered.length)setSelected([]);else setSelected(filtered.map(x=>x.id));};
//   const hasF=filters.q||filters.zone.length>0||filters.status.length>0||filters.sm.length>0||filters.credit||filters.city.length>0||filters.state.length>0||filters.category.length>0||filters.categoryType.length>0||filters.minPct||filters.maxPct;
//   const clearFilters =()=>setFilters({q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]});

//   const onUpdateStatus=(dealerId,newStatus)=>{
//     onUpdateDealer&&onUpdateDealer(dealerId,{status:newStatus});
//   };

//   const exportCsv=()=>{
//     const h=['Dealer','Salesman','Zone','City','State','Category','Cat Type','Status','Target','Achieved','Ach%',...MO,'Cr Days','Cr Limit'];
//     const rows=filtered.map(x=>[x.name,users[x.salesman]?.name||x.salesman,x.zone,x.city||'',x.state||'',x.category||'',x.categoryType||'',x.status,x.target,x.achieved,spct(x.target,x.achieved),...x.months,x.creditDays,x.creditLimit]);
//     const csv=[h,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
//     const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='dealers_'+Date.now()+'.csv';a.click();
//   };

//   const sh=(col,lbl)=>(
//     <th className="sort" onClick={()=>setSort(s=>s.col===col?{col,dir:-s.dir}:{col,dir:1})}>
//       {lbl}{sort.col===col?(sort.dir>0?' ↑':' ↓'):''}
//     </th>
//   );

//   return(
//     <div className="fade">
//       {/* Header */}
//       <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:10}}>
//         <div>
//           <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:2}}>Dealer Records · {MO[selectedMonthIdx]}</div>
//           <div style={{fontSize:20,fontWeight:700}}>{filtered.length} dealers <span style={{fontSize:13,color:'var(--t3)',fontWeight:400}}>· Tgt {tt} · Ach {ta} · {spct(tt,ta)}</span></div>
//         </div>
//         <div className="spacer"/>
//         {selected.length>0&&(
//           <div style={{display:'flex',gap:6,alignItems:'center',background:'var(--accL)',padding:'6px 10px',borderRadius:6}}>
//             <span style={{fontSize:12,color:'var(--acc)',fontWeight:600}}>{selected.length} selected</span>
//             <button className="btn" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>onBulkAction('status')}>Change Status</button>
//             {isAdmin&&<button className="btn" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>onBulkAction('salesman')}>Reassign</button>}
//             <button className="btnd" style={{fontSize:11}} onClick={()=>onBulkAction('delete')}>Delete</button>
//             <button className="btn" style={{fontSize:11,padding:'4px 8px'}} onClick={()=>setSelected([])}><X size={12}/></button>
//           </div>
//         )}
//         {/* View toggle */}
//         <div style={{display:'flex',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:7,overflow:'hidden'}}>
//           <button onClick={()=>setViewMode('table')} style={{background:viewMode==='table'?'var(--acc)':'transparent',color:viewMode==='table'?'#fff':'var(--t3)',border:'none',padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,transition:'all .15s'}}><List size={13}/> Table</button>
//           <button onClick={()=>setViewMode('kanban')} style={{background:viewMode==='kanban'?'var(--acc)':'transparent',color:viewMode==='kanban'?'#fff':'var(--t3)',border:'none',padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,borderLeft:'1px solid var(--b2)',transition:'all .15s'}}><Columns size={13}/> Kanban</button>
//         </div>
//         <button onClick={exportCsv} className="btn" style={{fontSize:12,display:'flex',alignItems:'center',gap:5}}><Download size={13}/> Export</button>
//         <button onClick={onAdd} className="btnp" style={{display:'flex',alignItems:'center',gap:5}}><Plus size={14}/> Add Dealer</button>
//       </div>

//       {/* Filters */}
//       <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
//         <div style={{position:'relative'}}>
//           <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//           <input className="inp" style={{width:200,paddingLeft:32}} placeholder="Search name/city/state..." value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
//         </div>
//         <MultiSelect options={allStatuses} selected={filters.status} onChange={v=>setFilters({...filters,status:v})} placeholder="Status (All)"
//           renderOption={s=><StatusBadge status={s}/>}/>
//         <MultiSelect options={allZones} selected={filters.zone} onChange={v=>setFilters({...filters,zone:v})} placeholder="Zone (All)"/>
//         {allCategories.length>0&&<MultiSelect options={allCategories} selected={filters.category} onChange={v=>setFilters({...filters,category:v})} placeholder="Category (All)"
//           renderOption={c=><span style={{fontSize:12,color:'#818cf8'}}>{c}</span>}/>}
//         {allCategoryTypes.length>0&&<MultiSelect options={allCategoryTypes} selected={filters.categoryType} onChange={v=>setFilters({...filters,categoryType:v})} placeholder="Cat Type (All)"/>}
//         {allCities.length>0&&<MultiSelect options={allCities} selected={filters.city} onChange={v=>setFilters({...filters,city:v})} placeholder="City (All)"/>}
//         {allStates.length>0&&<MultiSelect options={allStates} selected={filters.state} onChange={v=>setFilters({...filters,state:v})} placeholder="State (All)"/>}
//         {isAdmin&&<MultiSelect options={Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id)} selected={filters.sm}
//           onChange={v=>setFilters({...filters,sm:v})} placeholder="Salesman (All)"
//           renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={18}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
//         <input className="inp" style={{width:80}} type="number" placeholder="Min %" value={filters.minPct} onChange={e=>setFilters({...filters,minPct:e.target.value})}/>
//         <input className="inp" style={{width:80}} type="number" placeholder="Max %" value={filters.maxPct} onChange={e=>setFilters({...filters,maxPct:e.target.value})}/>
//         {hasF&&<button onClick={clearFilters} className="btn" style={{color:'var(--red)',fontSize:12}}><X size={12} style={{display:'inline',verticalAlign:'middle'}}/> Clear</button>}
//       </div>

//       {/* Kanban view */}
//       {viewMode==='kanban'&&(
//         <div className="card" style={{padding:14,marginBottom:0}}>
//           <div style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>
//             Drag columns to reorder · Drag cards to change status
//           </div>
//           <KanbanBoard
//             dealers={filtered}
//             selectedMonthIdx={selectedMonthIdx}
//             users={users}
//             onEdit={onEdit}
//             onUpdateStatus={onUpdateStatus}
//             isAdmin={isAdmin}
//           />
//         </div>
//       )}

//       {/* Table view */}
//       {viewMode==='table'&&(
//         <div className="card" style={{padding:0,overflow:'hidden'}}>
//           <div className="scroll" style={{maxHeight:'60vh',overflowY:'auto'}}>
//             <table>
//               <thead>
//                 <tr>
//                   <th style={{width:30}}><button onClick={toggleAll} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',display:'flex'}}>{selected.length===filtered.length&&filtered.length>0?<CheckSquare size={14}/>:<Square size={14}/>}</button></th>
//                   {sh('name','Dealer Name')}
//                   {isAdmin&&<th>Salesman</th>}
//                   {sh('zone','Zone')}
//                   {sh('city','City')}{sh('state','State')}
//                   {sh('category','Category')}{sh('categoryType','Cat Type')}
//                   {sh('status','Status')}
//                   {sh('target','Tgt')}{sh('achieved','Ach')}<th>%</th><th>Trend</th>
//                   {sh('avg6m','6m Avg')}
//                   {[...MO].map((_,di)=>{const i=MO.length-1-di;return<th key={i} style={{background:i===selectedMonthIdx?'rgba(99,102,241,.08)':'var(--bg1)'}}>{MO[i]}</th>;})}
//                   {sh('creditDays','CrD')}{sh('creditLimit','Cr Limit')}
//                   <th>Notes</th><th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map(x=>{
//                   const p=pct(x.target,x.achieved);const tp=trendPct(x.months);const nc=noteCount(x.id);const oc=overdueCount(x.id);
//                   return(
//                     <tr key={x.id} onClick={()=>onEdit(x.id)} style={{cursor:'pointer',background:selected.includes(x.id)?'var(--accL)':'transparent'}}>
//                       <td onClick={e=>{e.stopPropagation();toggleSel(x.id);}}>{selected.includes(x.id)?<CheckSquare size={14} color="var(--acc)"/>:<Square size={14} color="var(--t3)"/>}</td>
//                       <td style={{fontWeight:600,color:'var(--t1)',maxWidth:190,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
//                       {isAdmin&&<td><div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={users[x.salesman]} size={20}/><span style={{fontSize:12}}>{users[x.salesman]?.name||x.salesman}</span></div></td>}
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t2)'}}>{x.city||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t2)'}}>{x.state||'—'}</td>
//                       <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
//                       <td><StatusBadge status={x.status}/></td>
//                       <td style={{textAlign:'right'}}>{x.target||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:600,color:x.achieved>0?'var(--t1)':'var(--t3)'}}>{x.achieved||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
//                       <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
//                       <td style={{textAlign:'right',color:'var(--t3)'}}>{x.avg6m||'—'}</td>
//                       {[...x.months].map((_,di)=>{const i=x.months.length-1-di;const v=x.months[i];return(<td key={i} style={{textAlign:'right',fontSize:12,color:i===selectedMonthIdx?'var(--acc)':v>0?'var(--t2)':'var(--t3)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{v||'—'}</td>);})}
//                       <td style={{textAlign:'right',color:'var(--t3)'}}>{x.creditDays?x.creditDays+'d':'—'}</td>
//                       <td style={{textAlign:'right',color:'var(--t3)'}}>{fcash(x.creditLimit)}</td>
//                       <td onClick={e=>e.stopPropagation()}>{nc>0?<span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:11,color:oc>0?'#fbbf24':'var(--t2)'}}><MessageSquare size={11}/> {nc}{oc>0&&<span style={{color:'#f87171',fontWeight:700}}>!</span>}</span>:<span style={{color:'var(--t3)'}}>—</span>}</td>
//                       <td onClick={e=>e.stopPropagation()}>
//                         <div style={{display:'flex',gap:5}}>
//                           <button className="btne" onClick={e=>{e.stopPropagation();onEdit(x.id);}}>Open</button>
//                           {isAdmin&&<button className="btnd" onClick={e=>{e.stopPropagation();onDelete(x.id);}}><Trash2 size={11}/></button>}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//                 {filtered.length===0&&<tr><td colSpan="30" style={{textAlign:'center',color:'var(--t3)',padding:40}}>No dealers match your filters</td></tr>}
//               </tbody>
//               <tfoot>
//                 <tr>
//                   <td colSpan={isAdmin?8:7} style={{color:'var(--t1)'}}>TOTAL</td>
//                   <td style={{textAlign:'right'}}>{tt}</td>
//                   <td style={{textAlign:'right',color:'#34d399'}}>{ta}</td>
//                   <td style={{textAlign:'right',color:pclr(pct(tt,ta))}}>{spct(tt,ta)}</td>
//                   <td colSpan="2"/>
//                   {[...MO].map((_,di)=>{const i=MO.length-1-di;const s=filtered.reduce((a,x)=>a+(x.months[i]||0),0);return<td key={i} style={{textAlign:'right',color:i===selectedMonthIdx?'var(--acc)':'var(--t1)',background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{s||''}</td>;})}
//                   <td colSpan="4"/>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DealersList;



// import React, { useState, useMemo, useEffect, useRef } from 'react';
// import { Search, Plus, Download, Trash2, X, CheckSquare, Square, ArrowUpRight, ArrowDownRight, MessageSquare, Columns, List, GripVertical } from 'lucide-react';
// import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
// import { pct, spct, pclr, fcash, num, trendPct } from '../utils';
// import { useMonth } from '../context';
// import { StatusBadge, Avatar, MiniBars, MultiSelect } from './UI';

// // ── Drag-and-drop Kanban board ────────────────────────────
// const STATUS_COLORS = {
//   'ACTIVE':'#34d399','ACHIVERS':'#34d399','ACHIEVERS':'#34d399',
//   'KEY ACCOUNT':'#a78bfa','INACTIVE':'#fbbf24','RECENTLY INACTIVE':'#fb923c',
//   'DEAD':'#f87171','NEW':'#22d3ee','PROSPECT':'#818cf8'
// };
// const getStatusColor = s => STATUS_COLORS[(s||'').toUpperCase()] || '#55546a';

// function KanbanBoard({ dealers, selectedMonthIdx, users, onEdit, onUpdateStatus, isAdmin }) {
//   // ordered columns — persisted in localStorage for drag reorder
//   const defaultCols = [...new Set(dealers.map(d=>(d.status||'OTHER').trim()))].filter(Boolean);
//   const [cols, setCols] = useState(() => {
//     try {
//       const saved = JSON.parse(localStorage.getItem('stp_kanban_cols')||'null');
//       if(saved) {
//         // merge: add new statuses from data, keep saved order
//         const merged = [...saved.filter(c=>defaultCols.includes(c)), ...defaultCols.filter(c=>!saved.includes(c))];
//         return merged;
//       }
//     } catch {}
//     return defaultCols;
//   });
//   const [dragCol, setDragCol] = useState(null);       // col being reordered
//   const [dragCard, setDragCard] = useState(null);     // {dealerId, fromStatus}
//   const [overCol, setOverCol] = useState(null);
//   const [overCard, setOverCard] = useState(null);

//   // keep cols in sync when new statuses appear
//   useEffect(()=>{
//     const current = [...new Set(dealers.map(d=>(d.status||'OTHER').trim()))].filter(Boolean);
//     setCols(prev => {
//       const merged = [...prev.filter(c=>current.includes(c)), ...current.filter(c=>!prev.includes(c))];
//       localStorage.setItem('stp_kanban_cols', JSON.stringify(merged));
//       return merged;
//     });
//   },[dealers]);

//   // ── Column drag ────────────────────────────────────────
//   const onColDragStart = (e, col) => { setDragCol(col); e.dataTransfer.effectAllowed='move'; };
//   const onColDragOver  = (e, col) => { e.preventDefault(); setOverCol(col); };
//   const onColDrop      = (e, targetCol) => {
//     e.preventDefault();
//     if(!dragCol||dragCol===targetCol)return;
//     setCols(prev=>{
//       const next=[...prev];
//       const fi=next.indexOf(dragCol), ti=next.indexOf(targetCol);
//       if(fi<0||ti<0)return prev;
//       next.splice(fi,1); next.splice(ti,0,dragCol);
//       localStorage.setItem('stp_kanban_cols', JSON.stringify(next));
//       return next;
//     });
//     setDragCol(null); setOverCol(null);
//   };

//   // ── Card drag (move dealer to different status) ────────
//   const onCardDragStart = (e, dealerId, status) => {
//     setDragCard({dealerId, fromStatus:status});
//     e.dataTransfer.effectAllowed='move';
//     e.stopPropagation();
//   };
//   const onCardDrop = (e, targetStatus) => {
//     e.preventDefault();
//     if(!dragCard||dragCard.fromStatus===targetStatus)return;
//     onUpdateStatus(dragCard.dealerId, targetStatus);
//     setDragCard(null); setOverCol(null);
//   };

//   const dealersByStatus = useMemo(()=>{
//     const map={};
//     dealers.forEach(d=>{
//       const s=(d.status||'OTHER').trim();
//       if(!map[s])map[s]=[];
//       map[s].push(d);
//     });
//     return map;
//   },[dealers]);

//   return(
//     <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:12,alignItems:'flex-start',minHeight:400}}>
//       {cols.map(col=>{
//         const colDealers=(dealersByStatus[col]||[]).sort((a,b)=>(b.months[selectedMonthIdx]||0)-(a.months[selectedMonthIdx]||0));
//         const colTotal=colDealers.reduce((s,d)=>s+(d.months[selectedMonthIdx]||0),0);
//         const clr=getStatusColor(col);
//         const isOver=overCol===col&&dragCard&&dragCard.fromStatus!==col;
//         return(
//           <div key={col}
//             draggable onDragStart={e=>onColDragStart(e,col)} onDragOver={e=>onColDragOver(e,col)}
//             onDrop={e=>{ dragCol?onColDrop(e,col):onCardDrop(e,col); }} onDragEnd={()=>{setDragCol(null);setDragCard(null);setOverCol(null);}}
//             style={{
//               minWidth:220, maxWidth:240, flexShrink:0,
//               background: isOver?`${clr}18`:'var(--bg1)',
//               border:`1.5px solid ${isOver?clr:dragCol===col?clr+'66':'var(--b1)'}`,
//               borderRadius:10, overflow:'hidden',
//               transition:'border .15s,background .15s',
//               opacity: dragCol===col?0.5:1,
//             }}>
//             {/* Column header */}
//             <div style={{padding:'10px 12px',background:`${clr}18`,borderBottom:`1px solid ${clr}33`,
//               display:'flex',alignItems:'center',gap:6,cursor:'grab',userSelect:'none'}}>
//               <GripVertical size={12} color={clr} style={{flexShrink:0}}/>
//               <span style={{width:8,height:8,borderRadius:'50%',background:clr,flexShrink:0}}/>
//               <span style={{fontSize:12,fontWeight:700,color:clr,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{col}</span>
//               <span style={{fontSize:11,color:clr,fontWeight:700,background:`${clr}22`,padding:'1px 6px',borderRadius:8}}>{colDealers.length}</span>
//               <span style={{fontSize:10,color:'var(--t3)'}}>·{colTotal}</span>
//             </div>
//             {/* Cards */}
//             <div style={{padding:8,display:'flex',flexDirection:'column',gap:6,maxHeight:500,overflowY:'auto'}}>
//               {colDealers.map(d=>{
//                 const ach=d.months[selectedMonthIdx]||0;
//                 const tgt=d.monthTargets?.[selectedMonthIdx]??d.target;
//                 const p=pct(tgt,ach);
//                 const sm=users[d.salesman];
//                 return(
//                   <div key={d.id}
//                     draggable onDragStart={e=>onCardDragStart(e,d.id,col)}
//                     onClick={()=>onEdit(d.id)}
//                     style={{background:'var(--bg2)',borderRadius:8,padding:'9px 11px',cursor:'pointer',
//                       border:`1px solid ${overCard===d.id?clr:'var(--b2)'}`,
//                       boxShadow:dragCard?.dealerId===d.id?'0 4px 12px rgba(0,0,0,.4)':'none',
//                       opacity:dragCard?.dealerId===d.id?0.6:1,
//                       transition:'border .1s,opacity .1s'}}
//                     onMouseEnter={e=>{e.currentTarget.style.borderColor=clr;}}
//                     onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b2)';}}>
//                     <div style={{fontSize:12,fontWeight:600,color:'var(--t1)',marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
//                     <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:11}}>
//                       <span style={{color:'var(--t3)'}}>{MO[selectedMonthIdx].slice(0,3)}: <strong style={{color:ach>0?'var(--t1)':'var(--t3)'}}>{ach||'—'}</strong></span>
//                       <span style={{color:pclr(p),fontWeight:700}}>{spct(tgt,ach)}</span>
//                     </div>
//                     {tgt>0&&<div style={{height:3,background:'var(--b1)',borderRadius:2,marginBottom:6,overflow:'hidden'}}>
//                       <div style={{height:'100%',width:`${Math.min(p||0,100)}%`,background:pclr(p),borderRadius:2}}/>
//                     </div>}
//                     <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
//                       <MiniBars months={d.months} highlightIdx={selectedMonthIdx}/>
//                       {isAdmin&&sm&&<Avatar user={sm} size={18}/>}
//                     </div>
//                     {d.category&&<div style={{fontSize:10,color:'#818cf8',marginTop:4}}>{d.category}{d.categoryType?` · ${d.categoryType}`:''}</div>}
//                   </div>
//                 );
//               })}
//               {colDealers.length===0&&(
//                 <div style={{textAlign:'center',padding:'20px 8px',color:'var(--t3)',fontSize:12,border:'1px dashed var(--b2)',borderRadius:8}}>Drop here</div>
//               )}
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ── Main DealersList ──────────────────────────────────────
// const DealersList=({dealers,currentUser,users,onEdit,onDelete,onAdd,selected,setSelected,onBulkAction,notes,pendingFilters,clearPending,onUpdateDealer})=>{
//   const {selectedMonthIdx, MO:ctxMO}=useMonth();
//   const MO = ctxMO || MO_CONST;
//   const selMoLabel=MO[selectedMonthIdx].slice(0,3);
//   const isAdmin=currentUser.role==='admin';
//   const [viewMode,setViewMode]=useState('table'); // 'table' | 'kanban'
//   const [filters,setFilters]=useState({q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]});
//   const [sort,setSort]=useState({col:'name',dir:1});

//   useEffect(()=>{
//     if(pendingFilters){
//       const f={q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]};
//       Object.keys(pendingFilters).forEach(k=>{
//         if(k==='_ts')return;
//         if(['status','category','categoryType','sm','city','state','zone'].includes(k))f[k]=[pendingFilters[k]];
//         else f[k]=pendingFilters[k];
//       });
//       setFilters(f);
//       clearPending&&clearPending();
//     }
//   },[pendingFilters,clearPending]);

//   const dealersForMonth=useMemo(()=>dealers.map(d=>({
//     ...d,
//     achieved: d.months[selectedMonthIdx]||0,
//     target:   d.monthTargets?.[selectedMonthIdx]||0,
//     // Use per-month status/zone if available, else fall back to current
//     status: d.monthStatus?.[selectedMonthIdx] || d.status || 'ACTIVE',
//     zone:   d.monthZone?.[selectedMonthIdx]   || d.zone   || '',
//   })),[dealers,selectedMonthIdx]);

//   const allStatuses    =useMemo(()=>[...new Set(dealers.map(x=>(x.status||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allZones       =useMemo(()=>[...new Set(dealers.map(x=>x.zone).filter(Boolean))].sort(),[dealers]);
//   const allCities      =useMemo(()=>[...new Set(dealers.map(x=>(x.city||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allStates      =useMemo(()=>[...new Set(dealers.map(x=>(x.state||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allCategories  =useMemo(()=>[...new Set(dealers.map(x=>(x.category||'').trim()).filter(Boolean))].sort(),[dealers]);
//   const allCategoryTypes=useMemo(()=>[...new Set(dealers.map(x=>(x.categoryType||'').trim()).filter(Boolean))].sort(),[dealers]);

//   const filtered=useMemo(()=>{
//     let d=dealersForMonth;
//     if(filters.q)d=d.filter(x=>x.name.toLowerCase().includes(filters.q.toLowerCase())||(x.city||'').toLowerCase().includes(filters.q.toLowerCase())||(x.state||'').toLowerCase().includes(filters.q.toLowerCase()));
//     if(filters.zone.length>0)d=d.filter(x=>filters.zone.includes(x.zone||''));
//     if(filters.status.length>0)d=d.filter(x=>filters.status.map(s=>s.toUpperCase()).includes((x.status||'').toUpperCase()));
//     if(isAdmin&&filters.sm.length>0)d=d.filter(x=>filters.sm.includes(x.salesman));
//     if(filters.credit==='yes')d=d.filter(x=>x.creditLimit>0);
//     if(filters.credit==='no')d=d.filter(x=>!x.creditLimit);
//     if(filters.city.length>0)d=d.filter(x=>filters.city.includes((x.city||'').trim()));
//     if(filters.state.length>0)d=d.filter(x=>filters.state.includes((x.state||'').trim()));
//     if(filters.category.length>0)d=d.filter(x=>filters.category.includes(x.category||''));
//     if(filters.categoryType.length>0)d=d.filter(x=>filters.categoryType.includes(x.categoryType||''));
//     if(filters.minPct)d=d.filter(x=>(pct(x.target,x.achieved)||0)>=num(filters.minPct));
//     if(filters.maxPct)d=d.filter(x=>(pct(x.target,x.achieved)||0)<=num(filters.maxPct));
//     return[...d].sort((a,b)=>{
//       let av=(a[sort.col]??''),bv=(b[sort.col]??'');
//       if(typeof av==='string'){av=av.toLowerCase();bv=bv.toLowerCase();}
//       return av<bv?-sort.dir:av>bv?sort.dir:0;
//     });
//   },[dealersForMonth,filters,sort,isAdmin]);

//   const tt=filtered.reduce((s,x)=>s+x.target,0);
//   const ta=filtered.reduce((s,x)=>s+x.achieved,0);
//   const noteCount    =id=>notes.filter(n=>n.dealerId===id).length;
//   const overdueCount =id=>notes.filter(n=>n.dealerId===id&&n.type==='followup'&&!n.completed&&new Date(n.dueDate)<new Date()).length;
//   const toggleSel    =id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
//   const toggleAll    =()=>{if(selected.length===filtered.length)setSelected([]);else setSelected(filtered.map(x=>x.id));};
//   const hasF=filters.q||filters.zone.length>0||filters.status.length>0||filters.sm.length>0||filters.credit||filters.city.length>0||filters.state.length>0||filters.category.length>0||filters.categoryType.length>0||filters.minPct||filters.maxPct;
//   const clearFilters =()=>setFilters({q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]});

//   const onUpdateStatus=(dealerId,newStatus)=>{
//     onUpdateDealer&&onUpdateDealer(dealerId,{status:newStatus});
//   };

//   const exportCsv=()=>{
//     const h=['Dealer','Salesman','Zone','City','State','Category','Cat Type','Status','Target','Achieved','Ach%',...MO,'Cr Days','Cr Limit'];
//     const rows=filtered.map(x=>[x.name,users[x.salesman]?.name||x.salesman,x.zone,x.city||'',x.state||'',x.category||'',x.categoryType||'',x.status,x.target,x.achieved,spct(x.target,x.achieved),...x.months,x.creditDays,x.creditLimit]);
//     const csv=[h,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
//     const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='dealers_'+Date.now()+'.csv';a.click();
//   };

//   const sh=(col,lbl)=>(
//     <th className="sort" onClick={()=>setSort(s=>s.col===col?{col,dir:-s.dir}:{col,dir:1})}>
//       {lbl}{sort.col===col?(sort.dir>0?' ↑':' ↓'):''}
//     </th>
//   );

//   return(
//     <div className="fade">
//       {/* Header */}
//       <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:10}}>
//         <div>
//           <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:2}}>Dealer Records · {MO[selectedMonthIdx]}</div>
//           <div style={{fontSize:20,fontWeight:700}}>{filtered.length} dealers <span style={{fontSize:13,color:'var(--t3)',fontWeight:400}}>· Tgt {tt} · Ach {ta} · {spct(tt,ta)}</span></div>
//         </div>
//         <div className="spacer"/>
//         {selected.length>0&&(
//           <div style={{display:'flex',gap:6,alignItems:'center',background:'var(--accL)',padding:'6px 10px',borderRadius:6}}>
//             <span style={{fontSize:12,color:'var(--acc)',fontWeight:600}}>{selected.length} selected</span>
//             <button className="btn" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>onBulkAction('status')}>Change Status</button>
//             {isAdmin&&<button className="btn" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>onBulkAction('salesman')}>Reassign</button>}
//             <button className="btnd" style={{fontSize:11}} onClick={()=>onBulkAction('delete')}>Delete</button>
//             <button className="btn" style={{fontSize:11,padding:'4px 8px'}} onClick={()=>setSelected([])}><X size={12}/></button>
//           </div>
//         )}
//         {/* View toggle */}
//         <div style={{display:'flex',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:7,overflow:'hidden'}}>
//           <button onClick={()=>setViewMode('table')} style={{background:viewMode==='table'?'var(--acc)':'transparent',color:viewMode==='table'?'#fff':'var(--t3)',border:'none',padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,transition:'all .15s'}}><List size={13}/> Table</button>
//           <button onClick={()=>setViewMode('kanban')} style={{background:viewMode==='kanban'?'var(--acc)':'transparent',color:viewMode==='kanban'?'#fff':'var(--t3)',border:'none',padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,borderLeft:'1px solid var(--b2)',transition:'all .15s'}}><Columns size={13}/> Kanban</button>
//         </div>
//         <button onClick={exportCsv} className="btn" style={{fontSize:12,display:'flex',alignItems:'center',gap:5}}><Download size={13}/> Export</button>
//         <button onClick={onAdd} className="btnp" style={{display:'flex',alignItems:'center',gap:5}}><Plus size={14}/> Add Dealer</button>
//       </div>

//       {/* Filters */}
//       <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
//         <div style={{position:'relative'}}>
//           <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
//           <input className="inp" style={{width:200,paddingLeft:32}} placeholder="Search name/city/state..." value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
//         </div>
//         <MultiSelect options={allStatuses} selected={filters.status} onChange={v=>setFilters({...filters,status:v})} placeholder="Status (All)"
//           renderOption={s=><StatusBadge status={s}/>}/>
//         <MultiSelect options={allZones} selected={filters.zone} onChange={v=>setFilters({...filters,zone:v})} placeholder="Zone (All)"/>
//         {allCategories.length>0&&<MultiSelect options={allCategories} selected={filters.category} onChange={v=>setFilters({...filters,category:v})} placeholder="Category (All)"
//           renderOption={c=><span style={{fontSize:12,color:'#818cf8'}}>{c}</span>}/>}
//         {allCategoryTypes.length>0&&<MultiSelect options={allCategoryTypes} selected={filters.categoryType} onChange={v=>setFilters({...filters,categoryType:v})} placeholder="Cat Type (All)"/>}
//         {allCities.length>0&&<MultiSelect options={allCities} selected={filters.city} onChange={v=>setFilters({...filters,city:v})} placeholder="City (All)"/>}
//         {allStates.length>0&&<MultiSelect options={allStates} selected={filters.state} onChange={v=>setFilters({...filters,state:v})} placeholder="State (All)"/>}
//         {isAdmin&&<MultiSelect options={Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id)} selected={filters.sm}
//           onChange={v=>setFilters({...filters,sm:v})} placeholder="Salesman (All)"
//           renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={18}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
//         <input className="inp" style={{width:80}} type="number" placeholder="Min %" value={filters.minPct} onChange={e=>setFilters({...filters,minPct:e.target.value})}/>
//         <input className="inp" style={{width:80}} type="number" placeholder="Max %" value={filters.maxPct} onChange={e=>setFilters({...filters,maxPct:e.target.value})}/>
//         {hasF&&<button onClick={clearFilters} className="btn" style={{color:'var(--red)',fontSize:12}}><X size={12} style={{display:'inline',verticalAlign:'middle'}}/> Clear</button>}
//       </div>

//       {/* Kanban view */}
//       {viewMode==='kanban'&&(
//         <div className="card" style={{padding:14,marginBottom:0}}>
//           <div style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>
//             Drag columns to reorder · Drag cards to change status
//           </div>
//           <KanbanBoard
//             dealers={filtered}
//             selectedMonthIdx={selectedMonthIdx}
//             users={users}
//             onEdit={onEdit}
//             onUpdateStatus={onUpdateStatus}
//             isAdmin={isAdmin}
//           />
//         </div>
//       )}

//       {/* Table view */}
//       {viewMode==='table'&&(
//         <div className="card" style={{padding:0,overflow:'hidden'}}>
//           <div className="scroll" style={{maxHeight:'60vh',overflowY:'auto'}}>
//             <table>
//               <thead>
//                 <tr>
//                   <th style={{width:30}}><button onClick={toggleAll} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',display:'flex'}}>{selected.length===filtered.length&&filtered.length>0?<CheckSquare size={14}/>:<Square size={14}/>}</button></th>
//                   {sh('name','Dealer Name')}
//                   {isAdmin&&<th>Salesman</th>}
//                   {sh('zone','Zone')}
//                   {sh('city','City')}{sh('state','State')}
//                   {sh('category','Category')}{sh('categoryType','Cat Type')}
//                   {sh('status','Status')}
//                   {sh('target','Tgt')}{sh('achieved','Ach')}<th>%</th><th>Trend</th>
//                   {sh('avg6m','6m Avg')}
//                   {[...MO].map((_,di)=>{const i=MO.length-1-di;return<th key={i} style={{background:i===selectedMonthIdx?'rgba(99,102,241,.08)':'var(--bg1)'}}>{MO[i]}</th>;})}
//                   {sh('creditDays','CrD')}{sh('creditLimit','Cr Limit')}
//                   <th>Notes</th><th>Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filtered.map(x=>{
//                   const p=pct(x.target,x.achieved);const tp=trendPct(x.months);const nc=noteCount(x.id);const oc=overdueCount(x.id);
//                   return(
//                     <tr key={x.id} onClick={()=>onEdit(x.id)} style={{cursor:'pointer',background:selected.includes(x.id)?'var(--accL)':'transparent'}}>
//                       <td onClick={e=>{e.stopPropagation();toggleSel(x.id);}}>{selected.includes(x.id)?<CheckSquare size={14} color="var(--acc)"/>:<Square size={14} color="var(--t3)"/>}</td>
//                       <td style={{fontWeight:600,color:'var(--t1)',maxWidth:190,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
//                       {isAdmin&&<td><div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={users[x.salesman]} size={20}/><span style={{fontSize:12}}>{users[x.salesman]?.name||x.salesman}</span></div></td>}
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t2)'}}>{x.city||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t2)'}}>{x.state||'—'}</td>
//                       <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
//                       <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
//                       <td><StatusBadge status={x.status}/></td>
//                       <td style={{textAlign:'right'}}>{x.target||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:600,color:x.achieved>0?'var(--t1)':'var(--t3)'}}>{x.achieved||'—'}</td>
//                       <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
//                       <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
//                       <td style={{textAlign:'right',color:'var(--t3)'}}>{x.avg6m||'—'}</td>
//                       {[...x.months].map((_,di)=>{const i=x.months.length-1-di;const v=x.months[i];return(<td key={i} style={{textAlign:'right',fontSize:12,color:i===selectedMonthIdx?'var(--acc)':v>0?'var(--t2)':'var(--t3)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{v||'—'}</td>);})}
//                       <td style={{textAlign:'right',color:'var(--t3)'}}>{x.creditDays?x.creditDays+'d':'—'}</td>
//                       <td style={{textAlign:'right',color:'var(--t3)'}}>{fcash(x.creditLimit)}</td>
//                       <td onClick={e=>e.stopPropagation()}>{nc>0?<span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:11,color:oc>0?'#fbbf24':'var(--t2)'}}><MessageSquare size={11}/> {nc}{oc>0&&<span style={{color:'#f87171',fontWeight:700}}>!</span>}</span>:<span style={{color:'var(--t3)'}}>—</span>}</td>
//                       <td onClick={e=>e.stopPropagation()}>
//                         <div style={{display:'flex',gap:5}}>
//                           <button className="btne" onClick={e=>{e.stopPropagation();onEdit(x.id);}}>Open</button>
//                           {isAdmin&&<button className="btnd" onClick={e=>{e.stopPropagation();onDelete(x.id);}}><Trash2 size={11}/></button>}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//                 {filtered.length===0&&<tr><td colSpan="30" style={{textAlign:'center',color:'var(--t3)',padding:40}}>No dealers match your filters</td></tr>}
//               </tbody>
//               <tfoot>
//                 <tr>
//                   <td colSpan={isAdmin?8:7} style={{color:'var(--t1)'}}>TOTAL</td>
//                   <td style={{textAlign:'right'}}>{tt}</td>
//                   <td style={{textAlign:'right',color:'#34d399'}}>{ta}</td>
//                   <td style={{textAlign:'right',color:pclr(pct(tt,ta))}}>{spct(tt,ta)}</td>
//                   <td colSpan="2"/>
//                   {[...MO].map((_,di)=>{const i=MO.length-1-di;const s=filtered.reduce((a,x)=>a+(x.months[i]||0),0);return<td key={i} style={{textAlign:'right',color:i===selectedMonthIdx?'var(--acc)':'var(--t1)',background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{s||''}</td>;})}
//                   <td colSpan="4"/>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DealersList;


import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, Download, Trash2, X, CheckSquare, Square, ArrowUpRight, ArrowDownRight, MessageSquare, Columns, List, GripVertical } from 'lucide-react';
import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
import { pct, spct, pclr, fcash, num, trendPct } from '../utils';
import { useMonth } from '../context';
import { StatusBadge, Avatar, MiniBars, MultiSelect } from './UI';

// ── Drag-and-drop Kanban board ────────────────────────────
const STATUS_COLORS = {
  'ACTIVE':'#34d399','ACHIVERS':'#34d399','ACHIEVERS':'#34d399',
  'KEY ACCOUNT':'#a78bfa','INACTIVE':'#fbbf24','RECENTLY INACTIVE':'#fb923c',
  'DEAD':'#f87171','NEW':'#22d3ee','PROSPECT':'#818cf8'
};
const getStatusColor = s => STATUS_COLORS[(s||'').toUpperCase()] || '#55546a';

function KanbanBoard({ dealers, selectedMonthIdx, users, onEdit, onUpdateStatus, isAdmin }) {
  // ordered columns — persisted in localStorage for drag reorder
  const defaultCols = [...new Set(dealers.map(d=>(d.status||'OTHER').trim()))].filter(Boolean);
  const [cols, setCols] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('stp_kanban_cols')||'null');
      if(saved) {
        // merge: add new statuses from data, keep saved order
        const merged = [...saved.filter(c=>defaultCols.includes(c)), ...defaultCols.filter(c=>!saved.includes(c))];
        return merged;
      }
    } catch {}
    return defaultCols;
  });
  const [dragCol, setDragCol] = useState(null);       // col being reordered
  const [dragCard, setDragCard] = useState(null);     // {dealerId, fromStatus}
  const [overCol, setOverCol] = useState(null);
  const [overCard, setOverCard] = useState(null);

  // keep cols in sync when new statuses appear
  useEffect(()=>{
    const current = [...new Set(dealers.map(d=>(d.status||'OTHER').trim()))].filter(Boolean);
    setCols(prev => {
      const merged = [...prev.filter(c=>current.includes(c)), ...current.filter(c=>!prev.includes(c))];
      localStorage.setItem('stp_kanban_cols', JSON.stringify(merged));
      return merged;
    });
  },[dealers]);

  // ── Column drag ────────────────────────────────────────
  const onColDragStart = (e, col) => { setDragCol(col); e.dataTransfer.effectAllowed='move'; };
  const onColDragOver  = (e, col) => { e.preventDefault(); setOverCol(col); };
  const onColDrop      = (e, targetCol) => {
    e.preventDefault();
    if(!dragCol||dragCol===targetCol)return;
    setCols(prev=>{
      const next=[...prev];
      const fi=next.indexOf(dragCol), ti=next.indexOf(targetCol);
      if(fi<0||ti<0)return prev;
      next.splice(fi,1); next.splice(ti,0,dragCol);
      localStorage.setItem('stp_kanban_cols', JSON.stringify(next));
      return next;
    });
    setDragCol(null); setOverCol(null);
  };

  // ── Card drag (move dealer to different status) ────────
  const onCardDragStart = (e, dealerId, status) => {
    setDragCard({dealerId, fromStatus:status});
    e.dataTransfer.effectAllowed='move';
    e.stopPropagation();
  };
  const onCardDrop = (e, targetStatus) => {
    e.preventDefault();
    if(!dragCard||dragCard.fromStatus===targetStatus)return;
    onUpdateStatus(dragCard.dealerId, targetStatus);
    setDragCard(null); setOverCol(null);
  };

  const dealersByStatus = useMemo(()=>{
    const map={};
    dealers.forEach(d=>{
      const s=(d.status||'OTHER').trim();
      if(!map[s])map[s]=[];
      map[s].push(d);
    });
    return map;
  },[dealers]);

  return(
    <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:12,alignItems:'flex-start',minHeight:400}}>
      {cols.map(col=>{
        const colDealers=(dealersByStatus[col]||[]).sort((a,b)=>(b.months[selectedMonthIdx]||0)-(a.months[selectedMonthIdx]||0));
        const colTotal=colDealers.reduce((s,d)=>s+(d.months[selectedMonthIdx]||0),0);
        const clr=getStatusColor(col);
        const isOver=overCol===col&&dragCard&&dragCard.fromStatus!==col;
        return(
          <div key={col}
            draggable onDragStart={e=>onColDragStart(e,col)} onDragOver={e=>onColDragOver(e,col)}
            onDrop={e=>{ dragCol?onColDrop(e,col):onCardDrop(e,col); }} onDragEnd={()=>{setDragCol(null);setDragCard(null);setOverCol(null);}}
            style={{
              minWidth:220, maxWidth:240, flexShrink:0,
              background: isOver?`${clr}18`:'var(--bg1)',
              border:`1.5px solid ${isOver?clr:dragCol===col?clr+'66':'var(--b1)'}`,
              borderRadius:10, overflow:'hidden',
              transition:'border .15s,background .15s',
              opacity: dragCol===col?0.5:1,
            }}>
            {/* Column header */}
            <div style={{padding:'10px 12px',background:`${clr}18`,borderBottom:`1px solid ${clr}33`,
              display:'flex',alignItems:'center',gap:6,cursor:'grab',userSelect:'none'}}>
              <GripVertical size={12} color={clr} style={{flexShrink:0}}/>
              <span style={{width:8,height:8,borderRadius:'50%',background:clr,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:700,color:clr,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{col}</span>
              <span style={{fontSize:11,color:clr,fontWeight:700,background:`${clr}22`,padding:'1px 6px',borderRadius:8}}>{colDealers.length}</span>
              <span style={{fontSize:10,color:'var(--t3)'}}>·{colTotal}</span>
            </div>
            {/* Cards */}
            <div style={{padding:8,display:'flex',flexDirection:'column',gap:6,maxHeight:500,overflowY:'auto'}}>
              {colDealers.map(d=>{
                const ach=d.months[selectedMonthIdx]||0;
                const tgt=d.monthTargets?.[selectedMonthIdx]??d.target;
                const p=pct(tgt,ach);
                const sm=users[d.salesman];
                return(
                  <div key={d.id}
                    draggable onDragStart={e=>onCardDragStart(e,d.id,col)}
                    onClick={()=>onEdit(d.id)}
                    style={{background:'var(--bg2)',borderRadius:8,padding:'9px 11px',cursor:'pointer',
                      border:`1px solid ${overCard===d.id?clr:'var(--b2)'}`,
                      boxShadow:dragCard?.dealerId===d.id?'0 4px 12px rgba(0,0,0,.4)':'none',
                      opacity:dragCard?.dealerId===d.id?0.6:1,
                      transition:'border .1s,opacity .1s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=clr;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--b2)';}}>
                    <div style={{fontSize:12,fontWeight:600,color:'var(--t1)',marginBottom:5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:11}}>
                      <span style={{color:'var(--t3)'}}>{MO[selectedMonthIdx].slice(0,3)}: <strong style={{color:ach>0?'var(--t1)':'var(--t3)'}}>{ach||'—'}</strong></span>
                      <span style={{color:pclr(p),fontWeight:700}}>{spct(tgt,ach)}</span>
                    </div>
                    {tgt>0&&<div style={{height:3,background:'var(--b1)',borderRadius:2,marginBottom:6,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${Math.min(p||0,100)}%`,background:pclr(p),borderRadius:2}}/>
                    </div>}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <MiniBars months={d.months} highlightIdx={selectedMonthIdx}/>
                      {isAdmin&&sm&&<Avatar user={sm} size={18}/>}
                    </div>
                    {d.category&&<div style={{fontSize:10,color:'#818cf8',marginTop:4}}>{d.category}{d.categoryType?` · ${d.categoryType}`:''}</div>}
                  </div>
                );
              })}
              {colDealers.length===0&&(
                <div style={{textAlign:'center',padding:'20px 8px',color:'var(--t3)',fontSize:12,border:'1px dashed var(--b2)',borderRadius:8}}>Drop here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main DealersList ──────────────────────────────────────
const DealersList=({dealers,currentUser,users,onEdit,onDelete,onAdd,selected,setSelected,onBulkAction,notes,pendingFilters,clearPending,onUpdateDealer})=>{
  const {selectedMonthIdx, MO:ctxMO}=useMonth();
  const MO = ctxMO || MO_CONST;
  const selMoLabel=MO[selectedMonthIdx].slice(0,3);
  const isAdmin=currentUser.role==='admin';
  const [viewMode,setViewMode]=useState('table'); // 'table' | 'kanban'
  const [filters,setFilters]=useState({q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]});
  const [sort,setSort]=useState({col:'name',dir:1});

  useEffect(()=>{
    if(pendingFilters){
      const f={q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]};
      Object.keys(pendingFilters).forEach(k=>{
        if(k==='_ts')return;
        if(['status','category','categoryType','sm','city','state','zone'].includes(k))f[k]=[pendingFilters[k]];
        else f[k]=pendingFilters[k];
      });
      setFilters(f);
      clearPending&&clearPending();
    }
  },[pendingFilters,clearPending]);

  const dealersForMonth=useMemo(()=>{
    return dealers
      .filter(d => {
        // If dealer has monthsWithData info, only show if this month was uploaded
        // If no monthsWithData (sheet mode), show all dealers
        if(d.monthsWithData && d.monthsWithData.size > 0) {
          return d.monthsWithData.has(selectedMonthIdx);
        }
        // Fallback: show if has any achieved data
        return true;
      })
      .map(d => ({
        ...d,
        achieved:     d.months?.[selectedMonthIdx]||0,
        target:       d.monthTargets?.[selectedMonthIdx]||0,
        status:       d.monthStatus?.[selectedMonthIdx]  || d.status      || 'ACTIVE',
        zone:         d.monthZone?.[selectedMonthIdx]    || d.zone         || '',
        category:     d.monthCat?.[selectedMonthIdx]     || d.category     || '',
        categoryType: d.monthCatType?.[selectedMonthIdx] || d.categoryType || '',
      }));
  },[dealers,selectedMonthIdx]);

  const allStatuses    =useMemo(()=>[...new Set(dealers.map(x=>(x.status||'').trim()).filter(Boolean))].sort(),[dealers]);
  const allZones       =useMemo(()=>[...new Set(dealers.map(x=>x.zone).filter(Boolean))].sort(),[dealers]);
  const allCities      =useMemo(()=>[...new Set(dealers.map(x=>(x.city||'').trim()).filter(Boolean))].sort(),[dealers]);
  const allStates      =useMemo(()=>[...new Set(dealers.map(x=>(x.state||'').trim()).filter(Boolean))].sort(),[dealers]);
  const allCategories  =useMemo(()=>[...new Set(dealers.map(x=>(x.category||'').trim()).filter(Boolean))].sort(),[dealers]);
  const allCategoryTypes=useMemo(()=>[...new Set(dealers.map(x=>(x.categoryType||'').trim()).filter(Boolean))].sort(),[dealers]);

  const filtered=useMemo(()=>{
    let d=dealersForMonth;
    if(filters.q)d=d.filter(x=>x.name.toLowerCase().includes(filters.q.toLowerCase())||(x.city||'').toLowerCase().includes(filters.q.toLowerCase())||(x.state||'').toLowerCase().includes(filters.q.toLowerCase()));
    if(filters.zone.length>0)d=d.filter(x=>filters.zone.includes(x.zone||''));
    if(filters.status.length>0)d=d.filter(x=>filters.status.map(s=>s.toUpperCase()).includes((x.status||'').toUpperCase()));
    if(isAdmin&&filters.sm.length>0)d=d.filter(x=>filters.sm.includes(x.salesman));
    if(filters.credit==='yes')d=d.filter(x=>x.creditLimit>0);
    if(filters.credit==='no')d=d.filter(x=>!x.creditLimit);
    if(filters.city.length>0)d=d.filter(x=>filters.city.includes((x.city||'').trim()));
    if(filters.state.length>0)d=d.filter(x=>filters.state.includes((x.state||'').trim()));
    if(filters.category.length>0)d=d.filter(x=>filters.category.includes(x.category||''));
    if(filters.categoryType.length>0)d=d.filter(x=>filters.categoryType.includes(x.categoryType||''));
    if(filters.minPct)d=d.filter(x=>(pct(x.target,x.achieved)||0)>=num(filters.minPct));
    if(filters.maxPct)d=d.filter(x=>(pct(x.target,x.achieved)||0)<=num(filters.maxPct));
    return[...d].sort((a,b)=>{
      let av=(a[sort.col]??''),bv=(b[sort.col]??'');
      if(typeof av==='string'){av=av.toLowerCase();bv=bv.toLowerCase();}
      return av<bv?-sort.dir:av>bv?sort.dir:0;
    });
  },[dealersForMonth,filters,sort,isAdmin]);

  const tt=filtered.reduce((s,x)=>s+x.target,0);
  const ta=filtered.reduce((s,x)=>s+x.achieved,0);
  const noteCount    =id=>notes.filter(n=>n.dealerId===id).length;
  const overdueCount =id=>notes.filter(n=>n.dealerId===id&&n.type==='followup'&&!n.completed&&new Date(n.dueDate)<new Date()).length;
  const toggleSel    =id=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const toggleAll    =()=>{if(selected.length===filtered.length)setSelected([]);else setSelected(filtered.map(x=>x.id));};
  const hasF=filters.q||filters.zone.length>0||filters.status.length>0||filters.sm.length>0||filters.credit||filters.city.length>0||filters.state.length>0||filters.category.length>0||filters.categoryType.length>0||filters.minPct||filters.maxPct;
  const clearFilters =()=>setFilters({q:'',zone:[],status:[],sm:[],credit:'',minPct:'',maxPct:'',city:[],state:[],category:[],categoryType:[]});

  const onUpdateStatus=(dealerId,newStatus)=>{
    onUpdateDealer&&onUpdateDealer(dealerId,{status:newStatus});
  };

  const exportCsv=()=>{
    const h=['Dealer','Salesman','Zone','City','State','Category','Cat Type','Status','Target','Achieved','Ach%',...MO,'Cr Days','Cr Limit'];
    const rows=filtered.map(x=>[x.name,users[x.salesman]?.name||x.salesman,x.zone,x.city||'',x.state||'',x.category||'',x.categoryType||'',x.status,x.target,x.achieved,spct(x.target,x.achieved),...x.months,x.creditDays,x.creditLimit]);
    const csv=[h,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download='dealers_'+Date.now()+'.csv';a.click();
  };

  const sh=(col,lbl)=>(
    <th className="sort" onClick={()=>setSort(s=>s.col===col?{col,dir:-s.dir}:{col,dir:1})}>
      {lbl}{sort.col===col?(sort.dir>0?' ↑':' ↓'):''}
    </th>
  );

  return(
    <div className="fade">
      {/* Header */}
      <div className="row" style={{marginBottom:14,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:2}}>Dealer Records · {MO[selectedMonthIdx]}</div>
          <div style={{fontSize:20,fontWeight:700}}>{filtered.length} dealers <span style={{fontSize:13,color:'var(--t3)',fontWeight:400}}>· Tgt {tt} · Ach {ta} · {spct(tt,ta)}</span></div>
        </div>
        <div className="spacer"/>
        {selected.length>0&&(
          <div style={{display:'flex',gap:6,alignItems:'center',background:'var(--accL)',padding:'6px 10px',borderRadius:6}}>
            <span style={{fontSize:12,color:'var(--acc)',fontWeight:600}}>{selected.length} selected</span>
            <button className="btn" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>onBulkAction('status')}>Change Status</button>
            {isAdmin&&<button className="btn" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>onBulkAction('salesman')}>Reassign</button>}
            <button className="btnd" style={{fontSize:11}} onClick={()=>onBulkAction('delete')}>Delete</button>
            <button className="btn" style={{fontSize:11,padding:'4px 8px'}} onClick={()=>setSelected([])}><X size={12}/></button>
          </div>
        )}
        {/* View toggle */}
        <div style={{display:'flex',background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:7,overflow:'hidden'}}>
          <button onClick={()=>setViewMode('table')} style={{background:viewMode==='table'?'var(--acc)':'transparent',color:viewMode==='table'?'#fff':'var(--t3)',border:'none',padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,transition:'all .15s'}}><List size={13}/> Table</button>
          <button onClick={()=>setViewMode('kanban')} style={{background:viewMode==='kanban'?'var(--acc)':'transparent',color:viewMode==='kanban'?'#fff':'var(--t3)',border:'none',padding:'6px 12px',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontSize:12,borderLeft:'1px solid var(--b2)',transition:'all .15s'}}><Columns size={13}/> Kanban</button>
        </div>
        <button onClick={exportCsv} className="btn" style={{fontSize:12,display:'flex',alignItems:'center',gap:5}}><Download size={13}/> Export</button>
        <button onClick={onAdd} className="btnp" style={{display:'flex',alignItems:'center',gap:5}}><Plus size={14}/> Add Dealer</button>
      </div>

      {/* Filters */}
      <div className="row" style={{marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div style={{position:'relative'}}>
          <Search size={14} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
          <input className="inp" style={{width:200,paddingLeft:32}} placeholder="Search name/city/state..." value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/>
        </div>
        <MultiSelect options={allStatuses} selected={filters.status} onChange={v=>setFilters({...filters,status:v})} placeholder="Status (All)"
          renderOption={s=><StatusBadge status={s}/>}/>
        <MultiSelect options={allZones} selected={filters.zone} onChange={v=>setFilters({...filters,zone:v})} placeholder="Zone (All)"/>
        {allCategories.length>0&&<MultiSelect options={allCategories} selected={filters.category} onChange={v=>setFilters({...filters,category:v})} placeholder="Category (All)"
          renderOption={c=><span style={{fontSize:12,color:'#818cf8'}}>{c}</span>}/>}
        {allCategoryTypes.length>0&&<MultiSelect options={allCategoryTypes} selected={filters.categoryType} onChange={v=>setFilters({...filters,categoryType:v})} placeholder="Cat Type (All)"/>}
        {allCities.length>0&&<MultiSelect options={allCities} selected={filters.city} onChange={v=>setFilters({...filters,city:v})} placeholder="City (All)"/>}
        {allStates.length>0&&<MultiSelect options={allStates} selected={filters.state} onChange={v=>setFilters({...filters,state:v})} placeholder="State (All)"/>}
        {isAdmin&&<MultiSelect options={Object.values(users).filter(u=>u.role==='salesman').map(s=>s.id)} selected={filters.sm}
          onChange={v=>setFilters({...filters,sm:v})} placeholder="Salesman (All)"
          renderOption={id=>{const s=users[id];return s?<div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={s} size={18}/><span style={{fontSize:12}}>{s.name}</span></div>:<span>{id}</span>;}}/>}
        <input className="inp" style={{width:80}} type="number" placeholder="Min %" value={filters.minPct} onChange={e=>setFilters({...filters,minPct:e.target.value})}/>
        <input className="inp" style={{width:80}} type="number" placeholder="Max %" value={filters.maxPct} onChange={e=>setFilters({...filters,maxPct:e.target.value})}/>
        {hasF&&<button onClick={clearFilters} className="btn" style={{color:'var(--red)',fontSize:12}}><X size={12} style={{display:'inline',verticalAlign:'middle'}}/> Clear</button>}
      </div>

      {/* Kanban view */}
      {viewMode==='kanban'&&(
        <div className="card" style={{padding:14,marginBottom:0}}>
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:10}}>
            Drag columns to reorder · Drag cards to change status
          </div>
          <KanbanBoard
            dealers={filtered}
            selectedMonthIdx={selectedMonthIdx}
            users={users}
            onEdit={onEdit}
            onUpdateStatus={onUpdateStatus}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* Table view */}
      {viewMode==='table'&&(
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <div className="scroll" style={{maxHeight:'60vh',overflowY:'auto'}}>
            <table>
              <thead>
                <tr>
                  <th style={{width:30}}><button onClick={toggleAll} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',display:'flex'}}>{selected.length===filtered.length&&filtered.length>0?<CheckSquare size={14}/>:<Square size={14}/>}</button></th>
                  {sh('name','Dealer Name')}
                  {isAdmin&&<th>Salesman</th>}
                  {sh('zone','Zone')}
                  {sh('city','City')}{sh('state','State')}
                  {sh('category','Category')}{sh('categoryType','Cat Type')}
                  {sh('status','Status')}
                  {sh('target','Tgt')}{sh('achieved','Ach')}<th>%</th><th>Trend</th>
                  {sh('avg6m','6m Avg')}
                  {[...MO].map((_,di)=>{const i=MO.length-1-di;return<th key={i} style={{background:i===selectedMonthIdx?'rgba(99,102,241,.08)':'var(--bg1)'}}>{MO[i]}</th>;})}
                  {sh('creditDays','CrD')}{sh('creditLimit','Cr Limit')}
                  <th>Notes</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(x=>{
                  const p=pct(x.target,x.achieved);const tp=trendPct(x.months);const nc=noteCount(x.id);const oc=overdueCount(x.id);
                  return(
                    <tr key={x.id} onClick={()=>onEdit(x.id)} style={{cursor:'pointer',background:selected.includes(x.id)?'var(--accL)':'transparent'}}>
                      <td onClick={e=>{e.stopPropagation();toggleSel(x.id);}}>{selected.includes(x.id)?<CheckSquare size={14} color="var(--acc)"/>:<Square size={14} color="var(--t3)"/>}</td>
                      <td style={{fontWeight:600,color:'var(--t1)',maxWidth:190,overflow:'hidden',textOverflow:'ellipsis'}}>{x.name}</td>
                      {isAdmin&&<td><div style={{display:'flex',alignItems:'center',gap:6}}><Avatar user={users[x.salesman]} size={20}/><span style={{fontSize:12}}>{users[x.salesman]?.name||x.salesman}</span></div></td>}
                      <td style={{fontSize:11,color:'var(--t3)'}}>{x.zone||'—'}</td>
                      <td style={{fontSize:11,color:'var(--t2)'}}>{x.city||'—'}</td>
                      <td style={{fontSize:11,color:'var(--t2)'}}>{x.state||'—'}</td>
                      <td style={{fontSize:11,color:'#818cf8'}}>{x.category||'—'}</td>
                      <td style={{fontSize:11,color:'var(--t3)'}}>{x.categoryType||'—'}</td>
                      <td><StatusBadge status={x.status}/></td>
                      <td style={{textAlign:'right'}}>{x.target||'—'}</td>
                      <td style={{textAlign:'right',fontWeight:600,color:x.achieved>0?'var(--t1)':'var(--t3)'}}>{x.achieved||'—'}</td>
                      <td style={{textAlign:'right',fontWeight:700,color:pclr(p)}}>{spct(x.target,x.achieved)}</td>
                      <td><span style={{fontSize:11,color:tp>0?'#34d399':tp<0?'#f87171':'var(--t3)',display:'flex',alignItems:'center',gap:2}}>{tp>0?<ArrowUpRight size={11}/>:tp<0?<ArrowDownRight size={11}/>:'—'}{tp?Math.abs(tp)+'%':''}</span></td>
                      <td style={{textAlign:'right',color:'var(--t3)'}}>{x.avg6m||'—'}</td>
                      {[...x.months].map((_,di)=>{const i=x.months.length-1-di;const v=x.months[i];return(<td key={i} style={{textAlign:'right',fontSize:12,color:i===selectedMonthIdx?'var(--acc)':v>0?'var(--t2)':'var(--t3)',fontWeight:i===selectedMonthIdx?700:400,background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{v||'—'}</td>);})}
                      <td style={{textAlign:'right',color:'var(--t3)'}}>{x.creditDays?x.creditDays+'d':'—'}</td>
                      <td style={{textAlign:'right',color:'var(--t3)'}}>{fcash(x.creditLimit)}</td>
                      <td onClick={e=>e.stopPropagation()}>{nc>0?<span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:11,color:oc>0?'#fbbf24':'var(--t2)'}}><MessageSquare size={11}/> {nc}{oc>0&&<span style={{color:'#f87171',fontWeight:700}}>!</span>}</span>:<span style={{color:'var(--t3)'}}>—</span>}</td>
                      <td onClick={e=>e.stopPropagation()}>
                        <div style={{display:'flex',gap:5}}>
                          <button className="btne" onClick={e=>{e.stopPropagation();onEdit(x.id);}}>Open</button>
                          {isAdmin&&<button className="btnd" onClick={e=>{e.stopPropagation();onDelete(x.id);}}><Trash2 size={11}/></button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length===0&&<tr><td colSpan="30" style={{textAlign:'center',color:'var(--t3)',padding:40}}>No dealers match your filters</td></tr>}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={isAdmin?8:7} style={{color:'var(--t1)'}}>TOTAL</td>
                  <td style={{textAlign:'right'}}>{tt}</td>
                  <td style={{textAlign:'right',color:'#34d399'}}>{ta}</td>
                  <td style={{textAlign:'right',color:pclr(pct(tt,ta))}}>{spct(tt,ta)}</td>
                  <td colSpan="2"/>
                  {[...MO].map((_,di)=>{const i=MO.length-1-di;const s=filtered.reduce((a,x)=>a+(x.months[i]||0),0);return<td key={i} style={{textAlign:'right',color:i===selectedMonthIdx?'var(--acc)':'var(--t1)',background:i===selectedMonthIdx?'rgba(99,102,241,.05)':'transparent'}}>{s||''}</td>;})}
                  <td colSpan="4"/>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealersList;