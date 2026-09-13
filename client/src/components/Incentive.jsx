import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IndianRupee, Trophy, Settings, TrendingUp, AlertTriangle, RefreshCw,
         Upload as UploadIcon, ArrowUpRight, ArrowDownRight, Package, Award,
         Users, CheckCircle2, UserX, X, CalendarClock, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ComposedChart, Area, Line, XAxis, YAxis,
         CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

/**
 * Incentive — what each billing person earned, in rupees and in points.
 *
 * Three views behind one nav group:
 *   this month   the scoreboard, with progress towards the next band
 *   history      month by month per person, so a trend is visible
 *   rule         rates, thresholds, opening averages, salesman mapping
 *
 * The figures all come from the server, which owns the rule (lib/incentive.js),
 * so what is displayed and what would be paid cannot drift apart.
 */

const money  = v => '₹' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num    = v => Number(v || 0).toLocaleString('en-IN');
// Whole rupees, for the narrow tiles — paise there only force the figure to
// wrap mid-number, and the exact amount is on the headline card anyway.
const money0 = v => '₹' + Math.round(Number(v || 0)).toLocaleString('en-IN');
const points = v => Number(v || 0).toLocaleString('en-IN');

// One colour per band, reused on the legend, the badges and the bars.
const BAND = {
  base: { label: 'Base',   c: '#0891b2', bg: 'rgba(8,145,178,.12)' },
  mid:  { label: 'Above',  c: '#ca8a04', bg: 'rgba(202,138,4,.14)' },
  top:  { label: 'Top',    c: '#16a34a', bg: 'rgba(22,163,74,.14)' },
};

const MEDAL = ['#f59e0b', '#94a3b8', '#b45309'];

/* ── shared data hook ─────────────────────────────────────────────── */
function useIncentive(month) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const [key, setKey]   = useState(0);
  useEffect(() => {
    let dead = false;
    setBusy(true); setErr('');
    api.ptxIncentive(month)
      .then(r => { if (!dead) setData(r); })
      .catch(e => { if (!dead) setErr(e?.message || 'Could not load incentives'); })
      .finally(() => { if (!dead) setBusy(false); });
    return () => { dead = true; };
  }, [month, key]);
  return { data, busy, err, reload: () => setKey(k => k + 1) };
}

function Stat({ label, value, tone, sub }) {
  return (
    <div style={{ padding: '13px 15px', borderRadius: 11, background: 'var(--bg1)',
                  border: '1px solid var(--b1)', minWidth: 0 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em',
                    textTransform: 'uppercase', color: 'var(--t3)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 3, color: tone || 'var(--t1)',
                    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function MonthPicker({ data, month, setMonth }) {
  if (!data?.months?.length) return null;
  return (
    <select className="sel" value={month || data.month} onChange={e => setMonth(e.target.value)}
      style={{ fontSize: 12 }}>
      {data.months.map(m => <option key={m} value={m}>{m}</option>)}
    </select>
  );
}

/* ── 0. dashboard ─────────────────────────────────────────────────── */
/**
 * The incentive home screen: what this month is worth, how it compares with
 * last month, where it came from and who is on what.
 *
 * Every figure comes from one call, so the headline, the chart and the
 * leaderboard cannot disagree with each other.
 */
function Delta({ pct, compact }) {
  if (pct === null || pct === undefined) return null;
  const up = pct >= 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5,
                   fontWeight: 700, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap',
                   color: up ? 'var(--grn)' : 'var(--red)',
                   background: up ? 'rgba(22,163,74,.12)' : 'rgba(220,38,38,.12)' }}>
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {Math.abs(pct)}%{compact ? '' : ' from last month'}
    </span>
  );
}

function KpiTile({ icon: Icon, tint, label, value, pct }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                    display: 'grid', placeItems: 'center',
                    background: tint + '1f', color: tint }}>
        <Icon size={16} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: 'var(--t2)', fontWeight: 600,
                      whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 800, margin: '1px 0 4px',
                      fontVariantNumeric: 'tabular-nums', lineHeight: 1.2,
                      overflowWrap: 'anywhere' }}>{value}</div>
        <Delta pct={pct} compact />
      </div>
    </div>
  );
}

/**
 * The two settings worth changing while looking at the figures: what is
 * deducted, and who is being paid. Both live here rather than on the Rule
 * screen because they are decisions taken against a month's numbers, not part
 * of the scheme itself — and both apply the moment they are saved.
 */
