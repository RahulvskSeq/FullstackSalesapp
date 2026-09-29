// import { MO, CURRENT_MONTH_IDX } from '../constants';
// import { trendPct, forecast, pct } from '../utils';

// // ── Shared canvas builder — used by both download and share ─────────────────
// function buildCanvas(dealer, users, selectedMonthIdx) {
//   const sm          = users[dealer.salesman];
//   const viewAchieved= dealer.months[selectedMonthIdx] || 0;
//   const viewTarget  = dealer.monthTargets?.[selectedMonthIdx] ?? dealer.target;
//   const p           = viewTarget ? Math.round((viewAchieved/viewTarget)*100) : null;
//   const tp          = trendPct(dealer.months);
//   const fc          = forecast(dealer.months);
//   const total       = dealer.months.reduce((a,b)=>a+b,0);

//   // Canvas tall enough for: header + KPIs + bar chart + monthly table + footer
//   const W = 1000, H = 1050;
//   const canvas = document.createElement('canvas');
//   canvas.width = W; canvas.height = H;
//   const ctx = canvas.getContext('2d');

//   // ── Background ──────────────────────────────────────
//   ctx.fillStyle = '#080810'; ctx.fillRect(0,0,W,H);
//   const grad = ctx.createLinearGradient(0,0,W,0);
//   grad.addColorStop(0,'#6366f1'); grad.addColorStop(1,'#a78bfa');
//   ctx.fillStyle = grad; ctx.fillRect(0,0,W,4);

//   // ── Header ───────────────────────────────────────────
//   ctx.fillStyle = '#6366f1'; ctx.font = '600 11px monospace';
//   ctx.fillText('▸ SALES TRACKER PRO', 36, 36);
//   ctx.fillStyle = '#e2e0f0'; ctx.font = 'bold 26px system-ui';
//   ctx.fillText(dealer.name.slice(0,55), 36, 70);

//   const statusColors = { 'ACTIVE':'#34d399','ACHIVERS':'#34d399','ACHIEVERS':'#34d399','KEY ACCOUNT':'#a78bfa','INACTIVE':'#fbbf24','DEAD':'#f87171' };
//   const sc = statusColors[(dealer.status||'').toUpperCase()] || '#9492a8';
//   ctx.fillStyle = sc+'22';
//   ctx.beginPath(); ctx.roundRect(36, 82, (dealer.status||'').length*8+20, 22, 4); ctx.fill();
//   ctx.fillStyle = sc; ctx.font = '600 11px system-ui';
//   ctx.fillText(dealer.status||'—', 46, 97);

//   let xOff = 36 + (dealer.status||'').length*8 + 30;
//   if(dealer.zone)       { ctx.fillStyle='#55546a'; ctx.font='12px system-ui'; ctx.fillText(dealer.zone, xOff, 97); xOff+=dealer.zone.length*8+12; }
//   if(dealer.city||dealer.state) { ctx.fillStyle='#55546a'; ctx.fillText([dealer.city,dealer.state].filter(Boolean).join(', '), xOff, 97); xOff+=120; }
//   if(dealer.category)   { ctx.fillStyle='#818cf8'; ctx.fillText(dealer.category+(dealer.categoryType?' / '+dealer.categoryType:''), xOff, 97); }

//   ctx.fillStyle = '#1e1e30'; ctx.fillRect(36,110,W-72,1);

//   // ── KPI grid (3 rows × 4 cols) ───────────────────────
//   const kpis = [
//     { label: MO[selectedMonthIdx]+' Target',  value: String(viewTarget||'—'),             color: '#e2e0f0' },
//     { label: MO[selectedMonthIdx]+' Achieved',value: String(viewAchieved),                color: '#34d399' },
//     { label: 'Achievement',                   value: p!==null?p+'%':'N/T',               color: p===null?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171' },
//     { label: '6-mo Avg',                      value: String(dealer.avg6m||0),            color: '#e2e0f0' },
//     { label: 'Forecast',                      value: String(fc),                         color: '#6366f1' },
//     { label: 'Trend (3m)',                    value: (tp>0?'+':'')+tp+'%',              color: tp>0?'#34d399':tp<0?'#f87171':'#9492a8' },
//     { label: '11mo Total',                    value: String(total),                      color: '#e2e0f0' },
//     { label: 'Credit Days',                   value: dealer.creditDays?dealer.creditDays+'d':'—', color:'#e2e0f0' },
//     { label: 'Credit Limit',                  value: dealer.creditLimit?'₹'+dealer.creditLimit.toLocaleString('en-IN'):'—', color:'#e2e0f0' },
//     { label: 'Category',                      value: (dealer.category||'—').slice(0,20), color: '#818cf8' },
//     { label: 'Cat Type',                      value: (dealer.categoryType||'—').slice(0,20), color:'#818cf8' },
//     { label: 'Salesman',                      value: (sm?.name||dealer.salesman).slice(0,20), color:'#fbbf24' },
//   ];
//   kpis.forEach((k,i) => {
//     const col=i%4, row=Math.floor(i/4);
//     const x=36+col*237, y=126+row*82;
//     ctx.fillStyle='#141422'; ctx.beginPath(); ctx.roundRect(x,y,222,70,8); ctx.fill();
//     ctx.fillStyle='#55546a'; ctx.font='10px system-ui';
//     ctx.fillText(k.label.toUpperCase(), x+12, y+18);
//     ctx.fillStyle=k.color; ctx.font='bold 19px system-ui';
//     ctx.fillText(k.value, x+12, y+46);
//   });

