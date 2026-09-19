import React, { useState } from 'react';
import { ClipboardList, Check, X, CalendarCheck, NotebookPen, Banknote } from 'lucide-react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Badge, Busy, ErrorBox, money, num, fmtDate, periodLabel, DealerLink, useDealerCtx, userName, title, WhatsAppIcon, StatusBadge, CallButton, CardRow, KV, monthCols, MonthKVs, FollowupDate, PendingChip, Modal } from './ui';
import { FollowupForm, PaymentForm, TaskForm, WhatsAppForm } from './forms';
import ApprovalsModal from './Approvals';

/**
 * "What do I need to do today?" — one call, everything due, with the write
 * actions right on the rows so nothing needs a second screen.
 */
export default function Today() {
  const { users, isStaff, currentUser, openRecord, open: openDealer, openRow, openPending } = useDealerCtx();
  // amber (money told, not yet in a statement) opens the Pending list; a plain promise opens its record
  /** What came in: the last payment and the 30-day total, from the statements. Works for balance rows and task/promise rows (bal* fields). */
  const Came = ({ r }) => {
    const amt = r.lastPaymentAmount ?? r.balLastPaymentAmount, at = r.lastPaymentAt ?? r.balLastPaymentAt, c30 = r.came30 || 0;
    if (!amt && !c30) return <span style={{ color: 'var(--t3)' }}>—</span>;
    return <span data-tip={c30 ? `${money(c30)} came in the last 30 days (${r.came30Count} payment${r.came30Count === 1 ? '' : 's'}) — click the dealer for the list` : 'last payment seen in a statement'} style={{ color: 'var(--grn)', fontWeight: 700, whiteSpace: 'nowrap' }}>{amt ? `${money(amt)} · ${fmtDate(at)}` : ''}{c30 && c30 !== amt ? <span style={{ fontWeight: 500, color: 'var(--t2)' }}>{amt ? ' · ' : ''}{money(c30)} in 30d</span> : null}</span>;
  };
  const openProm = r => (r?.pendingRecorded > 0 || r?.pendingApproval > 0) ? openPending(String(r.dealerId)) : openRecord('promise', r, reload);
  const [emp, setEmp] = useState('');
  const { data, busy, err, reload } = useLoad(() => col.today(emp ? { employeeId: emp } : {}), [emp]);
  const [form, setForm] = useState(null);   // { kind, dealer }
  const [tileModal, setTileModal] = useState(null);   // 'followups' | 'promises' | 'broken'
  const [mq, setMq] = useState('');
  const byName = rows => mq.trim() ? rows.filter(r => (r.dealerName || '').toLowerCase().includes(mq.trim().toLowerCase())) : rows;
  const searchBox = <input className="inp" value={mq} onChange={e => setMq(e.target.value)} placeholder="Search dealer name…" style={{ marginBottom: 10 }} autoFocus />;
  const [pending, setPending] = useState(false);
  // Today's work is about the collection month: only dealers who still owe
  // it are listed. The switch shows everyone with a follow-up or promise.
  const [onlyDue, setOnlyDue] = useState(() => { try { return localStorage.getItem('col_today_onlyDue') !== '0'; } catch { return true; } });
  const toggleOnlyDue = () => setOnlyDue(v => { try { localStorage.setItem('col_today_onlyDue', v ? '0' : '1'); } catch {} return !v; });
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
    <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{r.ageDays != null ? `${r.ageDays} days${r.oldestPeriod ? ' · oldest ' + periodLabel(r.oldestPeriod) : ''} · ` : ''}<FollowupDate value={r.nextFollowupAt} prefix="follow-up " onOpen={() => setForm({ kind: 'followup', dealer: dealerOf(r), focusDate: true })} /></div>
    {(r.lastPaymentAmount || r.came30) ? <div style={{ fontSize: 11.5 }}><Came r={r} /></div> : null}
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
  const allRows = [...d.tasksToday, ...d.tasksOverdue, ...d.followupsDue, ...d.followupsOverdue, ...d.promisesToday, ...d.promisesBroken, ...(d.overdue || []), ...d.highPriority];
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
    { k: 'ageDays', h: 'Age', align: 'right', r: r => r.ageDays == null ? '—' : <span data-tip={r.oldestPeriod ? `oldest unpaid month ${periodLabel(r.oldestPeriod)}${r.creditDays ? ` · credit ${r.creditDays} days` : ''}` : undefined} style={{ color: (r.overdue ?? r.balOverdue) ? 'var(--red)' : undefined }}>{r.ageDays + 'd'}</span> },
    { k: 'status', h: 'Status', r: r => <span className="row" style={{ gap: 4 }}><StatusBadge status={r.status} priority={r.priority} />{(r.overdue ?? r.balOverdue) && r.status !== 'OVERDUE' ? <Badge v="OVERDUE" label={`due · ${periodLabel(d.collectionMonth)}`} /> : null}</span> },
    { k: 'came', h: 'Came', align: 'right', r: r => <Came r={r} /> },
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
  // Sections stay separate, but a dealer appears in ONE of them only — the
  // first that applies: promise due today, follow-up due today, broken
  // promise, overdue follow-up, high priority. That decides WHICH section a
  // dealer sits in; the order the sections are drawn in is a separate choice
  // below. The tiles count these same deduped lists, so a tile never says 16
  // over a section of 5.
  const seen = new Set();
  const owesDue = r => !!(r.overdue ?? r.balOverdue);
  const once = rows => rows.filter(r => { const k = String(r.dealerId); if (seen.has(k) || (r.balanceTotal ?? r.total ?? 1) <= 0) return false; if (onlyDue && !owesDue(r)) return false; seen.add(k); return true; });
  const promisesToday = once(d.promisesToday), followupsDue = once(d.followupsDue), promisesBroken = once(d.promisesBroken), followupsOverdue = once(d.followupsOverdue), overdue = once(d.overdue || []), highPriority = once(d.highPriority);
  const promisesTodayDue = promisesToday.reduce((s, p) => s + (p.amount - (p.received || 0)), 0);
  // each section wears its own colour so the eye finds it without reading
  const Section = ({ t, n, sub, children, tone = 'var(--t3)', bg = 'transparent' }) => (
    <Card title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ width: 8, height: 8, borderRadius: 4, background: tone, display: 'inline-block' }} />{t} <span className="chip" style={{ color: tone, fontWeight: 800, borderColor: tone }}>{num(n)}</span>{sub && <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--t3)' }}>{sub}</span>}</span>}
      style={{ marginBottom: 12, borderLeft: `4px solid ${tone}`, background: bg }}>{children}</Card>
  );
  return (
    <div>
      <PageHead icon={CalendarCheck} tone="var(--yel)" title="Today's work" sub={fmtDate(d.today) + (isStaff ? (emp ? ' · ' + userName(users, emp) : ' · everyone in scope') : '') + (d.collectionMonth ? ` · collecting ${periodLabel(d.collectionMonth)}` : '')} right={<>
        <label className="row" style={{ fontSize: 12, gap: 5, cursor: 'pointer', color: onlyDue ? 'var(--red)' : 'var(--t2)' }} data-tip={`On: only dealers who still owe ${periodLabel(d.collectionMonth)}. Off: everyone with a follow-up, promise or flag.`}><input type="checkbox" checked={onlyDue} onChange={toggleOnlyDue} /> only {periodLabel(d.collectionMonth) || 'due'} pending</label>
        {isStaff && <select className="sel" value={emp} onChange={e => setEmp(e.target.value)}><option value="">Everyone</option>{(users || []).filter(u => u.role === 'salesman').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
        <button className="btn" data-tip="Record a call or visit" onClick={() => setForm({ kind: 'followup' })}><NotebookPen size={12} /> Follow-up</button>
        <button className="btn" data-tip="Record money received" onClick={() => setForm({ kind: 'payment' })}><Banknote size={12} /> Payment</button>

      </>} />
      {d.pendingRecorded > 0 && <div className="row" style={{ gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.4)', marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13 }}><b>{num(d.pendingRecorded)}</b> payment{d.pendingRecorded === 1 ? '' : 's'} told by salesmen — pending until a statement shows the money</span>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btnp" onClick={() => setPending(true)} data-tip="Told / came / still to come, for each entry">Pending approval ({num(d.pendingRecorded)})</button>
      </div>}
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card" onClick={() => setTileModal('followups')} data-tip="Open all follow-ups due and overdue" style={{ cursor: 'pointer' }}><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Follow-ups</div><div style={{ fontSize: 19, fontWeight: 800 }}>{num(followupsDue.length)} <span style={{ fontSize: 12, color: 'var(--red)' }}>{followupsOverdue.length ? `+${followupsOverdue.length} overdue` : ''}</span></div></div>
        <div className="stat-card" onClick={() => setTileModal('promises')} data-tip="Open every promise falling due today" style={{ cursor: 'pointer' }}><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Promises today</div><div style={{ fontSize: 19, fontWeight: 800 }}>{money(promisesTodayDue)} <span style={{ fontSize: 12, color: 'var(--t3)' }}>{promisesToday.length ? `· ${num(promisesToday.length)}` : ''}</span></div></div>
        <div className="stat-card" onClick={() => setTileModal('broken')} data-tip="Open every broken promise" style={{ cursor: 'pointer' }}><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Broken promises</div><div style={{ fontSize: 19, fontWeight: 800, color: promisesBroken.length ? 'var(--red)' : undefined }}>{num(promisesBroken.length)}</div></div>
      </div>
      <Section t="Follow-ups due today" n={followupsDue.length} tone="var(--acc)" bg="rgba(99,102,241,.04)"><Table dense cols={balCols} rows={followupsDue} keyOf={r => r.dealerId} empty="No follow-ups scheduled for today." card={balCard} onRow={r => openRow(r)} /></Section>
      <Section t="Overdue follow-ups" n={followupsOverdue.length} tone="var(--red)" bg="rgba(220,38,38,.04)"><Table dense cols={balCols} rows={followupsOverdue} keyOf={r => r.dealerId} empty="Nothing overdue." card={balCard} onRow={r => openRow(r)} /></Section>
      <Section t="Promises due today" n={promisesToday.length} tone="#b45309" bg="rgba(245,158,11,.05)"><Table dense cols={promCols} rows={promisesToday} empty="No promises fall due today." card={promCard} onRow={openProm} /></Section>
      <Section t="Broken promises" n={promisesBroken.length} tone="var(--red)" bg="rgba(220,38,38,.04)"><Table dense cols={promCols} rows={promisesBroken} empty="No broken promises." card={promCard} onRow={openProm} /></Section>
      <Section t={`Due for collection · ${periodLabel(d.collectionMonth) || 'no statement'} · ${money(overdue.reduce((a, r) => a + (r.dueAmount || r.balDueAmount || 0), 0))}`} n={overdue.length} tone="var(--red)" bg="rgba(220,38,38,.04)" sub={`${periodLabel(d.collectionMonth)} column still pending in the latest statement · a dealer drops off the moment that month is cleared`}><Table dense cols={balCols} rows={overdue} keyOf={r => r.dealerId} empty={`Nobody has ${periodLabel(d.collectionMonth)} pending.`} card={balCard} onRow={r => openRow(r)} /></Section>
      <Section t="High-priority dealers" n={highPriority.length} tone="var(--t3)"><Table dense cols={balCols} rows={highPriority} keyOf={r => r.dealerId} empty="Nobody else is flagged high priority." card={balCard} onRow={r => openRow(r)} /></Section>
      {pending && <ApprovalsModal onClose={() => setPending(false)} onChanged={reload} />}
      {tileModal === 'followups' && <Modal title={<span>Follow-ups <span className="chip">{num(d.followupsDue.length)} today · {num(d.followupsOverdue.length)} overdue</span></span>} onClose={() => { setTileModal(null); setMq(''); }} width={960}>
        {searchBox}
        <div style={{ fontSize: 12.5, fontWeight: 700, margin: '2px 0 6px' }}>Due today</div>
        <Table dense cols={balCols} rows={byName(d.followupsDue)} keyOf={r => r.dealerId} empty="None due today." card={balCard} onRow={r => openRow(r)} />
        <div style={{ fontSize: 12.5, fontWeight: 700, margin: '14px 0 6px', color: 'var(--red)' }}>Overdue</div>
        <Table dense cols={balCols} rows={byName(d.followupsOverdue)} keyOf={r => r.dealerId} empty="Nothing overdue." card={balCard} onRow={r => openRow(r)} />
      </Modal>}
      {tileModal === 'promises' && <Modal title={<span>Promises due today <span className="chip">{num(d.promisesToday.length)} · {money(d.promisesToday.reduce((s, p) => s + (p.amount - (p.received || 0)), 0))}</span></span>} onClose={() => { setTileModal(null); setMq(''); }} width={960}>
        {searchBox}
        <Table dense cols={promCols} rows={byName(d.promisesToday)} empty="No promises fall due today." card={promCard} onRow={openProm} />
      </Modal>}
      {tileModal === 'broken' && <Modal title={<span>Broken promises <span className="chip">{num(d.promisesBroken.length)} · {money(d.promisesBroken.reduce((s, p) => s + (p.amount - (p.received || 0)), 0))}</span></span>} onClose={() => { setTileModal(null); setMq(''); }} width={960}>
        {searchBox}
        <Table dense cols={promCols} rows={byName(d.promisesBroken)} empty="No broken promises." card={promCard} onRow={openProm} />
      </Modal>}
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
