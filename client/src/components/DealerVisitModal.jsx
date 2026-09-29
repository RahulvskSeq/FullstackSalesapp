import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, MapPin, Target, Wallet, Package, ClipboardList, CheckCircle2, AlertTriangle, History, Save, Phone, Camera, LogIn } from 'lucide-react';
import { api } from '../api';
import { VISIT_PURPOSES, fileToCompressedDataURL, getLocation } from './visitCapture';

/**
 * Dealer visit — the one screen a salesman opens before walking into a
 * counter, and the MOM he writes on the way out. Lives beside the existing
 * screens: nothing they do changes.
 *
 *   <DealerVisitSearch dealers={...} />   the search box on Overview
 *   <DealerVisitModal dealerId=... />      the summary + MOM form
 */

const money = v => '₹' + Math.round(Number(v) || 0).toLocaleString('en-IN');
const num = v => Number(v || 0).toLocaleString('en-IN');
const fmtDate = s => { if (!s) return '—'; const d = new Date(String(s).length === 10 ? s + 'T00:00:00' : s); return isNaN(d) ? String(s) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
const fmtDT = s => { if (!s) return '—'; const d = new Date(s); return isNaN(d) ? String(s) : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); };
const periodLabel = p => { if (!p || !/^\d{4}-\d{2}$/.test(p)) return p || ''; return new Date(p + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }); };
const ACTIONS = [['THREATENING', 'Threatening'], ['MOTIVATION', 'Motivation'], ['APPRECIATION', 'Appreciation'], ['CLOSE_COUNTER', 'Close the counter']];
const actionLabel = a => (ACTIONS.find(x => x[0] === a) || [])[1] || '—';

const S = {
  input: { width: '100%', fontSize: 13, padding: '8px 11px', borderRadius: 10, border: '1px solid var(--b2)', background: 'var(--bg2)', color: 'var(--t1)', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 },
  card: { border: '1px solid var(--b1)', borderRadius: 10, padding: '10px 12px', background: 'var(--bg1)' },
  chip: (c) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, color: c, background: `color-mix(in srgb, ${c} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${c} 35%, transparent)`, whiteSpace: 'nowrap' }),
};

/** One plain row of the form: label on the left, content on the right, a hairline between rows. */
function Row({ label, hint, children }) {
  return (
    <div className="dv-row dvm-grid" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10, padding: '10px 0', borderTop: '1px solid var(--b1)', alignItems: 'start' }}>
      <div><div style={{ fontSize: 12, fontWeight: 800, color: 'var(--t1)', paddingTop: 4 }}>{label}</div>{hint && <div style={{ fontSize: 10.5, color: 'var(--t3)', lineHeight: 1.4 }}>{hint}</div>}</div>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}

