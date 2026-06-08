// CRM routes — Attendance, Visits, Leads, Leaves.
// Mounted at /api/crm. Photos travel as base64 data URLs so this file is
// otherwise stateless (no multer / no S3) — keeps the deployment simple.

import express from 'express';
import multer  from 'multer';
import XLSX    from 'xlsx';
import Attendance from '../models/Attendance.js';
import Visit      from '../models/Visit.js';
import Lead       from '../models/Lead.js';
import Leave      from '../models/Leave.js';
import Task       from '../models/Task.js';
import Ticket     from '../models/Ticket.js';
import Counter    from '../models/Counter.js';
import User       from '../models/User.js';
import { protect, adminOnly } from '../middleware/auth.js';

// CSV / Excel bulk-upload — re-use the same memory storage pattern as the
// dealers upload route. 10MB cap.
const upload = multer({ storage: multer.memoryStorage(), limits:{ fileSize:10*1024*1024 } });

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

// POST /api/crm/visits — CHECK IN to a party. Creates an in-progress visit.
// The salesman can only have ONE in-progress visit at a time per dealer — but
// they can have visits to DIFFERENT parties open. We don't enforce that
// limitation server-side; the client guides the flow.
router.post('/visits', protect, async (req, res) => {
  try {
    const {
      dealerId='', dealerName,
      photo='', note='',
      lat=null, lng=null, address='', city='', state='',
    } = req.body;
    if(!dealerName || !dealerName.trim()) return res.status(400).json({ error:'dealerName required' });
    if(photo && photo.length > PHOTO_MAX) return res.status(413).json({ error:'Photo too large' });

    // Guard: a salesman can only have ONE in-progress visit at a time. They
    // must check out of the current one before starting a new visit. Admins
    // are also bound by this for their own personal check-ins.
    const open = await Visit.findOne({ userId: req.user.id, status: 'in-progress' }).lean();
    if(open){
      return res.status(409).json({
        error: 'You are already checked in at "' + open.dealerName + '". Please check out before starting a new visit.',
        activeVisitId: open._id,
        activeDealer:  open.dealerName,
      });
    }
    const me = await User.findOne({ id: req.user.id }, 'id name').lean();
    const doc = await Visit.create({
      userId:   req.user.id,
      userName: me?.name || req.user.name || '',
      dealerId, dealerName: dealerName.trim(),
      status:   'in-progress',
      checkInTime:    new Date(),
      checkInPhoto:   photo,
      checkInNote:    note,
      checkInLat:     lat,
      checkInLng:     lng,
      checkInAddress: address,
      checkInCity:    city,
      checkInState:   state,
      // Mirror onto legacy fields too so existing list/dealer-history queries
      // still find the visit until everything is migrated.
      photo, lat, lng, address, city, state,
      comment:  note,
      dateStr:  todayStr(),
    });
    res.json(doc);
  } catch(e){ console.error('[CRM/visits POST]', e.message); res.status(500).json({ error:e.message }); }
});

