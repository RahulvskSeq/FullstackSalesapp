import React, { useState, useEffect } from 'react';
import { IndianRupee, Check, X, Paperclip, HandCoins } from 'lucide-react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Pager, Badge, Busy, ErrorBox, money, num, fmtDate, fmtWhen, DealerLink, userName, useDealerCtx, today, CardRow, KV, monthCols, MonthKVs } from './ui';
import { PaymentForm } from './forms';

/** Payment manager: record → confirm (accounts) → the balance moves. */
export default function Payments({ params }) {
  const { users, isStaff, features, openRecord } = useDealerCtx();
  // Opens on the queue accounts actually works from — payments waiting to be
  // confirmed — and falls back to everything once that queue is empty.
  // Opens on today's collections (the morning statement's date) unless a tile
  // asked for something else; quick picks cover the usual questions.
  const yday = (d => { d.setDate(d.getDate() - 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })(new Date());
  const [q, setQ] = useState({ page: 1, limit: 50, status: params?.status ?? 'CONFIRMED', from: params?.from ?? yday, to: params?.to ?? today() });
  const [autoFell, setAutoFell] = useState(false);
  const monthStart = today().slice(0, 7) + '-01';
  const pick = (from, to, status = 'CONFIRMED') => set({ from, to, status });
  const { data, busy, err, reload } = useLoad(() => col.payments(q), [JSON.stringify(q)]);
  const rangeSum = (data?.items || []).filter(p => p.status === 'CONFIRMED').reduce((a, p) => a + p.amount, 0);
  const [form, setForm] = useState(false);
  useEffect(() => { if (!autoFell && data && q.from === yday && !params?.from && data.total === 0) { setAutoFell(true); setQ(x => ({ ...x, from: '', to: '' })); } }, [data]);   // eslint-disable-line
  const canConfirm = features.has('collections.payments');
  const set = p => setQ(x => ({ ...x, ...p, page: p.page || 1 }));
  const act = async (fn, prompt) => { let reason; if (prompt) { reason = window.prompt(prompt); if (reason === null) return; } try { await fn(reason); reload(); } catch (e) { alert(e.message); } };
  return (
    <div>
      <PageHead icon={HandCoins} tone="var(--grn)" title="Payments collected" sub="Money that has come in, as shown by the daily statement. A salesman entry appears here only once a statement has shown it." right={<button className="btnp" data-tip="Record money received from a dealer" onClick={() => setForm(true)}><IndianRupee size={12} /> Record payment</button>} />
      <Card style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[['Today', today(), today()], ['Yesterday', yday, yday], ['This month', monthStart, today()], ['All time', '', '']].map(([l, f, t]) =>
            <button key={l} className={q.from === f && q.to === t && q.status === 'CONFIRMED' ? 'btnp' : 'btn'} style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => pick(f, t)}>{l}</button>)}
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <input type="date" className="inp" style={{ maxWidth: 160 }} value={q.from} onChange={e => set({ from: e.target.value })} /><span style={{ color: 'var(--t3)' }}>to</span><input type="date" className="inp" style={{ maxWidth: 160 }} value={q.to} onChange={e => set({ to: e.target.value })} max={today()} />
          <select className="sel" value={q.status} onChange={e => set({ status: e.target.value })}><option value="CONFIRMED">Came</option><option value="BOUNCED">Bounced</option><option value="CANCELLED">Cancelled</option><option value="CONFIRMED,BOUNCED,CANCELLED">All</option></select>
          {data && q.status === 'CONFIRMED' && <span className="chip" style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--grn)' }}>{num(data.total)} payments · {money(rangeSum)}{data.total > data.items.length ? ' on this page' : ''}</span>}
        </div>
      </Card>
      <Card pad={false}>
        {err ? <ErrorBox err={err} onRetry={reload} /> : busy && !data ? <Busy /> : <Table cols={[
          { k: 'date', h: 'Date', r: r => fmtDate(r.date) },
          { k: 'paymentNo', h: '#', r: r => <span className="chip">{r.paymentNo}</span> },
          { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealer?.name || String(r.dealerId)} code={r.dealer?.code} /> },
          ...monthCols(data?.items), { k: 'balanceTotal', h: 'Outstanding', align: 'right', r: r => r.balanceTotal == null ? '—' : <b>{money(r.balanceTotal)}</b> },
          { k: 'amount', h: 'Amount', align: 'right', r: r => <b>{money(r.amount)}</b> },
          { k: 'how', h: 'How it was known', r: r => r.source === 'statement' ? (/[Pp]romised/.test(r.remarks || '') ? 'promise kept · statement' : 'seen in statement') : (r.status === 'CONFIRMED' ? 'recorded · confirmed by statement' : 'recorded, not yet in a statement') },
          { k: 'mode', h: 'Mode' }, { k: 'reference', h: 'Reference' },
          { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> },
          { k: 'allocated', h: 'Allocated', align: 'right', r: r => r.allocated ? money(r.allocated) : '—' },
          { k: 'collectedBy', h: 'Collected by', r: r => userName(users, r.collectedBy) },
          { k: 'enteredBy', h: 'Entered by', r: r => userName(users, r.enteredBy) },
          { k: 'confirmedAt', h: 'Confirmed', r: r => r.confirmedAt ? `${fmtWhen(r.confirmedAt)} · ${userName(users, r.confirmedBy)}` : '—' },
          { k: 'proof', h: '', r: r => r.proofId ? <a href={col.proofUrl(r.proofId)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title="Proof"><Paperclip size={13} /></a> : null },
          { k: 'act', h: '', r: r => <div className="row" style={{ gap: 4 }}>
              {r.status === 'RECORDED' && <button className="btn" style={{ padding: '3px 7px' }} data-tip="Cancel" onClick={() => act(rs => col.cancelPayment(r._id, rs), 'Reason for cancelling?')}><X size={12} /></button>}
            </div> },
        ]} rows={data?.items} empty="No payments came in this period." onRow={r => openRecord('payment', r, reload)}
        card={r => <>
          <CardRow><DealerLink id={r.dealerId} name={r.dealer?.name || String(r.dealerId)} code={r.dealer?.code} /><Badge v={r.status} /></CardRow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6, margin: '8px 0 4px' }}>
            <KV k="Amount" v={money(r.amount)} big /><KV k="Date" v={fmtDate(r.date)} /><KV k="Mode" v={r.mode} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>#{r.paymentNo}{r.reference ? ' · ' + r.reference : ''} · by {userName(users, r.enteredBy)}{r.confirmedAt ? ` · confirmed ${fmtWhen(r.confirmedAt)}` : ''}</div>
          {r.balanceTotal != null && <MonthKVs row={r} rows={data?.items} total={r.balanceTotal} />}
          <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {r.status === 'RECORDED' && <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => act(rs => col.cancelPayment(r._id, rs), 'Reason for cancelling?')}><X size={12} /> Cancel</button>}
            {r.proofId && <a className="btn" style={{ padding: '4px 8px', fontSize: 12 }} href={col.proofUrl(r.proofId)} target="_blank" rel="noreferrer"><Paperclip size={12} /> Proof</a>}
          </div>
        </>} />}
        <div style={{ padding: '0 12px 10px' }}><Pager page={data?.page} limit={data?.limit} total={data?.total} onPage={p => setQ(x => ({ ...x, page: p }))} /></div>
      </Card>
      {form && <PaymentForm onClose={() => setForm(false)} onDone={reload} />}
    </div>);
}
