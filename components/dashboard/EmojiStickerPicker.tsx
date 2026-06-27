'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { spring } from '@/lib/motion';
import { EMOJI_CATEGORIES, STICKERS, stickerText } from '@/lib/chat/emoji';

interface Props {
  open: boolean;
  onClose: () => void;
  onEmoji: (emoji: string) => void;
  onSticker: (text: string) => void;
}

// Popover above the chat input: a categorised Emoji keyboard and a Sticker tray.
export function EmojiStickerPicker({ open, onClose, onEmoji, onSticker }: Props) {
  const [tab, setTab] = useState<'emoji' | 'sticker'>('emoji');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const jump = (label: string) =>
    sectionRefs.current[label]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={spring.snappy}
            className="absolute bottom-full mb-2 right-0 z-40 w-[320px] rounded-2xl p-3 shadow-xl"
            style={{ background: 'var(--color-bg)', border: '1px solid rgba(46,107,255,0.15)' }}
            role="dialog"
            aria-label="Emoji and sticker picker"
          >
            {/* Emoji / Sticker tabs */}
            <div className="flex gap-1 mb-2">
              {(['emoji', 'sticker'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="flex-1 text-xs font-semibold rounded-lg py-1.5 transition-colors"
                  style={tab === t ? { background: 'var(--color-azure)', color: '#fff' } : { background: 'var(--color-surface)', color: 'var(--color-ink-muted)' }}
                >
                  {t === 'emoji' ? 'Emoji' : 'Stickers'}
                </button>
              ))}
            </div>

            {tab === 'emoji' ? (
              <>
                {/* Category quick-nav */}
                <div className="flex gap-0.5 mb-1.5 pb-1.5 overflow-x-auto" style={{ borderBottom: '1px solid rgba(46,107,255,0.08)' }}>
                  {EMOJI_CATEGORIES.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => jump(c.label)}
                      title={c.label}
                      aria-label={c.label}
                      className="text-lg h-8 w-8 shrink-0 grid place-items-center rounded-lg hover:bg-[var(--color-surface)]"
                    >
                      {c.icon}
                    </button>
                  ))}
                </div>

                <div className="max-h-[208px] overflow-y-auto pr-1">
                  {EMOJI_CATEGORIES.map((c) => (
                    <div key={c.label} ref={(el) => { sectionRefs.current[c.label] = el; }} className="mb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide px-1 mb-0.5" style={{ color: 'var(--color-ink-muted)' }}>{c.label}</p>
                      <div className="grid grid-cols-8 gap-0.5">
                        {c.emojis.map((e, i) => (
                          <button
                            key={`${e}-${i}`}
                            type="button"
                            onClick={() => onEmoji(e)}
                            className="text-xl h-9 w-9 grid place-items-center rounded-lg hover:bg-[var(--color-surface)] hover:scale-110 transition-transform"
                            aria-label={`Emoji ${e}`}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[230px] overflow-y-auto pr-1">
                {STICKERS.map((s, i) => (
                  <button
                    key={`${s.emoji}-${i}`}
                    type="button"
                    onClick={() => onSticker(stickerText(s))}
                    className="aspect-square rounded-xl hover:scale-105 transition-transform grid place-items-center"
                    style={s.caption ? { background: 'var(--color-azure-tint)', border: '1px solid rgba(46,107,255,0.12)' } : undefined}
                    aria-label={s.caption ? `Sticker: ${s.caption}` : `Sticker ${s.emoji}`}
                  >
                    {s.caption ? (
                      <span className="flex flex-col items-center gap-1 px-1">
                        <span className="text-3xl leading-none">{s.emoji}</span>
                        <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: 'var(--color-azure-deep)' }}>{s.caption}</span>
                      </span>
                    ) : (
                      <span className="text-4xl leading-none">{s.emoji}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
