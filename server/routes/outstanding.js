import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { protect, adminOnly, superAdminOnly, requireFeature } from '../middleware/auth.js';
import OutstandingBatch   from '../models/OutstandingBatch.js';
import OutstandingHistory from '../models/OutstandingHistory.js';
import AuditLog           from '../models/AuditLog.js';

const router = express.Router();
const upload = multer({ storage:multer.memoryStorage(), limits:{ fileSize:10*1024*1024 } });

// ── Helpers for the batch upload flow ──────────────────────────────────────

// Party-name normalization for Dealer-master matching: case-insensitive,
// trimmed, repeated whitespace collapsed. Deliberately NO fuzzy matching —
// a party that doesn't match exactly is reported UNMAPPED, never guessed.
const normName = (s) => String(s||'').toLowerCase().replace(/\s+/g,' ').trim();

// Canonicalize a sheet's month header to the app's 'Mon-YY' label so the same
// month never lands under two spellings ("August", "Aug-26", "Aug 2026" → 'Aug-26').
// Headers with no recognizable month keep their raw trimmed form (back-compat).
const MONTHS3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const canonMonth = (header) => {
  const raw = String(header||'').trim();
  const m = /^([A-Za-z]{3,9})[\s\-_,/]*((?:20)?\d{2})?$/.exec(raw);
  if(!m) return raw;
  const mi = MONTHS3.findIndex(x => m[1].toLowerCase().startsWith(x.toLowerCase()));
  if(mi < 0) return raw;
  let yy;
  if(m[2]){ yy = String(m[2]).slice(-2); }
  else {
    // No year in the header — assume this calendar year, unless that would
    // put the month in the future by more than a month (year-end uploads).
    const now = new Date();
    let y = now.getFullYear();
    if(mi > now.getMonth() + 1) y -= 1;
    yy = String(y).slice(-2);
  }
  return `${MONTHS3[mi]}-${yy}`;
};

// Chronological sort key for 'Mon-YY' labels; unparseable labels sort last.
const monthSortKey = (lbl) => {
  const m = /^([A-Za-z]{3})-(\d{2})$/.exec(String(lbl||'').trim());
  if(!m) return 9999*12;
  const mi = MONTHS3.findIndex(x=>x.toLowerCase()===m[1].toLowerCase());
  return (2000 + +m[2]) * 12 + (mi<0?0:mi);
};

// Parse the uploaded sheet into normalized rows:
//   [{ party, amounts: { 'Aug-26': 150000, ... } }]
// Blank cells are omitted (they mean "no change"); explicit 0 is kept.
const parseOutstandingSheet = (buffer) => {
  const wb = XLSX.read(buffer, { type:'buffer' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:'' });
  if(!rows.length) return { rows:[], months:[] };
  const headers = Object.keys(rows[0]);
  const nameCol = headers.find(h=>/dealer|name|party/i.test(h)) || headers[0];
  const monthCols = headers.filter(h=>h!==nameCol && String(h).trim())
    .map(h => ({ raw:h, label:canonMonth(h) }));
  const out = [];
  for(const row of rows){
    const party = String(row[nameCol]||'').trim();
    if(!party || party.length<2) continue;
    if(/^[\d\s,₹]+$/.test(party)) continue;
    if(['total','totals','dealer name','name','party name'].includes(party.toLowerCase())) continue;
    const amounts = {};
    for(const c of monthCols){
      const sv = (row[c.raw]===null||row[c.raw]===undefined) ? '' : String(row[c.raw]).trim();
      if(sv==='') continue;                               // blank = no change
      amounts[c.label] = Math.round(parseFloat(sv.replace(/[^\d.-]/g,''))||0);
    }
    out.push({ party, amounts });
  }
  const months = [...new Set(monthCols.map(c=>c.label))].sort((a,b)=>monthSortKey(a)-monthSortKey(b));
  return { rows: out, months };
};

