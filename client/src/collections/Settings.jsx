import { SlidersHorizontal } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { col } from './api';
import { WhatsAppForm } from './forms';
import { useLoad, PageHead, Card, Table, Badge, Tabs, Busy, ErrorBox, fmtWhen, useDealerCtx, title, DealerPicker, WhatsAppIcon, CallButton } from './ui';

/**
 * Settings — every business rule the module applies, editable in place and
 * audited on the server. The automation rules and the weights are the two
 * that change behaviour the most, so they get their own editors.
 */
export default function Settings() {
  const { features } = useDealerCtx();
  const canEdit = features.has('collections.settings');
  const [tab, setTab] = useState('rules');
  const { data, busy, err, reload } = useLoad(() => col.settings(), []);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => { if (data) setDraft(JSON.parse(JSON.stringify(data.settings))); }, [data]);
  if (busy && !data) return <Busy />;
  if (err) return <ErrorBox err={err} onRetry={reload} />;
  const s = draft, d = data.defaults;
  const set = (k, v) => setDraft(x => ({ ...x, [k]: v }));
  const save = async k => { setSaving(k); setMsg(''); try { const r = await col.setSetting(k, s[k]); set(k, r.value); setMsg(`Saved ${k.replace('collections.', '')}.`); } catch (e) { setMsg('Error: ' + e.message); } finally { setSaving(''); } };
  const Row = ({ k, label, hint, children }) => <div className="col-setting" style={{ display: 'grid', gridTemplateColumns: '220px 1fr auto', gap: 12, alignItems: 'start', padding: '10px 0', borderBottom: '1px solid var(--b1)' }}>
    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>{hint && <div style={{ fontSize: 11, color: 'var(--t3)' }}>{hint}</div>}</div>
    <div>{children}</div>
    <div>{canEdit && <button className="btnp" data-tip="Save this setting" style={{ padding: '5px 12px', fontSize: 12 }} disabled={saving === k || JSON.stringify(s[k]) === JSON.stringify(data.settings[k])} onClick={() => save(k)}>{saving === k ? 'Saving…' : 'Save'}</button>}</div>
  </div>;
  const NumList = ({ k }) => <input className="inp" value={(s[k] || []).join(', ')} onChange={e => set(k, e.target.value.split(',').map(x => Number(x.trim())).filter(n => Number.isFinite(n)))} disabled={!canEdit} />;
  const Num = ({ k }) => <input type="number" className="inp" style={{ maxWidth: 200 }} value={s[k] ?? ''} onChange={e => set(k, Number(e.target.value))} disabled={!canEdit} />;
  const ObjNums = ({ k, keys }) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 6 }}>{(keys || Object.keys(s[k] || {})).map(kk => <label key={kk} className="row" style={{ fontSize: 12, gap: 6 }}><span style={{ flex: 1, color: 'var(--t2)' }}>{title(kk)}</span><input type="number" className="inp" style={{ width: 80 }} value={s[k]?.[kk] ?? ''} onChange={e => set(k, { ...s[k], [kk]: Number(e.target.value) })} disabled={!canEdit} /></label>)}</div>;
  const weightSum = Object.values(s['collections.reviewWeights'] || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  return (
    <div>
      <PageHead icon={SlidersHorizontal} tone="var(--t2)" title="Collection settings" sub={canEdit ? 'Changes apply immediately and are audited.' : 'Read-only — ask an admin for the collections.settings feature to edit.'} right={msg && <span style={{ fontSize: 12, color: msg.startsWith('Error') ? 'var(--red)' : 'var(--grn)' }}>{msg}</span>} />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'rules', label: 'Business rules' }, { id: 'automation', label: 'Automation' }, { id: 'whatsapp', label: 'WhatsApp' }]} />
      {tab === 'rules' && <Card>
        <Row k="collections.companyName" label="Company name" hint="Used in WhatsApp messages"><input className="inp" value={s['collections.companyName'] || ''} onChange={e => set('collections.companyName', e.target.value)} disabled={!canEdit} /></Row>
        <Row k="collections.balanceModeDefault" label="Excel columns mean" hint="Used when a file cannot be detected"><select className="sel" value={s['collections.balanceModeDefault']} onChange={e => set('collections.balanceModeDefault', e.target.value)} disabled={!canEdit}><option value="buckets">Bills raised that month — total is the sum</option><option value="snapshot">Running balance — total is the latest month</option></select></Row>
        <Row k="collections.agingBuckets" label="Ageing bands (days)" hint={`Default ${d['collections.agingBuckets'].join(', ')}`}><NumList k="collections.agingBuckets" /></Row>
        <Row k="collections.overdueDays" label="Overdue after (days)" hint="Age of the oldest month before a balance is overdue"><Num k="collections.overdueDays" /></Row>
        <Row k="collections.highValue" label="High-value balance (₹)"><Num k="collections.highValue" /></Row>
        <Row k="collections.workingDays" label="Working days" hint="0 = Sunday … 6 = Saturday"><NumList k="collections.workingDays" /></Row>
        <Row k="collections.visitTargetPerMonth" label="Visit target per month" hint="Feeds the dealer-visits metric"><Num k="collections.visitTargetPerMonth" /></Row>
        <Row k="collections.followupEditWindowMinutes" label="Follow-up edit window (minutes)" hint="After this a follow-up is history"><Num k="collections.followupEditWindowMinutes" /></Row>
        <Row k="collections.whatsappRatePerMinute" label="WhatsApp messages per minute"><Num k="collections.whatsappRatePerMinute" /></Row>
        <Row k="collections.priorityThresholds" label="Priority thresholds" hint="A dealer is CRITICAL / HIGH / MEDIUM when total OR age passes the line">
          {['critical', 'high', 'medium'].map(lv => <div key={lv} className="row" style={{ gap: 8, marginBottom: 4, fontSize: 12 }}><span style={{ width: 70, color: 'var(--t2)' }}>{title(lv)}</span>₹<input type="number" className="inp" style={{ width: 130 }} value={s['collections.priorityThresholds']?.[lv]?.total ?? ''} onChange={e => set('collections.priorityThresholds', { ...s['collections.priorityThresholds'], [lv]: { ...s['collections.priorityThresholds'][lv], total: Number(e.target.value) } })} disabled={!canEdit} /> or <input type="number" className="inp" style={{ width: 80 }} value={s['collections.priorityThresholds']?.[lv]?.ageDays ?? ''} onChange={e => set('collections.priorityThresholds', { ...s['collections.priorityThresholds'], [lv]: { ...s['collections.priorityThresholds'][lv], ageDays: Number(e.target.value) } })} disabled={!canEdit} /> days</div>)}
        </Row>
        <Row k="collections.taskPoints" label="Task points" hint="Earned on completion; highValueThreshold is the ₹ line for a high-value collection"><ObjNums k="collections.taskPoints" /></Row>
        <Row k="collections.reviewWeights" label="Review weights" hint={`Must total 100 — currently ${weightSum}`}><ObjNums k="collections.reviewWeights" /></Row>
      </Card>}
      {tab === 'automation' && <Automation rules={s['collections.automationRules'] || []} onChange={v => set('collections.automationRules', v)} onSave={() => save('collections.automationRules')} dirty={JSON.stringify(s['collections.automationRules']) !== JSON.stringify(data.settings['collections.automationRules'])} canEdit={canEdit} saving={saving === 'collections.automationRules'} />}
      {tab === 'whatsapp' && <WhatsApp canEdit={canEdit} />}
    </div>);
}

