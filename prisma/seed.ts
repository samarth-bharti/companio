// prisma/seed.ts
//
// Seeds the companion catalogue from the static mock (lib/data/companions), and
// promotes the ADMIN_EMAILS allowlist so the panel is reachable on a fresh DB.
//
// Idempotent: upsert by id, so re-running never duplicates.
//   npx prisma db seed         (uses the "prisma.seed" command in package.json)
// Requires DATABASE_URL / DIRECT_URL to be set.
//
// The update branch used to be `update: {}` — meaning a re-seed silently did
// NOTHING to rows that already existed. Editing lib/data/companions.ts and
// re-seeding appeared to work and changed nothing in the database. It now
// refreshes the catalogue fields on every run.
//
// It deliberately does NOT touch the columns an operator owns: `suspended`,
// `bannedAt`, `banReason`, `verified` and `premium`. A re-seed must never
// silently un-ban someone an admin removed from the marketplace.
//
// Nor does it touch `rating`, `reviewCount` or `reviewsList` on an existing row.
// Those are EARNED, not authored: they accumulate from real Booking.review rows.
// Every seed entry carries `rating: 0, reviews: 0, reviewsList: []`, so an
// update branch that included them would erase a companion's real reviews every
// time somebody edited a bio and re-ran the seed. They are set once, at create.

import { PrismaClient, Prisma } from '@prisma/client';
import { COMPANIONS } from '../lib/data/companions';
import { envValue } from '../lib/env';

const prisma = new PrismaClient();

async function seedCompanions() {
  for (const c of COMPANIONS) {
    const { reviews, reviewsList, rating, ...editable } = c;

    await prisma.companion.upsert({
      where: { id: c.id },
      // Refresh authored content only. Moderation and earned reputation are
      // both excluded — see the note above.
      update: editable,
      create: {
        ...editable,
        rating,
        reviewCount: reviews,
        reviewsList: reviewsList as unknown as Prisma.InputJsonValue,
      },
    });
  }

  const byCity = COMPANIONS.reduce<Record<string, number>>((acc, c) => {
    acc[c.city] = (acc[c.city] ?? 0) + 1;
    return acc;
  }, {});
  const summary = Object.entries(byCity)
    .map(([city, n]) => `${city}: ${n}`)
    .join(', ');
  console.log(`Seeded ${COMPANIONS.length} companions (${summary}).`);
}

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
  await seedCompanions();
  await recomputeReputation();
  await seedAdmins();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
