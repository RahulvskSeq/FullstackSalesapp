// "Check for updates" — in-app APK update for the Android build.
//
// The repo is private, so the phone can't read GitHub Releases. CI publishes
// each APK to our own server instead (POST /api/app/publish) and this asks
// GET /api/app/version what the newest build is.
//
// The installed build's number is baked in at build time by the workflow
// (VITE_APP_VERSION_CODE). Locally it's undefined, so the button reports that
// rather than pretending to compare.
import React, { useState } from 'react';
import { Download, RefreshCw, Check } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { api } from '../api';
import { notify } from './Toast';

// Vite inlines import.meta.env at build time.
const INSTALLED_CODE = Number(import.meta.env.VITE_APP_VERSION_CODE) || null;
const INSTALLED_NAME = import.meta.env.VITE_APP_VERSION_NAME || null;

// Only meaningful inside the Android shell — a browser can't install an APK.
export const isNativeApp = () =>
  typeof window !== 'undefined' &&
  (!!window.Capacitor?.isNativePlatform?.() || /\bwv\b|Android.*Version\/[\d.]+.*Chrome/.test(navigator.userAgent || ''));

const APK_MIME = 'application/vnd.android.package-archive';

// Reached through Capacitor's runtime registry rather than an import.
//
// The plugin has no web implementation, so importing it made the WEB build
// depend on a native-only package — and the server build failed outright when
// npm skipped it over a peer conflict. Capacitor registers native plugins on
// window at runtime, so the APK still gets the real thing while the browser
// bundle carries no reference to it at all.
const nativeFileOpener = () =>
  (typeof window !== 'undefined' && window.Capacitor?.Plugins?.FileOpener) || null;

export default function UpdateButton({ compact = false }) {
  const [busy, setBusy]     = useState(false);
  const [latest, setLatest] = useState(null);   // newer build, once found
  const [pct, setPct]       = useState(null);   // download progress, 0-100

  const check = async () => {
    setBusy(true);
    try {
      const v = await api.appVersion();
      if (!v || v.versionCode == null) {
        notify.info('No build has been published to the server yet.');
        setLatest(null);
      } else if (INSTALLED_CODE == null) {
        // Dev/browser build — no version was stamped in.
        setLatest(v);
        notify.info(`Latest published build is ${v.versionName}. (This copy has no version stamp — it was not built by CI.)`);
      } else if (v.versionCode > INSTALLED_CODE) {
        setLatest(v);
        notify.success(`Update available: ${v.versionName}`);
      } else {
        setLatest(null);
        notify.success(`You're on the latest version (${INSTALLED_NAME || INSTALLED_CODE}).`);
      }
    } catch (e) {
      notify.error('Update check failed: ' + (e.message || 'network error'));
    }
    setBusy(false);
  };

  // Download inside the app and hand the file to Android's package installer.
  //
  // This used to be window.open(downloadUrl), which threw the user out to
  // Chrome, downloaded there, and left them to find the file in Downloads.
  // Reading the APK here means the progress bar is real and the install
  // dialog comes straight up.
  //
  // The file goes through FileProvider (see file_paths.xml) — handing the
  // installer a raw file:// URI throws FileUriExposedException on Android 7+.
  const install = async () => {
    if (!latest?.downloadUrl) return;
    setBusy(true);
    setPct(0);
    try {
      // XHR, not fetch: fetch cannot report download progress in a way that
      // works across Android WebView versions, and a silent 10 MB wait looks
      // like a hang.
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', latest.downloadUrl);
        xhr.responseType = 'blob';
        xhr.onprogress = (ev) => {
          if (ev.lengthComputable) setPct(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300)
          ? resolve(xhr.response)
          : reject(new Error(`HTTP ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send();
      });

      setPct(100);
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(String(r.result).split(',')[1]);
        r.onerror   = () => reject(new Error('Could not read the download'));
        r.readAsDataURL(blob);
      });

      const fileName = `sales-tracker-${latest.versionName || latest.versionCode}.apk`;
      const written = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.External,   // app-private external dir, covered by FileProvider
      });

      const opener = nativeFileOpener();
      if(!opener) throw new Error('installer unavailable');
      await opener.open({ filePath: written.uri, contentType: APK_MIME });
      notify.info('Tap Install when Android asks.');
    } catch (e) {
      // Falling back to the browser is better than a dead button — the user
      // can still install from Downloads.
      notify.error('In-app install failed (' + (e.message || 'unknown') + '). Opening in the browser instead.');
      try { window.open(latest.downloadUrl, '_blank'); } catch {}
    }
    setPct(null);
    setBusy(false);
  };

  const mb = latest?.sizeBytes ? (latest.sizeBytes / 1048576).toFixed(1) + ' MB' : '';

  // Styling matches the other topbar buttons — same class, size, padding and
  // the hide-sm label — so it sits in the row instead of looking bolted on.
  const base = { fontSize:11, display:'flex', alignItems:'center', gap:4,
                 padding:'6px 8px', flexShrink:0, whiteSpace:'nowrap' };

  // An update is waiting: this is the one state that should pull the eye, so
  // it gets the accent treatment and a pulsing dot rather than blending in.
  if (latest) {
    const downloading = pct !== null;
    return (
      <button onClick={install} disabled={busy} className="btnp"
        title={latest.notes || `Install ${latest.versionName}${mb ? ' · ' + mb : ''}`}
        style={{ ...base, position:'relative', overflow:'hidden', fontWeight:700 }}>
        {downloading && (
          <span style={{
            position:'absolute', left:0, top:0, bottom:0, width:`${pct}%`,
            background:'rgba(255,255,255,0.28)', transition:'width .15s linear',
            pointerEvents:'none',
          }}/>
        )}
        {!downloading && (
          <span style={{
            width:6, height:6, borderRadius:'50%', background:'currentColor',
            flexShrink:0, animation:'pulse 1.6s ease-in-out infinite',
          }}/>
        )}
        <Download size={13} style={{ position:'relative' }}/>
        <span style={{ position:'relative' }}>
          {downloading
            ? (pct < 100 ? `${pct}%` : 'Installing…')
            : <>Update<span className="hide-sm"> {latest.versionName}</span></>}
        </span>
      </button>
    );
  }

  // Idle: quiet. Nothing to do, so it shouldn't compete with the rest of the bar.
  return (
    <button onClick={check} disabled={busy} className="btn"
      title={INSTALLED_NAME ? `You're on ${INSTALLED_NAME} — check for a newer build` : 'Check the server for a newer app build'}
      style={{ ...base, color:'var(--t2)' }}>
      {busy ? <RefreshCw size={13} className="spin"/> : <Download size={13}/>}
      <span className="hide-sm">{busy ? 'Checking…' : 'Update'}</span>
    </button>
  );
}
