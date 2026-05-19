import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Upload, Trash2, RefreshCw, Package, Plus } from 'lucide-react';

export default function SampleMasterTab() {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef();

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

  const deleteSample = async (id) => {
    if(!confirm('Delete this sample?')) return;
    await api.deleteSample(id);
    setSamples(s=>s.filter(x=>x._id!==id));
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
          Upload Excel or add samples one by one
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:'none'}}
            onChange={e=>{if(e.target.files[0])handleUpload(e.target.files[0]);e.target.value='';}}/>
          <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="btnp"
            style={{display:'flex',alignItems:'center',gap:6}}>
            <Upload size={13}/>{uploading?'Uploading...':'Upload Excel'}
          </button>
          <button onClick={()=>setShowAdd(s=>!s)} className="btn"
            style={{display:'flex',alignItems:'center',gap:6,color:'var(--acc)',border:'1px solid rgba(99,102,241,0.3)'}}>
            <Plus size={13}/> Add Single Sample
          </button>
          <button onClick={loadSamples} className="btn" style={{display:'flex',alignItems:'center',gap:6}}>
            <RefreshCw size={13}/> Refresh
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
                    <button onClick={()=>deleteSample(s._id)}
                      style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',padding:3}}>
                      <Trash2 size={12}/>
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