import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Filter, X as XIcon, Check, RotateCcw, Save } from 'lucide-react';

/**
 * CategoryFilter — single compact button + dropdown with one checkbox per
 * category. Mobile-aware: on narrow viewports it expands into a centered
 * sheet so it doesn't clip off-screen, and the button label shortens to fit.
 *
 * Props
 *   categories    — [{ category, total }] or [string]
 *   excluded      — Set<string> of currently-excluded category names
 *   onToggle(cat) — flip include/exclude for one category
 *   onClear()     — clear all exclusions
 *   onSelectOnly(cat) — keep only this category visible
 *   label         — button label prefix (defaults to "Categories")
 *   compact       — small button variant
 */
const fmt = n => Number(n||0).toLocaleString('en-IN');

// Tiny hook — true when viewport is narrow enough to treat as mobile
function useIsMobile(breakpoint = 600) {
  const [m, setM] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const on = () => setM(window.innerWidth < breakpoint);
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, [breakpoint]);
  return m;
}

const CategoryFilter = ({
  categories = [],
  excluded   = new Set(),
  onToggle,
  onClear,
  onSelectOnly,
  onSaveAsDefault,
  // Optional: replace the whole excluded set in one write. When a caller
  // provides it, Select all / None cost a single update instead of one per
  // category (which also means one server push, not N).
  onSetExcluded,
  label = 'Categories',
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const sheetRef = useRef(null);   // the phone sheet lives in <body>, outside `ref`   // brief "Saved" on the phone sheet
  const ref = useRef(null);
  const isMobile = useIsMobile();

  // Normalise input: accept [{category,total}] or [string]
  const items = (categories || []).map(c =>
    typeof c === 'string' ? { category: c, total: 0 } : c
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (sheetRef.current && sheetRef.current.contains(e.target)) return;   // a tap inside the phone sheet
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc, { passive:true });
    // also close on hard back-press / esc
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    // Lock body scroll while the mobile sheet is open
    if (isMobile) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('mousedown', onDoc);
        document.removeEventListener('touchstart', onDoc);
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prev;
      };
    }
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, isMobile]);

  const totalCount    = items.length;
  const includedCount = items.filter(i => !excluded.has(i.category)).length;
  const isAll         = excluded.size === 0;
  const isNone        = totalCount > 0 && includedCount === 0;

  // Include everything / exclude everything.
  // Falls back to flipping only the categories that actually need it — the
  // hook's toggle re-reads storage each call, so sequential toggles compose
  // (same approach CategorySalesPanel already uses for its clear).
  const setAll = (includeEverything) => {
    if (onSetExcluded) {
      onSetExcluded(new Set(includeEverything ? [] : items.map(i => i.category)));
      return;
    }
    items.forEach(i => {
      const excludedNow = excluded.has(i.category);
      if (excludedNow === includeEverything) onToggle && onToggle(i.category);
    });
  };

  // On mobile, keep the button text very short so it doesn't overflow.
  const summary = isMobile
    ? (isAll ? 'All' : `${includedCount}/${totalCount}`)
    : (isAll
        ? `All ${totalCount}`
        : `${includedCount} of ${totalCount}${excluded.size === 1 ? `  ·  excl. ${[...excluded][0]}` : ''}`);

  // Dropdown panel (shared by desktop popup + mobile sheet)
  const panelInner = (
    <>
      {/* Header — Select all / Deselect all / Close.
          Wraps rather than overflowing, so the row stays usable on a phone. */}
      <div style={{
        display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
        padding:'8px 10px', borderBottom:'1px solid var(--b1)', marginBottom:6,
      }}>
        <span style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em'}}>
          Include categories
        </span>
        <div style={{flex:1, minWidth:0}}/>
        <button
          type="button"
          onClick={()=>setAll(true)}
          disabled={isAll}
          title="Include every category"
          style={{
            fontSize:11, padding:'4px 9px', borderRadius:6, fontWeight:600,
            border:'1px solid ' + (isAll ? 'var(--b1)' : 'var(--b2)'),
            background: isAll ? 'transparent' : 'var(--bg2)',
            color: isAll ? 'var(--t3)' : 'var(--t1)',
            cursor: isAll ? 'default' : 'pointer', opacity: isAll ? 0.5 : 1,
          }}>
          Select all
        </button>
        <button
          type="button"
          onClick={()=>setAll(false)}
          disabled={isNone}
          title="Exclude every category"
          style={{
            fontSize:11, padding:'4px 9px', borderRadius:6, fontWeight:600,
            border:'1px solid ' + (isNone ? 'var(--b1)' : 'var(--b2)'),
            background: isNone ? 'transparent' : 'var(--bg2)',
            color: isNone ? 'var(--t3)' : 'var(--t1)',
            cursor: isNone ? 'default' : 'pointer', opacity: isNone ? 0.5 : 1,
          }}>
          Deselect all
        </button>
        {onSaveAsDefault && (
          <button
            type="button"
            onClick={() => {
              onSaveAsDefault();
              // micro-feedback — flash the button background
              try {
                const btn = event && event.currentTarget;
                if (btn) {
                  const prev = btn.style.background;
                  btn.style.background = 'rgba(34,197,94,0.20)';
                  setTimeout(() => { btn.style.background = prev; }, 600);
                }
              } catch {}
            }}
            title="Remember this set of unchecks as the default — it'll be applied automatically on every future page load."
            style={{
              fontSize:11, padding:'4px 9px', borderRadius:6,
              border:'1px solid #15803d', background:'rgba(34,197,94,0.08)',
              color:'var(--grn)', cursor:'pointer', fontWeight:600,
            }}>
            Save as default
          </button>
        )}
        <button
          type="button"
          onClick={()=>{ if(onClear) onClear(); }}
          title="Reset to the saved default (or include all categories if no default was saved)."
          style={{
            fontSize:11, padding:'4px 9px', borderRadius:6,
            border:'1px solid var(--b2)', background:'transparent',
            color:'var(--acc)', cursor:'pointer',
          }}>
          Reset
        </button>
        {isMobile && (
          <button
            type="button"
            onClick={()=>setOpen(false)}
            aria-label="Close"
            style={{
              padding:6, borderRadius:6,
              border:'1px solid var(--b2)', background:'transparent',
              color:'var(--t2)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
            <XIcon size={13}/>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{fontSize:11,color:'var(--t3)',padding:14,textAlign:'center'}}>
          No categories yet for this month.
        </div>
      ) : items.map(({ category, total }) => {
        const off = excluded.has(category);
        return (
          <div key={category} style={{
            display:'flex',alignItems:'center',gap:8,
            padding:'8px 10px',borderRadius:6,
            background: off ? 'transparent' : 'color-mix(in srgb, var(--acc) 6%, transparent)',
            minHeight: isMobile ? 40 : 'auto',   // bigger tap target on mobile
          }}>
            <input
              type="checkbox"
              checked={!off}
              onChange={()=>onToggle && onToggle(category)}
              style={{cursor:'pointer',flexShrink:0,width:16,height:16}}
            />
            <span
              onClick={()=>onToggle && onToggle(category)}
              style={{
                flex:1, fontSize:12, fontWeight:600,
                color: off ? 'var(--t3)' : 'var(--t1)',
                cursor:'pointer',
                textDecoration: off ? 'line-through' : 'none',
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
              {category}
            </span>
            {total > 0 && (
              <span style={{fontSize:11,color:'var(--t3)',marginRight:6,flexShrink:0}}>
                {fmt(total)}
              </span>
            )}
            {onSelectOnly && items.length > 1 && (
              <button
                type="button"
                onClick={()=>onSelectOnly(category)}
                title={`Show only ${category}`}
                style={{
                  fontSize:10,padding:'3px 8px',borderRadius:5,
                  border:'1px solid var(--b2)',background:'transparent',
                  color:'var(--t3)',cursor:'pointer',flexShrink:0,
                }}>only</button>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <div ref={ref} style={{
      position:'relative',
      display:'inline-block',
      maxWidth:'100%',   // never overflow parent on tight rows
    }}>
      <button
        type="button"
        onClick={()=>setOpen(o=>!o)}
        title="Include or exclude categories from totals"
        className="cat-filter-btn"
        style={{
          display:'inline-flex', alignItems:'center', gap:8,
          padding: compact ? '6px 10px 6px 6px' : '7px 12px 7px 7px',
          borderRadius:10,
          // Filtering ON is a state worth noticing — the totals on screen are
          // not the full picture — so it fills the app's own indigo accent.
          // Amber was doing two jobs here: it also colours the "dormant" card
          // sitting right next to this button, so the two read as related when
          // they are not. Off, it stays a quiet neutral control.
          background: excluded.size ? 'var(--acc)' : 'var(--bg2)',
          border:'1.5px solid '+(excluded.size ? 'rgba(255,255,255,.28)' : 'var(--b2)'),
          color: excluded.size ? '#fff' : 'var(--t2)',
          fontSize: compact ? 11.5 : 12.5, fontWeight:700,
          cursor:'pointer',
          maxWidth:'100%',
          overflow:'hidden',
        }}>
        <span style={{
          width: compact ? 22 : 25, height: compact ? 22 : 25, borderRadius:7,
          flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
          background: excluded.size ? 'rgba(255,255,255,.18)' : 'var(--bg3)',
          border:'1px solid '+(excluded.size ? 'rgba(255,255,255,.26)' : 'var(--b1)'),
        }}>
          <Filter size={compact ? 12 : 13}/>
        </span>
        <span style={{
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          minWidth:0,
        }}>
          {isMobile ? (excluded.size ? `Category: ${summary}` : 'Category') : `${label}: ${summary}`}
        </span>
        <ChevronDown size={compact ? 12 : 14}
          style={{transform: open ? 'rotate(180deg)' : 'none', transition:'transform .12s',
                  flexShrink:0, opacity:.75}}/>
      </button>

      {open && !isMobile && (
        /* Desktop / tablet popup — right-anchored, never exceeds viewport */
        <div
          style={{
            position:'absolute', top:'calc(100% + 6px)', right:0,
            width:'max-content',
            minWidth:260,
            maxWidth:'min(380px, calc(100vw - 32px))',
            maxHeight:'60vh', overflowY:'auto',
            background:'var(--bg2)', border:'1px solid var(--b2)', borderRadius:10,
            boxShadow:'0 12px 32px rgba(0,0,0,0.45)', zIndex:200,
            padding:8,
          }}>
          {panelInner}
        </div>
      )}

      {open && isMobile && createPortal(
        /* Phone: a bottom sheet ABOVE the tab bar and the + button (portalled to <body>, so no
           page transform or stacking context can trap it) — header, its own scrolling list,
           and a fixed footer with Reset / Save as default / Done. */
        <div className="cf-wrap" onClick={() => setOpen(false)}>
          <div className="cf-sheet" ref={sheetRef} role="dialog" aria-label="Categories" onClick={e => e.stopPropagation()}>
            <div className="cf-grip" />
            <div className="cf-head">
              <div style={{ minWidth: 0, flex: 1 }}>
                <b>Categories</b>
                <small>{isAll ? `All ${totalCount} included` : `${includedCount} of ${totalCount} included`}</small>
              </div>
              <button type="button" className="cf-x" onClick={() => setOpen(false)} aria-label="Close"><XIcon size={16} /></button>
            </div>
            <div className="cf-quick">
              <button type="button" disabled={isAll} onClick={() => setAll(true)}>All</button>
              <button type="button" disabled={isNone} onClick={() => setAll(false)}>None</button>
              <span>tap a row to include or leave out · "only" keeps just that one</span>
            </div>
            <div className="cf-list">
              {items.length === 0 ? <div className="cf-empty">No categories yet for this month.</div>
              : items.map(({ category, total }) => {
                const off = excluded.has(category);
                return (
                  <div key={category} className={'cf-row' + (off ? ' off' : '')} role="checkbox" aria-checked={!off} tabIndex={0}
                    onClick={() => onToggle && onToggle(category)} onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle && onToggle(category); } }}>
                    <span className="cf-tick">{!off && <Check size={13} strokeWidth={3} />}</span>
                    <span className="cf-name">{category}</span>
                    {total > 0 && <span className="cf-n">{fmt(total)}</span>}
                    {onSelectOnly && items.length > 1 && <button type="button" className="cf-only" onClick={e => { e.stopPropagation(); onSelectOnly(category); }}>only</button>}
                  </div>
                );
              })}
            </div>
            <div className="cf-foot">
              <button type="button" className="cf-reset" onClick={() => { if (onClear) onClear(); }} title="Back to the saved default (or all categories)"><RotateCcw size={14} /> Reset</button>
              {onSaveAsDefault && <button type="button" className="cf-save" onClick={() => { onSaveAsDefault(); setSaved(true); setTimeout(() => setSaved(false), 1500); }} title="Use this set every time the app opens">
                {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save as default</>}</button>}
              <button type="button" className="cf-done" onClick={() => setOpen(false)}>Done</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CategoryFilter;
