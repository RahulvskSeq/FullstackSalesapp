import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Save, CheckSquare, Square, Download, Upload, X, Search } from 'lucide-react';
import { useMonth } from '../context';
import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
import { uid, num } from '../utils';

const MONTHS_OPTS = MO.map((m,i)=>({label:m,value:i}));

export default function SalesEntry({ dealers, users, onUpdateDealer, onAddDealer }) {
  const salesmen = Object.values(users).filter(u=>u.role==='salesman');

  // ── Form state ──────────────────────────────────────
  const [form, setForm] = useState({
    salesman: salesmen[0]?.id || '',
    dealer: '',
    customDealer: '',
    monthIdx: CURRENT_MONTH_IDX,
    category: '',
    categoryType: '',
    qty: '',
    target: '',
    status: 'ACTIVE',
    zone: '',
    city: '',
    state: '',
  });
  const [entries, setEntries] = useState([]); // staged entries before save
  const [search, setSearch] = useState('');
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState('entry'); // 'entry' | 'bulk' | 'history'

  // Dealers filtered by selected salesman
  const smDealers = useMemo(() =>
    dealers.filter(d => d.salesman === form.salesman)
      .sort((a,b)=>a.name.localeCompare(b.name))
  , [dealers, form.salesman]);

  const filteredDealers = useMemo(() =>
    smDealers.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))
  , [smDealers, search]);

  // All unique categories/types from dealers
  const allCats  = useMemo(()=>[...new Set(dealers.map(d=>d.category).filter(Boolean))].sort(),[dealers]);
  const allTypes = useMemo(()=>[...new Set(dealers.filter(d=>!form.category||d.category===form.category).map(d=>d.categoryType).filter(Boolean))].sort(),[dealers,form.category]);

  const sel = form.dealer; // selected dealer id
  const selDealer = dealers.find(d=>d.id===sel);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // ── Add entry to staging list ────────────────────────
  const addEntry = () => {
    const dealerName = sel ? selDealer?.name : form.customDealer.trim();
    if(!dealerName || !form.qty || num(form.qty)<=0) return;
    setEntries(e=>[...e, {
      id: uid(),
      salesman: form.salesman,
      dealerId: sel||null,
      dealerName,
      monthIdx: Number(form.monthIdx),
      month: MO[form.monthIdx],
      category: form.category,
      categoryType: form.categoryType,
      qty: num(form.qty),
      target: num(form.target)||0,
      status: form.status,
      zone: form.zone,
      city: form.city,
      state: form.state,
      isNew: !sel,
    }]);
    // Reset qty only, keep other fields for fast bulk entry
    set('qty','');
    setSaved(false);
  };

  const removeEntry = id => setEntries(e=>e.filter(x=>x.id!==id));

  // ── Save all staged entries ──────────────────────────
  const saveAll = () => {
    entries.forEach(entry => {
      if(entry.dealerId){
        // Existing dealer — update months
        const d = dealers.find(x=>x.id===entry.dealerId);
        if(!d) return;
        const newMonths = [...d.months];
        newMonths[entry.monthIdx] = (newMonths[entry.monthIdx]||0) + entry.qty; // ADDITIVE — adds to existing
        const updates = { months: newMonths, achieved: newMonths[newMonths.length-1] };
        if(entry.category)     updates.category     = entry.category;
        if(entry.categoryType) updates.categoryType = entry.categoryType;
        if(entry.target>0)     updates.target       = entry.target;
        if(entry.status)       updates.status       = entry.status;
        if(entry.zone)         updates.zone         = entry.zone;
        if(entry.city)         updates.city         = entry.city;
        if(entry.state)        updates.state        = entry.state;
        onUpdateDealer(entry.dealerId, updates);
      } else {
        // New dealer
        onAddDealer({
          id: entry.salesman+'_new_'+entry.dealerName.replace(/\W/g,'_')+'_'+uid(),
          name: entry.dealerName,
          salesman: entry.salesman,
          status: entry.status||'ACTIVE',
          category: entry.category,
          categoryType: entry.categoryType,
          zone: entry.zone,
          city: entry.city,
          state: entry.state,
          target: entry.target,
          achieved: entry.monthIdx===CURRENT_MONTH_IDX?entry.qty:0,
          avg6m: 0, creditDays:0, creditLimit:0,
          months: Object.assign(new Array(11).fill(0), {[entry.monthIdx]:entry.qty}),
          monthTargets: entry.target>0?{[entry.monthIdx]:entry.target}:{},
          categoryBreakdown: {},
        });
      }
    });
    setSaved(true);
    setEntries([]);
  };

  // ── Export entries as CSV ────────────────────────────
  const exportCSV = () => {
    const rows = [
      ['Date','Dealer Name','Salesman','Category','Sub Category','Qty','Target','Status','Zone','City','State'],
      ...entries.map(e=>[
        MO[e.monthIdx], e.dealerName,
        users[e.salesman]?.name||e.salesman,
        e.category, e.categoryType, e.qty, e.target,
        e.status, e.zone, e.city, e.state,
      ])
    ];
    const csv = rows.map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);
    a.download=`sales_entries_${Date.now()}.csv`;
    a.click();
  };

  const totalQty = entries.reduce((s,e)=>s+e.qty,0);

  return (
    <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:4}}>Sales Entry</div>
        <div style={{fontSize:18,fontWeight:700}}>Add Sales Data Directly</div>
        <div style={{fontSize:12,color:'var(--t3)',marginTop:4}}>Enter data here — no need to update Google Sheets every month</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:14,alignItems:'start'}}>

        {/* ── Entry Form ── */}
        <div className="card">
          {/* Salesman selector */}
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
            {salesmen.map(s=>(
              <button key={s.id} onClick={()=>{set('salesman',s.id);set('dealer','');}}
                style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',borderRadius:8,cursor:'pointer',
                  background:form.salesman===s.id?s.color+'22':'var(--bg2)',
                  border:`1.5px solid ${form.salesman===s.id?s.color:'var(--b2)'}`,
                  color:form.salesman===s.id?s.color:'var(--t2)',fontWeight:form.salesman===s.id?700:400,fontSize:12}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:s.color+'33',color:s.color,border:`1px solid ${s.color}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700}}>{s.ini}</div>
                {s.name}
              </button>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {/* Month */}
            <div className="field">
              <label>Month *</label>
              <select className="sel inp" value={form.monthIdx} onChange={e=>set('monthIdx',e.target.value)}>
                {MONTHS_OPTS.map(m=>(
                  <option key={m.value} value={m.value}>{m.label}{m.value===CURRENT_MONTH_IDX?' (Current)':''}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="field">
              <label>Status</label>
              <select className="sel inp" value={form.status} onChange={e=>set('status',e.target.value)}>
                {['ACTIVE','KEY ACCOUNT','ACHIVERS','INACTIVE','DEAD','NEW'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Dealer */}
            <div className="field full">
              <label>Dealer * {sel&&<span style={{color:'var(--acc)',fontWeight:400}}>— existing</span>}{!sel&&form.customDealer&&<span style={{color:'#34d399',fontWeight:400}}>— new dealer</span>}</label>
              <div style={{position:'relative'}}>
                <Search size={13} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--t3)'}}/>
                <input className="inp" style={{paddingLeft:32}} placeholder="Search existing dealer or type new name..."
                  value={sel?selDealer?.name:form.customDealer}
                  onChange={e=>{set('dealer','');set('customDealer',e.target.value);setSearch(e.target.value);}}
                  onFocus={e=>setSearch(e.target.value)}
                />
                {sel&&<button onClick={()=>{set('dealer','');set('customDealer','');setSearch('');}}
                  style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'var(--t3)',cursor:'pointer'}}><X size={12}/></button>}
              </div>
              {/* Dropdown */}
              {!sel && search && (
                <div style={{border:'1px solid var(--b2)',borderRadius:8,background:'var(--bg1)',marginTop:4,maxHeight:180,overflowY:'auto',zIndex:20,position:'relative'}}>
                  {filteredDealers.slice(0,8).map(d=>(
                    <div key={d.id} onClick={()=>{set('dealer',d.id);set('customDealer',d.name);setSearch('');
                      if(d.category)set('category',d.category);
                      if(d.categoryType)set('categoryType',d.categoryType);
                      if(d.zone)set('zone',d.zone);
                      if(d.city)set('city',d.city);
                      if(d.state)set('state',d.state);
                    }}
                      style={{padding:'8px 12px',cursor:'pointer',fontSize:12,display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid var(--b1)'}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <span style={{fontWeight:500,color:'var(--t1)'}}>{d.name}</span>
                      <span style={{fontSize:10,color:'var(--t3)'}}>{d.category||''} {d.city||''}</span>
                    </div>
                  ))}
                  {form.customDealer&&!filteredDealers.find(d=>d.name.toLowerCase()===form.customDealer.toLowerCase())&&(
                    <div style={{padding:'8px 12px',fontSize:12,color:'#34d399',borderTop:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:6}}>
                      <Plus size={11}/> Create new: <strong>{form.customDealer}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category */}
            <div className="field">
              <label>Main Category</label>
              <input className="inp" list="cat-list" placeholder="e.g. LAMINATE" value={form.category} onChange={e=>set('category',e.target.value)}/>
              <datalist id="cat-list">{allCats.map(c=><option key={c} value={c}/>)}</datalist>
            </div>

            {/* Sub Category */}
            <div className="field">
              <label>Sub Category</label>
              <input className="inp" list="type-list" placeholder="e.g. 1 MM" value={form.categoryType} onChange={e=>set('categoryType',e.target.value)}/>
              <datalist id="type-list">{allTypes.map(t=><option key={t} value={t}/>)}</datalist>
            </div>

            {/* Qty */}
            <div className="field">
              <label>Qty / Units *</label>
              <input className="inp" type="number" min="0" placeholder="0"
                value={form.qty} onChange={e=>set('qty',e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addEntry()}
                style={{fontSize:18,fontWeight:700,color:'#34d399'}}/>
            </div>

            {/* Target */}
            <div className="field">
              <label>Target (optional)</label>
              <input className="inp" type="number" min="0" placeholder="0"
                value={form.target} onChange={e=>set('target',e.target.value)}/>
            </div>

            {/* Zone / City / State */}
            <div className="field">
              <label>Zone</label>
              <input className="inp" placeholder="e.g. North" value={form.zone} onChange={e=>set('zone',e.target.value)}/>
            </div>
            <div className="field">
              <label>City</label>
              <input className="inp" placeholder="e.g. Hyderabad" value={form.city} onChange={e=>set('city',e.target.value)}/>
            </div>
            <div className="field full">
              <label>State</label>
              <input className="inp" placeholder="e.g. Telangana" value={form.state} onChange={e=>set('state',e.target.value)}/>
            </div>
          </div>

          <button onClick={addEntry} className="btnp" style={{width:'100%',justifyContent:'center',marginTop:4,padding:12,fontSize:14}}
            disabled={(!sel&&!form.customDealer.trim())||!form.qty||num(form.qty)<=0}>
            <Plus size={15}/> Add to Queue ({entries.length} pending)
          </button>
        </div>

        {/* ── Staged Entries ── */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>

          {/* Summary card */}
          <div className="card">
            <div style={{fontSize:12,fontWeight:600,color:'var(--t2)',marginBottom:10}}>Entry Queue</div>
            {entries.length===0?(
              <div style={{textAlign:'center',padding:'20px 0',color:'var(--t3)',fontSize:12}}>
                <Plus size={24} style={{margin:'0 auto 8px',opacity:0.3}}/>
                No entries yet.<br/>Fill the form and click Add.
              </div>
            ):(
              <>
                <div style={{maxHeight:320,overflowY:'auto',marginBottom:10}}>
                  {entries.map(e=>(
                    <div key={e.id} style={{padding:'8px 0',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {e.dealerName}
                          {e.isNew&&<span style={{fontSize:9,background:'rgba(52,211,153,0.15)',color:'#34d399',padding:'1px 5px',borderRadius:4,marginLeft:4}}>NEW</span>}
                        </div>
                        <div style={{fontSize:10,color:'var(--t3)',display:'flex',gap:6,flexWrap:'wrap',marginTop:2}}>
                          <span>{e.month}</span>
                          {e.category&&<span>· {e.category}{e.categoryType?'/'+e.categoryType:''}</span>}
                          <span style={{color:'var(--acc)',fontWeight:700}}>· {e.qty} units</span>
                          {e.target>0&&<span>· tgt:{e.target}</span>}
                        </div>
                      </div>
                      <button onClick={()=>removeEntry(e.id)} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer',flexShrink:0,padding:4}}>
                        <X size={12}/>
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{padding:'10px',background:'var(--bg2)',borderRadius:8,marginBottom:10,display:'flex',justifyContent:'space-between'}}>
                  <span style={{fontSize:12,color:'var(--t3)'}}>{entries.length} entries · {[...new Set(entries.map(e=>e.dealerName))].length} dealers</span>
                  <span style={{fontSize:14,fontWeight:700,color:'#34d399'}}>{totalQty} units</span>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <button onClick={saveAll} className="btnp" style={{justifyContent:'center',padding:10,fontSize:13}}>
                    <Save size={13}/> Save All to App
                  </button>
                  <button onClick={exportCSV} className="btn" style={{justifyContent:'center',display:'flex',alignItems:'center',gap:5,fontSize:12}}>
                    <Download size={12}/> Export as CSV
                  </button>
                  <button onClick={()=>setEntries([])} className="btn" style={{color:'var(--red)',fontSize:12}}>
                    <X size={12} style={{display:'inline',verticalAlign:'middle'}}/> Clear All
                  </button>
                </div>
              </>
            )}

            {saved&&(
              <div style={{marginTop:10,padding:'8px 12px',background:'rgba(52,211,153,0.1)',border:'1px solid rgba(52,211,153,0.3)',borderRadius:8,fontSize:12,color:'#34d399',textAlign:'center'}}>
                ✓ Saved successfully!
              </div>
            )}
          </div>

          {/* Quick stats for selected dealer */}
          {selDealer&&(
            <div className="card">
              <div style={{fontSize:11,fontWeight:600,color:'var(--t3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.07em'}}>Current Data — {selDealer.name.slice(0,20)}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {[
                  {l:'This Month',v:selDealer.months[CURRENT_MONTH_IDX]||0,c:'#34d399'},
                  {l:'Target',v:selDealer.target||'—',c:'var(--t2)'},
                  {l:'11mo Total',v:selDealer.months.reduce((a,b)=>a+b,0),c:'var(--acc)'},
                  {l:'Best Month',v:Math.max(...selDealer.months),c:'#fbbf24'},
                ].map(k=>(
                  <div key={k.l} style={{background:'var(--bg2)',borderRadius:7,padding:'7px 10px'}}>
                    <div style={{fontSize:9,color:'var(--t3)',marginBottom:2,textTransform:'uppercase'}}>{k.l}</div>
                    <div style={{fontSize:16,fontWeight:700,color:k.c}}>{k.v}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:10,display:'flex',gap:3,alignItems:'flex-end',height:40}}>
                {selDealer.months.map((v,i)=>{
                  const mx=Math.max(...selDealer.months,1);
                  return<div key={i} style={{flex:1,height:Math.max((v/mx)*38,v>0?3:1),background:i===CURRENT_MONTH_IDX?'#6366f1':'var(--b2)',borderRadius:'2px 2px 0 0'}}/>;
                })}
              </div>
              <div style={{display:'flex',gap:3,marginTop:2}}>
                {MO.map((m,i)=><div key={i} style={{flex:1,fontSize:5,color:'var(--t3)',textAlign:'center',overflow:'hidden'}}>{m.slice(0,1)}</div>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}