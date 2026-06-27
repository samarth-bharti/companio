// app/api/wallet/decrement/route.ts
//
// POST /api/wallet/decrement  {}
// Spends one meeting credit (credits -1, used +1) if any remain, and logs it.
// No-op when the balance is already 0 — returns the wallet unchanged.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { prisma } = await import('@/lib/prisma');
  const { toWallet } = await import('@/lib/server/serialize');
  const wallet = await prisma.$transaction(async (tx) => {
    const w = await tx.wallet.upsert({ where: { userId }, update: {}, create: { userId } });
    // Atomic guard: the `credits > 0` check lives INSIDE the write. A prior
    // read-then-update let two concurrent requests both pass the check and
    // double-spend into a negative balance; updateMany makes it one statement.
    const res = await tx.wallet.updateMany({
      where: { userId, credits: { gt: 0 } },
      data: { credits: { decrement: 1 }, used: { increment: 1 } },
    });
    if (res.count === 0) return w; // nothing to spend — return unchanged
    await tx.creditLedger.create({ data: { walletId: w.id, delta: -1, kind: 'spend' } });
    return tx.wallet.findUniqueOrThrow({ where: { userId } });
  });
  return json(toWallet(wallet));
}
