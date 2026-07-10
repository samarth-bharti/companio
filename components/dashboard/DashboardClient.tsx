'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { getUser } from '@/lib/journeyState';
import { getBookings, updateBooking, getPlan } from '@/lib/appState';
import { ActivityToast } from '@/components/journey/ActivityToast';
import { SegmentedPill } from '@/components/journey/SegmentedPill';
import { Reveal } from '@/components/motion/Reveal';
import { OverviewPanel } from './OverviewPanel';
import { BookingsPanel } from './BookingsPanel';
import { MessagesPanel } from './MessagesPanel';
import { SavedPanel } from './SavedPanel';
import { NotificationsPanel } from './NotificationsPanel';
import { calm } from '@/lib/motion';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'bookings' | 'messages' | 'saved' | 'notifications';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',      label: 'Overview' },
  { key: 'bookings',      label: 'Bookings' },
  { key: 'messages',      label: 'Messages' },
  { key: 'saved',         label: 'Saved' },
  { key: 'notifications', label: 'Notifications' },
];

function greetText(firstName: string | null): string {
  const h = new Date().getHours();
  const salut = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return firstName ? `${salut}, ${firstName}` : salut;
}

// Separate component so TypeScript is happy with the JSX return type
function PanelContent({ tab, companionParam }: { tab: Tab; companionParam?: string }) {
  switch (tab) {
    case 'overview':      return <OverviewPanel />;
    case 'bookings':      return <BookingsPanel />;
    case 'messages':      return <MessagesPanel initialCompanionId={companionParam} />;
    case 'saved':         return <SavedPanel />;
    case 'notifications': return <NotificationsPanel />;
    default:              return null;
  }
}

export function DashboardClient() {
  const sp = useSearchParams();
  const router = useRouter();

  // Tab state is LOCAL (reliable re-render), seeded from the URL once on mount.
  // The URL is kept in sync on each switch so deep-links / refresh still work,
  // but rendering never depends on useSearchParams re-propagating after a
  // router.replace (which is flaky on a statically-prerendered route).
  const [activeTab, setActiveTab]         = useState<Tab>('overview');
  const [companionParam, setCompanionParam] = useState<string | undefined>(undefined);
  const [userName, setUserName]   = useState<string | null>(null);
  const [greeting, setGreeting]   = useState('');
  const [mounted, setMounted]     = useState(false);
  const [journeyStep, setJourneyStep] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduced = useEffectiveReducedMotion();

  useEffect(() => {
    // Seed tab + companion thread from the URL (deep-link from profile "Message").
    const rawTab = sp?.get('tab') as Tab | null;
    if (rawTab && TABS.some((t) => t.key === rawTab)) setActiveTab(rawTab);
    setCompanionParam(sp?.get('c') ?? undefined);

    // Auto-mark past bookings once on mount
    const today = new Date().toISOString().split('T')[0];
    getBookings().forEach((b) => {
      if (b.status === 'upcoming' && b.dateISO < today) {
        updateBooking(b.id, { status: 'completed' });
      }
    });
    // Derive member journey step from fresh state (post-auto-mark).
    // Steps: Browsed(0) → Booked(1) → Met(2) → Verified(3)
    const freshBookings = getBookings();
    const hasMet    = freshBookings.some((b) => b.status === 'completed');
    const hasBooked = freshBookings.length > 0;
    const hasVerified = getPlan() === 'plus';
    setJourneyStep(hasVerified ? 3 : hasMet ? 2 : hasBooked ? 1 : 0);

    const u = getUser();
    setUserName(u?.firstName ?? null);
    setGreeting(greetText(u?.firstName ?? null));
    setMounted(true);
    // Seed from URL only on first mount — subsequent tab changes are local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTab = useCallback(
    (tab: Tab) => {
      setActiveTab(tab);
      if (tab !== 'messages') setCompanionParam(undefined);
      // Mirror to the URL for shareability/refresh — not the render source.
      const params = new URLSearchParams();
      params.set('tab', tab);
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const handleTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    tabRefs.current[next]?.focus();
    setTab(TABS[next].key);
  };

  if (!mounted) {
    return <div className="min-h-screen" style={{ background: 'var(--color-bg)' }} />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {!userName && (
        <div className="px-4 py-3 text-sm text-center" style={{ background: 'var(--color-azure-tint)' }}>
          <span style={{ color: 'var(--color-ink-muted)' }}>Previewing as a guest. </span>
          <a
            href="/login?next=/dashboard"
            className="font-semibold underline underline-offset-2"
            style={{ color: 'var(--color-azure-deep)' }}
          >
            Sign in to save your progress
          </a>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 pt-8 pb-2">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={calm.base}
          className="font-display font-bold"
          style={{ fontSize: 'var(--text-h2)', color: 'var(--color-ink)' }}
        >
          {greeting}
        </motion.h1>

        {/* Member journey tracker — reflects real progress from bookings/plan */}
        <Reveal delay={0.06}>
          <div className="mt-3">
            <SegmentedPill
              steps={['Browsed', 'Booked', 'Met', 'Verified']}
              current={journeyStep}
            />
          </div>
        </Reveal>
      </div>

      {/* Tab bar — keyboard arrow nav, role=tablist semantics preserved */}
      <div className="max-w-4xl mx-auto px-4">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="flex gap-1 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
        >
          {TABS.map(({ key, label }, idx) => (
            <motion.button
              key={key}
              ref={(el) => { tabRefs.current[idx] = el; }}
              role="tab"
              aria-selected={activeTab === key}
              aria-controls={`panel-${key}`}
              id={`tab-${key}`}
              tabIndex={activeTab === key ? 0 : -1}
              onClick={() => setTab(key)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              whileTap={reduced ? {} : { scale: 0.96 }}
              transition={calm.fast}
              className={cn(
                'whitespace-nowrap px-4 py-2 rounded-pill text-sm font-semibold font-sans transition-colors min-h-[44px]',
                activeTab === key ? 'text-white [background:var(--grad-cta)]' : 'bg-transparent',
              )}
              style={activeTab !== key ? { color: 'var(--color-ink-muted)' } : undefined}
            >
              {label}
            </motion.button>
          ))}
        </div>
        <div
          className="h-px mt-1 mb-6"
          style={{ background: 'var(--grad-aurora)', opacity: 0.2 }}
          aria-hidden="true"
        />
      </div>

      {/* Panel area — AnimatePresence mode="wait" cross-fades on tab switch */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            initial={{ opacity: 0, y: reduced ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -4 }}
            transition={calm.fast}
          >
            <PanelContent tab={activeTab} companionParam={companionParam} />
          </motion.div>
        </AnimatePresence>
      </div>

      <ActivityToast />
    </div>
  );
}
