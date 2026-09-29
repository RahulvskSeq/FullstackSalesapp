// Save / open a generated file in a way that works both in the browser and
// inside the Android APK.
//
// The browser path is the usual <a download> click. Capacitor's WebView
// ignores that attribute for blob: and data: URLs, so on native the file is
// written to the app cache with @capacitor/filesystem (same dynamic import as
// dealerCard.js) and handed to Android through the FileOpener plugin (read from
// Capacitor's runtime registry, the same way UpdateButton.jsx does, so the web
// bundle never imports the native-only package). The file-opener plugin ships
// its own FileProvider that covers the cache directory. If no app can open the
// file type, the share sheet (@capacitor/share) is offered instead so the user
// can still send it to Drive / WhatsApp / Files.

export const isNative = () =>
  typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();

const nativeFileOpener = () =>
  (typeof window !== 'undefined' && window.Capacitor?.Plugins?.FileOpener) || null;

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onloadend = () => resolve(String(r.result).split(',')[1] || '');
  r.onerror   = () => reject(new Error('Could not read the file'));
  r.readAsDataURL(blob);
});

// Android file names cannot carry path separators or a few reserved characters.
const safeName = (name) => String(name || 'download').replace(/[\\/:*?"<>|]+/g, '_');

const MIME_BY_EXT = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  txt: 'text/plain',
  json: 'application/json',
};
const mimeFromName = (name) => MIME_BY_EXT[String(name).split('.').pop().toLowerCase()] || '';

function webDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** Save (web) or write-and-open (native) a Blob under the given file name. */
export async function saveBlob(blob, filename) {
  const name = safeName(filename);
  if (!isNative()) { webDownload(blob, name); return { ok: true, where: 'Downloads' }; }

  const base64 = await blobToBase64(blob);
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const written = await Filesystem.writeFile({
    path: name,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });
  const blobType = (blob.type || '').split(';')[0];
  const contentType = (blobType && blobType !== 'application/octet-stream' ? blobType : mimeFromName(name)) || blobType || undefined;

  const opener = nativeFileOpener();
  if (opener) {
    try {
      await opener.open({ filePath: written.uri, contentType, openWithDefault: true });
      return { ok: true, uri: written.uri };
    } catch (e) {
      // No app registered for this type — fall through to the share sheet.
      console.warn('FileOpener failed, falling back to share:', e);
    }
  }
  const { Share } = await import('@capacitor/share');
  await Share.share({ title: name, url: written.uri, dialogTitle: 'Save or open ' + name });
  return { ok: true, uri: written.uri };
}

/** Same as saveBlob for text content (CSV etc.). A UTF-8 BOM is kept if passed in. */
export function saveText(text, filename, mime = 'text/plain;charset=utf-8') {
  return saveBlob(new Blob([text], { type: mime }), filename);
}
