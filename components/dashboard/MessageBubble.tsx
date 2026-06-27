'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import type { ChatMessage } from '@/lib/appState';
import { QUICK_REACTIONS, isEmojiOnly } from '@/lib/chat/emoji';
import { spring } from '@/lib/motion';

// A single chat message: text bubble, large "jumbomoji" for emoji-only text, or
// a big sticker. Hover (desktop) or long-press (mobile) opens a quick-react bar;
// reactions show as little pills under the bubble (tap a pill to remove).
export function MessageBubble({ msg, onReact }: { msg: ChatMessage; onReact: (emoji: string) => void }) {
  const reduced = useReducedMotion();
  const [barOpen, setBarOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mine = msg.from === 'me';
  const sticker = msg.kind === 'sticker';
  const jumbo = !sticker && isEmojiOnly(msg.text);

  // A captioned sticker is stored as "caption <emoji>"; split it for a card.
  const stickerIsBig = sticker && isEmojiOnly(msg.text);
  const lastSpace = msg.text.lastIndexOf(' ');
  const stickerCaption = lastSpace > 0 ? msg.text.slice(0, lastSpace) : '';
  const stickerEmoji = lastSpace > 0 ? msg.text.slice(lastSpace + 1) : msg.text;

  const startPress = () => { pressTimer.current = setTimeout(() => setBarOpen(true), 380); };
  const endPress = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

  return (
    <div className={`group relative flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
      {/* Quick-react bar (hover/long-press) with click-away backdrop */}
      <AnimatePresence>
        {barOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setBarOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={spring.snappy}
              className={`absolute -top-10 z-30 flex gap-0.5 px-1.5 py-1 rounded-full shadow-lg ${mine ? 'right-0' : 'left-0'}`}
              style={{ background: 'var(--color-bg)', border: '1px solid rgba(46,107,255,0.15)' }}
            >
              {QUICK_REACTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { onReact(e); setBarOpen(false); }}
                  className="text-lg h-7 w-7 grid place-items-center rounded-full hover:scale-125 transition-transform"
                  aria-label={`React with ${e}`}
                >
                  {e}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1" onTouchStart={startPress} onTouchEnd={endPress} onTouchMove={endPress}>
        {/* Desktop hover affordance — appears left of my messages / right of theirs */}
        {mine && <ReactToggle onOpen={() => setBarOpen(true)} />}

        {sticker ? (
          stickerIsBig ? (
            <motion.span
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.snappy}
              className="text-5xl leading-none select-none"
              role="img"
              aria-label="Sticker"
            >
              {msg.text}
            </motion.span>
          ) : (
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.snappy}
              className="flex flex-col items-center gap-1 rounded-2xl px-4 py-3 select-none"
              style={{ background: 'var(--color-azure-tint)', border: '1px solid rgba(46,107,255,0.18)' }}
            >
              <span className="text-4xl leading-none" role="img" aria-label="Sticker">{stickerEmoji}</span>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-azure-deep)' }}>{stickerCaption}</span>
            </motion.div>
          )
        ) : (
          <span
            className={`font-sans rounded-2xl max-w-[72%] leading-relaxed ${jumbo ? 'text-4xl px-1 py-0.5' : 'text-sm px-3 py-2'}`}
            style={
              jumbo
                ? { color: 'var(--color-ink)' }
                : mine
                  ? { background: 'var(--color-azure)', color: '#fff' }
                  : { background: 'var(--color-surface)', color: 'var(--color-ink)', border: '1px solid rgba(46,107,255,0.1)' }
            }
          >
            {msg.text}
          </span>
        )}

        {!mine && <ReactToggle onOpen={() => setBarOpen(true)} />}
      </div>

      {/* Reaction pills */}
      {msg.reactions && msg.reactions.length > 0 && (
        <div className={`flex gap-0.5 mt-0.5 ${mine ? 'pr-1' : 'pl-1'}`}>
          {msg.reactions.map((e, i) => (
            <motion.button
              key={`${e}-${i}`}
              type="button"
              initial={reduced ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={spring.snappy}
              onClick={() => onReact(e)}
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--color-surface)', border: '1px solid rgba(46,107,255,0.12)' }}
              aria-label={`Remove reaction ${e}`}
            >
              {e}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// Small smile button revealed on hover (pointer devices); opens the react bar.
function ReactToggle({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Add reaction"
      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 shrink-0 grid place-items-center rounded-full"
      style={{ color: 'var(--color-ink-muted)' }}
    >
      <SmilePlus size={14} aria-hidden="true" />
    </button>
  );
}
