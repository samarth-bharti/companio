// app/api/companions/route.ts
//
// GET /api/companions — full companion catalogue.
// No auth (browse is public). Falls back to the static mock when DATABASE_URL
// is not set, so the endpoint works during scaffolding before Neon is wired.

import { NextResponse } from 'next/server';
import { COMPANIONS } from '@/lib/data/companions';
import { guard } from '@/lib/server/http';
import { envValue } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!envValue('DATABASE_URL')) return NextResponse.json(COMPANIONS);

  return guard(async () => {
    const { prisma } = await import('@/lib/prisma');
    const { toCompanion } = await import('@/lib/server/serialize');
    const { VISIBLE_COMPANION } = await import('@/lib/server/visibility');
    // Suspended and banned profiles must not reach the explore grid or the map.
    const rows = await prisma.companion.findMany({
      where: VISIBLE_COMPANION,
      orderBy: { matchScore: 'desc' },
    });
    return NextResponse.json(rows.map(toCompanion));
  });
}
