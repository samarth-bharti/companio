// app/api/razorpay/webhook/route.ts
//
// POST /api/razorpay/webhook  (server-to-server, NO session)
// Razorpay calls this. The x-razorpay-signature header (HMAC of the RAW body,
// keyed by RAZORPAY_WEBHOOK_SECRET) is the only auth. We must read the raw text
// — not parsed JSON — so the signature matches byte-for-byte.
//
// Returns 503 until RAZORPAY_WEBHOOK_SECRET is provided, 400 on a bad signature.

import { json, badRequest, guard } from '@/lib/server/http';
import { envValue } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return guard(async () => {
    // envValue(), not process.env: a placeholder like `[[paste secret]]` is a
    // truthy string, so a half-filled .env would arm this endpoint with a
    // secret that is public knowledge — letting anyone forge a signed
    // payment.captured event and settle a purchase they never paid for.
    const secret = envValue('RAZORPAY_WEBHOOK_SECRET');
    if (!secret) return json({ error: 'razorpay_not_configured' }, 503);

    const raw = await req.text();
    const signature = req.headers.get('x-razorpay-signature') ?? '';

    const { hmac, safeEqual, settlePurchase } = await import('@/lib/server/payments');
    if (!safeEqual(hmac(raw, secret), signature)) {
      return json({ error: 'invalid_signature' }, 400);
    }

    let event: unknown;
    try {
      event = JSON.parse(raw);
    } catch {
      return badRequest('invalid_json');
    }

    const e = event as {
      event?: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
    };
    if (e.event === 'payment.captured') {
      const entity = e.payload?.payment?.entity;
      if (entity?.order_id && entity?.id) {
        const { prisma } = await import('@/lib/prisma');
        const result = await settlePurchase(prisma, { orderId: entity.order_id, paymentId: entity.id });

        // Receipt email on first settle only (dormant without RESEND_API_KEY).
        const { notifyPurchaseSettled } = await import('@/lib/server/notify');
        await notifyPurchaseSettled(prisma, entity.order_id, result);
      }
    }

    // Always 200 on a valid signature so Razorpay stops retrying.
    return json({ ok: true });
  });
}
