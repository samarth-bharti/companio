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
  spinOdds,
  SPIN_EXPIRY_MS,
  FREE_VISIT_CREDITS,
} from '@/lib/server/spin';
import { TX } from '@/lib/server/tx';

export const dynamic = 'force-dynamic';

/** Lifetime = a paid pass with no expiry. See lib/money.ts#nextPassExpiry. */
function hasLifetime(u: { unlocked: boolean; unlockedUntil: Date | null } | null): boolean {
  return !!u?.unlocked && u.unlockedUntil === null;
}

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastSpinAt: true, unlocked: true, unlockedUntil: true },
    });
    const reward = await prisma.spinResult.findFirst({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() }, discountPct: { gt: 0 } },
      orderBy: { discountPct: 'desc' },
      select: { prize: true, discountPct: true, expiresAt: true },
    });

    const last = user?.lastSpinAt ?? null;
    return json({
      canSpin: canSpin(last, new Date()),
      nextSpinAt: nextSpinAt(last),
      reward,
      // A win discounts the pass. A TIMED pass can be renewed or upgraded, so a
      // discount stays spendable for as long as one can lapse — which is why
      // this is no longer keyed on `unlocked`. Only a LIFETIME holder has
      // genuinely nothing left to buy: meetups are not purchasable (the RBI
      // aggregator gate), so a discount could never be redeemed against
      // anything. We refuse their spin rather than let them repeat a weekly
      // ritual that cannot pay out — that is the exact trick this wheel used to
      // play on everybody.
      nothingToWin: hasLifetime(user),
      odds: spinOdds(),
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
      const u = await tx.user.findUnique({
        where: { id: userId },
        select: { lastSpinAt: true, unlocked: true, unlockedUntil: true },
      });
      const now = new Date();
      // Refused on the server, not merely hidden in the UI: a lifetime holder
      // has nothing a discount could apply to, and spending their weekly spin on
      // an unspendable prize is the exact trick this wheel was doing to
      // everybody.
      if (hasLifetime(u)) {
        return { nothingToWin: true as const };
      }
      if (!canSpin(u?.lastSpinAt ?? null, now)) {
        return { cooldown: true as const, nextSpinAt: nextSpinAt(u?.lastSpinAt ?? null) };
      }
      await tx.user.update({ where: { id: userId }, data: { lastSpinAt: now } });

      // A free visit is granted HERE, not held as a redeemable coupon. It is not
      // a discount on a purchase — it is a credit — so there is no later
      // checkout to burn it against, and leaving it unused-but-pending would
      // make bestSpin() offer a 0% "discount" forever. Stamped used at birth for
      // the same reason.
      const isFreeVisit = prize.prize === 'free_visit';
      const spin = await tx.spinResult.create({
        data: {
          userId,
          prize: prize.prize,
          discountPct: prize.discountPct,
          expiresAt: new Date(now.getTime() + SPIN_EXPIRY_MS),
          usedAt: isFreeVisit ? now : null,
        },
        select: { id: true, prize: true, discountPct: true, expiresAt: true },
      });
      if (isFreeVisit) {
        const w = await tx.wallet.upsert({
          where: { userId },
          update: { credits: { increment: FREE_VISIT_CREDITS } },
          create: { userId, credits: 1 + FREE_VISIT_CREDITS },
        });
        await tx.creditLedger.create({
          data: { walletId: w.id, delta: FREE_VISIT_CREDITS, kind: 'topup', note: `spin ${spin.id}` },
        });
      }
      return { cooldown: false as const, spin };
    }, TX);

    if ('nothingToWin' in result) {
      return json({ error: 'nothing_to_win' }, 409);
    }
    if (result.cooldown) {
      return json({ error: 'cooldown', nextSpinAt: result.nextSpinAt }, 429);
    }
    return json({ result: result.spin, label: prize.label });
  });
}
