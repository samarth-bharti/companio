// prisma/seed.ts
//
// Promotes the ADMIN_EMAILS allowlist so the panel is reachable on a fresh DB,
// and repairs any companion reputation that was authored rather than earned.
//
// Idempotent. Safe to re-run:
//   npx prisma db seed         (uses the "prisma.seed" command in package.json)
// Requires DATABASE_URL / DIRECT_URL to be set.
//
// THIS NO LONGER SEEDS COMPANIONS, AND MUST NOT AGAIN.
//
// It used to upsert 22 profiles out of lib/data/companions.ts into the
// `companions` table — invented people with stock portraits, served by the
// explore grid as the catalogue a pass unlocks. Selling access to a person who
// does not exist is not a placeholder. That array is empty now and the seeding
// loop is gone with it; every companion arrives through a real application and
// a hand-checked ID in /admin/applications.

import { PrismaClient, Prisma } from '@prisma/client';
import { envValue } from '../lib/env';

const prisma = new PrismaClient();

async function seedAdmins() {
  const emails = (envValue('ADMIN_EMAILS') ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (emails.length === 0) {
    console.log('No ADMIN_EMAILS set — skipping admin promotion.');
    return;
  }

  // Only promotes accounts that already exist: sign in with Google once first,
  // then re-run the seed. We never invent a login here — an admin row with no
  // OAuth identity behind it is a credential nobody can use and everybody can
  // find.
  const { count } = await prisma.user.updateMany({
    where: { email: { in: emails } },
    data: { role: 'admin' },
  });

  console.log(`Promoted ${count} of ${emails.length} ADMIN_EMAILS to admin.`);
  if (count < emails.length) {
    console.log('Accounts not found yet. Sign in with Google once, then re-run this seed.');
  }
}

/**
 * Recompute every companion's rating and review count from the only thing that
 * can grant them: reviews left on their own completed bookings.
 *
 * This is a repair as much as a derivation. Rows seeded before July 2026 carry
 * `rating: 4.9, reviewCount: 124` and a `reviewsList` of invented members,
 * because the seed catalogue asserted them. No booking backs any of it. Deriving
 * the numbers from `Booking.review` sets those rows to zero and keeps them
 * correct forever after, without a migration that hardcodes a fix-up.
 */
async function recomputeReputation() {
  const companions = await prisma.companion.findMany({ select: { id: true } });

  for (const { id } of companions) {
    const reviewed = await prisma.booking.findMany({
      where: { companionId: id, status: 'completed', review: { not: Prisma.DbNull } },
      select: { review: true, user: { select: { firstName: true, city: true } } },
    });

    const parsed = reviewed
      .map((b) => b.review as { stars?: number; text?: string } | null)
      .filter((r): r is { stars: number; text?: string } => typeof r?.stars === 'number');

    const reviewCount = parsed.length;
    const rating = reviewCount
      ? Math.round((parsed.reduce((sum, r) => sum + r.stars, 0) / reviewCount) * 10) / 10
      : 0;

    // The public snippet list: real reviewers, first names only.
    const reviewsList = reviewed
      .filter((b) => (b.review as { text?: string } | null)?.text)
      .slice(0, 6)
      .map((b) => ({
        name: b.user.firstName,
        city: b.user.city ?? '',
        stars: (b.review as { stars: number }).stars,
        text: (b.review as { text: string }).text,
      }));

    await prisma.companion.update({
      where: { id },
      data: { rating, reviewCount, reviewsList: reviewsList as unknown as Prisma.InputJsonValue },
    });
  }

  console.log(`Recomputed reputation for ${companions.length} companions from real reviews.`);
}

async function main() {
  await recomputeReputation();
  await seedAdmins();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
