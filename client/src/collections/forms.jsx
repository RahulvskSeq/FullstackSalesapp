import React, { useState, useEffect, useRef } from 'react';
import { col } from './api';
import { Modal, Field, DealerPicker, ErrorBox, money, today, useDealerCtx, MonthKVs, StatusBadge, fmtDate } from './ui';
import { fileToCompressedDataURL } from '../components/visitCapture';

/**
 * The three write forms — follow-up, payment, task — shared by the Today
 * screen, the Outstanding list and the Dealer 360 drawer. Each takes an
 * optional pre-selected dealer so a row can open the form already filled in.
 */
const CHANNELS = ['CALL', 'VISIT', 'WHATSAPP', 'EMAIL', 'SMS', 'OTHER'];
const OUTCOMES = ['NO_ANSWER', 'CALLBACK', 'PROMISED', 'DISPUTED', 'PARTIAL', 'PAID', 'COLLECT_CHEQUE', 'NOT_REACHABLE', 'OTHER'];
const MODES = ['CASH', 'CHEQUE', 'NEFT', 'RTGS', 'UPI', 'CARD', 'OTHER'];
const TASK_TYPES = ['CALL', 'VISIT', 'PAYMENT_COLLECTION', 'WHATSAPP', 'SEND_STATEMENT', 'SEND_INVOICE', 'FOLLOW_UP', 'ESCALATION', 'VERIFICATION', 'PROMISE_FOLLOW_UP', 'CUSTOM'];
const PRIORITY = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const t = s => String(s).replace(/_/g, ' ').toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());

/**
 * The dealer's current position, right under the dealer field of every form —
 * the months, the total, status, promise and last follow-up. Nobody should
 * have to open Dealer 360 to know what they are calling about.
 */
export function DealerSummary({ dealer }) {
  const [b, setB] = useState(null);
  useEffect(() => { setB(null); if (!dealer?.id) return; let dead = false; col.dealer360(dealer.id).then(d => { if (!dead) setB(d.balance || { total: 0, buckets: {} }); }).catch(() => {}); return () => { dead = true; }; }, [dealer?.id]);
  if (!dealer) return null;
  if (!b) return <div style={{ fontSize: 11.5, color: 'var(--t3)', margin: '-6px 0 12px' }}>Loading outstanding…</div>;
  return <div style={{ margin: '-6px 0 12px', padding: '8px 12px', borderRadius: 8, background: 'var(--accL)', border: '1px solid var(--b1)' }}>
    <div className="row" style={{ justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)' }}>OUTSTANDING</span><StatusBadge status={b.status} priority={b.priority} />
    </div>
    <MonthKVs row={b} total={b.total} />
    <div style={{ fontSize: 11.5, color: 'var(--t2)' }}>
      {b.ageDays != null ? `${b.ageDays} days old · ` : ''}{b.promise?.amount ? `promised ${money(b.promise.amount)} by ${fmtDate(b.promise.date)} · ` : ''}{b.lastFollowupAt ? `last follow-up ${fmtDate(b.lastFollowupAt)} · ` : ''}{b.lastPaymentAt ? `last paid ${fmtDate(b.lastPaymentAt)}` : 'no payment recorded yet'}
    </div>
  </div>;
}

// module scope so it is not a new component type (and remounted) on every render
const Chips = ({ items, value, onPick }) => <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>{items.map(([v, l]) => <button key={v} type="button" onClick={() => onPick(v)} className={value === v ? 'btnp' : 'btn'} style={{ padding: '6px 12px', fontSize: 12.5 }}>{l}</button>)}</div>;

function useSubmit(onDone) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const run = async fn => { setBusy(true); setErr(''); try { const r = await fn(); onDone?.(r); } catch (e) { setErr(e.message || String(e)); } finally { setBusy(false); } };
  return { busy, err, run };
}