const ACTIONS = ['createTask', 'cancelOpenTasks', 'sendWhatsApp', 'breakPromise'];
const TRIGGERS = ['tick', 'event:CLEARED', 'event:REOPENED', 'event:NEW_OUTSTANDING', 'event:INCREASED', 'event:DECREASED', 'event:PAYMENT_CONFIRMED', 'event:PAYMENT_BOUNCED', 'event:PROMISE_BROKEN'];
function Automation({ rules, onChange, onSave, dirty, canEdit, saving }) {
  const upd = (i, patch) => onChange(rules.map((r, j) => j === i ? { ...r, ...patch } : r));
  const updJson = (i, k, text) => { try { upd(i, { [k]: JSON.parse(text || '{}') }); } catch { /* keep typing */ } };
  return <Card title="Automation rules" right={canEdit && <button className="btnp" data-tip="Save all rule changes" style={{ padding: '5px 12px', fontSize: 12 }} disabled={!dirty || saving} onClick={onSave}>{saving ? 'Saving…' : 'Save rules'}</button>}>
    <div style={{ fontSize: 11.5, color: 'var(--t3)', marginBottom: 10 }}>Tick rules run every hour; event rules run when the statement or a payment changes a dealer. Conditions: minTotal, minAgeDays, noFollowupDays, noPaymentDays. Params: type, priority, assignTo ("approver" or a user id), templateKey.</div>
    {rules.map((r, i) => <div key={r.id} className="col-rule" style={{ display: 'grid', gridTemplateColumns: '24px 1.2fr 1fr 1fr 1.4fr 1.4fr auto', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--b1)', fontSize: 12 }}>
      <input type="checkbox" checked={r.enabled !== false} onChange={e => upd(i, { enabled: e.target.checked })} disabled={!canEdit} />
      <div><input className="inp" value={r.name || ''} onChange={e => upd(i, { name: e.target.value })} disabled={!canEdit} /><div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 2 }}>{r.id}</div></div>
      <select className="sel" value={r.trigger} onChange={e => upd(i, { trigger: e.target.value })} disabled={!canEdit}>{[...new Set([r.trigger, ...TRIGGERS])].map(t => <option key={t} value={t}>{t}</option>)}</select>
      <select className="sel" value={r.action} onChange={e => upd(i, { action: e.target.value })} disabled={!canEdit}>{ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}</select>
      <textarea className="inp" rows={2} defaultValue={JSON.stringify(r.conditions || {})} onBlur={e => updJson(i, 'conditions', e.target.value)} disabled={!canEdit} style={{ fontFamily: 'monospace', fontSize: 11 }} />
      <textarea className="inp" rows={2} defaultValue={JSON.stringify(r.params || {})} onBlur={e => updJson(i, 'params', e.target.value)} disabled={!canEdit} style={{ fontFamily: 'monospace', fontSize: 11 }} />
      {canEdit && <button className="btnd" data-tip="Delete this rule" onClick={() => onChange(rules.filter((_, j) => j !== i))}>Remove</button>}
    </div>)}
    {canEdit && <button className="btn" data-tip="Add a new automation rule" style={{ marginTop: 10 }} onClick={() => onChange([...rules, { id: 'rule-' + Date.now().toString(36), name: 'New rule', enabled: false, trigger: 'tick', conditions: {}, action: 'createTask', params: { type: 'FOLLOW_UP', priority: 'MEDIUM' } }])}>+ Add rule</button>}
  </Card>;
}

