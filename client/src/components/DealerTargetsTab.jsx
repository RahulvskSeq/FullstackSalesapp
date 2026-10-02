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
  const valWith = (r, e = {}) => {
    const status = e.status ?? r.saved?.status ?? r.statusNow;
    const target = e.target ?? (r.saved ? r.saved.target : (r.noSales ? 0 : r.auto));
    return { status, target, locked: r.noSales && status !== 'REACTIVE' };
  };
  const val = r => valWith(r, edits[r.dealerId]);

  // Autosave: a second after the last change, the changed rows are saved — nothing is
  // lost if he leaves without tapping Save. Only the rows saved come off the edit list,
  // so a change typed while a save is on its way waits for the next one.
  const [auto, setAuto] = useState('');            // '' | 'saving' | 'saved' | 'error'
  const live = useRef({});
  live.current = { edits, data, month, canEdit: !!data?.canEdit, me: currentUser?.name || currentUser?.id || 'you' };
  const flush = async () => {
    const { edits: snap, data: d, month: m, canEdit: ok, me } = live.current;
    const ids = Object.keys(snap);
    if (!ok || !d || !ids.length) return;
    const byId = new Map(d.rows.map(r => [r.dealerId, r]));
    const items = ids.filter(id => byId.has(id)).map(id => { const v = valWith(byId.get(id), snap[id]); return { dealerId: id, status: v.status, target: Number(v.target) || 0 }; });
    setAuto('saving');
    try {
      await api.dealerTargetsSave(m, items);
      const done = new Map(items.map(i => [i.dealerId, i]));
      if (live.current.month === m) {
        setData(x => x && x.month === m ? { ...x, rows: x.rows.map(r => done.has(r.dealerId) ? { ...r, saved: { status: done.get(r.dealerId).status, target: done.get(r.dealerId).target, by: me, at: new Date().toISOString() } } : r) } : x);
        setEdits(cur => { const n = { ...cur }; for (const id of ids) if (n[id] === snap[id]) delete n[id]; return n; });
      }
      setAuto('saved');
    } catch (e) { setAuto('error'); notify.error('Not saved: ' + (e?.message || 'server error')); }
  };
  useEffect(() => {
    if (!dirty || !data?.canEdit) return;
    const t = setTimeout(flush, 1200);
    return () => clearTimeout(t);
  }, [edits]); // eslint-disable-line react-hooks/exhaustive-deps
  // leaving the screen with a change still waiting: save it on the way out
  useEffect(() => () => { flush(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
        <div className="dt-title"><b>Dealers target</b><span>{data?.monthLabel || ''} · laminate sales · auto = last 3 months' average + 10%</span></div>
        <input type="month" className="inp dt-month" value={month} onChange={e => { if (!e.target.value) return; flush(); setMonth(e.target.value); }} />
        {isStaff && <select className="inp dt-sm" value={sm} onChange={e => { flush(); setSm(e.target.value); }}>
          <option value="">All salesmen</option>
          {salesmen.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>}
        <div className="dt-act">
          <div className="dt-search"><Search size={13} /><input value={q} onChange={e => { setQ(e.target.value); setLimit(PAGE); }} placeholder="dealer, city or zone…" />{q && <X size={13} onClick={() => setQ('')} />}</div>
          <span className="dt-gap" />
          <button className="btn dt-b" onClick={excel} disabled={!data || making} title="Download Excel">{making ? <Loader2 size={13} className="spin" /> : <Download size={13} />}<span className="dt-bl">Excel</span></button>
          {canEdit && <button className="btn dt-b" onClick={() => save('all')} disabled={!rows.length || !!saving} title="Save the status and target of every dealer shown">{saving === 'all' ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}<span className="dt-bl">Save all shown</span></button>}
          {canEdit && <button className={(dirty || auto === 'error' ? 'btnp' : 'btn') + ' dt-b dt-auto-b'} onClick={flush} disabled={!dirty || auto === 'saving'} title="Changes save by themselves a second after you type; tap to save now">
            {auto === 'saving' ? <><Loader2 size={13} className="spin" /> Saving…</> : dirty ? <><Save size={13} /> Save ({dirty})</> : auto === 'error' ? <><Save size={13} /> Retry</> : <><CheckCircle2 size={13} /><span className="dt-bl">{auto === 'saved' ? 'Saved' : 'Auto-save on'}</span></>}
          </button>}
        </div>
      </div>
      <div className="dt-chips">
        {[['', 'All'], ['STAR', 'STAR'], ['KEY ACCOUNT', 'KEY ACCOUNT'], ['ACHIEVER', 'ACHIEVER'], ['REACTIVE', 'REACTIVE'], ['OTHER', 'Others'], ['NOSALES', 'No laminate 3 months']].map(([k, l]) =>
          <button key={k || 'all'} className={tier === k ? 'on' : ''} onClick={() => { setTier(k); setLimit(PAGE); }}>{l}</button>)}
      </div>
      {data && <div className="dt-sum">{fmt(rows.length)} dealers · 3M avg <b>{fmt(totals.avg3)}</b> · auto <b>{fmt(totals.auto)}</b> · {data.monthLabel} target <b>{fmt(totals.target)}</b></div>}
      {data && !canEdit && <div className="dt-note"><Lock size={13} /> View only — the admin can allow you to edit (Settings → Permissions → <b>Edit dealer targets</b>).</div>}
      {err && <div className="dt-note bad"><AlertTriangle size={13} /> {err} <button className="btn" onClick={load} style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11 }}>Try again</button></div>}

      <div className="dt-grid" ref={grid}>
        {!data && !err && <div className="dt-load"><Loader2 size={16} className="spin" /> Loading dealers…</div>}
        {data && (
          <table>
            <thead><tr>
              <th className="dt-n">#</th>
              <th className="dt-d">Dealer</th>
              <th className="dt-ed num">Target {data.monthLabel}</th>
              <th className="num dt-auto" title="Laminate: last 3 months' average + 10%">Auto 3M +10%</th>
              <th className="dt-ed">Status {data.monthLabel}</th>
              <th className="dt-pf">Performance</th>
              <th className="num dt-3m" title="Laminate, last 3 months' average">3M avg</th>
              {[...data.salesMonths].reverse().map(l => <th key={l} className="num" title="Laminate sales">{l}</th>)}
              <th className="num">6M avg</th>
            </tr></thead>
            <tbody>
              {shown.map((r, i) => {
                const v = val(r), e = edits[r.dealerId];
                return (
                  <tr key={r.dealerId} className={(e ? 'ch' : '') + (r.noSales ? ' ns' : '')}>
                    <td className="dt-n">{i + 1}</td>
                    <td className="dt-d"><b title={r.name}>{r.name}</b><small>{[r.city, r.zone].filter(Boolean).join(' · ')}{isStaff && !sm && r.salesmanName ? ' · ' + r.salesmanName : ''}</small></td>
                    <td className={'dt-ed num' + (e?.target !== undefined ? ' chc' : '')}>
                      {v.locked
                        ? <span className="dt-lock" title="No laminate sales in the last 3 months — set the status to REACTIVE first">set REACTIVE</span>
                        : <input className="dt-tg" type="text" inputMode="numeric" value={v.target} disabled={!canEdit}
                            onChange={ev => { const n = ev.target.value.replace(/[^\d]/g, ''); setEdit(r, { target: n === '' ? 0 : Number(n) }); }}
                            onFocus={ev => ev.target.select()} onKeyDown={ev => onTargetKey(ev, i)} />}
                      {r.saved && !e && <i className="dt-saved" title={`Saved by ${r.saved.by}${r.saved.at ? ' · ' + new Date(r.saved.at).toLocaleString('en-IN') : ''}`}>✓</i>}
                    </td>
                    <td className="num dt-auto">{r.noSales ? <span className="z">—</span> : fmt(r.auto)}</td>
                    <td className={'dt-ed' + (e?.status !== undefined ? ' chc' : '')}>
                      <select value={v.status} disabled={!canEdit} onChange={ev => setEdit(r, { status: ev.target.value })} style={{ '--tone': TONE[v.status] || 'var(--t2)' }}>
                        {(data.statuses || []).map(s => <option key={s} value={s}>{s === 'NONE' ? '— none' : s}</option>)}
                      </select>
                      {v.status !== r.statusNow && <small className="dt-was">was {r.statusNow === 'NONE' ? '—' : r.statusNow}</small>}
                    </td>
                    <td className="dt-pf">{r.perfStatus ? <span className="dt-st" style={{ '--tone': PERF_TONE[r.perfStatus] || 'var(--t3)' }}>{r.perfStatus}</span> : <span className="z">—</span>}</td>
                    <td className="num dt-3m"><b>{fmt(r.avg3)}</b></td>
                    {[...r.sales].reverse().map((s, k) => <td key={k} className={'num' + (s ? '' : ' z')} title={s == null ? 'No category data for this month' : undefined}>{s == null ? '—' : s ? fmt(s) : '0'}</td>)}
                    <td className="num">{fmt(r.avg6)}</td>
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
