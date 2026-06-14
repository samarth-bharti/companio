'use client';

import type { FormEvent } from 'react';
import { ChevronLeft, Mail } from 'lucide-react';

interface Props {
  state:    'input' | 'sent';
  email:    string;
  err:      string;
  setEmail: (v: string) => void;
  setErr:   (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onBack:   () => void;
}

const INPUT_STYLE = {
  background: 'var(--color-bg)',
  border:     '1.5px solid rgba(20,26,46,0.14)',
  color:      'var(--color-ink)',
};

export function ForgotFlow({ state, email, err, setEmail, setErr, onSubmit, onBack }: Props) {
  if (state === 'sent') {
    return (
      <div className="text-center py-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--color-azure-tint)' }}
          aria-hidden="true"
        >
          <Mail size={24} style={{ color: 'var(--color-azure)' }} aria-hidden="true" />
        </div>
        <h1
          className="font-display text-h2 leading-tight tracking-tight mb-2"
          style={{ color: 'var(--color-ink)' }}
        >
          Check your email
        </h1>
        <p className="font-sans text-sm mb-6" style={{ color: 'var(--color-ink-muted)' }}>
          Reset link sent to{' '}
          <strong style={{ color: 'var(--color-ink)' }}>{email}</strong>
          {' '}, demo mode, no real email sent.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="font-sans text-sm font-semibold inline-flex items-center gap-1.5 mx-auto hover:underline underline-offset-2"
          style={{ color: 'var(--color-azure)' }}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1
          className="font-display text-h2 leading-tight tracking-tight mb-1"
          style={{ color: 'var(--color-ink)' }}
        >
          Reset your password
        </h1>
        <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div>
          <label
            htmlFor="forgot-email"
            className="block font-sans font-semibold text-sm mb-1.5"
            style={{ color: 'var(--color-ink)' }}
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-ink-muted)' }}
              aria-hidden="true"
            />
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErr(''); }}
              placeholder="you@example.com"
              className="w-full h-12 pl-10 pr-4 rounded-xl font-sans text-sm"
              style={{
                ...INPUT_STYLE,
                border: `1.5px solid ${err ? '#C0392B' : 'rgba(20,26,46,0.14)'}`,
              }}
              aria-describedby={err ? 'forgot-err' : undefined}
            />
          </div>
          {err && (
            <p
              id="forgot-err"
              role="alert"
              aria-live="polite"
              className="mt-1 font-sans text-xs"
              style={{ color: '#C0392B' }}
            >
              {err}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="h-11 rounded-pill font-sans font-bold text-sm text-white"
          style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
        >
          Send reset link
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="mt-4 font-sans text-sm font-semibold inline-flex items-center gap-1.5 hover:underline underline-offset-2"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Back to sign in
      </button>
    </div>
  );
}
