'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { calm, spring } from '@/lib/motion';
import { MessageBubble } from './MessageBubble';
import type { Reaction } from './data';

// ── Sub-components ─────────────────────────────────────────────────────────────

function TypingIndicator() {
  const reduced = useReducedMotion();
  return (
    <div className="flex justify-start pl-8" aria-label="Typing…">
      <span
        className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid rgba(46,107,255,0.1)' }}
      >
        {/* CSS animation — compositor handles all 3 dots, zero JS per frame.
            companio-typing-dot keyframe is defined in globals.css. */}
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="block rounded-full"
            style={{
              width: 6, height: 6, background: 'var(--color-ink-muted)',
              animation: reduced ? 'none' : `companio-typing-dot 0.7s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </span>
    </div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px" style={{ background: 'rgba(46,107,255,0.08)' }} />
      <span className="text-xs font-sans px-2 shrink-0" style={{ color: 'var(--color-ink-muted)', opacity: 0.7 }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(46,107,255,0.08)' }} />
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StreamMessage {
  id: string;
  from: string;
  text?: string;
  type?: 'text' | 'voice';
  voiceDuration?: string;
  time: string;
  reactions?: Reaction[];
  authorName?: string;
  authorPhoto?: string;
  dateLabel?: string;
}

interface ChatStreamProps {
  messages: StreamMessage[];
  isTyping?: boolean;
  isGroup?: boolean;
  onReact: (msgId: string, emoji: string) => void;
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function ChatStream({ messages, isTyping, isGroup, onReact }: ChatStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [newCount, setNewCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevLengthRef = useRef(messages.length);

  // Track scroll position to decide if user is at bottom.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCount(0);
  }, []);

  // When new messages arrive, count unread if scrolled up.
  useEffect(() => {
    const added = messages.length - prevLengthRef.current;
    prevLengthRef.current = messages.length;
    if (added > 0 && !isAtBottom) {
      setNewCount(n => n + added);
    }
  }, [messages.length, isAtBottom]);

  // Scroll the chat CONTAINER to the bottom (never the page). Using the
  // container's own scrollTop avoids scrollIntoView dragging the whole window
  // down — which made the Lounge page open scrolled to the bottom.
  const scrollToBottom = useCallback(
    (smooth: boolean) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    },
    [],
  );

  // Auto-scroll to bottom only when user is already there.
  useEffect(() => {
    if (!isAtBottom) return;
    scrollToBottom(!reduced);
  }, [messages.length, isTyping, isAtBottom, reduced, scrollToBottom]);

  const jumpToLatest = () => {
    setNewCount(0);
    setIsAtBottom(true);
    scrollToBottom(!reduced);
  };

  return (
    <div className="relative flex-1 overflow-hidden">
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto flex flex-col gap-1 py-4 px-3"
      aria-live="polite"
      aria-label="Chat messages"
      style={{ overscrollBehavior: 'contain' }}
    >
      <AnimatePresence initial={false}>
        {messages.map((msg, i) => {
          const prevFrom = i > 0 ? messages[i - 1].from : null;
          const showAuthor = isGroup && msg.from !== 'me' && msg.from !== prevFrom;

          return (
            <motion.div
              key={msg.id}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={calm.fast}
            >
              {msg.dateLabel && <DateSeparator label={msg.dateLabel} />}
              <MessageBubble
                id={msg.id}
                isMine={msg.from === 'me'}
                text={msg.text}
                type={msg.type}
                voiceDuration={msg.voiceDuration}
                authorName={msg.authorName}
                authorPhoto={msg.authorPhoto}
                time={msg.time}
                reactions={msg.reactions}
                showAuthor={showAuthor}
                onReact={onReact}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {isTyping && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={calm.fast}
          >
            <TypingIndicator />
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} aria-hidden="true" />
    </div>

    {/* "+N new messages" jump-to-latest pill */}
    <AnimatePresence>
      {newCount > 0 && (
        <motion.button
          key="new-pill"
          onClick={jumpToLatest}
          initial={{ opacity: 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={spring.snappy}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
          style={{
            background: 'var(--color-azure)',
            color: '#fff',
            boxShadow: 'var(--glow-azure)',
          }}
          aria-label={`${newCount} new message${newCount > 1 ? 's' : ''}, jump to latest`}
        >
          ↓ +{newCount} new message{newCount > 1 ? 's' : ''}
        </motion.button>
      )}
    </AnimatePresence>
    </div>
  );
}
