import crypto from 'crypto';
import XLSX from 'xlsx';
import mongoose from 'mongoose';
import { ColImport, ColImportRow, ColSnapshot, ColCycle } from '../models/index.js';
import { resolvePeriods, parsePeriodHeader, parseParty, normName, isNoiseParty, sortPeriods, todayYmd } from '../lib/periods.js';
import { toRupees } from '../lib/money.js';
import { getSetting } from '../lib/settings.js';
import { writeAudit } from '../lib/audit.js';
import { classify, computeTotal, applyRow, bindDealerIdentity } from './reconcile.js';

export const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

/** A date in the file name, if there is one ("Outstanding 2026-07-04.xlsx", "…04-07-2026…"). */
export function asOnFromFileName(name) {
  let m = /(\d{4})-(\d{2})-(\d{2})/.exec(name || '');
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /(\d{2})[-_.](\d{2})[-_.](\d{4})/.exec(name || '');
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return '';
}

/** Workbook → header row, party column, period columns and data rows. Pure apart from SheetJS. */
export function parseSheet(buffer, { asOn }) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('The file has no sheets');
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
  let hi = -1, partyCol = -1;
  for (let i = 0; i < Math.min(10, aoa.length); i++) {
    const pc = aoa[i].findIndex(c => typeof c === 'string' && /dealer|party|customer|ledger|name/i.test(c));
    if (pc >= 0) { hi = i; partyCol = pc; break; }
  }
  if (hi < 0) {
    let best = -1, bestN = 0;
    for (let i = 0; i < Math.min(10, aoa.length); i++) {
      const n = aoa[i].filter(c => parsePeriodHeader(c) && !(parsePeriodHeader(c) || {}).older).length;
      if (n > bestN) { bestN = n; best = i; }
    }
    if (best < 0 || bestN < 1) throw new Error('Could not find a header row with month columns');
    hi = best;
    partyCol = aoa[hi].findIndex(c => !parsePeriodHeader(c) && String(c ?? '').trim());
    if (partyCol < 0) partyCol = 0;
  }
  const headers = aoa[hi].map(c => c instanceof Date ? c : String(c ?? '').trim());
  const periods = resolvePeriods(headers, { asOn });
  const periodCols = [], ignored = [], seen = new Map();
  headers.forEach((h, idx) => {
    if (idx === partyCol) return;
    const label = h instanceof Date ? h.toISOString() : String(h);
    if (periods[idx]) {
      if (seen.has(periods[idx])) throw new Error(`Two columns resolve to the same month ${periods[idx]}: "${seen.get(periods[idx])}" and "${label}"`);
      seen.set(periods[idx], label);
      periodCols.push({ idx, period: periods[idx], raw: label });
    } else if (label.trim()) ignored.push(label);
  });
  if (!periodCols.length) throw new Error('No month columns recognised. Headers: ' + headers.map(String).filter(Boolean).join(', '));
  const rows = [];
  for (let i = hi + 1; i < aoa.length; i++) rows.push({ rowNo: i + 1, cells: aoa[i] });
  return { headers, partyCol, periodCols, rows, ignored, sheetName: wb.SheetNames[0] };
}

/** Bucket files are mostly zeros with isolated values; snapshot files are rows that do not fall. */
export function detectBalanceMode(rows) {
  let cells = 0, zeros = 0, mono = 0, multi = 0;
  for (const r of rows) {
    const vals = Object.entries(r.buckets).sort((a, b) => a[0] < b[0] ? -1 : 1).map(([, v]) => v);
    if (vals.length < 2) continue;
    multi++; cells += vals.length; zeros += vals.filter(v => v === 0).length;
    if (vals.every((v, i) => i === 0 || v >= vals[i - 1])) mono++;
  }
  if (!multi) return { mode: 'buckets', zeroRatio: null, monotoneRatio: null };
  const zeroRatio = zeros / cells, monotoneRatio = mono / multi;
  const mode = zeroRatio < 0.35 && monotoneRatio > 0.7 ? 'snapshot' : 'buckets';
  return { mode, zeroRatio: +zeroRatio.toFixed(2), monotoneRatio: +monotoneRatio.toFixed(2) };
}

