import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../api';
import CategoryFilter from './CategoryFilter';
import { useGlobalCategoryFilter } from '../hooks/useGlobalCategoryFilter';

const CAT_CLR = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#ef4444','#64748b'];

/**
 * Two flavours of the same panel, used in three places:
 *   • Overview   — <CategorySalesPanel monthLabel="Jun-26" onSeeAll={() => navigate('salesCat')}/>
 *   • DealerModal — <CategorySalesPanel dealerName="A AND M INTERIO LLP"/>
 *
 * Mode is chosen by which prop is provided.
 *   - monthLabel  → fetch aggregated breakdown for that month (all dealers/salesmen)
 *   - dealerName  → fetch one dealer's full history across all months
 */

const fmt = n => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

// "Jun-26" → "2026-06" (server uses YYYY-MM in the sales collection)
function moLabelToYM(lbl) {
  if (!lbl) return '';
  const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(lbl.trim());
  if (!m) return '';
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const mi = months.indexOf(m[1].slice(0,3).toLowerCase());
  if (mi < 0) return '';
  let y = +m[2]; if (y < 100) y += 2000;
  return `${y}-${String(mi+1).padStart(2,'0')}`;
}

// "2026-06" → "Jun-26" (for friendly display)
function ymToLabel(ym) {
  if (!ym) return '';
  const m = /^(\d{4})-(\d{1,2})$/.exec(ym);
  if (!m) return ym;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[+m[2]-1]}-${String(+m[1]).slice(2)}`;
}

const CategorySalesPanel = ({
  monthLabel, dealerName, onSeeAll, compact=false,
  // Optional controlled-mode props. When `excluded` is provided, the panel
  // uses it directly and notifies the parent via `onToggleExcluded`. When not
  // provided, the panel manages its own state with localStorage. Setting
  // `hideToggleChips` hides the chip row (useful when the parent renders its
  // own chips elsewhere — e.g. Overview's top-right header).
  excluded: controlledExcluded,
  onToggleExcluded,
  hideToggleChips = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState(null);

  // Default to the global shared filter when no parent supplies its own.
  const global = useGlobalCategoryFilter();
  const isControlled = !!controlledExcluded;
  const excluded = isControlled ? controlledExcluded : global.excluded;

  const toggleExcluded = (cat) => {
    if (isControlled) { onToggleExcluded && onToggleExcluded(cat); return; }
    global.toggle(cat);
  };
  const clearExcluded = () => {
    if (isControlled) {
      [...excluded].forEach(c => onToggleExcluded && onToggleExcluded(c));
      return;
    }
    global.clear();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (dealerName) {
          const r = await api.salesForDealer(dealerName);
          if (!cancelled) setData(r);
        } else if (monthLabel) {
          const ym = moLabelToYM(monthLabel);
          if (!ym) { setData({ rows:[], grandTotal:0 }); return; }
          const r = await api.salesByCategory({ month: ym });
          if (!cancelled) setData(r);
        }
      } catch(e) {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [monthLabel, dealerName]);

  // Roll up the flat "rows" into per-category groups (ALL categories — we keep
  // excluded ones in this list so the user can toggle them back in).
  const allGroups = useMemo(() => {
    if (!data) return [];
    if (dealerName) {
      const out = new Map();
      for (const m of (data.months || [])) {
        for (const [cat, subs] of Object.entries(m.byCategory || {})) {
          if (!out.has(cat)) out.set(cat, { category:cat, total:0, subs:{} });
          const g = out.get(cat);
          for (const [sub, qty] of Object.entries(subs)) {
            g.total += qty;
            g.subs[sub] = (g.subs[sub] || 0) + qty;
          }
        }
      }
      return [...out.values()].sort((a,b) => b.total - a.total);
    }
    const out = new Map();
    for (const r of (data.rows || [])) {
      if (!out.has(r.category)) out.set(r.category, { category:r.category, total:0, subs:{} });
      const g = out.get(r.category);
      g.total += r.qty;
      g.subs[r.subCategory] = (g.subs[r.subCategory] || 0) + r.qty;
    }
    return [...out.values()].sort((a,b) => b.total - a.total);
  }, [data, dealerName]);

  // The visible groups + grand total respect the excluded set.
  const groups     = useMemo(() => allGroups.filter(g => !excluded.has(g.category)), [allGroups, excluded]);
  const grandTotal = useMemo(() => groups.reduce((s,g) => s + g.total, 0), [groups]);

  // Empty / loading states
  if (loading) {
    return (
      <div style={{padding:14,fontSize:12,color:'var(--t3)',display:'flex',alignItems:'center',gap:6}}>
        <RefreshCw size={12} className="spin"/> Loading category sales…
      </div>
    );
  }
  if (!data || allGroups.length === 0) {
    return (
      <div style={{padding:'14px',fontSize:12,color:'var(--t3)',textAlign:'center',background:'var(--bg1)',border:'1px dashed var(--b2)',borderRadius:8}}>
        {dealerName
          ? 'No category-wise sales uploaded for this dealer yet.'
          : `No category-wise sales uploaded for ${monthLabel||'this month'} yet.`}
        <div style={{fontSize:11,marginTop:4}}>Upload from Monthly Entry → Bulk Excel.</div>
      </div>
    );
  }

  return (
    <div style={{display:'grid',gap:8}}>
      <div className="sec-title" style={{marginBottom:2}}>
        <span className="sec-ico" style={{'--tone':'var(--pur)'}}><BarChart3 size={15}/></span>
        <div>
          {dealerName ? 'Category-wise Sales (all months)' : `Category-wise Sales — ${monthLabel||''}`}
        </div>
        <span className="count-pill">{groups.length}</span>
        <div className="spacer"/>
        <span className="kpi-pill">Total <b>{fmt(grandTotal)}</b></span>
        {onSeeAll && (
          <button className="btn" style={{padding:'4px 10px',fontSize:11,display:'inline-flex',alignItems:'center',gap:4}}
            onClick={onSeeAll}>See all <ArrowRight size={11}/></button>
        )}
      </div>

      {/* Categories filter — single dropdown with checkboxes.
          Hidden when the parent renders its own (e.g. Overview's header). */}
      {!hideToggleChips && (
        <div style={{display:'flex'}}>
          <CategoryFilter
            categories={allGroups.map(g => ({ category: g.category, total: g.total }))}
            excluded={excluded}
            onToggle={toggleExcluded}
            onClear={clearExcluded}
            label="Categories"
            compact
          />
        </div>
      )}

      {/* One strip shows how the total splits; each tile wears its category's colour */}
      {groups.length > 1 && (
        <div className="cat-strip">
          {groups.map((g,i) => (
            <div key={g.category} style={{flex:g.total||0.0001,background:CAT_CLR[i%CAT_CLR.length]}}
              title={`${g.category} · ${fmt(g.total)} · ${grandTotal?(g.total/grandTotal*100).toFixed(1):0}%`}/>
          ))}
        </div>
      )}
      <div className="cat-grid" style={{
        display:'grid',
        gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill,minmax(200px,1fr))',
        gap:8,
      }}>
        {groups.map((g,i) => {
          const pct = grandTotal ? (g.total / grandTotal * 100) : 0;
          const subs = Object.entries(g.subs).sort((a,b) => b[1]-a[1]);
          return (
            <div key={g.category} className="cat-tile" style={{'--tone':CAT_CLR[i%CAT_CLR.length]}}>
              <div className="cat-tile-head">
                <i/><span className="cat-name">{g.category}</span>
                <span className="cat-share">{pct.toFixed(1)}%</span>
              </div>
              <div className="cat-num">{fmt(g.total)}</div>
              <div className="cat-subs">
                {subs.map(([sub,qty]) => (
                  <span key={sub}>{sub} <b>{fmt(qty)}</b></span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* When showing a dealer, also show per-month split */}
      {dealerName && (data?.months?.length > 1) && (
        <div style={{marginTop:8,padding:8,background:'var(--bg1)',border:'1px solid var(--b1)',borderRadius:8}}>
          <div style={{fontSize:11,color:'var(--t3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.08em'}}>
            Month-wise totals
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {data.months.sort((a,b) => b.month.localeCompare(a.month)).map(m => (
              <span key={m.month} style={{
                fontSize:11,padding:'4px 10px',borderRadius:20,
                background:'var(--bg2)',border:'1px solid var(--b1)',
              }}>
                {ymToLabel(m.month)}: <b style={{color:'var(--grn)'}}>{fmt(m.total)}</b>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategorySalesPanel;
