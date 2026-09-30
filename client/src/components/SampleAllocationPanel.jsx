import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Upload, RefreshCw, Tag, Undo2, CheckCircle2, Search, Zap, Pencil, Trash2, Plus, X, Package, ListChecks, Users, Boxes, Hourglass, FileSpreadsheet, Star, Eye, Inbox, ChevronDown, ChevronRight, Layers, Send, AlertTriangle, ArrowUpRight, Check } from 'lucide-react';
import { api } from '../api';
import DealerVisitModal from './DealerVisitModal';

/**
 * Sample allocation — stock in, dealers tagged.
 *
 * "Add sample" is the everyday way: name, pieces, zones. The pieces go at
 * once to the zone's dealers, STAR first, then KEY ACCOUNT, then ACHIEVER,
 * then the other laminate buyers, biggest first. The two uploads do the same
 * for a whole sheet. What is left is tagged by hand, or a salesman requests
 * it and the office approves. The salesman hands the piece over from the
 * dealer visit, which turns it into a "given" record.
 */
const num = v => Number(v || 0).toLocaleString('en-IN');
const ZONES = ['ZONE 1', 'ZONE 2', 'ZONE 3', 'ZONE 4', 'ZONE 5', 'ZONE 6', 'ZONE 7'];
const SPECIAL = ['All Zones', 'NEW DEALERS ONLY', 'ARCHITECTS', 'SPECIAL REQUIRMENT'];
// the zone groups the office hands samples to — one choice at a time
const ZONE_GROUPS = [
  { label: 'All zones', zones: ['All Zones'], tone: 'var(--grn)' },
  { label: 'Zone 1 & 3', zones: ['ZONE 1', 'ZONE 3'] }, { label: 'Zone 2 & 5', zones: ['ZONE 2', 'ZONE 5'] }, { label: 'Zone 4 & 6', zones: ['ZONE 4', 'ZONE 6'] },
  { label: 'Zone 1, 3, 4', zones: ['ZONE 1', 'ZONE 3', 'ZONE 4'] }, { label: 'Zone 2, 5, 6', zones: ['ZONE 2', 'ZONE 5', 'ZONE 6'] },
];
const sameZones = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');
const isRealZone = z => /^(all\s*zones?|zone\s*\d+)$/i.test(String(z || '').trim());
const initials = n => (n || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?';
const hue = n => (n || '?').charCodeAt(0) * 37 % 360;
const tierTone = t => t === 'STAR' ? 'var(--yel)' : t === 'KEY ACCOUNT' ? 'var(--acc)' : t === 'ACHIEVER' ? 'var(--grn)' : 'var(--t3)';

/* scoped styles for both views (prefix smp-) — theme variables only */
const CSS = `
.smp-head{display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.smp-head-txt{flex:1 1 280px;min-width:0}
.smp-head-t{font-size:17px;font-weight:850;color:var(--t1);letter-spacing:-.01em}
.smp-head-d{font-size:12px;color:var(--t3);margin-top:3px;line-height:1.5}
.smp-head-r{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.smp-b{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;font-size:13px;font-weight:700;white-space:nowrap}
.smp-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:14px}
.smp-tile{display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:14px;background:var(--bg1);border:1px solid var(--b1);box-shadow:var(--shadow,none);min-width:0;text-align:left;font:inherit;color:inherit;width:100%}
.smp-tile.click{cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s}
.smp-tile.click:hover{transform:translateY(-2px);box-shadow:var(--shadowHover,none)}
.smp-tile.on{border-color:color-mix(in srgb,var(--tone) 55%,transparent);background:linear-gradient(115deg,color-mix(in srgb,var(--tone) 13%,var(--bg1)),var(--bg1) 80%)}
.smp-tile .stat-ico{color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
.smp-tl{font-size:10.5px;color:var(--t3);font-weight:700;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.smp-tv{font-size:21px;font-weight:850;color:var(--tone);line-height:1.15;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.smp-ts{font-size:10.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.smp-msg{display:flex;align-items:flex-start;gap:8px;font-size:12.5px;font-weight:600;padding:10px 12px;border-radius:12px;margin-bottom:12px;border:1px solid color-mix(in srgb,var(--tone) 30%,transparent);background:color-mix(in srgb,var(--tone) 9%,transparent);color:var(--tone);line-height:1.45;overflow-wrap:anywhere}
.smp-search{display:flex;align-items:center;gap:7px;background:var(--bg2);border:1px solid var(--b2);border-radius:10px;padding:7px 11px;min-width:0;flex:1 1 220px}
.smp-search input{border:none;background:transparent;color:var(--t1);font-size:13px;outline:none;flex:1;min-width:0}
.smp-search:focus-within{border-color:var(--acc);box-shadow:0 0 0 3px var(--accL)}
.smp-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:12px 14px}
.smp-bar .sel{min-width:0;flex:0 1 auto;max-width:100%}
.smp-chipsrow{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:0 14px 12px}
.smp-thr-n{display:inline-block;margin-left:5px;font-size:10px;opacity:.8}
.smp-ib{--tone:var(--t2);width:30px;height:30px;border-radius:9px;display:inline-grid;place-items:center;border:1px solid var(--b1);background:var(--bg1);color:var(--tone);cursor:pointer;padding:0;flex-shrink:0;transition:background .15s,border-color .15s}
.smp-ib:hover:not(:disabled){background:color-mix(in srgb,var(--tone) 12%,transparent);border-color:color-mix(in srgb,var(--tone) 40%,transparent)}
.smp-ib:disabled{opacity:.5;cursor:not-allowed}
.smp-zc{--tone:var(--acc);display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:20px;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent);white-space:nowrap}
.smp-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:34px 16px;color:var(--t3);font-size:12.5px}
.smp-empty-ico{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;background:var(--bg2);color:var(--t3);margin-bottom:6px}
.smp-empty b{color:var(--t1);font-size:14px}
.smp-card{padding:0;overflow:hidden;margin-bottom:14px}
.smp-card-h{display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:14px 14px 0}
.smp-card-h .sec-title{margin-bottom:0}
/* stock list */
.smp-list{max-height:560px;overflow-y:auto;border-top:1px solid var(--b1)}
.smp-row{display:grid;grid-template-columns:minmax(0,2.2fr) 110px 84px 84px 84px 150px;gap:10px;align-items:center;padding:10px 14px;border-top:1px solid var(--b1)}
.smp-row:first-child{border-top:none}
.smp-row.head{position:sticky;top:0;z-index:1;background:var(--bg2);font-size:10.5px;font-weight:800;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;padding-top:9px;padding-bottom:9px}
.smp-row:not(.head):hover{background:var(--bg2)}
.smp-row.left{background:color-mix(in srgb,var(--yel) 5%,transparent)}
.smp-num{text-align:right;font-variant-numeric:tabular-nums;font-size:13px;font-weight:700;min-width:0}
.smp-num .pbar{width:70px}
.smp-lbl{display:none}
.smp-act{display:flex;gap:6px;justify-content:flex-end;align-items:center;flex-wrap:wrap}
.smp-edit{cursor:pointer;border-bottom:1px dotted var(--t3);color:var(--t1)}
@media(max-width:720px){
  .smp-row.head{display:none}
  .smp-row{grid-template-columns:repeat(4,minmax(0,1fr));gap:8px 10px;padding:12px 14px}
  .smp-row>.smp-name{grid-column:1/-1}
  .smp-row>.smp-act{grid-column:1/-1;justify-content:flex-start}
  .smp-num{text-align:left}
  .smp-num .pbar{margin-left:0;width:100%}
  .smp-lbl{display:block;font-size:9.5px;font-weight:800;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
}
/* sheet uploads */
.smp-ups{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:14px}
.smp-up{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;border:1px dashed var(--b2);background:var(--bg1);cursor:pointer;text-align:left;font:inherit;color:inherit;min-width:0;transition:border-color .15s,background .15s}
.smp-up:hover:not(:disabled){border-color:var(--acc);background:color-mix(in srgb,var(--acc) 5%,var(--bg1))}
.smp-up:disabled{opacity:.55;cursor:not-allowed}
/* add sample modal */
.smp-modal{max-width:640px;padding:0!important;display:flex;flex-direction:column}
.smp-mh{display:flex;align-items:flex-start;gap:12px;padding:18px 18px 12px;border-bottom:1px solid var(--b1)}
.smp-mb{padding:16px 18px;display:grid;gap:14px}
.smp-mf{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;padding:12px 18px;border-top:1px solid var(--b1);background:var(--bg2);position:sticky;bottom:0}
.smp-fl{display:block;font-size:11px;font-weight:800;color:var(--t2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
.smp-f2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.smp-zones{display:flex;gap:6px;flex-wrap:wrap}
.smp-sum{--tone:var(--t3);display:flex;gap:10px;align-items:flex-start;padding:12px;border-radius:12px;border:1px solid color-mix(in srgb,var(--tone) 30%,var(--b1));background:color-mix(in srgb,var(--tone) 8%,var(--bg1));font-size:12.5px;color:var(--t2);line-height:1.5}
.smp-sum-ico{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 15%,transparent)}
.smp-link{border:none;background:none;padding:0;color:var(--acc);font-weight:700;cursor:pointer;font-size:12px}
.smp-who{display:grid;gap:8px;max-height:220px;overflow-y:auto}
.smp-pill{display:inline-flex;align-items:center;gap:5px;margin:3px 4px 0 0;padding:2px 8px;border-radius:14px;background:var(--bg2);border:1px solid var(--b1);font-size:11.5px;color:var(--t1)}
/* dealer-wise */
.smp-dl{display:grid;gap:10px;padding:12px 14px 14px;border-top:1px solid var(--b1);background:var(--bg2)}
.smp-dc{background:var(--bg1);border:1px solid var(--b1);border-radius:14px;overflow:hidden;transition:box-shadow .15s,border-color .15s;min-width:0}
.smp-dc:hover{border-color:var(--b2);box-shadow:var(--shadow,none)}
.smp-dc.req{border-color:color-mix(in srgb,var(--yel) 50%,var(--b1))}
.smp-dh{display:flex;align-items:center;gap:10px 12px;padding:11px 14px;cursor:pointer;flex-wrap:wrap}
.smp-dh-main{display:flex;align-items:center;gap:10px;min-width:0;flex:1 1 230px}
.smp-dh-name{font-weight:750;font-size:13.5px;color:var(--t1);display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0;overflow-wrap:anywhere}
.smp-dh-sub{font-size:11px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.smp-dh-r{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.smp-cnt{--tone:var(--acc);display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:800;padding:3px 9px;border-radius:20px;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent);white-space:nowrap}
.smp-cnt.zero{color:var(--t3);background:var(--bg2);font-weight:600}
.smp-tier{--tone:var(--t3);font-size:9.5px;font-weight:800;padding:1px 7px;border-radius:10px;letter-spacing:.03em;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
.smp-chev{width:26px;height:26px;border-radius:8px;border:1px solid var(--b1);background:var(--bg2);color:var(--t2);cursor:pointer;display:grid;place-items:center;flex-shrink:0;padding:0}
.smp-chev.on{background:var(--acc);border-color:var(--acc);color:#fff}
.smp-req{margin:0 14px 12px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--yel) 10%,var(--bg1));border:1px solid color-mix(in srgb,var(--yel) 45%,transparent)}
.smp-req-t{font-size:10.5px;font-weight:800;color:var(--yel);text-transform:uppercase;letter-spacing:.06em;display:flex;align-items:center;gap:6px}
.smp-req-i{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 9px;border-radius:10px;background:var(--bg1);border:1px solid var(--b1);margin-top:6px}
.smp-req-i .nm{flex:1 1 140px;min-width:0;font-size:12.5px;font-weight:700;color:var(--t1);overflow-wrap:anywhere}
.smp-req-i .nm span{display:block;font-size:10.5px;font-weight:500;color:var(--t3)}
.smp-sb{font-size:11px;padding:4px 10px;display:inline-flex;align-items:center;gap:4px;font-weight:700}
.smp-cols{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:12px 14px 14px;border-top:1px solid var(--b1);background:var(--bg2)}
.smp-col{--tone:var(--acc);border-radius:12px;background:var(--bg1);border:1px solid var(--b1);border-top:3px solid var(--tone);padding:10px;min-width:0}
.smp-col-t{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--tone);margin-bottom:8px}
.smp-col-n{margin-left:auto;font-size:10.5px;font-weight:800;padding:1px 8px;border-radius:20px;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent);letter-spacing:0;text-transform:none;white-space:nowrap}
.smp-chips{display:flex;flex-wrap:wrap;gap:5px;max-height:220px;overflow-y:auto}
.smp-chip{--tone:var(--acc);display:inline-flex;align-items:center;gap:5px;max-width:100%;min-width:0;font-size:11.5px;font-weight:600;padding:3px 4px 3px 9px;border-radius:20px;color:var(--t1);background:color-mix(in srgb,var(--tone) 9%,var(--bg1));border:1px solid color-mix(in srgb,var(--tone) 28%,transparent)}
.smp-chip.noact{padding-right:9px}
.smp-chip .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.smp-chip .sb{font-size:10px;color:var(--t3);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}
.smp-chip .st{color:var(--tone);font-weight:800}
.smp-chip.dim{opacity:.55}
.smp-chip button{border:none;border-radius:20px;font-size:10px;font-weight:800;padding:2px 8px;cursor:pointer;background:var(--tone);color:#fff;flex-shrink:0}
.smp-chip button:disabled{opacity:.5;cursor:not-allowed}
.smp-none{font-size:11.5px;color:var(--t3)}
.smp-banner{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;border-radius:14px;margin-bottom:14px;background:linear-gradient(115deg,color-mix(in srgb,var(--yel) 16%,var(--bg1)),var(--bg1) 85%);border:1px solid color-mix(in srgb,var(--yel) 40%,transparent)}
.smp-banner-ico{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;color:#fff;background:var(--yel)}
/* allocation list */
.smp-coll{display:flex;align-items:center;gap:10px;width:100%;padding:13px 14px;border:none;background:transparent;cursor:pointer;text-align:left;font:inherit;color:inherit;flex-wrap:wrap}
.smp-al{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1.2fr) minmax(0,1fr) 150px 170px;gap:10px;align-items:center;padding:9px 14px;border-top:1px solid var(--b1);font-size:12.5px}
.smp-al.head{position:sticky;top:0;z-index:1;background:var(--bg2);font-size:10.5px;font-weight:800;color:var(--t3);text-transform:uppercase;letter-spacing:.06em}
.smp-al:not(.head):hover{background:var(--bg2)}
.smp-st{--tone:var(--t3);display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent);white-space:nowrap}
.smp-st i{width:6px;height:6px;border-radius:50%;background:var(--tone)}
@media(max-width:900px){.smp-cols{grid-template-columns:1fr 1fr}}
@media(max-width:760px){
  .smp-al.head{display:none}
  .smp-al{grid-template-columns:1fr 1fr;padding:11px 14px}
  .smp-al>.a-dealer{grid-column:1/-1}
  .smp-al>.a-act{grid-column:1/-1;justify-content:flex-start}
}
@media(max-width:520px){
  .smp-cols{grid-template-columns:1fr}
  .smp-dh{padding:10px 12px}
  .smp-req{margin:0 12px 12px}
  .smp-dl{padding:10px}
  .smp-f2{grid-template-columns:1fr}
  .smp-head-r{width:100%}
  .smp-head-r>.smp-grow{flex:1 1 auto;justify-content:center}
  .smp-tiles{grid-template-columns:1fr 1fr;gap:8px}
  .smp-tile{padding:10px;gap:8px}
  .smp-tile .stat-ico{width:30px;height:30px;border-radius:9px}
  .smp-tv{font-size:18px}
}
`;

const Tile = ({ label, value, tone, Icon, sub, onClick, active }) => { const El = onClick ? 'button' : 'div'; return (
  <El {...(onClick ? { type: 'button', onClick, 'aria-pressed': !!active } : {})} className={'smp-tile' + (onClick ? ' click' : '') + (active ? ' on' : '')} style={{ '--tone': tone }}>
    <span className="stat-ico"><Icon size={17} /></span>
    <span style={{ minWidth: 0 }}>
      <div className="smp-tl">{label}</div>
      <div className="smp-tv">{num(value)}</div>
      {sub && <div className="smp-ts">{sub}</div>}
    </span>
  </El>); };

const Msg = ({ msg }) => msg ? (
  <div className="smp-msg" style={{ '--tone': msg.startsWith('✓') ? 'var(--grn)' : 'var(--red)' }} role="status">
    {msg.startsWith('✓') ? <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
    <span>{msg.startsWith('✓') ? msg.slice(1).trim() : msg}</span>
  </div>) : null;

const Empty = ({ Icon = Inbox, title, children }) => (
  <div className="smp-empty"><span className="smp-empty-ico"><Icon size={22} /></span><b>{title}</b>{children}</div>
);

export default function SampleAllocationPanel({ view = 'master', onDelete, onCounts }) {
  const master = view === 'master', statusView = view === 'status';
  const [data, setData] = useState({ items: [], summary: [] });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [tagFor, setTagFor] = useState(null);       // sample summary row being tagged
  const [dealers, setDealers] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('REQUESTED');
  const [nf, setNf] = useState({ name: '', stock: '', zones: ['All Zones'], category: 'LAMINATE' });
  const [adding, setAdding] = useState(false);     // the Add sample modal
  const [showAllocs, setShowAllocs] = useState(false);
  const [preview, setPreview] = useState(null);     // who would get it, as you type
  const [showList, setShowList] = useState(false);
  const [moreWays, setMoreWays] = useState(false);  // the sheet uploads
  const [sq, setSq] = useState('');            // search the stock table
  const [only, setOnly] = useState('all');     // all | left | special
  const [editStock, setEditStock] = useState(null);   // { id, value }
  const stockRef = useRef(), allocRef = useRef();

  const load = async () => { try { setData(await api.sampleAllocations({ status: status || undefined })); setLoaded(true); } catch (e) { setMsg('Could not load: ' + e.message); setLoaded(true); } };
  useEffect(() => { load(); }, [status]);
  useEffect(() => {
    if (!nf.name.trim() || !(Number(nf.stock) > 0) || !nf.zones.length) { setPreview(null); return; }
    let dead = false; const t = setTimeout(() => { api.previewSampleAdd({ name: nf.name.trim(), stock: Number(nf.stock), zones: nf.zones, category: nf.category }).then(r => { if (!dead) setPreview(r); }).catch(() => {}); }, 350);
    return () => { dead = true; clearTimeout(t); };
  }, [nf.name, nf.stock, nf.zones, nf.category]);

  const tiers = b => b ? ['STAR', 'KEY ACCOUNT', 'ACHIEVER', 'by sales'].filter(k => b.by?.[k]).map(k => `${b.by[k]} ${k}`).join(', ') : '';
  const up = async (file, fn, label) => {
    if (!file) return; setBusy(true); setMsg('');
    try {
      const r = await fn(file);
      if (label === 'stock') setMsg(`✓ Stock sheet: ${r.added} rows, ${r.retired || 0} retired · ${num(r.allocated)} pieces allotted to the best dealers of each zone`);
      else setMsg(`✓ Dealer-wise: ${r.added} allotted, ${r.already} already had it${r.noDealer.length ? ` · dealers not found: ${[...new Set(r.noDealer)].slice(0, 5).join(', ')}` : ''}${r.noSample.length ? ` · samples not in master: ${[...new Set(r.noSample)].slice(0, 5).join(', ')}` : ''}${r.noStock.length ? ` · no stock left for ${r.noStock.length}` : ''}`);
      await load();
    } catch (e) { setMsg('Upload failed: ' + e.message); }
    setBusy(false);
  };

  const addSample = async () => {
    if (busy) return; // Enter in the inputs bypasses the disabled Save button
    if (!nf.name.trim()) return setMsg('Type the sample name');
    if (!nf.zones.length) return setMsg('Pick who gets it: zones, all zones, or a special tag');
    setBusy(true); setMsg('');
    try {
      const r = await api.addSampleAuto({ name: nf.name.trim(), stock: Number(nf.stock) || 0, zones: nf.zones, category: nf.category });
      const who = tiers(r.breakdown);
      setMsg(r.byHand ? `✓ ${r.name} added with ${num(r.stock)} pieces for ${r.zones.join(', ')} — this tag is given by hand: use "Tag a dealer".`
        : `✓ ${r.name} added · ${num(r.allocated)} pieces allotted at once${who ? ` (${who})` : ''} across ${r.zones.join(', ')} · ${num(r.left)} left to tag`);
      setNf({ name: '', stock: '', zones: ['All Zones'], category: 'LAMINATE' }); setPreview(null); setShowList(false); setAdding(false);
      await load();
    } catch (e) { setMsg('Could not add: ' + e.message); }
    setBusy(false);
  };
  const allotNow = (s) => act(async () => { const r = await api.allotSample(s.id); setMsg(r.allocated ? `✓ ${s.name} (${s.zone}): ${num(r.allocated)} pieces allotted${tiers(r.breakdown) ? ` (${tiers(r.breakdown)})` : ''} · ${num(r.left)} left` : `Nothing to allot for ${s.name} (${s.zone}): every eligible dealer of the zone already holds it. Tag by hand.`); }, null);
  const saveStock = (s) => act(async () => { const r = await api.updateSample(s.id, { stock: Number(editStock.value) || 0 }); setEditStock(null); setMsg(`✓ ${s.name} (${s.zone}) stock set to ${num(r.stock)}${r.allocated ? ` · ${num(r.allocated)} pieces allotted` : ''}`); }, null);

  const openTag = async (row) => {
    setTagFor(row); setQ('');
    if (!dealers.length) { try { const d = await api.getDealers(); setDealers((d.dealers || d || []).map(x => ({ id: x._id || x.id, name: x.name, zone: x.zone, status: x.status, salesman: x.salesman }))); } catch {} }
  };
  const zoneNums = z => [...String(z || '').matchAll(/\d+/g)].map(m => m[0]);
  const hits = useMemo(() => {
    if (!tagFor) return [];
    const s = q.trim().toLowerCase(); const zs = zoneNums(tagFor.zone);
    return dealers.filter(d => (!zs.length || zs.includes(zoneNums(d.zone)[0])) && (!s || d.name.toLowerCase().includes(s))).slice(0, 15);
  }, [q, dealers, tagFor]);

  const act = async (fn, ok) => { setBusy(true); if (ok !== null) setMsg(''); try { await fn(); if (ok) setMsg(ok); await load(); } catch (e) { setMsg(e.message); } setBusy(false); };

  const rows = useMemo(() => {
    const s = sq.trim().toLowerCase();
    return data.summary.filter(x => x.stock || x.allocated || x.given)
      .filter(x => !s || x.name.toLowerCase().includes(s) || String(x.zone).toLowerCase().includes(s))
      .filter(x => only === 'all' ? true : only === 'left' ? x.left > 0 : !isRealZone(x.zone));
  }, [data.summary, sq, only]);
  const totals = data.summary.reduce((a, s) => ({ stock: a.stock + s.stock, allocated: a.allocated + s.allocated, given: a.given + s.given, left: a.left + s.left }), { stock: 0, allocated: 0, given: 0, left: 0 });
  const samplesCount = new Set(data.summary.filter(s => s.stock || s.allocated || s.given).map(s => s.name)).size;
  const requests = status === 'REQUESTED' ? data.items.length : null;
  const leftRows = data.summary.filter(s => s.left > 0).length;
  const specialRows = data.summary.filter(x => (x.stock || x.allocated || x.given) && !isRealZone(x.zone)).length;
  // the section switch above shows these (only numbers this panel already has)
  useEffect(() => { if (loaded && onCounts) onCounts({ samples: samplesCount, ...(requests !== null ? { requests } : {}) }); }, [loaded, samplesCount, requests]);
  // one choice at a time: a group, a single zone or a by-hand tag — picking one clears the other
  const pickZones = zones => setNf(f => ({ ...f, zones: sameZones(f.zones, zones) ? [] : zones }));

  const statusBadge = a => a.status === 'GIVEN' ? <span className="smp-st" style={{ '--tone': 'var(--grn)' }}><i />given {a.givenDate}</span>
    : a.status === 'RETURNED' ? <span className="smp-st" style={{ '--tone': 'var(--t2)' }}><i />taken back {a.returnedDate}</span>
    : a.status === 'CANCELLED' ? <span className="smp-st" style={{ '--tone': 'var(--t3)' }}><i />cancelled</span>
    : a.status === 'REQUESTED' ? <span className="smp-st" style={{ '--tone': 'var(--yel)' }}><i />requested by salesman</span>
    : <span className="smp-st" style={{ '--tone': 'var(--acc)' }}><i />to be given</span>;
  const statusLabel = { REQUESTED: 'Requests to approve', ALLOCATED: 'To be given', GIVEN: 'Given', RETURNED: 'Taken back', '': 'All' }[status];

  return (
    <div style={{ marginBottom: 18 }}>
      <style>{CSS}</style>

      {/* header */}
      {master && <div className="smp-head">
        <span className="sec-ico lg" style={{ '--tone': 'var(--acc)' }}><Package size={19} /></span>
        <div className="smp-head-txt">
          <div className="smp-head-t">Sample master</div>
          <div className="smp-head-d">Add a sample with its pieces and zones. It goes at once to the best dealers of each zone: STAR, then KEY ACCOUNT, then ACHIEVER, then the other laminate buyers, biggest first. The salesman sees it under "To be shown" and hands it over on the visit.</div>
        </div>
        <div className="smp-head-r">
          <button onClick={() => { setAdding(true); setMsg(''); }} disabled={busy} className="btnp smp-b smp-grow"><Plus size={15} /> Add sample</button>
          <button onClick={() => act(async () => { const r = await api.allotAllSamples(); setMsg(r.allocated ? `✓ ${num(r.allocated)} pieces allotted across ${r.detail.length} samples` : 'Nothing to allot: every eligible dealer already holds what is in stock.'); }, null)} disabled={busy || !totals.left} className="btne smp-b smp-grow" title="Allot every sample's left-over pieces to the next best dealers (after a sales upload, or new dealers)"><Zap size={14} /> Allot all left <span className="count-pill" style={{ padding: '1px 7px' }}>{num(totals.left)}</span></button>
          <button onClick={() => setMoreWays(m => !m)} className="btn smp-b" aria-expanded={moreWays} title="Zone sheet or dealer-wise sheet" style={moreWays ? { borderColor: 'var(--acc)', color: 'var(--acc)' } : undefined}><FileSpreadsheet size={14} /> {moreWays ? 'Hide sheet uploads' : 'Upload a sheet'}</button>
          <button onClick={load} disabled={busy} className="smp-ib" title="Refresh" aria-label="Refresh" style={{ width: 36, height: 36 }}><RefreshCw size={14} /></button>
        </div>
      </div>}
      {statusView && <div className="smp-head">
        <span className="sec-ico lg" style={{ '--tone': 'var(--pur)' }}><ListChecks size={19} /></span>
        <div className="smp-head-txt">
          <div className="smp-head-t">Samples status</div>
          <div className="smp-head-d">Where every piece is: requested by a salesman, waiting to be given, with the dealer, or taken back. Approve requests here and look up what any dealer holds.</div>
        </div>
      </div>}

      {/* tiles */}
      {master && (loaded ? <div className="smp-tiles">
        <Tile label="Samples" value={samplesCount} tone="var(--pur)" Icon={Package} />
        <Tile label="Pieces in stock" value={totals.stock} tone="var(--t2)" Icon={Boxes} />
        <Tile label="Allotted" value={totals.allocated} tone="var(--acc)" Icon={Send} />
        <Tile label="Given" value={totals.given} tone="var(--grn)" Icon={CheckCircle2} />
        <Tile label="Left to allot" value={totals.left} tone={totals.left ? 'var(--yel)' : 'var(--t3)'} Icon={Hourglass} sub={leftRows ? `${num(leftRows)} rows` : 'all allotted'} />
      </div> : <div className="smp-tiles">{[0, 1, 2, 3, 4].map(i => <span key={i} className="skel" style={{ height: 66, borderRadius: 14 }} />)}</div>)}

      {/* sheet uploads */}
      {master && moreWays && <div className="smp-ups">
        <input ref={stockRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { up(e.target.files[0], api.uploadSampleStock, 'stock'); e.target.value = ''; }} />
        <button onClick={() => stockRef.current?.click()} disabled={busy} className="smp-up" title="Sample Name | Stock | Zones — one line per sample, 'Zone 2, 5, 6' becomes one row per zone, 'Dispose' retires it">
          <span className="stat-ico"><Upload size={16} /></span>
          <span style={{ minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: 13, color: 'var(--t1)' }}>Zone sheet</div><div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Sample Name | Stock | Zones · allots at once</div></span>
        </button>
        <input ref={allocRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { up(e.target.files[0], api.uploadSampleAlloc, 'alloc'); e.target.value = ''; }} />
        <button onClick={() => allocRef.current?.click()} disabled={busy} className="smp-up" title="Dealer | Sample — allots exactly what the sheet says">
          <span className="stat-ico" style={{ color: 'var(--pur)', background: 'color-mix(in srgb, var(--pur) 14%, transparent)' }}><Users size={16} /></span>
          <span style={{ minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: 13, color: 'var(--t1)' }}>Dealer-wise sheet</div><div style={{ fontSize: 11.5, color: 'var(--t3)' }}>Dealer | Sample · exactly what the sheet says</div></span>
        </button>
      </div>}

      <Msg msg={msg} />

      {/* add a sample — a modal */}
      {master && adding && <div className="overlay" onClick={() => setAdding(false)}>
        <div onClick={e => e.stopPropagation()} className="modal smp-modal" role="dialog" aria-label="Add a sample">
          <div className="smp-mh">
            <span className="sec-ico lg" style={{ '--tone': 'var(--acc)' }}><Plus size={19} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 850, color: 'var(--t1)' }}>Add a sample</div>
              <div style={{ fontSize: 12, color: 'var(--t3)' }}>Name, pieces, who it is for. It is sent to the dealers the moment you save.</div>
            </div>
            <button className="smp-ib" onClick={() => setAdding(false)} title="Close" aria-label="Close"><X size={15} /></button>
          </div>
          <div className="smp-mb">
            <div>
              <label className="smp-fl" htmlFor="smp-name">Sample name</label>
              <input id="smp-name" className="inp" autoFocus value={nf.name} onChange={e => setNf(f => ({ ...f, name: e.target.value }))} placeholder="e.g. FOLDER PASTELO" style={{ fontSize: 14, padding: '10px 12px' }} onKeyDown={e => { if (e.key === 'Enter') addSample(); }} />
            </div>
            <div className="smp-f2">
              <div>
                <label className="smp-fl" htmlFor="smp-stock">Pieces</label>
                <input id="smp-stock" className="inp" type="number" min="0" value={nf.stock} onChange={e => setNf(f => ({ ...f, stock: e.target.value }))} placeholder="How many pieces" style={{ fontSize: 14, padding: '10px 12px' }} onKeyDown={e => { if (e.key === 'Enter') addSample(); }} />
              </div>
              <div>
                <span className="smp-fl">Category</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 12px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--b1)', color: 'var(--t2)', fontSize: 13, fontWeight: 700 }}><Layers size={14} color="var(--acc)" /> {nf.category}</div>
              </div>
            </div>
            <div>
              <span className="smp-fl">Who gets it</span>
              <div className="smp-zones" role="radiogroup" aria-label="Zone group">
                {ZONE_GROUPS.map(g => { const on = sameZones(nf.zones, g.zones); return <button type="button" role="radio" aria-checked={on} key={g.label} className={'thr' + (on ? ' on' : '')} style={{ '--tone': g.tone || 'var(--acc)' }} onClick={() => pickZones(g.zones)}>{g.label}</button>; })}
              </div>
              <span className="smp-fl" style={{ marginTop: 10, color: 'var(--t3)' }}>Or one zone</span>
              <div className="smp-zones" role="radiogroup" aria-label="Single zone">
                {ZONES.map(z => { const on = sameZones(nf.zones, [z]); return <button type="button" role="radio" aria-checked={on} key={z} className={'thr' + (on ? ' on' : '')} style={{ '--tone': 'var(--acc)' }} onClick={() => pickZones([z])}>{z.replace('ZONE ', 'Zone ')}</button>; })}
              </div>
              <span className="smp-fl" style={{ marginTop: 10, color: 'var(--t3)' }}>Or by hand only</span>
              <div className="smp-zones">
                {SPECIAL.slice(1).map(z => <button type="button" role="radio" aria-checked={sameZones(nf.zones, [z])} key={z} className={'thr' + (sameZones(nf.zones, [z]) ? ' on' : '')} style={{ '--tone': 'var(--yel)' }} onClick={() => pickZones([z])}>{z === 'SPECIAL REQUIRMENT' ? 'Special requirement' : z === 'NEW DEALERS ONLY' ? 'New dealers only' : 'Architects'}</button>)}
              </div>
            </div>
            {/* who will get it, live */}
            {(() => {
              const idle = !nf.name.trim() || !(Number(nf.stock) > 0);
              const hand = !idle && preview && preview.byHand && !preview.total;
              const tone = idle || !preview ? 'var(--t3)' : hand ? 'var(--yel)' : 'var(--grn)';
              return <div className="smp-sum" style={{ '--tone': tone }}>
                <span className="smp-sum-ico">{idle ? <Eye size={16} /> : !preview ? <RefreshCw size={15} /> : hand ? <Tag size={15} /> : <Users size={16} />}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {idle ? <span style={{ color: 'var(--t3)' }}>Type the name and the pieces. The dealers who will get it appear here before you save.</span>
                    : !preview ? <span style={{ color: 'var(--t3)' }}>Working out who gets it…</span>
                    : hand ? <span>This tag is given by hand: after saving, use "Tag a dealer" for each piece.</span>
                    : <>
                        <div><b style={{ color: 'var(--grn)', fontSize: 14 }}>{num(preview.total)} dealers will get it</b></div>
                        {tiers(preview) && <div style={{ fontSize: 12 }}>{tiers(preview)}</div>}
                        {preview.left > 0 && <div style={{ color: 'var(--yel)', fontSize: 12, fontWeight: 700 }}>{num(preview.left)} pieces left for you to tag</div>}
                        {preview.total > 0 && <button type="button" className="smp-link" onClick={() => setShowList(v => !v)} style={{ marginTop: 4 }}>{showList ? 'Hide list' : 'See who →'}</button>}
                      </>}
                  {showList && preview?.zones?.length > 0 && <div className="smp-who" style={{ marginTop: 8 }}>
                    {preview.zones.filter(z => z.dealers.length).map(z => <div key={z.zone} style={{ fontSize: 12 }}><b style={{ color: 'var(--t2)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>{z.zone}</b><div>{z.dealers.map((d, i) => <span key={i} className="smp-pill">{d.name} <span className="smp-tier" style={{ '--tone': tierTone(d.tier) }}>{d.tier}</span></span>)}</div></div>)}
                  </div>}
                </div>
              </div>;
            })()}
            {msg && !msg.startsWith('✓') && <div className="smp-msg" style={{ '--tone': 'var(--red)', marginBottom: 0 }}><AlertTriangle size={15} style={{ flexShrink: 0 }} />{msg}</div>}
          </div>
          <div className="smp-mf">
            <button className="btn smp-b" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btnp smp-b" disabled={busy || !nf.name.trim() || !nf.zones.length} onClick={addSample} style={{ padding: '9px 18px' }}><Zap size={15} /> {busy ? 'Working…' : 'Save & send to dealers'}</button>
          </div>
        </div>
      </div>}

      {/* stock list */}
      {master && <div className="card smp-card">
        <div className="smp-card-h">
          <div className="sec-title"><span className="sec-ico" style={{ '--tone': 'var(--acc)' }}><Boxes size={15} /></span> Stock by zone <span className="count-pill">{num(rows.length)}</span></div>
        </div>
        <div className="smp-bar">
          <div className="smp-search"><Search size={14} color="var(--t3)" /><input value={sq} onChange={e => setSq(e.target.value)} placeholder="Search sample or zone…" aria-label="Search sample or zone" />{sq && <button className="smp-link" onClick={() => setSq('')} aria-label="Clear search" style={{ color: 'var(--t3)' }}><X size={13} /></button>}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['all', 'All', null, 'var(--acc)'], ['left', 'Left to allot', leftRows, 'var(--yel)'], ['special', 'By hand only', specialRows, 'var(--pur)']].map(([k, l, n, t]) => <button key={k} type="button" className={'thr' + (only === k ? ' on' : '')} style={{ '--tone': t }} onClick={() => setOnly(k)}>{l}{n !== null && <span className="smp-thr-n">{num(n)}</span>}</button>)}
          </div>
        </div>
        {!loaded ? <div style={{ display: 'grid', gap: 8, padding: '4px 14px 14px' }}>{[0, 1, 2, 3, 4].map(i => <span key={i} className="skel" style={{ height: 44, borderRadius: 10 }} />)}</div>
          : !rows.length ? (data.summary.length
            ? <Empty Icon={Search} title="Nothing matches">Try another name or zone, or clear the filter.</Empty>
            : <Empty Icon={Package} title="No sample yet">Add your first sample: its pieces go to the best dealers at once.<button className="btnp smp-b" style={{ marginTop: 10 }} onClick={() => { setAdding(true); setMsg(''); }}><Plus size={15} /> Add sample</button></Empty>)
          : <div className="smp-list">
            <div className="smp-row head"><span>Sample</span><span style={{ textAlign: 'right' }}>Stock</span><span style={{ textAlign: 'right' }}>Allotted</span><span style={{ textAlign: 'right' }}>Given</span><span style={{ textAlign: 'right' }}>Left</span><span /></div>
            {rows.map(s => {
              const out = s.stock ? Math.min(100, ((s.allocated + s.given) / s.stock) * 100) : 0;
              return (
                <div key={s.id} className={'smp-row' + (s.left > 0 ? ' left' : '')}>
                  <div className="smp-name" style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span className="ini" style={{ '--h': hue(s.name) }}>{initials(s.name)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--t1)', fontSize: 13, overflowWrap: 'anywhere' }}>{s.name}</div>
                      <div style={{ marginTop: 3 }}>{isRealZone(s.zone) ? <span className="smp-zc">{s.zone}</span> : <span className="smp-zc" style={{ '--tone': 'var(--yel)' }}><Tag size={10} /> {s.zone} · by hand</span>}</div>
                    </div>
                  </div>
                  <div className="smp-num">
                    <span className="smp-lbl">Stock</span>
                    {editStock?.id === s.id ? <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><input className="inp" autoFocus type="number" min="0" value={editStock.value} onChange={e => setEditStock({ id: s.id, value: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveStock(s); if (e.key === 'Escape') setEditStock(null); }} style={{ width: 72, padding: '4px 7px', fontSize: 12 }} aria-label="New stock" /><button className="btnp" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => saveStock(s)}>OK</button></span>
                      : <span title="Click to change the stock" onClick={() => setEditStock({ id: s.id, value: s.stock })} className="smp-edit">{num(s.stock)} <Pencil size={10} style={{ verticalAlign: -1, color: 'var(--t3)' }} /></span>}
                    <div className="pbar" title="allotted + given, of the stock"><div style={{ width: out + '%', background: out >= 100 ? 'var(--grn)' : 'var(--acc)' }} /></div>
                  </div>
                  <div className="smp-num" style={{ color: 'var(--acc)' }}><span className="smp-lbl">Allotted</span>{num(s.allocated)}</div>
                  <div className="smp-num" style={{ color: 'var(--grn)' }}><span className="smp-lbl">Given</span>{num(s.given)}</div>
                  <div className="smp-num" style={{ color: s.left > 0 ? 'var(--yel)' : 'var(--t3)', fontWeight: 850 }}><span className="smp-lbl">Left</span>{num(s.left)}</div>
                  <div className="smp-act">
                    {s.left > 0 && isRealZone(s.zone) && <button className="btne smp-sb" disabled={busy} onClick={() => allotNow(s)} title="Allot the left-over pieces to the next best dealers of this zone"><Zap size={12} /> Allot now</button>}
                    {s.left > 0 && <button className="smp-ib" style={{ '--tone': 'var(--pur)' }} disabled={busy} onClick={() => openTag(s)} title="Tag a dealer" aria-label="Tag a dealer"><Tag size={14} /></button>}
                    {onDelete && <button className="smp-ib" style={{ '--tone': 'var(--red)' }} disabled={busy} title="Delete this sample row" aria-label="Delete this sample row" onClick={() => onDelete(s).then(load)}><Trash2 size={14} /></button>}
                  </div>
                </div>);
            })}
          </div>}
      </div>}

      {/* manual tag picker — a modal */}
      {master && tagFor && (
        <div className="overlay" onClick={() => setTagFor(null)}>
          <div className="modal smp-modal" onClick={e => e.stopPropagation()} role="dialog" aria-label="Tag a dealer" style={{ maxWidth: 520 }}>
            <div className="smp-mh">
              <span className="sec-ico lg" style={{ '--tone': 'var(--pur)' }}><Tag size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 850, color: 'var(--t1)', overflowWrap: 'anywhere' }}>Tag "{tagFor.name}"</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}><span className="smp-zc">{tagFor.zone}</span><span className="smp-zc" style={{ '--tone': 'var(--yel)' }}>{num(tagFor.left)} left</span></div>
              </div>
              <button className="smp-ib" onClick={() => setTagFor(null)} title="Close" aria-label="Close"><X size={15} /></button>
            </div>
            <div className="smp-mb" style={{ gap: 10 }}>
              <div className="smp-search"><Search size={14} color="var(--t3)" /><input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search a dealer in this zone…" aria-label="Search a dealer" /></div>
              <Msg msg={msg} />
              <div style={{ display: 'grid', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
                {hits.map(d => (
                  <div key={d.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '7px 9px', borderRadius: 10, background: 'var(--bg2)', border: '1px solid var(--b1)' }}>
                    <span className="ini" style={{ '--h': hue(d.name) }}>{initials(d.name)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--t1)', overflowWrap: 'anywhere' }}>{d.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{d.zone || 'no zone'} · {d.status}</div>
                    </div>
                    <button className="btnp smp-sb" disabled={busy} onClick={() => act(async () => { await api.allocSample({ sampleId: tagFor.id, dealerId: d.id }); setTagFor(t => t ? { ...t, left: t.left - 1 } : t); }, `✓ ${tagFor.name} tagged to ${d.name}`)}><Tag size={11} /> Tag</button>
                  </div>
                ))}
                {!hits.length && (dealers.length ? <Empty Icon={Search} title="No dealer matches">Try another name.</Empty>
                  : <div style={{ display: 'grid', gap: 6 }}>{[0, 1, 2, 3].map(i => <span key={i} className="skel" style={{ height: 46, borderRadius: 10 }} />)}</div>)}
              </div>
            </div>
            <div className="smp-mf"><button className="btn smp-b" onClick={() => setTagFor(null)}>Done</button></div>
          </div>
        </div>
      )}

      {/* dealer-wise: every dealer and where his samples stand */}
      {statusView && <DealerSamples busy={busy} act={act} />}

      {/* allocations list — collapsible */}
      {statusView && <div className="card smp-card">
        <button className="smp-coll" onClick={() => setShowAllocs(v => !v)} aria-expanded={showAllocs}>
          <span className="sec-ico" style={{ '--tone': 'var(--yel)' }}><Tag size={15} /></span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 14.5, fontWeight: 800, color: 'var(--t1)' }}>Allocation list <span className="count-pill" style={requests ? { color: 'var(--yel)', background: 'color-mix(in srgb, var(--yel) 14%, transparent)' } : undefined}>{num(data.items.length)} {status === 'REQUESTED' ? 'requests' : 'rows'}</span></span>
            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--t3)', marginTop: 2 }}>{showAllocs ? `Showing: ${statusLabel}` : `Every allotment row, by status — ${statusLabel.toLowerCase()}`}</span>
          </span>
          <span className="btn smp-sb" style={{ pointerEvents: 'none' }}>{showAllocs ? 'Hide' : 'Show'} {showAllocs ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
        </button>
        {showAllocs && <>
          <div className="smp-bar" style={{ borderTop: '1px solid var(--b1)' }}>
            <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 700 }}>Status</span>
            <select className="sel" value={status} onChange={e => setStatus(e.target.value)} style={{ fontSize: 12.5 }}>
              <option value="REQUESTED">Requests to approve</option><option value="ALLOCATED">To be given</option><option value="GIVEN">Given</option><option value="RETURNED">Taken back</option><option value="">All</option>
            </select>
            <span style={{ fontSize: 11.5, color: 'var(--t3)', marginLeft: 'auto' }}>{num(data.items.length)} rows</span>
          </div>
          <div style={{ maxHeight: 420, overflowY: 'auto', borderTop: '1px solid var(--b1)' }}>
            {data.items.length > 0 && <div className="smp-al head" style={{ borderTop: 'none' }}><span>Dealer</span><span>Sample</span><span>Why</span><span>Status</span><span /></div>}
            {data.items.map(a => (
              <div key={a._id} className="smp-al" style={a.status === 'REQUESTED' ? { background: 'color-mix(in srgb, var(--yel) 6%, transparent)' } : undefined}>
                <div className="a-dealer" style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                  <span className="ini" style={{ '--h': hue(a.dealerName) }}>{initials(a.dealerName)}</span>
                  <div style={{ minWidth: 0 }}><div style={{ fontWeight: 700, color: 'var(--t1)', overflowWrap: 'anywhere' }}>{a.dealerName}</div><div style={{ fontSize: 10.5, color: 'var(--t3)' }}>{a.dealerZone || '—'}{a.salesman ? ' · ' + a.salesman : ''}</div></div>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--t1)', minWidth: 0, overflowWrap: 'anywhere' }}>{a.sampleName}</div>
                <div style={{ color: 'var(--t3)', fontSize: 12, minWidth: 0, overflowWrap: 'anywhere' }}>{a.reason}{a.takeBack ? ' · take back' : ''}</div>
                <div>{statusBadge(a)}</div>
                <div className="a-act smp-act">
                  {a.status === 'REQUESTED' && <>
                    <button className="btnp smp-sb" disabled={busy} onClick={() => act(() => api.updateAlloc(a._id, { status: 'ALLOCATED' }), `✓ approved — ${a.sampleName} for ${a.dealerName}`)}><Check size={12} /> Approve</button>
                    <button className="btn smp-sb" disabled={busy} onClick={() => { const r = window.prompt('Reason for rejecting?'); if (r === null) return; act(() => api.updateAlloc(a._id, { status: 'CANCELLED', reason: r }), 'rejected'); }}><X size={12} /> Reject</button>
                  </>}
                  {a.status === 'ALLOCATED' && <>
                    <button className="smp-ib" style={{ '--tone': 'var(--grn)' }} disabled={busy} title="Mark as given now" aria-label="Mark as given now" onClick={() => act(() => api.allocGiven(a._id), '✓ marked given')}><CheckCircle2 size={14} /></button>
                    <button className="smp-ib" style={{ '--tone': 'var(--t2)' }} disabled={busy} title="Cancel this allocation" aria-label="Cancel this allocation" onClick={() => act(() => api.updateAlloc(a._id, { status: 'CANCELLED' }), 'cancelled')}><Undo2 size={14} /></button>
                  </>}
                  {a.status === 'GIVEN' && <button className={a.takeBack ? 'btnd smp-sb' : 'btn smp-sb'} disabled={busy} title={a.takeBack ? 'Stop asking for it back' : 'Ask the salesman to take it back on the next visit'} onClick={() => act(() => api.updateAlloc(a._id, { takeBack: !a.takeBack }), a.takeBack ? 'take-back removed' : '✓ flagged for take back')}><Undo2 size={12} /> {a.takeBack ? 'take back ✓' : 'take back'}</button>}
                </div>
              </div>
            ))}
            {!data.items.length && <Empty Icon={Inbox} title="Nothing here">{status === 'REQUESTED' ? 'No salesman request is waiting.' : 'No row with this status.'}</Empty>}
          </div>
        </>}
      </div>}
    </div>
  );
}

