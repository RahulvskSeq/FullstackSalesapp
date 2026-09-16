import React, { useState, useCallback, useMemo } from 'react';
import { DealerCtx, Tooltips } from './ui';
import Dashboard from './Dashboard';
import Today from './Today';
import Outstanding from './Outstanding';
import Imports from './Imports';
import Payments from './Payments';
import FollowUps from './FollowUps';
import Tasks from './Tasks';
import Reconciliation from './Reconciliation';
import Reports from './Reports';
import Employees from './Employees';
import Settings from './Settings';
import Dealer360 from './Dealer360';
import RecordModal from './RecordModal';
import ApprovalsModal from './Approvals';

/**
 * Collections — the Outstanding + Collection CRM.
 *
 * One component for every screen in the nav group, so the Dealer 360 drawer
 * and the "go to this list with these filters" state survive moving between
 * views. The server owns scope and permissions; `hasFeature` here only
 * decides which buttons are worth showing.
 */
export const COL_SCREENS = new Set(['colDashboard', 'colToday', 'colOutstanding', 'colImports', 'colPayments', 'colFollowups', 'colTasks', 'colReconciliation', 'colReports', 'colEmployees', 'colSettings']);

export default function Collections({ view, currentUser, users, hasFeature, navigate }) {
  const [dealerId, setDealerId] = useState(null);
  const [rec, setRec] = useState(null);             // { kind, record, onChanged }
  const [pendingFor, setPendingFor] = useState(null); // dealerId whose pending entries to show
  const [bump, setBump] = useState(0);             // screens re-fetch after a modal action
  const [params, setParams] = useState({});
  const go = useCallback((target, p) => { setParams(p || {}); navigate(target); }, [navigate]);
  const list = useMemo(() => Array.isArray(users) ? users : Object.values(users || {}), [users]);
  const ctx = useMemo(() => ({
    open: id => setDealerId(String(id)),
    openRecord: (kind, record, onChanged) => setRec({ kind, record, onChanged }),
    openPending: dealerId => setPendingFor(String(dealerId)),
    // an amber row is a pending entry: open that, otherwise the dealer
    openRow: r => (r?.pendingRecorded > 0 || r?.pendingApproval > 0) ? setPendingFor(String(r.dealerId)) : setDealerId(String(r.dealerId)),
    users: list, currentUser,
    isStaff: ['admin', 'superadmin', 'employee'].includes(currentUser?.role),
    features: { has: key => !!hasFeature?.(key) },
  }), [list, currentUser, hasFeature]);
  const p = params;
  return (
    <DealerCtx.Provider value={ctx}>
      <Tooltips />
      {/* Phone layout for the module. Inline styles carry the desktop layout, so
          these override with !important — one place, instead of a media query
          per component. */}
      <style>{`
        .overlay .modal { max-height: 85vh; }
        @media (max-width: 768px) {
          /* grid children default to min-width:auto and get pushed wide by a long figure or a table */
          .col-2 > *, .stat-grid > *, .col-stats > *, .card, .stat-card { min-width: 0; max-width: 100%; }
          .col-2 { grid-template-columns: 1fr !important; }
          .col-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .col-setting { grid-template-columns: 1fr !important; }
          .col-setting > div:last-child { justify-self: end; }
          .col-rule { grid-template-columns: 24px 1fr !important; }
          .col-rule > *:nth-child(n+3) { grid-column: 2; }
          .col-phone { grid-template-columns: 1fr !important; }
          .col-drawer { padding: 12px !important; width: 94vw !important; max-width: 94vw !important; max-height: 88vh !important; margin: 0 !important; border-radius: 14px !important; }
          .overlay .modal { box-sizing: border-box; }
          .col-head > div:first-child { min-width: 0; }
          .col-head .page-title, .col-head div { overflow-wrap: anywhere; }
          .col-head { flex-direction: column; }
          .col-head .row { flex-wrap: wrap; }
          .col-scroll { margin: 0 -6px; }
          .col-table th:first-child, .col-table td:first-child { position: sticky; left: 0; z-index: 1; background: var(--bg1); box-shadow: 2px 0 0 var(--b1); }
          .col-table th, .col-table td { padding: 7px 8px !important; }
          .col-lbl { display: none; }   /* icons only on a phone; the tooltip still names them */
          .page-head .page-title { font-size: 19px !important; }
          .page-head .row button { padding: 6px 10px; font-size: 12px; }
          .tabs { gap: 0; }
          .tab { padding: 8px 10px; font-size: 12px; }
          .overlay { padding: 12px !important; align-items: center !important; }
          .overlay .modal:not(.col-drawer) { max-height: 86vh; border-radius: 14px; width: 94vw; max-width: 94vw; }
        }
        @media (max-width: 480px) {
          .col-months { grid-template-columns: repeat(2, minmax(0,1fr)) !important; row-gap: 8px !important; }
          .col-actions { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
          .col-actions > * { justify-content: center; width: 100%; box-sizing: border-box; }
          .col-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .stat-grid .stat-card > div:nth-child(2) { font-size: 16px !important; }
        }
      `}</style>
      {view === 'colDashboard' && <Dashboard go={go} />}
      {view === 'colToday' && <Today />}
      {view === 'colOutstanding' && <Outstanding params={p} key={JSON.stringify(p)} />}
      {view === 'colImports' && <Imports />}
      {view === 'colPayments' && <Payments params={p} key={JSON.stringify(p)} />}
      {view === 'colFollowups' && <FollowUps params={p} key={JSON.stringify(p)} />}
      {view === 'colTasks' && <Tasks params={p} key={JSON.stringify(p)} />}
      {view === 'colReconciliation' && <Reconciliation />}
      {view === 'colReports' && <Reports />}
      {view === 'colEmployees' && <Employees />}
      {view === 'colSettings' && <Settings />}
      {dealerId && <Dealer360 dealerId={dealerId} onClose={() => setDealerId(null)} />}
      {pendingFor && <ApprovalsModal dealerId={pendingFor} onClose={() => setPendingFor(null)} onChanged={() => setBump(b => b + 1)} />}
      {rec && <RecordModal kind={rec.kind} record={rec.record} onClose={() => setRec(null)} onChanged={() => { rec.onChanged?.(); setBump(b => b + 1); }} />}
    </DealerCtx.Provider>);
}
