import React, { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { uid, num } from '../utils';
import { useMonth } from '../context';
import { api } from '../api';

const ZONES    = ['ZONE 1','ZONE 2','ZONE 3','ZONE 4','ZONE 5'];
const STATUSES = ['ACTIVE','STAR','ACHIVERS','KEY ACCOUNT','RECENTLY INACTIVE','INACTIVE','DEAD','NEW','PROSPECT'];

const Field = ({label,children,full}) => (
  <div className={`field${full?' full':''}`}>
    <label style={{fontSize:11,color:'var(--t3)',display:'block',marginBottom:4,textTransform:'uppercase',letterSpacing:'.07em'}}>{label}</label>
    {children}
  </div>
);

const AddDealerModal = ({users, currentUser, onAdd, onClose, MO:propMO}) => {
  const { MO:ctxMO, currentMonthIdx } = useMonth();
  const MO = propMO || ctxMO;
  const currentMonth = MO[currentMonthIdx] || MO[MO.length-1];

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [d, setD] = useState({
    name:'', zone:'', status:'ACTIVE', city:'', state:'',
    category:'', categoryType:'',
    salesman: currentUser.role==='admin'
      ? (Object.values(users).find(u=>u.role==='salesman')?.id || '')
      : currentUser.id,
    target:0, achieved:0, creditDays:0, creditLimit:0,
  });

  const set = (k,v) => setD(prev=>({...prev,[k]:v}));

  const save = async () => {
    if(!d.name.trim()){ setError('Dealer name is required'); return; }
    setSaving(true); setError('');
    try {
      const months = new Array(MO.length).fill(0);
      const moIdx  = currentMonthIdx;
      months[moIdx] = num(d.achieved);
      const monthTargets = { [moIdx]: num(d.target) };

      const dealerData = {
        name:         d.name.trim(),
        salesman:     d.salesman,
        city:         d.city.trim(),
        state:        d.state.trim(),
        zone:         d.zone,
        status:       d.status,
        category:     d.category.trim(),
        categoryType: d.categoryType.trim(),
        target:       num(d.target),
        creditDays:   num(d.creditDays),
        creditLimit:  num(d.creditLimit),
        avg6m:        0,
        // For DB upload — store monthly data
        monthlyData:  { [currentMonth]: { achieved:num(d.achieved), target:num(d.target) } },
        source:       'manual',
      };

      // Try save to DB first
      let saved = null;
      const token = localStorage.getItem('stp_jwt');
      if(token){
        try { saved = await api.createDealer(dealerData); } catch(e){ console.warn('DB save failed, saving locally:', e.message); }
      }

      // Build app-format dealer for local state
      const appDealer = {
        id:           saved?._id || saved?.id || uid(),
        name:         dealerData.name,
        salesman:     dealerData.salesman,
        city:         dealerData.city,
        state:        dealerData.state,
        zone:         dealerData.zone,
        status:       dealerData.status,
        category:     dealerData.category,
        categoryType: dealerData.categoryType,
        target:       dealerData.target,
        creditDays:   dealerData.creditDays,
        creditLimit:  dealerData.creditLimit,
        avg6m:        0,
        months,
        monthTargets,
        achieved:     months[moIdx],
        categoryBreakdown: {},
        source:       'manual',
      };

      onAdd(appDealer);
      onClose();
    } catch(e) { setError(e.message); }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:520}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <div style={{fontSize:17,fontWeight:700}}>Add New Dealer</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--t3)',cursor:'pointer'}}><X size={18}/></button>
        </div>

        <div className="g2">
          <Field label="Dealer Name *" full>
            <input className="inp" value={d.name} onChange={e=>set('name',e.target.value)}
              placeholder="Full dealer/firm name" autoFocus
              onKeyDown={e=>e.key==='Enter'&&save()}/>
          </Field>

          <Field label="City">
            <input className="inp" value={d.city} onChange={e=>set('city',e.target.value)} placeholder="e.g. Hyderabad"/>
          </Field>

          <Field label="State">
            <input className="inp" value={d.state} onChange={e=>set('state',e.target.value)} placeholder="e.g. Telangana"/>
          </Field>

          <Field label="Zone">
            <select className="inp" value={d.zone} onChange={e=>set('zone',e.target.value)}>
              <option value="">— Select Zone —</option>
              {ZONES.map(z=><option key={z}>{z}</option>)}
            </select>
          </Field>

          <Field label="Status">
            <select className="inp" value={d.status} onChange={e=>set('status',e.target.value)}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
          </Field>

          <Field label="Category Type">
            <input className="inp" value={d.category} onChange={e=>set('category',e.target.value)} placeholder="e.g. LAMINATE"/>
          </Field>

          <Field label="Sub Category">
            <input className="inp" value={d.categoryType} onChange={e=>set('categoryType',e.target.value)} placeholder="e.g. 1 MM"/>
          </Field>

          {currentUser.role==='admin'&&(
            <Field label="Assign to Salesman" full>
              <select className="inp" value={d.salesman} onChange={e=>set('salesman',e.target.value)}>
                {Object.values(users).filter(u=>u.role==='salesman').map(u=>(
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </Field>
          )}

          <div style={{gridColumn:'1/-1',borderTop:'1px solid var(--b1)',paddingTop:12,marginTop:4}}>
            <div style={{fontSize:11,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>
              📅 {currentMonth} Data (optional)
            </div>
            <div className="g2">
              <Field label={`${currentMonth} Target`}>
                <input type="number" className="inp" value={d.target} onChange={e=>set('target',e.target.value)} placeholder="0"/>
              </Field>
              <Field label={`${currentMonth} Achieved`}>
                <input type="number" className="inp" value={d.achieved} onChange={e=>set('achieved',e.target.value)} placeholder="0"/>
              </Field>
              <Field label="Credit Days">
                <input type="number" className="inp" value={d.creditDays} onChange={e=>set('creditDays',e.target.value)} placeholder="0"/>
              </Field>
              <Field label="Credit Limit ₹">
                <input type="number" className="inp" value={d.creditLimit} onChange={e=>set('creditLimit',e.target.value)} placeholder="0"/>
              </Field>
            </div>
          </div>
        </div>

        {error&&<div style={{color:'#f87171',fontSize:12,marginTop:8,padding:'6px 10px',background:'rgba(248,113,113,0.08)',borderRadius:6}}>{error}</div>}

        <div style={{display:'flex',gap:8,marginTop:16}}>
          <button onClick={save} disabled={saving} className="btnp" style={{display:'flex',alignItems:'center',gap:6}}>
            {saving?<div style={{width:12,height:12,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>:<Save size={13}/>}
            {saving?'Saving...':'Add Dealer'}
          </button>
          <button onClick={onClose} className="btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AddDealerModal;