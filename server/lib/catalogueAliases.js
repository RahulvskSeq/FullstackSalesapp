import Setting from '../models/Setting.js';
import Dealer from '../models/Dealer.js';
import ProductMaster from '../models/ProductMaster.js';
import ProductTxn from '../models/ProductTxn.js';

/**
 * Private-label catalogues.
 *
 * The ERP files some products under the DEALER's own name as the catalogue
 * ("INNERSPACE", "FLAVA", "STENCIL"): a dealer's private label of a product
 * that really belongs to one of our catalogues. The master does not record
 * which one — the same design code sits in five or ten catalogues — so the
 * admin says so once, here, and every catalogue report folds the label into
 * the catalogue it named.
 *
 *   Setting `catalogueAliases` = { "INNERSPACE": "INNERLAM", ... }
 *
 * A catalogue counts as a private label when its name is a dealer's name
 * (dealer master, punctuation and case ignored) or when an alias exists for it.
 */
export const SETTING_KEY = 'catalogueAliases';
export const normKey = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export async function loadAliases() {
  const s = await Setting.findOne({ key: SETTING_KEY }).lean();
  const v = s?.value && typeof s.value === 'object' ? s.value : {};
  const out = {};
  for (const [k, t] of Object.entries(v)) if (k && typeof t === 'string' && t.trim()) out[k] = t.trim();
  return out;
}

export async function saveAliases(aliases) {
  const clean = {};
  for (const [k, t] of Object.entries(aliases || {})) {
    if (!k || typeof t !== 'string' || !t.trim() || k.trim() === t.trim()) continue;
    clean[k.trim()] = t.trim();
  }
  await Setting.findOneAndUpdate({ key: SETTING_KEY }, { $set: { value: clean } }, { upsert: true });
  return clean;
}

let _dealerCache = { at: 0, set: new Set() };
export async function dealerNameSet() {
  if (Date.now() - _dealerCache.at < 60_000) return _dealerCache.set;
  const rows = await Dealer.find({}, 'name').lean();
  _dealerCache = { at: Date.now(), set: new Set(rows.map(d => normKey(d.name)).filter(Boolean)) };
  return _dealerCache.set;
}

/** Everything the caller needs to fold labels: { aliases, isPrivateLabel(brand), brandsFor(target) }. */
export async function privateLabels() {
  const [aliases, dealers] = await Promise.all([loadAliases(), dealerNameSet()]);
  // Names that read as a shop rather than a catalogue ("SWASTIK PLYWOOD",
  // "JAI SHREE RAM", "STUDIO DECOR - COIMBATORE") are labels too, even when
  // that dealer is not in our master — an out-of-region customer of the ERP.
  const DEALERISH = /\b(plywood|plywoods|ply|hardware|hardwares|traders?|trading|enterprises?|timbers?|glass|agencies|agency|llp|pvt|private limited|stores?|interiors?|studio|square|warehouse|buildings?|buldings?|marketing|furniture|associates|sons?|co|company|corporation|industries|sanitary|ceramics?|aluminium|alumunium|jai shree ram|mysore|mysuru|coimbatore|bangalore|hosur|erode|chennai|kerala)\b/i;
  const isPrivateLabel = brand => !!brand && (Object.prototype.hasOwnProperty.call(aliases, brand) || dealers.has(normKey(brand)) || DEALERISH.test(String(brand)));
  const brandsFor = target => [target, ...Object.keys(aliases).filter(k => aliases[k] === target && k !== target)];
  return { aliases, isPrivateLabel, brandsFor };
}

/**
 * Per-product resolver: which real catalogue does a line filed under a dealer
 * private label belong to?
 *
 * The label's product ("IS 548") is a listing in the master; the same design
 * exists as other listings — same code under other catalogues, or siblings
 * under the same parent product. Among those, the real child catalogues (not
 * parent families, not other dealer labels) are the candidates. Several often
 * qualify, so the one that sells the most on its own name wins: a catalogue
 * dealers actually buy from is the catalogue, a name with no sales of its own
 * is another label. Ties go alphabetically so the answer never flips.
 *
 * An admin alias for the label overrides all of this. No candidate at all →
 * '' and the line keeps the label (reported as unmapped, never shown as a
 * catalogue).
 */
