import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Sale from '../models/Sale.js';
import Category from '../models/Category.js';
import Dealer from '../models/Dealer.js';
import SalesTarget from '../models/SalesTarget.js';
import { protect, adminOnly, superAdminOnly, requireFeature } from '../middleware/auth.js';
import { todayStr } from '../lib/commitments.js';
import ExcelJS from 'exceljs';
import { normalizeAccountStatus, ACCOUNT_STATUSES } from '../lib/accountStatus.js';

// Mirrors DEALER_TYPES in client/src/constants.js — the only values the
// Dealer Type dropdown offers, and so the only ones the sheet may set.
const DEALER_TYPES = ['None', 'Regular Dealer', 'Premium Dealer', 'OEM/SEMI OEM', 'ENTERPRISE'];

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
  //
  // The FIRST column is "Dealer ID" — a stable handle the upload uses as the
  // canonical identifier. As long as that cell is left alone the user can edit
  // Dealer Name, Salesman, City, etc. and the upload UPDATES the same dealer in
  // place. New rows leave Dealer ID blank — the parser falls back to
  // (name|salesman) lookup-or-create for those.
  const DEALER_HEADERS = [
    'Dealer ID',
    'Dealer Name', 'Salesman', 'Dealer Type', 'City', 'State', 'Zone',
    // The app's two status fields, side by side and named as the UI names them:
    // Selected User is the one a person picks, Performance is the tier the app
    // works out for itself — carried here to read against it, and ignored on
    // the way back in like the rest of the (auto) columns.
    'Selected User', 'Performance (auto)',
    'Address', 'Pincode',
    'Target', 'Achieved', 'Credit Days', 'Credit Limit',
  ];
  const N_DEALER = DEALER_HEADERS.length;   // 15

  // Trailing read-only block, derived by the app (see lib/accountStatus.js).
  // Re-uploading these would fight the recompute, so the parser ignores every
  // header ending in "(auto)". They ride along so a downloaded sheet is a
  // complete picture of the dealer rather than a partial one.
  const CALC_HEADERS = ['Perf Qty (auto)', 'Perf Month (auto)', 'Avg 6M (auto)'];

  const HEADERS = [...DEALER_HEADERS, ...subCols.map(c => c.sub), 'Grand Total', ...CALC_HEADERS];
  const GT_COL  = N_DEALER + subCols.length + 1;          // 1-based Grand Total
  // Columns a person must not type into: Dealer ID, anything "(auto)", Grand Total.
  const READONLY = new Set([1, GT_COL, ...HEADERS.map((h, i) => /\(auto\)$/i.test(h) ? i + 1 : 0).filter(Boolean)]);

  /* ── palette ─────────────────────────────────────────────────────────
     Section bands in row 1, a lighter tint of the same hue in row 2, so a
     35-column sheet reads as four blocks instead of one wall of headings. */
  const C = {
    dealer:  '1F3A5F', dealerLite:  'DCE4EE',
    catA:    '2A6F97', catALite:    'DAE8F0',
    catB:    '468FAF', catBLite:    'E3EFF4',
    total:   'B45309', totalLite:   'FBE8D3',
    calc:    '5B6472', calcLite:    'E4E7EB',
    readonly:'F1F2F4', zebra:       'FAFBFC', line: 'C9D1DA',
  };
  const wb2 = new ExcelJS.Workbook();
  wb2.creator = 'Sales Tracker Pro';
  wb2.created = new Date();

  /* ── Instructions ─────────────────────────────────────────────────── */
  const ins = wb2.addWorksheet('Instructions', { properties: { defaultRowHeight: 16 } });
  ins.columns = [{ width: 118 }];
  const H1 = t => { const r = ins.addRow([t]); r.font = { bold: true, size: 14, color: { argb: 'FF' + C.dealer } }; r.height = 24; };
  const H2 = t => { const r = ins.addRow([t]); r.font = { bold: true, size: 11, color: { argb: 'FF' + C.catA } }; };
  const P  = t => { const r = ins.addRow([t]); r.alignment = { wrapText: true, vertical: 'top' }; };
  H1('Sales Upload Template' + (monthLabel ? ' — ' + monthLabel : ''));
  P('One sheet updates everything: dealer details, the month’s numbers, and category-wise sales.');
  P('');
  H2('How to use it');
  P('1.  Open the "Sales Data" sheet. Row 1 groups the columns, row 2 names them, row 3 onwards is one row per dealer.');
  P('2.  Change any cell in a white column. Add brand-new dealers on the empty rows at the bottom.');
  P('3.  Save the file, then click "Upload Filled Excel" back in Monthly Entry.');
  P('');
  H2('Grey columns are read-only');
  P('Dealer ID, Grand Total, and every column ending in "(auto)" are calculated by the app. They are shown so you can read them, but anything you type into them is ignored on upload.');
  P('Dealer ID especially: that is how a dealer is recognised when you rename or reassign it. Leave it blank only when adding a new dealer.');
  P('');
  H2('Columns you can change');
  P('Dealer Name, Salesman, Dealer Type, City, State, Zone, Selected User, Address, Pincode, Target, Achieved, Credit Days, Credit Limit — and a quantity cell for every Product Type.');
  P('');
  H2('Values that must match');
  P('Dealer Type   —  ' + DEALER_TYPES.join('  /  ') + '.  Anything else is skipped and reported back.');
  P('Selected User —  ' + ACCOUNT_STATUSES.join('  /  ') + '.  Any other word leaves that dealer unchanged rather than resetting it (older records still hold words like ACTIVE or DEAD here).');
  P('Both columns have a drop-down, so you can pick instead of typing.');
  P('');
  H2('Good to know');
  P('Grand Total adds up the quantity cells for you.');
  P('Re-uploading the same month replaces that month’s category sales cleanly — it does not double them.');
  P('New categories or product types added under Admin Panel → Categories appear the next time you download this template.');

  /* ── Sales Data ───────────────────────────────────────────────────── */
  const ws = wb2.addWorksheet('Sales Data', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 2 }],   // headers + Dealer Name stay put
  });

  // Row 1 — section bands. Each category spans its own sub-category columns.
  const row1 = new Array(HEADERS.length).fill('');
  row1[0] = 'Dealer Info';
  row1[N_DEALER + subCols.length] = 'Total';
  if (CALC_HEADERS.length) row1[GT_COL] = 'Calculated';
  subCols.forEach((c, i) => { if (i === 0 || c.category !== subCols[i - 1].category) row1[N_DEALER + i] = c.category; });
  ws.addRow(row1);
  ws.addRow(HEADERS);

  // Data
  let prefillCount = 0;
  if (prefill) {
    const filt = {};
    if (filterSm) filt.salesman = filterSm;
    const dealers = await Dealer.find(filt).sort({ name: 1 }).lean();

    // Existing Sale rows for THIS month, so each (dealer × sub-category) cell
    // pre-fills with the saved quantity and the user edits from the real number.
    const monthYM = normMonth(monthLabel);
    const saleByDealerSub = new Map();
    const saleByDealer    = new Map();
    if (monthYM) {
      const sales = await Sale.find({ month: monthYM }, { dealerName: 1, subCategory: 1, qty: 1 }).lean();
      for (const s of sales) {
        const dk  = String(s.dealerName || '').toLowerCase().trim();
        const key = dk + '||' + String(s.subCategory || '').toLowerCase().trim();
        saleByDealerSub.set(key, (saleByDealerSub.get(key) || 0) + (s.qty || 0));
        saleByDealer.set(dk, (saleByDealer.get(dk) || 0) + (s.qty || 0));
      }
    }

    for (const d of dealers) {
      const md = (d.monthlyData && d.monthlyData[monthLabel]) || {};
      const nameKey = String(d.name || '').toLowerCase().trim();
      const subCells = subCols.map(c => {
        const q = saleByDealerSub.get(nameKey + '||' + String(c.sub).toLowerCase().trim());
        return q ? Number(q) : null;
      });
      ws.addRow([
        String(d._id || ''),                // Dealer ID — read-only handle
        d.name || '',
        d.salesman || '',
        d.dealerType || 'None',
        // Master fields come from the dealer record, not monthlyData: that is a
        // per-month snapshot which drifts, and re-uploading it wrote stale
        // values back over corrections.
        d.city  || md.city  || '',
        d.state || md.state || '',
        d.zone  || md.zone  || '',
        d.status || md.status || '',
        d.perfStatus || 'NEW DEALER',
        d.address || '',
        d.pincode || '',
        Number(md.target || d.target || 0),           // target really is per-month
        // From the Sale rows, same source as the quantity cells beside it, so
        // Achieved always agrees with Grand Total. monthlyData is only a
        // fallback for a month typed by hand with no category breakdown.
        Number(saleByDealer.get(nameKey) || md.achieved || 0),
        Number(d.creditDays  || md.creditDays  || 0),
        Number(d.creditLimit || md.creditLimit || 0),
        ...subCells,
        null,                                          // Grand Total — formula below
        Number(d.perfQty || 0),
        d.perfMonth || '',
        Number(d.avg6m || 0),
      ]);
      prefillCount++;
    }
  }
  // Room to type new dealers
  for (let i = 0; i < 8; i++) ws.addRow(new Array(HEADERS.length).fill(null));

  const lastRow  = ws.rowCount;
  const firstSub = XLSX.utils.encode_col(N_DEALER);
  const lastSub  = XLSX.utils.encode_col(N_DEALER + subCols.length - 1);
  if (subCols.length) {
    for (let r = 3; r <= lastRow; r++) {
      ws.getCell(r, GT_COL).value = { formula: `SUM(${firstSub}${r}:${lastSub}${r})` };
    }
  }

  /* ── widths ───────────────────────────────────────────────────────── */
  const WIDTH = {
    'Dealer ID': 12, 'Dealer Name': 34, 'Salesman': 16, 'Dealer Type': 16,
    'City': 16, 'State': 15, 'Zone': 12, 'Selected User': 15,
    'Performance (auto)': 18, 'Address': 38, 'Pincode': 10, 'Target': 11,
    'Achieved': 11, 'Credit Days': 12, 'Credit Limit': 13, 'Grand Total': 13,
    'Perf Qty (auto)': 12, 'Perf Month (auto)': 14, 'Avg 6M (auto)': 11,
  };
  HEADERS.forEach((h, i) => { ws.getColumn(i + 1).width = WIDTH[h] ?? Math.max(11, Math.min(18, h.length + 3)); });
  ws.getColumn(1).hidden = true;                    // Dealer ID out of the way

  /* ── header styling ───────────────────────────────────────────────── */
  const bandOf = (i) => {                            // i is 0-based column index
    if (i < N_DEALER)              return [C.dealer, C.dealerLite];
    if (i < N_DEALER + subCols.length) {
      let n = 0;
      for (let k = 1; k <= i - N_DEALER; k++) if (subCols[k].category !== subCols[k - 1].category) n++;
      return n % 2 ? [C.catB, C.catBLite] : [C.catA, C.catALite];
    }
    if (i === N_DEALER + subCols.length) return [C.total, C.totalLite];
    return [C.calc, C.calcLite];
  };
  const r1 = ws.getRow(1), r2 = ws.getRow(2);
  r1.height = 22; r2.height = 30;
  HEADERS.forEach((h, i) => {
    const [strong, lite] = bandOf(i);
    const a = r1.getCell(i + 1), b = r2.getCell(i + 1);
    a.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + strong } };
    a.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    a.alignment = { horizontal: 'center', vertical: 'middle' };
    b.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + lite } };
    b.font = { bold: true, size: 10, color: { argb: 'FF1F2937' }, italic: READONLY.has(i + 1) };
    b.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    const edge = { style: 'thin', color: { argb: 'FF' + C.line } };
    a.border = { top: edge, left: edge, bottom: edge, right: edge };
    b.border = { top: edge, left: edge, bottom: edge, right: edge };
  });

  // merge each band in row 1
  const mergeRun = (from, to) => { if (to > from) ws.mergeCells(1, from + 1, 1, to + 1); };
  mergeRun(0, N_DEALER - 1);
  let runStart = N_DEALER;
  for (let i = 1; i < subCols.length; i++) {
    if (subCols[i].category !== subCols[i - 1].category) { mergeRun(runStart, N_DEALER + i - 1); runStart = N_DEALER + i; }
  }
  if (subCols.length) mergeRun(runStart, N_DEALER + subCols.length - 1);
  if (CALC_HEADERS.length) mergeRun(GT_COL, GT_COL + CALC_HEADERS.length - 1);

  /* ── body styling ─────────────────────────────────────────────────── */
  const numCols = new Set(HEADERS.map((h, i) =>
    (/^(Target|Achieved|Credit Days|Credit Limit|Grand Total|Perf Qty \(auto\)|Avg 6M \(auto\))$/.test(h)
      || (i >= N_DEALER && i < N_DEALER + subCols.length)) ? i + 1 : 0).filter(Boolean));
  for (let r = 3; r <= lastRow; r++) {
    const row = ws.getRow(r);
    row.height = 16;
    const zebra = r % 2 === 1;
    for (let c = 1; c <= HEADERS.length; c++) {
      const cell = row.getCell(c);
      const ro = READONLY.has(c);
      if (ro)          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.readonly } };
      else if (zebra)  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.zebra } };
      if (ro) cell.font = { color: { argb: 'FF6B7280' }, italic: true, size: 10 };
      else    cell.font = { size: 10 };
      if (numCols.has(c)) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right' }; }
    }
    row.getCell(2).font = { bold: true, size: 10 };                 // Dealer Name
    row.getCell(HEADERS.indexOf('Pincode') + 1).numFmt = '@';       // keep leading zeros
  }

  /* ── filter + drop-downs ──────────────────────────────────────────── */
  ws.autoFilter = { from: { row: 2, column: 2 }, to: { row: 2, column: HEADERS.length } };
  const listFor = (header, values) => {
    const c = XLSX.utils.encode_col(HEADERS.indexOf(header));
    ws.dataValidations.add(`${c}3:${c}${lastRow}`, {
      type: 'list', allowBlank: true, formulae: ['"' + values.join(',') + '"'],
      showErrorMessage: true, errorStyle: 'warning',
      errorTitle: 'Not a recognised value',
      error: 'Pick one of: ' + values.join(', ') + '. Anything else is skipped on upload.',
    });
  };
  // Excel list formulae are comma-separated, so a value containing a comma
  // would split into two entries — none of ours do, but guard anyway.
  listFor('Dealer Type',   DEALER_TYPES.filter(v => !v.includes(',')));
  listFor('Selected User', ACCOUNT_STATUSES.filter(v => !v.includes(',')));

  const buf = await wb2.xlsx.writeBuffer();
  const tag = monthLabel ? `_${monthLabel.replace(/[^A-Za-z0-9-]/g, '')}` : '';
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Sales_Upload_Template${tag}.xlsx"`);
  res.send(Buffer.from(buf));
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
      else if (/^dealer\s*type$/i.test(v))                                    role = 'dealerType';
      else if (/^city$/i.test(v))                                           role = 'city';
      else if (/^state$/i.test(v))                                          role = 'state';
      else if (/^zone$/i.test(v))                                           role = 'zone';
      else if (/^address$/i.test(v))                                        role = 'address';
      else if (/^pincode$|^pin\s*code$|^zip$/i.test(v))                     role = 'pincode';
      // 'Status' is what older downloaded sheets call this column.
      else if (/^status$|^selected\s*user$/i.test(v))                        role = 'status';
      else if (/^category\s*type$/i.test(v))                                role = 'ignore';   // legacy, dropped
      else if (/^sub\s*category$/i.test(v))                                 role = 'ignore';   // legacy, dropped
      else if (/^target$/i.test(v))                                         role = 'target';
      else if (/^achieved$/i.test(v))                                       role = 'achieved';
      else if (/^credit\s*days$/i.test(v))                                  role = 'creditDays';
      else if (/^credit\s*limit$/i.test(v))                                 role = 'creditLimit';
      else if (/grand\s*total|^total$|^achieved$/i.test(v))                 role = 'ignore';
      // Everything the app derives for itself. Exported so the sheet is a
      // complete picture, ignored here so an edited or stale cell can't
      // overwrite what the recompute owns.
      else if (/\(auto\)$/i.test(v))                                          role = 'ignore';
      else if (v && subToCat.has(lv))                                       role = 'subcat';
      else if (v)                                                           role = 'misc';
      return { idx, label: v, role };
    });

    const get = (row, role) => {
      const c = colInfo.find(x => x.role === role);
      return c ? row[c.idx] : undefined;
    };

    // Diagnostic: log every recognised column + specifically whether the
    // Address / Pincode / Achieved columns were found. Helps debug when a
    // user says "I filled address in Excel but it's not updating."
    const addressCol = colInfo.find(c => c.role === 'address');
    const pincodeCol = colInfo.find(c => c.role === 'pincode');
    console.log('[SALES UPLOAD] columns detected:',
      colInfo.filter(c => c.role !== 'ignore' && c.role !== 'subcat')
              .map(c => `${c.label}=>${c.role}`).join(', '));
    console.log(`[SALES UPLOAD] address col: ${addressCol ? `idx ${addressCol.idx} ("${addressCol.label}")` : 'NOT FOUND'}, pincode col: ${pincodeCol ? `idx ${pincodeCol.idx} ("${pincodeCol.label}")` : 'NOT FOUND'}`);

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
    const unknownSubs        = new Set();
    const unmatchedDealers   = new Set();
    // Values the sheet offered that the field would not accept. Reported back
    // rather than swallowed, so a bad cell is visible instead of silent.
    const unknownDealerTypes = new Set();
    const unknownStatuses    = new Set();
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
      if (hasCell('dealerType')) {
        // Only the five values the dropdown offers. An unrecognised word is
        // dropped rather than written, so a typo can't invent a new type.
        const dt  = String(get(row,'dealerType')||'').trim();
        const hit = DEALER_TYPES.find(t => t.toLowerCase() === dt.toLowerCase());
        if (hit) masterFields.dealerType = hit;
        else if (dt) unknownDealerTypes.add(dt);
      }
      if (hasCell('city'))        masterFields.city        = String(get(row,'city')||'').trim();
      if (hasCell('state'))       masterFields.state       = String(get(row,'state')||'').trim();
      if (hasCell('zone'))        masterFields.zone        = String(get(row,'zone')||'').trim();
      if (hasCell('address'))     masterFields.address     = String(get(row,'address')||'').trim();
      if (hasCell('pincode'))     masterFields.pincode     = String(get(row,'pincode')||'').trim();
      // Diagnostic — log the first 3 rows' address/pincode parsing so the
      // user can see whether the upload actually saw values in those columns.
      if (i - dataStartIdx < 3) {
        console.log(`[SALES UPLOAD] row ${i}: dealerName="${dealerName}" address="${masterFields.address ?? '(skipped)'}" pincode="${masterFields.pincode ?? '(skipped)'}"`);
      }
      // Potential Status only. The sheet's Status column carries words like
      // ACTIVE / DEAD, which are calculated answers now — writing them onto the
      // dealer refilled the field we cleared (884 dealers, twice).
      if (hasCell('status')) {
        // normalizeAccountStatus() maps anything it doesn't recognise to NONE.
        // 886 dealers still carry legacy performance words (ACTIVE, DEAD,
        // INACTIVE) in this field, so applying that blindly wiped them on a
        // round-trip the user never edited. Write only a value the field
        // actually accepts; leave anything else exactly as it was.
        const rawStatus = String(get(row,'status')||'').trim();
        const normed    = normalizeAccountStatus(rawStatus);
        if (normed !== 'NONE' || /^none$/i.test(rawStatus)) masterFields.status = normed;
        else unknownStatuses.add(rawStatus);
      }
      if (hasCell('target')      && numCell('target')      !== null) masterFields.target      = numCell('target');
      if (hasCell('creditDays')  && numCell('creditDays')  !== null) masterFields.creditDays  = numCell('creditDays');
      if (hasCell('creditLimit') && numCell('creditLimit') !== null) masterFields.creditLimit = numCell('creditLimit');
      // "Achieved" column — user-entered total for the month. Overrides the
      // sub-category sum when the user only fills the total (no breakdown).
      const achievedCellRaw = hasCell('achieved') ? numCell('achieved') : null;

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
          // dealerType is absent on older records and renders as 'None'
          // everywhere, so treat the two as the same value rather than
          // writing 'None' to 571 dealers on every round-trip.
          const cur = k === 'dealerType' ? (dealerDoc[k] || 'None') : dealerDoc[k];
          if (cur !== v) updates[k] = v;
        }

        // Per-month write (only when monthLabel was provided)
        if (monthLabel) {
          const md = dealerDoc.monthlyData instanceof Map
            ? Object.fromEntries(dealerDoc.monthlyData)
            : (dealerDoc.monthlyData || {});
          const prev = md[monthLabel] || {};
          // Achieved priority:
          //   1. Sub-category sum (rowAchieved) — most precise when the user
          //      filled category-level columns.
          //   2. Explicit "Achieved" column value — when the user only wants
          //      to update the month total without a breakdown.
          //   3. Previously stored value — if neither is provided this row
          //      just leaves the achieved as it was.
          const finalAchieved = rowAchieved > 0
            ? rowAchieved
            : (achievedCellRaw !== null ? achievedCellRaw : (prev.achieved || 0));
          const entry = {
            achieved:    finalAchieved,
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
            // Diagnostic: show address/pincode inside the first few updates
            // so we can prove whether they're reaching Mongoose or not.
            if (i - dataStartIdx < 3 && ('address' in updates || 'pincode' in updates)) {
              console.log(`[SALES UPLOAD] row ${i} → $set:`, JSON.stringify({
                address: updates.address, pincode: updates.pincode
              }));
            }
            // strict:false so Mongoose can't drop fields even if the schema
            // was loaded before address/pincode were added (fresh restarts
            // don't have this issue, but old process instances would).
            await Dealer.updateOne(
              { _id: dealerDoc._id },
              { $set: updates },
              { strict: false, runValidators: false }
            );
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

    // Type 1 status is derived from these rows, so it is stale the moment an
    // upload lands. Recompute here rather than leaving it to someone to
    // remember. Never let it fail the upload — the rows are already saved.
    let statusRecount = null;
    try {
      const { TIER_CATEGORIES, perfStatusFor } = await import('../lib/accountStatus.js');
      const months = (await Sale.distinct('month')).filter(Boolean).sort();
      const agg = await Sale.aggregate([
        { $match: { category: { $in: TIER_CATEGORIES } } },
        { $group: { _id: { d: '$dealerName', m: '$month' }, qty: { $sum: '$qty' } } },
      ]);
      const byDealer = {};
      agg.forEach(r => { (byDealer[r._id.d] ||= {})[r._id.m] = r.qty; });
      const all = await Dealer.find({}, 'name perfStatus').lean();
      const latest = months.at(-1);
      const ops = all.map(d => {
        const q = byDealer[d.name] || {};
        return { updateOne: { filter: { _id: d._id }, update: { $set: {
          perfStatus: perfStatusFor(q, months),
          perfQty: Number(q[latest]) || 0,
          perfMonth: latest,
        } } } };
      });
      if (ops.length) await Dealer.bulkWrite(ops, { ordered: false });
      statusRecount = ops.length;
    } catch (e) {
      console.warn('[SALES/upload] status recompute skipped:', e.message);
    }

    res.json({
      ok: true,
      statusRecomputed: statusRecount,
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
      skippedDealerTypes:  [...unknownDealerTypes].slice(0, 20),
      skippedStatuses:     [...unknownStatuses].slice(0, 20),
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

  // A salesman's scope is their own book, full stop — settled before any
  // permission lookup so no territory grant widens or narrows it.
  // See dealers.js dealerScope().
  if (req.user?.role === 'salesman') { f.salesman = req.user.id; return f; }

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
  if (role === 'admin' || role === 'employee') {
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

// GET /api/sales/brand-detail?brand=VN-TEX  →  who actually bought it.
// Returns the dealers behind one transaction category, each with the
// salesman who owns them, plus a per-salesman roll-up. Fetched on demand
// when a collection is expanded, rather than loading it for all 41 up front.
// Salesman is stored as the user id ("rakesh"), so it is resolved to the
// display name here — the client should not have to know that.
router.get('/brand-detail', protect, async (req, res) => {
  const brand = String(req.query.brand || '').trim();
  if (!brand) return res.status(400).json({ error: 'brand required' });

  const filter = { ...(await monthFilter(req)), brand };
  const rows = await Sale.aggregate([
    { $match: filter },
    { $group: {
        _id: { dealer: '$dealerName', salesman: '$salesman' },
        qty: { $sum: '$qty' },
        categories: { $addToSet: '$category' },
    } },
    { $project: { _id: 0, dealer: '$_id.dealer', salesman: '$_id.salesman', qty: 1, categories: 1 } },
    { $sort: { qty: -1 } },
    { $limit: 500 },
  ]);

  // id -> display name
  const User = (await import('../models/User.js')).default;
  const users = await User.find({}, 'id name').lean();
  const nameById = new Map(users.map(u => [u.id, u.name]));
  const label = id => nameById.get(id) || id || '—';

  const dealers = rows.map(r => ({ ...r, salesmanName: label(r.salesman) }));

  const bySalesman = new Map();
  for (const r of dealers) {
    const k = r.salesmanName;
    const e = bySalesman.get(k) || { salesman: k, qty: 0, dealers: 0 };
    e.qty += r.qty; e.dealers += 1;
    bySalesman.set(k, e);
  }

  res.json({
    ok: true, brand,
    dealers,
    salesmen: [...bySalesman.values()].sort((a, b) => b.qty - a.qty),
    total: dealers.reduce((a, r) => a + r.qty, 0),
  });
});

/**
 * Classify each catalogue by the master's Parent Product column.
 *
 *   ProductId === Parent Product  ->  parent row
 *   ProductId !== Parent Product  ->  child row
 *
 * A catalogue is a CHILD catalogue only when it has NO parent rows at all.
 * "At least one child row" is too loose: FABRIC(0.8MM) has 48 parent rows and
 * a single child, EURO 197 and one — those are parent catalogues with a stray
 * variant, and letting them through defeats the point of the filter.
 * Overview shows child catalogues only; parents stay in the data and are
 * merely hidden from the panel.
 *
 * Returns { child:Set, parent:Set }. With no master loaded nothing can be
 * classified, so both are empty and the panel filters nothing: a report must
 * never hide sales just because the catalogue is unknown to it.
 */
let _catKindCache = { at: 0, child: new Set(), parent: new Set() };
async function catalogueKinds() {
  if (Date.now() - _catKindCache.at < 60_000) return _catKindCache;
  const ProductMaster = (await import('../models/ProductMaster.js')).default;
  if (!(await ProductMaster.countDocuments())) {
    _catKindCache = { at: Date.now(), child: new Set(), parent: new Set() };
    return _catKindCache;
  }
  const rows = await ProductMaster.aggregate([
    { $match: { brand: { $nin: ['', null] } } },
    { $group: {
        _id: '$brand',
        parents:  { $sum: { $cond: ['$isParent', 1, 0] } },
        children: { $sum: { $cond: ['$isParent', 0, 1] } },
    } },
  ]);
  const child = new Set(), parent = new Set();
  for (const r of rows) {
    if (r.parents === 0 && r.children > 0) child.add(r._id);
    else parent.add(r._id);
  }
  _catKindCache = { at: Date.now(), child, parent };
  return _catKindCache;
}

// GET /api/sales/by-brand  →  sales grouped by the ERP transaction category
// ("VN-TEX", "PASTELO"). Only rows imported from a product-transaction
// export carry a brand; manually keyed rows report under "(not specified)".
// Honours the same month/salesman scoping as every other sales endpoint.
router.get('/by-brand', protect, async (req, res) => {
  const base = await monthFilter(req);

  // Optional category narrowing ("which catalogues sit inside LAMINATE?").
  // The quantities then describe THAT category only, not the catalogue's
  // whole book — which is the question being asked.
  const wanted = String(req.query.category || '')
    .split(',').map(x => x.trim()).filter(Boolean);
  const filter = wanted.length ? { ...base, category: { $in: wanted } } : base;

  // The chip list is built from the month unfiltered, so picking one category
  // never removes the others from the picker.
  const catTotals = await Sale.aggregate([
    { $match: base },
    { $group: { _id: '$category', qty: { $sum: '$qty' } } },
    { $sort: { qty: -1 } },
  ]);

  const rows = await Sale.aggregate([
    { $match: filter },
    { $group: {
        _id: { brand: '$brand', category: '$category' },
        qty: { $sum: '$qty' },
        dealers: { $addToSet: '$dealerName' },
    } },
    { $project: {
        _id: 0, brand: '$_id.brand', category: '$_id.category',
        qty: 1, dealers: { $size: '$dealers' },
    } },
    { $sort: { qty: -1 } },
  ]);
  // Collapse to one entry per brand, keeping the category split underneath.
  const byBrand = new Map();
  for (const r of rows) {
    const key = r.brand || '';
    const e = byBrand.get(key) || { brand: key, qty: 0, categories: [], dealers: 0 };
    e.qty += r.qty;
    e.dealers = Math.max(e.dealers, r.dealers);
    e.categories.push({ category: r.category, qty: r.qty });
    byBrand.set(key, e);
  }
  let out = [...byBrand.values()].sort((a, b) => b.qty - a.qty);

  // Overview shows CHILD catalogues. Parent ones are set aside rather than
  // dropped: the caller is told what was hidden and can ask for it back.
  const kinds = await catalogueKinds();
  const active = kinds.child.size > 0 || kinds.parent.size > 0;
  const hidden = active ? out.filter(r => r.brand && !kinds.child.has(r.brand)) : [];
  if (String(req.query.showParent || '') !== '1' && hidden.length) {
    out = out.filter(r => r.brand && kinds.child.has(r.brand));
  }

  res.json({
    rows: out,
    grandTotal: out.reduce((a, r) => a + r.qty, 0),
    unbranded: byBrand.get('')?.qty || 0,
    categories: catTotals.filter(c => c._id).map(c => ({ category: c._id, qty: c.qty })),
    categoryFilter: wanted,
    hiddenParent: hidden.map(r => ({ brand: r.brand, qty: r.qty })),
    hiddenParentQty: hidden.reduce((a, r) => a + r.qty, 0),
    catalogueFilterActive: active,
  });
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

// GET /api/sales/by-dealer-months?exclude=cat1,cat2
// → {
//     byDealerMonth:        { "<dealer lower>": { "YYYY-MM": excludedQty } },
//     includedByDealerMonth:{ "<dealer lower>": { "YYYY-MM": includedQty } },
//     monthsWithCategoryData: ["2026-06", "2026-07", ...],
//   }
//
// The client needs all three to apply the category filter across the whole
// timeline:
//   • includedByDealerMonth is the authoritative per-dealer figure for any
//     month that HAS category data — using it directly (rather than
//     subtracting the excluded qty from the dealer's stored achieved) is what
//     makes every roll-up agree exactly with the Category-wise Sales panel.
//   • monthsWithCategoryData marks which months can be broken down at all.
//     Months from before the category feature went live have no Sale rows and
//     must be left at their stored achieved — they can't be split by category,
//     so they must not be zeroed.
//   • byDealerMonth (excluded qty) is retained for existing callers.
router.get('/by-dealer-months', protect, async (req, res) => {
  try {
    const exclude = String(req.query.exclude || '').split(',').map(s => s.trim()).filter(Boolean);
    const filter = await monthFilter(req);   // permission scope only (no ?month passed)
    const rows = await Sale.aggregate([
      { $match: filter },
      { $group: {
          _id: { dealer: '$dealerName', month: '$month', category: '$category' },
          qty: { $sum: '$qty' },
      }},
    ]);
    const excSet   = new Set(exclude);
    const excluded = {};
    const included = {};
    // Month → total included qty across EVERY dealer in the Sale data, not
    // just the ones that match a Dealer record. Roll-ups use this so a headline
    // total equals the Category-wise Sales panel exactly: rows whose
    // dealerName matches no dealer would otherwise be silently dropped.
    const includedTotalByMonth = {};
    const monthsWithCategoryData = new Set();
    for (const r of rows) {
      const d = String(r._id.dealer || '').toLowerCase().trim();
      if (!d) continue;
      const m = r._id.month;
      if (!m) continue;
      monthsWithCategoryData.add(m);
      const qty = r.qty || 0;
      const isExcluded = excSet.has(r._id.category);
      const bucket = isExcluded ? excluded : included;
      (bucket[d] = bucket[d] || {});
      bucket[d][m] = (bucket[d][m] || 0) + qty;
      if (!isExcluded) includedTotalByMonth[m] = (includedTotalByMonth[m] || 0) + qty;
    }
    res.json({
      byDealerMonth: excluded,
      includedByDealerMonth: included,
      includedTotalByMonth,
      monthsWithCategoryData: [...monthsWithCategoryData].sort(),
    });
  } catch(e) {
    console.error('[SALES/by-dealer-months]', e.message);
    res.status(500).json({ error: e.message });
  }
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
// ── GET /api/sales/daily ──────────────────────────────────────────────────
// Day-level movement, derived from Monthly Entry edits (see models/SalesDelta).
//
//   ?from=YYYY-MM-DD&to=YYYY-MM-DD   window (defaults to the last 60 days)
//   ?month=Aug-26                    only movement booked INTO that month
//   ?salesman=id                     one rep
//   ?includeUploads=1                include bulk uploads (excluded by default,
//                                    since one upload rewrites a whole month
//                                    and would read as a single enormous day)
//
// Returns { days:[{ dateStr, qty, entries, dealers }], total }.
router.get('/daily', protect, async (req, res) => {
  try {
    const SalesDelta = (await import('../models/SalesDelta.js')).default;
    const to   = String(req.query.to   || '').slice(0,10) || todayStr();
    const from = String(req.query.from || '').slice(0,10) ||
      new Date(Date.now() - 59*864e5).toISOString().slice(0,10);

    const q = { dateStr: { $gte: from, $lte: to } };
    if (req.query.month) q.month = String(req.query.month);
    if (String(req.query.includeUploads||'') !== '1') q.source = 'entry';

    // A salesman only ever sees their own movement; staff may narrow by rep.
    if (req.user?.role === 'salesman') q.salesman = req.user.id;
    else if (req.query.salesman)       q.salesman = String(req.query.salesman);

    const days = await SalesDelta.aggregate([
      { $match: q },
      { $group: { _id:'$dateStr', qty:{ $sum:'$delta' },
                  entries:{ $sum:1 }, dealers:{ $addToSet:'$dealerName' } } },
      { $project: { _id:0, dateStr:'$_id', qty:1, entries:1, dealers:{ $size:'$dealers' } } },
      { $sort: { dateStr:1 } },
    ]);
    res.json({ days, total: days.reduce((s,d)=>s+d.qty, 0), from, to });
  } catch (e) {
    console.error('[SALES/daily]', e.message);
    res.status(500).json({ error: e.message });
  }
});

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
