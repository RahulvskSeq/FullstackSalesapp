import React, { useState, useEffect } from 'react';
import { Download, BadgeIndianRupee, NotebookPen, Banknote } from 'lucide-react';
import { col, downloadReport } from './api';
import { useLoad, PageHead, Card, Table, Pager, Badge, Busy, ErrorBox, money, num, fmtDate, periodLabel, DealerLink, useDealerCtx, WhatsAppIcon, StatusBadge, CallButton, CardRow, KV, OldestPill, PendingChip } from './ui';
import { FollowupForm, PaymentForm, WhatsAppForm } from './forms';

const STATUSES = ['DUE', 'NIL', 'FOLLOW_UP_REQUIRED', 'PROMISED', 'PARTIAL_PAYMENT', 'OVERDUE', 'HIGH_PRIORITY', 'CLEARED', 'CLOSED'];
const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/** The current book: one row per dealer, the server's figure, never a sheet. */
export default function Outstanding({ params }) {
  const { users, isStaff, open: openDealer } = useDealerCtx();
  const [q, setQ] = useState({ page: 1, limit: 50, sort: 'total', dir: 'desc', owing: '1', status: params?.status || '', priority: params?.priority || '', salesmanId: params?.salesmanId || '', q: '' });
  const [text, setText] = useState('');
  const { data, busy, err, reload } = useLoad(() => col.outstanding(q), [JSON.stringify(q)]);
  const [form, setForm] = useState(null);
  useEffect(() => { const t = setTimeout(() => setQ(x => ({ ...x, q: text, page: 1 })), 300); return () => clearTimeout(t); }, [text]);
  const set = patch => setQ(x => ({ ...x, ...patch, page: patch.page || 1 }));
  const sortBy = k => set({ sort: k, dir: q.sort === k && q.dir === 'desc' ? 'asc' : 'desc' });
  const H = (k, label) => <span onClick={() => sortBy(k)} style={{ cursor: 'pointer', textDecoration: q.sort === k ? 'underline' : 'none' }}>{label}{q.sort === k ? (q.dir === 'desc' ? ' ↓' : ' ↑') : ''}</span>;
  const periods = data?.items?.length ? [...new Set(data.items.flatMap(i => Object.keys(i.buckets || {})))].sort().slice(-4) : [];
  const dealerOf = r => ({ id: String(r.dealerId), name: r.dealerName, code: r.dealerCode, total: r.total, phone: r.phone || '' });
  return (
    <div>
      <PageHead icon={BadgeIndianRupee} tone="var(--red)" title="Outstanding" sub={data ? `${num(data.owing)} dealers owing · ${money(data.sum)} in scope` : ''} right={<>
        <button className="btn" data-tip="Download this list as Excel" onClick={() => downloadReport('current-outstanding', {}, 'xlsx').catch(e => alert(e.message))}><Download size={12} /> Excel</button>
        <button className="btn" data-tip="Record a call or visit" onClick={() => setForm({ kind: 'followup' })}><NotebookPen size={12} /> Follow-up</button>
        <button className="btnp" data-tip="Record money received" onClick={() => setForm({ kind: 'payment' })}><Banknote size={12} /> Payment</button>
      </>} />
      <Card style={{ marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <input className="inp" style={{ maxWidth: 260 }} placeholder="Dealer name or code" value={text} onChange={e => setText(e.target.value)} />
          <select className="sel" value={q.status} onChange={e => set({ status: e.target.value })}><option value="">Any status</option>{STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>
          <select className="sel" value={q.priority} onChange={e => set({ priority: e.target.value })}><option value="">Any priority</option>{PRIORITIES.map(s => <option key={s} value={s}>{s}</option>)}<option value="HIGH,CRITICAL">High + Critical</option></select>
          {isStaff && <select className="sel" value={q.salesmanId} onChange={e => set({ salesmanId: e.target.value })}><option value="">All salesmen</option>{(users || []).filter(u => u.role === 'salesman').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select>}
          <label className="row" style={{ fontSize: 12, gap: 5 }}><input type="checkbox" checked={q.owing === '1'} onChange={e => set({ owing: e.target.checked ? '1' : '' })} /> owing only</label>
          <input className="inp" type="number" style={{ maxWidth: 140 }} placeholder="Min ₹" value={q.minTotal || ''} onChange={e => set({ minTotal: e.target.value })} />
        </div>
      </Card>
      <Card pad={false}>
        {err ? <ErrorBox err={err} onRetry={reload} /> : busy && !data ? <Busy /> : (
          <Table cols={[
            { k: 'dealer', h: H('dealerName', 'Dealer'), r: r => <DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /> },
            { k: 'salesmanName', h: 'Salesman' },
            ...periods.map((p, i) => ({ k: p, h: i === 0 ? <span style={{ color: 'var(--red)' }}>{periodLabel(p)}</span> : periodLabel(p), align: 'right', r: r => <span>{r.buckets?.[p] ? (i === 0 ? <OldestPill>{money(r.buckets[p])}</OldestPill> : money(r.buckets[p])) : <span style={{ color: 'var(--t3)' }}>–</span>}{i === 0 && (r.pendingApproval > 0 || r.pendingRecorded > 0) ? <div><PendingChip amount={r.pendingApproval} recorded={r.pendingRecorded} /></div> : null}</span> })),
            { k: 'total', h: H('total', 'Total'), align: 'right', r: r => <b>{money(r.total)}</b> },
            { k: 'ageDays', h: H('ageDays', 'Age'), align: 'right', r: r => r.ageDays == null ? '—' : <span style={{ color: r.ageDays > 90 ? 'var(--red)' : undefined }}>{r.ageDays}d</span> },
            { k: 'status', h: 'Status', r: r => <StatusBadge status={r.status} priority={r.priority} /> },
            { k: 'priority', h: H('priority', 'Priority'), r: r => <Badge v={r.priority} /> },
            { k: 'nextFollowupAt', h: H('nextFollowupAt', 'Next follow-up'), r: r => <a href="#" data-tip={r.nextFollowupAt ? 'Change the follow-up date' : 'Set a follow-up date'} onClick={e => { e.preventDefault(); e.stopPropagation(); setForm({ kind: 'followup', dealer: dealerOf(r), focusDate: true }); }} style={{ color: r.nextFollowupAt ? 'var(--t1)' : 'var(--acc)', textDecoration: 'none', borderBottom: '1px dotted var(--t3)' }}>{r.nextFollowupAt ? fmtDate(r.nextFollowupAt) : 'set date'}</a> },
            { k: 'promise', h: 'Promise', r: r => r.promise?.amount ? `${money(r.promise.amount)} · ${fmtDate(r.promise.date)}` : '—' },
            { k: 'lastPaymentAt', h: H('lastPaymentAt', 'Last paid'), r: r => fmtDate(r.lastPaymentAt) },
            { k: 'act', h: '', r: r => <div className="row" style={{ gap: 4 }}>
                <CallButton dealer={dealerOf(r)} label={<span className="col-lbl">Call</span>} onDialed={d => setForm({ kind: 'followup', dealer: d })} />
                <button className="btn" style={{ padding: '3px 8px', color: 'var(--pur)', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} data-tip="Write down a follow-up" onClick={e => { e.stopPropagation(); setForm({ kind: 'followup', dealer: dealerOf(r) }); }}><NotebookPen size={12} /><span className="col-lbl">Follow-up</span></button>
                <button className="btn" style={{ padding: '3px 8px', color: 'var(--grn)', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} data-tip="Record a payment" onClick={e => { e.stopPropagation(); setForm({ kind: 'payment', dealer: dealerOf(r) }); }}><Banknote size={12} /><span className="col-lbl">Payment</span></button>
                <button className="btn" style={{ padding: '3px 8px', color: '#25D366', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} data-tip="WhatsApp" onClick={e => { e.stopPropagation(); setForm({ kind: 'wa', dealer: dealerOf(r) }); }}><WhatsAppIcon size={13} /><span className="col-lbl">WhatsApp</span></button></div> },
          ]} rows={data?.items} keyOf={r => r.dealerId} onRow={r => openDealer(r.dealerId)} empty="No dealers match. Import a statement first if the module is new."
          card={r => <>
            <CardRow><DealerLink id={r.dealerId} name={r.dealerName} code={r.dealerCode} /><StatusBadge status={r.status} priority={r.priority} /></CardRow>
            <div style={{ fontSize: 11.5, color: 'var(--t2)', margin: '2px 0 8px' }}>{r.salesmanName}{r.ageDays != null ? ` · ${r.ageDays} days` : ''}</div>
            <div className="col-months" style={{ display: 'grid', gridTemplateColumns: `repeat(${periods.length + 1}, minmax(0,1fr))`, gap: 6, marginBottom: 8 }}>
              {periods.map((p, i) => <KV key={p} k={i === 0 ? <span style={{ color: 'var(--red)' }}>{periodLabel(p)}</span> : periodLabel(p)} v={<span>{r.buckets?.[p] ? (i === 0 ? <OldestPill>{money(r.buckets[p])}</OldestPill> : money(r.buckets[p])) : '–'}{i === 0 && (r.pendingApproval > 0 || r.pendingRecorded > 0) ? <div><PendingChip amount={r.pendingApproval} recorded={r.pendingRecorded} /></div> : null}</span>} />)}
              <KV k="Total" v={money(r.total)} big />
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--t2)', marginBottom: 8 }}>
              <a href="#" onClick={e => { e.preventDefault(); e.stopPropagation(); setForm({ kind: 'followup', dealer: dealerOf(r), focusDate: true }); }} style={{ color: r.nextFollowupAt ? 'var(--t1)' : 'var(--acc)', textDecoration: 'none', borderBottom: '1px dotted var(--t3)' }}>{r.nextFollowupAt ? `Follow-up ${fmtDate(r.nextFollowupAt)}` : 'Set follow-up date'}</a>{r.promise?.amount ? ` · Promise ${money(r.promise.amount)} by ${fmtDate(r.promise.date)}` : ''}{r.lastPaymentAt ? ` · Last paid ${fmtDate(r.lastPaymentAt)}` : ''}</div>
            <div className="row col-actions" style={{ gap: 6, flexWrap: 'wrap' }}>
              <CallButton dealer={dealerOf(r)} label="Call" onDialed={d => setForm({ kind: 'followup', dealer: d })} />
              <button className="btn" style={{ padding: '3px 8px', color: 'var(--pur)', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} onClick={e => { e.stopPropagation(); setForm({ kind: 'followup', dealer: dealerOf(r) }); }}><NotebookPen size={12} />Follow-up</button>
              <button className="btn" style={{ padding: '3px 8px', color: 'var(--grn)', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} onClick={e => { e.stopPropagation(); setForm({ kind: 'payment', dealer: dealerOf(r) }); }}><Banknote size={12} />Payment</button>
              <button className="btn" style={{ padding: '3px 8px', color: '#25D366', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5 }} onClick={e => { e.stopPropagation(); setForm({ kind: 'wa', dealer: dealerOf(r) }); }}><WhatsAppIcon size={13} />WhatsApp</button>
            </div>
          </>} />)}
        <div style={{ padding: '0 12px 10px' }}><Pager page={data?.page} limit={data?.limit} total={data?.total} onPage={p => setQ(x => ({ ...x, page: p }))} /></div>
      </Card>
      {form?.kind === 'followup' && <FollowupForm dealer={form.dealer} focusDate={form.focusDate} onClose={() => setForm(null)} onDone={reload} />}
      {form?.kind === 'payment' && <PaymentForm dealer={form.dealer} onClose={() => setForm(null)} onDone={reload} />}
      {form?.kind === 'wa' && <WhatsAppForm dealer={form.dealer} onClose={() => setForm(null)} onDone={reload} />}
    </div>);
}
