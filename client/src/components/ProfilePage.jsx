import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera, Lock, Trash2, Phone, MessageCircle, Mail, User, Calendar, Droplet, Languages,
  MapPin, HeartPulse, Palette, ShieldCheck, KeyRound, Eye, EyeOff, Info, Check, RotateCcw,
  Save, AlertTriangle, RefreshCw, Loader2, AtSign, Briefcase, Home, UserCircle2, Contact,
  CheckCircle2, Sparkles, LogOut,
} from 'lucide-react';
import { api } from '../api';
import { notify, confirmDialog } from './Toast';
import { PageHead } from '../collections/ui';

// ── "My profile" — each person edits their own contact / personal details ──
// Name, username, role, employee code, work email and permissions stay with
// the admin (dealers, sales and access are tied to them); the server refuses
// them on this route, so they are shown read-only with a lock.

const FIELDS = [
  'phone', 'whatsapp', 'altPhone', 'personalEmail', 'dob', 'bloodGroup', 'languages', 'bio',
  'address', 'city', 'state', 'pincode', 'emergencyName', 'emergencyRel', 'emergencyPhone',
];
const LABELS = {
  phone: 'Phone', whatsapp: 'WhatsApp', altPhone: 'Alternate phone', personalEmail: 'Personal email',
  dob: 'Date of birth', bloodGroup: 'Blood group', languages: 'Languages', bio: 'About me',
  address: 'Address', city: 'City', state: 'State', pincode: 'PIN code',
  emergencyName: 'Emergency contact name', emergencyRel: 'Emergency relation', emergencyPhone: 'Emergency phone',
};
// same limits the server applies (routes/auth.js PROFILE_FIELDS)
const MAXLEN = {
  phone: 30, whatsapp: 30, altPhone: 30, personalEmail: 120, dob: 10, bloodGroup: 5,
  address: 300, city: 60, state: 60, pincode: 6, emergencyName: 80, emergencyRel: 40,
  emergencyPhone: 30, languages: 120, bio: 500,
};
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const SWATCHES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b', '#14b8a6', '#f97316'];
const ROLES = {
  superadmin: { label: 'Super admin', c: '#f59e0b' },
  admin:      { label: 'Admin',       c: '#8b5cf6' },
  employee:   { label: 'Employee',    c: '#06b6d4' },
  salesman:   { label: 'Salesman',    c: '#10b981' },
};
const PHONE_RE = /^[+\d][\d\s-]{5,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHOTO_LIMIT = 380 * 1024;   // server cap is 400KB — leave headroom
const AVATAR_LIMIT = 38 * 1024;   // server cap is 40KB
const BLOCK_RE = /imperson|own account/i;

const blankProfile = () => FIELDS.reduce((o, k) => { o[k] = ''; return o; }, {});
const fromServer = (p) => { const o = blankProfile(); FIELDS.forEach(k => { o[k] = p?.[k] == null ? '' : String(p[k]); }); return o; };
const initialsOf = (u) => (u?.ini || (u?.name || '?').split(/\s+/).map(w => w[0]).join('').replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || '?').toUpperCase();
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

function validate(k, raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (/phone|whatsapp/i.test(k) && !PHONE_RE.test(v)) return 'Use digits, spaces, - and an optional leading + (at least 6)';
  if (k === 'personalEmail' && !EMAIL_RE.test(v)) return 'That email looks wrong';
  if (k === 'pincode' && !/^\d{6}$/.test(v)) return 'PIN code must be 6 digits';
  if (k === 'dob') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Pick a date';
    if (v > todayISO()) return "Date of birth can't be in the future";
  }
  if (v.length > (k === 'pincode' ? 10 : MAXLEN[k])) return 'Too long';
  return '';
}

// ── image helpers: centre-crop to a square JPEG ────────────────────────────
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read that picture — try a JPEG or PNG")); };
    img.src = url;
  });
}
function squareJpeg(img, size, quality) {
  const w = img.naturalWidth, h = img.naturalHeight, s = Math.min(w, h);
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';                 // JPEG has no alpha — flatten transparent PNGs onto white
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL('image/jpeg', quality);
}
function encodeUnder(img, size, startQ, limit) {
  let q = startQ, out = squareJpeg(img, size, q);
  while (out.length > limit && q > 0.35) { q = Math.round((q - 0.1) * 100) / 100; out = squareJpeg(img, size, q); }
  if (out.length > limit) throw new Error('Photo too large — pick a smaller picture');
  return out;
}

function passStrength(p) {
  if (!p) return { score: 0, label: '', c: 'var(--b2)' };
  let s = 0;
  if (p.length >= 6) s++;
  if (p.length >= 10) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (p.length < 4) return { score: 1, label: 'Too short — at least 4 characters', c: 'var(--red)' };
  if (s <= 1) return { score: 1, label: 'Weak — add length, numbers or symbols', c: 'var(--red)' };
  if (s === 2) return { score: 2, label: 'Fair', c: 'var(--yel)' };
  if (s === 3) return { score: 3, label: 'Good', c: '#3b82f6' };
  return { score: 4, label: 'Strong', c: 'var(--grn)' };
}

