'use client';

import { useState, useId } from 'react';
import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { CITIES } from '@/lib/data/cities';
import type { GenderId } from '@/lib/journeyState';
import { Reveal } from '@/components/motion/Reveal';
import { ageInYears, parseDateOfBirth, maxAdultDob, MIN_AGE } from '@/lib/age';
import { FieldStatus, ShakeWrapper } from './FieldStatus';
import type { RegFormData } from './RegisterWizard';

// The label the member reads, and the value the database stores. These used to
// be labels only: the answer was never sent, and the column stayed null for
// everyone. The same-gender filter runs on this, so it has to be a real value.
//
// The last two are deliberately not matchable — see lib/journeyState.
const GENDERS: { id: GenderId; label: string }[] = [
  { id: 'female', label: 'Woman' },
  { id: 'male', label: 'Man' },
  { id: 'nonbinary', label: 'Non-binary' },
  { id: 'self_described', label: 'Prefer to self-describe' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
];

function isEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

// Age rules come from lib/age.ts — the same module the server enforces with
// (via lib/server/age.ts). This file used to carry its own private calcAge(),
// which is exactly how a client check and a server check drift apart.
function calcAge(dob: string): number | null {
  const parsed = parseDateOfBirth(dob);
  return parsed ? ageInYears(parsed) : null;
}

// Computed at render-time inside the component (avoids SSR/client mismatch via suppressHydrationWarning)
function getMaxDob(): string {
  return maxAdultDob();
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const maxDob = getMaxDob();

  // Per-field shake keys for name + email; incremented when those fields fail.
  const [firstNameShakeKey, setFirstNameShakeKey] = useState(0);
  const [emailShakeKey,     setEmailShakeKey]     = useState(0);

  const age     = calcAge(form.dob);
  const under18 = age !== null && age < MIN_AGE;

  // Derived validity
  const firstNameValid = form.firstName.trim().length > 0;
  const emailValid     = isEmail(form.email);
  const dobValid       = !!form.dob && (age ?? -1) >= MIN_AGE;
  const selfDescribing = form.gender === 'self_described';
  const genderValid    = !!form.gender && (!selfDescribing || form.genderSelfDescribed.trim().length > 0);
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
    if (!form.dob)
      e.dob = 'Please enter your date of birth.';
    else if (under18)
      e.dob = `You must be ${MIN_AGE} or older to join Companio.`;
    if (!form.gender)
      e.gender = 'Please select a gender identity.';
    else if (selfDescribing && !form.genderSelfDescribed.trim())
      e.gender = 'Please tell us how you describe your gender.';
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
            Your information stays private. We&apos;ll email a code to confirm your address, so
            there is no password to choose.
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
              Companio is for adults aged {MIN_AGE} and over. We&apos;d love to welcome you when you&apos;re ready.
            </p>
          )}
        </Field>

        {/* Gender — emerald border when selected. Used by the same-gender filter,
            which is why we say what it is for rather than just asking. */}
        <Field label="Gender identity" error={errors.gender} id={`${id}-gen`}>
          <select
            id={`${id}-gen`}
            value={form.gender}
            onChange={e => patch({ gender: e.target.value as GenderId | '', genderSelfDescribed: '' })}
            className={FIELD_INPUT_BASE}
            style={{ ...FIELD_INPUT_STYLE, border: `1.5px solid ${fieldBorder(genderValid, !!errors.gender)}` }}
          >
            <option value="">Select…</option>
            {GENDERS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
          {selfDescribing && (
            <input
              type="text"
              value={form.genderSelfDescribed}
              onChange={e => patch({ genderSelfDescribed: e.target.value })}
              placeholder="How do you describe your gender?"
              maxLength={60}
              aria-label="Describe your gender"
              className={`${FIELD_INPUT_BASE} mt-2`}
              style={{ ...FIELD_INPUT_STYLE, border: `1.5px solid ${fieldBorder(genderValid, !!errors.gender)}` }}
            />
          )}
          <p className="mt-1 font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            Lets you ask to see only companions of your own gender. You can change it later.
          </p>
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
