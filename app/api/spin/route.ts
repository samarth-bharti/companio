// app/api/spin/route.ts
//
// GET  /api/spin  → { canSpin, nextSpinAt, reward }  (reward = current redeemable win)
// POST /api/spin  → perform a weekly spin; the prize is drawn SERVER-SIDE and
//                   persisted. The client may only animate to a result it was
//                   handed — it can never choose its own prize.
//
// Inert (401) until auth + DATABASE_URL are configured, like every other route.

import crypto from 'crypto';
import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import {
  drawPrize,
  canSpin,
  nextSpinAt,
  SPIN_EXPIRY_MS,
} from '@/lib/server/spin';
import { TX } from '@/lib/server/tx';

export const dynamic = 'force-dynamic';

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSpinAt: true },
    });
    const reward = await prisma.spinResult.findFirst({
      where: { userId, usedBookingId: null, expiresAt: { gt: new Date() }, discountPct: { gt: 0 } },
      orderBy: { discountPct: 'desc' },
      select: { prize: true, discountPct: true, expiresAt: true },
    });

    const last = user?.lastSpinAt ?? null;
    return json({
      canSpin: canSpin(last, new Date()),
      nextSpinAt: nextSpinAt(last),
      reward,
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    // Cheap abuse guard on top of the weekly cooldown.
    const rl = await rateLimit({ key: clientKey(req, 'spin'), limit: 10, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const { prisma } = await import('@/lib/prisma');

    // Draw the prize SERVER-SIDE with a CSPRNG.
    const rnd = crypto.randomInt(0, 1_000_000) / 1_000_000;
    const prize = drawPrize(rnd);

    // Re-check eligibility and write atomically so a double-tap can't spin twice.
    const result = await prisma.$transaction(async (tx) => {
      const u = await tx.user.findUnique({ where: { id: userId }, select: { lastSpinAt: true } });
      const now = new Date();
      if (!canSpin(u?.lastSpinAt ?? null, now)) {
        return { cooldown: true as const, nextSpinAt: nextSpinAt(u?.lastSpinAt ?? null) };
      }
      await tx.user.update({ where: { id: userId }, data: { lastSpinAt: now } });
      const spin = await tx.spinResult.create({
        data: {
          userId,
          prize: prize.prize,
          discountPct: prize.discountPct,
          expiresAt: new Date(now.getTime() + SPIN_EXPIRY_MS),
        },
        select: { prize: true, discountPct: true, expiresAt: true },
      });
      return { cooldown: false as const, spin };
    }, TX);

    if (result.cooldown) {
      return json({ error: 'cooldown', nextSpinAt: result.nextSpinAt }, 429);
    }
    return json({ result: result.spin, label: prize.label });
  });
}
