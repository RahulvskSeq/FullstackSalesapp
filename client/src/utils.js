// // // // import { MO, CURRENT_MONTH_IDX } from './constants';

// // // // export const pct   = (t,a) => (!t?(a>0?null:0):Math.round((a/t)*100));
// // // // export const spct  = (t,a) => { const p=pct(t,a); return p===null?'N/T':p+'%'; };
// // // // export const pclr  = (p)   => (p===null||p===undefined)?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171';
// // // // export const fcash = (v)   => v?'₹'+Number(v).toLocaleString('en-IN'):'—';
// // // // export const num   = (v)   => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
// // // // export const uid   = ()    => Date.now()+'_'+Math.random().toString(36).slice(2);
// // // // export const isoNow= ()    => new Date().toISOString();
// // // // export const trendPct = (months) => {
// // // //   const recent=months.slice(-3).reduce((a,b)=>a+b,0);
// // // //   const prior=months.slice(-6,-3).reduce((a,b)=>a+b,0);
// // // //   if(!prior) return recent>0?100:0;
// // // //   return Math.round(((recent-prior)/prior)*100);
// // // // };
// // // // export const forecast = (months) => Math.round(months.slice(-3).reduce((a,b)=>a+b,0)/3);

// // // // export const storage = {
// // // //   async get(key,fallback=null){
// // // //     try{ if(typeof window!=='undefined'&&window.storage){ const r=await window.storage.get(key); return r?JSON.parse(r.value):fallback; } }catch(e){}
// // // //     return fallback;
// // // //   },
// // // //   async set(key,value){
// // // //     try{ if(typeof window!=='undefined'&&window.storage) await window.storage.set(key,JSON.stringify(value)); }catch(e){}
// // // //   },
// // // // };

// // // // function parseRow(line){
// // // //   const r=[];let c='',q=false;
// // // //   for(let i=0;i<line.length;i++){
// // // //     const ch=line[i];
// // // //     if(ch==='"')q=!q;
// // // //     else if(ch===','&&!q){r.push(c);c='';}
// // // //     else c+=ch;
// // // //   }
// // // //   r.push(c);
// // // //   return r.map(s=>s.trim().replace(/^"+|"+$/g,''));
// // // // }

// // // // export function parseCSV(txt,smId){
// // // //   const lines=txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
// // // //   let hi=0;
// // // //   for(let i=0;i<Math.min(lines.length,10);i++){
// // // //     const l=lines[i].toLowerCase();
// // // //     if(l.includes('dealer')||(l.includes('name')&&l.includes('target'))){hi=i;break;}
// // // //   }
// // // //   const rawH=parseRow(lines[hi]);
// // // //   const hc=rawH.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,' ').trim());
// // // //   const ci=(...ks)=>{ for(const k of ks){ const i=hc.findIndex(h=>h.includes(k)); if(i!==-1)return i; } return -1; };

// // // //   const CN=ci('dealer','name'), CT=ci('target'), CZ=ci('zone'), CS=ci('status'), CA=ci('avg','average');
// // // //   const CD=ci('credit day','credit d'), CL=ci('credit lim','limit');
// // // //   const CCITY=ci('city'), CSTATE=ci('state');

// // // //   // Sub category (col AN) — find specific first
// // // //   const CCATTYPE=(()=>{
// // // //     for(const k of ['sub category','sub cat','subcat','sub-cat','category type','cat type','cattype','product type','sub type','thickness']){
// // // //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// // // //     }
// // // //     const i=hc.findIndex(h=>h.includes('sub')&&h.includes('cat')); if(i!==-1)return i;
// // // //     const catCols=[]; hc.forEach((h,i)=>{ if(h.includes('category'))catCols.push(i); });
// // // //     return catCols.length>=2?catCols[1]:-1;
// // // //   })();
// // // //   // Main category (col AM) — any "category" col that isn't CCATTYPE
// // // //   const CCAT=(()=>{
// // // //     for(const k of ['main category','main cat']){
// // // //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// // // //     }
// // // //     return hc.findIndex((h,idx)=>h.includes('category')&&idx!==CCATTYPE);
// // // //   })();

// // // //   console.log('[CSV] cols 38-41:', rawH.slice(38,42));
// // // //   console.log('[CSV] CCAT='+CCAT+'("'+(rawH[CCAT]||'?')+'") CCATTYPE='+CCATTYPE+'("'+(rawH[CCATTYPE]||'?')+'")');

// // // //   const monthTargetCols={};
// // // //   MO.forEach((m,idx)=>{
// // // //     const mKey=m.toLowerCase().replace('-',' ').replace('-','');
// // // //     hc.forEach((h,i)=>{ if((h.includes(m.toLowerCase())||h.includes(mKey))&&h.includes('target'))monthTargetCols[idx]=i; });
// // // //   });

// // // //   const ac=[]; hc.forEach((h,i)=>{ if(h.includes('achiev')||h.includes('ach'))ac.push(i); });
// // // //   const CAp=ac[0]!==undefined?ac[0]:ci('achiev');
// // // //   const hist=[...ac.slice(1)].reverse();

// // // //   const out=[];
// // // //   for(let i=hi+1;i<lines.length;i++){
// // // //     if(!lines[i].trim())continue;
// // // //     const c=parseRow(lines[i]);
// // // //     const nm=(c[CN>=0?CN:0]||'').trim();
// // // //     if(!nm||nm.length<2)continue;
// // // //     if(/^[\d,. ]+$/.test(nm))continue;
// // // //     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='name'||nm.toLowerCase().includes('dealer'))continue;
// // // //     const may=CAp>=0?num(c[CAp]):0;
// // // //     const mo=[];
// // // //     for(let m=0;m<10;m++)mo.push(hist[m]!==undefined?num(c[hist[m]]):0);
// // // //     mo.push(may);
// // // //     const monthTargets={};
// // // //     Object.entries(monthTargetCols).forEach(([idx,col])=>{ monthTargets[Number(idx)]=num(c[col]); });
// // // //     out.push({
// // // //       id:smId+'_'+i, name:nm, salesman:smId,
// // // //       zone:(CZ>=0?c[CZ]:'').trim(),
// // // //       city:(CCITY>=0?c[CCITY]:'').trim(),
// // // //       state:(CSTATE>=0?c[CSTATE]:'').trim(),
// // // //       status:(CS>=0?c[CS]:'ACTIVE').trim()||'ACTIVE',
// // // //       category:(CCAT>=0?c[CCAT]:'').trim(),
// // // //       categoryType:(CCATTYPE>=0?c[CCATTYPE]:'').trim(),
// // // //       target:CT>=0?num(c[CT]):0, achieved:may,
// // // //       avg6m:CA>=0?num(c[CA]):0, months:mo, monthTargets,
// // // //       creditDays:CD>=0?num(c[CD]):0,
// // // //       creditLimit:CL>=0?num(c[CL]):0,
// // // //     });
// // // //   }
// // // //   return out;
// // // // }

// // // // export async function fetchCSV(url){
// // // //   const proxies=[url,`https://corsproxy.io/?${encodeURIComponent(url)}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`];
// // // //   for(const u of proxies){
// // // //     try{
// // // //       const r=await fetch(u,{signal:AbortSignal.timeout(14000)});
// // // //       if(!r.ok)continue;
// // // //       const t=await r.text();
// // // //       if(!t||t.length<20||t.trim().startsWith('<'))continue;
// // // //       return t;
// // // //     }catch(e){continue;}
// // // //   }
// // // //   throw new Error('Could not fetch');
// // // // }



// // // import { MO, CURRENT_MONTH_IDX } from './constants';

// // // export const pct   = (t,a) => (!t?(a>0?null:0):Math.round((a/t)*100));
// // // export const spct  = (t,a) => { const p=pct(t,a); return p===null?'N/T':p+'%'; };
// // // export const pclr  = (p)   => (p===null||p===undefined)?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171';
// // // export const fcash = (v)   => v?'₹'+Number(v).toLocaleString('en-IN'):'—';
// // // export const num   = (v)   => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
// // // export const uid   = ()    => Date.now()+'_'+Math.random().toString(36).slice(2);
// // // export const isoNow= ()    => new Date().toISOString();
// // // export const trendPct = (months) => {
// // //   const recent=months.slice(-3).reduce((a,b)=>a+b,0);
// // //   const prior=months.slice(-6,-3).reduce((a,b)=>a+b,0);
// // //   if(!prior) return recent>0?100:0;
// // //   return Math.round(((recent-prior)/prior)*100);
// // // };
// // // export const forecast = (months) => Math.round(months.slice(-3).reduce((a,b)=>a+b,0)/3);

// // // export const storage = {
// // //   async get(key,fallback=null){
// // //     try{ if(typeof window!=='undefined'&&window.storage){ const r=await window.storage.get(key); return r?JSON.parse(r.value):fallback; } }catch(e){}
// // //     return fallback;
// // //   },
// // //   async set(key,value){
// // //     try{ if(typeof window!=='undefined'&&window.storage) await window.storage.set(key,JSON.stringify(value)); }catch(e){}
// // //   },
// // // };

// // // function parseRow(line){
// // //   const r=[];let c='',q=false;
// // //   for(let i=0;i<line.length;i++){
// // //     const ch=line[i];
// // //     if(ch==='"')q=!q;
// // //     else if(ch===','&&!q){r.push(c);c='';}
// // //     else c+=ch;
// // //   }
// // //   r.push(c);
// // //   return r.map(s=>s.trim().replace(/^"+|"+$/g,''));
// // // }

// // // export function parseCSV(txt,smId){
// // //   const lines=txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
// // //   let hi=0;
// // //   for(let i=0;i<Math.min(lines.length,10);i++){
// // //     const l=lines[i].toLowerCase();
// // //     if(l.includes('dealer')||(l.includes('name')&&l.includes('target'))){hi=i;break;}
// // //   }
// // //   const rawH=parseRow(lines[hi]);
// // //   const hc=rawH.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,' ').trim());
// // //   const ci=(...ks)=>{ for(const k of ks){ const i=hc.findIndex(h=>h.includes(k)); if(i!==-1)return i; } return -1; };

