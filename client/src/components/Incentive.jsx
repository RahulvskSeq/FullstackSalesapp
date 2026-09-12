import React, { useState, useEffect, useCallback } from 'react';
import { IndianRupee, Trophy, Settings, TrendingUp, AlertTriangle, RefreshCw,
         Upload as UploadIcon } from 'lucide-react';
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
            <Stat label="Total payout" value={money(data.totals.amount)} tone="var(--grn)" />
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
                      bar at {num(p.base)}
                      {p.averageSource === 'opening' && ' (opening figure)'}
                      {p.averageSource === 'none' && ' (no history yet)'}
                      {p.averageSource === 'history' && ` · ${p.monthsOfHistory}mo average`}
                    </span>
                    <div style={{ flex: 1 }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--acc)',
                                    fontVariantNumeric: 'tabular-nums' }}>{points(p.points)} pts</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--grn)' }}>{money(p.amount)}</div>
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
                        {num(p.next.unitsAway)} more → +{money(p.next.gain)} ({points(p.next.points)} pts)
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
  const [ids, setIds]   = useState([]);
  const [people, setPeople] = useState([]);
  const [defs, setDefs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const [ok, setOk]     = useState('');

  const load = useCallback(() => {
    Promise.all([api.ptxIncentiveConfig(), api.ptxIncentive('')])
      .then(([c, inc]) => {
        setCfg(c.config); setIds(c.salesmanIds || []); setDefs(c.defaults);
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
      setOk('Saved.');
      setTimeout(() => setOk(''), 2500);
    } catch (e) { setErr(e?.message || 'Save failed'); }
    setBusy(false);
  };

  if (!cfg) return <div style={{ fontSize: 12.5, color: 'var(--t3)' }}>{err || 'Loading…'}</div>;

  const knownPeople = [...new Set([...people, ...Object.values(cfg.mapping || {}),
                                   ...Object.keys(cfg.openingAverage || {})].filter(Boolean))].sort();
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
          {field('Low rate ₹',   'rateLow',        '0.05', 'per unit up to the average')}
          {field('High rate ₹',  'rateHigh',       '0.05', 'per unit above it')}
          {field('Band width',   'bandWidth',      '50',   'how far the middle band runs')}
          {field('Lookback',     'lookbackMonths', '1',    'months the average covers')}
          {field('Points per ₹', 'pointsPerRupee', '1',    'shown alongside rupees')}
          {field('Minimum bar',  'minAverage',     '10',   'floor for a thin record')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.7,
                      padding: '9px 12px', background: 'var(--bg2)', borderRadius: 8 }}>
          Someone whose average is 2,000 would earn{' '}
          <b>₹{(2000 * cfg.rateLow).toFixed(2)}</b> at 2,000 units,{' '}
          <b>₹{(2000 * cfg.rateLow + cfg.bandWidth * cfg.rateHigh).toFixed(2)}</b> at {num(2000 + cfg.bandWidth)},
          and <b>₹{((2000 + cfg.bandWidth + 1) * cfg.rateHigh).toFixed(2)}</b> at {num(2001 + cfg.bandWidth)} —
          one unit past the second threshold re-prices everything already billed.
        </div>
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
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, overflow: 'hidden',
                             textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
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

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button className="btnp" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save rule'}</button>
        {ok && <span style={{ fontSize: 12, color: 'var(--grn)', fontWeight: 700 }}>{ok}</span>}
        {defs && (
          <button className="btn" style={{ marginLeft: 'auto', fontSize: 11 }}
            onClick={() => setCfg({ ...defs, openingAverage: cfg.openingAverage, mapping: cfg.mapping })}>
            Reset rates to defaults
          </button>
        )}
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

  const run = useCallback((f, m, commit) => {
    if (!f) return;
    setBusy(true); setErr(''); setSaved(''); setPct(0);
    api.ptxIncentiveUpload(f, { month: m, commit }, setPct)
      .then(r => {
        setPrev(r);
        if (r.saved) { setSaved(`Saved ${r.month}.`); loadPeriods(); }
      })
      .catch(e => { setErr(e?.message || 'Could not read that sheet'); setPrev(null); })
      .finally(() => { setBusy(false); setPct(0); });
  }, [loadPeriods]);

  const pick = (f) => { setFile(f); setPrev(null); setSaved(''); setErr(''); if (f) run(f, month, false); };

  const t = prev?.totals;

  return (
    <div className="fade">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div className="page-eyebrow">Billing incentive</div>
        <div className="page-title">Upload sheet</div>
      </div>

      <div className="card" style={{ padding: '16px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center',
                  gap: 6, fontSize: 12.5, cursor: busy ? 'default' : 'pointer' }}>
            <UploadIcon size={13} />
            {file ? 'Choose another file' : 'Choose sheet'}
            <input type="file" accept=".xlsx,.xls,.csv" disabled={busy} style={{ display: 'none' }}
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

          {file && <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{file.name}</div>}
          {busy && <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>
            {pct > 0 && pct < 100 ? `Uploading ${pct}%…` : 'Reading…'}
          </div>}
        </div>

        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10, lineHeight: 1.55 }}>
          The sheet needs a column naming the billing person (<b>Created By</b>, Billed By, Person…)
          and a quantity column (<b>Qty</b>, Quantity, Units…). A Date or Month column tells it which
          month the sheet is for. Nothing is stored until you press Save.
        </div>
      </div>

      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 14 }}>
        <AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 5 }} />{err}
      </div>}

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
              <span>Month <b>{prev.month}</b></span>
              <span>Person column <b>{prev.columns?.person}</b></span>
              <span>Quantity column <b>{prev.columns?.qty}</b></span>
              <span>{num(prev.rowsRead)} rows{prev.skipped ? `, ${num(prev.skipped)} skipped` : ''}</span>
            </div>

            {prev.monthsSeen?.length > 1 && (
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

            {prev.replacing && (
              <div style={{ fontSize: 11.5, color: 'var(--amb,#ca8a04)', marginTop: 8 }}>
                <AlertTriangle size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                {prev.month} was already uploaded ({num(prev.replacing.rows)} people). Saving replaces it.
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 10, marginBottom: 14,
                        gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
            <Stat label="Total points" value={points(t.points)} tone="var(--acc)" />
            <Stat label="Total payout" value={money(t.amount)} tone="var(--grn)" />
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
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Average</th>
                  <th style={{ padding: '10px 14px' }}>Band</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Points</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
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
                        {num(p.average)}
                        {/* where the bar came from decides the payout, so say so */}
                        <div style={{ fontSize: 9.5, color: p.averageSource === 'none' ? 'var(--red)' : 'var(--t3)' }}>
                          {p.averageSource === 'history' ? `${p.monthsOfHistory} mo history`
                            : p.averageSource === 'opening' ? 'opening'
                            : 'no history'}
                        </div>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.06em',
                                       padding: '2px 7px', borderRadius: 5,
                                       color: band.c, background: band.bg }}>{band.label}</span>
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 800,
                                   color: 'var(--acc)', fontVariantNumeric: 'tabular-nums' }}>{points(p.points)}</td>
                      <td style={{ padding: '9px 14px', textAlign: 'right',
                                   fontVariantNumeric: 'tabular-nums' }}>{money(p.amount)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {prev.people.some(p => p.averageSource === 'none') && (
            <div className="card" style={{ fontSize: 11.5, color: 'var(--t2)', marginBottom: 14 }}>
              <AlertTriangle size={13} color="var(--red)" style={{ verticalAlign: -2, marginRight: 5 }} />
              Some people have no history and no opening average, so their bar is zero and every unit
              pays the top rate. Set their opening average on the <b>Rule</b> screen before saving, or
              they will be overpaid.
            </div>
          )}

          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-primary" disabled={busy || !file}
                    onClick={() => run(file, month, true)}
                    style={{ fontSize: 12.5 }}>
              {prev.replacing ? `Replace ${prev.month}` : `Save ${prev.month}`}
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
export default function Incentive({ view = 'month' }) {
  // Month is held here so switching between This month and History keeps the
  // month you were looking at.
  const [month, setMonth] = useState('');
  if (view === 'history') return <History month={month} setMonth={setMonth} />;
  if (view === 'rule')    return <Rule />;
  if (view === 'upload')  return <Upload />;
  return <ThisMonth month={month} setMonth={setMonth} />;
}
