# Sales Tracker Pro — Complete MERN Stack

## What's Inside
```
SalesTrackerComplete/
├── server/                  ← Node.js + Express + MongoDB
│   ├── index.js             ← Main server entry
│   ├── .env                 ← Config (edit this)
│   ├── models/
│   │   ├── User.js          ← User schema
│   │   ├── Dealer.js        ← Dealer + monthly data schema
│   │   ├── Note.js          ← Notes & followups schema
│   │   └── Outstanding.js   ← Outstanding payments schema
│   ├── routes/
│   │   ├── auth.js          ← Login, user CRUD
│   │   ├── dealers.js       ← Dealer CRUD + Excel upload
│   │   ├── notes.js         ← Notes CRUD
│   │   └── outstanding.js   ← Outstanding CRUD + Excel upload
│   └── middleware/
│       └── auth.js          ← JWT protection + role check
│
├── client/                  ← React frontend
│   ├── src/
│   │   ├── api.js           ← API service (talks to server)
│   │   ├── App.jsx          ← Main app
│   │   └── components/
│   │       ├── UploadMonth.jsx    ← Upload Excel per month
│   │       └── ... all existing components unchanged
│   └── .env                 ← Set API URL here
│
└── SalesTracker_Templates.xlsx  ← Excel templates (3 sheets)
```

---

## ROLE-BASED ACCESS

| Feature | Admin | Salesman |
|---|---|---|
| See all dealers | ✅ | ❌ (own only) |
| Upload for any salesman | ✅ | ❌ (self only) |
| Delete dealers | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| Upload outstanding | ✅ | ❌ |
| See own dealers | ✅ | ✅ |
| Add notes/followups | ✅ | ✅ |
| Upload own month data | ✅ | ✅ |
| Change own password | ✅ | ✅ |

---

## STEP 1 — Install MongoDB

### Free Local Install
1. Download: https://www.mongodb.com/try/download/community
2. Install and run MongoDB
3. Default URI: `mongodb://localhost:27017/salestracker`

### Free Cloud (MongoDB Atlas)
1. Go to: https://cloud.mongodb.com
2. Create account → Create FREE cluster (512MB)
3. Add Database User (username + password)
4. Network Access → Allow from anywhere (0.0.0.0/0)
5. Connect → Copy connection string:
   `mongodb+srv://username:password@cluster.mongodb.net/salestracker`

---

## STEP 2 — Setup & Run Server

```bash
cd server
npm install
```

Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/salestracker
JWT_SECRET=make_this_long_and_random_eg_abc123xyz789
PORT=5000
```

Run:
```bash
npm run dev
```

First start output:
```
✅ MongoDB connected
✅ 9 default users seeded
✅ Server → http://localhost:5000
```

---

## STEP 3 — Setup & Run Client

```bash
cd client
npm install
```

Create `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Run:
```bash
npm run dev
```

Open: http://localhost:5173

---

## STEP 4 — First Login & Data Import

1. Login: **admin / admin123**
2. Click **Sync** button → loads all Google Sheets data into MongoDB
3. Topbar shows **🗄 DB** badge = running from database
4. Data is now permanent — no Google Sheets needed

---

## MONTHLY WORKFLOW (No Google Sheets needed)

### Salesman workflow:
1. End of month → fill `SalesTracker_Templates.xlsx` (Sheet 2: Sales Upload)
2. Login → **Upload Data** → Select month (e.g. Jun-26) → Upload file
3. Done — data saved to MongoDB permanently

### Admin workflow:
1. See combined data from all salesmen
2. Update outstanding payments: **Upload Data** → outstanding or
   outstanding **Upload Outstanding** button in outstanding section
3. Old months never deleted — view any month anytime

---

## DEPLOY TO PRODUCTION (Live on Internet)

### Option A: Railway + Vercel (Recommended, Free)

**Backend (Railway):**
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Add your server folder
3. Set environment variables:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = random secret
   - `PORT` = 5000
4. Railway gives you URL like: `https://yourapp.railway.app`

**Frontend (Vercel):**
1. Go to https://vercel.com → New Project → Import from GitHub
2. Set build settings: Root = `client`, Build = `npm run build`, Output = `dist`
3. Add environment variable: `VITE_API_URL=https://yourapp.railway.app/api`
4. Deploy → get URL like: `https://yourapp.vercel.app`

### Option B: Render (Free, simpler)
1. https://render.com → New Web Service → connect GitHub
2. Build: `npm install` → Start: `node index.js`
3. Add env vars, deploy

### Option C: VPS (DigitalOcean/AWS)
```bash
# On server:
git clone your-repo
cd server && npm install
pm2 start index.js --name sales-server
# Setup nginx to proxy :5000
```

---

## API REFERENCE

```
# Health
GET  /api/health

# Auth
POST /api/auth/login                → { token, user }
GET  /api/auth/users                → { id: { ...user } }
PUT  /api/auth/users/:id            → updated user (admin or self)
POST /api/auth/users                → new user (admin only)
DELETE /api/auth/users/:id          → delete user (admin only)
POST /api/auth/change-password      → change own password

# Dealers
GET  /api/dealers?mo=Jul-25,Aug-25  → dealers array
GET  /api/dealers/:id               → single dealer
POST /api/dealers                   → create dealer
PUT  /api/dealers/:id               → update dealer
DELETE /api/dealers/:id             → delete dealer (admin only)
POST /api/dealers/upload            → upload Excel for a month
POST /api/dealers/sync-db           → sync sheet data → DB (admin)

# Notes
GET  /api/notes                     → notes array
POST /api/notes                     → add note
PUT  /api/notes/:id                 → update note
DELETE /api/notes/:id               → delete note

# Outstanding
GET  /api/outstanding               → all outstanding records
POST /api/outstanding/upload        → upload outstanding Excel (admin)
PUT  /api/outstanding/:dealerName   → update one dealer one month (admin)
DELETE /api/outstanding/:id         → delete record (admin)
```

---

## TEMPLATES (SalesTracker_Templates.xlsx)

**Sheet 1: Outstanding**
| Dealer Name | Jul-25 | Aug-25 | ... | May-26 |
|---|---|---|---|---|
| AADINATH PLYWOOD | 36000 | 100625 | ... | 80000 |

**Sheet 2: Sales Upload** (one per salesman per month)
| Dealer Name | City | State | Zone | Status | Target | Achieved | Category | Sub Cat | Cr Days | Cr Limit |
|---|---|---|---|---|---|---|---|---|---|---|
| AADINATH PLYWOOD | Hyderabad | Telangana | ZONE 1 | STAR | 500 | 320 | LAMINATE | 1 MM | 45 | 300000 |

**Sheet 3: Instructions** — detailed how-to inside Excel

---

## CREDENTIALS (change after first login!)

| User | Password | Role |
|---|---|---|
| admin | admin123 | Admin |
| pranav | pranav123 | Salesman |
| udai | udai123 | Salesman |
| ratish | ratish123 | Salesman |
| joseph | joseph123 | Salesman |
| senthil | senthil123 | Salesman |
| sahil | sahil123 | Salesman |
| rakesh | rakesh123 | Salesman |
| shivraj | shivraj123 | Salesman |

