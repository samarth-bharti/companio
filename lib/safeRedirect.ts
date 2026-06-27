// lib/safeRedirect.ts
//
// Open-redirect guard. A `next` / `redirect` query param controls where the
// user lands after auth, so it must be an INTERNAL path. We only accept values
// that start with a single '/' — rejecting absolute URLs ('https://evil.com'),
// protocol-relative ('//evil.com') and backslash tricks ('/\\evil.com').

export function safeRedirect(next: string | undefined | null, fallback = '/explore'): string {
  if (!next) return fallback;
  if (!next.startsWith('/')) return fallback;       // not internal
  if (next.startsWith('//')) return fallback;        // protocol-relative
  if (next.startsWith('/\\')) return fallback;       // backslash escape
  return next;
}
