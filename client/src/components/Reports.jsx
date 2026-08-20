// Reports console — admin / superadmin only.
// Layout: a left rail listing every report, and a content pane that renders
// the selected one as a full data table (search, per-column filters, sort,
// pagination, column show/hide, export). The Visit report opens by default.

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet, Download, Calendar, Users, TrendingUp, Activity,
  ClipboardList, UserCheck, Plane, AlertTriangle, Camera, Layers,
  ChevronRight, ChevronDown, Search,
} from 'lucide-react';
import { api } from '../api';
import { notify } from './Toast';
import { monthTarget, pct, spct } from '../utils';

// "Jun-26" → "2026-06"
const _moMonths = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function moToYM(lbl) {
  if (!lbl) return '';
  const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(String(lbl).trim());
  if (!m) return '';
  const mi = _moMonths.indexOf(m[1].slice(0,3).toLowerCase());
  if (mi < 0) return '';
  let y = +m[2]; if (y < 100) y += 2000;
  return `${y}-${String(mi+1).padStart(2,'0')}`;
}

// CSV helper shared by every report.
function exportCSV(filename, headers, rows){
  if(!rows || rows.length === 0){ notify.info('Nothing to export'); return; }
  const esc = v => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
  notify.success('Exported ' + rows.length + ' rows');
}

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '';
const fmtDT   = (d) => d ? new Date(d).toLocaleString('en-IN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).replace(',','') : '';
const fmtHM   = (m) => { const n=Number(m)||0; if(!n) return ''; return n>=60?`${Math.floor(n/60)}h ${n%60}m`:`${n}m`; };

/* ─────────────────────────────────────────────────────────────────────── *
 *  VisitDetailModal — one visit in full, incl. check-in/out photos.        *
 *  Lists are fetched WITHOUT photos (base64, huge); this pulls the single  *
 *  record on demand.                                                       *
 * ─────────────────────────────────────────────────────────────────────── */
function VisitDetailModal({ visitId, users, onClose }){
  const [v, setV]       = useState(null);
  const [err, setErr]   = useState('');
  const [zoom, setZoom] = useState('');

  useEffect(()=>{
    let dead=false;
    api.visitGet(visitId)
      .then(d=>{ if(!dead) setV(d); })
      .catch(e=>{ if(!dead) setErr(e.message||'Could not load visit'); });
    return ()=>{ dead=true; };
  },[visitId]);

  const u        = v ? users?.[v.userId] : null;
  const inPhoto  = v ? (v.checkInPhoto || v.photo || '') : '';
  const outPhoto = v ? (v.checkOutPhoto || '') : '';

  const Row = ({label, children}) => (
    <div style={{display:'flex',gap:10,padding:'7px 0',borderBottom:'1px solid var(--b1)'}}>
      <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',width:110,flexShrink:0,paddingTop:2}}>{label}</div>
      <div style={{fontSize:12.5,color:'var(--t1)',minWidth:0,flex:1}}>{children}</div>
    </div>
  );

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:720,maxHeight:'88vh',overflowY:'auto'}}>
        {err && <div style={{color:'var(--red)',fontSize:13}}>{err}</div>}
        {!v && !err && <div style={{color:'var(--t3)',padding:20}}>Loading visit…</div>}
        {v && (<>
          <div className="row" style={{marginBottom:12,alignItems:'flex-start'}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:17,fontWeight:700,marginBottom:4}}>{v.dealerName}</div>
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:3,
                  background:v.status==='completed'?'rgba(52,211,153,.15)':'rgba(251,191,36,.15)',
                  color:v.status==='completed'?'#34d399':'#fbbf24'}}>
                  {v.status==='completed'?'COMPLETED':'IN PROGRESS'}
                </span>
                {v.autoClosed&&<span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:3,background:'rgba(148,163,184,.15)',color:'#94a3b8'}}>AUTO-CLOSED</span>}
                <span style={{fontSize:11,color:'var(--t3)'}}>
                  by <b style={{color:u?.color||'var(--t2)'}}>{v.userName||users?.[v.userId]?.name||v.userId}</b>
                </span>
              </div>
            </div>
            <div className="spacer"/>
            <button onClick={onClose} className="btn" style={{padding:'4px 9px'}}>✕</button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
            {[{p:inPhoto,l:'Check-in photo',c:'#34d399'},{p:outPhoto,l:'Check-out photo',c:'#fbbf24'}].map(x=>(
              <div key={x.l}>
                <div style={{fontSize:10,color:x.c,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:5,fontWeight:700}}>{x.l}</div>
                {x.p ? (
                  <img src={x.p} alt={x.l} onClick={()=>setZoom(x.p)}
                    style={{width:'100%',height:190,objectFit:'cover',borderRadius:9,cursor:'zoom-in',border:`1px solid ${x.c}44`}}/>
                ) : (
                  <div style={{width:'100%',height:190,borderRadius:9,border:'1px dashed var(--b2)',
                    display:'flex',alignItems:'center',justifyContent:'center',color:'var(--t3)',fontSize:11}}>No photo</div>
                )}
              </div>
            ))}
          </div>

          <Row label="Date">{v.dateStr || String(v.createdAt||'').slice(0,10)}</Row>
          <Row label="Checked in">{fmtTime(v.checkInTime)}</Row>
          <Row label="Checked out">{v.checkOutTime ? fmtTime(v.checkOutTime) : <span style={{color:'var(--yel)'}}>Still open</span>}</Row>
          <Row label="Duration">{v.durationMinutes ? fmtHM(v.durationMinutes) : '—'}</Row>
          {v.purpose && <Row label="Purpose">{String(v.purpose).replace(/^\[|\]$/g,'')}</Row>}
          <Row label="In address">
            {v.checkInAddress || v.address || '—'}
            {(v.checkInLat||v.lat) && (
              <a href={`https://www.google.com/maps?q=${v.checkInLat||v.lat},${v.checkInLng||v.lng}`}
                target="_blank" rel="noreferrer" style={{marginLeft:8,fontSize:11,color:'var(--acc)'}}>open map ↗</a>
            )}
          </Row>
          {v.checkOutAddress && (
            <Row label="Out address">
              {v.checkOutAddress}
              {v.checkOutLat && (
                <a href={`https://www.google.com/maps?q=${v.checkOutLat},${v.checkOutLng}`}
                  target="_blank" rel="noreferrer" style={{marginLeft:8,fontSize:11,color:'var(--acc)'}}>open map ↗</a>
              )}
            </Row>
          )}
          {v.checkInNote && <Row label="In remarks">{v.checkInNote}</Row>}
          <Row label="Discussion">{v.checkOutNote || v.comment || <span style={{color:'var(--t3)'}}>—</span>}</Row>
        </>)}
      </div>
      {zoom && (
        <div onClick={()=>setZoom('')} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.9)',zIndex:9999,
          display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',padding:20}}>
          <img src={zoom} alt="" style={{maxWidth:'100%',maxHeight:'100%',borderRadius:8}}/>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── *
 *  DataTable — one table engine shared by every report.                    *
 *  rows: [{ cells:[...], meta? }]                                          *
 *  columns: [{ label, w?, noFilter?, align?, render?(value,meta) }]         *
 * ─────────────────────────────────────────────────────────────────────── */
const LONG_TEXT_MIN = 28;   // cells longer than this get a hover tooltip

function DataTable({ columns, rows, loading, err, onRefresh, exportName, kpis=[],
                     onRowClick, onPageRowsChange, note, extraToolbar }){
  const [q,        setQ]        = useState('');
  const [colF,     setColF]     = useState({});
  const [sort,     setSort]     = useState({ i:-1, dir:1 });
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [hidden,   setHidden]   = useState({});
  const [showCols, setShowCols] = useState(false);
  const [tip,      setTip]      = useState(null);

  useEffect(()=>{ setPage(1); },[rows]);

  const showTip = (e, text) => {
    if(!text || String(text).length < LONG_TEXT_MIN) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ text:String(text), x: Math.min(r.left, window.innerWidth - 380), y: r.bottom + 6 });
  };

  const visibleIdx = columns.map((c,i)=>i).filter(i=>!hidden[i]);

  const filtered = useMemo(()=>{
    const ql = q.trim().toLowerCase();
    return rows.filter(r=>{
      if(ql && !r.cells.some(c=>String(c==null?'':c).toLowerCase().includes(ql))) return false;
      for(const [i,val] of Object.entries(colF)){
        if(!val) continue;
        if(!String(r.cells[i]==null?'':r.cells[i]).toLowerCase().includes(String(val).toLowerCase())) return false;
      }
      return true;
    });
  },[rows,q,colF]);

  const sorted = useMemo(()=>{
    if(sort.i < 0) return filtered;
    return [...filtered].sort((a,b)=>{
      const av=a.cells[sort.i], bv=b.cells[sort.i];
      const an=Number(av), bn=Number(bv);
      if(!isNaN(an)&&!isNaN(bn)&&av!==''&&bv!=='') return (an-bn)*sort.dir;
      return String(av==null?'':av).localeCompare(String(bv==null?'':bv))*sort.dir;
    });
  },[filtered,sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length/pageSize));
  const pageRows   = useMemo(()=>sorted.slice((page-1)*pageSize, page*pageSize),[sorted,page,pageSize]);
  useEffect(()=>{ if(page>totalPages) setPage(1); },[totalPages,page]);

  // Let the parent react to which rows are on screen (visits fetch photos).
  const pageKey = pageRows.map(r=>r.meta?.id||'').join(',');
  useEffect(()=>{ onPageRowsChange && onPageRowsChange(pageRows); /* eslint-disable-next-line */ },[pageKey]);

  const doExport = () => exportCSV(
    exportName + '_' + new Date().toISOString().slice(0,10) + '.csv',
    visibleIdx.map(i=>columns[i].label),
    sorted.map(r=>visibleIdx.map(i=>r.cells[i])));

  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:0,flex:1}}>
      {/* Toolbar */}
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',padding:'0 0 12px'}}>
        {kpis.map(k=>(
          <div key={k.label} style={{
            background:k.accent?`linear-gradient(135deg,${k.accent},${k.accent}cc)`:'var(--bg2)',
            color:k.accent?'#fff':'var(--t1)',
            border:k.accent?'none':'1px solid var(--b2)',
            borderRadius:9,padding:'8px 14px'}}>
            <div style={{fontSize:9,letterSpacing:'.1em',textTransform:'uppercase',opacity:k.accent?.85:1,
              color:k.accent?'#fff':'var(--t3)'}}>{k.label}</div>
            <div style={{fontSize:15,fontWeight:800}}>{k.value}</div>
          </div>
        ))}
        <div style={{flex:1}}/>
        {extraToolbar}
        <button onClick={doExport} className="btnp" style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12}}>
          <Download size={13}/> Export ({sorted.length})
        </button>
        <div style={{position:'relative'}}>
          <button onClick={()=>setShowCols(v=>!v)} className="btn" style={{fontSize:12}}>Columns</button>
          {showCols && (
            <div style={{position:'absolute',right:0,top:'calc(100% + 6px)',zIndex:40,background:'var(--bg1)',
              border:'1px solid var(--b2)',borderRadius:9,padding:8,minWidth:190,maxHeight:300,overflowY:'auto',
              boxShadow:'0 12px 30px rgba(0,0,0,.45)'}}>
              {columns.map((c,i)=>(
                <label key={i} style={{display:'flex',alignItems:'center',gap:7,padding:'4px 6px',fontSize:12,cursor:'pointer'}}>
                  <input type="checkbox" checked={!hidden[i]} onChange={()=>setHidden(h=>({...h,[i]:!h[i]}))}/>
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
        {onRefresh && <button onClick={onRefresh} disabled={loading} className="btn" style={{fontSize:12}}>{loading?'Loading…':'Refresh'}</button>}
        <div style={{position:'relative'}}>
          <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
          <input className="inp" placeholder="Search…" value={q}
            onChange={e=>{setQ(e.target.value);setPage(1);}}
            style={{width:190,fontSize:12,padding:'6px 10px 6px 28px'}}/>
        </div>
      </div>

      {err && <div style={{padding:14,color:'var(--red)',fontSize:12}}>{err}</div>}
      {loading && !rows.length && <div style={{padding:24,color:'var(--t3)',fontSize:12}}>Loading…</div>}
      {!loading && !rows.length && !err && (
        <div style={{padding:30,textAlign:'center',color:'var(--t3)',fontSize:12}}>No data for this selection.</div>
      )}

      {rows.length>0 && (
        <div className="card" style={{padding:0,overflow:'hidden',display:'flex',flexDirection:'column',minHeight:0,flex:1}}>
          <div className="scroll" style={{overflowX:'auto',overflowY:'auto',flex:1,minHeight:200}}>
            <table>
              <thead>
                <tr>
                  {visibleIdx.map(i=>{
                    const c=columns[i];
                    return (
                      <th key={i} onClick={()=>setSort(s=>s.i===i?{i,dir:-s.dir}:{i,dir:1})}
                        style={{minWidth:c.w||120,whiteSpace:'nowrap',cursor:'pointer',userSelect:'none',
                          textAlign:c.align||'left'}}>
                        {c.label}{sort.i===i?(sort.dir>0?' ↑':' ↓'):''}
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  {visibleIdx.map(i=>(
                    <th key={i} style={{padding:'4px 6px'}}>
                      {!columns[i].noFilter && (
                        <input className="inp" value={colF[i]||''}
                          onChange={e=>{setColF(f=>({...f,[i]:e.target.value}));setPage(1);}}
                          style={{width:'100%',fontSize:10.5,padding:'3px 6px',fontWeight:400,textTransform:'none',letterSpacing:0}}/>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r,ri)=>(
                  <tr key={r.meta?.id||ri}
                    onClick={onRowClick?()=>onRowClick(r.meta,r):undefined}
                    style={{cursor:onRowClick?'pointer':'default'}}>
                    {visibleIdx.map(i=>{
                      const c=columns[i], v=r.cells[i];
                      if(c.render) return <td key={i} style={{textAlign:c.align||'left'}}>{c.render(v,r.meta)}</td>;
                      return (
                        <td key={i}
                          onMouseEnter={e=>showTip(e,v)}
                          onMouseLeave={()=>setTip(null)}
                          style={{fontSize:11.5,color:'var(--t2)',maxWidth:c.w||160,textAlign:c.align||'left',
                            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                            cursor:String(v||'').length>=LONG_TEXT_MIN?'help':undefined}}>
                          {v===''||v==null?'—':String(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',padding:'10px 14px',borderTop:'1px solid var(--b1)'}}>
            <span style={{fontSize:11,color:'var(--t3)'}}>
              {sorted.length?((page-1)*pageSize+1):0}–{Math.min(page*pageSize,sorted.length)} of {sorted.length}
            </span>
            <select className="inp" value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1);}}
              style={{width:'auto',fontSize:11,padding:'4px 8px'}}>
              {[10,25,50,100].map(n=><option key={n} value={n}>{n} / page</option>)}
            </select>
            {note && <span style={{fontSize:11,color:'var(--t3)'}}>· {note}</span>}
            <div style={{flex:1}}/>
            <button className="btn" style={{fontSize:11,padding:'4px 9px'}} disabled={page<=1} onClick={()=>setPage(1)}>«</button>
            <button className="btn" style={{fontSize:11,padding:'4px 9px'}} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>‹</button>
            {Array.from({length:Math.min(5,totalPages)},(_,i)=>{
              const n = page<=3 ? i+1 : page>=totalPages-2 ? totalPages-4+i : page-2+i;
              if(n<1||n>totalPages) return null;
              return (
                <button key={n} onClick={()=>setPage(n)} className="btn"
                  style={{fontSize:11,padding:'4px 10px',
                    background:n===page?'var(--acc)':'var(--bg2)',
                    color:n===page?'#fff':'var(--t2)',
                    borderColor:n===page?'transparent':'var(--b2)'}}>{n}</button>
              );
            })}
            <button className="btn" style={{fontSize:11,padding:'4px 9px'}} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>›</button>
            <button className="btn" style={{fontSize:11,padding:'4px 9px'}} disabled={page>=totalPages} onClick={()=>setPage(totalPages)}>»</button>
          </div>
        </div>
      )}

      {tip && (
        <div style={{position:'fixed',left:tip.x,top:tip.y,zIndex:9998,maxWidth:360,
          background:'var(--bg1)',border:'1px solid var(--b2)',borderRadius:8,padding:'9px 11px',
          boxShadow:'0 12px 30px rgba(0,0,0,.5)',fontSize:12,lineHeight:1.5,color:'var(--t1)',
          whiteSpace:'pre-wrap',pointerEvents:'none'}}>{tip.text}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── *
 *  VisitsReport — the only report with inline photo thumbnails.            *
 * ─────────────────────────────────────────────────────────────────────── */
function VisitsReport({ fromDate, toDate, users }){
  const [items,  setItems]  = useState([]);
  const [loading,setLoading]= useState(false);
  const [err,    setErr]    = useState('');
  const [photos, setPhotos] = useState({});
  const [preview,setPreview]= useState(null);
  const [zoom,   setZoom]   = useState('');

  const load = useCallback(async ()=>{
    setLoading(true); setErr('');
    try {
      const d = await api.visitsList({ from: fromDate, to: toDate, limit: 5000, light: 1 });
      setItems(Array.isArray(d)?d:[]); setPhotos({});
    } catch(e){ setErr(e.message||'Could not load visits'); setItems([]); }
    setLoading(false);
  },[fromDate,toDate]);
  useEffect(()=>{ load(); },[load]);

  // Pull thumbnails only for the rows currently on screen.
  const onPageRows = useCallback((pageRows)=>{
    const need = pageRows.map(r=>r.meta?.id).filter(id=>id && photos[id]===undefined);
    if(!need.length) return;
    api.visitPhotos(need)
      .then(map=>setPhotos(p=>({ ...p, ...map })))
      .catch(()=>setPhotos(p=>{ const n={...p}; need.forEach(id=>{ n[id]={in:'',out:''}; }); return n; }));
  },[photos]);

  const Thumb = ({src}) => src
    ? <img src={src} alt="" onClick={e=>{e.stopPropagation();setZoom(src);}}
        style={{width:54,height:54,objectFit:'cover',borderRadius:6,cursor:'zoom-in',border:'1px solid var(--b2)'}}/>
    : <div style={{width:54,height:54,borderRadius:6,border:'1px dashed var(--b2)',
        display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,color:'var(--t3)'}}>none</div>;

  const columns = [
    { label:'Salesman',    w:130 },
    { label:'Party',       w:190, render:(v)=><span style={{fontSize:11.5,fontWeight:600,color:'var(--acc)'}}>{v}</span> },
    { label:'Status',      w:96,  render:(v)=>(
        <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:3,whiteSpace:'nowrap',
          background:v==='Completed'?'rgba(52,211,153,.15)':'rgba(251,191,36,.15)',
          color:v==='Completed'?'#34d399':'#fbbf24'}}>{v}</span>) },
    { label:'In Date',     w:140 },
    { label:'In Image',    w:76, noFilter:true, render:(_v,meta)=><Thumb src={photos[meta.id]?.in}/> },
    { label:'In Address',  w:230 },
    { label:'Purpose',     w:130 },
    { label:'In Remarks',  w:170 },
    { label:'Out Date',    w:140 },
    { label:'Out Image',   w:76, noFilter:true, render:(_v,meta)=><Thumb src={photos[meta.id]?.out}/> },
    { label:'Out Address', w:230 },
    { label:'Duration',    w:90 },
    { label:'Discussion',  w:260 },
  ];

  const rows = useMemo(()=>items.map(v=>({
    meta:{ id:v._id },
    cells:[
      v.userName || users?.[v.userId]?.name || v.userId || '',
      v.dealerName || '',
      v.status==='completed' ? 'Completed' : 'In progress',
      fmtDT(v.checkInTime),
      '', // image
      v.checkInAddress || v.address || '',
      String(v.purpose||'').replace(/^\[|\]$/g,''),
      v.checkInNote || '',
      fmtDT(v.checkOutTime),
      '', // image
      v.checkOutAddress || '',
      fmtHM(v.durationMinutes),
      v.checkOutNote || v.comment || '',
    ],
  })),[items,users]);

  const totalMin = items.reduce((s,v)=>s+(Number(v.durationMinutes)||0),0);
  const kpis = [
    { label:'Total time spent', value:`${Math.floor(totalMin/60)} Hrs ${totalMin%60} Min`, accent:'#7c3aed' },
    { label:'Visits',           value:items.length },
    { label:'Parties met',      value:new Set(items.map(v=>(v.dealerName||'').toLowerCase().trim()).filter(Boolean)).size },
  ];

  return (<>
    <DataTable columns={columns} rows={rows} loading={loading} err={err}
      onRefresh={load} exportName="Visits" kpis={kpis}
      onRowClick={(meta)=>setPreview(meta.id)}
      onPageRowsChange={onPageRows}
      note="click a row for photos & GPS"/>
    {preview && <VisitDetailModal visitId={preview} users={users} onClose={()=>setPreview(null)}/>}
    {zoom && (
      <div onClick={()=>setZoom('')} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.9)',zIndex:9999,
        display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',padding:20}}>
        <img src={zoom} alt="" style={{maxWidth:'100%',maxHeight:'100%',borderRadius:8}}/>
      </div>
    )}
  </>);
}

/* Generic API-backed report (attendance / leads / leaves) */
function ApiReport({ loader, columns, exportName, deps=[], kpis }){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');
  const load = useCallback(async ()=>{
    setLoading(true); setErr('');
    try { setRows(await loader()); }
    catch(e){ setErr(e.message||'Could not load'); setRows([]); }
    setLoading(false);
  // eslint-disable-next-line
  },deps);
  useEffect(()=>{ load(); },[load]);
  return <DataTable columns={columns} rows={rows} loading={loading} err={err}
    onRefresh={load} exportName={exportName} kpis={kpis?kpis(rows):[]}/>;
}

/* ─────────────────────────────────────────────────────────────────────── *
 *  Reports console                                                         *
 * ─────────────────────────────────────────────────────────────────────── */
export default function Reports({ dealers, users, currentUser, monthConfig, outstandingData }){
  const MO = monthConfig?.MO || [];
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const currentIdx = monthConfig?.currentIdx ?? Math.max(0, MO.length - 1);
  const [fromIdx, setFromIdx] = useState(currentIdx);
  const [toIdx,   setToIdx]   = useState(currentIdx);
  const today = new Date().toISOString().slice(0,10);
  const startOfMonth = today.slice(0,8) + '01';
  const [fromDate, setFromDate] = useState(startOfMonth);
  const [toDate,   setToDate]   = useState(today);
  const [active,   setActive]   = useState('visits');   // Visit opens by default

  const fromI = Math.min(fromIdx, toIdx);
  const toI   = Math.max(fromIdx, toIdx);
  const rangeMonths = MO.slice(fromI, toI + 1);
  const rangeLabel  = rangeMonths.length === 1 ? rangeMonths[0] : (MO[fromI] + ' to ' + MO[toI]);

  if(!isStaff){
    return (
      <div className="fade" style={{padding:24, textAlign:'center', color:'var(--t2)'}}>
        <AlertTriangle size={28} style={{margin:'0 auto 8px', color:'var(--t3)'}}/>
        <div style={{fontSize:14}}>Reports are admin-only.</div>
      </div>
    );
  }

  const nameOf = (id) => (id && users?.[id]?.name) || id || '';

  // ── Sales reports (built from data already in the app) ────────────────
  const dealerPerf = useMemo(()=>{
    const columns = [
      { label:'Salesman', w:130 }, { label:'Dealer', w:200 }, { label:'City', w:110 },
      { label:'State', w:110 }, { label:'Zone', w:90 }, { label:'Status', w:100 }, { label:'Category', w:120 },
    ];
    rangeMonths.forEach(m=>{ columns.push({label:m+' Tgt',w:90,align:'right'},{label:m+' Ach',w:90,align:'right'},{label:m+' %',w:70,align:'right'}); });
    columns.push({label:'Total Tgt',w:100,align:'right'},{label:'Total Ach',w:100,align:'right'},{label:'Total %',w:80,align:'right'});
    const rows = (dealers||[]).map(d=>{
      const cells=[nameOf(d.salesman), d.name, d.city||'', d.state||'', d.zone||'', d.status||'', d.category||''];
      let tT=0,tA=0;
      rangeMonths.forEach((m,i)=>{
        const mi=fromI+i, t=monthTarget(d,mi)||0, a=Number(d.months?.[mi])||0;
        cells.push(t,a,t>0?Math.round(a/t*100)+'%':''); tT+=t; tA+=a;
      });
      cells.push(tT,tA,tT>0?Math.round(tA/tT*100)+'%':'');
      return { cells };
    });
    return { columns, rows };
  },[dealers,rangeMonths,fromI,users]);

  const salesmanSummary = useMemo(()=>{
    const columns=[{label:'Salesman',w:150},{label:'Dealers',w:90,align:'right'}];
    rangeMonths.forEach(m=>{ columns.push({label:m+' Tgt',w:90,align:'right'},{label:m+' Ach',w:90,align:'right'},{label:m+' %',w:70,align:'right'}); });
    columns.push({label:'Total Tgt',w:100,align:'right'},{label:'Total Ach',w:100,align:'right'},{label:'Total %',w:80,align:'right'});
    const by={};
    (dealers||[]).forEach(d=>{ const id=d.salesman||'_unassigned'; (by[id]=by[id]||{list:[],name:nameOf(id)}).list.push(d); });
    const rows=Object.values(by).map(g=>{
      const cells=[g.name,g.list.length]; let tT=0,tA=0;
      rangeMonths.forEach((m,i)=>{
        const mi=fromI+i;
        const t=g.list.reduce((s,d)=>s+(monthTarget(d,mi)||0),0);
        const a=g.list.reduce((s,d)=>s+(Number(d.months?.[mi])||0),0);
        cells.push(t,a,t>0?Math.round(a/t*100)+'%':''); tT+=t; tA+=a;
      });
      cells.push(tT,tA,tT>0?Math.round(tA/tT*100)+'%':'');
      return { cells };
    });
    return { columns, rows };
  },[dealers,rangeMonths,fromI,users]);

  const userMaster = useMemo(()=>{
    const columns=[
      {label:'User ID',w:110},{label:'Name',w:150},{label:'Role',w:110},{label:'Active',w:80},
      {label:'Approver',w:130},{label:'Perm States',w:160},{label:'Perm Cities',w:160},
      {label:'Perm Zones',w:130},{label:'Perm Salesmen',w:180},{label:'Pages',w:200},
      {label:'Features',w:160},{label:'Sheet URL',w:200},
    ];
    const order={superadmin:0,admin:1,employee:2,salesman:3};
    const rows=Object.values(users||{})
      .sort((a,b)=>(order[a.role]??4)-(order[b.role]??4)||(a.name||'').localeCompare(b.name||''))
      .map(u=>{ const p=u.permissions||{}; return { cells:[
        u.id,u.name,u.role,u.active===false?'No':'Yes',
        u.approver?nameOf(u.approver):'',
        (p.states||[]).join('; '),(p.cities||[]).join('; '),(p.zones||[]).join('; '),
        (p.salesmen||[]).map(s=>nameOf(s)).join('; '),
        (p.pages||[]).join('; '),(p.features||[]).join('; '),u.url||'',
      ]};});
    return { columns, rows };
  },[users]);

  // ── Month-over-month comparison ──────────────────────────────────────
  // Anchored on the "To" month, compared against the month before it and the
  // same month a year earlier.
  //
  // This is deliberately monthly, not daily. A Sale row is one dealer × one
  // sub-category × one MONTH (see models/Sale.js) — there is no per-sale date
  // anywhere in the pipeline, and createdAt is the upload timestamp, not the
  // trade date. Month is the finest granularity the data actually supports.
  const monthCompare = useMemo(()=>{
    const curI = toI, prevI = toI - 1, lyI = toI - 12;
    const has  = i => i >= 0 && i < MO.length;

    const columns = [
      { label:'Salesman', w:130 }, { label:'Dealer', w:220 }, { label:'City', w:110 },
      { label:MO[curI] || 'This', w:95, align:'right' },
    ];
    if(has(prevI)) columns.push({label:MO[prevI],w:95,align:'right'},{label:'Δ MoM',w:90,align:'right'},{label:'MoM %',w:85,align:'right'});
    if(has(lyI))   columns.push({label:MO[lyI],  w:95,align:'right'},{label:'Δ YoY',w:90,align:'right'},{label:'YoY %',w:85,align:'right'});

    // "new" rather than a bogus percentage — growth off a zero base is undefined,
    // and printing 100% or ∞ there quietly misleads.
    const pctOf = (cur, base) => base > 0 ? Math.round((cur - base) / base * 100) + '%' : (cur > 0 ? 'new' : '');

    let tCur=0, tPrev=0, tLy=0, up=0, down=0, started=0, stopped=0;
    const rows = (dealers||[])
      .map(d=>{
        const cur  = Number(d.months?.[curI]) || 0;
        const prev = has(prevI) ? Number(d.months?.[prevI]) || 0 : 0;
        const ly   = has(lyI)   ? Number(d.months?.[lyI])   || 0 : 0;
        return { d, cur, prev, ly };
      })
      // Drop dealers with nothing in any of the three months — otherwise the
      // report is mostly blank rows for dealers who simply weren't active.
      .filter(r => r.cur || r.prev || r.ly)
      .map(r=>{
        const { d, cur, prev, ly } = r;
        tCur+=cur; tPrev+=prev; tLy+=ly;
        if(has(prevI)){
          if(cur>prev) up++; else if(cur<prev) down++;
          if(prev===0 && cur>0) started++;
          if(prev>0 && cur===0) stopped++;
        }
        const cells = [nameOf(d.salesman), d.name, d.city||'', cur];
        if(has(prevI)) cells.push(prev, cur-prev, pctOf(cur,prev));
        if(has(lyI))   cells.push(ly,  cur-ly,   pctOf(cur,ly));
        return { cells, _mov: Math.abs(cur - prev) };
      })
      // Biggest movers first, in either direction — a dealer who collapsed
      // matters as much as one who doubled.
      .sort((a,b)=> b._mov - a._mov)
      .map(({_mov, ...row}) => row);

    const n = v => v.toLocaleString('en-IN');
    const sign = v => (v >= 0 ? '+' : '') + n(v);
    const kpis = [{ label: MO[curI] || 'This month', value: n(tCur) }];
    if(has(prevI)) kpis.push(
      { label: MO[prevI], value: n(tPrev) },
      { label: 'Change',  value: sign(tCur - tPrev) + (tPrev > 0 ? ` (${Math.round((tCur-tPrev)/tPrev*100)}%)` : '') },
      { label: 'Up / Down',         value: `${up} / ${down}` },
      { label: 'Started / Stopped', value: `${started} / ${stopped}` },
    );
    if(has(lyI)) kpis.push({ label: `vs ${MO[lyI]}`, value: sign(tCur - tLy) });
    return { columns, rows, kpis };
  },[dealers,toI,MO,users]);

  // ── Report registry — drives the left rail ───────────────────────────
  const REPORTS = [
    { id:'visits',     label:'Visit',              group:'CRM',   icon:ClipboardList, color:'var(--pur)' },
    { id:'attendance', label:'Attendance',         group:'CRM',   icon:Camera,        color:'var(--yel)' },
    { id:'leads',      label:'Leads',              group:'CRM',   icon:UserCheck,     color:'#22d3ee' },
    { id:'leaves',     label:'Leaves',             group:'CRM',   icon:Plane,         color:'#fb923c' },
    { id:'monthCompare',label:'Month Comparison',  group:'Sales', icon:Activity,      color:'#0ea5e9' },
    { id:'dealerPerf', label:'Dealer Performance', group:'Sales', icon:TrendingUp,    color:'#6366f1' },
    { id:'smSummary',  label:'Salesman Summary',   group:'Sales', icon:Users,         color:'var(--grn)' },
    { id:'outstanding',label:'Outstanding',        group:'Sales', icon:AlertTriangle, color:'var(--red)' },
    { id:'category',   label:'Category Drill-down',group:'Sales', icon:Layers,        color:'#818cf8' },
    { id:'userMaster', label:'User Master',        group:'Admin', icon:Users,         color:'#a5b4fc' },
  ];
  const groups = ['CRM','Sales','Admin'];
  const activeReport = REPORTS.find(r=>r.id===active) || REPORTS[0];
  const usesDates  = activeReport.group==='CRM';
  const usesMonths = activeReport.group==='Sales';

  const renderActive = () => {
    switch(active){
      case 'visits':
        return <VisitsReport fromDate={fromDate} toDate={toDate} users={users}/>;
      case 'attendance':
        return <ApiReport exportName="Attendance" deps={[fromDate,toDate]}
          columns={[{label:'User',w:140},{label:'Type',w:80},{label:'Date',w:110},{label:'Time',w:90},
                    {label:'Address',w:280},{label:'City',w:120},{label:'State',w:120},
                    {label:'Lat',w:100},{label:'Lng',w:100},{label:'Note',w:200}]}
          loader={async ()=>{
            const items = await api.attListAttendance({ from: fromDate, to: toDate });
            return (items||[]).map(x=>({ cells:[
              x.userName||x.userId, x.type==='in'?'IN':'OUT',
              x.dateStr||String(x.createdAt||'').slice(0,10),
              x.createdAt?new Date(x.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'',
              x.address||'', x.city||'', x.state||'', x.lat??'', x.lng??'', x.note||'',
            ]}));
          }}
          kpis={rows=>[{label:'Punches',value:rows.length}]}/>;
      case 'leads':
        return <ApiReport exportName="Leads" deps={[]}
          columns={[{label:'Name',w:160},{label:'Company',w:160},{label:'Phone',w:120},{label:'Email',w:180},
                    {label:'City',w:120},{label:'State',w:120},{label:'Source',w:110},{label:'Status',w:110},
                    {label:'Assigned To',w:140},{label:'Value',w:100,align:'right'},{label:'Notes',w:220},
                    {label:'Updates',w:90,align:'right'},{label:'Last Update',w:240},{label:'Created',w:140}]}
          loader={async ()=>{
            const items = await api.leadsList({});
            return (items||[]).map(L=>({ cells:[
              L.name,L.company||'',L.phone||'',L.email||'',L.city||'',L.state||'',
              L.source||'',L.status||'NEW',L.assignedName||L.assignedTo||'',L.value||0,L.notes||'',
              L.updates?.length||0,
              L.updates?.length?(L.updates[L.updates.length-1].byName+': '+(L.updates[L.updates.length-1].comment||L.updates[L.updates.length-1].status||'')):'',
              fmtTime(L.createdAt),
            ]}));
          }}
          kpis={rows=>[{label:'Leads',value:rows.length}]}/>;
      case 'leaves':
        return <ApiReport exportName="Leaves" deps={[]}
          columns={[{label:'User',w:140},{label:'Type',w:110},{label:'From',w:110},{label:'To',w:110},
                    {label:'Days',w:80,align:'right'},{label:'Status',w:110},{label:'Reason',w:240},
                    {label:'Reviewed By',w:140},{label:'Review Comment',w:220},{label:'Applied On',w:140}]}
          loader={async ()=>{
            const items = await api.leavesList({});
            return (items||[]).map(l=>({ cells:[
              l.userName||l.userId, l.leaveType||'', l.fromDate||'', l.toDate||'',
              Math.max(1, Math.round((new Date(l.toDate)-new Date(l.fromDate))/86400000)+1),
              l.status||'', l.reason||'', l.reviewedByName||'', l.reviewComment||'', fmtTime(l.createdAt),
            ]}));
          }}
          kpis={rows=>[{label:'Applications',value:rows.length}]}/>;
      case 'monthCompare':
        return <DataTable columns={monthCompare.columns} rows={monthCompare.rows}
          exportName={`MonthComparison-${MO[toI]||''}`} kpis={monthCompare.kpis}/>;
      case 'dealerPerf':
        return <DataTable columns={dealerPerf.columns} rows={dealerPerf.rows} exportName="DealerPerformance"
          kpis={[{label:'Dealers',value:dealerPerf.rows.length},{label:'Months',value:rangeMonths.length}]}/>;
      case 'smSummary':
        return <DataTable columns={salesmanSummary.columns} rows={salesmanSummary.rows} exportName="SalesmanSummary"
          kpis={[{label:'Salesmen',value:salesmanSummary.rows.length},{label:'Months',value:rangeMonths.length}]}/>;
      case 'outstanding':
        return <OutstandingReport dealers={dealers} users={users} outstandingData={outstandingData}/>;
      case 'userMaster':
        return <DataTable columns={userMaster.columns} rows={userMaster.rows} exportName="UserMaster"
          kpis={[{label:'Users',value:userMaster.rows.length}]}/>;
      case 'category':
        return <div style={{flex:1,minHeight:0,overflowY:'auto'}}>
          <CategoryDealerDrill rangeMonths={rangeMonths} users={users}/>
        </div>;
      default: return null;
    }
  };

  return (
    <div className="fade" style={{display:'flex', gap:14, alignItems:'stretch',
      height:'calc(100vh - 150px)', minHeight:520}}>

      {/* ── Left rail: every report ─────────────────────────────────── */}
      <div style={{width:212, flexShrink:0, display:'flex', flexDirection:'column',
        background:'var(--bg1)', border:'1px solid var(--b1)', borderRadius:12, overflow:'hidden'}}>
        <div style={{padding:'12px 14px', borderBottom:'1px solid var(--b1)'}}>
          <div style={{fontSize:10,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em'}}>Admin</div>
          <div style={{fontSize:15,fontWeight:700,marginTop:2}}>Reports</div>
        </div>
        <div style={{overflowY:'auto',flex:1,padding:'6px 0'}}>
          {groups.map(g=>(
            <div key={g}>
              <div style={{fontSize:9,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.12em',
                padding:'10px 14px 4px'}}>{g}</div>
              {REPORTS.filter(r=>r.group===g).map(r=>{
                const on = r.id===active;
                const Icon = r.icon;
                return (
                  <div key={r.id} onClick={()=>setActive(r.id)}
                    style={{display:'flex',alignItems:'center',gap:9,padding:'9px 14px',cursor:'pointer',
                      background:on?'var(--bg2)':'transparent',
                      borderLeft:`3px solid ${on?r.color:'transparent'}`,
                      color:on?'var(--t1)':'var(--t2)',fontWeight:on?600:400,fontSize:12.5}}>
                    <Icon size={14} color={on?r.color:'var(--t3)'}/>
                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Content pane ────────────────────────────────────────────── */}
      <div style={{flex:1, minWidth:0, display:'flex', flexDirection:'column', minHeight:0}}>
        {/* Header + the filter this report actually uses */}
        <div className="card" style={{marginBottom:12, display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:9,minWidth:0}}>
            <div style={{width:32,height:32,borderRadius:8,background:activeReport.color+'22',
              color:activeReport.color,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <activeReport.icon size={16}/>
            </div>
            <div>
              <div style={{fontSize:15,fontWeight:700}}>{activeReport.label} Report</div>
              <div style={{fontSize:11,color:'var(--t3)'}}>
                {usesDates ? `${fromDate} → ${toDate}` : usesMonths ? rangeLabel : 'All records'}
              </div>
            </div>
          </div>
          <div style={{flex:1}}/>
          {usesDates && (
            <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
              <input type="date" className="inp" value={fromDate} max={toDate||undefined}
                onChange={e=>setFromDate(e.target.value)} style={{padding:'6px 10px',fontSize:12,width:'auto'}}/>
              <span style={{color:'var(--t3)'}}>→</span>
              <input type="date" className="inp" value={toDate} min={fromDate||undefined}
                onChange={e=>setToDate(e.target.value)} style={{padding:'6px 10px',fontSize:12,width:'auto'}}/>
              {[['Today',0],['7d',-6],['30d',-29]].map(([lbl,off])=>(
                <button key={lbl} className="btn" style={{fontSize:11,padding:'4px 9px'}}
                  onClick={()=>{
                    const d=new Date(); d.setDate(d.getDate()+off);
                    const s=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    const t=new Date();
                    setFromDate(s); setToDate(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`);
                  }}>{lbl}</button>
              ))}
            </div>
          )}
          {usesMonths && (
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <select className="inp" value={fromIdx} onChange={e=>setFromIdx(Number(e.target.value))}
                style={{padding:'6px 10px',fontSize:12,width:'auto'}}>
                {MO.map((m,i)=><option key={m+i} value={i}>{m}</option>)}
              </select>
              <span style={{color:'var(--t3)'}}>→</span>
              <select className="inp" value={toIdx} onChange={e=>setToIdx(Number(e.target.value))}
                style={{padding:'6px 10px',fontSize:12,width:'auto'}}>
                {MO.map((m,i)=><option key={m+i} value={i}>{m}</option>)}
              </select>
            </div>
          )}
        </div>

        {renderActive()}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── *
 *  OutstandingReport — amounts per month + every follow-up remark.         *
 * ─────────────────────────────────────────────────────────────────────── */
function OutstandingReport({ dealers, users, outstandingData }){
  const [rows,setRows]       = useState([]);
  const [columns,setColumns] = useState([]);
  const [loading,setLoading] = useState(false);
  const [err,setErr]         = useState('');

  const load = useCallback(async ()=>{
    setLoading(true); setErr('');
    try {
      let followups=[];
      try { followups = await api.getFollowups(); } catch(e){ /* amounts only */ }
      const norm=(s)=>String(s||'').trim().toLowerCase();
      const nameOf=(id)=>(id&&users?.[id]?.name)||id||'';
      const dealerSm={}; (dealers||[]).forEach(d=>{ dealerSm[norm(d.name)]=d.salesman; });
      const byDealer={};
      (followups||[]).forEach(f=>{ (byDealer[norm(f.dealerName)]=byDealer[norm(f.dealerName)]||[]).push(f); });
      Object.values(byDealer).forEach(a=>a.sort((x,y)=>String(x.followupDate||x.createdAt||'').localeCompare(String(y.followupDate||y.createdAt||''))));

      const monthCols=Object.keys(outstandingData?.[0]?.monthlyOutstanding||{});
      const cols=[{label:'Dealer',w:200},{label:'Salesman',w:130},
        {label:'Latest O/S',w:120,align:'right'},{label:'Latest Month',w:110}];
      monthCols.forEach(m=>cols.push({label:m,w:110,align:'right'}));
      ['Entry Date','Entry Amount','Reason','Remark','Applies To','Status','Type',
       'Collected','Collected On','Proof','Logged By','Logged On']
        .forEach(l=>cols.push({label:l,w:l==='Remark'?260:130}));

      const BLANK=['','','','','','','','','','','',''];
      const cellsOf=(f)=>[
        f.followupDate||String(f.createdAt||'').slice(0,10), f.amount||0, f.reason||'', f.comment||'',
        Array.isArray(f.months)?f.months.join(' | '):'', f.status||'', f.type||'followup',
        f.collectedAmount||0, fmtTime(f.collectedAt), f.paymentProof?'Yes':'No',
        nameOf(f.createdBy), fmtTime(f.createdAt),
      ];
      const out=[]; const seen=new Set();
      (outstandingData||[]).forEach(d=>{
        const latestMonth=monthCols.length?monthCols[monthCols.length-1]:'';
        const base=[d.name, nameOf(dealerSm[norm(d.name)]), d.latestOutstanding||0, latestMonth];
        monthCols.forEach(m=>base.push(d.monthlyOutstanding?.[m]||0));
        const es=byDealer[norm(d.name)]||[]; seen.add(norm(d.name));
        if(!es.length) out.push({cells:[...base,...BLANK]});
        else es.forEach(f=>out.push({cells:[...base,...cellsOf(f)]}));
      });
      Object.keys(byDealer).forEach(k=>{
        if(seen.has(k)) return;
        const f0=byDealer[k][0];
        const base=[f0.dealerName, nameOf(f0.salesman)||f0.salesman||'','',''];
        monthCols.forEach(()=>base.push(''));
        byDealer[k].forEach(f=>out.push({cells:[...base,...cellsOf(f)]}));
      });
      setColumns(cols); setRows(out);
    } catch(e){ setErr(e.message||'Could not build report'); }
    setLoading(false);
  },[dealers,users,outstandingData]);
  useEffect(()=>{ load(); },[load]);

  return <DataTable columns={columns} rows={rows} loading={loading} err={err}
    onRefresh={load} exportName="Outstanding_Detailed"
    kpis={[{label:'Rows',value:rows.length},{label:'Parties',value:(outstandingData||[]).length}]}
    note="one row per remark"/>;
}

/* ─────────────────────────────────────────────────────────────────────── *
 *  CategoryDealerDrill                                                    *
 *                                                                         *
 *  Lists every Category Type for the selected month range. Click one →    *
 *  expands to show its sub-categories. Click a sub-category → shows the   *
 *  exact dealers who gave sale in that sub-category, with quantity and    *
 *  salesman, sorted by qty descending. Each level has a CSV export.       *
 * ─────────────────────────────────────────────────────────────────────── */
function CategoryDealerDrill({ rangeMonths, users }) {
  const [loading, setLoading]   = useState(false);
  const [rows, setRows]         = useState([]);        // raw Sale rows across months
  const [openCat, setOpenCat]   = useState(null);
  const [openSub, setOpenSub]   = useState(null);

  // Fetch raw sale rows for the picked month range, once
  useEffect(() => {
    if (!rangeMonths || rangeMonths.length === 0) { setRows([]); return; }
    const yms = rangeMonths.map(moToYM).filter(Boolean);
    if (!yms.length) { setRows([]); return; }
    const from = yms.slice().sort()[0];
    const to   = yms.slice().sort().slice(-1)[0];
    let cancelled = false;
    setLoading(true);
    api.salesRaw({ from, to, limit: 50000 })
      .then(r => { if (!cancelled) setRows(r.rows || []); })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rangeMonths.join('|')]);

  // Roll up to category → { total, subs: { sub: { total, dealers: { name: { qty, sm } } } } }
  const tree = useMemo(() => {
    const out = new Map();
    for (const r of rows) {
      const cat = (r.category || '(No Category)').trim();
      const sub = (r.subCategory || '(No Sub)').trim();
      const dealer = (r.dealerName || '(Unknown)').trim();
      const sm = (r.salesman || '').trim();
      const qty = Number(r.qty) || 0;
      if (!out.has(cat)) out.set(cat, { total: 0, subs: new Map() });
      const C = out.get(cat);
      C.total += qty;
      if (!C.subs.has(sub)) C.subs.set(sub, { total: 0, dealers: new Map() });
      const S = C.subs.get(sub);
      S.total += qty;
      const D = S.dealers.get(dealer) || { name: dealer, qty: 0, sm };
      D.qty += qty;
      if (!D.sm && sm) D.sm = sm;
      S.dealers.set(dealer, D);
    }
    return out;
  }, [rows]);

  const totalSales = useMemo(() => {
    let s = 0;
    for (const v of tree.values()) s += v.total;
    return s;
  }, [tree]);

  // Sorted category list, biggest first
  const catList = useMemo(() => {
    return [...tree.entries()]
      .map(([name, v]) => ({ name, total: v.total, subs: v.subs }))
      .sort((a, b) => b.total - a.total);
  }, [tree]);

  // CSV export of the entire flattened drill-down (cat × sub × dealer × qty)
  const exportFlat = () => {
    const out = [];
    for (const [cat, C] of tree.entries()) {
      for (const [sub, S] of C.subs.entries()) {
        for (const D of S.dealers.values()) {
          out.push([cat, sub, D.name, users[D.sm]?.name || D.sm || '', D.qty]);
        }
      }
    }
    if (!out.length) { notify.info('Nothing to export'); return; }
    exportCSV(
      'CategoryDealerDrill_' + new Date().toISOString().slice(0,10) + '.csv',
      ['Category', 'Sub-Category', 'Dealer', 'Salesman', 'Qty'],
      out,
    );
  };

  return (
    <div className="card" style={{display:'flex', flexDirection:'column', gap:8, borderLeft:'3px solid #f472b6'}}>
      <div style={{display:'flex', alignItems:'center', gap:10, padding:'4px 0 8px'}}>
        <div style={{
          width:36, height:36, borderRadius:8,
          background:'rgba(244,114,182,0.15)', color:'#f472b6',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Layers size={18}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:700}}>Category → Sub-Category → Dealers</div>
          <div style={{fontSize:11, color:'var(--t3)'}}>
            Click a category to expand. Click a sub-category to see the exact dealers who gave sale in it.
            {totalSales > 0 && <> · Total in range: <b style={{color:'var(--grn)'}}>{Number(totalSales).toLocaleString('en-IN')}</b></>}
          </div>
        </div>
        <button className="btn" onClick={exportFlat} disabled={!rows.length}
          style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:11}}>
          <Download size={12}/> Export CSV
        </button>
      </div>

      {loading && <div style={{fontSize:12, color:'var(--t3)', padding:14, textAlign:'center'}}>Loading category sales…</div>}
      {!loading && catList.length === 0 && (
        <div style={{fontSize:12, color:'var(--t3)', padding:14, textAlign:'center', background:'var(--bg1)', borderRadius:8}}>
          No category-wise sales found for this month range. Upload from Monthly Entry → Bulk Excel.
        </div>
      )}

      {/* Category rows */}
      <div style={{display:'flex', flexDirection:'column', gap:4}}>
        {catList.map(C => {
          const isOpen = openCat === C.name;
          const pct = totalSales ? (C.total / totalSales * 100) : 0;
          return (
            <div key={C.name} style={{border:'1px solid var(--b1)', borderRadius:8, overflow:'hidden'}}>
              <div
                onClick={() => { setOpenCat(isOpen ? null : C.name); setOpenSub(null); }}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 12px', cursor:'pointer',
                  background: isOpen ? 'rgba(99,102,241,.08)' : 'transparent',
                }}>
                {isOpen ? <ChevronDown size={14} color="var(--acc)"/> : <ChevronRight size={14} color="var(--t3)"/>}
                <div style={{flex:1, fontSize:13, fontWeight:600}}>{C.name}</div>
                <div style={{fontSize:11, color:'var(--t3)'}}>{[...C.subs.keys()].length} sub-cats</div>
                <div style={{fontSize:11, color:'var(--t3)', width:60, textAlign:'right'}}>{pct.toFixed(1)}%</div>
                <div style={{fontSize:14, fontWeight:700, color:'var(--grn)', minWidth:70, textAlign:'right'}}>
                  {Number(C.total).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Sub-categories */}
              {isOpen && (
                <div style={{padding:'2px 12px 10px 28px', background:'var(--bg1)'}}>
                  {[...C.subs.entries()].sort((a,b) => b[1].total - a[1].total).map(([subName, S]) => {
                    const isSubOpen = openSub === C.name + '|' + subName;
                    return (
                      <div key={subName} style={{borderTop:'1px solid var(--b1)'}}>
                        <div
                          onClick={() => setOpenSub(isSubOpen ? null : C.name + '|' + subName)}
                          style={{
                            display:'flex', alignItems:'center', gap:10,
                            padding:'8px 10px', cursor:'pointer',
                            background: isSubOpen ? 'rgba(244,114,182,.06)' : 'transparent',
                          }}>
                          {isSubOpen ? <ChevronDown size={12} color="#f472b6"/> : <ChevronRight size={12} color="var(--t3)"/>}
                          <div style={{flex:1, fontSize:12, fontWeight:500, color:'var(--t2)'}}>{subName}</div>
                          <div style={{fontSize:11, color:'var(--t3)'}}>{S.dealers.size} dealers</div>
                          <div style={{fontSize:13, fontWeight:700, color:'var(--pur)', minWidth:60, textAlign:'right'}}>
                            {Number(S.total).toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Dealers list */}
                        {isSubOpen && (
                          <div style={{padding:'4px 8px 10px 24px'}}>
                            <table style={{width:'100%', fontSize:12}}>
                              <thead>
                                <tr style={{color:'var(--t3)', fontSize:10, textTransform:'uppercase', letterSpacing:'.06em'}}>
                                  <th style={{textAlign:'left', padding:'4px 6px'}}>Dealer</th>
                                  <th style={{textAlign:'left', padding:'4px 6px'}}>Salesman</th>
                                  <th style={{textAlign:'right', padding:'4px 6px'}}>Qty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...S.dealers.values()].sort((a,b) => b.qty - a.qty).map(D => (
                                  <tr key={D.name} style={{borderTop:'1px solid var(--b1)'}}>
                                    <td style={{padding:'5px 6px', color:'var(--t1)', fontWeight:500}}>{D.name}</td>
                                    <td style={{padding:'5px 6px', color:'var(--t3)'}}>{users[D.sm]?.name || D.sm || '—'}</td>
                                    <td style={{padding:'5px 6px', textAlign:'right', color:'var(--grn)', fontWeight:600}}>
                                      {Number(D.qty).toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div style={{display:'flex', justifyContent:'flex-end', marginTop:6}}>
                              <button className="btn" style={{fontSize:10, padding:'3px 8px'}}
                                onClick={() => {
                                  exportCSV(
                                    'Dealers_' + C.name + '_' + subName + '.csv',
                                    ['Dealer','Salesman','Qty'],
                                    [...S.dealers.values()].sort((a,b)=>b.qty-a.qty).map(D=>[D.name, users[D.sm]?.name || D.sm || '', D.qty]),
                                  );
                                }}>
                                <Download size={10}/> Download this slice
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
