import crypto from 'crypto';
/**
 * Meta WhatsApp Business Platform (Cloud API). The only WhatsApp transport
 * this module uses. Everything it needs comes from the environment.
 */
const cfg = () => ({
  phoneId: process.env.WA_PHONE_NUMBER_ID || '', token: process.env.WA_ACCESS_TOKEN || '',
  verify: process.env.WA_VERIFY_TOKEN || '', secret: process.env.WA_APP_SECRET || '', v: process.env.WA_API_VERSION || 'v20.0',
});
export const isConfigured = () => { const c = cfg(); return !!(c.phoneId && c.token); };

/** Send an approved template. Body parameters are positional, in the template's order. */
export async function sendTemplate({ to, metaName, language = 'en', bodyParams = [] }) {
  const c = cfg();
  if (!isConfigured()) throw new Error('WhatsApp is not configured (WA_PHONE_NUMBER_ID / WA_ACCESS_TOKEN)');
  const res = await fetch(`https://graph.facebook.com/${c.v}/${c.phoneId}/messages`, {
    method: 'POST', headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: String(to).replace(/[^\d]/g, ''), type: 'template',
      template: { name: metaName, language: { code: language }, components: bodyParams.length ? [{ type: 'body', parameters: bodyParams.map(t => ({ type: 'text', text: String(t) })) }] : [] } }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `WhatsApp API ${res.status}`);
  return { providerMessageId: json?.messages?.[0]?.id || '', raw: json };
}

/** GET webhook handshake. */
export function verifyWebhook(query) {
  const c = cfg();
  return query['hub.mode'] === 'subscribe' && c.verify && query['hub.verify_token'] === c.verify ? query['hub.challenge'] : null;
}
/** X-Hub-Signature-256 over the raw request bytes. */
export function verifySignature(rawBody, header) {
  const c = cfg(); if (!c.secret) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', c.secret).update(rawBody).digest('hex');
  const a = Buffer.from(String(header || '')), b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
/** Statuses and inbound texts out of a webhook payload. */
export function parseWebhook(body) {
  const statuses = [], inbound = [];
  for (const e of body?.entry || []) for (const ch of e.changes || []) {
    const v = ch.value || {};
    for (const s of v.statuses || []) statuses.push({ id: s.id, status: String(s.status || '').toUpperCase(), at: new Date((+s.timestamp || Date.now() / 1000) * 1000), errors: s.errors || [], raw: s });
    for (const m of v.messages || []) inbound.push({ id: m.id, from: m.from, text: m.text?.body || '', type: m.type, raw: m });
  }
  return { statuses, inbound };
}
