// app/api/companion/earnings/route.ts
//
// GET /api/companion/earnings → the signed-in companion's own earnings summary.
// Resolves the caller's Companion profile via User.companionId, so a companion
// can only ever see their own numbers. 403 for accounts that aren't companions.
//
// Inert (401) until auth + DATABASE_URL are configured.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { prisma } = await import('@/lib/prisma');
    const { getCompanionIdForUser, getCompanionEarnings } = await import('@/lib/server/companion');

    const companionId = await getCompanionIdForUser(prisma, userId);
    if (!companionId) return json({ error: 'not_a_companion' }, 403);

    const earnings = await getCompanionEarnings(prisma, companionId);
    return json({ companionId, ...earnings });
  });
}
