// app/api/user/unlocked/route.ts
//
// GET  /api/user/unlocked → boolean  (does the user hold a LIVE pass?)
// POST is refused: the pass is a PAID benefit, flipped ONLY by settlePurchase()
// after a verified Razorpay payment (create-order kind=unlock). A client-writable
// setter here would be a payment bypass.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';
import { viewerHasUnlocked } from '@/lib/server/viewer';

export const dynamic = 'force-dynamic';

/**
 * This asked the database for `unlocked` and returned it raw — which is the one
 * thing prisma/schema.prisma says not to do, in writing, next to the column.
 *
 * `unlocked` is set true by the first payment and never set false again; the
 * expiry lives in `unlockedUntil`. So a member whose ₹199 month had run out got
 * `true` here, and the UI believed it: the explore grid rendered unlocked, and
 * `if (!unlocked) openSheet(c)` meant the one person in the product who wants to
 * pay us again was the one person never shown the checkout. Clicking a card sent
 * them to the profile, which redirected them back to explore. A loop, with no
 * way to buy.
 *
 * The paywall itself was never fooled — the server redacts off viewerHasUnlocked
 * — so nothing leaked. What leaked was the renewal, which is the entire point of
 * selling a pass by duration rather than once.
 *
 * viewerHasUnlocked() is the chokepoint. Everything asks it, including this.
 */
export async function GET() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    return json(await viewerHasUnlocked());
  });
}

export async function POST() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    return json(
      { error: 'use_checkout', detail: 'Full unlock is granted via /api/razorpay/create-order (kind=unlock).' },
      403,
    );
  });
}
