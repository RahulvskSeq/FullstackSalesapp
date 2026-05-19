import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Avatar } from './UI';

const UserManagement=({users,setUsers,onClose})=>{
  const [name,setName]=useState(''),[id,setId]=useState(''),[pass,setPass]=useState(''),[url,setUrl]=useState(''),[color,setColor]=useState('#818cf8');
  const colors=['#818cf8','#34d399','#f472b6','#fb923c','#fbbf24','#22d3ee','#e879f9','#a78bfa','#f87171','#4ade80'];
  const create=()=>{
    const idC=id.trim().toLowerCase().replace(/\s+/g,'_');
    if(!name||!idC||!pass){alert('Name, username and password required');return;}
    if(pass.length<4){alert('Min 4 character password');return;}
    if(users[idC]){alert('Username already exists');return;}
    setUsers({...users,[idC]:{id:idC,name,pass,role:'salesman',color,ini:name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),url:url.trim()||null}});
    setName('');setId('');setPass('');setUrl('');
    alert('Account created!\nUsername: '+idC+'\nPassword: '+pass);
  };
  const reset=uid=>{const np=prompt('New password for '+users[uid]?.name+':');if(!np||np.length<4){if(np!==null)alert('Min 4 chars');return;}setUsers({...users,[uid]:{...users[uid],pass:np}});alert('Password updated ✓');};
  const editUrl=uid=>{const np=prompt('Sheet CSV URL for '+users[uid]?.name+' (blank to remove):',users[uid]?.url||'');if(np===null)return;setUsers({...users,[uid]:{...users[uid],url:np.trim()||null}});};
  const remove=uid=>{if(!confirm('Remove '+users[uid]?.name+'?'))return;const u={...users};delete u[uid];setUsers(u);};
  const sms=Object.values(users).filter(u=>u.role==='salesman');
  return(
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:600}}>
        <div className="row" style={{marginBottom:18}}>
          <div style={{fontSize:17,fontWeight:700}}>User Management</div>
          <div className="spacer"/>
          <button onClick={onClose} className="btn"><X size={14}/></button>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:240,overflowY:'auto',marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:10,background:'var(--bg2)',borderRadius:8}}>
            <Avatar user={users.admin} size={28}/>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>Admin</div><div style={{fontSize:11,color:'var(--t3)'}}>Administrator</div></div>
            <button className="btn" style={{fontSize:11,padding:'4px 10px'}} onClick={()=>reset('admin')}>Reset Pass</button>
          </div>
          {sms.map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:10,background:'var(--bg2)',borderRadius:8}}>
              <Avatar user={s} size={28}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600}}>{s.name}</div><div style={{fontSize:11,color:'var(--t3)'}}>{s.id} · {s.url?<span style={{color:'#34d399'}}>Sheet ✓</span>:<span style={{color:'#fbbf24'}}>No sheet</span>}</div></div>
              <button className="btn" style={{fontSize:11,padding:'4px 8px'}} onClick={()=>editUrl(s.id)}>URL</button>
              <button className="btn" style={{fontSize:11,padding:'4px 8px'}} onClick={()=>reset(s.id)}>Reset</button>
              <button className="btnd" style={{fontSize:11}} onClick={()=>remove(s.id)}>Remove</button>
            </div>
          ))}
        </div>
        <div style={{paddingTop:16,borderTop:'1px solid var(--b1)'}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Create new salesman</div>
          <div className="g2">
            <div className="field"><label>Full Name</label><input className="inp" value={name} onChange={e=>setName(e.target.value)}/></div>
            <div className="field"><label>Username</label><input className="inp" value={id} onChange={e=>setId(e.target.value)} placeholder="e.g. rahul"/></div>
            <div className="field"><label>Password</label><input className="inp" type="password" value={pass} onChange={e=>setPass(e.target.value)}/></div>
            <div className="field"><label>Sheet CSV URL</label><input className="inp" value={url} onChange={e=>setUrl(e.target.value)} placeholder="optional"/></div>
            <div className="field full"><label>Color</label><div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>{colors.map(c=><div key={c} onClick={()=>setColor(c)} style={{width:22,height:22,borderRadius:'50%',cursor:'pointer',background:c,border:color===c?'2px solid var(--t1)':'2px solid transparent',transform:color===c?'scale(1.2)':'scale(1)'}}/>)}</div></div>
          </div>
          <button className="btnp" onClick={create} style={{marginTop:6}}>Create Account</button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