async function dealerMaps() {
  const Dealer = mongoose.models.Dealer;
  const all = await Dealer.find({}, '_id name code aliases tallyGuid salesman').lean();
  const byCode = new Map(), byName = new Map(), byAlias = new Map(), byGuid = new Map();
  for (const d of all) {
    if (d.code) byCode.set(String(d.code).toUpperCase(), d);
    if (d.tallyGuid) byGuid.set(String(d.tallyGuid), d);
    const k = normName(d.name); if (k && !byName.has(k)) byName.set(k, d);
    for (const a of d.aliases || []) { const ak = normName(a); if (ak && !byAlias.has(ak)) byAlias.set(ak, d); }
  }
  return { byCode, byName, byAlias, byGuid, count: all.length };
}

export function matchParty({ code, name }, maps) {
  if (code && maps.byCode.has(code)) return { dealer: maps.byCode.get(code), method: 'code' };
  const k = normName(name);
  // A name is only trusted when the codes do not contradict it: a dealer
  // already bound to a different code is a different party that happens to
  // share the name (two branches of one firm).
  const agree = d => !code || !d.code || String(d.code).toUpperCase() === code;
  if (k && maps.byName.has(k) && agree(maps.byName.get(k))) return { dealer: maps.byName.get(k), method: 'name' };
  if (k && maps.byAlias.has(k) && agree(maps.byAlias.get(k))) return { dealer: maps.byAlias.get(k), method: 'alias' };
  return { dealer: null, method: 'none' };
}

/**
 * Receive a file: hash → duplicate check → parse → stage every row →
 * validate/normalise → match → detect mode. Writes only col_imports and
 * col_import_rows. Nothing about current state changes here.
 */
export async function stageFile({ buffer, fileName, size, source = 'excel', user, asOn = '', balanceMode = '' }) {
  const fileHash = sha256(buffer);
  const dup = await ColImport.findOne({ fileHash, status: 'APPLIED' }).lean();
  const base = { fileName, fileHash, fileSize: size, source, uploadedBy: user?.id || '', uploadedByName: user?.name || user?.id || '' };
  if (dup) {
    const rec = await ColImport.create({ ...base, status: 'DUPLICATE', duplicateOf: dup._id, asOn: dup.asOn, periods: dup.periods });
    return { duplicate: true, import: rec, duplicateOf: dup };
  }
  const statementDate = asOn || asOnFromFileName(fileName) || todayYmd();
  const parsed = parseSheet(buffer, { asOn: statementDate });
  const periods = sortPeriods([...new Set(parsed.periodCols.map(c => c.period))]);
  const imp = await ColImport.create({ ...base, status: 'STAGED', asOn: statementDate, periods, stats: { rows: parsed.rows.length } });

  const maps = await dealerMaps();
  const staged = []; const groups = new Map(); const errors = []; const claimed = new Map();
  for (const r of parsed.rows) {
    const rawParty = String(r.cells[parsed.partyCol] ?? '').trim();
    if (isNoiseParty(rawParty)) continue;
    const { name, code } = parseParty(rawParty);
    const buckets = {}; let rowErr = '';
    for (const c of parsed.periodCols) {
      const v = toRupees(r.cells[c.idx]);
      if (Number.isNaN(v)) { rowErr = `"${r.cells[c.idx]}" in ${c.raw} is not an amount`; break; }
      if (v < 0) { rowErr = `${c.raw} is negative (${v}); credit balances are not receivables`; break; }
      buckets[c.period] = v;
    }
    const total = computeTotal(buckets, 'buckets');
    const doc = { importId: imp._id, rowNo: r.rowNo, rawParty, partyName: name || rawParty, code, buckets, total, status: 'OK', matchedDealerId: null, matchMethod: 'none', error: '' };
    if (rowErr) { doc.status = 'ERROR'; doc.error = rowErr; errors.push({ row: r.rowNo, message: rowErr }); }
    else {
      const m = matchParty({ code, name: name || rawParty }, maps);
      if (m.dealer) {
        // Two rows of one file must never collapse onto one dealer.
        const prior = claimed.get(String(m.dealer._id));
        if (prior && prior.code !== code) { doc.status = 'UNMAPPED'; doc.error = `row ${prior.rowNo} (${prior.rawParty}) already matched ${m.dealer.name}; this row's code differs`; }
        else { doc.matchedDealerId = m.dealer._id; doc.matchMethod = m.method; if (!prior) claimed.set(String(m.dealer._id), { rowNo: r.rowNo, rawParty, code }); }
      } else doc.status = 'UNMAPPED';
    }
    const key = code ? 'c:' + code : 'n:' + normName(name || rawParty);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(doc);
    staged.push(doc);
  }
  // The same party twice in one file: neither row is trusted, both are shown.
  let duplicatesInFile = 0;
  for (const g of groups.values()) if (g.length > 1) for (const d of g) { d.status = 'DUPLICATE'; d.error = `appears ${g.length} times in the file`; duplicatesInFile++; }
  for (let i = 0; i < staged.length; i += 1000) await ColImportRow.insertMany(staged.slice(i, i + 1000), { ordered: false });

  const okRows = staged.filter(d => d.status === 'OK' || d.status === 'UNMAPPED');
  const det = detectBalanceMode(okRows);
  imp.balanceModeDetected = det.mode;
  // Explicit choice, else what the file itself shows, else the setting. The
  // setting is a tie-breaker for files that give nothing away, never an
  // override: a running-balance file read as bills-per-month triples every
  // figure, which is exactly what happened when the default came first.
  imp.balanceMode = balanceMode || det.mode || (await getSetting('collections.balanceModeDefault'));
  imp.status = 'VALIDATED';
  Object.assign(imp.stats, {
    rows: staged.length, parties: groups.size,
    matched: staged.filter(d => d.status === 'OK').length,
    unmapped: staged.filter(d => d.status === 'UNMAPPED').length,
    errors: errors.length, duplicatesInFile,
  });
  imp.errorReport = errors.slice(0, 500);
  await imp.save();
  await writeAudit({ entity: 'import', entityId: imp._id, action: 'staged', after: { fileName, asOn: statementDate, periods, ...imp.stats }, by: user?.id, source: 'import', importId: imp._id });
  return { duplicate: false, import: imp, detection: det, ignoredColumns: parsed.ignored, dealersInMaster: maps.count };
}

