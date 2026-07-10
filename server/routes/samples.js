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

// Staff = admin OR superadmin (both see all sample records)
const isStaff = (req) => req.user?.role === 'admin' || req.user?.role === 'superadmin' || req.user?.role === 'employee';

// GET /api/samples/given — get all given records
router.get('/given', protect, async (req, res) => {
  try {
    const filter = {};
    if(!isStaff(req)) filter.salesman = req.user.id;
    if (req.query.dealerName) {
      // Exact, case-insensitive, whitespace-tolerant match. Escape regex
      // metacharacters so dealer names like 'A.R.TRADERS' don't turn
      // dots into wildcards.
      const esc = String(req.query.dealerName)
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.dealerName = new RegExp('^\\s*' + esc + '\\s*$', 'i');
    }
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
    if(!isStaff(req) && rec.givenBy !== req.user.id)
      return res.status(403).json({ error:'Not allowed' });
    await SampleGiven.findByIdAndDelete(req.params.id);
    res.json({ ok:true });
  } catch(e){ res.status(500).json({ error:e.message }); }
});

// POST /api/samples/given/upload — bulk-upload "which dealer has which
// sample" from an Excel. Two formats auto-detected:
//   WIDE — first column = Dealer Name, remaining column headers = sample
//          names. Any non-empty cell means "dealer has that sample".
//   LONG — two columns: Dealer Name | Sample Name (one row per pair).
// Auto-adds missing samples to the master (zone = "General"). Idempotent —
// re-uploading doesn't duplicate rows.
// POST /api/samples/cleanup-master — one-shot cleanup:
//   1. Merges duplicate Sample records that were split when the parser
//      mistakenly treated code ranges (e.g. "OM 21 - 40") as zones.
//   2. For each merged Sample, moves its SampleGiven records to point at
//      the canonical Sample and updates each record's zone to whatever
//      it was on the source row (SampleGiven.zone is the source of truth
//      for how the sample applies to that dealer).
router.post('/cleanup-master', protect, adminOnly, async (req, res) => {
  try {
    // --- Phase 1: nuke any Sample master row whose name matches a real
    // dealer name. Legacy bug: an earlier upload path wrongly treated the
    // "Company Name" column as a sample column and inserted dealer names
    // into the Sample master. Also drop their orphan SampleGiven rows.
    const Dealer = (await import('../models/Dealer.js')).default;
    const dealers = await Dealer.find({}, 'name').lean();
    const dealerNames = new Set(
      dealers.map(d => String(d.name || '').trim().toLowerCase()).filter(Boolean)
    );
    let deletedDealerRows = 0, deletedOrphanGivens = 0;
    if (dealerNames.size) {
      const bogus = await Sample.find({}).lean();
      const bogusIds = bogus
        .filter(s => dealerNames.has(String(s.name || '').trim().toLowerCase()))
        .map(s => String(s._id));
      if (bogusIds.length) {
        const gRes = await SampleGiven.deleteMany({ sampleId: { $in: bogusIds } });
        deletedOrphanGivens = gRes.deletedCount || 0;
        const sRes = await Sample.deleteMany({ _id: { $in: bogusIds } });
        deletedDealerRows = sRes.deletedCount || 0;
      }
    }

    // --- Phase 2: merge remaining duplicates by name.
    const all = await Sample.find({}).lean();
    const groups = new Map();
    for (const s of all) {
      const k = String(s.name || '').trim().toLowerCase();
      if (!k) continue;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(s);
    }
    let merged = 0, kept = 0, updatedGivens = 0;
    for (const [, list] of groups) {
      if (list.length === 1) { kept++; continue; }
      list.sort((a, b) => String(a._id).localeCompare(String(b._id)));
      const canon = list[0];
      const canonId = String(canon._id);
      if (canon.zone !== 'General') {
        await Sample.findByIdAndUpdate(canonId, { zone: 'General' });
      }
      for (let i = 1; i < list.length; i++) {
        const dupId = String(list[i]._id);
        const r = await SampleGiven.updateMany(
          { sampleId: dupId },
          { $set: { sampleId: canonId, sampleName: canon.name } }
        );
        updatedGivens += r.modifiedCount || 0;
        await Sample.findByIdAndDelete(dupId);
        merged++;
      }
    }
    console.log(
      `[SAMPLES CLEANUP] deletedDealerRows=${deletedDealerRows} deletedOrphanGivens=${deletedOrphanGivens} ` +
      `merged=${merged} kept=${kept} givensRepointed=${updatedGivens}`
    );
    res.json({ merged, kept, updatedGivens, deletedDealerRows, deletedOrphanGivens });
  } catch (e) {
    console.error('[samples/cleanup-master]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/samples/template — the ONE template the user wants: three
// columns in exactly the same format as the source file
// (Company Name | Product | Zone). Pre-filled with every SampleGiven
// record so admins see the current state and can extend it. Editing +
// re-uploading via /given/upload is a clean round-trip.
router.get('/template', protect, adminOnly, async (req, res) => {
  try {
    const given = await SampleGiven.find({}).sort({ dealerName: 1, sampleName: 1 }).lean();
    const aoa = [['Company Name', 'Product', 'Zone']];
    for (const g of given) {
      aoa.push([g.dealerName || '', g.sampleName || '', g.zone || '']);
    }
    // A generous number of blank rows for adding new pairings.
    for (let i = 0; i < 50; i++) aoa.push(['', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 42 }, { wch: 40 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample by Party by Zone');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Sample_by_Party_by_Zone.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error('[samples/template]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/samples/given/template — download an Excel pre-populated with:
//   • Column A: Dealer Name  (all existing dealers from the roster)
//   • Column B onwards: every sample in the master, header format
//     "Sample Name (Zone)" so zone context stays visible.
// Existing (dealer, sample) pairs from SampleGiven get pre-filled with "Y"
// so admin can see current state at a glance. Empty cells stay empty; put a
// Y in the empty ones to mark newly-given samples, then upload.
router.get('/given/template', protect, adminOnly, async (req, res) => {
  try {
    const Dealer = (await import('../models/Dealer.js')).default;
    const [dealers, samples, given] = await Promise.all([
      Dealer.find({}, 'name zone').sort({ name: 1 }).lean(),
      Sample.find({ active: true }).sort({ zone: 1, name: 1 }).lean(),
      SampleGiven.find({}, 'dealerName sampleId').lean(),
    ]);

    // Lookup: which (dealerName lower, sampleId) pairs exist.
    const givenSet = new Set(
      given.map(g => `${String(g.dealerName || '').toLowerCase().trim()}||${String(g.sampleId)}`)
    );

    // Header row: dealer + sample columns
    const headers = ['Dealer Name'];
    for (const s of samples) {
      const label = s.zone && s.zone !== 'General' ? `${s.name} (${s.zone})` : s.name;
      headers.push(label);
    }
    const aoa = [headers];

    for (const d of dealers) {
      const row = [d.name || ''];
      for (const s of samples) {
        const key = `${String(d.name || '').toLowerCase().trim()}||${String(s._id)}`;
        row.push(givenSet.has(key) ? 'Y' : '');
      }
      aoa.push(row);
    }
    // Add a couple of blank rows so admins can add new dealers to the sheet.
    for (let i = 0; i < 3; i++) aoa.push([...Array(headers.length).fill('')]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 36 },                                                // Dealer Name
      ...samples.map(() => ({ wch: 18 })),                        // sample columns
    ];
    // Freeze the header row + first column so scrolling is bearable.
    ws['!freeze'] = { xSplit: 1, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dealer Samples');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Dealer_Samples_Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error('[samples/given/template]', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/given/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const wb   = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const aoa  = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
    if (!aoa.length) return res.status(400).json({ error: 'No data' });

    // First row is headers. Column 0 = dealer name column.
    const header = (aoa[0] || []).map(h => String(h || '').trim());
    if (header.length < 2) return res.status(400).json({ error: 'Need at least 2 columns' });

    // Detect long format: first col looks like Dealer/Company, second col
    // looks like Sample/Product. Allows a THIRD optional Zone column so
    // real-world sheets like "Sample by Party By Zoning" (Company Name |
    // Product | Zone) are picked up too. Anything with 4+ columns is
    // treated as wide-matrix.
    const isLong = header.length >= 2 && header.length <= 3
      && /dealer|party|company|name/i.test(header[0])
      && /sample|product|item|folder/i.test(header[1]);
    const zoneIdx = isLong && header.length >= 3 && /zone|region|territory/i.test(header[2]) ? 2 : -1;

    // Pull sample-column headers (for wide format) — skip empty.
    const sampleCols = isLong ? [] : header.slice(1).filter(c => c && c.length > 0);

    // Extract sample name + zone from a column header used in the WIDE
    // format ONLY. Template headers look like "Shorts Kit (ZONE 3)" —
    // the parenthesis carries the zone.
    // We check for the literal word "ZONE" (case-insensitive) inside the
    // parens so real sample codes like "FOLDER OMBRE (OM 21 - 40)" are
    // NOT mistaken for zones.
    const parseSampleHeader = (raw) => {
      const s = String(raw || '').trim();
      const m = s.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (m && /zone|general|all\s*zones/i.test(m[2])) {
        return { name: m[1].trim(), zone: m[2].trim() };
      }
      return { name: s, zone: '' };
    };
    // For LONG format we pass the zone explicitly from column C so the
    // sample name never gets parsed.
    const ensureSample = async (rawName, explicitZone) => {
      const isLongCall = explicitZone !== undefined;
      const parsed = isLongCall
        ? { name: String(rawName || '').trim(), zone: String(explicitZone || '').trim() }
        : parseSampleHeader(rawName);
      const { name, zone } = parsed;
      if (!name) return null;
      const esc = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameFilter = new RegExp(`^${esc(name)}$`, 'i');
      // LONG format: one sample name → ONE master record. The per-dealer
      // zone tag lives on SampleGiven so different dealers can have the
      // same sample with different zone tags.
      // WIDE format: name + zone identifies uniqueness (matches the template
      // format 'Sample (ZONE 3)' which allows one name across many zones).
      const query = (isLongCall || !zone)
        ? { name: nameFilter }
        : { name: nameFilter, zone: new RegExp(`^${esc(zone)}$`, 'i') };
      const s = await Sample.findOne(query);
      if (s) return s;
      return Sample.create({ name, zone: zone || 'General', category: '' });
    };

    // Build the target (dealer, sample, zoneTag) pairs.
    // zoneTag preserves the user's real-world zone metadata verbatim (e.g.
    // "All Zones", "ZONE 2 & 5", "NEW DEALERS ONLY") — stored on the
    // SampleGiven record so it can be shown next to the sample in the
    // dealer view.
    const pairs = [];
    if (isLong) {
      for (let i = 1; i < aoa.length; i++) {
        const row = aoa[i] || [];
        const dealer  = String(row[0] || '').trim();
        const sample  = String(row[1] || '').trim();
        const zoneTag = zoneIdx >= 0 ? String(row[zoneIdx] || '').trim() : '';
        if (dealer && sample) pairs.push({ dealer, sample, zoneTag });
      }
    } else {
      for (let i = 1; i < aoa.length; i++) {
        const row = aoa[i] || [];
        const dealer = String(row[0] || '').trim();
        if (!dealer) continue;
        for (let c = 1; c < header.length; c++) {
          const sample = header[c];
          if (!sample) continue;
          const cell = String(row[c] || '').trim();
          if (!cell) continue;
          pairs.push({ dealer, sample, zoneTag: '' });
        }
      }
    }

    const results = { added: 0, skipped: 0, samplesCreated: 0, errors: [] };
    const now = today();
    for (const { dealer, sample, zoneTag } of pairs) {
      try {
        // LONG format → pass zoneTag as the explicit zone (may be blank).
        // WIDE format → the header value in `sample` may contain "(ZONE X)"
        // so let ensureSample parse it.
        const s = isLong
          ? await ensureSample(sample, zoneTag || '')
          : await ensureSample(sample);
        if (!s) { results.skipped++; continue; }
        // De-dupe by (dealerName ci, sampleId). If the record exists but its
        // zoneTag differs from the sheet, update it — the sheet is the
        // authoritative source of that metadata.
        const ex = await SampleGiven.findOne({
          dealerName: new RegExp(`^${dealer.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i'),
          sampleId: String(s._id),
        });
        if (ex) {
          const desired = zoneTag || s.zone || 'General';
          if (zoneTag && ex.zone !== desired) {
            await SampleGiven.findByIdAndUpdate(ex._id, { zone: desired });
          }
          results.skipped++;
          continue;
        }
        await SampleGiven.create({
          dealerName: dealer,
          sampleId:   String(s._id),
          sampleName: s.name,
          // Prefer the sheet's zone tag ("All Zones" / "ZONE 2 & 5" / etc.)
          // — it captures how the sample applies to this dealer. Fall back
          // to the master's zone if the sheet cell is blank.
          zone:       zoneTag || s.zone || 'General',
          givenBy:    req.user.id,
          givenDate:  now,
        });
        results.added++;
      } catch (e) { results.errors.push(`${dealer}/${sample}: ${e.message}`); }
    }
    console.log(`[SAMPLES BULK] format=${isLong ? 'long' : 'wide'} added=${results.added} skipped=${results.skipped}`);
    res.json(results);
  } catch (e) {
    console.error('[samples/given/upload]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/samples/master/template — 3-column template for the Sample
// Master upload (Sample Name / Zone / Category). Pre-populated with any
// existing rows so admins see the current state and can extend it.
router.get('/master/template', protect, adminOnly, async (req, res) => {
  try {
    const existing = await Sample.find({ active: true }).sort({ zone: 1, name: 1 }).lean();
    const aoa = [
      ['Sample Name', 'Zone', 'Category'],
      ...existing.map(s => [s.name || '', s.zone || '', s.category || '']),
    ];
    // Blank rows for adding new samples.
    for (let i = 0; i < 5; i++) aoa.push(['', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample Master');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="Sample_Master_Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error('[samples/master/template]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/samples/upload — upload sample master (admin only)
router.post('/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if(!req.file) return res.status(400).json({ error:'file required' });
    const wb   = XLSX.read(req.file.buffer, { type:'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval:'' });
    if(!rows.length) return res.status(400).json({ error:'No data' });
    const results = { added:0, updated:0, errors:[] };
    // If the header row includes a dealer/company/party column, this sheet
    // is a "dealer x sample" upload — WRONG endpoint. Bail out so the
    // dealer names never leak into the Sample master.
    const headerKeys = rows[0] ? Object.keys(rows[0]) : [];
    const looksLikeDealerSheet = headerKeys.some(k =>
      /dealer|party|company/i.test(k) && !/sample|product/i.test(k)
    );
    if (looksLikeDealerSheet) {
      return res.status(400).json({
        error: 'This sheet looks like a Dealer × Sample file. Use the ' +
               '"Upload" button (Sample Master tab) which posts to ' +
               '/api/samples/given/upload — that flow adds records to ' +
               'each dealer without polluting the Sample master.',
      });
    }
    for(const row of rows) {
      const keys = Object.keys(row);
      const find = (...t) => {
        for(const x of t){
          const k=keys.find(k=>{
            const nk = k.toLowerCase().replace(/[\s_-]/g,'');
            // Never consider a column whose header includes dealer/company/
            // party words — those hold dealer names, not sample names.
            if (/dealer|party|company/.test(nk) && !/sample|product/.test(nk)) return false;
            return nk.includes(x.toLowerCase().replace(/[\s_-]/g,''));
          });
          if(k&&String(row[k]).trim()) return String(row[k]).trim();
        }
        return '';
      };
      const name     = find('sample','product','name');
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

// DELETE /api/samples/all — wipe entire sample master AND every SampleGiven
// record. Superadmin-only for safety — this is a nuclear option.
router.delete('/all', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin only' });
    }
    const g = await SampleGiven.deleteMany({});
    const s = await Sample.deleteMany({});
    console.log(`[SAMPLES WIPE] samples=${s.deletedCount} given=${g.deletedCount} by=${req.user.id}`);
    res.json({ samplesDeleted: s.deletedCount || 0, givenDeleted: g.deletedCount || 0 });
  } catch (e) {
    console.error('[samples DELETE /all]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/samples/:id — delete sample master (admin only). Also cleans
// up every SampleGiven record that pointed at it so no orphan chips remain
// on the dealer view.
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const id = req.params.id;
    const s = await Sample.findByIdAndDelete(id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    const g = await SampleGiven.deleteMany({ sampleId: String(id) });
    res.json({ ok: true, givenDeleted: g.deletedCount || 0 });
  } catch (e) {
    console.error('[samples DELETE /:id]', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;