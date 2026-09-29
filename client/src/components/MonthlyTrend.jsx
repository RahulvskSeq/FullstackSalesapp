import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MO as MO_CONST, CURRENT_MONTH_IDX } from '../constants';
import { pct, spct, pclr, trendPct } from '../utils';
import { useMonth } from '../context';
import { Avatar, MiniBars, KPI } from './UI';
import CategoryDrillChart from './CategoryDrillChart';
import CategoryFilter from './CategoryFilter';
import { useGlobalCategoryFilter } from '../hooks/useGlobalCategoryFilter';
import { api } from '../api';
import { TrendingUp, BarChart3, Table2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PageHead } from '../collections/ui';

// Category include/exclude control — wired to the SAME global filter used by
// Overview, Admin Panel, Map View & Sales by Category. Toggling here re-scopes
// the whole trend (every month) to the selected categories.
function TrendCategoryFilter({ selectedMonthIdx, MO }) {
  const g = useGlobalCategoryFilter();
  const [totals, setTotals] = useState([]);
  const moLabel = MO && MO[selectedMonthIdx];
  useEffect(() => {
    if (!moLabel) { setTotals([]); return; }
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(String(moLabel).trim());
    if (!m) { setTotals([]); return; }
    const mi = months.indexOf(m[1].slice(0,3).toLowerCase());
    if (mi < 0) { setTotals([]); return; }
    let y = +m[2]; if (y < 100) y += 2000;
    const ym = `${y}-${String(mi+1).padStart(2,'0')}`;
    let cancelled = false;
    api.salesByCategory({ month: ym })
      .then(r => {
        if (cancelled) return;
        const map = new Map();
        for (const row of (r.rows || [])) map.set(row.category, (map.get(row.category)||0) + (row.qty||0));
        setTotals([...map.entries()].map(([category, total]) => ({ category, total })).sort((a,b) => b.total - a.total));
      })
      .catch(() => { if (!cancelled) setTotals([]); });
    return () => { cancelled = true; };
  }, [moLabel]);
  if (totals.length === 0) return null;
  return (
    <CategoryFilter
      categories={totals}
      excluded={g.excluded}
      onToggle={g.toggle}
      onClear={g.clear}
      onSelectOnly={(cat) => g.set(new Set(totals.map(t=>t.category).filter(c=>c!==cat)))}
      onSetExcluded={g.set}
      label="Categories"
      compact
    />
  );
}

