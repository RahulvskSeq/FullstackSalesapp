import express from 'express';
import { protect } from '../middleware/auth.js';
import mongoose from 'mongoose';
import ProductTxn from '../models/ProductTxn.js';
import Dealer from '../models/Dealer.js';

// Live stock lookup from the Tally (Bizmate) connector.
// The upstream call returns every product (~47k rows, ~5 MB), so it is fetched
// once, kept in memory for a few minutes, and searched here — the app only
// ever receives the handful of rows that match. The token stays on the server.
const router = express.Router();
const URL   = process.env.TALLY_STOCK_URL || 'http://tally.digitalorders.in/BizmateAPI/app/trequest/loadproductswithstock';
const TTL   = 5 * 60 * 1000;
let cache = null;          // { at, rows }
let inflight = null;

const clean = v => String(v ?? '').replace(/^"+|"+$/g, '').trim();

async function loadAll(force = false) {
  if (!force && cache && Date.now() - cache.at < TTL) return cache;
  if (inflight) return inflight;
  const token = process.env.TALLY_STOCK_TOKEN;
  if (!token) throw Object.assign(new Error('Stock lookup is not set up (TALLY_STOCK_TOKEN missing on the server)'), { status: 503 });
  inflight = (async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 30000);
    try {
      const r = await fetch(URL, { method: 'POST', headers: { AUTHTOKEN: token, 'Content-Type': 'application/json' }, body: '{}', signal: ctrl.signal });
      if (!r.ok) throw Object.assign(new Error('Tally stock service answered ' + r.status), { status: 502 });
      const j = await r.json();
      const list = Array.isArray(j?.result) ? j.result : [];
      const rows = list.map(x => {
        const name = clean(x.name), code = clean(x.itemCode);
        const key = (name + ' ' + code).toLowerCase();
        return { name, code, status: clean(x.status), stock: Number(x.stock) || 0, img: clean(x.imageURL),
                 key,                                   // for "starts with" ranking
                 flat: key.replace(/[^a-z0-9]/g, ''),   // spaces, brackets, dashes gone: "vn5539pgvnstx5539pg"
                 words: [...new Set(key.split(/[^a-z0-9]+/).filter(Boolean))] };
      }).filter(x => x.name || x.code);
      linkParents(rows);
      cache = { at: Date.now(), rows };
      return cache;
    } catch (e) {
      // Tally slow or down: keep answering from the last good list rather than failing
      if (cache) { console.warn('[stock] refresh failed, serving the list from', new Date(cache.at).toISOString(), '-', e.message); return cache; }
      throw e;
    } finally { clearTimeout(t); inflight = null; }
  })();
  return inflight;
}

// One design, many names: Tally keeps the stock on the design itself
// ("VN 652 ZD VNSTX", code "(652 ZD)") while dealer-label names for the same
// design ("ED 234", "OP 734" …) carry the same code and 0 stock. Rows are
// grouped by code; the parent is the row whose own name contains the code
// (highest stock wins), and every child shows the parent's stock as available.
function linkParents(rows) {
  const groups = new Map();
  for (const r of rows) {
    r.eff = r.stock; r.isParent = false; r.parentName = ''; r.viaParent = false;
    const fc = r.code.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (fc.length < 3) continue;
    (groups.get(fc) || groups.set(fc, []).get(fc)).push(r);
  }
  for (const [fc, list] of groups) {
    if (list.length < 2) continue;
    const named = list.filter(r => r.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(fc));
    const pool = named.length ? named : list.filter(r => r.stock > 0);
    if (!pool.length) continue;
    const parent = pool.reduce((a, b) => (b.stock > a.stock ? b : a));
    parent.isParent = true;
    for (const r of list) {
      if (r === parent) continue;
      r.parentName = parent.name;
      if (r.stock <= 0 && parent.stock > 0) { r.eff = parent.stock; r.viaParent = true; }
    }
  }
}

// What a person types → comparable pieces. Spaces, dashes, dots, brackets and
// other stray characters are ignored, and "5539pg" is read as "5539" + "pg",
// so "5539 PG", "5539-pg", "(5539pg)" and "5539  pg" all find the same item.
const tokensOf = q => String(q || '').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/([a-z])(?=\d)|(\d)(?=[a-z])/g, '$1$2 ')
  .split(' ').filter(Boolean);

// one letter off (typed, missed, extra or swapped) — for a second try when nothing matches
function near(a, b) {
  if (a === b) return true;
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > 1 || Math.min(la, lb) < 3) return false;
  let i = 0, j = 0, edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (la === lb && a[i + 1] === b[j] && a[i] === b[j + 1]) { i += 2; j += 2; continue; }   // swapped pair
    if (la > lb) i++; else if (lb > la) j++; else { i++; j++; }
  }
  return edits + (la - i) + (lb - j) <= 1;
}

