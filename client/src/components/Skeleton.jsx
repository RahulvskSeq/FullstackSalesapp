import React from 'react';

/**
 * Skeleton placeholders for the incentive screens — the shape of what is
 * coming (tiles, chart, rows) with a shimmer, instead of the word "Loading".
 * Uses the .skel / .skel-wrap classes from Styles.jsx.
 *
 *   <Skeleton kind="dashboard" />  tiles + chart + list      (incentive dashboards)
 *   <Skeleton kind="table" />      header + rows              (This month, History)
 *   <Skeleton kind="form" />       cards with input rows      (Rule & setup)
 */
export const Bone = ({ w = '100%', h = 12, r = 6, style }) => (
  <div className="skel" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

const Rows = ({ n = 6, cols = 5 }) => (
  <div>
    <div style={{ display: 'grid', gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)`, gap: 14, padding: '8px 10px', borderBottom: '1px solid var(--b1)' }}>
      {Array.from({ length: cols }).map((_, i) => <Bone key={i} h={9} w={i === 0 ? '55%' : '70%'} />)}
    </div>
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: `2fr repeat(${cols - 1}, 1fr)`, gap: 14, padding: '12px 10px', borderBottom: '1px solid var(--b1)', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Bone w={28} h={28} r={14} /><Bone h={12} w={`${50 + ((i * 23) % 40)}%`} /></div>
        {Array.from({ length: cols - 1 }).map((_, j) => <Bone key={j} h={j === 1 ? 6 : 11} w={j === 1 ? '90%' : '60%'} r={j === 1 ? 3 : 6} />)}
      </div>
    ))}
  </div>
);

export default function Skeleton({ kind = 'dashboard', rows = 6 }) {
  if (kind === 'table') return (
    <div className="skel-wrap card" aria-busy="true" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', gap: 10, alignItems: 'center' }}><Bone w={140} h={13} /><Bone w={90} h={10} /></div>
      <Rows n={rows} />
    </div>
  );
  if (kind === 'form') return (
    <div className="skel-wrap" aria-busy="true" style={{ display: 'grid', gap: 14 }}>
      {[4, 3, 5, 4].map((n, k) => (
        <div key={k} className="card">
          <Bone w={160} h={13} style={{ marginBottom: 6 }} /><Bone w="70%" h={9} style={{ marginBottom: 14 }} />
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))` }}>
            {Array.from({ length: n }).map((_, i) => <div key={i}><Bone w="50%" h={9} style={{ marginBottom: 6 }} /><Bone h={34} r={8} /></div>)}
          </div>
        </div>
      ))}
    </div>
  );
  // dashboard
  return (
    <div className="skel-wrap" aria-busy="true">
      <div style={{ display: 'grid', gap: 10, marginBottom: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ padding: '14px 16px', display: 'flex', gap: 12 }}>
            <Bone w={36} h={36} r={10} />
            <div style={{ flex: 1 }}><Bone w="60%" h={9} style={{ marginBottom: 8 }} /><Bone w="45%" h={22} style={{ marginBottom: 6 }} /><Bone w="70%" h={9} /></div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr', marginBottom: 14 }}>
        <div className="card" style={{ padding: '14px 16px' }}>
          <Bone w={130} h={13} style={{ marginBottom: 6 }} /><Bone w={200} h={9} style={{ marginBottom: 14 }} />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 150, padding: '0 8px' }}>
            {[35, 60, 100, 45, 70, 55].map((h, i) => <Bone key={i} w="100%" h={`${h}%`} r={6} />)}
          </div>
        </div>
        <div className="card" style={{ padding: '14px 16px' }}>
          <Bone w={120} h={13} style={{ marginBottom: 12 }} />
          {[0, 1, 2].map(i => <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 12 }}><Bone w={16} h={16} r={8} /><div style={{ flex: 1 }}><Bone h={10} style={{ marginBottom: 6 }} /><Bone w="70%" h={10} /></div></div>)}
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--b1)', display: 'flex', gap: 10, alignItems: 'center' }}><Bone w={140} h={13} /><Bone w={160} h={10} /></div>
        <Rows n={rows} />
      </div>
    </div>
  );
}
