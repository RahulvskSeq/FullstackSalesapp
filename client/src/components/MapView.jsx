import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin } from 'lucide-react';
import { MO as MO_CONST } from '../constants';
import { useMonth } from '../context';

export default function MapView({dealers,selectedMonthIdx}){
  const { MO:ctxMO } = useMonth();
  const MO = ctxMO || MO_CONST;
  const stateData=useMemo(()=>{
    const map={};
    dealers.forEach(d=>{ const s=(d.state||'').trim(); if(!s)return; if(!map[s])map[s]={units:0,dealers:0,names:[]}; map[s].units+=d.months[selectedMonthIdx]||0; map[s].dealers++; map[s].names.push(d.name); });
    return map;
  },[dealers,selectedMonthIdx]);

  const cityData=useMemo(()=>{
    const map={};
    dealers.forEach(d=>{ const c=(d.city||'').trim(); if(!c)return; if(!map[c])map[c]={units:0,dealers:0,state:(d.state||'').trim()}; map[c].units+=d.months[selectedMonthIdx]||0; map[c].dealers++; });
    return Object.entries(map).map(([name,v])=>({name,...v})).filter(x=>x.units>0).sort((a,b)=>b.units-a.units);
  },[dealers,selectedMonthIdx]);

  const maxUnits=Math.max(...Object.values(stateData).map(x=>x.units),1);
  const states=Object.entries(stateData).filter(([,v])=>v.units>0).sort((a,b)=>b[1].units-a[1].units);

  if(states.length===0&&cityData.length===0){
    return(
      <div className="card" style={{marginBottom:16,textAlign:'center',padding:40,color:'var(--t3)'}}>
        <MapPin size={32} style={{margin:'0 auto 10px',opacity:0.4}}/>
        <div>No geo data (city/state) available in your dealer records.</div>
        <div style={{fontSize:12,marginTop:6}}>Add city/state columns to your Google Sheet to enable map view.</div>
      </div>
    );
  }

  return(
    <div className="card" style={{marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14,display:'flex',alignItems:'center',gap:6}}>
        <MapPin size={14} color="#34d399"/> Sales Geography — {MO[selectedMonthIdx]}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14}}>
        {states.length>0&&(
          <div>
            <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>By State</div>
            {states.map(([name,v])=>{
              const pct2=Math.round((v.units/maxUnits)*100);
              const clr=`hsl(${240-(pct2*1.4)},70%,60%)`;
              return(
                <div key={name} style={{marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span style={{fontSize:12,color:'var(--t1)',fontWeight:500}}>{name}</span>
                    <div style={{display:'flex',gap:10,fontSize:11,color:'var(--t3)'}}><span>{v.dealers} dealers</span><strong style={{color:'var(--t1)'}}>{v.units} units</strong></div>
                  </div>
                  <div style={{height:8,background:'var(--b1)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:pct2+'%',background:clr,borderRadius:4,transition:'width .8s ease'}}/></div>
                </div>
              );
            })}
          </div>
        )}
        {cityData.length>0&&(
          <div>
            <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>By City (Top {Math.min(cityData.length,15)})</div>
            <ResponsiveContainer width="100%" height={Math.min(cityData.length*26+40,400)}>
              <BarChart data={cityData.slice(0,15)} layout="vertical" margin={{left:8,right:40,top:4,bottom:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" horizontal={false}/>
                <XAxis type="number" tick={{fill:'var(--t3)',fontSize:10}} stroke="var(--b2)"/>
                <YAxis type="category" dataKey="name" tick={{fill:'var(--t2)',fontSize:11}} stroke="var(--b2)" width={100}/>
                <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}} formatter={(v,n,p)=>[`${v} units · ${p.payload.dealers} dealers`,n]}/>
                <Bar dataKey="units" radius={[0,4,4,0]} fill="#34d399" label={{position:'right',fill:'var(--t2)',fontSize:11,fontWeight:600}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {states.length>0&&(
        <div style={{marginTop:14}}>
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:8}}>State Heat Grid</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {states.map(([name,v])=>{
              const intensity=v.units/maxUnits;
              return(
                <div key={name} style={{background:`rgba(99,102,241,${0.1+intensity*0.7})`,border:'1px solid rgba(99,102,241,0.3)',borderRadius:8,padding:'8px 12px',minWidth:100,textAlign:'center',cursor:'pointer'}} onClick={()=>{}}>
                  <div style={{fontSize:11,color:'var(--t1)',fontWeight:600}}>{name}</div>
                  <div style={{fontSize:18,fontWeight:700,color:'var(--acc)'}}>{v.units}</div>
                  <div style={{fontSize:10,color:'var(--t3)'}}>{v.dealers} dealers</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}