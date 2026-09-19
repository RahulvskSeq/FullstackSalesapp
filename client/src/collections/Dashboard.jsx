import { Gauge } from 'lucide-react';
import React, { useState } from 'react';
import ApprovalsModal from './Approvals';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { col } from './api';
import { useLoad, PageHead, Card, Tile, Table, Badge, Busy, ErrorBox, money, num, fmtDate, DealerLink, userName, useDealerCtx, CardRow, monthCols, MonthKVs } from './ui';

const AGE_COLOURS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#991b1b'];

export default function Dashboard({ go }) {
  const [pending, setPending] = useState(false);
  const { data, busy, err, reload } = useLoad(() => col.dashboard(), []);
  const { users, isStaff, open: openDealer, openRow } = useDealerCtx();
  if (busy && !data) return <Busy />;
  if (err) return <ErrorBox err={err} onRetry={reload} />;
  const t = data.tiles;
  const ageData = (data.aging || []).map(b => ({ name: b.label, value: b.total, dealers: b.dealers }));
  return (
    <div>
      <PageHead icon={Gauge} tone="var(--acc)" title={isStaff ? "Collection dashboard" : "My dashboard"} sub={`As of ${fmtDate(data.today)} · outstanding = latest statement · collected = what statements showed coming in`} right={<button className="btn" data-tip="Reload the figures" onClick={reload}>Refresh</button>} />
      <div className="stat-grid">
        <Tile label="Total outstanding" value={money(t.totalOutstanding)} sub={`${num(t.owingDealers)} dealers owing`} tone="var(--acc)" onClick={() => go('colOutstanding')} />
        <Tile label="Overdue" value={money(t.overdueOutstanding)} sub={`${num(t.overdueDealers)} dealers past their credit days`} tone="var(--red)" onClick={() => go('colOutstanding', { overdue: '1' })} />
        <Tile label="Recorded today" value={money(t.recordedToday)} sub={`${num(t.recordedTodayCount)} entries by salesmen · counted once a statement shows them`} tone="#f59e0b" onClick={() => setPending('today')} />
        <Tile label={`Collected · ${fmtDate(t.latestCollectedDate)}`} value={money(t.latestCollected)} sub={`${num(t.latestCollectedCount)} payments · shown by the statement of ${fmtDate(t.latestStatementDate)}`} tone="var(--grn)" onClick={() => go('colPayments', { from: t.latestCollectedDate, to: t.latestCollectedDate, status: 'CONFIRMED' })} />
        <Tile label="Collected this month" value={money(t.monthCollection)} sub={`${num(t.monthPayments)} payments came`} tone="var(--grn)" onClick={() => go('colPayments', { from: data.today.slice(0, 7) + '-01', to: data.today, status: 'CONFIRMED' })} />
        <Tile label="Follow-ups due today" value={num(t.followupsToday)} sub={`${num(t.followupsOverdue)} overdue`} tone="var(--yel)" onClick={() => go('colToday')} />
        <Tile label="Promises due today" value={money(t.promisesToday)} sub={`${num(t.promisesTodayCount)} promises`} tone="var(--pur)" onClick={() => go('colFollowups', { tab: 'promises' })} />
        <Tile label="Broken promises" value={money(t.brokenPromises)} sub={`${num(t.brokenPromisesCount)} still unpaid`} tone="var(--red)" onClick={() => go('colFollowups', { tab: 'promises', status: 'BROKEN' })} />
        <Tile label="Pending approval" value={money(t.pendingPayments)} sub={`${num(t.pendingPaymentsCount)} entries told by salesmen · cleared by the next statement`} tone={t.pendingPaymentsCount ? '#f59e0b' : 'var(--t3)'} onClick={() => setPending(true)} />
      </div>

      <div className="col-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: 12, marginBottom: 12 }}>
        <Card title="Ageing">
          {ageData.some(a => a.value > 0) ? (
            <div className="col-2" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 10, alignItems: 'center' }}>
              <ResponsiveContainer width="100%" height={170}><PieChart><Pie data={ageData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>{ageData.map((_, i) => <Cell key={i} fill={AGE_COLOURS[i % AGE_COLOURS.length]} />)}</Pie><Tooltip formatter={v => money(v)} /></PieChart></ResponsiveContainer>
              <table style={{ fontSize: 12, width: '100%' }}><tbody>{ageData.map((a, i) => <tr key={a.name}><td><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: AGE_COLOURS[i % AGE_COLOURS.length], marginRight: 6 }} />{a.name} days</td><td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(a.value)}</td><td style={{ textAlign: 'right', color: 'var(--t3)' }}>{num(a.dealers)}</td></tr>)}</tbody></table>
            </div>) : <div style={{ color: 'var(--t3)', fontSize: 12.5, padding: 12 }}>No ageing yet. Ageing needs a month-wise statement (bills raised per month); the migrated sheet carried running balances only.</div>}
        </Card>
        <Card title="Outstanding trend (per statement)">
          {data.trend?.length ? <ResponsiveContainer width="100%" height={170}><LineChart data={data.trend}><CartesianGrid stroke="var(--b1)" strokeDasharray="3 3" /><XAxis dataKey="asOn" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1e7 ? (v / 1e7).toFixed(1) + 'Cr' : (v / 1e5).toFixed(0) + 'L'} width={38} /><Tooltip formatter={v => money(v)} /><Line type="monotone" dataKey="total" stroke="var(--acc)" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer>
            : <div style={{ color: 'var(--t3)', fontSize: 12.5, padding: 12 }}>No statements applied yet.</div>}
        </Card>
      </div>

      <div className="col-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12, marginBottom: 12 }}>
        <Card title="High-priority dealers" right={<button className="btn" style={{ fontSize: 11 }} onClick={() => go('colOutstanding', { priority: 'HIGH,CRITICAL' })}>See all</button>}>
          <Table dense cols={[
            { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /> },
            ...monthCols(data.highPriority), { k: 'total', h: 'Total', align: 'right', r: r => <b>{money(r.total)}</b> },
            { k: 'ageDays', h: 'Age', align: 'right', r: r => r.ageDays == null ? '—' : r.ageDays + 'd' },
            { k: 'priority', h: 'Priority', r: r => <Badge v={r.priority} /> },
            { k: 'salesmanName', h: 'Salesman' },
          ]} rows={data.highPriority} keyOf={r => r.dealerId} empty="No high-priority dealers." onRow={r => openRow(r)}
          card={r => <><CardRow><DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /><Badge v={r.priority} /></CardRow><div style={{ fontSize: 11, color: 'var(--t2)' }}>{r.salesmanName}{r.ageDays != null ? ` · ${r.ageDays}d` : ''}</div><MonthKVs row={r} rows={data.highPriority} /></>} />
        </Card>
        <Card title="By salesman">
          <Table dense cols={[
            { k: 'name', h: 'Salesman' },
            { k: 'dealers', h: 'Dealers', align: 'right', r: r => num(r.dealers) },
            { k: 'total', h: 'Outstanding', align: 'right', r: r => money(r.total) },
            { k: 'overdue', h: 'Overdue', align: 'right', r: r => <span style={{ color: r.overdue ? 'var(--red)' : undefined }}>{money(r.overdue)}</span> },
            { k: 'collectedThisMonth', h: 'Collected (month)', align: 'right', r: r => money(r.collectedThisMonth) },
          ]} rows={data.bySalesman} keyOf={r => r.salesmanId || 'none'} empty="No balances in scope." onRow={r => go('colOutstanding', { salesmanId: r.salesmanId })}
          card={r => <><CardRow><b>{r.name}</b><b>{money(r.total)}</b></CardRow><div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{num(r.dealers)} dealers · overdue {money(r.overdue)} · collected {money(r.collectedThisMonth)}</div></>} />
        </Card>
      </div>

      {pending && <ApprovalsModal mode={pending === 'today' ? 'today' : 'waiting'} onClose={() => setPending(false)} onChanged={reload} />}
      <Card title="Activity — last 30 days">
        <Table dense cols={[
          { k: 'name', h: 'Employee' },
          { k: 'followups', h: 'Follow-ups', align: 'right' }, { k: 'calls', h: 'Calls', align: 'right' }, { k: 'visits', h: 'Visits', align: 'right' },
          { k: 'promisesKept', h: 'Kept', align: 'right' }, { k: 'promisesBroken', h: 'Broken', align: 'right' },
          { k: 'collected', h: 'Collected', align: 'right', r: r => money(r.collected) }, { k: 'points', h: 'Points', align: 'right' },
        ]} rows={data.activity30d} keyOf={r => r.employeeId} empty="No activity recorded in the last 30 days." onRow={() => go('colEmployees')}
        card={r => <><CardRow><b>{r.name}</b><span className="chip">{num(r.points)} pts</span></CardRow><div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{num(r.followups)} follow-ups · {num(r.calls)} calls · {num(r.visits)} visits · collected {money(r.collected)}</div></>} />
      </Card>
    </div>);
}
