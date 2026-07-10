'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Users, CheckCircle } from 'lucide-react';
import { spring } from '@/lib/motion';
import { ChatStream } from './ChatStream';
import { Composer } from './Composer';
import type { Lounge, LoungeMessage, Reaction } from './data';
import type { StreamMessage } from './ChatStream';

/** Extract unique non-me avatar URLs from lounge messages (deterministic order). */
function getAvatarStack(messages: LoungeMessage[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of messages) {
    if (m.from !== 'me' && m.authorPhoto && !seen.has(m.authorPhoto)) {
      seen.add(m.authorPhoto);
      out.push(m.authorPhoto);
      if (out.length === 5) break;
    }
  }
  return out;
}

interface LoungeRoomProps {
  lounge: Lounge;
  onBack?: () => void;
}

let nextId = 5000;

function toggleReaction(msgs: LoungeMessage[], msgId: string, emoji: string): LoungeMessage[] {
  return msgs.map(m => {
    if (m.id !== msgId) return m;
    const existing = m.reactions?.find(r => r.emoji === emoji);
    let updated: Reaction[];
    if (existing) {
      updated = m.reactions!
        .map(r => r.emoji === emoji ? { ...r, count: r.myReact ? r.count - 1 : r.count + 1, myReact: !r.myReact } : r)
        .filter(r => r.count > 0);
    } else {
      updated = [...(m.reactions ?? []), { emoji, count: 1, myReact: true }];
    }
    return { ...m, reactions: updated };
  });
}

export function LoungeRoom({ lounge, onBack }: LoungeRoomProps) {
  const [msgs, setMsgs] = useState<LoungeMessage[]>(lounge.messages);
  const [joined, setJoined] = useState(false);
  const reduced = useEffectiveReducedMotion();

  const onSend = useCallback((text: string) => {
    setMsgs(prev => [...prev, {
      id: `lo-${nextId++}`,
      from: 'me',
      authorName: 'You',
      authorPhoto: '',
      text,
      time: 'Just now',
    }]);
  }, []);

  const onReact = useCallback((msgId: string, emoji: string) => {
    setMsgs(prev => toggleReaction(prev, msgId, emoji));
  }, []);

  const streamMsgs: StreamMessage[] = msgs.map(m => ({ ...m }));
  const avatarStack = getAvatarStack(lounge.messages);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Room header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(46,107,255,0.08)' }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden inline-flex items-center justify-center rounded-lg"
            style={{ width: 36, height: 36, color: 'var(--color-ink-muted)' }}
            aria-label="Back to list"
          >←</button>
        )}
        <span className="text-2xl" aria-hidden="true">{lounge.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-sans font-bold text-sm truncate" style={{ color: 'var(--color-ink)' }}>
              {lounge.name}
            </h2>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0"
              style={{ background: 'rgba(31,174,107,0.1)', color: 'var(--color-emerald)' }}
            >
              Strictly platonic
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            <Users size={11} aria-hidden="true" />
            <span>{lounge.memberCount} members · <span style={{ color: 'var(--color-emerald)' }}>{lounge.onlineCount} online</span></span>
          </div>

          {/* Who's here — avatar stack with subtle shift */}
          {/* CSS keyframe (companio-avatar-bob) instead of per-avatar framer-motion
              repeat:Infinity — compositor handles it with zero JS per frame. */}
          {avatarStack.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex -space-x-1.5" aria-label="People here now">
                {avatarStack.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    aria-hidden="true"
                    className="rounded-full object-cover border border-white/80"
                    style={{
                      width: 20, height: 20, zIndex: 10 - i,
                      animation: reduced ? 'none' : `companio-avatar-bob 2.5s ease-in-out ${i * 0.4}s infinite`,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>here now</span>
            </div>
          )}
        </div>
        <motion.button
          onClick={() => setJoined(j => !j)}
          whileTap={reduced ? {} : { scale: 0.95 }}
          transition={spring.snappy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-semibold shrink-0"
          style={joined
            ? { background: 'rgba(31,174,107,0.1)', color: 'var(--color-emerald)', border: '1px solid rgba(31,174,107,0.3)' }
            : { background: 'var(--grad-cta)', color: '#fff' }
          }
          aria-pressed={joined}
        >
          {joined ? <><CheckCircle size={12} aria-hidden="true" />Joined</> : 'Join room'}
        </motion.button>
      </div>

      {/* Topic strip */}
      <div
        className="px-4 py-2 shrink-0 text-xs font-sans"
        style={{ background: 'rgba(46,107,255,0.03)', borderBottom: '1px solid rgba(46,107,255,0.06)', color: 'var(--color-ink-muted)' }}
      >
        📍 {lounge.topic}
      </div>

      <ChatStream messages={streamMsgs} isGroup onReact={onReact} />

      <div className="px-3 pb-3 shrink-0">
        <Composer onSend={onSend} placeholder={`Message ${lounge.name}…`} showIcebreakers />
      </div>
    </div>
  );
}
