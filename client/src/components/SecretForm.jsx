import { useState } from 'react';
import { verifySecret } from '../lib/api';
import { loadProgress, saveProgress } from '../lib/progress';

// Form verifikasi: membandingkan data alami yang berhasil diekstrak (api key,
// hash, email, recovery code, dst) dengan nilai yang tersimpan di aplikasi.
export default function SecretForm({ challengeId, onSolved }) {
  const [secret, setSecret] = useState('');
  const [state, setState] = useState('idle'); // idle | checking | success | error
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setState('checking');
    setMsg('');
    const r = await verifySecret(challengeId, secret.trim());
    if (r.status === 200 && r.data?.solved) {
      const progress = loadProgress();
      progress[challengeId] = true;
      saveProgress(progress);
      setState('success');
      setMsg('Data cocok — challenge terselesaikan!');
      if (onSolved) onSolved();
    } else {
      setState('error');
      setMsg('Data belum cocok, coba lagi.');
    }
  };

  return (
    <form onSubmit={submit} className="card p-4">
      <div className="section-title mb-2">
        Verifikasi Hasil
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="input mono"
          placeholder="Data rahasia yang bocor..."
          value={secret}
          onChange={(e) => {
            setSecret(e.target.value);
            if (state !== 'idle') setState('idle');
          }}
          spellCheck={false}
        />
        <button
          type="submit"
          className="btn btn-primary shrink-0"
          disabled={state === 'checking' || !secret.trim()}
        >
          {state === 'checking' ? 'Memeriksa...' : 'Verifikasi'}
        </button>
      </div>

      {state === 'success' && (
        <p className="mono mt-3 rounded-lg border border-[var(--color-ok)]/30 bg-[rgba(74,222,128,0.08)] px-3 py-2 text-[13px] text-[var(--color-ok)]">
          {msg}
        </p>
      )}
      {state === 'error' && (
        <p className="mono mt-3 rounded-lg border border-[var(--color-danger)]/30 bg-[rgba(255,107,107,0.08)] px-3 py-2 text-[13px] text-[var(--color-danger)]">
          {msg}
        </p>
      )}
    </form>
  );
}