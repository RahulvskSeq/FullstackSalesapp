import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Filter, X as XIcon } from 'lucide-react';

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
  label = 'Categories',
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isMobile = useIsMobile();

  // Normalise input: accept [{category,total}] or [string]
  const items = (categories || []).map(c =>
    typeof c === 'string' ? { category: c, total: 0 } : c
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
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

  // On mobile, keep the button text very short so it doesn't overflow.
  const summary = isMobile
    ? (isAll ? 'All' : `${includedCount}/${totalCount}`)
    : (isAll
        ? `All ${totalCount}`
        : `${includedCount} of ${totalCount}${excluded.size === 1 ? `  ·  excl. ${[...excluded][0]}` : ''}`);

  // Dropdown panel (shared by desktop popup + mobile sheet)
  const panelInner = (
    <>
      {/* Header — Select all / Close */}
      <div style={{
        display:'flex', alignItems:'center', gap:8,
        padding:'8px 10px', borderBottom:'1px solid var(--b1)', marginBottom:6,
      }}>
        <span style={{fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em'}}>
          Include categories
        </span>
        <div style={{flex:1}}/>
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
              color:'#86efac', cursor:'pointer', fontWeight:600,
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
            background: off ? 'transparent' : 'rgba(99,102,241,.06)',
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
        style={{
          display:'inline-flex', alignItems:'center', gap:6,
          padding: compact ? '5px 10px' : '6px 12px',
          borderRadius:8,
          background: excluded.size ? 'rgba(251,191,36,.10)' : 'var(--bg2)',
          border:'1px solid '+(excluded.size ? 'rgba(251,191,36,.5)' : 'var(--b2)'),
          color: excluded.size ? '#fbbf24' : 'var(--t2)',
          fontSize: compact ? 11 : 12, fontWeight:600,
          cursor:'pointer',
          maxWidth:'100%',
          overflow:'hidden',
        }}>
        <Filter size={compact ? 11 : 12} style={{flexShrink:0}}/>
        <span style={{
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          minWidth:0,
        }}>
          {isMobile ? summary : `${label}: ${summary}`}
        </span>
        <ChevronDown size={compact ? 11 : 13}
          style={{transform: open ? 'rotate(180deg)' : 'none', transition:'transform .12s', flexShrink:0}}/>
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

      {open && isMobile && (
        /* Mobile bottom-sheet — full width, no off-screen clipping */
        <>
          <div
            onClick={()=>setOpen(false)}
            style={{
              position:'fixed', inset:0,
              background:'rgba(0,0,0,0.5)',
              zIndex:1000,
            }}
          />
          <div
            style={{
              position:'fixed',
              left:0, right:0, bottom:0,
              maxHeight:'80vh', overflowY:'auto',
              background:'var(--bg2)', border:'1px solid var(--b2)',
              borderTopLeftRadius:14, borderTopRightRadius:14,
              boxShadow:'0 -8px 30px rgba(0,0,0,0.55)',
              zIndex:1001,
              padding:8,
              paddingBottom:'max(12px, env(safe-area-inset-bottom))',
            }}>
            {/* drag handle hint */}
            <div style={{
              width:36, height:4, borderRadius:2,
              background:'var(--b2)', margin:'6px auto 8px',
            }}/>
            {panelInner}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryFilter;
