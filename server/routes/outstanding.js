import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { protect, adminOnly, superAdminOnly, requireFeature } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage:multer.memoryStorage(), limits:{ fileSize:10*1024*1024 } });

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
const isStaff = (req) => req.user?.role === 'admin' || req.user?.role === 'superadmin';

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
    const hasZones    = Array.isArray(p.zones)    && p.zones.length    > 0;
    const hasSalesmen = Array.isArray(p.salesmen) && p.salesmen.length > 0;

    let dealerFilter = {};
    if (hasStates || hasZones || hasSalesmen) {
      // Case-insensitive state/zone match — see dealers.js for rationale.
      const escape = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const ciMatch = v => new RegExp('^\\s*' + escape(v) + '\\s*$', 'i');
      if (hasStates)   dealerFilter.state    = { $in: p.states.map(ciMatch) };
      if (hasZones)    dealerFilter.zone     = { $in: p.zones.map(ciMatch) };
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

router.post('/upload', protect, superAdminOnly, upload.single('file'), async (req,res) => {
  // IMPORTANT (data safety contract):
  //   This route ONLY touches the `Outstanding` collection (per-month amounts).
  //   It NEVER touches `OutstandingFollowup` — your comments, "Did not pick"
  //   entries, scheduled follow-up dates, etc. all live in that separate
  //   collection and are completely preserved by this upload.
  //   Additionally: a BLANK/empty cell in the sheet means "no change" for
  //   that month — we only overwrite a month's amount when the sheet has a
  //   non-blank value for it. To set a month to zero, write "0" explicitly.
  try {
    if(!req.file) return res.status(400).json({error:'file required'});
    const wb=XLSX.read(req.file.buffer,{type:'buffer'});
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''});
    if(!rows.length) return res.status(400).json({error:'No data'});
    const headers=Object.keys(rows[0]);
    const nameCol=headers.find(h=>/dealer|name|party/i.test(h))||headers[0];
    const monthCols=headers.filter(h=>h!==nameCol&&String(h).trim());
    const results={added:0,updated:0,skippedBlanks:0,errors:[]};
    for(const row of rows){
      const dealerName=String(row[nameCol]||'').trim();
      if(!dealerName||dealerName.length<2) continue;
      if(/^[\d\s,₹]+$/.test(dealerName)) continue;
      if(['total','totals','dealer name','name'].includes(dealerName.toLowerCase())) continue;

      // Build the per-month patch. Blank cells are SKIPPED (preserved),
      // explicit "0" is allowed (sets the month to zero).
      const mo={};
      monthCols.forEach(m => {
        const monthKey = m.trim();
        if(!monthKey) return;
        const raw = row[m];
        const sv  = (raw === null || raw === undefined) ? '' : String(raw).trim();
        if(sv === ''){ results.skippedBlanks++; return; }     // blank cell — leave existing value alone
        const parsed = Math.round(parseFloat(sv.replace(/[^\d.-]/g,'')) || 0);
        mo[monthKey] = parsed;
      });

      try{
        const rx=new RegExp(`^${dealerName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
        const ex=await Outstanding.findOne({dealerName:rx});
        if(ex){
          // Merge: start with existing months, overlay only the non-blank cells from sheet.
          // This preserves months the sheet doesn't mention AND preserves blanks.
          const merged={};
          if(ex.monthlyOutstanding instanceof Map) ex.monthlyOutstanding.forEach((v,k)=>{merged[k]=Number(v)||0;});
          else if(ex.monthlyOutstanding) Object.assign(merged,ex.monthlyOutstanding);
          Object.assign(merged,mo);
          await Outstanding.findByIdAndUpdate(ex._id,{monthlyOutstanding:merged});
          results.updated++;
        } else {
          // New dealer — only adds months that have values in the sheet
          await Outstanding.create({dealerName,monthlyOutstanding:mo});
          results.added++;
        }
      }catch(e){results.errors.push(`${dealerName}: ${e.message}`);}
    }
    console.log(`[OUTSTANDING UPLOAD] added=${results.added} updated=${results.updated} blanksSkipped=${results.skippedBlanks} errors=${results.errors.length}`);
    res.json(results);
  }catch(e){
    console.error('[OUTSTANDING UPLOAD]', e.message);
    res.status(500).json({error:e.message});
  }
});

router.put('/:name', protect, adminOnly, async (req,res) => {
  try {
    const {month,amount}=req.body;
    if(!month) return res.status(400).json({error:'month required'});
    const name=decodeURIComponent(req.params.name);
    const rx=new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');
    const rec=await Outstanding.findOneAndUpdate({dealerName:rx},{$set:{[`monthlyOutstanding.${month}`]:Number(amount)||0}},{new:true,upsert:true});
    res.json(toPlain(rec));
  }catch(e){res.status(500).json({error:e.message});}
});

router.delete('/:id', protect, adminOnly, async (req,res) => {
  await Outstanding.findByIdAndDelete(req.params.id);
  res.json({ok:true});
});

export default router;
