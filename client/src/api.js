// // const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

// // // Token management
// // export const getToken = () => localStorage.getItem('stp_jwt');

// // export const saveToken = (token) => {
// //   if(token) localStorage.setItem('stp_jwt', token);
// //   else localStorage.removeItem('stp_jwt');
// // };
// // // const getToken = () => localStorage.getItem('stp_jwt');

// // const headers = (extra={}) => ({
// //   'Content-Type': 'application/json',
// //   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
// //   ...extra,
// // });

// // const handle = async (res) => {
// //   const data = await res.json().catch(()=>({ error:'Invalid response' }));
// //   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
// //   return data;
// // };

// // export const api = {
// //   health:  () => fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

// //   // Auth
// //   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:headers(),body:JSON.stringify({id,pass})}).then(handle),
// //   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:headers()}).then(handle),
// //   updateUser:(id,data)=> fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:headers(),body:JSON.stringify(data)}).then(handle),

// //   // Dealers
// //   getDealers:   ()      => fetch(`${BASE}/dealers`,{headers:headers()}).then(handle),
// //   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:headers(),body:JSON.stringify(d)}).then(handle),
// //   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:headers(),body:JSON.stringify(d)}).then(handle),
// //   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:headers()}).then(handle),
// //   bulkUpdateInfo:(file,salesman) => {
// //     const fd = new FormData();
// //     fd.append('file', file);
// //     if(salesman) fd.append('salesman', salesman);
// //     return fetch(`${BASE}/dealers/bulk-update`,{ method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:fd }).then(handle);
// //   },

// //   uploadMonth:  (file,month,salesman) => {
// //     const fd = new FormData();
// //     fd.append('file', file);
// //     fd.append('month', month);
// //     if(salesman) fd.append('salesman', salesman);
// //     return fetch(`${BASE}/dealers/upload`,{ method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:fd }).then(handle);
// //   },

// //   // Notes
// //   getNotes:   ()       => fetch(`${BASE}/notes`,{headers:headers()}).then(handle),
// //   addNote:    (n)      => fetch(`${BASE}/notes`,{method:'POST',headers:headers(),body:JSON.stringify(n)}).then(handle),
// //   updateNote: (id,n)   => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:headers(),body:JSON.stringify(n)}).then(handle),
// //   deleteNote: (id)     => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:headers()}).then(handle),

// //   // Outstanding
// //   getOutstanding:    ()        => fetch(`${BASE}/outstanding`,{headers:headers()}).then(handle),
// //   uploadOutstanding: (file)    => {
// //     const fd = new FormData();
// //     fd.append('file', file);
// //     return fetch(`${BASE}/outstanding/upload`,{ method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:fd }).then(handle);
// //   },
// //   // Month config (stored in DB so all users share same months)
// //   getMonthConfig:  ()      => fetch(`${BASE}/settings/months`,{headers:headers()}).then(handle).catch(()=>null),
// //   saveMonthConfig: (cfg)   => fetch(`${BASE}/settings/months`,{method:'POST',headers:headers(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),

// //   updateOutstanding: (name,month,amount) =>
// //     fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:headers(),body:JSON.stringify({month,amount})}).then(handle),
// // };

// // // Convert DB dealer → app format (monthlyData Map → months array)
// // export const dbDealerToApp = (d, MO) => {
// //   const md = d.monthlyData || {};
// //   const months = MO.map(m => {
// //     const entry = md[m] || md.get?.(m);
// //     return (entry?.achieved) || 0;
// //   });
// //   const monthTargets = {};
// //   MO.forEach((m,i) => {
// //     const entry = md[m] || md.get?.(m);
// //     if(entry?.target) monthTargets[i] = entry.target;
// //   });
// //   const categoryBreakdown = {};
// //   if(d.category || d.categoryType){
// //     const ck = d.category||'(No Cat)', sk = d.categoryType||'(No Sub)';
// //     categoryBreakdown[ck] = { [sk]: [...months] };
// //   }
// //   return {
// //     id:           d._id?.toString() || d.id,
// //     name:         d.name,
// //     salesman:     d.salesman,
// //     city:         d.city||'',
// //     state:        d.state||'',
// //     zone:         d.zone||'',
// //     status:       d.status||'ACTIVE',
// //     category:     d.category||'',
// //     categoryType: d.categoryType||'',
// //     target:       d.target||0,
// //     avg6m:        d.avg6m||0,
// //     creditDays:   d.creditDays||0,
// //     creditLimit:  d.creditLimit||0,
// //     months,
// //     monthTargets,
// //     achieved:     months[months.length-1]||0,
// //     categoryBreakdown,
// //     source:       d.source||'db',
// //   };
// // };

// // // Convert DB outstanding → app format
// // export const dbOutstandingToApp = (records=[]) => {
// //   return records.map(r => {
// //     const raw = r.monthlyOutstanding || {};
// //     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
// //     const vals    = Object.values(monthlyOutstanding).map(Number);
// //     const monthCols = Object.keys(monthlyOutstanding);
// //     const latestOutstanding = vals[vals.length-1]||0;
// //     const maxOutstanding    = Math.max(...vals, 0);
// //     const trend = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
// //     return {
// //       id:   r._id?.toString() || r.id,
// //       name: r.dealerName,
// //       latestOutstanding, maxOutstanding, monthlyOutstanding, monthCols, trend,
// //       status: latestOutstanding===0 ? 'CLEARED' : 'OUTSTANDING',
// //     };
// //   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// // };



// // const BASE = (typeof import !== 'undefined' && import.meta?.env?.VITE_API_URL) || 'http://localhost:5000/api';
// // const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';
// // export const saveToken = (token) => {
// //   if(token) localStorage.setItem('stp_jwt', token);
// //   else localStorage.removeItem('stp_jwt');
// // };
// // export const getToken = () => localStorage.getItem('stp_jwt');

// // const authHeaders = (extra={}) => ({
// //   'Content-Type': 'application/json',
// //   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
// //   ...extra,
// // });

// // const handle = async (res) => {
// //   const data = await res.json().catch(()=>({ error:'Invalid JSON response' }));
// //   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
// //   return data;
// // };

// // export const api = {
// //   health:  () => fetch(`${BASE}/health`, { signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

// //   // Auth
// //   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
// //   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
// //   updateUser:(id,data)=> fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(data)}).then(handle),
// //   changePassword:(oldPass,newPass)=>fetch(`${BASE}/auth/change-password`,{method:'POST',headers:authHeaders(),body:JSON.stringify({oldPass,newPass})}).then(handle),

// //   // Dealers - pass MO as query param so server returns months in right order
// //   getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
// //   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
// //   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
// //   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
// //   syncToDB:     (dealers,MO)=>fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),
// //   bulkUpdateInfo:(file,salesman)=>{
// //     const fd=new FormData(); fd.append('file',file);
// //     if(salesman) fd.append('salesman',salesman);
// //     return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
// //   },
// //   uploadMonth:(file,month,salesman)=>{
// //     const fd=new FormData(); fd.append('file',file); fd.append('month',month);
// //     if(salesman) fd.append('salesman',salesman);
// //     return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
// //   },

// //   // Notes
// //   getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
// //   addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
// //   updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
// //   deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

// //   // Outstanding
// //   getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
// //   uploadOutstanding: (file) => { const fd=new FormData(); fd.append('file',file); return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle); },
// //   updateOutstanding: (name,month,amount)=>fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),

// //   // Settings (month config)
// //   getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
// //   saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),
// // };

// // // Convert DB dealer → app format
// // // monthlyData is a Map keyed by month label e.g. 'Jun-26'
// // export const dbDealerToApp = (d, MO=[]) => {
// //   const md = d.monthlyData || {};

// //   // Build months array ordered by MO
// //   const months = MO.map(m => {
// //     const entry = md[m] || (md.get && md.get(m));
// //     return Number(entry?.achieved) || 0;
// //   });

// //   // Build monthTargets per MO index
// //   const monthTargets = {};
// //   MO.forEach((m,i) => {
// //     const entry = md[m] || (md.get && md.get(m));
// //     if(entry?.target) monthTargets[i] = Number(entry.target);
// //   });

// //   // Last known achieved = most recent month with data
// //   const achieved = [...months].reverse().find(v=>v>0) || 0;

// //   // Target = most recent month's target or fallback to dealer.target
// //   const latestMonthTarget = [...Object.entries(monthTargets)].pop();
// //   const target = latestMonthTarget ? latestMonthTarget[1] : (d.target||0);

// //   const categoryBreakdown = {};
// //   if(d.category || d.categoryType){
// //     const ck=d.category||'(No Cat)', sk=d.categoryType||'(No Sub)';
// //     categoryBreakdown[ck]={[sk]:[...months]};
// //   }

// //   return {
// //     id:           d._id?.toString() || d.id,
// //     name:         d.name,
// //     salesman:     d.salesman,
// //     city:         d.city||'',
// //     state:        d.state||'',
// //     zone:         d.zone||'',
// //     status:       d.status||'ACTIVE',
// //     category:     d.category||'',
// //     categoryType: d.categoryType||'',
// //     target,
// //     avg6m:        d.avg6m||0,
// //     creditDays:   d.creditDays||0,
// //     creditLimit:  d.creditLimit||0,
// //     months,
// //     monthTargets,
// //     achieved,
// //     categoryBreakdown,
// //     source:       d.source||'db',
// //     _raw:         d, // keep raw for updates
// //   };
// // };

// // export const dbOutstandingToApp = (records=[]) => {
// //   return records.map(r => {
// //     const raw = r.monthlyOutstanding || {};
// //     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
// //     const vals    = Object.values(monthlyOutstanding).map(Number);
// //     const monthCols = Object.keys(monthlyOutstanding);
// //     const latestOutstanding = vals[vals.length-1]||0;
// //     const maxOutstanding    = Math.max(...vals,0);
// //     const trend = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
// //     return {
// //       id:   r._id?.toString()||r.id,
// //       name: r.dealerName,
// //       latestOutstanding, maxOutstanding, monthlyOutstanding, monthCols, trend,
// //       status: latestOutstanding===0?'CLEARED':'OUTSTANDING',
// //     };
// //   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// // };

// // const BASE = import.meta.env?.VITE_API_URL || '/api';

// // export const saveToken = (token) => {
// //   if(token) localStorage.setItem('stp_jwt', token);
// //   else localStorage.removeItem('stp_jwt');
// // };
// // export const getToken = () => localStorage.getItem('stp_jwt');

// // const authHeaders = (extra={}) => ({
// //   'Content-Type': 'application/json',
// //   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
// //   ...extra,
// // });

