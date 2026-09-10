// server/db/sqlite.js
// Inisialisasi SQLite (node:sqlite built-in) + seed data realistis.
// Catatan: TIDAK ada tabel "flags" — setiap challenge membocorkan data alami
// aplikasi (api key, hash password, email, dll) milik user yang ada di DB.
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'lab.db');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;

  -- Catatan: password disimpan plaintext (kelemahan nyata yang biasa diajarkan
-- di lab); kolom hash menyimpan digest bcrypt admin sebagai target T2 (union).
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    hash TEXT,
    nama TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    email TEXT DEFAULT '',
    telepon TEXT DEFAULT '',
    secret TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    nama TEXT NOT NULL,
    kategori TEXT NOT NULL,
    harga INTEGER NOT NULL,
    stok INTEGER NOT NULL,
    deskripsi TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS pelanggan (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    nama TEXT NOT NULL,
    alamat TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS pesanan (
    id INTEGER PRIMARY KEY,
    kode TEXT NOT NULL,
    pelanggan TEXT NOT NULL,
    produk TEXT NOT NULL,
    total INTEGER NOT NULL
  );
`);

// ---- Seed (hanya jika tabel masih kosong) ----
const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (userCount === 0) {
  const insUser = db.prepare(
    'INSERT INTO users (username, password, hash, nama, role, email, telepon, secret) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  // password admin disimpan plaintext (login asli); hash = digest bcrypt (target T2)
  insUser.run(
    'admin',
    'admin123',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Administrator Utama',
    'admin',
    'admin@vulnlab.test',
    '0812-3344-5566',
    'sk_admin_9f3Kq2mZvX7c'
  );
  insUser.run('budi', 'budi123', null, 'Budi Santoso', 'user', 'budi@vulnlab.test', '0813-1122-3344', 'sk_budi_5h2Kq9mZt4wY');
  insUser.run('citra', 'citra123', null, 'Citra Dewi', 'user', 'citra@vulnlab.test', '0815-6677-8899', null);
  insUser.run('dian', 'dian123', null, 'Dian Permata', 'user', 'dian@vulnlab.test', '0817-9900-1122', null);
}

const productCount = db.prepare('SELECT COUNT(*) AS n FROM products').get().n;
if (productCount === 0) {
  const insProduct = db.prepare(
    'INSERT INTO products (nama, kategori, harga, stok, deskripsi) VALUES (?, ?, ?, ?, ?)'
  );
  insProduct.run('Smart TV 43"', 'Elektronik', 3500000, 12, 'Layar 4K UHD dengan HDR10+, smart TV lengkap dengan aplikasi streaming.');
  insProduct.run('Kemeja Flanel', 'Fashion', 189000, 45, 'Kemeja flanel premium, bahan katun lembut dengan motif kotak-kotak klasik.');
  insProduct.run('Kopi Arabika Gayo 250g', 'Makanan', 85000, 120, 'Kopi arabika dataran tinggi Gayo, roasted medium dengan aroma coklat.');
  insProduct.run('Headphone Wireless Pro', 'Elektronik', 1250000, 8, 'ANC aktif, baterai 40 jam, kualitas studio dengan Bluetooth 5.3.');
  insProduct.run('Sepatu Running Ringan', 'Fashion', 459000, 30, 'Sepatu lari dengan sol empuk dan upper mesh yang breathable.');
  insProduct.run('Rice Cooker 1.8L', 'Elektronik', 299000, 55, 'Menanak nasi anti lengket dengan lapisan keramik, dilengkapi fungsi keep warm.');
  insProduct.run('Vitamin C 1000mg', 'Kesehatan', 45000, 200, 'Suplemen vitamin C dengan zinc untuk daya tahan tubuh.');
  insProduct.run('Meja Lipat Minimalis', 'Perabot', 320000, 25, 'Meja kerja lipat dari kayu jati, ringan dan mudah disimpan.');
  insProduct.run('Batik Pria Premium', 'Fashion', 250000, 40, 'Kemeja batik cap dengan motif kontemporer, adem dipakai seharian.');
  insProduct.run('Madu Hutan Murni 500ml', 'Makanan', 150000, 60, 'Madu hutan asli tanpa campuran, kaya antioksidan alami.');
  insProduct.run('Kasur King Size', 'Perabot', 2900000, 5, 'Busana latex empuk dengan support optimal, garansi 10 tahun.');
  insProduct.run('Termometer Digital', 'Kesehatan', 99000, 90, 'Pembacaan suhu akurat dalam 5 detik, cocok untuk keluarga.');
}

const pelangganCount = db.prepare('SELECT COUNT(*) AS n FROM pelanggan').get().n;
if (pelangganCount === 0) {
  const insPel = db.prepare('INSERT INTO pelanggan (username, nama, alamat) VALUES (?, ?, ?)');
  insPel.run('budi', 'Budi Santoso', 'Jl. Melati No. 12, Bandung');
  insPel.run('citra', 'Citra Dewi', 'Jl. Kenanga No. 8, Jakarta');
  insPel.run('dian', 'Dian Permata', 'Jl. Anggrek No. 21, Surabaya');
}

const pesananCount = db.prepare('SELECT COUNT(*) AS n FROM pesanan').get().n;
if (pesananCount === 0) {
  const insPes = db.prepare('INSERT INTO pesanan (kode, pelanggan, produk, total) VALUES (?, ?, ?, ?)');
  insPes.run('INV-2026-0001', 'budi', 'Smart TV 43"', 3500000);
  insPes.run('INV-2026-0002', 'citra', 'Kemeja Flanel', 189000);
  insPes.run('INV-2026-0003', 'budi', 'Kopi Arabika Gayo 250g', 255000);
  insPes.run('INV-2026-0004', 'dian', 'Headphone Wireless Pro', 1250000);
  insPes.run('INV-2026-0005', 'citra', 'Vitamin C 1000mg', 135000);
  insPes.run('INV-2026-0006', 'dian', 'Sepatu Running Ringan', 459000);
}

module.exports = db;