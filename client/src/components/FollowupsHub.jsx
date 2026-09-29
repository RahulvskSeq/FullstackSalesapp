import React, { useState, useEffect, useMemo } from 'react';
import { Bell, CheckSquare, Square, Trash2, Calendar, MessageSquare, RefreshCw, DollarSign } from 'lucide-react';
import { api } from '../api';
import { Avatar } from './UI';
import { confirmDialog, notify } from './Toast';
import { PageHead } from '../collections/ui';

// Whole days from today to a 'YYYY-MM-DD' date, both read as LOCAL midnight
// (new Date('YYYY-MM-DD') is UTC, which put IST dates off by one).
const daysUntil=d=>{const [y,m,dd]=String(d).slice(0,10).split('-').map(Number);const t=new Date();return Math.round((new Date(y,m-1,dd)-new Date(t.getFullYear(),t.getMonth(),t.getDate()))/864e5);};

// Cards + Section live at module scope: defined inside FollowupsHub they were
// new component types on every render, so each tick remounted them and the
// collapsible Section lost its open/closed state ("Done" snapped shut).
// Initials avatar (design kit) — display only.
const Ini = ({ name }) => (
  <span className="ini" style={{'--h':String(name||'?').charCodeAt(0)*37%360,marginTop:1}}>{String(name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span>
);

// Note followup card
function NoteCard({ n, ctx }) {
  const { dealers, users, onUpdateNote, onDeleteNote, onOpenDealer } = ctx;
  const days    = daysUntil(n.dueDate);
  const overdue = !n.completed && days < 0;
  const dealerName = dealers.find(d=>d.id===n.dealerId)?.name || '';
  const sm = users[dealers.find(d=>d.id===n.dealerId)?.salesman];
  return (
    <div style={{
      display:'flex', gap:10, padding:'12px 0',
      borderBottom:'1px solid var(--b1)', opacity:n.completed?0.5:1,
    }}>
      <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})}
        style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'var(--grn)':'var(--t3)',flexShrink:0,paddingTop:2}}>
        {n.completed?<CheckSquare size={16}/>:<Square size={16}/>}
      </button>
      <Ini name={dealerName||'Unknown'}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3}}>
          <button onClick={()=>onOpenDealer(n.dealerId)}
            style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',padding:0,fontSize:13,fontWeight:700,textAlign:'left'}}>
            {dealerName||'Unknown'}
          </button>
          {sm&&<div style={{display:'flex',alignItems:'center',gap:3}}><Avatar user={sm} size={13}/><span style={{fontSize:10,color:sm.color}}>{sm.name}</span></div>}
          <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,
            background:overdue?'color-mix(in srgb, var(--red) 12%, transparent)':days===0?'color-mix(in srgb, var(--yel) 12%, transparent)':'color-mix(in srgb, var(--acc) 10%, transparent)',
            color:overdue?'var(--red)':days===0?'var(--yel)':'var(--acc)',fontWeight:600}}>
            {n.completed?'✓ Done':overdue?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
          </span>
        </div>
        <div style={{fontSize:12,color:'var(--t2)',textDecoration:n.completed?'line-through':'none'}}>{n.content}</div>
        <div style={{fontSize:10,color:'var(--t3)',marginTop:3}}>
          📝 Note · Due {new Date(n.dueDate).toLocaleDateString('en-IN')}
        </div>
      </div>
      <button onClick={()=>onDeleteNote(n.id)}
        style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3,flexShrink:0}}>
        <Trash2 size={12}/>
      </button>
    </div>
  );
}

