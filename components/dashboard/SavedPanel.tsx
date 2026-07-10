'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Heart, Star } from 'lucide-react';
import { getFavorites, toggleFavorite } from '@/lib/appState';
import { getCompanion } from '@/lib/data/companions';
import type { Companion } from '@/lib/data/companions';
import { calm, spring, stagger } from '@/lib/motion';

const cardVariant = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: calm.base },
  exit:    { opacity: 0, scale: 0.9, transition: calm.fast },
};

export function SavedPanel() {
  const [favorites, setFavorites] = useState<Companion[]>([]);
  const reduced = useEffectiveReducedMotion();

  useEffect(() => {
    const ids = getFavorites();
    setFavorites(ids.map((id) => getCompanion(id)).filter((c): c is Companion => !!c));
  }, []);

  const unsave = (id: string) => {
    toggleFavorite(id);
    setFavorites((prev) => prev.filter((c) => c.id !== id));
  };

  if (favorites.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-sans text-sm mb-1 font-semibold" style={{ color: 'var(--color-ink)' }}>
          No saved companions yet
        </p>
        <p className="font-sans text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>
          Heart a companion on the explore page to save them here.
        </p>
        <motion.a
          href="/explore"
          whileTap={reduced ? {} : { scale: 0.97 }}
          transition={spring.snappy}
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-pill text-sm font-semibold text-white"
          style={{ background: 'var(--grad-cta)' }}
        >
          Explore companions →
        </motion.a>
      </div>
    );
  }

  return (
    <div>
      <p className="font-sans text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: 'var(--color-ink-muted)' }}>
        {favorites.length} saved
      </p>

      {/* Stagger container; AnimatePresence handles exit when unsaved */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
      >
        <AnimatePresence>
          {favorites.map((c) => (
            <motion.article
              key={c.id}
              variants={cardVariant}
              exit={cardVariant.exit}
              whileHover={reduced ? {} : { y: -2 }}
              transition={spring.snappy}
              layout
              className="rounded-lg overflow-hidden"
              style={{
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-1)',
                border: '1.5px solid rgba(46,107,255,0.07)',
              }}
            >
              <div className="relative">
                <img
                  src={c.photo}
                  alt={c.firstName}
                  className="w-full object-cover"
                  style={{ height: 120 }}
                />
                {/* Unsave button — satisfying spring tap */}
                <motion.button
                  onClick={() => unsave(c.id)}
                  aria-label={`Remove ${c.firstName} from saved`}
                  whileTap={reduced ? {} : { scale: 0.75, rotate: -15 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                  className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full"
                  style={{
                    width: 32,
                    height: 32,
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(4px)',
                    color: '#B23A2E',
                  }}
                >
                  <Heart size={14} fill="currentColor" aria-hidden="true" />
                </motion.button>
              </div>

              <div className="p-3">
                <p className="font-sans font-semibold text-sm mb-0.5" style={{ color: 'var(--color-ink)' }}>
                  {c.firstName}
                </p>
                <div className="flex items-center gap-1 mb-3">
                  <Star size={11} fill="currentColor" aria-hidden="true" style={{ color: 'var(--color-gold)' }} />
                  <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    {c.rating} · {c.area}
                  </span>
                </div>
                <motion.a
                  href={`/book?companion=${c.id}`}
                  whileTap={reduced ? {} : { scale: 0.97 }}
                  transition={spring.snappy}
                  className="inline-flex items-center justify-center w-full min-h-[36px] rounded-pill text-xs font-semibold text-white"
                  style={{ background: 'var(--grad-cta)' }}
                >
                  Book
                </motion.a>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
