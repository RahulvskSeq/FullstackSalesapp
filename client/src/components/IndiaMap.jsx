// import React, { useState, useMemo, useEffect, useRef } from 'react';
// import { X, MapPin, Award, ChevronRight } from 'lucide-react';
// import { MO } from '../constants';
// import { pct, spct, pclr } from '../utils';
// import { useMonth } from '../context';

// const STATE_ALIASES = {
//   'j&k':'Jammu and Kashmir','jammu and kashmir':'Jammu and Kashmir','jammu':'Jammu and Kashmir','kashmir':'Jammu and Kashmir','ladakh':'Ladakh',
//   'hp':'Himachal Pradesh','himachal':'Himachal Pradesh',
//   'up':'Uttar Pradesh','u.p.':'Uttar Pradesh',
//   'mp':'Madhya Pradesh','m.p.':'Madhya Pradesh',
//   'ap':'Andhra Pradesh','andhra':'Andhra Pradesh',
//   'tn':'Tamil Nadu','tamilnadu':'Tamil Nadu','tamil':'Tamil Nadu','tamil nadu':'Tamil Nadu',
//   'wb':'West Bengal','bengal':'West Bengal','west bengal':'West Bengal',
//   'uk':'Uttarakhand','uttaranchal':'Uttarakhand','uttarakhand':'Uttarakhand',
//   'orissa':'Odisha','odisha':'Odisha',
//   'cg':'Chhattisgarh','chattisgarh':'Chhattisgarh','chhattisgarh':'Chhattisgarh',
//   'ts':'Telangana','telangana':'Telangana',
//   'karnataka':'Karnataka','karnatka':'Karnataka',
//   'maharashtra':'Maharashtra',
//   'gujarat':'Gujarat','gj':'Gujarat',
//   'rajasthan':'Rajasthan','raj':'Rajasthan',
//   'punjab':'Punjab','pb':'Punjab',
//   'haryana':'Haryana','hr':'Haryana',
//   'delhi':'Delhi','new delhi':'Delhi','ncr':'Delhi','nd':'Delhi','nct of delhi':'Delhi',
//   'goa':'Goa',
//   'kerala':'Kerala','kl':'Kerala',
//   'assam':'Assam','bihar':'Bihar','br':'Bihar',
//   'jharkhand':'Jharkhand','jh':'Jharkhand',
//   'sikkim':'Sikkim','nagaland':'Nagaland','manipur':'Manipur','mizoram':'Mizoram','tripura':'Tripura','meghalaya':'Meghalaya',
//   'arunachal':'Arunachal Pradesh','arunachal pradesh':'Arunachal Pradesh',
//   'puducherry':'Puducherry','pondicherry':'Puducherry',
//   'andaman':'Andaman and Nicobar Islands','andaman and nicobar':'Andaman and Nicobar Islands','andaman and nicobar islands':'Andaman and Nicobar Islands',
//   'lakshadweep':'Lakshadweep','chandigarh':'Chandigarh',
//   'dadra and nagar haveli':'Dadra and Nagar Haveli and Daman and Diu','daman and diu':'Dadra and Nagar Haveli and Daman and Diu',
// };

// const normalizeState = s => {
//   if(!s) return null;
//   const l = String(s).toLowerCase().trim();
//   return STATE_ALIASES[l] || String(s).trim();
// };

// const getColor = ratio => {
//   if(!ratio||ratio===0) return '#1e2050';
//   if(ratio>0.8) return '#3730a3';
//   if(ratio>0.6) return '#4f46e5';
//   if(ratio>0.4) return '#6366f1';
//   if(ratio>0.2) return '#818cf8';
//   return '#a5b4fc';
// };

// const getFeatureStateName = feature => {
//   const p = feature?.properties||{};
//   const raw = p.ST_NM||p.st_nm||p.NAME_1||p.name||p.NAME||p.state||p.State||p.STATE||p.DISTRICT;
//   return normalizeState(raw);
// };

// // Short name for label display
// const shortName = name => {
//   if(!name) return '';
//   const shorts = {
//     'Jammu and Kashmir':'J & K',
//     'Himachal Pradesh':'H.P.',
//     'Uttar Pradesh':'U.P.',
//     'Madhya Pradesh':'M.P.',
//     'Andhra Pradesh':'A.P.',
//     'Tamil Nadu':'T.N.',
//     'West Bengal':'W.B.',
//     'Uttarakhand':'Uttrknd',
//     'Chhattisgarh':'C.G.',
//     'Arunachal Pradesh':'Arunachal',
//     'Andaman and Nicobar Islands':'A&N',
//     'Dadra and Nagar Haveli and Daman and Diu':'D&NH',
//     'Telangana':'T.S.',
//     'Karnataka':'Krtk',
//     'Maharashtra':'Maha',
//     'Rajasthan':'Raj.',
//   };
//   return shorts[name] || name;
// };

// // Label CSS injected once
// const LABEL_CSS = `
//   .state-label {
//     background: transparent !important;
//     border: none !important;
//     box-shadow: none !important;
//     font-family: Inter, system-ui, sans-serif;
//     pointer-events: none;
//     transition: opacity 0.3s;
//   }
//   .state-label-inner {
//     color: rgba(255,255,255,0.9);
//     font-size: 9px;
//     font-weight: 700;
//     text-align: center;
//     line-height: 1.3;
//     text-shadow: 0 1px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.9);
//     white-space: nowrap;
//     pointer-events: none;
//   }
//   .state-label-inner .lbl-val {
//     color: #fbbf24;
//     font-size: 8px;
//     font-weight: 700;
//     display: block;
//     text-shadow: 0 1px 4px rgba(0,0,0,1);
//   }
//   .leaflet-tooltip.state-label::before { display:none; }
//   /* Hide our custom state labels when zoomed in (city labels take over) */
//   .leaflet-zoom-level-7 .state-label,
//   .leaflet-zoom-level-8 .state-label,
//   .leaflet-zoom-level-9 .state-label,
//   .leaflet-zoom-level-10 .state-label { opacity: 0.3; }
//   /* Leaflet label layer tooltip */
//   .leaflet-tooltip-custom {
//     background: transparent !important;
//     border: none !important;
//     box-shadow: none !important;
//     padding: 0 !important;
//   }
//   .leaflet-tooltip-custom::before { display: none !important; }
// `;

// export default function IndiaMap({ dealers=[], users={}, onOpenDealer }) {
//   const { selectedMonthIdx } = useMonth();
//   const mapRef    = useRef(null);
//   const mapObjRef = useRef(null);
//   const layerRef  = useRef(null);
//   const labelsRef = useRef([]);
//   const geoRef    = useRef(null);

//   const [selected, setSelected] = useState(null);
//   const [viewMode, setViewMode] = useState('sales');
//   const [leafletReady, setLeafletReady] = useState(false);
//   const [geoReady, setGeoReady]         = useState(false);

//   const stateData = useMemo(() => {
//     const map = {};
//     dealers.forEach(d => {
//       const norm = normalizeState(d.state);
//       if(!norm) return;
//       const key = norm.toLowerCase();
//       if(!map[key]) map[key]={ name:norm, dealers:[], total:0, target:0, bySM:{} };
//       const ach = Number(d.months?.[selectedMonthIdx]||0);
//       const tgt = Number((d.monthTargets?.[selectedMonthIdx]??d.target)||0);
//       map[key].dealers.push(d);
//       map[key].total  += ach;
//       map[key].target += tgt;
//       const smKey = d.salesman||'Unassigned';
//       if(!map[key].bySM[smKey]) map[key].bySM[smKey]={u:0,n:0};
//       map[key].bySM[smKey].u += ach;
//       map[key].bySM[smKey].n += 1;
//     });
//     return map;
//   }, [dealers, selectedMonthIdx]);

//   const maxVal = useMemo(() => {
//     const vals = Object.values(stateData).map(d => {
//       if(viewMode==='dealers') return d.dealers.length;
//       if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
//       return d.total;
//     });
//     return Math.max(...vals,1);
//   }, [stateData, viewMode]);

//   const topStates = useMemo(() => Object.values(stateData).sort((a,b)=>b.total-a.total).slice(0,12), [stateData]);
//   const unmapped  = useMemo(() => dealers.filter(d=>!d.state?.trim()).length, [dealers]);
//   const det = selected ? stateData[selected.toLowerCase()] : null;

//   // Load Leaflet
//   useEffect(() => {
//     if(!document.getElementById('leaflet-css')){
//       const link=document.createElement('link');
//       link.id='leaflet-css'; link.rel='stylesheet';
//       link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
//       document.head.appendChild(link);
//     }
//     if(!document.getElementById('india-map-label-css')){
//       const s=document.createElement('style');
//       s.id='india-map-label-css'; s.textContent=LABEL_CSS;
//       document.head.appendChild(s);
//     }
//     if(window.L){ setLeafletReady(true); return; }
//     let script=document.getElementById('leaflet-js');
//     if(!script){ script=document.createElement('script'); script.id='leaflet-js'; script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async=true; document.head.appendChild(script); }
//     const onLoad=()=>setLeafletReady(true);
//     script.addEventListener('load',onLoad);
//     return()=>script.removeEventListener('load',onLoad);
//   }, []);

//   // Load GeoJSON
//   useEffect(() => {
//     if(geoRef.current){ setGeoReady(true); return; }
//     fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson')
//       .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
//       .catch(()=>{
//         fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
//           .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
//           .catch(e=>console.error('GeoJSON failed:',e));
//       });
//   }, []);

//   // Init map
//   useEffect(() => {
//     if(!leafletReady||!geoReady||!mapRef.current) return;
//     if(mapObjRef.current) return;
//     const L=window.L;
//     const map=L.map(mapRef.current,{ center:[22,80], zoom:4, zoomControl:true, scrollWheelZoom:true, attributionControl:false, minZoom:3, maxZoom:14 });
//     // Create a pane above overlayPane for city labels
//     map.createPane('labelsPane');
//     map.getPane('labelsPane').style.zIndex = 650;
//     map.getPane('labelsPane').style.pointerEvents = 'none';
//     mapObjRef.current=map;
//     // Base dark tile (no labels) - states colored on top
//     L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{
//       attribution:'© CartoDB', subdomains:'abcd', maxZoom:19, zIndex:1
//     }).addTo(map);

//     // Label tile layer on TOP of states - cities/areas appear on zoom
//     // This layer sits above the GeoJSON so city names are always visible
//     L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',{
//       attribution:'© CartoDB', subdomains:'abcd', maxZoom:19,
//       zIndex:10, // above GeoJSON layer
//       pane:'labelsPane',
//     }).addTo(map);
//     setTimeout(()=>map.invalidateSize(),100);
//     return()=>{ map.remove(); mapObjRef.current=null; layerRef.current=null; };
//   }, [leafletReady, geoReady]);

//   // Render GeoJSON + labels
//   useEffect(() => {
//     if(!leafletReady||!geoReady||!mapObjRef.current||!geoRef.current) return;
//     const L=window.L, map=mapObjRef.current;

//     // Remove old layer and labels
//     if(layerRef.current){ layerRef.current.remove(); layerRef.current=null; }
//     labelsRef.current.forEach(l=>l.remove());
//     labelsRef.current=[];

//     const getVal = key => {
//       const d=stateData[key]; if(!d) return 0;
//       if(viewMode==='dealers') return d.dealers.length;
//       if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
//       return d.total;
//     };

//     const geoLayer = L.geoJSON(geoRef.current, {
//       style: feature => {
//         const name=getFeatureStateName(feature);
//         const key=name?.toLowerCase();
//         const value=key?getVal(key):0;
//         const ratio=maxVal?value/maxVal:0;
//         const isSel=selected&&name&&selected.toLowerCase()===name.toLowerCase();
//         return { color:isSel?'#fbbf24':'#252548', weight:isSel?2.2:1, fillColor:isSel?'#fbbf24':getColor(ratio), fillOpacity:isSel?0.78:0.65, opacity:1 };
//       },
//       onEachFeature: (feature, layer) => {
//         const name=getFeatureStateName(feature);
//         const key=name?.toLowerCase();
//         const d=key?stateData[key]:null;
//         const sales=d?.total||0;
//         const dealerCount=d?.dealers?.length||0;
//         const target=d?.target||0;
//         const achPct=target?Math.round((sales/target)*100):0;

//         // Hover tooltip (rich)
//         layer.bindTooltip(
//           '<div style="font-family:system-ui;background:#0e0e20;border:1px solid #6366f1;border-radius:8px;padding:9px 12px;min-width:140px">' +
//           '<div style="font-size:12px;font-weight:700;color:#e2e0f0;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #252548">' + (d?.name||name||'') + '</div>' +
//           '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Sales</span><span style="color:#34d399;font-weight:700">' + sales + '</span></div>' +
//           '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Dealers</span><span style="color:#818cf8;font-weight:700">' + dealerCount + '</span></div>' +
//           (target ? '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px"><span>Ach%</span><span style="font-weight:700">' + achPct + '%</span></div>' : '') +
//           (d && dealerCount > 0 ? '<div style="font-size:9px;color:#55546a;margin-top:5px;padding-top:4px;border-top:1px solid #252548">' + d.dealers.slice(0,2).map(dd=>dd.name).join(' · ') + (dealerCount > 2 ? ' +' + (dealerCount-2) : '') + '</div>' : '') +
//           '</div>',
//           { sticky:true, opacity:1, className:'leaflet-tooltip-custom' });

//         layer.on({
//           mouseover: e => { e.target.setStyle({weight:2,color:'#fbbf24',fillOpacity:0.85}); if(!L.Browser.ie&&!L.Browser.opera&&!L.Browser.edge) e.target.bringToFront(); },
//           mouseout:  e => { if(layerRef.current) layerRef.current.resetStyle(e.target); },
//           click: e => {
//             if(d?.name||name) setSelected(d?.name||name);
//             try{ map.fitBounds(e.target.getBounds(),{padding:[20,20],maxZoom:6}); }catch{}
//           },
//         });
//       },
//     }).addTo(map);

//     layerRef.current = geoLayer;

//     // Add permanent text labels on each state
//     geoRef.current.features.forEach(feature => {
//       const name = getFeatureStateName(feature);
//       const key  = name?.toLowerCase();
//       const d    = key?stateData[key]:null;
//       const val  = key?getVal(key):0;

//       try {
//         // Compute centroid from bounding box
//         const layer = L.geoJSON(feature);
//         const bounds = layer.getBounds();
//         const center = bounds.getCenter();

//         const sn    = shortName(name||'?');
//         const valStr = val > 0 ? String(val) : '';

//         const label = L.tooltip({
//           permanent: true,
//           direction: 'center',
//           className: 'state-label',
//           interactive: false,
//           opacity: 1,
//         })
//         .setContent('<div class="state-label-inner">' + sn + (valStr ? '<span class="lbl-val">' + valStr + '</span>' : '') + '</div>')
//         .setLatLng(center);

//         label.addTo(map);
//         labelsRef.current.push(label);
//       } catch(e) {}
//     });

//   }, [leafletReady, geoReady, stateData, viewMode, maxVal, selected]);

//   return (
//     <div className="fade" style={{padding:0}}>
//       <div style={{marginBottom:10}}>
//         <div style={{fontSize:10,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:2}}>Geography · {MO[selectedMonthIdx]}</div>
//         <div style={{fontSize:18,fontWeight:700}}>India Sales Map</div>
//       </div>

//       <div style={{background:'#0c0c1e',borderRadius:12,border:'1px solid #1e1e38',overflow:'hidden',marginBottom:10}}>
//         <div style={{padding:'8px 10px',background:'#0e0e20',borderBottom:'1px solid #1e1e38',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
//           <MapPin size={12} color="#6366f1"/>
//           <span style={{fontSize:12,fontWeight:600,color:'#e2e0f0'}}>India</span>
//           <span style={{fontSize:10,color:'#55546a'}}>hover=details · click=select · scroll=zoom</span>
//           <div style={{flex:1}}/>
//           <div style={{display:'flex',background:'#141430',border:'1px solid #252548',borderRadius:6,overflow:'hidden'}}>
//             {[['sales','Sales'],['dealers','Dealers'],['achievement','Ach%']].map(([m,l])=>(
//               <button key={m} onClick={()=>setViewMode(m)} style={{background:viewMode===m?'#6366f1':'transparent',color:viewMode===m?'#fff':'#55546a',border:'none',padding:'4px 8px',fontSize:11,fontWeight:600,cursor:'pointer',borderLeft:m!=='sales'?'1px solid #252548':'none'}}>{l}</button>
//             ))}
//           </div>
//           {selected&&<button onClick={()=>setSelected(null)} style={{background:'none',border:'1px solid #252548',borderRadius:6,color:'#f87171',fontSize:11,padding:'4px 8px',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><X size={10}/>Clear</button>}
//         </div>

