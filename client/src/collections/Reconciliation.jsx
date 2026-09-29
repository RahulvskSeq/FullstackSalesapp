import { Scale, TrendingDown, Hourglass, GitCompareArrows } from 'lucide-react';
import React, { useState } from 'react';
import { col } from './api';
import { useLoad, PageHead, Card, Tile, Table, Pager, Busy, ErrorBox, money, num, fmtDate, fmtWhen, DealerLink, useDealerCtx, Trend } from './ui';

/**
 * Where the statement and the books disagree. A positive difference is a
 * decrease the ERP shows that no confirmed payment explains (a credit note,
 * a return, an entry made elsewhere); a negative one is a payment confirmed
 * here that the statement has not reflected yet.
 */
export default function Reconciliation() {
  const { openRecord } = useDealerCtx();
  const [q, setQ] = useState({ page: 1, limit: 50, from: '', to: '' });
  const { data, busy, err, reload } = useLoad(() => col.reconciliation(q), [JSON.stringify(q)]);
  const set = p => setQ(x => ({ ...x, ...p, page: p.page || 1 }));
  return (
    <div>
      <PageHead icon={Scale} tone="var(--yel)" title="Reconciliation" sub="Decrease in the statement ≠ payment. This is the list of every gap between the two." />
      <div className="stat-grid col-stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <Tile icon={TrendingDown} tone="var(--yel)" label="Unexplained decreases" value={<span style={{ color: 'var(--yel)' }}>{money(data?.unexplained)}</span>} sub="ERP fell with no confirmed payment behind it" />
        <Tile icon={Hourglass} tone="var(--acc)" label="Payments not yet reflected" value={<span style={{ color: 'var(--acc)' }}>{money(data?.unreflected)}</span>} sub="confirmed here, statement still shows it owed" />
        <Tile icon={GitCompareArrows} tone="var(--pur)" label="Differences" value={num(data?.total)} />
      </div>
      <Card style={{ marginBottom: 12 }}><div className="row" style={{ gap: 8 }}><input type="date" className="inp" style={{ maxWidth: 160 }} value={q.from} onChange={e => set({ from: e.target.value })} /><span style={{ color: 'var(--t3)' }}>to</span><input type="date" className="inp" style={{ maxWidth: 160 }} value={q.to} onChange={e => set({ to: e.target.value })} /></div></Card>
      <Card pad={false}>
        {err ? <ErrorBox err={err} onRetry={reload} /> : busy && !data ? <Busy kind="table" /> : <Table cols={[
          { k: 'at', h: 'Statement', r: r => fmtWhen(r.at) },
          { k: 'dealer', h: 'Dealer', avatar: r => r.dealer?.name || String(r.dealerId), r: r => <DealerLink id={r.dealerId} name={r.dealer?.name || String(r.dealerId)} code={r.dealer?.code} /> },
          { k: 'before', h: 'Was', align: 'right', r: r => money(r.before) },
          { k: 'after', h: 'Now', align: 'right', r: r => <span className="row" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'nowrap' }}>{r.before != null && r.after != null ? <Trend before={r.before} after={r.after} lowerIsBetter /> : null}{money(r.after)}</span> },
          { k: 'paid', h: 'Confirmed payments', align: 'right', r: r => money(r.meta?.confirmed ?? r.meta?.payments ?? 0) },
          { k: 'amount', h: 'Difference', align: 'right', r: r => <b style={{ color: r.amount > 0 ? 'var(--yel)' : 'var(--acc)' }}>{r.amount > 0 ? '+' : ''}{money(r.amount)}</b> },
          { k: 'note', h: 'Note', wrap: true },
        ]} rows={data?.items} empty="Statement and books agree everywhere." onRow={r => openRecord('event', r)} />}
        <div style={{ padding: '0 12px 10px' }}><Pager page={data?.page} limit={data?.limit} total={data?.total} onPage={p => setQ(x => ({ ...x, page: p }))} /></div>
      </Card>
    </div>);
}
