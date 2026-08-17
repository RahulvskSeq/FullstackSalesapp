import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Layers, ChevronRight } from 'lucide-react';
import { MO as MO_CONST } from '../constants';
import { useMonth } from '../context';
import { api } from '../api';

const PAL = ['#6366f1','#34d399','#fbbf24','#f472b6','#22d3ee','#fb923c','#a78bfa','#f87171','#84cc16','#e879f9','#06b6d4'];

// MO label "Jun-26" → YYYY-MM "2026-06" used by the Sale collection.
const MO_MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function moToYM(lbl) {
  if (!lbl) return '';
  const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(String(lbl).trim());
  if (!m) return '';
  const mi = MO_MONTHS.indexOf(m[1].slice(0,3).toLowerCase());
  if (mi < 0) return '';
  let y = +m[2]; if (y < 100) y += 2000;
  return `${y}-${String(mi+1).padStart(2,'0')}`;
}

/**
 * CategoryDrillChart — now powered by the Sale collection (true category-wise
 * sales) instead of the legacy dealer.category / dealer.categoryType fields.
 * Numbers here are guaranteed to match the Sales by Category page totals.
 */
export default function CategoryDrillChart({ dealers, selectedMonthIdx, onNavigate }) {
  const { MO:ctxMO } = useMonth();
  const MO = ctxMO || MO_CONST;
  const [drillCat, setDrillCat] = useState(null);
  const [selMains, setSelMains] = useState([]);
  const [selSubs,  setSelSubs]  = useState([]);

  // ── Fetch sale rows for ALL months in MO once (single round-trip).
  // Aggregated client-side for current-month bars + multi-month trend lines.
  const [allSales,  setAllSales]  = useState([]);   // [{ month, dealerName, category, subCategory, qty }]
  const [loading,   setLoading]   = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const moYMs = MO.map(moToYM).filter(Boolean);
    if (!moYMs.length) { setAllSales([]); setLoading(false); return; }
    const from = moYMs.slice().sort()[0];
    const to   = moYMs.slice().sort().slice(-1)[0];
    // Use raw rows so we can pivot across both axes (category × month, dealer × month).
    api.salesRaw({ from, to, limit: 50000 })
      .then(r => { if (!cancelled) setAllSales(r.rows || []); })
      .catch(() => { if (!cancelled) setAllSales([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [MO.join('|')]);

  const currentYM = moToYM(MO[selectedMonthIdx]);

  // ── Bar data — current month per category, or per sub-category when drilled
  const mainData = useMemo(() => {
    const map = {};
    for (const r of allSales) {
      if (r.month !== currentYM) continue;
      const cat = (r.category || '(No Category)').trim();
      map[cat] = (map[cat] || 0) + (r.qty || 0);
    }
    return Object.entries(map)
      .filter(([,v]) => v > 0)
      .map(([name,value], i) => ({ name, value, color: PAL[i % PAL.length] }))
      .sort((a,b) => b.value - a.value);
  }, [allSales, currentYM]);

  const subData = useMemo(() => {
    if (!drillCat) return [];
    const map = {};
    for (const r of allSales) {
      if (r.month !== currentYM) continue;
      if ((r.category || '').trim() !== drillCat) continue;
      const s = (r.subCategory || '(No Sub)').trim();
      map[s] = (map[s] || 0) + (r.qty || 0);
    }
    return Object.entries(map)
      .map(([name,value], i) => ({ name, value, color: PAL[i % PAL.length] }))
      .sort((a,b) => b.value - a.value);
  }, [allSales, drillCat, currentYM]);

  // ── Trend data — one line per category (or sub-cat when drilled).
  // Build { 'Jul-25': { category: total } } from the sale rows.
  const monthlyByCat = useMemo(() => {
    const map = {};   // ym → { category → total }
    for (const r of allSales) {
      if (!map[r.month]) map[r.month] = {};
      const cat = (r.category || '(No Category)').trim();
      map[r.month][cat] = (map[r.month][cat] || 0) + (r.qty || 0);
    }
    return map;
  }, [allSales]);

  const monthlyBySub = useMemo(() => {
    if (!drillCat) return {};
    const map = {};
    for (const r of allSales) {
      if ((r.category || '').trim() !== drillCat) continue;
      if (!map[r.month]) map[r.month] = {};
      const s = (r.subCategory || '(No Sub)').trim();
      map[r.month][s] = (map[r.month][s] || 0) + (r.qty || 0);
    }
    return map;
  }, [allSales, drillCat]);

  const mainTrend = useMemo(() => {
    const cats = selMains.length > 0 ? selMains : mainData.map(x => x.name);
    return MO.map(m => {
      const ym = moToYM(m);
      const row = { month: m.slice(0,3) };
      const bucket = monthlyByCat[ym] || {};
      for (const c of cats) row[c] = bucket[c] || 0;
      return row;
    });
  }, [MO.join('|'), selMains, mainData, monthlyByCat]);

  const subTrend = useMemo(() => {
    if (!drillCat) return [];
    const subs = selSubs.length > 0 ? selSubs : subData.map(x => x.name);
    return MO.map(m => {
      const ym = moToYM(m);
      const row = { month: m.slice(0,3) };
      const bucket = monthlyBySub[ym] || {};
      for (const s of subs) row[s] = bucket[s] || 0;
      return row;
    });
  }, [MO.join('|'), selSubs, subData, monthlyBySub, drillCat]);

  // Dealers list when drilled + sub selected — group sale rows by dealer
  const dealersForDrill = useMemo(() => {
    if (!drillCat || selSubs.length === 0) return [];
    const dealerSums = new Map();
    for (const r of allSales) {
      if (r.month !== currentYM) continue;
      if ((r.category || '').trim() !== drillCat) continue;
      const sub = (r.subCategory || '').trim();
      if (!selSubs.includes(sub)) continue;
      const key = r.dealerName;
      const prev = dealerSums.get(key) || { name: key, sub, qty: 0 };
      prev.qty += (r.qty || 0);
      dealerSums.set(key, prev);
    }
    return [...dealerSums.values()].sort((a,b) => b.qty - a.qty);
  }, [allSales, drillCat, selSubs, currentYM]);

  const toggleMain = name => setSelMains(s => s.includes(name) ? s.filter(x=>x!==name) : [...s, name]);
  const toggleSub  = name => setSelSubs (s => s.includes(name) ? s.filter(x=>x!==name) : [...s, name]);
  const drillInto  = name => { setDrillCat(name); setSelSubs([]); };
  const goBack     = () => { setDrillCat(null); setSelSubs([]); };

  const displayMains = selMains.length > 0 ? selMains : mainData.map(x => x.name);
  const displaySubs  = selSubs.length  > 0 ? selSubs  : subData.map(x => x.name);
  const barData      = drillCat ? subData : mainData;
  const grandTotal   = mainData.reduce((s,x) => s + x.value, 0);

  return (
    <div className="card" style={{marginBottom:16}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
        <Layers size={14} color="#818cf8"/>
        {!drillCat ? (
          <span style={{fontSize:13,fontWeight:600,color:'var(--t2)'}}>Category Analysis — {MO[selectedMonthIdx]}</span>
        ) : (
          <>
            <button onClick={goBack} style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',fontSize:13,fontWeight:600,padding:0}}>All Categories</button>
            <ChevronRight size={13} color="var(--t3)"/>
            <span style={{fontSize:13,fontWeight:700,color:'var(--t1)'}}>{drillCat}</span>
            <span style={{fontSize:11,color:'var(--t3)'}}>— {subData.length} sub-types</span>
          </>
        )}
        <span style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
          {grandTotal > 0 && (
            <span style={{fontSize:11,color:'var(--t3)'}}>
              Grand Total: <b style={{color:'var(--grn)',fontSize:13}}>{Number(grandTotal).toLocaleString('en-IN')}</b>
            </span>
          )}
          {drillCat && <button onClick={goBack} className="btn" style={{fontSize:11,padding:'3px 10px',color:'var(--red)'}}>← Back</button>}
        </span>
      </div>

      {/* Chip row */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
        {!drillCat ? (
          mainData.map((c) => (
            <button key={c.name} onClick={()=>toggleMain(c.name)} style={{padding:'5px 12px',borderRadius:14,fontSize:12,fontWeight:600,cursor:'pointer',background:selMains.includes(c.name)?c.color+'33':'var(--bg2)',color:selMains.includes(c.name)?c.color:'var(--t2)',border:`1.5px solid ${selMains.includes(c.name)?c.color:'var(--b2)'}`,transition:'all .15s',display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:c.color,flexShrink:0}}/>{c.name}<span style={{opacity:0.7,fontSize:11}}>({Number(c.value).toLocaleString('en-IN')})</span>
            </button>
          ))
        ) : (
          subData.map((t) => (
            <button key={t.name} onClick={()=>toggleSub(t.name)} style={{padding:'5px 12px',borderRadius:14,fontSize:12,fontWeight:600,cursor:'pointer',background:selSubs.includes(t.name)?t.color+'33':'var(--bg2)',color:selSubs.includes(t.name)?t.color:'var(--t2)',border:`1.5px solid ${selSubs.includes(t.name)?t.color:'var(--b2)'}`,transition:'all .15s',display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:8,height:8,borderRadius:'50%',background:t.color,flexShrink:0}}/>{t.name}<span style={{opacity:0.7,fontSize:11}}>({Number(t.value).toLocaleString('en-IN')})</span>
            </button>
          ))
        )}
        {(selMains.length>0||selSubs.length>0)&&<button onClick={()=>drillCat?setSelSubs([]):setSelMains([])} className="btn" style={{fontSize:11,padding:'3px 10px'}}>Clear</button>}
      </div>

      {barData.length===0 ? (
        <div style={{textAlign:'center',padding:30,color:'var(--t3)',fontSize:13}}>
          {loading ? 'Loading category data…' : `No category sales for ${MO[selectedMonthIdx]}. Upload from Monthly Entry → Bulk Excel.`}
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          {/* Bar chart — sourced from Sale collection (true category totals) */}
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

          {/* Trend line — same Sale collection, grouped by month */}
          <div>
            <div style={{fontSize:11,color:'var(--t3)',marginBottom:6}}>
              {drillCat?`${drillCat} — Sub-Category Trends`:'Monthly Trend by Category'}
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
                {dealersForDrill.map(d=>(
                  <div key={d.name} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
                    <span style={{color:'var(--t2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>{d.name}</span>
                    <div style={{display:'flex',gap:8,flexShrink:0}}>
                      <span style={{color:'var(--t3)',fontSize:11}}>{d.sub}</span>
                      <span style={{color:'var(--acc)',fontWeight:700}}>{Number(d.qty).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
                {dealersForDrill.length===0 && (
                  <div style={{fontSize:11,color:'var(--t3)',padding:8,textAlign:'center'}}>No dealers in this slice for {MO[selectedMonthIdx]}.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
