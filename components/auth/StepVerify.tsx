'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, Mail } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { CodeInput, EMPTY_CODE } from './CodeInput';
import { useEmailCode } from './useEmailCode';
import type { RegFormData } from './RegisterWizard';

const RESEND_SECONDS = 30;

interface Props {
  form: RegFormData;
  patch: (p: Partial<RegFormData>) => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Verify the email address collected on the previous step, then create the
 * account and its session in one act.
 *
 * A successful `verify()` has already upserted the User row and set the session
 * cookie — next-auth's credentials provider does both. So by the time `onNext()`
 * runs, the account exists on the server. StepDone only fills in the profile.
 *
 * Nothing in this component decides whether a code is right. It sends digits and
 * reads the answer. That is the whole difference from what it replaced.
 */
export function StepVerify({ form, patch, onBack, onNext }: Props) {
  const { send, verify, sending, verifying, delivery, error, setError } = useEmailCode();

  const [sent, setSent] = useState(false);
  const [code, setCode] = useState<string[]>([...EMPTY_CODE]);
  const [cooldown, setCooldown] = useState(0);
  const [termsErr, setTermsErr] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  async function handleSend() {
    if (!form.termsAccepted) {
      setTermsErr('Please accept the terms and community guidelines to continue.');
      return;
    }
    setTermsErr('');
    if (await send(form.email)) {
      setSent(true);
      setCooldown(RESEND_SECONDS);
    }
  }

  async function handleVerify() {
    if (code.some((d) => !d)) {
      setError('Please enter all 6 digits of your code.');
      return;
    }
    if (await verify(form.email, code.join(''), form.firstName)) {
      patch({ otpVerified: true });
      onNext();
    } else {
      setCode([...EMPTY_CODE]);
    }
  }

  async function handleResend() {
    setCode([...EMPTY_CODE]);
    if (await send(form.email)) setCooldown(RESEND_SECONDS);
  }

  const codeComplete = code.every((d) => d !== '');

  return (
    <div>
      <Reveal delay={0.08}>
        <div className="mb-6">
          <h1 className="font-display text-h2 leading-tight tracking-tight mb-1" style={{ color: 'var(--color-ink)' }}>
            {sent ? 'Enter the code' : 'Verify your email'}
          </h1>
          <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            {sent
              ? delivery === 'console'
                ? 'Email is not configured on this deployment, so the code was printed to the server console.'
                : `We sent a 6-digit code to ${form.email}. It expires in 10 minutes.`
              : `We'll send a 6-digit code to ${form.email} to confirm it's yours. Companio has no passwords.`}
          </p>
        </div>
      </Reveal>

      {!sent ? (
        <div className="flex flex-col gap-5">
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3.5 font-sans text-sm"
            style={{ background: 'var(--color-bg)', border: '1.5px solid rgba(20,26,46,0.10)', color: 'var(--color-ink)' }}
          >
            <Mail size={16} aria-hidden="true" style={{ color: 'var(--color-ink-muted)' }} />
            <span className="truncate">{form.email}</span>
            <button
              type="button"
              onClick={onBack}
              className="ml-auto shrink-0 font-semibold text-xs hover:underline underline-offset-2"
              style={{ color: 'var(--color-azure-deep)' }}
            >
              Change
            </button>
          </div>

          {/* Terms are accepted before the code is sent: consent must precede the
              act of creating the account, not follow it. */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={(e) => {
                  patch({ termsAccepted: e.target.checked });
                  if (e.target.checked) setTermsErr('');
                }}
                className="mt-0.5 w-5 h-5 rounded cursor-pointer shrink-0"
                style={{ minWidth: 20, minHeight: 20 }}
                aria-describedby={termsErr ? 'sv-terms-err' : undefined}
              />
              <span className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                I agree to the{' '}
                <a
                  href="/terms"
                  className="font-semibold underline underline-offset-2"
                  style={{ color: 'var(--color-azure-deep)' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms &amp; Community Guidelines
                </a>
                . I understand Companio is a{' '}
                <strong style={{ color: 'var(--color-ink)' }}>strictly platonic platform</strong>, no romantic or sexual
                content of any kind.
              </span>
            </label>
            {termsErr && (
              <p id="sv-terms-err" role="alert" aria-live="polite" className="mt-1 font-sans text-xs" style={{ color: '#C0392B' }}>
                {termsErr}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="font-sans text-xs" style={{ color: '#C0392B' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="h-11 min-w-[44px] px-4 rounded-pill font-sans font-semibold text-sm flex items-center gap-1.5"
              style={{ color: 'var(--color-ink-muted)', border: '1.5px solid rgba(20,26,46,0.14)' }}
            >
              <ChevronLeft size={16} aria-hidden="true" /> Back
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending}
              className="flex-1 h-11 rounded-pill font-sans font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
            >
              {sending ? (
                <>
                  <span className="w-4 h-4 rounded-full animate-spin shrink-0" style={{ border: '2px solid #fff', borderTopColor: 'transparent' }} aria-hidden="true" />
                  Sending…
                </>
              ) : (
                'Send code'
              )}
            </button>
          </div>
        </div>
      ) : (
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
              onClick={() => { setSent(false); setCode([...EMPTY_CODE]); setError(''); }}
              className="h-11 min-w-[44px] px-4 rounded-pill font-sans font-semibold text-sm flex items-center gap-1.5"
              style={{ color: 'var(--color-ink-muted)', border: '1.5px solid rgba(20,26,46,0.14)' }}
            >
              <ChevronLeft size={16} aria-hidden="true" /> Back
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={!codeComplete || verifying}
              className="flex-1 h-11 rounded-pill font-sans font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
            >
              {verifying ? (
                <>
                  <span className="w-4 h-4 rounded-full animate-spin shrink-0" style={{ border: '2px solid #fff', borderTopColor: 'transparent' }} aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                'Verify & continue'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
