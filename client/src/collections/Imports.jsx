import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Pager, Badge, Modal, Field, DealerPicker, Busy, ErrorBox, money, num, fmtDate, fmtWhen, periodLabel, userName, useDealerCtx } from './ui';

/**
 * Import manager — upload, preview, resolve unmapped parties, apply, and the
 * full history. The preview is the whole point: what will change is shown
 * before anything is written.
 */
export default function Imports() {
  const { users } = useDealerCtx();
  const [page, setPage] = useState(1);
  const list = useLoad(() => col.imports({ page, limit: 25 }), [page]);
  const [open, setOpen] = useState(null);       // import id being previewed
  const [file, setFile] = useState(null);
  const [asOn, setAsOn] = useState('');
  const [mode, setMode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef();
  const upload = async () => {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const r = await col.uploadImport(file, asOn, mode);
      setFile(null); if (fileRef.current) fileRef.current.value = '';
      list.reload();
      if (r.duplicate) setErr(`This exact file was already imported as "${r.duplicateOf.fileName}" (${fmtWhen(r.duplicateOf.appliedAt)}). Nothing was written.`);
      else setOpen(String(r.import._id));
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <PageHead icon={UploadCloud} tone="var(--acc)" title="Upload statement" sub="Party-wise outstanding from the ERP. Excel is the input, never the record — every upload is kept, nothing is overwritten." />
      <Card title="Upload" style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0, flex: '1 1 260px' }}><label>File (.xlsx / .xls / .csv)</label><input ref={fileRef} type="file" className="inp" accept=".xlsx,.xls,.csv" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Statement date</label><input type="date" className="inp" value={asOn} onChange={e => setAsOn(e.target.value)} /><div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>Blank = read from the file name, else today</div></div>
          <div className="field" style={{ marginBottom: 0 }}><label>Columns mean</label><select className="sel" value={mode} onChange={e => setMode(e.target.value)}><option value="">Detect</option><option value="buckets">Bills raised that month (sum)</option><option value="snapshot">Running balance (latest)</option></select></div>
          <button className="btnp" disabled={!file || busy} onClick={upload}><UploadCloud size={14} /> {busy ? 'Reading…' : 'Upload & preview'}</button>
        </div>
        <ErrorBox err={err} />
      </Card>
      <Card title="History" pad={false}>
        {list.err ? <ErrorBox err={list.err} onRetry={list.reload} /> : list.busy && !list.data ? <Busy /> : <Table cols={[
          { k: 'createdAt', h: 'Uploaded', r: r => fmtWhen(r.createdAt) },
          { k: 'fileName', h: 'File', max: 260 },
          { k: 'asOn', h: 'Statement', r: r => fmtDate(r.asOn) },
          { k: 'periods', h: 'Months', r: r => (r.periods || []).map(periodLabel).join(', '), max: 240 },
          { k: 'balanceMode', h: 'Mode' },
          { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> },
          { k: 'rows', h: 'Rows', align: 'right', r: r => `${num(r.stats?.matched)} / ${num(r.stats?.rows)}` },
          { k: 'unmapped', h: 'Unmapped', align: 'right', r: r => <span style={{ color: r.stats?.unmapped ? 'var(--yel)' : undefined }}>{num(r.stats?.unmapped)}</span> },
          { k: 'totalAfter', h: 'Total', align: 'right', r: r => r.status === 'APPLIED' ? money(r.stats?.totalAfter) : '—' },
          { k: 'uploadedBy', h: 'By', r: r => r.uploadedByName || userName(users, r.uploadedBy) },
        ]} rows={list.data?.items} onRow={r => setOpen(String(r._id))} empty="No imports yet." />}
        <div style={{ padding: '0 12px 10px' }}><Pager page={list.data?.page} limit={list.data?.limit} total={list.data?.total} onPage={setPage} /></div>
      </Card>
      {open && <Preview id={open} onClose={() => { setOpen(null); list.reload(); }} />}
    </div>);
}

