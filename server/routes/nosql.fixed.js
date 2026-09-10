// server/routes/nosql.fixed.js — versi aman dari 4 endpoint NoSQLi
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

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  app.post('/api/nosql/fixed/ch1/login', marker, guard, async (req, res) => {
    const body = req.body || {};
    if (typeof body.username !== 'string' || typeof body.password !== 'string') {
      return res.status(400).json({ ok: false, error: 'username dan password harus string' });
    }
    // FIXED: input divalidasi string + perbandingan $eq eksplisit
    const user = await mongo.collection('users').findOne({
      username: { $eq: body.username },
      password: { $eq: body.password },
    });
    if (!user) return res.status(401).json({ ok: false, error: 'Username atau password salah' });
    res.json({ ok: true, data: { id: String(user._id), username: user.username, nama: user.nama, role: user.role } });
  });

  app.get('/api/nosql/fixed/ch2/check', marker, guard, async (req, res) => {
    const username = String(req.query.username || '');
    const prefix = String(req.query.prefix || '');
    // FIXED: regex meta-character di-escape
    const user = await mongo.collection('users').findOne({
      username,
      recovery: { $regex: `^${escapeRegex(prefix)}` },
    });
    res.json({ ok: true, data: { cocok: !!user } });
  });

  app.get('/api/nosql/fixed/ch3/search', marker, guard, async (req, res) => {
    let filter;
    try {
      filter = JSON.parse(String(req.query.filter || '{}'));
    } catch {
      return res.status(400).json({ ok: false, error: 'filter tidak valid' });
    }
    const hasNestedOperator = (val) => {
      if (Array.isArray(val)) return val.some(hasNestedOperator);
      if (val && typeof val === 'object') {
        return Object.keys(val).some((k) => k.startsWith('$') || hasNestedOperator(val[k]));
      }
      return false;
    };
    if (hasNestedOperator(filter)) {
      return res.status(400).json({ ok: false, error: 'operator tidak diizinkan' });
    }
    // FIXED: operator $ ditolak + hanya whitelist bidang name/kategori
    const cleaned = {};
    for (const k of Object.keys(filter)) {
      if (k === 'name' || k === 'kategori') cleaned[k] = filter[k];
    }
    const hasil = await mongo.collection('products').find({ visible: true, ...cleaned }).toArray();
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

  app.get('/api/nosql/fixed/ch4/debug', marker, guard, async (req, res) => {
    const where = String(req.query.where || '');
    if (where.includes('$') || where.includes('function') || where.includes('this.')) {
      return res.status(400).json({ ok: false, error: 'input tidak diizinkan' });
    }
    // FIXED: $where dihilangkan — pencarian aman via nama username
    const rows = await mongo
      .collection('users')
      .find({ username: { $regex: escapeRegex(where), $options: 'i' } })
      .toArray();
    res.json({
      ok: true,
      data: {
        jumlah: rows.length,
        user: rows.map((r) => ({ username: r.username, role: r.role })),
      },
    });
  });
};