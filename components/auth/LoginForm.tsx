'use client';

import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { setUser } from '@/lib/journeyState';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { Reveal } from '@/components/motion/Reveal';
import { FieldStatus, ShakeWrapper } from './FieldStatus';
import { ForgotFlow } from './ForgotFlow';

// Inline SVG brand icons (lucide-react doesn't include Google/Apple)
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

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.701z"/>
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
  const reduced = useReducedMotion();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [pwErr,    setPwErr]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
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
    router.push(`${next || '/explore'}?welcome=1`);
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
    await new Promise(r => setTimeout(r, 700));
    const raw = email.split('@')[0].split('.')[0];
    setUser({ firstName: raw.charAt(0).toUpperCase() + raw.slice(1) });
    setLoading(false);
    startCelebration();
  }

  async function handleSocial(provider: 'google' | 'apple') {
    setSocialLoading(provider);
    await new Promise(r => setTimeout(r, 600));
    setUser({ firstName: 'Friend' });
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

  const busy = loading || !!socialLoading;
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

      {/* ── Social sign-in ── */}
      <Reveal delay={0.05}>
        <div className="flex flex-col gap-2.5 mb-5">
          {(['google', 'apple'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => handleSocial(p)}
              disabled={busy}
              className="h-12 rounded-xl font-sans font-semibold text-sm flex items-center justify-center gap-2.5 transition-opacity hover:opacity-80 disabled:opacity-50"
              style={INPUT_STYLE}
            >
              {socialLoading === p ? (
                <span
                  className="w-4 h-4 rounded-full animate-spin shrink-0"
                  style={{ border: '2px solid var(--color-azure)', borderTopColor: 'transparent' }}
                  aria-hidden="true"
                />
              ) : (
                p === 'google' ? <GoogleIcon /> : <AppleIcon />
              )}
              Continue with {p === 'google' ? 'Google' : 'Apple'}
            </button>
          ))}
        </div>
      </Reveal>

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

      {/* 2FA hint row */}
      <p className="mt-4 text-center font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
        Companions sign in with 2FA, demo skips this step.
      </p>

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
