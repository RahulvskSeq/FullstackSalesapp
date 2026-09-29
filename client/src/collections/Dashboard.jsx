import { Gauge, Hourglass, TrendingUp, TriangleAlert, Users, Activity, Wallet, AlarmClock, NotebookPen, CircleCheckBig, CalendarCheck, PhoneCall, Handshake, HeartCrack, Clock } from 'lucide-react';
import React, { useState } from 'react';
import ApprovalsModal from './Approvals';
import { PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { col } from './api';
import { useLoad, PageHead, Card, Tile, Table, Badge, Busy, ErrorBox, money, num, fmtDate, periodLabel, DealerLink, userName, useDealerCtx, CardRow, monthCols, MonthKVs, Pbar, ageTone, AGE_FULL } from './ui';

const AGE_COLOURS = ['#10b981', '#84cc16', '#f59e0b', '#f97316', '#ef4444', '#991b1b'];
/** ₹ in lakh / crore — short enough for a donut centre or an axis. */
const short = v => v >= 1e7 ? '₹' + (v / 1e7).toFixed(1) + 'Cr' : v >= 1e5 ? '₹' + (v / 1e5).toFixed(1) + 'L' : money(v);

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
        <Tile icon={Wallet} label="Total outstanding" value={money(t.totalOutstanding)} sub={`${num(t.owingDealers)} dealers owing`} tone="var(--acc)" onClick={() => go('colOutstanding')} />
        <Tile icon={AlarmClock} label={`Due · ${periodLabel(t.collectionMonth) || 'no statement'}`} value={money(t.overdueOutstanding)} sub={`${num(t.overdueDealers)} dealers still have ${periodLabel(t.collectionMonth)} pending · clears as they pay`} tone="var(--red)" onClick={() => go('colOutstanding', { overdue: '1' })} />
        <Tile icon={NotebookPen} label="Recorded today" value={money(t.recordedToday)} sub={`${num(t.recordedTodayCount)} entries by salesmen · counted once a statement shows them`} tone="#f59e0b" onClick={() => setPending('today')} />
        <Tile icon={CircleCheckBig} label={`Collected · ${fmtDate(t.latestCollectedDate)}`} value={money(t.latestCollected)} sub={`${num(t.latestCollectedCount)} payments · shown by the statement of ${fmtDate(t.latestStatementDate)}`} tone="var(--grn)" onClick={() => go('colPayments', { from: t.latestCollectedDate, to: t.latestCollectedDate, status: 'CONFIRMED' })} />
        <Tile icon={CalendarCheck} label="Collected this month" value={money(t.monthCollection)} sub={`${num(t.monthPayments)} payments came`} tone="var(--grn)" onClick={() => go('colPayments', { from: data.today.slice(0, 7) + '-01', to: data.today, status: 'CONFIRMED' })} />
        <Tile icon={PhoneCall} label="Follow-ups due today" value={num(t.followupsToday)} sub={`${num(t.followupsOverdue)} overdue`} tone="var(--yel)" onClick={() => go('colToday')} />
        <Tile icon={Handshake} label="Promises due today" value={money(t.promisesToday)} sub={`${num(t.promisesTodayCount)} promises`} tone="var(--pur)" onClick={() => go('colFollowups', { tab: 'promises' })} />
        <Tile icon={HeartCrack} label="Broken promises" value={money(t.brokenPromises)} sub={`${num(t.brokenPromisesCount)} still unpaid`} tone="var(--red)" onClick={() => go('colFollowups', { tab: 'promises', status: 'BROKEN' })} />
        <Tile icon={Clock} label="Pending approval" value={money(t.pendingPayments)} sub={`${num(t.pendingPaymentsCount)} entries told by salesmen · cleared by the next statement`} tone={t.pendingPaymentsCount ? '#f59e0b' : 'var(--t3)'} onClick={() => setPending(true)} />
      </div>

      <div className="col-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,1fr)', gap: 12, marginBottom: 12 }}>
        <Card title={<div className="sec-title" style={{ marginBottom: 0 }}><span className="sec-ico" style={{ '--tone': 'var(--red)' }}><Hourglass size={15} /></span> Ageing</div>}>
          {ageData.some(a => a.value > 0) ? (
            <div className="col-2" style={{ display: 'grid', gridTemplateColumns: '196px 1fr', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={190}><PieChart><Pie data={ageData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} cornerRadius={6} stroke="none">{ageData.map((_, i) => <Cell key={i} fill={AGE_COLOURS[i % AGE_COLOURS.length]} />)}</Pie><Tooltip formatter={v => money(v)} /></PieChart></ResponsiveContainer>
                <div className="donut-center" style={{ top: '50%' }}><b style={{ fontSize: 18 }}>{short(ageData.reduce((s, a) => s + (a.value || 0), 0))}</b><span>outstanding</span></div>
              </div>
              <table style={{ fontSize: 12, width: '100%' }}><tbody>{(() => { const all = ageData.reduce((s, a) => s + (a.value || 0), 0) || 1; return ageData.map((a, i) => <tr key={a.name}><td style={{ padding: '5px 4px' }}><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 3, background: AGE_COLOURS[i % AGE_COLOURS.length], marginRight: 7 }} /><span style={{ fontWeight: 600 }}>{a.name} days</span></td><td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', padding: '5px 4px' }}><div style={{ fontWeight: 700 }}>{money(a.value)}</div><Pbar pct={a.value / all * 100} color={AGE_COLOURS[i % AGE_COLOURS.length]} /></td><td style={{ textAlign: 'right', color: 'var(--t3)', padding: '5px 4px' }}>{num(a.dealers)}</td></tr>); })()}</tbody></table>
            </div>) : <div style={{ color: 'var(--t3)', fontSize: 12.5, padding: 12 }}>No ageing yet. Ageing needs a month-wise statement (bills raised per month); the migrated sheet carried running balances only.</div>}
        </Card>
        <Card title={<div className="sec-title" style={{ marginBottom: 0 }}><span className="sec-ico" style={{ '--tone': 'var(--red)' }}><TrendingUp size={15} /></span> Outstanding trend (per statement)</div>}>
          {data.trend?.length ? <ResponsiveContainer width="100%" height={190}><AreaChart data={data.trend} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id="colDashTrend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} /><stop offset="70%" stopColor="#3b82f6" stopOpacity={0.06} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid vertical={false} /><XAxis dataKey="asOn" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={v => v >= 1e7 ? (v / 1e7).toFixed(1) + 'Cr' : (v / 1e5).toFixed(0) + 'L'} width={44} /><Tooltip formatter={v => money(v)} />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2.5} fill="url(#colDashTrend)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} /></AreaChart></ResponsiveContainer>
            : <div style={{ color: 'var(--t3)', fontSize: 12.5, padding: 12 }}>No statements applied yet.</div>}
        </Card>
      </div>

      <div className="col-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12, marginBottom: 12 }}>
        <Card title={<div className="sec-title" style={{ marginBottom: 0 }}><span className="sec-ico" style={{ '--tone': 'var(--red)' }}><TriangleAlert size={15} /></span> High-priority dealers</div>} right={<button className="btn" style={{ fontSize: 11 }} onClick={() => go('colOutstanding', { priority: 'HIGH,CRITICAL' })}>See all</button>}>
          <Table dense cols={[
            { k: 'dealer', h: 'Dealer', avatar: r => r.dealerName, r: r => <DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /> },
            ...monthCols(data.highPriority), { k: 'total', h: 'Total', align: 'right', r: r => <b>{money(r.total)}</b> },
            { k: 'ageDays', h: 'Age', align: 'right', r: r => r.ageDays == null ? '—' : <><div style={{ fontWeight: 700, color: ageTone(r.ageDays) }}>{r.ageDays + 'd'}</div><Pbar pct={r.ageDays / AGE_FULL * 100} color={ageTone(r.ageDays)} style={{ width: 44 }} /></> },
            { k: 'priority', h: 'Priority', r: r => <Badge v={r.priority} /> },
            { k: 'salesmanName', h: 'Salesman' },
          ]} rows={data.highPriority} keyOf={r => r.dealerId} empty="No high-priority dealers." onRow={r => openRow(r)}
          card={r => <><CardRow><DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /><Badge v={r.priority} /></CardRow><div style={{ fontSize: 11, color: 'var(--t2)' }}>{r.salesmanName}{r.ageDays != null ? ` · ${r.ageDays}d` : ''}</div><MonthKVs row={r} rows={data.highPriority} /></>} />
        </Card>
        <Card title={<div className="sec-title" style={{ marginBottom: 0 }}><span className="sec-ico" style={{ '--tone': 'var(--acc)' }}><Users size={15} /></span> By salesman</div>}>
          <Table dense cols={[
            { k: 'name', h: 'Salesman', avatar: r => r.name },
            { k: 'dealers', h: 'Dealers', align: 'right', r: r => num(r.dealers) },
            { k: 'total', h: 'Outstanding', align: 'right', r: r => <b>{money(r.total)}</b> },
            { k: 'overdue', h: 'Overdue', align: 'right', r: r => <><span style={{ color: r.overdue ? 'var(--red)' : undefined, fontWeight: r.overdue ? 700 : undefined }}>{money(r.overdue)}</span>{r.total > 0 && <Pbar pct={(r.overdue || 0) / r.total * 100} color="#ef4444" style={{ width: 52 }} />}</> },
            { k: 'collectedThisMonth', h: 'Collected (month)', align: 'right', r: r => money(r.collectedThisMonth) },
          ]} rows={data.bySalesman} keyOf={r => r.salesmanId || 'none'} empty="No balances in scope." onRow={r => go('colOutstanding', { salesmanId: r.salesmanId })}
          card={r => <><CardRow><b>{r.name}</b><b>{money(r.total)}</b></CardRow><div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{num(r.dealers)} dealers · overdue {money(r.overdue)} · collected {money(r.collectedThisMonth)}</div></>} />
        </Card>
      </div>

      {pending && <ApprovalsModal mode={pending === 'today' ? 'today' : 'waiting'} onClose={() => setPending(false)} onChanged={reload} />}
      <Card title={<div className="sec-title" style={{ marginBottom: 0 }}><span className="sec-ico" style={{ '--tone': '#0891b2' }}><Activity size={15} /></span> Activity — last 30 days</div>}>
        <Table dense cols={[
          { k: 'name', h: 'Employee', avatar: r => r.name },
          { k: 'followups', h: 'Follow-ups', align: 'right' }, { k: 'calls', h: 'Calls', align: 'right' }, { k: 'visits', h: 'Visits', align: 'right' },
          { k: 'promisesKept', h: 'Kept', align: 'right' }, { k: 'promisesBroken', h: 'Broken', align: 'right' },
          { k: 'collected', h: 'Collected', align: 'right', r: r => money(r.collected) }, { k: 'points', h: 'Points', align: 'right' },
        ]} rows={data.activity30d} keyOf={r => r.employeeId} empty="No activity recorded in the last 30 days." onRow={() => go('colEmployees')}
        card={r => <><CardRow><b>{r.name}</b><span className="chip">{num(r.points)} pts</span></CardRow><div style={{ fontSize: 11.5, color: 'var(--t2)' }}>{num(r.followups)} follow-ups · {num(r.calls)} calls · {num(r.visits)} visits · collected {money(r.collected)}</div></>} />
      </Card>
    </div>);
}
