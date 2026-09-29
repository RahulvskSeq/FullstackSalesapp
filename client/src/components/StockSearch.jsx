import React, { useEffect, useRef, useState } from 'react';
import { Package, Search, X, RefreshCw, Boxes, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import { useT } from '../i18n';

// Live stock from Tally, opened from the top bar. The server holds the product
// list for a few minutes and returns only what matches, so typing stays fast.
const RECENT_KEY = 'stp_stock_recent';
const STATUS_TONE = { active:'#10b981', 'special item':'#8b5cf6', discontinued:'#ef4444', pending:'#f59e0b', 'paper not available':'#64748b' };
const toneOf = s => STATUS_TONE[String(s || '').toLowerCase()] || '#64748b';
const fmt = n => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function StockSearch({ open, onClose, mode = '' }) {
  const disc = mode === 'discontinued';
  const { t: tr } = useT();   // the discontinued list: same search, only discontinued items
  const [q, setQ] = useState('');
  const [inStock, setInStock] = useState(false);
  useEffect(() => { if (open) { setInStock(disc); setQ(''); } }, [open, disc]);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [recent, setRecent] = useState(() => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } });
  const inputRef = useRef(null);
  const seq = useRef(0);

  const run = async (query, opts = {}) => {
    const my = ++seq.current;
    setBusy(true); setErr('');
    try {
      const r = await api.stockSearch(query, { inStock, ...(disc ? { status: 'discontinued', limit: 200 } : {}), ...opts });
      if (my === seq.current) setData(r);
    } catch (e) {
      if (my === seq.current) {
        const m = String(e?.message || '');
        setErr(/failed to fetch|network|load failed/i.test(m) ? "Can't reach the server — check your internet and try again"
          : /not found|404|cannot get/i.test(m) ? 'Stock search is not switched on for this server yet — ask your admin'
          : m || 'Could not reach the stock service');
      }
    } finally { if (my === seq.current) setBusy(false); }
  };

  // search as you type (debounced); also re-run when the filter changes
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => run(q.trim()), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, inStock, open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 60);
    const k = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);

  const remember = term => {
    const t = term.trim(); if (!t) return;
    const next = [t, ...recent.filter(x => x.toLowerCase() !== t.toLowerCase())].slice(0, 6);
    setRecent(next); try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  };

  if (!open) return null;
  const rows = data?.results || [];
  const updated = data?.updatedAt ? new Date(data.updatedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '';

  return (
    <div className="overlay stk-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="stk" role="dialog" aria-label="Stock search">
        <div className="stk-head">
          <span className="stk-ico"><Boxes size={18}/></span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="stk-title">{tr(disc ? 'Discontinued products' : 'Stock search')}</div>
            <div className="stk-sub">
              Live from Tally{data ? <> · {fmt(data.totalProducts)} items · <b>{fmt(data.inStockProducts)}</b> in stock{updated && <> · updated {updated}</>}</> : ' · loading…'}
            </div>
          </div>
          <button className="stk-iconbtn" title="Fetch fresh stock from Tally" onClick={() => run(q.trim(), { refresh: true })} disabled={busy}>
            <RefreshCw size={15} className={busy ? 'spin' : ''}/>
          </button>
          <button className="stk-iconbtn" onClick={onClose} aria-label="Close"><X size={17}/></button>
        </div>

        <div className="stk-search">
          <Search size={16}/>
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') remember(q); }}
            onBlur={() => remember(q)} placeholder="Design no. or name — 5539 PG, 5539pg, stone…" inputMode="search" autoComplete="off"/>
          {q && <button onClick={() => { setQ(''); inputRef.current?.focus(); }} aria-label="Clear"><X size={13}/></button>}
        </div>

        <div className="stk-bar">
          <button className={'thr' + (inStock ? ' on' : '')} style={{ '--tone': '#10b981' }} onClick={() => setInStock(v => !v)}>
            <CheckCircle2 size={12} style={{ verticalAlign: '-2px', marginRight: 4 }}/>{tr('In stock only')}
          </button>
          {!q && recent.map(r => <button key={r} className="thr" style={{ '--tone': 'var(--acc)' }} onClick={() => setQ(r)}>{r}</button>)}
          <span style={{ flex: 1 }}/>
          {data && <span className="stk-count">{q || disc ? `${fmt(data.matches)} ${disc ? 'discontinued' : 'match' + (data.matches === 1 ? '' : 'es')}` : 'Top items in stock'}</span>}
        </div>

        <div className="stk-list">
          {err && <div className="stk-msg err"><AlertTriangle size={18}/>{err}<button className="btn" onClick={() => run(q.trim())}>Try again</button></div>}
          {!err && !data && [0, 1, 2, 3, 4].map(i => <div key={i} className="stk-row skel" style={{ height: 58 }}/>)}
          {/* the answer first: is it available or not */}
          {!err && data && q.trim() && data.matchesAll === 0 && (
            <div className="stk-verdict none"><AlertTriangle size={20}/><div><b>{tr('No stock available')}</b><span>No product found for “{q.trim()}”. Check the design number, or type just the number (e.g. 5539).</span></div></div>
          )}
          {!err && data && q.trim() && data.matchesAll > 0 && data.inStockMatches === 0 && (
            <div className="stk-verdict none"><AlertTriangle size={20}/><div><b>{tr('No stock available')}</b><span>{data.matchesAll} matching item{data.matchesAll === 1 ? '' : 's'} found, all at 0.</span></div></div>
          )}
          {!err && data && q.trim() && data.inStockMatches > 0 && (
            <div className="stk-verdict ok"><CheckCircle2 size={20}/><div><b>{data.inStockMatches} item{data.inStockMatches === 1 ? '' : 's'} in stock</b><span>{fmt(rows.filter(r => r.stock > 0).reduce((a, r) => a + r.stock, 0))} qty available across the items shown (each design counted once).</span></div></div>
          )}
          {!err && data && disc && !q.trim() && (
            <div className="stk-fuzzy" style={{ color: '#b91c1c', background: 'rgba(239,68,68,.08)' }}>Discontinued designs{inStock ? ' still in stock — push these first' : ''}. Turn off “In stock only” to see all {fmt(data.matchesAll)}.</div>
          )}
          {!err && data && data.fuzzy && (
            <div className="stk-fuzzy">No exact match for “{q.trim()}” — showing the closest names.</div>
          )}
          {!err && data && rows.length === 0 && inStock && data.matchesAll > 0 && (
            <div className="stk-msg"><Package size={22}/>Turn off “In stock only” to see the {data.matchesAll} item{data.matchesAll === 1 ? '' : 's'} at 0.</div>
          )}
          {!err && rows.map((r, i) => {
            const qty = r.eff ?? r.stock;          // a child shows its parent design's stock
            const out = qty <= 0;
            return (
              <div key={r.code + r.name + i} className={'stk-row' + (out ? ' out' : '')} style={{ '--st': toneOf(r.status) }}>
                <span className="stk-thumb"><Package size={17}/></span>
                <div className="stk-main">
                  <div className="stk-name">{r.name || r.code}</div>
                  <div className="stk-meta">
                    {r.code && <span className="stk-code">{r.code}</span>}
                    {r.status && <span className="stk-status">{r.status}</span>}
                    {r.isParent && <span className="stk-tag parent">Parent</span>}
                  </div>
                  {r.parentName && <div className="stk-parent">{r.viaParent ? 'Stock of ' : 'Same design as '}<b>{r.parentName}</b></div>}
                </div>
                <div className={'stk-qty' + (qty > 0 ? ' in' : qty < 0 ? ' neg' : '') + (r.viaParent ? ' via' : '')}>
                  <b>{qty > 0 ? fmt(qty) : qty < 0 ? fmt(qty) : '0'}</b>
                  <span>{qty > 0 ? tr(r.viaParent ? 'via parent' : 'in stock') : qty < 0 ? 'negative' : tr('out of stock')}</span>
                </div>
              </div>
            );
          })}
          {data && data.matches > rows.length && (
            <div className="stk-more">Showing {rows.length} of {fmt(data.matches)} — type more of the name or code to narrow it.</div>
          )}
        </div>
      </div>
    </div>
  );
}
