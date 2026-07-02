import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, LogIn, KeyRound, Link as LinkIcon, Trash2, Shield, ShieldCheck, Power, PowerOff, MapPin } from 'lucide-react';
import { Avatar } from './UI';
import { api } from '../api';
import { notify, confirmDialog } from './Toast';

// Note: `setUsers` updates the client-side users map; `onLoginAs(token, user, impersonatedBy?)`
// is used by the superadmin "Login as" feature to swap the active JWT.
//
// `users` (prop) is the app-wide map of ACTIVE users (the rest of the app only
// ever sees active users). For this admin screen we also need to see and
// re-activate INACTIVE users, so we fetch a separate `allUsers` map via
// `api.getUsersAll()` on mount and on every change.
const UserManagement = ({ users, setUsers, currentUser, onClose, onLoginAs, onUsersChanged }) => {
  // Full user map including inactive — used for display in this modal only.
  const [allUsers, setAllUsers] = useState(users || {});
  const refreshAll = async () => {
    try { setAllUsers(await api.getUsersAll()); }
    catch(e) { /* fall back to active-only map already in state */ }
  };
  useEffect(() => { refreshAll(); }, []);
  const [name,    setName]    = useState('');
  const [id,      setId]      = useState('');
  const [pass,    setPass]    = useState('');
  const [role,    setRole]    = useState('salesman');
  const [url,     setUrl]     = useState('');
  const [color,   setColor]   = useState('#818cf8');
  const [busy,    setBusy]    = useState(false);
  const [msg,     setMsg]     = useState(null);
  // State-based permissions for the new user. Empty array = no restriction
  // (user sees every state). Pre-populate the list of states from the dealer
  // roster on first open so the admin can tick the relevant ones.
  const [allStates,    setAllStates]    = useState([]);
  const [allCities,    setAllCities]    = useState([]);
  const [createStates, setCreateStates] = useState(new Set());
  const [createCities, setCreateCities] = useState(new Set());
  useEffect(() => {
    // Case-insensitive de-dup so ALUVA / Aluva / aluva collapse into one
    // canonical entry. Keeps the first occurrence's original casing.
    const dedupCI = (arr) => {
      const seen = new Map();
      for (const v of (arr || [])) {
        const key = String(v || '').trim().toLowerCase();
        if (!key) continue;
        if (!seen.has(key)) seen.set(key, v);
      }
      return [...seen.values()].sort((a,b) => String(a).localeCompare(String(b)));
    };
    api.dealerDistinctStates().then(r => setAllStates(dedupCI(r?.states))).catch(() => {});
    api.dealerDistinctCities().then(r => setAllCities(dedupCI(r?.cities))).catch(() => {});
  }, []);

  const colors = ['#818cf8','#34d399','#f472b6','#fb923c','#fbbf24','#22d3ee','#e879f9','#a78bfa','#f87171','#4ade80'];

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin      = currentUser?.role === 'admin';

  const flash = (type, text, ms = 3000) => { setMsg({type, text}); setTimeout(()=>setMsg(null), ms); };

  // ── Create user (calls server) ──────────────────────────────────────────
  const create = async () => {
    const idC = id.trim().toLowerCase().replace(/\s+/g, '_');
    if(!name || !idC || !pass){ flash('error','Name, username and password required'); return; }
    if(pass.length < 4){ flash('error','Password min 4 characters'); return; }
    if(allUsers[idC]){ flash('error','Username already exists'); return; }
    if(!isSuperAdmin && (role === 'admin' || role === 'superadmin')){
      flash('error', 'Only superadmin can create admins or superadmins');
      return;
    }
    setBusy(true);
    try {
      const ini = name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
      const permissions = { states: [...createStates], cities: [...createCities], zones: [], salesmen: [] };
      const newUser = await api.createUser({ id: idC, name, pass, role, color, ini, permissions });
      // Optimistically update local cache for instant feedback…
      setUsers({ ...users, [idC]: { id: idC, name, pass, role, color, ini, url: url.trim() || null, active:true, permissions } });
      setAllUsers({ ...allUsers, [idC]: { id: idC, name, pass, role, color, ini, url: url.trim() || null, active:true, permissions } });
      // …then trigger a server-side refresh so the new user appears with all
      // server-side fields and persists across page reloads + other devices.
      onUsersChanged?.();
      refreshAll();
      setName(''); setId(''); setPass(''); setUrl(''); setRole('salesman'); setCreateStates(new Set()); setCreateCities(new Set());
      flash('success', 'Created ' + name + ' (' + idC + '). Password: ' + pass);
    } catch(e){
      flash('error', 'Create failed: ' + e.message);
    } finally { setBusy(false); }
  };

  // ── Edit a user (password, URL) ─────────────────────────────────────────
  const reset = async (uid) => {
    const np = prompt('New password for ' + allUsers[uid]?.name + ':');
    if(!np || np.length < 4){ if(np !== null) notify.error('Password must be at least 4 characters'); return; }
    try {
      await api.updateUser(uid, { pass: np });
      setUsers({ ...users, [uid]: { ...users[uid], pass: np } });
      setAllUsers({ ...allUsers, [uid]: { ...allUsers[uid], pass: np } });
      onUsersChanged?.();
      flash('success', 'Password updated for ' + allUsers[uid]?.name);
    } catch(e){ flash('error', 'Reset failed: ' + e.message); }
  };

  const editUrl = async (uid) => {
    const np = prompt('Sheet CSV URL for ' + allUsers[uid]?.name + ' (blank to remove):', allUsers[uid]?.url || '');
    if(np === null) return;
    try {
      await api.updateUser(uid, { url: np.trim() || null });
      setUsers({ ...users, [uid]: { ...users[uid], url: np.trim() || null } });
      setAllUsers({ ...allUsers, [uid]: { ...allUsers[uid], url: np.trim() || null } });
      onUsersChanged?.();
      flash('success', 'Sheet URL updated');
    } catch(e){ flash('error', 'Update failed: ' + e.message); }
  };

  // ── Edit data-access + feature permissions ─────────────────────────────
  const [permsForUid,    setPermsForUid]    = useState(null);
  const [permsStates,    setPermsStates]    = useState(new Set());
  const [permsCities,    setPermsCities]    = useState(new Set());
  const [permsFeatures,  setPermsFeatures]  = useState(new Set());
  const [permsSaving,    setPermsSaving]    = useState(false);
  // Bulk-upload of city/state permissions via Excel/CSV. State tracks the
  // in-flight status so we can show a spinner + toast when the server replies.
  const permsFileRef = useRef(null);
  const [permsUploading, setPermsUploading] = useState(false);
  // Search boxes so admins can find a state / city fast when the list is
  // huge, then tick them without scrolling.
  const [permsStateSearch, setPermsStateSearch] = useState('');
  const [permsCitySearch,  setPermsCitySearch]  = useState('');

  // App-section features the admin can grant. Keys must match the
  // requireFeature() guards on the server.
  // NOTE: Monthly Entry, Manage Months, and Upload Data are now hard-locked
  // to superadmin only and intentionally NOT in this list — there's no way
  // for an admin to delegate them.
  const FEATURE_OPTIONS = [
    { key: 'manageCategories', label: 'Manage Categories',   desc: 'Add/edit/delete categories + sub-categories in Admin Panel' },
  ];

  const openPermissions = (uid) => {
    const cur = allUsers[uid]?.permissions || {};
    setPermsStates(new Set(Array.isArray(cur.states)   ? cur.states   : []));
    setPermsCities(new Set(Array.isArray(cur.cities)   ? cur.cities   : []));
    setPermsFeatures(new Set(Array.isArray(cur.features) ? cur.features : []));
    setPermsForUid(uid);
  };
  const savePermissions = async () => {
    if (!permsForUid) return;
    setPermsSaving(true);
    try {
      const next = {
        states:   [...permsStates],
        cities:   [...permsCities],
        zones:    [],
        salesmen: [],
        features: [...permsFeatures],
      };
      await api.updateUser(permsForUid, { permissions: next });
      setAllUsers({ ...allUsers, [permsForUid]: { ...allUsers[permsForUid], permissions: next } });
      setUsers({ ...users, [permsForUid]: { ...users[permsForUid], permissions: next } });
      onUsersChanged?.();
      flash('success', `Permissions updated for ${allUsers[permsForUid]?.name || permsForUid}.`);
      setPermsForUid(null);
    } catch (e) {
      flash('error', 'Save failed: ' + e.message);
    } finally { setPermsSaving(false); }
  };

  // ── Permissions debug — show what's actually saved + how many dealers match
  const debugPermissions = async (uid) => {
    try {
      const r = await api.userDebugScope(uid);
      const lines = [
        `User: ${r.user?.name} (${r.user?.id}, role: ${r.user?.role})`,
        `Stored permissions: ${JSON.stringify(r.user?.permissions || {})}`,
        ``,
        `Resolved filter: ${JSON.stringify(r.resolvedFilter)}`,
        `Matching dealers: ${r.matchingDealerCount} / ${r.totalDealersInDb}`,
        ``,
        `States currently in DB (${r.dbDistinctStates.length}):`,
        r.dbDistinctStates.map(s => `  • "${s}"`).join('\n'),
      ];
      await confirmDialog({
        title: `Permission scope — ${allUsers[uid]?.name || uid}`,
        message: lines.join('\n'),
        confirmText: 'OK',
        cancelText: null,
      });
      console.log('[DEBUG SCOPE]', r);
    } catch (e) {
      flash('error', 'Debug failed: ' + e.message);
    }
  };

  // ── Toggle active / inactive (soft disable) ────────────────────────────
  // Inactive users can't log in and don't appear in salesman dropdowns or
  // search, but all their historic data (sales, visits, leads, dealers)
  // stays untouched in the DB.
  const toggleActive = async (uid) => {
    const u = allUsers[uid]; if(!u) return;
    const becomingActive = u.active === false;
    if(uid === currentUser?.id && !becomingActive){
      flash('error', "Can't deactivate yourself"); return;
    }
    const ok = await confirmDialog({
      title: (becomingActive ? 'Re-activate ' : 'Deactivate ') + (u.name || uid) + '?',
      message: becomingActive
        ? 'They will be able to log in again and appear in salesman dropdowns and search.'
        : 'They will not be able to log in and will be hidden from dropdowns and search. No data will be deleted — you can re-activate them at any time.',
      confirmText: becomingActive ? 'Re-activate' : 'Deactivate',
      danger: !becomingActive,
    });
    if(!ok) return;
    try {
      await api.updateUser(uid, { active: becomingActive });
      setAllUsers({ ...allUsers, [uid]: { ...u, active: becomingActive } });
      // Parent's `users` map only contains active users — add/remove there too
      if(becomingActive){
        setUsers({ ...users, [uid]: { ...u, active: true } });
      } else {
        const next = { ...users }; delete next[uid]; setUsers(next);
      }
      onUsersChanged?.();
      flash('success', (becomingActive ? 'Re-activated ' : 'Deactivated ') + (u.name || uid));
    } catch(e){ flash('error', (becomingActive ? 'Activate' : 'Deactivate') + ' failed: ' + e.message); }
  };

  // ── Assign / change leave approver ──────────────────────────────────────
  const editApprover = async (uid) => {
    const current = allUsers[uid]?.approver || '';
    // Approver pool = ACTIVE admins/superadmins only (don't suggest disabled ones)
    const list = Object.values(allUsers)
      .filter(u => u.id !== uid && u.active !== false && (u.role === 'admin' || u.role === 'superadmin'))
      .map(u => `${u.id} — ${u.name}`);
    const ap = prompt(
      'Leave / visit approver for ' + (allUsers[uid]?.name || uid) + ' — type the user id (blank = any admin can approve):\n\nAvailable:\n' + list.join('\n'),
      current,
    );
    if(ap === null) return;
    const trimmed = ap.trim();
    if(trimmed && !allUsers[trimmed]){ flash('error', 'No user with id "' + trimmed + '"'); return; }
    try {
      await api.updateUser(uid, { approver: trimmed });
      setUsers({ ...users, [uid]: { ...users[uid], approver: trimmed } });
      setAllUsers({ ...allUsers, [uid]: { ...allUsers[uid], approver: trimmed } });
      onUsersChanged?.();
      flash('success', trimmed ? ('Approver set to ' + (allUsers[trimmed]?.name || trimmed)) : 'Approver cleared');
    } catch(e){ flash('error', 'Update failed: ' + e.message); }
  };

  // ── Remove user ─────────────────────────────────────────────────────────
  const remove = async (uid) => {
    if(uid === currentUser?.id){ flash('error', "Can't delete yourself"); return; }
    const okRm = await confirmDialog({ title:'Remove ' + (allUsers[uid]?.name || 'user') + '?', message:'This cannot be undone. Their historic records will remain in the DB but the login will be gone for good. (Use Deactivate instead if you might re-enable them later.)', confirmText:'Remove', danger:true });
    if(!okRm) return;
    try {
      await api.deleteUser(uid);
      const u = { ...users }; delete u[uid]; setUsers(u);
      const a = { ...allUsers }; delete a[uid]; setAllUsers(a);
      onUsersChanged?.();
      flash('success', 'Removed ' + uid);
    } catch(e){ flash('error', 'Delete failed: ' + e.message); }
  };

  // ── Login as another user (superadmin only) ─────────────────────────────
  const loginAs = async (uid) => {
    if(!isSuperAdmin) return;
    if(uid === currentUser?.id) return;
    const okLA = await confirmDialog({
      title: 'Login as ' + (allUsers[uid]?.name || 'user') + '?',
      message: 'You will see exactly what they see. Use the banner at the top to return to your account at any time.',
      confirmText: 'Login as ' + (allUsers[uid]?.name || 'user'),
    });
    if(!okLA) return;
    try {
      const res = await api.impersonate(uid);
      onLoginAs?.(res.token, res.user, {
        id: currentUser.id,
        name: currentUser.name,
        ini: currentUser.ini,
        color: currentUser.color,
      });
    } catch(e){
      flash('error', 'Login-as failed: ' + e.message);
    }
  };

  // Allowed roles in the create form
  const createRoleOptions = isSuperAdmin
    ? [
        { v:'salesman',   label:'Salesman' },
        { v:'admin',      label:'Admin' },
        { v:'superadmin', label:'Superadmin' },
      ]
    : [
        { v:'salesman', label:'Salesman' },
      ];

  // Group users for clearer display — show ACTIVE first, then INACTIVE at the
  // bottom (so admins always see who's currently disabled).
  const sorted = Object.values(allUsers || {}).sort((a, b) => {
    const aA = a.active !== false ? 0 : 1;
    const bA = b.active !== false ? 0 : 1;
    if(aA !== bA) return aA - bA;
    const order = { superadmin: 0, admin: 1, salesman: 2 };
    const aR = order[a.role] ?? 3, bR = order[b.role] ?? 3;
    if(aR !== bR) return aR - bR;
    return (a.name || '').localeCompare(b.name || '');
  });

  const roleBadge = (r) => {
    if(r === 'superadmin') return { label:'SUPERADMIN', color:'#fbbf24', bg:'rgba(251,191,36,0.12)', icon:ShieldCheck };
    if(r === 'admin')      return { label:'ADMIN',      color:'#a5b4fc', bg:'rgba(99,102,241,0.12)', icon:Shield };
    return                       { label:'SALESMAN',   color:'#86efac', bg:'rgba(34,197,94,0.12)', icon:null };
  };

  // Can the current user manage this row's user?
  const canManage = (target) => {
    if(target.id === currentUser?.id) return true; // can always edit self
    if(isSuperAdmin) return true;
    if(isAdmin && target.role === 'salesman') return true;
    return false;
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:720}}>
        <div className="row" style={{marginBottom:14}}>
          <div style={{fontSize:17, fontWeight:700, display:'flex', alignItems:'center', gap:8}}>
            <UserPlus size={16}/> User Management
          </div>
          <span style={{
            fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4,
            background: roleBadge(currentUser?.role).bg,
            color: roleBadge(currentUser?.role).color,
          }}>
            You: {roleBadge(currentUser?.role).label}
          </span>
          <div className="spacer"/>
          <button onClick={onClose} className="btn"><X size={14}/></button>
        </div>

        {msg && (
          <div style={{
            padding:'8px 12px', borderRadius:6, marginBottom:10, fontSize:12,
            background: msg.type === 'success' ? 'rgba(34,197,94,0.10)' : 'rgba(248,113,113,0.10)',
            border: '1px solid ' + (msg.type === 'success' ? '#15803d' : '#7f1d1d'),
            color:  msg.type === 'success' ? '#86efac' : '#fca5a5',
          }}>{msg.text}</div>
        )}

        {/* ── User list ─────────────────────────────────────────────────── */}
        <div style={{display:'flex', flexDirection:'column', gap:6, maxHeight:340, overflowY:'auto', marginBottom:16}}>
          {sorted.map(u => {
            const isSelf = u.id === currentUser?.id;
            const rb = roleBadge(u.role);
            const RoleIcon = rb.icon;
            return (
              <div key={u.id} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'10px 12px', background:'var(--bg2)', borderRadius:8,
                border: isSelf ? '1px solid var(--acc)' : '1px solid transparent',
                opacity: u.active === false ? 0.55 : 1,
              }}>
                <Avatar user={u} size={32}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
                    <div style={{fontSize:13, fontWeight:600}}>{u.name}</div>
                    <span style={{
                      fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:3,
                      background: rb.bg, color: rb.color,
                      display:'inline-flex', alignItems:'center', gap:3,
                    }}>
                      {RoleIcon && <RoleIcon size={9}/>} {rb.label}
                    </span>
                    {u.active === false && (
                      <span style={{
                        fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:3,
                        background:'rgba(248,113,113,0.12)', color:'#fca5a5',
                        display:'inline-flex', alignItems:'center', gap:3,
                      }}>
                        <PowerOff size={9}/> INACTIVE
                      </span>
                    )}
                    {isSelf && <span style={{fontSize:9, color:'var(--t3)'}}>(you)</span>}
                  </div>
                  <div style={{fontSize:10, color:'var(--t3)', marginTop:2}}>
                    {u.id} · {u.url ? <span style={{color:'#34d399'}}>Sheet ✓</span> : <span style={{color:'var(--t3)'}}>No sheet</span>}
                    {u.role === 'salesman' && (
                      <> · Approver: <span style={{color: u.approver ? '#a5b4fc' : '#fbbf24'}}>
                        {u.approver ? (allUsers[u.approver]?.name || u.approver) : 'any admin'}
                      </span></>
                    )}
                    {Array.isArray(u.permissions?.states) && u.permissions.states.length > 0 && (
                      <> · <MapPin size={9} style={{display:'inline', verticalAlign:'-1px', color:'#fbbf24'}}/>
                        <span style={{color:'#fbbf24'}}> {u.permissions.states.join(', ')}</span>
                      </>
                    )}
                    {Array.isArray(u.permissions?.cities) && u.permissions.cities.length > 0 && (
                      <> · <span style={{color:'#93c5fd'}}>Cities: {u.permissions.cities.join(', ')}</span></>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {isSuperAdmin && !isSelf && (
                  <button onClick={()=>loginAs(u.id)} title={'Log in as ' + u.name}
                    style={{
                      display:'flex', alignItems:'center', gap:4,
                      background:'rgba(251,191,36,0.12)', color:'#fbbf24',
                      border:'1px solid rgba(251,191,36,0.35)',
                      padding:'4px 10px', borderRadius:5, fontSize:11, fontWeight:700, cursor:'pointer',
                    }}>
                    <LogIn size={11}/> Login as
                  </button>
                )}
                {canManage(u) && (
                  <>
                    <button className="btn" style={{fontSize:11, padding:'4px 8px'}} onClick={()=>reset(u.id)} title="Reset password">
                      <KeyRound size={11}/>
                    </button>
                    <button className="btn" style={{fontSize:11, padding:'4px 8px'}} onClick={()=>editUrl(u.id)} title="Edit sheet URL">
                      <LinkIcon size={11}/>
                    </button>
                    {u.role === 'salesman' && (
                      <button className="btn" style={{fontSize:11, padding:'4px 8px'}} onClick={()=>editApprover(u.id)} title="Set leave / visit approver">
                        <Shield size={11}/>
                      </button>
                    )}
                    {(u.role === 'admin' || u.role === 'salesman') && (
                      <>
                        <button className="btn" style={{fontSize:11, padding:'4px 8px'}} onClick={()=>openPermissions(u.id)}
                          title="Data permissions — restrict which states this user can see">
                          <MapPin size={11}/>
                        </button>
                        <button className="btn" style={{fontSize:11, padding:'4px 8px'}} onClick={()=>debugPermissions(u.id)}
                          title="Diagnostic: show what's actually saved on the server + how many dealers match"
                          aria-label="Debug permissions">
                          ?
                        </button>
                      </>
                    )}
                    {!isSelf && (
                      u.active === false ? (
                        <button
                          onClick={()=>toggleActive(u.id)}
                          title="Re-activate user"
                          style={{
                            display:'inline-flex', alignItems:'center', gap:4,
                            background:'rgba(34,197,94,0.12)', color:'#86efac',
                            border:'1px solid rgba(34,197,94,0.35)',
                            padding:'4px 8px', borderRadius:5, fontSize:11, fontWeight:700, cursor:'pointer',
                          }}>
                          <Power size={11}/> Activate
                        </button>
                      ) : (
                        <button
                          onClick={()=>toggleActive(u.id)}
                          title="Deactivate user (soft-disable; data preserved)"
                          style={{
                            display:'inline-flex', alignItems:'center', gap:4,
                            background:'rgba(251,191,36,0.10)', color:'#fbbf24',
                            border:'1px solid rgba(251,191,36,0.35)',
                            padding:'4px 8px', borderRadius:5, fontSize:11, fontWeight:700, cursor:'pointer',
                          }}>
                          <PowerOff size={11}/>
                        </button>
                      )
                    )}
                    {!isSelf && (
                      <button className="btnd" style={{fontSize:11, padding:'4px 8px'}} onClick={()=>remove(u.id)} title="Remove user (permanent)">
                        <Trash2 size={11}/>
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Create new user ───────────────────────────────────────────── */}
        <div style={{paddingTop:14, borderTop:'1px solid var(--b1)'}}>
          <div style={{fontSize:14, fontWeight:600, marginBottom:10, display:'flex', alignItems:'center', gap:6}}>
            <UserPlus size={14}/> Create new user
          </div>
          <div className="g2">
            <div className="field">
              <label>Full Name</label>
              <input className="inp" value={name} onChange={e=>setName(e.target.value)}/>
            </div>
            <div className="field">
              <label>Username</label>
              <input className="inp" value={id} onChange={e=>setId(e.target.value)} placeholder="e.g. rahul"/>
            </div>
            <div className="field">
              <label>Password</label>
              <input className="inp" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
            </div>
            <div className="field">
              <label>Role</label>
              <select className="inp sel" value={role} onChange={e=>setRole(e.target.value)}>
                {createRoleOptions.map(o => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
            </div>
            <div className="field full">
              <label>Sheet CSV URL <span style={{color:'var(--t3)', fontSize:10}}>(optional, mainly for salesmen)</span></label>
              <input className="inp" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://docs.google.com/..."/>
            </div>
            <div className="field full">
              <label>Color</label>
              <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:4}}>
                {colors.map(c => (
                  <div key={c} onClick={()=>setColor(c)} style={{
                    width:22, height:22, borderRadius:'50%', cursor:'pointer',
                    background:c,
                    border: color === c ? '2px solid var(--t1)' : '2px solid transparent',
                    transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  }}/>
                ))}
              </div>
            </div>

            {/* ── Data Permissions ─ which states can this user see? ───── */}
            <div className="field full">
              <label style={{display:'flex', alignItems:'center', gap:6}}>
                <MapPin size={12}/> Data Permissions — States
                <span style={{color:'var(--t3)', fontSize:10, fontWeight:400}}>
                  (leave all unchecked = sees every state)
                </span>
              </label>
              {allStates.length === 0 ? (
                <div style={{fontSize:11, color:'var(--t3)', padding:'8px 0'}}>
                  No states found in dealer data yet. Run "Normalize City / State" in Manage Months first.
                </div>
              ) : (
                <div style={{
                  display:'flex', flexWrap:'wrap', gap:6, marginTop:6,
                  padding:8, background:'var(--bg2)', borderRadius:6, maxHeight:140, overflowY:'auto',
                }}>
                  {allStates.map(s => {
                    const on = createStates.has(s);
                    return (
                      <label key={s} style={{
                        fontSize:11, display:'inline-flex', alignItems:'center', gap:4, cursor:'pointer',
                        padding:'4px 8px', borderRadius:5,
                        background: on ? 'rgba(34,197,94,0.18)' : 'transparent',
                        border:'1px solid ' + (on ? 'rgba(34,197,94,0.5)' : 'var(--b1)'),
                        color: on ? '#86efac' : 'var(--t2)', fontWeight: on?700:500,
                      }}>
                        <input type="checkbox" checked={on} onChange={()=>{
                          const next = new Set(createStates);
                          on ? next.delete(s) : next.add(s);
                          setCreateStates(next);
                        }} style={{margin:0}}/>
                        {s}
                      </label>
                    );
                  })}
                </div>
              )}
              {createStates.size > 0 && (
                <div style={{fontSize:10, color:'#fbbf24', marginTop:6}}>
                  This user will only see dealers / outstanding / sales for: <b>{[...createStates].join(', ')}</b>
                </div>
              )}
            </div>
          </div>
          <button className="btnp" onClick={create} disabled={busy} style={{marginTop:10, display:'flex', alignItems:'center', gap:6}}>
            <UserPlus size={13}/> {busy ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </div>

      {/* ── Permissions modal (Edit existing user's data scope) ────────── */}
      {permsForUid && (
        <div className="overlay" style={{zIndex: 60}} onClick={e => e.target === e.currentTarget && setPermsForUid(null)}>
          <div className="modal" style={{
            maxWidth: 1100,           // was 480 — much wider so admins can scan hundreds of cities
            width: '95vw',
            maxHeight: '92vh',        // taller too, so the checkbox grid gets real screen
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div className="row" style={{marginBottom: 12}}>
              <div style={{fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8}}>
                <MapPin size={14}/> Data Permissions
              </div>
              <div className="spacer"/>
              <button onClick={() => setPermsForUid(null)} className="btn"><X size={14}/></button>
            </div>
            <div style={{fontSize:12, color:'var(--t2)', marginBottom:10}}>
              Restrict <b>{allUsers[permsForUid]?.name}</b> to specific states. Leave everything unchecked to give full access.
            </div>

            {/* ── Bulk-upload city/state permissions via Excel ─────────
                Server scans EVERY cell in EVERY sheet of the uploaded file
                and auto-ticks anything that matches a real state or city
                in the dealer roster. No specific format required. */}
            <div style={{
              display:'flex', gap:8, alignItems:'center', flexWrap:'wrap',
              padding:'10px 12px', background:'var(--bg1)', border:'1px dashed var(--b1)',
              borderRadius:6, marginBottom:14,
            }}>
              <span style={{fontSize:12, color:'var(--t2)', fontWeight:600}}>
                📥 Upload any sheet:
              </span>
              <input
                ref={permsFileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{display:'none'}}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  setPermsUploading(true);
                  try {
                    const r = await api.permissionsFromExcel(f);
                    const stAdd = r.matchedStates || [];
                    const ctAdd = r.matchedCities || [];
                    if (!stAdd.length && !ctAdd.length) {
                      const sample = (r.unmatchedSample || []).slice(0, 3).join(', ');
                      flash('error',
                        `No matching states/cities in the sheet. Scanned ${r.totalCandidates || 0} cells.` +
                        (sample ? ` Sample values found: ${sample}` : '')
                      );
                      return;
                    }
                    // Merge into the current selection (don't overwrite).
                    setPermsStates(prev => new Set([...prev, ...stAdd]));
                    setPermsCities(prev => new Set([...prev, ...ctAdd]));
                    const msgs = [];
                    if (stAdd.length) msgs.push(`${stAdd.length} state${stAdd.length===1?'':'s'}`);
                    if (ctAdd.length) msgs.push(`${ctAdd.length} cit${ctAdd.length===1?'y':'ies'}`);
                    flash('success', `✓ Auto-ticked ${msgs.join(' + ')} (scanned ${r.totalCandidates} cells)`);
                  } catch (err) {
                    flash('error', 'Upload failed: ' + err.message);
                  } finally {
                    setPermsUploading(false);
                  }
                }}
              />
              <button
                className="btnp"
                onClick={() => permsFileRef.current?.click()}
                disabled={permsUploading}
                style={{fontSize:12, padding:'6px 12px'}}>
                {permsUploading ? 'Reading…' : 'Choose file'}
              </button>
              <div style={{flex:1}}/>
              <span style={{fontSize:10, color:'var(--t3)', fontStyle:'italic', maxWidth:320}}>
                Any Excel/CSV — every cell is checked. Names matching a real state or city get auto-ticked.
              </span>
            </div>

            {allStates.length === 0 ? (
              <div style={{fontSize:12, color:'var(--t3)', padding:'12px 0'}}>
                No states found in dealer data yet.
              </div>
            ) : (
              <>
                {(() => {
                  const q = permsStateSearch.trim().toLowerCase();
                  const filtered = q ? allStates.filter(s => s.toLowerCase().includes(q)) : allStates;
                  const allSelected = filtered.length > 0 && filtered.every(s => permsStates.has(s));
                  const toggleAll = () => {
                    const next = new Set(permsStates);
                    if (allSelected) { filtered.forEach(s => next.delete(s)); }
                    else             { filtered.forEach(s => next.add(s)); }
                    setPermsStates(next);
                  };
                  return (
                    <>
                      <div style={{display:'flex', gap:8, marginBottom:6, alignItems:'center'}}>
                        <input
                          className="inp"
                          value={permsStateSearch}
                          onChange={e => setPermsStateSearch(e.target.value)}
                          placeholder={`Search ${allStates.length} states…`}
                          style={{flex:1, fontSize:13}}
                        />
                        <button
                          onClick={toggleAll}
                          disabled={filtered.length === 0}
                          className="btn"
                          style={{
                            fontSize:11, padding:'6px 10px', whiteSpace:'nowrap',
                            background: allSelected ? 'rgba(34,197,94,0.15)' : 'transparent',
                            color: allSelected ? '#86efac' : 'var(--t2)',
                            borderColor: allSelected ? 'rgba(34,197,94,0.4)' : 'var(--b1)',
                          }}
                          title="Select or deselect every state currently visible in the list"
                        >
                          {allSelected ? '✓ ' : ''}Select {q ? `${filtered.length} filtered` : 'all'}
                        </button>
                      </div>
                      <div style={{
                        display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:6, marginBottom:14,
                        padding:12, background:'var(--bg2)', borderRadius:6,
                        maxHeight:220, overflowY:'auto', // fixed panel, scrolls independently
                      }}>
                        {filtered.length === 0 ? (
                          <div style={{fontSize:11, color:'var(--t3)', padding:'8px 4px'}}>No states match "{permsStateSearch}"</div>
                        ) : filtered.map(s => {
                          const on = permsStates.has(s);
                          return (
                            <label key={s} style={{
                              fontSize:12, display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer',
                              padding:'6px 10px', borderRadius:5,
                              background: on ? 'rgba(34,197,94,0.18)' : 'transparent',
                              border:'1px solid ' + (on ? 'rgba(34,197,94,0.5)' : 'var(--b1)'),
                              color: on ? '#86efac' : 'var(--t2)', fontWeight: on?700:500,
                            }}>
                              <input type="checkbox" checked={on} onChange={()=>{
                                const next = new Set(permsStates);
                                on ? next.delete(s) : next.add(s);
                                setPermsStates(next);
                              }} style={{margin:0}}/>
                              {s}
                            </label>
                          );
                        })}
                      </div>
                      {permsStates.size > 0 && (
                        <div style={{fontSize:10, color:'#86efac', marginBottom:12, marginTop:-8}}>
                          ✓ {permsStates.size} state{permsStates.size===1?'':'s'} selected: {[...permsStates].join(', ')}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {/* ── City-level permissions (finer than state) ────────────── */}
            <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6, marginTop:4}}>
              Cities <span style={{textTransform:'none', fontWeight:400}}>(optional — for finer scoping)</span>
            </div>
            {allCities.length === 0 ? (
              <div style={{fontSize:11, color:'var(--t3)', padding:'6px 0 12px'}}>No cities found in dealer data yet.</div>
            ) : (
              <>
                {(() => {
                  const q = permsCitySearch.trim().toLowerCase();
                  const filtered = q ? allCities.filter(c => c.toLowerCase().includes(q)) : allCities;
                  const allSelected = filtered.length > 0 && filtered.every(c => permsCities.has(c));
                  const toggleAll = () => {
                    const next = new Set(permsCities);
                    if (allSelected) { filtered.forEach(c => next.delete(c)); }
                    else             { filtered.forEach(c => next.add(c)); }
                    setPermsCities(next);
                  };
                  return (
                    <>
                      <div style={{display:'flex', gap:8, marginBottom:6, alignItems:'center'}}>
                        <input
                          className="inp"
                          value={permsCitySearch}
                          onChange={e => setPermsCitySearch(e.target.value)}
                          placeholder={`Search ${allCities.length} cities…`}
                          style={{flex:1, fontSize:13}}
                        />
                        <button
                          onClick={toggleAll}
                          disabled={filtered.length === 0}
                          className="btn"
                          style={{
                            fontSize:11, padding:'6px 10px', whiteSpace:'nowrap',
                            background: allSelected ? 'rgba(59,130,246,0.15)' : 'transparent',
                            color: allSelected ? '#93c5fd' : 'var(--t2)',
                            borderColor: allSelected ? 'rgba(59,130,246,0.4)' : 'var(--b1)',
                          }}
                          title="Select or deselect every city currently visible in the list"
                        >
                          {allSelected ? '✓ ' : ''}Select {q ? `${filtered.length} filtered` : 'all'}
                        </button>
                      </div>
                      <div style={{
                        display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:6, marginBottom:14,
                        padding:12, background:'var(--bg2)', borderRadius:6,
                        maxHeight:280, overflowY:'auto',
                      }}>
                        {filtered.length === 0 ? (
                          <div style={{fontSize:11, color:'var(--t3)', padding:'8px 4px'}}>No cities match "{permsCitySearch}"</div>
                        ) : filtered.map(c => {
                          const on = permsCities.has(c);
                          return (
                            <label key={c} style={{
                              fontSize:12, display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer',
                              padding:'6px 10px', borderRadius:5,
                              background: on ? 'rgba(59,130,246,0.18)' : 'transparent',
                              border:'1px solid ' + (on ? 'rgba(59,130,246,0.5)' : 'var(--b1)'),
                              color: on ? '#93c5fd' : 'var(--t2)', fontWeight: on?700:500,
                            }}>
                              <input type="checkbox" checked={on} onChange={()=>{
                                const next = new Set(permsCities);
                                on ? next.delete(c) : next.add(c);
                                setPermsCities(next);
                              }} style={{margin:0}}/>
                              {c}
                            </label>
                          );
                        })}
                      </div>
                      {permsCities.size > 0 && (
                        <div style={{fontSize:10, color:'#93c5fd', marginBottom:12, marginTop:-8}}>
                          ✓ {permsCities.size} cit{permsCities.size===1?'y':'ies'} selected: {[...permsCities].join(', ')}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {/* ── App-section feature toggles ─────────────────────── */}
            <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8, marginTop:4}}>
              App sections — grant access
            </div>
            <div style={{
              display:'flex', flexDirection:'column', gap:6,
              padding:10, background:'var(--bg2)', borderRadius:6, marginBottom:14,
            }}>
              {FEATURE_OPTIONS.map(opt => {
                const on = permsFeatures.has(opt.key);
                return (
                  <label key={opt.key} style={{
                    fontSize:12, display:'flex', alignItems:'flex-start', gap:8, cursor:'pointer',
                    padding:'6px 8px', borderRadius:5,
                    background: on ? 'rgba(99,102,241,0.10)' : 'transparent',
                    border:'1px solid ' + (on ? 'rgba(99,102,241,0.40)' : 'transparent'),
                  }}>
                    <input type="checkbox" checked={on} onChange={()=>{
                      const next = new Set(permsFeatures);
                      on ? next.delete(opt.key) : next.add(opt.key);
                      setPermsFeatures(next);
                    }} style={{margin:'2px 0 0 0'}}/>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600, color: on ? '#a5b4fc' : 'var(--t2)'}}>{opt.label}</div>
                      <div style={{fontSize:10, color:'var(--t3)', marginTop:1}}>{opt.desc}</div>
                    </div>
                  </label>
                );
              })}
              <div style={{fontSize:10, color:'var(--t3)', marginTop:4, fontStyle:'italic'}}>
                Leave all unchecked → admins keep full access (legacy default); salesmen get no write features.
              </div>
            </div>

            <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
              <button className="btn" onClick={() => { setPermsStates(new Set()); setPermsCities(new Set()); setPermsFeatures(new Set()); }}>Clear all</button>
              <button className="btn" onClick={() => setPermsForUid(null)}>Cancel</button>
              <button className="btnp" onClick={savePermissions} disabled={permsSaving}>
                {permsSaving ? 'Saving…' : 'Save permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
