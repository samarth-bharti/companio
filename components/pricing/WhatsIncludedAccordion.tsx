'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { ChevronDown, ShieldCheck, BadgeCheck, Headphones, RotateCcw, Undo2 } from 'lucide-react';
import { durations, spring, stagger } from '@/lib/motion';

const ITEMS = [
  {
    Icon: ShieldCheck,
    title: 'Nothing to pay to meet',
    body: 'Your first meeting is included with your pass. You are never charged to meet a companion.',
  },
  {
    Icon: BadgeCheck,
    title: 'ID-checked companions',
    body: 'Every companion submits a government ID, and a person on our team reviews it before they can list.',
  },
  {
    Icon: Headphones,
    // Was: "24/7 SOS support — one tap gets a Companio safety rep on the phone at
    // any point during your meetup."
    //
    // There is no rep, no phone line, and nobody staffing anything. lib/safety/sos.ts
    // is deliberately the opposite: the browser's Geolocation API, a Google Maps
    // link, and the Web Share API sending it to a contact the MEMBER chose — a
    // path that works even when our servers are down, because it never touches
    // them. That is a good feature. It is not a safety desk, and a member in
    // trouble tapping it expecting a human to pick up is the worst possible
    // moment to discover the difference.
    title: 'SOS, built in',
    body: 'One tap sends your live location and your companion’s name to a trusted contact you choose, over WhatsApp or SMS. It works without us — no Companio staff are involved, and there is no phone line to call.',
  },
  {
    Icon: RotateCcw,
    // "Up to 4 hours before" was a number no code produced: the reschedule path
    // (app/api/bookings/[id]) applies no time check at all. Rather than invent a
    // cutoff or add one nobody asked for, say what actually happens.
    title: 'Free reschedule',
    body: 'Plans change. Move a meetup to another time at no charge — there is no cut-off and no fee.',
  },
  {
    Icon: Undo2,
    title: 'Nothing renews',
    body: 'A pass is a single payment. We never store a mandate against your card or UPI, so you are never charged a second time without asking for it.',
  },
] as const;

export function WhatsIncludedAccordion() {
  const [open, setOpen] = useState(false);
  const reduced = useEffectiveReducedMotion();

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[rgba(20,26,46,0.10)] bg-[var(--color-surface)] overflow-hidden"
      style={{ boxShadow: 'var(--shadow-1)' }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="whats-included-region"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-[var(--color-ink)] hover:bg-black/[.02] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-azure)] focus-visible:outline-offset-[-2px]"
      >
        <span>What&apos;s included</span>
        {/* Chevron rotates — --ease-enter matches cubic-bezier(0.16,1,0.30,1) */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: durations.fast, ease: [0.16, 1, 0.3, 1] }
          }
          aria-hidden="true"
        >
          <ChevronDown size={18} className="text-[var(--color-ink-muted)]" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="whats-included-region"
            role="region"
            aria-label="What's included with every meetup credit"
            key="body"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: durations.base, ease: [0.16, 1, 0.3, 1] }
            }
            className="overflow-hidden"
          >
            {/* Items stagger in when accordion opens */}
            <motion.ul
              className="px-5 pb-5 flex flex-col gap-3.5"
              variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
              initial={reduced ? false : 'hidden'}
              animate="visible"
            >
              {ITEMS.map(({ Icon, title, body }) => (
                <motion.li
                  key={title}
                  className="flex items-start gap-3"
                  variants={{
                    hidden:  { opacity: 0, y: 6 },
                    visible: { opacity: 1, y: 0, transition: spring.soft },
                  }}
                >
                  <Icon
                    size={16}
                    className="mt-0.5 shrink-0 text-[var(--color-azure)]"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
                    <p className="text-sm text-[var(--color-ink-muted)] leading-snug mt-0.5">{body}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