// // const handle = async (res) => {
// //   const text = await res.text().catch(()=>'');
// //   let data;
// //   try { data = JSON.parse(text); } 
// //   catch(e) { 
// //     console.error('[API] Non-JSON response:', res.status, text.slice(0,200));
// //     throw new Error(`Server error ${res.status}: ${text.slice(0,100)||'No response'}`); 
// //   }
// //   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
// //   return data;
// // };

// // export const api = {
// //   health:  () => fetch(`${BASE}/health`, { signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

// //   // Auth
// //   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
// //   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
// //   updateUser:(id,data)=> fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(data)}).then(handle),
// //   changePassword:(oldPass,newPass)=>fetch(`${BASE}/auth/change-password`,{method:'POST',headers:authHeaders(),body:JSON.stringify({oldPass,newPass})}).then(handle),

// //   // Dealers - pass MO as query param so server returns months in right order
// //   getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
// //   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
// //   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
// //   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
// //   syncToDB:     (dealers,MO)=>fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),
// //   bulkUpdateInfo:(file,salesman)=>{
// //     const fd=new FormData(); fd.append('file',file);
// //     if(salesman) fd.append('salesman',salesman);
// //     return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
// //   },
// //   uploadMonth:(file,month,salesman)=>{
// //     const fd=new FormData(); fd.append('file',file); fd.append('month',month);
// //     if(salesman) fd.append('salesman',salesman);
// //     return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
// //   },

// //   // Notes
// //   getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
// //   addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
// //   updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
// //   deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

// //   // Outstanding
// //   getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
// //   uploadOutstanding: (file) => { const fd=new FormData(); fd.append('file',file); return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle); },
// //   updateOutstanding: (name,month,amount)=>fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),

// //   // Settings (month config)
// //   getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
// //   saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),
// // };

// // // Convert DB dealer → app format
// // // monthlyData is a Map keyed by month label e.g. 'Jun-26'
// // export const dbDealerToApp = (d, MO=[]) => {
// //   // monthlyData keyed by month label: { 'Jun-26': { achieved:320, target:500 }, ... }
// //   const md = d.monthlyData || {};

// //   // months[] indexed by MO position — strictly per-month achieved
// //   const months = MO.map(m => Number(md[m]?.achieved) || 0);

// //   // monthTargets{} keyed by MO index — strictly per-month target
// //   const monthTargets = {};
// //   MO.forEach((m,i) => {
// //     const t = Number(md[m]?.target);
// //     if(t > 0) monthTargets[i] = t;
// //   });

// //   // Per-month status — keyed by MO index
// //   const monthStatus = {};
// //   MO.forEach((m,i) => {
// //     if(md[m]?.status) monthStatus[i] = md[m].status;
// //   });

// //   // Per-month zone — keyed by MO index
// //   const monthZone = {};
// //   MO.forEach((m,i) => {
// //     if(md[m]?.zone) monthZone[i] = md[m].zone;
// //   });

// //   const categoryBreakdown = {};
// //   if(d.category||d.categoryType){
// //     const ck=d.category||'(No Cat)', sk=d.categoryType||'(No Sub)';
// //     categoryBreakdown[ck]={[sk]:[...months]};
// //   }

// //   return {
// //     id:            d._id?.toString()||d.id,
// //     name:          d.name,
// //     salesman:      d.salesman,
// //     city:          d.city||'',
// //     state:         d.state||'',
// //     zone:          d.zone||'',
// //     status:        d.status||'ACTIVE',
// //     category:      d.category||'',
// //     categoryType:  d.categoryType||'',
// //     target:        d.target||0,   // global default (used as fallback in edit form only)
// //     avg6m:         d.avg6m||0,
// //     creditDays:    d.creditDays||0,
// //     creditLimit:   d.creditLimit||0,
// //     months,                        // per-month achieved[]
// //     monthTargets,                  // per-month target{}
// //     monthStatus,                   // per-month status{}
// //     monthZone,                     // per-month zone{}
// //     achieved:      [...months].reverse().find(v=>v>0)||0,
// //     categoryBreakdown,
// //     source:        d.source||'db',
// //     monthlyData:   md,
// //   };
// // };

// // export const dbOutstandingToApp = (records=[]) => {
// //   return records.map(r => {
// //     const raw = r.monthlyOutstanding || {};
// //     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
// //     const vals    = Object.values(monthlyOutstanding).map(Number);
// //     const monthCols = Object.keys(monthlyOutstanding);
// //     const latestOutstanding = vals[vals.length-1]||0;
// //     const maxOutstanding    = Math.max(...vals,0);
// //     const trend = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
// //     return {
// //       id:   r._id?.toString()||r.id,
// //       name: r.dealerName,
// //       latestOutstanding, maxOutstanding, monthlyOutstanding, monthCols, trend,
// //       status: latestOutstanding===0?'CLEARED':'OUTSTANDING',
// //     };
// //   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// // };
// // Use VITE_API_URL if set (production), else try proxy (/api), else direct
// // const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

// // export const saveToken = (token) => {
// //   if(token) localStorage.setItem('stp_jwt', token);
// //   else localStorage.removeItem('stp_jwt');
// // };
// // export const getToken = () => localStorage.getItem('stp_jwt');

// // const authHeaders = (extra={}) => ({
// //   'Content-Type': 'application/json',
// //   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
// //   ...extra,
// // });

// // const handle = async (res) => {
// //   const text = await res.text().catch(()=>'');
// //   let data;
// //   try { data = JSON.parse(text); } 
// //   catch(e) { 
// //     console.error('[API] Non-JSON response:', res.status, text.slice(0,200));
// //     throw new Error(`Server error ${res.status}: ${text.slice(0,100)||'No response'}`); 
// //   }
// //   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
// //   return data;
// // };

// // export const api = {
// //   health:  () => fetch(`${BASE}/health`, { signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

// //   // Auth
// //   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
// //   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
// //   updateUser:(id,data)=> fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(data)}).then(handle),
// //   changePassword:(oldPass,newPass)=>fetch(`${BASE}/auth/change-password`,{method:'POST',headers:authHeaders(),body:JSON.stringify({oldPass,newPass})}).then(handle),

// //   // Dealers - pass MO as query param so server returns months in right order
// //   getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
// //   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
// //   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
// //   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
// //   syncToDB:     (dealers,MO)=>fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),
// //   bulkUpdateInfo:(file,salesman)=>{
// //     const fd=new FormData(); fd.append('file',file);
// //     if(salesman) fd.append('salesman',salesman);
// //     return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
// //   },
// //   uploadMonth:(file,month,salesman)=>{
// //     const fd=new FormData(); fd.append('file',file); fd.append('month',month);
// //     if(salesman) fd.append('salesman',salesman);
// //     return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
// //   },

// //   // Notes
// //   getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
// //   addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
// //   updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
// //   deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

// //   // Outstanding
// //   getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
// //   uploadOutstanding: (file) => { const fd=new FormData(); fd.append('file',file); return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle); },
// //   updateOutstanding: (name,month,amount)=>fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),

// //   // Settings (month config)
// //   getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
// //   saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),
// // };

// // // Convert DB dealer → app format
// // // monthlyData is a Map keyed by month label e.g. 'Jun-26'
// // export const dbDealerToApp = (d, MO=[]) => {
// //   // monthlyData keyed by month label: { 'Jun-26': { achieved:320, target:500 }, ... }
// //   const md = d.monthlyData || {};

// //   // months[] indexed by MO position — strictly per-month achieved
// //   const months = MO.map(m => Number(md[m]?.achieved) || 0);

// //   // monthTargets{} keyed by MO index — strictly per-month target
// //   const monthTargets = {};
// //   MO.forEach((m,i) => {
// //     const t = Number(md[m]?.target);
// //     if(t > 0) monthTargets[i] = t;
// //   });

// //   // Per-month status — keyed by MO index
// //   const monthStatus = {};
// //   MO.forEach((m,i) => {
// //     if(md[m]?.status) monthStatus[i] = md[m].status;
// //   });

// //   // Per-month zone — keyed by MO index
// //   const monthZone = {};
// //   MO.forEach((m,i) => {
// //     if(md[m]?.zone) monthZone[i] = md[m].zone;
// //   });

// //   const categoryBreakdown = {};
// //   if(d.category||d.categoryType){
// //     const ck=d.category||'(No Cat)', sk=d.categoryType||'(No Sub)';
// //     categoryBreakdown[ck]={[sk]:[...months]};
// //   }

// //   return {
// //     id:            d._id?.toString()||d.id,
// //     name:          d.name,
// //     salesman:      d.salesman,
// //     city:          d.city||'',
// //     state:         d.state||'',
// //     zone:          d.zone||'',
// //     status:        d.status||'ACTIVE',
// //     category:      d.category||'',
// //     categoryType:  d.categoryType||'',
// //     target:        d.target||0,   // global default (used as fallback in edit form only)
// //     avg6m:         d.avg6m||0,
// //     creditDays:    d.creditDays||0,
// //     creditLimit:   d.creditLimit||0,
// //     months,                        // per-month achieved[]
// //     monthTargets,                  // per-month target{}
// //     monthStatus,                   // per-month status{}
// //     monthZone,                     // per-month zone{}
// //     achieved:      [...months].reverse().find(v=>v>0)||0,
// //     categoryBreakdown,
// //     source:        d.source||'db',
// //     monthlyData:   md,
// //   };
// // };

// // export const dbOutstandingToApp = (records=[]) => {
// //   return records.map(r => {
// //     const raw = r.monthlyOutstanding || {};
// //     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
// //     const vals    = Object.values(monthlyOutstanding).map(Number);
// //     const monthCols = Object.keys(monthlyOutstanding);
// //     const latestOutstanding = vals[vals.length-1]||0;
// //     const maxOutstanding    = Math.max(...vals,0);
// //     const trend = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
// //     return {
// //       id:   r._id?.toString()||r.id,
// //       name: r.dealerName,
// //       latestOutstanding, maxOutstanding, monthlyOutstanding, monthCols, trend,
// //       status: latestOutstanding===0?'CLEARED':'OUTSTANDING',
// //     };
// //   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// // };


// // const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

// // export const saveToken = (token) => {
// //   if(token) localStorage.setItem('stp_jwt', token);
// //   else localStorage.removeItem('stp_jwt');
// // };
// // export const getToken = () => localStorage.getItem('stp_jwt');

// // const authHeaders = () => ({
// //   'Content-Type': 'application/json',
// //   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
// // });

