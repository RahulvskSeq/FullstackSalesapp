import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Save, RotateCcw, Search, Check } from 'lucide-react';
import { NAV_PAGES } from '../constants';
import { api } from '../api';
import { notify } from './Toast';

/**
 * PermissionsMatrix — every permission for every user, on one screen.
 *
 * The per-user modal in User Management edits one person at a time, which is
 * the wrong shape for questions like "who can upload?" or "give the whole
 * team Reports". This is the same data as a grid: users down, permissions
 * across, one click per cell, saved in one go.
 *
 * Three separate things live here because they are genuinely different
 * questions, and confusing them is how permissions go wrong:
 *
 *   Features   is this part of the app switched on for the company at all?
 *   Pages      which screens does this person see?
 *   Actions    what is this person allowed to do?
 *
 * A page a user cannot see is still reachable by URL unless the matching
 * action is also withheld, so both columns matter.
 */

const EMPTY = { pages: [], features: [], states: [], cities: [], zones: [], salesmen: [] };

export default function PermissionsMatrix({ setUsers, currentUser }) {
  // Own copy of the roster: the map App passes around is for display and does
  // not reliably carry permissions, which is the whole point of this screen.
  const [users, setLocalUsers] = useState({});
  const [actions, setActions]   = useState([]);
  const [globalOff, setGlobalOff] = useState([]);
  const [draft, setDraft]       = useState({});     // uid → { pages:Set, features:Set }
  const [view, setView]         = useState('pages');
  const [q, setQ]               = useState('');
  const [busy, setBusy]         = useState(false);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    api.actionPermissions().then(r => setActions(r?.actions || [])).catch(() => setActions([]));
    api.featuresGet().then(r => setGlobalOff(r?.disabled || [])).catch(() => {});
    api.getUsersAll().then(r => setLocalUsers(r || {})).catch(() => setLocalUsers({}));
  }, []);

  // Seed the draft from what is stored. Kept as Sets so a cell toggle is cheap.
  const seed = () => {
    const d = {};
    for (const u of Object.values(users || {})) {
      const p = u.permissions || EMPTY;
      d[u.id] = {
        pages:    new Set(Array.isArray(p.pages) ? p.pages : []),
        features: new Set(Array.isArray(p.features) ? p.features : []),
      };
    }
    setDraft(d);
  };
  useEffect(seed, [users]);

  const rows = useMemo(() => {
    const list = Object.values(users || {})
      // A superadmin ignores every restriction, so a row of checkboxes for one
      // would be a lie. They are listed, greyed, and not editable.
      .sort((a, b) => (a.role === 'superadmin') - (b.role === 'superadmin')
                   || String(a.name || a.id).localeCompare(String(b.name || b.id)));
    const needle = q.trim().toLowerCase();
    return needle
      ? list.filter(u => (u.name || '').toLowerCase().includes(needle) || (u.id || '').toLowerCase().includes(needle))
      : list;
  }, [users, q]);

  const cols = view === 'pages'
    ? NAV_PAGES.map(p => ({ key: p.id, label: p.label }))
    : actions.map(a => ({ key: a.key, label: a.label, group: a.group, desc: a.desc }));

  const field = view === 'pages' ? 'pages' : 'features';

  const has = (uid, key) => !!draft[uid]?.[field]?.has(key);
  const setCell = (uid, key, on) => {
    setDraft(d => {
      const cur = d[uid] || { pages: new Set(), features: new Set() };
      const next = new Set(cur[field]);
      on ? next.add(key) : next.delete(key);
      return { ...d, [uid]: { ...cur, [field]: next } };
    });
  };
  const editable = (u) => isSuperAdmin && u.role !== 'superadmin';

  const toggleCell   = (uid, key) => setCell(uid, key, !has(uid, key));
  const toggleRow    = (uid) => {
    const all = cols.every(c => has(uid, c.key));
    cols.forEach(c => setCell(uid, c.key, !all));
  };
  const toggleColumn = (key) => {
    const targets = rows.filter(editable);
    const all = targets.every(u => has(u.id, key));
    targets.forEach(u => setCell(u.id, key, !all));
  };

  // What actually differs from what is stored — only those users get written.
  const changed = useMemo(() => {
    const out = [];
    for (const u of Object.values(users || {})) {
      const d = draft[u.id]; if (!d) continue;
      const p = u.permissions || EMPTY;
      const same = (setA, arr) => setA.size === (arr || []).length && (arr || []).every(x => setA.has(x));
      if (!same(d.pages, p.pages) || !same(d.features, p.features)) out.push(u.id);
    }
    return out;
  }, [draft, users]);

  const save = async () => {
    if (!changed.length) return;
    setBusy(true);
    let ok = 0, failed = [];
    const nextUsers = { ...users };
    for (const uid of changed) {
      const u = users[uid], d = draft[uid];
      // Merge, never replace: states / cities / zones / salesmen are edited in
      // the per-user modal and must survive a save from this screen.
      const permissions = {
        ...EMPTY, ...(u.permissions || {}),
        pages: [...d.pages], features: [...d.features],
      };
      try {
        await api.updateUser(uid, { permissions });
        nextUsers[uid] = { ...u, permissions };
        ok++;
      } catch (e) { failed.push(uid + ': ' + (e?.message || 'failed')); }
    }
    setLocalUsers(nextUsers);
    setUsers?.(nextUsers);
    setBusy(false);
    if (failed.length) notify.error(failed.length + ' user(s) not saved — ' + failed[0]);
    else notify.success(ok + ' user' + (ok === 1 ? '' : 's') + ' updated');
  };

  // Columns are shown under a group heading — "Incentive", "Collections" —
  // with the short part as the column label, so forty rotated names stop
  // reading as a wall of "COLLECTIONS — …" cut off at the same point.
  const PAGE_GROUP = {
    overview:'Sales', dealers:'Sales', monthly:'Sales', compare:'Sales', map:'Sales', salesCat:'Sales', reports:'Sales', sheets:'Sales',
    upload:'Data entry', entry:'Data entry', months:'Data entry', producttx:'Data entry',
    attendance:'Team', leaves:'Team', visits:'Team', leads:'Team', tasks:'Team', tickets:'Team',
    incentiveHome:'Billing incentive', incentive:'Billing incentive', incentiveHistory:'Billing incentive', incentiveRule:'Billing incentive', incentiveUpload:'Billing incentive',
    salesIncentive:'Sales incentive', salesIncentiveRule:'Sales incentive',
    outstanding:'Old outstanding', followups:'Old outstanding',
    admin:'Admin',
  };
  const GROUP_ORDER = ['Sales', 'Data entry', 'Team', 'Billing incentive', 'Sales incentive', 'Collections', 'Old outstanding', 'Admin'];
  const groupOf = c => c.group || PAGE_GROUP[c.key] || (c.key.startsWith('col') ? 'Collections' : 'Other');
  const shortOf = c => c.group ? c.label
                       : c.label.includes(' — ') ? c.label.split(' — ').slice(1).join(' — ') : c.label.replace(/\s*\(CRM\)/, '');
  const groups = useMemo(() => {
    const out = [];
    // pages are sorted into their group order; actions already arrive grouped
    const ordered = view === 'pages'
      ? [...cols].sort((a, b) => { const ia = GROUP_ORDER.indexOf(groupOf(a)), ib = GROUP_ORDER.indexOf(groupOf(b)); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib); })
      : cols;
    for (const c of ordered) {
      const g = groupOf(c);
      const last = out[out.length - 1];
      if (last && last.name === g) last.cols.push(c); else out.push({ name: g, cols: [c] });
    }
    return out;
  }, [cols, view]);
  const [hoverCol, setHoverCol] = useState('');
  const toggleGroup = (g) => {
    const targets = rows.filter(editable);
    const all = targets.every(u => g.cols.every(c => has(u.id, c.key)));
    targets.forEach(u => g.cols.forEach(c => setCell(u.id, c.key, !all)));
  };
  const GROUP_TINT = ['transparent', 'rgba(99,102,241,.05)'];

  const thBase = { position:'sticky', zIndex:2, background:'var(--bg1)', fontSize:10, color:'var(--t3)', fontWeight:700 };
  const CELL = 30;   // column width — wide enough for a real tick target, narrow enough for 40 columns

  /** One tick cell: a filled square when on, an outline when off, green when the user is unrestricted. */
  const Tick = ({ on, free, dim }) => (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:17, height:17, borderRadius:5,
      background: free ? 'rgba(34,197,94,.18)' : on ? 'var(--acc)' : 'var(--bg1)',
      border: free ? '1px solid rgba(34,197,94,.45)' : on ? '1px solid var(--acc)' : '1.5px solid var(--b2)',
      color: free ? 'var(--grn)' : '#fff', opacity: dim ? .35 : 1, transition:'background .1s' }}>
      {(on || free) && <Check size={12} strokeWidth={3}/>}
    </span>
  );

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:12}}>
        <Shield size={15} color="var(--acc)"/>
        <div style={{fontSize:14, fontWeight:700}}>Permissions</div>
        <div style={{display:'flex', gap:4, marginLeft:8}}>
          {[['pages','Pages — what they see'], ['actions','Actions — what they may do']].map(([v, label]) => (
            <button key={v} className={view===v ? 'btnp' : 'btn'} onClick={()=>setView(v)}
              style={{fontSize:11.5, padding:'4px 10px'}}>{label}</button>
          ))}
        </div>
        <div style={{position:'relative', marginLeft:'auto'}}>
          <Search size={12} style={{position:'absolute', left:8, top:8, color:'var(--t3)'}}/>
          <input className="sel" value={q} onChange={e=>setQ(e.target.value)} placeholder="Find a user…"
            style={{fontSize:12, width:170, paddingLeft:24, cursor:'text'}}/>
        </div>
        {changed.length > 0 && (
          <button className="btn" onClick={seed} disabled={busy}
            style={{display:'inline-flex', alignItems:'center', gap:5, fontSize:12}}>
            <RotateCcw size={12}/> Discard
          </button>
        )}
        <button className="btnp" onClick={save} disabled={!changed.length || busy}
          style={{display:'inline-flex', alignItems:'center', gap:5, fontSize:12,
                  opacity:(!changed.length||busy)?0.5:1, cursor:(!changed.length||busy)?'not-allowed':'pointer'}}>
          <Save size={12}/> {busy ? 'Saving…' : changed.length ? `Save ${changed.length} user${changed.length===1?'':'s'}` : 'Save'}
        </button>
      </div>

      <div style={{fontSize:11.5, color:'var(--t3)', lineHeight:1.6, marginBottom:12}}>
        {view === 'pages'
          ? <>A row with <b>nothing ticked</b> means role defaults — that user sees everything their role normally does. Tick anything and they see <b>only</b> what is ticked.</>
          : <>A row with <b>nothing ticked</b> means role defaults — admins may do everything, salesmen may do no admin actions. Tick anything and they may do <b>only</b> what is ticked.</>}
        {' '}Click a permission name to set it for everyone; click a user's name to set everything for them.
        {!isSuperAdmin && <> <b style={{color:'var(--yel)'}}>Read-only — only a superadmin can change permissions.</b></>}
      </div>

      <style>{`
        .perm-matrix tbody tr.p:hover td { background: rgba(99,102,241,.07) !important; }
        .perm-matrix td.hc, .perm-matrix th.hc { background: rgba(99,102,241,.09) !important; }
        .perm-matrix th.u:hover, .perm-matrix td.lbl:hover, .perm-matrix tr.g:hover td { background: var(--bg2) !important; }
      `}</style>
      {/* Permissions down the side, users across the top: forty permission names
          read as plain text, and seventeen user names fit in a row. */}
      <div className="scroll perm-matrix" style={{overflow:'auto', maxHeight:'68vh', border:'1px solid var(--b1)', borderRadius:8}}>
        <table style={{borderCollapse:'separate', borderSpacing:0, fontSize:12}}>
          <thead>
            <tr>
              <th style={{...thBase, top:0, left:0, zIndex:4, textAlign:'left', minWidth:230, width:250, padding:'8px 10px',
                          borderRight:'1px solid var(--b1)', borderBottom:'1px solid var(--b1)', verticalAlign:'bottom'}}>
                {view === 'pages' ? 'Page' : 'Action'}
                <div style={{fontWeight:400, fontSize:9.5, marginTop:2}}>click a name to set it for everyone</div>
              </th>
              {rows.map(u => {
                const free = u.role === 'superadmin';
                const n = cols.filter(c=>has(u.id,c.key)).length;
                const canEdit = editable(u);
                return (
                  <th key={u.id} className={'u' + (hoverCol === u.id ? ' hc' : '')} onClick={()=>canEdit && toggleRow(u.id)}
                    onMouseEnter={()=>setHoverCol(u.id)} onMouseLeave={()=>setHoverCol('')}
                    title={canEdit ? `Tick / untick everything for ${u.name || u.id}` : free ? 'Superadmin — always everything' : ''}
                    style={{...thBase, top:0, zIndex:3, padding:'8px 6px 6px', minWidth:76, maxWidth:96, textAlign:'center',
                            borderLeft:'1px solid var(--b1)', borderBottom:'1px solid var(--b1)', cursor:canEdit?'pointer':'default', verticalAlign:'bottom'}}>
                    <div style={{fontSize:11.5, fontWeight:700, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{u.name || u.id}</div>
                    <div style={{fontSize:9.5, fontWeight:500, color:'var(--t3)', textTransform:'capitalize'}}>{u.role}</div>
                    <span style={{display:'inline-block', marginTop:4, fontSize:9.5, fontWeight:700, padding:'1px 7px', borderRadius:10, whiteSpace:'nowrap',
                      background: free ? 'rgba(34,197,94,.14)' : n ? 'rgba(99,102,241,.14)' : 'var(--bg2)',
                      color: free ? 'var(--grn)' : n ? 'var(--acc)' : 'var(--t3)', border:'1px solid ' + (free ? 'rgba(34,197,94,.35)' : n ? 'rgba(99,102,241,.35)' : 'var(--b1)')}}>
                      {free ? 'all' : n ? `${n} of ${cols.length}` : 'role default'}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <React.Fragment key={g.name}>
                {/* group heading row: click to set the whole group for everyone */}
                <tr className="g" onClick={()=>isSuperAdmin && toggleGroup(g)} title={isSuperAdmin ? `Tick / untick every ${g.name} ${view === 'pages' ? 'page' : 'action'} for everyone` : ''}
                  style={{cursor:isSuperAdmin?'pointer':'default'}}>
                  <td style={{position:'sticky', left:0, zIndex:1, padding:'7px 10px', background:'rgba(99,102,241,.08)', borderRight:'1px solid var(--b1)',
                              fontSize:10, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--acc)', whiteSpace:'nowrap'}}>
                    {g.name} <span style={{fontWeight:500, opacity:.7}}>· {g.cols.length}</span>
                  </td>
                  <td colSpan={rows.length} style={{background:'rgba(99,102,241,.08)'}}/>
                </tr>
                {g.cols.map(c => {
                  const off = globalOff.includes(c.key);
                  return (
                    <tr key={c.key} className="p">
                      <td className="lbl" onClick={()=>isSuperAdmin && toggleColumn(c.key)}
                        title={(c.desc || c.label) + (off ? ' — switched off for the whole company under Features' : isSuperAdmin ? ' — click to tick / untick for everyone' : '')}
                        style={{position:'sticky', left:0, zIndex:1, padding:'5px 10px 5px 18px', background:'var(--bg1)', borderRight:'1px solid var(--b1)',
                                borderTop:'1px solid var(--b1)', cursor:isSuperAdmin?'pointer':'default', whiteSpace:'nowrap'}}>
                        <div style={{fontWeight:600, color: off ? 'var(--red)' : 'var(--t1)', textDecoration: off ? 'line-through' : 'none'}}>
                          {shortOf(c)}{off && <span style={{marginLeft:6, fontSize:9, fontWeight:700, padding:'0 5px', borderRadius:8, background:'rgba(220,38,38,.1)', border:'1px solid rgba(220,38,38,.3)', textDecoration:'none', display:'inline-block'}}>off</span>}
                        </div>
                        {c.desc && <div style={{fontSize:10, color:'var(--t3)', whiteSpace:'normal', maxWidth:230}}>{c.desc}</div>}
                      </td>
                      {rows.map(u => {
                        const on = has(u.id, c.key);
                        const free = u.role === 'superadmin';
                        const canEdit = editable(u);
                        return (
                          <td key={u.id} onClick={()=>canEdit && toggleCell(u.id, c.key)} className={hoverCol === u.id ? 'hc' : ''}
                            onMouseEnter={()=>setHoverCol(u.id)} onMouseLeave={()=>setHoverCol('')}
                            style={{textAlign:'center', padding:'5px 0', cursor:canEdit?'pointer':'default', borderLeft:'1px solid var(--b1)', borderTop:'1px solid var(--b1)'}}>
                            <Tick on={on} free={free} dim={off}/>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
            {rows.length === 0 && (
              <tr><td style={{padding:22, textAlign:'center', color:'var(--t3)'}}>
                No user matches “{q.trim()}”.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{display:'flex', gap:14, alignItems:'center', flexWrap:'wrap', fontSize:10.5, color:'var(--t3)', marginTop:8}}>
        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><Tick on/> allowed</span>
        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><Tick/> not ticked</span>
        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><Tick free/> superadmin, always everything</span>
        <span style={{display:'inline-flex', alignItems:'center', gap:5}}><Tick on dim/> <span style={{textDecoration:'line-through', color:'var(--red)'}}>column</span> switched off for the whole company under Features</span>
      </div>
      <div style={{fontSize:10.5, color:'var(--t3)', marginTop:4}}>
        Region, city, zone and salesman scoping stay in User Management → Permissions, per user.
      </div>
    </div>
  );
}