//         <div style={{position:'relative'}}>
//           <div ref={mapRef} style={{height:'clamp(260px,58vw,520px)',width:'100%'}}/>
//           {(!leafletReady||!geoReady)&&(
//             <div style={{position:'absolute',inset:0,background:'#0c0c1e',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
//               <div style={{width:28,height:28,border:'3px solid #1e1e38',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
//               <div style={{fontSize:12,color:'#55546a'}}>Loading map...</div>
//             </div>
//           )}
//           <div style={{position:'absolute',bottom:10,left:8,background:'rgba(12,12,30,0.95)',borderRadius:7,padding:'5px 8px',border:'1px solid #1e1e38',zIndex:1000}}>
//             <div style={{fontSize:7,color:'#55546a',marginBottom:3,textTransform:'uppercase'}}>{viewMode}</div>
//             <div style={{display:'flex',gap:2}}>
//               {[['#1e2050','None'],['#a5b4fc','Low'],['#6366f1','Mid'],['#3730a3','Top'],['#fbbf24','Sel']].map(([c,l])=>(
//                 <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
//                   <div style={{width:14,height:8,borderRadius:2,background:c,border:'1px solid #ffffff12'}}/>
//                   <span style={{fontSize:6,color:'#55546a'}}>{l}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//           {leafletReady&&geoReady&&Object.keys(stateData).length===0&&(
//             <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none',zIndex:1000}}>
//               <MapPin size={28} style={{margin:'0 auto 8px',opacity:.15,color:'#6366f1'}}/>
//               <div style={{fontSize:12,color:'#55546a',background:'rgba(12,12,30,0.9)',padding:'6px 12px',borderRadius:7}}>Add "State" column to your sheet</div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
//         {selected&&det?(
//           <div className="card" style={{padding:0,overflow:'hidden'}}>
//             <div style={{padding:'10px 12px',background:'rgba(251,191,36,0.08)',borderBottom:'1px solid rgba(251,191,36,0.2)',display:'flex',alignItems:'center',gap:8}}>
//               <div style={{width:7,height:7,borderRadius:'50%',background:'#fbbf24',flexShrink:0}}/>
//               <span style={{fontSize:13,fontWeight:700,color:'#fbbf24',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selected}</span>
//               <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#55546a',cursor:'pointer'}}><X size={13}/></button>
//             </div>
//             <div style={{padding:12}}>
//               <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
//                 {[{l:'Sales',v:det.total,c:'#34d399'},{l:'Dealers',v:det.dealers.length,c:'#6366f1'},{l:'Target',v:det.target||'—',c:'var(--t2)'},{l:'Ach%',v:det.target?pct(det.target,det.total)+'%':'N/T',c:pclr(det.target?pct(det.target,det.total):null)}].map(k=>(
//                   <div key={k.l} style={{background:'var(--bg2)',borderRadius:7,padding:'7px 8px'}}>
//                     <div style={{fontSize:8,color:'var(--t3)',textTransform:'uppercase',marginBottom:2}}>{k.l}</div>
//                     <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
//                   </div>
//                 ))}
//               </div>
//               {Object.keys(det.bySM).length>0&&(
//                 <div style={{marginBottom:12}}>
//                   <div style={{fontSize:10,color:'var(--t3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>By Salesman</div>
//                   {Object.entries(det.bySM).sort((a,b)=>b[1].u-a[1].u).map(([smId,sm])=>{
//                     const user=users[smId]; const bar=det.total?Math.round((sm.u/det.total)*100):0;
//                     return(<div key={smId} style={{marginBottom:7}}>
//                       <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
//                         {user&&<div style={{width:18,height:18,borderRadius:'50%',background:user.color+'22',color:user.color,border:`1px solid ${user.color}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,flexShrink:0}}>{user.ini}</div>}
//                         <span style={{fontSize:11,color:'var(--t2)',flex:1}}>{user?.name||smId}</span>
//                         <span style={{fontSize:12,fontWeight:700,color:user?.color||'#6366f1'}}>{sm.u}</span>
//                       </div>
//                       <div style={{height:3,background:'var(--b1)',borderRadius:2}}><div style={{height:'100%',width:bar+'%',background:user?.color||'#6366f1',borderRadius:2}}/></div>
//                     </div>);
//                   })}
//                 </div>
//               )}
//               <div style={{fontSize:10,color:'var(--t3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Dealers ({det.dealers.length})</div>
//               <div style={{maxHeight:180,overflowY:'auto'}}>
//                 {[...det.dealers].sort((a,b)=>(b.months?.[selectedMonthIdx]||0)-(a.months?.[selectedMonthIdx]||0)).map(d=>{
//                   const ach=d.months?.[selectedMonthIdx]||0; const tgt=(d.monthTargets?.[selectedMonthIdx]??d.target)||0; const dp=pct(tgt,ach);
//                   return(<div key={d.id} onClick={()=>onOpenDealer?.(d.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 2px',borderBottom:'1px solid var(--b1)',cursor:'pointer',borderRadius:4,transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
//                     <div style={{flex:1,minWidth:0}}>
//                       <div style={{fontSize:11,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
//                       <div style={{fontSize:10,color:'var(--t3)'}}>{d.city||''}</div>
//                     </div>
//                     <div style={{textAlign:'right',flexShrink:0}}>
//                       <div style={{fontSize:12,fontWeight:700,color:'#34d399'}}>{ach}</div>
//                       <div style={{fontSize:10,color:pclr(dp)}}>{spct(tgt,ach)}</div>
//                     </div>
//                     <ChevronRight size={11} color="var(--t3)"/>
//                   </div>);
//                 })}
//               </div>
//             </div>
//           </div>
//         ):(
//           <div className="card" style={{padding:0,overflow:'hidden'}}>
//             <div style={{padding:'10px 12px',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:6}}>
//               <Award size={13} color="#fbbf24"/>
//               <span style={{fontSize:13,fontWeight:700,color:'var(--t2)'}}>Top States</span>
//               <span style={{fontSize:11,color:'var(--t3)',marginLeft:2}}>— {MO[selectedMonthIdx]}</span>
//             </div>
//             <div style={{padding:'4px 0',maxHeight:300,overflowY:'auto'}}>
//               {topStates.length===0?<div style={{padding:'16px',color:'var(--t3)',fontSize:12,textAlign:'center'}}>No state data</div>
//               :topStates.map(({name,total,dealers:dl},i)=>{
//                 const bar=Math.round((total/(topStates[0]?.total||1))*100);
//                 return(<div key={name} onClick={()=>setSelected(s=>s===name?null:name)} style={{padding:'7px 12px',cursor:'pointer',background:selected===name?'rgba(99,102,241,0.08)':'transparent',borderLeft:`3px solid ${selected===name?'#6366f1':'transparent'}`,transition:'all .15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background=selected===name?'rgba(99,102,241,0.08)':'transparent'}>
//                   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
//                     <div style={{display:'flex',alignItems:'center',gap:6}}>
//                       <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right'}}>{i+1}</span>
//                       <span style={{fontSize:12,fontWeight:600,color:selected===name?'var(--acc)':'var(--t1)'}}>{name}</span>
//                     </div>
//                     <div style={{display:'flex',gap:8,alignItems:'center'}}>
//                       <span style={{fontSize:10,color:'var(--t3)'}}>{dl.length}d</span>
//                       <span style={{fontSize:13,fontWeight:700,color:'#34d399'}}>{total}</span>
//                     </div>
//                   </div>
//                   <div style={{height:3,background:'var(--b1)',borderRadius:2,marginLeft:20}}>
//                     <div style={{height:'100%',width:bar+'%',background:'linear-gradient(90deg,#6366f1,#a5b4fc)',borderRadius:2,transition:'width .5s'}}/>
//                   </div>
//                 </div>);
//               })}
//             </div>
//           </div>
//         )}

//         <div className="card">
//           <div style={{fontSize:10,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Summary</div>
//           {[
//             {l:'States covered',v:Object.keys(stateData).length,c:'#6366f1'},
//             {l:'Total sales',v:Object.values(stateData).reduce((s,d)=>s+d.total,0),c:'#34d399'},
//             {l:'Mapped dealers',v:dealers.length-unmapped,c:'var(--t2)'},
//             {l:'Unmapped',v:unmapped,c:unmapped>0?'#fbbf24':'var(--t3)'},
//           ].map(k=>(
//             <div key={k.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
//               <span style={{color:'var(--t3)'}}>{k.l}</span>
//               <span style={{fontWeight:700,color:k.c}}>{k.v}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }



// import React, { useState, useMemo, useEffect, useRef } from 'react';
// import { X, MapPin, Award, ChevronRight } from 'lucide-react';
// import { MO } from '../constants';
// import { pct, spct, pclr } from '../utils';
// import { useMonth } from '../context';

// const STATE_ALIASES = {
//   'j&k':'Jammu and Kashmir','jammu and kashmir':'Jammu and Kashmir','jammu':'Jammu and Kashmir','kashmir':'Jammu and Kashmir','ladakh':'Ladakh',
//   'hp':'Himachal Pradesh','himachal':'Himachal Pradesh',
//   'up':'Uttar Pradesh','u.p.':'Uttar Pradesh',
//   'mp':'Madhya Pradesh','m.p.':'Madhya Pradesh',
//   'ap':'Andhra Pradesh','andhra':'Andhra Pradesh',
//   'tn':'Tamil Nadu','tamilnadu':'Tamil Nadu','tamil':'Tamil Nadu','tamil nadu':'Tamil Nadu',
//   'wb':'West Bengal','bengal':'West Bengal','west bengal':'West Bengal',
//   'uk':'Uttarakhand','uttaranchal':'Uttarakhand','uttarakhand':'Uttarakhand',
//   'orissa':'Odisha','odisha':'Odisha',
//   'cg':'Chhattisgarh','chattisgarh':'Chhattisgarh','chhattisgarh':'Chhattisgarh',
//   'ts':'Telangana','telangana':'Telangana',
//   'karnataka':'Karnataka','karnatka':'Karnataka',
//   'maharashtra':'Maharashtra',
//   'gujarat':'Gujarat','gj':'Gujarat',
//   'rajasthan':'Rajasthan','raj':'Rajasthan',
//   'punjab':'Punjab','pb':'Punjab',
//   'haryana':'Haryana','hr':'Haryana',
//   'delhi':'Delhi','new delhi':'Delhi','ncr':'Delhi','nd':'Delhi','nct of delhi':'Delhi',
//   'goa':'Goa',
//   'kerala':'Kerala','kl':'Kerala',
//   'assam':'Assam','bihar':'Bihar','br':'Bihar',
//   'jharkhand':'Jharkhand','jh':'Jharkhand',
//   'sikkim':'Sikkim','nagaland':'Nagaland','manipur':'Manipur','mizoram':'Mizoram','tripura':'Tripura','meghalaya':'Meghalaya',
//   'arunachal':'Arunachal Pradesh','arunachal pradesh':'Arunachal Pradesh',
//   'puducherry':'Puducherry','pondicherry':'Puducherry',
//   'andaman':'Andaman and Nicobar Islands','andaman and nicobar':'Andaman and Nicobar Islands','andaman and nicobar islands':'Andaman and Nicobar Islands',
//   'lakshadweep':'Lakshadweep','chandigarh':'Chandigarh',
//   'dadra and nagar haveli':'Dadra and Nagar Haveli and Daman and Diu','daman and diu':'Dadra and Nagar Haveli and Daman and Diu',
// };

// const normalizeState = s => {
//   if(!s) return null;
//   const l = String(s).toLowerCase().trim();
//   return STATE_ALIASES[l] || String(s).trim();
// };

// const getColor = ratio => {
//   if(!ratio||ratio===0) return '#1e2050';
//   if(ratio>0.8) return '#3730a3';
//   if(ratio>0.6) return '#4f46e5';
//   if(ratio>0.4) return '#6366f1';
//   if(ratio>0.2) return '#818cf8';
//   return '#a5b4fc';
// };

// const getFeatureStateName = feature => {
//   const p = feature?.properties||{};
//   const raw = p.ST_NM||p.st_nm||p.NAME_1||p.name||p.NAME||p.state||p.State||p.STATE||p.DISTRICT;
//   return normalizeState(raw);
// };

// // Short name for label display
// const shortName = name => {
//   if(!name) return '';
//   const shorts = {
//     'Jammu and Kashmir':'J & K',
//     'Himachal Pradesh':'H.P.',
//     'Uttar Pradesh':'U.P.',
//     'Madhya Pradesh':'M.P.',
//     'Andhra Pradesh':'A.P.',
//     'Tamil Nadu':'T.N.',
//     'West Bengal':'W.B.',
//     'Uttarakhand':'Uttrknd',
//     'Chhattisgarh':'C.G.',
//     'Arunachal Pradesh':'Arunachal',
//     'Andaman and Nicobar Islands':'A&N',
//     'Dadra and Nagar Haveli and Daman and Diu':'D&NH',
//     'Telangana':'T.S.',
//     'Karnataka':'Krtk',
//     'Maharashtra':'Maha',
//     'Rajasthan':'Raj.',
//   };
//   return shorts[name] || name;
// };

// // Label CSS injected once
// const LABEL_CSS = `
//   .state-label {
//     background: transparent !important;
//     border: none !important;
//     box-shadow: none !important;
//     font-family: Inter, system-ui, sans-serif;
//     pointer-events: none;
//     transition: opacity 0.3s;
//   }
//   .state-label-inner {
//     color: rgba(255,255,255,0.9);
//     font-size: 9px;
//     font-weight: 700;
//     text-align: center;
//     line-height: 1.3;
//     text-shadow: 0 1px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.9);
//     white-space: nowrap;
//     pointer-events: none;
//   }
//   .state-label-inner .lbl-val {
//     color: #fbbf24;
//     font-size: 8px;
//     font-weight: 700;
//     display: block;
//     text-shadow: 0 1px 4px rgba(0,0,0,1);
//   }
//   .leaflet-tooltip.state-label::before { display:none; }
//   /* Hide our custom state labels when zoomed in (city labels take over) */
//   .leaflet-zoom-level-7 .state-label,
//   .leaflet-zoom-level-8 .state-label,
//   .leaflet-zoom-level-9 .state-label,
//   .leaflet-zoom-level-10 .state-label { opacity: 0.3; }
//   /* Leaflet label layer tooltip */
//   .leaflet-tooltip-custom {
//     background: transparent !important;
//     border: none !important;
//     box-shadow: none !important;
//     padding: 0 !important;
//   }
//   .leaflet-tooltip-custom::before { display: none !important; }
// `;

// export default function IndiaMap({ dealers=[], users={}, onOpenDealer }) {
//   const { selectedMonthIdx } = useMonth();
//   const mapRef    = useRef(null);
//   const mapObjRef = useRef(null);
//   const layerRef  = useRef(null);
//   const labelsRef = useRef([]);
//   const geoRef    = useRef(null);

//   const [selected, setSelected] = useState(null);
//   const [viewMode, setViewMode] = useState('sales');
//   const [leafletReady, setLeafletReady] = useState(false);
//   const [geoReady, setGeoReady]         = useState(false);

//   const stateData = useMemo(() => {
//     const map = {};
//     dealers.forEach(d => {
//       const norm = normalizeState(d.state);
//       if(!norm) return;
//       const key = norm.toLowerCase();
//       if(!map[key]) map[key]={ name:norm, dealers:[], total:0, target:0, bySM:{} };
//       const ach = Number(d.months?.[selectedMonthIdx]||0);
//       const tgt = Number((d.monthTargets?.[selectedMonthIdx]??d.target)||0);
//       map[key].dealers.push(d);
//       map[key].total  += ach;
//       map[key].target += tgt;
//       const smKey = d.salesman||'Unassigned';
//       if(!map[key].bySM[smKey]) map[key].bySM[smKey]={u:0,n:0};
//       map[key].bySM[smKey].u += ach;
//       map[key].bySM[smKey].n += 1;
//     });
//     return map;
//   }, [dealers, selectedMonthIdx]);

//   const maxVal = useMemo(() => {
//     const vals = Object.values(stateData).map(d => {
//       if(viewMode==='dealers') return d.dealers.length;
//       if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
//       return d.total;
//     });
//     return Math.max(...vals,1);
//   }, [stateData, viewMode]);

//   const topStates = useMemo(() => Object.values(stateData).sort((a,b)=>b.total-a.total).slice(0,12), [stateData]);
//   const unmapped  = useMemo(() => dealers.filter(d=>!d.state?.trim()).length, [dealers]);
//   const cityData  = useMemo(() => {
//     const map = {};
//     dealers.forEach(d => {
//       if(!d.city?.trim()) return;
//       const key = d.city.trim().toLowerCase();
//       if(!map[key]) map[key] = { name:d.city.trim(), dealers:[], total:0 };
//       map[key].dealers.push(d);
//       map[key].total += Number(d.months?.[selectedMonthIdx]||0);
//     });
//     return Object.values(map).filter(cx=>cx.total>0).sort((a,b)=>b.total-a.total);
//   }, [dealers, selectedMonthIdx]);
//   const det = selected ? stateData[selected.toLowerCase()] : null;

//   // Load Leaflet
//   useEffect(() => {
//     if(!document.getElementById('leaflet-css')){
//       const link=document.createElement('link');
//       link.id='leaflet-css'; link.rel='stylesheet';
//       link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
//       document.head.appendChild(link);
//     }
//     if(!document.getElementById('india-map-label-css')){
//       const s=document.createElement('style');
//       s.id='india-map-label-css'; s.textContent=LABEL_CSS;
//       document.head.appendChild(s);
//     }
//     if(window.L){ setLeafletReady(true); return; }
//     let script=document.getElementById('leaflet-js');
//     if(!script){ script=document.createElement('script'); script.id='leaflet-js'; script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async=true; document.head.appendChild(script); }
//     const onLoad=()=>setLeafletReady(true);
//     script.addEventListener('load',onLoad);
//     return()=>script.removeEventListener('load',onLoad);
//   }, []);

//   // Load GeoJSON
//   useEffect(() => {
//     if(geoRef.current){ setGeoReady(true); return; }
//     fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson')
//       .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
//       .catch(()=>{
//         fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
//           .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
//           .catch(e=>console.error('GeoJSON failed:',e));
//       });
//   }, []);

//   // Init map
//   useEffect(() => {
//     if(!leafletReady||!geoReady||!mapRef.current) return;
//     if(mapObjRef.current) return;
//     const L=window.L;
//     const map=L.map(mapRef.current,{ center:[22,80], zoom:4, zoomControl:true, scrollWheelZoom:true, attributionControl:false, minZoom:3, maxZoom:14 });
//     // Create a pane above overlayPane for city labels
//     map.createPane('labelsPane');
//     map.getPane('labelsPane').style.zIndex = 650;
//     map.getPane('labelsPane').style.pointerEvents = 'none';
//     mapObjRef.current=map;
//     // Base dark tile (no labels) - states colored on top
//     L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{
//       attribution:'© CartoDB', subdomains:'abcd', maxZoom:19, zIndex:1
//     }).addTo(map);

//     // Label tile layer on TOP of states - cities/areas appear on zoom
//     // This layer sits above the GeoJSON so city names are always visible
//     L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',{
//       attribution:'© CartoDB', subdomains:'abcd', maxZoom:19,
//       zIndex:10, // above GeoJSON layer
//       pane:'labelsPane',
//     }).addTo(map);
//     setTimeout(()=>map.invalidateSize(),100);
//     return()=>{ map.remove(); mapObjRef.current=null; layerRef.current=null; };
//   }, [leafletReady, geoReady]);

//   // Render GeoJSON + labels
//   useEffect(() => {
//     if(!leafletReady||!geoReady||!mapObjRef.current||!geoRef.current) return;
//     const L=window.L, map=mapObjRef.current;

//     // Remove old layer and labels
//     if(layerRef.current){ layerRef.current.remove(); layerRef.current=null; }
//     labelsRef.current.forEach(l=>l.remove());
//     labelsRef.current=[];

//     const getVal = key => {
//       const d=stateData[key]; if(!d) return 0;
//       if(viewMode==='dealers') return d.dealers.length;
//       if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
//       return d.total;
//     };

