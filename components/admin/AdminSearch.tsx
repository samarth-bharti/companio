'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * The search box for an admin list page.
 *
 * The pages stay server components doing their own Prisma queries — this only
 * owns the URL. Typing rewrites `?q=`, which re-renders the page on the server
 * with a new `where`. Any search drops `?page=`, so page 1 of the new result is
 * what you land on rather than page 4 of a list that no longer has four pages.
 *
 * `router.replace` rather than `push`: nobody wants nine history entries for
 * "s", "sa", "sam"… and a Back that walks them all back out one keystroke at a
 * time. Debounced 300ms so a typed word is one query, not one query per letter.
 *
 * `q` is the value the server rendered with — the input syncs to it, so the
 * "Clear" links elsewhere on the page actually empty the box.
 */
export function AdminSearch({
  q,
  label,
  placeholder,
  preserve,
}: {
  /** The active `?q=`, as the server read it. */
  q: string;
  /** e.g. "Search users" — describes what is searched, and over which fields. */
  label: string;
  placeholder?: string;
  /** Other params to keep across a search (the status chips' `?status=`). */
  preserve?: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const inputId = useId();

  const [value, setValue] = useState(q);
  // What the URL already says, so a re-render doesn't re-navigate to itself.
  const urlQ = useRef(q);

  // Serialised, so the debounce effect doesn't re-fire on every render just
  // because `preserve` is a fresh object literal each time.
  const preserveKey = JSON.stringify(preserve ?? {});

  useEffect(() => {
    setValue(q);
    urlQ.current = q;
  }, [q]);

  const push = useCallback(
    (next: string) => {
      urlQ.current = next;
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(JSON.parse(preserveKey) as Record<string, string | undefined>)) {
        if (v) sp.set(k, v);
      }
      if (next) sp.set('q', next);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, preserveKey, router],
  );

  useEffect(() => {
    const next = value.trim().slice(0, 100);
    if (next === urlQ.current) return;
    const t = setTimeout(() => push(next), 300);
    return () => clearTimeout(t);
  }, [value, push]);

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]"
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="search"
          value={value}
          maxLength={100}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => setValue(e.target.value)}
          // Enter searches now instead of waiting out the debounce.
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              push(value.trim().slice(0, 100));
            }
          }}
          className="h-9 px-3 text-sm rounded-full bg-white border border-[var(--color-ink)]/15 w-full max-w-sm text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]"
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setValue('');
              push('');
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--color-ink)]/20 text-[var(--color-ink-muted)] hover:bg-[var(--color-ink)]/5 hover:text-[var(--color-ink)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ink)]"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
