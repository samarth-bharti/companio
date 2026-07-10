'use client';

import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { dataClient } from '@/lib/dataClient';
import { useAuthCapability } from '@/lib/authClient';
import { track } from '@/lib/analytics';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { Reveal } from '@/components/motion/Reveal';
import { FieldStatus, ShakeWrapper } from './FieldStatus';
import { ForgotFlow } from './ForgotFlow';

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

type ForgotState = 'idle' | 'input' | 'sent';

const INPUT_STYLE = {
  background: 'var(--color-bg)',
  border:     '1.5px solid rgba(20,26,46,0.14)',
  color:      'var(--color-ink)',
};

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function fieldBorder(valid: boolean, hasError: boolean) {
  if (hasError) return '#C0392B';
  if (valid)    return '#157A4A';
  return 'rgba(20,26,46,0.14)';
}

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const reduced = useEffectiveReducedMotion();
  // When Google is wired, sign-in is real: next-auth owns the redirect and the
  // server gets a session. When it isn't, this build has no way to authenticate
  // anyone and the email/password form is a local simulation — so say so rather
  // than presenting a password box that accepts literally any password.
  const auth = useAuthCapability();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [pwErr,    setPwErr]    = useState('');
  const [loading,  setLoading]  = useState(false);
  // Google is the only provider Companio actually supports (see lib/auth.ts).
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);
  const [forgot,      setForgot]      = useState<ForgotState>('idle');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotErr,   setForgotErr]   = useState('');
  const [celebrate,   setCelebrate]   = useState(false);

  // Shake keys — increment on validation failure to trigger one-shot shake.
  const [emailShakeKey, setEmailShakeKey] = useState(0);
  const [pwShakeKey,    setPwShakeKey]    = useState(0);

  // Ref-guard so both onDone and safety setTimeout cannot both navigate.
  const redirectedRef = useRef(false);
  const safetyRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (safetyRef.current) clearTimeout(safetyRef.current); };
  }, []);

  function doRedirect() {
    if (redirectedRef.current) return;
    redirectedRef.current = true;
    if (safetyRef.current) { clearTimeout(safetyRef.current); safetyRef.current = null; }
    const dest = next || '/explore';
    const sep = dest.includes('?') ? '&' : '?';
    router.push(`${dest}${sep}welcome=1`);
  }

  function startCelebration() {
    setCelebrate(true);
    safetyRef.current = setTimeout(doRedirect, 1400);
  }

  function validate() {
    let ok = true;
    if (!isEmail(email)) {
      setEmailErr('Please enter a valid email address.');
      setEmailShakeKey(k => k + 1);
      ok = false;
    } else {
      setEmailErr('');
    }
    if (!password.trim()) {
      setPwErr('Please enter your password.');
      setPwShakeKey(k => k + 1);
      ok = false;
    } else {
      setPwErr('');
    }
    return ok;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Demo-only path. There is no email/password provider in lib/auth.ts, so
    // this never runs in a build where Google is configured (the form is
    // replaced by a notice below).
    await new Promise(r => setTimeout(r, 700));
    const raw = email.split('@')[0].split('.')[0];
    await dataClient.setUser({ firstName: raw.charAt(0).toUpperCase() + raw.slice(1) });
    track('login', { method: 'email' });
    setLoading(false);
    startCelebration();
  }

  async function handleSocial(provider: 'google') {
    setSocialLoading(provider);
    track('login', { method: provider });

    if (auth.configured) {
      // Real OAuth. next-auth navigates away and comes back with a session, so
      // there is no local celebration to run and no local user to write — the
      // JWT is the source of truth and Nav re-reads it on return.
      const dest = next || '/explore';
      const sep = dest.includes('?') ? '&' : '?';
      await signIn(provider, { callbackUrl: `${dest}${sep}welcome=1` });
      return; // unreachable after the redirect; keeps the spinner up meanwhile
    }

    // Demo build: no gateway to Google, so simulate locally.
    await new Promise(r => setTimeout(r, 600));
    await dataClient.setUser({ firstName: 'Friend' });
    setSocialLoading(null);
    startCelebration();
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    if (!isEmail(forgotEmail)) { setForgotErr('Please enter a valid email address.'); return; }
    setForgotErr('');
    await new Promise(r => setTimeout(r, 400));
    setForgot('sent');
  }

  if (forgot !== 'idle') {
    return (
      <ForgotFlow
        state={forgot === 'sent' ? 'sent' : 'input'}
        email={forgotEmail}
        err={forgotErr}
        setEmail={setForgotEmail}
        setErr={setForgotErr}
        onSubmit={handleForgot}
        onBack={() => { setForgot('idle'); setForgotEmail(''); setForgotErr(''); }}
      />
    );
  }

  // Keep the buttons inert until we know which world we're in — a click that
  // races the capability check could take the demo path in a live build.
  const busy = loading || !!socialLoading || auth.loading;
  const emailValid = isEmail(email) && !emailErr;
  const pwValid    = !!password.trim() && !pwErr;

  return (
    <div>
      {/* ── Header ── */}
      <Reveal>
        <div className="text-center mb-7">
          <p className="label-eyebrow mb-3" style={{ color: 'var(--color-azure)' }}>
            Welcome back
          </p>
          <h1
            id="login-heading"
            className="font-display text-h2 leading-tight tracking-tight mb-2"
            style={{ color: 'var(--color-ink)' }}
          >
            Sign in to Companio
          </h1>
          <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Your bookings, companions, and meetups, all here.
          </p>
        </div>
      </Reveal>

      {/* ── Social sign-in — Google only; no Apple provider is configured ── */}
      <Reveal delay={0.05}>
        <div className="flex flex-col gap-2.5 mb-5">
          <button
            type="button"
            onClick={() => handleSocial('google')}
            disabled={busy}
            className="h-12 rounded-xl font-sans font-semibold text-sm flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80 disabled:opacity-50"
            style={INPUT_STYLE}
          >
            {socialLoading === 'google' ? (
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

      {/* Companio has no email/password provider (see lib/auth.ts — Google OAuth
          and phone OTP only). In a live build, showing a password box that
          accepts any string is a lie, so it is replaced by the truth. */}
      {auth.configured ? (
        <p
          className="rounded-2xl px-4 py-3 font-sans text-sm text-center"
          style={{
            background: 'rgba(46,107,255,0.07)',
            border: '1.5px solid rgba(46,107,255,0.18)',
            color: 'var(--color-azure-deep)',
          }}
        >
          Companio has no passwords to forget, or leak. Sign in with Google above.
        </p>
      ) : (
      <>
      <div className="flex items-center gap-3 mb-5" aria-hidden="true">
        <div className="flex-1 h-px" style={{ background: 'rgba(20,26,46,0.10)' }} />
        <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>or</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(20,26,46,0.10)' }} />
      </div>

      {/* ── Email/password form ── */}
      <Reveal delay={0.1}>
        <form aria-label="Sign in with email" className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>

          {/* Email */}
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
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--color-ink-muted)' }} aria-hidden="true" />
                <input
                  id="login-email" type="email" autoComplete="email"
                  value={email} onChange={e => { setEmail(e.target.value); if (emailErr) setEmailErr(''); }}
                  placeholder="you@example.com"
                  className="w-full h-12 pl-10 pr-4 rounded-xl font-sans text-sm"
                  style={{ ...INPUT_STYLE, border: `1.5px solid ${fieldBorder(emailValid, !!emailErr)}` }}
                  aria-describedby={emailErr ? 'le-email-err' : undefined}
                />
              </div>
              {emailErr && (
                <p id="le-email-err" role="alert" aria-live="polite"
                   className="mt-1 font-sans text-xs" style={{ color: '#C0392B' }}>
                  {emailErr}
                </p>
              )}
            </div>
          </ShakeWrapper>

          {/* Password */}
          <ShakeWrapper shakeKey={pwShakeKey} reduced={!!reduced}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login-password"
                  className="flex items-center font-sans font-semibold text-sm"
                  style={{ color: 'var(--color-ink)' }}
                >
                  Password
                  <FieldStatus valid={pwValid} reduced={!!reduced} />
                </label>
                <button type="button" onClick={() => setForgot('input')}
                        className="font-sans text-xs font-semibold hover:underline underline-offset-2"
                        style={{ color: 'var(--color-azure-deep)' }}>
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: 'var(--color-ink-muted)' }} aria-hidden="true" />
                <input
                  id="login-password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => { setPassword(e.target.value); if (pwErr) setPwErr(''); }}
                  placeholder="Your password"
                  className="w-full h-12 pl-10 pr-11 rounded-xl font-sans text-sm"
                  style={{ ...INPUT_STYLE, border: `1.5px solid ${fieldBorder(pwValid, !!pwErr)}` }}
                  aria-describedby={pwErr ? 'le-pw-err' : undefined}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded"
                        style={{ color: 'var(--color-ink-muted)', width: 44, height: 44 }}>
                  {showPw ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
              {pwErr && (
                <p id="le-pw-err" role="alert" aria-live="polite"
                   className="mt-1 font-sans text-xs" style={{ color: '#C0392B' }}>
                  {pwErr}
                </p>
              )}
            </div>
          </ShakeWrapper>

          <button
            type="submit" disabled={busy}
            className="h-12 rounded-pill font-sans font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full animate-spin shrink-0"
                      style={{ border: '2px solid #fff', borderTopColor: 'transparent' }} aria-hidden="true" />
                Signing in…
              </>
            ) : 'Sign in'}
          </button>
        </form>
      </Reveal>
      </>
      )}

      {!auth.configured && !auth.loading && (
        <p className="mt-4 text-center font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
          Preview mode, sign-in is simulated on this device.
        </p>
      )}

      <p className="mt-3 text-center font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
        New to Companio?{' '}
        <Link href="/register" className="font-semibold hover:underline underline-offset-4"
              style={{ color: 'var(--color-azure)' }}>
          Create a free account
        </Link>
      </p>

      <div className="flex items-center justify-center gap-1.5 mt-5 font-sans text-xs"
           style={{ color: '#157A4A' }}>
        <ShieldCheck size={13} aria-hidden="true" />
        ID-verified · Strictly platonic
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
