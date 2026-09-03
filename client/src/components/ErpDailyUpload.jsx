import React, { useState } from 'react';
import { Zap, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { notify } from './Toast';

/**
 * ErpDailyUpload — the one-step daily path.
 *
 * Drop the raw ERP product-transaction export in here and it does both
 * halves of the job in a single confirmation: import the invoice lines,
 * then roll them up into the month's sales.
 *
 * It still previews first. The projection is computed without writing
 * anything, by overlaying the incoming lines onto the stored ones by their
 * unique key — the same key the import upserts on — so the "after" figure
 * shown is the figure that will actually land.
 */

const qtyF = n => (Math.round((n || 0) * 100) / 100).toLocaleString('en-IN');
const n = v => (v || 0).toLocaleString('en-IN');

export default function ErpDailyUpload({ onDone }) {
  const [preview, setPreview] = useState(null);   // { file, data }
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setPct(0); setPreview(null); setCreated(null);
    api.ptxUpload(file, false, p => setPct(p), true)
      .then(data => setPreview({ file, data }))
      .catch(err => notify.error(err.message))
      .finally(() => { setBusy(false); setPct(0); });
  };

  /**
   * Create the parties the import could not match, from the details already
   * on the sheet. Afterwards the file is re-previewed so the counts reflect
   * reality rather than the stale preview that prompted the click.
   */
  const createMissing = () => {
    const list = preview?.data?.unmatchedDealers || [];
    if (!list.length) return;
    setCreating(true);
    api.ptxCreateDealers(list)
      .then(r => {
        setCreated(r);
        notify.success(`Created ${r.created} dealer${r.created === 1 ? '' : 's'}`);
        // Re-run the preview against the new dealer list.
        return api.ptxUpload(preview.file, false, () => {}, true)
          .then(data => setPreview(p => ({ ...p, data })));
      })
      .catch(err => notify.error(err.message))
      .finally(() => setCreating(false));
  };

  const confirm = () => {
    if (!preview) return;
    setBusy(true); setPct(0);
    api.ptxUpload(preview.file, true, p => setPct(p), true)
      .then(data => {
        setPreview(null);
        onDone?.();
        const m = data.sales?.months?.length || 0;
        notify.success(
          `Imported ${qtyF(data.written)} lines and updated ${m} month${m === 1 ? '' : 's'} of sales`
        );
      })
      .catch(err => notify.error(err.message))
      .finally(() => { setBusy(false); setPct(0); });
  };

  const d = preview?.data;
  const impact = d?.salesImpact || [];
  const anyWarning = impact.some(m => m.warnLowers) || impact.some(m => m.droppedLines > 0);

  return (
    <div className="card" style={{
      marginBottom: 14, padding: 14,
      background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <Zap size={15} style={{ color: 'var(--acc)' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>
          Raw ERP Sheet — Upload &amp; Update Sales
        </span>
        <span className="chip">one step</span>
        {!preview && (
          <label className="btnp" style={{ marginLeft: 'auto', cursor: busy ? 'not-allowed' : 'pointer', display: 'inline-flex' }}>
            <Upload size={14} />
            {busy ? `Reading… ${pct}%` : 'Choose ERP sheet'}
            <input type="file" accept=".xlsx,.xls" onChange={pick} disabled={busy} style={{ display: 'none' }} />
          </label>
        )}
        {preview && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => setPreview(null)} disabled={busy}>Cancel</button>
            <button className="btnp" onClick={confirm} disabled={busy}>
              {busy ? `Working… ${pct}%` : 'Import & update sales'}
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
        Upload the product-transaction export straight from the ERP — the one with
        <b style={{ color: 'var(--t2)' }}> Category</b>,
        <b style={{ color: 'var(--t2)' }}> Category Type</b> and
        <b style={{ color: 'var(--t2)' }}> Product Type</b>.
        It reads the invoice lines and updates this month's sales in one go, so there is nothing
        to fill in by hand. Re-uploading an overlapping date range is safe.
      </div>

      {d && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--b1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {anyWarning
              ? <AlertTriangle size={14} style={{ color: 'var(--yel)' }} />
              : <CheckCircle2 size={14} style={{ color: 'var(--grn)' }} />}
            <b style={{ fontSize: 13 }}>Preview — nothing saved yet</b>
            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
              {d.lines} lines · {d.vouchers} invoices · {d.dateFrom}{d.days > 1 ? ` → ${d.dateTo}` : ''}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
            {[
              ['Products', `${d.resolved}/${d.lines}`, d.unresolved ? 'warn' : 'ok'],
              ['Dealers', `${d.dealersMatched}/${d.lines}`, d.dealersUnmatched ? 'warn' : 'ok'],
              ['Salesmen', `${d.salesmenMatched}/${d.lines}`, d.salesmenMatched < d.lines ? 'warn' : 'ok'],
              ['Units', qtyF(d.totalQty), ''],
            ].map(([k, v, tone]) => (
              <div key={k} style={{
                flex: '1 1 110px', padding: '7px 10px', borderRadius: 7, background: 'var(--bg2)',
                border: '1px solid ' + (tone === 'warn' ? 'rgba(251,191,36,.4)' : tone === 'ok' ? 'rgba(52,211,153,.35)' : 'var(--b1)'),
              }}>
                <div style={{ fontSize: 9.5, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>{k}</div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: tone === 'warn' ? 'var(--yel)' : tone === 'ok' ? 'var(--grn)' : 'var(--t1)',
                }}>{v}</div>
              </div>
            ))}
          </div>

          {impact.map(m => (
            <div key={m.month} style={{
              marginBottom: 10, padding: '9px 11px', borderRadius: 8, background: 'var(--bg2)',
              border: '1px solid ' + (m.warnLowers ? 'rgba(248,113,113,.45)' : 'var(--b1)'),
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 13 }}>{m.month}</b>
                <span style={{ fontSize: 12.5, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
                  {qtyF(m.currentQty)} → <b style={{ color: 'var(--t1)' }}>{qtyF(m.newQty)}</b> units
                </span>
                <span style={{
                  fontSize: 12.5, fontWeight: 700,
                  color: m.delta === 0 ? 'var(--t3)' : m.delta > 0 ? 'var(--grn)' : 'var(--red)',
                }}>
                  {m.delta === 0 ? 'no change' : (m.delta > 0 ? '+' : '') + qtyF(m.delta)}
                </span>
              </div>

              {m.warnLowers && (
                <div style={{ marginTop: 7, fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                  <b style={{ color: 'var(--red)' }}>This would reduce {m.month}.</b> That usually means
                  the imported lines cover only part of the month. Import the rest before applying,
                  or the month will under-report.
                </div>
              )}
              {m.droppedLines > 0 && (
                <div style={{ marginTop: 7, fontSize: 11.5, color: 'var(--t2)', lineHeight: 1.5 }}>
                  <b style={{ color: 'var(--yel)' }}>{m.droppedLines} line(s)</b> totalling {qtyF(m.droppedQty)} units
                  are excluded — no category, or the dealer did not match.
                </div>
              )}

              {m.categories.some(c => c.delta !== 0) && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {m.categories.filter(c => c.delta !== 0).map((c, i) => (
                    <span key={i} className="chip" style={{ fontSize: 10.5 }}>
                      {c.category}{c.subCategory ? ` · ${c.subCategory}` : ''}{' '}
                      <b style={{ color: c.delta > 0 ? 'var(--grn)' : 'var(--red)' }}>
                        {c.delta > 0 ? '+' : ''}{qtyF(c.delta)}
                      </b>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Name the parties that did not match, with everything needed to
              create them, rather than sending the user elsewhere to find out. */}
          {d.unmatchedDealers?.length > 0 && (
            <div style={{
              marginTop: 4, padding: '10px 12px', borderRadius: 9,
              background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <AlertTriangle size={13} style={{ color: 'var(--yel)' }} />
                <b style={{ fontSize: 12.5 }}>
                  {d.unmatchedDealers.length} dealer{d.unmatchedDealers.length === 1 ? '' : 's'} not in the app
                </b>
                <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>
                  their {n(d.unmatchedDealers.reduce((a, x) => a + x.qty, 0))} units are excluded until they exist
                </span>
                <button className="btnp" style={{ marginLeft: 'auto', padding: '5px 11px', fontSize: 12 }}
                  onClick={createMissing} disabled={creating || busy}>
                  {creating ? 'Creating…' : `Create ${d.unmatchedDealers.length} dealer${d.unmatchedDealers.length === 1 ? '' : 's'}`}
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, fontVariantNumeric: 'tabular-nums' }}>
                  <thead>
                    <tr>{['Party', 'City', 'State', 'PIN', 'Salesman', 'Closest existing', 'Units'].map((h, i) => (
                      <th key={h} style={{
                        textAlign: i === 6 ? 'right' : 'left', padding: '4px 8px', color: 'var(--t3)',
                        fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.07em',
                        borderBottom: '1px solid var(--b1)', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {d.unmatchedDealers.map((u, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 8px', color: 'var(--t1)', fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={u.address || u.name}>{u.name}</td>
                        <td style={{ padding: '4px 8px', color: 'var(--t2)' }}>{u.city || '—'}</td>
                        <td style={{ padding: '4px 8px', color: 'var(--t2)' }}>{u.state || '—'}</td>
                        <td style={{ padding: '4px 8px', color: 'var(--t2)' }}>{u.pincode || '—'}</td>
                        <td style={{ padding: '4px 8px', color: 'var(--t3)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={u.salesPersonRaw}>{u.salesPersonRaw || '—'}</td>
                        <td style={{ padding: '4px 8px', color: 'var(--t3)', maxWidth: 190, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={u.closest}>
                          {u.closest ? `${u.closest} (${u.score}%)` : 'no similar name'}
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700 }}>{qtyF(u.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: 10.5, color: 'var(--t3)', marginTop: 7, lineHeight: 1.5 }}>
                Check “closest existing” first — a high percentage usually means the party is
                already in the app under a slightly different name, and creating it would make a
                duplicate. Created dealers take their city, state, PIN and address from this sheet.
              </div>

              {created && (
                <div style={{ fontSize: 11.5, color: 'var(--grn)', marginTop: 7, fontWeight: 600 }}>
                  Created {created.created}
                  {created.skipped > 0 && `, skipped ${created.skipped} that already existed`}.
                </div>
              )}
            </div>
          )}

          {d.unresolvedProducts?.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>
              {d.unresolvedProducts.length} product(s) have no category — listed in full on the
              Product Transactions page.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
