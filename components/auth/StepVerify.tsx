'use client';

import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { spring } from '@/lib/motion';
import { Reveal } from '@/components/motion/Reveal';
import { FieldStatus, ShakeWrapper } from './FieldStatus';
import type { RegFormData } from './RegisterWizard';

const DEMO_OTP    = ['1', '2', '3', '4', '5', '6'];
const TIMER_START = 24;
const EMPTY_OTP   = ['', '', '', '', '', ''];

const INPUT_STYLE = {
  background: 'var(--color-bg)',
  border:     '1.5px solid rgba(20,26,46,0.14)',
  color:      'var(--color-ink)',
};

function fieldBorder(valid: boolean, hasError: boolean) {
  if (hasError) return '#C0392B';
  if (valid)    return '#157A4A';
  return 'rgba(20,26,46,0.14)';
}

interface Props {
  form: RegFormData;
  patch: (p: Partial<RegFormData>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepVerify({ form, patch, onBack, onNext }: Props) {
  const reduced = useReducedMotion();
  const [showOtp,     setShowOtp]     = useState(false);
  const [phoneErr,    setPhoneErr]    = useState('');
  const [phoneShakeKey, setPhoneShakeKey] = useState(0);
  const [otp,         setOtp]         = useState<string[]>([...EMPTY_OTP]);
  const [timer,       setTimer]       = useState(TIMER_START);
  const [timerActive, setTimerActive] = useState(false);
  const [otpErr,      setOtpErr]      = useState('');
  const [termsErr,    setTermsErr]    = useState('');
  const inputRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null, null, null]);

