// Voice-to-text wrapper. Renders any <input> or <textarea> as a child with
// a microphone button overlaid in the top-right corner. Click the mic →
// browser starts SpeechRecognition → recognised text gets APPENDED to the
// current value (preserving anything the user already typed).
//
// Works in:
//   * Chrome / Edge (desktop + Android)
//   * Safari iOS (uses webkitSpeechRecognition)
//   * Capacitor APK WebView (since it's Chrome-based)
//
// Graceful degradation: if the browser has no SpeechRecognition API, the
// mic button is hidden and the wrapper falls back to a plain textarea/input.

import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square } from 'lucide-react';

const SR = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

// Translate any spoken text into English using the free MyMemory API.
// We pass `Autodetect|en` so MyMemory figures out the source language —
// no per-user setup needed. ~5000 chars/day per IP. If the call fails the
// original transcript is kept so the user never loses what they said.
async function translateToEnglish(text, sourceHint){
  if(!text || !text.trim()) return '';
  const looksEnglish = /^[\x00-\x7F]+$/.test(text); // ASCII-only → already English
  if(looksEnglish) return text;
  // Use the source-language hint if we have it, otherwise let MyMemory
  // autodetect. The hint speeds up the response when known.
  const src = (sourceHint || '').slice(0,2).toLowerCase();
  const from = (src && src !== 'en') ? src : 'Autodetect';
  try {
    const url = 'https://api.mymemory.translated.net/get?q=' +
                encodeURIComponent(text) +
                '&langpair=' + encodeURIComponent(from) + '%7Cen';
    const r = await fetch(url, {
      headers: { 'Accept':'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if(!r.ok) throw new Error('translate http ' + r.status);
    const j = await r.json();
    const out = j?.responseData?.translatedText;
    if(out && typeof out === 'string' && out.trim()) return out;
    return text;
  } catch(e){
    console.warn('[translate]', e.message);
    return text;
  }
}

// Default recognition language = device language. The Speech API can't
// magically multi-recognise, but using `navigator.language` matches the
// most common case (phone is set to user's mother tongue) and the
// post-recognition translation step normalises everything to English anyway.
function defaultRecogLang(){
  try {
    if(typeof navigator !== 'undefined' && navigator.language) return navigator.language;
  } catch{}
  return 'en-IN';
}
const IS_NATIVE = !!(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform && window.Capacitor.isNativePlatform());
// On native (APK) we use the Capacitor plugin which goes through the device's
// built-in speech engine (Google Speech / vendor). On web we use the standard
// SpeechRecognition API.
const SUPPORTED = !!SR || IS_NATIVE;

// Persist the chosen language in localStorage so the user only picks it once.
const LANG_KEY = 'stp_voice_lang';
const LANGUAGES = [
  { code:'en-IN', label:'English (India)' },
  { code:'en-US', label:'English (US)' },
  { code:'hi-IN', label:'हिन्दी (Hindi)' },
  { code:'mr-IN', label:'मराठी (Marathi)' },
  { code:'ta-IN', label:'தமிழ் (Tamil)' },
  { code:'te-IN', label:'తెలుగు (Telugu)' },
  { code:'gu-IN', label:'ગુજરાતી (Gujarati)' },
  { code:'kn-IN', label:'ಕನ್ನಡ (Kannada)' },
  { code:'ml-IN', label:'മലയാളം (Malayalam)' },
  { code:'pa-IN', label:'ਪੰਜਾਬੀ (Punjabi)' },
  { code:'bn-IN', label:'বাংলা (Bengali)' },
];

function useVoice({ lang, onResult }){
  const recRef = useRef(null);              // web SpeechRecognition instance
  const nativeListenerRef = useRef(null);   // capacitor plugin listener handle
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');

  // Always-fresh callback ref so the recognition handler uses the latest one
  const onResultRef = useRef(onResult);
  useEffect(()=>{ onResultRef.current = onResult; }, [onResult]);

  // ── Native (Capacitor APK) path ──────────────────────────────────────
  // The Capacitor plugin in v6 stops listening automatically after ~7s of
  // silence on Android and won't always re-fire `partialResults` cleanly,
  // so we:
  //   * keep the captured text in a ref (lastTextRef) updated on every
  //     partialResults event
  //   * also listen for `listeningState` so when Android stops automatically
  //     we commit and update React state (so the user sees the change too)
  //   * on user-tap stop, call SR.stop() and commit lastTextRef
  const lastTextRef = useRef('');
  const startNative = async () => {
    try {
      const mod = await import('@capacitor-community/speech-recognition');
      const SR_PLUGIN = mod.SpeechRecognition;
      try { await SR_PLUGIN.requestPermissions(); } catch{}
      let availResp = { available:false };
      try { availResp = await SR_PLUGIN.available(); } catch{}
      if(!availResp?.available){
        setError('Speech recognition not available on this device');
        return false;
      }
      // Clean previous listeners to avoid duplicate commits
      try { await SR_PLUGIN.removeAllListeners(); } catch{}

      lastTextRef.current = '';
      const commit = () => {
        const text = lastTextRef.current?.trim();
        if(text && onResultRef.current) onResultRef.current(text);
        lastTextRef.current = '';
      };

      const partialHandle = await SR_PLUGIN.addListener('partialResults', (data) => {
        const matches = data?.matches || [];
        if(matches.length){
          // Plugin gives the FULL guess for the current utterance — replace,
          // don't append, so we don't get "hello hello hello".
          lastTextRef.current = matches[0] || '';
        }
      });
      const stateHandle = await SR_PLUGIN.addListener('listeningState', (data) => {
        // Android can stop on its own after silence — capture that here.
        if(data?.status === 'stopped'){
          commit();
          setRecording(false);
        }
      });

      nativeListenerRef.current = { partialHandle, stateHandle, commit, SR_PLUGIN };

      await SR_PLUGIN.start({
        language: lang || 'en-IN',
        maxResults: 1,
        prompt: '',
        partialResults: true,
        popup: false,
      });
      setRecording(true);
      setError('');
      return true;
    } catch(e){
      setError(e?.message || 'mic error');
      setRecording(false);
      return false;
    }
  };
  const stopNative = async () => {
    // 1) Flip UI to "not recording" IMMEDIATELY so the button changes back
    //    even if the native plugin is slow / unresponsive. This is what the
    //    user notices first — tap, button flips, mic icon returns.
    setRecording(false);
    const refSnap = nativeListenerRef.current;
    nativeListenerRef.current = null;

    // 2) Commit any captured partial RIGHT AWAY so the text shows up before
    //    we even bother to fully stop the plugin.
    const text = lastTextRef.current?.trim();
    lastTextRef.current = '';
    if(text && onResultRef.current) onResultRef.current(text);

    // 3) Fire-and-forget the native stop + listener cleanup. We don't await
    //    here because Android's SR.stop() sometimes hangs for several
    //    seconds before returning; the user already sees the UI updated.
    (async () => {
      try {
        const SR_PLUGIN = refSnap?.SR_PLUGIN
          || (await import('@capacitor-community/speech-recognition')).SpeechRecognition;
        try { await SR_PLUGIN.stop(); } catch{}
        try { await SR_PLUGIN.removeAllListeners(); } catch{}
      } catch{}
    })();
  };

  // ── Web (browser) path ───────────────────────────────────────────────
  const startWeb = () => {
    if(!SR){ setError('Speech recognition not supported in this browser'); return false; }
    if(recRef.current){ try{ recRef.current.stop(); }catch{} }
    const rec = new SR();
    rec.lang = lang || 'en-IN';
    rec.continuous     = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      let txt = '';
      for(let i = ev.resultIndex; i < ev.results.length; i++){
        if(ev.results[i].isFinal) txt += ev.results[i][0].transcript + ' ';
      }
      if(txt && onResultRef.current) onResultRef.current(txt.trim());
    };
    rec.onerror = (e) => { setError(e.error || 'mic error'); setRecording(false); };
    rec.onend = () => setRecording(false);
    try {
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setError('');
      return true;
    } catch(e){ setError(e.message); return false; }
  };
  const stopWeb = () => {
    if(recRef.current){ try{ recRef.current.stop(); }catch{} }
    setRecording(false);
  };

  const start = () => IS_NATIVE ? startNative() : startWeb();
  const stop  = () => IS_NATIVE ? stopNative()  : stopWeb();

  // Stop on unmount
  useEffect(()=>()=>{
    try{ recRef.current?.stop(); }catch{}
    if(IS_NATIVE){ stopNative().catch(()=>{}); }
  }, []);
  return { recording, error, start, stop };
}

// Animated 4-bar waveform shown while recording. Each bar bounces at its own
// pace so it actually looks "alive" instead of just a static red blob.
function WaveBars(){
  const bars = [0, 0.15, 0.3, 0.45];
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:2, height:14}}>
      {bars.map((delay, i) => (
        <span key={i} style={{
          width:2.5, height:'100%', background:'#fff',
          borderRadius:1,
          animation: 'stpVoiceBar 0.9s ease-in-out infinite',
          animationDelay: delay + 's',
          transformOrigin:'center',
        }}/>
      ))}
    </span>
  );
}

