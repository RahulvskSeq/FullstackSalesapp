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


import { MO, CURRENT_MONTH_IDX } from '../constants';
import { trendPct, forecast, pct } from '../utils';

// ── Shared canvas builder — used by both download and share ─────────────────
function buildCanvas(dealer, users, selectedMonthIdx) {
  const sm          = users[dealer.salesman];
  const viewAchieved= dealer.months[selectedMonthIdx] || 0;
  const viewTarget  = dealer.monthTargets?.[selectedMonthIdx] ?? dealer.target;
  const p           = viewTarget ? Math.round((viewAchieved/viewTarget)*100) : null;
  const tp          = trendPct(dealer.months);
  const fc          = forecast(dealer.months);
  const total       = dealer.months.reduce((a,b)=>a+b,0);

  // Canvas tall enough for: header + KPIs + bar chart + monthly table + footer
  const W = 1000, H = 1050;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── Background ──────────────────────────────────────
  ctx.fillStyle = '#080810'; ctx.fillRect(0,0,W,H);
  const grad = ctx.createLinearGradient(0,0,W,0);
  grad.addColorStop(0,'#6366f1'); grad.addColorStop(1,'#a78bfa');
  ctx.fillStyle = grad; ctx.fillRect(0,0,W,4);

  // ── Header ───────────────────────────────────────────
  ctx.fillStyle = '#6366f1'; ctx.font = '600 11px monospace';
  ctx.fillText('▸ SALES TRACKER PRO', 36, 36);
  ctx.fillStyle = '#e2e0f0'; ctx.font = 'bold 26px system-ui';
  ctx.fillText(dealer.name.slice(0,55), 36, 70);

  const statusColors = { 'ACTIVE':'#34d399','ACHIVERS':'#34d399','ACHIEVERS':'#34d399','KEY ACCOUNT':'#a78bfa','INACTIVE':'#fbbf24','DEAD':'#f87171' };
  const sc = statusColors[(dealer.status||'').toUpperCase()] || '#9492a8';
  ctx.fillStyle = sc+'22';
  ctx.beginPath(); ctx.roundRect(36, 82, (dealer.status||'').length*8+20, 22, 4); ctx.fill();
  ctx.fillStyle = sc; ctx.font = '600 11px system-ui';
  ctx.fillText(dealer.status||'—', 46, 97);

  let xOff = 36 + (dealer.status||'').length*8 + 30;
  if(dealer.zone)       { ctx.fillStyle='#55546a'; ctx.font='12px system-ui'; ctx.fillText(dealer.zone, xOff, 97); xOff+=dealer.zone.length*8+12; }
  if(dealer.city||dealer.state) { ctx.fillStyle='#55546a'; ctx.fillText([dealer.city,dealer.state].filter(Boolean).join(', '), xOff, 97); xOff+=120; }
  if(dealer.category)   { ctx.fillStyle='#818cf8'; ctx.fillText(dealer.category+(dealer.categoryType?' / '+dealer.categoryType:''), xOff, 97); }

  ctx.fillStyle = '#1e1e30'; ctx.fillRect(36,110,W-72,1);

  // ── KPI grid (3 rows × 4 cols) ───────────────────────
  const kpis = [
    { label: MO[selectedMonthIdx]+' Target',  value: String(viewTarget||'—'),             color: '#e2e0f0' },
    { label: MO[selectedMonthIdx]+' Achieved',value: String(viewAchieved),                color: '#34d399' },
    { label: 'Achievement',                   value: p!==null?p+'%':'N/T',               color: p===null?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171' },
    { label: '6-mo Avg',                      value: String(dealer.avg6m||0),            color: '#e2e0f0' },
    { label: 'Forecast',                      value: String(fc),                         color: '#6366f1' },
    { label: 'Trend (3m)',                    value: (tp>0?'+':'')+tp+'%',              color: tp>0?'#34d399':tp<0?'#f87171':'#9492a8' },
    { label: '11mo Total',                    value: String(total),                      color: '#e2e0f0' },
    { label: 'Credit Days',                   value: dealer.creditDays?dealer.creditDays+'d':'—', color:'#e2e0f0' },
    { label: 'Credit Limit',                  value: dealer.creditLimit?'₹'+dealer.creditLimit.toLocaleString('en-IN'):'—', color:'#e2e0f0' },
    { label: 'Category',                      value: (dealer.category||'—').slice(0,20), color: '#818cf8' },
    { label: 'Cat Type',                      value: (dealer.categoryType||'—').slice(0,20), color:'#818cf8' },
    { label: 'Salesman',                      value: (sm?.name||dealer.salesman).slice(0,20), color:'#fbbf24' },
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
    const mt  = dealer.monthTargets?.[i] ?? dealer.target;
    const isSel = i===selectedMonthIdx;

    // Bar
    ctx.fillStyle = isSel?'#6366f1':'#252538';
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

    // Month label
    ctx.fillStyle = isSel?'#6366f1':'#55546a';
    ctx.font = isSel?'bold 9px system-ui':'9px system-ui';
    ctx.fillText(MO[i].slice(0,3), bx, chartY+chartH+13);

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
    const mt  = dealer.monthTargets?.[i] ?? dealer.target;
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
    ctx.fillStyle = isSel?'#6366f1':isCur?'#34d399':'#9492a8';
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
    ctx.fillStyle=vsPct===null?'#55546a':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171';
    ctx.font='600 9px system-ui';
    ctx.fillText(vsStr, rx+65-ctx.measureText(vsStr).width-2, rowY+12);
    rx+=65;

    // Δ MoM
    const diffStr=diff!=null?(diff>0?'+':'')+diff:'—';
    ctx.fillStyle=diff==null?'#55546a':diff>0?'#34d399':diff<0?'#f87171':'#9492a8';
    ctx.font='9px system-ui';
    ctx.fillText(diffStr, rx+70-ctx.measureText(diffStr).width-2, rowY+12);
    rx+=70;

    // Δ MoM %
    const diffPStr=diffP!=null?(diffP>0?'+':'')+diffP+'%':'—';
    ctx.fillStyle=diffP==null?'#55546a':diffP>0?'#34d399':diffP<0?'#f87171':'#9492a8';
    ctx.fillText(diffPStr, rx+65-ctx.measureText(diffPStr).width-2, rowY+12);
    rx+=65;

    // Mini bar (achieved vs target)
    const barMaxW=170;
    const achBarW=v>0?Math.max(Math.round((v/Math.max(...dealer.months,1))*barMaxW),3):0;
    ctx.fillStyle='#1e1e30';
    ctx.fillRect(rx, rowY+6, barMaxW, 6);
    if(achBarW>0){
      ctx.fillStyle=isSel?'#6366f1':vsPct>=100?'#34d399':vsPct>=60?'#fbbf24':'#f87171';
      ctx.beginPath(); ctx.roundRect(rx, rowY+6, achBarW, 6, 2); ctx.fill();
    }
    // Target tick
    if(mt>0){
      const tgtX=rx+Math.min(Math.round((mt/Math.max(...dealer.months,1))*barMaxW),barMaxW-1);
      ctx.strokeStyle='#34d399'; ctx.lineWidth=1.5;
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
const downloadDealerCard = (dealer, users, selectedMonthIdx) => {
  try {
    const canvas   = buildCanvas(dealer, users, selectedMonthIdx);
    const filename = dealer.name.replace(/[^a-z0-9]/gi,'_') + '_' + MO[selectedMonthIdx] + '.png';
    const dataUrl  = canvas.toDataURL('image/png');

    // Mobile (any) — anchor download unreliable, show overlay instead
    if(isMobileDevice()) {
      showImageOverlay(dataUrl, filename);
      return;
    }

    // Desktop browser — anchor click works fine
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch(err) {
    console.error('Download failed:', err);
    showImageOverlay(null, null, 'Could not generate image. Try again.');
  }
};

// ── Share ─────────────────────────────────────────────────────────────────────
const shareDealerCard = async (dealer, users, selectedMonthIdx) => {
  try {
    const canvas       = buildCanvas(dealer, users, selectedMonthIdx);
    const filename     = dealer.name.replace(/[^a-z0-9]/gi,'_') + '_' + MO[selectedMonthIdx] + '.png';
    const viewAchieved = dealer.months[selectedMonthIdx]||0;
    const viewTarget   = dealer.monthTargets?.[selectedMonthIdx]??dealer.target;
    const p            = viewTarget?Math.round((viewAchieved/viewTarget)*100):null;
    const shareText    = dealer.name + ' · ' + MO[selectedMonthIdx] + ' · Achieved: ' + viewAchieved + '/' + (viewTarget||'—') + ' · ' + (p!==null?p+'%':'N/T');
    const dataUrl = canvas.toDataURL('image/png');

    // Always try Web Share API with PNG file first
    if(navigator.share) {
      try {
        const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        const file = new File([blob], filename, {type:'image/png'});
        if(navigator.canShare && navigator.canShare({files:[file]})) {
          await navigator.share({ title: dealer.name + ' — Sales Report', files: [file] });
          return;
        }
      } catch(e) {
        if(e.name === 'AbortError') return;
        // If sharing with file fails, fall through to overlay
      }
    }

    // Show overlay — works everywhere, user long-presses to save/share PNG
    showImageOverlay(dataUrl, filename);

  } catch(err) {
    console.error('Share failed:', err);
  }
};

// ── Image overlay ────────────────────────────────────────────────────────────
// Full-screen image view — works in ALL environments including WebView APK
// User can long-press image on Android to save, or use the buttons
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
      '<div style="color:#f87171;font-size:14px;text-align:center;padding:20px">' + errorMsg + '</div>' +
      '<button id="close-overlay-btn" style="background:#252538;color:#9492a8;border:none;padding:10px 24px;border-radius:8px;font-size:13px;margin-top:12px">Close</button>';
  } else {
    const isAndroid = /Android/i.test(navigator.userAgent);

    overlay.innerHTML =
      '<div style="color:#6366f1;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px">📊 Dealer Report Card</div>' +

      // Instruction
      '<div style="background:#1a1a2e;border:1px solid #6366f133;border-radius:8px;padding:10px 14px;margin-bottom:12px;max-width:400px;text-align:center">' +
        '<div style="color:#e2e0f0;font-size:13px;font-weight:600;margin-bottom:4px">' +
          (isAndroid ? '📱 Long-press image → Save / Share' : '👆 Long-press image to Save or Share') +
        '</div>' +
        '<div style="color:#55546a;font-size:11px">The image is your dealer PNG report</div>' +
      '</div>' +

      // Image — MUST have context menu enabled for long-press save
      '<div style="width:100%;max-width:560px;border-radius:10px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.8)">' +
        '<img src="' + dataUrl + '" style="width:100%;display:block;" />' +
      '</div>' +

      // Buttons
      '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap;justify-content:center">' +
        '<button id="overlay-share-btn" style="background:#6366f1;color:#fff;border:none;padding:12px 24px;border-radius:9px;font-size:14px;font-weight:700;cursor:pointer">⬆ Share PNG</button>' +
        '<button id="close-overlay-btn" style="background:#252538;color:#9492a8;border:1px solid #252548;padding:12px 24px;border-radius:9px;font-size:14px;cursor:pointer">✕ Close</button>' +
      '</div>' +

      '<div style="color:#3a3a50;font-size:10px;margin-top:8px">' + (filename||'') + '</div>';
  }

  document.body.appendChild(overlay);

  // Close handlers
  const closeBtn = document.getElementById('close-overlay-btn');
  if(closeBtn) closeBtn.addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if(e.target===overlay) overlay.remove(); });

  // Share button — tries Web Share API, else keeps overlay open
  const shareBtn = document.getElementById('overlay-share-btn');
  if(shareBtn && dataUrl) {
    shareBtn.addEventListener('click', async () => {
      shareBtn.textContent = '⏳ Preparing...';
      shareBtn.disabled = true;
      try {
        // Convert dataUrl → blob → File for sharing as real PNG
        const res  = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], filename||'dealer_report.png', {type:'image/png'});

        if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})) {
          await navigator.share({ title:'Sales Report', files:[file] });
          shareBtn.textContent = '✓ Shared!';
        } else if(navigator.share) {
          // Share without file — open text share
          await navigator.share({ title:'Sales Report - ' + (filename||''), url: dataUrl });
          shareBtn.textContent = '✓ Shared!';
        } else {
          // No Web Share API — guide user
          shareBtn.textContent = '👆 Long-press image above';
          shareBtn.style.background = '#252538';
        }
      } catch(e) {
        if(e.name === 'AbortError') {
          shareBtn.textContent = '⬆ Share PNG';
        } else {
          shareBtn.textContent = '👆 Long-press image above';
          shareBtn.style.background = '#252538';
          shareBtn.style.color = '#9492a8';
        }
      }
      shareBtn.disabled = false;
    });
  }
}

export { downloadDealerCard, shareDealerCard };