// // //   const CN=ci('dealer','name'), CT=ci('target'), CZ=ci('zone'), CS=ci('status'), CA=ci('avg','average');
// // //   const CD=ci('credit day','credit d'), CL=ci('credit lim','limit');
// // //   const CCITY=ci('city'), CSTATE=ci('state');

// // //   // Sub category (col AN) — find specific first
// // //   const CCATTYPE=(()=>{
// // //     for(const k of ['sub category','sub cat','subcat','sub-cat','category type','cat type','cattype','product type','sub type','thickness']){
// // //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// // //     }
// // //     const i=hc.findIndex(h=>h.includes('sub')&&h.includes('cat')); if(i!==-1)return i;
// // //     const catCols=[]; hc.forEach((h,i)=>{ if(h.includes('category'))catCols.push(i); });
// // //     return catCols.length>=2?catCols[1]:-1;
// // //   })();
// // //   // Main category (col AM) — any "category" col that isn't CCATTYPE
// // //   const CCAT=(()=>{
// // //     for(const k of ['main category','main cat']){
// // //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// // //     }
// // //     return hc.findIndex((h,idx)=>h.includes('category')&&idx!==CCATTYPE);
// // //   })();

// // //   console.log('[CSV] cols 38-41:', rawH.slice(38,42));
// // //   console.log('[CSV] CCAT='+CCAT+'("'+(rawH[CCAT]||'?')+'") CCATTYPE='+CCATTYPE+'("'+(rawH[CCATTYPE]||'?')+'")');

// // //   const monthTargetCols={};
// // //   MO.forEach((m,idx)=>{
// // //     const mKey=m.toLowerCase().replace('-',' ').replace('-','');
// // //     hc.forEach((h,i)=>{ if((h.includes(m.toLowerCase())||h.includes(mKey))&&h.includes('target'))monthTargetCols[idx]=i; });
// // //   });

// // //   const ac=[]; hc.forEach((h,i)=>{ if(h.includes('achiev')||h.includes('ach'))ac.push(i); });
// // //   const CAp=ac[0]!==undefined?ac[0]:ci('achiev');
// // //   const hist=[...ac.slice(1)].reverse();

// // //   const out=[];
// // //   for(let i=hi+1;i<lines.length;i++){
// // //     if(!lines[i].trim())continue;
// // //     const c=parseRow(lines[i]);
// // //     const nm=(c[CN>=0?CN:0]||'').trim();
// // //     if(!nm||nm.length<2)continue;
// // //     if(/^[\d,. ]+$/.test(nm))continue;
// // //     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='name'||nm.toLowerCase().includes('dealer'))continue;
// // //     const may=CAp>=0?num(c[CAp]):0;
// // //     const mo=[];
// // //     for(let m=0;m<10;m++)mo.push(hist[m]!==undefined?num(c[hist[m]]):0);
// // //     mo.push(may);
// // //     const monthTargets={};
// // //     Object.entries(monthTargetCols).forEach(([idx,col])=>{ monthTargets[Number(idx)]=num(c[col]); });
// // //     out.push({
// // //       id:smId+'_'+i, name:nm, salesman:smId,
// // //       zone:(CZ>=0?c[CZ]:'').trim(),
// // //       city:(CCITY>=0?c[CCITY]:'').trim(),
// // //       state:(CSTATE>=0?c[CSTATE]:'').trim(),
// // //       status:(CS>=0?c[CS]:'ACTIVE').trim()||'ACTIVE',
// // //       category:(CCAT>=0?c[CCAT]:'').trim(),
// // //       categoryType:(CCATTYPE>=0?c[CCATTYPE]:'').trim(),
// // //       target:CT>=0?num(c[CT]):0, achieved:may,
// // //       avg6m:CA>=0?num(c[CA]):0, months:mo, monthTargets,
// // //       creditDays:CD>=0?num(c[CD]):0,
// // //       creditLimit:CL>=0?num(c[CL]):0,
// // //     });
// // //   }
// // //   return out;
// // // }

// // // export async function fetchCSV(url){
// // //   const proxies=[url,`https://corsproxy.io/?${encodeURIComponent(url)}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`];
// // //   for(const u of proxies){
// // //     try{
// // //       const r=await fetch(u,{signal:AbortSignal.timeout(14000)});
// // //       if(!r.ok)continue;
// // //       const t=await r.text();
// // //       if(!t||t.length<20||t.trim().startsWith('<'))continue;
// // //       return t;
// // //     }catch(e){continue;}
// // //   }
// // //   throw new Error('Could not fetch');
// // // }

// // // // ── OUTSTANDING SHEET PARSER ──────────────────────────────────────────────────
// // // // Sheet format: Dealer Name | FEB | MAR | APR | MAY ...
// // // export function parseOutstandingCSV(txt, smId) {
// // //   const lines = txt.split('\n').map(l => l.replace(/\r$/, ''));
// // //   let hi = 0;
// // //   for(let i=0;i<Math.min(lines.length,5);i++){
// // //     const l=lines[i].toLowerCase();
// // //     if(l.includes('dealer')||l.includes('name')||l.includes('party')){hi=i;break;}
// // //   }
// // //   const rawH = lines[hi].split(',').map(h=>h.replace(/^"|"$/g,'').trim());
// // //   const hc   = rawH.map(h=>h.toLowerCase());
// // //   const CN   = hc.findIndex(h=>h.includes('dealer')||h.includes('name')||h.includes('party'));
// // //   const MONTH_ABBR = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
// // //   const monthCols = [];
// // //   rawH.forEach((h,i)=>{
// // //     if(i===CN) return;
// // //     const hl = h.toLowerCase();
// // //     const abbr = MONTH_ABBR.find(m=>hl.startsWith(m)||hl.includes(m));
// // //     if(abbr) monthCols.push({colIdx:i, monthName:h.trim(), abbr});
// // //   });
// // //   const parseRow = (line) => {
// // //     const r=[];let cell='',q=false;
// // //     for(let i=0;i<line.length;i++){
// // //       const ch=line[i];
// // //       if(ch==='"')q=!q;
// // //       else if(ch===','&&!q){r.push(cell);cell='';}
// // //       else cell+=ch;
// // //     }
// // //     r.push(cell);
// // //     return r.map(s=>s.trim().replace(/^"|"$/g,''));
// // //   };
// // //   const num = v => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
// // //   const out=[];
// // //   for(let i=hi+1;i<lines.length;i++){
// // //     if(!lines[i].trim()) continue;
// // //     const c=parseRow(lines[i]);
// // //     const nm=(c[CN>=0?CN:0]||'').trim();
// // //     if(!nm||nm.length<2) continue;
// // //     if(/^[\d,. ]+$/.test(nm)) continue;
// // //     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='dealer') continue;
// // //     const monthlyOutstanding={};
// // //     monthCols.forEach(({colIdx,monthName})=>{
// // //       monthlyOutstanding[monthName]=num(c[colIdx]);
// // //     });
// // //     const vals=monthCols.map(m=>num(c[m.colIdx]));
// // //     const latestOutstanding=vals[vals.length-1]||0;
// // //     const maxOutstanding=Math.max(...vals,0);
// // //     const trend=vals.length>=2?vals[vals.length-1]-vals[vals.length-2]:0;
// // //     out.push({
// // //       id:smId+'_out_'+i, name:nm, salesman:smId,
// // //       latestOutstanding, maxOutstanding,
// // //       monthlyOutstanding,
// // //       monthCols:monthCols.map(m=>m.monthName),
// // //       trend,
// // //       status:latestOutstanding===0?'CLEARED':'OUTSTANDING',
// // //     });
// // //   }
// // //   return out.sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// // // }

// // // import { MO, CURRENT_MONTH_IDX } from './constants';

// // // export const pct   = (t,a) => (!t?(a>0?null:0):Math.round((a/t)*100));
// // // export const spct  = (t,a) => { const p=pct(t,a); return p===null?'N/T':p+'%'; };
// // // export const pclr  = (p)   => (p===null||p===undefined)?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171';
// // // export const fcash = (v)   => v?'₹'+Number(v).toLocaleString('en-IN'):'—';
// // // export const num   = (v)   => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
// // // export const uid   = ()    => Date.now()+'_'+Math.random().toString(36).slice(2);
// // // export const isoNow= ()    => new Date().toISOString();
// // // export const trendPct = (months) => {
// // //   const recent=months.slice(-3).reduce((a,b)=>a+b,0);
// // //   const prior=months.slice(-6,-3).reduce((a,b)=>a+b,0);
// // //   if(!prior) return recent>0?100:0;
// // //   return Math.round(((recent-prior)/prior)*100);
// // // };
// // // export const forecast = (months) => Math.round(months.slice(-3).reduce((a,b)=>a+b,0)/3);

// // // export const storage = {
// // //   async get(key,fallback=null){
// // //     try{ if(typeof window!=='undefined'&&window.storage){ const r=await window.storage.get(key); return r?JSON.parse(r.value):fallback; } }catch(e){}
// // //     return fallback;
// // //   },
// // //   async set(key,value){
// // //     try{ if(typeof window!=='undefined'&&window.storage) await window.storage.set(key,JSON.stringify(value)); }catch(e){}
// // //   },
// // // };

// // // function parseRow(line){
// // //   const r=[];let c='',q=false;
// // //   for(let i=0;i<line.length;i++){
// // //     const ch=line[i];
// // //     if(ch==='"')q=!q;
// // //     else if(ch===','&&!q){r.push(c);c='';}
// // //     else c+=ch;
// // //   }
// // //   r.push(c);
// // //   return r.map(s=>s.trim().replace(/^"+|"+$/g,''));
// // // }