function Preview({ id, onClose }) {
  const { users } = useDealerCtx();
  const { data, busy, err, reload } = useLoad(() => col.importPreview(id), [id]);
  const [job, setJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [aerr, setAerr] = useState('');
  const [mapRow, setMapRow] = useState(null);
  useEffect(() => { if (!job || ['DONE', 'FAILED'].includes(job.status)) return; const t = setTimeout(() => col.job(job._id).then(setJob).catch(() => {}), 1500); return () => clearTimeout(t); }, [job]);
  useEffect(() => { if (job && ['DONE', 'FAILED'].includes(job.status)) reload(); }, [job?.status]);   // eslint-disable-line
  const apply = async () => {
    if (!window.confirm(`Apply "${imp.fileName}" as the statement of ${fmtDate(imp.asOn)}? ${num(imp.stats.unmapped)} unmapped rows will be skipped.`)) return;
    setApplying(true); setAerr('');
    try { const r = await col.applyImport(id, {}); if (r.jobId) setJob({ _id: r.jobId, status: 'QUEUED' }); else reload(); }
    catch (e) { setAerr(e.message); } finally { setApplying(false); }
  };
  if (busy && !data) return <Modal title="Import" onClose={onClose}><Busy /></Modal>;
  if (err) return <Modal title="Import" onClose={onClose}><ErrorBox err={err} onRetry={reload} /></Modal>;
  const imp = data.import, st = imp.stats || {};
  const canApply = ['VALIDATED', 'PREVIEWED', 'FAILED'].includes(imp.status) && st.matched > 0 && !job;
  return (
    <Modal title={imp.fileName} onClose={onClose} width={1000}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 10, fontSize: 12.5 }}>
        <Badge v={imp.status} /><span>Statement <b>{fmtDate(imp.asOn)}</b></span><span>· mode <b>{imp.balanceMode}</b>{imp.balanceModeDetected && imp.balanceModeDetected !== imp.balanceMode ? ` (detected ${imp.balanceModeDetected})` : ''}</span><span>· months {(imp.periods || []).map(periodLabel).join(', ')}</span><span>· by {imp.uploadedByName || userName(users, imp.uploadedBy)}</span>
      </div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {[['Rows', st.rows], ['Matched', st.matched], ['Unmapped', st.unmapped, st.unmapped ? 'var(--yel)' : null], ['Errors', st.errors, st.errors ? 'var(--red)' : null], ['Duplicates in file', st.duplicatesInFile], ...(data.dealersInMaster != null ? [['Dealers in master', data.dealersInMaster]] : [])].map(([l, v, c]) => <div key={l} className="stat-card"><div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>{l}</div><div style={{ fontSize: 17, fontWeight: 800, color: c || undefined }}>{num(v)}</div></div>)}
      </div>
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
        {[['New', st.new], ['Increased', st.increased], ['Decreased', st.decreased], ['Cleared', st.cleared], ['Unchanged', st.unchanged], ['Reopened', st.reopened], ['Before', money(st.totalBefore)], ['After', money(st.totalAfter)]].map(([l, v]) => <div key={l} className="stat-card" style={{ padding: '8px 10px' }}><div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>{l}</div><div style={{ fontSize: 14, fontWeight: 800 }}>{typeof v === 'number' ? num(v) : v}</div></div>)}
      </div>
      {data.olderThanLatest > 0 && <div style={{ fontSize: 12, padding: 8, borderRadius: 7, background: 'rgba(217,119,6,.12)', color: 'var(--yel)', marginBottom: 8 }}><AlertTriangle size={12} /> {num(data.olderThanLatest)} dealers already have a newer statement — this file is recorded as history for them and does not move their current figure.</div>}
      {data.willBindCodes > 0 && <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 8 }}>{num(data.willBindCodes)} dealers will learn their ERP code from this file.</div>}
      {job && <div style={{ fontSize: 12.5, padding: 10, borderRadius: 8, background: 'var(--accL)', marginBottom: 8 }}><RefreshCw size={12} className={job.status === 'RUNNING' ? 'spin' : ''} /> Applying in the background — {job.status}{job.progress?.message ? ' · ' + job.progress.message : ''}{job.error ? <span style={{ color: 'var(--red)' }}> · {job.error}</span> : ''}</div>}
      {imp.status === 'FAILED' && imp.errorReport?.length > 0 && <ErrorBox err={'Last attempt failed: ' + imp.errorReport[imp.errorReport.length - 1].message + '. Apply again to resume — completed chunks are kept.'} />}
      <ErrorBox err={aerr} />
      {data.unmapped?.length > 0 && <Card title={`Unmapped parties (${num(data.unmapped.length)}) — map or add before applying, or they are skipped`} style={{ marginBottom: 10 }}>
        <Table dense cols={[{ k: 'rowNo', h: 'Row' }, { k: 'rawParty', h: 'Party in file', max: 320 }, { k: 'code', h: 'Code' }, { k: 'total', h: 'Total', align: 'right', r: r => money(r.total) }, { k: 'act', h: '', r: r => <div className="row" style={{ gap: 4 }}><button className="btn" style={{ fontSize: 11 }} onClick={() => setMapRow(r)}>Map to dealer</button><button className="btne" onClick={async () => { if (!window.confirm(`Add "${r.partyName}" as a new dealer?`)) return; try { await col.createDealerFromRow(id, r.rowNo, 'none'); reload(); } catch (e) { alert(e.message); } }}>Add as new</button></div> }]} rows={data.unmapped} keyOf={r => r.rowNo} />
      </Card>}
      {data.errors?.length > 0 && <Card title={`Rows with errors (${num(data.errors.length)})`} style={{ marginBottom: 10 }}><Table dense cols={[{ k: 'rowNo', h: 'Row' }, { k: 'rawParty', h: 'Party' }, { k: 'message', h: 'Problem', wrap: true }]} rows={data.errors} keyOf={r => r.rowNo} /></Card>}
      {data.duplicatesInFile?.length > 0 && <Card title={`Repeated in the file (${num(data.duplicatesInFile.length)}) — only the first occurrence counts`} style={{ marginBottom: 10 }}><Table dense cols={[{ k: 'rowNo', h: 'Row' }, { k: 'rawParty', h: 'Party' }, { k: 'total', h: 'Total', align: 'right', r: r => money(r.total) }]} rows={data.duplicatesInFile} keyOf={r => r.rowNo} /></Card>}
      <Card title={`Biggest changes (${num(data.changedRows)} rows change)`} style={{ marginBottom: 10 }}>
        <Table dense cols={[{ k: 'dealer', h: 'Dealer' }, { k: 'code', h: 'Code' }, { k: 'classification', h: 'Change', r: r => <Badge v={r.classification} /> }, { k: 'before', h: 'Before', align: 'right', r: r => r.before == null ? '—' : money(r.before) }, { k: 'after', h: 'After', align: 'right', r: r => money(r.after) }, { k: 'delta', h: 'Δ', align: 'right', r: r => <span style={{ color: r.delta > 0 ? 'var(--red)' : 'var(--grn)' }}>{r.delta > 0 ? '+' : ''}{money(r.delta)}</span> }, { k: 'matchMethod', h: 'Matched by' }]} rows={data.topChanges} keyOf={r => r.rowNo} empty="Nothing changes." />
      </Card>
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn" onClick={onClose}>Close</button>
        {imp.status === 'APPLIED' ? <span className="row" style={{ color: 'var(--grn)', fontSize: 12.5, gap: 5 }}><CheckCircle2 size={14} /> Applied {fmtWhen(imp.appliedAt)}</span>
          : <button className="btnp" disabled={!canApply || applying} onClick={apply}>{applying ? 'Applying…' : imp.status === 'FAILED' ? 'Resume apply' : 'Apply statement'}</button>}
      </div>
      {mapRow && <MapRow importId={id} row={mapRow} onClose={() => setMapRow(null)} onDone={reload} />}
    </Modal>);
}

function MapRow({ importId, row, onClose, onDone }) {
  const [dealer, setDealer] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  // The first couple of words usually find the dealer even when the ERP and
  // the master spell the rest differently — a head start, never a guess.
  const seed = String(row.partyName || row.rawParty || '').replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).slice(0, 2).join(' ');
  return <Modal title={`Map row ${row.rowNo}`} onClose={onClose} width={480}>
    <div style={{ fontSize: 13, marginBottom: 10 }}><b>{row.rawParty}</b> · {money(row.total)}</div>
    <Field label="Dealer in the master" hint="The dealer learns this party's code and spelling; future files match on their own."><DealerPicker value={dealer} onChange={setDealer} initialQuery={seed} /></Field>
    <ErrorBox err={err} />
    <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}><button className="btn" onClick={onClose}>Cancel</button><button className="btnp" disabled={!dealer || busy} onClick={async () => { setBusy(true); setErr(''); try { await col.mapRow(importId, row.rowNo, dealer.id); onDone(); onClose(); } catch (e) { setErr(e.message); } finally { setBusy(false); } }}>Map</button></div>
  </Modal>;
}
