/**
 * auditTrail.js — who changed what, recorded automatically.
 *
 * Mounted once in index.js in front of every /api route rather than sprinkled
 * through the handlers. Two reasons: a route added tomorrow is covered without
 * anyone remembering to add a line, and a route that throws still gets its
 * attempt recorded.
 *
 * Only mutations are recorded — GET and HEAD are the overwhelming majority of
 * traffic and reading data is not a change. A failed write is kept too: a
 * refused permission or a 500 is often exactly what you want to see.
 */
import AuditLog from '../models/AuditLog.js';

/** Requests that would bury the log without telling anyone anything. */
const SKIP = [
  /^\/api\/auth\/(login|refresh|me)$/,      // sign-in noise; the session itself is not a data change
  /^\/api\/crm\/(visits|attendance)\/photos$/,  // photo fetches are POSTs but read-only
  /^\/api\/producttx\/preview$/,            // dry runs change nothing
];

/** Field names that must never be written to a log. */
const SECRET = /^(pass|password|newPass|oldPass|token|jwt|secret|authorization)$/i;

/**
 * Shrink a request body to something worth keeping.
 *
 * Bodies here can be a 50 MB Excel file or a base64 photo. Storing those would
 * make the audit collection larger than the data it describes, so anything
 * long is replaced by a description of itself.
 */
function summarise(value, depth = 0) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (/^data:[^;]+;base64,/.test(value)) return `<image ${Math.round(value.length / 1024)} KB>`;
    return value.length > 300 ? value.slice(0, 300) + `… <+${value.length - 300} chars>` : value;
  }
  if (typeof value !== 'object') return value;
  if (depth >= 3) return '<nested>';
  if (Array.isArray(value)) {
    if (value.length > 20) return `<${value.length} items> ` + JSON.stringify(value.slice(0, 3).map(v => summarise(v, depth + 1)));
    return value.map(v => summarise(v, depth + 1));
  }
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(value)) {
    if (SECRET.test(k)) { out[k] = '<redacted>'; continue; }
    if (++n > 40) { out['…'] = `+${Object.keys(value).length - 40} more fields`; break; }
    out[k] = summarise(v, depth + 1);
  }
  return out;
}

export function auditTrail(req, res, next) {
  const method = req.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();
  const path = req.originalUrl.split('?')[0];
  if (SKIP.some(re => re.test(path))) return next();

  const started = Date.now();
  let recorded = false;

  const write = () => {
    if (recorded) return;
    recorded = true;
    // Fire and forget: an audit failure must never break the request that
    // succeeded. Errors are logged, not thrown.
    AuditLog.create({
      by:     req.user?.id || '',
      byName: req.user?.name || req.user?.id || 'anonymous',
      action: `${method} ${path}`,
      detail: {
        status: res.statusCode,
        ms: Date.now() - started,
        // A multipart upload has no JSON body — record the file instead.
        ...(req.file ? { file: req.file.originalname, sizeKB: Math.round((req.file.size || 0) / 1024) } : {}),
        ...(req.body && Object.keys(req.body).length ? { body: summarise(req.body) } : {}),
        ...(req.query && Object.keys(req.query).length ? { query: summarise(req.query) } : {}),
        // Set by a route that knows more than the request does — see
        // res.locals.audit in routes/dealers.js for the field-level diff.
        ...(res.locals?.audit ? { changed: summarise(res.locals.audit) } : {}),
      },
    }).catch(e => console.error('[audit]', e.message));
  };

  res.on('finish', write);
  res.on('close', write);   // client hung up mid-write — still worth recording
  next();
}