// // // export function parseCSV(txt,smId){
// // //   const lines=txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
// // //   let hi=0;
// // //   for(let i=0;i<Math.min(lines.length,10);i++){
// // //     const l=lines[i].toLowerCase();
// // //     if(l.includes('dealer')||(l.includes('name')&&l.includes('target'))){hi=i;break;}
// // //   }
// // //   const rawH=parseRow(lines[hi]);
// // //   const hc=rawH.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,' ').trim());
// // //   const ci=(...ks)=>{ for(const k of ks){ const i=hc.findIndex(h=>h.includes(k)); if(i!==-1)return i; } return -1; };

// // //   const CN=ci('dealer','name'), CT=ci('target'), CZ=ci('zone'), CS=ci('status'), CA=ci('avg','average');
// // //   const CD=ci('credit day','credit d'), CL=ci('credit lim','limit');
// // //   const CCITY=ci('city'), CSTATE=ci('state');

// // //   // Sub category (col AN) — find specific first
// // //   const CCATTYPE=(()=>{
// // //     for(const k of ['sub category','sub cat','subcat','sub-cat','category type','cat type','cattype','product type','sub type','thickness']){
// // //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// // //     }
// // //     const i=hc.findIndex(h=>h.includes('sub')&&h.includes('cat')); if(i!==-1)return i;
// // //     const catCols=[]; hc.forEach((h,i)=>{ if(h.includes('category'))catCols.push(i); });
// // //     return catCols.length>=2?catCols[1]:-1;
// // //   })();
// // //   // Main category (col AM) — any "category" col that isn't CCATTYPE
// // //   const CCAT=(()=>{
// // //     for(const k of ['main category','main cat']){
// // //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// // //     }
// // //     return hc.findIndex((h,idx)=>h.includes('category')&&idx!==CCATTYPE);
// // //   })();

// // //   console.log('[CSV] cols 38-41:', rawH.slice(38,42));
// // //   console.log('[CSV] CCAT='+CCAT+'("'+(rawH[CCAT]||'?')+'") CCATTYPE='+CCATTYPE+'("'+(rawH[CCATTYPE]||'?')+'")');

// // //   const monthTargetCols={};
// // //   MO.forEach((m,idx)=>{
// // //     const mKey=m.toLowerCase().replace('-',' ').replace('-','');
// // //     hc.forEach((h,i)=>{ if((h.includes(m.toLowerCase())||h.includes(mKey))&&h.includes('target'))monthTargetCols[idx]=i; });
// // //   });

// // //   const ac=[]; hc.forEach((h,i)=>{ if(h.includes('achiev')||h.includes('ach'))ac.push(i); });
// // //   const CAp=ac[0]!==undefined?ac[0]:ci('achiev');
// // //   const hist=[...ac.slice(1)].reverse();

// // //   const out=[];
// // //   for(let i=hi+1;i<lines.length;i++){
// // //     if(!lines[i].trim())continue;
// // //     const c=parseRow(lines[i]);
// // //     const nm=(c[CN>=0?CN:0]||'').trim();
// // //     if(!nm||nm.length<2)continue;
// // //     if(/^[\d,. ]+$/.test(nm))continue;
// // //     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='name'||nm.toLowerCase().includes('dealer'))continue;
// // //     const may=CAp>=0?num(c[CAp]):0;
// // //     const mo=[];
// // //     for(let m=0;m<10;m++)mo.push(hist[m]!==undefined?num(c[hist[m]]):0);
// // //     mo.push(may);
// // //     const monthTargets={};
// // //     Object.entries(monthTargetCols).forEach(([idx,col])=>{ monthTargets[Number(idx)]=num(c[col]); });
// // //     out.push({
// // //       id:smId+'_'+i, name:nm, salesman:smId,
// // //       zone:(CZ>=0?c[CZ]:'').trim(),
// // //       city:(CCITY>=0?c[CCITY]:'').trim(),
// // //       state:(CSTATE>=0?c[CSTATE]:'').trim(),
// // //       status:(CS>=0?c[CS]:'ACTIVE').trim()||'ACTIVE',
// // //       category:(CCAT>=0?c[CCAT]:'').trim(),
// // //       categoryType:(CCATTYPE>=0?c[CCATTYPE]:'').trim(),
// // //       target:CT>=0?num(c[CT]):0, achieved:may,
// // //       avg6m:CA>=0?num(c[CA]):0, months:mo, monthTargets,
// // //       creditDays:CD>=0?num(c[CD]):0,
// // //       creditLimit:CL>=0?num(c[CL]):0,
// // //     });
// // //   }
// // //   return out;
// // // }

// // // export async function fetchCSV(url){
// // //   const proxies=[url,`https://corsproxy.io/?${encodeURIComponent(url)}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`];
// // //   for(const u of proxies){
// // //     try{
// // //       const r=await fetch(u,{signal:AbortSignal.timeout(6000)});
// // //       if(!r.ok)continue;
// // //       const t=await r.text();
// // //       if(!t||t.length<20||t.trim().startsWith('<'))continue;
// // //       return t;
// // //     }catch(e){continue;}
// // //   }
// // //   throw new Error('Could not fetch');
// // // }



// // import { MO, CURRENT_MONTH_IDX } from './constants';

// // export const pct   = (t,a) => (!t?(a>0?null:0):Math.round((a/t)*100));
// // export const spct  = (t,a) => { const p=pct(t,a); return p===null?'N/T':p+'%'; };
// // export const pclr  = (p)   => (p===null||p===undefined)?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171';
// // export const fcash = (v)   => v?'₹'+Number(v).toLocaleString('en-IN'):'—';
// // export const num   = (v)   => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
// // export const uid   = ()    => Date.now()+'_'+Math.random().toString(36).slice(2);
// // export const isoNow= ()    => new Date().toISOString();
// // export const trendPct = (months) => {
// //   const recent=months.slice(-3).reduce((a,b)=>a+b,0);
// //   const prior=months.slice(-6,-3).reduce((a,b)=>a+b,0);
// //   if(!prior) return recent>0?100:0;
// //   return Math.round(((recent-prior)/prior)*100);
// // };
// // export const forecast = (months) => Math.round(months.slice(-3).reduce((a,b)=>a+b,0)/3);

// // export const storage = {
// //   async get(key,fallback=null){
// //     try{ if(typeof window!=='undefined'&&window.storage){ const r=await window.storage.get(key); return r?JSON.parse(r.value):fallback; } }catch(e){}
// //     return fallback;
// //   },
// //   async set(key,value){
// //     try{ if(typeof window!=='undefined'&&window.storage) await window.storage.set(key,JSON.stringify(value)); }catch(e){}
// //   },
// // };

// // function parseRow(line){
// //   const r=[];let c='',q=false;
// //   for(let i=0;i<line.length;i++){
// //     const ch=line[i];
// //     if(ch==='"')q=!q;
// //     else if(ch===','&&!q){r.push(c);c='';}
// //     else c+=ch;
// //   }
// //   r.push(c);
// //   return r.map(s=>s.trim().replace(/^"+|"+$/g,''));
// // }

// // export function parseCSV(txt,smId){
// //   const lines=txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
// //   let hi=0;
// //   for(let i=0;i<Math.min(lines.length,10);i++){
// //     const l=lines[i].toLowerCase();
// //     if(l.includes('dealer')||(l.includes('name')&&l.includes('target'))){hi=i;break;}
// //   }
// //   const rawH=parseRow(lines[hi]);
// //   const hc=rawH.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,' ').trim());
// //   const ci=(...ks)=>{ for(const k of ks){ const i=hc.findIndex(h=>h.includes(k)); if(i!==-1)return i; } return -1; };

// //   const CN=ci('dealer','name'), CT=ci('target'), CZ=ci('zone'), CS=ci('status'), CA=ci('avg','average');
// //   const CD=ci('credit day','credit d'), CL=ci('credit lim','limit');
// //   const CCITY=ci('city'), CSTATE=ci('state');

// //   // Sub category (col AN) — find specific first
// //   const CCATTYPE=(()=>{
// //     for(const k of ['sub category','sub cat','subcat','sub-cat','category type','cat type','cattype','product type','sub type','thickness']){
// //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// //     }
// //     const i=hc.findIndex(h=>h.includes('sub')&&h.includes('cat')); if(i!==-1)return i;
// //     const catCols=[]; hc.forEach((h,i)=>{ if(h.includes('category'))catCols.push(i); });
// //     return catCols.length>=2?catCols[1]:-1;
// //   })();
// //   // Main category (col AM) — any "category" col that isn't CCATTYPE
// //   const CCAT=(()=>{
// //     for(const k of ['main category','main cat']){
// //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// //     }
// //     return hc.findIndex((h,idx)=>h.includes('category')&&idx!==CCATTYPE);
// //   })();

// //   console.log('[CSV] cols 38-41:', rawH.slice(38,42));
// //   console.log('[CSV] CCAT='+CCAT+'("'+(rawH[CCAT]||'?')+'") CCATTYPE='+CCATTYPE+'("'+(rawH[CCATTYPE]||'?')+'")');

// //   const monthTargetCols={};
// //   MO.forEach((m,idx)=>{
// //     const mKey=m.toLowerCase().replace('-',' ').replace('-','');
// //     hc.forEach((h,i)=>{ if((h.includes(m.toLowerCase())||h.includes(mKey))&&h.includes('target'))monthTargetCols[idx]=i; });
// //   });

// //   const ac=[]; hc.forEach((h,i)=>{ if(h.includes('achiev')||h.includes('ach'))ac.push(i); });
// //   const CAp=ac[0]!==undefined?ac[0]:ci('achiev');
// //   const hist=[...ac.slice(1)].reverse();

