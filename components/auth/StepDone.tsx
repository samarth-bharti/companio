'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { CheckCircle2 } from 'lucide-react';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { dataClient } from '@/lib/dataClient';
import { track } from '@/lib/analytics';
import { spring, stagger } from '@/lib/motion';
import type { RegFormData } from './RegisterWizard';

interface Props {
  form: RegFormData;
  next: string;
}

const PERKS = [
  'Your 2 included meetups are waiting, yours anytime, no expiry.',
  'Browse every verified companion in your city.',
  'Every booking is ID-verified and safety-checked.',
] as const;

/**
 * The account and its session already exist by the time this renders — StepVerify
 * exchanged the email code for both. All that remains is to attach the profile
 * the user gave us on the way through.
 *
 * The write can still fail (the server re-checks the date of birth, because a
 * browser check is not a check). If it does, we say so instead of celebrating.
 */
export function StepDone({ form, next }: Props) {
  const reduced = useEffectiveReducedMotion();
  const name = form.firstName || 'Friend';
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    dataClient
      .setUser({
        firstName: name,
        city: form.city || undefined,
        dateOfBirth: form.dob || undefined,
      })
      .then(() => {
        if (!cancelled) track('signup', { role: form.role });
      })
      .catch(() => {
        if (!cancelled) {
          setSaveError(
            "Your account was created, but we couldn't save your profile. You can finish it from your dashboard.",
          );
        }
      });
    return () => { cancelled = true; };
  }, [name, form.city, form.dob, form.role]);

  function proceed() {
    // A hard navigation, not router.push. The session cookie was set by a fetch,
    // and any server component rendered from the client router's cache would
    // still be rendering for a guest.
    if (form.role === 'companion') {
      // Companions continue straight into completing their profile + ID — it's
      // one onboarding, so go directly to the application (now pre-filled).
      window.location.assign('/become-a-companion/apply');
      return;
    }
    const dest = next || '/explore';
    window.location.assign(`${dest}${dest.includes('?') ? '&' : '?'}welcome=1`);
  }

  return (
    <div className="text-center py-2">
      <div className="flex justify-center mb-6">
        <MilestoneSeal label={`You're in, ${name}.`} sub="Welcome to Companio." size={72} withConfetti />
      </div>

      {saveError && (
        <p
          role="alert"
          className="mb-6 rounded-2xl px-4 py-3 font-sans text-sm"
          style={{ background: 'rgba(192,57,43,0.06)', border: '1.5px solid rgba(192,57,43,0.20)', color: '#C0392B' }}
        >
          {saveError}
        </p>
      )}

      <ul className="flex flex-col gap-3 mb-8 text-left" aria-label="What's included with your account">
        {PERKS.map((p, i) => (
          <motion.li
            key={p}
            className="flex items-start gap-2.5 font-sans text-sm"
            initial={reduced ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduced ? { duration: 0 } : { ...spring.soft, delay: 0.3 + i * stagger.tight }}
            style={{ color: 'var(--color-ink-muted)' }}
          >
            <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: '#157A4A' }} aria-hidden="true" />
            {p}
          </motion.li>
        ))}
      </ul>

      <motion.button
        type="button"
        onClick={proceed}
        className="w-full h-12 rounded-pill font-sans font-bold text-sm text-white"
        style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { ...spring.soft, delay: 0.3 + PERKS.length * stagger.tight }}
      >
        {form.role === 'companion' ? 'Apply as companion →' : 'Start exploring →'}
      </motion.button>
    </div>
  );
}
