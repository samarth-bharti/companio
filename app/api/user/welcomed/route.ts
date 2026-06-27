// app/api/user/welcomed/route.ts
//
// GET  /api/user/welcomed → boolean  (has the post-signup welcome played?)
// POST /api/user/welcomed { value } → set the flag

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { boolValueBody } from '@/lib/server/validation';

export const dynamic = 'force-dynamic';

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const { prisma } = await import('@/lib/prisma');
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { welcomed: true } });
    return json(u?.welcomed ?? false);
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const parsed = boolValueBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({ where: { id: userId }, data: { welcomed: parsed.data.value } });
    return json({ ok: true });
  });
}
