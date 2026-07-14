// app/api/discounts/validate/route.ts
//
// POST /api/discounts/validate { code } → what this code would do to the price.
//
// PREVIEW ONLY. It reserves nothing, spends nothing, and its answer is not
// trusted by anything: /api/razorpay/create-order looks the code up again and
// recomputes the amount from the database when the order is actually created. A
// client that lies to this endpoint, or replays its response, changes nothing.
//
// It exists so the unlock sheet can say "₹199 → ₹179" before the customer commits,
// instead of discovering at the gateway that their code was rejected.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, guard, readJsonBody } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { hasDatabase } from '@/lib/env';
import { UNLOCK_AMOUNT } from '@/lib/money';
import { resolveDiscount, discountFailureMessage } from '@/lib/server/discounts';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    if (!hasDatabase()) return json({ error: 'db_not_configured' }, 503);

    // A code field is a guessing surface: without a throttle it is an oracle for
    // brute-forcing whatever promo codes exist.
    const rl = await rateLimit({ key: clientKey(req, 'discount-check'), limit: 10, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const body = (await readJsonBody(req)) as { code?: unknown } | null;
    const raw = typeof body?.code === 'string' ? body.code : '';
    if (!raw.trim()) return badRequest({ code: ['A code is required.'] });
    if (raw.length > 32) return badRequest({ code: ['That is not a valid code.'] });

    const { prisma } = await import('@/lib/prisma');

    // v1 sells exactly one thing, so the base price is the unlock. When other
    // kinds become sellable this takes the kind and prices accordingly.
    const verdict = await resolveDiscount(prisma, raw, UNLOCK_AMOUNT);

    if (!verdict.ok) {
      // 200, not 4xx: "your code is wrong" is a normal answer to a normal
      // question, not a failed request, and the client renders the message either
      // way. Timing and status stay identical for a missing code and an inactive
      // one so neither can be distinguished.
      return json({ ok: false, message: discountFailureMessage(verdict.reason) });
    }

    return json({
      ok: true,
      code: verdict.code,
      basePaise: UNLOCK_AMOUNT,
      amountPaise: verdict.amountPaise,
      discountPaise: verdict.discountPaise,
    });
  });
}
