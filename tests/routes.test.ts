import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the two external dependencies every user route relies on. The handlers
// import getSessionUserId statically and Prisma lazily — vi.mock intercepts both.
const { sessionMock, prismaMock } = vi.hoisted(() => ({
  sessionMock: vi.fn<() => Promise<string | null>>(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaMock: {} as any,
}));
vi.mock('@/lib/server/session', () => ({ getSessionUserId: sessionMock }));
vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }));

import { GET as walletGet } from '@/app/api/wallet/route';
import { POST as addCredits } from '@/app/api/wallet/add-credits/route';
import { POST as decrement } from '@/app/api/wallet/decrement/route';
import { GET as bookingsGet, POST as bookingsPost } from '@/app/api/bookings/route';
import { POST as bookingPatch } from '@/app/api/bookings/[id]/route';
import { POST as favToggle } from '@/app/api/favorites/toggle/route';
import { POST as subPost } from '@/app/api/subscription/route';
import { POST as msgPost } from '@/app/api/messages/[companionId]/route';
import { GET as messagesGet } from '@/app/api/messages/route';
import { POST as notifsRead } from '@/app/api/notifications/read/route';
import { POST as applicationPost } from '@/app/api/application/route';
import { POST as createOrder } from '@/app/api/razorpay/create-order/route';
import { POST as verifyPayment } from '@/app/api/razorpay/verify/route';
import { hmac } from '@/lib/server/payments';

function jsonReq(body?: unknown) {
  return new Request('http://test/api', {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function getReq(url = 'http://test/api') {
  return new Request(url, { method: 'GET' });
}

const pBooking = {
  id: 'b1', userId: 'u1', companionId: 'ananya', activity: 'Walk', dateISO: '2026-06-15',
  time: 'AM', place: 'Bandra', status: 'upcoming', usedCredit: false, pricePaid: 49900,
  review: null, razorpayOrderId: null, razorpayPaymentId: null,
  createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue('u1');
  prismaMock.wallet = { upsert: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), findUnique: vi.fn() };
  prismaMock.creditLedger = { create: vi.fn() };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prismaMock.$transaction = vi.fn(async (fn: any) => fn(prismaMock));
  prismaMock.booking = { findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn() };
  prismaMock.favorite = { findUnique: vi.fn(), delete: vi.fn(), create: vi.fn(), findMany: vi.fn() };
  prismaMock.subscription = { upsert: vi.fn(), deleteMany: vi.fn() };
  prismaMock.message = { create: vi.fn(), findMany: vi.fn() };
  prismaMock.notification = { updateMany: vi.fn() };
  prismaMock.purchase = { findFirst: vi.fn(), create: vi.fn() };
  prismaMock.companionApplication = { upsert: vi.fn(), findUnique: vi.fn() };
  // Moderation gates: routes now confirm the companion is visible and that the
  // sender isn't message-blocked before writing. Default both to "allowed", so
  // each test opts INTO the blocked case rather than every test having to opt out.
  prismaMock.companion = { findFirst: vi.fn().mockResolvedValue({ id: 'ananya' }) };
  // Booking and companion applications also read dateOfBirth (18+ gate). Default
  // to a comfortably adult DOB so each test opts INTO the underage case.
  prismaMock.user = {
    findUnique: vi.fn().mockResolvedValue({
      messageBlocked: false,
      dateOfBirth: new Date('1995-01-01'),
    }),
  };
});

afterEach(() => {
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.MARKETPLACE_PAYMENTS_ENABLED;
});

describe('wallet', () => {
  it('GET 401 without a session', async () => {
    sessionMock.mockResolvedValue(null);
    expect((await walletGet()).status).toBe(401);
  });

  it('GET returns the balance', async () => {
    prismaMock.wallet.upsert.mockResolvedValue({ credits: 2, used: 0 });
    const res = await walletGet();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ credits: 2, used: 0 });
  });

  it('add-credits is refused (403) — credits come from payment settlement', async () => {
    const res = await addCredits();
    expect(res.status).toBe(403);
    expect(prismaMock.creditLedger.create).not.toHaveBeenCalled();
  });

  it('add-credits is 401 without a session', async () => {
    sessionMock.mockResolvedValue(null);
    expect((await addCredits()).status).toBe(401);
  });

  it('decrement is a no-op at zero balance (atomic guard matches no row)', async () => {
    prismaMock.wallet.upsert.mockResolvedValue({ id: 'w1', credits: 0, used: 2 });
    prismaMock.wallet.updateMany.mockResolvedValue({ count: 0 });
    const res = await decrement();
    expect(await res.json()).toEqual({ credits: 0, used: 2 });
    expect(prismaMock.creditLedger.create).not.toHaveBeenCalled();
  });

  it('decrement spends a credit when available', async () => {
    prismaMock.wallet.upsert.mockResolvedValue({ id: 'w1', credits: 2, used: 0 });
    prismaMock.wallet.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.wallet.findUniqueOrThrow.mockResolvedValue({ credits: 1, used: 1 });
    const res = await decrement();
    expect(await res.json()).toEqual({ credits: 1, used: 1 });
    expect(prismaMock.creditLedger.create).toHaveBeenCalledOnce();
  });
});

