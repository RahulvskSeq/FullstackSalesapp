// CRM Tasks — admin assigns, salesman executes.
// Salesman: sees only own assignments. Can change status (NEW / IN_PROGRESS /
// COMPLETED) and add comments. Cannot delete.
// Admin: full CRUD, can reassign, can filter by user.

import React, { useEffect, useState } from 'react';
import {
  ClipboardList, Plus, RefreshCw, Send, Trash2, X, Download,
  Calendar, Users as UsersIcon,
} from 'lucide-react';
import { api } from '../api';
import { notify, confirmDialog } from './Toast';
import { VoiceTextarea } from './VoiceInput';

const STATUSES = ['NEW','IN_PROGRESS','COMPLETED','CANCELLED'];
const PRIORITIES = ['LOW','MEDIUM','HIGH','URGENT'];
const STATUS_COLOR = {
  NEW:         '#a5b4fc',
  IN_PROGRESS: '#fbbf24',
  COMPLETED:   '#34d399',
  CANCELLED:   '#94a3b8',
};
const PRIORITY_COLOR = {
  LOW:'#94a3b8', MEDIUM:'#a5b4fc', HIGH:'#fb923c', URGENT:'#f87171',
};
const todayStr = () => new Date().toISOString().slice(0,10);
const fmtTime  = (d) => d ? new Date(d).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : '';

