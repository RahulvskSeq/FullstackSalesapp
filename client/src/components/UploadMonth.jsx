// import React, { useState, useRef } from 'react';
// import { Upload, X, CheckCircle, AlertCircle, Download, ChevronDown, RefreshCw, Edit3, DollarSign, MapPin, Tag } from 'lucide-react';
// import { MO as MO_DEFAULT } from '../constants';
// import { useMonth } from '../context';
// import { api } from '../api';

// // ── Upload modes ──────────────────────────────────────────
// // 1. monthly   — upload achieved/target for a specific month
// // 2. bulk-info — bulk update dealer info (city/state/zone/status/category/credit)
// // 3. outstanding — upload outstanding amounts month-wise

// const MODES = [
//   { id:'monthly',     label:'Monthly Sales Data',   icon:Upload,     color:'#6366f1', desc:'Upload achieved & target for a specific month' },
//   { id:'bulk-info',   label:'Bulk Update Info',      icon:Edit3,      color:'#34d399', desc:'Update dealer details (city, zone, status, category, credit etc)' },
//   { id:'outstanding', label:'Outstanding Payments',  icon:DollarSign, color:'#f87171', desc:'Upload month-wise outstanding amounts (admin only)' },
// ];

// export default function UploadMonth({ users, currentUser, onSuccess }) {
//   const { MO:ctxMO } = useMonth();
//   const MO = ctxMO || MO_DEFAULT;
//   const [mode, setMode]         = useState('monthly');
//   const [file, setFile]         = useState(null);
//   const [month, setMonth]       = useState(MO[MO.length-1]);
//   const [salesman, setSalesman] = useState(currentUser.id);
//   const [loading, setLoading]   = useState(false);
//   const [result, setResult]     = useState(null);
//   const [error, setError]       = useState('');
//   const [drag, setDrag]         = useState(false);
//   const fileRef = useRef();

//   const isAdmin = currentUser.role === 'admin';
//   const salesmen = Object.values(users).filter(u => u.role === 'salesman');

//   const reset = () => { setFile(null); setResult(null); setError(''); };

//   const onDrop = (e) => {
//     e.preventDefault(); setDrag(false);
//     const f = e.dataTransfer?.files[0] || e.target?.files[0];
//     if(f){ setFile(f); setResult(null); setError(''); }
//   };

//   const handleUpload = async () => {
//     if(!file) return;
//     setLoading(true); setError(''); setResult(null);
//     try {
//       let res;
//       if(mode === 'monthly'){
//         res = await api.uploadMonth(file, month, isAdmin ? salesman : undefined);
//       } else if(mode === 'bulk-info'){
//         res = await api.bulkUpdateInfo(file, isAdmin ? salesman : undefined);
//       } else if(mode === 'outstanding'){
//         if(!isAdmin) throw new Error('Admin only');
//         res = await api.uploadOutstanding(file);
//       }
//       setResult(res);
//       // Result is saved to DB — show which month was uploaded
//       if(onSuccess) onSuccess();
//     } catch(e) { setError(e.message); }
//     setLoading(false);
//   };

//   const downloadTemplate = () => {
//     let headers, rows, filename;

//     if(mode === 'monthly'){
//       headers = ['Dealer Name','City','State','Zone','Status','Target','Achieved','Category Type','Sub Category','Credit Days','Credit Limit'];
//       rows    = [
//         ['AADINATH PLYWOOD AND HARDWARE','Hyderabad','Telangana','ZONE 1','STAR',500,320,'LAMINATE','1 MM',45,300000],
//         ['BHATTAD PLYWOODS','Mumbai','Maharashtra','ZONE 2','KEY ACCOUNT',300,280,'POLYMENT SHEET','GAG',30,200000],
//         ['ADD YOUR DEALERS HERE','','','','',0,0,'','',0,0],
//       ];
//       filename = `Monthly_${month}_Template.csv`;
//     } else if(mode === 'bulk-info'){
//       headers = ['Dealer Name','City','State','Zone','Status','Category Type','Sub Category','Credit Days','Credit Limit','Target'];
//       rows    = [
//         ['AADINATH PLYWOOD AND HARDWARE','Hyderabad','Telangana','ZONE 1','STAR','LAMINATE','1 MM',45,300000,500],
//         ['BHATTAD PLYWOODS','Mumbai','Maharashtra','ZONE 2','KEY ACCOUNT','POLYMENT SHEET','GAG',30,200000,300],
//         ['NOTE: Only fill columns you want to update. Leave blank to keep existing value.','','','','','','','','',''],
//       ];
//       filename = 'Bulk_Update_Info_Template.csv';
//     } else {
//       headers = ['Dealer Name','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26'];
//       rows    = [
//         ['AADINATH PLYWOOD AND HARDWARE',36000,100625,169650,200000,185000,170000,155000,140000,120000,100000,80000],
//         ['BHATTAD PLYWOODS',51125,56625,60875,65000,72000,68000,55000,45000,38000,30000,20000],
//         ['NOTE: Enter 0 for cleared/no outstanding. Add new month column to RIGHT as months progress.','','','','','','','','','','',''],
//       ];
//       filename = 'Outstanding_Template.csv';
//     }

//     const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
//     const a   = document.createElement('a');
//     a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
//     a.download = filename;
//     a.click();
//   };

//   const activeMode = MODES.find(m => m.id === mode);

//   return (
//     <div className="fade">
//       <div style={{marginBottom:16}}>
//         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Data Entry</div>
//         <div style={{fontSize:22,fontWeight:700}}>Upload & Bulk Update</div>
//         <div style={{fontSize:13,color:'var(--t3)',marginTop:4}}>Upload Excel/CSV to add monthly data, bulk update dealer info, or update outstanding payments.</div>
//       <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
//         <span style={{fontSize:12,background:'var(--accL)',color:'var(--acc)',padding:'3px 10px',borderRadius:5,fontWeight:600}}>
//           📅 Available months: {MO.length} (Jul-25 → {MO[MO.length-1]})
//         </span>
//         <span style={{fontSize:11,color:'var(--t3)'}}>Add more months in Admin Panel → Month Settings</span>
//       </div>
//       </div>

