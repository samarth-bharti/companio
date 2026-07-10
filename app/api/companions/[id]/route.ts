// app/api/companions/[id]/route.ts
//
// GET /api/companions/:id — one companion profile.
// Falls back to the static mock when DATABASE_URL is not set.

import { NextResponse } from 'next/server';
import { getCompanion } from '@/lib/data/companions';
import { guard } from '@/lib/server/http';
import { envValue } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!envValue('DATABASE_URL')) {
    const c = getCompanion(id);
    return c ? NextResponse.json(c) : NextResponse.json(null, { status: 404 });
  }

  return guard(async () => {
    const { prisma } = await import('@/lib/prisma');
    const { toCompanion } = await import('@/lib/server/serialize');
    const { VISIBLE_COMPANION } = await import('@/lib/server/visibility');
    // A suspended profile is a 404 to members, not a hidden-but-fetchable row.
    const row = await prisma.companion.findFirst({ where: { id, ...VISIBLE_COMPANION } });
    return row ? NextResponse.json(toCompanion(row)) : NextResponse.json(null, { status: 404 });
  });
}