// ── scoped styles ──────────────────────────────────────────────────────────
const CSS = `
.pf-page{max-width:1180px;margin:0 auto;padding-bottom:8px}
.pf-rise{animation:pfRise .5s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0) * 70ms)}
@keyframes pfRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes pfPan{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes pfFloatA{0%{transform:translate(0,0) scale(1)}100%{transform:translate(60px,22px) scale(1.15)}}
@keyframes pfFloatB{0%{transform:translate(0,0) scale(1.1)}100%{transform:translate(-70px,-18px) scale(.9)}}
@keyframes pfBar{from{opacity:0;transform:translateY(22px) scale(.98)}to{opacity:1;transform:none}}
@keyframes pfPop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
@keyframes pfSpin{to{transform:rotate(360deg)}}

.pf-hero{padding:0!important;overflow:hidden;position:relative}
.pf-cover{position:relative;height:138px;overflow:hidden;color:#fff;
  background:linear-gradient(120deg,var(--pf-c) 0%,#8b5cf6 38%,#06b6d4 70%,var(--pf-c) 100%);
  background-size:260% 260%;animation:pfPan 22s ease-in-out infinite}
.pf-cover::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,0) 35%,rgba(15,23,42,.28) 100%);pointer-events:none}
.pf-orb{position:absolute;border-radius:50%;filter:blur(30px);pointer-events:none;opacity:.55}
.pf-orb.a{width:190px;height:190px;left:6%;top:-70px;background:rgba(255,255,255,.55);animation:pfFloatA 11s ease-in-out infinite alternate}
.pf-orb.b{width:230px;height:230px;right:4%;top:-40px;background:color-mix(in srgb,#ec4899 70%,transparent);animation:pfFloatB 14s ease-in-out infinite alternate}
.pf-cover-txt{position:absolute;left:20px;top:16px;right:20px;z-index:1;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.pf-cover-eyebrow{font-size:10.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.92;display:inline-flex;align-items:center;gap:6px}
.pf-cover-since{font-size:11.5px;font-weight:600;opacity:.9;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);border-radius:20px;padding:3px 10px;backdrop-filter:blur(6px)}

.pf-hero-body{display:flex;align-items:flex-end;gap:18px;padding:0 20px 18px;flex-wrap:wrap}
.pf-photo-wrap{position:relative;margin-top:-58px;flex-shrink:0;z-index:2}
.pf-photo{width:116px;height:116px;border-radius:50%;border:4px solid var(--bg1);display:grid;place-items:center;overflow:hidden;
  font-size:38px;font-weight:800;letter-spacing:.02em;box-shadow:0 10px 30px color-mix(in srgb,var(--pf-c) 30%,transparent);
  background:color-mix(in srgb,var(--pf-c) 20%,var(--bg1));color:var(--pf-c);transition:background .25s,color .25s}
.pf-photo img{width:100%;height:100%;object-fit:cover;display:block}
.pf-photo-busy{position:absolute;inset:4px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--bg1) 55%,transparent);color:var(--t1)}
.pf-spin{animation:pfSpin .9s linear infinite}
.pf-cam{position:absolute;right:2px;bottom:4px;width:36px;height:36px;border-radius:50%!important;padding:0!important;display:grid!important;place-items:center;
  border:3px solid var(--bg1)!important;box-shadow:0 4px 14px color-mix(in srgb,var(--acc) 35%,transparent)}
.pf-id{flex:1 1 260px;min-width:0;padding-top:10px}
.pf-name-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pf-name{font-size:24px;font-weight:800;color:var(--t1);letter-spacing:-.02em;line-height:1.15;overflow-wrap:anywhere}
.pf-tip{position:relative;display:inline-grid;place-items:center;width:26px;height:26px;border-radius:8px;border:1px solid var(--b1);background:var(--bg2);color:var(--t3);cursor:help;padding:0}
.pf-tip:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
.pf-tip::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 8px);right:-6px;width:max-content;max-width:230px;white-space:normal;text-align:left;
  font-size:11.5px;font-weight:600;line-height:1.4;color:var(--t1);background:var(--bg1);border:1px solid var(--b2);border-radius:10px;padding:8px 10px;
  box-shadow:0 10px 26px rgba(16,24,40,.16);opacity:0;transform:translateY(4px);pointer-events:none;transition:opacity .15s,transform .15s;z-index:20}
.pf-tip:hover::after,.pf-tip:focus::after{opacity:1;transform:none}
.pf-role{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;border-radius:20px;padding:3px 10px;
  color:var(--pf-r);background:color-mix(in srgb,var(--pf-r) 14%,transparent);border:1px solid color-mix(in srgb,var(--pf-r) 35%,transparent)}
.pf-ro{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.pf-ro-chip{display:inline-flex;align-items:center;gap:6px;max-width:100%;min-width:0;font-size:12px;color:var(--t2);background:var(--bg2);border:1px solid var(--b1);border-radius:9px;padding:4px 9px}
.pf-ro-chip b{color:var(--t1);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.pf-ro-chip .pf-lock{color:var(--t3);flex-shrink:0}
.pf-ro-note{font-size:11px;color:var(--t3);margin-top:6px;display:flex;align-items:center;gap:5px}
.pf-photo-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}

.pf-ring{display:flex;align-items:center;gap:12px;flex:0 1 270px;min-width:0;padding:10px 12px;border-radius:14px;background:var(--bg2);border:1px solid var(--b1);animation:pfPop .5s .15s cubic-bezier(.2,.8,.2,1) both}
.pf-ring svg{flex-shrink:0}
.pf-ring-arc{transition:stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)}
.pf-ring-t{font-size:13px;font-weight:800;color:var(--t1)}
.pf-ring-h{font-size:11.5px;color:var(--t2);margin-top:2px;line-height:1.35}

.pf-cols{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-top:14px;align-items:start}
@media(min-width:1100px){.pf-cols{grid-template-columns:minmax(0,1fr) 340px}}
.pf-stack{display:grid;gap:14px;min-width:0}
.pf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px 14px}
.pf-full{grid-column:1/-1}
.pf-f{min-width:0}
.pf-lbl{display:flex;align-items:center;gap:5px;font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin-bottom:5px}
.pf-lbl .pf-dot{width:6px;height:6px;border-radius:50%;background:var(--acc);margin-left:2px;animation:pfPop .2s ease both}
.pf-f.bad .inp,.pf-f.bad .sel{border-color:var(--red);box-shadow:0 0 0 3px color-mix(in srgb,var(--red) 14%,transparent)}
.pf-err{font-size:11.5px;color:var(--red);margin-top:4px;display:flex;align-items:center;gap:4px;font-weight:600}
.pf-hint{font-size:11px;color:var(--t3);margin-top:4px;display:flex;justify-content:space-between;gap:8px}
.pf-f .sel{width:100%}
.pf-f textarea.inp{resize:vertical;min-height:84px;line-height:1.45;font-family:inherit}
.pf-tick{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:var(--t2);font-weight:600;cursor:pointer;margin-top:6px;user-select:none}
.pf-tick input{accent-color:var(--acc);width:15px;height:15px;margin:0}

.pf-sw{display:flex;flex-wrap:wrap;gap:10px}
.pf-swb{width:38px;height:38px;border-radius:12px;border:2px solid transparent;display:grid;place-items:center;cursor:pointer;padding:0;
  background:var(--sw);color:#fff;box-shadow:0 3px 10px color-mix(in srgb,var(--sw) 35%,transparent);transition:transform .15s,box-shadow .15s}
.pf-swb:hover{transform:translateY(-2px)}
.pf-swb.on{box-shadow:0 0 0 3px var(--bg1),0 0 0 5px var(--sw)}
.pf-swb:focus-visible{outline:2px solid var(--acc);outline-offset:3px}
.pf-prev{display:flex;align-items:center;gap:10px;margin-top:12px;font-size:12px;color:var(--t2)}
.pf-prev-dot{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;overflow:hidden;
  background:color-mix(in srgb,var(--pf-c) 20%,var(--bg1));color:var(--pf-c);border:2px solid var(--pf-c)}
.pf-prev-dot img{width:100%;height:100%;object-fit:cover}

.pf-pw{display:grid;gap:12px}
.pf-pwbox{position:relative}
.pf-pwbox .inp{padding-right:40px}
.pf-eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:32px;height:32px;display:grid;place-items:center;border:none;background:transparent;color:var(--t3);cursor:pointer;border-radius:8px}
.pf-eye:hover{color:var(--t1);background:var(--bg3)}
.pf-meter{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:6px}
.pf-meter span{height:5px;border-radius:4px;background:var(--bg3);transition:background .25s}

.pf-can{display:grid;gap:8px;font-size:12.5px;color:var(--t2)}
.pf-can-row{display:flex;gap:9px;align-items:flex-start;line-height:1.45}
.pf-can-ico{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent)}

.pf-banner{display:flex;gap:10px;align-items:flex-start;padding:11px 14px;border-radius:12px;margin-bottom:14px;font-size:12.5px;line-height:1.45;
  color:var(--t1);background:color-mix(in srgb,var(--yel) 12%,var(--bg1));border:1px solid color-mix(in srgb,var(--yel) 40%,transparent)}
.pf-banner svg{color:var(--yel);flex-shrink:0;margin-top:1px}

.pf-out{display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1px solid color-mix(in srgb,var(--red) 22%,var(--b1))!important}
.pf-out-btn{display:inline-flex!important;align-items:center;gap:7px;padding:9px 16px!important;font-size:13px!important;font-weight:800!important}
@media(max-width:560px){.pf-out-btn{width:100%;justify-content:center}}
.pf-bar{position:sticky;bottom:14px;z-index:40;margin-top:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 12px 10px 16px;border-radius:16px;
  background:var(--bg1);border:1px solid var(--acc);box-shadow:0 14px 40px color-mix(in srgb,var(--acc) 25%,transparent),0 2px 8px rgba(16,24,40,.08);
  animation:pfBar .32s cubic-bezier(.2,.8,.2,1) both}
.pf-bar-t{flex:1 1 150px;min-width:0;font-size:13px;font-weight:700;color:var(--t1);display:flex;align-items:center;gap:8px}
.pf-bar-n{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:11px;font-size:11.5px;font-weight:800;color:var(--acc);background:var(--accL)}
.pf-bar-s{font-size:11px;color:var(--t3);font-weight:500;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pf-bar .btn,.pf-bar .btnp{display:inline-flex;align-items:center;gap:6px}

.pf-skel-cover{height:138px;border-radius:0}
.pf-err-card{text-align:center;padding:36px 20px!important;display:grid;justify-items:center;gap:10px}
.pf-err-ico{width:54px;height:54px;border-radius:16px;display:grid;place-items:center;color:var(--red);background:color-mix(in srgb,var(--red) 12%,transparent)}

@media(max-width:768px){
  .pf-bar{bottom:6px}
}
@media(max-width:560px){
  .pf-cover,.pf-skel-cover{height:112px}
  .pf-cover-txt{left:14px;right:14px;top:12px}
  .pf-hero-body{flex-direction:column;align-items:center;text-align:center;padding:0 14px 16px;gap:12px}
  .pf-photo-wrap{margin-top:-54px}
  .pf-photo{width:104px;height:104px;font-size:34px}
  .pf-id{flex:0 0 auto;width:100%;padding-top:0}
  .pf-name-row,.pf-ro,.pf-photo-acts,.pf-ro-note{justify-content:center}
  .pf-name{font-size:21px}
  .pf-ring{flex:0 0 auto;width:100%;text-align:left}
  .pf-grid{grid-template-columns:minmax(0,1fr)}
  .pf-bar{padding:10px 12px}
  .pf-bar .btn,.pf-bar .btnp{flex:1 1 0;justify-content:center}
}
@media(prefers-reduced-motion:reduce){
  .pf-rise,.pf-bar,.pf-ring,.pf-lbl .pf-dot{animation:none!important}
  .pf-cover,.pf-orb,.pf-spin{animation:none!important}
  .pf-ring-arc,.pf-swb,.pf-tip::after,.pf-photo,.pf-meter span{transition:none!important}
}
`;

