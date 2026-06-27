// app/api/application/route.ts
//
// GET  /api/application → CompanionApplication | null  (one draft per user)
// POST /api/application → upsert the user's application

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { applicationBody } from '@/lib/server/validation';
import type { CompanionApplication } from '@/lib/appState';

export const dynamic = 'force-dynamic';

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { prisma } = await import('@/lib/prisma');
    const a = await prisma.companionApplication.findUnique({ where: { userId } });
    if (!a) return json(null);
    return json({
      name: a.name,
      city: a.city,
      activities: a.activities,
      rate: a.rate,
      bio: a.bio,
      idUploaded: a.idUploaded,
      backgroundConsent: a.backgroundConsent,
      status: a.status as CompanionApplication['status'],
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const parsed = applicationBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { prisma } = await import('@/lib/prisma');
    // status is server-controlled. update strips it entirely so a re-save can
    // never overwrite an admin-set status (approved/rejected) back to a user
    // value. create clamps it to draft|submitted — the zod schema already bars
    // approved/rejected, but clamping here keeps that guarantee even if the enum
    // is later widened, so a client can never self-set a privileged status.
    const { status, ...updateFields } = parsed.data;
    const seedStatus = status === 'submitted' ? 'submitted' : 'draft';
    await prisma.companionApplication.upsert({
      where: { userId },
      update: updateFields,
      create: { userId, ...updateFields, status: seedStatus },
    });
    return json({ ok: true });
  });
}
