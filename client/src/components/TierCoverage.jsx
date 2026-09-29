import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Download, AlertTriangle, CalendarClock, CheckCircle2, ChevronDown, Crown, MapPin, UserX } from 'lucide-react';
import { api } from '../api';
import { useT } from '../i18n';
import { PageHead } from '../collections/ui';
import DealerVisitModal from './DealerVisitModal';

// The month's top dealers — STAR, KEY ACCOUNT, ACHIEVER — split by whether anyone met them:
// not met at all, planned on the calendar but never visited, and met.
const TIERS = ['STAR', 'KEY ACCOUNT', 'ACHIEVER'];
const TIER_TONE = { STAR: '#f59e0b', 'KEY ACCOUNT': '#8b5cf6', ACHIEVER: '#10b981' };
const ymNow = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 7);
const shiftYm = (ym, n) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return d.toISOString().slice(0, 7); };
const ymLabel = ym => new Date(ym + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
const dShort = ymd => ymd ? new Date(ymd + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';
const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

export default function TierCoverage({ users = {}, currentUser }) {
  const { t: tr } = useT();
  const isStaff = ['admin', 'superadmin', 'employee'].includes(currentUser?.role);
  const [month, setMonth] = useState(ymNow());
  const [sm, setSm] = useState('');
  const [tier, setTier] = useState('');
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [showMet, setShowMet] = useState(false);
  const [open, setOpen] = useState(null);

  const load = () => { setErr(''); setData(null); api.visitCoverage(month, sm).then(setData).catch(e => setErr(e?.message || 'Could not load the report')); };
  useEffect(load, [month, sm]); // eslint-disable-line react-hooks/exhaustive-deps

  const salesmen = useMemo(() => Object.values(users || {}).filter(u => u.role === 'salesman' && u.active !== false).sort((a, b) => (a.name || '').localeCompare(b.name || '')), [users]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.rows || []).filter(r => (!tier || r.tier === tier) && (!s || r.name.toLowerCase().includes(s) || (r.city || '').toLowerCase().includes(s) || (r.salesmanName || '').toLowerCase().includes(s)));
  }, [data, tier, q]);
  const by = st => rows.filter(r => r.status === st);
  const notMet = by('NOT_MET'), plannedOnly = by('PLANNED_ONLY'), met = by('MET');
  const pct = rows.length ? Math.round(met.length / rows.length * 100) : 0;
  const isCurrent = month === ymNow();

  const download = async () => {
    const lines = [['Top dealers — ' + ymLabel(month)], ['Status', 'Dealer', 'Tier', 'Zone', 'City', 'Salesman', 'Planned on', 'Visited on', 'Last visit']];
    for (const [label, list] of [['Not met', notMet], ['Planned only', plannedOnly], ['Met', met]])
      list.forEach(r => lines.push([label, r.name, r.tier, r.zone, r.city, r.salesmanName, r.planned.map(p => p.date).join(' '), r.visits.map(v => v.date).join(' '), r.lastVisit]));
    const csv = '﻿' + lines.map(l => l.map(csvCell).join(',')).join('\r\n');
    const { saveText } = await import('../lib/saveFile');
    await saveText(csv, `top-dealers-not-met_${month}${sm ? '_' + (users?.[sm]?.name || sm).replace(/\s+/g, '-') : ''}.csv`, 'text/csv;charset=utf-8');
  };

  const Row = ({ r }) => (
    <button className={'tc-row ' + r.status.toLowerCase()} onClick={() => setOpen(r)}>
      <span className="tc-tier" style={{ '--tone': TIER_TONE[r.tier] }}>{r.tier === 'KEY ACCOUNT' ? 'KEY' : r.tier}</span>
      <span className="tc-main">
        <b>{r.name}</b>
        <small><MapPin size={10} /> {[r.zone, r.city].filter(Boolean).join(' · ') || 'no zone'}{isStaff && r.salesmanName ? ' · ' + r.salesmanName : ''}</small>
        {r.status === 'PLANNED_ONLY' && <small className="tc-pl">planned {r.planned.map(p => dShort(p.date) + (p.upcoming ? ' (coming)' : '')).join(', ')} · not visited</small>}
        {r.status === 'MET' && <small className="tc-ok">met {r.visits.map(v => dShort(v.date)).join(', ')}{isStaff ? ' · ' + [...new Set(r.visits.map(v => v.by))].join(', ') : ''}</small>}
      </span>
      <span className="tc-last">{r.status === 'MET' ? `${r.visits.length}×` : r.lastVisit ? <>last<br />{dShort(r.lastVisit)}</> : <>never<br />visited</>}</span>
    </button>
  );

  const Section = ({ tone, Icon, title, note, list, empty }) => (
    <div className="card tc-sec" style={{ '--tone': tone }}>
      <div className="tc-sh"><span className="tc-si"><Icon size={16} /></span><div style={{ minWidth: 0, flex: 1 }}><b>{title}</b><small>{note}</small></div><span className="tc-n">{list.length}</span></div>
      {list.length ? <div className="tc-list">{list.map(r => <Row key={r.id} r={r} />)}</div> : <div className="tc-empty">{empty}</div>}
    </div>
  );

  return (
    <div className="fade tc" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PageHead icon={UserX} tone="#ef4444" eyebrow="CRM" title={tr('Top dealers not met')} sub="STAR, KEY ACCOUNT and ACHIEVER dealers nobody met this month — and the ones only planned." />

      <div className="card tc-bar">
        <div className="tc-month">
          <button className="btn" onClick={() => setMonth(m => shiftYm(m, -1))} aria-label="Previous month"><ChevronLeft size={15} /></button>
          <b>{ymLabel(month)}</b>
          <button className="btn" disabled={isCurrent} onClick={() => setMonth(m => shiftYm(m, 1))} aria-label="Next month"><ChevronRight size={15} /></button>
        </div>
        {isStaff && <select className="sel" value={sm} onChange={e => setSm(e.target.value)}><option value="">All salesmen</option>{salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
        <div className="tc-search"><Search size={14} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="dealer, city or salesman…" /></div>
        <div className="tc-chips">{['', ...TIERS].map(t => <button key={t || 'all'} className={tier === t ? 'on' : ''} onClick={() => setTier(t)}>{t || 'All tiers'}</button>)}</div>
        <button className="btn tc-dl" onClick={download} disabled={!rows.length}><Download size={14} /> {tr('Download list')}</button>
      </div>

      {err ? <div className="card tc-empty" style={{ color: 'var(--red)' }}>{err} <button className="btn" onClick={load}>Try again</button></div>
      : !data ? <div className="card tc-empty">Loading…</div>
      : <>
        <div className="tc-kpis">
          <div className="k bad"><b>{notMet.length}</b><span>not met</span></div>
          <div className="k warn"><b>{plannedOnly.length}</b><span>planned only</span></div>
          <div className="k ok"><b>{met.length}</b><span>met · {pct}%</span></div>
        </div>
        {isCurrent && <div className="tc-note"><CalendarClock size={13} /> {ymLabel(month)} is still running — this is the picture so far.</div>}
        <Section tone="#ef4444" Icon={AlertTriangle} title="Not met" note="no visit and not even on the calendar" list={notMet} empty="Every top dealer was met or planned. 👏" />
        <Section tone="#f59e0b" Icon={CalendarClock} title="Planned only" note="on the calendar, but no visit happened" list={plannedOnly} empty="No planned visit was missed." />
        <div className="card tc-sec" style={{ '--tone': '#10b981' }}>
          <button className="tc-sh tc-toggle" onClick={() => setShowMet(v => !v)}>
            <span className="tc-si"><CheckCircle2 size={16} /></span><div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}><b>Met</b><small>visited at least once this month</small></div>
            <span className="tc-n">{met.length}</span><ChevronDown size={16} style={{ transform: showMet ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
          </button>
          {showMet && (met.length ? <div className="tc-list">{met.map(r => <Row key={r.id} r={r} />)}</div> : <div className="tc-empty">No top dealer met yet.</div>)}
        </div>
        <div className="tc-foot"><Crown size={12} /> Tier is the dealer's current status. A visit counts when someone checked in at the dealer that month.</div>
      </>}

      {open && <DealerVisitModal dealerId={open.id} dealerName={open.name} onClose={() => setOpen(null)} />}
    </div>
  );
}
