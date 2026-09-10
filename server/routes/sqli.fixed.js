// server/routes/sqli.fixed.js — versi aman (prepared statement) dari 6 endpoint SQLi
module.exports = function (app, ctx) {
  const { sqlite } = ctx;

  const marker = (req, res, next) => {
    res.setHeader('X-Lab-Mode', 'vulnerable');
    next();
  };

  app.post('/api/sqli/fixed/ch1/login', marker, (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ ok: false, error: 'username dan password wajib string' });
    }
    // FIXED: parameterized query
    const user = sqlite
      .prepare('SELECT id, username, nama, role FROM users WHERE username = ? AND password = ?')
      .get(username, password);
    if (!user) return res.status(401).json({ ok: false, error: 'Username atau password salah' });
    res.json({ ok: true, data: user });
  });

  app.get('/api/sqli/fixed/ch2/search', marker, (req, res) => {
    const q = String(req.query.q || '');
    // FIXED: parameterized query
    const rows = sqlite
      .prepare('SELECT id, nama, harga, deskripsi FROM products WHERE nama LIKE ?')
      .all(`%${q}%`);
    res.json({ ok: true, data: { hasil: rows } });
  });

  app.get('/api/sqli/fixed/ch3/profile', marker, (req, res) => {
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'id harus angka' });
    // FIXED: parameterized query
    const row = sqlite.prepare('SELECT id, nama, role FROM users WHERE id = ?').get(id);
    if (!row) return res.json({ ok: true, data: { ditemukan: false } });
    res.json({ ok: true, data: { ditemukan: true, id: row.id, nama: row.nama, role: row.role } });
  });

  app.get('/api/sqli/fixed/ch4/filter', marker, (req, res) => {
    const kategori = String(req.query.kategori || '');
    // FIXED: parameterized query
    const rows = sqlite.prepare('SELECT id FROM products WHERE kategori = ?').all(kategori);
    res.json({ ok: true, data: { jumlah: rows.length } });
  });

  app.post('/api/sqli/fixed/ch5/register', marker, (req, res) => {
    const { username, nama, alamat } = req.body || {};
    if (typeof username !== 'string' || typeof nama !== 'string') {
      return res.status(400).json({ ok: false, error: 'username dan nama wajib string' });
    }
    // FIXED: parameterized query
    const result = sqlite
      .prepare('INSERT INTO pelanggan (username, nama, alamat) VALUES (?, ?, ?)')
      .run(username, nama, alamat || '');
    res.json({ ok: true, data: { pelanggan_id: Number(result.lastInsertRowid) } });
  });

  app.get('/api/sqli/fixed/ch5/report', marker, (req, res) => {
    const pid = Number(req.query.pelanggan_id);
    if (!Number.isInteger(pid)) return res.status(400).json({ ok: false, error: 'pelanggan_id harus angka' });
    // FIXED: parameterized query
    const pel = sqlite.prepare('SELECT username FROM pelanggan WHERE id = ?').get(pid);
    if (!pel) return res.status(404).json({ ok: false, error: 'pelanggan tidak ditemukan' });
    const laporan = sqlite.prepare('SELECT kode, produk, total FROM pesanan WHERE pelanggan = ?').all(pel.username);
    res.json({ ok: true, data: { laporan } });
  });

  app.get('/api/sqli/fixed/ch6/item', marker, (req, res) => {
    const id = Number(req.query.id);
    if (!Number.isInteger(id)) return res.status(400).json({ ok: false, error: 'id harus angka' });
    // FIXED: parameterized query
    const row = sqlite.prepare('SELECT id, nama, harga, stok FROM products WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ ok: false, error: 'barang tidak ditemukan' });
    res.json({ ok: true, data: row });
  });
};