// //   const out=[];
// //   for(let i=hi+1;i<lines.length;i++){
// //     if(!lines[i].trim())continue;
// //     const c=parseRow(lines[i]);
// //     const nm=(c[CN>=0?CN:0]||'').trim();
// //     if(!nm||nm.length<2)continue;
// //     if(/^[\d,. ]+$/.test(nm))continue;
// //     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='name'||nm.toLowerCase().includes('dealer'))continue;
// //     const may=CAp>=0?num(c[CAp]):0;
// //     const mo=[];
// //     for(let m=0;m<10;m++)mo.push(hist[m]!==undefined?num(c[hist[m]]):0);
// //     mo.push(may);
// //     const monthTargets={};
// //     Object.entries(monthTargetCols).forEach(([idx,col])=>{ monthTargets[Number(idx)]=num(c[col]); });
// //     out.push({
// //       id:smId+'_'+i, name:nm, salesman:smId,
// //       zone:(CZ>=0?c[CZ]:'').trim(),
// //       city:(CCITY>=0?c[CCITY]:'').trim(),
// //       state:(CSTATE>=0?c[CSTATE]:'').trim(),
// //       status:(CS>=0?c[CS]:'ACTIVE').trim()||'ACTIVE',
// //       category:(CCAT>=0?c[CCAT]:'').trim(),
// //       categoryType:(CCATTYPE>=0?c[CCATTYPE]:'').trim(),
// //       target:CT>=0?num(c[CT]):0, achieved:may,
// //       avg6m:CA>=0?num(c[CA]):0, months:mo, monthTargets,
// //       creditDays:CD>=0?num(c[CD]):0,
// //       creditLimit:CL>=0?num(c[CL]):0,
// //     });
// //   }
// //   return out;
// // }

// // export async function fetchCSV(url){
// //   const proxies=[
// //     url,
// //     `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
// //     `https://corsproxy.io/?${encodeURIComponent(url)}`,
// //     `https://cors-anywhere.herokuapp.com/${url}`,
// //     `https://thingproxy.freeboard.io/fetch/${url}`,
// //   ];
// //   for(const u of proxies){
// //     try{
// //       const r=await fetch(u,{signal:AbortSignal.timeout(6000)});
// //       if(!r.ok)continue;
// //       const t=await r.text();
// //       if(!t||t.length<20||t.trim().startsWith('<'))continue;
// //       return t;
// //     }catch(e){continue;}
// //   }
// //   throw new Error('Could not fetch CSV — all proxies failed');
// // }

// // // ── OUTSTANDING SHEET PARSER ──────────────────────────────────────────────────
// // // Sheet format: Dealer Name | FEB | MAR | APR | MAY ...
// // export function parseOutstandingCSV(txt, smId) {
// //   const lines = txt.split('\n').map(l => l.replace(/\r$/, ''));
// //   let hi = 0;
// //   for(let i=0;i<Math.min(lines.length,5);i++){
// //     const l=lines[i].toLowerCase();
// //     if(l.includes('dealer')||l.includes('name')||l.includes('party')){hi=i;break;}
// //   }
// //   const rawH = lines[hi].split(',').map(h=>h.replace(/^"|"$/g,'').trim());
// //   const hc   = rawH.map(h=>h.toLowerCase());
// //   const CN   = hc.findIndex(h=>h.includes('dealer')||h.includes('name')||h.includes('party'));
// //   const MONTH_ABBR = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
// //   const monthCols = [];
// //   rawH.forEach((h,i)=>{
// //     if(i===CN) return;
// //     const hl = h.toLowerCase();
// //     const abbr = MONTH_ABBR.find(m=>hl.startsWith(m)||hl.includes(m));
// //     if(abbr) monthCols.push({colIdx:i, monthName:h.trim(), abbr});
// //   });
// //   const parseRow = (line) => {
// //     const r=[];let cell='',q=false;
// //     for(let i=0;i<line.length;i++){
// //       const ch=line[i];
// //       if(ch==='"')q=!q;
// //       else if(ch===','&&!q){r.push(cell);cell='';}
// //       else cell+=ch;
// //     }
// //     r.push(cell);
// //     return r.map(s=>s.trim().replace(/^"|"$/g,''));
// //   };
// //   const num = v => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
// //   const out=[];
// //   for(let i=hi+1;i<lines.length;i++){
// //     if(!lines[i].trim()) continue;
// //     const c=parseRow(lines[i]);
// //     const nm=(c[CN>=0?CN:0]||'').trim();
// //     if(!nm||nm.length<2) continue;
// //     if(/^[\d,. ]+$/.test(nm)) continue;
// //     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='dealer') continue;
// //     const monthlyOutstanding={};
// //     monthCols.forEach(({colIdx,monthName})=>{
// //       monthlyOutstanding[monthName]=num(c[colIdx]);
// //     });
// //     const vals=monthCols.map(m=>num(c[m.colIdx]));
// //     const latestOutstanding=vals[vals.length-1]||0;
// //     const maxOutstanding=Math.max(...vals,0);
// //     const trend=vals.length>=2?vals[vals.length-1]-vals[vals.length-2]:0;
// //     out.push({
// //       id:smId+'_out_'+i, name:nm, salesman:smId,
// //       latestOutstanding, maxOutstanding,
// //       monthlyOutstanding,
// //       monthCols:monthCols.map(m=>m.monthName),
// //       trend,
// //       status:latestOutstanding===0?'CLEARED':'OUTSTANDING',
// //     });
// //   }
// //   return out.sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// // }

// // import { MO, CURRENT_MONTH_IDX } from './constants';

// // export const pct   = (t,a) => (!t?(a>0?null:0):Math.round((a/t)*100));
// // export const spct  = (t,a) => { const p=pct(t,a); return p===null?'N/T':p+'%'; };
// // export const pclr  = (p)   => (p===null||p===undefined)?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171';
// // export const fcash = (v)   => v?'₹'+Number(v).toLocaleString('en-IN'):'—';
// // export const num   = (v)   => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
// // export const uid   = ()    => Date.now()+'_'+Math.random().toString(36).slice(2);
// // export const isoNow= ()    => new Date().toISOString();
// // export const trendPct = (months) => {
// //   const recent=months.slice(-3).reduce((a,b)=>a+b,0);
// //   const prior=months.slice(-6,-3).reduce((a,b)=>a+b,0);
// //   if(!prior) return recent>0?100:0;
// //   return Math.round(((recent-prior)/prior)*100);
// // };
// // export const forecast = (months) => Math.round(months.slice(-3).reduce((a,b)=>a+b,0)/3);

// // export const storage = {
// //   async get(key,fallback=null){
// //     try{ if(typeof window!=='undefined'&&window.storage){ const r=await window.storage.get(key); return r?JSON.parse(r.value):fallback; } }catch(e){}
// //     return fallback;
// //   },
// //   async set(key,value){
// //     try{ if(typeof window!=='undefined'&&window.storage) await window.storage.set(key,JSON.stringify(value)); }catch(e){}
// //   },
// // };

// // function parseRow(line){
// //   const r=[];let c='',q=false;
// //   for(let i=0;i<line.length;i++){
// //     const ch=line[i];
// //     if(ch==='"')q=!q;
// //     else if(ch===','&&!q){r.push(c);c='';}
// //     else c+=ch;
// //   }
// //   r.push(c);
// //   return r.map(s=>s.trim().replace(/^"+|"+$/g,''));
// // }

// // export function parseCSV(txt,smId){
// //   const lines=txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
// //   let hi=0;
// //   for(let i=0;i<Math.min(lines.length,10);i++){
// //     const l=lines[i].toLowerCase();
// //     if(l.includes('dealer')||(l.includes('name')&&l.includes('target'))){hi=i;break;}
// //   }
// //   const rawH=parseRow(lines[hi]);
// //   const hc=rawH.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,' ').trim());
// //   const ci=(...ks)=>{ for(const k of ks){ const i=hc.findIndex(h=>h.includes(k)); if(i!==-1)return i; } return -1; };

// //   const CN=ci('dealer','name'), CT=ci('target'), CZ=ci('zone'), CS=ci('status'), CA=ci('avg','average');
// //   const CD=ci('credit day','credit d'), CL=ci('credit lim','limit');
// //   const CCITY=ci('city'), CSTATE=ci('state');

// //   // Sub category (col AN) — find specific first
// //   const CCATTYPE=(()=>{
// //     for(const k of ['sub category','sub cat','subcat','sub-cat','category type','cat type','cattype','product type','sub type','thickness']){
// //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// //     }
// //     const i=hc.findIndex(h=>h.includes('sub')&&h.includes('cat')); if(i!==-1)return i;
// //     const catCols=[]; hc.forEach((h,i)=>{ if(h.includes('category'))catCols.push(i); });
// //     return catCols.length>=2?catCols[1]:-1;
// //   })();
// //   // Main category (col AM) — any "category" col that isn't CCATTYPE
// //   const CCAT=(()=>{
// //     for(const k of ['main category','main cat']){
// //       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
// //     }
// //     return hc.findIndex((h,idx)=>h.includes('category')&&idx!==CCATTYPE);
// //   })();

// //   console.log('[CSV] cols 38-41:', rawH.slice(38,42));
// //   console.log('[CSV] CCAT='+CCAT+'("'+(rawH[CCAT]||'?')+'") CCATTYPE='+CCATTYPE+'("'+(rawH[CCATTYPE]||'?')+'")');

// //   const monthTargetCols={};
// //   MO.forEach((m,idx)=>{
// //     const mKey=m.toLowerCase().replace('-',' ').replace('-','');
// //     hc.forEach((h,i)=>{ if((h.includes(m.toLowerCase())||h.includes(mKey))&&h.includes('target'))monthTargetCols[idx]=i; });
// //   });

// //   const ac=[]; hc.forEach((h,i)=>{ if(h.includes('achiev')||h.includes('ach'))ac.push(i); });
// //   const CAp=ac[0]!==undefined?ac[0]:ci('achiev');
// //   const hist=[...ac.slice(1)].reverse();

