// Reports hub — admin / superadmin only.
// Every report builds its CSV client-side from data the app already has,
// so no new server endpoint is needed. Each download is a single click.

import React, { useMemo, useState, useEffect } from 'react';
import {
  FileSpreadsheet, Download, Calendar, Users, TrendingUp, Activity,
  ClipboardList, UserCheck, Plane, AlertTriangle, Camera, Layers,
  ChevronRight, ChevronDown,
} from 'lucide-react';
import { api } from '../api';
import { notify } from './Toast';
import { monthTarget, pct, spct } from '../utils';

// "Jun-26" → "2026-06"
const _moMonths = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
function moToYM(lbl) {
  if (!lbl) return '';
  const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(String(lbl).trim());
  if (!m) return '';
  const mi = _moMonths.indexOf(m[1].slice(0,3).toLowerCase());
  if (mi < 0) return '';
  let y = +m[2]; if (y < 100) y += 2000;
  return `${y}-${String(mi+1).padStart(2,'0')}`;
}

// CSV helper shared with the CRM exporter.
function exportCSV(filename, headers, rows){
  if(!rows || rows.length === 0){ notify.info('Nothing to export'); return; }
  const esc = v => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  };
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
  a.download = filename;
  a.click();
  notify.success('Exported ' + rows.length + ' rows');
}

const fmtTime = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '';

