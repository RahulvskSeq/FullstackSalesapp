import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage:multer.memoryStorage(), limits:{ fileSize:10*1024*1024 } });

const monthEntrySchema = new mongoose.Schema({
  achieved:    { type:Number, default:0 },
  target:      { type:Number, default:0 },
  status:      { type:String, default:'' },
  zone:        { type:String, default:'' },
  category:    { type:String, default:'' },
  categoryType:{ type:String, default:'' },
  city:        { type:String, default:'' },
  state:       { type:String, default:'' },
}, { _id:false });

const dealerSchema = new mongoose.Schema({
  name:         { type:String, required:true },
  salesman:     { type:String, required:true },
  city:         { type:String, default:'' },
  state:        { type:String, default:'' },
  zone:         { type:String, default:'' },
  status:       { type:String, default:'ACTIVE' },
  category:     { type:String, default:'' },
  categoryType: { type:String, default:'' },
  target:       { type:Number, default:0 },
  creditDays:   { type:Number, default:0 },
  creditLimit:  { type:Number, default:0 },
  avg6m:        { type:Number, default:0 },
  monthlyData:  { type:Map, of:monthEntrySchema, default:{} },
  source:       { type:String, default:'sheet' },
}, { timestamps:true });

dealerSchema.index({ name:1, salesman:1 }, { unique:true });
const Dealer = mongoose.models.Dealer || mongoose.model('Dealer', dealerSchema);

const mapToObj = (m) => {
  if(!m) return {};
  if(typeof m.forEach==='function'){ const o={}; m.forEach((v,k)=>{ o[k]=v?.toObject?v.toObject():v; }); return o; }
  return typeof m==='object'?{...m}:{};
};

const fmt = (d, MO=[]) => {
  const md = mapToObj(d.monthlyData);
  const months = MO.map(m=>Number(md[m]?.achieved)||0);
  const monthTargets={}, monthStatus={}, monthZone={};
  MO.forEach((m,i)=>{
    if(md[m]?.target>0)   monthTargets[i]=Number(md[m].target);
    if(md[m]?.status)     monthStatus[i]=md[m].status;
    if(md[m]?.zone)       monthZone[i]=md[m].zone;
  });
  const monthsWithData=MO.map((m,i)=>(md[m]?.achieved>0||md[m]?.target>0)?i:-1).filter(i=>i>=0);
  return {
    id:d._id?.toString(), name:d.name, salesman:d.salesman,
    city:d.city||'', state:d.state||'', zone:d.zone||'', status:d.status||'ACTIVE',
    category:d.category||'', categoryType:d.categoryType||'', target:d.target||0,
    avg6m:d.avg6m||0, creditDays:d.creditDays||0, creditLimit:d.creditLimit||0,
    months, monthTargets, monthStatus, monthZone,
    monthsWithData, monthlyData:md,
    achieved:[...months].reverse().find(v=>v>0)||0,
    categoryBreakdown:{}, source:d.source||'db',
  };
};

router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role==='admin'?{}:{salesman:req.user.id};
    const MO = req.query.mo?req.query.mo.split(','):[];
    const dealers = await Dealer.find(filter).lean();
    // Log a quick summary so we can see what's in DB on every fetch.
    // Helpful to confirm uploads actually persisted between requests.
    const monthsInDb = new Set();
    dealers.forEach(d => {
      const md = d.monthlyData;
      if(!md) return;
      // Mongoose .lean() returns a plain object for Map fields
      Object.keys(md).forEach(k => monthsInDb.add(k));
    });
    console.log(`[DEALERS GET] user=${req.user.id} returned=${dealers.length} dealers · months_in_DB=[${[...monthsInDb].sort().join(',')}] · MO_query=[${MO.join(',')}]`);
    res.json(dealers.map(d=>fmt(d,MO)));
  } catch(e){ console.error('[DEALERS GET]',e.message); res.status(500).json({error:e.message}); }
});

