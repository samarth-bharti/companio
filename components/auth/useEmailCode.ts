'use client';

import { useCallback, useState } from 'react';
import { signIn } from 'next-auth/react';

/**
 * The passwordless email flow, in one place, so /login and /register cannot
 * drift into two different notions of "verified".
 *
 * `send` asks the server to mint and deliver a code. `verify` hands the code to
 * next-auth's `email-otp` provider, which is the ONLY thing in this codebase
 * that can create a session. Nothing here decides whether a code is correct —
 * that answer lives on the server and arrives as a real session or not at all.
 *
 * `delivery: 'console'` means the deployment has no RESEND_API_KEY and printed
 * the code to its server log instead. Only possible outside production, and the
 * code is still checked for real. The UI must say so rather than claim an email
 * was sent.
 */

export type Delivery = 'email' | 'console';

const SEND_ERRORS: Record<string, string> = {
  rate_limited: 'Too many code requests. Please wait a minute and try again.',
  too_many_requests: 'Too many codes sent to that address. Try again in an hour.',
  email_unconfigured: 'Email sign-in is temporarily unavailable. Please use Google.',
  send_failed: "We couldn't deliver that code. Check the address, or use Google.",
  auth_unconfigured: 'Sign-in is not available on this deployment.',
  invalid_email: 'Please enter a valid email address.',
};

export function useEmailCode() {
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [error, setError] = useState('');

  const send = useCallback(async (email: string): Promise<boolean> => {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        delivery?: Delivery;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(SEND_ERRORS[data.error ?? ''] ?? 'Something went wrong. Please try again.');
        return false;
      }
      setDelivery(data.delivery ?? 'email');
      return true;
    } catch {
      setError('Network error. Check your connection and try again.');
      return false;
    } finally {
      setSending(false);
    }
  }, []);

  /**
   * Exchange a code for a session. Returns true only when next-auth confirms
   * one was created — a wrong code resolves with `ok: false`, never a session.
   *
   * `redirect: false` keeps us on the page so the caller can run its own
   * transition. The session cookie is already set by the time this resolves.
   */
  const verify = useCallback(
    async (email: string, code: string, firstName?: string): Promise<boolean> => {
      setVerifying(true);
      setError('');
      try {
        const res = await signIn('email-otp', { email, code, firstName, redirect: false });
        if (!res?.ok) {
          setError('That code is not right, or it has expired. Request a new one.');
          return false;
        }
        return true;
      } catch {
        setError('Network error. Check your connection and try again.');
        return false;
      } finally {
        setVerifying(false);
      }
    },
    [],
  );

  return { send, verify, sending, verifying, delivery, error, setError };
}
