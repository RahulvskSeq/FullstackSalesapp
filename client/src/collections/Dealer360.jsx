import React, { useState } from 'react';
import { X, ClipboardList, NotebookPen, Banknote } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { col } from './api';
import { useLoad, Card, Table, Badge, Tabs, Busy, ErrorBox, money, num, fmtDate, fmtWhen, periodLabel, title, userName, useDealerCtx, WhatsAppIcon, StatusBadge, CallButton } from './ui';
import { FollowupForm, PaymentForm, TaskForm, WhatsAppForm } from './forms';

/**
 * Dealer 360 — every collection fact about one dealer, in a drawer so it can
 * open from any list without losing the place.
 */
export default function Dealer360({ dealerId, onClose }) {
  const { users, isStaff, openRecord } = useDealerCtx();
  const { data, busy, err, reload } = useLoad(() => col.dealer360(dealerId), [dealerId]);
  const tl = useLoad(() => col.timeline(dealerId, { limit: 100 }), [dealerId]);
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState(null);
  const d = data;
  const dealer = d ? { id: dealerId, name: d.dealer.name, code: d.dealer.code, total: d.balance?.total, phone: d.dealer.phone || '', whatsappOptOut: !!d.dealer.whatsappOptOut } : null;
  const both = () => { reload(); tl.reload(); };
  return (
    <div className="overlay" style={{ justifyContent: 'flex-end', padding: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal col-drawer" style={{ maxWidth: 980, width: '100%', height: '100vh', maxHeight: '100vh', borderRadius: 0, padding: 18, overflowY: 'auto' }}>
        {busy && !d ? <Busy /> : err ? <ErrorBox err={err} onRetry={reload} /> : (<>
          <div className="col-head" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>Dealer 360</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{d.dealer.name} {d.dealer.code && <span className="chip">{d.dealer.code}</span>}</div>
              <div style={{ fontSize: 12, color: 'var(--t2)' }}>{[d.dealer.city, d.dealer.state, d.dealer.zone].filter(Boolean).join(' · ')} · Salesman {d.dealer.salesmanName || '—'} · <ContactInline dealer={dealer} onSaved={reload} />{d.dealer.creditDays ? ` · credit ${d.dealer.creditDays} days` : ''}{d.dealer.creditLimit ? ` · limit ${money(d.dealer.creditLimit)}` : ''}</div>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <CallButton dealer={dealer} label="Call" size={12} onDialed={() => setForm('followup')} />
              <button className="btn" data-tip="Record a call or visit" onClick={() => setForm('followup')}><NotebookPen size={12} /> Follow-up</button>
              <button className="btn" data-tip="Record money received" onClick={() => setForm('payment')}><Banknote size={12} /> Payment</button>
              <button className="btn" data-tip="Create a task for this dealer" onClick={() => setForm('task')}><ClipboardList size={12} /> Task</button>
              <button className="btn" onClick={() => setForm('wa')} disabled={d.dealer.whatsappOptOut} title={d.dealer.whatsappOptOut ? 'Dealer has opted out' : ''}><WhatsAppIcon size={13} /> WhatsApp</button>
              <button className="btn" onClick={onClose} style={{ padding: '4px 7px' }}><X size={14} /></button>
            </div>
          </div>
          <div className="stat-grid">
            <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Outstanding</div><div style={{ fontSize: 19, fontWeight: 800 }}>{money(d.balance?.total)}</div><div style={{ fontSize: 11, color: 'var(--t2)' }}>{d.balance?.lastSnapshotAsOn ? 'statement ' + fmtDate(d.balance.lastSnapshotAsOn) : 'no statement yet'}</div></div>
            <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Status</div><div style={{ marginTop: 5 }}><StatusBadge status={d.balance?.status} priority={d.balance?.priority} /></div><div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 4 }}>{d.balance?.ageDays != null ? `oldest ${periodLabel(d.balance.oldestPeriod)} · ${d.balance.ageDays} days` : ''}</div></div>
            <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Promise</div><div style={{ fontSize: 15, fontWeight: 800 }}>{d.balance?.promise?.amount ? `${money(d.balance.promise.amount)} by ${fmtDate(d.balance.promise.date)}` : '—'}</div><div style={{ fontSize: 11, color: d.balance?.brokenPromises ? 'var(--red)' : 'var(--t2)' }}>{num(d.balance?.brokenPromises || 0)} broken so far</div></div>
            <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Cycles</div><div style={{ fontSize: 19, fontWeight: 800 }}>{num(d.cycles.length)}</div><div style={{ fontSize: 11, color: 'var(--t2)' }}>{d.cycles.filter(c => c.status === 'CLEARED').length} cleared · last payment {fmtDate(d.balance?.lastPaymentAt)}</div></div>
          </div>
          <Tabs value={tab} onChange={setTab} tabs={[{ id: 'overview', label: 'Overview' }, { id: 'timeline', label: 'Timeline', count: tl.data?.items?.length }, { id: 'payments', label: 'Payments', count: d.payments.length }, { id: 'followups', label: 'Follow-ups', count: d.followups.length }, { id: 'promises', label: 'Promises', count: d.promises.length }, { id: 'tasks', label: 'Tasks', count: d.tasks.open.length }, { id: 'invoices', label: 'Invoices', count: d.invoices.length }, { id: 'history', label: 'Statements', count: d.snapshots.length }, { id: 'whatsapp', label: 'WhatsApp', count: d.whatsapp.length }]} />
          {tab === 'overview' && <Overview d={d} />}
          {tab === 'timeline' && (tl.busy ? <Busy /> : <Timeline items={tl.data?.items || []} users={users} />)}
          {tab === 'payments' && <Table dense cols={[{ k: 'date', h: 'Date', r: r => fmtDate(r.date) }, { k: 'paymentNo', h: '#' }, { k: 'amount', h: 'Amount', align: 'right', r: r => money(r.amount) }, { k: 'mode', h: 'Mode' }, { k: 'reference', h: 'Reference' }, { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> }, { k: 'allocated', h: 'Allocated', align: 'right', r: r => money(r.allocated) }, { k: 'enteredBy', h: 'Entered by', r: r => userName(users, r.enteredBy) }, { k: 'remarks', h: 'Remarks', wrap: true }]} rows={d.payments} empty="No payments recorded." onRow={r => openRecord('payment', { ...r, dealerName: d.dealer.name, dealerCode: d.dealer.code }, both)} />}
          {tab === 'followups' && <Table dense cols={[{ k: 'date', h: 'Date', r: r => fmtDate(r.date) + (r.time ? ' ' + r.time : '') }, { k: 'channel', h: 'Channel', r: r => title(r.channel) }, { k: 'outcome', h: 'Outcome', r: r => <Badge v={r.outcome} /> }, { k: 'discussion', h: 'Discussion', wrap: true, max: 360 }, { k: 'customerResponse', h: 'Response', wrap: true, max: 240 }, { k: 'nextFollowupDate', h: 'Next', r: r => fmtDate(r.nextFollowupDate) }, { k: 'employeeId', h: 'By', r: r => userName(users, r.employeeId) }]} rows={d.followups} empty="No follow-ups yet." onRow={r => openRecord('followup', { ...r, dealerName: d.dealer.name, dealerCode: d.dealer.code }, both)} />}
          {tab === 'promises' && <Table dense cols={[{ k: 'promiseDate', h: 'By', r: r => fmtDate(r.promiseDate) }, { k: 'amount', h: 'Promised', align: 'right', r: r => money(r.amount) }, { k: 'received', h: 'Received', align: 'right', r: r => money(r.received) }, { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> }, { k: 'employeeId', h: 'Employee', r: r => userName(users, r.employeeId) }, { k: 'notes', h: 'Notes', wrap: true }, { k: 'act', h: '', r: r => ['PENDING', 'PARTIALLY_FULFILLED'].includes(r.status) ? <button className="btnd" onClick={async () => { const reason = window.prompt('Why cancel this promise?'); if (reason === null) return; await col.cancelPromise(r._id, reason).catch(e => alert(e.message)); both(); }}>Cancel</button> : null }]} rows={d.promises} empty="No promises." onRow={r => openRecord('promise', { ...r, dealerName: d.dealer.name, dealerCode: d.dealer.code }, both)} />}
          {tab === 'tasks' && <>
            <Table dense cols={[{ k: 'taskNo', h: '#' }, { k: 'type', h: 'Task', r: r => title(r.type) }, { k: 'priority', h: 'Priority', r: r => <Badge v={r.priority} /> }, { k: 'dueDate', h: 'Due', r: r => fmtDate(r.dueDate) }, { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> }, { k: 'employeeId', h: 'Assigned', r: r => userName(users, r.employeeId) }, { k: 'description', h: 'Description', wrap: true }]} rows={[...d.tasks.open, ...d.tasks.recent]} empty="No tasks." onRow={r => openRecord('task', { ...r, dealerName: d.dealer.name, dealerCode: d.dealer.code }, both)} /></>}
          {tab === 'invoices' && <Table dense cols={[{ k: 'billRef', h: 'Bill' }, { k: 'billDate', h: 'Date', r: r => fmtDate(r.billDate) }, { k: 'dueDate', h: 'Due', r: r => fmtDate(r.dueDate) }, { k: 'amount', h: 'Amount', align: 'right', r: r => money(r.amount) }, { k: 'pending', h: 'Pending', align: 'right', r: r => money(r.pending) }, { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> }]} rows={d.invoices} empty="No invoice-level data. The party-wise statement carries month totals only; invoices appear once a ledger export is imported." />}
          {tab === 'history' && <History d={d} />}
          {tab === 'whatsapp' && <Table dense cols={[{ k: 'createdAt', h: 'When', r: r => fmtWhen(r.createdAt) }, { k: 'templateKey', h: 'Template' }, { k: 'to', h: 'To' }, { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> }, { k: 'error', h: 'Error', wrap: true }]} rows={d.whatsapp} empty="No messages sent." />}
        </>)}
        {form === 'followup' && <FollowupForm dealer={dealer} onClose={() => setForm(null)} onDone={both} />}
        {form === 'payment' && <PaymentForm dealer={dealer} onClose={() => setForm(null)} onDone={both} />}
        {form === 'task' && <TaskForm dealer={dealer} onClose={() => setForm(null)} onDone={both} />}
        {form === 'wa' && <WhatsAppForm dealer={dealer} onClose={() => setForm(null)} onDone={both} />}
      </div>
    </div>);
}

