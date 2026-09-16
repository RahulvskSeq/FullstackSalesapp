import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { X, Search, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, PhoneCall } from 'lucide-react';
import { col } from './api';

/* ── formatting ─────────────────────────────────────────────────────── */
export const money  = v => '₹' + Math.round(Number(v || 0)).toLocaleString('en-IN');
export const num    = v => Number(v || 0).toLocaleString('en-IN');
export const today  = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
export const monthNow = () => today().slice(0, 7);
export const fmtDate = s => { if (!s) return '—'; const d = typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s); return isNaN(d) ? String(s) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); };
export const fmtWhen = s => { if (!s) return '—'; const d = new Date(s); return isNaN(d) ? String(s) : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); };
export const periodLabel = p => { if (!p || !/^\d{4}-\d{2}$/.test(p)) return p || ''; return new Date(p + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }); };
export const title = s => String(s || '').replace(/_/g, ' ').toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());

/* ── colours by state ───────────────────────────────────────────────── */
export const TONE = {
  CRITICAL: 'var(--red)', URGENT: 'var(--red)', HIGH: '#f97316', MEDIUM: 'var(--yel)', LOW: 'var(--t3)',
  NEW: 'var(--acc)', INCREASED: '#f97316', DECREASED: 'var(--grn)', CLEARED: 'var(--grn)', UNCHANGED: 'var(--t3)', REOPENED: 'var(--pur)',
  OPEN: 'var(--acc)', IN_PROGRESS: 'var(--yel)', DONE: 'var(--grn)', CANCELLED: 'var(--t3)', EXPIRED: 'var(--red)',
  RECORDED: 'var(--yel)', CONFIRMED: 'var(--grn)', BOUNCED: 'var(--red)',
  PENDING: 'var(--yel)', PARTIALLY_FULFILLED: '#f97316', FULFILLED: 'var(--grn)', BROKEN: 'var(--red)',
  NIL: 'var(--t3)', DUE: 'var(--yel)', OVERDUE: 'var(--red)', HIGH_PRIORITY: '#f97316', PROMISED: 'var(--pur)', PARTIAL_PAYMENT: 'var(--yel)', FOLLOW_UP_REQUIRED: 'var(--acc)', CLOSED: 'var(--t3)',
  APPLIED: 'var(--grn)', FAILED: 'var(--red)', APPLYING: 'var(--yel)', DUPLICATE: 'var(--t3)', PREVIEWED: 'var(--acc)', VALIDATED: 'var(--acc)', STAGED: 'var(--t3)',
  QUEUED: 'var(--yel)', RUNNING: 'var(--yel)', SENT: 'var(--acc)', DELIVERED: 'var(--grn)', READ: 'var(--grn)', OPTED_OUT: 'var(--t3)',
};
/** Status for a balance: a plain due balance shows how urgent it is (from priority) instead of a bare "due". */
export function StatusBadge({ status, priority }) {
  if (!status || ['DUE', 'NEW', 'OPEN'].includes(status)) return <Badge v={priority || 'MEDIUM'} label={title(priority || 'MEDIUM') + ' · due'} />;
  if (status === 'NIL') return <Badge v="NIL" label="Nil" />;
  return <Badge v={status} />;
}
export function Badge({ v, label }) {
  const c = TONE[v] || 'var(--t2)';
  return <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', whiteSpace: 'nowrap', color: c, background: 'color-mix(in srgb, ' + c + ' 14%, transparent)', border: '1px solid color-mix(in srgb, ' + c + ' 35%, transparent)' }}>{label || title(v)}</span>;
}

/* ── data loading ───────────────────────────────────────────────────── */
export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let dead = false; setBusy(true); setErr('');
    Promise.resolve().then(fn).then(d => { if (!dead) setData(d); }).catch(e => { if (!dead) setErr(e.message || String(e)); }).finally(() => { if (!dead) setBusy(false); });
    return () => { dead = true; };
  }, [...deps, tick]);   // eslint-disable-line react-hooks/exhaustive-deps
  return { data, busy, err, reload: useCallback(() => setTick(t => t + 1), []), setData };
}

