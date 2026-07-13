import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

// otp.ts imports prisma and the mailer at module scope, so both are mocked
// before it is loaded.
const db = {
  emailOtp: {
    count: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(async (ops: unknown) => (Array.isArray(ops) ? ops : ops)),
};

const sendEmail = vi.fn();

vi.mock('@/lib/prisma', () => ({ prisma: db }));
vi.mock('@/lib/server/email', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }));

const {
  sendSignInCode,
  verifySignInCode,
  normaliseEmail,
  MAX_ATTEMPTS,
  MAX_SENDS_PER_HOUR,
  OTP_TTL_MS,
} = await import('@/lib/server/otp');

const SECRET = process.env.NEXTAUTH_SECRET ?? 'test-secret';
process.env.NEXTAUTH_SECRET = SECRET;

/** The hash otp.ts will compute — recomputed here from its documented recipe. */
const hashOf = (email: string, code: string) =>
  createHash('sha256').update(`${SECRET}:${email}:${code}`).digest('hex');

/** A live, unconsumed row holding `code`. */
const row = (email: string, code: string, over: Record<string, unknown> = {}) => ({
  id: 'otp1',
  email,
  codeHash: hashOf(email, code),
  expiresAt: new Date(Date.now() + OTP_TTL_MS),
  attempts: 0,
  consumedAt: null,
  createdAt: new Date(),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  db.emailOtp.count.mockResolvedValue(0);
  db.emailOtp.create.mockResolvedValue({});
  db.emailOtp.updateMany.mockResolvedValue({ count: 1 });
  db.emailOtp.update.mockResolvedValue({});
  db.$transaction.mockImplementation(async (ops: unknown) => ops);
});

describe('normaliseEmail', () => {
  it('folds case and whitespace so one address is one identity', () => {
    expect(normaliseEmail('  Sam@X.com ')).toBe('sam@x.com');
  });
});