/** Every dealer with samples: what he holds, what is waiting for him, what he asked for, what must come back. */
function DealerSamples({ busy, act }) {
  const [d, setD] = useState(null);
  const [q, setQ] = useState('');
  const [sm, setSm] = useState('');
  const [zone, setZone] = useState('');
  const [tier, setTier] = useState('');
  const [only, setOnly] = useState('all');     // all | toGive | requested | takeBack | none
  const [open, setOpen] = useState({});        // dealer key → expanded (quick look)
  const [dealer, setDealer] = useState(null);  // { id, name } → the full dealer modal
  const [limit, setLimit] = useState(60);      // render in pages — long lists stay quick
  const load = () => api.sampleStatusDealers().then(setD).catch(() => setD({ dealers: [], totals: {} }));
  useEffect(() => { load(); }, []);
  useEffect(() => { setLimit(60); }, [q, sm, zone, tier, only]);
  const rows = useMemo(() => {
    if (!d) return [];
    const s = q.trim().toLowerCase();
    return d.dealers.filter(r => (!s || r.name.toLowerCase().includes(s) || r.has.some(x => x.name.toLowerCase().includes(s)) || r.toGive.some(x => x.name.toLowerCase().includes(s)))
      && (!sm || r.salesman === sm) && (!zone || r.zone === zone) && (!tier || r.tier === tier)
      && (only === 'all' ? true : only === 'toGive' ? r.toGive.length : only === 'requested' ? r.requested.length : only === 'takeBack' ? r.takeBack.length : only === 'none' ? !r.hasCount : true));
  }, [d, q, sm, zone, tier, only]);
  const salesmen = useMemo(() => d ? [...new Map(d.dealers.filter(r => r.salesman).map(r => [r.salesman, r.salesmanName])).entries()].sort((a, b) => a[1].localeCompare(b[1])) : [], [d]);
  const zones = useMemo(() => d ? [...new Set(d.dealers.map(r => r.zone).filter(Boolean))].sort() : [], [d]);
  const tierList = useMemo(() => d ? [...new Set(d.dealers.map(r => r.tier).filter(Boolean))].sort((a, b) => (a === 'NONE') - (b === 'NONE') || a.localeCompare(b)) : [], [d]);
  const counts = useMemo(() => d ? {
    toGive: d.dealers.filter(r => r.toGive.length).length, requested: d.dealers.filter(r => r.requested.length).length,
    takeBack: d.dealers.filter(r => r.takeBack.length).length, none: d.dealers.filter(r => !r.hasCount).length,
  } : {}, [d]);
  const T = d?.totals || {};

  const approve = (x, r) => act(async () => { await api.updateAlloc(x.id, { status: 'ALLOCATED' }); await load(); }, `✓ approved ${x.name} for ${r.name}`);
  const reject = (x) => { const why = window.prompt('Reason for rejecting?'); if (why === null) return; act(async () => { await api.updateAlloc(x.id, { status: 'CANCELLED', reason: why }); await load(); }, 'rejected'); };
  const given = (x, r) => act(async () => { await api.allocGiven(x.id); await load(); }, `✓ ${x.name} marked given to ${r.name}`);

  if (!d) return (
    <div aria-busy="true" aria-label="Loading every dealer's samples">
      <div className="smp-tiles">{[0, 1, 2, 3, 4].map(i => <span key={i} className="skel" style={{ height: 66, borderRadius: 14 }} />)}</div>
      <div className="card smp-card">
        <div style={{ display: 'flex', gap: 8, padding: 14, flexWrap: 'wrap' }}><span className="skel" style={{ height: 36, flex: '1 1 220px', borderRadius: 10 }} /><span className="skel" style={{ height: 36, width: 130, borderRadius: 10 }} /><span className="skel" style={{ height: 36, width: 110, borderRadius: 10 }} /></div>
        <div className="smp-dl">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="smp-dc" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
              <span className="skel" style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'grid', gap: 6 }}><span className="skel" style={{ height: 12, width: `${55 - i * 4}%` }} /><span className="skel" style={{ height: 9, width: '30%' }} /></div>
              <span className="skel" style={{ height: 20, width: 56, borderRadius: 20 }} /><span className="skel" style={{ height: 20, width: 56, borderRadius: 20 }} />
            </div>))}
        </div>
      </div>
    </div>);

  return (
    <div>
      <div className="smp-tiles">
        <Tile label="Dealers with samples" value={T.dealers} tone="var(--pur)" Icon={Users} onClick={() => setOnly('all')} active={only === 'all'} />
        <Tile label="Pieces with dealers" value={T.has} tone="var(--grn)" Icon={CheckCircle2} />
        <Tile label="To be given" value={T.toGive} tone="var(--acc)" Icon={Send} onClick={() => setOnly('toGive')} active={only === 'toGive'} sub="STAR · KEY ACCOUNT · ACHIEVER" />
        <Tile label="Requested" value={T.requested} tone="var(--yel)" Icon={Zap} onClick={() => setOnly('requested')} active={only === 'requested'} />
        <Tile label="To take back" value={T.takeBack} tone="var(--red)" Icon={Undo2} onClick={() => setOnly('takeBack')} active={only === 'takeBack'} />
      </div>

      {T.requested > 0 && only !== 'requested' && <div className="smp-banner" role="status">
        <span className="smp-banner-ico"><Zap size={18} /></span>
        <div style={{ flex: '1 1 200px', minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--t1)' }}>{num(T.requested)} salesman request{T.requested === 1 ? '' : 's'} waiting for approval</div>
          <div style={{ fontSize: 11.5, color: 'var(--t3)' }}>from {num(counts.requested)} dealer{counts.requested === 1 ? '' : 's'} · approve or reject them below</div>
        </div>
        <button className="btn smp-sb" onClick={() => setOnly('requested')} style={{ borderColor: 'var(--yel)', color: 'var(--yel)' }}>Show them <ArrowUpRight size={13} /></button>
      </div>}

      <div className="card smp-card">
        <div className="smp-card-h">
          <div className="sec-title"><span className="sec-ico" style={{ '--tone': 'var(--pur)' }}><Users size={15} /></span> Dealer-wise <span className="count-pill">{num(rows.length)}</span></div>
          <span className="sec-note" style={{ flex: '1 1 200px' }}>tap a dealer to open him · the arrow shows his four sample lists here</span>
          <button className="smp-ib" onClick={load} title="Refresh" aria-label="Refresh"><RefreshCw size={13} /></button>
        </div>
        <div className="smp-bar">
          <div className="smp-search"><Search size={14} color="var(--t3)" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Dealer or sample name…" aria-label="Search dealer or sample" />{q && <button className="smp-link" onClick={() => setQ('')} aria-label="Clear search" style={{ color: 'var(--t3)' }}><X size={13} /></button>}</div>
          <select className="sel" value={sm} onChange={e => setSm(e.target.value)} aria-label="Salesman"><option value="">All salesmen</option>{salesmen.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
          <select className="sel" value={zone} onChange={e => setZone(e.target.value)} aria-label="Zone"><option value="">All zones</option>{zones.map(z => <option key={z} value={z}>{z}</option>)}</select>
          {tierList.length > 1 && <select className="sel" value={tier} onChange={e => setTier(e.target.value)} aria-label="Tier"><option value="">All tiers</option>{tierList.map(t => <option key={t} value={t}>{t === 'NONE' ? 'No tier' : t}</option>)}</select>}
        </div>
        <div className="smp-chipsrow">
          {[['all', 'All', d.dealers.length, 'var(--acc)'], ['toGive', 'To be given', counts.toGive, 'var(--acc)'], ['requested', 'Requested', counts.requested, 'var(--yel)'], ['takeBack', 'To take back', counts.takeBack, 'var(--red)'], ['none', 'Holds nothing', counts.none, 'var(--t2)']].map(([k, l, n, t]) => <button key={k} type="button" className={'thr' + (only === k ? ' on' : '')} style={{ '--tone': t }} onClick={() => setOnly(k)}>{l}<span className="smp-thr-n">{num(n)}</span></button>)}
        </div>

        <div className="smp-dl">
          {rows.slice(0, limit).map(r => {
            const k = r.id || r.name; const ex = !!open[k];
            // allotted folders (the STAR / KEY ACCOUNT / ACHIEVER rule, or the office) are to be GIVEN; the zone's other folders are to be SHOWN
            const sub = [r.zone || 'no zone', r.salesmanName, r.city].filter(Boolean).join(' · ');
            const cols = [
              ['To be shown', 'var(--pur)', Eye, (r.toShow || []).map(x => ({ key: x.id, text: x.name, title: 'in the zone, not with him yet — sell well and it is his' }))],
              ['Already has', 'var(--grn)', CheckCircle2, r.has.map((x, i) => ({ key: 'h' + i, text: x.name + (x.qty > 1 ? ' ×' + x.qty : ''), sub: x.date, title: x.date ? 'given ' + x.date : '' }))],
              ['To be given', 'var(--acc)', Send, r.toGive.map(x => ({ key: x.id, text: x.name, sub: x.why, title: x.why, act: ['given', () => given(x, r)] }))],
              ['To be taken back', 'var(--red)', Undo2, [...r.takeBack.map(x => ({ key: x.id, text: x.name, sub: 'next visit', title: 'on the next visit' })), ...r.returned.map((x, i) => ({ key: 'r' + i, text: x.name, sub: 'taken back' + (x.date ? ' · ' + x.date : ''), dim: true }))]],
            ];
            const cnt = (n, tone, label, Icon) => n > 0 ? <span className="smp-cnt" style={{ '--tone': tone }}>{Icon && <Icon size={11} />}{num(n)} {label}</span> : null;
            const nothing = !r.hasCount && !r.toGive.length && !r.requested.length && !r.takeBack.length;
            return (
              <div key={k} className={'smp-dc' + (r.requested.length ? ' req' : '')}>
                <div className="smp-dh" onClick={() => r.id ? setDealer({ id: r.id, name: r.name }) : setOpen(o => ({ ...o, [k]: !o[k] }))} title={r.id ? 'Open the dealer: samples, outstanding, visits, MOM' : 'Not matched to a dealer in the master — quick look only'}>
                  <div className="smp-dh-main">
                    <button className={'smp-chev' + (ex ? ' on' : '')} onClick={e => { e.stopPropagation(); setOpen(o => ({ ...o, [k]: !o[k] })); }} title="Quick look: his four sample lists" aria-label="Quick look" aria-expanded={ex}>{ex ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
                    <span className="ini" style={{ '--h': hue(r.name) }}>{initials(r.name)}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="smp-dh-name">{r.name}{r.tier !== 'NONE' && <span className="smp-tier" style={{ '--tone': tierTone(r.tier) }}>{r.tier}</span>}</div>
                      <div className="smp-dh-sub">{sub}{r.lastGiven ? ` · last given ${r.lastGiven}` : ''}</div>
                    </div>
                  </div>
                  <div className="smp-dh-r">
                    {cnt(r.requested.length, 'var(--yel)', 'requested', Zap)}
                    {cnt(r.hasCount, 'var(--grn)', 'has', null)}
                    {cnt(r.toGive.length, 'var(--acc)', 'to give', null)}
                    {cnt(r.takeBack.length, 'var(--red)', 'back', null)}
                    {nothing && <span className="smp-cnt zero">holds nothing</span>}
                    {r.id && <button className="btn smp-sb" onClick={e => { e.stopPropagation(); setDealer({ id: r.id, name: r.name }); }}>Open <ArrowUpRight size={12} /></button>}
                  </div>
                </div>

                {r.requested.length > 0 && <div className="smp-req" onClick={e => e.stopPropagation()}>
                  <div className="smp-req-t"><Zap size={12} /> Requested by salesman · waiting for approval <span className="smp-col-n" style={{ '--tone': 'var(--yel)' }}>{r.requested.length}</span></div>
                  {r.requested.map(x => (
                    <div key={x.id} className="smp-req-i">
                      <div className="nm">{x.name}{x.why && <span>{x.why}</span>}</div>
                      <button className="btnp smp-sb" disabled={busy} onClick={() => approve(x, r)}><Check size={12} /> Approve</button>
                      <button className="btn smp-sb" disabled={busy} onClick={() => reject(x)}><X size={12} /> Reject</button>
                    </div>))}
                </div>}

                {ex && <div className="smp-cols">
                  {cols.map(([title, tone, Icon, items]) => (
                    <div key={title} className="smp-col" style={{ '--tone': tone }}>
                      <div className="smp-col-t"><Icon size={12} /> {title} <span className="smp-col-n">{title === 'Already has' && r.hasCount !== items.length ? `${items.length} · ${num(r.hasCount)} pcs` : items.length}</span></div>
                      {items.length ? <div className="smp-chips">
                        {items.map(it => (
                          <span key={it.key} className={'smp-chip' + (it.act ? '' : ' noact') + (it.dim ? ' dim' : '')} style={{ '--tone': tone }} title={it.title || undefined}>
                            {it.star && <span className="st">★</span>}
                            <span className="nm">{it.text}</span>
                            {it.sub && <span className="sb">{it.sub}</span>}
                            {it.act && <button disabled={busy} onClick={e => { e.stopPropagation(); it.act[1](); }} title="Mark as given">{it.act[0]}</button>}
                          </span>))}
                      </div> : <div className="smp-none">Nothing here</div>}
                    </div>))}
                </div>}
              </div>);
          })}
          {!rows.length && <Empty Icon={Users} title={d.dealers.length ? 'No dealer matches' : 'No dealer holds a sample yet'}>{d.dealers.length ? 'Try another name, or clear a filter.' : 'Samples appear here as soon as they are allotted.'}</Empty>}
          {rows.length > limit && <button className="btn smp-b" style={{ justifySelf: 'center' }} onClick={() => setLimit(l => l + 60)}>Show {num(Math.min(60, rows.length - limit))} more · {num(rows.length - limit)} left</button>}
        </div>
      </div>
      {dealer && <DealerVisitModal dealerId={dealer.id} dealerName={dealer.name} onClose={() => { setDealer(null); load(); }} />}
    </div>
  );
}
