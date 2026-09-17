import React, { useState } from 'react';
import { PhoneCall, NotebookPen } from 'lucide-react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Pager, Badge, Tabs, Busy, ErrorBox, money, num, fmtDate, DealerLink, userName, useDealerCtx, title, CardRow, KV, monthCols, MonthKVs } from './ui';
import { FollowupForm } from './forms';

export default function FollowUps({ params }) {
  const { users, isStaff, openRecord } = useDealerCtx();
  const [tab, setTab] = useState(params?.tab || 'followups');
  const [q, setQ] = useState({ page: 1, limit: 50, employeeId: '', from: '', to: '', status: params?.status || '' });
  const { data, busy, err, reload } = useLoad(() => tab === 'promises' ? col.promises(q) : col.followups(q), [tab, JSON.stringify(q)]);
  const [form, setForm] = useState(false);
  const set = p => setQ(x => ({ ...x, ...p, page: p.page || 1 }));
  return (
    <div>
      <PageHead icon={PhoneCall} tone="var(--pur)" title="Follow-ups & promises" sub="Every conversation with a dealer, and what they said they would pay." right={<button className="btnp" data-tip="Record a call or visit" onClick={() => setForm(true)}><NotebookPen size={12} /> Record follow-up</button>} />
      <Tabs value={tab} onChange={t => { setTab(t); set({ status: '' }); }} tabs={[{ id: 'followups', label: 'Follow-ups' }, { id: 'promises', label: 'Promises' }]} />
      <Card style={{ marginBottom: 12 }}><div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {isStaff && <select className="sel" value={q.employeeId} onChange={e => set({ employeeId: e.target.value })}><option value="">Everyone</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
        {tab === 'followups' && <><input type="date" className="inp" style={{ maxWidth: 160 }} value={q.from} onChange={e => set({ from: e.target.value })} /><span style={{ color: 'var(--t3)' }}>to</span><input type="date" className="inp" style={{ maxWidth: 160 }} value={q.to} onChange={e => set({ to: e.target.value })} /></>}
        {tab === 'promises' && <select className="sel" value={q.status} onChange={e => set({ status: e.target.value })}><option value="">Any status</option>{['PENDING', 'PARTIALLY_FULFILLED', 'FULFILLED', 'BROKEN', 'CANCELLED'].map(s => <option key={s} value={s}>{title(s)}</option>)}<option value="PENDING,PARTIALLY_FULFILLED">Open</option></select>}
      </div></Card>
      <Card pad={false}>
        {err ? <ErrorBox err={err} onRetry={reload} /> : busy && !data ? <Busy kind="table" /> : tab === 'followups' ? <Table cols={[
          { k: 'date', h: 'Date', r: r => fmtDate(r.date) + (r.time ? ' ' + r.time : '') },
          { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName || r.dealer?.name || String(r.dealerId)} code={r.dealerCode || r.dealer?.code} /> },
          ...monthCols(data?.items), { k: 'balanceTotal', h: 'Outstanding', align: 'right', r: r => r.balanceTotal == null ? '—' : <b>{money(r.balanceTotal)}</b> },
          { k: 'channel', h: 'Channel', r: r => title(r.channel) },
          { k: 'outcome', h: 'Outcome', r: r => <Badge v={r.outcome} /> },
          { k: 'discussion', h: 'Discussion', wrap: true, max: 380 },
          { k: 'nextFollowupDate', h: 'Next', r: r => fmtDate(r.nextFollowupDate) },
          { k: 'nextAction', h: 'Next action', max: 200 },
          { k: 'employeeId', h: 'By', r: r => userName(users, r.employeeId) },
        ]} rows={data?.items} empty="No follow-ups in this range." onRow={r => openRecord('followup', r, reload)}
        card={r => <>
          <CardRow><DealerLink id={r.dealerId} name={r.dealerName || r.dealer?.name || String(r.dealerId)} code={r.dealerCode || r.dealer?.code} /><Badge v={r.outcome} /></CardRow>
          <div style={{ fontSize: 11.5, color: 'var(--t2)', margin: '3px 0 6px' }}>{fmtDate(r.date)}{r.time ? ' ' + r.time : ''} · {title(r.channel)} · {userName(users, r.employeeId)}</div>
          {r.balanceTotal != null && <MonthKVs row={r} rows={data?.items} total={r.balanceTotal} />}
          {r.discussion && <div style={{ fontSize: 12.5 }}>{r.discussion}</div>}
          {(r.nextFollowupDate || r.nextAction) && <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 4 }}>Next: {fmtDate(r.nextFollowupDate)}{r.nextAction ? ' — ' + r.nextAction : ''}</div>}
        </>} /> : <Table cols={[
          { k: 'promiseDate', h: 'Promised by', r: r => <span style={{ color: r.status === 'BROKEN' ? 'var(--red)' : undefined }}>{fmtDate(r.promiseDate)}</span> },
          { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName || r.dealer?.name || String(r.dealerId)} code={r.dealerCode || r.dealer?.code} /> },
          ...monthCols(data?.items), { k: 'balanceTotal', h: 'Outstanding', align: 'right', r: r => r.balanceTotal == null ? '—' : <b>{money(r.balanceTotal)}</b> },
          { k: 'amount', h: 'Promised', align: 'right', r: r => <b>{money(r.amount)}</b> },
          { k: 'received', h: 'Received', align: 'right', r: r => money(r.received) },
          { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> },
          { k: 'employeeId', h: 'Employee', r: r => userName(users, r.employeeId) },
          { k: 'notes', h: 'Notes', wrap: true, max: 260 },
          { k: 'act', h: '', r: r => ['PENDING', 'PARTIALLY_FULFILLED'].includes(r.status) ? <button className="btnd" onClick={async e => { e.stopPropagation(); const reason = window.prompt('Why cancel this promise?'); if (reason === null) return; await col.cancelPromise(r._id, reason).catch(x => alert(x.message)); reload(); }}>Cancel</button> : null },
        ]} rows={data?.items} empty="No promises." onRow={r => openRecord('promise', r, reload)}
        card={r => <>
          <CardRow><DealerLink id={r.dealerId} name={r.dealerName || r.dealer?.name || String(r.dealerId)} code={r.dealerCode || r.dealer?.code} /><Badge v={r.status} /></CardRow>
          {r.balanceTotal != null && <MonthKVs row={r} rows={data?.items} total={r.balanceTotal} />}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6, margin: '4px 0' }}>
            <KV k="Promised" v={money(r.amount)} /><KV k="Received" v={money(r.received)} /><KV k="By" v={fmtDate(r.promiseDate)} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{userName(users, r.employeeId)}{r.notes ? ' · ' + r.notes : ''}</div>
          {['PENDING', 'PARTIALLY_FULFILLED'].includes(r.status) && <div style={{ marginTop: 8 }}><button className="btnd" onClick={async e => { e.stopPropagation(); const reason = window.prompt('Why cancel this promise?'); if (reason === null) return; await col.cancelPromise(r._id, reason).catch(x => alert(x.message)); reload(); }}>Cancel promise</button></div>}
        </>} />}
        <div style={{ padding: '0 12px 10px' }}><Pager page={data?.page} limit={data?.limit} total={data?.total} onPage={p => setQ(x => ({ ...x, page: p }))} /></div>
      </Card>
      {form && <FollowupForm onClose={() => setForm(false)} onDone={reload} />}
    </div>);
}
