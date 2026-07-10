'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { signIn } from 'next-auth/react';
import { ChevronLeft, Mail, ShieldCheck } from 'lucide-react';
import { useAuthCapability } from '@/lib/authClient';
import { track } from '@/lib/analytics';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { Reveal } from '@/components/motion/Reveal';
import { FieldStatus, ShakeWrapper } from './FieldStatus';
import { CodeInput, EMPTY_CODE } from './CodeInput';
import { useEmailCode } from './useEmailCode';

// Inline SVG brand icon (lucide-react doesn't include Google)
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const INPUT_STYLE = {
  background: 'var(--color-bg)',
  border: '1.5px solid rgba(20,26,46,0.14)',
  color: 'var(--color-ink)',
};

const RESEND_SECONDS = 30;

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function fieldBorder(valid: boolean, hasError: boolean) {
  if (hasError) return '#C0392B';
  if (valid) return '#157A4A';
  return 'rgba(20,26,46,0.14)';
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const reduced = useEffectiveReducedMotion();
  const auth = useAuthCapability();
  const { send, verify, sending, verifying, delivery, error, setError } = useEmailCode();

  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [emailShakeKey, setEmailShakeKey] = useState(0);
  const [code, setCode] = useState<string[]>([...EMPTY_CODE]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Ref-guard so both onDone and the safety timeout cannot both navigate.
  const redirectedRef = useRef(false);
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (safetyRef.current) clearTimeout(safetyRef.current); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  function destination() {
    const dest = next || '/explore';
    return `${dest}${dest.includes('?') ? '&' : '?'}welcome=1`;
  }

  function doRedirect() {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    if (safetyRef.current) { clearTimeout(safetyRef.current); safetyRef.current = null; }
    // A full navigation, not router.push: the session cookie was set by fetch,
    // and server components rendered before it landed would still see a guest.
    window.location.assign(destination());
  }

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(email)) {
      setEmailErr('Please enter a valid email address.');
      setEmailShakeKey((k) => k + 1);
      return;
    }
    setEmailErr('');
    if (await send(email)) {
      setStage('code');
      setCooldown(RESEND_SECONDS);
    }
  }

  async function handleVerify() {
    if (code.some((d) => !d)) {
      setError('Please enter all 6 digits of your code.');
      return;
    }
    if (await verify(email, code.join(''))) {
      track('login', { method: 'email' });
      setCelebrate(true);
      safetyRef.current = setTimeout(doRedirect, 1400);
    } else {
      setCode([...EMPTY_CODE]);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    track('login', { method: 'google' });
    // next-auth navigates away and comes back with a session, so there is no
    // local celebration to run: the JWT is the source of truth and Nav re-reads
    // it on return.
    await signIn('google', { callbackUrl: destination() });
  }

  async function handleResend() {
    setCode([...EMPTY_CODE]);
    if (await send(email)) setCooldown(RESEND_SECONDS);
  }

  const busy = sending || verifying || googleLoading || auth.loading;
  const emailValid = isEmail(email) && !emailErr;
  const codeComplete = code.every((d) => d !== '');

  // No method can create a session on this deployment. Say so, plainly, rather
  // than rendering a form whose submit button leads nowhere.
  if (!auth.loading && !auth.configured) {
    return (
      <div className="text-center">
        <h1 className="font-display text-h2 leading-tight tracking-tight mb-3" style={{ color: 'var(--color-ink)' }}>
          Sign-in is not available
        </h1>
        <p className="font-sans text-sm mb-6" style={{ color: 'var(--color-ink-muted)' }}>
          This deployment has no authentication configured, so no account can be created or
          signed in to. You can still browse companions.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center justify-center h-12 px-6 rounded-pill font-sans font-bold text-sm text-white"
          style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
        >
          Browse companions →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <Reveal>
        <div className="text-center mb-7">
          <p className="label-eyebrow mb-3" style={{ color: 'var(--color-azure)' }}>
            {stage === 'email' ? 'Welcome back' : 'Check your inbox'}
          </p>
          <h1
            id="login-heading"
            className="font-display text-h2 leading-tight tracking-tight mb-2"
            style={{ color: 'var(--color-ink)' }}
          >
            {stage === 'email' ? 'Sign in to Companio' : 'Enter your code'}
          </h1>
          <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            {stage === 'email'
              ? 'Your bookings, companions, and meetups, all here.'
              : delivery === 'console'
                ? 'Email is not configured on this deployment, so the code was printed to the server console.'
                : `We sent a 6-digit code to ${email}. It expires in 10 minutes.`}
          </p>
        </div>
      </Reveal>

      {stage === 'email' ? (
        <>
          {auth.google && (
            <Reveal delay={0.05}>
              <div className="flex flex-col gap-2.5 mb-5">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className="h-12 rounded-xl font-sans font-semibold text-sm flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={INPUT_STYLE}
                >
                  {googleLoading ? (
                    <span
                      className="w-4 h-4 rounded-full animate-spin shrink-0"
                      style={{ border: '2px solid var(--color-azure)', borderTopColor: 'transparent' }}
                      aria-hidden="true"
                    />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>
              </div>
            </Reveal>
          )}

          {auth.google && auth.emailOtp && (
            <div className="flex items-center gap-3 mb-5" aria-hidden="true">
              <div className="flex-1 h-px" style={{ background: 'rgba(20,26,46,0.10)' }} />
              <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>or</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(20,26,46,0.10)' }} />
            </div>
          )}

          {auth.emailOtp && (
            <Reveal delay={0.1}>
              <form aria-label="Sign in with an email code" className="flex flex-col gap-4" onSubmit={handleSendCode} noValidate>
                <ShakeWrapper shakeKey={emailShakeKey} reduced={!!reduced}>
                  <div>
                    <label
                      htmlFor="login-email"
                      className="flex items-center justify-between font-sans font-semibold text-sm mb-1.5"
                      style={{ color: 'var(--color-ink)' }}
                    >
                      <span>Email address</span>
                      <FieldStatus valid={emailValid} reduced={!!reduced} />
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: 'var(--color-ink-muted)' }}
                        aria-hidden="true"
                      />
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (emailErr) setEmailErr(''); if (error) setError(''); }}
                        placeholder="you@example.com"
                        className="w-full h-12 pl-10 pr-4 rounded-xl font-sans text-sm"
                        style={{ ...INPUT_STYLE, border: `1.5px solid ${fieldBorder(emailValid, !!emailErr)}` }}
                        aria-describedby={emailErr ? 'le-email-err' : undefined}
                      />
                    </div>
                    {emailErr && (
                      <p id="le-email-err" role="alert" aria-live="polite" className="mt-1 font-sans text-xs" style={{ color: '#C0392B' }}>
                        {emailErr}
                      </p>
                    )}
                  </div>
                </ShakeWrapper>

                {error && (
                  <p role="alert" aria-live="polite" className="font-sans text-xs" style={{ color: '#C0392B' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="h-12 rounded-pill font-sans font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-70"
                  style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
                >
                  {sending ? (
                    <>
                      <span className="w-4 h-4 rounded-full animate-spin shrink-0" style={{ border: '2px solid #fff', borderTopColor: 'transparent' }} aria-hidden="true" />
                      Sending code…
                    </>
                  ) : (
                    'Email me a sign-in code'
                  )}
                </button>

                <p className="text-center font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  Companio has no passwords, so there are none to forget or leak.
                </p>
              </form>
            </Reveal>
          )}
        </>
      ) : (
        <Reveal>
          <div className="flex flex-col gap-5">
            <CodeInput value={code} onChange={(c) => { setCode(c); if (error) setError(''); }} disabled={verifying} invalid={!!error} />

            {error && (
              <p role="alert" aria-live="polite" className="text-center font-sans text-xs" style={{ color: '#C0392B' }}>
                {error}
              </p>
            )}

            <p className="text-center font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
              {cooldown > 0 ? (
                <span>Resend in {cooldown}s</span>
              ) : (
                <span aria-live="polite">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={sending}
                    className="font-semibold hover:underline underline-offset-2 disabled:opacity-60"
                    style={{ color: 'var(--color-azure)' }}
                  >
                    Resend code
                  </button>
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStage('email'); setCode([...EMPTY_CODE]); setError(''); }}
                className="h-12 min-w-[44px] px-4 rounded-pill font-sans font-semibold text-sm flex items-center gap-1.5"
                style={{ color: 'var(--color-ink-muted)', border: '1.5px solid rgba(20,26,46,0.14)' }}
              >
                <ChevronLeft size={16} aria-hidden="true" /> Back
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={!codeComplete || verifying}
                className="flex-1 h-12 rounded-pill font-sans font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
              >
                {verifying ? (
                  <>
                    <span className="w-4 h-4 rounded-full animate-spin shrink-0" style={{ border: '2px solid #fff', borderTopColor: 'transparent' }} aria-hidden="true" />
                    Verifying…
                  </>
                ) : (
                  'Verify & sign in'
                )}
              </button>
            </div>
          </div>
        </Reveal>
      )}

      <p className="mt-4 text-center font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
        New to Companio?{' '}
        <Link href="/register" className="font-semibold hover:underline underline-offset-4" style={{ color: 'var(--color-azure)' }}>
          Create a free account
        </Link>
      </p>

      <div className="flex items-center justify-center gap-1.5 mt-5 font-sans text-xs" style={{ color: '#157A4A' }}>
        <ShieldCheck size={13} aria-hidden="true" />
        ID-verified companions · Strictly platonic
      </div>

      {/* Sign-in success celebration — redirects on onDone or safety timeout. */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            key="login-celebrate"
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.7, 0, 0.84, 0] }}
          >
            <MilestoneSeal label="Welcome back!" withConfetti onDone={doRedirect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
