// app/api/messages/route.ts
//
// GET /api/messages → Record<companionId, ChatMessage[]>
// All of the signed-in user's threads, grouped by companion (oldest-first per
// thread). Mirrors getThreads() in lib/appState — used by the messages list.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';
import type { ChatMessage } from '@/lib/appState';

export const dynamic = 'force-dynamic';

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { prisma } = await import('@/lib/prisma');
    const { toMessage } = await import('@/lib/server/serialize');
    const rows = await prisma.message.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    const threads: Record<string, ChatMessage[]> = {};
    for (const r of rows) {
      (threads[r.companionId] ??= []).push(toMessage(r));
    }
    return json(threads);
  });
}
