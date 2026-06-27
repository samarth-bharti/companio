'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { SegmentedPill } from '@/components/journey/SegmentedPill';
import { spring, calm } from '@/lib/motion';
import { getQuiz } from '@/lib/journeyState';
import { StepRole } from './StepRole';
import { StepAboutYou } from './StepAboutYou';
import { StepVerify } from './StepVerify';
import { StepDone } from './StepDone';

export interface RegFormData {
  role: 'member' | 'companion' | '';
  firstName: string;
  email: string;
  password: string;
  dob: string;
  gender: string;
  city: string;
  phone: string;
  otpVerified: boolean;
  termsAccepted: boolean;
}

const EMPTY: RegFormData = {
  role: '', firstName: '', email: '', password: '',
  dob: '', gender: '', city: '', phone: '',
  otpVerified: false, termsAccepted: false,
};

const STEPS = ['Role', 'About you', 'Verify', 'Done'];

// Why an account is needed, keyed by the gate that sent the user here.
const GATE_COPY: Record<string, string> = {
  unlock: 'Create your free account to unlock companions and claim your 2 included meetups.',
  book: 'Create your free account to confirm your meetup.',
  apply: "First, create your free account, then we'll take your details and ID.",
};

const slideVariants: Variants = {
  enter: (d: number) => ({ opacity: 0, x: d * 48 }),
  center: { opacity: 1, x: 0 },
  exit:  (d: number) => ({ opacity: 0, x: d * -48 }),
};

const fadeVariants: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit:  { opacity: 0 },
};

export function RegisterWizard({
  next,
  presetRole,
  gate,
}: {
  next: string;
  presetRole?: 'member' | 'companion';
  gate?: string;
}) {
  const reduced   = useReducedMotion();
  const cardRef   = useRef<HTMLDivElement>(null);
  // When a role is preset (e.g. arriving from "Apply as companion"), skip the
  // role-picker step and start on "About you".
  const [step, setStep]               = useState(presetRole ? 1 : 0);
  const [dir,  setDir]                = useState(1);
  const [prefilledName, setPrefilledName] = useState<string | undefined>();
  const [form, setForm]               = useState<RegFormData>(
    presetRole ? { ...EMPTY, role: presetRole } : EMPTY,
  );
  const gateMessage = gate ? GATE_COPY[gate] : undefined;

  // Pre-fill from quiz without hydration mismatch (runs only on client)
  useEffect(() => {
    const quiz = getQuiz();
    if (quiz) {
      setForm(f => ({
        ...f,
        firstName: f.firstName || quiz.name,
        city:      f.city      || quiz.city,
      }));
      setPrefilledName(quiz.name);
    }
  }, []);

  // Move focus to card container when step changes (a11y)
  useEffect(() => {
    const t = setTimeout(() => cardRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [step]);

  function advance() { setDir(1);  setStep(s => s + 1); }
  function back()    { setDir(-1); setStep(s => s - 1); }
  function patch(partial: Partial<RegFormData>) {
    setForm(f => ({ ...f, ...partial }));
  }

  const vars = reduced ? fadeVariants : slideVariants;

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-8">
        <SegmentedPill steps={STEPS} current={step} />
      </div>

      {gateMessage && (
        <p
          className="mb-5 rounded-2xl px-4 py-3 font-sans text-sm text-center"
          style={{
            background: 'rgba(46,107,255,0.07)',
            border: '1.5px solid rgba(46,107,255,0.18)',
            color: 'var(--color-azure-deep)',
          }}
        >
          {gateMessage}
        </p>
      )}

      {/* Wizard card — tabIndex={-1} for programmatic focus only */}
      <div
        ref={cardRef}
        tabIndex={-1}
        className="rounded-3xl p-8 md:p-10 overflow-hidden outline-none"
        style={{
          background:  'var(--color-surface)',
          boxShadow:   'var(--shadow-lift)',
          border:      '1px solid rgba(46,107,255,0.12)',
        }}
      >
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={vars}
            initial="enter"
            animate="center"
            exit="exit"
            transition={reduced ? calm.fast : spring.soft}
          >
            {step === 0 && (
              <StepRole
                role={form.role}
                onSelect={r => { patch({ role: r }); advance(); }}
              />
            )}
            {step === 1 && (
              <StepAboutYou
                form={form}
                patch={patch}
                onBack={back}
                onNext={advance}
                prefilledName={prefilledName}
              />
            )}
            {step === 2 && (
              <StepVerify
                form={form}
                patch={patch}
                onBack={back}
                onNext={advance}
              />
            )}
            {step === 3 && (
              <StepDone form={form} next={next} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
