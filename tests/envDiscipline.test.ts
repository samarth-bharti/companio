import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Every `.env` value is a string, and every string is truthy. So a half-filled
// `.env` — `RAZORPAY_WEBHOOK_SECRET=[[paste yours]]` — does not read as "unset".
// It reads as *configured, with a secret that is public knowledge*: enough to
// forge a signed `payment.captured` event and settle a purchase nobody paid for.
// Same shape for CRON_SECRET (a guessable bearer token) and DATABASE_URL
// (Prisma throws instead of the code degrading to no-database mode).
//
// envValue() is the only correct reader for a variable that GATES BEHAVIOUR.
// This test is a tripwire: it fails when a raw `process.env.X` read of one of
// those variables reappears anywhere in the source.

const GATING_VARS = [
  'DATABASE_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'NEXTAUTH_SECRET',
  'CRON_SECRET',
  'SMS_API_KEY',
  'ADMIN_EMAILS',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
] as const;

// lib/env.ts is the one module allowed to touch process.env directly — it is
// what implements the placeholder check that everything else depends on.
const ALLOWED = new Set(['lib/env.ts']);

const ROOTS = ['lib', 'app', 'components', 'prisma'];

function* sourceFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* sourceFiles(full);
    else if (/\.(ts|tsx)$/.test(entry)) yield full;
  }
}

describe('env discipline', () => {
  it('reads every behaviour-gating variable through envValue(), never process.env', () => {
    const pattern = new RegExp(`process\\.env\\.(${GATING_VARS.join('|')})\\b`);
    const offenders: string[] = [];

    for (const root of ROOTS) {
      for (const file of sourceFiles(root)) {
        const rel = relative('.', file).replace(/\\/g, '/');
        if (ALLOWED.has(rel)) continue;
        const src = readFileSync(file, 'utf8');
        src.split(/\r?\n/).forEach((line, i) => {
          const m = pattern.exec(line);
          if (m) offenders.push(`${rel}:${i + 1} reads process.env.${m[1]} directly`);
        });
      }
    }

    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('confirms the placeholder shapes this repo actually uses would be caught', async () => {
    const { isPlaceholder } = await import('@/lib/env');
    expect(isPlaceholder('[[paste your Razorpay webhook secret]]')).toBe(true);
    expect(isPlaceholder('whsec_realLookingSecret123')).toBe(false);
  });
});
