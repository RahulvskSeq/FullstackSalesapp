import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Sale from '../models/Sale.js';
import Category from '../models/Category.js';
import Dealer from '../models/Dealer.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

/* ----------------------------------------------------------------- *
 *  Helpers                                                          *
 * ----------------------------------------------------------------- */

function normMonth(s) {
  // Accepts "2026-06", "Jun-26", "June 2026" → returns "YYYY-MM" or null
  if (!s) return null;
  const t = String(s).trim();
  let m = t.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return `${m[1]}-${String(+m[2]).padStart(2,'0')}`;
  m = t.match(/^([A-Za-z]+)[\s-]+(\d{2,4})$/);
  if (m) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const mi = months.indexOf(m[1].slice(0,3).toLowerCase());
    if (mi < 0) return null;
    let y = +m[2]; if (y < 100) y += 2000;
    return `${y}-${String(mi+1).padStart(2,'0')}`;
  }
  return null;
}

function cleanSalesman(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  // user data has duplicates like "Ratish Das - SEQUENCE Ratish Das - SEQUENCE"
  const half = Math.floor(s.length / 2);
  if (s.length > 8 && s[half-1] === ' ' && s.slice(0, half).trim() === s.slice(half).trim()) {
    return s.slice(0, half).trim();
  }
  return s;
}

function escapeRegex(s){ return String(s).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); }

/** Build a lookup map { subCategoryNameLower: categoryName } from the DB. */
async function buildSubToCatMap() {
  const cats = await Category.find({}).lean();
  const map = new Map();
  for (const c of cats) {
    for (const s of (c.subCategories || [])) {
      map.set(String(s.name).trim().toLowerCase(), c.name);
    }
  }
  return map;
}

/* ----------------------------------------------------------------- *
 *  GET /api/sales/template   — download UNIFIED Excel template      *
 *  Query params:                                                     *
 *    monthLabel=Jun-26   → if present, pre-fill achieved/target/...  *
 *    prefill=1           → list existing dealers as rows             *
 *    salesman=<id>       → filter prefill to one salesman            *
 *                                                                    *
 *  Layout (single sheet "Sales Data"):                               *
 *    A. Dealer Name      (must match existing dealer)                *
 *    B. Salesman                                                     *
 *    C. City                                                         *
 *    D. State                                                        *
 *    E. Zone                                                         *
 *    F. Status                                                       *
 *    G. Category Type    (legacy dealer category)                    *
 *    H. Sub Category     (legacy dealer sub-category)                *
 *    I. Target                                                       *
 *    J. Credit Days                                                  *
 *    K. Credit Limit                                                 *
 *    L+ <sub-category columns from your taxonomy>                    *
 *    last. Grand Total (= achieved for the month, sum of L+)         *
 * ----------------------------------------------------------------- */
