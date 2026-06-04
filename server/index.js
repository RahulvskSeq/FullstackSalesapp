// // import 'express-async-errors';
// // import express from 'express';
// // import mongoose from 'mongoose';
// // import cors from 'cors';
// // import dotenv from 'dotenv';
// // import authRoutes        from './routes/auth.js';
// // import dealerRoutes      from './routes/dealers.js';
// // import noteRoutes        from './routes/notes.js';
// // import outstandingRoutes from './routes/outstanding.js';
// // import settingsRoutes    from './routes/settings.js';
// // import followupRoutes    from './routes/Followups.js';

// // dotenv.config();

// // const app = express();
// // app.use(cors({ origin:'*', credentials:true }));
// // app.use(express.json({ limit:'50mb' }));
// // app.use(express.urlencoded({ extended:true }));

// // app.use('/api/auth',        authRoutes);
// // app.use('/api/dealers',     dealerRoutes);
// // app.use('/api/notes',       noteRoutes);
// // app.use('/api/outstanding', outstandingRoutes);
// // app.use('/api/settings',    settingsRoutes);
// // app.use('/api/followups',   followupRoutes);

// // app.get('/api/health', (_, res) => res.json({ ok:true, time:new Date(), version:'1.0.0' }));

// // app.use((err, req, res, next) => {
// //   console.error('[ERROR]', err.message);
// //   res.status(err.status||500).json({ error: err.message||'Server error' });
// // });

// // const seedUsers = async () => {
// //   try {
// //     const User = mongoose.models.User || (await import('./models/User.js')).default;
// //     const count = await User.countDocuments();
// //     if(count > 0) { console.log(`✅ ${count} users already in DB`); return; }
// //     await User.insertMany([
// //       { id:'admin',   name:'Admin',          pass:'admin123',   role:'admin',    color:'#a78bfa', ini:'AD',
// //         url_outstanding:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyKY3E32V3A_oVe-TLBVFTA_j5-z-mln0hcuUlzt1xM5LAwxpbFY3SoWKrNyKkVKvC0GN_Q6rc2HbP/pub?gid=1616327765&single=true&output=csv' },
// //       { id:'pranav',  name:'Pranav',         pass:'pranav123',  role:'salesman', color:'#818cf8', ini:'PR', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyKY3E32V3A_oVe-TLBVFTA_j5-z-mln0hcuUlzt1xM5LAwxpbFY3SoWKrNyKkVKvC0GN_Q6rc2HbP/pub?gid=851104587&single=true&output=csv' },
// //       { id:'udai',    name:'Udai',           pass:'udai123',    role:'salesman', color:'#34d399', ini:'UD', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkEgs4xb3rmWzUSw1YypzYUOXQepVuesTMv4zzyGaJCK-kVdFyoRfxYscCEjgwUyimECA597zjpcNh/pub?gid=1117248698&single=true&output=csv' },
// //       { id:'ratish',  name:'Ratish',         pass:'ratish123',  role:'salesman', color:'#f472b6', ini:'RT', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAcuIUvU32TMweuzzuxie7N43hLsbsctz73eiFPqMvCwgvWZUnuTJ5HLO_Ht6IEOUFw33QtpbO5625/pub?gid=2061184044&single=true&output=csv' },
// //       { id:'joseph',  name:'Joseph',         pass:'joseph123',  role:'salesman', color:'#fb923c', ini:'JO', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPdOxgt_fUQ7eXZ9Rx1bxwMo1LdOpABwocKjjEsemRA_q3NKJ0V1GkA98Una19va-qjCHRRr6PqW_j/pub?gid=1573089535&single=true&output=csv' },
// //       { id:'senthil', name:'Senthil',        pass:'senthil123', role:'salesman', color:'#fbbf24', ini:'SE', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZqgkcAAtF1wr7dVC0p6NA6cuYGK53dfeq7K5CYKKfvIBoEtF3PtHpS7705YnmrToi67yr_RagoDFz/pub?gid=609757453&single=true&output=csv' },
// //       { id:'sahil',   name:'Sahil',          pass:'sahil123',   role:'salesman', color:'#22d3ee', ini:'SH', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vT4816e-YRK-9smpwxanCzdFlEzijNaPZwQqghwRN-QiyEwtDz1gjJlQB-BIPQ5YGUr9lgNqvmFBBR9/pub?gid=118116669&single=true&output=csv' },
// //       { id:'rakesh',  name:'Rakesh Boriwal', pass:'rakesh123',  role:'salesman', color:'#e879f9', ini:'RB', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTuVT0iA9ca77vbobS4jGbkzbMBeerzXnVNwxiCuSzL7Et_ey89ZPyMiCNKhw84YigvcpkzBT_Que4Z/pub?gid=715703131&single=true&output=csv' },
// //       { id:'shivraj', name:'Shivraj',        pass:'shivraj123', role:'salesman', color:'#f87171', ini:'SJ', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXdjFB7dVJ1M82et4IBZWkmLWUNY6kF4bRS5hmfsxHzR5UB90dxjfzbTRD-61QdrIZ3ustYvZsrpKe/pub?gid=1089882118&single=true&output=csv' },
// //     ]);
// //     console.log('✅ Users seeded');
// //   } catch(e) { console.warn('Seed failed:', e.message); }
// // };

