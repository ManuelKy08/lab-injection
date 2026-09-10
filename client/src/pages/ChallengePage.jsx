import { useParams, Link } from 'react-router-dom';
import { CHALLENGES, getChallenge, KATEGORI } from '../data/challenges';
import HintAccordion from '../components/HintAccordion';
import CodeTabs from '../components/CodeTabs';
import SecretForm from '../components/SecretForm';
import { loadProgress, isSolved } from '../lib/progress';
import { useState } from 'react';

export default function ChallengePage() {
  const { id } = useParams();
  const c = getChallenge(id);
  const [progress, setProgress] = useState(loadProgress());

  if (!c) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold">Challenge tidak ditemukan</h1>
        <Link to="/dashboard" className="btn btn-ghost mt-4">Kembali ke Dashboard</Link>
      </div>
    );
  }

  const kategori = KATEGORI.find((k) => c.kategori.toLowerCase().startsWith(k.id));
  const solved = isSolved(progress, c.id);
  const idx = CHALLENGES.findIndex((x) => x.id === c.id);
  const prev = CHALLENGES[idx - 1];
  const next = CHALLENGES[idx + 1];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* breadcrumb */}
      <div className="mono mb-4 flex items-center gap-2 text-[12px] text-[var(--color-muted)]">
        <Link to="/" className="hover:text-[var(--color-accent)]">lab</Link>
        <span>/</span>
        <Link to={`/kategori/${kategori?.id || c.kategori.toLowerCase()}`} className="hover:text-[var(--color-accent)]">{kategori?.label}</Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">{c.id}</span>
      </div>

      {/* header */}
      <div className="card mb-5 p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="chip mono" style={{ color: kategori?.warna, borderColor: `${kategori?.warna}44` }}>
            {kategori?.label.split(' ')[0].toUpperCase()}
          </span>
          <span className="chip">{c.level}</span>
          <span className="chip mono">target: {c.target}</span>
          {solved && (
            <span className="chip mono text-[var(--color-ok)]" style={{ borderColor: 'rgba(74,222,128,0.35)' }}>
              ✓ Selesai
            </span>
          )}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">{c.judul}</h1>
        <p className="muted mt-2 text-[14px] leading-relaxed">{c.deskripsi}</p>
        <div className="mono mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel2)] px-3 py-2 text-[12.5px] text-[var(--color-accent)]">
          {c.endpoint}
        </div>
      </div>

      {/* navigasi challenge */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        {prev ? (
          <Link to={prev.url} className="card card-hover p-3 text-left">
            <div className="mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">← Sebelumnya</div>
            <div className="truncate text-[14px] font-semibold">{prev.id} · {prev.judul}</div>
          </Link>
        ) : <div />}
        {next && (
          <Link to={next.url} className="card card-hover p-3 text-right">
            <div className="mono text-[11px] uppercase tracking-wider text-[var(--color-muted)]">Berikutnya →</div>
            <div className="truncate text-[14px] font-semibold">{next.id} · {next.judul}</div>
          </Link>
        )}
      </div>

      {/* hint */}
      <div className="mb-5">
        <HintAccordion hint={c.hint} payload={c.payload} />
      </div>

      {/* kode rentan vs aman */}
      <div className="mb-5">
        <CodeTabs kodeRentan={c.kodeRentan} kodeAman={c.kodeAman} payload={c.payload} />
      </div>

      {/* akar masalah */}
      <div className="card mb-5 p-4">
        <div className="section-title mb-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)]">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
          Akar Masalah
        </div>
        <p className="muted text-[13.5px] leading-relaxed">{c.rootCause}</p>
      </div>

      {/* verifikasi hasil eksploitasi */}
      <div className="mb-8">
        <SecretForm
          challengeId={c.id}
          onSolved={() => {
            setProgress(loadProgress());
          }}
        />
      </div>
    </div>
  );
}