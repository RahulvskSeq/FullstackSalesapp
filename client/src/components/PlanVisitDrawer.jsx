import React, { useEffect, useMemo, useState } from 'react';
import { X, Search, Plus, Trash2, CalendarPlus, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { useT } from '../i18n';

// "Plan a visit": every dealer on the right; tap + and the dealer drops into the day's
// plan at the bottom. The day holds at most `maxPerDay` visits per salesman.
const TIERS = ['STAR', 'KEY ACCOUNT', 'ACHIEVER'];
const TIER_TONE = { STAR: '#f59e0b', 'KEY ACCOUNT': '#8b5cf6', ACHIEVER: '#10b981' };
const todayYmd = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const fmtDay = ymd => new Date(ymd + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const LIMIT = 80;

export default function PlanVisitDrawer({ dealers = [], plans = [], day, setDay, salesmanId, setSalesmanId, salesmen = [], isStaff, canPlan, maxPerDay = 8, onChanged, onClose }) {
  const { t: tr } = useT();
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('');
  const [notMetOnly, setNotMetOnly] = useState(false);
  const [cov, setCov] = useState(null);          // dealerId -> 'MET' | 'PLANNED_ONLY' | 'NOT_MET'
  const [busyId, setBusyId] = useState('');
  const [err, setErr] = useState('');
  const [justAdded, setJustAdded] = useState('');
  const [more, setMore] = useState(false);

  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  // who was met this month, so the office can plan the top dealers nobody has seen
  useEffect(() => {
    setCov(null);
    if (!salesmanId && isStaff) return;
    api.visitCoverage(day.slice(0, 7), salesmanId).then(r => setCov(Object.fromEntries((r.rows || []).map(x => [x.id, x.status])))).catch(() => setCov({}));
  }, [day.slice(0, 7), salesmanId]); // eslint-disable-line react-hooks/exhaustive-deps

  const past = day < todayYmd();
  const dayPlans = plans.filter(p => p.date === day && (!salesmanId || p.salesmanId === salesmanId));
  const full = !!salesmanId && dayPlans.length >= maxPerDay;
  const mayPlan = !!salesmanId && (canPlan || !past);
  const onDay = new Set(dayPlans.map(p => p.dealerId));

  const pool = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rank = d => { const i = TIERS.indexOf(d.status); return i >= 0 ? i : 3; };
    // a salesman plans his own dealers; the office sees the chosen salesman's first, then everyone else's
    return dealers
      .filter(d => (canPlan || d.salesman === salesmanId))
      .filter(d => !onDay.has(d._id || d.id))
      .filter(d => !tier || d.status === tier)
      .filter(d => !notMetOnly || (cov && cov[d._id || d.id] === 'NOT_MET'))
      .filter(d => !s || (d.name || '').toLowerCase().includes(s) || (d.city || '').toLowerCase().includes(s) || (d.zone || '').toLowerCase().includes(s))
      .sort((a, b) => ((a.salesman === salesmanId ? 0 : 1) - (b.salesman === salesmanId ? 0 : 1)) || rank(a) - rank(b) || (a.name || '').localeCompare(b.name || ''));
  }, [dealers, q, tier, notMetOnly, cov, salesmanId, canPlan, dayPlans.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = more ? pool : pool.slice(0, LIMIT);

  const run = async (id, fn) => { setBusyId(id); setErr(''); try { await fn(); await onChanged?.(); } catch (e) { setErr(e?.message || 'Could not do that'); } finally { setBusyId(''); } };
  const add = d => run(d._id || d.id, async () => {
    await api.addVisitPlan({ date: day, salesmanId, dealerId: d._id || d.id, note: '', collectTarget: 0 });
    setJustAdded(d._id || d.id);
  });
  const typed = q.replace(/\s+/g, ' ').trim();
  const exact = typed && dealers.some(d => (d.name || '').replace(/\s+/g, ' ').trim().toLowerCase() === typed.toLowerCase());
  const addNew = () => run('new', async () => { await api.addVisitPlan({ date: day, salesmanId, newPartyName: typed, note: '', collectTarget: 0 }); setQ(''); });
  const remove = p => run(p._id, () => api.deleteVisitPlan(p._id));

  return (
    <div className="overlay pv-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="pv" role="dialog" aria-label={tr('Plan a visit')}>
        <div className="pv-head">
          <span className="pv-ico"><CalendarPlus size={18} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pv-eyebrow">{tr('Plan a visit')}</div>
            <div className="pv-title">{fmtDay(day)}{salesmanId ? ` · ${salesmen.find(s => s.id === salesmanId)?.name || ''}` : ''}</div>
          </div>
          <button className="pv-x" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="pv-ctl">
          <input type="date" className="inp" value={day} onChange={e => e.target.value && setDay(e.target.value)} />
          {isStaff && <select className="sel" value={salesmanId} onChange={e => setSalesmanId(e.target.value)}><option value="">Pick a salesman…</option>{salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
        </div>
        {salesmanId && <div className={'pv-cap' + (full ? ' full' : '')}>
          <div><b>{dayPlans.length} / {maxPerDay}</b> planned{full ? ' — the day is full' : ` · ${maxPerDay - dayPlans.length} more can go on this day`}</div>
          <div className="pv-bar"><i style={{ width: Math.min(100, dayPlans.length / maxPerDay * 100) + '%' }} /></div>
        </div>}
        {!salesmanId && <div className="pv-msg">Pick a salesman to plan his day.</div>}
        {salesmanId && past && !canPlan && <div className="pv-msg">This day is over — pick today or a later day.</div>}
        {err && <div className="pv-msg bad"><AlertTriangle size={13} /> {err}</div>}

        <div className="pv-search"><Search size={14} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="dealer, city or zone…" /></div>
        <div className="pv-chips">
          {['', ...TIERS].map(t => <button key={t || 'all'} className={tier === t ? 'on' : ''} onClick={() => setTier(t)}>{t || 'All'}</button>)}
          <button className={'nm' + (notMetOnly ? ' on' : '')} disabled={!cov} onClick={() => setNotMetOnly(v => !v)} title="Top dealers nobody met this month">Not met this month</button>
        </div>

        <div className="pv-list">
          {mayPlan && typed.length >= 3 && !exact && <button className="pv-new" disabled={full || !!busyId} onClick={addNew}><Plus size={14} /> Plan “{typed}” as a new party</button>}
          {shown.map(d => { const id = d._id || d.id; const nm = cov && cov[id] === 'NOT_MET'; return (
            <div key={id} className="pv-row">
              <span className="pv-tier" style={{ '--tone': TIER_TONE[d.status] || 'var(--t3)' }}>{TIERS.includes(d.status) ? (d.status === 'KEY ACCOUNT' ? 'KEY' : d.status) : '—'}</span>
              <span className="pv-main">
                <b>{d.name}</b>
                <small><MapPin size={10} /> {[d.zone, d.city].filter(Boolean).join(' · ') || 'no zone'}{canPlan && d.salesman && d.salesman !== salesmanId ? ` · ${salesmen.find(s => s.id === d.salesman)?.name || d.salesman}'s dealer` : ''}{nm ? ' · not met this month' : ''}</small>
              </span>
              <button className="btnp pv-add" disabled={!mayPlan || full || !!busyId} onClick={() => add(d)}>{busyId === id ? '…' : <><Plus size={13} /> Add</>}</button>
            </div>); })}
          {!shown.length && <div className="pv-msg">{notMetOnly ? 'Every top dealer was met or planned this month.' : 'No dealer matches.'}</div>}
          {!more && pool.length > LIMIT && <button className="btn pv-more" onClick={() => setMore(true)}>Show all {pool.length} dealers</button>}
        </div>

        <div className="pv-day">
          <div className="pv-day-h"><CheckCircle2 size={14} /> Planned for {fmtDay(day)} <span>{dayPlans.length}</span></div>
          {dayPlans.length ? dayPlans.map((p, i) => (
            <div key={p._id} className={'pv-pl' + (p.dealerId === justAdded ? ' new' : '')}>
              <span className="pv-num">{i + 1}</span>
              <span className="pv-main"><b>{p.dealerName}</b><small>{p.newParty ? 'new party' : [p.zone, p.city].filter(Boolean).join(' · ')}{p.status === 'DONE' ? ' · visited' : ''}</small></span>
              {p.canRemove && p.status !== 'DONE' && <button className="pv-rm" disabled={!!busyId} onClick={() => remove(p)} title="Take off this day"><Trash2 size={14} /></button>}
            </div>
          )) : <div className="pv-msg">Nothing planned yet — tap Add on a dealer above.</div>}
        </div>
      </aside>
    </div>
  );
}
