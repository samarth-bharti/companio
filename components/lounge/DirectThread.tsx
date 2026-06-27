'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { ChatStream } from './ChatStream';
import { Composer } from './Composer';
import type { DirectThread as DirectThreadData, DirectMessage, Reaction } from './data';
import type { StreamMessage } from './ChatStream';
import { COMPANIONS } from '@/lib/data/companions';
import { getReplies } from '@/components/dashboard/chatReplies';

interface DirectThreadProps {
  thread: DirectThreadData;
  onBack?: () => void;
}

let nextDmId = 6000;

function toggleReaction(msgs: DirectMessage[], msgId: string, emoji: string): DirectMessage[] {
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

// Random reply pick + delay live at module scope (not in the component body) so
// they're plainly outside render — random-in-render is what the lint rule guards.
function pickReply(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}
function replyDelayMs(): number {
  return 1200 + Math.random() * 800;
}

export function DirectThread({ thread, onBack }: DirectThreadProps) {
  const companion = COMPANIONS.find(c => c.id === thread.companionId)!;
  const [msgs, setMsgs] = useState<DirectMessage[]>(thread.messages);
  const [isTyping, setIsTyping] = useState(false);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cancel any pending bot reply when the thread unmounts (e.g. switching DMs).
  useEffect(() => () => { if (replyTimer.current) clearTimeout(replyTimer.current); }, []);

  const userHasSent = msgs.some(m => m.from === 'me');

  const onSend = (text: string) => {
    setMsgs(prev => [...prev, { id: `dm-${nextDmId++}`, from: 'me', text, time: 'Just now' }]);
    setIsTyping(true);
    // Replace any in-flight reply so rapid sends don't stack multiple bot replies.
    if (replyTimer.current) clearTimeout(replyTimer.current);
    const reply = pickReply(getReplies(companion.id));
    const delay = replyDelayMs();
    replyTimer.current = setTimeout(() => {
      setIsTyping(false);
      setMsgs(prev => [...prev, {
        id: `dm-${nextDmId++}`,
        from: companion.id,
        text: reply,
        time: 'Just now',
        authorName: companion.firstName,
        authorPhoto: companion.photo,
      }]);
    }, delay);
  };

  const onVoice = () => {
    setMsgs(prev => [...prev, {
      id: `dm-${nextDmId++}`,
      from: 'me',
      type: 'voice',
      voiceDuration: '0:12',
      time: 'Just now',
    }]);
  };

  const onReact = useCallback((msgId: string, emoji: string) => {
    setMsgs(prev => toggleReaction(prev, msgId, emoji));
  }, []);

  // Annotate non-me messages with companion info for ChatStream
  const streamMsgs: StreamMessage[] = msgs.map(m => ({
    ...m,
    authorName: m.from !== 'me' ? companion.firstName : 'You',
    authorPhoto: m.from !== 'me' ? companion.photo : '',
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
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
        <div className="relative shrink-0">
          <img
            src={companion.photo}
            alt={companion.firstName}
            className="rounded-full object-cover"
            style={{ width: 38, height: 38 }}
          />
          {companion.availableNow && (
            <span
              className="absolute bottom-0 right-0 block rounded-full"
              style={{ width: 10, height: 10, background: 'var(--color-emerald)', border: '2px solid white' }}
              aria-label="Online now"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
              {companion.firstName}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-semibold shrink-0"
              style={{ background: 'rgba(31,174,107,0.1)', color: 'var(--color-emerald)' }}
            >
              Strictly platonic
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            {companion.availability} · {companion.area}
          </p>
        </div>
      </div>

      {/* Safety strip */}
      <div
        className="mx-3 mt-2 flex items-start gap-2 px-3 py-2 rounded-xl shrink-0"
        style={{ background: 'rgba(31,174,107,0.06)', border: '1px solid rgba(31,174,107,0.12)' }}
      >
        <Shield size={12} aria-hidden="true" style={{ color: '#157A4A', flexShrink: 0, marginTop: 2 }} />
        <span className="text-xs font-sans leading-snug" style={{ color: '#157A4A' }}>
          Contact details stay hidden until a meetup is confirmed.
        </span>
      </div>

      <ChatStream messages={streamMsgs} isTyping={isTyping} onReact={onReact} />

      <div className="px-3 pb-3 shrink-0">
        <Composer
          onSend={onSend}
          onVoice={onVoice}
          showIcebreakers={!userHasSent}
          placeholder={`Message ${companion.firstName}…`}
        />
      </div>
    </div>
  );
}
