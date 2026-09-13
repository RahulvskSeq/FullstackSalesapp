import mongoose from 'mongoose';
import { ColWhatsAppTemplate, ColWhatsAppMessage, ColBalance, ColPromise, ColEvent } from '../models/index.js';
import { getSetting } from '../lib/settings.js';
import { writeAudit } from '../lib/audit.js';
import { register, enqueue } from '../jobs/runner.js';
import * as meta from '../integrations/whatsapp/metaCloud.js';
import * as wa from '../integrations/whatsapp/index.js';

const bad = m => { const e = new Error(m); e.status = 400; return e; };
const Dealer = () => mongoose.models.Dealer;
const User = () => mongoose.models.User;
const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN');

export const DEFAULT_TEMPLATES = [
  { key: 'payment_reminder', metaName: 'payment_reminder', language: 'en', category: 'UTILITY', variables: ['dealer_name', 'outstanding_amount', 'oldest_bill_days', 'salesman_name', 'company_name'],
    body: 'Dear {{dealer_name}}, your outstanding with {{company_name}} is {{outstanding_amount}} (oldest bill {{oldest_bill_days}} days). Please arrange payment. — {{salesman_name}}' },
  { key: 'promise_reminder', metaName: 'promise_reminder', language: 'en', category: 'UTILITY', variables: ['dealer_name', 'promise_amount', 'promise_date', 'salesman_name', 'company_name'],
    body: 'Dear {{dealer_name}}, a reminder of your commitment of {{promise_amount}} due on {{promise_date}} to {{company_name}}. Thank you — {{salesman_name}}' },
  { key: 'payment_receipt', metaName: 'payment_receipt', language: 'en', category: 'UTILITY', variables: ['dealer_name', 'payment_amount', 'payment_date', 'outstanding_amount', 'company_name'],
    body: 'Dear {{dealer_name}}, {{company_name}} received {{payment_amount}} on {{payment_date}}. Balance outstanding: {{outstanding_amount}}. Thank you.' },
];
export async function ensureTemplates() { if (await ColWhatsAppTemplate.countDocuments() === 0) await ColWhatsAppTemplate.insertMany(DEFAULT_TEMPLATES); }

export function render(body, vars) { return String(body || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? ''); }

/** The variables every template may use, from the dealer's current state. */
export async function defaultVariables(dealerId, extra = {}) {
  const [dealer, balance, promise, company] = await Promise.all([
    Dealer().findById(dealerId, 'name salesman phone').lean(), ColBalance.findOne({ dealerId }).lean(),
    ColPromise.findOne({ dealerId, status: { $in: ['PENDING', 'PARTIALLY_FULFILLED', 'BROKEN'] } }).sort({ promiseDate: 1 }).lean(), getSetting('collections.companyName')]);
  const sm = dealer?.salesman ? await User().findOne({ id: dealer.salesman }, 'name').lean() : null;
  return { dealer_name: dealer?.name || '', outstanding_amount: inr(balance?.total || 0), oldest_bill_days: balance?.ageDays ?? '', promise_amount: promise ? inr(promise.amount - promise.received) : '', promise_date: promise?.promiseDate || '',
    salesman_name: sm?.name || dealer?.salesman || '', company_name: company, payment_amount: '', payment_date: '', ...extra };
}

/** Queue one templated message. Opt-out and a missing number are refused before anything is stored. */
export async function queueMessage({ templateKey, dealerId, variables = {}, by, refType = '', refId = null, to = '' }) {
  const t = await ColWhatsAppTemplate.findOne({ key: templateKey, active: true }).lean();
  if (!t) throw bad(`template ${templateKey} not found or inactive`);
  const dealer = await Dealer().findById(dealerId, 'name phone whatsappOptOut').lean();
  if (!dealer) throw bad('dealer not found');
  if (dealer.whatsappOptOut) { await ColWhatsAppMessage.create({ templateKey, dealerId, to: dealer.phone || '', status: 'OPTED_OUT', sentBy: by, refType, refId, error: 'dealer has opted out' }); throw bad(`${dealer.name} has opted out of WhatsApp`); }
  const number = String(to || dealer.phone || '').replace(/[^\d+]/g, '');
  if (!number) throw bad(`${dealer.name} has no phone number on record`);
  const vars = await defaultVariables(dealerId, variables);
  const msg = await ColWhatsAppMessage.create({ templateKey, dealerId, to: number, variables: Object.fromEntries(t.variables.map(k => [k, String(vars[k] ?? '')])), status: 'QUEUED', sentBy: by, refType, refId });
  await ColEvent.create({ dealerId, type: 'WHATSAPP_QUEUED', refType: 'whatsapp', refId: msg._id, by, note: templateKey });
  await enqueue('collections.whatsapp.send', { messageId: String(msg._id) }, { by });
  await writeAudit({ entity: 'whatsapp', entityId: msg._id, action: 'queued', after: { templateKey, to: number, dealer: dealer.name, variables: Object.fromEntries(msg.variables) }, by });
  return { message: msg, preview: render(t.body, vars) };
}