/* ── page furniture ─────────────────────────────────────────────────── */
export function PageHead({ eyebrow = 'Collections', title: t, sub, right, icon: Icon, tone = 'var(--acc)' }) {
  return (
    <div className="page-head" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
      <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'nowrap', minWidth: 0 }}>
        {Icon && <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', flexShrink: 0, color: tone, background: 'color-mix(in srgb, ' + tone + ' 14%, transparent)', border: '1px solid color-mix(in srgb, ' + tone + ' 30%, transparent)' }}><Icon size={22} /></div>}
        <div style={{ minWidth: 0 }}>
          <div className="page-eyebrow" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>{eyebrow}</div>
          <div className="page-title" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.15 }}>{t}</div>
          {sub && <div style={{ fontSize: 12.5, color: 'var(--t2)', marginTop: 3 }}>{sub}</div>}
        </div>
      </div>
      {right && <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>{right}</div>}
    </div>
  );
}
export function Card({ title: t, right, children, style, pad = true }) {
  return (
    <div className="card" style={{ ...(pad ? {} : { padding: 0 }), ...style }}>
      {(t || right) && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10, padding: pad ? 0 : '12px 14px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{t}</div>{right}
      </div>}
      {children}
    </div>
  );
}
export function Tile({ label, value, sub, tone, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', borderLeft: tone ? `3px solid ${tone}` : undefined }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 800, margin: '3px 0 1px', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, overflowWrap: 'anywhere' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--t2)' }}>{sub}</div>}
    </div>
  );
}
export function Empty({ children = 'Nothing here.' }) { return <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>{children}</div>; }
export function ErrorBox({ err, onRetry }) {
  if (!err) return null;
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, background: 'rgba(220,38,38,.1)', border: '1px solid rgba(220,38,38,.3)', color: 'var(--red)', fontSize: 12.5, margin: '8px 0' }}>
    <AlertTriangle size={14} /><span style={{ flex: 1 }}>{err}</span>{onRetry && <button className="btn" onClick={onRetry} style={{ fontSize: 11 }}><RefreshCw size={11} /> Retry</button>}</div>;
}
export function Busy() { return <div style={{ padding: 20, color: 'var(--t3)', fontSize: 12.5 }}><span className="spin" style={{ display: 'inline-block', marginRight: 6 }}><RefreshCw size={12} /></span>Loading…</div>; }

