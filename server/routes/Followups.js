import express from 'express';
import mongoose from 'mongoose';
import { protect, adminOnly, superAdminOnly } from '../middleware/auth.js';
// IMPORTANT: import the canonical schema from models/Outstandingfollowup.js
// so new fields like `paymentProof`, `collectedAt`, `collectedAmount` are
// recognised by Mongoose. Declaring the schema inline here used to cause it
// to silently strip unknown fields on update.
import OutstandingFollowup from '../models/Outstandingfollowup.js';

const router = express.Router();

// Staff = admin OR superadmin (both see all follow-ups)
const isStaff = (req) => req.user?.role === 'admin' || req.user?.role === 'superadmin' || req.user?.role === 'employee';

router.get('/', protect, async (req,res) => {
  try {
    if (req.user?.role === 'superadmin') {
      return res.json(await OutstandingFollowup.find({}).sort({createdAt:-1}));
    }
    // Priority-order permission resolution (same pattern as dealers.js).
    const User   = (await import('../models/User.js')).default;
    const Dealer = mongoose.models.Dealer || (await import('../models/Dealer.js')).default;
    const u = await User.findOne({ id: req.user.id }, 'permissions').lean();
    const p = u?.permissions || {};
    const hasStates   = Array.isArray(p.states)   && p.states.length   > 0;
    const hasCities   = Array.isArray(p.cities)   && p.cities.length   > 0;
    const hasZones    = Array.isArray(p.zones)    && p.zones.length    > 0;
    const hasSalesmen = Array.isArray(p.salesmen) && p.salesmen.length > 0;

    let allowedNames = null;
    // A salesman's scope is their own book, full stop — resolved before the
    // permission branches so no territory grant can alter it. See dealers.js.
    if (req.user?.role === 'salesman') {
      const own = await Dealer.find({ salesman: req.user.id }, 'name').lean();
      const names = new Set(own.map(d => (d.name || '').toLowerCase().trim()));
      const mine = (await OutstandingFollowup.find({}).sort({createdAt:-1}).lean())
        .filter(f => names.has((f.dealerName||'').toLowerCase().trim()));
      return res.json(mine);
    }
    if (hasStates || hasCities || hasZones || hasSalesmen) {
      const escape = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const ciMatch = v => new RegExp('^\\s*' + escape(v) + '\\s*$', 'i');
      // Geography OR among itself; salesmen AND-narrows (see dealers.js).
      const filt = {};
      const geo = [];
      if (hasStates) geo.push({ state: { $in: p.states.map(ciMatch) } });
      if (hasCities) geo.push({ city:  { $in: p.cities.map(ciMatch) } });
      if (hasZones)  geo.push({ zone:  { $in: p.zones.map(ciMatch) } });
      if (geo.length) filt.$or = geo;
      if (hasSalesmen) filt.salesman = { $in: p.salesmen };
      const dealers = await Dealer.find(filt, 'name').lean();
      allowedNames = new Set(dealers.map(d => (d.name || '').toLowerCase().trim()));
    } else if (req.user?.role === 'admin' || req.user?.role === 'employee') {
      return res.json(await OutstandingFollowup.find({}).sort({createdAt:-1}));
    } else {
      // Salesman default → own dealers only
      const myDealers = await Dealer.find({ salesman: req.user.id }, 'name').lean();
      allowedNames = new Set(myDealers.map(d => (d.name || '').toLowerCase().trim()));
    }

    const all = await OutstandingFollowup.find({}).sort({createdAt:-1});
    const filtered = all.filter(f =>
      allowedNames.has((f.dealerName || '').toLowerCase().trim())
    );
    res.json(filtered);
  }catch(e){console.error('[FOLLOWUPS]',e.message); res.status(500).json({error:e.message});}
});

router.post('/', protect, async (req,res) => {
  try {
    const { dealerName, salesman, amount, followupDate, comment, type, reason, months } = req.body;
    if(!dealerName||!followupDate) return res.status(400).json({error:'dealerName and followupDate required'});
    // Money is an accounts function. A salesman records the PROMISE (date,
    // comment, amount expected); only staff may record that cash arrived.
    if(type === 'collection' && !isStaff(req)){
      return res.status(403).json({ error:'Only admin / accounts can record a collection. Add a follow-up with the promised amount instead.' });
    }
    const f = await OutstandingFollowup.create({
      dealerName,
      salesman:      salesman || req.user.id,
      amount:        amount || 0,
      followupDate,
      comment:       comment || '',
      reason:        reason  || '',
      months:        Array.isArray(months) ? months.filter(Boolean) : [],
      type:          type || 'followup',
      createdBy:     req.user.id,
      status:        'pending',
    });
    res.json(f);
  }catch(e){res.status(500).json({error:e.message});}
});

router.put('/:id', protect, async (req,res) => {
  try {
    const patch = { ...req.body };
    // Reject oversized payment-proof images (5 MB cap)
    if(patch.paymentProof && patch.paymentProof.length > 5 * 1024 * 1024){
      return res.status(413).json({ error:'Payment proof too large (compress before upload)' });
    }
    // Salesmen may never move money — strip every receipt field from their
    // patch (and the 'done' flip that implies payment) rather than failing,
    // so their comment/date edits still go through.
    if(!isStaff(req)){
      ['collectedAmount','creditedManual','creditedFromUpload','credits','settledAt','collectedAt'].forEach(k=>delete patch[k]);
      if(patch.status === 'done') delete patch.status;
    }
    // Stamp collectedAt when status flips to 'done'
    if(patch.status === 'done'){
      patch.collectedAt = patch.collectedAt || new Date();
    }
    const f=await OutstandingFollowup.findByIdAndUpdate(req.params.id, patch, {new:true});
    res.json(f);
  }catch(e){res.status(500).json({error:e.message});}
});

