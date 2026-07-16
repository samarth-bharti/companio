// lib/env.ts
//
// Typed, zod-validated accessor for server-side environment variables.
// All vars are optional so this module is safe to import in any context
// (CI, Storybook, partial deployments) without crashing at import time.
// Features that require specific vars should call requireEnv() at runtime,
// not at module scope, so failures surface only when the feature is used.

import { z, ZodError } from 'zod';

// ---------------------------------------------------------------------------
// Placeholder detection
// ---------------------------------------------------------------------------

/**
 * True for a value that is obviously a fill-me-in marker rather than a real
 * setting: `[[paste your key]]`, `<your-key>`, `changeme`, or empty.
 *
 * WHY: `.env` values are strings, and a string is truthy. A `.env` where
 * `GOOGLE_CLIENT_ID=[[from Google Cloud Console]]` makes every "is this
 * configured?" check answer *yes* — so the app registers a Google provider with
 * a fake client id, tells the client that real sign-in is available, and then
 * dies at the OAuth redirect with a message that explains nothing.
 *
 * An unset variable is honest. A placeholder is a lie the code believes.
 * `lib/company.ts` already guards its `[[...]]` placeholders this way; env vars
 * deserve the same treatment.
 */
export function isPlaceholder(value: string | undefined | null): boolean {
  if (!value) return true;
  const v = value.trim();
  if (v === '') return true;
  if (v.startsWith('[[') || v.startsWith('<')) return true;
  return /^(changeme|todo|your[-_]?\w+|xxx+)$/i.test(v);
}

/**
 * Read an env var, treating placeholders as absent. Use this anywhere the answer
 * gates behaviour (does auth work? is there a database?), rather than
 * `process.env.X` directly.
 */
export function envValue(name: string): string | undefined {
  const raw = process.env[name];
  return isPlaceholder(raw) ? undefined : raw;
}

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
  PASS_SALES_ENABLED:       z.string().optional(),
  BLOB_READ_WRITE_TOKEN:    z.string().optional(),
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

// Each of these gates real behaviour, so each ignores placeholder values —
// a `DATABASE_URL=[[paste yours]]` must read as "no database", not as a
// connection string Prisma will then fail to open.

/** True when DATABASE_URL is set (Prisma is usable). */
export function hasDatabase(): boolean {
  return !isPlaceholder(getServerEnv().DATABASE_URL);
}

/** True when both Razorpay key vars are set (payments are usable). */
export function hasRazorpay(): boolean {
  const env = getServerEnv();
  return !isPlaceholder(env.RAZORPAY_KEY_ID) && !isPlaceholder(env.RAZORPAY_KEY_SECRET);
}

/**
 * True when passes may actually be sold.
 *
 * Companio launched supply-first: the catalogue is empty until real people apply
 * and pass an ID check, and a pass buys nothing but access to that catalogue.
 * Charging ₹199 to unlock an empty grid is taking money for nothing, so checkout
 * stays dark until there is supply worth paying for.
 *
 * DEFAULT OFF, and off for any unrecognised value — the failure mode of a typo
 * must be "we didn't take money", never "we took money we shouldn't have".
 * Razorpay keys must NOT arm this on their own; it is a separate, deliberate
 * decision, exactly like MARKETPLACE_PAYMENTS_ENABLED.
 *
 * This is a server-side check on purpose. A NEXT_PUBLIC_ flag is baked into the
 * bundle at build time and is the thing that gets shipped by accident.
 */
export function passSalesEnabled(): boolean {
  return envValue('PASS_SALES_ENABLED') === 'true';
}

/** True when NEXTAUTH_SECRET is set (NextAuth sessions can be signed). */
export function hasAuthSecret(): boolean {
  return !isPlaceholder(getServerEnv().NEXTAUTH_SECRET);
}

/** True when both Upstash vars are set (Redis rate-limiting / caching usable). */
export function hasUpstash(): boolean {
  const env = getServerEnv();
  return !isPlaceholder(env.UPSTASH_REDIS_REST_URL) && !isPlaceholder(env.UPSTASH_REDIS_REST_TOKEN);
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
