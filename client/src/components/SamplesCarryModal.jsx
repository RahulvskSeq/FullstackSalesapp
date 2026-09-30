import React, { useEffect, useMemo, useState } from 'react';
import { X, Package, Share2, RefreshCw, Store, FileSpreadsheet, FileText, Eye, ArrowLeft } from 'lucide-react';
import { api } from '../api';
import { useT } from '../i18n';
import { notify } from './Toast';

// Opened from the Visit calendar before the day starts: every "to be shown" sample for
// the dealers planned that day. A sample two dealers should see is packed once, so the
// first tab is one de-duplicated list; the second shows it dealer by dealer. Preview shows
// the sheet exactly as the PDF comes out, with the Excel / PDF downloads under it.
const fmtLong = ymd => new Date(ymd + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
// pieces to pack: one for each dealer it is GIVEN to; a folder only shown needs just one
const piecesOf = c => Math.max(1, (c.giveTo || []).length);
// what a folder is carried for (the dealer names are in "By dealer"); give folders first
const forOf = c => { const gv = (c.giveTo || []).length, sh = c.dealers.some(n => !(c.giveTo || []).includes(n)); return gv && sh ? 'GIVE + SHOW' : gv ? 'TO GIVE' : 'TO SHOW · NOT GIVE'; };
const FOR_CLS = { 'TO GIVE': 'give', 'GIVE + SHOW': 'both', 'TO SHOW · NOT GIVE': 'show' };
const sortedCarry = g => [...g.carry].sort((a, b) => ((b.giveTo || []).length > 0) - ((a.giveTo || []).length > 0) || a.name.localeCompare(b.name));
const statsOf = g => { const giving = g.carry.filter(c => (c.giveTo || []).length).length; return { folders: g.carry.length, pieces: g.carry.reduce((a, c) => a + piecesOf(c), 0), giving, showing: g.carry.length - giving }; };

export default function SamplesCarryModal({ date, salesmanId = '', onClose }) {
  const { t: tr } = useT();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('carry');
  const [view, setView] = useState('list');   // 'list' or 'preview' — the sheet as it will download

  const load = () => { setErr(''); setData(null); api.visitPlanCarry(date, salesmanId).then(setData).catch(e => setErr(e?.message || 'Could not load the sample list')); };
  useEffect(() => { load(); setView('list'); }, [date, salesmanId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const h = e => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);

  const groups = data?.salesmen || [];
  const many = groups.length > 1;
  const totals = useMemo(() => ({
    carry: groups.reduce((a, g) => a + g.carry.length, 0),
    dealers: groups.reduce((a, g) => a + g.dealers.length, 0),
    asked: groups.reduce((a, g) => a + g.dealers.reduce((b, d) => b + d.samples.length, 0), 0),
  }), [groups]);

  const title = `Samples to carry — ${fmtLong(date)}`;
  const asText = () => groups.map(g => [
    `${title}${many || !salesmanId ? ' — ' + g.salesmanName : ''}`,
    `${g.carry.length} samples for ${g.dealers.length} dealer${g.dealers.length === 1 ? '' : 's'}`,
    '',
    ...g.carry.map((c, i) => `${i + 1}. ${c.name}  x${piecesOf(c)}${(c.giveTo || []).length ? `  (give: ${c.giveTo.join(', ')})` : ''}`),
    '',
    'By dealer:',
    ...g.dealers.flatMap(d => [`• ${d.name}${d.city ? ' — ' + d.city : ''}`, ...(d.samples.length ? d.samples.map(s => `   - ${s}`) : ['   - nothing new to show'])]),
  ].join('\n')).join('\n\n');

  const who = groups.length === 1 ? '_' + groups[0].salesmanName.replace(/\s+/g, '-') : '';
  const [making, setMaking] = useState('');
  const excel = async () => {
    setMaking('excel');
    try {
      const blob = await api.visitPlanCarryXlsx(date, salesmanId);
      const { saveBlob } = await import('../lib/saveFile');
      await saveBlob(blob, `samples-to-carry_${date}${who}.xlsx`);
    } catch (e) { notify.error('Excel: ' + (e?.message || e)); }
    setMaking('');
  };

  // A printable A4 sheet: coloured header band, summary boxes, then per salesman the
  // folders to pack (pieces, give-to, show-to) and each dealer's list with GIVE marked.
  const pdf = async () => {
    setMaking('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const W = doc.internal.pageSize.getWidth(), M = 36;
      const INDIGO = [79, 70, 229], DARK = [30, 27, 75], GREY = [107, 114, 128], GREEN = [4, 120, 87];
      const band = () => {
        doc.setFillColor(...INDIGO); doc.rect(0, 0, W, 64, 'F');
        doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text('Samples to carry', M, 30);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.text(fmtLong(date), M, 48);
        doc.setFontSize(9); doc.text('Sales Tracker Pro', W - M, 30, { align: 'right' });
      };
      band();
      let y = 84;
      groups.forEach((g, gi) => {
        const { pieces, giving } = statsOf(g);
        if (gi && y > 640) { doc.addPage(); band(); y = 84; }
        doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(g.salesmanName, M, y);
        const nw = doc.getTextWidth(g.salesmanName);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...GREY); doc.text(`  ·  ${g.dealers.length} dealer${g.dealers.length === 1 ? '' : 's'}`, M + nw, y);
        // summary boxes
        const boxes = [[String(g.carry.length), 'FOLDERS'], [String(pieces), 'PIECES TO PACK'], [String(giving), 'TO GIVE'], [String(g.carry.length - giving), 'TO SHOW · NOT GIVE']];
        const bw = (W - 2 * M - 3 * 8) / 4; y += 10;
        boxes.forEach(([v, l], k) => {
          const x = M + k * (bw + 8);
          if (k === 0) doc.setFillColor(...INDIGO); else doc.setFillColor(243, 244, 246);
          doc.roundedRect(x, y, bw, 44, 6, 6, 'F');
          doc.setTextColor(k === 0 ? 255 : 30); doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text(v, x + 10, y + 21);
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(k === 0 ? 230 : 107); doc.text(l, x + 10, y + 35);
        });
        y += 60;
        // what each folder is carried for — the names are in "By dealer" below
        const rows = sortedCarry(g);
        autoTable(doc, {
          startY: y, margin: { left: M, right: M },
          head: [['#', 'Folder', 'Pcs', 'Carry for']],
          body: rows.map((c, i) => [i + 1, c.name, piecesOf(c), forOf(c)]),
          styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, valign: 'middle', lineColor: [229, 231, 235], lineWidth: 0.5 },
          headStyles: { fillColor: DARK, textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [248, 248, 255] },
          columnStyles: { 0: { cellWidth: 24, halign: 'right', textColor: GREY }, 1: { fontStyle: 'bold' }, 2: { cellWidth: 34, halign: 'center', fontStyle: 'bold' }, 3: { cellWidth: 130, halign: 'center', fontStyle: 'bold', fontSize: 8 } },
          didParseCell: d => {
            if (d.section !== 'body' || d.column.index !== 3) return;
            const v = String(d.cell.raw);
            if (v === 'TO GIVE') { d.cell.styles.textColor = [255, 255, 255]; d.cell.styles.fillColor = [5, 150, 105]; }
            else if (v === 'GIVE + SHOW') { d.cell.styles.textColor = [4, 120, 87]; d.cell.styles.fillColor = [209, 250, 229]; }
            else { d.cell.styles.textColor = [75, 85, 99]; d.cell.styles.fillColor = [229, 231, 235]; }
          },
        });
        y = doc.lastAutoTable.finalY + 18;
        if (y > 720) { doc.addPage(); band(); y = 84; }
        doc.setTextColor(...DARK); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.text('By dealer', M, y); y += 6;
        autoTable(doc, {
          startY: y, margin: { left: M, right: M },
          head: [['#', 'Dealer', 'Folders to give', 'Folders to show']],
          body: g.dealers.map((d, i) => [i + 1, d.name + (d.city ? '\n' + [d.city, d.zone].filter(Boolean).join(' · ') : ''), (d.give || []).join('\n') || '—', d.samples.filter(s => !(d.give || []).includes(s)).join('\n') || (d.samples.length ? '—' : 'nothing new to show')]),
          styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 4, valign: 'top', lineColor: [229, 231, 235], lineWidth: 0.5 },
          headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 20, halign: 'right', textColor: GREY }, 1: { cellWidth: 150, fontStyle: 'bold' }, 2: { textColor: GREEN, fontStyle: 'bold' } },
        });
        y = doc.lastAutoTable.finalY + 26;
      });
      const n = doc.getNumberOfPages();
      for (let p = 1; p <= n; p++) { doc.setPage(p); doc.setFontSize(8); doc.setTextColor(...GREY); doc.text(`Page ${p} of ${n}  ·  one piece per dealer it is given to; a folder only shown needs one`, M, doc.internal.pageSize.getHeight() - 18); }
      const { saveBlob } = await import('../lib/saveFile');
      await saveBlob(doc.output('blob'), `samples-to-carry_${date}${who}.pdf`);
    } catch (e) { notify.error('PDF: ' + (e?.message || e)); }
    setMaking('');
  };

  const share = async () => {
    const text = asText();
    try {
      if (window.Capacitor?.isNativePlatform?.()) { const { Share } = await import('@capacitor/share'); await Share.share({ title, text, dialogTitle: 'Share the sample list' }); return; }
      if (navigator.share) { await navigator.share({ title, text }); return; }
      await navigator.clipboard.writeText(text); notify.success('List copied — paste it in WhatsApp or a note');
    } catch (e) { if (e?.name !== 'AbortError') notify.error('Could not share: ' + (e?.message || e)); }
  };

  return (
    <div className="overlay dom-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dom scm" role="dialog" aria-label={tr('Samples to carry')}>
        <div className="dom-head">
          <span className="dom-ico" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}><Package size={18} /></span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="dom-eyebrow">{tr('Samples to carry')}</div>
            <div className="dom-title">{fmtLong(date)}</div>
          </div>
          <button className="dom-x" onClick={load} title="Reload"><RefreshCw size={14} /></button>
          <button className="dom-x" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        <div className="dom-body">
          {view === 'preview' && data ? <div className="scp-paper">
            <div className="scp-band"><div><b>Samples to carry</b><span>{fmtLong(date)}</span></div><small>Sales Tracker Pro</small></div>
            {groups.map(g => { const st = statsOf(g); return (
              <div key={g.salesmanId} className="scp-grp">
                <div className="scp-name">{g.salesmanName} <span>· {g.dealers.length} dealer{g.dealers.length === 1 ? '' : 's'}</span></div>
                <div className="scp-boxes">
                  <div className="on"><b>{st.folders}</b><span>FOLDERS</span></div><div><b>{st.pieces}</b><span>PIECES TO PACK</span></div>
                  <div><b>{st.giving}</b><span>TO GIVE</span></div><div><b>{st.showing}</b><span>TO SHOW · NOT GIVE</span></div>
                </div>
                <table className="scp-t"><thead><tr><th>#</th><th>Folder</th><th>Pcs</th><th>Carry for</th></tr></thead>
                  <tbody>{sortedCarry(g).map((c, i) => <tr key={c.name}><td className="n">{i + 1}</td><td className="f">{c.name}</td><td className="c">{piecesOf(c)}</td><td className={'for ' + FOR_CLS[forOf(c)]}>{forOf(c)}</td></tr>)}</tbody></table>
                <div className="scp-sub">By dealer</div>
                <table className="scp-t dl"><thead><tr><th>#</th><th>Dealer</th><th>Folders to give</th><th>Folders to show</th></tr></thead>
                  <tbody>{g.dealers.map((d, i) => <tr key={d.dealerId}><td className="n">{i + 1}</td><td className="f">{d.name}{(d.city || d.zone) && <small>{[d.city, d.zone].filter(Boolean).join(' · ')}</small>}</td>
                    <td className="g">{(d.give || []).map(s => <div key={s}>{s}</div>)}{!(d.give || []).length && '—'}</td>
                    <td>{d.samples.filter(s => !(d.give || []).includes(s)).map(s => <div key={s}>{s}</div>)}{!d.samples.length ? 'nothing new to show' : !d.samples.some(s => !(d.give || []).includes(s)) && '—'}</td></tr>)}</tbody></table>
              </div>); })}
            <div className="scp-foot">one piece per dealer it is given to; a folder only shown needs one</div>
          </div>
          : err ? <div className="scm-empty" style={{ color: 'var(--red)' }}>{err}<button className="btn" style={{ marginTop: 8 }} onClick={load}>Try again</button></div>
          : !data ? <div className="scm-empty">Loading the samples for this day…</div>
          : !totals.dealers ? <div className="scm-empty">No dealers planned for this day.</div>
          : <>
            <div className="scm-sum">
              <div><b>{totals.carry}</b><span>{tr('to carry')}</span></div>
              <div><b>{totals.dealers}</b><span>{totals.dealers === 1 ? 'dealer' : 'dealers'}</span></div>
              <div><b>{totals.asked - totals.carry}</b><span>{tr('repeats skipped')}</span></div>
            </div>
            <div className="scm-tabs" role="tablist">
              <button role="tab" aria-selected={tab === 'carry'} className={tab === 'carry' ? 'on' : ''} onClick={() => setTab('carry')}><Package size={13} /> {tr('What to carry')}</button>
              <button role="tab" aria-selected={tab === 'dealer'} className={tab === 'dealer' ? 'on' : ''} onClick={() => setTab('dealer')}><Store size={13} /> {tr('By dealer')}</button>
            </div>

            {groups.map(g => (
              <div key={g.salesmanId} className="scm-grp">
                {(many || !salesmanId) && <div className="scm-sm">{g.salesmanName} <span>· {g.carry.length} samples · {g.dealers.length} dealer{g.dealers.length === 1 ? '' : 's'}</span></div>}
                {tab === 'carry' ? (
                  g.carry.length ? <div className="scm-list">
                    {sortedCarry(g).map(c => { const id = g.salesmanId + '|' + c.name; return (
                      <div key={id} className="scm-row">
                        <span className="scm-main">
                          <span className={'scm-for ' + FOR_CLS[forOf(c)]}>{forOf(c)}</span>
                          <b>{c.name}</b>
                          {(c.giveTo || []).length > 0 && <small className="scm-give">give to {c.giveTo.join(', ')}</small>}
                          {c.dealers.some(n => !(c.giveTo || []).includes(n)) && <small>show to {c.dealers.filter(n => !(c.giveTo || []).includes(n)).join(', ')}</small>}
                        </span>
                        <span className="scm-x" title={(c.giveTo || []).length > 1 ? 'one piece for each dealer it is given to' : 'one piece is enough'}>×{piecesOf(c)}</span>
                      </div>); })}
                  </div> : <div className="scm-empty">Nothing new to show these dealers.</div>
                ) : (
                  <div className="scm-list">
                    {g.dealers.map(d => (
                      <div key={d.dealerId} className="scm-dealer">
                        <div className="scm-dn">{d.name}{(d.city || d.zone) && <span> · {[d.zone, d.city].filter(Boolean).join(' · ')}</span>}</div>
                        {d.samples.length ? <div className="scm-chips">{d.samples.map(s => <span key={s} className={(d.give || []).includes(s) ? 'give' : ''}>{(d.give || []).includes(s) ? 'Give · ' : ''}{s}</span>)}</div>
                          : <div style={{ fontSize: 12, color: 'var(--t3)' }}>Nothing new to show this dealer.</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>}
        </div>

        {data && totals.dealers > 0 && (
          <div className="scm-foot">
            {view === 'list' ? <>
              <button className="btn" onClick={share}><Share2 size={14} /> {tr('Share')}</button>
              <button className="btnp" onClick={() => setView('preview')}><Eye size={14} /> {tr('Preview & download')}</button>
            </> : <>
              <button className="btn" onClick={() => setView('list')}><ArrowLeft size={14} /> Back</button>
              <button className="btn scm-xl" onClick={excel} disabled={!!making}><FileSpreadsheet size={14} /> {making === 'excel' ? 'Making…' : 'Excel'}</button>
              <button className="btnp scm-pdf" onClick={pdf} disabled={!!making}><FileText size={14} /> {making === 'pdf' ? 'Making…' : 'Download PDF'}</button>
            </>}
          </div>
        )}
      </div>
    </div>
  );
}