function Sec({ n, icon: Icon, title, sub, children, tone = 'var(--acc)' }) {
  return (
    <div className="dvm-sec" style={{ '--tone': tone }}>
      <div className="sec-title dvm-sec-h">
        {Icon && <span className="sec-ico dvm-sec-ico" style={{ '--tone': tone }}><Icon size={15} /><span className="dvm-n">{n}</span></span>}
        {!Icon && <span className="dvm-n dvm-n-solo">{n}</span>}
        <span style={{ minWidth: 0 }}>{title}</span>
        {sub && <span className="sec-note dvm-sec-sub">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

/* scoped look for the visit screen: section cards, hero, tabs, check-in box */
const DVM_CSS = `
  .dvm-wrap { backdrop-filter: blur(3px); }
  .dvm-card { border-radius: 20px !important; box-shadow: var(--shadowHover, 0 24px 60px rgba(0,0,0,.35)); }
  .dvm-hero { position: relative; padding: 16px 18px 12px; border-bottom: 1px solid var(--b1); display: flex; gap: 12px; align-items: flex-start;
    background: linear-gradient(135deg, color-mix(in srgb, var(--acc) 12%, var(--bg1)) 0%, var(--bg1) 70%); }
  .dvm-hero-av { width: 52px !important; height: 52px !important; border-radius: 16px !important; font-size: 17px !important; box-shadow: 0 4px 14px color-mix(in srgb, var(--acc) 18%, transparent); }
  .dvm-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-top: 6px; }
  .dvm-mchip { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 600; color: var(--t2); padding: 3px 9px; border-radius: 20px; background: var(--bg1); border: 1px solid var(--b1); max-width: 100%; overflow-wrap: anywhere; }
  .dvm-close { width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; border: 1px solid var(--b1); background: var(--bg1); color: var(--t2); cursor: pointer; flex-shrink: 0; transition: background .15s, color .15s; }
  .dvm-close:hover { background: var(--bg2); color: var(--red); }
  .dvm-tabs { padding: 10px 18px; border-bottom: 1px solid var(--b1); display: flex; }
  .dvm-sec { position: relative; overflow: hidden; background: var(--bg1); border: 1px solid var(--b1); border-radius: 16px; padding: 14px 14px 14px 18px; margin-bottom: 12px; box-shadow: var(--shadow, none); }
  .dvm-sec::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--tone); }
  .dvm-sec-h { margin-bottom: 10px !important; font-size: 14px !important; }
  .dvm-sec-ico { position: relative; }
  .dvm-n { position: absolute; right: -6px; top: -6px; min-width: 16px; height: 16px; padding: 0 3px; border-radius: 8px; background: var(--tone); color: #fff; font-size: 9.5px; font-weight: 800; display: grid; place-items: center; border: 2px solid var(--bg1); }
  .dvm-n-solo { position: static; width: 26px; height: 26px; border-radius: 9px; font-size: 12px; border: none; }
  .dvm-sec-sub { margin-left: auto; text-align: right; }
  .dvm-tile { padding: 12px 14px; border-radius: 14px; background: var(--bg2); border: 1px solid var(--b1); position: relative; overflow: hidden; }
  .dvm-flag { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; border-radius: 12px; background: color-mix(in srgb, var(--tone) 8%, var(--bg2)); border: 1px solid color-mix(in srgb, var(--tone) 25%, transparent); flex: 1 1 260px; min-width: 0; }
  .dvm-dot { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: var(--tone); color: #fff; flex-shrink: 0; }
  .dvm-scol { background: var(--bg2); border: 1px solid var(--b1); border-radius: 14px; padding: 10px 12px; min-height: 120px; min-width: 0; }
  .dvm-sitem { display: flex; gap: 6px; align-items: flex-start; font-size: 12.5px; padding: 6px 6px; margin: 0 -6px; border-radius: 8px; border-top: 1px solid var(--b1); }
  .dvm-visit { position: relative; overflow: hidden; padding: 16px; border-radius: 18px; border: 1px solid color-mix(in srgb, var(--tone) 35%, var(--b1)); background: linear-gradient(160deg, color-mix(in srgb, var(--tone) 10%, var(--bg1)) 0%, var(--bg1) 75%); }
  .dvm-visit-ico { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; flex-shrink: 0; color: #fff; background: var(--tone); box-shadow: 0 6px 18px color-mix(in srgb, var(--tone) 35%, transparent); }
  .dvm-visit-ico.live { animation: dvmPulse 2s ease-in-out infinite; }
  @keyframes dvmPulse { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tone) 45%, transparent); } 50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--tone) 0%, transparent); } }
  .dvm-cam { display: flex !important; align-items: center; justify-content: center; gap: 10px; width: 100%; margin-top: 12px; font-size: 15px !important; font-weight: 800 !important; padding: 14px 20px !important; border-radius: 14px !important; color: #fff !important; border: none !important; background: var(--tone) !important; box-shadow: 0 8px 22px color-mix(in srgb, var(--tone) 35%, transparent) !important; cursor: pointer; }
  .dvm-cam .dvm-cam-ico { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.22); }
  .dvm-cam:disabled { opacity: .7; cursor: progress; }
  .dvm-cam.alt { background: var(--bg1) !important; color: var(--tone) !important; border: 1.5px solid var(--tone) !important; box-shadow: none !important; }
  .dvm-cam.alt .dvm-cam-ico { background: color-mix(in srgb, var(--tone) 14%, transparent); }
  .dvm-plan { position: relative; overflow: hidden; padding: 12px 14px 12px 18px; margin-bottom: 12px; border-radius: 16px; background: color-mix(in srgb, #f59e0b 7%, var(--bg1)); border: 1px solid color-mix(in srgb, #f59e0b 30%, var(--b1)); }
  .dvm-plan::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #f59e0b; }
  .dvm-foot { background: color-mix(in srgb, var(--bg2) 60%, var(--bg1)); }
`;

/* ── search box for Overview ─────────────────────────────────────────── */
export function DealerVisitSearch({ dealers = [], compact = false }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(null);
  const box = useRef(null);
  // today's planned visits — only today, never past days; the office sees every salesman's
  const [today, setToday] = useState([]);
  const loadToday = () => { const t = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); api.visitPlans({ from: t, to: t }).then(r => setToday(r.items || [])).catch(() => setToday([])); };
  useEffect(() => { loadToday(); }, []);
  useEffect(() => { const h = e => { if (box.current && !box.current.contains(e.target)) setOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase(); if (s.length < 2) return [];
    return dealers.filter(d => (d.name || '').toLowerCase().includes(s) || (d.code || '').toLowerCase().includes(s) || (d.city || '').toLowerCase().includes(s)).slice(0, 12);
  }, [q, dealers]);
  return (
    <>
      <div ref={box} style={{ position: 'relative', marginBottom: compact ? 0 : 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: compact ? '7px 12px' : '9px 12px', borderRadius: compact ? 8 : 12, border: '1px solid var(--b1)', background: 'var(--bg1)' }}>
          <MapPin size={15} color="var(--acc)" />
          <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={compact ? 'Type the dealer name…' : 'Going to meet a dealer? Search the name for the visit summary and MOM…'}
                 style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--t1)', fontSize: 13.5, outline: 'none' }} />
          {q && <button onClick={() => { setQ(''); setOpen(false); }} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>}
        </div>
        {open && hits.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 10, boxShadow: '0 12px 30px rgba(0,0,0,.18)', maxHeight: 320, overflowY: 'auto' }}>
            {hits.map(d => (
              <div key={d._id || d.id} onClick={() => { setPick(d); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--b1)', display: 'flex', gap: 8, alignItems: 'center' }}
                   onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{[d.code, d.city, d.zone].filter(Boolean).join(' · ')}</div>
                </div>
                <span style={S.chip('var(--acc)')}>Open</span>
              </div>
            ))}
          </div>
        )}
        {open && q.trim().length >= 2 && !hits.length && <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, fontSize: 12, color: 'var(--t3)', padding: '6px 12px', background: 'var(--bg1)', border: '1px solid var(--b1)', borderRadius: 8, zIndex: 50 }}>No dealer matches "{q}"</div>}
        {today.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#b45309', marginBottom: 4 }}>Planned for today · {today.length} dealer{today.length === 1 ? '' : 's'} · {today.filter(p => p.status === 'DONE').length} visited</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {today.map((p, i) => (
                <button key={p._id} onClick={() => setPick({ _id: p.dealerId })} title={p.note ? `Office: ${p.note}` : 'Open the visit summary'}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${p.status === 'DONE' ? 'rgba(22,163,74,.4)' : 'rgba(180,83,9,.4)'}`, background: p.status === 'DONE' ? 'rgba(22,163,74,.10)' : 'rgba(180,83,9,.10)', color: p.status === 'DONE' ? 'var(--grn)' : '#b45309' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 8, background: p.status === 'DONE' ? 'var(--grn)' : '#b45309', color: '#fff', fontSize: 10, display: 'grid', placeItems: 'center' }}>{p.status === 'DONE' ? '✓' : i + 1}</span>
                  {p.dealerName}{p.salesmanName && today.some(x => x.salesmanId !== p.salesmanId) ? <span style={{ fontWeight: 500, opacity: .8 }}>· {String(p.salesmanName).split(' ')[0]}</span> : null}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {pick && <DealerVisitModal dealerId={pick._id || pick.id} dealerName={pick.name} onClose={() => { setPick(null); loadToday(); }} />}
    </>
  );
}

/* ── the summary + MOM ───────────────────────────────────────────────── */
export default function DealerVisitModal({ dealerId, dealerName = '', onClose }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null);
  const [tab, setTab] = useState('mom');       // mom | previous
  const [more, setMore] = useState({ show: false, has: false, give: false, back: false });
  const [sel, setSel] = useState([]);                     // ticked items across the four sample lists: { kind, id, from }
  const [dragOver, setDragOver] = useState('');
  const [sq, setSq] = useState('');                       // search across the four sample lists
  const hit = x => !sq.trim() || String(x.name || '').toLowerCase().includes(sq.trim().toLowerCase());
  const moveItems = async (items, to) => {
    if (!items.length) return; setBusy(true); setErr('');
    try { for (const it of items) await api.moveSample({ dealerId, kind: it.kind, id: it.id, to }); setSel([]); setD(await api.visitSummary(dealerId)); }
    catch (e) { setErr(e?.message || 'Could not move'); } finally { setBusy(false); }
  };   // sample lists: first 5, then "See all"
  const [f, setF] = useState({ dealerFormFilled: false, samplesShown: '', samplesGiven: '', samplesTakenBack: '', action: '', actionNote: '', paymentStatus: '', paymentCollected: '', paymentCollectionNote: '', reviewPaymentTerms: '', relineCreditDays: '', relineCreditLimit: '', relineNote: '', appUsageShown: false, remarks: '', previousReviewed: false, givenAllocationIds: [], returnedAllocationIds: [], returnedGivenIds: [] });
  // The form as it was before the user touched it (defaults + the prefill
  // below, or what was last saved). Anything different = unsaved MOM.
  const initF = useRef(f);
  const fRef = useRef(f); fRef.current = f;
  const requestClose = () => {
    const dirty = JSON.stringify(fRef.current) !== JSON.stringify(initF.current);
    if (dirty && !window.confirm('Discard the MOM you typed?')) return;
    onClose?.();
  };
  const closeRef = useRef(requestClose); closeRef.current = requestClose;
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const toggleIn = (k, id) => setF(x => ({ ...x, [k]: x[k].includes(id) ? x[k].filter(i => i !== id) : [...x[k], id] }));

  useEffect(() => {
    let dead = false; setErr('');
    api.visitSummary(dealerId).then(r => {
      if (dead) return; setD(r);
      // prefill from what the system knows; the salesman edits what differs
      const prefill = {
        dealerFormFilled: !!r.dealer.dealerFormDone,
        samplesTakenBack: r.samples.given.filter(g => g.takeBack).map(g => g.name).join(', '),
        previousMomId: r.moms[0]?._id || '',
      };
      initF.current = { ...initF.current, ...prefill };
      setF(x => ({ ...x, ...prefill }));
    }).catch(e => { if (!dead) setErr(e?.message || 'Could not load'); });
    return () => { dead = true; };
  }, [dealerId]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') closeRef.current(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const save = async () => {
    setBusy(true); setErr('');
    let r;
    try { r = await api.saveVisitMom(dealerId, { ...f, paymentCollected: Number(f.paymentCollected) || 0 }); }
    catch (e) { setErr(e?.message || 'Could not save'); setBusy(false); return; }
    // Saved. Record success before the reload so a failed refresh can't be
    // reported as a failed save (and retried into a duplicate MOM).
    setSaved(r.mom); initF.current = f; setTab('previous');
    try { setD(await api.visitSummary(dealerId)); } catch (_) { /* summary refresh is best-effort */ }
    setBusy(false);
  };

  const dl = d?.dealer, c = d?.collections, v = d?.volume, sm = d?.samples;
  const ed = !!d?.canEdit;                       // office edits; a salesman only reads
  const Added = ({ m }) => m ? <span style={{ fontSize: 10.5, color: 'var(--t3)', marginLeft: 6 }}>added {fmtDate(m.date)} by {m.userName}</span> : null;
  const RO = ({ label, value }) => value ? <div style={{ fontSize: 12.5, padding: '4px 0' }}><span style={{ color: 'var(--t3)' }}>{label}: </span>{value}</div> : null;
  const prev = d?.moms?.[0];
  const overLimit = c?.overLimit;

  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget) requestClose(); }} className="dvm-wrap" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 2000, display: 'grid', placeItems: 'center', padding: 14 }}>
      <style>{DVM_CSS + `
        @media (max-width: 640px) {
          .dvm-wrap { padding: 10px !important; }
          .dvm-card { width: 100% !important; max-height: calc(100dvh - 20px) !important; border-radius: 16px !important; }
          .dvm-head { padding: 12px 12px 10px !important; gap: 10px !important; }
          .dvm-head .dvm-title { font-size: 16px !important; }
          .dvm-hero-av { width: 42px !important; height: 42px !important; border-radius: 13px !important; font-size: 14px !important; }
          .dvm-tabs { padding: 8px 12px !important; }
          .dvm-tabs .seg { width: 100%; }
          .dvm-tabs .seg-b { flex: 1; padding: 6px 8px; }
          .dvm-body { padding: 10px !important; }
          .dvm-sec { padding: 12px 10px 12px 14px; border-radius: 14px; }
          .dvm-sec-sub { margin-left: 0; text-align: left; flex-basis: 100%; }
          .dvm-grid { grid-template-columns: 1fr !important; }
          .dvm-glance { grid-template-columns: 1fr 1fr !important; }
          .dvm-foot { padding: 8px 12px !important; }
        }
      `}</style>
      <div onClick={e => e.stopPropagation()} className="card dvm-card" style={{ width: 'min(920px,100%)', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* head */}
        <div className="dvm-head dvm-hero">
          {(() => { const nm = dl?.name || dealerName || '?'; return <span className="ini dvm-hero-av" style={{ '--h': nm.charCodeAt(0) * 37 % 360 }}>{nm.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'}</span>; })()}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--acc)' }}>Before you visit · your dealer at a glance</div>
            <div className="dvm-title" style={{ fontSize: 20, fontWeight: 850, lineHeight: 1.2, color: 'var(--t1)', letterSpacing: '-.01em', overflowWrap: 'anywhere' }}>{dl?.name || dealerName || ' '} {dl?.code && <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 600, letterSpacing: 0 }}>{dl.code}</span>}</div>
            {dl && <div className="dvm-meta">
              <span className="dvm-mchip"><MapPin size={11} /> {dl.zone || 'no zone'}{dl.city ? ' · ' + dl.city : ''}{dl.state ? ', ' + dl.state : ''}{dl.address ? ' · ' + dl.address : ''}{dl.pincode ? ' · ' + dl.pincode : ''}</span>
              <span className="dvm-mchip">Salesman <b style={{ color: 'var(--t1)' }}>{dl.salesmanName}</b></span>
              {dl.phone ? <a className="dvm-mchip" href={`tel:+${String(dl.phone).replace(/\D/g,'')}`} style={{ color: 'var(--acc)', textDecoration: 'none' }}><Phone size={11} /> {dl.phone}</a> : <span className="dvm-mchip" style={{ color: 'var(--red)' }}>no phone on master</span>}
              <span style={S.chip(dl.accountStatus === 'STAR' ? '#b45309' : dl.accountStatus === 'KEY ACCOUNT' ? 'var(--acc)' : dl.accountStatus === 'ACHIEVER' ? 'var(--grn)' : 'var(--t3)')}>{dl.accountStatus}</span>
              {dl.perfStatus && <span style={S.chip('var(--t3)')}>{dl.perfStatus}</span>}
              {d.lastVisit ? <span className="dvm-mchip" style={{ color: 'var(--t3)' }}><History size={11} /> Last visit {fmtDT(d.lastVisit.date)} · {d.lastVisit.by}</span> : <span className="dvm-mchip" style={{ color: 'var(--t3)' }}>No visit on record</span>}
            </div>}
          </div>
          <button onClick={requestClose} className="dvm-close" title="Close"><X size={16} /></button>
        </div>

        {/* tabs */}
        <div className="dvm-tabs">
          <div className="seg">
            {[['mom', 'Summary & this visit'], ['previous', `Earlier visits${d?.history?.length ? ` (${d.history.length})` : ''}`]].map(([k, l]) => (
              <button key={k} className={'seg-b' + (tab === k ? ' on' : '')} style={{ '--tone': 'var(--acc)' }} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="dvm-body" style={{ overflowY: 'auto', padding: 14, flex: 1 }}>
          {err && <div style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 10 }}>{err}</div>}
          {!d && !err && <div style={{ display: 'grid', gap: 10 }}>{[3, 2, 3, 2, 1, 4, 2].map((n, i) => (
            <div key={i} style={{ padding: '10px 12px', borderRadius: '0 10px 10px 0', borderLeft: '3px solid var(--b1)', background: 'var(--bg2)' }}>
              <div className="sk" style={{ width: 150, height: 12, borderRadius: 6, marginBottom: 10 }} />
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 8 }}>{Array.from({ length: n }).map((_, j) => <div key={j} className="sk" style={{ height: 34, borderRadius: 8 }} />)}</div>
            </div>))}
            <style>{`.sk{background:linear-gradient(90deg,var(--b1) 25%,var(--bg1) 50%,var(--b1) 75%);background-size:200% 100%;animation:skm 1.2s linear infinite}@keyframes skm{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
          </div>}
          {d && tab === 'mom' && (
            <div>
              {saved && <div className="dvm-flag" style={{ '--tone': 'var(--grn)', display: 'flex', color: 'var(--grn)', fontSize: 13, fontWeight: 700, marginBottom: 12 }}><span className="dvm-dot"><CheckCircle2 size={13} /></span> MOM saved for {fmtDate(saved.date)}.</div>}
              <PlanBox d={d} dealerId={dealerId} onChanged={async () => setD(await api.visitSummary(dealerId))} />

              <Sec n={1} icon={Target} title="Volume: this month vs target" sub={v?.avgMonths ? `6-month average from ${v.avgMonths} month${v.avgMonths === 1 ? '' : 's'}` : ''} tone="var(--acc)">
                {v?.current ? (() => { const c2 = v.current; const col = c2.pct == null ? 'var(--t1)' : c2.pct >= 100 ? 'var(--grn)' : c2.pct >= 70 ? '#b45309' : 'var(--red)'; const vsAvg = v.avg6 > 0 ? Math.round((c2.achieved - v.avg6) / v.avg6 * 100) : null; return (
                  <>
                    <div className="dvm-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="dvm-tile" style={{ borderLeft: `4px solid ${col}` }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{c2.isThisMonth ? 'This month' : 'Latest month'} · {c2.label}</div>
                        <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.1, color: col, marginTop: 4 }}>{num(c2.achieved)} <span style={{ fontSize: 15, color: 'var(--t3)', fontWeight: 700 }}>of {num(c2.target)}</span></div>
                        <div style={{ fontSize: 13, marginTop: 4, color: col, fontWeight: 700 }}>{c2.pct == null ? 'No target set' : c2.pct >= 100 ? `Target achieved · ${c2.pct}%` : `${c2.pct}% done · ${num(c2.toGo)} more to reach target`}</div>
                      </div>
                      <div className="dvm-tile" style={{ borderLeft: '4px solid var(--acc)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>6-month average</div>
                        <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>{num(v.avg6)} <span style={{ fontSize: 15, color: 'var(--t3)', fontWeight: 700 }}>per month</span></div>
                        <div style={{ fontSize: 13, marginTop: 4, color: vsAvg == null ? 'var(--t3)' : vsAvg >= 0 ? 'var(--grn)' : 'var(--red)', fontWeight: 700 }}>{vsAvg == null ? 'No earlier months to compare' : vsAvg >= 0 ? `This month is ${vsAvg}% above the average` : `This month is ${-vsAvg}% below the average`}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {v.months.map(m => <span key={m.label} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, border: '1px solid var(--b1)', background: m.ym === c2.ym ? 'color-mix(in srgb, var(--acc) 14%, transparent)' : 'var(--bg2)', color: 'var(--t2)' }}>{m.label} <b style={{ color: m.pct == null ? 'var(--t1)' : m.pct >= 100 ? 'var(--grn)' : 'var(--red)' }}>{num(m.achieved)}</b>{m.target ? <span style={{ color: 'var(--t3)' }}>/{num(m.target)}</span> : ''}</span>)}
                    </div>
                  </>); })() : <div style={{ fontSize: 12, color: 'var(--t3)' }}>No target or achievement recorded for this dealer yet.</div>}
                {dl.perfStatus && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Performance tier {dl.perfStatus}{dl.perfQty ? ` · ${num(dl.perfQty)} units in ${periodLabel(dl.perfMonth)}` : ''} · type {dl.dealerType}</div>}
              </Sec>

              <div className="dvm-sec" style={{ '--tone': dl.dealerFormDone ? 'var(--grn)' : 'var(--red)', display: 'flex', alignItems: 'stretch', gap: 10, flexWrap: 'wrap', padding: '12px 12px 12px 18px' }}>
                <div className="dvm-flag" style={{ '--tone': dl.dealerFormDone ? 'var(--grn)' : 'var(--red)' }}>
                  <span className="dvm-dot" style={{ fontSize: 11, fontWeight: 800 }}>2</span>
                  <b style={{ fontSize: 13, color: 'var(--t1)' }}>Dealer Form</b>
                  {ed ? <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, cursor: 'pointer' }}>
                    <input type="checkbox" checked={f.dealerFormFilled} onChange={e => set('dealerFormFilled', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--grn)' }} />
                    <span>{dl.dealerFormDone ? 'filled' : 'filled on this visit'}</span>
                  </label> : <span style={{ fontSize: 12.5, fontWeight: 700, color: dl.dealerFormDone ? 'var(--grn)' : 'var(--red)' }}>{dl.dealerFormDone ? 'Filled' : 'Not filled'}</span>}
                  {(dl.dealerFormDone || ed) && <span style={{ fontSize: 11, color: dl.dealerFormDone ? 'var(--t3)' : 'var(--red)' }}>{dl.dealerFormDone ? `${fmtDate(dl.dealerFormDoneAt)}${dl.dealerFormBy ? ' · ' + dl.dealerFormBy : ''}` : 'get it done on this visit'}</span>}
                </div>
                <div className="dvm-flag" style={{ '--tone': (ed ? f.appUsageShown : prev?.appUsageShown) ? 'var(--grn)' : 'var(--acc)' }}>
                  <span className="dvm-dot"><CheckCircle2 size={13} /></span>
                  <b style={{ fontSize: 13, color: 'var(--t1)' }}>App usage</b>
                  {ed ? <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12.5, cursor: 'pointer' }}>
                    <input type="checkbox" checked={f.appUsageShown} onChange={e => set('appUsageShown', e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--grn)' }} />
                    <span>showed the app and explained the features</span>
                  </label> : <span style={{ fontSize: 12.5, fontWeight: 700, color: prev?.appUsageShown ? 'var(--grn)' : 'var(--t3)' }}>{prev?.appUsageShown ? 'Shown' : 'Not shown yet'}</span>}
                  {ed && prev?.appUsageShown && <span style={{ fontSize: 11, color: 'var(--t3)' }}>marked shown<Added m={prev} /></span>}
                </div>
              </div>

              <Sec n={3} icon={AlertTriangle} title="Threatening · Motivation · Appreciation · Close the counter" sub="any one" tone="#b45309">
                {ed ? (
                  <>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {ACTIONS.map(([k, l]) => (
                        <button key={k} onClick={() => set('action', f.action === k ? '' : k)} className={'thr' + (f.action === k ? ' on' : '')} style={{ '--tone': '#f59e0b', fontSize: 12, padding: '6px 13px' }}>{l}</button>
                      ))}
                    </div>
                    <input value={f.actionNote} onChange={e => set('actionNote', e.target.value)} style={{ ...S.input, marginTop: 8 }} placeholder={f.action ? `What was said (${actionLabel(f.action).toLowerCase()})…` : 'Pick one above, then write what was said…'} />
                    {prev?.action && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>Current note: {actionLabel(prev.action)}{prev.actionNote ? ` — "${prev.actionNote}"` : ''}<Added m={prev} /></div>}
                  </>
                ) : prev?.action ? (
                  <div style={{ fontSize: 13 }}><span style={S.chip('#b45309')}>{actionLabel(prev.action)}</span>{prev.actionNote ? <span style={{ marginLeft: 8 }}>{prev.actionNote}</span> : ''}<Added m={prev} /></div>
                ) : <div style={{ fontSize: 12.5, color: 'var(--t3)' }}>Nothing decided yet by the office.</div>}
              </Sec>

              <Sec n={4} icon={Wallet} title="Payment" sub={c ? `statement ${fmtDate(c.lastSnapshotAsOn)} · terms ${dl.creditDays || 0} days · limit ${money(dl.creditLimit)}` : `terms ${dl.creditDays || 0} days · limit ${money(dl.creditLimit)}`} tone={c?.overdue ? 'var(--red)' : 'var(--grn)'}>
                {c ? (() => { const band = c.score >= 750 ? ['Excellent', '#16a34a'] : c.score >= 650 ? ['Good', '#65a30d'] : c.score >= 500 ? ['Fair', '#f59e0b'] : ['Poor', '#dc2626'];
                  const verdict = c.score >= 750 ? 'Paying on time. Safe to serve on the usual terms.' : c.score >= 650 ? 'Mostly on time. A gentle reminder on the visit is enough.' : c.score >= 500 ? 'Slipping. Collect before taking a fresh order.' : 'In bad shape. Collect first — no new credit until it improves.';
                  return (
                  <>
                    {/* figures and the dial on one line, same height */}
                    <div className="dvm-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 190px', gap: 10, alignItems: 'stretch' }}>
                      <div className="dvm-tile" style={{ padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Outstanding</div>
                        <div style={{ fontSize: 22, fontWeight: 900, margin: '2px 0' }}>{money(c.total)}</div>
                        <div style={{ fontSize: 11, color: overLimit ? 'var(--red)' : 'var(--t3)' }}>{overLimit ? `over the limit of ${money(dl.creditLimit)}` : dl.creditLimit ? `limit ${money(dl.creditLimit)}` : 'no limit set'}</div>
                        <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 6 }}>{c.lastPaymentAt ? <>Last paid <b style={{ color: 'var(--grn)' }}>{money(c.lastPaymentAmount)}</b> · {fmtDate(c.lastPaymentAt)}</> : <span style={{ color: 'var(--red)' }}>No payment on record</span>}</div>
                      </div>
                      <div className="dvm-tile" style={{ padding: '10px 12px', background: c.dueAmount > 0 ? 'color-mix(in srgb, var(--red) 7%, var(--bg2))' : 'color-mix(in srgb, var(--grn) 7%, var(--bg2))', borderColor: c.dueAmount > 0 ? 'color-mix(in srgb, var(--red) 25%, var(--b1))' : 'color-mix(in srgb, var(--grn) 25%, var(--b1))' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Due from {periodLabel(c.collectionMonth)}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, margin: '2px 0', color: c.dueAmount > 0 ? 'var(--red)' : 'var(--grn)' }}>{c.dueAmount > 0 ? money(c.dueAmount) : 'Clear'}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)' }}>{c.ageDays != null ? `oldest ${periodLabel(c.oldestPeriod)} · ${c.ageDays} days · credit ${dl.creditDays || 0} days` : ''}</div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
                          {Object.entries(c.buckets || {}).map(([p, a]) => <span key={p} style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 6, background: 'var(--bg1)', color: p === c.collectionMonth && a > 0 ? 'var(--red)' : 'var(--t2)' }}>{periodLabel(p)} <b>{money(a)}</b></span>)}
                        </div>
                      </div>
                      <div className="dvm-tile" style={{ padding: '4px 6px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <ScoreBar score={c.score} reasons={c.scoreReasons} small />
                      </div>
                    </div>
                    <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 12, background: `color-mix(in srgb, ${band[1]} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${band[1]} 30%, transparent)`, fontSize: 12.5, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <b style={{ color: band[1] }}>{band[0]}</b><span>{verdict}</span>
                      {c.promises?.length > 0 && <span style={{ color: c.promises[0].status === 'BROKEN' ? 'var(--red)' : 'var(--t2)', marginLeft: 'auto' }}>Promise {money(c.promises[0].amount - c.promises[0].received)} by {fmtDate(c.promises[0].date)} · {c.promises[0].status.toLowerCase().replace('_', ' ')}</span>}
                      {c.pendingRecorded > 0 && <span style={{ color: '#b45309' }}>{money(c.pendingRecorded)} recorded, not yet in a statement</span>}
                    </div>
                  </>); })() : <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 8 }}>No outstanding record in Collections for this dealer.</div>}

                {!ed && (
                  <div style={{ marginTop: 8, display: 'grid', gap: 2 }}>
                    <RO label="Agreed on payment" value={prev?.paymentStatus} />
                    {(() => { const t = (d.plans || []).find(p => p.isToday && p.collectTarget > 0); return t ? <RO label="To collect today" value={<b style={{ color: 'var(--grn)' }}>{money(t.collectTarget)}</b>} /> : null; })()}
                    {prev?.paymentCollected > 0 && <RO label="Collected last visit" value={`${money(prev.paymentCollected)}${prev.paymentCollectionNote ? ' · ' + prev.paymentCollectionNote : ''}`} />}
                    <RO label="Terms" value={prev?.reviewPaymentTerms} />
                    {(prev?.paymentStatus || prev?.paymentCollected > 0 || prev?.reviewPaymentTerms) && <div><Added m={prev} /></div>}
                  </div>
                )}
                {ed && (
                  <div style={{ marginTop: 10 }}>
                    <label style={S.label}>Agreed on payment</label>
                    <input value={f.paymentStatus} onChange={e => set('paymentStatus', e.target.value)} style={S.input} placeholder="what the dealer agreed…" />
                    <div className="dvm-grid" style={{ display: 'grid', gap: 8, gridTemplateColumns: '150px 1fr', marginTop: 8 }}>
                      <div><label style={S.label}>Collected today ₹{(() => { const t = (d.plans || []).find(p => p.isToday && p.collectTarget > 0); return t ? <span style={{ color: 'var(--grn)', textTransform: 'none', letterSpacing: 0 }}> · asked {money(t.collectTarget)}</span> : null; })()}</label><input type="number" min="0" value={f.paymentCollected} onChange={e => set('paymentCollected', e.target.value)} style={S.input} placeholder="0" /></div>
                      <div><label style={S.label}>Mode / reference</label><input value={f.paymentCollectionNote} onChange={e => set('paymentCollectionNote', e.target.value)} style={S.input} placeholder="cheque no, UTR, cash…" /></div>
                    </div>
                    <div className="dvm-grid" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 120px 140px', marginTop: 8 }}>
                      <div><label style={S.label}>Terms being kept?</label><input value={f.reviewPaymentTerms} onChange={e => set('reviewPaymentTerms', e.target.value)} style={S.input} placeholder={`now ${dl.creditDays || 0} days · limit ${money(dl.creditLimit)}`} /></div>
                      <div><label style={S.label}>New days</label><input type="number" min="0" value={f.relineCreditDays} onChange={e => set('relineCreditDays', e.target.value)} style={S.input} placeholder="blank" /></div>
                      <div><label style={S.label}>New limit ₹</label><input type="number" min="0" value={f.relineCreditLimit} onChange={e => set('relineCreditLimit', e.target.value)} style={S.input} placeholder="blank" /></div>
                    </div>
                    {(f.relineCreditDays !== '' || f.relineCreditLimit !== '') && <input value={f.relineNote} onChange={e => set('relineNote', e.target.value)} style={{ ...S.input, marginTop: 6 }} placeholder="why the terms change" />}
                  </div>
                )}
              </Sec>


              <Sec n={5} icon={ClipboardList} title="Remarks" tone="var(--t3)">
                {ed ? <textarea rows={2} value={f.remarks} onChange={e => set('remarks', e.target.value)} style={S.input} placeholder="Anything else worth remembering next time…" />
                    : <div style={{ fontSize: 13 }}>{prev?.remarks ? <>{prev.remarks}<Added m={prev} /></> : <span style={{ color: 'var(--t3)' }}>No remarks from the office.</span>}</div>}
              </Sec>

              <Sec n={6} icon={Package} title="Samples" sub={`${sm.given.filter(g => !g.takeBack).length} with the dealer · ${sm.toGive.length} to give · ${sm.given.filter(g => g.takeBack).length + sm.toTakeBack.length} to take back`} tone="#0891b2">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 12px', borderRadius: 12, border: '1px solid var(--b2)', background: 'var(--bg2)' }}>
                  <Search size={14} color="var(--t3)" />
                  <input value={sq} onChange={e => setSq(e.target.value)} placeholder="Search a sample in all four lists…" style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--t1)', fontSize: 12.5, outline: 'none' }} />
                  {sq && <button onClick={() => setSq('')} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', display: 'flex' }}><X size={13} /></button>}
                </div>
                {ed && <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>Drag a sample into any column, or tick a few and press "Move here" on the column you want. Changes save at once and the salesman sees them.</div>}
                {(() => {
                  const cols = [
                    // allotments (STAR / KEY ACCOUNT / ACHIEVER of the zone, or by the office) are to be GIVEN; the zone's other folders are to be SHOWN
                    { key: 'show', title: 'To be shown', tone: 'var(--acc)', more: 'show', empty: 'Nothing new for this zone.',
                      items: [
                        ...sm.toShow.map(x => ({ kind: 'sample', id: String(x.id), name: x.name, sub: `${x.zone}${x.stock ? ` · ${x.stock} in stock` : ' · no stock'}${x.addedAt ? ` · added ${fmtDate(x.addedAt)}` : ''}` })),
                      ] },
                    { key: 'has', title: 'Already has', tone: 'var(--t3)', more: 'has', empty: 'No sample with this dealer.',
                      items: [...sm.given].filter(g => !g.takeBack).sort((x, y) => String(y.date).localeCompare(String(x.date))).map(g => ({ kind: 'given', id: String(g.id), name: g.name, sub: `given ${fmtDate(g.date)}`, extra: g.sold3m ? `selling: ${num(g.sold3m)} in 3 months` : '' })) },
                    { key: 'give', title: 'To be given', tone: 'var(--grn)', more: 'give', empty: ed ? 'Nothing yet — move a sample here once the dealer wants it.' : 'Nothing to give yet.',
                      items: sm.toGive.map(x => ({ kind: 'alloc', id: String(x.id), name: x.name, sub: x.reason })) },
                    { key: 'back', title: 'To be taken back', tone: 'var(--red)', more: 'back', empty: ed ? 'Nothing yet — drag or move samples here.' : 'Nothing to take back.',
                      items: [...sm.given.filter(g => g.takeBack).map(g => ({ kind: 'given', id: String(g.id), name: g.name, sub: g.takeBackReason, warn: true })), ...sm.toTakeBack.filter(x => !sm.given.some(g => g.allocId === String(x.id))).map(x => ({ kind: 'alloc', id: String(x.id), name: x.name, sub: `flagged by office · given ${fmtDate(x.givenDate)}`, warn: true }))] },
                  ];
                  const isSel = it => sel.some(x => x.kind === it.kind && x.id === it.id);
                  const toggleSel = it => setSel(x => isSel(it) ? x.filter(y => !(y.kind === it.kind && y.id === it.id)) : [...x, { kind: it.kind, id: it.id, from: it.from }]);
                  return (
                    <div className="dvm-grid" style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
                      {cols.map(col => {
                        const all = col.items.map(it => ({ ...it, from: col.key })).filter(hit);
                        const shown = (more[col.more] || sq) ? all : all.slice(0, 5);
                        const selFromElsewhere = sel.filter(x => x.from !== col.key);
                        const over = dragOver === col.key;
                        return (
                          <div key={col.key}
                               onDragOver={e => { if (ed) { e.preventDefault(); setDragOver(col.key); } }} onDragLeave={() => setDragOver('')}
                               onDrop={e => { if (!ed) return; e.preventDefault(); setDragOver(''); try { const it = JSON.parse(e.dataTransfer.getData('text/plain')); if (it && it.from !== col.key) moveItems([it], col.key); } catch {} }}
                               className="dvm-scol" style={{ boxShadow: `inset 0 3px 0 ${col.tone}`, ...(over ? { background: `color-mix(in srgb, ${col.tone} 12%, var(--bg2))`, border: `2px dashed ${col.tone}` } : {}) }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                              <span style={{ fontSize: 12.5, fontWeight: 800, color: col.tone }}>{col.title}</span><span className="count-pill" style={{ color: col.tone, background: `color-mix(in srgb, ${col.tone} 14%, transparent)` }}>{all.length}</span>
                              {ed && selFromElsewhere.length > 0 && <button className="btnp" disabled={busy} style={{ fontSize: 10.5, padding: '2px 8px', marginLeft: 'auto' }} onClick={() => moveItems(selFromElsewhere, col.key)}>Move {selFromElsewhere.length} here</button>}
                            </div>
                            {shown.map(it => (
                              <div key={it.kind + it.id} draggable={ed} onDragStart={e => { e.dataTransfer.setData('text/plain', JSON.stringify(it)); e.dataTransfer.effectAllowed = 'move'; }}
                                   className="dvm-sitem" style={{ cursor: ed ? 'grab' : 'default', background: isSel(it) ? `color-mix(in srgb, ${col.tone} 10%, transparent)` : 'transparent' }}>
                                {ed && <input type="checkbox" checked={isSel(it)} onChange={() => toggleSel(it)} style={{ marginTop: 3 }} />}
                                <span style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontWeight: 600 }}>{it.star && <span title="Suggested for this dealer" style={{ color: 'var(--acc)', marginRight: 4 }}>★</span>}{it.name}</div>
                                  <div style={{ fontSize: 10.5, color: it.warn ? 'var(--red)' : 'var(--t3)' }}>{it.sub}{it.extra ? <span style={{ color: 'var(--grn)' }}> · {it.extra}</span> : null}</div>
                                </span>
                              </div>
                            ))}
                            {!all.length && <div style={{ fontSize: 12, color: 'var(--t3)' }}>{sq ? 'No match here.' : col.empty}</div>}
                            {all.length > 5 && !sq && <button className="btn" style={{ fontSize: 11, padding: '3px 8px', marginTop: 6 }} onClick={() => setMore(m => ({ ...m, [col.more]: !m[col.more] }))}>{more[col.more] ? 'Show less' : `See all ${all.length}`}</button>}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                {sm.requested?.length > 0 && <div style={{ fontSize: 11, color: '#b45309', marginTop: 6 }}>Asked by the salesman, waiting for admin: {sm.requested.map(r => r.name).join(', ')}</div>}
                {sm.bought3m?.length > 0 && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>Buying in the last 3 months: {sm.bought3m.map(b => `${b.brand} ${num(b.qty)}`).join(' · ')}.</div>}
                {!ed && (prev?.samplesShown || prev?.samplesGiven) && <div style={{ marginTop: 6 }}><RO label="Samples shown" value={prev.samplesShown} /><RO label="Notes on samples" value={prev.samplesGiven} /></div>}
                {ed && <div className="dvm-grid" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
                  <div><label style={S.label}>Other samples shown</label><input value={f.samplesShown} onChange={e => set('samplesShown', e.target.value)} style={S.input} placeholder="what else was shown" /></div>
                  <div><label style={S.label}>Other notes on samples</label><input value={f.samplesGiven} onChange={e => set('samplesGiven', e.target.value)} style={S.input} placeholder="anything else handed over or collected" /></div>
                </div>}
              </Sec>

              <Sec n={7} icon={History} title="Visit" sub={(() => { const lv = (d.history || []).find(h => h.kind === 'visit'); return lv ? `last visit ${fmtDT(lv.at)} · ${lv.by}${lv.minutes > 0 ? ` · ${lv.minutes} min` : ''}` : 'no visit on record yet'; })()} tone={d.activeVisit?.here ? 'var(--grn)' : 'var(--t3)'}>
                <VisitBox d={d} dealerId={dealerId} onChanged={async () => setD(await api.visitSummary(dealerId))} />
                {(d.history || []).some(h => h.kind === 'visit') && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 4 }}>Last visit</div>
                    <VisitCard h={(d.history || []).find(h => h.kind === 'visit')} />
                    {ed && <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, cursor: 'pointer', marginTop: 6 }}>
                      <input type="checkbox" checked={f.previousReviewed} onChange={e => set('previousReviewed', e.target.checked)} />
                      <span>Reviewed the last visit with the dealer</span>
                    </label>}
                  </div>
                )}
              </Sec>
            </div>
          )}

          {d && tab === 'previous' && (
            d.history?.length ? d.history.map(h => <VisitCard key={h.id} h={h} />) : <div style={{ fontSize: 13, color: 'var(--t3)', padding: 20, textAlign: 'center' }}>No visit on record for this dealer yet.</div>
          )}
        </div>

        {d && tab === 'mom' && d.canEdit && (
          <div className="dvm-foot" style={{ padding: '10px 18px', borderTop: '1px solid var(--b1)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btnp" disabled={busy} onClick={save} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 16px' }}><Save size={14} /> {busy ? 'Saving…' : 'Save MOM'}</button>
            <button className="btn" onClick={requestClose} style={{ fontSize: 13 }}>Close</button>
            <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>{d.today}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * "Planned by the office": today's and upcoming plans for this dealer. Staff
 * edit the instruction and can plan a new visit right here; the salesman
 * adds his own note. Saving the MOM marks today's plan visited.
 */
/**
 * The visit itself, done from here: check in at this counter (purpose +
 * camera photo + GPS, the same record the Visits page writes), and check out
 * with the discussion note when leaving. A check-out ticks today's plan.
 * One open visit at a time: if the user is still checked in elsewhere, this
 * box says where and lets him close it first.
 */
function VisitBox({ d, dealerId, onChanged }) {
  const av = d.activeVisit;
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [step, setStep] = useState('');            // 'photo' while the camera is open, 'send' while saving
  const cam = useRef(null);
  const pending = useRef(null);                     // 'in' | 'out' — what the photo is for
  const input = { fontSize: 13.5, padding: '9px 11px', borderRadius: 9, border: '1px solid var(--b1)', background: 'var(--bg1)', color: 'var(--t1)', width: '100%' };
  const mins = av?.since ? Math.max(0, Math.round((Date.now() - new Date(av.since).getTime()) / 60000)) : 0;

  // one tap: validate, open the camera; the photo itself completes the check-in / check-out
  const start = (what) => {
    setErr('');
    if (what === 'in' && !purpose) return setErr('Pick the purpose of the visit first');
    if (what === 'out' && !note.trim()) return setErr('Write what was discussed first');
    pending.current = what; setStep('photo'); cam.current?.click();
  };
  const onPhoto = async e => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) { setStep(''); return; }                // camera closed without a photo
    setBusy(true); setStep('send');
    try {
      const photo = await fileToCompressedDataURL(f);
      const loc = await getLocation(8000);
      if (pending.current === 'in') { await api.visitsCreate({ dealerId, dealerName: d.dealer.name, purpose, note: note ? `[${purpose}] ${note}` : `[${purpose}]`, photo, lat: loc.lat, lng: loc.lng }); setPurpose(''); }
      else await api.visitsCheckout(av.id, { note: note.trim(), photo, lat: loc.lat, lng: loc.lng });
      setNote('');
    } catch (x) { setErr(x?.message || 'Could not save the visit'); setBusy(false); setStep(''); return; }
    // Check-in/out is saved; refresh the summary on its own so a failed reload
    // is not shown as a failed visit (retrying gave "already checked in").
    try { await onChanged?.(); } catch (_) { /* best-effort refresh */ }
    setBusy(false); setStep('');
  };
  const working = step === 'send' ? 'Saving…' : step === 'photo' ? 'Take the photo…' : '';
  const tone = av?.here ? 'var(--grn)' : av ? '#f59e0b' : 'var(--acc)';
  const camBtn = (what, label, alt) => (
    <button className={'dvm-cam' + (alt ? ' alt' : '')} disabled={busy} onClick={() => start(what)}>
      <span className="dvm-cam-ico"><Camera size={17} /></span> {working || label}
    </button>
  );
  return (
    <div className="dvm-visit" style={{ '--tone': tone }}>
      <input ref={cam} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: 'none' }} />
      {av?.here ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span className="dvm-visit-ico live"><CheckCircle2 size={22} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 850, color: 'var(--grn)' }}>You are here · checked in {fmtDT(av.since)}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}><b style={{ color: 'var(--t1)' }}>{mins} min</b> on the counter. Fill the sections above, then write the discussion and check out.</div>
            </div>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="What was discussed, what was agreed…" style={{ ...input, resize: 'vertical' }} />
          {err && <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 6, fontWeight: 600 }}>{err}</div>}
          {camBtn('out', 'Check out · takes a photo')}
        </>
      ) : av ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span className="dvm-visit-ico"><AlertTriangle size={22} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 850, color: '#f59e0b' }}>Still checked in at {av.dealerName}</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Since {fmtDT(av.since)}. One visit at a time: close that one here, then check in at this counter.</div>
            </div>
          </div>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder={`What was discussed at ${av.dealerName}…`} style={{ ...input, resize: 'vertical' }} />
          {err && <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 6, fontWeight: 600 }}>{err}</div>}
          {camBtn('out', `Check out of ${av.dealerName.split(' ')[0]} · takes a photo`, true)}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span className="dvm-visit-ico"><LogIn size={22} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 850, color: 'var(--t1)' }}>At the counter? Check in</div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Pick the purpose, press the button, take one photo. Your location is added by itself.</div>
            </div>
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 6 }}>Purpose</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {VISIT_PURPOSES.map(p => <button key={p} type="button" className={'thr' + (purpose === p ? ' on' : '')} style={{ '--tone': 'var(--acc)', fontSize: 12, padding: '6px 12px' }} onClick={() => { setPurpose(p); setErr(''); }}>{p}</button>)}
          </div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note (optional)" style={input} />
          {err && <div style={{ color: 'var(--red)', fontSize: 12.5, marginTop: 6, fontWeight: 600 }}>{err}</div>}
          {camBtn('in', 'Check in · takes a photo')}
        </>
      )}
    </div>
  );
}

