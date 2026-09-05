/**
 * sheetStyle.js — one look for every spreadsheet the app hands out.
 *
 * A 30-column export is unreadable as a flat grid: you lose which column you
 * are in two screens down, and you cannot tell a field you may edit from one
 * the app calculates. So every sheet gets the same treatment — a coloured
 * band naming each group of columns, a frozen header, filter arrows, grey for
 * read-only, and right-aligned numbers.
 *
 * Callers supply the data; this file owns the appearance.
 */

export const PALETTE = {
  dealer:  '1F3A5F', dealerLite:  'DCE4EE',   // navy   — identity / master fields
  catA:    '2A6F97', catALite:    'DAE8F0',   // blue   — first data group
  catB:    '468FAF', catBLite:    'E3EFF4',   // teal   — alternating group
  total:   'B45309', totalLite:   'FBE8D3',   // amber  — totals
  calc:    '5B6472', calcLite:    'E4E7EB',   // grey   — app-calculated
  readonly:'F1F2F4', zebra:       'FAFBFC', line: 'C9D1DA',
};

const TONES = {
  dealer: [PALETTE.dealer, PALETTE.dealerLite],
  a:      [PALETTE.catA,   PALETTE.catALite],
  b:      [PALETTE.catB,   PALETTE.catBLite],
  total:  [PALETTE.total,  PALETTE.totalLite],
  calc:   [PALETTE.calc,   PALETTE.calcLite],
};

/**
 * Paint a worksheet that already has its two header rows and data in place.
 *
 * groups    [{ label, span, tone }]  — row 1 bands, in column order
 * headers   string[]                 — row 2, one per column
 * readonly  Set<number>              — 1-based columns the app owns
 * numCols   Set<number>              — 1-based columns to format as numbers
 * freeze    { rows, cols }           — panes to freeze
 */
export function paintSheet(ws, { groups, headers, readonly = new Set(), numCols = new Set(), freeze = { rows: 2, cols: 1 }, firstDataRow = 3 }) {
  const n = headers.length;
  const toneAt = [];
  groups.forEach(g => { for (let i = 0; i < g.span; i++) toneAt.push(TONES[g.tone] || TONES.a); });
  while (toneAt.length < n) toneAt.push(TONES.a);

  const edge = { style: 'thin', color: { argb: 'FF' + PALETTE.line } };
  const r1 = ws.getRow(1), r2 = ws.getRow(2);
  r1.height = 22; r2.height = 30;
  for (let c = 1; c <= n; c++) {
    const [strong, lite] = toneAt[c - 1];
    const a = r1.getCell(c), b = r2.getCell(c);
    a.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + strong } };
    a.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    a.alignment = { horizontal: 'center', vertical: 'middle' };
    a.border = { top: edge, left: edge, bottom: edge, right: edge };
    b.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + lite } };
    b.font = { bold: true, size: 10, color: { argb: 'FF1F2937' }, italic: readonly.has(c) };
    b.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    b.border = { top: edge, left: edge, bottom: edge, right: edge };
  }

  // merge each band across its own columns
  let at = 1;
  for (const g of groups) {
    if (g.span > 1) ws.mergeCells(1, at, 1, at + g.span - 1);
    at += g.span;
  }

  for (let r = firstDataRow; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    row.height = 16;
    const zebra = r % 2 === 1;
    for (let c = 1; c <= n; c++) {
      const cell = row.getCell(c);
      const ro = readonly.has(c);
      if (ro)         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.readonly } };
      else if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.zebra } };
      cell.font = ro ? { color: { argb: 'FF6B7280' }, italic: true, size: 10 } : { size: 10 };
      if (numCols.has(c)) { cell.numFmt = '#,##0'; cell.alignment = { horizontal: 'right' }; }
    }
  }

  ws.views = [{ state: 'frozen', xSplit: freeze.cols, ySplit: freeze.rows }];
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: n } };
}
