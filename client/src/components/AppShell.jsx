import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Home, CalendarCheck, CalendarDays, Plus, Menu, X, MapPin, HandCoins, PhoneCall, UserPlus, Search,
  UploadCloud, Plane, LifeBuoy, Target, Landmark, Users, Sparkles, ClipboardList, Package, TrendingUp, Boxes, PackageX, Zap, Languages,
} from 'lucide-react';
import { monthTarget } from '../utils';
import { CountUp } from './UI';
import { useT, LANGS } from '../i18n';

/**
 * The app shell a phone app has, on the web and in the APK:
 *
 *   <BottomNav/>     five tabs on a phone — Home · Today · [+] · Visits · More
 *   <QuickFab/>      the round + on a computer (bottom right)
 *   <QuickSheet/>    what + opens: the everyday actions, each one going
 *                    straight to the form or the page it names
 *   <HomeHero/>      the greeting card and quick actions on top of Home
 *
 * Every action is filtered by `can(pageId)` — the same page permissions as
 * the side menu — so nobody is offered a button that leads to a refusal.
 */

// Ask the Collections module to open one of its forms once it is on screen.
export const requestQuickForm = form => {
  try { sessionStorage.setItem('stp_quick', form); } catch {}
  window.dispatchEvent(new CustomEvent('stp:quick', { detail: form }));
};

/** The everyday actions, in order of how often a field team needs them. */
export function quickActions({ can, navigate, onAddDealer, onStock, role, t = s => s }) {
  const staff = ['admin', 'superadmin', 'employee'].includes(role);
  const list = [
    { key: 'dealer',   label: 'Find a dealer',   hint: 'Search a dealer and see the summary',     icon: Search,       tone: '#334155', page: 'dealers',    go: () => navigate('dealers') },
    { key: 'stock',    label: 'Check stock',     hint: 'Available quantity, live from Tally', icon: Boxes,       tone: '#059669', page: null,         go: () => onStock?.(), needs: onStock },
    { key: 'plan',     label: 'My visit calendar', hint: staff ? 'Plan which dealers each salesman visits' : 'Dealers planned for your days',          icon: CalendarDays, tone: '#7c3aed', page: 'calendar',   go: () => navigate('calendar') },
    { key: 'today',    label: 'Collections today', hint: 'Dealers to collect money from today',   icon: CalendarCheck,tone: '#0891b2', page: 'colToday',   go: () => navigate('colToday') },
    { key: 'discontinued', label: 'Discontinued stock', hint: 'Discontinued designs still in stock — sell these first', icon: PackageX, tone: '#dc2626', page: null, go: () => onStock?.('discontinued'), needs: onStock },
    { key: 'checkin',  label: 'Unplanned visit', hint: 'Visiting a dealer not on your calendar — check in here', icon: Zap,       tone: '#2563eb', page: 'visits',     go: () => navigate('visits') },
    { key: 'payment',  label: 'Record payment',  hint: 'Money a dealer paid',          icon: HandCoins,    tone: '#059669', page: 'colPayments', go: () => { navigate('colToday'); requestQuickForm('payment'); } },
    { key: 'followup', label: 'Add follow-up',   hint: 'Call, promise, next date',     icon: PhoneCall,    tone: '#d97706', page: 'colFollowups', go: () => { navigate('colToday'); requestQuickForm('followup'); } },
    { key: 'lead',     label: 'New lead',        hint: 'A prospect worth chasing',     icon: Sparkles,     tone: '#db2777', page: 'leads',      go: () => navigate('leads') },
    { key: 'incentive',label: 'My incentive',    hint: 'What this month earns',        icon: Target,       tone: '#16a34a', page: 'salesIncentive', go: () => navigate('salesIncentive') },
    { key: 'add',      label: 'Add dealer',      hint: 'A new counter',                icon: UserPlus,     tone: '#2563eb', page: 'dealers',    go: () => onAddDealer?.(), staffOnly: true },
    { key: 'upload',   label: 'Upload statement',hint: "Today's Tally outstanding",    icon: UploadCloud,  tone: '#0f766e', page: 'colImports', go: () => navigate('colImports') },
    { key: 'samples',  label: 'Samples',         hint: 'Stock and who has what',       icon: Package,      tone: '#b45309', page: 'admin',      go: () => navigate('admin'), staffOnly: true },
    { key: 'leave',    label: 'Apply leave',     hint: 'Days off, with approval',      icon: Plane,        tone: '#0284c7', page: 'leaves',     go: () => navigate('leaves') },
    { key: 'support',  label: 'Get help',        hint: 'Raise a support ticket',       icon: LifeBuoy,     tone: '#64748b', page: 'tickets',    go: () => navigate('tickets') },
  ];
  return list.filter(a => (a.page === null ? !!a.needs : can(a.page)) && (!a.staffOnly || staff))
    .map(a => ({ ...a, label: t(a.label), hint: t(a.hint) }));
}

