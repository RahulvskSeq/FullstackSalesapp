import { v2 as cloudinary } from 'cloudinary';

/**
 * Where attachment bytes live.
 *
 * With CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET) in
 * the server .env, files go to Cloudinary and Mongo keeps only the URL —
 * the Atlas cluster is a 512 MB shared tier and proof photos were filling
 * it. Without the keys everything keeps working exactly as before, with the
 * bytes stored in the document, so a missing key never blocks a payment.
 */
export function cloudinaryReady() {
  const url = String(process.env.CLOUDINARY_URL || '').trim();
  // A real URL is cloudinary://<key>:<secret>@<cloud>; a placeholder left in
  // the .env (PASTE_SECRET_HERE, <your_api_secret>) must not switch it on.
  if (url) return /^cloudinary:\/\/\d+:[A-Za-z0-9_-]{8,}@[a-z0-9-]+$/i.test(url) && !/paste|secret_here|your_|<|>/i.test(url);
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

let configured = false;
function cfg() {
  if (configured) return;
  if (process.env.CLOUDINARY_URL) cloudinary.config({ secure: true });          // SDK reads CLOUDINARY_URL itself
  else cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  configured = true;
}

/**
 * Upload one file. Returns { url, publicId, bytes, format, resourceType }.
 * PDFs and images both go as resource_type 'auto'; the folder keeps the
 * app's files apart from anything else in the account.
 */
export async function uploadBuffer(buf, { mime = 'application/octet-stream', folder = 'salestracker/collections/proofs', publicId } = {}) {
  cfg();
  const dataUri = `data:${mime};base64,${buf.toString('base64')}`;
  const r = await cloudinary.uploader.upload(dataUri, {
    folder, public_id: publicId, resource_type: 'auto', overwrite: false, unique_filename: true, use_filename: false,
  });
  return { url: r.secure_url, publicId: r.public_id, bytes: r.bytes, format: r.format, resourceType: r.resource_type };
}

export async function deleteUpload(publicId, resourceType = 'image') {
  cfg();
  try { await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }); } catch { /* best effort */ }
}
