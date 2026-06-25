import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';

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
  // Auto-learned GPS location of the dealer's physical site. Set the first
  // time a salesperson successfully checks in with GPS at this dealer; used
  // afterwards to power "nearby dealer" suggestions on the Visits page.
  locLat:       { type:Number, default:null },
  locLng:       { type:Number, default:null },
  locUpdatedAt: { type:Date,   default:null },
  locAccuracy:  { type:Number, default:null },
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
    // Auto-learned GPS for nearby-dealer suggestions on the Visits page
    locLat:d.locLat ?? null,
    locLng:d.locLng ?? null,
    locUpdatedAt:d.locUpdatedAt || null,
  };
};

// Staff = admin OR superadmin (both see everything). Salesmen only see their own.
const isStaff = (req) => req.user?.role === 'admin' || req.user?.role === 'superadmin';

// ── GET /api/dealers/last-updated ─────────────────────────────────────────
// Lightweight ping — returns the timestamp of the most recently modified
// dealer record in the DB (any field: Achieved / Target / Status / Zone /
// City / etc.). The client polls this every minute so the "Last updated"
// stamp on Overview reflects real DB writes, not the page-load time.
//
// Salesmen see only their own dealers; staff see everyone.
router.get('/last-updated', protect, async (req, res) => {
  try {
    const filter = isStaff(req) ? {} : { salesman: req.user.id };
    const latest = await Dealer.findOne(filter, { updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ lastUpdatedAt: latest?.updatedAt || null });
  } catch (e) {
    console.error('[DEALERS LAST-UPDATED]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const filter = isStaff(req)?{}:{salesman:req.user.id};
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
    // smId is the "default" salesman if no per-row Salesman column is present.
    // Staff (admin/superadmin) may pick a salesman, OR send '_all' / '' to ask
    // the server to read a per-row Salesman column from the file.
    const isAllMode = isStaff(req) && (uploadSm === '_all' || uploadSm === 'all' || !uploadSm);
    const smId = isStaff(req)?(uploadSm && uploadSm!=='_all' && uploadSm!=='all' ? uploadSm : req.user.id):req.user.id;
    if(!month) return res.status(400).json({error:'month required'});
    if(!req.file) return res.status(400).json({error:'No file'});

    // Build a {normalized-name → user.id} map for routing rows when the file
    // includes a Salesman column (All-Salesmen upload). We compare on the
    // lowercased, space-stripped form so "Rakesh Boriwal" matches "RAKESH BORIWAL".
    let nameToId = null;
    if(isAllMode){
      const User = mongoose.models.User || (await import('../models/User.js')).default;
      if(User){
        const allUsers = await User.find({ role:'salesman' }, 'id name').lean();
        nameToId = new Map();
        for(const u of allUsers){
          const norm = (u.name||'').toLowerCase().replace(/\s+/g,' ').trim();
          if(norm) nameToId.set(norm, u.id);
          // Also map by id itself in case someone wrote the id in the column.
          nameToId.set((u.id||'').toLowerCase(), u.id);
        }
      }
    }

    const wb=XLSX.read(req.file.buffer,{type:'buffer'});
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
    if(!rows.length) return res.status(400).json({error:'No data'});
    const results={added:0,updated:0,skipped:0,errors:[],perSalesman:{}};
    const bump=(k,who)=>{ if(!results.perSalesman[who]) results.perSalesman[who]={added:0,updated:0,skipped:0}; results.perSalesman[who][k]++; };
    for(const row of rows){
      const keys=Object.keys(row);
      const find=(...t)=>{for(const x of t){const k=keys.find(k=>k.toLowerCase().replace(/[\s_-]/g,'').includes(x.toLowerCase().replace(/[\s_-]/g,'')));if(k&&String(row[k]).trim())return String(row[k]).trim();}return'';};
      const findNum=(...t)=>{const v=find(...t);return v?Math.round(parseFloat(v.replace(/[^\d.-]/g,''))||0):0;};
      const name=find('dealername','dealer name','name','party','firm');
      if(!name||name.length<2||/^[\d\s,]+$/.test(name)){results.skipped++;continue;}

      // Per-row salesman resolution
      let rowSm = smId;
      if(isAllMode){
        const rawSm = find('salesman','sales man','sm');
        if(rawSm && nameToId){
          const norm = rawSm.toLowerCase().replace(/\s+/g,' ').trim();
          const found = nameToId.get(norm) || nameToId.get(norm.replace(/\s+/g,''));
          if(found) rowSm = found;
          else { results.skipped++; results.errors.push(`${name}: unknown salesman "${rawSm}"`); continue; }
        } else {
          // All mode but no Salesman column on row — skip to avoid mis-assigning
          results.skipped++; results.errors.push(`${name}: missing Salesman column`); continue;
        }
      }

      const monthData={achieved:findNum('achieved','ach','qty','sales'),target:findNum('target','tgt'),status:find('status')||'ACTIVE',zone:find('zone'),category:find('categorytype','category'),categoryType:find('subcategory','subcat'),city:find('city'),state:find('state')};
      try{
        const rx=new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
        const ex=await Dealer.findOne({name:rx,salesman:rowSm});
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
          bump('updated', rowSm);
        } else {
          // New dealer created by monthly upload.
          // IMPORTANT: do NOT seed the global target from this month's target.
          // That would cause this month's value to leak to other months via
          // the smart-target fallback. The per-month target lives in
          // monthlyData[month].target where it belongs.
          await Dealer.create({
            name, salesman:rowSm,
            city:monthData.city||'', state:monthData.state||'', zone:monthData.zone||'',
            status:monthData.status||'ACTIVE',
            category:monthData.category||'', categoryType:monthData.categoryType||'',
            target: 0,   // leave baseline empty; only sheet-sync seeds it
            monthlyData:{[month]:monthData},
            source:'upload',
          });
          results.added++;
          bump('added', rowSm);
        }
      }catch(e){
        console.error('[UPLOAD] dealer error:', name, e.message);
        results.errors.push(`${name}: ${e.message}`);
      }
    }
    // Summary log: confirms persistence and helps trace data-loss issues.
    console.log(`[UPLOAD] month=${month} mode=${isAllMode?'ALL':'single('+smId+')'} added=${results.added} updated=${results.updated} skipped=${results.skipped} errors=${results.errors.length} total=${rows.length}`);
    // Verify only for single-salesman uploads (counting per-row in all-mode is noisy)
    if(!isAllMode){
      try {
        const verifyCount = await Dealer.countDocuments({
          salesman: smId,
          [`monthlyData.${month}`]: { $exists: true },
        });
        console.log(`[UPLOAD] verify: ${verifyCount} ${smId} dealers now have ${month} in DB`);
      } catch {}
    }

    res.json({...results, month, salesman: isAllMode?'_all':smId, total: rows.length, mode: isAllMode?'all':'single'});
  }catch(e){
    console.error('[UPLOAD]', e.message);
    res.status(500).json({error:e.message});
  }
});