// GET /api/stock/search?q=5539&inStock=1&limit=60&refresh=1
router.get('/search', protect, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const inStock = req.query.inStock === '1';
    const status = String(req.query.status || '').toLowerCase().trim();   // e.g. 'discontinued'
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 60));
    const { at, rows } = await loadAll(req.query.refresh === '1');
    const words = tokensOf(q);
    const whole = words.join('');
    let hits = rows, fuzzy = false;
    if (words.length) {
      // 1) every piece appears somewhere (spacing and symbols ignored)
      hits = rows.filter(r => r.flat.includes(whole) || words.every(w => r.flat.includes(w)));
      // 2) nothing? allow one wrong letter per piece
      if (!hits.length) {
        hits = rows.filter(r => words.every(w => r.flat.includes(w) || (w.length >= 3 && r.words.some(x => near(w, x) || (x.length > w.length && near(w, x.slice(0, w.length)))))));
        fuzzy = hits.length > 0;
      }
    }
    if (status) hits = hits.filter(r => r.status.toLowerCase() === status);
    const matchesAll = hits.length;
    const inStockMatches = hits.reduce((n, r) => n + (r.eff > 0), 0);
    if (inStock) hits = hits.filter(r => r.eff > 0);
    // most useful first: in stock, then exact-ish code/name starts, then by stock
    const starts = r => words.length && (r.flat.startsWith(whole) || r.code.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(whole) || r.words[0] === words[0]) ? 1 : 0;
    const sorted = [...hits].sort((a, b) => (b.eff > 0) - (a.eff > 0) || b.isParent - a.isParent || starts(b) - starts(a) || b.eff - a.eff || a.name.localeCompare(b.name));
    res.json({
      updatedAt: new Date(at).toISOString(),
      totalProducts: rows.length,
      inStockProducts: rows.reduce((n, r) => n + (r.stock > 0), 0),   // physical stock items (parents), not double-counted
      matches: hits.length,
      matchesAll,            // before the in-stock filter
      inStockMatches,        // how many of the matches have stock
      fuzzy,                 // true = close matches (a letter off), not exact
      searched: words.join(' '),
      results: sorted.slice(0, limit).map(({ key, flat, words: _w, ...r }) => r),
    });
  } catch (e) {
    console.error('[stock]', e.message);
    res.status(e.status || (e.name === 'AbortError' ? 504 : 500)).json({ error: e.name === 'AbortError' ? 'Tally stock service took too long — try again' : e.message });
  }
});

// Discontinued products and the dealers who bought them. Tally says which products are
// discontinued (and how much is left); the product transactions say which dealer bought
// which product code. The app searches this both ways: a dealer → his discontinued
// products, a product → the dealers who buy it. A salesman sees his own dealers only.
const codeKey = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
router.get('/discontinued/dealers', protect, async (req, res) => {
  try {
    const { rows } = await loadAll(req.query.refresh === '1');
    const disc = new Map();
    for (const r of rows) {
      if (r.status.toLowerCase() !== 'discontinued') continue;
      const k = codeKey(r.code) || codeKey(r.name); if (!k) continue;
      const cur = disc.get(k);
      // one design, many names: keep the row that holds the stock
      if (!cur || r.eff > cur.stock) disc.set(k, { code: r.code, name: cur?.isParent && !r.isParent ? cur.name : r.name, stock: r.eff || 0, isParent: r.isParent });
    }
    const staff = ['admin', 'superadmin', 'employee'].includes(req.user?.role);
    const mine = staff ? null : new Set((await Dealer.find({ salesman: req.user.id }, '_id').lean()).map(d => String(d._id)));
    const txns = await ProductTxn.find({ productCode: { $nin: [null, ''] } }, 'productCode productName dealerId dealerName companyName city qty dateStr').lean();
    const byProd = new Map(), byDealer = new Map();
    for (const t of txns) {
      const k = codeKey(t.productCode); const p = disc.get(k); if (!p) continue;
      const did = t.dealerId ? String(t.dealerId) : '';
      if (mine && !mine.has(did)) continue;
      const dname = t.dealerName || t.companyName || 'Unknown party';
      const dk = did || 'n:' + dname.toUpperCase();
      const P = byProd.get(k) || byProd.set(k, { code: p.code, name: p.name, stock: p.stock, qty: 0, dealers: new Map() }).get(k);
      const pd = P.dealers.get(dk) || P.dealers.set(dk, { id: did, name: dname, city: t.city || '', qty: 0, last: '' }).get(dk);
      pd.qty += Number(t.qty) || 0; if ((t.dateStr || '') > pd.last) pd.last = t.dateStr || ''; P.qty += Number(t.qty) || 0;
      const D = byDealer.get(dk) || byDealer.set(dk, { id: did, name: dname, city: t.city || '', qty: 0, products: new Map() }).get(dk);
      const dp = D.products.get(k) || D.products.set(k, { code: p.code, name: p.name, stock: p.stock, qty: 0, last: '' }).get(k);
      dp.qty += Number(t.qty) || 0; if ((t.dateStr || '') > dp.last) dp.last = t.dateStr || ''; D.qty += Number(t.qty) || 0;
    }
    const range = txns.reduce((a, t) => ({ from: !a.from || (t.dateStr && t.dateStr < a.from) ? t.dateStr : a.from, to: !a.to || t.dateStr > a.to ? t.dateStr : a.to }), { from: '', to: '' });
    res.json({
      discontinued: disc.size, range,
      products: [...byProd.values()].map(p => ({ ...p, dealers: [...p.dealers.values()].sort((a, b) => b.qty - a.qty) })).sort((a, b) => b.dealers.length - a.dealers.length || b.qty - a.qty),
      dealers: [...byDealer.values()].map(d => ({ ...d, products: [...d.products.values()].sort((a, b) => b.qty - a.qty) })).sort((a, b) => b.products.length - a.products.length || b.qty - a.qty),
    });
  } catch (e) {
    res.status(e.status || (e.name === 'AbortError' ? 504 : 500)).json({ error: e.name === 'AbortError' ? 'Tally stock service took too long — try again' : e.message });
  }
});

export default router;