function ActionTile({ a, onPick, compact }) {
  const Icon = a.icon;
  return (
    <button className="qa-tile" onClick={() => onPick(a)} title={a.hint}>
      <span className="qa-ico" style={{ '--qa': a.tone }}><Icon size={compact ? 19 : 21} /></span>
      <span className="qa-lbl">{a.label}</span>
      {!compact && <span className="qa-hint">{a.hint}</span>}
    </button>
  );
}

/** What the + opens: a bottom sheet on a phone, a floating panel on a computer. */
export function QuickSheet({ open, onClose, actions }) {
  const { t: tr } = useT();
  useEffect(() => {
    if (!open) return;
    const k = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="qa-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qa-sheet" role="dialog" aria-label="Quick actions">
        <div className="qa-grab" />
        <div className="qa-head">
          <div><div className="qa-title">{tr('Quick actions')}</div><div className="qa-sub">What do you want to do?</div></div>
          <button className="qa-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="qa-grid">
          {actions.map(a => <ActionTile key={a.key} a={a} onPick={x => { onClose(); x.go(); }} />)}
        </div>
      </div>
    </div>
  );
}

/** Five tabs on a phone. The middle + is the quick-action button. */
export function BottomNav({ screen, can, navigate, onPlus, onMore }) {
  const { t: tr } = useT();
  const pick = ids => ids.find(id => can(id));
  const todayId = pick(['colToday', 'followups', 'dealers']);
  const visitId = pick(['calendar', 'visits', 'leads']);   // the visit calendar first; unplanned visits sit in quick actions
  const tabs = [
    { id: 'overview', label: 'Home', icon: Home },
    todayId && { id: todayId, label: todayId === 'colToday' ? 'Collections' : todayId === 'followups' ? 'Follow-ups' : 'Dealers', icon: todayId === 'colToday' ? HandCoins : todayId === 'dealers' ? Users : CalendarCheck },
    { plus: true },
    visitId && { id: visitId, label: visitId === 'calendar' ? 'My calendar' : visitId === 'visits' ? 'Unplanned' : 'Leads', icon: visitId === 'calendar' ? CalendarDays : visitId === 'leads' ? Sparkles : ClipboardList },
    { more: true, label: 'More', icon: Menu },
  ].filter(Boolean);
  return (
    <nav className="bn" aria-label="Main">
      {tabs.map((t, i) => t.plus ? (
        <div key="plus" className="bn-plus-wrap"><button className="bn-plus" onClick={onPlus} aria-label="Quick actions"><Plus size={26} strokeWidth={2.6} /></button></div>
      ) : (
        <button key={t.id || t.label} className={'bn-tab' + (t.id && screen === t.id ? ' on' : '')} onClick={() => t.more ? onMore() : navigate(t.id)}>
          <t.icon size={21} strokeWidth={screen === t.id ? 2.4 : 2} />
          <span>{tr(t.label)}</span>
        </button>
      ))}
    </nav>
  );
}

/** The round + on a computer. */
export function QuickFab({ onClick }) {
  return <button className="qa-fab" onClick={onClick} title="Quick actions" aria-label="Quick actions"><Plus size={24} strokeWidth={2.6} /></button>;
}

// Short lines for the field team under "Home" — a new one every few seconds,
// and each day starts somewhere different.
const QUOTES = [
  'Every visit can be an order.',
  'One more call, one more order.',
  'Trust sells. Show up today.',
  'Small follow-ups close big deals.',
  'Win today, win the month.',
  'Wake one dormant dealer today.',
  'Ask for the order. Always.',
  'Collect today, celebrate later.',
  'Listen first, then sell.',
  'Consistency beats luck.',
  "Every 'no' brings a 'yes' closer.",
  'Plan 5 visits, make 5 chances.',
  'Follow-up is where sales close.',
  'Effort today, incentive tomorrow.',
  'Be the rep dealers call first.',
  'Show the sample, share the value.',
  'A happy dealer brings two more.',
  'Keep moving, numbers follow.',
  'Aaj ki mehnat, kal ki kamai.',
  'Har visit ek naya order.',
  'Target bada, aap usse bade.',
];
export function DailyQuote({ every = 9000 }) {
  const { t: tr, lang } = useT();
  const start = useMemo(() => Math.floor(Date.now() / 86400000) % QUOTES.length, []);
  const [i, setI] = useState(start);
  const ref = useRef(null);
  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % QUOTES.length), every);
    return () => clearInterval(t);
  }, [every]);
  // Shrink the text until it sits on one line (14px down to 11px); only the
  // narrowest phones fall back to two lines.
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const fit = () => {
      const txt = el.querySelector('.tb-quote-t'); if (!txt) return;
      el.classList.remove('wrap');
      let size = 14;
      el.style.fontSize = size + 'px';
      while (size > 11 && txt.scrollWidth > txt.clientWidth + 1) { size -= 0.5; el.style.fontSize = size + 'px'; }
      if (txt.scrollWidth > txt.clientWidth + 1) el.classList.add('wrap');
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [i, lang]);
  return <span ref={ref} className="tb-quote" key={i + lang} title={tr(QUOTES[i])}><Sparkles size={14} className="tb-quote-ico"/><span className="tb-quote-t">{tr(QUOTES[i])}</span></span>;
}

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const inr = n => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
const num = n => Math.round(Number(n) || 0).toLocaleString('en-IN');

