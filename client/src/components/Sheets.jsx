// Sheets — an online, Google-Sheets-class spreadsheet that lives entirely in
// the app. Nothing is downloaded: the whole workbook is saved to MongoDB and
// auto-saved on every edit, so users open the same sheet from any device.
//
// Engine: Univer (Apache-2.0) via its sheets-core preset — a true Google Sheets
// clone: per-cell number formats ($/%/decimals), formulas, freeze, filters,
// conditional formatting, insert link, the full toolbar & formula bar.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createUniver, LocaleType, merge } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core';
import sheetsCoreEnUS from '@univerjs/presets/preset-sheets-core/locales/en-US';
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import { Plus, Trash2, FileSpreadsheet, Pencil, Check, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { api } from '../api';

const fmtWhen = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
};

// A stored payload is a Univer workbook snapshot when it's a plain object with
// a `sheets` map (older jspreadsheet sheets were stored as an array).
const isUniverSnapshot = (v) => v && !Array.isArray(v) && typeof v === 'object' && v.sheets && typeof v.sheets === 'object';

export default function Sheets({ currentUser, users = {} }) {
  const [sheets, setSheets]       = useState([]);
  const [activeId, setActiveId]   = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved | error
  const [renaming, setRenaming]   = useState(false);
  const [renameVal, setRenameVal] = useState('');
  const [err, setErr]             = useState('');
  const [univerReady, setUniverReady] = useState(false);

  const containerRef  = useRef(null);   // div Univer renders its whole UI into
  const univerRef     = useRef(null);   // { univer, univerAPI }
  const unitIdRef     = useRef(null);   // current workbook unit id (to dispose)
  const saveTimer     = useRef(null);
  const activeIdRef   = useRef(null);
  const suppressRef   = useRef(false);  // ignore mutations during load/dispose
  const lastSavedRef  = useRef(null);   // JSON of last-persisted snapshot (change guard)
  const loadFailedRef = useRef(false);  // never autosave over a sheet that failed to load

  const activeMeta = useMemo(() => sheets.find(s => s.id === activeId) || null, [sheets, activeId]);

  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // ── Load the list of sheets on mount ──────────────────────────────────
  const refreshList = async (selectId) => {
    try {
      const list = await api.sheetsList();
      setSheets(list);
      if (selectId) setActiveId(selectId);
      else if (!activeIdRef.current && list.length) setActiveId(list[0].id);
      return list;
    } catch (e) {
      setErr(e.message || 'Failed to load sheets');
      return [];
    } finally {
      setLoadingList(false);
    }
  };
  useEffect(() => { refreshList(); /* eslint-disable-next-line */ }, []);

  // ── Save the active workbook snapshot ─────────────────────────────────
  const doSave = async () => {
    const id = activeIdRef.current;
    const uref = univerRef.current;
    if (!id || !uref) return;
    if (loadFailedRef.current) return;   // never persist over a sheet we couldn't load
    const wb = uref.univerAPI.getActiveWorkbook();
    if (!wb) return;
    let snapshot;
    try { snapshot = wb.save(); } catch { return; }
    // Change guard: only persist when the content actually differs from what we
    // last loaded/saved. This stops a load from ever overwriting stored data
    // and prevents redundant writes.
    const cur = JSON.stringify(snapshot);
    if (cur === lastSavedRef.current) { setSaveState('saved'); return; }
    setSaveState('saving');
    try {
      const r = await api.sheetSave(id, { worksheets: snapshot });
      lastSavedRef.current = cur;
      setSaveState('saved');
      setSheets(prev => prev.map(s => s.id === id ? { ...s, updatedAt: r.savedAt || new Date().toISOString() } : s));
    } catch (e) {
      setSaveState('error');
      setErr(e.message || 'Save failed');
    }
  };
  const scheduleSave = () => {
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 1200);
  };

  // ── Create the Univer instance ONCE ───────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let disposable = null;
    try { containerRef.current.innerHTML = ''; } catch {}
    const { univer, univerAPI } = createUniver({
      locale: LocaleType.EN_US,
      locales: { [LocaleType.EN_US]: merge({}, sheetsCoreEnUS) },
      presets: [ UniverSheetsCorePreset({ container: containerRef.current }) ],
    });
    univerRef.current = { univer, univerAPI };

    // Autosave: fire on document MUTATIONS only (value/format/structure edits),
    // not on selection/navigation operations. Debounced.
    try {
      disposable = univerAPI.addEvent(univerAPI.Event.CommandExecuted, (event) => {
        if (suppressRef.current) return;
        if (event && event.type === 2 /* CommandType.MUTATION */) scheduleSave();
      });
    } catch {}

    setUniverReady(true);
    return () => {
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
      try { disposable && disposable.dispose && disposable.dispose(); } catch {}
      try { univer.dispose(); } catch {}
      univerRef.current = null;
      unitIdRef.current = null;
    };
    /* eslint-disable-next-line */
  }, []);

  // ── Load a workbook whenever the active sheet changes ─────────────────
  useEffect(() => {
    if (!univerReady || !activeId || !univerRef.current) return;
    let cancelled = false;
    const { univerAPI } = univerRef.current;
    suppressRef.current = true;         // block autosave during load
    loadFailedRef.current = false;
    lastSavedRef.current = null;
    setLoadingSheet(true);
    setSaveState('idle');

    // Dispose the previously-open workbook (if any).
    if (unitIdRef.current) {
      try { univerAPI.disposeUnit(unitIdRef.current); } catch {}
      unitIdRef.current = null;
    }

    api.sheetGet(activeId)
      .then(doc => {
        if (cancelled) return;
        const snap = doc.worksheets;
        // createWorkbook can throw on a malformed snapshot — if it does, DON'T
        // silently blank it (that would let autosave wipe stored data). Mark the
        // load as failed so autosave stays disabled for this sheet.
        try {
          const wb = univerAPI.createWorkbook(isUniverSnapshot(snap) ? snap : {});
          unitIdRef.current = wb.getId();
        } catch (e) {
          loadFailedRef.current = true;
          setErr('This sheet could not be opened (its data may be from an older format). It has not been changed.');
          try { const wb = univerAPI.createWorkbook({}); unitIdRef.current = wb.getId(); } catch {}
        }
      })
      .catch(e => {
        if (cancelled) return;
        loadFailedRef.current = true;
        setErr(e.message || 'Failed to open sheet');
        try { const wb = univerAPI.createWorkbook({}); unitIdRef.current = wb.getId(); } catch {}
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingSheet(false);
        // Once the load's own mutations settle, snapshot the current state as the
        // "last saved" baseline and re-enable autosave (unless load failed).
        setTimeout(() => {
          if (cancelled) return;
          if (!loadFailedRef.current) {
            try {
              const wb = univerAPI.getActiveWorkbook();
              lastSavedRef.current = wb ? JSON.stringify(wb.save()) : null;
            } catch { lastSavedRef.current = null; }
            suppressRef.current = false;
          }
        }, 500);
      });

    return () => { cancelled = true; };
    /* eslint-disable-next-line */
  }, [activeId, univerReady]);

  // Save-before-unload safety net.
  useEffect(() => {
    const onLeave = () => { if (saveTimer.current) doSave(); };
    window.addEventListener('beforeunload', onLeave);
    return () => window.removeEventListener('beforeunload', onLeave);
    /* eslint-disable-next-line */
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────
  const createSheet = async () => {
    const name = (window.prompt('Name your new sheet:', 'Untitled sheet') || '').trim();
    try {
      const doc = await api.sheetCreate({ name: name || 'Untitled sheet', worksheets: {} });
      await refreshList(doc.id);
      setActiveId(doc.id);
    } catch (e) { setErr(e.message || 'Could not create sheet'); }
  };

  const deleteSheet = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    try {
      await api.sheetDelete(id);
      const remaining = sheets.filter(s => s.id !== id);
      setSheets(remaining);
      if (activeId === id) {
        if (unitIdRef.current && univerRef.current) { try { univerRef.current.univerAPI.disposeUnit(unitIdRef.current); } catch {} unitIdRef.current = null; }
        setActiveId(remaining[0]?.id || null);
      }
    } catch (e) { setErr(e.message || 'Delete failed'); }
  };

  const startRename = () => { setRenameVal(activeMeta?.name || ''); setRenaming(true); };
  const commitRename = async () => {
    const name = renameVal.trim();
    setRenaming(false);
    if (!name || !activeId || name === activeMeta?.name) return;
    try {
      await api.sheetSave(activeId, { name });
      setSheets(prev => prev.map(s => s.id === activeId ? { ...s, name } : s));
    } catch (e) { setErr(e.message || 'Rename failed'); }
  };

  const canDelete = (s) => ['admin','superadmin'].includes(currentUser?.role) || s.owner === currentUser?.id;

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="fade" style={{ display:'flex', gap:14, height:'calc(100vh - 130px)', minHeight:480 }}>
      {/* ── Sidebar: sheet list ─────────────────────────────────────── */}
      <div style={{ width:240, flexShrink:0, display:'flex', flexDirection:'column',
        background:'var(--bg1)', border:'1px solid var(--b1)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--b1)', display:'flex', alignItems:'center', gap:8 }}>
          <FileSpreadsheet size={16} color="var(--acc)"/>
          <div style={{ fontWeight:700, fontSize:14, flex:1 }}>My Sheets</div>
          <button onClick={createSheet} title="New sheet"
            style={{ display:'inline-flex', alignItems:'center', gap:4, background:'var(--acc)', color:'#fff',
              border:'none', borderRadius:8, padding:'6px 9px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
            <Plus size={13}/> New
          </button>
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {loadingList ? (
            <div style={{ padding:16, color:'var(--t3)', fontSize:13 }}>Loading…</div>
          ) : sheets.length === 0 ? (
            <div style={{ padding:16, color:'var(--t3)', fontSize:13, lineHeight:1.6 }}>
              No sheets yet.<br/>Click <b>New</b> to create one.
            </div>
          ) : sheets.map(s => (
            <div key={s.id} onClick={() => setActiveId(s.id)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', cursor:'pointer',
                borderBottom:'1px solid var(--b1)',
                background: s.id === activeId ? 'var(--bg2)' : 'transparent',
                borderLeft: s.id === activeId ? '3px solid var(--acc)' : '3px solid transparent' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
                <div style={{ fontSize:10.5, color:'var(--t3)', marginTop:2 }}>
                  {s.ownerName && s.owner !== currentUser?.id ? `${s.ownerName} · ` : ''}{fmtWhen(s.updatedAt)}
                </div>
              </div>
              {canDelete(s) && (
                <button onClick={(e)=>{ e.stopPropagation(); deleteSheet(s.id, s.name); }} title="Delete"
                  style={{ background:'transparent', border:'none', color:'var(--t3)', cursor:'pointer', padding:4, borderRadius:6, flexShrink:0 }}>
                  <Trash2 size={14}/>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main: header + Univer editor ────────────────────────────── */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column',
        background:'var(--bg1)', border:'1px solid var(--b1)', borderRadius:12, overflow:'hidden' }}>
        {/* Header bar: name + save status */}
        <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--b1)', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          {activeId ? (
            renaming ? (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <input autoFocus value={renameVal} onChange={e=>setRenameVal(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter') commitRename(); if(e.key==='Escape') setRenaming(false); }}
                  style={{ background:'var(--bg2)', color:'var(--t1)', border:'1px solid var(--acc)', borderRadius:7, padding:'5px 9px', fontSize:14, fontWeight:600 }}/>
                <button onClick={commitRename} style={{ background:'var(--acc)', color:'#fff', border:'none', borderRadius:7, padding:'6px 8px', cursor:'pointer' }}><Check size={14}/></button>
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{activeMeta?.name || 'Sheet'}</div>
                <button onClick={startRename} title="Rename"
                  style={{ background:'transparent', border:'none', color:'var(--t3)', cursor:'pointer', padding:3 }}><Pencil size={13}/></button>
              </div>
            )
          ) : (
            <div style={{ fontWeight:700, fontSize:15, color:'var(--t3)' }}>No sheet open</div>
          )}
          <div style={{ flex:1 }}/>
          {activeId && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600,
              color: saveState==='error' ? '#f87171' : saveState==='saving' ? 'var(--t3)' : '#34d399' }}>
              {saveState==='saving' && <><Loader2 size={13} className="spin"/> Saving…</>}
              {saveState==='saved'  && <><Cloud size={13}/> Saved</>}
              {saveState==='idle'   && <><Cloud size={13}/> All changes saved</>}
              {saveState==='error'  && <><CloudOff size={13}/> Save failed</>}
            </div>
          )}
        </div>

        {err && (
          <div style={{ padding:'8px 14px', background:'rgba(248,113,113,0.12)', color:'#f87171', fontSize:12, borderBottom:'1px solid rgba(248,113,113,0.3)', flexShrink:0 }}>
            {err} <span onClick={()=>setErr('')} style={{ cursor:'pointer', marginLeft:8, textDecoration:'underline' }}>dismiss</span>
          </div>
        )}

        {/* Univer renders its full UI (toolbar, formula bar, grid, tabs) here. */}
        <div style={{ flex:1, position:'relative', minHeight:0, background:'#fff' }}>
          {!activeId && !loadingList && (
            <div style={{ position:'absolute', inset:0, zIndex:5, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, color:'#64748b', background:'#fff' }}>
              <FileSpreadsheet size={40} strokeWidth={1.5}/>
              <div style={{ fontSize:15, fontWeight:600 }}>Create a sheet to get started</div>
              <button onClick={createSheet}
                style={{ display:'inline-flex', alignItems:'center', gap:6, background:'var(--acc)', color:'#fff', border:'none', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                <Plus size={15}/> New sheet
              </button>
            </div>
          )}
          {loadingSheet && (
            <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', zIndex:6, color:'#64748b', fontSize:13 }}>Opening…</div>
          )}
          <div ref={containerRef} style={{ position:'absolute', inset:0 }}/>
        </div>
      </div>

      <style>{`
        .spin { animation: stp-spin 0.9s linear infinite; }
        @keyframes stp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
