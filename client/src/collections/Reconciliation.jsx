import { Scale } from 'lucide-react';
import React, { useState } from 'react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Pager, Busy, ErrorBox, money, num, fmtDate, fmtWhen, DealerLink } from './ui';

/**
 * Where the statement and the books disagree. A positive difference is a
 * decrease the ERP shows that no confirmed payment explains (a credit note,
 * a return, an entry made elsewhere); a negative one is a payment confirmed
 * here that the statement has not reflected yet.
 */
export default function Reconciliation() {
  const [q, setQ] = useState({ page: 1, limit: 50, from: '', to: '' });
  const { data, busy, err, reload } = useLoad(() => col.reconciliation(q), [JSON.stringify(q)]);
  const set = p => setQ(x => ({ ...x, ...p, page: p.page || 1 }));
  return (
    <div>
      <PageHead icon={Scale} tone="var(--yel)" title="Reconciliation" sub="Decrease in the statement ≠ payment. This is the list of every gap between the two." />
      <div className="stat-grid col-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Unexplained decreases</div><div style={{ fontSize: 19, fontWeight: 800, color: 'var(--yel)' }}>{money(data?.unexplained)}</div><div style={{ fontSize: 11, color: 'var(--t2)' }}>ERP fell with no confirmed payment behind it</div></div>
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Payments not yet reflected</div><div style={{ fontSize: 19, fontWeight: 800, color: 'var(--acc)' }}>{money(data?.unreflected)}</div><div style={{ fontSize: 11, color: 'var(--t2)' }}>confirmed here, statement still shows it owed</div></div>
        <div className="stat-card"><div style={{ fontSize: 10.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase' }}>Differences</div><div style={{ fontSize: 19, fontWeight: 800 }}>{num(data?.total)}</div></div>
      </div>
      <Card style={{ marginBottom: 12 }}><div className="row" style={{ gap: 8 }}><input type="date" className="inp" style={{ maxWidth: 160 }} value={q.from} onChange={e => set({ from: e.target.value })} /><span style={{ color: 'var(--t3)' }}>to</span><input type="date" className="inp" style={{ maxWidth: 160 }} value={q.to} onChange={e => set({ to: e.target.value })} /></div></Card>
      <Card pad={false}>
        {err ? <ErrorBox err={err} onRetry={reload} /> : busy && !data ? <Busy /> : <Table cols={[
          { k: 'at', h: 'Statement', r: r => fmtWhen(r.at) },
          { k: 'dealer', h: 'Dealer', r: r => <DealerLink id={r.dealerId} name={r.dealer?.name || String(r.dealerId)} code={r.dealer?.code} /> },
          { k: 'before', h: 'Was', align: 'right', r: r => money(r.before) },
          { k: 'after', h: 'Now', align: 'right', r: r => money(r.after) },
          { k: 'paid', h: 'Confirmed payments', align: 'right', r: r => money(r.meta?.confirmed ?? r.meta?.payments ?? 0) },
          { k: 'amount', h: 'Difference', align: 'right', r: r => <b style={{ color: r.amount > 0 ? 'var(--yel)' : 'var(--acc)' }}>{r.amount > 0 ? '+' : ''}{money(r.amount)}</b> },
          { k: 'note', h: 'Note', wrap: true },
        ]} rows={data?.items} empty="Statement and books agree everywhere." />}
        <div style={{ padding: '0 12px 10px' }}><Pager page={data?.page} limit={data?.limit} total={data?.total} onPage={p => setQ(x => ({ ...x, page: p }))} /></div>
      </Card>
    </div>);
}