function Overview({ d }) {
  const b = d.balance;
  const series = [...d.snapshots].reverse().map(s => ({ asOn: s.asOn, total: s.total }));
  return (
    <div className="col-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
      <Card title="Current statement buckets">
        {b?.buckets && Object.keys(b.buckets).length ? <Table dense cols={[{ k: 'p', h: 'Month', r: r => periodLabel(r.p) }, { k: 'v', h: 'Amount', align: 'right', r: r => money(r.v) }]} rows={Object.entries(b.buckets).sort().map(([p, v]) => ({ p, v }))} keyOf={r => r.p} /> : <div style={{ color: 'var(--t3)', fontSize: 12.5 }}>No statement yet.</div>}
        {b && <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 8 }}>Mode: {b.balanceMode} · total is {b.balanceMode === 'buckets' ? 'the sum of the months' : 'the latest month'}.</div>}
      </Card>
      <Card title="Outstanding over statements">
        {series.length > 1 ? <ResponsiveContainer width="100%" height={180}><LineChart data={series}><CartesianGrid stroke="var(--b1)" strokeDasharray="3 3" /><XAxis dataKey="asOn" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} width={44} tickFormatter={v => (v / 1000).toFixed(0) + 'k'} /><Tooltip formatter={v => money(v)} /><Line type="monotone" dataKey="total" stroke="var(--acc)" strokeWidth={2} /></LineChart></ResponsiveContainer> : <div style={{ color: 'var(--t3)', fontSize: 12.5 }}>Needs at least two statements.</div>}
      </Card>
      <Card title="Cycles" style={{ gridColumn: '1 / -1' }}>
        <Table dense cols={[{ k: 'cycleNo', h: '#' }, { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> }, { k: 'openedAt', h: 'Opened', r: r => fmtDate(r.openedAt) }, { k: 'closedAt', h: 'Closed', r: r => fmtDate(r.closedAt) }, { k: 'daysOpen', h: 'Days', align: 'right' }, { k: 'openingTotal', h: 'Opened at', align: 'right', r: r => money(r.openingTotal) }, { k: 'peakTotal', h: 'Peak', align: 'right', r: r => money(r.peakTotal) }, { k: 'paidTotal', h: 'Confirmed payments', align: 'right', r: r => money(r.paidTotal) }, { k: 'observedDecreaseTotal', h: 'Observed decrease', align: 'right', r: r => money(r.observedDecreaseTotal) }]} rows={d.cycles} empty="No cycle has opened." />
      </Card>
    </div>);
}

