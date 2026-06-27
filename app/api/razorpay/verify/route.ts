// app/api/razorpay/verify/route.ts
//
// POST /api/razorpay/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Client-side payment callback. Verifies the HMAC signature
// (order_id|payment_id, keyed by RAZORPAY_KEY_SECRET) before settling.
//
// Returns 503 until RAZORPAY_KEY_SECRET is provided, 400 on a bad signature.

import { z } from 'zod';
import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

const verifyBody = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    // Throttle signature-verification attempts (defends the HMAC check itself).
    const rl = await rateLimit({ key: clientKey(req, 'rzp-verify'), limit: 30, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return json({ error: 'razorpay_not_configured' }, 503);

    const parsed = verifyBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    const { hmac, safeEqual, settlePurchase } = await import('@/lib/server/payments');
    const expected = hmac(`${razorpay_order_id}|${razorpay_payment_id}`, secret);
    if (!safeEqual(expected, razorpay_signature)) {
      return json({ error: 'invalid_signature' }, 400);
    }

    const { prisma } = await import('@/lib/prisma');

    // The verified order MUST belong to the requesting user. Without this, a
    // signed callback could settle another user's order. The webhook path
    // (server-to-server, no session) intentionally settles unscoped.
    const owned = await prisma.purchase.findFirst({
      where: { razorpayOrderId: razorpay_order_id, userId },
      select: { id: true },
    });
    if (!owned) return json({ error: 'not_found' }, 404);

    const result = await settlePurchase(prisma, {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    // Receipt email on first settle only (dormant without RESEND_API_KEY).
    const { notifyPurchaseSettled } = await import('@/lib/server/notify');
    await notifyPurchaseSettled(prisma, razorpay_order_id, result);

    return json({ ok: true, ...result });
  });
}
