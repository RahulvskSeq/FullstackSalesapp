import React, { useState, useEffect, useMemo } from 'react';
import { Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../api';

/**
 * SalesByBrand — sales grouped by the ERP transaction category.
 *
 * The product-transaction export carries three levels. Two of them already
 * drive the app's own taxonomy:
 *
 *   Category Type  ->  Category      (LAMINATE, LINER, ...)
 *   Product Type   ->  Sub-Category  (1 MM, CHARCOAL, ...)
 *   Category       ->  the collection actually sold  <- this panel
 *
 * The third has no equivalent anywhere else in the app, so this is the only
 * place the collection split is visible. Rows only exist for months that
 * were synced from a transaction import; anything keyed in by hand has no
 * collection and is reported separately rather than silently dropped.
 */
/** "Sep-26" -> "2026-09". Mirrors the converter in CategorySalesPanel. */
function moLabelToYM(lbl) {
  if (!lbl) return '';
  const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(lbl.trim());
  if (!m) return '';
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const mi = months.indexOf(m[1].slice(0, 3).toLowerCase());
  if (mi < 0) return '';
  let y = +m[2]; if (y < 100) y += 2000;
  return `${y}-${String(mi + 1).padStart(2, '0')}`;
}

export default function SalesByBrand({ monthLabel, salesman }) {
  const month = moLabelToYM(monthLabel);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!month) return;
    setLoading(true);
    const q = { month };
    if (salesman) q.salesman = salesman;
    api.salesByBrand(q)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [month, salesman]);

  const rows = useMemo(() => (data?.rows || []).filter(r => r.brand), [data]);
  const total = useMemo(() => rows.reduce((a, r) => a + r.qty, 0), [rows]);
  const shown = showAll ? rows : rows.slice(0, 12);

  // Nothing to show unless this month came from a transaction import.
  if (!loading && !rows.length) return null;

  return (
    <div className="card" style={{ marginBottom: 16, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Tag size={15} style={{ color: 'var(--acc)' }} />
        <b style={{ fontSize: 14 }}>Transaction Category{monthLabel ? ` — ${monthLabel}` : ''}</b>
        <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
          the collection sold, straight from the ERP
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>Total</span>
          <b style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{total.toLocaleString('en-IN')}</b>
        </div>
      </div>

      {loading && <div style={{ padding: 16, textAlign: 'center', color: 'var(--t3)', fontSize: 12.5 }}>Loading…</div>}

      {!loading && (
        <>
          <div style={{
            display: 'grid', gap: 8,
            gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))',
          }}>
            {shown.map(r => {
              const share = total ? (r.qty / total) * 100 : 0;
              const open = expanded === r.brand;
              return (
                <div key={r.brand}
                  onClick={() => setExpanded(open ? null : r.brand)}
                  title="Show the category split"
                  style={{
                    padding: '9px 11px', borderRadius: 9, cursor: 'pointer',
                    background: 'var(--bg2)',
                    border: '1px solid ' + (open ? 'var(--acc)' : 'var(--b1)'),
                  }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    {open ? <ChevronDown size={12} style={{ color: 'var(--acc)', flexShrink: 0 }} />
                          : <ChevronRight size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />}
                    <span style={{
                      fontSize: 12.5, fontWeight: 600, flex: 1, minWidth: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{r.brand}</span>
                    <b style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                      {r.qty.toLocaleString('en-IN')}
                    </b>
                  </div>

                  <div style={{ height: 3, background: 'var(--b1)', borderRadius: 2, margin: '7px 0 5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(share, 1.5)}%`, background: 'var(--acc)', borderRadius: 2 }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--t3)' }}>
                    <span>{r.dealers} dealer{r.dealers === 1 ? '' : 's'}</span>
                    <span>{share.toFixed(1)}% of total</span>
                  </div>

                  {open && (
                    <div style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid var(--b1)' }}>
                      {[...r.categories].sort((a, b) => b.qty - a.qty).map(c => (
                        <div key={c.category} style={{
                          display: 'flex', justifyContent: 'space-between', gap: 8,
                          fontSize: 11.5, padding: '2px 0',
                        }}>
                          <span style={{ color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.category}
                          </span>
                          <b style={{ fontVariantNumeric: 'tabular-nums' }}>{c.qty.toLocaleString('en-IN')}</b>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {rows.length > 12 && (
            <button className="btn" style={{ marginTop: 10, fontSize: 12 }} onClick={() => setShowAll(v => !v)}>
              {showAll ? 'Show top 12' : `Show all ${rows.length} collections`}
            </button>
          )}

          {data?.unbranded > 0 && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--t3)' }}>
              {data.unbranded.toLocaleString('en-IN')} units have no collection — they were entered
              through Monthly Entry rather than imported from a transaction export.
            </div>
          )}
        </>
      )}
    </div>
  );
}
