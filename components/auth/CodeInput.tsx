'use client';

import { useRef } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { pop } from '@/lib/motion';

const INPUT_STYLE = {
  background: 'var(--color-bg)',
  border: '1.5px solid rgba(20,26,46,0.14)',
  color: 'var(--color-ink)',
};

/**
 * Six boxes, one code. Presentational: it holds no notion of what a valid code
 * is, because only the server does. `value` is always exactly six entries.
 *
 * Autofilling from the SMS/email one-time-code hint is deliberately supported
 * on the first box (`autoComplete="one-time-code"`), which is also why paste is
 * handled on every box rather than just the first.
 */
export function CodeInput({
  value,
  onChange,
  disabled = false,
  invalid = false,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const reduced = useEffectiveReducedMotion();
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function setDigit(i: number, raw: string) {
    if (!/^\d?$/.test(raw)) return;
    const next = [...value];
    next[i] = raw.slice(-1);
    onChange(next);
    if (raw && i < 5) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length !== 6) return;
    e.preventDefault();
    onChange(text.split(''));
    refs.current[5]?.focus();
  }

  return (
    <div className="flex gap-2 justify-center" role="group" aria-label="Six-digit code">
      {value.map((d, i) => (
        <motion.div
          key={i}
          animate={reduced ? {} : { scale: d ? [1, 1.12, 1] : 1 }}
          transition={reduced ? { duration: 0 } : pop}
        >
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            disabled={disabled}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            onFocus={(e) => e.target.select()}
            aria-label={`Digit ${i + 1} of 6`}
            aria-invalid={invalid || undefined}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            className="w-11 h-12 rounded-xl text-center font-sans font-bold text-lg disabled:opacity-60"
            style={{
              ...INPUT_STYLE,
              border: `1.5px solid ${invalid ? '#C0392B' : 'rgba(20,26,46,0.14)'}`,
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export const EMPTY_CODE = ['', '', '', '', '', ''];
