import mongoose from 'mongoose';
import { args, connect } from './_shared.mjs';
import { cloudinaryReady, uploadBuffer } from '../lib/storage.js';
/**
 * Move attachment bytes out of Mongo and on to Cloudinary. Each document
 * keeps its id (so payments still point at it), gains url/publicId and
 * loses `data`. Re-runnable: documents that already have a url are skipped.
 * `--dry-run` prints, `--apply` uploads and unsets the bytes.
 */
const { dryRun, db } = args();
await connect({ db });
if (!cloudinaryReady()) { console.error('Cloudinary is not configured in server/.env (CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET, or CLOUDINARY_URL)'); process.exit(1); }
const C = mongoose.connection.db.collection('col_attachments');
const todo = await C.find({ $or: [{ url: { $in: ['', null] } }, { url: { $exists: false } }], data: { $exists: true } }).project({ mime: 1, size: 1, kind: 1 }).toArray();
console.log(`${todo.length} attachment(s) still in Mongo, ${(todo.reduce((a, d) => a + (d.size || 0), 0) / 1048576).toFixed(2)} MB`);
if (dryRun) { console.log('DRY RUN — nothing written. Re-run with --apply.'); await mongoose.disconnect(); process.exit(0); }
let ok = 0;
for (const t of todo) {
  const full = await C.findOne({ _id: t._id });
  const buf = full.data?.buffer ? Buffer.from(full.data.buffer) : Buffer.from(full.data);
  const up = await uploadBuffer(buf, { mime: t.mime || 'image/jpeg', publicId: String(t._id) });
  await C.updateOne({ _id: t._id }, { $set: { url: up.url, publicId: up.publicId, resourceType: up.resourceType, provider: 'cloudinary' }, $unset: { data: '' } });
  ok++; console.log(`  ${t._id}  ${(buf.length / 1024).toFixed(0)} KB → ${up.url}`);
}
console.log(`moved ${ok} of ${todo.length}`);
await mongoose.disconnect();
