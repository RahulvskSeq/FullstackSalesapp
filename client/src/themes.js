// Extra theme palettes. The existing dark/light toggle still works exactly
// as before — these palettes layer on top by setting CSS variables directly
// on document.documentElement.style.
//
// Each palette is a flat object of {cssVariableName: value}. The keys MUST
// match the variables already declared in Styles.jsx so the rest of the app
// re-styles for free.
//
// To revert to the built-in dark/light theme, select the 'default' palette —
// applyTheme() then clears all inline overrides so :root / [data-theme]
// rules take over again.

export const THEMES = [
  // 1. Default — no overrides, falls back to the original dark/light theme
  {
    id: 'default',
    name: 'Default (Dark/Light toggle)',
    swatch: ['#0e0e1a', '#6366f1', '#34d399'],
    vars: null, // null = clear all overrides
  },

  // 2. Midnight Blue
  {
    id: 'midnight',
    name: 'Midnight Blue',
    swatch: ['#0a1428', '#3b82f6', '#60a5fa'],
    vars: {
      '--bg':  '#050b18',  '--bg1': '#0a1428',  '--bg2': '#0f1d3a',  '--bg3': '#152549',
      '--b1':  '#1a2a4a',  '--b2':  '#243558',
      '--t1':  '#dbeafe',  '--t2':  '#93c5fd',  '--t3':  '#5b8ac7',
      '--acc': '#3b82f6',  '--accL': 'rgba(59,130,246,0.18)',
      '--grn': '#10b981',  '--yel': '#fbbf24', '--red': '#ef4444', '--pur': '#8b5cf6',
    },
  },

  // 3. Ocean Teal
  {
    id: 'ocean',
    name: 'Ocean',
    swatch: ['#021d22', '#06b6d4', '#14b8a6'],
    vars: {
      '--bg':  '#01161a',  '--bg1': '#021d22',  '--bg2': '#0a2e35',  '--bg3': '#103e47',
      '--b1':  '#0e3a44',  '--b2':  '#155060',
      '--t1':  '#cffafe',  '--t2':  '#67e8f9',  '--t3':  '#3e7e8a',
      '--acc': '#06b6d4',  '--accL': 'rgba(6,182,212,0.18)',
      '--grn': '#14b8a6',  '--yel': '#fbbf24', '--red': '#f87171', '--pur': '#a78bfa',
    },
  },

  // 4. Forest
  {
    id: 'forest',
    name: 'Forest',
    swatch: ['#0d1f0d', '#22c55e', '#65a30d'],
    vars: {
      '--bg':  '#06140a',  '--bg1': '#0d1f0d',  '--bg2': '#152b15',  '--bg3': '#1d3a1d',
      '--b1':  '#1e3a1e',  '--b2':  '#2a4a2a',
      '--t1':  '#dcfce7',  '--t2':  '#86efac',  '--t3':  '#4a7c4a',
      '--acc': '#22c55e',  '--accL': 'rgba(34,197,94,0.18)',
      '--grn': '#65a30d',  '--yel': '#eab308', '--red': '#dc2626', '--pur': '#a78bfa',
    },
  },

  // 5. Sunset
  {
    id: 'sunset',
    name: 'Sunset',
    swatch: ['#1a0f1f', '#f97316', '#ec4899'],
    vars: {
      '--bg':  '#100614',  '--bg1': '#1a0f1f',  '--bg2': '#26152e',  '--bg3': '#33203d',
      '--b1':  '#2e1a3a',  '--b2':  '#3e2950',
      '--t1':  '#fce7f3',  '--t2':  '#f9a8d4',  '--t3':  '#a06080',
      '--acc': '#f97316',  '--accL': 'rgba(249,115,22,0.18)',
      '--grn': '#34d399',  '--yel': '#fbbf24', '--red': '#ec4899', '--pur': '#c084fc',
    },
  },

  // 6. Cyberpunk
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    swatch: ['#0a0014', '#ff00ff', '#00ffff'],
    vars: {
      '--bg':  '#05000a',  '--bg1': '#0a0014',  '--bg2': '#14001f',  '--bg3': '#1f0030',
      '--b1':  '#2a0040',  '--b2':  '#3a0058',
      '--t1':  '#f0f0ff',  '--t2':  '#c0c0ff',  '--t3':  '#7070a0',
      '--acc': '#ff00ff',  '--accL': 'rgba(255,0,255,0.18)',
      '--grn': '#00ffaa',  '--yel': '#ffee00', '--red': '#ff0066', '--pur': '#00ffff',
    },
  },

  // 7. Slate / Neutral
  {
    id: 'slate',
    name: 'Slate',
    swatch: ['#0f172a', '#64748b', '#94a3b8'],
    vars: {
      '--bg':  '#0a0f1a',  '--bg1': '#0f172a',  '--bg2': '#1e293b',  '--bg3': '#293548',
      '--b1':  '#1e2a3e',  '--b2':  '#2d3b50',
      '--t1':  '#f1f5f9',  '--t2':  '#cbd5e1',  '--t3':  '#64748b',
      '--acc': '#94a3b8',  '--accL': 'rgba(148,163,184,0.18)',
      '--grn': '#10b981',  '--yel': '#f59e0b', '--red': '#ef4444', '--pur': '#a78bfa',
    },
  },

  // 8. Crimson
  {
    id: 'crimson',
    name: 'Crimson',
    swatch: ['#1a0608', '#dc2626', '#f87171'],
    vars: {
      '--bg':  '#0d0306',  '--bg1': '#1a0608',  '--bg2': '#260a0d',  '--bg3': '#341014',
      '--b1':  '#3a1418',  '--b2':  '#4a1c22',
      '--t1':  '#fef2f2',  '--t2':  '#fca5a5',  '--t3':  '#a86070',
      '--acc': '#dc2626',  '--accL': 'rgba(220,38,38,0.18)',
      '--grn': '#34d399',  '--yel': '#fbbf24', '--red': '#f87171', '--pur': '#a78bfa',
    },
  },

  // 9. Solarized Dark
  {
    id: 'solar-dark',
    name: 'Solarized Dark',
    swatch: ['#002b36', '#268bd2', '#b58900'],
    vars: {
      '--bg':  '#001f27',  '--bg1': '#002b36',  '--bg2': '#073642',  '--bg3': '#0d4655',
      '--b1':  '#0b4250',  '--b2':  '#155060',
      '--t1':  '#eee8d5',  '--t2':  '#93a1a1',  '--t3':  '#586e75',
      '--acc': '#268bd2',  '--accL': 'rgba(38,139,210,0.20)',
      '--grn': '#859900',  '--yel': '#b58900', '--red': '#dc322f', '--pur': '#6c71c4',
    },
  },

  // 10. Solarized Light
  {
    id: 'solar-light',
    name: 'Solarized Light',
    swatch: ['#fdf6e3', '#268bd2', '#b58900'],
    vars: {
      '--bg':  '#fdf6e3',  '--bg1': '#eee8d5',  '--bg2': '#e5dec7',  '--bg3': '#d8d0b7',
      '--b1':  '#d4cdaf',  '--b2':  '#b8b09a',
      '--t1':  '#002b36',  '--t2':  '#073642',  '--t3':  '#586e75',
      '--acc': '#268bd2',  '--accL': 'rgba(38,139,210,0.15)',
      '--grn': '#859900',  '--yel': '#b58900', '--red': '#dc322f', '--pur': '#6c71c4',
    },
  },

  // 11. Monochrome
  {
    id: 'mono',
    name: 'Monochrome',
    swatch: ['#000000', '#ffffff', '#888888'],
    vars: {
      '--bg':  '#000000',  '--bg1': '#0a0a0a',  '--bg2': '#161616',  '--bg3': '#222222',
      '--b1':  '#1f1f1f',  '--b2':  '#2e2e2e',
      '--t1':  '#ffffff',  '--t2':  '#bbbbbb',  '--t3':  '#666666',
      '--acc': '#ffffff',  '--accL': 'rgba(255,255,255,0.10)',
      '--grn': '#9ca3af',  '--yel': '#d1d5db', '--red': '#9ca3af', '--pur': '#bbbbbb',
    },
  },

  // 12. Rose
  {
    id: 'rose',
    name: 'Rose',
    swatch: ['#1a0f14', '#f43f5e', '#fb7185'],
    vars: {
      '--bg':  '#10070b',  '--bg1': '#1a0f14',  '--bg2': '#26161e',  '--bg3': '#341e2a',
      '--b1':  '#3a1f2a',  '--b2':  '#4a2837',
      '--t1':  '#fce7ef',  '--t2':  '#fda4af',  '--t3':  '#a05c70',
      '--acc': '#f43f5e',  '--accL': 'rgba(244,63,94,0.18)',
      '--grn': '#34d399',  '--yel': '#fbbf24', '--red': '#fb7185', '--pur': '#c084fc',
    },
  },

  // 13. Amber
  {
    id: 'amber',
    name: 'Amber',
    swatch: ['#1f1505', '#f59e0b', '#fbbf24'],
    vars: {
      '--bg':  '#150e03',  '--bg1': '#1f1505',  '--bg2': '#2e2008',  '--bg3': '#3d2b0c',
      '--b1':  '#3a2810',  '--b2':  '#4a3618',
      '--t1':  '#fef3c7',  '--t2':  '#fcd34d',  '--t3':  '#9c7a3a',
      '--acc': '#f59e0b',  '--accL': 'rgba(245,158,11,0.18)',
      '--grn': '#84cc16',  '--yel': '#fbbf24', '--red': '#f87171', '--pur': '#a78bfa',
    },
  },

  // 14. High-contrast Light
  {
    id: 'paper',
    name: 'Paper',
    swatch: ['#ffffff', '#000000', '#4f52d8'],
    vars: {
      '--bg':  '#ffffff',  '--bg1': '#fafafa',  '--bg2': '#f0f0f5',  '--bg3': '#e5e5ed',
      '--b1':  '#dcdce8',  '--b2':  '#c4c4d0',
      '--t1':  '#1a1a2e',  '--t2':  '#3e3e58',  '--t3':  '#7a7a90',
      '--acc': '#4f52d8',  '--accL': 'rgba(79,82,216,0.10)',
      '--grn': '#059669',  '--yel': '#d97706', '--red': '#dc2626', '--pur': '#7c3aed',
    },
  },

  // 15. Nord-ish
  {
    id: 'nord',
    name: 'Nord',
    swatch: ['#2e3440', '#88c0d0', '#a3be8c'],
    vars: {
      '--bg':  '#21252e',  '--bg1': '#2e3440',  '--bg2': '#3b4252',  '--bg3': '#434c5e',
      '--b1':  '#3b4252',  '--b2':  '#4c566a',
      '--t1':  '#eceff4',  '--t2':  '#d8dee9',  '--t3':  '#7e8696',
      '--acc': '#88c0d0',  '--accL': 'rgba(136,192,208,0.20)',
      '--grn': '#a3be8c',  '--yel': '#ebcb8b', '--red': '#bf616a', '--pur': '#b48ead',
    },
  },

  // ── DAYLIGHT-FRIENDLY LIGHT PALETTES ─────────────────────────────────────
  // High contrast, white-ish backgrounds for outdoor / bright-room use.

  // 16. Cream — warm off-white
  {
    id: 'cream',
    name: 'Cream',
    swatch: ['#fffbf2', '#92400e', '#d97706'],
    vars: {
      '--bg':  '#fffbf2',  '--bg1': '#fdf6e3',  '--bg2': '#f5edd6',  '--bg3': '#eee4c4',
      '--b1':  '#e8dfba',  '--b2':  '#d8caa0',
      '--t1':  '#3a2a10',  '--t2':  '#6b5635',  '--t3':  '#9d8856',
      '--acc': '#b45309',  '--accL': 'rgba(180,83,9,0.12)',
      '--grn': '#059669',  '--yel': '#d97706', '--red': '#dc2626', '--pur': '#7c3aed',
    },
  },

  // 17. Mint — fresh light green
  {
    id: 'mint',
    name: 'Mint',
    swatch: ['#f0fdf4', '#059669', '#14b8a6'],
    vars: {
      '--bg':  '#f0fdf4',  '--bg1': '#ecfdf5',  '--bg2': '#d7f5e3',  '--bg3': '#bcecd0',
      '--b1':  '#bee5d0',  '--b2':  '#9bd1b5',
      '--t1':  '#052e16',  '--t2':  '#14532d',  '--t3':  '#4d8266',
      '--acc': '#059669',  '--accL': 'rgba(5,150,105,0.13)',
      '--grn': '#15803d',  '--yel': '#d97706', '--red': '#dc2626', '--pur': '#7c3aed',
    },
  },

  // 18. Sky — bright blue
  {
    id: 'sky',
    name: 'Sky',
    swatch: ['#f0f9ff', '#0284c7', '#0ea5e9'],
    vars: {
      '--bg':  '#f0f9ff',  '--bg1': '#e0f2fe',  '--bg2': '#cde9fc',  '--bg3': '#b8dcf5',
      '--b1':  '#b8d9f0',  '--b2':  '#94c1e0',
      '--t1':  '#0c2740',  '--t2':  '#1e4d7a',  '--t3':  '#5a89b8',
      '--acc': '#0284c7',  '--accL': 'rgba(2,132,199,0.13)',
      '--grn': '#059669',  '--yel': '#d97706', '--red': '#dc2626', '--pur': '#7c3aed',
    },
  },

  // 19. Lavender — soft purple
  {
    id: 'lavender',
    name: 'Lavender',
    swatch: ['#faf5ff', '#7c3aed', '#a855f7'],
    vars: {
      '--bg':  '#faf5ff',  '--bg1': '#f3e8ff',  '--bg2': '#e9d5ff',  '--bg3': '#dbc1f7',
      '--b1':  '#d8c4ed',  '--b2':  '#b89bd6',
      '--t1':  '#2e1065',  '--t2':  '#5b21b6',  '--t3':  '#8b6cb9',
      '--acc': '#7c3aed',  '--accL': 'rgba(124,58,237,0.13)',
      '--grn': '#059669',  '--yel': '#d97706', '--red': '#dc2626', '--pur': '#a855f7',
    },
  },

  // 20. Sand — warm beige / desert
  {
    id: 'sand',
    name: 'Sand',
    swatch: ['#fafaf0', '#a16207', '#ca8a04'],
    vars: {
      '--bg':  '#fafaf0',  '--bg1': '#f5f5dc',  '--bg2': '#ede8c8',  '--bg3': '#e0d8a8',
      '--b1':  '#dcd4a8',  '--b2':  '#bdb084',
      '--t1':  '#3a2a08',  '--t2':  '#6e5a1a',  '--t3':  '#9c8744',
      '--acc': '#a16207',  '--accL': 'rgba(161,98,7,0.13)',
      '--grn': '#65a30d',  '--yel': '#ca8a04', '--red': '#dc2626', '--pur': '#7c3aed',
    },
  },

  // 21. Frost — cool icy white
  {
    id: 'frost',
    name: 'Frost',
    swatch: ['#f8fafc', '#0891b2', '#06b6d4'],
    vars: {
      '--bg':  '#f8fafc',  '--bg1': '#f1f5f9',  '--bg2': '#e2e8f0',  '--bg3': '#cbd5e1',
      '--b1':  '#cbd5e1',  '--b2':  '#94a3b8',
      '--t1':  '#0f172a',  '--t2':  '#334155',  '--t3':  '#64748b',
      '--acc': '#0891b2',  '--accL': 'rgba(8,145,178,0.13)',
      '--grn': '#059669',  '--yel': '#d97706', '--red': '#dc2626', '--pur': '#7c3aed',
    },
  },

  // 22. Rose Light — soft pink daylight
  {
    id: 'rose-light',
    name: 'Rose Light',
    swatch: ['#fff1f2', '#be123c', '#e11d48'],
    vars: {
      '--bg':  '#fff1f2',  '--bg1': '#ffe4e6',  '--bg2': '#fecdd3',  '--bg3': '#fda4af',
      '--b1':  '#fbcfe8',  '--b2':  '#f9a8d4',
      '--t1':  '#4c0519',  '--t2':  '#881337',  '--t3':  '#9f5566',
      '--acc': '#be123c',  '--accL': 'rgba(190,18,60,0.13)',
      '--grn': '#059669',  '--yel': '#d97706', '--red': '#e11d48', '--pur': '#7c3aed',
    },
  },

  // 23. Sage — muted green-grey day theme
  {
    id: 'sage',
    name: 'Sage',
    swatch: ['#f7faf5', '#4d7c0f', '#65a30d'],
    vars: {
      '--bg':  '#f7faf5',  '--bg1': '#ecf3e4',  '--bg2': '#dcecd0',  '--bg3': '#c9dfb8',
      '--b1':  '#c9dcb8',  '--b2':  '#a5c388',
      '--t1':  '#1a2e0c',  '--t2':  '#3f6420',  '--t3':  '#6f9152',
      '--acc': '#4d7c0f',  '--accL': 'rgba(77,124,15,0.13)',
      '--grn': '#65a30d',  '--yel': '#ca8a04', '--red': '#b91c1c', '--pur': '#7c3aed',
    },
  },

  // 24. Daylight Pro — pure white, max contrast for sunlight
  {
    id: 'daylight',
    name: 'Daylight (max contrast)',
    swatch: ['#ffffff', '#1d4ed8', '#16a34a'],
    vars: {
      '--bg':  '#ffffff',  '--bg1': '#ffffff',  '--bg2': '#f3f4f6',  '--bg3': '#e5e7eb',
      '--b1':  '#d1d5db',  '--b2':  '#9ca3af',
      '--t1':  '#000000',  '--t2':  '#1f2937',  '--t3':  '#4b5563',
      '--acc': '#1d4ed8',  '--accL': 'rgba(29,78,216,0.10)',
      '--grn': '#16a34a',  '--yel': '#ca8a04', '--red': '#dc2626', '--pur': '#7c3aed',
    },
  },

  // ── DASHBOARD-INSPIRED PALETTES (from user references) ──────────────────

  // 25. Navy + Orange — Image 1 (JOHN DON dashboard, dark navy + orange CTA)
  {
    id: 'navy-orange',
    name: 'Navy + Orange',
    swatch: ['#1e3354', '#ffffff', '#f59e0b'],
    vars: {
      '--bg':  '#f4f5f8',  '--bg1': '#ffffff',  '--bg2': '#f0f2f7',  '--bg3': '#e3e7ee',
      '--b1':  '#dfe3eb',  '--b2':  '#c2cad8',
      '--t1':  '#1e3354',  '--t2':  '#3a4d70',  '--t3':  '#788aa6',
      '--acc': '#f59e0b',  '--accL': 'rgba(245,158,11,0.15)',
      '--grn': '#10b981',  '--yel': '#f59e0b', '--red': '#dc2626', '--pur': '#1e3354',
    },
  },

  // 26. Royal Blue — Image 2/3 (Free Dashboard UI Kit, vibrant blue + cyan)
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    swatch: ['#3b5bf6', '#ffffff', '#22d3ee'],
    vars: {
      '--bg':  '#f5f7ff',  '--bg1': '#ffffff',  '--bg2': '#eef2ff',  '--bg3': '#dde4ff',
      '--b1':  '#d6deff',  '--b2':  '#b1bdf0',
      '--t1':  '#1e1b4b',  '--t2':  '#3730a3',  '--t3':  '#6366f1',
      '--acc': '#3b5bf6',  '--accL': 'rgba(59,91,246,0.13)',
      '--grn': '#22d3ee',  '--yel': '#fbbf24', '--red': '#ef4444', '--pur': '#7c3aed',
    },
  },

  // 27. Clean Cards — Image 4 (Boardto reporting, white cards + teal accent)
  {
    id: 'clean-cards',
    name: 'Clean Cards',
    swatch: ['#ffffff', '#06b6d4', '#a78bfa'],
    vars: {
      '--bg':  '#f7f8fb',  '--bg1': '#ffffff',  '--bg2': '#f4f6fa',  '--bg3': '#eaeef5',
      '--b1':  '#e6eaf2',  '--b2':  '#c8cfdd',
      '--t1':  '#0f172a',  '--t2':  '#334155',  '--t3':  '#94a3b8',
      '--acc': '#06b6d4',  '--accL': 'rgba(6,182,212,0.12)',
      '--grn': '#10b981',  '--yel': '#f59e0b', '--red': '#f43f5e', '--pur': '#a78bfa',
    },
  },

  // 28. Analytics Bright — Image 5 (white + bold green/pink/orange cards)
  {
    id: 'analytics',
    name: 'Analytics Bright',
    swatch: ['#ffffff', '#10b981', '#ec4899'],
    vars: {
      '--bg':  '#fafbfc',  '--bg1': '#ffffff',  '--bg2': '#f4f6f8',  '--bg3': '#e8ecef',
      '--b1':  '#e2e6ea',  '--b2':  '#c5ccd2',
      '--t1':  '#10182a',  '--t2':  '#2e3a4f',  '--t3':  '#6b7785',
      '--acc': '#10b981',  '--accL': 'rgba(16,185,129,0.13)',
      '--grn': '#10b981',  '--yel': '#f59e0b', '--red': '#ec4899', '--pur': '#8b5cf6',
    },
  },

  // 29. Corporate Navy — Same family as Navy+Orange but darker mode
  {
    id: 'corporate-navy',
    name: 'Corporate Navy',
    swatch: ['#0f1f3a', '#3b82f6', '#f59e0b'],
    vars: {
      '--bg':  '#0a1525',  '--bg1': '#0f1f3a',  '--bg2': '#162a4a',  '--bg3': '#1f3a64',
      '--b1':  '#1f3358',  '--b2':  '#2d4570',
      '--t1':  '#e8eef8',  '--t2':  '#a8b9d4',  '--t3':  '#6b7fa0',
      '--acc': '#f59e0b',  '--accL': 'rgba(245,158,11,0.18)',
      '--grn': '#10b981',  '--yel': '#fbbf24', '--red': '#f87171', '--pur': '#3b82f6',
    },
  },
];

const STORAGE_KEY = 'stp_palette';

// Apply a palette by setting CSS vars on the html element.
// Pass null/undefined or the 'default' theme to clear all overrides.
export function applyTheme(themeId) {
  if(typeof document === 'undefined') return;
  const root = document.documentElement;
  const theme = THEMES.find(t => t.id === themeId);
  if(!theme || !theme.vars){
    // Clear any previously-set inline overrides so :root / [data-theme] win.
    THEMES.forEach(t => {
      if(!t.vars) return;
      Object.keys(t.vars).forEach(k => root.style.removeProperty(k));
    });
    return;
  }
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export function loadSavedTheme(){
  try { return localStorage.getItem(STORAGE_KEY) || 'default'; }
  catch { return 'default'; }
}

export function saveTheme(themeId){
  try { localStorage.setItem(STORAGE_KEY, themeId); } catch {}
}
