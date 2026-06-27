// app/api/cron/route.ts
//
// GET /api/cron — maintenance job triggered by Vercel Cron daily at 03:00 UTC.
// Auth: Vercel Cron injects `Authorization: Bearer <CRON_SECRET>` on every call.
// If CRON_SECRET is unset the endpoint refuses to run (avoids unprotected side-effects).

import { json, guard } from '@/lib/server/http';
import { safeEqual } from '@/lib/server/payments';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return json({ error: 'cron_not_configured' }, 503);
  }

  const authHeader = req.headers.get('authorization') ?? '';
  if (!safeEqual(authHeader, `Bearer ${secret}`)) {
    return json({ error: 'unauthorized' }, 401);
  }

  // ── Jobs ─────────────────────────────────────────────────────────────────────
  return guard(async () => {
    const { prisma } = await import('@/lib/prisma');

    // Today as 'YYYY-MM-DD'. ISO date strings are lexicographically ordered,
    // so a plain string less-than comparison correctly identifies past dates.
    const today = new Date().toISOString().slice(0, 10);

    // Job 1: auto-complete past bookings.
    // Marks upcoming bookings whose date has already passed as completed.
    const completed = await prisma.booking.updateMany({
      where: {
        status: 'upcoming',
        dateISO: { lt: today },
      },
      data: { status: 'completed' },
    });

    // ── Add more maintenance tasks here ─────────────────────────────────────

    return json({ ok: true, completed: completed.count });
  });
}
