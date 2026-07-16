// lib/server/adminList.ts
//
// Shared plumbing for the admin list pages. Every one of them used to hard-cap
// its query (`take: 200`) with no search and no pagination, so the 201st row was
// unreachable from the panel — present in the database, invisible to the only
// people who could act on it.
//
// The pages own their `where` clauses (each model is different); this file owns
// the boring parts they all repeat: reading `?q=`, `?page=` and `?status=` off
// the URL, and building the links that set them.

/** One page of any admin list. */
export const ADMIN_PAGE_SIZE = 50;

/** The search params every list page accepts. `searchParams` is a Promise here. */
export type AdminListSearchParams = Promise<{
  q?: string;
  page?: string;
  status?: string;
}>;

/**
 * Sanitise a raw `?q=`. Trimmed, capped at 100 chars, empty means "no search".
 * The cap matters: `q` goes straight into a Prisma `contains`, and an operator
 * pasting a 50KB blob should not become a 50KB `LIKE` against every column.
 */
export function parseQ(raw: string | undefined): string {
  return (raw ?? '').trim().slice(0, 100);
}

/** Sanitise a raw `?page=`. Anything that is not a sane page number is page 1. */
export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/**
 * Sanitise a raw `?status=` against the model's enum. Returns undefined for
 * anything unrecognised, which the pages read as "no filter" — a hand-typed
 * `?status=nonsense` must not reach Prisma, which would throw on an invalid
 * enum value and 500 the page.
 */
export function parseStatus<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
): T | undefined {
  const v = (raw ?? '').trim();
  return (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
}

/** `{ contains: q, mode: 'insensitive' }` — the same shape on every page. */
export function like(q: string) {
  return { contains: q, mode: 'insensitive' as const };
}

/**
 * Build a list-page URL, dropping anything at its default so the common case
 * stays a clean `/admin/users` rather than `/admin/users?q=&page=1&status=`.
 */
export function adminListHref(
  basePath: string,
  params: { q?: string; page?: number; status?: string },
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.status) sp.set('status', params.status);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
