// server/db/mongo.js
// Inisialisasi koneksi MongoDB (lab_injection) + seed data realistis.
// TIDAK ada koleksi "flags" — challenge membocorkan data alami: api key,
// recovery code, token sesi, dan kode batch produk tersembunyi.
const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const MONGO_DB = 'lab_injection';

let client = null;
let db = null;

async function connect() {
  if (db) return db;
  client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 4000,
  });
  await client.connect();
  db = client.db(MONGO_DB);
  await seed(db);
  return db;
}

async function seed(db) {
  // users
  const userCount = await db.collection('users').countDocuments();
  if (userCount === 0) {
    await db.collection('users').insertMany([
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        nama: 'Administrator Utama',
        email: 'admin@vulnlab.test',
        secret: 'sk_admin_7Kq9mZ2pXv5nB4', // api key (nosql-1)
        recovery: 'REC-4F9K-8Q2M-7X3B', // recovery code (nosql-2)
        token: 'ses_8f3Kq9mZ2pXv5nB7c4wL6dR', // token sesi (nosql-4)
      },
      {
        username: 'budi',
        password: 'budi123',
        role: 'user',
        nama: 'Budi Santoso',
        email: 'budi@vulnlab.test',
      },
      {
        username: 'citra',
        password: 'citra123',
        role: 'user',
        nama: 'Citra Dewi',
        email: 'citra@vulnlab.test',
      },
      {
        username: 'dian',
        password: 'dian123',
        role: 'user',
        nama: 'Dian Permata',
        email: 'dian@vulnlab.test',
      },
    ]);
  }

  // products
  const productCount = await db.collection('products').countDocuments();
  if (productCount === 0) {
    await db.collection('products').insertMany([
      { name: 'Smart TV 43"', kategori: 'Elektronik', harga: 3500000, stok: 12, visible: true },
      { name: 'Kemeja Flanel', kategori: 'Fashion', harga: 189000, stok: 45, visible: true },
      { name: 'Kopi Arabika Gayo 250g', kategori: 'Makanan', harga: 85000, stok: 120, visible: true },
      { name: 'Headphone Wireless Pro', kategori: 'Elektronik', harga: 1250000, stok: 8, visible: true },
      { name: 'Sepatu Running Ringan', kategori: 'Fashion', harga: 459000, stok: 30, visible: true },
      { name: 'Rice Cooker 1.8L', kategori: 'Elektronik', harga: 299000, stok: 55, visible: true },
      { name: 'Vitamin C 1000mg', kategori: 'Kesehatan', harga: 45000, stok: 200, visible: true },
      { name: 'Meja Lipat Minimalis', kategori: 'Perabot', harga: 320000, stok: 25, visible: true },
      { name: 'Batik Pria Premium', kategori: 'Fashion', harga: 250000, stok: 40, visible: true },
      { name: 'Madu Hutan Murni 500ml', kategori: 'Makanan', harga: 150000, stok: 60, visible: true },
      { name: 'Kasur King Size', kategori: 'Perabot', harga: 2900000, stok: 5, visible: true },
      { name: 'Termometer Digital', kategori: 'Kesehatan', harga: 99000, stok: 90, visible: true },
      {
        name: 'Produk Rahasia VVIP',
        kategori: 'Eksklusif',
        harga: 50000000,
        stok: 2,
        visible: false,
        deskripsi: 'Batch eksklusif: BATCH-VVIP-2026-9X4K', // kode batch (nosql-3)
      },
    ]);
  }
}

async function disconnect() {
  if (client) await client.close();
}

module.exports = { connect, disconnect };