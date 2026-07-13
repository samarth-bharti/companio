// app/api/companions/[id]/route.ts
//
// GET /api/companions/:id — one companion profile, redacted unless the caller has
// paid for the unlock (or this is their city's free preview).
//
// This route used to hand the full row to anyone who asked for it by id, which
// made the entire paywall a formality: the grid blurred eight cards, and eight
// GETs read them all. See lib/server/redact.ts.

import { NextResponse } from 'next/server';
import { getCompanion } from '@/lib/data/companions';
import { guard } from '@/lib/server/http';
import { envValue } from '@/lib/env';
import { redactCompanion } from '@/lib/server/redact';
import { freePreviewIdSet } from '@/lib/server/catalogue';
import { viewerHasUnlocked } from '@/lib/server/viewer';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  return guard(async () => {
    let companion = null;

    if (!envValue('DATABASE_URL')) {
      companion = getCompanion(id) ?? null;
    } else {
      const { prisma } = await import('@/lib/prisma');
      const { toCompanion } = await import('@/lib/server/serialize');
      const { VISIBLE_COMPANION } = await import('@/lib/server/visibility');
      // A suspended profile is a 404 to members, not a hidden-but-fetchable row.
      const row = await prisma.companion.findFirst({ where: { id, ...VISIBLE_COMPANION } });
      companion = row ? toCompanion(row) : null;
    }

    if (!companion) return NextResponse.json(null, { status: 404 });

    const [unlocked, free] = await Promise.all([viewerHasUnlocked(), freePreviewIdSet()]);
    const visible = unlocked || free.has(companion.id);
    return NextResponse.json(visible ? companion : redactCompanion(companion));
  });
}