const audit = (req, action, detail) => AuditLog.create({
  by: req.user?.id||'', byName: req.user?.name||req.user?.id||'', action, detail,
}).catch(e=>console.warn('[AUDIT]', e.message));

const outSchema = new mongoose.Schema({
  dealerName:         { type:String, required:true, unique:true },
  monthlyOutstanding: { type:Map, of:Number, default:{} },
}, { timestamps:true });

const Outstanding = mongoose.models.Outstanding || mongoose.model('Outstanding', outSchema);

const toPlain = (doc) => {
  const mo = {};
  try {
    const raw = doc.monthlyOutstanding;
    if(raw instanceof Map) raw.forEach((v,k)=>{ mo[k]=Number(v)||0; });
    else if(raw&&typeof raw==='object') Object.keys(raw).forEach(k=>{ mo[k]=Number(raw[k])||0; });
  } catch(e){}
  return { _id:doc._id?.toString(), dealerName:doc.dealerName||'', monthlyOutstanding:mo };
};

// Staff = admin OR superadmin (both see all outstanding)
const isStaff = (req) => req.user?.role === 'admin' || req.user?.role === 'superadmin' || req.user?.role === 'employee';

router.get('/', protect, async (req, res) => {
  try {
    const all = await Outstanding.find({});
    if (req.user?.role === 'superadmin') return res.json(all.map(toPlain));
    const Dealer = mongoose.models.Dealer;
    if (!Dealer) return res.json([]);

    // Same priority order as the dealer route: explicit permissions win over
    // the salesman-own-dealers default.
    const User = (await import('../models/User.js')).default;
    const u = await User.findOne({ id: req.user.id }, 'permissions').lean();
    const p = u?.permissions || {};
    const hasStates   = Array.isArray(p.states)   && p.states.length   > 0;
    const hasCities   = Array.isArray(p.cities)   && p.cities.length   > 0;
    const hasZones    = Array.isArray(p.zones)    && p.zones.length    > 0;
    const hasSalesmen = Array.isArray(p.salesmen) && p.salesmen.length > 0;

    let dealerFilter = {};
    if (hasStates || hasCities || hasZones || hasSalesmen) {
      // Case-insensitive state/city/zone match — see dealers.js for rationale.
      const escape = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const ciMatch = v => new RegExp('^\\s*' + escape(v) + '\\s*$', 'i');
      // Geography OR among itself; salesmen AND-narrows (see dealers.js).
      const geo = [];
      if (hasStates) geo.push({ state: { $in: p.states.map(ciMatch) } });
      if (hasCities) geo.push({ city:  { $in: p.cities.map(ciMatch) } });
      if (hasZones)  geo.push({ zone:  { $in: p.zones.map(ciMatch) } });
      if (geo.length) dealerFilter.$or = geo;
      if (hasSalesmen) dealerFilter.salesman = { $in: p.salesmen };
    } else if (req.user?.role === 'salesman') {
      dealerFilter = { salesman: req.user.id };
    } else {
      // admin with no permissions → see everything
      return res.json(all.map(toPlain));
    }
    const myDealers = await Dealer.find(dealerFilter, 'name').lean();
    const myNames = new Set(myDealers.map(d => d.name.toLowerCase().trim()));
    res.json(all.filter(o => myNames.has(o.dealerName?.toLowerCase().trim())).map(toPlain));
  } catch(e){ console.error('[OUTSTANDING]',e.message); res.status(500).json({error:e.message}); }
});

