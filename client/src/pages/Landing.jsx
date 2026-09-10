import { Link } from 'react-router-dom';
import { CHALLENGES, KATEGORI } from '../data/challenges';
import { loadProgress, countSolved } from '../lib/progress';

export default function Landing() {
  const solved = countSolved(loadProgress());

  const byKategori = KATEGORI.map((k) => ({
    ...k,
    items: CHALLENGES.filter((c) => c.kategori.toLowerCase().startsWith(k.id)),
  }));

  return (
    <div>
      {/* Banner edukasi */}
      <div className="border-b border-[rgba(255,180,85,0.25)] bg-[rgba(255,180,85,0.06)]">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffb455" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <p className="mono text-[12.5px] text-[var(--color-warn)]">
            FOR LOCAL/EDUCATIONAL USE ONLY — do not expose to public internet
          </p>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 text-center">
        <div className="mono mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-[11.5px] text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-ok)]" />
          target aktif · localhost:8100
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Injection<span className="text-[var(--color-accent)]"> Lab</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--color-muted)]">
          Lab latihan <strong className="text-[var(--color-text)]">SQL Injection</strong> di SQLite &{' '}
          <strong className="text-[var(--color-text)]">NoSQL/Operator Injection</strong> di MongoDB.
          Eksploitasi 10 endpoint yang sengaja dibuat rentan, pahami akar masalah, lalu bandingkan dengan
          versi amannya. Jalankan <code className="mono text-[var(--color-accent)]">npm run lab:start</code> untuk
          menghidupkan target.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link to="/dashboard" className="btn btn-primary">
            Mulai Eksploitasi
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <a href="#daftar" className="btn btn-ghost">Lihat Challenge</a>
        </div>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-3">
          <div className="card p-4">
            <div className="mono text-2xl font-bold text-[var(--color-accent)]">10</div>
            <div className="muted text-[12px]">Challenge</div>
          </div>
          <div className="card p-4">
            <div className="mono text-2xl font-bold text-[var(--color-ok)]">{solved}</div>
            <div className="muted text-[12px]">Terselesaikan</div>
          </div>
          <div className="card p-4">
            <div className="mono text-2xl font-bold text-[var(--color-warn)]">6+4</div>
            <div className="muted text-[12px]">SQLi + NoSQLi</div>
          </div>
        </div>
      </section>

      {/* Daftar challenge per kategori */}
      <section id="daftar" className="mx-auto max-w-6xl px-4 pb-14">
        {byKategori.map((k) => (
          <div key={k.id} className="mb-10">
            <div className="section-title mb-3" style={{ color: k.warna }}>
              <span className="h-2 w-2 rounded-sm" style={{ background: k.warna }} />
              {k.label}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {k.items.map((c) => (
                <Link key={c.id} to={c.url} className="card card-hover block p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
                      {c.id}
                    </span>
                    <span className="chip">{c.level}</span>
                  </div>
                  <div className="mb-1 text-[15px] font-bold">{c.judul}</div>
                  <p className="muted line-clamp-2 text-[12.5px] leading-relaxed">{c.deskripsi}</p>
                  <div className="mono mt-3 text-[11.5px] text-[var(--color-accent)]">
                    target: {c.target} · {c.endpoint}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>

      <footer className="border-t border-[var(--color-border)] py-6">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <p className="mono text-[11.5px] text-[var(--color-muted)]">
            vulnlab · vulnerability lab — SQLi & NoSQLi · dibuat untuk pembelajaran keamanan aplikasi web
          </p>
        </div>
      </footer>
    </div>
  );
}