function PlanBox({ d, dealerId, onChanged }) {
  const staff = (d.salesmen || []).length > 0 && !!d.canPlan;
  const plans = (d.plans || []).filter(p => p.isToday || p.upcoming);
  const [edit, setEdit] = useState({});           // planId → text
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [adding, setAdding] = useState(false);
  const tomorrow = () => { const t = new Date(Date.now() + 86400000 + 5.5 * 3600e3); return t.toISOString().slice(0, 10); };
  const [nf, setNf] = useState({ date: tomorrow(), salesmanId: d.dealer?.salesman || '', note: '', collectTarget: '' });
  const run = async (fn) => { setBusy(true); setErr(''); try { await fn(); await onChanged?.(); } catch (e) { setErr(e?.message || 'Could not save'); } finally { setBusy(false); } };
  if (!plans.length && !staff) return null;
  return (
    <div className="dvm-plan">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span className="sec-ico" style={{ '--tone': '#f59e0b', width: 28, height: 28, borderRadius: 9 }}><ClipboardList size={14} /></span>
        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--t1)' }}>Planned by the office</div>
        {plans.length > 0 && <span className="count-pill" style={{ color: '#f59e0b', background: 'color-mix(in srgb, #f59e0b 14%, transparent)' }}>{plans.length}</span>}
        {staff && !adding && <button className="btne" style={{ fontSize: 11.5, padding: '4px 10px', marginLeft: 'auto' }} onClick={() => setAdding(true)}>+ Plan a visit</button>}
      </div>
      {!plans.length && <div style={{ fontSize: 12, color: 'var(--t3)' }}>No visit planned for this dealer.</div>}
      {plans.map(p => (
        <div key={p.id} style={{ fontSize: 12.5, padding: '8px 10px', marginTop: 6, borderRadius: 12, background: 'var(--bg1)', border: '1px solid var(--b1)' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <b>{p.isToday ? 'Today' : fmtDate(p.date)}</b> · {p.salesmanName}
            {p.status === 'DONE' ? <span style={S.chip('var(--grn)')}>visited</span> : <span style={S.chip('#f59e0b')}>planned</span>}
            {staff && edit[p.id] === undefined && <button className="btn" style={{ fontSize: 10.5, padding: '1px 7px', marginLeft: 'auto' }} onClick={() => setEdit(e => ({ ...e, [p.id]: p.note || '' }))}>Edit note</button>}
            {staff && p.status !== 'DONE' && <button className="btn" style={{ fontSize: 10.5, padding: '1px 7px', color: 'var(--red)' }} onClick={() => { if (window.confirm('Remove this planned visit?')) run(() => api.deleteVisitPlan(p.id)); }}>Remove</button>}
          </div>
          {edit[p.id] !== undefined ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input autoFocus value={edit[p.id]} onChange={e => setEdit(x => ({ ...x, [p.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Escape') setEdit(x => { const n = { ...x }; delete n[p.id]; return n; }); }} style={{ ...S.input, fontSize: 12 }} placeholder="what to do at this dealer" />
              <input type="number" min="0" value={edit[p.id + ':t'] ?? (p.collectTarget || '')} onChange={e => setEdit(x => ({ ...x, [p.id + ':t']: e.target.value }))} style={{ ...S.input, fontSize: 12, width: 110 }} placeholder="collect ₹" title="Amount to collect on this visit" />
              <button className="btnp" disabled={busy} style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => run(async () => { await api.updateVisitPlan(p.id, { note: edit[p.id], collectTarget: Number(edit[p.id + ':t'] ?? p.collectTarget) || 0 }); setEdit(x => { const n = { ...x }; delete n[p.id]; delete n[p.id + ':t']; return n; }); })}>Save</button>
            </div>
          ) : (
            <>
              {p.note ? <div style={{ color: 'var(--t2)' }}>{p.note} <span style={{ fontSize: 10.5, color: 'var(--t3)' }}>— {p.plannedByName}</span></div> : <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>No note from the office.</div>}
              {p.collectTarget > 0 && <div style={{ color: 'var(--grn)', fontWeight: 700 }}>To collect: {money(p.collectTarget)}</div>}
              {p.salesmanNote && <div style={{ color: 'var(--t2)' }}><span style={{ color: 'var(--grn)', fontWeight: 700 }}>{String(p.salesmanName).split(' ')[0]}:</span> {p.salesmanNote}</div>}
            </>
          )}
        </div>
      ))}
      {adding && (
        <div className="dvm-grid" style={{ borderTop: '1px solid var(--b1)', paddingTop: 8, marginTop: 4, display: 'grid', gap: 6, gridTemplateColumns: '150px 1fr', alignItems: 'end' }}>
          <div><label style={S.label}>Date</label><input type="date" value={nf.date} onChange={e => setNf(x => ({ ...x, date: e.target.value }))} style={S.input} /></div>
          <div><label style={S.label}>Salesman</label><select value={nf.salesmanId} onChange={e => setNf(x => ({ ...x, salesmanId: e.target.value }))} style={S.input}>{(d.salesmen || []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div>
          <div><label style={S.label}>To collect ₹</label><input type="number" min="0" value={nf.collectTarget} onChange={e => setNf(x => ({ ...x, collectTarget: e.target.value }))} style={S.input} placeholder="0" /></div>
          <div><label style={S.label}>What to do there</label><input value={nf.note} onChange={e => setNf(x => ({ ...x, note: e.target.value }))} style={S.input} placeholder="e.g. show Candid folder, check display" /></div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 6 }}>
            <button className="btnp" disabled={busy || !nf.salesmanId || !nf.date} style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => run(async () => { await api.addVisitPlan({ date: nf.date, salesmanId: nf.salesmanId, dealerId, note: nf.note, collectTarget: Number(nf.collectTarget) || 0 }); setAdding(false); setNf(x => ({ ...x, note: '' })); })}>Add to calendar</button>
            <button className="btn" style={{ fontSize: 12 }} onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}
      {err && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 4 }}>{err}</div>}

    </div>
  );
}

/** A 300–900 payment score as a half-dial with a needle, like a credit bureau app. */
function ScoreBar({ score, reasons = [], asOn, small = false }) {
  const sc = Math.max(300, Math.min(900, Number(score) || 300));
  if (small) return <ScoreDial sc={sc} reasons={reasons} asOn={asOn} />;
  const band = sc >= 750 ? ['Excellent', '#16a34a'] : sc >= 650 ? ['Good', '#65a30d'] : sc >= 500 ? ['Fair', '#f59e0b'] : ['Poor', '#dc2626'];
  const W = 260, H = 196, cx = 130, cy = 124, R = 96, sw = 18;
  const ang = v => Math.PI * (1 - (v - 300) / 600);                       // 300 → left (π), 900 → right (0)
  const pt = (v, r = R) => [cx + r * Math.cos(ang(v)), cy - r * Math.sin(ang(v))];
  const arc = (v0, v1, color) => { const [x0, y0] = pt(v0), [x1, y1] = pt(v1); return <path key={v0} d={`M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="butt" />; };
  // the hand: a slim triangle from the hub to just inside the ring, like a clock hand
  const tip = pt(sc, R - sw / 2 - 3), a = ang(sc);
  const baseL = [cx + 5 * Math.cos(a + Math.PI / 2), cy - 5 * Math.sin(a + Math.PI / 2)], baseR = [cx + 5 * Math.cos(a - Math.PI / 2), cy - 5 * Math.sin(a - Math.PI / 2)];
  const msg = sc >= 750 ? 'Paying on time. Safe to serve on the usual terms.' : sc >= 650 ? 'Mostly on time. A gentle reminder on the visit is enough.' : sc >= 500 ? 'Slipping. Collect before taking a fresh order.' : 'In bad shape. Collect first — no new credit until it improves.';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0 0', borderRadius: 12, background: 'linear-gradient(180deg, color-mix(in srgb, var(--acc) 8%, transparent), transparent)' }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%' }}>
          {arc(300, 500, '#dc2626')}{arc(500, 650, '#f59e0b')}{arc(650, 750, '#65a30d')}{arc(750, 900, '#16a34a')}
          {[500, 650, 750].map(v => { const [x0, y0] = pt(v, R - sw / 2 - 2), [x1, y1] = pt(v, R + sw / 2 + 2); return <line key={v} x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--bg1)" strokeWidth={3} />; })}
          <polygon points={`${baseL[0]},${baseL[1]} ${tip[0]},${tip[1]} ${baseR[0]},${baseR[1]}`} fill="var(--t1)" />
          <circle cx={cx} cy={cy} r={9} fill="var(--t1)" /><circle cx={cx} cy={cy} r={4} fill="var(--bg1)" />
          <text x={cx - R - 2} y={cy + 16} textAnchor="middle" style={{ fontSize: 9.5, fill: 'var(--t3)' }}>300</text>
          <text x={cx + R + 2} y={cy + 16} textAnchor="middle" style={{ fontSize: 9.5, fill: 'var(--t3)' }}>900</text>
          <text x={cx} y={cy + 48} textAnchor="middle" style={{ fontSize: 34, fontWeight: 900, fill: band[1] }}>{sc}</text>
          <text x={cx} y={cy + 66} textAnchor="middle" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', fill: band[1] }}>{band[0].toUpperCase()}</text>
        </svg>
        {asOn && <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: -4 }}>from the statement of {fmtDate(asOn)}</div>}
      </div>
      <div style={{ marginTop: 6, padding: '7px 10px', borderRadius: 10, background: `color-mix(in srgb, ${band[1]} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${band[1]} 30%, transparent)`, fontSize: 12, textAlign: 'center', color: 'var(--t1)' }}>{msg}</div>
      {reasons.length > 0 && (
        <details style={{ marginTop: 6 }}>
          <summary style={{ fontSize: 11.5, color: 'var(--t3)', cursor: 'pointer', textAlign: 'center' }}>Why this score</summary>
          {reasons.map((r, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11.5, padding: '3px 0', borderTop: '1px solid var(--b1)' }}><span style={{ minWidth: 36, fontWeight: 800, color: r.delta > 0 ? 'var(--grn)' : r.delta < 0 ? 'var(--red)' : 'var(--t3)' }}>{r.delta > 0 ? '+' : ''}{r.delta || '—'}</span><span style={{ color: 'var(--t2)' }}>{r.text}</span></div>)}
        </details>
      )}
    </div>
  );
}

/** The compact dial used in the plain form: dial, band, and the factors behind a fold. */
function ScoreDial({ sc, reasons = [], asOn }) {
  const band = sc >= 750 ? ['Excellent', '#16a34a'] : sc >= 650 ? ['Good', '#65a30d'] : sc >= 500 ? ['Fair', '#f59e0b'] : ['Poor', '#dc2626'];
  const W = 170, H = 136, cx = 85, cy = 84, R = 62, sw = 13;
  const ang = v => Math.PI * (1 - (v - 300) / 600);
  const pt = (v, r = R) => [cx + r * Math.cos(ang(v)), cy - r * Math.sin(ang(v))];
  const arc = (v0, v1, color) => { const [x0, y0] = pt(v0), [x1, y1] = pt(v1); return <path key={v0} d={`M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1}`} stroke={color} strokeWidth={sw} fill="none" />; };
  const tip = pt(sc, R - sw / 2 - 2), a = ang(sc);
  const baseL = [cx + 4 * Math.cos(a + Math.PI / 2), cy - 4 * Math.sin(a + Math.PI / 2)], baseR = [cx + 4 * Math.cos(a - Math.PI / 2), cy - 4 * Math.sin(a - Math.PI / 2)];
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%' }}>
        {arc(300, 500, '#dc2626')}{arc(500, 650, '#f59e0b')}{arc(650, 750, '#65a30d')}{arc(750, 900, '#16a34a')}
        <polygon points={`${baseL[0]},${baseL[1]} ${tip[0]},${tip[1]} ${baseR[0]},${baseR[1]}`} fill="var(--t1)" />
        <circle cx={cx} cy={cy} r={7} fill="var(--t1)" /><circle cx={cx} cy={cy} r={3} fill="var(--bg1)" />
        <text x={cx} y={cy + 34} textAnchor="middle" style={{ fontSize: 26, fontWeight: 900, fill: band[1] }}>{sc}</text>
        <text x={cx} y={cy + 48} textAnchor="middle" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em', fill: band[1] }}>{band[0].toUpperCase()}</text>
      </svg>
      <details style={{ textAlign: 'left' }}><summary style={{ fontSize: 10.5, color: 'var(--t3)', cursor: 'pointer', textAlign: 'center' }}>Why this score</summary>
        {reasons.map((r, i) => <div key={i} style={{ fontSize: 11.5, padding: '2px 0', display: 'flex', gap: 6 }}><b style={{ minWidth: 34, color: r.delta > 0 ? 'var(--grn)' : r.delta < 0 ? 'var(--red)' : 'var(--t3)' }}>{r.delta > 0 ? '+' : ''}{r.delta || '—'}</b><span style={{ color: 'var(--t2)' }}>{r.text}</span></div>)}
      </details>
    </div>
  );
}

/** One visit: when, who, how long, where, and what was discussed (the MOM). */
function VisitCard({ h }) {
  return (
    <div style={{ ...S.card, marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
        <b style={{ fontSize: 13 }}>{fmtDT(h.at)}</b>
        <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{h.by}</span>
        {h.minutes > 0 && <span style={S.chip('var(--t3)')}>{h.minutes} min</span>}
        {h.kind === 'visit' && h.status === 'in-progress' && <span style={S.chip('#b45309')}>still checked in</span>}
        {h.kind === 'mom' && <span style={S.chip('var(--t3)')}>MOM only</span>}
        {h.place && <span style={{ fontSize: 11, color: 'var(--t3)' }}><MapPin size={10} style={{ verticalAlign: -1 }} /> {h.place}</span>}
      </div>
      {h.kind === 'visit' && (
        h.fromMom ? <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 4 }}>No check-in — recorded from the MOM.</div> : (
          <div style={{ display: 'grid', gap: 3, fontSize: 12.5, marginBottom: 6 }}>
            {h.inNote && <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--t3)', minWidth: 90, flexShrink: 0 }}>Purpose</span><span>{h.inNote.replace(/^\[(.*)\]$/, '$1')}</span></div>}
            <div style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--t3)', minWidth: 90, flexShrink: 0 }}>Discussion</span><span>{h.outNote || <span style={{ color: 'var(--t3)' }}>{h.status === 'in-progress' ? 'still checked in' : 'nothing written at check-out'}</span>}</span></div>
          </div>
        )
      )}
      {h.mom ? <MomCard m={h.mom} compact /> : h.kind === 'visit' ? <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>No MOM written for this visit.</div> : null}
    </div>
  );
}

function MomCard({ m, compact }) {
  const row = (k, v) => v ? <div style={{ display: 'flex', gap: 8, fontSize: 12 }}><span style={{ color: 'var(--t3)', minWidth: 130, flexShrink: 0 }}>{k}</span><span>{v}</span></div> : null;
  return (
    <div style={{ ...(compact ? { padding: '6px 0 0', borderTop: '1px dashed var(--b1)' } : S.card), marginBottom: compact ? 0 : 8, display: 'grid', gap: 3 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
        <b style={{ fontSize: 13 }}>{fmtDate(m.date)}</b><span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{m.userName}</span>
        {m.action && <span style={S.chip('#b45309')}>{actionLabel(m.action)}</span>}
        {m.dealerFormFilled && <span style={S.chip('var(--grn)')}>form filled</span>}
        {m.appUsageShown && <span style={S.chip('var(--acc)')}>app shown</span>}
        {m.previousReviewed && <span style={S.chip('var(--t3)')}>previous reviewed</span>}
      </div>
      {m.volume && row('Volume', `${num(m.volume.achieved)} of ${num(m.volume.target)} · ${m.volume.month}`)}
      {m.outstanding && row('Outstanding', `${money(m.outstanding.total)}${m.outstanding.due ? ` · due ${money(m.outstanding.due)} (${periodLabel(m.outstanding.dueMonth)})` : ''}`)}
      {row('Said', m.actionNote)}
      {row('Samples shown', m.samplesShown)}{row('Samples given', m.samplesGiven)}{row('Taken back', m.samplesTakenBack)}
      {row('Payment', m.paymentStatus)}
      {m.paymentCollected > 0 && row('Collected', `${money(m.paymentCollected)}${m.paymentCollectionNote ? ' · ' + m.paymentCollectionNote : ''}`)}
      {row('Terms', m.reviewPaymentTerms)}
      {(m.relineTerms?.creditDays != null || m.relineTerms?.creditLimit != null) && row('Relined terms', `${m.relineTerms.creditDays != null ? m.relineTerms.creditDays + ' days' : ''}${m.relineTerms.creditLimit != null ? ' · limit ' + money(m.relineTerms.creditLimit) : ''}${m.relineTerms.note ? ' · ' + m.relineTerms.note : ''}${m.relineTerms.applied ? ' · applied' : ' · proposed'}`)}
      {row('Remarks', m.remarks)}
    </div>
  );
}
