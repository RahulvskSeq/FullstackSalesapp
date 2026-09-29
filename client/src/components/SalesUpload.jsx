import React, { useEffect, useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, X, Calendar, Layers, UploadCloud } from 'lucide-react';
import { PageHead } from '../collections/ui';
import { api } from '../api';
import { notify } from './Toast';

/**
 * SalesUpload — admin uploads the wide-format Excel:
 *   ┌───────────────┬──────────────┬─────────┬───────┬─────┬────────┐
 *   │ Company Name  │ Sales Person │ 0.92 LAM│ 1 MM  │ ... │ Grand  │
 *   ├───────────────┼──────────────┼─────────┼───────┼─────┼────────┤
 *   │ A & M INTERIO │ Ratish Das   │         │  16   │  3  │   19   │
 *   └───────────────┴──────────────┴─────────┴───────┴─────┴────────┘
 *
 * Steps:
 *   1. Pick a month.
 *   2. Click "Download Template" — server generates an Excel with current
 *      categories/sub-categories as column headers.
 *   3. Fill it in Excel and upload.
 *   4. Server explodes the wide row into per-(dealer × sub-cat) line items.
 */

// Build a "YYYY-MM" string list spanning last 18 months → next 6
function buildMonthOptions() {
  const out = [];
  const now  = new Date();
  for (let i = -18; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const lbl = d.toLocaleString('default', { month:'short', year:'numeric' });
    out.push({ ym, label: lbl });
  }
  return out;
}