function WhatsApp({ canEdit }) {
  const status = useLoad(() => col.waStatus(), []);
  const tpl = useLoad(() => col.waTemplates(), []);
  const msgs = useLoad(() => col.waMessages({ limit: 50 }), []);
  const [edit, setEdit] = useState(null);
  return <div>
    <Card style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13 }}>WhatsApp sending: {status.data?.configured ? <><Badge v="CONFIRMED" label="configured" /> <span style={{ marginLeft: 6 }}>{status.data.provider === 'botmaster' ? `Bot Master Sender · from ${status.data.senderId}` : 'Meta Cloud API'}</span></> : <Badge v="FAILED" label="not configured" />}</div>
      {!status.data?.configured && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 4 }}>Set BOTMASTER_SENDER_ID + BOTMASTER_AUTH_TOKEN (Bot Master Sender) or the WA_* keys (Meta Cloud) on the server. Messages queue meanwhile and fail with a clear reason.</div>}
      {status.data?.provider === 'botmaster' && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 4 }}>Messages go out as plain text — the template body below, filled in. Bot Master reports "sent" only; delivered/read are not available.</div>}
    </Card>
    <PhoneManual canEdit={canEdit} />
    <PhoneUpload canEdit={canEdit} />
    <Card title="Templates" style={{ marginBottom: 12 }}>
      {tpl.busy && !tpl.data ? <Busy /> : <Table dense cols={[{ k: 'key', h: 'Key' }, { k: 'metaName', h: 'Meta template' }, { k: 'language', h: 'Lang' }, { k: 'category', h: 'Category' }, { k: 'body', h: 'Body', wrap: true, max: 460 }, { k: 'active', h: '', r: r => r.active === false ? <Badge v="CANCELLED" label="off" /> : <Badge v="CONFIRMED" label="on" /> }, { k: 'act', h: '', r: r => canEdit ? <button className="btn" data-tip="Edit the message text" style={{ fontSize: 11 }} onClick={() => setEdit({ ...r })}>Edit</button> : null }]} rows={tpl.data} keyOf={r => r.key} />}
    </Card>
    <Card title="Recent messages" pad={false}>
      {msgs.busy && !msgs.data ? <Busy /> : <Table dense cols={[{ k: 'createdAt', h: 'When', r: r => fmtWhen(r.createdAt) }, { k: 'templateKey', h: 'Template' }, { k: 'to', h: 'To' }, { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> }, { k: 'error', h: 'Error', wrap: true }]} rows={msgs.data?.items} empty="No messages yet." />}
    </Card>
    {edit && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setEdit(null); }}><div className="modal" style={{ maxWidth: 560 }}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Template · {edit.key}</div>
      <div className="g2"><div className="field"><label>Meta template name</label><input className="inp" value={edit.metaName || ''} onChange={e => setEdit(x => ({ ...x, metaName: e.target.value }))} /></div><div className="field"><label>Language</label><input className="inp" value={edit.language || ''} onChange={e => setEdit(x => ({ ...x, language: e.target.value }))} /></div></div>
      <div className="field"><label>Body — variables as {'{{name}}'}</label><textarea className="inp" rows={5} value={edit.body || ''} onChange={e => setEdit(x => ({ ...x, body: e.target.value }))} /></div>
      <label className="row" style={{ fontSize: 12, gap: 6, marginBottom: 12 }}><input type="checkbox" checked={edit.active !== false} onChange={e => setEdit(x => ({ ...x, active: e.target.checked }))} /> Active</label>
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}><button className="btn" onClick={() => setEdit(null)}>Cancel</button><button className="btnp" onClick={async () => { try { await col.saveTemplate(edit.key, { metaName: edit.metaName, language: edit.language, body: edit.body, active: edit.active }); setEdit(null); tpl.reload(); } catch (e) { alert(e.message); } }}>Save</button></div>
    </div></div>}
  </div>;
}

