'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { spring } from '@/lib/motion';
import type { QuizAnswers } from './quizData';

interface LaborIllusionProps {
  answers: QuizAnswers;
  onDone: () => void;
}

function buildLines(answers: QuizAnswers): string[] {
  const city = answers.city || 'Mumbai';
  const topActivities = answers.activities.slice(0, 2).join(' & ') || 'city walks';
  const timePref = answers.time === 'mornings' ? 'mornings'
    : answers.time === 'weekday-eves' ? 'weekday evenings'
    : answers.time === 'weekends' ? 'weekends'
    : 'your schedule';

  return [
    `Scanning 2,300+ verified members in ${city}…`,
    `Matching your activities, ${topActivities}…`,
    `Checking who's free ${timePref}…`,
    answers.comfort.sameGender
      ? 'Filtering for same-gender companions…'
      : 'Applying your comfort preferences…',
    'Finalising your shortlist…',
  ];
}

/**
 * LaborIllusion — dark-panel interstitial after the last quiz question.
 * Shows an honest checklist of real-ish filter steps, ~3.5s total, then calls onDone.
 * Ethics: every line describes a real filter step — no fake countdown or fake numbers.
 */
export function LaborIllusion({ answers, onDone }: LaborIllusionProps) {
  const reduced = useEffectiveReducedMotion();
  const lines = buildLines(answers);
  const [visibleCount, setVisibleCount] = useState(0);
  const [checkedCount, setCheckedCount] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (doneRef.current) return;

    if (reduced) {
      // All at once, hold 1.2s
      setVisibleCount(lines.length);
      setCheckedCount(lines.length);
      const t = setTimeout(() => { doneRef.current = true; onDone(); }, 1200);
      return () => clearTimeout(t);
    }

    // Staggered: reveal a line every ~380ms, check it 380ms later.
    // Total ≈ (5-1)*380 + 430 + 250 = 1520 + 680 = 2200ms target.
    const timers: ReturnType<typeof setTimeout>[] = [];
    lines.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), i * 380 + 80));
      timers.push(setTimeout(() => setCheckedCount(i + 1), i * 380 + 430));
    });
    const total = (lines.length - 1) * 380 + 430 + 250;
    timers.push(setTimeout(() => { doneRef.current = true; onDone(); }, total));

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--grad-dark-panel)' }}
      role="status"
      aria-live="polite"
      aria-label="Finding your companions, please wait"
    >
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <MilestoneSeal
          label={`Hold on, ${answers.name || 'there'}, finding your people…`}
          size={64}
        />

        {/* Checklist */}
        <div className="relative w-full flex flex-col gap-0">
          {/* Aurora thread — vertical line connecting checkmarks */}
          <AuroraThread visibleCount={visibleCount} totalLines={lines.length} reduced={!!reduced} />

          {lines.map((line, i) => {
            const visible = i < visibleCount;
            const checked = i < checkedCount;
            return (
              <motion.div
                key={line}
                className="relative flex items-center gap-4 py-3 pl-8"
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
                transition={reduced ? { duration: 0 } : { ...spring.soft, delay: 0 }}
              >
                {/* Checkmark */}
                <motion.span
                  aria-hidden="true"
                  className="absolute left-0 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: checked ? 'var(--grad-seal)' : 'rgba(255,255,255,0.12)',
                    border: checked ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                  }}
                  initial={reduced ? false : { scale: checked ? 0 : 1 }}
                  animate={{ scale: 1 }}
                  transition={spring.stamp}
                >
                  {checked && (
                    <motion.span
                      className="text-white text-xs font-bold leading-none"
                      initial={reduced ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={spring.stamp}
                    >
                      ✓
                    </motion.span>
                  )}
                </motion.span>

                <span
                  className="text-sm leading-relaxed"
                  style={{ color: visible ? 'var(--color-panel-text)' : 'rgba(244,242,255,0.35)' }}
                >
                  {line}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Aurora Thread — draws down connecting the checkmarks ──────────────────────

function AuroraThread({ visibleCount, totalLines, reduced }: {
  visibleCount: number; totalLines: number; reduced: boolean;
}) {
  const progress = totalLines > 1 ? visibleCount / totalLines : 0;
  return (
    <div
      aria-hidden="true"
      className="absolute left-[9px] top-5 bottom-5 w-[2px] pointer-events-none overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}
    >
      <motion.div
        className="w-full origin-top"
        style={{ background: 'var(--grad-aurora)', borderRadius: '2px' }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: reduced ? progress : progress }}
        transition={reduced ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
