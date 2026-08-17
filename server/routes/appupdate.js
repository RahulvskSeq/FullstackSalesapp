// In-app update channel.
//
// The GitHub repo is private, so the phone cannot read GitHub Releases without
// embedding a token. Instead CI uploads each APK here and the app asks this
// server what the newest build is.
//
//   GET  /api/app/version            → what's the latest build?      (public)
//   GET  /api/app/download           → download that APK             (public)
//   POST /api/app/publish            → CI uploads a new APK          (API key)
//
// The APK lives in GridFS rather than on disk so it survives a server redeploy
// (container filesystems are wiped on every deploy).
import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import Setting from '../models/Setting.js';

const router = express.Router();
// APKs are ~10-30 MB; keep them in memory only long enough to stream to GridFS.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 120 * 1024 * 1024 } });

const SETTING_KEY = 'appRelease';
const BUCKET      = 'apk';

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });

// ── GET /api/app/version ──────────────────────────────────────────────────
// Deliberately unauthenticated: the updater runs before/independently of login.
// Returns nulls (not an error) when nothing has been published yet.
router.get('/version', async (req, res) => {
  try {
    const s = await Setting.findOne({ key: SETTING_KEY }).lean();
    const v = s?.value || null;
    res.json({
      versionCode: v?.versionCode ?? null,
      versionName: v?.versionName ?? null,
      notes:       v?.notes || '',
      sizeBytes:   v?.sizeBytes ?? null,
      publishedAt: v?.publishedAt || null,
      // Absolute URL so the Android download manager can resolve it.
      downloadUrl: v ? `${req.protocol}://${req.get('host')}/api/app/download` : null,
    });
  } catch (e) {
    console.error('[APP/version]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/app/download ─────────────────────────────────────────────────
// Streams the published APK. Public by design — the phone hits this straight
// from the browser/download manager, which cannot send an auth header.
router.get('/download', async (req, res) => {
  try {
    const s = await Setting.findOne({ key: SETTING_KEY }).lean();
    const fileId = s?.value?.fileId;
    if (!fileId) return res.status(404).json({ error: 'No APK has been published yet' });

    const _id = new mongoose.Types.ObjectId(String(fileId));
    const files = await bucket().find({ _id }).toArray();
    if (!files.length) return res.status(404).json({ error: 'Published APK is missing from storage' });

    res.set({
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': files[0].length,
      'Content-Disposition': `attachment; filename="sales-tracker-${s.value.versionName || 'latest'}.apk"`,
      'Cache-Control': 'no-cache',
    });
    bucket().openDownloadStream(_id)
      .on('error', e => { console.error('[APP/download]', e.message); res.destroy(); })
      .pipe(res);
  } catch (e) {
    console.error('[APP/download]', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/app/publish ─────────────────────────────────────────────────
// Called by the GitHub Actions workflow. Auth is the same shared-key pattern
// used by the Tally and attendance feeds — CI has no user session.
// multipart: file=<apk>, versionCode, versionName, notes
router.post('/publish', upload.single('file'), async (req, res) => {
  try {
    const expected = process.env.APP_PUBLISH_KEY;
    if (!expected) return res.status(503).json({ error: 'Publishing not configured — set APP_PUBLISH_KEY in server .env' });
    const key = req.headers['x-api-key'] || req.query.key;
    if (!key || String(key) !== String(expected)) return res.status(401).json({ error: 'Invalid or missing API key' });
    if (!req.file) return res.status(400).json({ error: 'file (apk) required' });

    const versionCode = parseInt(req.body?.versionCode, 10);
    if (!Number.isFinite(versionCode)) return res.status(400).json({ error: 'versionCode must be a number' });
    const versionName = String(req.body?.versionName || '').trim() || String(versionCode);

    // Store the new APK first, so a failure here never orphans the pointer.
    const b = bucket();
    const fileId = await new Promise((resolve, reject) => {
      const ws = b.openUploadStream(`app-${versionCode}.apk`, { contentType: 'application/vnd.android.package-archive' });
      ws.on('error', reject);
      ws.on('finish', () => resolve(ws.id));
      ws.end(req.file.buffer);
    });

    const prev = await Setting.findOne({ key: SETTING_KEY }).lean();
    await Setting.findOneAndUpdate(
      { key: SETTING_KEY },
      { value: {
          versionCode, versionName,
          notes: String(req.body?.notes || '').slice(0, 1000),
          fileId: String(fileId),
          sizeBytes: req.file.size,
          publishedAt: new Date().toISOString(),
        } },
      { upsert: true },
    );

    // Only now drop the previous binary — keeps downloads working throughout.
    if (prev?.value?.fileId) {
      try { await b.delete(new mongoose.Types.ObjectId(String(prev.value.fileId))); }
      catch (e) { console.warn('[APP/publish] old APK cleanup skipped:', e.message); }
    }

    console.log(`[APP/publish] v${versionName} (code ${versionCode}), ${(req.file.size/1048576).toFixed(1)} MB`);
    res.json({ ok: true, versionCode, versionName, sizeBytes: req.file.size });
  } catch (e) {
    console.error('[APP/publish]', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
