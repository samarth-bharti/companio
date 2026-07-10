'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  'Browse all verified companions in your city.',
  'Every booking is ID-verified and safety-checked.',
] as const;

export function StepDone({ form, next }: Props) {
  const router  = useRouter();
  const reduced = useEffectiveReducedMotion();
  const name    = form.firstName || 'Friend';

  // Persist demo user — runs only once on mount, client-side only.
  // City is carried so the companion application pre-fills it (one flow).
  useEffect(() => {
    // form.dob is already gated to 18+ by StepAboutYou; the server re-checks it
    // and stores it set-once, because a browser check is not a check.
    void dataClient.setUser({
      firstName: name,
      city: form.city || undefined,
      dateOfBirth: form.dob || undefined,
    });
    track('signup', { role: form.role });
  }, [name, form.city, form.dob, form.role]);

  function proceed() {
    if (form.role === 'companion') {
      // Companions continue straight into completing their profile + ID — it's
      // one onboarding, so go directly to the application (now pre-filled).
      router.push('/become-a-companion/apply');
      return;
    }
    const dest = next || '/explore';
    const sep = dest.includes('?') ? '&' : '?';
    router.push(`${dest}${sep}welcome=1`);
  }

  return (
    <div className="text-center py-2">
      {/* Milestone stamp — spring.stamp entrance handled inside MilestoneSeal */}
      <div className="flex justify-center mb-6">
        <MilestoneSeal
          label={`You're in, ${name}.`}
          sub="Welcome to Companio."
          size={72}
          withConfetti
        />
      </div>

      {/* Endowment perks list */}
      <ul
        className="flex flex-col gap-3 mb-8 text-left"
        aria-label="What's included with your account"
      >
        {PERKS.map((p, i) => (
          <motion.li
            key={p}
            className="flex items-start gap-2.5 font-sans text-sm"
            initial={reduced ? false : { opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { ...spring.soft, delay: 0.3 + i * stagger.tight }
            }
            style={{ color: 'var(--color-ink-muted)' }}
          >
            <CheckCircle2
              size={16}
              className="shrink-0 mt-0.5"
              style={{ color: '#157A4A' }}
              aria-hidden="true"
            />
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
        transition={
          reduced
            ? { duration: 0 }
            : { ...spring.soft, delay: 0.3 + PERKS.length * stagger.tight }
        }
      >
        {form.role === 'companion' ? 'Apply as companion →' : 'Start exploring →'}
      </motion.button>
    </div>
  );
}
