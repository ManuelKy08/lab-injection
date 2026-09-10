import { Link, useLocation } from 'react-router-dom';
import { KATEGORI } from '../data/challenges';
import { loadProgress, countSolved } from '../lib/progress';

export default function Navbar() {
  const loc = useLocation();
  const progress = loadProgress();
  const solved = countSolved(progress);
  const total = 10;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-sm font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-accent)] text-[#06121f]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <span className="mono text-[15px]">
            vuln<span className="text-[var(--color-accent)]">lab</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {KATEGORI.map((k) => (
            <Link
              key={k.id}
              to={`/kategori/${k.id}`}
              className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                loc.pathname.includes(`/kategori/${k.id}`)
                  ? 'bg-[var(--color-panel2)] text-[var(--color-accent)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {k.label}
            </Link>
          ))}
          <Link
            to="/dashboard"
            className={`ml-1 rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
              loc.pathname === '/dashboard'
                ? 'bg-[var(--color-panel2)] text-[var(--color-accent)]'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            Dashboard
          </Link>
        </nav>

        <div
          className="mono hidden items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs sm:flex"
          title="Progress challenge"
        >
          <span className={solved === total ? 'text-[var(--color-ok)]' : 'text-[var(--color-accent)]'}>
            {solved}/{total}
          </span>
          <span className="h-1 w-16 overflow-hidden rounded-full bg-[var(--color-panel2)]">
            <span
              className="block h-full rounded-full bg-[var(--color-accent)] transition-all"
              style={{ width: `${(solved / total) * 100}%` }}
            />
          </span>
        </div>
      </div>
    </header>
  );
}