import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { GitCompare, LineChart as LineChartIcon, Columns3 } from 'lucide-react';
import { MO as MO_CONST } from '../constants';
import { fcash, trendPct, forecast, pct, spct, monthTarget } from '../utils';
import { useMonth } from '../context';
import { PageHead } from '../collections/ui';

const Compare=({dealers,onOpenDealer})=>{
  const {selectedMonthIdx, MO:ctxMO, viewIdx}=useMonth();
  const MO = ctxMO || MO_CONST;
  const vIdx=(viewIdx&&viewIdx.length?viewIdx:MO.map((_,i)=>i)).filter(i=>i<MO.length);
  const selMoLabel=MO[selectedMonthIdx].slice(0,3);
  const [picked,setPicked]=useState([]);
  const [search,setSearch]=useState('');
  const visible=dealers.filter(d=>d.name.toLowerCase().includes(search.toLowerCase())).slice(0,30);
  const togglePick=id=>setPicked(p=>p.includes(id)?p.filter(x=>x!==id):p.length>=4?p:[...p,id]);
  const pickedDealers=picked.map(id=>dealers.find(d=>d.id===id)).filter(Boolean);
  const chartData=vIdx.map(i=>{const row={month:MO[i].slice(0,3)};pickedDealers.forEach(d=>{row[d.name]=d.months[i];});return row;});
  const palette=['#3b82f6','#10b981','#f59e0b','#ec4899'];
  return(
    <div className="fade">
      <PageHead icon={GitCompare} tone="var(--pur)" eyebrow="Side-by-Side Analysis" title={<>Compare Dealers <span style={{fontSize:13,color:'var(--t3)',fontWeight:400}}>(pick up to 4)</span></>}/>
      <div className="card" style={{marginBottom:14}}>
        <input className="inp" placeholder="🔍 Search dealers..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:10}}/>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,maxHeight:140,overflowY:'auto'}}>
          {visible.map(d=>(<button key={d.id} className={'thr'+(picked.includes(d.id)?' on':'')} onClick={()=>togglePick(d.id)} style={{'--tone':'var(--acc)'}}>{picked.includes(d.id)?'✓ ':'+ '}{d.name}</button>))}
        </div>
        {picked.length>0&&<div style={{marginTop:10,fontSize:12,color:'var(--t3)'}}><span className="count-pill">{picked.length}/4</span> selected · <button className="btn" style={{fontSize:11,padding:'2px 8px',marginLeft:4}} onClick={()=>setPicked([])}>Clear</button></div>}
      </div>
      {pickedDealers.length>0?(
        <>
          <div className="card" style={{marginBottom:14}}>
            <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--acc)'}}><LineChartIcon size={15}/></span> Monthly Performance</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid vertical={false}/>
                <XAxis dataKey="month" tickLine={false} axisLine={false}/>
                <YAxis tickLine={false} axisLine={false} width={44}/>
                <Tooltip/>
                <Legend wrapperStyle={{fontSize:11}} iconType="circle" iconSize={8}/>
                <ReferenceLine x={MO[selectedMonthIdx].slice(0,3)} stroke="#f59e0b" strokeWidth={2} strokeDasharray="3 3"/>
                {pickedDealers.map((d,i)=>(<Line key={d.id} type="monotone" dataKey={d.name} stroke={palette[i]} strokeWidth={2.5} dot={{r:2,fill:palette[i],strokeWidth:0}} activeDot={{r:5}}/>))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--pur)'}}><Columns3 size={15}/></span> Side-by-Side Stats — {MO[selectedMonthIdx]}</div>
            <table>
              <thead>
                <tr><th>Metric</th>{pickedDealers.map((d,i)=><th key={d.id} style={{color:palette[i]}}><div style={{display:'flex',alignItems:'center',gap:8}}><span className="ini" style={{'--h':(d.name||'?').charCodeAt(0)*37%360,width:24,height:24,fontSize:10,borderRadius:8}}>{(d.name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span><div style={{minWidth:0}}><div>{d.name.slice(0,15)}</div>{(d.zone||d.city)&&<div style={{fontSize:10,color:'var(--t3)',fontWeight:500,textTransform:'none',letterSpacing:0}}>{[d.zone,d.city].filter(Boolean).join(' · ')}</div>}</div></div></th>)}</tr>
              </thead>
              <tbody>
                {[
                  ['Performance',d=>d.perfStatus||'NEW DEALER'],
                  // Editable in place — the same control the other screens use.
['Selected User',d=>d.status||'—'],['Zone',d=>d.zone||'—'],['City',d=>d.city||'—'],['State',d=>d.state||'—'],
                  ['Category',d=>d.category||'—'],['Cat Type',d=>d.categoryType||'—'],
                  [`${selMoLabel} Ach`,d=>d.months[selectedMonthIdx]||0],['Target',d=>(monthTarget(d, selectedMonthIdx)||'—')],
                  ['Trend',d=>{const tp=trendPct(d.months);return <span className={'trend '+(tp>0?'up':tp<0?'down':'')}>{(tp>0?'+':'')+tp+'%'}</span>;}],['Forecast',d=>forecast(d.months)],
                  ['Credit',d=>fcash(d.creditLimit)],
                ].map(([lbl,fn])=>(<tr key={lbl}><td style={{color:'var(--t3)'}}>{lbl}</td>{pickedDealers.map(d=><td key={d.id} style={{fontWeight:600}}>{fn(d)}</td>)}</tr>))}
              </tbody>
            </table>
          </div>
        </>
      ):(
        <div className="card" style={{textAlign:'center',padding:40,color:'var(--t3)'}}><GitCompare size={32} style={{margin:'0 auto 10px',opacity:0.5}}/><div>Pick 2-4 dealers above to compare</div></div>
      )}
    </div>
  );
};

// ── FOLLOW-UPS ─────────────────────────────────────────────
export default Compare;