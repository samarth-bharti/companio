'use client';

import { useState, useId } from 'react';
import type { ReactNode } from 'react';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';
import { CITIES } from '@/lib/data/cities';
import { Reveal } from '@/components/motion/Reveal';
import { FieldStatus, ShakeWrapper } from './FieldStatus';
import type { RegFormData } from './RegisterWizard';

const GENDERS = [
  'Woman',
  'Man',
  'Non-binary',
  'Prefer to self-describe',
  'Prefer not to say',
];

const PW_RULES = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',  test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number',            test: (p: string) => /[0-9]/.test(p) },
];

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Computed at render-time inside the component (avoids SSR/client mismatch via suppressHydrationWarning)
function getMaxDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().split('T')[0];
}

const FIELD_INPUT_BASE = 'w-full h-12 px-4 rounded-xl font-sans text-sm';
const FIELD_INPUT_STYLE = {
  background: 'var(--color-bg)',
  border:     '1.5px solid rgba(20,26,46,0.14)',
  color:      'var(--color-ink)',
};

function fieldBorder(valid: boolean, hasError: boolean) {
  if (hasError) return '#C0392B';
  if (valid)    return '#157A4A';
  return 'rgba(20,26,46,0.14)';
}

interface FieldProps {
  label: string;
  error?: string;
  id: string;
  children: ReactNode;
  valid?: boolean;
  reduced?: boolean;
}