/** True below the app's phone breakpoint; re-evaluated on resize. */
export function useIsMobile(bp = 768) {
  const [m, setM] = useState(typeof window !== 'undefined' && window.innerWidth <= bp);
  useEffect(() => { const f = () => setM(window.innerWidth <= bp); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, [bp]);
  return m;
}

/* One table for every list. `cols` = [{ k, h, r?: row => node, w?, align? }].
 * On a phone, a list that supplies `card` (row => node) is drawn as cards
 * instead — a wide table squeezed into 375px is not readable. */
export const PENDING_BG = 'rgba(245,158,11,.13)';
export const isPending = r => (r?.pendingApproval > 0 || r?.pendingRecorded > 0);
const pendingTip = r => isPending(r) ? `${money((r.pendingApproval || 0) + (r.pendingRecorded || 0))} recorded · waiting for a statement to show it` : undefined;
export function Table({ cols, rows, keyOf = r => r._id, onRow, empty = 'Nothing to show.', dense, card }) {
  const mobile = useIsMobile();
  if (!rows?.length) return <Empty>{empty}</Empty>;
  if (mobile && card) return <div style={{ display: 'grid', gap: 8, padding: '4px 0' }}>{rows.map(r => <div key={keyOf(r)} onClick={onRow ? () => onRow(r) : undefined} data-tip={pendingTip(r)} style={{ padding: '10px 12px', borderRadius: 10, background: isPending(r) ? PENDING_BG : 'var(--bg2)', border: '1px solid ' + (isPending(r) ? 'rgba(245,158,11,.45)' : 'var(--b1)') }}>{card(r)}</div>)}</div>;
  return (
    <div className="scroll col-scroll">
      <table className="col-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: dense ? 12 : 12.5 }}>
        <thead><tr>{cols.map(c => <th key={c.k || c.h} style={{ textAlign: c.align || 'left', padding: dense ? '6px 8px' : '8px 10px', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)', borderBottom: '1px solid var(--b1)', whiteSpace: 'nowrap', width: c.w, ...(c.style || {}) }}>{c.h}</th>)}</tr></thead>
        <tbody>{rows.map(r => (
          <tr key={keyOf(r)} onClick={onRow ? () => onRow(r) : undefined} data-tip={pendingTip(r)} style={{ cursor: onRow ? 'pointer' : 'default', background: isPending(r) ? PENDING_BG : undefined, boxShadow: isPending(r) ? 'inset 3px 0 0 #f59e0b' : undefined }}
              onMouseEnter={e => { if (onRow && !isPending(r)) e.currentTarget.style.background = 'var(--bg2)'; }} onMouseLeave={e => { e.currentTarget.style.background = isPending(r) ? PENDING_BG : ''; }}>
            {cols.map(c => <td key={c.k || c.h} style={{ padding: dense ? '6px 8px' : '9px 10px', borderBottom: '1px solid var(--b1)', textAlign: c.align || 'left', fontVariantNumeric: 'tabular-nums', whiteSpace: c.wrap ? 'normal' : 'nowrap', maxWidth: c.max, overflow: 'hidden', textOverflow: 'ellipsis', ...(c.style || {}) }}>{c.r ? c.r(r) : r[c.k]}</td>)}
          </tr>))}</tbody>
      </table>
    </div>
  );
}
export function Pager({ page, limit, total, onPage }) {
  const pages = Math.max(1, Math.ceil((total || 0) / (limit || 50)));
  if (pages <= 1) return null;
  return <div className="row" style={{ justifyContent: 'flex-end', gap: 6, padding: '8px 0 0', fontSize: 12, color: 'var(--t2)' }}>
    <span>{num(total)} rows · page {page} of {pages}</span>
    <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={12} /></button>
    <button className="btn" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight size={12} /></button>
  </div>;
}
export function Modal({ title: t, onClose, children, width = 560 }) {
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: width }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{t}</div>
          <button className="btn" onClick={onClose} style={{ padding: '4px 7px' }}><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Field({ label, children, hint }) {
  return <div className="field"><label>{label}</label>{children}{hint && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{hint}</div>}</div>;
}
export function Tabs({ tabs, value, onChange }) {
  return <div className="tabs">{tabs.map(t => <button key={t.id} className={'tab' + (value === t.id ? ' active' : '')} onClick={() => onChange(t.id)}>{t.label}{t.count != null && <span className="chip" style={{ marginLeft: 6 }}>{t.count}</span>}</button>)}</div>;
}

/* ── dealer picker: server search, scope applied there ─────────────── */
export function DealerPicker({ value, onChange, placeholder = 'Search dealer by name or code…', initialQuery = '' }) {
  const [q, setQ] = useState(initialQuery);
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);
  const t = useRef();
  useEffect(() => {
    if (!q.trim() || q.trim().length < 2) { setHits([]); return; }
    clearTimeout(t.current);
    t.current = setTimeout(() => col.search(q.trim()).then(r => {
      const seen = new Set(); const out = [];
      for (const b of (r.dealers || [])) { const id = String(b.dealerId); if (!seen.has(id)) { seen.add(id); out.push({ id, name: b.dealerName, code: b.dealerCode, total: b.total }); } }
      for (const d of (r.dealerMaster || [])) { const id = String(d._id); if (!seen.has(id)) { seen.add(id); out.push({ id, name: d.name, code: d.code, total: null }); } }
      setHits(out.slice(0, 15));
    }).catch(() => setHits([])), 250);
    return () => clearTimeout(t.current);
  }, [q]);
  if (value) return (
    <div className="row" style={{ gap: 8, padding: '7px 10px', border: '1px solid var(--b2)', borderRadius: 7, background: 'var(--bg2)' }}>
      <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{value.name}{value.code ? <span className="chip" style={{ marginLeft: 6 }}>{value.code}</span> : null}</span>
      {value.total != null && <span style={{ fontSize: 12, color: 'var(--t2)' }}>{money(value.total)}</span>}
      <button className="btn" onClick={() => onChange(null)} style={{ padding: '2px 6px' }}><X size={12} /></button>
    </div>);
  return (
    <div style={{ position: 'relative' }}>
      <div className="row" style={{ gap: 6 }}><Search size={14} style={{ color: 'var(--t3)' }} /><input className="inp" value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} /></div>
      {(open || initialQuery) && hits.length > 0 && <div style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, top: '100%', marginTop: 4, background: 'var(--bg1)', border: '1px solid var(--b2)', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,.3)', maxHeight: 280, overflowY: 'auto' }}>
        {hits.map(h => <div key={h.id} onMouseDown={() => { onChange(h); setQ(''); setOpen(false); }} style={{ padding: '8px 10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, borderBottom: '1px solid var(--b1)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
          <span>{h.name} {h.code && <span className="chip">{h.code}</span>}</span>{h.total != null && <span style={{ color: 'var(--t2)' }}>{money(h.total)}</span>}
        </div>)}
      </div>}
    </div>);
}

/* ── the Dealer 360 drawer is reachable from any screen ────────────── */
export const DealerCtx = createContext({ open: () => {}, openRecord: () => {}, openPending: () => {}, openRow: () => {}, users: [], currentUser: null, isStaff: false, features: { has: () => false } });
export const useDealerCtx = () => useContext(DealerCtx);
export function DealerLink({ id, name, code }) {
  const { open } = useDealerCtx();
  return <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); open(String(id)); }} style={{ color: 'var(--t1)', fontWeight: 600, textDecoration: 'none', borderBottom: '1px dotted var(--t3)' }}>{name}{code ? <span className="chip" style={{ marginLeft: 5 }}>{code}</span> : null}</a>;
}
export const userName = (users, id) => (users || []).find(u => u.id === id)?.name || id || '—';

