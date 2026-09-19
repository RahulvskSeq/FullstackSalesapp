import React, { useState } from 'react';
import { X, Paperclip } from 'lucide-react';
import { col } from './api';
import { useLoad, Modal, Busy, ErrorBox, Empty, money, num, fmtDate, DealerLink, useDealerCtx, userName, PENDING_BG, periodsOf, periodLabel, OldestPill } from './ui';

const Num = ({ k, v, c, sub }) => <div style={{ minWidth: 0 }}><div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--t3)' }}>{k}</div><div style={{ fontSize: 15, fontWeight: 800, color: c, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere', lineHeight: 1.2 }}>{v}</div>{sub ? <div style={{ fontSize: 10, color: 'var(--t3)', lineHeight: 1.3 }}>{sub}</div> : null}</div>;

/**
 * Pending — what salesmen have recorded that no statement has shown yet.
 * Nothing to approve here: the morning sheet confirms these on its own and
 * they drop off the list. Only a wrong entry needs a hand (Cancel).
 */
export default function ApprovalsModal({ onClose, onChanged, mode = 'waiting', dealerId = null }) {
  const [q, setQ] = useState('');
  const { users } = useDealerCtx();
  const todayKey = new Date().toISOString().slice(0, 10);
  const rec = useLoad(() => mode === 'today' ? col.payments({ recordedOn: todayKey, status: 'RECORDED,CONFIRMED', limit: 200 }) : col.payments({ status: 'RECORDED', limit: 200 }), [mode]);
  const [acting, setActing] = useState('');
  const [err, setErr] = useState('');
  const items = (rec.data?.items || []).filter(p => (!dealerId || String(p.dealerId) === dealerId) && (!q.trim() || (p.dealer?.name || '').toLowerCase().includes(q.trim().toLowerCase())));
  const sum = items.reduce((a, p) => a + p.amount, 0);
  return (
    <Modal title={<span>{mode === 'today' ? 'Recorded today' : 'Pending approval — told by salesmen'} {rec.data ? <span className="chip">{num(items.length)} · {money(sum)}</span> : null}</span>} onClose={onClose} width={760}>
      {!dealerId && <input className="inp" value={q} onChange={e => setQ(e.target.value)} placeholder="Search dealer name…" style={{ marginBottom: 10 }} />}
      <div style={{ fontSize: 11.5, color: 'var(--t2)', marginBottom: 8 }}>{mode === 'today' ? 'Entries made today — counted as collected once a morning statement shows the money.' : 'Money salesmen said is coming. It leaves this list on its own once a statement shows it. Cancel only a wrong entry.'}</div>
      <ErrorBox err={rec.err || err} onRetry={rec.err ? rec.reload : undefined} />
      {rec.busy && !rec.data ? <Busy kind="table" rows={3} /> : !items.length ? <Empty>{mode === 'today' ? 'No entries made today.' : 'Nothing waiting — every recorded payment has been seen in a statement.'}</Empty> :
        <div style={{ display: 'grid', gap: 6 }}>
          {items.map(p => { const done = p.status === 'CONFIRMED'; const came = done ? p.amount : Math.max(p.cameSoFar || 0, p.cameDealer || 0); const full = !done && came >= p.amount; const ps = periodsOf([p]); const counted = p.dupOf || (p.cameFrom || [])[0] || null; return (
          <div key={p._id} style={{ padding: '7px 10px', borderRadius: 9, background: done ? 'rgba(22,163,74,.10)' : PENDING_BG, border: '1px solid ' + (done ? 'rgba(22,163,74,.4)' : 'rgba(245,158,11,.45)'), boxShadow: `inset 3px 0 0 ${done ? '#16a34a' : '#f59e0b'}` }}>
            {/* line 1: who · when · how · by whom, with cancel at the end */}
            <div className="row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: '2px 8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <DealerLink id={p.dealerId} name={p.dealer?.name || String(p.dealerId)} code={p.dealer?.code} />
                <span style={{ fontSize: 11, color: 'var(--t2)', whiteSpace: 'nowrap' }}>{fmtDate(p.date)} · {p.mode}{p.reference ? ' · ' + p.reference : ''} · {userName(users, p.enteredBy)}</span>
                {p.proofId && <a className="btn" href={col.proofUrl(p.proofId)} target="_blank" rel="noreferrer" style={{ fontSize: 10.5, padding: '1px 6px', display: 'inline-flex', gap: 3, alignItems: 'center' }}><Paperclip size={10} /> Proof</a>}
              </div>
              {done ? <span style={{ fontSize: 11.5, color: 'var(--grn)', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ collected</span>
                : p.beforeFirstStatement ? <span className="row" style={{ gap: 4, flexShrink: 0 }}>
                    <button className="btnp" disabled={acting === p._id} data-tip={`Told on/before the first statement (${fmtDate(p.firstStatementAsOn)}). Money that came by then is already inside that statement's figures, so no drop can ever show it. Check the receipt in Tally and close it here.`} style={{ fontSize: 11, padding: '2px 8px' }} onClick={async () => { if (!window.confirm('Checked in Tally — this money was received before the first statement?')) return; setActing(p._id); setErr(''); try { await col.paymentCountedOn(p._id, null, `received before the first statement (${p.firstStatementAsOn}) — checked in Tally`); rec.reload(); onChanged?.(); } catch (e) { setErr(e.message); } finally { setActing(''); } }}>✓ Received · checked in Tally</button>
                    <button className="btn" disabled={acting === p._id} data-tip="Wrong entry — remove it" style={{ fontSize: 11, padding: '2px 7px' }} onClick={async () => { const r = window.prompt('Reason for cancelling?'); if (r === null) return; setActing(p._id); setErr(''); try { await col.cancelPayment(p._id, r); rec.reload(); onChanged?.(); } catch (e) { setErr(e.message); } finally { setActing(''); } }}><X size={11} /></button>
                  </span>
                : full ? <button className="btnp" disabled={acting === p._id} data-tip={counted ? `The money came and is counted on entry #${counted.paymentNo} (${fmtDate(counted.date)}). Close this one as the same money.` : 'The money came in full — close this entry'} style={{ fontSize: 11, padding: '2px 8px', flexShrink: 0 }} onClick={async () => { setActing(p._id); setErr(''); try { await col.paymentCountedOn(p._id, counted?._id ? counted._id : null); rec.reload(); onChanged?.(); } catch (e) { setErr(e.message); } finally { setActing(''); } }}>✓ Came — same money{counted ? ` as #${counted.paymentNo}` : ''}</button>
                : <button className="btn" disabled={acting === p._id} data-tip="Wrong entry — remove it" style={{ fontSize: 11, padding: '2px 7px', flexShrink: 0 }} onClick={async () => { const r = window.prompt('Reason for cancelling?'); if (r === null) return; setActing(p._id); setErr(''); try { await col.cancelPayment(p._id, r); rec.reload(); onChanged?.(); } catch (e) { setErr(e.message); } finally { setActing(''); } }}><X size={11} /> Cancel</button>}
            </div>
            {/* line 2: told · came · still to come */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 6, margin: '5px 0 3px' }}>
              <Num k="Told" v={money(p.amount)} c="#b45309" />
              <Num k="Came" v={p.beforeFirstStatement && !done && !came ? 'not visible' : money(came)} c={came > 0 ? 'var(--grn)' : 'var(--t3)'} sub={!done && came > 0 && (p.cameFrom || []).length ? `credited to ${(p.cameFrom || []).slice(0, 2).map(x => `#${x.paymentNo} · ${fmtDate(x.date)}`).join(', ')}` : (p.beforeFirstStatement && !done ? `told before the first statement (${fmtDate(p.firstStatementAsOn)}) — the app cannot see money that came by then; check Tally` : '')} />
              <Num k="Still to come" v={money(done ? 0 : Math.max(0, p.amount - came))} c={full ? 'var(--grn)' : 'var(--red)'} />
            </div>
            {/* line 3: the months, in one line */}
            {ps.length > 0 && <div style={{ display: 'flex', gap: '4px 12px', flexWrap: 'wrap', alignItems: 'center', fontSize: 11.5, color: 'var(--t2)', fontVariantNumeric: 'tabular-nums' }}>
              {ps.map((m, i) => <span key={m} style={{ whiteSpace: 'nowrap' }}>{i === 0 ? <span style={{ color: 'var(--red)', fontWeight: 700 }}>{periodLabel(m)}</span> : periodLabel(m)} {p.buckets?.[m] ? (i === 0 ? <OldestPill>{money(p.buckets[m])}</OldestPill> : <b style={{ color: 'var(--t1)' }}>{money(p.buckets[m])}</b>) : '–'}</span>)}
              <span style={{ whiteSpace: 'nowrap' }}>Total <b style={{ color: 'var(--t1)' }}>{money(p.balanceTotal ?? p.total)}</b></span>
              {p.remarks && <span style={{ fontStyle: 'italic' }}>“{p.remarks}”</span>}
            </div>}
          </div>); })}
        </div>}
    </Modal>);
}