// // const handle = async (res) => {
// //   const text = await res.text().catch(()=>'');
// //   let data;
// //   try { data = JSON.parse(text); }
// //   catch(e) {
// //     console.error('[API] Non-JSON:', res.status, res.url, text.slice(0,300));
// //     throw new Error(`Server error ${res.status}: ${text.slice(0,150)||'No response'}`);
// //   }
// //   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
// //   return data;
// // };

// // export const api = {
// //   health: () => fetch(`${BASE}/health`,{ signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

// //   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
// //   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
// //   updateUser:(id,d)   => fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),

// //   getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
// //   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
// //   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
// //   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
// //   syncToDB:     (dealers,MO) => fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),

// //   uploadMonth: (file,month,salesman) => {
// //     const fd = new FormData();
// //     fd.append('file',file); fd.append('month',month);
// //     if(salesman) fd.append('salesman',salesman);
// //     return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
// //   },
// //   bulkUpdateInfo: (file,salesman) => {
// //     const fd = new FormData();
// //     fd.append('file',file);
// //     if(salesman) fd.append('salesman',salesman);
// //     return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
// //   },

// //   getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
// //   addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
// //   updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
// //   deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

// //   getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
// //   uploadOutstanding: (file) => {
// //     const fd = new FormData(); fd.append('file',file);
// //     return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
// //   },
// //   updateOutstanding: (name,month,amount) =>
// //     fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),

// //   getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
// //   saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),
// // };

// // // ─────────────────────────────────────────────────────────────────────────────
// // // Convert DB dealer → app format
// // // KEY RULE: each month is INDEPENDENT
// // // months[i]       = achieved for MO[i]  → 0 if not uploaded for that month
// // // monthTargets[i] = target  for MO[i]   → undefined if not uploaded for that month
// // // monthStatus[i]  = status  for MO[i]   → undefined if not uploaded
// // // monthZone[i]    = zone    for MO[i]   → undefined if not uploaded
// // // ─────────────────────────────────────────────────────────────────────────────
// // export const dbDealerToApp = (d, MO=[]) => {
// //   const md = d.monthlyData || {};

// //   const months      = MO.map(m => Number(md[m]?.achieved)||0);
// //   const monthTargets= {};
// //   const monthStatus = {};
// //   const monthZone   = {};
// //   const monthCat    = {};
// //   const monthCatType= {};
// //   const monthCity   = {};
// //   const monthState  = {};

// //   MO.forEach((m,i) => {
// //     const e = md[m];
// //     if(!e) return; // month not uploaded — leave all undefined
// //     if(e.target      > 0)  monthTargets[i] = Number(e.target);
// //     if(e.status)           monthStatus[i]  = e.status;
// //     if(e.zone)             monthZone[i]    = e.zone;
// //     if(e.category)         monthCat[i]     = e.category;
// //     if(e.categoryType)     monthCatType[i] = e.categoryType;
// //     if(e.city)             monthCity[i]    = e.city;
// //     if(e.state)            monthState[i]   = e.state;
// //   });

// //   // monthsWithData = set of MO indices that have been uploaded
// //   const monthsWithData = new Set(
// //     MO.map((m,i) => (md[m]?.achieved>0||md[m]?.target>0) ? i : -1).filter(i=>i>=0)
// //   );

// //   return {
// //     id:            d._id?.toString()||d.id||d.id,
// //     name:          d.name,
// //     salesman:      d.salesman,
// //     // Global fallback info
// //     city:          d.city||'',
// //     state:         d.state||'',
// //     zone:          d.zone||'',
// //     status:        d.status||'ACTIVE',
// //     category:      d.category||'',
// //     categoryType:  d.categoryType||'',
// //     target:        d.target||0,
// //     avg6m:         d.avg6m||0,
// //     creditDays:    d.creditDays||0,
// //     creditLimit:   d.creditLimit||0,
// //     // Per-month arrays
// //     months,
// //     monthTargets,
// //     monthStatus,
// //     monthZone,
// //     monthCat,
// //     monthCatType,
// //     monthCity,
// //     monthState,
// //     monthsWithData,
// //     monthlyData:   md,
// //     achieved:      [...months].reverse().find(v=>v>0)||0,
// //     categoryBreakdown: {},
// //     source:        d.source||'db',
// //   };
// // };

// // export const dbOutstandingToApp = (records=[]) => {
// //   return records.map(r => {
// //     const raw = r.monthlyOutstanding||{};
// //     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
// //     const vals     = Object.values(monthlyOutstanding).map(Number);
// //     const monthCols= Object.keys(monthlyOutstanding);
// //     const latest   = vals[vals.length-1]||0;
// //     const trend    = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
// //     return {
// //       id:   r._id?.toString()||r.id,
// //       name: r.dealerName,
// //       latestOutstanding: latest,
// //       maxOutstanding:    Math.max(...vals,0),
// //       monthlyOutstanding,
// //       monthCols,
// //       trend,
// //       status: latest===0 ? 'CLEARED' : 'OUTSTANDING',
// //     };
// //   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// // };


// const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

// export const saveToken = (token) => {
//   if(token) localStorage.setItem('stp_jwt', token);
//   else localStorage.removeItem('stp_jwt');
// };
// export const getToken = () => localStorage.getItem('stp_jwt');

// const authHeaders = () => ({
//   'Content-Type': 'application/json',
//   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
// });

// const handle = async (res) => {
//   const text = await res.text().catch(()=>'');
//   let data;
//   try { data = JSON.parse(text); }
//   catch(e) {
//     console.error('[API] Non-JSON:', res.status, res.url, text.slice(0,300));
//     throw new Error(`Server error ${res.status}: ${text.slice(0,150)||'No response'}`);
//   }
//   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//   return data;
// };

// export const api = {
//   health: () => fetch(`${BASE}/health`,{ signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

//   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
//   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
//   updateUser:(id,d)   => fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),

//   getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
//   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
//   syncToDB:     (dealers,MO) => fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),

//   uploadMonth: (file,month,salesman) => {
//     const fd = new FormData();
//     fd.append('file',file); fd.append('month',month);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },
//   bulkUpdateInfo: (file,salesman) => {
//     const fd = new FormData();
//     fd.append('file',file);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },

//   getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
//   addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

//   getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
//   uploadOutstanding: (file) => {
//     const fd = new FormData(); fd.append('file',file);
//     return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },
//   updateOutstanding: (name,month,amount) =>
//     fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),

//   // Outstanding Followups
//   getFollowups:    ()      => fetch(`${BASE}/followups`,{headers:authHeaders()}).then(handle),
//   addFollowup:     (d)     => fetch(`${BASE}/followups`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   updateFollowup:  (id,d)  => fetch(`${BASE}/followups/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   deleteFollowup:  (id)    => fetch(`${BASE}/followups/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

//   getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
//   saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Convert DB dealer → app format
// // KEY RULE: each month is INDEPENDENT
// // months[i]       = achieved for MO[i]  → 0 if not uploaded for that month
// // monthTargets[i] = target  for MO[i]   → undefined if not uploaded for that month
// // monthStatus[i]  = status  for MO[i]   → undefined if not uploaded
// // monthZone[i]    = zone    for MO[i]   → undefined if not uploaded
// // ─────────────────────────────────────────────────────────────────────────────
// export const dbDealerToApp = (d, MO=[]) => {
//   const md = d.monthlyData || {};

//   const months      = MO.map(m => Number(md[m]?.achieved)||0);
//   const monthTargets= {};
//   const monthStatus = {};
//   const monthZone   = {};
//   const monthCat    = {};
//   const monthCatType= {};
//   const monthCity   = {};
//   const monthState  = {};

//   MO.forEach((m,i) => {
//     const e = md[m];
//     if(!e) return; // month not uploaded — leave all undefined
//     if(e.target      > 0)  monthTargets[i] = Number(e.target);
//     if(e.status)           monthStatus[i]  = e.status;
//     if(e.zone)             monthZone[i]    = e.zone;
//     if(e.category)         monthCat[i]     = e.category;
//     if(e.categoryType)     monthCatType[i] = e.categoryType;
//     if(e.city)             monthCity[i]    = e.city;
//     if(e.state)            monthState[i]   = e.state;
//   });

//   // monthsWithData = set of MO indices that have been uploaded
//   const monthsWithData = new Set(
//     MO.map((m,i) => (md[m]?.achieved>0||md[m]?.target>0) ? i : -1).filter(i=>i>=0)
//   );

//   return {
//     id:            d._id?.toString()||d.id||d.id,
//     name:          d.name,
//     salesman:      d.salesman,
//     // Global fallback info
//     city:          d.city||'',
//     state:         d.state||'',
//     zone:          d.zone||'',
//     status:        d.status||'ACTIVE',
//     category:      d.category||'',
//     categoryType:  d.categoryType||'',
//     target:        d.target||0,
//     avg6m:         d.avg6m||0,
//     creditDays:    d.creditDays||0,
//     creditLimit:   d.creditLimit||0,
//     // Per-month arrays
//     months,
//     monthTargets,
//     monthStatus,
//     monthZone,
//     monthCat,
//     monthCatType,
//     monthCity,
//     monthState,
//     monthsWithData,
//     monthlyData:   md,
//     achieved:      [...months].reverse().find(v=>v>0)||0,
//     categoryBreakdown: {},
//     source:        d.source||'db',
//   };
// };

// export const dbOutstandingToApp = (records=[]) => {
//   return records.map(r => {
//     const raw = r.monthlyOutstanding||{};
//     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
//     const vals     = Object.values(monthlyOutstanding).map(Number);
//     const monthCols= Object.keys(monthlyOutstanding);
//     const latest   = vals[vals.length-1]||0;
//     const trend    = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
//     return {
//       id:   r._id?.toString()||r.id,
//       name: r.dealerName,
//       latestOutstanding: latest,
//       maxOutstanding:    Math.max(...vals,0),
//       monthlyOutstanding,
//       monthCols,
//       trend,
//       status: latest===0 ? 'CLEARED' : 'OUTSTANDING',
//     };
//   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// };


// sample confrugration
// const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';

// // Token management
// export const getToken = () => localStorage.getItem('stp_jwt');

// export const saveToken = (token) => {
//   if(token) localStorage.setItem('stp_jwt', token);
//   else localStorage.removeItem('stp_jwt');
// };
// // const getToken = () => localStorage.getItem('stp_jwt');

// const headers = (extra={}) => ({
//   'Content-Type': 'application/json',
//   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
//   ...extra,
// });

// const handle = async (res) => {
//   const data = await res.json().catch(()=>({ error:'Invalid response' }));
//   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//   return data;
// };

