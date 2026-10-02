import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Download, Save, Loader2, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { api } from '../api';
import { notify } from './Toast';

// Sheets → Dealers target: one row per dealer for a month — the last 6 months' sales,
// 6- and 3-month averages, the suggested target (3-month average + 10%), and the
// status and target to set for the month. Saved as a plan (DealerTarget); nothing is
// written onto the dealer. A dealer with no sales in the last 3 months takes a target
// only once its status is REACTIVE.
const fmt = n => Number(n || 0).toLocaleString('en-IN');
const nowYM = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 7);
const TIERS = ['STAR', 'KEY ACCOUNT', 'ACHIEVER', 'REACTIVE'];
const TONE = { STAR: '#f59e0b', 'KEY ACCOUNT': '#8b5cf6', ACHIEVER: '#10b981', REACTIVE: '#0ea5e9', NONE: 'var(--t3)' };
// performance tier (worked out from sales)
const PERF_TONE = { 'TOP PERFORMER': '#16a34a', 'PRIORITY ACCOUNT': '#2563eb', 'RISING STAR': '#f59e0b', ACTIVE: '#0891b2', 'RECENTLY INACTIVE': '#ea580c', INACTIVE: '#dc2626', DEAD: '#64748b' };
const PAGE = 200;

export default function DealerTargetsTab({ currentUser, users = {} }) {
  const isStaff = ['admin', 'superadmin', 'employee'].includes(currentUser?.role);
  const [month, setMonth] = useState(nowYM());
  const [sm, setSm] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [edits, setEdits] = useState({});          // dealerId → { status?, target? }
  const [q, setQ] = useState('');
  const [tier, setTier] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [saving, setSaving] = useState('');
  const [making, setMaking] = useState(false);
  const grid = useRef(null);

  const load = () => {
    setErr(''); setData(null);
    api.dealerTargets(month, isStaff ? sm : '').then(setData).catch(e => setErr(e?.message || 'Could not load'));
  };
  useEffect(() => { setEdits({}); setLimit(PAGE); load(); }, [month, sm]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = Object.keys(edits).length;
  useEffect(() => {
    if (!dirty) return;
    const h = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const canEdit = !!data?.canEdit;
  const val = r => {
    const e = edits[r.dealerId] || {};
    const status = e.status ?? r.saved?.status ?? r.statusNow;
    const target = e.target ?? (r.saved ? r.saved.target : (r.noSales ? 0 : r.auto));
    return { status, target, locked: r.noSales && status !== 'REACTIVE' };
  };
  const setEdit = (r, patch) => setEdits(m => {
    const cur = { ...(m[r.dealerId] || {}), ...patch };
    // a no-sales dealer moved off REACTIVE loses its target again
    const st = cur.status ?? r.saved?.status ?? r.statusNow;
    if (r.noSales && st !== 'REACTIVE') cur.target = 0;
    const base = { status: r.saved?.status ?? r.statusNow, target: r.saved ? r.saved.target : (r.noSales ? 0 : r.auto) };
    if ((cur.status ?? base.status) === base.status && (cur.target ?? base.target) === base.target) { const n = { ...m }; delete n[r.dealerId]; return n; }
    return { ...m, [r.dealerId]: cur };
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    return data.rows.filter(r => {
      if (s && !(r.name.toLowerCase().includes(s) || r.city.toLowerCase().includes(s) || r.zone.toLowerCase().includes(s))) return false;
      if (!tier) return true;
      const st = (edits[r.dealerId]?.status) ?? r.saved?.status ?? r.statusNow;
      if (tier === 'OTHER') return !TIERS.includes(st);
      if (tier === 'NOSALES') return r.noSales;
      return st === tier;
    });
  }, [data, q, tier, edits]);
  const shown = rows.slice(0, limit);
  const totals = useMemo(() => rows.reduce((a, r) => { const v = val(r); a.auto += r.noSales ? 0 : r.auto; a.target += Number(v.target) || 0; a.avg3 += r.avg3; return a; }, { auto: 0, target: 0, avg3: 0 }), [rows, edits]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (which) => {
    const list = which === 'all' ? rows : (data?.rows || []).filter(r => edits[r.dealerId]);
    const items = list.map(r => { const v = val(r); return { dealerId: r.dealerId, status: v.status, target: Number(v.target) || 0 }; });
    if (!items.length) return;
    setSaving(which);
    try {
      const r = await api.dealerTargetsSave(month, items);
      notify.success(`Saved ${fmt(r.saved)} dealer${r.saved === 1 ? '' : 's'}`);
      setEdits({}); load();
    } catch (e) { notify.error(e?.message || 'Could not save'); }
    setSaving('');
  };
  const excel = async () => {
    setMaking(true);
    try {
      const blob = await api.dealerTargetsXlsx(month, isStaff ? sm : '');
      const { saveBlob } = await import('../lib/saveFile');
      await saveBlob(blob, `dealers-target-${data?.monthLabel || month}${sm ? '-' + sm : ''}.xlsx`);
    } catch (e) { notify.error('Excel: ' + (e?.message || e)); }
    setMaking(false);
  };
  // Enter / ↓ moves to the next row's target, like a sheet
  const onTargetKey = (e, i) => {
    if (e.key !== 'Enter' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const inputs = [...(grid.current?.querySelectorAll('input.dt-tg:not(:disabled)') || [])];
    const at = inputs.indexOf(e.target);
    const next = inputs[at + (e.key === 'ArrowUp' ? -1 : 1)];
    if (next) { next.focus(); next.select(); }
  };
  const salesmen = useMemo(() => Object.values(users || {}).filter(u => u.role === 'salesman' && u.active !== false).sort((a, b) => (a.name || '').localeCompare(b.name || '')), [users]);

  return (
    <div className="dt">
      <div className="dt-bar">
        <div className="dt-title"><b>Dealers target</b><span>{data?.monthLabel || ''} · auto = last 3 months' average + 10%</span></div>
        <input type="month" className="inp dt-month" value={month} onChange={e => e.target.value && setMonth(e.target.value)} />
        {isStaff && <select className="inp dt-sm" value={sm} onChange={e => setSm(e.target.value)}>
          <option value="">All salesmen</option>
          {salesmen.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>}
        <div className="dt-search"><Search size={13} /><input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE); }} placeholder="dealer, city or zone…" />{q && <X size={13} onClick={() => setQ('')} />}</div>
        <span style={{ flex: 1 }} />
        <button className="btn dt-b" onClick={excel} disabled={!data || making}>{making ? <Loader2 size={13} className="spin" /> : <Download size={13} />} Excel</button>
        {canEdit && <button className="btn dt-b" onClick={() => save('all')} disabled={!rows.length || !!saving} title="Save the status and target of every dealer shown">{saving === 'all' ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />} Save all shown</button>}
        {canEdit && <button className="btnp dt-b" onClick={() => save('edits')} disabled={!dirty || !!saving}>{saving === 'edits' ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Save{dirty ? ` (${dirty})` : ''}</button>}
      </div>
      <div className="dt-chips">
        {[['', 'All'], ['STAR', 'STAR'], ['KEY ACCOUNT', 'KEY ACCOUNT'], ['ACHIEVER', 'ACHIEVER'], ['REACTIVE', 'REACTIVE'], ['OTHER', 'Others'], ['NOSALES', 'No sales 3 months']].map(([k, l]) =>
          <button key={k || 'all'} className={tier === k ? 'on' : ''} onClick={() => { setTier(k); setLimit(PAGE); }}>{l}</button>)}
        {data && <span className="dt-sum">{fmt(rows.length)} dealers · 3M avg <b>{fmt(totals.avg3)}</b> · auto <b>{fmt(totals.auto)}</b> · {data.monthLabel} target <b>{fmt(totals.target)}</b></span>}
      </div>
      {data && !canEdit && <div className="dt-note"><Lock size={13} /> View only — the admin can allow you to edit (Settings → Permissions → <b>Edit dealer targets</b>).</div>}
      {err && <div className="dt-note bad"><AlertTriangle size={13} /> {err} <button className="btn" onClick={load} style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}>Try again</button></div>}

      <div className="dt-grid" ref={grid}>
        {!data && !err && <div className="dt-load"><Loader2 size={16} className="spin" /> Loading dealers…</div>}
        {data && (
          <table>
            <thead><tr>
              <th className="dt-n">#</th>
              <th className="dt-d">Dealer</th>
              <th>Performance</th>
              <th className="dt-ed">Status {data.monthLabel}</th>
              <th className="num dt-auto">Auto 3M +10%</th>
              <th className="dt-ed num">Target {data.monthLabel}</th>
              {data.salesMonths.map(l => <th key={l} className="num">{l}</th>)}
              <th className="num">6M avg</th>
              <th className="num">3M avg</th>
            </tr></thead>
            <tbody>
              {shown.map((r, i) => {
                const v = val(r), e = edits[r.dealerId];
                return (
                  <tr key={r.dealerId} className={(e ? 'ch' : '') + (r.noSales ? ' ns' : '')}>
                    <td className="dt-n">{i + 1}</td>
                    <td className="dt-d"><b title={r.name}>{r.name}</b><small>{[r.city, r.zone].filter(Boolean).join(' · ')}{isStaff && !sm && r.salesmanName ? ' · ' + r.salesmanName : ''}</small></td>
                    <td>{r.perfStatus ? <span className="dt-st" style={{ '--tone': PERF_TONE[r.perfStatus] || 'var(--t3)' }}>{r.perfStatus}</span> : <span className="z">—</span>}</td>
                    <td className={'dt-ed' + (e?.status !== undefined ? ' chc' : '')}>
                      <select value={v.status} disabled={!canEdit} onChange={ev => setEdit(r, { status: ev.target.value })} style={{ '--tone': TONE[v.status] || 'var(--t2)' }}>
                        {(data.statuses || []).map(s => <option key={s} value={s}>{s === 'NONE' ? '— none' : s}</option>)}
                      </select>
                      {v.status !== r.statusNow && <small className="dt-was">was {r.statusNow === 'NONE' ? '—' : r.statusNow}</small>}
                    </td>
                    <td className="num dt-auto">{r.noSales ? <span className="z">—</span> : fmt(r.auto)}</td>
                    <td className={'dt-ed num' + (e?.target !== undefined ? ' chc' : '')}>
                      {v.locked
                        ? <span className="dt-lock" title="No sales in the last 3 months — set the status to REACTIVE first">set REACTIVE</span>
                        : <input className="dt-tg" type="text" inputMode="numeric" value={v.target} disabled={!canEdit}
                            onChange={ev => { const n = ev.target.value.replace(/[^\d]/g, ''); setEdit(r, { target: n === '' ? 0 : Number(n) }); }}
                            onFocus={ev => ev.target.select()} onKeyDown={ev => onTargetKey(ev, i)} />}
                      {r.saved && !e && <i className="dt-saved" title={`Saved by ${r.saved.by}${r.saved.at ? ' · ' + new Date(r.saved.at).toLocaleString('en-IN') : ''}`}>✓</i>}
                    </td>
                    {r.sales.map((s, k) => <td key={k} className={'num' + (s ? '' : ' z')}>{s ? fmt(s) : '0'}</td>)}
                    <td className="num">{fmt(r.avg6)}</td>
                    <td className="num"><b>{fmt(r.avg3)}</b></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {data && !rows.length && <div className="dt-load">No dealer matches.</div>}
        {data && rows.length > limit && <button className="btn dt-more" onClick={() => setLimit(l => l + PAGE)}>Show {fmt(Math.min(PAGE, rows.length - limit))} more of {fmt(rows.length - limit)}</button>}
      </div>
    </div>
  );
}