/** The WhatsApp mark itself — every WhatsApp button in the module uses this, not a generic chat bubble. */
export function WhatsAppIcon({ size = 14, style }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0, ...style }} aria-label="WhatsApp">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>;
}

/**
 * One tooltip for the whole module. Any element with data-tip="…" gets it on
 * hover. Rendered fixed at the top of the page (not inside the button), so a
 * scrolling table or a card edge can never clip it; flips below the button
 * when there is no room above.
 */
export function Tooltips() {
  const [tip, setTip] = useState(null);
  useEffect(() => {
    const over = e => {
      const el = e.target.closest?.('[data-tip]');
      if (!el || el.disabled) { setTip(null); return; }
      const r = el.getBoundingClientRect();
      const above = r.top > 44;
      setTip({ text: el.getAttribute('data-tip'), x: r.left + r.width / 2, y: above ? r.top - 8 : r.bottom + 8, above });
    };
    const out = e => { if (e.target.closest?.('[data-tip]')) setTip(null); };
    const clear = () => setTip(null);
    document.addEventListener('mouseover', over); document.addEventListener('mouseout', out);
    document.addEventListener('scroll', clear, true); document.addEventListener('click', clear, true);
    return () => { document.removeEventListener('mouseover', over); document.removeEventListener('mouseout', out); document.removeEventListener('scroll', clear, true); document.removeEventListener('click', clear, true); };
  }, []);
  if (!tip) return null;
  return (
    <div style={{ position: 'fixed', left: tip.x, top: tip.y, transform: tip.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)', zIndex: 9999, pointerEvents: 'none',
                  background: 'var(--t1)', color: 'var(--bg1)', padding: '6px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, lineHeight: 1.25, whiteSpace: 'nowrap', maxWidth: 320, boxShadow: '0 6px 18px rgba(0,0,0,.28)' }}>
      {tip.text}
      <div style={{ position: 'absolute', left: '50%', [tip.above ? 'top' : 'bottom']: '100%', transform: 'translateX(-50%)', border: '5px solid transparent', [tip.above ? 'borderTopColor' : 'borderBottomColor']: 'var(--t1)' }} />
    </div>);
}

/**
 * Call the dealer. On a phone this opens the dialer (tel:); on a desktop it
 * hands the number to FaceTime / Skype / whatever is registered. With no
 * number on record it asks for one, saves it, then dials. `onDialed` lets
 * the screen open the follow-up form so the call gets written down.
 */
export function CallButton({ dealer, onDialed, size = 12, style, label }) {
  const phone = String(dealer?.phone || '').replace(/\D/g, '');
  const dial = async e => {
    e.stopPropagation(); e.preventDefault();
    let n = phone;
    if (!n) {
      const typed = window.prompt(`No number on record for ${dealer?.name || 'this dealer'}. Enter the mobile to call:`); if (!typed) return;
      const d = typed.replace(/\D/g, ''); n = d.length === 10 ? '91' + d : d;
      if (!(n.length === 12)) { alert('Enter a 10-digit mobile'); return; }
      try { await col.setContact(dealer.id, { phone: n }); } catch (x) { alert(x.message); return; }
    }
    window.location.href = 'tel:+' + n;
    onDialed?.({ ...dealer, phone: n });
  };
  return <a href={phone ? 'tel:+' + phone : '#'} onClick={dial} className="btn" data-tip={phone ? 'Call +' + phone : 'Call — add the number first'} style={{ padding: '3px 8px', fontSize: 11.5, color: '#0ea5e9', display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none', ...style }}><PhoneCall size={size} />{label}</a>;
}

/* Small building blocks for phone cards. */
export const CardRow = ({ children, style }) => <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', ...style }}>{children}</div>;
export const KV = ({ k, v, big }) => <div style={{ minWidth: 0 }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>{k}</div><div style={{ fontSize: big ? 16 : 12.5, fontWeight: big ? 800 : 600, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>{v}</div></div>;

/** The last few month columns present in these rows (newest 4), as table columns — the same look as Outstanding. */
export const periodsOf = (rows, n = 4) => [...new Set((rows || []).flatMap(r => Object.keys(r.buckets || {})))].sort().slice(-n);
/** The oldest month on screen is the one being chased this month — it gets a light red wash so the eye lands on it. */
export const OLDEST_BG = 'rgba(220,38,38,.09)';
/** The month being chased is drawn as a red rounded pill — the same look as a "Broken" badge — so it cannot be missed. */
export const OldestPill = ({ children }) => <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontWeight: 700, color: 'var(--red)', background: 'rgba(220,38,38,.12)', border: '1px solid rgba(220,38,38,.35)', whiteSpace: 'nowrap' }}>{children}</span>;
export const monthCols = (rows, onPending) => { const ps = periodsOf(rows); return ps.map((p, i) => ({ k: p, h: i === 0 ? <span style={{ color: 'var(--red)' }}>{periodLabel(p)}</span> : periodLabel(p), align: 'right', r: r => <span>{r.buckets?.[p] ? (i === 0 ? <OldestPill>{money(r.buckets[p])}</OldestPill> : money(r.buckets[p])) : <span style={{ color: 'var(--t3)' }}>–</span>}</span> })); };
/** The same months for a phone card, with the total at the end. */
export const MonthKVs = ({ row, rows, total, onPending }) => { const ps = periodsOf(rows || [row]); return <div className="col-months" style={{ display: 'grid', gridTemplateColumns: `repeat(${ps.length + 1}, minmax(0,1fr))`, gap: 6, margin: '8px 0 4px' }}>{ps.map((p, i) => <KV key={p} k={i === 0 ? <span style={{ color: 'var(--red)' }}>{periodLabel(p)}</span> : periodLabel(p)} v={<span>{row.buckets?.[p] ? (i === 0 ? <OldestPill>{money(row.buckets[p])}</OldestPill> : money(row.buckets[p])) : '–'}</span>} />)}<KV k="Total" v={money(total ?? row.total)} big /></div>; };

/** A follow-up date you can click: shows the date (or "set date") and opens the follow-up form on that dealer with the date field focused. */
export function FollowupDate({ value, onOpen, prefix = '' }) {
  return <a href="#" data-tip={value ? 'Change the follow-up date' : 'Set a follow-up date'} onClick={e => { e.preventDefault(); e.stopPropagation(); onOpen(); }}
    style={{ color: value ? 'var(--t1)' : 'var(--acc)', textDecoration: 'none', borderBottom: '1px dotted var(--t3)', whiteSpace: 'nowrap' }}>{value ? prefix + fmtDate(value) : 'set date'}</a>;
}

/** Money the statement shows as received but accounts has not approved yet — amber until they do. */
export function PendingChip({ amount, recorded, onClick }) {
  const chip = (text, tip) => <span onClick={onClick ? e => { e.stopPropagation(); onClick(); } : undefined} data-tip={tip} style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', color: '#b45309', background: 'rgba(245,158,11,.16)', border: '1px solid rgba(245,158,11,.45)', cursor: onClick ? 'pointer' : 'default', marginTop: 2 }}>{text}</span>;
  return <>
    {amount > 0 && chip(`${money(amount)} pending approval`, 'The statement shows this came in — waiting for accounts to approve')}
    {recorded > 0 && chip(`${money(recorded)} pending approval`, 'A salesman recorded this payment — waiting for accounts to confirm')}
  </>;
}
