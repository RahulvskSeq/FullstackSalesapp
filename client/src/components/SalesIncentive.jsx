import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, AlertTriangle, RefreshCw, Pencil, X, ChevronDown, ChevronRight,
         ArrowUpRight, ArrowDownRight, Trophy, Users, Layers, Package, Monitor, Star, Calculator,
         Clock, CheckCircle2, Banknote, ShieldCheck, AlertOctagon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../api';
import Skeleton from './Skeleton';

/**
 * Salesman incentive — the laminate scheme, shown in POINTS only.
 *
 * The rule is defined in rupees per sheet (Rule & setup), but salesmen are
 * told points, never money: everything on this screen is converted with the
 * scheme's pointsPerRupee (4 points = ₹1). Laminate pays on slabs above the
 * basic target; every other product pays on units above its own target.
 */

const money = v => '₹' + Number(v || 0).toLocaleString('en-IN',
  { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const num = v => Number(v || 0).toLocaleString('en-IN');
const points = v => Number(v || 0).toLocaleString('en-IN');

function Delta({ pct }) {
  if (pct === null || pct === undefined) return null;
  const up = pct >= 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5,
                   fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap',
                   color: up ? 'var(--grn)' : 'var(--red)',
                   background: up ? 'rgba(22,163,74,.12)' : 'rgba(220,38,38,.12)' }}>
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{Math.abs(pct)}%
    </span>
  );
}

function KpiTile({ icon: Icon, tint, label, value, pct }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    display: 'grid', placeItems: 'center', background: tint + '1f', color: tint }}>
        <Icon size={16} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: 'var(--t2)', fontWeight: 600, whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 800, margin: '1px 0 4px', lineHeight: 1.2,
                      fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>{value}</div>
        <Delta pct={pct} />
      </div>
    </div>
  );
}

