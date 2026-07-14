// app/api/user/delete/route.ts
//
// POST /api/user/delete  — DPDP right to erasure.
//
// The work itself lives in lib/server/erase.ts, which the admin panel's Delete
// button also calls. That file has always claimed the two paths were shared "so
// the two can't drift" — but this route kept its own copy of the transaction and
// they had already drifted. Now there is one implementation, and a fix to the
// cascade rules (payments and companion wages survive an erasure) applies to
// both at once.

import { getRawSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';
import { rateLimit, clientKey } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return guard(async () => {
    // Raw: a suspended or banned account is still legally entitled to erase itself.
    const userId = await getRawSessionUserId();
    if (!userId) return unauthorized();

    // Account erasure is irreversible — keep the request rate very low.
    const rl = await rateLimit({ key: clientKey(req, 'account-delete'), limit: 3, windowMs: 60_000 });
    if (!rl.ok) return json({ error: 'rate_limited', retryAfter: rl.retryAfter }, 429);

    const { prisma } = await import('@/lib/prisma');
    const { eraseUser } = await import('@/lib/server/erase');

    await eraseUser(prisma, userId);

    return json({ ok: true });
  });
}