// export const api = {
//   health:  () => fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

//   // Auth
//   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:headers(),body:JSON.stringify({id,pass})}).then(handle),
//   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:headers()}).then(handle),
//   updateUser:(id,data)=> fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:headers(),body:JSON.stringify(data)}).then(handle),

//   // Dealers
//   getDealers:   ()      => fetch(`${BASE}/dealers`,{headers:headers()}).then(handle),
//   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:headers(),body:JSON.stringify(d)}).then(handle),
//   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:headers(),body:JSON.stringify(d)}).then(handle),
//   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:headers()}).then(handle),
//   bulkUpdateInfo:(file,salesman) => {
//     const fd = new FormData();
//     fd.append('file', file);
//     if(salesman) fd.append('salesman', salesman);
//     return fetch(`${BASE}/dealers/bulk-update`,{ method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:fd }).then(handle);
//   },

//   uploadMonth:  (file,month,salesman) => {
//     const fd = new FormData();
//     fd.append('file', file);
//     fd.append('month', month);
//     if(salesman) fd.append('salesman', salesman);
//     return fetch(`${BASE}/dealers/upload`,{ method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:fd }).then(handle);
//   },

//   // Notes
//   getNotes:   ()       => fetch(`${BASE}/notes`,{headers:headers()}).then(handle),
//   addNote:    (n)      => fetch(`${BASE}/notes`,{method:'POST',headers:headers(),body:JSON.stringify(n)}).then(handle),
//   updateNote: (id,n)   => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:headers(),body:JSON.stringify(n)}).then(handle),
//   deleteNote: (id)     => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:headers()}).then(handle),

//   // Outstanding
//   getOutstanding:    ()        => fetch(`${BASE}/outstanding`,{headers:headers()}).then(handle),
//   uploadOutstanding: (file)    => {
//     const fd = new FormData();
//     fd.append('file', file);
//     return fetch(`${BASE}/outstanding/upload`,{ method:'POST', headers:{ Authorization:`Bearer ${getToken()}` }, body:fd }).then(handle);
//   },
//   // Month config (stored in DB so all users share same months)
//   getMonthConfig:  ()      => fetch(`${BASE}/settings/months`,{headers:headers()}).then(handle).catch(()=>null),
//   saveMonthConfig: (cfg)   => fetch(`${BASE}/settings/months`,{method:'POST',headers:headers(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),

//   updateOutstanding: (name,month,amount) =>
//     fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:headers(),body:JSON.stringify({month,amount})}).then(handle),
// };

// // Convert DB dealer → app format (monthlyData Map → months array)
// export const dbDealerToApp = (d, MO) => {
//   const md = d.monthlyData || {};
//   const months = MO.map(m => {
//     const entry = md[m] || md.get?.(m);
//     return (entry?.achieved) || 0;
//   });
//   const monthTargets = {};
//   MO.forEach((m,i) => {
//     const entry = md[m] || md.get?.(m);
//     if(entry?.target) monthTargets[i] = entry.target;
//   });
//   const categoryBreakdown = {};
//   if(d.category || d.categoryType){
//     const ck = d.category||'(No Cat)', sk = d.categoryType||'(No Sub)';
//     categoryBreakdown[ck] = { [sk]: [...months] };
//   }
//   return {
//     id:           d._id?.toString() || d.id,
//     name:         d.name,
//     salesman:     d.salesman,
//     city:         d.city||'',
//     state:        d.state||'',
//     zone:         d.zone||'',
//     status:       d.status||'ACTIVE',
//     category:     d.category||'',
//     categoryType: d.categoryType||'',
//     target:       d.target||0,
//     avg6m:        d.avg6m||0,
//     creditDays:   d.creditDays||0,
//     creditLimit:  d.creditLimit||0,
//     months,
//     monthTargets,
//     achieved:     months[months.length-1]||0,
//     categoryBreakdown,
//     source:       d.source||'db',
//   };
// };

// // Convert DB outstanding → app format
// export const dbOutstandingToApp = (records=[]) => {
//   return records.map(r => {
//     const raw = r.monthlyOutstanding || {};
//     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
//     const vals    = Object.values(monthlyOutstanding).map(Number);
//     const monthCols = Object.keys(monthlyOutstanding);
//     const latestOutstanding = vals[vals.length-1]||0;
//     const maxOutstanding    = Math.max(...vals, 0);
//     const trend = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
//     return {
//       id:   r._id?.toString() || r.id,
//       name: r.dealerName,
//       latestOutstanding, maxOutstanding, monthlyOutstanding, monthCols, trend,
//       status: latestOutstanding===0 ? 'CLEARED' : 'OUTSTANDING',
//     };
//   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// };



// const BASE = (typeof import !== 'undefined' && import.meta?.env?.VITE_API_URL) || 'http://localhost:5000/api';
// const BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';
// export const saveToken = (token) => {
//   if(token) localStorage.setItem('stp_jwt', token);
//   else localStorage.removeItem('stp_jwt');
// };
// export const getToken = () => localStorage.getItem('stp_jwt');

// const authHeaders = (extra={}) => ({
//   'Content-Type': 'application/json',
//   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
//   ...extra,
// });

// const handle = async (res) => {
//   const data = await res.json().catch(()=>({ error:'Invalid JSON response' }));
//   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//   return data;
// };

// export const api = {
//   health:  () => fetch(`${BASE}/health`, { signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

//   // Auth
//   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
//   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
//   updateUser:(id,data)=> fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(data)}).then(handle),
//   changePassword:(oldPass,newPass)=>fetch(`${BASE}/auth/change-password`,{method:'POST',headers:authHeaders(),body:JSON.stringify({oldPass,newPass})}).then(handle),

//   // Dealers - pass MO as query param so server returns months in right order
//   getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
//   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
//   syncToDB:     (dealers,MO)=>fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),
//   bulkUpdateInfo:(file,salesman)=>{
//     const fd=new FormData(); fd.append('file',file);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },
//   uploadMonth:(file,month,salesman)=>{
//     const fd=new FormData(); fd.append('file',file); fd.append('month',month);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },

//   // Notes
//   getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
//   addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

//   // Outstanding
//   getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
//   uploadOutstanding: (file) => { const fd=new FormData(); fd.append('file',file); return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle); },
//   updateOutstanding: (name,month,amount)=>fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),

//   // Settings (month config)
//   getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
//   saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),
// };

// // Convert DB dealer → app format
// // monthlyData is a Map keyed by month label e.g. 'Jun-26'
// export const dbDealerToApp = (d, MO=[]) => {
//   const md = d.monthlyData || {};

//   // Build months array ordered by MO
//   const months = MO.map(m => {
//     const entry = md[m] || (md.get && md.get(m));
//     return Number(entry?.achieved) || 0;
//   });

//   // Build monthTargets per MO index
//   const monthTargets = {};
//   MO.forEach((m,i) => {
//     const entry = md[m] || (md.get && md.get(m));
//     if(entry?.target) monthTargets[i] = Number(entry.target);
//   });

//   // Last known achieved = most recent month with data
//   const achieved = [...months].reverse().find(v=>v>0) || 0;

//   // Target = most recent month's target or fallback to dealer.target
//   const latestMonthTarget = [...Object.entries(monthTargets)].pop();
//   const target = latestMonthTarget ? latestMonthTarget[1] : (d.target||0);

//   const categoryBreakdown = {};
//   if(d.category || d.categoryType){
//     const ck=d.category||'(No Cat)', sk=d.categoryType||'(No Sub)';
//     categoryBreakdown[ck]={[sk]:[...months]};
//   }

//   return {
//     id:           d._id?.toString() || d.id,
//     name:         d.name,
//     salesman:     d.salesman,
//     city:         d.city||'',
//     state:        d.state||'',
//     zone:         d.zone||'',
//     status:       d.status||'ACTIVE',
//     category:     d.category||'',
//     categoryType: d.categoryType||'',
//     target,
//     avg6m:        d.avg6m||0,
//     creditDays:   d.creditDays||0,
//     creditLimit:  d.creditLimit||0,
//     months,
//     monthTargets,
//     achieved,
//     categoryBreakdown,
//     source:       d.source||'db',
//     _raw:         d, // keep raw for updates
//   };
// };

// export const dbOutstandingToApp = (records=[]) => {
//   return records.map(r => {
//     const raw = r.monthlyOutstanding || {};
//     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
//     const vals    = Object.values(monthlyOutstanding).map(Number);
//     const monthCols = Object.keys(monthlyOutstanding);
//     const latestOutstanding = vals[vals.length-1]||0;
//     const maxOutstanding    = Math.max(...vals,0);
//     const trend = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
//     return {
//       id:   r._id?.toString()||r.id,
//       name: r.dealerName,
//       latestOutstanding, maxOutstanding, monthlyOutstanding, monthCols, trend,
//       status: latestOutstanding===0?'CLEARED':'OUTSTANDING',
//     };
//   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// };

// const BASE = import.meta.env?.VITE_API_URL || '/api';

// export const saveToken = (token) => {
//   if(token) localStorage.setItem('stp_jwt', token);
//   else localStorage.removeItem('stp_jwt');
// };
// export const getToken = () => localStorage.getItem('stp_jwt');

// const authHeaders = (extra={}) => ({
//   'Content-Type': 'application/json',
//   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
//   ...extra,
// });

// const handle = async (res) => {
//   const text = await res.text().catch(()=>'');
//   let data;
//   try { data = JSON.parse(text); } 
//   catch(e) { 
//     console.error('[API] Non-JSON response:', res.status, text.slice(0,200));
//     throw new Error(`Server error ${res.status}: ${text.slice(0,100)||'No response'}`); 
//   }
//   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//   return data;
// };

// export const api = {
//   health:  () => fetch(`${BASE}/health`, { signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

//   // Auth
//   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
//   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
//   updateUser:(id,data)=> fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(data)}).then(handle),
//   changePassword:(oldPass,newPass)=>fetch(`${BASE}/auth/change-password`,{method:'POST',headers:authHeaders(),body:JSON.stringify({oldPass,newPass})}).then(handle),

//   // Dealers - pass MO as query param so server returns months in right order
//   getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
//   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
//   syncToDB:     (dealers,MO)=>fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),
//   bulkUpdateInfo:(file,salesman)=>{
//     const fd=new FormData(); fd.append('file',file);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },
//   uploadMonth:(file,month,salesman)=>{
//     const fd=new FormData(); fd.append('file',file); fd.append('month',month);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },

//   // Notes
//   getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
//   addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