// ── Upload (two-phase) ─────────────────────────────────────────────────────
// Phase 1 — ?preview=1: parse + match against the Dealer master, return a
//   full comparison (previous vs new totals per month, matched/unmapped
//   parties, biggest changes). NOTHING is written.
// Phase 2 — no flag: same parsing, then per matched dealer: same month =
//   UPDATE, new month = CREATE, months absent from the file untouched.
//   Creates an OutstandingBatch + per-row OutstandingHistory (with the value
//   each month held before, for revert) + an audit entry. UNMAPPED parties
//   are recorded on the batch — never written, never guessed.
//
// Data safety contract (unchanged from the old route): only the Outstanding
// collection's amounts are touched. Follow-ups live elsewhere and are never
// affected. Blank cells mean "no change"; write 0 explicitly to zero a month.
router.post('/upload', protect, superAdminOnly, upload.single('file'), async (req,res) => {
  try {
    if(!req.file) return res.status(400).json({error:'file required'});
    const isPreview = req.query.preview === '1' || req.body?.preview === '1';
    const { rows, months } = parseOutstandingSheet(req.file.buffer);
    if(!rows.length) return res.status(400).json({error:'No data rows found in the file'});

    // Dealer master lookup: normalized name → dealer (for salesman + identity).
    const Dealer = mongoose.models.Dealer || (await import('../models/Dealer.js')).default;
    const allDealers = await Dealer.find({}, 'name salesman').lean();
    const masterByNorm = new Map();
    for(const d of allDealers){
      const k = normName(d.name);
      if(k && !masterByNorm.has(k)) masterByNorm.set(k, d);
    }

    // Existing outstanding records for previous-value lookups.
    const existing = await Outstanding.find({}).lean();
    const outByNorm = new Map();
    for(const o of existing) outByNorm.set(normName(o.dealerName), o);
    const prevValOf = (o, month) => {
      if(!o) return null;
      const mo = o.monthlyOutstanding || {};
      return Object.prototype.hasOwnProperty.call(mo, month) ? (Number(mo[month])||0) : null;
    };

    const matched = [], unmapped = [];
    for(const r of rows){
      const dealer = masterByNorm.get(normName(r.party));
      if(dealer) matched.push({ ...r, dealerName: dealer.name, salesman: dealer.salesman });
      else unmapped.push({ party: r.party, amounts: r.amounts });
    }

    // Per-month previous vs new totals + per-dealer changes (for the preview
    // table and the change report).
    const perMonth = {};
    for(const m of months) perMonth[m] = { prevTotal:0, newTotal:0 };
    const changes = [];
    for(const r of matched){
      const o = outByNorm.get(normName(r.dealerName));
      for(const [m, amt] of Object.entries(r.amounts)){
        if(!perMonth[m]) perMonth[m] = { prevTotal:0, newTotal:0 };
        const prev = prevValOf(o, m);
        perMonth[m].prevTotal += prev||0;
        perMonth[m].newTotal  += amt;
        if(prev !== amt) changes.push({ dealer:r.dealerName, month:m, prev, next:amt, diff:amt-(prev||0) });
      }
    }
    changes.sort((a,b)=>Math.abs(b.diff)-Math.abs(a.diff));

    const latestMonth = months[months.length-1] || '';
    const totalAmount = matched.reduce((s,r)=>s+(r.amounts[latestMonth]||0),0);

    const summary = {
      months, latestMonth,
      totalRecords: rows.length,
      matched: matched.length,
      unmappedCount: unmapped.length,
      unmapped: unmapped.map(u=>u.party),
      perMonth,
      totalAmount,
      topChanges: changes.slice(0, 60),
      changedRows: changes.length,
    };

    if(isPreview) return res.json({ preview:true, ...summary });

    // ── Phase 2: write ────────────────────────────────────────────────────
    const batch = await OutstandingBatch.create({
      fileName: req.file.originalname || '',
      months,
      uploadedBy: req.user.id, uploadedByName: req.user.name || req.user.id,
      totalRecords: rows.length,
      matchedRecords: matched.length,
      unmappedRecords: unmapped.length,
      totalAmount,
      unmapped,
    });

    const results = { updated:0, created:0, errors:[] };
    const historyRows = [];
    for(const r of matched){
      try{
        const key = normName(r.dealerName);
        const o = outByNorm.get(key);
        const merged = {};
        if(o?.monthlyOutstanding) Object.assign(merged, o.monthlyOutstanding);
        for(const [m, amt] of Object.entries(r.amounts)){
          historyRows.push({
            batchId: batch._id, dealerName: r.dealerName, month: m,
            amount: amt, prevAmount: prevValOf(o, m), uploadedBy: req.user.id,
          });
          merged[m] = amt;
        }
        if(o){
          await Outstanding.findByIdAndUpdate(o._id, { monthlyOutstanding: merged });
          results.updated++;
        } else {
          const created = await Outstanding.create({ dealerName: r.dealerName, monthlyOutstanding: merged });
          outByNorm.set(key, created.toObject());
          results.created++;
        }
      }catch(e){ results.errors.push(`${r.dealerName}: ${e.message}`); }
    }
    if(historyRows.length) await OutstandingHistory.insertMany(historyRows);

    audit(req, 'outstanding.upload', {
      batchId: batch._id.toString(), fileName: batch.fileName, months,
      totalRecords: rows.length, matched: matched.length, unmapped: unmapped.length, totalAmount,
    });
    console.log(`[OUTSTANDING UPLOAD] batch=${batch._id} months=${months.join(',')} matched=${matched.length} unmapped=${unmapped.length}`);
    res.json({ ...summary, ...results, batchId: batch._id.toString() });
  }catch(e){
    console.error('[OUTSTANDING UPLOAD]', e.message);
    res.status(500).json({error:e.message});
  }
});

