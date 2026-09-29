import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar, Plus, Check, Upload, RefreshCw, Trash2, AlertCircle,
  CheckCircle, Database, ChevronRight, Edit3, Download, X,
  Users as UsersIcon, ChevronDown, Search,
} from 'lucide-react';
import { api } from '../api';
import { monthTarget, fetchCSV, parseRow, parseCSV } from '../utils';
import { notify, confirmDialog } from './Toast';
import { SHEET_SYNC_ENABLED } from '../featureFlags';
import { PageHead, Tile } from '../collections/ui';
import { IMPORT_CSS, ImportStepper, DropZone, ResultCard } from './ErpDailyUpload';

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
    // Admins are not in the salesman list, so defaulting to their own id left
    // the select showing the first salesman while dealers went to the admin.
    // The file is picked from the dialog once the salesman has been chosen.
    setUploadSm(isAdmin ? (salesmen[0]?.id || '') : (currentUser?.id || ''));
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
    import('../lib/saveFile').then(({ saveText }) => saveText(csv, `Upload_${m}.csv`, 'text/csv;charset=utf-8'));
  };

  if(!isAdmin){
    return (
      <div className="fade" style={{padding:24, textAlign:'center', color:'var(--t2)'}}>
        <AlertCircle size={28} style={{margin:'0 auto 8px', color:'var(--t3)'}}/>
        <div style={{fontSize:14}}>This page is for admins only.</div>
      </div>
    );
  }

  const iniOf = s => ((String(s || '?')).replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || '?').toUpperCase();
  const hueOf = s => String(s || '?').charCodeAt(0) * 37 % 360;
  const achTone = p => p >= 100 ? 'var(--grn)' : p >= 70 ? 'var(--yel)' : 'var(--red)';
  const toolBtn = { display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:12, fontWeight:700, whiteSpace:'nowrap' };

  return (
    <div className="fade mm-page" style={{padding:0}}>
      <style>{IMPORT_CSS + MM_CSS}</style>
      {/* Hidden file input — reused for any month */}
      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
        style={{display:'none'}} onChange={handleFile}/>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <PageHead icon={Calendar} tone="var(--acc)" eyebrow="Admin · Data Management" title="Manage Months"
        sub="One place to add, upload, and organize month-wise data. Removing a month here never deletes data — it only hides it from the dashboard."/>

      {/* ── Status banner ────────────────────────────────────────────────── */}
      {msg && (
        <ResultCard kind={msg.type === 'success' ? 'ok' : 'err'} style={{marginBottom:12}}
          title={msg.type === 'success' ? 'Done' : 'Something went wrong'} onClose={() => setMsg(null)}>
          {msg.text}
        </ResultCard>
      )}

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="mm-tiles">
        <Tile icon={Calendar}    label="Total months"     value={MO.length}             tone="var(--acc)"/>
        <Tile icon={Database}    label="Months with data" value={filledMonths}          tone="var(--grn)"/>
        <Tile icon={AlertCircle} label="Blank months"     value={blankMonths}           tone="var(--yel)"/>
        <Tile icon={Check}       label="Current month"    value={MO[currentIdx] || '—'} tone="var(--pur)"/>
      </div>

      {/* ── DANGER ZONE: Start Fresh — SUPERADMIN ONLY ─────────────────── */}
      {isSuperAdmin && (
        <div className="card" style={{
          padding:14, marginBottom:14,
          background:'color-mix(in srgb, var(--red) 6%, var(--bg1))', border:'1px solid color-mix(in srgb, var(--red) 30%, transparent)',
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
            <div style={{flex:1, minWidth:200}}>
              <div className="sec-title" style={{marginBottom:6}}>
                <span className="sec-ico" style={{'--tone':'var(--red)'}}><AlertCircle size={15}/></span>
                Start Fresh — Wipe all dealer data
                <span className="mm-pill" style={{'--tone':'var(--yel)'}}>SUPERADMIN ONLY</span>
              </div>
              <div style={{fontSize:11.5, color:'var(--t3)', lineHeight:1.5}}>
                Deletes every dealer record from MongoDB. After wiping you'll have a clean DB. You can re-populate it by clicking <b>Sync now</b> (re-loads from Google Sheets) or by uploading Excel files via <b>Monthly Entry</b>. Once data is in DB, refreshes and uploads will work cleanly.
              </div>
            </div>
            <button onClick={handleWipeAll} disabled={busy} className="btnd" style={{...toolBtn, padding:'8px 14px'}}>
              <Trash2 size={14}/>
              Wipe All Data
            </button>
          </div>
        </div>
      )}

      {/* ── Add month + Sync row ────────────────────────────────────────── */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap:12, marginBottom:14}}>
        <div className="card" style={{padding:16}}>
          <div className="sec-title">
            <span className="sec-ico" style={{'--tone':'var(--grn)'}}><Plus size={15}/></span> Add a new month
          </div>
          <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
            <input
              type="text"
              className="inp"
              placeholder={suggestedNext ? `e.g. ${suggestedNext}` : 'e.g. Jun-26'}
              value={newMonth}
              onChange={e => setNewMonth(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddMonth()}
              disabled={busy}
              style={{flex:'1 1 160px', width:'auto', fontSize:13, fontWeight:700}}
            />
            <button onClick={handleAddMonth} disabled={busy} className="btnp" style={toolBtn}>
              <Plus size={14}/> Add Month
            </button>
          </div>
          {suggestedNext && !newMonth && (
            <button onClick={() => setNewMonth(suggestedNext)} disabled={busy}
              className="thr" style={{'--tone':'var(--acc)', marginTop:10}}>
              Use next: {suggestedNext}
            </button>
          )}
          <div style={{fontSize:11.5, color:'var(--t3)', marginTop:10}}>
            Format examples: <b>Jun-26</b>, <b>Jul-26</b>, <b>Jan-27</b>. New month starts blank — upload Excel below.
          </div>
        </div>

        <div className="card" style={{padding:16, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
          <div>
            <div className="sec-title">
              <span className="sec-ico" style={{'--tone':'var(--acc)'}}><Database size={15}/></span> Data sources
              {lastSync ? <span className="kpi-pill">Last sync <b>{lastSync}</b></span> : null}
            </div>
            <div style={{fontSize:11.5, color:'var(--t3)', marginBottom:12, lineHeight:1.5}}>
              <b style={{color:'var(--grn)'}}>Reload from DB</b> = safe refresh, never touches Sheets.
              <b style={{color:'var(--acc)'}}> Sync now</b> = pull from Google Sheets (preserves uploaded months).
            </div>
          </div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <button onClick={handleReloadDB} disabled={busy}
              title="Re-fetch all dealer data from MongoDB. Safe — only reads, never writes."
              className="btnp" style={{...toolBtn, flex:'1 1 130px'}}>
              <RefreshCw size={14}/>
              Reload from DB
            </button>
            {SHEET_SYNC_ENABLED && <button onClick={handleSync} disabled={busy || syncing}
              title="Pull latest from Google Sheets. Months not in the sheet (e.g. June) are preserved."
              className="btne" style={{...toolBtn, flex:'1 1 130px', padding:'7px 12px'}}>
              <RefreshCw size={14} className={syncing ? 'spin' : ''}/>
              {syncing ? 'Syncing…' : 'Sync from Sheets'}
            </button>}
          </div>
          <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:8}}>
            <button onClick={handleRepairTargets} disabled={busy}
              title="Back-fill per-month targets from each dealer's baseline target. Run once after a sync if targets look wrong."
              className="btn" style={{...toolBtn, fontSize:11.5, color:'var(--yel)', borderColor:'color-mix(in srgb, var(--yel) 40%, transparent)'}}>
              <CheckCircle size={13}/>
              Repair Targets
            </button>
            <button onClick={handleDedupe} disabled={busy}
              title="Find dealers stored twice under the same salesman (e.g. from old syncs with name variations) and merge them. Fixes inflated totals."
              className="btnd" style={{...toolBtn, fontSize:11.5}}>
              <Trash2 size={13}/>
              Find Duplicates
            </button>
            <button onClick={handleNormalizeCityState} disabled={busy}
              title="Re-write every dealer's City and State in uniform Title Case (e.g. BANGALORE → Bangalore). Run this once to clean up messy capitalizations from imports."
              className="btn" style={{...toolBtn, fontSize:11.5, color:'var(--acc)'}}>
              <CheckCircle size={13}/>
              Normalize City / State
            </button>
          </div>
        </div>
      </div>

      {/* ── Month cards ──────────────────────────────────────────────────── */}
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div className="sec-title" style={{padding:'12px 14px', borderBottom:'1px solid var(--b1)', marginBottom:0}}>
          <span className="sec-ico" style={{'--tone':'var(--acc)'}}><Calendar size={15}/></span>
          <span>All months</span>
          <span className="count-pill">{MO.length}</span>
          <span className="sec-note">oldest to newest</span>
          <div style={{flex:1}}/>
          <span className="mm-pill" style={{'--tone':'var(--acc)'}}>Current</span>
          <span className="mm-pill" style={{'--tone':'var(--grn)'}}>Has data</span>
          <span className="mm-pill blank">Blank</span>
        </div>

        {MO.length === 0 ? (
          <div style={{padding:36, textAlign:'center', color:'var(--t3)', fontSize:13}}>
            <Calendar size={26} style={{display:'block', margin:'0 auto 8px', opacity:.6}}/>
            No months yet. Add one above to begin.
          </div>
        ) : (
          <div className="mm-grid">
            {MO.map((m, i) => {
              const st = monthStats[m] || {};
              const isCurrent = i === currentIdx;
              const achPct = st.totalTarget ? Math.round((st.totalSales / st.totalTarget) * 100) : null;
              const tone = isCurrent ? 'var(--acc)' : st.hasData ? 'var(--grn)' : 'var(--t3)';
              const smNames = (st.salesmen || []).map(sm => users[sm]?.name || sm);
              return (
                <div key={m} className={'mm-card' + (isCurrent ? ' cur' : '') + (st.hasData ? '' : ' blank')} style={{'--tone':tone}}>
                  <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
                    <span className="mm-idx">{i+1}</span>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:17, fontWeight:850, color:'var(--t1)', lineHeight:1.1}}>{m}</div>
                      <div style={{display:'flex', gap:5, flexWrap:'wrap', marginTop:5}}>
                        {isCurrent && <span className="mm-pill" style={{'--tone':'var(--acc)'}}>Current</span>}
                        {st.hasData
                          ? <span className="mm-pill" style={{'--tone':'var(--grn)'}}>Has data</span>
                          : <span className="mm-pill blank">Blank</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:6, marginBottom:10}}>
                    <div className="mm-kv"><span>Dealers</span><b style={{color: st.withData ? 'var(--t1)' : 'var(--t3)'}}>{st.withData || '—'}</b></div>
                    <div className="mm-kv"><span>Sales (V)</span><b style={{color: st.totalSales ? 'var(--grn)' : 'var(--t3)'}}>{st.totalSales ? fmtIN(st.totalSales) : '—'}</b></div>
                    <div className="mm-kv"><span>Target</span><b style={{color: st.totalTarget ? 'var(--acc)' : 'var(--t3)'}}>{st.totalTarget ? fmtIN(st.totalTarget) : '—'}</b></div>
                  </div>

                  <div style={{marginBottom:10}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:10.5, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4}}>
                      <span>Achievement</span>
                      <span style={{color: achPct !== null ? achTone(achPct) : 'var(--t3)', fontSize:12}}>{achPct !== null ? achPct + '%' : '—'}</span>
                    </div>
                    <div className="pbar"><div style={{width: (achPct !== null ? Math.min(achPct, 100) : 0) + '%', background: achPct !== null ? achTone(achPct) : 'var(--b2)'}}/></div>
                  </div>

                  <div style={{display:'flex', alignItems:'center', gap:8, minHeight:28, marginBottom:12}} title={smNames.join(', ')}>
                    {smNames.length ? (
                      <>
                        <div className="mm-stack">
                          {smNames.slice(0, 4).map((nm, k) => (
                            <span key={k} className="ini" style={{'--h':hueOf(nm), width:24, height:24, fontSize:9, borderRadius:8}}>{iniOf(nm)}</span>
                          ))}
                        </div>
                        <span style={{fontSize:11.5, color:'var(--t2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0}}>
                          {smNames.length > 4 ? `+${smNames.length - 4} more · ` : ''}{smNames.length} salesm{smNames.length === 1 ? 'an' : 'en'}
                        </span>
                      </>
                    ) : <span style={{fontSize:11.5, color:'var(--t3)'}}>No salesmen yet</span>}
                  </div>

                  <div style={{display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', marginTop:'auto'}}>
                    <button onClick={() => beginUpload(m)} disabled={busy} title="Upload Excel for this month"
                      className="btne" style={{...toolBtn, flex:'1 1 auto', padding:'6px 10px'}}>
                      <Upload size={13}/>Upload
                    </button>
                    <button onClick={() => downloadTemplate(m)} title="Download Excel template"
                      className="btn mm-ic">
                      <Download size={13}/>
                    </button>
                    {!isCurrent && (
                      <button onClick={() => handleSetCurrent(i)} disabled={busy} title="Set as current month"
                        className="btn mm-ic" style={{color:'var(--acc)'}}>
                        <Check size={13}/>
                      </button>
                    )}
                    <button onClick={() => handleRemoveMonth(m)} disabled={busy} title="Remove this month from the active list (does not delete data)"
                      className="btnd mm-ic">
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Salesman Diagnostic ──────────────────────────────────────────── */}
      <div className="card" style={{padding:0, overflow:'hidden', marginTop:14}}>
        <div className="sec-title" style={{padding:'12px 14px', borderBottom:'1px solid var(--b1)', marginBottom:0}}>
          <span className="sec-ico" style={{'--tone':'var(--pur)'}}><UsersIcon size={15}/></span>
          <span>Salesman Diagnostic</span>
          <span className="sec-note">compare DB numbers against your Google Sheet</span>
          <div style={{flex:1}}/>
          <label style={{fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em'}}>Month</label>
          <select className="sel" value={diagMonth} onChange={e => setDiagMonth(e.target.value)}
            style={{fontSize:12, fontWeight:700, padding:'5px 10px'}}>
            {[...MO].reverse().map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          {salesmanList.length === 0 ? (
            <div style={{padding:24, textAlign:'center', color:'var(--t3)', fontSize:12}}>
              No salesmen found. Add salesman users via Admin Panel → User Management.
            </div>
          ) : salesmanList.map(sm => {
            const ms = sm.byMonth[diagMonth] || {ach:0, tgt:0, withData:0};
            const isOpen = diagOpenSm === sm.id;
            const achPct = ms.tgt ? Math.round((ms.ach / ms.tgt) * 100) : null;
            return (
              <div key={sm.id} style={{borderBottom:'1px solid var(--b1)'}}>
                <div onClick={() => setDiagOpenSm(o => o === sm.id ? null : sm.id)} className="mm-row"
                  style={{background: isOpen ? 'color-mix(in srgb, var(--acc) 6%, transparent)' : undefined}}>
                  {isOpen ? <ChevronDown size={14} color="var(--t2)"/> : <ChevronRight size={14} color="var(--t2)"/>}
                  <span className="ini" style={{'--h':hueOf(sm.name)}}>{(users[sm.id]?.ini) || sm.name.slice(0,2).toUpperCase()}</span>
                  <div style={{minWidth:0, flex:'1 1 140px'}}>
                    <div style={{fontSize:13, fontWeight:700, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{sm.name}</div>
                    <div style={{fontSize:10.5, color:'var(--t3)'}}>{sm.dealers.length} dealers · {ms.withData} active in {diagMonth}</div>
                  </div>
                  <div style={{textAlign:'right', minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:800, fontVariantNumeric:'tabular-nums'}}>
                      <span style={{color: ms.ach > 0 ? 'var(--grn)' : 'var(--t3)'}}>{fmtIN(ms.ach)}</span>
                      <span style={{color:'var(--t3)', fontWeight:500}}> / </span>
                      <span style={{fontSize:11.5, color: ms.tgt > 0 ? 'var(--acc)' : 'var(--t3)'}}>{fmtIN(ms.tgt)}</span>
                    </div>
                    {achPct !== null && <div className="pbar" style={{width:110, marginLeft:'auto', marginTop:4}}><div style={{width:Math.min(achPct,100)+'%', background:achTone(achPct)}}/></div>}
                  </div>
                  {achPct !== null && (
                    <span className="mm-pill" style={{'--tone':achTone(achPct), minWidth:46, justifyContent:'center'}}>{achPct}%</span>
                  )}
                </div>

                {isOpen && (
                  <div className="mm-open">
                    {/* Source breakdown + Inspector button */}
                    <div style={{display:'flex', gap:8, marginBottom:12, fontSize:11.5, color:'var(--t3)', flexWrap:'wrap', alignItems:'center'}}>
                      <span className="kpi-pill">From Sheets <b style={{color:'var(--grn)'}}>{sm.sources.sheet}</b></span>
                      <span className="kpi-pill">From Excel upload <b style={{color:'var(--acc)'}}>{sm.sources.upload}</b></span>
                      {sm.sources.other > 0 && <span className="kpi-pill">Other <b style={{color:'var(--t2)'}}>{sm.sources.other}</b></span>}
                      <div style={{flex:1}}/>
                      <button onClick={() => openInspector(sm.id)} className="btne" style={{...toolBtn, padding:'5px 11px'}}>
                        <Search size={13}/> Inspect Sheet
                      </button>
                    </div>

                    {/* Month-by-month mini grid */}
                    <div style={{marginBottom:12}}>
                      <div className="mm-sub">All Months</div>
                      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(104px, 1fr))', gap:6}}>
                        {MO.map(m => {
                          const v = sm.byMonth[m];
                          const isMS = m === diagMonth;
                          const hasD = (v?.ach || 0) > 0 || (v?.tgt || 0) > 0;
                          return (
                            <div key={m} onClick={() => setDiagMonth(m)} className="mm-mini"
                              style={{
                                background: isMS ? 'color-mix(in srgb, var(--acc) 12%, var(--bg1))' : 'var(--bg1)',
                                borderColor: isMS ? 'var(--acc)' : 'var(--b1)',
                                opacity: hasD ? 1 : 0.55,
                              }}>
                              <div style={{fontSize:10.5, color: isMS ? 'var(--acc)' : 'var(--t3)', fontWeight:800, marginBottom:2}}>{m}</div>
                              <div style={{fontSize:12.5, fontWeight:800, color: v?.ach ? 'var(--grn)' : 'var(--t3)'}}>{v?.ach ? fmtIN(v.ach) : '—'}</div>
                              <div style={{fontSize:9.5, color: v?.tgt ? 'var(--acc)' : 'var(--t3)'}}>tgt: {v?.tgt ? fmtIN(v.tgt) : '—'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top dealers for selected month */}
                    <div>
                      <div className="mm-sub">Top dealers — {diagMonth}</div>
                      {(() => {
                        const top = topDealersForSm(sm.id);
                        if(top.length === 0 || top.every(t => t.ach === 0)){
                          return <div style={{fontSize:11.5, color:'var(--t3)', padding:8}}>No sales data for this month.</div>;
                        }
                        return (
                          <div style={{border:'1px solid var(--b1)', borderRadius:12, overflow:'auto', background:'var(--bg1)'}}>
                            <table className="imp-tbl" style={{fontSize:11.5}}>
                              <thead>
                                <tr>
                                  <th style={{textAlign:'left'}}>Dealer</th>
                                  <th style={{textAlign:'right'}}>Sales</th>
                                  <th style={{textAlign:'right'}}>Target</th>
                                  <th style={{textAlign:'right'}}>Ach%</th>
                                  <th style={{textAlign:'center'}}>Source</th>
                                </tr>
                              </thead>
                              <tbody>
                                {top.filter(t => t.ach > 0).map(t => {
                                  const p = t.tgt ? Math.round((t.ach / t.tgt) * 100) : null;
                                  return (
                                    <tr key={t.id}>
                                      <td style={{maxWidth:220}}>
                                        <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0}}>
                                          <span className="ini" style={{'--h':hueOf(t.name), width:24, height:24, fontSize:9, borderRadius:8}}>{iniOf(t.name)}</span>
                                          <span style={{color:'var(--t1)', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis'}}>{t.name}</span>
                                        </div>
                                      </td>
                                      <td style={{textAlign:'right', color:'var(--grn)', fontWeight:700}}>{fmtIN(t.ach)}</td>
                                      <td style={{textAlign:'right', color:t.tgt ? 'var(--acc)' : 'var(--t3)'}}>{t.tgt ? fmtIN(t.tgt) : '—'}</td>
                                      <td style={{textAlign:'right', color: p===null ? 'var(--t3)' : achTone(p), fontWeight:800}}>{p===null ? '—' : p+'%'}</td>
                                      <td style={{textAlign:'center'}}>
                                        <span className={'mm-pill' + (t.source === 'sheet' || t.source === 'upload' ? '' : ' blank')}
                                          style={{'--tone': t.source === 'sheet' ? 'var(--grn)' : 'var(--acc)'}}>{t.source}</span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            {sm.dealers.length > 15 && (
                              <div style={{padding:'7px 10px', fontSize:10.5, color:'var(--t3)', background:'var(--bg2)', borderTop:'1px solid var(--b1)'}}>
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

        <div style={{padding:'9px 14px', background:'var(--bg2)', fontSize:11, color:'var(--t3)', borderTop:'1px solid var(--b1)', lineHeight:1.5}}>
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
                  <div style={{width:28, height:28, border:'3px solid var(--b1)', borderTop:'3px solid var(--acc)', borderRadius:'50%', animation:'spin .7s linear infinite', margin:'0 auto 8px'}}/>
                  Fetching sheet…
                </div>
              )}

              {inspectorData?.error && (
                <div style={{padding:14, background:'color-mix(in srgb, var(--red) 10%, transparent)', border:'1px solid #7f1d1d', borderRadius:7, color:'var(--red)', fontSize:13}}>
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
                      <div style={{marginBottom:14, padding:10, background:'color-mix(in srgb, var(--acc) 6%, transparent)', border:'1px solid color-mix(in srgb, var(--acc) 30%, transparent)', borderRadius:7}}>
                        <div style={{fontSize:11, fontWeight:700, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>
                          Parser debug — what was detected
                        </div>

                        {/* Label row cells */}
                        <div style={{fontSize:11, color:'var(--t2)', marginBottom:8}}>
                          <b>Label row (line {dbg.labelRowIdx + 1}) — month label cells:</b><br/>
                          {dbg.labelRowCells.length === 0
                            ? <span style={{color:'var(--red)'}}>NONE FOUND — parser couldn't see any labels above the headers</span>
                            : dbg.labelRowCells.map((c, i) => (
                                <span key={i} style={{display:'inline-block', marginRight:8, padding:'1px 6px', background:'var(--bg1)', borderRadius:3, fontFamily:'monospace'}}>
                                  <b style={{color:'var(--yel)'}}>{c.colLetter}</b>="{c.value}"
                                </span>
                              ))}
                        </div>

                        {/* Detected sections */}
                        <div style={{fontSize:11, color:'var(--t2)'}}>
                          <b>Detected {dbg.sections.length} month sections:</b>
                          {dbg.sections.length === 0 && <span style={{color:'var(--red)', marginLeft:8}}>NONE — parser dropped every section</span>}
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
                                  <td style={{padding:'4px 8px', color: s.moIdx >= 0 ? 'var(--grn)' : 'var(--red)', fontWeight:600}}>{s.monthLabel}</td>
                                  <td style={{padding:'4px 8px', textAlign:'center', fontFamily:'monospace', color:'var(--yel)', fontWeight:700}}>{s.targetColLetter}</td>
                                  <td style={{padding:'4px 8px', textAlign:'center', fontFamily:'monospace', color:'var(--grn)', fontWeight:700}}>{s.achColLetter}</td>
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
                        if(isTarget)        color = '#f59e0b';
                        else if(isAchieved) color = '#86efac';
                        else if(isName)     color = '#a5b4fc';
                        else if(isCity || isState) color = '#06b6d4';
                        return (
                          <div key={i} style={{
                            padding:'5px 8px', background:'var(--bg1)', borderRadius:4,
                            border:'1px solid var(--b1)', fontSize:11,
                          }}>
                            <span style={{
                              fontWeight:800, color: i === 3 ? 'var(--yel)' : 'var(--acc)',
                              marginRight:6, background: i === 3 ? 'color-mix(in srgb, var(--yel) 15%, transparent)' : 'transparent',
                              padding:'1px 5px', borderRadius:3,
                            }}>{colLetter(i)}</span>
                            <span style={{color, fontWeight: i === 3 ? 700 : 500}}>{h || <i style={{color:'var(--t3)'}}>(empty)</i>}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{fontSize:10, color:'var(--t3)', marginTop:6}}>
                      <b style={{color:'var(--yel)'}}>Yellow</b> = parser thinks this is Target. <b style={{color:'var(--grn)'}}>Green</b> = Achieved. <b style={{color:'#a5b4fc'}}>Lavender</b> = Dealer name. <b style={{color:'#06b6d4'}}>Cyan</b> = City/State. <b style={{color:'var(--yel)'}}>Column D</b> is highlighted yellow as the configured Target column.
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
                            <th style={{padding:'5px 8px', color:'var(--acc)', fontWeight:800, position:'sticky', left:0, background:'var(--bg2)', borderRight:'1px solid var(--b1)'}}>#</th>
                            {inspectorData.headers.map((h, i) => (
                              <th key={i} style={{padding:'5px 8px', color: i === 3 ? 'var(--yel)' : 'var(--acc)', fontWeight:800, whiteSpace:'nowrap', borderBottom:'1px solid var(--b1)', background: i === 3 ? 'color-mix(in srgb, var(--yel) 10%, transparent)' : 'transparent'}}>
                                {colLetter(i)}
                              </th>
                            ))}
                          </tr>
                          <tr style={{background:'var(--bg2)'}}>
                            <th style={{padding:'3px 8px', color:'var(--t3)', fontSize:9, position:'sticky', left:0, background:'var(--bg2)'}}></th>
                            {inspectorData.headers.map((h, i) => (
                              <th key={i} style={{padding:'3px 8px', color:'var(--t3)', fontSize:9, fontWeight:500, whiteSpace:'nowrap', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', background: i === 3 ? 'color-mix(in srgb, var(--yel) 8%, transparent)' : 'transparent'}}>
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
                                  color: ci === 3 ? 'var(--yel)' : 'var(--t1)',
                                  background: ci === 3 ? 'color-mix(in srgb, var(--yel) 5%, transparent)' : 'transparent',
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
                              <td style={{padding:'5px 8px', color:'var(--yel)', fontWeight:700}}>{d.target || '0'}</td>
                              <td style={{padding:'5px 8px', color:'var(--grn)', fontWeight:700}}>{d.achieved || '0'}</td>
                              <td style={{padding:'5px 8px', color:'var(--t3)', fontSize:10, fontFamily:'monospace'}}>[{(d.months || []).join(', ')}]</td>
                              <td style={{padding:'5px 8px', color:'var(--t3)', fontSize:10, fontFamily:'monospace'}}>{JSON.stringify(d.monthTargets || {})}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{marginTop:14, padding:10, background:'color-mix(in srgb, var(--acc) 8%, transparent)', border:'1px solid color-mix(in srgb, var(--acc) 25%, transparent)', borderRadius:6, fontSize:11, color:'var(--t2)'}}>
                    <b style={{color:'var(--acc)'}}>How to read this:</b> Each row above shows what the parser pulled out for one dealer.
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
        <div className="overlay" style={{zIndex:9999, padding:14}}
          onClick={() => setUploadFor(null)}
        >
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:460, padding:18}}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
              <span className="sec-ico" style={{'--tone':'var(--grn)'}}><Upload size={15}/></span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:15, fontWeight:800, color:'var(--t1)'}}>Upload for {uploadFor}</div>
                <div style={{fontSize:11.5, color:'var(--t3)'}}>Monthly sales data · Excel or CSV</div>
              </div>
              <button onClick={() => setUploadFor(null)} className="imp-x" title="Close">
                <X size={14}/>
              </button>
            </div>

            <ImportStepper steps={['Month', 'Salesman', 'Choose file', 'Done']} current={uploadSm ? 2 : 1}/>

            <label style={{fontSize:10.5, fontWeight:800, color:'var(--t3)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.08em'}}>Upload for which salesman?</label>
            <select
              className="sel"
              value={uploadSm}
              onChange={e => setUploadSm(e.target.value)}
              style={{width:'100%', fontSize:13, marginBottom:12}}>
              {salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              {!salesmen.length && <option value="">No salesmen found</option>}
            </select>

            <DropZone
              onBrowse={() => fileRef.current?.click()}
              onDropFiles={files => handleFile({ target: { files, value: '' } })}
              disabled={busy}
              busy={busy}
              busyText={`Uploading to ${uploadFor}…`}
              title="Drop the Excel / CSV file here"
              formats={['.XLSX', '.XLS', '.CSV']}
              tone="var(--grn)"
            />

            <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:12}}>
              <button onClick={() => downloadTemplate(uploadFor)} className="btne" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <Download size={13}/> Template for {uploadFor}
              </button>
              <div style={{flex:1}}/>
              <button onClick={() => fileRef.current?.click()} disabled={busy} className="btnp" style={{display:'inline-flex', alignItems:'center', gap:6}}>
                <Upload size={14}/> Choose Excel / CSV file
              </button>
            </div>
            <div style={{fontSize:11, color:'var(--t3)', marginTop:10, textAlign:'center'}}>
              Existing dealers in this month will be updated. New dealers will be added.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const MM_CSS = `
.mm-tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
.mm-pill{--tone:var(--acc);display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;
  padding:2px 9px;border-radius:20px;color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent);border:1px solid color-mix(in srgb,var(--tone) 30%,transparent)}
.mm-pill.blank{color:var(--t3);background:var(--bg2);border:1px dashed var(--b2)}
.mm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr));gap:12px;padding:14px}
.mm-card{--tone:var(--t3);position:relative;overflow:hidden;display:flex;flex-direction:column;background:var(--bg1);border:1px solid var(--b1);border-radius:16px;padding:14px 14px 12px 17px;transition:transform .15s,box-shadow .15s}
.mm-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--tone)}
.mm-card:hover{transform:translateY(-2px);box-shadow:var(--shadowHover,0 6px 20px rgba(16,24,40,.12))}
.mm-card.cur{border-color:color-mix(in srgb,var(--acc) 45%,var(--b1));background:color-mix(in srgb,var(--acc) 4%,var(--bg1));box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 12%,transparent)}
.mm-card.blank{background:color-mix(in srgb,var(--bg2) 50%,var(--bg1))}
.mm-idx{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;font-size:12px;font-weight:800;color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent)}
.mm-kv{min-width:0;padding:7px 8px;border-radius:10px;background:var(--bg2);border:1px solid var(--b1)}
.mm-kv span{display:block;font-size:9.5px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--t3)}
.mm-kv b{display:block;font-size:13px;font-weight:800;font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mm-stack{display:flex;flex-shrink:0}
.mm-stack .ini{box-shadow:0 0 0 2px var(--bg1)}
.mm-stack .ini+.ini{margin-left:-7px}
.mm-ic{display:inline-grid;place-items:center;padding:6px 9px}
.mm-row{padding:11px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;flex-wrap:wrap;transition:background .15s}
.mm-row:hover{background:color-mix(in srgb,var(--acc) 4%,transparent)}
.mm-open{padding:12px 14px 14px 14px;background:var(--bg2);border-top:1px solid var(--b1)}
.mm-sub{font-size:10.5px;font-weight:800;color:var(--t3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}
.mm-mini{border:1px solid var(--b1);border-radius:10px;padding:7px 8px;cursor:pointer;text-align:center;transition:border-color .15s}
.mm-mini:hover{border-color:var(--acc)}
@media(max-width:900px){.mm-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
