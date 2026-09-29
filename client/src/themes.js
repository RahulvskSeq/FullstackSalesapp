// The app's three themes.
//
//   Light     — grey page, white cards, navy brand. The everyday office look.
//   Dark      — the same layout on deep navy, for evenings and low light.
//   Sunlight  — white, heavier text and borders: readable on a phone outdoors.
//
// Each theme is a flat set of CSS variables applied to <html>. Styles.jsx
// holds the shape rules (card radius, table bands, the navy top bar) once,
// written against these variables, so all three themes get the same finish.
// `tone` tells Styles.jsx which colour rules suit the theme (solid status
// fills on light, soft tints on dark) and keeps the old data-theme switch —
// date-picker glyphs, the header toggle — in step.

const LIGHT = {
  '--bg':  '#f3f5f9', '--bg1': '#ffffff', '--bg2': '#f3f6fa', '--bg3': '#e9eef5',
  '--b1':  '#e6ebf2', '--b2':  '#d6dde8',
  '--t1':  '#0f172a', '--t2':  '#475569', '--t3':  '#7c8aa0',
  '--acc': '#2563eb', '--accL': 'rgba(37,99,235,0.10)',
  '--grn': '#059669', '--yel': '#d97706', '--red': '#dc2626', '--pur': '#7c3aed',
  '--shadow':      '0 1px 2px rgba(16,24,40,.04), 0 6px 18px rgba(16,24,40,.06)',
  '--shadowHover': '0 12px 32px rgba(16,24,40,.12)',
  '--pickerFilter':'none',
  '--monthBarBg': '#ffffff', '--monthBarBorder': '#e6ebf2', '--monthBarLabel': '#475569',
  '--chipBg': '#f3f6fa', '--chipBorder': '#e2e8f0', '--chipText': '#475569', '--chipCurrentText': '#0f172a',
  '--chipActiveBg': '#2563eb', '--chipActiveText': '#ffffff', '--chipActiveBorder': '#2563eb',
  '--okText': '#047857', '--okBg': 'rgba(5,150,105,0.10)', '--okBorder': '#a7e3cf', '--okDot': '#059669',
  // shape-rule colours (Styles.jsx)
  '--thBg': '#f6f8fb', '--thBorder': '#e6ebf2', '--tdBorder': '#eef1f6', '--rowHover': '#f5f8ff', '--tfootBg': '#f3f6fa',
  '--inpBg': '#ffffff', '--inpBorder': '#d6dde8',
  '--btnBg': '#ffffff', '--btnBorder': '#dfe5ee', '--btnHover': '#f3f6fa', '--btnShadow': '0 1px 2px rgba(16,24,40,.05)',
  '--accShadow': '0 4px 12px rgba(37,99,235,.28)',
  // top bar: white, dark text
  '--topbarBg': '#ffffff', '--topbarRaise': '#f3f6fa', '--topbarLine': '#e2e8f0', '--topbarShadow': '0 1px 0 #e6ebf2',
  '--tbT1': '#0f172a', '--tbT2': '#475569', '--tbT3': '#94a3b8', '--tbAcc': '#2563eb', '--tbAccL': 'rgba(37,99,235,.10)',
  '--tbBtnBg': '#f3f6fa', '--tbBtnBorder': '#e2e8f0', '--tbBtnText': '#334155',
  '--sidebarShadow': '1px 0 0 #e6ebf2',
  '--overlay': 'rgba(15,23,42,.45)',
  // greeting card, + button
  '--heroA': '#1d4ed8', '--heroB': '#3b82f6', '--fab': '#2563eb', '--navBg': 'rgba(255,255,255,.96)',
};

const DARK = {
  '--bg':  '#0b1220', '--bg1': '#111a2c', '--bg2': '#172338', '--bg3': '#1f2d47',
  '--b1':  '#1e2a42', '--b2':  '#2a3956',
  '--t1':  '#e6ebf5', '--t2':  '#aeb9cd', '--t3':  '#76839c',
  '--acc': '#5b8def', '--accL': 'rgba(91,141,239,0.16)',
  '--grn': '#34d399', '--yel': '#fbbf24', '--red': '#f87171', '--pur': '#a78bfa',
  '--shadow':      '0 2px 8px rgba(0,0,0,.35)',
  '--shadowHover': '0 10px 28px rgba(0,0,0,.5)',
  '--pickerFilter':'invert(1)',
  '--monthBarBg': '#0f1828', '--monthBarBorder': '#1e2a42', '--monthBarLabel': '#aeb9cd',
  '--chipBg': '#172338', '--chipBorder': '#2a3956', '--chipText': '#aeb9cd', '--chipCurrentText': '#e6ebf5',
  '--chipActiveBg': '#5b8def', '--chipActiveText': '#ffffff', '--chipActiveBorder': '#5b8def',
  '--okText': '#6ee7b7', '--okBg': 'rgba(52,211,153,0.14)', '--okBorder': 'rgba(52,211,153,.45)', '--okDot': '#34d399',
  '--thBg': '#142036', '--thBorder': '#24324d', '--tdBorder': '#1c2840', '--rowHover': '#162238', '--tfootBg': '#162238',
  '--inpBg': '#0f1828', '--inpBorder': '#2a3956',
  '--btnBg': '#1a2640', '--btnBorder': '#2a3956', '--btnHover': '#22314f', '--btnShadow': 'none',
  '--accShadow': '0 3px 10px rgba(91,141,239,.30)',
  '--topbarBg': '#0e1729', '--topbarRaise': '#1a2640', '--topbarLine': '#26344f', '--topbarShadow': '0 1px 0 #1e2a42',
  '--tbT1': '#ffffff', '--tbT2': '#d3dcec', '--tbT3': '#a2b2cc', '--tbAcc': '#ffffff', '--tbAccL': 'rgba(255,255,255,.14)',
  '--tbBtnBg': 'rgba(255,255,255,.08)', '--tbBtnBorder': 'rgba(255,255,255,.18)', '--tbBtnText': '#e8eefa',
  '--heroA': '#1e3a8a', '--heroB': '#2563eb', '--fab': '#3b82f6', '--navBg': 'rgba(14,23,41,.96)',
  '--sidebarShadow': '1px 0 0 #1e2a42',
  '--overlay': 'rgba(0,0,0,.65)',
};

