import { describe, it, expect, vi, beforeEach } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */
const { sessionMock, prismaMock } = vi.hoisted(() => ({
  sessionMock: vi.fn(),
  prismaMock: {} as any,
}));

vi.mock('@/lib/server/session', () => ({ getSessionUserId: sessionMock }));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));
vi.mock('@/lib/server/rateLimit', () => ({
  rateLimit: async () => ({ ok: true, remaining: 9, retryAfter: 0 }),
  clientKey: () => 'k',
}));

import { PATCH as patchProfile } from '@/app/api/companion/profile/route';
import { GET as getDashboard } from '@/app/api/companion/dashboard/route';

function jsonReq(body: unknown): Request {
  return new Request('http://localhost/api/companion/profile', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue('u1');
  prismaMock.user = { findUnique: vi.fn().mockResolvedValue({ companionId: 'ananya' }) };
  prismaMock.companion = {
    findUnique: vi.fn().mockResolvedValue({ id: 'ananya', premium: false }),
    update: vi.fn().mockResolvedValue({}),
  };
  prismaMock.companionPayout = { aggregate: vi.fn().mockResolvedValue({ _sum: { amountPaise: 0 } }) };
  prismaMock.booking = { count: vi.fn().mockResolvedValue(0), findMany: vi.fn().mockResolvedValue([]) };
});

describe('GET /api/companion/dashboard', () => {
  it('401s when signed out', async () => {
    sessionMock.mockResolvedValue(null);
    expect((await getDashboard()).status).toBe(401);
  });

  it('403s for an account that is not a companion', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ companionId: null });
    const res = await getDashboard();
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'not_a_companion' });
  });

  it('404s when the linked profile has been deleted, rather than showing zeros', async () => {
    prismaMock.companion.findUnique.mockResolvedValue(null);
    const res = await getDashboard();
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/companion/profile', () => {
  it('401s when signed out', async () => {
    sessionMock.mockResolvedValue(null);
    expect((await patchProfile(jsonReq({ availableNow: true }))).status).toBe(401);
  });

  it('403s for an account that is not a companion', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ companionId: null });
    expect((await patchProfile(jsonReq({ availableNow: true }))).status).toBe(403);
  });

  it('400s on an empty body — nothing to update is a mistake, not a no-op', async () => {
    expect((await patchProfile(jsonReq({}))).status).toBe(400);
  });

  it('saves availability', async () => {
    const res = await patchProfile(jsonReq({ availableNow: true, availability: 'Free now' }));
    expect(res.status).toBe(200);
    expect(prismaMock.companion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ananya' },
        data: expect.objectContaining({ availableNow: true, availability: 'Free now' }),
      }),
    );
  });

  // The whole point of a narrow allowlist: a companion presents themselves, but
  // never grants themselves trust or money-in.
  it.each(['verified', 'premium', 'rating', 'topMatch', 'matchScore', 'suspended', 'reviewCount'])(
    'ignores the admin-only field %s even when sent',
    async (field) => {
      const res = await patchProfile(jsonReq({ availableNow: true, [field]: true }));
      expect(res.status).toBe(200);
      const data = prismaMock.companion.update.mock.calls[0][0].data;
      expect(data).not.toHaveProperty(field);
    },
  );

  it('cannot change its own id or reassign the profile', async () => {
    await patchProfile(jsonReq({ availableNow: true, id: 'someone-else', companionId: 'x' }));
    const call = prismaMock.companion.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'ananya' });
    expect(call.data).not.toHaveProperty('id');
  });

  it('clamps an hourly rate below the allowed band', async () => {
    await patchProfile(jsonReq({ hourlyRate: 500 })); // ₹5/hr
    expect(prismaMock.companion.update.mock.calls[0][0].data.hourlyRate).toBe(30000); // ₹300
  });

  it('clamps an hourly rate above the allowed band', async () => {
    await patchProfile(jsonReq({ hourlyRate: 5_000_000 })); // ₹50,000/hr
    expect(prismaMock.companion.update.mock.calls[0][0].data.hourlyRate).toBe(100000); // ₹1,000
  });

  it('lets a premium companion go higher than a standard one', async () => {
    prismaMock.companion.findUnique.mockResolvedValue({ id: 'ananya', premium: true });
    await patchProfile(jsonReq({ hourlyRate: 5_000_000 }));
    expect(prismaMock.companion.update.mock.calls[0][0].data.hourlyRate).toBe(200000); // ₹2,000
  });

  it('rejects a malformed UPI id rather than paying into the void', async () => {
    for (const bad of ['nope', 'a@', '@bank', 'name@bank@bank', 'name bank']) {
      prismaMock.companion.update.mockClear();
      const res = await patchProfile(jsonReq({ payoutUpi: bad }));
      expect(res.status, `"${bad}" should be rejected`).toBe(400);
      expect(prismaMock.companion.update).not.toHaveBeenCalled();
    }
  });

  it('accepts a valid UPI id and lower-cases it', async () => {
    const res = await patchProfile(jsonReq({ payoutUpi: 'Samarth.B@OkAxis' }));
    expect(res.status).toBe(200);
    expect(prismaMock.companion.update.mock.calls[0][0].data.payoutUpi).toBe('samarth.b@okaxis');
  });

  it('an empty UPI string clears the payout method', async () => {
    await patchProfile(jsonReq({ payoutUpi: '' }));
    expect(prismaMock.companion.update.mock.calls[0][0].data.payoutUpi).toBeNull();
  });

  it('rejects a bio too short to tell a member anything', async () => {
    expect((await patchProfile(jsonReq({ bio: 'hi' }))).status).toBe(400);
  });
});
