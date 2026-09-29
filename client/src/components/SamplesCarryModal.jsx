import React, { useEffect, useMemo, useState } from 'react';
import { X, Package, Download, Share2, RefreshCw, Check, Store } from 'lucide-react';
import { api } from '../api';
import { useT } from '../i18n';
import { notify } from './Toast';

// Opened from the Visit calendar before the day starts: every "to be shown" sample for
// the dealers planned that day. A sample two dealers should see is packed once, so the
// first tab is one de-duplicated checklist; the second shows it dealer by dealer.
const fmtLong = ymd => new Date(ymd + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const tickKey = (date, sid) => `stp_carry_${date}_${sid || 'all'}`;
const loadTicks = (k) => { try { return new Set(JSON.parse(localStorage.getItem(k) || '[]')); } catch { return new Set(); } };
const saveTicks = (k, set) => { try { localStorage.setItem(k, JSON.stringify([...set])); } catch { /* private mode */ } };
// pieces to pack: one for each dealer it is GIVEN to; a folder only shown needs just one
const piecesOf = c => Math.max(1, (c.giveTo || []).length);
const csvCell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

export default function SamplesCarryModal({ date, salesmanId = '', onClose }) {
  const { t: tr } = useT();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('carry');
  const k = tickKey(date, salesmanId);
  const [ticks, setTicks] = useState(() => loadTicks(k));

  const load = () => { setErr(''); setData(null); api.visitPlanCarry(date, salesmanId).then(setData).catch(e => setErr(e?.message || 'Could not load the sample list')); };
  useEffect(() => { load(); setTicks(loadTicks(k)); }, [date, salesmanId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const h = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);

  const groups = data?.salesmen || [];
  const many = groups.length > 1;
  const totals = useMemo(() => ({
    carry: groups.reduce((a, g) => a + g.carry.length, 0),
    dealers: groups.reduce((a, g) => a + g.dealers.length, 0),
    asked: groups.reduce((a, g) => a + g.dealers.reduce((b, d) => b + d.samples.length, 0), 0),
  }), [groups]);
  const packed = groups.reduce((a, g) => a + g.carry.filter(c => ticks.has(g.salesmanId + '|' + c.name)).length, 0);

  const toggle = (id) => setTicks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); saveTicks(k, n); return n; });

  const title = `Samples to carry — ${fmtLong(date)}`;
  const asText = () => groups.map(g => [
    `${title}${many || !salesmanId ? ' — ' + g.salesmanName : ''}`,
    `${g.carry.length} samples for ${g.dealers.length} dealer${g.dealers.length === 1 ? '' : 's'}`,
    '',
    ...g.carry.map((c, i) => `${i + 1}. ${c.name}  x${piecesOf(c)}${(c.giveTo || []).length ? `  (give: ${c.giveTo.join(', ')})` : ''}`),
    '',
    'By dealer:',
    ...g.dealers.flatMap(d => [`• ${d.name}${d.city ? ' — ' + d.city : ''}`, ...(d.samples.length ? d.samples.map(s => `   - ${s}`) : ['   - nothing new to show'])]),
  ].join('\n')).join('\n\n');

  const download = async () => {
    const rows = [];
    for (const g of groups) {
      rows.push([title + ' — ' + g.salesmanName]);
      rows.push(['#', 'Sample to carry', 'Pieces', 'Give to', 'Show to']);
      g.carry.forEach((c, i) => rows.push([i + 1, c.name, piecesOf(c), (c.giveTo || []).join('; '), c.dealers.filter(n => !(c.giveTo || []).includes(n)).join('; ')]));
      rows.push([]);
      rows.push(['Dealer', 'City', 'Sample', 'Give or show']);
      g.dealers.forEach(d => (d.samples.length ? d.samples : ['(nothing new to show)']).forEach(s => rows.push([d.name, d.city, s, (d.give || []).includes(s) ? 'GIVE' : 'show'])));
      rows.push([]);
    }
    const csv = '﻿' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
    const who = groups.length === 1 ? '_' + groups[0].salesmanName.replace(/\s+/g, '-') : '';
    try {
      const { saveText } = await import('../lib/saveFile');
      await saveText(csv, `samples-to-carry_${date}${who}.csv`, 'text/csv;charset=utf-8');
    } catch (e) { notify.error('Could not save the list: ' + (e?.message || e)); }
  };

  const share = async () => {
    const text = asText();
    try {
      if (window.Capacitor?.isNativePlatform?.()) { const { Share } = await import('@capacitor/share'); await Share.share({ title, text, dialogTitle: 'Share the sample list' }); return; }
      if (navigator.share) { await navigator.share({ title, text }); return; }
      await navigator.clipboard.writeText(text); notify.success('List copied — paste it in WhatsApp or a note');
    } catch (e) { if (e?.name !== 'AbortError') notify.error('Could not share: ' + (e?.message || e)); }
  };

  return (
    <div className="overlay dom-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dom scm" role="dialog" aria-label={tr('Samples to carry')}>
        <div className="dom-head">
          <span className="dom-ico" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}><Package size={18} /></span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="dom-eyebrow">{tr('Samples to carry')}</div>
            <div className="dom-title">{fmtLong(date)}</div>
          </div>
          <button className="dom-x" onClick={load} title="Reload"><RefreshCw size={14} /></button>
          <button className="dom-x" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="dom-body">
          {err ? <div className="scm-empty" style={{ color: 'var(--red)' }}>{err}<button className="btn" style={{ marginTop: 8 }} onClick={load}>Try again</button></div>
          : !data ? <div className="scm-empty">Loading the samples for this day…</div>
          : !totals.dealers ? <div className="scm-empty">No dealers planned for this day.</div>
          : <>
            <div className="scm-sum">
              <div><b>{totals.carry}</b><span>{tr('to carry')}</span></div>
              <div><b>{totals.dealers}</b><span>{totals.dealers === 1 ? 'dealer' : 'dealers'}</span></div>
              <div><b>{totals.asked - totals.carry}</b><span>{tr('repeats skipped')}</span></div>
            </div>
            <div className="scm-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'carry'} className={tab === 'carry' ? 'on' : ''} onClick={() => setTab('carry')}><Package size={13} /> {tr('What to carry')}{totals.carry ? ` · ${packed}/${totals.carry}` : ''}</button>
              <button role="tab" aria-selected={tab === 'dealer'} className={tab === 'dealer' ? 'on' : ''} onClick={() => setTab('dealer')}><Store size={13} /> {tr('By dealer')}</button>
            </div>

            {groups.map(g => (
              <div key={g.salesmanId} className="scm-grp">
                {(many || !salesmanId) && <div className="scm-sm">{g.salesmanName} <span>· {g.carry.length} samples · {g.dealers.length} dealer{g.dealers.length === 1 ? '' : 's'}</span></div>}
                {tab === 'carry' ? (
                  g.carry.length ? <div className="scm-list">
                    {g.carry.map(c => { const id = g.salesmanId + '|' + c.name; const on = ticks.has(id); return (
                      <button key={id} className={'scm-row' + (on ? ' on' : '')} onClick={() => toggle(id)}>
                        <span className="scm-tick">{on && <Check size={13} strokeWidth={3} />}</span>
                        <span className="scm-main">
                          <b>{c.name}</b>
                          {(c.giveTo || []).length > 0 && <small className="scm-give">give to {c.giveTo.join(', ')}</small>}
                          {c.dealers.some(n => !(c.giveTo || []).includes(n)) && <small>show to {c.dealers.filter(n => !(c.giveTo || []).includes(n)).join(', ')}</small>}
                        </span>
                        <span className="scm-x" title={(c.giveTo || []).length > 1 ? 'one piece for each dealer it is given to' : 'one piece is enough'}>×{piecesOf(c)}</span>
                      </button>); })}
                  </div> : <div className="scm-empty">Nothing new to show these dealers.</div>
                ) : (
                  <div className="scm-list">
                    {g.dealers.map(d => (
                      <div key={d.dealerId} className="scm-dealer">
                        <div className="scm-dn">{d.name}{(d.city || d.zone) && <span> · {[d.zone, d.city].filter(Boolean).join(' · ')}</span>}</div>
                        {d.samples.length ? <div className="scm-chips">{d.samples.map(s => <span key={s} className={(d.give || []).includes(s) ? 'give' : ''}>{(d.give || []).includes(s) ? 'Give · ' : ''}{s}</span>)}</div>
                          : <div style={{ fontSize: 12, color: 'var(--t3)' }}>Nothing new to show this dealer.</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>}
        </div>

        {data && totals.dealers > 0 && (
          <div className="scm-foot">
            <button className="btn" onClick={share}><Share2 size={14} /> {tr('Share')}</button>
            <button className="btnp" onClick={download}><Download size={14} /> {tr('Download list')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