// // mongoose.connect(process.env.MONGO_URI)
// //   .then(async () => {
// //     console.log('✅ MongoDB connected');
// //     await seedUsers();
// //     const PORT = process.env.PORT || 5000;
// //     app.listen(PORT, () => {
// //       console.log(`✅ Server → http://localhost:${PORT}`);
// //       console.log(`   Health  → http://localhost:${PORT}/api/health`);
// //     });
// //   })
// //   .catch(e => { console.error('❌ MongoDB error:', e.message); process.exit(1); });



// import 'express-async-errors';
// import express from 'express';
// import mongoose from 'mongoose';
// import cors from 'cors';
// import dotenv from 'dotenv';
// import authRoutes        from './routes/auth.js';
// import dealerRoutes      from './routes/dealers.js';
// import noteRoutes        from './routes/notes.js';
// import outstandingRoutes from './routes/outstanding.js';
// import settingsRoutes    from './routes/settings.js';
// import followupRoutes    from './routes/Followups.js';

// dotenv.config();

// const app = express();
// app.use(cors({ origin:'*', credentials:true }));
// app.use(express.json({ limit:'50mb' }));
// app.use(express.urlencoded({ extended:true }));

// app.use('/api/auth',        authRoutes);
// app.use('/api/dealers',     dealerRoutes);
// app.use('/api/notes',       noteRoutes);
// app.use('/api/outstanding', outstandingRoutes);
// app.use('/api/settings',    settingsRoutes);
// app.use('/api/followups',   followupRoutes);

// app.get('/api/health', (_, res) => res.json({ ok:true, time:new Date(), version:'1.0.0' }));

// app.use((err, req, res, next) => {
//   console.error('[ERROR]', err.message);
//   res.status(err.status||500).json({ error: err.message||'Server error' });
// });

