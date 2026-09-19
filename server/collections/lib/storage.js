import { v2 as cloudinary } from 'cloudinary';

/**
 * Where attachment bytes live.
 *
 * Two ways to switch Cloudinary on from the server .env:
 *   1. Unsigned preset (no secret on the server):
 *        CLOUDINARY_CLOUD_NAME=<cloud>  CLOUDINARY_UPLOAD_PRESET=<preset>
 *      The preset is created once in the Cloudinary console with
 *      Signing mode = Unsigned. Uploads work; deletes are not possible.
 *   2. Full credentials: CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud>
 *      (or CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET). Uploads are
 *      signed and deletes work too.
 *
 * Files go to Cloudinary and Mongo keeps only the URL — the Atlas cluster is
 * a 512 MB shared tier and proof photos were filling it. Without any of the
 * keys everything keeps working exactly as before, with the bytes stored in
 * the document, so a missing key never blocks a payment.
 */
const PLACEHOLDER = /paste|secret_here|your_|<|>/i;

function fullCreds() {
  const url = String(process.env.CLOUDINARY_URL || '').trim();
  // A real URL is cloudinary://<key>:<secret>@<cloud>; a placeholder left in
  // the .env (PASTE_SECRET_HERE, <your_api_secret>) must not switch it on.
  if (url) return /^cloudinary:\/\/\d+:[A-Za-z0-9_-]{8,}@[a-z0-9-]+$/i.test(url) && !PLACEHOLDER.test(url);
  const { CLOUDINARY_CLOUD_NAME: c, CLOUDINARY_API_KEY: k, CLOUDINARY_API_SECRET: s } = process.env;
  return !!(c && k && s) && !PLACEHOLDER.test(s);
}

function cloudName() {
  const url = String(process.env.CLOUDINARY_URL || '').trim();
  const m = url.match(/@([a-z0-9-]+)$/i);
  return String(process.env.CLOUDINARY_CLOUD_NAME || (m && m[1]) || '').trim();
}

function unsignedPreset() {
  const p = String(process.env.CLOUDINARY_UPLOAD_PRESET || '').trim();
  return p && !PLACEHOLDER.test(p) && cloudName() ? p : '';
}

export function cloudinaryReady() { return fullCreds() || !!unsignedPreset(); }

let configured = false;
function cfg() {
  if (configured) return;
  if (fullCreds()) {
    if (process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_API_SECRET) cloudinary.config({ secure: true }); // SDK reads CLOUDINARY_URL itself
    else cloudinary.config({ cloud_name: cloudName(), api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  } else {
    cloudinary.config({ cloud_name: cloudName(), secure: true });
  }
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
  let r;
  if (fullCreds()) {
    r = await cloudinary.uploader.upload(dataUri, {
      folder, public_id: publicId, resource_type: 'auto', overwrite: false, unique_filename: true, use_filename: false,
    });
  } else {
    // Unsigned: only the preset's whitelisted options may be sent. The
    // folder comes from the preset (asset folder); public_id is allowed.
    r = await cloudinary.uploader.unsigned_upload(dataUri, unsignedPreset(), {
      resource_type: 'auto', ...(publicId ? { public_id: publicId } : {}),
    });
  }
  return { url: r.secure_url, publicId: r.public_id, bytes: r.bytes, format: r.format, resourceType: r.resource_type };
}

/** Best effort; unsigned mode has no secret so the asset stays (harmless). */
export async function deleteUpload(publicId, resourceType = 'image') {
  if (!fullCreds()) return;
  cfg();
  try { await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }); } catch { /* best effort */ }
}
