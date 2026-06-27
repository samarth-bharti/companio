// app/api/notifications/route.ts
//
// GET  /api/notifications → AppNotification[]  (newest first)
// POST /api/notifications { title, body } → create one (unread)

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard, parsePagination } from '@/lib/server/http';
import { notificationBody } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { take, skip } = parsePagination(req);
    const { prisma } = await import('@/lib/prisma');
    const { toNotification } = await import('@/lib/server/serialize');
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return json(rows.map(toNotification));
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const parsed = notificationBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { prisma } = await import('@/lib/prisma');
    await prisma.notification.create({
      data: {
        userId,
        title: parsed.data.title,
        body: parsed.data.body,
        ts: BigInt(Date.now()),
      },
    });
    return json({ ok: true });
  });
}
