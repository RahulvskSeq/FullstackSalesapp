import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, RotateCcw, Save } from 'lucide-react';
import { api } from '../api';
import Skeleton from './Skeleton';

/**
 * Sales incentive — rule & setup.
 *
 * Every number the scheme uses is editable here, because a published scheme
 * gets amended and a rate hard-coded in a file needs a developer to change.
 * The worked example at the bottom recalculates from whatever is on screen,
 * so the page can never describe a rule the system is not applying.
 */

const money = v => '₹' + Math.round(Number(v) || 0).toLocaleString('en-IN');
const num   = v => Number(v || 0).toLocaleString('en-IN');

const CATEGORIES = ['LAMINATE', 'LINER', 'LOUVRES', 'POLYMER SHEET', 'ROLLS',
                    'DECORATIVE - SPECIAL', 'FOLDERS', 'EDGE BANDING', 'OTHER'];

function Field({ label, hint, value, onChange, step = '1', prefix, suffix, width }) {
  return (
    <div style={{ minWidth: width || 0 }}>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                      textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 5 }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {prefix && <span style={{ fontSize: 13, color: 'var(--t3)' }}>{prefix}</span>}
        <input type="number" step={step} value={value}
               onChange={e => onChange(e.target.value)}
               style={{ width: '100%', fontSize: 13, padding: '7px 9px', borderRadius: 8,
                        border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
        {suffix && <span style={{ fontSize: 12, color: 'var(--t3)' }}>{suffix}</span>}
      </div>
      {hint && <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

export default function SalesIncentiveRule() {
  const [cfg, setCfg]   = useState(null);
  const [defs, setDefs] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const [ok, setOk]     = useState('');
  const [canEdit, setCanEdit] = useState(true);   // section 6: the CEO (superadmin) changes the rule

  const load = useCallback(() => {
    api.salesIncentiveConfig()
      .then(r => { setCfg(r.config); setDefs(r.defaults); setCanEdit(r.canEdit !== false); })
      .catch(e => setErr(e?.message || 'Could not load the rule'));
  }, []);
  useEffect(load, [load]);

  const set = (k, v) => setCfg(c => ({ ...c, [k]: v }));
  const n   = (v, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d; };

  const setTier = (i, k, v) => setCfg(c => {
    const t = c.starterTiers.map((x, j) => j === i ? { ...x, [k]: n(v) } : x);
    return { ...c, starterTiers: t };
  });
  const addTier = () => setCfg(c => ({ ...c,
    starterTiers: [...c.starterTiers, { upTo: (c.starterTiers.at(-1)?.upTo || 0) + 250, rate: 25 }] }));
  const dropTier = (i) => setCfg(c => ({ ...c, starterTiers: c.starterTiers.filter((_, j) => j !== i) }));

  const setProd = (i, k, v) => setCfg(c => {
    const p = c.products.map((x, j) => j === i ? { ...x, [k]: v } : x);
    return { ...c, products: p };
  });
  const addProd = () => setCfg(c => ({ ...c, products: [...c.products,
    { key: 'p' + Date.now(), label: 'New product', category: 'OTHER', targetPct: 0.1, rate: 10 }] }));
  const dropProd = (i) => setCfg(c => ({ ...c, products: c.products.filter((_, j) => j !== i) }));

  const save = async () => {
    setBusy(true); setErr(''); setOk('');
    try {
      const r = await api.salesIncentiveConfigSave(cfg);
      setCfg(r.config);
      setOk('Saved. Every screen uses these immediately.');
      setTimeout(() => setOk(''), 3000);
    } catch (e) { setErr(e?.message || 'Save failed'); }
    finally { setBusy(false); }
  };

  if (!cfg) return err ? <div style={{ fontSize: 12.5, color: 'var(--red)' }}>{err}</div> : <Skeleton kind="form" />;

  // The ramp, worked through with whatever is currently on screen.
  const rampAt = (excess) => {
    if (excess <= 0) return { amount: 0, rate: 0 };
    if (excess < cfg.retroFrom) {
      let amount = 0, prev = 0;
      for (const t of cfg.starterTiers) {
        const inBand = Math.min(excess, t.upTo) - prev;
        if (inBand > 0) amount += inBand * t.rate;
        prev = t.upTo;
        if (excess <= t.upTo) break;
      }
      return { amount, rate: null };
    }
    // rate steps up on reaching each block: 1,000–1,999 base, 2,000+ base+step
    const steps = Math.max(0, Math.floor(excess / cfg.retroBlock) - 1);
    const rate = Math.min(cfg.retroCap, cfg.retroBase + cfg.retroStep * steps);
    return { amount: excess * rate, rate };
  };

  return (
    <div className="fade">
      <div className="page-head" style={{ marginBottom: 14 }}>
        <div className="page-eyebrow">Sales incentive</div>
        <div className="page-title">Rule &amp; setup</div>
      </div>

      {err && <div className="card" style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 12 }}>{err}</div>}
      {ok  && <div className="card" style={{ color: 'var(--grn)', fontSize: 12.5, marginBottom: 12 }}>{ok}</div>}

      {/* ── the gate ────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>The gate</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 11, lineHeight: 1.7 }}>
          Laminate incentive starts only after crossing this category's basic target. Other products pay
          on units above their own targets (set per salesman under Sales by Category); switch on the
          option below to make a missed basic zero the whole month instead.
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 11, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!cfg.gateAll} onChange={e => set('gateAll', e.target.checked)} />
          <span><b>Gate everything</b> — a missed laminate basic also zeroes other products and display</span>
        </label>
        {/* Read-only: the deduction is changed on the dashboard, against the
            month's figures. Shown here so the rule reads in one place. */}

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em',
                            textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 5 }}>Gate category</label>
            <select value={cfg.gateCategory} onChange={e => set('gateCategory', e.target.value)}
                    style={{ width: '100%', fontSize: 13, padding: '7px 9px', borderRadius: 8,
                             border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>the basic target is set per salesman</div>
          </div>
          <Field label="Display %" value={Math.round((cfg.displayPct || 0) * 1000) / 10}
                 onChange={v => set('displayPct', n(v) / 100)} step="0.5" suffix="%"
                 hint="of the value of display material sold to dealers" />
          <Field label="Deduction %" value={Math.round((cfg.deductionPct || 0) * 1000) / 10}
                 onChange={v => set('deductionPct', n(v) / 100)} step="5" suffix="%"
                 hint="taken off before payment; 0 = pay the scheme in full" />
          <Field label="Project-sale credit %" value={Math.round((cfg.projectCredit || 0) * 1000) / 10}
                 onChange={v => set('projectCredit', n(v) / 100)} step="5" suffix="%"
                 hint="how much of a discounted sale counts toward target" />
          <Field label="Bad-debt clawback %" value={Math.round((cfg.badDebtClawback || 0) * 1000) / 10}
                 onChange={v => set('badDebtClawback', n(v) / 100)} step="5" suffix="%"
                 hint="taken from each month's incentive until recovered" />
          <Field label="Points per ₹" value={cfg.pointsPerRupee ?? 4}
                 onChange={v => set('pointsPerRupee', n(v))} step="1"
                 hint="so the payout can also be shown in points" />
        </div>
      </div>

      {/* ── starter tiers ───────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Starter tiers</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 11, lineHeight: 1.7 }}>
          Applies while the excess over basic is below {num(cfg.retroFrom)}. Each band earns its own
          rate on the sheets that fall inside it.
        </div>
        {cfg.starterTiers.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, color: 'var(--t3)', minWidth: 76 }}>
              {i === 0 ? 'first' : 'up to'}
            </span>
            <input type="number" value={t.upTo} onChange={e => setTier(i, 'upTo', e.target.value)}
                   style={{ width: 100, fontSize: 13, padding: '6px 9px', borderRadius: 8,
                            border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>sheets above basic earn ₹</span>
            <input type="number" value={t.rate} onChange={e => setTier(i, 'rate', e.target.value)}
                   style={{ width: 80, fontSize: 13, padding: '6px 9px', borderRadius: 8,
                            border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>each</span>
            <button className="btn" onClick={() => dropTier(i)} style={{ marginLeft: 'auto', fontSize: 11 }}>
              <X size={11} />
            </button>
          </div>
        ))}
        <button className="btn" onClick={addTier}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, marginTop: 4 }}>
          <Plus size={12} /> Add a tier
        </button>
      </div>

      {/* ── retroactive escalation ──────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Retroactive escalation</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 11, lineHeight: 1.7 }}>
          Past the threshold, <b>one rate applies to the entire excess</b> — crossing a block re-prices
          sheets already earned, which is why the payout jumps rather than rising smoothly. The rate is
          the base plus one step for every further block, up to the cap.
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
          <Field label="Starts at" value={cfg.retroFrom} onChange={v => set('retroFrom', n(v))}
                 step="100" suffix="sheets" hint="excess at or above this uses one rate" />
          <Field label="Base rate" value={cfg.retroBase} onChange={v => set('retroBase', n(v))}
                 prefix="₹" hint="at the first block" />
          <Field label="Block size" value={cfg.retroBlock} onChange={v => set('retroBlock', n(v))}
                 step="100" suffix="sheets" hint="every further block raises the rate" />
          <Field label="Step" value={cfg.retroStep} onChange={v => set('retroStep', n(v))}
                 prefix="₹" hint="added per block" />
          <Field label="Cap" value={cfg.retroCap} onChange={v => set('retroCap', n(v))}
                 prefix="₹" hint="the rate stops climbing here" />
        </div>
        <div style={{ marginTop: 12, padding: '10px 13px', borderRadius: 9, background: 'var(--bg2)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
                        color: 'var(--t3)', marginBottom: 7 }}>What that pays</div>
          <div style={{ display: 'grid', gap: 6, gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
            {[500, 1000, 1999, 2000, 3000, 4000].map(x => {
              const r = rampAt(x);
              return (
                <div key={x} style={{ fontSize: 11.5 }}>
                  <span style={{ color: 'var(--t3)' }}>{num(x)} above → </span>
                  <b>{num(Math.round(r.amount * (cfg.pointsPerRupee || 4)))} pts</b>
                  <span style={{ color: 'var(--t3)' }}>{r.rate ? ` (${num(r.rate * (cfg.pointsPerRupee || 4))} pts/sheet)` : ' (tiers)'} · {money(r.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── other products ──────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Other products</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 11, lineHeight: 1.7 }}>
          The salesman's own target for the category (Sales by Category → Salesman-wise) is used when set —
          rolls are "a fixed count set per rep". The fixed count or % of the gate target here is the fallback
          for anyone without one. Only units <b>above</b> the target earn — hitting it exactly earns nothing.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 620 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--t3)', fontSize: 9.5,
                           letterSpacing: '.07em', textTransform: 'uppercase' }}>
                <th style={{ padding: '5px 6px' }}>Shown as</th>
                <th style={{ padding: '5px 6px' }}>Sales category</th>
                <th style={{ padding: '5px 6px' }}>Target % of gate</th>
                <th style={{ padding: '5px 6px' }}>or fixed</th>
                <th style={{ padding: '5px 6px' }}>₹ per unit above</th>
                <th style={{ padding: '5px 6px' }}></th>
              </tr>
            </thead>
            <tbody>
              {cfg.products.map((p, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--b1)' }}>
                  <td style={{ padding: '6px 6px' }}>
                    <input value={p.label} onChange={e => setProd(i, 'label', e.target.value)}
                           style={{ width: 110, fontSize: 12, padding: '5px 7px', borderRadius: 7,
                                    border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
                  </td>
                  <td style={{ padding: '6px 6px' }}>
                    <select value={p.category} onChange={e => setProd(i, 'category', e.target.value)}
                            style={{ fontSize: 12, padding: '5px 7px', borderRadius: 7,
                                     border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '6px 6px' }}>
                    <input type="number" step="1" placeholder="—"
                           value={p.targetPct === undefined || p.targetPct === null ? '' : Math.round(p.targetPct * 1000) / 10}
                           onChange={e => setProd(i, 'targetPct', e.target.value === '' ? null : n(e.target.value) / 100)}
                           style={{ width: 70, fontSize: 12, padding: '5px 7px', borderRadius: 7,
                                    border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
                    <span style={{ color: 'var(--t3)', fontSize: 11 }}> %</span>
                  </td>
                  <td style={{ padding: '6px 6px' }}>
                    <input type="number" placeholder="—"
                           value={p.fixedTarget === undefined || p.fixedTarget === null ? '' : p.fixedTarget}
                           onChange={e => setProd(i, 'fixedTarget', e.target.value === '' ? null : n(e.target.value))}
                           style={{ width: 70, fontSize: 12, padding: '5px 7px', borderRadius: 7,
                                    border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
                  </td>
                  <td style={{ padding: '6px 6px' }}>
                    <input type="number" value={p.rate} onChange={e => setProd(i, 'rate', n(e.target.value))}
                           style={{ width: 80, fontSize: 12, padding: '5px 7px', borderRadius: 7,
                                    border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
                  </td>
                  <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                    <button className="btn" onClick={() => dropProd(i)} style={{ fontSize: 11 }}><X size={11} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn" onClick={addProd}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, marginTop: 10 }}>
          <Plus size={12} /> Add a product
        </button>
      </div>

      {/* ── section 3 & 4: what never counts, and when it is paid ─── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>What never counts, and when it is paid</div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 11, lineHeight: 1.7 }}>
          Worked out from the ERP invoice lines and the Collections outstanding uploads, so nobody has to type
          them. Any figure can still be overridden per salesman on the dashboard.
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <Field label="Hold after month end" value={cfg.holdDays ?? 90} onChange={v => set('holdDays', n(v))} step="1" suffix="days"
                 hint="the month is evaluated together, held this long for collections, then paid in the next salary" />
          <Field label="Salary day" value={cfg.salaryDay ?? 7} onChange={v => set('salaryDay', n(v))} step="1" suffix="of month"
                 hint="first salary cycle on or after the hold ends pays the month" />
          <Field label="Project sale: below regular by" value={cfg.projectBelow ?? 50} onChange={v => set('projectBelow', n(v))} step="5" prefix="₹" suffix="/sheet"
                 hint="regular price = the price the product most often sells at; laminate priced this much under it counts at the project credit" />
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', marginTop: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={cfg.projectDetect !== false} onChange={e => set('projectDetect', e.target.checked)} />
            <span><b>Detect project sales</b> from invoice prices (needs management approval before payout)</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={cfg.lateDetect !== false} onChange={e => set('lateDetect', e.target.checked)} />
            <span><b>Detect late payment</b> from Collections — a dealer's month still outstanding when the hold ends forfeits that whole sale</span>
          </label>
        </div>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', marginTop: 12 }}>
          {[
            ['countStatusPattern',  'Counts as a sale (ERP status)', 'sales invoice', 'only lines whose status matches'],
            ['returnStatusPattern', 'Reverses units (ERP status)',   'return|credit note', 'returns and cancellations, reversed in the month they happen'],
            ['excludeNamePattern',  'Never counts (product name)',   'sample kit|stock transfer', 'sample kits, free display kits — matched against the product name'],
          ].map(([k, label, ph, hint]) => (
            <div key={k}>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 5 }}>{label}</label>
              <input value={cfg[k] ?? ''} placeholder={ph} onChange={e => set(k, e.target.value)}
                     style={{ width: '100%', fontSize: 13, padding: '7px 9px', borderRadius: 8, border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>{hint}</div>
            </div>
          ))}
          {[
            ['excludePartyRoles', 'Internal locations (party role)', 'Showroom', 'stock transfers to these party roles never count — comma separated'],
            ['displayCategories', 'Display categories', 'DISPLAY', 'category types whose VALUE earns the display % — comma separated; blank = typed per salesman'],
          ].map(([k, label, ph, hint]) => (
            <div key={k}>
              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 5 }}>{label}</label>
              <input value={(cfg[k] || []).join(', ')} placeholder={ph}
                     onChange={e => set(k, e.target.value.split(',').map(x => x.trim()).filter(Boolean))}
                     style={{ width: '100%', fontSize: 13, padding: '7px 9px', borderRadius: 8, border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>{hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── worked example, live ────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Worked example</div>
        {(() => {
          const basic = 2500, achieved = 3800, display = 80000;
          const excess = achieved - basic;
          const r = rampAt(excess);
          const rows = cfg.products.map(p => {
            const target = (p.fixedTarget !== undefined && p.fixedTarget !== null)
              ? p.fixedTarget : Math.round(basic * (p.targetPct || 0));
            const actual = Math.round(target * 1.1);         // 10% over, for illustration
            return { ...p, target, actual, over: actual - target, earns: (actual - target) * p.rate };
          });
          const other = rows.reduce((a, x) => a + x.earns, 0);
          const disp = display * (cfg.displayPct || 0);
          return (
            <div style={{ fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.8 }}>
              A salesman with a basic of <b>{num(basic)}</b> who bills <b>{num(achieved)}</b> is{' '}
              <b>{num(excess)}</b> above basic, earning <b>{money(r.amount)}</b>
              {r.rate ? <> at ₹{r.rate} on every sheet of the excess</> : <> across the starter tiers</>}.
              <div style={{ marginTop: 6 }}>
                {rows.map(x => (
                  <div key={x.key || x.label} style={{ color: 'var(--t3)' }}>
                    {x.label}: target {num(x.target)}, bills {num(x.actual)} → {num(x.over)} above ×
                    ₹{x.rate} = <b style={{ color: 'var(--t2)' }}>{money(x.earns)}</b>
                  </div>
                ))}
                <div style={{ color: 'var(--t3)' }}>
                  Display {money(display)} × {Math.round((cfg.displayPct || 0) * 1000) / 10}% ={' '}
                  <b style={{ color: 'var(--t2)' }}>{money(disp)}</b>
                </div>
              </div>
              {(() => {
                const earned = r.amount + other + disp;
                const ded = earned * (cfg.deductionPct || 0);
                return (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ color: 'var(--t3)' }}>Earned {money(earned)}</div>
                    {ded > 0 && (
                      <div style={{ color: 'var(--red)' }}>
                        Deduction {Math.round((cfg.deductionPct || 0) * 100)}% −{money(ded)}
                      </div>
                    )}
                    <div style={{ marginTop: 3, fontSize: 13, fontWeight: 800, color: 'var(--grn)' }}>
                      Payable {money(earned - ded)}
                      {cfg.pointsPerRupee
                        ? `  ·  ${num(Math.round((earned - ded) * cfg.pointsPerRupee))} points` : ''}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={save} disabled={busy || !canEdit}
                title={canEdit ? '' : 'Targets, rates and the gate can only be changed by the CEO (superadmin)'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}>
          <Save size={12} /> {busy ? 'Saving…' : 'Save rule'}
        </button>
        {!canEdit && <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>Read-only: targets, rates and the gate can only be changed by the CEO. Operations may clarify edge cases only.</span>}
        {defs && canEdit && (
          <button className="btn" onClick={() => setCfg({ ...defs })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12.5 }}>
            <RotateCcw size={12} /> Reset to the published scheme
          </button>
        )}
      </div>
    </div>
  );
}
