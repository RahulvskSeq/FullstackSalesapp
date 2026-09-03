/**
 * reassign-salesman.mjs
 *
 * Hand every dealer belonging to one or more salesmen over to another, with
 * TODAY as the handover date.
 *
 * It drives the app's own PUT /api/dealers/:id rather than writing to Mongo
 * directly, so it inherits the handover rules already tested there:
 *
 *   - months that already hold data are stamped with the OUTGOING salesman,
 *     so Monthly Entry history stays attributed to whoever earned it;
 *   - `salesmanHistory` gains { salesman: <new>, from: <today> }, which is
 *     what lets each ERP invoice line be credited by its own date — sales
 *     before today stay with the old owner, from today they go to the new.
 *
 * Dry run by default. Pass --apply to write.
 *
 * Usage:
 *   node scripts/reassign-salesman.mjs --from sahil,shivraj --to udai
 *   node scripts/reassign-salesman.mjs --from sahil,shivraj --to udai --apply
 *   ...optionally --api http://localhost:5000/api
 */
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const arg = (name, fallback = '') => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const APPLY = process.argv.includes('--apply');
const FROM = arg('--from').split(',').map(s => s.trim()).filter(Boolean);
const TO = arg('--to').trim();
const API = arg('--api', 'http://localhost:5000/api').replace(/\/$/, '');

if (!FROM.length || !TO) {
  console.error('Usage: --from <id,id> --to <id> [--apply] [--api <url>]');
  process.exit(1);
}
if (!process.env.JWT_SECRET) { console.error('JWT_SECRET missing from .env'); process.exit(1); }

const token = jwt.sign({ id: 'admin', role: 'superadmin', name: 'Admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const H = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

const get = async (p) => {
  const r = await fetch(`${API}${p}`, { headers: H });
  if (!r.ok) throw new Error(`GET ${p} -> ${r.status}`);
  return r.json();
};

console.log(`api  : ${API}`);
console.log(`from : ${FROM.join(', ')}`);
console.log(`to   : ${TO}`);
console.log(`mode : ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}\n`);

// Confirm the destination user exists before moving anything to it.
// /auth/users returns an object keyed by user id, not an array.
const users = await get('/auth/users?includeInactive=1');
const list = Array.isArray(users) ? users : Object.values(users || {});
const byId = new Map(list.filter(u => u && u.id).map(u => [u.id, u]));
// Only the DESTINATION has to be a real user. A source may be a placeholder
// that was never a person — dealers sit under 'none' when unassigned.
if (!byId.has(TO)) {
  console.error(`No such user: "${TO}". Known: ${[...byId.keys()].join(', ')}`);
  process.exit(1);
}
for (const id of FROM) {
  if (!byId.has(id)) console.log(`note: "${id}" is not a user — treating it as an unassigned placeholder`);
}

const raw = await get('/dealers');
const allDealers = Array.isArray(raw) ? raw : (raw.dealers || raw.rows || []);
if (!allDealers.length) { console.error('No dealers returned from /dealers — check the token.'); process.exit(1); }
const dealers = allDealers.filter(d => FROM.includes(d.salesman));
const counts = {};
for (const d of dealers) counts[d.salesman] = (counts[d.salesman] || 0) + 1;

console.log('dealers to move:');
for (const [k, v] of Object.entries(counts)) console.log(`   ${k}: ${v}`);
console.log(`   TOTAL: ${dealers.length}\n`);

if (!APPLY) {
  dealers.slice(0, 15).forEach(d => console.log(`   ${d.salesman} -> ${TO}   ${d.name}`));
  if (dealers.length > 15) console.log(`   ... +${dealers.length - 15} more`);
  console.log('\nDry run — nothing written. Re-run with --apply.');
  process.exit(0);
}

let ok = 0, failed = 0;
for (const d of dealers) {
  try {
    const r = await fetch(`${API}/dealers/${d._id || d.id}`, {
      method: 'PUT', headers: H, body: JSON.stringify({ salesman: TO }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    ok++;
    if (ok % 25 === 0) console.log(`   ...${ok}/${dealers.length}`);
  } catch (e) {
    failed++;
    console.warn(`   FAILED  ${d.name}: ${e.message}`);
  }
}
console.log(`\nreassigned : ${ok}`);
console.log(`failed     : ${failed}`);
console.log('\nPast sales are unchanged. ERP lines dated from today onward will');
console.log('credit the new salesman on the next import of those dates.');
