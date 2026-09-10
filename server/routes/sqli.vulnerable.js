// server/routes/sqli.vulnerable.js — 6 endpoint SQLi yang sengaja rentan
module.exports = function (app, ctx) {
  const { sqlite } = ctx;

  const marker = (req, res, next) => {
    res.setHeader('X-Lab-Mode', 'vulnerable');
    next();
  };

  app.post('/api/sqli/ch1/login', marker, (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ ok: false, error: 'username dan password wajib string' });
    }
    // VULNERABLE: raw query concatenation
    const q = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
    const user = sqlite.prepare(q).get();
    if (!user) return res.status(401).json({ ok: false, error: 'Username atau password salah' });
    res.json({
      ok: true,
      data: { id: user.id, username: user.username, nama: user.nama, role: user.role, secret: user.secret },
    });
  });

  app.get('/api/sqli/ch2/search', marker, (req, res) => {
    const q = String(req.query.q || '');
    // VULNERABLE: raw query concatenation
    const sql = `SELECT id, nama, harga, deskripsi FROM products WHERE nama LIKE '%${q}%'`;
    const rows = sqlite.prepare(sql).all();
    res.json({ ok: true, data: { hasil: rows } });
  });

  app.get('/api/sqli/ch3/profile', marker, (req, res) => {
    const id = String(req.query.id || '');
    // VULNERABLE: raw query concatenation
    const sql = `SELECT id, nama, role FROM users WHERE id = ${id}`;
    const row = sqlite.prepare(sql).get();
    if (!row) return res.json({ ok: true, data: { ditemukan: false } });
    res.json({ ok: true, data: { ditemukan: true, id: row.id, nama: row.nama, role: row.role } });
  });

  app.get('/api/sqli/ch4/filter', marker, (req, res) => {
    const kategori = String(req.query.kategori || '');
    // VULNERABLE: raw query concatenation
    const sql = `SELECT id, nama, harga FROM products WHERE kategori = '${kategori}'`;
    const rows = sqlite.prepare(sql).all();
    res.json({ ok: true, data: { jumlah: rows.length } });
  });

  app.post('/api/sqli/ch5/register', marker, (req, res) => {
    const { username, nama, alamat } = req.body || {};
    if (typeof username !== 'string' || typeof nama !== 'string') {
      return res.status(400).json({ ok: false, error: 'username dan nama wajib string' });
    }
    // NOTE second-order: username disimpan APA ADANYA tanpa validasi/whitelist.
    // Bahaya bukan di INSERT ini, tapi di endpoint report yang memakai username
    // hasil SELECT secara MENTAH -> lihat /api/sqli/ch5/report (VULNERABLE).
    const result = sqlite
      .prepare('INSERT INTO pelanggan (username, nama, alamat) VALUES (?, ?, ?)')
      .run(username, nama, alamat || '');
    res.json({ ok: true, data: { pelanggan_id: Number(result.lastInsertRowid) } });
  });

  app.get('/api/sqli/ch5/report', marker, (req, res) => {
    const pid = String(req.query.pelanggan_id || '');
    // VULNERABLE: raw query concatenation
    const pel = sqlite.prepare(`SELECT username FROM pelanggan WHERE id = ${pid}`).get();
    if (!pel) return res.status(404).json({ ok: false, error: 'pelanggan tidak ditemukan' });
    // VULNERABLE: second-order — username hasil SELECT disisipkan langsung
    const sql = `SELECT kode, produk, total FROM pesanan WHERE pelanggan = '${pel.username}'`;
    const laporan = sqlite.prepare(sql).all();
    res.json({ ok: true, data: { laporan } });
  });

  app.get('/api/sqli/ch6/item', marker, (req, res) => {
    const id = String(req.query.id || '');
    // VULNERABLE: raw query concatenation
    const sql = `SELECT id, nama, harga, stok FROM products WHERE id = ${id}`;
    try {
      const row = sqlite.prepare(sql).get();
      if (!row) return res.status(404).json({ ok: false, error: 'barang tidak ditemukan' });
      res.json({ ok: true, data: row });
    } catch (e) {
      res.status(500).json({ ok: false, error: `Query error: ${e.message.slice(0, 80)} [truncated]` });
    }
  });
};