//       {/* Mode selector */}
//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:18}}>
//         {MODES.map(m => {
//           const Icon = m.icon;
//           const active = mode === m.id;
//           if(m.id==='outstanding' && !isAdmin) return null;
//           return(
//             <div key={m.id} onClick={()=>{setMode(m.id);reset();}}
//               style={{
//                 background:active?`${m.color}18`:'var(--bg1)',
//                 border:`2px solid ${active?m.color:'var(--b2)'}`,
//                 borderRadius:10,padding:'12px 14px',cursor:'pointer',
//                 transition:'all .15s',
//               }}>
//               <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
//                 <Icon size={16} color={active?m.color:'var(--t3)'}/>
//                 <span style={{fontSize:12,fontWeight:700,color:active?m.color:'var(--t2)'}}>{m.label}</span>
//               </div>
//               <div style={{fontSize:10,color:'var(--t3)',lineHeight:1.4}}>{m.desc}</div>
//             </div>
//           );
//         })}
//       </div>

//       <div className="card" style={{marginBottom:14}}>
//         {/* Controls */}
//         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:14}}>
//           {/* Month selector — only for monthly mode */}
//           {mode==='monthly'&&(
//             <div>
//               <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Month *</label>
//               <div style={{position:'relative'}}>
//                 <select className="inp" value={month} onChange={e=>setMonth(e.target.value)} style={{width:'100%',paddingRight:30,appearance:'none'}}>
//                   {[...MO].reverse().map(m=><option key={m} value={m}>{m}</option>)}
//                 </select>
//                 <ChevronDown size={13} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
//               </div>
//             </div>
//           )}

//           {/* Salesman — admin only, not for outstanding */}
//           {isAdmin && mode!=='outstanding' && (
//             <div>
//               <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Salesman *</label>
//               <div style={{position:'relative'}}>
//                 <select className="inp" value={salesman} onChange={e=>setSalesman(e.target.value)} style={{width:'100%',paddingRight:30,appearance:'none'}}>
//                   {salesmen.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
//                 </select>
//                 <ChevronDown size={13} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* What gets updated info */}
//         {mode==='bulk-info'&&(
//           <div style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
//             <div style={{fontSize:11,fontWeight:600,color:'#34d399',marginBottom:6}}>What you can update in bulk:</div>
//             <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
//               {['City','State','Zone','Status','Category Type','Sub Category','Credit Days','Credit Limit','Target'].map(f=>(
//                 <span key={f} style={{fontSize:10,background:'rgba(52,211,153,0.1)',color:'#34d399',padding:'2px 8px',borderRadius:4,border:'1px solid rgba(52,211,153,0.2)'}}>{f}</span>
//               ))}
//             </div>
//             <div style={{fontSize:10,color:'var(--t3)',marginTop:8}}>💡 Leave any column blank = keep existing value. Only filled columns get updated.</div>
//           </div>
//         )}

//         {mode==='outstanding'&&(
//           <div style={{background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
//             <div style={{fontSize:11,fontWeight:600,color:'#f87171',marginBottom:4}}>Outstanding sheet format:</div>
//             <div style={{fontSize:10,color:'var(--t3)',fontFamily:'monospace',lineHeight:1.8}}>
//               Dealer Name | Jul-25 | Aug-25 | Sep-25 | ...<br/>
//               AADINATH PLYWOOD | 36000 | 100625 | 169650 | ...<br/>
//               BHATTAD PLYWOODS | 0 | 56625 | 60875 | ...
//             </div>
//             <div style={{fontSize:10,color:'var(--t3)',marginTop:8}}>💡 0 = cleared. Add new month column to the right. Existing months are preserved.</div>
//           </div>
//         )}

//         {/* Drop zone */}
//         <div
//           onDrop={onDrop}
//           onDragOver={e=>{e.preventDefault();setDrag(true);}}
//           onDragLeave={()=>setDrag(false)}
//           onClick={()=>fileRef.current?.click()}
//           style={{
//             border:`2px dashed ${drag?activeMode.color:'var(--b2)'}`,
//             borderRadius:10,padding:'28px 20px',textAlign:'center',cursor:'pointer',
//             background:drag?`${activeMode.color}11`:'var(--bg2)',transition:'all .15s',
//             marginBottom:12,
//           }}>
//           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={onDrop}/>
//           <Upload size={28} color={file?activeMode.color:'var(--t3)'} style={{margin:'0 auto 10px'}}/>
//           {file?(
//             <div>
//               <div style={{fontSize:13,fontWeight:600,color:activeMode.color}}>{file.name}</div>
//               <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>{(file.size/1024).toFixed(1)} KB · Click to change</div>
//             </div>
//           ):(
//             <div>
//               <div style={{fontSize:13,fontWeight:600,color:'var(--t2)'}}>Drop Excel / CSV here or click to browse</div>
//               <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>.xlsx, .xls, .csv supported</div>
//             </div>
//           )}
//         </div>

//         <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
//           <button onClick={handleUpload} disabled={!file||loading}
//             className="btnp" style={{display:'flex',alignItems:'center',gap:6,background:file&&!loading?activeMode.color:undefined}}>
//             {loading?<RefreshCw size={13} className="spin"/>:<Upload size={13}/>}
//             {loading?'Uploading...':'Upload'}
//           </button>
//           <button onClick={downloadTemplate} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
//             <Download size={13}/> Download Template
//           </button>
//           {file&&<button onClick={reset} className="btn" style={{color:'var(--red)',display:'flex',alignItems:'center',gap:4}}>
//             <X size={12}/> Clear
//           </button>}
//         </div>
//       </div>

