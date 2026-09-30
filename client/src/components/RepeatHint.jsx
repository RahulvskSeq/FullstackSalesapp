import React from 'react';

// how often a dealer is already on one salesman's calendar this month — shown while picking him
export default function RepeatHint({ dates = [], month = '' }) {
  if (!dates.length) return null;
  const nice = dates.map(d => new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })).join(', ');
  return <span className="vc-rep sm" title={'Already planned on ' + nice}>🔁 {dates.length}× in {month} · {dates.map(d => Number(d.slice(-2))).join(', ')}</span>;
}
