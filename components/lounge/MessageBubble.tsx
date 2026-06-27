'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { spring } from '@/lib/motion';
import { VoiceNote } from './VoiceNote';
import type { Reaction } from './data';

const QUICK_EMOJIS = ['👍', '❤️', '😄', '🙌', '🔥'];

interface MessageBubbleProps {
  id: string;
  isMine: boolean;
  text?: string;
  type?: 'text' | 'voice';
  voiceDuration?: string;
  authorName?: string;
  authorPhoto?: string;
  time: string;
  reactions?: Reaction[];
  showAuthor?: boolean;  // true = group chat, show name+avatar for others
  onReact: (msgId: string, emoji: string) => void;
}

// memo: new messages arriving only re-render the new bubble, not the whole thread.
// onReact is stable via useCallback in LoungeRoom.
export const MessageBubble = memo(function MessageBubble({
  id, isMine, text, type = 'text', voiceDuration, authorName, authorPhoto,
  time, reactions = [], showAuthor, onReact,
}: MessageBubbleProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [burstEmoji, setBurstEmoji] = useState<string | null>(null);
  const reduced = useReducedMotion();

  const fireReact = (emoji: string) => {
    onReact(id, emoji);
    setPickerOpen(false);
    if (!reduced) {
      setBurstEmoji(emoji);
      setTimeout(() => setBurstEmoji(null), 600);
    }
  };

  const bubbleStyle = isMine
    ? { background: 'var(--color-azure)', color: '#fff', borderBottomRightRadius: 4 }
    : { background: 'var(--color-surface)', color: 'var(--color-ink)', border: '1px solid rgba(46,107,255,0.1)', borderBottomLeftRadius: 4 };

  return (
    <div className={`flex gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar slot — always reserve space so bubbles line up */}
      {!isMine && (
        showAuthor && authorPhoto
          ? <Image src={authorPhoto} alt={authorName ?? ''} width={26} height={26} style={{ width: 26, height: 26 }} className="rounded-full object-cover self-end shrink-0" />
          : <span style={{ width: 26, flexShrink: 0 }} />
      )}

      <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMine ? 'items-end' : 'items-start'}`}>
        {!isMine && showAuthor && authorName && (
          <span className="text-xs font-sans font-semibold px-1" style={{ color: 'var(--color-ink-muted)' }}>
            {authorName}
          </span>
        )}

        <div className="relative group">
          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={spring.soft}
            onDoubleClick={() => setPickerOpen(p => !p)}
            className="px-3 py-2 rounded-2xl cursor-default select-text"
            style={bubbleStyle}
          >
            {type === 'voice'
              ? <VoiceNote duration={voiceDuration ?? '0:30'} isMine={isMine} />
              : <span className="font-sans text-sm leading-relaxed">{text}</span>
            }
          </motion.div>

          {/* Hover quick-react button */}
          <button
            onClick={() => setPickerOpen(p => !p)}
            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-base leading-none ${isMine ? '-left-7' : '-right-7'}`}
            aria-label="React to message"
            tabIndex={-1}
          >
            😊
          </button>

          {/* Reaction picker — opens on double-click or hover button */}
          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                key="picker"
                initial={{ opacity: 0, scale: 0.75, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={spring.snappy}
                className={`absolute z-20 flex gap-0.5 p-1.5 rounded-full shadow-lg ${isMine ? 'right-0' : 'left-0'}`}
                style={{ bottom: 'calc(100% + 4px)', background: 'var(--color-surface)', border: '1px solid rgba(46,107,255,0.12)', boxShadow: 'var(--shadow-2)' }}
              >
                {QUICK_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => fireReact(e)}
                    className="text-base leading-none px-1 rounded-full hover:scale-125 transition-transform"
                    aria-label={`React ${e}`}
                  >{e}</button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Emoji burst when reaction is added */}
          <AnimatePresence>
            {burstEmoji && (
              <motion.span
                key="burst"
                className="absolute inset-0 flex items-center justify-center pointer-events-none text-2xl"
                initial={{ opacity: 0, scale: 0.4, y: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0.4, 1.5, 1], y: -24 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
                aria-hidden="true"
              >
                {burstEmoji}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Reaction chips */}
        {reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {reactions.map(r => (
              <motion.button
                key={r.emoji}
                onClick={() => fireReact(r.emoji)}
                whileTap={reduced ? {} : { scale: 1.25 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-sans"
                style={{
                  background: r.myReact ? 'var(--color-azure-tint)' : 'rgba(20,26,46,0.06)',
                  border: r.myReact ? '1px solid var(--color-azure)' : '1px solid transparent',
                  color: r.myReact ? 'var(--color-azure)' : 'var(--color-ink-muted)',
                }}
                aria-label={`${r.emoji} ${r.count}`}
              >{r.emoji} {r.count}</motion.button>
            ))}
          </div>
        )}

        <span className="text-xs px-1" style={{ color: 'var(--color-ink-muted)', opacity: 0.65 }}>{time}</span>
      </div>
    </div>
  );
});
