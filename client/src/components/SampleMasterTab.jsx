import React, { useState, useRef } from 'react';
import { api } from '../api';
import { Upload, Trash2, RefreshCw, Download, Package, ListChecks, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { confirmDialog } from './Toast';
import SampleAllocationPanel from './SampleAllocationPanel';

/* scoped styles (prefix smt-) — theme variables only */
const CSS = `
.smt-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}
.smt-tab{--tone:var(--acc);position:relative;display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:16px;border:1px solid var(--b1);background:var(--bg1);cursor:pointer;text-align:left;font:inherit;color:inherit;min-width:0;box-shadow:var(--shadow,none);transition:border-color .15s,box-shadow .15s,transform .15s,background .15s}
.smt-tab:hover{transform:translateY(-1px);border-color:color-mix(in srgb,var(--tone) 35%,var(--b1))}
.smt-tab.on{border-color:color-mix(in srgb,var(--tone) 55%,transparent);background:linear-gradient(115deg,color-mix(in srgb,var(--tone) 14%,var(--bg1)) 0%,var(--bg1) 80%);box-shadow:0 0 0 3px color-mix(in srgb,var(--tone) 13%,transparent)}
.smt-ico{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent);transition:background .15s,color .15s}
.smt-tab.on .smt-ico{background:var(--tone);color:#fff;box-shadow:0 6px 16px color-mix(in srgb,var(--tone) 35%,transparent)}
.smt-txt{min-width:0;flex:1}
.smt-t{font-size:14.5px;font-weight:800;color:var(--t1);letter-spacing:-.01em}
.smt-d{font-size:11.5px;color:var(--t3);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.smt-n{--tone:var(--acc);flex-shrink:0;font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:20px;color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent);white-space:nowrap}
.smt-hk{padding:16px}
.smt-hk-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.smt-b{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;font-size:12.5px;font-weight:700;white-space:nowrap}
.smt-danger{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;padding:12px 14px;border-radius:12px;border:1px dashed color-mix(in srgb,var(--red) 40%,transparent);background:color-mix(in srgb,var(--red) 5%,transparent)}
.smt-msg{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;font-weight:600;margin-top:12px;padding:10px 12px;border-radius:12px;color:var(--tone);border:1px solid color-mix(in srgb,var(--tone) 30%,transparent);background:color-mix(in srgb,var(--tone) 9%,transparent);overflow-wrap:anywhere}
@media(max-width:560px){
  .smt-tabs{gap:8px}
  .smt-tab{padding:10px;gap:9px;border-radius:14px}
  .smt-ico{width:34px;height:34px;border-radius:10px}
  .smt-t{font-size:13px}
  .smt-d{display:none}
  .smt-hk-row>*{flex:1 1 auto;justify-content:center}
}
`;

/**
 * Samples, in two parts:
 *   Sample master   — add a sample with its pieces and zones (allotted at once),
 *                     the stock table, the sheet uploads and housekeeping.
 *   Samples status  — where every piece is: requests to approve, to be given,
 *                     with dealers, taken back; and what any dealer holds.
 */
export default function SampleMasterTab() {
  const [tab, setTab] = useState('master');
  const [msg, setMsg] = useState('');
  const [uploadingGiven, setUploadingGiven] = useState(false);
  const [downloadingTpl, setDownloadingTpl] = useState(false);
  const [refresh, setRefresh] = useState(0);        // bumps the panel after housekeeping
  const [counts, setCounts] = useState({});         // { samples, requests } as the open panel reports them
  const givenFileRef = useRef();

  // "dealer × sample" sheet: which dealer already holds which sample (given records)
  const handleUploadGiven = async (file) => {
    if (!file) return;
    setUploadingGiven(true); setMsg('');
    try {
      const res = await api.uploadSamplesGiven(file);
      setMsg(`✓ ${res.added || 0} sample records added, ${res.skipped || 0} already existed`);
      setRefresh(r => r + 1);
    } catch (e) { setMsg('Error: ' + e.message); }
    setUploadingGiven(false);
  };

  const deleteSample = async (s) => {
    const ok = await confirmDialog({ title: `Delete "${s.name}" (${s.zone})?`, message: 'Also removes this sample from every dealer\'s Samples tab.', confirmText: 'Delete', danger: true });
    if (!ok) return;
    try { await api.deleteSample(s.id); setMsg(`✓ ${s.name} deleted`); }
    catch (e) { setMsg('Delete failed: ' + e.message); }
  };

  const deleteAll = async () => {
    const ok = await confirmDialog({ title: 'Delete ALL samples from database?', message: 'This wipes every sample AND every dealer-sample-given record. Cannot be undone.', confirmText: 'Delete Everything', danger: true });
    if (!ok) return;
    try { const r = await api.deleteAllSamples(); setMsg(`✓ Deleted ${r.samplesDeleted || 0} samples + ${r.givenDeleted || 0} given records`); setRefresh(x => x + 1); }
    catch (e) { setMsg('Delete failed: ' + e.message); }
  };

  const onCounts = c => setCounts(p => ({ ...p, ...c }));
  const tabCard = (k, Icon, label, desc, tone, badge) => (
    <button type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={'smt-tab' + (tab === k ? ' on' : '')} style={{ '--tone': tone }}>
      <span className="smt-ico"><Icon size={19} /></span>
      <span className="smt-txt"><div className="smt-t">{label}</div><div className="smt-d">{desc}</div></span>
      {badge}
    </button>
  );

  return (
    <div>
      <style>{CSS}</style>
      <div className="smt-tabs" role="tablist" aria-label="Samples">
        {tabCard('master', Package, 'Sample master', 'Add samples, stock by zone, sheets', 'var(--acc)',
          counts.samples != null && <span className="smt-n" title="samples in the master">{Number(counts.samples).toLocaleString('en-IN')}</span>)}
        {tabCard('status', ListChecks, 'Samples status', 'Requests, to give, with dealers, take back', 'var(--pur)',
          counts.requests > 0 && <span className="smt-n" style={{ '--tone': 'var(--yel)' }} title="salesman requests waiting for approval">{Number(counts.requests).toLocaleString('en-IN')}</span>)}
      </div>

      {tab === 'master' && (
        <>
          <SampleAllocationPanel key={'m' + refresh} view="master" onDelete={deleteSample} onCounts={onCounts} />
          {/* housekeeping: the given-records sheet, the template, merges, the wipe */}
          <div className="card smt-hk">
            <div className="sec-title" style={{ marginBottom: 4 }}><span className="sec-ico" style={{ '--tone': 'var(--t2)' }}><Wrench size={15} /></span> Housekeeping <span className="sec-note">sheets &amp; clean-up</span></div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.5 }}>The dealer-wise sheet <strong style={{ color: 'var(--t2)' }}>Company Name | Product | Total</strong> records what each dealer already holds. Download the template to edit the current state.</div>
            <div className="smt-hk-row">
              <button onClick={async () => { setDownloadingTpl(true); setMsg(''); try { await api.downloadSampleTemplate(); setMsg('✓ Template downloaded'); } catch (e) { setMsg('Download failed: ' + e.message); } setDownloadingTpl(false); }} disabled={downloadingTpl} className="btn smt-b">
                <Download size={14} />{downloadingTpl ? 'Building…' : 'Download template'}
              </button>
              <input ref={givenFileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleUploadGiven(e.target.files[0]); e.target.value = ''; }} />
              <button onClick={() => givenFileRef.current?.click()} disabled={uploadingGiven} className="btn smt-b">
                <Upload size={14} />{uploadingGiven ? 'Uploading…' : 'Upload what dealers hold'}
              </button>
              <button onClick={async () => { setMsg(''); try { const r = await api.cleanupSampleMaster(); setMsg(`✓ Merged ${r.merged || 0} duplicate rows, kept ${r.kept || 0}`); setRefresh(x => x + 1); } catch (e) { setMsg('Cleanup failed: ' + e.message); } }} className="btn smt-b" title="Merge rows of the same sample and zone">
                <RefreshCw size={13} />Merge duplicates
              </button>
            </div>
            <div className="smt-danger">
              <span className="sec-ico" style={{ '--tone': 'var(--red)' }}><AlertTriangle size={15} /></span>
              <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--red)' }}>Danger zone</div>
                <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Wipes every sample and every dealer-sample-given record. Cannot be undone.</div>
              </div>
              <button onClick={deleteAll} className="btnd smt-b">
                <Trash2 size={14} />Delete all
              </button>
            </div>
            {msg && <div className="smt-msg" role="status" style={{ '--tone': msg.startsWith('✓') ? 'var(--grn)' : 'var(--red)' }}>
              {msg.startsWith('✓') ? <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
              <span>{msg.startsWith('✓') ? msg.slice(1).trim() : msg}</span>
            </div>}
          </div>
        </>
      )}

      {tab === 'status' && <SampleAllocationPanel key={'s' + refresh} view="status" onCounts={onCounts} />}
    </div>
  );
}
