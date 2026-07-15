'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { Send, Shield, MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { CONTACT_RE } from '@/lib/chat/contact';
import { spring } from '@/lib/motion';
import type { ChatMessage } from '@/lib/appState';

/**
 * The companion's inbox — the other half of a conversation that only ever had one.
 *
 * A member could open a profile, write "are you free on Saturday?", and be told
 * "Meghna will see this and reply when they're free". Meghna could not: there was
 * no inbox, no endpoint, and no screen. Every message a member ever sent landed in
 * a thread only the member could read.
 */

interface ThreadSummary {
  userId: string;
  memberFirstName: string;
  lastText: string;
  lastFrom: 'me' | 'them';
  lastTs: number;
  unread: number;
}

export function CompanionDashMessages() {
  const reduced = useEffectiveReducedMotion();
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    try {
      const res = await fetch('/api/companion/messages');
      setThreads(res.ok ? await res.json() : []);
    } catch {
      setThreads([]);
    }
  }, []);

  useEffect(() => { void loadThreads(); }, [loadThreads]);

  const openThread = useCallback(async (memberId: string) => {
    setOpenId(memberId);
    setError('');
    try {
      const res = await fetch(`/api/companion/messages/${memberId}`);
      setThread(res.ok ? await res.json() : []);
    } catch {
      setThread([]);
    }
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [thread]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !openId) return;
    // The same guard the member's composer applies. Blocking it here matters
    // more, not less: the companion is the party with a reason to move the
    // booking off-platform, where none of the safety promises reach.
    if (CONTACT_RE.test(text)) { setBlocked(true); return; }
    setBlocked(false);
    setDraft('');
    setError('');
    try {
      const res = await fetch(`/api/companion/messages/${openId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const saved: ChatMessage = await res.json();
      setThread((t) => [...t, saved]);
      void loadThreads();
    } catch {
      setError("That didn't send. Please try again.");
      setDraft(text);
    }
  };

  const open = threads?.find((t) => t.userId === openId);

  return (
    <section
      aria-labelledby="companion-messages-heading"
      className="rounded-2xl p-6"
      style={{ background: 'var(--color-surface)', border: '1.5px solid rgba(46,107,255,0.1)', boxShadow: 'var(--shadow-1)' }}
    >
      <h2 id="companion-messages-heading" className="font-sans font-bold text-base mb-4" style={{ color: 'var(--color-ink)' }}>
        Messages
      </h2>

      {threads === null && (
        <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>Loading…</p>
      )}

      {threads?.length === 0 && (
        <EmptyState
          compact
          icon={<MessageSquare size={16} aria-hidden="true" />}
          title="No messages yet"
          description="When a member writes to you, their message appears here and you can reply."
        />
      )}

      {threads && threads.length > 0 && !openId && (
        <ul className="flex flex-col gap-2">
          {threads.map((t) => (
            <li key={t.userId}>
              <button
                type="button"
                onClick={() => void openThread(t.userId)}
                className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl min-h-[44px] transition-colors hover:bg-[rgba(46,107,255,0.05)] focus-visible:outline focus-visible:outline-2"
                style={{ border: '1px solid rgba(46,107,255,0.10)' }}
              >
                <span
                  className="grid place-items-center w-9 h-9 rounded-full shrink-0 font-sans font-bold text-sm text-white"
                  style={{ background: 'var(--grad-cta)' }}
                  aria-hidden="true"
                >
                  {t.memberFirstName[0]?.toUpperCase() ?? 'M'}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                    {t.memberFirstName}
                  </span>
                  <span className="block font-sans text-xs truncate" style={{ color: 'var(--color-ink-muted)' }}>
                    {t.lastFrom === 'me' ? 'You: ' : ''}{t.lastText}
                  </span>
                </span>
                {t.unread > 0 && (
                  <span
                    className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: 'var(--color-azure)' }}
                    aria-label={`${t.unread} unread`}
                  >
                    {t.unread}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {openId && (
        <div className="flex flex-col" style={{ minHeight: 320 }}>
          <div className="flex items-center gap-2 pb-3 mb-3" style={{ borderBottom: '1px solid rgba(46,107,255,0.08)' }}>
            <button
              type="button"
              onClick={() => { setOpenId(null); void loadThreads(); }}
              aria-label="Back to all messages"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              ←
            </button>
            <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
              {open?.memberFirstName ?? 'Member'}
            </span>
          </div>

          <div
            ref={logRef}
            aria-live="polite"
            aria-label="Conversation"
            className="flex-1 overflow-y-auto flex flex-col gap-2 pb-2 pr-1"
            style={{ maxHeight: 260 }}
          >
            {thread.map((m) => {
              // In the stored row, `me` is the MEMBER's voice. On the companion's
              // screen that is the other person, so the sides are mirrored.
              const mine = m.from === 'them';
              return (
                <motion.div
                  key={m.id}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={spring.snappy}
                  className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  <span
                    className={`font-sans rounded-2xl max-w-[72%] leading-relaxed ${m.kind === 'sticker' ? 'text-4xl px-1' : 'text-sm px-3 py-2'}`}
                    style={
                      m.kind === 'sticker'
                        ? { color: 'var(--color-ink)' }
                        : mine
                          ? { background: 'var(--color-azure)', color: '#fff' }
                          : { background: 'var(--color-bg)', color: 'var(--color-ink)', border: '1px solid rgba(46,107,255,0.1)' }
                    }
                  >
                    {m.text}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {blocked && (
            <p className="flex items-center gap-1.5 font-sans text-xs mt-2" style={{ color: '#C0392B' }} role="alert">
              <Shield size={12} aria-hidden="true" />
              Keep phone numbers and email out of chat until you have met.
            </p>
          )}
          {error && (
            <p className="font-sans text-xs mt-2" style={{ color: '#C0392B' }} role="alert">{error}</p>
          )}

          <div className="flex items-center gap-2 mt-3">
            <input
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (blocked && !CONTACT_RE.test(e.target.value)) setBlocked(false);
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') void send(); }}
              placeholder="Write a reply…"
              aria-label="Reply to member"
              className="flex-1 min-h-[44px] px-3 rounded-xl text-sm border"
              style={{ borderColor: 'rgba(46,107,255,0.22)', background: 'var(--color-bg)', color: 'var(--color-ink)' }}
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!draft.trim()}
              aria-label="Send reply"
              className="min-h-[44px] min-w-[44px] grid place-items-center rounded-xl text-white disabled:opacity-40"
              style={{ background: 'var(--grad-cta)' }}
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
