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
      label="Categories"
      compact
    />
  );
}

const MonthlyTrend=({dealers,currentUser,users,onOpenDealer})=>{
  const {selectedMonthIdx, MO:ctxMO}=useMonth();
  const MO = ctxMO || MO_CONST;
  const [filter,setFilter]=useState('all');
  const isAdmin=currentUser.role==='admin'||currentUser.role==='superadmin';
  const baseFiltered=useMemo(()=>filter==='all'?dealers:dealers.filter(x=>x.salesman===filter),[dealers,filter]);
  const totals=MO.map((_,i)=>baseFiltered.reduce((s,x)=>s+(x.months[i]||0),0));
  const showStacked=isAdmin&&filter==='all';
  const multiData=MO.map((m,i)=>{
    const row={month:m.slice(0,3)};
    if(showStacked){Object.values(users).filter(u=>u.role==='salesman').forEach(s=>{row[s.name]=dealers.filter(d=>d.salesman===s.id).reduce((sum,d)=>sum+(d.months[i]||0),0);});}
    else row.units=totals[i];
    return row;
  });

  return(
    <div className="fade">
      <div className="row" style={{marginBottom:18,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontSize:11,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:2}}>Performance History</div>
          <div style={{fontSize:22,fontWeight:700}}>Monthly Trend Analysis</div>
        </div>
        <div className="spacer"/>
        <TrendCategoryFilter selectedMonthIdx={selectedMonthIdx} MO={MO}/>
        {isAdmin&&(
          <div className="row" style={{flexWrap:'wrap',gap:6}}>
            <button className={`btn ${filter==='all'?'btnp':''}`} onClick={()=>setFilter('all')}>All</button>
            {Object.values(users).filter(u=>u.role==='salesman').map(s=>(
              <button key={s.id} className="btn" style={filter===s.id?{background:s.color+'22',color:s.color,borderColor:s.color+'66'}:{}} onClick={()=>setFilter(s.id)}>{s.name.split(' ')[0]}</button>
            ))}
          </div>
        )}
      </div>
      <CategoryDrillChart dealers={baseFiltered} selectedMonthIdx={selectedMonthIdx} onNavigate={null}/>
      <div className="card" style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:14}}>Units Sold per Month</div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={multiData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--b1)"/>
            <XAxis dataKey="month" tick={{fill:'var(--t3)',fontSize:11}}/>
            <YAxis tick={{fill:'var(--t3)',fontSize:11}}/>
            <Tooltip contentStyle={{background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:8}}/>
            <ReferenceLine x={MO[selectedMonthIdx].slice(0,3)} stroke="#fbbf24" strokeWidth={2} label={{value:'◀ viewing',fill:'#fbbf24',fontSize:10}}/>
            {showStacked?(
              <>{Object.values(users).filter(u=>u.role==='salesman').map(s=>(<Area key={s.id} type="monotone" dataKey={s.name} stackId="1" stroke={s.color} fill={s.color} fillOpacity={0.6}/>))}</>
            ):(
              <Area type="monotone" dataKey="units" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} label={{position:'top',fill:'var(--t2)',fontSize:10,fontWeight:600}}/>
            )}
            <Legend wrapperStyle={{fontSize:11}}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,color:'var(--t2)',marginBottom:12}}>Month-over-Month Detail</div>
        <div className="scroll">
          <table>
            <thead>
              <tr><th>Month</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Δ Change</th><th style={{textAlign:'right'}}>Δ %</th><th>Top Dealer</th></tr>
            </thead>
            <tbody>
              {[...MO].map((_,di)=>{
                const i=MO.length-1-di,m=MO[i],v=totals[i];
                const prev=i>0?totals[i-1]:null,diff=prev!=null?v-prev:null;
                const dp=prev&&prev>0?Math.round((diff/prev)*100):null;
                const topD=baseFiltered.reduce((b,x)=>(x.months[i]>(b?.months[i]||0)?x:b),null);
                return(
                  <tr key={m} style={{background:i===selectedMonthIdx?'rgba(251,191,36,0.05)':'transparent'}}>
                    <td style={{fontWeight:i===selectedMonthIdx?700:400,color:i===selectedMonthIdx?'#fbbf24':'var(--t1)'}}>{m} {i===selectedMonthIdx&&'◀'}</td>
                    <td style={{textAlign:'right',fontWeight:700}}>{v}</td>
                    <td style={{textAlign:'right',color:diff>0?'#34d399':diff<0?'#f87171':'var(--t3)'}}>{diff!=null?(diff>0?'+':'')+diff:'—'}</td>
                    <td style={{textAlign:'right',color:dp>0?'#34d399':dp<0?'#f87171':'var(--t3)'}}>{dp!=null?(dp>0?'+':'')+dp+'%':'—'}</td>
                    <td>{topD&&topD.months[i]>0?<button onClick={()=>onOpenDealer&&onOpenDealer(topD.id)} style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',padding:0,fontSize:12}}>{topD.name} ({topD.months[i]})</button>:<span style={{color:'var(--t3)'}}>—</span>}</td>
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