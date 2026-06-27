// app/api/companions/[id]/route.ts
//
// GET /api/companions/:id — one companion profile.
// Falls back to the static mock when DATABASE_URL is not set.

import { NextResponse } from 'next/server';
import { getCompanion } from '@/lib/data/companions';
import { guard } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!process.env.DATABASE_URL) {
    const c = getCompanion(id);
    return c ? NextResponse.json(c) : NextResponse.json(null, { status: 404 });
  }

  return guard(async () => {
    const { prisma } = await import('@/lib/prisma');
    const { toCompanion } = await import('@/lib/server/serialize');
    const row = await prisma.companion.findUnique({ where: { id } });
    return row ? NextResponse.json(toCompanion(row)) : NextResponse.json(null, { status: 404 });
  });
}
