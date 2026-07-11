// export const DEFAULT_USERS = {
//   admin:  { id:'admin',  name:'Admin',          pass:'admin123',  role:'admin',    color:'#a78bfa', ini:'AD', url:null },
//   pranav: { id:'pranav', name:'Pranav',          pass:'pranav123', role:'salesman', color:'#818cf8', ini:'PR', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyKY3E32V3A_oVe-TLBVFTA_j5-z-mln0hcuUlzt1xM5LAwxpbFY3SoWKrNyKkVKvC0GN_Q6rc2HbP/pub?gid=851104587&single=true&output=csv' },
//   udai:   { id:'udai',   name:'Udai',            pass:'udai123',   role:'salesman', color:'#34d399', ini:'UD', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkEgs4xb3rmWzUSw1YypzYUOXQepVuesTMv4zzyGaJCK-kVdFyoRfxYscCEjgwUyimECA597zjpcNh/pub?gid=1117248698&single=true&output=csv' },
//   ratish: { id:'ratish', name:'Ratish',          pass:'ratish123', role:'salesman', color:'#f472b6', ini:'RT', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAcuIUvU32TMweuzzuxie7N43hLsbsctz73eiFPqMvCwgvWZUnuTJ5HLO_Ht6IEOUFw33QtpbO5625/pub?gid=2061184044&single=true&output=csv'},
//   joseph: { id:'joseph', name:'Joseph',          pass:'joseph123', role:'salesman', color:'#fb923c', ini:'JO', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPdOxgt_fUQ7eXZ9Rx1bxwMo1LdOpABwocKjjEsemRA_q3NKJ0V1GkA98Una19va-qjCHRRr6PqW_j/pub?gid=1573089535&single=true&output=csv' },
//   senthil:{ id:'senthil',name:'Senthil',         pass:'senthil123',role:'salesman', color:'#fbbf24', ini:'SE', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZqgkcAAtF1wr7dVC0p6NA6cuYGK53dfeq7K5CYKKfvIBoEtF3PtHpS7705YnmrToi67yr_RagoDFz/pub?gid=609757453&single=true&output=csv' },
//   sahil:  { id:'sahil',  name:'Sahil',           pass:'sahil123',  role:'salesman', color:'#22d3ee', ini:'SH', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vT4816e-YRK-9smpwxanCzdFlEzijNaPZwQqghwRN-QiyEwtDz1gjJlQB-BIPQ5YGUr9lgNqvmFBBR9/pub?gid=118116669&single=true&output=csv' },
//   rakesh: { id:'rakesh', name:'Rakesh Boriwal',  pass:'rakesh123', role:'salesman', color:'#e879f9', ini:'RB', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTuVT0iA9ca77vbobS4jGbkzbMBeerzXnVNwxiCuSzL7Et_ey89ZPyMiCNKhw84YigvcpkzBT_Que4Z/pub?gid=715703131&single=true&output=csv' },
//   shivraj:{ id:'shivraj',name:'Shivraj',         pass:'shivraj123',role:'salesman', color:'#f87171', ini:'SJ', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXdjFB7dVJ1M82et4IBZWkmLWUNY6kF4bRS5hmfsxHzR5UB90dxjfzbTRD-61QdrIZ3ustYvZsrpKe/pub?gid=1089882118&single=true&output=csv' },
// };
// export const MO = ['Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26'];
// export const CURRENT_MONTH_IDX = 10;
// export const CURRENT_MONTH_LABEL = 'May 2026';
// export const CURRENT_MONTH_SHORT = 'May';


