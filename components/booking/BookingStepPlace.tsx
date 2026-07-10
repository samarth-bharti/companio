'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Check, MapPin } from 'lucide-react';
import { spring, stagger, calm } from '@/lib/motion';
import { cn } from '@/lib/utils';

const AREA_PLACES: Record<string, string[]> = {
  'Bandra West':  ['Bandstand Promenade', 'Carter Road café strip', 'Mount Mary steps'],
  'Andheri West': ['Versova beach front', 'Lokhandwala market area', 'DN Nagar park'],
  'Colaba':       ['Colaba Causeway promenade', 'Horniman Circle garden', 'CSMT garden'],
  'Powai':        ['Powai Lake promenade', 'Hiranandani gardens', 'NITIE lakeside path'],
  'Juhu':         ['Juhu beach promenade', 'JVPD grounds', 'Prithvi Theatre courtyard'],
  'Dadar':        ['Shivaji Park promenade', 'Dadar flower market area', 'Chaitya Bhoomi grounds'],
  'Lower Parel':  ['Kamala Mills garden area', 'High Street Phoenix vicinity', 'Worli Sea Face'],
  'Matunga':      ['Shivaji Park (nearby)', 'Matunga market square', 'King\'s Circle garden'],
  'Versova':      ['Versova beach promenade', 'Lokhandwala lake area', 'Carter Road (nearby)'],
  'Worli':        ['Worli Sea Face promenade', 'Worli village area', 'Nehru Planetarium garden'],
  'Chembur':      ['RCF colony garden', 'Diamond Garden', 'Chembur market square'],
  'Malad':        ['Malad creek trail', 'Mindspace park area', 'Inorbit vicinity (outdoors)'],
  'Khar':         ['Khar Gymkhana area', 'Hill Road café district', 'Khar Linking Road'],
  'Vile Parle':   ['Vile Parle East market lanes', 'JVPD garden area', 'Juhu beach (nearby)'],
};

function getPlaces(area: string): string[] {
  return AREA_PLACES[area] ?? [`${area} public garden`, `${area} main promenade`, `${area} market area`];
}

interface Props {
  area: string;
  selected: string;
  onSelect: (place: string) => void;
}

export function BookingStepPlace({ area, selected, onSelect }: Props) {
  const reduced = useEffectiveReducedMotion();
  const places  = getPlaces(area);

  return (
    <fieldset className="border-0 p-0 m-0">
      <legend
        className="font-display mb-2 w-full"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-h3)',
          color: 'var(--color-ink)',
        }}
      >
        Where shall you meet?
      </legend>
      <p className="font-sans text-sm mb-6" style={{ color: 'var(--color-ink-muted)' }}>
        Public places only, for everyone&apos;s comfort.
      </p>

      <span
        aria-hidden="true"
        className="absolute right-4 top-0 font-display select-none pointer-events-none"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(4rem, 12vw, 7rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          color: 'rgba(46,107,255,0.07)',
          lineHeight: 1,
        }}
      >
        04
      </span>

      {/* Stagger container — calm entrance for transactional flow */}
      <motion.div
        className="space-y-3"
        variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
        initial={reduced ? false : 'hidden'}
        animate="visible"
      >
        {places.map((place) => {
          const isSelected = place === selected;
          return (
            <motion.div
              key={place}
              variants={{
                hidden:  { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: calm.base },
              }}
            >
              <motion.button
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(place)}
                className={cn(
                  'w-full flex items-center gap-3 rounded-lg p-4',
                  'font-sans font-semibold text-sm text-left',
                  'transition-colors cursor-pointer min-h-[44px] focus-visible:outline-2',
                )}
                style={{
                  background: isSelected ? 'var(--color-azure-tint)' : 'var(--color-surface)',
                  border: `2px solid ${isSelected ? 'var(--color-azure)' : 'rgba(20,26,46,0.10)'}`,
                  color: isSelected ? 'var(--color-azure-deep)' : 'var(--color-ink)',
                  boxShadow: isSelected ? 'var(--glow-azure)' : 'var(--shadow-1)',
                }}
                whileHover={reduced ? {} : { scale: 1.01 }}
                whileTap={reduced ? {} : { scale: 0.99 }}
                animate={reduced ? {} : { scale: isSelected ? 1.01 : 1 }}
                transition={reduced ? { duration: 0 } : spring.snappy}
              >
                {isSelected ? (
                  <motion.span
                    initial={reduced ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={reduced ? { duration: 0 } : spring.stamp}
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-azure)' }}
                    aria-hidden="true"
                  >
                    <Check size={12} strokeWidth={3} color="white" />
                  </motion.span>
                ) : (
                  <MapPin
                    size={18}
                    strokeWidth={1.8}
                    className="flex-shrink-0"
                    style={{ color: 'var(--color-ink-muted)' }}
                    aria-hidden="true"
                  />
                )}
                {place}
              </motion.button>
            </motion.div>
          );
        })}
      </motion.div>
    </fieldset>
  );
}