describe('bookings', () => {
  it('GET maps rows to the frontend shape', async () => {
    prismaMock.booking.findMany.mockResolvedValue([pBooking]);
    const res = await bookingsGet(getReq());
    const body = await res.json();
    expect(body[0].createdAt).toBe(pBooking.createdAt.getTime());
    expect(body[0].review).toBeUndefined();
  });

  it('GET clamps limit=200 to take=100', async () => {
    prismaMock.booking.findMany.mockResolvedValue([]);
    await bookingsGet(getReq('http://test/api/bookings?limit=200'));
    expect(prismaMock.booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 }),
    );
  });

  it('POST rejects a bad body', async () => {
    expect((await bookingsPost(jsonReq({ companionId: 'a' }))).status).toBe(400);
  });

  it('POST creates and returns the booking (non-credit path)', async () => {
    prismaMock.booking.create.mockResolvedValue(pBooking);
    const res = await bookingsPost(jsonReq({
      companionId: 'ananya', activity: 'Walk', dateISO: '2026-06-15',
      time: 'AM', place: 'Bandra', usedCredit: false,
    }));
    expect(res.status).toBe(200);
    // pricePaid is always 0 at creation; server-computed later via create-order.
    // A cash booking is created UNCONFIRMED (pending_payment) — it must not be a
    // live meetup until Razorpay settlement promotes it (closes the free-booking hole).
    expect(prismaMock.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pricePaid: 0, usedCredit: false, status: 'pending_payment' }),
      }),
    );
  });

  it('POST rejects a malformed dateISO with 400', async () => {
    const res = await bookingsPost(jsonReq({
      companionId: 'ananya', activity: 'Walk', dateISO: '15/06/2026',
      time: 'AM', place: 'Bandra', usedCredit: false,
    }));
    expect(res.status).toBe(400);
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  // Companio is 18+. The register wizard checks this in the browser and used to
  // throw the date away; Google OAuth never supplies one. The server checks now.
  it('POST refuses a booking when we have never asked for a date of birth (403)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ dateOfBirth: null });
    const res = await bookingsPost(jsonReq({
      companionId: 'ananya', activity: 'Walk', dateISO: '2026-06-15',
      time: 'Morning', place: 'Cafe', usedCredit: true,
    }));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'age_verification_required' });
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
    expect(prismaMock.wallet.updateMany).not.toHaveBeenCalled();
  });

  it('POST refuses a booking from someone under 18 (403)', async () => {
    const sixteen = new Date();
    sixteen.setFullYear(sixteen.getFullYear() - 16);
    prismaMock.user.findUnique.mockResolvedValue({ dateOfBirth: sixteen });
    const res = await bookingsPost(jsonReq({
      companionId: 'ananya', activity: 'Walk', dateISO: '2026-06-15',
      time: 'Morning', place: 'Cafe', usedCredit: true,
    }));
    expect(res.status).toBe(403);
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it('POST refuses a suspended companion (404) before spending a credit', async () => {
    prismaMock.companion.findFirst.mockResolvedValue(null); // filtered by VISIBLE_COMPANION
    const res = await bookingsPost(jsonReq({
      companionId: 'ananya', activity: 'Walk', dateISO: '2026-06-15',
      time: 'Morning', place: 'Cafe', usedCredit: true,
    }));
    expect(res.status).toBe(404);
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
    // The credit must survive a rejected booking.
    expect(prismaMock.wallet.updateMany).not.toHaveBeenCalled();
  });

  it('POST credit path 402 when wallet is empty', async () => {
    prismaMock.wallet.updateMany.mockResolvedValue({ count: 0 });
    const res = await bookingsPost(jsonReq({
      companionId: 'ananya', activity: 'Walk', dateISO: '2026-06-15',
      time: 'AM', place: 'Bandra', usedCredit: true,
    }));
    expect(res.status).toBe(402);
    expect(prismaMock.booking.create).not.toHaveBeenCalled();
  });

  it('POST credit path creates booking when wallet has credits', async () => {
    prismaMock.wallet.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1' });
    prismaMock.creditLedger.create.mockResolvedValue({});
    prismaMock.booking.create.mockResolvedValue({ ...pBooking, usedCredit: true, pricePaid: 0 });
    const res = await bookingsPost(jsonReq({
      companionId: 'ananya', activity: 'Walk', dateISO: '2026-06-15',
      time: 'AM', place: 'Bandra', usedCredit: true,
    }));
    expect(res.status).toBe(200);
    expect(prismaMock.wallet.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ credits: { gt: 0 } }) }),
    );
    expect(prismaMock.creditLedger.create).toHaveBeenCalledOnce();
    expect(prismaMock.booking.create).toHaveBeenCalledOnce();
  });

  it('PATCH returns 400 for client-forbidden status=completed', async () => {
    const res = await bookingPatch(jsonReq({ status: 'completed' }), { params: Promise.resolve({ id: 'b1' }) });
    expect(res.status).toBe(400);
    expect(prismaMock.booking.updateMany).not.toHaveBeenCalled();
  });

  it('PATCH returns 404 when no owned row matched (IDOR guard)', async () => {
    prismaMock.booking.updateMany.mockResolvedValue({ count: 0 });
    const res = await bookingPatch(jsonReq({ status: 'cancelled' }), { params: Promise.resolve({ id: 'x' }) });
    expect(res.status).toBe(404);
  });

  it('PATCH succeeds cancellation when a row matched', async () => {
    // The cancel guard pre-fetches the booking: an upcoming, unpaid booking is
    // cancellable.
    prismaMock.booking.findFirst.mockResolvedValue({ status: 'upcoming', razorpayPaymentId: null });
    prismaMock.booking.updateMany.mockResolvedValue({ count: 1 });
    const res = await bookingPatch(jsonReq({ status: 'cancelled' }), { params: Promise.resolve({ id: 'b1' }) });
    expect(res.status).toBe(200);
  });

  it('PATCH cancellation is 409 on an already-completed booking', async () => {
    prismaMock.booking.findFirst.mockResolvedValue({ status: 'completed', razorpayPaymentId: null });
    const res = await bookingPatch(jsonReq({ status: 'cancelled' }), { params: Promise.resolve({ id: 'b1' }) });
    expect(res.status).toBe(409);
    expect(prismaMock.booking.updateMany).not.toHaveBeenCalled();
  });

  it('PATCH cancellation of a paid booking is 409 (no refund flow yet)', async () => {
    prismaMock.booking.findFirst.mockResolvedValue({ status: 'upcoming', razorpayPaymentId: 'pay_1' });
    const res = await bookingPatch(jsonReq({ status: 'cancelled' }), { params: Promise.resolve({ id: 'b1' }) });
    expect(res.status).toBe(409);
    expect(prismaMock.booking.updateMany).not.toHaveBeenCalled();
  });

  it('PATCH review is 403 on an unpaid/incomplete booking', async () => {
    prismaMock.booking.findFirst.mockResolvedValue({ status: 'upcoming', razorpayPaymentId: null, usedCredit: false });
    const res = await bookingPatch(
      jsonReq({ review: { stars: 5, text: 'great' } }),
      { params: Promise.resolve({ id: 'b1' }) },
    );
    expect(res.status).toBe(403);
    expect(prismaMock.booking.updateMany).not.toHaveBeenCalled();
  });

  it('PATCH review is accepted on a completed+paid booking', async () => {
    prismaMock.booking.findFirst.mockResolvedValue({ status: 'completed', razorpayPaymentId: 'pay_1', usedCredit: false });
    prismaMock.booking.updateMany.mockResolvedValue({ count: 1 });
    const res = await bookingPatch(
      jsonReq({ review: { stars: 5, text: 'great' } }),
      { params: Promise.resolve({ id: 'b1' }) },
    );
    expect(res.status).toBe(200);
  });

  it('PATCH review is accepted on a completed credit booking', async () => {
    prismaMock.booking.findFirst.mockResolvedValue({ status: 'completed', razorpayPaymentId: null, usedCredit: true });
    prismaMock.booking.updateMany.mockResolvedValue({ count: 1 });
    const res = await bookingPatch(
      jsonReq({ review: { stars: 4, text: 'nice' } }),
      { params: Promise.resolve({ id: 'b1' }) },
    );
    expect(res.status).toBe(200);
  });
});