// Inline keyframes — self-contained so we don't depend on Styles.jsx
function Keyframes(){
  return (
    <style>{`
      @keyframes stpVoiceBar {
        0%,100% { transform: scaleY(0.35); }
        50%     { transform: scaleY(1);    }
      }
      @keyframes stpVoicePulse {
        0%   { box-shadow: 0 0 0 0   rgba(220,38,38,0.55); }
        70%  { box-shadow: 0 0 0 10px rgba(220,38,38,0);    }
        100% { box-shadow: 0 0 0 0   rgba(220,38,38,0);    }
      }
    `}</style>
  );
}

// Shared rendering: textarea or input + mic button overlay.
// No language picker — recognition runs in the device's default language
// and every result is auto-translated to English before it lands in the
// field. The user just taps mic and talks.
function VoiceField({ as='textarea', value, onChange, placeholder='', className='inp', rows=3, style, ...rest }){
  const lang = defaultRecogLang();
  const [translating, setTranslating] = useState(false);

  // Stash latest value in a ref so we can append to the freshest text even
  // if React hasn't re-rendered yet (multiple rapid partial commits).
  const valueRef = useRef(value);
  useEffect(()=>{ valueRef.current = value; }, [value]);

  // appendTranscript now ALWAYS converts the spoken text to English before
  // adding it to the note. If the user picked Hindi/Marathi/etc., the
  // recogniser still transcribes in that language (best quality), then we
  // translate to English via the MyMemory API, then drop the English into
  // the field. If translation fails, we fall back to the original transcript
  // so the user never loses their words.
  const appendTranscript = async (t) => {
    if(!t) return;
    const sourceCode = (lang || 'en-IN').slice(0,2).toLowerCase();
    let final = t;
    if(sourceCode && sourceCode !== 'en'){
      setTranslating(true);
      try {
        final = await translateToEnglish(t, lang);
      } finally {
        setTranslating(false);
      }
    }
    const current = valueRef.current || '';
    const sep = !current || /[\s\n]$/.test(current) ? '' : ' ';
    const next = current + sep + final;
    valueRef.current = next;     // keep ref in sync immediately
    onChange?.(next);
  };
  const { recording, error, start, stop } = useVoice({ lang, onResult: appendTranscript });

  const onMicClick = async () => {
    try {
      if(recording) await stop();
      else await start();
    } catch(e){
      // Never leave the user stuck — last-resort recovery.
      console.warn('[VoiceInput onMicClick]', e?.message || e);
    }
  };

  // Default heights — generous so users have room to type / dictate without
  // the box feeling cramped. Caller can still pass `style.minHeight`.
  const DEFAULT_MIN_H = as === 'input' ? 44 : 110;
  const sharedStyle = {
    paddingRight: 14,
    paddingBottom: as === 'input' ? undefined : 56, // room for the mic pill at bottom-right
    minHeight: DEFAULT_MIN_H,
    fontSize: 13,
    lineHeight: 1.5,
    ...style,
  };
  const Tag = as === 'input' ? 'input' : 'textarea';
  const inputProps = as === 'input'
    ? { value: value||'', onChange:(e)=>onChange?.(e.target.value), placeholder, className, style: sharedStyle, ...rest }
    : { value: value||'', onChange:(e)=>onChange?.(e.target.value), placeholder, className, rows, style:{ resize:'vertical', fontFamily:'inherit', ...sharedStyle }, ...rest };

  return (
    <div style={{position:'relative'}}>
      <Keyframes/>
      <Tag {...inputProps}/>

      {/* Voice controls in the bottom-right corner of the field */}
      {SUPPORTED && (
        <div style={{
          position:'absolute',
          bottom: as === 'input' ? '50%' : 10,
          right: 10,
          transform: as === 'input' ? 'translateY(50%)' : 'none',
          display:'flex', alignItems:'center', gap:6,
        }}>
          {/* While MyMemory is converting the dictated text to English,
              show a small "Translating…" pill — replaces any picker. */}
          {translating && (
            <div style={{
              fontSize:9, padding:'4px 7px', borderRadius:5,
              background:'rgba(251,191,36,0.15)', color:'var(--yel)',
              border:'1px solid rgba(251,191,36,0.35)',
              fontWeight:700, letterSpacing:'.04em',
            }}>
              Translating…
            </div>
          )}

          {/* Icon-only mic button. While recording shows the animated bars;
              while idle shows just the mic icon. No label text. */}
          <button type="button"
            onClick={onMicClick}
            title={recording ? 'Tap to stop recording' : 'Tap and speak'}
            aria-label={recording ? 'Stop recording' : 'Start voice input'}
            style={{
              width: 36, height: 36,
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              borderRadius: '50%',
              padding: 0,
              cursor:'pointer',
              transition:'all .15s',
              background: recording ? '#dc2626' : 'var(--acc)',
              color:'#fff',
              border: '1px solid ' + (recording ? '#b91c1c' : 'transparent'),
              boxShadow: recording ? '0 0 0 0 rgba(220,38,38,0.55)' : '0 2px 8px rgba(0,0,0,0.25)',
              animation: recording ? 'stpVoicePulse 1.4s ease-out infinite' : 'none',
            }}>
            {recording ? <WaveBars/> : <Mic size={16}/>}
          </button>
        </div>
      )}

      {error && (
        <div style={{fontSize:10, color:'var(--yel)', marginTop:3}}>{error}</div>
      )}
    </div>
  );
}

export function VoiceTextarea(props){ return <VoiceField as="textarea" {...props}/>; }
export function VoiceInput(props){    return <VoiceField as="input"    {...props}/>; }
export const VOICE_SUPPORTED = SUPPORTED;
