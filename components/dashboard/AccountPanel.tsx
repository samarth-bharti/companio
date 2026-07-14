'use client';

// The privacy policy says, in the section about your rights under the DPDP Act:
// "You can export or delete your account data anytime from settings." There was
// no settings screen. /api/user/export and /api/user/delete both existed, both
// worked, and nothing in the entire app called either one — so the sentence was
// false, in a document that is legally binding. This panel is what makes it true.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Download, Trash2, AlertTriangle, IndianRupee } from 'lucide-react';
import { dataClient, isServerBacked, localStorageKeys } from '@/lib/dataClient';
import { useData } from '@/lib/useData';
import { useViewerReady } from '@/lib/useViewerReady';
import { COMPANY, GRIEVANCE_OFFICER_PHRASE } from '@/lib/company';
import { formatPaise } from '@/lib/money';
import { getConsent, setConsent, onConsentChange, type ConsentState } from '@/lib/consent';
import { spring } from '@/lib/motion';

/** Typed exactly, in capitals, before the delete button arms. */
const CONFIRM_WORD = 'DELETE';

type DeleteState = 'idle' | 'working' | 'error';
type RefundState = 'idle' | 'working' | 'done' | 'error';

/** What the server says is refundable, if anything. */
type RefundOffer = { eligible: boolean; amountPaise?: number; daysLeft?: number };

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="rounded-lg p-5 mb-4"
      style={{
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow-1)',
        border: '1.5px solid rgba(46,107,255,0.07)',
      }}
    >
      {children}
    </section>
  );
}

/** Server renders nothing consent-shaped — localStorage is a client fact. */
const consentServerSnapshot = (): ConsentState => 'unset';

