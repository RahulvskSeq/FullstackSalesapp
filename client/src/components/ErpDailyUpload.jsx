import React, { useState } from 'react';
import {
  Zap, Upload, AlertTriangle, CheckCircle2, Check, X, UploadCloud, FileSpreadsheet,
  Package, Store, Users, Layers, PackageX,
} from 'lucide-react';
import { api } from '../api';
import { notify } from './Toast';
import { Tile } from '../collections/ui';

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

/* ── Shared import-flow furniture ─────────────────────────────────────────
   Used here and by UploadMonth / Monthlyentry / ManageMonths so every upload
   in the app reads as one product: a stepper, a dashed drop card, a file chip
   and tinted result cards. Styling is scoped under the `imp-` prefix. */
export const IMPORT_CSS = `
.imp-steps{display:flex;align-items:flex-start;margin:2px 0 16px;gap:0}
.imp-step{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;position:relative;text-align:center}
.imp-step:not(:last-child)::after{content:'';position:absolute;top:13px;left:calc(50% + 17px);right:calc(-50% + 17px);height:2px;border-radius:2px;background:var(--b2)}
.imp-step.done:not(:last-child)::after{background:var(--grn)}
.imp-dot{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;background:var(--bg2);color:var(--t3);border:1.5px solid var(--b2);transition:all .2s;position:relative;z-index:1}
.imp-step.on .imp-dot{background:var(--acc);border-color:var(--acc);color:#fff;box-shadow:0 0 0 4px color-mix(in srgb,var(--acc) 18%,transparent)}
.imp-step.done .imp-dot{background:var(--grn);border-color:var(--grn);color:#fff}
.imp-step.err .imp-dot{background:var(--red);border-color:var(--red);color:#fff;box-shadow:0 0 0 4px color-mix(in srgb,var(--red) 16%,transparent)}
.imp-lbl{margin-top:6px;font-size:11px;font-weight:700;color:var(--t3);line-height:1.25;padding:0 4px;overflow-wrap:anywhere}
.imp-step.on .imp-lbl{color:var(--t1)}
.imp-step.done .imp-lbl{color:var(--grn)}
.imp-step.err .imp-lbl{color:var(--red)}
.imp-drop{--tone:var(--acc);border:2px dashed color-mix(in srgb,var(--tone) 38%,var(--b2));border-radius:16px;padding:26px 18px;text-align:center;cursor:pointer;
  background:color-mix(in srgb,var(--tone) 4%,var(--bg2));transition:border-color .15s,background .15s,transform .15s;outline:none}
.imp-drop:hover,.imp-drop:focus-visible{border-color:var(--tone);background:color-mix(in srgb,var(--tone) 8%,var(--bg2))}
.imp-drop.over{border-color:var(--tone);border-style:solid;background:color-mix(in srgb,var(--tone) 12%,var(--bg2));transform:scale(1.005)}
.imp-drop.dis{cursor:not-allowed;opacity:.75}
.imp-drop-ico{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;margin:0 auto 10px;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
.imp-drop.over .imp-drop-ico{transform:translateY(-3px)}
.imp-drop-t{font-size:14px;font-weight:800;color:var(--t1)}
.imp-drop-s{font-size:12px;color:var(--t3);margin-top:4px}
.imp-drop-s u{color:var(--tone);text-decoration:none;font-weight:700}
.imp-fmts{display:flex;gap:5px;justify-content:center;flex-wrap:wrap;margin-top:10px}
.imp-fmt{font-size:10px;font-weight:800;letter-spacing:.05em;color:var(--t2);background:var(--bg1);border:1px solid var(--b1);padding:2px 8px;border-radius:20px}
.imp-file{display:flex;align-items:center;gap:10px;padding:9px 10px 9px 12px;border-radius:12px;background:var(--bg1);border:1px solid var(--b1);text-align:left;min-width:0}
.imp-file-ico{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;color:var(--grn);background:color-mix(in srgb,var(--grn) 13%,transparent)}
.imp-file-n{font-size:13px;font-weight:700;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.imp-file-s{font-size:11px;color:var(--t3);margin-top:1px}
.imp-x{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;flex-shrink:0;border:1px solid var(--b1);background:var(--bg2);color:var(--t3);cursor:pointer}
.imp-x:hover:not(:disabled){color:var(--red);border-color:color-mix(in srgb,var(--red) 40%,transparent)}
.imp-res{--tone:var(--grn);border-radius:14px;padding:12px 14px;background:color-mix(in srgb,var(--tone) 8%,var(--bg1));border:1px solid color-mix(in srgb,var(--tone) 32%,transparent);display:flex;gap:10px;align-items:flex-start}
.imp-res-ico{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 16%,transparent)}
.imp-res-t{font-size:13px;font-weight:800;color:var(--tone)}
.imp-res-b{font-size:12px;color:var(--t2);line-height:1.5;margin-top:2px;overflow-wrap:anywhere}
.imp-res-x{background:none;border:none;color:var(--t3);cursor:pointer;padding:2px;flex-shrink:0}
.imp-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.imp-tiles .stat-card{padding:10px 12px}
.imp-tbl{width:100%;border-collapse:collapse;font-size:12px;font-variant-numeric:tabular-nums}
.imp-tbl th{position:sticky;top:0}
.imp-tbl tbody tr:hover td{background:color-mix(in srgb,var(--acc) 5%,transparent)}
.imp-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
@media(max-width:560px){
  .imp-lbl{font-size:10px}
  .imp-drop{padding:20px 12px}
}
`;