router.post('/upload', protect, upload.single('file'), async (req,res) => {
  try {
    const {month, salesman:uploadSm} = req.body;
    const smId = req.user.role==='admin'?(uploadSm||req.user.id):req.user.id;
    if(!month) return res.status(400).json({error:'month required'});
    if(!req.file) return res.status(400).json({error:'No file'});
    const wb=XLSX.read(req.file.buffer,{type:'buffer'});
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
    if(!rows.length) return res.status(400).json({error:'No data'});
    const results={added:0,updated:0,skipped:0,errors:[]};
    for(const row of rows){
      const keys=Object.keys(row);
      const find=(...t)=>{for(const x of t){const k=keys.find(k=>k.toLowerCase().replace(/[\s_-]/g,'').includes(x.toLowerCase().replace(/[\s_-]/g,'')));if(k&&String(row[k]).trim())return String(row[k]).trim();}return'';};
      const findNum=(...t)=>{const v=find(...t);return v?Math.round(parseFloat(v.replace(/[^\d.-]/g,''))||0):0;};
      const name=find('dealername','dealer name','name','party','firm');
      if(!name||name.length<2||/^[\d\s,]+$/.test(name)){results.skipped++;continue;}
      const monthData={achieved:findNum('achieved','ach','qty','sales'),target:findNum('target','tgt'),status:find('status')||'ACTIVE',zone:find('zone'),category:find('categorytype','category'),categoryType:find('subcategory','subcat'),city:find('city'),state:find('state')};
      try{
        const rx=new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
        const ex=await Dealer.findOne({name:rx,salesman:smId});
        if(ex){
          // EXPLICIT PERSISTENCE: load, mutate, save.
          // Using findByIdAndUpdate with dotted Map paths sometimes silently
          // fails to write Mongoose Map entries. The load-mutate-save flow
          // below is more reliable for Map<string, schema>.
          if(!ex.monthlyData) ex.monthlyData = new Map();
          ex.monthlyData.set(month, monthData);
          ex.markModified('monthlyData');     // force Mongoose to write the Map
          if(monthData.city)   ex.city = monthData.city;
          if(monthData.state)  ex.state = monthData.state;
          if(monthData.zone)   ex.zone = monthData.zone;
          // IMPORTANT: Do NOT auto-seed ex.target from this month's target.
          // Earlier code did `if(ex.target === 0) ex.target = monthData.target`
          // which leaked June's target into May's display (May's target fallback
          // uses d.target when no per-month target exists). The global target
          // should only ever be set by the initial sheet sync, NEVER by a
          // monthly upload — those go ONLY into monthlyData.<month>.target.
          ex.source = 'upload';
          await ex.save();
          results.updated++;
        } else {
          // New dealer created by monthly upload.
          // IMPORTANT: do NOT seed the global target from this month's target.
          // That would cause this month's value to leak to other months via
          // the smart-target fallback. The per-month target lives in
          // monthlyData[month].target where it belongs.
          await Dealer.create({
            name, salesman:smId,
            city:monthData.city||'', state:monthData.state||'', zone:monthData.zone||'',
            status:monthData.status||'ACTIVE',
            category:monthData.category||'', categoryType:monthData.categoryType||'',
            target: 0,   // leave baseline empty; only sheet-sync seeds it
            monthlyData:{[month]:monthData},
            source:'upload',
          });
          results.added++;
        }
      }catch(e){
        console.error('[UPLOAD] dealer error:', name, e.message);
        results.errors.push(`${name}: ${e.message}`);
      }
    }
    // Summary log: confirms persistence and helps trace data-loss issues.
    console.log(`[UPLOAD] month=${month} salesman=${smId} added=${results.added} updated=${results.updated} skipped=${results.skipped} errors=${results.errors.length} total=${rows.length}`);
    // Verify: re-count how many dealers actually have this month in DB now
    try {
      const verifyCount = await Dealer.countDocuments({
        salesman: smId,
        [`monthlyData.${month}`]: { $exists: true },
      });
      console.log(`[UPLOAD] verify: ${verifyCount} ${smId} dealers now have ${month} in DB`);
    } catch {}

    res.json({...results,month,salesman:smId,total:rows.length});
  }catch(e){
    console.error('[UPLOAD]', e.message);
    res.status(500).json({error:e.message});
  }
});