// ── Upload history (batches) ───────────────────────────────────────────────
router.get('/batches', protect, adminOnly, async (req,res) => {
  try {
    const list = await OutstandingBatch.find({}).sort({ createdAt:-1 }).limit(200).lean();
    res.json(list);
  }catch(e){ res.status(500).json({error:e.message}); }
});

router.get('/batches/:id', protect, adminOnly, async (req,res) => {
  try {
    const b = await OutstandingBatch.findById(req.params.id).lean();
    if(!b) return res.status(404).json({error:'Batch not found'});
    const rows = await OutstandingHistory.find({ batchId:b._id }).sort({ dealerName:1 }).lean();
    res.json({ ...b, rows });
  }catch(e){ res.status(500).json({error:e.message}); }
});

// Weekly trail for one dealer: every uploaded value per month, newest first.
router.get('/history/:dealerName', protect, async (req,res) => {
  try {
    const name = decodeURIComponent(req.params.dealerName);
    const rows = await OutstandingHistory.find({
      dealerName: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i'),
    }).sort({ createdAt:-1 }).limit(300).lean();
    res.json(rows);
  }catch(e){ res.status(500).json({error:e.message}); }
});

// ── Revert a batch ─────────────────────────────────────────────────────────
// Restores every value this batch wrote back to what it was before (the
// prevAmount captured at upload time; null = the month didn't exist → it is
// removed again). Only the most recent ACTIVE batch touching its months can
// be reverted — reverting under a newer upload would resurrect stale numbers.
// The batch and its history rows are kept and the batch is marked REVERTED.
router.post('/revert/:batchId', protect, superAdminOnly, async (req,res) => {
  try {
    const b = await OutstandingBatch.findById(req.params.batchId);
    if(!b) return res.status(404).json({error:'Batch not found'});
    if(b.status === 'REVERTED') return res.status(400).json({error:'Batch is already reverted'});
    const newer = await OutstandingBatch.findOne({
      _id: { $ne: b._id }, status:'ACTIVE', createdAt: { $gt: b.createdAt },
      months: { $in: b.months },
    }).lean();
    if(newer) return res.status(400).json({
      error:`A newer upload (${new Date(newer.createdAt).toLocaleDateString('en-IN')}) already covers these months — revert that one first.`,
    });

    const rows = await OutstandingHistory.find({ batchId:b._id }).lean();
    let restored = 0;
    for(const r of rows){
      const rx = new RegExp(`^${r.dealerName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
      if(r.prevAmount === null || r.prevAmount === undefined){
        await Outstanding.updateOne({ dealerName:rx }, { $unset:{ [`monthlyOutstanding.${r.month}`]:'' } });
      } else {
        await Outstanding.updateOne({ dealerName:rx }, { $set:{ [`monthlyOutstanding.${r.month}`]: r.prevAmount } });
      }
      restored++;
    }
    b.status = 'REVERTED';
    b.revertedBy = req.user.id;
    b.revertedAt = new Date();
    b.revertReason = String(req.body?.reason||'').slice(0,500);
    await b.save();

    audit(req, 'outstanding.revert', { batchId:b._id.toString(), fileName:b.fileName, restored, reason:b.revertReason });
    console.log(`[OUTSTANDING REVERT] batch=${b._id} rows=${restored} by=${req.user.id}`);
    res.json({ ok:true, restored });
  }catch(e){ console.error('[OUTSTANDING REVERT]', e.message); res.status(500).json({error:e.message}); }
});

// ── Resolve an unmapped party ──────────────────────────────────────────────
// Admin maps a party from a batch's unmapped list onto an existing dealer
// (from the Dealer master). The stored amounts are applied with the normal
// same-month-update rule and a history row is written under the batch.
router.post('/unmapped/resolve', protect, adminOnly, async (req,res) => {
  try {
    const { batchId, party, dealerName } = req.body || {};
    if(!batchId || !party || !dealerName) return res.status(400).json({error:'batchId, party and dealerName required'});
    const b = await OutstandingBatch.findById(batchId);
    if(!b) return res.status(404).json({error:'Batch not found'});
    const entry = (b.unmapped||[]).find(u=>normName(u.party)===normName(party));
    if(!entry) return res.status(404).json({error:`"${party}" is not in this batch's unmapped list`});

    const Dealer = mongoose.models.Dealer || (await import('../models/Dealer.js')).default;
    const dealer = await Dealer.findOne({ name: new RegExp(`^${String(dealerName).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i') }).lean();
    if(!dealer) return res.status(400).json({error:`"${dealerName}" is not in the Dealer master — create the dealer first, then map.`});

    const rx = new RegExp(`^${dealer.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
    const o = await Outstanding.findOne({ dealerName:rx });
    const merged = {};
    if(o?.monthlyOutstanding instanceof Map) o.monthlyOutstanding.forEach((v,k)=>{merged[k]=Number(v)||0;});
    else if(o?.monthlyOutstanding) Object.assign(merged, o.monthlyOutstanding);
    const historyRows = [];
    for(const [m, amt] of Object.entries(entry.amounts||{})){
      historyRows.push({ batchId:b._id, dealerName:dealer.name, month:m, amount:amt,
        prevAmount: Object.prototype.hasOwnProperty.call(merged,m)?merged[m]:null, uploadedBy:req.user.id });
      merged[m] = amt;
    }
    if(o) await Outstanding.findByIdAndUpdate(o._id, { monthlyOutstanding:merged });
    else  await Outstanding.create({ dealerName:dealer.name, monthlyOutstanding:merged });
    if(historyRows.length) await OutstandingHistory.insertMany(historyRows);

    b.unmapped = (b.unmapped||[]).filter(u=>normName(u.party)!==normName(party));
    b.unmappedRecords = b.unmapped.length;
    b.matchedRecords = (b.matchedRecords||0) + 1;
    await b.save();

    audit(req, 'outstanding.map-party', { batchId:b._id.toString(), party, dealer:dealer.name });
    res.json({ ok:true, dealer:dealer.name, monthsApplied:Object.keys(entry.amounts||{}) });
  }catch(e){ res.status(500).json({error:e.message}); }
});

// ── Salesman performance report ────────────────────────────────────────────
// Per salesman: dealer count, latest-month vs previous-month outstanding,
// collections (sum of collected follow-ups), today's + overdue follow-ups.
router.get('/report/salesman', protect, adminOnly, async (req,res) => {
  try {
    const Dealer = mongoose.models.Dealer || (await import('../models/Dealer.js')).default;
    const F = (await import('../models/Outstandingfollowup.js')).default;
    const [dealers, outs, fus] = await Promise.all([
      Dealer.find({}, 'name salesman').lean(),
      Outstanding.find({}).lean(),
      F.find({}).lean(),
    ]);
    const smOfDealer = new Map(dealers.map(d=>[normName(d.name), d.salesman]));
    // Latest two month labels across all outstanding data.
    const monthSet = new Set();
    for(const o of outs) Object.keys(o.monthlyOutstanding||{}).forEach(m=>monthSet.add(m));
    const monthsSorted = [...monthSet].sort((a,b)=>monthSortKey(a)-monthSortKey(b));
    const cur = monthsSorted[monthsSorted.length-1] || '';
    const prev = monthsSorted[monthsSorted.length-2] || '';

    const today = (()=>{ const t=new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; })();
    const bySm = {};
    const row = (sm)=>bySm[sm]=bySm[sm]||{ salesman:sm, dealers:0, current:0, previous:0, collection:0, followupsToday:0, overdue:0, promises:0 };
    for(const o of outs){
      const sm = smOfDealer.get(normName(o.dealerName));
      if(!sm) continue;
      const r = row(sm);
      r.dealers++;
      const mo = o.monthlyOutstanding||{};
      if(cur  && mo[cur]  !== undefined) r.current  += Number(mo[cur])||0;
      if(prev && mo[prev] !== undefined) r.previous += Number(mo[prev])||0;
    }
    for(const f of fus){
      const sm = f.salesman || smOfDealer.get(normName(f.dealerName));
      if(!sm) continue;
      const r = row(sm);
      if(f.status==='done' && f.collectedAmount>0) r.collection += Number(f.collectedAmount)||0;
      if(f.status==='pending'){
        if(f.followupDate === today) r.followupsToday++;
        else if(f.followupDate && f.followupDate < today) r.overdue++;
        if(f.amount>0) r.promises++;
      }
    }
    res.json({ currentMonth:cur, previousMonth:prev, rows:Object.values(bySm) });
  }catch(e){ res.status(500).json({error:e.message}); }
});

// Recent audit trail (admin) — uploads, reverts, mappings, month edits.
router.get('/audit', protect, adminOnly, async (req,res) => {
  try { res.json(await AuditLog.find({ action:/^outstanding\./ }).sort({ createdAt:-1 }).limit(200).lean()); }
  catch(e){ res.status(500).json({error:e.message}); }
});

router.put('/:name', protect, adminOnly, async (req,res) => {
  try {
    const {month,amount}=req.body;
    if(!month) return res.status(400).json({error:'month required'});
    const name=decodeURIComponent(req.params.name);
    const rx=new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
    const rec=await Outstanding.findOneAndUpdate({dealerName:rx},{$set:{[`monthlyOutstanding.${month}`]:Number(amount)||0}},{new:true,upsert:true});
    audit(req, 'outstanding.manual-edit', { dealer:name, month, amount:Number(amount)||0 });
    res.json(toPlain(rec));
  }catch(e){res.status(500).json({error:e.message});}
});

// DELETE /api/outstanding/month/:month — remove an entire month column from
// every dealer's outstanding record (e.g. delete "Apr-26"). Admin/superadmin.
router.delete('/month/:month', protect, adminOnly, async (req,res) => {
  try {
    const month = decodeURIComponent(req.params.month);
    if(!month) return res.status(400).json({error:'month required'});
    const r = await Outstanding.updateMany({}, { $unset: { [`monthlyOutstanding.${month}`]: '' } });
    console.log(`[OUTSTANDING] deleted month ${month} from ${r.modifiedCount} records`);
    res.json({ ok:true, month, modified: r.modifiedCount || 0 });
  } catch(e){ console.error('[OUTSTANDING delete-month]', e.message); res.status(500).json({error:e.message}); }
});

router.delete('/:id', protect, adminOnly, async (req,res) => {
  await Outstanding.findByIdAndDelete(req.params.id);
  res.json({ok:true});
});

export default router;
