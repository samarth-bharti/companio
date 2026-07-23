'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { useViewerReady } from '@/lib/useViewerReady';
import { dataClient } from '@/lib/dataClient';
import type { ChatMessage } from '@/lib/appState';
import type { Companion } from '@/lib/data/companions';
import { ChatPanel } from './ChatPanel';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';
import { calm, stagger } from '@/lib/motion';

interface MessagesPanelProps {
  initialCompanionId?: string;
}

export function MessagesPanel({ initialCompanionId }: MessagesPanelProps) {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({});
  const [selectedId, setSelectedId] = useState<string | undefined>(initialCompanionId);
  const reduced = useEffectiveReducedMotion();
  const signedIn = useViewerReady();

  useEffect(() => {
    // A guest has no threads and no bookings; both endpoints answer 401.
    if (!signedIn) return;
    let cancelled = false;
    Promise.all([dataClient.getThreads(), dataClient.getBookings()])
      .then(async ([loaded, bookings]) => {
        if (cancelled) return;
        setThreads(loaded);
        const allIds = [...new Set([
          ...(initialCompanionId ? [initialCompanionId] : []),
          ...Object.keys(loaded),
          ...bookings.map((b) => b.companionId),
        ])];
        const resolved = await Promise.all(allIds.map(id => dataClient.getCompanion(id)));
        if (!cancelled) setCompanions(resolved.filter((c): c is Companion => !!c));
      })
      .catch(() => { if (!cancelled) setCompanions([]); });
    return () => { cancelled = true; };
  }, [initialCompanionId, signedIn]);

  // There used to be an effect here that, on opening an empty thread, wrote a
  // message FROM the companion: "Hi! Looking forward to our meetup, shall we say
  // Bandstand at 10?" — a specific commitment, from a person who had not agreed
  // to it, planted so the inbox never looked empty. An empty thread now looks
  // empty, and ChatPanel invites the member to say the first word.

  const selected = selectedId ? companions.find(c => c.id === selectedId) : undefined;

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
            const msgs = threads[c.id] ?? [];
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
        ) : companions.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={18} aria-hidden="true" />}
            title="No conversations yet"
            description="Book a meetup and your chat with the companion opens here — you can plan the details before you meet."
            action={{ href: '/explore', label: 'Find a companion →' }}
          />
        ) : (
          <EmptyState compact title="Select a conversation to start messaging" />
        )}
      </div>
    </div>
  );
}