// //   const out=[];
// //   for(let i=hi+1;i<lines.length;i++){
// //     if(!lines[i].trim())continue;
// //     const c=parseRow(lines[i]);
// //     const nm=(c[CN>=0?CN:0]||'').trim();
// //     if(!nm||nm.length<2)continue;
// //     if(/^[\d,. ]+$/.test(nm))continue;
// //     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='name'||nm.toLowerCase().includes('dealer'))continue;
// //     const may=CAp>=0?num(c[CAp]):0;
// //     const mo=[];
// //     for(let m=0;m<10;m++)mo.push(hist[m]!==undefined?num(c[hist[m]]):0);
// //     mo.push(may);
// //     const monthTargets={};
// //     Object.entries(monthTargetCols).forEach(([idx,col])=>{ monthTargets[Number(idx)]=num(c[col]); });
// //     out.push({
// //       id:smId+'_'+i, name:nm, salesman:smId,
// //       zone:(CZ>=0?c[CZ]:'').trim(),
// //       city:(CCITY>=0?c[CCITY]:'').trim(),
// //       state:(CSTATE>=0?c[CSTATE]:'').trim(),
// //       status:(CS>=0?c[CS]:'ACTIVE').trim()||'ACTIVE',
// //       category:(CCAT>=0?c[CCAT]:'').trim(),
// //       categoryType:(CCATTYPE>=0?c[CCATTYPE]:'').trim(),
// //       target:CT>=0?num(c[CT]):0, achieved:may,
// //       avg6m:CA>=0?num(c[CA]):0, months:mo, monthTargets,
// //       creditDays:CD>=0?num(c[CD]):0,
// //       creditLimit:CL>=0?num(c[CL]):0,
// //     });
// //   }
// //   return out;
// // }

// // export async function fetchCSV(url){
// //   const proxies=[url,`https://corsproxy.io/?${encodeURIComponent(url)}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`];
// //   for(const u of proxies){
// //     try{
// //       const r=await fetch(u,{signal:AbortSignal.timeout(6000)});
// //       if(!r.ok)continue;
// //       const t=await r.text();
// //       if(!t||t.length<20||t.trim().startsWith('<'))continue;
// //       return t;
// //     }catch(e){continue;}
// //   }
// //   throw new Error('Could not fetch');
// // }



// import { MO, CURRENT_MONTH_IDX } from './constants';

// export const pct   = (t,a) => (!t?(a>0?null:0):Math.round((a/t)*100));
// export const spct  = (t,a) => { const p=pct(t,a); return p===null?'N/T':p+'%'; };
// export const pclr  = (p)   => (p===null||p===undefined)?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171';
// export const fcash = (v)   => v?'₹'+Number(v).toLocaleString('en-IN'):'—';
// export const num   = (v)   => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
// export const uid   = ()    => Date.now()+'_'+Math.random().toString(36).slice(2);
// export const isoNow= ()    => new Date().toISOString();
// export const trendPct = (months) => {
//   const recent=months.slice(-3).reduce((a,b)=>a+b,0);
//   const prior=months.slice(-6,-3).reduce((a,b)=>a+b,0);
//   if(!prior) return recent>0?100:0;
//   return Math.round(((recent-prior)/prior)*100);
// };
// export const forecast = (months) => Math.round(months.slice(-3).reduce((a,b)=>a+b,0)/3);

// export const storage = {
//   async get(key,fallback=null){
//     try{ if(typeof window!=='undefined'&&window.storage){ const r=await window.storage.get(key); return r?JSON.parse(r.value):fallback; } }catch(e){}
//     return fallback;
//   },
//   async set(key,value){
//     try{ if(typeof window!=='undefined'&&window.storage) await window.storage.set(key,JSON.stringify(value)); }catch(e){}
//   },
// };

// function parseRow(line){
//   const r=[];let c='',q=false;
//   for(let i=0;i<line.length;i++){
//     const ch=line[i];
//     if(ch==='"')q=!q;
//     else if(ch===','&&!q){r.push(c);c='';}
//     else c+=ch;
//   }
//   r.push(c);
//   return r.map(s=>s.trim().replace(/^"+|"+$/g,''));
// }

// export function parseCSV(txt,smId){
//   const lines=txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
//   let hi=0;
//   for(let i=0;i<Math.min(lines.length,10);i++){
//     const l=lines[i].toLowerCase();
//     if(l.includes('dealer')||(l.includes('name')&&l.includes('target'))){hi=i;break;}
//   }
//   const rawH=parseRow(lines[hi]);
//   const hc=rawH.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,' ').trim());
//   const ci=(...ks)=>{ for(const k of ks){ const i=hc.findIndex(h=>h.includes(k)); if(i!==-1)return i; } return -1; };

//   const CN=ci('dealer','name'), CT=ci('target'), CZ=ci('zone'), CS=ci('status'), CA=ci('avg','average');
//   const CD=ci('credit day','credit d'), CL=ci('credit lim','limit');
//   const CCITY=ci('city'), CSTATE=ci('state');

//   // Sub category (col AN) — find specific first
//   const CCATTYPE=(()=>{
//     for(const k of ['sub category','sub cat','subcat','sub-cat','category type','cat type','cattype','product type','sub type','thickness']){
//       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
//     }
//     const i=hc.findIndex(h=>h.includes('sub')&&h.includes('cat')); if(i!==-1)return i;
//     const catCols=[]; hc.forEach((h,i)=>{ if(h.includes('category'))catCols.push(i); });
//     return catCols.length>=2?catCols[1]:-1;
//   })();
//   // Main category (col AM) — any "category" col that isn't CCATTYPE
//   const CCAT=(()=>{
//     for(const k of ['main category','main cat']){
//       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
//     }
//     return hc.findIndex((h,idx)=>h.includes('category')&&idx!==CCATTYPE);
//   })();

//   console.log('[CSV] cols 38-41:', rawH.slice(38,42));
//   console.log('[CSV] CCAT='+CCAT+'("'+(rawH[CCAT]||'?')+'") CCATTYPE='+CCATTYPE+'("'+(rawH[CCATTYPE]||'?')+'")');

//   const monthTargetCols={};
//   MO.forEach((m,idx)=>{
//     const mKey=m.toLowerCase().replace('-',' ').replace('-','');
//     hc.forEach((h,i)=>{ if((h.includes(m.toLowerCase())||h.includes(mKey))&&h.includes('target'))monthTargetCols[idx]=i; });
//   });

//   const ac=[]; hc.forEach((h,i)=>{ if(h.includes('achiev')||h.includes('ach'))ac.push(i); });
//   const CAp=ac[0]!==undefined?ac[0]:ci('achiev');
//   const hist=[...ac.slice(1)].reverse();

//   const out=[];
//   for(let i=hi+1;i<lines.length;i++){
//     if(!lines[i].trim())continue;
//     const c=parseRow(lines[i]);
//     const nm=(c[CN>=0?CN:0]||'').trim();
//     if(!nm||nm.length<2)continue;
//     if(/^[\d,. ]+$/.test(nm))continue;
//     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='name'||nm.toLowerCase().includes('dealer'))continue;
//     const may=CAp>=0?num(c[CAp]):0;
//     const mo=[];
//     for(let m=0;m<10;m++)mo.push(hist[m]!==undefined?num(c[hist[m]]):0);
//     mo.push(may);
//     const monthTargets={};
//     Object.entries(monthTargetCols).forEach(([idx,col])=>{ monthTargets[Number(idx)]=num(c[col]); });
//     out.push({
//       id:smId+'_'+i, name:nm, salesman:smId,
//       zone:(CZ>=0?c[CZ]:'').trim(),
//       city:(CCITY>=0?c[CCITY]:'').trim(),
//       state:(CSTATE>=0?c[CSTATE]:'').trim(),
//       status:(CS>=0?c[CS]:'ACTIVE').trim()||'ACTIVE',
//       category:(CCAT>=0?c[CCAT]:'').trim(),
//       categoryType:(CCATTYPE>=0?c[CCATTYPE]:'').trim(),
//       target:CT>=0?num(c[CT]):0, achieved:may,
//       avg6m:CA>=0?num(c[CA]):0, months:mo, monthTargets,
//       creditDays:CD>=0?num(c[CD]):0,
//       creditLimit:CL>=0?num(c[CL]):0,
//     });
//   }
//   return out;
// }

// export async function fetchCSV(url){
//   const proxies=[
//     url,
//     `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
//     `https://corsproxy.io/?${encodeURIComponent(url)}`,
//     `https://thingproxy.freeboard.io/fetch/${url}`,
//   ];
//   for(const u of proxies){
//     try{
//       const r=await fetch(u,{signal:AbortSignal.timeout(6000)});
//       if(!r.ok)continue;
//       const t=await r.text();
//       if(!t||t.length<20||t.trim().startsWith('<'))continue;
//       return t;
//     }catch(e){continue;}
//   }
//   throw new Error('Could not fetch CSV');
// }

// // ── OUTSTANDING SHEET PARSER ──────────────────────────────────────────────────
// // Sheet format: Dealer Name | FEB | MAR | APR | MAY ...
// export function parseOutstandingCSV(txt, smId) {
//   const lines = txt.split('\n').map(l => l.replace(/\r$/, ''));
//   let hi = 0;
//   for(let i=0;i<Math.min(lines.length,5);i++){
//     const l=lines[i].toLowerCase();
//     if(l.includes('dealer')||l.includes('name')||l.includes('party')){hi=i;break;}
//   }
//   const rawH = lines[hi].split(',').map(h=>h.replace(/^"|"$/g,'').trim());
//   const hc   = rawH.map(h=>h.toLowerCase());
//   const CN   = hc.findIndex(h=>h.includes('dealer')||h.includes('name')||h.includes('party'));
//   const MONTH_ABBR = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
//   const monthCols = [];
//   rawH.forEach((h,i)=>{
//     if(i===CN) return;
//     const hl = h.toLowerCase();
//     const abbr = MONTH_ABBR.find(m=>hl.startsWith(m)||hl.includes(m));
//     if(abbr) monthCols.push({colIdx:i, monthName:h.trim(), abbr});
//   });
//   const parseRow = (line) => {
//     const r=[];let cell='',q=false;
//     for(let i=0;i<line.length;i++){
//       const ch=line[i];
//       if(ch==='"')q=!q;
//       else if(ch===','&&!q){r.push(cell);cell='';}
//       else cell+=ch;
//     }
//     r.push(cell);
//     return r.map(s=>s.trim().replace(/^"|"$/g,''));
//   };
//   const num = v => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
//   const out=[];
//   for(let i=hi+1;i<lines.length;i++){
//     if(!lines[i].trim()) continue;
//     const c=parseRow(lines[i]);
//     const nm=(c[CN>=0?CN:0]||'').trim();
//     if(!nm||nm.length<2) continue;
//     if(/^[\d,. ]+$/.test(nm)) continue;
//     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='dealer') continue;
//     const monthlyOutstanding={};
//     monthCols.forEach(({colIdx,monthName})=>{
//       monthlyOutstanding[monthName]=num(c[colIdx]);
//     });
//     const vals=monthCols.map(m=>num(c[m.colIdx]));
//     const latestOutstanding=vals[vals.length-1]||0;
//     const maxOutstanding=Math.max(...vals,0);
//     const trend=vals.length>=2?vals[vals.length-1]-vals[vals.length-2]:0;
//     out.push({
//       id:smId+'_out_'+i, name:nm, salesman:smId,
//       latestOutstanding, maxOutstanding,
//       monthlyOutstanding,
//       monthCols:monthCols.map(m=>m.monthName),
//       trend,
//       status:latestOutstanding===0?'CLEARED':'OUTSTANDING',
//     });
//   }
//   return out.sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// }