function History({ d }) {
  const imps = new Map((d.imports || []).map(i => [String(i._id), i]));
  const periods = [...new Set(d.snapshots.flatMap(s => Object.keys(s.buckets || {})))].sort();
  return <Table dense cols={[
    { k: 'asOn', h: 'Statement', r: r => fmtDate(r.asOn) },
    { k: 'file', h: 'File', r: r => imps.get(String(r.importId))?.fileName || r.source, max: 220 },
    { k: 'classification', h: 'Change', r: r => <Badge v={r.classification} /> },
    ...periods.map(p => ({ k: p, h: periodLabel(p), align: 'right', r: r => r.buckets?.[p] ? money(r.buckets[p]) : <span style={{ color: 'var(--t3)' }}>–</span> })),
    { k: 'total', h: 'Total', align: 'right', r: r => <b>{money(r.total)}</b> },
    { k: 'superseded', h: '', r: r => r.superseded ? <span className="chip">superseded</span> : null },
  ]} rows={d.snapshots} empty="No statements." />;
}

const EVENT_TONE = { NEW_OUTSTANDING: 'var(--acc)', INCREASED: '#f97316', DECREASED: 'var(--grn)', CLEARED: 'var(--grn)', REOPENED: 'var(--pur)', PAYMENT_RECORDED: 'var(--yel)', PAYMENT_CONFIRMED: 'var(--grn)', PAYMENT_BOUNCED: 'var(--red)', PROMISE_BROKEN: 'var(--red)', RECONCILIATION_DIFFERENCE: 'var(--yel)' };
export function Timeline({ items, users }) {
  const { openRecord } = useDealerCtx();
  if (!items.length) return <div style={{ color: 'var(--t3)', fontSize: 12.5, padding: 12 }}>Nothing has happened yet.</div>;
  return <div style={{ position: 'relative', paddingLeft: 18 }}>
    <div style={{ position: 'absolute', left: 5, top: 4, bottom: 4, width: 2, background: 'var(--b1)' }} />
    {items.map(e => <div key={e._id} onClick={() => openRecord('event', e)} style={{ position: 'relative', padding: '6px 0 10px', cursor: 'pointer' }}>
      <div style={{ position: 'absolute', left: -17, top: 10, width: 10, height: 10, borderRadius: 5, background: EVENT_TONE[e.type] || 'var(--t3)' }} />
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}><b style={{ fontSize: 12.5 }}>{title(e.type)}</b>{e.amount ? <span style={{ fontSize: 12.5 }}>{money(e.amount)}</span> : null}{e.before != null && e.after != null ? <span style={{ fontSize: 11.5, color: 'var(--t2)' }}>{money(e.before)} → {money(e.after)}</span> : null}{e.cause ? <span className="chip">{e.cause}</span> : null}</div>
      <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{fmtWhen(e.at)} · {e.by === 'import' || e.by === 'automation' || e.by === 'migration' ? e.by : userName(users, e.by)}{e.note ? ' · ' + e.note : ''}</div>
    </div>)}
  </div>;
}

