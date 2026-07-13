// app/api/messages/[companionId]/react/route.ts
//
// POST /api/messages/:companionId/react { messageId, emoji } → ChatMessage[]
//
// Toggles one emoji reaction on one message and returns the whole thread, so
// the client renders the server's copy rather than patching its own.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, guard, readJsonBody } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { messageReactBody } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ companionId: string }> },
) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const rl = await rateLimit({ key: clientKey(req, 'msg-react'), limit: 60, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const { companionId } = await params;
    const parsed = messageReactBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { messageId, emoji } = parsed.data;

    const { prisma } = await import('@/lib/prisma');
    const { toMessage } = await import('@/lib/server/serialize');

    // Scope the lookup by userId AND companionId, not by messageId alone: a
    // message id is guessable, and reacting to a stranger's message would both
    // leak that it exists and write to a thread that isn't ours.
    const msg = await prisma.message.findFirst({
      where: { id: messageId, userId, companionId },
      select: { id: true, reactions: true },
    });
    if (!msg) return json({ error: 'not_found' }, 404);

    const reactions = msg.reactions.includes(emoji)
      ? msg.reactions.filter((e) => e !== emoji)
      : [...msg.reactions, emoji];

    await prisma.message.update({ where: { id: msg.id }, data: { reactions } });

    const rows = await prisma.message.findMany({
      where: { userId, companionId },
      orderBy: { createdAt: 'asc' },
    });
    return json(rows.map(toMessage));
  });
}
