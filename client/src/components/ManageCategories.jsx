import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Check, X, Tag, RefreshCw, Layers } from 'lucide-react';
import { api } from '../api';
import { notify, confirmDialog } from './Toast';

/**
 * ManageCategories — admin UI for the Category Type / Sub-Category Type taxonomy.
 *
 * Anyone can VIEW. Only admin / superadmin can mutate (server enforces this).
 *
 * Layout: left column = categories (with add/rename/delete),
 *         right column = sub-categories of the selected category.
 */
const ManageCategories = ({ currentUser }) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const [cats, setCats]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [selId, setSelId]     = useState(null);

  const [newCat, setNewCat]   = useState('');
  const [newSub, setNewSub]   = useState('');
  const [renameCat, setRenameCat] = useState({ id:null, name:'' });
  const [renameSub, setRenameSub] = useState({ id:null, name:'' });

  const load = async () => {
    setLoading(true);
    try {
      const list = await api.categoriesList();
      setCats(list);
      if(!selId && list.length) setSelId(list[0]._id);
    } catch(e) { notify.error(`Failed to load categories: ${e.message}`); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, []);

  const selected = cats.find(c => c._id === selId);

  const addCategory = async () => {
    const name = newCat.trim();
    if(!name) return;
    try {
      const cat = await api.categoryCreate({ name });
      setNewCat('');
      await load();
      setSelId(cat._id);
      notify.success(`Added category “${name}”`);
    } catch(e) { notify.error(e.message); }
  };

  const removeCategory = async (cat) => {
    const ok = await confirmDialog({
      title: 'Delete Category?',
      message: `Delete “${cat.name}” and all its sub-categories?\nThis does NOT delete existing sales data — only the taxonomy entry.`,
      confirmText: 'Delete',
      danger: true,
    });
    if(!ok) return;
    try { await api.categoryDelete(cat._id); await load(); notify.success('Deleted'); }
    catch(e) { notify.error(e.message); }
  };

  const saveCatRename = async () => {
    if(!renameCat.id || !renameCat.name.trim()) { setRenameCat({id:null,name:''}); return; }
    try {
      await api.categoryUpdate(renameCat.id, { name: renameCat.name.trim() });
      setRenameCat({id:null,name:''});
      await load();
    } catch(e) { notify.error(e.message); }
  };

  const addSub = async () => {
    const name = newSub.trim();
    if(!selId || !name) return;
    try {
      await api.subCategoryAdd(selId, name);
      setNewSub('');
      await load();
      notify.success(`Added “${name}” under ${selected.name}`);
    } catch(e) { notify.error(e.message); }
  };

  const removeSub = async (sub) => {
    const ok = await confirmDialog({
      title: 'Delete Sub-Category?',
      message: `Remove “${sub.name}” from ${selected.name}?`,
      confirmText: 'Delete',
      danger: true,
    });
    if(!ok) return;
    try { await api.subCategoryDelete(selId, sub._id); await load(); }
    catch(e) { notify.error(e.message); }
  };

  const saveSubRename = async () => {
    if(!renameSub.id || !renameSub.name.trim()) { setRenameSub({id:null,name:''}); return; }
    try {
      await api.subCategoryUpdate(selId, renameSub.id, renameSub.name.trim());
      setRenameSub({id:null,name:''});
      await load();
    } catch(e) { notify.error(e.message); }
  };

  const reseed = async () => {
    const ok = await confirmDialog({
      title: 'Re-seed default taxonomy?',
      message: 'This will add any missing categories from the default list (LAMINATE, POLYMER SHEET, ROLLS, …). Existing entries are kept.',
    });
    if(!ok) return;
    try { const r = await api.categoriesSeed(); await load(); notify.success(`Seeded → ${r.inserted} new, ${r.updated} updated`); }
    catch(e) { notify.error(e.message); }
  };

  return (
    <div className="fade">
      <div className="row" style={{marginBottom:14}}>
        <div className="sec-title" style={{marginBottom:0}}>
          <span className="sec-ico" style={{'--tone':'var(--pur)'}}><Layers size={15}/></span> Category Types &amp; Product Types
        </div>
        <div className="spacer"/>
        <button className="btn" onClick={load} disabled={loading}>
          <RefreshCw size={13} className={loading?'spin':''}/> Refresh
        </button>
        {isAdmin && (
          <button className="btn" onClick={reseed} title="Add missing default categories">
            Seed defaults
          </button>
        )}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
        {/* ──────── Categories column ──────── */}
        <div className="card" style={{padding:12}}>
          <div className="sec-title">
            <span className="sec-ico" style={{'--tone':'var(--pur)'}}><Tag size={15}/></span> Category Types ({cats.length})
          </div>

          {isAdmin && (
            <div style={{display:'flex',gap:6,marginBottom:10}}>
              <input
                value={newCat}
                onChange={e=>setNewCat(e.target.value)}
                onKeyDown={e=>e.key==='Enter' && addCategory()}
                placeholder="New category, e.g. LAMINATE"
                className="inp"
                style={{flex:1}}
              />
              <button className="btnp" onClick={addCategory}><Plus size={13}/></button>
            </div>
          )}

          <div style={{maxHeight:520,overflow:'auto',display:'flex',flexDirection:'column',gap:4}}>
            {cats.map(c => {
              const active = c._id === selId;
              const editing = renameCat.id === c._id;
              return (
                <div
                  key={c._id}
                  onClick={()=>setSelId(c._id)}
                  style={{
                    display:'flex',alignItems:'center',gap:6,
                    padding:'8px 10px',borderRadius:8,cursor:'pointer',
                    background: active ? 'color-mix(in srgb, var(--acc) 12%, transparent)' : 'transparent',
                    border: active ? '1px solid var(--acc)' : '1px solid transparent',
                  }}
                >
                  <Tag size={12} color={active ? 'var(--acc)' : 'var(--t3)'}/>
                  {editing ? (
                    <>
                      <input
                        value={renameCat.name}
                        onChange={e=>setRenameCat({...renameCat, name:e.target.value})}
                        onClick={e=>e.stopPropagation()}
                        onKeyDown={e=>e.key==='Enter' && saveCatRename()}
                        className="inp"
                        style={{flex:1}}
                        autoFocus
                      />
                      <button className="btnp" onClick={e=>{e.stopPropagation();saveCatRename();}}><Check size={12}/></button>
                      <button className="btn"  onClick={e=>{e.stopPropagation();setRenameCat({id:null,name:''});}}><X size={12}/></button>
                    </>
                  ) : (
                    <>
                      <div style={{flex:1,fontSize:13,fontWeight:600}}>{c.name}</div>
                      <span style={{fontSize:10,color:'var(--t3)'}}>{(c.subCategories||[]).length}</span>
                      {isAdmin && (
                        <>
                          <button className="btn" style={{padding:'3px 6px'}}
                            onClick={e=>{e.stopPropagation();setRenameCat({id:c._id,name:c.name});}}><Edit3 size={11}/></button>
                          <button className="btn" style={{padding:'3px 6px',color:'#ef4444'}}
                            onClick={e=>{e.stopPropagation();removeCategory(c);}}><Trash2 size={11}/></button>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            {cats.length === 0 && (
              <div style={{color:'var(--t3)',fontSize:12,padding:16,textAlign:'center'}}>
                No categories yet. {isAdmin ? 'Add one above or click “Seed defaults”.' : 'Ask an admin to add categories.'}
              </div>
            )}
          </div>
        </div>

        {/* ──────── Sub-categories column ──────── */}
        <div className="card" style={{padding:12}}>
          <div className="sec-title">
            <span className="sec-ico" style={{'--tone':'var(--pur)'}}><Layers size={15}/></span> {selected ? `Product Types in “${selected.name}”` : 'Product Types'}
          </div>

          {isAdmin && selected && (
            <div style={{display:'flex',gap:6,marginBottom:10}}>
              <input
                value={newSub}
                onChange={e=>setNewSub(e.target.value)}
                onKeyDown={e=>e.key==='Enter' && addSub()}
                placeholder={`New product type under ${selected.name}`}
                className="inp"
                style={{flex:1}}
              />
              <button className="btnp" onClick={addSub}><Plus size={13}/></button>
            </div>
          )}

          {!selected ? (
            <div style={{color:'var(--t3)',fontSize:12,padding:16,textAlign:'center'}}>Select a category on the left.</div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:6}}>
              {(selected.subCategories || []).map(s => {
                const editing = renameSub.id === s._id;
                return (
                  <div key={s._id} style={{
                    display:'flex',alignItems:'center',gap:4,
                    padding:'6px 10px',borderRadius:6,
                    background:'var(--bg1)',border:'1px solid var(--b1)',
                  }}>
                    {editing ? (
                      <>
                        <input
                          value={renameSub.name}
                          onChange={e=>setRenameSub({...renameSub, name:e.target.value})}
                          onKeyDown={e=>e.key==='Enter' && saveSubRename()}
                          className="inp"
                          style={{flex:1,fontSize:12}}
                          autoFocus
                        />
                        <button className="btnp" style={{padding:'2px 5px'}} onClick={saveSubRename}><Check size={11}/></button>
                        <button className="btn"  style={{padding:'2px 5px'}} onClick={()=>setRenameSub({id:null,name:''})}><X size={11}/></button>
                      </>
                    ) : (
                      <>
                        <div style={{flex:1,fontSize:12,fontWeight:500}}>{s.name}</div>
                        {isAdmin && (
                          <>
                            <button className="btn" style={{padding:'2px 5px'}}
                              onClick={()=>setRenameSub({id:s._id,name:s.name})}><Edit3 size={10}/></button>
                            <button className="btn" style={{padding:'2px 5px',color:'#ef4444'}}
                              onClick={()=>removeSub(s)}><Trash2 size={10}/></button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {(selected.subCategories || []).length === 0 && (
                <div style={{gridColumn:'1/-1',color:'var(--t3)',fontSize:12,padding:12,textAlign:'center'}}>
                  No product types yet. {isAdmin ? 'Add one above.' : ''}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;