  useEffect(() => {
    if (!timerActive) return;
    if (timer <= 0) { setTimerActive(false); return; }
    const id = setTimeout(() => setTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer, timerActive]);

  // Derived validity
  const phoneValid = /^[6-9]\d{9}$/.test(form.phone);

  function sendOtp() {
    if (!phoneValid) {
      setPhoneErr('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      setPhoneShakeKey(k => k + 1);
      return;
    }
    setPhoneErr('');
    setShowOtp(true);
    setTimer(TIMER_START);
    setTimerActive(true);
    setTimeout(() => inputRefs.current[0]?.focus(), 60);
  }

  function handleDigitChange(i: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    setOtpErr('');
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleDigitKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      e.preventDefault();
      setOtp(text.split(''));
      setOtpErr('');
      inputRefs.current[5]?.focus();
    }
  }

  function autofill() {
    setOtp([...DEMO_OTP]);
    setOtpErr('');
    inputRefs.current[5]?.focus();
  }

  function resend() {
    setOtp([...EMPTY_OTP]);
    setOtpErr('');
    setTimer(TIMER_START);
    setTimerActive(true);
    inputRefs.current[0]?.focus();
  }

  function handleVerify() {
    if (otp.some(d => !d)) {
      setOtpErr('Please enter all 6 digits of your code.');
      return;
    }
    if (!form.termsAccepted) {
      setTermsErr('Please accept the terms and community guidelines to continue.');
      return;
    }
    patch({ otpVerified: true });
    onNext();
  }

  const otpComplete = otp.every(d => d !== '');

  return (
    <div>
      <Reveal delay={0.08}>
        <div className="mb-6">
          <h1
            className="font-display text-h2 leading-tight tracking-tight mb-1"
            style={{ color: 'var(--color-ink)' }}
          >
            {showOtp ? 'Enter the code' : 'Verify your number'}
          </h1>
          <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            {showOtp
              ? `We sent a 6-digit code to +91 ${form.phone}.`
              : 'We use this to keep the community safe. Not shown publicly.'}
          </p>
        </div>
      </Reveal>

      {!showOtp ? (
        <div className="flex flex-col gap-4">
          {/* Phone field — check icon + shake on invalid */}
          <ShakeWrapper shakeKey={phoneShakeKey} reduced={!!reduced}>
            <div>
              <label
                htmlFor="sv-phone"
                className="flex items-center justify-between font-sans font-semibold text-sm mb-1.5"
                style={{ color: 'var(--color-ink)' }}
              >
                <span>Mobile number</span>
                <FieldStatus valid={phoneValid && !phoneErr} reduced={!!reduced} />
              </label>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 font-sans text-sm font-semibold pointer-events-none select-none"
                  style={{ color: 'var(--color-ink-muted)' }}
                  aria-hidden="true"
                >
                  +91
                </span>
                <input
                  id="sv-phone"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={e =>
                    patch({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                  }
                  placeholder="9876543210"
                  className="w-full h-12 pl-14 pr-4 rounded-xl font-sans text-sm"
                  style={{
                    ...INPUT_STYLE,
                    border: `1.5px solid ${fieldBorder(phoneValid && !phoneErr, !!phoneErr)}`,
                  }}
                  aria-describedby={phoneErr ? 'sv-phone-err' : undefined}
                />
              </div>
              {phoneErr && (
                <p
                  id="sv-phone-err"
                  role="alert"
                  aria-live="polite"
                  className="mt-1 font-sans text-xs"
                  style={{ color: '#C0392B' }}
                >
                  {phoneErr}
                </p>
              )}
            </div>
          </ShakeWrapper>

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
              onClick={sendOtp}
              className="flex-1 h-11 rounded-pill font-sans font-bold text-sm text-white"
              style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
            >
              Send code
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* 6-digit OTP inputs */}
          <div>
            <div
              className="flex gap-2 justify-center"
              role="group"
              aria-label="One-time password, 6 digits"
            >
              {otp.map((d, i) => (
                /* Scale pop when digit fills — subtle tactile feedback */
                <motion.div
                  key={i}
                  animate={reduced ? {} : { scale: d ? [1, 1.12, 1] : 1 }}
                  transition={reduced ? { duration: 0 } : spring.snappy}
                >
                  <input
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleDigitChange(i, e.target.value)}
                    onKeyDown={e => handleDigitKey(i, e)}
                    onPaste={handlePaste}
                    aria-label={`Digit ${i + 1} of 6`}
                    autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    className="w-11 h-12 rounded-xl text-center font-sans font-bold text-lg"
                    style={INPUT_STYLE}
                  />
                </motion.div>
              ))}
            </div>
            {otpErr && (
              <p role="alert" aria-live="polite" className="mt-2 text-center font-sans text-xs"
                 style={{ color: '#C0392B' }}>
                {otpErr}
              </p>
            )}
            <p className="text-center mt-2">
              <button
                type="button"
                onClick={autofill}
                className="font-sans text-xs underline underline-offset-2"
                style={{ color: 'var(--color-azure)' }}
              >
                Demo mode, tap to autofill
              </button>
            </p>
          </div>

          {/* Resend timer */}
          <p className="text-center font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            {timerActive ? (
              <span>Resend in {timer}s</span>
            ) : (
              <span aria-live="polite">
                <button
                  type="button"
                  onClick={resend}
                  className="font-semibold hover:underline underline-offset-2"
                  style={{ color: 'var(--color-azure)' }}
                >
                  Resend code
                </button>
              </span>
            )}
          </p>

          {/* Terms checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.termsAccepted}
                onChange={e => {
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
                <strong style={{ color: 'var(--color-ink)' }}>strictly platonic platform</strong>
                {' '}, no romantic or sexual content of any kind.
              </span>
            </label>
            {termsErr && (
              <p
                id="sv-terms-err"
                role="alert"
                aria-live="polite"
                className="mt-1 font-sans text-xs"
                style={{ color: '#C0392B' }}
              >
                {termsErr}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowOtp(false)}
              className="h-11 min-w-[44px] px-4 rounded-pill font-sans font-semibold text-sm flex items-center gap-1.5"
              style={{ color: 'var(--color-ink-muted)', border: '1.5px solid rgba(20,26,46,0.14)' }}
            >
              <ChevronLeft size={16} aria-hidden="true" /> Back
            </button>
            <button
              type="button"
              onClick={handleVerify}
              disabled={!otpComplete || !form.termsAccepted}
              className="flex-1 h-11 rounded-pill font-sans font-bold text-sm text-white disabled:opacity-50"
              style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
            >
              Verify &amp; continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