export default function Reports({ dealers, users, currentUser, monthConfig, outstandingData }){
  const MO = monthConfig?.MO || [];
  const isStaff = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Month range pickers (defaults: current month → current month, i.e. one month)
  const currentIdx = monthConfig?.currentIdx ?? Math.max(0, MO.length - 1);
  const [fromIdx, setFromIdx] = useState(currentIdx);
  const [toIdx,   setToIdx]   = useState(currentIdx);
  // Date range pickers for CRM reports
  const today = new Date().toISOString().slice(0,10);
  const startOfMonth = today.slice(0,8) + '01';
  const [fromDate, setFromDate] = useState(startOfMonth);
  const [toDate,   setToDate]   = useState(today);

  const fromI = Math.min(fromIdx, toIdx);
  const toI   = Math.max(fromIdx, toIdx);
  const rangeMonths = MO.slice(fromI, toI + 1);
  const rangeLabel  = rangeMonths.length === 1 ? rangeMonths[0] : (MO[fromI] + ' to ' + MO[toI]);

  if(!isStaff){
    return (
      <div className="fade" style={{padding:24, textAlign:'center', color:'var(--t2)'}}>
        <AlertTriangle size={28} style={{margin:'0 auto 8px', color:'var(--t3)'}}/>
        <div style={{fontSize:14}}>Reports are admin-only.</div>
      </div>
    );
  }

  // ── Build the various reports ────────────────────────────────────────
  const downloadDealerPerformance = () => {
    const headers = ['Salesman','Dealer','City','State','Zone','Status','Category'];
    rangeMonths.forEach(m => { headers.push(m + ' Target', m + ' Achieved', m + ' %'); });
    headers.push('Total Target', 'Total Achieved', 'Total %');
    const rows = dealers.map(d => {
      const sm = users[d.salesman]?.name || d.salesman || '';
      const row = [sm, d.name, d.city||'', d.state||'', d.zone||'', d.status||'', d.category||''];
      let totT = 0, totA = 0;
      rangeMonths.forEach((m, i) => {
        const monthIdx = fromI + i;
        const t = monthTarget(d, monthIdx) || 0;
        const a = Number(d.months?.[monthIdx]) || 0;
        row.push(t, a, t > 0 ? Math.round((a/t)*100) + '%' : '');
        totT += t; totA += a;
      });
      row.push(totT, totA, totT > 0 ? Math.round((totA/totT)*100) + '%' : '');
      return row;
    });
    exportCSV('DealerPerformance_' + rangeLabel.replace(/\s+/g,'_') + '.csv', headers, rows);
  };

  const downloadSalesmanSummary = () => {
    const headers = ['Salesman','Dealers'];
    rangeMonths.forEach(m => { headers.push(m + ' Target', m + ' Achieved', m + ' %'); });
    headers.push('Total Target', 'Total Achieved', 'Total %');
    const bySalesman = {};
    dealers.forEach(d => {
      const id = d.salesman || '_unassigned';
      if(!bySalesman[id]) bySalesman[id] = { dealers:[], name: users[id]?.name || id };
      bySalesman[id].dealers.push(d);
    });
    const rows = Object.values(bySalesman).map(g => {
      const row = [g.name, g.dealers.length];
      let totT = 0, totA = 0;
      rangeMonths.forEach((m, i) => {
        const monthIdx = fromI + i;
        const t = g.dealers.reduce((s,d)=> s + (monthTarget(d, monthIdx)||0), 0);
        const a = g.dealers.reduce((s,d)=> s + (Number(d.months?.[monthIdx])||0), 0);
        row.push(t, a, t > 0 ? Math.round((a/t)*100) + '%' : '');
        totT += t; totA += a;
      });
      row.push(totT, totA, totT > 0 ? Math.round((totA/totT)*100) + '%' : '');
      return row;
    });
    exportCSV('SalesmanSummary_' + rangeLabel.replace(/\s+/g,'_') + '.csv', headers, rows);
  };

  // Detailed Outstanding export — every party's monthly outstanding PLUS one
  // row per follow-up remark/entry with all its details (reason, remark,
  // amount, tagged months, status, collected amount/date, who logged it &
  // when). Parties with no remarks still get one row so nothing is dropped.
  const downloadOutstanding = async () => {
    // Pull all follow-up entries (remarks) the user is allowed to see.
    let followups = [];
    try { followups = await api.getFollowups(); }
    catch (e) { notify.info('Could not load remarks (' + e.message + ') — exporting amounts only'); }

    // Group remarks by normalized dealer name, oldest → newest.
    const norm = (s) => String(s || '').trim().toLowerCase();
    const byDealer = {};
    (followups || []).forEach(f => { (byDealer[norm(f.dealerName)] = byDealer[norm(f.dealerName)] || []).push(f); });
    Object.values(byDealer).forEach(arr =>
      arr.sort((a, b) => String(a.followupDate || a.createdAt || '').localeCompare(String(b.followupDate || b.createdAt || ''))));

    // Map dealer name → salesman display name (records don't carry it).
    const dealerSm = {};
    (dealers || []).forEach(dl => { dealerSm[norm(dl.name)] = dl.salesman; });
    const nameOf = (id) => (id && users?.[id]?.name) || id || '';
    const smOf   = (d)  => nameOf(dealerSm[norm(d.name)]);
    const fmtDT  = (v)  => v ? new Date(v).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';

    const monthCols = Object.keys(outstandingData?.[0]?.monthlyOutstanding || {});
    const headers = ['Dealer', 'Salesman', 'Latest Outstanding', 'Latest Month'];
    monthCols.forEach(m => headers.push(m + ' Outstanding'));
    headers.push('Entry Date', 'Entry Amount', 'Reason', 'Remark / Comment', 'Applies To Month(s)',
      'Status', 'Type', 'Collected Amount', 'Collected On', 'Payment Proof', 'Logged By', 'Logged On');

    const BLANK_ENTRY = ['', '', '', '', '', '', '', '', '', '', '', ''];
    const entryCells = (f) => ([
      f.followupDate || (f.createdAt || '').slice(0, 10),
      f.amount || 0,
      f.reason || '',
      f.comment || '',
      Array.isArray(f.months) ? f.months.join(' | ') : '',
      f.status || '',
      f.type || 'followup',
      f.collectedAmount || 0,
      fmtDT(f.collectedAt),
      f.paymentProof ? 'Yes' : 'No',
      nameOf(f.createdBy),
      fmtDT(f.createdAt),
    ]);

    const rows = [];
    const seen = new Set();
    (outstandingData || []).forEach(d => {
      const latestMonth = monthCols.length ? monthCols[monthCols.length - 1] : '';
      const base = [d.name, smOf(d), d.latestOutstanding || 0, latestMonth];
      monthCols.forEach(m => base.push(d.monthlyOutstanding?.[m] || 0));
      const entries = byDealer[norm(d.name)] || [];
      seen.add(norm(d.name));
      if (entries.length === 0) rows.push([...base, ...BLANK_ENTRY]);
      else entries.forEach(f => rows.push([...base, ...entryCells(f)]));
    });

    // Remarks for parties not present in the outstanding snapshot — keep them
    // so no remark is ever lost.
    Object.keys(byDealer).forEach(key => {
      if (seen.has(key)) return;
      const base = [byDealer[key][0].dealerName, nameOf(byDealer[key][0].salesman) || byDealer[key][0].salesman || '', '', ''];
      monthCols.forEach(() => base.push(''));
      byDealer[key].forEach(f => rows.push([...base, ...entryCells(f)]));
    });

    exportCSV('Outstanding_Detailed_' + new Date().toISOString().slice(0, 10) + '.csv', headers, rows);
  };

  // ── User Master — export the full user list + their access settings ──────
  const downloadUserMaster = () => {
    const headers = ['User ID','Name','Role','Active','Approver',
      'Perm States','Perm Cities','Perm Zones','Perm Salesmen','Pages','Features','Sheet URL'];
    const list = Object.values(users || {})
      .sort((a,b)=>{ const o={superadmin:0,admin:1,employee:2,salesman:3}; return (o[a.role]??4)-(o[b.role]??4) || (a.name||'').localeCompare(b.name||''); });
    const rows = list.map(u => {
      const p = u.permissions || {};
      return [
        u.id, u.name, u.role, u.active===false ? 'No' : 'Yes',
        u.approver ? (users[u.approver]?.name || u.approver) : '',
        (p.states||[]).join('; '),
        (p.cities||[]).join('; '),
        (p.zones||[]).join('; '),
        (p.salesmen||[]).map(s=>users[s]?.name||s).join('; '),
        (p.pages||[]).join('; '),
        (p.features||[]).join('; '),
        u.url || '',
      ];
    });
    exportCSV('UserMaster_' + new Date().toISOString().slice(0,10) + '.csv', headers, rows);
  };

  // ── Live CRM reports (fetch from API at click time, no caching needed) ─
  const downloadAttendance = async () => {
    try {
      const items = await api.attListAttendance({ from: fromDate, to: toDate });
      exportCSV(
        'Attendance_' + fromDate + '_to_' + toDate + '.csv',
        ['User','Type','Date','Time','Address','City','State','Latitude','Longitude','Note'],
        (items || []).map(x => [
          x.userName || x.userId,
          x.type === 'in' ? 'IN' : 'OUT',
          x.dateStr || (x.createdAt||'').slice(0,10),
          x.createdAt ? new Date(x.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '',
          x.address||'', x.city||'', x.state||'',
          x.lat ?? '', x.lng ?? '',
          x.note||'',
        ])
      );
    } catch(e){ notify.error('Attendance: ' + e.message); }
  };

  const downloadVisits = async () => {
    try {
      const items = await api.visitsList({ from: fromDate, to: toDate });
      exportCSV(
        'Visits_' + fromDate + '_to_' + toDate + '.csv',
        ['User','Party','Status','Date','CheckIn','CheckOut','DurationMin','CheckInAddress','CheckOutAddress','CheckInNote','DiscussionNotes'],
        (items || []).map(v => [
          v.userName || v.userId,
          v.dealerName,
          v.status === 'completed' ? 'COMPLETED' : 'IN-PROGRESS',
          v.dateStr || (v.createdAt||'').slice(0,10),
          v.checkInTime  ? new Date(v.checkInTime ).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '',
          v.checkOutTime ? new Date(v.checkOutTime).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '',
          v.durationMinutes ?? '',
          v.checkInAddress  || v.address || '',
          v.checkOutAddress || '',
          v.checkInNote || '',
          v.checkOutNote || v.comment || '',
        ])
      );
    } catch(e){ notify.error('Visits: ' + e.message); }
  };

  const downloadLeads = async () => {
    try {
      const items = await api.leadsList({});
      exportCSV(
        'Leads_' + new Date().toISOString().slice(0,10) + '.csv',
        ['Name','Company','Phone','Email','City','State','Source','Status','AssignedTo','Value','Notes','UpdatesCount','LastUpdate','CreatedAt'],
        (items || []).map(L => [
          L.name, L.company||'', L.phone||'', L.email||'', L.city||'', L.state||'',
          L.source||'', L.status||'NEW',
          L.assignedName||L.assignedTo||'',
          L.value||0,
          L.notes||'',
          L.updates?.length || 0,
          L.updates?.length ? (L.updates[L.updates.length-1].byName + ': ' + (L.updates[L.updates.length-1].comment || L.updates[L.updates.length-1].status || '')) : '',
          L.createdAt || '',
        ])
      );
    } catch(e){ notify.error('Leads: ' + e.message); }
  };

  const downloadLeaves = async () => {
    try {
      const items = await api.leavesList({});
      exportCSV(
        'Leaves_' + new Date().toISOString().slice(0,10) + '.csv',
        ['User','Type','From','To','DaysApplied','Status','Reason','ReviewedBy','ReviewComment','AppliedOn'],
        (items || []).map(l => {
          const days = Math.max(1, Math.round((new Date(l.toDate) - new Date(l.fromDate)) / (1000*60*60*24)) + 1);
          return [
            l.userName || l.userId,
            l.leaveType || '',
            l.fromDate || '', l.toDate || '',
            days,
            l.status || '',
            l.reason || '',
            l.reviewedByName || '',
            l.reviewComment || '',
            l.createdAt || '',
          ];
        })
      );
    } catch(e){ notify.error('Leaves: ' + e.message); }
  };

  // ── UI helpers ───────────────────────────────────────────────────────
  const ReportCard = ({ title, sub, icon:Icon, color, onClick }) => (
    <div className="card" style={{
      display:'flex', flexDirection:'column', gap:8,
      cursor:'pointer', transition:'transform .15s',
      borderLeft: '3px solid ' + (color || 'var(--acc)'),
    }}
      onClick={onClick}
      onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
      onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <div style={{
          width:36, height:36, borderRadius:8,
          background:(color||'var(--acc)') + '22',
          color: color || 'var(--acc)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon size={18}/>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:13, fontWeight:700}}>{title}</div>
          <div style={{fontSize:11, color:'var(--t3)'}}>{sub}</div>
        </div>
        <button className="btnp" style={{
          display:'inline-flex', alignItems:'center', gap:6, fontSize:11,
          padding:'6px 10px',
        }}>
          <Download size={12}/> Download
        </button>
      </div>
    </div>
  );

  return (
    <div className="fade" style={{display:'flex', flexDirection:'column', gap:14}}>
      <div>
        <div style={{fontSize:11, color:'var(--acc)', textTransform:'uppercase', letterSpacing:'.15em', marginBottom:4}}>Admin</div>
        <div className="crm-page-title" style={{fontSize:22, fontWeight:700}}>Reports</div>
        <div className="crm-page-sub" style={{fontSize:13, color:'var(--t3)', marginTop:4}}>
          Download any report as CSV / Excel. Filter by month range for sales reports and date range for CRM reports.
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{display:'flex', flexWrap:'wrap', gap:14, alignItems:'flex-end'}}>
        <div>
          <label style={{fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:4}}>From month</label>
          <select className="inp" value={fromIdx} onChange={e=>setFromIdx(Number(e.target.value))} style={{padding:'6px 10px', fontSize:12}}>
            {MO.map((m,i) => <option key={m+i} value={i}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={{fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:4}}>To month</label>
          <select className="inp" value={toIdx} onChange={e=>setToIdx(Number(e.target.value))} style={{padding:'6px 10px', fontSize:12}}>
            {MO.map((m,i) => <option key={m+i} value={i}>{m}</option>)}
          </select>
        </div>
        <div style={{fontSize:12, color:'var(--t3)', padding:'8px 0'}}>
          Sales reports → <b style={{color:'var(--acc)'}}>{rangeLabel}</b>
        </div>
        <div style={{width:1, height:34, background:'var(--b1)'}}/>
        <div>
          <label style={{fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:4}}>CRM from date</label>
          <input type="date" className="inp" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{padding:'6px 10px', fontSize:12}}/>
        </div>
        <div>
          <label style={{fontSize:10, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.07em', display:'block', marginBottom:4}}>CRM to date</label>
          <input type="date" className="inp" value={toDate} onChange={e=>setToDate(e.target.value)} style={{padding:'6px 10px', fontSize:12}}/>
        </div>
      </div>

      {/* Sales reports */}
      <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.12em', marginTop:4}}>Sales</div>
      <ReportCard title="Dealer Performance"
        sub={'Per-dealer Target/Achieved/% for each month in ' + rangeLabel}
        icon={TrendingUp} color="#6366f1"
        onClick={downloadDealerPerformance}/>
      <ReportCard title="Salesman Summary"
        sub={'Per-salesman totals for each month in ' + rangeLabel}
        icon={Users} color="#34d399"
        onClick={downloadSalesmanSummary}/>
      <ReportCard title="Outstanding (Detailed + Remarks)"
        sub={(outstandingData?.length || 0) + ' parties · all months + every follow-up remark & entry with full details'}
        icon={AlertTriangle} color="#f87171"
        onClick={downloadOutstanding}/>

      {/* ── User master ──────────────────────────────────────────────── */}
      <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.12em', marginTop:4}}>Administration</div>
      <ReportCard title="User Master"
        sub={(Object.keys(users || {}).length) + ' users · roles, access permissions & pages'}
        icon={Users} color="#a5b4fc"
        onClick={downloadUserMaster}/>

      {/* ── Category → Dealer drill-down ─────────────────────────────── */}
      <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.12em', marginTop:4}}>Category Drill-Down</div>
      <CategoryDealerDrill rangeMonths={rangeMonths} users={users}/>

      {/* CRM reports */}
      <div style={{fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.12em', marginTop:4}}>CRM</div>
      <ReportCard title="Attendance Report"
        sub={'Check-in / check-out punches with photos + GPS — ' + fromDate + ' to ' + toDate}
        icon={Camera} color="#fbbf24"
        onClick={downloadAttendance}/>
      <ReportCard title="Visits Report"
        sub={'Field visits with discussion notes + duration — ' + fromDate + ' to ' + toDate}
        icon={ClipboardList} color="#a78bfa"
        onClick={downloadVisits}/>
      <ReportCard title="Leads Report"
        sub="All leads with status, assignee, value, last update"
        icon={UserCheck} color="#22d3ee"
        onClick={downloadLeads}/>
      <ReportCard title="Leaves Report"
        sub="All leave applications with approver and status"
        icon={Plane} color="#fb923c"
        onClick={downloadLeaves}/>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── *
 *  CategoryDealerDrill                                                    *
 *                                                                         *
 *  Lists every Category Type for the selected month range. Click one →    *
 *  expands to show its sub-categories. Click a sub-category → shows the   *
 *  exact dealers who gave sale in that sub-category, with quantity and    *
 *  salesman, sorted by qty descending. Each level has a CSV export.       *
 * ─────────────────────────────────────────────────────────────────────── */
function CategoryDealerDrill({ rangeMonths, users }) {
  const [loading, setLoading]   = useState(false);
  const [rows, setRows]         = useState([]);        // raw Sale rows across months
  const [openCat, setOpenCat]   = useState(null);
  const [openSub, setOpenSub]   = useState(null);

  // Fetch raw sale rows for the picked month range, once
  useEffect(() => {
    if (!rangeMonths || rangeMonths.length === 0) { setRows([]); return; }
    const yms = rangeMonths.map(moToYM).filter(Boolean);
    if (!yms.length) { setRows([]); return; }
    const from = yms.slice().sort()[0];
    const to   = yms.slice().sort().slice(-1)[0];
    let cancelled = false;
    setLoading(true);
    api.salesRaw({ from, to, limit: 50000 })
      .then(r => { if (!cancelled) setRows(r.rows || []); })
      .catch(() => { if (!cancelled) setRows([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [rangeMonths.join('|')]);

  // Roll up to category → { total, subs: { sub: { total, dealers: { name: { qty, sm } } } } }
  const tree = useMemo(() => {
    const out = new Map();
    for (const r of rows) {
      const cat = (r.category || '(No Category)').trim();
      const sub = (r.subCategory || '(No Sub)').trim();
      const dealer = (r.dealerName || '(Unknown)').trim();
      const sm = (r.salesman || '').trim();
      const qty = Number(r.qty) || 0;
      if (!out.has(cat)) out.set(cat, { total: 0, subs: new Map() });
      const C = out.get(cat);
      C.total += qty;
      if (!C.subs.has(sub)) C.subs.set(sub, { total: 0, dealers: new Map() });
      const S = C.subs.get(sub);
      S.total += qty;
      const D = S.dealers.get(dealer) || { name: dealer, qty: 0, sm };
      D.qty += qty;
      if (!D.sm && sm) D.sm = sm;
      S.dealers.set(dealer, D);
    }
    return out;
  }, [rows]);

  const totalSales = useMemo(() => {
    let s = 0;
    for (const v of tree.values()) s += v.total;
    return s;
  }, [tree]);

  // Sorted category list, biggest first
  const catList = useMemo(() => {
    return [...tree.entries()]
      .map(([name, v]) => ({ name, total: v.total, subs: v.subs }))
      .sort((a, b) => b.total - a.total);
  }, [tree]);

  // CSV export of the entire flattened drill-down (cat × sub × dealer × qty)
  const exportFlat = () => {
    const out = [];
    for (const [cat, C] of tree.entries()) {
      for (const [sub, S] of C.subs.entries()) {
        for (const D of S.dealers.values()) {
          out.push([cat, sub, D.name, users[D.sm]?.name || D.sm || '', D.qty]);
        }
      }
    }
    if (!out.length) { notify.info('Nothing to export'); return; }
    exportCSV(
      'CategoryDealerDrill_' + new Date().toISOString().slice(0,10) + '.csv',
      ['Category', 'Sub-Category', 'Dealer', 'Salesman', 'Qty'],
      out,
    );
  };

  return (
    <div className="card" style={{display:'flex', flexDirection:'column', gap:8, borderLeft:'3px solid #f472b6'}}>
      <div style={{display:'flex', alignItems:'center', gap:10, padding:'4px 0 8px'}}>
        <div style={{
          width:36, height:36, borderRadius:8,
          background:'rgba(244,114,182,0.15)', color:'#f472b6',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Layers size={18}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:13, fontWeight:700}}>Category → Sub-Category → Dealers</div>
          <div style={{fontSize:11, color:'var(--t3)'}}>
            Click a category to expand. Click a sub-category to see the exact dealers who gave sale in it.
            {totalSales > 0 && <> · Total in range: <b style={{color:'#34d399'}}>{Number(totalSales).toLocaleString('en-IN')}</b></>}
          </div>
        </div>
        <button className="btn" onClick={exportFlat} disabled={!rows.length}
          style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:11}}>
          <Download size={12}/> Export CSV
        </button>
      </div>

      {loading && <div style={{fontSize:12, color:'var(--t3)', padding:14, textAlign:'center'}}>Loading category sales…</div>}
      {!loading && catList.length === 0 && (
        <div style={{fontSize:12, color:'var(--t3)', padding:14, textAlign:'center', background:'var(--bg1)', borderRadius:8}}>
          No category-wise sales found for this month range. Upload from Monthly Entry → Bulk Excel.
        </div>
      )}

      {/* Category rows */}
      <div style={{display:'flex', flexDirection:'column', gap:4}}>
        {catList.map(C => {
          const isOpen = openCat === C.name;
          const pct = totalSales ? (C.total / totalSales * 100) : 0;
          return (
            <div key={C.name} style={{border:'1px solid var(--b1)', borderRadius:8, overflow:'hidden'}}>
              <div
                onClick={() => { setOpenCat(isOpen ? null : C.name); setOpenSub(null); }}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 12px', cursor:'pointer',
                  background: isOpen ? 'rgba(99,102,241,.08)' : 'transparent',
                }}>
                {isOpen ? <ChevronDown size={14} color="var(--acc)"/> : <ChevronRight size={14} color="var(--t3)"/>}
                <div style={{flex:1, fontSize:13, fontWeight:600}}>{C.name}</div>
                <div style={{fontSize:11, color:'var(--t3)'}}>{[...C.subs.keys()].length} sub-cats</div>
                <div style={{fontSize:11, color:'var(--t3)', width:60, textAlign:'right'}}>{pct.toFixed(1)}%</div>
                <div style={{fontSize:14, fontWeight:700, color:'#34d399', minWidth:70, textAlign:'right'}}>
                  {Number(C.total).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Sub-categories */}
              {isOpen && (
                <div style={{padding:'2px 12px 10px 28px', background:'var(--bg1)'}}>
                  {[...C.subs.entries()].sort((a,b) => b[1].total - a[1].total).map(([subName, S]) => {
                    const isSubOpen = openSub === C.name + '|' + subName;
                    return (
                      <div key={subName} style={{borderTop:'1px solid var(--b1)'}}>
                        <div
                          onClick={() => setOpenSub(isSubOpen ? null : C.name + '|' + subName)}
                          style={{
                            display:'flex', alignItems:'center', gap:10,
                            padding:'8px 10px', cursor:'pointer',
                            background: isSubOpen ? 'rgba(244,114,182,.06)' : 'transparent',
                          }}>
                          {isSubOpen ? <ChevronDown size={12} color="#f472b6"/> : <ChevronRight size={12} color="var(--t3)"/>}
                          <div style={{flex:1, fontSize:12, fontWeight:500, color:'var(--t2)'}}>{subName}</div>
                          <div style={{fontSize:11, color:'var(--t3)'}}>{S.dealers.size} dealers</div>
                          <div style={{fontSize:13, fontWeight:700, color:'#a78bfa', minWidth:60, textAlign:'right'}}>
                            {Number(S.total).toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Dealers list */}
                        {isSubOpen && (
                          <div style={{padding:'4px 8px 10px 24px'}}>
                            <table style={{width:'100%', fontSize:12}}>
                              <thead>
                                <tr style={{color:'var(--t3)', fontSize:10, textTransform:'uppercase', letterSpacing:'.06em'}}>
                                  <th style={{textAlign:'left', padding:'4px 6px'}}>Dealer</th>
                                  <th style={{textAlign:'left', padding:'4px 6px'}}>Salesman</th>
                                  <th style={{textAlign:'right', padding:'4px 6px'}}>Qty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {[...S.dealers.values()].sort((a,b) => b.qty - a.qty).map(D => (
                                  <tr key={D.name} style={{borderTop:'1px solid var(--b1)'}}>
                                    <td style={{padding:'5px 6px', color:'var(--t1)', fontWeight:500}}>{D.name}</td>
                                    <td style={{padding:'5px 6px', color:'var(--t3)'}}>{users[D.sm]?.name || D.sm || '—'}</td>
                                    <td style={{padding:'5px 6px', textAlign:'right', color:'#34d399', fontWeight:600}}>
                                      {Number(D.qty).toLocaleString('en-IN')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div style={{display:'flex', justifyContent:'flex-end', marginTop:6}}>
                              <button className="btn" style={{fontSize:10, padding:'3px 8px'}}
                                onClick={() => {
                                  exportCSV(
                                    'Dealers_' + C.name + '_' + subName + '.csv',
                                    ['Dealer','Salesman','Qty'],
                                    [...S.dealers.values()].sort((a,b)=>b.qty-a.qty).map(D=>[D.name, users[D.sm]?.name || D.sm || '', D.qty]),
                                  );
                                }}>
                                <Download size={10}/> Download this slice
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
