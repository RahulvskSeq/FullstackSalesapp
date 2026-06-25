import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar, Plus, Check, Upload, RefreshCw, Trash2, AlertCircle,
  CheckCircle, Database, ChevronRight, Edit3, Download, X,
  Users as UsersIcon, ChevronDown,
} from 'lucide-react';
import { api } from '../api';
import { monthTarget, fetchCSV, parseRow, parseCSV } from '../utils';
import { notify, confirmDialog } from './Toast';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Parse a month label like 'Jun-26' or 'Jun 2026' or '2026-06' → { idx, year }
const parseMonth = label => {
  if(!label) return null;
  const s = String(label).trim();
  // 'Jun-26' or 'Jun 26'
  const m = s.match(/^([A-Za-z]{3,})[-\s]+(\d{2,4})$/);
  if(m){
    const monKey = m[1].slice(0,3).toLowerCase();
    const idx = MONTH_NAMES.findIndex(mn => mn.toLowerCase() === monKey);
    if(idx < 0) return null;
    let y = parseInt(m[2], 10);
    if(y < 100) y += 2000;
    return { idx, year:y };
  }
  // 'YYYY-MM'
  const m2 = s.match(/^(\d{4})[-/](\d{1,2})$/);
  if(m2){
    return { idx: parseInt(m2[2],10) - 1, year: parseInt(m2[1],10) };
  }
  return null;
};

// Next month label after a given one ('May-26' → 'Jun-26')
const nextMonthLabel = label => {
  const p = parseMonth(label);
  if(!p) return null;
  let { idx, year } = p;
  idx++;
  if(idx > 11){ idx = 0; year++; }
  return MONTH_NAMES[idx] + '-' + String(year).slice(-2);
};

