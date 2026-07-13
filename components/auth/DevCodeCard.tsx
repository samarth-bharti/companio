'use client';

/**
 * The sign-in code, shown on screen, because there is no inbox for it to go to.
 *
 * With no RESEND_API_KEY the code was written to the server's terminal and
 * nowhere else — so the only person who could sign in to a test deployment was
 * whoever happened to be watching `next dev` scroll past. Everyone else typed
 * their email, was told to "check your inbox", and waited for an email that was
 * never sent.
 *
 * This can never appear in production: sendSignInCode() refuses outright when
 * email is unconfigured there, so the server never produces a code to show.
 */
export function DevCodeCard({ code }: { code: string }) {
  return (
    <div
      className="mb-5 rounded-xl px-4 py-3.5"
      style={{
        background: 'rgba(255,178,62,0.12)',
        border: '1px solid rgba(255,178,62,0.45)',
      }}
      role="status"
    >
      <p
        className="font-sans text-xs font-bold uppercase tracking-widest mb-1.5"
        style={{ color: '#8A5A00' }}
      >
        🧪 Test mode · your code
      </p>
      <p
        className="font-display font-bold tabular-nums leading-none mb-1.5"
        style={{ fontSize: '2.25rem', letterSpacing: '0.2em', color: 'var(--color-ink)' }}
      >
        {code}
      </p>
      <p className="font-sans text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
        No email service is connected, so this was not sent anywhere. Adding a
        RESEND_API_KEY emails it instead, and this box disappears.
      </p>
    </div>
  );
}
