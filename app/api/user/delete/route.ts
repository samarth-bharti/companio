// app/api/user/delete/route.ts
//
// POST /api/user/delete  — DPDP / GDPR right to erasure.
// Permanently deletes the signed-in user and ALL their data inside a single
// transaction. Child rows that lack onDelete:Cascade are removed explicitly
// before the user row to avoid FK constraint violations.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    // Account erasure is irreversible — keep the request rate very low.
    const rl = await rateLimit({ key: clientKey(req, 'account-delete'), limit: 3, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const { prisma } = await import('@/lib/prisma');

    await prisma.$transaction(async (tx) => {
      // 1. CreditLedger — child of Wallet (Cascade from Wallet, but Wallet
      //    must go before User, so delete ledger first to be explicit)
      await tx.creditLedger.deleteMany({
        where: { wallet: { userId } },
      });

      // 2. Wallet — has onDelete:Cascade from User; explicit for safety
      await tx.wallet.deleteMany({ where: { userId } });

      // 3. Purchase — has onDelete:Cascade from User; explicit for safety
      await tx.purchase.deleteMany({ where: { userId } });

      // 4–9. Relations with no cascade (would raise FK error if user deleted first)
      await tx.booking.deleteMany({ where: { userId } });
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.message.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.subscription.deleteMany({ where: { userId } });
      await tx.companionApplication.deleteMany({ where: { userId } });

      // 10. User — must be last
      await tx.user.delete({ where: { id: userId } });
    });

    return json({ ok: true });
  });
}