function Field({ label, error, id, children, valid = false, reduced = false }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center justify-between font-sans font-semibold text-sm mb-1.5"
        style={{ color: 'var(--color-ink)' }}
      >
        <span>{label}</span>
        <FieldStatus valid={valid} reduced={reduced} />
      </label>
      {children}
      {error && (
        <p
          id={`${id}-err`}
          role="alert"
          aria-live="polite"
          className="mt-1 font-sans text-xs"
          style={{ color: '#C0392B' }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

interface Props {
  form: RegFormData;
  patch: (p: Partial<RegFormData>) => void;
  onBack: () => void;
  onNext: () => void;
  prefilledName?: string;
}

export function StepAboutYou({ form, patch, onBack, onNext, prefilledName }: Props) {
  const id      = useId();
  const reduced = useEffectiveReducedMotion();
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const maxDob = getMaxDob();

  // Per-field shake keys for name + email; incremented when those fields fail.
  const [firstNameShakeKey, setFirstNameShakeKey] = useState(0);
  const [emailShakeKey,     setEmailShakeKey]     = useState(0);

  const age     = calcAge(form.dob);
  const under18 = age !== null && age < 18;

  // Derived validity
  const firstNameValid = form.firstName.trim().length > 0;
  const emailValid     = isEmail(form.email);
  const pwValid        = PW_RULES.every(r => r.test(form.password));
  const dobValid       = !!form.dob && (age ?? -1) >= 18;
  const genderValid    = !!form.gender;
  const cityValid      = !!form.city;

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) {
      e.firstName = 'Please enter your first name.';
      setFirstNameShakeKey(k => k + 1);
    }
    if (!isEmail(form.email)) {
      e.email = 'Please enter a valid email address.';
      setEmailShakeKey(k => k + 1);
    }
    if (!PW_RULES.every(r => r.test(form.password)))
      e.password = 'Password must meet all four requirements below.';
    if (!form.dob)
      e.dob = 'Please enter your date of birth.';
    else if (under18)
      e.dob = 'You must be 18 or older to join Companio.';
    if (!form.gender)
      e.gender = 'Please select a gender identity.';
    if (!form.city)
      e.city = 'Please select your city.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <div>
      <Reveal delay={0.08}>
        <div className="mb-6">
          <h1
            className="font-display text-h2 leading-tight tracking-tight mb-1"
            style={{ color: 'var(--color-ink)' }}
          >
            {prefilledName
              ? `Welcome back, ${prefilledName}, finishing your setup`
              : 'About you'}
          </h1>
          <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Your information stays private.
          </p>
        </div>
      </Reveal>

      <form
        className="flex flex-col gap-4"
        onSubmit={e => { e.preventDefault(); if (validate()) onNext(); }}
        noValidate
      >
        {/* First name — check icon + shake */}
        <ShakeWrapper shakeKey={firstNameShakeKey} reduced={!!reduced}>
          <Field
            label="First name"
            error={errors.firstName}
            id={`${id}-fn`}
            valid={firstNameValid && !errors.firstName}
            reduced={!!reduced}
          >
            <input
              id={`${id}-fn`}
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={e => patch({ firstName: e.target.value })}
              placeholder="Your first name"
              className={FIELD_INPUT_BASE}
              style={{ ...FIELD_INPUT_STYLE, border: `1.5px solid ${fieldBorder(firstNameValid && !errors.firstName, !!errors.firstName)}` }}
            />
          </Field>
        </ShakeWrapper>

        {/* Email — check icon + shake */}
        <ShakeWrapper shakeKey={emailShakeKey} reduced={!!reduced}>
          <Field
            label="Email address"
            error={errors.email}
            id={`${id}-em`}
            valid={emailValid && !errors.email}
            reduced={!!reduced}
          >
            <input
              id={`${id}-em`}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={e => patch({ email: e.target.value })}
              placeholder="you@example.com"
              className={FIELD_INPUT_BASE}
              style={{ ...FIELD_INPUT_STYLE, border: `1.5px solid ${fieldBorder(emailValid && !errors.email, !!errors.email)}` }}
            />
          </Field>
        </ShakeWrapper>

        {/* Password — emerald border when all rules pass; rules list handles detail */}
        <Field label="Password" error={errors.password} id={`${id}-pw`}>
          <div className="relative">
            <input
              id={`${id}-pw`}
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={e => patch({ password: e.target.value })}
              placeholder="Choose a strong password"
              className={`${FIELD_INPUT_BASE} pr-11`}
              style={{ ...FIELD_INPUT_STYLE, border: `1.5px solid ${fieldBorder(pwValid, !!errors.password)}` }}
              aria-describedby={`${id}-pw-rules`}
            />
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded"
              style={{ color: 'var(--color-ink-muted)', width: 44, height: 44 }}
            >
              {showPw
                ? <EyeOff size={16} aria-hidden="true" />
                : <Eye    size={16} aria-hidden="true" />}
            </button>
          </div>
          <ul id={`${id}-pw-rules`} className="mt-2 flex flex-col gap-1" aria-label="Password requirements">
            {PW_RULES.map(r => {
              const ok = r.test(form.password);
              return (
                <li
                  key={r.label}
                  className="flex items-center gap-1.5 font-sans text-xs"
                  style={{ color: ok ? '#157A4A' : 'var(--color-ink-muted)' }}
                >
                  {/* Stamp pop when rule passes; empty circle when not */}
                  {ok ? (
                    <motion.span
                      key="filled"
                      aria-hidden="true"
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0"
                      initial={reduced ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={reduced ? { duration: 0 } : spring.stamp}
                      style={{ background: '#157A4A', color: '#fff', flexShrink: 0 }}
                    >
                      ✓
                    </motion.span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] shrink-0"
                      style={{
                        background: 'transparent',
                        border: '1.5px solid rgba(20,26,46,0.2)',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  {r.label}
                </li>
              );
            })}
          </ul>
        </Field>

        {/* Date of birth — emerald border when valid age */}
        <Field label="Date of birth" error={errors.dob} id={`${id}-dob`}>
          <input
            id={`${id}-dob`}
            type="date"
            autoComplete="bday"
            value={form.dob}
            max={maxDob}
            onChange={e => patch({ dob: e.target.value })}
            className={FIELD_INPUT_BASE}
            style={{ ...FIELD_INPUT_STYLE, border: `1.5px solid ${fieldBorder(dobValid, !!errors.dob)}` }}
            suppressHydrationWarning
          />
          {under18 && !errors.dob && (
            <p className="mt-1 font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              Companio is for adults aged 18 and over. We&apos;d love to welcome you when you&apos;re ready.
            </p>
          )}
        </Field>

        {/* Gender — emerald border when selected */}
        <Field label="Gender identity" error={errors.gender} id={`${id}-gen`}>
          <select
            id={`${id}-gen`}
            value={form.gender}
            onChange={e => patch({ gender: e.target.value })}
            className={FIELD_INPUT_BASE}
            style={{ ...FIELD_INPUT_STYLE, border: `1.5px solid ${fieldBorder(genderValid, !!errors.gender)}` }}
          >
            <option value="">Select…</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>

        {/* City — emerald border when selected */}
        <Field label="Your city" error={errors.city} id={`${id}-city`}>
          <select
            id={`${id}-city`}
            value={form.city}
            onChange={e => patch({ city: e.target.value })}
            autoComplete="address-level2"
            className={FIELD_INPUT_BASE}
            style={{ ...FIELD_INPUT_STYLE, border: `1.5px solid ${fieldBorder(cityValid, !!errors.city)}` }}
          >
            <option value="">Select your city…</option>
            {CITIES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onBack}
            className="h-11 min-w-[44px] px-4 rounded-pill font-sans font-semibold text-sm flex items-center gap-1.5"
            style={{ color: 'var(--color-ink-muted)', border: '1.5px solid rgba(20,26,46,0.14)' }}
          >
            <ChevronLeft size={16} aria-hidden="true" /> Back
          </button>
          <button
            type="submit"
            disabled={under18}
            className="flex-1 h-11 rounded-pill font-sans font-bold text-sm text-white disabled:opacity-50"
            style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
