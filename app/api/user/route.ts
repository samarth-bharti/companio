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
      select: {
        firstName: true,
        city: true,
        dateOfBirth: true,
        gender: true,
        genderSelfDescribed: true,
        sameGenderOnly: true,
      },
    });
    if (!u) return json(null);
    // dateOfBirth is returned so the client can tell "we have never asked" from
    // "they told us". A Google sign-in never supplies one, and booking refuses
    // without it — the UI has to know in order to ask.
    //
    // gender + sameGenderOnly are returned because the explore filter runs on
    // them: the preference has to survive a reload, and a cleared localStorage.
    return json({
      firstName: u.firstName,
      city: u.city ?? undefined,
      dateOfBirth: u.dateOfBirth ? u.dateOfBirth.toISOString().slice(0, 10) : undefined,
      gender: u.gender ?? undefined,
      genderSelfDescribed: u.genderSelfDescribed ?? undefined,
      sameGenderOnly: u.sameGenderOnly,
    });
  });
}

export async function POST(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    const parsed = userBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());

    // A PATCH, not a replace. A field that is absent means "leave it alone",
    // never "set it to null" — the quiz posts `{ firstName }` on completion, and
    // under the old shape that silently wiped the city the member registered
    // with, sending them back to Mumbai's roster.
    const data: {
      firstName: string;
      city?: string;
      dateOfBirth?: Date;
      gender?: 'male' | 'female' | 'nonbinary' | 'self_described' | 'prefer_not_to_say';
      genderSelfDescribed?: string | null;
      sameGenderOnly?: boolean;
    } = {
      firstName: parsed.data.firstName,
    };

    if (parsed.data.city !== undefined) data.city = parsed.data.city;

    // Gender is editable (unlike date of birth): people's answer to this can
    // change, and there is no incentive to lie about it the way there is about
    // age. The free-text description only survives while it is the answer.
    if (parsed.data.gender) {
      data.gender = parsed.data.gender;
      data.genderSelfDescribed =
        parsed.data.gender === 'self_described'
          ? parsed.data.genderSelfDescribed ?? null
          : null;
    }
    if (parsed.data.sameGenderOnly !== undefined) {
      data.sameGenderOnly = parsed.data.sameGenderOnly;
    }

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