function Controls({ d, onSaved }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const pct = Math.round((d.config?.deductionPct ?? 0) * 1000) / 10;
  const [draft, setDraft] = useState(String(pct));
  useEffect(() => { setDraft(String(pct)); }, [pct]);

  const roster = d.config?.roster || [];
  const onCount = roster.filter(r => r.active !== false).length;

  const save = async (next) => {
    setBusy(true); setErr('');
    try {
      await api.ptxIncentiveConfigSave({ ...d.config, ...next });
      onSaved();
    } catch (e) { setErr(e?.message || 'Could not save'); }
    finally { setBusy(false); }
  };

  const commitPct = () => {
    const n = Number(draft);
    if (!Number.isFinite(n)) { setDraft(String(pct)); return; }
    const v = Math.min(100, Math.max(0, n)) / 100;
    if (Math.abs(v - (d.config?.deductionPct ?? 0)) < 1e-9) return;
    save({ deductionPct: v });
  };

  const toggle = (key) => save({
    roster: roster.map(r => r.key === key ? { ...r, active: r.active === false } : r),
  });

  return (
    <div className="card" style={{ padding: '11px 15px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em',
                         textTransform: 'uppercase', color: 'var(--t3)' }}>Deduction</span>
          <input type="number" min="0" max="100" step="1" value={draft} disabled={busy}
                 onChange={e => setDraft(e.target.value)}
                 onBlur={commitPct}
                 onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                 style={{ width: 64, fontSize: 13, padding: '5px 8px', borderRadius: 7,
                          border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>%</span>
        </div>

        <div style={{ width: 1, height: 20, background: 'var(--b1)' }} />

        <button className="btn" onClick={() => setOpen(o => !o)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <Users size={12} /> {onCount} of {roster.length} being paid
        </button>

        {busy && <span style={{ fontSize: 11, color: 'var(--t3)' }}>Saving…</span>}
        {err && <span style={{ fontSize: 11, color: 'var(--red)' }}>{err}</span>}
      </div>

      {open && (
        <div style={{ marginTop: 11, paddingTop: 10, borderTop: '1px solid var(--b1)' }}>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 9, lineHeight: 1.6 }}>
            Switching somebody off stops them being paid; their units are still stored and still
            counted as “not on the roster”, and their codes and spellings are kept so turning them
            back on needs nothing re-uploaded.
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {roster.map(r => {
              const on = r.active !== false;
              return (
                <button key={r.key} onClick={() => toggle(r.key)} disabled={busy}
                        title={on ? `Stop paying ${r.name || r.key}` : `Pay ${r.name || r.key}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                 fontSize: 12, fontWeight: 650, padding: '5px 10px', borderRadius: 7,
                                 background: on ? 'rgba(22,163,74,.12)' : 'var(--bg2)',
                                 color: on ? 'var(--grn)' : 'var(--t3)',
                                 border: '1px solid ' + (on ? 'rgba(22,163,74,.35)' : 'var(--b1)') }}>
                  {on ? <Check size={12} /> : <X size={12} />}
                  {r.name || r.key}
                  {r.code && <span style={{ opacity: .6, fontWeight: 400 }}>{r.code}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({ month, setMonth, currentUser }) {
  // A date window, for looking at what a run of daily uploads actually
  // contains. Empty means the whole month.
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');
  const ranged = !!(from && to && from <= to);
  const [d, setD]     = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [key, setKey] = useState(0);

  useEffect(() => {
    let dead = false;
    setBusy(true); setErr('');
    api.ptxIncentiveDashboard(month, ranged ? { from, to } : null)
      .then(r => { if (!dead) setD(r); })
      .catch(e => { if (!dead) setErr(e?.message || 'Could not load the dashboard'); })
      .finally(() => { if (!dead) setBusy(false); });
    return () => { dead = true; };
  }, [month, key, ranged, from, to]);

  // A month still running is not comparable with a finished one. On the 12th,
  // "down 76% from last month" is arithmetic about the calendar, not about how
  // anyone is doing — and uploading daily means seeing it every day. Say so
  // rather than letting the red number be read as a collapse.
  const today   = new Date();
  const nowKey  = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  const partial = d?.month === nowKey;
  const dayOf   = today.getDate();
  const daysIn  = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const who = (currentUser?.name || currentUser?.id || '').split(' ')[0];

  const donut = (d?.bands || []).filter(b => b.units > 0)
    .map(b => ({ name: BAND[b.band].label, value: b.units, band: b.band }));
  const totalUnits = d?.totals?.units || 0;

  return (
    <div className="fade">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12,
                    flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <div className="page-eyebrow">Billing incentive</div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-.02em' }}>
            {greet}{who ? `, ${who}` : ''}!
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                   style={{ fontSize: 12, padding: '5px 7px', borderRadius: 7,
                            border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
                   style={{ fontSize: 12, padding: '5px 7px', borderRadius: 7,
                            border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
            {(from || to) && (
              <button className="btn" title="Back to the whole month" style={{ fontSize: 11 }}
                      onClick={() => { setFrom(''); setTo(''); }}>
                <X size={11} />
              </button>
            )}
          </div>
          <MonthPicker data={d} month={month} setMonth={setMonth} />
          <button className="btn" onClick={() => setKey(k => k + 1)} disabled={busy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
            <RefreshCw size={12} className={busy ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5 }}>{err}</div>}
      {busy && !d && <div style={{ fontSize: 12.5, color: 'var(--t3)' }}>Loading…</div>}

      {d && d.month && (
        <>
          <Controls d={d} onSaved={() => setKey(k => k + 1)} />

          {/* ── headline row ───────────────────────────────────────── */}
          <div style={{ display: 'grid', gap: 12, marginBottom: 14,
                        gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>

            {/* earnings — the number everyone comes here for */}
            <div className="card" style={{ padding: '18px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 11.5, color: 'var(--t2)', fontWeight: 650 }}>Points payable</div>
              <div style={{ fontSize: 32, fontWeight: 850, color: 'var(--acc)',
                            letterSpacing: '-.02em', margin: '2px 0 4px',
                            fontVariantNumeric: 'tabular-nums' }}>
                {points(d.totals.points)}
              </div>
              {/* The deduction is shown as its own line, never left to be
                  inferred from a difference between two numbers. */}
              {d.totals.grossPoints > d.totals.points && (
                <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 4 }}>
                  {points(d.totals.grossPoints)} earned
                  <span style={{ color: 'var(--red)' }}>
                    {' '}− {points(d.totals.grossPoints - d.totals.points)}
                    {' '}({Math.round((d.config?.deductionPct || 0) * 100)}% deduction)
                  </span>
                </div>
              )}
              {d.range
                ? <div style={{ fontSize: 10.5, color: 'var(--t3)', lineHeight: 1.5 }}>
                    {d.range.from} to {d.range.to}
                  </div>
                : partial
                ? <div style={{ fontSize: 10.5, color: 'var(--t3)', lineHeight: 1.5 }}>
                    Day {dayOf} of {daysIn} — still running, so it is not
                    comparable with a full month yet
                  </div>
                : <Delta pct={d.change?.points} />}
              <div style={{ height: 1, background: 'var(--b1)', margin: '14px 0' }} />
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Units billed</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--t1)',
                                fontVariantNumeric: 'tabular-nums' }}>{num(d.totals.units)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>Last month</div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--t2)',
                                fontVariantNumeric: 'tabular-nums' }}>
                    {d.previous ? points(d.previous.points) : '—'}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 10 }}>
                {d.config ? `${d.config.pointsPerRupee} points = ₹1` : ''}
              </div>
            </div>

            {/* top earners */}
            <div className="card" style={{ padding: '15px 17px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 750 }}>Top earners</div>
                <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--t3)' }}>
                  {num(d.totals.people)} people
                </span>
              </div>
              {d.people.slice(0, 4).map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 9,
                      padding: '7px 0', borderTop: i ? '1px solid var(--b1)' : 'none' }}>
                  <Trophy size={14} color={MEDAL[i] || 'var(--t3)'} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, overflow: 'hidden',
                                  textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--t3)' }}>
                      {num(p.units)} units
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--acc)',
                                fontVariantNumeric: 'tabular-nums' }}>
                    {points(p.points)} pts
                  </div>
                </div>
              ))}
              {d.people.length === 0 && (
                <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Nothing billed in {d.month}.</div>
              )}
            </div>

            {/* things that would make the payout wrong */}
            <div className="card" style={{ padding: '15px 17px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 750, marginBottom: 10 }}>Needs attention</div>

              {d.noHistory?.length > 0 && (
                <div style={{ display: 'flex', gap: 9, padding: '7px 0' }}>
                  <AlertTriangle size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                    <b>{d.noHistory.length} with no history</b> — {d.noHistory.join(', ')}.
                    They are measured against nothing, so every unit pays the top rate.
                    Upload earlier months, or set an opening average on the Rule screen.
                  </div>
                </div>
              )}

              {d.offRoster?.length > 0 && (
                <div style={{ display: 'flex', gap: 9, padding: '7px 0',
                              borderTop: d.noHistory?.length ? '1px solid var(--b1)' : 'none' }}>
                  <UserX size={14} color="var(--t3)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11.5, lineHeight: 1.5, minWidth: 0, flex: 1 }}>
                    <b>{num(d.offRoster.reduce((a, o) => a + o.units, 0))} units not on the roster</b>
                    {' '}— stored but not paid.
                    {/* Listed one per line rather than run together: these are
                        people whose pay is being withheld, and the decision to
                        add one needs each name and figure legible. */}
                    <div style={{ marginTop: 6 }}>
                      {d.offRoster.map(o => (
                        <div key={o.person} style={{ display: 'flex', gap: 8, alignItems: 'baseline',
                              padding: '2px 0', borderTop: '1px solid var(--b1)' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis',
                                         whiteSpace: 'nowrap' }}>{o.person}</span>
                          <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums',
                                         color: 'var(--t2)', fontWeight: 700 }}>{num(o.units)}</span>
                          <span style={{ color: 'var(--t3)', fontSize: 10.5 }}>units</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ color: 'var(--t3)', marginTop: 6, fontSize: 11 }}>
                      Add a name on the Rule screen if it should be paid.
                    </div>
                  </div>
                </div>
              )}

              {d.unassigned?.units > 0 && (
                <div style={{ display: 'flex', gap: 9, padding: '7px 0',
                              borderTop: (d.noHistory?.length || d.offRoster?.length) ? '1px solid var(--b1)' : 'none' }}>
                  <AlertTriangle size={14} color="var(--yel,#ca8a04)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                    <b>{num(d.unassigned.units)} units unassigned</b> — nobody is credited for them.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 9, padding: '7px 0',
                            borderTop: (d.noHistory?.length || d.unassigned?.units || d.offRoster?.length) ? '1px solid var(--b1)' : 'none' }}>
                {d.source === 'upload'
                  ? <CheckCircle2 size={14} color="var(--grn)" style={{ flexShrink: 0, marginTop: 1 }} />
                  : <AlertTriangle size={14} color="var(--t3)" style={{ flexShrink: 0, marginTop: 1 }} />}
                <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                  {d.source === 'upload'
                    ? <>These figures come from an <b>uploaded sheet</b>.</>
                    : <>No sheet uploaded for {d.month} — these come from the <b>ERP invoice lines</b>.</>}
                </div>
              </div>

              {!d.noHistory?.length && !d.unassigned?.units && !d.offRoster?.length && d.source === 'upload' && (
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
                  Nothing else to flag.
                </div>
              )}
            </div>
          </div>

          {d.range && (
            <div className="card" style={{ padding: '10px 15px', marginBottom: 14,
                  display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <CalendarClock size={14} color="var(--acc)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.55 }}>
                Showing <b>{d.range.from} to {d.range.to}</b> — {num(d.range.days)}
                {d.range.days === 1 ? ' day' : ' days'} of billing.
                Each person is still measured against their {d.month} target, because the rule is
                monthly; a window this size has no target of its own.
                {d.range.missingMonths?.length > 0 && (
                  <> Nothing is stored day by day for {d.range.missingMonths.join(', ')}, so those
                     months contribute nothing to this window.</>
                )}
              </div>
            </div>
          )}

          {!d.range && partial && (
            <div className="card" style={{ padding: '10px 15px', marginBottom: 14,
                  display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <CalendarClock size={14} color="var(--t3)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.55 }}>
                <b>{d.month} is only {dayOf} days in.</b> Everyone is measured against a full
                month's average, so part way through a month most people sit in the base band and
                the payout below is what they have earned <i>so far</i>, not what the month will pay.
              </div>
            </div>
          )}

          {/* ── KPI row ────────────────────────────────────────────── */}
          <div style={{ fontSize: 17, fontWeight: 800, margin: '18px 0 11px' }}>KPI dashboard</div>

          <div style={{ display: 'grid', gap: 12, marginBottom: 14,
                        gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))' }}>

            {/* attainment donut */}
            <div className="card" style={{ padding: '15px 17px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 750 }}>Attainment summary</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 6 }}>
                Units by rate band, {d.month}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 132, height: 132, position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donut} dataKey="value" nameKey="name"
                           innerRadius={44} outerRadius={62} paddingAngle={2} stroke="none">
                        {donut.map(e => <Cell key={e.band} fill={BAND[e.band].c} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', inset: 0, display: 'grid',
                                placeItems: 'center', pointerEvents: 'none' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 9.5, color: 'var(--t3)' }}>Total</div>
                      <div style={{ fontSize: 16, fontWeight: 800,
                                    fontVariantNumeric: 'tabular-nums' }}>{num(totalUnits)}</div>
                    </div>
                  </div>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {(d.bands || []).map(b => (
                    <div key={b.band} style={{ marginBottom: 9 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 9,
                                       background: BAND[b.band].c, flexShrink: 0 }} />
                        <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{BAND[b.band].label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--t3)' }}>
                          {b.people} {b.people === 1 ? 'person' : 'people'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, marginLeft: 14,
                                    fontVariantNumeric: 'tabular-nums' }}>{points(b.points)} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* metric tiles */}
            <div className="card" style={{ padding: '15px 17px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 750 }}>Performance metrics</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 12 }}>
                {d.range
                  ? `${num(d.range.days)} ${d.range.days === 1 ? 'day' : 'days'} selected`
                  : partial
                  ? `${d.month} so far — day ${dayOf} of ${daysIn}`
                  : `${d.month} against ${d.previous?.month || 'nothing yet'}`}
              </div>
              <div style={{ display: 'grid', gap: 15,
                            gridTemplateColumns: 'repeat(2,minmax(0,1fr))' }}>
                <KpiTile icon={Package}     tint="#0891b2" label="Units billed"
                         value={num(d.totals.units)}     pct={(partial || d.range) ? null : d.change?.units} />
                <KpiTile icon={Award}       tint="#7c3aed" label="Points"
                         value={points(d.totals.points)} pct={(partial || d.range) ? null : d.change?.points} />
                <KpiTile icon={Trophy}      tint="#16a34a" label="Best today"
                         value={d.people[0] ? points(d.people[0].points) : '—'} />
                <KpiTile icon={Users}       tint="#ca8a04" label="People"
                         value={num(d.totals.people)}    pct={partial ? null : d.change?.people} />
              </div>
            </div>

            {/* six-month trend */}
            <div className="card" style={{ padding: '15px 17px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 750 }}>Six-month trend</div>
              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginBottom: 6 }}>
                Units billed and points earned
              </div>
              <div style={{ height: 168 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={d.trend} margin={{ top: 6, right: 0, left: -6, bottom: 0 }}>
                    <CartesianGrid stroke="var(--b1)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--t3)' }}
                           tickFormatter={m => m.slice(5) + '/' + m.slice(2, 4)}
                           axisLine={false} tickLine={false} />
                    {/* Points are a multiple of units, so sharing one axis
                        flattens the units line into the floor. */}
                    <YAxis yAxisId="u" tick={{ fontSize: 10, fill: 'var(--t3)' }}
                           axisLine={false} tickLine={false} width={44} />
                    <YAxis yAxisId="p" orientation="right" tick={{ fontSize: 10, fill: 'var(--t3)' }}
                           axisLine={false} tickLine={false} width={44} />
                    <Tooltip
                      contentStyle={{ background: 'var(--bg1)', border: '1px solid var(--b1)',
                                      borderRadius: 8, fontSize: 11.5 }}
                      formatter={(v, n) => n === 'points' ? [points(v), 'Points'] : [num(v), 'Units']} />
                    <Area yAxisId="u" type="monotone" dataKey="units" stroke="#2563eb" strokeWidth={2}
                          fill="#2563eb" fillOpacity={0.14} />
                    <Line yAxisId="p" type="monotone" dataKey="points" stroke="#7c3aed" strokeWidth={2}
                          dot={{ r: 2.5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: 'var(--t3)', marginTop: 4 }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 9,
                                     background: '#2563eb', marginRight: 4 }} />Units</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 9,
                                     background: '#7c3aed', marginRight: 4 }} />Points</span>
              </div>
            </div>
          </div>

          {/* ── leaderboard ────────────────────────────────────────── */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <div style={{ padding: '14px 17px 10px', fontSize: 12.5, fontWeight: 750 }}>
              Everyone in {d.month}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--t3)', fontSize: 10,
                             letterSpacing: '.07em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '8px 16px' }}>Person</th>
                  <th style={{ padding: '8px 16px', textAlign: 'right' }}>Units</th>
                  <th style={{ padding: '8px 16px', textAlign: 'right' }}>Target</th>
                  <th style={{ padding: '8px 16px' }}>Band</th>
                  <th style={{ padding: '8px 16px' }}>Next step</th>
                  <th style={{ padding: '8px 16px', textAlign: 'right' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {d.people.map((p, i) => {
                  const band = BAND[p.band] || BAND.base;
                  return (
                    <tr key={p.name} style={{ borderTop: '1px solid var(--b1)' }}>
                      <td style={{ padding: '9px 16px', fontWeight: 650 }}>
                        {i < 3 && <Trophy size={12} color={MEDAL[i]}
                                    style={{ verticalAlign: -1, marginRight: 5 }} />}
                        {p.name}
                      </td>
                      <td style={{ padding: '9px 16px', textAlign: 'right',
                                   fontVariantNumeric: 'tabular-nums' }}>{num(p.units)}</td>
                      <td style={{ padding: '9px 16px', textAlign: 'right',
                                   fontVariantNumeric: 'tabular-nums' }}>
                        {num(p.target)}
                        {/* The target is the average lifted by the uplift, so
                            showing the average underneath makes the number
                            explainable to the person being measured by it. */}
                        <div style={{ fontSize: 9.5,
                                      color: p.averageSource === 'none' ? 'var(--red)' : 'var(--t3)' }}>
                          {p.averageSource === 'none' ? 'no history'
                            : `${num(p.average)} avg · ${p.monthsOfHistory} mo`}
                        </div>
                      </td>
                      <td style={{ padding: '9px 16px' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em',
                                       padding: '2px 7px', borderRadius: 5,
                                       color: band.c, background: band.bg }}>{band.label}</span>
                      </td>
                      <td style={{ padding: '9px 16px', fontSize: 11, color: 'var(--t3)' }}>
                        {p.next ? `${num(p.next.unitsAway)} more → +${points(p.next.points)} pts` : 'top band'}
                      </td>
                      {/* One figure per person: what they are paid. The
                          deduction is the same for everybody, so a column of it
                          repeated down the page said nothing a single line in
                          the summary does not. */}
                      <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 800,
                                   color: 'var(--acc)', fontVariantNumeric: 'tabular-nums' }}>
                        {points(p.points)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {d && !d.month && (
        <div className="card" style={{ fontSize: 12.5, color: 'var(--t3)' }}>
          Nothing to show yet. Upload a voucher transaction report on the <b>Upload sheet</b> screen.
        </div>
      )}
    </div>
  );
}

/* ── 1. this month ────────────────────────────────────────────────── */
function ThisMonth({ month, setMonth }) {
  const { data, busy, err, reload } = useIncentive(month);
  const c = data?.config;

  return (
    <div className="fade">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div className="page-eyebrow">Billing incentive</div>
        <div className="page-title">This month</div>
      </div>

      <div className="row" style={{ marginBottom: 14, gap: 8 }}>
        <MonthPicker data={data} month={month} setMonth={setMonth} />
        <button className="btn" onClick={reload} disabled={busy}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <RefreshCw size={12} className={busy ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5 }}>{err}</div>}
      {busy && !data && <div style={{ fontSize: 12.5, color: 'var(--t3)' }}>Loading…</div>}

      {data && (
        <>
          <div style={{ display: 'grid', gap: 10, marginBottom: 16,
                        gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
            <Stat label="Total points" value={points(data.totals.points)} tone="var(--acc)"
                  sub={c ? `${c.pointsPerRupee} points = ₹1` : ''} />
            <Stat label="Units billed" value={num(data.totals.units)} />
            <Stat label="People" value={num(data.totals.people)}
                  sub={data.unassigned?.units > 0 ? `${num(data.unassigned.units)} units unassigned` : 'all units credited'} />
          </div>

          {c && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 8,
                          gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
              {[
                ['base', 'Up to your average',        `₹${c.rateLow.toFixed(2)} per unit`],
                ['mid',  `Next ${num(c.bandWidth)}`,  `average at ₹${c.rateLow.toFixed(2)}, rest at ₹${c.rateHigh.toFixed(2)}`],
                ['top',  `Beyond that`,               `every unit at ₹${c.rateHigh.toFixed(2)}`],
              ].map(([b, head, sub]) => (
                <div key={b} style={{ padding: '9px 12px', borderRadius: 9,
                      background: BAND[b].bg, border: '1px solid ' + BAND[b].c + '44' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: BAND[b].c }}>{head}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--t2)', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>
          )}

          {c && c.rateHigh > c.rateLow && (
            <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 16 }}>
              Each person is measured against their own average of the last {c.lookbackMonths} months.
              Passing the second threshold re-prices <b>everything</b> already billed, so the payout
              jumps there rather than rising smoothly.
            </div>
          )}

          {data.people.length === 0 && (
            <div className="card" style={{ fontSize: 12.5, color: 'var(--t3)' }}>
              Nothing billed in {data.month}.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {data.people.map((p, i) => {
              const band = BAND[p.band] || BAND.base;
              const ceiling = p.band === 'base' ? p.base : p.top;
              const pctFull = p.band === 'top' ? 100
                : Math.max(3, Math.min(100, Math.round((p.units / Math.max(1, ceiling)) * 100)));
              return (
                <div key={p.name} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    {i < 3 && <Trophy size={15} color={MEDAL[i]} />}
                    <div style={{ fontSize: 15, fontWeight: 750 }}>{p.name}</div>
                    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em',
                                   padding: '2px 7px', borderRadius: 5,
                                   color: band.c, background: band.bg }}>{band.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                      target {num(p.target)}
                      {p.averageSource === 'opening' && ' (opening figure)'}
                      {p.averageSource === 'none' && ' (no history yet)'}
                      {p.averageSource === 'history' && ` · ${p.monthsOfHistory}mo average`}
                    </span>
                    <div style={{ flex: 1 }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--acc)',
                                    fontVariantNumeric: 'tabular-nums' }}>{points(p.points)} pts</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{num(p.units)} units</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, minWidth: 64,
                                   fontVariantNumeric: 'tabular-nums' }}>{num(p.units)}</span>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg2)', overflow: 'hidden' }}>
                      <div style={{ width: pctFull + '%', height: '100%', borderRadius: 4,
                                    background: band.c, transition: 'width .3s' }} />
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--t3)', minWidth: 92, textAlign: 'right' }}>
                      {num(p.invoices)} inv · {(p.reps || []).length} reps
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--t3)' }}>{p.detail}</span>
                    {p.next && (
                      <span style={{ fontSize: 11, color: band.c, fontWeight: 700 }}>
                        {num(p.next.unitsAway)} more → +{points(p.next.points)} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {data.unassigned?.units > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 14, lineHeight: 1.75,
                          padding: '11px 13px', borderRadius: 9,
                          background: 'rgba(251,191,36,.09)', border: '1px solid rgba(251,191,36,.3)' }}>
              <AlertTriangle size={12} style={{ verticalAlign: -2, color: 'var(--yel)' }} />
              {' '}<b style={{ color: 'var(--yel)' }}>{num(data.unassigned.units)} units earn nothing</b>
              {' '}— no billing person on these lines.
              <div style={{ marginTop: 6, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {(data.unassigned.salesmen || []).map(u => (
                  <span key={u.salesmanId} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 999,
                        background: 'var(--bg2)', border: '1px solid var(--b1)' }}>
                    {u.salesmanId} <b>{num(u.units)}</b>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── 2. history ───────────────────────────────────────────────────── */
function History({ month, setMonth }) {
  const { data, busy, err } = useIncentive(month);
  const cols = data ? [...(data.lookback || []), data.month] : [];

  const cell = { padding: '8px 10px', borderBottom: '1px solid var(--b1)', whiteSpace: 'nowrap' };
  const th = { ...cell, fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase',
               letterSpacing: '.07em', fontWeight: 700, textAlign: 'right' };

  return (
    <div className="fade">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div className="page-eyebrow">Billing incentive</div>
        <div className="page-title">History</div>
      </div>
      <div className="row" style={{ marginBottom: 14 }}>
        <MonthPicker data={data} month={month} setMonth={setMonth} />
      </div>

      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5 }}>{err}</div>}
      {busy && !data && <div style={{ fontSize: 12.5, color: 'var(--t3)' }}>Loading…</div>}

      {data && (
        <div className="card">
          <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 10 }}>
            Units billed per month. The bar each person has to beat is the average of the
            months shown before {data.month} — blank months are left out of that average
            rather than counted as zero.
          </div>
          <div className="scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5,
                            fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: 'left' }}>Person</th>
                  {cols.map(m => (
                    <th key={m} style={{ ...th, color: m === data.month ? 'var(--acc)' : 'var(--t3)' }}>
                      {m === data.month ? m + ' ★' : m}
                    </th>
                  ))}
                  <th style={th}>Bar</th>
                  <th style={th}>Points</th>
                </tr>
              </thead>
              <tbody>
                {data.people.map((p, i) => {
                  const byMonth = Object.fromEntries((p.history || []).map(h => [h.month, h.units]));
                  return (
                    <tr key={p.name} style={{ background: i % 2 ? 'var(--bg2)' : 'transparent' }}>
                      <td style={{ ...cell, fontWeight: 700 }}>{p.name}</td>
                      {cols.map(m => {
                        const v = m === data.month ? p.units : (byMonth[m] || 0);
                        return (
                          <td key={m} style={{ ...cell, textAlign: 'right',
                                color: v ? (m === data.month ? 'var(--acc)' : 'var(--t1)') : 'var(--t3)',
                                fontWeight: m === data.month ? 800 : 400 }}>
                            {v ? num(v) : '—'}
                          </td>
                        );
                      })}
                      <td style={{ ...cell, textAlign: 'right', color: 'var(--t3)' }}>{num(p.base)}</td>
                      <td style={{ ...cell, textAlign: 'right', fontWeight: 800, color: 'var(--acc)' }}>
                        {points(p.points)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 3. rule & setup ──────────────────────────────────────────────── */
function Rule() {
  const [cfg, setCfg]   = useState(null);
  // What the server last confirmed. Anything different from this is unsaved,
  // and the screen says so — removing a person makes the row vanish at once,
  // which reads as done when nothing has been stored yet.
  const [saved, setSaved] = useState(null);
  const [ids, setIds]   = useState([]);
  const [people, setPeople] = useState([]);
  const [defs, setDefs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const [ok, setOk]     = useState('');

  const load = useCallback(() => {
    Promise.all([api.ptxIncentiveConfig(), api.ptxIncentive('')])
      .then(([c, inc]) => {
        setCfg(c.config); setSaved(c.config); setIds(c.salesmanIds || []); setDefs(c.defaults);
        setPeople((inc?.people || []).map(p => p.name));
      })
      .catch(e => setErr(e?.message || 'Could not load the rule'));
  }, []);
  useEffect(load, [load]);

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));
  const setMap = (id, person) => setCfg(c => {
    const m = { ...c.mapping };
    if (person) m[id] = person; else delete m[id];
    return { ...c, mapping: m };
  });
  // A roster entry is a person: the stored key, what HR calls them, their
  // employee code, and every spelling the ERP has written for them.
  const addToRoster = (raw) => setCfg(c => {
    const name = String(raw || '').trim();
    if (!name) return c;
    const r = c.roster || [];
    // The key is what history is filed under. For a new person it is their
    // first word, which is what the ERP tends to write.
    const key = name.split(/\s+/)[0];
    if (r.some(x => (x.key || '').toLowerCase() === key.toLowerCase())) return c;
    return { ...c, roster: [...r, { key, code: '', name, aliases: [] }] };
  });
  const dropFromRoster = (key) => setCfg(c => ({
    ...c, roster: (c.roster || []).filter(x => x.key !== key),
  }));
  const setPerson = (key, field, value) => setCfg(c => ({
    ...c,
    roster: (c.roster || []).map(x => x.key === key
      ? { ...x, [field]: field === 'aliases'
          ? String(value).split(',').map(v => v.trim().toLowerCase()).filter(Boolean)
          : value }
      : x),
  }));

  const setOpening = (name, v) => setCfg(c => {
    const o = { ...(c.openingAverage || {}) };
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) o[name] = Math.round(n); else delete o[name];
    return { ...c, openingAverage: o };
  });

  const save = async () => {
    setBusy(true); setErr(''); setOk('');
    try {
      const r = await api.ptxIncentiveConfigSave(cfg);
      setCfg(r.config);                 // show what was stored, not what was typed
      setSaved(r.config);
      setOk('Saved.');
      setTimeout(() => setOk(''), 2500);
    } catch (e) { setErr(e?.message || 'Save failed'); }
    setBusy(false);
  };

  if (!cfg) return <div style={{ fontSize: 12.5, color: 'var(--t3)' }}>{err || 'Loading…'}</div>;

  const dirty = !!saved && JSON.stringify(cfg) !== JSON.stringify(saved);
  const changeSummary = (() => {
    if (!dirty) return '';
    // Named the way the person is named on screen, not by the stored key —
    // "removing Gajender" is not obviously the same as the row just deleted.
    const nameOf = k => ([...(saved.roster || []), ...(cfg.roster || [])]
      .find(r => r.key === k)?.name) || k;
    const was = (saved.roster || []).map(r => r.key);
    const now = (cfg.roster || []).map(r => r.key);
    const gone = was.filter(k => !now.includes(k)).map(nameOf);
    const added = now.filter(k => !was.includes(k)).map(nameOf);
    const bits = [];
    if (gone.length)  bits.push(`removing ${gone.join(', ')}`);
    if (added.length) bits.push(`adding ${added.join(', ')}`);
    if (!bits.length) bits.push('rates or figures changed');
    return bits.join(' · ') + '. Press Save rule to apply it.';
  })();

  // Everyone on the roster, plus anyone who already has an opening figure or
  // is named in the fallback mapping. Roster first so a person who has not
  // billed yet — exactly the case an opening average exists for — still has a
  // box to type in.
  const knownPeople = [...new Set([
    ...(cfg.roster || []).map(r => r.key),
    ...people, ...Object.values(cfg.mapping || {}),
    ...Object.keys(cfg.openingAverage || {}),
  ].filter(Boolean))].sort();
  const labelFor = (key) => {
    const r = (cfg.roster || []).find(x => x.key === key);
    return r?.name || key;
  };
  // Percentages are stored as fractions (0.10) but read and typed as whole
  // numbers, because "10" is how the rule is spoken and 0.1 invites a
  // factor-of-100 slip on a field that decides what people are paid.
  const pctField = (label, key, hint) => (
    <div>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                      textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 5 }}>{label}</label>
      <input type="number" step="1" min="0" max="100"
             value={Math.round((cfg[key] ?? 0) * 1000) / 10}
             onChange={e => {
               const n = Number(e.target.value);
               set(key, Number.isFinite(n) ? Math.min(100, Math.max(0, n)) / 100 : 0);
             }}
             style={{ width: '100%', fontSize: 13, padding: '7px 9px', borderRadius: 8,
                      border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>{hint}</div>
    </div>
  );

  const upliftField = () => (
    <div>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                      textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 5 }}>Target uplift %</label>
      <input type="number" step="1" min="0"
             value={Math.round((cfg.targetUplift ?? 0) * 1000) / 10}
             onChange={e => {
               const n = Number(e.target.value);
               set('targetUplift', Number.isFinite(n) && n >= 0 ? n / 100 : 0);
             }}
             style={{ width: '100%', fontSize: 13, padding: '7px 9px', borderRadius: 8,
                      border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>added to the average</div>
    </div>
  );

  const field = (label, key, step, hint) => (
    <div>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                      textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 5 }}>{label}</label>
      <input type="number" className="inp" min="0" step={step} value={cfg[key]}
        onChange={e => set(key, e.target.value)} style={{ width: '100%' }} />
      <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>{hint}</div>
    </div>
  );

  return (
    <div className="fade">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div className="page-eyebrow">Billing incentive</div>
        <div className="page-title">Rule &amp; setup</div>
      </div>

      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Rates and thresholds</div>
        <div style={{ display: 'grid', gap: 12, marginBottom: 12,
                      gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
          {field('Low rate ₹',   'rateLow',        '0.05', 'per unit up to the target')}
          {field('High rate ₹',  'rateHigh',       '0.05', 'per unit above it')}
          {field('Band width',   'bandWidth',      '50',   'how far the middle band runs')}
          {field('Lookback',     'lookbackMonths', '1',    'months the average covers')}
          {upliftField()}
          {field('Points per ₹', 'pointsPerRupee', '1',    'how many points one rupee is')}
          {field('Minimum bar',  'minAverage',     '10',   'floor for a thin record')}
        </div>
        {/* Read-only on purpose: the deduction is changed on the dashboard,
            against the month's figures. It is repeated here so the rule can be
            read in one place without having to remember it. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                      padding: '8px 12px', borderRadius: 9, background: 'var(--bg2)' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                         textTransform: 'uppercase', color: 'var(--t3)' }}>Deduction</span>
          <b style={{ fontSize: 13 }}>{Math.round((cfg.deductionPct ?? 0) * 1000) / 10}%</b>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>
            taken off before payment — change it on the Dashboard
          </span>
        </div>

        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.7,
                      padding: '9px 12px', background: 'var(--bg2)', borderRadius: 8 }}>
          {(() => {
            // Worked through with the live settings, so the example can never
            // describe a rule the system is not actually applying.
            const avg = 2000;
            const target = Math.round(avg * (1 + (cfg.targetUplift ?? 0)));
            const top = target + cfg.bandWidth;
            const at = u => u > top ? u * cfg.rateHigh
                          : u > target ? target * cfg.rateLow + (u - target) * cfg.rateHigh
                          : u * cfg.rateLow;
            const pts = u => Math.round(at(u) * (1 - (cfg.deductionPct ?? 0)) * cfg.pointsPerRupee);
            return (<>
              Someone averaging <b>{num(avg)}</b> over the last {cfg.lookbackMonths} months has a
              target of <b>{num(target)}</b> (+{Math.round((cfg.targetUplift ?? 0) * 100)}%).
              They take home <b>{num(pts(target))} points</b> at {num(target)} units,{' '}
              <b>{num(pts(top))}</b> at {num(top)}, and <b>{num(pts(top + 1))}</b> at {num(top + 1)} —
              one unit past the second threshold re-prices everything already billed.
              {' '}All three are after the {Math.round((cfg.deductionPct ?? 0) * 100)}% deduction.
            </>);
          })()}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Who is on the incentive</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10, lineHeight: 1.7 }}>
          Only these people are scored and paid. Anyone else who bills still has their units stored
          and counted on the dashboard as “not on the roster”, so nothing is lost — they are simply
          not paid. Removing somebody never changes anybody else's figure, because each person is
          measured against their own average.
        </div>
        <div style={{ overflowX: 'auto', marginBottom: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 640 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--t3)', fontSize: 9.5,
                           letterSpacing: '.07em', textTransform: 'uppercase' }}>
                <th style={{ padding: '5px 6px' }}>Code</th>
                <th style={{ padding: '5px 6px' }}>Name</th>
                <th style={{ padding: '5px 6px' }}>Stored as</th>
                <th style={{ padding: '5px 6px' }}>Also billed as</th>
                <th style={{ padding: '5px 6px' }}></th>
              </tr>
            </thead>
            <tbody>
              {(cfg.roster || []).map(p => (
                <tr key={p.key} style={{ borderTop: '1px solid var(--b1)' }}>
                  <td style={{ padding: '5px 6px' }}>
                    <input value={p.code || ''} placeholder="SSL —"
                           onChange={e => setPerson(p.key, 'code', e.target.value)}
                           style={{ width: 78, fontSize: 12, padding: '5px 7px', borderRadius: 7,
                                    border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
                  </td>
                  <td style={{ padding: '5px 6px' }}>
                    <input value={p.name || ''}
                           onChange={e => setPerson(p.key, 'name', e.target.value)}
                           style={{ width: 150, fontSize: 12, padding: '5px 7px', borderRadius: 7,
                                    border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
                  </td>
                  {/* The key is deliberately not editable here: every stored
                      month and opening average is filed under it, and renaming
                      it in place would detach that person from their history. */}
                  <td style={{ padding: '5px 6px', color: 'var(--t3)', fontFamily: 'monospace' }}>{p.key}</td>
                  <td style={{ padding: '5px 6px' }}>
                    <input value={(p.aliases || []).join(', ')} placeholder="other spellings, comma separated"
                           onChange={e => setPerson(p.key, 'aliases', e.target.value)}
                           style={{ width: '100%', minWidth: 190, fontSize: 12, padding: '5px 7px', borderRadius: 7,
                                    border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'right' }}>
                    <button className="btn" onClick={() => dropFromRoster(p.key)}
                            title={`Remove ${p.name || p.key}`} style={{ fontSize: 11 }}>
                      <X size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!(cfg.roster || []).length && (
            <div style={{ fontSize: 11.5, color: 'var(--yel,#ca8a04)', padding: '8px 0' }}>
              Empty — everybody who bills is being paid.
            </div>
          )}
        </div>
        <form onSubmit={e => { e.preventDefault(); addToRoster(e.target.elements.who.value); e.target.reset(); }}
              style={{ display: 'flex', gap: 7, marginBottom: 6 }}>
          <input name="who" placeholder="Add a full name…" list="incentive-known-people"
                 style={{ fontSize: 12, padding: '6px 9px', borderRadius: 7, minWidth: 180,
                          border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
          <datalist id="incentive-known-people">
            {people.map(n => <option key={n} value={n} />)}
          </datalist>
          <button className="btn" style={{ fontSize: 12 }}>Add</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Opening average</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10, lineHeight: 1.7 }}>
          The bar to use until someone has real history. Billing-person data only starts when the
          ERP&nbsp;<b>Created By</b> import does, so without a figure here everyone&apos;s first months
          compute an average of zero, land in the top band and pay the high rate on every unit.
          Real history replaces these automatically.
        </div>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))' }}>
          {knownPeople.map(name => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span title={name} style={{ flex: 1, fontSize: 12, fontWeight: 600, overflow: 'hidden',
                             textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{labelFor(name)}</span>
              <input type="number" className="inp" min="0" step="50" placeholder="—"
                value={cfg.openingAverage?.[name] ?? ''}
                onChange={e => setOpening(name, e.target.value)}
                style={{ width: 86, fontSize: 12 }} />
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Fallback: who bills for each salesman</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10 }}>
          Used only when a line has no <b>Created By</b> value from the ERP.
        </div>
        <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid var(--b1)',
                      borderRadius: 8, padding: 8 }}>
          {ids.map(id => (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px' }}>
              <span style={{ width: 96, fontSize: 12, fontWeight: 600 }}>{id}</span>
              <input className="inp" list="inc-people" style={{ flex: 1, fontSize: 12 }}
                placeholder="nobody — these units earn nothing"
                value={cfg.mapping[id] || ''}
                onChange={e => setMap(id, e.target.value.trim())} />
            </div>
          ))}
          <datalist id="inc-people">{knownPeople.map(p => <option key={p} value={p} />)}</datalist>
        </div>
      </div>

      {/* Sticky, because the Save button used to sit below a roster table, a
          grid of opening averages and a scrolling salesman map — far enough
          down that a change could be made and abandoned without ever seeing
          it. */}
      {dirty && (
        <div style={{ position: 'sticky', bottom: 12, zIndex: 5, marginTop: 14,
                      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                      padding: '11px 15px', borderRadius: 11,
                      background: 'var(--bg1)', border: '1px solid var(--yel,#ca8a04)',
                      boxShadow: '0 6px 24px rgba(0,0,0,.22)' }}>
          <AlertTriangle size={15} color="var(--yel,#ca8a04)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--t2)' }}>
            <b>Not saved yet.</b> {changeSummary}
          </div>
          <button className="btnp" onClick={save} disabled={busy} style={{ marginLeft: 'auto' }}>
            {busy ? 'Saving…' : 'Save rule'}
          </button>
          <button className="btn" onClick={() => setCfg(saved)} disabled={busy}
                  style={{ fontSize: 12 }}>Discard</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 14 }}>
        <button className="btnp" onClick={save} disabled={busy || !dirty}>
          {busy ? 'Saving…' : dirty ? 'Save rule' : 'Saved'}
        </button>
        {ok && <span style={{ fontSize: 12, color: 'var(--grn)', fontWeight: 700 }}>{ok}</span>}
        {defs && (
          <button className="btn" style={{ marginLeft: 'auto', fontSize: 11 }}
            onClick={() => setCfg({
              ...defs,
              // Only the rates. This button used to hand back the whole default
              // config, which quietly restored every person somebody had just
              // removed and reset the deduction — under a label saying "rates".
              roster: cfg.roster,
              deductionPct: cfg.deductionPct,
              openingAverage: cfg.openingAverage,
              mapping: cfg.mapping,
            })}>
            Reset rates to defaults
          </button>
        )}
      </div>
    </div>
  );
}

/* ── daily coverage ───────────────────────────────────────────────── */
/**
 * Which days of the month have billing.
 *
 * A daily upload is only worth anything if a day that never arrived is
 * visible. Left to itself a missing day reads as a zero — indistinguishable
 * from a quiet day — so every past working day with no billing is flagged
 * until somebody either uploads it or marks it closed.
 *
 * Sunday is treated as closed automatically: across the whole stored history
 * not one Sunday has any billing, and flagging 31 of them would train anyone
 * to ignore the list.
 */
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_LOOK = {
  uploaded:        { bg: 'rgba(22,163,74,.14)',  fg: 'var(--grn)',        line: 'rgba(22,163,74,.4)' },
  missing:         { bg: 'rgba(220,38,38,.12)',  fg: 'var(--red)',        line: 'rgba(220,38,38,.45)' },
  holiday:         { bg: 'var(--bg2)',           fg: 'var(--t3)',         line: 'var(--b1)' },
  'weekly-closed': { bg: 'transparent',          fg: 'var(--t3)',         line: 'var(--b1)' },
  future:          { bg: 'transparent',          fg: 'var(--t3)',         line: 'transparent' },
};

function Coverage({ month, onUploadToday }) {
  const [d, setD]     = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [key, setKey] = useState(0);

  useEffect(() => {
    let dead = false;
    api.ptxIncentiveDays(month)
      .then(r => { if (!dead) setD(r); })
      .catch(e => { if (!dead) setErr(e?.message || 'Could not load coverage'); });
    return () => { dead = true; };
  }, [month, key]);

  const toggle = async (x) => {
    if (x.status === 'uploaded' || x.status === 'future') return;
    setBusy(true);
    try {
      await api.ptxIncentiveDayHoliday(x.day, x.status !== 'holiday');
      setKey(k => k + 1);
    } catch (e) { setErr(e?.message || 'Could not save'); }
    finally { setBusy(false); }
  };

  if (err) return <div className="card" style={{ color: 'var(--red)', fontSize: 12.5 }}>{err}</div>;
  if (!d || !d.month) return null;

  // Pad the grid so the first day sits under its weekday.
  const lead = d.days.length ? d.days[0].dow : 0;
  const missing = d.missing.length;

  return (
    <div className="card" style={{ padding: '15px 17px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 750 }}>Daily coverage — {d.month}</div>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--t3)' }}>
          {d.fileName ? `last file: ${d.fileName}` : ''}
        </span>
      </div>

      {/* today, which is the thing a daily upload is actually about */}
      {d.todayInMonth && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, fontSize: 12 }}>
          {d.todayUploaded
            ? <><CheckCircle2 size={14} color="var(--grn)" />
                <span style={{ color: 'var(--t2)' }}>
                  Today ({d.today}) is uploaded.
                </span></>
            : <><AlertTriangle size={14} color="var(--yel,#ca8a04)" />
                <span style={{ color: 'var(--t2)' }}>
                  <b>Today ({d.today}) has not been uploaded yet.</b>
                  {d.lastUploadedDay && <> The last day with billing is {d.lastUploadedDay}.</>}
                </span>
                {onUploadToday && (
                  <button className="btn btn-primary" onClick={onUploadToday}
                          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center',
                                   gap: 5, fontSize: 11.5 }}>
                    <CalendarClock size={12} /> Upload today
                  </button>
                )}</>}
        </div>
      )}

      {missing > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10,
                      padding: '8px 11px', borderRadius: 9, background: 'rgba(220,38,38,.08)' }}>
          <AlertTriangle size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.55 }}>
            <b>{missing} {missing === 1 ? 'day has' : 'days have'} no billing and no upload</b> —{' '}
            {d.missing.map(x => x.slice(8)).join(', ')}.
            Upload {missing === 1 ? 'it' : 'them'}, or click the day to mark it a holiday so it stops
            being counted as missed.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: 4 }}>
        {DOW.map(w => (
          <div key={w} style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em',
                                textTransform: 'uppercase', color: 'var(--t3)',
                                textAlign: 'center', paddingBottom: 2 }}>{w}</div>
        ))}
        {Array.from({ length: lead }).map((_, i) => <div key={'pad' + i} />)}
        {d.days.map(x => {
          const look = DAY_LOOK[x.status] || DAY_LOOK.future;
          const clickable = x.status === 'missing' || x.status === 'holiday';
          return (
            <button key={x.day} disabled={!clickable || busy} onClick={() => toggle(x)}
                    title={
                      x.status === 'uploaded' ? `${num(x.units)} units from ${x.people} people`
                      : x.status === 'missing' ? 'Not uploaded — click to mark it a holiday'
                      : x.status === 'holiday' ? 'Holiday — click to un-mark it'
                      : x.status === 'weekly-closed' ? 'Sunday — closed'
                      : 'Still to come'}
                    style={{ textAlign: 'left', padding: '5px 6px', borderRadius: 8,
                             minHeight: 46, cursor: clickable ? 'pointer' : 'default',
                             background: look.bg, color: look.fg,
                             border: '1px solid ' + look.line,
                             outline: x.today ? '2px solid var(--acc)' : 'none',
                             outlineOffset: -1 }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>{Number(x.day.slice(8))}</div>
              {x.status === 'uploaded' && (
                <div style={{ fontSize: 9.5, fontVariantNumeric: 'tabular-nums' }}>{num(x.units)}</div>
              )}
              {x.status === 'holiday' && <div style={{ fontSize: 9 }}>holiday</div>}
              {x.status === 'missing' && <div style={{ fontSize: 9 }}>missed</div>}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10,
                    fontSize: 10.5, color: 'var(--t3)' }}>
        {[['uploaded', 'billed'], ['missing', 'not uploaded'], ['holiday', 'holiday'],
          ['weekly-closed', 'Sunday']].map(([k, label]) => (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: DAY_LOOK[k].bg,
                           border: '1px solid ' + DAY_LOOK[k].line }} />{label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── 4. upload a sheet ────────────────────────────────────────────── */
/**
 * Calculate the incentive straight from a sheet, instead of from the ERP
 * invoice lines already in the system.
 *
 * Always previews first. The server reads the file, says which columns it
 * matched and which month it thinks it is, and returns the figures WITHOUT
 * storing them; nothing is written until Save is pressed. These numbers decide
 * what people are paid, so a wrong column or a wrong month has to be visible
 * beforehand, not discovered afterwards.
 */
function Upload() {
  const [file, setFile]       = useState(null);
  const [month, setMonth]     = useState('');       // optional override
  const [seed, setSeed]       = useState(false);   // file every month in the sheet
  const fileRef = useRef(null);
  // Today's date in the same shape the sheet and the coverage use.
  const todayKey = (() => {
    const t = new Date();
    return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0')
         + '-' + String(t.getDate()).padStart(2, '0');
  })();

  // The daily action, as one button. It is the same file picker, with the
  // seed tick cleared — uploading the day's sheet with "load every month" left
  // on from a previous visit would refile months nobody meant to touch.
  const uploadToday = () => {
    setSeed(false);
    if (fileRef.current) { fileRef.current.value = ''; fileRef.current.click(); }
  };
  const [prev, setPrev]       = useState(null);
  const [busy, setBusy]       = useState(false);
  const [pct, setPct]         = useState(0);
  const [err, setErr]         = useState('');
  const [saved, setSaved]     = useState('');
  const [periods, setPeriods] = useState([]);

  const loadPeriods = useCallback(() => {
    api.ptxIncentivePeriods()
      .then(r => setPeriods(r.periods || []))
      .catch(() => {});
  }, []);
  useEffect(loadPeriods, [loadPeriods]);

  const run = useCallback((f, m, commit, all) => {
    if (!f) return;
    setBusy(true); setErr(''); setSaved(''); setPct(0);
    api.ptxIncentiveUpload(f, { month: m, commit, all }, setPct)
      .then(r => {
        setPrev(r);
        if (r.saved) {
          setSaved(`Saved ${(r.savedMonths || [r.month]).join(', ')}.`);
          loadPeriods();
        }
      })
      .catch(e => { setErr(e?.message || 'Could not read that sheet'); setPrev(null); })
      .finally(() => { setBusy(false); setPct(0); });
  }, [loadPeriods]);

  const pick = (f) => { setFile(f); setPrev(null); setSaved(''); setErr(''); if (f) run(f, month, false, seed); };

  const t = prev?.totals;

  return (
    <div className="fade">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div className="page-eyebrow">Billing incentive</div>
        <div className="page-title">Upload sheet</div>
      </div>

      <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={uploadToday} disabled={busy}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
            <CalendarClock size={13} /> Upload today
          </button>

          <label className="btn" style={{ display: 'inline-flex', alignItems: 'center',
                  gap: 6, fontSize: 12.5, cursor: busy ? 'default' : 'pointer' }}>
            <UploadIcon size={13} />
            {file ? 'Choose another file' : 'Choose sheet'}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" disabled={busy} style={{ display: 'none' }}
                   onChange={e => pick(e.target.files?.[0] || null)} />
          </label>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>Month</span>
            <input type="month" value={month} disabled={busy}
                   onChange={e => { setMonth(e.target.value); if (file) run(file, e.target.value, false); }}
                   style={{ fontSize: 12, padding: '5px 7px', borderRadius: 7,
                            border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
            <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>
              leave blank to take it from the sheet
            </span>
          </div>

          {/* The six-month report goes in this way: one file, every month filed
              separately, which is what gives each person a real average. */}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 11.5, cursor: busy ? 'default' : 'pointer' }}>
            <input type="checkbox" checked={seed} disabled={busy}
                   onChange={e => { setSeed(e.target.checked); if (file) run(file, month, false, e.target.checked); }} />
            Load every month in this sheet
          </label>

          {file && <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{file.name}</div>}
          {busy && <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>
            {pct > 0 && pct < 100 ? `Uploading ${pct}%…` : 'Reading…'}
          </div>}
        </div>

        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10, lineHeight: 1.55 }}>
          The sheet needs a column naming the billing person (<b>Created By</b>, Billed By, Person…)
          and a quantity column (<b>Qty</b>, Quantity, Units…). A Date or Month column tells it which
          month each row belongs to. Nothing is stored until you press Save.
          <br />
          <b>First time:</b> upload the six-month report with <i>Load every month</i> ticked — that
          gives each person the average their rate is measured against. <b>After that:</b> upload the
          daily report unticked, and it updates the current month.
        </div>
      </div>

      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 14 }}>
        <AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 5 }} />{err}
      </div>}

      <Coverage month={prev?.month || ''} onUploadToday={uploadToday} />

      {saved && <div className="card" style={{ color: 'var(--grn)', fontSize: 12.5, marginBottom: 14 }}>
        {saved}
      </div>}

      {prev && (
        <>
          {/* what the server actually matched — the thing most worth checking */}
          <div className="card" style={{ padding: '13px 16px', marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em',
                          textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 7 }}>
              What was read
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12 }}>
              {!prev.saveAll && <span>Month <b>{prev.month}</b></span>}
              <span>Person column <b>{prev.columns?.person}</b></span>
              <span>Quantity column <b>{prev.columns?.qty}</b></span>
              <span>{num(prev.rowsRead)} rows{prev.skipped ? `, ${num(prev.skipped)} skipped` : ''}</span>
              {prev.coversDays?.length > 0 && (
                <span>{prev.coversDays.length} {prev.coversDays.length === 1 ? 'day' : 'days'}
                  {' '}<b>{prev.coversDays[0].slice(8)}–{prev.coversDays[prev.coversDays.length - 1].slice(8)}</b></span>
              )}
            </div>

            {/* The export is a rolling window, so days drop off the front of it.
                Those stay stored — saying so is what makes a daily upload safe. */}
            {/* "Upload today" is only true if the sheet reaches today. A
                daily export run before the day's invoices are raised will
                not, and that is worth saying before it is saved. */}
            {prev.coversDays?.length > 0 && !prev.coversDays.includes(todayKey) && (
              <div style={{ fontSize: 11.5, color: 'var(--yel,#ca8a04)', marginTop: 8 }}>
                <AlertTriangle size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                This sheet does not reach today ({todayKey}) — its last day is{' '}
                <b>{prev.coversDays[prev.coversDays.length - 1]}</b>.
              </div>
            )}

            {prev.keptDays?.length > 0 && (
              <div style={{ fontSize: 11.5, color: 'var(--grn)', marginTop: 8 }}>
                <CheckCircle2 size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                {num(prev.keptDays.length)} earlier {prev.keptDays.length === 1 ? 'day' : 'days'} already
                stored for {prev.month} ({prev.keptDays[0].slice(8)}–{prev.keptDays[prev.keptDays.length - 1].slice(8)})
                {' '}will be kept. Only the days in this sheet are rewritten.
              </div>
            )}

            {!prev.saveAll && prev.monthsSeen?.length > 1 && (
              <div style={{ fontSize: 11.5, color: 'var(--amb,#ca8a04)', marginTop: 8 }}>
                <AlertTriangle size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                This sheet covers more than one month
                ({prev.monthsSeen.map(m => `${m.month}: ${num(m.rows)} rows`).join(', ')}).
                Only <b>{prev.month}</b> is counted
                {prev.excluded?.rows > 0 && <> — {num(prev.excluded.rows)} rows ({num(prev.excluded.units)} units)
                from the other months were left out</>}.
                Set the month above to work out a different one.
              </div>
            )}

            {prev.spellings?.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>
                Names combined:{' '}
                {prev.spellings.map(s => `${s.raw.join(', ')} → ${s.name}`).join('  ·  ')}
              </div>
            )}

            {!prev.saveAll && prev.replacing && (
              <div style={{ fontSize: 11.5, color: 'var(--amb,#ca8a04)', marginTop: 8 }}>
                <AlertTriangle size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                {prev.month} already has figures ({num(prev.replacing.rows)} people). Saving updates the
                days this sheet covers and leaves the rest alone.
              </div>
            )}
          </div>

          {prev.saveAll && (
            <div className="card" style={{ padding: '13px 16px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em',
                            textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>
                Months this sheet would file
              </div>
              {prev.perMonth.map(m => (
                <div key={m.month} style={{ display: 'flex', gap: 12, alignItems: 'center',
                      fontSize: 12, padding: '5px 0' }}>
                  <b style={{ minWidth: 62 }}>{m.month}</b>
                  <span style={{ color: 'var(--t3)' }}>{num(m.people)} people</span>
                  {periods.some(p => p.month === m.month) && (
                    <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em',
                                   padding: '2px 6px', borderRadius: 5, color: BAND.mid.c,
                                   background: BAND.mid.bg }}>REPLACES</span>
                  )}
                  <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                    {num(m.units)} units
                  </span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8, lineHeight: 1.5 }}>
                Units only. The rates are worked out once the whole history is stored, because each
                month's bar depends on the months before it.
                {prev.undated > 0 && <> {num(prev.undated)} rows have no readable date and will be skipped.</>}
              </div>
            </div>
          )}

          {/* Seed mode files several months at once, so a single month's
              totals and rates would describe only part of the sheet. */}
          {!prev.saveAll && (<>
          <div style={{ display: 'grid', gap: 10, marginBottom: 14,
                        gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
            <Stat label="Total points" value={points(t.points)} tone="var(--acc)" />
            <Stat label="Units" value={num(t.units)} />
            <Stat label="People" value={num(t.people)} />
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto', marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--t3)', fontSize: 10,
                             letterSpacing: '.07em', textTransform: 'uppercase' }}>
                  <th style={{ padding: '10px 14px' }}>Person</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Units</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Invoices</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Target</th>
                  <th style={{ padding: '10px 14px' }}>Band</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Points</th>
                </tr>
              </thead>
              <tbody>
                {prev.people.map((p, i) => {
                  const band = BAND[p.band] || BAND.base;
                  return (
                    <tr key={p.person} style={{ borderTop: '1px solid var(--b1)' }}>
                      <td style={{ padding: '9px 14px', fontWeight: 650 }}>
                        {i < 3 && <Trophy size={12} color={MEDAL[i]}
                                    style={{ verticalAlign: -1, marginRight: 5 }} />}
                        {p.person}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right',
                                   fontVariantNumeric: 'tabular-nums' }}>{num(p.units)}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', color: 'var(--t3)',
                                   fontVariantNumeric: 'tabular-nums' }}>{num(p.invoices)}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right',
                                   fontVariantNumeric: 'tabular-nums' }}>
                        {num(p.target)}
                        {/* where the bar came from decides the payout, so say so */}
                        <div style={{ fontSize: 9.5, color: p.averageSource === 'none' ? 'var(--red)' : 'var(--t3)' }}>
                          {p.averageSource === 'none' ? 'no history'
                            : `${num(p.average)} avg · ${p.monthsOfHistory} mo`}
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em',
                                       padding: '2px 7px', borderRadius: 5,
                                       color: band.c, background: band.bg }}>{band.label}</span>
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 800,
                                   color: 'var(--acc)', fontVariantNumeric: 'tabular-nums' }}>{points(p.points)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {prev.offRoster?.length > 0 && (
            <div className="card" style={{ fontSize: 11.5, color: 'var(--t2)', marginBottom: 14 }}>
              <UserX size={13} color="var(--t3)" style={{ verticalAlign: -2, marginRight: 5 }} />
              <b>{num(prev.offRoster.reduce((a, o) => a + o.units, 0))} units not on the roster</b> —{' '}
              {prev.offRoster.map(o => `${o.person} ${num(o.units)}`).join(', ')}. They will be stored
              but not paid. Add a name on the <b>Rule</b> screen if that is wrong.
            </div>
          )}

          {prev.people.some(p => p.averageSource === 'none') && (
            <div className="card" style={{ fontSize: 11.5, color: 'var(--t2)', marginBottom: 14 }}>
              <AlertTriangle size={13} color="var(--red)" style={{ verticalAlign: -2, marginRight: 5 }} />
              Some people have no history and no opening average, so their bar is zero and every unit
              pays the top rate. Set their opening average on the <b>Rule</b> screen before saving, or
              they will be overpaid.
            </div>
          )}

          </>)}

          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-primary" disabled={busy || !file}
                    onClick={() => run(file, month, true, seed)}
                    style={{ fontSize: 12.5 }}>
              {prev.saveAll
                ? `Save all ${prev.perMonth.length} months`
                : prev.replacing ? `Replace ${prev.month}` : `Save ${prev.month}`}
            </button>
            <button className="btn" disabled={busy} onClick={() => { setFile(null); setPrev(null); }}
                    style={{ fontSize: 12.5 }}>Discard</button>
          </div>
        </>
      )}

      {periods.length > 0 && (
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em',
                        textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 8 }}>
            Uploaded months
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {periods.map(p => (
              <div key={p.month} className="card"
                   style={{ padding: '10px 14px', display: 'flex', alignItems: 'center',
                            gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
                <b style={{ minWidth: 62 }}>{p.month}</b>
                <span style={{ color: 'var(--t3)' }}>{num(p.people)} people · {num(p.units)} units</span>
                {p.fileName && <span style={{ color: 'var(--t3)', fontSize: 11 }}>{p.fileName}</span>}
                <button className="btn" style={{ marginLeft: 'auto', fontSize: 11 }}
                        onClick={() => {
                          if (!window.confirm(`Remove the uploaded figures for ${p.month}?`)) return;
                          api.ptxIncentivePeriodDelete(p.month).then(loadPeriods).catch(() => {});
                        }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── entry point ──────────────────────────────────────────────────── */
export default function Incentive({ view = 'month', currentUser }) {
  // Month is held here so switching between This month and History keeps the
  // month you were looking at.
  const [month, setMonth] = useState('');
  if (view === 'dashboard') return <Dashboard month={month} setMonth={setMonth} currentUser={currentUser} />;
  if (view === 'history') return <History month={month} setMonth={setMonth} />;
  if (view === 'rule')    return <Rule />;
  if (view === 'upload')  return <Upload />;
  return <ThisMonth month={month} setMonth={setMonth} />;
}