/** The comparison shown before anyone confirms. Reads only; updates the import's stats. */
export async function buildPreview(importId) {
  const imp = await ColImport.findById(importId);
  if (!imp) throw new Error('Import not found');
  const rows = await ColImportRow.find({ importId: imp._id }).sort({ rowNo: 1 }).lean();
  const ok = rows.filter(r => r.status === 'OK' && r.matchedDealerId);
  const ids = ok.map(r => r.matchedDealerId);
  const Dealer = mongoose.models.Dealer;
  const dealers = new Map((await Dealer.find({ _id: { $in: ids } }, 'name code salesman').lean()).map(d => [String(d._id), d]));

  const prevAgg = await ColSnapshot.aggregate([
    { $match: { dealerId: { $in: ids }, source: imp.source, superseded: false, asOn: { $lt: imp.asOn } } },
    { $sort: { asOn: -1, createdAt: -1 } },
    { $group: { _id: '$dealerId', total: { $first: '$total' }, asOn: { $first: '$asOn' } } }]);
  const prev = new Map(prevAgg.map(p => [String(p._id), p]));
  const laterAgg = await ColSnapshot.aggregate([
    { $match: { dealerId: { $in: ids }, source: imp.source, superseded: false, asOn: { $gt: imp.asOn } } },
    { $group: { _id: '$dealerId', asOn: { $max: '$asOn' } } }]);
  const later = new Map(laterAgg.map(p => [String(p._id), p.asOn]));
  const cycAgg = await ColCycle.aggregate([{ $match: { dealerId: { $in: ids } } }, { $sort: { cycleNo: -1 } }, { $group: { _id: '$dealerId', status: { $first: '$status' } } }]);
  const cyc = new Map(cycAgg.map(c => [String(c._id), c.status]));

  const st = { new: 0, increased: 0, decreased: 0, cleared: 0, unchanged: 0, reopened: 0, totalBefore: 0, totalAfter: 0 };
  const changes = [];
  for (const r of ok) {
    const k = String(r.matchedDealerId);
    const buckets = r.buckets instanceof Map ? Object.fromEntries(r.buckets) : (r.buckets || {});
    const total = computeTotal(buckets, imp.balanceMode);
    const p = prev.get(k);
    const cls = classify({ prevExists: !!p, prevTotal: p?.total, curTotal: total, priorCycleStatus: cyc.get(k) });
    st[cls.toLowerCase()]++; st.totalBefore += p?.total || 0; st.totalAfter += total;
    if (cls !== 'UNCHANGED') changes.push({ rowNo: r.rowNo, dealerId: k, dealer: dealers.get(k)?.name || r.partyName, code: r.code, before: p?.total ?? null, after: total, delta: total - (p?.total || 0), classification: cls, matchMethod: r.matchMethod });
  }
  changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  Object.assign(imp.stats, st);
  if (imp.status === 'VALIDATED') imp.status = 'PREVIEWED';
  await imp.save();
  return {
    import: imp.toObject(),
    topChanges: changes.slice(0, 100), changedRows: changes.length,
    unmapped: rows.filter(r => r.status === 'UNMAPPED').map(r => ({ rowNo: r.rowNo, rawParty: r.rawParty, partyName: r.partyName, code: r.code, total: r.total })).slice(0, 500),
    errors: rows.filter(r => r.status === 'ERROR').map(r => ({ rowNo: r.rowNo, rawParty: r.rawParty, message: r.error })).slice(0, 500),
    duplicatesInFile: rows.filter(r => r.status === 'DUPLICATE').map(r => ({ rowNo: r.rowNo, rawParty: r.rawParty, code: r.code, total: r.total })),
    olderThanLatest: later.size, willBindCodes: ok.filter(r => r.code && !dealers.get(String(r.matchedDealerId))?.code).length,
  };
}

