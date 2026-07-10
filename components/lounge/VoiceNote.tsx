'use client';

import { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';

interface VoiceNoteProps {
  duration: string;
  isMine: boolean;
}

// Seeded bar heights — visual only, no audio
const BARS = [3, 5, 8, 12, 9, 14, 10, 6, 11, 8, 5, 13, 7, 4, 9, 11, 6, 8, 3, 7];

export function VoiceNote({ duration, isMine }: VoiceNoteProps) {
  const [playing, setPlaying] = useState(false);
  const reduced = useEffectiveReducedMotion();

  // Mock: auto-stop after the duration (seconds) * 1000 ms
  const handlePlay = () => {
    if (playing) { setPlaying(false); return; }
    setPlaying(true);
    const secs = parseFloat(duration.replace('0:', ''));
    if (!reduced) setTimeout(() => setPlaying(false), secs * 1000);
  };

  const btnBg  = isMine ? 'rgba(255,255,255,0.25)' : 'var(--color-azure)';
  const barFull = isMine ? 'rgba(255,255,255,0.85)' : 'var(--color-azure)';
  const barDim  = isMine ? 'rgba(255,255,255,0.35)' : 'rgba(46,107,255,0.28)';
  const textCol = isMine ? 'rgba(255,255,255,0.75)' : 'var(--color-ink-muted)';

  return (
    <div className="flex items-center gap-2" style={{ minWidth: 160 }}>
      <motion.button
        onClick={handlePlay}
        whileTap={reduced ? {} : { scale: 0.9 }}
        transition={spring.snappy}
        aria-label={playing ? 'Pause voice note' : 'Play voice note'}
        className="inline-flex items-center justify-center rounded-full shrink-0"
        style={{ width: 32, height: 32, background: btnBg, color: '#fff' }}
      >
        {playing ? <Pause size={13} /> : <Play size={13} />}
      </motion.button>

      {/* Waveform bars */}
      <div className="flex items-center gap-[2px] flex-1">
        {BARS.map((h, i) => (
          <span
            key={i}
            className="rounded-full shrink-0"
            style={{
              width: 2,
              height: h,
              background: playing && !reduced && i < 12 ? barFull : barDim,
              transition: reduced ? 'none' : 'background 0.15s',
            }}
          />
        ))}
      </div>

      <span className="text-xs font-sans tabular-nums shrink-0" style={{ color: textCol }}>
        {duration}
      </span>
    </div>
  );
}
