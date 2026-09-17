import { Trophy } from 'lucide-react';
import React, { useState } from 'react';
import { col } from './api';
import { useLoad, PageHead, Card, Table, Badge, Tabs, Modal, Field, Busy, ErrorBox, money, num, monthNow, userName, useDealerCtx, title } from './ui';

const METRICS = ['followupDiscipline', 'taskCompletion', 'onTimeUpdates', 'dealerVisits', 'promiseFollowUp', 'dataAccuracy', 'customerManagement', 'communicationQuality', 'systemUsage', 'taskPoints', 'collectionActivity', 'managerReview'];

/** The review matrix — generated from activity, weighted from Settings, finalised by a manager. */
export default function Employees() {
  const { users, isStaff, features } = useDealerCtx();
  const canReview = features.has('collections.reviews');
  const [tab, setTab] = useState('reviews');
  const [period, setPeriod] = useState(monthNow());
  const reviews = useLoad(() => col.reviews({ period }), [period]);
  const [range, setRange] = useState({ from: period + '-01', to: new Date().toISOString().slice(0, 10) });
  const activity = useLoad(() => col.activity(range), [JSON.stringify(range)]);
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const gen = async () => { setBusy(true); try { await col.generateReviews(period); reviews.reload(); } catch (e) { alert(e.message); } finally { setBusy(false); } };
  const byEmp = {}; for (const a of (activity.data || [])) { const e = byEmp[a.employeeId] || (byEmp[a.employeeId] = { employeeId: a.employeeId, days: 0 }); e.days++; for (const k of ['followups', 'calls', 'visits', 'tasksDone', 'tasksCreated', 'promisesTaken', 'promisesKept', 'promisesBroken', 'collected', 'points', 'paymentsRecorded']) e[k] = (e[k] || 0) + (a[k] || 0); }
  return (
    <div>
      <PageHead icon={Trophy} tone="#f59e0b" title={isStaff ? "Team performance" : "My activity"} sub="Activity is counted from what is recorded here; the review scores it against the weights in Settings." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'reviews', label: 'Monthly review' }, { id: 'activity', label: 'Activity' }]} />
      {tab === 'reviews' && <>
        <Card style={{ marginBottom: 12 }}><div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <input type="month" className="inp" style={{ maxWidth: 170 }} value={period} onChange={e => setPeriod(e.target.value)} />
          {canReview && <button className="btnp" data-tip="Score every salesman from this month's activity" disabled={busy} onClick={gen}>{busy ? 'Generating…' : 'Generate / refresh for all salesmen'}</button>}
        </div></Card>
        <Card pad={false}>
          {reviews.err ? <ErrorBox err={reviews.err} onRetry={reviews.reload} /> : reviews.busy && !reviews.data ? <Busy kind="table" rows={4} /> : <Table cols={[
            { k: 'employeeId', h: 'Employee', r: r => <b>{userName(users, r.employeeId)}</b> },
            { k: 'score', h: 'Score', align: 'right', r: r => <b style={{ color: r.score >= 70 ? 'var(--grn)' : r.score >= 40 ? 'var(--yel)' : 'var(--red)' }}>{Number(r.score || 0).toFixed(1)}</b> },
            ...METRICS.map(m => ({ k: m, h: title(m), align: 'right', r: r => r.metrics?.[m] == null ? '—' : Number(r.metrics[m]).toFixed(0) })),
            { k: 'status', h: 'Status', r: r => <Badge v={r.status} /> },
            { k: 'act', h: '', r: r => canReview ? <div className="row" style={{ gap: 4 }}><button className="btn" data-tip="Add the manager's score and notes" style={{ fontSize: 11 }} onClick={() => setEdit(r)}>Manager review</button>{r.status !== 'FINAL' && <button className="btne" data-tip="Lock this review" onClick={async () => { if (!window.confirm('Finalise this review? It stops changing with new activity.')) return; await col.finalizeReview(r._id).catch(e => alert(e.message)); reviews.reload(); }}>Finalise</button>}</div> : null },
          ]} rows={reviews.data} empty={canReview ? 'No reviews for this month yet — generate them.' : 'No review for this month yet.'} />}
        </Card>
        <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 8 }}>Each metric is 0–100 before weighting. Inputs: follow-ups met on the scheduled day, tasks done on time, visits vs the monthly target, promises followed up, records edited within the window, dealers with no activity, task points vs the best performer, collected vs outstanding.</div>
      </>}
      {tab === 'activity' && <>
        <Card style={{ marginBottom: 12 }}><div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <input type="date" className="inp" style={{ maxWidth: 160 }} value={range.from} onChange={e => setRange(x => ({ ...x, from: e.target.value }))} /><span style={{ color: 'var(--t3)' }}>to</span><input type="date" className="inp" style={{ maxWidth: 160 }} value={range.to} onChange={e => setRange(x => ({ ...x, to: e.target.value }))} />
          {canReview && <button className="btn" data-tip="Recount activity from the records for this range" onClick={async () => { await col.rebuildActivity(range.from, range.to).catch(e => alert(e.message)); activity.reload(); }}>Rebuild from records</button>}
        </div></Card>
        <Card pad={false}>
          {activity.err ? <ErrorBox err={activity.err} onRetry={activity.reload} /> : activity.busy && !activity.data ? <Busy kind="table" rows={4} /> : <Table cols={[
            { k: 'employeeId', h: 'Employee', r: r => <b>{userName(users, r.employeeId)}</b> }, { k: 'days', h: 'Active days', align: 'right' },
            { k: 'followups', h: 'Follow-ups', align: 'right' }, { k: 'calls', h: 'Calls', align: 'right' }, { k: 'visits', h: 'Visits', align: 'right' },
            { k: 'tasksDone', h: 'Tasks done', align: 'right' }, { k: 'promisesTaken', h: 'Promises', align: 'right' }, { k: 'promisesKept', h: 'Kept', align: 'right' }, { k: 'promisesBroken', h: 'Broken', align: 'right' },
            { k: 'paymentsRecorded', h: 'Payments', align: 'right' }, { k: 'collected', h: 'Collected', align: 'right', r: r => money(r.collected) }, { k: 'points', h: 'Points', align: 'right' },
          ]} rows={Object.values(byEmp).sort((a, b) => (b.points || 0) - (a.points || 0))} keyOf={r => r.employeeId} empty="No activity in this range." />}
        </Card>
      </>}
      {edit && <ManagerReview review={edit} onClose={() => setEdit(null)} onDone={reviews.reload} />}
    </div>);
}

