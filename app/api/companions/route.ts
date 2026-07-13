// app/api/companions/route.ts
//
// GET /api/companions — the companion catalogue, redacted for anyone who has not
// paid for the unlock.
//
// Browsing is public, but a bio is not. This route used to return the complete
// catalogue to every caller — no session required — while the UI drew a blur over
// it. `curl http://localhost:3011/api/companions` printed every name and every
// bio in the database. See lib/server/redact.ts.

import { NextResponse } from 'next/server';
import { COMPANIONS } from '@/lib/data/companions';
import { guard } from '@/lib/server/http';
import { envValue } from '@/lib/env';
import { applyPaywall } from '@/lib/server/redact';
import { viewerHasUnlocked } from '@/lib/server/viewer';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!envValue('DATABASE_URL')) {
    // No database: there is no session either, so nobody can have paid.
    return NextResponse.json(applyPaywall(COMPANIONS, false));
  }

  return guard(async () => {
    const { prisma } = await import('@/lib/prisma');
    const { toCompanion } = await import('@/lib/server/serialize');
    const { VISIBLE_COMPANION } = await import('@/lib/server/visibility');
    // Suspended and banned profiles must not reach the explore grid or the map.
    const rows = await prisma.companion.findMany({
      where: VISIBLE_COMPANION,
      orderBy: { matchScore: 'desc' },
    });
    const unlocked = await viewerHasUnlocked();
    return NextResponse.json(applyPaywall(rows.map(toCompanion), unlocked));
  });
}
