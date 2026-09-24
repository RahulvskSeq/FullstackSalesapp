import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, RefreshCw, Tag, Undo2, CheckCircle2 } from 'lucide-react';
import { api } from '../api';

/**
 * Sample allocation — stock in, dealers tagged.
 *
 * Two uploads:
 *   Stock sheet        Sample | Zone | Stock         → master + pieces in hand, then the
 *                                                      STAR / KEY ACCOUNT / ACHIEVER dealers
 *                                                      of that zone are allotted first
 *   Dealer-wise sheet  Dealer | Sample               → allocations typed by the office
 * Whatever is left is tagged by hand here. The salesman hands it over on the
 * visit (Dealer visit → MOM), which turns it into a "given" record.
 */
const num = v => Number(v || 0).toLocaleString('en-IN');

export default function SampleAllocationPanel() {
  const [data, setData] = useState({ items: [], summary: [] });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [tagFor, setTagFor] = useState(null);       // sample summary row being tagged
  const [dealers, setDealers] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('REQUESTED');
  const [dq, setDq] = useState('');            // dealer-wise lookup
  const [dHits, setDHits] = useState([]);
  const [dGiven, setDGiven] = useState(null);  // { dealer, items }
  const lookupDealer = async (d) => { setDGiven({ dealer: d, items: null }); try { const items = await api.getSamplesGiven('dealerName=' + encodeURIComponent(d.name)); setDGiven({ dealer: d, items }); } catch (e) { setDGiven({ dealer: d, items: [], err: e.message }); } };
  useEffect(() => { const s = dq.trim().toLowerCase(); if (s.length < 2) { setDHits([]); return; } if (!dealers.length) { api.getDealers().then(d => setDealers((d.dealers || d || []).map(x => ({ id: x._id || x.id, name: x.name, zone: x.zone, status: x.status, salesman: x.salesman })))).catch(() => {}); } setDHits(dealers.filter(d => d.name.toLowerCase().includes(s)).slice(0, 8)); }, [dq, dealers]);
  const stockRef = useRef(), allocRef = useRef();

  const load = async () => { try { setData(await api.sampleAllocations({ status: status || undefined })); } catch (e) { setMsg('Could not load: ' + e.message); } };
  useEffect(() => { load(); }, [status]);

  const up = async (file, fn, label) => {
    if (!file) return; setBusy(true); setMsg('');
    try {
      const r = await fn(file);
      if (label === 'stock') setMsg(`✓ Stock: ${r.added} added, ${r.updated} updated, ${r.skipped} skipped · ${r.allocated} pieces allotted to STAR / KEY ACCOUNT / ACHIEVER dealers · ${r.samples.reduce((a, s) => a + s.left, 0)} left to tag by hand`);
      else setMsg(`✓ Dealer-wise: ${r.added} allotted, ${r.already} already had it${r.noDealer.length ? ` · dealers not found: ${[...new Set(r.noDealer)].slice(0, 5).join(', ')}` : ''}${r.noSample.length ? ` · samples not in master: ${[...new Set(r.noSample)].slice(0, 5).join(', ')}` : ''}${r.noStock.length ? ` · no stock left for ${r.noStock.length}` : ''}`);
      await load();
    } catch (e) { setMsg('Upload failed: ' + e.message); }
    setBusy(false);
  };

  const openTag = async (row) => {
    setTagFor(row); setQ('');
    if (!dealers.length) { try { const d = await api.getDealers(); setDealers((d.dealers || d || []).map(x => ({ id: x._id || x.id, name: x.name, zone: x.zone, status: x.status, salesman: x.salesman }))); } catch {} }
  };
  const zoneNums = z => [...String(z || '').matchAll(/\d+/g)].map(m => m[0]);
  const hits = useMemo(() => {
    if (!tagFor) return [];
    const s = q.trim().toLowerCase(); const zs = zoneNums(tagFor.zone);
    return dealers.filter(d => (!zs.length || zs.includes(zoneNums(d.zone)[0])) && (!s || d.name.toLowerCase().includes(s))).slice(0, 15);
  }, [q, dealers, tagFor]);

  const act = async (fn, ok) => { setBusy(true); setMsg(''); try { await fn(); setMsg(ok); await load(); } catch (e) { setMsg(e.message); } setBusy(false); };

  const totals = data.summary.reduce((a, s) => ({ stock: a.stock + s.stock, allocated: a.allocated + s.allocated, given: a.given + s.given, left: a.left + s.left }), { stock: 0, allocated: 0, given: 0, left: 0 });
  const btn = { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px' };

  return (
    <div style={{ marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid var(--b1)' }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Sample allocation</div>
      <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12, lineHeight: 1.6 }}>
        Upload the zone sheet as <strong>Sample Name | Stock | Zones</strong> ("Zone 2, 5, 6" becomes one row per zone; "Dispose" retires the sample). Pieces go first to the <strong>STAR, KEY ACCOUNT and ACHIEVER</strong> dealers of that zone, one each, best first, skipping dealers who already hold it. What is left you tag here, or a salesman requests it and you approve.
        A <strong>dealer-wise</strong> sheet (<strong>Dealer | Sample</strong>) allots exactly what it says. The salesman hands the piece over from the dealer visit MOM.
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <input ref={stockRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { up(e.target.files[0], api.uploadSampleStock, 'stock'); e.target.value = ''; }} />
        <button onClick={() => stockRef.current?.click()} disabled={busy} className="btnp" style={btn}><Upload size={14} /> Upload zone sheet (Sample Name | Stock | Zones)</button>
        <input ref={allocRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { up(e.target.files[0], api.uploadSampleAlloc, 'alloc'); e.target.value = ''; }} />
        <button onClick={() => allocRef.current?.click()} disabled={busy} className="btn" style={btn}><Upload size={14} /> Upload dealer-wise (Dealer | Sample)</button>
        <button onClick={load} disabled={busy} className="btn" style={btn}><RefreshCw size={14} /> Refresh</button>
        {msg && <span style={{ fontSize: 12, color: msg.startsWith('✓') ? 'var(--grn)' : 'var(--red)' }}>{msg}</span>}
      </div>

      {/* stock summary */}
      <div style={{ overflowX: 'auto', marginBottom: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead><tr style={{ fontSize: 10.5, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Sample</th><th style={{ textAlign: 'left', padding: '6px 8px' }}>Zone</th>
            <th style={{ textAlign: 'right', padding: '6px 8px' }}>Stock</th><th style={{ textAlign: 'right', padding: '6px 8px' }}>Allotted</th><th style={{ textAlign: 'right', padding: '6px 8px' }}>Given</th><th style={{ textAlign: 'right', padding: '6px 8px' }}>Left</th><th></th>
          </tr></thead>
          <tbody>
            {data.summary.filter(s => s.stock || s.allocated || s.given).map(s => (
              <tr key={s.id} style={{ borderTop: '1px solid var(--b1)' }}>
                <td style={{ padding: '6px 8px', fontWeight: 600 }}>{s.name}</td><td style={{ padding: '6px 8px', color: 'var(--t3)' }}>{s.zone}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(s.stock)}</td><td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(s.allocated)}</td><td style={{ padding: '6px 8px', textAlign: 'right', color: 'var(--grn)' }}>{num(s.given)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: s.left > 0 ? '#b45309' : 'var(--t3)' }}>{num(s.left)}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{s.left > 0 && <button className="btn" disabled={busy} onClick={() => openTag(s)} style={{ fontSize: 11, padding: '3px 8px', display: 'inline-flex', gap: 4, alignItems: 'center' }}><Tag size={11} /> Tag a dealer</button>}</td>
              </tr>
            ))}
            {!data.summary.some(s => s.stock || s.allocated || s.given) && <tr><td colSpan={7} style={{ padding: 14, textAlign: 'center', color: 'var(--t3)' }}>No stock uploaded yet.</td></tr>}
          </tbody>
          {totals.stock > 0 && <tfoot><tr style={{ borderTop: '2px solid var(--b2)', fontWeight: 700 }}><td style={{ padding: '6px 8px' }}>Total</td><td></td><td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(totals.stock)}</td><td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(totals.allocated)}</td><td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(totals.given)}</td><td style={{ padding: '6px 8px', textAlign: 'right' }}>{num(totals.left)}</td><td></td></tr></tfoot>}
        </table>
      </div>

      {/* manual tag picker */}
      {tagFor && (
        <div style={{ border: '1px solid var(--b1)', borderRadius: 10, padding: 12, marginBottom: 12, background: 'var(--bg2)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <b style={{ fontSize: 13 }}>Tag "{tagFor.name}" ({tagFor.zone}) · {num(tagFor.left)} left</b>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="search a dealer in this zone…" style={{ flex: 1, fontSize: 13, padding: '6px 9px', borderRadius: 8, border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
            <button className="btn" onClick={() => setTagFor(null)} style={{ fontSize: 12 }}>Done</button>
          </div>
          <div style={{ display: 'grid', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
            {hits.map(d => (
              <div key={d.id} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, padding: '4px 6px', borderRadius: 6, background: 'var(--bg1)' }}>
                <span style={{ flex: 1 }}>{d.name} <span style={{ color: 'var(--t3)', fontSize: 11 }}>· {d.zone || 'no zone'} · {d.status}</span></span>
                <button className="btnp" disabled={busy} style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => act(async () => { await api.allocSample({ sampleId: tagFor.id, dealerId: d.id }); setTagFor(t => t ? { ...t, left: t.left - 1 } : t); }, `✓ ${tagFor.name} tagged to ${d.name}`)}>Tag</button>
              </div>
            ))}
            {!hits.length && <div style={{ fontSize: 12, color: 'var(--t3)' }}>{dealers.length ? 'No dealer matches.' : 'Loading dealers…'}</div>}
          </div>
        </div>
      )}

      {/* dealer-wise: what a dealer already holds */}
      <div style={{ border: '1px solid var(--b1)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <b style={{ fontSize: 12.5 }}>Dealer-wise</b>
          <input value={dq} onChange={e => setDq(e.target.value)} placeholder="type a dealer to see the samples they hold…" style={{ flex: 1, minWidth: 220, fontSize: 13, padding: '6px 9px', borderRadius: 8, border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }} />
        </div>
        {dHits.length > 0 && !dGiven && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>{dHits.map(d => <button key={d.id} className="btn" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => lookupDealer(d)}>{d.name} <span style={{ color: 'var(--t3)' }}>· {d.zone || '—'}</span></button>)}</div>}
        {dGiven && <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}><b style={{ fontSize: 12.5 }}>{dGiven.dealer.name}</b><span style={{ fontSize: 11, color: 'var(--t3)' }}>{dGiven.dealer.zone || 'no zone'} · {dGiven.dealer.status}</span><button className="btn" style={{ fontSize: 11, padding: '2px 8px', marginLeft: 'auto' }} onClick={() => { setDGiven(null); setDq(''); }}>Clear</button></div>
          {dGiven.items === null ? <div style={{ fontSize: 12, color: 'var(--t3)' }}>Loading…</div> : dGiven.items.length ? <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{dGiven.items.map(g => <span key={g._id} style={{ fontSize: 11.5, padding: '3px 8px', borderRadius: 6, background: 'var(--bg2)', border: '1px solid var(--b1)' }}>{g.sampleName}{g.qty > 1 ? ` ×${g.qty}` : ''} <span style={{ color: 'var(--t3)' }}>· {g.givenDate}</span></span>)}</div> : <div style={{ fontSize: 12, color: 'var(--t3)' }}>No sample with this dealer.</div>}
        </div>}
      </div>

      {/* allocations list */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>Allocations</span>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ fontSize: 12, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)' }}>
          <option value="REQUESTED">Requests to approve</option><option value="ALLOCATED">To be given</option><option value="GIVEN">Given</option><option value="RETURNED">Taken back</option><option value="">All</option>
        </select>
        <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{num(data.items.length)} rows</span>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 360, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead><tr style={{ fontSize: 10.5, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            <th style={{ textAlign: 'left', padding: '6px 8px' }}>Dealer</th><th style={{ textAlign: 'left', padding: '6px 8px' }}>Sample</th><th style={{ textAlign: 'left', padding: '6px 8px' }}>Why</th><th style={{ textAlign: 'left', padding: '6px 8px' }}>Status</th><th></th>
          </tr></thead>
          <tbody>
            {data.items.map(a => (
              <tr key={a._id} style={{ borderTop: '1px solid var(--b1)' }}>
                <td style={{ padding: '5px 8px', fontWeight: 600 }}>{a.dealerName} <span style={{ color: 'var(--t3)', fontSize: 11 }}>· {a.dealerZone || '—'}{a.salesman ? ' · ' + a.salesman : ''}</span></td>
                <td style={{ padding: '5px 8px' }}>{a.sampleName}</td>
                <td style={{ padding: '5px 8px', color: 'var(--t3)' }}>{a.reason}{a.takeBack ? ' · take back' : ''}</td>
                <td style={{ padding: '5px 8px' }}>{a.status === 'GIVEN' ? <span style={{ color: 'var(--grn)' }}>given {a.givenDate}</span> : a.status === 'RETURNED' ? `taken back ${a.returnedDate}` : a.status === 'CANCELLED' ? <span style={{ color: 'var(--t3)' }}>cancelled</span> : a.status === 'REQUESTED' ? <span style={{ color: '#b45309', fontWeight: 700 }}>requested by salesman</span> : 'to be given'}</td>
                <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {a.status === 'REQUESTED' && <>
                    <button className="btnp" disabled={busy} style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => act(() => api.updateAlloc(a._id, { status: 'ALLOCATED' }), `✓ approved — ${a.sampleName} for ${a.dealerName}`)}>Approve</button>
                    <button className="btn" disabled={busy} style={{ fontSize: 11, padding: '2px 8px', marginLeft: 4 }} onClick={() => { const r = window.prompt('Reason for rejecting?'); if (r === null) return; act(() => api.updateAlloc(a._id, { status: 'CANCELLED', reason: r }), 'rejected'); }}>Reject</button>
                  </>}
                  {a.status === 'ALLOCATED' && <>
                    <button className="btn" disabled={busy} title="Mark as given now" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => act(() => api.allocGiven(a._id), '✓ marked given')}><CheckCircle2 size={11} /></button>
                    <button className="btn" disabled={busy} title="Cancel this allocation" style={{ fontSize: 11, padding: '2px 7px', marginLeft: 4 }} onClick={() => act(() => api.updateAlloc(a._id, { status: 'CANCELLED' }), 'cancelled')}><Undo2 size={11} /></button>
                  </>}
                  {a.status === 'GIVEN' && <button className="btn" disabled={busy} title={a.takeBack ? 'Stop asking for it back' : 'Ask the salesman to take it back on the next visit'} style={{ fontSize: 11, padding: '2px 7px', color: a.takeBack ? 'var(--red)' : undefined }} onClick={() => act(() => api.updateAlloc(a._id, { takeBack: !a.takeBack }), a.takeBack ? 'take-back removed' : '✓ flagged for take back')}>{a.takeBack ? 'take back ✓' : 'take back'}</button>}
                </td>
              </tr>
            ))}
            {!data.items.length && <tr><td colSpan={5} style={{ padding: 14, textAlign: 'center', color: 'var(--t3)' }}>Nothing here.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
