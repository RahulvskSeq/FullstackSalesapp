import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Save, RotateCcw, Search, Check, SlidersHorizontal, LayoutGrid, Info, Users } from 'lucide-react';
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
// Roles a default can be set for. Superadmin is never restricted. Keyed as
// "role:<name>" in the draft so the same cell logic serves users and roles.
const ROLE_COLS = [
  { id: 'role:salesman', role: 'salesman', name: 'Salesman', hint: 'built-in: sales screens, no admin actions' },
  { id: 'role:employee', role: 'employee', name: 'Employee', hint: 'built-in: staff screens, actions only when granted' },
  { id: 'role:admin',    role: 'admin',    name: 'Admin',    hint: 'built-in: everything' },
];

export default function PermissionsMatrix({ setUsers, currentUser }) {
  // Own copy of the roster: the map App passes around is for display and does
  // not reliably carry permissions, which is the whole point of this screen.
  const [users, setLocalUsers] = useState({});
  const [actions, setActions]   = useState([]);
  const [globalOff, setGlobalOff] = useState([]);
  const [draft, setDraft]       = useState({});     // uid → { pages:Set, features:Set }
  const [view, setView]         = useState('pages');
  const [mode, setMode]         = useState('users');    // 'users' | 'roles'
  const [roleStored, setRoleStored] = useState({});     // role → { pages:[], features:[] } as saved
  const [q, setQ]               = useState('');
  const [busy, setBusy]         = useState(false);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    api.actionPermissions().then(r => setActions(r?.actions || [])).catch(() => setActions([]));
    api.featuresGet().then(r => setGlobalOff(r?.disabled || [])).catch(() => {});
    api.getUsersAll().then(r => setLocalUsers(r || {})).catch(() => setLocalUsers({}));
    api.rolePermissions().then(r => setRoleStored(r?.permissions || {})).catch(() => {});
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
    for (const rc of ROLE_COLS) {
      const p = roleStored[rc.role] || EMPTY;
      d[rc.id] = { pages: new Set(p.pages || []), features: new Set(p.features || []) };
    }
    setDraft(d);
  };
  useEffect(seed, [users, roleStored]);

  const rows = useMemo(() => {
    if (mode === 'roles') return ROLE_COLS;
    const list = Object.values(users || {})
      // A superadmin ignores every restriction, so a row of checkboxes for one
      // would be a lie. They are listed, greyed, and not editable.
      .sort((a, b) => (a.role === 'superadmin') - (b.role === 'superadmin')
                   || String(a.name || a.id).localeCompare(String(b.name || b.id)));
    const needle = q.trim().toLowerCase();
    return needle
      ? list.filter(u => (u.name || '').toLowerCase().includes(needle) || (u.id || '').toLowerCase().includes(needle))
      : list;
  }, [users, q, mode]);

  const cols = view === 'pages'
    ? NAV_PAGES.map(p => ({ key: p.id, label: p.label }))
    : actions.map(a => ({ key: a.key, label: a.label, group: a.group, desc: a.desc }));

  const field = view === 'pages' ? 'pages' : 'features';

  // What a user or role actually has when no list is stored — the built-in
  // rules the app applies (mirrors pageVisible / hasFeature in App.jsx).
  // Pages: three are superadmin-only, a few need staff; everything else is
  // open. Actions: an admin may do everything, others nothing until granted.
  const SUPER_ONLY = new Set(['upload', 'entry', 'months']);
  const STAFF_ONLY = new Set(['colImports', 'colReconciliation', 'colSettings', 'reports', 'admin']);
  const builtIn = (role) => field === 'pages'
    ? new Set(NAV_PAGES.map(p => p.id).filter(id => !SUPER_ONLY.has(id) && (!STAFF_ONLY.has(id) || role === 'admin' || (role === 'employee' && id !== 'admin'))))
    : new Set(role === 'admin' ? actions.map(a => a.key) : []);
  // user list → role list → built-in
  const baseFor = (u) => {
    if (u.role === 'superadmin') return new Set(cols.map(c => c.key));
    if (!String(u.id).startsWith('role:')) {
      const rl = roleStored[u.role]?.[field] || [];
      if (rl.length) return new Set(rl);
    }
    return builtIn(u.role);
  };
  const stored = (uid) => draft[uid]?.[field] || new Set();
  const isDefault = (u) => stored(u.id).size === 0;
  // ticks show the EFFECTIVE permission: the stored list, or the default it falls back to
  const shown = (u, key) => isDefault(u) ? baseFor(u).has(key) : stored(u.id).has(key);
  // first click on a default column copies the default into a list of its own, then changes it
  // The base is read inside the updater, from the latest draft: row / column /
  // group toggles call this in a loop, and a base taken from the render closure
  // made each call start from the same stale set, so only the last one stuck.
  const setCell = (u, key, on) => {
    setDraft(d => {
      const cur = d[u.id] || { pages: new Set(), features: new Set() };
      const src = cur[field]?.size ? cur[field] : baseFor(u);
      const next = new Set(src);
      on ? next.add(key) : next.delete(key);
      return { ...d, [u.id]: { ...cur, [field]: next } };
    });
  };
  const clearList = (u) => setDraft(d => ({ ...d, [u.id]: { ...(d[u.id] || { pages: new Set(), features: new Set() }), [field]: new Set() } }));
  const editable = (u) => isSuperAdmin && u.role !== 'superadmin';

  const toggleCell   = (u, key) => setCell(u, key, !shown(u, key));
  const toggleRow    = (u) => {
    const all = cols.every(c => shown(u, c.key));
    cols.forEach(c => setCell(u, c.key, !all));
  };
  const toggleColumn = (key) => {
    const targets = rows.filter(editable);
    const all = targets.every(u => shown(u, key));
    targets.forEach(u => setCell(u, key, !all));
  };

  // What actually differs from what is stored — only those users get written.
  const changed = useMemo(() => {
    const out = [];
    if (mode === 'roles') {
      for (const rc of ROLE_COLS) {
        const d = draft[rc.id]; if (!d) continue;
        const p = roleStored[rc.role] || EMPTY;
        const same = (setA, arr) => setA.size === (arr || []).length && (arr || []).every(x => setA.has(x));
        if (!same(d.pages, p.pages) || !same(d.features, p.features)) out.push(rc.id);
      }
      return out;
    }
    for (const u of Object.values(users || {})) {
      const d = draft[u.id]; if (!d) continue;
      const p = u.permissions || EMPTY;
      const same = (setA, arr) => setA.size === (arr || []).length && (arr || []).every(x => setA.has(x));
      if (!same(d.pages, p.pages) || !same(d.features, p.features)) out.push(u.id);
    }
    return out;
  }, [draft, users, roleStored, mode]);

  const save = async () => {
    if (!changed.length) return;
    setBusy(true);
    if (mode === 'roles') {
      const permissions = {};
      for (const rc of ROLE_COLS) permissions[rc.role] = { pages: [...(draft[rc.id]?.pages || [])], features: [...(draft[rc.id]?.features || [])] };
      try { const r = await api.rolePermissionsSave(permissions); setRoleStored(r?.permissions || permissions); notify.success('Role defaults saved — applies to everyone on those roles without a list of their own'); }
      catch (e) { notify.error(e?.message || 'Not saved'); }
      setBusy(false);
      return;
    }
    let ok = 0, failed = [];
    const savedIds = [];
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
        savedIds.push(uid);
        ok++;
      } catch (e) { failed.push(uid + ': ' + (e?.message || 'failed')); }
    }
    setLocalUsers(nextUsers);
    // This screen holds the full roster (inactive users too); App's map is
    // active-only, so merge just the saved permissions into what it already has.
    setUsers?.(prev => {
      const n = { ...(prev || {}) };
      for (const id of savedIds) if (n[id]) n[id] = { ...n[id], permissions: nextUsers[id].permissions };
      return n;
    });
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
    attendance:'Team', leaves:'Team', visits:'Team', calendar:'Team', leads:'Team', tasks:'Team', tickets:'Team',
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
    const all = targets.every(u => g.cols.every(c => shown(u, c.key)));
    targets.forEach(u => g.cols.forEach(c => setCell(u, c.key, !all)));
  };
  const GROUP_TINT = ['transparent', 'rgba(99,102,241,.05)'];

  const thBase = { position:'sticky', zIndex:2, background:'var(--bg1)', fontSize:10, color:'var(--t3)', fontWeight:700 };
  const CELL = 30;   // column width — wide enough for a real tick target, narrow enough for 40 columns

  /** One tick cell: a filled square when on, an outline when off, green when the user is unrestricted. */
  // soft = inherited from the role / built-in default (hollow tick); solid = the user's own list
  const Tick = ({ on, free, dim, soft }) => (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:17, height:17, borderRadius:5,
      background: free ? 'color-mix(in srgb, var(--grn) 18%, transparent)' : on ? (soft ? 'color-mix(in srgb, var(--acc) 16%, transparent)' : 'var(--acc)') : 'var(--bg1)',
      border: free ? '1px solid color-mix(in srgb, var(--grn) 45%, transparent)' : on ? '1px solid var(--acc)' : '1.5px solid var(--b2)',
      color: free ? 'var(--grn)' : (soft ? 'var(--acc)' : '#fff'), opacity: dim ? .35 : 1, transition:'background .1s' }}>
      {(on || free) && <Check size={12} strokeWidth={3}/>}
    </span>
  );

  // ── Editor layout (UI only) ──────────────────────────────────────────────
  // 'editor' = pick one role / user, flip switches grouped by section.
  // 'grid'   = the original everyone-at-once matrix, for "who can upload?".
  const [layout, setLayout] = useState('editor');
  const [selId, setSelId]   = useState('');
  const [pq, setPq]         = useState('');     // permission search
  const allSubjects = mode === 'roles' ? ROLE_COLS : Object.values(users || {});
  const subject = allSubjects.find(s => s.id === selId) || rows[0] || null;
  const roleCount = (role) => Object.values(users || {}).filter(u => u.role === role).length;
  const pNeedle = pq.trim().toLowerCase();
  const visGroups = pNeedle
    ? groups.map(g => ({ ...g, cols: g.cols.filter(c => [c.label, shortOf(c), c.desc, g.name].some(v => String(v || '').toLowerCase().includes(pNeedle))) })).filter(g => g.cols.length)
    : groups;
  // tick / untick one whole section for the selected subject (same setCell as every other toggle)
  const toggleGroupFor = (u, g) => {
    const all = g.cols.every(c => shown(u, c.key));
    g.cols.forEach(c => setCell(u, c.key, !all));
  };
  const switchMode = (m) => { if (m === mode) return; if (changed.length && !window.confirm('Discard unsaved changes?')) return; seed(); setMode(m); setSelId(''); };
  const ROLE_TONE = { salesman:'var(--grn)', employee:'#06b6d4', admin:'var(--pur)', superadmin:'var(--yel)' };
  const toneOf = (r) => ROLE_TONE[r] || 'var(--acc)';
  const subjState = (u) => u.role === 'superadmin' ? { t:'Always everything', tone:'var(--grn)' }
    : isDefault(u) ? { t: mode === 'roles' ? 'Built-in default' : 'Follows role', tone:'var(--t3)' }
    : { t: mode === 'roles' ? 'Custom default' : 'Own list', tone:'var(--acc)' };

  /** Visual switch (the row around it is the button). */
  const Sw = ({ on, soft, free, dim }) => (
    <span className={'pm-sw' + (on || free ? ' on' : '') + (soft ? ' soft' : '') + (free ? ' free' : '')} style={{opacity: dim ? .45 : 1}}/>
  );

  return (
    <div className="pm">
      <style>{PM_CSS}</style>

      {/* ── Toolbar: what to edit, for whom, and how to see it ───────────── */}
      <div className="pm-bar">
        <div className="seg" title="Pages decide what a person sees; actions decide what they may do">
          {[['pages','Pages','what they see'], ['actions','Actions','what they may do']].map(([v, label, hint]) => (
            <button key={v} className={'seg-b' + (view===v ? ' on' : '')} style={{'--tone':'var(--acc)'}} onClick={()=>setView(v)} title={hint}>{label}</button>
          ))}
        </div>
        {/* per user, or the default for a whole role */}
        <div className="seg">
          {[['users','By user'], ['roles','By role']].map(([m, label]) => (
            <button key={m} className={'seg-b' + (mode===m ? ' on' : '')} style={{'--tone':'var(--pur)'}} onClick={()=>switchMode(m)}>{label}</button>
          ))}
        </div>
        <div className="pm-search">
          <Search size={13}/>
          <input className="inp" value={pq} onChange={e=>setPq(e.target.value)} placeholder={view === 'pages' ? 'Search pages…' : 'Search actions…'}/>
        </div>
        <div className="seg" style={{marginLeft:'auto'}}>
          {[['editor','Editor', SlidersHorizontal], ['grid','Grid', LayoutGrid]].map(([l, label, Ico]) => (
            <button key={l} className={'seg-b' + (layout===l ? ' on' : '')} style={{'--tone':'var(--acc)', display:'inline-flex', alignItems:'center', gap:5}} onClick={()=>setLayout(l)}
              title={l === 'grid' ? 'Everyone at once — handy for "who can upload?"' : 'One role or person at a time'}><Ico size={12}/> {label}</button>
          ))}
        </div>
      </div>

      <div className="pm-help">
        <Info size={13} style={{flexShrink:0, marginTop:2, color:'var(--acc)'}}/>
        <div>
          {mode === 'roles' ? <>
            The default for everyone on a role who has no list of their own. A role with <b>nothing switched on</b> keeps the built-in default; switch anything on and that role gets <b>only</b> what is on.
            A user's own list (By user) always overrides their role. Superadmins are never restricted.
          </> : <>The switches show what each user has <b>right now</b>. A faded switch comes from their role; change any switch and the user gets a list of their own that overrides the role. <b>Follow role</b> drops that list again.</>}
          {!isSuperAdmin && <> <b style={{color:'var(--yel)'}}>Read-only — only a superadmin can change permissions.</b></>}
        </div>
      </div>

      {layout === 'editor' ? (
        <div className="pm-shell">
          {/* ── Subject picker ─────────────────────────────────────────── */}
          <div className="pm-subjects card">
            {mode === 'users' && (
              <div className="pm-search" style={{marginBottom:8}}>
                <Search size={13}/>
                <input className="inp" value={q} onChange={e=>setQ(e.target.value)} placeholder="Find a user…"/>
              </div>
            )}
            <div className="pm-sublist">
              {rows.map(u => {
                const on = subject && subject.id === u.id;
                const free = u.role === 'superadmin';
                const n = cols.filter(c => shown(u, c.key)).length;
                const st = subjState(u);
                const dirty = changed.includes(u.id);
                const tone = toneOf(u.role);
                return (
                  <button key={u.id} className={'pm-subj' + (on ? ' on' : '')} style={{'--tone':tone}} onClick={()=>setSelId(u.id)}>
                    {mode === 'roles'
                      ? <span className="pm-subj-ico"><Users size={15}/></span>
                      : <span className="ini" style={{'--h':(u.name||u.id||'?').charCodeAt(0)*37%360, width:30, height:30}}>{String(u.name||u.id||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span>}
                    <span style={{minWidth:0, flex:1, textAlign:'left'}}>
                      <span className="pm-subj-name">{u.name || u.id}{dirty && <i className="pm-dirty" title="Unsaved changes"/>}</span>
                      <span className="pm-subj-sub">
                        {mode === 'roles' ? `${roleCount(u.role)} user${roleCount(u.role)===1?'':'s'}` : <span style={{textTransform:'capitalize', color:tone, fontWeight:700}}>{u.role}</span>}
                        {' · '}{free ? 'all' : `${n}/${cols.length}`}
                      </span>
                    </span>
                    <span className="pm-subj-st" style={{'--tone':st.tone}}>{free ? 'All' : isDefault(u) ? (mode === 'roles' ? 'Built-in' : 'Role') : 'Own'}</span>
                  </button>
                );
              })}
              {rows.length === 0 && <div style={{fontSize:12, color:'var(--t3)', padding:12, textAlign:'center'}}>No user matches “{q.trim()}”.</div>}
            </div>
          </div>

          {/* ── Switches for the selected role / user ─────────────────── */}
          <div style={{minWidth:0}}>
            {!subject ? (
              <div className="card" style={{textAlign:'center', color:'var(--t3)', padding:30}}>Pick a {mode === 'roles' ? 'role' : 'user'} to see their permissions.</div>
            ) : (() => {
              const u = subject;
              const free = u.role === 'superadmin';
              const canEdit = editable(u);
              const n = cols.filter(c => shown(u, c.key)).length;
              const st = subjState(u);
              const tone = toneOf(u.role);
              return (
                <>
                  <div className="card pm-subjhead" style={{'--tone':tone}}>
                    {mode === 'roles'
                      ? <span className="pm-subj-ico" style={{width:42, height:42, borderRadius:13}}><Users size={19}/></span>
                      : <span className="ini" style={{'--h':(u.name||u.id||'?').charCodeAt(0)*37%360, width:42, height:42, borderRadius:13, fontSize:13}}>{String(u.name||u.id||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span>}
                    <div style={{minWidth:0, flex:1}}>
                      <div style={{fontSize:16, fontWeight:800, color:'var(--t1)'}}>{u.name || u.id}</div>
                      <div style={{fontSize:11.5, color:'var(--t3)'}}>{u.hint || (mode === 'roles' ? '' : '@' + u.id + ' · ' + u.role)}</div>
                    </div>
                    <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap'}}>
                      <span className="pm-pill" style={{'--tone':st.tone}}>{st.t}</span>
                      <span className="kpi-pill">{view === 'pages' ? 'Pages' : 'Actions'} <b>{free ? 'all' : `${n} / ${cols.length}`}</b></span>
                      {!free && !isDefault(u) && canEdit && (
                        <button className="btn" onClick={()=>clearList(u)} title={mode === 'roles' ? 'Go back to the built-in default' : 'Drop the own list and follow the role again'}
                          style={{fontSize:11.5, padding:'4px 10px', display:'inline-flex', alignItems:'center', gap:5}}>
                          <RotateCcw size={12}/> {mode === 'roles' ? 'Built-in default' : 'Follow role'}
                        </button>
                      )}
                    </div>
                  </div>

                  {visGroups.map(g => {
                    const onN = g.cols.filter(c => shown(u, c.key)).length;
                    const allOn = onN === g.cols.length;
                    return (
                      <div key={g.name} className="card pm-group">
                        <div className="pm-group-head">
                          <span style={{fontWeight:800, color:'var(--t1)', fontSize:13}}>{g.name}</span>
                          <span className="count-pill">{onN}/{g.cols.length}</span>
                          <span className="spacer" style={{flex:1}}/>
                          {canEdit && (
                            <button className="pm-all" onClick={()=>toggleGroupFor(u, g)} title={allOn ? `Switch off every ${g.name} ${view === 'pages' ? 'page' : 'action'}` : `Switch on every ${g.name} ${view === 'pages' ? 'page' : 'action'}`}>
                              <Sw on={allOn} soft={!free && isDefault(u)}/> {allOn ? 'All on' : 'Select all'}
                            </button>
                          )}
                        </div>
                        <div className="pm-items">
                          {g.cols.map(c => {
                            const on = shown(u, c.key);
                            const off = globalOff.includes(c.key);
                            return (
                              <button key={c.key} className={'pm-item' + (on ? ' on' : '')} disabled={!canEdit}
                                onClick={()=>canEdit && toggleCell(u, c.key)}
                                title={(c.desc || c.label) + (off ? ' — switched off for the whole company under Features' : '')}>
                                <span style={{minWidth:0, flex:1, textAlign:'left'}}>
                                  <span style={{display:'flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:650, color: off ? 'var(--red)' : on ? 'var(--t1)' : 'var(--t2)', textDecoration: off ? 'line-through' : 'none'}}>
                                    {shortOf(c)}
                                    {off && <span className="pm-off">off</span>}
                                  </span>
                                  {c.desc && <span style={{display:'block', fontSize:10.5, color:'var(--t3)', marginTop:1, lineHeight:1.35}}>{c.desc}</span>}
                                </span>
                                <Sw on={on} free={free} soft={!free && isDefault(u)} dim={off}/>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {visGroups.length === 0 && (
                    <div className="card" style={{textAlign:'center', color:'var(--t3)', padding:24}}>Nothing matches “{pq.trim()}”.</div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      ) : (
        <>
          {mode === 'users' && (
            <div className="pm-search" style={{maxWidth:260, marginBottom:10}}>
              <Search size={13}/>
              <input className="inp" value={q} onChange={e=>setQ(e.target.value)} placeholder="Find a user…"/>
            </div>
          )}
          <div style={{fontSize:11.5, color:'var(--t3)', marginBottom:8}}>Click a permission name to set it for everyone; click a user's name to set everything for them; click a section heading to set the whole section.</div>
          <style>{`
            .perm-matrix tbody tr.p:hover td { background: color-mix(in srgb, var(--acc) 7%, transparent) !important; }
            .perm-matrix td.hc, .perm-matrix th.hc { background: color-mix(in srgb, var(--acc) 9%, transparent) !important; }
            .perm-matrix th.u:hover, .perm-matrix td.lbl:hover, .perm-matrix tr.g:hover td { background: var(--bg2) !important; }
          `}</style>
          {/* Permissions down the side, users across the top: forty permission names
              read as plain text, and seventeen user names fit in a row. */}
          <div className="scroll perm-matrix card" style={{overflow:'auto', maxHeight:'68vh', padding:0}}>
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
                    const n = cols.filter(c=>shown(u,c.key)).length;
                    const dflt = isDefault(u);
                    const canEdit = editable(u);
                    return (
                      <th key={u.id} className={'u' + (hoverCol === u.id ? ' hc' : '')} onClick={()=>canEdit && toggleRow(u)}
                        onMouseEnter={()=>setHoverCol(u.id)} onMouseLeave={()=>setHoverCol('')}
                        title={canEdit ? `Tick / untick everything for ${u.name || u.id}` : free ? 'Superadmin — always everything' : ''}
                        style={{...thBase, top:0, zIndex:3, padding:'8px 6px 6px', minWidth: mode === 'roles' ? 160 : 76, maxWidth: mode === 'roles' ? 200 : 96, textAlign:'center',
                                borderLeft:'1px solid var(--b1)', borderBottom:'1px solid var(--b1)', cursor:canEdit?'pointer':'default', verticalAlign:'bottom'}}>
                        <div style={{fontSize:11.5, fontWeight:700, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{u.name || u.id}</div>
                        <div style={{fontSize:9.5, fontWeight:500, color:'var(--t3)', textTransform: u.hint ? 'none' : 'capitalize', whiteSpace:'normal', maxWidth:150}}>{u.hint || u.role}</div>
                        <span title={free ? '' : dflt ? 'No list of its own — the ticks are what the role gives. Change any tick to make an own list.' : 'Own list'}
                          style={{display:'inline-block', marginTop:4, fontSize:9.5, fontWeight:700, padding:'1px 7px', borderRadius:10, whiteSpace:'nowrap',
                          background: free ? 'color-mix(in srgb, var(--grn) 14%, transparent)' : dflt ? 'var(--bg2)' : 'color-mix(in srgb, var(--acc) 14%, transparent)',
                          color: free ? 'var(--grn)' : dflt ? 'var(--t3)' : 'var(--acc)', border:'1px solid ' + (free ? 'color-mix(in srgb, var(--grn) 35%, transparent)' : dflt ? 'var(--b1)' : 'color-mix(in srgb, var(--acc) 35%, transparent)')}}>
                          {free ? 'all' : `${n} of ${cols.length}`}{!free && dflt ? (mode === 'roles' ? ' · built-in' : ' · from role') : ''}
                        </span>
                        {!free && !dflt && canEdit && (
                          <div><button className="btn" onClick={e => { e.stopPropagation(); clearList(u); }} title="Drop the own list and follow the role again"
                            style={{fontSize:9, padding:'0 6px', marginTop:3}}>↺ follow role</button></div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visGroups.map(g => (
                  <React.Fragment key={g.name}>
                    {/* group heading row: click to set the whole group for everyone */}
                    <tr className="g" onClick={()=>isSuperAdmin && toggleGroup(g)} title={isSuperAdmin ? `Tick / untick every ${g.name} ${view === 'pages' ? 'page' : 'action'} for everyone` : ''}
                      style={{cursor:isSuperAdmin?'pointer':'default'}}>
                      <td style={{position:'sticky', left:0, zIndex:1, padding:'7px 10px', background:'color-mix(in srgb, var(--acc) 8%, transparent)', borderRight:'1px solid var(--b1)',
                                  fontSize:10, fontWeight:800, letterSpacing:'.07em', textTransform:'uppercase', color:'var(--acc)', whiteSpace:'nowrap'}}>
                        {g.name} <span style={{fontWeight:500, opacity:.7}}>· {g.cols.length}</span>
                      </td>
                      <td colSpan={rows.length} style={{background:'color-mix(in srgb, var(--acc) 8%, transparent)'}}/>
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
                            const on = shown(u, c.key);
                            const free = u.role === 'superadmin';
                            const canEdit = editable(u);
                            return (
                              <td key={u.id} onClick={()=>canEdit && toggleCell(u, c.key)} className={hoverCol === u.id ? 'hc' : ''}
                                onMouseEnter={()=>setHoverCol(u.id)} onMouseLeave={()=>setHoverCol('')}
                                style={{textAlign:'center', padding:'5px 0', cursor:canEdit?'pointer':'default', borderLeft:'1px solid var(--b1)', borderTop:'1px solid var(--b1)'}}>
                                <Tick on={on} free={free} dim={off} soft={!free && isDefault(u)}/>
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
        </>
      )}

      {/* ── Legend ──────────────────────────────────────────────────────── */}
      <div className="pm-legend">
        {layout === 'editor' ? <>
          <span><Sw on/> allowed ({mode === 'roles' ? 'custom default' : 'own list'})</span>
          <span><Sw on soft/> allowed ({mode === 'roles' ? 'built-in' : 'from role / built-in'})</span>
          <span><Sw/> not allowed</span>
          <span><Sw free/> superadmin, always everything</span>
          <span><span className="pm-off">off</span> switched off for the whole company under Features</span>
        </> : <>
          <span><Tick on/> allowed (own list)</span>
          <span><Tick on soft/> allowed (from role / built-in)</span>
          <span><Tick/> not allowed</span>
          <span><Tick free/> superadmin, always everything</span>
          <span><Tick on dim/> <span style={{textDecoration:'line-through', color:'var(--red)'}}>row</span> switched off for the whole company under Features</span>
        </>}
      </div>
      <div style={{fontSize:10.5, color:'var(--t3)', marginTop:4}}>
        Region, city, zone and salesman scoping stay in Users → Access (the sliders icon), per user.
      </div>

      {/* ── Unsaved-changes bar ─────────────────────────────────────────── */}
      {changed.length > 0 && (
        <div className="pm-save">
          <span className="pm-save-dot"/>
          <div style={{minWidth:0, flex:1}}>
            <div style={{fontWeight:800, color:'var(--t1)', fontSize:13}}>Unsaved changes</div>
            <div style={{fontSize:11.5, color:'var(--t3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
              {changed.length} {mode === 'roles' ? 'role' : 'user'}{changed.length===1?'':'s'}: {changed.map(id => mode === 'roles' ? (ROLE_COLS.find(r => r.id === id)?.name || id) : (users[id]?.name || id)).join(', ')}
            </div>
          </div>
          <button className="btn" onClick={seed} disabled={busy} style={{display:'inline-flex', alignItems:'center', gap:5, fontSize:12}}>
            <RotateCcw size={12}/> Reset
          </button>
          <button className="btnp" onClick={save} disabled={busy} style={{display:'inline-flex', alignItems:'center', gap:5, fontSize:12}}>
            <Save size={12}/> {busy ? 'Saving…' : (mode === 'roles' ? `Save ${changed.length} role${changed.length===1?'':'s'}` : `Save ${changed.length} user${changed.length===1?'':'s'}`)}
          </button>
        </div>
      )}
    </div>
  );
}

const PM_CSS = `
  .pm-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
  .pm-bar .seg{max-width:100%;overflow-x:auto}
  .pm-search{position:relative;display:flex;align-items:center;flex:1 1 180px;min-width:0;max-width:320px}
  .pm-search>svg{position:absolute;left:10px;color:var(--t3);pointer-events:none}
  .pm-search .inp{width:100%;padding-left:30px}
  .pm-help{display:flex;gap:8px;font-size:11.5px;color:var(--t2);line-height:1.55;padding:9px 12px;border-radius:12px;background:color-mix(in srgb,var(--acc) 6%,transparent);border:1px solid color-mix(in srgb,var(--acc) 18%,transparent);margin-bottom:12px}
  .pm-shell{display:grid;grid-template-columns:270px minmax(0,1fr);gap:14px;align-items:start}
  .pm-subjects.card{padding:8px;position:sticky;top:12px;min-width:0}
  .pm-sublist{display:flex;flex-direction:column;gap:3px;max-height:62vh;overflow-y:auto}
  .pm-subj{--tone:var(--acc);display:flex;align-items:center;gap:9px;width:100%;border:1px solid transparent;background:transparent;border-radius:11px;padding:7px 8px;cursor:pointer;font-family:inherit;transition:background .15s}
  .pm-subj:hover{background:var(--bg2)}
  .pm-subj.on{background:color-mix(in srgb,var(--tone) 10%,transparent);border-color:color-mix(in srgb,var(--tone) 35%,transparent)}
  .pm-subj-ico{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 15%,transparent)}
  .pm-subj-name{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pm-subj-sub{display:block;font-size:10.5px;color:var(--t3);margin-top:1px;white-space:nowrap}
  .pm-subj-st{font-size:9.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent);padding:2px 7px;border-radius:20px;flex-shrink:0}
  .pm-dirty{width:7px;height:7px;border-radius:50%;background:var(--yel);flex-shrink:0;display:inline-block}
  .pm-subjhead.card{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
  .pm-pill{font-size:11px;font-weight:800;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent);border:1px solid color-mix(in srgb,var(--tone) 28%,transparent);padding:3px 10px;border-radius:20px;white-space:nowrap}
  .pm-group.card{margin-bottom:12px;padding:12px 14px}
  .pm-group-head{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}
  .pm-all{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--b1);background:var(--bg2);color:var(--t2);font-size:11.5px;font-weight:700;padding:4px 10px 4px 6px;border-radius:20px;cursor:pointer;font-family:inherit}
  .pm-all:hover{border-color:var(--b2);color:var(--t1)}
  .pm-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(240px,100%),1fr));gap:6px}
  .pm-item{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:11px;border:1px solid var(--b1);background:var(--bg1);cursor:pointer;font-family:inherit;transition:border-color .15s,background .15s;min-width:0}
  .pm-item:hover:not(:disabled){border-color:var(--b2);background:var(--bg2)}
  .pm-item.on{border-color:color-mix(in srgb,var(--acc) 35%,transparent);background:color-mix(in srgb,var(--acc) 5%,var(--bg1))}
  .pm-item:disabled{cursor:default}
  .pm-off{font-size:9px;font-weight:800;padding:0 6px;border-radius:8px;color:var(--red);background:color-mix(in srgb,var(--red) 10%,transparent);border:1px solid color-mix(in srgb,var(--red) 30%,transparent);text-decoration:none;display:inline-block}
  .pm-sw{position:relative;display:inline-block;width:34px;height:20px;border-radius:20px;background:var(--bg3);border:1px solid var(--b2);flex-shrink:0;transition:background .15s,border-color .15s}
  .pm-sw::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--bg1);box-shadow:0 1px 3px rgba(16,24,40,.3);transition:transform .15s}
  .pm-sw.on{background:var(--acc);border-color:var(--acc)}
  .pm-sw.on::after{transform:translateX(14px)}
  .pm-sw.on.soft{background:color-mix(in srgb,var(--acc) 40%,var(--bg3));border-color:color-mix(in srgb,var(--acc) 50%,transparent);border-style:dashed}
  .pm-sw.free{background:var(--grn);border-color:var(--grn)}
  .pm-sw.free::after{transform:translateX(14px)}
  .pm-legend{display:flex;gap:8px 16px;align-items:center;flex-wrap:wrap;font-size:11px;color:var(--t3);margin-top:10px;padding:10px 12px;border-radius:12px;background:var(--bg2);border:1px solid var(--b1)}
  .pm-legend>span{display:inline-flex;align-items:center;gap:6px}
  .pm-save{position:sticky;bottom:12px;z-index:20;margin-top:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:14px;
    background:var(--bg1);border:1px solid color-mix(in srgb,var(--yel) 45%,var(--b1));box-shadow:0 12px 32px rgba(16,24,40,.22);animation:pageIn .25s ease both}
  .pm-save-dot{width:10px;height:10px;border-radius:50%;background:var(--yel);box-shadow:0 0 0 4px color-mix(in srgb,var(--yel) 22%,transparent);flex-shrink:0}
  @media(max-width:860px){
    .pm-shell{grid-template-columns:minmax(0,1fr)}
    .pm-subjects.card{position:static}
    .pm-sublist{flex-direction:row;overflow-x:auto;max-height:none;gap:6px;scrollbar-width:none}
    .pm-sublist::-webkit-scrollbar{display:none}
    .pm-subj{width:auto;flex-shrink:0;max-width:240px;border-color:var(--b1)}
    .pm-search{max-width:none}
  }
`;