router.get('/template', protect, async (req, res) => {
  const cats = await Category.find({}).sort({ name: 1 }).lean();
  const monthLabel = String(req.query.monthLabel || '').trim();    // e.g. "Jun-26"
  const prefill    = String(req.query.prefill || '') === '1' || !!monthLabel;
  const filterSm   = String(req.query.salesman || '').trim();

  // Build sub-cat column list: walk categories, then sub-cats in order.
  const subCols = [];
  for (const c of cats) {
    for (const s of (c.subCategories || [])) {
      subCols.push({ category: c.name, sub: s.name });
    }
  }

  // === Dealer-master fields (always come first) ===
  // NOTE: legacy "Category Type" + "Sub Category" columns were removed —
  // those single-value dealer fields are replaced by the proper multi-category
  // taxonomy where one dealer sells across many sub-categories.
  const DEALER_HEADERS = [
    'Dealer Name', 'Salesman', 'City', 'State', 'Zone', 'Status',
    'Target', 'Credit Days', 'Credit Limit',
  ];
  const N_DEALER = DEALER_HEADERS.length;   // 9

  const wb = XLSX.utils.book_new();

  // === Instructions sheet ===
  const inst = [
    ['Unified Sales Upload Template — Instructions'],
    [''],
    ['ONE Excel — updates everything: dealer info + per-month numbers + category-wise sales.'],
    [''],
    ['Sheet "Sales Data":'],
    ['  Row 1 = Section headers ("Dealer Info" / each Category / "Total")'],
    ['  Row 2 = Field names (Dealer Name, Salesman, City, …, 0.92 LAM, 1 MM, …, Grand Total)'],
    ['  Row 3+ = ONE row per dealer.'],
    [''],
    ['Columns A–K = dealer info (Salesman, City, State, Zone, Status, Category Type, Sub Category, Target, Credit Days, Credit Limit).'],
    ['Columns L+  = quantity sold per sub-category (Product Type). Leave blank or 0 if none.'],
    ['Grand Total column auto-calculates from the sub-category cells.'],
    [''],
    ['On upload:'],
    ['  1. Dealer master fields (City, State, Zone, Status, Category, Credit) are updated.'],
    ['  2. Per-month numbers (Target, Achieved=Grand Total, Status, Zone, City, State, Category, Credit) are written to monthly data for the picked month.'],
    ['  3. Category-wise sale rows are created from the sub-category cells.'],
    [''],
    ['Re-uploading the same month replaces that month\'s category sales cleanly.'],
    ['New categories/sub-categories added in Admin Panel → Categories show up next time you download this template.'],
  ];
  const instWS = XLSX.utils.aoa_to_sheet(inst);
  instWS['!cols'] = [{ wch: 110 }];
  XLSX.utils.book_append_sheet(wb, instWS, 'Instructions');

  // === Sales Data sheet — two header rows ===
  // Row 1 (sections):  "Dealer Info" (merged A..K)  | <Category names spread across sub-cat cols> | "Total" (merged on Grand Total col)
  // Row 2 (fields):    Dealer Name | Salesman | ... | 0.92 LAM | 1 MM | ... | Grand Total
  const header1 = [
    'Dealer Info', ...Array(N_DEALER - 1).fill(''),
    ...subCols.map(c => c.category),
    'Total',
  ];
  const header2 = [
    ...DEALER_HEADERS,
    ...subCols.map(c => c.sub),
    'Grand Total',
  ];

  const aoa = [header1, header2];

  // Optional prefill rows
  let prefillCount = 0;
  if (prefill) {
    const filt = {};
    if (filterSm) filt.salesman = filterSm;
    const dealers = await Dealer.find(filt).sort({ name: 1 }).lean();

    // Build a lookup of existing Sale rows for THIS month so each
    // (dealer × sub-category) cell can be pre-filled with the previously
    // saved quantity. Then the user can edit any cell in Excel and re-upload
    // as the new truth.
    const monthYM = normMonth(monthLabel);          // "Jun-26" → "2026-06"
    const saleByDealerSub = new Map();
    if (monthYM) {
      const sales = await Sale.find({ month: monthYM }, { dealerName:1, subCategory:1, qty:1 }).lean();
      for (const s of sales) {
        const key = (String(s.dealerName||'').toLowerCase().trim()) + '||' + (String(s.subCategory||'').toLowerCase().trim());
        // Sum in case (theoretically) two rows exist for the same combo
        saleByDealerSub.set(key, (saleByDealerSub.get(key) || 0) + (s.qty || 0));
      }
    }

    for (const d of dealers) {
      const md = (d.monthlyData && d.monthlyData[monthLabel]) || {};
      const nameKey = String(d.name||'').toLowerCase().trim();
      // Pre-fill each sub-category cell from the existing Sale rows.
      const subCells = subCols.map(c => {
        const k = nameKey + '||' + String(c.sub).toLowerCase().trim();
        const q = saleByDealerSub.get(k);
        return q ? Number(q) : '';
      });
      aoa.push([
        d.name || '',
        d.salesman || '',
        md.city || d.city || '',
        md.state || d.state || '',
        md.zone  || d.zone  || '',
        md.status|| d.status|| 'ACTIVE',
        Number(md.target || d.target || 0),
        Number(md.creditDays  || d.creditDays  || 0),
        Number(md.creditLimit || d.creditLimit || 0),
        ...subCells,
        '', // grand total (formula injected below)
      ]);
      prefillCount++;
    }
  }

  // At least 5 blank rows even when prefill is on, so adding new dealers is easy
  for (let i = 0; i < 5; i++) {
    aoa.push([...Array(N_DEALER).fill(''), ...subCols.map(() => ''), '']);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Add a SUM formula in the Grand Total column for every row that has data
  // (row index in sheet is 1-based and we start data at row 3)
  if (subCols.length > 0) {
    const firstSubCol = N_DEALER;                       // 0-based
    const lastSubCol  = N_DEALER + subCols.length - 1;  // 0-based
    const gtCol       = N_DEALER + subCols.length;      // 0-based
    const firstColLetter = XLSX.utils.encode_col(firstSubCol);
    const lastColLetter  = XLSX.utils.encode_col(lastSubCol);
    for (let r = 2; r < aoa.length; r++) {              // 0-based row, skip 2 header rows
      const cellRef  = XLSX.utils.encode_cell({ r, c: gtCol });
      const excelRow = r + 1;                            // 1-based for SUM formula
      ws[cellRef] = { t: 'n', f: `SUM(${firstColLetter}${excelRow}:${lastColLetter}${excelRow})` };
    }
  }

  // Column widths
  ws['!cols'] = [
    { wch: 36 },  // Dealer Name
    { wch: 22 },  // Salesman
    { wch: 16 },  // City
    { wch: 14 },  // State
    { wch: 12 },  // Zone
    { wch: 12 },  // Status
    { wch: 10 },  // Target
    { wch: 10 },  // Credit Days
    { wch: 12 },  // Credit Limit
    ...subCols.map(() => ({ wch: 13 })),
    { wch: 13 },  // Grand Total
  ];

  // Merges — section headers in Row 1
  const merges = [];
  // "Dealer Info" merged across cols 0..N_DEALER-1
  if (N_DEALER > 1) merges.push({ s:{ r:0, c:0 }, e:{ r:0, c:N_DEALER - 1 } });

  // Categories merged across their sub-cat columns
  let runStart = N_DEALER;
  for (let i = 1; i < subCols.length; i++) {
    if (subCols[i].category !== subCols[i-1].category) {
      const endCol = i - 1 + N_DEALER;
      if (endCol > runStart) merges.push({ s:{ r:0, c:runStart }, e:{ r:0, c:endCol } });
      runStart = i + N_DEALER;
    }
  }
  if (subCols.length > 0) {
    const endCol = subCols.length - 1 + N_DEALER;
    if (endCol > runStart) merges.push({ s:{ r:0, c:runStart }, e:{ r:0, c:endCol } });
  }
  ws['!merges'] = merges;

  // Freeze the header rows + the Dealer Name column so it's easy to scroll
  ws['!freeze'] = { xSplit: '1', ySplit: '2' };

  XLSX.utils.book_append_sheet(wb, ws, 'Sales Data');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const tag = monthLabel ? `_${monthLabel.replace(/[^A-Za-z0-9-]/g,'')}` : '';
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Sales_Upload_Template${tag}.xlsx"`);
  res.send(buf);
});

/* ----------------------------------------------------------------- *
 *  POST /api/sales/upload   — UNIFIED wide Excel upload             *
 *                                                                    *
 *  multipart form:                                                   *
 *    file=<xlsx>                                                     *
 *    month=YYYY-MM           — normalised month for Sale rows         *
 *    monthLabel=Jun-26       — optional MO label; if provided we      *
 *                              also update dealer.monthlyData[label]  *
 *    replace=true|false      — replace existing Sale rows for month   *
 *                                                                    *
 *  Does, per row:                                                    *
 *    1. UPSERT dealer master fields (City/State/Zone/Status/...)     *
 *    2. WRITE dealer.monthlyData[monthLabel] with achieved/target/    *
 *       status/zone/city/state/category/credit                       *
 *    3. EXPLODE sub-category cells into Sale line items              *
 * ----------------------------------------------------------------- */
router.post('/upload', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const month      = normMonth(req.body?.month);
    const monthLabel = String(req.body?.monthLabel || '').trim();   // e.g. "Jun-26"
    if (!month) return res.status(400).json({ error: 'month is required (YYYY-MM)' });

    const replace = String(req.body?.replace || 'true') === 'true';
    const batchId = `${month}-${Date.now()}`;

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });

    let sheetName = wb.SheetNames.find(n => /sales\s*data/i.test(n));
    if (!sheetName) sheetName = wb.SheetNames.find(n => !/instruction/i.test(n)) || wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return res.status(400).json({ error: 'sheet not found' });

    // Read with cellNF + cellText off, evaluating formulas as values.
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
    if (rows.length < 3) return res.status(400).json({ error: 'sheet has no data rows' });

    const r1 = rows[0].map(v => String(v || '').trim());
    const r2 = rows[1].map(v => String(v || '').trim());

    const subToCat = await buildSubToCatMap();
    const hasSubInRow2 = r2.some(v => v && subToCat.has(v.toLowerCase()));
    const hasSubInRow1 = r1.some(v => v && subToCat.has(v.toLowerCase()));

    let headerRowIdx, dataStartIdx, headerCols;
    if (hasSubInRow2) {
      headerRowIdx = 1; dataStartIdx = 2; headerCols = r2;
    } else if (hasSubInRow1) {
      headerRowIdx = 0; dataStartIdx = 1; headerCols = r1;
    } else {
      headerRowIdx = 0; dataStartIdx = 1; headerCols = r1;
    }

    // ───────────────────────────────────────────────────────────────
    // Column role detection.
    // Recognised dealer-master columns (case-insensitive header match):
    //   dealer       — Dealer Name / Company Name
    //   salesman     — Salesman / Sales Person
    //   city / state / zone / status
    //   catType      — Category Type
    //   subCat       — Sub Category
    //   target / creditDays / creditLimit
    //   subcat       — recognised product type (from the taxonomy)
    //   misc         — unknown numeric column → bucketed under OTHER
    //   ignore       — Grand Total / blank etc.
    // ───────────────────────────────────────────────────────────────
    // Legacy "Category Type" / "Sub Category" columns are explicitly IGNORED.
    // The new system derives all category info from the sub-category cells.
    const colInfo = headerCols.map((label, idx) => {
      const v = String(label || '').trim();
      const lv = v.toLowerCase();
      let role = 'ignore';
      if (idx === 0 || /^(company\s*name|dealer\s*name|dealer)$/i.test(v)) role = 'dealer';
      else if (/^(sales\s*person|salesman)$/i.test(v))                     role = 'salesman';
      else if (/^city$/i.test(v))                                           role = 'city';
      else if (/^state$/i.test(v))                                          role = 'state';
      else if (/^zone$/i.test(v))                                           role = 'zone';
      else if (/^status$/i.test(v))                                         role = 'status';
      else if (/^category\s*type$/i.test(v))                                role = 'ignore';   // legacy, dropped
      else if (/^sub\s*category$/i.test(v))                                 role = 'ignore';   // legacy, dropped
      else if (/^target$/i.test(v))                                         role = 'target';
      else if (/^credit\s*days$/i.test(v))                                  role = 'creditDays';
      else if (/^credit\s*limit$/i.test(v))                                 role = 'creditLimit';
      else if (/grand\s*total|^total$|^achieved$/i.test(v))                 role = 'ignore';
      else if (v && subToCat.has(lv))                                       role = 'subcat';
      else if (v)                                                           role = 'misc';
      return { idx, label: v, role };
    });

    const get = (row, role) => {
      const c = colInfo.find(x => x.role === role);
      return c ? row[c.idx] : undefined;
    };

    // Find dealer col index (used to skip blank rows)
    const dealerColIdx = colInfo.find(c => c.role === 'dealer')?.idx ?? 0;

    // Index by BOTH (name|salesman) and name alone. The unique index in Mongo
    // is { name:1, salesman:1 } — so two dealers can share a name across
    // salesmen. Looking up by name only would collapse them, leading to a
    // salesman-update that violates the unique constraint (E11000).
    //
    // Load FULL docs (not a projection) so we can read existing target /
    // monthlyData / etc. when computing diffs — otherwise a $set on
    // monthlyData[label] would wipe sibling fields and per-row target writes
    // couldn't compare against the prior value.
    const knownDealers = await Dealer.find({}).lean();
    const dealerByNameSm = new Map();
    const dealerByLower  = new Map();
    for (const d of knownDealers) {
      const nm = String(d.name || '').trim().toLowerCase();
      const sm = String(d.salesman || '').trim().toLowerCase();
      dealerByNameSm.set(`${nm}|${sm}`, d);
      if (!dealerByLower.has(nm)) dealerByLower.set(nm, d);
    }

    if (replace) {
      await Sale.deleteMany({ month });
    }

    const docs = [];
    const unknownSubs       = new Set();
    const unmatchedDealers  = new Set();
    let dealersUpdated      = 0;
    let dealersCreated      = 0;
    let monthlyDataUpdated  = 0;

    for (let i = dataStartIdx; i < rows.length; i++) {
      const row = rows[i];
      const dealerName = String(row[dealerColIdx] || '').trim();
      if (!dealerName) continue;

      // Skip the trailing "Grand Total" summary row that Excel pivots emit.
      if (/^grand\s*total$/i.test(dealerName) || /^total$/i.test(dealerName)) continue;

      const salesman = cleanSalesman(get(row, 'salesman'));

      // ── compute per-row totals from sub-cat cells ──────────────────
      let rowAchieved = 0;
      const rowSaleRows = [];   // { cat, sub, qty }
      for (const c of colInfo) {
        if (c.role !== 'subcat' && c.role !== 'misc') continue;
        const raw = row[c.idx];
        const qty = Number(raw) || 0;
        if (!qty) continue;

        let cat, sub;
        if (c.role === 'subcat') {
          sub = c.label;
          cat = subToCat.get(sub.toLowerCase());
        } else {
          unknownSubs.add(c.label);
          cat = 'OTHER';
          sub = c.label || 'OTHER';
        }
        rowAchieved += qty;
        rowSaleRows.push({ cat, sub, qty });
      }

      // ── dealer-master fields (only when the cell has a real value) ────
      // We distinguish "blank cell" (skip — don't wipe) from "0 / empty
      // string" written deliberately. For numeric fields, only include the
      // field when the cell is non-empty AND parses to a finite number.
      // For string fields, only include when the cell trims to non-empty.
      const masterFields = {};
      const hasCell = role => {
        const c = colInfo.find(x => x.role === role);
        if (!c) return false;
        const v = row[c.idx];
        return !(v === undefined || v === null || v === '');
      };
      const numCell = role => {
        const v = get(row, role);
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      if (hasCell('city'))        masterFields.city        = String(get(row,'city')||'').trim();
      if (hasCell('state'))       masterFields.state       = String(get(row,'state')||'').trim();
      if (hasCell('zone'))        masterFields.zone        = String(get(row,'zone')||'').trim();
      if (hasCell('status'))      masterFields.status      = String(get(row,'status')||'').trim() || 'ACTIVE';
      if (hasCell('target')      && numCell('target')      !== null) masterFields.target      = numCell('target');
      if (hasCell('creditDays')  && numCell('creditDays')  !== null) masterFields.creditDays  = numCell('creditDays');
      if (hasCell('creditLimit') && numCell('creditLimit') !== null) masterFields.creditLimit = numCell('creditLimit');

      // Resolve dealer doc — prefer EXACT (name + salesman) match so we don't
      // collapse two dealers that share a name across different salesmen.
      const nmLow = dealerName.toLowerCase();
      const smLow = String(salesman || '').trim().toLowerCase();
      let dealerDoc = smLow
        ? dealerByNameSm.get(`${nmLow}|${smLow}`)     // exact match wins
        : dealerByLower.get(nmLow);                   // name-only fallback if no salesman in row

      if (!dealerDoc) {
        // Truly new dealer for this (name + salesman) combination. Try to
        // create, but if Mongo's unique index fires (someone else just
        // created it, or our index was stale), fall back to re-fetching.
        if (salesman) {
          try {
            const created = await Dealer.create({
              name: dealerName,
              salesman,
              ...masterFields,
              source: 'cat-upload',
            });
            dealerByNameSm.set(`${nmLow}|${smLow}`, created);
            if (!dealerByLower.has(nmLow)) dealerByLower.set(nmLow, created);
            dealerDoc = created;
            dealersCreated++;
          } catch (err) {
            if (err && err.code === 11000) {
              // Race / stale-index protection — refetch and treat as update
              dealerDoc = await Dealer.findOne({ name: dealerName, salesman });
              if (dealerDoc) {
                dealerByNameSm.set(`${nmLow}|${smLow}`, dealerDoc);
              } else {
                unmatchedDealers.add(dealerName);
                console.warn('[sales/upload] 11000 but no doc found for', dealerName, salesman);
              }
            } else {
              throw err;
            }
          }
        } else {
          unmatchedDealers.add(dealerName);
        }
      }

      if (dealerDoc) {
        // Apply master-field updates only when something actually changed.
        // masterFields only contains keys whose cell was non-empty, so an
        // explicit 0 (e.g. Target reset) is preserved here — we just don't
        // overwrite when the value already matches.
        const updates = {};
        for (const [k, v] of Object.entries(masterFields)) {
          if (dealerDoc[k] !== v) updates[k] = v;
        }
        // NOTE: we deliberately do NOT overwrite an existing dealer's
        // salesman from the upload. If the Excel row's salesman differs,
        // it would create a new dealer above. Overwriting here is dangerous
        // because it can violate the unique { name, salesman } index when
        // another dealer already owns (name, new-salesman).

        // Per-month write (only when monthLabel was provided)
        if (monthLabel) {
          const md = dealerDoc.monthlyData instanceof Map
            ? Object.fromEntries(dealerDoc.monthlyData)
            : (dealerDoc.monthlyData || {});
          const prev = md[monthLabel] || {};
          const entry = {
            achieved:    rowAchieved || prev.achieved || 0,
            target:      ('target' in masterFields ? masterFields.target : (prev.target || 0)),
            status:      masterFields.status ?? prev.status ?? '',
            zone:        masterFields.zone   ?? prev.zone   ?? '',
            // category / categoryType intentionally preserved from previous
            // value only — the new system doesn't overwrite them from the sheet.
            category:    prev.category     ?? '',
            categoryType:prev.categoryType ?? '',
            city:        masterFields.city  ?? prev.city  ?? '',
            state:       masterFields.state ?? prev.state ?? '',
            creditDays:  ('creditDays'  in masterFields ? masterFields.creditDays  : (prev.creditDays  || 0)),
            creditLimit: ('creditLimit' in masterFields ? masterFields.creditLimit : (prev.creditLimit || 0)),
          };
          updates[`monthlyData.${monthLabel}`] = entry;
          monthlyDataUpdated++;
        }

        if (Object.keys(updates).length) {
          await Dealer.updateOne({ _id: dealerDoc._id }, { $set: updates });
          // Refresh in-memory copy so subsequent rows for same dealer see latest
          Object.assign(dealerDoc, updates);
          dealersUpdated++;
        }
      }

      // Sale line items (always, even if dealer didn't exist — saved by name)
      for (const r of rowSaleRows) {
        docs.push({
          dealerName,
          dealerId: dealerDoc?._id,
          salesman,
          month,
          category: r.cat,
          subCategory: r.sub,
          qty: r.qty,
          uploadedBy: req.user?.name || req.user?.email || '',
          uploadBatchId: batchId,
        });
      }
    }

    if (docs.length) await Sale.insertMany(docs);

    res.json({
      ok: true,
      month,
      monthLabel,
      inserted: docs.length,
      dealersCreated,
      dealersUpdated,
      monthlyDataUpdated,
      batchId,
      headerRowDetectedAt: headerRowIdx + 1,
      unmatchedDealers: [...unmatchedDealers].slice(0, 20),
      unmatchedDealersCount: unmatchedDealers.size,
      unknownSubCategories: [...unknownSubs],
    });
  } catch (e) {
    console.error('[sales/upload]', e);
    res.status(500).json({ error: e.message || 'upload failed' });
  }
});

