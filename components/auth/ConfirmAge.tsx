'use client';

import { useState, type FormEvent } from 'react';
import { CalendarDays, ShieldCheck } from 'lucide-react';
import { dataClient } from '@/lib/dataClient';
import { isAdult, parseDateOfBirth, maxAdultDob, MIN_AGE } from '@/lib/age';

/**
 * "Confirm your date of birth."
 *
 * Google OAuth does not give us a date of birth, so a user who signs in that way
 * has none — and `POST /api/bookings` and `POST /api/application` both refuse
 * with `403 age_verification_required` without one. Without this screen that is
 * a dead end the user cannot escape.
 *
 * It is deliberately shown at the *commitment* step (booking, applying) rather
 * than at sign-in: browsing stays frictionless, and we only ask for a date of
 * birth at the moment we actually need it. Same principle as AccountGate.
 *
 * The check here is a courtesy — the server re-runs it, from the same code
 * (`lib/age.ts`), and stores the value set-once.
 */
export function ConfirmAge({
  firstName,
  onConfirmed,
}: {
  firstName?: string;
  /** Called once the date of birth is persisted. Re-read the user afterwards. */
  onConfirmed: () => void;
}) {
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = parseDateOfBirth(dob);
    if (!parsed) {
      setError('Please enter your date of birth.');
      return;
    }
    if (!isAdult(parsed)) {
      setError(`Companio is for adults aged ${MIN_AGE} and over.`);
      return;
    }

    setSaving(true);
    try {
      const user = await dataClient.getUser();
      await dataClient.setUser({
        firstName: user?.firstName ?? firstName ?? 'Friend',
        city: user?.city,
        dateOfBirth: dob,
      });
      onConfirmed();
    } catch {
      // The server rejects an under-18 date with a 403 even if the client check
      // somehow passed. Say something true rather than "saved!".
      setError('We could not save that. Please check the date and try again.');
      setSaving(false);
    }
  }

  return (
    <main
      className="min-h-[70vh] flex items-center justify-center px-6 py-16"
      style={{ background: 'var(--grad-hero-bg)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8 md:p-10"
        style={{
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-lift)',
          border: '1px solid rgba(46,107,255,0.12)',
        }}
      >
        <span
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
          style={{ background: 'var(--color-azure-tint)', color: 'var(--color-azure)' }}
          aria-hidden="true"
        >
          <CalendarDays size={22} strokeWidth={1.8} />
        </span>

        <h1
          className="font-display text-h2 leading-tight tracking-tight mb-2"
          style={{ color: 'var(--color-ink)' }}
        >
          One quick thing{firstName ? `, ${firstName}` : ''}.
        </h1>
        <p className="font-sans text-sm mb-7" style={{ color: 'var(--color-ink-muted)' }}>
          Companio is strictly for adults, so we need your date of birth before your first meetup.
          We ask once, and we never show it on your profile.
        </p>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="confirm-dob"
              className="block font-sans font-semibold text-sm mb-1.5"
              style={{ color: 'var(--color-ink)' }}
            >
              Date of birth
            </label>
            <input
              id="confirm-dob"
              type="date"
              required
              value={dob}
              max={maxAdultDob()}
              onChange={(e) => { setDob(e.target.value); if (error) setError(null); }}
              className="w-full h-12 px-4 rounded-xl font-sans text-sm"
              style={{
                background: 'var(--color-bg)',
                border: `1.5px solid ${error ? '#C0392B' : 'rgba(20,26,46,0.14)'}`,
                color: 'var(--color-ink)',
              }}
              aria-describedby={error ? 'confirm-dob-err' : undefined}
            />
            {error && (
              <p
                id="confirm-dob-err"
                role="alert"
                className="mt-1.5 font-sans text-xs"
                style={{ color: '#C0392B' }}
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="h-12 rounded-pill font-sans font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
          >
            {saving ? 'Saving…' : 'Confirm and continue →'}
          </button>
        </form>

        <div
          className="flex items-center justify-center gap-1.5 mt-6 font-sans text-xs"
          style={{ color: '#157A4A' }}
        >
          <ShieldCheck size={13} aria-hidden="true" />
          Private. Used only to confirm you&rsquo;re {MIN_AGE} or over.
        </div>
      </div>
    </main>
  );
}
