'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, Users, MessageCircle } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { COMPANIONS } from '@/lib/data/companions';
import type { Lounge, DirectThread } from './data';

type SidebarTab = 'lounges' | 'direct';

// Static mock presence for a couple rooms to feel live.
const LOUNGE_PRESENCE: Record<string, 'typing' | 'active'> = {
  foodies:  'typing',
  runners:  'active',
};

interface LoungeSidebarProps {
  lounges: Lounge[];
  directThreads: DirectThread[];
  activeTab: SidebarTab;
  setActiveTab: (t: SidebarTab) => void;
  activeLoungeId: string | null;
  setActiveLoungeId: (id: string | null) => void;
  activeDirectId: string | null;
  setActiveDirectId: (id: string | null) => void;
  readDirectIds: Set<string>;
}

export function LoungeSidebar({
  lounges, directThreads, activeTab, setActiveTab,
  activeLoungeId, setActiveLoungeId, activeDirectId, setActiveDirectId, readDirectIds,
}: LoungeSidebarProps) {
  const [query, setQuery] = useState('');
  const reduced = useReducedMotion();

  const qLower = query.toLowerCase();
  const filteredLounges = lounges.filter(l => l.name.toLowerCase().includes(qLower));
  const filteredDirect  = directThreads.filter(t => {
    const c = COMPANIONS.find(c => c.id === t.companionId);
    return c?.firstName.toLowerCase().includes(qLower);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
            Lounge
          </h1>
          {/* Total online across all lounges */}
          <div className="flex items-center gap-1.5">
            <span className="relative inline-flex" aria-hidden="true">
              <span
                className="block rounded-full"
                style={{
                  width: 8, height: 8,
                  background: 'var(--color-emerald)',
                  animation: 'companio-pulse-ring 1.8s ease-out infinite',
                  opacity: 0.4,
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  transform: 'scale(1)',
                }}
              />
              <span
                className="relative block rounded-full"
                style={{ width: 8, height: 8, background: 'var(--color-emerald)' }}
              />
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--color-emerald)' }}>
              {lounges.reduce((sum, l) => sum + l.onlineCount, 0)} online now
            </span>
          </div>
        </div>
        <style>{`
          @keyframes companio-pulse-ring {
            0%   { transform: scale(1);   opacity: 0.4; }
            70%  { transform: scale(2.6); opacity: 0; }
            100% { transform: scale(2.6); opacity: 0; }
          }
        `}</style>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-ink-muted)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search rooms or people…"
            aria-label="Search rooms and conversations"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm font-sans"
            style={{ background: 'rgba(46,107,255,0.05)', border: '1.5px solid rgba(46,107,255,0.1)', color: 'var(--color-ink)', outline: 'none' }}
          />
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 px-3 pb-2 shrink-0">
        {(['lounges', 'direct'] as const).map(tab => (
          <motion.button
            key={tab}
            onClick={() => setActiveTab(tab)}
            whileTap={reduced ? {} : { scale: 0.97 }}
            transition={spring.snappy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-sans font-semibold transition-colors"
            style={activeTab === tab
              ? { background: 'var(--color-azure)', color: '#fff' }
              : { background: 'rgba(46,107,255,0.05)', color: 'var(--color-ink-muted)' }
            }
          >
            {tab === 'lounges' ? <><Users size={14} aria-hidden="true" />Lounges</> : <><MessageCircle size={14} aria-hidden="true" />Direct</>}
          </motion.button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4" style={{ overscrollBehavior: 'contain' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'lounges' ? (
            <motion.div key="lounges" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-1">
              {filteredLounges.map((l, i) => {
                const lastMsg = l.messages[l.messages.length - 1];
                const isActive = activeLoungeId === l.id;
                return (
                  <Reveal key={l.id} delay={i * 0.04}>
                    <button
                      onClick={() => { setActiveLoungeId(l.id); setActiveDirectId(null); }}
                      className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors')}
                      style={isActive ? { background: 'var(--color-azure-tint)', outline: '1px solid var(--color-azure)' } : {}}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="text-xl shrink-0" aria-hidden="true">{l.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-sans font-semibold text-sm truncate" style={{ color: 'var(--color-ink)' }}>{l.name}</span>
                          <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--color-emerald)' }}>● {l.onlineCount}</span>
                        </div>
                        {LOUNGE_PRESENCE[l.id] ? (
                          <p className="text-xs truncate font-medium" style={{ color: 'var(--color-emerald)' }}>
                            {LOUNGE_PRESENCE[l.id] === 'typing' ? '✎ typing…' : '● active now'}
                          </p>
                        ) : (
                          <p className="text-xs truncate" style={{ color: 'var(--color-ink-muted)' }}>
                            {lastMsg?.type === 'voice' ? '🎤 Voice note' : (lastMsg?.text ?? '')}
                          </p>
                        )}
                      </div>
                    </button>
                  </Reveal>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="direct" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col gap-1">
              {filteredDirect.map((t, i) => {
                const c = COMPANIONS.find(c => c.id === t.companionId)!;
                const lastMsg = t.messages[t.messages.length - 1];
                const isActive = activeDirectId === t.companionId;
                const unread = readDirectIds.has(t.companionId) ? 0 : t.unread;
                return (
                  <Reveal key={t.companionId} delay={i * 0.04}>
                    <button
                      onClick={() => { setActiveDirectId(t.companionId); setActiveLoungeId(null); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                      style={isActive ? { background: 'var(--color-azure-tint)', outline: '1px solid var(--color-azure)' } : {}}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="relative shrink-0">
                        <Image src={c.photo} alt={c.firstName} width={40} height={40} style={{ width: 40, height: 40 }} className="rounded-full object-cover" />
                        {c.availableNow && (
                          <span className="absolute bottom-0 right-0 block rounded-full" style={{ width: 10, height: 10, background: 'var(--color-emerald)', border: '2px solid white' }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>{c.firstName}</span>
                          {unread > 0 && (
                            <span className="text-xs font-semibold rounded-full px-1.5 shrink-0" style={{ background: 'var(--color-azure)', color: '#fff', minWidth: 18, textAlign: 'center' }}>
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--color-ink-muted)' }}>
                          {lastMsg?.type === 'voice' ? '🎤 Voice note' : (lastMsg?.text ?? '')}
                        </p>
                      </div>
                    </button>
                  </Reveal>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
