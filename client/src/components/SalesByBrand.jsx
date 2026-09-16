import React, { useState, useEffect, useMemo } from 'react';
import { Tag, ChevronDown, ChevronRight, Search, X, Check } from 'lucide-react';
import { api } from '../api';
import CatalogueModal from './CatalogueModal';

/**
 * SalesByBrand — "Sales by Catalogue".
 *
 * The product-transaction export carries three levels. Two already drive the
 * app's own taxonomy:
 *
 *   Category Type  ->  Category      (LAMINATE, LINER, ...)
 *   Product Type   ->  Sub-Category  (1 MM, CHARCOAL, ...)
 *   Category       ->  the catalogue actually sold   <- this panel
 *
 * The third has no equivalent anywhere else in the app, so this is the only
 * place the catalogue split is visible. Rows exist only for months synced
 * from a transaction import; anything keyed in by hand has no catalogue and
 * is reported separately rather than silently dropped.
 *
 * Layout is a left filter rail (searchable, multi-select) beside the results,
 * so picking several catalogues and comparing them is one gesture rather than
 * a search-clear-search loop.
 */

/** "Sep-26" -> "2026-09". Mirrors the converter in CategorySalesPanel. */
function moLabelToYM(lbl) {
  if (!lbl) return '';
  const m = /^([A-Za-z]{3,})-(\d{2,4})$/.exec(lbl.trim());
  if (!m) return '';
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const mi = months.indexOf(m[1].slice(0, 3).toLowerCase());
  if (mi < 0) return '';
  let y = +m[2]; if (y < 100) y += 2000;
  return `${y}-${String(mi + 1).padStart(2, '0')}`;
}

const n = v => (v || 0).toLocaleString('en-IN');

