import React, { useState } from 'react';
import { ClipboardList, Check, X, MessageSquare, ClipboardCheck } from 'lucide-react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Pager, Badge, Busy, ErrorBox, num, fmtDate, DealerLink, userName, useDealerCtx, title, today, CardRow, monthCols, MonthKVs } from './ui';
import { TaskForm } from './forms';
import { CompleteTask } from './Today';

export default function Tasks({ params }) {
  const { users, isStaff, openRecord } = useDealerCtx();
  const [q, setQ] = useState({ page: 1, limit: 50, status: params?.status || 'OPEN,IN_PROGRESS', employeeId: '', due: '' });
  const { data, busy, err, reload } = useLoad(() => col.tasks(q), [JSON.stringify(q)]);
  const [form, setForm] = useState(false);
  const [done, setDone] = useState(null);
  const set = p => setQ(x => ({ ...x, ...p, page: p.page || 1 }));
  const points = (data?.items || []).reduce((s, t) => s + (t.status === 'DONE' ? t.points || 0 : 0), 0);
  return (
    <div>
      <PageHead icon={ClipboardCheck} tone="var(--acc)" title={isStaff ? "Team tasks" : "My tasks"} sub="Manual and automatic. Points are earned on completion and feed the monthly review." right={<button className="btnp" data-tip="Create a task for someone" onClick={() => setForm(true)}><ClipboardList size={12} /> New task</button>} />
      <Card style={{ marginBottom: 12 }}><div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <select className="sel" value={q.status} onChange={e => set({ status: e.target.value })}><option value="OPEN,IN_PROGRESS">Open</option><option value="DONE">Done</option><option value="CANCELLED,EXPIRED">Cancelled / expired</option><option value="">All</option></select>
        <select className="sel" value={q.due} onChange={e => set({ due: e.target.value })}><option value="">Any due date</option><option value="today">Due today</option><option value="overdue">Overdue</option></select>
        {isStaff && <select className="sel" value={q.employeeId} onChange={e => set({ employeeId: e.target.value })}><option value="">Everyone</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
        {q.status === 'DONE' && <span className="chip">points on this page: {num(points)}</span>}
      </div></Card>
      <Card pad={false}>
        {err ? <ErrorBox err={err} onRetry={reload} /> : busy && !data ? <Busy /> : <Table cols={[
          { k: 'taskNo', h: '#', r: r => <span className="chip">{r.taskNo}</span> },
          { k: 'type', h: 'Task', r: r => <b>{title(r.type)}</b> },
          { k: 'priority', h: 'Priority', r: r => <Badge v={r.priority} /> },
          { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName || r.dealer?.name || String(r.dealerId)} code={r.dealerCode || r.dealer?.code} /> },
          ...monthCols(data?.items), { k: 'balanceTotal', h: 'Outstanding', align: 'right', r: r => r.balanceTotal == null ? '—' : <b>{money(r.balanceTotal)}</b> },
          { k: 'dueDate', h: 'Due', r: r => <span style={{ color: r.dueDate < today() && ['OPEN', 'IN_PROGRESS'].includes(r.status) ? 'var(--red)' : undefined }}>{fmtDate(r.dueDate)}{r.dueTime ? ' ' + r.dueTime : ''}</span> },
          { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> },
          { k: 'employeeId', h: 'Assigned', r: r => userName(users, r.employeeId) },
          { k: 'source', h: 'Source', r: r => r.source === 'automation' ? <span className="chip" title={r.ruleId}>auto</span> : r.source },
          { k: 'points', h: 'Pts', align: 'right' },
          { k: 'description', h: 'Description', wrap: true, max: 300 },
          { k: 'act', h: '', r: r => ['OPEN', 'IN_PROGRESS'].includes(r.status) ? <div className="row" style={{ gap: 4 }}>
              <button className="btnp" data-tip="Mark this task done" style={{ padding: '3px 8px', fontSize: 11 }} onClick={e => { e.stopPropagation(); setDone(r); }}><Check size={12} /> Done</button>
              <button className="btn" style={{ padding: '3px 7px' }} data-tip="Comment" onClick={async e => { e.stopPropagation(); const text = window.prompt('Comment'); if (!text) return; await col.commentTask(r._id, text).catch(x => alert(x.message)); reload(); }}><MessageSquare size={12} /></button>
              <button className="btn" style={{ padding: '3px 7px' }} data-tip="Cancel" onClick={async e => { e.stopPropagation(); const reason = window.prompt('Reason for cancelling?'); if (reason === null) return; await col.cancelTask(r._id, reason).catch(x => alert(x.message)); reload(); }}><X size={12} /></button>
            </div> : (r.comments?.length ? <span className="chip">{r.comments.length} comments</span> : null) },
        ]} rows={data?.items} empty="No tasks." onRow={r => openRecord('task', r, reload)}
        card={r => <>
          <CardRow><span><Badge v={r.priority} /> <b style={{ marginLeft: 6 }}>{title(r.type)}</b></span><Badge v={r.status} /></CardRow>
          <div style={{ margin: '4px 0' }}><DealerLink id={r.dealerId} name={r.dealerName || r.dealer?.name || String(r.dealerId)} code={r.dealerCode || r.dealer?.code} /></div>
          {r.description && <div style={{ fontSize: 12, color: 'var(--t2)' }}>{r.description}</div>}
          {r.balanceTotal != null && <MonthKVs row={r} rows={data?.items} total={r.balanceTotal} />}
          <div style={{ fontSize: 11.5, color: r.dueDate < today() && ['OPEN', 'IN_PROGRESS'].includes(r.status) ? 'var(--red)' : 'var(--t2)', marginTop: 4 }}>#{r.taskNo} · Due {fmtDate(r.dueDate)}{r.dueTime ? ' ' + r.dueTime : ''} · {userName(users, r.employeeId)} · {r.points} pts{r.source === 'automation' ? ' · auto' : ''}</div>
          {['OPEN', 'IN_PROGRESS'].includes(r.status) && <div className="row" style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <button className="btnp" style={{ padding: '4px 10px', fontSize: 12 }} onClick={e => { e.stopPropagation(); setDone(r); }}><Check size={12} /> Done</button>
            <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={async e => { e.stopPropagation(); const text = window.prompt('Comment'); if (!text) return; await col.commentTask(r._id, text).catch(x => alert(x.message)); reload(); }}><MessageSquare size={12} /> Comment</button>
            <button className="btn" style={{ padding: '4px 8px', fontSize: 12 }} onClick={async e => { e.stopPropagation(); const reason = window.prompt('Reason for cancelling?'); if (reason === null) return; await col.cancelTask(r._id, reason).catch(x => alert(x.message)); reload(); }}><X size={12} /> Cancel</button>
          </div>}
        </>} />}
        <div style={{ padding: '0 12px 10px' }}><Pager page={data?.page} limit={data?.limit} total={data?.total} onPage={p => setQ(x => ({ ...x, page: p }))} /></div>
      </Card>
      {form && <TaskForm onClose={() => setForm(false)} onDone={reload} />}
      {done && <CompleteTask task={done} onClose={() => setDone(null)} onDone={reload} />}
    </div>);
}
