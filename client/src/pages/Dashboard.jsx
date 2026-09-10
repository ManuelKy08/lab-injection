import { Link } from 'react-router-dom';
import { CHALLENGES, getChallenge } from '../data/challenges';
import { loadProgress, isSolved } from '../lib/progress';

export default function Dashboard() {
  const progress = loadProgress();
  const solvedCount = CHALLENGES.filter((c) => isSolved(progress, c.id)).length;
  const pct = Math.round((solvedCount / CHALLENGES.length) * 100);

  const rows = [...CHALLENGES].sort((a, b) => {
    const sa = isSolved(progress, a.id) ? 1 : 0;
    const sb = isSolved(progress, b.id) ? 1 : 0;
    return sa - sb || a.id.localeCompare(b.id);
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight">Dashboard</h1>
      <p className="muted mb-6 text-[13.5px]">Pantau progres eksploitasi 10 challenge.</p>

      {/* Progress ringkasan */}
      <div className="card mb-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mono text-3xl font-bold text-[var(--color-accent)]">
              {solvedCount}<span className="text-[var(--color-muted)]">/{CHALLENGES.length}</span>
            </div>
            <div className="muted text-[12.5px]">challenge terselesaikan</div>
          </div>
          <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-[var(--color-panel2)]">
            <div
              className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mono text-sm text-[var(--color-muted)]">{pct}%</div>
        </div>
      </div>

      {/* Tabel challenge */}
      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[80px_1fr_90px_70px_130px] gap-3 border-b border-[var(--color-border)] bg-[var(--color-panel2)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] sm:grid">
          <span>ID</span>
          <span>Challenge</span>
          <span>Level</span>
          <span>Status</span>
          <span className="text-right">Endpoint</span>
        </div>
        {rows.map((c) => {
          const solved = isSolved(progress, c.id);
          const meta = getChallenge(c.id);
          return (
            <Link
              key={c.id}
              to={c.url}
              className="grid grid-cols-[80px_1fr_90px_70px] gap-3 border-b border-[var(--color-border)] px-4 py-3 transition last:border-b-0 hover:bg-[var(--color-panel2)] sm:grid-cols-[80px_1fr_90px_70px_130px]"
            >
              <span className="mono mt-0.5 text-[12px] text-[var(--color-muted)]">{c.id}</span>
              <span className="truncate text-[14px] font-semibold">{c.judul}</span>
              <span className="chip mt-0.5 h-fit">{c.level}</span>
              <span className="mt-0.5">
                {solved ? (
                  <span className="mono inline-flex items-center gap-1.5 text-[12px] text-[var(--color-ok)]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Selesai
                  </span>
                ) : (
                  <span className="mono text-[12px] text-[var(--color-muted)]">—</span>
                )}
              </span>
              <span className="mono hidden truncate text-right text-[11.5px] text-[var(--color-accent)] sm:block">
                {meta?.endpoint}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}