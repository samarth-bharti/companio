'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { TiltCard } from '@/components/motion/TiltCard';
import { getFavorites, toggleFavorite } from '@/lib/appState';
import { type Companion } from '@/lib/data/companions';
import { spring, stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** Deterministic response-rate derived from companion id */
function responseStats(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rates = [94, 95, 96, 97, 98, 99];
  const times = ['~30 min', '~45 min', '~1 hr', '~1 hr', '~2 hrs', '~2 hrs'];
  return { rate: rates[h % rates.length], time: times[h % times.length] };
}

const chipBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: 'var(--radius-pill)',
  fontSize: '0.78rem',
  fontWeight: 600,
  fontFamily: 'var(--font-sans)',
  border: '1.5px solid rgba(20,26,46,0.12)',
  background: 'rgba(255,255,255,0.7)',
  color: 'var(--color-ink)',
  backdropFilter: 'blur(4px)',
};

const chipAzure: React.CSSProperties = {
  ...chipBase,
  border: '1.5px solid rgba(46,107,255,0.22)',
  background: 'var(--color-azure-tint)',
  color: 'var(--color-azure-deep)',
};

const chipVariants = {
  hidden:  { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1 },
};

interface Props {
  companion: Companion;
}

export function CompanionProfilePortrait({ companion }: Props) {
  const [isFav, setIsFav] = useState(false);
  const reduced = useEffectiveReducedMotion();

  useEffect(() => {
    setIsFav(getFavorites().includes(companion.id));
  }, [companion.id]);

  function handleFav() {
    const next = toggleFavorite(companion.id);
    setIsFav(next.includes(companion.id));
  }

  const { rate, time } = responseStats(companion.id);

  return (
    <section aria-label={`${companion.firstName}'s profile`}>
      <TiltCard maxDeg={5} className="mb-6">
        <div
          className="relative w-full rounded-lg overflow-hidden"
          style={{ aspectRatio: '4/5', maxHeight: 520, boxShadow: 'var(--shadow-2)' }}
        >
          <Image
            src={companion.photo}
            alt={`${companion.name}, ${companion.activities[0]} companion in ${companion.area}, ${companion.city}`}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 440px, 100vw"
            priority
          />
        </div>
      </TiltCard>

      {/* Name + verified + fav */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h1
            style={{
              fontSize: 'var(--text-h2)',
              fontFamily: 'var(--font-display)',
              color: 'var(--color-ink)',
              lineHeight: 1.15,
              marginBottom: 6,
            }}
          >
            {companion.name}
          </h1>
          {/* ID badge — stamp in on mount. Only for someone who actually cleared
              the ID check; "ID-verified" is a claim, not decoration. */}
          {companion.verified && (
            <motion.div
              className="flex items-center gap-1.5"
              initial={reduced ? false : { scale: 0.6, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={reduced ? { duration: 0 } : { ...spring.stamp, delay: 0.15 }}
            >
              <BadgeCheck size={15} style={{ color: 'var(--color-azure)' }} aria-hidden="true" />
              <span
                className="font-sans text-xs font-semibold"
                style={{ color: 'var(--color-azure-deep)' }}
              >
                ID-verified
              </span>
            </motion.div>
          )}
        </div>

        <button
          onClick={handleFav}
          aria-label={isFav ? `Remove ${companion.firstName} from saved` : `Save ${companion.firstName}`}
          className={cn(
            'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full',
            'transition-transform active:scale-90 focus-visible:outline-2',
          )}
          style={{ color: isFav ? '#e53e3e' : 'var(--color-ink-muted)' }}
        >
          <Heart size={22} fill={isFav ? '#e53e3e' : 'none'} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      {/* Metadata chips — staggered reveal */}
      <motion.div
        className="flex flex-wrap gap-2 mb-4"
        variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
        initial={reduced ? false : 'hidden'}
        animate="visible"
      >
        {[
          `${companion.city} · ${companion.area}`,
          ...(companion.age ? [`Age ${companion.age}`] : []),
          ...companion.activities,
          ...companion.languages,
        ].map((label, i) => (
          <motion.span
            key={i}
            style={companion.activities.includes(label) ? chipAzure : chipBase}
            variants={{
              hidden:  chipVariants.hidden,
              visible: { ...chipVariants.visible, transition: { ...spring.soft } },
            }}
          >
            {label}
          </motion.span>
        ))}
      </motion.div>

      {/* Bio */}
      <p
        className="font-sans text-base leading-relaxed mb-5"
        style={{ color: 'var(--color-ink)' }}
      >
        {companion.bio}
      </p>

      {/* Response rate */}
      <p className="font-sans text-xs mb-5" style={{ color: 'var(--color-ink-muted)' }}>
        Replies within {time} · {rate}% response rate
      </p>

      {/* Message CTA */}
      <Link
        href={`/dashboard?tab=messages&c=${companion.id}`}
        className={cn(
          'inline-flex items-center gap-2 min-h-[44px] px-5 rounded-pill',
          'font-sans font-semibold text-sm border-2 transition-colors focus-visible:outline-2',
        )}
        style={{ borderColor: 'var(--color-azure)', color: 'var(--color-azure-deep)' }}
        aria-label={`Send a message to ${companion.firstName}`}
      >
        <MessageCircle size={16} aria-hidden="true" />
        Message {companion.firstName}
      </Link>
    </section>
  );
}
