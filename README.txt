DEEN'S DAILY HUB — Website Files
==================================

FILES:
  index.html   — Main page (links to style.css and app.js)
  admin.html   — Separate admin page (same admin interface)
  style.css    — All styles
  app.js       — All JavaScript + stock data
  combined.html — Single-file version (all-in-one)
  server/      — Express + MongoDB + JWT + Cloudinary API backend

HOW TO HOST:
  Option 1 — Netlify (free, recommended):
    1. Go to netlify.com
    2. Drag the entire deens_hub folder onto the page
    3. Your site goes live instantly at yoursitename.netlify.app

  Option 2 — GitHub Pages (free):
    1. Create a GitHub account at github.com
    2. New repository → name it "deens-hub" → Public
    3. Upload these files: index.html, style.css, app.js
    4. Settings → Pages → Source: main branch → Save
    5. Live at: yourusername.github.io/deens-hub

  Option 3 — Any web hosting (GoDaddy, Hostinger etc.):
    Upload these files to the public_html folder via FTP:
    index.html, style.css, app.js

  Option 4 — Share as single file:
    Use combined.html (no server needed, works offline)

ADMIN PANEL:
  Password: deens2026
  Open admin.html (or use the Admin button on the main page)

STOCK SYNC:
  The website reads from the same browser localStorage as
  deens_daily_hub_v9.html tracking app.
  When you mark items Sold/Lost in the tracking app,
  they automatically disappear from the website.

FACEBOOK PAGE LINK:
  Update https://m.me/your-fb-page in index.html
  with your actual Facebook page URL before going live.

ADMIN FEATURES:
  Photos   — Upload screenshots from megasaversauction.com
  Prices   — Set selling price for each item
  Hot Deals — Feature items with flame badge
  Settings — Change WhatsApp, Facebook, email, password


MERN BACKEND (SERVER)
---------------------

1) Go to server folder:
  cd server

2) Install packages:
  npm install

3) Create .env from .env.example and set values:
  MONGODB_URI=mongodb://localhost:27017/deen-daily-hub
  JWT_SECRET=your_super_secret_jwt_key_change_this
  PORT=5000
  CLOUDINARY_CLOUD_NAME=your_cloud_name
  CLOUDINARY_API_KEY=your_api_key
  CLOUDINARY_API_SECRET=your_api_secret

4) Start API:
  npm run dev

API routes:
  GET    /api/health
  POST   /api/auth/seed-default-admin
  POST   /api/auth/login
  GET    /api/items
  GET    /api/items/all              (auth)
  POST   /api/items/bulk-upsert      (auth)
  PATCH  /api/items/:uid             (auth)
  GET    /api/settings
  PATCH  /api/settings               (auth)
  POST   /api/upload/image           (auth)
