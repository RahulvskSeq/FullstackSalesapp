import express from 'express';
import multer from 'multer';
import { protect, requireFeature } from '../../middleware/auth.js';
import { ColImport, ColImportRow, ColJob } from '../models/index.js';
import { stageFile, buildPreview, mapUnmappedRow, createDealerFromRow } from '../engines/importEngine.js';
import { applyImport } from '../engines/reconcile.js';
import { enqueue } from '../jobs/runner.js';
import { APPLY_INLINE_MAX_ROWS } from '../services/imports.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => /\.(xlsx|xls|csv)$/i.test(file.originalname) ? cb(null, true) : cb(new Error('Only .xlsx, .xls or .csv files are accepted')),
});
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const page = q => ({ page: Math.max(1, +q.page || 1), limit: Math.min(200, Math.max(1, +q.limit || 50)) });

// Receive → stage → preview, in one request. Nothing about current state changes.
router.post('/', protect, requireFeature('collections.import'), (req, res, next) => upload.single('file')(req, res, e => e ? res.status(400).json({ error: e.message }) : next()), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const asOn = String(req.body?.asOn || '');
    if (asOn && !YMD.test(asOn)) return res.status(400).json({ error: 'asOn must be YYYY-MM-DD' });
    const balanceMode = String(req.body?.balanceMode || '');
    if (balanceMode && !['buckets', 'snapshot'].includes(balanceMode)) return res.status(400).json({ error: 'balanceMode must be buckets or snapshot' });
    const staged = await stageFile({ buffer: req.file.buffer, fileName: req.file.originalname, size: req.file.size, source: 'excel', user: req.user, asOn, balanceMode });
    if (staged.duplicate) return res.json({ duplicate: true, import: staged.import, duplicateOf: { id: staged.duplicateOf._id, fileName: staged.duplicateOf.fileName, appliedAt: staged.duplicateOf.appliedAt } });
    const preview = await buildPreview(staged.import._id);
    res.json({ duplicate: false, ...preview, detection: staged.detection, ignoredColumns: staged.ignoredColumns, dealersInMaster: staged.dealersInMaster });
  } catch (e) { console.error('[COL IMPORT]', e.message); res.status(400).json({ error: e.message }); }
});

router.get('/', protect, requireFeature('collections.import'), async (req, res) => {
  try {
    const { page: p, limit } = page(req.query);
    const filter = {}; if (req.query.status) filter.status = String(req.query.status);
    const [items, total] = await Promise.all([
      ColImport.find(filter, '-errorReport').sort({ createdAt: -1 }).skip((p - 1) * limit).limit(limit).lean(),
      ColImport.countDocuments(filter)]);
    res.json({ items, total, page: p, limit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id', protect, requireFeature('collections.import'), async (req, res) => {
  try { res.json(await buildPreview(req.params.id)); }
  catch (e) { res.status(404).json({ error: e.message }); }
});

router.get('/:id/rows', protect, requireFeature('collections.import'), async (req, res) => {
  try {
    const { page: p, limit } = page(req.query);
    const filter = { importId: req.params.id }; if (req.query.status) filter.status = String(req.query.status);
    const [items, total] = await Promise.all([
      ColImportRow.find(filter).sort({ rowNo: 1 }).skip((p - 1) * limit).limit(limit).lean(), ColImportRow.countDocuments(filter)]);
    res.json({ items, total, page: p, limit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Confirm. Large files run as a job; the response carries the job id to poll.
router.post('/:id/apply', protect, requireFeature('collections.import'), async (req, res) => {
  try {
    const imp = await ColImport.findById(req.params.id);
    if (!imp) return res.status(404).json({ error: 'Import not found' });
    if (req.body?.asOn) { if (!YMD.test(String(req.body.asOn))) return res.status(400).json({ error: 'asOn must be YYYY-MM-DD' }); imp.asOn = String(req.body.asOn); }
    if (req.body?.balanceMode) { if (!['buckets', 'snapshot'].includes(req.body.balanceMode)) return res.status(400).json({ error: 'bad balanceMode' }); imp.balanceMode = req.body.balanceMode; }
    await imp.save();
    if (imp.status === 'APPLIED') return res.json({ applied: true, import: imp });
    if ((imp.stats?.matched || 0) > APPLY_INLINE_MAX_ROWS) {
      const job = await enqueue('collections.applyImport', { importId: String(imp._id), by: req.user.id, clearAbsent: req.body?.clearAbsent }, { by: req.user.id });
      await ColImport.updateOne({ _id: imp._id }, { $set: { jobId: job._id } });
      return res.status(202).json({ applied: false, jobId: job._id, import: imp });
    }
    const done = await applyImport(imp._id, { by: req.user.id, clearAbsent: typeof req.body?.clearAbsent === 'boolean' ? req.body.clearAbsent : undefined });
    res.json({ applied: true, import: done });
  } catch (e) { console.error('[COL IMPORT APPLY]', e.message); res.status(400).json({ error: e.message }); }
});

router.post('/:id/rows/:rowNo/map', protect, requireFeature('collections.import'), async (req, res) => {
  try {
    const dealerId = String(req.body?.dealerId || '');
    if (!dealerId) return res.status(400).json({ error: 'dealerId is required' });
    res.json(await mapUnmappedRow(req.params.id, +req.params.rowNo, dealerId, { by: req.user.id }));
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post('/:id/rows/:rowNo/create-dealer', protect, requireFeature('collections.import'), async (req, res) => {
  try { res.json(await createDealerFromRow(req.params.id, +req.params.rowNo, { salesman: String(req.body?.salesman || 'none'), by: req.user.id })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

router.get('/jobs/:id', protect, async (req, res) => {
  const job = await ColJob.findById(req.params.id, '-payload').lean();
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

export default router;
