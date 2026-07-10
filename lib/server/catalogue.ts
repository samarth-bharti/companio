// lib/server/catalogue.ts
//
// Read the companion catalogue on the server, from the database.
//
// `lib/data/companions.ts` is seed data. Server components that imported
// `getCompanion()` from it were rendering a JavaScript array compiled into the
// bundle: a companion suspended by an admin still had a live, indexable profile
// page, and an approved applicant had none. The `companions` table is the
// source of truth, and `VISIBLE_COMPANION` is what "live" means.
//
// With no DATABASE_URL we fall back to the seed catalogue, which is exactly what
// the table would contain on a fresh install. That keeps the app runnable before
// Postgres is wired without ever inventing a profile.

import { envValue } from '@/lib/env';
import { COMPANIONS, getCompanion as getSeedCompanion } from '@/lib/data/companions';
import type { Companion } from '@/lib/data/companions';

/** One visible companion, or null. Suspended and banned profiles return null. */
export async function findVisibleCompanion(id: string): Promise<Companion | null> {
  if (!envValue('DATABASE_URL')) return getSeedCompanion(id) ?? null;

  const { prisma } = await import('@/lib/prisma');
  const { toCompanion } = await import('@/lib/server/serialize');
  const { VISIBLE_COMPANION } = await import('@/lib/server/visibility');

  const row = await prisma.companion.findFirst({ where: { id, ...VISIBLE_COMPANION } });
  return row ? toCompanion(row) : null;
}

/** Every visible companion, best match first. */
export async function listVisibleCompanions(): Promise<Companion[]> {
  if (!envValue('DATABASE_URL')) return COMPANIONS;

  const { prisma } = await import('@/lib/prisma');
  const { toCompanion } = await import('@/lib/server/serialize');
  const { VISIBLE_COMPANION } = await import('@/lib/server/visibility');

  const rows = await prisma.companion.findMany({
    where: VISIBLE_COMPANION,
    orderBy: { matchScore: 'desc' },
  });
  return rows.map(toCompanion);
}
