import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Search, CheckCircle2, MapPin, CalendarDays } from 'lucide-react';
import { api } from '../api';
import DealerVisitModal from './DealerVisitModal';

/**
 * Visit calendar.
 *
 * The office picks a day and a salesman and lists the dealers he should
 * visit, with a note for each. The salesman opens the same calendar and
 * sees his day; tapping a dealer opens the visit summary with the note,
 * and saving the MOM there ticks the visit off.
 */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayYmd = () => ymd(new Date());
const fmtDay = s => new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function VisitCalendar({ dealers = [], users = {}, currentUser }) {
  const isStaff = ['admin', 'superadmin', 'employee'].includes(currentUser?.role);
  const salesmen = useMemo(() => Object.entries(users || {}).filter(([, u]) => u?.role === 'salesman' && u?.active !== false).map(([id, u]) => ({ id, name: u.name || id })).sort((a, b) => a.name.localeCompare(b.name)), [users]);
  const [sm, setSm] = useState(isStaff ? '' : currentUser?.id || '');
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [day, setDay] = useState(todayYmd());
  const [plans, setPlans] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [collect, setCollect] = useState('');
  const [open, setOpen] = useState(null);       // dealerId for the visit modal
  const [editing, setEditing] = useState({});   // planId → note text being edited

  const from = ymd(new Date(month.getFullYear(), month.getMonth(), 1));
  const to = ymd(new Date(month.getFullYear(), month.getMonth() + 1, 0));
  const load = async () => {
    setBusy(true); setErr('');
    try { const r = await api.visitPlans({ from, to, ...(sm ? { salesmanId: sm } : {}) }); setPlans(r.items || []); }
    catch (e) { setErr(e?.message || 'Could not load'); }
    finally { setBusy(false); }
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
  const daySm = sm || (isStaff ? '' : currentUser?.id);

  // dealers the selected salesman can be sent to (staff) / own dealers (salesman)
  const pool = useMemo(() => {
    const list = dealers.filter(d => !daySm || d.salesman === daySm || isStaff);
    const s = q.trim().toLowerCase(); if (s.length < 2) return [];
    const on = new Set(dayPlans.map(p => p.dealerId));
    return list.filter(d => !on.has(d._id || d.id) && ((d.name || '').toLowerCase().includes(s) || (d.city || '').toLowerCase().includes(s))).sort((a, b) => (a.salesman === daySm ? -1 : 1) - (b.salesman === daySm ? -1 : 1)).slice(0, 10);
  }, [q, dealers, daySm, dayPlans, isStaff]);

  const act = async (fn) => { setBusy(true); setErr(''); try { await fn(); await load(); } catch (e) { setErr(e?.message || 'Could not do that'); } finally { setBusy(false); } };
  const add = (d) => { if (!daySm) { setErr('Pick a salesman first'); return; } act(async () => { await api.addVisitPlan({ date: day, salesmanId: daySm, dealerId: d._id || d.id, note, collectTarget: Number(collect) || 0 }); setQ(''); setNote(''); setCollect(''); }); };
  const saveNote = (p) => act(async () => { await api.updateVisitPlan(p._id, { note: editing[p._id] }); setEditing(e => { const n = { ...e }; delete n[p._id]; return n; }); });

  const input = { fontSize: 13, padding: '7px 9px', borderRadius: 8, border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' };
  const smName = id => users?.[id]?.name || id;
  const isToday = day === todayYmd();

  return (
    <div className="fade">
      <div className="page-head" style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="page-eyebrow">{isStaff ? 'Plan the field' : 'My visits'}</div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><CalendarDays size={22} /> Visit calendar</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{isStaff ? 'Pick a day and a salesman, add the dealers he should visit and what to do there. He sees it on his phone.' : 'Your day, as planned by the office. Tap a dealer for the visit summary and the office note; saving the MOM ticks it off. Only the office can change the plan.'}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {isStaff && <select value={sm} onChange={e => setSm(e.target.value)} style={input}><option value="">All salesmen</option>{salesmen.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
          <button className="btn" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} style={{ padding: '5px 8px' }}><ChevronLeft size={14} /></button>
          <b style={{ fontSize: 13.5, minWidth: 110, textAlign: 'center' }}>{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</b>
          <button className="btn" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} style={{ padding: '5px 8px' }}><ChevronRight size={14} /></button>
          <button className="btn" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); setDay(todayYmd()); }} style={{ fontSize: 12 }}>Today</button>
        </div>
      </div>
      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 10 }}>{err}</div>}

      <div className="vc-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 1fr)', gap: 14 }}>
        {/* month */}
        <div className="card" style={{ padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {DOW.map(d => <div key={d} style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', textAlign: 'center', padding: '2px 0' }}>{d}</div>)}
            {cells.map((c, i) => {
              if (!c) return <div key={i} />;
              const ps = (byDay[c] || []).filter(p => !sm || p.salesmanId === sm);
              const done = ps.filter(p => p.status === 'DONE').length;
              const sel = c === day, tod = c === todayYmd();
              const smIds = [...new Set(ps.map(p => p.salesmanId))];
              return (
                <div key={c} onClick={() => setDay(c)} style={{ minHeight: 64, padding: 6, borderRadius: 8, cursor: 'pointer', border: `1px solid ${sel ? 'var(--acc)' : 'var(--b1)'}`, background: sel ? 'rgba(99,102,241,.10)' : tod ? 'var(--bg2)' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, fontWeight: tod ? 900 : 600, color: tod ? 'var(--acc)' : 'var(--t1)' }}>{Number(c.slice(-2))}</span>
                    {ps.length > 0 && <span style={{ fontSize: 10.5, fontWeight: 800, padding: '1px 6px', borderRadius: 10, background: done === ps.length ? 'rgba(22,163,74,.15)' : 'rgba(99,102,241,.15)', color: done === ps.length ? 'var(--grn)' : 'var(--acc)' }}>{done}/{ps.length}</span>}
                  </div>
                  {ps.length > 0 && <div style={{ marginTop: 3, display: 'grid', gap: 1 }}>
                    {(sm ? ps.slice(0, 3) : smIds.slice(0, 3).map(id => ({ _id: id, dealerName: `${smName(id).split(' ')[0]} · ${ps.filter(p => p.salesmanId === id).length}` }))).map(p => <div key={p._id} style={{ fontSize: 10, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.dealerName}</div>)}
                    {(sm ? ps.length : smIds.length) > 3 && <div style={{ fontSize: 10, color: 'var(--t3)' }}>+{(sm ? ps.length : smIds.length) - 3} more</div>}
                  </div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* the day */}
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{fmtDay(day)}{isToday ? ' · today' : ''}</div>
            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{daySm ? smName(daySm) : 'all salesmen'} · {dayPlans.length} dealer{dayPlans.length === 1 ? '' : 's'}</span>
          </div>

          {dayPlans.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--t3)', padding: '8px 0 12px' }}>{isStaff ? 'Nothing planned yet. Add dealers below.' : 'Nothing planned for you this day.'}</div>}
          <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            {dayPlans.map((p, i) => (
              <div key={p._id} style={{ border: '1px solid var(--b1)', borderRadius: 10, padding: '8px 10px', background: p.status === 'DONE' ? 'rgba(22,163,74,.06)' : 'var(--bg1)', borderLeft: `4px solid ${p.status === 'DONE' ? 'var(--grn)' : p.status === 'SKIPPED' ? 'var(--t3)' : 'var(--acc)'}` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ width: 20, height: 20, borderRadius: 10, background: p.status === 'DONE' ? 'var(--grn)' : 'var(--acc)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{p.status === 'DONE' ? '✓' : i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href="#" onClick={e => { e.preventDefault(); setOpen(p.dealerId); }} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', textDecoration: 'none' }}>{p.dealerName}</a>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{[p.zone, p.city].filter(Boolean).join(' · ')}{!sm ? ` · ${p.salesmanName}` : ''}{p.accountStatus && p.accountStatus !== 'NONE' ? ` · ${p.accountStatus}` : ''}{p.status === 'DONE' ? ' · MOM written' : p.status === 'SKIPPED' ? ' · skipped' : ''}</div>
                    {editing[p._id] !== undefined ? (
                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                        <input autoFocus value={editing[p._id]} onChange={e => setEditing(x => ({ ...x, [p._id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') saveNote(p); if (e.key === 'Escape') setEditing(x => { const n = { ...x }; delete n[p._id]; return n; }); }} style={{ ...input, flex: 1, fontSize: 12 }} placeholder={isStaff ? 'what to do at this dealer' : 'your note'} />
                        <button className="btnp" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => saveNote(p)}>Save</button>
                      </div>
                    ) : (
                      <>
                        {p.note ? <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}><b style={{ color: 'var(--acc)' }}>Office:</b> {p.note}</div> : isStaff ? <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 3, fontStyle: 'italic' }}>No note yet</div> : null}
                        {p.collectTarget > 0 && <div style={{ fontSize: 12, color: 'var(--grn)', fontWeight: 700, marginTop: 2 }}>To collect ₹{Number(p.collectTarget).toLocaleString('en-IN')}</div>}
                        {p.salesmanNote && <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}><b style={{ color: 'var(--grn)' }}>{smName(p.salesmanId).split(' ')[0]}:</b> {p.salesmanNote}</div>}
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="btn" title="Open the visit summary and MOM" style={{ fontSize: 11, padding: '3px 7px' }} onClick={() => setOpen(p.dealerId)}><MapPin size={11} /></button>
                    {isStaff && editing[p._id] === undefined && <button className="btn" title="Edit the office note" style={{ fontSize: 11, padding: '3px 7px' }} onClick={() => setEditing(x => ({ ...x, [p._id]: p.note }))}>✎</button>}
                    {isStaff && p.status !== 'DONE' && <button className="btn" title="Mark visited" style={{ fontSize: 11, padding: '3px 7px', color: 'var(--grn)' }} onClick={() => act(() => api.updateVisitPlan(p._id, { status: 'DONE' }))}><CheckCircle2 size={11} /></button>}
                    {isStaff && <button className="btn" title="Remove from the day" style={{ fontSize: 11, padding: '3px 7px', color: 'var(--red)' }} onClick={() => { if (window.confirm(`Remove ${p.dealerName} from ${fmtDay(day)}?`)) act(() => api.deleteVisitPlan(p._id)); }}><X size={11} /></button>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {isStaff && (
            <div style={{ borderTop: '1px solid var(--b1)', paddingTop: 10 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 5 }}>Add a dealer to {daySm ? smName(daySm).split(' ')[0] + "'s" : 'the'} day{!daySm && isStaff ? ' — pick a salesman above first' : ''}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...input, padding: '6px 9px' }}>
                <Search size={13} color="var(--t3)" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="dealer name…" disabled={!daySm} style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--t1)', fontSize: 13, outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="note for this visit — e.g. show Candid folder" disabled={!daySm} style={{ ...input, flex: 1, minWidth: 0, fontSize: 12 }} />
                <input type="number" min="0" value={collect} onChange={e => setCollect(e.target.value)} placeholder="collect ₹" disabled={!daySm} title="Amount to collect on this visit" style={{ ...input, width: 110, fontSize: 12 }} />
              </div>
              {pool.length > 0 && <div style={{ marginTop: 6, display: 'grid', gap: 3, maxHeight: 220, overflowY: 'auto' }}>
                {pool.map(d => (
                  <div key={d._id || d.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, padding: '4px 6px', borderRadius: 6, background: 'var(--bg2)' }}>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name} <span style={{ color: 'var(--t3)', fontSize: 11 }}>· {[d.zone, d.city].filter(Boolean).join(' · ')}{d.salesman && d.salesman !== daySm ? ` · ${smName(d.salesman)}'s dealer` : ''}</span></span>
                    <button className="btnp" disabled={busy} style={{ fontSize: 11, padding: '2px 8px', display: 'inline-flex', gap: 3, alignItems: 'center' }} onClick={() => add(d)}><Plus size={11} /> Add</button>
                  </div>
                ))}
              </div>}
            </div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 860px) { .vc-grid { grid-template-columns: 1fr !important; } }`}</style>
      {open && <DealerVisitModal dealerId={open} onClose={() => { setOpen(null); load(); }} />}
    </div>
  );
}