describe('sendSignInCode', () => {
  // The code must never be recoverable from a database dump.
  it('persists a salted hash, never the code itself', async () => {
    await sendSignInCode('sam@x.com');

    const created = db.$transaction.mock.calls[0][0] as unknown[];
    expect(created).toHaveLength(2); // burn old codes, then create the new one
    const createArg = db.emailOtp.create.mock.calls[0][0];

    expect(createArg.data.email).toBe('sam@x.com');
    expect(createArg.data.codeHash).toMatch(/^[0-9a-f]{64}$/);
    // No plaintext field of any kind.
    expect(Object.keys(createArg.data)).not.toContain('code');
    expect(JSON.stringify(createArg.data)).not.toMatch(/\b\d{6}\b/);
  });

  it('invalidates earlier live codes, so only the newest can work', async () => {
    await sendSignInCode('sam@x.com');
    expect(db.emailOtp.updateMany).toHaveBeenCalledWith({
      where: { email: 'sam@x.com', consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    });
  });

  // One address, mail-bombed from a botnet of distinct IPs, defeats an IP throttle.
  it('throttles per address, not just per IP', async () => {
    db.emailOtp.count.mockResolvedValue(MAX_SENDS_PER_HOUR);
    const out = await sendSignInCode('sam@x.com');
    expect(out).toEqual({ ok: false, reason: 'too_many_requests' });
    expect(db.emailOtp.create).not.toHaveBeenCalled();
  });

  it('reports console delivery when email is not configured, rather than claiming it sent one', async () => {
    const out = await sendSignInCode('sam@x.com');
    expect(out).toMatchObject({ ok: true, delivery: 'console' });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  // With no email service, the code went to the server's terminal and nowhere
  // else — so the only person who could sign in to a test build was whoever was
  // watching `next dev` scroll past. It now rides back to the screen.
  it('returns the code itself when there is no inbox to send it to', async () => {
    const out = await sendSignInCode('sam@x.com');
    expect(out).toMatchObject({ ok: true, delivery: 'console' });
    expect((out as { code: string }).code).toMatch(/^\d{6}$/);
  });

  /**
   * The one that matters. A real user's sign-in code must never be handed back to
   * whoever asked for it. Production refuses to run without email at all, so this
   * branch is unreachable there — this test is the guard on that staying true.
   */
  it('never returns a code in production', async () => {
    const prev = process.env.NODE_ENV;
    // NODE_ENV is readonly in the types; the runtime does not care.
    (process.env as Record<string, string>).NODE_ENV = 'production';
    try {
      const out = await sendSignInCode('sam@x.com');
      expect(out).not.toHaveProperty('code');
    } finally {
      (process.env as Record<string, string>).NODE_ENV = prev ?? 'test';
    }
  });
});

describe('verifySignInCode', () => {
  it('accepts the right code exactly once', async () => {
    db.emailOtp.findFirst.mockResolvedValue(row('sam@x.com', '123456'));
    db.emailOtp.updateMany.mockResolvedValue({ count: 1 });

    expect(await verifySignInCode('sam@x.com', '123456')).toEqual({ ok: true });
    // Consumed conditionally on consumedAt: null — that IS the single-use guarantee.
    expect(db.emailOtp.updateMany).toHaveBeenCalledWith({
      where: { id: 'otp1', consumedAt: null },
      data: { consumedAt: expect.any(Date) },
    });
  });

  // Two requests racing with the same valid code: the second must lose.
  it('refuses the second of two racing consumers', async () => {
    db.emailOtp.findFirst.mockResolvedValue(row('sam@x.com', '123456'));
    db.emailOtp.updateMany.mockResolvedValue({ count: 0 }); // someone else claimed it
    expect(await verifySignInCode('sam@x.com', '123456')).toEqual({ ok: false, reason: 'no_code' });
  });

  it('counts a wrong guess against the code', async () => {
    db.emailOtp.findFirst.mockResolvedValue(row('sam@x.com', '123456'));
    const out = await verifySignInCode('sam@x.com', '000000');
    expect(out).toEqual({ ok: false, reason: 'mismatch' });
    expect(db.emailOtp.update).toHaveBeenCalledWith({
      where: { id: 'otp1' },
      data: { attempts: { increment: 1 } },
    });
  });

  // A million guesses is minutes of work for a script. The row must die first.
  it('burns the code after MAX_ATTEMPTS, whatever the IP throttle allows', async () => {
    db.emailOtp.findFirst.mockResolvedValue(row('sam@x.com', '123456', { attempts: MAX_ATTEMPTS }));
    const out = await verifySignInCode('sam@x.com', '123456'); // even the RIGHT code
    expect(out).toEqual({ ok: false, reason: 'too_many_attempts' });
    expect(db.emailOtp.updateMany).not.toHaveBeenCalled();
  });

  it('refuses an expired code', async () => {
    db.emailOtp.findFirst.mockResolvedValue(
      row('sam@x.com', '123456', { expiresAt: new Date(Date.now() - 1) }),
    );
    expect(await verifySignInCode('sam@x.com', '123456')).toEqual({ ok: false, reason: 'expired' });
  });

  it('refuses when no live code exists', async () => {
    db.emailOtp.findFirst.mockResolvedValue(null);
    expect(await verifySignInCode('sam@x.com', '123456')).toEqual({ ok: false, reason: 'no_code' });
  });

  // Rejected before any database work — a malformed guess must not even cost a query.
  it('rejects a non-6-digit code without touching the database', async () => {
    expect(await verifySignInCode('sam@x.com', 'abc')).toEqual({ ok: false, reason: 'mismatch' });
    expect(await verifySignInCode('sam@x.com', '12345')).toEqual({ ok: false, reason: 'mismatch' });
    expect(db.emailOtp.findFirst).not.toHaveBeenCalled();
  });

  // The hash is salted with the address, so a code minted for one person cannot
  // be replayed against another — even if both were handed the same six digits.
  it('will not accept a code hashed for a different address', async () => {
    db.emailOtp.findFirst.mockResolvedValue({
      ...row('victim@x.com', '123456'),
      codeHash: hashOf('attacker@x.com', '123456'),
    });
    expect(await verifySignInCode('victim@x.com', '123456')).toEqual({ ok: false, reason: 'mismatch' });
  });

  it('matches the address case-insensitively', async () => {
    db.emailOtp.findFirst.mockResolvedValue(row('sam@x.com', '123456'));
    expect(await verifySignInCode('  SAM@X.com ', '123456')).toEqual({ ok: true });
  });
});
