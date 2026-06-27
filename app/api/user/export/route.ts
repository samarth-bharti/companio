// app/api/user/export/route.ts
//
// GET /api/user/export  — DPDP / GDPR data portability.
// Returns all data owned by the signed-in user as a downloadable JSON file.
// BigInt fields (Message.ts, Notification.ts) are coerced to Number so
// JSON.stringify does not throw; Date fields are serialized to ISO strings
// by the default JSON replacer behaviour.

import { getSessionUserId } from '@/lib/server/session';
import { unauthorized, guard } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

function bigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value);
  return value;
}

export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { prisma } = await import('@/lib/prisma');

    const data = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: { include: { ledger: true } },
        bookings: true,
        favorites: true,
        sentMessages: true,
        notifications: true,
        subscription: true,
        application: true,
        purchases: true,
      },
    });

    const body = JSON.stringify(data, bigIntReplacer, 2);

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="companio-data.json"',
      },
    });
  });
}