//     const geoLayer = L.geoJSON(geoRef.current, {
//       style: feature => {
//         const name=getFeatureStateName(feature);
//         const key=name?.toLowerCase();
//         const value=key?getVal(key):0;
//         const ratio=maxVal?value/maxVal:0;
//         const isSel=selected&&name&&selected.toLowerCase()===name.toLowerCase();
//         return { color:isSel?'#fbbf24':'#252548', weight:isSel?2.2:1, fillColor:isSel?'#fbbf24':getColor(ratio), fillOpacity:isSel?0.78:0.65, opacity:1 };
//       },
//       onEachFeature: (feature, layer) => {
//         const name=getFeatureStateName(feature);
//         const key=name?.toLowerCase();
//         const d=key?stateData[key]:null;
//         const sales=d?.total||0;
//         const dealerCount=d?.dealers?.length||0;
//         const target=d?.target||0;
//         const achPct=target?Math.round((sales/target)*100):0;

//         // Hover tooltip (rich)
//         layer.bindTooltip(
//           '<div style="font-family:system-ui;background:#0e0e20;border:1px solid #6366f1;border-radius:8px;padding:9px 12px;min-width:140px">' +
//           '<div style="font-size:12px;font-weight:700;color:#e2e0f0;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #252548">' + (d?.name||name||'') + '</div>' +
//           '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Sales</span><span style="color:#34d399;font-weight:700">' + sales + '</span></div>' +
//           '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Dealers</span><span style="color:#818cf8;font-weight:700">' + dealerCount + '</span></div>' +
//           (target ? '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px"><span>Ach%</span><span style="font-weight:700">' + achPct + '%</span></div>' : '') +
//           (d && dealerCount > 0 ? '<div style="font-size:9px;color:#55546a;margin-top:5px;padding-top:4px;border-top:1px solid #252548">' + d.dealers.slice(0,2).map(dd=>dd.name).join(' · ') + (dealerCount > 2 ? ' +' + (dealerCount-2) : '') + '</div>' : '') +
//           '</div>',
//           { sticky:true, opacity:1, className:'leaflet-tooltip-custom' });

//         layer.on({
//           mouseover: e => { e.target.setStyle({weight:2,color:'#fbbf24',fillOpacity:0.85}); if(!L.Browser.ie&&!L.Browser.opera&&!L.Browser.edge) e.target.bringToFront(); },
//           mouseout:  e => { if(layerRef.current) layerRef.current.resetStyle(e.target); },
//           click: e => {
//             if(d?.name||name) setSelected(d?.name||name);
//             try{ map.fitBounds(e.target.getBounds(),{padding:[20,20],maxZoom:6}); }catch{}
//           },
//         });
//       },
//     }).addTo(map);

//     layerRef.current = geoLayer;

//     // City dot markers - appear at zoom 6+
//     const CITY_COORDS = {
//       'mumbai':[19.076,72.877],'delhi':[28.679,77.213],'bangalore':[12.972,77.594],
//       'bengaluru':[12.972,77.594],'hyderabad':[17.385,78.487],'chennai':[13.083,80.270],
//       'kolkata':[22.563,88.363],'pune':[18.520,73.856],'ahmedabad':[23.023,72.572],
//       'surat':[21.170,72.831],'jaipur':[26.912,75.787],'lucknow':[26.847,80.947],
//       'kanpur':[26.449,80.331],'nagpur':[21.146,79.089],'indore':[22.719,75.857],
//       'bhopal':[23.259,77.413],'visakhapatnam':[17.686,83.218],'patna':[25.594,85.138],
//       'vadodara':[22.307,73.181],'ludhiana':[30.901,75.857],'agra':[27.176,78.008],
//       'nashik':[19.990,73.791],'faridabad':[28.408,77.317],'meerut':[28.984,77.706],
//       'rajkot':[22.303,70.802],'varanasi':[25.318,83.004],'aurangabad':[19.877,75.324],
//       'amritsar':[31.634,74.873],'allahabad':[25.435,81.846],'ranchi':[23.344,85.310],
//       'coimbatore':[11.017,76.955],'gwalior':[26.228,78.182],'vijayawada':[16.506,80.648],
//       'jodhpur':[26.295,73.017],'madurai':[9.925,78.120],'raipur':[21.251,81.633],
//       'chandigarh':[30.733,76.779],'guwahati':[26.144,91.736],'mysore':[12.295,76.639],
//       'mysuru':[12.295,76.639],'kochi':[9.931,76.267],'dehradun':[30.316,78.032],
//       'noida':[28.535,77.391],'gurugram':[28.459,77.026],'gurgaon':[28.459,77.026],
//       'bhubaneswar':[20.296,85.825],'warangal':[17.978,79.598],'kolhapur':[16.706,74.243],
//       'thiruvananthapuram':[8.524,76.936],'trivandrum':[8.524,76.936],
//       'bikaner':[28.022,73.312],'jamshedpur':[22.802,86.183],'cuttack':[20.462,85.879],
//       'ajmer':[26.449,74.638],'hubli':[15.365,75.124],'dharwad':[15.458,75.008],
//       'salem':[11.664,78.146],'tiruppur':[11.108,77.341],'jalandhar':[31.326,75.576],
//       'kota':[25.182,75.866],'bareilly':[28.347,79.420],'aligarh':[27.882,78.082],
//       'moradabad':[28.839,78.776],'saharanpur':[29.968,77.546],'guntur':[16.300,80.437],
//       'solapur':[17.687,75.904],'nanded':[19.160,77.314],'durgapur':[23.480,87.320],
//       'asansol':[23.673,86.952],'bellary':[15.139,76.922],'bijapur':[16.828,75.715],
//     };
//     const cityMarkers = [];
//     const renderCityMarkers = () => {
//       cityMarkers.forEach(m => { try{ map.removeLayer(m); }catch(e){} });
//       cityMarkers.length = 0;
//       if(map.getZoom() < 6) return;
//       cityData.forEach(city => {
//         const coords = CITY_COORDS[city.name.toLowerCase().trim()];
//         if(!coords) return;
//         const radius = Math.max(5, Math.min(18, Math.sqrt(city.total)));
//         const m = L.circleMarker(coords, {
//           radius, fillColor:'#fbbf24', color:'#0e0e20',
//           weight:1.5, fillOpacity:0.9, pane:'labelsPane',
//         });
//         m.bindTooltip(
//           '<div style="font-family:system-ui;background:#0e0e20;border:1px solid #fbbf24;border-radius:7px;padding:8px 11px;min-width:120px">' +
//           '<div style="font-size:11px;font-weight:700;color:#fbbf24;margin-bottom:3px">' + city.name + '</div>' +
//           '<div style="font-size:13px;font-weight:700;color:#34d399">' + city.total + ' units</div>' +
//           '<div style="font-size:10px;color:#55546a">' + city.dealers.length + ' dealers</div>' +
//           (city.dealers.length>0 ? '<div style="font-size:9px;color:#55546a;margin-top:3px">' + city.dealers.slice(0,2).map(d=>d.name).join(' · ') + (city.dealers.length>2?' +'+(city.dealers.length-2):'') + '</div>' : '') +
//           '</div>',
//           { sticky:true, opacity:1 }
//         );
//         m.addTo(map);
//         cityMarkers.push(m);
//       });
//     };
//     map.on('zoomend', renderCityMarkers);
//     renderCityMarkers();

//     // Add permanent text labels on each state
//     geoRef.current.features.forEach(feature => {
//       const name = getFeatureStateName(feature);
//       const key  = name?.toLowerCase();
//       const d    = key?stateData[key]:null;
//       const val  = key?getVal(key):0;

//       try {
//         // Compute centroid from bounding box
//         const layer = L.geoJSON(feature);
//         const bounds = layer.getBounds();
//         const center = bounds.getCenter();

//         const sn    = shortName(name||'?');
//         const valStr = val > 0 ? String(val) : '';

//         const label = L.tooltip({
//           permanent: true,
//           direction: 'center',
//           className: 'state-label',
//           interactive: false,
//           opacity: 1,
//         })
//         .setContent('<div class="state-label-inner">' + sn + (valStr ? '<span class="lbl-val">' + valStr + '</span>' : '') + '</div>')
//         .setLatLng(center);

//         label.addTo(map);
//         labelsRef.current.push(label);
//       } catch(e) {}
//     });

//   }, [leafletReady, geoReady, stateData, viewMode, maxVal, selected]);

//   return (
//     <div className="fade" style={{padding:0}}>
//       <div style={{marginBottom:10}}>
//         <div style={{fontSize:10,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:2}}>Geography · {MO[selectedMonthIdx]}</div>
//         <div style={{fontSize:18,fontWeight:700}}>India Sales Map</div>
//       </div>

//       <div style={{background:'#0c0c1e',borderRadius:12,border:'1px solid #1e1e38',overflow:'hidden',marginBottom:10}}>
//         <div style={{padding:'8px 10px',background:'#0e0e20',borderBottom:'1px solid #1e1e38',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
//           <MapPin size={12} color="#6366f1"/>
//           <span style={{fontSize:12,fontWeight:600,color:'#e2e0f0'}}>India</span>
//           <span style={{fontSize:10,color:'#55546a'}}>hover=details · click=select · zoom 6+ for cities</span>
//           <div style={{flex:1}}/>
//           <div style={{display:'flex',background:'#141430',border:'1px solid #252548',borderRadius:6,overflow:'hidden'}}>
//             {[['sales','Sales'],['dealers','Dealers'],['achievement','Ach%']].map(([m,l])=>(
//               <button key={m} onClick={()=>setViewMode(m)} style={{background:viewMode===m?'#6366f1':'transparent',color:viewMode===m?'#fff':'#55546a',border:'none',padding:'4px 8px',fontSize:11,fontWeight:600,cursor:'pointer',borderLeft:m!=='sales'?'1px solid #252548':'none'}}>{l}</button>
//             ))}
//           </div>
//           {selected&&<button onClick={()=>setSelected(null)} style={{background:'none',border:'1px solid #252548',borderRadius:6,color:'#f87171',fontSize:11,padding:'4px 8px',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><X size={10}/>Clear</button>}
//         </div>

//         <div style={{position:'relative'}}>
//           <div ref={mapRef} style={{height:'clamp(260px,58vw,520px)',width:'100%'}}/>
//           {(!leafletReady||!geoReady)&&(
//             <div style={{position:'absolute',inset:0,background:'#0c0c1e',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
//               <div style={{width:28,height:28,border:'3px solid #1e1e38',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
//               <div style={{fontSize:12,color:'#55546a'}}>Loading map...</div>
//             </div>
//           )}
//           <div style={{position:'absolute',bottom:10,left:8,background:'rgba(12,12,30,0.95)',borderRadius:7,padding:'5px 8px',border:'1px solid #1e1e38',zIndex:1000}}>
//             <div style={{fontSize:7,color:'#55546a',marginBottom:3,textTransform:'uppercase'}}>{viewMode}</div>
//             <div style={{display:'flex',gap:2}}>
//               {[['#1e2050','None'],['#a5b4fc','Low'],['#6366f1','Mid'],['#3730a3','Top'],['#fbbf24','Sel']].map(([c,l])=>(
//                 <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
//                   <div style={{width:14,height:8,borderRadius:2,background:c,border:'1px solid #ffffff12'}}/>
//                   <span style={{fontSize:6,color:'#55546a'}}>{l}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//           {leafletReady&&geoReady&&Object.keys(stateData).length===0&&(
//             <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none',zIndex:1000}}>
//               <MapPin size={28} style={{margin:'0 auto 8px',opacity:.15,color:'#6366f1'}}/>
//               <div style={{fontSize:12,color:'#55546a',background:'rgba(12,12,30,0.9)',padding:'6px 12px',borderRadius:7}}>Add "State" column to your sheet</div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
//         {selected&&det?(
//           <div className="card" style={{padding:0,overflow:'hidden'}}>
//             <div style={{padding:'10px 12px',background:'rgba(251,191,36,0.08)',borderBottom:'1px solid rgba(251,191,36,0.2)',display:'flex',alignItems:'center',gap:8}}>
//               <div style={{width:7,height:7,borderRadius:'50%',background:'#fbbf24',flexShrink:0}}/>
//               <span style={{fontSize:13,fontWeight:700,color:'#fbbf24',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selected}</span>
//               <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#55546a',cursor:'pointer'}}><X size={13}/></button>
//             </div>
//             <div style={{padding:12}}>
//               <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
//                 {[{l:'Sales',v:det.total,c:'#34d399'},{l:'Dealers',v:det.dealers.length,c:'#6366f1'},{l:'Target',v:det.target||'—',c:'var(--t2)'},{l:'Ach%',v:det.target?pct(det.target,det.total)+'%':'N/T',c:pclr(det.target?pct(det.target,det.total):null)}].map(k=>(
//                   <div key={k.l} style={{background:'var(--bg2)',borderRadius:7,padding:'7px 8px'}}>
//                     <div style={{fontSize:8,color:'var(--t3)',textTransform:'uppercase',marginBottom:2}}>{k.l}</div>
//                     <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
//                   </div>
//                 ))}
//               </div>
//               {Object.keys(det.bySM).length>0&&(
//                 <div style={{marginBottom:12}}>
//                   <div style={{fontSize:10,color:'var(--t3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>By Salesman</div>
//                   {Object.entries(det.bySM).sort((a,b)=>b[1].u-a[1].u).map(([smId,sm])=>{
//                     const user=users[smId]; const bar=det.total?Math.round((sm.u/det.total)*100):0;
//                     return(<div key={smId} style={{marginBottom:7}}>
//                       <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
//                         {user&&<div style={{width:18,height:18,borderRadius:'50%',background:user.color+'22',color:user.color,border:`1px solid ${user.color}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,flexShrink:0}}>{user.ini}</div>}
//                         <span style={{fontSize:11,color:'var(--t2)',flex:1}}>{user?.name||smId}</span>
//                         <span style={{fontSize:12,fontWeight:700,color:user?.color||'#6366f1'}}>{sm.u}</span>
//                       </div>
//                       <div style={{height:3,background:'var(--b1)',borderRadius:2}}><div style={{height:'100%',width:bar+'%',background:user?.color||'#6366f1',borderRadius:2}}/></div>
//                     </div>);
//                   })}
//                 </div>
//               )}
//               <div style={{fontSize:10,color:'var(--t3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Dealers ({det.dealers.length})</div>
//               <div style={{maxHeight:180,overflowY:'auto'}}>
//                 {[...det.dealers].sort((a,b)=>(b.months?.[selectedMonthIdx]||0)-(a.months?.[selectedMonthIdx]||0)).map(d=>{
//                   const ach=d.months?.[selectedMonthIdx]||0; const tgt=(d.monthTargets?.[selectedMonthIdx]??d.target)||0; const dp=pct(tgt,ach);
//                   return(<div key={d.id} onClick={()=>onOpenDealer?.(d.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 2px',borderBottom:'1px solid var(--b1)',cursor:'pointer',borderRadius:4,transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
//                     <div style={{flex:1,minWidth:0}}>
//                       <div style={{fontSize:11,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
//                       <div style={{display:'flex',gap:4,marginTop:2,flexWrap:'wrap'}}>
//                         {d.city&&<span style={{fontSize:9,color:'var(--t3)'}}>{d.city}</span>}
//                         {d.category&&<span style={{fontSize:9,color:'#818cf8',background:'rgba(129,140,248,0.1)',padding:'0 4px',borderRadius:3}}>{d.category}</span>}
//                         {d.categoryType&&<span style={{fontSize:9,color:'#a5b4fc'}}> / {d.categoryType}</span>}
//                       </div>
//                     </div>
//                     <div style={{textAlign:'right',flexShrink:0}}>
//                       <div style={{fontSize:12,fontWeight:700,color:'#34d399'}}>{ach}</div>
//                       <div style={{fontSize:10,color:pclr(dp)}}>{spct(tgt,ach)}</div>
//                     </div>
//                     <ChevronRight size={11} color="var(--t3)"/>
//                   </div>);
//                 })}
//               </div>
//             </div>
//           </div>
//         ):(
//           <div className="card" style={{padding:0,overflow:'hidden'}}>
//             <div style={{padding:'10px 12px',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:6}}>
//               <Award size={13} color="#fbbf24"/>
//               <span style={{fontSize:13,fontWeight:700,color:'var(--t2)'}}>Top States</span>
//               <span style={{fontSize:11,color:'var(--t3)',marginLeft:2}}>— {MO[selectedMonthIdx]}</span>
//             </div>
//             <div style={{padding:'4px 0',maxHeight:300,overflowY:'auto'}}>
//               {topStates.length===0?<div style={{padding:'16px',color:'var(--t3)',fontSize:12,textAlign:'center'}}>No state data</div>
//               :topStates.map(({name,total,dealers:dl},i)=>{
//                 const bar=Math.round((total/(topStates[0]?.total||1))*100);
//                 return(<div key={name} onClick={()=>setSelected(s=>s===name?null:name)} style={{padding:'7px 12px',cursor:'pointer',background:selected===name?'rgba(99,102,241,0.08)':'transparent',borderLeft:`3px solid ${selected===name?'#6366f1':'transparent'}`,transition:'all .15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background=selected===name?'rgba(99,102,241,0.08)':'transparent'}>
//                   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
//                     <div style={{display:'flex',alignItems:'center',gap:6}}>
//                       <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right'}}>{i+1}</span>
//                       <span style={{fontSize:12,fontWeight:600,color:selected===name?'var(--acc)':'var(--t1)'}}>{name}</span>
//                     </div>
//                     <div style={{display:'flex',gap:8,alignItems:'center'}}>
//                       <span style={{fontSize:10,color:'var(--t3)'}}>{dl.length}d</span>
//                       <span style={{fontSize:13,fontWeight:700,color:'#34d399'}}>{total}</span>
//                     </div>
//                   </div>
//                   <div style={{height:3,background:'var(--b1)',borderRadius:2,marginLeft:20}}>
//                     <div style={{height:'100%',width:bar+'%',background:'linear-gradient(90deg,#6366f1,#a5b4fc)',borderRadius:2,transition:'width .5s'}}/>
//                   </div>
//                 </div>);
//               })}
//             </div>
//           </div>
//         )}

//         <div className="card">
//           <div style={{fontSize:10,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Summary</div>
//           {[
//             {l:'States covered',v:Object.keys(stateData).length,c:'#6366f1'},
//             {l:'Total sales',v:Object.values(stateData).reduce((s,d)=>s+d.total,0),c:'#34d399'},
//             {l:'Mapped dealers',v:dealers.length-unmapped,c:'var(--t2)'},
//             {l:'Unmapped',v:unmapped,c:unmapped>0?'#fbbf24':'var(--t3)'},
//           ].map(k=>(
//             <div key={k.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
//               <span style={{color:'var(--t3)'}}>{k.l}</span>
//               <span style={{fontWeight:700,color:k.c}}>{k.v}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }


