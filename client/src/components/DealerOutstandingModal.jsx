import React, { useEffect, useState } from 'react';
import { X, Wallet, AlertTriangle, CalendarClock, HandCoins, RefreshCw } from 'lucide-react';
import { col } from '../collections/api';
import { money, fmtDate, periodLabel } from '../collections/ui';

// A dealer's money at a glance, opened from the Visit calendar before a visit:
// what is owed, how old it is, month by month, the last payments and any promise.
export default function DealerOutstandingModal({ dealerId, dealerName, onClose }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const load = () => { setErr(''); setD(null); col.dealer360(dealerId).then(setD).catch(e => setErr(e?.message || 'Could not load outstanding')); };
  useEffect(() => { if (dealerId) load(); }, [dealerId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const k = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);

  const b = d?.balance || null;
  const buckets = Object.entries(b?.buckets || {}).filter(([, v]) => Number(v) > 0).sort((x, y) => x[0].localeCompare(y[0]));
  const total = Number(b?.total || 0);
  const maxB = Math.max(1, ...buckets.map(([, v]) => Number(v)));
  const age = b?.ageDays;
  const ageTone = age == null ? 'var(--t3)' : age > 90 ? '#ef4444' : age > 60 ? '#f97316' : age > 30 ? '#f59e0b' : '#10b981';

  return (
    <div className="overlay dom-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dom" role="dialog" aria-label="Outstanding">
        <div className="dom-head">
          <span className="dom-ico"><Wallet size={18}/></span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="dom-eyebrow">Outstanding</div>
            <div className="dom-title">{d?.dealer?.name || dealerName}</div>
          </div>
          <button className="dom-x" onClick={load} title="Reload"><RefreshCw size={14}/></button>
          <button className="dom-x" onClick={onClose} aria-label="Close"><X size={16}/></button>
        </div>

        {err && <div className="dom-msg err"><AlertTriangle size={18}/>{/403|scope|permission/i.test(err) ? 'You do not have access to this dealer’s collections.' : err}</div>}
        {!err && !d && <div className="dom-body">{[0, 1, 2].map(i => <div key={i} className="skel" style={{ height: 52, borderRadius: 12 }}/>)}</div>}

        {d && (
          <div className="dom-body">
            <div className={'dom-total' + (total > 0 ? '' : ' clear')}>
              <span>{total > 0 ? 'Total outstanding' : 'Nothing outstanding'}</span>
              <b>{money(total)}</b>
              <small>{b?.lastSnapshotAsOn ? 'as per statement of ' + fmtDate(b.lastSnapshotAsOn) : 'no statement uploaded yet'}</small>
            </div>

            <div className="dom-facts">
              <div><span>Oldest due</span><b style={{ color: ageTone }}>{age != null ? `${age} days` : '—'}</b><small>{b?.oldestPeriod ? periodLabel(b.oldestPeriod) : ''}</small></div>
              <div><span>Last payment</span><b>{b?.lastPaymentAmount ? money(b.lastPaymentAmount) : '—'}</b><small>{b?.lastPaymentAt ? fmtDate(b.lastPaymentAt) : ''}</small></div>
              <div><span>Promise</span><b>{b?.promise?.amount ? money(b.promise.amount) : '—'}</b><small>{b?.promise?.date ? 'by ' + fmtDate(b.promise.date) : ''}</small></div>
            </div>

            {buckets.length > 0 && (
              <div className="dom-sec">
                {/* "buckets" statements list what is pending from each month (they add up to the total);
                    "snapshot" statements list the running balance at each month end (the latest is the total) */}
                <div className="dom-sec-t"><CalendarClock size={13}/> {b?.balanceMode === 'snapshot' ? 'Balance at each month end' : 'Pending by month'}</div>
                {buckets.map(([p, v]) => (
                  <div key={p} className="dom-bk">
                    <span className="dom-bk-m">{periodLabel(p)}</span>
                    <div className="dom-bk-bar"><div style={{ width: Math.max(4, Number(v) / maxB * 100) + '%' }}/></div>
                    <b>{money(v)}</b>
                  </div>
                ))}
              </div>
            )}

            {(d.payments || []).length > 0 && (
              <div className="dom-sec">
                <div className="dom-sec-t"><HandCoins size={13}/> Recent payments</div>
                {d.payments.slice(0, 5).map(p => (
                  <div key={p._id} className="dom-pay"><span>{fmtDate(p.date)}</span><span className="dom-pay-m">{p.mode || ''}</span><b>{money(p.amount)}</b></div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