// const seedUsers = async () => {
//   try {
//     const User = mongoose.models.User || (await import('./models/User.js')).default;
//     const count = await User.countDocuments();
//     if(count > 0) { console.log(`✅ ${count} users already in DB`); return; }
//     await User.insertMany([
//       { id:'admin',   name:'Admin',          pass:'admin123',   role:'admin',    color:'#a78bfa', ini:'AD',
//         url_outstanding:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyKY3E32V3A_oVe-TLBVFTA_j5-z-mln0hcuUlzt1xM5LAwxpbFY3SoWKrNyKkVKvC0GN_Q6rc2HbP/pub?gid=1616327765&single=true&output=csv' },
//       { id:'pranav',  name:'Pranav',         pass:'pranav123',  role:'salesman', color:'#818cf8', ini:'PR', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyKY3E32V3A_oVe-TLBVFTA_j5-z-mln0hcuUlzt1xM5LAwxpbFY3SoWKrNyKkVKvC0GN_Q6rc2HbP/pub?gid=851104587&single=true&output=csv' },
//       { id:'udai',    name:'Udai',           pass:'udai123',    role:'salesman', color:'#34d399', ini:'UD', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkEgs4xb3rmWzUSw1YypzYUOXQepVuesTMv4zzyGaJCK-kVdFyoRfxYscCEjgwUyimECA597zjpcNh/pub?gid=1117248698&single=true&output=csv' },
//       { id:'ratish',  name:'Ratish',         pass:'ratish123',  role:'salesman', color:'#f472b6', ini:'RT', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAcuIUvU32TMweuzzuxie7N43hLsbsctz73eiFPqMvCwgvWZUnuTJ5HLO_Ht6IEOUFw33QtpbO5625/pub?gid=2061184044&single=true&output=csv' },
//       { id:'joseph',  name:'Joseph',         pass:'joseph123',  role:'salesman', color:'#fb923c', ini:'JO', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPdOxgt_fUQ7eXZ9Rx1bxwMo1LdOpABwocKjjEsemRA_q3NKJ0V1GkA98Una19va-qjCHRRr6PqW_j/pub?gid=1573089535&single=true&output=csv' },
//       { id:'senthil', name:'Senthil',        pass:'senthil123', role:'salesman', color:'#fbbf24', ini:'SE', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZqgkcAAtF1wr7dVC0p6NA6cuYGK53dfeq7K5CYKKfvIBoEtF3PtHpS7705YnmrToi67yr_RagoDFz/pub?gid=609757453&single=true&output=csv' },
//       { id:'sahil',   name:'Sahil',          pass:'sahil123',   role:'salesman', color:'#22d3ee', ini:'SH', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vT4816e-YRK-9smpwxanCzdFlEzijNaPZwQqghwRN-QiyEwtDz1gjJlQB-BIPQ5YGUr9lgNqvmFBBR9/pub?gid=118116669&single=true&output=csv' },
//       { id:'rakesh',  name:'Rakesh Boriwal', pass:'rakesh123',  role:'salesman', color:'#e879f9', ini:'RB', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTuVT0iA9ca77vbobS4jGbkzbMBeerzXnVNwxiCuSzL7Et_ey89ZPyMiCNKhw84YigvcpkzBT_Que4Z/pub?gid=715703131&single=true&output=csv' },
//       { id:'shivraj', name:'Shivraj',        pass:'shivraj123', role:'salesman', color:'#f87171', ini:'SJ', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXdjFB7dVJ1M82et4IBZWkmLWUNY6kF4bRS5hmfsxHzR5UB90dxjfzbTRD-61QdrIZ3ustYvZsrpKe/pub?gid=1089882118&single=true&output=csv' },
//     ]);
//     console.log('✅ Users seeded');
//   } catch(e) { console.warn('Seed failed:', e.message); }
// };

// mongoose.connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log('✅ MongoDB connected');
//     await seedUsers();
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//       console.log(`✅ Server → http://localhost:${PORT}`);
//       console.log(`   Health  → http://localhost:${PORT}/api/health`);

//       // Keep server alive on Railway (prevents sleep)
//       if(process.env.RAILWAY_PUBLIC_DOMAIN) {
//         const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/health`;
//         setInterval(async () => {
//           try { await fetch(url); console.log('[Keep-alive] ping sent'); }
//           catch(e) { console.warn('[Keep-alive] ping failed:', e.message); }
//         }, 4 * 60 * 1000); // every 4 minutes
//         console.log(`[Keep-alive] started → ${url}`);
//       }
//     });
//   })
//   .catch(e => { console.error('❌ MongoDB error:', e.message); process.exit(1); });