//   // ── Bar chart ────────────────────────────────────────
//   const chartY=380, chartH=110, chartW=W-72;
//   const barW=Math.floor(chartW/MO.length)-4;
//   const maxVal=Math.max(...dealer.months,1);

//   ctx.fillStyle='#9492a8'; ctx.font='600 11px system-ui';
//   ctx.fillText('11-Month Performance', 36, chartY-10);
//   ctx.fillStyle='#55546a'; ctx.font='9px system-ui';
//   ctx.fillText('dashed = target', 200, chartY-10);

//   dealer.months.forEach((v,i) => {
//     const bh  = Math.max((v/maxVal)*(chartH-16), v>0?3:0);
//     const bx  = 36+i*(barW+4);
//     const by  = chartY+chartH-bh;
//     const mt  = dealer.monthTargets?.[i] ?? dealer.target;
//     const isSel = i===selectedMonthIdx;

//     // Bar
//     ctx.fillStyle = isSel?'#6366f1':'#252538';
//     ctx.beginPath(); ctx.roundRect(bx,by,barW,bh,2); ctx.fill();

//     // Per-month target dashed line
//     if(mt>0) {
//       const th = Math.max((mt/maxVal)*(chartH-16),2);
//       ctx.strokeStyle='#34d39966'; ctx.lineWidth=1.5;
//       ctx.beginPath(); ctx.setLineDash([3,3]);
//       ctx.moveTo(bx, chartY+chartH-th);
//       ctx.lineTo(bx+barW, chartY+chartH-th);
//       ctx.stroke(); ctx.setLineDash([]);
//     }

//     // Month label
//     ctx.fillStyle = isSel?'#6366f1':'#55546a';
//     ctx.font = isSel?'bold 9px system-ui':'9px system-ui';
//     ctx.fillText(MO[i].slice(0,3), bx, chartY+chartH+13);

//     // Value label above bar
//     if(v>0) {
//       ctx.fillStyle = isSel?'#fff':'#9492a8';
//       ctx.font='8px system-ui';
//       ctx.fillText(v, bx+2, by-4);
//     }
//   });

//   // ── Monthly detail table ─────────────────────────────
//   const tblY = chartY + chartH + 30;
//   ctx.fillStyle='#9492a8'; ctx.font='600 11px system-ui';
//   ctx.fillText('Month-by-Month Breakdown', 36, tblY-8);

//   // Table header
//   const cols = [
//     {w:72,  label:'Month',    align:'left'},
//     {w:70,  label:'Achieved', align:'right'},
//     {w:70,  label:'Target',   align:'right'},
//     {w:65,  label:'Ach %',    align:'right'},
//     {w:65,  label:'vs Tgt %', align:'right'},
//     {w:70,  label:'Δ MoM',    align:'right'},
//     {w:65,  label:'Δ MoM %',  align:'right'},
//     {w:180, label:'Bar',      align:'left'},
//   ];

//   // Header row bg
//   ctx.fillStyle='#141422';
//   ctx.fillRect(36, tblY, W-72, 18);
//   let cx=40;
//   cols.forEach(col => {
//     ctx.fillStyle='#55546a'; ctx.font='bold 9px system-ui';
//     ctx.fillText(col.label, col.align==='right'?cx+col.w-ctx.measureText(col.label).width-2:cx, tblY+12);
//     cx+=col.w;
//   });

//   // Data rows — newest first (reverse)
//   [...dealer.months].map((_,di)=>{
//     const i   = dealer.months.length-1-di;
//     const v   = dealer.months[i];
//     const mt  = dealer.monthTargets?.[i] ?? dealer.target;
//     const prev= i>0?dealer.months[i-1]:null;
//     const diff= prev!=null?v-prev:null;
//     const diffP= prev&&prev>0?Math.round(((v-prev)/prev)*100):null;
//     const vsPct= mt?Math.round((v/mt)*100):null;
//     const achPct= total>0?Math.round((v/total)*100):0;
//     const isSel= i===selectedMonthIdx;
//     const isCur= i===CURRENT_MONTH_IDX;

//     const rowY = tblY+18+di*18;
//     if(rowY+18 > H-30) return; // don't overflow canvas

//     // Row background
//     ctx.fillStyle = isSel?'rgba(99,102,241,0.12)':di%2===0?'#0d0d1a':'#080810';
//     ctx.fillRect(36, rowY, W-72, 18);

//     let rx=40;

//     // Month
//     ctx.fillStyle = isSel?'#6366f1':isCur?'#34d399':'#9492a8';
//     ctx.font = isSel?'bold 9px system-ui':isCur?'600 9px system-ui':'9px system-ui';
//     ctx.fillText(MO[i]+(isCur?' ★':'')+(isSel?' ◀':''), rx, rowY+12);
//     rx+=72;

//     // Achieved
//     ctx.fillStyle=v>0?'#e2e0f0':'#3a3a50'; ctx.font='600 9px system-ui';
//     const achStr=String(v||'—');
//     ctx.fillText(achStr, rx+70-ctx.measureText(achStr).width-2, rowY+12);
//     rx+=70;

