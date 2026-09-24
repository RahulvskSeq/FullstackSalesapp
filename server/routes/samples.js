import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { protect, adminOnly, requireFeature } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage:multer.memoryStorage(), limits:{ fileSize:10*1024*1024 } });

// Inline schemas
const sampleSchema = new mongoose.Schema({
  name:{ type:String, required:true }, zone:{ type:String, required:true },
  category:{ type:String, default:'' }, active:{ type:Boolean, default:true },
  // pieces in hand for this zone, from the stock upload; allocations draw it down
  stock:{ type:Number, default:0 },
},{ timestamps:true });

const givenSchema = new mongoose.Schema({
  dealerName:{ type:String, required:true }, dealerId:{ type:String, default:'' },
  sampleId:  { type:String, required:true }, sampleName:{ type:String, required:true },
  zone:      { type:String, default:'' },    salesman:  { type:String, default:'' },
  givenBy:   { type:String, default:'' },    givenDate: { type:String, default:'' },
  notes:     { type:String, default:'' },
  qty:       { type:Number, default:1 },          // pieces with the dealer (dealer-wise sheet "Total")
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
    if(req.query.dealerId) filter.dealerId = String(req.query.dealerId);
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

router.post('/given/upload', protect, adminOnly, requireFeature('manageSamples'), upload.single('file'), async (req, res) => {
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
    if (isLong) {
      const r = await applyDealerWiseSheet(aoa, req.user.id);
      console.log(`[SAMPLES BULK] format=long-dealerwise added=${r.added} updated=${r.updated}`);
      return res.json({ added: r.added, skipped: r.updated, updated: r.updated, samplesCreated: r.samplesCreated.length, samplesCreatedNames: r.samplesCreated, dealersUnmatched: r.dealersUnmatched, errors: [] });
    }
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
router.post('/upload', protect, adminOnly, requireFeature('manageSamples'), upload.single('file'), async (req, res) => {
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
router.post('/', protect, adminOnly, requireFeature('manageSamples'), async (req, res) => {
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
router.delete('/:id', protect, adminOnly, requireFeature('manageSamples'), async (req, res) => {
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

/* ═══════════════════════ allocation: stock → dealers ═══════════════════════
 * Two sheets feed this:
 *   1. Stock:        Sample | Zone | Stock [| Category]   → sample master + pieces in hand
 *   2. Dealer-wise:  Dealer | Sample                        → allocations typed by the office
 * After a stock upload, pieces go first to the STAR / KEY ACCOUNT / ACHIEVER
 * dealers of that zone (one each, best first). What is left is tagged by
 * hand. A visit MOM turns an allocation into a SampleGiven.
 */
import SampleAllocation from '../models/SampleAllocation.js';
const PRIORITY_STATUS = ['STAR', 'KEY ACCOUNT', 'ACHIEVER'];
const norm = v => String(v || '').trim().toUpperCase().replace(/\s+/g, ' ');

const RETIRED = /^(delete|dispose|discontinued|remove|retired|scrap)/i;
const ALLZ = /^(all\s*zones?|general|all)$/i;
/** The zone rows one master line becomes: 'Zone 2, 5, 6' → ['ZONE 2','ZONE 5','ZONE 6']; 'All Zones' → ['All Zones']; 'NEW DEALERS ONLY' → itself. */
function splitZones(tag) {
  const t = String(tag || '').trim();
  if (!t || RETIRED.test(t)) return [];
  if (ALLZ.test(t)) return ['All Zones'];
  const nums = [...t.matchAll(/\d+/g)].map(m => 'ZONE ' + m[0]);
  return nums.length ? [...new Set(nums)] : [t.toUpperCase()];
}
/** Which dealers a zone row may go to on its own: ['ZONE 2'] / [] = every zone / null = special tag, by hand only. */
function zonesOf(sampleZone) {
  const t = String(sampleZone || '').trim();
  if (!t || ALLZ.test(t)) return [];
  const nums = [...t.matchAll(/\d+/g)].map(m => 'ZONE ' + m[0]);
  return nums.length ? nums : null;
}
const nameKey = n => String(n || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Stock is per sample NAME (the zone rows share it): stock minus everything allocated or given under that name. */
async function freeStock(sample) {
  const rows = await Sample.find({ active: true }, 'name stock').lean();
  const k = nameKey(sample.name);
  const stock = Math.max(0, ...rows.filter(r => nameKey(r.name) === k).map(r => Number(r.stock) || 0), 0);
  const ids = rows.filter(r => nameKey(r.name) === k).map(r => String(r._id));
  const used = await SampleAllocation.countDocuments({ sampleId: { $in: ids }, status: { $in: ['ALLOCATED', 'GIVEN'] } });
  return Math.max(0, stock - used);
}

/**
 * The zone sheet: Sample Name | Stock | Zones (| Category). One line per
 * sample; the Zones cell may name several ("Zone 2, 5, 6"), and each
 * becomes its own master row. Stock is the sample's, shared by its rows.
 * "Delete" / "Dispose" / "Discontinued" retires every row of that sample.
 */
export async function applyStockSheet(rows, by, { allocate = true } = {}) {
  const pick = (r, ...keys) => { for (const k of Object.keys(r)) if (keys.some(x => k.toLowerCase().includes(x))) return r[k]; return ''; };
  const out = { samples: 0, rows: 0, retired: 0, skipped: 0, allocated: 0, detail: [] };
  for (const r of rows) {
    const name = String(pick(r, 'sample', 'product', 'item', 'folder', 'name') || '').trim();
    const tag = String(pick(r, 'zone', 'territory', 'area') || '').trim();
    const stock = Math.max(0, Math.round(Number(pick(r, 'stock', 'qty', 'quantity', 'pieces', 'pcs')) || 0));
    const category = String(pick(r, 'category', 'type') || '').trim();
    if (!name || /grand total/i.test(name)) { out.skipped++; continue; }
    const zones = splitZones(tag);
    const existing = await Sample.find({}).lean().then(all => all.filter(x => nameKey(x.name) === nameKey(name)));
    if (!zones.length) {            // retired
      for (const x of existing) await Sample.updateOne({ _id: x._id }, { $set: { active: false, stock: 0 } });
      out.retired++; continue;
    }
    out.samples++;
    const keep = new Set();
    for (const z of zones) {
      let doc = existing.find(x => String(x.zone).toUpperCase() === z.toUpperCase());
      if (doc) await Sample.updateOne({ _id: doc._id }, { $set: { stock, active: true, ...(category ? { category } : {}) } });
      else doc = await Sample.create({ name, zone: z, category, stock, active: true });
      keep.add(String(doc._id)); out.rows++;
    }
    // zone rows the sheet no longer lists are retired, not deleted (given records still point at them)
    for (const x of existing) if (!keep.has(String(x._id))) await Sample.updateOne({ _id: x._id }, { $set: { active: false } });
    if (allocate) {
      let n = 0;
      for (const id of keep) { const doc = await Sample.findById(id); if (doc) n += await autoAllocate(doc, by); }
      out.allocated += n;
      out.detail.push({ name, zones, stock, allocated: n });
    }
  }
  return out;
}

/**
 * The dealer-wise sheet: Company Name | Product | Total. What each dealer
 * already holds. A dealer is matched to the master by name or alias; an
 * unknown name is still recorded under that name so nothing is lost.
 */
export async function applyDealerWiseSheet(aoa, by) {
  const Dealer = mongoose.models.Dealer;
  const header = (aoa[0] || []).map(h => String(h || '').trim().toLowerCase());
  const qtyIdx = header.findIndex(h => /total|qty|quantity|pcs|pieces|count/.test(h));
  const dealers = await Dealer.find({}, 'name zone salesman aliases').lean();
  const byName = new Map(); for (const d of dealers) { byName.set(nameKey(d.name), d); for (const a of (d.aliases || [])) byName.set(nameKey(a), d); }
  const master = await Sample.find({}).lean();
  const out = { added: 0, updated: 0, skipped: 0, samplesCreated: [], dealersUnmatched: new Set(), rows: 0 };
  for (let i = 1; i < aoa.length; i++) {
    const row = aoa[i] || [];
    const dealerRaw = String(row[0] || '').trim(), sampleRaw = String(row[1] || '').trim();
    if (!dealerRaw || !sampleRaw || /grand total/i.test(dealerRaw)) continue;
    out.rows++;
    const qty = qtyIdx >= 0 ? Math.max(1, Math.round(Number(row[qtyIdx]) || 1)) : 1;
    const d = byName.get(nameKey(dealerRaw)); if (!d) out.dealersUnmatched.add(dealerRaw);
    // the master row of the dealer's zone first, else the "All Zones" row, else any row with that name
    const rows = master.filter(x => nameKey(x.name) === nameKey(sampleRaw));
    let sm = rows.find(x => d && (zonesOf(x.zone) || []).includes(d.zone)) || rows.find(x => !zonesOf(x.zone)?.length && zonesOf(x.zone) !== null) || rows[0];
    if (!sm) { sm = await Sample.create({ name: sampleRaw, zone: 'Not in zone sheet', category: '', stock: 0, active: true }); master.push(sm.toObject()); out.samplesCreated.push(sampleRaw); }
    const dealerName = d ? d.name : dealerRaw;
    const esc = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ex = await SampleGiven.findOne({ dealerName: new RegExp('^\\s*' + esc(dealerName) + '\\s*$', 'i'), sampleId: String(sm._id) });
    if (ex) { await SampleGiven.updateOne({ _id: ex._id }, { $set: { qty, dealerId: d ? String(d._id) : ex.dealerId || '', salesman: d?.salesman || ex.salesman || '' } }); out.updated++; continue; }
    await SampleGiven.create({ dealerName, dealerId: d ? String(d._id) : '', sampleId: String(sm._id), sampleName: sm.name, zone: sm.zone, salesman: d?.salesman || '', givenBy: by, givenDate: today(), notes: 'dealer-wise sheet', qty });
    out.added++;
  }
  out.dealersUnmatched = [...out.dealersUnmatched];
  return out;
}

/** Allot free pieces of one sample to the priority dealers of its zone(s). */
async function autoAllocate(sample, by) {
  const Dealer = mongoose.models.Dealer;
  let free = await freeStock(sample);
  if (free <= 0) return 0;
  const zones = zonesOf(sample.zone);
  if (zones === null) return 0;                  // NEW DEALERS ONLY, Architects, … — by hand only
  const f = { status: { $in: PRIORITY_STATUS }, ...(zones.length ? { zone: { $in: zones } } : {}) };
  const dealers = await Dealer.find(f, 'name zone salesman status perfQty').lean();
  // best first: STAR, then KEY ACCOUNT, then ACHIEVER; within a tier, bigger buyer first
  const rank = d => PRIORITY_STATUS.indexOf(d.status);
  dealers.sort((a, b) => rank(a) - rank(b) || (b.perfQty || 0) - (a.perfQty || 0) || a.name.localeCompare(b.name));
  const sameName = (await Sample.find({}, 'name').lean()).filter(x => nameKey(x.name) === nameKey(sample.name)).map(x => String(x._id));
  const have = new Set((await SampleAllocation.find({ sampleId: { $in: sameName }, status: { $in: ['REQUESTED', 'ALLOCATED', 'GIVEN'] } }, 'dealerId').lean()).map(a => a.dealerId));
  const given = new Set((await SampleGiven.find({ sampleId: { $in: sameName } }, 'dealerName').lean()).map(g => norm(g.dealerName)));
  let n = 0;
  for (const d of dealers) {
    if (free <= 0) break;
    if (have.has(String(d._id)) || given.has(norm(d.name))) continue;   // already has it
    await SampleAllocation.create({ sampleId: String(sample._id), sampleName: sample.name, zone: sample.zone, dealerId: String(d._id), dealerName: d.name, dealerZone: d.zone || '', salesman: d.salesman || '', status: 'ALLOCATED', source: 'auto', reason: `${d.status} · ${d.zone || 'no zone'}`, createdBy: by });
    free--; n++;
  }
  return n;
}

// POST /api/samples/stock/upload — Sample Name | Stock | Zones (| Category); zones split into rows; then auto-allot
router.post('/stock/upload', protect, adminOnly, requireFeature('manageSamples'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    if (!rows.length) return res.status(400).json({ error: 'That sheet has no rows' });
    const out = await applyStockSheet(rows, req.user.id);
    res.json({ ...out, added: out.rows, updated: 0, samples: out.detail.map(x => ({ ...x, left: 0 })) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/samples/alloc/upload — Dealer | Sample: allocations typed by the office
router.post('/alloc/upload', protect, adminOnly, requireFeature('manageSamples'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const Dealer = mongoose.models.Dealer;
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    const pick = (r, ...keys) => { for (const k of Object.keys(r)) if (keys.some(x => k.toLowerCase().includes(x))) return r[k]; return ''; };
    const dealers = await Dealer.find({}, 'name zone salesman aliases').lean();
    const byName = new Map(); for (const d of dealers) { byName.set(norm(d.name), d); for (const a of (d.aliases || [])) byName.set(norm(a), d); }
    const samples = await Sample.find({ active: true }).lean();
    const out = { added: 0, already: 0, noDealer: [], noSample: [], noStock: [] };
    for (const r of rows) {
      const dn = String(pick(r, 'dealer', 'party', 'company', 'customer') || '').trim();
      const sn = String(pick(r, 'sample', 'product', 'item', 'folder') || '').trim();
      if (!dn || !sn) continue;
      const d = byName.get(norm(dn)); if (!d) { out.noDealer.push(dn); continue; }
      // the sample of the dealer's zone first, else any zone with that name
      const cands = samples.filter(x => norm(x.name) === norm(sn));
      const sm = cands.find(x => (zonesOf(x.zone) || []).includes(d.zone)) || cands.find(x => zonesOf(x.zone) !== null && !zonesOf(x.zone).length) || cands[0];
      if (!sm) { out.noSample.push(sn); continue; }
      const dup = await SampleAllocation.findOne({ sampleId: String(sm._id), dealerId: String(d._id), status: { $in: ['ALLOCATED', 'GIVEN'] } });
      if (dup) { out.already++; continue; }
      if (await freeStock(sm) <= 0) { out.noStock.push(`${sn} → ${dn}`); continue; }
      await SampleAllocation.create({ sampleId: String(sm._id), sampleName: sm.name, zone: sm.zone, dealerId: String(d._id), dealerName: d.name, dealerZone: d.zone || '', salesman: d.salesman || '', status: 'ALLOCATED', source: 'sheet', reason: 'dealer-wise sheet', createdBy: req.user.id });
      out.added++;
    }
    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/samples/alloc — allocations (staff: all; salesman: own dealers) + per-sample stock summary
router.get('/alloc', protect, async (req, res) => {
  try {
    const f = {};
    if (!isStaff(req)) f.salesman = req.user.id;
    if (req.query.status) f.status = { $in: String(req.query.status).split(',') };
    if (req.query.sampleId) f.sampleId = String(req.query.sampleId);
    if (req.query.dealerId) f.dealerId = String(req.query.dealerId);
    const items = await SampleAllocation.find(f).sort({ createdAt: -1 }).limit(2000).lean();
    const samples = await Sample.find({ active: true }).sort({ zone: 1, name: 1 }).lean();
    const counts = await SampleAllocation.aggregate([{ $group: { _id: { s: '$sampleId', st: '$status' }, n: { $sum: 1 } } }]);
    const c = (id, st) => counts.find(x => x._id.s === String(id) && x._id.st === st)?.n || 0;
    const summary = samples.map(sm => ({ id: sm._id, name: sm.name, zone: sm.zone, stock: sm.stock || 0, allocated: c(sm._id, 'ALLOCATED'), given: c(sm._id, 'GIVEN'), left: Math.max(0, (sm.stock || 0) - c(sm._id, 'ALLOCATED') - c(sm._id, 'GIVEN')) }));
    res.json({ items, summary });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/samples/alloc — tag one piece to a dealer by hand
router.post('/alloc', protect, adminOnly, requireFeature('manageSamples'), async (req, res) => {
  try {
    const Dealer = mongoose.models.Dealer;
    const { sampleId, dealerId, takeBack } = req.body || {};
    const sm = await Sample.findById(sampleId); const d = await Dealer.findById(dealerId, 'name zone salesman').lean();
    if (!sm || !d) return res.status(404).json({ error: 'sample or dealer not found' });
    const dup = await SampleAllocation.findOne({ sampleId: String(sm._id), dealerId: String(d._id), status: { $in: ['ALLOCATED', 'GIVEN'] } });
    if (dup) return res.status(400).json({ error: 'this dealer already has that sample allotted' });
    if (await freeStock(sm) <= 0) return res.status(400).json({ error: 'no stock left for this sample' });
    const a = await SampleAllocation.create({ sampleId: String(sm._id), sampleName: sm.name, zone: sm.zone, dealerId: String(d._id), dealerName: d.name, dealerZone: d.zone || '', salesman: d.salesman || '', status: 'ALLOCATED', source: 'manual', reason: 'tagged from software', takeBack: !!takeBack, createdBy: req.user.id });
    res.json(a);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/samples/alloc/request — a salesman asks for a sample for his dealer; admin approves
router.post('/alloc/request', protect, requireFeature('visitMom'), async (req, res) => {
  try {
    const Dealer = mongoose.models.Dealer;
    const { sampleId, dealerId, note } = req.body || {};
    const sm = await Sample.findById(sampleId); const d = await Dealer.findById(dealerId, 'name zone salesman').lean();
    if (!sm || !d) return res.status(404).json({ error: 'sample or dealer not found' });
    if (!isStaff(req) && d.salesman !== req.user.id) return res.status(403).json({ error: 'not your dealer' });
    const dup = await SampleAllocation.findOne({ sampleId: String(sm._id), dealerId: String(d._id), status: { $in: ['REQUESTED', 'ALLOCATED', 'GIVEN'] } });
    if (dup) return res.status(400).json({ error: dup.status === 'REQUESTED' ? 'already requested — waiting for admin' : 'this dealer already has that sample' });
    const a = await SampleAllocation.create({ sampleId: String(sm._id), sampleName: sm.name, zone: sm.zone, dealerId: String(d._id), dealerName: d.name, dealerZone: d.zone || '', salesman: d.salesman || req.user.id, status: 'REQUESTED', source: 'salesman', reason: `requested by ${req.user.id}${note ? ' · ' + String(note).slice(0, 200) : ''}`, createdBy: req.user.id });
    res.json({ ...a.toObject(), stockLeft: await freeStock(sm) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/samples/alloc/:id — approve a request (→ ALLOCATED), reject/cancel, or the takeBack flag
router.put('/alloc/:id', protect, adminOnly, requireFeature('manageSamples'), async (req, res) => {
  try {
    const a = await SampleAllocation.findById(req.params.id); if (!a) return res.status(404).json({ error: 'not found' });
    if (req.body?.takeBack !== undefined) a.takeBack = !!req.body.takeBack;
    if (req.body?.status === 'ALLOCATED' && a.status === 'REQUESTED') {
      const sm = await Sample.findById(a.sampleId);
      if (!sm || await freeStock(sm) <= 0) return res.status(400).json({ error: 'no stock left for this sample — upload stock first' });
      a.status = 'ALLOCATED'; a.reason = a.reason.replace(/^requested/, 'approved · requested'); a.set('approvedBy', req.user.id, { strict: false });
    }
    if (req.body?.status === 'CANCELLED' && ['REQUESTED', 'ALLOCATED'].includes(a.status)) { a.status = 'CANCELLED'; if (req.body.reason) a.reason += ' · ' + String(req.body.reason).slice(0, 200); }
    await a.save(); res.json(a);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/samples/alloc/:id/given — the salesman handed it over (also from the visit MOM)
router.post('/alloc/:id/given', protect, async (req, res) => {
  try {
    const a = await SampleAllocation.findById(req.params.id); if (!a) return res.status(404).json({ error: 'not found' });
    if (a.status !== 'ALLOCATED') return res.status(400).json({ error: `already ${a.status.toLowerCase()}` });
    if (!isStaff(req) && a.salesman !== req.user.id) return res.status(403).json({ error: 'not your dealer' });
    const g = await SampleGiven.create({ dealerName: a.dealerName, dealerId: a.dealerId, sampleId: a.sampleId, sampleName: a.sampleName, zone: a.zone, salesman: a.salesman || req.user.id, givenBy: req.user.id, givenDate: today(), notes: req.body?.notes || 'from allocation' });
    a.status = 'GIVEN'; a.givenId = String(g._id); a.givenDate = today(); await a.save();
    res.json(a);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/samples/alloc/:id/returned — taken back on a visit
router.post('/alloc/:id/returned', protect, async (req, res) => {
  try {
    const a = await SampleAllocation.findById(req.params.id); if (!a) return res.status(404).json({ error: 'not found' });
    if (a.status !== 'GIVEN') return res.status(400).json({ error: 'only a given sample can be taken back' });
    if (!isStaff(req) && a.salesman !== req.user.id) return res.status(403).json({ error: 'not your dealer' });
    if (a.givenId) await SampleGiven.deleteOne({ _id: a.givenId });
    a.status = 'RETURNED'; a.returnedDate = today(); a.takeBack = false; await a.save();
    res.json(a);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/samples/given/:id/take-back — the office flags a sample the dealer holds for collection on the next visit (or clears the flag)
router.post('/given/:id/take-back', protect, requireFeature('visitMom'), async (req, res) => {
  try {
    const g = await SampleGiven.findById(req.params.id); if (!g) return res.status(404).json({ error: 'not found' });
    const on = req.body?.takeBack !== false;
    let a = await SampleAllocation.findOne({ givenId: String(g._id) });
    if (!a) a = await SampleAllocation.findOne({ sampleId: g.sampleId, status: 'GIVEN', $or: [{ dealerId: g.dealerId || '__none__' }, { dealerName: g.dealerName }] });
    if (!a) {
      const Dealer = mongoose.models.Dealer;
      const d = g.dealerId ? await Dealer.findById(g.dealerId, 'name zone salesman').lean() : await Dealer.findOne({ name: new RegExp('^\\s*' + String(g.dealerName).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i') }, 'name zone salesman').lean();
      a = await SampleAllocation.create({ sampleId: g.sampleId, sampleName: g.sampleName, zone: g.zone, dealerId: d ? String(d._id) : (g.dealerId || ''), dealerName: d?.name || g.dealerName, dealerZone: d?.zone || '', salesman: d?.salesman || g.salesman || '', status: 'GIVEN', source: 'sheet', reason: 'held by dealer', givenId: String(g._id), givenDate: g.givenDate, createdBy: req.user.id });
    }
    a.takeBack = on; a.givenId = a.givenId || String(g._id); await a.save();
    res.json({ ok: true, allocId: a._id, takeBack: a.takeBack });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* One endpoint for the office to move a sample between the dealer's four
 * lists: shown (master, not with dealer) · has (given) · give (allotted) · back (flagged).
 *   POST /api/samples/move { dealerId, kind: 'sample'|'given'|'alloc', id, to: 'show'|'has'|'give'|'back' }
 */
router.post('/move', protect, requireFeature('visitMom'), async (req, res) => {
  try {
    const Dealer = mongoose.models.Dealer;
    const { dealerId, kind, id, to } = req.body || {};
    const d = await Dealer.findById(dealerId, 'name zone salesman').lean(); if (!d) return res.status(404).json({ error: 'dealer not found' });
    if (!['show', 'has', 'give', 'back'].includes(to)) return res.status(400).json({ error: 'bad target' });
    const by = req.user.id, day = today();
    const esc = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const giveTo = async (sm) => {
      const dup = await SampleAllocation.findOne({ sampleId: String(sm._id), dealerId: String(d._id), status: { $in: ['REQUESTED', 'ALLOCATED'] } });
      if (dup) { if (dup.status === 'REQUESTED') { dup.status = 'ALLOCATED'; dup.reason = 'approved · ' + dup.reason; await dup.save(); } return dup; }
      return SampleAllocation.create({ sampleId: String(sm._id), sampleName: sm.name, zone: sm.zone, dealerId: String(d._id), dealerName: d.name, dealerZone: d.zone || '', salesman: d.salesman || '', status: 'ALLOCATED', source: 'manual', reason: 'moved by office', createdBy: by });
    };
    const hasIt = async (sm, fromAlloc = null) => {
      const ex = await SampleGiven.findOne({ dealerName: new RegExp('^\\s*' + esc(d.name) + '\\s*$', 'i'), sampleId: String(sm._id) });
      if (ex) return ex;
      const g = await SampleGiven.create({ dealerName: d.name, dealerId: String(d._id), sampleId: String(sm._id), sampleName: sm.name, zone: sm.zone, salesman: d.salesman || '', givenBy: by, givenDate: day, notes: fromAlloc ? 'given · moved by office' : 'recorded by office' });
      if (fromAlloc) { fromAlloc.status = 'GIVEN'; fromAlloc.givenId = String(g._id); fromAlloc.givenDate = day; await fromAlloc.save(); }
      else await SampleAllocation.create({ sampleId: String(sm._id), sampleName: sm.name, zone: sm.zone, dealerId: String(d._id), dealerName: d.name, dealerZone: d.zone || '', salesman: d.salesman || '', status: 'GIVEN', source: 'manual', reason: 'recorded by office', givenId: String(g._id), givenDate: day, createdBy: by });
      return g;
    };
    const removeGiven = async (g, status) => {
      const a = await SampleAllocation.findOne({ givenId: String(g._id) }) || await SampleAllocation.findOne({ sampleId: g.sampleId, dealerId: String(d._id), status: 'GIVEN' });
      if (a) { a.status = status; a.takeBack = false; if (status === 'RETURNED') a.returnedDate = day; await a.save(); }
      await SampleGiven.deleteOne({ _id: g._id });
    };
    const flag = async (g, on) => {
      let a = await SampleAllocation.findOne({ givenId: String(g._id) }) || await SampleAllocation.findOne({ sampleId: g.sampleId, dealerId: String(d._id), status: 'GIVEN' });
      if (!a) a = await SampleAllocation.create({ sampleId: g.sampleId, sampleName: g.sampleName, zone: g.zone, dealerId: String(d._id), dealerName: d.name, dealerZone: d.zone || '', salesman: d.salesman || '', status: 'GIVEN', source: 'sheet', reason: 'held by dealer', givenId: String(g._id), givenDate: g.givenDate, createdBy: by });
      a.takeBack = on; a.givenId = a.givenId || String(g._id); await a.save();
    };

    if (kind === 'sample') {                                 // from "To be shown"
      const sm = await Sample.findById(id); if (!sm) return res.status(404).json({ error: 'sample not found' });
      if (to === 'give') await giveTo(sm);
      else if (to === 'has') await hasIt(sm);
      else if (to === 'back') { const g = await hasIt(sm); await flag(g, true); }
    } else if (kind === 'alloc') {                           // from "To be given"
      const a = await SampleAllocation.findById(id); if (!a || a.dealerId !== String(d._id)) return res.status(404).json({ error: 'allotment not found' });
      const sm = await Sample.findById(a.sampleId);
      if (to === 'show') { a.status = 'CANCELLED'; a.reason += ' · moved out by office'; await a.save(); }
      else if (to === 'has' && sm) await hasIt(sm, a);
      else if (to === 'back' && sm) { const g = await hasIt(sm, a); await flag(g, true); }
    } else if (kind === 'given') {                           // from "Already has" or "To be taken back"
      const g = await SampleGiven.findById(id); if (!g) return res.status(404).json({ error: 'record not found' });
      if (to === 'back') await flag(g, true);
      else if (to === 'has') await flag(g, false);
      else if (to === 'show') await removeGiven(g, 'RETURNED');
      else if (to === 'give') { const sm = await Sample.findById(g.sampleId); await removeGiven(g, 'CANCELLED'); if (sm) await giveTo(sm); }
    } else return res.status(400).json({ error: 'bad kind' });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export { SampleAllocation, Sample, SampleGiven, zonesOf, splitZones, autoAllocate, freeStock };

export default router;