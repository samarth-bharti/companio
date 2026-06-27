// app/api/wallet/add-credits/route.ts
//
// Credits are a PAID benefit. They are granted ONLY by settlePurchase() after a
// verified Razorpay payment (POST /api/razorpay/create-order { kind: 'credits',
// packId } → checkout → /api/razorpay/verify). There is deliberately no
// client-callable mint: letting the client choose the increment is a payment
// bypass. This endpoint refuses, by design.

import { getSessionUserId } from '@/lib/server/session';
import { json, unauthorized, guard } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export async function POST() {
  return guard(async () => {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    return json(
      { error: 'use_checkout', detail: 'Credits are granted via /api/razorpay/create-order (kind=credits).' },
      403,
    );
  });
}