/** Dealer phone numbers from an Excel: preview what changes, then apply. */
function PhoneUpload({ canEdit }) {
  const [file, setFile] = useState(null); const [res, setRes] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const run = async commit => { if (!file) return; setBusy(true); setErr(''); try { setRes(await col.uploadPhones(file, commit)); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  const sm = res?.summary || {};
  return <Card title="Dealer phone numbers" style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 8 }}>Excel with <b>Party Name</b> (or <b>Code</b>) and <b>Phone</b>. Matched by code, else by exact name. 10-digit numbers get 91 in front. Nothing is written until you apply.</div>
    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
      <input type="file" className="inp" style={{ maxWidth: 360 }} accept=".xlsx,.xls,.csv" onChange={e => { setFile(e.target.files?.[0] || null); setRes(null); }} disabled={!canEdit} />
      <button className="btn" data-tip="Show what would change — nothing saved yet" disabled={!file || busy || !canEdit} onClick={() => run(false)}>{busy ? 'Reading…' : 'Preview'}</button>
      {res?.preview && <button className="btnp" disabled={busy || !((sm.NEW || 0) + (sm.CHANGED || 0))} onClick={() => run(true)}>Apply {((sm.NEW || 0) + (sm.CHANGED || 0))} numbers</button>}
    </div>
    <ErrorBox err={err} />
    {res && <div style={{ marginTop: 10 }}>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap', fontSize: 12, marginBottom: 8 }}>
        {res.preview ? <span className="chip">preview</span> : <span className="chip" style={{ color: 'var(--grn)' }}>applied · {res.updated} updated</span>}
        {['NEW', 'CHANGED', 'SAME', 'UNMATCHED', 'BAD_PHONE'].map(k => sm[k] ? <span key={k} className="chip" style={{ color: k === 'UNMATCHED' || k === 'BAD_PHONE' ? 'var(--red)' : undefined }}>{k.toLowerCase().replace('_', ' ')} {sm[k]}</span> : null)}
      </div>
      <Table dense cols={[{ k: 'party', h: 'Party in file' }, { k: 'dealer', h: 'Dealer matched' }, { k: 'before', h: 'Had' }, { k: 'phone', h: 'Phone' }, { k: 'status', h: '', r: r => <Badge v={r.status === 'UNMATCHED' || r.status === 'BAD_PHONE' ? 'FAILED' : r.status === 'SAME' ? 'UNCHANGED' : 'NEW'} label={r.status.toLowerCase().replace('_', ' ')} /> }]} rows={res.rows.filter(r => r.status !== 'SAME')} keyOf={r => r.party + r.phone} empty="Every number in the file is already on record." />
    </div>}
  </Card>;
}

