import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { ColBalance, ColSnapshot, ColCycle, ColPayment, ColFollowUp, ColPromise, ColTask, ColEmployeeActivity, ColEvent, ColInvoice, ColEmployeeReview } from '../models/index.js';
import { getSetting } from '../lib/settings.js';
import { todayYmd } from '../lib/periods.js';
/** A Map field is a Map on a document and a plain object after .lean(); either way, an object. */
const asObj = b => b instanceof Map ? Object.fromEntries(b) : (b && typeof b === 'object' ? b : {});

const Dealer = () => mongoose.models.Dealer;
const User = () => mongoose.models.User;
const names = async ids => new Map((await Dealer().find({ _id: { $in: ids } }, 'name code salesman').lean()).map(d => [String(d._id), d]));
const users = async () => new Map((await User().find({}, 'id name').lean()).map(u => [u.id, u.name]));

/** Each report is a {columns, rows} builder over the scope. Rows are plain arrays so export is one code path. */
export const REPORTS = {
  'current-outstanding': { label: 'Current Outstanding', async build(sf) {
    const rows = await ColBalance.find({ ...sf, total: { $gt: 0 } }).sort({ total: -1 }).lean(); const u = await users();
    return { columns: ['Dealer', 'Code', 'Salesman', 'Total', 'Oldest', 'Age days', 'Status', 'Priority', 'Next follow-up', 'Promise', 'Promise date', 'Last payment'],
      rows: rows.map(b => [b.dealerName, b.dealerCode, u.get(b.salesmanId) || b.salesmanId, b.total, b.oldestPeriod, b.ageDays, b.status, b.priority, b.nextFollowupAt, b.promise?.amount || '', b.promise?.date || '', b.lastPaymentAt ? b.lastPaymentAt.toISOString().slice(0, 10) : '']) }; } },
  'aging': { label: 'Ageing', async build(sf) {
    const edges = [0, ...(await getSetting('collections.agingBuckets')), Infinity];
    const rows = await ColBalance.find({ ...sf, total: { $gt: 0 } }).sort({ ageDays: -1 }).lean(); const u = await users();
    const band = a => { for (let i = 0; i < edges.length - 1; i++) { const lo = edges[i] + (i ? 1 : 0); if (a >= lo && a <= edges[i + 1]) return edges[i + 1] === Infinity ? `${lo}+` : `${lo}–${edges[i + 1]}`; } return 'unknown'; };
    return { columns: ['Dealer', 'Code', 'Salesman', 'Total', 'Age days', 'Band', ...Object.keys(rows[0]?.buckets ? Object.fromEntries(rows[0].buckets) : {})],
      rows: rows.map(b => [b.dealerName, b.dealerCode, u.get(b.salesmanId) || b.salesmanId, b.total, b.ageDays, b.ageDays == null ? 'unknown' : band(b.ageDays), ...Object.values(asObj(b.buckets))]) }; } },
  'dealer-wise': { label: 'Dealer-wise Outstanding', async build(sf) {
    const rows = await ColBalance.find(sf).sort({ dealerName: 1 }).lean();
    const cyc = await ColCycle.aggregate([{ $match: sf }, { $group: { _id: '$dealerId', cycles: { $sum: 1 }, cleared: { $sum: { $cond: [{ $eq: ['$status', 'CLEARED'] }, 1, 0] } }, paid: { $sum: '$paidTotal' } } }]);
    const c = new Map(cyc.map(x => [String(x._id), x]));
    return { columns: ['Dealer', 'Code', 'Total', 'Status', 'Cycles', 'Cleared cycles', 'Confirmed payments (all time)'], rows: rows.map(b => [b.dealerName, b.dealerCode, b.total, b.status, c.get(String(b.dealerId))?.cycles || 0, c.get(String(b.dealerId))?.cleared || 0, c.get(String(b.dealerId))?.paid || 0]) }; } },
  'salesman-wise': { label: 'Salesman-wise Outstanding', async build(sf) {
    const agg = await ColBalance.aggregate([{ $match: { ...sf, total: { $gt: 0 } } }, { $group: { _id: '$salesmanId', total: { $sum: '$total' }, dealers: { $sum: 1 }, maxAge: { $max: '$ageDays' } } }, { $sort: { total: -1 } }]); const u = await users();
    return { columns: ['Salesman', 'Dealers owing', 'Total', 'Oldest (days)'], rows: agg.map(a => [u.get(a._id) || a._id || '(unassigned)', a.dealers, a.total, a.maxAge]) }; } },
  'collection': { label: 'Collection', async build(sf, p) {
    const f = { ...sf, status: 'CONFIRMED' }; if (p.from || p.to) f.date = { ...(p.from ? { $gte: p.from } : {}), ...(p.to ? { $lte: p.to } : {}) };
    const rows = await ColPayment.find(f).sort({ date: -1 }).lean(); const n = await names(rows.map(r => r.dealerId)); const u = await users();
    return { columns: ['Date', 'Payment #', 'Dealer', 'Code', 'Amount', 'Mode', 'Reference', 'Collected by', 'Confirmed by'], rows: rows.map(r => [r.date, r.paymentNo, n.get(String(r.dealerId))?.name, n.get(String(r.dealerId))?.code, r.amount, r.mode, r.reference, u.get(r.collectedBy) || r.collectedBy, u.get(r.confirmedBy) || r.confirmedBy]) }; } },
  'payment-history': { label: 'Payment History', async build(sf, p) {
    const f = { ...sf }; if (p.from || p.to) f.date = { ...(p.from ? { $gte: p.from } : {}), ...(p.to ? { $lte: p.to } : {}) };
    const rows = await ColPayment.find(f).sort({ date: -1 }).lean(); const n = await names(rows.map(r => r.dealerId));
    return { columns: ['Date', 'Payment #', 'Dealer', 'Amount', 'Mode', 'Reference', 'Status', 'Entered by', 'Remarks'], rows: rows.map(r => [r.date, r.paymentNo, n.get(String(r.dealerId))?.name, r.amount, r.mode, r.reference, r.status, r.enteredBy, r.remarks]) }; } },
  'follow-ups': { label: 'Follow-ups', async build(sf, p) {
    const f = { ...sf }; if (p.from || p.to) f.date = { ...(p.from ? { $gte: p.from } : {}), ...(p.to ? { $lte: p.to } : {}) };
    const rows = await ColFollowUp.find(f).sort({ date: -1 }).lean(); const n = await names(rows.map(r => r.dealerId)); const u = await users();
    return { columns: ['Date', 'Time', 'Dealer', 'Employee', 'Channel', 'Outcome', 'Discussion', 'Customer response', 'Next follow-up', 'Next action'], rows: rows.map(r => [r.date, r.time, n.get(String(r.dealerId))?.name, u.get(r.employeeId) || r.employeeId, r.channel, r.outcome, r.discussion, r.customerResponse, r.nextFollowupDate, r.nextAction]) }; } },
  'promises': { label: 'Promises', async build(sf, p) {
    const f = { ...sf }; if (p.status) f.status = { $in: String(p.status).split(',') };
    const rows = await ColPromise.find(f).sort({ promiseDate: -1 }).lean(); const n = await names(rows.map(r => r.dealerId)); const u = await users();
    return { columns: ['Promise date', 'Dealer', 'Employee', 'Amount', 'Received', 'Shortfall', 'Status', 'Notes'], rows: rows.map(r => [r.promiseDate, n.get(String(r.dealerId))?.name, u.get(r.employeeId) || r.employeeId, r.amount, r.received, Math.max(0, r.amount - r.received), r.status, r.notes]) }; } },
  'broken-promises': { label: 'Broken Promises', async build(sf) { return REPORTS.promises.build(sf, { status: 'BROKEN' }); } },
  'cleared': { label: 'Cleared Dealers', async build(sf, p) {
    const f = { ...sf, status: 'CLEARED' }; if (p.from || p.to) f.closedAt = { ...(p.from ? { $gte: new Date(p.from) } : {}), ...(p.to ? { $lte: new Date(p.to + 'T23:59:59') } : {}) };
    const rows = await ColCycle.find(f).sort({ closedAt: -1 }).lean(); const n = await names(rows.map(r => r.dealerId));
    return { columns: ['Dealer', 'Code', 'Cycle', 'Opened', 'Cleared', 'Days open', 'Opening', 'Peak', 'Confirmed payments', 'Observed decrease'], rows: rows.map(r => [n.get(String(r.dealerId))?.name, n.get(String(r.dealerId))?.code, r.cycleNo, r.openedAt?.toISOString().slice(0, 10), r.closedAt?.toISOString().slice(0, 10), Math.round((r.closedAt - r.openedAt) / 86400000), r.openingTotal, r.peakTotal, r.paidTotal, r.observedDecreaseTotal]) }; } },
  'new-outstanding': { label: 'New Outstanding', async build(sf, p) {
    const f = { ...sf, type: { $in: ['NEW_OUTSTANDING', 'REOPENED'] } }; if (p.from || p.to) f.at = { ...(p.from ? { $gte: new Date(p.from) } : {}), ...(p.to ? { $lte: new Date(p.to + 'T23:59:59') } : {}) };
    const rows = await ColEvent.find(f).sort({ at: -1 }).lean(); const n = await names(rows.map(r => r.dealerId));
    return { columns: ['Date', 'Dealer', 'Code', 'Type', 'Amount'], rows: rows.map(r => [r.at.toISOString().slice(0, 10), n.get(String(r.dealerId))?.name, n.get(String(r.dealerId))?.code, r.type, r.amount]) }; } },
  'invoices': { label: 'Invoices', async build(sf) {
    const rows = await ColInvoice.find(sf).sort({ status: 1, dueDate: 1 }).lean(); const n = await names(rows.map(r => r.dealerId));
    return { columns: ['Dealer', 'Bill ref', 'Bill date', 'Due date', 'Amount', 'Pending', 'Status'], rows: rows.map(r => [n.get(String(r.dealerId))?.name, r.billRef, r.billDate, r.dueDate, r.amount, r.pending, r.status]) }; } },
  'employee-activity': { label: 'Employee Activity', async build(sf, p) {
    const f = {}; if (p.from || p.to) f.date = { ...(p.from ? { $gte: p.from } : {}), ...(p.to ? { $lte: p.to } : {}) };
    const agg = await ColEmployeeActivity.aggregate([{ $match: f }, { $group: { _id: '$employeeId', followups: { $sum: '$followups' }, calls: { $sum: '$calls' }, visits: { $sum: '$visits' }, whatsapps: { $sum: '$whatsapps' }, tasksDone: { $sum: '$tasksDone' }, promisesTaken: { $sum: '$promisesTaken' }, promisesKept: { $sum: '$promisesKept' }, promisesBroken: { $sum: '$promisesBroken' }, collected: { $sum: '$collected' }, points: { $sum: '$points' } } }, { $sort: { points: -1 } }]); const u = await users();
    return { columns: ['Employee', 'Follow-ups', 'Calls', 'Visits', 'WhatsApp', 'Tasks done', 'Promises taken', 'Kept', 'Broken', 'Collected', 'Points'], rows: agg.map(a => [u.get(a._id) || a._id, a.followups, a.calls, a.visits, a.whatsapps, a.tasksDone, a.promisesTaken, a.promisesKept, a.promisesBroken, a.collected, a.points]) }; } },
  'task-points': { label: 'Task Points', async build(sf, p) {
    const f = { ...sf, status: 'DONE' }; if (p.from || p.to) f.completedAt = { ...(p.from ? { $gte: new Date(p.from) } : {}), ...(p.to ? { $lte: new Date(p.to + 'T23:59:59') } : {}) };
    const rows = await ColTask.find(f).sort({ completedAt: -1 }).lean(); const n = await names(rows.map(r => r.dealerId)); const u = await users();
    return { columns: ['Completed', 'Task #', 'Employee', 'Dealer', 'Type', 'Priority', 'Points'], rows: rows.map(r => [r.completedAt?.toISOString().slice(0, 10), r.taskNo, u.get(r.employeeId) || r.employeeId, n.get(String(r.dealerId))?.name, r.type, r.priority, r.points]) }; } },
  'employee-review': { label: 'Employee Review', async build(sf, p) {
    const f = {}; if (p.period) f.period = p.period;
    const rows = await ColEmployeeReview.find(f).sort({ period: -1, score: -1 }).lean(); const u = await users();
    const keys = [...new Set(rows.flatMap(r => Object.keys(asObj(r.metrics))))];
    return { columns: ['Period', 'Employee', 'Score', 'Status', ...keys], rows: rows.map(r => { const m = asObj(r.metrics); return [r.period, u.get(r.employeeId) || r.employeeId, r.score, r.status, ...keys.map(k => m[k] ?? '')]; }) }; } },
  'reconciliation': { label: 'Excel Reconciliation', async build(sf, p) {
    const f = { ...sf, type: 'RECONCILIATION_DIFFERENCE' }; if (p.from || p.to) f.at = { ...(p.from ? { $gte: new Date(p.from) } : {}), ...(p.to ? { $lte: new Date(p.to + 'T23:59:59') } : {}) };
    const rows = await ColEvent.find(f).sort({ at: -1 }).lean(); const n = await names(rows.map(r => r.dealerId));
    return { columns: ['Statement date', 'Dealer', 'Code', 'From', 'To', 'Observed decrease', 'Confirmed payments', 'Difference'], rows: rows.map(r => [r.at.toISOString().slice(0, 10), n.get(String(r.dealerId))?.name, n.get(String(r.dealerId))?.code, r.meta?.from, r.meta?.to, r.meta?.observed, r.meta?.explained, r.amount]) }; } },
  'dealer-timeline': { label: 'Dealer Timeline', async build(sf, p) {
    if (!p.dealerId) return { columns: ['Note'], rows: [['dealerId is required']] };
    const rows = await ColEvent.find({ dealerId: new mongoose.Types.ObjectId(p.dealerId) }).sort({ at: 1 }).lean();
    return { columns: ['When', 'Type', 'Amount', 'Before', 'After', 'By', 'Note'], rows: rows.map(r => [r.at.toISOString().replace('T', ' ').slice(0, 16), r.type, r.amount, r.before, r.after, r.by, r.note]) }; } },
  'historical-outstanding': { label: 'Historical Outstanding', async build(sf, p) {
    const f = { ...sf }; if (p.from || p.to) f.asOn = { ...(p.from ? { $gte: p.from } : {}), ...(p.to ? { $lte: p.to } : {}) };
    const rows = await ColSnapshot.find(f).sort({ asOn: -1 }).limit(20000).lean(); const n = await names(rows.map(r => r.dealerId));
    return { columns: ['Statement date', 'Dealer', 'Code', 'Total', 'Previous', 'Change', 'Classification', 'Source'], rows: rows.map(r => [r.asOn, n.get(String(r.dealerId))?.name, n.get(String(r.dealerId))?.code, r.total, r.prevTotal, r.delta, r.classification, r.source]) }; } },
};

/** Stream to the response: xlsx via ExcelJS (row by row) or csv. */
export async function streamReport(res, kind, { columns, rows }, format = 'xlsx') {
  const name = `${kind}-${todayYmd()}`;
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', `attachment; filename="${name}.csv"`);
    const esc = v => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    res.write('﻿' + columns.map(esc).join(',') + '\n');
    for (const r of rows) res.write(r.map(esc).join(',') + '\n');
    return res.end();
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); res.setHeader('Content-Disposition', `attachment; filename="${name}.xlsx"`);
  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res });
  const ws = wb.addWorksheet(REPORTS[kind]?.label || kind);
  ws.addRow(columns).font = { bold: true };
  for (const r of rows) ws.addRow(r).commit();
  ws.commit(); await wb.commit();
}