export function FollowupForm({ dealer: preset, onClose, onDone, focusDate = false }) {
  const { users, isStaff, currentUser } = useDealerCtx();
  const [dealer, setDealer] = useState(preset || null);
  // Kept short on purpose: who, how, what happened, when next, a note. Date and
  // time are now; the rest is optional.
  const [f, setF] = useState({ channel: 'CALL', outcome: 'CALLBACK', notes: '', nextFollowupDate: '', promiseAmount: '', promiseDate: '', employeeId: currentUser?.id || '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const { busy, err, run } = useSubmit(r => { onDone?.(r); onClose(); });
  const salesmen = (users || []).filter(u => u.role === 'salesman' || u.role === 'employee' || u.role === 'admin');
  const promising = f.outcome === 'PROMISED';
  const CH = [['CALL', 'Call'], ['VISIT', 'Visit'], ['WHATSAPP', 'WhatsApp']];
  const OC = [['CALLBACK', 'Call back later'], ['PROMISED', 'Promised to pay'], ['COLLECT_CHEQUE', 'Collect cheque'], ['NO_ANSWER', 'No answer'], ['DISPUTED', 'Dispute']];
  return (
    <Modal title="Record follow-up" onClose={onClose}>
      <Field label="Dealer"><DealerPicker value={dealer} onChange={setDealer} /></Field>
      <DealerSummary dealer={dealer} />
      <Field label="How"><Chips items={CH} value={f.channel} onPick={v => set('channel', v)} /></Field>
      <Field label="What happened"><Chips items={OC} value={f.outcome} onPick={v => set('outcome', v)} /></Field>
      {isStaff && <Field label="Recorded for"><select className="sel" style={{ width: '100%' }} value={f.employeeId} onChange={e => set('employeeId', e.target.value)}>{salesmen.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>}
      {promising && <div className="g2" style={{ padding: 10, borderRadius: 8, background: 'var(--accL)', marginBottom: 12 }}>
        <Field label="Promised amount (₹)"><input type="number" className="inp" value={f.promiseAmount} onChange={e => set('promiseAmount', e.target.value)} min={1} autoFocus /></Field>
        <Field label="Promised by"><input type="date" className="inp" value={f.promiseDate} onChange={e => set('promiseDate', e.target.value)} min={today()} /></Field>
      </div>}
      <Field label={f.outcome === 'COLLECT_CHEQUE' ? 'Collect the cheque on' : 'Next follow-up'}><input type="date" className="inp" value={f.nextFollowupDate} onChange={e => set('nextFollowupDate', e.target.value)} min={today()} autoFocus={focusDate} required={f.outcome === 'COLLECT_CHEQUE'} /></Field>
      <Field label="Notes"><textarea className="inp" rows={2} value={f.notes} onChange={e => set('notes', e.target.value)} placeholder="Anything worth remembering (optional)" /></Field>
      <ErrorBox err={err} />
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btnp" disabled={busy || !dealer || (promising && !(Number(f.promiseAmount) > 0 && f.promiseDate)) || (f.outcome === 'COLLECT_CHEQUE' && !f.nextFollowupDate)} onClick={() => run(() => col.recordFollowup({
          dealerId: dealer.id, channel: f.channel, outcome: f.outcome, discussion: f.notes,
          nextFollowupDate: f.nextFollowupDate, employeeId: f.employeeId,
          promise: promising ? { amount: Number(f.promiseAmount), date: f.promiseDate } : undefined }))}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </Modal>);
}

