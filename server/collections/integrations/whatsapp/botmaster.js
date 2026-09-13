/**
 * Bot Master Sender — a plain send-a-text API on the company's own WhatsApp
 * number. No template approval, no delivery webhooks: a 2xx with an ok body
 * means "handed to WhatsApp", which is as much as this provider tells us.
 *
 * Env: BOTMASTER_SENDER_ID (the phone, e.g. 916363865515),
 *      BOTMASTER_AUTH_TOKEN, BOTMASTER_URL (optional, defaults to the v1 send endpoint).
 */
const cfg = () => ({
  senderId: process.env.BOTMASTER_SENDER_ID || '',
  token: process.env.BOTMASTER_AUTH_TOKEN || '',
  url: process.env.BOTMASTER_URL || 'https://api.botmastersender.com/api/v1/?action=send',
});
export const isConfigured = () => { const c = cfg(); return !!(c.senderId && c.token); };

/** Indian numbers without a country code get 91; anything else is sent as digits only. */
export const normaliseNumber = raw => {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10) return '91' + d;
  if (d.length === 12 && d.startsWith('91')) return d;
  if (d.length === 11 && d.startsWith('0')) return '91' + d.slice(1);
  return d;
};

export async function sendText({ to, text, mediaUrl = '' }) {
  const c = cfg();
  if (!isConfigured()) throw new Error('Bot Master Sender is not configured (BOTMASTER_SENDER_ID / BOTMASTER_AUTH_TOKEN)');
  const body = { senderId: c.senderId, receiverId: normaliseNumber(to), messageText: String(text || ''), authToken: c.token };
  if (mediaUrl) body.mediaurl = mediaUrl;
  const res = await fetch(c.url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
  const raw = await res.text();
  let data; try { data = JSON.parse(raw); } catch { data = { raw: raw.slice(0, 500) }; }
  if (Array.isArray(data)) data = data[0] || {};                 // the API wraps its one result in an array
  const failed = !res.ok || data?.status === false || data?.success === false || /error|fail|invalid/i.test(String(data?.status ?? data?.message ?? '')) && !/success|sent|queued|ok/i.test(String(data?.status ?? data?.message ?? ''));
  if (failed) throw new Error(`Bot Master Sender ${res.status}: ${(data?.message || data?.error || raw || 'no response').toString().slice(0, 300)}`);
  return { providerMessageId: String(data?.messageId || data?.results?.[0]?.messageId || data?.id || ''), raw: data,
           creditsLeft: data?.subscription?.sms_count ?? null, expiresAt: data?.subscription?.expires_at || '' };
}