// import React, { useState, useMemo, useEffect, useRef } from 'react';
// import { X, MapPin, Award, ChevronRight } from 'lucide-react';
// import { MO } from '../constants';
// import { pct, spct, pclr } from '../utils';
// import { useMonth } from '../context';

// const STATE_ALIASES = {
//   'j&k':'Jammu and Kashmir','jammu and kashmir':'Jammu and Kashmir','jammu':'Jammu and Kashmir','kashmir':'Jammu and Kashmir','ladakh':'Ladakh',
//   'hp':'Himachal Pradesh','himachal':'Himachal Pradesh',
//   'up':'Uttar Pradesh','u.p.':'Uttar Pradesh',
//   'mp':'Madhya Pradesh','m.p.':'Madhya Pradesh',
//   'ap':'Andhra Pradesh','andhra':'Andhra Pradesh',
//   'tn':'Tamil Nadu','tamilnadu':'Tamil Nadu','tamil':'Tamil Nadu','tamil nadu':'Tamil Nadu',
//   'wb':'West Bengal','bengal':'West Bengal','west bengal':'West Bengal',
//   'uk':'Uttarakhand','uttaranchal':'Uttarakhand','uttarakhand':'Uttarakhand',
//   'orissa':'Odisha','odisha':'Odisha',
//   'cg':'Chhattisgarh','chattisgarh':'Chhattisgarh','chhattisgarh':'Chhattisgarh',
//   'ts':'Telangana','telangana':'Telangana',
//   'karnataka':'Karnataka','karnatka':'Karnataka',
//   'maharashtra':'Maharashtra',
//   'gujarat':'Gujarat','gj':'Gujarat',
//   'rajasthan':'Rajasthan','raj':'Rajasthan',
//   'punjab':'Punjab','pb':'Punjab',
//   'haryana':'Haryana','hr':'Haryana',
//   'delhi':'Delhi','new delhi':'Delhi','ncr':'Delhi','nd':'Delhi','nct of delhi':'Delhi',
//   'goa':'Goa',
//   'kerala':'Kerala','kl':'Kerala',
//   'assam':'Assam','bihar':'Bihar','br':'Bihar',
//   'jharkhand':'Jharkhand','jh':'Jharkhand',
//   'sikkim':'Sikkim','nagaland':'Nagaland','manipur':'Manipur','mizoram':'Mizoram','tripura':'Tripura','meghalaya':'Meghalaya',
//   'arunachal':'Arunachal Pradesh','arunachal pradesh':'Arunachal Pradesh',
//   'puducherry':'Puducherry','pondicherry':'Puducherry',
//   'andaman':'Andaman and Nicobar Islands','andaman and nicobar':'Andaman and Nicobar Islands','andaman and nicobar islands':'Andaman and Nicobar Islands',
//   'lakshadweep':'Lakshadweep','chandigarh':'Chandigarh',
//   'dadra and nagar haveli':'Dadra and Nagar Haveli and Daman and Diu','daman and diu':'Dadra and Nagar Haveli and Daman and Diu',
// };

// const normalizeState = s => {
//   if(!s) return null;
//   const l = String(s).toLowerCase().trim();
//   return STATE_ALIASES[l] || String(s).trim();
// };

// const getColor = ratio => {
//   if(!ratio||ratio===0) return '#1e2050';
//   if(ratio>0.8) return '#3730a3';
//   if(ratio>0.6) return '#4f46e5';
//   if(ratio>0.4) return '#6366f1';
//   if(ratio>0.2) return '#818cf8';
//   return '#a5b4fc';
// };

// const getFeatureStateName = feature => {
//   const p = feature?.properties||{};
//   const raw = p.ST_NM||p.st_nm||p.NAME_1||p.name||p.NAME||p.state||p.State||p.STATE||p.DISTRICT;
//   return normalizeState(raw);
// };

// // Short name for label display
// const shortName = name => {
//   if(!name) return '';
//   const shorts = {
//     'Jammu and Kashmir':'J & K',
//     'Himachal Pradesh':'H.P.',
//     'Uttar Pradesh':'U.P.',
//     'Madhya Pradesh':'M.P.',
//     'Andhra Pradesh':'A.P.',
//     'Tamil Nadu':'T.N.',
//     'West Bengal':'W.B.',
//     'Uttarakhand':'Uttrknd',
//     'Chhattisgarh':'C.G.',
//     'Arunachal Pradesh':'Arunachal',
//     'Andaman and Nicobar Islands':'A&N',
//     'Dadra and Nagar Haveli and Daman and Diu':'D&NH',
//     'Telangana':'T.S.',
//     'Karnataka':'Krtk',
//     'Maharashtra':'Maha',
//     'Rajasthan':'Raj.',
//   };
//   return shorts[name] || name;
// };

// // Label CSS injected once
// const LABEL_CSS = `
//   .state-label {
//     background: transparent !important;
//     border: none !important;
//     box-shadow: none !important;
//     font-family: Inter, system-ui, sans-serif;
//     pointer-events: none;
//     transition: opacity 0.3s;
//   }
//   .state-label-inner {
//     color: rgba(255,255,255,0.9);
//     font-size: 9px;
//     font-weight: 700;
//     text-align: center;
//     line-height: 1.3;
//     text-shadow: 0 1px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.9);
//     white-space: nowrap;
//     pointer-events: none;
//   }
//   .state-label-inner .lbl-val {
//     color: #fbbf24;
//     font-size: 8px;
//     font-weight: 700;
//     display: block;
//     text-shadow: 0 1px 4px rgba(0,0,0,1);
//   }
//   .leaflet-tooltip.state-label::before { display:none; }
//   /* Hide our custom state labels when zoomed in (city labels take over) */
//   .leaflet-zoom-level-7 .state-label,
//   .leaflet-zoom-level-8 .state-label,
//   .leaflet-zoom-level-9 .state-label,
//   .leaflet-zoom-level-10 .state-label { opacity: 0.3; }
//   /* Leaflet label layer tooltip */
//   .leaflet-tooltip-custom {
//     background: transparent !important;
//     border: none !important;
//     box-shadow: none !important;
//     padding: 0 !important;
//   }
//   .leaflet-tooltip-custom::before { display: none !important; }
// `;

// export default function IndiaMap({ dealers=[], users={}, onOpenDealer }) {
//   const { selectedMonthIdx } = useMonth();
//   const mapRef    = useRef(null);
//   const mapObjRef = useRef(null);
//   const layerRef  = useRef(null);
//   const labelsRef = useRef([]);
//   const geoRef    = useRef(null);

//   const [selected, setSelected] = useState(null);
//   const [viewMode, setViewMode] = useState('sales');
//   const [leafletReady, setLeafletReady] = useState(false);
//   const [geoReady, setGeoReady]         = useState(false);

//   const stateData = useMemo(() => {
//     const map = {};
//     dealers.forEach(d => {
//       const norm = normalizeState(d.state);
//       if(!norm) return;
//       const key = norm.toLowerCase();
//       if(!map[key]) map[key]={ name:norm, dealers:[], total:0, target:0, bySM:{} };
//       const ach = Number(d.months?.[selectedMonthIdx]||0);
//       const tgt = Number((d.monthTargets?.[selectedMonthIdx]??d.target)||0);
//       map[key].dealers.push(d);
//       map[key].total  += ach;
//       map[key].target += tgt;
//       const smKey = d.salesman||'Unassigned';
//       if(!map[key].bySM[smKey]) map[key].bySM[smKey]={u:0,n:0};
//       map[key].bySM[smKey].u += ach;
//       map[key].bySM[smKey].n += 1;
//     });
//     return map;
//   }, [dealers, selectedMonthIdx]);

//   const maxVal = useMemo(() => {
//     const vals = Object.values(stateData).map(d => {
//       if(viewMode==='dealers') return d.dealers.length;
//       if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
//       return d.total;
//     });
//     return Math.max(...vals,1);
//   }, [stateData, viewMode]);

//   const topStates = useMemo(() => Object.values(stateData).sort((a,b)=>b.total-a.total).slice(0,12), [stateData]);
//   const unmapped  = useMemo(() => dealers.filter(d=>!d.state?.trim()).length, [dealers]);
//   const cityData  = useMemo(() => {
//     const map = {};
//     dealers.forEach(d => {
//       if(!d.city?.trim()) return;
//       const key = d.city.trim().toLowerCase();
//       if(!map[key]) map[key] = { name:d.city.trim(), dealers:[], total:0 };
//       map[key].dealers.push(d);
//       map[key].total += Number(d.months?.[selectedMonthIdx]||0);
//     });
//     return Object.values(map).filter(cx=>cx.total>0).sort((a,b)=>b.total-a.total);
//   }, [dealers, selectedMonthIdx]);
//   const det = selected ? stateData[selected.toLowerCase()] : null;

//   // Load Leaflet
//   useEffect(() => {
//     if(!document.getElementById('leaflet-css')){
//       const link=document.createElement('link');
//       link.id='leaflet-css'; link.rel='stylesheet';
//       link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
//       document.head.appendChild(link);
//     }
//     if(!document.getElementById('india-map-label-css')){
//       const s=document.createElement('style');
//       s.id='india-map-label-css'; s.textContent=LABEL_CSS;
//       document.head.appendChild(s);
//     }
//     if(window.L){ setLeafletReady(true); return; }
//     let script=document.getElementById('leaflet-js');
//     if(!script){ script=document.createElement('script'); script.id='leaflet-js'; script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async=true; document.head.appendChild(script); }
//     const onLoad=()=>setLeafletReady(true);
//     script.addEventListener('load',onLoad);
//     return()=>script.removeEventListener('load',onLoad);
//   }, []);

//   // Load GeoJSON
//   useEffect(() => {
//     if(geoRef.current){ setGeoReady(true); return; }
//     fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson')
//       .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
//       .catch(()=>{
//         fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
//           .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
//           .catch(e=>console.error('GeoJSON failed:',e));
//       });
//   }, []);

//   // Init map
//   useEffect(() => {
//     if(!leafletReady||!geoReady||!mapRef.current) return;
//     if(mapObjRef.current) return;
//     const L=window.L;
//     const map=L.map(mapRef.current,{ center:[22,80], zoom:4, zoomControl:true, scrollWheelZoom:true, attributionControl:false, minZoom:3, maxZoom:14 });
//     // Create a pane above overlayPane for city labels
//     map.createPane('labelsPane');
//     map.getPane('labelsPane').style.zIndex = 650;
//     map.getPane('labelsPane').style.pointerEvents = 'none';
//     mapObjRef.current=map;
//     // Base dark tile (no labels) - states colored on top
//     L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{
//       attribution:'© CartoDB', subdomains:'abcd', maxZoom:19, zIndex:1
//     }).addTo(map);

//     // Label tile layer on TOP of states - cities/areas appear on zoom
//     // This layer sits above the GeoJSON so city names are always visible
//     L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',{
//       attribution:'© CartoDB', subdomains:'abcd', maxZoom:19,
//       zIndex:10, // above GeoJSON layer
//       pane:'labelsPane',
//     }).addTo(map);
//     setTimeout(()=>map.invalidateSize(),100);
//     return()=>{ map.remove(); mapObjRef.current=null; layerRef.current=null; };
//   }, [leafletReady, geoReady]);

//   // Render GeoJSON + labels
//   useEffect(() => {
//     if(!leafletReady||!geoReady||!mapObjRef.current||!geoRef.current) return;
//     const L=window.L, map=mapObjRef.current;

//     // Remove old layer and labels
//     if(layerRef.current){ layerRef.current.remove(); layerRef.current=null; }
//     labelsRef.current.forEach(l=>l.remove());
//     labelsRef.current=[];

//     const getVal = key => {
//       const d=stateData[key]; if(!d) return 0;
//       if(viewMode==='dealers') return d.dealers.length;
//       if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
//       return d.total;
//     };

//     const geoLayer = L.geoJSON(geoRef.current, {
//       style: feature => {
//         const name=getFeatureStateName(feature);
//         const key=name?.toLowerCase();
//         const value=key?getVal(key):0;
//         const ratio=maxVal?value/maxVal:0;
//         const isSel=selected&&name&&selected.toLowerCase()===name.toLowerCase();
//         return { color:isSel?'#fbbf24':'#252548', weight:isSel?2.2:1, fillColor:isSel?'#fbbf24':getColor(ratio), fillOpacity:isSel?0.78:0.65, opacity:1 };
//       },
//       onEachFeature: (feature, layer) => {
//         const name=getFeatureStateName(feature);
//         const key=name?.toLowerCase();
//         const d=key?stateData[key]:null;
//         const sales=d?.total||0;
//         const dealerCount=d?.dealers?.length||0;
//         const target=d?.target||0;
//         const achPct=target?Math.round((sales/target)*100):0;

//         // Hover tooltip (rich)
//         layer.bindTooltip(
//           '<div style="font-family:system-ui;background:#0e0e20;border:1px solid #6366f1;border-radius:8px;padding:9px 12px;min-width:140px">' +
//           '<div style="font-size:12px;font-weight:700;color:#e2e0f0;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #252548">' + (d?.name||name||'') + '</div>' +
//           '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Sales</span><span style="color:#34d399;font-weight:700">' + sales + '</span></div>' +
//           '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Dealers</span><span style="color:#818cf8;font-weight:700">' + dealerCount + '</span></div>' +
//           (target ? '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px"><span>Ach%</span><span style="font-weight:700">' + achPct + '%</span></div>' : '') +
//           (d && dealerCount > 0 ? '<div style="font-size:9px;color:#55546a;margin-top:5px;padding-top:4px;border-top:1px solid #252548">' + d.dealers.slice(0,2).map(dd=>dd.name).join(' · ') + (dealerCount > 2 ? ' +' + (dealerCount-2) : '') + '</div>' : '') +
//           '</div>',
//           { sticky:true, opacity:1, className:'leaflet-tooltip-custom' });

//         layer.on({
//           mouseover: e => { e.target.setStyle({weight:2,color:'#fbbf24',fillOpacity:0.85}); if(!L.Browser.ie&&!L.Browser.opera&&!L.Browser.edge) e.target.bringToFront(); },
//           mouseout:  e => { if(layerRef.current) layerRef.current.resetStyle(e.target); },
//           click: e => {
//             if(d?.name||name) setSelected(d?.name||name);
//             try{ map.fitBounds(e.target.getBounds(),{padding:[20,20],maxZoom:6}); }catch{}
//           },
//         });
//       },
//     }).addTo(map);

//     layerRef.current = geoLayer;

//     // City dot markers - appear at zoom 6+
//     const CITY_COORDS = {
//       'mumbai':[19.076,72.877],'delhi':[28.679,77.213],'bangalore':[12.972,77.594],
//       'bengaluru':[12.972,77.594],'hyderabad':[17.385,78.487],'chennai':[13.083,80.270],
//       'kolkata':[22.563,88.363],'pune':[18.520,73.856],'ahmedabad':[23.023,72.572],
//       'surat':[21.170,72.831],'jaipur':[26.912,75.787],'lucknow':[26.847,80.947],
//       'kanpur':[26.449,80.331],'nagpur':[21.146,79.089],'indore':[22.719,75.857],
//       'bhopal':[23.259,77.413],'visakhapatnam':[17.686,83.218],'patna':[25.594,85.138],
//       'vadodara':[22.307,73.181],'ludhiana':[30.901,75.857],'agra':[27.176,78.008],
//       'nashik':[19.990,73.791],'faridabad':[28.408,77.317],'meerut':[28.984,77.706],
//       'rajkot':[22.303,70.802],'varanasi':[25.318,83.004],'aurangabad':[19.877,75.324],
//       'amritsar':[31.634,74.873],'allahabad':[25.435,81.846],'ranchi':[23.344,85.310],
//       'coimbatore':[11.017,76.955],'gwalior':[26.228,78.182],'vijayawada':[16.506,80.648],
//       'jodhpur':[26.295,73.017],'madurai':[9.925,78.120],'raipur':[21.251,81.633],
//       'chandigarh':[30.733,76.779],'guwahati':[26.144,91.736],'mysore':[12.295,76.639],
//       'mysuru':[12.295,76.639],'kochi':[9.931,76.267],'dehradun':[30.316,78.032],
//       'noida':[28.535,77.391],'gurugram':[28.459,77.026],'gurgaon':[28.459,77.026],
//       'bhubaneswar':[20.296,85.825],'warangal':[17.978,79.598],'kolhapur':[16.706,74.243],
//       'thiruvananthapuram':[8.524,76.936],'trivandrum':[8.524,76.936],
//       'bikaner':[28.022,73.312],'jamshedpur':[22.802,86.183],'cuttack':[20.462,85.879],
//       'ajmer':[26.449,74.638],'hubli':[15.365,75.124],'dharwad':[15.458,75.008],
//       'salem':[11.664,78.146],'tiruppur':[11.108,77.341],'jalandhar':[31.326,75.576],
//       'kota':[25.182,75.866],'bareilly':[28.347,79.420],'aligarh':[27.882,78.082],
//       'moradabad':[28.839,78.776],'saharanpur':[29.968,77.546],'guntur':[16.300,80.437],
//       'solapur':[17.687,75.904],'nanded':[19.160,77.314],'durgapur':[23.480,87.320],
//       'asansol':[23.673,86.952],'bellary':[15.139,76.922],'bijapur':[16.828,75.715],
//     };
//     const cityMarkers = [];
//     const renderCityMarkers = () => {
//       cityMarkers.forEach(m => { try{ map.removeLayer(m); }catch(e){} });
//       cityMarkers.length = 0;
//       if(map.getZoom() < 6) return;
//       cityData.forEach(city => {
//         const coords = CITY_COORDS[city.name.toLowerCase().trim()];
//         if(!coords) return;
//         const radius = Math.max(5, Math.min(18, Math.sqrt(city.total)));
//         const m = L.circleMarker(coords, {
//           radius, fillColor:'#fbbf24', color:'#0e0e20',
//           weight:1.5, fillOpacity:0.9, pane:'labelsPane',
//         });
//         m.bindTooltip(
//           '<div style="font-family:system-ui;background:#0e0e20;border:1px solid #fbbf24;border-radius:7px;padding:8px 11px;min-width:120px">' +
//           '<div style="font-size:11px;font-weight:700;color:#fbbf24;margin-bottom:3px">' + city.name + '</div>' +
//           '<div style="font-size:13px;font-weight:700;color:#34d399">' + city.total + ' units</div>' +
//           '<div style="font-size:10px;color:#55546a">' + city.dealers.length + ' dealers</div>' +
//           (city.dealers.length>0 ? '<div style="font-size:9px;color:#55546a;margin-top:3px">' + city.dealers.slice(0,2).map(d=>d.name).join(' · ') + (city.dealers.length>2?' +'+(city.dealers.length-2):'') + '</div>' : '') +
//           '</div>',
//           { sticky:true, opacity:1 }
//         );
//         m.addTo(map);
//         cityMarkers.push(m);
//       });
//     };
//     map.on('zoomend', renderCityMarkers);
//     renderCityMarkers();

