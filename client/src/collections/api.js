import { _requestBase, _requestHeaders, _requestHandle, getToken } from '../api';
import { saveBlob, isNative } from '../lib/saveFile';

/**
 * Request layer for the Collections module. Every call goes to
 * /api/collections/… ; the server applies the user's scope and features, so
 * the client never decides what someone may see — it only asks.
 */
const base = () => _requestBase() + '/collections';
const qs = (q = {}) => {
  const p = Object.entries(q).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return p.length ? '?' + p.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&') : '';
};
const get  = (path, q)       => fetch(base() + path + qs(q), { headers: _requestHeaders() }).then(_requestHandle);
const post = (path, body)    => fetch(base() + path, { method: 'POST', headers: _requestHeaders(), body: JSON.stringify(body || {}) }).then(_requestHandle);
const put  = (path, body)    => fetch(base() + path, { method: 'PUT',  headers: _requestHeaders(), body: JSON.stringify(body || {}) }).then(_requestHandle);
const multipart = (path, fd) => fetch(base() + path, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd }).then(_requestHandle);

export const col = {
  // read
  dashboard:      ()          => get('/dashboard'),
  outstanding:    (q)         => get('/outstanding', q),
  search:         (q)         => get('/search', { q }),
  reconciliation: (q)         => get('/reconciliation', q),
  dealer360:      (id)        => get(`/dealers/${id}/360`),
  timeline:       (id, q)     => get(`/dealers/${id}/timeline`, q),
  history:        (id)        => get(`/dealers/${id}/history`),
  reports:        ()          => get('/reports'),
  report:         (kind, q)   => get(`/reports/${kind}`, q),
  reportFileUrl:  (kind, q, format) => base() + `/reports/${kind}` + qs({ ...q, format }),
  notifications:  ()          => get('/notifications'),
  markRead:       (ids)       => post('/notifications/read', { ids }),
  settings:       ()          => get('/settings'),
  setSetting:     (key, value)=> put(`/settings/${key}`, { value }),

  // imports
  imports:        (q)         => get('/imports', q),
  importPreview:  (id)        => get(`/imports/${id}`),
  importRows:     (id, q)     => get(`/imports/${id}/rows`, q),
  uploadImport:   (file, asOn, balanceMode) => { const fd = new FormData(); fd.append('file', file); if (asOn) fd.append('asOn', asOn); if (balanceMode) fd.append('balanceMode', balanceMode); return multipart('/imports', fd); },
  applyImport:    (id, body)  => post(`/imports/${id}/apply`, body),
  mapRow:         (id, rowNo, dealerId) => post(`/imports/${id}/rows/${rowNo}/map`, { dealerId }),
  createDealerFromRow: (id, rowNo, salesman) => post(`/imports/${id}/rows/${rowNo}/create-dealer`, { salesman }),
  job:            (id)        => get(`/imports/jobs/${id}`),

  // payments
  payments:       (q)         => get('/payments', q),
  payment:        (id)        => get(`/payments/${id}`),
  recordPayment:  (body)      => post('/payments', body),
  confirmPayment: (id)        => post(`/payments/${id}/confirm`),
  bouncePayment:  (id, reason)=> post(`/payments/${id}/bounce`, { reason }),
  cancelPayment:  (id, reason)=> post(`/payments/${id}/cancel`, { reason }),
  paymentCountedOn: (id, ofPaymentId, reason) => post(`/payments/${id}/counted-on`, { ofPaymentId, reason }),
  proofUrl:       (id)        => base() + `/payments/attachments/${id}`,
  // a plain link opens in a tab without the login token and gets 401 — ask where the file is first
  //
  // Web: the tab is opened synchronously, inside the click, because Safari/iOS
  // block window.open() that runs after an await; it is pointed at the file
  // once the fetch finishes (and closed if it fails). No 'noopener' here — that
  // makes window.open return null, and the tab could not be navigated.
  // Native (APK): a WebView cannot show a blob: URL in a new window, so a
  // Cloudinary link goes to the system browser and a stored file is written out
  // and opened with the device's viewer.
  openProof:      async (id)  => {
    const native = isNative();
    const w = native ? null : window.open('', '_blank');
    try {
      const meta = await fetch(base() + `/payments/attachments/${id}?meta=1`, { headers: _requestHeaders() }).then(_requestHandle);
      if (meta?.url) {
        if (native) window.open(meta.url, '_system');
        else if (w) { try { w.opener = null; } catch {} w.location.href = meta.url; }
        else window.open(meta.url, '_blank', 'noopener');
        return;
      }
      const res = await fetch(base() + `/payments/attachments/${id}`, { headers: _requestHeaders() });
      if (!res.ok) throw new Error('Could not load the proof');
      const blob = await res.blob();
      if (native) {
        const ext = (blob.type.split('/')[1] || 'bin').split(/[;+]/)[0].replace('jpeg', 'jpg');
        await saveBlob(blob, `payment-proof-${id}.${ext}`);
        return;
      }
      const u = URL.createObjectURL(blob);
      if (w) { try { w.opener = null; } catch {} w.location.href = u; }
      else window.open(u, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(u), 60000);
    } catch (e) {
      if (w) { try { w.close(); } catch {} }
      throw e;
    }
  },
  pendingApprovals: (q)       => get('/payments/pending-approvals', q),
  approveDecrease:  (id)      => post(`/payments/approvals/${id}/approve`),
  dismissDecrease:  (id, reason) => post(`/payments/approvals/${id}/dismiss`, { reason }),

  // follow-ups and promises
  followups:      (q)         => get('/followups', q),
  recordFollowup: (body)      => post('/followups', body),
  updateFollowup: (id, body)  => put(`/followups/${id}`, body),
  promises:       (q)         => get('/followups/promises', q),
  cancelPromise:  (id, reason)=> post(`/followups/promises/${id}/cancel`, { reason }),

  // tasks
  tasks:          (q)         => get('/tasks', q),
  today:          (q)         => get('/tasks/today', q),
  createTask:     (body)      => post('/tasks', body),
  completeTask:   (id, body)  => post(`/tasks/${id}/complete`, body),
  cancelTask:     (id, reason)=> post(`/tasks/${id}/cancel`, { reason }),
  commentTask:    (id, text)  => post(`/tasks/${id}/comment`, { text }),

  // whatsapp
  waStatus:       ()          => get('/whatsapp/status'),
  waTemplates:    ()          => get('/whatsapp/templates'),
  saveTemplate:   (key, body) => put(`/whatsapp/templates/${key}`, body),
  waPreview:      (dealerId, templateKey) => get('/whatsapp/preview', { dealerId, templateKey }),
  waSend:         (body)      => post('/whatsapp/send', body),
  waMessages:     (q)         => get('/whatsapp/messages', q),
  uploadPhones:   (file, commit) => { const fd = new FormData(); fd.append('file', file); return multipart('/whatsapp/phones' + (commit ? '?commit=1' : ''), fd); },
  setContact:     (dealerId, body) => put(`/whatsapp/contact/${dealerId}`, body),

  // employees
  activity:       (q)         => get('/employees/activity', q),
  rebuildActivity:(from, to)  => post('/employees/activity/rebuild', { from, to }),
  reviews:        (q)         => get('/employees/reviews', q),
  generateReviews:(period, employeeIds) => post('/employees/reviews/generate', { period, employeeIds }),
  managerReview:  (id, body)  => put(`/employees/reviews/${id}/manager`, body),
  finalizeReview: (id)        => post(`/employees/reviews/${id}/finalize`),
};

/** Downloads need the token in a header, so a plain <a href> cannot be used. */
export async function downloadReport(kind, q, format = 'xlsx') {
  const res = await fetch(col.reportFileUrl(kind, q, format), { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(t.slice(0, 200) || `HTTP ${res.status}`); }
  const blob = await res.blob();
  await saveBlob(blob, `${kind}.${format}`);
}