/** Phone number and opt-out, edited in place — there is no separate dealer form for these. */
function ContactInline({ dealer, onSaved }) {
  const [edit, setEdit] = useState(false); const [phone, setPhone] = useState(dealer.phone); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const save = async patch => { setBusy(true); setErr(''); try { await col.setContact(dealer.id, patch); setEdit(false); onSaved?.(); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  if (edit) return <span className="row" style={{ gap: 4, display: 'inline-flex' }}>
    <input className="inp" style={{ width: 150, padding: '2px 8px', fontSize: 12 }} value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" autoFocus onKeyDown={e => { if (e.key === 'Enter') save({ phone }); if (e.key === 'Escape') setEdit(false); }} />
    <button className="btnp" style={{ padding: '2px 8px', fontSize: 11 }} disabled={busy} onClick={() => save({ phone })}>Save</button>
    <button className="btn" style={{ padding: '2px 6px', fontSize: 11 }} onClick={() => setEdit(false)}>×</button>
    {err && <span style={{ color: 'var(--red)', fontSize: 11 }}>{err}</span>}
  </span>;
  return <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
    <a href="#" onClick={e => { e.preventDefault(); setPhone(dealer.phone); setEdit(true); }} style={{ color: dealer.phone ? 'var(--t1)' : 'var(--acc)', textDecoration: 'none', borderBottom: '1px dotted var(--t3)' }}>{dealer.phone ? '+' + dealer.phone : 'add phone'}</a>
    {dealer.phone && <label className="row" style={{ gap: 3, fontSize: 11, color: 'var(--t3)', cursor: 'pointer' }}><input type="checkbox" checked={dealer.whatsappOptOut} onChange={e => save({ whatsappOptOut: e.target.checked })} /> opt-out</label>}
  </span>;
}
