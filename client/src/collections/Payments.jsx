import React, { useState } from 'react';
import { IndianRupee, Check, X, Paperclip, HandCoins } from 'lucide-react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Pager, Badge, Busy, ErrorBox, money, num, fmtDate, fmtWhen, DealerLink, userName, useDealerCtx, today, CardRow, KV, monthCols, MonthKVs } from './ui';
import { PaymentForm } from './forms';

/** Payment manager: record → confirm (accounts) → the balance moves. */
export default function Payments({ params }) {
  const { users, isStaff, features, openRecord } = useDealerCtx();
  const [q, setQ] = useState({ page: 1, limit: 50, status: params?.status || '', from: '', to: '' });
  const { data, busy, err, reload } = useLoad(() => col.payments(q), [JSON.stringify(q)]);
  const [form, setForm] = useState(false);
  const canConfirm = features.has('collections.payments');
  const set = p => setQ(x => ({ ...x, ...p, page: p.page || 1 }));
  const act = async (fn, prompt) => { let reason; if (prompt) { reason = window.prompt(prompt); if (reason === null) return; } try { await fn(reason); reload(); } catch (e) { alert(e.message); } };
  return (
    <div>
      <PageHead icon={HandCoins} tone="var(--grn)" title="Payments" sub="A recorded payment is a claim; a confirmed one moves the balance. Bounce reverses it and reopens the cycle." right={<button className="btnp" data-tip="Record money received from a dealer" onClick={() => setForm(true)}><IndianRupee size={12} /> Record payment</button>} />
      <Card style={{ marginBottom: 12 }}><div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <select className="sel" value={q.status} onChange={e => set({ status: e.target.value })}><option value="">Any status</option>{['RECORDED', 'CONFIRMED', 'BOUNCED', 'CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}</select>
        <input type="date" className="inp" style={{ maxWidth: 160 }} value={q.from} onChange={e => set({ from: e.target.value })} /><span style={{ color: 'var(--t3)' }}>to</span><input type="date" className="inp" style={{ maxWidth: 160 }} value={q.to} onChange={e => set({ to: e.target.value })} max={today()} />
        {q.status === '' && <button className="btn" onClick={() => set({ status: 'RECORDED' })}>Awaiting confirmation</button>}
      </div></Card>
      <Card pad={false}>
        {err ? <ErrorBox err={err} onRetry={reload} /> : busy && !data ? <Busy /> : <Table cols={[
          { k: 'date', h: 'Date', r: r => fmtDate(r.date) },
          { k: 'paymentNo', h: '#', r: r => <span className="chip">{r.paymentNo}</span> },
          { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealer?.name || String(r.dealerId)} code={r.dealer?.code} /> },
          ...monthCols(data?.items), { k: 'balanceTotal', h: 'Outstanding', align: 'right', r: r => r.balanceTotal == null ? '—' : <b>{money(r.balanceTotal)}</b> },
          { k: 'amount', h: 'Amount', align: 'right', r: r => <b>{money(r.amount)}</b> },
          { k: 'mode', h: 'Mode' }, { k: 'reference', h: 'Reference' },
          { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> },
          { k: 'allocated', h: 'Allocated', align: 'right', r: r => r.allocated ? money(r.allocated) : '—' },
          { k: 'collectedBy', h: 'Collected by', r: r => userName(users, r.collectedBy) },
          { k: 'enteredBy', h: 'Entered by', r: r => userName(users, r.enteredBy) },
          { k: 'confirmedAt', h: 'Confirmed', r: r => r.confirmedAt ? `${fmtWhen(r.confirmedAt)} · ${userName(users, r.confirmedBy)}` : '—' },
          { k: 'proof', h: '', r: r => r.proofId ? <a href={col.proofUrl(r.proofId)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title="Proof"><Paperclip size={13} /></a> : null },
          { k: 'act', h: '', r: r => <div className="row" style={{ gap: 4 }}>
              {r.status === 'RECORDED' && canConfirm && <button className="btnp" data-tip="Confirm: the balance moves by this amount" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => act(() => col.confirmPayment(r._id))}><Check size={12} /> Confirm</button>}
              {r.status === 'CONFIRMED' && canConfirm && <button className="btnd" data-tip="Cheque returned: reverse this payment" onClick={() => act(rs => col.bouncePayment(r._id, rs), 'Reason for the bounce?')}>Bounce</button>}
              {r.status === 'RECORDED' && <button className="btn" style={{ padding: '3px 7px' }} data-tip="Cancel" onClick={() => act(rs => col.cancelPayment(r._id, rs), 'Reason for cancelling?')}><X size={12} /></button>}
            </div> },
        ]} rows={data?.items} empty="No payments." onRow={r => openRecord('payment', r, reload)}
        card={r => <>
          <CardRow><DealerLink id={r.dealerId} name={r.dealer?.name || String(r.dealerId)} code={r.dealer?.code} /><Badge v={r.status} /></CardRow>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6, margin: '8px 0 4px' }}>
            <KV k="Amount" v={money(r.amount)} big /><KV k="Date" v={fmtDate(r.date)} /><KV k="Mode" v={r.mode} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>#{r.paymentNo}{r.reference ? ' · ' + r.reference : ''} · by {userName(users, r.enteredBy)}{r.confirmedAt ? ` · confirmed ${fmtWhen(r.confirmedAt)}` : ''}</div>
          {r.balanceTotal != null && <MonthKVs row={r} rows={data?.items} total={r.balanceTotal} />}
          <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {r.status === 'RECORDED' && canConfirm && <button className="btnp" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => act(() => col.confirmPayment(r._id))}><Check size={12} /> Confirm</button>}
            {r.status === 'CONFIRMED' && canConfirm && <button className="btnd" onClick={() => act(rs => col.bouncePayment(r._id, rs), 'Reason for the bounce?')}>Bounce</button>}
            {r.status === 'RECORDED' && <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => act(rs => col.cancelPayment(r._id, rs), 'Reason for cancelling?')}><X size={12} /> Cancel</button>}
            {r.proofId && <a className="btn" style={{ padding: '4px 8px', fontSize: 12 }} href={col.proofUrl(r.proofId)} target="_blank" rel="noreferrer"><Paperclip size={12} /> Proof</a>}
          </div>
        </>} />}
        <div style={{ padding: '0 12px 10px' }}><Pager page={data?.page} limit={data?.limit} total={data?.total} onPage={p => setQ(x => ({ ...x, page: p }))} /></div>
      </Card>
      {form && <PaymentForm onClose={() => setForm(false)} onDone={reload} />}
    </div>);
}
