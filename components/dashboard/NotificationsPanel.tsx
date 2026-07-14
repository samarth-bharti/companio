'use client';

import { motion } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { dataClient } from '@/lib/dataClient';
import { useData } from '@/lib/useData';
import { useViewerReady } from '@/lib/useViewerReady';
import type { AppNotification } from '@/lib/appState';
import { calm, stagger, spring } from '@/lib/motion';

function fmtTs(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000)      return 'Just now';
  if (diff < 3_600_000)   return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000)  return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const itemVariant = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: calm.base },
};

const NO_NOTIFS: AppNotification[] = [];

export function NotificationsPanel() {
  // A guest previewing the dashboard has no rows to read; asking anyway is 401s.
  const signedIn = useViewerReady();
  const reduced = useEffectiveReducedMotion();

  // A booking made on another tab pushes a notification; this list now shows it
  // without a reload.
  const { data: notifs } = useData('notifications', () => dataClient.getNotifications(), NO_NOTIFS, signedIn);

  const markAllRead = () => {
    void dataClient.markNotificationsRead();
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  if (notifs.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-sans text-sm font-semibold mb-1" style={{ color: 'var(--color-ink)' }}>
          All quiet here
        </p>
        <p className="font-sans text-sm mb-4" style={{ color: 'var(--color-ink-muted)' }}>
          Booking updates and review confirmations will appear here.
        </p>
        <motion.a
          href="/explore"
          whileTap={reduced ? {} : { scale: 0.97 }}
          transition={spring.snappy}
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-pill text-sm font-semibold text-white"
          style={{ background: 'var(--grad-cta)' }}
        >
          Book a meetup →
        </motion.a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-sans text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--color-ink-muted)' }}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </p>
        {unreadCount > 0 && (
          <motion.button
            onClick={markAllRead}
            whileTap={reduced ? {} : { scale: 0.97 }}
            transition={spring.snappy}
            className="font-sans text-sm font-medium min-h-[44px] px-3 rounded-md"
            style={{ color: 'var(--color-azure-deep)' }}
          >
            Mark all read
          </motion.button>
        )}
      </div>

      {/* Stagger the list in on first render */}
      <motion.ul
        className="flex flex-col gap-2"
        aria-label="Notifications"
        aria-live="polite"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: reduced ? 0 : stagger.tight } } }}
      >
        {notifs.map((n) => (
          <motion.li
            key={n.id}
            variants={itemVariant}
            className="flex gap-3 items-start rounded-lg px-4 py-3"
            style={{
              background:   n.read ? 'var(--color-surface)'    : 'var(--color-azure-tint)',
              border:       `1.5px solid ${n.read ? 'rgba(46,107,255,0.06)' : 'rgba(46,107,255,0.15)'}`,
              boxShadow:    'var(--shadow-1)',
            }}
          >
            {/* Unread indicator dot */}
            <span
              aria-hidden="true"
              className="mt-1.5 shrink-0 rounded-full"
              style={{
                width:      8,
                height:     8,
                background: n.read ? 'transparent' : 'var(--color-azure)',
                flexShrink: 0,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                  {n.title}
                </p>
                <time
                  dateTime={new Date(n.ts).toISOString()}
                  className="font-sans text-xs shrink-0"
                  style={{ color: 'var(--color-ink-muted)' }}
                >
                  {fmtTs(n.ts)}
                </time>
              </div>
              <p className="font-sans text-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
                {n.body}
              </p>
            </div>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