// POST /api/crm/visits/:id/checkout — CHECK OUT of an in-progress visit.
// Discussion notes are REQUIRED here.
router.post('/visits/:id/checkout', protect, async (req, res) => {
  try {
    const v = await Visit.findById(req.params.id);
    if(!v) return res.status(404).json({ error:'Visit not found' });
    if(!isStaff(req) && v.userId !== req.user.id) return res.status(403).json({ error:'Not your visit' });
    if(v.status === 'completed') return res.status(400).json({ error:'Already checked out' });

    const {
      photo='', note='',
      lat=null, lng=null, address='', city='', state='',
    } = req.body || {};
    if(!note || !note.trim()) return res.status(400).json({ error:'Discussion notes are required at check-out' });
    if(photo && photo.length > PHOTO_MAX) return res.status(413).json({ error:'Photo too large' });

    const now = new Date();
    v.status           = 'completed';
    v.checkOutTime     = now;
    v.checkOutPhoto    = photo;
    v.checkOutNote     = note.trim();
    v.checkOutLat      = lat;
    v.checkOutLng      = lng;
    v.checkOutAddress  = address;
    v.checkOutCity     = city;
    v.checkOutState    = state;

    // Duration in minutes
    const start = v.checkInTime ? new Date(v.checkInTime).getTime() : now.getTime();
    v.durationMinutes = Math.max(0, Math.round((now.getTime() - start) / 60000));

    // Update legacy combined fields so list-views still show the meeting outcome
    v.comment = note.trim();

    await v.save();
    res.json(v.toObject());
  } catch(e){ console.error('[CRM/visits checkout]', e.message); res.status(500).json({ error:e.message }); }
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

// DELETE /api/crm/visits/:id — STAFF (admin/superadmin) ONLY. Salesmen
// cannot delete their own history — keeps a tamper-resistant audit trail.
router.delete('/visits/:id', protect, adminOnly, async (req, res) => {
  try {
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

// POST /api/crm/leads/upload — admin bulk upload (CSV / XLSX)
// Recognised columns (case + space + _-/ insensitive):
//   name (required) · company · phone · email · city · state · source ·
//   status · assignedTo · notes · value
// `assignedTo` may be a salesman's USER ID ("pranav") OR their full name
// ("Pranav") — case + whitespace insensitive. Unknown names are kept but
// the lead is created unassigned.
router.post('/leads/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if(!req.file) return res.status(400).json({ error:'No file uploaded' });
    const wb   = XLSX.read(req.file.buffer, { type:'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:'' });
    if(!rows.length) return res.status(400).json({ error:'No rows in file' });

    // Build a {normalized-name-or-id → user.id, user.name} map for assignment routing
    const salesmen = await User.find({ role:'salesman' }, 'id name').lean();
    const smIndex = new Map();
    for(const u of salesmen){
      const ns = (u.name||'').toLowerCase().replace(/\s+/g,' ').trim();
      if(ns) smIndex.set(ns, u);
      smIndex.set((u.id||'').toLowerCase(), u);
    }

    const me = await User.findOne({ id: req.user.id }, 'name').lean();
    const results = { added:0, skipped:0, errors:[] };

    for(const row of rows){
      const keys = Object.keys(row);
      const find = (...needles) => {
        for(const n of needles){
          const norm = n.toLowerCase().replace(/[\s_\-/]/g,'');
          const k = keys.find(k => k.toLowerCase().replace(/[\s_\-/]/g,'') === norm);
          if(k != null){
            const v = row[k];
            if(v === 0) return '0';
            return v == null ? '' : String(v).trim();
          }
        }
        return '';
      };

      const name = find('name','leadname','contact','contactname');
      if(!name || name.length < 2){ results.skipped++; continue; }

      // Resolve assignee
      const rawAssign = find('assignedto','assignee','salesman','salesperson');
      let assignedTo = '';
      let assignedName = '';
      if(rawAssign){
        const norm = rawAssign.toLowerCase().replace(/\s+/g,' ').trim();
        const found = smIndex.get(norm) || smIndex.get(norm.replace(/\s+/g,''));
        if(found){ assignedTo = found.id; assignedName = found.name; }
        else { results.errors.push(name + ': unknown salesman "' + rawAssign + '" (lead created unassigned)'); }
      }

      const status = (find('status') || 'NEW').toUpperCase();
      const valueRaw = find('value','amount','estimatedvalue','dealvalue');
      const value = Number(String(valueRaw).replace(/[^\d.-]/g,'')) || 0;

      try {
        await Lead.create({
          name,
          company: find('company','firm','organization'),
          phone:   find('phone','mobile','contactno','number'),
          email:   find('email','mail'),
          city:    find('city'),
          state:   find('state'),
          source:  find('source','referral','channel'),
          status,
          assignedTo,
          assignedName,
          createdBy:     req.user.id,
          createdByName: me?.name || '',
          notes:   find('notes','remark','remarks','comment','comments'),
          value,
          updates: [],
        });
        results.added++;
      } catch(e){
        results.errors.push(name + ': ' + e.message);
      }
    }

    console.log(`[CRM/leads UPLOAD] uploaded=${results.added} skipped=${results.skipped} errors=${results.errors.length} total=${rows.length}`);
    res.json({ ...results, total: rows.length });
  } catch(e){
    console.error('[CRM/leads UPLOAD]', e.message);
    res.status(500).json({ error: e.message });
  }
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


// ───────────────────────────────── Tasks ──────────────────────────────────

// POST /api/crm/tasks — ANY authenticated user can create a task.
// Salesmen can assign tasks to other salesmen (or themselves). Admins can
// assign to anyone. Server enforces: a non-staff creator cannot assign to a
// user with role > salesman (no escalation by abusing the task system).
router.post('/tasks', protect, async (req, res) => {
  try {
    const b = req.body || {};
    if(!b.title || !b.title.trim()) return res.status(400).json({ error:'title required' });
    let assignedName = '';
    if(b.assignedTo){
      const u = await User.findOne({ id:b.assignedTo }, 'name role').lean();
      if(!u) return res.status(400).json({ error:'Unknown assignee' });
      // Non-staff can only assign to salesmen (incl. themselves)
      if(!isStaff(req) && u.role !== 'salesman'){
        return res.status(403).json({ error:'Salesmen can only assign tasks to other salesmen' });
      }
      assignedName = u.name || '';
    }
    const me = await User.findOne({ id: req.user.id }, 'name').lean();
    const doc = await Task.create({
      title:       b.title.trim(),
      description: b.description || '',
      status:      b.status   || 'NEW',
      priority:    b.priority || 'MEDIUM',
      dueDate:     b.dueDate  || '',
      assignedTo:  b.assignedTo || '',
      assignedName,
      createdBy:     req.user.id,
      createdByName: me?.name || '',
      refType:     b.refType || '',
      refId:       b.refId   || '',
      refName:     b.refName || '',
      updates:     [],
    });
    res.json(doc);
  } catch(e){ console.error('[CRM/tasks POST]', e.message); res.status(500).json({ error:e.message }); }
});

// GET /api/crm/tasks — admin: all. Others: tasks assigned to OR created by me.
// Query params:
//   ?status=...                     filter by status
//   ?assignedTo=<userId>            (admin only) filter by assignee
//   ?scope=mine|to-me|by-me|all     non-staff filter — default 'mine' = either
router.get('/tasks', protect, async (req, res) => {
  try {
    const q = {};
    if(req.query.status) q.status = req.query.status;
    if(isStaff(req)){
      if(req.query.assignedTo) q.assignedTo = req.query.assignedTo;
    } else {
      const scope = req.query.scope || 'mine';
      if(scope === 'to-me')      q.assignedTo = req.user.id;
      else if(scope === 'by-me') q.createdBy  = req.user.id;
      else {
        // 'mine' (default) = any task that touches me as creator OR assignee
        q.$or = [{ assignedTo: req.user.id }, { createdBy: req.user.id }];
      }
    }
    const items = await Task.find(q).sort({ updatedAt:-1 }).limit(500).lean();
    res.json(items);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// PUT /api/crm/tasks/:id — permissions:
//   staff:    full edit + reassign + comment
//   assignee: status + comment (no reassign / no title edit)
//   creator:  status + comment + reassign (to another salesman) + delete-eligible
router.put('/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if(!task) return res.status(404).json({ error:'Not found' });
    const staff = isStaff(req);
    const isAssignee = task.assignedTo === req.user.id;
    const isCreator  = task.createdBy  === req.user.id;
    if(!staff && !isAssignee && !isCreator){
      return res.status(403).json({ error:'Not your task' });
    }

    const b = req.body || {};
    let allowed;
    if(staff)            allowed = ['title','description','status','priority','dueDate','assignedTo','refType','refId','refName'];
    else if(isCreator)   allowed = ['title','description','status','priority','dueDate','assignedTo'];
    else /* assignee */  allowed = ['status'];

    // Non-staff cannot reassign to an admin / superadmin
    if(!staff && b.assignedTo !== undefined && b.assignedTo){
      const u = await User.findOne({ id:b.assignedTo }, 'role name').lean();
      if(!u) return res.status(400).json({ error:'Unknown assignee' });
      if(u.role !== 'salesman') return res.status(403).json({ error:'Salesmen can only assign tasks to other salesmen' });
      task.assignedName = u.name || '';
    }
    allowed.forEach(k => { if(b[k] !== undefined) task[k] = b[k]; });
    if(staff && b.assignedTo !== undefined){
      const u = await User.findOne({ id:b.assignedTo }, 'name').lean();
      task.assignedName = u?.name || '';
    }
    if(b.update && (b.update.comment || b.update.status)){
      const me = await User.findOne({ id: req.user.id }, 'name').lean();
      task.updates.push({
        by:      req.user.id,
        byName:  me?.name || req.user.name || '',
        comment: b.update.comment || '',
        status:  b.update.status  || '',
        at:      new Date(),
      });
      if(b.update.status) task.status = b.update.status;
    }
    await task.save();
    res.json(task.toObject());
  } catch(e){ console.error('[CRM/tasks PUT]', e.message); res.status(500).json({ error:e.message }); }
});

// DELETE /api/crm/tasks/:id — admin OR the original creator
router.delete('/tasks/:id', protect, async (req, res) => {
  try {
    const t = await Task.findById(req.params.id);
    if(!t) return res.status(404).json({ error:'Not found' });
    if(!isStaff(req) && t.createdBy !== req.user.id){
      return res.status(403).json({ error:'Only the creator or an admin can delete this task' });
    }
    await Task.findByIdAndDelete(req.params.id);
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// ───────────────────────────────── Tickets ────────────────────────────────

// POST /api/crm/tickets — any authenticated user can raise a ticket
router.post('/tickets', protect, async (req, res) => {
  try {
    const b = req.body || {};
    if(!b.title || !b.title.trim()) return res.status(400).json({ error:'title required' });
    if(b.screenshot && b.screenshot.length > PHOTO_MAX) return res.status(413).json({ error:'Screenshot too large' });
    const num = await Counter.next('ticket', 4);
    const ticketNo = 'STP-' + String(num).padStart(4, '0');
    const me = await User.findOne({ id: req.user.id }, 'name').lean();
    const doc = await Ticket.create({
      ticketNo,
      title:       b.title.trim(),
      description: b.description || '',
      screenshot:  b.screenshot  || '',
      category:    b.category    || 'Bug',
      status:      'OPEN',
      priority:    b.priority    || 'MEDIUM',
      createdBy:     req.user.id,
      createdByName: me?.name || req.user.name || '',
      updates:     [],
    });
    res.json(doc);
  } catch(e){ console.error('[CRM/tickets POST]', e.message); res.status(500).json({ error:e.message }); }
});

// GET /api/crm/tickets — admin: all, others: only their own
router.get('/tickets', protect, async (req, res) => {
  try {
    const q = {};
    if(!isStaff(req)) q.createdBy = req.user.id;
    if(req.query.status) q.status = req.query.status;
    if(isStaff(req) && req.query.createdBy) q.createdBy = req.query.createdBy;
    const items = await Ticket.find(q).sort({ createdAt:-1 }).limit(500).lean();
    res.json(items);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// PUT /api/crm/tickets/:id — staff: full edit, raiser: comment + screenshot only
router.put('/tickets/:id', protect, async (req, res) => {
  try {
    const t = await Ticket.findById(req.params.id);
    if(!t) return res.status(404).json({ error:'Not found' });
    const staff = isStaff(req);
    if(!staff && t.createdBy !== req.user.id) return res.status(403).json({ error:'Not your ticket' });

    const b = req.body || {};
    if(staff){
      ['title','description','category','status','priority','assignedTo'].forEach(k => {
        if(b[k] !== undefined) t[k] = b[k];
      });
      if(b.assignedTo !== undefined){
        const u = await User.findOne({ id:b.assignedTo }, 'name').lean();
        t.assignedName = u?.name || '';
      }
    }
    if(b.update && (b.update.comment || b.update.status || b.update.screenshot)){
      if(b.update.screenshot && b.update.screenshot.length > PHOTO_MAX){
        return res.status(413).json({ error:'Screenshot too large' });
      }
      const me = await User.findOne({ id: req.user.id }, 'name').lean();
      t.updates.push({
        by:        req.user.id,
        byName:    me?.name || req.user.name || '',
        comment:   b.update.comment || '',
        status:    b.update.status  || '',
        screenshot:b.update.screenshot || '',
        at:        new Date(),
      });
      if(staff && b.update.status) t.status = b.update.status;
    }
    await t.save();
    res.json(t.toObject());
  } catch(e){ console.error('[CRM/tickets PUT]', e.message); res.status(500).json({ error:e.message }); }
});

// DELETE /api/crm/tickets/:id — admin only
router.delete('/tickets/:id', protect, adminOnly, async (req, res) => {
  try { await Ticket.findByIdAndDelete(req.params.id); res.json({ ok:true }); }
  catch(e){ res.status(500).json({ error:e.message }); }
});

export default router;
