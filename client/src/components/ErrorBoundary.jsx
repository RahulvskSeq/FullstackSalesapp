import React from 'react';

/**
 * One broken screen must not blank the whole app. A crash inside the page
 * area shows this card instead; the menu keeps working, and moving to any
 * other page (the boundary is keyed by page) starts it fresh.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('[screen crash]', this.props.name || '', error, info?.componentStack); }
  render() {
    // each page rises in as it opens (the boundary is keyed by page, so this runs per navigation)
    if (!this.state.error) return <div className="page-enter">{this.props.children}</div>;
    return (
      <div className="card fade" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center', padding: '28px 22px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 12px', display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--red) 14%, transparent)', color: 'var(--red)', fontSize: 22, fontWeight: 800 }}>!</div>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>This screen hit a problem</div>
        <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>Nothing was lost. Try again, or open another page from the menu.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btnp" onClick={() => this.setState({ error: null })}>Try again</button>
          <button className="btn" onClick={() => window.location.reload()}>Reload the app</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 14, wordBreak: 'break-word' }}>{String(this.state.error?.message || this.state.error).slice(0, 200)}</div>
      </div>
    );
  }
}
