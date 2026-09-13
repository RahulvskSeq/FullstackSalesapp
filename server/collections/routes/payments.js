import express from 'express';
import { protect, requireFeature } from '../../middleware/auth.js';
import { ColPayment, ColPaymentAllocation, ColAttachment } from '../models/index.js';
import { recordPayment, confirmPayment, bouncePayment, cancelPayment, listPayments } from '../services/payments.js';
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
    if (req.query.status) f.status = String(req.query.status);
    if (req.query.from || req.query.to) f.date = { ...(req.query.from ? { $gte: String(req.query.from) } : {}), ...(req.query.to ? { $lte: String(req.query.to) } : {}) };
    res.json(await listPayments(f, paging(req.query)));
  } catch (e) { fail(res, e); }
});
router.get('/attachments/:id', async (req, res) => {
  try {
    const a = await ColAttachment.findById(req.params.id).select('+data').lean();
    if (!a) return res.status(404).end();
    if (a.dealerId && !ensureInScope(req, res, a.dealerId)) return;
    res.setHeader('Content-Type', a.mime || 'application/octet-stream'); res.send(a.data);
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
