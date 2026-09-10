import { useState } from 'react';

export default function HintAccordion({ hint, payload }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition hover:bg-[var(--color-panel2)]"
      >
        <span className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-warn)]">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
          Hint & Strategi
        </span>
        <span className={`text-[var(--color-muted)] transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-[var(--color-border)] px-4 py-3 text-sm leading-relaxed">
          <p className="muted">{hint}</p>
          <div className="mt-3">
            <div className="mono mb-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Contoh Payload
            </div>
            <pre className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel2)] p-3 text-[12.5px] text-[var(--color-accent)]">
              {payload}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}