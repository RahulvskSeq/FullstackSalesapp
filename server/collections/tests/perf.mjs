import 'dotenv/config';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import '../../models/Dealer.js';
import '../../models/User.js';
import { stageFile, buildPreview } from '../engines/importEngine.js';
import { applyImport } from '../engines/reconcile.js';
import { ColSnapshot, ColBalance, ColCycle } from '../models/index.js';
/** How long a 50,000-party statement takes end to end, and that nothing is lost on the way. */
const N = +(process.argv[2] || 50000);
const db = 'test_col_perf_' + Date.now();
await mongoose.connect(process.env.MONGO_URI, { dbName: db });
const Dealer = mongoose.models.Dealer;
// The cluster is a shared tier with a hard space quota: whatever happens, the scratch database goes.
process.on('uncaughtException', async e => { console.error(e.message); try { await mongoose.connection.dropDatabase(); console.log('scratch dropped (after error)'); } catch {} process.exit(1); });
process.on('unhandledRejection', async e => { console.error(e?.message || e); try { await mongoose.connection.dropDatabase(); console.log('scratch dropped (after error)'); } catch {} process.exit(1); });
const t = (l, s) => console.log(`${l.padEnd(28)} ${((Date.now() - s) / 1000).toFixed(1)}s`);
let s = Date.now();
const dealers = []; for (let i = 1; i <= N; i++) dealers.push({ name: 'PERF DEALER ' + i, code: 'SSL9' + String(i).padStart(5, '0'), salesman: 'none', status: 'ACTIVE' });
for (let i = 0; i < N; i += 5000) await Dealer.insertMany(dealers.slice(i, i + 5000), { ordered: false });
t('dealers seeded', s);
s = Date.now();
const aoa = [['Party Name', 'Jul', 'Aug', 'Sep']]; let sum = 0;
for (let i = 1; i <= N; i++) { const a = (i * 37) % 5000, b = (i * 91) % 7000, c = (i * 13) % 9000; sum += a + b + c; aoa.push([`PERF DEALER ${i}-SSL9${String(i).padStart(5, '0')}`, a, b, c]); }
const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'S'); const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
t(`xlsx built (${(buffer.length / 1e6).toFixed(1)} MB)`, s);
s = Date.now(); const st = await stageFile({ buffer, fileName: 'perf.xlsx', size: buffer.length, user: { id: 'perf', name: 'perf' }, asOn: '2026-09-30' }); t('staged', s);
console.log('  stats', JSON.stringify(st.import.stats));
s = Date.now(); const pv = await buildPreview(st.import._id); t('previewed', s);
s = Date.now(); const done = await applyImport(st.import._id, { by: 'perf', progress: async (n, of, m) => { if (n % 10000 === 0 || n === of) console.log(`  … ${n}/${of} ${m}`); } }); t('applied', s);
console.log('  applied stats', JSON.stringify(done.stats));
const [snaps, bals, cycles, agg] = await Promise.all([ColSnapshot.countDocuments({ importId: st.import._id }), ColBalance.countDocuments({}), ColCycle.countDocuments({ status: 'OPEN' }), ColBalance.aggregate([{ $group: { _id: null, sum: { $sum: '$total' } } }])]);
console.log(`  snapshots ${snaps}  balances ${bals}  open cycles ${cycles}  Σ ${agg[0]?.sum} (file Σ ${sum}) ${agg[0]?.sum === sum && snaps === N ? 'OK' : 'MISMATCH'}`);
s = Date.now(); await ColBalance.find({ total: { $gt: 0 } }).sort({ total: -1 }).skip(25000).limit(50).lean(); t('page 500 of the list', s);
await mongoose.connection.dropDatabase(); await mongoose.disconnect(); console.log('scratch dropped');
