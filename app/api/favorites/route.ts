// app/api/favorites/route.ts
//
// GET /api/favorites → string[]  (favorited companion ids, newest first)

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { prisma } = await import('@/lib/prisma');
    const rows = await prisma.favorite.findMany({
      where: { userId },
      select: { companionId: true },
      orderBy: { createdAt: 'desc' },
    });
    return json(rows.map((r) => r.companionId));
  });
}
