// // import React, { useState, useRef, useEffect } from 'react';
// // import { X, ChevronDown } from 'lucide-react';
// // import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
// // import { useMonth } from '../context';
// // import { pclr } from '../utils';

// // export const StatusBadge = ({status}) => {
// //   const t=(status||'').toUpperCase();
// //   let bg,cl;
// //   if(t==='ACTIVE'||t==='ACHIVERS'||t==='ACHIEVERS'){bg='rgba(52,211,153,0.12)';cl='#34d399';}
// //   else if(t==='KEY ACCOUNT'){bg='rgba(167,139,250,0.12)';cl='#a78bfa';}
// //   else if(t.includes('INACTIVE')){bg='rgba(251,191,36,0.12)';cl='#fbbf24';}
// //   else if(t==='DEAD'){bg='rgba(248,113,113,0.12)';cl='#f87171';}
// //   else{bg='rgba(255,255,255,.05)';cl='var(--t3)';}
// //   return(<span style={{background:bg,color:cl,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:cl}}/>{status||'—'}</span>);
// // };

// // export const Avatar = ({user,size=28}) => {
// //   if(!user)return null;
// //   return(<div style={{width:size,height:size,borderRadius:'50%',background:user.color+'22',color:user.color,border:`1px solid ${user.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.round(size*0.36),fontWeight:600,flexShrink:0}}>{user.ini}</div>);
// // };

// // export const MiniBars = ({months,highlightIdx}) => {
// //   const hi=highlightIdx!==undefined?highlightIdx:CURRENT_MONTH_IDX;
// //   const mx=Math.max(...months,1);
// //   return(<div style={{display:'flex',gap:2,alignItems:'flex-end',height:28,minWidth:70}}>{months.map((v,i)=>(<div key={i} style={{flex:1,height:Math.max((v/mx)*26,v>0?2:0),background:i===hi?'var(--acc)':'var(--b2)',borderRadius:'1px 1px 0 0'}}/>))}</div>);
// // };

// // export const KPI = ({label,value,color='var(--t1)',sub}) => (
// //   <div style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
// //     <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{label}</div>
// //     <div style={{fontSize:18,fontWeight:700,color}}>{value}</div>
// //     {sub&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{sub}</div>}
// //   </div>
// // );

// // export const StatCard = ({label,value,sub,valueColor='var(--t1)',progress,icon:Icon}) => (
// //   <div className="stat-card">
// //     <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
// //       <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
// //       {Icon&&<Icon size={14} color="var(--t3)"/>}
// //     </div>
// //     <div style={{fontSize:24,fontWeight:700,color:valueColor,lineHeight:1.1}}>{value}</div>
// //     {sub&&<div style={{fontSize:11,color:'var(--t3)',marginTop:4}}>{sub}</div>}
// //     {progress!==undefined&&(<div style={{height:6,background:'var(--b1)',borderRadius:3,marginTop:10,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(progress||0,100)}%`,background:pclr(progress),borderRadius:3,transition:'width 1s ease'}}/></div>)}
// //   </div>
// // );

