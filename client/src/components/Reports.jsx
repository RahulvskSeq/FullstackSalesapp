// Reports hub — admin / superadmin only.
// Every report builds its CSV client-side from data the app already has,
// so no new server endpoint is needed. Each download is a single click.

import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet, Download, Calendar, Users, TrendingUp, Activity,
  ClipboardList, UserCheck, Plane, AlertTriangle, Camera,
} from 'lucide-react';
import { api } from '../api';
import { notify } from './Toast';
import { monthTarget, pct, spct } from '../utils';

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

  const downloadOutstanding = () => {
    const headers = ['Dealer','Salesman','Total Outstanding','Latest Month','Latest Amount'];
    const monthCols = Object.keys(outstandingData?.[0]?.monthlyOutstanding || {});
    monthCols.forEach(m => headers.push(m + ' Outstanding'));
    const rows = (outstandingData || []).map(d => {
      const sm = d.matchedSalesman?.name || '';
      const row = [d.name, sm, d.latestOutstanding || 0, d.latestMonth || '', d.latestOutstanding || 0];
      monthCols.forEach(m => row.push(d.monthlyOutstanding?.[m] || 0));
      return row;
    });
    exportCSV('Outstanding_' + new Date().toISOString().slice(0,10) + '.csv', headers, rows);
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
      <ReportCard title="Outstanding (Current Snapshot)"
        sub={(outstandingData?.length || 0) + ' parties · all months stored'}
        icon={AlertTriangle} color="#f87171"
        onClick={downloadOutstanding}/>

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