//       {/* Result */}
//       {result&&(
//         <div className="card" style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.2)',marginBottom:12}}>
//           <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
//             <CheckCircle size={18} color="#34d399"/>
//             <span style={{fontSize:14,fontWeight:700,color:'#34d399'}}>
//               Upload Successful {result.month ? `— ${result.month}` : ''}
//             </span>
//           </div>
//           <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:8,marginBottom:result.errors?.length?12:0}}>
//             {[
//               ...(result.added!==undefined    ?[{l:'New Added',   v:result.added,   c:'#34d399'}]:[]),
//               ...(result.updated!==undefined  ?[{l:'Updated',     v:result.updated, c:'var(--acc)'}]:[]),
//               ...(result.skipped!==undefined  ?[{l:'Skipped',     v:result.skipped, c:'var(--t3)'}]:[]),
//               {l:'Errors', v:result.errors?.length||0, c:result.errors?.length?'#f87171':'var(--t3)'},
//             ].map(k=>(
//               <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'8px 12px'}}>
//                 <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
//                 <div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div>
//               </div>
//             ))}
//           </div>
//           {result.errors?.length>0&&(
//             <div style={{fontSize:11,color:'#f87171'}}>
//               <div style={{fontWeight:600,marginBottom:4}}>Errors ({result.errors.length}):</div>
//               {result.errors.slice(0,8).map((e,i)=><div key={i} style={{marginBottom:2}}>· {e}</div>)}
//               {result.errors.length>8&&<div style={{color:'var(--t3)'}}>...and {result.errors.length-8} more</div>}
//             </div>
//           )}
//         </div>
//       )}

//       {error&&(
//         <div className="card" style={{background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.2)',display:'flex',alignItems:'center',gap:10}}>
//           <AlertCircle size={16} color="#f87171" style={{flexShrink:0}}/>
//           <span style={{fontSize:13,color:'#f87171'}}>{error}</span>
//         </div>
//       )}

//       {/* Format guide */}
//       <div className="card" style={{marginTop:14}}>
//         <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
//           {mode==='monthly'&&'📋 Monthly Sales Upload Format'}
//           {mode==='bulk-info'&&'📋 Bulk Info Update Format'}
//           {mode==='outstanding'&&'📋 Outstanding Upload Format'}
//         </div>

//         {mode==='monthly'&&(
//           <>
//             <div style={{overflowX:'auto',marginBottom:8}}>
//               <table style={{fontSize:10}}>
//                 <thead><tr>
//                   {['Dealer Name*','City','State','Zone','Status','Target','Achieved*','Cat Type','Sub Cat','Cr Days','Cr Limit'].map(h=><th key={h}>{h}</th>)}
//                 </tr></thead>
//                 <tbody><tr>
//                   {['AADINATH PLYWOOD','Hyd','Telangana','ZONE 1','STAR','500','320','LAMINATE','1 MM','45','300000'].map((v,i)=><td key={i} style={{color:'var(--t2)'}}>{v}</td>)}
//                 </tr></tbody>
//               </table>
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)'}}>* = Required. Existing dealers are updated, new ones added. All historical data preserved.</div>
//           </>
//         )}

//         {mode==='bulk-info'&&(
//           <>
//             <div style={{overflowX:'auto',marginBottom:8}}>
//               <table style={{fontSize:10}}>
//                 <thead><tr>
//                   {['Dealer Name*','City','State','Zone','Status','Cat Type','Sub Cat','Cr Days','Cr Limit','Target'].map(h=><th key={h}>{h}</th>)}
//                 </tr></thead>
//                 <tbody>
//                   <tr>{['AADINATH PLYWOOD','Hyderabad','','','STAR','LAMINATE','1 MM','','','500'].map((v,i)=><td key={i} style={{color:v?'var(--t2)':'var(--t3)'}}>{v||'(blank=skip)'}</td>)}</tr>
//                 </tbody>
//               </table>
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)'}}>
//               * = Required (to match dealer). All other columns optional — blank = keep existing value.<br/>
//               ✅ Use this to bulk change: zone reassignment, status update, category fix, credit limit changes etc.
//             </div>
//           </>
//         )}

//         {mode==='outstanding'&&(
//           <>
//             <div style={{overflowX:'auto',marginBottom:8}}>
//               <table style={{fontSize:10}}>
//                 <thead><tr>
//                   {['Dealer Name','Jul-25','Aug-25','Sep-25','...','May-26'].map(h=><th key={h}>{h}</th>)}
//                 </tr></thead>
//                 <tbody>
//                   <tr>{['AADINATH PLYWOOD','36000','100625','169650','...','80000'].map((v,i)=><td key={i} style={{color:v==='0'?'#34d399':v.includes('...')?'var(--t3)':'#f87171'}}>{v}</td>)}</tr>
//                   <tr>{['BHATTAD PLYWOODS','0','56625','60875','...','20000'].map((v,i)=><td key={i} style={{color:v==='0'?'#34d399':v.includes('...')?'var(--t3)':'#f87171'}}>{v}</td>)}</tr>
//                 </tbody>
//               </table>
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)'}}>
//               Red = outstanding amount ₹. Green = 0 (cleared). Add new months to the RIGHT each month.
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// import React, { useState, useRef } from 'react';
// import { Upload, X, CheckCircle, AlertCircle, Download, ChevronDown, RefreshCw, Edit3, DollarSign, MapPin, Tag } from 'lucide-react';
// import { MO as MO_DEFAULT } from '../constants';
// import { useMonth } from '../context';
// import { api } from '../api';

// // ── Upload modes ──────────────────────────────────────────
// // 1. monthly   — upload achieved/target for a specific month
// // 2. bulk-info — bulk update dealer info (city/state/zone/status/category/credit)
// // 3. outstanding — upload outstanding amounts month-wise

