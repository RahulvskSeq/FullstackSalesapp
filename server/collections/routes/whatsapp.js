import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { normName, parseParty } from '../lib/periods.js';
import { normaliseNumber } from '../integrations/whatsapp/botmaster.js';

import { protect, requireFeature } from '../../middleware/auth.js';
import { ColWhatsAppTemplate, ColWhatsAppMessage } from '../models/index.js';
import { queueMessage, handleWebhook, ensureTemplates, render, defaultVariables } from '../services/whatsapp.js';
import * as meta from '../integrations/whatsapp/metaCloud.js';
import * as wa from '../integrations/whatsapp/index.js';
import { withScope, ensureInScope, paging, fail, scopeFilter } from '../lib/http.js';
import { writeAudit } from '../lib/audit.js';

const router = express.Router();

// Webhook: public, verified by token (GET) and by signature over the raw body (POST).
router.get('/webhook', (req, res) => { const c = meta.verifyWebhook(req.query); return c ? res.status(200).send(c) : res.sendStatus(403); });
router.post('/webhook', async (req, res) => {
  try {
    const raw = req.rawBody || Buffer.from(JSON.stringify(req.body || {}));
    if (!meta.verifySignature(raw, req.headers['x-hub-signature-256'])) return res.sendStatus(401);
    res.sendStatus(200);                                   // Meta wants a fast 200; work continues
    await handleWebhook(req.body || {});
  } catch (e) { console.warn('[WA WEBHOOK]', e.message); if (!res.headersSent) res.sendStatus(500); }
});

router.use(protect, withScope);
/**
 * Dealer phone numbers, in bulk: an Excel with Party Name (and/or Code) and
 * Phone. Matched by code, else exact normalised name — never guessed.
 * Without ?commit=1 it only reports what would change.
 */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.post('/phones', requireFeature('collections.settings'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
    const hi = aoa.findIndex(r => r.some(c => /phone|mobile|whatsapp|contact/i.test(String(c))));
    if (hi < 0) return res.status(400).json({ error: 'no Phone / Mobile column found' });
    const H = aoa[hi].map(c => String(c).toLowerCase());
    const cPhone = H.findIndex(h => /phone|mobile|whatsapp|contact/.test(h)), cCode = H.findIndex(h => /code|ssl/.test(h)), cName = H.findIndex(h => /party|dealer|name/.test(h));
    const Dealer = mongoose.models.Dealer;
    const all = await Dealer.find({}, 'name code phone').lean();
    const byCode = new Map(all.filter(d => d.code).map(d => [String(d.code).toUpperCase(), d])), byName = new Map(all.map(d => [normName(d.name), d]));
    const rows = [], writes = [];
    for (const r of aoa.slice(hi + 1)) {
      const raw = String(r[cName] ?? '').trim(); if (!raw && cCode < 0) continue;
      const parsed = parseParty(raw); const code = String(cCode >= 0 ? r[cCode] : parsed.code || '').toUpperCase().replace(/\s+/g, '');
      const phone = normaliseNumber(r[cPhone]);
      const d = (code && byCode.get(code)) || byName.get(normName(parsed.name || raw)) || null;
      let status = !d ? 'UNMATCHED' : !phone || phone.length < 12 ? 'BAD_PHONE' : d.phone === phone ? 'SAME' : d.phone ? 'CHANGED' : 'NEW';
      rows.push({ party: raw, code, phone, dealer: d?.name || '', before: d?.phone || '', status });
      if (d && (status === 'NEW' || status === 'CHANGED')) writes.push({ updateOne: { filter: { _id: d._id }, update: { $set: { phone } } } });
    }
    const summary = rows.reduce((a, x) => { a[x.status] = (a[x.status] || 0) + 1; return a; }, {});
    if (String(req.query.commit) !== '1') return res.json({ preview: true, summary, rows: rows.slice(0, 1000) });
    const w = writes.length ? await Dealer.bulkWrite(writes) : { modifiedCount: 0 };
    await writeAudit({ entity: 'dealer-phones', entityId: req.file.originalname, action: 'bulk-updated', after: { ...summary, updated: w.modifiedCount }, by: req.user.id });
    res.json({ preview: false, summary, updated: w.modifiedCount, rows: rows.slice(0, 1000) });
  } catch (e) { fail(res, e); }
});

