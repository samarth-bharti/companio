// app/api/user/route.ts
//
// GET  /api/user  → DemoUser | null  (firstName + city)
// POST /api/user  → persist profile fields for the signed-in user

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { userBody } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { prisma } = await import('@/lib/prisma');
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, city: true },
    });
    if (!u) return json(null);
    return json({ firstName: u.firstName, city: u.city ?? undefined });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const parsed = userBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({
      where: { id: userId },
      data: { firstName: parsed.data.firstName, city: parsed.data.city ?? null },
    });
    return json({ ok: true });
  });
}