/* ----------------------------------------------------------------- *
 *  GET /api/sales/months  — distinct months that have sales data    *
 * ----------------------------------------------------------------- */
router.get('/months', protect, async (req, res) => {
  const months = await Sale.distinct('month');
  months.sort();
  res.json(months);
});

/* ----------------------------------------------------------------- *
 *  Aggregations                                                     *
 * ----------------------------------------------------------------- */

function monthFilter(req) {
  const f = {};
  if (req.query.month) f.month = req.query.month;
  if (req.query.from && req.query.to) f.month = { $gte: req.query.from, $lte: req.query.to };
  if (req.query.salesman) f.salesman = req.query.salesman;
  if (req.query.dealer) f.dealerName = req.query.dealer;
  return f;
}

// GET /api/sales/by-category   →  [{ category, subCategory, qty }] + grand total
router.get('/by-category', protect, async (req, res) => {
  const filter = monthFilter(req);
  const rows = await Sale.aggregate([
    { $match: filter },
    { $group: { _id: { category: '$category', subCategory: '$subCategory' }, qty: { $sum: '$qty' } } },
    { $project: { _id: 0, category: '$_id.category', subCategory: '$_id.subCategory', qty: 1 } },
    { $sort: { category: 1, subCategory: 1 } },
  ]);
  const grandTotal = rows.reduce((a, r) => a + (r.qty || 0), 0);
  res.json({ rows, grandTotal });
});