describe('favorites toggle', () => {
  it('adds when absent', async () => {
    prismaMock.favorite.findUnique.mockResolvedValue(null);
    prismaMock.favorite.findMany.mockResolvedValue([{ companionId: 'ananya' }]);
    const res = await favToggle(jsonReq({ companionId: 'ananya' }));
    expect(await res.json()).toEqual(['ananya']);
    expect(prismaMock.favorite.create).toHaveBeenCalledOnce();
    expect(prismaMock.favorite.delete).not.toHaveBeenCalled();
  });

  it('removes when present', async () => {
    prismaMock.favorite.findUnique.mockResolvedValue({ userId: 'u1', companionId: 'ananya' });
    prismaMock.favorite.findMany.mockResolvedValue([]);
    const res = await favToggle(jsonReq({ companionId: 'ananya' }));
    expect(await res.json()).toEqual([]);
    expect(prismaMock.favorite.delete).toHaveBeenCalledOnce();
  });
});

describe('subscription', () => {
  it('plus is refused (403) — Plus is granted via payment settlement', async () => {
    const res = await subPost(jsonReq({ plan: 'plus' }));
    expect(res.status).toBe(403);
    expect(prismaMock.subscription.upsert).not.toHaveBeenCalled();
  });

  it('null cancels the subscription', async () => {
    const res = await subPost(jsonReq({ plan: null }));
    expect(res.status).toBe(200);
    expect(prismaMock.subscription.deleteMany).toHaveBeenCalledOnce();
  });
});

