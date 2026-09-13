import React, { useState } from 'react';
import { IndianRupee, Check, X, Paperclip, HandCoins } from 'lucide-react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Pager, Badge, Busy, ErrorBox, money, num, fmtDate, fmtWhen, DealerLink, userName, useDealerCtx, today } from './ui';
import { PaymentForm } from './forms';

/** Payment manager: record → confirm (accounts) → the balance moves. */
export default function Payments({ params }) {
  const { users, isStaff, features } = useDealerCtx();
  const [q, setQ] = useState({ page: 1, limit: 50, status: params?.status || '', from: '', to: '' });
  const { data, busy, err, reload } = useLoad(() => col.payments(q), [JSON.stringify(q)]);
  const [form, setForm] = useState(false);
  const canConfirm = features.has('collections.payments');
  const set = p => setQ(x => ({ ...x, ...p, page: p.page || 1 }));
  const act = async (fn, prompt) => { let reason; if (prompt) { reason = window.prompt(prompt); if (reason === null) return; } try { await fn(reason); reload(); } catch (e) { alert(e.message); } };
  return (
    <div>
      <PageHead icon={HandCoins} tone="var(--grn)" title="Payments" sub="A recorded payment is a claim; a confirmed one moves the balance. Bounce reverses it and reopens the cycle." right={<button className="btnp" onClick={() => setForm(true)}><IndianRupee size={12} /> Record payment</button>} />
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
          { k: 'amount', h: 'Amount', align: 'right', r: r => <b>{money(r.amount)}</b> },
          { k: 'mode', h: 'Mode' }, { k: 'reference', h: 'Reference' },
          { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> },
          { k: 'allocated', h: 'Allocated', align: 'right', r: r => r.allocated ? money(r.allocated) : '—' },
          { k: 'collectedBy', h: 'Collected by', r: r => userName(users, r.collectedBy) },
          { k: 'enteredBy', h: 'Entered by', r: r => userName(users, r.enteredBy) },
          { k: 'confirmedAt', h: 'Confirmed', r: r => r.confirmedAt ? `${fmtWhen(r.confirmedAt)} · ${userName(users, r.confirmedBy)}` : '—' },
          { k: 'proof', h: '', r: r => r.proofId ? <a href={col.proofUrl(r.proofId)} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} title="Proof"><Paperclip size={13} /></a> : null },
          { k: 'act', h: '', r: r => <div className="row" style={{ gap: 4 }}>
              {r.status === 'RECORDED' && canConfirm && <button className="btnp" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => act(() => col.confirmPayment(r._id))}><Check size={12} /> Confirm</button>}
              {r.status === 'CONFIRMED' && canConfirm && <button className="btnd" onClick={() => act(rs => col.bouncePayment(r._id, rs), 'Reason for the bounce?')}>Bounce</button>}
              {r.status === 'RECORDED' && <button className="btn" style={{ padding: '3px 7px' }} title="Cancel" onClick={() => act(rs => col.cancelPayment(r._id, rs), 'Reason for cancelling?')}><X size={12} /></button>}
            </div> },
        ]} rows={data?.items} empty="No payments." />}
        <div style={{ padding: '0 12px 10px' }}><Pager page={data?.page} limit={data?.limit} total={data?.total} onPage={p => setQ(x => ({ ...x, page: p }))} /></div>
      </Card>
      {form && <PaymentForm onClose={() => setForm(false)} onDone={reload} />}
    </div>);
}
