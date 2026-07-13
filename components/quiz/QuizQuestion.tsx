'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Seal } from '@/components/ui/Seal';
import { Button } from '@/components/ui/Button';
import { ChoiceTile } from './ChoiceTile';
import { EmpathyEcho } from './EmpathyEcho';
import { CITIES } from '@/lib/data/cities';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { QuizQuestionDef, QuizAnswers } from './quizData';

interface QuizQuestionProps {
  question: QuizQuestionDef;
  stepIndex: number;
  answers: QuizAnswers;
  showEcho: boolean;
  echoLine: string;
  accent: string;
  onSingleAnswer: (key: string, value: string) => void;
  onMultiAnswer: (key: string, value: string[]) => void;
  onComfortAnswer: (value: QuizAnswers['comfort']) => void;
  onNameAnswer: (name: string) => void;
  onEchoDone: () => void;
}

export function QuizQuestion({
  question, stepIndex, answers, showEcho, echoLine, accent,
  onSingleAnswer, onMultiAnswer, onComfortAnswer, onNameAnswer, onEchoDone,
}: QuizQuestionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Move focus to first interactive element on question mount
  useEffect(() => {
    const t = setTimeout(() => {
      const el = containerRef.current?.querySelector<HTMLElement>(
        'input,button:not([disabled])',
      );
      el?.focus();
    }, 120);
    return () => clearTimeout(t);
  }, [question.key]);

  return (
    <div className="relative min-h-[calc(100vh-88px)] flex flex-col">
      {/* Accent blob */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.07]"
        style={{ background: accent }}
      />
      {/* Split layout */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-5 pt-10 pb-16
                   grid md:grid-cols-2 gap-10 items-center"
      >
        {/* Left: avatar bubble + question heading */}
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <Seal size={28} decorative />
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={spring.soft}
              className="px-3 py-2 rounded-lg text-sm leading-snug max-w-[240px]"
              style={{
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(46,107,255,0.14)',
                color: 'var(--color-ink-muted)',
                backdropFilter: 'blur(8px)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {question.bubble}
            </motion.div>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.soft, delay: 0.08 }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.55rem, 3.2vw, 2.4rem)',
              color: 'var(--color-ink)',
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {question.title}
          </motion.h2>
        </div>

        {/* Right: echo or answer tiles */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...spring.soft, delay: 0.12 }}
        >
          {showEcho ? (
            <EmpathyEcho line={echoLine} onDone={onEchoDone} />
          ) : (
            <QuestionBody
              question={question}
              answers={answers}
              accent={accent}
              onSingleAnswer={onSingleAnswer}
              onMultiAnswer={onMultiAnswer}
              onComfortAnswer={onComfortAnswer}
              onNameAnswer={onNameAnswer}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ── QuestionBody ───────────────────────────────────────────────────────────────

interface BodyProps {
  question: QuizQuestionDef;
  answers: QuizAnswers;
  accent: string;
  onSingleAnswer: (key: string, value: string) => void;
  onMultiAnswer: (key: string, value: string[]) => void;
  onComfortAnswer: (v: QuizAnswers['comfort']) => void;
  onNameAnswer: (name: string) => void;
}

function QuestionBody({ question, answers, accent, onSingleAnswer, onMultiAnswer, onComfortAnswer, onNameAnswer }: BodyProps) {
  const { key, type, options } = question;

  const [citySearch, setCitySearch] = useState('');
  const [pendingMulti, setPendingMulti] = useState<string[]>(() => {
    const v = answers[key as keyof QuizAnswers];
    return Array.isArray(v) ? v : [];
  });
  const [pendingComfort, setPendingComfort] = useState(answers.comfort);
  const [nameVal, setNameVal] = useState(answers.name);

  const filteredCities = CITIES.filter((c) =>
    c.name.toLowerCase().includes(citySearch.toLowerCase()),
  );

  const toggleMulti = (id: string) =>
    setPendingMulti((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  if (type === 'city') {
    return (
      <fieldset className="border-0 p-0 m-0 flex flex-col gap-3">
        <legend className="sr-only">{question.title}</legend>
        <input
          type="search"
          placeholder="Search cities…"
          value={citySearch}
          onChange={(e) => setCitySearch(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg text-sm border"
          style={{ borderColor: 'rgba(46,107,255,0.22)', background: 'rgba(255,255,255,0.85)', color: 'var(--color-ink)' }}
          aria-label="Search cities"
        />
        <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto">
          {filteredCities.map((c) => (
            <button
              key={c.id} type="button"
              onClick={() => onSingleAnswer(key, c.name)}
              aria-pressed={answers.city === c.name}
              className={cn('px-3 py-1.5 rounded-pill text-sm font-medium border min-h-[36px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2')}
              style={{
                background: answers.city === c.name ? accent : 'rgba(255,255,255,0.75)',
                borderColor: answers.city === c.name ? accent : 'rgba(46,107,255,0.18)',
                color: answers.city === c.name ? 'white' : 'var(--color-ink)',
              }}
            >{c.name}</button>
          ))}
        </div>
      </fieldset>
    );
  }

  if (type === 'single' && options) {
    const currentVal = key === 'listen' ? answers.listen : answers.time;
    return (
      <fieldset className="border-0 p-0 m-0 flex flex-col gap-2.5">
        <legend className="sr-only">{question.title}</legend>
        {options.map((opt) => (
          <ChoiceTile key={opt.id} label={opt.label}
            selected={currentVal === opt.id}
            onClick={() => onSingleAnswer(key, opt.id)} accent={accent} />
        ))}
      </fieldset>
    );
  }

  if (type === 'multi' && options) {
    return (
      <fieldset className="border-0 p-0 m-0 flex flex-col gap-3">
        <legend className="sr-only">{question.title}</legend>
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => (
            <ChoiceTile key={opt.id} label={opt.label}
              selected={pendingMulti.includes(opt.id)}
              onClick={() => toggleMulti(opt.id)} accent={accent} />
          ))}
        </div>
        <Button variant="cta" size="md" disabled={pendingMulti.length === 0}
          onClick={() => onMultiAnswer(key, pendingMulti)} className="self-start mt-1">
          Next →
        </Button>
      </fieldset>
    );
  }

  if (type === 'comfort') {
    return (
      <fieldset className="border-0 p-0 m-0 flex flex-col gap-3">
        <legend className="sr-only">{question.title}</legend>
        <ComfortToggle label="I'd prefer a same-gender companion"
          checked={pendingComfort.sameGender}
          onChange={(v) => setPendingComfort((p) => ({ ...p, sameGender: v }))} accent={accent} />
        <ComfortToggle label="Public places first"
          checked={pendingComfort.publicPlaces}
          onChange={(v) => setPendingComfort((p) => ({ ...p, publicPlaces: v }))} accent={accent} />
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
          style={{ background: 'rgba(31,174,107,0.08)', border: '1px solid rgba(31,174,107,0.22)', color: '#157A4A' }}>
          <span aria-hidden="true">✓</span>
          <span>ID-verified companions, always on</span>
        </div>
        <Button variant="cta" size="md" onClick={() => onComfortAnswer(pendingComfort)} className="self-start">
          Next →
        </Button>
      </fieldset>
    );
  }

  // name-input
  return (
    <fieldset className="border-0 p-0 m-0 flex flex-col gap-3">
      <legend className="sr-only">Your first name</legend>
      <input type="text" autoComplete="given-name" placeholder="Your first name"
        value={nameVal} onChange={(e) => setNameVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && nameVal.trim()) onNameAnswer(nameVal.trim()); }}
        className="w-full px-4 py-3 rounded-lg text-base border"
        style={{ borderColor: 'rgba(46,107,255,0.22)', background: 'rgba(255,255,255,0.88)', color: 'var(--color-ink)', fontFamily: 'var(--font-sans)' }}
        aria-label="Your first name" />
      <Button variant="cta" size="md" disabled={!nameVal.trim()}
        onClick={() => onNameAnswer(nameVal.trim())} className="self-start">
        Find my companions →
      </Button>
    </fieldset>
  );
}

// ── ComfortToggle ──────────────────────────────────────────────────────────────

interface ComfortToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  accent: string;
}

const ComfortToggle = forwardRef<HTMLButtonElement, ComfortToggleProps>(
  ({ label, checked, onChange, accent }, ref) => (
    <button ref={ref} type="button" role="checkbox" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-lg border text-sm font-medium min-h-[44px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        background: checked ? accent : 'rgba(255,255,255,0.75)',
        borderColor: checked ? accent : 'rgba(46,107,255,0.18)',
        color: checked ? 'white' : 'var(--color-ink)',
      }}
    >
      <span aria-hidden="true"
        className="w-4 h-4 rounded flex items-center justify-center shrink-0 border"
        style={{ borderColor: checked ? 'white' : accent, background: checked ? 'rgba(255,255,255,0.25)' : 'transparent' }}>
        {checked && <span className="text-xs leading-none">✓</span>}
      </span>
      {label}
    </button>
  ),
);
ComfortToggle.displayName = 'ComfortToggle';
