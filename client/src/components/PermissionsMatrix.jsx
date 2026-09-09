import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Save, RotateCcw, Search } from 'lucide-react';
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

  const th = { position:'sticky', top:0, zIndex:2, background:'var(--bg1)', padding:'6px 4px',
               fontSize:10, color:'var(--t3)', fontWeight:700, borderBottom:'1px solid var(--b1)' };

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
        {' '}Click a column heading to set it for everyone; click a user to set their whole row.
        {!isSuperAdmin && <> <b style={{color:'var(--yel)'}}>Read-only — only a superadmin can change permissions.</b></>}
      </div>

      <div className="scroll perm-matrix" style={{overflow:'auto', maxHeight:'62vh', border:'1px solid var(--b1)', borderRadius:8}}>
        <table style={{borderCollapse:'separate', borderSpacing:0, fontSize:12, minWidth:'100%'}}>
          <thead>
            <tr>
              <th style={{...th, left:0, zIndex:3, textAlign:'left', minWidth:190, paddingLeft:10,
                          borderRight:'1px solid var(--b1)'}}>User</th>
              {cols.map(c => (
                <th key={c.key} onClick={()=>isSuperAdmin && toggleColumn(c.key)}
                  title={(c.desc || c.label) + (globalOff.includes(c.key) ? ' — switched off for everyone' : '')}
                  style={{...th, cursor:isSuperAdmin?'pointer':'default', minWidth:34, maxWidth:34}}>
                  <div style={{writingMode:'vertical-rl', transform:'rotate(180deg)', whiteSpace:'nowrap',
                               height:118, margin:'0 auto', overflow:'hidden', textOverflow:'ellipsis',
                               textDecoration: globalOff.includes(c.key) ? 'line-through' : 'none',
                               color: globalOff.includes(c.key) ? '#f87171' : 'var(--t3)'}}>
                    {c.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((u, i) => {
              const canEdit = editable(u);
              const none = cols.every(c => !has(u.id, c.key));
              return (
                <tr key={u.id} style={{background: i % 2 ? 'var(--bg2)' : 'transparent'}}>
                  <td onClick={()=>canEdit && toggleRow(u.id)}
                    style={{position:'sticky', left:0, zIndex:1, padding:'5px 10px',
                            background: i % 2 ? 'var(--bg2)' : 'var(--bg1)',
                            borderRight:'1px solid var(--b1)', cursor:canEdit?'pointer':'default',
                            whiteSpace:'nowrap'}}>
                    <div style={{fontWeight:700, color:'var(--t1)'}}>{u.name || u.id}</div>
                    <div style={{fontSize:10, color:'var(--t3)'}}>
                      {u.role}
                      {u.role === 'superadmin'
                        ? ' · unrestricted'
                        : none ? ' · role default' : ' · ' + cols.filter(c=>has(u.id,c.key)).length + ' set'}
                    </div>
                  </td>
                  {cols.map(c => {
                    const on = has(u.id, c.key);
                    const free = u.role === 'superadmin';
                    return (
                      <td key={c.key} onClick={()=>canEdit && toggleCell(u.id, c.key)}
                        style={{textAlign:'center', padding:'4px 0',
                                cursor:canEdit?'pointer':'default',
                                background: free ? 'rgba(52,211,153,0.06)' : (on ? 'rgba(99,102,241,0.16)' : 'transparent')}}>
                        <input type="checkbox" readOnly disabled={!canEdit}
                          checked={free || on} style={{margin:0, pointerEvents:'none'}}/>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={cols.length+1} style={{padding:22, textAlign:'center', color:'var(--t3)'}}>
                No user matches “{q.trim()}”.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{fontSize:10.5, color:'var(--t3)', marginTop:8}}>
        Region, city, zone and salesman scoping stay in User Management → Permissions, per user.
        A struck-through column is switched off for the whole company under Features.
      </div>
    </div>
  );
}