// const MODES = [
//   { id:'monthly',     label:'Monthly Sales Data',   icon:Upload,     color:'#6366f1', desc:'Upload achieved & target for a specific month' },
//   { id:'bulk-info',   label:'Bulk Update Info',      icon:Edit3,      color:'#34d399', desc:'Update dealer details (city, zone, status, category, credit etc)' },
//   { id:'outstanding', label:'Outstanding Payments',  icon:DollarSign, color:'#f87171', desc:'Upload month-wise outstanding amounts (admin only)' },
// ];

// export default function UploadMonth({ users, currentUser, onSuccess }) {
//   const { MO:ctxMO } = useMonth();
//   const MO = ctxMO || MO_DEFAULT;
//   const [mode, setMode]         = useState('monthly');
//   const [file, setFile]         = useState(null);
//   const [month, setMonth]       = useState(MO[MO.length-1]);
//   const [salesman, setSalesman] = useState(currentUser?.id || '');
//   const [loading, setLoading]   = useState(false);
//   const [result, setResult]     = useState(null);
//   const [error, setError]       = useState('');
//   const [drag, setDrag]         = useState(false);
//   const fileRef = useRef();

//   const isAdmin = currentUser?.role === 'admin';
//   const salesmen = Object.values(users).filter(u => u.role === 'salesman');

//   const reset = () => { setFile(null); setResult(null); setError(''); };

//   const onDrop = (e) => {
//     e.preventDefault(); setDrag(false);
//     const f = e.dataTransfer?.files[0] || e.target?.files[0];
//     if(f){ setFile(f); setResult(null); setError(''); }
//   };

//   const handleUpload = async () => {
//     if(!file) return;
//     // Check JWT token
//     const token = localStorage.getItem('stp_jwt');
//     if(!token){
//       setError('Not connected to server. Please make sure the server (npm run dev in server folder) is running, then log out and log back in.');
//       return;
//     }
//     setLoading(true); setError(''); setResult(null);
//     try {
//       let res;
//       if(mode === 'monthly'){
//         res = await api.uploadMonth(file, month, isAdmin ? salesman : undefined);
//       } else if(mode === 'bulk-info'){
//         res = await api.bulkUpdateInfo(file, isAdmin ? salesman : undefined);
//       } else if(mode === 'outstanding'){
//         if(!isAdmin) throw new Error('Admin only — please login as admin');
//         res = await api.uploadOutstanding(file);
//       }
//       setResult(res);
//       // Result is saved to DB — show which month was uploaded
//       if(onSuccess) onSuccess();
//     } catch(e) { setError(e.message); }
//     setLoading(false);
//   };

//   const downloadTemplate = () => {
//     let headers, rows, filename;

//     if(mode === 'monthly'){
//       headers = ['Dealer Name','City','State','Zone','Status','Target','Achieved','Category Type','Sub Category','Credit Days','Credit Limit'];
//       rows    = [
//         ['AADINATH PLYWOOD AND HARDWARE','Hyderabad','Telangana','ZONE 1','STAR',500,320,'LAMINATE','1 MM',45,300000],
//         ['BHATTAD PLYWOODS','Mumbai','Maharashtra','ZONE 2','KEY ACCOUNT',300,280,'POLYMENT SHEET','GAG',30,200000],
//         ['ADD YOUR DEALERS HERE','','','','',0,0,'','',0,0],
//       ];
//       filename = `Monthly_${month}_Template.csv`;
//     } else if(mode === 'bulk-info'){
//       headers = ['Dealer Name','City','State','Zone','Status','Category Type','Sub Category','Credit Days','Credit Limit','Target'];
//       rows    = [
//         ['AADINATH PLYWOOD AND HARDWARE','Hyderabad','Telangana','ZONE 1','STAR','LAMINATE','1 MM',45,300000,500],
//         ['BHATTAD PLYWOODS','Mumbai','Maharashtra','ZONE 2','KEY ACCOUNT','POLYMENT SHEET','GAG',30,200000,300],
//         ['NOTE: Only fill columns you want to update. Leave blank to keep existing value.','','','','','','','','',''],
//       ];
//       filename = 'Bulk_Update_Info_Template.csv';
//     } else {
//       headers = ['Dealer Name','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26'];
//       rows    = [
//         ['AADINATH PLYWOOD AND HARDWARE',36000,100625,169650,200000,185000,170000,155000,140000,120000,100000,80000],
//         ['BHATTAD PLYWOODS',51125,56625,60875,65000,72000,68000,55000,45000,38000,30000,20000],
//         ['NOTE: Enter 0 for cleared/no outstanding. Add new month column to RIGHT as months progress.','','','','','','','','','','',''],
//       ];
//       filename = 'Outstanding_Template.csv';
//     }

//     const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
//     const a   = document.createElement('a');
//     a.href    = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
//     a.download = filename;
//     a.click();
//   };

//   const activeMode = MODES.find(m => m.id === mode);

//   return (
//     <div className="fade">
//       <div style={{marginBottom:16}}>
//         <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Data Entry</div>
//         <div style={{fontSize:22,fontWeight:700}}>Upload & Bulk Update</div>
//         <div style={{fontSize:13,color:'var(--t3)',marginTop:4}}>Upload Excel/CSV to add monthly data, bulk update dealer info, or update outstanding payments.</div>
//       <div style={{marginTop:8,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
//         <span style={{fontSize:12,background:'var(--accL)',color:'var(--acc)',padding:'3px 10px',borderRadius:5,fontWeight:600}}>
//           📅 Available months: {MO.length} (Jul-25 → {MO[MO.length-1]})
//         </span>
//         <span style={{fontSize:11,color:'var(--t3)'}}>Add more months in Admin Panel → Month Settings</span>
//       </div>
//       </div>

