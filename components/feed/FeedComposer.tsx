'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Camera, CalendarPlus, Footprints } from 'lucide-react';
import { spring } from '@/lib/motion';
import { getUser } from '@/lib/journeyState';
import type { FeedPost, ActivityPost, EventPost, PhotoPost } from './data';

type DraftType = 'activity' | 'event' | 'photo';

interface FeedComposerProps {
  onPost: (post: FeedPost) => void;
}

const TYPE_OPTS: { value: DraftType; label: string; Icon: React.ElementType }[] = [
  { value: 'activity', label: 'Activity',  Icon: Footprints },
  { value: 'event',    label: 'Event',     Icon: CalendarPlus },
  { value: 'photo',    label: 'Moment',    Icon: Camera },
];

const PLACEHOLDERS: Record<DraftType, string> = {
  activity: 'Describe the activity, time, place, and spots available…',
  event:    'Event title, date, time, and venue…',
  photo:    'Caption for your photo moment…',
};

export function FeedComposer({ onPost }: FeedComposerProps) {
  const [open, setOpen]           = useState(false);
  const [draftType, setDraftType] = useState<DraftType>('activity');
  const [text, setText]           = useState('');
  const [userName, setUserName]   = useState('You');
  const reduced = useReducedMotion();

  useEffect(() => {
    const u = getUser();
    if (u?.firstName) setUserName(u.firstName);
  }, []);

  function submit() {
    if (!text.trim()) return;
    const base = {
      id: `new-${Date.now()}`,
      author: { name: userName, avatar: '', area: 'Mumbai' },
      timeAgo: 'just now',
      activityTag: draftType === 'event' ? 'Event' : draftType === 'photo' ? 'Moment' : 'Activity',
      reactions: 0,
      comments: [],
    };
    let post: FeedPost;
    if (draftType === 'activity') {
      post = { ...base, type: 'activity', text: text.trim(), goingCount: 0 } as ActivityPost;
    } else if (draftType === 'event') {
      post = { ...base, type: 'event', title: text.trim(), dateTime: 'TBD', place: 'TBD', goingCount: 0, goingAvatars: [] } as EventPost;
    } else {
      post = { ...base, type: 'photo', caption: text.trim(), images: [], likeCount: 0, verifiedMeetup: false } as PhotoPost;
    }
    onPost(post);
    setText('');
    setOpen(false);
  }

  return (
    <>
      {/* Trigger card */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-lg)] text-left hover:shadow-md transition-shadow"
        style={{
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-1)',
          border: '1.5px solid rgba(46,107,255,0.1)',
        }}
        aria-label="Share an activity, event, or photo moment"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold text-white"
          style={{ background: 'var(--grad-cta)' }}
          aria-hidden="true"
        >
          {userName[0].toUpperCase()}
        </div>
        <span className="text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          Share an activity, event, or photo moment…
        </span>
      </button>

      {/* Sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(20,26,46,0.45)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 p-6 flex flex-col gap-4
                         md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto
                         md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2
                         rounded-t-[var(--radius-lg)] md:rounded-[var(--radius-lg)]"
              style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lift)' }}
              initial={{ y: reduced ? 0 : 64, opacity: 0 }}
              animate={{ y: 0, opacity: 1, transition: spring.soft }}
              exit={{ y: reduced ? 0 : 40, opacity: 0, transition: { duration: 0.18 } }}
            >
              <div className="flex items-center justify-between">
                <h2
                  className="text-base font-semibold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
                >
                  Share something
                </h2>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="p-1.5 rounded-full"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Type selector */}
              <div className="flex gap-2">
                {TYPE_OPTS.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setDraftType(value)}
                    aria-pressed={draftType === value}
                    className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-[var(--radius-md)] text-xs font-semibold transition-colors"
                    style={
                      draftType === value
                        ? { background: 'rgba(46,107,255,0.1)', color: 'var(--color-azure)', border: '1.5px solid rgba(46,107,255,0.25)' }
                        : { background: 'rgba(20,26,46,0.04)', color: 'var(--color-ink-muted)', border: '1.5px solid rgba(20,26,46,0.08)' }
                    }
                  >
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                placeholder={PLACEHOLDERS[draftType]}
                value={text}
                onChange={e => setText(e.target.value)}
                className="w-full resize-none rounded-[var(--radius-md)] px-4 py-3 text-sm font-sans"
                style={{
                  border: '1.5px solid rgba(46,107,255,0.15)',
                  color: 'var(--color-ink)',
                  background: 'var(--color-bg)',
                  outline: 'none',
                  lineHeight: 1.6,
                }}
                aria-label="Post content"
              />

              <button
                onClick={submit}
                disabled={!text.trim()}
                className="w-full py-3 rounded-pill text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                style={{ background: 'var(--grad-cta)', boxShadow: text.trim() ? 'var(--glow-azure)' : 'none' }}
              >
                Post
              </button>

              <p className="text-xs text-center" style={{ color: 'var(--color-ink-muted)' }}>
                Strictly platonic, no contact info, no romance language.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
