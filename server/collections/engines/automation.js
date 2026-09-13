import mongoose from 'mongoose';
import { ColBalance, ColEvent, ColPromise, ColImport, ColTask } from '../models/index.js';
import { getSetting } from '../lib/settings.js';
import { todayYmd } from '../lib/periods.js';
import { createTask, completeTask, cancelOpenTasksFor } from '../services/tasks.js';
import { breakOverduePromises } from '../services/followups.js';
import * as hooks from './hooks.js';

/**
 * Rules live in settings; this evaluates them. Every action is keyed so a
 * rule never repeats itself for the same dealer/cycle/day, which is what
 * makes it safe to run the tick as often as we like.
 */
const key = (ruleId, dealerId, cycleId, extra = todayYmd()) => `${ruleId}:${dealerId}:${cycleId || '-'}:${extra}`;
const daysAgo = n => new Date(Date.now() - n * 86400000);

async function approverOf(salesmanId) {
  const User = mongoose.models.User;
  const u = await User.findOne({ id: salesmanId }, 'approver').lean();
  return u?.approver || salesmanId;
}

async function act(rule, dealerId, cycleId, extra = {}) {
  const p = rule.params || {};
  if (rule.action === 'createTask') {
    const b = await ColBalance.findOne({ dealerId }, 'salesmanId').lean();
    const employeeId = p.assignTo === 'approver' ? await approverOf(b?.salesmanId) : (b?.salesmanId || '');
    if (!employeeId || employeeId === 'none') return null;
    return createTask({ dealerId, employeeId, type: p.type, priority: p.priority, dueDate: extra.dueDate || todayYmd(), description: extra.description || rule.name, promiseId: extra.promiseId },
      { by: 'automation', source: 'automation', ruleId: rule.id, dedupeKey: key(rule.id, dealerId, cycleId, extra.dedupe) });
  }
  if (rule.action === 'cancelOpenTasks') return cancelOpenTasksFor(dealerId, { by: 'automation', reason: rule.name });
  if (rule.action === 'sendWhatsApp') {
    const { queueMessage } = await import('../services/whatsapp.js');
    const { ColWhatsAppMessage } = await import('../models/index.js');
    const dk = key(rule.id, dealerId, cycleId, extra.dedupe);
    if (await ColWhatsAppMessage.exists({ refType: 'automation', 'variables.dedupe': dk })) return null;
    try { return await queueMessage({ templateKey: p.templateKey, dealerId, variables: { dedupe: dk }, by: 'automation', refType: 'automation', refId: null }); }
    catch (e) { return null; }                                   // opted out or no number: nothing to send
  }
  return null;
}

/** Event-triggered rules, for the events an import or a payment produced. */
export async function runEventRules({ importId = null, dealerId = null, since = null } = {}) {
  const rules = (await getSetting('collections.automationRules')).filter(r => r.enabled && String(r.trigger).startsWith('event:'));
  let acted = 0;
  for (const rule of rules) {
    const type = rule.trigger.slice(6);
    const f = { type }; if (importId) f.importId = importId; if (dealerId) f.dealerId = dealerId; if (since) f.createdAt = { $gte: since };
    const evs = await ColEvent.find(f, 'dealerId cycleId at').lean();
    for (const e of evs) { const r = await act(rule, e.dealerId, e.cycleId, { dedupe: String(e.at?.toISOString?.().slice(0, 10) || todayYmd()) }); if (r) acted++; }
  }
  return acted;
}

/**
 * A dealer's salesman changes in the dealer master (edit, bulk upload, a
 * resignation hand-over). The balance carries a copy for scoping, and open
 * work is assigned to a person — both follow the dealer here, so nothing is
 * left addressed to someone who no longer has the account. Runs every tick
 * and after a hand-over; safe to run any time.
 */
export async function syncOwnership() {
  const stale = await ColBalance.aggregate([
    { $lookup: { from: 'dealers', localField: 'dealerId', foreignField: '_id', as: 'd' } }, { $unwind: '$d' },
    { $match: { $expr: { $ne: ['$salesmanId', { $ifNull: ['$d.salesman', ''] }] } } },
    { $project: { dealerId: 1, from: '$salesmanId', to: { $ifNull: ['$d.salesman', ''] } } }]);
  let balances = 0, tasks = 0, promises = 0;
  for (const s of stale) {
    balances += (await ColBalance.updateOne({ _id: s._id }, { $set: { salesmanId: s.to } })).modifiedCount || 0;
    if (s.to && s.to !== 'none') {
      tasks += (await ColTask.updateMany({ dealerId: s.dealerId, employeeId: s.from, status: { $in: ['OPEN', 'IN_PROGRESS'] } }, { $set: { employeeId: s.to } })).modifiedCount || 0;
      promises += (await ColPromise.updateMany({ dealerId: s.dealerId, employeeId: s.from, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] } }, { $set: { employeeId: s.to } })).modifiedCount || 0;
    }
  }
  if (stale.length) console.log('[COL OWNERSHIP]', { dealers: stale.length, balances, tasks, promises });
  return { dealers: stale.length, balances, tasks, promises };
}