/**
 * Top of Home: who you are, the month at a glance, and the everyday actions.
 * The figures come from the dealers already loaded for the Overview.
 */
export function HomeHero({ user, dealers = [], monthLabel, monthIdx, actions, onPlus }) {
  const { t: tr } = useT();
  const stats = useMemo(() => {
    let target = 0, achieved = 0, active = 0;
    for (const d of dealers) {
      // the same figures the Overview adds up
      const t = Number(monthTarget(d, monthIdx)) || 0;
      const a = Number(Array.isArray(d.months) ? d.months[monthIdx] : 0) || 0;
      target += t; achieved += a; if (a > 0) active++;
    }
    return { target, achieved, active, total: dealers.length, pct: target > 0 ? Math.round(achieved / target * 100) : null };
  }, [dealers, monthLabel, monthIdx]);
  const first = String(user?.name || '').split(' ')[0] || 'there';
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const ring = Math.max(0, Math.min(100, stats.pct ?? 0));
  // Each person picks the shortcuts they use most (kept on this device).
  const available = actions || [];
  const pinKey = 'stp_qa_pins_' + (user?.id || '');
  const [pins, setPins] = useState(() => { try { const v = JSON.parse(localStorage.getItem(pinKey) || 'null'); return Array.isArray(v) ? v : null; } catch { return null; } });
  const [editQa, setEditQa] = useState(false);
  const current = (pins || available.slice(0, 8).map(a => a.key)).filter(k => available.some(a => a.key === k));
  const savePins = next => { setPins(next); try { next ? localStorage.setItem(pinKey, JSON.stringify(next)) : localStorage.removeItem(pinKey); } catch {} };
  const togglePin = key => savePins(current.includes(key) ? current.filter(k => k !== key) : current.length >= 8 ? current : [...current, key]);
  const tiles = current.map(k => available.find(a => a.key === k)).filter(Boolean).slice(0, 8);
  return (
    <div className="hh fade">
      <div className="hh-card">
        <span className="hh-orb o1"/><span className="hh-orb o2"/><span className="hh-shine"/>
        <div className="hh-top">
          <div style={{ minWidth: 0 }}>
            <div className="hh-date">{today}</div>
            <div className="hh-hello">{tr(greeting())}, {first}</div>
            <div className="hh-sub">{monthLabel ? `${monthLabel} · ${num(stats.total)} ${tr('dealers in your book')}` : `${num(stats.total)} ${tr('dealers in your book')}`}</div>
            {/* Home's Overview drops the "sales data uploaded" stamp in here */}
            <div id="hh-stamp-slot"/>
          </div>
          <div className="hh-ring" style={{ '--p': ring }} title="Target achieved this month">
            <div><b>{stats.pct === null ? '—' : <><CountUp value={stats.pct}/>%</>}</b><span>{tr('of target')}</span></div>
          </div>
        </div>
        <div className="hh-kpis">
          <div><span>{tr('Achieved')}</span><b><CountUp value={stats.achieved}/></b></div>
          <div><span>{tr('Target')}</span><b><CountUp value={stats.target}/></b></div>
          <div><span>{tr('Active dealers')}</span><b><CountUp value={stats.active}/></b></div>
        </div>
      </div>
      {available.length > 0 && (
        <div className={'card hh-actions' + (editQa ? ' editing' : '')}>
          <div className="hh-actions-head">
            <b>{tr(editQa ? 'Pick your shortcuts' : 'Quick actions')}</b>
            {editQa
              ? <><span className="hh-qa-n">{current.length}/8</span>
                  <button className="hh-all" style={{ marginLeft: 8, color: 'var(--t3)' }} onClick={() => savePins(null)}>{tr('Reset')}</button>
                  <button className="hh-all" style={{ marginLeft: 12 }} onClick={() => setEditQa(false)}>{tr('Done')}</button></>
              : <><button className="hh-all" onClick={() => setEditQa(true)} title="Choose which shortcuts show here">{tr('Customise')}</button>
                  <button className="hh-all" style={{ marginLeft: 12 }} onClick={onPlus}>{tr('See all')}</button></>}
          </div>
          {editQa ? (
            <div className="hh-grid">
              {available.map(a => {
                const n = current.indexOf(a.key);
                return (
                  <div key={a.key} className={'hh-pick' + (n >= 0 ? ' on' : '')}>
                    <ActionTile a={a} compact onPick={x => togglePin(x.key)} />
                    {n >= 0 && <span className="hh-pick-n">{n + 1}</span>}
                  </div>
                );
              })}
            </div>
          ) : tiles.length > 0 ? (
            <div className="hh-grid">
              {tiles.map(a => <ActionTile key={a.key} a={a} compact onPick={x => x.go()} />)}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: 'var(--t3)', padding: '8px 2px' }}>No shortcuts picked — tap Customise to add some.</div>
          )}
        </div>
      )}
    </div>
  );
}

