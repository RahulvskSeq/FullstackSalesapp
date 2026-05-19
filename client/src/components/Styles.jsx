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
    @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
    @keyframes popIn{0%{opacity:0;transform:scale(.94)}100%{opacity:1;transform:scale(1)}}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    .fade{animation:fadeIn .25s ease}
    .spin{animation:spin .7s linear infinite}

    /* ── Layout ── */
    #app{display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden}

    #topbar{
      height:50px;min-height:50px;background:var(--bg1);border-bottom:1px solid var(--b1);
      display:flex;align-items:center;padding:0 10px;gap:8px;flex-shrink:0;z-index:1200;
      overflow:hidden;
    }
    #topbar .territory-bar{
      display:flex;align-items:center;gap:10px;padding:3px 10px;
      background:var(--bg2);border-radius:7px;border:1px solid var(--b2);
      font-size:11px;flex-shrink:0;
    }

    #body{display:flex;flex:1;overflow:hidden;position:relative}

    #sidebar{
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

    #main{flex:1;overflow-y:auto;overflow-x:hidden;padding:18px;min-width:0}

    /* ── Nav ── */
    .nav-item{padding:9px 14px;font-size:13px;cursor:pointer;color:var(--t3);border-left:2px solid transparent;display:flex;align-items:center;gap:9px;transition:all .15s;user-select:none;white-space:nowrap}
    .nav-item:hover{color:var(--t2);background:rgba(255,255,255,.03)}
    .nav-item.active{color:var(--acc);border-left-color:var(--acc);background:var(--accL)}
    .nav-sec{padding:14px 14px 6px;font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:.15em}

    /* ── Cards ── */
    .card{background:var(--bg1);border:1px solid var(--b1);border-radius:12px;padding:16px 18px}
    .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
    .stat-card{background:var(--bg1);border:1px solid var(--b1);border-radius:10px;padding:12px 14px;transition:transform .15s,box-shadow .15s}
    .stat-card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.3)}
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
    .insight-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:14px;font-size:12px;font-weight:500;border:1px solid currentColor;opacity:.9}
    .skel{background:linear-gradient(90deg,var(--bg2) 0%,var(--bg3) 50%,var(--bg2) 100%);background-size:200% 100%;animation:shimmer 1.4s ease-in-out infinite;border-radius:6px;display:block}

    /* ── Topbar responsive helpers ── */
    .hide-sm{display:flex}
    .territory-bar{display:flex}
    .topbar-brand{}

    /* ── RESPONSIVE ── */

    /* Tablet: 768px and below */
    @media(max-width:768px){
      #topbar{padding:0 8px;gap:6px;height:48px;min-height:48px}
      #topbar .territory-bar{display:none !important}
      .hide-sm{display:none !important}
      .topbar-brand{display:none !important}
      #sidebar{
        position:fixed;left:0;top:48px;bottom:0;
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
      .hmob{display:none}
      .modal{padding:16px;border-radius:12px}
      table{font-size:12px}
      th,td{padding:6px 8px}
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
    `}</style>
  );
}