import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, LogIn, KeyRound, Link as LinkIcon, Trash2, Shield, ShieldCheck, Power, PowerOff, MapPin, Mail, Hash, Search, Users, Pencil, ArrowLeftRight, UserCheck, SlidersHorizontal, ScanSearch, Briefcase, User as UserIcon, ChevronLeft, ChevronRight, Check, Clock, FileSpreadsheet, Layers } from 'lucide-react';
import { Avatar } from './UI';
import { api } from '../api';
import { NAV_PAGES } from '../constants';
import { notify, confirmDialog } from './Toast';

// Note: `setUsers` updates the client-side users map; `onLoginAs(token, user, impersonatedBy?)`
// is used by the superadmin "Login as" feature to swap the active JWT.
//
// `users` (prop) is the app-wide map of ACTIVE users (the rest of the app only
// ever sees active users). For this admin screen we also need to see and
// re-activate INACTIVE users, so we fetch a separate `allUsers` map via
// `api.getUsersAll()` on mount and on every change.
// Modal and inline share one body; only the wrapper differs. A tab has no
// overlay to dim and nothing to close, so those are dropped rather than
// rendered invisibly. Defined at module level on purpose: declared inside the
// component it got a new identity on every render, so every tick of a checkbox
// unmounted and remounted the whole panel (the pop-in replayed, focus was lost).
function Shell({ inline, onClose, children }) {
  return inline
    ? <div>{children}</div>
    : (
      <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{maxWidth:720}}>{children}</div>
      </div>
    );
}

// A labelled on/off switch row (module level so ticking one does not remount it).
function UmSwitch({ on, onChange, label, sub, title }) {
  return (
    <label className={'um-swrow' + (on ? ' on' : '')} title={title}>
      <span style={{flex:1, minWidth:0}}>
        <span style={{display:'block', fontSize:12, fontWeight:650, color: on ? 'var(--t1)' : 'var(--t2)'}}>{label}</span>
        {sub && <span style={{display:'block', fontSize:10.5, color:'var(--t3)', marginTop:1, lineHeight:1.35}}>{sub}</span>}
      </span>
      <input type="checkbox" className="um-sw" checked={on} onChange={onChange}/>
    </label>
  );
}

// Scoped styles for the Team members list and the create-user form.
const UM_CSS = `
  .um-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
  .um-search{position:relative;flex:1 1 240px;min-width:0;display:flex;align-items:center}
  .um-search>svg{position:absolute;left:11px;color:var(--t3);pointer-events:none}
  .um-search .inp{width:100%;padding-left:34px;padding-right:30px}
  .um-search>button{position:absolute;right:6px;border:none;background:var(--bg2);color:var(--t3);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;cursor:pointer}
  .um-toolbar .seg{max-width:100%;overflow-x:auto}
  .um-msg{padding:9px 12px;border-radius:10px;margin-bottom:12px;font-size:12.5px;font-weight:600}
  .um-msg.ok{background:color-mix(in srgb,var(--grn) 10%,transparent);border:1px solid color-mix(in srgb,var(--grn) 35%,transparent);color:var(--grn)}
  .um-msg.bad{background:color-mix(in srgb,var(--red) 10%,transparent);border:1px solid color-mix(in srgb,var(--red) 35%,transparent);color:var(--red)}
  .um-row{display:grid;grid-template-columns:minmax(210px,1.1fr) minmax(0,1.4fr) auto;gap:12px;align-items:center;padding:11px 14px;
    background:var(--bg1);border:1px solid var(--b1);border-radius:14px;transition:border-color .15s,box-shadow .15s}
  .um-row:hover{border-color:var(--b2);box-shadow:var(--shadow)}
  .um-row.self{border-color:color-mix(in srgb,var(--acc) 45%,transparent);background:color-mix(in srgb,var(--acc) 4%,var(--bg1))}
  .um-row.off{background:var(--bg2)}
  .um-row.off .um-who,.um-row.off .um-meta{opacity:.6}
  .um-who{display:flex;align-items:center;gap:11px;min-width:0}
  .um-av{position:relative;flex-shrink:0}
  .um-dot{position:absolute;right:-2px;bottom:-2px;width:11px;height:11px;border-radius:50%;background:var(--grn);border:2px solid var(--bg1)}
  .um-dot.off{background:var(--t3)}
  .um-name{display:flex;align-items:center;gap:6px;font-size:13.5px;font-weight:750;color:var(--t1);min-width:0}
  .um-you{font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--acc);background:var(--accL);padding:1px 7px;border-radius:20px;flex-shrink:0}
  .um-sub{display:flex;flex-wrap:wrap;gap:4px 8px;font-size:11px;color:var(--t3);margin-top:2px;min-width:0}
  .um-code{display:inline-flex;align-items:center;gap:1px;font-weight:700;color:var(--t2)}
  .um-meta{display:flex;flex-wrap:wrap;gap:5px;align-items:center;min-width:0}
  .um-role{--tone:var(--acc);display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:800;letter-spacing:.03em;padding:3px 9px;border-radius:20px;
    color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent);border:1px solid color-mix(in srgb,var(--tone) 28%,transparent);white-space:nowrap}
  .um-status{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:20px;white-space:nowrap}
  .um-status.on{color:var(--grn);background:color-mix(in srgb,var(--grn) 11%,transparent)}
  .um-status.off{color:var(--red);background:color-mix(in srgb,var(--red) 11%,transparent)}
  .um-chip{--tone:var(--t3);display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:20px;max-width:220px;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:color-mix(in srgb,var(--tone) 80%,var(--t1));background:var(--bg2);border:1px solid var(--b1)}
  .um-acts{display:flex;flex-wrap:wrap;gap:5px;justify-content:flex-end;align-items:center}
  .um-rolesel{font-size:11.5px !important;padding:4px 8px !important;height:30px;width:auto !important;min-width:0}
  .um-ib{--tone:var(--acc);width:30px;height:30px;border-radius:9px;display:grid;place-items:center;border:1px solid var(--b1);background:var(--bg1);color:var(--t2);cursor:pointer;
    transition:background .15s,color .15s,border-color .15s;flex-shrink:0;padding:0}
  .um-ib:hover{color:var(--tone);border-color:color-mix(in srgb,var(--tone) 40%,transparent);background:color-mix(in srgb,var(--tone) 10%,transparent)}
  .um-ib.set{color:var(--acc)}
  .um-ib.danger{color:var(--red)}
  .um-empty{text-align:center;padding:28px 12px;color:var(--t3);background:var(--bg1);border:1px dashed var(--b2);border-radius:14px}
  @media(max-width:1100px){
    .um-row{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
    .um-acts{grid-column:1 / -1;justify-content:flex-start;padding-top:8px;border-top:1px dashed var(--b1)}
  }
  @media(max-width:640px){
    .um-row{grid-template-columns:minmax(0,1fr);gap:9px;padding:11px 12px}
  }
  /* create form */
  .um-hico{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex-shrink:0;color:var(--acc);background:var(--accL)}
  .um-steps{display:flex;gap:6px;padding:10px 18px;border-bottom:1px solid var(--b1);overflow-x:auto;flex-shrink:0;scrollbar-width:none}
  .um-step{display:flex;align-items:center;gap:8px;border:1px solid var(--b1);background:var(--bg1);color:var(--t3);border-radius:20px;padding:4px 12px 4px 4px;
    font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit}
  .um-step-n{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--bg2);color:var(--t3);font-size:11px;font-weight:800}
  .um-step.on{border-color:var(--acc);color:var(--t1);background:color-mix(in srgb,var(--acc) 8%,var(--bg1))}
  .um-step.on .um-step-n{background:var(--acc);color:#fff}
  .um-step.done .um-step-n{background:color-mix(in srgb,var(--grn) 18%,transparent);color:var(--grn)}
  .um-step.done{color:var(--t2)}
  .um-preview{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:var(--bg2);border:1px solid var(--b1);margin-bottom:16px}
  .um-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}
  .um-f{min-width:0}
  .um-f.full{grid-column:1 / -1}
  .um-f label{display:block;font-size:11.5px;font-weight:700;color:var(--t2);margin-bottom:5px}
  .um-f label b{color:var(--red)}
  .um-f label span{font-weight:500;color:var(--t3);font-size:10.5px;margin-left:4px}
  .um-f .inp{width:100%}
  .um-err{font-size:11px;font-weight:600;color:var(--red);margin-top:4px}
  .um-hint{font-size:11px;color:var(--t3);margin-top:4px}
  .um-hint b{color:var(--t2)}
  .um-swatch{width:28px;height:28px;border-radius:50%;border:2px solid transparent;cursor:pointer;display:grid;place-items:center;color:#fff;padding:0;
    box-shadow:0 0 0 1px var(--b1) inset}
  .um-swatch.on{border-color:var(--bg1);box-shadow:0 0 0 2px var(--t1)}
  .um-slabel{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin-bottom:8px}
  .um-roles{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(200px,100%),1fr));gap:8px}
  .um-roletile{--tone:var(--acc);display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1.5px solid var(--b1);background:var(--bg1);cursor:pointer;font-family:inherit;transition:all .15s}
  .um-roletile:hover{border-color:color-mix(in srgb,var(--tone) 45%,transparent)}
  .um-roletile.on{border-color:var(--tone);background:color-mix(in srgb,var(--tone) 8%,var(--bg1))}
  .um-roletile-ico{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
  .um-chipbox{display:flex;flex-wrap:wrap;gap:6px;padding:10px;background:var(--bg2);border-radius:12px;max-height:180px;overflow-y:auto}
  .um-note{font-size:12px;color:var(--t3);padding:10px 12px;background:var(--bg2);border-radius:10px;border:1px solid var(--b1)}
  .um-swgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(220px,100%),1fr));gap:6px}
  .um-swrow{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;border:1px solid var(--b1);background:var(--bg1);cursor:pointer;transition:all .15s}
  .um-swrow.on{border-color:color-mix(in srgb,var(--acc) 40%,transparent);background:color-mix(in srgb,var(--acc) 6%,var(--bg1))}
  .um-sw{appearance:none;-webkit-appearance:none;margin:0;width:34px;height:20px;border-radius:20px;background:var(--bg3);border:1px solid var(--b2);position:relative;cursor:pointer;flex-shrink:0;transition:background .15s,border-color .15s}
  .um-sw::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--bg1);box-shadow:0 1px 3px rgba(16,24,40,.3);transition:transform .15s}
  .um-sw:checked{background:var(--acc);border-color:var(--acc)}
  .um-sw:checked::after{transform:translateX(14px)}
  .um-foot{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;padding:12px 18px;border-top:1px solid var(--b1);flex-shrink:0;background:var(--bg1)}
  @media(max-width:560px){ .um-grid{grid-template-columns:1fr} }
`;