//     // Target
//     ctx.fillStyle='#55546a'; ctx.font='9px system-ui';
//     const tgtStr=String(mt||'—');
//     ctx.fillText(tgtStr, rx+70-ctx.measureText(tgtStr).width-2, rowY+12);
//     rx+=70;

//     // Ach %
//     const achPctStr=achPct+'%';
//     ctx.fillStyle='#55546a'; ctx.font='9px system-ui';
//     ctx.fillText(achPctStr, rx+65-ctx.measureText(achPctStr).width-2, rowY+12);
//     rx+=65;

//     // vs Target %
//     const vsStr=vsPct!==null?vsPct+'%':'—';
//     ctx.fillStyle=vsPct===null?'#55546a':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171';
//     ctx.font='600 9px system-ui';
//     ctx.fillText(vsStr, rx+65-ctx.measureText(vsStr).width-2, rowY+12);
//     rx+=65;

//     // Δ MoM
//     const diffStr=diff!=null?(diff>0?'+':'')+diff:'—';
//     ctx.fillStyle=diff==null?'#55546a':diff>0?'#34d399':diff<0?'#f87171':'#9492a8';
//     ctx.font='9px system-ui';
//     ctx.fillText(diffStr, rx+70-ctx.measureText(diffStr).width-2, rowY+12);
//     rx+=70;

//     // Δ MoM %
//     const diffPStr=diffP!=null?(diffP>0?'+':'')+diffP+'%':'—';
//     ctx.fillStyle=diffP==null?'#55546a':diffP>0?'#34d399':diffP<0?'#f87171':'#9492a8';
//     ctx.fillText(diffPStr, rx+65-ctx.measureText(diffPStr).width-2, rowY+12);
//     rx+=65;

//     // Mini bar (achieved vs target)
//     const barMaxW=170;
//     const achBarW=v>0?Math.max(Math.round((v/Math.max(...dealer.months,1))*barMaxW),3):0;
//     ctx.fillStyle='#1e1e30';
//     ctx.fillRect(rx, rowY+6, barMaxW, 6);
//     if(achBarW>0){
//       ctx.fillStyle=isSel?'#6366f1':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171';
//       ctx.beginPath(); ctx.roundRect(rx, rowY+6, achBarW, 6, 2); ctx.fill();
//     }
//     // Target tick
//     if(mt>0){
//       const tgtX=rx+Math.min(Math.round((mt/Math.max(...dealer.months,1))*barMaxW),barMaxW-1);
//       ctx.strokeStyle='#34d399'; ctx.lineWidth=1.5;
//       ctx.beginPath(); ctx.moveTo(tgtX,rowY+4); ctx.lineTo(tgtX,rowY+14); ctx.stroke();
//     }
//   });

//   // ── Footer ───────────────────────────────────────────
//   ctx.fillStyle='#252538'; ctx.fillRect(36, H-28, W-72, 1);
//   ctx.fillStyle='#55546a'; ctx.font='10px monospace';
//   ctx.fillText(`Generated: ${new Date().toLocaleString('en-IN')} · ${sm?.name||dealer.salesman} · Sales Tracker Pro`, 36, H-12);

//   return canvas;
// }

// // ── Download ─────────────────────────────────────────────────────────────────
// const downloadDealerCard = (dealer, users, selectedMonthIdx) => {
//   const canvas   = buildCanvas(dealer, users, selectedMonthIdx);
//   const filename = `${dealer.name.replace(/[^a-z0-9]/gi,'_')}_${MO[selectedMonthIdx]}.png`;
//   const link     = document.createElement('a');
//   link.download  = filename;
//   link.href      = canvas.toDataURL('image/png');
//   link.click();
// };

// // ── Share ─────────────────────────────────────────────────────────────────────
// const shareDealerCard = async (dealer, users, selectedMonthIdx) => {
//   const canvas   = buildCanvas(dealer, users, selectedMonthIdx);
//   const filename = `${dealer.name.replace(/[^a-z0-9]/gi,'_')}_${MO[selectedMonthIdx]}.png`;
//   const viewAchieved = dealer.months[selectedMonthIdx]||0;
//   const viewTarget   = dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
//   const p = viewTarget?Math.round((viewAchieved/viewTarget)*100):null;

//   if(navigator.share && navigator.canShare) {
//     try {
//       const blob = await new Promise(res => canvas.toBlob(res,'image/png'));
//       const file = new File([blob], filename, {type:'image/png'});
//       if(navigator.canShare({files:[file]})) {
//         await navigator.share({
//           title: `${dealer.name} — Sales Report`,
//           text:  `${dealer.name} · ${MO[selectedMonthIdx]} · Achieved: ${viewAchieved}/${viewTarget||'—'} · ${p!==null?p+'%':'N/T'}`,
//           files: [file],
//         });
//         return;
//       }
//     } catch(e) {
//       if(e.name==='AbortError') return;
//     }
//   }

//   // Fallback: download
//   const link    = document.createElement('a');
//   link.download = filename;
//   link.href     = canvas.toDataURL('image/png');
//   link.click();
// };

// export { downloadDealerCard, shareDealerCard };


import { MO as MO_STATIC, CURRENT_MONTH_IDX } from '../constants';
// The app's month list is dynamic (new months are added over time). The card
// uses the list the caller passes; the old static list is only a fallback.
let MO = MO_STATIC;
const useMonths = mo => { MO = Array.isArray(mo) && mo.length ? mo : MO_STATIC; };
import { trendPct, forecast, pct, monthTarget } from '../utils';

