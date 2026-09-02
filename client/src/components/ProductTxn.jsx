import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, Upload, RefreshCw, AlertTriangle, CheckCircle2, Layers, FileSpreadsheet, X } from 'lucide-react';
import { api, getApiBase } from '../api';
import { notify, confirmDialog } from './Toast';

/**
 * ProductTxn — raw ERP product-transaction reporting.
 *
 * The ERP exports two sheets. The Product Master carries the taxonomy
 * (Category Type -> app Category, Product Type -> app Sub-Category) and the
 * Product Transaction sheet carries the actual invoice lines with real dates.
 * Uploading the master once lets every transaction line be resolved to a
 * category without anybody re-keying it into the Monthly Entry format.
 *
 * Two things this gives that the Sale collection cannot:
 *   1. real day-level dates (Sale is dealer x sub-category x MONTH), and
 *   2. the collection/brand level ("VN-TEX", "PASTELO"), which is the
 *      "product transaction category" the report is filterable by.
 */

const money = n => '₹' + Math.round(n || 0).toLocaleString('en-IN');
const qtyF = n => (Math.round((n || 0) * 100) / 100).toLocaleString('en-IN');

const GROUPS = [
  { id: 'brand',       label: 'Transaction Category' },
  { id: 'category',    label: 'Category' },
  { id: 'subCategory', label: 'Sub-Category' },
  { id: 'salesman',    label: 'Salesman' },
  { id: 'dealer',      label: 'Dealer' },
  { id: 'city',        label: 'City' },
  { id: 'day',         label: 'Day' },
  { id: 'month',       label: 'Month' },
  { id: 'product',     label: 'Product' },
];

