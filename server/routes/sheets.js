// Sheets routes — online spreadsheets saved in the app.
// Mounted at /api/sheets. Every route requires a logged-in user (protect).
//
// Access model (intentionally simple):
//   • superadmin / admin  → see & edit every sheet
//   • everyone else       → see & edit sheets they own or that are shared with them
import express from 'express';
import Sheet from '../models/Sheet.js';
import User  from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

const isStaff = (req) => ['admin', 'superadmin'].includes(req.user?.role);

// Can the current user open/edit this sheet document?
const canAccess = (req, doc) =>
  isStaff(req) ||
  doc.owner === req.user.id ||
  (Array.isArray(doc.sharedWith) && doc.sharedWith.includes(req.user.id));

// Lightweight shape for the list view — never ship the (potentially large)
// worksheets blob in the list, only in the single-sheet GET.
const listShape = (d) => ({
  id: d._id.toString(),
  name: d.name,
  owner: d.owner,
  ownerName: d.ownerName,
  sharedWith: d.sharedWith || [],
  updatedAt: d.updatedAt,
  createdAt: d.createdAt,
});

// GET /api/sheets — list sheets the user may access (metadata only).
router.get('/', async (req, res) => {
  const query = isStaff(req)
    ? {}
    : { $or: [ { owner: req.user.id }, { sharedWith: req.user.id } ] };
  const docs = await Sheet.find(query, '-worksheets').sort({ updatedAt: -1 }).lean();
  res.json(docs.map(d => listShape({ ...d, _id: d._id })));
});

// GET /api/sheets/:id — full sheet incl. worksheets.
router.get('/:id', async (req, res) => {
  const doc = await Sheet.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Sheet not found' });
  if (!canAccess(req, doc)) return res.status(403).json({ error: 'Not allowed' });
  res.json({ ...listShape(doc), worksheets: doc.worksheets || [] });
});

// POST /api/sheets — create a new (optionally pre-populated) sheet.
router.post('/', async (req, res) => {
  const { name, worksheets } = req.body || {};
  let ownerName = req.user.name || '';
  if (!ownerName) {
    const u = await User.findOne({ id: req.user.id }, 'name').lean().catch(() => null);
    ownerName = u?.name || req.user.id;
  }
  const doc = await Sheet.create({
    // `worksheets` holds the full workbook payload (Univer workbook snapshot —
    // an object; older jspreadsheet sheets stored an array). Kept schemaless.
    name: (name || 'Untitled sheet').slice(0, 120),
    worksheets: (worksheets !== undefined && worksheets !== null) ? worksheets : {},
    owner: req.user.id,
    ownerName,
  });
  res.status(201).json({ ...listShape(doc), worksheets: doc.worksheets || [] });
});

// PUT /api/sheets/:id — save (autosave calls this). Accepts name, worksheets,
// and sharedWith. Only accessible users may write.
router.put('/:id', async (req, res) => {
  const doc = await Sheet.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Sheet not found' });
  if (!canAccess(req, doc)) return res.status(403).json({ error: 'Not allowed' });

  const { name, worksheets, sharedWith } = req.body || {};
  if (typeof name === 'string') doc.name = name.slice(0, 120);
  if (worksheets !== undefined && worksheets !== null) {
    doc.worksheets = worksheets;
    doc.markModified('worksheets');   // Mixed type — force change detection
  }
  // Only the owner or staff may change sharing.
  if (Array.isArray(sharedWith) && (isStaff(req) || doc.owner === req.user.id)) {
    doc.sharedWith = sharedWith;
  }
  await doc.save();
  res.json({ ...listShape(doc), savedAt: new Date() });
});

// DELETE /api/sheets/:id — only owner or staff may delete.
router.delete('/:id', async (req, res) => {
  const doc = await Sheet.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Sheet not found' });
  if (!(isStaff(req) || doc.owner === req.user.id)) {
    return res.status(403).json({ error: 'Only the owner can delete this sheet' });
  }
  await doc.deleteOne();
  res.json({ ok: true });
});

export default router;
