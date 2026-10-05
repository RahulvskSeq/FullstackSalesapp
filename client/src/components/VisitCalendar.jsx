import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, CheckCircle2, CalendarDays, Repeat, Pencil, Trash2, ArrowRight, AlertTriangle, ListChecks, Sun, MapPin, Wallet, X, Clock, Package, CalendarPlus } from 'lucide-react';
import { api } from '../api';
import DealerVisitModal from './DealerVisitModal';
import SamplesCarryModal from './SamplesCarryModal';
import PlanVisitDrawer from './PlanVisitDrawer';
import RepeatHint from './RepeatHint';
// the Unplanned visit screen (check-in / check-out), opened over the calendar for a walk-in party
const VisitsPage = React.lazy(() => import('./CRM').then(m => ({ default: m.VisitsPage })));
import { useT } from '../i18n';
import { PageHead } from '../collections/ui';
import { holidayOn, HOLIDAY_LABEL, HOLIDAY_TONE } from '../lib/holidays';

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
const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
const weekStartOf = s => { const d = new Date(s + 'T00:00:00'); return addDays(s, -((d.getDay() + 6) % 7)); };   // Monday
const fmtShort = s => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export default function VisitCalendar({ dealers = [], users = {}, currentUser, onNavigate }) {
  const isStaff = ['admin', 'superadmin', 'employee'].includes(currentUser?.role);
  const salesmen = useMemo(() => Object.entries(users || {}).filter(([, u]) => u?.role === 'salesman' && u?.active !== false).map(([id, u]) => ({ id, name: u.name || id })).sort((a, b) => a.name.localeCompare(b.name)), [users]);
  const [sm, setSm] = useState(isStaff ? '' : currentUser?.id || '');
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [day, setDay] = useState(todayYmd());
  const [carryOpen, setCarryOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [plansAll, setPlans] = useState([]);   // the month, plus the edges of the week on show
  // Month / Week / Day, like Google Calendar; remembered on this device
  // opens on today's Day view every time; Week / Month are a tap away
  const [view, setViewRaw] = useState('day');
  const { t: tr } = useT();
  const [unplanned, setUnplanned] = useState([]);   // visits made without a plan
  const [canPlan, setCanPlan] = useState(false);   // the server's answer: may this user plan for others
  const [planFor, setPlanFor] = useState(null);    // null = any salesman; else only these salesmen's days (Settings → Permissions)
  const mayPlan = sid => canPlan && (!planFor || planFor.includes(sid));
  const [maxPerDay, setMaxPerDay] = useState(8);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [collect, setCollect] = useState('');
  const [open, setOpen] = useState(null);           // dealerId for the visit modal
  const [kList, setKList] = useState(null);         // the summary card whose dealers are listed: { kind, tier }
  const [editing, setEditing] = useState({});       // planId → note text being edited
  const [replacing, setReplacing] = useState(null); // plan being swapped for another dealer
  const [dayFilter, setDayFilter] = useState('all');  // the day's list: all | open | done | missed | skipped
  const [dayFilterSm, setDayFilterSm] = useState(''); // the day's list: one salesman ('' = all)
  const [dayQ, setDayQ] = useState('');               // the day's list: party / city / salesman search
  useEffect(() => { setDayFilter('all'); setDayQ(''); }, [day]);    // a new day opens on everything

  const from = ymd(new Date(month.getFullYear(), month.getMonth(), 1));
  const to = ymd(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  // a week can run into the next or previous month — load those days too
  const wk0 = weekStartOf(day), wk6 = addDays(wk0, 6);
  // Day view: a strip you swipe through — two weeks back to about six weeks ahead of today
  // (stretched to keep the chosen day inside), loaded with the month so every tile has its count
  const t0 = todayYmd();
  const [ahead, setAhead] = useState(60);   // days ahead of today in the strip; grows as you scroll toward the end
  const stripFrom = [addDays(t0, -14), addDays(day, -7)].sort()[0], stripTo = [addDays(t0, ahead), addDays(day, 14)].sort()[1];
  const lo = view === 'day' ? stripFrom : wk0, hi = view === 'day' ? stripTo : wk6;
  const loadFrom = lo < from ? lo : from, loadTo = hi > to ? hi : to;
  const plans = useMemo(() => plansAll.filter(p => p.date >= from && p.date <= to), [plansAll, from, to]);   // month figures count the month only
  // Each load gets a number; only the newest one may write state, so a slow
  // answer for the previous month/salesman can't overwrite the current one.
  const loadSeq = useRef(0);
  const load = async () => {
    const seq = ++loadSeq.current;
    setBusy(true); setErr('');
    try { const r = await api.visitPlans({ from: loadFrom, to: loadTo, ...(sm ? { salesmanId: sm } : {}) }); if (seq !== loadSeq.current) return; setPlans(r.items || []); setUnplanned(r.unplanned || []); setCanPlan(!!r.canPlan); setPlanFor(Array.isArray(r.planFor) ? r.planFor : null); setMaxPerDay(r.maxPerDay || 5); }
    catch (e) { if (seq === loadSeq.current) setErr(e?.message || 'Could not load'); }
    finally { if (seq === loadSeq.current) setBusy(false); }
  };
  useEffect(() => { load(); }, [loadFrom, loadTo, sm]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const byDay = useMemo(() => { const m = {}; for (const p of plansAll) (m[p.date] ||= []).push(p); return m; }, [plansAll]);
  const dayPlans = (byDay[day] || []).filter(p => !sm || p.salesmanId === sm);
  const byDayU = useMemo(() => { const m = {}; for (const u of unplanned) (m[u.date] ||= []).push(u); return m; }, [unplanned]);
  const dayUnplanned = (byDayU[day] || []).filter(u => !sm || u.salesmanId === sm);
  const daySm = sm || (isStaff ? '' : currentUser?.id);
  const isToday = day === todayYmd(), pastDay = day < todayYmd();
  const dayHol = holidayOn(day);
  // who may add to this day: a planner for anyone, a salesman for himself (today or later)
  const full = !!daySm && dayPlans.length >= maxPerDay;
  // plans are for tomorrow onwards; today a salesman checks in an unplanned visit instead
  const futureDay = day > todayYmd();
  const mayAdd = futureDay && (canPlan || !isStaff) && !full;
  const walkIn = isToday && !replacing;
  // the month, by salesman: planned, visited, not visited — the report
  const report = useMemo(() => {
    const m = {};
    const td = todayYmd();
    for (const p of plans) { const r = (m[p.salesmanId] ||= { salesmanId: p.salesmanId, name: p.salesmanName, planned: 0, visited: 0, missed: 0, today: 0, upcoming: 0 }); r.planned++; if (p.status === 'DONE') r.visited++; else if (p.missed) r.missed++; else if (p.status === 'PLANNED') { if (p.date === td) r.today++; else r.upcoming++; } }
    return Object.values(m).sort((a, b) => b.missed - a.missed || b.planned - a.planned);
  }, [plans]);
  // how often each dealer is on one salesman's calendar this month — shown beside "Planned"
  const repeatOf = useMemo(() => {
    const m = new Map();
    for (const p of plans) { const k = p.salesmanId + '|' + p.dealerId; (m.get(k) || m.set(k, []).get(k)).push(p.date); }
    for (const v of m.values()) v.sort();
    return m;
  }, [plans]);
  const missedList = useMemo(() => plans.filter(p => p.missed).sort((a, b) => b.date.localeCompare(a.date)), [plans]);
  // today's plans with no check-out yet — still open, they turn "not visited" tonight
  const todayOpen = useMemo(() => { const td = todayYmd(); return plans.filter(p => p.date === td && p.status === 'PLANNED' && !p.missed).sort((a, b) => (a.salesmanName || '').localeCompare(b.salesmanName || '') || (a.dealerName || '').localeCompare(b.dealerName || '')); }, [plans]);
  const todayListRef = useRef(null);

  // dealers to pick from: the salesman's own first, then everyone else's
  const pool = useMemo(() => {
    const s = q.trim().toLowerCase(); if (s.length < 2) return [];
    const on = new Set(dayPlans.map(p => p.dealerId));
    return dealers.filter(d => (!planFor || planFor.includes(d.salesman) || (!isStaff && d.salesman === currentUser?.id)) && !on.has(d._id || d.id) && ((d.name || '').toLowerCase().includes(s) || (d.city || '').toLowerCase().includes(s))).sort((a, b) => (a.salesman === daySm ? -1 : 1) - (b.salesman === daySm ? -1 : 1)).slice(0, 10);
  }, [q, dealers, daySm, dayPlans, planFor, isStaff, currentUser]);

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
  // today, off the plan: open the dealer (check in there) — it is recorded as an unplanned visit
  const visitUnplanned = (d) => { setQ(''); setOpen(d._id || d.id); };
  // a new party today: put it on today's unplanned visits first, then Visit opens the check-in
  const visitUnplannedNew = () => act(async () => { await api.addVisitPlan({ date: day, salesmanId: currentUser?.id, newPartyName: typed, walkIn: true }); setQ(''); });
  const [ciOpen, setCiOpen] = useState(null);   // the walk-in being checked in / out
  const openCheckIn = (u) => {
    if (u.status === 'ADDED') { try { localStorage.setItem('stp_plan_checkin', JSON.stringify({ planId: u.walkInId, name: u.dealerName, date: u.date, walkIn: true, t: Date.now() })); } catch { /* storage blocked */ } }
    setCiOpen(u);
  };
  const closeCheckIn = () => { setCiOpen(null); load(); };
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
  const toneOf = p => p.status === 'DONE' ? 'var(--grn)' : p.missed ? 'var(--red)' : p.status === 'SKIPPED' ? 'var(--t3)' : 'var(--acc)';   // self-added plans are just planned
  const labelOf = p => p.status === 'DONE' ? 'Visited' : p.missed ? 'Not visited' : p.status === 'SKIPPED' ? 'Skipped' : 'Planned';
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
  // different dealers on the month's plan, and how many of the top dealers (STAR / KEY / ACHIEVER / REACTIVE) are among them
  const reach = useMemo(() => {
    const vis = plans.filter(p => !sm || p.salesmanId === sm);
    const planned = new Set(vis.map(p => String(p.dealerId)));
    const mine = dealers.filter(d => (isStaff ? (!sm || d.salesman === sm) : d.salesman === currentUser?.id));
    const TOP = [['STAR', 'STAR'], ['KEY ACCOUNT', 'KEY'], ['ACHIEVER', 'ACH'], ['REACTIVE', 'REA']];
    const tiers = TOP.map(([k, short]) => {
      const list = mine.filter(d => String(d.status || '').trim().toUpperCase() === k);
      return { k, short, total: list.length, planned: list.filter(d => planned.has(String(d._id || d.id))).length };
    });
    // real new parties only — route names (".Karatgi") and "New" placeholders never become leads
    const newParties = new Set(vis.filter(p => p.newParty && !isRouteName(p.dealerName)).map(p => String(p.dealerName || '').trim().toLowerCase())).size;
    return { unique: planned.size, newParties, of: mine.length, tiers, topTotal: tiers.reduce((a, t) => a + t.total, 0), topPlanned: tiers.reduce((a, t) => a + t.planned, 0), mine, planned };
  }, [plans, sm, dealers, isStaff, currentUser]);
  // dates each dealer is planned this month (for the summary pop-ups)
  const datesOf = useMemo(() => {
    const m = new Map();
    for (const p of plans) if (!sm || p.salesmanId === sm) (m.get(String(p.dealerId)) || m.set(String(p.dealerId), []).get(String(p.dealerId))).push(p);
    for (const v of m.values()) v.sort((a, b) => a.date.localeCompare(b.date));
    return m;
  }, [plans, sm]);
  // Tapping a day on a phone (calendar above, day below) brings that day's plan into view.
  const dayRef = useRef(null);
  // the swipeable day strip: its days, keeping the chosen one in view, and the month following the day
  const stripRef = useRef(null);
  const stripDays = useMemo(() => { const out = []; for (let c = stripFrom; c <= stripTo; c = addDays(c, 1)) out.push(c); return out; }, [stripFrom, stripTo]);
  useEffect(() => {
    if (view !== 'day') return;
    const box = stripRef.current, el = box?.querySelector(`[data-day="${day}"]`);
    if (box && el) box.scrollTo({ left: el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [day, view, stripFrom]);
  // a mouse wheel scrolls the strip sideways; near the end, more future days are added
  useEffect(() => {
    const box = stripRef.current; if (!box || view !== 'day') return;
    const wheel = e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { box.scrollLeft += e.deltaY; e.preventDefault(); } };
    box.addEventListener('wheel', wheel, { passive: false });
    return () => box.removeEventListener('wheel', wheel);
  }, [view]);
  const onStripScroll = e => { const b = e.currentTarget; if (b.scrollLeft + b.clientWidth > b.scrollWidth - 240) setAhead(a => Math.min(a + 30, 400)); };
  const stepStrip = dir => { const b = stripRef.current; if (b) b.scrollBy({ left: dir * Math.max(240, b.clientWidth * 0.8), behavior: 'smooth' }); };
  const pickStripDay = (c) => {
    const x = new Date(c + 'T00:00:00');
    if (x.getFullYear() !== month.getFullYear() || x.getMonth() !== month.getMonth()) setMonth(new Date(x.getFullYear(), x.getMonth(), 1));
    pickDay(c);
  };
  const pickDay = (c) => {
    setDay(c); setReplacing(null);
    if (window.innerWidth < 980) setTimeout(() => scrollToDay(), 60);
  };
  // scroll whichever box actually scrolls (the app's #main on a phone, else the page) to just above the day
  const scrollToDay = () => {
    const el = dayRef.current; if (!el) return;
    let box = el.parentElement;
    while (box && box !== document.body && !(box.scrollHeight > box.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(box).overflowY))) box = box.parentElement;
    const scroller = box && box !== document.body ? box : (document.scrollingElement || document.documentElement);
    const top = el.getBoundingClientRect().top - (scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top) + scroller.scrollTop - 12;
    try { scroller.scrollTo({ top, behavior: 'smooth' }); } catch { scroller.scrollTop = top; }
    setTimeout(() => { if (Math.abs(scroller.scrollTop - top) > 40) scroller.scrollTop = top; }, 500);   // no smooth scrolling here: jump
  };
  const setView = v => {
    setViewRaw(v);
    // week/day follow the selected day; keep it inside the month on show
    if (v !== 'month' && (day < from || day > to)) setDay(tdy >= from && tdy <= to ? tdy : from);
  };
  const step = dir => {
    if (view === 'month') { setMonth(m => new Date(m.getFullYear(), m.getMonth() + dir, 1)); return; }
    const d = addDays(day, dir * (view === 'week' ? 7 : 1)); setDay(d);
    const x = new Date(d + 'T00:00:00'); if (x.getMonth() !== month.getMonth() || x.getFullYear() !== month.getFullYear()) setMonth(new Date(x.getFullYear(), x.getMonth(), 1));
  };
  const navLabel = view === 'week' ? `${fmtShort(wk0)} – ${fmtShort(wk6)}` : view === 'day' ? fmtDay(day)
    : month.toLocaleDateString('en-IN', { month: 'long' }) + (month.getFullYear() !== new Date().getFullYear() ? ' ' + month.getFullYear() : '');
  const goToday = () => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setDay(todayYmd()); };
  const tiles = [
    { k: 'planned', n: kpi.planned, label: 'planned', rule: `${kpi.upcoming} still to go`, tone: 'var(--acc)', Icon: CalendarDays, onClick: () => setKList({ kind: 'planned' }) },
    { k: 'unique', n: reach.unique, label: 'parties', rule: reach.of ? (reach.newParties ? `of ${reach.of.toLocaleString('en-IN')}` : `of ${reach.of.toLocaleString('en-IN')} dealers`) : 'different dealers', tone: '#8b5cf6', Icon: MapPin, onClick: () => setKList({ kind: 'parties' }),
      pill: reach.newParties ? { text: `+${reach.newParties} new`, title: 'New parties (not in the dealer list yet) planned this month — tap to see them', onClick: () => setKList({ kind: 'new' }) } : null },
    { k: 'top', top: true, tone: '#f59e0b', Icon: ListChecks },
    { k: 'done', n: kpi.done, label: 'visited', rule: closedPct == null ? 'none closed yet' : `${closedPct}% of closed visits`, tone: 'var(--grn)', Icon: CheckCircle2, onClick: () => setKList({ kind: 'visited' }) },
    { k: 'today', n: kpi.todayIn ? kpi.today : '—', label: 'today', rule: kpi.todayIn ? `${kpi.todayDone} of ${kpi.today} visited` : 'tap to jump to today', tone: '#06b6d4', Icon: Sun, onClick: goToday },
  ];
  const dayDate = new Date(day + 'T00:00:00');
  // the day's list can be narrowed: by result and, with every salesman on show, by salesman
  // "Not visited" = no check-out: a past day's miss, or today's visit not done yet.
  // "Planned" only means something for days still to come.
  const isOpen = p => p.status === 'PLANNED' && !p.missed;
  const DAY_FILTERS = [
    ['all', 'All', () => true, 'var(--t1)'],
    ...(futureDay ? [['open', 'Planned', isOpen, 'var(--acc)']] : []),
    ['done', 'Visited', p => p.status === 'DONE', 'var(--grn)'],
    ['missed', 'Not visited', p => !!p.missed || (isToday && isOpen(p)), 'var(--red)'],
    ['skipped', 'Skipped', p => p.status === 'SKIPPED' && !p.missed, 'var(--t3)'],
    // visits made without a plan — they live in their own box below the plans
    ...(!futureDay ? [['unpl', 'Unplanned', () => false, '#8b5cf6']] : []),
  ];
  const daySmIds = [...new Set([...dayPlans, ...dayUnplanned].map(p => p.salesmanId))];
  const smPicked = dayFilterSm && daySmIds.includes(dayFilterSm) ? dayFilterSm : '';
  const smPlans = smPicked ? dayPlans.filter(p => p.salesmanId === smPicked) : dayPlans;
  const smUnplanned = smPicked ? dayUnplanned.filter(u => u.salesmanId === smPicked) : dayUnplanned;
  const dfKey = DAY_FILTERS.some(f => f[0] === dayFilter) ? dayFilter : 'all';   // a chip this day doesn't have falls back to All
  const dfTest = DAY_FILTERS.find(f => f[0] === dfKey)[2];
  const dqs = dayQ.trim().toLowerCase();
  const dqHit = p => !dqs || [p.dealerName, p.dealerCity, p.city, p.salesmanName, p.zone].some(v => String(v || '').toLowerCase().includes(dqs));
  const shownPlans = smPlans.filter(dfTest).filter(dqHit);
  const shownUnplanned = (dfKey === 'all' || dfKey === 'unpl' ? smUnplanned : []).filter(dqHit);
  const dfCount = (k, test) => k === 'unpl' ? smUnplanned.length : k === 'all' ? smPlans.length + smUnplanned.length : smPlans.filter(test).length;
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
        {tiles.map(t => t.top ? (
          // top dealers: how many of the STAR / KEY / ACHIEVER / REACTIVE dealers are on this month's plan
          <div key={t.k} className="vck vck-top tap" style={{ '--tone': t.tone }} onClick={() => setKList({ kind: 'top', tier: '' })}>
            <div className="vck-ico"><t.Icon size={18} /></div>
            <div className="vck-main">
              <div className="vck-head"><b className="vck-n">{reach.topPlanned}</b><span className="vck-of">/ {reach.topTotal}</span><span className="vck-pct">{reach.topTotal ? Math.round(reach.topPlanned / reach.topTotal * 100) : 0}%</span></div>
              <span className="vck-lbl">top dealers planned</span>
              <div className="vck-bar"><i style={{ width: (reach.topTotal ? Math.round(reach.topPlanned / reach.topTotal * 100) : 0) + '%' }} /></div>
            </div>
            <div className="vck-tiers">
              {reach.tiers.map(x => (
                <div key={x.k} className="vck-tier" title={`${x.k}: ${x.planned} of ${x.total} planned this month`} onClick={e => { e.stopPropagation(); setKList({ kind: 'top', tier: x.k }); }}>
                  <span>{x.short}</span><b>{x.planned}<em>/{x.total}</em></b>
                  <div className="vck-bar sm"><i style={{ width: (x.total ? Math.round(x.planned / x.total * 100) : 0) + '%' }} /></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div key={t.k} className={'vck' + (t.onClick ? ' tap' : '')} onClick={t.onClick} style={{ '--tone': t.tone }}>
            <div className="vck-ico"><t.Icon size={18} /></div>
            <div className="vck-main">
              <div className="vck-head"><b className="vck-n">{t.n}</b><span className="vck-lbl">{t.label}</span></div>
              <span className="vck-subrow"><span className="vck-sub">{t.rule}</span>
                {t.pill && <button type="button" className="vck-pill" title={t.pill.title} onClick={e => { e.stopPropagation(); t.pill.onClick(); }}>{t.pill.text}</button>}</span>
            </div>
            {t.onClick && <ChevronRight size={16} className="vck-go" />}
          </div>
        ))}
      </div>

      <div className={'vc-grid' + (view !== 'month' ? ' dayview' : '')}>
        {/* month */}
        <div className="card vc-month">
          <div className="vc-month-top">
            <div className="sec-title" style={{ margin: 0 }}>
              <span className="sec-ico" style={{ '--tone': 'var(--acc)' }}><CalendarDays size={15} /></span>
              <button className="vc-chev vc-mchev" title={'Previous ' + view} onClick={() => step(-1)}><ChevronLeft size={16} /></button>
              <span className="vc-mname">{navLabel}</span>
              <button className="vc-chev vc-mchev" title={'Next ' + view} onClick={() => step(1)}><ChevronRight size={16} /></button>
              <div className="vc-views" role="tablist" aria-label="Calendar view">
                {[['month', 'Month'], ['week', 'Week'], ['day', 'Day']].map(([k, l]) => <button key={k} role="tab" aria-selected={view === k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{tr(l)}</button>)}
              </div>
              {busy && <span className="sec-note">loading…</span>}
              {(canPlan || !isStaff) && <button className="btnp vc-planbtn" onClick={() => setPlanOpen(true)}><CalendarPlus size={15} /> {tr('Plan a visit')}</button>}
            </div>
            <div className="vc-legend">
              {[['Visited', 'var(--grn)'], ['Planned', 'var(--acc)'], ['Unplanned visit', '#8b5cf6'], ['Not visited', 'var(--red)']].map(([l, c]) => <span key={l}><i style={{ background: c }} />{tr(l)}</span>)}
            </div>
          </div>
          {view === 'month' && <div className="vc-month-grid">
            {DOW.map((d, i) => <div key={d} className={'vc-dow' + (i >= 5 ? ' we' : '')}>{d}</div>)}
            {cells.map((c, i) => {
              if (!c) return <div key={i} className="vc-blank" />;
              const ps = (byDay[c] || []).filter(p => !sm || p.salesmanId === sm);
              const us = (byDayU[c] || []).filter(u => !sm || u.salesmanId === sm);
              const done = ps.filter(p => p.status === 'DONE').length;
              const sel = c === day, tod = c === tdy, we = i % 7 >= 5, hol = holidayOn(c);
              const smIds = [...new Set(ps.map(p => p.salesmanId))];
              const chips = [...(sm
                ? ps.map(p => ({ key: p._id, tone: toneOf(p), text: p.dealerName }))
                : smIds.map(id => { const mine = ps.filter(p => p.salesmanId === id); return { key: id, tone: mine.every(p => p.status === 'DONE') ? 'var(--grn)' : mine.some(p => p.missed) ? 'var(--red)' : 'var(--acc)', text: `${firstName(id)} · ${mine.length}` }; })),
                ...(us.length ? (sm ? us.map(u => ({ key: 'u' + u._id, tone: '#8b5cf6', text: '✱ ' + u.dealerName })) : [{ key: 'u', tone: '#8b5cf6', text: `✱ ${us.length} unplanned` }]) : [])];
              const any = ps.length + us.length;
              const cellFull = !!sm && ps.length >= maxPerDay;
              return (
                <div key={c} role="button" tabIndex={0} className={'vc-cell' + (sel ? ' sel' : '') + (tod ? ' tod' : '') + (we ? ' we' : '') + (c < tdy ? ' past' : '') + (hol ? ' hol' : '')}
                  style={hol ? { '--hol': HOLIDAY_TONE[hol.type] } : undefined}
                  title={`${fmtDay(c)}${hol ? ` · ${HOLIDAY_LABEL[hol.type]}: ${hol.name}` : ''}${ps.length ? ` · ${ps.length} planned · ${done} visited` : ''}`}
                  onClick={() => pickDay(c)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickDay(c); } }}>
                  {hol && <div className="vc-holwm" aria-hidden="true"><b>{HOLIDAY_LABEL[hol.type]}</b><span>{hol.name}</span></div>}
                  <div className="vc-head">
                    <span className="vc-num">{Number(c.slice(-2))}</span>
                    {hol && ps.length > 0 && <span className="vc-holwarn" title={`${ps.length} visit${ps.length === 1 ? '' : 's'} planned on ${HOLIDAY_LABEL[hol.type].toLowerCase()} (${hol.name})`}>⚠</span>}
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
                  {hol && <div className="vc-holtag" title={`${HOLIDAY_LABEL[hol.type]} · ${hol.name}`}>{hol.type === 'holiday' ? '🎉 ' : ''}{hol.name}</div>}
                </div>
              );
            })}
          </div>}
          {view === 'week' && <div className="vc-week">
            {Array.from({ length: 7 }, (_, i) => addDays(wk0, i)).map((c, i) => {
              const ps = (byDay[c] || []).filter(p => !sm || p.salesmanId === sm);
              const us = (byDayU[c] || []).filter(u => !sm || u.salesmanId === sm);
              const hol = holidayOn(c);
              return (
                <div key={c} role="button" tabIndex={0} className={'vc-wcol' + (c === day ? ' sel' : '') + (c === tdy ? ' tod' : '') + (i >= 5 ? ' we' : '') + (c < from || c > to ? ' out' : '') + (hol ? ' hol' : '')}
                  style={hol ? { '--hol': HOLIDAY_TONE[hol.type] } : undefined}
                  onClick={() => pickDay(c)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickDay(c); } }}>
                  {hol && <div className="vc-holwm" aria-hidden="true"><b>{HOLIDAY_LABEL[hol.type]}</b><span>{hol.name}</span></div>}
                  <div className="vc-whead"><span>{DOW[i]}</span><b>{Number(c.slice(-2))}</b>{ps.length > 0 && <em>{ps.length}</em>}{hol && ps.length > 0 && <span className="vc-holwarn" title="Visits planned on a holiday">⚠</span>}</div>
                  <div className="vc-wlist">
                    {ps.map(p => <div key={p._id} className="vc-wit" style={{ '--tone': toneOf(p) }} title={`${p.dealerName} · ${labelOf(p)}`}><i /><span>{p.dealerName}</span>{!sm && <small>{firstName(p.salesmanId)}</small>}</div>)}
                    {us.length > 0 && <div className="vc-wit" style={{ '--tone': '#8b5cf6' }}><i /><span>✱ {us.length} unplanned</span></div>}
                    {!ps.length && !us.length && <div className="vc-wnone">—</div>}
                  </div>
                </div>
              );
            })}
          </div>}
          {view === 'day' && <div className="vc-stripwrap">
          <button className="vc-sgo l" onClick={() => stepStrip(-1)} aria-label="Earlier days"><ChevronLeft size={16} /></button>
          <div className="vc-strip scroll" ref={stripRef} onScroll={onStripScroll}>
            {stripDays.map(c => {
              const n = (byDay[c] || []).filter(p => !sm || p.salesmanId === sm).length;
              const dw = (new Date(c + 'T00:00:00').getDay() + 6) % 7;
              const first = c.slice(-2) === '01' || c === stripDays[0];
              const hol = holidayOn(c);
              return <button key={c} data-day={c} className={'vc-sday' + (c === day ? ' sel' : '') + (c === tdy ? ' tod' : '') + (dw >= 5 ? ' we' : '') + (c < tdy ? ' past' : '') + (hol ? ' hol' : '')}
                style={hol ? { '--hol': HOLIDAY_TONE[hol.type] } : undefined} title={hol ? `${HOLIDAY_LABEL[hol.type]} · ${hol.name}` : undefined} onClick={() => pickStripDay(c)}>
                {first && <i className="vc-smon">{new Date(c + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}</i>}
                <span>{DOW[dw]}</span><b>{Number(c.slice(-2))}</b><em>{hol ? (n ? '⚠ ' : '') + HOLIDAY_LABEL[hol.type] : n ? n + ' planned' : '—'}</em></button>;
            })}
          </div>
          <button className="vc-sgo r" onClick={() => stepStrip(1)} aria-label="Later days"><ChevronRight size={16} /></button>
          </div>}
        </div>

        {/* the day */}
        <div className="card vc-day" ref={dayRef}>
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
              <Package size={15} /><span className="vc-carry-l">{tr('Samples for visits')}</span><span className="vc-carry-s">{tr('Samples')}</span>
            </button>}
          </div>
          {dayHol && (
            <div className="vc-holbanner" style={{ '--hol': HOLIDAY_TONE[dayHol.type] }}>
              <div className="vc-holwm big" aria-hidden="true"><b>{HOLIDAY_LABEL[dayHol.type]}</b></div>
              <CalendarDays size={16} />
              <div style={{ minWidth: 0 }}>
                <b>{HOLIDAY_LABEL[dayHol.type]} · {dayHol.name}</b>
                <span>{dayPlans.length ? `${dayPlans.length} visit${dayPlans.length === 1 ? ' is' : 's are'} planned on this ${dayHol.type === 'half' ? 'half day' : 'holiday'} — check with the salesman.` : dayHol.type === 'half' ? 'Half working day.' : 'Office closed — no visits expected.'}</span>
              </div>
            </div>
          )}
          <div className="vc-daystats">
            {daySm && <div className="vc-capbox" style={{ '--tone': full ? 'var(--red)' : 'var(--acc)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)' }}>Day capacity</span>
                <b style={{ fontSize: 13, color: full ? 'var(--red)' : 'var(--t1)' }}>{dayPlans.length} / {maxPerDay}{full ? ' · full' : ''}</b>
              </div>
              <div className="att-bar"><div style={{ width: capPct + '%' }} /></div>
            </div>}
            {(dayPlans.length > 0 || dayUnplanned.length > 0) && <div className="vc-dfilter" role="tablist" aria-label="Show">
              {DAY_FILTERS.map(([k, l, test, tone]) => {
                const n = dfCount(k, test);
                if ((k === 'skipped' || k === 'unpl') && !n && dfKey !== k) return null;
                return <button key={k} type="button" role="tab" aria-selected={dfKey === k} className={'vc-dfc' + (dfKey === k ? ' on' : '')} style={{ '--tone': tone }} onClick={() => setDayFilter(k)}>{tr(l)} <b>{n}</b></button>;
              })}
              {(dayPlans.length + dayUnplanned.length) > 4 && <label className="vc-dfq"><Search size={13} /><input value={dayQ} onChange={e => setDayQ(e.target.value)} placeholder="Search party…" />{dayQ && <button type="button" onClick={() => setDayQ('')} aria-label="Clear"><X size={12} /></button>}</label>}
              {!sm && daySmIds.length > 1 && <select className="sel vc-dfsm" value={smPicked} onChange={e => setDayFilterSm(e.target.value)} title="Show one salesman">
                <option value="">All salesmen</option>
                {daySmIds.map(id => <option key={id} value={id}>{smName(id)}</option>)}
              </select>}
            </div>}
          </div>

          {dayPlans.length === 0 && dfKey !== 'unpl' && (
            <div className="vc-empty">
              <span className="sec-ico" style={{ '--tone': 'var(--t3)', width: 38, height: 38, borderRadius: 12 }}><CalendarDays size={18} /></span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t2)' }}>{mayAdd ? 'Nothing planned yet' : 'Nothing planned for this day'}</div>
              {mayAdd && <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Add dealers below.</div>}
            </div>
          )}
          {(dfKey !== 'all' || dqs) && shownPlans.length === 0 && shownUnplanned.length === 0 && (
            <div className="vc-dfnone">{dqs ? <>No party matching “{dayQ.trim()}”</> : <>Nothing under “{tr(DAY_FILTERS.find(f => f[0] === dfKey)[1])}”</>}{smPicked ? ' for ' + smName(smPicked) : ''} on this day. <button type="button" onClick={() => { setDayFilter('all'); setDayFilterSm(''); setDayQ(''); }}>Show all</button></div>
          )}
          <div className={'vc-daylist' + (shownPlans.length > 4 ? ' scroll' : '')}>
            {shownPlans.map(p => { const i = dayPlans.indexOf(p); return (
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
                      {(() => {
                        const dates = repeatOf.get(p.salesmanId + '|' + p.dealerId) || [];
                        if (dates.length < 2) return null;
                        const days = dates.map(d => Number(d.slice(-2)));
                        return <span className="vc-rep" title={'Planned on ' + dates.map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ')}>
                          <Repeat size={11} /> {dates.length}× in {month.toLocaleDateString('en-IN', { month: 'short' })} <span>· {days.map((d, x) => <React.Fragment key={x}>{x ? ', ' : ''}{dates[x] === p.date ? <u>{d}</u> : d}</React.Fragment>)}</span>
                        </span>;
                      })()}
                      {p.newParty && <><Badge tone="#d97706">New party</Badge><small className="vc-leadtag" title="Saved in Leads — becomes a dealer by itself once it starts buying">(lead)</small></>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {[p.zone, p.city].filter(Boolean).length > 0 && <span><MapPin size={10} style={{ verticalAlign: -1 }} /> {[p.zone, p.city].filter(Boolean).join(' · ')}</span>}
                      {p.newParty && p.party?.name && <span><MapPin size={10} style={{ verticalAlign: -1 }} /> {[p.party.city, p.party.state].filter(Boolean).join(', ')} · {p.party.noGst ? 'no GST' : 'GST ' + p.party.gst}{p.leadId ? ' · saved to Leads' : ''}</span>}
                      {p.newParty && !p.party?.name && <span>· not in the dealer list — details at check-out</span>}
                      {!sm && <span>· {p.salesmanName}</span>}
                      {p.accountStatus && p.accountStatus !== 'NONE' && <span>· {p.accountStatus}</span>}
                      {p.selfAdded ? <span>· added by {p.salesmanId === currentUser?.id ? 'you' : firstName(p.salesmanId)}</span> : p.plannedByName ? <span>· planned by {p.plannedByName.split(' ')[0]}</span> : null}
                    </div>
                    {mayPlan(p.salesmanId) && editing[p._id] !== undefined ? (
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
                      {mayPlan(p.salesmanId) && editing[p._id] === undefined && <button className="btn vc-ib" title="Edit the office note" onClick={() => setEditing(x => ({ ...x, [p._id]: p.note }))}><Pencil size={13} /></button>}
                      {mayPlan(p.salesmanId) && p.status !== 'DONE' && p.date > tdy && <button className="btn vc-ib" title="Replace with another dealer" style={replacing?._id === p._id ? { color: 'var(--acc)', borderColor: 'var(--acc)', background: 'var(--accL)' } : undefined} onClick={() => { setReplacing(r => r?._id === p._id ? null : p); setQ(''); }}><Repeat size={13} /></button>}
                      {mayPlan(p.salesmanId) && p.status !== 'DONE' && <button className="btn vc-ib" title="Mark visited" style={{ color: 'var(--grn)' }} onClick={() => act(() => api.updateVisitPlan(p._id, { status: 'DONE' }))}><CheckCircle2 size={13} /></button>}
                      {p.canRemove && <button className="btn vc-ib" title={canPlan ? 'Cancel this visit' : 'Remove (you added it)'} style={{ color: 'var(--red)' }} onClick={() => { if (window.confirm(`Remove ${p.dealerName} from ${fmtDay(day)}?`)) act(() => api.deleteVisitPlan(p._id)); }}><Trash2 size={13} /></button>}
                    </div>
                  </div>
                </div>
              </div>
            ); })}
          </div>

          {shownUnplanned.length > 0 && (
            <div className="vc-unpl">
              <div className="vc-unpl-t"><span>✱</span> {tr('Unplanned visits')} <b>{shownUnplanned.length}</b><em>{tr('visited without being on the calendar')}</em></div>
              {shownUnplanned.map(u0 => {
                // a check-in typed by name has no dealer link — find the dealer by name so its buttons still work
                const u = u0.dealerId ? u0 : { ...u0, dealerId: (() => { const n = String(u0.dealerName || '').toLowerCase().replace(/\s+/g, ' ').trim(); const d = (dealers || []).find(x => String(x.name || '').toLowerCase().replace(/\s+/g, ' ').trim() === n); return d ? (d._id || d.id) : ''; })() };
                return (
                <div key={u._id} className="vc-unpl-row">
                  <span className="ini" style={{ '--h': hue(u.dealerName), width: 32, height: 32, borderRadius: 10, fontSize: 11 }}>{inits(u.dealerName)}</span>
                  <div className="vc-unpl-info" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 750, color: 'var(--t1)', overflowWrap: 'anywhere', cursor: u.dealerId ? 'pointer' : undefined }} title={u.dealerId ? 'Open the dealer' : undefined} onClick={u.dealerId ? () => setOpen(u.dealerId) : undefined}>{u.dealerName}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>
                      {!sm && <>{u.salesmanName} · </>}{u.checkInTime ? 'in ' + new Date(u.checkInTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ''}{u.checkOutTime ? ' · out ' + new Date(u.checkOutTime).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : ''}{u.city ? ' · ' + u.city : ''}
                    </div>
                  </div>
                  <Badge tone={u.status === 'VISITED' ? 'var(--grn)' : u.status === 'ADDED' ? 'var(--t3)' : 'var(--yel)'}>{u.status === 'VISITED' ? 'Visited' : u.status === 'ADDED' ? (u.newParty ? 'New party' : 'Added') : 'In progress'}</Badge>{u.newParty && <small className="vc-leadtag" title="Saved in Leads — becomes a dealer by itself once it starts buying">(lead)</small>}
                  {u.walkInId && u.status !== 'VISITED' && u.salesmanId === currentUser?.id
                    ? <button className="btnp" title={u.status === 'ADDED' ? 'Check in — an unplanned visit' : 'Check out — fill the party details'} style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, marginLeft: 'auto' }} onClick={() => openCheckIn(u)}>{tr(u.status === 'ADDED' ? 'Visit' : 'Check out')} <ArrowRight size={13} /></button>
                    : u.dealerId && u.status !== 'VISITED' && <button className="btn vc-lb" title="Open the dealer: summary, check-in, MOM" onClick={() => setOpen(u.dealerId)}><ArrowRight size={13} /><span>{tr('Visit')}</span></button>}
                  {u.status === 'ADDED' && u.canRemove && <button className="btn vc-ib" title="Take it off today's list" style={{ color: 'var(--red)' }} disabled={busy} onClick={() => act(() => api.deleteVisitPlan(u.walkInId))}><Trash2 size={13} /></button>}
                </div>
                );
              })}
            </div>
          )}

          {full && (canPlan || !isStaff) && <div className="vc-note" style={{ '--tone': 'var(--red)' }}><AlertTriangle size={14} /> <span>Day full: {maxPerDay} dealers is the limit. {canPlan ? 'Replace one, or plan the next day.' : 'Pick another day.'}</span></div>}
          {pastDay && (canPlan || !isStaff) && <div className="vc-note" style={{ '--tone': 'var(--t3)' }}><Clock size={14} /> <span>This day is over. Plans start from tomorrow.</span></div>}
          {(mayAdd || walkIn) && (
            <div className="vc-add" style={replacing ? { borderColor: 'var(--acc)', background: 'color-mix(in srgb, var(--acc) 6%, var(--bg2))' } : undefined}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 800, color: replacing ? 'var(--acc)' : 'var(--t1)', marginBottom: 8, flexWrap: 'wrap' }}>
                <span className="sec-ico" style={{ '--tone': 'var(--acc)', width: 24, height: 24, borderRadius: 8 }}>{replacing ? <Repeat size={13} /> : <Plus size={13} />}</span>
                {replacing ? <>Replace {replacing.dealerName} with… <button className="btn" onClick={() => setReplacing(null)} style={{ fontSize: 11, padding: '2px 9px', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 3 }}><X size={11} /> cancel</button></>
                  : walkIn ? <>{tr('Unplanned visit')}<span style={{ fontWeight: 600, color: 'var(--t3)' }}> — today is not for planning; a dealer you visit now is recorded as an unplanned visit</span></>
                  : <>Add a dealer to {daySm ? (daySm === currentUser?.id ? 'your' : firstName(daySm) + "'s") : 'the'} day{!daySm && canPlan ? <span style={{ fontWeight: 600, color: 'var(--t3)' }}> — pick a salesman above first</span> : ''}</>}
              </div>
              <div className="inp" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', background: 'var(--bg1)' }}>
                <Search size={14} color="var(--t3)" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="dealer name — or type a new party's name" disabled={!daySm && !walkIn} style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', color: 'var(--t1)', fontSize: 13, outline: 'none', padding: 0 }} />
              </div>
              {!replacing && canPlan && !walkIn && <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="note for this visit — e.g. show Candid folder" disabled={!daySm} style={{ flex: 1, minWidth: 0, fontSize: 12.5, padding: '7px 10px', background: 'var(--bg1)' }} />
                {canPlan && <input className="inp" type="number" min="0" value={collect} onChange={e => setCollect(e.target.value)} placeholder="collect ₹" disabled={!daySm} title="Amount to collect on this visit" style={{ width: 110, flexShrink: 0, fontSize: 12.5, padding: '7px 10px', background: 'var(--bg1)' }} />}
              </div>}
              {canNewParty && walkIn && <button type="button" className="vc-new" disabled={busy} onClick={visitUnplannedNew} style={{ marginTop: 8 }}>
                <span className="sec-ico" style={{ '--tone': '#8b5cf6', width: 28, height: 28, borderRadius: 9 }}><Plus size={14} /></span>
                <span style={{ flex: 1, minWidth: 0 }}><b>Add “{typed}” — new party</b><small>goes on today's unplanned visits; tap Visit there to check in — name, GST, city and state are taken at check-out</small></span>
              </button>}
              {canNewParty && daySm && !walkIn && <button type="button" className="vc-new" disabled={busy} onClick={addNewParty} style={{ marginTop: 8 }}>
                <span className="sec-ico" style={{ '--tone': '#d97706', width: 28, height: 28, borderRadius: 9 }}><Plus size={14} /></span>
                <span style={{ flex: 1, minWidth: 0 }}><b>Plan “{typed}” as a new party</b><small>not in the dealer list — correct name, GST, city and state are taken at check-out</small></span>
              </button>}
              {pool.length > 0 && <div style={{ marginTop: 8, display: 'grid', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
                {pool.map(d => (
                  <div key={d._id || d.id} className={'vc-pick' + (busy ? ' off' : '')} role="button" tabIndex={0} title={walkIn ? 'Open and check in — an unplanned visit' : replacing ? 'Use this dealer' : 'Add to the day'}
                    onClick={() => { if (!busy) (walkIn ? visitUnplanned : add)(d); }} onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !busy) { e.preventDefault(); (walkIn ? visitUnplanned : add)(d); } }}>
                    <span className="ini" style={{ '--h': hue(d.name), width: 28, height: 28, borderRadius: 9, fontSize: 10.5 }}>{inits(d.name)}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                      <RepeatHint dates={repeatOf.get(daySm + '|' + (d._id || d.id)) || []} month={month.toLocaleDateString('en-IN', { month: 'short' })} />
                      <div style={{ color: 'var(--t3)', fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{[d.zone, d.city].filter(Boolean).join(' · ')}{d.salesman && d.salesman !== daySm ? ` · ${smName(d.salesman)}'s dealer` : ''}</div>
                    </span>
                    {replacing && <span className="vc-use"><Repeat size={12} /> Use</span>}
                    {walkIn && <span className="vc-use" style={{ color: '#8b5cf6' }}>{tr('Visit')} <ArrowRight size={12} /></span>}
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
                <th style={{ textAlign: 'left' }}>Salesman</th><th>Planned</th><th style={{ color: 'var(--grn)' }}>Visited</th><th style={{ color: 'var(--red)' }}>Not visited</th><th style={{ color: '#d97706' }}>Not visited today</th><th>Upcoming</th><th>Done %</th>
              </tr></thead>
              <tbody>{report.map(r => { const closed = r.visited + r.missed; const dp = closed ? Math.round(r.visited / closed * 100) : null; const dc = dp == null ? 'var(--t3)' : dp >= 80 ? 'var(--grn)' : dp >= 50 ? 'var(--yel)' : 'var(--red)'; return (
                <tr key={r.salesmanId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <span className="ini" style={{ '--h': (r.name || '?').charCodeAt(0) * 37 % 360 }}>{(r.name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                        <div className="vc-stack" title={`${r.visited} visited · ${r.missed} not visited · ${r.today} not visited today · ${r.upcoming} upcoming`}>
                          <div style={{ flex: r.visited, background: 'var(--grn)' }} /><div style={{ flex: r.missed, background: 'var(--red)' }} /><div style={{ flex: r.today, background: '#d97706' }} /><div style={{ flex: r.upcoming, background: 'var(--acc)' }} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className="vc-n">{r.planned}</span></td>
                  <td><span className="vc-n" style={{ '--tone': 'var(--grn)' }}>{r.visited}</span></td>
                  <td><span className="vc-n" style={r.missed ? { '--tone': 'var(--red)' } : { color: 'var(--t3)' }}>{r.missed}</span></td>
                  <td>{r.today ? <button type="button" className="vc-n vc-n-btn" style={{ '--tone': '#d97706' }} title="Planned today, not checked out yet — see the list below" onClick={() => todayListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>{r.today}</button> : <span className="vc-n" style={{ color: 'var(--t3)' }}>0</span>}</td>
                  <td style={{ color: 'var(--t3)' }}>{r.upcoming}</td>
                  <td style={{ minWidth: 84 }}><div style={{ fontWeight: 800, color: dc }}>{dp == null ? '—' : dp + '%'}</div>{closed > 0 && <div className="pbar"><div style={{ width: Math.min(dp, 100) + '%', background: dc }} /></div>}</td>
                </tr>); })}</tbody>
            </table>
          </div>
          {todayOpen.length > 0 && (
            <div style={{ marginTop: 14, scrollMarginTop: 12 }} ref={todayListRef}>
              <div className="sec-title" style={{ fontSize: 13.5, marginBottom: 8 }}>
                <span className="sec-ico" style={{ '--tone': '#d97706', width: 26, height: 26, borderRadius: 8 }}><Clock size={13} /></span> Not visited today
                <span className="count-pill" style={{ color: '#d97706', background: 'color-mix(in srgb, #d97706 12%, transparent)' }}>{todayOpen.length}</span>
                <span className="sec-note">Planned for today, no check-out yet. Still open — they count as not visited if the day ends without one.</span>
              </div>
              <div className="vc-missed">
                {todayOpen.map(p => (
                  <div key={p._id} className="att-card" style={{ '--tone': '#d97706', display: 'flex', gap: 10, alignItems: 'center', fontSize: 12.5, padding: '10px 12px 10px 16px', cursor: 'default' }}>
                    <span className="ini" style={{ '--h': hue(p.dealerName), width: 32, height: 32, borderRadius: 10 }}>{inits(p.dealerName)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <a href="#" onClick={e => { e.preventDefault(); if (!p.newParty) setOpen(p.dealerId); }} style={{ fontWeight: 750, color: 'var(--t1)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.dealerName}{p.newParty ? ' · new party' : ''}</a>
                      <div style={{ fontSize: 11, color: 'var(--t3)', display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ color: '#d97706', fontWeight: 700 }}><Clock size={10} style={{ verticalAlign: -1 }} /> Today</span>
                        {!sm && <span>· {p.salesmanName}</span>}
                        {p.note && <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>· {p.note}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                    {canPlan && futureDay && <button className="btne" title="Move to the selected day" style={{ fontSize: 11.5, padding: '4px 10px', flexShrink: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={() => act(() => api.updateVisitPlan(p._id, { date: day }))}><ArrowRight size={12} /> {fmtDay(day)}</button>}
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
        .vc-kpis { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
        .vck { position: relative; display: flex; align-items: center; gap: 12px; min-width: 0; padding: 14px 16px; border-radius: 16px; border: 1px solid color-mix(in srgb, var(--tone) 22%, var(--b1)); background: linear-gradient(135deg, color-mix(in srgb, var(--tone) 9%, var(--bg1)), var(--bg1) 70%); box-shadow: 0 1px 2px rgba(15,23,42,.04); }
        .vck.tap { cursor: pointer; transition: transform .12s, box-shadow .12s; }
        .vck.tap:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(15,23,42,.08); }
        .vck-ico { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; color: #fff; background: var(--tone); box-shadow: 0 4px 10px color-mix(in srgb, var(--tone) 35%, transparent); }
        .vck-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
        .vck-head { display: flex; align-items: baseline; gap: 6px; min-width: 0; white-space: nowrap; }
        .vck-n { font-size: 24px; font-weight: 850; line-height: 1; letter-spacing: -.02em; color: var(--tone); }
        .vck-of { font-size: 14px; font-weight: 700; color: var(--t3); }
        .vck-lbl { font-size: 13px; font-weight: 700; color: var(--t1); overflow: hidden; text-overflow: ellipsis; }
        .vck-sub { font-size: 11px; color: var(--t3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vck-go { color: var(--tone); opacity: .6; flex-shrink: 0; }
        .vc-leadtag { font-size: 10.5px; font-weight: 700; color: #8b5cf6; margin-left: 2px; }
        .vck-subrow { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .vck-pill { flex-shrink: 0; padding: 1px 8px; border-radius: 99px; border: 1px dashed color-mix(in srgb, var(--tone) 55%, transparent); background: color-mix(in srgb, var(--tone) 10%, var(--bg1)); color: var(--tone); font-size: 10.5px; font-weight: 800; cursor: pointer; white-space: nowrap; line-height: 1.5; }
        .vck-pill:hover { background: var(--tone); color: #fff; border-style: solid; }
        .vck-pct { margin-left: auto; font-size: 11px; font-weight: 800; color: var(--tone); background: color-mix(in srgb, var(--tone) 14%, transparent); padding: 1px 7px; border-radius: 99px; }
        .vck-top .vck-lbl { white-space: nowrap; }
        .vck-top { grid-column: span 2; align-items: stretch; }
        .vck-top .vck-ico { align-self: center; }
        .vck-top .vck-main { justify-content: center; }
        .vck-bar { height: 6px; border-radius: 99px; background: color-mix(in srgb, var(--tone) 14%, var(--b1)); overflow: hidden; }
        .vck-bar i { display: block; height: 100%; border-radius: 99px; background: var(--tone); }
        .vck-bar.sm { height: 4px; }
        .vck-tiers { display: grid; grid-template-columns: repeat(2, minmax(84px, 1fr)); gap: 6px 12px; padding-left: 12px; border-left: 1px dashed color-mix(in srgb, var(--tone) 30%, var(--b1)); align-content: center; }
        .vck-tier { display: grid; grid-template-columns: auto 1fr; align-items: baseline; gap: 2px 6px; font-size: 11px; }
        .vck-tier span { font-weight: 800; color: var(--t3); letter-spacing: .04em; }
        .vck-tier b { justify-self: end; color: var(--t1); font-variant-numeric: tabular-nums; }
        .vck-tier em { font-style: normal; font-weight: 600; color: var(--t3); }
        .vck-tier .vck-bar { grid-column: 1 / -1; }
        .vck-tier { cursor: pointer; border-radius: 6px; }
        .vck-tier:hover span { color: var(--tone); }
        .vckl-ov { z-index: 2100; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .vckl { width: min(640px, 100%); max-height: min(80vh, 720px); display: flex; flex-direction: column; background: var(--bg1); border: 1px solid var(--b2); border-radius: 18px; box-shadow: 0 24px 60px rgba(15,23,42,.28); overflow: hidden; }
        .vckl-h { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid var(--b1); background: linear-gradient(135deg, color-mix(in srgb, var(--tone) 12%, var(--bg1)), var(--bg1)); }
        .vckl-h b { font-size: 15px; color: var(--t1); }
        .vckl-n { font-size: 11px; font-weight: 800; color: var(--tone); background: color-mix(in srgb, var(--tone) 14%, transparent); padding: 1px 8px; border-radius: 99px; }
        .vckl-x { margin-left: auto; width: 30px; height: 30px; border-radius: 9px; border: 1px solid var(--b2); background: var(--bg1); color: var(--t2); display: grid; place-items: center; cursor: pointer; }
        .vckl-tabs { display: flex; flex-wrap: wrap; gap: 5px; padding: 8px 14px; border-bottom: 1px solid var(--b1); }
        .vckl-tabs button { padding: 3px 10px; border-radius: 99px; border: 1px solid var(--b2); background: var(--bg1); color: var(--t2); font-size: 11px; font-weight: 700; cursor: pointer; }
        .vckl-tabs button.on { background: var(--tone); border-color: var(--tone); color: #fff; }
        .vckl-s { display: flex; align-items: center; gap: 7px; margin: 10px 14px 6px; padding: 7px 10px; border: 1px solid var(--b2); border-radius: 10px; color: var(--t3); }
        .vckl-s input { flex: 1; min-width: 0; border: none; background: transparent; outline: none; color: var(--t1); font-size: 13px; }
        .vckl-list { overflow: auto; padding: 4px 8px 10px; }
        .vckl-row { display: flex; align-items: center; gap: 10px; padding: 9px 8px; border-radius: 10px; cursor: pointer; border-bottom: 1px solid var(--b1); }
        .vckl-row:hover { background: var(--bg2); }
        .vckl-t { flex-shrink: 0; font-size: 9.5px; font-weight: 800; color: var(--t); background: color-mix(in srgb, var(--t) 14%, transparent); padding: 2px 6px; border-radius: 6px; }
        .vckl-m { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .vckl-m b { font-size: 13px; color: var(--t1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vckl-m small { font-size: 11px; color: var(--t3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vckl-d { flex-shrink: 0; font-size: 11px; font-weight: 700; color: var(--t2); max-width: 30%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vckl-c { flex-shrink: 0; font-size: 10.5px; font-weight: 800; color: var(--c); background: color-mix(in srgb, var(--c) 12%, transparent); padding: 2px 8px; border-radius: 99px; }
        .vckl-none { padding: 24px; text-align: center; color: var(--t3); font-size: 13px; }
        @media (max-width: 600px) { .vckl-ov { padding: 0; align-items: flex-end; } .vckl { border-radius: 18px 18px 0 0; max-height: 88vh; } }
        .vc-kpi { min-width: 0; }
        .vc-grid { display: grid; grid-template-columns: 1fr; gap: 14px; min-width: 0; }
        .vc-grid > .card { min-width: 0; }
        @media (min-width: 980px) { .vc-grid { grid-template-columns: minmax(0, 1.55fr) minmax(320px, 1fr); align-items: start; } .vc-day { position: sticky; top: 12px; } }
        .vc-month { padding: 14px; }
        .vc-month-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .vc-mname { min-width: 92px; text-align: center; }
        .vc-mchev { width: 30px; height: 30px; }
        .vc-rep { display: inline-flex; align-items: center; gap: 4px; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 999px; color: #b45309; background: color-mix(in srgb, #f59e0b 16%, transparent); border: 1px solid color-mix(in srgb, #f59e0b 35%, transparent); white-space: nowrap; cursor: help; }
        .vc-views { display: inline-flex; gap: 2px; padding: 3px; border-radius: 11px; background: var(--bg2); border: 1px solid var(--b1); margin-left: 6px; }
        .vc-views button { border: 0; background: transparent; color: var(--t2); font-size: 12px; font-weight: 700; padding: 5px 11px; border-radius: 8px; cursor: pointer; }
        .vc-views button.on { background: var(--bg1); color: var(--acc); box-shadow: 0 1px 4px rgba(16,24,40,.12); }
        .vc-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
        .vc-wcol { min-width: 0; min-height: 220px; border: 1px solid var(--b1); border-radius: 12px; background: var(--bg1); padding: 7px; cursor: pointer; display: flex; flex-direction: column; gap: 6px; transition: border-color .15s, background .15s; outline: none; }
        .vc-wcol:hover { border-color: var(--b2); background: var(--bg2); }
        .vc-wcol.we { background: color-mix(in srgb, var(--bg2) 70%, transparent); }
        .vc-wcol.out { opacity: .7; }
        .vc-wcol.sel { border-color: var(--acc); box-shadow: 0 0 0 1px var(--acc); }
        .vc-whead { display: flex; align-items: baseline; gap: 5px; }
        .vc-whead span { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--t3); }
        .vc-whead b { font-size: 18px; font-weight: 850; color: var(--t1); }
        .vc-wcol.tod .vc-whead b { color: #fff; background: var(--acc); border-radius: 99px; min-width: 26px; height: 26px; display: inline-grid; place-items: center; font-size: 13px; }
        .vc-whead em { margin-left: auto; font-style: normal; font-size: 10.5px; font-weight: 800; color: var(--acc); background: color-mix(in srgb, var(--acc) 12%, transparent); padding: 0 7px; border-radius: 99px; }
        .vc-wlist { display: grid; gap: 4px; }
        .vc-wit { display: flex; align-items: center; gap: 5px; min-width: 0; padding: 4px 6px; border-radius: 7px; font-size: 11px; font-weight: 650; color: var(--t1); background: color-mix(in srgb, var(--tone) 11%, var(--bg1)); border-left: 3px solid var(--tone); }
        .vc-wit i { display: none; }
        .vc-wit span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vc-wit small { flex-shrink: 0; font-size: 9.5px; color: var(--t3); }
        .vc-wnone { font-size: 11px; color: var(--t3); text-align: center; padding-top: 6px; }
        .vc-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
        .vc-stripwrap { position: relative; display: flex; align-items: center; gap: 6px; min-width: 0; }
        .vc-stripwrap .vc-strip { flex: 1; min-width: 0; }
        .vc-sgo { flex-shrink: 0; width: 30px; height: 56px; border-radius: 10px; border: 1px solid var(--b2); background: var(--bg1); color: var(--t2); display: grid; place-items: center; cursor: pointer; }
        .vc-sgo:hover { color: var(--acc); border-color: var(--acc); }
        .vc-strip.scroll { display: flex; overflow-x: auto; scroll-snap-type: x proximity; padding: 2px 2px 6px; scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
        .vc-strip.scroll .vc-sday { flex: 0 0 76px; scroll-snap-align: center; position: relative; }
        .vc-sday.past { opacity: .6; }
        .vc-sday.past.sel { opacity: 1; }
        .vc-smon { position: absolute; top: -1px; left: 50%; transform: translate(-50%, -50%); font-style: normal; font-size: 9px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--acc); background: var(--bg1); padding: 0 5px; border-radius: 6px; border: 1px solid color-mix(in srgb, var(--acc) 30%, transparent); }
        .vc-sday { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 8px 2px; border-radius: 12px; border: 1px solid var(--b1); background: var(--bg1); cursor: pointer; color: var(--t1); min-width: 0; }
        .vc-sday span { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; color: var(--t3); }
        .vc-sday b { font-size: 18px; font-weight: 850; }
        .vc-sday em { font-style: normal; font-size: 9.5px; color: var(--t3); white-space: nowrap; }
        .vc-sday.we { background: color-mix(in srgb, var(--bg2) 70%, transparent); }
        .vc-sday.tod b { color: var(--acc); }
        .vc-sday.sel { background: var(--acc); border-color: var(--acc); color: #fff; }
        .vc-sday.sel span, .vc-sday.sel em, .vc-sday.sel b { color: #fff; }
        .vc-grid.dayview { grid-template-columns: 1fr !important; }
        .vc-grid.dayview .vc-day { position: static !important; }
        .vc-rep.sm { font-size: 10px; padding: 1px 7px; margin: 2px 0; align-self: flex-start; display: inline-block; max-width: 100%; white-space: normal; line-height: 1.35; }
        .vc-use { flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 800; color: var(--acc); }
        .vc-rep u { text-decoration: none; background: color-mix(in srgb, #f59e0b 30%, transparent); border-radius: 4px; padding: 0 3px; }
        .vc-planbtn { margin-left: 10px; display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; padding: 7px 13px; border-radius: 11px; }
        .vc-carry-s { display: none; }
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
        .vc-holwm { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; text-align: center; transform: rotate(-14deg); opacity: .2; color: var(--hol); z-index: 0; padding: 4px; overflow: hidden; }
        .vc-holwm b { font-size: 13px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; line-height: 1.1; }
        .vc-holwm span { font-size: 10px; font-weight: 800; line-height: 1.15; margin-top: 2px; }
        .vc-holwm.big b { font-size: 34px; }
        .vc-cell.hol, .vc-wcol.hol { background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--hol) 7%, var(--bg1)) 0 8px, var(--bg1) 8px 16px); border-color: color-mix(in srgb, var(--hol) 35%, var(--b1)); }
        .vc-cell.hol > *:not(.vc-holwm), .vc-wcol.hol > *:not(.vc-holwm) { position: relative; z-index: 1; }
        .vc-wcol { position: relative; overflow: hidden; }
        .vc-holtag { margin-top: auto; font-size: 10px; font-weight: 800; color: var(--hol); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 1px 6px; border-radius: 6px; background: color-mix(in srgb, var(--hol) 12%, var(--bg1)); align-self: flex-start; max-width: 100%; }
        .vc-holwarn { font-size: 11px; color: var(--hol, #e11d48); font-weight: 900; margin-left: 2px; }
        .vc-sday.hol { border-color: color-mix(in srgb, var(--hol) 45%, var(--b1)); background: color-mix(in srgb, var(--hol) 8%, var(--bg1)); }
        .vc-sday.hol em { color: var(--hol); font-weight: 800; }
        .vc-holbanner { position: relative; overflow: hidden; display: flex; align-items: center; gap: 10px; padding: 10px 12px; margin-bottom: 12px; border-radius: 12px; color: var(--hol); border: 1px dashed color-mix(in srgb, var(--hol) 55%, transparent); background: color-mix(in srgb, var(--hol) 8%, var(--bg1)); }
        .vc-holbanner > div:not(.vc-holwm) { display: flex; flex-direction: column; gap: 1px; font-size: 12px; position: relative; }
        .vc-holbanner > div:not(.vc-holwm) b { font-size: 13.5px; font-weight: 850; }
        .vc-holbanner > div:not(.vc-holwm) span { color: var(--t2); }
        .vc-holbanner .vc-holwm { justify-content: center; align-items: flex-end; padding-right: 14px; opacity: .1; }
        .vc-n-btn { border: none; cursor: pointer; font: inherit; }
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
        .vc-dfilter { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .vc-dfc { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: var(--t2); background: var(--bg2); border: 1px solid var(--b1); padding: 5px 11px; border-radius: 20px; cursor: pointer; white-space: nowrap; transition: background .15s, border-color .15s, color .15s; }
        .vc-dfc b { font-weight: 850; color: var(--tone); }
        .vc-dfc:hover { border-color: color-mix(in srgb, var(--tone) 45%, var(--b1)); }
        .vc-dfc.on { color: #fff; background: var(--tone); border-color: var(--tone); }
        .vc-dfc.on b { color: #fff; }
        .vc-dfsm { font-size: 12px; padding: 5px 10px; border-radius: 20px; width: auto; max-width: 160px; }
        .vc-dfq { display: inline-flex; align-items: center; gap: 6px; padding: 4px 9px; border: 1px solid var(--b2); border-radius: 20px; background: var(--bg1); color: var(--t3); flex: 1 1 150px; min-width: 130px; max-width: 240px; }
        .vc-dfq input { border: none; outline: none; background: transparent; color: var(--t1); font-size: 12px; width: 100%; min-width: 0; }
        .vc-dfq button { border: none; background: none; color: var(--t3); cursor: pointer; display: flex; padding: 0; }
        .vc-daylist { display: grid; gap: 8px; margin-bottom: 12px; }
        .vc-daylist.scroll { max-height: min(68vh, 760px); overflow-y: auto; overscroll-behavior: contain; padding-right: 4px; scrollbar-width: thin; }
        .vc-dfnone { font-size: 12.5px; color: var(--t3); padding: 14px; text-align: center; border: 1px dashed var(--b2); border-radius: 12px; margin-bottom: 12px; }
        .vc-dfnone button { background: none; border: none; color: var(--acc); font-weight: 800; cursor: pointer; padding: 0 4px; }
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
        .vc-pick { display: flex; gap: 9px; align-items: center; padding: 6px 8px; border-radius: 10px; background: var(--bg1); border: 1px solid var(--b1); transition: border-color .15s, background .15s; cursor: pointer; }
        .vc-pick:active:not(.off) { background: color-mix(in srgb, var(--acc) 8%, var(--bg1)); }
        .vc-pick.off { cursor: default; }
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
        @media (max-width: 1180px) { .vc-kpis { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 860px) { .vc-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .vck-top { grid-column: 1 / -1; } }
        @media (max-width: 600px) { .vc-sgo { display: none; } }
        @media (max-width: 600px) { .vck { padding: 11px 12px; gap: 10px; } .vck-ico { width: 34px; height: 34px; border-radius: 10px; } .vck-n { font-size: 20px; } .vck-lbl { font-size: 12px; } .vck-sub { font-size: 10.5px; } .vck-top { flex-wrap: wrap; } .vck-tiers { flex-basis: 100%; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 8px 0 0; border-left: 0; border-top: 1px dashed color-mix(in srgb, var(--tone) 30%, var(--b1)); gap: 4px 10px; } }
        @media (max-width: 600px) {
          .vc-views { margin-left: 0; }
          .vc-views button { padding: 4px 9px; font-size: 11.5px; }
          .vc-week { grid-template-columns: 1fr; gap: 5px; }
          .vc-wcol { min-height: 0; flex-direction: row; align-items: flex-start; gap: 10px; padding: 8px 10px; }
          .vc-whead { flex-direction: column; align-items: center; gap: 0; width: 38px; flex-shrink: 0; }
          .vc-whead em { margin: 2px 0 0; }
          .vc-wlist { flex: 1; min-width: 0; }
          .vc-strip { gap: 3px; }
          .vc-strip.scroll .vc-sday { flex-basis: 58px; }
          .vc-sday { padding: 6px 0; }
          .vc-sday b { font-size: 15px; }
          .vc-sday em { font-size: 8.5px; }
          .vc-dayhead { gap: 10px; }
          .vc-datebox { width: 44px; height: 46px; border-radius: 12px; }
          .vc-datebox span { font-size: 9px; }
          .vc-datebox b { font-size: 18px; }
          .vc-dayhead > div:nth-child(2) > div:first-child > span:first-child { font-size: 14.5px !important; }
          .vc-daystats { margin: 8px 0 !important; gap: 6px; }
          .vc-daystats .kpi-pill { font-size: 11px; padding: 3px 9px; }
          .vc-empty { flex-direction: row; justify-content: center; gap: 8px; padding: 10px; margin-bottom: 10px; }
          .vc-empty .sec-ico { width: 28px !important; height: 28px !important; border-radius: 9px !important; }
          .vc-empty .sec-ico svg { width: 14px; height: 14px; }
          .vc-empty > div { font-size: 12px !important; }
          .vc-carry { padding: 7px 10px; font-size: 11.5px; }
          .vc-carry-l { display: none; }
          .vc-carry-s { display: inline; }
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
      {planOpen && <PlanVisitDrawer dealers={dealers} plans={plansAll} day={day}
        setDay={d => { setDay(d); const x = new Date(d + 'T00:00:00'); if (x.getFullYear() !== month.getFullYear() || x.getMonth() !== month.getMonth()) setMonth(new Date(x.getFullYear(), x.getMonth(), 1)); }}
        salesmanId={isStaff ? (planFor && !planFor.includes(sm) ? (planFor[0] || '') : sm) : (currentUser?.id || '')} setSalesmanId={setSm}
        salesmen={planFor ? salesmen.filter(s => planFor.includes(s.id)) : salesmen} planFor={planFor} isStaff={isStaff} canPlan={canPlan} maxPerDay={maxPerDay}
        onChanged={load} onClose={() => setPlanOpen(false)} />}
      {carryOpen && <SamplesCarryModal date={day} salesmanId={daySm || ''} onClose={() => setCarryOpen(false)} />}
      {ciOpen && (
        <div className="overlay vc-ci-ov" onMouseDown={e => { if (e.target === e.currentTarget) closeCheckIn(); }}>
          <div className="vc-ci" role="dialog" aria-label={tr('Unplanned visit')}>
            <div className="vc-ci-h">
              <span className="sec-ico" style={{ '--tone': '#8b5cf6', width: 30, height: 30, borderRadius: 9 }}><ArrowRight size={15} /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div className="vc-ci-e">{tr('Unplanned visit')}</div><b>{ciOpen.dealerName}</b></div>
              <button className="pv-x" onClick={closeCheckIn} aria-label="Close"><X size={16} /></button>
            </div>
            <div className="vc-ci-b">
              <React.Suspense fallback={<div className="pv-msg" style={{ padding: 20 }}>Loading…</div>}>
                <VisitsPage dealers={dealers} users={users} currentUser={currentUser} />
              </React.Suspense>
            </div>
          </div>
        </div>
      )}
      {kList && <KpiList kList={kList} setKList={setKList} plans={plans} sm={sm} reach={reach} datesOf={datesOf} monthName={month.toLocaleDateString('en-IN', { month: 'long' })}
        onOpen={id => { setKList(null); setOpen(id); }}
        onGoDay={d => { setKList(null); pickStripDay(d); setTimeout(() => scrollToDay(), 80); }} />}
      {open && <DealerVisitModal dealerId={open} dealerName={plansAll.find(p => p.dealerId === open)?.dealerName || dealers.find(d => (d._id || d.id) === open)?.name || ''} onClose={() => { setOpen(null); load(); }} />}
    </div>
  );
}

// The dealers behind a summary card, in a pop-up: tap one to open it.
const isRouteName = n => { const t = String(n || '').trim(); return !t || t.startsWith('.') || /^new( dealer| party)?$/i.test(t); };
// "4, 14 Oct" — the days a dealer is planned, with the month so they never read as a count
const dayList = ps => ps.map(p => Number(p.date.slice(-2))).join(', ') + ' ' + new Date(ps[ps.length - 1].date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' });
const TIER_TONE = { STAR: '#f59e0b', 'KEY ACCOUNT': '#8b5cf6', ACHIEVER: '#10b981', REACTIVE: '#0ea5e9' };
const STATUS_TONE = { DONE: 'var(--grn)', PLANNED: 'var(--acc)', SKIPPED: 'var(--t3)' };
function KpiList({ kList, setKList, plans, sm, reach, datesOf, monthName, onOpen, onGoDay }) {
  const [q, setQ] = useState('');
  const [only, setOnly] = useState('all');          // top dealers: all | planned | not
  useEffect(() => { const k = e => { if (e.key === 'Escape') setKList(null); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [setKList]);
  const vis = plans.filter(p => !sm || p.salesmanId === sm);
  const short = d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  let title = '', tone = 'var(--acc)', rows = [];
  if (kList.kind === 'planned' || kList.kind === 'visited') {
    const list = kList.kind === 'visited' ? vis.filter(p => p.status === 'DONE') : vis;
    title = kList.kind === 'visited' ? `Visited in ${monthName}` : `Planned visits in ${monthName}`; tone = kList.kind === 'visited' ? 'var(--grn)' : 'var(--acc)';
    rows = [...list].sort((a, b) => a.date.localeCompare(b.date) || (a.dealerName || '').localeCompare(b.dealerName || '')).map(p => ({
      key: p._id, id: p.dealerId, goDay: p.date, name: p.dealerName, sub: [p.city, p.zone].filter(Boolean).join(' · '), date: short(p.date),
      chip: p.status === 'DONE' ? 'Visited' : p.missed ? 'Not visited' : 'Planned', chipTone: p.missed ? 'var(--red)' : STATUS_TONE[p.status] || 'var(--acc)' }));
  } else if (kList.kind === 'new') {
    title = `New parties planned in ${monthName}`; tone = '#8b5cf6';
    // one row per party name (the same party planned twice is one lead), route names left out
    const byName = new Map();
    for (const [, ps] of datesOf) for (const p of ps) { if (!p.newParty || isRouteName(p.dealerName)) continue; const k = String(p.dealerName).trim().toLowerCase(); (byName.get(k) || byName.set(k, []).get(k)).push(p); }
    const t0 = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
    rows = [...byName.entries()].map(([k, ps]) => { ps.sort((a, b) => a.date.localeCompare(b.date)); return [k, ps]; }).map(([id, ps]) => ({ key: id, id: '', goDay: (ps.find(p => p.date >= t0) || ps[0]).date, name: ps[0].dealerName, sub: (ps[0].salesmanName || '') + (ps.some(p => p.status === 'DONE') ? ' · visited' : ''),
      date: dayList(ps), chip: ps.some(p => p.status === 'DONE') ? 'Visited' : 'New party', chipTone: ps.some(p => p.status === 'DONE') ? 'var(--grn)' : '#8b5cf6' })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (kList.kind === 'parties') {
    title = `Parties planned in ${monthName}`; tone = '#8b5cf6';
    rows = [...datesOf.entries()].map(([id, ps]) => ({ key: id, id, name: ps[0].dealerName, sub: [ps[0].city, ps[0].zone].filter(Boolean).join(' · '),
      date: dayList(ps), chip: ps.length > 1 ? ps.length + '×' : '1×', chipTone: '#8b5cf6' })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    title = (kList.tier || 'Top dealers') + ` · ${monthName}`; tone = TIER_TONE[kList.tier] || '#f59e0b';
    rows = reach.mine.filter(d => { const st = String(d.status || '').trim().toUpperCase(); return kList.tier ? st === kList.tier : TIER_TONE[st]; })
      .map(d => { const id = String(d._id || d.id), ps = datesOf.get(id) || []; const st = String(d.status || '').trim().toUpperCase();
        return { key: id, id, name: d.name, sub: [d.city, d.zone].filter(Boolean).join(' · '), tier: st, planned: ps.length > 0,
          date: ps.length ? dayList(ps) : '', chip: ps.length ? ps.length + '× planned' : 'Not planned', chipTone: ps.length ? 'var(--grn)' : 'var(--red)' }; })
      .filter(r => only === 'all' || (only === 'planned' ? r.planned : !r.planned))
      .sort((a, b) => (a.planned - b.planned) || (a.name || '').localeCompare(b.name || ''));
  }
  const s = q.trim().toLowerCase();
  const shown = s ? rows.filter(r => (r.name || '').toLowerCase().includes(s) || (r.sub || '').toLowerCase().includes(s)) : rows;
  return (
    <div className="overlay vckl-ov" onMouseDown={e => { if (e.target === e.currentTarget) setKList(null); }}>
      <div className="vckl" style={{ '--tone': tone }} role="dialog" aria-label={title}>
        <div className="vckl-h">
          <b>{title}</b><span className="vckl-n">{shown.length}</span>
          <button className="vckl-x" onClick={() => setKList(null)} aria-label="Close"><X size={16} /></button>
        </div>
        {kList.kind === 'top' && <div className="vckl-tabs">
          {[['', 'All'], ...Object.keys(TIER_TONE).map(k => [k, k === 'KEY ACCOUNT' ? 'KEY' : k])].map(([k, l]) =>
            <button key={k || 'all'} className={kList.tier === k ? 'on' : ''} onClick={() => setKList({ kind: 'top', tier: k })}>{l}</button>)}
          <span style={{ flex: 1 }} />
          {[['all', 'All'], ['planned', 'Planned'], ['not', 'Not planned']].map(([k, l]) => <button key={k} className={only === k ? 'on' : ''} onClick={() => setOnly(k)}>{l}</button>)}
        </div>}
        <div className="vckl-s"><Search size={14} /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="dealer, city or zone…" /></div>
        <div className="vckl-list">
          {shown.map(r => (
            <div key={r.key} className="vckl-row" role="button" tabIndex={0} title={r.id && !String(r.id).startsWith('new:') ? 'Open the dealer' : r.goDay ? 'Open this day on the calendar' : ''}
              onClick={() => { if (r.id && !String(r.id).startsWith('new:')) onOpen(r.id); else if (r.goDay) onGoDay(r.goDay); }}>
              {r.tier && <span className="vckl-t" style={{ '--t': TIER_TONE[r.tier] }}>{r.tier === 'KEY ACCOUNT' ? 'KEY' : r.tier}</span>}
              <span className="vckl-m"><b>{r.name}</b>{r.sub && <small>{r.sub}</small>}</span>
              {r.date && <span className="vckl-d">{r.date}</span>}
              <span className="vckl-c" style={{ '--c': r.chipTone }}>{r.chip}</span>
            </div>
          ))}
          {!shown.length && <div className="vckl-none">Nothing here.</div>}
        </div>
      </div>
    </div>
  );
}
