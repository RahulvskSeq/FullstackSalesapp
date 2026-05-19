import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Layers, ChevronRight } from 'lucide-react';
import { MO as MO_CONST } from '../constants';
import { useMonth } from '../context';

const PAL = ['#6366f1','#34d399','#fbbf24','#f472b6','#22d3ee','#fb923c','#a78bfa','#f87171','#84cc16','#e879f9','#06b6d4'];

export default function CategoryDrillChart({dealers,selectedMonthIdx,onNavigate}){
  const { MO:ctxMO } = useMonth();
  const MO = ctxMO || MO_CONST;
  const [drillCat,setDrillCat]=useState(null);
  const [selMains,setSelMains]=useState([]);
  const [selSubs,setSelSubs]=useState([]);

  const mainData=useMemo(()=>{
    const map={};
    dealers.forEach(d=>{ const cat=(d.category||'').trim()||'(No Category)'; if(!map[cat])map[cat]=0; map[cat]+=d.months[selectedMonthIdx]||0; });
    return Object.entries(map).filter(([,v])=>v>0).map(([name,value],i)=>({name,value,color:PAL[i%PAL.length]})).sort((a,b)=>b.value-a.value);
  },[dealers,selectedMonthIdx]);

  const subData=useMemo(()=>{
    if(!drillCat)return[];
    const src=dealers.filter(d=>(d.category||'').trim()===drillCat);
    const map={};
    src.forEach(d=>{ const t=(d.categoryType||'').trim()||'(No Sub)'; if(!map[t])map[t]=0; map[t]+=d.months[selectedMonthIdx]||0; });
    return Object.entries(map).map(([name,value],i)=>({name,value,color:PAL[i%PAL.length]})).sort((a,b)=>b.value-a.value);
  },[dealers,drillCat,selectedMonthIdx]);

  const mainTrend=useMemo(()=>{
    const cats=selMains.length>0?selMains:mainData.map(x=>x.name);
    return MO.map((m,i)=>{ const row={month:m.slice(0,3)}; cats.forEach(cat=>{ row[cat]=dealers.filter(d=>(d.category||'').trim()===cat).reduce((s,d)=>s+(d.months[i]||0),0); }); return row; });
  },[dealers,selMains,mainData]);

  const subTrend=useMemo(()=>{
    if(!drillCat)return[];
    const src=dealers.filter(d=>(d.category||'').trim()===drillCat);
    const subs=selSubs.length>0?selSubs:subData.map(x=>x.name);
    return MO.map((m,i)=>{ const row={month:m.slice(0,3)}; subs.forEach(sub=>{ row[sub]=src.filter(d=>(d.categoryType||'').trim()===sub).reduce((s,d)=>s+(d.months[i]||0),0); }); return row; });
  },[dealers,drillCat,selSubs,subData]);

  const toggleMain=name=>setSelMains(s=>s.includes(name)?s.filter(x=>x!==name):[...s,name]);
  const toggleSub= name=>setSelSubs (s=>s.includes(name)?s.filter(x=>x!==name):[...s,name]);
  const drillInto=name=>{setDrillCat(name);setSelSubs([]);};
  const goBack   =()=>{setDrillCat(null);setSelSubs([]);};

  const displayMains=selMains.length>0?selMains:mainData.map(x=>x.name);
  const displaySubs =selSubs.length>0 ?selSubs :subData.map(x=>x.name);
  const barData=drillCat?subData:mainData;

  return(
    <div className="card" style={{marginBottom:16}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <Layers size={14} color="#818cf8"/>
        {!drillCat?(
          <span style={{fontSize:13,fontWeight:600,color:'var(--t2)'}}>Category Analysis — {MO[selectedMonthIdx]}</span>
        ):(
          <>
            <button onClick={goBack} style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',fontSize:13,fontWeight:600,padding:0}}>All Categories</button>
            <ChevronRight size={13} color="var(--t3)"/>
            <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>{drillCat}</span>
            <span style={{fontSize:11,color:'var(--t3)'}}>— {subData.length} sub-types</span>
          </>
        )}
        {drillCat&&<button onClick={goBack} className="btn" style={{fontSize:11,padding:'3px 10px',marginLeft:'auto',color:'var(--red)'}}>← Back</button>}
      </div>

      {/* Chip row */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
        {!drillCat?(
          mainData.map((c,i)=>(
            <button key={c.name} onClick={()=>toggleMain(c.name)} style={{padding:'5px 12px',borderRadius:14,fontSize:12,fontWeight:600,cursor:'pointer',background:selMains.includes(c.name)?c.color+'33':'var(--bg2)',color:selMains.includes(c.name)?c.color:'var(--t2)',border:`1.5px solid ${selMains.includes(c.name)?c.color:'var(--b2)'}`,transition:'all .15s',display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:c.color,flexShrink:0}}/>{c.name}<span style={{opacity:0.7,fontSize:11}}>({c.value})</span>
            </button>
          ))
        ):(
          subData.map((t,i)=>(
            <button key={t.name} onClick={()=>toggleSub(t.name)} style={{padding:'5px 12px',borderRadius:14,fontSize:12,fontWeight:600,cursor:'pointer',background:selSubs.includes(t.name)?t.color+'33':'var(--bg2)',color:selSubs.includes(t.name)?t.color:'var(--t2)',border:`1.5px solid ${selSubs.includes(t.name)?t.color:'var(--b2)'}`,transition:'all .15s',display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:t.color,flexShrink:0}}/>{t.name}<span style={{opacity:0.7,fontSize:11}}>({t.value})</span>
            </button>
          ))
        )}
        {(selMains.length>0||selSubs.length>0)&&<button onClick={()=>drillCat?setSelSubs([]):setSelMains([])} className="btn" style={{fontSize:11,padding:'3px 10px'}}>Clear</button>}
      </div>

      {barData.length===0?(
        <div style={{textAlign:'center',padding:30,color:'var(--t3)',fontSize:13}}>No category data. Add "Main Category" and "Sub Category" columns to your sheet.</div>
      ):(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {/* Bar chart */}
          <div>
            <div style={{fontSize:11,color:'var(--t3)',marginBottom:6}}>
              {drillCat?`Sub-categories of "${drillCat}"`:'Units by Main Category'}
              {!drillCat&&<span style={{color:'var(--acc)',marginLeft:6,fontSize:10}}>· click bar to drill</span>}
            </div>
            <ResponsiveContainer width="100%" height={Math.max(barData.length*36+40,140)}>
              <BarChart data={barData} layout="vertical" margin={{left:8,right:50,top:4,bottom:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)" horizontal={false}/>
                <XAxis type="number" tick={{fill:'var(--t3)',fontSize:10}} stroke="var(--b2)"/>
                <YAxis type="category" dataKey="name" tick={{fill:'var(--t2)',fontSize:11}} stroke="var(--b2)" width={110}/>
                <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
                <Bar dataKey="value" radius={[0,4,4,0]} label={{position:'right',fill:'var(--t2)',fontSize:11,fontWeight:700}} onClick={d=>!drillCat&&drillInto(d.name)} style={{cursor:drillCat?'default':'pointer'}}>
                  {barData.map((entry,i)=>{
                    const isActive=drillCat?selSubs.includes(entry.name):selMains.includes(entry.name);
                    const anyActive=drillCat?selSubs.length>0:selMains.length>0;
                    return<Cell key={i} fill={entry.color} opacity={anyActive&&!isActive?0.3:1}/>;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {!drillCat&&<div style={{fontSize:10,color:'var(--t3)',marginTop:6,textAlign:'center'}}>Click a bar to see sub-categories · click chips to compare trends</div>}
          </div>

          {/* Trend line */}
          <div>
            <div style={{fontSize:11,color:'var(--t3)',marginBottom:6}}>
              {drillCat?`${drillCat} — Sub-Category Trends`:'11-Month Trend by Category'}
              {(drillCat?selSubs:selMains).length>0&&<span style={{color:'var(--acc)',marginLeft:5}}>({(drillCat?selSubs:selMains).join(', ')})</span>}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={drillCat?subTrend:mainTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
                <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:10}}/>
                <YAxis tick={{fill:'var(--t3)',fontSize:10}}/>
                <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
                <Legend wrapperStyle={{fontSize:10}}/>
                <ReferenceLine x={MO[selectedMonthIdx].slice(0,3)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 3"/>
                {(drillCat?displaySubs:displayMains).map((name,i)=>(
                  <Line key={name} type="monotone" dataKey={name} stroke={(drillCat?subData:mainData).find(x=>x.name===name)?.color||PAL[i%PAL.length]} strokeWidth={2} dot={false}/>
                ))}
              </LineChart>
            </ResponsiveContainer>

            {/* Dealers list when drilled + sub selected */}
            {drillCat&&selSubs.length>0&&(
              <div style={{marginTop:10,maxHeight:160,overflowY:'auto'}}>
                <div style={{fontSize:11,color:'var(--t3)',marginBottom:6}}>Dealers — {selSubs.join(' + ')}</div>
                {dealers.filter(d=>(d.category||'').trim()===drillCat&&selSubs.includes((d.categoryType||'').trim()))
                  .sort((a,b)=>(b.months[selectedMonthIdx]||0)-(a.months[selectedMonthIdx]||0))
                  .map(d=>(
                    <div key={d.id} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
                      <span style={{color:'var(--t2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{d.name}</span>
                      <div style={{display:'flex',gap:8,flexShrink:0}}>
                        <span style={{color:'var(--t3)',fontSize:11}}>{d.categoryType}</span>
                        <span style={{color:'var(--acc)',fontWeight:700}}>{d.months[selectedMonthIdx]||0}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}