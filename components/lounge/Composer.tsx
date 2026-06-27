'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Send, Mic, Smile, Shield } from 'lucide-react';
import { spring } from '@/lib/motion';
import { CONTACT_RE } from '@/components/dashboard/chatReplies';

// Three rotating sets — cycles every 9 s when composer is visible.
const ICEBREAKER_SETS = [
  ["What's your go-to café?", 'Free this weekend?', 'Plan a morning walk?', 'Best street food spot?', 'Museum or park?'],
  ['Favourite book recently?', 'Early bird or night owl?', 'Chai or coffee?', 'Suggest a city walk route?', 'Last live event you enjoyed?'],
  ['Trek or beach day?', 'Bandra or Colaba?', 'Solo or group activity?', 'Hidden gem in your area?', 'Photography walk this week?'],
];

interface ComposerProps {
  onSend: (text: string) => void;
  onVoice?: () => void;
  showIcebreakers?: boolean;
  placeholder?: string;
}

export function Composer({ onSend, onVoice, showIcebreakers, placeholder = 'Write a message…' }: ComposerProps) {
  const [value, setValue] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [setIdx, setSetIdx] = useState(0);
  const ref = useRef<HTMLTextAreaElement>(null);
  const reduced = useReducedMotion();

  // Rotate icebreaker set every 9 s when visible
  useEffect(() => {
    if (!showIcebreakers || reduced) return;
    const id = setInterval(() => setSetIdx(i => (i + 1) % ICEBREAKER_SETS.length), 9000);
    return () => clearInterval(id);
  }, [showIcebreakers, reduced]);

  const icebreakers = ICEBREAKER_SETS[setIdx];

  const handleSend = () => {
    if (!value.trim()) return;
    if (CONTACT_RE.test(value)) { setBlocked(true); return; }
    setBlocked(false);
    onSend(value.trim());
    setValue('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (blocked && !CONTACT_RE.test(e.target.value)) setBlocked(false);
    // Auto-grow textarea
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const insertIcebreaker = (chip: string) => {
    setValue(chip);
    ref.current?.focus();
  };

  return (
    <div className="flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid rgba(46,107,255,0.08)' }}>
      {/* Rotating icebreaker chips */}
      {showIcebreakers && (
        <div>
          <p className="text-xs mb-1 px-1" style={{ color: 'var(--color-ink-muted)' }}>
            💬 Suggestions
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={setIdx}
              initial={{ opacity: 0, y: reduced ? 0 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="flex gap-2 overflow-x-auto pb-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {icebreakers.map(chip => (
                <button
                  key={chip}
                  onClick={() => insertIcebreaker(chip)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-sans font-semibold whitespace-nowrap transition-colors"
                  style={{ border: '1.5px solid rgba(46,107,255,0.2)', color: 'var(--color-azure)', background: 'var(--color-azure-tint)' }}
                >
                  {chip}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Safety warning */}
      {blocked && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,178,62,0.1)', border: '1px solid rgba(255,178,62,0.3)' }}
        >
          <Shield size={12} aria-hidden="true" style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: 2 }} />
          <span className="text-xs font-sans leading-snug" style={{ color: 'var(--color-ink-muted)' }}>
            Keep it on Companio, contact details are hidden for your safety.
          </span>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 items-end">
        <button
          className="inline-flex items-center justify-center rounded-full shrink-0"
          style={{ width: 38, height: 38, color: 'var(--color-ink-muted)' }}
          aria-label="Add emoji"
          tabIndex={-1}
        >
          <Smile size={19} />
        </button>

        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKey}
          placeholder={placeholder}
          aria-label="Message"
          className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-sans resize-none"
          style={{
            border: `1.5px solid ${blocked ? 'rgba(255,178,62,0.4)' : 'rgba(46,107,255,0.15)'}`,
            color: 'var(--color-ink)',
            background: 'var(--color-bg)',
            minHeight: 44,
            maxHeight: 120,
            outline: 'none',
            lineHeight: 1.55,
            overflow: 'hidden',
          }}
        />

        {value.trim() ? (
          <motion.button
            onClick={handleSend}
            whileTap={reduced ? {} : { scale: 0.88 }}
            transition={spring.snappy}
            aria-label="Send message"
            className="inline-flex items-center justify-center rounded-full shrink-0"
            style={{ width: 44, height: 44, background: 'var(--grad-cta)' }}
          >
            <Send size={16} className="text-white" aria-hidden="true" />
          </motion.button>
        ) : onVoice ? (
          <motion.button
            onClick={onVoice}
            whileTap={reduced ? {} : { scale: 0.88 }}
            transition={spring.snappy}
            aria-label="Send voice note"
            className="inline-flex items-center justify-center rounded-full shrink-0"
            style={{ width: 44, height: 44, background: 'rgba(46,107,255,0.1)', color: 'var(--color-azure)' }}
          >
            <Mic size={18} aria-hidden="true" />
          </motion.button>
        ) : (
          <button
            disabled
            aria-label="Send message"
            className="inline-flex items-center justify-center rounded-full shrink-0"
            style={{ width: 44, height: 44, background: 'rgba(46,107,255,0.1)', color: 'var(--color-azure)', opacity: 0.45, cursor: 'default' }}
          >
            <Send size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
