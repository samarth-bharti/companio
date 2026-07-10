'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { BadgeCheck } from 'lucide-react';
import type { PhotoPost as PhotoPostData } from './data';

interface Props {
  post: PhotoPostData;
  liked: boolean;
  onDoubleTapLike: () => void;
}

export function PhotoPost({ post, liked, onDoubleTapLike }: Props) {
  const [burst, setBurst] = useState(false);
  const lastTap = useRef(0);
  const reduced = useEffectiveReducedMotion();

  // Double-tap detection — works for both touch and desktop double-click.
  const handleInteract = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 320) {
      if (!liked) onDoubleTapLike();
      if (!reduced) {
        setBurst(true);
        setTimeout(() => setBurst(false), 750);
      }
    }
    lastTap.current = now;
  }, [liked, onDoubleTapLike, reduced]);

  if (post.images.length === 0) {
    // Text-only photo post (e.g. user composed without an image)
    return (
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink)' }}>
        {post.caption}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Image with double-tap-to-like */}
      <div
        className="relative w-full overflow-hidden rounded-[var(--radius-md)] select-none"
        style={{ aspectRatio: '4/3', cursor: 'pointer' }}
        onClick={handleInteract}
        role="img"
        aria-label={`Meetup photo, double-tap to like. ${post.caption}`}
      >
        <Image
          src={post.images[0]}
          alt={post.caption}
          fill
          sizes="(max-width:640px) 100vw, (max-width:1024px) 60vw, 560px"
          className="object-cover"
          draggable={false}
          priority={false}
        />

        {/* Verified meetup badge */}
        {post.verifiedMeetup && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold"
            style={{
              background: 'rgba(31,174,107,0.92)',
              color: 'white',
              backdropFilter: 'blur(4px)',
            }}
          >
            <BadgeCheck size={12} aria-hidden="true" />
            Verified meetup
          </div>
        )}

        {/* Heart burst on double-tap */}
        <AnimatePresence>
          {burst && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.3, 1.4, 1.15, 0.85],
                transition: { duration: 0.72, times: [0, 0.22, 0.55, 1], ease: 'easeOut' },
              }}
              exit={{ opacity: 0 }}
              aria-hidden="true"
            >
              <span
                style={{ fontSize: '4.5rem', filter: 'drop-shadow(0 6px 16px rgba(229,62,62,0.5))' }}
              >
                ❤️
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Caption */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-ink)' }}>
        {post.caption}
      </p>
    </div>
  );
}
