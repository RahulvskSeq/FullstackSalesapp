
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, BarChart3, Users, User, Download, TrendingUp, RefreshCw, Trash2, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { notify, confirmDialog } from './Toast';
import CategoryFilter from './CategoryFilter';
import { PageHead } from '../collections/ui';
import { useGlobalCategoryFilter } from '../hooks/useGlobalCategoryFilter';
import { useT } from '../i18n';

/**
 * SalesByCategory — three views over uploaded category-wise sales:
 *   • Overall        → category totals (with sub-cat breakdown) + Grand Total
 *   • By Dealer      → pivot table: rows=dealer, cols=category, totals
 *   • By Salesman    → pivot table: rows=salesman, cols=category, totals
 *
 * All three respect the same Month filter at the top.
 */

const fmt = n => (n == null ? '—' : Number(n).toLocaleString('en-IN'));

// `onlyMtd` renders JUST the MTD Sales Summary card — used on Overview, where
// the tabs, KPIs and pivots would be noise. The data behind it is already
// scoped server-side, so a salesman opening Overview sees only their own row.
const SalesByCategory = ({ currentUser, users={}, dealers=[], outstandingData=[], onOpenDealer, onlyMtd=false } = {}) => {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const { t: tr } = useT();
  // MTD summary on Home opens as salesman cards; the table (where targets are typed) is one tap away
  const [mtdView, setMtdView] = useState(onlyMtd ? 'summary' : 'table');
  const mtdOpenState = useState(null);   // which salesman's category split is open

  // Build a name → dealerId index so clicking a dealer row in the pivot opens
  // their modal at the Categories tab.
  const dealerIdByName = useMemo(() => {
    const m = new Map();
    for (const d of (dealers || [])) {
      if (d?.name && d?.id) m.set(String(d.name).toLowerCase().trim(), d.id);
    }
    return m;
  }, [dealers]);
  // Display-only: name → "zone · city" for the secondary line under dealer names.
  const dealerPlaceByName = useMemo(() => {
    const m = new Map();
    for (const d of (dealers || [])) {
      if (d?.name) m.set(String(d.name).toLowerCase().trim(), [d.zone, d.city].filter(Boolean).join(' · '));
    }
    return m;
  }, [dealers]);
  const ini = (name) => (
    <span className="ini" style={{'--h':(String(name||'?')).charCodeAt(0)*37%360}}>{String(name||'?').replace(/[^A-Za-z0-9]/g,'').slice(0,2).toUpperCase()}</span>
  );
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
  // Sequence number so an older month's reply cannot overwrite a newer one.
  const loadSeq = useRef(0);
  const load = async () => {
    if (!month) return;
    const seq = ++loadSeq.current;
    setLoading(true);
    try {
      const [a, b, c] = await Promise.all([
        api.salesByCategory({ month }),
        api.salesByDealer({ month }),
        api.salesBySalesman({ month }),
      ]);
      if (seq !== loadSeq.current) return;
      setByCat(a); setByDealer(b); setBySalesman(c);
    } catch(e) { if (seq === loadSeq.current) notify.error(e.message); }
    if (seq === loadSeq.current) setLoading(false);
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
      // Each step swallows its error into `_err`; report failures instead of success.
      const failedSteps = [
        ['sale rows', r1], ['dealer-months', r2], ['bad-upload dealers', r0],
        ['exact dupes', r3], ['suffix dupes', r4],
      ].filter(([, r]) => r?._err).map(([label, r]) => `${label}: ${r._err}`);
      if (failedSteps.length) {
        notify.error(`Reset ${month} incomplete — ${failedSteps.length} step${failedSteps.length === 1 ? '' : 's'} failed: ${failedSteps.join('; ')}`);
      } else {
        notify.success(
          `Reset ${month}: ${r0.deleted||0} bad-upload dealers · ${r1.deleted||0} sale rows · ${r2.dealersTouched||0} dealer-months · ${(r3.duplicatesRemoved ?? r3.removed) || 0} exact dupes · ${r4.deleted || 0} suffix dupes.`
        );
      }
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

  // Every category that EXISTS, from the master list — not just the ones with
  // sales this month, and not filtered by the user's include/exclude chips.
  //
  // The MTD summary is a planning table: you set targets there, so a category
  // has to be visible whether or not it sold anything yet. It also has to
  // ignore the category filter — LINER is commonly excluded from totals, and
  // the laminate rule writes a Liner target, which was landing in a column
  // nobody could see.
  const [masterCategories, setMasterCategories] = useState([]);
  useEffect(() => {
    api.categoriesList()
      .then(cs => setMasterCategories((cs||[]).map(c => c.name).filter(Boolean).sort()))
      .catch(() => setMasterCategories([]));
  }, []);
  const mtdCategories = useMemo(() => {
    const base = masterCategories.length ? masterCategories : allCategories;
    // Order by this month's volume, biggest first — the same order the
    // category filter lists them in, so the two read as one thing. Categories
    // with no sales yet fall to the end alphabetically rather than being
    // scattered through the row by an alphabetical sort.
    const qty = new Map();
    for (const r of (byCat.rows || [])) {
      qty.set(r.category, (qty.get(r.category) || 0) + (r.qty || 0));
    }
    return [...base].sort((a, b) => {
      const qa = qty.get(a) || 0, qb = qty.get(b) || 0;
      if (qa !== qb) return qb - qa;
      return a.localeCompare(b);
    });
  }, [masterCategories, allCategories, byCat]);

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
  // Resolve raw salesman IDs ("rakesh") to display names ("Rakesh Sharma"),
  // drop the synthetic '_none' / '_unknown' / blank rows, and skip any row
  // whose total comes out as 0 after the category filter (so the table only
  // shows live, real salesmen — no "All" / placeholder garbage).
  const filteredSalesmanRows = salesmanRowsAdj
    .filter(r => {
      const id = String(r.salesman || '').trim();
      if (!id || id === '_none' || id === '_unknown' || /^all$/i.test(id)) return false;
      return true;
    })
    .map(r => ({
      ...r,
      _displayName: users?.[r.salesman]?.name || r.salesman,
    }))
    .filter(r => !search || r._displayName.toLowerCase().includes(search.toLowerCase()));

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

  // Typing a LAMINATE target fills the rest in from it. The other categories
  // are planned as a ratio of laminate, so entering five numbers per salesman
  // by hand is five chances to get one wrong.
  //
  // Categories not listed here — EDGE BANDING, OTHER, and anything else — are
  // left ALONE rather than zeroed: they carry no target by default, and
  // clobbering them would quietly wipe a figure someone set on purpose.
  const TARGET_FROM_LAMINATE = {
    'LINER':         lam => lam,                    // 100% of laminate
    'LOUVRES':       lam => Math.round(lam * 0.30), // 30%
    'POLYMER SHEET': lam => Math.round(lam * 0.10), // 10%
    'ROLLS':         ()  => 20,                     // flat 20
  };

  // Colour an achievement against ITS OWN target, so a cell says whether that
  // number is good rather than just how big it is. Grey when no target is set —
  // a figure with nothing to hit isn't behind, it's unplanned.
  const achTone = (ach, target) => {
    if (!target)      return { color:'var(--t2)',  weight:600 };
    const p = (ach / target) * 100;
    if (p >= 100)     return { color:'#16a34a',    weight:800 };
    if (p >= 60)      return { color:'#65a30d',    weight:700 };
    if (p >= 30)      return { color:'#ca8a04',    weight:700 };
    return              { color:'#dc2626',    weight:700 };
  };
  // Thin progress bar for the Total column — the one place a row's overall
  // standing is worth showing at a glance.
  const Progress = ({ ach, target }) => {
    if (!target) return null;
    const p = Math.min(100, Math.round((ach / target) * 100));
    const c = p >= 100 ? '#16a34a' : p >= 60 ? '#65a30d' : p >= 30 ? '#ca8a04' : '#dc2626';
    return (
      <div style={{height:3, background:'var(--b1)', borderRadius:2, marginTop:3, overflow:'hidden'}}>
        <div style={{height:'100%', width:p+'%', background:c, borderRadius:2}}/>
      </div>
    );
  };

  const setOneTarget = async (salesmanId, category, target) => {
    const value = Number(target) || 0;
    const cat   = String(category || '').trim().toUpperCase();

    // Work out every cell this edit touches, then write them together so the
    // table doesn't repaint once per category.
    const writes = [[category, value]];
    if (cat === 'LAMINATE' && value > 0) {
      for (const [c, fn] of Object.entries(TARGET_FROM_LAMINATE)) {
        // Guard on the MASTER list, not the filtered one. `categories`
        // drops whatever the user has excluded — LINER usually — so the
        // Liner target was silently skipped rather than written.
        if (mtdCategories.includes(c)) writes.push([c, fn(value)]);
      }
    }

    const next = new Map(catTargets);
    writes.forEach(([c, v]) => next.set(targetsKey(salesmanId, c), v));
    setCatTargets(next);

    if (!isAdmin) return;
    try {
      await Promise.all(writes.map(([c, v]) =>
        api.salesTargetSet({ salesmanId, category: c, month, target: v })));
      if (writes.length > 1) {
        notify.success(`Laminate ${value} → ${writes.slice(1).map(([c,v])=>`${c} ${v}`).join(' · ')}`);
      }
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
      // Deliberately NOT filtered by the category chips. This table is the
      // planning view — it shows every category so targets can be set against
      // all of them, and its achievement figures have to match those columns.
      // The chips still scope the Overall / By Dealer / By Salesman pivots
      // above, which is where excluding a category from totals belongs.
      for (const [cat, subs] of Object.entries(row.byCategory || {})) {
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

      // Per-category target lookup. The MTD Sales Summary's Total Target is
      // built ONLY from values entered in this table (the inline inputs),
      // NOT from dealer.monthlyData. That keeps Monthly Entry's per-dealer
      // targets independent and lets this view be the single source of
      // truth for "salesman × category" volume targets.
      const perCatTarget = {};
      let totalPerCatTarget = 0;
      // Master list, not the filtered one — otherwise a target set against a
      // category someone later excludes vanishes from the row AND drops out of
      // the Total, making the plan look smaller than it is.
      for (const c of mtdCategories) {
        const t = catTargets.get(`${e.smId}|${c}`) || 0;
        if (t > 0) { perCatTarget[c] = t; totalPerCatTarget += t; }
      }

      return {
        ...e,
        region,
        totalAch,
        target: totalPerCatTarget,         // sum of per-cat targets ONLY
        dealerTargetSum: e.target,         // raw dealer-level total (kept for reference)
        perCatTarget,                      // { catName: target }
        billedDealerCount: e.dealersWithSales.size,
        achievementPct: totalPerCatTarget > 0 ? Math.round(totalAch / totalPerCatTarget * 100) : null,
      };
    }).filter(e => e.smName !== '_none' && e.smName !== '_unknown')
      .sort((a,b) => (a.region || '').localeCompare(b.region || '') || (b.totalAch - a.totalAch));
    return rows;
  }, [dealers, users, byDealer, outstandingData, catTargets, mtdCategories]);

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
  const pctColor = p => p == null ? 'var(--t3)' : (p >= 80 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444');

  // CSV export helpers
  const downloadCSV = (filename, headers, rows) => {
    const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
    const csv = '﻿' + [headers, ...rows].map(r => r.map(esc).join(',')).join('\n');
    // works in the browser and inside the Android app
    import('../lib/saveFile').then(m => m.saveText(csv, filename, 'text/csv;charset=utf-8'));
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
      // Use the same cleaned + name-resolved list the table shows so the CSV
      // matches what the user sees (no raw IDs, no placeholder rows).
      filteredSalesmanRows.map(r => [
        r._displayName,
        ...categories.map(c => Object.values(r.byCategory?.[c]||{}).reduce((s,v)=>s+v,0)),
        r.total,
      ]),
    );
  };

  // The MTD summary card, built once and rendered either inside the full
  // Category-wise Sales page or on its own via `onlyMtd`.
  // ── MTD Sales Summary — Region × Salesman × Category ─────────────────
  const mtdCard = (
        <div className="card mtd-card" style={{padding:0, marginTop:14, overflow:'hidden'}}>
          <div className="sec-title" style={{padding:'12px 16px', borderBottom:'1px solid var(--b2)',
            background:'var(--bg2)', marginBottom:0}}>
            <span className="sec-ico" style={{'--tone':'var(--grn)'}}><BarChart3 size={15}/></span>
            <div>MTD Sales Summary — {month || '—'}</div>
            <div className="sec-note">Region / Salesman × Category</div>
          </div>
          <div style={{overflowX:'auto', maxHeight:'70vh'}}>
            <table className="mtd-table">
              <thead>
                {/* Row 1: Region | Salesman | <CategoryName spanning 2 cols> ... | Total spanning 2 cols | MTD % | Dealers | Outstanding */}
                <tr style={{position:'sticky', top:0, background:'var(--bg2)', zIndex:2}}>
                  <th rowSpan={2} style={{textAlign:'left', position:'sticky', left:0, background:'var(--bg2)', zIndex:3, minWidth:120}}>Region</th>
                  <th rowSpan={2} style={{textAlign:'left', minWidth:140}}>Salesman</th>
                  {mtdCategories.map((c, i) => {
                    // A category with nothing sold and nothing planned is
                    // still shown — you may want to set a target on it — but
                    // it recedes rather than competing with the live ones.
                    const dead = !(byCat.rows||[]).some(r => r.category === c && r.qty > 0);
                    return (
                      <th key={'h-'+c} colSpan={2}
                        className={'cat-start' + (i % 2 ? ' cat-alt' : '')}
                        style={{textAlign:'center', fontSize:11,
                          color: dead ? 'var(--t3)' : 'var(--t1)', fontWeight: dead ? 500 : 800,
                          opacity: dead ? .55 : 1}}>{c}</th>
                    );
                  })}
                  <th colSpan={2} className="col-total col-total-start"
                    style={{textAlign:'center', fontWeight:800, color:'var(--acc)'}}>Total</th>
                  {/* MTD %, Billed Dealers and Outstanding were here. This
                      table is for setting and reading targets; Outstanding
                      has its own section, and the percentages read 1-2%
                      while targets are still being filled in. */}
                </tr>
                {/* Row 2: T | A pair under each category, T | A under Total */}
                <tr style={{position:'sticky', top:32, background:'var(--bg2)', zIndex:2}}>
                  {mtdCategories.map(c => (
                    <React.Fragment key={'sub-'+c}>
                      <th style={{textAlign:'right', fontSize:9, color:'var(--acc)', borderLeft:'1px solid var(--b1)', minWidth:55}}>Target</th>
                      <th style={{textAlign:'right', fontSize:9, color:'var(--grn)', minWidth:55}}>Ach</th>
                    </React.Fragment>
                  ))}
                  <th style={{textAlign:'right', fontSize:10, color:'var(--acc)', fontWeight:800, borderLeft:'1px solid var(--b1)'}}>Target</th>
                  <th style={{textAlign:'right', fontSize:10, color:'var(--grn)', fontWeight:800}}>Ach</th>
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
                        <td style={{fontWeight:600}}>
                          <div style={{display:'flex',alignItems:'center',gap:9,minWidth:0}}>
                            {ini(r.smName)}
                            <div style={{minWidth:0}}><div style={{fontWeight:700,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.smName}</div><div style={{fontSize:10.5,color:'var(--t3)',fontWeight:500}}>{region}</div></div>
                          </div>
                        </td>
                        {/* Per-category cells: Target | Ach SIDE-BY-SIDE.
                            Target is editable inline for admins; saved to /api/sales/targets on blur. */}
                        {mtdCategories.map((c, ci) => {
                          const t = r.perCatTarget?.[c] || 0;
                          const a = r.perCategory[c] || 0;
                          return (
                            <React.Fragment key={'pair-'+r.smId+c}>
                              <td className={'cat-start' + (ci % 2 ? ' cat-alt' : '')} style={{textAlign:'right', padding:'2px 4px'}}>
                                {isAdmin ? (
                                  <input
                                    // Keyed on the value: these are uncontrolled
                                    // inputs, so without a remount a derived
                                    // target would save but never show up.
                                    key={'t-'+r.smId+c+t}
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
                              <td className={ci % 2 ? 'cat-alt' : ''} style={{textAlign:'right',
                                color: a ? achTone(a,t).color : 'var(--t3)',
                                fontWeight: a ? achTone(a,t).weight : 400}}>
                                {a ? fmtL(a) : '—'}
                              </td>
                            </React.Fragment>
                          );
                        })}
                        {/* Total Target | Total Ach */}
                        <td className="col-total col-total-start" style={{textAlign:'right', fontWeight:700, color:'var(--acc)'}}>{fmtL(r.target)}</td>
                        <td className="col-total" style={{textAlign:'right'}}>
                          <div style={{display:'inline-flex', alignItems:'center', gap:6}}>
                            <span style={{fontWeight:800, color: achTone(r.totalAch, r.target).color}}>{fmtL(r.totalAch)}</span>
                            {r.target > 0 && (
                              <span style={{
                                fontSize:9.5, fontWeight:800, padding:'1px 5px', borderRadius:99,
                                color: achTone(r.totalAch, r.target).color,
                                background: achTone(r.totalAch, r.target).color + '1f',
                              }}>
                                {Math.round((r.totalAch / r.target) * 100)}%
                              </span>
                            )}
                          </div>
                          {r.target > 0 && <div className="pbar"><div style={{width:Math.min(Math.round((r.totalAch / r.target) * 100),100)+'%',background:achTone(r.totalAch, r.target).color}}/></div>}
                        </td>
                      </tr>
                    ))}
                    {/* Region subtotal row — paired Target | Ach per category */}
                    <tr className="row-subtotal">
                      <td colSpan={2} style={{position:'sticky', left:0, fontSize:11, color:'var(--t2)'}}>
                        {region} Total
                      </td>
                      {mtdCategories.map(c => {
                        const t = subtotal.perCatTarget?.[c] || 0;
                        const a = subtotal.perCategory[c] || 0;
                        return (
                          <React.Fragment key={'srt-'+region+c}>
                            <td style={{textAlign:'right', fontWeight:700, color: t?'var(--acc)':'var(--t3)', borderLeft:'1px solid var(--b1)'}}>{t?fmtL(t):'—'}</td>
                            <td style={{textAlign:'right', fontWeight:700, color: a?'var(--grn)':'var(--t3)'}}>{a?fmtL(a):'—'}</td>
                          </React.Fragment>
                        );
                      })}
                      <td style={{textAlign:'right', fontWeight:800, color:'var(--acc)', borderLeft:'1px solid var(--b1)', background:'color-mix(in srgb, var(--acc) 6%, transparent)'}}>{fmtL(subtotal.target)}</td>
                      <td style={{textAlign:'right', fontWeight:800, color:'var(--grn)', background:'color-mix(in srgb, var(--grn) 6%, transparent)'}}>{fmtL(subtotal.totalAch)}</td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
              {mtdSummary.length > 0 && (
                <tfoot>
                  <tr className="row-grand">
                    <td colSpan={2} style={{position:'sticky', left:0}}>
                      Grand Total
                    </td>
                    {mtdCategories.map(c => {
                      const t = mtdGrand.perCatTarget?.[c] || 0;
                      const a = mtdGrand.perCategory[c] || 0;
                      return (
                        <React.Fragment key={'gt-'+c}>
                          <td style={{textAlign:'right', fontWeight:800, color: t?'var(--acc)':'var(--t3)', borderLeft:'1px solid var(--b1)'}}>{t?fmtL(t):'—'}</td>
                          <td style={{textAlign:'right', fontWeight:800, color: a?'var(--grn)':'var(--t3)'}}>{a?fmtL(a):'—'}</td>
                        </React.Fragment>
                      );
                    })}
                    <td style={{textAlign:'right', fontWeight:800, color:'var(--acc)', borderLeft:'1px solid var(--b1)', background:'color-mix(in srgb, var(--acc) 12%, transparent)'}}>{fmtL(mtdGrand.target)}</td>
                    <td style={{textAlign:'right', fontWeight:800, color:'var(--grn)', background:'color-mix(in srgb, var(--grn) 12%, transparent)'}}>{fmtL(mtdGrand.totalAch)}</td>
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
          {isAdmin && <div className="mtd-tip">Tip: type a LAMINATE target and the rest fill in — Liner 100%, Louvres 30%, Polymer 10%, Rolls 20.</div>}
        </div>
  );

  // ── Card view of the same numbers: one card per salesman, grouped by region ──
  const MTD_CLR = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#ef4444','#64748b','#14b8a6','#f97316'];
  const pctOf = (a, t) => t > 0 ? Math.round(a / t * 100) : null;
  const mtdRowsAll = mtdByRegion.flatMap(g => g.rows);
  const mtdHit  = mtdRowsAll.filter(r => r.target > 0 && r.totalAch >= r.target).length;
  const mtdLow  = mtdRowsAll.filter(r => r.target > 0 && r.totalAch < r.target * 0.5).length;
  const mtdBest = [...mtdRowsAll].filter(r => r.target > 0).sort((a, b) => b.totalAch / b.target - a.totalAch / a.target)[0];
  const grandTone = achTone(mtdGrand.totalAch, mtdGrand.target).color;
  const mtdStrip = (
    <div className="mtd-kpis">
      <div className="mtd-kpi" style={{'--tone':'#3b82f6'}}><span>Target</span><b>{fmtL(mtdGrand.target)}</b></div>
      <div className="mtd-kpi" style={{'--tone':'#10b981'}}><span>Achieved</span><b>{fmtL(mtdGrand.totalAch)}</b></div>
      <div className="mtd-kpi" style={{'--tone':grandTone}}><span>Achievement</span><b>{mtdGrand.achievementPct ?? '—'}{mtdGrand.achievementPct != null ? '%' : ''}</b>
        {mtdGrand.target > 0 && <div className="pbar"><div style={{width:Math.min(mtdGrand.achievementPct||0,100)+'%',background:grandTone}}/></div>}</div>
      <div className="mtd-kpi" style={{'--tone':'#16a34a'}}><span>Hit target</span><b>{mtdHit}<small> / {mtdRowsAll.length}</small></b></div>
      <div className="mtd-kpi" style={{'--tone':'#dc2626'}}><span>Below 50%</span><b>{mtdLow}</b></div>
      {mtdBest && <div className="mtd-kpi" style={{'--tone':'#f59e0b'}}><span>Leading</span><b className="nm">{mtdBest.smName}</b><small>{pctOf(mtdBest.totalAch, mtdBest.target)}% of target</small></div>}
    </div>
  );
  // Summary table: kept deliberately plain — target, achieved and one % per
  // salesman, grouped by region. Tap a salesman to see the category split.
  const [openSm, setOpenSm] = mtdOpenState;
  const pctPill = (a, t) => {
    const p = pctOf(a, t);
    if (p === null) return <span className="mt3-pct none">—</span>;
    return <span className="mt3-pct" style={{'--tone':achTone(a, t).color}}>{p}%</span>;
  };
  const bar = (a, t) => t > 0 ? <div className="mt3-bar"><div style={{width:Math.min(pctOf(a, t), 100) + '%', background:achTone(a, t).color}}/></div> : null;
  const mtdTable = (
    <div className="mt3-wrap">
      <table className="mt3">
        <thead>
          <tr><th className="l">Salesman</th><th>Target</th><th>Achieved</th><th className="w">Achievement</th></tr>
        </thead>
        <tbody>
          {mtdByRegion.map(({ region, rows, subtotal }) => {
            const ordered = [...rows].sort((a, b) => (pctOf(b.totalAch, b.target) ?? -1) - (pctOf(a.totalAch, a.target) ?? -1) || b.totalAch - a.totalAch);
            return (
              <React.Fragment key={region}>
                <tr className="mt3-region">
                  <td className="l">{region} <span>· {rows.length}</span></td>
                  <td>{fmtL(subtotal.target)}</td>
                  <td>{fmtL(subtotal.totalAch)}</td>
                  <td className="w"><div className="mt3-ach">{pctPill(subtotal.totalAch, subtotal.target)}{bar(subtotal.totalAch, subtotal.target)}</div></td>
                </tr>
                {ordered.map(r => {
                  const open = openSm === r.smId;
                  const cats = mtdCategories.map(c => ({ c, t: r.perCatTarget?.[c] || 0, a: r.perCategory[c] || 0 })).filter(x => x.t || x.a);
                  return (
                    <React.Fragment key={r.smId}>
                      <tr className={'mt3-row' + (open ? ' open' : '')} onClick={() => setOpenSm(open ? null : r.smId)} title="Tap to see the category split">
                        <td className="l">
                          <div className="mt3-who">{ini(r.smName)}<span className="mt3-name">{r.smName}</span><ChevronRight size={14} className="mt3-chev"/></div>
                        </td>
                        <td>{r.target ? fmtL(r.target) : <span className="mt3-muted">—</span>}</td>
                        <td className="b">{fmtL(r.totalAch)}</td>
                        <td className="w"><div className="mt3-ach">{pctPill(r.totalAch, r.target)}{bar(r.totalAch, r.target)}</div></td>
                      </tr>
                      {open && (
                        <tr className="mt3-detail"><td colSpan={4}>
                          {cats.length === 0 ? <span className="mt3-muted">No category sales or targets yet.</span> : (
                            <div className="mt3-cats">
                              {cats.map(x => (
                                <div key={x.c} className="mt3-cat">
                                  <span className="mt3-cat-n">{x.c}</span>
                                  <span className="mt3-cat-v"><b>{x.a.toLocaleString('en-IN')}</b>{x.t ? <> / {x.t.toLocaleString('en-IN')}</> : ''}</span>
                                  {x.t ? pctPill(x.a, x.t) : <span className="mt3-pct none">no target</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </td></tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
        {mtdRowsAll.length > 0 && (
          <tfoot>
            <tr className="mt3-grand">
              <td className="l">Total</td>
              <td>{fmtL(mtdGrand.target)}</td>
              <td>{fmtL(mtdGrand.totalAch)}</td>
              <td className="w"><div className="mt3-ach">{pctPill(mtdGrand.totalAch, mtdGrand.target)}{bar(mtdGrand.totalAch, mtdGrand.target)}</div></td>
            </tr>
          </tfoot>
        )}
      </table>
      {mtdRowsAll.length === 0 && <div className="mtd-none" style={{padding:24,textAlign:'center'}}>No salesman data yet for {month}.</div>}
    </div>
  );
  const mtdCards = (
    <div className="mtd-groups">
      {mtdByRegion.map(({ region, rows, subtotal }) => {
        const sp = pctOf(subtotal.totalAch, subtotal.target);
        return (
          <div key={region} className="mtd-group">
            <div className="mtd-ghead">
              <b>{region}</b><span className="count-pill">{rows.length}</span>
              <span style={{flex:1}}/>
              <span className="mtd-gfig"><b>{fmtL(subtotal.totalAch)}</b> / {fmtL(subtotal.target)}</span>
              {sp !== null && <span className="mtd-gpct" style={{'--tone':achTone(subtotal.totalAch, subtotal.target).color}}>{sp}%</span>}
            </div>
            <div className="mtd-cards">
              {rows.map(r => {
                const p = pctOf(r.totalAch, r.target);
                const tone = achTone(r.totalAch, r.target).color;
                const cats = mtdCategories.map((c, i) => ({ c, i, t: r.perCatTarget?.[c] || 0, a: r.perCategory[c] || 0 })).filter(x => x.t || x.a);
                return (
                  <div key={r.smId} className="mtd-sm" style={{'--tone':tone}}>
                    <div className="mtd-sm-top">
                      {ini(r.smName)}
                      <div className="mtd-sm-nm"><b>{r.smName}</b><small>{region}</small></div>
                      <div className="mtd-sm-pct"><b>{p === null ? '—' : p + '%'}</b><small>{p === null ? 'no target' : 'achieved'}</small></div>
                    </div>
                    <div className="mtd-sm-fig"><b>{fmtL(r.totalAch)}</b><span>{r.target ? `of ${fmtL(r.target)} target` : 'no target set'}</span></div>
                    {r.target > 0 && <div className="pbar"><div style={{width:Math.min(p,100)+'%',background:tone}}/></div>}
                    <div className="mtd-sm-cats">
                      {cats.length === 0 ? <div className="mtd-none">No sales or targets yet</div> : cats.map(x => {
                        const cp = pctOf(x.a, x.t), ct = x.t ? achTone(x.a, x.t).color : MTD_CLR[x.i % MTD_CLR.length];
                        return (
                          <div key={x.c} className="mtd-cat" title={`${x.c}: ${x.a.toLocaleString('en-IN')} sold${x.t ? ` of ${x.t.toLocaleString('en-IN')} target (${cp}%)` : ' · no target'}`}>
                            <span className="mtd-cat-dot" style={{background:MTD_CLR[x.i % MTD_CLR.length]}}/>
                            <span className="mtd-cat-nm">{x.c}</span>
                            <span className="mtd-cat-v"><b style={{color:x.t ? ct : 'var(--t1)'}}>{x.a ? x.a.toLocaleString('en-IN') : '0'}</b>{x.t ? <small>/{x.t.toLocaleString('en-IN')}</small> : null}</span>
                            <div className="mtd-cat-bar"><div style={{width:(x.t ? Math.min(cp, 100) : 100) + '%', background:ct, opacity:x.t ? 1 : .3}}/></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {mtdRowsAll.length === 0 && <div className="mtd-none" style={{padding:24,textAlign:'center'}}>No salesman data yet for {month}.</div>}
    </div>
  );

  // Embedded: month picker + the summary table, nothing else.
  if (onlyMtd) {
    return (
      <div className="card mtd-wrap fade">
        <div className="mtd-head">
          <span className="sec-ico" style={{'--tone':'var(--grn)'}}><BarChart3 size={15}/></span>
          <div className="mtd-title"><b>{tr('MTD Sales Summary')}</b><small>target vs achieved, salesman by salesman</small></div>
          <span style={{flex:1}}/>
          <div className="seg">
            <button className={'seg-b'+(mtdView==='summary'?' on':'')} style={{'--tone':'var(--acc)'}} onClick={()=>setMtdView('summary')}>Summary</button>
            {isAdmin && <button className={'seg-b'+(mtdView==='table'?' on':'')} style={{'--tone':'var(--acc)'}} onClick={()=>setMtdView('table')}>Edit targets</button>}
          </div>
          <select value={month} onChange={e=>setMonth(e.target.value)} className="inp mtd-month">
            {months.length === 0 && <option value="">(no data yet)</option>}
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="btn" onClick={load} disabled={loading} style={{padding:'6px 9px'}} title="Reload">
            <RefreshCw size={13} className={loading?'spin':''}/>
          </button>
        </div>
        {mtdStrip}
        {mtdView === 'table' && isAdmin ? mtdCard : mtdTable}
      </div>
    );
  }

  return (
    <div className="fade" style={{display:'grid',gap:14}}>

      {/* ── Header bar ─────────────────────────────────────────── */}
      <PageHead icon={BarChart3} tone="var(--acc)" eyebrow={null} title="Category-wise Sales" sub="Overall · Dealer-wise · Salesman-wise" right={<>
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
            onSetExcluded={setExcluded}
            label="Categories"
          />
        )}
        {isAdmin && month && byCat.grandTotal > 0 && (
          <button
            className="btn"
            onClick={handleDeleteMonth}
            title={`Delete all category sales for ${month} from DB`}
            style={{
              color:'var(--red)',
              border:'1px solid color-mix(in srgb, var(--red) 40%, transparent)',
              background:'color-mix(in srgb, var(--red) 8%, transparent)',
              display:'inline-flex', alignItems:'center', gap:5,
            }}>
            <Trash2 size={12}/> Delete {month}
          </button>
        )}
      </>}/>

      {/* ── Total Sale KPI bar ─────────────────────────────────── */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10}}>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'0.1em'}}>
            Grand Total — {month||'—'} {excluded.size>0 && <span style={{color:'var(--yel)'}}>(excl. {excluded.size})</span>}
          </div>
          <div style={{fontSize:26,fontWeight:800,marginTop:4,color:'var(--grn)'}}>{fmt(filteredGrandTotal)}</div>
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
          <div style={{fontSize:26,fontWeight:800,marginTop:4}}>{filteredSalesmanRows.filter(r=>r.total>0).length}</div>
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
                  <div key={g.category} className="att-card" style={{'--tone':'var(--grn)',padding:'14px 16px 14px 18px',cursor:'default'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <div style={{fontSize:13,fontWeight:700,flex:1,color:'var(--t1)'}}>{g.category}</div>
                      <div style={{fontSize:20,fontWeight:850,color:'var(--grn)',letterSpacing:'-.02em'}}>{fmt(g.total)}</div>
                    </div>
                    <div className="att-bar" style={{height:6,marginBottom:8}}>
                      <div style={{width:`${pct.toFixed(1)}%`,background:'linear-gradient(90deg,var(--acc),var(--grn))'}}/>
                    </div>
                    <div style={{fontSize:11,color:'var(--t3)',marginBottom:6}}>
                      {pct.toFixed(1)}% of total
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {g.subs.sort((a,b)=>b.qty-a.qty).map(s => (
                        <span key={s.subCategory} style={{
                          fontSize:11,padding:'2px 9px',borderRadius:20,
                          background:'var(--bg2)',border:'1px solid var(--b1)',color:'var(--t2)',
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
                  <th style={{textAlign:'right',background:'color-mix(in srgb, var(--grn) 8%, transparent)'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredDealerRows.map(r => {
                  const clickable = !!onOpenDealer && dealerIdByName.has(String(r.dealer).toLowerCase().trim());
                  return (
                  <tr key={r.dealer} onClick={()=>clickable && openDealerByName(r.dealer)}
                      style={clickable ? { cursor:'pointer' } : undefined}
                      title={clickable ? 'Click to see this dealer\'s full category breakdown' : ''}>
                    <td style={{position:'sticky',left:0,background:'var(--bg2)',fontWeight:600,maxWidth:260}}>
                      <div style={{display:'flex',alignItems:'center',gap:9,minWidth:0}}>
                        {ini(r.dealer)}
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:700,color:clickable?'var(--acc)':'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.dealer}</div>
                          {dealerPlaceByName.get(String(r.dealer).toLowerCase().trim()) && <div style={{fontSize:10.5,color:'var(--t3)',fontWeight:500}}>{dealerPlaceByName.get(String(r.dealer).toLowerCase().trim())}</div>}
                        </div>
                      </div>
                    </td>
                    {categories.map(c => {
                      const v = Object.values(r.byCategory?.[c]||{}).reduce((s,v)=>s+v,0);
                      return <td key={c} style={{textAlign:'right',color:v?'var(--t2)':'var(--t3)'}}>{v? fmt(v) : '—'}</td>;
                    })}
                    <td style={{textAlign:'right',fontWeight:700,color:'var(--grn)'}}>{fmt(r.total)}</td>
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
                    <td style={{textAlign:'right',fontWeight:800,background:'color-mix(in srgb, var(--grn) 12%, transparent)',color:'var(--grn)'}}>
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
                  <th style={{textAlign:'right',background:'color-mix(in srgb, var(--grn) 8%, transparent)'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalesmanRows.map(r => (
                  <tr key={r.salesman}>
                    <td style={{position:'sticky',left:0,background:'var(--bg2)',fontWeight:600}}>
                      <div style={{display:'flex',alignItems:'center',gap:9,minWidth:0}}>
                        {ini(r._displayName)}
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:700,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r._displayName}</div>
                          <div style={{fontSize:10.5,color:'var(--t3)',fontWeight:500}}>{Object.keys(r.byCategory||{}).length} categories</div>
                        </div>
                      </div>
                    </td>
                    {categories.map(c => {
                      const v = Object.values(r.byCategory?.[c]||{}).reduce((s,v)=>s+v,0);
                      return <td key={c} style={{textAlign:'right',color:v?'var(--t2)':'var(--t3)'}}>{v? fmt(v) : '—'}</td>;
                    })}
                    <td style={{textAlign:'right',fontWeight:700,color:'var(--grn)'}}>{fmt(r.total)}</td>
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
                    <td style={{textAlign:'right',fontWeight:800,background:'color-mix(in srgb, var(--grn) 12%, transparent)',color:'var(--grn)'}}>
                      {fmt(filteredSalesmanRows.reduce((s,r)=>s+r.total,0))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {mtdCard}
        </>
      )}
    </div>
  );
};

export default SalesByCategory;
