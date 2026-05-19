import React, { useState, useEffect, useMemo } from 'react';
import { Bell, CheckSquare, Square, Trash2, Calendar, MessageSquare, RefreshCw, DollarSign } from 'lucide-react';
import { api } from '../api';
import { Avatar } from './UI';

const daysUntil = d => Math.ceil((new Date(d) - new Date().setHours(0,0,0,0)) / 86400000);

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
    await api.updateFollowup(id, { status:'done' });
    setOutFollowups(f => f.map(x => x._id===id ? {...x,status:'done'} : x));
  };

  const deleteOutFu = async (id) => {
    if(!confirm('Delete follow-up?')) return;
    await api.deleteFollowup(id);
    setOutFollowups(f => f.filter(x => x._id !== id));
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

  const getDealerName = id => dealers.find(d=>d.id===id)?.name || '';

  // Note followup card
  const NoteCard = ({ n }) => {
    const days    = daysUntil(n.dueDate);
    const overdue = !n.completed && days < 0;
    const dealerName = getDealerName(n.dealerId);
    const sm = users[dealers.find(d=>d.id===n.dealerId)?.salesman];
    return (
      <div style={{
        display:'flex', gap:10, padding:'12px 0',
        borderBottom:'1px solid var(--b1)', opacity:n.completed?0.5:1,
      }}>
        <button onClick={()=>onUpdateNote(n.id,{completed:!n.completed})}
          style={{background:'none',border:'none',cursor:'pointer',color:n.completed?'#34d399':'var(--t3)',flexShrink:0,paddingTop:2}}>
          {n.completed?<CheckSquare size={16}/>:<Square size={16}/>}
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3}}>
            <button onClick={()=>onOpenDealer(n.dealerId)}
              style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',padding:0,fontSize:13,fontWeight:600,textAlign:'left'}}>
              {dealerName||'Unknown'}
            </button>
            {sm&&<div style={{display:'flex',alignItems:'center',gap:3}}><Avatar user={sm} size={13}/><span style={{fontSize:10,color:sm.color}}>{sm.name}</span></div>}
            <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,
              background:overdue?'rgba(248,113,113,0.12)':days===0?'rgba(251,191,36,0.12)':'rgba(99,102,241,0.1)',
              color:overdue?'#f87171':days===0?'#fbbf24':'var(--acc)',fontWeight:600}}>
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
  };

  // Outstanding followup card
  const OutCard = ({ f }) => {
    const days    = daysUntil(f.followupDate);
    const overdue = f.status!=='done' && days < 0;
    const isDone  = f.status === 'done';
    return (
      <div style={{
        display:'flex', gap:10, padding:'12px 0',
        borderBottom:'1px solid var(--b1)', opacity:isDone?0.5:1,
      }}>
        <button onClick={()=>!isDone&&markDone(f._id)}
          style={{background:'none',border:'none',cursor:isDone?'default':'pointer',color:isDone?'#34d399':'var(--t3)',flexShrink:0,paddingTop:2}}>
          {isDone?<CheckSquare size={16}/>:<Square size={16}/>}
        </button>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:3}}>
            <button onClick={()=>{const d=dealers.find(x=>x.name?.toLowerCase().trim()===f.dealerName?.toLowerCase().trim());if(d)onOpenDealer(d.id);}}
              style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',padding:0,fontSize:13,fontWeight:600,textAlign:'left'}}>
              {f.dealerName}
            </button>
            {f.amount>0&&<span style={{fontSize:11,color:'#f87171',fontWeight:600}}>₹{Number(f.amount).toLocaleString('en-IN')}</span>}
            <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,
              background:isDone?'rgba(52,211,153,0.12)':overdue?'rgba(248,113,113,0.12)':days===0?'rgba(251,191,36,0.12)':'rgba(99,102,241,0.1)',
              color:isDone?'#34d399':overdue?'#f87171':days===0?'#fbbf24':'var(--acc)',fontWeight:600}}>
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
  };

  const Section = ({ label, color, noteList=[], outList=[], defaultOpen=true }) => {
    const [open, setOpen] = useState(defaultOpen);
    const total = noteList.length + outList.length;
    if(!total) return null;
    return (
      <div className="card" style={{marginBottom:12,padding:0,overflow:'hidden'}}>
        <div onClick={()=>setOpen(o=>!o)} style={{
          display:'flex',alignItems:'center',gap:8,padding:'12px 14px',
          cursor:'pointer',borderBottom:open?'1px solid var(--b1)':'none',
        }}>
          <div style={{width:8,height:8,borderRadius:'50%',background:color,flexShrink:0}}/>
          <span style={{fontSize:13,fontWeight:600,color,flex:1}}>{label}</span>
          <span style={{fontSize:12,background:color+'22',color,padding:'2px 8px',borderRadius:6,fontWeight:600}}>{total}</span>
          <span style={{color:'var(--t3)',fontSize:11}}>{open?'▲':'▼'}</span>
        </div>
        {open&&(
          <div style={{padding:'0 14px'}}>
            {outList.map(f=><OutCard key={f._id} f={f}/>)}
            {noteList.map(n=><NoteCard key={n.id} n={n}/>)}
          </div>
        )}
      </div>
    );
  };

  const totalPending = outPending.length + noteFu.filter(n=>!n.completed).length;

  return (
    <div className="fade">
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:4}}>Reminders</div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{fontSize:22,fontWeight:700}}>Follow-ups</div>
          {totalPending>0&&<span style={{background:'rgba(248,113,113,0.12)',color:'#f87171',border:'1px solid rgba(248,113,113,0.3)',padding:'2px 10px',borderRadius:6,fontSize:12,fontWeight:600}}>{totalPending} pending</span>}
        </div>
        <div style={{fontSize:13,color:'var(--t3)',marginTop:4}}>Outstanding payment follow-ups + dealer notes follow-ups</div>
      </div>

      {/* KPI row */}
      <div className="stat-grid" style={{marginBottom:14}}>
        {[
          {l:'Overdue',  v:totalOverdue,  c:'#f87171'},
          {l:'Today',    v:totalToday,    c:'#fbbf24'},
          {l:'Upcoming', v:totalUpcoming, c:'var(--acc)'},
          {l:'Done',     v:outDone.length+noteDone.length, c:'#34d399'},
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

      <Section label="🔴 Overdue"  color="#f87171" noteList={noteOverdue}  outList={outOverdue}  defaultOpen={true}/>
      <Section label="🟡 Due Today" color="#fbbf24" noteList={noteToday}   outList={outToday}   defaultOpen={true}/>
      <Section label="🔵 Upcoming" color="var(--acc)" noteList={noteUpcoming} outList={outUpcoming} defaultOpen={true}/>
      <Section label="✅ Done"     color="#34d399" noteList={noteDone}    outList={outDone}    defaultOpen={false}/>
    </div>
  );
}