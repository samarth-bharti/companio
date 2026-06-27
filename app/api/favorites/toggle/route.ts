// app/api/favorites/toggle/route.ts
//
// POST /api/favorites/toggle { companionId } → add if absent, remove if present.
// Returns the full updated id list so the client can replace its state.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { favoriteToggleBody } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const parsed = favoriteToggleBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { companionId } = parsed.data;
    const { prisma } = await import('@/lib/prisma');
    const key = { userId_companionId: { userId, companionId } };
    const existing = await prisma.favorite.findUnique({ where: key });
    if (existing) {
      await prisma.favorite.delete({ where: key });
    } else {
      await prisma.favorite.create({ data: { userId, companionId } });
    }
    const rows = await prisma.favorite.findMany({
      where: { userId },
      select: { companionId: true },
      orderBy: { createdAt: 'desc' },
    });
    return json(rows.map((r) => r.companionId));
  });
}