function Stat({ label, value, tone, sub }) {
  return (
    <div style={{ padding: '13px 15px', borderRadius: 11, background: 'var(--bg1)',
                  border: '1px solid var(--b1)', minWidth: 0 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em',
                    textTransform: 'uppercase', color: 'var(--t3)' }}>{label}</div>
      <div style={{ fontSize: 21, fontWeight: 800, marginTop: 3, color: tone || 'var(--t1)',
                    fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/**
 * The section-3 figures. Each is worked out from the data (invoice lines,
 * Collections uploads) and shown; a number typed here overrides it, blank
 * puts it back to what the system found.
 */
function AdjustModal({ person, month, ppr, onClose, onSaved }) {
  const a = person.adjustments || {};
  const au = person.auto || {};
  const v = x => (x === null || x === undefined) ? '' : String(x);
  const [f, setF] = useState({
    displayValue: v(a.displayValue), projectSheets: v(a.projectSheets),
    latePaymentSheets: v(a.latePaymentSheets), badDebtOutstanding: v(a.badDebtOutstanding),
    note: a.note || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [show, setShow] = useState('');
  const set = (k, x) => setF(o => ({ ...o, [k]: x }));
  const paid = !!person.paid;

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { month, salesmanId: person.salesmanId, note: f.note };
      for (const k of ['displayValue', 'projectSheets', 'latePaymentSheets', 'badDebtOutstanding']) body[k] = f[k] === '' ? null : Number(f[k]);
      await api.salesIncentiveAdjSave(body);
      onSaved();
    } catch (e) { setErr(e?.message || 'Could not save'); }
    finally { setBusy(false); }
  };

  const row = (label, key, hint, autoVal, autoNote, prefix, detailKey) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                      textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {prefix && <span style={{ fontSize: 13, color: 'var(--t3)' }}>{prefix}</span>}
        <input type="number" min="0" value={f[key]} placeholder={`auto: ${num(autoVal)}`} disabled={paid}
               onChange={e => set(key, e.target.value)}
               style={{ flex: 1, fontSize: 13, padding: '7px 9px', borderRadius: 8,
                        border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
        {f[key] !== '' && !paid && <button className="btn" title="Back to the system figure" onClick={() => set(key, '')} style={{ fontSize: 11, padding: '4px 8px' }}>auto</button>}
        {detailKey && <button className="btn" onClick={() => setShow(show === detailKey ? '' : detailKey)} style={{ fontSize: 11, padding: '4px 8px' }}>{show === detailKey ? 'hide' : 'show'}</button>}
      </div>
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>
        <span style={{ color: f[key] === '' ? 'var(--acc)' : 'var(--yel,#ca8a04)', fontWeight: 700 }}>{f[key] === '' ? 'System: ' : 'Overridden · system found '}{num(autoVal)}{autoNote ? ` — ${autoNote}` : ''}.</span> {hint}
      </div>
    </div>
  );
  const lateDealers = au.lateDealers || [];
  const projLines = au.projectLines || [];
  const table = (rows) => <div style={{ margin: '4px 0 10px', border: '1px solid var(--b1)', borderRadius: 8, maxHeight: 180, overflowY: 'auto', fontSize: 11 }}>{rows}</div>;

  return (
    <div onClick={onClose}
         style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 2000,
                  display: 'grid', placeItems: 'center', padding: 18 }}>
      <div onClick={e => e.stopPropagation()} className="card"
           style={{ width: 'min(520px,100%)', maxHeight: '88vh', overflowY: 'auto', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{person.name}</div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--t3)', display: 'flex' }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.6 }}>
          {paid ? <b style={{ color: 'var(--grn)' }}>This month is paid and its figures are frozen.</b>
            : <>Worked out from the invoice lines and the Collections uploads. Type a number only to override; blank uses the system figure.</>}
          {au.excluded?.units > 0 && <div style={{ marginTop: 4 }}>Never counted: <b>{num(au.excluded.units)}</b> units ({Object.entries(au.excluded.byReason || {}).map(([k, n]) => `${k} ${num(n)}`).join(', ')}).</div>}
          {au.returns?.units > 0 && <div style={{ marginTop: 2 }}>Returns reversed this month: <b>{num(au.returns.units)}</b> units.</div>}
        </div>

        {row('Display value sold', 'displayValue', 'Panels, MS displays, DIY boxes sold to dealers. Earns 3%.', au.displayValue || 0, (au.displayValue ? 'from display categories' : 'no display category set in the rule'), '₹')}

        {row('Project-sale sheets', 'projectSheets', 'Laminate ₹50 or more below regular price. Counts half toward target; payout needs approval.', au.projectSheets || 0, projLines.length ? `${projLines.length} invoice lines under regular price` : 'no line under regular price', '', projLines.length ? 'proj' : '')}
        {show === 'proj' && table(<table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ color: 'var(--t3)', fontSize: 9.5, textTransform: 'uppercase' }}><th style={{ textAlign: 'left', padding: '4px 6px' }}>Dealer · product</th><th style={{ textAlign: 'right', padding: '4px 6px' }}>Sheets</th><th style={{ textAlign: 'right', padding: '4px 6px' }}>Price</th><th style={{ textAlign: 'right', padding: '4px 6px' }}>Regular</th></tr></thead><tbody>
          {projLines.map((l, i) => <tr key={i} style={{ borderTop: '1px solid var(--b1)' }}><td style={{ padding: '3px 6px' }}>{l.dealer}<div style={{ color: 'var(--t3)' }}>{l.product} · {l.voucherNo}</div></td><td style={{ textAlign: 'right', padding: '3px 6px' }}>{num(l.qty)}</td><td style={{ textAlign: 'right', padding: '3px 6px', color: 'var(--red)' }}>{money(l.price)}</td><td style={{ textAlign: 'right', padding: '3px 6px' }}>{money(l.regular)}</td></tr>)}
        </tbody></table>)}

        {row('Late-payment sheets', 'latePaymentSheets', 'Sales not fully collected within the hold. Earns nothing — the whole sale is forfeit, every product.',
             au.lateSheets || 0,
             au.lateFinal ? `final · ${lateDealers.length} dealer${lateDealers.length === 1 ? '' : 's'} still outstanding at ${au.lateDealers?.[0]?.asOn || person.payout?.holdEnd || ''}`
                          : `provisional · ${num(au.atRiskUnits || 0)} units across ${lateDealers.length} dealer${lateDealers.length === 1 ? '' : 's'} still outstanding, decided ${person.payout?.holdEnd || ''}`,
             '', lateDealers.length ? 'late' : '')}
        {show === 'late' && table(<table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ color: 'var(--t3)', fontSize: 9.5, textTransform: 'uppercase' }}><th style={{ textAlign: 'left', padding: '4px 6px' }}>Dealer</th><th style={{ textAlign: 'right', padding: '4px 6px' }}>Units {au.lateFinal ? 'forfeit' : 'at risk'}</th><th style={{ textAlign: 'right', padding: '4px 6px' }}>Pending</th></tr></thead><tbody>
          {lateDealers.map((l, i) => <tr key={i} style={{ borderTop: '1px solid var(--b1)' }}><td style={{ padding: '3px 6px' }}>{l.name}<div style={{ color: 'var(--t3)' }}>{Object.entries(l.byCategory || {}).map(([c, n]) => `${c} ${num(n)}`).join(' · ')}</div></td><td style={{ textAlign: 'right', padding: '3px 6px' }}>{num(l.units)}</td><td style={{ textAlign: 'right', padding: '3px 6px', color: 'var(--red)' }}>{money(l.pending)}<div style={{ color: 'var(--t3)' }}>as on {l.asOn}</div></td></tr>)}
        </tbody></table>)}

        {row('Bad debt outstanding', 'badDebtOutstanding', 'Type the balance the month accounts declare it. Later months carry it forward minus what each recovered.', au.badDebtCarried || 0, au.badDebtCarried ? 'carried from the previous month' : 'nothing carried', '₹')}

        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                        textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>Note</label>
        <textarea value={f.note} onChange={e => set('note', e.target.value)} rows={2} disabled={paid} placeholder="e.g. territory changed mid-month — handled with the manager"
                  style={{ width: '100%', fontSize: 12, padding: '7px 9px', borderRadius: 8, resize: 'vertical',
                           border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />

        {err && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          {!paid && <button className="btn btn-primary" disabled={busy} onClick={save}
                  style={{ fontSize: 12.5 }}>{busy ? 'Saving…' : 'Save'}</button>}
          <button className="btn" onClick={onClose} style={{ fontSize: 12.5 }}>{paid ? 'Close' : 'Cancel'}</button>
        </div>
      </div>
    </div>
  );
}


/* ── the scheme, computed in the browser for what-if questions ─────────── */
function laminatePay(excess, c) {
  const x = Math.max(0, Math.round(Number(excess) || 0));
  if (x <= 0) return { amount: 0, rate: null, bands: [] };
  const tiers = c.starterTiers || [];
  if (x < (c.retroFrom || 1000)) {
    let amount = 0, prev = 0; const bands = [];
    for (const t of tiers) { const inBand = Math.min(x, t.upTo) - prev; if (inBand > 0) { amount += inBand * t.rate; bands.push({ sheets: inBand, rate: t.rate }); } prev = t.upTo; if (x <= t.upTo) break; }
    return { amount, rate: null, bands };
  }
  const steps = Math.max(0, Math.floor(x / (c.retroBlock || 1000)) - 1);
  const rate = Math.min(c.retroCap, c.retroBase + c.retroStep * steps);
  return { amount: x * rate, rate, bands: [{ sheets: x, rate }] };
}
function estimate(c, basic, targets, f) {
  const ppr = Number(c.pointsPerRupee) || 4;
  const lam = Math.max(0, Math.round(Number(f.LAMINATE) || 0));
  const gateOpen = basic > 0 && lam >= basic;
  const excess = gateOpen ? lam - basic : 0;
  const L = laminatePay(excess, c);
  const products = (c.products || []).map(p => {
    const target = Number(targets[p.category]) || 0;
    const actual = Math.max(0, Math.round(Number(f[p.category]) || 0));
    const over = target > 0 ? Math.max(0, actual - target) : 0;
    const open = c.gateAll ? gateOpen : true;
    return { ...p, target, actual, over, amount: open && target > 0 ? over * p.rate : 0 };
  });
  const displayValue = Math.max(0, Number(f.display) || 0);
  const display = (c.gateAll ? gateOpen : true) ? displayValue * (c.displayPct || 0) : 0;
  const earned = L.amount + products.reduce((a, p) => a + p.amount, 0) + display;
  const deduction = earned * (c.deductionPct || 0);
  const payable = earned - deduction;
  return { gateOpen, excess, L, products, display, earned, deduction, payable, points: Math.round(payable * ppr), grossPoints: Math.round(earned * ppr), ppr };
}

/**
 * "What if I sell this much?" — a salesman types expected units and sees the
 * points the scheme would pay, using the same rule and their own targets.
 */
function EstimateModal({ d, person, onClose }) {
  const c = d.config || {};
  const ppr = Number(c.pointsPerRupee) || 4;
  const basic = person?.basic || 0;
  const targets = Object.fromEntries((person?.products || []).map(p => [p.category, p.target]));
  const now = { LAMINATE: person?.credited || 0, display: person?.displayValue || 0, ...Object.fromEntries((person?.products || []).map(p => [p.category, p.actual])) };
  const [f, setF] = useState({ ...now });                       // "What will I earn" boxes
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const [g, setG] = useState({ ...now });                       // "How much to sell" boxes — independent
  const setg = (k, v) => setG(x => ({ ...x, [k]: v }));
  const e = estimate(c, basic, targets, f);
  // "I want N points": the fewest laminate sheets that get there, with the
  // other products as entered. Points only rise with laminate, so a plain
  // upward scan (in 10s, then exact) finds the first sheet that clears it.
  const netF = 1 - (c.deductionPct || 0);                    // shown figures are net of the deduction
  const netPts = rs => Math.round(rs * ppr * netF);
  const [goal, setGoal] = useState('');
  const [mode, setMode] = useState('earn');   // 'earn' = what will I earn · 'goal' = how much to sell
  // Entering the planner: fill every product's own target first (laminate
  // basic is filled by the solver), so the plan starts from "hit all targets"
  // and only the remainder is asked of laminate. Any box can then be edited.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (mode !== 'goal' || seeded) return;
    setG(x => { const y = { ...x }; for (const p of (c.products || [])) { const t = Number(targets[p.category]) || 0; if (t > (Number(y[p.category]) || 0)) y[p.category] = t; } return y; });
    setSeeded(true);
  }, [mode]);
  const filledToTarget = key => seeded && (Number(g[key]) || 0) === (Number(targets[key]) || 0) && (Number(targets[key]) || 0) > (Number(now[key]) || 0);
  const goalRs = Number(String(goal).replace(/[^\d]/g, '')) || 0;   // typed in rupees
  const goalN = goalRs * ppr;                                          // searched in points
  const plan = (() => {
    if (!goalN || basic <= 0) return null;
    const ptsAt = L => estimate(c, basic, targets, { ...g, LAMINATE: L }).points;
    const cap = basic + 50000;
    if (ptsAt(cap) < goalN) return { impossible: true, max: ptsAt(cap) };
    let lo = basic, hi = cap;
    while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (ptsAt(mid) >= goalN) hi = mid; else lo = mid + 1; }
    const L = lo; const r = estimate(c, basic, targets, { ...g, LAMINATE: L });
    const lamNet = netPts(r.L.amount);
    return { L, excess: L - basic, more: L - (Number(now.LAMINATE) || 0), points: r.points, lamPts: lamNet, rate: r.L.rate, bands: r.L.bands, otherPts: r.points - lamNet, products: r.products, display: r.display };
  })();
  const cur = estimate(c, basic, targets, now);
  const rows = [
    { key: 'LAMINATE', label: 'Laminate', target: basic, actual: now.LAMINATE, unit: 'sheets', note: 'basic target — points start above it' },
    ...(c.products || []).map(p => ({ key: p.category, label: p.label, target: targets[p.category] || 0, actual: now[p.category] || 0, unit: p.key === 'rolls' ? 'rolls' : 'sheets', note: `${num(Math.round(p.rate * ppr))} pts per ${p.key === 'rolls' ? 'roll' : 'sheet'} above target` })),
  ];
  // digits only, so typing feels like a calculator; Enter jumps to the next box
  const clean = v => String(v ?? '').replace(/[^\d]/g, '');
  const onKey = ev => { if (ev.key === 'Enter') { ev.preventDefault(); const all = [...ev.currentTarget.closest('.est-body').querySelectorAll('input')]; const i = all.indexOf(ev.currentTarget); (all[i + 1] || all[0]).focus(); } };
  // a plain render function, not a component: a component declared inside the
  // modal is a new type every render, so React remounted the row and the box
  // lost focus after every keystroke
  const renderRow = (r, vals = f, setv = set) => {
    const v = vals[r.key]; const n = Number(v) || 0; const over = r.target > 0 && n > r.target;
    return (
      <div className="est-row" style={{ padding: '9px 0', borderTop: '1px solid var(--b1)' }}>
        <div><div style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</div><div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{r.note}</div></div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>target <b style={{ color: 'var(--t1)' }}>{r.target ? num(r.target) : '—'}</b><br />now <b style={{ color: 'var(--t1)' }}>{num(r.actual)}</b></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <button className="btn" style={{ padding: '4px 9px', fontSize: 14 }} onClick={() => setv(r.key, Math.max(0, n - (r.unit === 'rolls' ? 1 : 50)))}>−</button>
          <input type="text" inputMode="numeric" value={v} onChange={ev => setv(r.key, clean(ev.target.value))} onFocus={ev => ev.target.select()} onKeyDown={onKey}
                 style={{ width: '100%', minWidth: 80, fontSize: 17, padding: '8px 10px', borderRadius: 9, textAlign: 'right', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
                          border: '2px solid ' + (over ? 'var(--grn)' : 'var(--acc)'), background: 'var(--bg1)', color: over ? 'var(--grn)' : 'var(--t1)', outline: 'none' }} />
          <button className="btn" style={{ padding: '4px 9px', fontSize: 14 }} onClick={() => setv(r.key, n + (r.unit === 'rolls' ? 1 : 50))}>+</button>
        </div>
        {over && <div style={{ gridColumn: '1 / -1', fontSize: 10.5, color: 'var(--grn)', marginTop: -4 }}>+{num(n - r.target)} above target</div>}
      </div>
    );
  };
  // what the laminate slabs would pay at a few round excesses — the fastest answer to "how much if I push"
  const scen = [250, 500, 1000, 2000, 3000].map(x => ({ x, pts: Math.round(laminatePay(x, c).amount * ppr * (1 - (c.deductionPct || 0))) }));
  const lamNow = Number(f.LAMINATE) || 0;
  return (
    <div onMouseDown={ev => { if (ev.target === ev.currentTarget) onClose(); }}
         style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: 12, overflowY: 'auto' }}>
      <style>{`
        .est-grid { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(300px, .95fr); gap: 0; }
        .est-left { padding: 12px 20px 16px; border-right: 1px solid var(--b1); }
        .est-right { padding: 14px 20px 16px; background: var(--bg2); }
        .est-row { display: grid; grid-template-columns: minmax(120px,1.3fr) 100px 1fr; gap: 10px; align-items: center; }
        @media (max-width: 860px) { .est-grid { grid-template-columns: 1fr; } .est-left { border-right: none; border-bottom: 1px solid var(--b1); } .est-right { order: -1; } }
        @media (max-width: 560px) {
          .est-left, .est-right { padding: 10px 14px 14px; }
          .est-row { grid-template-columns: 1fr auto; row-gap: 6px; }
          .est-row > :first-child { grid-column: 1 / -1; }
          .est-hd { display: none !important; }
        }
      `}</style>
      <div className="card" style={{ width: 'min(960px, 100%)', maxHeight: 'calc(100vh - 24px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', margin: 'auto' }}>
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(99,102,241,.14)', color: 'var(--acc)', flexShrink: 0 }}><Calculator size={17} /></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Calculate my incentive</div>
            <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Type what you expect to sell this month — your own targets are used. {ppr} points = ₹1.</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'inline-flex', border: '1px solid var(--b2)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            {[['earn', 'What will I earn'], ['goal', 'How much to sell']].map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                style={{ fontSize: 12, padding: '6px 12px', border: 'none', cursor: 'pointer', fontWeight: mode === m ? 800 : 500,
                         background: mode === m ? 'var(--acc)' : 'var(--bg1)', color: mode === m ? '#fff' : 'var(--t2)' }}>{label}</button>
            ))}
          </div>
          <button className="btn" onClick={onClose} style={{ padding: '5px 8px', flexShrink: 0 }}><X size={15} /></button>
        </div>

        {mode === 'goal' && (
          <div className="est-grid est-body" style={{ overflowY: 'auto', minHeight: 0 }}>
            {/* ── left: the goal ── */}
            <div className="est-left">
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)', margin: '6px 0 8px' }}>I want to earn</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--t2)' }}>₹</span>
                <input type="text" inputMode="numeric" value={goal} onChange={ev => setGoal(ev.target.value.replace(/[^\d]/g, ''))} onFocus={ev => ev.target.select()} placeholder="1,00,000" autoFocus
                       style={{ flex: 1, minWidth: 0, fontSize: 26, padding: '10px 14px', borderRadius: 12, textAlign: 'right', fontWeight: 850, border: '2px solid var(--acc)', background: 'var(--bg1)', color: 'var(--t1)', outline: 'none', fontVariantNumeric: 'tabular-nums' }} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                {[10000, 25000, 50000, 100000, 200000].map(g => (
                  <button key={g} className="btn" onClick={() => setGoal(String(g))} style={{ fontSize: 11.5, padding: '5px 10px', fontWeight: goalRs === g ? 800 : 500, borderColor: goalRs === g ? 'var(--acc)' : undefined, background: goalRs === g ? 'rgba(99,102,241,.12)' : undefined }}>₹{num(g)}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>= <b style={{ color: 'var(--t1)' }}>{num(goalN)} pts</b> · {ppr} points = ₹1</div>

              <div style={{ marginTop: 14 }}>
                <div className="est-row est-hd" style={{ padding: '6px 0 4px', fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>
                  <span>Product</span><span>Target · now</span><span style={{ textAlign: 'right' }}>Sell</span>
                </div>
                {/* laminate first: the basic must be filled before anything pays, so the plan solves it */}
                <div className="est-row" style={{ padding: '9px 0', borderTop: '1px solid var(--b1)', background: 'rgba(22,163,74,.06)', borderRadius: 8 }}>
                  <div><div style={{ fontWeight: 700, fontSize: 13 }}>Laminate <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--grn)', textTransform: 'uppercase', letterSpacing: '.05em', marginLeft: 4 }}>1st · basic first</span></div><div style={{ fontSize: 10.5, color: 'var(--t3)' }}>worked out by the plan — fill basic, then the rest</div></div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>basic <b style={{ color: 'var(--t1)' }}>{num(basic)}</b><br />now <b style={{ color: 'var(--t1)' }}>{num(now.LAMINATE || 0)}</b></div>
                  <div style={{ textAlign: 'right', fontSize: 17, fontWeight: 850, color: 'var(--grn)', fontVariantNumeric: 'tabular-nums', paddingRight: 10 }}>{plan && !plan.impossible ? num(plan.L) : '—'}</div>
                </div>
                {rows.filter(r => r.key !== 'LAMINATE').map(r => <React.Fragment key={r.key}>{renderRow(r, g, setg)}{filledToTarget(r.key) && <div style={{ fontSize: 10.5, color: 'var(--acc)', marginTop: -4, marginBottom: 4 }}>2nd · raised to its target ({num(r.target)}) — edit to change</div>}</React.Fragment>)}
                <div className="est-row" style={{ padding: '9px 0', borderTop: '1px solid var(--b1)' }}>
                  <div><div style={{ fontWeight: 700, fontSize: 13 }}>Display</div><div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{Math.round((c.displayPct || 0) * 100)}% of value sold</div></div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>now <b style={{ color: 'var(--t1)' }}>{num(now.display || 0)}</b></div>
                  <input type="text" inputMode="numeric" value={g.display} onChange={ev => setg('display', clean(ev.target.value))} onFocus={ev => ev.target.select()} onKeyDown={onKey} placeholder="value sold"
                         style={{ width: '100%', fontSize: 17, padding: '8px 10px', borderRadius: 9, textAlign: 'right', fontWeight: 800, border: '2px solid var(--acc)', background: 'var(--bg1)', color: 'var(--t1)', outline: 'none' }} />
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 6 }}>Order: laminate basic first, then each product to its own target, then the rest of the amount from laminate. Edit any box — the laminate needed and the points update as you type.</div>
              </div>
            </div>

            {/* ── right: the plan ── */}
            <div className="est-right">
              {!goalN || basic <= 0 ? (
                <div style={{ padding: '18px 14px', borderRadius: 12, background: 'var(--bg1)', border: '1px dashed var(--b2)', fontSize: 12.5, color: 'var(--t3)', textAlign: 'center' }}>
                  {basic <= 0 ? 'No laminate target is set for you this month, so laminate cannot earn.' : 'Type the points you want, or tap a number on the left.'}
                </div>
              ) : plan?.impossible ? (
                <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.3)', fontSize: 12.5, color: 'var(--red)' }}>
                  Even {num(basic + 50000)} laminate sheets would give {num(plan.max)} pts. Try a smaller number.
                </div>
              ) : (
                <>
                  <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(22,163,74,.10)', border: '1px solid rgba(22,163,74,.35)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>Sell this much laminate</div>
                    <div style={{ fontSize: 40, fontWeight: 850, color: 'var(--grn)', lineHeight: 1.05, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{num(plan.L)} <span style={{ fontSize: 16, fontWeight: 700 }}>sheets</span></div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 6 }}>
                      <b>{num(plan.excess)}</b> above basic ({num(basic)}) · {plan.more > 0 ? <><b>{num(plan.more)}</b> more than today ({num(now.LAMINATE || 0)})</> : 'already there today'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(22,163,74,.35)', fontSize: 11.5 }}>
                      <div><div style={{ color: 'var(--t3)', fontSize: 10 }}>LAMINATE RATE</div><b>{plan.rate ? `${num(Math.round(plan.rate * ppr))} pts / sheet on all ${num(plan.excess)}` : plan.bands.map(b => `${num(Math.round(b.rate * ppr))} pts × ${num(b.sheets)}`).join(' + ')}</b></div>
                      <div><div style={{ color: 'var(--t3)', fontSize: 10 }}>YOU WOULD GET</div><b style={{ color: 'var(--grn)', fontSize: 15 }}>{num(plan.points)} pts</b><div style={{ fontSize: 11.5, color: 'var(--t2)', fontWeight: 700 }}>= ₹{num(Math.round(plan.points / ppr))}</div></div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)', margin: '12px 0 6px' }}>How it adds up</div>
                  <div style={{ background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '4px 12px', fontSize: 12.5 }}>
                    {[['Laminate', plan.lamPts, `+${num(plan.excess)} above basic`], ...plan.products.map(p => [p.label, netPts(p.amount), p.over ? `+${num(p.over)} above target` : '']), ['Display', netPts(plan.display), '']].map(([l, a, sub]) => (
                      <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 0', borderTop: '1px solid var(--b1)' }}><span style={{ fontWeight: 600 }}>{l}</span>{sub && <span style={{ fontSize: 10.5, color: 'var(--grn)' }}>{sub}</span>}<b style={{ marginLeft: 'auto', color: a > 0 ? 'var(--grn)' : 'var(--t3)', whiteSpace: 'nowrap' }}>₹{num(Math.round(a / ppr))} <span style={{ fontWeight: 600, color: 'var(--t3)' }}>· {num(a)} pts</span></b></div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, padding: '8px 0 6px', borderTop: '2px solid var(--b2)', fontWeight: 800 }}><span>Total</span><span style={{ marginLeft: 'auto', color: 'var(--grn)' }}>₹{num(Math.round(plan.points / ppr))} <span style={{ fontWeight: 600, color: 'var(--t3)' }}>· {num(plan.points)} pts</span></span></div>
                  </div>
                  <button className="btnp" onClick={() => { setF({ ...g, LAMINATE: plan.L }); setMode('earn'); }} style={{ marginTop: 10, fontSize: 12, width: '100%' }}>Copy this plan to "What will I earn" →</button>
                </>
              )}
            </div>
          </div>
        )}

        {mode === 'earn' && <div className="est-grid est-body" style={{ overflowY: 'auto', minHeight: 0 }}>
          {/* ── left: what I expect to sell ── */}
          <div className="est-left">
            <div className="est-row est-hd" style={{ padding: '6px 0 4px', fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>
              <span>Product</span><span>Target · now</span><span style={{ textAlign: 'right' }}>I expect to sell</span>
            </div>
            {rows.map(r => <React.Fragment key={r.key}>{renderRow(r)}</React.Fragment>)}
            <div className="est-row" style={{ padding: '9px 0', borderTop: '1px solid var(--b1)' }}>
              <div><div style={{ fontWeight: 700, fontSize: 13 }}>Display</div><div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{Math.round((c.displayPct || 0) * 100)}% of value sold</div></div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>now <b style={{ color: 'var(--t1)' }}>{num(now.display || 0)}</b></div>
              <input type="text" inputMode="numeric" value={f.display} onChange={ev => set('display', clean(ev.target.value))} onFocus={ev => ev.target.select()} onKeyDown={onKey} placeholder="value sold"
                     style={{ width: '100%', fontSize: 17, padding: '8px 10px', borderRadius: 9, textAlign: 'right', fontWeight: 800, border: '2px solid var(--acc)', background: 'var(--bg1)', color: 'var(--t1)', outline: 'none' }} />
            </div>

            {basic > 0 && (
              <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--t2)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Quick try — laminate at</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {scen.map(sc => {
                    const on = lamNow === basic + sc.x;
                    return (
                      <button key={sc.x} className="btn" onClick={() => set('LAMINATE', basic + sc.x)} title={`Set laminate to ${num(basic + sc.x)} sheets`}
                              style={{ fontSize: 11, padding: '5px 10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, borderColor: on ? 'var(--acc)' : undefined, background: on ? 'rgba(99,102,241,.12)' : undefined }}>
                        <span style={{ color: 'var(--t3)' }}>{num(basic + sc.x)} sheets</span>
                        <b style={{ color: 'var(--grn)' }}>{num(sc.pts)} pts</b>
                      </button>
                    );
                  })}
                  <button className="btn" onClick={() => setF({ ...now })} style={{ fontSize: 11, padding: '5px 10px', alignSelf: 'stretch' }} title="Back to this month's actual sales">↺ today's sales</button>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 5 }}>Basic {num(basic)} + 250 / 500 / 1,000 / 2,000 / 3,000 sheets — laminate points only.</div>
              </div>
            )}
          </div>

          {/* ── right: the answer ── */}
          <div className="est-right">
            <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(22,163,74,.10)', border: '1px solid rgba(22,163,74,.35)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>Calculated points</div>
              <div style={{ fontSize: 40, fontWeight: 850, color: 'var(--grn)', lineHeight: 1.05, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums' }}>{num(e.points)} <span style={{ fontSize: 18, fontWeight: 700 }}>pts</span></div>

              <div style={{ display: 'flex', gap: 10, marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(22,163,74,.35)', fontSize: 12 }}>
                <span style={{ color: 'var(--t3)' }}>At today's sales <b style={{ color: 'var(--t1)' }}>{num(cur.points)}</b></span>
                <span style={{ marginLeft: 'auto', fontWeight: 800, color: e.points - cur.points >= 0 ? 'var(--grn)' : 'var(--red)' }}>{e.points - cur.points >= 0 ? '+' : ''}{num(e.points - cur.points)}</span>
              </div>
            </div>

            {/* the slab ladder, with the slab this excess sits in lit up */}
            {basic > 0 && (() => {
              const tiers = c.starterTiers || []; const rf = c.retroFrom || 1000, blk = c.retroBlock || 1000;
              const slabs = []; let prev = 0;
              for (const t of tiers) { slabs.push({ from: prev + 1, to: t.upTo, rate: t.rate, retro: false }); prev = t.upTo; }
              for (let r = c.retroBase, f = rf; r <= c.retroCap; r += c.retroStep, f += blk) slabs.push({ from: f, to: r >= c.retroCap ? Infinity : f + blk - 1, rate: r, retro: true });
              const x = e.gateOpen ? e.excess : 0;
              const cur = x > 0 ? slabs.find(sl => x >= sl.from && x <= sl.to) : null;
              return (
                <div style={{ margin: '10px 0 0' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>
                    Laminate slab {cur ? <span style={{ color: 'var(--grn)' }}>· you are here</span> : <span>· none yet</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 5 }}>
                    {slabs.map(sl => {
                      const on = cur === sl;
                      return (
                        <div key={sl.from} style={{ padding: '6px 8px', borderRadius: 8, fontSize: 10.5, lineHeight: 1.35,
                          background: on ? 'var(--grn)' : 'var(--bg1)', color: on ? '#fff' : 'var(--t2)', border: '1px solid ' + (on ? 'var(--grn)' : 'var(--b1)'), fontWeight: on ? 800 : 500 }}>
                          <div>{num(sl.from)}{sl.to === Infinity ? '+' : '–' + num(sl.to)} above</div>
                          <div style={{ fontSize: 12, fontWeight: 800 }}>{num(Math.round(sl.rate * ppr))} pts<span style={{ fontWeight: 500, fontSize: 9.5 }}>/sheet{sl.retro ? ' on all' : ''}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div style={{ fontSize: 11.5, padding: '9px 11px', borderRadius: 9, margin: '10px 0', lineHeight: 1.5, background: e.gateOpen ? 'rgba(22,163,74,.08)' : 'rgba(220,38,38,.07)', color: e.gateOpen ? 'var(--grn)' : 'var(--red)', border: '1px solid ' + (e.gateOpen ? 'rgba(22,163,74,.3)' : 'rgba(220,38,38,.25)') }}>
              {basic <= 0 ? 'No laminate target is set for you this month, so laminate cannot earn.'
                : e.gateOpen ? <>Laminate basic crossed by <b>{num(e.excess)}</b> → {e.L.rate ? `${num(Math.round(e.L.rate * ppr))} pts on every sheet above basic` : e.L.bands.map(b => `${num(Math.round(b.rate * ppr))} pts × ${num(b.sheets)}`).join(' + ')} = <b>{num(netPts(e.L.amount))} pts</b></>
                : <><b>{num(basic - lamNow)}</b> more laminate sheets to reach basic ({num(basic)}). {c.gateAll ? 'Nothing pays until basic is crossed — then every product earns above its own target.' : 'Laminate earns nothing until then; other products still earn above their targets.'}</>}
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Where the points come from</div>
            <div style={{ background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '4px 12px', fontSize: 12.5 }}>
              {[['Laminate', e.L.amount, e.excess ? `+${num(e.excess)} above basic` : ''], ...e.products.map(p => [p.label, p.amount, p.over ? `+${num(p.over)} above target` : '']), ['Display', e.display, '']].map(([l, a, sub]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 0', borderTop: '1px solid var(--b1)' }}>
                  <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{l}</span>
                  {sub && <span style={{ fontSize: 10.5, color: 'var(--grn)' }}>{sub}</span>}
                  <b style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', color: a > 0 ? 'var(--grn)' : 'var(--t3)', whiteSpace: 'nowrap' }}>{num(netPts(a))} pts <span style={{ fontWeight: 600, color: 'var(--t3)' }}>· ₹{num(Math.round(netPts(a) / ppr))}</span></b>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, padding: '8px 0 6px', borderTop: '2px solid var(--b2)', fontWeight: 800 }}>
                <span>Total</span><span style={{ marginLeft: 'auto', color: 'var(--grn)', whiteSpace: 'nowrap' }}>{num(e.points)} pts <span style={{ fontWeight: 600, color: 'var(--t3)' }}>· ₹{num(Math.round(e.points / ppr))}</span></span>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

export default function SalesIncentive() {
  const [month, setMonth] = useState('');
  // A date window, answered from the ERP invoice lines. The monthly rollup has
  // no dates, so a range only exists where those lines were imported.
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');
  const ranged = !!(from && to && from <= to);
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [key, setKey] = useState(0);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState({});
  const [calc, setCalc] = useState(false);
  const [acting, setActing] = useState('');
  const [actErr, setActErr] = useState('');

  useEffect(() => {
    let dead = false;
    setBusy(true); setErr('');
    api.salesIncentive(month, ranged ? { from, to } : null)
      .then(r => { if (!dead) setD(r); })
      .catch(e => { if (!dead) setErr(e?.message || 'Could not load'); })
      .finally(() => { if (!dead) setBusy(false); });
    return () => { dead = true; };
  }, [month, key, ranged, from, to]);

  const reload = useCallback(() => setKey(k => k + 1), []);
  const mine = !!d?.mine;
  const act = async (label, fn) => {
    setActing(label); setActErr('');
    try { await fn(); reload(); } catch (e) { setActErr(e?.message || 'Could not do that'); }
    finally { setActing(''); }
  };
  const approveProject = (p, approved) => act('approve:' + p.salesmanId, () => api.salesIncentiveApproveProject({ month: d.month, salesmanId: p.salesmanId, approved }));
  const markPaid = (p) => { if (!window.confirm(`Mark ${p ? p.name + "'s" : 'every payable'} ${monthLabel(d.month)} incentive as paid? The figures are frozen after this.`)) return; act('paid:' + (p?.salesmanId || 'all'), () => api.salesIncentivePaid({ month: d.month, salesmanId: p?.salesmanId })); };
  const unmarkPaid = (p) => { if (!window.confirm(`Un-mark ${p.name}'s ${monthLabel(d.month)} as paid?`)) return; act('unpaid:' + p.salesmanId, () => api.salesIncentiveUnpaid({ month: d.month, salesmanId: p.salesmanId })); };
  const fmtDay = s => s ? new Date(s + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';                                     // a salesman looking at their own month
  useEffect(() => { if (mine && d?.people?.[0]) setOpen({ [d.people[0].salesmanId]: true }); }, [mine, d?.month]);
  const ppr = Number(d?.config?.pointsPerRupee) || 4;
  const pts = v => Math.round((Number(v) || 0) * ppr);          // rupees → points
  const P = v => num(pts(v)) + ' pts';
  const rateP = v => num(pts(v)) + ' pts';                       // per-unit rate in points
  // Only salesmen who are IN the scheme this month — those with a laminate
  // target set. Someone with no target (left, joined mid-month, not on the
  // scheme) is kept out of the list and named in Needs attention instead.
  const everyone = [...(d?.people || [])].sort((a, b) => b.payable - a.payable || b.credited - a.credited);
  const people = everyone.filter(p => p.basic > 0);
  const noTarget = everyone.filter(p => !p.basic);
  const cleared = people.filter(p => p.gateOpen);
  const t = d?.totals || {};
  const PRODUCT_ICON = { decorative: Package, louvres: Layers, rolls: Package, liner: Layers };

  const monthLabel = m => { if (!m) return ''; const [y, mm] = m.split('-'); return new Date(Date.UTC(+y, +mm - 1, 1)).toLocaleDateString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' }); };
  const input = { fontSize: 12.5, padding: '6px 9px', borderRadius: 8, border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' };

  /** progress bar: actual against target, coloured by whether it is crossed */
  const Progress = ({ actual, target, tone }) => {
    const pct = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
    const over = target > 0 && actual > target;
    return (
      <div style={{ height: 6, borderRadius: 3, background: 'var(--b1)', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: 3, background: over ? 'var(--grn)' : (tone || 'var(--acc)'), transition: 'width .3s' }} />
      </div>
    );
  };
  const Chip = ({ children, tone = 'var(--t3)', bg = 'var(--bg2)' }) => (
    <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, color: tone, background: bg, whiteSpace: 'nowrap' }}>{children}</span>
  );
  const Tile = ({ icon: Icon, label, value, sub, tone = 'var(--acc)', big }) => (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'grid', placeItems: 'center', background: tone + '22', color: tone }}><Icon size={17} /></div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)', whiteSpace: 'nowrap' }}>{label}</div>
        <div style={{ fontSize: big ? 26 : 20, fontWeight: 850, lineHeight: 1.15, margin: '2px 0', color: big ? tone : 'var(--t1)', fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--t3)' }}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div className="fade">
      <style>{`
        .si-row:hover { background: var(--bg2); }
        @media (max-width: 720px) { .si-hide-sm { display: none !important; } .si-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ── head ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <div className="page-eyebrow">{mine ? 'My incentive' : 'Salesman incentive'}</div>
          <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {mine ? 'My points' : 'Points earned'} <Chip tone="var(--acc)" bg="rgba(99,102,241,.12)">{ppr} points = ₹1</Chip>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={d?.month || ''} onChange={e => setMonth(e.target.value)} style={input}>
            {(d?.months || []).map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ ...input, padding: '5px 7px' }} />
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ ...input, padding: '5px 7px' }} />
            {(from || to) && <button className="btn" title="Back to the whole month" style={{ fontSize: 11 }} onClick={() => { setFrom(''); setTo(''); }}><X size={11} /></button>}
          </span>
          <button className="btn" onClick={reload} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <RefreshCw size={12} className={busy ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5 }}>{err}</div>}
      {busy && !d && <Skeleton kind="dashboard" rows={6} />}

      {d && d.month && (
        <>
          {d.range && (
            <div className="card" style={{ padding: '10px 15px', marginBottom: 14, display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} color={d.range.days ? 'var(--acc)' : 'var(--yel,#ca8a04)'} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.55 }}>
                {d.range.days > 0
                  ? <>Showing <b>{d.range.from} to {d.range.to}</b> — {num(d.range.days)} {d.range.days === 1 ? 'day' : 'days'} of invoice lines. Targets stay monthly, so laminate is still measured against the whole {monthLabel(d.month)} basic.</>
                  : <><b>No invoice lines between {d.range.from} and {d.range.to}.</b> Only months whose ERP lines were imported can be sliced by date.</>}
              </div>
            </div>
          )}

          {/* ── section 4: when this month is paid ────────────── */}
          {d.schedule && (() => {
            const sc = d.schedule; const allPaid = people.length > 0 && people.every(p => p.paid); const somePaid = people.some(p => p.paid);
            const st = allPaid ? 'paid' : sc.status;
            const tone = st === 'paid' ? 'var(--grn)' : st === 'payable' ? 'var(--acc)' : st === 'held' ? '#b45309' : 'var(--t3)';
            const Icon = st === 'paid' ? CheckCircle2 : st === 'payable' ? Banknote : Clock;
            const title = st === 'paid' ? `Paid — ${monthLabel(d.month)} incentive has been paid${somePaid ? '' : ''}`
              : st === 'payable' ? `Payable — hold ended ${fmtDay(sc.holdEnd)}, pays in the ${monthLabel(sc.payMonth)} salary (${fmtDay(sc.payDate)})`
              : st === 'held' ? `Held — ${monthLabel(d.month)} closed, collections checked until ${fmtDay(sc.holdEnd)}, then paid in the ${monthLabel(sc.payMonth)} salary`
              : `Open — ${monthLabel(d.month)} is still running; it closes ${fmtDay(sc.monthEnd)}, is held ${sc.holdDays} days and pays in the ${monthLabel(sc.payMonth)} salary`;
            return (
              <div className="card" style={{ padding: '10px 15px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', borderLeft: `4px solid ${tone}` }}>
                <Icon size={16} color={tone} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5, flex: 1, minWidth: 220 }}>
                  <b style={{ color: tone }}>{title}.</b>
                  {' '}{st === 'paid' ? 'One calendar month, paid as a single amount. No splits, no partial release.' : 'Sales are evaluated together, held for collections, then paid in full in one salary cycle.'}
                  {t.atRisk > 0 && st !== 'paid' && <> <span style={{ color: '#b45309' }}>{num(t.atRisk)} units are on dealers still outstanding for {monthLabel(d.month)}{sc.final ? ' — forfeited' : ` — forfeit if not cleared by ${fmtDay(sc.holdEnd)}`}.</span></>}
                  {t.late > 0 && <> <span style={{ color: 'var(--red)' }}>{num(t.late)} units forfeited for late payment.</span></>}
                  {t.needsApproval > 0 && !mine && <> <span style={{ color: '#b45309' }}>{t.needsApproval} project-sale payout{t.needsApproval === 1 ? '' : 's'} awaiting approval.</span></>}
                  {d.source === 'rollup' && <> <span style={{ color: 'var(--t3)' }}>No invoice lines for this month, so project sales and exclusions cannot be detected — only late payment.</span></>}
                </div>
                {d.canPay && !mine && st === 'payable' && !allPaid && (
                  <button className="btnp" disabled={!!acting} onClick={() => markPaid(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '6px 12px' }}>
                    <Banknote size={13} /> Mark all as paid
                  </button>
                )}
              </div>
            );
          })()}
          {actErr && <div className="card" style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12 }}>{actErr}</div>}

          {/* ── headline tiles ────────────────────────────────── */}
          <div style={{ display: 'grid', gap: 10, marginBottom: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
            <Tile icon={Trophy} label={`${mine ? 'My points' : 'Points'} · ${monthLabel(d.month)}`} value={num(t.points)} big tone="var(--grn)"
                  sub={d.previous ? <>last month {num(pts(d.previous.payable))} {d.change?.payable != null && <Delta pct={d.change.payable} />}</> : ' '} />
            {mine
              ? <Tile icon={people[0]?.gateOpen ? Unlock : Lock} label="Laminate basic" value={people[0] ? `${num(people[0].credited)} of ${num(people[0].basic)}` : '—'}
                      sub={people[0]?.gateOpen ? `crossed · ${num(people[0].laminate.excess)} above` : people[0]?.basic ? `${num(people[0].shortfall)} sheets to go` : 'no target set'} tone={people[0]?.gateOpen ? 'var(--grn)' : 'var(--red)'} />
              : <Tile icon={Users} label="Cleared laminate basic" value={`${cleared.length} of ${people.length}`}
                      sub={cleared.length ? cleared.map(p => p.name).join(', ') : 'nobody yet this month'} tone={cleared.length ? 'var(--grn)' : 'var(--red)'} />}
            <Tile icon={Layers} label="Laminate points" value={num(pts(t.laminate))} sub="slabs above basic" tone="var(--acc)" />
            <Tile icon={Package} label="Other products" value={num(pts(t.products))} sub="above each product's target" tone="#0891b2" />
            <Tile icon={Monitor} label="Display" value={num(pts(t.display))} sub="3% of display value" tone="#b45309" />
          </div>

          {/* ── trend + attention ─────────────────────────────── */}
          <div className="si-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: mine ? '1fr' : '2fr 1fr', marginBottom: 14 }}>
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 2 }}>{mine ? 'My points by month' : 'Points by month'}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>{mine ? 'last six months' : 'everyone together, last six months'}</div>
              <div style={{ height: 170 }}>
                <ResponsiveContainer>
                  <BarChart data={(d.trend || []).map(x => ({ m: monthLabel(x.month), points: pts(x.payable), cur: x.month === d.month }))} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--b1)" />
                    <XAxis dataKey="m" tick={{ fontSize: 11, fill: 'var(--t3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--t3)' }} axisLine={false} tickLine={false} tickFormatter={v => num(v)} />
                    <Tooltip formatter={v => [num(v) + ' pts', 'Points']} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
                    <Bar dataKey="points" radius={[6, 6, 0, 0]}>
                      {(d.trend || []).map((x, i) => <Cell key={i} fill={x.status === 'paid' ? 'var(--grn)' : x.month === d.month ? 'var(--acc)' : 'rgba(99,102,241,.35)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {!mine && <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>Needs attention</div>
              <div style={{ display: 'grid', gap: 8, fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                {noTarget.length > 0 && <div style={{ display: 'flex', gap: 8 }}><AlertTriangle size={14} color="var(--yel,#ca8a04)" style={{ flexShrink: 0, marginTop: 2 }} /><span><b>Not in this month's scheme:</b> {noTarget.map(p => `${p.name}${p.credited ? ` (${num(p.credited)} laminate)` : ''}`).join(', ')} — no laminate target set, so they are hidden from the list. Set a target in Sales by Category → Salesman-wise to include them.</span></div>}
                {cleared.length === 0 && <div style={{ display: 'flex', gap: 8 }}><Lock size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} /><span><b>Nobody has crossed laminate basic yet.</b> Laminate points start only above it; other products keep earning above their own targets.</span></div>}
                {(() => { const close = people.filter(p => !p.gateOpen && p.basic > 0 && p.credited / p.basic >= 0.8); return close.length ? <div style={{ display: 'flex', gap: 8 }}><Star size={14} color="var(--acc)" style={{ flexShrink: 0, marginTop: 2 }} /><span><b>Close to basic:</b> {close.map(p => `${p.name} (${Math.round(p.credited / p.basic * 100)}%)`).join(', ')}</span></div> : null; })()}
                {noTarget.length === 0 && cleared.length > 0 && <div style={{ display: 'flex', gap: 8 }}><Unlock size={14} color="var(--grn)" style={{ flexShrink: 0, marginTop: 2 }} /><span>All targets set. {cleared.length} salesm{cleared.length === 1 ? 'an is' : 'en are'} earning laminate points.</span></div>}
              </div>
            </div>}
          </div>

          {/* ── leaderboard ───────────────────────────────────── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12.5, fontWeight: 800 }}>{mine ? 'My working' : 'Every salesman'}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}>{mine ? 'target, actual and points for each product' : 'click a row for the full working'}</div>
              {mine && (
                <button className="btnp" onClick={() => setCalc(true)} title="Type what you expect to sell and see the points"
                        style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, padding: '7px 14px' }}>
                  <Calculator size={14} /> Calculate my incentive
                </button>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 640 }}>
                <thead>
                  <tr style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                    <th style={{ textAlign: 'left', padding: '8px 16px', width: 32 }}>#</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px' }}>Salesman</th>
                    <th style={{ textAlign: 'left', padding: '8px 6px', minWidth: 220 }}>Laminate vs basic</th>
                    <th className="si-hide-sm" style={{ textAlign: 'left', padding: '8px 6px' }}>Other products</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px' }}>Points</th>
                    <th style={{ width: 70 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((p, i) => {
                    const isOpen = !!open[p.salesmanId];
                    const pct = p.basic > 0 ? Math.round(p.credited / p.basic * 100) : 0;
                    const earningProducts = p.products.filter(x => x.amount > 0);
                    return (
                      <React.Fragment key={p.salesmanId}>
                        <tr className="si-row" onClick={() => setOpen(o => ({ ...o, [p.salesmanId]: !isOpen }))}
                            style={{ borderTop: '1px solid var(--b1)', cursor: 'pointer', background: isOpen ? 'var(--bg2)' : undefined }}>
                          <td style={{ padding: '10px 16px', color: 'var(--t3)', fontWeight: 700 }}>{i + 1}</td>
                          <td style={{ padding: '10px 6px' }}>
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {p.gateOpen ? <Unlock size={12} color="var(--grn)" /> : <Lock size={12} color={p.basic ? 'var(--red)' : 'var(--t3)'} />}{p.name}
                            </div>
                            <div style={{ marginTop: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {p.gateOpen ? <Chip tone="var(--grn)" bg="rgba(22,163,74,.14)">basic cleared</Chip>
                                : p.basic ? <Chip tone="var(--red)" bg="rgba(220,38,38,.12)">short by {num(p.shortfall)}</Chip>
                                : <Chip>no target</Chip>}
                              {p.paid && <Chip tone="var(--grn)" bg="rgba(22,163,74,.14)">paid</Chip>}
                              {p.effective?.latePaymentSheets > 0 && <Chip tone="var(--red)" bg="rgba(220,38,38,.12)" >late −{num(p.effective.latePaymentSheets)}</Chip>}
                              {!p.auto?.lateFinal && p.auto?.atRiskUnits > 0 && <Chip tone="#b45309" bg="rgba(180,83,9,.12)">{num(p.auto.atRiskUnits)} at risk</Chip>}
                              {p.effective?.projectSheets > 0 && <Chip tone={p.needsApproval ? '#b45309' : 'var(--acc)'} bg={p.needsApproval ? 'rgba(180,83,9,.12)' : 'rgba(99,102,241,.12)'}>project {num(p.effective.projectSheets)}{p.needsApproval ? ' · approve' : ' ✓'}</Chip>}
                            </div>
                          </td>
                          <td style={{ padding: '10px 6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                              <span><b>{num(p.credited)}</b> <span style={{ color: 'var(--t3)' }}>of {num(p.basic)}</span></span>
                              <span style={{ color: p.gateOpen ? 'var(--grn)' : 'var(--t3)', fontWeight: 700 }}>{p.basic ? pct + '%' : '—'}{p.gateOpen && p.laminate.excess ? ` · +${num(p.laminate.excess)} above` : ''}</span>
                            </div>
                            <Progress actual={p.credited} target={p.basic} />
                          </td>
                          <td className="si-hide-sm" style={{ padding: '10px 6px' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {p.products.map(x => {
                                const over = x.target > 0 && x.actual > x.target;
                                return <span key={x.key} title={`${x.label}: ${num(x.actual)} of ${num(x.target)}${over ? ` · +${num(x.excess)} above → ${P(x.amount)}` : ''}`}
                                  style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 6, whiteSpace: 'nowrap', fontWeight: over ? 800 : 500,
                                           color: over ? 'var(--grn)' : 'var(--t3)', background: over ? 'rgba(22,163,74,.12)' : 'var(--bg2)', border: '1px solid ' + (over ? 'rgba(22,163,74,.35)' : 'var(--b1)') }}>
                                  {x.label} {x.target ? Math.min(999, Math.round(x.actual / x.target * 100)) + '%' : '—'}
                                </span>;
                              })}
                            </div>
                          </td>
                          <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                            <div style={{ fontSize: 17, fontWeight: 850, color: p.points > 0 ? 'var(--grn)' : 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>{num(p.points)}</div>
                            {earningProducts.length > 0 && <div style={{ fontSize: 10, color: 'var(--t3)' }}>{earningProducts.map(x => x.label).join(' + ')}{p.laminate.amount > 0 ? ' + laminate' : ''}</div>}
                          </td>
                          <td style={{ padding: '10px 10px 10px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {!mine && <button className="btn" title="Display value, project sheets, late payment, bad debt" onClick={e => { e.stopPropagation(); setEditing(p); }} style={{ padding: '3px 6px' }}><Pencil size={11} /></button>}
                            {!mine && p.needsApproval && !p.paid && <button className="btn" title="Approve the project-sale payout (management approval)" disabled={!!acting} onClick={e => { e.stopPropagation(); approveProject(p, true); }} style={{ padding: '3px 6px', marginLeft: 4, color: '#b45309' }}><ShieldCheck size={11} /></button>}
                            {!mine && d.canPay && p.payout?.status === 'payable' && !p.paid && <button className="btn" title="Mark this salesman's month as paid" disabled={!!acting || p.needsApproval} onClick={e => { e.stopPropagation(); markPaid(p); }} style={{ padding: '3px 6px', marginLeft: 4, color: 'var(--grn)' }}><Banknote size={11} /></button>}
                            <span style={{ display: 'inline-block', marginLeft: 6, color: 'var(--t3)', verticalAlign: 'middle' }}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr style={{ background: 'var(--bg2)' }}>
                            <td colSpan={6} style={{ padding: '4px 16px 14px' }}>
                              <div style={{ background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 14px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                  <thead>
                                    <tr style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                      <th style={{ textAlign: 'left', padding: '4px 0' }}>Product</th>
                                      <th style={{ textAlign: 'right', padding: '4px 8px' }}>Target</th>
                                      <th style={{ textAlign: 'right', padding: '4px 8px' }}>Actual</th>
                                      <th style={{ textAlign: 'right', padding: '4px 8px' }}>Above</th>
                                      <th style={{ textAlign: 'right', padding: '4px 8px' }}>Rate</th>
                                      <th style={{ textAlign: 'right', padding: '4px 0' }}>Points</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr style={{ borderTop: '1px solid var(--b1)' }}>
                                      <td style={{ padding: '6px 0', fontWeight: 700 }}>Laminate <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 500 }}>· gate</span></td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(p.basic)}</td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(p.credited)}</td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(p.laminate.excess)}</td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--t3)', whiteSpace: 'nowrap' }}
                                          title={(() => { const c = d.config || {}; const tt = c.starterTiers || []; return tt.length ? `Excess 1–${num(tt[0].upTo)} ${rateP(tt[0].rate)}` + tt.slice(1).map((x, k) => `, ${num(tt[k].upTo + 1)}–${num(x.upTo)} ${rateP(x.rate)}`).join('') + `; from ${num(c.retroFrom)} one rate on all: ${rateP(c.retroBase)}, +${rateP(c.retroStep)} per ${num(c.retroBlock)}, max ${rateP(c.retroCap)} — per sheet` : ''; })()}>
                                        {p.laminate.rate ? rateP(p.laminate.rate) + '/sheet on all'
                                          : p.laminate.bands?.length ? p.laminate.bands.map(b => `${rateP(b.rate)}×${num(b.sheets)}`).join(' + ')
                                          : (() => { const c = d.config || {}; const tt = c.starterTiers || []; return tt.length ? `${num(pts(tt[0].rate))}–${num(pts(c.retroCap))} pts/sheet by slab` : '—'; })()}
                                      </td>
                                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 800, color: p.laminate.amount > 0 ? 'var(--grn)' : undefined }}>{num(pts(p.laminate.amount))}</td>
                                    </tr>
                                    {p.products.map(x => (
                                      <tr key={x.key} style={{ borderTop: '1px solid var(--b1)' }}>
                                        <td style={{ padding: '6px 0' }}>{x.label} <span style={{ fontSize: 10, color: 'var(--t3)' }}>· {x.category}{x.targetSource === 'derived' ? ' · derived target' : x.targetSource === 'rule' ? ' · fixed by rule' : ''}</span></td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{x.target ? num(x.target) : <span style={{ color: 'var(--t3)' }}>none</span>}</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(x.actual)}</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', color: x.excess > 0 ? 'var(--grn)' : undefined, fontWeight: x.excess > 0 ? 700 : 400 }}>{num(x.excess)}</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--t3)', whiteSpace: 'nowrap' }}>{rateP(x.rate)}/{x.key === 'rolls' ? 'roll' : 'sheet'}</td>
                                        <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 800, color: x.amount > 0 ? 'var(--grn)' : undefined }}>{num(pts(x.amount))}</td>
                                      </tr>
                                    ))}
                                    <tr style={{ borderTop: '1px solid var(--b1)' }}>
                                      <td style={{ padding: '6px 0' }}>Display <span style={{ fontSize: 10, color: 'var(--t3)' }}>· {Math.round((d.config?.displayPct || 0) * 100)}% of value</span></td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--t3)' }}>—</td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right' }}>{p.displayValue ? num(pts(p.displayValue)) + ' pts value' : '—'}</td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--t3)' }}>—</td>
                                      <td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--t3)' }}>{Math.round((d.config?.displayPct || 0) * 100)}%</td>
                                      <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 800, color: p.display > 0 ? 'var(--grn)' : undefined }}>{num(pts(p.display))}</td>
                                    </tr>
                                  </tbody>
                                </table>
                                {(p.effective?.projectSheets > 0 || p.effective?.latePaymentSheets > 0 || p.auto?.excluded?.units > 0 || p.auto?.returns?.units > 0 || (!p.auto?.lateFinal && p.auto?.atRiskUnits > 0)) && (
                                  <div style={{ marginTop: 8, fontSize: 11, color: 'var(--t2)', lineHeight: 1.6, display: 'grid', gap: 2 }}>
                                    {p.effective.projectSheets > 0 && <div><AlertOctagon size={11} style={{ verticalAlign: -1, marginRight: 4 }} color="#b45309" />Project sales: <b>{num(p.effective.projectSheets)}</b> laminate sheets under regular price count as {num(Math.round(p.effective.projectSheets * (d.config?.projectCredit ?? 0.5)))} → laminate credited {num(p.credited)} of {num(p.gross)} sold.{p.needsApproval ? <span style={{ color: '#b45309' }}> Payout awaits management approval.</span> : p.adjustments?.projectApproved ? <span style={{ color: 'var(--grn)' }}> Approved.</span> : ''}{!mine && p.adjustments?.projectApproved && !p.paid && <button className="btn" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 6 }} onClick={e => { e.stopPropagation(); approveProject(p, false); }}>withdraw</button>}</div>}
                                    {p.effective.latePaymentSheets > 0 && <div style={{ color: 'var(--red)' }}>Late payment: <b>{num(p.effective.latePaymentSheets)}</b> units forfeited — {p.auto?.lateDealers?.length ? p.auto.lateDealers.slice(0, 4).map(x => x.name).join(', ') + (p.auto.lateDealers.length > 4 ? ` +${p.auto.lateDealers.length - 4} more` : '') : 'entered by admin'} not cleared within {p.payout?.holdDays || 90} days. No proration: the whole sale earns nothing.</div>}
                                    {!p.auto?.lateFinal && p.auto?.atRiskUnits > 0 && <div style={{ color: '#b45309' }}>At risk: <b>{num(p.auto.atRiskUnits)}</b> units on {p.auto.lateDealers.length} dealer{p.auto.lateDealers.length === 1 ? '' : 's'} still outstanding for {monthLabel(d.month)}. Forfeit if not cleared by {fmtDay(p.payout?.holdEnd)}.</div>}
                                    {p.auto?.excluded?.units > 0 && <div style={{ color: 'var(--t3)' }}>Never counted: {num(p.auto.excluded.units)} units ({Object.entries(p.auto.excluded.byReason || {}).map(([k, n]) => `${k} ${num(n)}`).join(', ')}).</div>}
                                    {p.auto?.returns?.units > 0 && <div style={{ color: 'var(--t3)' }}>Returns reversed: {num(p.auto.returns.units)} units taken off this month.</div>}
                                  </div>
                                )}
                                <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--b1)', display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
                                  <span style={{ color: 'var(--t3)' }}>Earned <b style={{ color: 'var(--t1)' }}>{num(p.grossPoints)}</b></span>
                                  {p.clawback > 0 && <span style={{ color: 'var(--t3)' }}>Bad-debt recovery <b style={{ color: 'var(--red)' }}>−{num(pts(p.clawback))}</b></span>}
                                  {p.deduction > 0 && <span style={{ color: 'var(--t3)' }}>Deduction {Math.round((p.deductionPct || 0) * 100)}% <b style={{ color: 'var(--red)' }}>−{num(pts(p.deduction))}</b></span>}
                                  <span style={{ marginLeft: 'auto', fontWeight: 800, color: 'var(--grn)', fontSize: 14 }}>{num(p.points)} pts</span>
                                </div>
                                {!p.gateOpen && (
                                  <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 8, lineHeight: 1.5 }}>
                                    {p.gateAll
                                      ? 'Laminate basic not crossed, so nothing earns this month — laminate, other products and display alike.'
                                      : `Laminate is ${p.basic ? num(p.shortfall) + ' sheets' : 'without a target'} short of basic, so laminate earns nothing this month. Other products and display still earn above their own targets.`}
                                  </div>
                                )}
                                {p.badDebtOutstanding > 0 && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Bad debt still to recover: {money(p.badDebtOutstanding)}{p.clawback > 0 ? ` — ${money(p.clawback)} taken this month, ${money(Math.max(0, p.badDebtOutstanding - p.clawback))} carried forward` : ' — no earnings this month, so no deduction'}. Never more than the month's incentive.</div>}
                                {p.paid && <div style={{ fontSize: 11, color: 'var(--grn)', marginTop: 6 }}>Paid {fmtDay(String(p.paid.at).slice(0, 10))}{p.paid.by ? ` by ${p.paid.by}` : ''} · figures frozen at {num(p.points)} pts.{!mine && d.canPay && <button className="btn" style={{ fontSize: 10, padding: '1px 6px', marginLeft: 8 }} onClick={e => { e.stopPropagation(); unmarkPaid(p); }}>un-mark (superadmin)</button>}</div>}
                                {p.adjustments?.note && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Note: {p.adjustments.note}</div>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {people.length === 0 && <tr><td colSpan={6} style={{ padding: 20, textAlign: 'center', color: 'var(--t3)' }}>{mine ? 'No laminate target is set for you this month yet — ask your admin to set it under Sales by Category.' : 'No salesman has a laminate target this month.'}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {editing && <AdjustModal person={editing} month={d?.month} ppr={ppr} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {calc && d && <EstimateModal key={(people[0] || everyone[0])?.salesmanId + ':' + d.month} d={d} person={people[0] || everyone[0]} onClose={() => setCalc(false)} />}
    </div>
  );
}