//   // Outstanding
//   getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
//   uploadOutstanding: (file) => { const fd=new FormData(); fd.append('file',file); return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle); },
//   updateOutstanding: (name,month,amount)=>fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),

//   // Settings (month config)
//   getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
//   saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),
// };

// // Convert DB dealer → app format
// // monthlyData is a Map keyed by month label e.g. 'Jun-26'
// export const dbDealerToApp = (d, MO=[]) => {
//   // monthlyData keyed by month label: { 'Jun-26': { achieved:320, target:500 }, ... }
//   const md = d.monthlyData || {};

//   // months[] indexed by MO position — strictly per-month achieved
//   const months = MO.map(m => Number(md[m]?.achieved) || 0);

//   // monthTargets{} keyed by MO index — strictly per-month target
//   const monthTargets = {};
//   MO.forEach((m,i) => {
//     const t = Number(md[m]?.target);
//     if(t > 0) monthTargets[i] = t;
//   });

//   // Per-month status — keyed by MO index
//   const monthStatus = {};
//   MO.forEach((m,i) => {
//     if(md[m]?.status) monthStatus[i] = md[m].status;
//   });

//   // Per-month zone — keyed by MO index
//   const monthZone = {};
//   MO.forEach((m,i) => {
//     if(md[m]?.zone) monthZone[i] = md[m].zone;
//   });

//   const categoryBreakdown = {};
//   if(d.category||d.categoryType){
//     const ck=d.category||'(No Cat)', sk=d.categoryType||'(No Sub)';
//     categoryBreakdown[ck]={[sk]:[...months]};
//   }

//   return {
//     id:            d._id?.toString()||d.id,
//     name:          d.name,
//     salesman:      d.salesman,
//     city:          d.city||'',
//     state:         d.state||'',
//     zone:          d.zone||'',
//     status:        d.status||'ACTIVE',
//     category:      d.category||'',
//     categoryType:  d.categoryType||'',
//     target:        d.target||0,   // global default (used as fallback in edit form only)
//     avg6m:         d.avg6m||0,
//     creditDays:    d.creditDays||0,
//     creditLimit:   d.creditLimit||0,
//     months,                        // per-month achieved[]
//     monthTargets,                  // per-month target{}
//     monthStatus,                   // per-month status{}
//     monthZone,                     // per-month zone{}
//     achieved:      [...months].reverse().find(v=>v>0)||0,
//     categoryBreakdown,
//     source:        d.source||'db',
//     monthlyData:   md,
//   };
// };

// export const dbOutstandingToApp = (records=[]) => {
//   return records.map(r => {
//     const raw = r.monthlyOutstanding || {};
//     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
//     const vals    = Object.values(monthlyOutstanding).map(Number);
//     const monthCols = Object.keys(monthlyOutstanding);
//     const latestOutstanding = vals[vals.length-1]||0;
//     const maxOutstanding    = Math.max(...vals,0);
//     const trend = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
//     return {
//       id:   r._id?.toString()||r.id,
//       name: r.dealerName,
//       latestOutstanding, maxOutstanding, monthlyOutstanding, monthCols, trend,
//       status: latestOutstanding===0?'CLEARED':'OUTSTANDING',
//     };
//   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// };
// Use VITE_API_URL if set (production), else try proxy (/api), else direct
// const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

// export const saveToken = (token) => {
//   if(token) localStorage.setItem('stp_jwt', token);
//   else localStorage.removeItem('stp_jwt');
// };
// export const getToken = () => localStorage.getItem('stp_jwt');

// const authHeaders = (extra={}) => ({
//   'Content-Type': 'application/json',
//   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
//   ...extra,
// });

// const handle = async (res) => {
//   const text = await res.text().catch(()=>'');
//   let data;
//   try { data = JSON.parse(text); } 
//   catch(e) { 
//     console.error('[API] Non-JSON response:', res.status, text.slice(0,200));
//     throw new Error(`Server error ${res.status}: ${text.slice(0,100)||'No response'}`); 
//   }
//   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//   return data;
// };

// export const api = {
//   health:  () => fetch(`${BASE}/health`, { signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

//   // Auth
//   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
//   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
//   updateUser:(id,data)=> fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(data)}).then(handle),
//   changePassword:(oldPass,newPass)=>fetch(`${BASE}/auth/change-password`,{method:'POST',headers:authHeaders(),body:JSON.stringify({oldPass,newPass})}).then(handle),

//   // Dealers - pass MO as query param so server returns months in right order
//   getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
//   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
//   syncToDB:     (dealers,MO)=>fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),
//   bulkUpdateInfo:(file,salesman)=>{
//     const fd=new FormData(); fd.append('file',file);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },
//   uploadMonth:(file,month,salesman)=>{
//     const fd=new FormData(); fd.append('file',file); fd.append('month',month);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },

//   // Notes
//   getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
//   addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

//   // Outstanding
//   getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
//   uploadOutstanding: (file) => { const fd=new FormData(); fd.append('file',file); return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle); },
//   updateOutstanding: (name,month,amount)=>fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),

//   // Settings (month config)
//   getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
//   saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),
// };

// // Convert DB dealer → app format
// // monthlyData is a Map keyed by month label e.g. 'Jun-26'
// export const dbDealerToApp = (d, MO=[]) => {
//   // monthlyData keyed by month label: { 'Jun-26': { achieved:320, target:500 }, ... }
//   const md = d.monthlyData || {};

//   // months[] indexed by MO position — strictly per-month achieved
//   const months = MO.map(m => Number(md[m]?.achieved) || 0);

//   // monthTargets{} keyed by MO index — strictly per-month target
//   const monthTargets = {};
//   MO.forEach((m,i) => {
//     const t = Number(md[m]?.target);
//     if(t > 0) monthTargets[i] = t;
//   });

//   // Per-month status — keyed by MO index
//   const monthStatus = {};
//   MO.forEach((m,i) => {
//     if(md[m]?.status) monthStatus[i] = md[m].status;
//   });

//   // Per-month zone — keyed by MO index
//   const monthZone = {};
//   MO.forEach((m,i) => {
//     if(md[m]?.zone) monthZone[i] = md[m].zone;
//   });

//   const categoryBreakdown = {};
//   if(d.category||d.categoryType){
//     const ck=d.category||'(No Cat)', sk=d.categoryType||'(No Sub)';
//     categoryBreakdown[ck]={[sk]:[...months]};
//   }

//   return {
//     id:            d._id?.toString()||d.id,
//     name:          d.name,
//     salesman:      d.salesman,
//     city:          d.city||'',
//     state:         d.state||'',
//     zone:          d.zone||'',
//     status:        d.status||'ACTIVE',
//     category:      d.category||'',
//     categoryType:  d.categoryType||'',
//     target:        d.target||0,   // global default (used as fallback in edit form only)
//     avg6m:         d.avg6m||0,
//     creditDays:    d.creditDays||0,
//     creditLimit:   d.creditLimit||0,
//     months,                        // per-month achieved[]
//     monthTargets,                  // per-month target{}
//     monthStatus,                   // per-month status{}
//     monthZone,                     // per-month zone{}
//     achieved:      [...months].reverse().find(v=>v>0)||0,
//     categoryBreakdown,
//     source:        d.source||'db',
//     monthlyData:   md,
//   };
// };

// export const dbOutstandingToApp = (records=[]) => {
//   return records.map(r => {
//     const raw = r.monthlyOutstanding || {};
//     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
//     const vals    = Object.values(monthlyOutstanding).map(Number);
//     const monthCols = Object.keys(monthlyOutstanding);
//     const latestOutstanding = vals[vals.length-1]||0;
//     const maxOutstanding    = Math.max(...vals,0);
//     const trend = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
//     return {
//       id:   r._id?.toString()||r.id,
//       name: r.dealerName,
//       latestOutstanding, maxOutstanding, monthlyOutstanding, monthCols, trend,
//       status: latestOutstanding===0?'CLEARED':'OUTSTANDING',
//     };
//   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// };


// const BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

// export const saveToken = (token) => {
//   if(token) localStorage.setItem('stp_jwt', token);
//   else localStorage.removeItem('stp_jwt');
// };
// export const getToken = () => localStorage.getItem('stp_jwt');

// const authHeaders = () => ({
//   'Content-Type': 'application/json',
//   ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
// });

// const handle = async (res) => {
//   const text = await res.text().catch(()=>'');
//   let data;
//   try { data = JSON.parse(text); }
//   catch(e) {
//     console.error('[API] Non-JSON:', res.status, res.url, text.slice(0,300));
//     throw new Error(`Server error ${res.status}: ${text.slice(0,150)||'No response'}`);
//   }
//   if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
//   return data;
// };

// export const api = {
//   health: () => fetch(`${BASE}/health`,{ signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

//   login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
//   getUsers: ()        => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
//   updateUser:(id,d)   => fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),

//   getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
//   createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
//   deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
//   syncToDB:     (dealers,MO) => fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),

//   uploadMonth: (file,month,salesman) => {
//     const fd = new FormData();
//     fd.append('file',file); fd.append('month',month);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },
//   bulkUpdateInfo: (file,salesman) => {
//     const fd = new FormData();
//     fd.append('file',file);
//     if(salesman) fd.append('salesman',salesman);
//     return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },

//   getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
//   addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
//   deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

//   getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
//   uploadOutstanding: (file) => {
//     const fd = new FormData(); fd.append('file',file);
//     return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
//   },
//   updateOutstanding: (name,month,amount) =>
//     fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),

//   getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
//   saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),
// };

// // ─────────────────────────────────────────────────────────────────────────────
// // Convert DB dealer → app format
// // KEY RULE: each month is INDEPENDENT
// // months[i]       = achieved for MO[i]  → 0 if not uploaded for that month
// // monthTargets[i] = target  for MO[i]   → undefined if not uploaded for that month
// // monthStatus[i]  = status  for MO[i]   → undefined if not uploaded
// // monthZone[i]    = zone    for MO[i]   → undefined if not uploaded
// // ─────────────────────────────────────────────────────────────────────────────
// export const dbDealerToApp = (d, MO=[]) => {
//   const md = d.monthlyData || {};

//   const months      = MO.map(m => Number(md[m]?.achieved)||0);
//   const monthTargets= {};
//   const monthStatus = {};
//   const monthZone   = {};
//   const monthCat    = {};
//   const monthCatType= {};
//   const monthCity   = {};
//   const monthState  = {};

