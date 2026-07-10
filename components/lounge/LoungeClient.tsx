'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { MessageCircle } from 'lucide-react';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { LoungeSidebar } from './LoungeSidebar';
import { LoungeRoom } from './LoungeRoom';
import { DirectThread } from './DirectThread';
import { LOUNGES, DIRECT_THREADS } from './data';

type SidebarTab = 'lounges' | 'direct';

export function LoungeClient() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('lounges');
  const [activeLoungeId, setActiveLoungeId] = useState<string | null>(LOUNGES[0]?.id ?? null);
  const [activeDirectId, setActiveDirectId] = useState<string | null>(null);
  // DMs whose unread badge has been cleared by opening the thread.
  const [readDirectIds, setReadDirectIds] = useState<Set<string>>(() => new Set());
  const reduced = useEffectiveReducedMotion();

  const hasActive = activeLoungeId !== null || activeDirectId !== null;
  const activeLounge = LOUNGES.find(l => l.id === activeLoungeId) ?? null;
  const activeThread = DIRECT_THREADS.find(t => t.companionId === activeDirectId) ?? null;

  const handleBack = () => {
    setActiveLoungeId(null);
    setActiveDirectId(null);
  };

  const handleSelectLounge = (id: string | null) => {
    setActiveLoungeId(id);
    setActiveDirectId(null);
  };

  const handleSelectDirect = (id: string | null) => {
    setActiveDirectId(id);
    setActiveLoungeId(null);
    // Opening a DM marks it read — clears its unread badge in the sidebar.
    if (id) setReadDirectIds(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  return (
    <div
      className="flex overflow-hidden mx-auto w-full"
      style={{ height: 'calc(100dvh - 4rem)', maxWidth: 1100 }}
    >
      {/* ── Left sidebar ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'shrink-0 flex flex-col w-full md:w-80',
          // On mobile: hide sidebar when a room/thread is active
          hasActive ? 'hidden md:flex' : 'flex',
        )}
        style={{ borderRight: '1px solid rgba(46,107,255,0.08)' }}
      >
        <LoungeSidebar
          lounges={LOUNGES}
          directThreads={DIRECT_THREADS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeLoungeId={activeLoungeId}
          setActiveLoungeId={handleSelectLounge}
          activeDirectId={activeDirectId}
          setActiveDirectId={handleSelectDirect}
          readDirectIds={readDirectIds}
        />
      </div>

      {/* ── Main pane ─────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex-1 flex flex-col overflow-hidden',
          !hasActive && 'hidden md:flex',
        )}
      >
        <AnimatePresence mode="wait">
          {activeLounge ? (
            <motion.div
              key={activeLounge.id}
              className="flex-1 flex flex-col overflow-hidden"
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={spring.soft}
            >
              <LoungeRoom lounge={activeLounge} onBack={handleBack} />
            </motion.div>
          ) : activeThread ? (
            <motion.div
              key={activeThread.companionId}
              className="flex-1 flex flex-col overflow-hidden"
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, x: -16 }}
              transition={spring.soft}
            >
              <DirectThread thread={activeThread} onBack={handleBack} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="flex-1 flex flex-col items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span
                className="inline-flex items-center justify-center rounded-full"
                style={{ width: 64, height: 64, background: 'var(--color-azure-tint)' }}
                aria-hidden="true"
              >
                <MessageCircle size={28} style={{ color: 'var(--color-azure)' }} />
              </span>
              <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                Pick a lounge or start a conversation
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