// import { MO, CURRENT_MONTH_IDX } from './constants';

// export const pct   = (t,a) => (!t?(a>0?null:0):Math.round((a/t)*100));
// export const spct  = (t,a) => { const p=pct(t,a); return p===null?'N/T':p+'%'; };
// export const pclr  = (p)   => (p===null||p===undefined)?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171';
// export const fcash = (v)   => v?'₹'+Number(v).toLocaleString('en-IN'):'—';
// export const num   = (v)   => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
// export const uid   = ()    => Date.now()+'_'+Math.random().toString(36).slice(2);
// export const isoNow= ()    => new Date().toISOString();
// export const trendPct = (months) => {
//   const recent=months.slice(-3).reduce((a,b)=>a+b,0);
//   const prior=months.slice(-6,-3).reduce((a,b)=>a+b,0);
//   if(!prior) return recent>0?100:0;
//   return Math.round(((recent-prior)/prior)*100);
// };
// export const forecast = (months) => Math.round(months.slice(-3).reduce((a,b)=>a+b,0)/3);

// export const storage = {
//   async get(key,fallback=null){
//     try{ if(typeof window!=='undefined'&&window.storage){ const r=await window.storage.get(key); return r?JSON.parse(r.value):fallback; } }catch(e){}
//     return fallback;
//   },
//   async set(key,value){
//     try{ if(typeof window!=='undefined'&&window.storage) await window.storage.set(key,JSON.stringify(value)); }catch(e){}
//   },
// };

// function parseRow(line){
//   const r=[];let c='',q=false;
//   for(let i=0;i<line.length;i++){
//     const ch=line[i];
//     if(ch==='"')q=!q;
//     else if(ch===','&&!q){r.push(c);c='';}
//     else c+=ch;
//   }
//   r.push(c);
//   return r.map(s=>s.trim().replace(/^"+|"+$/g,''));
// }

// export function parseCSV(txt,smId){
//   const lines=txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
//   let hi=0;
//   for(let i=0;i<Math.min(lines.length,10);i++){
//     const l=lines[i].toLowerCase();
//     if(l.includes('dealer')||(l.includes('name')&&l.includes('target'))){hi=i;break;}
//   }
//   const rawH=parseRow(lines[hi]);
//   const hc=rawH.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,' ').trim());
//   const ci=(...ks)=>{ for(const k of ks){ const i=hc.findIndex(h=>h.includes(k)); if(i!==-1)return i; } return -1; };

//   const CN=ci('dealer','name'), CT=ci('target'), CZ=ci('zone'), CS=ci('status'), CA=ci('avg','average');
//   const CD=ci('credit day','credit d'), CL=ci('credit lim','limit');
//   const CCITY=ci('city'), CSTATE=ci('state');

//   // Sub category (col AN) — find specific first
//   const CCATTYPE=(()=>{
//     for(const k of ['sub category','sub cat','subcat','sub-cat','category type','cat type','cattype','product type','sub type','thickness']){
//       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
//     }
//     const i=hc.findIndex(h=>h.includes('sub')&&h.includes('cat')); if(i!==-1)return i;
//     const catCols=[]; hc.forEach((h,i)=>{ if(h.includes('category'))catCols.push(i); });
//     return catCols.length>=2?catCols[1]:-1;
//   })();
//   // Main category (col AM) — any "category" col that isn't CCATTYPE
//   const CCAT=(()=>{
//     for(const k of ['main category','main cat']){
//       const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
//     }
//     return hc.findIndex((h,idx)=>h.includes('category')&&idx!==CCATTYPE);
//   })();

//   console.log('[CSV] cols 38-41:', rawH.slice(38,42));
//   console.log('[CSV] CCAT='+CCAT+'("'+(rawH[CCAT]||'?')+'") CCATTYPE='+CCATTYPE+'("'+(rawH[CCATTYPE]||'?')+'")');

//   const monthTargetCols={};
//   MO.forEach((m,idx)=>{
//     const mKey=m.toLowerCase().replace('-',' ').replace('-','');
//     hc.forEach((h,i)=>{ if((h.includes(m.toLowerCase())||h.includes(mKey))&&h.includes('target'))monthTargetCols[idx]=i; });
//   });

//   const ac=[]; hc.forEach((h,i)=>{ if(h.includes('achiev')||h.includes('ach'))ac.push(i); });
//   const CAp=ac[0]!==undefined?ac[0]:ci('achiev');
//   const hist=[...ac.slice(1)].reverse();

//   const out=[];
//   for(let i=hi+1;i<lines.length;i++){
//     if(!lines[i].trim())continue;
//     const c=parseRow(lines[i]);
//     const nm=(c[CN>=0?CN:0]||'').trim();
//     if(!nm||nm.length<2)continue;
//     if(/^[\d,. ]+$/.test(nm))continue;
//     if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='name'||nm.toLowerCase().includes('dealer'))continue;
//     const may=CAp>=0?num(c[CAp]):0;
//     const mo=[];
//     for(let m=0;m<10;m++)mo.push(hist[m]!==undefined?num(c[hist[m]]):0);
//     mo.push(may);
//     const monthTargets={};
//     Object.entries(monthTargetCols).forEach(([idx,col])=>{ monthTargets[Number(idx)]=num(c[col]); });
//     out.push({
//       id:smId+'_'+i, name:nm, salesman:smId,
//       zone:(CZ>=0?c[CZ]:'').trim(),
//       city:(CCITY>=0?c[CCITY]:'').trim(),
//       state:(CSTATE>=0?c[CSTATE]:'').trim(),
//       status:(CS>=0?c[CS]:'ACTIVE').trim()||'ACTIVE',
//       category:(CCAT>=0?c[CCAT]:'').trim(),
//       categoryType:(CCATTYPE>=0?c[CCATTYPE]:'').trim(),
//       target:CT>=0?num(c[CT]):0, achieved:may,
//       avg6m:CA>=0?num(c[CA]):0, months:mo, monthTargets,
//       creditDays:CD>=0?num(c[CD]):0,
//       creditLimit:CL>=0?num(c[CL]):0,
//     });
//   }
//   return out;
// }

// export async function fetchCSV(url){
//   const proxies=[url,`https://corsproxy.io/?${encodeURIComponent(url)}`,`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`];
//   for(const u of proxies){
//     try{
//       const r=await fetch(u,{signal:AbortSignal.timeout(6000)});
//       if(!r.ok)continue;
//       const t=await r.text();
//       if(!t||t.length<20||t.trim().startsWith('<'))continue;
//       return t;
//     }catch(e){continue;}
//   }
//   throw new Error('Could not fetch');
// }



import { MO, CURRENT_MONTH_IDX } from './constants';

export const pct   = (t,a) => (!t?(a>0?null:0):Math.round((a/t)*100));
export const spct  = (t,a) => { const p=pct(t,a); return p===null?'N/T':p+'%'; };
export const pclr  = (p)   => (p===null||p===undefined)?'#6b7280':p>=100?'#34d399':p>=60?'#fbbf24':'#f87171';
export const fcash = (v)   => v?'₹'+Number(v).toLocaleString('en-IN'):'—';

// ── Per-month target resolver ──────────────────────────────────────────────
// Returns the right target for a specific month index:
//   1. If the month has its own target stored → use that (most accurate)
//   2. Else if the month has any achievement (sales > 0) → use the global
//      dealer.target (historical Sheets-imported data only had a global)
//   3. Else → 0  (month is genuinely blank; do NOT show another month's target)
// This stops June showing May's target while keeping May's target visible
// for historical data that was imported with only a global target.
export const monthTarget = (d, idx) => {
  const explicit = Number(d?.monthTargets?.[idx]) || 0;
  if(explicit > 0) return explicit;
  const ach = Number(d?.months?.[idx]) || 0;
  if(ach > 0) return Number(d?.target) || 0;
  return 0;
};
export const num   = (v)   => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
export const uid   = ()    => Date.now()+'_'+Math.random().toString(36).slice(2);
export const isoNow= ()    => new Date().toISOString();
export const trendPct = (months) => {
  const recent=months.slice(-3).reduce((a,b)=>a+b,0);
  const prior=months.slice(-6,-3).reduce((a,b)=>a+b,0);
  if(!prior) return recent>0?100:0;
  return Math.round(((recent-prior)/prior)*100);
};
export const forecast = (months) => Math.round(months.slice(-3).reduce((a,b)=>a+b,0)/3);

export const storage = {
  async get(key,fallback=null){
    try{ if(typeof window!=='undefined'&&window.storage){ const r=await window.storage.get(key); return r?JSON.parse(r.value):fallback; } }catch(e){}
    return fallback;
  },
  async set(key,value){
    try{ if(typeof window!=='undefined'&&window.storage) await window.storage.set(key,JSON.stringify(value)); }catch(e){}
  },
};

