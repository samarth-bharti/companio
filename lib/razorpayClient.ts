// lib/razorpayClient.ts
//
// Client-side Razorpay Checkout flow. WHY a gated helper: the app ships in a
// demo mode where no Razorpay key exists and there is no auth session, so the
// pay buttons must keep working as a local simulation. This helper attempts the
// REAL flow (create-order -> Checkout -> verify) and returns 'unconfigured'
// whenever the real path can't run, letting callers fall back to the demo
// animation. The moment NEXT_PUBLIC_RAZORPAY_KEY_ID + server keys + auth exist,
// the same buttons take real money — no code change.

export type RazorpayIntent = {
  kind: 'unlock' | 'plus' | 'credits' | 'booking';
  packId?: string;
  bookingId?: string;
};

/**
 * 'unconfigured' is returned ONLY when no publishable key exists — i.e. this
 * build genuinely has no payment gateway and callers may run their local demo.
 *
 * Once a key IS present, every other failure is a REAL failure and must surface
 * as one. A 401 (no session) previously collapsed into 'unconfigured', so the
 * caller ran its demo animation and granted the paid benefit for free. Keep
 * these variants distinct: a signed-out user gets 'auth_required', a
 * half-configured server gets 'unavailable' — neither may ever reach demo mode.
 */
export type PayResult =
  | 'success'
  | 'dismissed'
  | 'failed'
  | 'auth_required'
  | 'unavailable'
  | 'unconfigured';

// Razorpay injects this global once checkout.js loads.
type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void };
declare global {
  interface Window { Razorpay?: RazorpayCtor }
}

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

/** True only when a publishable key is present — the client gate for live mode. */
export function razorpayConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
}

/** Load checkout.js once; resolves false if it can't load (offline, blocked). */
function loadScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

type OrderResponse = { orderId?: string; amount?: number; currency?: string; keyId?: string };
type VerifyResponse = { ok?: boolean };

async function postJson<T>(url: string, body: unknown): Promise<{ status: number; data: T | null }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: T | null = null;
  try { data = (await res.json()) as T; } catch { /* empty body */ }
  return { status: res.status, data };
}

/**
 * Run the real payment. Returns:
 *  - 'unconfigured'  : no publishable key at all -> caller may run its demo.
 *  - 'auth_required' : key present, but the visitor has no session (401).
 *  - 'unavailable'   : key present, but the server is missing its own keys, or
 *                      this purchase kind is disabled (503).
 *  - 'success'       : signature verified and purchase settled server-side.
 *  - 'dismissed'     : user closed the Checkout modal.
 *  - 'failed'        : create-order, verify, or the gateway errored.
 */
export async function payWithRazorpay(intent: RazorpayIntent): Promise<PayResult> {
  if (!razorpayConfigured()) return 'unconfigured';
  if (!(await loadScript()) || !window.Razorpay) return 'failed';

  const order = await postJson<OrderResponse>('/api/razorpay/create-order', intent);
  // A publishable key exists, so live mode is INTENDED. Never degrade to the
  // demo path from here — that would hand out the paid benefit for free.
  if (order.status === 401) return 'auth_required';
  if (order.status === 503) return 'unavailable';
  if (order.status !== 200 || !order.data?.orderId) return 'failed';

  const { orderId, amount, currency, keyId } = order.data;

  return new Promise<PayResult>((resolve) => {
    let settled = false;
    const finish = (r: PayResult) => { if (!settled) { settled = true; resolve(r); } };

    const rzp = new window.Razorpay!({
      key: keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_id: orderId,
      amount,
      currency: currency ?? 'INR',
      name: 'Companio',
      description: intent.kind,
      handler: async (resp: Record<string, string>) => {
        const verify = await postJson<VerifyResponse>('/api/razorpay/verify', {
          razorpay_order_id: resp.razorpay_order_id,
          razorpay_payment_id: resp.razorpay_payment_id,
          razorpay_signature: resp.razorpay_signature,
        });
        finish(verify.status === 200 && verify.data?.ok ? 'success' : 'failed');
      },
      modal: { ondismiss: () => finish('dismissed') },
      theme: { color: '#5b5bd6' },
    });
    rzp.open();
  });
}
