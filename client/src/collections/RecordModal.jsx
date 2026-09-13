import React, { useState } from 'react';
import { Check, X, Paperclip } from 'lucide-react';
import { col } from './api';
import { Modal, Badge, StatusBadge, DealerLink, MonthKVs, KV, ErrorBox, money, fmtDate, fmtWhen, title, userName, useDealerCtx } from './ui';
import { CompleteTask } from './Today';

/**
 * One modal for any record — click a task, payment, follow-up or promise
 * anywhere and it opens here with everything about it and the actions that
 * apply. The dealer name inside opens Dealer 360 on top.
 */
export default function RecordModal({ kind, record: r, onClose, onChanged }) {
  const { users, isStaff, features, currentUser } = useDealerCtx();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const act = async (fn, prompt) => { let reason; if (prompt) { reason = window.prompt(prompt); if (reason === null) return; } setBusy(true); setErr(''); try { await fn(reason); onChanged?.(); onClose(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const dealerName = r.dealerName || r.dealer?.name || String(r.dealerId), dealerCode = r.dealerCode || r.dealer?.code;
  const head = <div style={{ marginBottom: 10 }}>
    {/* opening the dealer from here closes this modal first, so the drawer is not hidden under it */}
    <div style={{ fontSize: 15, fontWeight: 700 }} onClickCapture={() => setTimeout(onClose, 0)}><DealerLink id={r.dealerId} name={dealerName} code={dealerCode} /></div>
    {(r.buckets && Object.keys(r.buckets).length > 0) && <MonthKVs row={r} total={r.balanceTotal ?? r.total} />}
  </div>;
  const grid = pairs => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, margin: '6px 0 12px' }}>{pairs.filter(p => p[1] !== undefined && p[1] !== null && p[1] !== '').map(([k, v]) => <KV key={k} k={k} v={v} />)}</div>;
  const note = (label, text) => text ? <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>{label}</div><div style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{text}</div></div> : null;

  if (kind === 'task') return <Modal title={<span><Badge v={r.priority} /> {title(r.type)} <span className="chip">#{r.taskNo}</span> <Badge v={r.status} /></span>} onClose={onClose}>
    {head}
    {note('Description', r.description)}
    {grid([['Due', fmtDate(r.dueDate) + (r.dueTime ? ' ' + r.dueTime : '')], ['Assigned to', userName(users, r.employeeId)], ['Points', r.points], ['Source', r.source === 'automation' ? 'automation · ' + r.ruleId : r.source], ['Created by', userName(users, r.createdBy)], ['Created', fmtWhen(r.createdAt)], ['Completed', r.completedAt ? fmtWhen(r.completedAt) + ' · ' + userName(users, r.completedBy) : '']])}
    {r.comments?.length > 0 && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>Comments</div>{r.comments.map((c, i) => <div key={i} style={{ fontSize: 12.5, padding: '6px 0', borderTop: '1px solid var(--b1)' }}>{c.text}<div style={{ fontSize: 11, color: 'var(--t3)' }}>{userName(users, c.by)} · {fmtWhen(c.at)}</div></div>)}</div>}
    <ErrorBox err={err} />
    {['OPEN', 'IN_PROGRESS'].includes(r.status) && <div className="row" style={{ gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      <button className="btn" disabled={busy} onClick={() => act(async () => { const t = window.prompt('Comment'); if (!t) throw new Error('no comment'); await col.commentTask(r._id, t); })}>Comment</button>
      <button className="btn" disabled={busy} onClick={() => act(rs => col.cancelTask(r._id, rs), 'Reason for cancelling?')}><X size={12} /> Cancel task</button>
      <button className="btnp" disabled={busy} onClick={() => setDone(true)}><Check size={12} /> Mark done</button>
    </div>}
    {done && <CompleteTask task={r} onClose={() => setDone(false)} onDone={() => { onChanged?.(); onClose(); }} />}
  </Modal>;

  if (kind === 'payment') return <Modal title={<span>Payment <span className="chip">#{r.paymentNo}</span> <Badge v={r.status} /></span>} onClose={onClose}>
    {head}
    <div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 8px' }}>{money(r.amount)}</div>
    {grid([['Date', fmtDate(r.date)], ['Mode', r.mode], ['Reference', r.reference], ['Bank ref', r.bankReference], ['Collected by', userName(users, r.collectedBy)], ['Entered by', userName(users, r.enteredBy)], ['Allocated', r.allocated ? money(r.allocated) : ''], ['Confirmed', r.confirmedAt ? fmtWhen(r.confirmedAt) + ' · ' + userName(users, r.confirmedBy) : ''], ['Cancelled / bounced', r.cancelReason ? r.cancelReason + ' · ' + userName(users, r.cancelledBy) : '']])}
    {note('Remarks', r.remarks)}
    {r.proofId && <a className="btn" href={col.proofUrl(r.proofId)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', gap: 5, alignItems: 'center', marginBottom: 10 }}><Paperclip size={12} /> Open proof</a>}
    <ErrorBox err={err} />
    <div className="row" style={{ gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
      {r.status === 'RECORDED' && <button className="btn" disabled={busy} onClick={() => act(rs => col.cancelPayment(r._id, rs), 'Reason for cancelling?')}><X size={12} /> Cancel</button>}
      {r.status === 'RECORDED' && features.has('collections.payments') && <button className="btnp" disabled={busy} onClick={() => act(() => col.confirmPayment(r._id))}><Check size={12} /> Confirm</button>}
      {r.status === 'CONFIRMED' && features.has('collections.payments') && <button className="btnd" disabled={busy} onClick={() => act(rs => col.bouncePayment(r._id, rs), 'Reason for the bounce?')}>Bounce</button>}
    </div>
  </Modal>;

  if (kind === 'followup') return <Modal title={<span>Follow-up · {title(r.channel)} <Badge v={r.outcome} /></span>} onClose={onClose}>
    {head}
    {grid([['When', fmtDate(r.date) + (r.time ? ' ' + r.time : '')], ['By', userName(users, r.employeeId)], ['Next follow-up', fmtDate(r.nextFollowupDate)], ['Recorded', fmtWhen(r.createdAt)]])}
    {note('Discussion', r.discussion)}
    {note('Customer response', r.customerResponse)}
    {note('Next action', r.nextAction)}
    {note('Remarks', r.remarks)}
    {r.promiseId && <div style={{ fontSize: 12, color: 'var(--t2)' }}>A promise was recorded with this follow-up — see the Promises tab.</div>}
  </Modal>;

  if (kind === 'promise') return <Modal title={<span>Promise <Badge v={r.status} /></span>} onClose={onClose}>
    {head}
    <div style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 8px' }}>{money(r.amount)} <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>by {fmtDate(r.promiseDate)}</span></div>
    {grid([['Received', money(r.received)], ['Still due', money(r.amount - (r.received || 0))], ['Employee', userName(users, r.employeeId)], ['Made', fmtWhen(r.createdAt)], ['Kept', r.fulfilledAt ? fmtWhen(r.fulfilledAt) : ''], ['Broken', r.brokenAt ? fmtWhen(r.brokenAt) : ''], ['Cancelled', r.cancelReason ? r.cancelReason + ' · ' + userName(users, r.cancelledBy) : '']])}
    {note('Notes', r.notes)}
    <ErrorBox err={err} />
    {['PENDING', 'PARTIALLY_FULFILLED'].includes(r.status) && (isStaff || r.employeeId === currentUser?.id) && <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btnd" disabled={busy} onClick={() => act(rs => col.cancelPromise(r._id, rs), 'Why cancel this promise?')}>Cancel promise</button></div>}
  </Modal>;

  if (kind === 'event') return <Modal title={<span>{title(r.type)} {r.cause ? <span className="chip">{r.cause}</span> : null}</span>} onClose={onClose}>
    {head}
    {grid([['When', fmtWhen(r.at)], ['Amount', r.amount ? money(r.amount) : ''], ['Before', r.before != null ? money(r.before) : ''], ['After', r.after != null ? money(r.after) : ''], ['By', ['import', 'automation', 'migration'].includes(r.by) ? r.by : userName(users, r.by)]])}
    {note('Note', r.note)}
    {r.meta && Object.keys(r.meta).length > 0 && note('Details', JSON.stringify(r.meta, null, 1).replace(/[{}"]/g, ''))}
  </Modal>;

  return <Modal title="Record" onClose={onClose}>{head}<pre style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{JSON.stringify(r, null, 1)}</pre></Modal>;
}