//     // Add permanent text labels on each state
//     geoRef.current.features.forEach(feature => {
//       const name = getFeatureStateName(feature);
//       const key  = name?.toLowerCase();
//       const d    = key?stateData[key]:null;
//       const val  = key?getVal(key):0;

//       try {
//         // Compute centroid from bounding box
//         const layer = L.geoJSON(feature);
//         const bounds = layer.getBounds();
//         const center = bounds.getCenter();

//         const sn    = shortName(name||'?');
//         const valStr = val > 0 ? String(val) : '';

//         const label = L.tooltip({
//           permanent: true,
//           direction: 'center',
//           className: 'state-label',
//           interactive: false,
//           opacity: 1,
//         })
//         .setContent('<div class="state-label-inner">' + sn + (valStr ? '<span class="lbl-val">' + valStr + '</span>' : '') + '</div>')
//         .setLatLng(center);

//         label.addTo(map);
//         labelsRef.current.push(label);
//       } catch(e) {}
//     });

//   }, [leafletReady, geoReady, stateData, viewMode, maxVal, selected]);

//   return (
//     <div className="fade" style={{padding:0}}>
//       <div style={{marginBottom:10}}>
//         <div style={{fontSize:10,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:2}}>Geography · {MO[selectedMonthIdx]}</div>
//         <div style={{fontSize:18,fontWeight:700}}>India Sales Map</div>
//       </div>

//       <div style={{background:'#0c0c1e',borderRadius:12,border:'1px solid #1e1e38',overflow:'hidden',marginBottom:10}}>
//         <div style={{padding:'8px 10px',background:'#0e0e20',borderBottom:'1px solid #1e1e38',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
//           <MapPin size={12} color="#6366f1"/>
//           <span style={{fontSize:12,fontWeight:600,color:'#e2e0f0'}}>India</span>
//           <span style={{fontSize:10,color:'#55546a'}}>hover=details · click=select · zoom 6+ for cities</span>
//           <div style={{flex:1}}/>
//           <div style={{display:'flex',background:'#141430',border:'1px solid #252548',borderRadius:6,overflow:'hidden'}}>
//             {[['sales','Sales'],['dealers','Dealers'],['achievement','Ach%']].map(([m,l])=>(
//               <button key={m} onClick={()=>setViewMode(m)} style={{background:viewMode===m?'#6366f1':'transparent',color:viewMode===m?'#fff':'#55546a',border:'none',padding:'4px 8px',fontSize:11,fontWeight:600,cursor:'pointer',borderLeft:m!=='sales'?'1px solid #252548':'none'}}>{l}</button>
//             ))}
//           </div>
//           {selected&&<button onClick={()=>setSelected(null)} style={{background:'none',border:'1px solid #252548',borderRadius:6,color:'#f87171',fontSize:11,padding:'4px 8px',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><X size={10}/>Clear</button>}
//         </div>

//         <div style={{position:'relative'}}>
//           <div ref={mapRef} style={{height:'clamp(260px,58vw,520px)',width:'100%'}}/>
//           {(!leafletReady||!geoReady)&&(
//             <div style={{position:'absolute',inset:0,background:'#0c0c1e',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
//               <div style={{width:28,height:28,border:'3px solid #1e1e38',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
//               <div style={{fontSize:12,color:'#55546a'}}>Loading map...</div>
//             </div>
//           )}
//           <div style={{position:'absolute',bottom:10,left:8,background:'rgba(12,12,30,0.95)',borderRadius:7,padding:'5px 8px',border:'1px solid #1e1e38',zIndex:1000}}>
//             <div style={{fontSize:7,color:'#55546a',marginBottom:3,textTransform:'uppercase'}}>{viewMode}</div>
//             <div style={{display:'flex',gap:2}}>
//               {[['#1e2050','None'],['#a5b4fc','Low'],['#6366f1','Mid'],['#3730a3','Top'],['#fbbf24','Sel']].map(([c,l])=>(
//                 <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
//                   <div style={{width:14,height:8,borderRadius:2,background:c,border:'1px solid #ffffff12'}}/>
//                   <span style={{fontSize:6,color:'#55546a'}}>{l}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//           {leafletReady&&geoReady&&Object.keys(stateData).length===0&&(
//             <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none',zIndex:1000}}>
//               <MapPin size={28} style={{margin:'0 auto 8px',opacity:.15,color:'#6366f1'}}/>
//               <div style={{fontSize:12,color:'#55546a',background:'rgba(12,12,30,0.9)',padding:'6px 12px',borderRadius:7}}>Add "State" column to your sheet</div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
//         {selected&&det?(
//           <div className="card" style={{padding:0,overflow:'hidden'}}>
//             <div style={{padding:'10px 12px',background:'rgba(251,191,36,0.08)',borderBottom:'1px solid rgba(251,191,36,0.2)',display:'flex',alignItems:'center',gap:8}}>
//               <div style={{width:7,height:7,borderRadius:'50%',background:'#fbbf24',flexShrink:0}}/>
//               <span style={{fontSize:13,fontWeight:700,color:'#fbbf24',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selected}</span>
//               <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#55546a',cursor:'pointer'}}><X size={13}/></button>
//             </div>
//             <div style={{padding:12}}>
//               <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
//                 {[{l:'Sales',v:det.total,c:'#34d399'},{l:'Dealers',v:det.dealers.length,c:'#6366f1'},{l:'Target',v:det.target||'—',c:'var(--t2)'},{l:'Ach%',v:det.target?pct(det.target,det.total)+'%':'N/T',c:pclr(det.target?pct(det.target,det.total):null)}].map(k=>(
//                   <div key={k.l} style={{background:'var(--bg2)',borderRadius:7,padding:'7px 8px'}}>
//                     <div style={{fontSize:8,color:'var(--t3)',textTransform:'uppercase',marginBottom:2}}>{k.l}</div>
//                     <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
//                   </div>
//                 ))}
//               </div>
//               {Object.keys(det.bySM).length>0&&(
//                 <div style={{marginBottom:12}}>
//                   <div style={{fontSize:10,color:'var(--t3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>By Salesman</div>
//                   {Object.entries(det.bySM).sort((a,b)=>b[1].u-a[1].u).map(([smId,sm])=>{
//                     const user=users[smId]; const bar=det.total?Math.round((sm.u/det.total)*100):0;
//                     return(<div key={smId} style={{marginBottom:7}}>
//                       <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
//                         {user&&<div style={{width:18,height:18,borderRadius:'50%',background:user.color+'22',color:user.color,border:`1px solid ${user.color}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,flexShrink:0}}>{user.ini}</div>}
//                         <span style={{fontSize:11,color:'var(--t2)',flex:1}}>{user?.name||smId}</span>
//                         <span style={{fontSize:12,fontWeight:700,color:user?.color||'#6366f1'}}>{sm.u}</span>
//                       </div>
//                       <div style={{height:3,background:'var(--b1)',borderRadius:2}}><div style={{height:'100%',width:bar+'%',background:user?.color||'#6366f1',borderRadius:2}}/></div>
//                     </div>);
//                   })}
//                 </div>
//               )}
//               <div style={{fontSize:10,color:'var(--t3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Dealers ({det.dealers.length})</div>
//               <div style={{maxHeight:180,overflowY:'auto'}}>
//                 {[...det.dealers].sort((a,b)=>(b.months?.[selectedMonthIdx]||0)-(a.months?.[selectedMonthIdx]||0)).map(d=>{
//                   const ach=d.months?.[selectedMonthIdx]||0; const tgt=(d.monthTargets?.[selectedMonthIdx]??d.target)||0; const dp=pct(tgt,ach);
//                   return(<div key={d.id} onClick={()=>onOpenDealer?.(d.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 2px',borderBottom:'1px solid var(--b1)',cursor:'pointer',borderRadius:4,transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
//                     <div style={{flex:1,minWidth:0}}>
//                       <div style={{fontSize:11,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
//                       <div style={{display:'flex',gap:4,marginTop:2,flexWrap:'wrap',alignItems:'center'}}>
//                         {d.city&&<span style={{fontSize:9,color:'var(--t3)'}}>{d.city}</span>}
//                         {d.category&&<span style={{fontSize:9,color:'#818cf8',background:'rgba(129,140,248,0.12)',padding:'1px 5px',borderRadius:3}}>{d.category}</span>}
//                         {d.categoryType&&<span style={{fontSize:9,color:'#a5b4fc',background:'rgba(165,180,252,0.08)',padding:'1px 5px',borderRadius:3}}>{d.categoryType}</span>}
//                       </div>
//                     </div>
//                     <div style={{textAlign:'right',flexShrink:0}}>
//                       <div style={{fontSize:12,fontWeight:700,color:'#34d399'}}>{ach}</div>
//                       <div style={{fontSize:10,color:pclr(dp)}}>{spct(tgt,ach)}</div>
//                     </div>
//                     <ChevronRight size={11} color="var(--t3)"/>
//                   </div>);
//                 })}
//               </div>
//             </div>
//           </div>
//         ):(
//           <div className="card" style={{padding:0,overflow:'hidden'}}>
//             <div style={{padding:'10px 12px',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:6}}>
//               <Award size={13} color="#fbbf24"/>
//               <span style={{fontSize:13,fontWeight:700,color:'var(--t2)'}}>Top States</span>
//               <span style={{fontSize:11,color:'var(--t3)',marginLeft:2}}>— {MO[selectedMonthIdx]}</span>
//             </div>
//             <div style={{padding:'4px 0',maxHeight:300,overflowY:'auto'}}>
//               {topStates.length===0?<div style={{padding:'16px',color:'var(--t3)',fontSize:12,textAlign:'center'}}>No state data</div>
//               :topStates.map(({name,total,dealers:dl},i)=>{
//                 const bar=Math.round((total/(topStates[0]?.total||1))*100);
//                 return(<div key={name} onClick={()=>setSelected(s=>s===name?null:name)} style={{padding:'7px 12px',cursor:'pointer',background:selected===name?'rgba(99,102,241,0.08)':'transparent',borderLeft:`3px solid ${selected===name?'#6366f1':'transparent'}`,transition:'all .15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background=selected===name?'rgba(99,102,241,0.08)':'transparent'}>
//                   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
//                     <div style={{display:'flex',alignItems:'center',gap:6}}>
//                       <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right'}}>{i+1}</span>
//                       <span style={{fontSize:12,fontWeight:600,color:selected===name?'var(--acc)':'var(--t1)'}}>{name}</span>
//                     </div>
//                     <div style={{display:'flex',gap:8,alignItems:'center'}}>
//                       <span style={{fontSize:10,color:'var(--t3)'}}>{dl.length}d</span>
//                       <span style={{fontSize:13,fontWeight:700,color:'#34d399'}}>{total}</span>
//                     </div>
//                   </div>
//                   <div style={{height:3,background:'var(--b1)',borderRadius:2,marginLeft:20}}>
//                     <div style={{height:'100%',width:bar+'%',background:'linear-gradient(90deg,#6366f1,#a5b4fc)',borderRadius:2,transition:'width .5s'}}/>
//                   </div>
//                 </div>);
//               })}
//             </div>
//           </div>
//         )}

//         <div className="card">
//           <div style={{fontSize:10,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Summary</div>
//           {[
//             {l:'States covered',v:Object.keys(stateData).length,c:'#6366f1'},
//             {l:'Total sales',v:Object.values(stateData).reduce((s,d)=>s+d.total,0),c:'#34d399'},
//             {l:'Mapped dealers',v:dealers.length-unmapped,c:'var(--t2)'},
//             {l:'Unmapped',v:unmapped,c:unmapped>0?'#fbbf24':'var(--t3)'},
//           ].map(k=>(
//             <div key={k.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
//               <span style={{color:'var(--t3)'}}>{k.l}</span>
//               <span style={{fontWeight:700,color:k.c}}>{k.v}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }



// import React, { useState, useMemo, useEffect, useRef } from 'react';
// import { X, MapPin, Award, ChevronRight } from 'lucide-react';
// import { MO } from '../constants';
// import { pct, spct, pclr } from '../utils';
// import { useMonth } from '../context';

// const STATE_ALIASES = {
//   'j&k':'Jammu and Kashmir','jammu and kashmir':'Jammu and Kashmir','jammu':'Jammu and Kashmir','kashmir':'Jammu and Kashmir','ladakh':'Ladakh',
//   'hp':'Himachal Pradesh','himachal':'Himachal Pradesh',
//   'up':'Uttar Pradesh','u.p.':'Uttar Pradesh',
//   'mp':'Madhya Pradesh','m.p.':'Madhya Pradesh',
//   'ap':'Andhra Pradesh','andhra':'Andhra Pradesh',
//   'tn':'Tamil Nadu','tamilnadu':'Tamil Nadu','tamil':'Tamil Nadu','tamil nadu':'Tamil Nadu',
//   'wb':'West Bengal','bengal':'West Bengal','west bengal':'West Bengal',
//   'uk':'Uttarakhand','uttaranchal':'Uttarakhand','uttarakhand':'Uttarakhand',
//   'orissa':'Odisha','odisha':'Odisha',
//   'cg':'Chhattisgarh','chattisgarh':'Chhattisgarh','chhattisgarh':'Chhattisgarh',
//   'ts':'Telangana','telangana':'Telangana',
//   'karnataka':'Karnataka','karnatka':'Karnataka',
//   'maharashtra':'Maharashtra',
//   'gujarat':'Gujarat','gj':'Gujarat',
//   'rajasthan':'Rajasthan','raj':'Rajasthan',
//   'punjab':'Punjab','pb':'Punjab',
//   'haryana':'Haryana','hr':'Haryana',
//   'delhi':'Delhi','new delhi':'Delhi','ncr':'Delhi','nd':'Delhi','nct of delhi':'Delhi',
//   'goa':'Goa',
//   'kerala':'Kerala','kl':'Kerala',
//   'assam':'Assam','bihar':'Bihar','br':'Bihar',
//   'jharkhand':'Jharkhand','jh':'Jharkhand',
//   'sikkim':'Sikkim','nagaland':'Nagaland','manipur':'Manipur','mizoram':'Mizoram','tripura':'Tripura','meghalaya':'Meghalaya',
//   'arunachal':'Arunachal Pradesh','arunachal pradesh':'Arunachal Pradesh',
//   'puducherry':'Puducherry','pondicherry':'Puducherry',
//   'andaman':'Andaman and Nicobar Islands','andaman and nicobar':'Andaman and Nicobar Islands','andaman and nicobar islands':'Andaman and Nicobar Islands',
//   'lakshadweep':'Lakshadweep','chandigarh':'Chandigarh',
//   'dadra and nagar haveli':'Dadra and Nagar Haveli and Daman and Diu','daman and diu':'Dadra and Nagar Haveli and Daman and Diu',
// };

// const normalizeState = s => {
//   if(!s) return null;
//   const l = String(s).toLowerCase().trim();
//   return STATE_ALIASES[l] || String(s).trim();
// };

// const getColor = ratio => {
//   if(!ratio||ratio===0) return '#1e2050';
//   if(ratio>0.8) return '#3730a3';
//   if(ratio>0.6) return '#4f46e5';
//   if(ratio>0.4) return '#6366f1';
//   if(ratio>0.2) return '#818cf8';
//   return '#a5b4fc';
// };

// const getFeatureStateName = feature => {
//   const p = feature?.properties||{};
//   const raw = p.ST_NM||p.st_nm||p.NAME_1||p.name||p.NAME||p.state||p.State||p.STATE||p.DISTRICT;
//   return normalizeState(raw);
// };

// // Short name for label display
// const shortName = name => {
//   if(!name) return '';
//   const shorts = {
//     'Jammu and Kashmir':'J & K',
//     'Himachal Pradesh':'H.P.',
//     'Uttar Pradesh':'U.P.',
//     'Madhya Pradesh':'M.P.',
//     'Andhra Pradesh':'A.P.',
//     'Tamil Nadu':'T.N.',
//     'West Bengal':'W.B.',
//     'Uttarakhand':'Uttrknd',
//     'Chhattisgarh':'C.G.',
//     'Arunachal Pradesh':'Arunachal',
//     'Andaman and Nicobar Islands':'A&N',
//     'Dadra and Nagar Haveli and Daman and Diu':'D&NH',
//     'Telangana':'T.S.',
//     'Karnataka':'Krtk',
//     'Maharashtra':'Maha',
//     'Rajasthan':'Raj.',
//   };
//   return shorts[name] || name;
// };

// // Label CSS injected once
// const LABEL_CSS = `
//   .state-label {
//     background: transparent !important;
//     border: none !important;
//     box-shadow: none !important;
//     font-family: Inter, system-ui, sans-serif;
//     pointer-events: none;
//     transition: opacity 0.3s;
//   }
//   .state-label-inner {
//     color: rgba(255,255,255,0.9);
//     font-size: 9px;
//     font-weight: 700;
//     text-align: center;
//     line-height: 1.3;
//     text-shadow: 0 1px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.9);
//     white-space: nowrap;
//     pointer-events: none;
//   }
//   .state-label-inner .lbl-val {
//     color: #fbbf24;
//     font-size: 8px;
//     font-weight: 700;
//     display: block;
//     text-shadow: 0 1px 4px rgba(0,0,0,1);
//   }
//   .leaflet-tooltip.state-label::before { display:none; }
//   /* Hide our custom state labels when zoomed in (city labels take over) */
//   .leaflet-zoom-level-7 .state-label,
//   .leaflet-zoom-level-8 .state-label,
//   .leaflet-zoom-level-9 .state-label,
//   .leaflet-zoom-level-10 .state-label { opacity: 0.3; }
//   /* Leaflet label layer tooltip */
//   .leaflet-tooltip-custom {
//     background: transparent !important;
//     border: none !important;
//     box-shadow: none !important;
//     padding: 0 !important;
//   }
//   .leaflet-tooltip-custom::before { display: none !important; }
// `;

// export default function IndiaMap({ dealers=[], users={}, onOpenDealer }) {
//   const { selectedMonthIdx } = useMonth();
//   const mapRef    = useRef(null);
//   const mapObjRef = useRef(null);
//   const layerRef  = useRef(null);
//   const labelsRef = useRef([]);
//   const geoRef    = useRef(null);