// ── Shared canvas builder — used by both download and share ─────────────────
// Polyfill CanvasRenderingContext2D.roundRect — missing in older Android
// WebViews (pre-Chrome 99 / 2022) and older Safari. Without this polyfill,
// the dealer-card Download/Share buttons silently throw TypeError mid-draw.
// Applied once at module load and is a no-op on browsers that already have it.
if(typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    let radii;
    if(typeof r === 'number')      radii = [r, r, r, r];
    else if(Array.isArray(r)){
      if(r.length === 1) radii = [r[0], r[0], r[0], r[0]];
      else if(r.length === 2) radii = [r[0], r[1], r[0], r[1]];
      else if(r.length === 3) radii = [r[0], r[1], r[2], r[1]];
      else                   radii = [r[0], r[1], r[2], r[3]];
    } else                          radii = [0, 0, 0, 0];
    // Clamp radii so they don't exceed half the smallest side
    const maxR = Math.min(Math.abs(w), Math.abs(h)) / 2;
    radii = radii.map(v => Math.max(0, Math.min(v, maxR)));
    const [tl, tr, br, bl] = radii;
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    return this;
  };
}

function buildCanvas(dealer, users, selectedMonthIdx) {
  // Defensive defaults so the canvas always builds, even if the dealer
  // object is missing the months array or other fields (e.g. dealers added
  // via inline form, partial cache, or DB rows from before months[] existed).
  // Without these, code like `dealer.months.slice(...)` throws and the
  // Download/Share buttons silently fail with "Cannot read .slice of undefined".
  if(!dealer) throw new Error('No dealer data');
  const safeDealer = {
    ...dealer,
    name:         dealer.name || 'Unknown Dealer',
    status:       dealer.status || '',
    zone:         dealer.zone || '',
    city:         dealer.city || '',
    state:        dealer.state || '',
    category:     dealer.category || '',
    categoryType: dealer.categoryType || '',
    salesman:     dealer.salesman || '',
    avg6m:        Number(dealer.avg6m) || 0,
    creditDays:   Number(dealer.creditDays) || 0,
    creditLimit:  Number(dealer.creditLimit) || 0,
    // Also truncate if longer than MO so the chart loop never accesses MO[i] = undefined
    months:       Array.isArray(dealer.months) ? dealer.months.slice(0, MO.length) : new Array(MO.length).fill(0),
    monthTargets: dealer.monthTargets || {},
    monthlyData:  dealer.monthlyData || {},
    target:       Number(dealer.target) || 0,
  };
  // Make sure months[] has at least MO.length entries (pad with 0s if short)
  while(safeDealer.months.length < MO.length) safeDealer.months.push(0);
  dealer = safeDealer;

  const sm          = users?.[dealer.salesman];
  const viewAchieved= dealer.months[selectedMonthIdx] || 0;
  // Smart per-month target (see utils.monthTarget)
  const viewTarget  = monthTarget(dealer, selectedMonthIdx);
  const p           = viewTarget ? Math.round((viewAchieved/viewTarget)*100) : null;
  const tp          = trendPct(dealer.months);
  const fc          = forecast(dealer.months);
  const total       = dealer.months.reduce((a,b)=>a+(Number(b)||0),0);

  // Canvas tall enough for: header + KPIs + bar chart + monthly table + footer
  const W = 1000, H = 1050;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background ──────────────────────────────────────
  ctx.fillStyle = '#080810'; ctx.fillRect(0,0,W,H);
  const grad = ctx.createLinearGradient(0,0,W,0);
  grad.addColorStop(0,'#3b82f6'); grad.addColorStop(1,'#8b5cf6');
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,4);

  // ── Header ───────────────────────────────────────────
  ctx.fillStyle = '#3b82f6'; ctx.font = '600 11px monospace';
  ctx.fillText('▸ SALES TRACKER PRO', 36, 36);
  ctx.fillStyle = '#e2e0f0'; ctx.font = 'bold 26px system-ui';
  ctx.fillText(dealer.name.slice(0,55), 36, 70);

  const statusColors = { 'ACTIVE':'#10b981','ACHIVERS':'#10b981','ACHIEVERS':'#10b981','KEY ACCOUNT':'#8b5cf6','INACTIVE':'#f59e0b','DEAD':'#ef4444' };
  const sc = statusColors[(dealer.status||'').toUpperCase()] || '#9492a8';
  ctx.fillStyle = sc+'22';
  ctx.beginPath(); ctx.roundRect(36, 82, (dealer.status||'').length*8+20, 22, 4); ctx.fill();
  ctx.fillStyle = sc; ctx.font = '600 11px system-ui';
  ctx.fillText(dealer.status||'—', 46, 97);

  let xOff = 36 + (dealer.status||'').length*8 + 30;
  if(dealer.zone)       { ctx.fillStyle='#55546a'; ctx.font='12px system-ui'; ctx.fillText(dealer.zone, xOff, 97); xOff+=dealer.zone.length*8+12; }
  if(dealer.city||dealer.state) { ctx.fillStyle='#55546a'; ctx.fillText([dealer.city,dealer.state].filter(Boolean).join(', '), xOff, 97); xOff+=120; }
  if(dealer.category)   { ctx.fillStyle='#6366f1'; ctx.fillText(dealer.category+(dealer.categoryType?' / '+dealer.categoryType:''), xOff, 97); }

  ctx.fillStyle = '#1e1e30'; ctx.fillRect(36,110,W-72,1);

  // ── KPI grid (3 rows × 4 cols) ───────────────────────
  const kpis = [
    { label: MO[selectedMonthIdx]+' Target',  value: String(viewTarget||'—'),             color: '#e2e0f0' },
    { label: MO[selectedMonthIdx]+' Achieved',value: String(viewAchieved),                color: '#10b981' },
    { label: 'Achievement',                   value: p!==null?p+'%':'N/T',               color: p===null?'#6b7280':p>=100?'#10b981':p>=60?'#f59e0b':'#ef4444' },
    { label: '6-mo Avg',                      value: String(dealer.avg6m||0),            color: '#e2e0f0' },
    { label: 'Forecast',                      value: String(fc),                         color: '#3b82f6' },
    { label: 'Trend (3m)',                    value: (tp>0?'+':'')+tp+'%',              color: tp>0?'#10b981':tp<0?'#ef4444':'#9492a8' },
    { label: '11mo Total',                    value: String(total),                      color: '#e2e0f0' },
    { label: 'Credit Days',                   value: dealer.creditDays?dealer.creditDays+'d':'—', color:'#e2e0f0' },
    { label: 'Credit Limit',                  value: dealer.creditLimit?'₹'+dealer.creditLimit.toLocaleString('en-IN'):'—', color:'#e2e0f0' },
    { label: 'Category',                      value: (dealer.category||'—').slice(0,20), color: '#6366f1' },
    { label: 'Cat Type',                      value: (dealer.categoryType||'—').slice(0,20), color:'#6366f1' },
    { label: 'Salesman',                      value: String(sm?.name||dealer.salesman||'—').slice(0,20), color:'#f59e0b' },
  ];
  kpis.forEach((k,i) => {
    const col=i%4, row=Math.floor(i/4);
    const x=36+col*237, y=126+row*82;
    ctx.fillStyle='#141422'; ctx.beginPath(); ctx.roundRect(x,y,222,70,8); ctx.fill();
    ctx.fillStyle='#55546a'; ctx.font='10px system-ui';
    ctx.fillText(k.label.toUpperCase(), x+12, y+18);
    ctx.fillStyle=k.color; ctx.font='bold 19px system-ui';
    ctx.fillText(k.value, x+12, y+46);
  });

  // ── Bar chart ────────────────────────────────────────
  const chartY=380, chartH=110, chartW=W-72;
  const barW=Math.floor(chartW/MO.length)-4;
  const maxVal=Math.max(...dealer.months,1);

  ctx.fillStyle='#9492a8'; ctx.font='600 11px system-ui';
  ctx.fillText('11-Month Performance', 36, chartY-10);
  ctx.fillStyle='#55546a'; ctx.font='9px system-ui';
  ctx.fillText('dashed = target', 200, chartY-10);

  dealer.months.forEach((v,i) => {
    const bh  = Math.max((v/maxVal)*(chartH-16), v>0?3:0);
    const bx  = 36+i*(barW+4);
    const by  = chartY+chartH-bh;
    const mt  = monthTarget(dealer, i);
    const isSel = i===selectedMonthIdx;

    // Bar
    ctx.fillStyle = isSel?'#3b82f6':'#252538';
    ctx.beginPath(); ctx.roundRect(bx,by,barW,bh,2); ctx.fill();

    // Per-month target dashed line
    if(mt>0) {
      const th = Math.max((mt/maxVal)*(chartH-16),2);
      ctx.strokeStyle='#34d39966'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.setLineDash([3,3]);
      ctx.moveTo(bx, chartY+chartH-th);
      ctx.lineTo(bx+barW, chartY+chartH-th);
      ctx.stroke(); ctx.setLineDash([]);
    }

    // Month label — safe if MO[i] is undefined (e.g. dealer has more months than MO)
    ctx.fillStyle = isSel?'#3b82f6':'#55546a';
    ctx.font = isSel?'bold 9px system-ui':'9px system-ui';
    ctx.fillText(String(MO[i] || '').slice(0,3), bx, chartY+chartH+13);

    // Value label above bar
    if(v>0) {
      ctx.fillStyle = isSel?'#fff':'#9492a8';
      ctx.font='8px system-ui';
      ctx.fillText(v, bx+2, by-4);
    }
  });

  // ── Monthly detail table ─────────────────────────────
  const tblY = chartY + chartH + 30;
  ctx.fillStyle='#9492a8'; ctx.font='600 11px system-ui';
  ctx.fillText('Month-by-Month Breakdown', 36, tblY-8);

  // Table header
  const cols = [
    {w:72,  label:'Month',    align:'left'},
    {w:70,  label:'Achieved', align:'right'},
    {w:70,  label:'Target',   align:'right'},
    {w:65,  label:'Ach %',    align:'right'},
    {w:65,  label:'vs Tgt %', align:'right'},
    {w:70,  label:'Δ MoM',    align:'right'},
    {w:65,  label:'Δ MoM %',  align:'right'},
    {w:180, label:'Bar',      align:'left'},
  ];

  // Header row bg
  ctx.fillStyle='#141422';
  ctx.fillRect(36, tblY, W-72, 18);
  let cx=40;
  cols.forEach(col => {
    ctx.fillStyle='#55546a'; ctx.font='bold 9px system-ui';
    ctx.fillText(col.label, col.align==='right'?cx+col.w-ctx.measureText(col.label).width-2:cx, tblY+12);
    cx+=col.w;
  });

  // Data rows — newest first (reverse)
  [...dealer.months].map((_,di)=>{
    const i   = dealer.months.length-1-di;
    const v   = dealer.months[i];
    const mt  = monthTarget(dealer, i);
    const prev= i>0?dealer.months[i-1]:null;
    const diff= prev!=null?v-prev:null;
    const diffP= prev&&prev>0?Math.round(((v-prev)/prev)*100):null;
    const vsPct= mt?Math.round((v/mt)*100):null;
    const achPct= total>0?Math.round((v/total)*100):0;
    const isSel= i===selectedMonthIdx;
    const isCur= i===CURRENT_MONTH_IDX;

    const rowY = tblY+18+di*18;
    if(rowY+18 > H-30) return; // don't overflow canvas

    // Row background
    ctx.fillStyle = isSel?'rgba(99,102,241,0.12)':di%2===0?'#0d0d1a':'#080810';
    ctx.fillRect(36, rowY, W-72, 18);

    let rx=40;

    // Month
    ctx.fillStyle = isSel?'#3b82f6':isCur?'#10b981':'#9492a8';
    ctx.font = isSel?'bold 9px system-ui':isCur?'600 9px system-ui':'9px system-ui';
    ctx.fillText(MO[i]+(isCur?' ★':'')+(isSel?' ◀':''), rx, rowY+12);
    rx+=72;

    // Achieved
    ctx.fillStyle=v>0?'#e2e0f0':'#3a3a50'; ctx.font='600 9px system-ui';
    const achStr=String(v||'—');
    ctx.fillText(achStr, rx+70-ctx.measureText(achStr).width-2, rowY+12);
    rx+=70;

    // Target
    ctx.fillStyle='#55546a'; ctx.font='9px system-ui';
    const tgtStr=String(mt||'—');
    ctx.fillText(tgtStr, rx+70-ctx.measureText(tgtStr).width-2, rowY+12);
    rx+=70;

    // Ach %
    const achPctStr=achPct+'%';
    ctx.fillStyle='#55546a'; ctx.font='9px system-ui';
    ctx.fillText(achPctStr, rx+65-ctx.measureText(achPctStr).width-2, rowY+12);
    rx+=65;

    // vs Target %
    const vsStr=vsPct!==null?vsPct+'%':'—';
    ctx.fillStyle=vsPct===null?'#55546a':vsPct>=100?'#10b981':vsPct>=60?'#f59e0b':'#ef4444';
    ctx.font='600 9px system-ui';
    ctx.fillText(vsStr, rx+65-ctx.measureText(vsStr).width-2, rowY+12);
    rx+=65;

    // Δ MoM
    const diffStr=diff!=null?(diff>0?'+':'')+diff:'—';
    ctx.fillStyle=diff==null?'#55546a':diff>0?'#10b981':diff<0?'#ef4444':'#9492a8';
    ctx.font='9px system-ui';
    ctx.fillText(diffStr, rx+70-ctx.measureText(diffStr).width-2, rowY+12);
    rx+=70;

    // Δ MoM %
    const diffPStr=diffP!=null?(diffP>0?'+':'')+diffP+'%':'—';
    ctx.fillStyle=diffP==null?'#55546a':diffP>0?'#10b981':diffP<0?'#ef4444':'#9492a8';
    ctx.fillText(diffPStr, rx+65-ctx.measureText(diffPStr).width-2, rowY+12);
    rx+=65;

    // Mini bar (achieved vs target)
    const barMaxW=170;
    const achBarW=v>0?Math.max(Math.round((v/Math.max(...dealer.months,1))*barMaxW),3):0;
    ctx.fillStyle='#1e1e30';
    ctx.fillRect(rx, rowY+6, barMaxW, 6);
    if(achBarW>0){
      ctx.fillStyle=isSel?'#3b82f6':vsPct>=100?'#10b981':vsPct>=60?'#f59e0b':'#ef4444';
      ctx.beginPath(); ctx.roundRect(rx, rowY+6, achBarW, 6, 2); ctx.fill();
    }
    // Target tick
    if(mt>0){
      const tgtX=rx+Math.min(Math.round((mt/Math.max(...dealer.months,1))*barMaxW),barMaxW-1);
      ctx.strokeStyle='#10b981'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(tgtX,rowY+4); ctx.lineTo(tgtX,rowY+14); ctx.stroke();
    }
  });

  // ── Footer ───────────────────────────────────────────
  ctx.fillStyle='#252538'; ctx.fillRect(36, H-28, W-72, 1);
  ctx.fillStyle='#55546a'; ctx.font='10px monospace';
  ctx.fillText(`Generated: ${new Date().toLocaleString('en-IN')} · ${sm?.name||dealer.salesman} · Sales Tracker Pro`, 36, H-12);

  return canvas;
}

