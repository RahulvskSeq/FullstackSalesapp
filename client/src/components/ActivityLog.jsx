import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollText, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import { api } from '../api';

/**
 * ActivityLog — who changed what.
 *
 * Rows come from the audit middleware, which records every mutating request
 * with the user behind it. Two things are shown per row and they answer
 * different questions:
 *
 *   what was SENT     the request body — what the client asked for
 *   what CHANGED      the before/after per field — what actually moved
 *
 * The second is the one that settles arguments; it exists for dealer edits,
 * where the route computes the diff against the stored record.
 */

const fmtWhen = (iso) => {
  const d = new Date(iso);
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  const ago = mins < 1 ? 'just now'
    : mins < 60 ? mins + 'm ago'
    : mins < 1440 ? Math.floor(mins / 60) + 'h ago'
    : Math.floor(mins / 1440) + 'd ago';
  return {
    full: d.toLocaleString('en-IN', { day:'numeric', month:'short', hour:'numeric', minute:'2-digit', hour12:true }),
    ago,
  };
};

// "PUT /api/dealers/6a16…" reads as noise. Name the thing that happened.
const describe = (action) => {
  const [method, path=''] = String(action).split(' ');
  const p = path.replace(/^\/api\//, '').replace(/\/[0-9a-f]{24}(\/|$)/i, '/…$1');
  const verb = { POST:'Created', PUT:'Updated', PATCH:'Updated', DELETE:'Deleted' }[method] || method;
  return { verb, p, method };
};

const VERB_COLOUR = { Created:'#16a34a', Updated:'#0891b2', Deleted:'#dc2626' };

export default function ActivityLog() {
  const [rows, setRows]   = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy]   = useState(false);
  const [err, setErr]     = useState('');
  const [q, setQ]         = useState('');
  const [by, setBy]       = useState('');
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [failedOnly, setFailedOnly] = useState(false);
  const [open, setOpen]   = useState(null);

  // Only the newest request may write: typing fires a load per filter change,
  // and an older, slower reply must not overwrite a newer one.
  const seqRef = useRef(0);
  const load = useCallback(async () => {
    const seq = ++seqRef.current;
    setBusy(true); setErr('');
    try {
      const r = await api.auditLog({
        ...(q ? { q } : {}), ...(by ? { by } : {}),
        ...(from ? { from } : {}), ...(to ? { to } : {}),
        ...(failedOnly ? { failedOnly: 1 } : {}),
        limit: 300,
      });
      if (seq !== seqRef.current) return;
      setRows(r?.rows || []); setTotal(r?.total || 0); setUsers(r?.users || []);
    } catch (e) { if (seq === seqRef.current) setErr(e?.message || 'Could not load the activity log'); }
    if (seq === seqRef.current) setBusy(false);
  }, [q, by, from, to, failedOnly]);

  // Debounced, so the search box does not fire a request per keystroke.
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const cell = { padding:'7px 10px', verticalAlign:'top', borderBottom:'1px solid var(--b1)' };
  const th   = { ...cell, position:'sticky', top:0, background:'var(--bg1)', zIndex:1,
                 fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em',
                 fontWeight:700, textAlign:'left', whiteSpace:'nowrap' };

  return (
    <div>
      <div className="sec-title">
        <span className="sec-ico" style={{'--tone':'var(--acc)'}}><ScrollText size={15}/></span> Activity log
        {total > 0 && <span className="count-pill">{Number(total).toLocaleString('en-IN')}</span>}
        <span className="sec-note">
          {busy ? 'loading…' : `showing ${rows.length} of ${total}`}
        </span>
        <div style={{flex:1}}/>
        <button className="btn" onClick={load} disabled={busy}
          style={{display:'inline-flex', alignItems:'center', gap:5, fontSize:12}}>
          <RefreshCw size={12} className={busy ? 'spin' : ''}/> Refresh
        </button>
      </div>

      <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:12}}>
        <div style={{position:'relative'}}>
          <Search size={12} style={{position:'absolute', left:8, top:9, color:'var(--t3)'}}/>
          <input className="sel" value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Dealer, user or action…"
            style={{fontSize:12, width:210, paddingLeft:24, cursor:'text'}}/>
        </div>
        <select className="sel" value={by} onChange={e=>setBy(e.target.value)} style={{fontSize:12}}>
          <option value="">Everyone</option>
          {users.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <input type="date" className="sel" value={from} onChange={e=>setFrom(e.target.value)}
          style={{fontSize:12}} title="From"/>
        <input type="date" className="sel" value={to} onChange={e=>setTo(e.target.value)}
          style={{fontSize:12}} title="To"/>
        <label style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12,
                       color: failedOnly ? 'var(--red)' : 'var(--t3)', cursor:'pointer'}}>
          <input type="checkbox" checked={failedOnly} onChange={e=>setFailedOnly(e.target.checked)} style={{margin:0}}/>
          <AlertTriangle size={12}/> Failed only
        </label>
        {(q||by||from||to||failedOnly) && (
          <button className="btn" style={{fontSize:11, padding:'4px 9px'}}
            onClick={()=>{ setQ(''); setBy(''); setFrom(''); setTo(''); setFailedOnly(false); }}>Clear</button>
        )}
      </div>

      {err && (
        <div style={{padding:'8px 12px', borderRadius:7, marginBottom:12, fontSize:12,
          background:'color-mix(in srgb, var(--red) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--red) 33%, transparent)', color:'var(--red)'}}>{err}</div>
      )}

      <div className="scroll card" style={{maxHeight:'64vh', overflow:'auto', padding:0}}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:12}}>
          <thead>
            <tr>
              <th style={{...th, minWidth:130}}>When</th>
              <th style={{...th, minWidth:110}}>Who</th>
              <th style={{...th, minWidth:220}}>What</th>
              <th style={{...th}}>Changed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const w = fmtWhen(r.createdAt);
              const { verb, p } = describe(r.action);
              const failed = (r.detail?.status || 200) >= 400;
              const changed = r.detail?.changed;
              const fields = changed?.fields || null;
              const isOpen = open === r._id;
              return (
                <tr key={r._id || i} style={{background: i % 2 ? 'var(--bg2)' : 'transparent'}}>
                  <td style={cell}>
                    <div style={{fontWeight:600}}>{w.full}</div>
                    <div style={{fontSize:10, color:'var(--t3)'}}>{w.ago}</div>
                  </td>
                  <td style={cell}>
                    {r.byName ? (
                      <div style={{display:'flex', alignItems:'center', gap:9, minWidth:0}}>
                        <span className="ini" style={{'--h':String(r.byName).charCodeAt(0)*37%360}}>{String(r.byName).replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span>
                        <div style={{minWidth:0}}><div style={{fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis'}}>{r.byName}</div><div style={{fontSize:10.5, color:'var(--t3)'}}>{w.ago}</div></div>
                      </div>
                    ) : '—'}
                  </td>
                  <td style={cell}>
                    <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
                      <span style={{fontSize:10.5, fontWeight:800, color: VERB_COLOUR[verb] || 'var(--t2)', background:`color-mix(in srgb, ${VERB_COLOUR[verb] || 'var(--t3)'} 12%, transparent)`, padding:'2px 8px', borderRadius:20}}>{verb}</span>
                      <span style={{color:'var(--t2)'}}>{p}</span>
                      {failed && (
                        <span style={{fontSize:10, fontWeight:700, color:'var(--red)',
                          background:'color-mix(in srgb, var(--red) 12%, transparent)', padding:'2px 8px', borderRadius:20}}>
                          {r.detail.status}
                        </span>
                      )}
                    </div>
                    {changed?.dealer && (
                      <div style={{fontSize:11, color:'var(--acc)', marginTop:2}}>{changed.dealer}</div>
                    )}
                  </td>
                  <td style={cell}>
                    {fields ? (
                      <div style={{display:'flex', flexDirection:'column', gap:2}}>
                        {Object.entries(fields).slice(0, isOpen ? 99 : 4).map(([k, v]) => (
                          <div key={k} style={{fontSize:11}}>
                            <span style={{color:'var(--t3)'}}>{k}</span>{' '}
                            <span style={{color:'var(--t3)'}}>
                              {JSON.stringify(v?.from ?? null)}
                            </span>
                            <span style={{color:'var(--t3)'}}> → </span>
                            <b style={{color:'var(--t1)'}}>{JSON.stringify(v?.to ?? v)}</b>
                          </div>
                        ))}
                        {Object.keys(fields).length > 4 && (
                          <button className="btn" style={{fontSize:10, padding:'2px 7px', alignSelf:'flex-start'}}
                            onClick={()=>setOpen(isOpen ? null : r._id)}>
                            {isOpen ? 'Show less' : `+${Object.keys(fields).length - 4} more`}
                          </button>
                        )}
                      </div>
                    ) : (
                      // No diff — show what was sent instead. Uploads land here.
                      <div style={{fontSize:11, color:'var(--t3)', maxWidth:420,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace: isOpen ? 'normal' : 'nowrap',
                        cursor:'pointer'}}
                        onClick={()=>setOpen(isOpen ? null : r._id)}
                        title="Click to expand">
                        {r.detail?.file
                          ? `file: ${r.detail.file} (${r.detail.sizeKB} KB)`
                          : JSON.stringify(r.detail?.body ?? r.detail?.query ?? {})}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {!busy && rows.length === 0 && (
              <tr><td colSpan={4} style={{padding:24, textAlign:'center', color:'var(--t3)'}}>
                Nothing recorded for these filters.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{fontSize:10.5, color:'var(--t3)', marginTop:8}}>
        Every change made through the app is recorded — edits, uploads, deletions, permission changes.
        Reads are not, and passwords are never stored. Bulk work I run directly against the database
        does not pass through the app and so does not appear here.
      </div>
    </div>
  );
}
