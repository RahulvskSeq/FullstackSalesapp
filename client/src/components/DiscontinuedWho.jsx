import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, AlertTriangle, ChevronDown, Store, Package } from 'lucide-react';
import { api } from '../api';

// Discontinued products and who buys them — by product (which dealers) or by dealer
// (which discontinued products). From Tally's discontinued list and the product
// transactions uploaded so far; a salesman sees his own dealers only.
const fmt = n => Number(n || 0).toLocaleString('en-IN');
const dShort = ymd => ymd ? new Date(ymd + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

export default function DiscontinuedWho({ by = 'product' }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState({});
  const load = (refresh) => { setErr(''); setData(null); api.discontinuedDealers(refresh).then(setData).catch(e => setErr(e?.message || 'Could not load')); };
  useEffect(() => { load(false); }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    const hit = t => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '').includes(s);
    if (!data) return [];
    // searching finds it on either side: a product row also matches by one of its dealers, and the other way round
    return by === 'product'
      ? data.products.filter(p => !s || hit(p.name) || hit(p.code) || p.dealers.some(d => hit(d.name)))
      : data.dealers.filter(d => !s || hit(d.name) || hit(d.city) || d.products.some(p => hit(p.name) || hit(p.code)));
  }, [data, q, by]);

  return (
    <>
      <div className="stk-search">
        <Search size={16} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={by === 'product' ? 'Product name or code — or a dealer…' : 'Dealer name or city — or a product…'} autoComplete="off" />
        {q && <button onClick={() => setQ('')} aria-label="Clear"><X size={13} /></button>}
      </div>
      <div className="stk-bar">
        {data && <span className="stk-count" style={{ marginLeft: 0 }}>
          {by === 'product' ? `${fmt(list.length)} discontinued product${list.length === 1 ? '' : 's'} bought` : `${fmt(list.length)} dealer${list.length === 1 ? '' : 's'} buying discontinued`}
          {data.range?.from ? ` · sales ${dShort(data.range.from)} – ${dShort(data.range.to)}` : ''}
        </span>}
      </div>
      <div className="stk-list">
        {err && <div className="stk-msg err"><AlertTriangle size={18} />{err}<button className="btn" onClick={() => load(true)}>Try again</button></div>}
        {!err && !data && [0, 1, 2, 3].map(i => <div key={i} className="stk-row skel" style={{ height: 58 }} />)}
        {!err && data && !list.length && <div className="stk-msg"><Package size={22} />{q ? `Nothing matches “${q}”.` : 'No discontinued product was bought in the uploaded sales.'}</div>}
        {!err && list.map(x => {
          const k = (x.code || '') + '|' + (x.id || x.name); const ex = !!open[k];
          const kids = by === 'product' ? x.dealers : x.products;
          return (
            <div key={k} className={'dw-card' + (ex ? ' on' : '')}>
              <button className="dw-head" onClick={() => setOpen(o => ({ ...o, [k]: !o[k] }))}>
                <span className="dw-ico">{by === 'product' ? <Package size={16} /> : <Store size={16} />}</span>
                <span className="dw-main">
                  <b>{x.name}</b>
                  <small>{by === 'product'
                    ? <>{x.code && <span className="stk-code">{x.code}</span>} bought by {x.dealers.length} dealer{x.dealers.length === 1 ? '' : 's'} · {fmt(x.qty)} sold</>
                    : <>{x.city ? x.city + ' · ' : ''}{x.products.length} discontinued product{x.products.length === 1 ? '' : 's'} · {fmt(x.qty)} bought</>}</small>
                </span>
                {by === 'product' && <span className={'dw-stock' + (x.stock > 0 ? ' in' : '')}><b>{fmt(x.stock)}</b><span>left</span></span>}
                <ChevronDown size={16} className="dw-chev" />
              </button>
              {ex && <div className="dw-kids">
                {kids.map(c => (
                  <div key={(c.code || '') + (c.id || c.name)} className="dw-kid">
                    <span className="dw-main"><b>{c.name}</b><small>{by === 'product' ? (c.city || '') : (c.code || '')}{c.last ? ` · last ${dShort(c.last)}` : ''}{by === 'dealer' ? ` · ${fmt(c.stock)} left` : ''}</small></span>
                    <span className="dw-q">{fmt(c.qty)}</span>
                  </div>
                ))}
              </div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