//   MO.forEach((m,i) => {
//     const e = md[m];
//     if(!e) return; // month not uploaded — leave all undefined
//     if(e.target      > 0)  monthTargets[i] = Number(e.target);
//     if(e.status)           monthStatus[i]  = e.status;
//     if(e.zone)             monthZone[i]    = e.zone;
//     if(e.category)         monthCat[i]     = e.category;
//     if(e.categoryType)     monthCatType[i] = e.categoryType;
//     if(e.city)             monthCity[i]    = e.city;
//     if(e.state)            monthState[i]   = e.state;
//   });

//   // monthsWithData = set of MO indices that have been uploaded
//   const monthsWithData = new Set(
//     MO.map((m,i) => (md[m]?.achieved>0||md[m]?.target>0) ? i : -1).filter(i=>i>=0)
//   );

//   return {
//     id:            d._id?.toString()||d.id||d.id,
//     name:          d.name,
//     salesman:      d.salesman,
//     // Global fallback info
//     city:          d.city||'',
//     state:         d.state||'',
//     zone:          d.zone||'',
//     status:        d.status||'ACTIVE',
//     category:      d.category||'',
//     categoryType:  d.categoryType||'',
//     target:        d.target||0,
//     avg6m:         d.avg6m||0,
//     creditDays:    d.creditDays||0,
//     creditLimit:   d.creditLimit||0,
//     // Per-month arrays
//     months,
//     monthTargets,
//     monthStatus,
//     monthZone,
//     monthCat,
//     monthCatType,
//     monthCity,
//     monthState,
//     monthsWithData,
//     monthlyData:   md,
//     achieved:      [...months].reverse().find(v=>v>0)||0,
//     categoryBreakdown: {},
//     source:        d.source||'db',
//   };
// };

// export const dbOutstandingToApp = (records=[]) => {
//   return records.map(r => {
//     const raw = r.monthlyOutstanding||{};
//     const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
//     const vals     = Object.values(monthlyOutstanding).map(Number);
//     const monthCols= Object.keys(monthlyOutstanding);
//     const latest   = vals[vals.length-1]||0;
//     const trend    = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
//     return {
//       id:   r._id?.toString()||r.id,
//       name: r.dealerName,
//       latestOutstanding: latest,
//       maxOutstanding:    Math.max(...vals,0),
//       monthlyOutstanding,
//       monthCols,
//       trend,
//       status: latest===0 ? 'CLEARED' : 'OUTSTANDING',
//     };
//   }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
// };


// Production backend (Hostinger). Used as the default when the app is
// running inside the Capacitor APK on a phone — no manual configuration
// needed. Web/dev builds keep their existing fallbacks.
const PROD_API_URL = 'https://sequence.salestracker.in/api';

// Are we inside the Capacitor-wrapped Android app?
const _isCapacitor = () =>
  typeof window !== 'undefined' &&
  window.Capacitor &&
  typeof window.Capacitor.isNativePlatform === 'function' &&
  window.Capacitor.isNativePlatform();

// API base URL — resolved at MODULE LOAD:
//   1. localStorage 'stp_api_url' (set via Settings screen) wins — lets the
//      same APK be pointed at any backend (dev, prod, etc.) without rebuilding.
//   2. APK build: default to PROD_API_URL (Hostinger-hosted backend).
//   3. Web/dev: build-time VITE_API_URL, else local dev URL.
// Settings changes require a page reload to take effect (or use setApiBase
// which reloads automatically).
const _resolveBaseUrl = () => {
  try {
    const stored = (typeof localStorage !== 'undefined') ? localStorage.getItem('stp_api_url') : '';
    if(stored && stored.trim()) return stored.trim().replace(/\/$/, '');
  } catch {}
  if (_isCapacitor()) return PROD_API_URL.replace(/\/$/, '');
  return (import.meta.env?.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
};

const BASE = _resolveBaseUrl();

// Exports for the Settings screen
export const getApiBase = () => _resolveBaseUrl();
export const setApiBase = (url) => {
  if(typeof localStorage === 'undefined') return;
  if(!url) localStorage.removeItem('stp_api_url');
  else localStorage.setItem('stp_api_url', url.trim().replace(/\/$/, ''));
  // Reload so the new URL takes effect everywhere
  if(typeof window !== 'undefined') window.location.reload();
};

export const saveToken = (token) => {
  if(token) localStorage.setItem('stp_jwt', token);
  else localStorage.removeItem('stp_jwt');
};
export const getToken = () => localStorage.getItem('stp_jwt');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization:`Bearer ${getToken()}` } : {}),
});

const handle = async (res) => {
  const text = await res.text().catch(()=>'');
  let data;
  try { data = JSON.parse(text); }
  catch(e) {
    console.error('[API] Non-JSON:', res.status, res.url, text.slice(0,300));
    throw new Error(`Server error ${res.status}: ${text.slice(0,150)||'No response'}`);
  }
  if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
};

