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
    :root,[data-theme="dark"]{--bg:#080810;--bg1:#0e0e1a;--bg2:#141422;--bg3:#1a1a2e;--b1:#1e1e30;--b2:#252538;--t1:#e2e0f0;--t2:#9492a8;--t3:#55546a;--acc:#6366f1;--accL:rgba(99,102,241,0.15);--grn:#34d399;--yel:#fbbf24;--red:#f87171;--pur:#a78bfa;}
    [data-theme="light"]{--bg:#f0f2f8;--bg1:#ffffff;--bg2:#f5f7fc;--bg3:#eef0f8;--b1:#e2e4f0;--b2:#d4d7e8;--t1:#1a1a2e;--t2:#4a4a6a;--t3:#8888aa;--acc:#4f52d8;--accL:rgba(79,82,216,0.1);--grn:#059669;--yel:#d97706;--red:#dc2626;--pur:#7c3aed;}

    *{box-sizing:border-box;margin:0;padding:0}
    html,body,#root{height:100%;width:100%}
    body{background:var(--bg);color:var(--t1);font-family:Inter,system-ui,sans-serif;font-size:14px;transition:background .2s,color .2s;-webkit-text-size-adjust:100%}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:var(--bg1)}
    ::-webkit-scrollbar-thumb{background:var(--b2);border-radius:3px}
    button{cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent}
    input,select,textarea,button{font-family:inherit;font-size:13px}
    input,select,textarea{outline:none}

    @keyframes spin{to{transform:rotate(360deg)}}
    /* Used by the update button's dot — a quiet nudge that a build is waiting. */
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
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
      padding-bottom:env(safe-area-inset-bottom);
      width:200px;min-width:200px;background:var(--bg1);border-right:1px solid var(--b1);
      display:flex;flex-direction:column;flex-shrink:0;overflow-y:auto;
      transition:transform .25s ease,min-width .25s ease,width .25s ease;
      z-index:1100;
    }
    #sidebar.closed{width:0;min-width:0;overflow:hidden;border:none}

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
    .insight-card{transition:transform .15s, box-shadow .15s, filter .15s}
    .insight-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.28);filter:brightness(1.06)}
    .insight-card:active{transform:translateY(0)}
    /* Category filter trigger — same lift as the movement cards it sits beside. */
    .cat-filter-btn{transition:transform .15s, box-shadow .15s, filter .15s}
    .cat-filter-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(0,0,0,.22);filter:brightness(1.05)}
    .skel{background:linear-gradient(90deg,var(--bg2) 0%,var(--bg3) 50%,var(--bg2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite;border-radius:6px;display:block}

    /* ── Material palette shape rules ──────────────────────────────────
       Colour variables can't express these: the reference look is
       borderless white cards floating on grey, generous radii, and a solid
       dark pill for the active nav item. Scoped to the palette so no other
       theme is affected. */
    [data-palette="material"] .card,
    [data-palette="material"] .stat-card,
    [data-palette="material"] .modal{border:none}
    [data-palette="material"] .card{border-radius:6px;padding:16px 18px}
    [data-palette="material"] .stat-card{border-radius:6px}
    [data-palette="material"] .modal{border-radius:8px}
    /* Top bar is a solid navy band. Re-declaring the neutral variables inside
       it flips every child that uses them (labels, buttons, inputs) to light
       automatically, while explicitly-coloured items (green/amber figures)
       keep their own colour. */
    [data-palette="material"] #topbar{
      background:#2f4162;border-bottom:none;box-shadow:0 2px 10px rgba(20,30,60,.28);
      --t1:#ffffff; --t2:#d3dcec; --t3:#a2b2cc;
      --bg1:#3b5079; --bg2:#3b5079; --bg3:#48608f;
      --b1:#48608f;  --b2:#5a7099;
      --acc:#ffffff; --accL:rgba(255,255,255,.16);
    }
    [data-palette="material"] #topbar .btn{
      background:rgba(255,255,255,.10);border-color:rgba(255,255,255,.28);color:#e8eefa;box-shadow:none}
    [data-palette="material"] #topbar .btn:hover:not(:disabled){background:rgba(255,255,255,.20);color:#fff}
    [data-palette="material"] #sidebar{border-right:none;box-shadow:2px 0 8px rgba(20,30,60,.14)}
    [data-palette="material"] .nav-item{
      border-left:none;border-radius:5px;margin:2px 10px;padding:9px 12px;color:var(--t2)}
    [data-palette="material"] .nav-item:hover{background:var(--bg2);color:var(--t1)}
    [data-palette="material"] .nav-item.active{
      background:var(--acc);color:#fff;font-weight:600;box-shadow:0 3px 9px rgba(52,71,103,.40)}
    [data-palette="material"] th{
      background:#eaeef4;border-bottom:1px solid #cfd7e2;color:var(--t2);font-size:10.5px}
    [data-palette="material"] td{border-bottom:1px solid #e3e8ef}
    [data-palette="material"] tr:hover td{background:#e9edf3}
    [data-palette="material"] tfoot td{background:#e6eaf1}
    [data-palette="material"] .inp{
      background:#fdfdfe;border:1px solid #bcc5d2;border-radius:5px;color:var(--t1)}
    [data-palette="material"] .inp:focus{border-color:var(--acc);box-shadow:0 0 0 3px var(--accL)}
    [data-palette="material"] .btn{
      background:#e6eaf1;border:1px solid #b9c2d0;border-radius:5px;color:var(--t2);font-weight:600;
      box-shadow:0 1px 3px rgba(20,30,60,.12)}
    [data-palette="material"] .btn:hover:not(:disabled){background:#d8dee8;color:var(--t1)}
    [data-palette="material"] .btnp{
      border-radius:5px;box-shadow:0 3px 9px rgba(52,71,103,.35)}
    [data-palette="material"] .btnd,
    [data-palette="material"] .btne{border-radius:5px}
    [data-palette="material"] .chip{
      border-radius:5px;background:#dde3ec;border:1px solid #c3ccd9;color:var(--t2);font-weight:500}
    /* insight chips carry their own solid fill (utils.fillChip) — don't
       override the background here, only the corner radius. */
    /* ── Material palette: solid status colours ─────────────────────────
       Each chip/card publishes its own hue as --c and a contrast-checked
       text colour as --fg (see utils.readableOn). Dark themes ignore both and
       keep their original translucent tints; only this palette turns them
       into solid fills. That is why changing the light theme can no longer
       affect the dark one. */
    [data-palette="material"] .insight-chip,
    [data-palette="material"] .status-badge,
    [data-palette="material"] .tier-card,
    [data-palette="material"] .status-card{
      background:var(--c)!important;border-color:var(--c)!important;color:var(--fg)!important;
      box-shadow:0 2px 8px rgba(20,30,60,.20)}
    [data-palette="material"] .insight-chip{opacity:1;font-weight:600}
    /* children follow the contrast colour rather than the hue */
    [data-palette="material"] .tier-card div,
    [data-palette="material"] .tier-card span,
    [data-palette="material"] .status-card div,
    [data-palette="material"] .status-card span,
    [data-palette="material"] .status-badge span{color:var(--fg)!important}
    /* inner pills / dots / bars sit on top of the fill */
    [data-palette="material"] .tier-card .tier-pill{
      background:rgba(255,255,255,.24)!important;border-color:rgba(255,255,255,.42)!important}
    [data-palette="material"] .status-card .sc-dot,
    [data-palette="material"] .status-badge .sb-dot{background:var(--fg)!important;opacity:.85}
    [data-palette="material"] .status-card .sc-bar{background:rgba(255,255,255,.32)!important}
    [data-palette="material"] .status-card .sc-bar>div{background:var(--fg)!important;opacity:.9}
    [data-palette="material"] .tabs{border-bottom:1px solid var(--bg3)}
    [data-palette="material"] .chip{background:var(--bg2);border-color:var(--b2)}

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
      #sidebar.open{transform:translateX(0)}
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
    `}</style>
  );
}