/** The hourly sweep. Idempotent through dedupe keys. */
export async function tick() {
  await syncOwnership().catch(e => console.warn('[COL OWNERSHIP]', e.message));
  const today = todayYmd();
  const rules = (await getSetting('collections.automationRules')).filter(r => r.enabled && r.trigger === 'tick');
  const out = { promisesBroken: 0, tasks: 0 };
  // A promise past its date is broken whether or not any rule is on — that is
  // a fact about the promise, not an automation. Rules only decide what to
  // do about it (a task, a message), and those can be switched off.
  const brokenNow = await breakOverduePromises(today);
  out.promisesBroken = brokenNow.length;
  for (const rule of rules) {
    const c = rule.conditions || {};
    if (rule.id === 'promise-broken' || rule.action === 'breakPromise') {
      const broken = brokenNow;
      for (const p of broken) { const t = await act({ ...rule, action: 'createTask' }, p.dealerId, p.cycleId, { promiseId: p._id, dedupe: 'promise:' + p._id, description: `Promise of ₹${(p.amount - p.received).toLocaleString('en-IN')} due ${p.promiseDate} was not kept` }); if (t) out.tasks++; }
      continue;
    }
    if (rule.id === 'promise-due-today') {
      const due = await ColPromise.find({ status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] }, promiseDate: today }).lean();
      for (const p of due) { const t = await act(rule, p.dealerId, p.cycleId, { promiseId: p._id, dedupe: 'promise:' + p._id, description: `Promise of ₹${(p.amount - p.received).toLocaleString('en-IN')} is due today` }); if (t) out.tasks++; }
      continue;
    }
    if (rule.id === 'promise-reminder-tomorrow') {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const due = await ColPromise.find({ status: { $in: ['PENDING', 'PARTIALLY_FULFILLED'] }, promiseDate: tomorrow }).lean();
      for (const p of due) { const t = await act(rule, p.dealerId, p.cycleId, { dedupe: 'promise:' + p._id }); if (t) out.tasks++; }
      continue;
    }
    if (rule.id === 'stale-high-balance') {
      const bs = await ColBalance.find({ total: { $gte: c.minTotal || 0 }, status: { $nin: ['CLEARED', 'CLOSED'] },
        $or: [{ lastFollowupAt: null }, { lastFollowupAt: { $lt: daysAgo(c.noFollowupDays || 7) } }] }, 'dealerId openCycleId total').lean();
      for (const b of bs) { const t = await act(rule, b.dealerId, b.openCycleId, { description: `₹${b.total.toLocaleString('en-IN')} outstanding with no follow-up for ${c.noFollowupDays || 7}+ days` }); if (t) out.tasks++; }
      continue;
    }
    if (rule.id === 'long-overdue-escalate') {
      const bs = await ColBalance.find({ total: { $gt: 0 }, ageDays: { $gte: c.minAgeDays || 120 },
        $or: [{ lastPaymentAt: null }, { lastPaymentAt: { $lt: daysAgo(c.noPaymentDays || 30) } }] }, 'dealerId openCycleId total ageDays').lean();
      for (const b of bs) { const t = await act(rule, b.dealerId, b.openCycleId, { dedupe: 'cycle', description: `₹${b.total.toLocaleString('en-IN')} outstanding for ${b.ageDays} days with no recent payment` }); if (t) out.tasks++; }
    }
  }
  return out;
}

let timer = null;
export function startTick(intervalMs = 60 * 60 * 1000) {
  if (timer) return;
  const run = () => tick().then(r => { if (r.tasks || r.promisesBroken) console.log('[COL AUTOMATION]', JSON.stringify(r)); }).catch(e => console.warn('[COL AUTOMATION]', e.message));
  setTimeout(run, 15_000);                         // shortly after boot
  timer = setInterval(run, intervalMs);
}

// Wiring to what the engines emit.
hooks.on('import.applied', async ({ importId }) => { await runEventRules({ importId }); });
hooks.on('payment.confirmed', async ({ dealerId }) => { await runEventRules({ dealerId, since: new Date(Date.now() - 60_000) }); });
hooks.on('payment.bounced', async ({ dealerId }) => { await runEventRules({ dealerId, since: new Date(Date.now() - 60_000) }); });
hooks.on('followup.recorded', async ({ taskId, by }) => { if (taskId) await completeTask(taskId, { by }).catch(e => console.warn('[COL] task complete on follow-up:', e.message)); });