export const api = {
  health: () => fetch(`${BASE}/health`,{ signal:AbortSignal.timeout(3000) }).then(handle).catch(()=>null),

  login:    (id,pass) => fetch(`${BASE}/auth/login`,{method:'POST',headers:authHeaders(),body:JSON.stringify({id,pass})}).then(handle),
  getUsers:    ()      => fetch(`${BASE}/auth/users`,{headers:authHeaders()}).then(handle),
  getUsersAll: ()      => fetch(`${BASE}/auth/users?includeInactive=1`,{headers:authHeaders()}).then(handle),

  // Diagnostic — returns { user, resolvedFilter, matchingDealerCount,
  // totalDealersInDb, dbDistinctStates } for a specific user. Admin only.
  // Useful when state permissions aren't filtering as expected.
  userDebugScope: (uid) => fetch(`${BASE}/auth/users/${encodeURIComponent(uid)}/debug-scope`,{headers:authHeaders()}).then(handle),

  // Per-user UI preferences (lives on the server so it survives APK reinstall,
  // incognito, switching devices). Currently used for the global category filter.
  getMyPrefs:   ()      => fetch(`${BASE}/auth/me/prefs`,{headers:authHeaders()}).then(handle),
  updateMyPrefs:(patch) => fetch(`${BASE}/auth/me/prefs`,{
    method:'PUT', headers:authHeaders(), body: JSON.stringify(patch),
  }).then(handle),

  updateUser:  (id,d)  => fetch(`${BASE}/auth/users/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
  reassignSalesman: (fromId, toId) => fetch(`${BASE}/auth/users/${encodeURIComponent(fromId)}/reassign`,{method:'POST',headers:authHeaders(),body:JSON.stringify({toId})}).then(handle),

  getDealers:   (MO=[]) => fetch(`${BASE}/dealers?mo=${MO.join(',')}`,{headers:authHeaders()}).then(handle),
  createDealer: (d)     => fetch(`${BASE}/dealers`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
  updateDealer: (id,d)  => fetch(`${BASE}/dealers/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
  normalizeGeo: ()      => fetch(`${BASE}/dealers/normalize-geo`,{method:'POST',headers:authHeaders()}).then(handle),
  deleteDealer: (id)    => fetch(`${BASE}/dealers/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
  syncToDB:     (dealers,MO) => fetch(`${BASE}/dealers/sync-db`,{method:'POST',headers:authHeaders(),body:JSON.stringify({dealers,MO})}).then(handle),

  uploadMonth: (file,month,salesman) => {
    const fd = new FormData();
    fd.append('file',file); fd.append('month',month);
    if(salesman) fd.append('salesman',salesman);
    return fetch(`${BASE}/dealers/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
  },
  bulkUpdateInfo: (file,salesman) => {
    const fd = new FormData();
    fd.append('file',file);
    if(salesman) fd.append('salesman',salesman);
    return fetch(`${BASE}/dealers/bulk-update`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
  },

  getNotes:   ()      => fetch(`${BASE}/notes`,{headers:authHeaders()}).then(handle),
  addNote:    (n)     => fetch(`${BASE}/notes`,{method:'POST',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
  updateNote: (id,n)  => fetch(`${BASE}/notes/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(n)}).then(handle),
  deleteNote: (id)    => fetch(`${BASE}/notes/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),

  getOutstanding:    ()     => fetch(`${BASE}/outstanding`,{headers:authHeaders()}).then(handle),
  uploadOutstanding: (file) => {
    const fd = new FormData(); fd.append('file',file);
    return fetch(`${BASE}/outstanding/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
  },
  updateOutstanding: (name,month,amount) =>
    fetch(`${BASE}/outstanding/${encodeURIComponent(name)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({month,amount})}).then(handle),
  deleteOutstandingMonth: (month) =>
    fetch(`${BASE}/outstanding/month/${encodeURIComponent(month)}`,{method:'DELETE',headers:authHeaders()}).then(handle),

  // Outstanding Followups
  getFollowups:    ()      => fetch(`${BASE}/followups`,{headers:authHeaders()}).then(handle),
  addFollowup:     (d)     => fetch(`${BASE}/followups`,{method:'POST',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
  updateFollowup:  (id,d)  => fetch(`${BASE}/followups/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(d)}).then(handle),
  deleteFollowup:  (id)    => fetch(`${BASE}/followups/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
  // Admin: wipe EVERY follow-up so user can start fresh under the new
  // month-tagged scheme. Outstanding amounts are NOT touched.
  wipeAllFollowups:()      => fetch(`${BASE}/followups`,{method:'DELETE',headers:authHeaders()}).then(handle),

  // ── Samples ────────────────────────────────────────────────────────────────
  getSamples:      (zone)  => fetch(`${BASE}/samples${zone?'?zone='+encodeURIComponent(zone):''}`,{headers:authHeaders()}).then(handle),
  addSample:       (data)  => fetch(`${BASE}/samples`,{method:'POST',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify(data)}).then(handle),
  getSamplesGiven: (params)=> fetch(`${BASE}/samples/given${params?'?'+params:''}`,{headers:authHeaders()}).then(handle),
  markSampleGiven: (data)  => fetch(`${BASE}/samples/given`,{method:'POST',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify(data)}).then(handle),
  unmarkSample:    (id)    => fetch(`${BASE}/samples/given/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
  uploadSamples:   (file)  => { const fd=new FormData(); fd.append('file',file); return fetch(`${BASE}/samples/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle); },
  // Bulk upload: which dealer has which sample. See samples.js for format.
  uploadSamplesGiven: (file) => { const fd=new FormData(); fd.append('file',file); return fetch(`${BASE}/samples/given/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle); },
  // Download the ONE template — Company Name | Product | Zone format.
  // Pre-filled with every existing SampleGiven record.
  downloadSampleTemplate: async () => {
    const res = await fetch(`${BASE}/samples/template`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sample_by_Party_by_Zone.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  // Download an Excel pre-populated with every dealer × every sample. Existing
  // "given" pairs come pre-ticked so admin can see current state.
  downloadSamplesGivenTemplate: async () => {
    const res = await fetch(`${BASE}/samples/given/template`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Dealer_Samples_Template.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  // One-shot cleanup that merges duplicate Sample master records where the
  // parser previously mistook code ranges (like "OM 21 - 40") for zones.
  cleanupSampleMaster: () => fetch(`${BASE}/samples/cleanup-master`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then(handle),
  // Template for the Sample Master upload (Sample Name | Zone | Category).
  // Pre-populated with any existing master rows.
  downloadSampleMasterTemplate: async () => {
    const res = await fetch(`${BASE}/samples/master/template`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Sample_Master_Template.xlsx';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  deleteSample:    (id)    => fetch(`${BASE}/samples/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
  // Nuclear: wipes entire Sample master AND every SampleGiven record.
  // Superadmin-only on the server.
  deleteAllSamples: ()     => fetch(`${BASE}/samples/all`,{method:'DELETE',headers:authHeaders()}).then(handle),

  getMonthConfig:  ()    => fetch(`${BASE}/settings/months`,{headers:authHeaders()}).then(handle).catch(()=>null),
  saveMonthConfig: (cfg) => fetch(`${BASE}/settings/months`,{method:'POST',headers:authHeaders(),body:JSON.stringify(cfg)}).then(handle).catch(()=>null),

  // Admin: back-fill per-month targets from each dealer's global target,
  // for months that have achievement > 0 but no per-month target stored.
  repairTargets: () => fetch(`${BASE}/dealers/repair-targets`,{method:'POST',headers:authHeaders()}).then(handle),

  // Admin: DESTRUCTIVE — remove a single month's data (monthlyData[label])
  // from every dealer. Use when removing a future month that should reset
  // cleanly the next time it's added back.
  deleteMonth: (label) => fetch(`${BASE}/dealers/month/${encodeURIComponent(label)}`,{
    method:'DELETE',
    headers:authHeaders(),
  }).then(handle),

  // Admin: DESTRUCTIVE — delete every dealer record. Used to start fresh.
  wipeAllDealers: () => fetch(`${BASE}/dealers/wipe-all`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify({ confirm:'YES_WIPE_ALL' }),
  }).then(handle),

  // Admin: find and remove duplicate dealers (same salesman + same name).
  // dryRun=true returns a preview without deleting anything.
  dedupeDealers: (dryRun=false) => fetch(`${BASE}/dealers/dedupe`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify({ dryRun }),
  }).then(handle),

  // Admin: aggressive dedupe — collapses dealers whose names differ only by
  // spaces or punctuation (e.g. "1000 Kitchens Interiors" vs
  // "1000KITCHENSINTERIORS"). Use after an upload created bulk duplicates
  // because the Excel exported names without spaces. Sale rows + missing
  // monthlyData entries are migrated to the canonical (older, non-upload)
  // dealer before the dupe is deleted.
  dedupeStripped: (dryRun=false) => fetch(`${BASE}/dealers/dedupe-stripped`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify({ dryRun }),
  }).then(handle),

  // Admin: re-write every dealer's city + state in a uniform Title Case format
  // ('BANGALORE' → 'Bangalore', 'bangalore ' → 'Bangalore'). Returns counts +
  // a sample of changes + a top-10 list of messy values. Pass dryRun:true
  // to preview without writing.
  normalizeCityState: (dryRun=false) => fetch(`${BASE}/dealers/normalize-city-state`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify({ dryRun }),
  }).then(handle),

  // Lightweight ping — returns { lastUpdatedAt: ISO } for the most recently
  // modified dealer in the DB. Used by the Overview's "Last updated on …"
  // stamp so it reflects real DB writes (including ones from other users)
  // and not the page-load time.
  dealersLastUpdated: () => fetch(`${BASE}/dealers/last-updated`,{ headers:authHeaders() }).then(handle),

  // Unique state list across the dealer roster — used by the user-management
  // permissions editor to render a checkbox per state.
  dealerDistinctStates: () => fetch(`${BASE}/dealers/distinct-states`,{ headers:authHeaders() }).then(handle),

  // Unique cities. Pass ?state=<name> to filter to one state's cities (useful
  // when the admin scopes to a subset first).
  dealerDistinctCities: (state) => fetch(
    `${BASE}/dealers/distinct-cities${state?`?state=${encodeURIComponent(state)}`:''}`,
    { headers:authHeaders() }
  ).then(handle),

  // Upload an Excel/CSV of city/state names for the User Permissions modal.
  // Server matches each row against the dealer roster (case-insensitive) and
  // returns the canonical state/city names to auto-tick.
  //
  // NOTE: DON'T include authHeaders() here — that helper forces
  // 'Content-Type: application/json' which corrupts the multipart boundary
  // the browser needs to set automatically. Pass Authorization only.
  permissionsFromExcel: (file) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${BASE}/dealers/permissions-from-excel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: form,
    }).then(handle);
  },

  // Admin: find and remove dealers whose name = "<canonical> <salesman first name>"
  // (e.g. "76 EAST pranav" when "76 EAST" already exists for salesman Pranav).
  // Migrates Sale rows to the canonical dealer before deleting.
  cleanupSuffixDupes: (dryRun=false) => fetch(`${BASE}/dealers/cleanup-suffix-dupes`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify({ dryRun }),
  }).then(handle),

  // Admin: delete every dealer with a given `source` (e.g. 'cat-upload' for
  // dealers wrongly created by the category-wise Excel upload). Sale rows are
  // re-pointed at canonical dealers (same name) first, then the duplicates
  // are removed.
  deleteDealersBySource: (source, dryRun=false) => fetch(`${BASE}/dealers/delete-by-source`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify({ source, dryRun }),
  }).then(handle),

  // Superadmin: get a new JWT for the target user (impersonation).
  // The returned token has `impersonatedBy` claim so the UI can show a banner.
  impersonate: (targetUserId) => fetch(`${BASE}/auth/impersonate/${encodeURIComponent(targetUserId)}`,{
    method:'POST',
    headers:authHeaders(),
  }).then(handle),

  // While impersonating, issue a fresh JWT for the original superadmin.
  returnToSelf: () => fetch(`${BASE}/auth/return-to-self`,{
    method:'POST',
    headers:authHeaders(),
  }).then(handle),

  createUser: (data) => fetch(`${BASE}/auth/users`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify(data),
  }).then(handle),

  deleteUser: (id) => fetch(`${BASE}/auth/users/${encodeURIComponent(id)}`,{
    method:'DELETE',
    headers:authHeaders(),
  }).then(handle),

  // ── CRM ────────────────────────────────────────────────────────────────
  // Attendance
  attListAttendance: (q={}) => {
    const p = new URLSearchParams(q).toString();
    return fetch(`${BASE}/crm/attendance${p?'?'+p:''}`,{ headers:authHeaders() }).then(handle);
  },
  attPunch: (body) => fetch(`${BASE}/crm/attendance`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify(body),
  }).then(handle),

  // Visits
  visitsList: (q={}) => {
    const p = new URLSearchParams(q).toString();
    return fetch(`${BASE}/crm/visits${p?'?'+p:''}`,{ headers:authHeaders() }).then(handle);
  },
  visitsCreate: (body) => fetch(`${BASE}/crm/visits`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify(body),
  }).then(handle),
  visitsCheckout: (id, body) => fetch(`${BASE}/crm/visits/${encodeURIComponent(id)}/checkout`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify(body),
  }).then(handle),
  visitsDelete: (id) => fetch(`${BASE}/crm/visits/${encodeURIComponent(id)}`,{
    method:'DELETE',
    headers:authHeaders(),
  }).then(handle),
  // Superadmin: force-close a stuck in-progress visit (salesman forgot to check out).
  visitsForceClose: (id, body={}) => fetch(`${BASE}/crm/visits/${encodeURIComponent(id)}/force-close`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify(body),
  }).then(handle),

  // Leads
  leadsList: (q={}) => {
    const p = new URLSearchParams(q).toString();
    return fetch(`${BASE}/crm/leads${p?'?'+p:''}`,{ headers:authHeaders() }).then(handle);
  },
  leadsCreate: (body) => fetch(`${BASE}/crm/leads`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify(body),
  }).then(handle),
  leadsUpdate: (id, body) => fetch(`${BASE}/crm/leads/${encodeURIComponent(id)}`,{
    method:'PUT',
    headers:authHeaders(),
    body: JSON.stringify(body),
  }).then(handle),
  leadsDelete: (id) => fetch(`${BASE}/crm/leads/${encodeURIComponent(id)}`,{
    method:'DELETE',
    headers:authHeaders(),
  }).then(handle),
  // Bulk-upload leads from a CSV/XLSX file. Admin only on the server.
  leadsUpload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return fetch(`${BASE}/crm/leads/upload`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${getToken()}` },
      body: fd,
    }).then(handle);
  },

  // Tasks
  tasksList: (q={}) => {
    const p = new URLSearchParams(q).toString();
    return fetch(`${BASE}/crm/tasks${p?'?'+p:''}`,{ headers:authHeaders() }).then(handle);
  },
  tasksCreate: (body) => fetch(`${BASE}/crm/tasks`,{
    method:'POST', headers:authHeaders(), body: JSON.stringify(body),
  }).then(handle),
  tasksUpdate: (id, body) => fetch(`${BASE}/crm/tasks/${encodeURIComponent(id)}`,{
    method:'PUT', headers:authHeaders(), body: JSON.stringify(body),
  }).then(handle),
  tasksDelete: (id) => fetch(`${BASE}/crm/tasks/${encodeURIComponent(id)}`,{
    method:'DELETE', headers:authHeaders(),
  }).then(handle),

  // Tickets (support / complaints)
  ticketsList: (q={}) => {
    const p = new URLSearchParams(q).toString();
    return fetch(`${BASE}/crm/tickets${p?'?'+p:''}`,{ headers:authHeaders() }).then(handle);
  },
  ticketsCreate: (body) => fetch(`${BASE}/crm/tickets`,{
    method:'POST', headers:authHeaders(), body: JSON.stringify(body),
  }).then(handle),
  ticketsUpdate: (id, body) => fetch(`${BASE}/crm/tickets/${encodeURIComponent(id)}`,{
    method:'PUT', headers:authHeaders(), body: JSON.stringify(body),
  }).then(handle),
  ticketsDelete: (id) => fetch(`${BASE}/crm/tickets/${encodeURIComponent(id)}`,{
    method:'DELETE', headers:authHeaders(),
  }).then(handle),

  // Leaves
  leavesList: (q={}) => {
    const p = new URLSearchParams(q).toString();
    return fetch(`${BASE}/crm/leaves${p?'?'+p:''}`,{ headers:authHeaders() }).then(handle);
  },
  leavesApply: (body) => fetch(`${BASE}/crm/leaves`,{
    method:'POST',
    headers:authHeaders(),
    body: JSON.stringify(body),
  }).then(handle),
  leavesUpdate: (id, body) => fetch(`${BASE}/crm/leaves/${encodeURIComponent(id)}`,{
    method:'PUT',
    headers:authHeaders(),
    body: JSON.stringify(body),
  }).then(handle),

  // ── Category Type / Sub-Category (Product Type) management ────────────────
  categoriesList:    ()          => fetch(`${BASE}/categories`,{headers:authHeaders()}).then(handle),
  categoryCreate:    (body)      => fetch(`${BASE}/categories`,{method:'POST',headers:authHeaders(),body:JSON.stringify(body)}).then(handle),
  categoryUpdate:    (id, body)  => fetch(`${BASE}/categories/${encodeURIComponent(id)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(body)}).then(handle),
  categoryDelete:    (id)        => fetch(`${BASE}/categories/${encodeURIComponent(id)}`,{method:'DELETE',headers:authHeaders()}).then(handle),
  subCategoryAdd:    (id, name)  => fetch(`${BASE}/categories/${encodeURIComponent(id)}/sub`,{method:'POST',headers:authHeaders(),body:JSON.stringify({name})}).then(handle),
  subCategoryUpdate: (id, subId, name) => fetch(`${BASE}/categories/${encodeURIComponent(id)}/sub/${encodeURIComponent(subId)}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify({name})}).then(handle),
  subCategoryDelete: (id, subId) => fetch(`${BASE}/categories/${encodeURIComponent(id)}/sub/${encodeURIComponent(subId)}`,{method:'DELETE',headers:authHeaders()}).then(handle),
  categoriesSeed:    ()          => fetch(`${BASE}/categories/seed-defaults`,{method:'POST',headers:authHeaders()}).then(handle),

  // ── Category-wise Sales (wide-format Excel upload + aggregations) ─────────
  salesTemplateUrl: () => `${BASE}/sales/template`,   // GET with auth header — caller handles download
  // Download the unified template.
  //   opts.monthLabel — e.g. "Jun-26", pre-fills with current dealer data for that month
  //   opts.salesman   — filter prefill to one salesman (admin per-salesman sheets)
  //   opts.prefill    — explicit pre-fill flag (auto-on when monthLabel is given)
  salesDownloadTemplate: async (opts={}) => {
    const qs = new URLSearchParams();
    if (opts.monthLabel) qs.set('monthLabel', opts.monthLabel);
    if (opts.salesman)   qs.set('salesman',   opts.salesman);
    if (opts.prefill)    qs.set('prefill',    '1');
    const url = `${BASE}/sales/template${qs.toString() ? '?'+qs : ''}`;
    const res = await fetch(url, { headers:{ Authorization:`Bearer ${getToken()}` } });
    if(!res.ok) throw new Error(`Template download failed (${res.status})`);
    const blob = await res.blob();
    const bUrl = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = bUrl;
    a.download = `Sales_Upload_Template${opts.monthLabel ? '_'+opts.monthLabel : ''}.xlsx`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(bUrl), 4000);
  },
  // Upload the unified Excel.
  //   month       — YYYY-MM (required, normalised on the server)
  //   monthLabel  — optional MO label like "Jun-26" so dealer.monthlyData also gets written
  //   replace     — replace Sale rows for the month
  salesUpload: (file, month, replace=true, monthLabel='') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('month', month);
    fd.append('replace', String(replace));
    if (monthLabel) fd.append('monthLabel', monthLabel);
    return fetch(`${BASE}/sales/upload`,{method:'POST',headers:{Authorization:`Bearer ${getToken()}`},body:fd}).then(handle);
  },
  salesMonths:       ()         => fetch(`${BASE}/sales/months`,{headers:authHeaders()}).then(handle),
  salesByCategory:   (q={})     => fetch(`${BASE}/sales/by-category?${new URLSearchParams(q)}`,{headers:authHeaders()}).then(handle),
  salesByDealer:     (q={})     => fetch(`${BASE}/sales/by-dealer?${new URLSearchParams(q)}`,{headers:authHeaders()}).then(handle),
  // Per-dealer, per-month excluded-category qty (drives all-months category filtering).
  salesByDealerMonths:(exclude=[]) => fetch(`${BASE}/sales/by-dealer-months?exclude=${encodeURIComponent((exclude||[]).join(','))}`,{headers:authHeaders()}).then(handle),
  salesBySalesman:   (q={})     => fetch(`${BASE}/sales/by-salesman?${new URLSearchParams(q)}`,{headers:authHeaders()}).then(handle),
  salesForDealer:    (name)     => fetch(`${BASE}/sales/dealer/${encodeURIComponent(name)}`,{headers:authHeaders()}).then(handle),
  // Raw Sale rows (paged). Used by trend charts that need cross-month data.
  salesRaw:          (q={})     => fetch(`${BASE}/sales/raw?${new URLSearchParams(q)}`,{headers:authHeaders()}).then(handle),
  salesDeleteMonth:  (m)        => fetch(`${BASE}/sales/month/${encodeURIComponent(m)}`,{method:'DELETE',headers:authHeaders()}).then(handle),

  // ── Per-(salesman × category × month) volume targets ─────────────────
  salesTargetsList:  (month)    => fetch(`${BASE}/sales/targets?month=${encodeURIComponent(month)}`,{headers:authHeaders()}).then(handle),
  salesTargetSet:    (body)     => fetch(`${BASE}/sales/targets`,{method:'POST',headers:authHeaders(),body:JSON.stringify(body)}).then(handle),
  salesTargetsBulk:  (items)    => fetch(`${BASE}/sales/targets/bulk`,{method:'POST',headers:authHeaders(),body:JSON.stringify({items})}).then(handle),

  // ── Online spreadsheets (Sheets section) ─────────────────────────────
  sheetsList:   ()            => fetch(`${BASE}/sheets`,{headers:authHeaders()}).then(handle),
  sheetGet:     (id)          => fetch(`${BASE}/sheets/${id}`,{headers:authHeaders()}).then(handle),
  sheetCreate:  (body)        => fetch(`${BASE}/sheets`,{method:'POST',headers:authHeaders(),body:JSON.stringify(body||{})}).then(handle),
  sheetSave:    (id,body)     => fetch(`${BASE}/sheets/${id}`,{method:'PUT',headers:authHeaders(),body:JSON.stringify(body||{})}).then(handle),
  sheetDelete:  (id)          => fetch(`${BASE}/sheets/${id}`,{method:'DELETE',headers:authHeaders()}).then(handle),
};

// ─────────────────────────────────────────────────────────────────────────────
// Convert DB dealer → app format
// KEY RULE: each month is INDEPENDENT
// months[i]       = achieved for MO[i]  → 0 if not uploaded for that month
// monthTargets[i] = target  for MO[i]   → undefined if not uploaded for that month
// monthStatus[i]  = status  for MO[i]   → undefined if not uploaded
// monthZone[i]    = zone    for MO[i]   → undefined if not uploaded
// ─────────────────────────────────────────────────────────────────────────────
export const dbDealerToApp = (d, MO=[]) => {
  const md = d.monthlyData || {};

  const months      = MO.map(m => Number(md[m]?.achieved)||0);
  const monthTargets= {};
  const monthStatus = {};
  const monthZone   = {};
  const monthCat    = {};
  const monthCatType= {};
  const monthCity   = {};
  const monthState  = {};

  MO.forEach((m,i) => {
    const e = md[m];
    if(!e) return; // month not uploaded — leave all undefined
    if(e.target      > 0)  monthTargets[i] = Number(e.target);
    if(e.status)           monthStatus[i]  = e.status;
    if(e.zone)             monthZone[i]    = e.zone;
    if(e.category)         monthCat[i]     = e.category;
    if(e.categoryType)     monthCatType[i] = e.categoryType;
    if(e.city)             monthCity[i]    = e.city;
    if(e.state)            monthState[i]   = e.state;
  });

  // monthsWithData = set of MO indices that have been uploaded
  const monthsWithData = new Set(
    MO.map((m,i) => (md[m]?.achieved>0||md[m]?.target>0) ? i : -1).filter(i=>i>=0)
  );

  return {
    id:            d._id?.toString()||d.id||d.id,
    name:          d.name,
    salesman:      d.salesman,
    // Global fallback info
    city:          d.city||'',
    state:         d.state||'',
    zone:          d.zone||'',
    status:        d.status||'ACTIVE',
    dealerType:    d.dealerType||'None',
    address:       d.address||'',
    pincode:       d.pincode||'',
    category:      d.category||'',
    categoryType:  d.categoryType||'',
    target:        d.target||0,
    avg6m:         d.avg6m||0,
    creditDays:    d.creditDays||0,
    creditLimit:   d.creditLimit||0,
    // Per-month arrays
    months,
    monthTargets,
    monthStatus,
    monthZone,
    monthCat,
    monthCatType,
    monthCity,
    monthState,
    monthsWithData,
    monthlyData:   md,
    updatedAt:     d.updatedAt || d.updated_at || null,   // last-edit timestamp
    achieved:      [...months].reverse().find(v=>v>0)||0,
    categoryBreakdown: {},
    source:        d.source||'db',
  };
};

export const dbOutstandingToApp = (records=[]) => {
  return records.map(r => {
    const raw = r.monthlyOutstanding||{};
    const monthlyOutstanding = raw instanceof Map ? Object.fromEntries(raw) : raw;
    const vals     = Object.values(monthlyOutstanding).map(Number);
    const monthCols= Object.keys(monthlyOutstanding);
    const latest   = vals[vals.length-1]||0;
    const trend    = vals.length>=2 ? vals[vals.length-1]-vals[vals.length-2] : 0;
    return {
      id:   r._id?.toString()||r.id,
      name: r.dealerName,
      latestOutstanding: latest,
      maxOutstanding:    Math.max(...vals,0),
      monthlyOutstanding,
      monthCols,
      trend,
      status: latest===0 ? 'CLEARED' : 'OUTSTANDING',
    };
  }).sort((a,b)=>b.latestOutstanding-a.latestOutstanding);
};