// app/api/companion/messages/[memberId]/route.ts
//
// GET  /api/companion/messages/:memberId → ChatMessage[]  (one thread)
// POST /api/companion/messages/:memberId { text, kind? } → the companion replies
//
// A companion may only ever read and write the thread between THEIR OWN
// companion profile and the member named in the path. The companion id comes
// from the session, never from the request, so there is no id to tamper with.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, guard, readJsonBody } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { companionReplyBody } from '@/lib/server/validation';
import { CONTACT_RE } from '@/lib/chat/contact';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { prisma } = await import('@/lib/prisma');
    const { getCompanionIdForUser } = await import('@/lib/server/companion');
    const { toMessage } = await import('@/lib/server/serialize');

    const companionId = await getCompanionIdForUser(prisma, userId);
    if (!companionId) return json({ error: 'not_a_companion' }, 403);

    const { memberId } = await params;
    const rows = await prisma.message.findMany({
      where: { companionId, userId: memberId },
      orderBy: { createdAt: 'asc' },
    });
    return json(rows.map(toMessage));
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> },
) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const rl = await rateLimit({ key: clientKey(req, 'companion-reply'), limit: 30, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const { prisma } = await import('@/lib/prisma');
    const { getCompanionIdForUser } = await import('@/lib/server/companion');
    const { toMessage } = await import('@/lib/server/serialize');

    const companionId = await getCompanionIdForUser(prisma, userId);
    if (!companionId) return json({ error: 'not_a_companion' }, 403);

    const { memberId } = await params;
    const parsed = companionReplyBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { text, kind } = parsed.data;

    // The contact-sharing filter runs on the companion's words too. It existed
    // only on the member's side, which is precisely backwards: the companion is
    // the one with an incentive to take the relationship off-platform, and the
    // member is the one the platform's safety guarantees are protecting.
    if (CONTACT_RE.test(text)) return json({ error: 'contact_details_blocked' }, 422);

    // A suspended or banned companion cannot keep talking to members.
    const me = await prisma.companion.findFirst({
      where: { id: companionId, suspended: false, bannedAt: null },
      select: { id: true },
    });
    if (!me) return json({ error: 'companion_unavailable' }, 403);

    // Only reply into a thread the member actually started. This stops an
    // approved companion cold-messaging every member id they can guess.
    const existing = await prisma.message.findFirst({
      where: { companionId, userId: memberId },
      select: { id: true },
    });
    if (!existing) return json({ error: 'no_such_thread' }, 404);

    const msg = await prisma.message.create({
      data: {
        threadId: `${memberId}_${companionId}`,
        userId: memberId,
        companionId,
        from: 'them', // 'them' is the companion, as seen from the member's thread
        text,
        kind: kind ?? 'text',
        ts: BigInt(Date.now()),
      },
    });
    return json(toMessage(msg));
  });
}
