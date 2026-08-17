// Lightweight in-house toast + confirm dialog system.
// No external dependency — same API as react-toastify for the toasts.
//
// Usage:
//   import { notify, confirmDialog } from './components/Toast';
//   notify.success('Saved');
//   notify.error('Failed: ' + e.message);
//   const ok = await confirmDialog({ title:'Delete dealer?', message:'Cannot undo', danger:true });
//
// Mount `<NotificationCenter />` once at the root of the app.

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

// ── Internal pub/sub bus ──────────────────────────────────────────────────
const listeners = new Set();
let nextId = 1;
const emit = (event) => listeners.forEach(fn => fn(event));

// ── Public API ────────────────────────────────────────────────────────────
export const notify = {
  success: (text, opts = {}) => emit({ kind:'toast', type:'success', text, duration: opts.duration ?? 3000 }),
  error:   (text, opts = {}) => emit({ kind:'toast', type:'error',   text, duration: opts.duration ?? 5000 }),
  info:    (text, opts = {}) => emit({ kind:'toast', type:'info',    text, duration: opts.duration ?? 3500 }),
  warn:    (text, opts = {}) => emit({ kind:'toast', type:'warn',    text, duration: opts.duration ?? 4500 }),
};

// confirmDialog({ title?, message, confirmText?, cancelText?, danger? }) → Promise<boolean>
export const confirmDialog = (opts) => new Promise((resolve) => {
  emit({
    kind: 'confirm',
    title:       opts?.title       || 'Confirm',
    message:     opts?.message     || '',
    confirmText: opts?.confirmText || 'Confirm',
    cancelText:  opts?.cancelText  || 'Cancel',
    danger:      !!opts?.danger,
    resolve,
  });
});

// ── Visuals ───────────────────────────────────────────────────────────────
const TYPE_STYLE = {
  success: { bg:'rgba(34,197,94,0.10)',  border:'#15803d', color:'var(--grn)', Icon: CheckCircle2 },
  error:   { bg:'rgba(248,113,113,0.10)', border:'#7f1d1d', color:'#fca5a5', Icon: AlertTriangle },
  info:    { bg:'rgba(99,102,241,0.10)',  border:'#3730a3', color:'#a5b4fc', Icon: Info },
  warn:    { bg:'rgba(251,191,36,0.10)',  border:'#92400e', color:'var(--yel)', Icon: AlertCircle },
};

function Toast({ t, onClose }){
  const style = TYPE_STYLE[t.type] || TYPE_STYLE.info;
  const Icon = style.Icon;
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:10,
      minWidth:260, maxWidth:380,
      padding:'10px 12px',
      background:'var(--bg2)',
      border:'1px solid ' + style.border,
      borderLeft:'3px solid ' + style.color,
      borderRadius:8,
      boxShadow:'0 8px 24px rgba(0,0,0,0.40)',
      color:'var(--t1)',
      fontSize:12,
      animation:'stpToastIn .18s ease-out',
      pointerEvents:'auto',
    }}>
      <Icon size={16} style={{color: style.color, flexShrink:0, marginTop:1}}/>
      <div style={{flex:1, lineHeight:1.4, wordBreak:'break-word'}}>{t.text}</div>
      <button onClick={onClose} aria-label="Close"
        style={{
          background:'none', border:'none', color:'var(--t3)', cursor:'pointer',
          padding:0, marginLeft:4, marginTop:1, flexShrink:0,
        }}><X size={13}/></button>
    </div>
  );
}

