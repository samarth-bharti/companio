'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { spring } from '@/lib/motion';

interface Highlight {
  id: string;
  name: string;
  avatar: string;
  activity: string;
  ringColor: string;
  caption: string;
}

const HIGHLIGHTS: Highlight[] = [
  {
    id: 'h1', name: 'Ananya', activity: 'City Walk',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
    ringColor: '#2E6BFF',
    caption: 'Morning stroll through Kala Ghoda, the light was perfect and so was the chai.',
  },
  {
    id: 'h2', name: 'Rohan', activity: 'Morning Run',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80',
    ringColor: '#1FAE6B',
    caption: 'Versova beach 6 AM crew. Three runners, one coconut water stall, zero excuses.',
  },
  {
    id: 'h3', name: 'Priya', activity: 'Photography',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80',
    ringColor: '#7A4FE0',
    caption: 'Sassoon Dock at sunrise. You have to see the fishing boats come in.',
  },
  {
    id: 'h4', name: 'Zara', activity: 'Street Food',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80',
    ringColor: '#FFB23E',
    caption: 'The pav bhaji cart behind St. Andrews is back. Queue starts at 7 PM sharp.',
  },
  {
    id: 'h5', name: 'Aarav', activity: 'Café Chat',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80',
    ringColor: '#FFB23E',
    caption: 'Found a no-signboard filter-coffee spot on Ropewalk Lane. Cold brew + banana bread.',
  },
  {
    id: 'h6', name: 'Kiran', activity: 'Board Games',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80',
    ringColor: '#1FAE6B',
    caption: 'Irani café, Scrabble, four strangers. Two hours that felt like twenty minutes.',
  },
];

export function HighlightsRow() {
  const [open, setOpen] = useState<Highlight | null>(null);
  const reduced = useReducedMotion();

  return (
    <>
      <div
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none' }}
        aria-label="Activity highlights"
        role="list"
      >
        {HIGHLIGHTS.map((h) => (
          <button
            key={h.id}
            role="listitem"
            onClick={() => setOpen(h)}
            className="flex flex-col items-center gap-1.5 shrink-0"
            aria-label={`${h.name}'s highlight: ${h.activity}`}
          >
            {/* Activity ring */}
            <div
              className="rounded-full p-[2.5px]"
              style={{
                background: `conic-gradient(${h.ringColor} 0%, ${h.ringColor} 75%, rgba(200,200,220,0.25) 75%)`,
              }}
              aria-hidden="true"
            >
              <div className="rounded-full p-[2px] bg-white">
                <div className="w-14 h-14 rounded-full overflow-hidden relative">
                  <Image src={h.avatar} alt={h.name} fill sizes="56px" className="object-cover" />
                </div>
              </div>
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--color-ink-muted)' }}>
              {h.name}
            </span>
          </button>
        ))}
      </div>

      {/* Highlight card modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="highlight-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(20,26,46,0.65)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="relative w-full max-w-sm rounded-2xl overflow-hidden"
              style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-2)' }}
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              transition={spring.soft}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setOpen(null)}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(20,26,46,0.45)', color: '#fff' }}
                aria-label="Close highlight"
              >
                <X size={14} />
              </button>

              {/* Avatar large */}
              <div className="relative w-full" style={{ aspectRatio: '1/1' }}>
                <Image src={open.avatar} alt={open.name} fill sizes="384px" className="object-cover" />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(20,26,46,0.7) 0%, transparent 50%)' }}
                />
                <div className="absolute bottom-4 left-4">
                  <span
                    className="px-2.5 py-1 rounded-pill text-xs font-semibold"
                    style={{ background: open.ringColor, color: '#fff' }}
                  >
                    {open.activity}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
                  {open.name}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
                  {open.caption}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