// GET /api/sales/by-dealer  →  [{ dealer, byCategory:{cat:{sub:qty}}, total }]
router.get('/by-dealer', protect, async (req, res) => {
  const filter = monthFilter(req);
  const rows = await Sale.aggregate([
    { $match: filter },
    { $group: {
        _id: { dealer: '$dealerName', category: '$category', subCategory: '$subCategory' },
        qty: { $sum: '$qty' },
    }},
    { $sort: { '_id.dealer': 1, '_id.category': 1, '_id.subCategory': 1 } },
  ]);
  const out = {};
  let grandTotal = 0;
  for (const r of rows) {
    const d = r._id.dealer;
    out[d] = out[d] || { dealer: d, byCategory: {}, total: 0 };
    out[d].byCategory[r._id.category] = out[d].byCategory[r._id.category] || {};
    out[d].byCategory[r._id.category][r._id.subCategory] = r.qty;
    out[d].total += r.qty;
    grandTotal += r.qty;
  }
  res.json({ rows: Object.values(out).sort((a,b) => b.total - a.total), grandTotal });
});

// GET /api/sales/by-salesman  →  [{ salesman, byCategory:{cat:{sub:qty}}, total }]
router.get('/by-salesman', protect, async (req, res) => {
  const filter = monthFilter(req);
  const rows = await Sale.aggregate([
    { $match: filter },
    { $group: {
        _id: { salesman: '$salesman', category: '$category', subCategory: '$subCategory' },
        qty: { $sum: '$qty' },
    }},
    { $sort: { '_id.salesman': 1, '_id.category': 1, '_id.subCategory': 1 } },
  ]);
  const out = {};
  let grandTotal = 0;
  for (const r of rows) {
    const s = r._id.salesman || '(no salesman)';
    out[s] = out[s] || { salesman: s, byCategory: {}, total: 0 };
    out[s].byCategory[r._id.category] = out[s].byCategory[r._id.category] || {};
    out[s].byCategory[r._id.category][r._id.subCategory] = r.qty;
    out[s].total += r.qty;
    grandTotal += r.qty;
  }
  res.json({ rows: Object.values(out).sort((a,b) => b.total - a.total), grandTotal });
});

