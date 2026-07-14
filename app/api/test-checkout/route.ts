// app/api/test-checkout/route.ts
//
// GET  /api/test-checkout → { enabled }
// POST /api/test-checkout { kind } → grants the purchase without taking money
//
// ─────────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
//
// The ₹199 unlock is the only thing Companio sells, and until Razorpay keys land
// there is no way to click through it — so the single most important flow in the
// product cannot be tested by a human. This closes that gap, and closes itself
// the moment the keys arrive.
//
// WHAT MAKES IT SAFE
//
// It cannot run when Razorpay is live. `RAZORPAY_KEY_ID` being present is an
// automatic, unconditional refusal — so on the day the real keys are pasted in,
// this endpoint stops working with no code change and no flag to remember. That
// ordering matters: a test door that has to be manually locked is a test door
// that is eventually left open.
//
// It is also off by default, and must be switched on deliberately with
// ALLOW_TEST_CHECKOUT=true. Both conditions, every request.
//
// It grants the benefit by calling settlePurchase() — the same function the real
// Razorpay webhook calls. It does not have its own idea of what an unlock means,
// so a benefit that is right here is right in production, and the RBI gate on
// which kinds may be sold applies exactly as it does to real money.

import { randomUUID } from 'node:crypto';
import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, guard, readJsonBody } from '@/lib/server/http';
import { envValue } from '@/lib/env';
import { isPurchaseKindEnabled, UNLOCK_AMOUNT, type PurchaseKind } from '@/lib/server/pricing';

export const dynamic = 'force-dynamic';

/**
 * Live payments win, always. A deployment that can take real money must never
 * also offer a door that hands the same goods out for free.
 */
export function testCheckoutEnabled(): boolean {
  if (envValue('RAZORPAY_KEY_ID')) return false;
  return envValue('ALLOW_TEST_CHECKOUT') === 'true';
}

export function GET() {
  return json({ enabled: testCheckoutEnabled() });
}

export async function POST(req: Request) {
  return guard(async () => {
    if (!testCheckoutEnabled()) {
      return json({ error: 'test_checkout_disabled' }, 403);
    }

    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const body = (await readJsonBody(req)) as { kind?: string } | null;
    const kind = body?.kind as PurchaseKind | undefined;
    if (kind !== 'unlock') {
      // v1 sells exactly one thing. Anything else would be pooling money owed to
      // a companion, which is the payment-aggregator licence Companio does not
      // hold — and a test door is not an excuse to pretend otherwise.
      return badRequest({ kind: ['only "unlock" can be purchased'] });
    }
    if (!isPurchaseKindEnabled(kind)) {
      return json({ error: 'purchase_kind_disabled' }, 409);
    }

    const { prisma } = await import('@/lib/prisma');
    const { settlePurchase } = await import('@/lib/server/payments');

    // Already unlocked: say so rather than writing a second purchase row.
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { unlocked: true },
    });
    if (me?.unlocked) return json({ ok: true, alreadyUnlocked: true });

    // The ids are prefixed so a test purchase is obvious in the database and in
    // any export — nobody should have to guess whether ₹199 actually arrived.
    const orderId = `test_order_${randomUUID()}`;
    const paymentId = `test_pay_${randomUUID()}`;

    await prisma.purchase.create({
      data: {
        userId,
        kind,
        amount: UNLOCK_AMOUNT,
        status: 'created',
        razorpayOrderId: orderId,
      },
    });

    const result = await settlePurchase(prisma, { orderId, paymentId });
    if (!result.settled) return json({ error: 'settle_failed', reason: result.reason }, 500);

    // The same notification the real webhook sends. This route exists to be a
    // faithful stand-in for a payment, and a payment the user is never told about
    // is not faithful — it is just a silent state change.
    const { notifyPurchaseSettled } = await import('@/lib/server/notify');
    await notifyPurchaseSettled(prisma, orderId, result);

    return json({ ok: true, kind, amount: UNLOCK_AMOUNT, test: true });
  });
}
