// app/api/companion/profile/route.ts
//
// PATCH /api/companion/profile — a companion edits their OWN profile.
//
// The dashboard used to collect a bio, an availability toggle and a UPI id into
// React state and throw all three away on unmount. Nothing was ever saved.
//
// What a companion may change is deliberately narrow: how they present
// themselves, whether they are available, and where they get paid. Everything
// that affects trust or money-in — `verified`, `premium`, `rating`, `topMatch`,
// `matchScore`, `suspended` — is admin-only and is not accepted here, however
// the request is shaped.

import { z } from 'zod';
import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, badRequest, readJsonBody, guard } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';
import { clampHourly } from '@/lib/server/pricing';

export const dynamic = 'force-dynamic';

/** `name@bank`, the NPCI virtual payment address format. Deliberately loose. */
const UPI_RE = /^[a-zA-Z0-9._-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,63}$/;

const profileBody = z.object({
  bio: z.string().min(20).max(1000).optional(),
  activities: z.array(z.string().min(1).max(40)).max(12).optional(),
  availableNow: z.boolean().optional(),
  availability: z.string().min(1).max(80).optional(),
  hourlyRate: z.number().int().positive().optional(), // paise; clamped below
  // Empty string clears it. Anything else must look like a real UPI id, or a
  // typo silently becomes the address we try to pay.
  payoutUpi: z.union([z.literal(''), z.string().regex(UPI_RE, 'not a valid UPI id')]).optional(),
});

export async function PATCH(req: Request) {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const rl = await rateLimit({ key: clientKey(req, 'companion-profile'), limit: 20, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const { prisma } = await import('@/lib/prisma');
    const { getCompanionIdForUser } = await import('@/lib/server/companion');

    const companionId = await getCompanionIdForUser(prisma, userId);
    if (!companionId) return json({ error: 'not_a_companion' }, 403);

    const parsed = profileBody.safeParse(await readJsonBody(req));
    if (!parsed.success) return badRequest(parsed.error.flatten());
    if (Object.keys(parsed.data).length === 0) return badRequest({ _errors: ['nothing to update'] });

    const { hourlyRate, payoutUpi, ...rest } = parsed.data;
    const data: Record<string, unknown> = { ...rest };

    if (hourlyRate !== undefined) {
      // A companion sets their own rate, but never outside the band the pricing
      // module allows — a bad client can't list themselves at ₹5 or ₹50,000.
      const current = await prisma.companion.findUnique({
        where: { id: companionId },
        select: { premium: true },
      });
      data.hourlyRate = clampHourly(hourlyRate, current?.premium ?? false);
    }

    if (payoutUpi !== undefined) {
      data.payoutUpi = payoutUpi === '' ? null : payoutUpi.toLowerCase();
    }

    const updated = await prisma.companion.update({
      where: { id: companionId },
      data,
      select: {
        bio: true, activities: true, availableNow: true,
        availability: true, hourlyRate: true, payoutUpi: true,
      },
    });

    return json({ ok: true, ...updated });
  });
}