// GET /api/sales/raw  → raw line items (paged)
router.get('/raw', protect, async (req, res) => {
  const filter = monthFilter(req);
  const limit = Math.min(parseInt(req.query.limit) || 200, 5000);
  const skip = parseInt(req.query.skip) || 0;
  const rows = await Sale.find(filter).sort({ dealerName: 1, category: 1, subCategory: 1 }).skip(skip).limit(limit).lean();
  const total = await Sale.countDocuments(filter);
  res.json({ rows, total });
});

// GET /api/sales/dealer/:name  → full category-wise history for one dealer
// Returns: { dealer, months:[{ month, byCategory:{cat:{sub:qty}}, total }], grandTotal }
router.get('/dealer/:name', protect, async (req, res) => {
  const dealerName = decodeURIComponent(req.params.name);
  const rows = await Sale.aggregate([
    { $match: { dealerName } },
    { $group: {
        _id: { month:'$month', category:'$category', subCategory:'$subCategory' },
        qty: { $sum: '$qty' },
    }},
    { $sort: { '_id.month': -1, '_id.category': 1, '_id.subCategory': 1 } },
  ]);
  const byMonth = new Map();
  let grandTotal = 0;
  for (const r of rows) {
    const m = r._id.month;
    if (!byMonth.has(m)) byMonth.set(m, { month: m, byCategory: {}, total: 0 });
    const g = byMonth.get(m);
    g.byCategory[r._id.category] = g.byCategory[r._id.category] || {};
    g.byCategory[r._id.category][r._id.subCategory] = r.qty;
    g.total += r.qty;
    grandTotal += r.qty;
  }
  res.json({ dealer: dealerName, months: [...byMonth.values()], grandTotal });
});

// DELETE /api/sales/month/:m  — admin only — wipe a month's sales
router.delete('/month/:m', protect, adminOnly, async (req, res) => {
  const month = normMonth(req.params.m);
  if (!month) return res.status(400).json({ error: 'bad month' });
  const r = await Sale.deleteMany({ month });
  res.json({ ok: true, deleted: r.deletedCount });
});

export default router;
