'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Shield, Send, Smile } from 'lucide-react';
import { getThread, appendMessage, reactToMessage } from '@/lib/appState';
import type { ChatMessage } from '@/lib/appState';
import type { Companion } from '@/lib/data/companions';
import { calm, spring } from '@/lib/motion';
import { CONTACT_RE, randomReply, replyDelayMs } from './chatReplies';
import { EmojiStickerPicker } from './EmojiStickerPicker';
import { MessageBubble } from './MessageBubble';

// Three bouncing dots shown while the companion is "typing".
function TypingIndicator() {
  const reduced = useEffectiveReducedMotion();
  return (
    <div className="flex justify-start" aria-label="Typing…">
      <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid rgba(46,107,255,0.1)' }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="block rounded-full" style={{ width: 6, height: 6, background: 'var(--color-ink-muted)', animation: reduced ? 'none' : `companio-typing-dot 0.7s ease-in-out ${i * 0.18}s infinite` }} />
        ))}
      </span>
    </div>
  );
}

interface ChatPanelProps {
  companion: Companion;
  onBack?: () => void;
}

export function ChatPanel({ companion, onBack }: ChatPanelProps) {
  const [thread, setThread]     = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState('');
  const [blocked, setBlocked]   = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const logRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced  = useEffectiveReducedMotion();

  useEffect(() => { setThread(getThread(companion.id)); }, [companion.id]);

  // Scroll to bottom whenever thread or typing indicator changes.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [thread, isTyping]);

  // Simulated companion reply after any of my messages (text or sticker).
  const triggerReply = () => {
    setIsTyping(true);
    const reply = randomReply(companion.id);
    setTimeout(() => {
      setIsTyping(false);
      appendMessage(companion.id, { from: 'them', text: reply });
      setThread(getThread(companion.id));
    }, replyDelayMs());
  };

  const send = () => {
    if (!input.trim()) return;
    if (CONTACT_RE.test(input)) { setBlocked(true); return; }
    setBlocked(false);
    appendMessage(companion.id, { from: 'me', text: input.trim() });
    setInput('');
    setThread(getThread(companion.id));
    triggerReply();
  };

  const sendSticker = (text: string) => {
    setPickerOpen(false);
    appendMessage(companion.id, { from: 'me', text, kind: 'sticker' });
    setThread(getThread(companion.id));
    triggerReply();
  };

  const addEmoji = (emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleReact = (id: string, emoji: string) => {
    setThread(reactToMessage(companion.id, id, emoji));
  };

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 420 }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 mb-3" style={{ borderBottom: '1px solid rgba(46,107,255,0.08)' }}>
        {onBack && (
          <motion.button onClick={onBack} aria-label="Back to thread list" whileTap={reduced ? {} : { scale: 0.95 }} transition={spring.snappy} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md" style={{ color: 'var(--color-ink-muted)' }}>←</motion.button>
        )}
        <Image src={companion.photo} alt={companion.firstName} width={36} height={36} className="rounded-full object-cover shrink-0" />
        <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>{companion.firstName}</span>
      </div>

      {/* Chat log */}
      <div ref={logRef} aria-live="polite" aria-label="Chat messages" className="flex-1 overflow-y-auto flex flex-col gap-2 pb-2 pr-1" style={{ maxHeight: 320 }}>
        <AnimatePresence initial={false}>
          {thread.map((msg) => (
            <motion.div key={msg.id} initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={calm.fast}>
              <MessageBubble msg={msg} onReact={(e) => handleReact(msg.id, e)} />
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && (
            <motion.div key="typing" initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={calm.fast}>
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Safety strip */}
      <div className="flex items-start gap-2 py-2 px-3 rounded-md my-2" style={{ background: 'rgba(31,174,107,0.07)', border: '1px solid rgba(31,174,107,0.15)' }}>
        <Shield size={13} aria-hidden="true" style={{ color: '#157A4A', marginTop: 2, flexShrink: 0 }} />
        <p className="font-sans text-xs leading-snug" style={{ color: '#157A4A' }}>
          For everyone&apos;s safety, contact details stay hidden until a meetup is confirmed.
        </p>
      </div>

      {blocked && (
        <p className="font-sans text-xs mb-1 px-1" style={{ color: 'var(--color-ink-muted)' }}>
          Numbers and emails are hidden until you&apos;ve met, it keeps everyone safe.
        </p>
      )}

      {/* Input row */}
      <div className="relative flex gap-2 items-center mt-1">
        <button type="button" onClick={() => setPickerOpen((o) => !o)} aria-label="Open emoji and sticker picker" className="shrink-0 inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full" style={{ color: pickerOpen ? 'var(--color-azure)' : 'var(--color-ink-muted)' }}>
          <Smile size={20} aria-hidden="true" />
        </button>

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); if (blocked && !CONTACT_RE.test(e.target.value)) setBlocked(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Write a message…"
          aria-label="Message input"
          className="flex-1 rounded-pill px-4 py-2 text-sm font-sans min-h-[44px]"
          style={{ border: '1.5px solid rgba(46,107,255,0.15)', color: 'var(--color-ink)', background: 'var(--color-bg)', outline: 'none' }}
        />

        <motion.button onClick={send} aria-label="Send message" whileTap={reduced ? {} : { scale: 0.9 }} transition={spring.snappy} className="rounded-full inline-flex items-center justify-center min-w-[44px] min-h-[44px]" style={{ background: 'var(--grad-cta)' }}>
          <Send size={16} className="text-white" aria-hidden="true" />
        </motion.button>

        <EmojiStickerPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onEmoji={addEmoji} onSticker={sendSticker} />
      </div>
    </div>
  );
}
