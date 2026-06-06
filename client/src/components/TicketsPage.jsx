// Support tickets — any user can raise a ticket with description +
// optional screenshot; gets back a unique ticket number (STP-0001).
// User sees: only their own tickets + status.
// Admin sees: all tickets + can change status / assign / comment.

import React, { useEffect, useRef, useState } from 'react';
import {
  LifeBuoy, Plus, RefreshCw, Send, Trash2, X, Camera, ImageIcon,
  Download,
} from 'lucide-react';
import { api } from '../api';
import { notify, confirmDialog } from './Toast';
import { VoiceTextarea } from './VoiceInput';

const STATUSES   = ['OPEN','IN_PROGRESS','RESOLVED','CLOSED','REOPENED'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];
const CATEGORIES = ['Bug','Feature','Question','UI Issue','Data Issue','Other'];
const STATUS_COLOR = {
  OPEN:'#3b82f6', IN_PROGRESS:'#fbbf24', RESOLVED:'#34d399',
  CLOSED:'#94a3b8', REOPENED:'#f87171',
};
const PRIORITY_COLOR = {
  LOW:'#94a3b8', MEDIUM:'#a5b4fc', HIGH:'#fb923c', URGENT:'#f87171',
};

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : '';

// Same compression helper used elsewhere — JPEG ≤900px, ~70% quality
async function fileToDataURL(file, maxDim=1100, quality=0.78){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error('Read failed'));
    r.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Bad image'));
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width  = Math.round(width  * scale);
        height = Math.round(height * scale);
        const c = document.createElement('canvas');
        c.width = width; c.height = height;
        c.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(c.toDataURL('image/jpeg', quality));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

function ScreenshotInput({ photo, setPhoto, label='Attach screenshot' }){
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const onPick = async (e) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if(!f) return;
    setBusy(true);
    try { setPhoto(await fileToDataURL(f)); }
    catch(err){ notify.error('Image: ' + err.message); }
    setBusy(false);
  };
  return (
    <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
      <input ref={ref} type="file" accept="image/*" style={{display:'none'}} onChange={onPick}/>
      <button type="button" onClick={()=>ref.current?.click()} disabled={busy}
        className="btn"
        style={{display:'inline-flex', alignItems:'center', gap:6, padding:'8px 14px'}}>
        <Camera size={14}/> {busy ? 'Compressing…' : (photo ? 'Replace screenshot' : label)}
      </button>
      {photo && (
        <div style={{position:'relative'}}>
          <img src={photo} alt="" style={{width:64, height:64, objectFit:'cover', borderRadius:6, border:'1px solid var(--b2)'}}/>
          <button type="button" onClick={()=>setPhoto('')}
            style={{position:'absolute', top:-6, right:-6, background:'#dc2626', color:'#fff', border:'none', borderRadius:'50%', width:18, height:18, cursor:'pointer'}}>
            <X size={10}/>
          </button>
        </div>
      )}
    </div>
  );
}

function exportCSV(filename, headers, rows){
  if(!rows || rows.length === 0){ notify.info('Nothing to export'); return; }
  const esc = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
  notify.success('Exported ' + rows.length + ' rows');
}