// Outstanding followup card
function OutCard({ f, ctx }) {
  const { dealers, onOpenDealer, markDone, deleteOutFu } = ctx;
  const days    = daysUntil(f.followupDate);
  const overdue = f.status!=='done' && days < 0;
  const isDone  = f.status === 'done';
  return (
    <div style={{
      display:'flex', gap:10, padding:'12px 0',
      borderBottom:'1px solid var(--b1)', opacity:isDone?0.5:1,
    }}>
      <button onClick={()=>!isDone&&markDone(f._id)}
        style={{background:'none',border:'none',cursor:isDone?'default':'pointer',color:isDone?'var(--grn)':'var(--t3)',flexShrink:0,paddingTop:2}}>
        {isDone?<CheckSquare size={16}/>:<Square size={16}/>}
      </button>
      <Ini name={f.dealerName}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3}}>
          <button onClick={()=>{const d=dealers.find(x=>x.name?.toLowerCase().trim()===f.dealerName?.toLowerCase().trim());if(d)onOpenDealer(d.id);}}
            style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',padding:0,fontSize:13,fontWeight:700,textAlign:'left'}}>
            {f.dealerName}
          </button>
          {f.amount>0&&<span style={{fontSize:11,color:'var(--red)',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
          <span style={{fontSize:10,padding:'2px 8px',borderRadius:20,
            background:isDone?'color-mix(in srgb, var(--grn) 12%, transparent)':overdue?'color-mix(in srgb, var(--red) 12%, transparent)':days===0?'color-mix(in srgb, var(--yel) 12%, transparent)':'color-mix(in srgb, var(--acc) 10%, transparent)',
            color:isDone?'var(--grn)':overdue?'var(--red)':days===0?'var(--yel)':'var(--acc)',fontWeight:600}}>
            {isDone?'✓ Done':overdue?`${Math.abs(days)}d overdue`:days===0?'Today':`${days}d left`}
          </span>
        </div>
        {f.comment&&<div style={{fontSize:12,color:'var(--t2)',textDecoration:isDone?'line-through':'none'}}>{f.comment}</div>}
        <div style={{fontSize:10,color:'var(--t3)',marginTop:3}}>
          💳 Outstanding · {f.followupDate}
        </div>
      </div>
      <button onClick={()=>deleteOutFu(f._id)}
        style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3,flexShrink:0}}>
        <Trash2 size={12}/>
      </button>
    </div>
  );
}

function Section({ label, color, noteList=[], outList=[], defaultOpen=true, ctx }) {
  const [open, setOpen] = useState(defaultOpen);
  const total = noteList.length + outList.length;
  if(!total) return null;
  return (
    <div className="card" style={{marginBottom:12,padding:0,overflow:'hidden'}}>
      <div className="sec-title" onClick={()=>setOpen(o=>!o)} style={{
        marginBottom:0,padding:'12px 14px',
        cursor:'pointer',borderBottom:open?'1px solid var(--b1)':'none',
      }}>
        <span className="sec-ico" style={{'--tone':color}}><Calendar size={15}/></span>
        <span>{label}</span>
        <div style={{flex:1}}/>
        <span className="count-pill" style={{color,background:`color-mix(in srgb, ${color} 12%, transparent)`}}>{total}</span>
        <span style={{color:'var(--t3)',fontSize:11}}>{open?'▲':'▼'}</span>
      </div>
      {open&&(
        <div style={{padding:'0 14px'}}>
          {outList.map(f=><OutCard key={f._id} f={f} ctx={ctx}/>)}
          {noteList.map(n=><NoteCard key={n.id} n={n} ctx={ctx}/>)}
        </div>
      )}
    </div>
  );
}