// sample confriguration

import 'express-async-errors';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes        from './routes/auth.js';
import dealerRoutes      from './routes/dealers.js';
import noteRoutes        from './routes/notes.js';
import outstandingRoutes from './routes/outstanding.js';
import settingsRoutes    from './routes/settings.js';
import followupRoutes    from './routes/Followups.js';
import sampleRoutes      from './routes/samples.js';
import crmRoutes         from './routes/crm.js';

dotenv.config();

const app = express();
// CORS: echo the request Origin instead of returning '*'. The browser/WebView
// spec rejects `Access-Control-Allow-Origin: *` together with
// `Access-Control-Allow-Credentials: true`, which causes the Capacitor APK to
// throw "Failed to fetch" even though the URL is reachable. Echoing the
// actual origin (capacitor://localhost, https://localhost, https://vercel.app,
// etc.) keeps credentials usable AND works on every client.
app.use(cors({
  origin: (origin, cb) => cb(null, origin || true), // reflect or allow non-browser callers
  credentials: true,
}));
app.use(express.json({ limit:'50mb' }));
app.use(express.urlencoded({ extended:true }));

app.use('/api/auth',        authRoutes);
app.use('/api/dealers',     dealerRoutes);
app.use('/api/notes',       noteRoutes);
app.use('/api/outstanding', outstandingRoutes);
app.use('/api/settings',    settingsRoutes);
app.use('/api/followups',   followupRoutes);
app.use('/api/samples',     sampleRoutes);
app.use('/api/crm',         crmRoutes);

app.get('/api/health', (_, res) => res.json({ ok:true, time:new Date(), version:'1.0.0' }));

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status||500).json({ error: err.message||'Server error' });
});

// Always ensure there is at least one superadmin in the DB. If the DB is
// fresh, we insert the full seed list (including 'super'). If the DB already
// has users (from earlier runs) but no superadmin, we upsert 'super' so the
// user always has a way to access the Login-as feature.
const ensureSuperAdmin = async (User) => {
  try {
    const existing = await User.findOne({ role: 'superadmin' });
    if(existing) {
      console.log(`✅ Superadmin already exists: ${existing.id}`);
      return;
    }
    // Promote built-in 'admin' to superadmin if present (preserves their pass).
    const admin = await User.findOne({ id: 'admin' });
    if(admin) {
      admin.role = 'superadmin';
      await admin.save();
      console.log(`✅ Promoted built-in 'admin' to superadmin (pass unchanged)`);
      return;
    }
    // Otherwise create a fresh 'super' account.
    await User.create({
      id:'super', name:'Super Admin', pass:'super123',
      role:'superadmin', color:'#fbbf24', ini:'SA',
    });
    console.log(`✅ Created default superadmin → id: 'super', pass: 'super123' (change after first login!)`);
  } catch(e){ console.warn('ensureSuperAdmin failed:', e.message); }
};