export default function TicketsPage({ users, currentUser }){
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [zoom, setZoom] = useState('');

  const [form, setForm] = useState({
    title:'', description:'', category:'Bug', priority:'MEDIUM', screenshot:'',
  });

  const load = async () => {
    setLoading(true);
    try {
      const q = {};
      if(filterStatus) q.status = filterStatus;
      const data = await api.ticketsList(q);
      setItems(data || []);
    } catch(e){ notify.error('Load tickets: ' + e.message); }
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [filterStatus]);

  const create = async () => {
    if(!form.title.trim()){ notify.error('Title required'); return; }
    try {
      const res = await api.ticketsCreate(form);
      notify.success('Ticket raised: ' + res.ticketNo);
      setForm({ title:'', description:'', category:'Bug', priority:'MEDIUM', screenshot:'' });
      setShowForm(false);
      load();
    } catch(e){ notify.error(e.message); }
  };
  const remove = async (id) => {
    const ok = await confirmDialog({ title:'Delete this ticket?', danger:true, confirmText:'Delete' });
    if(!ok) return;
    try { await api.ticketsDelete(id); notify.success('Deleted'); load(); }
    catch(e){ notify.error(e.message); }
  };

  return (
    <div className="fade" style={{display:'flex', flexDirection:'column', gap:14}}>
      <div>
        <div style={{fontSize:11, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.15em', marginBottom:4}}>Support</div>
        <div className="crm-page-title" style={{fontSize:22, fontWeight:700}}>Tickets</div>
        <div className="crm-page-sub" style={{fontSize:13, color:'var(--t3)', marginTop:4}}>
          {isStaff ? 'Resolve user-raised issues. Mark progress and close out.'
                   : 'Found a bug or have a feature request? Raise a ticket — you can attach a screenshot.'}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{marginBottom:10, flexWrap:'wrap', gap:6}}>
          <div style={{fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6}}>
            <LifeBuoy size={14}/> Tickets {items.length ? `(${items.length})` : ''}
          </div>
          <div className="spacer"/>
          <select className="inp" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            style={{padding:'4px 10px', fontSize:11, width:'auto'}}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={()=>setShowForm(s=>!s)} className="btnp"
            style={{display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11}}>
            <Plus size={11}/> Raise Ticket
          </button>
          {isStaff && (
            <button onClick={()=>exportCSV(
              'Tickets_' + new Date().toISOString().slice(0,10) + '.csv',
              ['TicketNo','Title','Category','Priority','Status','RaisedBy','AssignedTo','CreatedAt','UpdatesCount','LastUpdate'],
              items.map(T => [
                T.ticketNo, T.title, T.category, T.priority, T.status,
                T.createdByName, T.assignedName,
                T.createdAt, T.updates?.length || 0,
                T.updates?.length ? (T.updates[T.updates.length-1].byName + ': ' + (T.updates[T.updates.length-1].comment || T.updates[T.updates.length-1].status || '')) : '',
              ])
            )} className="btn" style={{padding:'4px 10px', fontSize:11, display:'inline-flex', alignItems:'center', gap:4}}>
              <Download size={11}/> Export
            </button>
          )}
          <button onClick={load} className="btn" style={{padding:'4px 10px', fontSize:11}}>
            <RefreshCw size={11}/>
          </button>
        </div>

        {showForm && (
          <div style={{background:'var(--bg2)', borderRadius:8, padding:14, marginBottom:12, border:'1px solid var(--b2)'}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:10}}>
              <div>
                <label style={{fontSize:10, color:'var(--t3)', display:'block', marginBottom:4, textTransform:'uppercase'}}>Title *</label>
                <input className="inp" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
              </div>
              <div>
                <label style={{fontSize:10, color:'var(--t3)', display:'block', marginBottom:4, textTransform:'uppercase'}}>Category</label>
                <select className="inp" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:10, color:'var(--t3)', display:'block', marginBottom:4, textTransform:'uppercase'}}>Priority</label>
                <select className="inp" value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{marginTop:8}}>
              <label style={{fontSize:10, color:'var(--t3)', display:'block', marginBottom:4, textTransform:'uppercase'}}>Describe what's happening</label>
              <VoiceTextarea rows={5} placeholder="Steps to reproduce, expected behaviour, what you see…"
                value={form.description} onChange={v=>setForm({...form, description:v})}/>
            </div>
            <div style={{marginTop:10}}>
              <ScreenshotInput photo={form.screenshot} setPhoto={p=>setForm({...form, screenshot:p})}/>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:10}}>
              <button onClick={()=>setShowForm(false)} className="btn" style={{fontSize:12}}>Cancel</button>
              <button onClick={create} className="btnp" style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12}}>
                <Send size={12}/> Raise ticket
              </button>
            </div>
          </div>
        )}

        {loading ? <div style={{padding:14, color:'var(--t3)'}}>Loading…</div> : items.length === 0 ? (
          <div style={{padding:14, color:'var(--t3)', textAlign:'center'}}>No tickets yet.</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:560, overflowY:'auto'}}>
            {items.map(T => {
              const sc = STATUS_COLOR[T.status] || '#3b82f6';
              const pc = PRIORITY_COLOR[T.priority] || '#a5b4fc';
              return (
                <div key={T._id} onClick={()=>setEditing(T)} style={{
                  cursor:'pointer', padding:'10px 12px', borderRadius:8,
                  background:'var(--bg2)', border:'1px solid var(--b2)',
                  borderLeft:'3px solid ' + sc,
                  display:'flex', gap:10,
                }}>
                  {T.screenshot
                    ? <img src={T.screenshot} alt="" onClick={(e)=>{ e.stopPropagation(); setZoom(T.screenshot); }}
                        style={{width:60, height:60, objectFit:'cover', borderRadius:6, border:'1px solid var(--b2)', flexShrink:0, cursor:'zoom-in'}}/>
                    : <div style={{width:60, height:60, borderRadius:6, background:'var(--bg1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', flexShrink:0}}>—</div>}
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                      <span style={{fontSize:11, fontFamily:'monospace', color:'var(--acc)', fontWeight:700}}>{T.ticketNo}</span>
                      <span style={{fontSize:13, fontWeight:700}}>{T.title}</span>
                      <span style={{fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, background:sc+'22', color:sc}}>{T.status}</span>
                      <span style={{fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, background:pc+'22', color:pc}}>{T.priority}</span>
                    </div>
                    <div style={{display:'flex', gap:10, marginTop:4, fontSize:11, color:'var(--t3)', flexWrap:'wrap'}}>
                      <span>{T.category}</span>
                      <span>By {T.createdByName}</span>
                      <span>{fmtTime(T.createdAt)}</span>
                      {T.updates?.length > 0 && <span>· {T.updates.length} update{T.updates.length===1?'':'s'}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <TicketDetailModal ticket={editing} users={users} isStaff={isStaff}
          onClose={()=>setEditing(null)}
          onSaved={()=>{ setEditing(null); load(); }}
          onDelete={()=>{ remove(editing._id); setEditing(null); }}/>
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

function TicketDetailModal({ ticket, users, isStaff, onClose, onSaved, onDelete }){
  const [draft, setDraft] = useState(ticket);
  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [shot, setShot] = useState('');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState('');

  const save = async () => {
    setBusy(true);
    try {
      const body = {};
      if(isStaff){
        ['title','description','category','status','priority','assignedTo'].forEach(k => { body[k] = draft[k]; });
      }
      if(comment || newStatus || shot){
        body.update = { comment, status:newStatus, screenshot:shot };
      }
      const res = await api.ticketsUpdate(ticket._id, body);
      notify.success('Ticket updated');
      setDraft(res); setComment(''); setNewStatus(''); setShot('');
      onSaved();
    } catch(e){ notify.error(e.message); }
    setBusy(false);
  };

  const sc = STATUS_COLOR[draft.status] || '#3b82f6';
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:720}}>
        <div className="row" style={{marginBottom:12}}>
          <span style={{fontSize:12, fontFamily:'monospace', color:'var(--acc)', fontWeight:700}}>{draft.ticketNo}</span>
          <div style={{fontSize:17, fontWeight:700}}>{draft.title}</div>
          <span style={{fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3, background:sc+'22', color:sc}}>{draft.status}</span>
          <div className="spacer"/>
          <button onClick={onClose} className="btn"><X size={13}/></button>
        </div>

        {isStaff ? (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:10, marginBottom:12}}>
            <div>
              <label style={{fontSize:10, color:'var(--t3)'}}>Status</label>
              <select className="inp" value={draft.status} onChange={e=>setDraft({...draft, status:e.target.value})}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10, color:'var(--t3)'}}>Priority</label>
              <select className="inp" value={draft.priority} onChange={e=>setDraft({...draft, priority:e.target.value})}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:10, color:'var(--t3)'}}>Assigned to</label>
              <select className="inp" value={draft.assignedTo || ''} onChange={e=>setDraft({...draft, assignedTo:e.target.value})}>
                <option value="">— Unassigned —</option>
                {Object.values(users || {}).filter(u => u.role === 'admin' || u.role === 'superadmin').map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div style={{background:'var(--bg2)', borderRadius:8, padding:12, marginBottom:12, fontSize:12}}>
            <div>Category: <b>{draft.category}</b> · Priority: <b style={{color:PRIORITY_COLOR[draft.priority]}}>{draft.priority}</b></div>
            <div>Raised: <b>{fmtTime(draft.createdAt)}</b></div>
            {draft.assignedName && <div>Assigned to: <b style={{color:'var(--acc)'}}>{draft.assignedName}</b></div>}
          </div>
        )}

        <div style={{fontSize:12, color:'var(--t2)', whiteSpace:'pre-wrap', marginBottom:8}}>{draft.description}</div>
        {draft.screenshot && (
          <img src={draft.screenshot} alt="" onClick={()=>setZoom(draft.screenshot)}
            style={{maxWidth:'100%', maxHeight:300, borderRadius:6, border:'1px solid var(--b2)', cursor:'zoom-in', marginBottom:12}}/>
        )}

        <div style={{background:'var(--bg2)', borderRadius:8, padding:12, marginBottom:12}}>
          <div style={{fontSize:12, fontWeight:700, marginBottom:8}}>Add update</div>
          <VoiceTextarea rows={3} value={comment} onChange={setComment}
            placeholder={isStaff ? 'Status update for the user…' : 'Any new info to add?'}/>
          <div style={{marginTop:8}}>
            <ScreenshotInput photo={shot} setPhoto={setShot} label="Attach additional screenshot"/>
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginTop:8}}>
            {isStaff && (
              <select className="inp" value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{padding:'6px 10px', fontSize:12, width:'auto'}}>
                <option value="">— Keep status —</option>
                {STATUSES.map(s => <option key={s} value={s}>Set: {s}</option>)}
              </select>
            )}
            <div style={{flex:1}}/>
            {isStaff && <button onClick={onDelete} className="btn" style={{color:'#f87171', border:'1px solid #7f1d1d', fontSize:12, display:'inline-flex', alignItems:'center', gap:4}}><Trash2 size={11}/> Delete</button>}
            <button onClick={save} disabled={busy} className="btnp" style={{display:'inline-flex', alignItems:'center', gap:6}}>
              <Send size={12}/> {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{fontSize:12, fontWeight:700, marginBottom:6}}>Activity ({ticket.updates?.length || 0})</div>
        <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:240, overflowY:'auto'}}>
          {(ticket.updates || []).slice().reverse().map((u, idx) => (
            <div key={idx} style={{background:'var(--bg2)', borderRadius:6, padding:'8px 10px'}}>
              <div style={{fontSize:11, color:'var(--t3)'}}>{u.byName || u.by} · {fmtTime(u.at)}{u.status ? ' · → ' + u.status : ''}</div>
              {u.comment && <div style={{fontSize:12, color:'var(--t1)', marginTop:2, whiteSpace:'pre-wrap'}}>{u.comment}</div>}
              {u.screenshot && (
                <img src={u.screenshot} alt="" onClick={()=>setZoom(u.screenshot)}
                  style={{maxWidth:160, marginTop:6, borderRadius:6, border:'1px solid var(--b2)', cursor:'zoom-in'}}/>
              )}
            </div>
          ))}
          {(!ticket.updates || ticket.updates.length === 0) && (
            <div style={{fontSize:11, color:'var(--t3)', padding:8, textAlign:'center'}}>No updates yet.</div>
          )}
        </div>

        {zoom && (
          <div onClick={()=>setZoom('')} style={{
            position:'fixed', inset:0, zIndex:10003, background:'rgba(0,0,0,0.9)',
            display:'flex', alignItems:'center', justifyContent:'center', padding:24,
          }}>
            <img src={zoom} alt="" style={{maxWidth:'95vw', maxHeight:'92vh', borderRadius:10}}/>
          </div>
        )}
      </div>
    </div>
  );
}