export function parseRow(line){
  const r=[];let c='',q=false;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==='"')q=!q;
    else if(ch===','&&!q){r.push(c);c='';}
    else c+=ch;
  }
  r.push(c);
  return r.map(s=>s.trim().replace(/^"+|"+$/g,''));
}

export function parseCSV(txt,smId){
  const lines=txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n');
  let hi=0;
  for(let i=0;i<Math.min(lines.length,10);i++){
    const l=lines[i].toLowerCase();
    if(l.includes('dealer')||(l.includes('name')&&l.includes('target'))){hi=i;break;}
  }
  const rawH=parseRow(lines[hi]);
  const hc=rawH.map(h=>h.toLowerCase().replace(/[^a-z0-9]/g,' ').trim());
  const ci=(...ks)=>{ for(const k of ks){ const i=hc.findIndex(h=>h.includes(k)); if(i!==-1)return i; } return -1; };

  const CN=ci('dealer','name'), CZ=ci('zone'), CS=ci('status'), CA=ci('avg','average');
  const CD=ci('credit day','credit d'), CL=ci('credit lim','limit');
  const CCITY=ci('city'), CSTATE=ci('state');

  // ── Target column = COLUMN D (index 3) in the source Google Sheets ─────
  // The standing dealer target lives in spreadsheet column D for all
  // salesman sheets (Joseph, Senthil, etc.). Earlier auto-detection picked
  // the wrong column because some sheets have multiple "Target" headers
  // (e.g. month-specific ones). Hard-coding to D matches the actual sheet
  // structure.  If the column is empty or the file isn't a standard sheet,
  // we fall through to header-based detection as a safety net.
  const COL_D = 3;
  const MONTH_TOKENS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const isMonthSpecificTarget = h => h.includes('target') && MONTH_TOKENS.some(mt => h.includes(mt));

  let CT = COL_D;   // primary: column D
  // Safety: if column D's header is clearly something else (not numeric-like
  // and not "target"), fall back to header-based detection.
  const dHeader = (hc[COL_D] || '');
  const dLooksLikeTarget = dHeader.includes('target') || dHeader.includes('tgt') || dHeader === '' || /^[\d.,]+$/.test(rawH[COL_D] || '');
  if(!dLooksLikeTarget){
    let alt = hc.findIndex(h => h === 'target' || h === 'tgt');
    if(alt === -1) alt = hc.findIndex(h => h.includes('target') && !isMonthSpecificTarget(h));
    if(alt === -1) alt = ci('target');
    if(alt !== -1) CT = alt;
  }

  // Sub category (col AN) — find specific first
  const CCATTYPE=(()=>{
    for(const k of ['sub category','sub cat','subcat','sub-cat','category type','cat type','cattype','product type','sub type','thickness']){
      const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
    }
    const i=hc.findIndex(h=>h.includes('sub')&&h.includes('cat')); if(i!==-1)return i;
    const catCols=[]; hc.forEach((h,i)=>{ if(h.includes('category'))catCols.push(i); });
    return catCols.length>=2?catCols[1]:-1;
  })();
  // Main category (col AM) — any "category" col that isn't CCATTYPE
  const CCAT=(()=>{
    for(const k of ['main category','main cat']){
      const i=hc.findIndex(h=>h===k||h.startsWith(k)); if(i!==-1)return i;
    }
    return hc.findIndex((h,idx)=>h.includes('category')&&idx!==CCATTYPE);
  })();

  console.log('[CSV] cols 38-41:', rawH.slice(38,42));
  console.log('[CSV] CCAT='+CCAT+'("'+(rawH[CCAT]||'?')+'") CCATTYPE='+CCATTYPE+'("'+(rawH[CCATTYPE]||'?')+'")');
  // Show what's at each of the first 6 columns so you can confirm column D
  // really is Target in your sheet. A=0 B=1 C=2 D=3 E=4 F=5.
  console.log('[CSV] cols A-F headers:', rawH.slice(0, 6).map((h, i) => 'col' + String.fromCharCode(65 + i) + '="' + h + '"').join(' · '));
  console.log('[CSV] CT (target col) = ' + CT + ' (col ' + String.fromCharCode(65 + CT) + ') header="' + (rawH[CT] || '?') + '"');

  const monthTargetCols={};
  MO.forEach((m,idx)=>{
    const mKey=m.toLowerCase().replace('-',' ').replace('-','');
    hc.forEach((h,i)=>{ if((h.includes(m.toLowerCase())||h.includes(mKey))&&h.includes('target'))monthTargetCols[idx]=i; });
  });

  // ── Multi-month parser using LABEL RANGES (one section per month) ──────
  // Strategy:
  //   1. Find the label row by scanning the few rows above the header for
  //      cells that contain month names (Jan/Feb/.../Dec or full names).
  //   2. Parse that row into column ranges, one per month label.
  //   3. For each range, find Target and Achieved columns INSIDE it.
  //   4. Match the label to an MO entry by month name.
  //   5. The per-dealer loop will write each section's values into its
  //      correct month slot.
  const isPercentageHeader = h => h.includes('percent') || h.includes('%') || h.includes(' pct') || h.endsWith('pct');
  const isTargetHeader = h => h === 'target' || h === 'tgt' || (h.includes('target') && !isPercentageHeader(h));
  const isAchHeader    = h => (h.includes('achiev') || h.includes('ach')) && !isPercentageHeader(h);

  const colL = c => c >= 0 ? String.fromCharCode(65 + c) : '-';
  const MONTH_3 = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const MONTH_FULL = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  // More forgiving check — uses .includes so "Q1-Jan" / "26-March" / "MAR'26" all match
  const hasMonthName = (str) => {
    const lc = (str || '').toLowerCase().trim();
    if(!lc) return false;
    return MONTH_3.some(m => lc.includes(m)) || MONTH_FULL.some(m => lc.includes(m));
  };

  // Scan up to 6 rows above the header for the label row.
  // Pick the row with the MOST month names (best signal), not just the first.
  let labelRow = [];
  let labelRowIdx = -1;
  let bestCount = 1;   // need at least 2 month names to qualify
  for(let r = Math.max(0, hi - 6); r < hi; r++){
    const parsed = parseRow(lines[r] || '');
    const monthNamesFound = parsed.filter(hasMonthName).length;
    if(monthNamesFound > bestCount){
      bestCount = monthNamesFound;
      labelRow = parsed;
      labelRowIdx = r;
    }
  }

  // Parse the label row into ranges (each non-empty cell starts a range
  // that extends until the next non-empty cell)
  const labelRanges = [];
  {
    let lastStart = -1, lastLabel = '';
    for(let i = 0; i < labelRow.length; i++){
      const v = (labelRow[i] || '').trim();
      if(v){
        if(lastStart >= 0) labelRanges.push({ start: lastStart, end: i - 1, label: lastLabel });
        lastStart = i; lastLabel = v;
      }
    }
    if(lastStart >= 0) labelRanges.push({ start: lastStart, end: labelRow.length - 1, label: lastLabel });
  }

  // Map a label like "May" or "April" or "MAR'26" or "January 26" to the most
  // recent MO entry containing it. Uses .includes so most label formats match.
  const labelToMOIdx = (raw) => {
    if(!raw) return -1;
    const lc = raw.toLowerCase().trim();
    if(!lc) return -1;
    // Exact MO match first
    const exact = MO.findIndex(m => m.toLowerCase() === lc);
    if(exact !== -1) return exact;
    // By month name — pick the LATEST MO entry that contains that month name
    for(let mn = 0; mn < 12; mn++){
      if(lc.includes(MONTH_3[mn]) || lc.includes(MONTH_FULL[mn])){
        let found = -1;
        MO.forEach((m, i) => {
          const ml = m.toLowerCase();
          if(ml.startsWith(MONTH_3[mn]) || ml.startsWith(MONTH_FULL[mn])) found = i;
        });
        return found;
      }
    }
    return -1;
  };

  // For each label range, find Target+Achieved INSIDE the range
  const sections = [];
  labelRanges.forEach(r => {
    let tCol = -1, aCol = -1;
    for(let c = r.start; c <= r.end; c++){
      const h = hc[c] || '';
      if(tCol === -1 && isTargetHeader(h)) tCol = c;
      if(aCol === -1 && isAchHeader(h))    aCol = c;
    }
    if(tCol < 0 && aCol < 0) return;   // nothing useful in this range
    const moIdx = labelToMOIdx(r.label);
    if(moIdx < 0) return;              // unknown month — skip rather than mis-map
    sections.push({
      label: r.label,
      moIdx,
      monthLabel: MO[moIdx],
      targetCol: tCol,
      achCol:    aCol,
      startCol:  Math.min(tCol === -1 ? Infinity : tCol, aCol === -1 ? Infinity : aCol),
    });
  });

  // Track current month for top-level fields and as a fallback
  let currentMonthIdx = MO.length - 1;
  try {
    const cfg = JSON.parse(localStorage.getItem('stp_month_config') || 'null');
    if(cfg && typeof cfg.currentIdx === 'number') currentMonthIdx = cfg.currentIdx;
  } catch {}

  // Fallback: if no label row was found at all, treat column D as the
  // current month's Target and the first non-% "ach" col as Achieved.
  if(sections.length === 0){
    const achCols = [];
    hc.forEach((h, i) => { if(isAchHeader(h)) achCols.push(i); });
    let CAp = achCols.find(i => i >= CT) ?? -1;
    if(CAp === -1 && achCols.length > 0) CAp = achCols[0];
    sections.push({
      label: 'current-month',
      moIdx: currentMonthIdx,
      monthLabel: MO[currentMonthIdx] || '?',
      targetCol: CT, achCol: CAp,
      startCol: Math.min(CT, CAp === -1 ? Infinity : CAp),
    });
    console.warn('[CSV] No label row with month names found above header. Falling back to single-current-month extraction. Add month labels (May, April, …) above the column headers in your sheet for multi-month sync.');
  }

  // For top-level singletons (d.target, d.achieved): use current month's section
  const currentSection = sections.find(s => s.moIdx === currentMonthIdx) || sections[0];
  const CAp = currentSection?.achCol ?? -1;
  if(currentSection?.targetCol !== undefined && currentSection.targetCol !== -1){
    CT = currentSection.targetCol;
  }

  // Stash full debug info on window so the UI's Sheet Inspector can display
  // it without the user needing F12 console.
  if(typeof window !== 'undefined'){
    window.__lastCSVDebug = window.__lastCSVDebug || {};
    window.__lastCSVDebug[smId] = {
      smId,
      labelRowIdx,
      labelRowCells: labelRow.map((v, i) => (v && v.trim()) ? { col: i, colLetter: colL(i), value: v.trim() } : null).filter(Boolean),
      labelRanges: labelRanges.map(r => ({ start: r.start, end: r.end, startCol: colL(r.start), endCol: colL(r.end), label: r.label })),
      sections: sections.map(s => ({
        label: s.label,
        monthLabel: s.monthLabel,
        moIdx: s.moIdx,
        targetCol: s.targetCol, targetColLetter: colL(s.targetCol),
        achCol:    s.achCol,    achColLetter:    colL(s.achCol),
        targetHdr: s.targetCol >= 0 ? rawH[s.targetCol] : '',
        achHdr:    s.achCol    >= 0 ? rawH[s.achCol]    : '',
      })),
      currentMonthIdx,
      currentMonthLabel: MO[currentMonthIdx] || '?',
    };
  }

  console.log('[CSV] currentMonthIdx = ' + currentMonthIdx + ' (' + (MO[currentMonthIdx] || '?') + ')');
  // Dump every non-empty cell in the chosen label row so you can spot
  // missing/odd labels (e.g. "JAN'26" vs "Jan") at a glance.
  if(labelRowIdx >= 0){
    const labelDump = labelRow.map((v, i) => v && v.trim() ? `${colL(i)}="${v.trim()}"` : '').filter(Boolean);
    console.log('[CSV] Label row at line ' + (labelRowIdx + 1) + ' — raw cells:', labelDump.join(' · '));
  } else {
    console.log('[CSV] No label row found in 6 rows above header.');
  }
  console.log('[CSV] Label ranges built from that row: ' +
    (labelRanges.length > 0
      ? labelRanges.map(r => `${colL(r.start)}-${colL(r.end)}="${r.label}"`).join(' · ')
      : '(none)'));
  console.log('[CSV] Detected ' + sections.length + ' month sections:', sections.map(s => ({
    label: s.label, maps_to: s.monthLabel,
    targetCol: colL(s.targetCol), achCol: colL(s.achCol),
    targetHdr: s.targetCol >= 0 ? rawH[s.targetCol] : '',
    achHdr:    s.achCol    >= 0 ? rawH[s.achCol]    : '',
  })));

  const out=[];
  for(let i=hi+1;i<lines.length;i++){
    if(!lines[i].trim())continue;
    const c=parseRow(lines[i]);
    const nm=(c[CN>=0?CN:0]||'').trim();
    if(!nm||nm.length<2)continue;
    if(/^[\d,. ]+$/.test(nm))continue;
    if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='name'||nm.toLowerCase().includes('dealer'))continue;

    // ── Extract value for EVERY detected month section ─────────────────
    const mo = new Array(MO.length).fill(0);
    const monthTargets = {};
    sections.forEach(sec => {
      if(sec.moIdx < 0 || sec.moIdx >= mo.length) return;   // out of MO range
      if(sec.achCol >= 0){
        const v = num(c[sec.achCol]);
        if(v >= 0) mo[sec.moIdx] = v;
      }
      if(sec.targetCol >= 0){
        const t = num(c[sec.targetCol]);
        if(t > 0) monthTargets[sec.moIdx] = t;
      }
    });
    // Current month values for top-level fields
    const currentAch = currentMonthIdx >= 0 && currentMonthIdx < mo.length ? mo[currentMonthIdx] : 0;
    const currentTgt = monthTargets[currentMonthIdx] || 0;

    // Also pick up any month-specific Target columns labeled explicitly with
    // a month name (e.g. "May-26 Target") — keeps back-compat with the old
    // template format too.
    Object.entries(monthTargetCols).forEach(([idx, col]) => {
      const v = num(c[col]);
      if(v > 0) monthTargets[Number(idx)] = v;
    });

    out.push({
      id:smId+'_'+i, name:nm, salesman:smId,
      zone:(CZ>=0?c[CZ]:'').trim(),
      city:(CCITY>=0?c[CCITY]:'').trim(),
      state:(CSTATE>=0?c[CSTATE]:'').trim(),
      status:(CS>=0?c[CS]:'ACTIVE').trim()||'ACTIVE',
      category:(CCAT>=0?c[CCAT]:'').trim(),
      categoryType:(CCATTYPE>=0?c[CCATTYPE]:'').trim(),
      target: currentTgt, achieved: currentAch,
      avg6m:CA>=0?num(c[CA]):0, months: mo, monthTargets,
      creditDays:CD>=0?num(c[CD]):0,
      creditLimit:CL>=0?num(c[CL]):0,
    });
  }
  // ── DEBUG: per-salesman parse summary ──────────────────────────────────
  // Helps verify what was actually extracted from the sheet. Open F12 console
  // after clicking Sync to see one of these lines per salesman.
  const totalTarget   = out.reduce((s,d) => s + (Number(d.target) || 0), 0);
  const totalAchieved = out.reduce((s,d) => s + (Number(d.achieved) || 0), 0);
  const withTarget    = out.filter(d => (Number(d.target) || 0) > 0).length;
  console.log(
    `[CSV PARSE SUMMARY] salesman=${smId} dealers=${out.length} ` +
    `totalTarget=${totalTarget} (${withTarget} have target) ` +
    `totalAchieved=${totalAchieved} ` +
    `targetCol="${rawH[CT] || '?'}" achievedCol="${rawH[CAp] || '?'}"`
  );
  if(out.length > 0){
    console.log(`[CSV PARSE SUMMARY] ${smId} first dealer:`, {
      name: out[0].name, target: out[0].target, achieved: out[0].achieved,
      months: out[0].months, monthTargets: out[0].monthTargets,
    });
  }
  return out;
}

