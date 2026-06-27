// prisma/seed.ts
//
// Seeds the companion catalogue from the static mock (lib/data/companions).
// Idempotent: upsert by id, so re-running never duplicates. Run with:
//   npx prisma db seed         (uses the "prisma.seed" command in package.json)
// Requires DATABASE_URL / DIRECT_URL to be set.

import { PrismaClient, Prisma } from '@prisma/client';
import { COMPANIONS } from '../lib/data/companions';

const prisma = new PrismaClient();

async function main() {
  for (const c of COMPANIONS) {
    const { reviews, reviewsList, ...rest } = c;
    await prisma.companion.upsert({
      where: { id: c.id },
      update: {},
      create: {
        ...rest,
        reviewCount: reviews,
        reviewsList: reviewsList as unknown as Prisma.InputJsonValue,
      },
    });
  }
  console.log(`Seeded ${COMPANIONS.length} companions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
