// app/api/notifications/read/route.ts
//
// POST /api/notifications/read → mark all of the signed-in user's unread
// notifications as read. Mirrors markNotificationsRead() in lib/appState.
// No request body — it's an idempotent "mark everything read" action.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function POST() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { prisma } = await import('@/lib/prisma');
    const res = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return json({ ok: true, updated: res.count });
  });
}
