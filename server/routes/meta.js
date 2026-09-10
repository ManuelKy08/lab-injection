// server/routes/meta.js
// Endpoint metadata challenge + verifikasi secret (bukan flag CTF).
// Setiap challenge dianggap selesai jika user berhasil mengekstrak data
// alami aplikasi yang menjadi target eksploitasi (lihat daftar SECRETS).
module.exports = function (app, ctx) {
  const { sqlite, mongo } = ctx;

  const CHALLENGES = [
    // SQLi
    { id: 'sqli-1', modul: 'SQLi', level: 'Easy', judul: 'Login Bypass', kategori: 'Authentication' },
    { id: 'sqli-2', modul: 'SQLi', level: 'Easy', judul: 'UNION-Based Extraction', kategori: 'Data Extraction' },
    { id: 'sqli-3', modul: 'SQLi', level: 'Medium', judul: 'Blind Boolean', kategori: 'Blind Injection' },
    { id: 'sqli-4', modul: 'SQLi', level: 'Expert', judul: 'Time-Based Blind', kategori: 'Blind Injection' },
    { id: 'sqli-5', modul: 'SQLi', level: 'Hard', judul: 'Second-Order Injection', kategori: 'Stored Injection' },
    { id: 'sqli-6', modul: 'SQLi', level: 'Medium', judul: 'Error-Based (Obfuscated)', kategori: 'Error Leak' },
    // NoSQLi
    { id: 'nosql-1', modul: 'NoSQLi', level: 'Easy', judul: 'Auth Bypass $ne', kategori: 'Authentication' },
    { id: 'nosql-2', modul: 'NoSQLi', level: 'Medium', judul: 'Blind $regex', kategori: 'Blind Injection' },
    { id: 'nosql-3', modul: 'NoSQLi', level: 'Easy', judul: 'Operator Pollution', kategori: 'Authorization' },
    { id: 'nosql-4', modul: 'NoSQLi', level: 'Hard', judul: '$where JS Injection', kategori: 'Code Execution' },
  ];

  const SECRETS = {
    // --- SQLi (SQLite) ---
    // ch1: login bypass sebagai admin -> field secret (api key) ikut terkirim
    'sqli-1': () => {
      const row = sqlite.prepare("SELECT secret FROM users WHERE username='admin'").get();
      return row ? row.secret : null;
    },
    // ch2: UNION SELECT membaca kolom hash (digest bcrypt) admin
    'sqli-2': () => {
      const row = sqlite.prepare("SELECT hash FROM users WHERE username='admin'").get();
      return row ? row.hash : null;
    },
    // ch3: blind boolean menebak email admin karakter demi karakter
    'sqli-3': () => {
      const row = sqlite.prepare("SELECT email FROM users WHERE username='admin'").get();
      return row ? row.email : null;
    },
    // ch4: time-based blind menebak telepon admin
    'sqli-4': () => {
      const row = sqlite.prepare("SELECT telepon FROM users WHERE username='admin'").get();
      return row ? row.telepon : null;
    },
    // ch5: second-order -> kode pesanan milik user lain (citra) bocor
    'sqli-5': () => {
      const row = sqlite.prepare("SELECT kode FROM pesanan WHERE pelanggan='citra' ORDER BY id LIMIT 1").get();
      return row ? row.kode : null;
    },
    // ch6: error-based meng-echo nilai secret user budi lewat pesan error
    'sqli-6': () => {
      const row = sqlite.prepare("SELECT secret FROM users WHERE username='budi'").get();
      return row ? row.secret : null;
    },
    // --- NoSQLi (MongoDB) ---
    // ch1: $ne bypass -> field secret (api key) admin ikut terkirim
    'nosql-1': () => {
      if (!mongo) return null;
      const doc = mongo.collection('users').findOne({ username: 'admin' });
      return doc ? doc.secret : null;
    },
    // ch2: blind $regex menebak recovery code admin
    'nosql-2': () => {
      if (!mongo) return null;
      const doc = mongo.collection('users').findOne({ username: 'admin' });
      return doc ? doc.recovery : null;
    },
    // ch3: operator pollution -> kode batch produk tersembunyi VVIP
    'nosql-3': () => {
      if (!mongo) return null;
      const doc = mongo.collection('products').findOne({ visible: false });
      return doc ? doc.deskripsi : null;
    },
    // ch4: $where JS -> token sesi admin bocor
    'nosql-4': () => {
      if (!mongo) return null;
      const doc = mongo.collection('users').findOne({ username: 'admin' });
      return doc ? doc.token : null;
    },
  };

  app.get('/api/meta/challenges', (req, res) => {
    res.json({ ok: true, data: CHALLENGES });
  });

  app.post('/api/meta/verify', (req, res) => {
    const { challenge_id, secret } = req.body || {};
    if (!challenge_id || typeof secret !== 'string' || !secret.trim()) {
      return res.status(400).json({ ok: false, error: 'challenge_id dan secret wajib diisi' });
    }
    const expected = SECRETS[challenge_id] ? SECRETS[challenge_id]() : null;
    res.json({ ok: true, solved: expected !== null && secret.trim() === expected });
  });
};