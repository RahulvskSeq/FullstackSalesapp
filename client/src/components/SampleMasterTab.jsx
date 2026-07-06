import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Upload, Trash2, RefreshCw, Package, Plus, Download } from 'lucide-react';
import { confirmDialog } from './Toast';

export default function SampleMasterTab() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingGiven, setUploadingGiven] = useState(false);
  const [downloadingTpl, setDownloadingTpl] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef();
  const givenFileRef = useRef();

  useEffect(() => { loadSamples(); }, []);

  const loadSamples = async () => {
    setLoading(true);
    try { const d = await api.getSamples(); setSamples(d||[]); }
    catch(e) { console.warn(e); }
    setLoading(false);
  };

  const handleUpload = async (file) => {
    if(!file) return;
    setUploading(true); setMsg('');
    try {
      const res = await api.uploadSamples(file);
      setMsg(`✓ ${res.added||0} added, ${res.updated||0} updated`);
      await loadSamples();
    } catch(e) { setMsg('Error: '+e.message); }
    setUploading(false);
  };

  // Bulk upload of "dealer × sample" — which dealer already has which
  // sample. Records show up as ticked in the DealerModal Samples tab.
  const handleUploadGiven = async (file) => {
    if (!file) return;
    setUploadingGiven(true); setMsg('');
    try {
      const res = await api.uploadSamplesGiven(file);
      setMsg(`✓ ${res.added || 0} sample assignments added, ${res.skipped || 0} already existed`);
      await loadSamples();  // in case new samples were auto-created
    } catch (e) { setMsg('Error: ' + e.message); }
    setUploadingGiven(false);
  };

  const deleteSample = async (id, name) => {
    const ok = await confirmDialog({
      title: `Delete "${name}"?`,
      message: 'Also removes this sample from every dealer\'s Samples tab.',
      confirmText: 'Delete',
      danger: true,
    });
    if(!ok) return;
    try {
      await api.deleteSample(id);
      setSamples(s => s.filter(x => x._id !== id));
      setMsg('✓ Sample deleted');
    } catch (e) { setMsg('Delete failed: ' + e.message); }
  };

  // Nuclear: wipe entire Sample master + all given records. Server enforces
  // superadmin — non-superadmins will get a 403.
  const deleteAll = async () => {
    const ok = await confirmDialog({
      title: 'Delete ALL samples from database?',
      message: `This wipes every sample (${samples.length} rows) AND every dealer-sample-given record. Cannot be undone.`,
      confirmText: 'Delete Everything',
      danger: true,
    });
    if (!ok) return;
    try {
      const r = await api.deleteAllSamples();
      setMsg(`✓ Deleted ${r.samplesDeleted||0} samples + ${r.givenDeleted||0} given records`);
      await loadSamples();
    } catch (e) { setMsg('Delete failed: ' + e.message); }
  };

  const zones = [...new Set(samples.map(s=>s.zone))].sort();

  const [newName,     setNewName]     = useState('');
  const [newZone,     setNewZone]     = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [adding,      setAdding]      = useState(false);
  const [showAdd,     setShowAdd]     = useState(false);

  const addSingle = async () => {
    if(!newName.trim()||!newZone.trim()){ setMsg('Name and Zone required'); return; }
    setAdding(true); setMsg('');
    try {
      await api.addSample({ name:newName.trim(), zone:newZone.trim(), category:newCategory.trim() });
      setMsg('✓ Sample added');
      setNewName(''); setNewZone(''); setNewCategory('');
      setShowAdd(false);
      await loadSamples();
    } catch(e){ setMsg('Error: '+e.message); }
    setAdding(false);
  };

  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Sample Master</div>
        <div style={{fontSize:12,color:'var(--t3)',marginBottom:12}}>
          Excel format: <strong>Company Name | Product | Zone</strong>. Zone cell holds free tags like "All Zones", "ZONE 2 & 5", or "NEW DEALERS ONLY".
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          {/* 1) Download the current state as an editable template. */}
          <button
            onClick={async () => {
              setDownloadingTpl(true); setMsg('');
              try { await api.downloadSampleTemplate(); setMsg('✓ Template downloaded'); }
              catch (e) { setMsg('Download failed: ' + e.message); }
              setDownloadingTpl(false);
            }}
            disabled={downloadingTpl}
            className="btn"
            style={{display:'flex',alignItems:'center',gap:6,color:'#fbbf24',border:'1px solid rgba(251,191,36,0.4)',padding:'8px 14px'}}>
            <Download size={14}/>{downloadingTpl?'Building…':'Download Sample'}
          </button>
          {/* 2) Upload the filled-in file. Server handles both master
              (via auto-create) and given records in one shot. */}
          <input ref={givenFileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
            onChange={e=>{if(e.target.files[0])handleUploadGiven(e.target.files[0]);e.target.value='';}}/>
          <button onClick={()=>givenFileRef.current?.click()} disabled={uploadingGiven} className="btnp"
            style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px'}}>
            <Upload size={14}/>{uploadingGiven?'Uploading…':'Upload'}
          </button>
          {/* One-shot cleanup — merge duplicate sample master entries that
              were created by the earlier buggy parenthesis parser. Safe to
              run repeatedly. */}
          <button
            onClick={async () => {
              setMsg('');
              try {
                const r = await api.cleanupSampleMaster();
                setMsg(`✓ Merged ${r.merged || 0} duplicate rows, kept ${r.kept || 0}`);
                await loadSamples();
              } catch (e) { setMsg('Cleanup failed: ' + e.message); }
            }}
            className="btn"
            style={{display:'flex',alignItems:'center',gap:6,color:'var(--t3)',fontSize:11}}>
            <RefreshCw size={12}/>Merge duplicates
          </button>
          {/* Nuclear "Delete All" — wipes master + given records. Server
              gates by superadmin. Pushed to the right so it's not next to
              regular actions. */}
          <button
            onClick={deleteAll}
            className="btn"
            style={{display:'flex',alignItems:'center',gap:6,color:'#f87171',
              border:'1px solid rgba(248,113,113,0.4)',padding:'8px 14px',
              fontSize:12,marginLeft:'auto'}}>
            <Trash2 size={13}/>Delete All
          </button>
          {msg&&<span style={{fontSize:11,color:msg.startsWith('✓')?'#34d399':'#f87171'}}>{msg}</span>}
        </div>
      </div>

      {/* Add single sample form */}
      {showAdd&&(
        <div className="card" style={{marginBottom:14,padding:14,background:'rgba(99,102,241,0.05)',border:'1px solid rgba(99,102,241,0.2)'}}>
          <div style={{fontSize:12,fontWeight:600,marginBottom:10,color:'var(--acc)'}}>Add Single Sample</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Sample Name *</label>
              <input className="inp" value={newName} onChange={e=>setNewName(e.target.value)}
                placeholder="e.g. Wood Filler" style={{width:'100%'}}
                onKeyDown={e=>e.key==='Enter'&&addSingle()}/>
            </div>
            <div>
              <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Zone *</label>
              <input className="inp" value={newZone} onChange={e=>setNewZone(e.target.value)}
                placeholder="e.g. ZONE 1" style={{width:'100%'}}
                list="zone-list"
                onKeyDown={e=>e.key==='Enter'&&addSingle()}/>
              <datalist id="zone-list">
                {zones.map(z=><option key={z} value={z}/>)}
              </datalist>
            </div>
            <div>
              <label style={{fontSize:10,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase'}}>Category</label>
              <input className="inp" value={newCategory} onChange={e=>setNewCategory(e.target.value)}
                placeholder="e.g. Wood Care" style={{width:'100%'}}
                onKeyDown={e=>e.key==='Enter'&&addSingle()}/>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button onClick={addSingle} disabled={adding} className="btnp" style={{fontSize:12,display:'flex',alignItems:'center',gap:5}}>
              {adding?<RefreshCw size={11} style={{animation:'spin .7s linear infinite'}}/>:<Plus size={11}/>}
              {adding?'Adding...':'Add Sample'}
            </button>
            <button onClick={()=>setShowAdd(false)} className="btn" style={{fontSize:12}}>Cancel</button>
          </div>
        </div>
      )}

      {/* Sample template hint */}
      <div style={{background:'var(--bg2)',borderRadius:8,padding:12,marginBottom:14,fontSize:11,color:'var(--t3)'}}>
        <strong style={{color:'var(--t2)'}}>Excel format:</strong>
        <div style={{fontFamily:'monospace',marginTop:6,background:'var(--bg1)',padding:8,borderRadius:6}}>
          Sample Name | Zone | Category<br/>
          Wood Filler | ZONE 1 | Wood Care<br/>
          PU Primer   | ZONE 2 | Primer<br/>
          Edge Band   | ZONE 1 | Accessories
        </div>
      </div>

      {/* Summary by zone */}
      {zones.length > 0 && (
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
          {zones.map(z=>{
            const count = samples.filter(s=>s.zone===z).length;
            return(
              <div key={z} style={{background:'rgba(99,102,241,0.08)',border:'1px solid rgba(99,102,241,0.2)',
                borderRadius:8,padding:'8px 14px',textAlign:'center'}}>
                <div style={{fontSize:10,color:'var(--t3)',marginBottom:2}}>{z}</div>
                <div style={{fontSize:18,fontWeight:700,color:'var(--acc)'}}>{count}</div>
                <div style={{fontSize:9,color:'var(--t3)'}}>samples</div>
              </div>
            );
          })}
          <div style={{background:'rgba(52,211,153,0.08)',border:'1px solid rgba(52,211,153,0.2)',
            borderRadius:8,padding:'8px 14px',textAlign:'center'}}>
            <div style={{fontSize:10,color:'var(--t3)',marginBottom:2}}>Total</div>
            <div style={{fontSize:18,fontWeight:700,color:'#34d399'}}>{samples.length}</div>
            <div style={{fontSize:9,color:'var(--t3)'}}>samples</div>
          </div>
        </div>
      )}

      {/* Sample list grouped by zone */}
      {loading ? (
        <div style={{textAlign:'center',padding:30,color:'var(--t3)'}}>Loading...</div>
      ) : samples.length === 0 ? (
        <div style={{textAlign:'center',padding:40,color:'var(--t3)'}}>
          <Package size={32} style={{marginBottom:10,opacity:.3}}/>
          <div style={{fontSize:13}}>No samples yet — upload your Excel file</div>
        </div>
      ) : (
        <div className="card" style={{padding:0,overflow:'hidden'}}>
          <table>
            <thead><tr>
              <th>#</th><th>Sample Name</th><th>Zone</th><th>Category</th><th></th>
            </tr></thead>
            <tbody>
              {[...samples].sort((a,b)=>a.zone.localeCompare(b.zone)||a.name.localeCompare(b.name)).map((s,i)=>(
                <tr key={s._id}>
                  <td style={{color:'var(--t3)',fontSize:11}}>{i+1}</td>
                  <td style={{fontWeight:500}}>{s.name}</td>
                  <td><span style={{background:'rgba(99,102,241,0.1)',color:'var(--acc)',padding:'2px 8px',borderRadius:4,fontSize:11}}>{s.zone}</span></td>
                  <td style={{color:'var(--t3)',fontSize:11}}>{s.category||'—'}</td>
                  <td>
                    <button onClick={()=>deleteSample(s._id, s.name)}
                      title="Delete this sample"
                      style={{
                        display:'flex', alignItems:'center', gap:4,
                        background:'rgba(248,113,113,0.10)',
                        border:'1px solid rgba(248,113,113,0.35)',
                        color:'#f87171', cursor:'pointer',
                        padding:'4px 10px', borderRadius:6,
                        fontSize:11, fontWeight:600,
                      }}>
                      <Trash2 size={13}/>Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}