export async function fetchCSV(url){
  // For Google Sheets URLs, use Vite dev proxy to avoid CORS
  const isSheet = url.includes('docs.google.com/spreadsheets');
  const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';

  if(isSheet && isLocal){
    try{
      // Strip https://docs.google.com and use /sheet-proxy
      const proxyUrl = url.replace('https://docs.google.com', '/sheet-proxy');
      const r = await fetch(proxyUrl, {signal:AbortSignal.timeout(10000)});
      if(r.ok){
        const t = await r.text();
        if(t && t.length > 20 && !t.trim().startsWith('<')) return t;
      }
    }catch(e){ console.warn('Vite proxy failed:', e.message); }
  }

  // Fallback: try direct and CORS proxies
  const proxies=[
    url,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];
  for(const u of proxies){
    try{
      const r=await fetch(u,{signal:AbortSignal.timeout(6000)});
      if(!r.ok)continue;
      const t=await r.text();
      if(!t||t.length<20||t.trim().startsWith('<'))continue;
      return t;
    }catch(e){continue;}
  }
  throw new Error('Could not fetch CSV');
}

// ── OUTSTANDING SHEET PARSER ──────────────────────────────────────────────────
// Sheet format: Dealer Name | FEB | MAR | APR | MAY ...
export function parseOutstandingCSV(txt, smId) {
  const lines = txt.split('\n').map(l => l.replace(/\r$/, ''));
  let hi = 0;
  for(let i=0;i<Math.min(lines.length,5);i++){
    const l=lines[i].toLowerCase();
    if(l.includes('dealer')||l.includes('name')||l.includes('party')){hi=i;break;}
  }
  const rawH = lines[hi].split(',').map(h=>h.replace(/^"|"$/g,'').trim());
  const hc   = rawH.map(h=>h.toLowerCase());
  const CN   = hc.findIndex(h=>h.includes('dealer')||h.includes('name')||h.includes('party'));
  const MONTH_ABBR = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const monthCols = [];
  rawH.forEach((h,i)=>{
    if(i===CN) return;
    const hl = h.toLowerCase();
    const abbr = MONTH_ABBR.find(m=>hl.startsWith(m)||hl.includes(m));
    if(abbr) monthCols.push({colIdx:i, monthName:h.trim(), abbr});
  });
  const parseRow = (line) => {
    const r=[];let cell='',q=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='"')q=!q;
      else if(ch===','&&!q){r.push(cell);cell='';}
      else cell+=ch;
    }
    r.push(cell);
    return r.map(s=>s.trim().replace(/^"|"$/g,''));
  };
  const num = v => { if(!v&&v!==0)return 0; const x=parseFloat(String(v).replace(/[^0-9.-]/g,'')); return isNaN(x)?0:Math.round(x); };
  const out=[];
  for(let i=hi+1;i<lines.length;i++){
    if(!lines[i].trim()) continue;
    const c=parseRow(lines[i]);
    const nm=(c[CN>=0?CN:0]||'').trim();
    if(!nm||nm.length<2) continue;
    if(/^[\d,. ]+$/.test(nm)) continue;
    if(nm.toLowerCase().includes('total')||nm.toLowerCase()==='dealer') continue;
    const monthlyOutstanding={};
    monthCols.forEach(({colIdx,monthName})=>{
      monthlyOutstanding[monthName]=num(c[colIdx]);
    });
    const vals=monthCols.map(m=>num(c[m.colIdx]));
    const latestOutstanding=vals[vals.length-1]||0;
    const maxOutstanding=Math.max(...vals,0);
    const trend=vals.length>=2?vals[vals.length-1]-vals[vals.length-2]:0;
    out.push({
      id:smId+'_out_'+i, name:nm, salesman:smId,
      latestOutstanding, maxOutstanding,
      monthlyOutstanding,
      monthCols:monthCols.map(m=>m.monthName),
      trend,
      status:latestOutstanding===0?'CLEARED':'OUTSTANDING',
    });
  }
  return out.sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
}