const SalesUpload = ({ currentUser, onUploaded }) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const months = buildMonthOptions();
  const currentYM = (() => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; })();

  const [month, setMonth]     = useState(currentYM);
  const [file, setFile]       = useState(null);
  const [busy, setBusy]       = useState(false);
  const [busyT, setBusyT]     = useState(false);
  const [result, setResult]   = useState(null);
  const [err, setErr]         = useState('');
  const [drag, setDrag]       = useState(false);
  const [existingMonths, setExistingMonths] = useState([]);
  const [replace, setReplace] = useState(true);
  const fileRef = useRef(null);

  useEffect(() => { api.salesMonths().then(setExistingMonths).catch(()=>{}); }, []);

  const monthHasData = existingMonths.includes(month);

  const downloadTpl = async () => {
    setBusyT(true);
    try { await api.salesDownloadTemplate(); }
    catch(e) { notify.error(e.message); }
    setBusyT(false);
  };

  const onPick = (f) => {
    if (!f) return;
    if (!/\.(xlsx|xls)$/i.test(f.name)) { notify.error('Please pick an Excel (.xlsx) file'); return; }
    setFile(f); setResult(null); setErr('');
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    onPick(e.dataTransfer?.files?.[0]);
  };

  const handleUpload = async () => {
    if (!file)  { notify.error('Pick an Excel file first'); return; }
    if (!month) { notify.error('Pick a month'); return; }
    setBusy(true); setErr(''); setResult(null);
    try {
      const res = await api.salesUpload(file, month, replace);
      setResult(res);
      notify.success(`Uploaded ${res.inserted} sales rows for ${month}`);
      const ms = await api.salesMonths().catch(()=>[]);
      setExistingMonths(ms);
      if (onUploaded) onUploaded();
    } catch(e) { setErr(e.message); notify.error(e.message); }
    setBusy(false);
  };

  const reset = () => { setFile(null); setResult(null); setErr(''); if(fileRef.current) fileRef.current.value=''; };

  if (!isAdmin) {
    return (
      <div className="card" style={{padding:20}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <AlertCircle size={18} color="var(--yel)"/>
          <div style={{fontSize:14,fontWeight:600}}>Only admins can upload sales data.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade" style={{display:'grid',gap:14}}>
      {/* Top — title + month picker */}
      <PageHead icon={UploadCloud} tone="var(--acc)" eyebrow={null} title="Upload Category-wise Sales"
        sub="One row per dealer. Columns = product types." />

      {/* Step 1 — Template */}
      <div className="card" style={{padding:16}}>
        <div className="sec-title" style={{marginBottom:8}}>
          <span className="sec-ico" style={{'--tone':'var(--acc)',fontSize:13}}>1</span> Download the Excel template
        </div>
        <div style={{fontSize:12,color:'var(--t3)',marginBottom:10,paddingLeft:39}}>
          The template auto-generates columns from your current Category Types &amp; Product Types.
          Manage them under <b>Admin Panel → Categories</b>.
        </div>
        <div style={{paddingLeft:39}}>
          <button className="btnp" onClick={downloadTpl} disabled={busyT}
            style={{display:'inline-flex',alignItems:'center',gap:6}}>
            <Download size={14}/> {busyT ? 'Building…' : 'Download Sales Template'}
          </button>
        </div>
      </div>

      {/* Step 2 — Month + replace toggle */}
      <div className="card" style={{padding:16}}>
        <div className="sec-title" style={{marginBottom:10}}>
          <span className="sec-ico" style={{'--tone':'var(--acc)',fontSize:13}}>2</span> Pick the month this data is for
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:14,alignItems:'center',paddingLeft:39}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <Calendar size={14} color="var(--t3)"/>
            <select value={month} onChange={e=>setMonth(e.target.value)} className="inp" style={{minWidth:160}}>
              {months.map(m => (
                <option key={m.ym} value={m.ym}>
                  {m.label}{existingMonths.includes(m.ym) ? '  •  has data' : ''}
                </option>
              ))}
            </select>
          </div>
          <label style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--t2)'}}>
            <input type="checkbox" checked={replace} onChange={e=>setReplace(e.target.checked)} />
            Replace existing data for this month
          </label>
          {monthHasData && replace && (
            <span style={{fontSize:11,color:'var(--yel)'}}>⚠ existing rows for {month} will be wiped before insert</span>
          )}
        </div>
      </div>

      {/* Step 3 — Upload */}
      <div className="card" style={{padding:16}}>
        <div className="sec-title" style={{marginBottom:10}}>
          <span className="sec-ico" style={{'--tone':'var(--acc)',fontSize:13}}>3</span> Upload the filled Excel
        </div>
        <div
          onDragOver={e=>{e.preventDefault();setDrag(true);}}
          onDragLeave={()=>setDrag(false)}
          onDrop={onDrop}
          onClick={()=>fileRef.current?.click()}
          style={{
            marginLeft:39,
            border:`2px dashed ${drag?'var(--acc)':'var(--b2)'}`,
            borderRadius:10, padding:24, textAlign:'center', cursor:'pointer',
            background: drag ? 'color-mix(in srgb, var(--acc) 6%, transparent)' : 'transparent',
          }}
        >
          <Upload size={28} color={drag?'var(--acc)':'var(--t3)'} style={{marginBottom:6}}/>
          <div style={{fontSize:13,fontWeight:600}}>{file ? file.name : 'Click or drag .xlsx here'}</div>
          <div style={{fontSize:11,color:'var(--t3)',marginTop:4}}>
            {file ? `${(file.size/1024).toFixed(1)} KB` : 'Use the template above for best results'}
          </div>
          <input
            ref={fileRef} type="file" accept=".xlsx,.xls" hidden
            onChange={e=>onPick(e.target.files?.[0])}
          />
        </div>

        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:12}}>
          {file && (
            <button className="btn" onClick={reset}><X size={13}/> Clear</button>
          )}
          <button className="btnp" onClick={handleUpload} disabled={busy || !file}>
            <Upload size={13}/> {busy ? 'Uploading…' : `Upload for ${month}`}
          </button>
        </div>
      </div>

      {/* Result */}
      {err && (
        <div className="card" style={{padding:14,borderColor:'var(--red)',background:'color-mix(in srgb, var(--red) 6%, transparent)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <AlertCircle size={16} color="var(--red)"/>
            <div style={{fontSize:13,fontWeight:600,color:'var(--red)'}}>{err}</div>
          </div>
        </div>
      )}
      {result && (
        <div className="card" style={{padding:14,borderColor:'var(--grn)',background:'color-mix(in srgb, var(--grn) 5%, transparent)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <CheckCircle size={16} color="var(--grn)"/>
            <div style={{fontSize:13,fontWeight:700}}>Upload successful</div>
          </div>
          <div style={{fontSize:12,color:'var(--t2)',display:'grid',gap:4}}>
            <div>Month: <b>{result.month}</b></div>
            <div>Inserted: <b>{result.inserted}</b> line items</div>
            {result.unknownSubCategories?.length > 0 && (
              <div style={{color:'var(--yel)'}}>
                ⚠ Unknown sub-categories skipped: {result.unknownSubCategories.join(', ')}
                <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>
                  Add them in Admin → Categories, then re-upload.
                </div>
              </div>
            )}
            {result.unmatchedDealersCount > 0 && (
              <div style={{color:'var(--yel)'}}>
                ⚠ {result.unmatchedDealersCount} dealer name(s) didn't match the dealer master list
                {result.unmatchedDealers?.length ? `: ${result.unmatchedDealers.slice(0,5).join(', ')}${result.unmatchedDealersCount>5?'…':''}` : ''}.
                <div style={{fontSize:10,color:'var(--t3)',marginTop:2}}>
                  Data was still saved, but Dealer drill-down may show those by name only.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesUpload;