export function AccountPanel() {
  const signedIn = useViewerReady();
  const reduced = useEffectiveReducedMotion();
  const serverBacked = isServerBacked();

  // The cookie policy says analytics are "aggregate-only … and you can opt out in
  // settings". The consent banner could take a yes, and there was nowhere at all
  // to change it back — under the DPDP Act, withdrawing consent has to be as easy
  // as giving it. Same store the banner writes, so the two can never disagree.
  const consent = useSyncExternalStore(onConsentChange, getConsent, consentServerSnapshot);

  const { data: user } = useData('user', () => dataClient.getUser(), null, signedIn);

  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<DeleteState>('idle');
  const [error, setError] = useState('');

  // Refund eligibility is the SERVER's answer, read from the purchase row. The
  // button only appears when there is genuinely something to refund, so nobody is
  // offered a refund and then told no.
  const [refund, setRefund] = useState<RefundOffer | null>(null);
  const [refundState, setRefundState] = useState<RefundState>('idle');
  const [refundMsg, setRefundMsg] = useState('');

  useEffect(() => {
    // A guest has no purchase to refund, and the route answers 401 for them.
    if (!serverBacked || !signedIn) return;
    let live = true;
    void fetch('/api/user/refund')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: RefundOffer | null) => {
        if (live && d?.eligible) setRefund(d);
      })
      .catch(() => {});
    return () => { live = false; };
  }, [serverBacked, signedIn]);

  const requestRefund = useCallback(async () => {
    setRefundState('working');
    try {
      const res = await fetch('/api/user/refund', { method: 'POST' });
      const body = (await res.json().catch(() => null)) as
        | { ok?: boolean; message?: string; alreadyRequested?: boolean }
        | null;
      if (res.ok && body?.ok) {
        setRefundState('done');
        setRefundMsg(
          body.alreadyRequested
            ? 'That refund is already with us — we are on it.'
            : 'Refund requested. We will process it to your original payment method and email you when it is done.',
        );
        return;
      }
      setRefundState('error');
      setRefundMsg(body?.message ?? 'We could not file that request. Try again in a moment.');
    } catch {
      setRefundState('error');
      setRefundMsg('We could not reach the server. Check your connection and try again.');
    }
  }, []);

  const armed = confirm.trim() === CONFIRM_WORD && state !== 'working';

  /**
   * In local demo mode there is no account on any server: everything this app
   * knows about the visitor is in their own browser. So the export is built here
   * from that same storage, rather than pretending to call an API.
   */
  const exportLocal = useCallback(() => {
    const dump: Record<string, unknown> = {};
    for (const key of localStorageKeys()) {
      const raw = localStorage.getItem(key);
      try {
        dump[key] = raw ? JSON.parse(raw) : null;
      } catch {
        dump[key] = raw; // not JSON — keep the raw string rather than dropping it
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companio-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!armed) return;
    setState('working');
    setError('');

    if (!serverBacked) {
      for (const key of localStorageKeys()) localStorage.removeItem(key);
      window.location.href = '/';
      return;
    }

    try {
      const res = await fetch('/api/user/delete', { method: 'POST' });
      if (res.status === 401) {
        // The session lapsed while the confirmation was being typed.
        window.location.href = '/login?next=/dashboard';
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(
          body?.message ??
            'We could not delete the account just now. Try again, or write to us and we will do it by hand.',
        );
        setState('error');
        return;
      }
      // The account is gone; the session cookie is not. Sign out so the browser
      // is not left holding a token for a user that no longer exists.
      await signOut({ callbackUrl: '/' });
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
      setState('error');
    }
  }, [armed, serverBacked]);

  return (
    <div>
      {/* ── Who you are ─────────────────────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold mb-3" style={{ fontSize: 'var(--text-h4)', color: 'var(--color-ink)' }}>
          Your account
        </h2>
        <dl className="text-sm font-sans">
          <div className="flex justify-between py-1.5">
            <dt style={{ color: 'var(--color-ink-muted)' }}>Name</dt>
            <dd style={{ color: 'var(--color-ink)' }}>{user?.firstName ?? 'Guest'}</dd>
          </div>
          {user?.city && (
            <div className="flex justify-between py-1.5">
              <dt style={{ color: 'var(--color-ink-muted)' }}>City</dt>
              <dd style={{ color: 'var(--color-ink)' }}>{user.city}</dd>
            </div>
          )}
        </dl>
        {!serverBacked && (
          <p className="font-sans text-xs mt-3" style={{ color: 'var(--color-ink-muted)' }}>
            This is a preview build. Everything above is stored in this browser only — it never
            reaches a server.
          </p>
        )}
      </Card>

      {/* ── Right to access (DPDP s.11) ─────────────────────────────────────── */}
      <Card>
        <h2 className="font-display font-bold mb-1" style={{ fontSize: 'var(--text-h4)', color: 'var(--color-ink)' }}>
          Download your data
        </h2>
        <p className="font-sans text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>
          A JSON file with your profile, bookings, messages, saved companions and payments —
          everything we hold about you.
        </p>
        {serverBacked ? (
          // A plain link, not fetch(): the browser handles the Content-Disposition
          // attachment header itself, and a download that survives a slow response
          // beats one held in memory.
          <motion.a
            href="/api/user/export"
            download="companio-data.json"
            whileTap={reduced ? {} : { scale: 0.97 }}
            transition={spring.snappy}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-pill text-sm font-semibold text-white"
            style={{ background: 'var(--grad-cta)' }}
          >
            <Download size={16} aria-hidden="true" />
            Download a copy
          </motion.a>
        ) : (
          <motion.button
            type="button"
            onClick={exportLocal}
            whileTap={reduced ? {} : { scale: 0.97 }}
            transition={spring.snappy}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-pill text-sm font-semibold text-white"
            style={{ background: 'var(--grad-cta)' }}
          >
            <Download size={16} aria-hidden="true" />
            Download a copy
          </motion.button>
        )}
      </Card>

      {/* ── Analytics consent (DPDP: withdrawal must be as easy as consent) ─── */}
      <Card>
        <h2 className="font-display font-bold mb-1" style={{ fontSize: 'var(--text-h4)', color: 'var(--color-ink)' }}>
          Usage analytics
        </h2>
        <p className="font-sans text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>
          Aggregate, privacy-friendly analytics that tell us which features people
          actually use. No ads, no cross-site tracking, no data sales. Turning this off
          stops it immediately.
        </p>

        <button
          type="button"
          role="switch"
          aria-checked={consent === 'granted'}
          onClick={() => setConsent(consent === 'granted' ? 'denied' : 'granted')}
          className="inline-flex items-center gap-3 min-h-[44px]"
        >
          <span
            aria-hidden="true"
            className="relative inline-block rounded-full transition-colors"
            style={{
              width: 44,
              height: 24,
              background: consent === 'granted' ? 'var(--color-azure)' : 'rgba(20,26,46,0.2)',
            }}
          >
            <span
              className="absolute rounded-full bg-white transition-all"
              style={{ width: 18, height: 18, top: 3, left: consent === 'granted' ? 23 : 3 }}
            />
          </span>
          <span className="font-sans text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
            {consent === 'granted' ? 'Analytics on' : 'Analytics off'}
          </span>
        </button>

        {consent === 'unset' && (
          <p className="font-sans text-xs mt-2" style={{ color: 'var(--color-ink-muted)' }}>
            You have not been asked yet, so nothing is being collected.
          </p>
        )}
      </Card>

      {/* ── Refund (the policy's "one tap from your dashboard") ─────────────── */}
      {refund?.eligible && (
        <Card>
          <h2 className="font-display font-bold mb-1" style={{ fontSize: 'var(--text-h4)', color: 'var(--color-ink)' }}>
            Refund your unlock
          </h2>
          <p className="font-sans text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>
            {refundState === 'done'
              ? refundMsg
              : `Didn't find anyone you'd like to meet? Full refund of ${formatPaise(refund.amountPaise ?? 0)}, no questions asked — ${
                  refund.daysLeft === 1 ? 'today is the last day' : `${refund.daysLeft} days left`
                } of the 7-day window.`}
          </p>

          {refundState !== 'done' && (
            <motion.button
              type="button"
              onClick={requestRefund}
              disabled={refundState === 'working'}
              whileTap={reduced ? {} : { scale: 0.97 }}
              transition={spring.snappy}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-pill text-sm font-semibold disabled:opacity-60"
              style={{ border: '1.5px solid var(--color-azure)', color: 'var(--color-azure-deep)' }}
            >
              <IndianRupee size={16} aria-hidden="true" />
              {refundState === 'working' ? 'Requesting…' : 'Request a refund'}
            </motion.button>
          )}

          {refundState === 'error' && (
            <p role="alert" className="font-sans text-sm mt-3" style={{ color: '#B23A2E' }}>
              {refundMsg}
            </p>
          )}
        </Card>
      )}

      {/* ── Right to erasure (DPDP s.12) ────────────────────────────────────── */}
      <Card>
        <div className="flex items-start gap-2 mb-1">
          <AlertTriangle size={18} aria-hidden="true" style={{ color: '#B23A2E', marginTop: 2 }} />
          <h2 className="font-display font-bold" style={{ fontSize: 'var(--text-h4)', color: '#B23A2E' }}>
            Delete your account
          </h2>
        </div>
        <p className="font-sans text-sm mb-2" style={{ color: 'var(--color-ink-muted)' }}>
          {serverBacked
            ? 'This removes your profile, bookings, messages, saved companions and notifications. It cannot be undone, and it signs you out everywhere.'
            : 'This clears everything this preview has stored in your browser. It cannot be undone.'}
        </p>
        {serverBacked && (
          <p className="font-sans text-xs mb-4" style={{ color: 'var(--color-ink-muted)' }}>
            Payment records are kept for as long as tax law requires, as set out in our{' '}
            <a href="/privacy" className="underline underline-offset-2">privacy policy</a>. Anything
            else you want removed, or a question about this, goes to our {GRIEVANCE_OFFICER_PHRASE} at{' '}
            <a href={`mailto:${COMPANY.grievanceOfficer.email}`} className="underline underline-offset-2">
              {COMPANY.grievanceOfficer.email}
            </a>
            .
          </p>
        )}

        <label
          htmlFor="delete-confirm"
          className="block font-sans text-xs font-semibold mb-1.5"
          style={{ color: 'var(--color-ink)' }}
        >
          Type {CONFIRM_WORD} to confirm
        </label>
        <input
          id="delete-confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-describedby={error ? 'delete-error' : undefined}
          className="w-full sm:w-64 min-h-[44px] px-3 rounded-md font-sans text-sm mb-3"
          style={{
            background: 'var(--color-bg)',
            border: '1.5px solid rgba(178,58,46,0.25)',
            color: 'var(--color-ink)',
          }}
        />

        <div>
          <motion.button
            type="button"
            onClick={handleDelete}
            disabled={!armed}
            whileTap={reduced || !armed ? {} : { scale: 0.97 }}
            transition={spring.snappy}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-pill text-sm font-semibold text-white disabled:cursor-not-allowed"
            style={{ background: '#B23A2E', opacity: armed ? 1 : 0.45 }}
          >
            <Trash2 size={16} aria-hidden="true" />
            {state === 'working' ? 'Deleting…' : 'Delete my account'}
          </motion.button>
        </div>

        {error && (
          <p
            id="delete-error"
            role="alert"
            className="font-sans text-sm mt-3"
            style={{ color: '#B23A2E' }}
          >
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}
