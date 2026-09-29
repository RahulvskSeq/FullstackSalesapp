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

  // ── Area (Pincode) aggregation across ALL dealers, month-filtered ──────
  // Groups sales by pincode so the user can see exactly WHICH neighborhood
  // is driving each unit — a level below city, right down to the street PIN.
  const areaData = useMemo(() => {
    const map = {};
    dealers.forEach(d => {
      const pin = String(d.pincode || '').trim();
      if (!pin) return;
      const ach = Number(d.months?.[selectedMonthIdx] || 0);
      if (!map[pin]) map[pin] = { pin, units: 0, dealers: 0, city: (d.city || '').trim(), state: (d.state || '').trim() };
      map[pin].units   += ach;
      map[pin].dealers += 1;
    });
    return Object.values(map)
      .filter(x => x.units > 0 || x.dealers > 0)
      .sort((a, b) => b.units - a.units);
  }, [dealers, selectedMonthIdx]);

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
      <div className="sec-title">
        <span className="sec-ico" style={{'--tone':'#0891b2'}}><MapPin size={15}/></span> Sales Geography — {MO[selectedMonthIdx]} {states.length>0&&<span className="count-pill">{states.length} states</span>}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:14}}>
        {states.length>0&&(
          <div>
            <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:10}}>By State</div>
            {states.map(([name,v],i)=>{
              const pct2=Math.round((v.units/maxUnits)*100);
              const clr=`hsl(${240-(pct2*1.4)},70%,60%)`;
              return(
                <div key={name} style={{display:'flex',alignItems:'center',gap:10,marginBottom:9}}>
                  <span className={'rank rank-'+(i+1)}>{i+1}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <span style={{fontSize:12,color:'var(--t1)',fontWeight:600}}>{name}</span>
                      <div style={{display:'flex',gap:10,fontSize:11,color:'var(--t3)'}}><span>{v.dealers} dealers</span><strong style={{color:'var(--t1)'}}>{v.units} units</strong></div>
                    </div>
                    <div style={{height:6,background:'var(--bg3)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:pct2+'%',background:`linear-gradient(90deg, color-mix(in srgb, ${clr} 55%, transparent), ${clr})`,borderRadius:4,transition:'width .8s ease'}}/></div>
                  </div>
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
                <defs>
                  <linearGradient id="mvCity" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.55}/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid horizontal={false}/>
                <XAxis type="number" tickLine={false} axisLine={false}/>
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={100}/>
                <Tooltip formatter={(v,n,p)=>[`${v} units · ${p.payload.dealers} dealers`,n]}/>
                <Bar dataKey="units" radius={[0,8,8,0]} maxBarSize={20} fill="url(#mvCity)" label={{position:'right',fill:'var(--t1)',fontSize:11,fontWeight:800}}/>
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
                <div key={name} style={{background:`rgba(99,102,241,${0.1+intensity*0.7})`,border:'1px solid rgba(99,102,241,0.3)',borderRadius:12,padding:'9px 13px',minWidth:100,textAlign:'center',cursor:'pointer'}} onClick={()=>{}}>
                  <div style={{fontSize:11,color:'var(--t1)',fontWeight:600}}>{name}</div>
                  <div style={{fontSize:18,fontWeight:700,color:'var(--acc)'}}>{v.units}</div>
                  <div style={{fontSize:10,color:'var(--t3)'}}>{v.dealers} dealers</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── By Area (Pincode) — top-level view · HIDDEN (commented out on request) ─── */}
      {/* areaData.length > 0 && (
        <div style={{marginTop:16, borderTop:'1px solid var(--b1)', paddingTop:14}}>
          <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10, display:'flex', alignItems:'center', gap:8}}>
            <MapPin size={12} color="#6366f1"/> By Area (Pincode) — {areaData.length} PIN{areaData.length===1?'':'s'} with data
            <span style={{color:'var(--t3)', textTransform:'none', fontWeight:400}}>· sorted by sales</span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:8}}>
            {areaData.slice(0, 30).map(a => {
              const pctBar = Math.round((a.units / areaData[0].units) * 100);
              return (
                <div key={a.pin} style={{
                  padding:'10px 12px', background:'var(--bg1)',
                  border:'1px solid var(--b1)', borderRadius:8,
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}>
                    <span style={{fontFamily:'"JetBrains Mono", monospace', fontSize:13, fontWeight:800, color:'var(--t1)'}}>{a.pin}</span>
                    <span style={{fontSize:9, color:'var(--t3)', flex:1, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{a.city}{a.state?`, ${a.state}`:''}</span>
                  </div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:6}}>
                    <div style={{fontSize:18, fontWeight:800, color:'var(--grn)', lineHeight:1}}>{a.units.toLocaleString('en-IN')}</div>
                    <div style={{fontSize:10, color:'var(--t3)'}}>{a.dealers} dealer{a.dealers===1?'':'s'}</div>
                  </div>
                  <div style={{height:4, background:'var(--bg2)', borderRadius:2, overflow:'hidden'}}>
                    <div style={{height:'100%', width:pctBar+'%', background:'linear-gradient(90deg,var(--acc),var(--grn))', borderRadius:2, transition:'width .8s ease'}}/>
                  </div>
                </div>
              );
            })}
          </div>
          {areaData.length > 30 && (
            <div style={{fontSize:11, color:'var(--t3)', textAlign:'center', marginTop:8}}>
              Showing top 30 of {areaData.length} areas. Drill into a state / city to see all PINs in that region.
            </div>
          )}
        </div>
      )} */}
    </div>
  );
}