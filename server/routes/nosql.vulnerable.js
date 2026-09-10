// server/routes/nosql.vulnerable.js — 4 endpoint NoSQLi yang sengaja rentan
module.exports = function (app, ctx) {
  const { mongo } = ctx;

  const marker = (req, res, next) => {
    res.setHeader('X-Lab-Mode', 'vulnerable');
    next();
  };

  const guard = (req, res, next) => {
    if (!mongo) {
      return res
        .status(503)
        .json({ ok: false, error: 'MongoDB belum terhubung — jalankan: npm run mongo:up' });
    }
    next();
  };

  app.post('/api/nosql/ch1/login', marker, guard, async (req, res) => {
    const body = req.body || {};
    // VULNERABLE: operator injection via body JSON ({"$ne":null} lolos)
    const user = await mongo.collection('users').findOne({
      username: body.username,
      password: body.password,
    });
    if (!user) return res.status(401).json({ ok: false, error: 'Username atau password salah' });
    res.json({
      ok: true,
      data: {
        id: String(user._id),
        username: user.username,
        nama: user.nama,
        role: user.role,
        secret: user.secret,
      },
    });
  });

  app.get('/api/nosql/ch2/check', marker, guard, async (req, res) => {
    const username = String(req.query.username || '');
    const prefix = String(req.query.prefix || '');
    // VULNERABLE: regex dari input mentah (blind extraction via $regex + '^')
    const user = await mongo.collection('users').findOne({
      username,
      recovery: { $regex: `^${prefix}` },
    });
    res.json({ ok: true, data: { cocok: !!user } });
  });

  app.get('/api/nosql/ch3/search', marker, guard, async (req, res) => {
    let filter;
    try {
      filter = JSON.parse(String(req.query.filter || '{}'));
    } catch {
      return res.status(400).json({ ok: false, error: 'filter tidak valid' });
    }
    // VULNERABLE: filter JSON langsung disebar ke query (user bisa menimpa visible + operator $)
    const hasil = await mongo
      .collection('products')
      .find({ visible: true, ...filter })
      .toArray();
    res.json({
      ok: true,
      data: {
        hasil: hasil.map((p) => ({
          name: p.name,
          kategori: p.kategori,
          harga: p.harga,
          deskripsi: p.deskripsi,
          visible: p.visible,
        })),
      },
    });
  });

  app.get('/api/nosql/ch4/debug', marker, guard, async (req, res) => {
    const where = String(req.query.where || '');
    // VULNERABLE: $where menerima JS mentah (server-side code execution)
    const rows = await mongo.collection('users').find({ $where: where }).toArray();
    res.json({
      ok: true,
      data: {
        jumlah: rows.length,
        user: rows.map((r) => ({ username: r.username, role: r.role })),
      },
    });
  });
};