const UserManagement = ({ users, setUsers, currentUser, onClose, onLoginAs, onUsersChanged, inline = false, canLoginAs: canLoginAsProp }) => {
  // Full user map including inactive — used for display in this modal only.
  const [allUsers, setAllUsers] = useState(users || {});
  // The create form lives in a modal now — see the Add user button above it.
  const [addOpen, setAddOpen] = useState(false);
  // List filters + create-form step (UI only)
  const [umQ,      setUmQ]      = useState('');
  const [umRole,   setUmRole]   = useState('all');
  const [umStatus, setUmStatus] = useState('all');
  const [step,     setStep]     = useState(0);
  const [tried,    setTried]    = useState(false);
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
  const [email,   setEmail]   = useState('');
  const [color,   setColor]   = useState('#6366f1');
  const [busy,    setBusy]    = useState(false);
  const [msg,     setMsg]     = useState(null);
  // State-based permissions for the new user. Empty array = no restriction
  // (user sees every state). Pre-populate the list of states from the dealer
  // roster on first open so the admin can tick the relevant ones.
  const [allStates,    setAllStates]    = useState([]);
  const [allCities,    setAllCities]    = useState([]);
  const [allZones,     setAllZones]     = useState([]);
  const [createStates, setCreateStates] = useState(new Set());
  const [createCities, setCreateCities] = useState(new Set());
  const [createPages, setCreatePages] = useState(new Set());       // sections the new user may open
  const [createFeatures, setCreateFeatures] = useState(new Set()); // actions the new user may perform
  const [scopeErr, setScopeErr] = useState('');   // why the state/city/zone lists are empty, if a call failed
  const loadScopes = () => {
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
    setScopeErr('');
    // a failed call used to be swallowed, so the modal said "no states found" when the server had 11
    api.dealerDistinctStates().then(r => setAllStates(dedupCI(r?.states))).catch(e => setScopeErr(e.message || 'could not load states'));
    api.dealerDistinctCities().then(r => setAllCities(dedupCI(r?.cities))).catch(e => setScopeErr(e.message || 'could not load cities'));
    api.dealerDistinctZones().then(r => setAllZones(dedupCI(r?.zones))).catch(e => setScopeErr(e.message || 'could not load zones'));
  };
  useEffect(() => { loadScopes(); }, []);

  const colors = ['#6366f1','#10b981','#ec4899','#f97316','#f59e0b','#06b6d4','#e879f9','#8b5cf6','#ef4444','#22c55e'];

  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isAdmin      = currentUser?.role === 'admin';
  // "Login as" a user: superadmin always; others only when granted the action, and never into a superadmin
  const granted = canLoginAsProp !== undefined ? !!canLoginAsProp : (Array.isArray(currentUser?.permissions?.features) && currentUser.permissions.features.includes('loginAs'));
  const canLoginAsUser = (u) => u && u.id !== currentUser?.id && u.active !== false && (isSuperAdmin || (granted && u.role !== 'superadmin'));

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
      const permissions = { states: [...createStates], cities: [...createCities], zones: [], salesmen: [], pages: [...createPages], features: [...createFeatures] };
      const newUser = await api.createUser({ id: idC, name, pass, role, color, ini, permissions, email: email.trim(), url: url.trim() || null });
      // Optimistically update local cache for instant feedback…
      const cached = { id: idC, name, pass, role, color, ini, email: email.trim(), url: url.trim() || null, active:true, permissions };
      setUsers({ ...users, [idC]: cached });
      setAllUsers({ ...allUsers, [idC]: cached });
      // …then trigger a server-side refresh so the new user appears with all
      // server-side fields and persists across page reloads + other devices.
      onUsersChanged?.();
      refreshAll();
      setName(''); setId(''); setPass(''); setUrl(''); setEmail(''); setRole('salesman'); setCreateStates(new Set()); setCreateCities(new Set()); setCreatePages(new Set()); setCreateFeatures(new Set());
      // Close on success so the new row is visible underneath. A failure
      // leaves the modal open with the typed values still there.
      setAddOpen(false);
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

  const editEmpCode = async (uid) => {
    const np = prompt('Employee code for ' + allUsers[uid]?.name + ' (e.g. SSL 12, blank to remove):', allUsers[uid]?.empCode || '');
    if(np === null) return;
    const c = np.trim().toUpperCase().replace(/\s+/g, ' ');
    try {
      await api.updateUser(uid, { empCode: c });
      setUsers({ ...users, [uid]: { ...users[uid], empCode: c } });
      setAllUsers({ ...allUsers, [uid]: { ...allUsers[uid], empCode: c } });
      onUsersChanged?.();
      flash('success', c ? 'Employee code updated' : 'Employee code removed');
    } catch(err){ flash('error', 'Update failed: ' + err.message); }
  };

  const editEmail = async (uid) => {
    const np = prompt('Email for ' + allUsers[uid]?.name + ' (blank to remove):', allUsers[uid]?.email || '');
    if(np === null) return;
    const e = np.trim().toLowerCase();
    // Mirror the server's check so an obvious typo is caught before the round
    // trip; the server still validates and owns uniqueness.
    if(e && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){
      flash('error', 'That email address is not valid');
      return;
    }
    try {
      await api.updateUser(uid, { email: e });
      setUsers({ ...users, [uid]: { ...users[uid], email: e } });
      setAllUsers({ ...allUsers, [uid]: { ...allUsers[uid], email: e } });
      onUsersChanged?.();
      flash('success', e ? 'Email updated' : 'Email removed');
    } catch(err){ flash('error', 'Update failed: ' + err.message); }
  };

  // ── Edit data-access + feature permissions ─────────────────────────────
  const [permsForUid,    setPermsForUid]    = useState(null);
  const [permsStates,    setPermsStates]    = useState(new Set());
  const [permsCities,    setPermsCities]    = useState(new Set());
  const [permsZones,     setPermsZones]     = useState(new Set());
  const [permsSalesmen,  setPermsSalesmen]  = useState(new Set());
  const [permsFeatures,  setPermsFeatures]  = useState(new Set());
  const [permsPages,     setPermsPages]     = useState(new Set());   // left-nav page access
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
  // Fetched from the server, which serves the same list its middleware
  // enforces — a hardcoded copy here would silently fall behind every time a
  // new guarded action is added.
  const [actionGroups, setActionGroups] = useState([]);
  const [allActionKeys, setAllActionKeys] = useState([]);
  useEffect(() => {
    api.actionPermissions()
      .then(r => {
        setActionGroups(r?.groups || []);
        setAllActionKeys((r?.actions || []).map(a => a.key));
      })
      .catch(() => { setActionGroups([]); setAllActionKeys([]); });
  }, []);

  const openPermissions = (uid) => {
    const cur = allUsers[uid]?.permissions || {};
    // Canonicalise saved permission strings against the deduped roster lists.
    // Without this, a saved "Bangalore" won't tick a checkbox that shows
    // "BANGALORE" (the case that dedup kept), because Set.has() is case-
    // sensitive. Case mismatches make the modal look empty even though the
    // permission is safely stored on the server.
    const toCanon = (savedList, canonList) => {
      const map = new Map(canonList.map(v => [String(v || '').trim().toLowerCase(), v]));
      const out = new Set();
      for (const v of (Array.isArray(savedList) ? savedList : [])) {
        const key = String(v || '').trim().toLowerCase();
        if (!key) continue;
        out.add(map.get(key) || v);   // fall back to raw value if roster missing
      }
      return out;
    };
    setPermsStates(toCanon(cur.states, allStates));
    setPermsCities(toCanon(cur.cities, allCities));
    setPermsZones(toCanon(cur.zones, allZones));
    setPermsSalesmen(new Set(Array.isArray(cur.salesmen) ? cur.salesmen : []));
    setPermsFeatures(new Set(Array.isArray(cur.features) ? cur.features : []));
    setPermsPages(new Set(Array.isArray(cur.pages) ? cur.pages : []));
    setPermsForUid(uid);
  };
  const savePermissions = async () => {
    if (!permsForUid) return;
    setPermsSaving(true);
    try {
      const next = {
        states:   [...permsStates],
        cities:   [...permsCities],
        zones:    [...permsZones],
        salesmen: [...permsSalesmen],
        features: [...permsFeatures],
        pages:    [...permsPages],
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

  // ── Login as another user (superadmin, or anyone granted loginAs) ──────
  const loginAs = async (uid) => {
    // Same rule that shows the button; the server re-checks the grant.
    if(!canLoginAsUser(allUsers[uid])) return;
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

  // Superadmin: change an existing user's role (e.g. Admin → Employee).
  const changeRole = async (uid, newRole) => {
    const u = allUsers[uid];
    if(!u || u.role === newRole) return;
    try {
      await api.updateUser(uid, { role: newRole });
      const upd = { ...u, role: newRole };
      setAllUsers({ ...allUsers, [uid]: upd });
      if(users[uid]) setUsers({ ...users, [uid]: upd });
      flash('success', (u.name || uid) + ' is now ' + newRole);
    } catch(e){ flash('error', e.message || 'Could not change role'); }
  };

  // Rename a user.
  const renameUser = async (uid) => {
    const u = allUsers[uid]; if(!u) return;
    const nn = window.prompt('New name for ' + (u.name || uid) + ':', u.name || '');
    if(nn === null) return;
    const name = nn.trim(); if(!name || name === u.name) return;
    try {
      await api.updateUser(uid, { name });
      const upd = { ...u, name };
      setAllUsers({ ...allUsers, [uid]: upd });
      if(users[uid]) setUsers({ ...users, [uid]: upd });
      flash('success', 'Renamed to ' + name);
    } catch(e){ flash('error', e.message || 'Rename failed'); }
  };

  // Reassign a (resigned) salesman's dealers & records to another user.
  const reassignSalesman = async (uid) => {
    const u = allUsers[uid]; if(!u) return;
    const list = Object.values(allUsers)
      .filter(x => x.id !== uid && x.active !== false)
      .map(x => x.id + ' — ' + x.name).join('\n');
    const raw = window.prompt(
      'Reassign ALL dealers & records from "' + (u.name || uid) + '" to which user?\n' +
      'Type the target user id:\n\n' + list
    );
    if(raw === null) return;
    const toId = String(raw).trim();
    if(!toId) return;
    if(!allUsers[toId]){ flash('error', 'No user with id "' + toId + '"'); return; }
    if(toId === uid){ flash('error', 'Pick a different user'); return; }
    if(!window.confirm(
      'Move ALL dealers, sales, follow-ups, visits, attendance, tasks & leads\nfrom "' +
      (u.name||uid) + '" → "' + (allUsers[toId].name||toId) + '"?\n\nThis cannot be auto-undone.'
    )) return;
    try {
      const r = await api.reassignSalesman(uid, toId);
      const m = r?.moved || {};
      flash('success',
        'Moved to ' + (allUsers[toId].name||toId) + ': ' +
        (m.dealers||0) + ' dealers, ' + (m.sales||0) + ' sales, ' + (m.followups||0) + ' follow-ups, ' +
        (m.visits||0) + ' visits, ' + (m.tasks||0) + ' tasks, ' + (m.leads||0) + ' leads. Reload / Sync to see updated data.');
    } catch(e){ flash('error', e.message || 'Reassign failed'); }
  };

  // Allowed roles in the create form
  const createRoleOptions = isSuperAdmin
    ? [
        { v:'salesman',   label:'Salesman' },
        { v:'employee',   label:'Employee' },
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
    const order = { superadmin: 0, admin: 1, employee: 2, salesman: 3 };
    const aR = order[a.role] ?? 4, bR = order[b.role] ?? 4;
    if(aR !== bR) return aR - bR;
    return (a.name || '').localeCompare(b.name || '');
  });

  // Role look — one distinct tone per role, used by the badge, the filter
  // chips and the role picker in the create form. Display only.
  const ROLE_META = {
    superadmin: { label:'Superadmin', tone:'var(--yel)', icon:ShieldCheck, desc:'Never restricted' },
    admin:      { label:'Admin',      tone:'var(--pur)', icon:Shield,      desc:'Built-in: everything' },
    employee:   { label:'Employee',   tone:'#06b6d4',    icon:Briefcase,   desc:'Built-in: staff screens, actions only when granted' },
    salesman:   { label:'Salesman',   tone:'var(--grn)', icon:UserIcon,    desc:'Built-in: sales screens, no admin actions' },
  };
  const roleMeta = (r) => ROLE_META[r] || { label: r || 'User', tone:'var(--t3)', icon:UserIcon, desc:'' };
  const roleBadge = (r) => {
    const m = roleMeta(r);
    return { label: m.label.toUpperCase(), color: m.tone, bg: 'color-mix(in srgb, ' + m.tone + ' 14%, transparent)', icon: m.icon };
  };

  // Can the current user manage this row's user?
  const canManage = (target) => {
    if(target.id === currentUser?.id) return true; // can always edit self
    if(isSuperAdmin) return true;
    if(isAdmin && target.role === 'salesman') return true;
    return false;
  };

  // ── Client-side filters for the list (search / role / status) ──────────
  const needle = umQ.trim().toLowerCase();
  const roleCounts = sorted.reduce((a, u) => { a[u.role] = (a[u.role] || 0) + 1; return a; }, {});
  const activeCount = sorted.filter(u => u.active !== false).length;
  const inactiveCount = sorted.length - activeCount;
  const visible = sorted.filter(u => {
    if (umRole !== 'all' && u.role !== umRole) return false;
    if (umStatus === 'active' && u.active === false) return false;
    if (umStatus === 'inactive' && u.active !== false) return false;
    if (!needle) return true;
    return [u.name, u.id, u.email, u.empCode].some(v => String(v || '').toLowerCase().includes(needle));
  });
  const ROLE_ORDER = ['superadmin', 'admin', 'employee', 'salesman'];
  const roleChips = [...ROLE_ORDER.filter(r => roleCounts[r]), ...Object.keys(roleCounts).filter(r => !ROLE_ORDER.includes(r))];

  // Compact list of values as chips: first few, then "+n"
  const chipList = (arr, tone, Icon, label) => {
    if (!Array.isArray(arr) || !arr.length) return null;
    const head = arr.slice(0, 2);
    return (
      <span className="um-chip" style={{'--tone':tone}} title={label + ': ' + arr.join(', ')}>
        {Icon && <Icon size={10}/>} {head.join(', ')}{arr.length > head.length ? ' +' + (arr.length - head.length) : ''}
      </span>
    );
  };
  const fmtWhen = (v) => {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });
  };

  // ── Create form: steps + inline messages mirroring create()'s checks ───
  const STEPS = [
    { label:'Profile',          icon:UserIcon },
    { label:'Role & territory', icon:MapPin },
    { label:'Access',           icon:KeyRound },
  ];
  const idPreview = id.trim().toLowerCase().replace(/\s+/g, '_');
  const fErr = {
    name:  !name ? 'Full name is required' : '',
    id:    !idPreview ? 'Username is required' : allUsers[idPreview] ? 'Username already exists' : '',
    pass:  !pass ? 'Password is required' : pass.length < 4 ? 'Password min 4 characters' : '',
    email: email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'That email address does not look valid' : '',
  };
  const showErr = (k, v) => fErr[k] && (tried || v) ? <div className="um-err">{fErr[k]}</div> : null;
  const profileOk = !fErr.name && !fErr.id && !fErr.pass;
  const goStep = (n) => {
    if (n > 0 && !profileOk) { setTried(true); setStep(0); return; }
    setStep(n);
  };
  const openAdd = () => { setStep(0); setTried(false); setAddOpen(true); };
  const newIni = (name || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';

  return (
    <Shell inline={inline} onClose={onClose}>
      <>
        <style>{UM_CSS}</style>
        <div className="row" style={{marginBottom:14, gap:10}}>
          <div className="sec-title" style={{marginBottom:0}}>
            <span className="sec-ico" style={{'--tone':'var(--acc)'}}><Users size={15}/></span> Team members <span className="count-pill">{sorted.length}</span>
          </div>
          <span className="um-role" style={{'--tone':roleBadge(currentUser?.role).color}}>
            You: {roleMeta(currentUser?.role).label}
          </span>
          <div className="spacer"/>
          <button className="btnp" onClick={openAdd}
            style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12.5}}>
            <UserPlus size={14}/> Add user
          </button>
          {!inline && <button onClick={onClose} className="btn" title="Close"><X size={14}/></button>}
        </div>

        {msg && (
          <div className={'um-msg ' + (msg.type === 'success' ? 'ok' : 'bad')}>{msg.text}</div>
        )}

        {/* ── Toolbar: search, role chips, status ───────────────────────── */}
        <div className="um-toolbar">
          <div className="um-search">
            <Search size={14}/>
            <input className="inp" value={umQ} onChange={e=>setUmQ(e.target.value)} placeholder="Search name, username, email, code…"/>
            {umQ && <button type="button" onClick={()=>setUmQ('')} title="Clear search"><X size={12}/></button>}
          </div>
          <div className="seg">
            {[['all','All',sorted.length],['active','Active',activeCount],['inactive','Inactive',inactiveCount]].map(([k,l,n]) => (
              <button key={k} className={'seg-b' + (umStatus===k ? ' on' : '')} style={{'--tone': k==='inactive' ? 'var(--red)' : k==='active' ? 'var(--grn)' : 'var(--acc)'}}
                onClick={()=>setUmStatus(k)}>{l} <span style={{opacity:.7, fontWeight:600}}>{n}</span></button>
            ))}
          </div>
        </div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:12}}>
          <button className={'thr' + (umRole==='all' ? ' on' : '')} style={{'--tone':'var(--acc)'}} onClick={()=>setUmRole('all')}>
            All roles · {sorted.length}
          </button>
          {roleChips.map(r => {
            const m = roleMeta(r);
            return (
              <button key={r} className={'thr' + (umRole===r ? ' on' : '')} style={{'--tone':m.tone, display:'inline-flex', alignItems:'center', gap:5}}
                onClick={()=>setUmRole(umRole===r ? 'all' : r)}>
                <m.icon size={11}/> {m.label} · {roleCounts[r]}
              </button>
            );
          })}
        </div>

        {/* ── User list ─────────────────────────────────────────────────── */}
        {/* The 340px cap belongs to the modal, where the card is height-
            limited and an inner scroller is the only option. In a tab there
            is a whole page below, so the list runs its full length and the
            page scrolls instead — no scrollbar inside a scrollbar. */}
        <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:16,
          ...(inline ? {} : { maxHeight:340, overflowY:'auto' })}}>
          {visible.length === 0 && (
            <div className="um-empty">
              <Users size={22}/>
              <div style={{fontWeight:700, color:'var(--t1)', marginTop:6}}>No team members match</div>
              <div style={{fontSize:12}}>Try a different search or clear the filters.</div>
              {(umQ || umRole !== 'all' || umStatus !== 'all') && (
                <button className="btn" style={{marginTop:10, fontSize:12}} onClick={()=>{ setUmQ(''); setUmRole('all'); setUmStatus('all'); }}>Clear filters</button>
              )}
            </div>
          )}
          {visible.map(u => {
            const isSelf = u.id === currentUser?.id;
            const off = u.active === false;
            const rm = roleMeta(u.role);
            const RoleIcon = rm.icon;
            const lastLogin = u.lastLogin || u.lastLoginAt;
            return (
              <div key={u.id} className={'um-row' + (isSelf ? ' self' : '') + (off ? ' off' : '')}>
                <div className="um-who">
                  <span className="um-av">
                    <span className="ini" style={{'--h':(u.name||'?').charCodeAt(0)*37%360, width:38, height:38, borderRadius:12, fontSize:12.5}}>{(u.name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span>
                    <i className={'um-dot' + (off ? ' off' : '')} title={off ? 'Inactive' : 'Active'}/>
                  </span>
                  <div style={{minWidth:0}}>
                    <div className="um-name">
                      <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{u.name}</span>
                      {isSelf && <span className="um-you">You</span>}
                    </div>
                    <div className="um-sub">
                      <span>@{u.id}</span>
                      {u.empCode && <span className="um-code"><Hash size={9}/>{u.empCode}</span>}
                      {u.email && <span style={{color:'var(--acc)', overflow:'hidden', textOverflow:'ellipsis'}}>{u.email}</span>}
                    </div>
                  </div>
                </div>

                <div className="um-meta">
                  <span className="um-role" style={{'--tone':rm.tone}}><RoleIcon size={11}/> {rm.label}</span>
                  <span className={'um-status ' + (off ? 'off' : 'on')}>{off ? <PowerOff size={10}/> : <Power size={10}/>} {off ? 'Inactive' : 'Active'}</span>
                  {chipList(u.permissions?.states, 'var(--yel)', MapPin, 'States')}
                  {chipList(u.permissions?.cities, 'var(--acc)', null, 'Cities')}
                  {chipList(u.permissions?.zones, 'var(--pur)', null, 'Zones')}
                  {u.role === 'salesman' && (
                    <span className="um-chip" style={{'--tone': u.approver ? 'var(--acc)' : 'var(--t3)'}} title="Leave / visit approver">
                      <UserCheck size={10}/> {u.approver ? (allUsers[u.approver]?.name || u.approver) : 'Any admin'}
                    </span>
                  )}
                  <span className="um-chip" style={{'--tone': u.url ? 'var(--grn)' : 'var(--t3)'}} title={u.url ? 'Sheet linked' : 'No sheet linked'}>
                    <FileSpreadsheet size={10}/> {u.url ? 'Sheet' : 'No sheet'}
                  </span>
                  {lastLogin && <span className="um-chip" style={{'--tone':'var(--t3)'}} title="Last login"><Clock size={10}/> {fmtWhen(lastLogin)}</span>}
                </div>

                {/* Actions — every one visible as an icon button, no kebab menu */}
                <div className="um-acts">
                  {isSuperAdmin && !isSelf && (
                    <select className="sel um-rolesel" value={u.role} onChange={e=>changeRole(u.id, e.target.value)} title="Change role">
                      <option value="salesman">Salesman</option>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  )}
                  {canLoginAsUser(u) && (
                    <button className="um-ib" style={{'--tone':'var(--yel)'}} onClick={()=>loginAs(u.id)} title={'Log in as ' + u.name}><LogIn size={14}/></button>
                  )}
                  {canManage(u) && (
                    <>
                      <button className="um-ib" onClick={()=>renameUser(u.id)} title="Rename user"><Pencil size={14}/></button>
                      {(u.role === 'salesman' || u.role === 'employee') && (
                        <button className="um-ib" style={{'--tone':'var(--yel)'}} onClick={()=>reassignSalesman(u.id)}
                          title="Reassign this user's dealers & records to another user (e.g. on resignation)"><ArrowLeftRight size={14}/></button>
                      )}
                      <button className="um-ib" onClick={()=>reset(u.id)} title="Reset password"><KeyRound size={14}/></button>
                      <button className={'um-ib' + (u.empCode ? ' set' : '')} onClick={()=>editEmpCode(u.id)}
                        title={u.empCode ? `Employee code: ${u.empCode}` : 'Set the employee code (SSL …)'}><Hash size={14}/></button>
                      <button className={'um-ib' + (u.email ? ' set' : '')} onClick={()=>editEmail(u.id)}
                        title={u.email ? `Email: ${u.email}` : 'Add an email address'}><Mail size={14}/></button>
                      <button className={'um-ib' + (u.url ? ' set' : '')} onClick={()=>editUrl(u.id)} title="Edit sheet URL"><LinkIcon size={14}/></button>
                      {u.role === 'salesman' && (
                        <button className={'um-ib' + (u.approver ? ' set' : '')} onClick={()=>editApprover(u.id)} title="Set leave / visit approver"><UserCheck size={14}/></button>
                      )}
                      {/* Only SUPERADMIN can view/grant data permissions */}
                      {isSuperAdmin && (u.role === 'admin' || u.role === 'salesman' || u.role === 'employee') && (
                        <>
                          <button className="um-ib" style={{'--tone':'var(--grn)'}} onClick={()=>openPermissions(u.id)}
                            title="Data permissions & sections this user can use"><SlidersHorizontal size={14}/></button>
                          <button className="um-ib" onClick={()=>debugPermissions(u.id)}
                            title="Diagnostic: show what's actually saved on the server + how many dealers match"
                            aria-label="Debug permissions"><ScanSearch size={14}/></button>
                        </>
                      )}
                      {!isSelf && (
                        off ? (
                          <button className="um-ib" style={{'--tone':'var(--grn)'}} onClick={()=>toggleActive(u.id)} title="Re-activate user"><Power size={14}/></button>
                        ) : (
                          <button className="um-ib" style={{'--tone':'var(--yel)'}} onClick={()=>toggleActive(u.id)} title="Deactivate user (soft-disable; data preserved)"><PowerOff size={14}/></button>
                        )
                      )}
                      {!isSelf && (
                        <button className="um-ib danger" style={{'--tone':'var(--red)'}} onClick={()=>remove(u.id)} title="Remove user (permanent)"><Trash2 size={14}/></button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Create new user — behind a button rather than always on screen.
            Same fields and the same create(), laid out as three steps. */}
        {addOpen && (
          <div className="overlay"
            onClick={e=>e.target===e.currentTarget&&setAddOpen(false)}>
          <div className="modal um-modal" style={{maxWidth:680, padding:0, display:'flex', flexDirection:'column', maxHeight:'92vh', overflow:'hidden'}}>
            <div className="row" style={{padding:'16px 18px 12px', borderBottom:'1px solid var(--b1)', flexShrink:0, flexWrap:'nowrap'}}>
              <span className="um-hico"><UserPlus size={18}/></span>
              <div style={{minWidth:0}}>
                <div style={{fontSize:16, fontWeight:800, color:'var(--t1)'}}>Create new user</div>
                <div style={{fontSize:11.5, color:'var(--t3)'}}>Profile, then role & territory, then what they can open and do.</div>
              </div>
              <div className="spacer"/>
              <button className="btn" onClick={()=>setAddOpen(false)} title="Close"><X size={14}/></button>
            </div>

            {/* stepper */}
            <div className="um-steps">
              {STEPS.map((s, i) => (
                <button key={s.label} type="button" className={'um-step' + (step === i ? ' on' : '') + (step > i ? ' done' : '')} onClick={()=>goStep(i)}>
                  <span className="um-step-n">{step > i ? <Check size={12} strokeWidth={3}/> : i + 1}</span>
                  <span className="um-step-l">{s.label}</span>
                </button>
              ))}
            </div>

            <div style={{flex:1, minHeight:0, overflowY:'auto', padding:'16px 18px'}}>
              {step === 0 && (
                <>
                  {/* live preview */}
                  <div className="um-preview">
                    <span className="ini" style={{'--h':(name||'?').charCodeAt(0)*37%360, width:44, height:44, borderRadius:14, fontSize:14}}>{newIni}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight:800, color:'var(--t1)', fontSize:14}}>{name || 'New team member'}</div>
                      <div style={{fontSize:11.5, color:'var(--t3)'}}>{idPreview ? '@' + idPreview : 'username'} · {roleMeta(role).label}</div>
                    </div>
                    <span style={{marginLeft:'auto', width:14, height:14, borderRadius:'50%', background:color, flexShrink:0}} title="Colour"/>
                  </div>
                  <div className="um-grid">
                    <div className="um-f">
                      <label>Full name <b>*</b></label>
                      <input className="inp" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Rahul Kumar"/>
                      {showErr('name', name)}
                    </div>
                    <div className="um-f">
                      <label>Username <b>*</b></label>
                      <input className="inp" value={id} onChange={e=>setId(e.target.value)} placeholder="e.g. rahul" autoComplete="off"/>
                      {showErr('id', id) || (idPreview && idPreview !== id && <div className="um-hint">Signs in as <b>{idPreview}</b></div>)}
                    </div>
                    <div className="um-f">
                      <label>Password <b>*</b></label>
                      <input className="inp" type="password" value={pass} onChange={e=>setPass(e.target.value)} autoComplete="new-password"/>
                      {showErr('pass', pass) || <div className="um-hint">At least 4 characters</div>}
                    </div>
                    <div className="um-f">
                      <label>Email <span>optional</span></label>
                      <input className="inp" type="email" autoComplete="off" value={email}
                        onChange={e=>setEmail(e.target.value)} placeholder="name@sequencesurface.com"/>
                      {showErr('email', email) || <div className="um-hint">Sign-in is still by username</div>}
                    </div>
                    <div className="um-f full">
                      <label>Colour</label>
                      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:2}}>
                        {colors.map(c => (
                          <button type="button" key={c} onClick={()=>setColor(c)} title={c} className={'um-swatch' + (color === c ? ' on' : '')} style={{background:c}}>
                            {color === c && <Check size={12} strokeWidth={3}/>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="um-slabel">Role</div>
                  <div className="um-roles">
                    {createRoleOptions.map(o => {
                      const m = roleMeta(o.v);
                      const on = role === o.v;
                      return (
                        <button type="button" key={o.v} className={'um-roletile' + (on ? ' on' : '')} style={{'--tone':m.tone}} onClick={()=>setRole(o.v)}>
                          <span className="um-roletile-ico"><m.icon size={16}/></span>
                          <span style={{minWidth:0, textAlign:'left'}}>
                            <span style={{display:'block', fontWeight:750, fontSize:13, color:'var(--t1)'}}>{o.label}</span>
                            <span style={{display:'block', fontSize:10.5, color:'var(--t3)'}}>{m.desc}</span>
                          </span>
                          {on && <Check size={14} strokeWidth={3} style={{marginLeft:'auto', color:m.tone, flexShrink:0}}/>}
                        </button>
                      );
                    })}
                  </div>

                  <div className="um-f" style={{marginTop:14}}>
                    <label>Sheet CSV URL <span>optional, mainly for salesmen</span></label>
                    <input className="inp" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://docs.google.com/..."/>
                  </div>

                  {/* ── Data Permissions ─ which states can this user see? ───── */}
                  <div className="um-slabel" style={{marginTop:16, display:'flex', alignItems:'center', gap:6}}>
                    <MapPin size={12}/> Territory — states
                    <span style={{textTransform:'none', letterSpacing:0, fontWeight:500}}>· none ticked = sees every state</span>
                  </div>
                  {allStates.length === 0 ? (
                    <div className="um-note">
                      No states found in dealer data yet. Run "Normalize City / State" in Manage Months first.
                    </div>
                  ) : (
                    <div className="um-chipbox">
                      {allStates.map(s => {
                        const on = createStates.has(s);
                        return (
                          <button type="button" key={s} className={'thr' + (on ? ' on' : '')} style={{'--tone':'var(--grn)'}} onClick={()=>{
                            const next = new Set(createStates);
                            on ? next.delete(s) : next.add(s);
                            setCreateStates(next);
                          }}>{on && '✓ '}{s}</button>
                        );
                      })}
                    </div>
                  )}
                  {createStates.size > 0 && (
                    <div className="um-hint" style={{color:'var(--yel)', marginTop:8}}>
                      This user will only see dealers / outstanding / sales for: <b>{[...createStates].join(', ')}</b>
                    </div>
                  )}
                </>
              )}

              {step === 2 && (
                <>
                  {/* ── Sections and actions — set at creation so nobody has to come back for a second pass ── */}
                  {isSuperAdmin && (
                    <>
                      <div className="um-slabel" style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
                        <Layers size={12}/> Sections this user can see
                        <span style={{textTransform:'none', letterSpacing:0, fontWeight:500}}>· {createPages.size ? createPages.size + ' selected' : 'none ticked = role default'}</span>
                        <span className="spacer"/>
                        <button type="button" className="btn" style={{fontSize:10.5, padding:'2px 9px'}} onClick={()=>setCreatePages(new Set(NAV_PAGES.map(p=>p.id)))}>All</button>
                        <button type="button" className="btn" style={{fontSize:10.5, padding:'2px 9px'}} onClick={()=>setCreatePages(new Set())}>None</button>
                      </div>
                      <div className="um-swgrid">
                        {NAV_PAGES.map(pg => { const on = createPages.has(pg.id); return (
                          <UmSwitch key={pg.id} on={on} label={pg.label}
                            onChange={()=>{ const next = new Set(createPages); on ? next.delete(pg.id) : next.add(pg.id); setCreatePages(next); }}/>
                        ); })}
                      </div>
                    </>
                  )}
                  {isSuperAdmin && actionGroups.length > 0 && (
                    <>
                      <div className="um-slabel" style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginTop:16}}>
                        <KeyRound size={12}/> Actions this user may perform
                        <span style={{textTransform:'none', letterSpacing:0, fontWeight:500}}>· {createFeatures.size ? createFeatures.size + ' of ' + allActionKeys.length : 'none ticked = role default'}</span>
                        <span className="spacer"/>
                        <button type="button" className="btn" style={{fontSize:10.5, padding:'2px 9px'}} onClick={()=>setCreateFeatures(new Set(allActionKeys))}>All</button>
                        <button type="button" className="btn" style={{fontSize:10.5, padding:'2px 9px'}} onClick={()=>setCreateFeatures(new Set())}>None</button>
                      </div>
                      {actionGroups.map(g => (
                        <div key={g.group} style={{marginBottom:10}}>
                          <div style={{fontSize:10, fontWeight:800, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.08em', margin:'6px 0 5px'}}>{g.group}</div>
                          <div className="um-swgrid">
                            {g.items.map(opt => { const on = createFeatures.has(opt.key); return (
                              <UmSwitch key={opt.key} on={on} label={opt.label} sub={opt.desc} title={opt.desc}
                                onChange={()=>{ const next = new Set(createFeatures); on ? next.delete(opt.key) : next.add(opt.key); setCreateFeatures(next); }}/>
                            ); })}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {!isSuperAdmin && (
                    <div className="um-note">Only a superadmin can set sections, actions and data scope; the new user gets the role default until then.</div>
                  )}
                </>
              )}
            </div>

            <div className="um-foot">
              {msg && msg.type !== 'success'
                ? <span className="um-err" style={{margin:0, flex:'1 1 200px'}}>{msg.text}</span>
                : <span style={{fontSize:11.5, color:'var(--t3)', flex:'1 1 120px'}}>Step {step + 1} of {STEPS.length}</span>}
              {step > 0 && (
                <button type="button" className="btn" onClick={()=>setStep(step - 1)} style={{display:'inline-flex', alignItems:'center', gap:4}}>
                  <ChevronLeft size={14}/> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" className="btnp" onClick={()=>goStep(step + 1)} style={{display:'inline-flex', alignItems:'center', gap:4}}>
                  Next <ChevronRight size={14}/>
                </button>
              ) : (
                <button className="btnp" onClick={create} disabled={busy} style={{display:'inline-flex', alignItems:'center', gap:6}}>
                  <UserPlus size={14}/> {busy ? 'Creating…' : 'Create account'}
                </button>
              )}
            </div>
          </div>
          </div>
        )}

      {/* ── Permissions modal (Edit existing user's data scope) ────────── */}
      {permsForUid && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setPermsForUid(null)}>
          <div className="modal" style={{
            maxWidth: 980,
            width: '95vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}>
            {/* header stays put; only the body scrolls — the lists used to be flex
                children of the modal and collapsed to a 30px strip when the
                content overflowed (every checkbox row showed cut in half) */}
            <div className="row" style={{padding:'14px 18px 10px', borderBottom:'1px solid var(--b1)', flexShrink:0}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:16, fontWeight:800, display:'flex', alignItems:'center', gap:10, color:'var(--t1)'}}>
                  <span className="um-hico" style={{width:34, height:34, borderRadius:10}}><SlidersHorizontal size={16}/></span>
                  <span style={{minWidth:0, overflow:'hidden', textOverflow:'ellipsis'}}>Access · {allUsers[permsForUid]?.name}</span>
                  <span className="um-role" style={{'--tone':roleMeta(allUsers[permsForUid]?.role).tone}}>{roleMeta(allUsers[permsForUid]?.role).label}</span>
                </div>
                <div style={{fontSize:11.5, color:'var(--t2)', marginTop:2}}>
                  Territory, pages and actions this user gets. Leave a list empty for no restriction on it.
                </div>
              </div>
              <div className="spacer"/>
              <button onClick={() => setPermsForUid(null)} className="btn" style={{padding:'4px 7px'}}><X size={14}/></button>
            </div>
            <div style={{flex:1, minHeight:0, overflowY:'auto', padding:'12px 18px'}}>
            {scopeErr && (
              <div style={{fontSize:12, padding:'8px 10px', borderRadius:6, marginBottom:10, background:'rgba(220,38,38,.08)', border:'1px solid rgba(220,38,38,.35)', color:'var(--red)', display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
                <span style={{flex:1}}>States / cities / zones could not be loaded: {scopeErr}</span>
                <button className="btn" style={{fontSize:11, padding:'3px 9px'}} onClick={loadScopes}>Retry</button>
              </div>
            )}

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

            <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>
              States <span style={{textTransform:'none', fontWeight:400}}>(dealers in any ticked state are visible)</span>
            </div>
            {allStates.length === 0 ? (
              <div style={{fontSize:12, color:'var(--t3)', padding:'6px 0 12px'}}>
                {scopeErr ? 'Not loaded — use Retry above.' : 'No states found in dealer data yet.'}
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
                            background: allSelected ? 'color-mix(in srgb, var(--grn) 15%, transparent)' : 'transparent',
                            color: allSelected ? 'var(--grn)' : 'var(--t2)',
                            borderColor: allSelected ? 'color-mix(in srgb, var(--grn) 40%, transparent)' : 'var(--b1)',
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
                              background: on ? 'color-mix(in srgb, var(--grn) 18%, transparent)' : 'transparent',
                              border:'1px solid ' + (on ? 'color-mix(in srgb, var(--grn) 50%, transparent)' : 'var(--b1)'),
                              color: on ? 'var(--grn)' : 'var(--t2)', fontWeight: on?700:500,
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
                        <div style={{fontSize:10, color:'var(--grn)', marginBottom:12, marginTop:-8}}>
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
                            color: allSelected ? 'var(--acc)' : 'var(--t2)',
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
                              color: on ? 'var(--acc)' : 'var(--t2)', fontWeight: on?700:500,
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
                        <div style={{fontSize:10, color:'var(--acc)', marginBottom:12, marginTop:-8}}>
                          ✓ {permsCities.size} cit{permsCities.size===1?'y':'ies'} selected: {[...permsCities].join(', ')}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}

            {/* ── Zone-level permissions ───────────────────────────────── */}
            <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6, marginTop:4}}>
              Zones <span style={{textTransform:'none', fontWeight:400}}>(optional)</span>
            </div>
            {allZones.length === 0 ? (
              <div style={{fontSize:11, color:'var(--t3)', padding:'6px 0 12px'}}>No zones found in dealer data yet.</div>
            ) : (
              <>
                <div style={{
                  display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:6, marginBottom:14,
                  padding:12, background:'var(--bg2)', borderRadius:6, maxHeight:200, overflowY:'auto',
                }}>
                  {allZones.map(z => {
                    const on = permsZones.has(z);
                    return (
                      <label key={z} style={{
                        fontSize:12, display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer',
                        padding:'6px 10px', borderRadius:5,
                        background: on ? 'rgba(139,92,246,0.18)' : 'transparent',
                        border:'1px solid ' + (on ? 'rgba(139,92,246,0.5)' : 'var(--b1)'),
                        color: on ? 'var(--pur)' : 'var(--t2)', fontWeight: on?700:500,
                      }}>
                        <input type="checkbox" checked={on} onChange={()=>{
                          const next = new Set(permsZones);
                          on ? next.delete(z) : next.add(z);
                          setPermsZones(next);
                        }} style={{margin:0}}/>
                        {z}
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Salesman-level permissions ───────────────────────────── */}
            <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6, marginTop:4}}>
              Salesmen <span style={{textTransform:'none', fontWeight:400}}>(optional — whose dealers this user can see)</span>
            </div>
            {(() => {
              const roster = Object.values(allUsers || users || {}).filter(u => u.role === 'salesman' && u.active !== false);
              if (roster.length === 0) return <div style={{fontSize:11, color:'var(--t3)', padding:'6px 0 12px'}}>No salesmen found.</div>;
              return (
                <div style={{
                  display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:6, marginBottom:10,
                  padding:12, background:'var(--bg2)', borderRadius:6, maxHeight:220, overflowY:'auto',
                }}>
                  {roster.map(s => {
                    const on = permsSalesmen.has(s.id);
                    return (
                      <label key={s.id} style={{
                        fontSize:12, display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer',
                        padding:'6px 10px', borderRadius:5,
                        background: on ? 'color-mix(in srgb, var(--grn) 18%, transparent)' : 'transparent',
                        border:'1px solid ' + (on ? 'color-mix(in srgb, var(--grn) 50%, transparent)' : 'var(--b1)'),
                        color: on ? 'var(--grn)' : 'var(--t2)', fontWeight: on?700:500,
                      }}>
                        <input type="checkbox" checked={on} onChange={()=>{
                          const next = new Set(permsSalesmen);
                          on ? next.delete(s.id) : next.add(s.id);
                          setPermsSalesmen(next);
                        }} style={{margin:0}}/>
                        {s.name}
                      </label>
                    );
                  })}
                </div>
              );
            })()}

            {/* How the four scopes combine — worth stating, because getting this
                backwards silently grants far more access than intended. */}
            <div style={{
              fontSize:11, color:'var(--t3)', lineHeight:1.6, marginBottom:14,
              padding:'8px 10px', background:'var(--bg2)', borderRadius:6, border:'1px solid var(--b1)',
            }}>
              <strong style={{color:'var(--t2)'}}>How these combine:</strong> States, Cities and Zones are matched with <strong>OR</strong> —
              granting a few territories shows dealers in any of them. Salesmen is <strong>AND</strong>ed on top, narrowing
              within that territory. Leave a list empty for no restriction on that dimension; leave all four empty and the
              user falls back to their role default. Superadmins ignore all of it.
            </div>

            {/* ── Left-navigation PAGE access ─────────────────────── */}
            <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8, marginTop:4, display:'flex', alignItems:'center', gap:8}}>
              Pages / components this user can see
              <span style={{textTransform:'none', letterSpacing:0, color:'var(--t3)', fontWeight:400}}>
                — {permsPages.size ? permsPages.size + ' selected' : 'none selected = role default'}
              </span>
            </div>
            <div style={{display:'flex', gap:6, marginBottom:8}}>
              <button className="btn" style={{fontSize:11, padding:'3px 10px'}}
                onClick={()=>setPermsPages(new Set(NAV_PAGES.map(p=>p.id)))}>Select all</button>
              <button className="btn" style={{fontSize:11, padding:'3px 10px'}}
                onClick={()=>setPermsPages(new Set())}>None (role default)</button>
            </div>
            <div className="um-swgrid" style={{padding:10, background:'var(--bg2)', borderRadius:12, marginBottom:14, maxHeight:260, overflowY:'auto'}}>
              {NAV_PAGES.map(pg => {
                const on = permsPages.has(pg.id);
                return (
                  <UmSwitch key={pg.id} on={on} label={pg.label} onChange={()=>{
                    const next = new Set(permsPages);
                    on ? next.delete(pg.id) : next.add(pg.id);
                    setPermsPages(next);
                  }}/>
                );
              })}
            </div>

            {/* ── App-section feature toggles ─────────────────────── */}
            <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8, marginTop:4}}>
              Actions this user may perform
            </div>
            <div style={{padding:10, background:'var(--bg2)', borderRadius:6, marginBottom:14}}>
              <div style={{display:'flex', gap:8, marginBottom:8, flexWrap:'wrap', alignItems:'center'}}>
                <button className="btn" style={{fontSize:11, padding:'3px 9px'}}
                  onClick={()=>setPermsFeatures(new Set(allActionKeys))}>Select all</button>
                <button className="btn" style={{fontSize:11, padding:'3px 9px'}}
                  onClick={()=>setPermsFeatures(new Set())}>Clear</button>
                <span style={{fontSize:11, color:'var(--t3)', marginLeft:'auto'}}>
                  {permsFeatures.size ? permsFeatures.size + ' of ' + allActionKeys.length + ' allowed'
                                      : 'none ticked = role default'}
                </span>
              </div>

              {/* Ticking even one box switches this user from "role default" to
                  "exactly these" — an admin who was doing everything would be
                  cut down to the ticked ones. Worth saying out loud. */}
              {permsFeatures.size > 0 && permsFeatures.size < allActionKeys.length && (
                <div style={{fontSize:10.5, lineHeight:1.5, padding:'6px 9px', borderRadius:5, marginBottom:8,
                  background:'color-mix(in srgb, var(--yel) 10%, transparent)', border:'1px solid color-mix(in srgb, var(--yel) 35%, transparent)', color:'var(--yel)'}}>
                  This user will be allowed <b>only</b> the ticked actions — everything else is refused,
                  even if their role would normally permit it.
                </div>
              )}

              {actionGroups.map(g => (
                <div key={g.group} style={{marginBottom:10}}>
                  <div style={{fontSize:10, color:'var(--t3)', textTransform:'uppercase',
                               letterSpacing:'.08em', fontWeight:700, marginBottom:4}}>{g.group}</div>
                  <div className="um-swgrid">
                    {g.items.map(opt => {
                      const on = permsFeatures.has(opt.key);
                      return (
                        <UmSwitch key={opt.key} on={on} label={opt.label} sub={opt.desc} onChange={()=>{
                          const next = new Set(permsFeatures);
                          on ? next.delete(opt.key) : next.add(opt.key);
                          setPermsFeatures(next);
                        }}/>
                      );
                    })}
                  </div>
                </div>
              ))}
              {actionGroups.length === 0 && (
                <div style={{fontSize:11, color:'var(--t3)'}}>Loading actions…</div>
              )}
              <div style={{fontSize:10, color:'var(--t3)', marginTop:4, fontStyle:'italic'}}>
                Nothing ticked → admins keep full access; salesmen get no write actions.
                Superadmins are never restricted.
              </div>
            </div>

            </div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end', alignItems:'center', flexWrap:'wrap', padding:'10px 18px', borderTop:'1px solid var(--b1)', flexShrink:0, background:'var(--bg1)'}}>
              <span style={{fontSize:11, color:'var(--t3)', marginRight:'auto'}}>
                {[permsStates.size && `${permsStates.size} states`, permsCities.size && `${permsCities.size} cities`, permsZones.size && `${permsZones.size} zones`, permsSalesmen.size && `${permsSalesmen.size} salesmen`, permsPages.size && `${permsPages.size} pages`, permsFeatures.size && `${permsFeatures.size} actions`].filter(Boolean).join(' · ') || 'No restriction — role default'}
              </span>
              <button className="btn" onClick={() => { setPermsStates(new Set()); setPermsCities(new Set()); setPermsZones(new Set()); setPermsSalesmen(new Set()); setPermsFeatures(new Set()); setPermsPages(new Set()); }}>Clear all</button>
              <button className="btn" onClick={() => setPermsForUid(null)}>Cancel</button>
              <button className="btnp" onClick={savePermissions} disabled={permsSaving}>
                {permsSaving ? 'Saving…' : 'Save permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    </Shell>
  );
};

export default UserManagement;
