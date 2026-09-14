import React, { useState } from 'react';
import { ClipboardList, Check, X, CalendarCheck, NotebookPen, Banknote } from 'lucide-react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Badge, Busy, ErrorBox, money, num, fmtDate, DealerLink, useDealerCtx, userName, title, WhatsAppIcon, StatusBadge, CallButton, CardRow, KV, monthCols, MonthKVs, FollowupDate } from './ui';
import { FollowupForm, PaymentForm, TaskForm, WhatsAppForm } from './forms';

/**
 * "What do I need to do today?" — one call, everything due, with the write
 * actions right on the rows so nothing needs a second screen.
 */
export default function Today() {
  const { users, isStaff, currentUser, openRecord, open: openDealer } = useDealerCtx();
  const [emp, setEmp] = useState('');
  const { data, busy, err, reload } = useLoad(() => col.today(emp ? { employeeId: emp } : {}), [emp]);
  const [form, setForm] = useState(null);   // { kind, dealer }
  const [done, setDone] = useState(null);   // task being completed
  if (busy && !data) return <Busy />;
  if (err) return <ErrorBox err={err} onRetry={reload} />;
  const d = data;
  const dealerOf = r => ({ id: String(r.dealerId), name: r.dealerName || r.dealer?.name || '', code: r.dealerCode || r.dealer?.code || '', phone: r.phone || r.dealer?.phone || '' });
  const actions = r => <div className="row" style={{ gap: 4 }}>
    <CallButton dealer={dealerOf(r)} label={<span className="col-lbl">Call</span>} onDialed={d => setForm({ kind: 'followup', dealer: d })} />
    <button className="btn" data-tip="Write down a follow-up" style={{ padding: '3px 8px', color: 'var(--pur)', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} onClick={e => { e.stopPropagation(); setForm({ kind: 'followup', dealer: dealerOf(r) }); }}><NotebookPen size={12} /><span className="col-lbl">Follow-up</span></button>
    <button className="btn" data-tip="Record a payment" style={{ padding: '3px 8px', color: 'var(--grn)', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} onClick={e => { e.stopPropagation(); setForm({ kind: 'payment', dealer: dealerOf(r) }); }}><Banknote size={12} /><span className="col-lbl">Payment</span></button>
    <button className="btn" data-tip="WhatsApp" style={{ padding: '3px 8px', color: '#25D366', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} onClick={e => { e.stopPropagation(); setForm({ kind: 'wa', dealer: dealerOf(r) }); }}><WhatsAppIcon size={13} /><span className="col-lbl">WhatsApp</span></button>
  </div>;
  const actBtns = r => <div className="row col-actions" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
    <CallButton dealer={dealerOf(r)} label="Call" onDialed={d => setForm({ kind: 'followup', dealer: d })} />
    <button className="btn" style={{ padding: '3px 8px', color: 'var(--pur)', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} onClick={e => { e.stopPropagation(); setForm({ kind: 'followup', dealer: dealerOf(r) }); }}><NotebookPen size={12} />Follow-up</button>
    <button className="btn" style={{ padding: '3px 8px', color: 'var(--grn)', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} onClick={e => { e.stopPropagation(); setForm({ kind: 'payment', dealer: dealerOf(r) }); }}><Banknote size={12} />Payment</button>
    <button className="btn" style={{ padding: '3px 8px', color: '#25D366', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} onClick={e => { e.stopPropagation(); setForm({ kind: 'wa', dealer: dealerOf(r) }); }}><WhatsAppIcon size={13} />WhatsApp</button>
  </div>;
  const taskCard = r => <>
    <CardRow><span><Badge v={r.priority} /> <b style={{ marginLeft: 6 }}>{title(r.type)}</b></span><span className="chip">#{r.taskNo}</span></CardRow>
    <div style={{ margin: '4px 0' }}><DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /></div>
    {r.description && <div style={{ fontSize: 12, color: 'var(--t2)' }}>{r.description}</div>}
    <MonthKVs row={r} rows={allRows} total={r.balanceTotal} />
    <div style={{ fontSize: 11.5, color: r.dueDate < d.today ? 'var(--red)' : 'var(--t2)', marginTop: 4 }}>Due {fmtDate(r.dueDate)}{r.dueTime ? ' ' + r.dueTime : ''}{isStaff ? ' · ' + userName(users, r.employeeId) : ''} · {r.points} pts</div>
    <div className="row" style={{ gap: 6, marginTop: 8 }}>
      <button className="btnp" style={{ padding: '4px 10px', fontSize: 12 }} onClick={e => { e.stopPropagation(); setDone(r); }}><Check size={12} /> Done</button>
      <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={async e => { e.stopPropagation(); const reason = window.prompt('Reason for cancelling?'); if (reason === null) return; await col.cancelTask(r._id, reason).catch(x => alert(x.message)); reload(); }}><X size={12} /> Cancel</button>
    </div>
  </>;
  const balCard = r => <>
    <CardRow><DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /><StatusBadge status={r.status} priority={r.priority} /></CardRow>
    <MonthKVs row={r} rows={allRows} />
    <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{r.ageDays != null ? `${r.ageDays} days · ` : ''}<FollowupDate value={r.nextFollowupAt} prefix="follow-up " onOpen={() => setForm({ kind: 'followup', dealer: dealerOf(r), focusDate: true })} /></div>
    {r.promise?.amount ? <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>Promise {money(r.promise.amount)} by {fmtDate(r.promise.date)}</div> : null}
    {actBtns(r)}
  </>;
  const promCard = r => <>
    <CardRow><DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /><Badge v={r.status} /></CardRow>
    <MonthKVs row={r} rows={allRows} total={r.balanceTotal} />
    <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>Promised {money(r.amount)} by {fmtDate(r.promiseDate)} · received {money(r.received)}</div>
    {isStaff && <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{userName(users, r.employeeId)}</div>}
    {actBtns(r)}
  </>;
  const allRows = [...d.tasksToday, ...d.tasksOverdue, ...d.followupsDue, ...d.followupsOverdue, ...d.promisesToday, ...d.promisesBroken, ...d.highPriority];
  const months = monthCols(allRows);
  const taskCols = [
    { k: 'taskNo', h: '#', r: r => <span className="chip">{r.taskNo}</span> },
    { k: 'type', h: 'Task', r: r => <span><Badge v={r.priority} /> <b style={{ marginLeft: 6 }}>{title(r.type)}</b>{r.description ? <div style={{ fontSize: 11.5, color: 'var(--t2)', whiteSpace: 'normal' }}>{r.description}</div> : null}</span>, wrap: true },
    { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /> },
    ...months, { k: 'balanceTotal', h: 'Outstanding', align: 'right', r: r => <b>{money(r.balanceTotal ?? r.total)}</b> },
    { k: 'dueDate', h: 'Due', r: r => <span style={{ color: r.dueDate < d.today ? 'var(--red)' : undefined }}>{fmtDate(r.dueDate)}{r.dueTime ? ' ' + r.dueTime : ''}</span> },
    ...(isStaff ? [{ k: 'employeeId', h: 'Assigned', r: r => userName(users, r.employeeId) }] : []),
    { k: 'points', h: 'Pts', align: 'right' },
    { k: 'act', h: '', r: r => <div className="row" style={{ gap: 4 }}>
        <button className="btnp" data-tip="Mark this task done" style={{ padding: '3px 8px', fontSize: 11 }} onClick={e => { e.stopPropagation(); setDone(r); }}><Check size={12} /> Done</button>
        <button className="btn" style={{ padding: '3px 7px' }} data-tip="Cancel task" onClick={async e => { e.stopPropagation(); const reason = window.prompt('Reason for cancelling?'); if (reason === null) return; await col.cancelTask(r._id, reason).catch(x => alert(x.message)); reload(); }}><X size={12} /></button>
      </div> },
  ];
  const balCols = [
    { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /> },
    ...months, { k: 'total', h: 'Outstanding', align: 'right', r: r => <b>{money(r.total)}</b> },
    { k: 'ageDays', h: 'Age', align: 'right', r: r => r.ageDays == null ? '—' : r.ageDays + 'd' },
    { k: 'status', h: 'Status', r: r => <StatusBadge status={r.status} priority={r.priority} /> },
    { k: 'nextFollowupAt', h: 'Follow-up', r: r => <FollowupDate value={r.nextFollowupAt} onOpen={() => setForm({ kind: 'followup', dealer: dealerOf(r), focusDate: true })} /> },
    { k: 'promise', h: 'Promise', r: r => r.promise?.amount ? `${money(r.promise.amount)} by ${fmtDate(r.promise.date)}` : '—' },
    { k: 'act', h: '', r: actions },
  ];
  const promCols = [
    { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /> },
    ...months, { k: 'balanceTotal', h: 'Outstanding', align: 'right', r: r => <b>{money(r.balanceTotal)}</b> },
    { k: 'amount', h: 'Promised', align: 'right', r: r => money(r.amount) },
    { k: 'received', h: 'Received', align: 'right', r: r => money(r.received) },
    { k: 'promiseDate', h: 'By', r: r => fmtDate(r.promiseDate) },
    { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> },
    ...(isStaff ? [{ k: 'employeeId', h: 'Employee', r: r => userName(users, r.employeeId) }] : []),
    { k: 'act', h: '', r: actions },
  ];
  const Section = ({ t, n, children, tone }) => <Card title={<span>{t} <span className="chip" style={{ marginLeft: 6, color: tone }}>{num(n)}</span></span>} style={{ marginBottom: 12 }}>{children}</Card>;
  return (
    <div>
      <PageHead icon={CalendarCheck} tone="var(--yel)" title="Today's work" sub={fmtDate(d.today) + (isStaff ? (emp ? ' · ' + userName(users, emp) : ' · everyone in scope') : '')} right={<>
        {isStaff && <select className="sel" value={emp} onChange={e => setEmp(e.target.value)}><option value="">Everyone</option>{(users || []).filter(u => u.role === 'salesman').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
        <button className="btn" data-tip="Record a call or visit" onClick={() => setForm({ kind: 'followup' })}><NotebookPen size={12} /> Follow-up</button>
        <button className="btn" data-tip="Record money received" onClick={() => setForm({ kind: 'payment' })}><Banknote size={12} /> Payment</button>

      </>} />
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Follow-ups</div><div style={{ fontSize: 19, fontWeight: 800 }}>{num(d.followupsDue.length)} <span style={{ fontSize: 12, color: 'var(--red)' }}>{d.followupsOverdue.length ? `+${d.followupsOverdue.length} overdue` : ''}</span></div></div>
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Promises today</div><div style={{ fontSize: 19, fontWeight: 800 }}>{money(d.promisesToday.reduce((s, p) => s + (p.amount - (p.received || 0)), 0))}</div></div>
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Broken promises</div><div style={{ fontSize: 19, fontWeight: 800, color: d.promisesBroken.length ? 'var(--red)' : undefined }}>{num(d.promisesBroken.length)}</div></div>
      </div>
      <Section t="Follow-ups due today" n={d.followupsDue.length}><Table dense cols={balCols} rows={d.followupsDue} keyOf={r => r.dealerId} empty="No follow-ups scheduled for today." card={balCard} onRow={r => openDealer(r.dealerId)} /></Section>
      {d.followupsOverdue.length > 0 && <Section t="Overdue follow-ups" n={d.followupsOverdue.length} tone="var(--red)"><Table dense cols={balCols} rows={d.followupsOverdue} keyOf={r => r.dealerId} card={balCard} onRow={r => openDealer(r.dealerId)} /></Section>}
      <Section t="Promises due today" n={d.promisesToday.length}><Table dense cols={promCols} rows={d.promisesToday} empty="No promises fall due today." card={promCard} onRow={r => openRecord('promise', r, reload)} /></Section>
      {d.promisesBroken.length > 0 && <Section t="Broken promises" n={d.promisesBroken.length} tone="var(--red)"><Table dense cols={promCols} rows={d.promisesBroken} card={promCard} onRow={r => openRecord('promise', r, reload)} /></Section>}
      <Section t="High-priority dealers" n={d.highPriority.length}><Table dense cols={balCols} rows={d.highPriority} keyOf={r => r.dealerId} empty="Nobody is flagged high priority." card={balCard} onRow={r => openDealer(r.dealerId)} /></Section>
      {form?.kind === 'followup' && <FollowupForm dealer={form.dealer} focusDate={form.focusDate} onClose={() => setForm(null)} onDone={reload} />}
      {form?.kind === 'payment' && <PaymentForm dealer={form.dealer} onClose={() => setForm(null)} onDone={reload} />}
      {form?.kind === 'task' && <TaskForm dealer={form.dealer} onClose={() => setForm(null)} onDone={reload} />}
      {form?.kind === 'wa' && <WhatsAppForm dealer={form.dealer} onClose={() => setForm(null)} onDone={reload} />}
      {done && <CompleteTask task={done} onClose={() => setDone(null)} onDone={reload} />}
    </div>);
}

export function CompleteTask({ task, onClose, onDone }) {
  const [comment, setComment] = useState(''); const [amount, setAmount] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const isCollection = /COLLECTION/.test(task.type);
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal" style={{ maxWidth: 440 }}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Complete task {task.taskNo}</div>
      <div className="field"><label>Comment</label><textarea className="inp" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="What happened" /></div>
      {isCollection && <div className="field"><label>Amount collected (₹)</label><input type="number" className="inp" value={amount} onChange={e => setAmount(e.target.value)} /><div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Decides whether it counts as a high-value collection. Record the payment itself separately.</div></div>}
      <ErrorBox err={err} />
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}><button className="btn" onClick={onClose}>Cancel</button>
        <button className="btnp" disabled={busy} onClick={async () => { setBusy(true); setErr(''); try { await col.completeTask(task._id, { comment, amount: Number(amount) || 0 }); onDone?.(); onClose(); } catch (e) { setErr(e.message); } finally { setBusy(false); } }}>Mark done</button></div>
    </div></div>);
}
