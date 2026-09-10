# LAPORAN.md — Pengujian Lab VulnLab (SQLi & NoSQLi)

Dokumentasi pengujian menyeluruh lab pembelajaran `lab-injection` setelah revisi
dari skema flag CTF (`FLAG{...}`) menjadi **secret alami aplikasi**.

## 1. Ringkasan Revisi

Permintaan user: *"kok flag sih ini bukan ctf kocak revisi ya"* → lab seharusnya
tidak memakai format flag khas CTF. Diterapkan opsi **"Secret alami aplikasi
(Recommended)"**:

- Dihapus: tabel `flags` (SQLite), koleksi `flags` (MongoDB), format `FLAG{...}`,
  poin per challenge, badge "Solved" (→ "Selesai"), komponen `FlagForm` (→ `SecretForm`),
  parameter `flag` pada `/api/meta/verify` (→ `secret`).
- Ditambahkan: kolom `hash` (digest bcrypt admin, target UNION), kolom `email` &
  `telepon` (target blind boolean & time-based), field `target` per challenge pada
  UI (menampilkan data natural yang harus diekstrak), produk VVIP tersembunyi beserta
  kode batch sebagai target NoSQLi-3.

Setiap challenge kini "selesai" jika user berhasil mengekstrak **data nyata di dalam
aplikasi**: api key, digest bcrypt, email, telepon, kode pesanan user lain, recovery
code, token sesi, atau kode batch produk tersembunyi. Verifikasi membandingkan input
dengan nilai yang di-query langsung dari DB (tetap sinkron dengan seed terbaru).

## 2. Lingkungan Pengujian

| Komponen | Nilai |
|---|---|
| OS | Linux (zsh) |
| Node.js | v25.8.1 (`node:sqlite` `DatabaseSync`) |
| MongoDB | mongo:7 via container `lab-injection-mongo` @ `127.0.0.1:27017` |
| URL lab | `http://127.0.0.1:8100` |
| Frontend build | Vite, output `client/dist` (di-serve Express) |

Catatan: docker compose plugin tidak tersedia di environment pengujian → container
dijalankan dengan `docker run` (setara `docker-compose.yml`), lihat `jalankan.sh`.

## 3. Hasil Smoke Test (E2E)

Skrip `tests/smoke.mjs` menguji seluruh 10 challenge vulnerable + endpoint
fixed + meta. **Hasil: 24 pass, 0 fail.**

### SQLi (SQLite)
| Test | Hasil | Catatan |
|---|---|---|
| T1 login bypass | PASS | `' OR '1'='1'-- ` → login sebagai admin, respons memuat `secret: sk_admin_9f3Kq2mZvX7c` |
| T1F fixed tolak bypass | PASS | 401 |
| T1F fixed login benar | PASS | `admin/admin123` → 200 tanpa field `secret` |
| T2 UNION extraction | PASS | `UNION SELECT 1,hash,1,1` → digest bcrypt admin tampil di kolom nama |
| T3 blind boolean TRUE/FALSE | PASS | oracle `substr(email,1,1)='a'` → ditemukan true; `'z'` → false |
| T4 time-based TRUE/FALSE | PASS | delay 936ms saat TRUE, 2ms saat FALSE |
| T5 second-order | PASS | register payload UNION → report mengembalikan `INV-2026-0002` milik citra |
| T6 error-based | PASS | `json_extract` → pesan error memuat `sk_budi_5h2Kq9mZt4wY` |
| T6F fixed menolak payload | PASS | 400 `id harus angka` |

### NoSQLi (MongoDB)
| Test | Hasil | Catatan |
|---|---|---|
| N1 $ne bypass | PASS | `{"$ne":null}` → admin, respons memuat `secret: sk_admin_7Kq9mZ2pXv5nB4` |
| N1F fixed tolak operator | PASS | 400 `username dan password harus string` |
| N1F fixed login string benar | PASS | 200 tanpa field `secret` |
| N2 blind regex TRUE/FALSE | PASS | prefix `REC-` → cocok true; `zzz` → false |
| N3 operator pollution | PASS | `{"visible":{"$ne":true}}` → produk VVIP tampil, deskripsi berisi `BATCH-VVIP-2026-9X4K` |
| N3F fixed tolak operator | PASS | 400 `operator tidak diizinkan` |
| N4 $where JS oracle | PASS | `token.startsWith('s')` → jumlah 1; `'z'` → jumlah 0 |

### Meta
| Test | Hasil | Catatan |
|---|---|---|
| verify true | PASS | `{challenge_id:'sqli-1', secret:'sk_admin_9f3Kq2mZvX7c'}` → solved true |
| verify false | PASS | secret salah → solved false |
| challenges list | PASS | 10 challenge |

## 4. Pengujian UI (Playwright)

- **Landing** — render sempurna: 2 modul, 10 kartu challenge, setiap kartu menampilkan
  badge `target: <data yang bocor>` (tanpa poin).
- **Challenge page sqli-1** — breadcrumb + chips (SQL, Mudah, target), deskripsi,
  form **"Verifikasi Hasil"** dengan placeholder "Data rahasia yang bocor...".
- **Verifikasi benar** — submit `sk_admin_9f3Kq2mZvX7c` → pesan hijau
  "Data cocok — challenge terselesaikan!" + badge **"✓ Selesai"** pada header.
- **Verifikasi salah** — submit string acak → pesan merah "Data belum cocok, coba lagi.".
- Tidak ada lagi istilah `FLAG{...}`, "poin", ataupun "Solved" di seluruh antarmuka.

## 5. Status Aplikasi

- Frontend ter-build (`npm run build`, output Vite 194 kB js / 19 kB css).
- Server berjalan di tmux session `vulnlab` → `http://127.0.0.1:8100`.
- DB di-seed ulang dengan skema baru: `server/data/lab.db` (SQLite) + `lab_injection`
  (MongoDB) dibuat fresh dari skrip seed.

## 6. Daftar Secret per Challenge (referensi pengujian/pemeliharaan)

| ID | Target | Nilai |
|---|---|---|
| sqli-1 | api key admin | `sk_admin_9f3Kq2mZvX7c` |
| sqli-2 | digest bcrypt admin | `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy` |
| sqli-3 | email admin | `admin@vulnlab.test` |
| sqli-4 | telepon admin | `0812-3344-5566` |
| sqli-5 | kode pesanan citra | `INV-2026-0002` |
| sqli-6 | api key budi | `sk_budi_5h2Kq9mZt4wY` |
| nosql-1 | api key admin (Mongo) | `sk_admin_7Kq9mZ2pXv5nB4` |
| nosql-2 | recovery code admin | `REC-4F9K-8Q2M-7X3B` |
| nosql-3 | kode batch VVIP | `Batch eksklusif: BATCH-VVIP-2026-9X4K` |
| nosql-4 | token sesi admin | `ses_8f3Kq9mZ2pXv5nB7c4wL6dR` |

## 7. Kesimpulan

Revisi selesai dan terverifikasi end-to-end: seluruh 10 challenge mengeksploitasi
data natural aplikasi, versi fixed aman terhadap semua payload di atas, UI
konsisten (tanpa terminologi CTF/flag/poin), dan dokumentasi (CONTRACT.md,
README.md, file ini) sinkron dengan implementasi.

Catatan perbaikan selama proses: skema awal menyimpan password admin sebagai hash
sehingga login fixed `admin/admin123` gagal; diperbaiki dengan memisahkan kolom
`password` (plaintext, dipakai login) dan `hash` (digest bcrypt, target UNION sqli-2).