// ── POST /api/dealers/delete-by-source — admin only ───────────────────────
// Deletes every Dealer where `source` equals the value sent in the body.
// Use this to undo a bad bulk-upload that mis-created dealers — e.g. the
// category-wise Excel upload tags new dealers with source='cat-upload', so
// posting { source:'cat-upload' } removes ONLY those, leaving your original
// roster (source='sheet' / 'manual' / etc.) untouched.
//
// Before deleting, Sale rows that reference each removed dealer (by id OR by
// name) are re-pointed at a same-named dealer in the surviving set if one
// exists — so per-category sales history isn't lost.
//
// Body: { source:'cat-upload', dryRun:true|false }
router.post('/delete-by-source', protect, adminOnly, async (req, res) => {
  try {
    const source = String(req.body?.source || '').trim();
    if (!source) return res.status(400).json({ error: 'source required' });
    const dryRun = req.body?.dryRun === true;

    // Find dealers to delete + the surviving canonical set
    const toDelete = await Dealer.find({ source }).lean();
    const survivors = await Dealer.find({ source: { $ne: source } }, { name:1, salesman:1, _id:1 }).lean();
    const survivorByLowerName = new Map();
    for (const s of survivors) {
      survivorByLowerName.set(String(s.name).toLowerCase().trim(), s);
    }

    let migrated = 0;
    let Sale = null;
    try { Sale = (await import('../models/Sale.js')).default; } catch {}

    if (!dryRun && Sale && toDelete.length) {
      for (const d of toDelete) {
        const canon = survivorByLowerName.get(String(d.name).toLowerCase().trim());
        if (!canon) continue;     // no canonical → leave sale rows by name; they'll still show in aggregates
        const r = await Sale.updateMany(
          { $or: [{ dealerId: d._id }, { dealerName: d.name }] },
          { $set: { dealerName: canon.name, dealerId: canon._id } }
        );
        migrated += r.modifiedCount || 0;
      }
    }

    let deleted = 0;
    if (!dryRun && toDelete.length) {
      const result = await Dealer.deleteMany({ source });
      deleted = result.deletedCount || 0;
    } else {
      deleted = toDelete.length;
    }

    console.log(`[DELETE-BY-SOURCE] dryRun=${dryRun} source=${source} would-delete=${toDelete.length} migrated=${migrated} deleted=${deleted}`);
    res.json({
      ok: true,
      dryRun,
      source,
      survivorCount: survivors.length,
      candidatesFound: toDelete.length,
      migrated,
      deleted,
      sample: toDelete.slice(0, 15).map(d => ({ id:String(d._id), name:d.name, salesman:d.salesman })),
    });
  } catch (e) {
    console.error('[DELETE-BY-SOURCE]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dealers/cleanup-suffix-dupes — admin only ───────────────────
// Removes dealers whose name is "<canonical name> <salesman first name>"
// (or "<canonical name>_<salesman first name>", etc.), where a canonical
// shorter-named dealer with the same salesman already exists.
//
// Examples we'll catch:
//   "76 EAST pranav"               → duplicate of "76 EAST"     (salesman: Pranav)
//   "A AND M INTERIO LLP ratish"   → duplicate of "A AND M INTERIO LLP"
//   "A C FRANCIS SONS rakesh"      → duplicate of "A C FRANCIS SONS"
//
// Sale rows belonging to the duplicate are migrated to the canonical dealer
// first, then the duplicate is deleted.
// Body: { dryRun:true|false }
router.post('/cleanup-suffix-dupes', protect, adminOnly, async (req, res) => {
  try {
    const dryRun = req.body?.dryRun === true;

    // Build a set of every salesman's first name (lower-cased)
    let User;
    try { User = (await import('../models/User.js')).default; } catch { User = null; }
    const userDocs = User ? await User.find({}, { name:1, id:1 }).lean() : [];
    const salesmanFirstNames = new Set();
    for (const u of userDocs) {
      const name = String(u.name || u.id || '').trim();
      if (!name) continue;
      const first = name.split(/\s+/)[0].toLowerCase();
      if (first.length >= 2) salesmanFirstNames.add(first);
    }
    // Also pull salesman tokens straight off the dealer rows (covers cases
    // where the user typed a name we don't have in the User collection).
    const allDealers = await Dealer.find({}, { name:1, salesman:1, _id:1 }).lean();
    for (const d of allDealers) {
      const s = String(d.salesman || '').trim();
      if (!s) continue;
      const first = s.split(/\s+/)[0].toLowerCase();
      if (first.length >= 2) salesmanFirstNames.add(first);
    }

    // Index dealers by (salesman, normalized-name) for quick lookup of the canonical row
    const normalize = s => (s || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const bySalesAndName = new Map();
    for (const d of allDealers) {
      bySalesAndName.set((d.salesman || '__none') + '|' + normalize(d.name), d);
    }

    // Try to load the Sale model so we can migrate sales before deleting
    let Sale = null;
    try { Sale = (await import('../models/Sale.js')).default; } catch {}

    const candidates = [];
    for (const d of allDealers) {
      const nameLow = String(d.name || '').toLowerCase().trim();
      // skip if no trailing word
      const parts = nameLow.split(/\s+/);
      if (parts.length < 2) continue;
      const lastWord = parts[parts.length - 1];

      // Only treat the last word as a "salesman suffix" if it matches a known
      // salesman first name AND a shorter canonical sibling exists.
      if (!salesmanFirstNames.has(lastWord)) continue;

      const shortName = parts.slice(0, -1).join(' ');
      const canonical = bySalesAndName.get((d.salesman || '__none') + '|' + shortName);
      if (!canonical || String(canonical._id) === String(d._id)) continue;

      candidates.push({
        dupeId:     String(d._id),
        dupeName:   d.name,
        canonical:  { id: String(canonical._id), name: canonical.name },
        salesman:   d.salesman || '',
      });
    }

    let migrated = 0, deleted = 0;
    if (!dryRun) {
      for (const c of candidates) {
        // 1. Move any Sale rows from dupe → canonical (by id and by name).
        if (Sale) {
          const r = await Sale.updateMany(
            { $or: [{ dealerId: c.dupeId }, { dealerName: c.dupeName }] },
            { $set: { dealerName: c.canonical.name, dealerId: c.canonical.id } }
          );
          migrated += r.modifiedCount || 0;
        }
        // 2. Delete the duplicate dealer
        await Dealer.findByIdAndDelete(c.dupeId);
        deleted++;
      }
    }

    console.log(`[CLEANUP-SUFFIX-DUPES] dryRun=${dryRun} found=${candidates.length} migrated=${migrated} deleted=${deleted}`);
    res.json({
      ok: true,
      dryRun,
      scanned: allDealers.length,
      salesmanFirstNames: [...salesmanFirstNames],
      found: candidates.length,
      migrated,
      deleted,
      sample: candidates.slice(0, 15),
    });
  } catch (e) {
    console.error('[CLEANUP-SUFFIX-DUPES]', e.message);
    res.status(500).json({ error: e.message });
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

// ── POST /api/dealers/dedupe-stripped — admin only ─────────────────────────
// Like /dedupe, but with much more aggressive name normalization: lowercase
// + strip EVERY non-alphanumeric character. This catches duplicates where
// the names differ only by spaces / punctuation, e.g. "1000 KITCHENS
// INTERIORS" vs "1000KITCHENSINTERIORS" (a classic outcome of uploading an
// Excel whose names were exported without spaces).
//
// For each group:
//   1. Sort: dealers whose source is NOT 'cat-upload' come first (we want
//      to keep the ORIGINAL, pre-upload dealer as canonical), then by most
//      monthlyData, then most recent updatedAt.
//   2. Migrate every Sale row from each duplicate to the canonical.
//   3. Merge monthlyData — copy a month from a duplicate only when the
//      canonical's entry is missing OR is empty (achieved + target == 0).
//   4. Delete the duplicates.
//
// Body: { dryRun:true|false }
router.post('/dedupe-stripped', protect, adminOnly, async (req, res) => {
  try {
    const dryRun = req.body?.dryRun === true;
    const all = await Dealer.find({});
    // Aggressive normalization — collapses spaces, punctuation, case
    const strip = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    // Group by (salesman, stripped-name). Same name across different
    // salesmen stays as separate groups (that's a legitimate cross-rep
    // scenario, not a duplicate).
    const groups = new Map();
    for (const d of all) {
      const key = strip(d.salesman) + '|' + strip(d.name);
      if (!key.endsWith('|')) {
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(d);
      }
    }

    // Try to load Sale model for migration
    let Sale = null;
    try { Sale = (await import('../models/Sale.js')).default; } catch {}

    let groupsFound = 0;
    let duplicatesRemoved = 0;
    let salesMigrated = 0;
    const sample = [];

    for (const [key, grp] of groups) {
      if (grp.length <= 1) continue;
      groupsFound++;
      // Prefer dealers whose source is NOT 'cat-upload' (the originals),
      // then those with the most months of history, then most recent updates.
      grp.sort((a, b) => {
        const aUpload = a.source === 'cat-upload' ? 1 : 0;
        const bUpload = b.source === 'cat-upload' ? 1 : 0;
        if (aUpload !== bUpload) return aUpload - bUpload;
        const aCount = a.monthlyData ? (a.monthlyData.size ?? Object.keys(a.monthlyData || {}).length) : 0;
        const bCount = b.monthlyData ? (b.monthlyData.size ?? Object.keys(b.monthlyData || {}).length) : 0;
        if (aCount !== bCount) return bCount - aCount;
        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
      });
      const canonical = grp[0];
      const dupes = grp.slice(1);

      if (sample.length < 12) {
        sample.push({
          salesman: canonical.salesman,
          keptName: canonical.name,
          keptId: String(canonical._id),
          keptSource: canonical.source,
          removed: dupes.map(d => ({
            id: String(d._id),
            name: d.name,
            source: d.source,
            monthsCount: d.monthlyData ? (d.monthlyData.size ?? Object.keys(d.monthlyData || {}).length) : 0,
          })),
        });
      }

      if (!dryRun) {
        // 1. Migrate Sale rows from every dupe → canonical
        if (Sale) {
          const dupeIds   = dupes.map(d => String(d._id));
          const dupeNames = dupes.map(d => d.name);
          const r = await Sale.updateMany(
            { $or: [
              { dealerId: { $in: dupeIds } },
              { dealerName: { $in: dupeNames } },
            ] },
            { $set: { dealerName: canonical.name, dealerId: String(canonical._id) } }
          );
          salesMigrated += r.modifiedCount || 0;
        }

        // 2. Merge monthlyData — accept the duplicate's value only when the
        // canonical doesn't have one or its entry is empty.
        let canonicalModified = false;
        const canonicalIsMap = canonical.monthlyData instanceof Map;
        const cmGet = k => canonicalIsMap ? canonical.monthlyData.get(k) : canonical.monthlyData?.[k];
        const cmSet = (k, v) => {
          if (canonicalIsMap) canonical.monthlyData.set(k, v);
          else { canonical.monthlyData = canonical.monthlyData || {}; canonical.monthlyData[k] = v; }
        };
        const isEmpty = e => !e || (((Number(e.achieved)||0) + (Number(e.target)||0)) === 0);

        for (const dup of dupes) {
          const dm = dup.monthlyData;
          if (!dm) continue;
          const entries = dm instanceof Map ? [...dm.entries()] : Object.entries(dm);
          for (const [m, entry] of entries) {
            const existing = cmGet(m);
            if (!existing || isEmpty(existing)) {
              cmSet(m, entry);
              canonicalModified = true;
            }
          }
        }
        if (canonicalModified) {
          canonical.markModified('monthlyData');
          await canonical.save();
        }

        // 3. Delete duplicates
        for (const dup of dupes) {
          await Dealer.findByIdAndDelete(dup._id);
          duplicatesRemoved++;
        }
      } else {
        duplicatesRemoved += dupes.length;
      }
    }

    console.log(`[DEDUPE-STRIPPED] dryRun=${dryRun} dealersScanned=${all.length} groupsFound=${groupsFound} duplicatesRemoved=${duplicatesRemoved} salesMigrated=${salesMigrated}`);
    res.json({
      ok: true,
      dryRun,
      dealersScanned: all.length,
      groupsFound,
      duplicatesRemoved,
      salesMigrated,
      sample,
    });
  } catch (e) {
    console.error('[DEDUPE-STRIPPED]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/dealers/month/:label — admin only (DESTRUCTIVE) ────────────
// Removes the monthlyData entry for the given label (e.g., "Jun-26") from
// EVERY dealer. Use this when removing a future/empty month so that re-adding
// it later starts truly empty (no stale data resurrects). Returns the number
// of dealers touched.
router.delete('/month/:label', protect, adminOnly, async (req, res) => {
  try {
    const label = (req.params.label || '').trim();
    if(!label) return res.status(400).json({ error:'month label required' });

    // $unset the dotted-path key from each dealer that has it.
    const result = await Dealer.updateMany(
      { ['monthlyData.' + label]: { $exists: true } },
      { $unset: { ['monthlyData.' + label]: '' } }
    );
    console.log(`[DELETE MONTH] label=${label} touched=${result.modifiedCount} dealers`);
    res.json({ ok:true, label, dealersTouched: result.modifiedCount });
  } catch(e){
    console.error('[DELETE MONTH]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dealers/wipe-all — SUPERADMIN ONLY (DESTRUCTIVE) ─────────────
// Deletes ALL dealer records. Use to start fresh. Locked to superadmin only
// — a regular admin can't trigger this even via direct API call. Requires
// explicit confirm in the request body to prevent accidents.
router.post('/wipe-all', protect, superAdminOnly, async (req, res) => {
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
// POST /api/dealers/rename-recently-inactive — admin tool. Replaces every
// dealer status equal to "RECENTLY INACTIVE" (and minor variants) with
// "REACTIVE", both on the top-level status field and inside monthlyData.
router.post('/rename-recently-inactive', protect, adminOnly, async (req, res) => {
  try {
    const variants = ['RECENTLY INACTIVE','Recently Inactive','recently inactive','RECENTLY_INACTIVE'];
    const top = await Dealer.updateMany(
      { status: { $in: variants } },
      { $set: { status: 'REACTIVE' } },
    );
    // Walk monthlyData inside each dealer that still has the old value
    const cursor = Dealer.find({ 'monthlyData': { $exists: true } }).cursor();
    let monthsTouched = 0, dealersTouched = 0;
    for await (const d of cursor){
      if(!d.monthlyData) continue;
      let changed = false;
      for(const [key, val] of d.monthlyData.entries()){
        if(val && variants.includes(val.status)){
          val.status = 'REACTIVE';
          d.monthlyData.set(key, val);
          changed = true;
          monthsTouched++;
        }
      }
      if(changed){ d.markModified('monthlyData'); await d.save(); dealersTouched++; }
    }
    res.json({
      ok:true,
      topLevelUpdated: top.modifiedCount,
      monthlyDataDealersUpdated: dealersTouched,
      monthlyEntriesUpdated: monthsTouched,
    });
  } catch(e){
    console.error('[RENAME]', e.message);
    res.status(500).json({ error: e.message });
  }
});

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
    if(!isStaff(req)&&d.salesman!==req.user.id) return res.status(403).json({error:'Not your dealer'});
    res.json(fmt(d,req.query.mo?.split(',')||[]));
  }catch(e){res.status(500).json({error:e.message});}
});

router.post('/', protect, async (req,res) => {
  try {
    const data={...req.body};
    if(!isStaff(req)) data.salesman=req.user.id;
    const d=await Dealer.create(data);
    res.json(fmt(d.toObject(),[]));
  }catch(e){res.status(500).json({error:e.message});}
});

router.put('/:id', protect, async (req,res) => {
  try {
    const ex=await Dealer.findById(req.params.id);
    if(!ex) return res.status(404).json({error:'Not found'});
    if(!isStaff(req)&&ex.salesman!==req.user.id) return res.status(403).json({error:'Not your dealer'});
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
