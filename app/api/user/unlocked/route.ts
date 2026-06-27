// app/api/user/unlocked/route.ts
//
// GET  /api/user/unlocked → boolean  (has the user paid the full-unlock?)
// POST is refused: the full-unlock flag is a PAID benefit, flipped ONLY by
// settlePurchase() after a verified Razorpay payment (create-order kind=unlock).
// A client-writable setter here would be a payment bypass.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { prisma } = await import('@/lib/prisma');
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { unlocked: true } });
    return json(u?.unlocked ?? false);
  });
}

export async function POST() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    return json(
      { error: 'use_checkout', detail: 'Full unlock is granted via /api/razorpay/create-order (kind=unlock).' },
      403,
    );
  });
}