//       {/* Mode selector */}
//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:18}}>
//         {MODES.map(m => {
//           const Icon = m.icon;
//           const active = mode === m.id;
//           if(m.id==='outstanding' && !isAdmin) return null;
//           return(
//             <div key={m.id} onClick={()=>{setMode(m.id);reset();}}
//               style={{
//                 background:active?`${m.color}18`:'var(--bg1)',
//                 border:`2px solid ${active?m.color:'var(--b2)'}`,
//                 borderRadius:10,padding:'12px 14px',cursor:'pointer',
//                 transition:'all .15s',
//               }}>
//               <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
//                 <Icon size={16} color={active?m.color:'var(--t3)'}/>
//                 <span style={{fontSize:12,fontWeight:700,color:active?m.color:'var(--t2)'}}>{m.label}</span>
//               </div>
//               <div style={{fontSize:10,color:'var(--t3)',lineHeight:1.4}}>{m.desc}</div>
//             </div>
//           );
//         })}
//       </div>

//       <div className="card" style={{marginBottom:14}}>
//         {/* Controls */}
//         <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:14}}>
//           {/* Month selector — only for monthly mode */}
//           {mode==='monthly'&&(
//             <div>
//               <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Month *</label>
//               <div style={{position:'relative'}}>
//                 <select className="inp" value={month} onChange={e=>setMonth(e.target.value)} style={{width:'100%',paddingRight:30,appearance:'none'}}>
//                   {[...MO].reverse().map(m=><option key={m} value={m}>{m}</option>)}
//                 </select>
//                 <ChevronDown size={13} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
//               </div>
//             </div>
//           )}

//           {/* Salesman — admin only, not for outstanding */}
//           {isAdmin && mode!=='outstanding' && (
//             <div>
//               <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Salesman *</label>
//               <div style={{position:'relative'}}>
//                 <select className="inp" value={salesman} onChange={e=>setSalesman(e.target.value)} style={{width:'100%',paddingRight:30,appearance:'none'}}>
//                   {salesmen.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
//                 </select>
//                 <ChevronDown size={13} style={{position:'absolute',right:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* What gets updated info */}
//         {mode==='bulk-info'&&(
//           <div style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
//             <div style={{fontSize:11,fontWeight:600,color:'#34d399',marginBottom:6}}>What you can update in bulk:</div>
//             <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
//               {['City','State','Zone','Status','Category Type','Sub Category','Credit Days','Credit Limit','Target'].map(f=>(
//                 <span key={f} style={{fontSize:10,background:'rgba(52,211,153,0.1)',color:'#34d399',padding:'2px 8px',borderRadius:4,border:'1px solid rgba(52,211,153,0.2)'}}>{f}</span>
//               ))}
//             </div>
//             <div style={{fontSize:10,color:'var(--t3)',marginTop:8}}>💡 Leave any column blank = keep existing value. Only filled columns get updated.</div>
//           </div>
//         )}

//         {mode==='outstanding'&&(
//           <div style={{background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:8,padding:'10px 14px',marginBottom:14}}>
//             <div style={{fontSize:11,fontWeight:600,color:'#f87171',marginBottom:4}}>Outstanding sheet format:</div>
//             <div style={{fontSize:10,color:'var(--t3)',fontFamily:'monospace',lineHeight:1.8}}>
//               Dealer Name | Jul-25 | Aug-25 | Sep-25 | ...<br/>
//               AADINATH PLYWOOD | 36000 | 100625 | 169650 | ...<br/>
//               BHATTAD PLYWOODS | 0 | 56625 | 60875 | ...
//             </div>
//             <div style={{fontSize:10,color:'var(--t3)',marginTop:8}}>💡 0 = cleared. Add new month column to the right. Existing months are preserved.</div>
//           </div>
//         )}

//         {/* Drop zone */}
//         <div
//           onDrop={onDrop}
//           onDragOver={e=>{e.preventDefault();setDrag(true);}}
//           onDragLeave={()=>setDrag(false)}
//           onClick={()=>fileRef.current?.click()}
//           style={{
//             border:`2px dashed ${drag?activeMode.color:'var(--b2)'}`,
//             borderRadius:10,padding:'28px 20px',textAlign:'center',cursor:'pointer',
//             background:drag?`${activeMode.color}11`:'var(--bg2)',transition:'all .15s',
//             marginBottom:12,
//           }}>
//           <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={onDrop}/>
//           <Upload size={28} color={file?activeMode.color:'var(--t3)'} style={{margin:'0 auto 10px'}}/>
//           {file?(
//             <div>
//               <div style={{fontSize:13,fontWeight:600,color:activeMode.color}}>{file.name}</div>
//               <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>{(file.size/1024).toFixed(1)} KB · Click to change</div>
//             </div>
//           ):(
//             <div>
//               <div style={{fontSize:13,fontWeight:600,color:'var(--t2)'}}>Drop Excel / CSV here or click to browse</div>
//               <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>.xlsx, .xls, .csv supported</div>
//             </div>
//           )}
//         </div>

//         <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
//           <button onClick={handleUpload} disabled={!file||loading}
//             className="btnp" style={{display:'flex',alignItems:'center',gap:6,background:file&&!loading?activeMode.color:undefined}}>
//             {loading?<RefreshCw size={13} className="spin"/>:<Upload size={13}/>}
//             {loading?'Uploading...':'Upload'}
//           </button>
//           <button onClick={downloadTemplate} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
//             <Download size={13}/> Download Template
//           </button>
//           {file&&<button onClick={reset} className="btn" style={{color:'var(--red)',display:'flex',alignItems:'center',gap:4}}>
//             <X size={12}/> Clear
//           </button>}
//         </div>
//       </div>

