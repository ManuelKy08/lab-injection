// Konten edukasi 10 challenge — data statis untuk UI.
// Model: setiaph challenge membocorkan data ALAMI aplikasi (api key, hash
// password, email, recovery code, kode batch, token sesi) — bukan "flag" CTF.
// Payload disembunyikan sampai hint di-klik (fleksibel, bukan spoiler).

export const CHALLENGES = [
  {
    id: 'sqli-1',
    kategori: 'SQLi',
    judul: 'Login Bypass',
    level: 'Mudah',
    target: 'API key admin',
    deskripsi:
      'Endpoint login menyusun query langsung dari input username & password tanpa prepared statement. Coba temukan cara masuk sebagai admin tanpa tahu password.',
    hint: 'Tutup string username dengan kutip tunggal ( \' ), lalu sisipkan kondisi yang selalu benar dan komentari sisa query dengan -- . Respons login admin menyertakan field secret (api key).',
    payload: "' OR '1'='1'-- ",
    rootCause:
      'Koneksi username & password mentah ke dalam string SQL + hasil SELECT langsung dipercaya. Kombinasi OR 1=1 membuat filter password tidak relevan, dan -- mengomentari sisa query. Akibatnya seluruh baris admin — termasuk api key — ikut dikirim.',
    kodeRentan: `const q = \`SELECT * FROM users
  WHERE username='\${username}'
    AND password='\${password}'\`;
const user = sqlite.prepare(q).get();`,
    kodeAman: `const user = sqlite
  .prepare('SELECT * FROM users WHERE username = ? AND password = ?')
  .get(username, password);`,
    url: '/challenge/sqli-1',
    endpoint: 'POST /api/sqli/ch1/login',
  },
  {
    id: 'sqli-2',
    kategori: 'SQLi',
    judul: 'UNION Extraction',
    level: 'Sedang',
    target: 'Hash password admin (bcrypt)',
    deskripsi:
      'Fitur pencarian produk menggabungkan input ke klausa LIKE. Manfaatkan UNION SELECT untuk membaca data dari tabel lain — jumlah kolom sudah 4 (id, nama, harga, deskripsi).',
    hint: 'Payload UNION harus punya jumlah kolom sama dengan SELECT asli. Gunakan literal 1 sebagai placeholder. Tabel users punya kolom hash (digest bcrypt) milik admin.',
    payload: `x' UNION SELECT 1,hash,1,1 FROM users WHERE username='admin'-- `,
    rootCause:
      'Query pencarian dibangun dengan string concat tanpa parameterisasi. UNION SELECT menggabungkan hasil dari tabel lain saat jumlah kolom cocok — hash password admin terbaca sebagai baris produk.',
    kodeRentan: `const sql = \`SELECT id, nama, harga, deskripsi
  FROM products WHERE nama LIKE '%\${q}%'\`;`,
    kodeAman: `const rows = sqlite.prepare(
  'SELECT id, nama, harga, deskripsi FROM products WHERE nama LIKE ?'
).all(\`%\${q}%\`);`,
    url: '/challenge/sqli-2',
    endpoint: 'GET /api/sqli/ch2/search?q=',
  },
  {
    id: 'sqli-3',
    kategori: 'SQLi',
    judul: 'Blind Boolean',
    level: 'Sedang',
    target: 'Email admin',
    deskripsi:
      'Endpoint profil memakai id numerik mentah. Respons hanya membedakan "ditemukan" vs "tidak" — tanpa output data. Gunakan oracle boolean untuk menebak isi field karakter demi karakter.',
    hint: 'Bandingkan substr(email,1,1) dengan huruf. TRUE oracle => profil ditemukan, FALSE => tidak. Email admin diawali huruf a.',
    payload: `1 AND (SELECT substr(email,1,1) FROM users WHERE username='admin')='a'`,
    rootCause:
      'id disisipkan mentah tanpa prepared statement. Perbedaan respons (boolean oracle) dimanfaatkan untuk ekstraksi data secara blind — email admin bisa ditebak aksara demi aksara.',
    kodeRentan: `const sql = \`SELECT id, nama, role
  FROM users WHERE id = \${id}\`;`,
    kodeAman: `const idNum = Number(req.query.id);
if (!Number.isInteger(idNum)) return res.status(400).json(...);
const row = sqlite.prepare('SELECT id, nama, role FROM users WHERE id = ?').get(idNum);`,
    url: '/challenge/sqli-3',
    endpoint: 'GET /api/sqli/ch3/profile?id=',
  },
  {
    id: 'sqli-4',
    kategori: 'SQLi',
    judul: 'Time-Based Blind',
    level: 'Sulit',
    target: 'Telepon admin',
    deskripsi:
      'Filter produk menampilkan hanya jumlah hasil — tidak ada petunjuk boolean. Teknik time-based: buat query melambat (randomblob besar) jika kondisi terpenuhi, lalu ukur waktu respons.',
    hint: 'Gunakan CASE WHEN kondisi THEN randomblob(50000000) — evaluasi TRUE membuat respons ~1 detik, FALSE instan. Bandingkan substr(telepon,N,1). Nomor admin diawali 0.',
    payload: `x' OR (SELECT CASE WHEN (SELECT substr(telepon,1,1) FROM users WHERE username='admin')='0' THEN randomblob(50000000) ELSE 1 END) AND '1'='1`,
    rootCause:
      'String concat tanpa parameterisasi + tidak ada batasan pada ekspresi yang disisipkan. Subquery CASE WHEN dievaluasi; randomblob memaksa komputasi berat sehingga waktu respons jadi oracle.',
    kodeRentan: `const sql = \`SELECT id, nama, harga
  FROM products WHERE kategori = '\${kategori}'\`;`,
    kodeAman: `const rows = sqlite.prepare(
  'SELECT id FROM products WHERE kategori = ?'
).all(kategori);`,
    url: '/challenge/sqli-4',
    endpoint: 'GET /api/sqli/ch4/filter?kategori=',
  },
  {
    id: 'sqli-5',
    kategori: 'SQLi',
    judul: 'Second-Order',
    level: 'Sulit',
    target: 'Kode pesanan user lain (citra)',
    deskripsi:
      'Registrasi menyimpan username apa adanya. Query report kemudian memakai username tersebut secara mentah dalam klausa WHERE pelanggan. Inject di titik simpan, ledakkan di titik pakai.',
    hint: 'Daftarkan username berisi UNION SELECT (nama bebas, alamat bebas). Buka report milik pelanggan itu — UNION menarik kode pesanan milik citra sebagai baris laporan.',
    payload: `x' UNION SELECT kode,produk,total FROM pesanan WHERE pelanggan='citra'-- `,
    rootCause:
      'Data tersimpan tanpa validasi dan dipercaya saat dipakai ulang di query lain tanpa parameterisasi. Second-order: kode rentan bukan di INSERT, tapi di SELECT report.',
    kodeRentan: `// INSERT: disimpan apa adanya (tanpa whitelist)
// REPORT (RENTAN):
const sql = \`SELECT kode, produk, total FROM pesanan
  WHERE pelanggan = '\${pel.username}'\`;
const laporan = sqlite.prepare(sql).all();`,
    kodeAman: `const pel = sqlite.prepare('SELECT username FROM pelanggan WHERE id = ?').get(pid);
const laporan = sqlite.prepare('SELECT kode, produk, total FROM pesanan WHERE pelanggan = ?').all(pel.username);`,
    url: '/challenge/sqli-5',
    endpoint: 'POST /api/sqli/ch5/register + GET /api/sqli/ch5/report',
  },
  {
    id: 'sqli-6',
    kategori: 'SQLi',
    judul: 'Error-Based',
    level: 'Sedang',
    target: 'API key user budi',
    deskripsi:
      'Endpoint item menampilkan pesan error mentah dari SQLite (potong 80 karakter). SQLite tidak melempar error pada CAST teks; gunakan fungsi JSON yang menge-echo nilai pada pesan error.',
    hint: 'json_extract(\'{}\', path) melempar error yang MEMUAT path-nya. Jadikan secret user budi sebagai path via subquery. Pastikan baris terpilih (id=1) supaya ekspresi dievaluasi.',
    payload: `1 AND json_extract('{}', (SELECT secret FROM users WHERE username='budi'))`,
    rootCause:
      'Error handler membocorkan err.message mentah (truncated 80). json_extract dengan path tidak valid menghasilkan "bad JSON path: ..." yang menggemakan nilai path — secret bocor lewat pesan error.',
    kodeRentan: `const sql = \`SELECT id, nama, harga, stok
  FROM products WHERE id = \${id}\`;
try { /* ... */ }
catch (e) {
  res.status(500).json({ error: \`Query error: \${e.message}\` });
}`,
    kodeAman: `const idNum = Number(req.query.id);
if (!Number.isInteger(idNum)) return res.status(400).json(...);
const row = sqlite.prepare('SELECT id, nama, harga, stok FROM products WHERE id = ?').get(idNum);`,
    url: '/challenge/sqli-6',
    endpoint: 'GET /api/sqli/ch6/item?id=',
  },
  {
    id: 'nosql-1',
    kategori: 'NoSQLi',
    judul: 'Auth Bypass ($ne)',
    level: 'Mudah',
    target: 'API key admin (MongoDB)',
    deskripsi:
      'Login MongoDB menerima objek JSON langsung sebagai filter. Operator $ne (not equal) membuat pencocokan password tidak pernah benar-benar terjadi.',
    hint: 'Kirim username DAN password sebagai objek {"$ne": null}. Mongo mencocokkan "field != null" yang selalu true untuk dokumen apa pun — dokumen admin balik termasuk api key.',
    payload: `{ "username": { "$ne": null }, "password": { "$ne": null } }`,
    rootCause:
      'Body request dipakai mentah sebagai filter query. Operator MongoDB ($ne, $gt, $regex, dst) ikut dieksekusi karena tidak ada pengetatan tipe string.',
    kodeRentan: `const user = await db.collection('users').findOne({
  username: body.username,
  password: body.password,
});`,
    kodeAman: `const user = await db.collection('users').findOne({
  username: { $eq: body.username },
  password: { $eq: body.password },
});`,
    url: '/challenge/nosql-1',
    endpoint: 'POST /api/nosql/ch1/login',
  },
  {
    id: 'nosql-2',
    kategori: 'NoSQLi',
    judul: 'Blind Regex',
    level: 'Sedang',
    target: 'Recovery code admin',
    deskripsi:
      'Endpoint check memakai regex ^<prefix> pada field recovery tanpa meng-escape meta-char. Ekstrak recovery secara blind: tebak prefix, lihat "cocok" true/false.',
    hint: 'Prefix "REC-" cocok. Lanjutkan karakter demi karakter: username=admin&prefix=REC-... setiap karakter digeser sampai tanda "-" berikutnya.',
    payload: `username=admin&prefix=REC-`,
    rootCause:
      'Regex dibangun dari input tanpa escape meta-character. Serangan blind regex menebak konten field lewat oracle cocok/tidak cocok (^ anchor).',
    kodeRentan: `const user = await db.collection('users').findOne({
  username,
  recovery: { $regex: \`^\${prefix}\` },
});`,
    kodeAman: `const esc = prefix.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
const user = await db.collection('users').findOne({
  username,
  recovery: { $regex: \`^\${esc}\` },
});`,
    url: '/challenge/nosql-2',
    endpoint: 'GET /api/nosql/ch2/check?username=admin&prefix=',
  },
  {
    id: 'nosql-3',
    kategori: 'NoSQLi',
    judul: 'Operator Pollution',
    level: 'Sedang',
    target: 'Kode batch produk VVIP',
    deskripsi:
      'Search menerima filter JSON dan menggabungkannya dengan { visible: true }. Operator $ne di dalam filter bisa menimpa/menembus filter visible — memunculkan produk tersembunyi.',
    hint: 'Filter {"visible":{"$ne":true}} membuat kriteria visible:true ter-override menjadi visible != true — produk VVIP (visible:false) ikut tampil beserta kode batch rahasianya di deskripsi.',
    payload: `{ "visible": { "$ne": true } }`,
    rootCause:
      'Filter dari user di-spread menyatu dengan filter internal. Karena kunci sama (visible), nilai user menang; operator $ne menembus kontrol visibilitas.',
    kodeRentan: `const hasil = await db.collection('products')
  .find({ visible: true, ...filter }).toArray();`,
    kodeAman: `if (hasNestedOperator(filter)) return res.status(400).json(...);
// whitelist hanya name/kategori, visible tidak bisa ditimpa
const cleaned = {};
for (const k of Object.keys(filter)) {
  if (k === 'name' || k === 'kategori') cleaned[k] = filter[k];
}
const hasil = await db.collection('products')
  .find({ visible: true, ...cleaned }).toArray();`,
    url: '/challenge/nosql-3',
    endpoint: 'GET /api/nosql/ch3/search?filter=',
  },
  {
    id: 'nosql-4',
    kategori: 'NoSQLi',
    judul: '$where JS Injection',
    level: 'Sulit',
    target: 'Token sesi admin',
    deskripsi:
      'Fitur debug memakai operator $where yang mengeksekusi JavaScript pada server MongoDB. Restriksi kata kunci lemah — ekspresi JS bisa mengakses field dokumen.',
    hint: 'Dokumen admin punya field token (diawali "ses_"). Ekspresi this.username==\'admin\' && this.token.startsWith(\'s\') mengembalikan jumlah 1 saat tebakan benar.',
    payload: `this.username=='admin' && this.token.startsWith('s')`,
    rootCause:
      '$where mengeksekusi JavaScript arbitrary pada setiap dokumen. Blokir berbasis substring (function/this/return) bisa dilewati dengan ekspresi alternatif.',
    kodeRentan: `const rows = await db.collection('users')
  .find({ $where: where }).toArray();`,
    kodeAman: `const rows = await db.collection('users')
  .find({ username: { $regex: esc, $options: 'i' } }).toArray();`,
    url: '/challenge/nosql-4',
    endpoint: 'GET /api/nosql/ch4/debug?where=',
  },
];

export const KATEGORI = [
  { id: 'sqli', label: 'SQL Injection', warna: '#55b3ff' },
  { id: 'nosql', label: 'NoSQL Injection', warna: '#ffb455' },
];

export function getChallenge(id) {
  return CHALLENGES.find((c) => c.id === id);
}