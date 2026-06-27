// app/api/subscription/route.ts
//
// GET  /api/subscription → Plan ('plus' | null)
// POST /api/subscription { plan } → 'plus' starts/keeps a subscription, null cancels

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { planBody } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { prisma } = await import('@/lib/prisma');
    const sub = await prisma.subscription.findUnique({ where: { userId } });
    return json(sub ? 'plus' : null);
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const parsed = planBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    if (parsed.data.plan === 'plus') {
      // Activating Plus is a PAID benefit — granted ONLY by settlePurchase()
      // after a verified payment (create-order kind=plus). Cancelling stays
      // self-service below.
      return json(
        { error: 'use_checkout', detail: 'Plus is granted via /api/razorpay/create-order (kind=plus).' },
        403,
      );
    }
    const { prisma } = await import('@/lib/prisma');
    await prisma.subscription.deleteMany({ where: { userId } });
    return json({ ok: true });
  });
}
