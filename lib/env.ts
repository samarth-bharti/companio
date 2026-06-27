// lib/env.ts
//
// Typed, zod-validated accessor for server-side environment variables.
// All vars are optional so this module is safe to import in any context
// (CI, Storybook, partial deployments) without crashing at import time.
// Features that require specific vars should call requireEnv() at runtime,
// not at module scope, so failures surface only when the feature is used.

import { z, ZodError } from 'zod';

// ---------------------------------------------------------------------------
// Schema — every var is optional; malformed values (e.g. bad URLs) still fail.
// ---------------------------------------------------------------------------

const schema = z.object({
  DATABASE_URL:             z.string().optional(),
  DIRECT_URL:               z.string().optional(),
  NEXTAUTH_SECRET:          z.string().optional(),
  NEXTAUTH_URL:             z.string().url().optional(),
  RAZORPAY_KEY_ID:          z.string().optional(),
  RAZORPAY_KEY_SECRET:      z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET:  z.string().optional(),
  SENTRY_DSN:               z.string().url().optional(),
  UPSTASH_REDIS_REST_URL:   z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SITE_URL:     z.string().url().optional(),
});

type Env = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Lazy singleton
// ---------------------------------------------------------------------------

let _cache: Env | null = null;

/**
 * Parse process.env once and cache the result for the lifetime of the process.
 * Safe to call with no vars set — returns an object of undefineds.
 * Throws a readable error if any *present* var fails its constraint (e.g. a
 * non-URL string in NEXTAUTH_URL), naming every offending variable.
 */
export function getServerEnv(): Env {
  if (_cache) return _cache;
  try {
    _cache = schema.parse(process.env);
    return _cache;
  } catch (e) {
    if (e instanceof ZodError) {
      const names = e.issues.map((i) => i.path.join('.')).join(', ');
      throw new Error(`[env] Invalid environment variable(s): ${names}`);
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// Derived booleans — call getServerEnv() so they always use the cached parse.
// ---------------------------------------------------------------------------

/** True when DATABASE_URL is set (Prisma is usable). */
export function hasDatabase(): boolean {
  return !!getServerEnv().DATABASE_URL;
}

/** True when both Razorpay key vars are set (payments are usable). */
export function hasRazorpay(): boolean {
  const env = getServerEnv();
  return !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

/** True when NEXTAUTH_SECRET is set (NextAuth sessions can be signed). */
export function hasAuthSecret(): boolean {
  return !!getServerEnv().NEXTAUTH_SECRET;
}

/** True when both Upstash vars are set (Redis rate-limiting / caching usable). */
export function hasUpstash(): boolean {
  const env = getServerEnv();
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

// ---------------------------------------------------------------------------
// requireEnv — for features that are intentionally enabled
// ---------------------------------------------------------------------------

/**
 * Return the requested env vars as a `Record<key, string>`, or throw listing
 * any that are absent. Call this inside feature-specific code, never at module
 * scope — the throw only makes sense once the feature is actually invoked.
 *
 * @example
 * const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } =
 *   requireEnv('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET');
 */
export function requireEnv<K extends keyof Env>(...keys: K[]): Record<K, string> {
  const env = getServerEnv();
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing required env: ${missing.join(', ')}`);
  return Object.fromEntries(keys.map((k) => [k, env[k]])) as Record<K, string>;
}
