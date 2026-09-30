import React from 'react';

// how often a dealer is already on one salesman's calendar this month — shown while picking him
const ORD = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : n % 10] || 'th');
export default function RepeatHint({ dates = [], month = '' }) {
  if (!dates.length) return null;
  const nice = dates.map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ');
  return <span className="vc-rep sm" title={'Already planned on ' + nice}>🔁 Planned {dates.length}× in {month} · this makes {ORD(dates.length + 1)}</span>;
}
