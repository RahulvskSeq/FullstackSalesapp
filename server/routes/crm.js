// CRM routes — Attendance, Visits, Leads, Leaves.
// Mounted at /api/crm. Photos travel as base64 data URLs so this file is
// otherwise stateless (no multer / no S3) — keeps the deployment simple.

import express from 'express';
import Attendance from '../models/Attendance.js';
import Visit      from '../models/Visit.js';
import Lead       from '../models/Lead.js';
import Leave      from '../models/Leave.js';
import User       from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Helper: admin OR superadmin (same set we use elsewhere)
const isStaff = (req) => req.user?.role === 'admin' || req.user?.role === 'superadmin';
const todayStr = () => new Date().toISOString().slice(0,10);

// Quick safety: reject base64 payloads above ~5MB to keep DB happy.
// Caller should compress on the client before sending.
const PHOTO_MAX = 5 * 1024 * 1024;

// ───────────────────────────── Attendance ─────────────────────────────────

// POST /api/crm/attendance — record a check-in or check-out
// Body: { type:'in'|'out', photo (base64 data url), lat?, lng?, note? }
router.post('/attendance', protect, async (req, res) => {
  try {
    const { type, photo='', lat=null, lng=null, note='', address='', city='', state='' } = req.body;
    if(!['in','out'].includes(type)) return res.status(400).json({ error:"type must be 'in' or 'out'" });
    if(photo && photo.length > PHOTO_MAX) return res.status(413).json({ error:'Photo too large (compress before upload)' });
    const me = await User.findOne({ id: req.user.id }, 'id name').lean();
    const doc = await Attendance.create({
      userId:   req.user.id,
      userName: me?.name || req.user.name || '',
      type, photo, lat, lng, note,
      address, city, state,
      dateStr:  todayStr(),
    });
    res.json(doc);
  } catch(e){ console.error('[CRM/attendance POST]', e.message); res.status(500).json({ error:e.message }); }
});

// GET /api/crm/attendance — list (admin: all, salesman: own)
// Query: ?from=YYYY-MM-DD&to=YYYY-MM-DD&userId=...
router.get('/attendance', protect, async (req, res) => {
  try {
    const q = {};
    if(!isStaff(req)) q.userId = req.user.id;
    else if(req.query.userId) q.userId = req.query.userId;
    if(req.query.from || req.query.to){
      q.dateStr = {};
      if(req.query.from) q.dateStr.$gte = req.query.from;
      if(req.query.to)   q.dateStr.$lte = req.query.to;
    }
    const items = await Attendance.find(q).sort({ createdAt:-1 }).limit(500).lean();
    res.json(items);
  } catch(e){ console.error('[CRM/attendance GET]', e.message); res.status(500).json({ error:e.message }); }
});

// ───────────────────────────────── Visits ─────────────────────────────────

// POST /api/crm/visits — record a visit
router.post('/visits', protect, async (req, res) => {
  try {
    const { dealerId='', dealerName, comment='', photo='', lat=null, lng=null, address='', city='', state='' } = req.body;
    if(!dealerName || !dealerName.trim()) return res.status(400).json({ error:'dealerName required' });
    if(photo && photo.length > PHOTO_MAX) return res.status(413).json({ error:'Photo too large' });
    const me = await User.findOne({ id: req.user.id }, 'id name').lean();
    const doc = await Visit.create({
      userId:   req.user.id,
      userName: me?.name || req.user.name || '',
      dealerId, dealerName: dealerName.trim(),
      comment, photo, lat, lng,
      address, city, state,
      dateStr:  todayStr(),
    });
    res.json(doc);
  } catch(e){ console.error('[CRM/visits POST]', e.message); res.status(500).json({ error:e.message }); }
});

// GET /api/crm/visits — list
// Query: ?dealerName=... | ?userId=... | ?from= ?to=
router.get('/visits', protect, async (req, res) => {
  try {
    const q = {};
    if(!isStaff(req)) q.userId = req.user.id;
    else if(req.query.userId) q.userId = req.query.userId;
    if(req.query.dealerName){
      q.dealerName = new RegExp('^' + String(req.query.dealerName).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '$','i');
    }
    if(req.query.from || req.query.to){
      q.dateStr = {};
      if(req.query.from) q.dateStr.$gte = req.query.from;
      if(req.query.to)   q.dateStr.$lte = req.query.to;
    }
    const items = await Visit.find(q).sort({ createdAt:-1 }).limit(500).lean();
    res.json(items);
  } catch(e){ console.error('[CRM/visits GET]', e.message); res.status(500).json({ error:e.message }); }
});

