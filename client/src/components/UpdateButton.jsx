// "Check for updates" — manual APK update check for the Android build.
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
import { api } from '../api';
import { notify } from './Toast';

// Vite inlines import.meta.env at build time.
const INSTALLED_CODE = Number(import.meta.env.VITE_APP_VERSION_CODE) || null;
const INSTALLED_NAME = import.meta.env.VITE_APP_VERSION_NAME || null;

// Only meaningful inside the Android shell — a browser can't install an APK.
export const isNativeApp = () =>
  typeof window !== 'undefined' &&
  (!!window.Capacitor?.isNativePlatform?.() || /\bwv\b|Android.*Version\/[\d.]+.*Chrome/.test(navigator.userAgent || ''));

export default function UpdateButton({ compact = false }) {
  const [busy, setBusy]     = useState(false);
  const [latest, setLatest] = useState(null);   // newer build, once found

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

  const install = () => {
    if (!latest?.downloadUrl) return;
    // Hand off to the system download manager; Android then offers to install.
    // Requires "Install unknown apps" for the browser/downloader once.
    window.open(latest.downloadUrl, '_blank');
    notify.info('Downloading… open the file when it finishes to install.');
  };

  const mb = latest?.sizeBytes ? (latest.sizeBytes / 1048576).toFixed(1) + ' MB' : '';

  if (latest) {
    return (
      <button onClick={install} className="btnp"
        title={latest.notes || `Install ${latest.versionName}`}
        style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, whiteSpace:'nowrap' }}>
        <Download size={13}/> Update to {latest.versionName}{mb ? ` · ${mb}` : ''}
      </button>
    );
  }

  return (
    <button onClick={check} disabled={busy} className="btn"
      title={INSTALLED_NAME ? `Installed version ${INSTALLED_NAME}` : 'Check the server for a newer app build'}
      style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, whiteSpace:'nowrap' }}>
      {busy ? <RefreshCw size={13} className="spin"/> : <Check size={13}/>}
      {compact ? (busy ? '' : 'Update') : (busy ? 'Checking…' : 'Check for updates')}
    </button>
  );
}
