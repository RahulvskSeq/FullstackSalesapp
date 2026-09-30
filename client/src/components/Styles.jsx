// import React from 'react';
// export default function Styles({theme}){
//   return(
//     <style>{`
//     :root,[data-theme="dark"]{--bg:#080810;--bg1:#0e0e1a;--bg2:#141422;--bg3:#1a1a2e;--b1:#1e1e30;--b2:#252538;--t1:#e2e0f0;--t2:#9492a8;--t3:#55546a;--acc:#6366f1;--accL:rgba(99,102,241,0.15);--grn:#34d399;--yel:#fbbf24;--red:#f87171;--pur:#a78bfa;}
//     [data-theme="light"]{--bg:#f0f2f8;--bg1:#ffffff;--bg2:#f5f7fc;--bg3:#eef0f8;--b1:#e2e4f0;--b2:#d4d7e8;--t1:#1a1a2e;--t2:#4a4a6a;--t3:#8888aa;--acc:#4f52d8;--accL:rgba(79,82,216,0.1);--grn:#059669;--yel:#d97706;--red:#dc2626;--pur:#7c3aed;}

//     *{box-sizing:border-box;margin:0;padding:0}
//     html,body,#root{height:100%;width:100%}
//     body{background:var(--bg);color:var(--t1);font-family:Inter,system-ui,sans-serif;font-size:14px;transition:background .2s,color .2s;-webkit-text-size-adjust:100%}
//     ::-webkit-scrollbar{width:4px;height:4px}
//     ::-webkit-scrollbar-track{background:var(--bg1)}
//     ::-webkit-scrollbar-thumb{background:var(--b2);border-radius:3px}
//     button{cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent}
//     input,select,textarea,button{font-family:inherit;font-size:13px}
//     input,select,textarea{outline:none}

//     @keyframes spin{to{transform:rotate(360deg)}}
//     @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
//     @keyframes popIn{0%{opacity:0;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}
//     @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
//     .fade{animation:fadeIn .25s ease}
//     .spin{animation:spin .7s linear infinite}

//     /* ── Layout ── */
//     #app{display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden}

//     #topbar{
//       height:50px;min-height:50px;background:var(--bg1);border-bottom:1px solid var(--b1);
//       display:flex;align-items:center;padding:0 10px;gap:8px;flex-shrink:0;z-index:1200;
//       overflow:hidden;
//     }
//     #topbar .territory-bar{
//       display:flex;align-items:center;gap:10px;padding:3px 10px;
//       background:var(--bg2);border-radius:7px;border:1px solid var(--b2);
//       font-size:11px;flex-shrink:0;
//     }

//     #body{display:flex;flex:1;overflow:hidden;position:relative}

//     #sidebar{
//       width:200px;min-width:200px;background:var(--bg1);border-right:1px solid var(--b1);
//       display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;
//       transition:transform .25s ease,min-width .25s ease,width .25s ease;
//       z-index:1100;
//     }
//     #sidebar.closed{width:0;min-width:0;overflow:hidden;border:none}

//     #sb-overlay{
//       display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);
//       z-index:1090;backdrop-filter:blur(2px);
//     }
//     #sb-overlay.open{display:block}

//     #main{flex:1;overflow-y:auto;overflow-x:hidden;padding:18px;min-width:0}

//     /* ── Nav ── */
//     .nav-item{padding:9px 14px;font-size:13px;cursor:pointer;color:var(--t3);border-left:2px solid transparent;display:flex;align-items:center;gap:9px;transition:all .15s;user-select:none;white-space:nowrap}
//     .nav-item:hover{color:var(--t2);background:rgba(255,255,255,.03)}
//     .nav-item.active{color:var(--acc);border-left-color:var(--acc);background:var(--accL)}
//     .nav-sec{padding:14px 14px 6px;font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.15em}

//     /* ── Cards ── */
//     .card{background:var(--bg1);border:1px solid var(--b1);border-radius:12px;padding:16px 18px}
//     .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
//     .stat-card{background:var(--bg1);border:1px solid var(--b1);border-radius:10px;padding:12px 14px;transition:transform .15s,box-shadow .15s}
//     .stat-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.3)}
//     .prog-bar{height:3px;background:var(--b1);border-radius:2px;margin-top:8px;overflow:hidden}
//     .prog-fill{height:100%;border-radius:2px;transition:width .8s cubic-bezier(.4,0,.2,1)}

//     /* ── Table ── */
//     table{width:100%;border-collapse:collapse;font-size:13px}
//     th{padding:8px 10px;text-align:left;color:var(--t3);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;border-bottom:1px solid var(--b1);white-space:nowrap;background:var(--bg1);position:sticky;top:0;z-index:2}
//     th.sort{cursor:pointer}th.sort:hover{color:var(--acc)}
//     td{padding:7px 10px;border-bottom:1px solid var(--b2);color:var(--t2);vertical-align:middle;white-space:nowrap}
//     tr:hover td{background:var(--bg2)}
//     tfoot td{background:var(--bg2);font-weight:700}

//     /* ── Forms ── */
//     .inp{background:var(--bg2);border:1px solid var(--b2);border-radius:7px;padding:8px 12px;color:var(--t1);width:100%}
//     .inp:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--accL)}
//     .sel{background:var(--bg2);border:1px solid var(--b2);border-radius:7px;padding:7px 10px;color:var(--t1);cursor:pointer}
//     .sel:focus{border-color:var(--acc)}

//     /* ── Buttons ── */
//     .btn{background:var(--bg2);border:1px solid var(--b2);border-radius:7px;padding:7px 12px;color:var(--t2);transition:all .15s}
//     .btn:hover:not(:disabled){background:var(--bg3);color:var(--t1)}
//     .btn:disabled{opacity:.5;cursor:not-allowed}
//     .btnp{background:var(--acc);border:1px solid var(--acc);border-radius:7px;padding:8px 16px;color:#fff;font-weight:500;transition:all .15s;display:inline-flex;align-items:center;gap:5px}
//     .btnp:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px)}
//     .btnd{background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,.25);border-radius:6px;padding:5px 10px;color:var(--red);font-size:12px;display:inline-flex;align-items:center;gap:4px}
//     .btne{background:var(--accL);border:1px solid rgba(99,102,241,.3);border-radius:6px;padding:5px 10px;color:var(--pur);font-size:12px}

//     /* ── Theme toggle ── */
//     .theme-toggle{width:36px;height:20px;border-radius:10px;background:var(--bg3);border:1px solid var(--b2);position:relative;cursor:pointer;flex-shrink:0;transition:background .3s}
//     .theme-toggle::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--acc);transition:transform .3s}
//     [data-theme="light"] .theme-toggle::after{transform:translateX(16px)}

//     /* ── Modal / Overlay ── */
//     .overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(3px);padding:16px}
//     .modal{background:var(--bg1);border:1px solid var(--b2);border-radius:14px;padding:22px;max-height:92vh;overflow-y:auto;width:100%;animation:popIn .2s ease}

//     /* ── Misc ── */
//     .field{margin-bottom:12px}
//     .field label{display:block;font-size:11px;color:var(--t3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em}
//     .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
//     .full{grid-column:1/-1}
//     .row{display:flex;align-items:center;gap:8px}
//     .spacer{flex:1}
//     .tabs{display:flex;gap:2px;border-bottom:1px solid var(--b1);margin-bottom:16px;overflow-x:auto;-webkit-overflow-scrolling:touch}
//     .tab{padding:8px 14px;font-size:13px;cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;color:var(--t3);margin-bottom:-1px;transition:all .15s;white-space:nowrap;flex-shrink:0}
//     .tab.active{color:var(--acc);border-bottom-color:var(--acc);font-weight:600}
//     .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
//     .chip{background:var(--bg3);border:1px solid var(--b2);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--t3)}
//     .insight-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:14px;font-size:12px;font-weight:500;border:1px solid currentColor;opacity:.9}
//     .skel{background:linear-gradient(90deg,var(--bg2) 0%,var(--bg3) 50%,var(--bg2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite;border-radius:6px;display:block}

//     /* ── Topbar responsive helpers ── */
//     .hide-sm{display:flex}
//     .territory-bar{display:flex}
//     .topbar-brand{}

//     /* ── RESPONSIVE ── */

//     /* Tablet: 768px and below */
//     @media(max-width:768px){
//       #topbar{padding:0 8px;gap:6px;height:48px;min-height:48px}
//       #topbar .territory-bar{display:none !important}
//       .hide-sm{display:none !important}
//       .topbar-brand{display:none !important}
//       #sidebar{
//         position:fixed;left:0;top:48px;bottom:0;
//         width:240px;min-width:240px;
//         transform:translateX(-100%);
//         box-shadow:4px 0 24px rgba(0,0,0,.4);
//       }
//       #sidebar.closed{transform:translateX(-100%);width:240px;min-width:240px;overflow:hidden;border-right:1px solid var(--b1)}
//       #sidebar.open{transform:translateX(0)}
//       #main{padding:12px}
//       .stat-grid{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
//       .stat-card{padding:10px 12px}
//       .card{padding:12px 14px}
//       .hmob{display:none}
//       .modal{padding:16px;border-radius:12px}
//       table{font-size:12px}
//       th,td{padding:6px 8px}
//     }

//     /* Mobile: 480px and below */
//     @media(max-width:480px){
//       #topbar{height:44px;min-height:44px;padding:0 6px;gap:4px}
//       #sidebar{top:44px;width:260px;min-width:260px}
//       #sidebar.closed{width:260px;min-width:260px}
//       #main{padding:10px}
//       .stat-grid{grid-template-columns:1fr 1fr;gap:6px}
//       .stat-card{padding:8px 10px}
//       .stat-card .stat-value{font-size:20px}
//       .card{padding:10px 12px;border-radius:10px}
//       .btnp{padding:7px 12px;font-size:12px}
//       .btn{padding:6px 10px;font-size:12px}
//       .tabs{gap:0}
//       .tab{padding:7px 10px;font-size:12px}
//       .modal{padding:12px;border-radius:10px}
//       .overlay{padding:10px}
//       .g2{grid-template-columns:1fr}
//       table{font-size:11px}
//       th,td{padding:5px 6px}
//       /* Stack filter rows */
//       .filter-row{flex-direction:column;align-items:stretch}
//       .filter-row .inp{width:100%}
//     }

//     /* Very small: 360px */
//     @media(max-width:360px){
//       .stat-grid{grid-template-columns:1fr}
//       #topbar .brand-text{display:none}
//     }

//     /* Desktop: keep sidebar always visible */
//     @media(min-width:769px){
//       #sidebar{transform:none !important;position:relative;top:auto;box-shadow:none}
//       #sidebar.closed{transform:none !important;width:0;min-width:0;overflow:hidden;border:none}
//       #sb-overlay{display:none !important}
//     }

//     /* Touch devices — bigger tap targets */
//     @media(hover:none) and (pointer:coarse){
//       .nav-item{padding:11px 14px}
//       .btn{padding:9px 14px}
//       .tab{padding:10px 14px}
//       th,td{padding:9px 10px}
//     }
//     `}</style>
//   );
// }