// ── POST /api/dealers/dedupe — admin only ──────────────────────────────────
// Finds dealers that have the same salesman + normalized name (case &
// whitespace insensitive). For each duplicate group:
//   1. Keep the dealer with the MOST monthlyData entries (canonical)
//   2. Merge other duplicates' monthlyData into canonical (only for months
//      canonical doesn't already have)
//   3. Delete the duplicate records
// Returns: { dealersScanned, groupsFound, duplicatesRemoved, sample[] }
// Pass {dryRun:true} in body to preview without changes.
router.post('/dedupe', protect, adminOnly, async (req, res) => {
  try {
    const dryRun = req.body?.dryRun === true;
    const all = await Dealer.find({});
    const normalize = s => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const groups = {};
    for(const d of all){
      const key = (d.salesman || '__none') + '|' + normalize(d.name);
      if(!groups[key]) groups[key] = [];
      groups[key].push(d);
    }
    let groupsFound = 0, duplicatesRemoved = 0;
    const sample = [];
    for(const key of Object.keys(groups)){
      const grp = groups[key];
      if(grp.length <= 1) continue;
      groupsFound++;
      // Sort: most monthlyData first, then most recent updatedAt
      grp.sort((a, b) => {
        const aCount = a.monthlyData ? (a.monthlyData.size ?? Object.keys(a.monthlyData || {}).length) : 0;
        const bCount = b.monthlyData ? (b.monthlyData.size ?? Object.keys(b.monthlyData || {}).length) : 0;
        if(aCount !== bCount) return bCount - aCount;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
      const canonical = grp[0];
      const dupes = grp.slice(1);
      if(sample.length < 8){
        sample.push({
          salesman: canonical.salesman,
          name: canonical.name,
          kept: { id: canonical._id.toString(), monthsCount: canonical.monthlyData?.size || 0 },
          removed: dupes.map(d => ({ id: d._id.toString(), name: d.name, monthsCount: d.monthlyData?.size || 0 })),
        });
      }
      if(!dryRun){
        // Merge missing months from duplicates into canonical
        let canonicalModified = false;
        for(const dup of dupes){
          if(!dup.monthlyData) continue;
          for(const [m, entry] of dup.monthlyData.entries()){
            if(!canonical.monthlyData.has(m)){
              canonical.monthlyData.set(m, entry);
              canonicalModified = true;
            }
          }
        }
        if(canonicalModified){
          canonical.markModified('monthlyData');
          await canonical.save();
        }
        // Delete the duplicates
        for(const dup of dupes){
          await Dealer.findByIdAndDelete(dup._id);
          duplicatesRemoved++;
        }
      } else {
        duplicatesRemoved += dupes.length;
      }
    }
    console.log(`[DEDUPE] dryRun=${dryRun} dealersScanned=${all.length} groupsFound=${groupsFound} duplicatesRemoved=${duplicatesRemoved}`);
    res.json({ ok:true, dryRun, dealersScanned: all.length, groupsFound, duplicatesRemoved, sample });
  } catch(e){
    console.error('[DEDUPE]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dealers/wipe-all — admin only (DESTRUCTIVE) ──────────────────
// Deletes ALL dealer records. Use to start fresh. Requires explicit confirm
// in the request body to prevent accidents. Returns the number deleted.
router.post('/wipe-all', protect, adminOnly, async (req, res) => {
  try {
    if(req.body?.confirm !== 'YES_WIPE_ALL'){
      return res.status(400).json({
        error: 'Confirmation required',
        hint:  'Send {"confirm":"YES_WIPE_ALL"} in the request body',
      });
    }
    const before = await Dealer.countDocuments();
    const result = await Dealer.deleteMany({});
    res.json({ ok:true, deleted: result.deletedCount, countedBefore: before });
  } catch(e){
    console.error('[WIPE-ALL]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dealers/repair-targets — admin only ─────────────────────────
// One-time repair tool: copies the dealer's global `target` field into
// monthlyData[m].target for every month that has achievement > 0 but no
// per-month target stored. This back-fills historical Sheets-imported data
// so each month shows its own target (and we can stop relying on the
// global-target fallback that was getting corrupted by monthly uploads).
//
// Returns: { dealersScanned, monthsBackfilled, sample[] }
router.post('/repair-targets', protect, adminOnly, async (req, res) => {
  try {
    const all = await Dealer.find({});
    let dealersScanned = 0;
    let monthsBackfilled = 0;
    const sample = [];
    for(const d of all){
      dealersScanned++;
      const globalT = Number(d.target) || 0;
      if(globalT <= 0) continue;
      const md = d.monthlyData;
      if(!md) continue;
      const keys = (typeof md.keys === 'function') ? Array.from(md.keys()) : Object.keys(md);
      const updates = {};
      for(const m of keys){
        const entry = (typeof md.get === 'function') ? md.get(m) : md[m];
        const ach = Number(entry?.achieved) || 0;
        const tgt = Number(entry?.target) || 0;
        if(ach > 0 && tgt === 0){
          // back-fill this month's target from the global
          updates[`monthlyData.${m}.target`] = globalT;
          monthsBackfilled++;
          if(sample.length < 8) sample.push({ dealer:d.name, salesman:d.salesman, month:m, target:globalT });
        }
      }
      if(Object.keys(updates).length > 0){
        await Dealer.findByIdAndUpdate(d._id, { $set: updates });
      }
    }
    res.json({ ok:true, dealersScanned, monthsBackfilled, sample });
  } catch(e){
    console.error('[REPAIR-TARGETS]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/sync-db', protect, adminOnly, async (req,res) => {
  // CRITICAL: This route MERGES per-month data into each dealer instead of
  // replacing the entire monthlyData map. Why: a previous version did
  // `$set: { monthlyData }` which wiped out any months you'd uploaded manually
  // via Monthly Entry / Manage Months that weren't in the source sheet.
  // Now we only $set monthlyData.<month> for months the sheet provides — all
  // other months in the dealer's DB record stay untouched.
  try {
    const { dealers, MO } = req.body;
    if(!dealers?.length) return res.status(400).json({ error: 'No dealers' });
    let saved = 0, errors = 0, monthsTouched = 0;
    for(const d of dealers){
      try {
        // Build the per-month entries we got from the sheet payload
        const monthsToWrite = {};
        (MO || []).forEach((m, i) => {
          const ach = Number(d.months?.[i]) || 0;
          const tgt = Number(d.monthTargets?.[i] ?? d.monthTargets?.[String(i)]) || 0;
          if(ach || tgt){
            monthsToWrite[m] = {
              achieved: ach,
              target:   tgt,
              status:   d.status || 'ACTIVE',
              zone:     d.zone || '',
              category: d.category || '',
              categoryType: d.categoryType || '',
              city:     d.city || '',
              state:    d.state || '',
            };
          }
        });

        // Build a $set update that ONLY touches the dealer's basic fields +
        // the specific months the sheet has data for. We use dotted paths
        // (monthlyData.<month>) so MongoDB only modifies those map entries
        // and leaves every other month intact.
        const update = {
          name: d.name,
          salesman: d.salesman,
          city:  d.city  || '',
          state: d.state || '',
          zone:  d.zone  || '',
          status: d.status || 'ACTIVE',
          category: d.category || '',
          categoryType: d.categoryType || '',
          avg6m: Number(d.avg6m) || 0,
          creditDays:  Number(d.creditDays)  || 0,
          creditLimit: Number(d.creditLimit) || 0,
          source: 'sheet',
        };
        // Seed the global baseline target only the FIRST time (when it's empty
        // on the dealer record). Don't overwrite a manually-set baseline.
        if(d.target && Number(d.target) > 0){
          // existing doc check happens via the upsert query; the actual guard
          // is below via a $setOnInsert + conditional $set
        }
        Object.entries(monthsToWrite).forEach(([m, entry]) => {
          update[`monthlyData.${m}`] = entry;
          monthsTouched++;
        });

        const rx = new RegExp(`^${d.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        // Two-phase write to avoid overwriting a manually-set global target:
        //   1. Upsert with $setOnInsert for target — only applied on insert
        //   2. $set everything else
        await Dealer.findOneAndUpdate(
          { name: rx, salesman: d.salesman },
          {
            $set: update,
            $setOnInsert: { target: Number(d.target) || 0 },
          },
          { upsert: true }
        );
        saved++;
      } catch(e){
        errors++;
        console.error('[SYNC-DB] dealer error:', d.name, e.message);
      }
    }
    // Summary: show which months from MO were actually touched vs preserved.
    // A month is "touched" if at least one dealer's payload had non-zero
    // achieved/target for it. All other months in MO stay UNTOUCHED in DB.
    const monthsInPayload = new Set();
    dealers.forEach(d => {
      (MO || []).forEach((m, i) => {
        const ach = Number(d.months?.[i]) || 0;
        const tgt = Number(d.monthTargets?.[i] ?? d.monthTargets?.[String(i)]) || 0;
        if(ach || tgt) monthsInPayload.add(m);
      });
    });
    const touched   = [...monthsInPayload].sort();
    const preserved = (MO || []).filter(m => !monthsInPayload.has(m));
    console.log(`[SYNC-DB] saved=${saved} errors=${errors} dealers=${dealers.length}`);
    console.log(`[SYNC-DB] months TOUCHED by sync:   [${touched.join(', ')}]`);
    console.log(`[SYNC-DB] months PRESERVED (sheet had no data — kept as-is in DB):   [${preserved.join(', ')}]`);

    res.json({ saved, errors, monthsTouched, dealers: dealers.length, touched, preserved });
  } catch(e){
    console.error('[SYNC-DB]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', protect, async (req,res) => {
  try {
    const d=await Dealer.findById(req.params.id).lean();
    if(!d) return res.status(404).json({error:'Not found'});
    if(req.user.role!=='admin'&&d.salesman!==req.user.id) return res.status(403).json({error:'Not your dealer'});
    res.json(fmt(d,req.query.mo?.split(',')||[]));
  }catch(e){res.status(500).json({error:e.message});}
});

router.post('/', protect, async (req,res) => {
  try {
    const data={...req.body};
    if(req.user.role!=='admin') data.salesman=req.user.id;
    const d=await Dealer.create(data);
    res.json(fmt(d.toObject(),[]));
  }catch(e){res.status(500).json({error:e.message});}
});

router.put('/:id', protect, async (req,res) => {
  try {
    const ex=await Dealer.findById(req.params.id);
    if(!ex) return res.status(404).json({error:'Not found'});
    if(req.user.role!=='admin'&&ex.salesman!==req.user.id) return res.status(403).json({error:'Not your dealer'});
    const setObj={};
    for(const [k,v] of Object.entries(req.body)){
      if(k.startsWith('monthlyData.')&&v&&typeof v==='object'){Object.entries(v).forEach(([f,fv])=>{setObj[`${k}.${f}`]=fv;});}else{setObj[k]=v;}
    }
    const d=await Dealer.findByIdAndUpdate(req.params.id,{$set:setObj},{new:true,runValidators:false}).lean();
    res.json(fmt(d,[]));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete('/:id', protect, adminOnly, async (req,res) => {
  try { await Dealer.findByIdAndDelete(req.params.id); res.json({ok:true}); }
  catch(e){res.status(500).json({error:e.message});}
});

export default router;
