// app/api/companion/dashboard/route.ts
//
// GET /api/companion/dashboard → everything the companion dashboard renders.
// Resolves the caller's Companion profile via User.companionId, so a companion
// can only ever see their own numbers, their own bookings, and their own payout
// details. 403 for accounts that aren't companions.
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
    const { getCompanionIdForUser, getCompanionDashboard } = await import('@/lib/server/companion');

    const companionId = await getCompanionIdForUser(prisma, userId);
    if (!companionId) return json({ error: 'not_a_companion' }, 403);

    const dashboard = await getCompanionDashboard(prisma, companionId);
    // The account is linked to a profile that no longer exists — an admin
    // deleted it out from under them. Say so rather than rendering zeros.
    if (!dashboard) return json({ error: 'profile_missing' }, 404);

    return json(dashboard);
  });
}