// ── Detect environment ───────────────────────────────────────────────────────
const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const isAndroidWebView = () => {
  const ua = navigator.userAgent || '';
  return /wv/.test(ua) || /Android.*WebView/.test(ua) || typeof window.Android !== 'undefined';
};
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

// ── Download ─────────────────────────────────────────────────────────────────
const downloadDealerCard = async (dealer, users, selectedMonthIdx, mo) => {
  useMonths(mo);
  try {
    const canvas   = buildCanvas(dealer, users, selectedMonthIdx);
    const safeName = (dealer?.name || 'dealer').replace(/[^a-z0-9]/gi,'_');
    const filename = safeName + '_' + (MO[selectedMonthIdx] || 'current') + '.png';
    const dataUrl  = canvas.toDataURL('image/png');

    // Inside the Capacitor APK: directly save to phone via Filesystem plugin,
    // then show the overlay with the preview + Share button. No anchor-click
    // tricks (which don't work in Android WebView).
    if(isCapacitor()){
      try {
        const res = await saveImageToPhone(dataUrl, filename);
        // Show overlay so user can also Share without saving twice
        showImageOverlay(dataUrl, filename);
        // Pre-fill status so they know it already saved
        setTimeout(() => {
          const s = document.getElementById('overlay-status');
          if(s){ s.textContent = '✓ Already saved to ' + (res.where || 'phone'); s.style.color = '#86efac'; }
          const saveBtn = document.getElementById('overlay-save-btn');
          if(saveBtn){ saveBtn.textContent = '✓ Saved'; }
        }, 50);
      } catch(e){
        // Show overlay with error so user can retry / share
        showImageOverlay(dataUrl, filename);
        setTimeout(() => {
          const s = document.getElementById('overlay-status');
          if(s){ s.textContent = 'Auto-save failed: ' + (e?.message || e) + '. Try Save button.'; s.style.color = '#f59e0b'; }
        }, 50);
      }
      return;
    }

    // Mobile web (non-APK) — anchor download unreliable, show overlay
    if(isMobileDevice()) {
      showImageOverlay(dataUrl, filename);
      return;
    }

    // Desktop browser — direct anchor download
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch(err) {
    console.error('Download failed:', err);
    showImageOverlay(null, null, 'Could not generate image: ' + (err?.message || err));
  }
};

// ── Share ─────────────────────────────────────────────────────────────────────
const shareDealerCard = async (dealer, users, selectedMonthIdx, mo) => {
  useMonths(mo);
  try {
    const canvas       = buildCanvas(dealer, users, selectedMonthIdx);
    const safeName     = (dealer?.name || 'dealer').replace(/[^a-z0-9]/gi,'_');
    const filename     = safeName + '_' + (MO[selectedMonthIdx] || 'current') + '.png';
    const viewAchieved = (Array.isArray(dealer?.months) ? dealer.months[selectedMonthIdx] : 0) || 0;
    const viewTarget   = monthTarget(dealer, selectedMonthIdx);
    const p            = viewTarget?Math.round((viewAchieved/viewTarget)*100):null;
    const shareText    = (dealer?.name || 'Dealer') + ' · ' + (MO[selectedMonthIdx] || 'current') + ' · Achieved: ' + viewAchieved + '/' + (viewTarget||'—') + ' · ' + (p!==null?p+'%':'N/T');
    const dataUrl      = canvas.toDataURL('image/png');

    // Inside Capacitor APK — open native share sheet directly via plugin
    if(isCapacitor()){
      try {
        const res = await shareImageFromPhone(dataUrl, filename, shareText);
        if(res.ok) return;
        // Share returned not-ok but no exception — fall through to overlay
      } catch(e){
        if(e?.name === 'AbortError') return;   // user cancelled — that's fine
        console.warn('Direct share failed, falling back to overlay:', e?.message || e);
      }
    } else {
      // Web: try Web Share API with file
      if(navigator.share) {
        try {
          const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
          const file = new File([blob], filename, {type:'image/png'});
          if(navigator.canShare && navigator.canShare({files:[file]})) {
            await navigator.share({ title: (dealer?.name||'Dealer') + ' — Sales Report', text: shareText, files: [file] });
            return;
          }
        } catch(e) {
          if(e.name === 'AbortError') return;
          // fall through to overlay
        }
      }
    }

    // Fallback: show overlay with the image + Save / Share buttons
    showImageOverlay(dataUrl, filename);

  } catch(err) {
    console.error('Share failed:', err);
    showImageOverlay(null, null, 'Could not generate share image: ' + (err?.message || err));
  }
};

// ── Detect Capacitor (running inside the Android APK) ───────────────────────
const isCapacitor = () =>
  typeof window !== 'undefined' &&
  window.Capacitor &&
  typeof window.Capacitor.isNativePlatform === 'function' &&
  window.Capacitor.isNativePlatform();

// ── Save image to phone gallery / file system ─────────────────────────────
async function saveImageToPhone(dataUrl, filename) {
  const base64 = dataUrl.split(',')[1];

  if(isCapacitor()){
    // Native Android: use Capacitor Filesystem to write the PNG into the
    // Documents folder where the user can find it via the Files app or
    // gallery's "Recent files" section.
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });
    return { ok: true, uri: result.uri, where: 'Documents folder' };
  }

  // Browser: trigger normal download
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return { ok: true, where: 'Downloads' };
}