import React from 'react';
export default function Styles({theme}){
  return(
    <style>{`
    :root{--bg:#e4e8ee;--bg1:#f7f8fa;--bg2:#e9edf3;--bg3:#dde3ea;--b1:#d6dce5;--b2:#c8d0db;--t1:#252f40;--t2:#4a5568;--t3:#6b7289;--acc:#344767;--accL:rgba(52,71,103,0.09);--grn:#0f766e;--yel:#b45309;--red:#c62828;--pur:#6d28d9;}

    *{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;width:100%}
    body{background:var(--bg);color:var(--t1);font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.45;transition:background .2s,color .2s;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    ::-webkit-scrollbar{width:8px;height:8px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:var(--b2);border-radius:8px;border:2px solid transparent;background-clip:padding-box}
    button{cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent}
    input,select,textarea,button{font-family:inherit;font-size:13px}
    input,select,textarea{outline:none}

    @keyframes spin{to{transform:rotate(360deg)}}
    /* Used by the update button's dot — a quiet nudge that a build is waiting. */
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes skel{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .skel{background:linear-gradient(90deg,var(--bg2) 25%,var(--bg3) 50%,var(--bg2) 75%);background-size:200% 100%;animation:skel 1.4s ease-in-out infinite}
    .skel-wrap{animation:fadeIn .2s ease}
    @media (prefers-reduced-motion:reduce){.skel{animation:none}}
    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn{0%{opacity:0;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .fade{animation:fadeIn .25s ease}
    .spin{animation:spin .7s linear infinite}

    /* ── Layout ── */
    #app{display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden}

    /* Safe areas. targetSdk 35 means Android 15 draws the app edge-to-edge, so
       the WebView sits BEHIND the status bar and the nav bar — the top row
       collided with the system clock and the page bottom sat under the
       navigation buttons. env() only returns non-zero with viewport-fit=cover,
       which is set in index.html. */
    #topbar{
      /* Inset goes FIRST in the shorthand. A separate padding-top line would
         be silently wiped by the padding shorthand that follows it. */
      padding:env(safe-area-inset-top) 10px 0;
      height:calc(50px + env(safe-area-inset-top));
      min-height:calc(50px + env(safe-area-inset-top));
      background:var(--bg1);border-bottom:1px solid var(--b1);
      display:flex;align-items:center;gap:8px;flex-shrink:0;z-index:1200;
      overflow:hidden;
    }
    #topbar .territory-bar{
      display:flex;align-items:center;gap:10px;padding:3px 10px;
      background:var(--bg2);border-radius:7px;border:1px solid var(--b2);
      font-size:11px;flex-shrink:0;
    }

    #body{display:flex;flex:1;overflow:hidden;position:relative}

    #sidebar{
      padding-bottom:env(safe-area-inset-bottom);position:relative;
      width:var(--sbw,240px);min-width:var(--sbw,240px);background:var(--bg1);border-right:1px solid var(--b1);
      display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;
      transition:transform .25s ease;
      z-index:1100;
    }
    #sidebar.closed{width:0;min-width:0;overflow:hidden;border:none}
    /* drag handle on the sidebar's right edge (desktop) — the width is remembered */
    .sb-resizer{position:fixed;top:0;bottom:0;width:7px;cursor:col-resize;z-index:1200;background:transparent;transition:background .15s}
    .sb-resizer:hover,.sb-resizer.dragging{background:var(--accL)}
    .sb-resizer::after{content:'';position:absolute;top:50%;left:2px;width:3px;height:36px;margin-top:-18px;border-radius:2px;background:var(--b2);opacity:0;transition:opacity .15s}
    .sb-resizer:hover::after,.sb-resizer.dragging::after{opacity:1;background:var(--acc)}
    @media (max-width:768px){.sb-resizer{display:none}}
    @media (max-width:768px){.ov-search-row{flex-direction:column}}
    @media (max-width:640px){.imp-hint{display:none !important}}

    #sb-overlay{
      display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);
      z-index:1090;backdrop-filter:blur(2px);
    }
    #sb-overlay.open{display:block}

    #main{flex:1;overflow-y:auto;overflow-x:hidden;padding:18px;padding-bottom:calc(18px + env(safe-area-inset-bottom));min-width:0}

    /* ── Nav ── */
    .nav-item{padding:11px 14px;font-size:14px;font-weight:600;cursor:pointer;color:var(--t2);border-left:2px solid transparent;display:flex;align-items:center;gap:10px;transition:all .15s;user-select:none;white-space:nowrap;letter-spacing:.01em}
    .nav-item:hover{color:var(--t2);background:rgba(255,255,255,.03)}
    .nav-item.active{color:var(--acc);border-left-color:var(--acc);background:var(--accL);font-weight:700}
    /* group header: the section. When one of its pages is open the HEADER
       carries the filled style; the page itself sits under it, indented and
       lightly tinted, so section and sub-section read as two levels. */
    .nav-group{font-size:12.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--t2)}
    .nav-group.open{color:var(--t1)}
    .nav-group.has-active{color:#fff;border-left-color:var(--acc);background:var(--acc);font-weight:800;border-radius:6px;margin:2px 8px}
    /* sub-items: one unbroken guide line down the group, items indented inside it */
    .nav-children{margin:2px 0 6px 25px;border-left:2px solid var(--b2)}
    .nav-child{font-size:13.5px;padding:9px 12px 9px 14px;border-left:none;color:var(--t2);font-weight:500;margin:0}
    .nav-child:hover{color:var(--t1);background:rgba(255,255,255,.03)}
    .nav-child.active{color:var(--acc);background:transparent;font-weight:700;border-left:none}
    /* the open page: accent text, a soft tint, no underline */
    .nav-child.active{background:var(--accL);border-radius:6px;margin:1px 8px 1px 0}
    .nav-sec{padding:15px 14px 6px;font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.14em}

    /* ── Cards ──
       --shadow / --shadowHover default to the flat dark look. A light palette
       (see themes.js) sets them to soft elevation shadows instead. */
    .card{background:var(--bg1);border:1px solid var(--b1);border-radius:12px;padding:16px 18px;box-shadow:var(--shadow,none)}
    .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
    .stat-card{background:var(--bg1);border:1px solid var(--b1);border-radius:10px;padding:12px 14px;transition:transform .15s,box-shadow .15s;box-shadow:var(--shadow,none)}
    .stat-card:hover{transform:translateY(-2px);box-shadow:var(--shadowHover,0 4px 16px rgba(0,0,0,.3))}
    .modal{box-shadow:var(--shadowHover,0 20px 60px rgba(0,0,0,.5))}
    .prog-bar{height:3px;background:var(--b1);border-radius:2px;margin-top:8px;overflow:hidden}
    .prog-fill{height:100%;border-radius:2px;transition:width .8s cubic-bezier(.4,0,.2,1)}

    /* ── Table ── */
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{padding:8px 10px;text-align:left;color:var(--t3);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;border-bottom:1px solid var(--b1);white-space:nowrap;background:var(--bg1);position:sticky;top:0;z-index:2}
    th.sort{cursor:pointer}th.sort:hover{color:var(--acc)}
    td{padding:7px 10px;border-bottom:1px solid var(--b2);color:var(--t2);vertical-align:middle;white-space:nowrap}
    tr:hover td{background:var(--bg2)}
    tfoot td{background:var(--bg2);font-weight:700}

    /* ── Forms ── */
    .inp{background:var(--bg2);border:1px solid var(--b2);border-radius:7px;padding:8px 12px;color:var(--t1);width:100%}
    .inp:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--accL)}
    /* The native date/time picker glyph is near-black and vanishes on dark
       surfaces, so --pickerFilter inverts it by default. Light themes and
       light palettes set it to none, keeping it readable on white. */
    input[type="date"]::-webkit-calendar-picker-indicator,
    input[type="time"]::-webkit-calendar-picker-indicator,
    input[type="month"]::-webkit-calendar-picker-indicator,
    input[type="datetime-local"]::-webkit-calendar-picker-indicator{
      filter:var(--pickerFilter,invert(1));opacity:.8;cursor:pointer
    }
    input[type="date"]::-webkit-calendar-picker-indicator:hover{opacity:1}
    [data-theme="light"]{--pickerFilter:none}
    .sel{background:var(--bg2);border:1px solid var(--b2);border-radius:7px;padding:7px 10px;color:var(--t1);cursor:pointer}
    .sel:focus{border-color:var(--acc)}

    /* ── Buttons ── */
    .btn{background:var(--bg2);border:1px solid var(--b2);border-radius:7px;padding:7px 12px;color:var(--t2);transition:all .15s}
    .btn:hover:not(:disabled){background:var(--bg3);color:var(--t1)}
    .btn:disabled{opacity:.5;cursor:not-allowed}
    button{-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
    .btnp{background:var(--acc);border:1px solid var(--acc);border-radius:7px;padding:8px 16px;color:#fff;font-weight:500;transition:all .15s;display:inline-flex;align-items:center;gap:5px}
    .btnp:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px)}
    .btnd{background:rgba(248,113,113,0.12);border:1px solid rgba(248,113,113,.25);border-radius:6px;padding:5px 10px;color:var(--red);font-size:12px;display:inline-flex;align-items:center;gap:4px}
    .btne{background:var(--accL);border:1px solid rgba(99,102,241,.3);border-radius:6px;padding:5px 10px;color:var(--pur);font-size:12px}

    /* ── Theme toggle ── */
    .theme-toggle{width:36px;height:20px;border-radius:10px;background:var(--bg3);border:1px solid var(--b2);position:relative;cursor:pointer;flex-shrink:0;transition:background .3s}
    .theme-toggle::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--acc);transition:transform .3s}
    [data-theme="light"] .theme-toggle::after{transform:translateX(16px)}

    /* ── Modal / Overlay ── */
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:2000;backdrop-filter:blur(3px);padding:16px}
    .modal{background:var(--bg1);border:1px solid var(--b2);border-radius:14px;padding:22px;max-height:92vh;overflow-y:auto;width:100%;animation:popIn .2s ease}

    /* ── Misc ── */
    .field{margin-bottom:12px}
    .field label{display:block;font-size:11px;color:var(--t3);margin-bottom:4px;text-transform:uppercase;letter-spacing:.07em}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .full{grid-column:1/-1}
    .row{display:flex;align-items:center;gap:8px}
    .spacer{flex:1}
    .tabs{display:flex;gap:2px;border-bottom:1px solid var(--b1);margin-bottom:16px;overflow-x:auto;-webkit-overflow-scrolling:touch}
    .tab{padding:8px 14px;font-size:13px;cursor:pointer;background:none;border:none;border-bottom:2px solid transparent;color:var(--t3);margin-bottom:-1px;transition:all .15s;white-space:nowrap;flex-shrink:0}
    .tab.active{color:var(--acc);border-bottom-color:var(--acc);font-weight:600}
    .scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .chip{background:var(--bg3);border:1px solid var(--b2);border-radius:4px;padding:2px 7px;font-size:11px;color:var(--t3)}
    /* Solid filled pill (see utils.fillChip) — the tinted version washed out
       on light themes. Squared-off radius to match the rest of the UI. */
    .insight-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:14px;font-size:12px;font-weight:500;border:1px solid currentColor;opacity:.9}
    /* The three movement cards that replaced the old chip row. Lift on hover
       so they read as clickable — each opens the dealer list behind it. */
    /* ── MTD summary on Home: header, KPI strip, salesman cards ── */
    .mtd-wrap{padding:14px!important;margin-bottom:0}
    .mtd-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
    .mtd-title{display:flex;flex-direction:column;min-width:0}
    .mtd-title b{font-size:15px;font-weight:800;color:var(--t1)}
    .mtd-title small{font-size:11.5px;color:var(--t3)}
    .mtd-month{width:auto!important;min-width:120px;font-size:12.5px!important;font-weight:700}
    .mtd-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:14px}
    .mtd-kpi{position:relative;display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:12px;min-width:0;
      background:color-mix(in srgb,var(--tone) 8%,var(--bg1));border:1px solid color-mix(in srgb,var(--tone) 22%,transparent)}
    .mtd-kpi>span{font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:color-mix(in srgb,var(--tone) 75%,var(--t2))}
    .mtd-kpi>b{font-size:20px;font-weight:850;color:var(--t1);letter-spacing:-.01em;line-height:1.15}
    .mtd-kpi>b small{font-size:12px;color:var(--t3);font-weight:700}
    .mtd-kpi>b.nm{font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mtd-kpi>small{font-size:10.5px;color:var(--t3)}
    .mtd-kpi .pbar,.mtd-sm .pbar{width:100%!important;max-width:none!important;margin-top:4px}
    .mtd-sm .pbar{height:6px;margin-top:0}
    .mtd-groups{display:flex;flex-direction:column;gap:16px}
    .mtd-ghead{display:flex;align-items:center;gap:8px;padding:0 2px 8px;border-bottom:1px dashed var(--b2);margin-bottom:10px}
    .mtd-ghead>b{font-size:13.5px;font-weight:800;color:var(--t1)}
    .mtd-gfig{font-size:12px;color:var(--t3)}
    .mtd-gfig b{color:var(--t1);font-weight:800}
    .mtd-gpct{font-size:11.5px;font-weight:800;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent);padding:2px 9px;border-radius:999px}
    .mtd-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
    .mtd-sm{position:relative;display:flex;flex-direction:column;gap:8px;padding:13px 13px 12px;border-radius:14px;background:var(--bg1);border:1px solid var(--b1);overflow:hidden;
      transition:transform .15s,box-shadow .15s;animation:pageIn .35s ease both}
    .mtd-sm::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--tone),color-mix(in srgb,var(--tone) 25%,transparent))}
    .mtd-sm:hover{transform:translateY(-2px);box-shadow:var(--shadowHover)}
    .mtd-sm-top{display:flex;align-items:center;gap:9px;min-width:0}
    .mtd-sm-nm{display:flex;flex-direction:column;min-width:0;flex:1}
    .mtd-sm-nm b{font-size:13.5px;font-weight:800;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mtd-sm-nm small{font-size:10.5px;color:var(--t3)}
    .mtd-sm-pct{display:flex;flex-direction:column;align-items:flex-end}
    .mtd-sm-pct b{font-size:20px;font-weight:850;color:var(--tone);line-height:1}
    .mtd-sm-pct small{font-size:9.5px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.06em}
    .mtd-sm-fig{display:flex;align-items:baseline;gap:6px}
    .mtd-sm-fig b{font-size:17px;font-weight:850;color:var(--t1)}
    .mtd-sm-fig span{font-size:11.5px;color:var(--t3)}
    .mtd-sm-cats{display:grid;grid-template-columns:1fr 1fr;gap:7px 12px;margin-top:2px;padding-top:9px;border-top:1px solid var(--b1)}
    .mtd-cat{display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:'dot nm nm' 'bar bar v';align-items:center;column-gap:6px;row-gap:3px;min-width:0}
    .mtd-cat-dot{grid-area:dot}.mtd-cat-nm{grid-area:nm}.mtd-cat-v{grid-area:v}
    .mtd-cat-dot{width:7px;height:7px;border-radius:50%}
    .mtd-cat-nm{font-size:10px;font-weight:700;color:var(--t2);text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
    .mtd-cat-v{font-size:11px;white-space:nowrap}
    .mtd-cat-v b{font-weight:800}
    .mtd-cat-v small{color:var(--t3);font-size:10px}
    .mtd-cat-bar{grid-area:bar;height:5px;border-radius:3px;background:var(--bg3);overflow:hidden}
    .mtd-cat-bar>div{height:100%;border-radius:3px;transform-origin:left;animation:barGrow .8s cubic-bezier(.2,.8,.2,1) both}
    .mtd-none{font-size:12px;color:var(--t3)}
    .mtd-tip{font-size:11.5px;color:var(--acc);padding:8px 14px;border-top:1px solid var(--b1);background:var(--accL)}
    .mtd-wrap .mtd-card{margin-top:0!important}
    @media(max-width:600px){
      .mtd-wrap{padding:12px!important}
      .mtd-head .seg{order:5;width:100%;display:flex}.mtd-head .seg-b{flex:1}
      .mtd-kpis{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
      .mtd-kpi{padding:8px 9px}.mtd-kpi>b{font-size:16px}.mtd-kpi>b.nm{font-size:12.5px}
      .mtd-cards{grid-template-columns:1fr}
    }
    @media (prefers-reduced-motion:reduce){.mtd-sm,.mtd-cat-bar>div{animation:none}}
    /* MTD summary — simple table */
    .mt3-wrap{border:1px solid var(--b1);border-radius:14px;overflow:hidden;background:var(--bg1)}
    .mt3{width:100%;border-collapse:collapse;font-size:13.5px}
    .mt3 th{background:var(--bg2);color:var(--t3);font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;text-align:right;padding:10px 16px;border-bottom:1px solid var(--b1)}
    .mt3 td{padding:11px 16px;text-align:right;border-bottom:1px solid var(--b1);color:var(--t2);font-variant-numeric:tabular-nums;white-space:nowrap}
    .mt3 .l{text-align:left}
    .mt3 .w{width:34%}
    .mt3 td.b{color:var(--t1);font-weight:800}
    .mt3-region td{background:var(--bg2);color:var(--t1);font-weight:800;font-size:12.5px;padding-top:8px;padding-bottom:8px}
    .mt3-region td.l{text-transform:uppercase;letter-spacing:.05em;font-size:11.5px}
    .mt3-region td.l span{color:var(--t3);font-weight:700}
    .mt3-row{cursor:pointer;transition:background .12s}
    .mt3-row:hover td,.mt3-row.open td{background:color-mix(in srgb,var(--acc) 5%,var(--bg1))}
    .mt3-who{display:flex;align-items:center;gap:10px}
    .mt3-name{font-weight:700;color:var(--t1)}
    .mt3-chev{color:var(--t3);transition:transform .15s;flex-shrink:0}
    .mt3-row.open .mt3-chev{transform:rotate(90deg)}
    .mt3-ach{display:flex;align-items:center;gap:10px;justify-content:flex-end}
    .mt3-pct{min-width:48px;text-align:center;font-size:12px;font-weight:800;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent);padding:2px 8px;border-radius:999px}
    .mt3-pct.none{--tone:var(--t3);color:var(--t3);background:var(--bg2);font-weight:600}
    .mt3-bar{flex:1;max-width:220px;height:7px;border-radius:4px;background:var(--bg3);overflow:hidden}
    .mt3-bar>div{height:100%;border-radius:4px;transform-origin:left;animation:barGrow .8s cubic-bezier(.2,.8,.2,1) both}
    .mt3-muted{color:var(--t3)}
    .mt3-detail td{background:var(--bg2);padding:10px 16px 12px;text-align:left;white-space:normal}
    .mt3-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px 18px}
    .mt3-cat{display:flex;align-items:center;gap:8px;font-size:12.5px;padding:5px 0;border-bottom:1px dashed var(--b1)}
    .mt3-cat-n{flex:1;font-weight:700;color:var(--t2);text-transform:uppercase;font-size:11px;letter-spacing:.04em}
    .mt3-cat-v{color:var(--t3)}
    .mt3-cat-v b{color:var(--t1)}
    .mt3-grand td{background:color-mix(in srgb,var(--acc) 8%,var(--bg1));color:var(--t1);font-weight:850;border-bottom:none;border-top:2px solid color-mix(in srgb,var(--acc) 30%,transparent)}
    @media(max-width:600px){
      .mt3{font-size:12.5px}
      .mt3 th,.mt3 td{padding:9px 8px}
      .mt3 .w{width:auto}
      .mt3-bar{display:none}
      .mt3-who .ini{display:none}
      .mt3-cats{grid-template-columns:1fr}
    }
    @media (prefers-reduced-motion:reduce){.mt3-bar>div{animation:none}}
    /* MTD summary table (Home) */
    .mt2-wrap{overflow:auto;max-height:72vh;border:1px solid var(--b1);border-radius:14px;background:var(--bg1)}
    .mt2{width:100%;border-collapse:separate;border-spacing:0;font-size:12.5px}
    .mt2 th{position:sticky;top:0;z-index:2;background:var(--bg2);color:var(--t3);font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
      text-align:right;padding:10px 12px;border-bottom:1px solid var(--b2);white-space:nowrap}
    .mt2 td{padding:9px 12px;border-bottom:1px solid var(--b1);text-align:right;vertical-align:middle;white-space:nowrap}
    .mt2 .mt2-sm{position:sticky;left:0;z-index:1;text-align:left;background:var(--bg1);min-width:190px;box-shadow:1px 0 0 var(--b1)}
    .mt2 th.mt2-sm{z-index:3;background:var(--bg2)}
    .mt2 .mt2-tot{min-width:170px;background:color-mix(in srgb,var(--acc) 4%,var(--bg1));border-right:1px solid var(--b1)}
    .mt2 th.mt2-tot{background:color-mix(in srgb,var(--acc) 9%,var(--bg2));color:var(--acc)}
    .mt2 .mt2-cat{min-width:96px}
    .mt2-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;vertical-align:1px}
    .mt2-row:hover td{background:var(--bg2)}
    .mt2-row:hover td.mt2-tot{background:color-mix(in srgb,var(--acc) 7%,var(--bg2))}
    .mt2-who{display:flex;align-items:center;gap:9px;min-width:0}
    .mt2-rank{width:18px;font-size:11px;font-weight:800;color:var(--t3);text-align:center;flex-shrink:0}
    .mt2-name{font-weight:800;color:var(--t1);font-size:13px;overflow:hidden;text-overflow:ellipsis}
    .mt2-reg{font-size:10.5px;color:var(--t3)}
    .mt2-tv{display:flex;align-items:baseline;justify-content:flex-end;gap:5px}
    .mt2-tv b{font-size:15px;font-weight:850;color:var(--t1)}
    .mt2-tv span{font-size:11px;color:var(--t3)}
    .mt2-tv em{font-style:normal;font-size:11px;font-weight:800;color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent);padding:1px 7px;border-radius:999px;margin-left:3px}
    .mt2-cv{display:flex;align-items:baseline;justify-content:flex-end;gap:1px}
    .mt2-cv b{font-weight:800;font-size:12.5px}
    .mt2-cv span{font-size:10.5px;color:var(--t3)}
    .mt2-cv.sub b{color:var(--t1)}
    .mt2-bar{height:4px;border-radius:3px;background:var(--bg3);overflow:hidden;margin-top:4px;margin-left:auto;width:72px}
    .mt2-bar.big{height:6px;width:100%}
    .mt2-bar>div{height:100%;border-radius:3px;transform-origin:left;animation:barGrow .8s cubic-bezier(.2,.8,.2,1) both}
    .mt2-nil{color:var(--t3)}
    .mt2-region td{background:var(--bg2)!important;padding-top:8px;padding-bottom:8px;border-bottom:1px solid var(--b2)}
    .mt2-region .mt2-sm b{font-size:12.5px;font-weight:850;color:var(--t1);margin-right:6px;text-transform:uppercase;letter-spacing:.04em}
    .mt2-region .mt2-tv b{font-size:13.5px}
    .mt2-grand td{position:sticky;bottom:0;background:color-mix(in srgb,var(--acc) 10%,var(--bg1))!important;border-top:2px solid color-mix(in srgb,var(--acc) 35%,transparent);border-bottom:none;font-weight:800}
    .mt2-grand .mt2-sm b{font-size:13px;color:var(--acc)}
    @media(max-width:600px){.mt2 .mt2-sm{min-width:150px}.mt2 .mt2-tot{min-width:140px}.mt2-rank{display:none}}
    @media (prefers-reduced-motion:reduce){.mt2-bar>div{animation:none}}
    /* ── MTD Sales Summary ────────────────────────────────────────────
       A wide planning grid: 9 categories x (target|ach) plus totals. Styled
       around a banded header, a highlighted answer column and soft striping —
       the pattern that makes a table this wide scannable.

       Everything derives from --acc, so it follows whichever of the 30
       palettes is active instead of pinning one hue. */
    .mtd-card{
      border:1px solid var(--b2);
      border-radius:14px;
      box-shadow:0 4px 20px rgba(0,0,0,.10);
    }

    /* Header: a solid band, not faint grey text on the page background. */
    .mtd-table thead th{
      background:var(--accL);
      color:var(--t1);
      font-size:10px;font-weight:800;
      letter-spacing:.08em;text-transform:uppercase;
      padding:9px 10px;white-space:nowrap;
      border-bottom:1px solid var(--b2);
    }
    /* Two header rows, both sticky. The second must be offset by the first's
       height or it scrolls underneath it. */
    .mtd-table thead tr:first-child th{position:sticky;top:0;z-index:6}
    .mtd-table thead tr:last-child  th{position:sticky;top:34px;z-index:5}

    /* Region + Salesman stay put when scrolling sideways past nine
       categories — a row of numbers that belongs to nobody is useless.
       A sticky cell needs its own opaque background or the columns scroll
       straight through it. */
    .mtd-table tbody td:first-child,
    .mtd-table tfoot  td:first-child{position:sticky;left:0;z-index:2;background:var(--bg1)}
    .mtd-table tbody tr:hover td:first-child{background:var(--bg2)}

    .mtd-table td{padding:7px 10px;border-bottom:1px solid var(--b1)}
    /* Digits must line up: proportional figures give 5000 and 167 different
       widths, which is what stops a numeric column scanning. */
    .mtd-table td,.mtd-table th{font-variant-numeric:tabular-nums}

    /* Soft striping in the accent hue rather than flat grey. */
    .mtd-table tbody tr:nth-child(even) td{background:var(--bg2)}
    .mtd-table tbody tr{transition:background .12s}
    .mtd-table tbody tr:hover td{background:var(--accL)}

    /* Each category is a target|ach PAIR; alternate pairs are tinted so the
       two halves read as one column instead of eighteen loose ones. */
    .mtd-table .cat-start{border-left:1px solid var(--b1)}
    .mtd-table .cat-alt{background:rgba(127,127,127,.05)}

    /* The answer column — banded down the whole table like the reference. */
    .mtd-table .col-total{background:var(--accL)!important}
    .mtd-table .col-total-start{border-left:1px solid var(--b2)}

    /* Subtotal and grand total: bands the eye can land on. */
    .mtd-table .row-subtotal td{background:var(--bg3);font-weight:800;
      border-top:1px solid var(--b1);border-bottom:1px solid var(--b1)}
    .mtd-table .row-grand td{background:var(--accL);font-weight:800;
      border-top:1px solid var(--b2);font-size:13.5px}

    /* Target inputs stay quiet until touched, so a screen of empty cells
       doesn't read as a screen of form fields. */
    .mtd-table input[type=number]{transition:border-color .12s,background .12s}
    .mtd-table input[type=number]:hover{background:var(--bg3)}
    .mtd-table input[type=number]:focus{
      border-color:var(--acc)!important;background:var(--bg1);
      box-shadow:0 0 0 2px var(--accL);outline:none;
    }
    /* Chrome's number spinners take most of the cell at this density. */
    .mtd-table input[type=number]::-webkit-outer-spin-button,
    .mtd-table input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
    .mtd-table input[type=number]{-moz-appearance:textfield}


    .insight-card{transition:transform .15s, box-shadow .15s, filter .15s}
    .insight-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.28);filter:brightness(1.06)}
    .insight-card:active{transform:translateY(0)}
    /* Category filter trigger — same lift as the movement cards it sits beside. */
    .cat-filter-btn{transition:transform .15s, box-shadow .15s, filter .15s}
    .cat-filter-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.22);filter:brightness(1.05)}
    .skel{background:linear-gradient(90deg,var(--bg2) 0%,var(--bg3) 50%,var(--bg2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite;border-radius:6px;display:block}

    /* ── Product skin ─────────────────────────────────────────────────
       One set of shape rules for all three themes (themes.js). Every colour
       here is a variable the theme sets, so Light, Dark and Sunlight share
       the same finish: borderless cards on a tinted page, a solid top bar,
       banded table headers, pill-shaped active navigation. */
    [data-palette] .card,
    [data-palette] .stat-card,
    [data-palette] .modal{border:none}
    [data-palette] .card{border-radius:10px;padding:16px 18px}
    [data-palette] .stat-card{border-radius:10px}
    [data-palette] .modal{border-radius:14px}
    [data-palette="sunlight"] .card,
    [data-palette="sunlight"] .stat-card,
    [data-palette="sunlight"] .modal{border:1px solid var(--b1)}
    [data-palette] .overlay{background:var(--overlay)}
    .login-as-row:hover{background:var(--bg2)}
    /* Top bar: a solid band. Re-declaring the neutral variables inside it
       flips every child that uses them to light-on-dark automatically. */
    [data-palette] #topbar{
      background:var(--topbarBg);border-bottom:none;box-shadow:var(--topbarShadow);
      --t1:#ffffff; --t2:#d3dcec; --t3:#a2b2cc;
      --bg1:var(--topbarRaise); --bg2:var(--topbarRaise); --bg3:var(--topbarLine);
      --b1:var(--topbarLine); --b2:var(--topbarLine);
      --acc:#ffffff; --accL:rgba(255,255,255,.16);
    }
    [data-palette] #topbar .btn{
      background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.26);color:#e8eefa;box-shadow:none}
    [data-palette] #topbar .btn:hover:not(:disabled){background:rgba(255,255,255,.20);color:#fff}
    [data-palette] #sidebar{border-right:none;box-shadow:var(--sidebarShadow)}
    [data-palette] .nav-item{
      border-left:none;border-radius:8px;margin:2px 10px;padding:9px 12px;color:var(--t2)}
    [data-palette] .nav-item:hover{background:var(--bg2);color:var(--t1)}
    [data-palette] .nav-item.active{
      background:var(--acc);color:#fff;font-weight:600;box-shadow:var(--accShadow)}
    [data-palette] .nav-group.has-active{
      background:var(--acc);color:#fff;box-shadow:var(--accShadow)}
    [data-palette] .nav-children{margin:2px 10px 6px 30px;border-left:2px solid var(--b2)}
    [data-palette] .nav-child{margin:2px 0 2px 6px;border-radius:7px;border-left:none;color:var(--t2)}
    [data-palette] .nav-child.active{background:var(--accL);color:var(--acc);box-shadow:none}
    [data-palette] th{
      background:var(--thBg);border-bottom:1px solid var(--thBorder);color:var(--t2);font-size:10.5px}
    [data-palette] td{border-bottom:1px solid var(--tdBorder)}
    [data-palette] tr:hover td{background:var(--rowHover)}
    [data-palette] tfoot td{background:var(--tfootBg)}
    [data-palette] td,[data-palette] th{font-variant-numeric:tabular-nums}
    [data-palette] .inp,
    [data-palette] .sel{
      background:var(--inpBg);border:1px solid var(--inpBorder);border-radius:8px;color:var(--t1)}
    [data-palette] .inp:focus,
    [data-palette] .sel:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--accL)}
    [data-palette] .btn{
      background:var(--btnBg);border:1px solid var(--btnBorder);border-radius:8px;color:var(--t2);font-weight:600;
      box-shadow:var(--btnShadow)}
    [data-palette] .btn:hover:not(:disabled){background:var(--btnHover);color:var(--t1)}
    [data-palette] .btnp{border-radius:8px;font-weight:600;box-shadow:var(--accShadow)}
    [data-palette] .btnd,
    [data-palette] .btne{border-radius:7px}
    [data-palette] .tabs{border-bottom:1px solid var(--bg3)}
    [data-palette] .chip{border-radius:6px;background:var(--bg2);border:1px solid var(--b2);color:var(--t2);font-weight:500}
    /* keyboard users see where they are; mouse users do not get a ring */
    [data-palette] :focus-visible{outline:2px solid var(--acc);outline-offset:2px}
    [data-palette] .btn:focus:not(:focus-visible),
    [data-palette] .btnp:focus:not(:focus-visible){outline:none}
    ::selection{background:var(--accL)}
    /* ── Light themes: solid status colours ─────────────────────────────
       Each chip/card publishes its own hue as --c and a contrast-checked
       text colour as --fg (see utils.readableOn). On light themes they
       become solid fills; the dark theme keeps its soft translucent tints. */
    [data-tone="light"] .insight-chip,
    [data-tone="light"] .status-badge{
      background:var(--c)!important;border-color:var(--c)!important;color:var(--fg)!important;
      box-shadow:0 2px 8px rgba(20,30,60,.14)}
    [data-tone="light"] .insight-chip{opacity:1;font-weight:600}
    [data-tone="light"] .status-badge span{color:var(--fg)!important}
    [data-tone="light"] .status-badge .sb-dot{background:var(--fg)!important;opacity:.85}

    /* ── App shell: modern mobile-app look (AppShell.jsx) ───────────────── */
    [data-palette] .card{border-radius:16px}
    [data-palette] .stat-card{border-radius:14px}
    [data-palette] .modal{border-radius:18px}
    [data-palette] .btn,[data-palette] .btnp{border-radius:10px}
    [data-palette] .inp,[data-palette] .sel{border-radius:10px}
    [data-palette] .stat-card:hover{transform:translateY(-2px)}
    /* top bar reads its colours from the theme (white on Light, navy on the others) */
    [data-palette] #topbar{
      --t1:var(--tbT1); --t2:var(--tbT2); --t3:var(--tbT3);
      --acc:var(--tbAcc); --accL:var(--tbAccL);
    }
    [data-palette] #topbar .btn{background:var(--tbBtnBg);border-color:var(--tbBtnBorder);color:var(--tbBtnText)}
    [data-palette] #topbar .btn:hover:not(:disabled){background:var(--topbarRaise);color:var(--tbT1)}
    [data-palette] .page-title{letter-spacing:-.01em}

    .inp:disabled,.sel:disabled{opacity:.6;cursor:not-allowed;background:var(--bg2)}
    .tb-title{display:none}
    @media(max-width:768px){
      .tb-phone-hide{display:none !important}
      .tb-title{display:block;font-size:16.5px;font-weight:800;color:var(--t1);letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto}
    }
    /* ── Sections, as in the reference designs: white cards, tinted icon tiles ── */
    .sec-title{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:12px;font-size:15px;font-weight:800;color:var(--t1);letter-spacing:-.01em}
    .sec-note{font-size:11.5px;font-weight:500;color:var(--t3)}
    .sec-ico{--tone:var(--acc);width:30px;height:30px;border-radius:9px;display:inline-grid;place-items:center;flex-shrink:0;
      color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
    .sec-ico.lg{width:40px;height:40px;border-radius:12px}
    [data-tone="dark"] .sec-ico{background:color-mix(in srgb,var(--tone) 24%,transparent)}
    /* tier and activity cards: white, a coloured label, a coloured bar */
    [data-palette] .tier-card,
    [data-palette] .status-card{
      background:var(--bg1)!important;border:1px solid var(--b1)!important;border-radius:14px!important;
      box-shadow:0 1px 2px rgba(16,24,40,.04);position:relative;overflow:hidden}
    [data-palette] .tier-card:hover,
    [data-palette] .status-card:hover{box-shadow:var(--shadowHover);border-color:var(--b2)!important}
    [data-palette] .tier-card::before,
    [data-palette] .status-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--tone,var(--acc))}
    [data-palette] .tier-card .sec-ico{--tone:inherit;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
    .status-card .sc-lbl{color:color-mix(in srgb,var(--tone,var(--acc)) 78%,var(--t1))}
    .status-card .sc-bar{background:var(--bg3)!important;height:5px!important;border-radius:3px!important}
    /* the three movement cards on Home */
    .ov-moves{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:16px}
    /* signal banners: a wash of the signal's colour, a solid round icon, an arrow that invites a tap */
    .ov-move{position:relative;display:flex;align-items:center;gap:12px;padding:14px 44px 14px 16px;border-radius:16px;cursor:pointer;overflow:hidden;
      background:linear-gradient(115deg,color-mix(in srgb,var(--tone) 17%,var(--bg1)) 0%,var(--bg1) 78%);
      border:1px solid color-mix(in srgb,var(--tone) 30%,transparent);box-shadow:var(--shadow)}
    .ov-move::after{content:'→';position:absolute;right:16px;top:50%;transform:translateY(-50%);font-size:18px;font-weight:800;color:var(--tone);opacity:.45;transition:transform .15s,opacity .15s}
    .ov-move:hover::after{opacity:1;transform:translate(3px,-50%)}
    .ov-move-ico{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex-shrink:0;
      color:#fff;background:var(--tone);box-shadow:0 6px 16px color-mix(in srgb,var(--tone) 38%,transparent)}
    .ov-move-n{font-size:24px;font-weight:850;line-height:1;letter-spacing:-.02em;color:var(--tone)}
    .ov-move-lbl{font-size:13px;font-weight:700;color:var(--t1)}
    .ov-move-rule{font-size:11px;color:var(--t3)}
    /* stat cards: tinted icon tile, big figure */
    [data-palette] .stat-card{padding:14px 16px}
    .stat-ico{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:var(--acc);background:var(--accL);flex-shrink:0}

    /* page headers on a phone: the actions wrap under the title and never push the page wide */
    @media(max-width:768px){
      .page-head{align-items:flex-start !important}
      .page-head > .row{width:100%}
      .page-head .row > *{max-width:100%}
      .page-head input[type="date"],.page-head input[type="month"]{width:auto !important;min-width:0;flex:1 1 128px}
      .page-head select{max-width:100%}
      .page-icon{width:40px !important;height:40px !important;border-radius:12px !important}
    }
    .dl-filters{display:contents}
    @media(max-width:768px){
      .dl-ftoggle{display:inline-flex !important}
      .dl-ftoggle.on{border-color:var(--acc) !important;color:var(--acc) !important}
      .dl-filters{display:none}
      .dl-filters.open{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
      .dl-filters.open > *{width:100% !important;min-width:0}
    }
    /* ── Product polish: one system for the whole app ─────────────────── */
    /* menu: every section has its colour, the icon sits in a tile tinted with it */
    .nav-ico{--tone:#3b82f6;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex-shrink:0;
      color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent);transition:background .15s,color .15s,transform .15s}
    .nav-ico.sm{width:24px;height:24px;border-radius:7px}
    [data-tone="dark"] .nav-ico{background:color-mix(in srgb,var(--tone) 22%,transparent);color:color-mix(in srgb,var(--tone) 72%,#fff)}
    [data-palette] .nav-item{padding:6px 10px;gap:10px;font-weight:600}
    [data-palette] .nav-item:hover .nav-ico{transform:scale(1.07)}
    [data-palette] .nav-item.active .nav-ico,
    [data-palette] .nav-group.has-active .nav-ico{background:rgba(255,255,255,.22);color:#fff}
    [data-palette] .nav-group{letter-spacing:.04em;font-size:12px}
    [data-palette] .nav-children{margin:2px 10px 8px 25px;border-left:2px solid var(--b1)}
    [data-palette] .nav-child{padding:5px 10px;font-weight:500}
    [data-palette] .nav-child.active{font-weight:700}
    [data-palette] .nav-sec{padding:16px 16px 6px;font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--t3)}
    .sb-snap{margin:10px;padding:12px 14px;border-radius:14px;background:var(--bg2);border:1px solid var(--b1)}
    [data-palette] .prog-bar{height:6px;border-radius:4px;background:var(--bg3)}
    [data-palette] .prog-fill{border-radius:4px}

    /* charts (recharts): quiet grid, muted axes, tooltips as cards */
    .recharts-cartesian-grid line{stroke:var(--b1)!important;stroke-dasharray:3 4}
    .recharts-cartesian-grid-horizontal line:last-child,.recharts-cartesian-grid-vertical line:last-child{stroke-dasharray:0}
    .recharts-cartesian-axis-tick text,.recharts-polar-angle-axis-tick text{fill:var(--t3)!important;font-size:11px}
    .recharts-cartesian-axis-line,.recharts-cartesian-axis-tick-line{stroke:var(--b1)!important}
    .recharts-default-tooltip{background:var(--bg1)!important;border:1px solid var(--b1)!important;border-radius:12px!important;
      box-shadow:var(--shadowHover)!important;padding:8px 12px!important;font-size:12px}
    .recharts-tooltip-label{color:var(--t1)!important;font-weight:800;margin-bottom:4px!important}
    .recharts-tooltip-item{padding:1px 0!important}
    .recharts-legend-item-text{color:var(--t2)!important;font-size:11.5px}
    .recharts-tooltip-cursor{fill:color-mix(in srgb,var(--acc) 7%,transparent)!important;stroke:none}
    .recharts-active-dot circle{stroke:var(--bg1)!important;stroke-width:2.5}
    .recharts-surface{overflow:visible}

    /* motion: pages rise in, figures arrive in sequence, buttons press */
    @keyframes pageIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
    .page-enter{animation:pageIn .3s cubic-bezier(.2,.8,.2,1)}
    .stat-grid>*,.ov-moves>*,.hh-grid>*,.qa-grid>*{animation:pageIn .38s cubic-bezier(.2,.8,.2,1) both}
    .stat-grid>*:nth-child(2),.ov-moves>*:nth-child(2),.hh-grid>*:nth-child(2),.qa-grid>*:nth-child(2){animation-delay:.04s}
    .stat-grid>*:nth-child(3),.ov-moves>*:nth-child(3),.hh-grid>*:nth-child(3),.qa-grid>*:nth-child(3){animation-delay:.08s}
    .stat-grid>*:nth-child(4),.hh-grid>*:nth-child(4),.qa-grid>*:nth-child(4){animation-delay:.12s}
    .stat-grid>*:nth-child(n+5),.hh-grid>*:nth-child(n+5),.qa-grid>*:nth-child(n+5){animation-delay:.16s}
    [data-palette] .card{transition:box-shadow .2s ease,border-color .2s ease}
    .btn,.btnp,.btnd,.btne{transition:transform .08s ease,background .15s,box-shadow .15s,filter .15s}
    .btn:active:not(:disabled),.btnp:active:not(:disabled),.btnd:active,.btne:active{transform:scale(.97)}
    @media (prefers-reduced-motion:reduce){
      .page-enter,.stat-grid>*,.ov-moves>*,.hh-grid>*,.qa-grid>*{animation:none!important}
      .btn:active,.btnp:active{transform:none!important}
    }

    /* importance: one strong primary, quiet secondary, red-outlined danger */
    [data-palette] .btnp{background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 88%,#fff),var(--acc));border-color:var(--acc)}
    [data-palette] .btnp:hover:not(:disabled){filter:brightness(1.06);transform:translateY(-1px)}
    [data-palette] .btnd{background:transparent;border:1px solid color-mix(in srgb,var(--red) 45%,transparent);color:var(--red);border-radius:10px;padding:6px 11px;font-weight:600}
    [data-palette] .btnd:hover{background:var(--red);color:#fff;border-color:var(--red)}
    [data-palette] .btne{background:var(--accL);border:1px solid transparent;color:var(--acc);border-radius:10px;font-weight:600}
    [data-palette] .btn:disabled,[data-palette] .btnp:disabled{opacity:.55;transform:none;filter:grayscale(.2)}

    /* tables: calm header, clear hover, numbers aligned */
    [data-palette] th{font-weight:800;letter-spacing:.06em;padding-top:10px;padding-bottom:10px}
    [data-palette] tbody tr{transition:background .12s}
    [data-palette] .card > table:first-child th:first-child,[data-palette] .card > .scroll > table th:first-child{border-top-left-radius:10px}

    /* tabs: the selected one is unmistakable */
    [data-palette] .tab{font-weight:600;border-radius:8px 8px 0 0}
    [data-palette] .tab:hover{color:var(--t1);background:var(--bg2)}
    [data-palette] .tab.active{font-weight:800;border-bottom-width:3px}

    /* badges and chips: soft pills */
    [data-palette] .status-badge{border-radius:20px}
    [data-palette] .chip{border-radius:20px;padding:2px 9px}

    /* overlays and modals */
    [data-palette] .overlay{backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
    [data-palette] .modal{box-shadow:0 30px 70px rgba(16,24,40,.28)}

    /* Home filter bar */
    /* Home filter bar: one slim row — title, pill dropdowns, dealer count, clear */
    .ov-filters{display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;margin-bottom:16px;padding:9px 12px !important}
    .ov-f-head{display:flex;align-items:center;gap:8px;flex:0 0 auto;order:0}
    .ov-f-head .sec-ico{width:28px;height:28px;border-radius:9px}
    .ov-f-title{font-weight:800;font-size:13px;color:var(--t1);white-space:nowrap}
    .ov-f-note{display:none}
    .ov-f-head .btn{order:9;padding:5px 10px;font-size:11.5px!important}
    .ov-f-grid{display:flex;flex-wrap:wrap;gap:6px;flex:1 1 auto;min-width:0;order:1}
    .ov-f{position:relative;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 6px 0 12px;border-radius:999px;background:var(--bg2);border:1px solid var(--b1);cursor:pointer;transition:border-color .15s,background .15s,box-shadow .15s;min-width:0;max-width:220px}
    .ov-f:hover{border-color:var(--b2);background:var(--bg1)}
    .ov-f.on{border-color:color-mix(in srgb,var(--acc) 45%,transparent);background:var(--accL);box-shadow:0 2px 8px color-mix(in srgb,var(--acc) 15%,transparent)}
    .ov-f span{font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);white-space:nowrap}
    .ov-f.on span{color:var(--acc)}
    .ov-f select{border:none;background:transparent;color:var(--t1);font-size:12.5px;font-weight:700;padding:0 2px;outline:none;cursor:pointer;min-width:0;max-width:150px;text-overflow:ellipsis;field-sizing:content}
    .ov-f.on select{color:var(--acc)}
    .ov-f-count{order:2;margin-left:auto;font-size:11.5px;color:var(--t3);white-space:nowrap;background:var(--bg2);border-radius:999px;padding:5px 11px}
    .ov-f-count b{color:var(--t1);font-weight:800}
    .ov-f-count.on{background:var(--accL);color:var(--acc)}
    .ov-f-count.on b{color:var(--acc)}
    .ov-f-sum{order:3}
    /* chart extras */
    .kpi-pill{font-size:11.5px;font-weight:600;color:var(--t3);background:var(--bg2);border:1px solid var(--b1);padding:4px 10px;border-radius:20px;white-space:nowrap}
    .kpi-pill b{color:var(--acc);font-weight:800;margin-left:3px}
    .donut-center{position:absolute;left:50%;transform:translate(-50%,-50%);text-align:center;pointer-events:none}
    .donut-center b{display:block;font-size:24px;font-weight:850;color:var(--t1);letter-spacing:-.02em;line-height:1}
    .donut-center span{font-size:11px;color:var(--t3);font-weight:600}
    .rank{width:24px;height:24px;border-radius:8px;display:grid;place-items:center;font-size:11.5px;font-weight:800;flex-shrink:0;background:var(--bg2);color:var(--t3)}
    .rank-1{background:linear-gradient(135deg,#fde68a,#f59e0b);color:#78350f}
    .rank-2{background:linear-gradient(135deg,#e5e7eb,#9ca3af);color:#1f2937}
    .rank-3{background:linear-gradient(135deg,#fed7aa,#ea580c);color:#7c2d12}
    /* segmented toggle + threshold chips */
    .seg{display:inline-flex;background:var(--bg2);border:1px solid var(--b1);border-radius:10px;padding:3px;gap:2px}
    .seg-b{border:none;background:transparent;color:var(--t2);font-size:12px;font-weight:700;padding:5px 12px;border-radius:8px;cursor:pointer;transition:background .15s,color .15s}
    .seg-b.on{background:var(--bg1);color:var(--tone,var(--acc));box-shadow:0 1px 3px rgba(16,24,40,.12)}
    .thr{border:1px solid var(--b1);background:var(--bg1);color:var(--t2);font-size:11.5px;font-weight:700;padding:5px 11px;border-radius:20px;cursor:pointer;transition:all .15s}
    .thr.on{background:var(--tone);border-color:var(--tone);color:#fff;box-shadow:0 3px 10px color-mix(in srgb,var(--tone) 35%,transparent)}
    /* attention cards */
    .att-card{position:relative;overflow:hidden;background:var(--bg1);border:1px solid var(--b1);border-radius:14px;padding:12px 14px 12px 16px;cursor:pointer;transition:transform .15s,box-shadow .15s}
    .att-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--tone)}
    .att-card:hover{transform:translateY(-2px);box-shadow:var(--shadowHover)}
    .att-bar{height:5px;border-radius:3px;background:var(--bg3);margin:6px 0 2px;overflow:hidden}
    .att-bar>div{height:100%;border-radius:3px;background:var(--tone)}
    .att-card[style*="cursor: default"]:hover{transform:none;box-shadow:none}
    /* ── Home quick-action picker, folding filters ── */
    .hh-qa-n{margin-left:auto;font-size:11px;font-weight:800;color:var(--acc);background:var(--accL);padding:1px 8px;border-radius:10px}
    .hh-pick{position:relative;border-radius:14px;opacity:.5;transition:background .15s,opacity .15s}
    .hh-pick.on{opacity:1;background:var(--accL)}
    .hh-pick .qa-tile{width:100%}
    .hh-pick-n{position:absolute;top:4px;right:6px;width:18px;height:18px;border-radius:50%;background:var(--acc);color:#fff;font-size:10.5px;font-weight:800;display:grid;place-items:center;pointer-events:none;animation:popIn .25s ease}
    .hh-actions.editing{box-shadow:0 0 0 2px var(--accL)}
    .ov-f-chev{display:none;color:var(--t3);transition:transform .2s}
    .ov-f-sum{display:none}
    /* ── Home on a phone: short, scannable, one idea per row ── */
    @media(max-width:600px){
      div.hh{gap:10px;margin-bottom:12px}
      .hh .hh-card{padding:14px 14px 12px;border-radius:18px}
      .hh .hh-date{font-size:11px}
      .hh .hh-hello{font-size:18px!important}
      .hh .hh-sub{font-size:11.5px}
      .hh .hh-ring{width:64px!important;height:64px!important}.hh .hh-ring>div{width:52px!important;height:52px!important}.hh .hh-ring b{font-size:14px!important}.hh .hh-ring span{font-size:8.5px}
      .hh .hh-kpis{margin-top:12px;gap:6px}
      .hh .hh-kpis>div{padding:6px 8px;border-radius:10px}
      .hh .hh-kpis span{font-size:9.5px}
      .hh .hh-kpis b{font-size:15px!important}
      .hh .hh-actions{padding:12px 8px 6px!important}
      .hh .hh-actions-head{padding:0 6px}
      .hh .hh-actions-head b{font-size:13.5px}
      .hh .hh-grid{gap:2px}
      .hh .hh-grid .qa-tile{padding:6px 0}
      .hh .hh-grid .qa-ico{width:44px;height:44px;border-radius:14px}
      .hh .hh-grid .qa-lbl{font-size:10.5px;line-height:1.2}
      .ov-home .page-head{margin-bottom:10px!important;gap:10px!important}
      .ov-home .page-head .page-icon{width:36px!important;height:36px!important;border-radius:11px!important}
      .ov-home .page-head .page-title{font-size:17px!important}
      .ov-home .page-head .page-stamp{font-size:10.5px!important;padding:3px 9px!important;margin-top:5px!important}
      .ov-home .ov-filters{display:block;padding:10px 12px!important;margin-bottom:12px}
      .ov-home .ov-f-count{display:none}
      .ov-home .ov-f-title{font-size:13.5px}
      .ov-home .ov-f-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .ov-home .ov-f{flex-direction:column;align-items:stretch;gap:2px;height:auto;max-width:none;padding:7px 10px 6px;border-radius:12px}
      .ov-home .ov-f select{max-width:none;width:100%;font-size:13px;field-sizing:fixed}
      .ov-home .ov-f-head{margin-bottom:0;cursor:pointer}
      .ov-home .ov-f-head > div > div:last-child{display:none}
      .ov-home .ov-f-chev{display:inline-flex}
      .ov-home .ov-filters.open .ov-f-chev{transform:rotate(180deg)}
      .ov-home .ov-filters:not(.open) .ov-f-grid{display:none}
      .ov-home .ov-filters.open .ov-f-grid{margin-top:10px}
      .ov-home .ov-f-sum{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}
      .ov-home .ov-moves{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:8px;margin-bottom:12px;padding:2px 2px 4px;scrollbar-width:none}
      .ov-home .ov-moves::-webkit-scrollbar{display:none}
      .ov-home .ov-move{flex:0 0 74%;scroll-snap-align:start;padding:10px 30px 10px 12px;gap:10px;border-radius:14px}
      .ov-home .ov-move::after{right:10px;font-size:15px}
      .ov-home .ov-move-ico{width:34px;height:34px}
      .ov-home .ov-move-ico svg{width:17px;height:17px}
      .ov-home .ov-move-n{font-size:19px}
      .ov-home .ov-move-lbl{font-size:12px}
      .ov-home .ov-move-rule{font-size:10px}
      .ov-home .stat-grid.ov-dup{display:none}
      .ov-home .stat-grid{gap:8px;margin-bottom:12px}
      .ov-home .stat-card .stat-ico{display:none}
      .ov-home .stat-card > div:nth-child(2){font-size:20px!important}
      .ov-home .stat-card > div:first-child{margin-bottom:4px!important}
      .ov-home .cat-grid{grid-template-columns:1fr 1fr!important;gap:6px!important}
      .ov-home .cat-tile{padding:9px 10px;border-radius:12px}
      .ov-home .cat-num{font-size:18px;margin:3px 0}
      .ov-home .cat-name{font-size:10.5px}
      .ov-home .cat-share{font-size:9.5px;padding:0 5px}
      .ov-home .cat-subs{font-size:9.5px;gap:1px 8px}
      .ov-home .cl-grid{grid-template-columns:1fr}
      .ov-home .cl-row{padding:7px 10px}
      .ov-home .tier-row{display:flex!important;overflow-x:auto;scroll-snap-type:x mandatory;gap:10px!important;scrollbar-width:none;padding-bottom:4px}
      .ov-home .tier-row::-webkit-scrollbar{display:none}
      .ov-home .tier-hero{flex:0 0 82%;scroll-snap-align:start;padding:14px}
      .ov-home .tier-hero .th-n{font-size:28px;margin:8px 0}
      .ov-home .hm-legend{grid-template-columns:1fr 1fr}
      .ov-home .hm-n{font-size:18px}
      .ov-home .hm-sub{display:none}
      .ov-home .ring-grid{display:flex;overflow-x:auto;gap:4px;scrollbar-width:none}
      .ov-home .ring-grid::-webkit-scrollbar{display:none}
      .ov-home .ring-item{flex:0 0 96px}
      .ov-home .ring-wrap svg{width:60px;height:60px}
      .ov-home .ring-wrap b{font-size:14px}
      .ov-home .sec-title{font-size:14px}
    }
    /* ── Home on a phone, salesman's order: shortcuts → signals → tiers → activity → labels → the rest ── */
    .ov-move-short{display:none}
    .pe-scope{display:none}
    /* the rotating one-liner under "Home" on a phone */
    .tb-title.has-quote{flex:1 1 auto;display:flex;align-items:center;min-width:0;line-height:1.1}
    .tb-quote{display:inline-flex;align-items:center;gap:6px;max-width:100%;min-width:0;font-size:14px;font-weight:800;letter-spacing:-.005em;line-height:1.2;
      padding:5px 10px 5px 8px;border-radius:12px;color:var(--acc);background:var(--accL);border:1px solid color-mix(in srgb,var(--acc) 28%,transparent);
      animation:quoteIn .55s cubic-bezier(.2,.8,.2,1)}
    .tb-quote-t{min-width:0;white-space:nowrap;overflow:hidden}
    .tb-quote.wrap .tb-quote-t{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
    .tb-quote-ico{flex-shrink:0;color:#f59e0b}
    @media(max-width:380px){.tb-quote{padding:4px 8px 4px 7px;gap:5px}}
    @keyframes quoteIn{from{opacity:0;transform:translateY(5px)}}
    @media (prefers-reduced-motion:reduce){.tb-quote{animation:none}}
    .ov-period-btn{display:none}
    @media(max-width:600px){
      .hh .hh-actions:not(.editing) .hh-grid>*:nth-child(n+5){display:none}
      .ov-home{display:flex;flex-direction:column}
      .ov-home>*{order:50}
      .ov-home>.page-head{order:1}
      .ov-home>.ov-filters{order:2}
      .ov-home>.ov-moves{order:3}
      .ov-home>.stat-grid{order:4}
      .ov-home>.ov-tiers{order:5}
      .ov-home>.ov-activity{order:6}
      .ov-home>.ov-selected{order:7}
      /* signals: three small chips in one row */
      .ov-home .ov-moves{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;overflow:visible;margin-bottom:12px;padding:0}
      .ov-home .ov-move{flex:none;padding:8px 8px;gap:7px;border-radius:12px;min-width:0}
      .ov-home .ov-move::after{display:none}
      .ov-home .ov-move-ico{width:28px;height:28px;box-shadow:none}
      .ov-home .ov-move-ico svg{width:14px;height:14px}
      .ov-home .ov-move>div:last-child{gap:0!important}
      .ov-home .ov-move-n{font-size:16px}
      .ov-home .ov-move-lbl,.ov-home .ov-move-rule{display:none}
      .ov-home .ov-move-short{display:block;width:100%;font-size:10px;font-weight:700;color:var(--t2);line-height:1.15}
      /* tiers: all three visible at once, tap for the dealers */
      .ov-home .tier-row{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;overflow:visible;padding:0}
      .ov-home .page-head .page-stamp>span:last-child{display:none}
      .ov-home .page-head .page-stamp{gap:5px!important;flex-wrap:wrap}
      /* header: [icon · Overview] [Category] on one line, Period as one slim line under it */
      .ov-home .page-head{display:grid!important;grid-template-columns:minmax(0,1fr) auto auto;align-items:center!important;gap:8px 6px!important}
      .ov-home .ov-period-btn{display:inline-flex;align-items:center;gap:4px;grid-column:2;grid-row:1;height:32px;padding:0 8px;border-radius:10px;
        border:1.5px solid var(--b2);background:var(--bg2);color:var(--t2);font-size:11.5px;font-weight:700;white-space:nowrap;cursor:pointer}
      .ov-home .ov-period-btn.on,.ov-home .page-head.p-open .ov-period-btn{border-color:var(--acc);color:var(--acc);background:var(--accL)}
      .ov-home .page-head:not(.p-open)>div:nth-child(3){display:none!important}
      .ov-home .page-head>div:nth-child(2){grid-column:1;grid-row:1;min-width:0!important;align-items:center!important;gap:10px!important}
      .ov-home .page-head>div:nth-child(4){grid-column:3;grid-row:1;justify-self:end}
      .ov-home .page-head>div:nth-child(3){grid-column:1/-1;grid-row:2;min-width:0;flex-direction:row!important;align-items:center;gap:8px!important;
        background:var(--bg1);border:1px solid var(--b1);border-radius:12px;padding:5px 6px 5px 10px}
      .ov-home .page-head>div:nth-child(3)>div:first-child{font-size:9.5px!important;flex-shrink:0}
      .ov-home .page-head>div:nth-child(3)>div:nth-child(2){flex:1;flex-wrap:nowrap!important;gap:4px!important;min-width:0}
      .ov-home .page-head>div:nth-child(3)>div:nth-child(3){display:none}
      .ov-home .page-head select{flex:1 1 0;min-width:0;height:30px;padding:0 6px!important;font-size:12.5px!important;border-radius:8px!important}
      .ov-home .page-head .page-title{font-size:16px!important}
      .ov-home .page-head .page-eyebrow{font-size:9.5px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ov-home .page-head .page-icon{width:34px!important;height:34px!important}
      .ov-home .pt-scope{display:none}
      .ov-home .page-head .page-title{white-space:nowrap}
      .ov-home .page-head .cat-filter-btn>span:first-child{display:none}
      .ov-home .page-head .cat-filter-btn{padding:0 8px 0 10px!important}
      .ov-home .ov-period-btn>svg:last-child{display:none}
      .ov-home .pe-scope{display:block!important;font-size:11px;color:var(--t3);font-weight:600;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ov-home .page-head .cat-filter-btn{height:32px;padding:0 8px 0 4px!important;font-size:11.5px!important;border-radius:10px!important;gap:5px!important}
      .ov-home .tier-hero{flex:none;padding:10px 9px;border-radius:14px;min-width:0}
      .ov-home .tier-hero .th-ico{width:26px;height:26px;border-radius:8px}
      .ov-home .tier-hero .th-ico svg{width:14px;height:14px}
      .ov-home .tier-hero>div:nth-of-type(1){flex-direction:column;align-items:flex-start!important;gap:6px!important}
      .ov-home .tier-hero .th-lbl{font-size:9px;letter-spacing:.03em;line-height:1.2;white-space:normal;overflow-wrap:anywhere}
      .ov-home .tier-hero .th-sub{font-size:9px}
      .ov-home .tier-hero .th-n{font-size:26px;margin:8px 0 0}
      .ov-home .tier-hero .th-n small{display:block;margin:2px 0 0;font-size:10px}
      .ov-home .tier-hero .th-pill,.ov-home .tier-hero .th-more{display:none}
      .ov-home .tier-hero .th-wm{width:54px;height:54px;right:-10px;bottom:-12px}
      .ov-home .ov-tiers>div:first-child .sec-note{display:none}
      /* labels: five rings in one row */
      .ov-home .ring-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;overflow:visible}
      .ov-home .ring-item{flex:none;padding:7px 2px;min-width:0;border-radius:12px}
      .ov-home .ring-wrap svg{width:50px;height:50px}
      .ov-home .ring-wrap b{font-size:12.5px}
      .ov-home .ring-lbl{font-size:8.5px;letter-spacing:.02em;line-height:1.15}
      .ov-home .ring-p{display:none}
      .ov-home .ov-selected .sec-note,.ov-home .ov-activity .sec-note{display:none}
      .ov-home .hm-item{padding:6px 8px}
      /* the rest: smaller */
      .ov-home>.card:not(.ov-tiers):not(.ov-activity):not(.ov-selected):not(.ov-filters) .sec-title{font-size:13px}
      .ov-home .cat-num{font-size:16px}
      .ov-home .cl-row{padding:6px 9px}
      .ov-home .cl-name{font-size:11.5px}
      .ov-home .cl-qty{font-size:13px}
    }
    /* upload stamp inside the greeting card */
    #hh-stamp-slot:empty{display:none}
    .hh-stamp{display:inline-flex;align-items:center;gap:7px;margin-top:10px;padding:5px 11px 5px 9px;border-radius:999px;
      background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.26);color:#fff;font-size:11.5px;max-width:100%;flex-wrap:wrap;row-gap:1px;
      backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:pageIn .5s cubic-bezier(.2,.8,.2,1) .2s both}
    .hh-stamp i{width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 3px rgba(74,222,128,.25);flex-shrink:0;animation:ringPulse 2.4s ease-out infinite}
    .hh-stamp span{opacity:.82;font-weight:500;white-space:nowrap}
    .hh-stamp b{font-weight:800;white-space:nowrap}
    .hh-stamp em{font-style:normal;opacity:.7;font-size:10.5px;white-space:nowrap}
    @media(max-width:600px){.hh-stamp{font-size:10.5px;padding:4px 9px 4px 8px;margin-top:8px}.hh-stamp em{display:none}}
    @media (prefers-reduced-motion:reduce){.hh-stamp,.hh-stamp i{animation:none}}
    /* ── motion for the greeting card, tier cards, activity meter and rings ── */
    @property --p{syntax:'<number>';inherits:false;initial-value:0}
    @keyframes heroShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
    @keyframes orbFloat{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-26px,18px) scale(1.12)}}
    @keyframes shineSweep{0%{transform:translateX(-120%)}38%,100%{transform:translateX(120%)}}
    @keyframes ringFill{from{--p:0}}
    @keyframes ringPulse{0%{box-shadow:0 0 0 0 rgba(255,255,255,.4)}70%,100%{box-shadow:0 0 0 14px rgba(255,255,255,0)}}
    @keyframes wmBob{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-8px) rotate(4deg)}}
    @keyframes barGrow{from{transform:scaleX(0)}}
    @keyframes ringDraw{from{stroke-dasharray:0 999}}
    @keyframes popIn{from{opacity:0;transform:scale(.85)}}
    .hh .hh-card{background:linear-gradient(120deg,var(--heroA,#1d4ed8),var(--heroB,#3b82f6) 50%,var(--heroA,#1d4ed8));background-size:220% 220%;animation:heroShift 14s ease-in-out infinite}
    .hh-card::after{animation:orbFloat 10s ease-in-out infinite}
    .hh-card::before{animation:orbFloat 13s ease-in-out infinite reverse}
    .hh-orb{position:absolute;border-radius:50%;filter:blur(28px);pointer-events:none;opacity:.55}
    .hh-orb.o1{width:160px;height:160px;left:-40px;bottom:-70px;background:color-mix(in srgb,var(--heroB,#3b82f6) 70%,#fff);animation:orbFloat 12s ease-in-out infinite}
    .hh-orb.o2{width:120px;height:120px;left:45%;top:-60px;background:color-mix(in srgb,#8b5cf6 60%,var(--heroB,#3b82f6));animation:orbFloat 15s ease-in-out -4s infinite reverse}
    .hh-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.16) 46%,transparent 62%);transform:translateX(-120%);animation:shineSweep 7s ease-in-out 1.2s infinite}
    .hh-hello,.hh-date,.hh-sub{animation:pageIn .55s cubic-bezier(.2,.8,.2,1) both}
    .hh-date{animation-delay:.02s}.hh-sub{animation-delay:.12s}
    .hh-ring{animation:ringFill 1.4s cubic-bezier(.2,.8,.2,1) .2s both,ringPulse 3s ease-out 1.8s infinite}
    .hh-kpis>div{animation:pageIn .5s cubic-bezier(.2,.8,.2,1) both;transition:transform .15s,background .15s}
    .hh-kpis>div:nth-child(1){animation-delay:.14s}.hh-kpis>div:nth-child(2){animation-delay:.22s}.hh-kpis>div:nth-child(3){animation-delay:.3s}
    .hh-kpis>div:hover{transform:translateY(-2px);background:rgba(255,255,255,.22)}
    .tier-hero{animation:pageIn .55s cubic-bezier(.2,.8,.2,1) both}
    .tier-hero:nth-child(2){animation-delay:.08s}.tier-hero:nth-child(3){animation-delay:.16s}
    .tier-hero::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 32%,rgba(255,255,255,.22) 47%,transparent 62%);transform:translateX(-120%);animation:shineSweep 6.5s ease-in-out 1s infinite}
    .tier-hero:nth-child(2)::after{animation-delay:1.8s}.tier-hero:nth-child(3)::after{animation-delay:2.6s}
    .tier-hero .th-wm{animation:wmBob 7s ease-in-out infinite}
    .tier-hero .th-ico{animation:popIn .5s cubic-bezier(.2,.8,.2,1) .2s both}
    .tier-hero .th-pill{animation:pageIn .45s ease both}
    .tier-hero .th-pill:nth-child(1){animation-delay:.25s}.tier-hero .th-pill:nth-child(2){animation-delay:.32s}.tier-hero .th-pill:nth-child(3){animation-delay:.39s}
    .tier-hero:hover .th-wm{animation-duration:2.5s}
    .hm-bar>div{transform-origin:left;animation:barGrow .9s cubic-bezier(.2,.8,.2,1) both}
    .hm-bar>div:nth-child(2){animation-delay:.08s}.hm-bar>div:nth-child(3){animation-delay:.16s}.hm-bar>div:nth-child(4){animation-delay:.24s}
    .ring-fg{animation:ringDraw 1.2s cubic-bezier(.2,.8,.2,1) both}
    .ring-item{animation:pageIn .45s ease both}
    .ring-item:nth-child(2){animation-delay:.05s}.ring-item:nth-child(3){animation-delay:.1s}.ring-item:nth-child(4){animation-delay:.15s}.ring-item:nth-child(5){animation-delay:.2s}
    .ov-move-ico{animation:popIn .5s cubic-bezier(.2,.8,.2,1) both}
    @media (prefers-reduced-motion:reduce){
      .hh-card,.hh-card::after,.hh-card::before,.hh-orb,.hh-shine,.hh-ring,.hh-kpis>div,.hh-hello,.hh-date,.hh-sub,
      .tier-hero,.tier-hero::after,.tier-hero .th-wm,.tier-hero .th-ico,.tier-hero .th-pill,.hm-bar>div,.ring-fg,.ring-item,.ov-move-ico{animation:none!important}
      .hh-shine,.tier-hero::after{display:none}
    }
    /* Admin Panel dropdown in the left menu: small group headings between its sections */
    .nav-subhead{font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);padding:9px 10px 3px}
    .nav-subhead:first-child{padding-top:3px}
    .nav-subn{font-size:10px;font-weight:800;color:var(--t3);background:var(--bg2);padding:0 7px;border-radius:10px}
    /* the signed-in person, top bar and menu foot — both open My profile */
    .tb-me,.sb-me{display:flex;align-items:center;gap:8px;cursor:pointer;border-radius:12px;padding:3px 8px 3px 3px;transition:background .15s}
    .sb-me{flex:1;min-width:0;gap:10px}
    .tb-me:hover,.sb-me:hover{background:var(--bg2)}
    /* ── Stock search (top bar button + sheet) ── */
    .tb-stock{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;height:32px;padding:0 11px;border-radius:10px;cursor:pointer;font-size:12px;font-weight:800;
      color:#fff;border:none;background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 4px 12px rgba(16,185,129,.3);transition:transform .12s,filter .15s}
    .tb-stock:hover{filter:brightness(1.07);transform:translateY(-1px)}
    .tb-stock:active{transform:scale(.96)}
    @media(max-width:600px){.tb-stock{width:32px;height:32px;padding:0;justify-content:center;border-radius:10px;box-shadow:0 3px 8px rgba(16,185,129,.28)}}
    .mo-strip::-webkit-scrollbar{display:none}
    /* phone top bar: one-tap dark / light */
    .tb-mode{display:none}
    @media(max-width:600px){
      .tb-mode{display:inline-grid;place-items:center;flex-shrink:0;width:32px;height:32px;border-radius:10px;cursor:pointer;
        border:1px solid var(--b2);background:var(--bg2);color:var(--t2);transition:background .2s,color .2s,transform .12s}
      .tb-mode:active{transform:scale(.92)}
      .tb-mode.dark{background:#1e293b;color:#fbbf24;border-color:#334155}
      .tb-mode svg{animation:popIn .3s ease}
    }
    .stk-overlay{align-items:flex-start;padding-top:6vh}
    .stk{width:min(680px,100%);max-height:84vh;display:flex;flex-direction:column;background:var(--bg1);border:1px solid var(--b1);border-radius:20px;
      box-shadow:0 30px 70px rgba(16,24,40,.3);overflow:hidden;animation:pageIn .25s cubic-bezier(.2,.8,.2,1)}
    .stk-head{display:flex;align-items:center;gap:10px;padding:14px 14px 10px}
    .stk-ico{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#10b981,#059669);flex-shrink:0}
    .stk-title{font-size:16px;font-weight:850;color:var(--t1)}
    .stk-sub{font-size:11.5px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .stk-sub b{color:#10b981}
    .stk-iconbtn{width:34px;height:34px;border-radius:10px;border:1px solid var(--b1);background:var(--bg2);color:var(--t2);display:grid;place-items:center;cursor:pointer;flex-shrink:0}
    .stk-search{display:flex;align-items:center;gap:9px;margin:0 14px;padding:0 12px;height:46px;border-radius:14px;background:var(--bg2);border:1.5px solid var(--b2);color:var(--t3);transition:border-color .15s,box-shadow .15s}
    .stk-search:focus-within{border-color:#10b981;box-shadow:0 0 0 4px rgba(16,185,129,.15)}
    .stk-search input{flex:1;min-width:0;border:none;background:transparent;outline:none;font-size:15px;font-weight:600;color:var(--t1)}
    .stk-search button{border:none;background:var(--bg3);color:var(--t2);width:24px;height:24px;border-radius:50%;display:grid;place-items:center;cursor:pointer}
    .stk-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 14px 8px}
    .stk-count{font-size:11.5px;font-weight:700;color:var(--t3)}
    .stk-list{flex:1;min-height:0;overflow-y:auto;padding:4px 10px 14px;display:flex;flex-direction:column;gap:6px}
    .stk-row{display:flex;align-items:center;gap:11px;padding:9px 11px;border-radius:14px;background:var(--bg1);border:1px solid var(--b1);transition:border-color .15s,background .15s;animation:pageIn .25s ease both}
    .stk-row:hover{border-color:var(--b2);background:var(--bg2)}
    .stk-row.out{opacity:.72}
    .stk-thumb{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;flex-shrink:0;color:var(--st);background:color-mix(in srgb,var(--st) 13%,transparent)}
    .stk-main{flex:1;min-width:0}
    .stk-name{font-size:13.5px;font-weight:800;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .stk-meta{display:flex;align-items:center;gap:6px;margin-top:2px;min-width:0}
    .stk-code{font-size:11px;color:var(--t3);font-family:"JetBrains Mono",monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .stk-status{font-size:9.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--st);background:color-mix(in srgb,var(--st) 12%,transparent);padding:1px 7px;border-radius:999px;white-space:nowrap}
    .stk-qty{display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0;min-width:74px;padding:5px 10px;border-radius:12px;background:var(--bg2)}
    .stk-qty b{font-size:17px;font-weight:850;color:var(--t3);line-height:1.1}
    .stk-qty span{font-size:9.5px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.04em}
    .stk-qty.in{background:rgba(16,185,129,.12)}.stk-qty.in b,.stk-qty.in span{color:#059669}
    [data-tone="dark"] .stk-qty.in b,[data-tone="dark"] .stk-qty.in span{color:#34d399}
    .stk-qty.via{background:rgba(16,185,129,.07);border:1px dashed rgba(16,185,129,.45)}
    .stk-tag.parent{font-size:9.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#10b981,#059669);padding:1px 7px;border-radius:999px;white-space:nowrap}
    .stk-parent{font-size:11px;color:var(--t3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .stk-parent b{color:var(--t2);font-weight:700}
    .stk-qty.neg{background:rgba(239,68,68,.1)}.stk-qty.neg b,.stk-qty.neg span{color:#ef4444}
    .stk-verdict{display:flex;align-items:center;gap:11px;padding:11px 13px;border-radius:14px;margin-bottom:2px;animation:pageIn .25s ease}
    .stk-verdict b{display:block;font-size:14.5px;font-weight:850}
    .stk-verdict span{display:block;font-size:12px;opacity:.85;margin-top:1px}
    .stk-verdict.ok{background:rgba(16,185,129,.12);color:#047857;border:1px solid rgba(16,185,129,.3)}
    .stk-verdict.none{background:rgba(239,68,68,.1);color:#b91c1c;border:1px solid rgba(239,68,68,.28)}
    [data-tone="dark"] .stk-verdict.ok{color:#34d399}[data-tone="dark"] .stk-verdict.none{color:#f87171}
    .stk-fuzzy{font-size:11.5px;font-weight:700;color:#b45309;background:rgba(245,158,11,.12);border-radius:10px;padding:6px 10px}
    .stk-msg{display:flex;flex-direction:column;align-items:center;gap:8px;padding:30px 16px;text-align:center;color:var(--t3);font-size:13px}
    .stk-msg.err{color:var(--red)}
    .stk-more{font-size:11.5px;color:var(--t3);text-align:center;padding:8px}
    @media(max-width:600px){
      .stk-overlay{padding:0;align-items:flex-end}
      .stk{max-height:92vh;border-radius:20px 20px 0 0;width:100%}
      .stk-name{font-size:13px}
      .stk-qty{min-width:64px;padding:4px 8px}.stk-qty b{font-size:15.5px}
    }
    /* dealer outstanding popup (Visit calendar) */
    .dom-overlay{align-items:center}
    .dom{width:min(460px,100%);max-height:86vh;overflow:auto;background:var(--bg1);border:1px solid var(--b1);border-radius:20px;box-shadow:0 30px 70px rgba(16,24,40,.3);animation:pageIn .25s cubic-bezier(.2,.8,.2,1)}
    .dom-head{display:flex;align-items:center;gap:10px;padding:14px 14px 8px}
    .dom-ico{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,#10b981,#059669);flex-shrink:0}
    .dom-eyebrow{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--t3)}
    .dom-title{font-size:16px;font-weight:850;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dom-x{width:32px;height:32px;border-radius:10px;border:1px solid var(--b1);background:var(--bg2);color:var(--t2);display:grid;place-items:center;cursor:pointer;flex-shrink:0}
    .dom-body{display:grid;gap:12px;padding:6px 14px 16px}
    .dom-total{display:flex;flex-direction:column;padding:14px 16px;border-radius:16px;color:#fff;background:linear-gradient(135deg,#ef4444,#f97316)}
    .dom-total.clear{background:linear-gradient(135deg,#10b981,#059669)}
    .dom-total span{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;opacity:.9}
    .dom-total b{font-size:28px;font-weight:850;letter-spacing:-.02em;line-height:1.15}
    .dom-total small{font-size:11px;opacity:.85}
    .dom-facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .dom-facts>div{display:flex;flex-direction:column;gap:1px;padding:9px 10px;border-radius:12px;background:var(--bg2);min-width:0}
    .dom-facts span{font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--t3)}
    .dom-facts b{font-size:14px;font-weight:850;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .dom-facts small{font-size:10.5px;color:var(--t3)}
    .dom-sec{display:grid;gap:6px}
    .dom-sec-t{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--t2)}
    .dom-bk{display:grid;grid-template-columns:62px 1fr auto;align-items:center;gap:10px;font-size:12.5px}
    .dom-bk-m{color:var(--t2);font-weight:700}
    .dom-bk-bar{height:8px;border-radius:5px;background:var(--bg3);overflow:hidden}
    .dom-bk-bar>div{height:100%;border-radius:5px;background:linear-gradient(90deg,#f97316,#ef4444);transform-origin:left;animation:barGrow .7s ease both}
    .dom-bk b{color:var(--t1);font-weight:800}
    .dom-pay{display:flex;align-items:center;gap:10px;font-size:12.5px;padding:6px 0;border-bottom:1px dashed var(--b1)}
    .dom-pay span:first-child{color:var(--t2);min-width:84px}
    .dom-pay-m{flex:1;color:var(--t3);font-size:11px;text-transform:uppercase}
    .dom-pay b{color:#059669;font-weight:800}
    .dom-msg{display:flex;align-items:center;gap:8px;margin:8px 14px 16px;padding:12px;border-radius:12px;font-size:13px}
    .dom-msg.err{color:var(--red);background:color-mix(in srgb,var(--red) 8%,transparent)}
    /* category filter — phone bottom sheet (portalled above the tab bar) */
    .cf-wrap{position:fixed;inset:0;z-index:2200;background:rgba(15,23,42,.5);display:flex;align-items:flex-end;animation:cfFade .18s ease}
    @keyframes cfFade{from{opacity:0}to{opacity:1}}
    .cf-sheet{width:100%;max-height:86vh;display:flex;flex-direction:column;background:var(--bg1);border-radius:18px 18px 0 0;box-shadow:0 -12px 36px rgba(0,0,0,.35);animation:cfUp .24s cubic-bezier(.2,.8,.2,1)}
    @keyframes cfUp{from{transform:translateY(40px)}to{transform:none}}
    .cf-grip{width:38px;height:4px;border-radius:3px;background:var(--b2);margin:8px auto 2px}
    .cf-head{display:flex;align-items:center;gap:10px;padding:8px 16px 4px}
    .cf-head b{display:block;font-size:16px;font-weight:850;color:var(--t1)}
    .cf-head small{display:block;font-size:11.5px;color:var(--t3);margin-top:1px}
    .cf-x{width:34px;height:34px;border-radius:10px;border:1px solid var(--b1);background:var(--bg2);color:var(--t2);display:grid;place-items:center;cursor:pointer;flex-shrink:0}
    .cf-quick{display:flex;align-items:center;gap:6px;padding:6px 16px 8px;border-bottom:1px solid var(--b1)}
    .cf-quick button{padding:4px 12px;border-radius:999px;border:1px solid var(--b2);background:var(--bg2);color:var(--t1);font-size:12px;font-weight:700;cursor:pointer}
    .cf-quick button:disabled{opacity:.45;cursor:default}
    .cf-quick span{font-size:10.5px;color:var(--t3);margin-left:4px;line-height:1.25}
    .cf-list{flex:1;min-height:0;overflow-y:auto;padding:6px 10px;display:grid;gap:4px;align-content:start}
    .cf-row{display:flex;align-items:center;gap:10px;min-height:44px;padding:6px 10px;border-radius:12px;cursor:pointer;background:color-mix(in srgb,var(--acc) 7%,var(--bg1));border:1px solid color-mix(in srgb,var(--acc) 16%,transparent);transition:background .15s}
    .cf-row.off{background:var(--bg1);border-color:var(--b1)}
    .cf-tick{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;flex-shrink:0;background:var(--acc);color:#fff;border:2px solid var(--acc)}
    .cf-row.off .cf-tick{background:transparent;border-color:var(--b2)}
    .cf-name{flex:1;min-width:0;font-size:13.5px;font-weight:750;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .cf-row.off .cf-name{color:var(--t3);text-decoration:line-through}
    .cf-n{font-size:12px;font-weight:650;color:var(--t3);flex-shrink:0}
    .cf-only{flex-shrink:0;padding:4px 10px;border-radius:8px;border:1px solid var(--b2);background:var(--bg1);color:var(--t2);font-size:11px;font-weight:700;cursor:pointer}
    .cf-empty{padding:18px;text-align:center;font-size:12px;color:var(--t3)}
    .cf-foot{display:flex;gap:8px;padding:10px 14px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--b1);background:var(--bg1)}
    .cf-foot button{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:750;cursor:pointer}
    .cf-reset{border:1px solid var(--b2);background:var(--bg2);color:var(--t1)}
    .cf-save{border:1px solid color-mix(in srgb,#10b981 50%,transparent);background:color-mix(in srgb,#10b981 10%,var(--bg1));color:#047857}
    .cf-done{flex:1;border:0;background:var(--acc);color:#fff}
    /* activity boxes under the performance tiers */
    .act-boxes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}
    .act-box{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0;padding:9px 11px;border-radius:12px;cursor:pointer;text-align:left;border:1px solid color-mix(in srgb,var(--tone) 28%,transparent);background:color-mix(in srgb,var(--tone) 8%,var(--bg1));transition:transform .15s,box-shadow .15s}
    .act-box:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 16px color-mix(in srgb,var(--tone) 22%,transparent)}
    .act-box:disabled{cursor:default;opacity:.6}
    .act-box .ab-lbl{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.05em;color:var(--tone);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    .act-box .ab-lbl i{width:8px;height:8px;border-radius:3px;background:var(--tone);flex-shrink:0}
    .act-box .ab-n{display:flex;align-items:baseline;gap:5px}
    .act-box .ab-n b,.act-box .ab-n>span:first-child{font-size:20px;font-weight:850;color:var(--t1);line-height:1.15}
    .act-box .ab-n small{font-size:10.5px;font-weight:700;color:var(--t3)}
    .act-box .ab-sub{font-size:10px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
    @media(max-width:600px){.act-boxes{grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.act-box{padding:8px 9px}.act-box .ab-n b,.act-box .ab-n>span:first-child{font-size:17px}}
    /* discontinued: who buys them */
    .dw-tabs{display:flex;gap:4px;margin:0 14px 8px;padding:3px;border-radius:12px;background:var(--bg2)}
    .dw-tabs button{flex:1;white-space:nowrap;padding:7px 6px;border:0;border-radius:9px;background:transparent;color:var(--t2);font-size:12px;font-weight:700;cursor:pointer}
    .dw-tabs button.on{background:var(--bg1);color:#b91c1c;box-shadow:0 1px 4px rgba(16,24,40,.12)}
    .dw-card{flex-shrink:0;border:1px solid var(--b1);border-radius:12px;background:var(--bg1);overflow:hidden}
    .dw-card.on{border-color:color-mix(in srgb,#ef4444 35%,transparent)}
    .dw-head{display:flex;align-items:center;gap:10px;width:100%;padding:9px 11px;border:0;background:transparent;cursor:pointer;text-align:left;color:var(--t1)}
    .dw-ico{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;color:#dc2626;background:rgba(239,68,68,.1)}
    .dw-main{display:flex;flex-direction:column;min-width:0;flex:1}
    .dw-main b{font-size:13px;font-weight:750;overflow-wrap:anywhere}
    .dw-main small{font-size:11px;color:var(--t3);overflow-wrap:anywhere}
    .dw-stock{display:flex;flex-direction:column;align-items:flex-end;flex-shrink:0;font-size:10px;color:var(--t3)}
    .dw-stock b{font-size:15px;color:var(--t3)}
    .dw-stock.in b{color:#047857}
    .dw-chev{flex-shrink:0;color:var(--t3);transition:transform .2s}
    .dw-card.on .dw-chev{transform:rotate(180deg)}
    .dw-kids{display:grid;gap:4px;padding:0 11px 10px 53px}
    .dw-kid{display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:9px;background:var(--bg2)}
    .dw-q{flex-shrink:0;font-size:12px;font-weight:800;color:var(--t1);padding:1px 8px;border-radius:99px;background:var(--bg1)}
    /* plan a visit: dealer list on the right, the day's plan below */
    .pv-overlay{justify-content:flex-end;align-items:stretch;padding:0}
    .pv{width:min(440px,100%);height:100%;display:flex;flex-direction:column;background:var(--bg1);border-left:1px solid var(--b1);box-shadow:-20px 0 60px rgba(16,24,40,.25);animation:pvIn .25s cubic-bezier(.2,.8,.2,1)}
    @keyframes pvIn{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}
    .pv-head{display:flex;align-items:center;gap:10px;padding:14px 14px 8px}
    .pv-ico{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,var(--acc),#6366f1);flex-shrink:0}
    .pv-eyebrow{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--t3)}
    .pv-title{font-size:16px;font-weight:850;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .pv-x{width:32px;height:32px;border-radius:10px;border:1px solid var(--b1);background:var(--bg2);color:var(--t2);display:grid;place-items:center;cursor:pointer;flex-shrink:0}
    .pv-ctl{display:flex;gap:8px;padding:0 14px 8px}
    .pv-ctl .inp,.pv-ctl .sel{flex:1;min-width:0;font-size:13px}
    .pv-cap{margin:0 14px 8px;padding:8px 11px;border-radius:12px;background:var(--bg2);font-size:12px;color:var(--t2)}
    .pv-cap b{color:var(--t1)}
    .pv-cap.full b{color:var(--red)}
    .pv-bar{height:5px;border-radius:99px;background:var(--b1);margin-top:6px;overflow:hidden}
    .pv-bar i{display:block;height:100%;border-radius:99px;background:var(--acc);transition:width .3s}
    .pv-cap.full .pv-bar i{background:var(--red)}
    .pv-msg{padding:10px 14px;font-size:12px;color:var(--t3);display:flex;align-items:center;gap:6px}
    .pv-msg.bad{color:var(--red)}
    .pv-search{display:flex;align-items:center;gap:6px;margin:0 14px;padding:8px 10px;border-radius:11px;border:1px solid var(--b2);background:var(--bg2);color:var(--t3)}
    .pv-search input{flex:1;min-width:0;border:0;background:transparent;color:var(--t1);font-size:13px;outline:none}
    .pv-chips{display:flex;gap:5px;flex-wrap:wrap;padding:8px 14px}
    .pv-chips button{padding:4px 10px;border-radius:999px;border:1px solid var(--b2);background:var(--bg1);color:var(--t2);font-size:11px;font-weight:700;cursor:pointer}
    .pv-chips button.on{background:var(--acc);border-color:var(--acc);color:#fff}
    .pv-chips button.nm.on{background:#ef4444;border-color:#ef4444}
    .pv-list{flex:1;min-height:120px;overflow-y:auto;overflow-x:hidden;padding:0 14px 10px;display:grid;grid-template-columns:minmax(0,1fr);gap:6px;align-content:start}
    .pv-row{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:12px;border:1px solid var(--b1);background:var(--bg1);cursor:pointer;transition:background .15s,border-color .15s}
    .pv-row:hover:not(.off){border-color:color-mix(in srgb,var(--acc) 40%,transparent)}
    .pv-row:active:not(.off){background:color-mix(in srgb,var(--acc) 8%,var(--bg1))}
    .pv-row.off{cursor:default}
    .pv-tier{flex-shrink:0;min-width:52px;text-align:center;font-size:9.5px;font-weight:850;letter-spacing:.04em;padding:3px 5px;border-radius:7px;color:var(--tone);background:color-mix(in srgb,var(--tone) 13%,transparent)}
    .pv-main{display:flex;flex-direction:column;min-width:0;flex:1}
    .pv-main b{font-size:12.5px;font-weight:750;color:var(--t1);overflow-wrap:anywhere}
    .pv-main small{font-size:10.5px;color:var(--t3);overflow-wrap:anywhere}
    .pv-add{flex-shrink:0;display:inline-flex;align-items:center;gap:3px;font-size:11.5px;padding:5px 10px}
    .pv-add:disabled,.pv-new:disabled{opacity:.35;cursor:not-allowed;box-shadow:none}
    .pv-new{display:flex;align-items:center;gap:6px;padding:9px 11px;border-radius:12px;border:1px dashed color-mix(in srgb,#f59e0b 65%,transparent);background:color-mix(in srgb,#f59e0b 8%,var(--bg1));color:var(--t1);font-size:12.5px;font-weight:700;cursor:pointer;text-align:left}
    .pv-more{justify-self:center;font-size:12px}
    .pv-day{border-top:1px solid var(--b1);background:var(--bg2);padding:10px 14px calc(12px + env(safe-area-inset-bottom));max-height:40%;overflow-y:auto;display:grid;gap:6px}
    .pv-day-h{display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:800;color:var(--t1)}
    .pv-day-h span{margin-left:auto;font-size:11px;padding:1px 8px;border-radius:99px;background:var(--acc);color:#fff}
    .pv-pl{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:11px;background:var(--bg1);border:1px solid var(--b1)}
    .pv-pl.new{animation:pvNew 1.2s ease}
    @keyframes pvNew{0%{background:color-mix(in srgb,var(--acc) 25%,var(--bg1));transform:translateY(-6px)}100%{background:var(--bg1);transform:none}}
    .pv-num{width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-size:11px;font-weight:800;color:#fff;background:var(--acc);flex-shrink:0}
    .pv-rm{width:30px;height:30px;border-radius:9px;border:1px solid var(--b1);background:var(--bg2);color:var(--red);display:grid;place-items:center;cursor:pointer;flex-shrink:0}
    /* top dealers not met (CRM) */
    .tc-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .tc-month{display:flex;align-items:center;gap:8px}
    .tc-month b{min-width:130px;text-align:center;font-size:14px;color:var(--t1)}
    .tc-month .btn{padding:6px 8px;display:inline-flex}
    .tc-bar .sel{font-size:13px;max-width:100%}
    .tc-search{display:flex;align-items:center;gap:6px;flex:1;min-width:180px;padding:7px 10px;border-radius:10px;border:1px solid var(--b2);background:var(--bg2);color:var(--t3)}
    .tc-search input{flex:1;min-width:0;border:0;background:transparent;color:var(--t1);font-size:13px;outline:none}
    .tc-chips{display:flex;gap:5px;flex-wrap:wrap}
    .tc-chips button{padding:5px 10px;border-radius:999px;border:1px solid var(--b2);background:var(--bg1);color:var(--t2);font-size:11.5px;font-weight:700;cursor:pointer}
    .tc-chips button.on{background:var(--acc);border-color:var(--acc);color:#fff}
    .tc-dl{display:inline-flex;align-items:center;gap:6px;margin-left:auto}
    .tc-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .tc-kpis .k{display:flex;flex-direction:column;padding:12px 14px;border-radius:16px;color:#fff}
    .tc-kpis .k b{font-size:26px;font-weight:850;line-height:1.1}
    .tc-kpis .k span{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.9}
    .tc-kpis .bad{background:linear-gradient(135deg,#ef4444,#f97316)}
    .tc-kpis .warn{background:linear-gradient(135deg,#f59e0b,#eab308)}
    .tc-kpis .ok{background:linear-gradient(135deg,#10b981,#059669)}
    .tc-note{display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--t3)}
    .tc-sec{display:grid;gap:10px;border-top:3px solid var(--tone)}
    .tc-sh{display:flex;align-items:center;gap:10px}
    .tc-toggle{width:100%;border:0;background:transparent;padding:0;cursor:pointer;color:var(--t1)}
    .tc-sh b{display:block;font-size:14.5px;color:var(--t1)}
    .tc-sh small{display:block;font-size:11.5px;color:var(--t3)}
    .tc-si{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
    .tc-n{font-size:13px;font-weight:850;padding:2px 10px;border-radius:999px;color:var(--tone);background:color-mix(in srgb,var(--tone) 12%,transparent)}
    .tc-list{display:grid;gap:6px}
    .tc-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 11px;border-radius:12px;border:1px solid var(--b1);background:var(--bg1);cursor:pointer;color:var(--t1)}
    .tc-row:hover{border-color:var(--b2);background:var(--bg2)}
    .tc-tier{flex-shrink:0;min-width:58px;text-align:center;font-size:10px;font-weight:850;letter-spacing:.04em;padding:3px 6px;border-radius:8px;color:var(--tone);background:color-mix(in srgb,var(--tone) 14%,transparent)}
    .tc-main{display:flex;flex-direction:column;min-width:0;flex:1}
    .tc-main b{font-size:13px;font-weight:750;overflow-wrap:anywhere}
    .tc-main small{font-size:11px;color:var(--t3);overflow-wrap:anywhere}
    .tc-main small.tc-pl{color:#b45309;font-weight:650}
    .tc-main small.tc-ok{color:#047857;font-weight:650}
    .tc-last{flex-shrink:0;text-align:right;font-size:10.5px;line-height:1.25;color:var(--t3);font-weight:650}
    .tc-empty{padding:14px;text-align:center;font-size:12.5px;color:var(--t3)}
    .tc-foot{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--t3)}
    @media(max-width:600px){.tc-dl{margin-left:0;flex:1;justify-content:center}.tc-month{flex:1;justify-content:space-between}.tc-bar .sel{flex:1}.tc-kpis .k b{font-size:22px}}
    /* new party: planned on the calendar, details at check-out */
    .np-box{display:grid;gap:8px;padding:12px;border-radius:14px;border:1px dashed color-mix(in srgb,#f59e0b 60%,transparent);background:color-mix(in srgb,#f59e0b 7%,var(--bg1))}
    .np-h{font-size:12px;color:var(--t2);line-height:1.4}
    .np-h span{display:inline-block;margin-right:6px;padding:1px 8px;border-radius:999px;background:#f59e0b;color:#1f1300;font-size:10.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}
    .np-err{font-size:11px;color:var(--red);margin-top:3px}
    .np-chk{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--t2);cursor:pointer}
    .np-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    @media(max-width:380px){.np-2{grid-template-columns:1fr}}
    .vc-new{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 11px;border-radius:12px;border:1px dashed color-mix(in srgb,#f59e0b 65%,transparent);background:color-mix(in srgb,#f59e0b 8%,var(--bg1));cursor:pointer;color:var(--t1)}
    .vc-new b{font-size:12.5px}
    .vc-new small{display:block;font-size:10.5px;color:var(--t3)}
    /* samples to carry (Visit calendar) */
    .scm{display:flex;flex-direction:column;overflow:hidden}
    .scm .dom-body{overflow:auto;flex:1;min-height:0}
    .scm-empty{display:flex;flex-direction:column;align-items:center;padding:26px 10px;text-align:center;font-size:13px;color:var(--t3)}
    .scm-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .scm-sum>div{display:flex;flex-direction:column;padding:10px 12px;border-radius:14px;background:var(--bg2)}
    .scm-sum>div:first-child{color:#fff;background:linear-gradient(135deg,#8b5cf6,#6366f1)}
    .scm-sum b{font-size:22px;font-weight:850;line-height:1.1}
    .scm-sum span{font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;opacity:.8}
    .scm-tabs{display:flex;gap:4px;padding:3px;border-radius:12px;background:var(--bg2)}
    .scm-tabs button{flex:1;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:8px 6px;border:0;border-radius:9px;background:transparent;color:var(--t2);font-size:12.5px;font-weight:700;cursor:pointer}
    .scm-tabs button.on{background:var(--bg1);color:var(--t1);box-shadow:0 1px 4px rgba(16,24,40,.12)}
    .scm-grp{display:grid;gap:8px}
    .scm-sm{font-size:13px;font-weight:800;color:var(--t1);padding-top:4px}
    .scm-sm span{font-weight:600;color:var(--t3)}
    .scm-list{display:grid;gap:6px}
    .scm-row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 11px;border-radius:12px;border:1px solid var(--b1);background:var(--bg1);color:var(--t1)}
    .scm-row.on{background:color-mix(in srgb,#10b981 8%,var(--bg1));border-color:color-mix(in srgb,#10b981 40%,transparent)}
    .scm-row.on .scm-main b{text-decoration:line-through;color:var(--t3)}
    .scm-tick{width:22px;height:22px;border-radius:7px;border:2px solid var(--b2);display:grid;place-items:center;flex-shrink:0;color:#fff}
    .scm-row.on .scm-tick{background:#10b981;border-color:#10b981}
    .scm-main{display:flex;flex-direction:column;min-width:0;flex:1}
    .scm-main b{font-size:13px;font-weight:750;overflow-wrap:anywhere}
    .scm-main small{font-size:11px;color:var(--t3);overflow-wrap:anywhere}
    .scm-x{flex-shrink:0;font-size:11px;font-weight:800;padding:2px 8px;border-radius:999px;color:#6d28d9;background:color-mix(in srgb,#8b5cf6 14%,transparent)}
    .scm-dealer{padding:10px 12px;border-radius:12px;border:1px solid var(--b1);display:grid;gap:7px}
    .scm-dn{font-size:13px;font-weight:800;color:var(--t1);overflow-wrap:anywhere}
    .scm-dn span{font-weight:600;color:var(--t3);font-size:11.5px}
    .scm-chips{display:flex;flex-wrap:wrap;gap:5px}
    .scm-chips span{font-size:11px;font-weight:650;padding:3px 8px;border-radius:8px;background:var(--bg2);color:var(--t2)}
    .scm-for{align-self:flex-start;font-size:9.5px;font-weight:850;letter-spacing:.04em;padding:2px 7px;border-radius:6px;margin-bottom:3px}
    .scm-for.give{background:#059669;color:#fff}
    .scm-for.both{background:#d1fae5;color:#047857}
    .scm-for.show{background:var(--bg2);color:var(--t2);border:1px solid var(--b2)}
    /* preview: the downloadable sheet, drawn as a paper page */
    .scp-paper{background:#fff;color:#111827;border-radius:10px;box-shadow:0 4px 18px rgba(16,24,40,.18);overflow:hidden;font-size:12px}
    .scp-band{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:14px 16px;background:#4f46e5;color:#fff}
    .scp-band b{display:block;font-size:17px;font-weight:800}
    .scp-band span{font-size:11.5px;opacity:.95}
    .scp-band small{font-size:10px;opacity:.9;white-space:nowrap}
    .scp-grp{padding:12px 14px 4px}
    .scp-name{font-size:14px;font-weight:800;color:#1e1b4b}
    .scp-name span{font-weight:500;font-size:11.5px;color:#6b7280}
    .scp-boxes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:8px 0 10px}
    .scp-boxes div{padding:7px 8px;border-radius:7px;background:#f3f4f6;min-width:0}
    .scp-boxes div.on{background:#4f46e5;color:#fff}
    .scp-boxes b{display:block;font-size:16px;font-weight:800;line-height:1.1}
    .scp-boxes span{display:block;font-size:8px;letter-spacing:.03em;color:inherit;opacity:.75;line-height:1.2}
    .scp-t{width:100%;border-collapse:collapse;margin-bottom:10px;table-layout:fixed}
    .scp-t th{background:#1e1b4b;color:#fff;font-size:10px;text-align:left;padding:5px 6px}
    .scp-t.dl th{background:#374151}
    .scp-t th,.scp-t td{white-space:normal;letter-spacing:0;text-transform:none}
    .scp-t td{padding:5px 6px;border-bottom:1px solid #e5e7eb;vertical-align:top;font-size:10.5px;color:#111827;overflow-wrap:anywhere}
    .scp-t tbody tr:nth-child(even) td{background:#f8f8ff}
    .scp-t th:first-child,.scp-t td.n{width:28px;text-align:right;color:#6b7280;white-space:nowrap!important}
    .scp-t td.f{font-weight:700}
    .scp-t td.f small{display:block;font-weight:500;color:#6b7280;font-size:9.5px}
    .scp-t td.g{color:#047857!important}
    .scp-t td.n{color:#6b7280!important}
    .scp-t td.c{text-align:center;font-weight:700}
    .scp-t th:nth-child(3){width:32px}
    .scp-t:not(.dl) th:nth-child(4){width:34%}
    .scp-t td.for{text-align:center;font-weight:800;font-size:8.5px}
    .scp-t tbody tr td.for.give{background:#059669;color:#fff}
    .scp-t tbody tr td.for.both{background:#d1fae5;color:#047857}
    .scp-t tbody tr td.for.show{background:#e5e7eb;color:#4b5563}
    .scp-t td.g{color:#047857;font-weight:700}
    .scp-sub{font-size:12.5px;font-weight:800;color:#1e1b4b;margin:2px 0 5px}
    .scp-foot{padding:6px 14px 12px;font-size:9.5px;color:#6b7280}
    .scm-chips span.give{background:color-mix(in srgb,#10b981 14%,transparent);color:#047857}
    .scm-main small.scm-give{color:#047857;font-weight:700}
    .scm-foot{display:flex;gap:8px;justify-content:flex-end;padding:10px 14px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--b1);background:var(--bg1)}
    .scm-foot button{display:inline-flex;align-items:center;gap:6px}
    .scm-foot .scm-xl{color:#047857;border-color:color-mix(in srgb,#10b981 45%,transparent)}
    .scm-foot .scm-pdf{background:#dc2626;border-color:#dc2626}
    @media(max-width:600px){.scm-foot button{flex:1;justify-content:center}.scm{max-height:92vh}}
    @media(max-width:600px){.dom-overlay{align-items:flex-end;padding:0}.dom{border-radius:20px 20px 0 0;width:100%}}
    /* phone menu: theme, server and app version (moved out of the top bar) */
    .sb-phone-tools{display:none}
    @media(max-width:768px){
      .sb-phone-tools{display:block;margin:6px 10px 4px;padding:10px;border-radius:14px;background:var(--bg2);border:1px solid var(--b1)}
      .sb-tools-t{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);margin-bottom:6px}
    }
    /* language picker */
    .lp-btn{display:inline-flex;align-items:center;gap:5px;flex-shrink:0;height:32px;padding:0 9px;border-radius:10px;cursor:pointer;
      border:1px solid var(--b2);background:var(--bg2);color:var(--t2);font-size:12px;font-weight:800;transition:background .15s,color .15s,border-color .15s}
    .lp-btn:hover,.lp-btn.on{border-color:var(--acc);color:var(--acc);background:var(--accL)}
    .lp-menu{position:fixed;z-index:9999;min-width:190px;padding:6px;border-radius:14px;background:var(--bg1);border:1px solid var(--b2);box-shadow:0 18px 40px rgba(16,24,40,.25);animation:pageIn .18s ease}
    .lp-head{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);padding:6px 10px 4px}
    .lp-item{display:flex;align-items:center;gap:10px;width:100%;border:none;background:transparent;padding:9px 10px;border-radius:10px;cursor:pointer;font:inherit;color:var(--t1);text-align:left}
    .lp-item:hover{background:var(--bg2)}
    .lp-item.on{background:var(--accL);color:var(--acc);font-weight:800}
    .lp-short{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;background:var(--bg2);font-size:12px;font-weight:800;color:var(--t2);flex-shrink:0}
    .lp-item.on .lp-short{background:var(--acc);color:#fff}
    .lp-name{flex:1;font-size:14px}
    .lp-tick{font-weight:900}
    @media(max-width:600px){.lp-btn{padding:0 7px;gap:3px}.lp-btn svg{width:14px;height:14px}}
    /* view cycle picker on the month bar */
    .cyc-pick{display:inline-flex;align-items:center;gap:6px;flex-shrink:0;height:28px;padding:0 4px 0 10px;margin-right:6px;border-radius:9px;
      background:var(--accL);border:1px solid color-mix(in srgb,var(--acc) 35%,transparent);color:var(--acc);cursor:pointer}
    .cyc-pick select{border:none;background:transparent;color:var(--acc);font-size:11.5px;font-weight:800;outline:none;cursor:pointer;padding-right:2px}
    .cyc-pick select option{color:var(--t1);background:var(--bg1)}
    /* Home: every section its own shape */
    .tier-hero{position:relative;overflow:hidden;border-radius:18px;padding:16px 18px;color:#fff;cursor:pointer;
      background:linear-gradient(135deg,var(--g1),var(--g2));box-shadow:0 10px 24px color-mix(in srgb,var(--g1) 28%,transparent);transition:transform .15s,box-shadow .15s}
    .tier-hero:hover{transform:translateY(-3px);box-shadow:0 16px 32px color-mix(in srgb,var(--g1) 38%,transparent)}
    .tier-hero .th-wm{position:absolute;right:-16px;bottom:-22px;opacity:.14;pointer-events:none}
    .tier-hero .th-ico{width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,.22);display:grid;place-items:center;flex-shrink:0}
    .tier-hero .th-lbl{font-size:11.5px;font-weight:800;letter-spacing:.08em}
    .tier-hero .th-sub{font-size:10.5px;opacity:.82}
    .tier-hero .th-n{position:relative;font-size:36px;font-weight:850;line-height:1;margin:12px 0 10px;letter-spacing:-.02em}
    .tier-hero .th-n small{font-size:12px;font-weight:600;opacity:.82;margin-left:7px;letter-spacing:0}
    .tier-hero .th-pill{display:inline-block;font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:20px;background:rgba(255,255,255,.2);color:#fff;margin:2px;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle;cursor:pointer}
    .tier-hero .th-pill:hover{background:rgba(255,255,255,.34)}
    .tier-hero .th-more{font-size:10.5px;opacity:.85;margin-left:4px}
    .hm-bar{display:flex;gap:3px;height:16px;border-radius:9px;overflow:hidden;margin:6px 0 12px}
    .hm-bar>div{min-width:8px;cursor:pointer;transition:filter .15s}
    .hm-bar>div:hover{filter:brightness(1.12)}
    .hm-legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:4px}
    .hm-item{display:flex;flex-direction:column;gap:3px;text-align:left;border:none;background:transparent;padding:8px 10px;border-radius:12px;cursor:pointer;transition:background .15s;font:inherit}
    .hm-item:hover{background:var(--bg2)}
    .hm-lbl{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.06em;color:color-mix(in srgb,var(--tone) 80%,var(--t1))}
    .hm-lbl i{width:9px;height:9px;border-radius:3px;background:var(--tone)}
    .hm-n{font-size:22px;font-weight:850;color:var(--t1);letter-spacing:-.02em;line-height:1.1}
    .hm-n small{font-size:11px;font-weight:700;color:var(--t3);margin-left:6px;letter-spacing:0}
    .hm-sub{font-size:10.5px;color:var(--t3)}
    .ring-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px}
    .ring-item{display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid transparent;background:transparent;border-radius:16px;padding:10px 6px;cursor:pointer;transition:background .15s,border-color .15s;font:inherit}
    .ring-item:hover{background:var(--bg2);border-color:var(--b1)}
    /* each ring on its own soft square tile, tinted with its colour — like a hover that stays */
    .ov-home .ring-item,.ring-grid .ring-item{background:linear-gradient(160deg,color-mix(in srgb,var(--tone) 11%,var(--bg1)),color-mix(in srgb,var(--tone) 4%,var(--bg1)));border:1px solid color-mix(in srgb,var(--tone) 22%,transparent);border-radius:16px;box-shadow:0 1px 2px rgba(16,24,40,.04);transition:transform .18s,box-shadow .18s,background .18s,border-color .18s}
    .ov-home .ring-item:hover,.ring-grid .ring-item:hover{background:linear-gradient(160deg,color-mix(in srgb,var(--tone) 17%,var(--bg1)),color-mix(in srgb,var(--tone) 7%,var(--bg1)));border-color:color-mix(in srgb,var(--tone) 40%,transparent);transform:translateY(-2px);box-shadow:0 8px 20px color-mix(in srgb,var(--tone) 20%,transparent)}
    .ring-grid .ring-item .ring-bg{stroke:color-mix(in srgb,var(--tone) 14%,var(--bg2))}
    .ring-wrap{position:relative;display:grid;place-items:center}
    .ring-wrap b{position:absolute;font-size:17px;font-weight:850;color:var(--t1)}
    .ring-bg{stroke:var(--bg3)}
    .ring-fg{transition:stroke-dasharray .8s ease}
    .ring-lbl{font-size:11px;font-weight:800;letter-spacing:.05em;color:color-mix(in srgb,var(--tone) 80%,var(--t1));text-align:center}
    .ring-p{font-size:10.5px;color:var(--t3)}
    .cat-strip{display:flex;gap:2px;height:10px;border-radius:6px;overflow:hidden;margin:2px 0 4px}
    .cat-strip>div{min-width:4px}
    .cat-tile{border-radius:14px;padding:12px 14px;background:color-mix(in srgb,var(--tone) 8%,var(--bg1));border:1px solid color-mix(in srgb,var(--tone) 22%,transparent)}
    [data-tone="dark"] .cat-tile{background:color-mix(in srgb,var(--tone) 14%,var(--bg1))}
    .cat-tile-head{display:flex;align-items:center;gap:7px}
    .cat-tile-head i{width:10px;height:10px;border-radius:50%;background:var(--tone);flex-shrink:0}
    .cat-name{flex:1;min-width:0;font-size:11.5px;font-weight:800;letter-spacing:.04em;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .cat-share{font-size:10.5px;font-weight:800;color:var(--tone);background:var(--bg1);padding:1px 7px;border-radius:10px}
    .cat-num{font-size:24px;font-weight:850;color:color-mix(in srgb,var(--tone) 85%,var(--t1));letter-spacing:-.02em;margin:6px 0 6px}
    .cat-tgt{margin:-2px 0 7px}
    .cat-tgt-t{display:flex;align-items:baseline;justify-content:space-between;gap:6px;font-size:11px;color:var(--t3)}
    .cat-tgt-t b{color:var(--t2);font-weight:800}
    .cat-tgt-t em{font-style:normal;font-weight:850;font-size:11.5px}
    .cat-tgt-bar{height:5px;border-radius:3px;background:color-mix(in srgb,var(--tone) 14%,var(--bg2));overflow:hidden;margin-top:4px}
    .cat-tgt-bar>div{height:100%;border-radius:3px;transform-origin:left;animation:barGrow .8s cubic-bezier(.2,.8,.2,1) both}
    .cat-subs{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:10.5px;color:var(--t3)}
    .cat-subs b{color:var(--t2)}
    .cl-grid{display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(270px,1fr))}
    .cl-row{position:relative;border-radius:12px;background:var(--bg2);border:1px solid transparent;overflow:hidden;cursor:pointer;padding:8px 12px;align-self:start;transition:border-color .15s}
    .cl-row::before{content:'';position:absolute;left:0;top:0;bottom:0;width:var(--share);background:color-mix(in srgb,var(--tone) 18%,transparent);transition:width .6s ease}
    .cl-row:hover{border-color:color-mix(in srgb,var(--tone) 40%,transparent)}
    .cl-row.open{border-color:var(--acc)}
    .cl-row>*{position:relative}
    .cl-main{display:flex;align-items:center;gap:10px}
    .cl-name{font-size:12.5px;font-weight:700;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .cl-sub{font-size:10.5px;color:var(--t3)}
    .cl-qty{font-size:15px;font-weight:850;color:var(--t1);font-variant-numeric:tabular-nums}
    /* All Dealers: toolbar, filter panel, quick segments, cards */
    .dl-toolbar{padding:12px 14px !important;margin-bottom:10px}
    .dl-tb-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .dl-search{flex:1 1 240px;display:flex;align-items:center;gap:8px;background:var(--bg2);border:1px solid var(--b1);border-radius:12px;padding:0 10px;height:38px;color:var(--t3);transition:border-color .15s,box-shadow .15s}
    .dl-search:focus-within{border-color:var(--acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 15%,transparent)}
    .dl-search input{flex:1;border:none;background:transparent;outline:none;color:var(--t1);font-size:13.5px;min-width:0}
    .dl-search button{border:none;background:var(--bg3);color:var(--t2);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;cursor:pointer;flex-shrink:0}
    .dl-fbtn{display:inline-flex !important;align-items:center;gap:6px;height:38px}
    .dl-fbtn.on{border-color:var(--acc) !important;color:var(--acc) !important;background:var(--accL) !important}
    .dl-badge{background:var(--acc);color:#fff;border-radius:10px;font-size:10.5px;font-weight:800;padding:0 6px;line-height:17px}
    .dl-sort{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 4px 0 10px;border:1px solid var(--b1);border-radius:10px;background:var(--bg1);color:var(--t3)}
    .dl-sort select{border:none;background:transparent;color:var(--t1);font-size:12.5px;font-weight:700;outline:none;cursor:pointer;min-width:0}
    .dl-sort button{border:none;background:var(--bg2);color:var(--acc);border-radius:7px;width:28px;height:28px;cursor:pointer;font-weight:800;font-size:14px}
    .dl-fpanel{display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:10px;margin-top:12px;padding-top:12px;border-top:1px dashed var(--b2);animation:pageIn .25s ease}
    .dl-fl{display:flex;flex-direction:column;gap:4px;min-width:0}
    .dl-fl > span{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--t3)}
    .dl-fl > div{display:block !important;width:100%}
    .dl-fl > .dl-range{display:flex !important;gap:6px}
    .dl-fl > div > .btn,.dl-fl > select,.dl-fl > .dl-range > input{width:100% !important;min-width:0 !important}
    .dl-fl > div > .btn > span{max-width:none !important}
    .dl-fl > div > div{min-width:100% !important}
    .dl-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;align-items:center}
    .dl-chip{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--acc);background:var(--accL);border:1px solid color-mix(in srgb,var(--acc) 25%,transparent);border-radius:20px;padding:3px 6px 3px 10px;animation:pageIn .2s ease}
    .dl-chip button{border:none;background:transparent;color:inherit;cursor:pointer;display:grid;place-items:center;padding:0;opacity:.7}
    .dl-chip button:hover{opacity:1}
    .dl-quick{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 12px;scrollbar-width:none}
    .dl-quick::-webkit-scrollbar{display:none}
    .dl-quick .thr{white-space:nowrap;display:inline-flex;align-items:center;gap:7px;flex-shrink:0}
    .dl-quick .thr i{font-style:normal;font-size:10.5px;font-weight:800;padding:0 6px;border-radius:10px;line-height:17px;background:color-mix(in srgb,var(--tone) 14%,transparent);color:var(--tone)}
    .dl-quick .thr.on i{background:rgba(255,255,255,.25);color:#fff}
    .dl-selbar{position:sticky;top:8px;z-index:30;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:9px 12px;margin-bottom:10px;border-radius:14px;background:var(--bg1);border:1px solid var(--acc);box-shadow:0 10px 30px color-mix(in srgb,var(--acc) 22%,transparent);animation:pageIn .2s ease}
    .dl-cols{position:absolute;right:0;top:calc(100% + 6px);z-index:60;background:var(--bg1);border:1px solid var(--b2);border-radius:12px;box-shadow:var(--shadowHover);padding:6px;min-width:250px}
    .dl-cols label{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:8px;font-size:12.5px;color:var(--t1);cursor:pointer}
    .dl-cols label:hover{background:var(--bg2)}
    .dl-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(275px,1fr));gap:12px}
    .dl-card{position:relative;background:var(--bg1);border:1px solid var(--b1);border-radius:16px;padding:15px 14px 12px;cursor:pointer;display:flex;flex-direction:column;gap:10px;transition:transform .15s,box-shadow .15s,border-color .15s;overflow:hidden;animation:pageIn .3s ease both}
    .dl-card::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,var(--tone),color-mix(in srgb,var(--tone) 30%,transparent))}
    .dl-card:hover{transform:translateY(-2px);box-shadow:var(--shadowHover);border-color:var(--b2)}
    .dl-card.sel{border-color:var(--acc);box-shadow:0 0 0 3px var(--accL)}
    .dl-card-top{display:flex;align-items:center;gap:10px;min-width:0}
    .dl-card-name{font-size:14px;font-weight:800;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dl-card-sub{font-size:11.5px;color:var(--t3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .dl-card-chk{border:none;background:transparent;color:var(--t3);cursor:pointer;padding:4px;display:grid;place-items:center;border-radius:8px}
    .dl-card-chk:hover{background:var(--bg2)}
    .dl-card-badges{display:flex;flex-wrap:wrap;gap:5px;align-items:center}
    .dl-card-fig{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;background:var(--bg2);border-radius:12px;padding:9px 11px}
    .dl-card-fig span{display:block;font-size:9.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin-bottom:2px}
    .dl-card-fig b{font-size:16px;font-weight:850;color:var(--t1);letter-spacing:-.01em}
    .dl-card-foot{display:flex;align-items:center;gap:8px}
    .dl-card .pbar{width:100%;margin-left:0}
    .dl-od{display:inline-flex;align-items:center;gap:3px;font-size:11px;font-weight:800;color:var(--red);background:color-mix(in srgb,var(--red) 10%,transparent);padding:2px 7px;border-radius:10px}
    .dl-more{display:flex;align-items:center;justify-content:center;gap:8px;padding:16px;font-size:12px;color:var(--t3);flex-wrap:wrap}
    .dl-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:44px 16px !important;color:var(--t3);text-align:center}
    @media(max-width:600px){
      .dl-search{flex-basis:100%}
      .dl-sort{flex:1}.dl-sort select{flex:1}
      .dl-fpanel{grid-template-columns:1fr 1fr}
      .dl-cards{grid-template-columns:1fr}
    }
    /* lists and tables */
    .count-pill{font-size:11px;font-weight:800;color:var(--acc);background:var(--accL);padding:2px 9px;border-radius:20px}
    .ini{--h:220;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;font-size:11px;font-weight:800;letter-spacing:.02em;
      color:hsl(var(--h) 55% 38%);background:hsl(var(--h) 70% 93%)}
    [data-tone="dark"] .ini{color:hsl(var(--h) 70% 78%);background:hsl(var(--h) 35% 22%)}
    .pbar{height:4px;border-radius:3px;background:var(--bg3);margin-top:4px;overflow:hidden;margin-left:auto;width:64px}
    .pbar>div{height:100%;border-radius:3px}
    .trend{display:inline-flex;align-items:center;gap:2px;font-size:11px;font-weight:700;padding:2px 7px;border-radius:20px;color:var(--t3);background:var(--bg2)}
    .trend.up{color:var(--grn);background:color-mix(in srgb,var(--grn) 12%,transparent)}
    .trend.down{color:var(--red);background:color-mix(in srgb,var(--red) 12%,transparent)}
    /* bottom tab bar — phones only */
    .bn{display:none}
    @media(max-width:768px){
      .bn{
        display:flex;position:fixed;left:0;right:0;bottom:0;z-index:1150;
        height:calc(64px + env(safe-area-inset-bottom));padding:0 6px env(safe-area-inset-bottom);
        background:var(--navBg,var(--bg1));backdrop-filter:saturate(1.6) blur(12px);-webkit-backdrop-filter:saturate(1.6) blur(12px);
        border-top:1px solid var(--b1);box-shadow:0 -6px 24px rgba(16,24,40,.07);
        align-items:stretch;justify-content:space-around;
      }
      #main{padding-bottom:calc(96px + env(safe-area-inset-bottom)) !important}
      .qa-fab{display:none !important}
    }
    .bn-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
      background:none;border:none;color:var(--t3);font-size:10.5px;font-weight:600;padding:6px 0;border-radius:12px;
      transition:color .15s,transform .1s;-webkit-tap-highlight-color:transparent}
    .bn-tab:active{transform:scale(.94)}
    .bn-tab.on{color:var(--acc)}
    .bn-tab.on span{font-weight:800}
    .bn-plus-wrap{flex:1;display:flex;justify-content:center;position:relative}
    .bn-plus{position:absolute;top:-22px;width:58px;height:58px;border-radius:50%;border:4px solid var(--bg);
      background:linear-gradient(135deg,var(--heroA,var(--acc)),var(--heroB,var(--acc)));color:#fff;display:grid;place-items:center;
      box-shadow:0 8px 20px color-mix(in srgb,var(--fab,var(--acc)) 45%,transparent);transition:transform .15s}
    .bn-plus:active{transform:scale(.92)}

    /* the round + on a computer */
    .qa-fab{position:fixed;right:26px;bottom:26px;z-index:1150;width:58px;height:58px;border-radius:50%;border:none;
      background:linear-gradient(135deg,var(--heroA,var(--acc)),var(--heroB,var(--acc)));color:#fff;display:grid;place-items:center;
      box-shadow:0 10px 26px color-mix(in srgb,var(--fab,var(--acc)) 45%,transparent);transition:transform .15s,box-shadow .15s}
    .qa-fab:hover{transform:translateY(-2px) rotate(90deg)}

    /* quick-action sheet */
    .qa-backdrop{position:fixed;inset:0;z-index:2100;background:var(--overlay,rgba(15,23,42,.45));display:flex;align-items:flex-end;justify-content:flex-end;
      padding:0 26px 96px;animation:fadeIn .15s ease;backdrop-filter:blur(2px)}
    .qa-sheet{width:min(460px,100%);background:var(--bg1);border-radius:20px;padding:14px 16px 16px;box-shadow:0 24px 60px rgba(16,24,40,.28);animation:popIn .18s ease}
    .qa-grab{display:none}
    .qa-head{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px}
    .qa-title{font-size:17px;font-weight:800;color:var(--t1)}
    .qa-sub{font-size:12px;color:var(--t3);margin-top:1px}
    .qa-close{margin-left:auto;width:34px;height:34px;border-radius:10px;border:1px solid var(--b1);background:var(--bg2);color:var(--t2);display:grid;place-items:center}
    .qa-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .qa-tile{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:12px 6px 10px;border-radius:14px;
      background:var(--bg2);border:1px solid transparent;color:var(--t1);transition:transform .12s,border-color .12s,background .12s;min-width:0}
    .qa-tile:hover{border-color:var(--b2);background:var(--bg1);transform:translateY(-1px)}
    .qa-tile:active{transform:scale(.96)}
    .qa-ico{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;color:var(--qa);
      background:color-mix(in srgb,var(--qa) 13%,transparent)}
    [data-tone="dark"] .qa-ico{background:color-mix(in srgb,var(--qa) 24%,transparent);color:color-mix(in srgb,var(--qa) 60%,#fff)}
    .qa-lbl{font-size:12.5px;font-weight:700;line-height:1.2}
    .qa-hint{font-size:10.5px;color:var(--t3);line-height:1.25}
    @media(max-width:768px){
      .qa-backdrop{padding:0}
      .qa-sheet{width:100%;border-radius:22px 22px 0 0;padding:8px 14px calc(18px + env(safe-area-inset-bottom));animation:sheetUp .22s cubic-bezier(.2,.8,.2,1)}
      .qa-grab{display:block;width:40px;height:5px;border-radius:3px;background:var(--b2);margin:2px auto 10px}
      .qa-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
      .qa-tile{padding:10px 2px 8px;background:transparent}
      .qa-hint{display:none}
      .qa-lbl{font-size:11px;font-weight:600}
    }
    @keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}

    /* greeting card on Home */
    .hh{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px;margin-bottom:16px}
    .hh-card{position:relative;overflow:hidden;border-radius:20px;padding:18px 20px;color:#fff;
      background:linear-gradient(135deg,var(--heroA,#1d4ed8),var(--heroB,#3b82f6));box-shadow:0 12px 30px color-mix(in srgb,var(--heroA,#1d4ed8) 35%,transparent)}
    .hh-card::after{content:'';position:absolute;right:-60px;top:-60px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.08)}
    .hh-card::before{content:'';position:absolute;right:40px;bottom:-90px;width:170px;height:170px;border-radius:50%;background:rgba(255,255,255,.06)}
    .hh-top{display:flex;align-items:center;gap:14px;position:relative;z-index:1}
    .hh-date{font-size:12px;opacity:.85;font-weight:600}
    .hh-hello{font-size:22px;font-weight:850;letter-spacing:-.01em;margin-top:2px;line-height:1.2}
    .hh-sub{font-size:12.5px;opacity:.85;margin-top:3px}
    .hh-ring{--p:0;margin-left:auto;flex-shrink:0;width:84px;height:84px;border-radius:50%;display:grid;place-items:center;
      background:conic-gradient(#fff calc(var(--p)*1%),rgba(255,255,255,.22) 0)}
    .hh-ring>div{width:68px;height:68px;border-radius:50%;background:color-mix(in srgb,var(--heroA,#1d4ed8) 88%,#000);display:grid;place-items:center;text-align:center;align-content:center}
    .hh-ring b{font-size:18px;font-weight:850;line-height:1}
    .hh-ring span{font-size:9.5px;opacity:.85;margin-top:2px}
    .hh-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:16px;position:relative;z-index:1}
    .hh-kpis>div{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:8px 10px;min-width:0}
    .hh-kpis span{display:block;font-size:10.5px;opacity:.85;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .hh-kpis b{display:block;font-size:17px;font-weight:850;margin-top:1px}
    .hh-actions{padding:14px 14px 10px !important}
    .hh-actions-head{display:flex;align-items:center;margin-bottom:8px}
    .hh-actions-head b{font-size:14.5px;font-weight:800}
    .hh-all{margin-left:auto;background:none;border:none;color:var(--acc);font-weight:700;font-size:12.5px}
    .hh-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}
    .hh-grid .qa-tile{background:transparent;padding:8px 2px}
    .hh-grid .qa-tile:hover{background:var(--bg2)}
    .hh-grid .qa-lbl{font-size:11.5px;font-weight:600}
    @media(max-width:900px){.hh{grid-template-columns:1fr}}
    @media(max-width:480px){
      .hh-card{padding:16px;border-radius:18px}
      .hh-hello{font-size:19px}
      .hh-ring{width:72px;height:72px}.hh-ring>div{width:58px;height:58px}.hh-ring b{font-size:15px}
      .hh-kpis b{font-size:15px}
    }

    /* ── Topbar responsive helpers ── */
    .hide-sm{display:flex}
    .territory-bar{display:flex}
    .topbar-brand{}

    /* ── RESPONSIVE ── */

    /* Tablet: 768px and below */
    @media(max-width:768px){
      #topbar{padding:env(safe-area-inset-top) 8px 0;gap:6px;
        height:calc(48px + env(safe-area-inset-top));
        min-height:calc(48px + env(safe-area-inset-top))}
      #topbar .territory-bar{display:none !important}
      .hide-sm{display:none !important}
      .topbar-brand{display:none !important}
      #sidebar{
        position:fixed;left:0;top:calc(48px + env(safe-area-inset-top));bottom:0;
        width:240px;min-width:240px;
        transform:translateX(-100%);
        box-shadow:4px 0 24px rgba(0,0,0,.4);
      }
      #sidebar.closed{transform:translateX(-100%);width:240px;min-width:240px;overflow:hidden;border-right:1px solid var(--b1)}
      #sidebar.open{transform:translateX(0);z-index:1200}   /* above the bottom tabs, so its foot (profile, Sign out) is reachable */
      #main{padding:12px}
      .stat-grid{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
      .stat-card{padding:10px 12px}
      .card{padding:12px 14px}
      /* .row is the shared toolbar class (display:flex, no wrap). With four or
         five buttons it runs off the side of a phone — measured 293px of
         overflow on Leads, 39px on Leaves. Wrapping only under the mobile
         breakpoint leaves every desktop layout untouched. */
      .row{flex-wrap:wrap}

      .hmob{display:none}
      .modal{padding:16px;border-radius:12px}
      table{font-size:12px}
      th,td{padding:6px 8px}

      /* Page headers eat a lot of the first screen on a phone: a 24px title,
         a 22px gap under the block, and a roomy "last updated" pill pushed
         the actual numbers below the fold. Tighten all of it — the desktop
         sizes are untouched. */
      .page-head{margin-bottom:10px !important;gap:10px !important}
      .page-head .page-eyebrow{font-size:10px !important;letter-spacing:.1em !important;margin-bottom:2px !important}
      .page-head .page-title{font-size:18px !important;line-height:1.25}
      .page-head .page-stamp{margin-top:6px !important;padding:4px 9px !important;font-size:11px !important}
    }

    /* Mobile: 480px and below */
    @media(max-width:480px){
      #topbar{height:44px;min-height:44px;padding:0 6px;gap:4px}
      #sidebar{top:44px;width:260px;min-width:260px}
      #sidebar.closed{width:260px;min-width:260px}
      #main{padding:10px}
      .stat-grid{grid-template-columns:1fr 1fr;gap:6px}
      .stat-card{padding:8px 10px}
      .stat-card .stat-value{font-size:20px}
      .card{padding:10px 12px;border-radius:10px}
      .btnp{padding:7px 12px;font-size:12px}
      .btn{padding:6px 10px;font-size:12px}
      .tabs{gap:0}
      .tab{padding:7px 10px;font-size:12px}
      .modal{padding:12px;border-radius:10px}
      .overlay{padding:10px}
      .g2{grid-template-columns:1fr}
      table{font-size:11px}
      th,td{padding:5px 6px}
      /* Stack filter rows */
      .filter-row{flex-direction:column;align-items:stretch}
      .filter-row .inp{width:100%}
    }

    /* Very small: 360px */
    @media(max-width:360px){
      .stat-grid{grid-template-columns:1fr}
      #topbar .brand-text{display:none}
    }

    /* Desktop: keep sidebar always visible */
    @media(min-width:769px){
      #sidebar{transform:none !important;position:relative;top:auto;box-shadow:none}
      #sidebar.closed{transform:none !important;width:0;min-width:0;overflow:hidden;border:none}
      #sb-overlay{display:none !important}
    }

    /* Touch devices — bigger tap targets */
    @media(hover:none) and (pointer:coarse){
      .nav-item{padding:11px 14px}
      .btn{padding:9px 14px}
      .tab{padding:10px 14px}
      th,td{padding:9px 10px}
    }

    /* ── CRM pages — mobile-friendly layout ────────────────────────────── */
    .crm-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
    .crm-row > *{min-width:0}
    .crm-loc-pill{flex:1 1 220px;min-width:0}
    .crm-photo-thumb{width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--b2);cursor:zoom-in;flex-shrink:0}
    .crm-photo-thumb-lg{width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid var(--b2);cursor:zoom-in;flex-shrink:0}

    @media(max-width:640px){
      /* Stack camera + location vertically, full-width buttons */
      .crm-row{flex-direction:column;align-items:stretch}
      .crm-row > *{width:100%}
      .crm-row .crm-loc-pill{flex:1 1 auto}
      .crm-row button{width:100%;justify-content:center}
      .crm-row .crm-photo-mount{justify-content:space-between}

      /* Tighter cards on phone */
      .card{padding:12px 12px}
      /* Page headers smaller on phone */
      .crm-page-title{font-size:18px !important}
      .crm-page-sub{font-size:11px !important}

      /* History rows reflow */
      .crm-history-row{flex-wrap:wrap}
      .crm-history-row .crm-history-time{margin-left:0 !important}
    }

    @media(max-width:380px){
      .crm-photo-thumb-lg{width:56px;height:56px}
    }

    /* ── Narrow screens: nothing may push the page sideways ─────────────
       A page that scrolls horizontally on a phone is the single worst
       responsive failure — the layout looks broken and content hides off
       the edge with no hint it is there. Two things cause it here.

       1. Wide tables. Twelve screens render a table with no scroll
          wrapper (Outstanding, Product Transactions, Sales by Category,
          India Map, Manage Months, Compare, and others), so the table's
          natural width becomes the page's width. Making the table itself
          the scroll container fixes every one at once, including any
          added later, without touching a single component.

       2. Unbroken strings. Dealer names, addresses and emails have no
          spaces to wrap at, so one long value widens everything.

       Both are scoped to the phone breakpoint; desktop layout is
       untouched. */
    @media(max-width:768px){
      /* The table becomes its own horizontal scroller. display:block is
         what allows overflow on a table element at all — the trade is
         that the table shrinks to content instead of filling the width,
         which reads fine on a phone. Tables already inside a .scroll
         wrapper are left alone so they keep normal layout. */
      :not(.scroll) > table{
        display:block;
        max-width:100%;
        overflow-x:auto;
        -webkit-overflow-scrolling:touch;
      }
      /* Keep column headers from collapsing to one word per line once the
         table is free to size itself. */
      :not(.scroll) > table th{white-space:nowrap}

      /* Long values wrap instead of stretching the row. */
      td, th, .chip, .page-title{overflow-wrap:anywhere}

      /* Modal action rows (Download / Share / Delete) wrap rather than
         running off the edge. */
      .modal .row{flex-wrap:wrap}
    }

    /* The permissions grid is deliberately wide — users down, one column
       per permission. On a phone the rotated headings are what cost the
       most room, so shorten them and let the grid scroll. */
    @media(max-width:768px){
      .perm-matrix{max-height:56vh}
      .perm-matrix th > div{height:78px !important;font-size:9px}
      .perm-matrix td:first-child, .perm-matrix th:first-child{min-width:130px !important}
    }
    `}</style>
  );
}