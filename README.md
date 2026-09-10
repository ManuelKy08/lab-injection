# VulnLab — SQLi & NoSQLi

Lab pembelajaran keamanan aplikasi web (**FOR LOCAL/EDUCATIONAL USE ONLY — do not expose to public internet**).
10 challenge eksploitasi terarah: **6 SQL Injection (SQLite)** dan **4 NoSQL Injection (MongoDB)** — masing-masing
dengan versi vulnerable, versi fixed, hint, snippet kode rentan vs aman, dan penjelasan akar masalah.

Berbeda dari lab CTF yang memakai `FLAG{...}`, setiap challenge di sini membocorkan **data alami aplikasi**
(api key, digest bcrypt, email, telepon, kode pesanan user lain, recovery code, token sesi, kode batch produk
tersembunyi). State progres disimpan di localStorage browser.

## Teknologi

| Layer | Stack |
|---|---|
| Backend | Node.js 25, Express 4 |
| SQLite | Modul built-in `node:sqlite` (`DatabaseSync`, WAL) — tanpa dependency native |
| MongoDB | Driver resmi `mongodb` v6, container `mongo:7` bound `127.0.0.1:27017` |
| Frontend | Vite 6 + React 18 + Tailwind CSS v4 (CSS-first), dark modern ops-console |

## Prasyarat

- Node.js **>= 22.5** (dipakai `node:sqlite`; diuji pada **v25**)
- Docker dengan container `mongo:7` (docker compose diuji via `docker run`, lihat `jalankan.sh`)

## Setup & Jalankan

```bash
# 1. dependency
npm install --prefix server
npm install --prefix client

# 2. mongo (container tunggal; compose-file tersedia di docker-compose.yml)
docker run -d --name lab-injection-mongo -p 127.0.0.1:27017:27017 \
  -v lab-injection-mongo-data:/data/db mongo:7

# 3. build frontend + start server (pakai skrip atau manual)
bash jalankan.sh            # setup container + build + start node di :8100
# atau manual:
npm run build --prefix client
node server/index.js        # serve API + client/dist di http://127.0.0.1:8100
```

Buka **http://127.0.0.1:8100**. Dev mode frontend: `npm run dev --prefix client` (port 8101, proxy `/api` → 8100; server node tetap berjalan).

> Reset data: hapus `server/data/lab.db` (SQLite di-seed ulang saat start) dan
> `docker exec lab-injection-mongo mongosh --quiet lab_injection --eval 'db.dropDatabase()'`.

## Daftar Challenge

### SQLi (SQLite) — `/api/sqli/*` vs `/api/sqli/fixed/*`
| # | Nama | Teknik | Target data |
|---|---|---|---|
| 1 | Login Bypass | `' OR '1'='1'-- -` | api key admin |
| 2 | UNION Extraction | `UNION SELECT ... FROM users` | hash bcrypt admin |
| 3 | Blind Boolean | oracle `substr()` true/false | email admin |
| 4 | Time-Based Blind | `CASE WHEN` + `randomblob()`, ukur delay | telepon admin |
| 5 | Second-Order | payload di username, terbaca saat report | kode pesanan citra |
| 6 | Error-Based | `json_extract()` meng-echo nilai di pesan error | api key budi |

### NoSQLi (MongoDB) — `/api/nosql/*` vs `/api/nosql/fixed/*`
| # | Nama | Teknik | Target data |
|---|---|---|---|
| 1 | Auth Bypass $ne | `{"$ne":null}` sebagai filter | api key admin |
| 2 | Blind $regex | eksploitasi `^<prefix>` tanpa escape | recovery code admin |
| 3 | Operator Pollution | spread `JSON.parse(filter)` menimpa `visible` | kode batch produk VVIP |
| 4 | $where JS Injection | ekspresi JS pada `$where` | token sesi admin |

Setiap challenge dilengkapi hint, payload contoh, kode rentan/aman, dan akar masalah.
Verifikasi hasil dilakukan lewat form "Verifikasi Hasil" (kirim data rahasia yang berhasil diekstrak).

## Struktur

```
lab-injection/
├── server/db/sqlite.js        # schema + seed SQLite (tidak ada tabel flags)
├── server/db/mongo.js         # schema + seed MongoDB (tidak ada koleksi flags)
├── server/routes/sqli.*.js    # 6 endpoint vulnerable + fixed (prepared statement)
├── server/routes/nosql.*.js   # 4 endpoint vulnerable + fixed (sanitasi operator)
├── server/routes/meta.js      # daftar challenge + SECRETS map + POST /api/meta/verify
├── client/src/data/challenges.js  # data statis 10 challenge (target, payload, kode)
├── client/src/components/SecretForm.jsx  # verifikasi secret yang berhasil diekstrak
└── CONTRACT.md                # single source of truth API/schema/konvensi
```

## Verifikasi

```bash
# smoke test end-to-end 10 challenge + endpoint meta (jalankan setelah server aktif)
node tests/smoke.mjs    # harapannya: 24 pass, 0 fail
```

## Catatan Etika

Lab ini hanya untuk pembelajaran lokal. Jangan pernah men-deploy ke internet, dan jangan
menggunakan teknik di sini untuk sistem tanpa izin (`X-Lab-Mode: vulnerable` menandai seluruh
endpoint sebagai milik lab).

Dokumen detail teknis: `CONTRACT.md`. Laporan pengujian: `LAPORAN.md`.