'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';

const TOPICS = [
  { value: 'support', label: 'Account, bookings, or payments' },
  { value: 'safety', label: 'A safety concern' },
  { value: 'privacy', label: 'Privacy or my data' },
  { value: 'companion', label: 'Becoming a companion' },
  { value: 'other', label: 'Something else' },
] as const;

const FIELD = 'w-full rounded-xl font-sans text-sm px-4';
const FIELD_STYLE = {
  background: 'var(--color-bg)',
  border: '1.5px solid rgba(20,26,46,0.14)',
  color: 'var(--color-ink)',
};

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/**
 * The real contact form. `/contact` used to list four email addresses and
 * nothing else — a page that describes how to reach us is not a way to reach us.
 *
 * The reference id returned on success is the ContactMessage row id. It is shown
 * because it is genuinely useful: it is what support will ask for, and it proves
 * the message was stored rather than merely accepted.
 */
export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<string>('support');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (sending) return;

    if (!name.trim()) return setError('Please tell us your name.');
    if (!isEmail(email)) return setError('Please enter a valid email address, so we can reply.');
    if (message.trim().length < 10) return setError('Please tell us a little more (at least 10 characters).');

    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = (await res.json().catch(() => ({}))) as { reference?: string; error?: string };
      if (!res.ok) {
        setError(
          data.error === 'rate_limited'
            ? 'You have sent several messages just now. Please wait a minute.'
            : data.error === 'unavailable'
              ? 'Our contact form is temporarily unavailable. Please email us directly.'
              : 'We could not send that. Please check the form and try again.',
        );
        setSending(false);
        return;
      }
      setReference(data.reference ?? 'received');
    } catch {
      setError('Network error. Please check your connection and try again.');
      setSending(false);
    }
  }

  if (reference) {
    return (
      <div
        className="rounded-2xl p-6 flex flex-col items-start gap-2"
        style={{ background: 'rgba(31,174,107,0.06)', border: '1.5px solid rgba(31,174,107,0.22)' }}
      >
        <CheckCircle2 size={22} style={{ color: '#157A4A' }} aria-hidden="true" />
        <p className="font-sans font-bold text-base" style={{ color: 'var(--color-ink)' }}>
          Message received.
        </p>
        <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          We aim to reply within one business day, to <strong>{email}</strong>. Safety reports jump the
          queue.
        </p>
        <p className="font-sans text-xs mt-1" style={{ color: 'var(--color-ink-muted)' }}>
          Your reference: <code>{reference}</code>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4" aria-label="Contact Companio">
      <div>
        <label htmlFor="ct-name" className="block font-sans font-semibold text-sm mb-1.5" style={{ color: 'var(--color-ink)' }}>
          Your name
        </label>
        <input
          id="ct-name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          className={`${FIELD} h-12`}
          style={FIELD_STYLE}
        />
      </div>

      <div>
        <label htmlFor="ct-email" className="block font-sans font-semibold text-sm mb-1.5" style={{ color: 'var(--color-ink)' }}>
          Your email
        </label>
        <input
          id="ct-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="you@example.com"
          className={`${FIELD} h-12`}
          style={FIELD_STYLE}
        />
      </div>

      <div>
        <label htmlFor="ct-topic" className="block font-sans font-semibold text-sm mb-1.5" style={{ color: 'var(--color-ink)' }}>
          What is this about?
        </label>
        <select
          id="ct-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className={`${FIELD} h-12`}
          style={FIELD_STYLE}
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ct-message" className="block font-sans font-semibold text-sm mb-1.5" style={{ color: 'var(--color-ink)' }}>
          Your message
        </label>
        <textarea
          id="ct-message"
          rows={5}
          value={message}
          onChange={(e) => { setMessage(e.target.value); setError(''); }}
          maxLength={4000}
          className={`${FIELD} py-3 resize-y`}
          style={FIELD_STYLE}
        />
      </div>

      {topic === 'safety' && (
        <p
          className="rounded-xl px-4 py-3 font-sans text-xs leading-relaxed"
          style={{ background: 'rgba(192,57,43,0.05)', border: '1.5px solid rgba(192,57,43,0.18)', color: '#A93226' }}
          role="note"
        >
          If you are in immediate danger, call <strong>112</strong>. Use the in-app SOS during a meetup.
          This form is for reporting after the fact.
        </p>
      )}

      {error && (
        <p role="alert" aria-live="polite" className="font-sans text-xs" style={{ color: '#C0392B' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="h-12 rounded-pill font-sans font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-70"
        style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
      >
        {sending ? (
          <>
            <span
              className="w-4 h-4 rounded-full animate-spin shrink-0"
              style={{ border: '2px solid #fff', borderTopColor: 'transparent' }}
              aria-hidden="true"
            />
            Sending…
          </>
        ) : (
          'Send message'
        )}
      </button>
    </form>
  );
}