export default function SalesByBrand({ monthLabel, salesman }) {
  const month = moLabelToYM(monthLabel);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState([]);   // empty = show the top few
  const [showAll, setShowAll] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);      // private-label mapping modal
  const [reloadKey, setReloadKey] = useState(0);
  // Narrow the catalogues to one or more app categories (LAMINATE, LINER…).
  const [cats, setCats] = useState([]);
  // Full drill-down for one catalogue, opened from a card.
  const [modalBrand, setModalBrand] = useState(null);
  const listRef = React.useRef(null);
  // The catalogue list is a dropdown, not a permanent column: it only opens
  // while you are actually picking, so it does not eat the panel's height.
  const [open, setOpen] = useState(false);
  const railRef = React.useRef(null);
  // Dealer/salesman detail for the open catalogue, fetched on demand so
  // expanding one does not mean loading all of them.
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!month) return;
    setLoading(true);
    const p = { month };
    if (salesman) p.salesman = salesman;
    if (cats.length) p.category = cats.join(',');
    api.salesByBrand(p)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [month, salesman, cats, reloadKey]);

  useEffect(() => {
    if (!expanded || !month) { setDetail(null); return; }
    setDetailLoading(true);
    const p = { month, brand: expanded };
    if (salesman) p.salesman = salesman;
    api.salesBrandDetail(p)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [expanded, month, salesman]);

  useEffect(() => {
    if (!open) return;
    const onDown = e => { if (railRef.current && !railRef.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  // Filtering leaves the list scrolled where it was, which can park the
  // matches out of sight. Jump back to the top whenever the search changes.
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = 0; }, [q]);

  const allRows = useMemo(() => (data?.rows || []).filter(r => r.brand), [data]);

  // The search box filters the LIST of catalogues to choose from, not the
  // results — so a selection made earlier survives typing a new search.
  const listed = useMemo(() => {
    const needle = q.trim().toUpperCase();
    if (!needle) return allRows;
    return allRows.filter(r => r.brand.toUpperCase().includes(needle));
  }, [allRows, q]);

  const TOP_N = 12;
  // Precedence: an explicit tick wins; then a live search, so typing a name
  // brings its card straight up; otherwise just the top few, because fifty
  // cards at once is a wall rather than a report.
  const shown = useMemo(() => {
    if (selected.length) return allRows.filter(r => selected.includes(r.brand));
    if (q.trim()) return listed;
    return showAll ? allRows : allRows.slice(0, TOP_N);
  }, [allRows, selected, q, listed, showAll]);

  const grandTotal = useMemo(() => allRows.reduce((a, r) => a + r.qty, 0), [allRows]);
  const shownTotal = useMemo(() => shown.reduce((a, r) => a + r.qty, 0), [shown]);

  const toggle = b => setSelected(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b]);
  const toggleCat = c => { setSelected([]); setCats(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]); };
  const catList = data?.categories || [];

  // Rendered in the header rather than as a side column: with the list
  // collapsed into a dropdown, a dedicated rail was 228px of empty space
  // squeezing the cards it was meant to filter.
  const CatalogueFilter = () => (
    <div ref={railRef} className="cat-filter" style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)' }} />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search catalogue…"
          className="sel"
          style={{ paddingLeft: 26, paddingRight: q ? 24 : 10, fontSize: 12, width: '100%', cursor: 'text' }}
        />
        {q && (
          <button onClick={() => { setQ(''); setOpen(false); }} title="Clear search"
            style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
                     background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 2 }}>
            <X size={12} />
          </button>
        )}
      </div>
            {open && (
              <div style={{
                position: 'absolute', zIndex: 30, top: '100%', left: 0, right: 0, marginTop: 5,
                border: '1px solid var(--b2)', borderRadius: 9, background: 'var(--bg1)',
                boxShadow: 'var(--shadowHover, 0 10px 30px rgba(0,0,0,.35))', overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em' }}>
                    {listed.length} of {allRows.length}
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                    <button className="btn" style={{ padding: '2px 7px', fontSize: 10.5 }}
                      onClick={() => setSelected([...new Set([...selected, ...listed.map(r => r.brand)])])}>
                      Select shown
                    </button>
                    <button className="btn" style={{ padding: '2px 7px', fontSize: 10.5 }} onClick={() => setOpen(false)}>
                      Done
                    </button>
                  </div>
                </div>

                <div className="cat-list" ref={listRef} style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {listed.length === 0 && (
                    <div style={{ padding: '12px 10px', fontSize: 11.5, color: 'var(--t3)' }}>
                      Nothing matches “{q.trim()}”.
                    </div>
                  )}
                  {listed.map(r => {
                    const on = selected.includes(r.brand);
                    return (
                      <div key={r.brand} className="cat-row"
                        onClick={() => toggle(r.brand)}
                        title={r.brand}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                          padding: '5px 9px', borderBottom: '1px solid var(--b1)',
                          background: on ? 'var(--accL)' : 'transparent',
                        }}>
                        <span style={{
                          width: 13, height: 13, flexShrink: 0, borderRadius: 3,
                          border: '1px solid ' + (on ? 'var(--acc)' : 'var(--b2)'),
                          background: on ? 'var(--acc)' : 'transparent',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {on && <Check size={9} style={{ color: '#fff' }} />}
                        </span>
                        <span style={{
                          flex: 1, minWidth: 0, fontSize: 11.5,
                          fontWeight: on ? 600 : 400, color: on ? 'var(--t1)' : 'var(--t2)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>{r.brand}</span>
                        <b style={{ fontSize: 11.5, fontVariantNumeric: 'tabular-nums', color: 'var(--t2)' }}>
                          {n(r.qty)}
                        </b>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
    </div>
  );

  if (!loading && !allRows.length) return null;

  return (
    <div className="card" style={{ marginBottom: 16, padding: 14 }}>
      <style>{`
        .cat-row:hover{background:var(--bg3)}
        .cat-filter{width:208px}
        /* On a phone the header wraps, so let the search use the full row
           rather than sit as a stub beside the total. */
        @media (max-width:560px){
          .cat-headright{width:100%;margin-left:0}
          .cat-filter{width:100%;flex:1 1 100%;order:9}
          .cat-list{max-height:240px}
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Tag size={15} style={{ color: 'var(--acc)' }} />
        <b style={{ fontSize: 14 }}>Sales by Catalogue{monthLabel ? ` — ${monthLabel}` : ''}</b>
        <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
          the catalogue sold, straight from the ERP
        </span>
        {/* The header total is always the MONTH, never the subset on screen —
            a capped or filtered view must not read as the whole month.
            What is currently visible is stated above the cards instead. */}
        <div className="cat-headright" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {selected.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--acc)', fontWeight: 600 }}>
              {selected.length} selected · {n(shownTotal)}
            </span>
          )}
          <CatalogueFilter />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--t3)' }}>Total</span>
            <b style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{n(grandTotal)}</b>
          </div>
        </div>
      </div>

      {mapOpen && (
        <MapLabelsModal month={month} onClose={() => setMapOpen(false)} onSaved={() => { setMapOpen(false); setReloadKey(k => k + 1); }} />
      )}

      {modalBrand && (
        <CatalogueModal
          brand={modalBrand}
          month={month}
          monthLabel={monthLabel}
          onClose={() => setModalBrand(null)}
        />
      )}

      {loading && <div style={{ padding: 16, textAlign: 'center', color: 'var(--t3)', fontSize: 12.5 }}>Loading…</div>}

      {!loading && (
        <div style={{ minWidth: 0 }}>

          {/* ── right: whatever is currently in scope ── */}
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                {selected.length
                  ? <>Showing <b style={{ color: 'var(--t2)' }}>{selected.length}</b> selected · {n(shownTotal)} units</>
                  : q.trim()
                    ? (shown.length
                        ? <>Showing <b style={{ color: 'var(--t2)' }}>{shown.length}</b> matching “{q.trim()}” · {n(shownTotal)} units</>
                        : <>Nothing matches “{q.trim()}”.</>)
                    : <>Showing top <b style={{ color: 'var(--t2)' }}>{shown.length}</b> of {allRows.length} · {n(shownTotal)} of {n(grandTotal)} units</>}
                {cats.length > 0 && <> · in <b style={{ color:'var(--acc)' }}>{cats.join(', ')}</b></>}
              </span>
              {!selected.length && !q.trim() && allRows.length > TOP_N && (
                <button className="btn" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setShowAll(v => !v)}>
                  {showAll ? `Show top ${TOP_N}` : `Show all ${allRows.length}`}
                </button>
              )}

              {/* What is picked stays visible with the list closed, so a
                  filtered view always says what it is filtered to. */}
              {selected.map(b => (
                <button key={b} onClick={() => toggle(b)} title="Remove"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                    background: 'var(--acc)', border: '1px solid var(--acc)', color: '#fff',
                    borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600, maxWidth: 200,
                  }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b}</span>
                  <X size={11} style={{ opacity: .85, flexShrink: 0 }} />
                </button>
              ))}
              {selected.length > 0 && (
                <button className="btn" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => setSelected([])}>
                  Clear all
                </button>
              )}
            </div>

            {/* Category filter. Answers "which catalogues sit inside LAMINATE?" —
                with one picked, every quantity on screen is that category's
                share of the catalogue, not the catalogue's whole book. */}
            {catList.length > 1 && (
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                <span style={{ fontSize:10, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.09em', marginRight:2 }}>
                  Category
                </span>
                <button onClick={() => { setCats([]); setSelected([]); }}
                  style={{
                    cursor:'pointer', borderRadius:5, padding:'3px 9px', fontSize:11,
                    fontWeight: cats.length ? 400 : 600,
                    border:'1px solid ' + (cats.length ? 'var(--b2)' : 'var(--acc)'),
                    background: cats.length ? 'var(--bg1)' : 'var(--acc)',
                    color: cats.length ? 'var(--t2)' : '#fff',
                  }}>All</button>
                {catList.map(c => {
                  const on = cats.includes(c.category);
                  return (
                    <button key={c.category} onClick={() => toggleCat(c.category)}
                      title={`${c.category} — ${n(c.qty)} units this month`}
                      style={{
                        cursor:'pointer', borderRadius:5, padding:'3px 9px', fontSize:11,
                        fontWeight: on ? 600 : 400,
                        border:'1px solid ' + (on ? 'var(--acc)' : 'var(--b2)'),
                        background: on ? 'var(--acc)' : 'var(--bg1)',
                        color: on ? '#fff' : 'var(--t2)',
                        display:'inline-flex', alignItems:'center', gap:6,
                      }}>
                      {c.category}
                      <span style={{ opacity:.7, fontVariantNumeric:'tabular-nums' }}>{n(c.qty)}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Hidden catalogues are stated, never silently dropped: a report
                that quietly omits sales is worse than one that shows clutter. */}
            {/* Parent families and dealer labels never show as cards; what could not
                be placed in a child catalogue is counted here instead. */}
            {(data?.ownName?.length > 0) && (
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>Child catalogues only ·</span>
                <span title={data.ownName.map(h => `${h.brand} ${n(h.qty)}`).join(' · ')}>
                  <b style={{ color: 'var(--t2)' }}>{n(data.ownNameQty)}</b> units in {data.ownName.length} parent / dealer-name catalogue{data.ownName.length === 1 ? '' : 's'} not shown — no child listing exists for them in the product master
                </span>
                <button className="btn" style={{ padding: '2px 8px', fontSize: 10.5 }} onClick={() => setMapOpen(true)}
                  title="Force a dealer private label onto a catalogue">
                  Map private labels
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))' }}>
              {shown.map(r => {
                const share = grandTotal ? (r.qty / grandTotal) * 100 : 0;
                const open = expanded === r.brand;
                return (
                  <div key={r.brand}
                    onClick={() => setModalBrand(r.brand)}
                    title="Open full details — products, dealers, salesmen, days"
                    style={{
                      padding: '9px 11px', borderRadius: 9, cursor: 'pointer',
                      background: 'var(--bg2)',
                      border: '1px solid ' + (open ? 'var(--acc)' : 'var(--b1)'),
                      alignSelf: 'start',
                    }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      {open ? <ChevronDown size={12} style={{ color: 'var(--acc)', flexShrink: 0 }} />
                            : <ChevronRight size={12} style={{ color: 'var(--t3)', flexShrink: 0 }} />}
                      <span style={{
                        fontSize: 12.5, fontWeight: 600, flex: 1, minWidth: 0,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{r.brand}</span>
                      {r.kind === 'parent' && <span className="chip" title="Parent family — no child listing in the master, so it is shown as itself" style={{ fontSize: 9, padding: '0 5px', color: 'var(--t3)' }}>family</span>}
                      {r.kind === 'label' && <span className="chip" title="Dealer private label that could not be placed — use Map private labels" style={{ fontSize: 9, padding: '0 5px', color: '#b45309' }}>label</span>}
                      <b style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>{n(r.qty)}</b>
                    </div>

                    <div style={{ height: 3, background: 'var(--b1)', borderRadius: 2, margin: '7px 0 5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(share, 1.5)}%`, background: 'var(--acc)', borderRadius: 2 }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--t3)' }}>
                      <span>{r.dealers} dealer{r.dealers === 1 ? '' : 's'}{r.fromLabels > 0 && <span title={`${n(r.fromLabels)} units came in under dealer private labels mapped to this catalogue`}> · {n(r.fromLabels)} via labels</span>}</span>
                      <span>{share.toFixed(1)}% of total</span>
                    </div>

                    {open && (
                      <div style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid var(--b1)' }}
                        onClick={e => e.stopPropagation()}>
                        {[...r.categories].sort((a, b) => b.qty - a.qty).map(c => (
                          <div key={c.category} style={{
                            display: 'flex', justifyContent: 'space-between', gap: 8,
                            fontSize: 11.5, padding: '2px 0',
                          }}>
                            <span style={{ color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.category}
                            </span>
                            <b style={{ fontVariantNumeric: 'tabular-nums' }}>{n(c.qty)}</b>
                          </div>
                        ))}

                        {detailLoading && (
                          <div style={{ fontSize: 11, color: 'var(--t3)', padding: '8px 0' }}>Loading dealers…</div>
                        )}

                        {!detailLoading && detail?.brand === r.brand && (
                          <>
                            {detail.salesmen?.length > 0 && (
                              <div style={{ marginTop: 9, paddingTop: 7, borderTop: '1px dashed var(--b1)' }}>
                                <div style={{ fontSize: 9.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5 }}>
                                  Salesmen
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {detail.salesmen.map(sm => (
                                    <span key={sm.salesman} className="chip" style={{ fontSize: 10.5 }}>
                                      {sm.salesman} <b style={{ color: 'var(--t1)' }}>{n(sm.qty)}</b>
                                      <span style={{ opacity: .7 }}> · {sm.dealers}d</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {detail.dealers?.length > 0 && (
                              <div style={{ marginTop: 9, paddingTop: 7, borderTop: '1px dashed var(--b1)' }}>
                                <div style={{ fontSize: 9.5, color: 'var(--t3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.09em', marginBottom: 5 }}>
                                  Dealers ({detail.dealers.length})
                                </div>
                                <div style={{ maxHeight: 168, overflowY: 'auto' }}>
                                  {detail.dealers.map((dd, i) => (
                                    <div key={i} style={{
                                      display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11.5,
                                      padding: '3px 0', borderBottom: '1px solid var(--b1)',
                                    }}>
                                      <span style={{ flex: 1, minWidth: 0, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        title={dd.dealer}>{dd.dealer}</span>
                                      <span style={{ color: 'var(--t3)', fontSize: 10.5, whiteSpace: 'nowrap' }}>{dd.salesmanName}</span>
                                      <b style={{ fontVariantNumeric: 'tabular-nums', minWidth: 34, textAlign: 'right' }}>{n(dd.qty)}</b>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {data?.unbranded > 0 && (
              <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--t3)' }}>
                {n(data.unbranded)} units have no catalogue — entered through Monthly Entry
                rather than imported from a transaction export.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Which catalogue is each dealer private label really? The ERP calls a
 * dealer's own-name catalogue ("INNERSPACE") a catalogue; the admin maps it to
 * the real one once and every report folds it in from then on.
 */
function MapLabelsModal({ month, onClose, onSaved }) {
  const [d, setD] = useState(null);
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    api.catalogueAliases(month ? { month } : {})
      .then(r => { setD(r); setDraft(r.aliases || {}); })
      .catch(e => setErr(e.message || 'Could not load'));
  }, [month]);
  const set = (label, target) => setDraft(x => { const y = { ...x }; if (target.trim()) y[label] = target.trim(); else delete y[label]; return y; });
  const save = async () => {
    setBusy(true); setErr('');
    try { await api.catalogueAliasesSave(draft, month ? { month } : {}); onSaved(); }
    catch (e) { setErr(e.message || 'Save failed'); setBusy(false); }
  };
  const labels = d?.labels || [];
  return (
    <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 640, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>Dealer private labels</div>
            <div style={{ fontSize: 11.5, color: 'var(--t2)', marginTop: 2 }}>These catalogue names are dealers' own labels. Each product is placed automatically in the real catalogue it belongs to (from the product master). Type a catalogue here only to force a whole label somewhere else.</div>
          </div>
          <button className="btn" onClick={onClose} style={{ marginLeft: 'auto', padding: '4px 7px' }}><X size={14} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '10px 18px' }}>
          {err && <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8 }}>{err}</div>}
          {!d && !err && <div style={{ fontSize: 12, color: 'var(--t3)' }}>Loading…</div>}
          {d && labels.length === 0 && <div style={{ fontSize: 12, color: 'var(--t3)' }}>No dealer-named catalogues this month.</div>}
          {labels.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead><tr style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Label (dealer)</th>
                <th style={{ textAlign: 'right', padding: '4px 8px' }}>Units</th>
                <th style={{ textAlign: 'left', padding: '4px 0' }}>Placed automatically</th>
                <th style={{ textAlign: 'left', padding: '4px 0 4px 8px' }}>Force to (optional)</th>
              </tr></thead>
              <tbody>
                {labels.map(l => {
                  const v = draft[l.brand] || '';
                  const known = !v || d.targets.includes(v);
                  return (
                    <tr key={l.brand} style={{ borderTop: '1px solid var(--b1)' }}>
                      <td style={{ padding: '6px 0', fontWeight: 600 }}>{l.brand}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--t2)' }}>{n(l.qty)}</td>
                      <td style={{ padding: '6px 0', fontSize: 11.5, color: 'var(--t2)' }}>
                        {(l.auto || []).length === 0 ? <span style={{ color: 'var(--t3)' }}>—</span>
                          : (l.auto || []).map(a => <div key={a.catalogue || '_'} style={{ whiteSpace: 'nowrap' }}>{a.catalogue ? <b style={{ color: 'var(--t1)' }}>{a.catalogue}</b> : <span style={{ color: 'var(--yel)' }}>not resolved · hidden</span>} <span style={{ fontVariantNumeric: 'tabular-nums' }}>{n(a.qty)}</span></div>)}
                      </td>
                      <td style={{ padding: '6px 0 6px 8px' }}>
                        <input className="inp" list="col-alias-targets" value={v} onChange={e => set(l.brand, e.target.value)} placeholder="automatic"
                          style={{ width: '100%', fontSize: 12, borderColor: v ? (known ? 'var(--grn)' : 'var(--yel)') : undefined }} />
                        {v && !known && <div style={{ fontSize: 10, color: 'var(--yel)' }}>not a known child catalogue — it will still be shown as a card</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <datalist id="col-alias-targets">{(d?.targets || []).map(t => <option key={t} value={t} />)}</datalist>
        </div>
        <div style={{ padding: '10px 18px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--t3)', marginRight: 'auto' }}>{Object.keys(draft).length} forced · {labels.filter(l => !draft[l.brand]).length} automatic</span>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btnp" onClick={save} disabled={busy || !d}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
