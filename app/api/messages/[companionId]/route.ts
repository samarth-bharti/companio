// app/api/messages/[companionId]/route.ts
//
// GET  /api/messages/:companionId → ChatMessage[]  (one thread, oldest first)
// POST /api/messages/:companionId { from, text } → append a message

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard, parsePagination } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { messageAppendBody } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ companionId: string }> },
) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { companionId } = await params;
    const { take, skip } = parsePagination(req);
    const { prisma } = await import('@/lib/prisma');
    const { toMessage } = await import('@/lib/server/serialize');
    // Oldest-first so the client can render a conversation in chronological order.
    const rows = await prisma.message.findMany({
      where: { userId, companionId },
      orderBy: { createdAt: 'asc' },
      take,
      skip,
    });
    return json(rows.map(toMessage));
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companionId: string }> },
) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    // Throttle message sends to blunt spam / flooding.
    const rl = await rateLimit({ key: clientKey(req, 'msg-send'), limit: 30, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);
    const { companionId } = await params;
    const parsed = messageAppendBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { prisma } = await import('@/lib/prisma');
    const { toMessage } = await import('@/lib/server/serialize');
    const msg = await prisma.message.create({
      data: {
        threadId: `${userId}_${companionId}`,
        userId,
        companionId,
        from: parsed.data.from,
        text: parsed.data.text,
        ts: BigInt(Date.now()),
      },
    });
    return json(toMessage(msg));
  });
}