//   const [selected, setSelected] = useState(null);
//   const [viewMode, setViewMode] = useState('sales');
//   const [leafletReady, setLeafletReady] = useState(false);
//   const [geoReady, setGeoReady]         = useState(false);

//   const stateData = useMemo(() => {
//     const map = {};
//     dealers.forEach(d => {
//       const norm = normalizeState(d.state);
//       if(!norm) return;
//       const key = norm.toLowerCase();
//       if(!map[key]) map[key]={ name:norm, dealers:[], total:0, target:0, bySM:{} };
//       const ach = Number(d.months?.[selectedMonthIdx]||0);
//       const tgt = Number((d.monthTargets?.[selectedMonthIdx]??d.target)||0);
//       map[key].dealers.push(d);
//       map[key].total  += ach;
//       map[key].target += tgt;
//       const smKey = d.salesman||'Unassigned';
//       if(!map[key].bySM[smKey]) map[key].bySM[smKey]={u:0,n:0};
//       map[key].bySM[smKey].u += ach;
//       map[key].bySM[smKey].n += 1;
//     });
//     return map;
//   }, [dealers, selectedMonthIdx]);

//   const maxVal = useMemo(() => {
//     const vals = Object.values(stateData).map(d => {
//       if(viewMode==='dealers') return d.dealers.length;
//       if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
//       return d.total;
//     });
//     return Math.max(...vals,1);
//   }, [stateData, viewMode]);

//   const topStates = useMemo(() => Object.values(stateData).sort((a,b)=>b.total-a.total).slice(0,12), [stateData]);
//   const unmapped  = useMemo(() => dealers.filter(d=>!d.state?.trim()).length, [dealers]);
//   const cityData  = useMemo(() => {
//     const map = {};
//     dealers.forEach(d => {
//       if(!d.city?.trim()) return;
//       const key = d.city.trim().toLowerCase();
//       if(!map[key]) map[key] = { name:d.city.trim(), dealers:[], total:0 };
//       map[key].dealers.push(d);
//       map[key].total += Number(d.months?.[selectedMonthIdx]||0);
//     });
//     return Object.values(map).filter(cx=>cx.total>0).sort((a,b)=>b.total-a.total);
//   }, [dealers, selectedMonthIdx]);
//   const det = selected ? stateData[selected.toLowerCase()] : null;

//   // Load Leaflet
//   useEffect(() => {
//     if(!document.getElementById('leaflet-css')){
//       const link=document.createElement('link');
//       link.id='leaflet-css'; link.rel='stylesheet';
//       link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
//       document.head.appendChild(link);
//     }
//     if(!document.getElementById('india-map-label-css')){
//       const s=document.createElement('style');
//       s.id='india-map-label-css'; s.textContent=LABEL_CSS;
//       document.head.appendChild(s);
//     }
//     if(window.L){ setLeafletReady(true); return; }
//     let script=document.getElementById('leaflet-js');
//     if(!script){ script=document.createElement('script'); script.id='leaflet-js'; script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async=true; document.head.appendChild(script); }
//     const onLoad=()=>setLeafletReady(true);
//     script.addEventListener('load',onLoad);
//     return()=>script.removeEventListener('load',onLoad);
//   }, []);

//   // Load GeoJSON
//   useEffect(() => {
//     if(geoRef.current){ setGeoReady(true); return; }
//     fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson')
//       .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
//       .catch(()=>{
//         fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
//           .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
//           .catch(e=>console.error('GeoJSON failed:',e));
//       });
//   }, []);

//   // Init map
//   useEffect(() => {
//     if(!leafletReady||!geoReady||!mapRef.current) return;
//     if(mapObjRef.current) return;
//     const L=window.L;
//     const map=L.map(mapRef.current,{ center:[22,80], zoom:4, zoomControl:true, scrollWheelZoom:true, attributionControl:false, minZoom:3, maxZoom:14 });
//     // Create a pane above overlayPane for city labels
//     map.createPane('labelsPane');
//     map.getPane('labelsPane').style.zIndex = 650;
//     map.getPane('labelsPane').style.pointerEvents = 'none';
//     mapObjRef.current=map;
//     // Base dark tile (no labels) - states colored on top
//     L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{
//       attribution:'© CartoDB', subdomains:'abcd', maxZoom:19, zIndex:1
//     }).addTo(map);

//     // Label tile layer on TOP of states - cities/areas appear on zoom
//     // This layer sits above the GeoJSON so city names are always visible
//     L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',{
//       attribution:'© CartoDB', subdomains:'abcd', maxZoom:19,
//       zIndex:10, // above GeoJSON layer
//       pane:'labelsPane',
//     }).addTo(map);
//     setTimeout(()=>map.invalidateSize(),100);
//     return()=>{ map.remove(); mapObjRef.current=null; layerRef.current=null; };
//   }, [leafletReady, geoReady]);

//   // Render GeoJSON + labels
//   useEffect(() => {
//     if(!leafletReady||!geoReady||!mapObjRef.current||!geoRef.current) return;
//     const L=window.L, map=mapObjRef.current;

//     // Remove old layer and labels
//     if(layerRef.current){ layerRef.current.remove(); layerRef.current=null; }
//     labelsRef.current.forEach(l=>l.remove());
//     labelsRef.current=[];

//     const getVal = key => {
//       const d=stateData[key]; if(!d) return 0;
//       if(viewMode==='dealers') return d.dealers.length;
//       if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
//       return d.total;
//     };

//     const geoLayer = L.geoJSON(geoRef.current, {
//       style: feature => {
//         const name=getFeatureStateName(feature);
//         const key=name?.toLowerCase();
//         const value=key?getVal(key):0;
//         const ratio=maxVal?value/maxVal:0;
//         const isSel=selected&&name&&selected.toLowerCase()===name.toLowerCase();
//         return { color:isSel?'#fbbf24':'#252548', weight:isSel?2.2:1, fillColor:isSel?'#fbbf24':getColor(ratio), fillOpacity:isSel?0.78:0.65, opacity:1 };
//       },
//       onEachFeature: (feature, layer) => {
//         const name=getFeatureStateName(feature);
//         const key=name?.toLowerCase();
//         const d=key?stateData[key]:null;
//         const sales=d?.total||0;
//         const dealerCount=d?.dealers?.length||0;
//         const target=d?.target||0;
//         const achPct=target?Math.round((sales/target)*100):0;

//         // Hover tooltip (rich)
//         layer.bindTooltip(
//           '<div style="font-family:system-ui;background:#0e0e20;border:1px solid #6366f1;border-radius:8px;padding:9px 12px;min-width:140px">' +
//           '<div style="font-size:12px;font-weight:700;color:#e2e0f0;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #252548">' + (d?.name||name||'') + '</div>' +
//           '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Sales</span><span style="color:#34d399;font-weight:700">' + sales + '</span></div>' +
//           '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Dealers</span><span style="color:#818cf8;font-weight:700">' + dealerCount + '</span></div>' +
//           (target ? '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px"><span>Ach%</span><span style="font-weight:700">' + achPct + '%</span></div>' : '') +
//           (d && dealerCount > 0 ? '<div style="font-size:9px;color:#55546a;margin-top:5px;padding-top:4px;border-top:1px solid #252548">' + d.dealers.slice(0,2).map(dd=>dd.name).join(' · ') + (dealerCount > 2 ? ' +' + (dealerCount-2) : '') + '</div>' : '') +
//           '</div>',
//           { sticky:true, opacity:1, className:'leaflet-tooltip-custom' });

//         layer.on({
//           mouseover: e => { e.target.setStyle({weight:2,color:'#fbbf24',fillOpacity:0.85}); if(!L.Browser.ie&&!L.Browser.opera&&!L.Browser.edge) e.target.bringToFront(); },
//           mouseout:  e => { if(layerRef.current) layerRef.current.resetStyle(e.target); },
//           click: e => {
//             if(d?.name||name) setSelected(d?.name||name);
//             try{ map.fitBounds(e.target.getBounds(),{padding:[20,20],maxZoom:6}); }catch{}
//           },
//         });
//       },
//     }).addTo(map);

//     layerRef.current = geoLayer;

//     // City dot markers - appear at zoom 6+
//     const CITY_COORDS = {
//       'mumbai':[19.076,72.877],'delhi':[28.679,77.213],'bangalore':[12.972,77.594],
//       'bengaluru':[12.972,77.594],'hyderabad':[17.385,78.487],'chennai':[13.083,80.270],
//       'kolkata':[22.563,88.363],'pune':[18.520,73.856],'ahmedabad':[23.023,72.572],
//       'surat':[21.170,72.831],'jaipur':[26.912,75.787],'lucknow':[26.847,80.947],
//       'kanpur':[26.449,80.331],'nagpur':[21.146,79.089],'indore':[22.719,75.857],
//       'bhopal':[23.259,77.413],'visakhapatnam':[17.686,83.218],'patna':[25.594,85.138],
//       'vadodara':[22.307,73.181],'ludhiana':[30.901,75.857],'agra':[27.176,78.008],
//       'nashik':[19.990,73.791],'faridabad':[28.408,77.317],'meerut':[28.984,77.706],
//       'rajkot':[22.303,70.802],'varanasi':[25.318,83.004],'aurangabad':[19.877,75.324],
//       'amritsar':[31.634,74.873],'allahabad':[25.435,81.846],'ranchi':[23.344,85.310],
//       'coimbatore':[11.017,76.955],'gwalior':[26.228,78.182],'vijayawada':[16.506,80.648],
//       'jodhpur':[26.295,73.017],'madurai':[9.925,78.120],'raipur':[21.251,81.633],
//       'chandigarh':[30.733,76.779],'guwahati':[26.144,91.736],'mysore':[12.295,76.639],
//       'mysuru':[12.295,76.639],'kochi':[9.931,76.267],'dehradun':[30.316,78.032],
//       'noida':[28.535,77.391],'gurugram':[28.459,77.026],'gurgaon':[28.459,77.026],
//       'bhubaneswar':[20.296,85.825],'warangal':[17.978,79.598],'kolhapur':[16.706,74.243],
//       'thiruvananthapuram':[8.524,76.936],'trivandrum':[8.524,76.936],
//       'bikaner':[28.022,73.312],'jamshedpur':[22.802,86.183],'cuttack':[20.462,85.879],
//       'ajmer':[26.449,74.638],'hubli':[15.365,75.124],'dharwad':[15.458,75.008],
//       'salem':[11.664,78.146],'tiruppur':[11.108,77.341],'jalandhar':[31.326,75.576],
//       'kota':[25.182,75.866],'bareilly':[28.347,79.420],'aligarh':[27.882,78.082],
//       'moradabad':[28.839,78.776],'saharanpur':[29.968,77.546],'guntur':[16.300,80.437],
//       'solapur':[17.687,75.904],'nanded':[19.160,77.314],'durgapur':[23.480,87.320],
//       'asansol':[23.673,86.952],'bellary':[15.139,76.922],'bijapur':[16.828,75.715],
//     };
//     const cityMarkers = [];
//     const renderCityMarkers = () => {
//       cityMarkers.forEach(m => { try{ map.removeLayer(m); }catch(e){} });
//       cityMarkers.length = 0;
//       if(map.getZoom() < 6) return;
//       cityData.forEach(city => {
//         const coords = CITY_COORDS[city.name.toLowerCase().trim()];
//         if(!coords) return;
//         const radius = Math.max(5, Math.min(18, Math.sqrt(city.total)));
//         const m = L.circleMarker(coords, {
//           radius, fillColor:'#fbbf24', color:'#0e0e20',
//           weight:1.5, fillOpacity:0.9, pane:'labelsPane',
//         });
//         m.bindTooltip(
//           '<div style="font-family:system-ui;background:#0e0e20;border:1px solid #fbbf24;border-radius:7px;padding:8px 11px;min-width:120px">' +
//           '<div style="font-size:11px;font-weight:700;color:#fbbf24;margin-bottom:3px">' + city.name + '</div>' +
//           '<div style="font-size:13px;font-weight:700;color:#34d399">' + city.total + ' units</div>' +
//           '<div style="font-size:10px;color:#55546a">' + city.dealers.length + ' dealers</div>' +
//           (city.dealers.length>0 ? '<div style="font-size:9px;color:#55546a;margin-top:3px">' + city.dealers.slice(0,2).map(d=>d.name).join(' · ') + (city.dealers.length>2?' +'+(city.dealers.length-2):'') + '</div>' : '') +
//           '</div>',
//           { sticky:true, opacity:1 }
//         );
//         m.addTo(map);
//         cityMarkers.push(m);
//       });
//     };
//     map.on('zoomend', renderCityMarkers);
//     renderCityMarkers();

//     // Add permanent text labels on each state
//     geoRef.current.features.forEach(feature => {
//       const name = getFeatureStateName(feature);
//       const key  = name?.toLowerCase();
//       const d    = key?stateData[key]:null;
//       const val  = key?getVal(key):0;

//       try {
//         // Compute centroid from bounding box
//         const layer = L.geoJSON(feature);
//         const bounds = layer.getBounds();
//         const center = bounds.getCenter();

//         const sn    = shortName(name||'?');
//         const valStr = val > 0 ? String(val) : '';

//         const label = L.tooltip({
//           permanent: true,
//           direction: 'center',
//           className: 'state-label',
//           interactive: false,
//           opacity: 1,
//         })
//         .setContent('<div class="state-label-inner">' + sn + (valStr ? '<span class="lbl-val">' + valStr + '</span>' : '') + '</div>')
//         .setLatLng(center);

//         label.addTo(map);
//         labelsRef.current.push(label);
//       } catch(e) {}
//     });

//   }, [leafletReady, geoReady, stateData, viewMode, maxVal, selected]);

//   return (
//     <div className="fade" style={{padding:0}}>
//       <div style={{marginBottom:10}}>
//         <div style={{fontSize:10,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:2}}>Geography · {MO[selectedMonthIdx]}</div>
//         <div style={{fontSize:18,fontWeight:700}}>India Sales Map</div>
//       </div>

//       <div style={{background:'#0c0c1e',borderRadius:12,border:'1px solid #1e1e38',overflow:'hidden',marginBottom:10}}>
//         <div style={{padding:'8px 10px',background:'#0e0e20',borderBottom:'1px solid #1e1e38',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
//           <MapPin size={12} color="#6366f1"/>
//           <span style={{fontSize:12,fontWeight:600,color:'#e2e0f0'}}>India</span>
//           <span style={{fontSize:10,color:'#55546a'}}>hover=details · click=select · zoom 6+ for cities</span>
//           <div style={{flex:1}}/>
//           <div style={{display:'flex',background:'#141430',border:'1px solid #252548',borderRadius:6,overflow:'hidden'}}>
//             {[['sales','Sales'],['dealers','Dealers'],['achievement','Ach%']].map(([m,l])=>(
//               <button key={m} onClick={()=>setViewMode(m)} style={{background:viewMode===m?'#6366f1':'transparent',color:viewMode===m?'#fff':'#55546a',border:'none',padding:'4px 8px',fontSize:11,fontWeight:600,cursor:'pointer',borderLeft:m!=='sales'?'1px solid #252548':'none'}}>{l}</button>
//             ))}
//           </div>
//           {selected&&<button onClick={()=>setSelected(null)} style={{background:'none',border:'1px solid #252548',borderRadius:6,color:'#f87171',fontSize:11,padding:'4px 8px',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><X size={10}/>Clear</button>}
//         </div>