/** Multi-select filter rendered as a scrollable list of toggle chips. */
function ChipFilter({ label, options, selected, onChange, maxHeight = 118 }) {
  if (!options?.length) return null;
  const toggle = v => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div style={{ minWidth: 190, flex: '1 1 220px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
          {label}
        </span>
        {selected.length > 0 && (
          <button className="btn" style={{ padding: '1px 6px', fontSize: 10 }} onClick={() => onChange([])}>
            clear ({selected.length})
          </button>
        )}
      </div>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4, maxHeight, overflowY: 'auto',
        border: '1px solid var(--b1)', borderRadius: 8, padding: 6, background: 'var(--bg2)',
      }}>
        {options.map(o => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              onClick={() => toggle(o)}
              title={o}
              style={{
                border: on ? '1px solid var(--acc)' : '1px solid var(--b2)',
                background: on ? 'var(--acc)' : 'var(--bg1)',
                color: on ? '#fff' : 'var(--t2)',
                borderRadius: 5, padding: '3px 8px', fontSize: 11,
                fontWeight: on ? 600 : 400, cursor: 'pointer', maxWidth: '100%',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Import panel                                                       */
/* ------------------------------------------------------------------ */

function ImportPanel({ onImported, txnTotal }) {
  const [masterStats, setMasterStats] = useState(null);
  const [preview, setPreview] = useState(null);   // { kind, file, data }
  const [busy, setBusy] = useState('');
  const [pct, setPct] = useState(0);
  const [sync, setSync] = useState(null);   // sales-sync preview

  const loadStats = useCallback(() => {
    api.ptxMasterStats().then(setMasterStats).catch(() => {});
  }, []);
  useEffect(loadStats, [loadStats]);

  /**
   * Wipe every imported transaction, so a fresh export can be loaded from a
   * clean slate. The product master is deliberately left alone: it is the
   * mapping table, it is slow to re-upload, and clearing it would strand the
   * next import with nothing to resolve against.
   */
  const clearAll = async () => {
    const ok = await confirmDialog({
      title: 'Erase all product transactions?',
      message:
        `This deletes all ${(txnTotal || 0).toLocaleString('en-IN')} imported transaction lines. ` +
        'The product master is kept, so you can upload a new export straight away. ' +
        'This cannot be undone from here — re-import the Excel to get them back.',
      confirmText: 'Erase transactions',
      danger: true,
    });
    if (!ok) return;
    setBusy('clear');
    api.ptxDeleteAll()
      .then(r => {
        setPreview(null);
        onImported?.();                       // refresh counts BEFORE anything that could throw
        loadStats();
        notify.success(`Erased ${(r.deleted || 0).toLocaleString('en-IN')} transaction lines`);
      })
      .catch(err => notify.error(err.message))
      .finally(() => setBusy(''));
  };

  /**
   * Roll the imported invoice lines up into Sale rows — the collection that
   * Overview, the MTD summary and Monthly Entry all read. Previewed first,
   * because it rewrites the numbers the whole dashboard runs on.
   */
  const previewSync = () => {
    setBusy('sync');
    api.ptxSyncSales(false)
      .then(setSync)
      .catch(err => notify.error(err.message))
      .finally(() => setBusy(''));
  };

  const commitSync = () => {
    setBusy('sync');
    api.ptxSyncSales(true)
      .then(r => {
        setSync(null);
        onImported?.();
        notify.success(`Monthly sales updated — ${r.inserted.toLocaleString('en-IN')} rows across ${r.months.length} month(s)`);
      })
      .catch(err => notify.error(err.message))
      .finally(() => setBusy(''));
  };

  const pick = (kind) => (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(kind); setPct(0); setPreview(null);
    const call = kind === 'master' ? api.ptxMasterUpload : api.ptxUpload;
    call(file, false, p => setPct(p))
      .then(data => setPreview({ kind, file, data }))
      .catch(err => notify.error(err.message))
      .finally(() => { setBusy(''); setPct(0); });
  };

  const confirm = () => {
    if (!preview) return;
    const { kind, file } = preview;
    setBusy(kind); setPct(0);
    const call = kind === 'master' ? api.ptxMasterUpload : api.ptxUpload;
    call(file, true, p => setPct(p))
      .then(data => {
        setPreview(null); loadStats(); onImported?.();
        notify.success(kind === 'master'
          ? `Product master loaded — ${data.totalInDb.toLocaleString('en-IN')} products`
          : `Imported ${data.written.toLocaleString('en-IN')} lines (${data.dateFrom} to ${data.dateTo})`);
      })
      .catch(err => notify.error(err.message))
      .finally(() => { setBusy(''); setPct(0); });
  };

  const Card = ({ step, title, desc, kind, disabled, hint }) => (
    <div className="card" style={{ flex: '1 1 320px', opacity: disabled ? .55 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%', background: 'var(--acc)', color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
        }}>{step}</span>
        <b style={{ fontSize: 14 }}>{title}</b>
      </div>
      <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 10 }}>{desc}</div>
      {hint}
      <label className="btnp" style={{ cursor: disabled ? 'not-allowed' : 'pointer', display: 'inline-flex' }}>
        <Upload size={14} />
        {busy === kind ? `Reading… ${pct}%` : 'Choose Excel file'}
        <input type="file" accept=".xlsx,.xls" onChange={pick(kind)} disabled={disabled || !!busy} style={{ display: 'none' }} />
      </label>
    </div>
  );

  const d = preview?.data;

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
        <Card
          step="1" kind="master" title="Product Master"
          desc="The catalogue. Its Category Type and Product Type columns are what map each product onto the app's own categories."
          hint={masterStats?.total ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 10, padding: '5px 10px',
              borderRadius: 7, background: 'rgba(52,211,153,.10)', border: '1px solid rgba(52,211,153,.3)',
              fontSize: 11.5, color: 'var(--grn)', fontWeight: 600,
            }}>
              <CheckCircle2 size={13} />
              {masterStats.total.toLocaleString('en-IN')} products loaded · {masterStats.brands} collections
            </div>
          ) : (
            <div style={{ fontSize: 11.5, color: 'var(--yel)', marginBottom: 10, fontWeight: 600 }}>
              Not loaded yet — do this first.
            </div>
          )}
        />
        <Card
          step="2" kind="txn" title="Product Transaction"
          desc="The invoice lines. Re-uploading an overlapping date range is safe — lines are matched on voucher + product, so nothing double-counts."
          disabled={!masterStats?.total}
          hint={txnTotal > 0 ? (
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 10 }}>
              {txnTotal.toLocaleString('en-IN')} lines currently imported.
            </div>
          ) : null}
        />
      </div>

      {/* Step 3 — push the imported lines into the Sale collection that the
          rest of the app reads. Kept as a separate, explicitly confirmed
          step: it rewrites the numbers behind Overview, MTD and targets. */}
      {txnTotal > 0 && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(52,211,153,.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: 'var(--grn)', color: '#04231a',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
            }}>3</span>
            <b style={{ fontSize: 14 }}>Update monthly sales</b>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {!sync && (
                <button className="btnp" onClick={previewSync} disabled={!!busy}>
                  {busy === 'sync' ? 'Checking…' : 'Check what would change'}
                </button>
              )}
              {sync && (
                <>
                  <button className="btn" onClick={() => setSync(null)}>Cancel</button>
                  <button className="btnp" onClick={commitSync} disabled={!!busy}>
                    {busy === 'sync' ? 'Updating…' : 'Apply to monthly sales'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
            Rolls the imported invoice lines up per month and writes them as the month's sales —
            the same shape Monthly Entry produces, so Overview, the MTD summary and targets all pick
            them up. Each month is rebuilt in full from every line imported for it, so uploading one
            more day and re-running gives the right running total instead of counting a day twice.
          </div>

          {sync && (
            <div style={{ marginTop: 14 }}>
              {sync.months.map(m => (
                <div key={m.month} style={{
                  marginBottom: 12, padding: '10px 12px', borderRadius: 9,
                  background: 'var(--bg2)',
                  border: '1px solid ' + (m.warnLowers ? 'rgba(248,113,113,.45)' : 'var(--b1)'),
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <b style={{ fontSize: 14 }}>{m.month}</b>
                    <span style={{ fontSize: 12.5, color: 'var(--t3)' }}>
                      {qtyF(m.currentQty)} <span style={{ opacity: .6 }}>({m.currentRows} rows)</span>
                      {'  →  '}
                      <b style={{ color: 'var(--t1)' }}>{qtyF(m.newQty)}</b>
                      <span style={{ opacity: .6 }}> ({m.newRows} rows)</span>
                    </span>
                    <span style={{
                      fontSize: 12.5, fontWeight: 700,
                      color: m.delta === 0 ? 'var(--t3)' : m.delta > 0 ? 'var(--grn)' : 'var(--red)',
                    }}>
                      {m.delta === 0 ? 'no change' : (m.delta > 0 ? '+' : '') + qtyF(m.delta)}
                    </span>
                    {m.bySource?.length > 0 && (
                      <span className="chip">
                        now: {m.bySource.map(b => `${b.source} ${qtyF(b.qty)}`).join(', ')}
                      </span>
                    )}
                  </div>

                  {m.warnLowers && (
                    <Warn>
                      This would <b>reduce</b> {m.month} from {qtyF(m.currentQty)} to {qtyF(m.newQty)}.
                      That normally means the imported lines cover only part of the month. Import the
                      rest of the month's transactions before applying, or this month will under-report.
                    </Warn>
                  )}
                  {m.droppedLines > 0 && (
                    <Warn>
                      {m.droppedLines} line(s) totalling {qtyF(m.droppedQty)} units are excluded — the
                      product has no category, or the dealer did not match. Fix those first if the
                      month needs to be complete.
                    </Warn>
                  )}

                  <div style={{ overflowX: 'auto', marginTop: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                      <thead>
                        <tr>{['Category', 'Sub-Category', 'Now', 'After', 'Change'].map((h, i) => (
                          <th key={h} style={{
                            textAlign: i >= 2 ? 'right' : 'left', padding: '5px 9px', color: 'var(--t3)',
                            fontSize: 10, textTransform: 'uppercase', letterSpacing: '.07em',
                            borderBottom: '1px solid var(--b1)', whiteSpace: 'nowrap',
                          }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {m.categories.map((c, i) => (
                          <tr key={i} style={{ background: c.delta !== 0 ? 'rgba(251,191,36,.07)' : 'transparent' }}>
                            <td style={{ padding: '5px 9px' }}>{c.category}</td>
                            <td style={{ padding: '5px 9px', color: 'var(--t3)' }}>{c.subCategory || '—'}</td>
                            <td style={{ padding: '5px 9px', textAlign: 'right' }}>{qtyF(c.before)}</td>
                            <td style={{ padding: '5px 9px', textAlign: 'right', fontWeight: 600 }}>{qtyF(c.after)}</td>
                            <td style={{
                              padding: '5px 9px', textAlign: 'right', fontWeight: 700,
                              color: c.delta === 0 ? 'var(--t3)' : c.delta > 0 ? 'var(--grn)' : 'var(--red)',
                            }}>{c.delta === 0 ? '—' : (c.delta > 0 ? '+' : '') + qtyF(c.delta)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                Applying replaces each listed month's sales entirely. Months not listed are untouched.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Start-over escape hatch. Overlapping re-uploads are the normal path;
          this is for replacing the data outright with a different export. */}
      {txnTotal > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          marginBottom: 16, padding: '10px 14px', borderRadius: 9,
          background: 'rgba(248,113,113,.07)', border: '1px solid rgba(248,113,113,.22)',
        }}>
          <div style={{ flex: '1 1 300px', fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--t2)' }}>Starting over?</b> Erase every imported transaction line and
            upload a fresh export. The product master is kept, so you can re-import immediately.
            You only need this to <i>replace</i> the data — a normal re-upload already updates
            matching lines instead of duplicating them.
          </div>
          <button className="btnd" onClick={clearAll} disabled={!!busy}
            style={{ padding: '7px 13px', fontSize: 12.5, whiteSpace: 'nowrap' }}>
            {busy === 'clear' ? 'Erasing…' : `Erase all ${txnTotal.toLocaleString('en-IN')} lines`}
          </button>
        </div>
      )}

      {d && (
        <div className="card" style={{ borderColor: 'var(--acc)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <b style={{ fontSize: 15 }}>
              Preview — nothing has been saved yet
            </b>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => setPreview(null)}>Cancel</button>
              <button className="btnp" onClick={confirm} disabled={!!busy}>
                {busy ? `Importing… ${pct}%` : 'Confirm import'}
              </button>
            </div>
          </div>

          {preview.kind === 'master' ? (
            <>
              <StatRow items={[
                ['Rows read', d.rowsRead.toLocaleString('en-IN')],
                ['Products', d.products.toLocaleString('en-IN')],
                ['Collections', d.brands],
                ['No Category Type', d.withoutCategoryType.toLocaleString('en-IN'), d.withoutCategoryType ? 'warn' : ''],
              ]} />
              <MiniTable
                head={['Category', 'Products']}
                rows={d.byCategory.map(r => [r.category, r.products.toLocaleString('en-IN')])} />
              {d.withoutCategoryType > 0 && (
                <Warn>
                  {d.withoutCategoryType.toLocaleString('en-IN')} products have no Category Type in the master itself.
                  They import, but sales of them will show as unresolved rather than being guessed into a category.
                </Warn>
              )}
            </>
          ) : (
            <>
              <StatRow items={[
                ['Lines', d.lines.toLocaleString('en-IN')],
                ['Vouchers', d.vouchers.toLocaleString('en-IN')],
                ['Days', d.days > 1 ? `${d.dateFrom} → ${d.dateTo}` : d.dateFrom],
                ['Total qty', qtyF(d.totalQty)],
                ['Total value', money(d.totalAmount)],
                ['Products resolved', `${d.resolved}/${d.lines}`, d.unresolved ? 'warn' : 'ok'],
                ['Dealers matched', `${d.dealersMatched}/${d.lines}`, d.dealersUnmatched ? 'warn' : 'ok'],
                ['Salesmen matched', `${d.salesmenMatched}/${d.lines}`, d.salesmenMatched < d.lines ? 'warn' : 'ok'],
              ]} />
              <MiniTable
                head={['Category', 'Sub-Category', 'Qty', 'Value']}
                rows={d.byCategory.map(r => [r.category, r.subCategory, qtyF(r.qty), money(r.amount)])}
                align={[0, 0, 1, 1]} />
              <Parked title="Products that could not be mapped" rows={d.unresolvedProducts} />
              <Parked title="Dealers not found in the app" rows={d.unmatchedDealers} />
              <Parked title="Salesmen not matched to a user" rows={d.unmatchedSalesmen} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// A grid rather than a flex row: with 8 cards, `flex-wrap` left a single
// orphan on the second line and squeezed the date range onto three lines.
const StatRow = ({ items }) => (
  <div style={{
    display: 'grid', gap: 8, marginBottom: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
  }}>
    {items.map(([k, v, tone]) => (
      <div key={k} style={{
        padding: '9px 12px', borderRadius: 8, background: 'var(--bg2)', minWidth: 0,
        border: '1px solid ' + (tone === 'warn' ? 'rgba(251,191,36,.4)' : tone === 'ok' ? 'rgba(52,211,153,.35)' : 'var(--b1)'),
      }}>
        <div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>{k}</div>
        <div style={{
          fontSize: 16, fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap',
          overflow: 'hidden', textOverflow: 'ellipsis',
          color: tone === 'warn' ? 'var(--yel)' : tone === 'ok' ? 'var(--grn)' : 'var(--t1)',
        }} title={String(v)}>{v}</div>
      </div>
    ))}
  </div>
);

const MiniTable = ({ head, rows, align = [] }) => (
  <div style={{ overflowX: 'auto', marginBottom: 12 }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
      <thead>
        <tr>{head.map((h, i) => (
          <th key={h} style={{
            textAlign: align[i] ? 'right' : 'left', padding: '6px 10px', color: 'var(--t3)',
            fontSize: 10, textTransform: 'uppercase', letterSpacing: '.08em',
            borderBottom: '1px solid var(--b1)', whiteSpace: 'nowrap',
          }}>{h}</th>
        ))}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ background: i % 2 ? 'var(--bg2)' : 'transparent' }}>
            {r.map((c, j) => (
              <td key={j} style={{ textAlign: align[j] ? 'right' : 'left', padding: '6px 10px', whiteSpace: 'nowrap' }}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Warn = ({ children }) => (
  <div style={{
    display: 'flex', gap: 8, alignItems: 'flex-start', padding: '9px 12px', borderRadius: 8,
    background: 'rgba(251,191,36,.10)', border: '1px solid rgba(251,191,36,.3)',
    fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginTop: 8,
  }}>
    <AlertTriangle size={14} style={{ color: 'var(--yel)', flexShrink: 0, marginTop: 1 }} />
    <div>{children}</div>
  </div>
);

const Parked = ({ title, rows }) => {
  if (!rows?.length) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yel)', marginBottom: 5 }}>
        {title} ({rows.length})
      </div>
      <div style={{
        maxHeight: 140, overflowY: 'auto', border: '1px solid var(--b1)',
        borderRadius: 7, padding: 8, background: 'var(--bg2)', fontSize: 11.5,
      }}>
        {rows.map(r => (
          <div key={r.value} style={{ padding: '2px 0', color: 'var(--t2)' }}>
            <span style={{ color: 'var(--t3)', marginRight: 8 }}>{r.lines}×</span>{r.value}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ProductTxn({ currentUser }) {
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const [tab, setTab] = useState('report');

  const [facets, setFacets] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [brand, setBrand] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [salesman, setSalesman] = useState([]);
  const [dealer, setDealer] = useState([]);
  const [groupBy, setGroupBy] = useState('brand');
  const [groupBy2, setGroupBy2] = useState('');
  const [data, setData] = useState(null);
  const [lines, setLines] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadFacets = useCallback(() => {
    api.ptxFacets().then(f => {
      setFacets(f);
      setFrom(p => p || f.dateFrom);
      setTo(p => p || f.dateTo);
    }).catch(() => {});
  }, []);
  useEffect(loadFacets, [loadFacets]);

  const query = useMemo(() => {
    const q = {};
    if (from) q.from = from;
    if (to) q.to = to;
    if (brand.length) q.brand = brand.join(',');
    if (category.length) q.category = category.join(',');
    if (subCategory.length) q.subCategory = subCategory.join(',');
    if (salesman.length) q.salesman = salesman.join(',');
    if (dealer.length) q.dealer = dealer.join(',');
    return q;
  }, [from, to, brand, category, subCategory, salesman, dealer]);

  // Changing two filters quickly fires two overlapping requests. Without a
  // guard the slower (older) response can land last and paint stale numbers
  // under the newer filters — so every response carries a sequence number
  // and anything but the latest is discarded.
  const reqSeq = React.useRef(0);

  const run = useCallback(() => {
    if (!facets?.total) return;
    const seq = ++reqSeq.current;
    setLoading(true); setLines(null);
    const gb = [groupBy, groupBy2].filter(Boolean).join(',');
    api.ptxReport({ ...query, groupBy: gb })
      .then(d => { if (seq === reqSeq.current) setData(d); })
      .catch(err => { if (seq === reqSeq.current) notify.error(err.message); })
      .finally(() => { if (seq === reqSeq.current) setLoading(false); });
  }, [query, groupBy, groupBy2, facets]);

  useEffect(() => { run(); }, [run]);

  const showLines = () => {
    const seq = ++reqSeq.current;
    setLoading(true);
    api.ptxLines({ ...query, limit: 500 })
      .then(d => { if (seq === reqSeq.current) setLines(d); })
      .catch(err => { if (seq === reqSeq.current) notify.error(err.message); })
      .finally(() => { if (seq === reqSeq.current) setLoading(false); });
  };

  const resetFilters = () => {
    setBrand([]); setCategory([]); setSubCategory([]); setSalesman([]); setDealer([]);
    setFrom(facets?.dateFrom || ''); setTo(facets?.dateTo || '');
  };

  const dims = data?.dims || [groupBy];
  const dimLabel = id => GROUPS.find(g => g.id === id)?.label || id;

  // Which grouping dimensions can be clicked to narrow the report, and where
  // each one sensibly leads next. Day/month/city/product are readable
  // groupings but poor places to stand, so they are not drill targets.
  const SETTERS = { brand: setBrand, category: setCategory, subCategory: setSubCategory, salesman: setSalesman, dealer: setDealer };
  const VALUES  = { brand, category, subCategory, salesman, dealer };
  const DRILL_NEXT = { brand: 'dealer', category: 'subCategory', subCategory: 'dealer', salesman: 'dealer', dealer: 'product' };

  /** Click a row to select that value and open up what sits underneath it. */
  const drillInto = (dim, value) => {
    const set = SETTERS[dim];
    if (!set || !value) return;
    set(prev => (prev.includes(value) ? prev : [...prev, value]));
    const next = DRILL_NEXT[dim];
    // Step to the next level, skipping anything already pinned by a filter.
    if (next && next !== groupBy2) setGroupBy(next);
    if (groupBy2 === next) setGroupBy2('');
  };

  const selections = Object.entries(VALUES)
    .flatMap(([dim, vals]) => vals.map(v => ({ dim, value: v })));
  const activeFilters = selections.length;

  const removeSelection = (dim, value) => SETTERS[dim](prev => prev.filter(x => x !== value));

  const exportCsv = () => {
    if (!data?.rows?.length) return;
    const head = [...dims.map(dimLabel), 'Qty', 'Value', 'Lines', 'Invoices', 'Dealers'];
    const body = data.rows.map(r => [
      ...dims.map(d => r.key[d] || '(none)'),
      r.qty, Math.round(r.amount), r.lines, r.vouchers, r.dealers,
    ]);
    const csv = [head, ...body]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-transactions_${dims.join('-')}_${from}_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <style>{`
        .ptx-row:hover{background:var(--bg3) !important}
        .ptx-row td[title^="Show only"]:hover{color:var(--acc) !important;text-decoration-color:var(--acc) !important}
      `}</style>
      <div className="page-head" style={{ marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 auto', minWidth: 240 }}>
          <div className="page-eyebrow" style={{ fontSize: 11, color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 4 }}>
            Raw ERP data
          </div>
          <div className="page-title" style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-.02em' }}>
            Product Transactions
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 5, maxWidth: 620, lineHeight: 1.5 }}>
            Invoice-level sales straight from the ERP, mapped to categories through the product master.
            Unlike Monthly Entry this keeps the real invoice date, so you can slice by day and by
            transaction category.
          </div>
        </div>
        {isAdmin && (
          <div className="tabs" style={{ display: 'flex', gap: 6 }}>
            {[['report', 'Report', Layers], ['import', 'Import', Upload]].map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)}
                className={tab === id ? 'btnp' : 'btn'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'import' && isAdmin && <ImportPanel onImported={loadFacets} txnTotal={facets?.total || 0} />}

      {tab === 'report' && (
        <>
          {!facets?.total ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Package size={30} style={{ color: 'var(--t3)', marginBottom: 10 }} />
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No product transactions imported yet</div>
              <div style={{ fontSize: 12.5, color: 'var(--t3)' }}>
                {isAdmin
                  ? 'Open the Import tab and upload the Product Master, then a Product Transaction export.'
                  : 'Ask an admin to import the ERP product-transaction export.'}
              </div>
              {/* Imports live in whichever database this client is pointed at.
                  Naming the server here turns "why is it empty?" into an
                  answer instead of a hunt. */}
              <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 14, opacity: .8 }}>
                Reading from <code style={{
                  background: 'var(--bg2)', border: '1px solid var(--b1)', borderRadius: 4,
                  padding: '2px 6px', color: 'var(--t2)',
                }}>{getApiBase()}</code>
                <br />
                An import only appears on the server it was uploaded to.
              </div>
            </div>
          ) : (
            <>
              {/* ── Filters ── */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="row" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>From</div>
                    <input className="sel" type="date" value={from} min={facets.dateFrom} max={facets.dateTo}
                      onChange={e => setFrom(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>To</div>
                    <input className="sel" type="date" value={to} min={facets.dateFrom} max={facets.dateTo}
                      onChange={e => setTo(e.target.value)} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>Group by</div>
                    <select className="sel" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                      {GROUPS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 5 }}>Then by</div>
                    <select className="sel" value={groupBy2} onChange={e => setGroupBy2(e.target.value)}>
                      <option value="">— none —</option>
                      {GROUPS.filter(g => g.id !== groupBy).map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 7, marginLeft: 'auto' }}>
                    {activeFilters > 0 && (
                      <button className="btn" onClick={resetFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <X size={13} />Reset {activeFilters}
                      </button>
                    )}
                    <button className="btn" onClick={run} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <RefreshCw size={13} className={loading ? 'spin' : ''} />Refresh
                    </button>
                    <button className="btn" onClick={showLines} disabled={loading}>Invoice lines</button>
                    <button className="btnp" onClick={exportCsv} disabled={!data?.rows?.length}>
                      <FileSpreadsheet size={14} />Export
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <ChipFilter label="Transaction Category" options={facets.brands} selected={brand} onChange={setBrand} />
                  <ChipFilter label="Category" options={facets.categories} selected={category} onChange={setCategory} />
                  <ChipFilter label="Sub-Category" options={facets.subCategories} selected={subCategory} onChange={setSubCategory} />
                  {facets.salesmen.length > 1 && (
                    <ChipFilter label="Salesman" options={facets.salesmen} selected={salesman} onChange={setSalesman} />
                  )}
                </div>
              </div>

              {/* ── What is currently selected, and how to undo it ── */}
              {selections.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap',
                  marginBottom: 12, padding: '9px 12px', borderRadius: 9,
                  background: 'var(--accL)', border: '1px solid rgba(99,102,241,.3)',
                }}>
                  <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em' }}>
                    Showing
                  </span>
                  {selections.map(({ dim, value }) => (
                    <button key={dim + value} onClick={() => removeSelection(dim, value)}
                      title={`Remove this ${dimLabel(dim)} filter`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        background: 'var(--acc)', border: '1px solid var(--acc)', color: '#fff',
                        borderRadius: 6, padding: '4px 9px', fontSize: 12, fontWeight: 600,
                      }}>
                      <span style={{ opacity: .75, fontWeight: 500, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                        {dimLabel(dim)}
                      </span>
                      {value}
                      <X size={12} style={{ opacity: .85 }} />
                    </button>
                  ))}
                  <button className="btn" style={{ padding: '3px 9px', fontSize: 11, marginLeft: 'auto' }} onClick={resetFilters}>
                    Clear all
                  </button>
                </div>
              )}

              {/* ── Totals ── */}
              {data?.totals && (
                <StatRow items={[
                  ['Quantity', qtyF(data.totals.qty)],
                  ['Value', money(data.totals.amount)],
                  ['Invoices', data.totals.vouchers.toLocaleString('en-IN')],
                  ['Lines', data.totals.lines.toLocaleString('en-IN')],
                ]} />
              )}

              {/* ── Result table ── */}
              {lines ? (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <b>Invoice lines ({lines.count})</b>
                    <button className="btn" onClick={() => setLines(null)}>Back to summary</button>
                  </div>
                  <div style={{ overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                      <thead style={{ position: 'sticky', top: 0, background: 'var(--bg1)', zIndex: 1 }}>
                        <tr>
                          {['Date', 'Voucher', 'Dealer', 'Txn Category', 'Category', 'Sub-Cat', 'Product', 'Salesman', 'Qty', 'Value'].map((h, i) => (
                            <th key={h} style={{
                              textAlign: i >= 8 ? 'right' : 'left', padding: '7px 10px', color: 'var(--t3)',
                              fontSize: 10, textTransform: 'uppercase', letterSpacing: '.07em',
                              borderBottom: '1px solid var(--b1)', whiteSpace: 'nowrap',
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {lines.rows.map((r, i) => (
                          <tr key={r._id || i} style={{ background: i % 2 ? 'var(--bg2)' : 'transparent' }}>
                            <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{r.dateStr}</td>
                            <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', color: 'var(--t3)' }}>{r.voucherNo}</td>
                            <td style={{ padding: '6px 10px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              title={r.dealerName || r.companyName}>{r.dealerName || r.companyName}</td>
                            <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{r.brand}</td>
                            <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', color: r.resolved ? 'var(--t1)' : 'var(--yel)' }}>
                              {r.category || 'unresolved'}
                            </td>
                            <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', color: 'var(--t3)' }}>{r.subCategory}</td>
                            <td style={{ padding: '6px 10px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              title={r.productName}>{r.productName}</td>
                            <td style={{ padding: '6px 10px', whiteSpace: 'nowrap', color: 'var(--t3)' }}>{r.salesman}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{qtyF(r.qty)}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right' }}>{money(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="card">
                  {loading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--t3)' }}>Loading…</div>}
                  {!loading && !data?.rows?.length && (
                    <div style={{ padding: 30, textAlign: 'center', color: 'var(--t3)' }}>
                      Nothing matches these filters.
                    </div>
                  )}
                  {!loading && !!data?.rows?.length && (
                    <>
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 8 }}>
                      Click any <b style={{ color: 'var(--t2)' }}>{dimLabel(dims[0])}</b> to see the sales inside it.
                    </div>
                    <div style={{ overflowX: 'auto', maxHeight: '62vh', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--bg1)', zIndex: 1 }}>
                          <tr>
                            {dims.map(d => (
                              <th key={d} style={{
                                textAlign: 'left', padding: '9px 12px', color: 'var(--t3)', fontSize: 10,
                                textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '2px solid var(--b2)',
                              }}>{dimLabel(d)}</th>
                            ))}
                            {['Qty', 'Value', 'Invoices', 'Dealers'].map(h => (
                              <th key={h} style={{
                                textAlign: 'right', padding: '9px 12px', color: 'var(--t3)', fontSize: 10,
                                textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '2px solid var(--b2)',
                                whiteSpace: 'nowrap',
                              }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.rows.map((r, i) => {
                            const share = data.totals.qty ? (r.qty / data.totals.qty) * 100 : 0;
                            return (
                              <tr key={i} className="ptx-row" style={{ background: i % 2 ? 'var(--bg2)' : 'transparent' }}>
                                {dims.map(d => {
                                  const val = r.key[d];
                                  const can = !!SETTERS[d] && !!val && !VALUES[d].includes(val);
                                  return (
                                    <td key={d}
                                      onClick={can ? () => drillInto(d, val) : undefined}
                                      title={can ? `Show only ${val} — ${dimLabel(d)}` : (val || '')}
                                      style={{
                                        padding: '8px 12px', fontWeight: d === dims[0] ? 600 : 400,
                                        color: val ? 'var(--t1)' : 'var(--t3)',
                                        maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        cursor: can ? 'pointer' : 'default',
                                        // One shorthand only: mixing `textDecoration` with
                                        // `textDecorationColor` makes React warn and can drop
                                        // the colour on re-render.
                                        textDecoration: can ? 'underline var(--b2)' : 'none',
                                        textUnderlineOffset: 3,
                                      }}>{val || '(none)'}</td>
                                  );
                                })}
                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                                  {qtyF(r.qty)}
                                  <span style={{ color: 'var(--t3)', fontWeight: 400, fontSize: 11, marginLeft: 6 }}>
                                    {share >= 0.5 ? `${share.toFixed(0)}%` : ''}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{money(r.amount)}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--t3)' }}>{r.vouchers}</td>
                                <td style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--t3)' }}>{r.dealers}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="row-grand" style={{ borderTop: '2px solid var(--b2)', fontWeight: 700 }}>
                            <td colSpan={dims.length} style={{ padding: '9px 12px' }}>Total</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right' }}>{qtyF(data.totals.qty)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right' }}>{money(data.totals.amount)}</td>
                            <td style={{ padding: '9px 12px', textAlign: 'right' }}>{data.totals.vouchers}</td>
                            <td style={{ padding: '9px 12px' }} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
