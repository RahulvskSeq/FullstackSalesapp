import React, { useState } from 'react';
import { Check, X, Paperclip, NotebookPen, CalendarClock } from 'lucide-react';
import { col } from './api';
import { Modal, Badge, StatusBadge, DealerLink, KV, ErrorBox, money, fmtDate, fmtWhen, title, userName, useDealerCtx, periodsOf, periodLabel, OldestPill, CallButton, WhatsAppIcon } from './ui';
import { CompleteTask } from './Today';
import { FollowupForm, WhatsAppForm } from './forms';

/* one-line months strip: Jul (red pill) · Aug · Sept · Total */
const Months = ({ r }) => { const ps = periodsOf([r]); if (!ps.length) return null; return <div style={{ display: 'flex', gap: '4px 14px', flexWrap: 'wrap', alignItems: 'center', fontSize: 11.5, color: 'var(--t2)', fontVariantNumeric: 'tabular-nums', marginTop: 6 }}>
  {ps.map((m, i) => <span key={m} style={{ whiteSpace: 'nowrap' }}>{i === 0 ? <span style={{ color: 'var(--red)', fontWeight: 700 }}>{periodLabel(m)}</span> : periodLabel(m)} {r.buckets?.[m] ? (i === 0 ? <OldestPill>{money(r.buckets[m])}</OldestPill> : <b style={{ color: 'var(--t1)' }}>{money(r.buckets[m])}</b>) : '–'}</span>)}
  <span style={{ whiteSpace: 'nowrap' }}>Total <b style={{ color: 'var(--t1)', fontSize: 12.5 }}>{money(r.balanceTotal ?? r.total)}</b></span>
</div>; };
/* days until / since a date, in words */
const dueWords = d => { if (!d) return ''; const t = new Date(typeof d === 'string' && d.length === 10 ? d + 'T00:00:00' : d); const n = Math.round((t - new Date().setHours(0, 0, 0, 0)) / 864e5); return n === 0 ? 'due today' : n > 0 ? `in ${n} day${n > 1 ? 's' : ''}` : `${-n} day${n < -1 ? 's' : ''} overdue`; };
const TONES = { PENDING: ['rgba(245,158,11,.12)', 'rgba(245,158,11,.45)', '#b45309'], PARTIALLY_FULFILLED: ['rgba(245,158,11,.12)', 'rgba(245,158,11,.45)', '#b45309'], FULFILLED: ['rgba(22,163,74,.10)', 'rgba(22,163,74,.4)', 'var(--grn)'], CONFIRMED: ['rgba(22,163,74,.10)', 'rgba(22,163,74,.4)', 'var(--grn)'], RECORDED: ['rgba(245,158,11,.12)', 'rgba(245,158,11,.45)', '#b45309'], BROKEN: ['rgba(220,38,38,.09)', 'rgba(220,38,38,.35)', 'var(--red)'], BOUNCED: ['rgba(220,38,38,.09)', 'rgba(220,38,38,.35)', 'var(--red)'], CANCELLED: ['var(--bg2)', 'var(--b1)', 'var(--t3)'] };
const tone = st => TONES[st] || ['var(--bg2)', 'var(--b1)', 'var(--t1)'];

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
  const dealer = { id: r.dealerId, name: dealerName, code: dealerCode, total: r.balanceTotal ?? r.total, phone: r.phone || r.dealer?.phone || '', whatsappOptOut: !!(r.whatsappOptOut || r.dealer?.whatsappOptOut) };
  const [form, setForm] = useState(null);
  const head = <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 9, background: 'var(--bg2)', border: '1px solid var(--b1)' }}>
    {/* opening the dealer from here closes this modal first, so the drawer is not hidden under it */}
    <div style={{ fontSize: 15, fontWeight: 700 }} onClickCapture={() => setTimeout(onClose, 0)}><DealerLink id={r.dealerId} name={dealerName} code={dealerCode} /></div>
    <Months r={r} />
  </div>;
  /* quick actions on the dealer, shared by every record kind */
  const quick = <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
    <CallButton dealer={dealer} label="Call" size={12} onDialed={() => setForm('followup')} />
    <button className="btn" data-tip="Record a call or visit" onClick={() => setForm('followup')}><NotebookPen size={12} /> Follow-up</button>
    <button className="btn" data-tip="Message the dealer" onClick={() => setForm('wa')} disabled={dealer.whatsappOptOut}><WhatsAppIcon size={13} /> WhatsApp</button>
  </div>;
  const forms = <>
    {form === 'followup' && <FollowupForm dealer={dealer} onClose={() => setForm(null)} onDone={() => { setForm(null); onChanged?.(); }} />}
    {form === 'wa' && <WhatsAppForm dealer={dealer} onClose={() => setForm(null)} onDone={() => setForm(null)} />}
  </>;
  /* tinted panel with the big number */
  const Hero = ({ st, amount, sub, chip, children }) => { const [bg, bd, c] = tone(st); return <div style={{ padding: '10px 12px', borderRadius: 10, background: bg, border: '1px solid ' + bd, marginBottom: 10 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}><span style={{ fontSize: 26, fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{money(amount)}</span>{sub && <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t2)' }}>{sub}</span>}{chip && <span className="chip" style={{ color: c, fontWeight: 700 }}>{chip}</span>}</div>
    {children}
  </div>; };
  const meta = pairs => <div style={{ display: 'flex', gap: '2px 14px', flexWrap: 'wrap', fontSize: 11.5, color: 'var(--t2)', margin: '2px 0 10px' }}>{pairs.filter(p => p[1]).map(([k, v]) => <span key={k}><span style={{ color: 'var(--t3)', fontWeight: 700, fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase' }}>{k}</span> {v}</span>)}</div>;
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

  if (kind === 'payment') { const came = r.status === 'CONFIRMED' ? r.amount : (r.cameSoFar || 0);
    return <Modal title={<span>Payment <span className="chip">#{r.paymentNo}</span> <Badge v={r.status} /></span>} onClose={onClose} width={520}>
    {head}
    <Hero st={r.status} amount={r.amount} sub={<>{fmtDate(r.date)} · {r.mode}{r.reference ? ' · ' + r.reference : ''}</>} chip={r.status === 'CONFIRMED' ? 'seen in statement' : r.status === 'RECORDED' ? 'waiting for statement' : r.status === 'BOUNCED' ? 'bounced' : r.status === 'CANCELLED' ? 'cancelled' : ''}>
      {r.status === 'RECORDED' && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>Came so far</div><div style={{ fontSize: 16, fontWeight: 800, color: came > 0 ? 'var(--grn)' : 'var(--t3)' }}>{money(came)}</div></div>
        <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>Still to come</div><div style={{ fontSize: 16, fontWeight: 800, color: 'var(--red)' }}>{money(Math.max(0, r.amount - came))}</div></div>
      </div>}
    </Hero>
    {meta([['Bank ref', r.bankReference], ['Collected by', userName(users, r.collectedBy)], ['Entered by', userName(users, r.enteredBy)], ['Entered', fmtWhen(r.createdAt)], ['Confirmed', r.confirmedAt ? fmtWhen(r.confirmedAt) + (r.source === 'statement' ? ' · statement' : ' · ' + userName(users, r.confirmedBy)) : ''], ['Cancelled / bounced', r.cancelReason ? r.cancelReason + ' · ' + userName(users, r.cancelledBy) : '']])}
    {note('Remarks', r.remarks)}
    {r.proofId && <a className="btn" href={col.proofUrl(r.proofId)} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', gap: 5, alignItems: 'center', marginBottom: 10 }}><Paperclip size={12} /> Open proof</a>}
    <ErrorBox err={err} />
    <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
      {quick}
      {r.status === 'RECORDED' && <button className="btn" disabled={busy} data-tip="Wrong entry — remove it" onClick={() => act(rs => col.cancelPayment(r._id, rs), 'Reason for cancelling?')}><X size={12} /> Cancel entry</button>}
    </div>
    {forms}
  </Modal>; }

  if (kind === 'followup') return <Modal title={<span>Follow-up · {title(r.channel)} <Badge v={r.outcome} /></span>} onClose={onClose} width={520}>
    {head}
    {meta([['When', fmtDate(r.date) + (r.time ? ' ' + r.time : '')], ['By', userName(users, r.employeeId)], ['Next follow-up', r.nextFollowupDate ? fmtDate(r.nextFollowupDate) + ' · ' + dueWords(r.nextFollowupDate) : ''], ['Recorded', fmtWhen(r.createdAt)]])}
    {note('Discussion', r.discussion)}
    {note('Customer response', r.customerResponse)}
    {note('Next action', r.nextAction)}
    {note('Remarks', r.remarks)}
    {r.promiseId && <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 10 }}>A promise was recorded with this follow-up — see the Promises tab.</div>}
    <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>{quick}</div>
    {forms}
  </Modal>;

  if (kind === 'promise') { const left = Math.max(0, r.amount - (r.received || 0)); const pct = r.amount ? Math.min(100, Math.round(((r.received || 0) / r.amount) * 100)) : 0; const open = ['PENDING', 'PARTIALLY_FULFILLED'].includes(r.status);
    return <Modal title={<span>Promise <Badge v={r.status} /></span>} onClose={onClose} width={520}>
    {head}
    <Hero st={r.status} amount={r.amount} sub={<><CalendarClock size={12} style={{ verticalAlign: -2 }} /> promised by <b style={{ color: 'var(--t1)' }}>{fmtDate(r.promiseDate)}</b></>} chip={open ? dueWords(r.promiseDate) : r.status === 'FULFILLED' ? 'kept' : r.status === 'BROKEN' ? 'broken' : 'cancelled'}>
      {/* how much of it has come, as a bar */}
      <div style={{ height: 6, borderRadius: 4, background: 'rgba(0,0,0,.08)', margin: '10px 0 8px', overflow: 'hidden' }}><div style={{ width: pct + '%', height: '100%', background: 'var(--grn)', borderRadius: 4 }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>Received</div><div style={{ fontSize: 16, fontWeight: 800, color: (r.received || 0) > 0 ? 'var(--grn)' : 'var(--t3)' }}>{money(r.received || 0)}</div></div>
        <div><div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>Still due</div><div style={{ fontSize: 16, fontWeight: 800, color: left > 0 ? 'var(--red)' : 'var(--grn)' }}>{money(left)}</div></div>
      </div>
    </Hero>
    {meta([['Made', fmtWhen(r.createdAt)], ['By', userName(users, r.employeeId)], ['Kept', r.fulfilledAt ? fmtWhen(r.fulfilledAt) : ''], ['Broken', r.brokenAt ? fmtWhen(r.brokenAt) : ''], ['Cancelled', r.cancelReason ? r.cancelReason + ' · ' + userName(users, r.cancelledBy) : '']])}
    {note('Notes', r.notes)}
    <ErrorBox err={err} />
    <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
      {quick}
      {open && (isStaff || r.employeeId === currentUser?.id) && <button className="btnd" disabled={busy} data-tip="Only for a promise made by mistake" onClick={() => act(rs => col.cancelPromise(r._id, rs), 'Why cancel this promise?')}><X size={12} /> Cancel promise</button>}
    </div>
    {forms}
  </Modal>; }

  if (kind === 'event') return <Modal title={<span>{title(r.type)} {r.cause ? <span className="chip">{r.cause}</span> : null}</span>} onClose={onClose}>
    {head}
    {grid([['When', fmtWhen(r.at)], ['Amount', r.amount ? money(r.amount) : ''], ['Before', r.before != null ? money(r.before) : ''], ['After', r.after != null ? money(r.after) : ''], ['By', ['import', 'automation', 'migration'].includes(r.by) ? r.by : userName(users, r.by)]])}
    {note('Note', r.note)}
    {r.meta && Object.keys(r.meta).length > 0 && note('Details', JSON.stringify(r.meta, null, 1).replace(/[{}"]/g, ''))}
  </Modal>;

  return <Modal title="Record" onClose={onClose}>{head}<pre style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{JSON.stringify(r, null, 1)}</pre></Modal>;
}