//         <div style={{position:'relative'}}>
//           <div ref={mapRef} style={{height:'clamp(260px,58vw,520px)',width:'100%'}}/>
//           {(!leafletReady||!geoReady)&&(
//             <div style={{position:'absolute',inset:0,background:'#0c0c1e',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
//               <div style={{width:28,height:28,border:'3px solid #1e1e38',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
//               <div style={{fontSize:12,color:'#55546a'}}>Loading map...</div>
//             </div>
//           )}
//           <div style={{position:'absolute',bottom:10,left:8,background:'rgba(12,12,30,0.95)',borderRadius:7,padding:'5px 8px',border:'1px solid #1e1e38',zIndex:1000}}>
//             <div style={{fontSize:7,color:'#55546a',marginBottom:3,textTransform:'uppercase'}}>{viewMode}</div>
//             <div style={{display:'flex',gap:2}}>
//               {[['#1e2050','None'],['#a5b4fc','Low'],['#6366f1','Mid'],['#3730a3','Top'],['#fbbf24','Sel']].map(([c,l])=>(
//                 <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
//                   <div style={{width:14,height:8,borderRadius:2,background:c,border:'1px solid #ffffff12'}}/>
//                   <span style={{fontSize:6,color:'#55546a'}}>{l}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//           {leafletReady&&geoReady&&Object.keys(stateData).length===0&&(
//             <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none',zIndex:1000}}>
//               <MapPin size={28} style={{margin:'0 auto 8px',opacity:.15,color:'#6366f1'}}/>
//               <div style={{fontSize:12,color:'#55546a',background:'rgba(12,12,30,0.9)',padding:'6px 12px',borderRadius:7}}>Add "State" column to your sheet</div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
//         {selected&&det?(
//           <div className="card" style={{padding:0,overflow:'hidden'}}>
//             <div style={{padding:'10px 12px',background:'rgba(251,191,36,0.08)',borderBottom:'1px solid rgba(251,191,36,0.2)',display:'flex',alignItems:'center',gap:8}}>
//               <div style={{width:7,height:7,borderRadius:'50%',background:'#fbbf24',flexShrink:0}}/>
//               <span style={{fontSize:13,fontWeight:700,color:'#fbbf24',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selected}</span>
//               <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#55546a',cursor:'pointer'}}><X size={13}/></button>
//             </div>
//             <div style={{padding:12}}>
//               <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
//                 {[{l:'Sales',v:det.total,c:'#34d399'},{l:'Dealers',v:det.dealers.length,c:'#6366f1'},{l:'Target',v:det.target||'—',c:'var(--t2)'},{l:'Ach%',v:det.target?pct(det.target,det.total)+'%':'N/T',c:pclr(det.target?pct(det.target,det.total):null)}].map(k=>(
//                   <div key={k.l} style={{background:'var(--bg2)',borderRadius:7,padding:'7px 8px'}}>
//                     <div style={{fontSize:8,color:'var(--t3)',textTransform:'uppercase',marginBottom:2}}>{k.l}</div>
//                     <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
//                   </div>
//                 ))}
//               </div>
//               {Object.keys(det.bySM).length>0&&(
//                 <div style={{marginBottom:12}}>
//                   <div style={{fontSize:10,color:'var(--t3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>By Salesman</div>
//                   {Object.entries(det.bySM).sort((a,b)=>b[1].u-a[1].u).map(([smId,sm])=>{
//                     const user=users[smId]; const bar=det.total?Math.round((sm.u/det.total)*100):0;
//                     return(<div key={smId} style={{marginBottom:7}}>
//                       <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
//                         {user&&<div style={{width:18,height:18,borderRadius:'50%',background:user.color+'22',color:user.color,border:`1px solid ${user.color}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,flexShrink:0}}>{user.ini}</div>}
//                         <span style={{fontSize:11,color:'var(--t2)',flex:1}}>{user?.name||smId}</span>
//                         <span style={{fontSize:12,fontWeight:700,color:user?.color||'#6366f1'}}>{sm.u}</span>
//                       </div>
//                       <div style={{height:3,background:'var(--b1)',borderRadius:2}}><div style={{height:'100%',width:bar+'%',background:user?.color||'#6366f1',borderRadius:2}}/></div>
//                     </div>);
//                   })}
//                 </div>
//               )}
//               <div style={{fontSize:10,color:'var(--t3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Dealers ({det.dealers.length})</div>
//               <div style={{maxHeight:180,overflowY:'auto'}}>
//                 {[...det.dealers].sort((a,b)=>(b.months?.[selectedMonthIdx]||0)-(a.months?.[selectedMonthIdx]||0)).map(d=>{
//                   const ach=d.months?.[selectedMonthIdx]||0; const tgt=(d.monthTargets?.[selectedMonthIdx]??d.target)||0; const dp=pct(tgt,ach);
//                   return(<div key={d.id} onClick={()=>onOpenDealer?.(d.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 2px',borderBottom:'1px solid var(--b1)',cursor:'pointer',borderRadius:4,transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
//                     <div style={{flex:1,minWidth:0}}>
//                       <div style={{fontSize:11,fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
//                       <div style={{display:'flex',gap:4,marginTop:2,flexWrap:'wrap',alignItems:'center'}}>
//                         {d.city&&<span style={{fontSize:9,color:'var(--t3)'}}>{d.city}</span>}
//                         {(d.category||Object.keys(d.categoryBreakdown||{})[0])&&(
//                           <span style={{fontSize:9,color:'#818cf8',background:'rgba(129,140,248,0.12)',padding:'1px 5px',borderRadius:3}}>
//                             {d.category||Object.keys(d.categoryBreakdown||{})[0]||''}
//                           </span>
//                         )}
//                         {(d.categoryType||Object.keys(Object.values(d.categoryBreakdown||{})[0]||{})[0])&&(
//                           <span style={{fontSize:9,color:'#a5b4fc',background:'rgba(165,180,252,0.08)',padding:'1px 5px',borderRadius:3}}>
//                             {d.categoryType||Object.keys(Object.values(d.categoryBreakdown||{})[0]||{})[0]||''}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                     <div style={{textAlign:'right',flexShrink:0}}>
//                       <div style={{fontSize:12,fontWeight:700,color:'#34d399'}}>{ach}</div>
//                       <div style={{fontSize:10,color:pclr(dp)}}>{spct(tgt,ach)}</div>
//                     </div>
//                     <ChevronRight size={11} color="var(--t3)"/>
//                   </div>);
//                 })}
//               </div>
//             </div>
//           </div>
//         ):(
//           <div className="card" style={{padding:0,overflow:'hidden'}}>
//             <div style={{padding:'10px 12px',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:6}}>
//               <Award size={13} color="#fbbf24"/>
//               <span style={{fontSize:13,fontWeight:700,color:'var(--t2)'}}>Top States</span>
//               <span style={{fontSize:11,color:'var(--t3)',marginLeft:2}}>— {MO[selectedMonthIdx]}</span>
//             </div>
//             <div style={{padding:'4px 0',maxHeight:300,overflowY:'auto'}}>
//               {topStates.length===0?<div style={{padding:'16px',color:'var(--t3)',fontSize:12,textAlign:'center'}}>No state data</div>
//               :topStates.map(({name,total,dealers:dl},i)=>{
//                 const bar=Math.round((total/(topStates[0]?.total||1))*100);
//                 return(<div key={name} onClick={()=>setSelected(s=>s===name?null:name)} style={{padding:'7px 12px',cursor:'pointer',background:selected===name?'rgba(99,102,241,0.08)':'transparent',borderLeft:`3px solid ${selected===name?'#6366f1':'transparent'}`,transition:'all .15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background=selected===name?'rgba(99,102,241,0.08)':'transparent'}>
//                   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
//                     <div style={{display:'flex',alignItems:'center',gap:6}}>
//                       <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right'}}>{i+1}</span>
//                       <span style={{fontSize:12,fontWeight:600,color:selected===name?'var(--acc)':'var(--t1)'}}>{name}</span>
//                     </div>
//                     <div style={{display:'flex',gap:8,alignItems:'center'}}>
//                       <span style={{fontSize:10,color:'var(--t3)'}}>{dl.length}d</span>
//                       <span style={{fontSize:13,fontWeight:700,color:'#34d399'}}>{total}</span>
//                     </div>
//                   </div>
//                   <div style={{height:3,background:'var(--b1)',borderRadius:2,marginLeft:20}}>
//                     <div style={{height:'100%',width:bar+'%',background:'linear-gradient(90deg,#6366f1,#a5b4fc)',borderRadius:2,transition:'width .5s'}}/>
//                   </div>
//                 </div>);
//               })}
//             </div>
//           </div>
//         )}

//         <div className="card">
//           <div style={{fontSize:10,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Summary</div>
//           {[
//             {l:'States covered',v:Object.keys(stateData).length,c:'#6366f1'},
//             {l:'Total sales',v:Object.values(stateData).reduce((s,d)=>s+d.total,0),c:'#34d399'},
//             {l:'Mapped dealers',v:dealers.length-unmapped,c:'var(--t2)'},
//             {l:'Unmapped',v:unmapped,c:unmapped>0?'#fbbf24':'var(--t3)'},
//           ].map(k=>(
//             <div key={k.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
//               <span style={{color:'var(--t3)'}}>{k.l}</span>
//               <span style={{fontWeight:700,color:k.c}}>{k.v}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }



import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, MapPin, Award, ChevronRight } from 'lucide-react';
import { MO } from '../constants';
import { pct, spct, pclr } from '../utils';
import { useMonth } from '../context';

const STATE_ALIASES = {
  'j&k':'Jammu and Kashmir','jammu and kashmir':'Jammu and Kashmir','jammu':'Jammu and Kashmir','kashmir':'Jammu and Kashmir','ladakh':'Ladakh',
  'hp':'Himachal Pradesh','himachal':'Himachal Pradesh',
  'up':'Uttar Pradesh','u.p.':'Uttar Pradesh',
  'mp':'Madhya Pradesh','m.p.':'Madhya Pradesh',
  'ap':'Andhra Pradesh','andhra':'Andhra Pradesh',
  'tn':'Tamil Nadu','tamilnadu':'Tamil Nadu','tamil':'Tamil Nadu','tamil nadu':'Tamil Nadu',
  'wb':'West Bengal','bengal':'West Bengal','west bengal':'West Bengal',
  'uk':'Uttarakhand','uttaranchal':'Uttarakhand','uttarakhand':'Uttarakhand',
  'orissa':'Odisha','odisha':'Odisha',
  'cg':'Chhattisgarh','chattisgarh':'Chhattisgarh','chhattisgarh':'Chhattisgarh',
  'ts':'Telangana','telangana':'Telangana',
  'karnataka':'Karnataka','karnatka':'Karnataka',
  'maharashtra':'Maharashtra',
  'gujarat':'Gujarat','gj':'Gujarat',
  'rajasthan':'Rajasthan','raj':'Rajasthan',
  'punjab':'Punjab','pb':'Punjab',
  'haryana':'Haryana','hr':'Haryana',
  'delhi':'Delhi','new delhi':'Delhi','ncr':'Delhi','nd':'Delhi','nct of delhi':'Delhi',
  'goa':'Goa',
  'kerala':'Kerala','kl':'Kerala',
  'assam':'Assam','bihar':'Bihar','br':'Bihar',
  'jharkhand':'Jharkhand','jh':'Jharkhand',
  'sikkim':'Sikkim','nagaland':'Nagaland','manipur':'Manipur','mizoram':'Mizoram','tripura':'Tripura','meghalaya':'Meghalaya',
  'arunachal':'Arunachal Pradesh','arunachal pradesh':'Arunachal Pradesh',
  'puducherry':'Puducherry','pondicherry':'Puducherry',
  'andaman':'Andaman and Nicobar Islands','andaman and nicobar':'Andaman and Nicobar Islands','andaman and nicobar islands':'Andaman and Nicobar Islands',
  'lakshadweep':'Lakshadweep','chandigarh':'Chandigarh',
  'dadra and nagar haveli':'Dadra and Nagar Haveli and Daman and Diu','daman and diu':'Dadra and Nagar Haveli and Daman and Diu',
};

const normalizeState = s => {
  if(!s) return null;
  const l = String(s).toLowerCase().trim();
  return STATE_ALIASES[l] || String(s).trim();
};

const getColor = ratio => {
  if(!ratio||ratio===0) return '#1e2050';
  if(ratio>0.8) return '#3730a3';
  if(ratio>0.6) return '#4f46e5';
  if(ratio>0.4) return '#6366f1';
  if(ratio>0.2) return '#818cf8';
  return '#a5b4fc';
};

const getFeatureStateName = feature => {
  const p = feature?.properties||{};
  const raw = p.ST_NM||p.st_nm||p.NAME_1||p.name||p.NAME||p.state||p.State||p.STATE||p.DISTRICT;
  return normalizeState(raw);
};

// Short name for label display
const shortName = name => {
  if(!name) return '';
  const shorts = {
    'Jammu and Kashmir':'J & K',
    'Himachal Pradesh':'H.P.',
    'Uttar Pradesh':'U.P.',
    'Madhya Pradesh':'M.P.',
    'Andhra Pradesh':'A.P.',
    'Tamil Nadu':'T.N.',
    'West Bengal':'W.B.',
    'Uttarakhand':'Uttrknd',
    'Chhattisgarh':'C.G.',
    'Arunachal Pradesh':'Arunachal',
    'Andaman and Nicobar Islands':'A&N',
    'Dadra and Nagar Haveli and Daman and Diu':'D&NH',
    'Telangana':'T.S.',
    'Karnataka':'Krtk',
    'Maharashtra':'Maha',
    'Rajasthan':'Raj.',
  };
  return shorts[name] || name;
};

// Label CSS injected once
const LABEL_CSS = `
  .state-label {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    font-family: Inter, system-ui, sans-serif;
    pointer-events: none;
    transition: opacity 0.3s;
  }
  .state-label-inner {
    color: rgba(255,255,255,0.9);
    font-size: 9px;
    font-weight: 700;
    text-align: center;
    line-height: 1.3;
    text-shadow: 0 1px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.9);
    white-space: nowrap;
    pointer-events: none;
  }
  .state-label-inner .lbl-val {
    color: #fbbf24;
    font-size: 8px;
    font-weight: 700;
    display: block;
    text-shadow: 0 1px 4px rgba(0,0,0,1);
  }
  .leaflet-tooltip.state-label::before { display:none; }
  /* Hide our custom state labels when zoomed in (city labels take over) */
  .leaflet-zoom-level-7 .state-label,
  .leaflet-zoom-level-8 .state-label,
  .leaflet-zoom-level-9 .state-label,
  .leaflet-zoom-level-10 .state-label { opacity: 0.3; }
  /* Leaflet label layer tooltip */
  .leaflet-tooltip-custom {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .leaflet-tooltip-custom::before { display: none !important; }
`;

