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
      select: { firstName: true, city: true, dateOfBirth: true },
    });
    if (!u) return json(null);
    // dateOfBirth is returned so the client can tell "we have never asked" from
    // "they told us". A Google sign-in never supplies one, and booking refuses
    // without it — the UI has to know in order to ask.
    return json({
      firstName: u.firstName,
      city: u.city ?? undefined,
      dateOfBirth: u.dateOfBirth ? u.dateOfBirth.toISOString().slice(0, 10) : undefined,
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const parsed = userBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());

    const data: {
      firstName: string;
      city: string | null;
      dateOfBirth?: Date;
    } = {
      firstName: parsed.data.firstName,
      city: parsed.data.city ?? null,
    };

    // Date of birth is SET-ONCE. A user who could edit it could sign up as an
    // adult, book, and then rewrite history — and an underage user could simply
    // try again with a different date. Changing it is an admin/support action.
    if (parsed.data.dateOfBirth) {
      const { parseDateOfBirth, isAdult } = await import('@/lib/server/age');
      const dob = parseDateOfBirth(parsed.data.dateOfBirth);
      if (!dob) return badRequest({ _errors: ['dateOfBirth is not a real date'] });
      if (!isAdult(dob)) {
        return json({ error: 'under_age', detail: 'Companio is for adults aged 18 and over.' }, 403);
      }

      const { prisma } = await import('@/lib/prisma');
      const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { dateOfBirth: true },
      });
      if (existing?.dateOfBirth) {
        // Already set. Silently ignore rather than fail the whole profile save.
        // Contact support to correct a genuine mistake.
      } else {
        data.dateOfBirth = dob;
      }
    }

    const { prisma } = await import('@/lib/prisma');
    await prisma.user.update({ where: { id: userId }, data });
    return json({ ok: true });
  });
}
