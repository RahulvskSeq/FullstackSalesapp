import express from 'express';
import { protect, requireFeature } from '../../middleware/auth.js';
import { ColPayment, ColPaymentAllocation, ColAttachment, ColEvent } from '../models/index.js';
import { recordPayment, confirmPayment, bouncePayment, cancelPayment, listPayments, listPendingApprovals, approveDecrease, dismissDecrease } from '../services/payments.js';
import { withScope, ensureInScope, paging, fail, scopeFilter } from '../lib/http.js';

const router = express.Router();
router.use(protect, withScope);

router.post('/', async (req, res) => {
  try {
    if (!ensureInScope(req, res, req.body?.dealerId)) return;
    res.status(201).json(await recordPayment(req.body || {}, { by: req.user.id }));
  } catch (e) { fail(res, e); }
});
router.post('/:id/confirm', requireFeature('collections.payments'), async (req, res) => {
  try { const p = await ColPayment.findById(req.params.id, 'dealerId').lean(); if (!p) return res.status(404).json({ error: 'not found' }); if (!ensureInScope(req, res, p.dealerId)) return;
        res.json(await confirmPayment(req.params.id, { by: req.user.id })); } catch (e) { fail(res, e); }
});
router.post('/:id/bounce', requireFeature('collections.payments'), async (req, res) => {
  try { const p = await ColPayment.findById(req.params.id, 'dealerId').lean(); if (!p) return res.status(404).json({ error: 'not found' }); if (!ensureInScope(req, res, p.dealerId)) return;
        res.json(await bouncePayment(req.params.id, { by: req.user.id, reason: req.body?.reason })); } catch (e) { fail(res, e); }
});
router.post('/:id/cancel', async (req, res) => {
  try { const p = await ColPayment.findById(req.params.id, 'dealerId enteredBy').lean(); if (!p) return res.status(404).json({ error: 'not found' }); if (!ensureInScope(req, res, p.dealerId)) return;
        if (p.enteredBy !== req.user.id && !['admin', 'superadmin', 'employee'].includes(req.user.role)) return res.status(403).json({ error: 'only the person who recorded it, or accounts, can cancel' });
        res.json(await cancelPayment(req.params.id, { by: req.user.id, reason: req.body?.reason })); } catch (e) { fail(res, e); }
});
router.get('/', async (req, res) => {
  try {
    const f = { ...scopeFilter(req.scope) };
    if (req.query.dealerId) { if (!ensureInScope(req, res, req.query.dealerId)) return; f.dealerId = req.query.dealerId; }
    if (req.query.status) f.status = String(req.query.status).includes(',') ? { $in: String(req.query.status).split(',') } : String(req.query.status);
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.recordedOn || ''))) { const d0 = new Date(req.query.recordedOn + 'T00:00:00'); f.createdAt = { $gte: d0, $lt: new Date(d0.getTime() + 86400000) }; f.source = 'manual'; }   // entries a person made that day
    if (req.query.from || req.query.to) f.date = { ...(req.query.from ? { $gte: String(req.query.from) } : {}), ...(req.query.to ? { $lte: String(req.query.to) } : {}) };
    res.json(await listPayments(f, paging(req.query)));
  } catch (e) { fail(res, e); }
});
// Statement decreases awaiting a decision from accounts.
router.get('/pending-approvals', async (req, res) => { try { res.json(await listPendingApprovals(scopeFilter(req.scope), paging(req.query))); } catch (e) { fail(res, e); } });
router.post('/approvals/:id/approve', requireFeature('collections.payments'), async (req, res) => {
  try { const ev = await ColEvent.findById(req.params.id, 'dealerId').lean(); if (!ev) return res.status(404).json({ error: 'not found' }); if (!ensureInScope(req, res, ev.dealerId)) return; res.json(await approveDecrease(req.params.id, { by: req.user.id })); } catch (e) { fail(res, e); }
});
router.post('/approvals/:id/dismiss', requireFeature('collections.payments'), async (req, res) => {
  try { const ev = await ColEvent.findById(req.params.id, 'dealerId').lean(); if (!ev) return res.status(404).json({ error: 'not found' }); if (!ensureInScope(req, res, ev.dealerId)) return; res.json(await dismissDecrease(req.params.id, { by: req.user.id, reason: req.body?.reason })); } catch (e) { fail(res, e); }
});
router.get('/attachments/:id', async (req, res) => {
  try {
    const a = await ColAttachment.findById(req.params.id).select('+data').lean();
    if (!a) return res.status(404).end();
    if (a.dealerId && !ensureInScope(req, res, a.dealerId)) return;
    // stored on Cloudinary → hand the browser the file's own URL
    if (a.url) return res.redirect(302, a.url);
    if (!a.data) return res.status(404).json({ error: 'file has no content' });
    // lean() hands back a driver Binary, not a Buffer — sending that raw
    // serialised it as base64 JSON and the image never rendered
    const buf = Buffer.isBuffer(a.data) ? a.data : Buffer.from(a.data.buffer || a.data);
    res.setHeader('Content-Type', a.mime || 'application/octet-stream'); res.setHeader('Content-Length', buf.length); res.end(buf);
  } catch (e) { fail(res, e); }
});
router.get('/:id', async (req, res) => {
  try {
    const p = await ColPayment.findById(req.params.id).lean();
    if (!p) return res.status(404).json({ error: 'not found' }); if (!ensureInScope(req, res, p.dealerId)) return;
    res.json({ ...p, allocations: await ColPaymentAllocation.find({ paymentId: p._id }).lean() });
  } catch (e) { fail(res, e); }
});
export default router;