export async function buildCatalogueResolver() {
  const { aliases, isPrivateLabel } = await privateLabels();
  const master = await ProductMaster.find({}, 'productId parentProduct brand isParent code').lean();
  const byId = new Map(), byCode = new Map(), byParent = new Map(), kinds = new Map();
  for (const m of master) {
    byId.set(m.productId, m);
    const c = normKey(m.code); if (c) { if (!byCode.has(c)) byCode.set(c, []); byCode.get(c).push(m); }
    if (m.parentProduct) { if (!byParent.has(m.parentProduct)) byParent.set(m.parentProduct, []); byParent.get(m.parentProduct).push(m); }
    for (const b of String(m.brand || '').split(',').map(x => x.trim()).filter(Boolean)) {
      const k = kinds.get(b) || { parents: 0, children: 0 }; m.isParent ? k.parents++ : k.children++; kinds.set(b, k);
    }
  }
  const isChild = b => { const k = kinds.get(b); return !!k && k.parents === 0 && k.children > 0; };
  // how much each catalogue sells under its own name, all months
  const sold = await ProductTxn.aggregate([{ $group: { _id: '$brand', qty: { $sum: '$qty' } } }]);
  const ownSales = new Map(sold.map(r => [r._id, r.qty]));
  const best = cands => [...cands].sort((a, b) => (ownSales.get(b) || 0) - (ownSales.get(a) || 0) || a.localeCompare(b))[0] || '';
  // Catch-all listings exist for every design (a custom sample of anything,
  // showroom panels) and would swallow whole families; they are never targets.
  const CATCH_ALL = /sample|showroom|qr code|others? products?/i;
  const catsOf = rows => { const out = new Set(); for (const r of rows) for (const b of String(r.brand || '').split(',').map(x => x.trim())) if (b && isChild(b) && !isPrivateLabel(b) && !CATCH_ALL.test(b)) out.add(b); return out; };
  const memo = new Map();
  // A line needs re-routing when its catalogue is a dealer label OR a parent
  // family ("VN-TEX", "PASTELO"): reports show child catalogues only, so a
  // sale left under a parent would never be seen. Only when the master
  // knows child catalogues at all — with nothing classified, nothing moves.
  const needsRouting = brand => !!brand && (isPrivateLabel(brand) || (kinds.size > 0 && !isChild(brand)));
  const resolve = (brand, productId) => {
    if (!needsRouting(brand)) return brand || '';
    if (aliases[brand]) return aliases[brand];
    const key = brand + '|' + productId;
    if (memo.has(key)) return memo.get(key);
    const p = byId.get(String(productId));
    let out = '';
    if (p) {
      // same design code elsewhere → siblings under the same parent → the
      // product's own children (a parent product sold as itself)
      const same = (byCode.get(normKey(p.code)) || []).filter(x => x.productId !== p.productId);
      let cands = catsOf(same);
      if (!cands.size && p.parentProduct) cands = catsOf((byParent.get(p.parentProduct) || []).filter(x => x.productId !== p.productId));
      if (!cands.size) cands = catsOf(byParent.get(p.productId) || []);
      out = best(cands);
    }
    // Nothing known about this product: go where the rest of its family went.
    if (!out) out = familyTarget(brand);
    memo.set(key, out);
    return out;
  };
  // Majority child catalogue across every master listing of a family, so a
  // product with no sibling of its own still lands with its family.
  const byBrand = new Map();
  for (const m of master) for (const b of String(m.brand || '').split(',').map(x => x.trim()).filter(Boolean)) { if (!byBrand.has(b)) byBrand.set(b, []); byBrand.get(b).push(m); }
  const familyMemo = new Map();
  const familyTarget = brand => {
    if (familyMemo.has(brand)) return familyMemo.get(brand);
    familyMemo.set(brand, '');                      // guards recursion while computing
    const votes = new Map();
    for (const m of byBrand.get(brand) || []) {
      const same = (byCode.get(normKey(m.code)) || []).filter(x => x.productId !== m.productId);
      let cands = catsOf(same);
      if (!cands.size && m.parentProduct) cands = catsOf((byParent.get(m.parentProduct) || []).filter(x => x.productId !== m.productId));
      if (!cands.size) cands = catsOf(byParent.get(m.productId) || []);
      const t = best(cands); if (t) votes.set(t, (votes.get(t) || 0) + 1);
    }
    const out = [...votes].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || '';
    familyMemo.set(brand, out);
    return out;
  };
  return { resolve, isPrivateLabel, needsRouting, aliases };
}

/** Re-derive ProductTxn.catalogue for the given months (all when empty). Returns counts. */
export async function recomputeCatalogues(months = []) {
  const { resolve, needsRouting } = await buildCatalogueResolver();
  const match = months.length ? { month: { $in: months } } : {};
  const rows = await ProductTxn.find(match, 'brand productId catalogue').lean();
  const ops = []; let labelled = 0, resolved = 0;
  for (const r of rows) {
    const b = r.brand || '';
    const cat = needsRouting(b) ? resolve(b, r.productId) : '';
    if (needsRouting(b)) { labelled++; if (cat) resolved++; }
    if ((r.catalogue || '') !== cat) ops.push({ updateOne: { filter: { _id: r._id }, update: { $set: { catalogue: cat } } } });
  }
  for (let i = 0; i < ops.length; i += 500) await ProductTxn.bulkWrite(ops.slice(i, i + 500), { ordered: false });
  return { lines: rows.length, labelled, resolved, changed: ops.length };
}
