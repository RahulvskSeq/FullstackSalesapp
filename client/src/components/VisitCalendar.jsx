import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, CheckCircle2, CalendarDays, Repeat, Pencil, Trash2, ArrowRight, AlertTriangle, ListChecks, Sun, MapPin, Wallet, X, Clock, Package } from 'lucide-react';
import { api } from '../api';
import DealerVisitModal from './DealerVisitModal';
import DealerOutstandingModal from './DealerOutstandingModal';
import SamplesCarryModal from './SamplesCarryModal';
import { useT } from '../i18n';
import { PageHead } from '../collections/ui';

/**
 * Visit calendar.
 *
 * The office (anyone with "Plan the visit calendar") picks a day and a
 * salesman and lists the dealers he should visit, with a note for each; it
 * can replace or cancel a dealer later. The salesman opens the same calendar,
 * sees his day, and adds dealers of his own to it. Tapping a dealer opens
 * the visit summary, where he checks in, writes the MOM and checks out — a
 * real check-out ticks the plan as visited.
 */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayYmd = () => ymd(new Date());
const fmtDay = s => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function VisitCalendar({ dealers = [], users = {}, currentUser, onNavigate }) {
  const isStaff = ['admin', 'superadmin', 'employee'].includes(currentUser?.role);
  const salesmen = useMemo(() => Object.entries(users || {}).filter(([, u]) => u?.role === 'salesman' && u?.active !== false).map(([id, u]) => ({ id, name: u.name || id })).sort((a, b) => a.name.localeCompare(b.name)), [users]);
  const [sm, setSm] = useState(isStaff ? '' : currentUser?.id || '');
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [day, setDay] = useState(todayYmd());
  const [carryOpen, setCarryOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const { t: tr } = useT();
  const [unplanned, setUnplanned] = useState([]);   // visits made without a plan
  const [outFor, setOutFor] = useState(null);       // {id,name} — outstanding popup
  const [canPlan, setCanPlan] = useState(false);   // the server's answer: may this user plan for others
  const [maxPerDay, setMaxPerDay] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [collect, setCollect] = useState('');
  const [open, setOpen] = useState(null);           // dealerId for the visit modal
  const [editing, setEditing] = useState({});       // planId → note text being edited
  const [replacing, setReplacing] = useState(null); // plan being swapped for another dealer

  const from = ymd(new Date(month.getFullYear(), month.getMonth(), 1));
  const to = ymd(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  // Each load gets a number; only the newest one may write state, so a slow
  // answer for the previous month/salesman can't overwrite the current one.
  const loadSeq = useRef(0);
  const load = async () => {
    const seq = ++loadSeq.current;
    setBusy(true); setErr('');
    try { const r = await api.visitPlans({ from, to, ...(sm ? { salesmanId: sm } : {}) }); if (seq !== loadSeq.current) return; setPlans(r.items || []); setUnplanned(r.unplanned || []); setCanPlan(!!r.canPlan); setMaxPerDay(r.maxPerDay || 5); }
    catch (e) { if (seq === loadSeq.current) setErr(e?.message || 'Could not load'); }
    finally { if (seq === loadSeq.current) setBusy(false); }
  };
  useEffect(() => { load(); }, [from, to, sm]);

  // month grid
  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7;                        // Monday first
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < lead; i++) out.push(null);
    for (let d = 1; d <= days; d++) out.push(ymd(new Date(month.getFullYear(), month.getMonth(), d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [month]);
  const byDay = useMemo(() => { const m = {}; for (const p of plans) (m[p.date] ||= []).push(p); return m; }, [plans]);
  const dayPlans = (byDay[day] || []).filter(p => !sm || p.salesmanId === sm);
  const byDayU = useMemo(() => { const m = {}; for (const u of unplanned) (m[u.date] ||= []).push(u); return m; }, [unplanned]);
  const dayUnplanned = (byDayU[day] || []).filter(u => !sm || u.salesmanId === sm);
  const daySm = sm || (isStaff ? '' : currentUser?.id);
  const isToday = day === todayYmd(), pastDay = day < todayYmd();
  // who may add to this day: a planner for anyone, a salesman for himself (today or later)
  const full = !!daySm && dayPlans.length >= maxPerDay;
  const mayAdd = (canPlan || (!isStaff && !pastDay)) && !full;
  // the month, by salesman: planned, visited, not visited — the report
  const report = useMemo(() => {
    const m = {};
    for (const p of plans) { const r = (m[p.salesmanId] ||= { salesmanId: p.salesmanId, name: p.salesmanName, planned: 0, visited: 0, missed: 0, upcoming: 0 }); r.planned++; if (p.status === 'DONE') r.visited++; else if (p.missed) r.missed++; else if (p.status === 'PLANNED') r.upcoming++; }
    return Object.values(m).sort((a, b) => b.missed - a.missed || b.planned - a.planned);
  }, [plans]);
  const missedList = useMemo(() => plans.filter(p => p.missed).sort((a, b) => b.date.localeCompare(a.date)), [plans]);

  // dealers to pick from: the salesman's own first, then everyone else's
  const pool = useMemo(() => {
    const s = q.trim().toLowerCase(); if (s.length < 2) return [];
    const on = new Set(dayPlans.map(p => p.dealerId));
    return dealers.filter(d => !on.has(d._id || d.id) && ((d.name || '').toLowerCase().includes(s) || (d.city || '').toLowerCase().includes(s))).sort((a, b) => (a.salesman === daySm ? -1 : 1) - (b.salesman === daySm ? -1 : 1)).slice(0, 10);
  }, [q, dealers, daySm, dayPlans]);

  const act = async (fn) => { setBusy(true); setErr(''); try { await fn(); await load(); } catch (e) { setErr(e?.message || 'Could not do that'); } finally { setBusy(false); } };
  const add = (d) => {
    if (!daySm) { setErr('Pick a salesman first'); return; }
    act(async () => {
      if (replacing) { await api.updateVisitPlan(replacing._id, { dealerId: d._id || d.id }); setReplacing(null); }
      else await api.addVisitPlan({ date: day, salesmanId: daySm, dealerId: d._id || d.id, note, collectTarget: Number(collect) || 0 });
      setQ(''); setNote(''); setCollect('');
    });
  };
  // a party not in the dealer list yet: planned by the name typed; real details come at check-out
  const typed = q.replace(/\s+/g, ' ').trim();
  const exactDealer = typed && dealers.some(d => (d.name || '').replace(/\s+/g, ' ').trim().toLowerCase() === typed.toLowerCase());
  const canNewParty = !replacing && typed.length >= 3 && !exactDealer;
  const addNewParty = () => {
    if (!daySm) { setErr('Pick a salesman first'); return; }
    act(async () => {
      await api.addVisitPlan({ date: day, salesmanId: daySm, newPartyName: typed, note, collectTarget: Number(collect) || 0 });
      setQ(''); setNote(''); setCollect('');
    });
  };
  // Visit on a new party: hand the plan to the check-in screen (name prefilled, correctable there)
  const visitNewParty = (p) => {
    try { localStorage.setItem('stp_plan_checkin', JSON.stringify({ planId: p._id, name: p.dealerName, date: p.date, t: Date.now() })); } catch { /* storage blocked */ }
    if (onNavigate) onNavigate('visits'); else window.location.hash = '#/visits';
  };
  const saveNote = (p) => act(async () => { await api.updateVisitPlan(p._id, { note: editing[p._id] }); setEditing(e => { const n = { ...e }; delete n[p._id]; return n; }); });

  const smName = id => users?.[id]?.name || id;
  const firstName = id => smName(id).split(' ')[0];

  // ── presentation helpers (display only) ──
  const inits = s => (s || '?').replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
  const hue = s => (s || '?').charCodeAt(0) * 37 % 360;
  const toneOf = p => p.status === 'DONE' ? 'var(--grn)' : p.missed ? 'var(--red)' : p.status === 'SKIPPED' ? 'var(--t3)' : p.selfAdded ? '#06b6d4' : 'var(--acc)';
  const labelOf = p => p.status === 'DONE' ? 'Visited' : p.missed ? 'Not visited' : p.status === 'SKIPPED' ? 'Skipped' : p.selfAdded ? 'Self-added' : 'Planned';
  const Badge = ({ tone, children }) => <span className="status-badge" style={{ '--c': tone, '--fg': '#fff', background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone, padding: '2px 9px', fontSize: 10.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', borderRadius: 20 }}><span className="sb-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: tone }} />{children}</span>;

  // the visible month at a glance — counted from the plans already loaded
  const tdy = todayYmd();
  const kpi = useMemo(() => {
    const vis = plans.filter(p => !sm || p.salesmanId === sm);
    const t = vis.filter(p => p.date === tdy);
    return {
      planned: vis.length, done: vis.filter(p => p.status === 'DONE').length, missed: vis.filter(p => p.missed).length,
      upcoming: vis.filter(p => p.status === 'PLANNED' && !p.missed).length,
      today: t.length, todayDone: t.filter(p => p.status === 'DONE').length, todayIn: tdy >= from && tdy <= to,
    };
  }, [plans, sm, tdy, from, to]);
  const closedPct = kpi.done + kpi.missed ? Math.round(kpi.done / (kpi.done + kpi.missed) * 100) : null;
  const goToday = () => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setDay(todayYmd()); };
  const tiles = [
    { k: 'planned', n: kpi.planned, label: 'planned', rule: `${kpi.upcoming} still to go this month`, tone: 'var(--acc)', Icon: CalendarDays },
    { k: 'done', n: kpi.done, label: 'visited', rule: closedPct == null ? 'none closed yet' : `${closedPct}% of closed visits`, tone: 'var(--grn)', Icon: CheckCircle2 },
    { k: 'missed', n: kpi.missed, label: 'not visited', rule: kpi.missed ? 'planned day passed, no check-out' : 'nothing missed', tone: 'var(--red)', Icon: AlertTriangle },
    { k: 'today', n: kpi.todayIn ? kpi.today : '—', label: 'today', rule: kpi.todayIn ? `${kpi.todayDone} of ${kpi.today} visited` : 'tap to jump to today', tone: '#06b6d4', Icon: Sun, onClick: goToday },
  ];
  const dayDate = new Date(day + 'T00:00:00');
  const dayDone = dayPlans.filter(p => p.status === 'DONE').length, dayMissed = dayPlans.filter(p => p.missed).length;
  const capPct = daySm ? Math.min(100, Math.round(dayPlans.length / maxPerDay * 100)) : 0;

  return (
    <div className="fade vc-page" style={{ minWidth: 0, maxWidth: '100%', overflowX: 'hidden' }}>
      <PageHead icon={CalendarDays} tone="var(--acc)" eyebrow={canPlan ? 'Plan the field' : 'My visits'} title={tr('My visit calendar')}
        sub={canPlan ? 'Pick a day and a salesman, add the dealers he should visit. Replace or remove any time.'
          : isStaff ? "Each salesman's plan, as the office set it."
          : 'Tap a dealer, check in, write the MOM, check out. Add your own dealers to any day.'}
        right={<div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
          {isStaff && <select className="sel" value={sm} onChange={e => setSm(e.target.value)} style={{ fontSize: 13, maxWidth: '100%' }}><option value="">All salesmen</option>{salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
          <div className="vc-nav">
            <button className="vc-chev" title="Previous month" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft size={16} /></button>
            <b>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b>
            <button className="vc-chev" title="Next month" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight size={16} /></button>
            <button className="vc-today" onClick={goToday}>Today</button>
          </div>
        </div>} />
      {err && <div className="vc-note" style={{ '--tone': 'var(--red)', marginBottom: 12 }}><AlertTriangle size={14} /> {err}</div>}

      {/* the month at a glance */}
      <div className="vc-kpis">
        {tiles.map(t => (
          <div key={t.k} className="ov-move vc-kpi" onClick={t.onClick} style={{ '--tone': t.tone, cursor: t.onClick ? 'pointer' : 'default' }}>
            <div className="ov-move-ico"><t.Icon size={19} /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                <span className="ov-move-n">{t.n}</span><span className="ov-move-lbl">{t.label}</span>
              </div>
              <span className="ov-move-rule">{t.rule}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="vc-grid">
        {/* month */}
        <div className="card vc-month">
          <div className="vc-month-top">
            <div className="sec-title" style={{ margin: 0 }}>
              <span className="sec-ico" style={{ '--tone': 'var(--acc)' }}><CalendarDays size={15} /></span> {month.toLocaleDateString('en-IN', { month: 'long' })}
              {busy && <span className="sec-note">loading…</span>}
            </div>
            <div className="vc-legend">
              {[['Visited', 'var(--grn)'], ['Planned', 'var(--acc)'], ['Self-added', '#06b6d4'], ['Unplanned visit', '#8b5cf6'], ['Not visited', 'var(--red)']].map(([l, c]) => <span key={l}><i style={{ background: c }} />{tr(l)}</span>)}
            </div>
          </div>
          <div className="vc-month-grid">
            {DOW.map((d, i) => <div key={d} className={'vc-dow' + (i >= 5 ? ' we' : '')}>{d}</div>)}
            {cells.map((c, i) => {
              if (!c) return <div key={i} className="vc-blank" />;
              const ps = (byDay[c] || []).filter(p => !sm || p.salesmanId === sm);
              const us = (byDayU[c] || []).filter(u => !sm || u.salesmanId === sm);
              const done = ps.filter(p => p.status === 'DONE').length;
              const sel = c === day, tod = c === tdy, we = i % 7 >= 5;
              const smIds = [...new Set(ps.map(p => p.salesmanId))];
              const chips = [...(sm
                ? ps.map(p => ({ key: p._id, tone: toneOf(p), text: p.dealerName }))
                : smIds.map(id => { const mine = ps.filter(p => p.salesmanId === id); return { key: id, tone: mine.every(p => p.status === 'DONE') ? 'var(--grn)' : mine.some(p => p.missed) ? 'var(--red)' : 'var(--acc)', text: `${firstName(id)} · ${mine.length}` }; })),
                ...(us.length ? (sm ? us.map(u => ({ key: 'u' + u._id, tone: '#8b5cf6', text: '✱ ' + u.dealerName })) : [{ key: 'u', tone: '#8b5cf6', text: `✱ ${us.length} unplanned` }]) : [])];
              const any = ps.length + us.length;
              const cellFull = !!sm && ps.length >= maxPerDay;
              return (
                <div key={c} role="button" tabIndex={0} className={'vc-cell' + (sel ? ' sel' : '') + (tod ? ' tod' : '') + (we ? ' we' : '') + (c < tdy ? ' past' : '')}
                  title={`${fmtDay(c)}${ps.length ? ` · ${ps.length} planned · ${done} visited` : ''}`}
                  onClick={() => { setDay(c); setReplacing(null); }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDay(c); setReplacing(null); } }}>
                  <div className="vc-head">
                    <span className="vc-num">{Number(c.slice(-2))}</span>
                    {ps.length > 0 && <span className={'vc-cap' + (cellFull ? ' full' : done === ps.length ? ' ok' : '')} title={sm ? `${ps.length} of ${maxPerDay} a day` : `${ps.length} planned`}>{sm ? `${ps.length}/${maxPerDay}` : ps.length}</span>}
                  </div>
                  {any > 0 && <div className="vc-chips">
                    {chips.slice(0, 3).map(ch => <div key={ch.key} className="vc-chip" style={{ '--tone': ch.tone }}><i /><span>{ch.text}</span></div>)}
                    {chips.length > 3 && <div className="vc-more">+{chips.length - 3} more</div>}
                  </div>}
                  {any > 0 && <div className="vc-dots">
                    {ps.slice(0, 5).map(p => <i key={p._id} style={{ '--tone': toneOf(p) }} />)}
                    {us.slice(0, Math.max(0, 5 - ps.length)).map(u => <i key={'u' + u._id} style={{ '--tone': '#8b5cf6' }} />)}
                    {any > 5 && <b>+</b>}
                  </div>}
                  {ps.length > 0 && <div className="vc-prog"><div style={{ width: Math.round(done / ps.length * 100) + '%' }} /></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* the day */}
        <div className="card vc-day">
          <div className="vc-dayhead">
            <div className={'vc-datebox' + (isToday ? ' tod' : '')}>
              <span>{dayDate.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
              <b>{dayDate.getDate()}</b>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 850, color: 'var(--t1)', letterSpacing: '-.01em' }}>{fmtDay(day)}</span>
                {isToday && <Badge tone="var(--acc)">Today</Badge>}
                {pastDay && <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600 }}>past day</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {daySm ? <><span className="ini" style={{ '--h': hue(smName(daySm)), width: 20, height: 20, borderRadius: 7, fontSize: 9 }}>{inits(smName(daySm))}</span>{smName(daySm)}</> : 'All salesmen'}
                <span style={{ color: 'var(--t3)' }}>· {dayPlans.length} dealer{dayPlans.length === 1 ? '' : 's'}</span>
              </div>
            </div>
            {dayPlans.length > 0 && <button className="btn vc-carry" onClick={() => setCarryOpen(true)} title="Every sample to show on this day's visits — each one listed once">
              <Package size={15} /><span>{tr('Samples for visits')}</span>
            </button>}
          </div>
          <div className="vc-daystats">
            {daySm && <div className="vc-capbox" style={{ '--tone': full ? 'var(--red)' : 'var(--acc)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)' }}>Day capacity</span>
                <b style={{ fontSize: 13, color: full ? 'var(--red)' : 'var(--t1)' }}>{dayPlans.length} / {maxPerDay}{full ? ' · full' : ''}</b>
              </div>
              <div className="att-bar"><div style={{ width: capPct + '%' }} /></div>
            </div>}
            <span className="kpi-pill" style={{ alignSelf: 'center' }}>Visited <b style={{ color: 'var(--grn)' }}>{dayDone}</b></span>
            {dayMissed > 0 && <span className="kpi-pill" style={{ alignSelf: 'center' }}>Not visited <b style={{ color: 'var(--red)' }}>{dayMissed}</b></span>}
          </div>

          {dayPlans.length === 0 && (
            <div className="vc-empty">
              <span className="sec-ico" style={{ '--tone': 'var(--t3)', width: 38, height: 38, borderRadius: 12 }}><CalendarDays size={18} /></span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>{mayAdd ? 'Nothing planned yet' : 'Nothing planned for this day'}</div>
              {mayAdd && <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Add dealers below.</div>}
            </div>
          )}
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {dayPlans.map((p, i) => (
              <div key={p._id} className="att-card vc-item" style={{ '--tone': toneOf(p), cursor: 'default', ...(replacing?._id === p._id ? { borderColor: 'var(--acc)', boxShadow: '0 0 0 1px var(--acc)' } : {}), ...(p.status === 'DONE' ? { background: 'color-mix(in srgb, var(--grn) 5%, var(--bg1))' } : {}) }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span className="vc-av">
                    <span className="ini" style={{ '--h': hue(p.dealerName), width: 36, height: 36, borderRadius: 12, fontSize: 12 }}>{inits(p.dealerName)}</span>
                    <span className="vc-av-b" style={{ background: toneOf(p) }}>{p.status === 'DONE' ? '✓' : p.missed ? '!' : i + 1}</span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {p.newParty ? <span style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--t1)', minWidth: 0, overflowWrap: 'anywhere' }}>{p.dealerName}</span>
                        : <a href="#" onClick={e => { e.preventDefault(); setOpen(p.dealerId); }} style={{ fontSize: 13.5, fontWeight: 750, color: 'var(--t1)', textDecoration: 'none', minWidth: 0, overflowWrap: 'anywhere' }}>{p.dealerName}</a>}
                      <Badge tone={toneOf(p)}>{labelOf(p)}</Badge>
                      {p.newParty && <Badge tone="#d97706">New party</Badge>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {[p.zone, p.city].filter(Boolean).length > 0 && <span><MapPin size={10} style={{ verticalAlign: -1 }} /> {[p.zone, p.city].filter(Boolean).join(' · ')}</span>}
                      {p.newParty && p.party?.name && <span><MapPin size={10} style={{ verticalAlign: -1 }} /> {[p.party.city, p.party.state].filter(Boolean).join(', ')} · {p.party.noGst ? 'no GST' : 'GST ' + p.party.gst}{p.leadId ? ' · saved to Leads' : ''}</span>}
                      {p.newParty && !p.party?.name && <span>· not in the dealer list — details at check-out</span>}
                      {!sm && <span>· {p.salesmanName}</span>}
                      {p.accountStatus && p.accountStatus !== 'NONE' && <span>· {p.accountStatus}</span>}
                      {p.selfAdded ? <span>· added by {p.salesmanId === currentUser?.id ? 'you' : firstName(p.salesmanId)}</span> : p.plannedByName ? <span>· planned by {p.plannedByName.split(' ')[0]}</span> : null}
                    </div>
                    {canPlan && editing[p._id] !== undefined ? (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        <input className="inp" autoFocus value={editing[p._id]} onChange={e => setEditing(x => ({ ...x, [p._id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') saveNote(p); if (e.key === 'Escape') setEditing(x => { const n = { ...x }; delete n[p._id]; return n; }); }} style={{ flex: 1, minWidth: 0, fontSize: 12.5, padding: '7px 10px' }} placeholder="what to do at this dealer" />
                        <button className="btnp" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => saveNote(p)}>Save</button>
                      </div>
                    ) : (
                      (p.note || (canPlan && !p.selfAdded) || p.collectTarget > 0 || p.salesmanNote) ? (
                        <div className="vc-notes">
                          {p.note ? <div><b style={{ color: 'var(--acc)' }}>Office:</b> {p.note}</div> : canPlan && !p.selfAdded ? <div style={{ color: 'var(--t3)', fontStyle: 'italic' }}>No note yet</div> : null}
                          {p.collectTarget > 0 && <div style={{ color: 'var(--grn)', fontWeight: 750 }}><Wallet size={11} style={{ verticalAlign: -1 }} /> To collect ₹{Number(p.collectTarget).toLocaleString('en-IN')}</div>}
                          {p.salesmanNote && <div><b style={{ color: '#06b6d4' }}>{firstName(p.salesmanId)}:</b> {p.salesmanNote}</div>}
                        </div>
                      ) : null
                    )}
                    <div className="vc-actions">
                      {p.newParty ? (p.status === 'DONE' ? null
                        : <button className="btnp" title="Check in at this new party — you will fill its details at check-out" style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }} onClick={() => visitNewParty(p)}>{tr('Visit')} <ArrowRight size={13} /></button>)
                      : <>
                      <button className={p.status === 'DONE' ? 'btn' : 'btnp'} title="Open the dealer: summary, check-in, MOM" style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5 }} onClick={() => setOpen(p.dealerId)}>{tr(p.status === 'DONE' ? 'Open' : 'Visit')} <ArrowRight size={13} /></button>
                      </>}
                      {canPlan && editing[p._id] === undefined && <button className="btn vc-ib" title="Edit the office note" onClick={() => setEditing(x => ({ ...x, [p._id]: p.note }))}><Pencil size={13} /></button>}
                      {canPlan && p.status !== 'DONE' && <button className="btn vc-ib" title="Replace with another dealer" style={replacing?._id === p._id ? { color: 'var(--acc)', borderColor: 'var(--acc)', background: 'var(--accL)' } : undefined} onClick={() => { setReplacing(r => r?._id === p._id ? null : p); setQ(''); }}><Repeat size={13} /></button>}
                      {canPlan && p.status !== 'DONE' && <button className="btn vc-ib" title="Mark visited" style={{ color: 'var(--grn)' }} onClick={() => act(() => api.updateVisitPlan(p._id, { status: 'DONE' }))}><CheckCircle2 size={13} /></button>}
                      {p.canRemove && <button className="btn vc-ib" title={canPlan ? 'Cancel this visit' : 'Remove (you added it)'} style={{ color: 'var(--red)' }} onClick={() => { if (window.confirm(`Remove ${p.dealerName} from ${fmtDay(day)}?`)) act(() => api.deleteVisitPlan(p._id)); }}><Trash2 size={13} /></button>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {dayUnplanned.length > 0 && (
            <div className="vc-unpl">
              <div className="vc-unpl-t"><span>✱</span> {tr('Unplanned visits')} <b>{dayUnplanned.length}</b><em>{tr('visited without being on the calendar')}</em></div>
              {dayUnplanned.map(u0 => {
                // a check-in typed by name has no dealer link — find the dealer by name so its buttons still work
                const u = u0.dealerId ? u0 : { ...u0, dealerId: (() => { const n = String(u0.dealerName || '').toLowerCase().replace(/\s+/g, ' ').trim(); const d = (dealers || []).find(x => String(x.name || '').toLowerCase().replace(/\s+/g, ' ').trim() === n); return d ? (d._id || d.id) : ''; })() };
                return (
                <div key={u._id} className="vc-unpl-row">
                  <span className="ini" style={{ '--h': hue(u.dealerName), width: 32, height: 32, borderRadius: 10, fontSize: 11 }}>{inits(u.dealerName)}</span>
                  <div className="vc-unpl-info" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--t1)', overflowWrap: 'anywhere' }}>{u.dealerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                      {!sm && <>{u.salesmanName} · </>}{u.checkInTime ? 'in ' + new Date(u.checkInTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ''}{u.checkOutTime ? ' · out ' + new Date(u.checkOutTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ''}{u.city ? ' · ' + u.city : ''}
                    </div>
                  </div>
                  <Badge tone={u.status === 'VISITED' ? 'var(--grn)' : 'var(--yel)'}>{u.status === 'VISITED' ? 'Visited' : 'In progress'}</Badge>
                  {u.dealerId && <button className="btn vc-lb" title="See what this dealer owes" onClick={() => setOutFor({ id: u.dealerId, name: u.dealerName })}><Wallet size={13} /><span>{tr('Outstanding')}</span></button>}
                  {u.dealerId && <button className="btn vc-lb" title="Open the dealer: summary, check-in, MOM" onClick={() => setOpen(u.dealerId)}><ArrowRight size={13} /><span>{tr('Visit')}</span></button>}
                </div>
                );
              })}
            </div>
          )}

          {full && (canPlan || !isStaff) && <div className="vc-note" style={{ '--tone': 'var(--red)' }}><AlertTriangle size={14} /> <span>Day full: {maxPerDay} dealers is the limit. {canPlan ? 'Replace one, or plan the next day.' : 'Pick another day.'}</span></div>}
          {!mayAdd && !full && !isStaff && pastDay && <div className="vc-note" style={{ '--tone': 'var(--t3)' }}><Clock size={14} /> <span>This day is over. Pick today or a later day to add a dealer.</span></div>}
          {mayAdd && (
            <div className="vc-add" style={replacing ? { borderColor: 'var(--acc)', background: 'color-mix(in srgb, var(--acc) 6%, var(--bg2))' } : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 800, color: replacing ? 'var(--acc)' : 'var(--t1)', marginBottom: 8, flexWrap: 'wrap' }}>
                <span className="sec-ico" style={{ '--tone': 'var(--acc)', width: 24, height: 24, borderRadius: 8 }}>{replacing ? <Repeat size={13} /> : <Plus size={13} />}</span>
                {replacing ? <>Replace {replacing.dealerName} with… <button className="btn" onClick={() => setReplacing(null)} style={{ fontSize: 11, padding: '2px 9px', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}><X size={11} /> cancel</button></>
                  : <>Add a dealer to {daySm ? (daySm === currentUser?.id ? 'your' : firstName(daySm) + "'s") : 'the'} day{!daySm && canPlan ? <span style={{ fontWeight: 600, color: 'var(--t3)' }}> — pick a salesman above first</span> : ''}</>}
              </div>
              <div className="inp" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', background: 'var(--bg1)' }}>
                <Search size={14} color="var(--t3)" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="dealer name — or type a new party's name" disabled={!daySm} style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'var(--t1)', fontSize: 13, outline: 'none', padding: 0 }} />
              </div>
              {!replacing && canPlan && <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="note for this visit — e.g. show Candid folder" disabled={!daySm} style={{ flex: 1, minWidth: 0, fontSize: 12.5, padding: '7px 10px', background: 'var(--bg1)' }} />
                {canPlan && <input className="inp" type="number" min="0" value={collect} onChange={e => setCollect(e.target.value)} placeholder="collect ₹" disabled={!daySm} title="Amount to collect on this visit" style={{ width: 110, flexShrink: 0, fontSize: 12.5, padding: '7px 10px', background: 'var(--bg1)' }} />}
              </div>}
              {canNewParty && daySm && <button type="button" className="vc-new" disabled={busy} onClick={addNewParty} style={{ marginTop: 8 }}>
                <span className="sec-ico" style={{ '--tone': '#d97706', width: 28, height: 28, borderRadius: 9 }}><Plus size={14} /></span>
                <span style={{ flex: 1, minWidth: 0 }}><b>Plan “{typed}” as a new party</b><small>not in the dealer list — correct name, GST, city and state are taken at check-out</small></span>
              </button>}
              {pool.length > 0 && <div style={{ marginTop: 8, display: 'grid', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
                {pool.map(d => (
                  <div key={d._id || d.id} className="vc-pick">
                    <span className="ini" style={{ '--h': hue(d.name), width: 28, height: 28, borderRadius: 9, fontSize: 10.5 }}>{inits(d.name)}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                      <div style={{ color: 'var(--t3)', fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[d.zone, d.city].filter(Boolean).join(' · ')}{d.salesman && d.salesman !== daySm ? ` · ${smName(d.salesman)}'s dealer` : ''}</div>
                    </span>
                    <button className="btnp" disabled={busy} style={{ fontSize: 11.5, padding: '4px 10px', display: 'inline-flex', gap: 3, alignItems: 'center', flexShrink: 0 }} onClick={() => add(d)}>{replacing ? <><Repeat size={12} /> Use</> : <><Plus size={12} /> Add</>}</button>
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>
      </div>

      {/* the month's report: planned, visited, not visited */}
      {report.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="sec-title">
            <span className="sec-ico" style={{ '--tone': 'var(--grn)' }}><ListChecks size={15} /></span> {month.toLocaleDateString('en-IN', { month: 'long' })} report
            <span className="count-pill">{report.length}</span>
            <span className="sec-note">A visit counts when the salesman checks out at the counter. A planned day that passes without one is <b style={{ color: 'var(--red)' }}>not visited</b>.</span>
          </div>
          <div style={{ overflowX: 'auto', margin: '0 -4px' }}>
            <table className="vc-table">
              <thead><tr>
                <th style={{ textAlign: 'left' }}>Salesman</th><th>Planned</th><th style={{ color: 'var(--grn)' }}>Visited</th><th style={{ color: 'var(--red)' }}>Not visited</th><th>Upcoming</th><th>Done %</th>
              </tr></thead>
              <tbody>{report.map(r => { const closed = r.visited + r.missed; const dp = closed ? Math.round(r.visited / closed * 100) : null; const dc = dp == null ? 'var(--t3)' : dp >= 80 ? 'var(--grn)' : dp >= 50 ? 'var(--yel)' : 'var(--red)'; return (
                <tr key={r.salesmanId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <span className="ini" style={{ '--h': (r.name || '?').charCodeAt(0) * 37 % 360 }}>{(r.name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                        <div className="vc-stack" title={`${r.visited} visited · ${r.missed} not visited · ${r.upcoming} upcoming`}>
                          <div style={{ flex: r.visited, background: 'var(--grn)' }} /><div style={{ flex: r.missed, background: 'var(--red)' }} /><div style={{ flex: r.upcoming, background: 'var(--acc)' }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className="vc-n">{r.planned}</span></td>
                  <td><span className="vc-n" style={{ '--tone': 'var(--grn)' }}>{r.visited}</span></td>
                  <td><span className="vc-n" style={r.missed ? { '--tone': 'var(--red)' } : { color: 'var(--t3)' }}>{r.missed}</span></td>
                  <td style={{ color: 'var(--t3)' }}>{r.upcoming}</td>
                  <td style={{ minWidth: 84 }}><div style={{ fontWeight: 800, color: dc }}>{dp == null ? '—' : dp + '%'}</div>{closed > 0 && <div className="pbar"><div style={{ width: Math.min(dp, 100) + '%', background: dc }} /></div>}</td>
                </tr>); })}</tbody>
            </table>
          </div>
          {missedList.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="sec-title" style={{ fontSize: 13.5, marginBottom: 8 }}>
                <span className="sec-ico" style={{ '--tone': 'var(--red)', width: 26, height: 26, borderRadius: 8 }}><AlertTriangle size={13} /></span> Not visited
                <span className="count-pill" style={{ color: 'var(--red)', background: 'color-mix(in srgb, var(--red) 12%, transparent)' }}>{missedList.length}</span>
                {canPlan && <span className="sec-note">Move any of them to the selected day ({fmtDay(day)}).</span>}
              </div>
              <div className="vc-missed">
                {missedList.map(p => (
                  <div key={p._id} className="att-card" style={{ '--tone': 'var(--red)', display: 'flex', gap: 10, alignItems: 'center', fontSize: 12.5, padding: '10px 12px 10px 16px', cursor: 'default' }}>
                    <span className="ini" style={{ '--h': hue(p.dealerName), width: 32, height: 32, borderRadius: 10 }}>{inits(p.dealerName)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href="#" onClick={e => { e.preventDefault(); if (!p.newParty) setOpen(p.dealerId); }} style={{ fontWeight: 750, color: 'var(--t1)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.dealerName}{p.newParty ? ' · new party' : ''}</a>
                      <div style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: 'var(--red)', fontWeight: 700 }}><CalendarDays size={10} style={{ verticalAlign: -1 }} /> {fmtDay(p.date)}</span>
                        {!sm && <span>· {p.salesmanName}</span>}
                        {p.note && <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {p.note}</span>}
                      </div>
                    </div>
                    {canPlan && <button className="btne" title="Move to the selected day" style={{ fontSize: 11.5, padding: '4px 10px', flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => act(() => api.updateVisitPlan(p._id, { date: day }))}><ArrowRight size={12} /> {fmtDay(day)}</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <style>{`
        .vc-page .page-head { flex-wrap: wrap; } .vc-page .page-head > div { min-width: 0; max-width: 100%; }
        .vc-nav { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border-radius: 999px; background: var(--bg1); border: 1px solid var(--b1); box-shadow: var(--shadow, none); max-width: 100%; }
        .vc-nav > b { font-size: 13.5px; font-weight: 800; color: var(--t1); min-width: 116px; text-align: center; white-space: nowrap; }
        .vc-chev { width: 30px; height: 30px; border-radius: 50%; border: none; background: transparent; color: var(--t2); display: grid; place-items: center; cursor: pointer; transition: background .15s, color .15s; flex-shrink: 0; }
        .vc-chev:hover { background: var(--bg2); color: var(--acc); }
        .vc-today { border: none; background: var(--accL); color: var(--acc); font-weight: 800; font-size: 12px; padding: 6px 13px; border-radius: 999px; cursor: pointer; margin-left: 2px; }
        .vc-today:hover { filter: brightness(.97); }
        .vc-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
        .vc-kpi { min-width: 0; }
        .vc-grid { display: grid; grid-template-columns: 1fr; gap: 14px; min-width: 0; }
        .vc-grid > .card { min-width: 0; }
        @media (min-width: 980px) { .vc-grid { grid-template-columns: minmax(0, 1.55fr) minmax(320px, 1fr); align-items: start; } .vc-day { position: sticky; top: 12px; } }
        .vc-month { padding: 14px; }
        .vc-month-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .vc-carry { align-self: flex-start; flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 750; padding: 8px 12px; border-radius: 12px; color: #6d28d9; border-color: color-mix(in srgb, #8b5cf6 45%, transparent); background: color-mix(in srgb, #8b5cf6 8%, var(--bg1)); }
        .vc-unpl { margin: 0 0 12px; padding: 10px 12px; border-radius: 14px; border: 1px dashed color-mix(in srgb, #8b5cf6 45%, transparent); background: color-mix(in srgb, #8b5cf6 6%, var(--bg1)); display: grid; gap: 8px; }
        .vc-unpl-t { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12.5px; font-weight: 800; color: #7c3aed; }
        .vc-unpl-t b { font-size: 11px; background: #8b5cf6; color: #fff; padding: 0 7px; border-radius: 999px; }
        .vc-unpl-t em { font-style: normal; font-weight: 600; font-size: 11px; color: var(--t3); }
        .vc-lb { display: inline-flex; flex-direction: column; align-items: center; gap: 1px; padding: 4px 7px; min-width: 52px; font-size: 9.5px; font-weight: 700; line-height: 1.1; color: var(--t2); }
        .vc-lb span { font-size: 9.5px; }
        .vc-unpl-row { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: 11px; background: var(--bg1); border: 1px solid var(--b1); }
        .vc-legend { display: flex; gap: 10px; flex-wrap: wrap; font-size: 11px; color: var(--t3); font-weight: 600; }
        .vc-legend span { display: inline-flex; align-items: center; gap: 5px; }
        .vc-legend i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .vc-month-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
        .vc-dow { font-size: 10.5px; font-weight: 800; color: var(--t3); text-transform: uppercase; letter-spacing: .08em; text-align: center; padding: 2px 0 4px; }
        .vc-dow.we { opacity: .6; }
        .vc-cell { position: relative; min-height: 96px; min-width: 0; padding: 6px; border-radius: 12px; cursor: pointer; border: 1px solid var(--b1); background: var(--bg1); display: flex; flex-direction: column; gap: 4px; overflow: hidden; transition: background .15s, border-color .15s, box-shadow .15s, transform .15s; outline: none; }
        .vc-cell:hover { border-color: var(--b2); background: var(--bg2); transform: translateY(-1px); box-shadow: var(--shadowHover, 0 4px 14px rgba(0,0,0,.12)); }
        .vc-cell:focus-visible { box-shadow: 0 0 0 2px var(--acc); }
        .vc-cell.we { background: color-mix(in srgb, var(--bg2) 70%, transparent); }
        .vc-cell.we .vc-num { color: var(--t3); }
        .vc-cell.past:not(.sel) .vc-num { opacity: .7; }
        .vc-cell.sel { border-color: var(--acc); background: color-mix(in srgb, var(--acc) 9%, var(--bg1)); box-shadow: 0 0 0 1px var(--acc); }
        .vc-cell.tod { box-shadow: 0 0 0 2px color-mix(in srgb, var(--acc) 55%, transparent); border-color: var(--acc); }
        .vc-cell.tod.sel { box-shadow: 0 0 0 2px var(--acc); }
        .vc-cell.tod .vc-num { background: var(--acc); color: #fff; opacity: 1; }
        .vc-head { display: flex; justify-content: space-between; align-items: center; gap: 3px; }
        .vc-num { width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 750; color: var(--t1); flex-shrink: 0; }
        .vc-cap { font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 20px; color: var(--acc); background: color-mix(in srgb, var(--acc) 13%, transparent); white-space: nowrap; }
        .vc-cap.ok { color: var(--grn); background: color-mix(in srgb, var(--grn) 14%, transparent); }
        .vc-cap.full { color: var(--red); background: color-mix(in srgb, var(--red) 13%, transparent); }
        .vc-chips { display: grid; gap: 2px; min-width: 0; }
        .vc-chip { display: flex; align-items: center; gap: 4px; min-width: 0; font-size: 10.5px; font-weight: 600; line-height: 1.35; padding: 1px 5px; border-radius: 6px; color: var(--t1); background: color-mix(in srgb, var(--tone) 12%, transparent); }
        .vc-chip i { width: 6px; height: 6px; border-radius: 50%; background: var(--tone); flex-shrink: 0; }
        .vc-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
        .vc-more { font-size: 10px; font-weight: 700; color: var(--t3); padding-left: 3px; }
        .vc-dots { display: none; gap: 3px; flex-wrap: wrap; justify-content: center; align-items: center; }
        .vc-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--tone); }
        .vc-dots b { font-size: 9px; line-height: 1; color: var(--t3); }
        .vc-prog { margin-top: auto; height: 3px; border-radius: 3px; background: var(--bg3); overflow: hidden; }
        .vc-prog > div { height: 100%; background: var(--grn); border-radius: 3px; }
        .vc-day { padding: 16px; }
        .vc-dayhead { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
        .vc-datebox { width: 52px; height: 56px; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; background: var(--bg2); border: 1px solid var(--b1); }
        .vc-datebox span { font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--acc); }
        .vc-datebox b { font-size: 22px; font-weight: 900; line-height: 1.05; color: var(--t1); }
        .vc-datebox.tod { background: var(--acc); border-color: var(--acc); }
        .vc-datebox.tod span, .vc-datebox.tod b { color: #fff; }
        .vc-daystats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .vc-capbox { flex: 1 1 180px; min-width: 0; padding: 8px 12px; border-radius: 12px; background: var(--bg2); border: 1px solid var(--b1); }
        .vc-empty { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; padding: 18px 10px; margin-bottom: 12px; border-radius: 14px; border: 1px dashed var(--b2); background: color-mix(in srgb, var(--bg2) 60%, transparent); }
        .vc-item { padding: 12px 12px 12px 16px; }
        .vc-av { position: relative; flex-shrink: 0; }
        .vc-av-b { position: absolute; right: -4px; bottom: -4px; min-width: 17px; height: 17px; padding: 0 3px; border-radius: 9px; color: #fff; font-size: 9.5px; font-weight: 800; display: grid; place-items: center; border: 2px solid var(--bg1); }
        .vc-notes { margin-top: 7px; padding: 7px 10px; border-radius: 10px; background: var(--bg2); font-size: 12px; color: var(--t2); display: grid; gap: 3px; overflow-wrap: anywhere; }
        .vc-actions { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 9px; align-items: center; }
        .vc-ib { width: 30px; height: 30px; padding: 0 !important; display: inline-grid !important; place-items: center; border-radius: 9px !important; }
        .vc-note { display: flex; gap: 8px; align-items: flex-start; font-size: 12.5px; font-weight: 600; padding: 9px 12px; border-radius: 12px; color: var(--tone); background: color-mix(in srgb, var(--tone) 10%, transparent); border: 1px solid color-mix(in srgb, var(--tone) 25%, transparent); margin-top: 4px; }
        .vc-note svg { flex-shrink: 0; margin-top: 1px; }
        .vc-add { margin-top: 4px; padding: 12px; border-radius: 14px; background: var(--bg2); border: 1px solid var(--b1); }
        .vc-pick { display: flex; gap: 9px; align-items: center; padding: 6px 8px; border-radius: 10px; background: var(--bg1); border: 1px solid var(--b1); transition: border-color .15s; }
        .vc-pick:hover { border-color: var(--acc); }
        .vc-table { width: 100%; min-width: 520px; border-collapse: collapse; font-size: 12.5px; }
        .vc-table th { color: var(--t3); font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; text-align: right; padding: 6px 8px; border-bottom: 1px solid var(--b1); white-space: nowrap; }
        .vc-table td { text-align: right; padding: 9px 8px; border-bottom: 1px solid var(--b1); }
        .vc-table td:first-child { text-align: left; }
        .vc-table tbody tr:last-child td { border-bottom: none; }
        .vc-table tbody tr:hover td { background: var(--bg2); }
        .vc-n { --tone: var(--t1); display: inline-block; min-width: 28px; text-align: center; font-weight: 800; padding: 2px 8px; border-radius: 20px; color: var(--tone); background: color-mix(in srgb, var(--tone) 10%, transparent); }
        .vc-stack { display: flex; height: 4px; width: 90px; border-radius: 3px; overflow: hidden; background: var(--bg3); margin-top: 4px; gap: 1px; }
        .vc-missed { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); }
        @media (max-width: 860px) { .vc-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } }
        @media (max-width: 600px) {
          .vc-carry { padding: 7px 10px; font-size: 11.5px; }
          /* unplanned row: name gets the full first line, status + buttons wrap below */
          .vc-unpl-row { flex-wrap: wrap; row-gap: 6px; }
          .vc-unpl-row .vc-unpl-info { flex: 1 1 calc(100% - 42px) !important; }
          .vc-unpl-row > .vc-lb:first-of-type { margin-left: auto; }
          .vc-kpi { padding: 11px 12px !important; gap: 10px !important; }
          .vc-kpi .ov-move-ico { width: 36px; height: 36px; border-radius: 11px; }
          .vc-kpi .ov-move-n { font-size: 20px; }
          .vc-kpi .ov-move-lbl { font-size: 12px; }
          .vc-kpi .ov-move-rule { font-size: 10.5px; }
          .vc-month { padding: 10px 8px !important; }
          .vc-legend { gap: 8px; font-size: 10.5px; }
          .vc-month-grid { gap: 3px; }
          .vc-dow { font-size: 9.5px; letter-spacing: .02em; }
          .vc-cell { min-height: 56px; padding: 4px 2px; border-radius: 10px; align-items: center; gap: 3px; }
          .vc-cell:hover { transform: none; }
          .vc-head { flex-direction: column; gap: 2px; }
          .vc-num { width: 22px; height: 22px; font-size: 11.5px; }
          .vc-cap { font-size: 8.5px; padding: 0 4px; }
          .vc-chips { display: none; }
          .vc-dots { display: flex; }
          .vc-prog { width: 70%; align-self: center; }
          .vc-day { padding: 12px; }
          .vc-nav > b { min-width: 96px; font-size: 12.5px; }
        }
      `}</style>
      {carryOpen && <SamplesCarryModal date={day} salesmanId={daySm || ''} onClose={() => setCarryOpen(false)} />}
      {outFor && <DealerOutstandingModal dealerId={outFor.id} dealerName={outFor.name} onClose={() => setOutFor(null)} />}
      {open && <DealerVisitModal dealerId={open} dealerName={plans.find(p => p.dealerId === open)?.dealerName || ''} onClose={() => { setOpen(null); load(); }} />}
    </div>
  );
}
