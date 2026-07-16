import { EmptyState } from '@/components/ui/EmptyState';
import { adminListHref } from '@/lib/server/adminList';

/**
 * The nothing-to-show state for an admin list.
 *
 * A search that matches nothing and a table that is genuinely empty look
 * identical from the operator's chair — "No users yet." after typing a typo'd
 * email is a lie about the database. So the three cases are told apart, and the
 * two filtered ones offer the way back out.
 */
export function AdminEmpty({
  basePath,
  q,
  status,
  noun,
  emptyLabel,
}: {
  basePath: string;
  /** The active search, if any. */
  q: string;
  /** The active status filter, if any. */
  status?: string;
  /** Plural, lower case: "users", "bookings". */
  noun: string;
  /** Shown when nothing is filtered — e.g. "No users yet." */
  emptyLabel: string;
}) {
  if (q) {
    return (
      <EmptyState
        title={`No ${noun} match “${q}”.`}
        description={status ? `Searching within the “${status}” filter.` : undefined}
        // Clearing the search keeps the status chip the operator chose.
        action={{ href: adminListHref(basePath, { status }), label: 'Clear search' }}
      />
    );
  }

  if (status) {
    return (
      <EmptyState
        title={`No ${noun} with status “${status}”.`}
        action={{ href: basePath, label: 'Show all' }}
      />
    );
  }

  return <EmptyState title={emptyLabel} />;
}
