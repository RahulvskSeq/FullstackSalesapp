import * as meta from './metaCloud.js';
import * as botmaster from './botmaster.js';
/**
 * Which WhatsApp provider is live. Bot Master Sender wins when its keys are
 * present (it needs no template approval); Meta Cloud otherwise; neither →
 * messages queue and fail with a clear reason.
 */
export const provider = () => (botmaster.isConfigured() ? 'botmaster' : meta.isConfigured() ? 'meta' : null);
export const isConfigured = () => provider() !== null;
export { meta, botmaster };
