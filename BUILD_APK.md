# How to build the Android APK

You'll end up with an `.apk` file you can share via WhatsApp / email. Anyone can install it on their Android phone (enable "Install from unknown sources" in Android settings).

This guide uses GitHub Actions to do the actual building — you don't need to install Android Studio on your Mac.

---

## One-time setup (~15 minutes)

### 1. Finish the Android folder on your Mac

I created `client/android/` in the sandbox but a couple of files need a clean re-sync on your machine. Run this once:

```bash
cd "/Users/rahulvsk/Desktop/Claude Software/fixed_project/client"
rm -rf node_modules
npm install
rm -rf android/app/src/main/java/com/getcapacitor      # leftover placeholder
npx cap sync android
```

That installs the right macOS binaries for your dev machine and cleans up the placeholder Java file.

### 2. Deploy your backend (server) so the APK can reach it

Right now the server runs on `http://localhost:5000` — that's only your laptop. The APK won't reach it from a phone.

Pick one of these free options:

**Option A — Render (easiest, free):**
1. Go to https://render.com → sign up
2. Click **New → Web Service**
3. Connect your GitHub account (or upload your `server/` folder as zip)
4. Build command: `npm install`
5. Start command: `node index.js`
6. Add environment variables (from your `server/.env`): `MONGO_URI`, `JWT_SECRET`, `PORT=10000`
7. Deploy → you get a URL like `https://sales-tracker-server.onrender.com`

**Option B — Railway:**
Similar process at https://railway.app

Once deployed, your API URL will be something like `https://sales-tracker-server.onrender.com/api` — note this down.

### 3. Push your project to GitHub (private repo is fine)

If you don't have a GitHub account yet:
1. Go to https://github.com → sign up
2. Create a **new private repository** named `sales-tracker-pro`
3. Don't initialize with README/license (we already have files)

Then on your Mac:

```bash
cd "/Users/rahulvsk/Desktop/Claude Software/fixed_project"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sales-tracker-pro.git
git push -u origin main
```

GitHub will ask for credentials — use a Personal Access Token (Settings → Developer settings → Personal access tokens → create one with `repo` scope).

### 4. Tell GitHub Actions your API URL

In your GitHub repo on the website:
1. Go to **Settings** (top right of the repo page) → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `VITE_API_URL`
4. Value: `https://sales-tracker-server.onrender.com/api` (your real URL from step 2)
5. Save

### 5. Trigger the first build

In your GitHub repo:
1. Click the **Actions** tab
2. Click **Build Android APK** in the left sidebar
3. Click **Run workflow** → **Run workflow** (green button)
4. Wait ~5 minutes — you'll see a green checkmark when done

---

## Get the APK

After a successful build:
1. Click the completed run
2. Scroll down to **Artifacts**
3. Download `sales-tracker-pro-debug.apk`
4. Unzip → you get `app-debug.apk`

That's the file you share with your salesmen.

---

## Install on an Android phone

1. Send the `.apk` file via WhatsApp / Telegram / email to the phone
2. Open the file on the phone
3. Android will warn "Install from unknown sources" — go to **Settings → Security → enable** that option (or the prompt that appears)
4. Tap **Install**
5. App appears on home screen as **Sales Tracker Pro**

First time opening the app, on the login screen there's a small **⚙ Change** button under "Server:". Tap it if the URL needs changing. Default uses what you set in step 4.

---

## When you update the code later

1. Make changes on your Mac
2. `git add . && git commit -m "what changed" && git push`
3. GitHub Actions auto-builds a new APK
4. Download from the Actions tab → distribute to salesmen

For each new APK, salesmen just install the new file over the old one. Their login + data stays.

---

## If you ever need a "release" (signed) APK for Play Store

The current setup builds a **debug** APK — perfect for sideloading and internal distribution. For the Play Store you'd need to sign it with a release keystore. Let me know when you want that and I'll add the signing step.

---

## Quick FAQ

**Q: Do salesmen need GitHub access?**
A: No. Only you (the developer) push code. Salesmen just install the APK file.

**Q: Will updates push automatically?**
A: No. Each APK update needs to be re-installed manually. For auto-update, look into Capacitor's Live Updates feature (paid).

**Q: What if a salesman has an iPhone?**
A: The same code can build an iPhone version but iPhones need an Apple Developer account ($99/year) and either TestFlight or App Store distribution. Tell me if you need this — it's a separate setup.

**Q: My backend is on localhost — can I test the APK on my home WiFi?**
A: Yes. Find your computer's local IP (`ifconfig | grep inet` on Mac, looks like `192.168.x.x`). Set VITE_API_URL to `http://192.168.x.x:5000/api`. Phone on same WiFi can connect. But this only works at home / office — won't work on cellular data or other WiFi.

**Q: Can I change the API URL without rebuilding the APK?**
A: Yes. On the login screen tap **⚙ Change** under "Server:". Inside the app, top bar has a gear icon. Enter the new URL, tap **Save & reload**.