// DELETE /api/crm/visits/:id — own visits OR staff
router.delete('/visits/:id', protect, async (req, res) => {
  try {
    const v = await Visit.findById(req.params.id);
    if(!v) return res.status(404).json({ error:'Not found' });
    if(!isStaff(req) && v.userId !== req.user.id) return res.status(403).json({ error:'Not allowed' });
    await Visit.findByIdAndDelete(req.params.id);
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// ───────────────────────────────── Leads ──────────────────────────────────

// POST /api/crm/leads — admin creates a lead and (optionally) assigns it
router.post('/leads', protect, adminOnly, async (req, res) => {
  try {
    const b = req.body || {};
    if(!b.name || !b.name.trim()) return res.status(400).json({ error:'name required' });
    let assignedName = '';
    if(b.assignedTo){
      const u = await User.findOne({ id:b.assignedTo }, 'name').lean();
      assignedName = u?.name || '';
    }
    const me = await User.findOne({ id: req.user.id }, 'name').lean();
    const doc = await Lead.create({
      name:    b.name.trim(),
      company: b.company || '',
      phone:   b.phone || '',
      email:   b.email || '',
      city:    b.city || '',
      state:   b.state || '',
      source:  b.source || '',
      status:  b.status || 'NEW',
      assignedTo: b.assignedTo || '',
      assignedName,
      createdBy: req.user.id,
      createdByName: me?.name || '',
      notes:   b.notes || '',
      value:   Number(b.value) || 0,
      updates: [],
    });
    res.json(doc);
  } catch(e){ console.error('[CRM/leads POST]', e.message); res.status(500).json({ error:e.message }); }
});

// GET /api/crm/leads — list (admin: all, salesman: assigned to me)
router.get('/leads', protect, async (req, res) => {
  try {
    const q = {};
    if(!isStaff(req)) q.assignedTo = req.user.id;
    if(req.query.status) q.status = req.query.status;
    if(req.query.assignedTo && isStaff(req)) q.assignedTo = req.query.assignedTo;
    const items = await Lead.find(q).sort({ updatedAt:-1 }).limit(500).lean();
    res.json(items);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// PUT /api/crm/leads/:id — update fields and/or append an update entry
// Salesman: can only update leads assigned to them, only specific fields
// Admin: can update anything including re-assignment
router.put('/leads/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if(!lead) return res.status(404).json({ error:'Not found' });
    const staff = isStaff(req);
    if(!staff && lead.assignedTo !== req.user.id) return res.status(403).json({ error:'Not your lead' });

    const b = req.body || {};
    // Allowed direct fields
    const allowed = staff
      ? ['name','company','phone','email','city','state','source','status','assignedTo','notes','value']
      : ['status'];
    allowed.forEach(k => {
      if(b[k] !== undefined) lead[k] = b[k];
    });
    if(staff && b.assignedTo !== undefined){
      const u = await User.findOne({ id:b.assignedTo }, 'name').lean();
      lead.assignedName = u?.name || '';
    }

    // Append an update entry if a comment / status change was sent
    if(b.update && (b.update.comment || b.update.status)){
      const me = await User.findOne({ id: req.user.id }, 'name').lean();
      lead.updates.push({
        by:      req.user.id,
        byName:  me?.name || req.user.name || '',
        comment: b.update.comment || '',
        status:  b.update.status  || '',
        at:      new Date(),
      });
      if(b.update.status) lead.status = b.update.status;
    }

    await lead.save();
    res.json(lead.toObject());
  } catch(e){ console.error('[CRM/leads PUT]', e.message); res.status(500).json({ error:e.message }); }
});

// DELETE /api/crm/leads/:id — admin only
router.delete('/leads/:id', protect, adminOnly, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// ───────────────────────────────── Leaves ─────────────────────────────────

// POST /api/crm/leaves — apply
router.post('/leaves', protect, async (req, res) => {
  try {
    const { fromDate, toDate, leaveType='CASUAL', reason='' } = req.body || {};
    if(!fromDate || !toDate) return res.status(400).json({ error:'fromDate and toDate required' });
    const me = await User.findOne({ id: req.user.id }, 'name').lean();
    const doc = await Leave.create({
      userId:   req.user.id,
      userName: me?.name || req.user.name || '',
      fromDate, toDate, leaveType, reason,
      status:   'PENDING',
    });
    res.json(doc);
  } catch(e){ console.error('[CRM/leaves POST]', e.message); res.status(500).json({ error:e.message }); }
});

// GET /api/crm/leaves
router.get('/leaves', protect, async (req, res) => {
  try {
    const q = {};
    if(!isStaff(req)) q.userId = req.user.id;
    else if(req.query.userId) q.userId = req.query.userId;
    if(req.query.status) q.status = req.query.status;
    const items = await Leave.find(q).sort({ createdAt:-1 }).limit(500).lean();
    res.json(items);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// PUT /api/crm/leaves/:id — admin approve/reject; user can cancel (PENDING only)
router.put('/leaves/:id', protect, async (req, res) => {
  try {
    const l = await Leave.findById(req.params.id);
    if(!l) return res.status(404).json({ error:'Not found' });
    const staff = isStaff(req);
    const b = req.body || {};

    if(staff){
      // Admin can change status + add comment
      if(b.status) l.status = b.status;
      if(b.reviewComment !== undefined) l.reviewComment = b.reviewComment;
      const me = await User.findOne({ id: req.user.id }, 'name').lean();
      l.reviewedBy     = req.user.id;
      l.reviewedByName = me?.name || '';
      l.reviewedAt     = new Date();
    } else {
      // Owner can cancel their own pending leave
      if(l.userId !== req.user.id) return res.status(403).json({ error:'Not your leave' });
      if(l.status !== 'PENDING') return res.status(400).json({ error:'Cannot edit a reviewed leave' });
      if(b.status === 'CANCELLED') l.status = 'CANCELLED';
      if(b.reason) l.reason = b.reason;
    }
    await l.save();
    res.json(l.toObject());
  } catch(e){ console.error('[CRM/leaves PUT]', e.message); res.status(500).json({ error:e.message }); }
});

export default router;