/** One dealer's phone and opt-out, from Dealer 360 or the send form. */
router.put('/contact/:dealerId', async (req, res) => {
  try {
    if (!ensureInScope(req, res, req.params.dealerId)) return;
    const Dealer = mongoose.models.Dealer;
    const d = await Dealer.findById(req.params.dealerId, 'name phone whatsappOptOut'); if (!d) return res.status(404).json({ error: 'dealer not found' });
    const before = { phone: d.phone, whatsappOptOut: d.whatsappOptOut };
    if (req.body?.phone !== undefined) { const n = normaliseNumber(req.body.phone); if (n && n.length < 12) return res.status(400).json({ error: 'phone must be a 10-digit mobile (91 is added)' }); d.phone = n; }
    if (req.body?.whatsappOptOut !== undefined) d.whatsappOptOut = !!req.body.whatsappOptOut;
    await d.save();
    await writeAudit({ entity: 'dealer', entityId: d._id, action: 'contact-updated', before, after: { phone: d.phone, whatsappOptOut: d.whatsappOptOut }, by: req.user.id });
    res.json({ dealerId: d._id, phone: d.phone, whatsappOptOut: d.whatsappOptOut });
  } catch (e) { fail(res, e); }
});

router.get('/status', (req, res) => res.json({ configured: wa.isConfigured(), provider: wa.provider(), senderId: wa.provider() === 'botmaster' ? (process.env.BOTMASTER_SENDER_ID || '') : '' }));
router.get('/templates', async (req, res) => { try { await ensureTemplates(); res.json(await ColWhatsAppTemplate.find({}).sort({ key: 1 }).lean()); } catch (e) { fail(res, e); } });
router.put('/templates/:key', requireFeature('collections.settings'), async (req, res) => {
  try {
    const patch = {}; for (const k of ['metaName', 'language', 'body', 'category', 'active']) if (req.body?.[k] !== undefined) patch[k] = req.body[k];
    if (patch.body) patch.variables = [...new Set([...String(patch.body).matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map(m => m[1]))];
    const before = await ColWhatsAppTemplate.findOne({ key: req.params.key }).lean();
    const t = await ColWhatsAppTemplate.findOneAndUpdate({ key: req.params.key }, { $set: { key: req.params.key, ...patch } }, { upsert: true, new: true });
    await writeAudit({ entity: 'whatsapp-template', entityId: req.params.key, action: before ? 'changed' : 'created', before, after: patch, by: req.user.id });
    res.json(t);
  } catch (e) { fail(res, e); }
});
router.get('/preview', async (req, res) => {
  try { if (!ensureInScope(req, res, req.query.dealerId)) return; const t = await ColWhatsAppTemplate.findOne({ key: String(req.query.templateKey) }).lean(); if (!t) return res.status(404).json({ error: 'template not found' });
        const vars = await defaultVariables(req.query.dealerId); res.json({ preview: render(t.body, vars), variables: vars }); } catch (e) { fail(res, e); }
});
router.post('/send', requireFeature('collections.whatsapp'), async (req, res) => {
  try { if (!ensureInScope(req, res, req.body?.dealerId)) return; res.status(202).json(await queueMessage({ ...req.body, by: req.user.id })); } catch (e) { fail(res, e); }
});
router.get('/messages', async (req, res) => {
  try { const f = { ...scopeFilter(req.scope) }; if (req.query.dealerId) { if (!ensureInScope(req, res, req.query.dealerId)) return; f.dealerId = req.query.dealerId; } if (req.query.status) f.status = String(req.query.status);
        const { page, limit } = paging(req.query); const [items, total] = await Promise.all([ColWhatsAppMessage.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), ColWhatsAppMessage.countDocuments(f)]); res.json({ items, total, page, limit }); } catch (e) { fail(res, e); }
});
export default router;