describe('messages', () => {
  it('POST rejects an invalid "from"', async () => {
    const res = await msgPost(jsonReq({ from: 'bot', text: 'hi' }), { params: Promise.resolve({ companionId: 'ananya' }) });
    expect(res.status).toBe(400);
  });

  it('POST appends and serializes ts to a number', async () => {
    prismaMock.message.create.mockResolvedValue({ id: 'm1', from: 'me', text: 'hi', ts: BigInt(1700000000000) });
    const res = await msgPost(jsonReq({ from: 'me', text: 'hi' }), { params: Promise.resolve({ companionId: 'ananya' }) });
    expect(res.status).toBe(200);
    expect((await res.json()).ts).toBe(1700000000000);
  });

  // Moderation is only real if a query reads the flag. These pin that.
  it('POST is refused (403) when the sender is message-blocked', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ messageBlocked: true });
    const res = await msgPost(jsonReq({ from: 'me', text: 'hi' }), { params: Promise.resolve({ companionId: 'ananya' }) });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ error: 'messaging_blocked' });
    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });

  it('POST is refused (404) when the companion is suspended or banned', async () => {
    prismaMock.companion.findFirst.mockResolvedValue(null); // filtered by VISIBLE_COMPANION
    const res = await msgPost(jsonReq({ from: 'me', text: 'hi' }), { params: Promise.resolve({ companionId: 'ananya' }) });
    expect(res.status).toBe(404);
    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });

  it('GET /api/messages groups all threads by companion (ts serialized)', async () => {
    prismaMock.message.findMany.mockResolvedValue([
      { id: 'm1', companionId: 'ananya', from: 'me', text: 'hi', ts: BigInt(1) },
      { id: 'm2', companionId: 'ananya', from: 'them', text: 'yo', ts: BigInt(2) },
      { id: 'm3', companionId: 'rohan', from: 'me', text: 'sup', ts: BigInt(3) },
    ]);
    const body = await (await messagesGet()).json();
    expect(Object.keys(body).sort()).toEqual(['ananya', 'rohan']);
    expect(body.ananya).toHaveLength(2);
    expect(body.ananya[0].ts).toBe(1);
  });

  it('GET /api/messages is 401 without a session', async () => {
    sessionMock.mockResolvedValue(null);
    expect((await messagesGet()).status).toBe(401);
  });
});

