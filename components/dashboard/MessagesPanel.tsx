'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { getThreads, appendMessage, getBookings } from '@/lib/appState';
import { getCompanion } from '@/lib/data/companions';
import type { Companion } from '@/lib/data/companions';
import { ChatPanel } from './ChatPanel';
import { calm, stagger } from '@/lib/motion';

const OPENERS: Record<string, string> = {
  ananya:  "Hi! Looking forward to our meetup, shall we say Bandstand at 10?",
  rohan:   "Hey! Versova beach at 6 AM works for me. See you there!",
  priya:   "Hi! The Sassoon Dock walk at 7 AM, Saturday works?",
  aarav:   "Hi! Looking forward to our conversation. Powai Lake evening sounds perfect.",
  zara:    "Hey! Ready for Juhu beach, 6 AM Sunday works for me!",
  kiran:   "Hi! Shivaji Park in the morning, 8 AM?",
  ishaan:  "Hey! Lower Parel gym at 7 AM sounds great.",
  meena:   "Hi! Filter coffee at Café Madras, Sunday afternoon is lovely.",
  sahil:   "Hi! Versova fishing village at dawn, the light is extraordinary then.",
  deepika: "Hi! Worli Sea Face at sunset is a great plan. See you Saturday!",
  arjun:   "Hey! RCF Colony walk Saturday morning, 7 AM works for me.",
  fatima:  "Hi! Malad creek trail at 6 AM. Looking forward to our run!",
  vivek:   "Hey! Flora Fountain books then Kala Ghoda Café, Sunday works.",
  nisha:   "Hi! Vile Parle lanes on Sunday morning, the sweet shops are best early.",
};

interface MessagesPanelProps {
  initialCompanionId?: string;
}

export function MessagesPanel({ initialCompanionId }: MessagesPanelProps) {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialCompanionId);
  const reduced = useReducedMotion();

  useEffect(() => {
    const threadIds  = Object.keys(getThreads());
    const bookingIds = getBookings().map((b) => b.companionId);
    const allIds = [...new Set([...(initialCompanionId ? [initialCompanionId] : []), ...threadIds, ...bookingIds])];
    const list   = allIds.map((id) => getCompanion(id)).filter((c): c is Companion => !!c);
    setCompanions(list);
  }, [initialCompanionId]);

  // Seed opener when companion selected with empty thread
  useEffect(() => {
    if (!selectedId) return;
    const existing = getThreads()[selectedId] ?? [];
    if (existing.length === 0) {
      const text = OPENERS[selectedId] ?? "Hi! Looking forward to meeting up soon.";
      appendMessage(selectedId, { from: 'them', text });
    }
  }, [selectedId]);

  const selected = selectedId ? getCompanion(selectedId) : undefined;

  return (
    <div className="flex gap-4" style={{ minHeight: 480 }}>
      {/* Thread list — hidden on mobile when a chat is open */}
      <nav
        aria-label="Conversations"
        className={`flex flex-col gap-1 ${selected ? 'hidden md:flex' : 'flex'}`}
        style={{ width: 220, minWidth: 180, flexShrink: 0 }}
      >
        <p
          className="font-sans text-xs font-semibold tracking-widest uppercase mb-2"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          Conversations
        </p>

        {companions.length === 0 && (
          <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Book a meetup to start messaging.
          </p>
        )}

        {/* Stagger thread list rows */}
        <motion.div
          className="flex flex-col gap-1"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
        >
          {companions.map((c) => {
            const msgs = getThreads()[c.id] ?? [];
            const last = msgs[msgs.length - 1];
            return (
              <motion.button
                key={c.id}
                variants={{ hidden: { opacity: 0, x: -6 }, visible: { opacity: 1, x: 0, transition: calm.base } }}
                onClick={() => setSelectedId(c.id)}
                aria-current={selectedId === c.id ? 'true' : undefined}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
                style={{
                  background: selectedId === c.id ? 'var(--color-azure-tint)' : 'transparent',
                  minHeight:  44,
                }}
              >
                <img
                  src={c.photo}
                  alt={c.firstName}
                  className="rounded-full object-cover shrink-0"
                  width={36}
                  height={36}
                  style={{ width: 36, height: 36 }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-sm truncate" style={{ color: 'var(--color-ink)' }}>
                    {c.firstName}
                  </p>
                  {last && (
                    <p className="font-sans text-xs truncate" style={{ color: 'var(--color-ink-muted)' }}>
                      {last.text}
                    </p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </nav>

      {/* Chat panel */}
      <div
        className={`flex-1 rounded-lg p-4 ${selected ? 'flex flex-col' : 'hidden md:flex items-center justify-center'}`}
        style={{
          background: 'var(--color-surface)',
          boxShadow:  'var(--shadow-1)',
          border:     '1.5px solid rgba(46,107,255,0.08)',
          minHeight:  420,
        }}
      >
        {selected ? (
          <ChatPanel companion={selected} onBack={() => setSelectedId(undefined)} />
        ) : (
          <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Select a conversation to start messaging.
          </p>
        )}
      </div>
    </div>
  );
}
