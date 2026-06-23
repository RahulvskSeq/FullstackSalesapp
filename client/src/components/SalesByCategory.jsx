import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, BarChart3, Users, User, Download, TrendingUp, RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../api';
import { notify, confirmDialog } from './Toast';
import CategoryFilter from './CategoryFilter';
import { useGlobalCategoryFilter } from '../hooks/useGlobalCategoryFilter';

/**
 * SalesByCategory — three views over uploaded category-wise sales:
 *   • Overall        → category totals (with sub-cat breakdown) + Grand Total
 *   • By Dealer      → pivot table: rows=dealer, cols=category, totals
 *   • By Salesman    → pivot table: rows=salesman, cols=category, totals
 *
 * All three respect the same Month filter at the top.
 */

const fmt = n => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

const SalesByCategory = ({ currentUser, users={}, dealers=[], outstandingData=[], onOpenDealer } = {}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Build a name → dealerId index so clicking a dealer row in the pivot opens
  // their modal at the Categories tab.
  const dealerIdByName = useMemo(() => {
    const m = new Map();
    for (const d of (dealers || [])) {
      if (d?.name && d?.id) m.set(String(d.name).toLowerCase().trim(), d.id);
    }
    return m;
  }, [dealers]);
  const openDealerByName = (name) => {
    if (!onOpenDealer) return;
    const id = dealerIdByName.get(String(name).toLowerCase().trim());
    if (id) onOpenDealer(id);
  };
  const [tab, setTab]               = useState('overall');
  const [months, setMonths]         = useState([]);
  const [month, setMonth]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [byCat, setByCat]           = useState({ rows:[], grandTotal:0 });
  const [byDealer, setByDealer]     = useState({ rows:[], grandTotal:0 });
  const [bySalesman, setBySalesman] = useState({ rows:[], grandTotal:0 });

  const [search, setSearch] = useState('');

  // Global filter — shared with Overview, Admin Panel, DealerModal etc.
  const { excluded, toggle: toggleExcluded, clear: clearExcluded, set: setExcluded }
    = useGlobalCategoryFilter();

  // Load distinct months once
  useEffect(() => {
    api.salesMonths().then(ms => {
      setMonths(ms);
      if (ms.length) setMonth(ms[ms.length-1]);     // latest by default
    }).catch(()=>{});
  }, []);

  // Reload all three aggregates whenever month changes
  const load = async () => {
    if (!month) return;
    setLoading(true);
    try {
      const [a, b, c] = await Promise.all([
        api.salesByCategory({ month }),
        api.salesByDealer({ month }),
        api.salesBySalesman({ month }),
      ]);
      setByCat(a); setByDealer(b); setBySalesman(c);
    } catch(e) { notify.error(e.message); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [month]);

  // "2026-06" → "Jun-26" (the MO-label format dealer.monthlyData keys use)
  const ymToMoLabel = (ym) => {
    if (!ym) return '';
    const m = /^(\d{4})-(\d{1,2})$/.exec(ym);
    if (!m) return ym;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[+m[2]-1]}-${String(+m[1]).slice(2)}`;
  };

  // Admin: full clean-slate reset for a month.
  // (a) Category sale rows, (b) dealer.monthlyData[label], (c) dedupe dealers.
  const handleDeleteMonth = async () => {
    if (!month) return;
    const label = ymToMoLabel(month);
    const ok = await confirmDialog({
      title: `Reset ALL data for ${month}?`,
      message: [
        `This wipes everything for ${month} so you can re-upload cleanly:`,
        '',
        `• Every category-wise sale row for ${month}`,
        `• Every dealer's Target / Achieved / Status / Zone / City for ${label}`,
        `• Duplicate dealer rows created during the bad upload`,
        '',
        'Dealer master records and OTHER months are NOT touched.',
      ].join('\n'),
      confirmText: `Yes, reset ${month}`,
      cancelText: 'Cancel',
      danger: true,
    });
    if (!ok) return;
    try {
      const r1 = await api.salesDeleteMonth(month).catch(e => ({ deleted:0, _err:e.message }));
      const r2 = await api.deleteMonth(label).catch(e => ({ dealersTouched:0, _err:e.message }));
      const r0 = await api.deleteDealersBySource('cat-upload', false).catch(e => ({ deleted:0, migrated:0, _err:e.message }));
      const r3 = await api.dedupeDealers(false).catch(e => ({ duplicatesRemoved:0, _err:e.message }));
      const r4 = await api.cleanupSuffixDupes(false).catch(e => ({ deleted:0, migrated:0, _err:e.message }));
      notify.success(
        `Reset ${month}: ${r0.deleted||0} bad-upload dealers · ${r1.deleted||0} sale rows · ${r2.dealersTouched||0} dealer-months · ${(r3.duplicatesRemoved ?? r3.removed) || 0} exact dupes · ${r4.deleted || 0} suffix dupes.`
      );
      const ms = await api.salesMonths().catch(()=>[]);
      setMonths(ms);
      if (!ms.includes(month)) {
        setMonth(ms.length ? ms[ms.length-1] : '');
      } else {
        load();
      }
    } catch(e) { notify.error(e.message); }
  };

  // Build distinct category list (FULL — used by the include/exclude chips).
  const allCategories = useMemo(() => {
    const set = new Set();
    byCat.rows.forEach(r => set.add(r.category));
    byDealer.rows.forEach(r => Object.keys(r.byCategory||{}).forEach(c => set.add(c)));
    bySalesman.rows.forEach(r => Object.keys(r.byCategory||{}).forEach(c => set.add(c)));
    return [...set].sort();
  }, [byCat, byDealer, bySalesman]);

  // Category list AFTER applying the user's exclusions (used as pivot columns).
  const categories = useMemo(
    () => allCategories.filter(c => !excluded.has(c)),
    [allCategories, excluded],
  );

  // Filtered totals — recomputed each render so toggling LINER off instantly
  // re-bases Grand Total, the pivot tables and the KPI cards.
  const filteredByCatRows = useMemo(
    () => byCat.rows.filter(r => !excluded.has(r.category)),
    [byCat, excluded],
  );
  const filteredGrandTotal = useMemo(
    () => filteredByCatRows.reduce((s,r) => s + (r.qty||0), 0),
    [filteredByCatRows],
  );
  // Same trick for the dealer / salesman pivots — recompute each row's total
  // from its visible categories so the "Total" column matches the visible cells.
  const dealerRowsAdj = useMemo(() => byDealer.rows.map(r => {
    const visible = Object.fromEntries(
      Object.entries(r.byCategory||{}).filter(([c]) => !excluded.has(c))
    );
    const total = Object.values(visible).reduce(
      (s, subs) => s + Object.values(subs).reduce((a,v)=>a+v, 0), 0,
    );
    return { ...r, byCategory: visible, total };
  }).sort((a,b) => b.total - a.total), [byDealer, excluded]);

  const salesmanRowsAdj = useMemo(() => bySalesman.rows.map(r => {
    const visible = Object.fromEntries(
      Object.entries(r.byCategory||{}).filter(([c]) => !excluded.has(c))
    );
    const total = Object.values(visible).reduce(
      (s, subs) => s + Object.values(subs).reduce((a,v)=>a+v, 0), 0,
    );
    return { ...r, byCategory: visible, total };
  }).sort((a,b) => b.total - a.total), [bySalesman, excluded]);

  // Group the (excluded-aware) rows by category for the Overall tab.
  const overallByCategory = useMemo(() => {
    const m = new Map();
    for (const r of filteredByCatRows) {
      if (!m.has(r.category)) m.set(r.category, { category:r.category, total:0, subs:[] });
      const g = m.get(r.category);
      g.total += r.qty;
      g.subs.push({ subCategory:r.subCategory, qty:r.qty });
    }
    return [...m.values()].sort((a,b) => b.total - a.total);
  }, [filteredByCatRows]);

  const filteredDealerRows   = dealerRowsAdj.filter(r   => !search || r.dealer.toLowerCase().includes(search.toLowerCase()));
  const filteredSalesmanRows = salesmanRowsAdj.filter(r => !search || r.salesman.toLowerCase().includes(search.toLowerCase()));

  // ── Per-(salesman × category) volume targets — editable inline below ─
  const [catTargets, setCatTargets] = useState(new Map());   // key: salesmanId|category → number
  const targetsKey = (sm, c) => `${sm}|${c}`;
  useEffect(() => {
    if (!month) { setCatTargets(new Map()); return; }
    let cancelled = false;
    api.salesTargetsList(month)
      .then(rows => {
        if (cancelled) return;
        const m = new Map();
        for (const r of (rows || [])) m.set(targetsKey(r.salesmanId, r.category), Number(r.target) || 0);
        setCatTargets(m);
      })
      .catch(() => { if (!cancelled) setCatTargets(new Map()); });
    return () => { cancelled = true; };
  }, [month]);

  const setOneTarget = async (salesmanId, category, target) => {
    const next = new Map(catTargets);
    next.set(targetsKey(salesmanId, category), Number(target) || 0);
    setCatTargets(next);
    if (!isAdmin) return;
    try {
      await api.salesTargetSet({ salesmanId, category, month, target: Number(target) || 0 });
    } catch(e) { notify.error(`Save target: ${e.message}`); }
  };

  // ── MTD Salesman × Category summary table ──────────────────────────────
  // Built from the same Sale rows + the dealer roster. For each salesman:
  //   • Region          = most common state across their dealers
  //   • Per-category Ach = sum of qty in that category from sales data
  //   • Total Target    = sum of dealer's per-month target for that month
  //   • Achievement %   = totalAch / totalTarget × 100
  //   • Billed Dealers  = count of dealers with sales > 0 for the month
  //   • Outstanding     = sum of latestOutstanding across their dealers
  const mtdSummary = useMemo(() => {
    // Build a map salesmanId → { dealers[], stateCounts, target, dealersWithSales:Set, outstanding }
    const out = new Map();
    const lookupDealerOut = new Map();
    for (const o of (outstandingData || [])) {
      lookupDealerOut.set(String(o.name||'').toLowerCase().trim(), Number(o.latestOutstanding) || 0);
    }
    for (const d of dealers) {
      const sm = d.salesman || '_none';
      if (!out.has(sm)) {
        out.set(sm, {
          smId: sm,
          smName: users[sm]?.name || sm,
          stateCounts: {},
          target: 0,
          dealers: [],
          dealersWithSales: new Set(),
          outstanding: 0,
          perCategory: {},
        });
      }
      const e = out.get(sm);
      e.dealers.push(d);
      const st = (d.state || '').trim() || '(no region)';
      e.stateCounts[st] = (e.stateCounts[st] || 0) + 1;
      // Use the per-month target if set, else dealer's global target
      const tgt = Number(d.monthTargets?.[/*current viewing*/ d._mtdIdx] || d.target || 0);
      e.target += tgt;
      const outAmt = lookupDealerOut.get(String(d.name||'').toLowerCase().trim()) || 0;
      e.outstanding += outAmt;
    }
    // Walk the byDealer sales rows to add per-category achieved + billed-dealer count
    for (const row of (byDealer.rows || [])) {
      // Find the matching dealer record so we can attribute to a salesman
      const d = dealers.find(x => String(x.name||'').toLowerCase().trim() === String(row.dealer||'').toLowerCase().trim());
      const sm = d?.salesman || '_unknown';
      if (!out.has(sm)) {
        out.set(sm, {
          smId: sm, smName: users[sm]?.name || sm,
          stateCounts: {}, target: 0, dealers: [], dealersWithSales: new Set(),
          outstanding: 0, perCategory: {},
        });
      }
      const e = out.get(sm);
      const dealerTotal = row.total || 0;
      if (dealerTotal > 0) e.dealersWithSales.add(row.dealer);
      for (const [cat, subs] of Object.entries(row.byCategory || {})) {
        if (excluded.has(cat)) continue;
        const qty = Object.values(subs).reduce((s,v) => s + (v||0), 0);
        e.perCategory[cat] = (e.perCategory[cat] || 0) + qty;
      }
    }
    // Resolve the "region" = most common state. Add per-category targets +
    // recompute total target from them when any are set (else fall back to
    // the dealer-level monthlyData total).
    const rows = [...out.values()].map(e => {
      let region = '—';
      let topCount = 0;
      for (const [st, c] of Object.entries(e.stateCounts)) {
        if (c > topCount) { region = st; topCount = c; }
      }
      const totalAch = Object.values(e.perCategory).reduce((s,v) => s + v, 0);

      // per-category target lookup
      const perCatTarget = {};
      let totalPerCatTarget = 0;
      for (const c of categories) {
        const t = catTargets.get(`${e.smId}|${c}`) || 0;
        if (t > 0) { perCatTarget[c] = t; totalPerCatTarget += t; }
      }
      // Use sum of per-category targets when any exist, else dealer total
      const effectiveTarget = totalPerCatTarget > 0 ? totalPerCatTarget : e.target;

      return {
        ...e,
        region,
        totalAch,
        target: effectiveTarget,
        dealerTargetSum: e.target,        // raw dealer-level total (for reference)
        perCatTarget,                     // { catName: target }
        billedDealerCount: e.dealersWithSales.size,
        achievementPct: effectiveTarget > 0 ? Math.round(totalAch / effectiveTarget * 100) : null,
      };
    }).filter(e => e.smName !== '_none' && e.smName !== '_unknown')
      .sort((a,b) => (a.region || '').localeCompare(b.region || '') || (b.totalAch - a.totalAch));
    return rows;
  }, [dealers, users, byDealer, excluded, outstandingData, catTargets, categories]);

  // Group MTD rows by region for sub-totals
  const mtdByRegion = useMemo(() => {
    const map = new Map();
    for (const r of mtdSummary) {
      const k = r.region;
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(r);
    }
    return [...map.entries()].map(([region, rows]) => {
      const subtotal = {
        target: rows.reduce((s,r) => s + (r.target||0), 0),
        totalAch: rows.reduce((s,r) => s + (r.totalAch||0), 0),
        billedDealerCount: rows.reduce((s,r) => s + (r.billedDealerCount||0), 0),
        outstanding: rows.reduce((s,r) => s + (r.outstanding||0), 0),
        perCategory: {},
        perCatTarget: {},
      };
      for (const r of rows) {
        for (const [c, q] of Object.entries(r.perCategory)) {
          subtotal.perCategory[c] = (subtotal.perCategory[c] || 0) + q;
        }
        for (const [c, t] of Object.entries(r.perCatTarget || {})) {
          subtotal.perCatTarget[c] = (subtotal.perCatTarget[c] || 0) + t;
        }
      }
      subtotal.achievementPct = subtotal.target > 0
        ? Math.round(subtotal.totalAch / subtotal.target * 100) : null;
      return { region, rows, subtotal };
    });
  }, [mtdSummary]);

  const mtdGrand = useMemo(() => {
    const acc = {
      target: 0, totalAch: 0, billedDealerCount: 0, outstanding: 0,
      perCategory: {}, perCatTarget: {},
    };
    for (const r of mtdSummary) {
      acc.target += r.target; acc.totalAch += r.totalAch;
      acc.billedDealerCount += r.billedDealerCount; acc.outstanding += r.outstanding;
      for (const [c, q] of Object.entries(r.perCategory)) {
        acc.perCategory[c] = (acc.perCategory[c] || 0) + q;
      }
      for (const [c, t] of Object.entries(r.perCatTarget || {})) {
        acc.perCatTarget[c] = (acc.perCatTarget[c] || 0) + t;
      }
    }
    acc.achievementPct = acc.target > 0 ? Math.round(acc.totalAch / acc.target * 100) : null;
    return acc;
  }, [mtdSummary]);

  const fmtL = n => !n ? '—' : Number(n).toLocaleString('en-IN');
  const fmtL2 = n => !n ? '—' : (n / 100000).toFixed(2) + ' L';      // ₹ in Lakhs
  const pctColor = p => p == null ? 'var(--t3)' : (p >= 80 ? '#34d399' : p >= 50 ? '#fbbf24' : '#f87171');

  // CSV export helpers
  const downloadCSV = (filename, headers, rows) => {
    const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
    const csv = '﻿' + [headers, ...rows].map(r => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 4000);
  };

  const exportOverall = () => {
    downloadCSV(
      `Sales-by-Category_${month}.csv`,
      ['Category','Sub-Category','Quantity'],
      filteredByCatRows.map(r => [r.category, r.subCategory, r.qty]),
    );
  };
  const exportByDealer = () => {
    downloadCSV(
      `Sales-by-Dealer-Category_${month}.csv`,
      ['Dealer', ...categories, 'Total'],
      dealerRowsAdj.map(r => [
        r.dealer,
        ...categories.map(c => Object.values(r.byCategory?.[c]||{}).reduce((s,v)=>s+v,0)),
        r.total,
      ]),
    );
  };
  const exportBySalesman = () => {
    downloadCSV(
      `Sales-by-Salesman-Category_${month}.csv`,
      ['Salesman', ...categories, 'Total'],
      salesmanRowsAdj.map(r => [
        r.salesman,
        ...categories.map(c => Object.values(r.byCategory?.[c]||{}).reduce((s,v)=>s+v,0)),
        r.total,
      ]),
    );
  };

  return (
    <div className="fade" style={{display:'grid',gap:14}}>

      {/* ── Header bar ─────────────────────────────────────────── */}
      <div className="row">
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <BarChart3 size={18} color="var(--acc)"/>
          <div>
            <div style={{fontSize:18,fontWeight:700}}>Category-wise Sales</div>
            <div style={{fontSize:12,color:'var(--t3)'}}>Overall · Dealer-wise · Salesman-wise</div>
          </div>
        </div>
        <div className="spacer"/>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <Calendar size={14} color="var(--t3)"/>
          <select value={month} onChange={e=>setMonth(e.target.value)} className="inp" style={{minWidth:140}}>
            {months.length === 0 && <option value="">(no data yet)</option>}
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button className="btn" onClick={load} disabled={loading}>
          <RefreshCw size={13} className={loading?'spin':''}/>
        </button>
        {allCategories.length > 0 && (
          <CategoryFilter
            categories={allCategories.map(c => {
              const total = filteredByCatRows
                .concat(byCat.rows.filter(r => excluded.has(r.category)))
                .filter(r => r.category === c)
                .reduce((s,r) => s + (r.qty||0), 0);
              return { category: c, total };
            })}
            excluded={excluded}
            onToggle={toggleExcluded}
            onClear={clearExcluded}
            onSelectOnly={(cat)=>{
              setExcluded(new Set(allCategories.filter(c=>c!==cat)));
            }}
            label="Categories"
          />
        )}
        {isAdmin && month && byCat.grandTotal > 0 && (
          <button
            className="btn"
            onClick={handleDeleteMonth}
            title={`Delete all category sales for ${month} from DB`}
            style={{
              color:'#fca5a5',
              border:'1px solid rgba(248,113,113,0.4)',
              background:'rgba(248,113,113,0.08)',
              display:'inline-flex', alignItems:'center', gap:5,
            }}>
            <Trash2 size={12}/> Delete {month}
          </button>
        )}
      </div>

      {/* ── Total Sale KPI bar ─────────────────────────────────── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>
            Grand Total — {month||'—'} {excluded.size>0 && <span style={{color:'#fbbf24'}}>(excl. {excluded.size})</span>}
          </div>
          <div style={{fontSize:26,fontWeight:800,marginTop:4,color:'#34d399'}}>{fmt(filteredGrandTotal)}</div>
          <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>
            {excluded.size > 0
              ? <>total units (excluding <b>{[...excluded].join(', ')}</b>)</>
              : 'total units sold across all categories'}
          </div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Categories</div>
          <div style={{fontSize:26,fontWeight:800,marginTop:4}}>{overallByCategory.length}</div>
          <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>categories included in totals</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Dealers Selling</div>
          <div style={{fontSize:26,fontWeight:800,marginTop:4}}>{dealerRowsAdj.filter(r=>r.total>0).length}</div>
          <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>distinct dealers in this month</div>
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Salesmen Selling</div>
          <div style={{fontSize:26,fontWeight:800,marginTop:4}}>{salesmanRowsAdj.filter(r=>r.total>0).length}</div>
          <div style={{fontSize:11,color:'var(--t3)',marginTop:2}}>distinct salesmen with sales</div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────── */}
      <div className="tabs">
        <button className={`tab ${tab==='overall'?'active':''}`}  onClick={()=>setTab('overall')}>Overall</button>
        <button className={`tab ${tab==='dealer'?'active':''}`}   onClick={()=>setTab('dealer')}>Dealer-wise</button>
        <button className={`tab ${tab==='salesman'?'active':''}`} onClick={()=>setTab('salesman')}>Salesman-wise</button>
      </div>

      {/* ── OVERALL ────────────────────────────────────────────── */}
      {tab === 'overall' && (
        <>
          <div className="row" style={{marginBottom:4}}>
            <div className="spacer"/>
            <button className="btn" onClick={exportOverall} disabled={!byCat.rows.length}>
              <Download size={13}/> Export CSV
            </button>
          </div>
          {overallByCategory.length === 0 ? (
            <div className="card" style={{padding:30,textAlign:'center',color:'var(--t3)'}}>
              No sales data uploaded for {month}.
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
              {overallByCategory.map(g => {
                const pct = filteredGrandTotal ? (g.total / filteredGrandTotal * 100) : 0;
                return (
                  <div key={g.category} className="card" style={{padding:14}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                      <div style={{fontSize:13,fontWeight:700,flex:1}}>{g.category}</div>
                      <div style={{fontSize:18,fontWeight:800,color:'#34d399'}}>{fmt(g.total)}</div>
                    </div>
                    <div style={{height:6,background:'var(--bg1)',borderRadius:3,overflow:'hidden',marginBottom:8}}>
                      <div style={{width:`${pct.toFixed(1)}%`,height:'100%',background:'linear-gradient(90deg,#6366f1,#34d399)'}}/>
                    </div>
                    <div style={{fontSize:11,color:'var(--t3)',marginBottom:6}}>
                      {pct.toFixed(1)}% of total
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {g.subs.sort((a,b)=>b.qty-a.qty).map(s => (
                        <span key={s.subCategory} style={{
                          fontSize:11,padding:'2px 8px',borderRadius:6,
                          background:'var(--bg1)',border:'1px solid var(--b1)',
                        }}>
                          {s.subCategory}: <b>{fmt(s.qty)}</b>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── DEALER-WISE PIVOT ─────────────────────────────────── */}
      {tab === 'dealer' && (
        <>
          <div className="row" style={{marginBottom:4}}>
            <input
              className="inp" placeholder="Search dealer…"
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{maxWidth:260}}
            />
            <div className="spacer"/>
            <button className="btn" onClick={exportByDealer} disabled={!byDealer.rows.length}>
              <Download size={13}/> Export CSV
            </button>
          </div>
          <div className="card scroll" style={{padding:0,overflow:'auto'}}>
            <table>
              <thead>
                <tr>
                  <th style={{position:'sticky',left:0,background:'var(--bg2)',zIndex:2}}>Dealer</th>
                  {categories.map(c => <th key={c} style={{textAlign:'right'}}>{c}</th>)}
                  <th style={{textAlign:'right',background:'rgba(52,211,153,.08)'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredDealerRows.map(r => {
                  const clickable = !!onOpenDealer && dealerIdByName.has(String(r.dealer).toLowerCase().trim());
                  return (
                  <tr key={r.dealer} onClick={()=>clickable && openDealerByName(r.dealer)}
                      style={clickable ? { cursor:'pointer' } : undefined}
                      title={clickable ? 'Click to see this dealer\'s full category breakdown' : ''}>
                    <td style={{position:'sticky',left:0,background:'var(--bg2)',fontWeight:600,color:clickable?'var(--acc)':undefined,textDecoration:clickable?'underline dotted':'none'}}>{r.dealer}</td>
                    {categories.map(c => {
                      const v = Object.values(r.byCategory?.[c]||{}).reduce((s,v)=>s+v,0);
                      return <td key={c} style={{textAlign:'right',color:v?'var(--t2)':'var(--t3)'}}>{v? fmt(v) : '—'}</td>;
                    })}
                    <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{fmt(r.total)}</td>
                  </tr>
                  );
                })}
                {filteredDealerRows.length === 0 && (
                  <tr><td colSpan={categories.length + 2} style={{textAlign:'center',padding:18,color:'var(--t3)'}}>No data</td></tr>
                )}
              </tbody>
              {filteredDealerRows.length > 0 && (
                <tfoot>
                  <tr>
                    <td style={{position:'sticky',left:0,background:'var(--bg1)',fontWeight:800}}>Grand Total</td>
                    {categories.map(c => {
                      const sum = filteredDealerRows.reduce((s,r) => s + Object.values(r.byCategory?.[c]||{}).reduce((a,v)=>a+v,0), 0);
                      return <td key={c} style={{textAlign:'right',fontWeight:700,background:'var(--bg1)'}}>{sum?fmt(sum):'—'}</td>;
                    })}
                    <td style={{textAlign:'right',fontWeight:800,background:'rgba(52,211,153,.12)',color:'#34d399'}}>
                      {fmt(filteredDealerRows.reduce((s,r)=>s+r.total,0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}

      {/* ── SALESMAN-WISE PIVOT ───────────────────────────────── */}
      {tab === 'salesman' && (
        <>
          <div className="row" style={{marginBottom:4}}>
            <input
              className="inp" placeholder="Search salesman…"
              value={search} onChange={e=>setSearch(e.target.value)}
              style={{maxWidth:260}}
            />
            <div className="spacer"/>
            <button className="btn" onClick={exportBySalesman} disabled={!bySalesman.rows.length}>
              <Download size={13}/> Export CSV
            </button>
          </div>
          <div className="card scroll" style={{padding:0,overflow:'auto'}}>
            <table>
              <thead>
                <tr>
                  <th style={{position:'sticky',left:0,background:'var(--bg2)',zIndex:2}}>Salesman</th>
                  {categories.map(c => <th key={c} style={{textAlign:'right'}}>{c}</th>)}
                  <th style={{textAlign:'right',background:'rgba(52,211,153,.08)'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesmanRows.map(r => (
                  <tr key={r.salesman}>
                    <td style={{position:'sticky',left:0,background:'var(--bg2)',fontWeight:600}}>{r.salesman}</td>
                    {categories.map(c => {
                      const v = Object.values(r.byCategory?.[c]||{}).reduce((s,v)=>s+v,0);
                      return <td key={c} style={{textAlign:'right',color:v?'var(--t2)':'var(--t3)'}}>{v? fmt(v) : '—'}</td>;
                    })}
                    <td style={{textAlign:'right',fontWeight:700,color:'#34d399'}}>{fmt(r.total)}</td>
                  </tr>
                ))}
                {filteredSalesmanRows.length === 0 && (
                  <tr><td colSpan={categories.length + 2} style={{textAlign:'center',padding:18,color:'var(--t3)'}}>No data</td></tr>
                )}
              </tbody>
              {filteredSalesmanRows.length > 0 && (
                <tfoot>
                  <tr>
                    <td style={{position:'sticky',left:0,background:'var(--bg1)',fontWeight:800}}>Grand Total</td>
                    {categories.map(c => {
                      const sum = filteredSalesmanRows.reduce((s,r) => s + Object.values(r.byCategory?.[c]||{}).reduce((a,v)=>a+v,0), 0);
                      return <td key={c} style={{textAlign:'right',fontWeight:700,background:'var(--bg1)'}}>{sum?fmt(sum):'—'}</td>;
                    })}
                    <td style={{textAlign:'right',fontWeight:800,background:'rgba(52,211,153,.12)',color:'#34d399'}}>
                      {fmt(filteredSalesmanRows.reduce((s,r)=>s+r.total,0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* ── MTD Sales Summary — Region × Salesman × Category ───────── */}
          <div className="card" style={{padding:0, marginTop:14, overflow:'hidden', borderLeft:'3px solid #6366f1'}}>
            <div style={{padding:'10px 14px', borderBottom:'1px solid var(--b1)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
              <BarChart3 size={14} color="var(--acc)"/>
              <div style={{fontSize:13, fontWeight:700}}>MTD Sales Summary — {month || '—'}</div>
              <div style={{fontSize:11, color:'var(--t3)'}}>
                · Region / Salesman × Category · Targets pulled from Monthly Entry · Outstanding from Outstanding section
              </div>
            </div>
            <div style={{overflowX:'auto', maxHeight:'70vh'}}>
              <table>
                <thead>
                  {/* Row 1: Region | Salesman | <CategoryName spanning 2 cols> ... | Total spanning 2 cols | MTD % | Dealers | Outstanding */}
                  <tr style={{position:'sticky', top:0, background:'var(--bg2)', zIndex:2}}>
                    <th rowSpan={2} style={{textAlign:'left', position:'sticky', left:0, background:'var(--bg2)', zIndex:3, minWidth:120}}>Region</th>
                    <th rowSpan={2} style={{textAlign:'left', minWidth:140}}>Salesman</th>
                    {categories.map(c => (
                      <th key={'h-'+c} colSpan={2} style={{textAlign:'center', borderLeft:'1px solid var(--b1)', fontSize:11}}>{c}</th>
                    ))}
                    <th colSpan={2} style={{textAlign:'center', background:'rgba(99,102,241,.06)', borderLeft:'1px solid var(--b1)'}}>Total</th>
                    <th rowSpan={2} style={{textAlign:'right', background:'rgba(251,191,36,.05)'}}>MTD %</th>
                    <th rowSpan={2} style={{textAlign:'right'}}>Billed Dealers</th>
                    <th rowSpan={2} style={{textAlign:'right'}}>Outstanding ₹</th>
                  </tr>
                  {/* Row 2: T | A pair under each category, T | A under Total */}
                  <tr style={{position:'sticky', top:32, background:'var(--bg2)', zIndex:2}}>
                    {categories.map(c => (
                      <React.Fragment key={'sub-'+c}>
                        <th style={{textAlign:'right', fontSize:9, color:'var(--acc)', borderLeft:'1px solid var(--b1)', minWidth:55}}>Target</th>
                        <th style={{textAlign:'right', fontSize:9, color:'#34d399', minWidth:55}}>Ach</th>
                      </React.Fragment>
                    ))}
                    <th style={{textAlign:'right', fontSize:10, color:'var(--acc)', fontWeight:800, borderLeft:'1px solid var(--b1)'}}>Target</th>
                    <th style={{textAlign:'right', fontSize:10, color:'#34d399', fontWeight:800}}>Ach</th>
                  </tr>
                </thead>
                <tbody>
                  {mtdByRegion.map(({ region, rows, subtotal }) => (
                    <React.Fragment key={region}>
                      {rows.map((r, i) => (
                        <tr key={r.smId}>
                          {i === 0 && (
                            <td rowSpan={rows.length}
                              style={{position:'sticky', left:0, background:'var(--bg2)', fontWeight:700, color:'var(--t1)', verticalAlign:'top'}}>
                              {region}
                            </td>
                          )}
                          <td style={{fontWeight:600}}>{r.smName}</td>
                          {/* Per-category cells: Target | Ach SIDE-BY-SIDE.
                              Target is editable inline for admins; saved to /api/sales/targets on blur. */}
                          {categories.map(c => {
                            const t = r.perCatTarget?.[c] || 0;
                            const a = r.perCategory[c] || 0;
                            return (
                              <React.Fragment key={'pair-'+r.smId+c}>
                                <td style={{textAlign:'right', padding:'2px 4px', borderLeft:'1px solid var(--b1)'}}>
                                  {isAdmin ? (
                                    <input
                                      type="number"
                                      defaultValue={t || ''}
                                      placeholder="—"
                                      onBlur={e => {
                                        const newVal = Number(e.target.value) || 0;
                                        if (newVal !== t) setOneTarget(r.smId, c, newVal);
                                      }}
                                      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
                                      style={{
                                        width:60, textAlign:'right',
                                        background:'transparent',
                                        border: t > 0 ? '1px solid var(--b2)' : '1px dashed var(--b2)',
                                        borderRadius:4, padding:'2px 4px',
                                        fontSize:11, color: t > 0 ? 'var(--acc)' : 'var(--t3)',
                                      }}/>
                                  ) : (
                                    <span style={{color: t ? 'var(--acc)' : 'var(--t3)', fontWeight:600}}>{t ? fmtL(t) : '—'}</span>
                                  )}
                                </td>
                                <td style={{textAlign:'right', color: a?'#34d399':'var(--t3)', fontWeight: a?600:400}}>
                                  {a ? fmtL(a) : '—'}
                                </td>
                              </React.Fragment>
                            );
                          })}
                          {/* Total Target | Total Ach */}
                          <td style={{textAlign:'right', fontWeight:700, color:'var(--acc)', borderLeft:'1px solid var(--b1)', background:'rgba(99,102,241,.04)'}}>{fmtL(r.target)}</td>
                          <td style={{textAlign:'right', fontWeight:700, color:'#34d399', background:'rgba(52,211,153,.04)'}}>{fmtL(r.totalAch)}</td>
                          <td style={{textAlign:'right', fontWeight:700, color: pctColor(r.achievementPct)}}>
                            {r.achievementPct == null ? '—' : r.achievementPct + '%'}
                          </td>
                          <td style={{textAlign:'right'}}>{r.billedDealerCount || '—'}</td>
                          <td style={{textAlign:'right', color: r.outstanding > 0 ? '#f87171' : 'var(--t3)'}}>
                            {r.outstanding > 0 ? fmtL2(r.outstanding) : '—'}
                          </td>
                        </tr>
                      ))}
                      {/* Region subtotal row — paired Target | Ach per category */}
                      <tr style={{background:'var(--bg1)'}}>
                        <td colSpan={2} style={{position:'sticky', left:0, background:'var(--bg1)', fontWeight:800, fontSize:11, color:'var(--t2)'}}>
                          {region} Total
                        </td>
                        {categories.map(c => {
                          const t = subtotal.perCatTarget?.[c] || 0;
                          const a = subtotal.perCategory[c] || 0;
                          return (
                            <React.Fragment key={'srt-'+region+c}>
                              <td style={{textAlign:'right', fontWeight:700, color: t?'var(--acc)':'var(--t3)', borderLeft:'1px solid var(--b1)'}}>{t?fmtL(t):'—'}</td>
                              <td style={{textAlign:'right', fontWeight:700, color: a?'#34d399':'var(--t3)'}}>{a?fmtL(a):'—'}</td>
                            </React.Fragment>
                          );
                        })}
                        <td style={{textAlign:'right', fontWeight:800, color:'var(--acc)', borderLeft:'1px solid var(--b1)', background:'rgba(99,102,241,.06)'}}>{fmtL(subtotal.target)}</td>
                        <td style={{textAlign:'right', fontWeight:800, color:'#34d399', background:'rgba(52,211,153,.06)'}}>{fmtL(subtotal.totalAch)}</td>
                        <td style={{textAlign:'right', fontWeight:800, color: pctColor(subtotal.achievementPct)}}>
                          {subtotal.achievementPct == null ? '—' : subtotal.achievementPct + '%'}
                        </td>
                        <td style={{textAlign:'right', fontWeight:700}}>{subtotal.billedDealerCount || '—'}</td>
                        <td style={{textAlign:'right', fontWeight:700, color: subtotal.outstanding > 0 ? '#f87171' : 'var(--t3)'}}>
                          {subtotal.outstanding > 0 ? fmtL2(subtotal.outstanding) : '—'}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
                {mtdSummary.length > 0 && (
                  <tfoot>
                    <tr style={{background:'rgba(99,102,241,.10)'}}>
                      <td colSpan={2} style={{position:'sticky', left:0, background:'rgba(99,102,241,.10)', fontWeight:800}}>
                        Grand Total
                      </td>
                      {categories.map(c => {
                        const t = mtdGrand.perCatTarget?.[c] || 0;
                        const a = mtdGrand.perCategory[c] || 0;
                        return (
                          <React.Fragment key={'gt-'+c}>
                            <td style={{textAlign:'right', fontWeight:800, color: t?'var(--acc)':'var(--t3)', borderLeft:'1px solid var(--b1)'}}>{t?fmtL(t):'—'}</td>
                            <td style={{textAlign:'right', fontWeight:800, color: a?'#34d399':'var(--t3)'}}>{a?fmtL(a):'—'}</td>
                          </React.Fragment>
                        );
                      })}
                      <td style={{textAlign:'right', fontWeight:800, color:'var(--acc)', borderLeft:'1px solid var(--b1)', background:'rgba(99,102,241,.12)'}}>{fmtL(mtdGrand.target)}</td>
                      <td style={{textAlign:'right', fontWeight:800, color:'#34d399', background:'rgba(52,211,153,.12)'}}>{fmtL(mtdGrand.totalAch)}</td>
                      <td style={{textAlign:'right', fontWeight:800, color: pctColor(mtdGrand.achievementPct)}}>
                        {mtdGrand.achievementPct == null ? '—' : mtdGrand.achievementPct + '%'}
                      </td>
                      <td style={{textAlign:'right', fontWeight:800}}>{mtdGrand.billedDealerCount || '—'}</td>
                      <td style={{textAlign:'right', fontWeight:800, color: mtdGrand.outstanding > 0 ? '#f87171' : 'var(--t3)'}}>
                        {mtdGrand.outstanding > 0 ? fmtL2(mtdGrand.outstanding) : '—'}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
              {mtdSummary.length === 0 && (
                <div style={{padding:24, textAlign:'center', color:'var(--t3)', fontSize:12}}>
                  No salesman data yet for {month}.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesByCategory;