describe('notifications read', () => {
  it('POST marks all unread notifications read', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 3 });
    const res = await notifsRead();
    expect(res.status).toBe(200);
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', read: false },
      data: { read: true },
    });
  });

  it('POST is 401 without a session', async () => {
    sessionMock.mockResolvedValue(null);
    expect((await notifsRead()).status).toBe(401);
  });
});

describe('application (server-controlled status)', () => {
  const fullApp = {
    name: 'A', city: 'mumbai', activities: ['Walk'], rate: 49900,
    bio: 'hi', idUploaded: true, backgroundConsent: true,
  };

  it('seeds status=draft on create and never sets it on update', async () => {
    prismaMock.companionApplication.upsert.mockResolvedValue({});
    await applicationPost(jsonReq({ ...fullApp, status: 'draft' }));
    const arg = prismaMock.companionApplication.upsert.mock.calls[0][0];
    expect(arg.create.status).toBe('draft');
    expect(arg.update.status).toBeUndefined();
  });

  it('preserves submitted on create when the user submits', async () => {
    prismaMock.companionApplication.upsert.mockResolvedValue({});
    await applicationPost(jsonReq({ ...fullApp, status: 'submitted' }));
    const arg = prismaMock.companionApplication.upsert.mock.calls[0][0];
    expect(arg.create.status).toBe('submitted');
  });

  it('rejects a privileged status at validation (400, no DB write)', async () => {
    const res = await applicationPost(jsonReq({ ...fullApp, status: 'approved' }));
    expect(res.status).toBe(400);
    expect(prismaMock.companionApplication.upsert).not.toHaveBeenCalled();
  });
});

describe('razorpay (payment authorization)', () => {
  it('create-order is 401 without a session', async () => {
    sessionMock.mockResolvedValue(null);
    expect((await createOrder(jsonReq({ kind: 'unlock' }))).status).toBe(401);
  });

  it('create-order is 503 without keys', async () => {
    const res = await createOrder(jsonReq({ kind: 'unlock' }));
    expect(res.status).toBe(503);
  });

  // ── Marketplace gate ──────────────────────────────────────────────────────
  // booking/credits/plus all end with Companio owing money to a companion, which
  // needs an RBI Payment Aggregator licence. Supplying a Razorpay key must not
  // silently arm them. Only 'unlock' may be charged until the gate is opened.

  it.each(['booking', 'credits', 'plus'] as const)(
    'create-order refuses kind=%s (503) while MARKETPLACE_PAYMENTS_ENABLED is unset',
    async (kind) => {
      process.env.RAZORPAY_KEY_ID = 'k';
      process.env.RAZORPAY_KEY_SECRET = 's';
      const res = await createOrder(jsonReq({ kind, packId: 'pack5', bookingId: 'b1' }));
      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({ error: 'purchase_kind_disabled', kind });
    },
  );

  it('create-order rejects an unknown credit pack (400) once the gate is open', async () => {
    process.env.RAZORPAY_KEY_ID = 'k';
    process.env.RAZORPAY_KEY_SECRET = 's';
    process.env.MARKETPLACE_PAYMENTS_ENABLED = 'true';
    const res = await createOrder(jsonReq({ kind: 'credits', packId: 'nope' }));
    expect(res.status).toBe(400);
  });

  it('verify is 503 without a secret', async () => {
    const res = await verifyPayment(jsonReq({
      razorpay_order_id: 'o', razorpay_payment_id: 'p', razorpay_signature: 'x',
    }));
    expect(res.status).toBe(503);
  });

  it('verify 404s when the order is not owned by the user', async () => {
    process.env.RAZORPAY_KEY_SECRET = 's';
    const sig = hmac('o1|p1', 's');
    prismaMock.purchase.findFirst.mockResolvedValue(null);
    const res = await verifyPayment(jsonReq({
      razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: sig,
    }));
    expect(res.status).toBe(404);
  });
});
