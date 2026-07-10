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

import { PrismaClient, Prisma } from '@prisma/client';
import { COMPANIONS } from '../lib/data/companions';

const prisma = new PrismaClient();

async function seedCompanions() {
  for (const c of COMPANIONS) {
    const { reviews, reviewsList, ...rest } = c;
    const catalogue = {
      ...rest,
      reviewCount: reviews,
      reviewsList: reviewsList as unknown as Prisma.InputJsonValue,
    };
    await prisma.companion.upsert({
      where: { id: c.id },
      update: catalogue, // refresh content; moderation columns are untouched
      create: catalogue,
    });
  }
  console.log(`Seeded ${COMPANIONS.length} companions.`);
}

async function seedAdmins() {
  const emails = (process.env.ADMIN_EMAILS ?? '')
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

async function main() {
  await seedCompanions();
  await seedAdmins();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