export function PaymentForm({ dealer: preset, onClose, onDone }) {
  const { users, currentUser } = useDealerCtx();
  const [dealer, setDealer] = useState(preset || null);
  const [invoices, setInvoices] = useState([]);
  const [alloc, setAlloc] = useState({});
  const [f, setF] = useState({ date: today(), amount: '', mode: 'NEFT', reference: '', bankReference: '', collectedBy: currentUser?.id || '', remarks: '' });
  const [proof, setProof] = useState(null);
  const [reading, setReading] = useState(false);
  const [proofErr, setProofErr] = useState('');
  const proofSeq = useRef(0);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const { busy, err, run } = useSubmit(r => { onDone?.(r); onClose(); });
  useEffect(() => {
    setAlloc({}); setInvoices([]);   // a new dealer never inherits the last one's allocations
    if (!dealer?.id) return;
    let dead = false;   // ignore a slow reply for a dealer no longer selected
    col.dealer360(dealer.id).then(d => { if (!dead) setInvoices((d.invoices || []).filter(i => i.status === 'OPEN')); }).catch(() => { if (!dead) setInvoices([]); });
    return () => { dead = true; };
  }, [dealer?.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  const allocated = Object.values(alloc).reduce((s, v) => s + (Number(v) || 0), 0);
  // images are shrunk to a JPEG before upload; PDFs go as-is but are capped at 5 MB
  const onProof = async e => {
    const file = e.target.files?.[0]; const seq = ++proofSeq.current;
    setProofErr(''); setProof(null);
    if (!file) { setReading(false); return; }
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (isPdf && file.size > 5 * 1024 * 1024) { setReading(false); setProofErr(`That PDF is ${(file.size / 1048576).toFixed(1)} MB — the limit is 5 MB. Attach a smaller file or a photo of the receipt.`); e.target.value = ''; return; }
    setReading(true);
    try {
      const data = isPdf
        ? await new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(rd.result); rd.onerror = () => rej(new Error('Cannot read file')); rd.readAsDataURL(file); })
        : await fileToCompressedDataURL(file, 1400, 0.8);
      if (seq !== proofSeq.current) return;
      setProof({ mime: isPdf ? 'application/pdf' : 'image/jpeg', data, name: file.name });
    } catch (x) {
      if (seq !== proofSeq.current) return;
      setProofErr(`Could not read the proof file: ${x.message || x}`); e.target.value = '';
    } finally { if (seq === proofSeq.current) setReading(false); }
  };
  return (
    <Modal title="Record payment" onClose={onClose}>
      <Field label="Dealer"><DealerPicker value={dealer} onChange={setDealer} /></Field>
      <DealerSummary dealer={dealer} />
      {/* four fields only: date, amount, proof, remarks — mode and collector are defaulted, the statement settles the rest */}
      <div className="g2">
        <Field label="Date"><input type="date" className="inp" value={f.date} onChange={e => set('date', e.target.value)} max={today()} /></Field>
        <Field label="Amount (₹)"><input type="number" className="inp" value={f.amount} onChange={e => set('amount', e.target.value)} min={1} autoFocus /></Field>
      </div>
      <Field label="Proof (photo of the receipt / screenshot / PDF)" hint={reading ? 'Reading file…' : proof ? proof.name : 'optional, PDF up to 5 MB'}><input type="file" className="inp" accept="image/*,application/pdf" onChange={onProof} /></Field>
      <ErrorBox err={proofErr} />
      {invoices.length > 0 && <Field label="Allocate to invoices (optional)" hint={allocated ? `Allocated ${money(allocated)} of ${money(f.amount)}` : 'Leave blank to keep the payment unallocated'}>
        <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--b1)', borderRadius: 7 }}>
          {invoices.map(i => <div key={i._id} className="row" style={{ padding: '6px 10px', gap: 8, borderBottom: '1px solid var(--b1)', fontSize: 12 }}>
            <span style={{ flex: 1 }}>{i.billRef} · {i.billDate}</span><span style={{ color: 'var(--t2)' }}>due {money(i.pending)}</span>
            <input type="number" className="inp" style={{ width: 110 }} value={alloc[i._id] || ''} onChange={e => setAlloc(a => ({ ...a, [i._id]: e.target.value }))} placeholder="0" />
          </div>)}
        </div></Field>}
      <Field label="Remarks"><input className="inp" value={f.remarks} onChange={e => set('remarks', e.target.value)} placeholder="cheque no, UTR, or anything worth noting (optional)" /></Field>
      <ErrorBox err={err} />
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btnp" disabled={busy || reading || !dealer || !(Number(f.amount) > 0)} onClick={() => run(() => col.recordPayment({
          dealerId: dealer.id, ...f, amount: Number(f.amount), proof: proof ? { mime: proof.mime, data: proof.data } : undefined,
          allocations: Object.entries(alloc).filter(([, v]) => Number(v) > 0).map(([invoiceId, amount]) => ({ invoiceId, amount: Number(amount) })) }))}>{busy ? 'Saving…' : 'Record payment'}</button>
      </div>
    </Modal>);
}

