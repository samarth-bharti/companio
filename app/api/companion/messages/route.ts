// app/api/companion/messages/route.ts
//
// GET /api/companion/messages → the companion's inbox: one entry per member who
// has written to them, newest activity first.
//
// The other half of a conversation that only ever had one.
//
// A member could open a companion's profile, write "are you free on Saturday?",
// and read "Meghna will see this and reply when they're free". Meghna could not.
// There was no inbox, no endpoint, and no screen — every message a member ever
// sent went into a thread only the member could see. The product promised a
// conversation and delivered a suggestion box.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export interface CompanionThreadSummary {
  userId: string;
  memberFirstName: string;
  lastText: string;
  lastFrom: 'me' | 'them';
  lastTs: number;
  /** Messages from the member that arrived after the companion's last reply. */
  unread: number;
}

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { prisma } = await import('@/lib/prisma');
    const { getCompanionIdForUser } = await import('@/lib/server/companion');

    const companionId = await getCompanionIdForUser(prisma, userId);
    // Not a companion: an empty inbox, not an error. The dashboard renders the
    // same way for a companion nobody has written to yet.
    if (!companionId) return json([]);

    const rows = await prisma.message.findMany({
      where: { companionId },
      orderBy: { createdAt: 'asc' },
      select: {
        userId: true,
        from: true,
        text: true,
        ts: true,
        user: { select: { firstName: true } },
      },
    });

    // Fold the flat message list into one summary per member. Walking in
    // chronological order means the last write for each key IS the latest
    // message, and `unread` resets to zero the moment the companion replies.
    const byMember = new Map<string, CompanionThreadSummary>();
    for (const m of rows) {
      const prev = byMember.get(m.userId);
      const unread = m.from === 'me' ? (prev?.unread ?? 0) + 1 : 0;
      byMember.set(m.userId, {
        userId: m.userId,
        memberFirstName: m.user.firstName,
        lastText: m.text,
        // 'me' is the member's own voice in their thread, so from the companion's
        // side of the same row it is the other person speaking.
        lastFrom: m.from === 'me' ? 'them' : 'me',
        lastTs: Number(m.ts),
        unread,
      });
    }

    const threads = [...byMember.values()].sort((a, b) => b.lastTs - a.lastTs);
    return json(threads);
  });
}