// ── Share image via native share sheet (WhatsApp / Gmail / etc.) ──────────
async function shareImageFromPhone(dataUrl, filename, shareText) {
  const base64 = dataUrl.split(',')[1];

  if(isCapacitor()){
    // Native Android: write to cache, then use Capacitor Share plugin
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share }                  = await import('@capacitor/share');
    const writeRes = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({
      title: 'Sales Report',
      text: shareText || '',
      url: writeRes.uri,
      dialogTitle: 'Share dealer report',
    });
    return { ok: true };
  }

  // Web: use Web Share API if available
  if(navigator.share){
    try {
      const blob = await fetch(dataUrl).then(r => r.blob());
      const file = new File([blob], filename, { type: 'image/png' });
      if(navigator.canShare && navigator.canShare({ files: [file] })){
        await navigator.share({ title: 'Sales Report', text: shareText || '', files: [file] });
        return { ok: true };
      }
      // Fallback: share text + link only
      await navigator.share({ title: 'Sales Report', text: shareText || '', url: dataUrl });
      return { ok: true };
    } catch(e) {
      if(e.name === 'AbortError') return { ok: false, cancelled: true };
      throw e;
    }
  }

  return { ok: false, message: 'Share not supported in this browser. Try downloading and sharing manually.' };
}

