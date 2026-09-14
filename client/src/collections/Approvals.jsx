import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { col } from './api';
import { useLoad, Modal, Badge, Busy, ErrorBox, Empty, money, num, fmtDate, DealerLink, MonthKVs, useDealerCtx, userName } from './ui';

/**
 * Pending approvals — every statement decrease accounts has not yet decided
 * on. Approve = money received (a confirmed payment is written, promises are
 * credited); Not a payment = credit note / return / correction. The balance
 * is already what the statement says; only the story behind it is decided here.
 */
export default function ApprovalsModal({ onClose, onChanged }) {
  const { features, users } = useDealerCtx();
  const can = features.has('collections.payments');
  const { data, busy, err, reload } = useLoad(() => col.pendingApprovals({ limit: 200 }), []);
  const rec = useLoad(() => col.payments({ status: 'RECORDED', limit: 200 }), []);
  const reloadAll = () => { reload(); rec.reload(); };
  const [acting, setActing] = useState('');
  const [aerr, setAerr] = useState('');
  const act = async (fn, id) => { setActing(id); setAerr(''); try { await fn(); reloadAll(); onChanged?.(); } catch (e) { setAerr(e.message); } finally { setActing(''); } };
  return (
    <Modal title={<span>Pending approvals {data && rec.data ? <span className="chip">{num(data.total + rec.data.total)} · {money(data.sum + rec.data.items.reduce((a, p) => a + p.amount, 0))}</span> : null}</span>} onClose={onClose} width={860}>
      <ErrorBox err={err || aerr || rec.err} onRetry={err ? reload : undefined} />
      <div style={{ fontSize: 12.5, fontWeight: 700, margin: '4px 0 6px' }}>Payments recorded by salesmen — confirm {rec.data ? <span className="chip">{num(rec.data.total)}</span> : null}</div>
      {rec.busy && !rec.data ? <Busy /> : !rec.data?.items?.length ? <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>None waiting.</div> :
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          {rec.data.items.map(p => <div key={p._id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--b1)' }}>
            <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <DealerLink id={p.dealerId} name={p.dealer?.name || String(p.dealerId)} code={p.dealer?.code} />
              <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>#{p.paymentNo} · {fmtDate(p.date)} · {p.mode}{p.reference ? ' · ' + p.reference : ''} · by {userName(users, p.enteredBy)}</span>
            </div>
            <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '6px 0' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#b45309' }}>{money(p.amount)}</span>
              {p.proofId && <a className="btn" href={col.proofUrl(p.proofId)} target="_blank" rel="noreferrer" style={{ fontSize: 11 }}>Proof</a>}
              {p.remarks && <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{p.remarks}</span>}
            </div>
            {p.buckets && Object.keys(p.buckets).length > 0 && <MonthKVs row={p} total={p.balanceTotal} />}
            <div className="row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8, flexWrap: 'wrap' }}>
              <button className="btn" disabled={acting === p._id} data-tip="Wrong entry — remove it" onClick={() => { const r = window.prompt('Reason for cancelling?'); if (r === null) return; act(() => col.cancelPayment(p._id, r), p._id); }}><X size={12} /> Cancel</button>
              <button className="btnp" disabled={!can || acting === p._id} data-tip="Money is in — the balance moves by this amount" onClick={() => act(() => col.confirmPayment(p._id), p._id)}><Check size={12} /> {acting === p._id ? 'Saving…' : 'Confirm'}</button>
            </div>
          </div>)}
        </div>}
      <div style={{ fontSize: 12.5, fontWeight: 700, margin: '4px 0 2px' }}>Statement decreases — approve {data ? <span className="chip">{num(data.total)}</span> : null}</div>
      <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 8 }}>The statement showed these dealers owing less than before, with no confirmed payment behind it. Tick what actually happened.</div>
      {busy && !data ? <Busy /> : !data?.items?.length ? <Empty>Nothing waiting — every decrease is explained.</Empty> :
        <div style={{ display: 'grid', gap: 8 }}>
          {data.items.map(e => <div key={e._id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--b1)' }}>
            <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <DealerLink id={e.dealerId} name={e.dealer?.name || String(e.dealerId)} code={e.dealer?.code} />
              <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>statement {fmtDate(e.meta?.to)} · was {money(e.meta?.observed != null ? (e.after ?? 0) + e.meta.observed : e.before)} → now {money(e.balanceTotal ?? e.after)}</span>
            </div>
            <div className="row" style={{ gap: 12, alignItems: 'center', flexWrap: 'wrap', margin: '6px 0' }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#b45309' }}>{money(e.amount)}</span>
              <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>decrease not explained by any confirmed payment{e.meta?.explained ? ` (${money(e.meta.explained)} was)` : ''}</span>
              {e.priority && <Badge v={e.priority} />}
            </div>
            {e.buckets && Object.keys(e.buckets).length > 0 && <MonthKVs row={e} total={e.balanceTotal} />}
            {e.promises?.length > 0 && <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 4 }}>Promises: {e.promises.map(p => `${money(p.amount - (p.received || 0))} by ${fmtDate(p.promiseDate)} (${p.status.toLowerCase()})`).join(' · ')}</div>}
            <div className="row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8, flexWrap: 'wrap' }}>
              <button className="btn" disabled={!can || acting === e._id} data-tip="Credit note, return or correction — not money" onClick={() => { const r = window.prompt('What was it? (credit note, return, correction…)'); if (r === null) return; act(() => col.dismissDecrease(e._id, r), e._id); }}><X size={12} /> Not a payment</button>
              <button className="btnp" disabled={!can || acting === e._id} data-tip="Money received — write it as a confirmed payment" onClick={() => act(() => col.approveDecrease(e._id), e._id)}><Check size={12} /> {acting === e._id ? 'Saving…' : 'Approve as payment'}</button>
            </div>
          </div>)}
        </div>}
      {!can && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>Only users with the "Confirm payments" permission can decide these.</div>}
    </Modal>);
}
