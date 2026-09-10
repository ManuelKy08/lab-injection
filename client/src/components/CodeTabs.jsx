import { useState } from 'react';

function CodeBlock({ code, label, accent }) {
  return (
    <div>
      <div className="mono mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
        {label}
      </div>
      <pre className={`overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel2)] p-3 text-[12.5px] leading-relaxed ${accent ? '' : ''}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function CodeTabs({ kodeRentan, kodeAman, payload }) {
  const [tab, setTab] = useState('vuln');

  return (
    <div className="card overflow-hidden">
      <div className="flex border-b border-[var(--color-border)]">
        <button
          onClick={() => setTab('vuln')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition ${
            tab === 'vuln'
              ? 'border-b-2 border-[var(--color-danger)] text-[var(--color-danger)]'
              : 'muted hover:text-[var(--color-text)]'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[var(--color-danger)]" />
          Kode Rentan
        </button>
        <button
          onClick={() => setTab('fixed')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold transition ${
            tab === 'fixed'
              ? 'border-b-2 border-[var(--color-ok)] text-[var(--color-ok)]'
              : 'muted hover:text-[var(--color-text)]'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-[var(--color-ok)]" />
          Kode Aman
        </button>
      </div>

      <div className="p-4">
        <CodeBlock
          code={tab === 'vuln' ? kodeRentan : kodeAman}
          label={tab === 'vuln' ? 'server/routes — versi vulnerable' : 'server/routes — versi fixed'}
          accent={tab === 'vuln' ? 'var(--color-danger)' : 'var(--color-ok)'}
        />
        {payload && (
          <p className="muted mt-3 text-[12.5px]">
            Payload eksploitasi dapat dilihat di bagian Hint.
          </p>
        )}
      </div>
    </div>
  );
}