/** Top-bar language picker: English, Hindi, Tamil, Telugu, Kannada. */
export function LangPicker() {
  const { lang, setLang, t: tr } = useT();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 56, right: 8 });
  const btn = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = e => { if (!e.target.closest?.('.lp-menu') && !e.target.closest?.('.lp-btn')) setOpen(false); };
    const esc = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', off); window.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', off); window.removeEventListener('keydown', esc); };
  }, [open]);
  const cur = LANGS.find(l => l.code === lang) || LANGS[0];
  return (
    <>
      <button ref={btn} className={'lp-btn' + (open ? ' on' : '')} title={tr('Language')} aria-label={tr('Language')}
        onClick={() => { const r = btn.current?.getBoundingClientRect(); if (r) setPos({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) }); setOpen(o => !o); }}>
        <Languages size={15}/><span>{cur.short}</span>
      </button>
      {open && (
        <div className="lp-menu" style={{ top: pos.top, right: pos.right }} role="menu">
          <div className="lp-head">{tr('Language')}</div>
          {LANGS.map(l => (
            <button key={l.code} role="menuitemradio" aria-checked={l.code === lang} className={'lp-item' + (l.code === lang ? ' on' : '')}
              onClick={() => { setLang(l.code); setOpen(false); }}>
              <span className="lp-short">{l.short}</span><span className="lp-name">{l.label}</span>{l.code === lang && <span className="lp-tick">✓</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
