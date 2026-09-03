import React, { useState, useEffect, useMemo } from 'react';
import { X, Package, Users, User, Layers, Calendar } from 'lucide-react';
import { api } from '../api';

/**
 * CatalogueModal — everything behind one catalogue card.
 *
 * Sale rows carry only category and sub-category, so product NAMES can only
 * come from the invoice lines. This reads /producttx/catalogue-detail, which
 * aggregates ProductTxn and applies the same salesman scoping as the rest of
 * the app: a salesman opening this sees only their own dealers and numbers.
 */

const n = v => (v || 0).toLocaleString('en-IN');
const money = v => '₹' + Math.round(v || 0).toLocaleString('en-IN');

const TABS = [
  { id: 'products',   label: 'Products',   icon: Package },
  { id: 'dealers',    label: 'Dealers',    icon: Users },
  { id: 'salesmen',   label: 'Salesmen',   icon: User },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'days',       label: 'By day',     icon: Calendar },
];

export default function CatalogueModal({ brand, month, monthLabel, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!brand) return;
    setLoading(true); setData(null);
    api.ptxCatalogueDetail({ brand, ...(month ? { month } : {}) })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [brand, month]);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toUpperCase();
    const hit = (...fields) => !needle || fields.some(f => String(f || '').toUpperCase().includes(needle));
    if (tab === 'products')   return data.products.filter(r => hit(r.name, r.code, r.category, r.subCategory));
    if (tab === 'dealers')    return data.dealers.filter(r => hit(r.dealer, r.salesman));
    if (tab === 'salesmen')   return data.salesmen.filter(r => hit(r.salesman));
    if (tab === 'categories') return data.categories.filter(r => hit(r.category, r.subCategory));
    return data.days;
  }, [data, tab, q]);

  const t = data?.totals;
  const maxDay = useMemo(() => Math.max(1, ...(data?.days || []).map(d => d.qty)), [data]);

  const th = (label, right) => (
    <th key={label} style={{
      textAlign: right ? 'right' : 'left', padding: '7px 10px', color: 'var(--t3)',
      fontSize: 10, textTransform: 'uppercase', letterSpacing: '.07em',
      borderBottom: '1px solid var(--b1)', whiteSpace: 'nowrap',
      position: 'sticky', top: 0, background: 'var(--bg1)', zIndex: 1,
    }}>{label}</th>
  );
  const td = (v, right, opts = {}) => (
    <td style={{
      textAlign: right ? 'right' : 'left', padding: '6px 10px',
      whiteSpace: 'nowrap', maxWidth: opts.max || 'none',
      overflow: 'hidden', textOverflow: 'ellipsis',
      color: opts.dim ? 'var(--t3)' : 'var(--t1)',
      fontWeight: opts.bold ? 700 : 400,
    }} title={opts.title}>{v}</td>
  );

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
      <div className="modal" style={{
        background: 'var(--bg1)', border: '1px solid var(--b2)', borderRadius: 14,
        width: 'min(980px, 100%)', maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, color: 'var(--acc)', textTransform: 'uppercase', letterSpacing: '.12em' }}>
                Catalogue{monthLabel ? ` · ${monthLabel}` : ''}
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.01em' }}>{brand}</div>
            </div>
            <button className="btn" onClick={onClose} style={{ marginLeft: 'auto', padding: '6px 9px' }} title="Close (Esc)">
              <X size={15} />
            </button>
          </div>

          {t && (
            <div style={{ display: 'grid', gap: 8, marginTop: 12,
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
              {[
                ['Units', n(t.qty)], ['Value', money(t.amount)],
                ['Invoices', n(t.vouchers)], ['Dealers', n(t.dealers)],
                ['Products', n(data.products.length)],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '7px 10px', borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--b1)' }}>
                  <div style={{ fontSize: 9.5, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>{k}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* tabs + search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderBottom: '1px solid var(--b1)', flexWrap: 'wrap' }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = tab === id;
            const count = data ? (id === 'days' ? data.days.length : data[id]?.length) : 0;
            return (
              <button key={id} onClick={() => { setTab(id); setQ(''); }}
                className={on ? 'btnp' : 'btn'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', fontSize: 12 }}>
                <Icon size={12} />{label}
                {data && <span style={{ opacity: .7 }}>{count}</span>}
              </button>
            );
          })}
          {tab !== 'days' && (
            <input className="sel" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Filter…" style={{ marginLeft: 'auto', fontSize: 12, width: 180, cursor: 'text' }} />
          )}
        </div>

        {/* body */}
        <div style={{ overflow: 'auto', flex: 1 }}>
          {loading && <div style={{ padding: 30, textAlign: 'center', color: 'var(--t3)' }}>Loading…</div>}
          {!loading && !data && <div style={{ padding: 30, textAlign: 'center', color: 'var(--t3)' }}>Nothing to show.</div>}

          {!loading && data && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr>
                  {tab === 'products'   && [th('Product'), th('Code'), th('Category'), th('Sub-Category'), th('Dealers', 1), th('Qty', 1), th('Value', 1)]}
                  {tab === 'dealers'    && [th('Dealer'), th('Salesman'), th('Lines', 1), th('Qty', 1), th('Value', 1)]}
                  {tab === 'salesmen'   && [th('Salesman'), th('Dealers', 1), th('Qty', 1), th('Value', 1)]}
                  {tab === 'categories' && [th('Category'), th('Sub-Category'), th('Qty', 1), th('Value', 1)]}
                  {tab === 'days'       && [th('Date'), th('Qty', 1), th('Value', 1), th('')]}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 ? 'var(--bg2)' : 'transparent' }}>
                    {tab === 'products' && <>
                      {td(r.name || '—', 0, { max: 260, bold: true, title: r.name })}
                      {td(r.code || '—', 0, { dim: true })}
                      {td(r.category || '—', 0, { dim: true })}
                      {td(r.subCategory || '—', 0, { dim: true })}
                      {td(n(r.dealers), 1, { dim: true })}
                      {td(n(r.qty), 1, { bold: true })}
                      {td(money(r.amount), 1)}
                    </>}
                    {tab === 'dealers' && <>
                      {td(r.dealer || '—', 0, { max: 300, bold: true, title: r.dealer })}
                      {td(r.salesman || '—', 0, { dim: true })}
                      {td(n(r.lines), 1, { dim: true })}
                      {td(n(r.qty), 1, { bold: true })}
                      {td(money(r.amount), 1)}
                    </>}
                    {tab === 'salesmen' && <>
                      {td(r.salesman || '—', 0, { bold: true })}
                      {td(n(r.dealers), 1, { dim: true })}
                      {td(n(r.qty), 1, { bold: true })}
                      {td(money(r.amount), 1)}
                    </>}
                    {tab === 'categories' && <>
                      {td(r.category || '—', 0, { bold: true })}
                      {td(r.subCategory || '—', 0, { dim: true })}
                      {td(n(r.qty), 1, { bold: true })}
                      {td(money(r.amount), 1)}
                    </>}
                    {tab === 'days' && <>
                      {td(r.date, 0, { bold: true })}
                      {td(n(r.qty), 1, { bold: true })}
                      {td(money(r.amount), 1)}
                      <td style={{ padding: '6px 10px', width: '38%' }}>
                        <div style={{ height: 5, background: 'var(--b1)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(r.qty / maxDay) * 100}%`, background: 'var(--acc)', borderRadius: 3 }} />
                        </div>
                      </td>
                    </>}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: 'var(--t3)' }}>
                    Nothing matches “{q.trim()}”.
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--b1)', fontSize: 10.5, color: 'var(--t3)' }}>
          Product names come from the ERP invoice lines — Monthly Entry records category totals only.
        </div>
      </div>
    </div>
  );
}
