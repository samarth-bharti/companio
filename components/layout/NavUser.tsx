'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Bell, LayoutDashboard, Wallet, LogOut } from 'lucide-react';
import { getUser, clearUser, type DemoUser } from '@/lib/journeyState';
import {
  getNotifications,
  markNotificationsRead,
  type AppNotification,
} from '@/lib/appState';
import { TopUpMenu } from '@/components/layout/TopUpMenu';
import { RollLink } from '@/components/motion/RollLink';

function timeAgo(ts: number): string {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

/** Dropdown wrapper: closes on outside click and Escape. */
function useDismiss(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  return ref;
}

const PANEL_STYLE: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid rgba(46,107,255,0.14)',
  boxShadow: 'var(--shadow-lift)',
};

/**
 * NavUser — right side of the desktop nav once a demo user exists:
 * notifications bell (unread dot + dropdown) and avatar menu
 * (Dashboard / Wallet & pricing / Sign out). Renders the signed-out
 * links when no user. Hydration-safe: user read in an effect.
 */
export function NavUser() {
  const router = useRouter();
  const [user, setUser] = useState<DemoUser | null>(null);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [openBell, setOpenBell] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setNotifs(getNotifications());
  }, []);

  const closeBell = useCallback(() => setOpenBell(false), []);
  const closeMenu = useCallback(() => setOpenMenu(false), []);
  const bellRef = useDismiss(closeBell);
  const menuRef = useDismiss(closeMenu);

  if (!user) {
    return (
      <RollLink
        href="/login"
        className="h-9 px-5 rounded-xl font-sans font-bold text-sm text-white focus-visible:outline-white"
        style={{ background: 'var(--grad-cta)', boxShadow: '0 2px 12px rgba(20,26,46,0.25)' }}
        hoverBackground="var(--grad-cta-hover)"
      >
        Sign in
      </RollLink>
    );
  }

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <>
      {/* Quick wallet / top-up (no separate page needed) */}
      <TopUpMenu />

      {/* Notifications bell */}
      <div className="relative" ref={bellRef}>
        <button
          type="button"
          aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
          aria-expanded={openBell}
          onClick={() => {
            setOpenBell((v) => !v);
            setOpenMenu(false);
            if (!openBell) setNotifs(getNotifications());
          }}
          className="relative w-10 h-10 inline-flex items-center justify-center rounded-full transition-colors hover:bg-azure-tint focus-visible:outline-azure"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          <Bell size={19} aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: 'var(--color-coral, #FF5A5F)', borderColor: 'var(--color-surface)' }}
            />
          )}
        </button>
        {openBell && (
          <div
            role="region"
            aria-label="Notifications"
            className="absolute right-0 top-12 w-80 rounded-2xl p-2 z-50"
            style={PANEL_STYLE}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <p className="font-sans font-bold text-sm" style={{ color: 'var(--color-ink)' }}>
                Notifications
              </p>
              {unread > 0 && (
                <button
                  type="button"
                  className="font-sans text-xs font-semibold focus-visible:outline-azure rounded-sm"
                  style={{ color: 'var(--color-azure)' }}
                  onClick={() => {
                    markNotificationsRead();
                    setNotifs(getNotifications());
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifs.length === 0 ? (
              <p className="px-3 py-6 text-center font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
                Nothing yet, book your first meetup and updates land here.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {notifs.slice(0, 6).map((n) => (
                  <li key={n.id} className="flex gap-2.5 px-3 py-2.5 rounded-xl hover:bg-black/[.03]">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                      style={{ background: n.read ? 'rgba(20,26,46,0.15)' : 'var(--color-azure)' }}
                    />
                    <div>
                      <p className="font-sans text-sm font-semibold leading-snug" style={{ color: 'var(--color-ink)' }}>
                        {n.title}
                      </p>
                      <p className="font-sans text-xs leading-snug" style={{ color: 'var(--color-ink-muted)' }}>
                        {n.body}
                      </p>
                      <p className="font-sans text-[11px] mt-0.5" style={{ color: 'rgba(20,26,46,0.4)' }}>
                        {timeAgo(n.ts)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Avatar menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          aria-label={`Account menu, ${user.firstName}`}
          aria-expanded={openMenu}
          onClick={() => {
            setOpenMenu((v) => !v);
            setOpenBell(false);
          }}
          className="w-9 h-9 rounded-full inline-flex items-center justify-center font-sans font-bold text-sm text-white focus-visible:outline-azure"
          style={{ background: 'var(--grad-cta)' }}
        >
          {user.firstName[0]?.toUpperCase() ?? 'C'}
        </button>
        {openMenu && (
          <div role="menu" className="absolute right-0 top-12 w-56 rounded-2xl p-2 z-50" style={PANEL_STYLE}>
            <p className="px-3 pt-2 pb-1 font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              Signed in as <span className="font-semibold" style={{ color: 'var(--color-ink)' }}>{user.firstName}</span>
            </p>
            {[
              { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
              { href: '/pricing', label: 'Wallet & pricing', Icon: Wallet },
            ].map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={closeMenu}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-sans text-sm font-semibold hover:bg-black/[.03] focus-visible:outline-azure"
                style={{ color: 'var(--color-ink)' }}
              >
                <Icon size={16} aria-hidden="true" style={{ color: 'var(--color-ink-muted)' }} />
                {label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                clearUser();
                setUser(null);
                closeMenu();
                router.push('/');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-sans text-sm font-semibold hover:bg-black/[.03] focus-visible:outline-azure text-left"
              style={{ color: 'var(--color-ink-muted)' }}
            >
              <LogOut size={16} aria-hidden="true" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
