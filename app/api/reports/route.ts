// app/api/reports/route.ts
//
// POST /api/reports  — file a report against a companion or another user.
// Part of the IT Act intermediary duty: a real report → review → action trail
// (the admin queue reads these). Auth-gated + rate-limited against abuse.
//
// Inert (401) until auth + DATABASE_URL are configured, like every other route.

import { z } from 'zod';
import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

const reportBody = z
  .object({
    targetType: z.enum(['companion', 'user']),
    companionId: z.string().min(1).max(64).optional(),
    targetUserId: z.string().min(1).max(64).optional(),
    reason: z.string().min(1).max(80),
    detail: z.string().max(2000).optional(),
  })
  .refine((b) => (b.targetType === 'companion' ? !!b.companionId : !!b.targetUserId), {
    message: 'target id required for the chosen targetType',
  });

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const rl = await rateLimit({ key: clientKey(req, 'report'), limit: 5, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const parsed = reportBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { targetType, companionId, targetUserId, reason, detail } = parsed.data;

    const { prisma } = await import('@/lib/prisma');
    const report = await prisma.report.create({
      data: {
        reporterId: userId,
        targetType,
        companionId: targetType === 'companion' ? companionId : null,
        targetUserId: targetType === 'user' ? targetUserId : null,
        reason,
        detail: detail ?? null,
      },
      select: { id: true, status: true },
    });

    return json({ ok: true, id: report.id, status: report.status });
  });
}
