import React, { useState } from 'react';
import { Download, FileBarChart2 } from 'lucide-react';
import { col, downloadReport } from './api';
import { useLoad, PageHead, Card, Table, Busy, ErrorBox, money, num, monthNow, DealerPicker, useDealerCtx } from './ui';

const NEEDS_RANGE = new Set(['collection', 'payment-history', 'follow-ups', 'promises', 'broken-promises', 'cleared', 'new-outstanding', 'reconciliation', 'employee-activity', 'task-points']);
const NEEDS_PERIOD = new Set(['employee-review']);
const NEEDS_DEALER = new Set(['dealer-timeline', 'historical-outstanding']);

export default function Reports() {
  const { users, isStaff } = useDealerCtx();
  const kinds = useLoad(() => col.reports(), []);
  const [kind, setKind] = useState('current-outstanding');
  const [p, setP] = useState({ from: monthNow() + '-01', to: new Date().toISOString().slice(0, 10), period: monthNow(), employeeId: '' });
  const [dealer, setDealer] = useState(null);
  const q = { ...(NEEDS_RANGE.has(kind) ? { from: p.from, to: p.to } : {}), ...(NEEDS_PERIOD.has(kind) ? { period: p.period } : {}), ...(NEEDS_DEALER.has(kind) && dealer ? { dealerId: dealer.id } : {}), ...(p.employeeId ? { employeeId: p.employeeId } : {}) };
  const ready = !NEEDS_DEALER.has(kind) || !!dealer;
  const { data, busy, err, reload } = useLoad(() => ready ? col.report(kind, q) : Promise.resolve(null), [kind, JSON.stringify(q), ready]);
  const fmtCell = v => typeof v === 'number' && Math.abs(v) >= 1000 ? num(v) : (v == null ? '' : String(v));
  return (
    <div>
      <PageHead icon={FileBarChart2} tone="var(--acc)" title="Reports" sub="Everything the module knows, as a table or an Excel file. Scoped to what you can see." right={<>
        <button className="btn" disabled={!ready} onClick={() => downloadReport(kind, q, 'csv').catch(e => alert(e.message))}><Download size={12} /> CSV</button>
        <button className="btnp" disabled={!ready} onClick={() => downloadReport(kind, q, 'xlsx').catch(e => alert(e.message))}><Download size={12} /> Excel</button></>} />
      <Card style={{ marginBottom: 12 }}><div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="field" style={{ marginBottom: 0 }}><label>Report</label><select className="sel" value={kind} onChange={e => setKind(e.target.value)}>{(kinds.data || []).map(k => <option key={k.id} value={k.id}>{k.label}</option>)}</select></div>
        {NEEDS_RANGE.has(kind) && <><div className="field" style={{ marginBottom: 0 }}><label>From</label><input type="date" className="inp" value={p.from} onChange={e => setP(x => ({ ...x, from: e.target.value }))} /></div><div className="field" style={{ marginBottom: 0 }}><label>To</label><input type="date" className="inp" value={p.to} onChange={e => setP(x => ({ ...x, to: e.target.value }))} /></div></>}
        {NEEDS_PERIOD.has(kind) && <div className="field" style={{ marginBottom: 0 }}><label>Month</label><input type="month" className="inp" value={p.period} onChange={e => setP(x => ({ ...x, period: e.target.value }))} /></div>}
        {NEEDS_DEALER.has(kind) && <div className="field" style={{ marginBottom: 0, minWidth: 300 }}><label>Dealer</label><DealerPicker value={dealer} onChange={setDealer} /></div>}
        {isStaff && /employee|task|follow|promise/.test(kind) && <div className="field" style={{ marginBottom: 0 }}><label>Employee</label><select className="sel" value={p.employeeId} onChange={e => setP(x => ({ ...x, employeeId: e.target.value }))}><option value="">Everyone</option>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>}
      </div></Card>
      <Card pad={false}>
        {!ready ? <div style={{ padding: 20, color: 'var(--t3)', fontSize: 12.5 }}>Pick a dealer.</div> : err ? <ErrorBox err={err} onRetry={reload} /> : busy && !data ? <Busy /> : data ? <>
          <div style={{ padding: '10px 12px 0', fontSize: 12, color: 'var(--t2)' }}>{num(data.count)} rows{data.truncated ? ' — first 500 shown here; the Excel has all of them' : ''}</div>
          <Table dense cols={(data.columns || []).map((c, i) => ({ k: String(i), h: c, align: typeof data.rows?.[0]?.[i] === 'number' ? 'right' : 'left', r: r => fmtCell(r[i]) }))} rows={(data.rows || []).map((r, i) => Object.assign([...r], { _id: i }))} keyOf={r => r._id} empty="Empty report." />
        </> : null}
      </Card>
    </div>);
}