// ── small pieces ───────────────────────────────────────────────────────────
function Field({ id, label, icon: Icon, error, hint, changed, full, children }) {
  return (
    <div className={'pf-f' + (error ? ' bad' : '') + (full ? ' pf-full' : '')}>
      <label className="pf-lbl" htmlFor={id}>
        {Icon && <Icon size={12} />}{label}{changed && <span className="pf-dot" title="Changed" />}
      </label>
      {children}
      {error ? <div className="pf-err" id={id + '-err'} role="alert"><AlertTriangle size={12} />{error}</div>
        : hint ? <div className="pf-hint">{hint}</div> : null}
    </div>
  );
}

function SecTitle({ icon: Icon, tone, children, note }) {
  return (
    <div className="sec-title">
      <span className="sec-ico" style={{ '--tone': tone }}><Icon size={15} /></span>
      {children}
      {note && <span className="sec-note">{note}</span>}
    </div>
  );
}

function PwInput({ id, value, onChange, show, onToggle, autoComplete, placeholder, invalid }) {
  return (
    <div className="pf-pwbox">
      <input id={id} className="inp" type={show ? 'text' : 'password'} value={value} autoComplete={autoComplete}
        placeholder={placeholder} onChange={e => onChange(e.target.value)} aria-invalid={invalid || undefined}
        spellCheck={false} autoCapitalize="off" />
      <button type="button" className="pf-eye" onClick={onToggle} aria-label={show ? 'Hide password' : 'Show password'} title={show ? 'Hide' : 'Show'}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function Skeleton() {
  const bar = (w, h = 12, extra = {}) => <div className="skel" style={{ width: w, height: h, borderRadius: 8, ...extra }} />;
  return (
    <div className="pf-page skel-wrap" aria-busy="true" aria-label="Loading profile">
      <div className="card pf-hero">
        <div className="skel pf-skel-cover" />
        <div className="pf-hero-body">
          <div className="pf-photo-wrap"><div className="skel" style={{ width: 116, height: 116, borderRadius: '50%', border: '4px solid var(--bg1)' }} /></div>
          <div className="pf-id" style={{ display: 'grid', gap: 9 }}>{bar('55%', 22)}{bar('30%', 16)}{bar('80%', 26)}</div>
        </div>
      </div>
      <div className="pf-cols">
        <div className="pf-stack">
          {[0, 1, 2].map(i => (
            <div key={i} className="card" style={{ display: 'grid', gap: 12 }}>
              {bar(140, 16)}
              <div className="pf-grid">{[0, 1, 2, 3].map(j => <div key={j} style={{ display: 'grid', gap: 6 }}>{bar(70, 9)}{bar('100%', 36)}</div>)}</div>
            </div>
          ))}
        </div>
        <div className="pf-stack">
          <div className="card" style={{ display: 'grid', gap: 12 }}>{bar(120, 16)}{bar('100%', 36)}{bar('100%', 36)}{bar('100%', 36)}</div>
        </div>
      </div>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────
export default function ProfilePage({ currentUser, onUpdated, onLogout, onReturn, returnName }) {
  const [me, setMe] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [loading, setLoading] = useState(true);

  const [orig, setOrig] = useState(blankProfile);
  const [form, setForm] = useState(blankProfile);
  const [color, setColor] = useState('');
  const [sameWa, setSameWa] = useState(false);
  const [touched, setTouched] = useState({});
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);

  const [preview, setPreview] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef(null);

  const [blocked, setBlocked] = useState(() => {
    try { return !!JSON.parse(localStorage.getItem('stp_impersonating') || 'null'); } catch { return false; }
  });
  const [blockMsg, setBlockMsg] = useState('');

  const [ringPct, setRingPct] = useState(0);

  // password form — kept only in component state, never prefilled or stored
  const [pw, setPw] = useState({ cur: '', nw: '', cf: '' });
  const [pwShow, setPwShow] = useState({ cur: false, nw: false, cf: false });
  const [pwTried, setPwTried] = useState(false);
  const [pwErr, setPwErr] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const applyServer = useCallback((u) => {
    const p = fromServer(u?.profile);
    setMe(u);
    setOrig(p);
    setForm(p);
    setColor(u?.color || SWATCHES[0]);
    setSameWa(!!p.phone && p.phone === p.whatsapp);
    setTouched({});
    setTried(false);
    setPreview('');
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setLoadErr('');
    try { applyServer(await api.getMyProfile()); }
    catch (e) { setLoadErr(e?.message || 'Could not load your profile'); }
    finally { setLoading(false); }
  }, [applyServer]);

  useEffect(() => { load(); }, [load]);

  const handleErr = (e, fallback) => {
    const msg = e?.message || fallback;
    if (BLOCK_RE.test(msg)) {
      setBlocked(true); setBlockMsg(msg);
      notify.error("You're signed in with Login as — return to your own account to make changes.");
    } else notify.error(msg);
    return msg;
  };

  // ── derived ──
  const origColor = me?.color || SWATCHES[0];
  const dirtyKeys = useMemo(() => FIELDS.filter(k => form[k] !== orig[k]), [form, orig]);
  const colorDirty = !!me && color.toLowerCase() !== origColor.toLowerCase();
  const dirtyCount = dirtyKeys.length + (colorDirty ? 1 : 0);
  const dirty = dirtyCount > 0;

  const errors = useMemo(() => {
    const e = {};
    FIELDS.forEach(k => { const m = validate(k, form[k]); if (m) e[k] = m; });
    return e;
  }, [form]);
  const shownErr = (k) => (errors[k] && form[k] !== orig[k] && (touched[k] || tried)) ? errors[k] : '';

  const photoSrc = preview || me?.photo || '';
  const hasPhoto = !!(me?.photo || preview);
  const filled = FIELDS.filter(k => String(orig[k] || '').trim()).length + (me?.photo ? 1 : 0);
  const total = FIELDS.length + 1;
  const pct = Math.round((filled / total) * 100);
  const missing = [...(me?.photo ? [] : ['photo']), ...FIELDS.filter(k => !String(orig[k] || '').trim()).map(k => LABELS[k].toLowerCase())];

  useEffect(() => {
    if (!me) return undefined;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setRingPct(pct)));
    return () => cancelAnimationFrame(id);
  }, [me, pct]);

  // warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; return ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  // ── edits ──
  const set = (k) => (e) => {
    const v = e && e.target ? e.target.value : e;
    setForm(f => {
      const n = { ...f, [k]: v };
      if (k === 'phone' && sameWa) n.whatsapp = v;
      return n;
    });
  };
  const blur = (k) => () => setTouched(t => (t[k] ? t : { ...t, [k]: true }));
  const toggleSameWa = (on) => {
    setSameWa(on);
    if (on) setForm(f => ({ ...f, whatsapp: f.phone }));
  };

  const discard = () => {
    setForm(orig);
    setColor(origColor);
    setSameWa(!!orig.phone && orig.phone === orig.whatsapp);
    setTouched({}); setTried(false);
  };

  const save = async () => {
    if (!dirty || saving) return;
    const bad = dirtyKeys.filter(k => errors[k]);
    if (bad.length) {
      setTried(true);
      notify.error(bad.length === 1 ? `Check ${LABELS[bad[0]].toLowerCase()}` : `Fix ${bad.length} highlighted fields before saving`);
      const el = document.getElementById('pf-' + bad[0]);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); try { el.focus({ preventScroll: true }); } catch { /* ignore */ } }
      return;
    }
    const patch = {};
    if (dirtyKeys.length) {
      patch.profile = {};
      dirtyKeys.forEach(k => { patch.profile[k] = String(form[k] || '').trim(); });
    }
    if (colorDirty) patch.color = color;
    setSaving(true);
    try {
      const u = await api.updateMyProfile(patch);
      applyServer(u);
      if (typeof onUpdated === 'function') onUpdated(u);
      notify.success(dirtyCount === 1 ? 'Profile updated' : `Profile updated — ${dirtyCount} changes saved`);
    } catch (e) { handleErr(e, 'Could not save your profile'); }
    finally { setSaving(false); }
  };

  // ── photo ──
  const pickPhoto = () => { if (!photoBusy && fileRef.current) fileRef.current.click(); };
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';                    // let the same file be picked again
    if (!file) return;
    if (file.type && !/^image\//.test(file.type)) { notify.error('Pick an image file'); return; }
    setPhotoBusy(true);
    let url = '';
    try {
      const loaded = await loadImage(file);
      url = loaded.url;
      const photo = encodeUnder(loaded.img, 512, 0.82, PHOTO_LIMIT);
      const avatar = encodeUnder(loaded.img, 96, 0.8, AVATAR_LIMIT);
      setPreview(photo);
      const u = await api.updateMyProfile({ photo, avatar });
      // keep any unsaved text edits — only take the photo fields from the reply
      setMe(u);
      setPreview('');
      if (typeof onUpdated === 'function') onUpdated(u);
      notify.success('Photo updated');
    } catch (err) {
      setPreview('');
      handleErr(err, 'Could not update your photo');
    } finally {
      if (url) URL.revokeObjectURL(url);
      setPhotoBusy(false);
    }
  };
  const removePhoto = async () => {
    if (photoBusy) return;
    const ok = await confirmDialog({ title: 'Remove your photo?', message: 'Your initials will be shown instead.', confirmText: 'Remove', danger: true });
    if (!ok) return;
    setPhotoBusy(true);
    try {
      const u = await api.updateMyProfile({ removePhoto: true });
      setMe(u); setPreview('');
      if (typeof onUpdated === 'function') onUpdated(u);
      notify.success('Photo removed');
    } catch (err) { handleErr(err, 'Could not remove your photo'); }
    finally { setPhotoBusy(false); }
  };

  // ── password ──
  const strength = passStrength(pw.nw);
  const pwErrors = {
    cur: !pw.cur ? 'Enter your current password' : '',
    nw: !pw.nw ? 'Enter a new password' : pw.nw.length < 4 ? 'At least 4 characters' : pw.nw === pw.cur ? 'Pick something different from the current one' : '',
    cf: !pw.cf ? 'Type the new password again' : pw.cf !== pw.nw ? "Passwords don't match" : '',
  };
  const pwOk = !pwErrors.cur && !pwErrors.nw && !pwErrors.cf;
  const setPwField = (k) => (v) => { setPw(p => ({ ...p, [k]: v })); if (k === 'cur') setPwErr(''); };
  const submitPw = async (e) => {
    e.preventDefault();
    if (pwBusy) return;
    setPwTried(true);
    if (!pwOk) return;
    setPwBusy(true); setPwErr('');
    try {
      await api.changePassword(pw.cur, pw.nw);
      setPw({ cur: '', nw: '', cf: '' });
      setPwShow({ cur: false, nw: false, cf: false });
      setPwTried(false);
      notify.success('Password changed');
    } catch (err) {
      const msg = err?.message || 'Could not change password';
      if (/wrong current/i.test(msg)) setPwErr('That is not your current password');
      else handleErr(err, 'Could not change password');
    } finally { setPwBusy(false); }
  };

  // ── render ──
  if (loading && !me) return (<><style>{CSS}</style><Skeleton /></>);
  if (loadErr && !me) {
    return (
      <div className="pf-page">
        <style>{CSS}</style>
        <div className="card pf-err-card pf-rise">
          <div className="pf-err-ico"><AlertTriangle size={26} /></div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)' }}>Couldn't load your profile</div>
          <div style={{ fontSize: 12.5, color: 'var(--t2)', maxWidth: 380 }}>{loadErr}</div>
          <button className="btnp" onClick={load} disabled={loading}>
            {loading ? <Loader2 size={15} className="pf-spin" /> : <RefreshCw size={15} />} Retry
          </button>
        </div>
      </div>
    );
  }

  const name = me?.name || currentUser?.name || '';
  const role = ROLES[me?.role] || { label: me?.role || 'User', c: '#64748b' };
  const ini = initialsOf(me || currentUser);
  const since = me?.createdAt ? new Date(me.createdAt) : null;
  const sinceTxt = since && !isNaN(since) ? since.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
  const ringR = 30, ringC = 2 * Math.PI * ringR;
  const ringColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : '#f59e0b';
  const missingHint = missing.length === 0
    ? 'All set — your profile is complete.'
    : 'Add ' + missing.slice(0, 3).join(', ') + (missing.length > 3 ? ` +${missing.length - 3} more` : '') + '.';
  const bioLen = (form.bio || '').length;
  const dirtyLabels = [...dirtyKeys.map(k => LABELS[k]), ...(colorDirty ? ['Avatar colour'] : [])];

  const inp = (k, extra = {}) => ({
    id: 'pf-' + k, className: 'inp', value: form[k], onChange: set(k), onBlur: blur(k),
    maxLength: MAXLEN[k], disabled: saving, 'aria-invalid': shownErr(k) ? true : undefined,
    'aria-describedby': shownErr(k) ? 'pf-' + k + '-err' : undefined, ...extra,
  });
  const fld = (k, label, icon, children, more = {}) => (
    <Field id={'pf-' + k} label={label} icon={icon} error={shownErr(k)} changed={form[k] !== orig[k]} {...more}>{children}</Field>
  );

  return (
    <div className="pf-page" style={{ '--pf-c': color || origColor }}>
      <style>{CSS}</style>

      <PageHead icon={UserCircle2} tone="var(--acc)" eyebrow="Account" title="My profile"
        sub="Your photo, contact details and password — visible to your team where relevant." />

      {blocked && (
        <div className="pf-banner" role="status">
          <AlertTriangle size={17} />
          <div><b>You're using "Login as".</b> {blockMsg || 'Profile and password changes only work on your own account.'} Switch back to your own account to edit.</div>
        </div>
      )}

      {/* ── hero ── */}
      <div className="card pf-hero pf-rise" style={{ '--i': 0 }}>
        <div className="pf-cover" aria-hidden="true">
          <span className="pf-orb a" /><span className="pf-orb b" />
          <div className="pf-cover-txt">
            <span className="pf-cover-eyebrow"><Sparkles size={13} /> My profile</span>
            {sinceTxt && <span className="pf-cover-since">Member since {sinceTxt}</span>}
          </div>
        </div>
        <div className="pf-hero-body">
          <div className="pf-photo-wrap">
            <div className="pf-photo">
              {photoSrc ? <img src={photoSrc} alt={name} /> : <span>{ini}</span>}
            </div>
            {photoBusy && <div className="pf-photo-busy"><Loader2 size={26} className="pf-spin" /></div>}
            <button type="button" className="btnp pf-cam" onClick={pickPhoto} disabled={photoBusy || blocked}
              aria-label={hasPhoto ? 'Change photo' : 'Add photo'} title={hasPhoto ? 'Change photo' : 'Add photo'}>
              <Camera size={16} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
          </div>

          <div className="pf-id">
            <div className="pf-name-row">
              <span className="pf-name">{name}</span>
              <button type="button" className="pf-tip" data-tip="Your name is linked to your dealers and sales — ask an admin to change it"
                aria-label="Name locked: your name is linked to your dealers and sales — ask an admin to change it">
                <Lock size={13} />
              </button>
              <span className="pf-role" style={{ '--pf-r': role.c }}><ShieldCheck size={12} />{role.label}</span>
            </div>
            <div className="pf-ro">
              <span className="pf-ro-chip" title="Username — set by admin"><AtSign size={13} /><b>{me?.id}</b><Lock size={11} className="pf-lock" /></span>
              {me?.empCode && <span className="pf-ro-chip" title="Employee code — set by admin"><Briefcase size={13} /><b>{me.empCode}</b><Lock size={11} className="pf-lock" /></span>}
              {me?.email && <span className="pf-ro-chip" title="Work email — set by admin"><Mail size={13} /><b>{me.email}</b><Lock size={11} className="pf-lock" /></span>}
            </div>
            <div className="pf-ro-note"><Lock size={11} /> Name, username, role, code and work email are set by admin</div>
            <div className="pf-photo-acts">
              <button type="button" className="btn" onClick={pickPhoto} disabled={photoBusy || blocked} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {photoBusy ? <Loader2 size={14} className="pf-spin" /> : <Camera size={14} />}
                {photoBusy ? 'Saving photo…' : hasPhoto ? 'Change photo' : 'Add photo'}
              </button>
              {me?.photo && !photoBusy && (
                <button type="button" className="btnd" onClick={removePhoto} disabled={blocked}><Trash2 size={13} /> Remove</button>
              )}
            </div>
          </div>

          <div className="pf-ring" title={`${filled} of ${total} details filled`}>
            <svg width="76" height="76" viewBox="0 0 76 76" role="img" aria-label={`Profile ${pct}% complete`}>
              <circle cx="38" cy="38" r={ringR} fill="none" style={{ stroke: 'var(--bg3)' }} strokeWidth="7" />
              <circle className="pf-ring-arc" cx="38" cy="38" r={ringR} fill="none" stroke={ringColor} strokeWidth="7" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringC * (1 - ringPct / 100)} transform="rotate(-90 38 38)" />
              <text x="38" y="42.5" textAnchor="middle" fontSize="15" fontWeight="800" style={{ fill: 'var(--t1)' }}>{pct}%</text>
            </svg>
            <div style={{ minWidth: 0 }}>
              <div className="pf-ring-t">{pct >= 100 ? 'Profile complete' : 'Profile strength'}</div>
              <div className="pf-ring-h">{missingHint}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="pf-cols">
        {/* ── editable sections ── */}
        <div className="pf-stack">
          <div className="card pf-rise" style={{ '--i': 1 }}>
            <SecTitle icon={Phone} tone="#3b82f6" note="How the team reaches you">Contact</SecTitle>
            <div className="pf-grid">
              {fld('phone', 'Phone', Phone, <input {...inp('phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+91 98765 43210' })} />)}
              {fld('whatsapp', 'WhatsApp', MessageCircle, <>
                <input {...inp('whatsapp', { type: 'tel', inputMode: 'tel', placeholder: 'WhatsApp number', disabled: saving || sameWa })} />
                <label className="pf-tick"><input type="checkbox" checked={sameWa} onChange={e => toggleSameWa(e.target.checked)} disabled={saving} /> Same as phone</label>
              </>)}
              {fld('altPhone', 'Alternate phone', Phone, <input {...inp('altPhone', { type: 'tel', inputMode: 'tel', placeholder: 'Optional' })} />)}
              {fld('personalEmail', 'Personal email', Mail, <input {...inp('personalEmail', { type: 'email', inputMode: 'email', autoComplete: 'email', placeholder: 'you@example.com' })} />)}
            </div>
          </div>

          <div className="card pf-rise" style={{ '--i': 2 }}>
            <SecTitle icon={User} tone="#8b5cf6" note="A little about you">Personal</SecTitle>
            <div className="pf-grid">
              {fld('dob', 'Date of birth', Calendar, <input {...inp('dob', { type: 'date', max: todayISO() })} />)}
              {fld('bloodGroup', 'Blood group', Droplet,
                <select id="pf-bloodGroup" className="sel" value={form.bloodGroup} onChange={set('bloodGroup')} disabled={saving}>
                  <option value="">Not set</option>
                  {BLOOD.map(b => <option key={b} value={b}>{b}</option>)}
                  {form.bloodGroup && !BLOOD.includes(form.bloodGroup) && <option value={form.bloodGroup}>{form.bloodGroup}</option>}
                </select>)}
              {fld('languages', 'Languages', Languages, <input {...inp('languages', { placeholder: 'e.g. English, Hindi, Tamil' })} />, { full: true })}
              {fld('bio', 'About me', Info,
                <textarea {...inp('bio', { rows: 3, placeholder: 'A line or two about your work, region or experience' })} />,
                { full: true, hint: <><span>Shown to your team</span><span style={{ color: bioLen > 450 ? 'var(--yel)' : undefined, fontWeight: bioLen > 450 ? 700 : 400 }}>{bioLen}/500</span></> })}
            </div>
          </div>

          <div className="card pf-rise" style={{ '--i': 3 }}>
            <SecTitle icon={MapPin} tone="#10b981">Address</SecTitle>
            <div className="pf-grid">
              {fld('address', 'Address', Home, <textarea {...inp('address', { rows: 2, autoComplete: 'street-address', placeholder: 'House / street / area' })} />, { full: true })}
              {fld('city', 'City', MapPin, <input {...inp('city', { autoComplete: 'address-level2' })} />)}
              {fld('state', 'State', MapPin, <input {...inp('state', { autoComplete: 'address-level1' })} />)}
              {fld('pincode', 'PIN code', MapPin, <input {...inp('pincode', { inputMode: 'numeric', autoComplete: 'postal-code', placeholder: '6 digits', pattern: '\\d{6}' })} />)}
            </div>
          </div>

          <div className="card pf-rise" style={{ '--i': 4 }}>
            <SecTitle icon={HeartPulse} tone="#ef4444" note="Only used if something goes wrong">Emergency contact</SecTitle>
            <div className="pf-grid">
              {fld('emergencyName', 'Name', Contact, <input {...inp('emergencyName', { placeholder: 'Full name' })} />)}
              {fld('emergencyRel', 'Relation', User, <input {...inp('emergencyRel', { placeholder: 'e.g. Spouse, Father' })} />)}
              {fld('emergencyPhone', 'Phone', Phone, <input {...inp('emergencyPhone', { type: 'tel', inputMode: 'tel', placeholder: '+91 …' })} />)}
            </div>
          </div>

          <div className="card pf-rise" style={{ '--i': 5 }}>
            <SecTitle icon={Palette} tone="#ec4899" note="Used for your initials across the app">Appearance</SecTitle>
            <div className="pf-sw" role="radiogroup" aria-label="Avatar colour">
              {SWATCHES.map(c => {
                const on = color.toLowerCase() === c;
                return (
                  <button key={c} type="button" role="radio" aria-checked={on} aria-label={'Colour ' + c}
                    className={'pf-swb' + (on ? ' on' : '')} style={{ '--sw': c }} onClick={() => setColor(c)} disabled={saving}>
                    {on && <Check size={17} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
            <div className="pf-prev">
              <span className="pf-prev-dot">{me?.avatar ? <img src={me.avatar} alt="" /> : ini}</span>
              <span>Preview of how you appear in lists{colorDirty && <b style={{ color: 'var(--acc)' }}> · not saved yet</b>}</span>
            </div>
          </div>
        </div>

        {/* ── side column ── */}
        <div className="pf-stack">
          <div className="card pf-rise" style={{ '--i': 2 }}>
            <SecTitle icon={KeyRound} tone="#f59e0b">Security</SecTitle>
            <form className="pf-pw" onSubmit={submitPw} noValidate>
              <input type="text" name="username" autoComplete="username" value={me?.id || ''} readOnly hidden />
              <Field id="pf-pw-cur" label="Current password" icon={Lock} error={pwErr || (pwTried ? pwErrors.cur : '')}>
                <PwInput id="pf-pw-cur" value={pw.cur} onChange={setPwField('cur')} show={pwShow.cur}
                  onToggle={() => setPwShow(s => ({ ...s, cur: !s.cur }))} autoComplete="current-password" invalid={!!pwErr} />
              </Field>
              <Field id="pf-pw-nw" label="New password" icon={KeyRound} error={pwTried ? pwErrors.nw : ''}>
                <PwInput id="pf-pw-nw" value={pw.nw} onChange={setPwField('nw')} show={pwShow.nw}
                  onToggle={() => setPwShow(s => ({ ...s, nw: !s.nw }))} autoComplete="new-password" />
                {pw.nw && (
                  <>
                    <div className="pf-meter" aria-hidden="true">
                      {[1, 2, 3, 4].map(i => <span key={i} style={{ background: i <= strength.score ? strength.c : undefined }} />)}
                    </div>
                    <div className="pf-hint"><span style={{ color: strength.c, fontWeight: 700 }}>{strength.label}</span></div>
                  </>
                )}
              </Field>
              <Field id="pf-pw-cf" label="Confirm new password" icon={Check}
                error={(pwTried || (pw.cf && pw.cf.length >= pw.nw.length)) ? pwErrors.cf : ''}>
                <PwInput id="pf-pw-cf" value={pw.cf} onChange={setPwField('cf')} show={pwShow.cf}
                  onToggle={() => setPwShow(s => ({ ...s, cf: !s.cf }))} autoComplete="new-password" />
              </Field>
              <button type="submit" className="btnp" disabled={pwBusy || blocked} style={{ justifyContent: 'center' }}>
                {pwBusy ? <Loader2 size={15} className="pf-spin" /> : <ShieldCheck size={15} />} {pwBusy ? 'Changing…' : 'Change password'}
              </button>
            </form>
          </div>

          <div className="card pf-rise" style={{ '--i': 3 }}>
            <SecTitle icon={Info} tone="var(--acc)">What you can change</SecTitle>
            <div className="pf-can">
              <div className="pf-can-row">
                <span className="pf-can-ico" style={{ '--tone': 'var(--grn)' }}><CheckCircle2 size={13} /></span>
                <span><b style={{ color: 'var(--t1)' }}>You can edit</b> your photo, contact details, personal details, address, emergency contact, avatar colour and password.</span>
              </div>
              <div className="pf-can-row">
                <span className="pf-can-ico" style={{ '--tone': 'var(--yel)' }}><Lock size={13} /></span>
                <span><b style={{ color: 'var(--t1)' }}>Managed by admins:</b> name, username, role, employee code, work email and permissions — they are linked to your dealers, sales and access.</span>
              </div>
            </div>
          </div>

          {blocked && onReturn ? (
            <div className="card pf-rise pf-out" style={{ '--i': 4 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, color: 'var(--t1)', fontSize: 14 }}>Viewing as {currentUser?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>You opened this account with Login as. Go back to your own account — nobody is signed out.</div>
              </div>
              <button className="btnp pf-out-btn" onClick={onReturn}>
                <LogOut size={15} /> Return to {returnName || 'my account'}
              </button>
            </div>
          ) : onLogout && (
            <div className="card pf-rise pf-out" style={{ '--i': 4 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, color: 'var(--t1)', fontSize: 14 }}>Sign out</div>
                <div style={{ fontSize: 12, color: 'var(--t3)' }}>Leave this phone signed out. You'll need your password to come back in.</div>
              </div>
              <button className="btnd pf-out-btn" onClick={async () => { if (await confirmDialog({ title: 'Sign out?', message: 'You will need your username and password to sign in again.', confirmText: 'Sign out', danger: true })) onLogout(); }}>
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── sticky save bar ── */}
      {dirty && (
        <div className="pf-bar" role="region" aria-label="Unsaved changes">
          <div className="pf-bar-t">
            <span className="pf-bar-n">{dirtyCount}</span>
            <span style={{ minWidth: 0 }}>
              {dirtyCount === 1 ? '1 unsaved change' : `${dirtyCount} unsaved changes`}
              <span className="pf-bar-s">{dirtyLabels.join(', ')}</span>
            </span>
          </div>
          <button type="button" className="btn" onClick={discard} disabled={saving}><RotateCcw size={14} /> Discard</button>
          <button type="button" className="btnp" onClick={save} disabled={saving || blocked}>
            {saving ? <Loader2 size={15} className="pf-spin" /> : <Save size={15} />} {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
