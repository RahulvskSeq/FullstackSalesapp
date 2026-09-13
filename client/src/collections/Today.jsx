import React, { useState } from 'react';
import { Phone, IndianRupee, ClipboardList, Check, X, CalendarCheck } from 'lucide-react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Badge, Busy, ErrorBox, money, num, fmtDate, DealerLink, useDealerCtx, userName, title, WhatsAppIcon } from './ui';
import { FollowupForm, PaymentForm, TaskForm, WhatsAppForm } from './forms';

/**
 * "What do I need to do today?" — one call, everything due, with the write
 * actions right on the rows so nothing needs a second screen.
 */
export default function Today() {
  const { users, isStaff, currentUser } = useDealerCtx();
  const [emp, setEmp] = useState('');
  const { data, busy, err, reload } = useLoad(() => col.today(emp ? { employeeId: emp } : {}), [emp]);
  const [form, setForm] = useState(null);   // { kind, dealer }
  const [done, setDone] = useState(null);   // task being completed
  if (busy && !data) return <Busy />;
  if (err) return <ErrorBox err={err} onRetry={reload} />;
  const d = data;
  const dealerOf = r => ({ id: String(r.dealerId), name: r.dealerName || r.dealer?.name || '', code: r.dealerCode || r.dealer?.code || '' });
  const actions = r => <div className="row" style={{ gap: 4 }}>
    <button className="btn" title="Record follow-up" style={{ padding: '3px 7px' }} onClick={e => { e.stopPropagation(); setForm({ kind: 'followup', dealer: dealerOf(r) }); }}><Phone size={12} /></button>
    <button className="btn" title="Record payment" style={{ padding: '3px 7px' }} onClick={e => { e.stopPropagation(); setForm({ kind: 'payment', dealer: dealerOf(r) }); }}><IndianRupee size={12} /></button>
    <button className="btn" title="WhatsApp" style={{ padding: '3px 7px', color: '#25D366' }} onClick={e => { e.stopPropagation(); setForm({ kind: 'wa', dealer: dealerOf(r) }); }}><WhatsAppIcon size={13} /></button>
  </div>;
  const taskCols = [
    { k: 'taskNo', h: '#', r: r => <span className="chip">{r.taskNo}</span> },
    { k: 'type', h: 'Task', r: r => <span><Badge v={r.priority} /> <b style={{ marginLeft: 6 }}>{title(r.type)}</b>{r.description ? <div style={{ fontSize: 11.5, color: 'var(--t2)', whiteSpace: 'normal' }}>{r.description}</div> : null}</span>, wrap: true },
    { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /> },
    { k: 'dueDate', h: 'Due', r: r => <span style={{ color: r.dueDate < d.today ? 'var(--red)' : undefined }}>{fmtDate(r.dueDate)}{r.dueTime ? ' ' + r.dueTime : ''}</span> },
    ...(isStaff ? [{ k: 'employeeId', h: 'Assigned', r: r => userName(users, r.employeeId) }] : []),
    { k: 'points', h: 'Pts', align: 'right' },
    { k: 'act', h: '', r: r => <div className="row" style={{ gap: 4 }}>
        <button className="btnp" style={{ padding: '3px 8px', fontSize: 11 }} onClick={e => { e.stopPropagation(); setDone(r); }}><Check size={12} /> Done</button>
        <button className="btn" style={{ padding: '3px 7px' }} title="Cancel task" onClick={async e => { e.stopPropagation(); const reason = window.prompt('Reason for cancelling?'); if (reason === null) return; await col.cancelTask(r._id, reason).catch(x => alert(x.message)); reload(); }}><X size={12} /></button>
      </div> },
  ];
  const balCols = [
    { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /> },
    { k: 'total', h: 'Outstanding', align: 'right', r: r => money(r.total) },
    { k: 'ageDays', h: 'Age', align: 'right', r: r => r.ageDays == null ? '—' : r.ageDays + 'd' },
    { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> },
    { k: 'nextFollowupAt', h: 'Follow-up', r: r => fmtDate(r.nextFollowupAt) },
    { k: 'promise', h: 'Promise', r: r => r.promise?.amount ? `${money(r.promise.amount)} by ${fmtDate(r.promise.date)}` : '—' },
    { k: 'act', h: '', r: actions },
  ];
  const promCols = [
    { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /> },
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
        <button className="btn" onClick={() => setForm({ kind: 'followup' })}><Phone size={12} /> Follow-up</button>
        <button className="btn" onClick={() => setForm({ kind: 'payment' })}><IndianRupee size={12} /> Payment</button>
        <button className="btnp" onClick={() => setForm({ kind: 'task' })}><ClipboardList size={12} /> Task</button>
      </>} />
      <div className="stat-grid">
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Tasks</div><div style={{ fontSize: 19, fontWeight: 800 }}>{num(d.tasksToday.length)} <span style={{ fontSize: 12, color: 'var(--red)' }}>{d.tasksOverdue.length ? `+${d.tasksOverdue.length} overdue` : ''}</span></div></div>
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Follow-ups</div><div style={{ fontSize: 19, fontWeight: 800 }}>{num(d.followupsDue.length)} <span style={{ fontSize: 12, color: 'var(--red)' }}>{d.followupsOverdue.length ? `+${d.followupsOverdue.length} overdue` : ''}</span></div></div>
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Promises today</div><div style={{ fontSize: 19, fontWeight: 800 }}>{money(d.promisesToday.reduce((s, p) => s + (p.amount - (p.received || 0)), 0))}</div></div>
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Broken promises</div><div style={{ fontSize: 19, fontWeight: 800, color: d.promisesBroken.length ? 'var(--red)' : undefined }}>{num(d.promisesBroken.length)}</div></div>
      </div>
      <Section t="Tasks due today" n={d.tasksToday.length}><Table dense cols={taskCols} rows={d.tasksToday} empty="No tasks due today." /></Section>
      {d.tasksOverdue.length > 0 && <Section t="Overdue tasks" n={d.tasksOverdue.length} tone="var(--red)"><Table dense cols={taskCols} rows={d.tasksOverdue} /></Section>}
      <Section t="Follow-ups due today" n={d.followupsDue.length}><Table dense cols={balCols} rows={d.followupsDue} keyOf={r => r.dealerId} empty="No follow-ups scheduled for today." /></Section>
      {d.followupsOverdue.length > 0 && <Section t="Overdue follow-ups" n={d.followupsOverdue.length} tone="var(--red)"><Table dense cols={balCols} rows={d.followupsOverdue} keyOf={r => r.dealerId} /></Section>}
      <Section t="Promises due today" n={d.promisesToday.length}><Table dense cols={promCols} rows={d.promisesToday} empty="No promises fall due today." /></Section>
      {d.promisesBroken.length > 0 && <Section t="Broken promises" n={d.promisesBroken.length} tone="var(--red)"><Table dense cols={promCols} rows={d.promisesBroken} /></Section>}
      <Section t="High-priority dealers" n={d.highPriority.length}><Table dense cols={balCols} rows={d.highPriority} keyOf={r => r.dealerId} empty="Nobody is flagged high priority." /></Section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <Card title="Payments confirmed (7 days)"><Table dense cols={[{ k: 'date', h: 'Date', r: r => fmtDate(r.date) }, { k: 'paymentNo', h: '#' }, { k: 'amount', h: 'Amount', align: 'right', r: r => money(r.amount) }, { k: 'mode', h: 'Mode' }]} rows={d.recentPayments} empty="None." /></Card>
        <Card title="New outstanding (7 days)"><Table dense cols={[{ k: 'at', h: 'When', r: r => fmtDate(r.at) }, { k: 'type', h: 'Event', r: r => <Badge v={r.type === 'NEW_OUTSTANDING' ? 'NEW' : r.type} /> }, { k: 'amount', h: 'Amount', align: 'right', r: r => money(r.amount) }]} rows={d.newOutstanding} empty="None." /></Card>
        <Card title="Cleared (7 days)"><Table dense cols={[{ k: 'at', h: 'When', r: r => fmtDate(r.at) }, { k: 'amount', h: 'Was', align: 'right', r: r => money(r.amount) }, { k: 'note', h: 'Note' }]} rows={d.recentlyCleared} empty="None." /></Card>
      </div>
      {form?.kind === 'followup' && <FollowupForm dealer={form.dealer} onClose={() => setForm(null)} onDone={reload} />}
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
