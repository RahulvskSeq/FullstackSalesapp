import React, { useState } from 'react';

const BulkActionModal=({action,selected,dealers,users,onApply,onClose})=>{
  const [val,setVal]=useState('');
  const handle=()=>{
    if(action==='delete'){if(!confirm(`Delete ${selected.length} dealers?`))return;onApply({type:'delete'});}
    else if(action==='status'&&val)onApply({type:'status',value:val});
    else if(action==='salesman'&&val)onApply({type:'salesman',value:val});
    else return;
    onClose();
  };
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:400}}>
        <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>{action==='delete'?`Delete ${selected.length} dealers?`:action==='status'?`Change status for ${selected.length} dealers`:`Reassign ${selected.length} dealers`}</div>
        {action==='status'&&(<select className="sel inp" value={val} onChange={e=>setVal(e.target.value)} style={{marginBottom:14}}><option value="">Choose status...</option>{['ACTIVE','ACHIVERS','KEY ACCOUNT','INACTIVE','DEAD'].map(s=><option key={s}>{s}</option>)}</select>)}
        {action==='salesman'&&(<select className="sel inp" value={val} onChange={e=>setVal(e.target.value)} style={{marginBottom:14}}><option value="">Choose salesman...</option>{Object.values(users).filter(u=>u.role==='salesman').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>)}
        {action==='delete'&&<div style={{color:'var(--t3)',fontSize:13,marginBottom:14}}>This cannot be undone.</div>}
        <div className="row" style={{gap:8}}>
          <button onClick={handle} className={action==='delete'?'btnd':'btnp'}>{action==='delete'?'Delete':'Apply'}</button>
          <button onClick={onClose} className="btn">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionModal;
