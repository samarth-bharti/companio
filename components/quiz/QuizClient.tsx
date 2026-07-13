'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { ArrowLeft, X } from 'lucide-react';
import { SegmentedPill } from '@/components/journey/SegmentedPill';
import { QuizQuestion } from './QuizQuestion';
import { LaborIllusion } from './LaborIllusion';
import { ResultReveal } from './ResultReveal';
import {
  QUESTIONS, QUIZ_STEPS, INITIAL_ANSWERS, STEP_ACCENTS,
  getEmpathyEcho, type QuizAnswers,
} from './quizData';
import { setQuiz, isMatchableGender } from '@/lib/journeyState';
import { dataClient } from '@/lib/dataClient';
import { useCompanions } from '@/lib/useCompanions';
import { rankCompanions } from '@/lib/matching';

type Phase = 'question' | 'echo' | 'illusion' | 'result';

/**
 * QuizClient — orchestrates the 7-question quiz funnel.
 * Server renders nothing; all localStorage access is in event handlers/effects.
 */
export function QuizClient() {
  const router = useRouter();
  const reduced = useEffectiveReducedMotion();

  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [answers, setAnswers] = useState<QuizAnswers>(INITIAL_ANSWERS);
  const [echoLine, setEchoLine] = useState('');

  // The real catalogue, from the database — the same list explore shows. The
  // result screen used to be built from a hardcoded seed import, which is why it
  // could promise "14 companions" in a city that has none.
  const { companions } = useCompanions();
  const [myGender, setMyGender] = useState<'male' | 'female' | 'nonbinary' | undefined>();

  useEffect(() => {
    let cancelled = false;
    dataClient
      .getUser()
      .then((u) => {
        if (!cancelled && isMatchableGender(u?.gender)) setMyGender(u!.gender as 'male' | 'female' | 'nonbinary');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Who actually fits, in the city they actually chose, ranked by the answers
  // they actually gave. Empty when the city has nobody — and the result screen
  // says so instead of inventing a match.
  const matches = useMemo(() => {
    const inCity = companions.filter(
      (c) => c.city.toLowerCase() === answers.city.toLowerCase(),
    );
    return rankCompanions(inCity, answers, myGender);
  }, [companions, answers, myGender]);

  // Declared before the effect below that calls it; stable identity (useCallback []).
  const triggerEcho = useCallback((key: string, currentAnswers: QuizAnswers) => {
    const line = getEmpathyEcho(key, currentAnswers);
    setEchoLine(line);
    setPhase('echo');
  }, []);

  // Keyboard: Enter on question screen tries to advance for single/name
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || phase !== 'question') return;
      const q = QUESTIONS[step];
      // Only auto-advance on single-select or city via Enter (the buttons handle the rest)
      if (q.type === 'single') {
        const val = q.key === 'listen' ? answers.listen : answers.time;
        if (val) triggerEcho(q.key, answers);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, step, answers, triggerEcho]);

  const advance = useCallback(() => {
    if (step < QUESTIONS.length - 1) {
      setStep((s) => s + 1);
      setPhase('question');
    } else {
      setPhase('illusion');
    }
  }, [step]);

  // Back: on the echo, return to the same question; otherwise step back one.
  // On the first question, leave the quiz entirely.
  const goBack = useCallback(() => {
    if (phase === 'echo') {
      setPhase('question');
      return;
    }
    if (step > 0) {
      setStep((s) => s - 1);
      setPhase('question');
    } else {
      router.push('/');
    }
  }, [phase, step, router]);

  // ── Answer handlers ──────────────────────────────────────────────────────────

  const handleSingle = useCallback((key: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      triggerEcho(key, next);
      return next;
    });
  }, [triggerEcho]);

  const handleMulti = useCallback((key: string, value: string[]) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      triggerEcho(key, next);
      return next;
    });
  }, [triggerEcho]);

  const handleComfort = useCallback((value: QuizAnswers['comfort']) => {
    setAnswers((prev) => {
      const next = { ...prev, comfort: value };
      triggerEcho('comfort', next);
      return next;
    });
  }, [triggerEcho]);

  const handleName = useCallback((name: string) => {
    setAnswers((prev) => {
      const next = { ...prev, name };
      triggerEcho('name', next);
      return next;
    });
  }, [triggerEcho]);

  // ── Navigation ───────────────────────────────────────────────────────────────

  const handleNavigate = useCallback(() => {
    // All localStorage writes happen here — safe in event handler.
    //
    // The answers are stored, not just the name: explore ranks against them, so
    // "Best match" means something. `matchedId` is now whoever actually came
    // first, and is empty when the chosen city has nobody in it.
    setQuiz({
      name: answers.name,
      city: answers.city,
      matchedId: matches[0]?.id ?? '',
      activities: answers.activities,
      languages: answers.languages,
      sameGender: answers.comfort.sameGender,
    });
    // The comfort answer is a promise, so it is written to the account, where
    // the explore filter can actually honour it. Saying "same-gender companions
    // only" and storing it nowhere is what this replaces.
    void dataClient.setUser({
      firstName: answers.name,
      sameGenderOnly: answers.comfort.sameGender,
    });
    router.push('/explore?matched=1');
  }, [answers, matches, router]);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (phase === 'illusion') {
    return <LaborIllusion answers={answers} onDone={() => setPhase('result')} />;
  }

  if (phase === 'result') {
    return (
      <ResultReveal
        name={answers.name}
        city={answers.city}
        matches={matches}
        onNavigate={handleNavigate}
      />
    );
  }

  const currentQ = QUESTIONS[step];
  const accent = STEP_ACCENTS[step];

  // Question swap: outgoing x→−40 / incoming x←40
  const variants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--grad-hero-bg)' }}
    >
      {/* Progress pill + back / exit affordances */}
      <div className="sticky top-0 z-20 px-3 sm:px-5 py-3 flex items-center justify-between gap-2"
        style={{ background: 'rgba(251,252,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(46,107,255,0.08)' }}>
        <button
          type="button"
          onClick={goBack}
          aria-label={step === 0 && phase === 'question' ? 'Leave the quiz' : 'Previous question'}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors hover:bg-azure-tint focus-visible:outline-azure"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <SegmentedPill steps={[...QUIZ_STEPS]} current={step} />
        <Link
          href="/"
          aria-label="Leave the quiz"
          className="inline-flex items-center justify-center w-10 h-10 rounded-full shrink-0 transition-colors hover:bg-azure-tint focus-visible:outline-azure"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <X size={18} aria-hidden="true" />
        </Link>
      </div>

      {/* Question area — aria-live so phase/step transitions are announced to SR */}
      <div className="flex-1" aria-live="polite" aria-atomic="false">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={reduced ? {} : variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduced
                ? { duration: 0.01 }
                : { type: 'spring', stiffness: 170, damping: 26 }
            }
          >
            <QuizQuestion
              question={currentQ}
              stepIndex={step}
              answers={answers}
              showEcho={phase === 'echo'}
              echoLine={echoLine}
              accent={accent}
              onSingleAnswer={handleSingle}
              onMultiAnswer={handleMulti}
              onComfortAnswer={handleComfort}
              onNameAnswer={handleName}
              onEchoDone={advance}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