function Field({ label, children }){
  return (
    <div>
      <label style={{fontSize:10, color:'var(--t3)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'.07em'}}>{label}</label>
      {children}
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

export default function TasksPage({ users, currentUser }){
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);

  const [form, setForm] = useState({
    title:'', description:'', priority:'MEDIUM', dueDate:'',
    assignedTo:'', status:'NEW',
  });

  const load = async () => {
    setLoading(true);
    try {
      const q = {};
      if(filterStatus) q.status = filterStatus;
      if(isStaff && filterUser) q.assignedTo = filterUser;
      const data = await api.tasksList(q);
      setItems(data || []);
    } catch(e){ notify.error('Load tasks: ' + e.message); }
    setLoading(false);
  };
  useEffect(()=>{ load(); }, [filterStatus, filterUser]);

  const create = async () => {
    if(!form.title.trim()){ notify.error('Title required'); return; }
    try {
      await api.tasksCreate(form);
      notify.success('Task created');
      setForm({ title:'', description:'', priority:'MEDIUM', dueDate:'', assignedTo:'', status:'NEW' });
      setShowForm(false);
      load();
    } catch(e){ notify.error(e.message); }
  };

  const remove = async (id) => {
    const ok = await confirmDialog({ title:'Delete this task?', danger:true, confirmText:'Delete' });
    if(!ok) return;
    try { await api.tasksDelete(id); notify.success('Deleted'); load(); }
    catch(e){ notify.error(e.message); }
  };

  return (
    <div className="fade" style={{display:'flex', flexDirection:'column', gap:14}}>
      <div>
        <div style={{fontSize:11, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.15em', marginBottom:4}}>CRM</div>
        <div className="crm-page-title" style={{fontSize:22, fontWeight:700}}>Tasks</div>
        <div className="crm-page-sub" style={{fontSize:13, color:'var(--t3)', marginTop:4}}>
          {isStaff
            ? 'Assign tasks to salesmen, track status, push updates.'
            : 'Tasks assigned to you. Update status as you progress.'}
        </div>
      </div>

      <div className="card">
        <div className="row" style={{marginBottom:10, flexWrap:'wrap', gap:6}}>
          <div style={{fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6}}>
            <ClipboardList size={14}/> Tasks {items.length ? `(${items.length})` : ''}
          </div>
          <div className="spacer"/>
          <select className="inp" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
            style={{padding:'4px 10px', fontSize:11, width:'auto'}}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {isStaff && (
            <select className="inp" value={filterUser} onChange={e=>setFilterUser(e.target.value)}
              style={{padding:'4px 10px', fontSize:11, width:'auto'}}>
              <option value="">All assignees</option>
              {Object.values(users || {}).filter(u=>u.role==='salesman').map(u=>(
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
          {isStaff && (
            <button onClick={()=>setShowForm(s=>!s)} className="btnp"
              style={{display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:11}}>
              <Plus size={11}/> New Task
            </button>
          )}
          <button onClick={()=>exportCSV(
            'Tasks_' + todayStr() + '.csv',
            ['Title','Status','Priority','AssignedTo','DueDate','CreatedBy','CreatedAt','Description'],
            items.map(T => [T.title, T.status, T.priority, T.assignedName || T.assignedTo, T.dueDate, T.createdByName, T.createdAt, T.description])
          )} className="btn" title="Export tasks"
            style={{padding:'4px 10px', fontSize:11, display:'inline-flex', alignItems:'center', gap:4}}>
            <Download size={11}/> Export
          </button>
          <button onClick={load} className="btn" style={{padding:'4px 10px', fontSize:11}}>
            <RefreshCw size={11}/>
          </button>
        </div>

        {showForm && isStaff && (
          <div style={{background:'var(--bg2)', borderRadius:8, padding:14, marginBottom:12, border:'1px solid var(--b2)'}}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:10}}>
              <Field label="Title *"><input className="inp" value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/></Field>
              <Field label="Due date"><input type="date" className="inp" value={form.dueDate} onChange={e=>setForm({...form, dueDate:e.target.value})}/></Field>
              <Field label="Priority">
                <select className="inp" value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Assign to salesman">
                <select className="inp" value={form.assignedTo} onChange={e=>setForm({...form, assignedTo:e.target.value})}>
                  <option value="">— Unassigned —</option>
                  {Object.values(users||{}).filter(u=>u.role==='salesman').map(u=>(
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={{marginTop:8}}>
              <Field label="Description">
                <VoiceTextarea rows={4} value={form.description} onChange={v=>setForm({...form, description:v})}
                  placeholder="What needs to be done…"/>
              </Field>
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:10}}>
              <button onClick={()=>setShowForm(false)} className="btn" style={{fontSize:12}}>Cancel</button>
              <button onClick={create} className="btnp" style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12}}>
                <Plus size={12}/> Create
              </button>
            </div>
          </div>
        )}

        {loading ? <div style={{padding:14, color:'var(--t3)'}}>Loading…</div> : items.length === 0 ? (
          <div style={{padding:14, color:'var(--t3)', textAlign:'center'}}>No tasks.</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:8, maxHeight:560, overflowY:'auto'}}>
            {items.map(T => {
              const sc = STATUS_COLOR[T.status] || '#a5b4fc';
              const pc = PRIORITY_COLOR[T.priority] || '#a5b4fc';
              return (
                <div key={T._id} onClick={()=>setEditing(T)} style={{
                  cursor:'pointer', padding:'10px 12px', borderRadius:8,
                  background:'var(--bg2)', border:'1px solid var(--b2)',
                  borderLeft:'3px solid ' + sc,
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                    <div style={{fontSize:13, fontWeight:700}}>{T.title}</div>
                    <span style={{fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, background:sc+'22', color:sc}}>{T.status}</span>
                    <span style={{fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, background:pc+'22', color:pc}}>{T.priority}</span>
                    <div style={{flex:1}}/>
                    {T.assignedName && <span style={{fontSize:10, color:'var(--t3)'}}>→ {T.assignedName}</span>}
                  </div>
                  <div style={{display:'flex', gap:10, marginTop:4, fontSize:11, color:'var(--t3)', flexWrap:'wrap'}}>
                    {T.dueDate && <span><Calendar size={10} style={{display:'inline'}}/> Due: <b>{T.dueDate}</b></span>}
                    <span>By {T.createdByName}</span>
                    {T.updates?.length > 0 && <span>· {T.updates.length} update{T.updates.length===1?'':'s'}</span>}
                  </div>
                  {T.description && <div style={{fontSize:12, color:'var(--t2)', marginTop:6, whiteSpace:'pre-wrap'}}>{T.description}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <TaskDetailModal task={editing}
          users={users} isStaff={isStaff}
          onClose={()=>setEditing(null)}
          onSaved={()=>{ setEditing(null); load(); }}
          onDelete={()=>{ remove(editing._id); setEditing(null); }}/>
      )}
    </div>
  );
}

function TaskDetailModal({ task, users, isStaff, onClose, onSaved, onDelete }){
  const [draft, setDraft] = useState(task);
  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const body = {};
      if(isStaff){
        ['title','description','status','priority','dueDate','assignedTo'].forEach(k => { body[k] = draft[k]; });
      } else if(newStatus){ body.status = newStatus; }
      if(comment || newStatus){
        body.update = { comment, status:newStatus };
      }
      const res = await api.tasksUpdate(task._id, body);
      notify.success('Task updated');
      setDraft(res); setComment(''); setNewStatus('');
      onSaved();
    } catch(e){ notify.error(e.message); }
    setBusy(false);
  };

  const sc = STATUS_COLOR[draft.status] || '#a5b4fc';
  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:640}}>
        <div className="row" style={{marginBottom:12}}>
          <div style={{fontSize:17, fontWeight:700}}>{draft.title}</div>
          <span style={{fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:3, background:sc+'22', color:sc}}>{draft.status}</span>
          <div className="spacer"/>
          <button onClick={onClose} className="btn"><X size={13}/></button>
        </div>

        {isStaff ? (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:10, marginBottom:14}}>
            <Field label="Title"><input className="inp" value={draft.title||''} onChange={e=>setDraft({...draft, title:e.target.value})}/></Field>
            <Field label="Due date"><input type="date" className="inp" value={draft.dueDate||''} onChange={e=>setDraft({...draft, dueDate:e.target.value})}/></Field>
            <Field label="Status">
              <select className="inp" value={draft.status||'NEW'} onChange={e=>setDraft({...draft, status:e.target.value})}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className="inp" value={draft.priority||'MEDIUM'} onChange={e=>setDraft({...draft, priority:e.target.value})}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <Field label="Assigned to">
              <select className="inp" value={draft.assignedTo||''} onChange={e=>setDraft({...draft, assignedTo:e.target.value})}>
                <option value="">— Unassigned —</option>
                {Object.values(users||{}).filter(u=>u.role==='salesman').map(u=>(
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
          <div style={{background:'var(--bg2)', borderRadius:8, padding:12, marginBottom:14, fontSize:12, color:'var(--t2)'}}>
            <div>Priority: <b style={{color: PRIORITY_COLOR[draft.priority] || '#a5b4fc'}}>{draft.priority}</b></div>
            {draft.dueDate && <div>Due: <b>{draft.dueDate}</b></div>}
            <div>Assigned by: <b>{draft.createdByName}</b></div>
            {draft.description && <div style={{marginTop:8, whiteSpace:'pre-wrap'}}>{draft.description}</div>}
          </div>
        )}

        <div style={{background:'var(--bg2)', borderRadius:8, padding:12, marginBottom:12}}>
          <div style={{fontSize:12, fontWeight:700, marginBottom:8}}>Add update</div>
          <VoiceTextarea rows={3} placeholder="What progress? Any blockers?" value={comment} onChange={setComment}/>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginTop:8}}>
            <select className="inp" value={newStatus} onChange={e=>setNewStatus(e.target.value)} style={{padding:'6px 10px', fontSize:12, width:'auto'}}>
              <option value="">— Keep status —</option>
              {STATUSES.map(s => <option key={s} value={s}>Set: {s}</option>)}
            </select>
            <div style={{flex:1}}/>
            {isStaff && <button onClick={onDelete} className="btn" style={{color:'#f87171', border:'1px solid #7f1d1d', fontSize:12, display:'inline-flex', alignItems:'center', gap:4}}><Trash2 size={11}/> Delete</button>}
            <button onClick={save} disabled={busy} className="btnp" style={{display:'inline-flex', alignItems:'center', gap:6}}>
              <Send size={12}/> {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div style={{fontSize:12, fontWeight:700, marginBottom:6}}>Activity ({task.updates?.length || 0})</div>
        <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:200, overflowY:'auto'}}>
          {(task.updates || []).slice().reverse().map((u, idx) => (
            <div key={idx} style={{background:'var(--bg2)', borderRadius:6, padding:'8px 10px'}}>
              <div style={{fontSize:11, color:'var(--t3)'}}>{u.byName || u.by} · {fmtTime(u.at)}{u.status ? ' · → ' + u.status : ''}</div>
              {u.comment && <div style={{fontSize:12, color:'var(--t1)', marginTop:2}}>{u.comment}</div>}
            </div>
          ))}
          {(!task.updates || task.updates.length === 0) && (
            <div style={{fontSize:11, color:'var(--t3)', padding:8, textAlign:'center'}}>No updates yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
