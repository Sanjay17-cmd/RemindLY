# remindly

A minimal, zero-cost cross-device reminder & to-do manager.

- **Website / PWA** — works on any browser, installable on Android & Windows
- **Syncs via GitHub Gist** — free, permanent, no backend needed
- **Rainmeter widget** — wallpaper overlay on Windows
- **KWGT widget** — Android home screen widget

---

## File structure

```
remindly/
├── index.html          ← Main app (PWA)
├── app.js              ← All JS logic + Gist sync
├── manifest.json       ← PWA manifest
├── sw.js               ← Service worker (offline support)
├── icons/
│   ├── icon-192.png    ← App icon (create using tool below)
│   └── icon-512.png    ← App icon large
├── Remindly.ini        ← Rainmeter skin
├── kwgt-formulas.txt   ← KWGT Android widget formulas
└── .github/
    └── workflows/
        └── deploy.yml  ← Auto-deploy to GitHub Pages
```

---

## Setup (15 minutes total)

### Step 1 — Create icons (2 min)
Go to https://favicon.io/favicon-generator/ and generate icons.
Download and place `icon-192.png` and `icon-512.png` in the `icons/` folder.

### Step 2 — Push to GitHub (3 min)
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/Sanjay17-cmd/RemindLY.git
git push -u origin main
```

### Step 3 — Enable GitHub Pages (2 min)
1. Go to your repo → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Wait ~1 minute → your app is live at:
   `https://Sanjay17-cmd.github.io/RemindLY/`

### Step 4 — Create GitHub Token (3 min)
1. Go to https://github.com/settings/tokens/new
2. Note: `Remindly sync`
3. Expiration: `No expiration`
4. Scope: check **gist** only
5. Click **Generate token** — copy it immediately!

### Step 5 — Connect in the app (1 min)
1. Open your app URL
2. Paste your token in the setup banner
3. A private Gist named `remindly.json` is created automatically
4. ✅ Now syncs across all devices!

---

## Android Widget (KWGT)

1. Install **KWGT** from Play Store (free version works)
2. Long-press home screen → Widgets → KWGT
3. Tap the widget to edit
4. Create a Stack layer with text layers
5. See `kwgt-formulas.txt` for exact formulas
6. Set tap action: open `https://YOUR_USERNAME.github.io/remindly/`

---

## Windows Rainmeter Widget

1. Install Rainmeter from https://www.rainmeter.net/
2. Copy `Remindly.ini` to:
   `C:\Users\YOU\Documents\Rainmeter\Skins\Remindly\Remindly.ini`
3. Open `Remindly.ini` and edit:
   ```ini
   GistID=your_gist_id_here
   Token=your_github_token_here
   ```
4. Find your Gist ID: open the app → Settings → copy Gist ID
5. Right-click Rainmeter tray icon → Skins → Remindly → Load
6. Position anywhere on your desktop

---

## Install as app (PWA)

**Android Chrome:**
Three-dot menu → "Add to Home screen"

**Windows Chrome:**
Address bar → install icon → Install

**iOS Safari:**
Share button → "Add to Home Screen"

---

## Tech stack

| Layer | Tech | Cost |
|-------|------|------|
| Database | GitHub Gist | Free forever |
| Hosting | GitHub Pages | Free forever |
| Android widget | KWGT | Free |
| Desktop widget | Rainmeter | Free |
| Offline | Service Worker | Built-in |
