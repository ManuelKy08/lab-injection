// server/index.js — entry Express: mount semua route + serve client build
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const fs = require('node:fs');

const sqlite = require('./db/sqlite');
const mongoDb = require('./db/mongo');

const PORT = process.env.PORT || 8100;
const app = express();

app.use(cors());
app.use(express.json());

// Sinyal lab lokal (bukan menutupi vulnerability — hanya penanda konteks)
app.use('/api', (req, res, next) => {
  res.setHeader('X-Lab-Mode', 'vulnerable');
  next();
});

async function main() {
  // MongoDB: connect hang jika docker tidak jalan — timeout 4s, lanjut tanpa mongo
  let mongo = null;
  try {
    mongo = await mongoDb.connect();
    console.log('[mongo] terhubung ke lab_injection');
  } catch (e) {
    console.warn('[mongo] TIDAK terhubung (jalankan `npm run mongo:up`):', e.message);
  }

  const ctx = { sqlite, mongo };

  const ROUTES = [
    'meta',
    'sqli.vulnerable',
    'sqli.fixed',
    'nosql.vulnerable',
    'nosql.fixed',
  ];
  for (const name of ROUTES) {
    const file = path.join(__dirname, 'routes', name + '.js');
    if (fs.existsSync(file)) {
      require(file)(app, ctx);
      console.log(`[vulnlab] route dimount: ${name}`);
    } else {
      console.warn(`[vulnlab] route BELUM ADA (skip): ${name}.js`);
    }
  }

  const dist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(dist, 'index.html'));
    });
  } else {
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res
        .status(200)
        .set('Content-Type', 'text/html; charset=utf-8')
        .send(
          `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>VulnLab</title></head>` +
            `<body style="background:#07080a;color:#e6edf3;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">` +
            `<div style="text-align:center"><h1 style="color:#55b3ff">VulnLab</h1>` +
            `<p>Frontend sedang dibangun (client build belum ada).</p>` +
            `<p style="color:#8b949e">API sudah aktif di <code>/api/meta/challenges</code></p></div></body></html>`
        );
    });
  }

  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[vulnlab] server berjalan di http://127.0.0.1:${PORT}`);
    console.log(`[vulnlab] API:   http://127.0.0.1:${PORT}/api/meta/challenges`);
  });
}

main();