import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, AlertTriangle, RefreshCw, IndianRupee, Pencil, X,
         ArrowUpRight, ArrowDownRight, Package, Monitor, Layers, Award, Percent } from 'lucide-react';
import { PieChart, Pie, Cell, ComposedChart, Area, Line, XAxis, YAxis,
         CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

/**
 * Salesman incentive — the laminate-gated scheme.
 *
 * Deliberately a separate screen from the billing incentive: they share the
 * word and nothing else. This one pays rupees per sheet, has no points, and
 * everything hangs off one rule — clear the laminate basic target, or the
 * month pays nothing at all.
 *
 * The gate is the loudest thing on the screen because it is the only thing
 * that decides whether anything else on the row matters.
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

/** The four figures the sales data cannot supply, typed per salesman. */
function AdjustModal({ person, month, onClose, onSaved }) {
  const a = person.adjustments || {};
  const [f, setF] = useState({
    displayValue: a.displayValue || 0,
    projectSheets: a.projectSheets || 0,
    latePaymentSheets: a.latePaymentSheets || 0,
    badDebtOutstanding: a.badDebtOutstanding || 0,
    note: a.note || '',
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));

  const save = async () => {
    setBusy(true); setErr('');
    try {
      await api.salesIncentiveAdjSave({ month, salesmanId: person.salesmanId, ...f });
      onSaved();
    } catch (e) { setErr(e?.message || 'Could not save'); }
    finally { setBusy(false); }
  };

  const row = (label, key, hint, prefix) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                      textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {prefix && <span style={{ fontSize: 13, color: 'var(--t3)' }}>{prefix}</span>}
        <input type="number" min="0" value={f[key]}
               onChange={e => set(key, e.target.value)}
               style={{ flex: 1, fontSize: 13, padding: '7px 9px', borderRadius: 8,
                        border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>{hint}</div>
    </div>
  );

  return (
    <div onClick={onClose}
         style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 900,
                  display: 'grid', placeItems: 'center', padding: 18 }}>
      <div onClick={e => e.stopPropagation()} className="card"
           style={{ width: 'min(460px,100%)', maxHeight: '88vh', overflowY: 'auto', padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{person.name}</div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none',
                    cursor: 'pointer', color: 'var(--t3)', display: 'flex' }}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 14, lineHeight: 1.6 }}>
          None of these are in the sales data — an invoice line does not say whether it was
          discounted to project price, and nothing records when payment cleared. Type them in
          and the calculation uses them.
        </div>

        {row('Display value sold', 'displayValue', 'Panels, MS displays, DIY boxes sold to dealers. Earns 3%.', '₹')}
        {row('Project-sale sheets', 'projectSheets', 'Laminate sold ₹50 or more below regular price. Counts half toward target.')}
        {row('Late-payment sheets', 'latePaymentSheets', 'Laminate on sales not fully collected within 90 days. Earns nothing — the whole sale is forfeit.')}
        {row('Bad debt outstanding', 'badDebtOutstanding', '25% of each month’s incentive is recovered against this until it clears.', '₹')}

        <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                        textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>Note</label>
        <textarea value={f.note} onChange={e => set('note', e.target.value)} rows={2}
                  style={{ width: '100%', fontSize: 12, padding: '7px 9px', borderRadius: 8, resize: 'vertical',
                           border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />

        {err && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 8 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn btn-primary" disabled={busy} onClick={save}
                  style={{ fontSize: 12.5 }}>{busy ? 'Saving…' : 'Save'}</button>
          <button className="btn" onClick={onClose} style={{ fontSize: 12.5 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/**
 * The deduction, editable against the month's figures rather than buried in
 * the scheme. It is not part of the published rule — it is what is withheld
 * before payment — so it belongs where the payout is being read.
 */
function DeductionControl({ d, onSaved }) {
  const pct = Math.round((d.config?.deductionPct ?? 0) * 1000) / 10;
  const [draft, setDraft] = useState(String(pct));
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  useEffect(() => { setDraft(String(pct)); }, [pct]);

  const commit = async () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) { setDraft(String(pct)); return; }
    const v = Math.min(100, Math.max(0, n)) / 100;
    if (Math.abs(v - (d.config?.deductionPct ?? 0)) < 1e-9) return;
    setBusy(true); setErr('');
    try {
      await api.salesIncentiveConfigSave({ ...d.config, deductionPct: v });
      onSaved();
    } catch (e) { setErr(e?.message || 'Could not save'); setDraft(String(pct)); }
    finally { setBusy(false); }
  };

  return (
    <div className="card" style={{ padding: '11px 15px', marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
                     textTransform: 'uppercase', color: 'var(--t3)' }}>Deduction</span>
      <input type="number" min="0" max="100" step="1" value={draft} disabled={busy}
             onChange={e => setDraft(e.target.value)} onBlur={commit}
             onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
             style={{ width: 64, fontSize: 13, padding: '5px 8px', borderRadius: 7,
                      border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
      <span style={{ fontSize: 12, color: 'var(--t3)' }}>%</span>
      <span style={{ fontSize: 11, color: 'var(--t3)' }}>
        taken off after the bad-debt recovery
      </span>
      {busy && <span style={{ fontSize: 11, color: 'var(--t3)' }}>Saving…</span>}
      {err && <span style={{ fontSize: 11, color: 'var(--red)' }}>{err}</span>}
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
  const noTarget = (d?.people || []).filter(p => !p.basic);

  return (
    <div className="fade">
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div className="page-eyebrow">Salesman incentive</div>
        <div className="page-title">Laminate-gated scheme</div>
      </div>

      <div className="row" style={{ marginBottom: 14, gap: 8, alignItems: 'center' }}>
        <select value={d?.month || ''} onChange={e => setMonth(e.target.value)}
                style={{ fontSize: 12.5, padding: '6px 9px', borderRadius: 8,
                         border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }}>
          {(d?.months || []).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button className="btn" onClick={reload} disabled={busy}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <RefreshCw size={12} className={busy ? 'spin' : ''} /> Refresh
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                 style={{ fontSize: 12, padding: '5px 7px', borderRadius: 7,
                          border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
                 style={{ fontSize: 12, padding: '5px 7px', borderRadius: 7,
                          border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
          {(from || to) && (
            <button className="btn" title="Back to the whole month" style={{ fontSize: 11 }}
                    onClick={() => { setFrom(''); setTo(''); }}><X size={11} /></button>
          )}
        </div>
      </div>

      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5 }}>{err}</div>}
      {busy && !d && <div style={{ fontSize: 12.5, color: 'var(--t3)' }}>Loading…</div>}

      {d && d.month && (
        <>
          <DeductionControl d={d} onSaved={reload} />

          {d.range && (
            <div className="card" style={{ padding: '10px 15px', marginBottom: 14,
                  display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} color={d.range.days ? 'var(--acc)' : 'var(--yel,#ca8a04)'}
                             style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.55 }}>
                {d.range.days > 0 ? (
                  <>Showing <b>{d.range.from} to {d.range.to}</b> — {num(d.range.days)}
                    {d.range.days === 1 ? ' day' : ' days'} of invoice lines. Targets stay monthly,
                    so the gate is still measured against the whole {d.month} basic — expect it to
                    be shut for a short window.</>
                ) : (
                  <><b>No invoice lines between {d.range.from} and {d.range.to}.</b> A date window is
                    read from the ERP lines, which carry a date; the monthly rollup does not. Only
                    months whose lines were imported can be sliced by date.</>
                )}
              </div>
            </div>
          )}

          {/* ── headline ──────────────────────────────────────────── */}
          <div style={{ display: 'grid', gap: 12, marginBottom: 14,
                        gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>

            <div className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 11.5, color: 'var(--t2)', fontWeight: 650 }}>Payable this month</div>
              <div style={{ fontSize: 32, fontWeight: 850, color: 'var(--grn)', letterSpacing: '-.02em',
                            margin: '2px 0 4px', fontVariantNumeric: 'tabular-nums' }}>
                {money(d.totals.payable)}
              </div>
              {d.range
                ? <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{d.range.from} to {d.range.to}</div>
                : <Delta pct={d.change?.payable} />}
              {/* Every step shown, so a payout can be checked against the
                  scheme rather than taken on trust. */}
              <div style={{ marginTop: 10, fontSize: 11.5, textAlign: 'left' }}>
                {[
                  ['Earned by the scheme', money(d.totals.earned), 'var(--t2)'],
                  ...(d.totals.clawback > 0
                    ? [['Bad-debt recovery', '−' + money(d.totals.clawback), 'var(--red)']] : []),
                  ...(d.totals.deduction > 0
                    ? [[`Deduction ${Math.round((d.config?.deductionPct || 0) * 100)}%`,
                        '−' + money(d.totals.deduction), 'var(--red)']] : []),
                ].map(([label, value, tone]) => (
                  <div key={label} style={{ display: 'flex', gap: 8, padding: '3px 0' }}>
                    <span style={{ color: 'var(--t3)' }}>{label}</span>
                    <b style={{ marginLeft: 'auto', color: tone,
                                fontVariantNumeric: 'tabular-nums' }}>{value}</b>
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: 'var(--b1)', margin: '12px 0' }} />
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Points payable</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--acc)',
                                fontVariantNumeric: 'tabular-nums' }}>
                    {points(d.totals.points)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Last month</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--t2)',
                                fontVariantNumeric: 'tabular-nums' }}>
                    {d.previous ? money(d.previous.payable) : '—'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 9 }}>
                {d.config?.pointsPerRupee ? `${d.config.pointsPerRupee} points = ₹1` : ''}
              </div>
            </div>

            {/* who is through the gate — the only thing that decides whether
                anything else on this screen pays out */}
            <div className="card" style={{ padding: '15px 17px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 750 }}>The laminate gate</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 6 }}>
                Miss it and the month pays nothing at all
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 118, height: 118, position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie dataKey="value" nameKey="name" innerRadius={40} outerRadius={56}
                           paddingAngle={2} stroke="none"
                           data={[{ name: 'open', value: d.totals.gateOpen },
                                  { name: 'shut', value: Math.max(0, d.totals.people - d.totals.gateOpen) }]
                                 .filter(x => x.value > 0)}>
                        {[{ c: '#16a34a' }, { c: '#dc2626' }]
                          .slice(0, (d.totals.gateOpen > 0 ? 1 : 0) + (d.totals.people - d.totals.gateOpen > 0 ? 1 : 0))
                          .map((x, i) => <Cell key={i} fill={d.totals.gateOpen > 0 ? (i === 0 ? '#16a34a' : '#dc2626') : '#dc2626'} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'grid',
                                placeItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 19, fontWeight: 850,
                                    color: d.totals.gateOpen ? 'var(--grn)' : 'var(--red)' }}>
                        {d.totals.gateOpen}
                      </div>
                      <div style={{ fontSize: 9.5, color: 'var(--t3)' }}>of {d.totals.people}</div>
                    </div>
                  </div>
                </div>
                <div style={{ minWidth: 0, flex: 1, fontSize: 11.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9, background: '#16a34a' }} />
                    <span style={{ color: 'var(--t2)' }}>Cleared</span>
                    <b style={{ marginLeft: 'auto' }}>{d.totals.gateOpen}</b>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 9, background: '#dc2626' }} />
                    <span style={{ color: 'var(--t2)' }}>Shut</span>
                    <b style={{ marginLeft: 'auto' }}>{d.totals.people - d.totals.gateOpen}</b>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 9, lineHeight: 1.5 }}>
                    Everyone behind a shut gate earns zero — on laminate, other products and display alike.
                  </div>
                </div>
              </div>
            </div>

            {/* what needs doing */}
            <div className="card" style={{ padding: '15px 17px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 750, marginBottom: 10 }}>Needs attention</div>
              {noTarget.length > 0 && (
                <div style={{ display: 'flex', gap: 9, padding: '7px 0' }}>
                  <AlertTriangle size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                    <b>{noTarget.length} with no {d.config?.gateCategory?.toLowerCase()} target</b> —{' '}
                    {noTarget.map(p => p.name).join(', ')}. The gate cannot open without one, so they
                    earn nothing. Set targets in Sales by Category → Salesman-wise.
                  </div>
                </div>
              )}
              {d.totals.gateOpen === 0 && (
                <div style={{ display: 'flex', gap: 9, padding: '7px 0',
                              borderTop: noTarget.length ? '1px solid var(--b1)' : 'none' }}>
                  <Lock size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                    <b>Nobody has cleared the gate yet.</b> Part way through a month that is expected —
                    the target is a whole month's worth.
                  </div>
                </div>
              )}
              {d.totals.clawback > 0 && (
                <div style={{ display: 'flex', gap: 9, padding: '7px 0', borderTop: '1px solid var(--b1)' }}>
                  <AlertTriangle size={14} color="var(--yel,#ca8a04)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                    <b>{money(d.totals.clawback)} held back</b> against bad debt this month.
                  </div>
                </div>
              )}
              {!noTarget.length && d.totals.gateOpen > 0 && !d.totals.clawback && (
                <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Nothing to flag.</div>
              )}
            </div>
          </div>

          {/* ── KPI row ───────────────────────────────────────────── */}
          <div style={{ fontSize: 17, fontWeight: 800, margin: '18px 0 11px' }}>Where it comes from</div>
          <div style={{ display: 'grid', gap: 12, marginBottom: 14,
                        gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))' }}>
            <div className="card" style={{ padding: '15px 17px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 750 }}>Breakdown</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 12 }}>
                {d.month} against {d.previous?.month || 'nothing yet'}
              </div>
              <div style={{ display: 'grid', gap: 15, gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
                <KpiTile icon={Layers}      tint="#0891b2" label={d.config?.gateCategory || 'Laminate'}
                         value={money(d.totals.laminate)} />
                <KpiTile icon={Package}     tint="#ca8a04" label="Other products"
                         value={money(d.totals.products)} />
                <KpiTile icon={Monitor}     tint="#7c3aed" label="Display"
                         value={money(d.totals.display)} />
                <KpiTile icon={IndianRupee} tint="#16a34a" label="Units billed"
                         value={num(d.totals.units)} pct={d.range ? null : d.change?.units} />
                <KpiTile icon={Award}       tint="#4f46e5" label="Points payable"
                         value={points(d.totals.points)} />
                <KpiTile icon={Percent}     tint="#dc2626" label="Deducted"
                         value={money(d.totals.deduction)} />
              </div>
            </div>

            <div className="card" style={{ padding: '15px 17px', gridColumn: 'span 2', minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 750 }}>Six-month trend</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 6 }}>
                Units billed and what they paid
              </div>
              <div style={{ height: 172 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={d.trend} margin={{ top: 6, right: 0, left: -6, bottom: 0 }}>
                    <CartesianGrid stroke="var(--b1)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--t3)' }}
                           tickFormatter={m => m.slice(5) + '/' + m.slice(2, 4)}
                           axisLine={false} tickLine={false} />
                    <YAxis yAxisId="u" tick={{ fontSize: 10, fill: 'var(--t3)' }}
                           axisLine={false} tickLine={false} width={46} />
                    <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 10, fill: 'var(--t3)' }}
                           axisLine={false} tickLine={false} width={52} />
                    <Tooltip contentStyle={{ background: 'var(--bg1)', border: '1px solid var(--b1)',
                                             borderRadius: 8, fontSize: 11.5 }}
                             formatter={(v, n) => n === 'payable' ? [money(v), 'Payable'] : [num(v), 'Units']} />
                    <Area yAxisId="u" type="monotone" dataKey="units" stroke="#2563eb" strokeWidth={2}
                          fill="#2563eb" fillOpacity={0.14} />
                    <Line yAxisId="p" type="monotone" dataKey="payable" stroke="#16a34a" strokeWidth={2}
                          dot={{ r: 2.5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: 'var(--t3)', marginTop: 4 }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 9,
                                     background: '#2563eb', marginRight: 4 }} />Units</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 9,
                                     background: '#16a34a', marginRight: 4 }} />Payable</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 17, fontWeight: 800, margin: '18px 0 11px' }}>Every salesman</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {d.people.map(p => {
              const other = p.products.reduce((a, x) => a + x.amount, 0);
              const isOpen = !!open[p.salesmanId];
              return (
                <div key={p.salesmanId} className="card" style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {p.gateOpen
                      ? <Unlock size={15} color="var(--grn)" />
                      : <Lock size={15} color="var(--red)" />}
                    <div style={{ fontSize: 14.5, fontWeight: 750 }}>{p.name}</div>
                    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em',
                                   padding: '2px 7px', borderRadius: 5,
                                   color: p.gateOpen ? 'var(--grn)' : 'var(--red)',
                                   background: p.gateOpen ? 'rgba(22,163,74,.14)' : 'rgba(220,38,38,.12)' }}>
                      {p.gateOpen ? 'GATE OPEN' : p.basic ? `SHORT BY ${num(p.shortfall)}` : 'NO TARGET'}
                    </span>
                    <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                      laminate {num(p.credited)} / {num(p.basic)}
                    </span>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 850,
                                      color: p.payable > 0 ? 'var(--grn)' : 'var(--t3)',
                                      fontVariantNumeric: 'tabular-nums' }}>{money(p.payable)}</div>
                        <div style={{ fontSize: 10, color: 'var(--t3)' }}>
                          {p.points > 0 ? points(p.points) + ' pts' : ''}
                        </div>
                        {p.clawback > 0 && (
                          <div style={{ fontSize: 10, color: 'var(--red)' }}>
                            −{money(p.clawback)} bad debt
                          </div>
                        )}

                      </div>
                      <button className="btn" title="Display, project sales, late payment, bad debt"
                              onClick={() => setEditing(p)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                        <Pencil size={11} />
                      </button>
                      <button className="btn" style={{ fontSize: 11 }}
                              onClick={() => setOpen(o => ({ ...o, [p.salesmanId]: !isOpen }))}>
                        {isOpen ? 'Hide' : 'Detail'}
                      </button>
                    </div>
                  </div>

                  {/* progress toward the gate — the only thing that matters until it opens */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'var(--bg2)',
                                  overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, transition: 'width .3s',
                                    width: Math.min(100, p.basic ? (p.credited / p.basic) * 100 : 0) + '%',
                                    background: p.gateOpen ? 'var(--grn)' : 'var(--red)' }} />
                    </div>
                    {p.gateOpen && (
                      <span style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>
                        {num(p.laminate.excess)} above basic
                        {p.laminate.rate ? ` · ₹${p.laminate.rate}/sheet on all of it` : ' · starter tiers'}
                      </span>
                    )}
                  </div>

                  {isOpen && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--b1)', paddingTop: 11 }}>
                      {(p.project > 0 || p.late > 0) && (
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 9, lineHeight: 1.6 }}>
                          {num(p.gross)} sheets billed
                          {p.project > 0 && <> · {num(p.project)} project sales at half credit</>}
                          {p.late > 0 && <> · {num(p.late)} sheets forfeited for late payment</>}
                          {' '}→ <b>{num(p.credited)}</b> counted.
                        </div>
                      )}

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ textAlign: 'left', color: 'var(--t3)', fontSize: 9.5,
                                       letterSpacing: '.07em', textTransform: 'uppercase' }}>
                            <th style={{ padding: '4px 0' }}>Product</th>
                            <th style={{ padding: '4px 8px', textAlign: 'right' }}>Target</th>
                            <th style={{ padding: '4px 8px', textAlign: 'right' }}>Actual</th>
                            <th style={{ padding: '4px 8px', textAlign: 'right' }}>Above</th>
                            <th style={{ padding: '4px 8px', textAlign: 'right' }}>Rate</th>
                            <th style={{ padding: '4px 0', textAlign: 'right' }}>Earns</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderTop: '1px solid var(--b1)' }}>
                            <td style={{ padding: '5px 0', fontWeight: 650 }}>Laminate</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>{num(p.basic)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>{num(p.credited)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>{num(p.laminate.excess)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--t3)' }}>
                              {p.laminate.rate ? '₹' + p.laminate.rate : (p.gateOpen ? 'tiers' : '—')}
                            </td>
                            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700 }}>
                              {money(p.laminate.amount)}
                            </td>
                          </tr>
                          {p.products.map(x => (
                            <tr key={x.key} style={{ borderTop: '1px solid var(--b1)' }}>
                              <td style={{ padding: '5px 0' }}>
                                {x.label}
                                <span style={{ color: 'var(--t3)', fontSize: 10 }}> · {x.category}</span>
                              </td>
                              <td style={{ padding: '5px 8px', textAlign: 'right' }}>{num(x.target)}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'right' }}>{num(x.actual)}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'right' }}>{num(x.excess)}</td>
                              <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--t3)' }}>₹{x.rate}</td>
                              <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700 }}>
                                {money(x.amount)}
                              </td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '1px solid var(--b1)' }}>
                            <td style={{ padding: '5px 0' }}>Display <span style={{ color: 'var(--t3)', fontSize: 10 }}>· 3% of value</span></td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--t3)' }}>—</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right' }}>{money(p.displayValue)}</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--t3)' }}>—</td>
                            <td style={{ padding: '5px 8px', textAlign: 'right', color: 'var(--t3)' }}>3%</td>
                            <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700 }}>{money(p.display)}</td>
                          </tr>
                        </tbody>
                      </table>

                      {p.gateOpen && (
                        <div style={{ marginTop: 10, paddingTop: 9, borderTop: '1px solid var(--b1)',
                                      fontSize: 11.5 }}>
                          {[
                            ['Earned', money(p.earned), 'var(--t2)'],
                            ...(p.clawback > 0 ? [['Bad-debt recovery', '−' + money(p.clawback), 'var(--red)']] : []),
                            ...(p.deduction > 0 ? [[`Deduction ${Math.round((p.deductionPct || 0) * 100)}%`,
                                                    '−' + money(p.deduction), 'var(--red)']] : []),
                            ['Payable', money(p.payable) + '  ·  ' + points(p.points) + ' pts', 'var(--grn)'],
                          ].map(([l, v, tone]) => (
                            <div key={l} style={{ display: 'flex', gap: 8, padding: '2px 0' }}>
                              <span style={{ color: 'var(--t3)' }}>{l}</span>
                              <b style={{ marginLeft: 'auto', color: tone,
                                          fontVariantNumeric: 'tabular-nums' }}>{v}</b>
                            </div>
                          ))}
                        </div>
                      )}

                      {!p.gateOpen && (
                        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 9, lineHeight: 1.55 }}>
                          The gate is shut, so every figure above earns nothing this month — laminate,
                          other products and display alike. There is no partial credit below basic.
                        </div>
                      )}
                      {p.adjustments?.note && (
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>
                          Note: {p.adjustments.note}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {editing && (
        <AdjustModal person={editing} month={d.month}
                     onClose={() => setEditing(null)}
                     onSaved={() => { setEditing(null); reload(); }} />
      )}
    </div>
  );
}