// ── Image overlay ────────────────────────────────────────────────────────────
// Full-screen preview with two big working buttons: Save and Share.
function showImageOverlay(dataUrl, filename, errorMsg) {
  const existing = document.getElementById('dealer-card-overlay');
  if(existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'dealer-card-overlay';
  overlay.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:rgba(0,0,0,0.97)',
    'z-index:99999',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'padding:16px',
    'box-sizing:border-box',
    'overflow-y:auto',
    '-webkit-overflow-scrolling:touch',
  ].join(';');

  if(errorMsg) {
    overlay.innerHTML =
      '<div style="color:#ef4444;font-size:14px;text-align:center;padding:20px;max-width:90%">' + errorMsg + '</div>' +
      '<button id="close-overlay-btn" style="background:#252538;color:#9492a8;border:none;padding:10px 24px;border-radius:8px;font-size:13px;margin-top:12px">Close</button>';
  } else {
    overlay.innerHTML =
      '<div style="color:#3b82f6;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px">📊 Dealer Report Card</div>' +

      // Image preview
      '<div style="width:100%;max-width:560px;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.8);margin-bottom:14px">' +
        '<img src="' + dataUrl + '" style="width:100%;display:block;" />' +
      '</div>' +

      // BIG action buttons — direct save and share, no long-press needed
      '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;width:100%;max-width:560px">' +
        '<button id="overlay-save-btn" style="flex:1 1 160px;background:#22c55e;color:#0c0c1e;border:none;padding:14px 20px;border-radius:9px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">⬇ Save to Phone</button>' +
        '<button id="overlay-share-btn" style="flex:1 1 160px;background:#3b82f6;color:#fff;border:none;padding:14px 20px;border-radius:9px;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">⬆ Share</button>' +
      '</div>' +
      '<button id="close-overlay-btn" style="background:transparent;color:#9492a8;border:1px solid #252548;padding:10px 24px;border-radius:9px;font-size:13px;cursor:pointer;margin-top:10px">✕ Close</button>' +

      // Status message area (replaces error text on action)
      '<div id="overlay-status" style="color:#86efac;font-size:12px;margin-top:10px;min-height:18px;text-align:center"></div>' +
      '<div style="color:#3a3a50;font-size:10px;margin-top:4px">' + (filename||'') + '</div>';
  }

  document.body.appendChild(overlay);

  // Close handlers
  const closeBtn = document.getElementById('close-overlay-btn');
  if(closeBtn) closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });

  if(!dataUrl) return;

  const statusEl = document.getElementById('overlay-status');
  const setStatus = (text, color) => {
    if(statusEl){ statusEl.textContent = text; statusEl.style.color = color || '#86efac'; }
  };

  // ── SAVE button ───────────────────────────────────────────────────────
  const saveBtn = document.getElementById('overlay-save-btn');
  if(saveBtn) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      const originalText = saveBtn.textContent;
      saveBtn.textContent = '⏳ Saving…';
      try {
        const res = await saveImageToPhone(dataUrl, filename || 'dealer_report.png');
        if(res.ok){
          saveBtn.textContent = '✓ Saved';
          setStatus('Saved to ' + (res.where || 'your phone') + ' — open the Files app to find ' + (filename || ''), '#86efac');
        }
      } catch(e) {
        console.error('Save failed:', e);
        setStatus('Save failed: ' + (e?.message || e), '#fca5a5');
        saveBtn.textContent = originalText;
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  // ── SHARE button ──────────────────────────────────────────────────────
  const shareBtn = document.getElementById('overlay-share-btn');
  if(shareBtn) {
    shareBtn.addEventListener('click', async () => {
      shareBtn.disabled = true;
      const originalText = shareBtn.textContent;
      shareBtn.textContent = '⏳ Opening share…';
      try {
        const res = await shareImageFromPhone(dataUrl, filename || 'dealer_report.png', '');
        if(res.ok){
          shareBtn.textContent = '✓ Shared';
          setStatus('Share opened. Pick WhatsApp, Gmail, etc.', '#a5b4fc');
        } else if(res.cancelled){
          shareBtn.textContent = originalText;
        } else {
          setStatus(res.message || 'Share not supported here. Use Save and share the file manually.', '#f59e0b');
          shareBtn.textContent = originalText;
        }
      } catch(e) {
        console.error('Share failed:', e);
        setStatus('Share failed: ' + (e?.message || e), '#fca5a5');
        shareBtn.textContent = originalText;
      } finally {
        shareBtn.disabled = false;
      }
    });
  }
}

export { downloadDealerCard, shareDealerCard };