const MonthlyTrend=({dealers,currentUser,users,onOpenDealer})=>{
  const {selectedMonthIdx, MO:ctxMO, viewIdx}=useMonth();
  const MO = ctxMO || MO_CONST;
  const vIdx=(viewIdx&&viewIdx.length?viewIdx:MO.map((_,i)=>i)).filter(i=>i<MO.length);
  const vRev=[...vIdx].reverse();
  const [filter,setFilter]=useState('all');
  const isAdmin=currentUser.role==='admin'||currentUser.role==='superadmin';
  const baseFiltered=useMemo(()=>filter==='all'?dealers:dealers.filter(x=>x.salesman===filter),[dealers,filter]);
  const totals=MO.map((_,i)=>baseFiltered.reduce((s,x)=>s+(x.months[i]||0),0));
  const showStacked=isAdmin&&filter==='all';
  const multiData=vIdx.map(i=>{
    const m=MO[i];
    const row={month:m.slice(0,3)};
    if(showStacked){Object.values(users).filter(u=>u.role==='salesman').forEach(s=>{row[s.name]=dealers.filter(d=>d.salesman===s.id).reduce((sum,d)=>sum+(d.months[i]||0),0);});}
    else row.units=totals[i];
    return row;
  });

  return(
    <div className="fade">
      <PageHead icon={TrendingUp} tone="var(--acc)" eyebrow="Performance History" title="Monthly Trend Analysis" right={<>
        <TrendCategoryFilter selectedMonthIdx={selectedMonthIdx} MO={MO}/>
        {isAdmin&&(
          <div className="row" style={{flexWrap:'wrap',gap:6}}>
            <button className={'thr'+(filter==='all'?' on':'')} style={{'--tone':'var(--acc)'}} onClick={()=>setFilter('all')}>All</button>
            {Object.values(users).filter(u=>u.role==='salesman').map(s=>(
              <button key={s.id} className={'thr'+(filter===s.id?' on':'')} style={{'--tone':s.color||'var(--acc)'}} onClick={()=>setFilter(s.id)}>{s.name.split(' ')[0]}</button>
            ))}
          </div>
        )}
      </>}/>
      <CategoryDrillChart dealers={baseFiltered} selectedMonthIdx={selectedMonthIdx} onNavigate={null}/>
      <div className="card" style={{marginBottom:14}}>
        <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--acc)'}}><BarChart3 size={15}/></span> Units Sold per Month</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={multiData} margin={{top:18,right:8,left:-12,bottom:0}}>
            <defs>
              <linearGradient id="mtUnits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35}/>
                <stop offset="70%" stopColor="#3b82f6" stopOpacity={0.06}/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              {Object.values(users).filter(u=>u.role==='salesman').map((s,i)=>(
                <linearGradient key={s.id} id={'mtS'+i} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.55}/>
                  <stop offset="100%" stopColor={s.color} stopOpacity={0.12}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false}/>
            <XAxis dataKey="month" tickLine={false} axisLine={false}/>
            <YAxis tickLine={false} axisLine={false} width={44}/>
            <Tooltip/>
            <ReferenceLine x={MO[selectedMonthIdx].slice(0,3)} stroke="#f59e0b" strokeWidth={2} label={{value:'◀ viewing',fill:'#f59e0b',fontSize:10}}/>
            {showStacked?(
              <>{Object.values(users).filter(u=>u.role==='salesman').map((s,i)=>(<Area key={s.id} type="monotone" dataKey={s.name} stackId="1" stroke={s.color} strokeWidth={2} fill={'url(#mtS'+i+')'} fillOpacity={1} activeDot={{r:5}}/>))}</>
            ):(
              <Area type="monotone" dataKey="units" stroke="#3b82f6" strokeWidth={2.5} fill="url(#mtUnits)" dot={{r:3,fill:'#3b82f6',strokeWidth:0}} activeDot={{r:6}} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:700}}/>
            )}
            <Legend wrapperStyle={{fontSize:11}} iconType="circle" iconSize={8}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div className="sec-title"><span className="sec-ico" style={{'--tone':'var(--pur)'}}><Table2 size={15}/></span> Month-over-Month Detail</div>
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Month</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Δ Change</th><th style={{textAlign:'right'}}>Δ %</th><th>Top Dealer</th></tr>
            </thead>
            <tbody>
              {vRev.map(i=>{
                const m=MO[i],v=totals[i];
                const prev=i>0?totals[i-1]:null,diff=prev!=null?v-prev:null;
                const dp=prev&&prev>0?Math.round((diff/prev)*100):null;
                const topD=baseFiltered.reduce((b,x)=>(x.months[i]>(b?.months[i]||0)?x:b),null);
                return(
                  <tr key={m} style={{background:i===selectedMonthIdx?'color-mix(in srgb, var(--yel) 5%, transparent)':'transparent'}}>
                    <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'var(--yel)':'var(--t1)'}}>{m} {i===selectedMonthIdx&&'◀'}</td>
                    <td style={{textAlign:'right',fontWeight:700}}>{v}</td>
                    <td style={{textAlign:'right',color:diff>0?'var(--grn)':diff<0?'var(--red)':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
                    <td style={{textAlign:'right'}}>{dp!=null?<span className={'trend '+(dp>0?'up':dp<0?'down':'')}>{dp>0?<ArrowUpRight size={11}/>:dp<0?<ArrowDownRight size={11}/>:null}{(dp>0?'+':'')+dp+'%'}</span>:<span style={{color:'var(--t3)'}}>—</span>}</td>
                    <td>{topD&&topD.months[i]>0?<button onClick={()=>onOpenDealer&&onOpenDealer(topD.id)} style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',padding:0,fontSize:12,display:'flex',alignItems:'center',gap:8,textAlign:'left'}}><span className="ini" style={{'--h':(topD.name||'?').charCodeAt(0)*37%360,width:24,height:24,fontSize:10,borderRadius:8}}>{(topD.name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span><span>{topD.name} ({topD.months[i]})</span></button>:<span style={{color:'var(--t3)'}}>—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MonthlyTrend;