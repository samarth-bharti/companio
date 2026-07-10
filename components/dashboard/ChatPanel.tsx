'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Shield, Send, Smile } from 'lucide-react';
import { reactToMessage } from '@/lib/appState';
import { dataClient } from '@/lib/dataClient';
import type { ChatMessage } from '@/lib/appState';
import type { Companion } from '@/lib/data/companions';
import { calm, spring } from '@/lib/motion';
import { CONTACT_RE } from './chatReplies';
import { EmojiStickerPicker } from './EmojiStickerPicker';
import { MessageBubble } from './MessageBubble';

interface ChatPanelProps {
  companion: Companion;
  onBack?: () => void;
}

export function ChatPanel({ companion, onBack }: ChatPanelProps) {
  const [thread, setThread]     = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState('');
  const [blocked, setBlocked]   = useState(false);
  const [sendError, setSendError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const logRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced  = useEffectiveReducedMotion();

  useEffect(() => {
    let cancelled = false;
    dataClient.getThread(companion.id)
      .then((t) => { if (!cancelled) setThread(t); })
      .catch(() => { if (!cancelled) setThread([]); });
    return () => { cancelled = true; };
  }, [companion.id]);

  // Scroll to bottom whenever the thread changes.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [thread]);

  /**
   * Send a message and stop. There is no `triggerReply()` any more: this panel
   * used to answer on the companion's behalf from a two-line script, after a
   * jittered delay and a typing indicator. The message is persisted; the
   * companion replies when they read it, or they don't.
   */
  const post = async (text: string, kind?: 'sticker') => {
    setSendError('');
    const optimistic: ChatMessage = { id: `pending-${Date.now()}`, from: 'me', text, ts: Date.now(), ...(kind ? { kind } : {}) };
    setThread((t) => [...t, optimistic]);
    try {
      await dataClient.appendMessage(companion.id, { from: 'me', text, ...(kind ? { kind } : {}) });
      setThread(await dataClient.getThread(companion.id));
    } catch {
      // Roll the optimistic bubble back out: a message that failed to send must
      // not sit in the log looking delivered.
      setThread((t) => t.filter((m) => m.id !== optimistic.id));
      setSendError("That message didn't send. Please try again.");
    }
  };

  const send = () => {
    if (!input.trim()) return;
    if (CONTACT_RE.test(input)) { setBlocked(true); return; }
    setBlocked(false);
    const text = input.trim();
    setInput('');
    void post(text);
  };

  const sendSticker = (text: string) => {
    setPickerOpen(false);
    void post(text, 'sticker');
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

        {thread.length === 0 && (
          <p className="font-sans text-xs text-center py-8" style={{ color: 'var(--color-ink-muted)' }}>
            No messages yet. Say hello — {companion.firstName} will see this and reply when they&apos;re free.
          </p>
        )}
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

      {sendError && (
        <p role="alert" className="font-sans text-xs mb-1 px-1" style={{ color: '#C0392B' }}>
          {sendError}
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