const fmtIN = n => {
  if(n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-IN');
};

// ────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────
export default function ManageMonths({
  dealers = [],
  users = {},
  currentUser,
  monthConfig,
  saveMonthConfig,
  loadFromDB,
  onSync,
  syncing,
  lastSync,
}) {
  const MO         = monthConfig?.MO || [];
  const currentIdx = monthConfig?.currentIdx ?? 0;
  // Admin or superadmin both get full access
  const isAdmin    = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  // Only superadmin can see / use the irreversible "Wipe All" button.
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [newMonth, setNewMonth]     = useState('');
  const [busy, setBusy]             = useState(false);
  const [msg, setMsg]               = useState(null);   // { type:'success'|'error', text }
  const [uploadFor, setUploadFor]   = useState(null);   // month label being uploaded for
  const [uploadSm, setUploadSm]     = useState(currentUser?.id || '');
  const fileRef = useRef(null);

  // ── Salesman diagnostic state ─────────────────────────────────────────────
  const [diagOpenSm, setDiagOpenSm] = useState(null);   // salesman id expanded
  const [diagMonth, setDiagMonth]   = useState(MO[currentIdx] || MO[MO.length-1]);

  // ── Sheet Inspector state ────────────────────────────────────────────────
  const [inspectorSm, setInspectorSm] = useState(null);  // salesman being inspected
  const [inspectorData, setInspectorData] = useState(null); // { headers, rows, parsedFirst, error }
  const [inspectorBusy, setInspectorBusy] = useState(false);

  const colLetter = idx => {
    // 0->A, 1->B, ... 25->Z, 26->AA, 27->AB ...
    if(idx < 26) return String.fromCharCode(65 + idx);
    return String.fromCharCode(65 + Math.floor(idx/26) - 1) + String.fromCharCode(65 + (idx % 26));
  };

  const openInspector = async (smId) => {
    const user = users[smId];
    if(!user?.url){
      setInspectorSm(smId);
      setInspectorData({ error: 'No Google Sheet URL stored for ' + (user?.name || smId) + '. Set it in Admin Panel → User Management.' });
      return;
    }
    setInspectorSm(smId);
    setInspectorData(null);
    setInspectorBusy(true);
    try {
      const csv = await fetchCSV(user.url);
      const lines = csv.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').slice(0, 12);
      // Find header row (same heuristic as parseCSV)
      let hi = 0;
      for(let i = 0; i < Math.min(lines.length, 10); i++){
        const l = lines[i].toLowerCase();
        if(l.includes('dealer') || (l.includes('name') && l.includes('target'))){ hi = i; break; }
      }
      const headers = parseRow(lines[hi] || '');
      const dataRows = lines.slice(hi + 1).filter(l => l.trim()).slice(0, 4).map(parseRow);
      // Run parseCSV on full csv to see what got extracted for the first dealer
      const parsed = parseCSV(csv, smId);
      const parsedFirst = parsed.slice(0, 3);
      setInspectorData({ headers, dataRows, headerRowIndex: hi, parsedFirst, totalParsed: parsed.length });
    } catch(e){
      setInspectorData({ error: 'Failed to fetch sheet: ' + e.message });
    } finally { setInspectorBusy(false); }
  };

  const closeInspector = () => { setInspectorSm(null); setInspectorData(null); };

  const salesmen = Object.values(users).filter(u => u?.role === 'salesman');

  // ── Per-month stats computed from currently loaded dealers ──────────────
  const monthStats = useMemo(() => {
    const out = {};
    MO.forEach((m, i) => {
      let withData = 0;
      let totalSales = 0;
      let totalTarget = 0;
      let salesmenSet = new Set();
      dealers.forEach(d => {
        const ach = Number(d.months?.[i] || 0);
        const tgt = monthTarget(d, i);  // smart per-month target
        if(ach > 0 || tgt > 0){
          withData++;
          if(d.salesman) salesmenSet.add(d.salesman);
        }
        totalSales += ach;
        totalTarget += tgt;
      });
      out[m] = {
        index: i,
        label: m,
        withData,
        totalSales,
        totalTarget,
        salesmen: Array.from(salesmenSet),
        hasData: withData > 0 || totalSales > 0 || totalTarget > 0,
      };
    });
    return out;
  }, [MO, dealers]);

  const filledMonths = MO.filter(m => monthStats[m]?.hasData).length;
  const blankMonths  = MO.length - filledMonths;
  const suggestedNext = MO.length ? nextMonthLabel(MO[MO.length - 1]) : null;

  // ── Per-SALESMAN per-MONTH diagnostic ─────────────────────────────────────
  // For each salesman: their dealers + per-month totals (achieved, target, count, sources).
  // Lets you compare DB against Google Sheets to find wrong numbers.
  const diagMonthIdx = MO.indexOf(diagMonth);
  const salesmanStats = useMemo(() => {
    const map = {};
    salesmen.forEach(s => { map[s.id] = { id:s.id, name:s.name, dealers:[], byMonth:{}, sources:{sheet:0, upload:0, other:0} }; });
    // Bucket dealers by salesman
    dealers.forEach(d => {
      const sm = d.salesman || '__unassigned';
      if(!map[sm]) map[sm] = { id:sm, name:sm + ' (no user record)', dealers:[], byMonth:{}, sources:{sheet:0, upload:0, other:0} };
      map[sm].dealers.push(d);
      const src = d.source || 'other';
      if(src === 'sheet')       map[sm].sources.sheet++;
      else if(src === 'upload') map[sm].sources.upload++;
      else                      map[sm].sources.other++;
    });
    // Compute per-month totals for each salesman.
    // Uses the smart monthTarget() helper so historical data with only a
    // global target still totals correctly (falls back to d.target ONLY for
    // months that actually have sales). This matches what the dashboards show.
    Object.values(map).forEach(sm => {
      MO.forEach((m, i) => {
        let ach = 0, tgt = 0, withData = 0;
        sm.dealers.forEach(d => {
          const a = Number(d.months?.[i]) || 0;
          const t = monthTarget(d, i);   // smart fallback
          ach += a;
          tgt += t;
          if(a > 0 || t > 0) withData++;
        });
        sm.byMonth[m] = { ach, tgt, withData };
      });
    });
    return map;
  }, [dealers, salesmen, MO]);

  const salesmanList = useMemo(
    () => Object.values(salesmanStats).sort((a, b) => {
      // Sort by total sales for the selected diag month (largest first)
      const aT = a.byMonth?.[diagMonth]?.ach || 0;
      const bT = b.byMonth?.[diagMonth]?.ach || 0;
      if(aT !== bT) return bT - aT;
      return a.name.localeCompare(b.name);
    }),
    [salesmanStats, diagMonth]
  );

  const topDealersForSm = (smId) => {
    const sm = salesmanStats[smId];
    if(!sm || diagMonthIdx < 0) return [];
    return [...sm.dealers]
      .map(d => ({
        id: d.id,
        name: d.name,
        ach: Number(d.months?.[diagMonthIdx]) || 0,
        tgt: monthTarget(d, diagMonthIdx),   // smart fallback so historical targets show
        source: d.source || 'other',
      }))
      .sort((a, b) => b.ach - a.ach)
      .slice(0, 15);
  };

  // ── Actions ──────────────────────────────────────────────────────────────
  const showMsg = (type, text, timeout = 4000) => {
    setMsg({ type, text });
    if(timeout) setTimeout(() => setMsg(null), timeout);
  };

  const handleAddMonth = async () => {
    const label = (newMonth || suggestedNext || '').trim();
    if(!label){ showMsg('error', 'Enter a month label like Jun-26'); return; }
    if(MO.includes(label)){ showMsg('error', label + ' already exists'); return; }
    setBusy(true);
    try {
      const newMO = [...MO, label];
      const newIdx = newMO.length - 1;  // make the new month the current
      const p = parseMonth(label);
      const fullLabel = p ? MONTH_NAMES[p.idx] + ' ' + p.year : label;
      const newCfg = {
        MO: newMO,
        currentIdx: newIdx,
        label: fullLabel,
        short: p ? MONTH_NAMES[p.idx] : label,
      };
      saveMonthConfig(newCfg);
      setNewMonth('');
      showMsg('success', 'Added ' + label + '. Now upload data for it.');
      // Reload with new MO so dealers update with the new blank month
      if(loadFromDB) await loadFromDB(newMO);
    } catch(e){
      showMsg('error', 'Failed: ' + e.message);
    } finally { setBusy(false); }
  };

  const handleSetCurrent = async (idx) => {
    setBusy(true);
    try {
      const m = MO[idx];
      const p = parseMonth(m);
      const fullLabel = p ? MONTH_NAMES[p.idx] + ' ' + p.year : m;
      saveMonthConfig({
        MO,
        currentIdx: idx,
        label: fullLabel,
        short: p ? MONTH_NAMES[p.idx] : m,
      });
      showMsg('success', 'Current month set to ' + m);
    } catch(e){
      showMsg('error', e.message);
    } finally { setBusy(false); }
  };

  const handleRemoveMonth = async (m) => {
    const stats = monthStats[m];
    const message = stats?.hasData
      ? 'This WILL NOT delete any dealer data — it only hides the month from the dashboard. You can re-add it any time.'
      : 'This month has no data.';
    const ok = await confirmDialog({
      title: 'Remove ' + m + '?',
      message,
      confirmText: 'Remove',
      danger: true,
    });
    if(!ok) return;
    setBusy(true);
    try {
      const idx = MO.indexOf(m);
      const newMO = MO.filter(x => x !== m);
      if(newMO.length === 0){ showMsg('error', 'Cannot remove the last month'); setBusy(false); return; }
      let newIdx = currentIdx;
      if(idx === currentIdx) newIdx = Math.max(0, newMO.length - 1);
      else if(idx < currentIdx) newIdx = currentIdx - 1;
      const targetMonth = newMO[newIdx];
      const p = parseMonth(targetMonth);
      saveMonthConfig({
        MO: newMO,
        currentIdx: newIdx,
        label: p ? MONTH_NAMES[p.idx] + ' ' + p.year : targetMonth,
        short: p ? MONTH_NAMES[p.idx] : targetMonth,
      });
      showMsg('success', m + ' removed from view (data preserved in DB)');
      if(loadFromDB) await loadFromDB(newMO);
    } catch(e){
      showMsg('error', e.message);
    } finally { setBusy(false); }
  };

  // Reload fresh dealer data from MongoDB — no Sheets involved
  const handleReloadDB = async () => {
    if(!loadFromDB) return;
    setBusy(true);
    try {
      await loadFromDB(MO);
      showMsg('success', 'Reloaded all dealer data from MongoDB. Your dashboard now shows the latest saved values.');
    } catch(e){
      showMsg('error', 'Reload failed: ' + e.message);
    } finally { setBusy(false); }
  };

  const handleSync = async () => {
    if(!onSync) return;
    setBusy(true);
    try {
      await onSync();
      // Tell user which months were touched and which preserved
      // (server response is captured by App.jsx; we show a generic confirmation here).
      showMsg('success',
        'Synced from Google Sheets. Months without sheet data (e.g. Jun-26 if you uploaded it manually) are PRESERVED — they stay as-is in the DB. Check Salesman Diagnostic to verify.',
        8000
      );
    } catch(e){
      showMsg('error', 'Sync failed: ' + e.message);
    } finally { setBusy(false); }
  };

  const handleWipeAll = async () => {
    const first = window.prompt(
      'DANGER: This will delete EVERY dealer record from the database.\n\n' +
      'After wiping, you can:\n' +
      '  1. Click "Sync now" to re-load fresh data from Google Sheets, OR\n' +
      '  2. Upload Excel files per month via Monthly Entry\n\n' +
      'Type "WIPE" (in capitals) to confirm:'
    );
    if(first !== 'WIPE'){
      showMsg('error', 'Wipe cancelled.');
      return;
    }
    const wipeOk = await confirmDialog({
      title: 'WIPE ALL DEALER DATA?',
      message: 'Really delete ALL dealer data? This cannot be undone.',
      confirmText: 'Delete everything',
      danger: true,
    });
    if(!wipeOk) return;
    setBusy(true);
    try {
      const res = await api.wipeAllDealers();
      showMsg('success', 'Wiped ' + (res.deleted || 0) + ' dealer records. DB is now empty. Click "Sync now" or upload data via Monthly Entry to fill it back up.');
      // Reload — should now show empty
      if(loadFromDB) await loadFromDB(MO);
    } catch(e){
      showMsg('error', 'Wipe failed: ' + e.message);
    } finally { setBusy(false); }
  };

  const handleDedupe = async () => {
    setBusy(true);
    setMsg(null);
    try {
      // Step 1: dry run to preview
      const preview = await api.dedupeDealers(true);
      if(preview.duplicatesRemoved === 0){
        showMsg('success', 'No duplicate dealers found. Your DB is clean.');
        return;
      }
      const sampleText = (preview.sample || []).slice(0, 5)
        .map(s => `  • ${s.salesman} / ${s.name} (kept 1, would remove ${s.removed.length})`)
        .join('\n');
      const ok = await confirmDialog({
        title: 'Merge ' + preview.duplicatesRemoved + ' duplicate dealer records?',
        message:
          `Found ${preview.duplicatesRemoved} duplicate dealer records across ${preview.groupsFound} dealer names.\n\n` +
          `Sample:\n${sampleText}\n\n` +
          `Proceed to merge their monthlyData into the canonical record and delete the duplicates? This is safe — no monthly data is lost.`,
        confirmText: 'Merge & delete duplicates',
      });
      if(!ok){ showMsg('error', 'Dedup cancelled.'); return; }
      // Step 2: real run
      const res = await api.dedupeDealers(false);
      showMsg('success',
        `Removed ${res.duplicatesRemoved} duplicate dealer records across ${res.groupsFound} groups. ` +
        `Their monthly data was merged into the kept record. Reloading from DB…`
      );
      if(loadFromDB) await loadFromDB(MO);
    } catch(e){
      showMsg('error', 'Dedup failed: ' + e.message);
    } finally { setBusy(false); }
  };

  // Re-write every dealer's city + state in uniform Title Case so that
  // "BANGALORE", "bangalore ", "Bangalore" all become "Bangalore". Useful
  // after a messy upload where the same city showed up in many capitalizations.
  const handleNormalizeCityState = async () => {
    setBusy(true); setMsg(null);
    try {
      const preview = await api.normalizeCityState(true);
      if (!preview.cityFixed && !preview.stateFixed) {
        showMsg('success', 'City and State are already uniform — nothing to fix.');
        return;
      }
      const messyCitySample = (preview.messyCities || []).slice(0, 5).map(([v, n]) => `  • "${v}" — ${n} dealer(s)`).join('\n');
      const messyStateSample = (preview.messyStates || []).slice(0, 5).map(([v, n]) => `  • "${v}" — ${n} dealer(s)`).join('\n');
      const ok = await confirmDialog({
        title: `Normalize ${preview.cityFixed} cities and ${preview.stateFixed} states?`,
        message:
          `This will trim extra spaces and convert to Title Case across the whole DB.\n\n` +
          `Messy city examples that will be cleaned:\n${messyCitySample || '  (none)'}\n\n` +
          `Messy state examples that will be cleaned:\n${messyStateSample || '  (none)'}\n\n` +
          `${preview.cityFixed} city values and ${preview.stateFixed} state values will be re-written. No other field is touched.`,
        confirmText: 'Yes, normalize',
      });
      if (!ok) return;
      const r = await api.normalizeCityState(false);
      showMsg('success', `Done. Cities fixed: ${r.cityFixed}, States fixed: ${r.stateFixed}. Reloading from DB…`);
      if (loadFromDB) await loadFromDB(MO);
    } catch (e) {
      showMsg('error', 'Normalize failed: ' + e.message);
    } finally { setBusy(false); }
  };

  const handleRepairTargets = async () => {
    const ok = await confirmDialog({
      title: 'Repair targets?',
      message: 'This will copy each dealer\'s baseline target into every month that has sales but no target stored. It only ADDS missing per-month targets — nothing is deleted. Safe to run anytime.',
      confirmText: 'Repair',
    });
    if(!ok) return;
    setBusy(true);
    try {
      const res = await api.repairTargets();
      showMsg(
        'success',
        `Repaired: ${res.monthsBackfilled || 0} months back-filled across ${res.dealersScanned || 0} dealers. Reloading data…`
      );
      if(loadFromDB) await loadFromDB(MO);
    } catch(e){
      showMsg('error', 'Repair failed: ' + e.message);
    } finally { setBusy(false); }
  };

  const beginUpload = (m) => {
    setUploadFor(m);
    setUploadSm(currentUser?.id || '');
    setTimeout(() => fileRef.current?.click(), 50);
  };

  const handleFile = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if(!f || !uploadFor) return;
    setBusy(true);
    try {
      const sm = isAdmin && uploadSm ? uploadSm : undefined;
      const res = await api.uploadMonth(f, uploadFor, sm);
      showMsg('success',
        `${uploadFor}: ${res.added || 0} added, ${res.updated || 0} updated` +
        (res.skipped ? `, ${res.skipped} skipped` : '')
      );
      setUploadFor(null);
      if(loadFromDB) await loadFromDB(MO);
    } catch(err){
      showMsg('error', 'Upload failed: ' + err.message);
    } finally { setBusy(false); }
  };

  const downloadTemplate = (m) => {
    const headers = ['Dealer Name','City','State','Zone','Status','Target','Achieved','Category Type','Sub Category','Credit Days','Credit Limit'];
    const rows    = [
      ['SAMPLE DEALER 1','Hyderabad','Telangana','ZONE 1','STAR',500,320,'LAMINATE','1 MM',45,300000],
      ['SAMPLE DEALER 2','Mumbai','Maharashtra','ZONE 2','ACTIVE',300,280,'POLYMENT SHEET','GAG',30,200000],
    ];
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `Upload_${m}.csv`;
    a.click();
  };

  if(!isAdmin){
    return (
      <div className="fade" style={{padding:24, textAlign:'center', color:'var(--t2)'}}>
        <AlertCircle size={28} style={{margin:'0 auto 8px', color:'var(--t3)'}}/>
        <div style={{fontSize:14}}>This page is for admins only.</div>
      </div>
    );
  }

  return (
    <div className="fade" style={{padding:0}}>
      {/* Hidden file input — reused for any month */}
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
        style={{display:'none'}} onChange={handleFile}/>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.15em', marginBottom:2}}>
          Admin · Data Management
        </div>
        <div style={{fontSize:22, fontWeight:700, color:'var(--t1)'}}>Manage Months</div>
        <div style={{fontSize:12, color:'var(--t3)', marginTop:4}}>
          One place to add, upload, and organize month-wise data. Removing a month here never deletes data —
          it only hides it from the dashboard.
        </div>
      </div>

      {/* ── Status banner ────────────────────────────────────────────────── */}
      {msg && (
        <div style={{
          padding:'10px 14px', borderRadius:8, marginBottom:12,
          background: msg.type === 'success' ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
          border: '1px solid ' + (msg.type === 'success' ? '#15803d' : '#7f1d1d'),
          color:  msg.type === 'success' ? '#86efac' : '#fca5a5',
          display:'flex', alignItems:'center', gap:8, fontSize:12,
        }}>
          {msg.type === 'success' ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
          <span style={{flex:1}}>{msg.text}</span>
          <button onClick={() => setMsg(null)} style={{background:'none', border:'none', color:'inherit', cursor:'pointer'}}>
            <X size={13}/>
          </button>
        </div>
      )}

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div style={{
        display:'grid', gap:10, marginBottom:14,
        gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))',
      }}>
        {[
          { l:'Total months',   v:MO.length,        c:'#6366f1', i:Calendar },
          { l:'Months with data', v:filledMonths,   c:'#86efac', i:Database },
          { l:'Blank months',   v:blankMonths,      c:'#fbbf24', i:AlertCircle },
          { l:'Current month',  v:MO[currentIdx] || '—', c:'#22d3ee', i:Check },
        ].map(k => {
          const Icon = k.i;
          return (
            <div key={k.l} className="card" style={{display:'flex', alignItems:'center', gap:10}}>
              <Icon size={22} color={k.c}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em'}}>{k.l}</div>
                <div style={{fontSize:18, fontWeight:800, color:k.c, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{k.v}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DANGER ZONE: Start Fresh — SUPERADMIN ONLY ─────────────────── */}
      {isSuperAdmin && (
        <div className="card" style={{
          padding:14, marginBottom:14,
          background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.3)',
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
            <span style={{fontSize:16}}>⚠️</span>
            <div style={{flex:1, minWidth:200}}>
              <div style={{fontSize:13, fontWeight:700, color:'#fca5a5', marginBottom:3}}>
                Start Fresh — Wipe all dealer data
                <span style={{fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:3, background:'rgba(251,191,36,0.15)', color:'#fbbf24', marginLeft:8, letterSpacing:'.06em'}}>SUPERADMIN ONLY</span>
              </div>
              <div style={{fontSize:11, color:'var(--t3)'}}>
                Deletes every dealer record from MongoDB. After wiping you'll have a clean DB. You can re-populate it by clicking <b>Sync now</b> (re-loads from Google Sheets) or by uploading Excel files via <b>Monthly Entry</b>. Once data is in DB, refreshes and uploads will work cleanly.
              </div>
            </div>
            <button onClick={handleWipeAll} disabled={busy}
              style={{
                display:'flex', alignItems:'center', gap:6,
                background:'transparent', color:'#fca5a5',
                border:'1px solid #f87171', borderRadius:6,
                padding:'8px 14px', fontSize:12, fontWeight:700,
                cursor: busy ? 'not-allowed' : 'pointer',
                whiteSpace:'nowrap',
              }}>
              <Trash2 size={14}/>
              Wipe All Data
            </button>
          </div>
        </div>
      )}

      {/* ── Add month + Sync row ────────────────────────────────────────── */}
      <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:10, marginBottom:14}}>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>
            Add a new month
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
            <input
              type="text"
              placeholder={suggestedNext ? `e.g. ${suggestedNext}` : 'e.g. Jun-26'}
              value={newMonth}
              onChange={e => setNewMonth(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMonth()}
              disabled={busy}
              style={{
                flex:'1 1 160px', padding:'8px 12px',
                background:'var(--bg2)', color:'var(--t1)',
                border:'1px solid var(--b1)', borderRadius:6,
                fontSize:13, fontWeight:600,
              }}
            />
            <button onClick={handleAddMonth} disabled={busy}
              style={{
                display:'flex', alignItems:'center', gap:6,
                background:'#22c55e', color:'#0c0c1e', border:'none',
                padding:'8px 14px', borderRadius:6, fontSize:12, fontWeight:700,
                cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1,
              }}>
              <Plus size={14}/> Add Month
            </button>
            {suggestedNext && !newMonth && (
              <button onClick={() => setNewMonth(suggestedNext)} disabled={busy}
                style={{
                  background:'transparent', color:'var(--t3)',
                  border:'1px dashed var(--b1)', padding:'6px 10px',
                  borderRadius:6, fontSize:11, cursor:'pointer',
                }}>
                Use next: {suggestedNext}
              </button>
            )}
          </div>
          <div style={{fontSize:11, color:'var(--t3)', marginTop:8}}>
            Format examples: <b>Jun-26</b>, <b>Jul-26</b>, <b>Jan-27</b>. New month starts blank — upload Excel below.
          </div>
        </div>

        <div className="card" style={{padding:14, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>
              Data sources
            </div>
            <div style={{fontSize:11, color:'var(--t3)', marginBottom:8}}>
              <b style={{color:'#86efac'}}>Reload from DB</b> = safe refresh, never touches Sheets.
              <b style={{color:'#a5b4fc'}}> Sync now</b> = pull from Google Sheets (preserves uploaded months).
              {lastSync ? ' · Last sync: ' + lastSync : ''}
            </div>
          </div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            <button onClick={handleReloadDB} disabled={busy}
              title="Re-fetch all dealer data from MongoDB. Safe — only reads, never writes."
              style={{
                flex:'1 1 130px',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'#15803d', color:'#fff', border:'none',
                padding:'8px 12px', borderRadius:6, fontSize:12, fontWeight:700,
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}>
              <RefreshCw size={14}/>
              Reload from DB
            </button>
            <button onClick={handleSync} disabled={busy || syncing}
              title="Pull latest from Google Sheets. Months not in the sheet (e.g. June) are preserved."
              style={{
                flex:'1 1 130px',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'#6366f1', color:'#fff', border:'none',
                padding:'8px 12px', borderRadius:6, fontSize:12, fontWeight:700,
                cursor: (busy || syncing) ? 'not-allowed' : 'pointer',
                opacity: (busy || syncing) ? 0.7 : 1,
              }}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''}/>
              {syncing ? 'Syncing…' : 'Sync from Sheets'}
            </button>
            <button onClick={handleRepairTargets} disabled={busy}
              title="Back-fill per-month targets from each dealer's baseline target. Run once after a sync if targets look wrong."
              style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'transparent', color:'#fbbf24',
                border:'1px solid #92400e',
                padding:'8px 10px', borderRadius:6, fontSize:11, fontWeight:700,
                cursor: busy ? 'not-allowed' : 'pointer', whiteSpace:'nowrap',
              }}>
              <CheckCircle size={13}/>
              Repair Targets
            </button>
            <button onClick={handleDedupe} disabled={busy}
              title="Find dealers stored twice under the same salesman (e.g. from old syncs with name variations) and merge them. Fixes inflated totals."
              style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'transparent', color:'#f87171',
                border:'1px solid #7f1d1d',
                padding:'8px 10px', borderRadius:6, fontSize:11, fontWeight:700,
                cursor: busy ? 'not-allowed' : 'pointer', whiteSpace:'nowrap',
              }}>
              <Trash2 size={13}/>
              Find Duplicates
            </button>
            <button onClick={handleNormalizeCityState} disabled={busy}
              title="Re-write every dealer's City and State in uniform Title Case (e.g. BANGALORE → Bangalore). Run this once to clean up messy capitalizations from imports."
              style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'transparent', color:'#a5b4fc',
                border:'1px solid #4338ca',
                padding:'8px 10px', borderRadius:6, fontSize:11, fontWeight:700,
                cursor: busy ? 'not-allowed' : 'pointer', whiteSpace:'nowrap',
              }}>
              <CheckCircle size={13}/>
              Normalize City / State
            </button>
          </div>
        </div>
      </div>

      {/* ── Month list table ─────────────────────────────────────────────── */}
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{
          padding:'10px 14px', background:'var(--bg2)',
          borderBottom:'1px solid var(--b1)',
          display:'flex', alignItems:'center', gap:8,
        }}>
          <Calendar size={14} color="#22c55e"/>
          <span style={{fontSize:13, fontWeight:700, color:'var(--t1)'}}>All months ({MO.length})</span>
          <span style={{fontSize:11, color:'var(--t3)'}}>— oldest to newest</span>
        </div>

        {MO.length === 0 ? (
          <div style={{padding:30, textAlign:'center', color:'var(--t3)', fontSize:13}}>
            No months yet. Add one above to begin.
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:12, minWidth:760}}>
              <thead>
                <tr style={{background:'var(--bg2)'}}>
                  {['#','Month','Status','Dealers','Sales (V)','Target','Achievement','Salesmen','Actions'].map(h => (
                    <th key={h} style={{
                      padding:'8px 10px', textAlign: ['Dealers','Sales (V)','Target'].includes(h) ? 'right' : 'left',
                      color:'var(--t3)', fontSize:10, fontWeight:700, textTransform:'uppercase',
                      borderBottom:'1px solid var(--b1)', whiteSpace:'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MO.map((m, i) => {
                  const st = monthStats[m] || {};
                  const isCurrent = i === currentIdx;
                  const achPct = st.totalTarget ? Math.round((st.totalSales / st.totalTarget) * 100) : null;
                  return (
                    <tr key={m} style={{
                      background: isCurrent ? 'rgba(34,197,94,0.06)' : 'transparent',
                      borderLeft: '3px solid ' + (isCurrent ? '#22c55e' : 'transparent'),
                      borderBottom:'1px solid var(--b1)',
                    }}>
                      <td style={{padding:'8px 10px', color:'var(--t3)', width:30}}>{i+1}</td>
                      <td style={{padding:'8px 10px', fontWeight:700, color: isCurrent ? '#86efac' : 'var(--t1)', whiteSpace:'nowrap'}}>
                        {m}
                        {isCurrent && <span style={{
                          marginLeft:6, fontSize:9, color:'#0c0c1e', background:'#86efac',
                          padding:'1px 6px', borderRadius:3, fontWeight:700, letterSpacing:'.05em',
                        }}>CURRENT</span>}
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        {st.hasData ? (
                          <span style={{fontSize:10, color:'#86efac', background:'rgba(34,197,94,0.12)',
                            padding:'2px 8px', borderRadius:4, fontWeight:700, border:'1px solid #15803d'}}>
                            HAS DATA
                          </span>
                        ) : (
                          <span style={{fontSize:10, color:'var(--t3)', background:'var(--bg2)',
                            padding:'2px 8px', borderRadius:4, fontWeight:700, border:'1px dashed var(--b1)'}}>
                            BLANK
                          </span>
                        )}
                      </td>
                      <td style={{padding:'8px 10px', textAlign:'right', fontWeight:700, color: st.withData ? 'var(--t1)' : 'var(--t3)'}}>
                        {st.withData || '—'}
                      </td>
                      <td style={{padding:'8px 10px', textAlign:'right', fontWeight:700, color: st.totalSales ? '#86efac' : 'var(--t3)'}}>
                        {st.totalSales ? fmtIN(st.totalSales) : '—'}
                      </td>
                      <td style={{padding:'8px 10px', textAlign:'right', fontWeight:700, color: st.totalTarget ? '#22d3ee' : 'var(--t3)'}}>
                        {st.totalTarget ? fmtIN(st.totalTarget) : '—'}
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        {achPct !== null ? (
                          <div style={{display:'flex', alignItems:'center', gap:6, minWidth:110}}>
                            <div style={{flex:1, height:5, background:'var(--b1)', borderRadius:3, overflow:'hidden'}}>
                              <div style={{
                                height:'100%',
                                width: Math.min(achPct, 100) + '%',
                                background: achPct >= 100 ? '#22c55e' : achPct >= 70 ? '#fbbf24' : '#f87171',
                              }}/>
                            </div>
                            <span style={{fontSize:11, fontWeight:700, color: achPct >= 100 ? '#86efac' : achPct >= 70 ? '#fbbf24' : '#fca5a5'}}>
                              {achPct}%
                            </span>
                          </div>
                        ) : <span style={{color:'var(--t3)'}}>—</span>}
                      </td>
                      <td style={{padding:'8px 10px', fontSize:11, color:'var(--t2)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                        {st.salesmen && st.salesmen.length
                          ? st.salesmen.map(sm => users[sm]?.name || sm).join(', ')
                          : <span style={{color:'var(--t3)'}}>—</span>}
                      </td>
                      <td style={{padding:'6px 10px', whiteSpace:'nowrap'}}>
                        <div style={{display:'flex', gap:4, alignItems:'center', flexWrap:'wrap'}}>
                          <button onClick={() => beginUpload(m)} disabled={busy} title="Upload Excel for this month"
                            style={{
                              display:'flex', alignItems:'center', gap:3,
                              background:'rgba(34,197,94,0.12)', color:'#86efac',
                              border:'1px solid #15803d', borderRadius:5,
                              padding:'4px 8px', fontSize:10, fontWeight:700, cursor:'pointer',
                            }}>
                            <Upload size={11}/>Upload
                          </button>
                          <button onClick={() => downloadTemplate(m)} title="Download Excel template"
                            style={{
                              display:'flex', alignItems:'center', gap:3,
                              background:'transparent', color:'var(--t2)',
                              border:'1px solid var(--b1)', borderRadius:5,
                              padding:'4px 7px', fontSize:10, fontWeight:600, cursor:'pointer',
                            }}>
                            <Download size={11}/>
                          </button>
                          {!isCurrent && (
                            <button onClick={() => handleSetCurrent(i)} disabled={busy} title="Set as current month"
                              style={{
                                display:'flex', alignItems:'center', gap:3,
                                background:'transparent', color:'#22d3ee',
                                border:'1px solid #0e7490', borderRadius:5,
                                padding:'4px 7px', fontSize:10, fontWeight:600, cursor:'pointer',
                              }}>
                              <Check size={11}/>
                            </button>
                          )}
                          <button onClick={() => handleRemoveMonth(m)} disabled={busy} title="Remove this month from the active list (does not delete data)"
                            style={{
                              display:'flex', alignItems:'center', gap:3,
                              background:'transparent', color:'#f87171',
                              border:'1px solid #7f1d1d', borderRadius:5,
                              padding:'4px 7px', fontSize:10, fontWeight:600, cursor:'pointer',
                            }}>
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Salesman Diagnostic ──────────────────────────────────────────── */}
      <div className="card" style={{padding:0, overflow:'hidden', marginTop:14}}>
        <div style={{
          padding:'10px 14px', background:'var(--bg2)',
          borderBottom:'1px solid var(--b1)',
          display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
        }}>
          <UsersIcon size={14} color="#6366f1"/>
          <span style={{fontSize:13, fontWeight:700, color:'var(--t1)'}}>Salesman Diagnostic</span>
          <span style={{fontSize:11, color:'var(--t3)'}}>— compare DB numbers against your Google Sheet</span>
          <div style={{flex:1}}/>
          <label style={{fontSize:11, color:'var(--t3)'}}>Month:</label>
          <select value={diagMonth} onChange={e => setDiagMonth(e.target.value)}
            style={{
              background:'var(--bg1)', color:'var(--t1)', border:'1px solid var(--b1)',
              borderRadius:6, padding:'4px 8px', fontSize:11, fontWeight:600,
            }}>
            {[...MO].reverse().map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div style={{padding:'4px 0'}}>
          {salesmanList.length === 0 ? (
            <div style={{padding:20, textAlign:'center', color:'var(--t3)', fontSize:12}}>
              No salesmen found. Add salesman users via Admin Panel → User Management.
            </div>
          ) : salesmanList.map(sm => {
            const ms = sm.byMonth[diagMonth] || {ach:0, tgt:0, withData:0};
            const isOpen = diagOpenSm === sm.id;
            const achPct = ms.tgt ? Math.round((ms.ach / ms.tgt) * 100) : null;
            return (
              <div key={sm.id} style={{borderBottom:'1px solid var(--b1)'}}>
                <div onClick={() => setDiagOpenSm(o => o === sm.id ? null : sm.id)}
                  style={{
                    padding:'10px 14px', cursor:'pointer',
                    display:'flex', alignItems:'center', gap:10, flexWrap:'wrap',
                    background: isOpen ? 'rgba(99,102,241,0.06)' : 'transparent',
                    transition:'background .15s',
                  }}>
                  {isOpen ? <ChevronDown size={14} color="var(--t2)"/> : <ChevronRight size={14} color="var(--t2)"/>}
                  <div style={{
                    width:24, height:24, borderRadius:'50%',
                    background:'rgba(99,102,241,0.15)', color:'#a5b4fc',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:9, fontWeight:700,
                  }}>{(users[sm.id]?.ini) || sm.name.slice(0,2).toUpperCase()}</div>
                  <span style={{fontSize:13, fontWeight:700, color:'var(--t1)', minWidth:120}}>{sm.name}</span>
                  <span style={{fontSize:11, color:'var(--t3)'}}>{sm.dealers.length} dealers</span>
                  <div style={{flex:1}}/>
                  <span style={{fontSize:11, color:'var(--t3)'}}>{diagMonth}:</span>
                  <span style={{fontSize:11, color:'var(--t2)'}}>{ms.withData} active</span>
                  <span style={{fontSize:13, fontWeight:800, color: ms.ach > 0 ? '#86efac' : 'var(--t3)', minWidth:80, textAlign:'right'}}>{fmtIN(ms.ach)}</span>
                  <span style={{fontSize:11, color:'var(--t3)'}}>/</span>
                  <span style={{fontSize:11, fontWeight:700, color: ms.tgt > 0 ? '#22d3ee' : 'var(--t3)', minWidth:70, textAlign:'right'}}>{fmtIN(ms.tgt)}</span>
                  {achPct !== null && (
                    <span style={{
                      fontSize:11, fontWeight:700,
                      color: achPct >= 100 ? '#86efac' : achPct >= 70 ? '#fbbf24' : '#fca5a5',
                      minWidth:42, textAlign:'right',
                    }}>{achPct}%</span>
                  )}
                </div>

                {isOpen && (
                  <div style={{padding:'10px 14px 14px 50px', background:'var(--bg2)'}}>
                    {/* Source breakdown + Inspector button */}
                    <div style={{display:'flex', gap:14, marginBottom:10, fontSize:11, color:'var(--t3)', flexWrap:'wrap', alignItems:'center'}}>
                      <span><b style={{color:'#86efac'}}>{sm.sources.sheet}</b> from Sheets</span>
                      <span>·</span>
                      <span><b style={{color:'#a5b4fc'}}>{sm.sources.upload}</b> from Excel upload</span>
                      {sm.sources.other > 0 && <><span>·</span><span><b style={{color:'var(--t2)'}}>{sm.sources.other}</b> other</span></>}
                      <div style={{flex:1}}/>
                      <button onClick={() => openInspector(sm.id)}
                        style={{
                          background:'#6366f1', color:'#fff', border:'none',
                          padding:'4px 10px', borderRadius:5, fontSize:10, fontWeight:700,
                          cursor:'pointer', display:'flex', alignItems:'center', gap:4,
                        }}>
                        🔍 Inspect Sheet
                      </button>
                    </div>

                    {/* Month-by-month mini grid */}
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>
                        All Months
                      </div>
                      <div style={{
                        display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px, 1fr))', gap:6,
                      }}>
                        {MO.map(m => {
                          const v = sm.byMonth[m];
                          const isMS = m === diagMonth;
                          const hasD = (v?.ach || 0) > 0 || (v?.tgt || 0) > 0;
                          return (
                            <div key={m} onClick={() => setDiagMonth(m)}
                              style={{
                                background: isMS ? 'rgba(99,102,241,0.12)' : 'var(--bg1)',
                                border: '1px solid ' + (isMS ? '#6366f1' : 'var(--b1)'),
                                borderRadius:6, padding:'6px 8px', cursor:'pointer', textAlign:'center',
                                opacity: hasD ? 1 : 0.55,
                              }}>
                              <div style={{fontSize:10, color: isMS ? '#a5b4fc' : 'var(--t3)', fontWeight:700, marginBottom:2}}>{m}</div>
                              <div style={{fontSize:12, fontWeight:800, color: v?.ach ? '#86efac' : 'var(--t3)'}}>{v?.ach ? fmtIN(v.ach) : '—'}</div>
                              <div style={{fontSize:9, color: v?.tgt ? '#22d3ee' : 'var(--t3)'}}>tgt: {v?.tgt ? fmtIN(v.tgt) : '—'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top dealers for selected month */}
                    <div>
                      <div style={{fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>
                        Top dealers — {diagMonth}
                      </div>
                      {(() => {
                        const top = topDealersForSm(sm.id);
                        if(top.length === 0 || top.every(t => t.ach === 0)){
                          return <div style={{fontSize:11, color:'var(--t3)', padding:8}}>No sales data for this month.</div>;
                        }
                        return (
                          <div style={{
                            border:'1px solid var(--b1)', borderRadius:6, overflow:'hidden',
                            background:'var(--bg1)',
                          }}>
                            <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
                              <thead>
                                <tr style={{background:'var(--bg2)'}}>
                                  <th style={{textAlign:'left', padding:'5px 8px', fontSize:9, color:'var(--t3)', fontWeight:700, textTransform:'uppercase'}}>Dealer</th>
                                  <th style={{textAlign:'right', padding:'5px 8px', fontSize:9, color:'var(--t3)', fontWeight:700, textTransform:'uppercase'}}>Sales</th>
                                  <th style={{textAlign:'right', padding:'5px 8px', fontSize:9, color:'var(--t3)', fontWeight:700, textTransform:'uppercase'}}>Target</th>
                                  <th style={{textAlign:'right', padding:'5px 8px', fontSize:9, color:'var(--t3)', fontWeight:700, textTransform:'uppercase'}}>Ach%</th>
                                  <th style={{textAlign:'center', padding:'5px 8px', fontSize:9, color:'var(--t3)', fontWeight:700, textTransform:'uppercase'}}>Source</th>
                                </tr>
                              </thead>
                              <tbody>
                                {top.filter(t => t.ach > 0).map(t => {
                                  const p = t.tgt ? Math.round((t.ach / t.tgt) * 100) : null;
                                  return (
                                    <tr key={t.id} style={{borderTop:'1px solid var(--b1)'}}>
                                      <td style={{padding:'5px 8px', color:'var(--t1)', fontWeight:600, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{t.name}</td>
                                      <td style={{padding:'5px 8px', textAlign:'right', color:'#86efac', fontWeight:700}}>{fmtIN(t.ach)}</td>
                                      <td style={{padding:'5px 8px', textAlign:'right', color:t.tgt ? '#22d3ee' : 'var(--t3)'}}>{t.tgt ? fmtIN(t.tgt) : '—'}</td>
                                      <td style={{padding:'5px 8px', textAlign:'right', color: p===null ? 'var(--t3)' : p>=100 ? '#86efac' : p>=70 ? '#fbbf24' : '#fca5a5', fontWeight:700}}>{p===null ? '—' : p+'%'}</td>
                                      <td style={{padding:'5px 8px', textAlign:'center'}}>
                                        <span style={{
                                          fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:3,
                                          background: t.source === 'sheet' ? 'rgba(34,197,94,0.15)' : t.source === 'upload' ? 'rgba(99,102,241,0.15)' : 'var(--bg2)',
                                          color: t.source === 'sheet' ? '#86efac' : t.source === 'upload' ? '#a5b4fc' : 'var(--t3)',
                                        }}>{t.source}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {sm.dealers.length > 15 && (
                              <div style={{padding:'6px 8px', fontSize:10, color:'var(--t3)', background:'var(--bg2)', borderTop:'1px solid var(--b1)'}}>
                                Showing top 15 by sales · this salesman has {sm.dealers.length} total dealers
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{padding:'8px 14px', background:'var(--bg2)', fontSize:10, color:'var(--t3)', borderTop:'1px solid var(--b1)'}}>
          Tip: pick a month at the top right, then click each salesman to see their per-month breakdown and top dealers.
          Compare these numbers against your Google Sheet to spot where data is wrong.
        </div>
      </div>

      {/* ── Sheet Inspector modal ─────────────────────────────────────────── */}
      {inspectorSm && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center', padding:20,
        }}
          onClick={closeInspector}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background:'var(--bg1)', border:'1px solid var(--b1)',
            borderRadius:12, padding:0, width:'100%', maxWidth:'min(96vw, 1300px)',
            maxHeight:'92vh', overflow:'hidden', display:'flex', flexDirection:'column',
          }}>
            <div style={{
              padding:'14px 18px', background:'var(--bg2)',
              borderBottom:'1px solid var(--b1)',
              display:'flex', alignItems:'center', gap:10,
            }}>
              <span style={{fontSize:16}}>🔍</span>
              <span style={{fontSize:14, fontWeight:700, color:'var(--t1)', flex:1}}>
                Sheet Inspector — {users[inspectorSm]?.name || inspectorSm}
              </span>
              <button onClick={closeInspector} style={{background:'none', border:'1px solid var(--b1)', borderRadius:5, color:'var(--t2)', padding:'4px 10px', cursor:'pointer', fontSize:12}}>Close</button>
            </div>

            <div style={{padding:16, overflow:'auto', flex:1}}>
              {inspectorBusy && (
                <div style={{textAlign:'center', padding:30, color:'var(--t3)'}}>
                  <div style={{width:28, height:28, border:'3px solid var(--b1)', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 8px'}}/>
                  Fetching sheet…
                </div>
              )}

              {inspectorData?.error && (
                <div style={{padding:14, background:'rgba(248,113,113,0.10)', border:'1px solid #7f1d1d', borderRadius:7, color:'#fca5a5', fontSize:13}}>
                  {inspectorData.error}
                </div>
              )}

              {inspectorData && !inspectorData.error && (
                <>
                  <div style={{fontSize:12, color:'var(--t3)', marginBottom:10}}>
                    Header row found at line {inspectorData.headerRowIndex + 1} · {inspectorData.headers.length} columns · {inspectorData.totalParsed} dealers parsed
                  </div>

                  {/* Parser debug — what the parser SAW in this sheet */}
                  {(() => {
                    const dbg = (typeof window !== 'undefined' && window.__lastCSVDebug) ? window.__lastCSVDebug[inspectorSm] : null;
                    if(!dbg) return null;
                    return (
                      <div style={{marginBottom:14, padding:10, background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:7}}>
                        <div style={{fontSize:11, fontWeight:700, color:'#a5b4fc', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>
                          Parser debug — what was detected
                        </div>

                        {/* Label row cells */}
                        <div style={{fontSize:11, color:'var(--t2)', marginBottom:8}}>
                          <b>Label row (line {dbg.labelRowIdx + 1}) — month label cells:</b><br/>
                          {dbg.labelRowCells.length === 0
                            ? <span style={{color:'#fca5a5'}}>NONE FOUND — parser couldn't see any labels above the headers</span>
                            : dbg.labelRowCells.map((c, i) => (
                                <span key={i} style={{display:'inline-block', marginRight:8, padding:'1px 6px', background:'var(--bg1)', borderRadius:3, fontFamily:'monospace'}}>
                                  <b style={{color:'#fbbf24'}}>{c.colLetter}</b>="{c.value}"
                                </span>
                              ))}
                        </div>

                        {/* Detected sections */}
                        <div style={{fontSize:11, color:'var(--t2)'}}>
                          <b>Detected {dbg.sections.length} month sections:</b>
                          {dbg.sections.length === 0 && <span style={{color:'#fca5a5', marginLeft:8}}>NONE — parser dropped every section</span>}
                          <table style={{width:'100%', borderCollapse:'collapse', fontSize:11, marginTop:6, background:'var(--bg1)', borderRadius:6, overflow:'hidden'}}>
                            <thead>
                              <tr style={{background:'var(--bg2)'}}>
                                <th style={{padding:'4px 8px', textAlign:'left', color:'var(--t3)', fontSize:10, fontWeight:700, textTransform:'uppercase'}}>Label</th>
                                <th style={{padding:'4px 8px', textAlign:'left', color:'var(--t3)', fontSize:10, fontWeight:700, textTransform:'uppercase'}}>→ Maps to</th>
                                <th style={{padding:'4px 8px', textAlign:'center', color:'var(--t3)', fontSize:10, fontWeight:700, textTransform:'uppercase'}}>Target Col</th>
                                <th style={{padding:'4px 8px', textAlign:'center', color:'var(--t3)', fontSize:10, fontWeight:700, textTransform:'uppercase'}}>Achieved Col</th>
                                <th style={{padding:'4px 8px', textAlign:'left', color:'var(--t3)', fontSize:10, fontWeight:700, textTransform:'uppercase'}}>Achieved Header</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dbg.sections.map((s, i) => (
                                <tr key={i} style={{borderTop:'1px solid var(--b1)'}}>
                                  <td style={{padding:'4px 8px', color:'var(--t1)', fontWeight:700}}>{s.label || '(none)'}</td>
                                  <td style={{padding:'4px 8px', color: s.moIdx >= 0 ? '#86efac' : '#fca5a5', fontWeight:600}}>{s.monthLabel}</td>
                                  <td style={{padding:'4px 8px', textAlign:'center', fontFamily:'monospace', color:'#fbbf24', fontWeight:700}}>{s.targetColLetter}</td>
                                  <td style={{padding:'4px 8px', textAlign:'center', fontFamily:'monospace', color:'#86efac', fontWeight:700}}>{s.achColLetter}</td>
                                  <td style={{padding:'4px 8px', color:'var(--t2)', fontSize:10}}>{s.achHdr}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Label ranges */}
                        {dbg.labelRanges.length > 0 && (
                          <div style={{fontSize:11, color:'var(--t3)', marginTop:8}}>
                            <b>Label ranges:</b> {dbg.labelRanges.map(r => `${r.startCol}-${r.endCol}="${r.label}"`).join(' · ')}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Header row with column letters */}
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>
                      Raw Header Row (column letter · header text)
                    </div>
                    <div style={{
                      display:'grid', gap:4,
                      gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))',
                      maxHeight:200, overflowY:'auto', padding:6,
                      background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:6,
                    }}>
                      {inspectorData.headers.map((h, i) => {
                        const lh = h.toLowerCase();
                        const isTarget = lh === 'target' || lh === 'tgt' || (lh.includes('target') && !['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].some(m => lh.includes(m)));
                        const isAchieved = lh.includes('achiev') || lh.includes('ach');
                        const isName = lh.includes('dealer') || lh === 'name';
                        const isCity = lh.includes('city');
                        const isState = lh.includes('state');
                        let color = 'var(--t2)';
                        if(isTarget)        color = '#fbbf24';
                        else if(isAchieved) color = '#86efac';
                        else if(isName)     color = '#a5b4fc';
                        else if(isCity || isState) color = '#22d3ee';
                        return (
                          <div key={i} style={{
                            padding:'5px 8px', background:'var(--bg1)', borderRadius:4,
                            border:'1px solid var(--b1)', fontSize:11,
                          }}>
                            <span style={{
                              fontWeight:800, color: i === 3 ? '#fbbf24' : '#6366f1',
                              marginRight:6, background: i === 3 ? 'rgba(251,191,36,0.15)' : 'transparent',
                              padding:'1px 5px', borderRadius:3,
                            }}>{colLetter(i)}</span>
                            <span style={{color, fontWeight: i === 3 ? 700 : 500}}>{h || <i style={{color:'var(--t3)'}}>(empty)</i>}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{fontSize:10, color:'var(--t3)', marginTop:6}}>
                      <b style={{color:'#fbbf24'}}>Yellow</b> = parser thinks this is Target. <b style={{color:'#86efac'}}>Green</b> = Achieved. <b style={{color:'#a5b4fc'}}>Lavender</b> = Dealer name. <b style={{color:'#22d3ee'}}>Cyan</b> = City/State. <b style={{color:'#fbbf24'}}>Column D</b> is highlighted yellow as the configured Target column.
                    </div>
                  </div>

                  {/* First 3-4 raw data rows */}
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>
                      First {inspectorData.dataRows.length} raw data rows from your sheet
                    </div>
                    <div style={{overflowX:'auto', border:'1px solid var(--b1)', borderRadius:6}}>
                      <table style={{borderCollapse:'collapse', fontSize:10, width:'100%'}}>
                        <thead>
                          <tr style={{background:'var(--bg2)'}}>
                            <th style={{padding:'5px 8px', color:'#6366f1', fontWeight:800, position:'sticky', left:0, background:'var(--bg2)', borderRight:'1px solid var(--b1)'}}>#</th>
                            {inspectorData.headers.map((h, i) => (
                              <th key={i} style={{padding:'5px 8px', color: i === 3 ? '#fbbf24' : '#6366f1', fontWeight:800, whiteSpace:'nowrap', borderBottom:'1px solid var(--b1)', background: i === 3 ? 'rgba(251,191,36,0.10)' : 'transparent'}}>
                                {colLetter(i)}
                              </th>
                            ))}
                          </tr>
                          <tr style={{background:'var(--bg2)'}}>
                            <th style={{padding:'3px 8px', color:'var(--t3)', fontSize:9, position:'sticky', left:0, background:'var(--bg2)'}}></th>
                            {inspectorData.headers.map((h, i) => (
                              <th key={i} style={{padding:'3px 8px', color:'var(--t3)', fontSize:9, fontWeight:500, whiteSpace:'nowrap', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', background: i === 3 ? 'rgba(251,191,36,0.08)' : 'transparent'}}>
                                {h || '(empty)'}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {inspectorData.dataRows.map((row, ri) => (
                            <tr key={ri} style={{borderTop:'1px solid var(--b1)'}}>
                              <td style={{padding:'4px 8px', color:'var(--t3)', position:'sticky', left:0, background:'var(--bg1)', borderRight:'1px solid var(--b1)'}}>{ri + 1}</td>
                              {row.map((cell, ci) => (
                                <td key={ci} style={{
                                  padding:'4px 8px', whiteSpace:'nowrap', maxWidth:140,
                                  overflow:'hidden', textOverflow:'ellipsis',
                                  color: ci === 3 ? '#fbbf24' : 'var(--t1)',
                                  background: ci === 3 ? 'rgba(251,191,36,0.05)' : 'transparent',
                                  fontWeight: ci === 3 ? 700 : 400,
                                }}>{cell || <span style={{color:'var(--t3)'}}>—</span>}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Parsed result for first 3 dealers */}
                  <div>
                    <div style={{fontSize:10, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>
                      How the parser interpreted the first 3 dealers
                    </div>
                    <div style={{border:'1px solid var(--b1)', borderRadius:6, overflow:'hidden'}}>
                      <table style={{width:'100%', borderCollapse:'collapse', fontSize:11}}>
                        <thead>
                          <tr style={{background:'var(--bg2)'}}>
                            {['Name','City','State','Zone','Status','Target','Current Ach','months[] array','monthTargets'].map(h => (
                              <th key={h} style={{padding:'5px 8px', textAlign:'left', color:'var(--t3)', fontSize:9, fontWeight:700, textTransform:'uppercase', borderBottom:'1px solid var(--b1)'}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {inspectorData.parsedFirst.map((d, i) => (
                            <tr key={i} style={{borderTop:'1px solid var(--b1)'}}>
                              <td style={{padding:'5px 8px', color:'var(--t1)', fontWeight:700, maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</td>
                              <td style={{padding:'5px 8px', color:'var(--t2)'}}>{d.city || '—'}</td>
                              <td style={{padding:'5px 8px', color:'var(--t2)'}}>{d.state || '—'}</td>
                              <td style={{padding:'5px 8px', color:'var(--t2)'}}>{d.zone || '—'}</td>
                              <td style={{padding:'5px 8px', color:'var(--t2)'}}>{d.status || '—'}</td>
                              <td style={{padding:'5px 8px', color:'#fbbf24', fontWeight:700}}>{d.target || '0'}</td>
                              <td style={{padding:'5px 8px', color:'#86efac', fontWeight:700}}>{d.achieved || '0'}</td>
                              <td style={{padding:'5px 8px', color:'var(--t3)', fontSize:10, fontFamily:'monospace'}}>[{(d.months || []).join(', ')}]</td>
                              <td style={{padding:'5px 8px', color:'var(--t3)', fontSize:10, fontFamily:'monospace'}}>{JSON.stringify(d.monthTargets || {})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{marginTop:14, padding:10, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:6, fontSize:11, color:'var(--t2)'}}>
                    <b style={{color:'#a5b4fc'}}>How to read this:</b> Each row above shows what the parser pulled out for one dealer.
                    The yellow <b>Target</b> column shows what it read from column D. Compare it against the same dealer's Target in the raw rows above.
                    If the numbers don't match, tell me which column actually has the target — I'll fix the parser.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Upload-for picker (shows when an upload starts and admin must pick salesman) ── */}
      {uploadFor && isAdmin && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:9999,
          display:'flex', alignItems:'center', justifyContent:'center', padding:14,
        }}
          onClick={() => setUploadFor(null)}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background:'var(--bg1)', border:'1px solid var(--b1)',
            borderRadius:12, padding:18, width:'100%', maxWidth:380,
          }}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
              <Upload size={16} color="#22c55e"/>
              <span style={{fontSize:14, fontWeight:700, color:'var(--t1)', flex:1}}>Upload for {uploadFor}</span>
              <button onClick={() => setUploadFor(null)} style={{background:'none', border:'none', color:'var(--t3)', cursor:'pointer'}}>
                <X size={14}/>
              </button>
            </div>
            <div style={{fontSize:11, color:'var(--t3)', marginBottom:6}}>Upload for which salesman?</div>
            <select
              value={uploadSm}
              onChange={e => setUploadSm(e.target.value)}
              style={{
                width:'100%', padding:'8px 10px',
                background:'var(--bg2)', color:'var(--t1)',
                border:'1px solid var(--b1)', borderRadius:6,
                fontSize:13, marginBottom:12,
              }}>
              {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {!salesmen.length && <option value="">No salesmen found</option>}
            </select>
            <button onClick={() => fileRef.current?.click()} disabled={busy}
              style={{
                width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'#22c55e', color:'#0c0c1e', border:'none',
                padding:'10px', borderRadius:6, fontSize:13, fontWeight:700,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}>
              <Upload size={14}/> Choose Excel / CSV file
            </button>
            <div style={{fontSize:10, color:'var(--t3)', marginTop:8, textAlign:'center'}}>
              Existing dealers in this month will be updated. New dealers will be added.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
