import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { GitCompare } from 'lucide-react';
import { MO as MO_CONST } from '../constants';
import { fcash, trendPct, forecast, pct, spct, monthTarget } from '../utils';
import { useMonth } from '../context';

const Compare=({dealers,onOpenDealer})=>{
  const {selectedMonthIdx, MO:ctxMO}=useMonth();
  const MO = ctxMO || MO_CONST;
  const selMoLabel=MO[selectedMonthIdx].slice(0,3);
  const [picked,setPicked]=useState([]);
  const [search,setSearch]=useState('');
  const visible=dealers.filter(d=>d.name.toLowerCase().includes(search.toLowerCase())).slice(0,30);
  const togglePick=id=>setPicked(p=>p.includes(id)?p.filter(x=>x!==id):p.length>=4?p:[...p,id]);
  const pickedDealers=picked.map(id=>dealers.find(d=>d.id===id)).filter(Boolean);
  const chartData=MO.map((m,i)=>{const row={month:m.slice(0,3)};pickedDealers.forEach(d=>{row[d.name]=d.months[i];});return row;});
  const palette=['#6366f1','#34d399','#fb923c','#f472b6'];
  return(
    <div className="fade">
      <div style={{marginBottom:18}}>
        <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:2}}>Side-by-Side Analysis</div>
        <div style={{fontSize:22,fontWeight:700}}>Compare Dealers <span style={{fontSize:13,color:'var(--t3)',fontWeight:400}}>(pick up to 4)</span></div>
      </div>
      <div className="card" style={{marginBottom:14}}>
        <input className="inp" placeholder="🔍 Search dealers..." value={search} onChange={e=>setSearch(e.target.value)} style={{marginBottom:10}}/>
        <div style={{display:'flex',flexWrap:'wrap',gap:6,maxHeight:140,overflowY:'auto'}}>
          {visible.map(d=>(<button key={d.id} className="btn" onClick={()=>togglePick(d.id)} style={{fontSize:11,padding:'4px 10px',background:picked.includes(d.id)?'var(--accL)':'var(--bg2)',color:picked.includes(d.id)?'var(--acc)':'var(--t2)',borderColor:picked.includes(d.id)?'var(--acc)':'var(--b2)'}}>{picked.includes(d.id)?'✓ ':'+ '}{d.name}</button>))}
        </div>
        {picked.length>0&&<div style={{marginTop:10,fontSize:12,color:'var(--t3)'}}>{picked.length}/4 selected · <button className="btn" style={{fontSize:11,padding:'2px 8px',marginLeft:4}} onClick={()=>setPicked([])}>Clear</button></div>}
      </div>
      {pickedDealers.length>0?(
        <>
          <div className="card" style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Monthly Performance</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
                <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
                <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
                <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
                <Legend wrapperStyle={{fontSize:11}}/>
                <ReferenceLine x={MO[selectedMonthIdx].slice(0,3)} stroke="#fbbf24" strokeWidth={2} strokeDasharray="3 3"/>
                {pickedDealers.map((d,i)=>(<Line key={d.id} type="monotone" dataKey={d.name} stroke={palette[i]} strokeWidth={2} dot={{r:3}}/>))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Side-by-Side Stats — {MO[selectedMonthIdx]}</div>
            <table>
              <thead>
                <tr><th>Metric</th>{pickedDealers.map((d,i)=><th key={d.id} style={{color:palette[i]}}>{d.name.slice(0,15)}</th>)}</tr>
              </thead>
              <tbody>
                {[
                  ['Status',d=>d.status],['Zone',d=>d.zone||'—'],['City',d=>d.city||'—'],['State',d=>d.state||'—'],
                  ['Category',d=>d.category||'—'],['Cat Type',d=>d.categoryType||'—'],
                  [`${selMoLabel} Ach`,d=>d.months[selectedMonthIdx]||0],['Target',d=>(monthTarget(d, selectedMonthIdx)||'—')],
                  ['Trend',d=>(trendPct(d.months)>0?'+':'')+trendPct(d.months)+'%'],['Forecast',d=>forecast(d.months)],
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