const seedUsers = async () => {
  try {
    const User = mongoose.models.User || (await import('./models/User.js')).default;
    const count = await User.countDocuments();
    if(count > 0) {
      console.log(`✅ ${count} users already in DB`);
      // Even for an existing DB, make sure a superadmin exists.
      await ensureSuperAdmin(User);
      return;
    }
    await User.insertMany([
      { id:'super',   name:'Super Admin',    pass:'super123',   role:'superadmin', color:'#fbbf24', ini:'SA' },
      { id:'admin',   name:'Admin',          pass:'admin123',   role:'admin',    color:'#a78bfa', ini:'AD',
        url_outstanding:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyKY3E32V3A_oVe-TLBVFTA_j5-z-mln0hcuUlzt1xM5LAwxpbFY3SoWKrNyKkVKvC0GN_Q6rc2HbP/pub?gid=1616327765&single=true&output=csv' },
      { id:'pranav',  name:'Pranav',         pass:'pranav123',  role:'salesman', color:'#818cf8', ini:'PR', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSyKY3E32V3A_oVe-TLBVFTA_j5-z-mln0hcuUlzt1xM5LAwxpbFY3SoWKrNyKkVKvC0GN_Q6rc2HbP/pub?gid=851104587&single=true&output=csv' },
      { id:'udai',    name:'Udai',           pass:'udai123',    role:'salesman', color:'#34d399', ini:'UD', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vSkEgs4xb3rmWzUSw1YypzYUOXQepVuesTMv4zzyGaJCK-kVdFyoRfxYscCEjgwUyimECA597zjpcNh/pub?gid=1117248698&single=true&output=csv' },
      { id:'ratish',  name:'Ratish',         pass:'ratish123',  role:'salesman', color:'#f472b6', ini:'RT', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTAcuIUvU32TMweuzzuxie7N43hLsbsctz73eiFPqMvCwgvWZUnuTJ5HLO_Ht6IEOUFw33QtpbO5625/pub?gid=2061184044&single=true&output=csv' },
      { id:'joseph',  name:'Joseph',         pass:'joseph123',  role:'salesman', color:'#fb923c', ini:'JO', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPdOxgt_fUQ7eXZ9Rx1bxwMo1LdOpABwocKjjEsemRA_q3NKJ0V1GkA98Una19va-qjCHRRr6PqW_j/pub?gid=1573089535&single=true&output=csv' },
      { id:'senthil', name:'Senthil',        pass:'senthil123', role:'salesman', color:'#fbbf24', ini:'SE', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZqgkcAAtF1wr7dVC0p6NA6cuYGK53dfeq7K5CYKKfvIBoEtF3PtHpS7705YnmrToi67yr_RagoDFz/pub?gid=609757453&single=true&output=csv' },
      { id:'sahil',   name:'Sahil',          pass:'sahil123',   role:'salesman', color:'#22d3ee', ini:'SH', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vT4816e-YRK-9smpwxanCzdFlEzijNaPZwQqghwRN-QiyEwtDz1gjJlQB-BIPQ5YGUr9lgNqvmFBBR9/pub?gid=118116669&single=true&output=csv' },
      { id:'rakesh',  name:'Rakesh Boriwal', pass:'rakesh123',  role:'salesman', color:'#e879f9', ini:'RB', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vTuVT0iA9ca77vbobS4jGbkzbMBeerzXnVNwxiCuSzL7Et_ey89ZPyMiCNKhw84YigvcpkzBT_Que4Z/pub?gid=715703131&single=true&output=csv' },
      { id:'shivraj', name:'Shivraj',        pass:'shivraj123', role:'salesman', color:'#f87171', ini:'SJ', url:'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXdjFB7dVJ1M82et4IBZWkmLWUNY6kF4bRS5hmfsxHzR5UB90dxjfzbTRD-61QdrIZ3ustYvZsrpKe/pub?gid=1089882118&single=true&output=csv' },
    ]);
    console.log('✅ Users seeded');
  } catch(e) { console.warn('Seed failed:', e.message); }
};

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    await seedUsers();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server → http://localhost:${PORT}`);
      console.log(`   Health  → http://localhost:${PORT}/api/health`);

      // Keep server alive on Railway (prevents sleep)
      if(process.env.RAILWAY_PUBLIC_DOMAIN) {
        const url = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api/health`;
        setInterval(async () => {
          try { await fetch(url); console.log('[Keep-alive] ping sent'); }
          catch(e) { console.warn('[Keep-alive] ping failed:', e.message); }
        }, 4 * 60 * 1000); // every 4 minutes
        console.log(`[Keep-alive] started → ${url}`);
      }
    });
  })
  .catch(e => { console.error('❌ MongoDB error:', e.message); process.exit(1); });