/** Map an unmapped row to a dealer by hand. If the import is already applied, the row applies now. */
export async function mapUnmappedRow(importId, rowNo, dealerId, { by }) {
  const imp = await ColImport.findById(importId);
  if (!imp) throw new Error('Import not found');
  const row = await ColImportRow.findOne({ importId: imp._id, rowNo });
  if (!row) throw new Error('Row not found');
  if (row.status !== 'UNMAPPED') throw new Error(`Row ${rowNo} is ${row.status}, not unmapped`);
  const Dealer = mongoose.models.Dealer;
  const dealer = await Dealer.findById(dealerId, 'name code aliases salesman').lean();
  if (!dealer) throw new Error('Dealer not found');
  const bind = await bindDealerIdentity(row.toObject(), dealer, { by, importId: imp._id });
  if (bind.conflict) throw new Error(bind.conflict);
  row.matchedDealerId = dealer._id; row.matchMethod = 'manual'; row.status = 'OK';
  await row.save();
  await ColImport.updateOne({ _id: imp._id }, { $inc: { 'stats.matched': 1, 'stats.unmapped': -1 } });
  await writeAudit({ entity: 'import-row', entityId: `${imp._id}:${rowNo}`, action: 'mapped', after: { rawParty: row.rawParty, dealer: dealer.name }, by, source: 'ui', importId: imp._id });
  let applied = null;
  if (imp.status === 'APPLIED') applied = await applyRow(imp, row.toObject(), dealer, { by });
  return { row: row.toObject(), applied };
}

/**
 * An unmapped party that is genuinely not in the Dealer master yet: create
 * the dealer (name + code from the statement) and map the row to it. The
 * salesman is whoever the caller says; the master requires one.
 */
export async function createDealerFromRow(importId, rowNo, { salesman = 'none', by }) {
  const row = await ColImportRow.findOne({ importId, rowNo });
  if (!row) throw new Error('Row not found');
  if (row.status !== 'UNMAPPED') throw new Error(`Row ${rowNo} is ${row.status}, not unmapped`);
  const Dealer = mongoose.models.Dealer;
  if (row.code && await Dealer.exists({ code: row.code })) throw new Error(`Code ${row.code} already belongs to a dealer — map the row instead`);
  let name = row.partyName || row.rawParty;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sameName = await Dealer.findOne({ name: new RegExp('^' + esc(name) + '$', 'i') }, 'name code').lean();
  if (sameName) {
    // Same name, no code on either side: it is the same party — map, do not duplicate.
    if (!row.code || !sameName.code) throw new Error(`A dealer named "${name}" already exists — map the row instead`);
    // Same name, different codes: a second branch. The rest of the
    // application joins on dealer name, so the new one is made distinct.
    name = `${name} (${row.code})`;
  }
  const dealer = await Dealer.create({ name, code: row.code || '', aliases: name !== (row.partyName || row.rawParty) ? [row.partyName || row.rawParty] : [], salesman, status: 'ACTIVE', source: 'collections' });
  await writeAudit({ entity: 'dealer', entityId: dealer._id, action: 'created-from-statement', after: { name, code: row.code, salesman }, by, source: 'import', importId });
  return mapUnmappedRow(importId, rowNo, dealer._id, { by });
}
