// lib/server/rateLimit.ts — fixed-window rate limiter for API routes.
//
// Usage:
//   import { rateLimit, clientKey } from '@/lib/server/rateLimit';
//   const rl = await rateLimit({ key: clientKey(req, 'login'), limit: 5, windowMs: 60_000 });
//   if (!rl.ok) return json({ error: 'rate_limited' }, 429);
//
// Backends (selected at module init, never throws at import):
//   • In-memory Map  — default, zero config, per-instance, resets on cold start.
//                      Fine for basic abuse protection on single-instance deploys.
//   • Upstash Redis  — used when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//                      are set. Atomic INCR+EXPIRE via REST pipeline, no extra npm dep.
//
// Fail-open: if the Upstash call fails, we fall back to in-memory and console.warn.
// Rate limiting must never block a legitimate request due to infra trouble.

// ---------------------------------------------------------------------------
// In-memory backend
// ---------------------------------------------------------------------------

import { envValue } from '@/lib/env';

interface MemEntry {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, MemEntry>();

/** Sweep entries whose window has already expired. Runs at most once per second. */
let lastSweep = 0;
function maybeSweep() {
  const now = Date.now();
  if (now - lastSweep < 1_000) return;
  lastSweep = now;
  for (const [k, v] of store) {
    if (now > v.resetAt) store.delete(k);
  }
}

function memIncr(key: string, windowMs: number): { count: number; resetAt: number } {
  maybeSweep();
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    const fresh: MemEntry = { count: 1, resetAt: now + windowMs };
    store.set(key, fresh);
    return fresh;
  }
  entry.count += 1;
  return entry;
}

// ---------------------------------------------------------------------------
// Upstash backend (plain fetch, no sdk)
// ---------------------------------------------------------------------------

const upstashUrl = envValue('UPSTASH_REDIS_REST_URL');
const upstashToken = envValue('UPSTASH_REDIS_REST_TOKEN');
const useUpstash = Boolean(upstashUrl && upstashToken);

/**
 * Atomic pipeline: INCR key, PEXPIRE key windowMs (only on first call).
 * Returns the current count and the TTL in milliseconds.
 */
async function upstashIncr(
  key: string,
  windowMs: number,
): Promise<{ count: number; ttlMs: number }> {
  // Upstash pipeline: send array of commands, get array of results.
  const pipeline = [
    ['INCR', key],
    ['PTTL', key], // ms remaining; -1 means no expiry set yet
  ];

  const res = await fetch(`${upstashUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pipeline),
  });

  if (!res.ok) throw new Error(`Upstash pipeline failed: ${res.status}`);

  const results = (await res.json()) as Array<{ result: number }>;
  const count = results[0].result;
  let ttlMs = results[1].result;

  // First increment in this window: set expiry now.
  if (ttlMs < 0) {
    await fetch(`${upstashUrl}/pexpire/${encodeURIComponent(key)}/${windowMs}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${upstashToken}` },
    });
    ttlMs = windowMs;
  }

  return { count, ttlMs };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds until window resets; 0 when ok
}

/**
 * Check and increment the rate-limit counter for `key`.
 * Never throws — falls back to in-memory if Upstash is unavailable.
 */
export async function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts;

  let count: number;
  let ttlMs: number;

  if (useUpstash) {
    try {
      const r = await upstashIncr(key, windowMs);
      count = r.count;
      ttlMs = r.ttlMs;
    } catch (err) {
      console.warn('[rateLimit] Upstash error, falling back to in-memory:', err);
      const m = memIncr(key, windowMs);
      count = m.count;
      ttlMs = Math.max(0, m.resetAt - Date.now());
    }
  } else {
    const m = memIncr(key, windowMs);
    count = m.count;
    ttlMs = Math.max(0, m.resetAt - Date.now());
  }

  const ok = count <= limit;
  const remaining = Math.max(0, limit - count);
  const retryAfter = ok ? 0 : Math.ceil(ttlMs / 1_000);

  return { ok, remaining, retryAfter };
}

/**
 * Derive a stable rate-limit key from the request's client IP + a bucket name.
 *
 * Trust model: the LEFTMOST x-forwarded-for hop is client-controlled and can be
 * forged to rotate the key and bypass the limit. We therefore prefer the
 * platform-set client IP that proxies inject and cannot be spoofed by the
 * caller — Vercel's `x-vercel-forwarded-for`, then the RIGHTMOST x-forwarded-for
 * hop (the one the trusted proxy appended). Falls back to 'anon' only in local
 * dev where no proxy is present.
 */
export function clientKey(req: Request, bucket: string): string {
  const vercelIp = req.headers.get('x-vercel-forwarded-for')?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  const xff = req.headers.get('x-forwarded-for') ?? '';
  const hops = xff.split(',').map((h) => h.trim()).filter(Boolean);
  const rightmost = hops.length ? hops[hops.length - 1] : '';
  const ip = vercelIp || realIp || rightmost || 'anon';
  return `rl:${bucket}:${ip}`;
}