/** Search a dealer, type the number, save — one at a time, right here. */
function PhoneManual({ canEdit }) {
  const [dealer, setDealer] = useState(null); const [phone, setPhone] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [done, setDone] = useState([]);
  const [current, setCurrent] = useState(null);
  const [wa, setWa] = useState(null);       // dealer to message, with the number just typed
  useEffect(() => { if (!dealer) { setCurrent(null); setPhone(''); return; } col.dealer360(dealer.id).then(d => { setCurrent({ phone: d.dealer.phone || '', optOut: !!d.dealer.whatsappOptOut }); setPhone(d.dealer.phone || ''); }).catch(() => setCurrent(null)); }, [dealer]);
  const digits = phone.replace(/\D/g, ''); const ok = digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
  const save = async () => { setBusy(true); setErr(''); try { const r = await col.setContact(dealer.id, { phone: digits }); setDone(x => [{ name: dealer.name, code: dealer.code, phone: r.phone, before: current?.phone || '' }, ...x].slice(0, 20)); setCurrent(c => ({ ...c, phone: r.phone })); setDealer(null); } catch (e) { setErr(e.message); } finally { setBusy(false); } };
  return <Card title="Add a dealer's number" style={{ marginBottom: 12 }}>
    <div className="col-phone" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) 200px auto', gap: 8, alignItems: 'start' }}>
      <DealerPicker value={dealer} onChange={setDealer} placeholder="Search dealer by name or code…" />
      <input className="inp" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" disabled={!dealer || !canEdit} onKeyDown={e => { if (e.key === 'Enter' && ok) save(); }} />
      <div className="row" style={{ gap: 6 }}>
        <button className="btnp" data-tip="Save this number on the dealer" disabled={!dealer || !ok || busy || !canEdit || digits === (current?.phone || '')} onClick={save}>{busy ? 'Saving…' : current?.phone ? 'Update' : 'Save'}</button>
        {dealer && ok && <CallButton dealer={{ ...dealer, phone: digits.length === 10 ? '91' + digits : digits }} label="Call" size={13} />}
        <button className="btn" style={{ color: '#25D366', display: 'inline-flex', gap: 5, alignItems: 'center' }} disabled={!dealer || !ok} data-tip="Send a WhatsApp to this number" onClick={() => setWa({ ...dealer, phone: digits.length === 10 ? '91' + digits : digits })}><WhatsAppIcon size={14} /> WhatsApp</button>
      </div>
    </div>
    {wa && <WhatsAppForm dealer={wa} onClose={() => setWa(null)} onDone={() => { if (dealer) col.dealer360(dealer.id).then(d => setCurrent({ phone: d.dealer.phone || '', optOut: !!d.dealer.whatsappOptOut })).catch(() => {}); }} />}
    {dealer && current && <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 6 }}>{current.phone ? `On record: +${current.phone}${current.optOut ? ' · opted out' : ''}` : 'No number on record yet.'}</div>}
    <ErrorBox err={err} />
    {done.length > 0 && <div style={{ marginTop: 10 }}><Table dense cols={[{ k: 'name', h: 'Dealer', r: r => <span>{r.name} {r.code && <span className="chip">{r.code}</span>}</span> }, { k: 'before', h: 'Was', r: r => r.before ? '+' + r.before : '—' }, { k: 'phone', h: 'Now', r: r => '+' + r.phone }]} rows={done} keyOf={r => r.name + r.phone} /></div>}
  </Card>;
}