/** Horizontal stepper. `current` is the 0-based active step; steps before it are done; current >= length means all done. */
export function ImportStepper({ steps, current, error }) {
  return (
    <div className="imp-steps">
      {steps.map((s, i) => {
        const st = i < current ? 'done' : i === current ? (error ? 'err' : 'on') : 'todo';
        return (
          <div key={s} className={'imp-step ' + st}>
            <span className="imp-dot">{st === 'done' ? <Check size={14} strokeWidth={3} /> : st === 'err' ? <X size={14} strokeWidth={3} /> : i + 1}</span>
            <span className="imp-lbl">{s}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Large dashed drop card. Click / Enter opens the picker (`onBrowse`); a drop hands the FileList to `onDropFiles`. */
export function DropZone({ onBrowse, onDropFiles, disabled, title = 'Drag & drop your file here', formats = [], hint, busy, busyText, pct, tone = 'var(--acc)', icon: Icon = UploadCloud, children }) {
  const [over, setOver] = useState(false);
  return (
    <div className={'imp-drop' + (over ? ' over' : '') + (disabled ? ' dis' : '')} style={{ '--tone': tone }}
      role="button" tabIndex={disabled ? -1 : 0} aria-disabled={disabled || undefined}
      onClick={() => { if (!disabled) onBrowse?.(); }}
      onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onBrowse?.(); } }}
      onDragOver={e => { e.preventDefault(); if (!disabled) setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); if (!disabled && e.dataTransfer?.files?.length) onDropFiles?.(e.dataTransfer.files); }}>
      <span className="imp-drop-ico">
        {busy ? <span style={{ width: 22, height: 22, border: '3px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> : <Icon size={26} />}
      </span>
      <div className="imp-drop-t">{busy ? (busyText || 'Working…') : title}</div>
      {!busy && <div className="imp-drop-s">or <u>click to browse</u></div>}
      {busy && pct != null && (
        <div className="pbar" style={{ width: 'min(300px, 80%)', margin: '12px auto 0', height: 6 }}>
          <div style={{ width: Math.max(0, Math.min(pct, 100)) + '%', background: tone, transition: 'width .15s linear' }} />
        </div>
      )}
      {!busy && formats.length > 0 && <div className="imp-fmts">{formats.map(f => <span key={f} className="imp-fmt">{f}</span>)}</div>}
      {hint && <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>{hint}</div>}
      {children}
    </div>
  );
}

export const fmtSize = b => {
  const v = Number(b) || 0;
  if (v >= 1024 * 1024) return (v / 1024 / 1024).toFixed(1) + ' MB';
  return (v / 1024).toFixed(1) + ' KB';
};

/** Selected file with name / size and an optional remove button. */
export function FileChip({ file, onRemove, disabled, note }) {
  if (!file) return null;
  const ext = (String(file.name || '').split('.').pop() || '').toUpperCase();
  return (
    <div className="imp-file">
      <span className="imp-file-ico"><FileSpreadsheet size={18} /></span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="imp-file-n" title={file.name}>{file.name}</div>
        <div className="imp-file-s">{fmtSize(file.size)}{ext ? ' · ' + ext : ''}{note ? ' · ' + note : ''}</div>
      </div>
      {onRemove && (
        <button type="button" className="imp-x" title="Remove file" disabled={disabled}
          onClick={e => { e.stopPropagation(); onRemove(); }}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/** Tinted success / error / warning result card. */
export function ResultCard({ kind = 'ok', title, children, onClose, style }) {
  const tone = kind === 'err' ? 'var(--red)' : kind === 'warn' ? 'var(--yel)' : 'var(--grn)';
  const Icon = kind === 'ok' ? CheckCircle2 : AlertTriangle;
  return (
    <div className="imp-res" style={{ '--tone': tone, ...style }} role={kind === 'err' ? 'alert' : 'status'}>
      <span className="imp-res-ico"><Icon size={16} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div className="imp-res-t">{title}</div>}
        {children && <div className="imp-res-b">{children}</div>}
      </div>
      {onClose && <button type="button" className="imp-res-x" onClick={onClose} title="Dismiss"><X size={14} /></button>}
    </div>
  );
}

export default function ErpDailyUpload({ onDone }) {
  const [preview, setPreview] = useState(null);   // { file, data }
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  // Display only: what the last confirmed import did, for the "Done" step.
  const [doneInfo, setDoneInfo] = useState(null);
  const inputRef = React.useRef(null);

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setPct(0); setPreview(null); setCreated(null); setDoneInfo(null);
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
        setDoneInfo({ written: data.written, months: m });
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

  // Stepper position, derived from existing state only.
  const step = preview ? 2 : busy ? 1 : doneInfo ? 4 : 0;

  return (
    <div className="card" style={{ marginBottom: 14, padding: 16 }}>
      <style>{IMPORT_CSS}</style>
      <div className="sec-title" style={{ marginBottom: 4 }}>
        <span className="sec-ico" style={{ '--tone': 'var(--acc)' }}><Zap size={15} /></span>
        Raw ERP Sheet — Upload &amp; Update Sales
        <span className="count-pill">one step</span>
        <div style={{ flex: 1 }} />
        {preview && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => setPreview(null)} disabled={busy}>Cancel</button>
            <button className="btnp" onClick={confirm} disabled={busy} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {busy ? `Working… ${pct}%` : <><Check size={14} /> Import &amp; update sales</>}
            </button>
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5, marginBottom: 14 }}>
        Upload the product-transaction export straight from the ERP — the one with
        <b style={{ color: 'var(--t2)' }}> Category</b>,
        <b style={{ color: 'var(--t2)' }}> Category Type</b> and
        <b style={{ color: 'var(--t2)' }}> Product Type</b>.
        It reads the invoice lines and updates this month's sales in one go, so there is nothing
        to fill in by hand. Re-uploading an overlapping date range is safe.
      </div>

      <ImportStepper steps={['Choose ERP sheet', 'Upload & read', 'Preview & check', 'Done']} current={step} />

      <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={pick} disabled={busy} style={{ display: 'none' }} />

      {!preview && (
        <DropZone
          onBrowse={() => inputRef.current?.click()}
          onDropFiles={files => pick({ target: { files, value: '' } })}
          disabled={busy}
          busy={busy} busyText={`Reading sheet… ${pct}%`} pct={busy ? pct : null}
          title="Drop the ERP product-transaction sheet here"
          formats={['.XLSX', '.XLS']}
          icon={Upload}
        />
      )}

      {!preview && !busy && doneInfo && (
        <ResultCard kind="ok" title="Import complete" style={{ marginTop: 12 }} onClose={() => setDoneInfo(null)}>
          Imported {qtyF(doneInfo.written)} lines and updated {doneInfo.months} month{doneInfo.months === 1 ? '' : 's'} of sales.
        </ResultCard>
      )}

      {d && (
        <div>
          <FileChip file={preview.file} note="nothing saved yet" disabled={busy} onRemove={() => setPreview(null)} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 10px', flexWrap: 'wrap' }}>
            {anyWarning
              ? <AlertTriangle size={15} style={{ color: 'var(--yel)' }} />
              : <CheckCircle2 size={15} style={{ color: 'var(--grn)' }} />}
            <b style={{ fontSize: 13, color: 'var(--t1)' }}>Preview — nothing saved yet</b>
            <span className="kpi-pill">{d.lines} lines · {d.vouchers} invoices · {d.dateFrom}{d.days > 1 ? ` → ${d.dateTo}` : ''}</span>
          </div>

          <div className="imp-tiles" style={{ marginBottom: 14 }}>
            <Tile icon={Package} label="Products matched" value={`${d.resolved}/${d.lines}`} tone={d.unresolved ? 'var(--yel)' : 'var(--grn)'} />
            <Tile icon={Store} label="Dealers matched" value={`${d.dealersMatched}/${d.lines}`} tone={d.dealersUnmatched ? 'var(--yel)' : 'var(--grn)'} />
            <Tile icon={Users} label="Salesmen matched" value={`${d.salesmenMatched}/${d.lines}`} tone={d.salesmenMatched < d.lines ? 'var(--yel)' : 'var(--grn)'} />
            <Tile icon={Layers} label="Units" value={qtyF(d.totalQty)} tone="var(--acc)" />
            {d.unmatchedDealers?.length > 0 && <Tile icon={Store} label="Unmatched dealers" value={d.unmatchedDealers.length} tone="var(--red)" />}
            {d.unresolvedProducts?.length > 0 && <Tile icon={PackageX} label="No category" value={d.unresolvedProducts.length} tone="var(--red)" />}
          </div>

          {impact.map(m => (
            <div key={m.month} className="att-card" style={{
              '--tone': m.warnLowers ? 'var(--red)' : m.delta > 0 ? 'var(--grn)' : m.delta < 0 ? 'var(--red)' : 'var(--t3)',
              marginBottom: 10, cursor: 'default',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <b style={{ fontSize: 14, color: 'var(--t1)' }}>{m.month}</b>
                <span style={{ fontSize: 12.5, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
                  {qtyF(m.currentQty)} → <b style={{ color: 'var(--t1)' }}>{qtyF(m.newQty)}</b> units
                </span>
                <span className={'trend ' + (m.delta > 0 ? 'up' : m.delta < 0 ? 'down' : '')}>
                  {m.delta === 0 ? 'no change' : (m.delta > 0 ? '+' : '') + qtyF(m.delta)}
                </span>
              </div>

              {m.warnLowers && (
                <ResultCard kind="err" title={`This would reduce ${m.month}.`} style={{ marginTop: 8, padding: '9px 11px' }}>
                  That usually means the imported lines cover only part of the month. Import the rest before applying,
                  or the month will under-report.
                </ResultCard>
              )}
              {m.droppedLines > 0 && (
                <ResultCard kind="warn" title={`${m.droppedLines} line(s) excluded`} style={{ marginTop: 8, padding: '9px 11px' }}>
                  Totalling {qtyF(m.droppedQty)} units — no category, or the dealer did not match.
                </ResultCard>
              )}

              {m.categories.some(c => c.delta !== 0) && (
                <div style={{ marginTop: 9, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
              marginTop: 4, padding: '12px 14px', borderRadius: 14,
              background: 'color-mix(in srgb, var(--yel) 7%, var(--bg1))', border: '1px solid color-mix(in srgb, var(--yel) 30%, transparent)',
            }}>
              <div className="sec-title" style={{ marginBottom: 8 }}>
                <span className="sec-ico" style={{ '--tone': 'var(--yel)' }}><AlertTriangle size={15} /></span>
                {d.unmatchedDealers.length} dealer{d.unmatchedDealers.length === 1 ? '' : 's'} not in the app
                <span className="sec-note">
                  their {n(d.unmatchedDealers.reduce((a, x) => a + x.qty, 0))} units are excluded until they exist
                </span>
                <div style={{ flex: 1 }} />
                <button className="btnp" style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={createMissing} disabled={creating || busy}>
                  {creating ? 'Creating…' : `Create ${d.unmatchedDealers.length} dealer${d.unmatchedDealers.length === 1 ? '' : 's'}`}
                </button>
              </div>

              <div style={{ overflow: 'auto', maxHeight: 340, borderRadius: 10, border: '1px solid var(--b1)', background: 'var(--bg1)' }}>
                <table className="imp-tbl">
                  <thead>
                    <tr>{['Party', 'City', 'State', 'PIN', 'Salesman', 'Closest existing', 'Units'].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 6 ? 'right' : 'left' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {d.unmatchedDealers.map((u, i) => (
                      <tr key={i}>
                        <td style={{ maxWidth: 240 }} title={u.address || u.name}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span className="ini" style={{ '--h': (u.name || '?').charCodeAt(0) * 37 % 360, width: 26, height: 26, fontSize: 10 }}>{((u.name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || '?').toUpperCase()}</span>
                            <span style={{ color: 'var(--t1)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</span>
                          </div>
                        </td>
                        <td>{u.city || '—'}</td>
                        <td>{u.state || '—'}</td>
                        <td>{u.pincode || '—'}</td>
                        <td style={{ color: 'var(--t3)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={u.salesPersonRaw}>{u.salesPersonRaw || '—'}</td>
                        <td style={{ color: 'var(--t3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          title={u.closest}>
                          {u.closest
                            ? <>{u.closest} <span className="chip" style={{ fontWeight: 700, color: u.score >= 85 ? 'var(--red)' : 'var(--t2)' }}>{u.score}%</span></>
                            : 'no similar name'}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--t1)' }}>{qtyF(u.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8, lineHeight: 1.5 }}>
                Check “closest existing” first — a high percentage usually means the party is
                already in the app under a slightly different name, and creating it would make a
                duplicate. Created dealers take their city, state, PIN and address from this sheet.
              </div>

              {created && (
                <ResultCard kind="ok" style={{ marginTop: 8, padding: '9px 11px' }}
                  title={`Created ${created.created}${created.skipped > 0 ? `, skipped ${created.skipped} that already existed` : ''}.`} />
              )}
            </div>
          )}

          {d.unresolvedProducts?.length > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--t3)', marginTop: 10 }}>
              {d.unresolvedProducts.length} product(s) have no category — listed in full on the
              Product Transactions page.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