// ── POST /api/followups/:id/credit — STAFF ONLY ───────────────────────────
// Record money received against one commitment. Fully covering the promise
// settles it (dealer leaves the Commitments tab); a partial payment leaves
// the remaining shortfall open so it stays visible until the rest arrives.
router.post('/:id/credit', protect, async (req,res) => {
  try {
    if(!isStaff(req)) return res.status(403).json({ error:'Only admin / accounts can record a collection.' });
    const amt = Math.round(Number(req.body?.amount) || 0);
    if(amt <= 0) return res.status(400).json({ error:'Enter an amount greater than 0' });
    const f = await OutstandingFollowup.findById(req.params.id);
    if(!f) return res.status(404).json({ error:'Follow-up not found' });

    f.creditedManual = (Number(f.creditedManual)||0) + amt;
    f.credits.push({ amount:amt, source:'manual', by:req.user.id, at:new Date(), note:String(req.body?.note||'').slice(0,300) });
    if(req.body?.paymentProof && String(req.body.paymentProof).length < 5*1024*1024) f.paymentProof = req.body.paymentProof;
    const received = (Number(f.creditedManual)||0) + (Number(f.creditedFromUpload)||0);
    f.collectedAmount = received;                       // keep legacy field in step
    if(received >= (Number(f.amount)||0)){
      f.settledAt = new Date();
      f.status = 'done';
      f.collectedAt = f.collectedAt || new Date();
    }
    await f.save();
    res.json(f);
  }catch(e){ res.status(500).json({error:e.message}); }
});

// ── GET /api/followups/commitments ────────────────────────────────────────
// Every unsettled promise the caller may see, with its state and shortfall.
// ?state=BROKEN|OPEN filters; default returns both.
router.get('/commitments', protect, async (req,res) => {
  try {
    const { receivedOn, shortfallOf, commitmentState, todayStr } = await import('../lib/commitments.js');
    const today = todayStr();
    const all = await OutstandingFollowup.find({ amount:{ $gt:0 }, type:{ $ne:'collection' } }).sort({ followupDate:1 }).lean();

    // Same visibility rules as GET / — reuse by filtering on dealer names.
    let allowed = null;
    if(req.user?.role !== 'superadmin'){
      const User   = (await import('../models/User.js')).default;
      const Dealer = mongoose.models.Dealer || (await import('../models/Dealer.js')).default;
      const u = await User.findOne({ id:req.user.id }, 'permissions').lean();
      const p = u?.permissions || {};
      const has = k => Array.isArray(p[k]) && p[k].length > 0;
      // Salesman = own book, full stop. See dealers.js dealerScope().
      if(req.user?.role === 'salesman'){
        const ds = await Dealer.find({ salesman:req.user.id },'name').lean();
        allowed = new Set(ds.map(d=>(d.name||'').toLowerCase().trim()));
      } else if(has('states')||has('cities')||has('zones')||has('salesmen')){
        const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
        const ci  = v => new RegExp('^\\s*'+esc(v)+'\\s*$','i');
        const filt = {}; const geo = [];
        if(has('states')) geo.push({ state:{ $in:p.states.map(ci) } });
        if(has('cities')) geo.push({ city: { $in:p.cities.map(ci) } });
        if(has('zones'))  geo.push({ zone: { $in:p.zones.map(ci) } });
        if(geo.length) filt.$or = geo;
        if(has('salesmen')) filt.salesman = { $in:p.salesmen };
        const ds = await Dealer.find(filt,'name').lean();
        allowed = new Set(ds.map(d=>(d.name||'').toLowerCase().trim()));
      }
    }

    const rows = all
      .filter(f => !allowed || allowed.has((f.dealerName||'').toLowerCase().trim()))
      .map(f => ({
        ...f,
        received: receivedOn(f),
        shortfall: shortfallOf(f),
        state: commitmentState(f, today),
      }))
      .filter(r => r.state && r.state !== 'SETTLED')
      .filter(r => !req.query.state || r.state === req.query.state);
    res.json(rows);
  }catch(e){ console.error('[COMMITMENTS]', e.message); res.status(500).json({error:e.message}); }
});

router.delete('/:id', protect, async (req,res) => {
  try { await OutstandingFollowup.findByIdAndDelete(req.params.id); res.json({ok:true}); }
  catch(e){res.status(500).json({error:e.message});}
});

// ── DELETE /api/followups (no id) — SUPERADMIN ONLY, DESTRUCTIVE ──────────
// One-time wipe of every follow-up so the user can start fresh under the new
// month-tagged scheme. Outstanding amounts (the `Outstanding` collection)
// are NOT touched. Restricted to superadmin so a regular admin can't
// accidentally (or maliciously) erase every comment in the database.
router.delete('/', protect, superAdminOnly, async (req,res) => {
  try {
    const r = await OutstandingFollowup.deleteMany({});
    console.log(`[FOLLOWUPS WIPE] deleted=${r.deletedCount}`);
    res.json({ ok:true, deletedCount: r.deletedCount });
  } catch(e){ res.status(500).json({error:e.message}); }
});

export default router;
