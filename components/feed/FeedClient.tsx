'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SEED_POSTS, type FeedPost } from './data';
import { FilterChips, type FeedFilter } from './FilterChips';
import { FeedComposer } from './FeedComposer';
import { PostCard } from './PostCard';
import { FeedRail } from './FeedRail';
import { HighlightsRow } from './HighlightsRow';
import { spring } from '@/lib/motion';

const TRENDING_CHIPS = [
  { label: '🏃 Morning Run', color: '#1FAE6B' },
  { label: '☕ Café Chat',   color: '#FFB23E' },
  { label: '🚶 City Walk',   color: '#2E6BFF' },
  { label: '📸 Photography', color: '#7A4FE0' },
  { label: '🥘 Street Food', color: '#FFB23E' },
  { label: '📚 Book cafés',  color: '#7A4FE0' },
  { label: '🎶 Live events', color: '#2E6BFF' },
];

export function FeedClient() {
  const [posts, setPosts]   = useState<FeedPost[]>(SEED_POSTS);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const reduced = useReducedMotion();

  const filtered: FeedPost[] = filter === 'all'
    ? posts
    : posts.filter(p => p.type === filter);

  function addPost(post: FeedPost) {
    setPosts(prev => [post, ...prev]);
    setFilter('all');
  }

  return (
    <section
      aria-label="Community feed"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-8 items-start"
    >
      {/* ── Main feed column ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Highlights story row */}
        <div
          className="rounded-[var(--radius-lg)] p-4"
          style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-1)', border: '1px solid rgba(20,26,46,0.06)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-azure)', fontFamily: 'var(--font-sans)' }}>
            Highlights
          </p>
          <HighlightsRow />
        </div>

        {/* Trending this week chips */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-ink-muted)' }}>Trending this week</p>
          <div className="flex gap-2 flex-wrap">
            {TRENDING_CHIPS.map(({ label, color }) => (
              <span
                key={label}
                className="px-3 py-1 rounded-pill text-xs font-semibold"
                style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <FeedComposer onPost={addPost} />

        <FilterChips value={filter} onChange={setFilter} />

        <p className="text-xs text-center" style={{ color: 'var(--color-ink-muted)' }}>
          Strictly platonic community, meet for activities, not romance
        </p>

        {/* Card list with enter/exit animation */}
        <AnimatePresence mode="popLayout">
          {filtered.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: reduced ? 0 : 22 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  ...spring.soft,
                  // Stagger only for the first 6 items so page load feels lively
                  // but doesn't drag when scrolling down.
                  delay: i < 6 ? i * 0.055 : 0,
                },
              }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div
            className="py-16 text-center text-sm"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            No posts in this category yet, be the first!
          </div>
        )}
      </div>

      {/* ── Right rail — lg+ only ── */}
      <aside
        className="hidden lg:block w-72 shrink-0"
        aria-label="Suggested activities and trending topics"
      >
        <FeedRail />
      </aside>
    </section>
  );
}
