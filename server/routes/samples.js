import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage:multer.memoryStorage(), limits:{ fileSize:10*1024*1024 } });

// Inline schemas
const sampleSchema = new mongoose.Schema({
  name:{ type:String, required:true }, zone:{ type:String, required:true },
  category:{ type:String, default:'' }, active:{ type:Boolean, default:true },
},{ timestamps:true });

const givenSchema = new mongoose.Schema({
  dealerName:{ type:String, required:true }, dealerId:{ type:String, default:'' },
  sampleId:  { type:String, required:true }, sampleName:{ type:String, required:true },
  zone:      { type:String, default:'' },    salesman:  { type:String, default:'' },
  givenBy:   { type:String, default:'' },    givenDate: { type:String, default:'' },
  notes:     { type:String, default:'' },
},{ timestamps:true });

const Sample      = mongoose.models.Sample      || mongoose.model('Sample', sampleSchema);
const SampleGiven = mongoose.models.SampleGiven || mongoose.model('SampleGiven', givenSchema);

const today = () => new Date().toISOString().slice(0,10);

// GET /api/samples — get all samples (optionally filter by zone)
router.get('/', protect, async (req, res) => {
  try {
    const filter = req.query.zone ? { zone:req.query.zone, active:true } : { active:true };
    const samples = await Sample.find(filter).sort({ zone:1, name:1 });
    res.json(samples);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// GET /api/samples/given — get all given records
router.get('/given', protect, async (req, res) => {
  try {
    const filter = {};
    if(req.user.role !== 'admin') filter.salesman = req.user.id;
    if(req.query.dealerName) filter.dealerName = new RegExp(req.query.dealerName, 'i');
    if(req.query.zone) filter.zone = req.query.zone;
    const given = await SampleGiven.find(filter).sort({ createdAt:-1 });
    res.json(given);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// POST /api/samples/given — mark sample as given
router.post('/given', protect, async (req, res) => {
  try {
    const { dealerName, dealerId, sampleId, sampleName, zone, salesman, givenDate, notes } = req.body;
    if(!dealerName || !sampleId) return res.status(400).json({ error:'dealerName and sampleId required' });
    // Check if already given
    const existing = await SampleGiven.findOne({ dealerName:new RegExp(`^${dealerName}$`,'i'), sampleId });
    if(existing) return res.status(400).json({ error:'Sample already marked as given to this dealer' });
    const record = await SampleGiven.create({
      dealerName, dealerId:dealerId||'', sampleId, sampleName, zone:zone||'',
      salesman:salesman||req.user.id, givenBy:req.user.id,
      givenDate:givenDate||today(), notes:notes||'',
    });
    res.json(record);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// DELETE /api/samples/given/:id — unmark sample
router.delete('/given/:id', protect, async (req, res) => {
  try {
    const rec = await SampleGiven.findById(req.params.id);
    if(!rec) return res.status(404).json({ error:'Not found' });
    if(req.user.role !== 'admin' && rec.givenBy !== req.user.id)
      return res.status(403).json({ error:'Not allowed' });
    await SampleGiven.findByIdAndDelete(req.params.id);
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// POST /api/samples/upload — upload sample master (admin only)
router.post('/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if(!req.file) return res.status(400).json({ error:'file required' });
    const wb   = XLSX.read(req.file.buffer, { type:'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:'' });
    if(!rows.length) return res.status(400).json({ error:'No data' });
    const results = { added:0, updated:0, errors:[] };
    for(const row of rows) {
      const keys = Object.keys(row);
      const find = (...t) => { for(const x of t){ const k=keys.find(k=>k.toLowerCase().replace(/[\s_-]/g,'').includes(x.toLowerCase().replace(/[\s_-]/g,''))); if(k&&String(row[k]).trim()) return String(row[k]).trim(); } return ''; };
      const name     = find('sample','name','product');
      const zone     = find('zone','territory','area');
      const category = find('category','type','cat');
      if(!name || !zone) continue;
      try {
        const ex = await Sample.findOne({ name:new RegExp(`^${name}$`,'i'), zone:new RegExp(`^${zone}$`,'i') });
        if(ex) { await Sample.findByIdAndUpdate(ex._id, { category }); results.updated++; }
        else { await Sample.create({ name, zone, category }); results.added++; }
      } catch(e) { results.errors.push(`${name}: ${e.message}`); }
    }
    res.json(results);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// POST /api/samples — add single sample (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, zone, category } = req.body;
    if(!name || !zone) return res.status(400).json({ error:'name and zone required' });
    // Check duplicate
    const ex = await Sample.findOne({ name:new RegExp(`^${name}$`,'i'), zone:new RegExp(`^${zone}$`,'i') });
    if(ex) return res.status(400).json({ error:'Sample already exists for this zone' });
    const s = await Sample.create({ name:name.trim(), zone:zone.trim(), category:category||'' });
    res.json(s);
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// DELETE /api/samples/:id — delete sample master (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  await Sample.findByIdAndDelete(req.params.id);
  res.json({ ok:true });
});

export default router;