export const DEFAULT_USERS = {
  admin:   { id:'admin',   name:'Admin',          pass:'admin123',   role:'admin',    color:'#a78bfa', ini:'AD', url:null,
    // ↓ PUT YOUR OUTSTANDING SHEET CSV URL HERE (one sheet covers all  dealers )
    url_outstanding: ''
  },
  pranav:  { id:'pranav',  name:'Pranav',          pass:'pranav123',  role:'salesman', color:'#818cf8', ini:'PR', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyKY3E32V3A_oVe-TLBVFTA_j5-z-mln0hcuUlzt1xM5LAwxpbFY3SoWKrNyKkVKvC0GN_Q6rc2HbP/pub?gid=851104587&single=true&output=csv', url_outstanding:null },
  udai:    { id:'udai',    name:'Udai',            pass:'udai123',    role:'salesman', color:'#34d399', ini:'UD', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkEgs4xb3rmWzUSw1YypzYUOXQepVuesTMv4zzyGaJCK-kVdFyoRfxYscCEjgwUyimECA597zjpcNh/pub?gid=1117248698&single=true&output=csv', url_outstanding:null },
  ratish:  { id:'ratish',  name:'Ratish',          pass:'ratish123',  role:'salesman', color:'#f472b6', ini:'RT', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAcuIUvU32TMweuzzuxie7N43hLsbsctz73eiFPqMvCwgvWZUnuTJ5HLO_Ht6IEOUFw33QtpbO5625/pub?gid=2061184044&single=true&output=csv', url_outstanding:null },
  joseph:  { id:'joseph',  name:'Joseph',          pass:'joseph123',  role:'salesman', color:'#fb923c', ini:'JO', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPdOxgt_fUQ7eXZ9Rx1bxwMo1LdOpABwocKjjEsemRA_q3NKJ0V1GkA98Una19va-qjCHRRr6PqW_j/pub?gid=1573089535&single=true&output=csv', url_outstanding:null },
  senthil: { id:'senthil', name:'Senthil',         pass:'senthil123', role:'salesman', color:'#fbbf24', ini:'SE', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZqgkcAAtF1wr7dVC0p6NA6cuYGK53dfeq7K5CYKKfvIBoEtF3PtHpS7705YnmrToi67yr_RagoDFz/pub?gid=609757453&single=true&output=csv', url_outstanding:null },
  sahil:   { id:'sahil',   name:'Sahil',           pass:'sahil123',   role:'salesman', color:'#22d3ee', ini:'SH', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vT4816e-YRK-9smpwxanCzdFlEzijNaPZwQqghwRN-QiyEwtDz1gjJlQB-BIPQ5YGUr9lgNqvmFBBR9/pub?gid=118116669&single=true&output=csv', url_outstanding:null },
  rakesh:  { id:'rakesh',  name:'Rakesh Boriwal',  pass:'rakesh123',  role:'salesman', color:'#e879f9', ini:'RB', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTuVT0iA9ca77vbobS4jGbkzbMBeerzXnVNwxiCuSzL7Et_ey89ZPyMiCNKhw84YigvcpkzBT_Que4Z/pub?gid=715703131&single=true&output=csv', url_outstanding:null },
  shivraj: { id:'shivraj', name:'Shivraj',         pass:'shivraj123', role:'salesman', color:'#f87171', ini:'SJ', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSZD8gszL0SwR1Pz0lMBRrrNRsSWI_WBTFJP7uTkniFJYXKBkmXjVJs-29ejLuPxkwPT21FWgl2pJu8/pub?gid=1089882118&single=true&output=csv', url_outstanding:null },
};

export const MO = ['Jul-25','Aug-25','Sep-25','Oct-25','Nov-25','Dec-25','Jan-26','Feb-26','Mar-26','Apr-26','May-26'];
export const CURRENT_MONTH_IDX   = 10;
export const CURRENT_MONTH_LABEL = 'May 2026';
export const CURRENT_MONTH_SHORT = 'May';

// Dealer commercial classification (editable by salesperson).
export const DEALER_TYPES = ['None', 'Regular Dealer', 'Premium Dealer', 'OEM/SEMI OEM', 'ENTERPRISE'];

// ── Left-navigation pages a superadmin can grant per user ─────────────────
// Ids MUST match the sidebar nav ids in App.jsx. When a user's
// permissions.pages is non-empty, they see ONLY these pages.
export const NAV_PAGES = [
  { id:'overview',    label:'Overview' },
  { id:'dealers',     label:'All Dealers' },
  { id:'monthly',     label:'Monthly Trend' },
  { id:'compare',     label:'Compare' },
  { id:'map',         label:'Map View' },
  { id:'outstanding', label:'Outstanding' },
  { id:'salesCat',    label:'Sales by Category' },
  { id:'upload',      label:'Upload Data' },
  { id:'entry',       label:'Monthly Entry' },
  { id:'months',      label:'Manage Months' },
  { id:'followups',   label:'Follow-ups' },
  { id:'attendance',  label:'Attendance' },
  { id:'visits',      label:'Visits (CRM)' },
  { id:'leads',       label:'Leads (CRM)' },
  { id:'tasks',       label:'Tasks (CRM)' },
  { id:'leaves',      label:'Leaves' },
  { id:'tickets',     label:'Support' },
  { id:'reports',     label:'Reports' },
  { id:'admin',       label:'Admin Panel' },
];