register('collections.whatsapp.send', async ({ messageId }) => {
  const msg = await ColWhatsAppMessage.findById(messageId); if (!msg || msg.status !== 'QUEUED') return { skipped: true };
  const cap = await getSetting('collections.whatsappRatePerMinute');
  const recent = await ColWhatsAppMessage.countDocuments({ status: { $in: ['SENT', 'DELIVERED', 'READ'] }, updatedAt: { $gte: new Date(Date.now() - 60_000) } });
  if (recent >= cap) { await new Promise(r => setTimeout(r, 60_000)); }
  const t = await ColWhatsAppTemplate.findOne({ key: msg.templateKey }).lean();
  msg.attempts++;
  try {
    const vars = Object.fromEntries(t.variables.map(k => [k, msg.variables.get(k) ?? '']));
    const r = wa.provider() === 'botmaster'
      ? await wa.botmaster.sendText({ to: msg.to, text: render(t.body, vars) })      // the template body itself, filled in
      : await meta.sendTemplate({ to: msg.to, metaName: t.metaName || t.key, language: t.language, bodyParams: t.variables.map(k => vars[k]) });
    msg.set('provider', wa.provider(), { strict: false });
    msg.status = 'SENT'; msg.providerMessageId = r.providerMessageId; msg.events.push({ status: 'SENT', at: new Date(), raw: r.raw });
    await msg.save();
    await ColEvent.create({ dealerId: msg.dealerId, type: 'WHATSAPP_SENT', refType: 'whatsapp', refId: msg._id, by: msg.sentBy, note: msg.templateKey });
  } catch (e) {
    msg.status = 'FAILED'; msg.error = String(e.message).slice(0, 500); msg.events.push({ status: 'FAILED', at: new Date(), raw: { error: msg.error } });
    await msg.save();
    await ColEvent.create({ dealerId: msg.dealerId, type: 'WHATSAPP_FAILED', refType: 'whatsapp', refId: msg._id, by: msg.sentBy, note: msg.error });
  }
  return { status: msg.status };
});

/** Delivery statuses and inbound opt-outs from the webhook. */
export async function handleWebhook(payload) {
  const { statuses, inbound } = meta.parseWebhook(payload);
  let updated = 0, optOuts = 0;
  for (const s of statuses) {
    const map = { SENT: 'SENT', DELIVERED: 'DELIVERED', READ: 'READ', FAILED: 'FAILED' }; const st = map[s.status]; if (!st) continue;
    const msg = await ColWhatsAppMessage.findOne({ providerMessageId: s.id }); if (!msg) continue;
    const order = ['QUEUED', 'SENT', 'DELIVERED', 'READ'];
    if (st === 'FAILED' || order.indexOf(st) > order.indexOf(msg.status)) { msg.status = st; if (st === 'FAILED') msg.error = JSON.stringify(s.errors).slice(0, 500); }
    msg.events.push({ status: st, at: s.at, raw: s.raw }); await msg.save(); updated++;
    if (st === 'DELIVERED') await ColEvent.create({ dealerId: msg.dealerId, type: 'WHATSAPP_DELIVERED', refType: 'whatsapp', refId: msg._id, by: 'whatsapp' });
  }
  for (const m of inbound) {
    if (/^\s*(stop|unsubscribe|opt\s*out)\s*$/i.test(m.text)) {
      const d = await Dealer().findOneAndUpdate({ phone: new RegExp(m.from.replace(/^\+/, '') + '$') }, { $set: { whatsappOptOut: true } }, { new: true });
      if (d) { optOuts++; await writeAudit({ entity: 'dealer', entityId: d._id, action: 'whatsapp-opt-out', after: { from: m.from }, by: 'whatsapp', source: 'system' }); }
    }
  }
  return { updated, optOuts };
}