export default function FollowupsHub({ notes=[], dealers=[], users={}, onUpdateNote, onDeleteNote, onOpenDealer }) {
  const [outFollowups, setOutFollowups] = useState([]);
  const [loading, setLoading]           = useState(false);
  const today = new Date(); today.setHours(0,0,0,0);

  useEffect(() => { loadOutFollowups(); }, []);

  const loadOutFollowups = async () => {
    setLoading(true);
    try {
      const data = await api.getFollowups();
      setOutFollowups(data || []);
    } catch(e) { console.warn('Followups load failed:', e.message); }
    setLoading(false);
  };

  const markDone = async (id) => {
    try {
      await api.updateFollowup(id, { status:'done' });
      setOutFollowups(f => f.map(x => x._id===id ? {...x,status:'done'} : x));
    } catch(e) { notify.error("Couldn't mark it done: " + e.message); }
  };

  const deleteOutFu = async (id) => {
    const ok = await confirmDialog({ title:'Delete follow-up?', confirmText:'Delete', danger:true });
    if(!ok) return;
    try {
      await api.deleteFollowup(id);
      setOutFollowups(f => f.filter(x => x._id !== id));
    } catch(e) { notify.error("Couldn't delete it: " + e.message); }
  };

  // Note-based followups
  const noteFu      = notes.filter(n => n.type==='followup');
  const noteOverdue = noteFu.filter(n => !n.completed && new Date(n.dueDate) < today);
  const noteToday   = noteFu.filter(n => !n.completed && new Date(n.dueDate).toDateString()===new Date().toDateString());
  const noteUpcoming= noteFu.filter(n => !n.completed && new Date(n.dueDate) > today && new Date(n.dueDate).toDateString()!==new Date().toDateString());
  const noteDone    = noteFu.filter(n => n.completed).slice(0,10);

  // Outstanding followups
  const outPending  = outFollowups.filter(f => f.status==='pending');
  const outOverdue  = outPending.filter(f => daysUntil(f.followupDate) < 0);
  const outToday    = outPending.filter(f => daysUntil(f.followupDate) === 0);
  const outUpcoming = outPending.filter(f => daysUntil(f.followupDate) > 0);
  const outDone     = outFollowups.filter(f => f.status==='done').slice(0,10);

  const totalOverdue  = noteOverdue.length  + outOverdue.length;
  const totalToday    = noteToday.length    + outToday.length;
  const totalUpcoming = noteUpcoming.length + outUpcoming.length;

  const ctx = { dealers, users, onUpdateNote, onDeleteNote, onOpenDealer, markDone, deleteOutFu };

  const totalPending = outPending.length + noteFu.filter(n=>!n.completed).length;

  return (
    <div className="fade">
      <PageHead icon={Bell} tone="var(--yel)" eyebrow="Reminders"
        title={<>Follow-ups{totalPending>0&&<span style={{marginLeft:10,verticalAlign:'middle',background:'color-mix(in srgb, var(--red) 12%, transparent)',color:'var(--red)',border:'1px solid color-mix(in srgb, var(--red) 30%, transparent)',padding:'2px 10px',borderRadius:20,fontSize:12,fontWeight:700}}>{totalPending} pending</span>}</>}
        sub="Outstanding payment follow-ups + dealer notes follow-ups"/>

      {/* KPI row */}
      <div className="stat-grid" style={{marginBottom:14}}>
        {[
          {l:'Overdue',  v:totalOverdue,  c:'#ef4444'},
          {l:'Today',    v:totalToday,    c:'#f59e0b'},
          {l:'Upcoming', v:totalUpcoming, c:'var(--acc)'},
          {l:'Done',     v:outDone.length+noteDone.length, c:'#10b981'},
        ].map(k=>(
          <div key={k.l} className="stat-card">
            <div style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:6}}>{k.l}</div>
            <div style={{fontSize:22,fontWeight:700,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:12,display:'flex',gap:8}}>
        <button onClick={loadOutFollowups} disabled={loading} className="btn" style={{display:'flex',alignItems:'center',gap:5,fontSize:12}}>
          <RefreshCw size={12} className={loading?'spin':''}/> Refresh
        </button>
      </div>

      {totalPending===0&&!loading&&(
        <div className="card" style={{textAlign:'center',padding:40}}>
          <div style={{fontSize:32,marginBottom:10}}>✅</div>
          <div style={{fontSize:15,fontWeight:600,color:'var(--t1)',marginBottom:4}}>All clear!</div>
          <div style={{fontSize:12,color:'var(--t3)'}}>No pending follow-ups. Add them from the Outstanding tab or dealer notes.</div>
        </div>
      )}

      <Section label="🔴 Overdue"  color="#ef4444" noteList={noteOverdue}  outList={outOverdue}  defaultOpen={true} ctx={ctx}/>
      <Section label="🟡 Due Today" color="#f59e0b" noteList={noteToday}   outList={outToday}   defaultOpen={true} ctx={ctx}/>
      <Section label="🔵 Upcoming" color="var(--acc)" noteList={noteUpcoming} outList={outUpcoming} defaultOpen={true} ctx={ctx}/>
      <Section label="✅ Done"     color="#10b981" noteList={noteDone}    outList={outDone}    defaultOpen={false} ctx={ctx}/>
    </div>
  );
}