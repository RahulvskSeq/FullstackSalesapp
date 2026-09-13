import mongoose from 'mongoose';
import Counter from '../../models/Counter.js';
import { ColTask, ColBalance, ColEvent, ColEmployeeActivity, ColNotification, TASK_TYPES, TASK_PRIORITY } from '../models/index.js';
import { getSetting } from '../lib/settings.js';
import { todayYmd } from '../lib/periods.js';
import { writeAudit } from '../lib/audit.js';

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const oid = v => new mongoose.Types.ObjectId(String(v));
const bad = m => { const e = new Error(m); e.status = 400; return e; };
const bump = (employeeId, date, inc) => ColEmployeeActivity.updateOne({ employeeId, date }, { $inc: inc, $setOnInsert: { employeeId, date } }, { upsert: true }).catch(() => {});

/** Points come from the table in force at completion and are stored on the task, so a later change never rewrites history. */
export async function pointsFor(type, { amount = 0 } = {}) {
  const t = await getSetting('collections.taskPoints');
  if (type === 'PAYMENT_COLLECTION' && amount >= (t.highValueThreshold || Infinity)) return t.HIGH_VALUE_COLLECTION || 0;
  return t[type] || 0;
}

export async function createTask(input, { by, source = 'manual', ruleId = '', dedupeKey = '' }) {
  const dealerId = oid(input.dealerId);
  const Dealer = mongoose.models.Dealer;
  const dealer = await Dealer.findById(dealerId, 'name salesman').lean();
  if (!dealer) throw bad('dealer not found');
  const type = String(input.type || '').toUpperCase(); if (!TASK_TYPES.includes(type)) throw bad('bad task type');
  const priority = String(input.priority || 'MEDIUM').toUpperCase(); if (!TASK_PRIORITY.includes(priority)) throw bad('bad priority');
  const dueDate = String(input.dueDate || todayYmd()); if (!YMD.test(dueDate)) throw bad('dueDate must be YYYY-MM-DD');
  const employeeId = String(input.employeeId || dealer.salesman || '');
  if (!employeeId || employeeId === 'none') throw bad('the dealer has no salesman; assign one or set employeeId');
  if (dedupeKey && await ColTask.exists({ dedupeKey })) return null;       // automation never repeats itself
  const balance = await ColBalance.findOne({ dealerId }, 'openCycleId').lean();
  const taskNo = await Counter.next('col_task');
  const t = await ColTask.create({
    taskNo, dealerId, cycleId: balance?.openCycleId || null, employeeId, type, priority, dueDate, dueTime: String(input.dueTime || '').slice(0, 5),
    description: String(input.description || '').slice(0, 2000), createdBy: by, source, ruleId, dedupeKey: dedupeKey || '', promiseId: input.promiseId ? oid(input.promiseId) : null,
    points: await pointsFor(type),   // what completing it is worth; recomputed on completion with the amount
  });
  await ColEvent.create({ dealerId, cycleId: t.cycleId, type: 'TASK_CREATED', refType: 'task', refId: t._id, by, note: `${type} · ${priority} · due ${dueDate}${ruleId ? ' · rule ' + ruleId : ''}` });
  await ColNotification.create({ userId: employeeId, type: 'task', title: `${type.replace(/_/g, ' ').toLowerCase()} — ${dealer.name}`, body: t.description || `Due ${dueDate}`, refType: 'task', refId: t._id }).catch(() => {});
  if (source === 'manual') await writeAudit({ entity: 'task', entityId: t._id, action: 'created', after: { taskNo, dealer: dealer.name, type, priority, dueDate, employeeId }, by });
  return t;
}

export async function completeTask(id, { by, comment = '', amount = 0 }) {
  const t = await ColTask.findById(id);
  if (!t) throw bad('task not found');
  if (t.status === 'DONE') return t;
  if (['CANCELLED', 'EXPIRED'].includes(t.status)) throw bad(`task is ${t.status}`);
  t.points = await pointsFor(t.type, { amount });
  t.status = 'DONE'; t.completedBy = by; t.completedAt = new Date();
  if (comment) t.comments.push({ by, text: String(comment).slice(0, 1000) });
  await t.save();
  await ColEvent.create({ dealerId: t.dealerId, cycleId: t.cycleId, type: 'TASK_DONE', refType: 'task', refId: t._id, by, note: `${t.type} · ${t.points} pts` });
  await bump(t.employeeId, todayYmd(), { tasksDone: 1, points: t.points });
  await writeAudit({ entity: 'task', entityId: t._id, action: 'completed', after: { taskNo: t.taskNo, points: t.points }, by });
  return t;
}

export async function cancelTask(id, { by, reason = '' }) {
  const t = await ColTask.findById(id);
  if (!t) throw bad('task not found');
  if (t.status === 'DONE') throw bad('a completed task cannot be cancelled');
  if (t.status === 'CANCELLED') return t;
  t.status = 'CANCELLED'; if (reason) t.comments.push({ by, text: 'Cancelled: ' + String(reason).slice(0, 500) });
  await t.save();
  await ColEvent.create({ dealerId: t.dealerId, cycleId: t.cycleId, type: 'TASK_CANCELLED', refType: 'task', refId: t._id, by, note: reason });
  return t;
}

export async function addComment(id, { by, text }) {
  const t = await ColTask.findById(id); if (!t) throw bad('task not found');
  t.comments.push({ by, text: String(text || '').slice(0, 1000) }); await t.save(); return t;
}

/** Cancel every open collection task for a dealer — the "cleared" rule. */
export async function cancelOpenTasksFor(dealerId, { by = 'automation', reason = 'outstanding cleared' } = {}) {
  const open = await ColTask.find({ dealerId, status: { $in: ['OPEN', 'IN_PROGRESS'] } });
  for (const t of open) await cancelTask(t._id, { by, reason });
  return open.length;
}

export async function listTasks(filter, { page = 1, limit = 50 } = {}) {
  const [items, total] = await Promise.all([ColTask.find(filter).sort({ dueDate: 1, priority: -1, taskNo: 1 }).skip((page - 1) * limit).limit(limit).lean(), ColTask.countDocuments(filter)]);
  const Dealer = mongoose.models.Dealer;
  const names = new Map((await Dealer.find({ _id: { $in: [...new Set(items.map(i => String(i.dealerId)))] } }, 'name code phone').lean()).map(d => [String(d._id), d]));
  return { items: items.map(i => ({ ...i, dealer: names.get(String(i.dealerId)) || null })), total, page, limit };
}
