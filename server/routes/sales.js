import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Sale from '../models/Sale.js';
import Category from '../models/Category.js';
import Dealer from '../models/Dealer.js';
import SalesTarget from '../models/SalesTarget.js';
import { protect, adminOnly, superAdminOnly, requireFeature } from '../middleware/auth.js';

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
  //
  // The FIRST column is "Dealer ID" — a hidden-ish stable handle that the
  // upload uses as the canonical identifier. As long as this cell is left
  // alone, the user can edit Dealer Name, Salesman, City, etc. and the
  // upload will UPDATE the same dealer in place (no more duplicates from
  // renaming or reassigning). New rows leave Dealer ID blank — the parser
  // falls back to (name|salesman) lookup-or-create for those.
  const DEALER_HEADERS = [
    'Dealer ID',
    'Dealer Name', 'Salesman', 'City', 'State', 'Zone', 'Status',
    'Address', 'Pincode',
    'Target', 'Credit Days', 'Credit Limit',
  ];
  const N_DEALER = DEALER_HEADERS.length;   // 12

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
    ['Column A = Dealer ID — HIDDEN. DO NOT EDIT or DELETE these values.'],
    ['  This is how the system finds the existing dealer when you change Name, Salesman or any other field.'],
    ['  Leave blank only when ADDING a brand-new dealer at the bottom.'],
    ['Columns B–J = dealer info (Dealer Name, Salesman, City, State, Zone, Status, Target, Credit Days, Credit Limit).'],
    ['Columns K+  = quantity sold per sub-category (Product Type). Leave blank or 0 if none.'],
    ['Grand Total column auto-calculates from the sub-category cells.'],
    [''],
    ['On upload:'],
    ['  1. If Dealer ID is filled, the dealer is UPDATED in place — including any Name or Salesman change.'],
    ['  2. Dealer master fields (City, State, Zone, Status, Target, Credit) are updated.'],
    ['  3. Per-month numbers (Target, Achieved=Grand Total, Status, Zone, City, State, Credit) are written to monthly data for the picked month.'],
    ['  4. Category-wise sale rows are created from the sub-category cells.'],
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
        String(d._id || ''),                // Dealer ID — DO NOT EDIT
        d.name || '',
        d.salesman || '',
        md.city || d.city || '',
        md.state || d.state || '',
        md.zone  || d.zone  || '',
        md.status|| d.status|| 'ACTIVE',
        d.address || '',
        d.pincode || '',
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
    { wch: 8, hidden: true },  // Dealer ID — hidden so users don't fiddle with it
    { wch: 36 },  // Dealer Name
    { wch: 22 },  // Salesman
    { wch: 16 },  // City
    { wch: 14 },  // State
    { wch: 12 },  // Zone
    { wch: 12 },  // Status
    { wch: 40 },  // Address
    { wch: 10 },  // Pincode
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

  // Freeze the header rows + the Dealer ID + Dealer Name cols so it's easy to scroll
  ws['!freeze'] = { xSplit: '2', ySplit: '2' };

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
router.post('/upload', protect, superAdminOnly, upload.single('file'), async (req, res) => {
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
    // First pass — does the sheet have an explicit "Dealer ID" header?
    // If so, the 'dealer' role must be picked up by NAME match only, not by
    // the legacy "first column is the dealer" fallback.
    const hasDealerIdCol = headerCols.some(h => /^dealer\s*id$/i.test(String(h || '').trim()));

    const colInfo = headerCols.map((label, idx) => {
      const v = String(label || '').trim();
      const lv = v.toLowerCase();
      let role = 'ignore';
      if (/^dealer\s*id$/i.test(v))                                         role = 'dealerid';
      else if ((!hasDealerIdCol && idx === 0) || /^(company\s*name|dealer\s*name|dealer)$/i.test(v)) role = 'dealer';
      else if (/^(sales\s*person|salesman)$/i.test(v))                     role = 'salesman';
      else if (/^city$/i.test(v))                                           role = 'city';
      else if (/^state$/i.test(v))                                          role = 'state';
      else if (/^zone$/i.test(v))                                           role = 'zone';
      else if (/^address$/i.test(v))                                        role = 'address';
      else if (/^pincode$|^pin\s*code$|^zip$/i.test(v))                     role = 'pincode';
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
    const dealerByNameSm   = new Map();
    const dealerByLower    = new Map();
    const dealerById       = new Map();   // _id string → dealer doc (lean)
    // Stripped maps — lowercase + every non-alphanumeric char removed.
    // Catches the classic dupe scenario where the upload's name is
    // "1000KITCHENSINTERIORS" but the DB stored "1000 Kitchens Interiors".
    const stripKey = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const dealerByStrippedSm = new Map();
    const dealerByStripped   = new Map();
    for (const d of knownDealers) {
      const nm = String(d.name || '').trim().toLowerCase();
      const sm = String(d.salesman || '').trim().toLowerCase();
      dealerByNameSm.set(`${nm}|${sm}`, d);
      if (!dealerByLower.has(nm)) dealerByLower.set(nm, d);
      dealerById.set(String(d._id), d);
      const snm = stripKey(d.name);
      const ssm = stripKey(d.salesman);
      if (snm) {
        dealerByStrippedSm.set(`${snm}|${ssm}`, d);
        if (!dealerByStripped.has(snm)) dealerByStripped.set(snm, d);
      }
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
      if (hasCell('address'))     masterFields.address     = String(get(row,'address')||'').trim();
      if (hasCell('pincode'))     masterFields.pincode     = String(get(row,'pincode')||'').trim();
      if (hasCell('status'))      masterFields.status      = String(get(row,'status')||'').trim() || 'ACTIVE';
      if (hasCell('target')      && numCell('target')      !== null) masterFields.target      = numCell('target');
      if (hasCell('creditDays')  && numCell('creditDays')  !== null) masterFields.creditDays  = numCell('creditDays');
      if (hasCell('creditLimit') && numCell('creditLimit') !== null) masterFields.creditLimit = numCell('creditLimit');

      // ── Resolve dealer doc ────────────────────────────────────────────
      // Priority order (so editing Name or Salesman never creates a dupe):
      //   1. Explicit "Dealer ID" cell (the hidden column the template pre-
      //      fills with the dealer's _id). Bullet-proof — even if the user
      //      changes both name and salesman, this still finds the original.
      //   2. Exact (name|salesman) match from the existing roster.
      //   3. Name-only match if the row has no salesman, OR exactly one
      //      dealer with that name exists in the DB (treat as "moved
      //      between salesmen").
      //   4. Truly new dealer → create.
      const rowDealerId = String(get(row, 'dealerid') || '').trim();
      const nmLow = dealerName.toLowerCase();
      const smLow = String(salesman || '').trim().toLowerCase();
      // Stripped keys for fuzzy fallback (handles "1000KITCHENSINTERIORS"
      // vs "1000 Kitchens Interiors" — both strip to the same key).
      const nmStr = stripKey(dealerName);
      const smStr = stripKey(salesman);
      let dealerDoc =
            (rowDealerId && dealerById.get(rowDealerId))
         || (smLow ? dealerByNameSm.get(`${nmLow}|${smLow}`) : null)
         || (!smLow ? dealerByLower.get(nmLow) : null)
         || (smStr ? dealerByStrippedSm.get(`${nmStr}|${smStr}`) : null)
         || (nmStr ? dealerByStripped.get(nmStr) : null)
         || dealerByLower.get(nmLow);   // last-ditch single-name match

      // If we matched by ID but the user CHANGED the name or salesman, queue
      // those changes into masterFields so they propagate to Mongo.
      if (rowDealerId && dealerDoc) {
        if (dealerName && dealerName !== dealerDoc.name) {
          masterFields.name = dealerName;
        }
        if (salesman && salesman !== dealerDoc.salesman) {
          masterFields.salesman = salesman;
        }
      }

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
            dealerById.set(String(created._id), created);
            dealerDoc = created;
            dealersCreated++;
          } catch (err) {
            if (err && err.code === 11000) {
              // Race / stale-index protection — refetch and treat as update
              dealerDoc = await Dealer.findOne({ name: dealerName, salesman });
              if (dealerDoc) {
                dealerByNameSm.set(`${nmLow}|${smLow}`, dealerDoc);
                dealerById.set(String(dealerDoc._id), dealerDoc);
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
        //
        // When the row carried a Dealer ID, masterFields may also include
        // `name` and `salesman` (the user renamed / reassigned the party).
        // Those are applied here too. If the new (name, salesman) pair
        // collides with another existing dealer, Mongo's unique index
        // throws E11000 — we catch it and skip the row so the upload as a
        // whole doesn't blow up.
        const updates = {};
        for (const [k, v] of Object.entries(masterFields)) {
          if (dealerDoc[k] !== v) updates[k] = v;
        }

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
          try {
            await Dealer.updateOne({ _id: dealerDoc._id }, { $set: updates });
            // Refresh in-memory copy + lookup maps so subsequent rows for
            // the same dealer see the latest values (esp. after rename).
            const prevNm = String(dealerDoc.name || '').trim().toLowerCase();
            const prevSm = String(dealerDoc.salesman || '').trim().toLowerCase();
            dealerByNameSm.delete(`${prevNm}|${prevSm}`);
            Object.assign(dealerDoc, updates);
            const newNm = String(dealerDoc.name || '').trim().toLowerCase();
            const newSm = String(dealerDoc.salesman || '').trim().toLowerCase();
            dealerByNameSm.set(`${newNm}|${newSm}`, dealerDoc);
            if (newNm) dealerByLower.set(newNm, dealerDoc);
            dealersUpdated++;
          } catch (err) {
            if (err && err.code === 11000) {
              // Rename collided with an existing (name, salesman) pair —
              // skip the master-field part of this row but still write the
              // category sales below. Surface the conflict to the user via
              // unmatchedDealers so they see something went wrong.
              unmatchedDealers.add(dealerName + ' (rename conflict — another dealer already owns the new name/salesman pair)');
              console.warn('[sales/upload] rename conflict for', dealerDoc.name, '→', updates.name, '/', updates.salesman);
            } else {
              throw err;
            }
          }
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

// Async because we may need to look up the user's permissions in Mongo and
// resolve permitted-state dealer names before composing the filter.
async function monthFilter(req) {
  const f = {};
  if (req.query.month) f.month = req.query.month;
  if (req.query.from && req.query.to) f.month = { $gte: req.query.from, $lte: req.query.to };
  if (req.query.dealer) f.dealerName = req.query.dealer;

  const role = req.user?.role;
  if (role === 'superadmin') {
    // Optional admin override
    if (req.query.salesman) f.salesman = req.query.salesman;
    return f;
  }

  // Load the user's data-access permissions from the DB.
  const User = (await import('../models/User.js')).default;
  const u = await User.findOne({ id: req.user.id }, 'permissions').lean();
  const p = u?.permissions || {};
  const hasStates   = Array.isArray(p.states)   && p.states.length   > 0;
  const hasCities   = Array.isArray(p.cities)   && p.cities.length   > 0;
  const hasZones    = Array.isArray(p.zones)    && p.zones.length    > 0;
  const hasSalesmen = Array.isArray(p.salesmen) && p.salesmen.length > 0;

  if (hasStates || hasCities || hasZones || hasSalesmen) {
    // Resolve permitted dealer set by looking up dealers matching the
    // permission scope, then constrain the Sale aggregation to those
    // dealer names. Salesman/admin both go through this path when perms
    // are configured — perms are the source of truth.
    const Dealer = (await import('../models/Dealer.js')).default;
    const dealerFilt = {};
    const escape = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ciMatch = v => new RegExp('^\\s*' + escape(v) + '\\s*$', 'i');
    if (hasStates)   dealerFilt.state    = { $in: p.states.map(ciMatch) };
    if (hasCities)   dealerFilt.city     = { $in: p.cities.map(ciMatch) };
    if (hasZones)    dealerFilt.zone     = { $in: p.zones.map(ciMatch) };
    if (hasSalesmen) dealerFilt.salesman = { $in: p.salesmen };
    const permitted = await Dealer.find(dealerFilt, 'name').lean();
    const names = permitted.map(d => d.name);
    // If perms resolve to zero dealers (typo / mismatched state), short out.
    f.dealerName = names.length ? { $in: names } : { $in: ['__no_match__'] };
    if (hasSalesmen) f.salesman = { $in: p.salesmen };
    return f;
  }

  // No explicit permissions — fall back to role default.
  if (role === 'admin') {
    if (req.query.salesman) f.salesman = req.query.salesman;
  } else if (req.user?.id) {
    f.salesman = req.user.id;
  }
  return f;
}

// GET /api/sales/by-category   →  [{ category, subCategory, qty }] + grand total
router.get('/by-category', protect, async (req, res) => {
  const filter = await monthFilter(req);
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
  const filter = await monthFilter(req);
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
  const filter = await monthFilter(req);
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
  const filter = await monthFilter(req);
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

/* ----------------------------------------------------------------- *
 *  Per-(salesman × category × month) volume targets                  *
 *                                                                    *
 *  GET  /api/sales/targets?month=YYYY-MM   → [{salesmanId, category, target}]
 *  POST /api/sales/targets                 → upsert {salesmanId, category, month, target}
 *  POST /api/sales/targets/bulk            → array of upserts in one round-trip
 * ----------------------------------------------------------------- */
router.get('/targets', protect, async (req, res) => {
  const month = normMonth(req.query.month) || String(req.query.month || '');
  const filter = month ? { month } : {};
  const rows = await SalesTarget.find(filter).lean();
  res.json(rows);
});

router.post('/targets', protect, adminOnly, async (req, res) => {
  const { salesmanId, category, target } = req.body || {};
  const month = normMonth(req.body?.month) || String(req.body?.month || '');
  if (!salesmanId || !category || !month) {
    return res.status(400).json({ error: 'salesmanId, category, month required' });
  }
  const updated = await SalesTarget.findOneAndUpdate(
    { salesmanId, category, month },
    { $set: { target: Number(target) || 0, setBy: req.user?.name || req.user?.email || '' } },
    { new: true, upsert: true },
  );
  res.json(updated);
});

router.post('/targets/bulk', protect, adminOnly, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  let upserted = 0;
  for (const it of items) {
    const month = normMonth(it.month) || String(it.month || '');
    if (!it.salesmanId || !it.category || !month) continue;
    await SalesTarget.findOneAndUpdate(
      { salesmanId: it.salesmanId, category: it.category, month },
      { $set: { target: Number(it.target) || 0, setBy: req.user?.name || req.user?.email || '' } },
      { upsert: true },
    );
    upserted++;
  }
  res.json({ ok: true, upserted });
});

// DELETE /api/sales/month/:m  — admin only — wipe a month's sales
router.delete('/month/:m', protect, adminOnly, async (req, res) => {
  const month = normMonth(req.params.m);
  if (!month) return res.status(400).json({ error: 'bad month' });
  const r = await Sale.deleteMany({ month });
  res.json({ ok: true, deleted: r.deletedCount });
});

export default router;