function ManagerReview({ review, onClose, onDone }) {
  const { users } = useDealerCtx();
  const [f, setF] = useState({ managerReview: review.metrics?.managerReview ?? '', communicationQuality: review.metrics?.communicationQuality ?? '', notes: review.managerReview?.notes || '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  return <Modal title={`Manager review · ${userName(users, review.employeeId)} · ${review.period}`} onClose={onClose} width={460}>
    <div className="g2">
      <Field label="Manager score (0–100)"><input type="number" className="inp" min={0} max={100} value={f.managerReview} onChange={e => setF(x => ({ ...x, managerReview: e.target.value }))} /></Field>
      <Field label="Communication quality (0–100)"><input type="number" className="inp" min={0} max={100} value={f.communicationQuality} onChange={e => setF(x => ({ ...x, communicationQuality: e.target.value }))} /></Field>
    </div>
    <Field label="Notes"><textarea className="inp" rows={4} value={f.notes} onChange={e => setF(x => ({ ...x, notes: e.target.value }))} /></Field>
    <ErrorBox err={err} />
    <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}><button className="btn" onClick={onClose}>Cancel</button><button className="btnp" disabled={busy} onClick={async () => { setBusy(true); setErr(''); try { await col.managerReview(review._id, { managerReview: Number(f.managerReview), communicationQuality: Number(f.communicationQuality), notes: f.notes }); onDone(); onClose(); } catch (e) { setErr(e.message); } finally { setBusy(false); } }}>Save</button></div>
  </Modal>;
}
