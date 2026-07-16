import Link from 'next/link';
import { adminListHref } from '@/lib/server/adminList';

/**
 * Prev/next for an admin list, plus the count the pages never showed: "showing
 * 51–100 of 3,412". The old headings read "Users (200)" whether there were 200
 * users or 40,000 — the cap looked like the total.
 *
 * Plain links, no client JS: the whole page is a server render keyed on the URL.
 * `q` and `status` ride along so paging never silently drops the filter.
 */
export function AdminPager({
  basePath,
  page,
  pageSize,
  total,
  q,
  status,
  label,
}: {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  q?: string;
  status?: string;
  /** Names the nav for screen readers, e.g. "User pages". */
  label: string;
}) {
  if (total === 0) return null;

  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(total, page * pageSize);

  const linkCls =
    'text-sm font-semibold text-[var(--color-azure)] hover:underline underline-offset-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]';

  return (
    <nav className="flex items-center justify-between gap-3 flex-wrap" aria-label={label}>
      {page > 1 ? (
        <Link href={adminListHref(basePath, { q, status, page: page - 1 })} className={linkCls}>
          ← Previous
        </Link>
      ) : (
        <span />
      )}

      <p className="text-xs text-[var(--color-ink-muted)]">
        {total === 0
          ? 'Nothing to show'
          : `Showing ${first.toLocaleString('en-IN')}–${last.toLocaleString('en-IN')} of ${total.toLocaleString('en-IN')}`}
        {lastPage > 1 && ` · page ${page} of ${lastPage}`}
      </p>

      {page < lastPage ? (
        <Link href={adminListHref(basePath, { q, status, page: page + 1 })} className={linkCls}>
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
