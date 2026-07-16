import Link from 'next/link';
import { adminListHref } from '@/lib/server/adminList';

/**
 * Status filter chips for a list page. Server-rendered links — the filter lives
 * in the URL, so it survives a reload, a bookmark and a link pasted to another
 * admin, none of which client state would have done.
 *
 * Changing the filter drops `?page=` (adminListHref omits page 1) but keeps
 * `?q=`, so a search stays put while you flip between statuses.
 */
export function AdminStatusChips({
  basePath,
  active,
  options,
  q,
  allLabel = 'All',
  allValue,
  label,
}: {
  basePath: string;
  /** The active `?status=`, already validated against the enum. */
  active?: string;
  options: readonly string[];
  q?: string;
  allLabel?: string;
  /**
   * What "All" sets `?status=` to. Undefined (the usual case) means "All" is
   * simply the absent param. Applications default to `submitted` rather than
   * everything, so there "All" is an explicit value.
   */
  allValue?: string;
  /** Names the group for screen readers, e.g. "Filter bookings by status". */
  label: string;
}) {
  const chips: { key: string; label: string; status?: string; isActive: boolean }[] = [
    {
      key: '__all',
      label: allLabel,
      status: allValue,
      isActive: active === allValue,
    },
    ...options.map((o) => ({ key: o, label: o.replace(/_/g, ' '), status: o, isActive: active === o })),
  ];

  return (
    <nav aria-label={label} className="flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <Link
          key={c.key}
          href={adminListHref(basePath, { q, status: c.status })}
          aria-current={c.isActive ? 'true' : undefined}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)] ${
            c.isActive
              ? 'bg-[var(--color-ink)] text-white'
              : 'bg-white border border-[var(--color-ink)]/15 text-[var(--color-ink-muted)] hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)]'
          }`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