export default function IndiaMap({ dealers=[], users={}, onOpenDealer }) {
  const { selectedMonthIdx } = useMonth();
  const mapRef    = useRef(null);
  const mapObjRef = useRef(null);
  const layerRef  = useRef(null);
  const labelsRef = useRef([]);
  const geoRef    = useRef(null);

  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState('sales');
  const [leafletReady, setLeafletReady] = useState(false);
  const [geoReady, setGeoReady]         = useState(false);

  const stateData = useMemo(() => {
    const map = {};
    dealers.forEach(d => {
      const norm = normalizeState(d.state);
      if(!norm) return;
      const key = norm.toLowerCase();
      if(!map[key]) map[key]={ name:norm, dealers:[], total:0, target:0, bySM:{} };
      const ach = Number(d.months?.[selectedMonthIdx]||0);
      const tgt = Number((d.monthTargets?.[selectedMonthIdx]??d.target)||0);
      map[key].dealers.push(d);
      map[key].total  += ach;
      map[key].target += tgt;
      const smKey = d.salesman||'Unassigned';
      if(!map[key].bySM[smKey]) map[key].bySM[smKey]={u:0,n:0};
      map[key].bySM[smKey].u += ach;
      map[key].bySM[smKey].n += 1;
    });
    return map;
  }, [dealers, selectedMonthIdx]);

  const maxVal = useMemo(() => {
    const vals = Object.values(stateData).map(d => {
      if(viewMode==='dealers') return d.dealers.length;
      if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
      return d.total;
    });
    return Math.max(...vals,1);
  }, [stateData, viewMode]);

  const topStates = useMemo(() => Object.values(stateData).sort((a,b)=>b.total-a.total).slice(0,12), [stateData]);
  const unmapped  = useMemo(() => dealers.filter(d=>!d.state?.trim()).length, [dealers]);
  const cityData  = useMemo(() => {
    const map = {};
    dealers.forEach(d => {
      if(!d.city?.trim()) return;
      const key = d.city.trim().toLowerCase();
      if(!map[key]) map[key] = { name:d.city.trim(), dealers:[], total:0 };
      map[key].dealers.push(d);
      map[key].total += Number(d.months?.[selectedMonthIdx]||0);
    });
    return Object.values(map).filter(cx=>cx.total>0).sort((a,b)=>b.total-a.total);
  }, [dealers, selectedMonthIdx]);
  const det = selected ? stateData[selected.toLowerCase()] : null;

  // Load Leaflet
  useEffect(() => {
    if(!document.getElementById('leaflet-css')){
      const link=document.createElement('link');
      link.id='leaflet-css'; link.rel='stylesheet';
      link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    if(!document.getElementById('india-map-label-css')){
      const s=document.createElement('style');
      s.id='india-map-label-css'; s.textContent=LABEL_CSS;
      document.head.appendChild(s);
    }
    if(window.L){ setLeafletReady(true); return; }
    let script=document.getElementById('leaflet-js');
    if(!script){ script=document.createElement('script'); script.id='leaflet-js'; script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.async=true; document.head.appendChild(script); }
    const onLoad=()=>setLeafletReady(true);
    script.addEventListener('load',onLoad);
    return()=>script.removeEventListener('load',onLoad);
  }, []);

  // Load GeoJSON
  useEffect(() => {
    if(geoRef.current){ setGeoReady(true); return; }
    fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson')
      .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
      .catch(()=>{
        fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
          .then(r=>r.json()).then(data=>{ geoRef.current=data; setGeoReady(true); })
          .catch(e=>console.error('GeoJSON failed:',e));
      });
  }, []);

  // Init map
  useEffect(() => {
    if(!leafletReady||!geoReady||!mapRef.current) return;
    if(mapObjRef.current) return;
    const L=window.L;
    const map=L.map(mapRef.current,{ center:[22,80], zoom:4, zoomControl:true, scrollWheelZoom:true, attributionControl:false, minZoom:3, maxZoom:14 });
    // Create a pane above overlayPane for city labels
    map.createPane('labelsPane');
    map.getPane('labelsPane').style.zIndex = 650;
    map.getPane('labelsPane').style.pointerEvents = 'none';
    mapObjRef.current=map;
    // Base dark tile (no labels) - states colored on top
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',{
      attribution:'© CartoDB', subdomains:'abcd', maxZoom:19, zIndex:1
    }).addTo(map);

    // Label tile layer on TOP of states - cities/areas appear on zoom
    // This layer sits above the GeoJSON so city names are always visible
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',{
      attribution:'© CartoDB', subdomains:'abcd', maxZoom:19,
      zIndex:10, // above GeoJSON layer
      pane:'labelsPane',
    }).addTo(map);
    setTimeout(()=>map.invalidateSize(),100);
    return()=>{ map.remove(); mapObjRef.current=null; layerRef.current=null; };
  }, [leafletReady, geoReady]);

  // Render GeoJSON + labels
  useEffect(() => {
    if(!leafletReady||!geoReady||!mapObjRef.current||!geoRef.current) return;
    const L=window.L, map=mapObjRef.current;

    // Remove old layer and labels
    if(layerRef.current){ layerRef.current.remove(); layerRef.current=null; }
    labelsRef.current.forEach(l=>l.remove());
    labelsRef.current=[];

    const getVal = key => {
      const d=stateData[key]; if(!d) return 0;
      if(viewMode==='dealers') return d.dealers.length;
      if(viewMode==='achievement') return d.target?Math.round((d.total/d.target)*100):0;
      return d.total;
    };

    const geoLayer = L.geoJSON(geoRef.current, {
      style: feature => {
        const name=getFeatureStateName(feature);
        const key=name?.toLowerCase();
        const value=key?getVal(key):0;
        const ratio=maxVal?value/maxVal:0;
        const isSel=selected&&name&&selected.toLowerCase()===name.toLowerCase();
        return { color:isSel?'#fbbf24':'#252548', weight:isSel?2.2:1, fillColor:isSel?'#fbbf24':getColor(ratio), fillOpacity:isSel?0.78:0.65, opacity:1 };
      },
      onEachFeature: (feature, layer) => {
        const name=getFeatureStateName(feature);
        const key=name?.toLowerCase();
        const d=key?stateData[key]:null;
        const sales=d?.total||0;
        const dealerCount=d?.dealers?.length||0;
        const target=d?.target||0;
        const achPct=target?Math.round((sales/target)*100):0;

        // Hover tooltip (rich)
        layer.bindTooltip(
          '<div style="font-family:system-ui;background:#0e0e20;border:1px solid #6366f1;border-radius:8px;padding:9px 12px;min-width:140px">' +
          '<div style="font-size:12px;font-weight:700;color:#e2e0f0;margin-bottom:5px;padding-bottom:4px;border-bottom:1px solid #252548">' + (d?.name||name||'') + '</div>' +
          '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Sales</span><span style="color:#34d399;font-weight:700">' + sales + '</span></div>' +
          '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px;margin-bottom:2px"><span>Dealers</span><span style="color:#818cf8;font-weight:700">' + dealerCount + '</span></div>' +
          (target ? '<div style="font-size:11px;color:#55546a;display:flex;justify-content:space-between;gap:16px"><span>Ach%</span><span style="font-weight:700">' + achPct + '%</span></div>' : '') +
          (d && dealerCount > 0 ? '<div style="font-size:9px;color:#55546a;margin-top:5px;padding-top:4px;border-top:1px solid #252548">' + d.dealers.slice(0,2).map(dd=>dd.name).join(' · ') + (dealerCount > 2 ? ' +' + (dealerCount-2) : '') + '</div>' : '') +
          '</div>',
          { sticky:true, opacity:1, className:'leaflet-tooltip-custom' });

        layer.on({
          mouseover: e => { e.target.setStyle({weight:2,color:'#fbbf24',fillOpacity:0.85}); if(!L.Browser.ie&&!L.Browser.opera&&!L.Browser.edge) e.target.bringToFront(); },
          mouseout:  e => { if(layerRef.current) layerRef.current.resetStyle(e.target); },
          click: e => {
            if(d?.name||name) setSelected(d?.name||name);
            try{ map.fitBounds(e.target.getBounds(),{padding:[20,20],maxZoom:6}); }catch{}
          },
        });
      },
    }).addTo(map);

    layerRef.current = geoLayer;

    // City dot markers - appear at zoom 6+
    const CITY_COORDS = {
      'mumbai':[19.076,72.877],'delhi':[28.679,77.213],'bangalore':[12.972,77.594],
      'bengaluru':[12.972,77.594],'hyderabad':[17.385,78.487],'chennai':[13.083,80.270],
      'kolkata':[22.563,88.363],'pune':[18.520,73.856],'ahmedabad':[23.023,72.572],
      'surat':[21.170,72.831],'jaipur':[26.912,75.787],'lucknow':[26.847,80.947],
      'kanpur':[26.449,80.331],'nagpur':[21.146,79.089],'indore':[22.719,75.857],
      'bhopal':[23.259,77.413],'visakhapatnam':[17.686,83.218],'patna':[25.594,85.138],
      'vadodara':[22.307,73.181],'ludhiana':[30.901,75.857],'agra':[27.176,78.008],
      'nashik':[19.990,73.791],'faridabad':[28.408,77.317],'meerut':[28.984,77.706],
      'rajkot':[22.303,70.802],'varanasi':[25.318,83.004],'aurangabad':[19.877,75.324],
      'amritsar':[31.634,74.873],'allahabad':[25.435,81.846],'ranchi':[23.344,85.310],
      'coimbatore':[11.017,76.955],'gwalior':[26.228,78.182],'vijayawada':[16.506,80.648],
      'jodhpur':[26.295,73.017],'madurai':[9.925,78.120],'raipur':[21.251,81.633],
      'chandigarh':[30.733,76.779],'guwahati':[26.144,91.736],'mysore':[12.295,76.639],
      'mysuru':[12.295,76.639],'kochi':[9.931,76.267],'dehradun':[30.316,78.032],
      'noida':[28.535,77.391],'gurugram':[28.459,77.026],'gurgaon':[28.459,77.026],
      'bhubaneswar':[20.296,85.825],'warangal':[17.978,79.598],'kolhapur':[16.706,74.243],
      'thiruvananthapuram':[8.524,76.936],'trivandrum':[8.524,76.936],
      'bikaner':[28.022,73.312],'jamshedpur':[22.802,86.183],'cuttack':[20.462,85.879],
      'ajmer':[26.449,74.638],'hubli':[15.365,75.124],'dharwad':[15.458,75.008],
      'salem':[11.664,78.146],'tiruppur':[11.108,77.341],'jalandhar':[31.326,75.576],
      'kota':[25.182,75.866],'bareilly':[28.347,79.420],'aligarh':[27.882,78.082],
      'moradabad':[28.839,78.776],'saharanpur':[29.968,77.546],'guntur':[16.300,80.437],
      'solapur':[17.687,75.904],'nanded':[19.160,77.314],'durgapur':[23.480,87.320],
      'asansol':[23.673,86.952],'bellary':[15.139,76.922],'bijapur':[16.828,75.715],
    };
    const cityMarkers = [];
    const renderCityMarkers = () => {
      cityMarkers.forEach(m => { try{ map.removeLayer(m); }catch(e){} });
      cityMarkers.length = 0;
      if(map.getZoom() < 6) return;
      cityData.forEach(city => {
        const coords = CITY_COORDS[city.name.toLowerCase().trim()];
        if(!coords) return;
        const radius = Math.max(5, Math.min(18, Math.sqrt(city.total)));
        const m = L.circleMarker(coords, {
          radius, fillColor:'#fbbf24', color:'#0e0e20',
          weight:1.5, fillOpacity:0.9, pane:'labelsPane',
        });
        m.bindTooltip(
          '<div style="font-family:system-ui;background:#0e0e20;border:1px solid #fbbf24;border-radius:7px;padding:8px 11px;min-width:120px">' +
          '<div style="font-size:11px;font-weight:700;color:#fbbf24;margin-bottom:3px">' + city.name + '</div>' +
          '<div style="font-size:13px;font-weight:700;color:#34d399">' + city.total + ' units</div>' +
          '<div style="font-size:10px;color:#55546a">' + city.dealers.length + ' dealers</div>' +
          (city.dealers.length>0 ? '<div style="font-size:9px;color:#55546a;margin-top:3px">' + city.dealers.slice(0,2).map(d=>d.name).join(' · ') + (city.dealers.length>2?' +'+(city.dealers.length-2):'') + '</div>' : '') +
          '</div>',
          { sticky:true, opacity:1 }
        );
        m.addTo(map);
        cityMarkers.push(m);
      });
    };
    map.on('zoomend', renderCityMarkers);
    renderCityMarkers();

    // Add permanent text labels on each state
    geoRef.current.features.forEach(feature => {
      const name = getFeatureStateName(feature);
      const key  = name?.toLowerCase();
      const d    = key?stateData[key]:null;
      const val  = key?getVal(key):0;

      try {
        // Compute centroid from bounding box
        const layer = L.geoJSON(feature);
        const bounds = layer.getBounds();
        const center = bounds.getCenter();

        const sn    = shortName(name||'?');
        const valStr = val > 0 ? String(val) : '';

        const label = L.tooltip({
          permanent: true,
          direction: 'center',
          className: 'state-label',
          interactive: false,
          opacity: 1,
        })
        .setContent('<div class="state-label-inner">' + sn + (valStr ? '<span class="lbl-val">' + valStr + '</span>' : '') + '</div>')
        .setLatLng(center);

        label.addTo(map);
        labelsRef.current.push(label);
      } catch(e) {}
    });

  }, [leafletReady, geoReady, stateData, viewMode, maxVal, selected]);

  return (
    <div className="fade" style={{padding:0}}>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:10,color:'var(--acc)',textTransform:'uppercase',letterSpacing:'.15em',marginBottom:2}}>Geography · {MO[selectedMonthIdx]}</div>
        <div style={{fontSize:18,fontWeight:700}}>India Sales Map</div>
      </div>

      <div style={{background:'#0c0c1e',borderRadius:12,border:'1px solid #1e1e38',overflow:'hidden',marginBottom:10}}>
        <div style={{padding:'8px 10px',background:'#0e0e20',borderBottom:'1px solid #1e1e38',display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
          <MapPin size={12} color="#6366f1"/>
          <span style={{fontSize:12,fontWeight:600,color:'#e2e0f0'}}>India</span>
          <span style={{fontSize:10,color:'#55546a'}}>hover=details · click=select · zoom 6+ for cities</span>
          <div style={{flex:1}}/>
          <div style={{display:'flex',background:'#141430',border:'1px solid #252548',borderRadius:6,overflow:'hidden'}}>
            {[['sales','Sales'],['dealers','Dealers'],['achievement','Ach%']].map(([m,l])=>(
              <button key={m} onClick={()=>setViewMode(m)} style={{background:viewMode===m?'#6366f1':'transparent',color:viewMode===m?'#fff':'#55546a',border:'none',padding:'4px 8px',fontSize:11,fontWeight:600,cursor:'pointer',borderLeft:m!=='sales'?'1px solid #252548':'none'}}>{l}</button>
            ))}
          </div>
          {selected&&<button onClick={()=>setSelected(null)} style={{background:'none',border:'1px solid #252548',borderRadius:6,color:'#f87171',fontSize:11,padding:'4px 8px',cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><X size={10}/>Clear</button>}
        </div>

        <div style={{position:'relative'}}>
          <div ref={mapRef} style={{height:'clamp(260px,58vw,520px)',width:'100%'}}/>
          {(!leafletReady||!geoReady)&&(
            <div style={{position:'absolute',inset:0,background:'#0c0c1e',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10}}>
              <div style={{width:28,height:28,border:'3px solid #1e1e38',borderTop:'3px solid #6366f1',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
              <div style={{fontSize:12,color:'#55546a'}}>Loading map...</div>
            </div>
          )}
          <div style={{position:'absolute',bottom:10,left:8,background:'rgba(12,12,30,0.95)',borderRadius:7,padding:'5px 8px',border:'1px solid #1e1e38',zIndex:1000}}>
            <div style={{fontSize:7,color:'#55546a',marginBottom:3,textTransform:'uppercase'}}>{viewMode}</div>
            <div style={{display:'flex',gap:2}}>
              {[['#1e2050','None'],['#a5b4fc','Low'],['#6366f1','Mid'],['#3730a3','Top'],['#fbbf24','Sel']].map(([c,l])=>(
                <div key={l} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
                  <div style={{width:14,height:8,borderRadius:2,background:c,border:'1px solid #ffffff12'}}/>
                  <span style={{fontSize:6,color:'#55546a'}}>{l}</span>
                </div>
              ))}
            </div>
          </div>
          {leafletReady&&geoReady&&Object.keys(stateData).length===0&&(
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',textAlign:'center',pointerEvents:'none',zIndex:1000}}>
              <MapPin size={28} style={{margin:'0 auto 8px',opacity:.15,color:'#6366f1'}}/>
              <div style={{fontSize:12,color:'#55546a',background:'rgba(12,12,30,0.9)',padding:'6px 12px',borderRadius:7}}>Add "State" column to your sheet</div>
            </div>
          )}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:10}}>
        {selected&&det?(
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'10px 12px',background:'rgba(251,191,36,0.08)',borderBottom:'1px solid rgba(251,191,36,0.2)',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:'#fbbf24',flexShrink:0}}/>
              <span style={{fontSize:13,fontWeight:700,color:'#fbbf24',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selected}</span>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',color:'#55546a',cursor:'pointer'}}><X size={13}/></button>
            </div>
            <div style={{padding:12}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6,marginBottom:12}}>
                {[{l:'Sales',v:det.total,c:'#34d399'},{l:'Dealers',v:det.dealers.length,c:'#6366f1'},{l:'Target',v:det.target||'—',c:'var(--t2)'},{l:'Ach%',v:det.target?pct(det.target,det.total)+'%':'N/T',c:pclr(det.target?pct(det.target,det.total):null)}].map(k=>(
                  <div key={k.l} style={{background:'var(--bg2)',borderRadius:7,padding:'7px 8px'}}>
                    <div style={{fontSize:8,color:'var(--t3)',textTransform:'uppercase',marginBottom:2}}>{k.l}</div>
                    <div style={{fontSize:15,fontWeight:700,color:k.c}}>{k.v}</div>
                  </div>
                ))}
              </div>
              {Object.keys(det.bySM).length>0&&(
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:10,color:'var(--t3)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.07em'}}>By Salesman</div>
                  {Object.entries(det.bySM).sort((a,b)=>b[1].u-a[1].u).map(([smId,sm])=>{
                    const user=users[smId]; const bar=det.total?Math.round((sm.u/det.total)*100):0;
                    return(<div key={smId} style={{marginBottom:7}}>
                      <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                        {user&&<div style={{width:18,height:18,borderRadius:'50%',background:user.color+'22',color:user.color,border:`1px solid ${user.color}55`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,flexShrink:0}}>{user.ini}</div>}
                        <span style={{fontSize:11,color:'var(--t2)',flex:1}}>{user?.name||smId}</span>
                        <span style={{fontSize:12,fontWeight:700,color:user?.color||'#6366f1'}}>{sm.u}</span>
                      </div>
                      <div style={{height:3,background:'var(--b1)',borderRadius:2}}><div style={{height:'100%',width:bar+'%',background:user?.color||'#6366f1',borderRadius:2}}/></div>
                    </div>);
                  })}
                </div>
              )}
              <div style={{fontSize:10,color:'var(--t3)',marginBottom:5,textTransform:'uppercase',letterSpacing:'.07em'}}>Dealers ({det.dealers.length})</div>
              <div style={{maxHeight:220,overflowY:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:11}}>
                  <thead>
                    <tr style={{position:'sticky',top:0,background:'var(--bg1)',zIndex:2}}>
                      <th style={{textAlign:'left',padding:'4px 6px',color:'var(--t3)',fontSize:9,fontWeight:600,textTransform:'uppercase',borderBottom:'1px solid var(--b1)'}}>Dealer</th>
                      <th style={{textAlign:'left',padding:'4px 6px',color:'var(--t3)',fontSize:9,fontWeight:600,textTransform:'uppercase',borderBottom:'1px solid var(--b1)'}}>Category</th>
                      <th style={{textAlign:'left',padding:'4px 6px',color:'var(--t3)',fontSize:9,fontWeight:600,textTransform:'uppercase',borderBottom:'1px solid var(--b1)'}}>Type</th>
                      <th style={{textAlign:'right',padding:'4px 6px',color:'var(--t3)',fontSize:9,fontWeight:600,textTransform:'uppercase',borderBottom:'1px solid var(--b1)'}}>Sales</th>
                      <th style={{textAlign:'right',padding:'4px 6px',color:'var(--t3)',fontSize:9,fontWeight:600,textTransform:'uppercase',borderBottom:'1px solid var(--b1)'}}>Ach%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...det.dealers].sort((a,b)=>(b.months?.[selectedMonthIdx]||0)-(a.months?.[selectedMonthIdx]||0)).map(d=>{
                      const ach=d.months?.[selectedMonthIdx]||0;
                      const tgt=(d.monthTargets?.[selectedMonthIdx]??d.target)||0;
                      const dp=pct(tgt,ach);
                      const cat=d.category||Object.keys(d.categoryBreakdown||{})[0]||'';
                      const catType=d.categoryType||Object.keys(Object.values(d.categoryBreakdown||{})[0]||{})[0]||'';
                      return(
                        <tr key={d.id} onClick={()=>onOpenDealer?.(d.id)}
                          style={{cursor:'pointer',borderBottom:'1px solid var(--b1)'}}
                          onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{padding:'5px 6px',maxWidth:120}}>
                            <div style={{fontWeight:600,color:'var(--t1)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.name}</div>
                            {d.city&&<div style={{fontSize:9,color:'var(--t3)'}}>{d.city}</div>}
                          </td>
                          <td style={{padding:'5px 6px'}}>
                            {cat&&<span style={{fontSize:9,color:'#818cf8',background:'rgba(129,140,248,0.12)',padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap'}}>{cat}</span>}
                          </td>
                          <td style={{padding:'5px 6px'}}>
                            {catType&&<span style={{fontSize:9,color:'#a5b4fc',background:'rgba(165,180,252,0.08)',padding:'1px 5px',borderRadius:3,whiteSpace:'nowrap'}}>{catType}</span>}
                          </td>
                          <td style={{padding:'5px 6px',textAlign:'right',fontWeight:700,color:'#34d399',whiteSpace:'nowrap'}}>{ach}</td>
                          <td style={{padding:'5px 6px',textAlign:'right',fontSize:10,color:pclr(dp),whiteSpace:'nowrap'}}>{spct(tgt,ach)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ):(
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'10px 12px',borderBottom:'1px solid var(--b1)',display:'flex',alignItems:'center',gap:6}}>
              <Award size={13} color="#fbbf24"/>
              <span style={{fontSize:13,fontWeight:700,color:'var(--t2)'}}>Top States</span>
              <span style={{fontSize:11,color:'var(--t3)',marginLeft:2}}>— {MO[selectedMonthIdx]}</span>
            </div>
            <div style={{padding:'4px 0',maxHeight:300,overflowY:'auto'}}>
              {topStates.length===0?<div style={{padding:'16px',color:'var(--t3)',fontSize:12,textAlign:'center'}}>No state data</div>
              :topStates.map(({name,total,dealers:dl},i)=>{
                const bar=Math.round((total/(topStates[0]?.total||1))*100);
                return(<div key={name} onClick={()=>setSelected(s=>s===name?null:name)} style={{padding:'7px 12px',cursor:'pointer',background:selected===name?'rgba(99,102,241,0.08)':'transparent',borderLeft:`3px solid ${selected===name?'#6366f1':'transparent'}`,transition:'all .15s'}} onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'} onMouseLeave={e=>e.currentTarget.style.background=selected===name?'rgba(99,102,241,0.08)':'transparent'}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:10,color:'var(--t3)',width:14,textAlign:'right'}}>{i+1}</span>
                      <span style={{fontSize:12,fontWeight:600,color:selected===name?'var(--acc)':'var(--t1)'}}>{name}</span>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{fontSize:10,color:'var(--t3)'}}>{dl.length}d</span>
                      <span style={{fontSize:13,fontWeight:700,color:'#34d399'}}>{total}</span>
                    </div>
                  </div>
                  <div style={{height:3,background:'var(--b1)',borderRadius:2,marginLeft:20}}>
                    <div style={{height:'100%',width:bar+'%',background:'linear-gradient(90deg,#6366f1,#a5b4fc)',borderRadius:2,transition:'width .5s'}}/>
                  </div>
                </div>);
              })}
            </div>
          </div>
        )}

        <div className="card">
          <div style={{fontSize:10,fontWeight:600,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Summary</div>
          {[
            {l:'States covered',v:Object.keys(stateData).length,c:'#6366f1'},
            {l:'Total sales',v:Object.values(stateData).reduce((s,d)=>s+d.total,0),c:'#34d399'},
            {l:'Mapped dealers',v:dealers.length-unmapped,c:'var(--t2)'},
            {l:'Unmapped',v:unmapped,c:unmapped>0?'#fbbf24':'var(--t3)'},
          ].map(k=>(
            <div key={k.l} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid var(--b1)',fontSize:12}}>
              <span style={{color:'var(--t3)'}}>{k.l}</span>
              <span style={{fontWeight:700,color:k.c}}>{k.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}