const SUNLIGHT = {
  '--bg':  '#f1f3f6', '--bg1': '#ffffff', '--bg2': '#eef1f5', '--bg3': '#e1e6ed',
  '--b1':  '#c5cdd9', '--b2':  '#9aa5b5',
  '--t1':  '#0b1220', '--t2':  '#1f2a3c', '--t3':  '#46526a',
  '--acc': '#1e3a8a', '--accL': 'rgba(30,58,138,0.10)',
  '--grn': '#047857', '--yel': '#92400e', '--red': '#b91c1c', '--pur': '#5b21b6',
  '--shadow':      '0 1px 2px rgba(11,18,32,.18)',
  '--shadowHover': '0 6px 18px rgba(11,18,32,.22)',
  '--pickerFilter':'none',
  '--monthBarBg': '#e1e6ed', '--monthBarBorder': '#9aa5b5', '--monthBarLabel': '#1f2a3c',
  '--chipBg': '#ffffff', '--chipBorder': '#7d8899', '--chipText': '#1f2a3c', '--chipCurrentText': '#0b1220',
  '--chipActiveBg': '#1e3a8a', '--chipActiveText': '#ffffff', '--chipActiveBorder': '#1e3a8a',
  '--okText': '#065f46', '--okBg': 'rgba(4,120,87,0.12)', '--okBorder': '#047857', '--okDot': '#047857',
  '--thBg': '#e1e6ed', '--thBorder': '#9aa5b5', '--tdBorder': '#d3d9e2', '--rowHover': '#eef1f5', '--tfootBg': '#e1e6ed',
  '--inpBg': '#ffffff', '--inpBorder': '#7d8899',
  '--btnBg': '#ffffff', '--btnBorder': '#7d8899', '--btnHover': '#e1e6ed', '--btnShadow': 'none',
  '--accShadow': 'none',
  '--topbarBg': '#13213d', '--topbarRaise': '#223257', '--topbarLine': '#34466e', '--topbarShadow': 'none',
  '--tbT1': '#ffffff', '--tbT2': '#d3dcec', '--tbT3': '#a2b2cc', '--tbAcc': '#ffffff', '--tbAccL': 'rgba(255,255,255,.16)',
  '--tbBtnBg': 'rgba(255,255,255,.10)', '--tbBtnBorder': 'rgba(255,255,255,.28)', '--tbBtnText': '#e8eefa',
  '--heroA': '#1e3a8a', '--heroB': '#1e40af', '--fab': '#1e3a8a', '--navBg': '#ffffff',
  '--sidebarShadow': '1px 0 0 #c5cdd9',
  '--overlay': 'rgba(11,18,32,.6)',
};

export const THEMES = [
  { id: 'material', name: 'Light',    hint: 'Clean white and blue',        tone: 'light', swatch: ['#f3f5f9', '#2563eb', '#059669'], vars: LIGHT },
  { id: 'dark',     name: 'Dark',     hint: 'Easy on the eyes at night',   tone: 'dark',  swatch: ['#0b1220', '#5b8def', '#34d399'], vars: DARK },
  { id: 'sunlight', name: 'Sunlight', hint: 'High contrast for outdoors',  tone: 'light', swatch: ['#ffffff', '#1e3a8a', '#047857'], vars: SUNLIGHT },
];
export const DEFAULT_THEME = 'material';

const STORAGE_KEY = 'stp_palette';
// Palettes that existed before the three: a dark one moves to Dark, anything else to Light.
const OLD_DARK = new Set(['midnight', 'ocean', 'forest', 'sunset', 'cyberpunk', 'slate', 'crimson', 'solar-dark', 'mono', 'rose', 'amber', 'nord', 'corporate-navy']);
const ALL_VARS = [...new Set(THEMES.flatMap(t => Object.keys(t.vars)))];

export const themeById = id => THEMES.find(t => t.id === id) || THEMES[0];

/** Apply a theme: its variables on <html>, plus data-palette / data-tone / data-theme for Styles.jsx. */
export function applyTheme(themeId) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const theme = themeById(themeId);
  ALL_VARS.forEach(k => root.style.removeProperty(k));
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute('data-palette', theme.id);
  root.setAttribute('data-tone', theme.tone);
  root.setAttribute('data-theme', theme.tone);
  // the phone's status bar / browser chrome follows the top bar
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
  meta.content = theme.vars['--topbarBg'];
}

export function loadSavedTheme() {
  try {
    const v = localStorage.getItem(STORAGE_KEY) || '';
    if (THEMES.some(t => t.id === v)) return v;
    if (OLD_DARK.has(v)) return 'dark';
    if (v === 'default') return localStorage.getItem('theme') === '"dark"' || localStorage.getItem('stp_theme') === 'dark' ? 'dark' : DEFAULT_THEME;
    return DEFAULT_THEME;
  } catch { return DEFAULT_THEME; }
}

export function saveTheme(themeId) {
  try { localStorage.setItem(STORAGE_KEY, themeById(themeId).id); } catch {}
}
