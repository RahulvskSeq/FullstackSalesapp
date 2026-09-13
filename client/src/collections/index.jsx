import React, { useState, useCallback, useMemo } from 'react';
import { DealerCtx } from './ui';
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
  const [params, setParams] = useState({});
  const go = useCallback((target, p) => { setParams(p || {}); navigate(target); }, [navigate]);
  const list = useMemo(() => Array.isArray(users) ? users : Object.values(users || {}), [users]);
  const ctx = useMemo(() => ({
    open: id => setDealerId(String(id)),
    users: list, currentUser,
    isStaff: ['admin', 'superadmin', 'employee'].includes(currentUser?.role),
    features: { has: key => !!hasFeature?.(key) },
  }), [list, currentUser, hasFeature]);
  const p = params;
  return (
    <DealerCtx.Provider value={ctx}>
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
    </DealerCtx.Provider>);
}