//       {/* Result */}
//       {result&&(
//         <div className="card" style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.2)',marginBottom:12}}>
//           <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
//             <CheckCircle size={18} color="#34d399"/>
//             <span style={{fontSize:14,fontWeight:700,color:'#34d399'}}>
//               Upload Successful {result.month ? `— ${result.month}` : ''}
//             </span>
//           </div>
//           <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:8,marginBottom:result.errors?.length?12:0}}>
//             {[
//               ...(result.added!==undefined    ?[{l:'New Added',   v:result.added,   c:'#34d399'}]:[]),
//               ...(result.updated!==undefined  ?[{l:'Updated',     v:result.updated, c:'var(--acc)'}]:[]),
//               ...(result.skipped!==undefined  ?[{l:'Skipped',     v:result.skipped, c:'var(--t3)'}]:[]),
//               {l:'Errors', v:result.errors?.length||0, c:result.errors?.length?'#f87171':'var(--t3)'},
//             ].map(k=>(
//               <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'8px 12px'}}>
//                 <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
//                 <div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div>
//               </div>
//             ))}
//           </div>
//           {result.errors?.length>0&&(
//             <div style={{fontSize:11,color:'#f87171'}}>
//               <div style={{fontWeight:600,marginBottom:4}}>Errors ({result.errors.length}):</div>
//               {result.errors.slice(0,8).map((e,i)=><div key={i} style={{marginBottom:2}}>· {e}</div>)}
//               {result.errors.length>8&&<div style={{color:'var(--t3)'}}>...and {result.errors.length-8} more</div>}
//             </div>
//           )}
//         </div>
//       )}

//       {error&&(
//         <div className="card" style={{background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.2)',display:'flex',alignItems:'center',gap:10}}>
//           <AlertCircle size={16} color="#f87171" style={{flexShrink:0}}/>
//           <span style={{fontSize:13,color:'#f87171'}}>{error}</span>
//         </div>
//       )}

//       {/* Format guide */}
//       <div className="card" style={{marginTop:14}}>
//         <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
//           {mode==='monthly'&&'📋 Monthly Sales Upload Format'}
//           {mode==='bulk-info'&&'📋 Bulk Info Update Format'}
//           {mode==='outstanding'&&'📋 Outstanding Upload Format'}
//         </div>

//         {mode==='monthly'&&(
//           <>
//             <div style={{overflowX:'auto',marginBottom:8}}>
//               <table style={{fontSize:10}}>
//                 <thead><tr>
//                   {['Dealer Name*','City','State','Zone','Status','Target','Achieved*','Cat Type','Sub Cat','Cr Days','Cr Limit'].map(h=><th key={h}>{h}</th>)}
//                 </tr></thead>
//                 <tbody><tr>
//                   {['AADINATH PLYWOOD','Hyd','Telangana','ZONE 1','STAR','500','320','LAMINATE','1 MM','45','300000'].map((v,i)=><td key={i} style={{color:'var(--t2)'}}>{v}</td>)}
//                 </tr></tbody>
//               </table>
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)'}}>* = Required. Existing dealers are updated, new ones added. All historical data preserved.</div>
//           </>
//         )}

//         {mode==='bulk-info'&&(
//           <>
//             <div style={{overflowX:'auto',marginBottom:8}}>
//               <table style={{fontSize:10}}>
//                 <thead><tr>
//                   {['Dealer Name*','City','State','Zone','Status','Cat Type','Sub Cat','Cr Days','Cr Limit','Target'].map(h=><th key={h}>{h}</th>)}
//                 </tr></thead>
//                 <tbody>
//                   <tr>{['AADINATH PLYWOOD','Hyderabad','','','STAR','LAMINATE','1 MM','','','500'].map((v,i)=><td key={i} style={{color:v?'var(--t2)':'var(--t3)'}}>{v||'(blank=skip)'}</td>)}</tr>
//                 </tbody>
//               </table>
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)'}}>
//               * = Required (to match dealer). All other columns optional — blank = keep existing value.<br/>
//               ✅ Use this to bulk change: zone reassignment, status update, category fix, credit limit changes etc.
//             </div>
//           </>
//         )}

//         {mode==='outstanding'&&(
//           <>
//             <div style={{overflowX:'auto',marginBottom:8}}>
//               <table style={{fontSize:10}}>
//                 <thead><tr>
//                   {['Dealer Name','Jul-25','Aug-25','Sep-25','...','May-26'].map(h=><th key={h}>{h}</th>)}
//                 </tr></thead>
//                 <tbody>
//                   <tr>{['AADINATH PLYWOOD','36000','100625','169650','...','80000'].map((v,i)=><td key={i} style={{color:v==='0'?'#34d399':v.includes('...')?'var(--t3)':'#f87171'}}>{v}</td>)}</tr>
//                   <tr>{['BHATTAD PLYWOODS','0','56625','60875','...','20000'].map((v,i)=><td key={i} style={{color:v==='0'?'#34d399':v.includes('...')?'var(--t3)':'#f87171'}}>{v}</td>)}</tr>
//                 </tbody>
//               </table>
//             </div>
//             <div style={{fontSize:11,color:'var(--t3)'}}>
//               Red = outstanding amount ₹. Green = 0 (cleared). Add new months to the RIGHT each month.
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }



import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Download, ChevronDown, RefreshCw, Edit3, DollarSign } from 'lucide-react';
import { useMonth } from '../context';
import { MO as MO_DEFAULT } from '../constants';
import { api } from '../api';

const MODES = [
  { id:'monthly',     label:'Monthly Sales Data',  icon:Upload,      color:'#6366f1', desc:'Upload dealer data for a specific month — target, achieved, status, zone etc.' },
  { id:'bulk-info',   label:'Bulk Update Info',     icon:Edit3,       color:'#34d399', desc:'Update dealer details in bulk — zone, category, credit limit etc.' },
  { id:'outstanding', label:'Outstanding Payments', icon:DollarSign,  color:'#f87171', desc:'Upload month-wise outstanding amounts (admin only).' },
];