function ConfirmModal({ c, onResolve }){
  // Only Escape dismisses. We intentionally do NOT bind Enter to confirm,
  // and the confirm button is NOT autoFocused — both choices avoid the
  // "I accidentally hit Enter and the destructive action ran" footgun.
  useEffect(()=>{
    const onKey = (e) => { if(e.key === 'Escape') onResolve(false); };
    window.addEventListener('keydown', onKey);
    return ()=>window.removeEventListener('keydown', onKey);
  },[onResolve]);

  return (
    <div onClick={(e)=>{ if(e.target === e.currentTarget) onResolve(false); }}
      style={{
        position:'fixed', inset:0, zIndex:10001,
        background:'rgba(0,0,0,0.62)', backdropFilter:'blur(2px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:16,
      }}>
      <div style={{
        background:'var(--bg2)', border:'1px solid var(--b2)',
        borderRadius:10, padding:'18px 20px',
        minWidth:300, maxWidth:440,
        boxShadow:'0 20px 60px rgba(0,0,0,0.55)',
      }}>
        <div style={{
          display:'flex', alignItems:'center', gap:10, marginBottom:10,
        }}>
          {c.danger
            ? <AlertTriangle size={20} style={{color:'var(--red)', flexShrink:0}}/>
            : <AlertCircle   size={20} style={{color:'#a5b4fc', flexShrink:0}}/>}
          <div style={{fontSize:15, fontWeight:700, color:'var(--t1)'}}>{c.title}</div>
        </div>
        {c.message && (
          <div style={{
            fontSize:12, color:'var(--t2)', lineHeight:1.55,
            marginBottom:16, whiteSpace:'pre-line',
          }}>{c.message}</div>
        )}
        <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
          <button onClick={()=>onResolve(false)}
            style={{
              background:'transparent', border:'1px solid var(--b2)',
              color:'var(--t2)', padding:'7px 14px', borderRadius:6,
              fontSize:12, cursor:'pointer',
            }}>{c.cancelText}</button>
          <button onClick={()=>onResolve(true)}
            style={{
              background: c.danger ? '#dc2626' : 'var(--acc)',
              border:'none', color:'#fff',
              padding:'7px 14px', borderRadius:6,
              fontSize:12, fontWeight:600, cursor:'pointer',
            }}>{c.confirmText}</button>
        </div>
      </div>
    </div>
  );
}

// ── Mount this once at the root ───────────────────────────────────────────
export function NotificationCenter(){
  const [toasts, setToasts]   = useState([]);
  const [confirms, setConfirms] = useState([]);

  useEffect(()=>{
    const fn = (event) => {
      if(event.kind === 'toast'){
        const id = nextId++;
        const item = { id, ...event };
        setToasts(prev => [...prev, item]);
        if(event.duration > 0){
          setTimeout(()=>{
            setToasts(prev => prev.filter(t => t.id !== id));
          }, event.duration);
        }
      } else if(event.kind === 'confirm'){
        const id = nextId++;
        setConfirms(prev => [...prev, { id, ...event }]);
      }
    };
    listeners.add(fn);
    return () => listeners.delete(fn);
  },[]);

  const resolveConfirm = (id, result) => {
    setConfirms(prev => {
      const c = prev.find(x => x.id === id);
      if(c) c.resolve(result);
      return prev.filter(x => x.id !== id);
    });
  };

  return (
    <>
      {/* Inline keyframes — kept self-contained so we don't depend on Styles.jsx */}
      <style>{`
        @keyframes stpToastIn {
          from { opacity:0; transform: translateY(-6px); }
          to   { opacity:1; transform: translateY(0); }
        }
      `}</style>

      {/* Toast stack — top-right of viewport */}
      <div style={{
        position:'fixed', top:14, right:14, zIndex:10000,
        display:'flex', flexDirection:'column', gap:8,
        pointerEvents:'none',
      }}>
        {toasts.map(t => (
          <Toast key={t.id} t={t}
            onClose={()=>setToasts(prev => prev.filter(x => x.id !== t.id))}/>
        ))}
      </div>

      {/* Active confirm modal (only most recent) */}
      {confirms.length > 0 && (
        <ConfirmModal
          c={confirms[confirms.length - 1]}
          onResolve={(v)=>resolveConfirm(confirms[confirms.length - 1].id, v)}/>
      )}
    </>
  );
}

export default NotificationCenter;