// // export const MultiSelect = ({options,selected,onChange,placeholder='Select...',renderOption}) => {
// //   const [open,setOpen]=useState(false);
// //   const ref=useRef();
// //   useEffect(()=>{
// //     const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
// //     document.addEventListener('mousedown',h);
// //     return()=>document.removeEventListener('mousedown',h);
// //   },[]);
// //   const toggle=(v)=>onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
// //   const label=selected.length===0?placeholder:selected.length===1?selected[0]:`${selected.length} selected`;
// //   return(
// //     <div ref={ref} style={{position:'relative',display:'inline-block',flexShrink:0}}>
// //       <button onClick={()=>setOpen(o=>!o)} className="btn" style={{fontSize:12,minWidth:130,display:'flex',alignItems:'center',gap:5,justifyContent:'space-between',padding:'7px 10px'}}>
// //         <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:110}}>{label}</span>
// //         <div style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
// //           {selected.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'0 5px',fontSize:10,fontWeight:700,lineHeight:'16px'}}>{selected.length}</span>}
// //           <ChevronDown size={10}/>
// //         </div>
// //       </button>
// //       {open&&(
// //         <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:'var(--bg1)',border:'1px solid var(--b2)',borderRadius:8,zIndex:500,minWidth:180,maxHeight:260,overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
// //           {selected.length>0&&(<div onClick={()=>onChange([])} style={{padding:'7px 12px',fontSize:11,color:'var(--red)',cursor:'pointer',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:4,userSelect:'none'}}><X size={10}/> Clear all</div>)}
// //           {options.map(opt=>{
// //             const isChk=selected.includes(opt);
// //             return(
// //               <label key={opt} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',cursor:'pointer',background:isChk?'var(--accL)':'transparent',transition:'background .1s',userSelect:'none'}}>
// //                 <input type="checkbox" checked={isChk} onChange={()=>toggle(opt)} style={{accentColor:'var(--acc)',flexShrink:0}}/>
// //                 {renderOption?renderOption(opt):<span style={{fontSize:12,color:isChk?'var(--acc)':'var(--t2)'}}>{opt}</span>}
// //               </label>
// //             );
// //           })}
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export const MonthSelectorBar = ({selectedMonthIdx,setSelectedMonthIdx}) => {
// //   const { MO:ctxMO, currentMonthIdx } = useMonth();
// //   const MO = ctxMO || MO_CONST;
// //   const curIdx = currentMonthIdx ?? CURRENT_MONTH_IDX;
// //   return (
// //   <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'var(--bg1)',borderBottom:'1px solid var(--b1)',overflowX:'auto',flexShrink:0}}>
// //     <span style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.12em',whiteSpace:'nowrap',marginRight:4}}>Viewing:</span>
// //     {MO.map((m,i)=>(
// //       <button key={m} onClick={()=>setSelectedMonthIdx(i)} style={{padding:'4px 12px',borderRadius:6,border:selectedMonthIdx===i?'1px solid var(--acc)':'1px solid var(--b2)',background:selectedMonthIdx===i?'var(--accL)':'var(--bg2)',color:selectedMonthIdx===i?'var(--acc)':i===curIdx?'var(--t2)':'var(--t3)',fontWeight:selectedMonthIdx===i?700:i===curIdx?600:400,fontSize:11,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',flexShrink:0,position:'relative'}}>
// //         {m}{i===curIdx&&<span style={{position:'absolute',top:-3,right:-3,width:6,height:6,background:'#34d399',borderRadius:'50%'}}/>}
// //       </button>
// //     ))}
// //     {selectedMonthIdx!==curIdx&&(<button onClick={()=>setSelectedMonthIdx(curIdx)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #34d39944',background:'rgba(52,211,153,0.1)',color:'#34d399',fontSize:11,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>→ Current</button>)}
// //   </div>
// //   );
// // };

// // export const SkeletonLoader = () => (
// //   <div className="fade" style={{padding:'4px 0'}}>
// //     {/* Header skeleton */}
// //     <div style={{marginBottom:24}}>
// //       <div className="skel" style={{height:10,width:100,marginBottom:10,borderRadius:4}}/>
// //       <div className="skel" style={{height:26,width:280,marginBottom:8,borderRadius:6}}/>
// //       <div style={{display:'flex',gap:8}}>
// //         <div className="skel" style={{height:20,width:70,borderRadius:10}}/>
// //         <div className="skel" style={{height:20,width:90,borderRadius:10}}/>
// //         <div className="skel" style={{height:20,width:60,borderRadius:10}}/>
// //       </div>
// //     </div>

// //     {/* Stat cards */}
// //     <div className="stat-grid" style={{marginBottom:20}}>
// //       {[1,2,3,4].map(i=>(
// //         <div key={i} className="card" style={{padding:16}}>
// //           <div className="skel" style={{height:9,width:70,marginBottom:12,borderRadius:4}}/>
// //           <div className="skel" style={{height:30,width:80,marginBottom:10,borderRadius:6}}/>
// //           <div className="skel" style={{height:8,width:'80%',marginBottom:8,borderRadius:4}}/>
// //           <div className="skel" style={{height:4,width:'100%',borderRadius:2}}/>
// //         </div>
// //       ))}
// //     </div>

// //     {/* Insight chips */}
// //     <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
// //       {[120,150,110,130,100].map((w,i)=>(
// //         <div key={i} className="skel" style={{height:28,width:w,borderRadius:14}}/>
// //       ))}
// //     </div>

// //     {/* Chart area */}
// //     <div className="card" style={{marginBottom:16,padding:20}}>
// //       <div className="skel" style={{height:10,width:160,marginBottom:20,borderRadius:4}}/>
// //       <div style={{display:'flex',alignItems:'flex-end',gap:6,height:120}}>
// //         {[60,80,50,90,70,110,85,95,65,100,75].map((h,i)=>(
// //           <div key={i} className="skel" style={{flex:1,height:`${h}%`,borderRadius:'4px 4px 0 0'}}/>
// //         ))}
// //       </div>
// //       <div style={{display:'flex',gap:6,marginTop:8}}>
// //         {[1,2,3,4,5,6,7,8,9,10,11].map(i=>(
// //           <div key={i} className="skel" style={{flex:1,height:8,borderRadius:4}}/>
// //         ))}
// //       </div>
// //     </div>

// //     {/* Table skeleton */}
// //     <div className="card" style={{padding:0,overflow:'hidden'}}>
// //       <div style={{padding:'12px 16px',borderBottom:'1px solid var(--b1)',display:'flex',gap:10}}>
// //         {[200,100,80,80,80,60].map((w,i)=>(
// //           <div key={i} className="skel" style={{height:10,width:w,borderRadius:4}}/>
// //         ))}
// //       </div>
// //       {[1,2,3,4,5].map(i=>(
// //         <div key={i} style={{padding:'12px 16px',borderBottom:'1px solid var(--b2)',display:'flex',alignItems:'center',gap:10}}>
// //           <div className="skel" style={{width:18,height:18,borderRadius:'50%',flexShrink:0}}/>
// //           <div className="skel" style={{height:10,flex:2,maxWidth:220,borderRadius:4}}/>
// //           <div className="skel" style={{height:10,flex:1,maxWidth:80,borderRadius:4}}/>
// //           <div className="skel" style={{height:10,flex:1,maxWidth:60,borderRadius:4}}/>
// //           <div className="skel" style={{height:10,flex:1,maxWidth:60,borderRadius:4}}/>
// //           <div className="skel" style={{height:18,width:50,borderRadius:8}}/>
// //         </div>
// //       ))}
// //     </div>

// //     {/* Centered loading text */}
// //     <div style={{textAlign:'center',marginTop:32,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
// //       <div style={{display:'flex',gap:6}}>
// //         {[0,1,2].map(i=>(
// //           <div key={i} style={{width:8,height:8,borderRadius:'50%',background:'var(--acc)',
// //             animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`,opacity:0.7}}/>
// //         ))}
// //       </div>
// //       <div style={{fontSize:12,color:'var(--t3)'}}>Syncing from Google Sheets...</div>
// //     </div>

// //     <style>{`
// //       @keyframes bounce {
// //         0%,80%,100%{transform:translateY(0)}
// //         40%{transform:translateY(-8px)}
// //       }
// //     `}</style>
// //   </div>
// // );

// import React, { useState, useRef, useEffect } from 'react';
// import { X, ChevronDown } from 'lucide-react';
// import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
// import { useMonth } from '../context';
// import { pclr } from '../utils';

// export const StatusBadge = ({status}) => {
//   const t=(status||'').toUpperCase();
//   let bg,cl;
//   if(t==='ACTIVE'||t==='ACHIVERS'||t==='ACHIEVERS'){bg='rgba(52,211,153,0.12)';cl='#34d399';}
//   else if(t==='KEY ACCOUNT'){bg='rgba(167,139,250,0.12)';cl='#a78bfa';}
//   else if(t.includes('INACTIVE')){bg='rgba(251,191,36,0.12)';cl='#fbbf24';}
//   else if(t==='DEAD'){bg='rgba(248,113,113,0.12)';cl='#f87171';}
//   else{bg='rgba(255,255,255,.05)';cl='var(--t3)';}
//   return(<span style={{background:bg,color:cl,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:cl}}/>{status||'—'}</span>);
// };

// export const Avatar = ({user,size=28}) => {
//   if(!user)return null;
//   return(<div style={{width:size,height:size,borderRadius:'50%',background:user.color+'22',color:user.color,border:`1px solid ${user.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.round(size*0.36),fontWeight:600,flexShrink:0}}>{user.ini}</div>);
// };

// export const MiniBars = ({months,highlightIdx}) => {
//   const hi=highlightIdx!==undefined?highlightIdx:CURRENT_MONTH_IDX;
//   const mx=Math.max(...months,1);
//   return(<div style={{display:'flex',gap:2,alignItems:'flex-end',height:28,minWidth:70}}>{months.map((v,i)=>(<div key={i} style={{flex:1,height:Math.max((v/mx)*26,v>0?2:0),background:i===hi?'var(--acc)':'var(--b2)',borderRadius:'1px 1px 0 0'}}/>))}</div>);
// };

// export const KPI = ({label,value,color='var(--t1)',sub}) => (
//   <div style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
//     <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{label}</div>
//     <div style={{fontSize:18,fontWeight:700,color}}>{value}</div>
//     {sub&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{sub}</div>}
//   </div>
// );

// export const StatCard = ({label,value,sub,valueColor='var(--t1)',progress,icon:Icon}) => (
//   <div className="stat-card">
//     <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
//       <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
//       {Icon&&<Icon size={14} color="var(--t3)"/>}
//     </div>
//     <div style={{fontSize:24,fontWeight:700,color:valueColor,lineHeight:1.1}}>{value}</div>
//     {sub&&<div style={{fontSize:11,color:'var(--t3)',marginTop:4}}>{sub}</div>}
//     {progress!==undefined&&(<div style={{height:6,background:'var(--b1)',borderRadius:3,marginTop:10,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(progress||0,100)}%`,background:pclr(progress),borderRadius:3,transition:'width 1s ease'}}/></div>)}
//   </div>
// );

// export const MultiSelect = ({options,selected,onChange,placeholder='Select...',renderOption}) => {
//   const [open,setOpen]=useState(false);
//   const ref=useRef();
//   useEffect(()=>{
//     const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
//     document.addEventListener('mousedown',h);
//     return()=>document.removeEventListener('mousedown',h);
//   },[]);
//   const toggle=(v)=>onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
//   const label=selected.length===0?placeholder:selected.length===1?selected[0]:`${selected.length} selected`;
//   return(
//     <div ref={ref} style={{position:'relative',display:'inline-block',flexShrink:0}}>
//       <button onClick={()=>setOpen(o=>!o)} className="btn" style={{fontSize:12,minWidth:130,display:'flex',alignItems:'center',gap:5,justifyContent:'space-between',padding:'7px 10px'}}>
//         <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:110}}>{label}</span>
//         <div style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
//           {selected.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'0 5px',fontSize:10,fontWeight:700,lineHeight:'16px'}}>{selected.length}</span>}
//           <ChevronDown size={10}/>
//         </div>
//       </button>
//       {open&&(
//         <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:'var(--bg1)',border:'1px solid var(--b2)',borderRadius:8,zIndex:500,minWidth:180,maxHeight:260,overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
//           {selected.length>0&&(<div onClick={()=>onChange([])} style={{padding:'7px 12px',fontSize:11,color:'var(--red)',cursor:'pointer',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:4,userSelect:'none'}}><X size={10}/> Clear all</div>)}
//           {options.map(opt=>{
//             const isChk=selected.includes(opt);
//             return(
//               <label key={opt} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',cursor:'pointer',background:isChk?'var(--accL)':'transparent',transition:'background .1s',userSelect:'none'}}>
//                 <input type="checkbox" checked={isChk} onChange={()=>toggle(opt)} style={{accentColor:'var(--acc)',flexShrink:0}}/>
//                 {renderOption?renderOption(opt):<span style={{fontSize:12,color:isChk?'var(--acc)':'var(--t2)'}}>{opt}</span>}
//               </label>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// // Skeleton base block
// const Sk = ({w='100%',h=12,r=6,mb=0}) => (
//   <div className="skel" style={{height:h,width:w,borderRadius:r,marginBottom:mb,flexShrink:0}}/>
// );

// export const SkeletonLoader = ({ screen='overview' }) => {
//   const StatCards = () => (
//     <div className="stat-grid" style={{marginBottom:20}}>
//       {[1,2,3,4].map(i=>(
//         <div key={i} className="card" style={{padding:16}}>
//           <Sk w={70} h={9} mb={12}/>
//           <Sk w={90} h={32} mb={10}/>
//           <Sk w="80%" h={8} mb={8}/>
//           <Sk h={4}/>
//         </div>
//       ))}
//     </div>
//   );

//   const Header = ({titleW=220,subtitleW=140}) => (
//     <div style={{marginBottom:22}}>
//       <Sk w={90} h={9} mb={10}/>
//       <Sk w={titleW} h={28} mb={8}/>
//       <Sk w={subtitleW} h={12}/>
//     </div>
//   );

//   const TableRows = ({rows=6,cols=5}) => (
//     <div className="card" style={{padding:0,overflow:'hidden'}}>
//       <div style={{padding:'10px 14px',borderBottom:'1px solid var(--b1)'}}>
//         <Sk w={160} h={10}/>
//       </div>
//       {Array.from({length:rows}).map((_,ri)=>(
//         <div key={ri} style={{display:'grid',gridTemplateColumns:`2fr ${Array(cols-1).fill('1fr').join(' ')}`,gap:12,padding:'10px 14px',borderBottom:'1px solid var(--b1)'}}>
//           {Array.from({length:cols}).map((_,ci)=>(
//             <Sk key={ci} w={ci===0?'90%':'70%'} h={ci===0?12:10}/>
//           ))}
//         </div>
//       ))}
//     </div>
//   );

//   const ChipRow = () => (
//     <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
//       {[100,130,110,140,90,120].map((w,i)=>(
//         <div key={i} className="skel" style={{height:28,width:w,borderRadius:14}}/>
//       ))}
//     </div>
//   );

//   return (
//     <div className="fade" style={{padding:'4px 0'}}>
//       <Header/>
//       <StatCards/>
//       {(screen==='dealers'||screen==='outstanding'||screen==='entry') ? (
//         <>
//           <ChipRow/>
//           <TableRows rows={8} cols={screen==='outstanding'?6:5}/>
//         </>
//       ) : screen==='monthly' ? (
//         <div className="card" style={{height:280,display:'flex',alignItems:'flex-end',gap:6,padding:20}}>
//           {Array.from({length:11}).map((_,i)=>(
//             <div key={i} style={{flex:1,display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
//               <div className="skel" style={{width:'100%',height:Math.random()*160+40,borderRadius:'4px 4px 0 0'}}/>
//               <div className="skel" style={{width:28,height:8,borderRadius:4}}/>
//             </div>
//           ))}
//         </div>
//       ) : screen==='compare' ? (
//         <>
//           <ChipRow/>
//           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
//             {[1,2].map(i=><div key={i} className="card" style={{height:200}}><Sk h={12} w={120} mb={16}/><div style={{height:160}} className="skel" /></div>)}
//           </div>
//         </>
//       ) : screen==='map' ? (
//         <div className="card skel" style={{height:420}}/>
//       ) : screen==='followups' ? (
//         <>
//           <ChipRow/>
//           {[1,2,3,4,5].map(i=>(
//             <div key={i} className="card" style={{marginBottom:10,display:'flex',gap:12,alignItems:'center'}}>
//               <div className="skel" style={{width:16,height:16,borderRadius:4,flexShrink:0}}/>
//               <div style={{flex:1}}>
//                 <Sk w={180} h={12} mb={6}/>
//                 <Sk w={120} h={9}/>
//               </div>
//               <Sk w={60} h={22} r={10}/>
//             </div>
//           ))}
//         </>
//       ) : (
//         // overview default
//         <>
//           <ChipRow/>
//           <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
//             <div className="card skel" style={{height:200}}/>
//             <div className="card skel" style={{height:200}}/>
//           </div>
//           <TableRows rows={5} cols={4}/>
//         </>
//       )}
//     </div>
//   );
// };

// export const MonthSelectorBar = ({selectedMonthIdx,setSelectedMonthIdx}) => {
//   const { MO:ctxMO, currentMonthIdx } = useMonth();
//   const MO = ctxMO || MO_CONST;
//   const curIdx = currentMonthIdx ?? CURRENT_MONTH_IDX;
//   return (
//   <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'var(--bg1)',borderBottom:'1px solid var(--b1)',overflowX:'auto',flexShrink:0}}>
//     <span style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.12em',whiteSpace:'nowrap',marginRight:4}}>Viewing:</span>
//     {MO.map((m,i)=>(
//       <button key={m} onClick={()=>setSelectedMonthIdx(i)} style={{padding:'4px 12px',borderRadius:6,border:selectedMonthIdx===i?'1px solid var(--acc)':'1px solid var(--b2)',background:selectedMonthIdx===i?'var(--accL)':'var(--bg2)',color:selectedMonthIdx===i?'var(--acc)':i===curIdx?'var(--t2)':'var(--t3)',fontWeight:selectedMonthIdx===i?700:i===curIdx?600:400,fontSize:11,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',flexShrink:0,position:'relative'}}>
//         {m}{i===curIdx&&<span style={{position:'absolute',top:-3,right:-3,width:6,height:6,background:'#34d399',borderRadius:'50%'}}/>}
//       </button>
//     ))}
//     {selectedMonthIdx!==curIdx&&(<button onClick={()=>setSelectedMonthIdx(curIdx)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #34d39944',background:'rgba(52,211,153,0.1)',color:'#34d399',fontSize:11,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>→ Current</button>)}
//   </div>
//   );
// };

// import React, { useState, useRef, useEffect } from 'react';
// import { X, ChevronDown } from 'lucide-react';
// import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
// import { useMonth } from '../context';
// import { pclr } from '../utils';

// export const StatusBadge = ({status}) => {
//   const t=(status||'').toUpperCase();
//   let bg,cl;
//   if(t==='ACTIVE'||t==='ACHIVERS'||t==='ACHIEVERS'){bg='rgba(52,211,153,0.12)';cl='#34d399';}
//   else if(t==='KEY ACCOUNT'){bg='rgba(167,139,250,0.12)';cl='#a78bfa';}
//   else if(t.includes('INACTIVE')){bg='rgba(251,191,36,0.12)';cl='#fbbf24';}
//   else if(t==='DEAD'){bg='rgba(248,113,113,0.12)';cl='#f87171';}
//   else{bg='rgba(255,255,255,.05)';cl='var(--t3)';}
//   return(<span style={{background:bg,color:cl,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:cl}}/>{status||'—'}</span>);
// };

// export const Avatar = ({user,size=28}) => {
//   if(!user)return null;
//   return(<div style={{width:size,height:size,borderRadius:'50%',background:user.color+'22',color:user.color,border:`1px solid ${user.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.round(size*0.36),fontWeight:600,flexShrink:0}}>{user.ini}</div>);
// };

// export const MiniBars = ({months,highlightIdx}) => {
//   const hi=highlightIdx!==undefined?highlightIdx:CURRENT_MONTH_IDX;
//   const mx=Math.max(...months,1);
//   return(<div style={{display:'flex',gap:2,alignItems:'flex-end',height:28,minWidth:70}}>{months.map((v,i)=>(<div key={i} style={{flex:1,height:Math.max((v/mx)*26,v>0?2:0),background:i===hi?'var(--acc)':'var(--b2)',borderRadius:'1px 1px 0 0'}}/>))}</div>);
// };

// export const KPI = ({label,value,color='var(--t1)',sub}) => (
//   <div style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
//     <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{label}</div>
//     <div style={{fontSize:18,fontWeight:700,color}}>{value}</div>
//     {sub&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{sub}</div>}
//   </div>
// );

// export const StatCard = ({label,value,sub,valueColor='var(--t1)',progress,icon:Icon}) => (
//   <div className="stat-card">
//     <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
//       <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
//       {Icon&&<Icon size={14} color="var(--t3)"/>}
//     </div>
//     <div style={{fontSize:24,fontWeight:700,color:valueColor,lineHeight:1.1}}>{value}</div>
//     {sub&&<div style={{fontSize:11,color:'var(--t3)',marginTop:4}}>{sub}</div>}
//     {progress!==undefined&&(<div style={{height:6,background:'var(--b1)',borderRadius:3,marginTop:10,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(progress||0,100)}%`,background:pclr(progress),borderRadius:3,transition:'width 1s ease'}}/></div>)}
//   </div>
// );

// export const MultiSelect = ({options,selected,onChange,placeholder='Select...',renderOption}) => {
//   const [open,setOpen]=useState(false);
//   const ref=useRef();
//   useEffect(()=>{
//     const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
//     document.addEventListener('mousedown',h);
//     return()=>document.removeEventListener('mousedown',h);
//   },[]);
//   const toggle=(v)=>onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
//   const label=selected.length===0?placeholder:selected.length===1?selected[0]:`${selected.length} selected`;
//   return(
//     <div ref={ref} style={{position:'relative',display:'inline-block',flexShrink:0}}>
//       <button onClick={()=>setOpen(o=>!o)} className="btn" style={{fontSize:12,minWidth:130,display:'flex',alignItems:'center',gap:5,justifyContent:'space-between',padding:'7px 10px'}}>
//         <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:110}}>{label}</span>
//         <div style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
//           {selected.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'0 5px',fontSize:10,fontWeight:700,lineHeight:'16px'}}>{selected.length}</span>}
//           <ChevronDown size={10}/>
//         </div>
//       </button>
//       {open&&(
//         <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:'var(--bg1)',border:'1px solid var(--b2)',borderRadius:8,zIndex:500,minWidth:180,maxHeight:260,overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
//           {selected.length>0&&(<div onClick={()=>onChange([])} style={{padding:'7px 12px',fontSize:11,color:'var(--red)',cursor:'pointer',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:4,userSelect:'none'}}><X size={10}/> Clear all</div>)}
//           {options.map(opt=>{
//             const isChk=selected.includes(opt);
//             return(
//               <label key={opt} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',cursor:'pointer',background:isChk?'var(--accL)':'transparent',transition:'background .1s',userSelect:'none'}}>
//                 <input type="checkbox" checked={isChk} onChange={()=>toggle(opt)} style={{accentColor:'var(--acc)',flexShrink:0}}/>
//                 {renderOption?renderOption(opt):<span style={{fontSize:12,color:isChk?'var(--acc)':'var(--t2)'}}>{opt}</span>}
//               </label>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export const MonthSelectorBar = ({selectedMonthIdx,setSelectedMonthIdx}) => {
//   const { MO:ctxMO, currentMonthIdx } = useMonth();
//   const MO = ctxMO || MO_CONST;
//   const curIdx = currentMonthIdx ?? CURRENT_MONTH_IDX;
//   return (
//   <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'var(--bg1)',borderBottom:'1px solid var(--b1)',overflowX:'auto',flexShrink:0}}>
//     <span style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.12em',whiteSpace:'nowrap',marginRight:4}}>Viewing:</span>
//     {MO.map((m,i)=>(
//       <button key={m} onClick={()=>setSelectedMonthIdx(i)} style={{padding:'4px 12px',borderRadius:6,border:selectedMonthIdx===i?'1px solid var(--acc)':'1px solid var(--b2)',background:selectedMonthIdx===i?'var(--accL)':'var(--bg2)',color:selectedMonthIdx===i?'var(--acc)':i===curIdx?'var(--t2)':'var(--t3)',fontWeight:selectedMonthIdx===i?700:i===curIdx?600:400,fontSize:11,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',flexShrink:0,position:'relative'}}>
//         {m}{i===curIdx&&<span style={{position:'absolute',top:-3,right:-3,width:6,height:6,background:'#34d399',borderRadius:'50%'}}/>}
//       </button>
//     ))}
//     {selectedMonthIdx!==curIdx&&(<button onClick={()=>setSelectedMonthIdx(curIdx)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #34d39944',background:'rgba(52,211,153,0.1)',color:'#34d399',fontSize:11,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>→ Current</button>)}
//   </div>
//   );
// };

// export const SkeletonLoader = () => (
//   <div className="fade" style={{padding:'4px 0'}}>
//     {/* Header skeleton */}
//     <div style={{marginBottom:24}}>
//       <div className="skel" style={{height:10,width:100,marginBottom:10,borderRadius:4}}/>
//       <div className="skel" style={{height:26,width:280,marginBottom:8,borderRadius:6}}/>
//       <div style={{display:'flex',gap:8}}>
//         <div className="skel" style={{height:20,width:70,borderRadius:10}}/>
//         <div className="skel" style={{height:20,width:90,borderRadius:10}}/>
//         <div className="skel" style={{height:20,width:60,borderRadius:10}}/>
//       </div>
//     </div>

//     {/* Stat cards */}
//     <div className="stat-grid" style={{marginBottom:20}}>
//       {[1,2,3,4].map(i=>(
//         <div key={i} className="card" style={{padding:16}}>
//           <div className="skel" style={{height:9,width:70,marginBottom:12,borderRadius:4}}/>
//           <div className="skel" style={{height:30,width:80,marginBottom:10,borderRadius:6}}/>
//           <div className="skel" style={{height:8,width:'80%',marginBottom:8,borderRadius:4}}/>
//           <div className="skel" style={{height:4,width:'100%',borderRadius:2}}/>
//         </div>
//       ))}
//     </div>

//     {/* Insight chips */}
//     <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
//       {[120,150,110,130,100].map((w,i)=>(
//         <div key={i} className="skel" style={{height:28,width:w,borderRadius:14}}/>
//       ))}
//     </div>

//     {/* Chart area */}
//     <div className="card" style={{marginBottom:16,padding:20}}>
//       <div className="skel" style={{height:10,width:160,marginBottom:20,borderRadius:4}}/>
//       <div style={{display:'flex',alignItems:'flex-end',gap:6,height:120}}>
//         {[60,80,50,90,70,110,85,95,65,100,75].map((h,i)=>(
//           <div key={i} className="skel" style={{flex:1,height:`${h}%`,borderRadius:'4px 4px 0 0'}}/>
//         ))}
//       </div>
//       <div style={{display:'flex',gap:6,marginTop:8}}>
//         {[1,2,3,4,5,6,7,8,9,10,11].map(i=>(
//           <div key={i} className="skel" style={{flex:1,height:8,borderRadius:4}}/>
//         ))}
//       </div>
//     </div>

//     {/* Table skeleton */}
//     <div className="card" style={{padding:0,overflow:'hidden'}}>
//       <div style={{padding:'12px 16px',borderBottom:'1px solid var(--b1)',display:'flex',gap:10}}>
//         {[200,100,80,80,80,60].map((w,i)=>(
//           <div key={i} className="skel" style={{height:10,width:w,borderRadius:4}}/>
//         ))}
//       </div>
//       {[1,2,3,4,5].map(i=>(
//         <div key={i} style={{padding:'12px 16px',borderBottom:'1px solid var(--b2)',display:'flex',alignItems:'center',gap:10}}>
//           <div className="skel" style={{width:18,height:18,borderRadius:'50%',flexShrink:0}}/>
//           <div className="skel" style={{height:10,flex:2,maxWidth:220,borderRadius:4}}/>
//           <div className="skel" style={{height:10,flex:1,maxWidth:80,borderRadius:4}}/>
//           <div className="skel" style={{height:10,flex:1,maxWidth:60,borderRadius:4}}/>
//           <div className="skel" style={{height:10,flex:1,maxWidth:60,borderRadius:4}}/>
//           <div className="skel" style={{height:18,width:50,borderRadius:8}}/>
//         </div>
//       ))}
//     </div>

//     {/* Centered loading text */}
//     <div style={{textAlign:'center',marginTop:32,display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
//       <div style={{display:'flex',gap:6}}>
//         {[0,1,2].map(i=>(
//           <div key={i} style={{width:8,height:8,borderRadius:'50%',background:'var(--acc)',
//             animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`,opacity:0.7}}/>
//         ))}
//       </div>
//       <div style={{fontSize:12,color:'var(--t3)'}}>Syncing from Google Sheets...</div>
//     </div>

//     <style>{`
//       @keyframes bounce {
//         0%,80%,100%{transform:translateY(0)}
//         40%{transform:translateY(-8px)}
//       }
//     `}</style>
//   </div>
// );

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
import { useMonth } from '../context';
import { pclr } from '../utils';

export const StatusBadge = ({status}) => {
  const t=(status||'').toUpperCase();
  let bg,cl;
  if(t==='ACTIVE'||t==='ACHIVERS'||t==='ACHIEVERS'){bg='rgba(52,211,153,0.12)';cl='#34d399';}
  else if(t==='KEY ACCOUNT'){bg='rgba(167,139,250,0.12)';cl='#a78bfa';}
  else if(t.includes('INACTIVE')){bg='rgba(251,191,36,0.12)';cl='#fbbf24';}
  else if(t==='DEAD'){bg='rgba(248,113,113,0.12)';cl='#f87171';}
  else{bg='rgba(255,255,255,.05)';cl='var(--t3)';}
  return(<span style={{background:bg,color:cl,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}><span style={{width:6,height:6,borderRadius:'50%',background:cl}}/>{status||'—'}</span>);
};

export const Avatar = ({user,size=28}) => {
  if(!user)return null;
  return(<div style={{width:size,height:size,borderRadius:'50%',background:user.color+'22',color:user.color,border:`1px solid ${user.color}44`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:Math.round(size*0.36),fontWeight:600,flexShrink:0}}>{user.ini}</div>);
};

export const MiniBars = ({months,highlightIdx}) => {
  const hi=highlightIdx!==undefined?highlightIdx:CURRENT_MONTH_IDX;
  const mx=Math.max(...months,1);
  return(<div style={{display:'flex',gap:2,alignItems:'flex-end',height:28,minWidth:70}}>{months.map((v,i)=>(<div key={i} style={{flex:1,height:Math.max((v/mx)*26,v>0?2:0),background:i===hi?'var(--acc)':'var(--b2)',borderRadius:'1px 1px 0 0'}}/>))}</div>);
};

export const KPI = ({label,value,color='var(--t1)',sub}) => (
  <div style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}>
    <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{label}</div>
    <div style={{fontSize:18,fontWeight:700,color}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>{sub}</div>}
  </div>
);

export const StatCard = ({label,value,sub,valueColor='var(--t1)',progress,icon:Icon}) => (
  <div className="stat-card">
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
      <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>{label}</div>
      {Icon&&<Icon size={14} color="var(--t3)"/>}
    </div>
    <div style={{fontSize:24,fontWeight:700,color:valueColor,lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:'var(--t3)',marginTop:4}}>{sub}</div>}
    {progress!==undefined&&(<div style={{height:6,background:'var(--b1)',borderRadius:3,marginTop:10,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.min(progress||0,100)}%`,background:pclr(progress),borderRadius:3,transition:'width 1s ease'}}/></div>)}
  </div>
);

export const MultiSelect = ({options,selected,onChange,placeholder='Select...',renderOption}) => {
  const [open,setOpen]=useState(false);
  const ref=useRef();
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',h);
    return()=>document.removeEventListener('mousedown',h);
  },[]);
  const toggle=(v)=>onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
  const label=selected.length===0?placeholder:selected.length===1?selected[0]:`${selected.length} selected`;
  return(
    <div ref={ref} style={{position:'relative',display:'inline-block',flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} className="btn" style={{fontSize:12,minWidth:130,display:'flex',alignItems:'center',gap:5,justifyContent:'space-between',padding:'7px 10px'}}>
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:110}}>{label}</span>
        <div style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
          {selected.length>0&&<span style={{background:'var(--acc)',color:'#fff',borderRadius:8,padding:'0 5px',fontSize:10,fontWeight:700,lineHeight:'16px'}}>{selected.length}</span>}
          <ChevronDown size={10}/>
        </div>
      </button>
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:'var(--bg1)',border:'1px solid var(--b2)',borderRadius:8,zIndex:500,minWidth:180,maxHeight:260,overflowY:'auto',boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
          {selected.length>0&&(<div onClick={()=>onChange([])} style={{padding:'7px 12px',fontSize:11,color:'var(--red)',cursor:'pointer',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:4,userSelect:'none'}}><X size={10}/> Clear all</div>)}
          {options.map(opt=>{
            const isChk=selected.includes(opt);
            return(
              <label key={opt} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 12px',cursor:'pointer',background:isChk?'var(--accL)':'transparent',transition:'background .1s',userSelect:'none'}}>
                <input type="checkbox" checked={isChk} onChange={()=>toggle(opt)} style={{accentColor:'var(--acc)',flexShrink:0}}/>
                {renderOption?renderOption(opt):<span style={{fontSize:12,color:isChk?'var(--acc)':'var(--t2)'}}>{opt}</span>}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ── Full screen loading overlay ──────────────────────────────────────────────
export const LoadingScreen = ({ message='Loading...' }) => (
  <div style={{
    position:'fixed', inset:0, background:'var(--bg1)',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    zIndex:9999, gap:20,
  }}>
    <div style={{position:'relative', width:56, height:56}}>
      <div style={{
        position:'absolute', inset:0, borderRadius:'50%',
        border:'3px solid var(--b2)',
        borderTopColor:'var(--acc)',
        animation:'spin .8s linear infinite',
      }}/>
      <div style={{
        position:'absolute', inset:6, borderRadius:'50%',
        border:'3px solid var(--b1)',
        borderTopColor:'#f87171',
        animation:'spin 1.2s linear infinite reverse',
      }}/>
    </div>
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:20, fontWeight:700, color:'var(--t1)', marginBottom:6}}>STP</div>
      <div style={{fontSize:13, color:'var(--t3)'}}>{message}</div>
    </div>
  </div>
);

// Skeleton base block
const Sk = ({w='100%',h=12,r=6,mb=0}) => (
  <div className="skel" style={{height:h,width:w,borderRadius:r,marginBottom:mb,flexShrink:0}}/>
);

export const SkeletonLoader = ({ screen='overview' }) => {
  const StatCards = () => (
    <div className="stat-grid" style={{marginBottom:20}}>
      {[1,2,3,4].map(i=>(
        <div key={i} className="card" style={{padding:16}}>
          <Sk w={70} h={9} mb={12}/>
          <Sk w={90} h={32} mb={10}/>
          <Sk w="80%" h={8} mb={8}/>
          <Sk h={4}/>
        </div>
      ))}
    </div>
  );

  const Header = ({titleW=220,subtitleW=140}) => (
    <div style={{marginBottom:22}}>
      <Sk w={90} h={9} mb={10}/>
      <Sk w={titleW} h={28} mb={8}/>
      <Sk w={subtitleW} h={12}/>
    </div>
  );

  const TableRows = ({rows=6,cols=5}) => (
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'10px 14px',borderBottom:'1px solid var(--b1)'}}>
        <Sk w={160} h={10}/>
      </div>
      {Array.from({length:rows}).map((_,ri)=>(
        <div key={ri} style={{display:'grid',gridTemplateColumns:`2fr ${Array(cols-1).fill('1fr').join(' ')}`,gap:12,padding:'10px 14px',borderBottom:'1px solid var(--b1)'}}>
          {Array.from({length:cols}).map((_,ci)=>(
            <Sk key={ci} w={ci===0?'90%':'70%'} h={ci===0?12:10}/>
          ))}
        </div>
      ))}
    </div>
  );

  const ChipRow = () => (
    <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
      {[100,130,110,140,90,120].map((w,i)=>(
        <div key={i} className="skel" style={{height:28,width:w,borderRadius:14}}/>
      ))}
    </div>
  );

  return (
    <div className="fade" style={{padding:'4px 0'}}>
      <Header/>
      <StatCards/>
      {(screen==='dealers'||screen==='outstanding'||screen==='entry') ? (
        <>
          <ChipRow/>
          <TableRows rows={8} cols={screen==='outstanding'?6:5}/>
        </>
      ) : screen==='monthly' ? (
        <div className="card" style={{height:280,display:'flex',alignItems:'flex-end',gap:6,padding:20}}>
          {Array.from({length:11}).map((_,i)=>(
            <div key={i} style={{flex:1,display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}>
              <div className="skel" style={{width:'100%',height:Math.random()*160+40,borderRadius:'4px 4px 0 0'}}/>
              <div className="skel" style={{width:28,height:8,borderRadius:4}}/>
            </div>
          ))}
        </div>
      ) : screen==='compare' ? (
        <>
          <ChipRow/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {[1,2].map(i=><div key={i} className="card" style={{height:200}}><Sk h={12} w={120} mb={16}/><div style={{height:160}} className="skel" /></div>)}
          </div>
        </>
      ) : screen==='map' ? (
        <div className="card skel" style={{height:420}}/>
      ) : screen==='followups' ? (
        <>
          <ChipRow/>
          {[1,2,3,4,5].map(i=>(
            <div key={i} className="card" style={{marginBottom:10,display:'flex',gap:12,alignItems:'center'}}>
              <div className="skel" style={{width:16,height:16,borderRadius:4,flexShrink:0}}/>
              <div style={{flex:1}}>
                <Sk w={180} h={12} mb={6}/>
                <Sk w={120} h={9}/>
              </div>
              <Sk w={60} h={22} r={10}/>
            </div>
          ))}
        </>
      ) : (
        // overview default
        <>
          <ChipRow/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
            <div className="card skel" style={{height:200}}/>
            <div className="card skel" style={{height:200}}/>
          </div>
          <TableRows rows={5} cols={4}/>
        </>
      )}
    </div>
  );
};

export const MonthSelectorBar = ({selectedMonthIdx,setSelectedMonthIdx,onRefreshMonth}) => {
  const { MO:ctxMO, currentMonthIdx } = useMonth();
  const MO = ctxMO || MO_CONST;
  const curIdx = currentMonthIdx ?? CURRENT_MONTH_IDX;
  const selectedMonth = MO[selectedMonthIdx] || '';
  return (
  <div style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',background:'var(--bg1)',borderBottom:'1px solid var(--b1)',overflowX:'auto',flexShrink:0}}>
    <span style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.12em',whiteSpace:'nowrap',marginRight:4}}>Viewing:</span>
    {MO.map((m,i)=>(
      <button key={m} onClick={()=>setSelectedMonthIdx(i)} style={{padding:'4px 12px',borderRadius:6,border:selectedMonthIdx===i?'1px solid var(--acc)':'1px solid var(--b2)',background:selectedMonthIdx===i?'var(--accL)':'var(--bg2)',color:selectedMonthIdx===i?'var(--acc)':i===curIdx?'var(--t2)':'var(--t3)',fontWeight:selectedMonthIdx===i?700:i===curIdx?600:400,fontSize:11,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s',flexShrink:0,position:'relative'}}>
        {m}{i===curIdx&&<span style={{position:'absolute',top:-3,right:-3,width:6,height:6,background:'#34d399',borderRadius:'50%'}}/>}
      </button>
    ))}
    {selectedMonthIdx!==curIdx&&(<button onClick={()=>setSelectedMonthIdx(curIdx)} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #34d39944',background:'rgba(52,211,153,0.1)',color:'#34d399',fontSize:11,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>→ Current</button>)}
    {onRefreshMonth && (
      <button onClick={()=>onRefreshMonth(selectedMonth)}
        title={'Refresh ' + selectedMonth + ' data from MongoDB (does NOT touch Google Sheets)'}
        style={{padding:'4px 10px',borderRadius:6,border:'1px solid #15803d',background:'rgba(34,197,94,0.10)',color:'#86efac',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,display:'inline-flex',alignItems:'center',gap:4}}>
        ↻ Refresh {selectedMonth}
      </button>
    )}
  </div>
  );
};