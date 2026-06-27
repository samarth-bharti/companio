// app/api/wallet/route.ts
//
// GET /api/wallet — the signed-in user's credit balance.
// Creates the wallet (2 free starter credits) on first read.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const { prisma } = await import('@/lib/prisma');
  const { toWallet } = await import('@/lib/server/serialize');
  const wallet = await prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
  return json(toWallet(wallet));
}
