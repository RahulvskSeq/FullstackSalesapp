/**
 * What a check-in needs, shared by the Visits page and the dealer visit modal:
 * the preset purposes, a compressed camera photo, and the phone's position.
 */
export const VISIT_PURPOSES = [
  'Business Approach',
  'Sample Submission',
  'Order Follow Up',
  'Payment Follow Up',
  'Cheque Collection',
  'New Dealer Meet',
  'Service / Product Issue',
  'App Installation',
  'Presentation',
];

export async function fileToCompressedDataURL(file, maxDim = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Cannot read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Bad image'));
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale); height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/** { lat, lng } — the Capacitor plugin inside the APK, the browser API on the web; nulls when neither answers in time. */
export async function getLocation(timeoutMs = 10000) {
  const isNative = !!(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform());
  if (isNative) {
    try {
      const { Geolocation: Geo } = await import('@capacitor/geolocation');
      try { await Geo.requestPermissions({ permissions: ['location'] }); } catch {}
      const pos = await Geo.getCurrentPosition({ enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (e) { console.warn('[geo native]', e?.message || e); }
  }
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null });
    const timer = setTimeout(() => resolve({ lat: null, lng: null }), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      pos => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
      () => { clearTimeout(timer); resolve({ lat: null, lng: null }); },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: timeoutMs });
  });
}