export default function UploadMonth({ users, currentUser, onSuccess }) {
  const { MO:ctxMO, currentMonthIdx } = useMonth();
  const MO     = ctxMO || MO_DEFAULT;
  const isAdmin= currentUser?.role === 'admin';

  const [mode, setMode]         = useState('monthly');
  const [file, setFile]         = useState(null);
  const [month, setMonth]       = useState(MO[currentMonthIdx] || MO[MO.length-1]);
  const [salesman, setSalesman] = useState(currentUser?.id || '');
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const [drag, setDrag]         = useState(false);
  const fileRef = useRef();

  const salesmen = Object.values(users).filter(u => u.role === 'salesman');
  const activeMode = MODES.find(m => m.id === mode);

  const reset = () => { setFile(null); setResult(null); setError(''); };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer?.files[0] || e.target?.files[0];
    if(f){ setFile(f); setResult(null); setError(''); }
  };

  const handleUpload = async () => {
    if(!file) return;
    const token = localStorage.getItem('stp_jwt');
    if(!token){
      setError('Not connected to server. Make sure server is running (cd server && npm run dev) then log out and log back in.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      let res;
      if(mode === 'monthly'){
        res = await api.uploadMonth(file, month, isAdmin ? salesman : undefined);
      } else if(mode === 'bulk-info'){
        res = await api.bulkUpdateInfo(file, isAdmin ? salesman : undefined);
      } else {
        if(!isAdmin) throw new Error('Admin only');
        res = await api.uploadOutstanding(file);
      }
      setResult({ ...res, mode, month });
      // Reload from DB so UI updates immediately
      if(onSuccess) onSuccess();
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const downloadTemplate = () => {
    let headers, rows, filename;
    if(mode === 'monthly'){
      headers  = ['Dealer Name','City','State','Zone','Status','Target','Achieved','Category Type','Sub Category','Credit Days','Credit Limit'];
      rows     = [
        ['AADINATH PLYWOOD AND HARDWARE','Hyderabad','Telangana','ZONE 1','STAR',500,320,'LAMINATE','1 MM',45,300000],
        ['BHATTAD PLYWOODS','Mumbai','Maharashtra','ZONE 2','KEY ACCOUNT',300,280,'POLYMENT SHEET','GAG',30,200000],
        ['YOUR DEALER NAME','City','State','ZONE 1','ACTIVE',0,0,'Category','Sub Cat',0,0],
      ];
      filename = `Monthly_Upload_${month}.csv`;
    } else if(mode === 'bulk-info'){
      headers  = ['Dealer Name','City','State','Zone','Status','Category Type','Sub Category','Credit Days','Credit Limit','Target'];
      rows     = [['AADINATH PLYWOOD AND HARDWARE','Hyderabad','','','STAR','LAMINATE','1 MM','','500000',500]];
      filename = 'Bulk_Update_Info.csv';
    } else {
      headers  = ['Dealer Name','Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26'];
      rows     = [
        ['AADINATH PLYWOOD AND HARDWARE',36000,100625,169650,200000,185000,170000,155000,140000,120000,100000,80000],
        ['YOUR DEALER NAME',0,0,0,0,0,0,0,0,0,0,0],
      ];
      filename = 'Outstanding_Template.csv';
    }
    const csv = [headers,...rows].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download= filename; a.click();
  };

  return (
    <div className="fade">
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Data Entry</div>
        <div style={{fontSize:22,fontWeight:700}}>Upload & Update</div>
      </div>

      {/* Mode selector */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10,marginBottom:18}}>
        {MODES.map(m => {
          if(m.id==='outstanding' && !isAdmin) return null;
          const Icon   = m.icon;
          const active = mode === m.id;
          return (
            <div key={m.id} onClick={()=>{setMode(m.id);reset();}} style={{
              background:active?`${m.color}18`:'var(--bg1)',
              border:`2px solid ${active?m.color:'var(--b2)'}`,
              borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all .15s',
            }}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <Icon size={16} color={active?m.color:'var(--t3)'}/>
                <span style={{fontSize:12,fontWeight:700,color:active?m.color:'var(--t2)'}}>{m.label}</span>
              </div>
              <div style={{fontSize:10,color:'var(--t3)',lineHeight:1.4}}>{m.desc}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{marginBottom:14}}>

        {/* Month + salesman selectors */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:14}}>

          {mode==='monthly' && (
            <div>
              <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>
                Which Month? *
              </label>
              <div style={{position:'relative'}}>
                <select className="inp" value={month} onChange={e=>setMonth(e.target.value)}
                  style={{width:'100%',paddingRight:28,appearance:'none',fontWeight:700,color:'var(--acc)'}}>
                  {[...MO].reverse().map(m=>(
                    <option key={m} value={m}>{m}{m===MO[currentMonthIdx]?' (current)':''}</option>
                  ))}
                </select>
                <ChevronDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
              </div>
              <div style={{fontSize:10,color:'var(--t3)',marginTop:4}}>
                Data will be stored for <strong style={{color:'var(--acc)'}}>{month}</strong> only. Other months untouched.
              </div>
            </div>
          )}

          {isAdmin && mode !== 'outstanding' && (
            <div>
              <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>
                Salesman *
              </label>
              <div style={{position:'relative'}}>
                <select className="inp" value={salesman} onChange={e=>setSalesman(e.target.value)}
                  style={{width:'100%',paddingRight:28,appearance:'none'}}>
                  {salesmen.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={13} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}/>
              </div>
            </div>
          )}
        </div>

        {/* Info box */}
        {mode==='monthly' && (
          <div style={{padding:'8px 12px',background:`${activeMode.color}10`,border:`1px solid ${activeMode.color}30`,borderRadius:8,marginBottom:14,fontSize:11}}>
            <strong style={{color:activeMode.color}}>📅 Uploading for: {month}</strong>
            <span style={{color:'var(--t3)',marginLeft:8}}>
              This will save {month} target + achieved + status + zone for each dealer to MongoDB.
              Other months are NOT affected.
            </span>
          </div>
        )}

        {mode==='outstanding' && (
          <div style={{padding:'8px 12px',background:'rgba(248,113,113,0.08)',border:'1px solid rgba(248,113,113,0.2)',borderRadius:8,marginBottom:14,fontSize:11}}>
            <strong style={{color:'#f87171'}}>Format:</strong>
            <span style={{color:'var(--t3)',fontFamily:'monospace',marginLeft:6}}>Dealer Name | Jul-25 | Aug-25 | Sep-25 | ...</span>
            <span style={{color:'var(--t3)',marginLeft:8}}>— each column is one month, value is ₹ outstanding</span>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDrop={onDrop} onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
          onClick={()=>fileRef.current?.click()}
          style={{
            border:`2px dashed ${drag?activeMode.color:'var(--b2)'}`,
            borderRadius:10, padding:'28px 20px', textAlign:'center', cursor:'pointer',
            background:drag?`${activeMode.color}10`:'var(--bg2)', transition:'all .15s', marginBottom:12,
          }}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}} onChange={onDrop}/>
          <Upload size={28} color={file?activeMode.color:'var(--t3)'} style={{margin:'0 auto 10px'}}/>
          {file ? (
            <div>
              <div style={{fontSize:13,fontWeight:600,color:activeMode.color}}>{file.name}</div>
              <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>{(file.size/1024).toFixed(1)} KB · Click to change</div>
            </div>
          ) : (
            <div>
              <div style={{fontSize:13,fontWeight:600,color:'var(--t2)'}}>Drop Excel / CSV here or click to browse</div>
              <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>.xlsx, .xls, .csv supported</div>
            </div>
          )}
        </div>

        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={handleUpload} disabled={!file||loading} className="btnp"
            style={{display:'flex',alignItems:'center',gap:6,background:file&&!loading?activeMode.color:undefined}}>
            {loading ? <RefreshCw size={13} style={{animation:'spin .7s linear infinite'}}/> : <Upload size={13}/>}
            {loading ? 'Saving to DB...' : (mode==='monthly' ? `Upload for ${month}` : 'Upload')}
          </button>
          <button onClick={downloadTemplate} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
            <Download size={13}/> Download Template
          </button>
          {file && <button onClick={reset} className="btn" style={{color:'var(--red)',display:'flex',alignItems:'center',gap:4}}>
            <X size={12}/> Clear
          </button>}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card" style={{background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.2)',marginBottom:12}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <CheckCircle size={18} color="#34d399"/>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:'#34d399'}}>
                Saved to MongoDB ✓ {result.mode==='monthly'?`— ${result.month}`:''}
              </div>
              <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>
                {result.mode==='monthly'
                  ? `Select "${result.month}" in the month bar to see this data`
                  : 'Data updated in database'}
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))',gap:8,marginBottom:result.errors?.length?12:0}}>
            {[
              result.added   !==undefined && {l:'New Added',   v:result.added,   c:'#34d399'},
              result.updated !==undefined && {l:'Updated',     v:result.updated, c:'var(--acc)'},
              result.skipped !==undefined && {l:'Skipped',     v:result.skipped, c:'var(--t3)'},
              {l:'Errors', v:result.errors?.length||0, c:result.errors?.length?'#f87171':'var(--t3)'},
            ].filter(Boolean).map(k=>(
              <div key={k.l} style={{background:'var(--bg2)',borderRadius:8,padding:'8px 12px'}}>
                <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',marginBottom:3}}>{k.l}</div>
                <div style={{fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div>
              </div>
            ))}
          </div>
          {result.errors?.length>0 && (
            <div style={{fontSize:11,color:'#f87171'}}>
              <div style={{fontWeight:600,marginBottom:4}}>Errors:</div>
              {result.errors.slice(0,5).map((e,i)=><div key={i}>· {e}</div>)}
              {result.errors.length>5&&<div>...and {result.errors.length-5} more</div>}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="card" style={{background:'rgba(248,113,113,0.06)',border:'1px solid rgba(248,113,113,0.2)',display:'flex',alignItems:'center',gap:10}}>
          <AlertCircle size={16} color="#f87171" style={{flexShrink:0}}/>
          <span style={{fontSize:13,color:'#f87171'}}>{error}</span>
        </div>
      )}

      {/* Format guide */}
      <div className="card" style={{marginTop:14}}>
        <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>
          {mode==='monthly'&&'📋 Monthly Upload Format (one file per salesman per month)'}
          {mode==='bulk-info'&&'📋 Bulk Info Update Format'}
          {mode==='outstanding'&&'📋 Outstanding Format'}
        </div>
        {mode==='monthly'&&(
          <>
            <div style={{overflowX:'auto',marginBottom:8}}>
              <table style={{fontSize:10}}>
                <thead><tr>{['Dealer Name*','City','State','Zone','Status','Target','Achieved*','Cat Type','Sub Cat','Cr Days','Cr Limit'].map(h=><th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  <tr>{['AADINATH PLYWOOD','Hyderabad','Telangana','ZONE 1','STAR','500','320','LAMINATE','1 MM','45','300000'].map((v,i)=><td key={i} style={{color:'var(--t2)'}}>{v}</td>)}</tr>
                </tbody>
              </table>
            </div>
            <div style={{fontSize:11,color:'var(--t3)'}}>
              * Required. Each upload is for ONE month only. Uploading Jun-26 data does NOT change May-26 or Jul-26.
              After upload, select <strong>{month}</strong> in the month bar to see your data.
            </div>
          </>
        )}
        {mode==='outstanding'&&(
          <div style={{fontSize:11,color:'var(--t3)',fontFamily:'monospace',lineHeight:1.8}}>
            Dealer Name | Jul-25 | Aug-25 | Sep-25 | ...<br/>
            AADINATH PLYWOOD | 36000 | 100625 | 169650<br/>
            <span style={{color:'#34d399'}}>0 = cleared / fully paid</span>
          </div>
        )}
      </div>
    </div>
  );
}