export function TaskForm({ dealer: preset, onClose, onDone }) {
  const { users, isStaff, currentUser } = useDealerCtx();
  const [dealer, setDealer] = useState(preset || null);
  const [f, setF] = useState({ type: 'CALL', priority: 'MEDIUM', dueDate: today(), dueTime: '', description: '', employeeId: currentUser?.id || '' });
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const { busy, err, run } = useSubmit(r => { onDone?.(r); onClose(); });
  return (
    <Modal title="New task" onClose={onClose}>
      <Field label="Dealer"><DealerPicker value={dealer} onChange={setDealer} /></Field>
      <DealerSummary dealer={dealer} />
      <div className="g2">
        <Field label="Type"><select className="sel" style={{ width: '100%' }} value={f.type} onChange={e => set('type', e.target.value)}>{TASK_TYPES.map(m => <option key={m} value={m}>{t(m)}</option>)}</select></Field>
        <Field label="Priority"><select className="sel" style={{ width: '100%' }} value={f.priority} onChange={e => set('priority', e.target.value)}>{PRIORITY.map(m => <option key={m} value={m}>{t(m)}</option>)}</select></Field>
        <Field label="Due date"><input type="date" className="inp" value={f.dueDate} onChange={e => set('dueDate', e.target.value)} /></Field>
        <Field label="Due time"><input type="time" className="inp" value={f.dueTime} onChange={e => set('dueTime', e.target.value)} /></Field>
      </div>
      {isStaff && <Field label="Assign to"><select className="sel" style={{ width: '100%' }} value={f.employeeId} onChange={e => set('employeeId', e.target.value)}>{(users || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>}
      <Field label="Description"><textarea className="inp" rows={3} value={f.description} onChange={e => set('description', e.target.value)} /></Field>
      <ErrorBox err={err} />
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btnp" disabled={busy || !dealer} onClick={() => run(() => col.createTask({ dealerId: dealer.id, ...f }))}>{busy ? 'Saving…' : 'Create task'}</button>
      </div>
    </Modal>);
}

export function WhatsAppForm({ dealer, onClose, onDone }) {
  const [templates, setTemplates] = useState([]);
  const [key, setKey] = useState('');
  const [preview, setPreview] = useState(null);
  const [to, setTo] = useState(dealer?.phone || '');
  const [remember, setRemember] = useState(true);
  const { busy, err, run } = useSubmit(r => { onDone?.(r); onClose(); });
  const digits = String(to).replace(/\D/g, '');
  const toOk = digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
  useEffect(() => { col.waTemplates().then(ts => { const a = ts.filter(x => x.active !== false); setTemplates(a); setKey(a[0]?.key || ''); }).catch(() => {}); }, []);
  useEffect(() => { if (!key || !dealer) return; col.waPreview(dealer.id, key).then(setPreview).catch(e => setPreview({ error: e.message })); }, [key, dealer]);
  return (
    <Modal title={`WhatsApp · ${dealer?.name || ''}`} onClose={onClose}>
      <DealerSummary dealer={dealer} />
      <Field label="Send to (WhatsApp number)" hint={dealer?.phone ? '' : 'No number on record for this dealer yet.'}>
        <div className="row" style={{ gap: 8 }}>
          <input className="inp" value={to} onChange={e => setTo(e.target.value)} placeholder="10-digit mobile" />
          {!dealer?.phone || digits !== String(dealer.phone) ? <label className="row" style={{ fontSize: 12, gap: 5, whiteSpace: 'nowrap' }}><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> save to dealer</label> : null}
        </div>
      </Field>
      <Field label="Template"><select className="sel" style={{ width: '100%' }} value={key} onChange={e => setKey(e.target.value)}>{templates.map(x => <option key={x.key} value={x.key}>{x.key}</option>)}</select></Field>
      <Field label="Preview"><div style={{ whiteSpace: 'pre-wrap', fontSize: 13, padding: 12, borderRadius: 8, background: 'var(--bg2)', border: '1px solid var(--b1)', minHeight: 60 }}>{preview?.error ? <span style={{ color: 'var(--red)' }}>{preview.error}</span> : (preview?.preview || '…')}</div></Field>
      <ErrorBox err={err} />
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btnp" disabled={busy || !key || !dealer || !toOk || preview?.error} onClick={() => run(async () => {
          if (remember && digits !== String(dealer.phone || '')) await col.setContact(dealer.id, { phone: digits });
          return col.waSend({ dealerId: dealer.id, templateKey: key, to: digits.length === 10 ? '91' + digits : digits });
        })}>{busy ? 'Queuing…' : 'Send'}</button>
      </div>
    </Modal>);
}
