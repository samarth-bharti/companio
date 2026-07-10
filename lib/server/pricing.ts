// lib/server/pricing.ts
//
// SERVER-AUTHORITATIVE pricing. The client may name WHAT it wants to buy
// (kind + packId); it may never send the price. Every amount below is the
// single source of truth the API trusts — `create-order` computes the Razorpay
// amount from here, and `settlePurchase` grants the matching benefit.
//
// Amounts are in paise (Razorpay's unit). They MUST match what the UI shows
// in app/pricing/page.tsx and components/explore/UnlockSheet.tsx.

export type PurchaseKind = 'booking' | 'credits' | 'unlock' | 'plus';

/** Credit packs — id → { credits granted, price in paise }. */
export const CREDIT_PACKS = {
  pack1: { credits: 1, amount: 49900 },   // ₹499
  pack5: { credits: 5, amount: 199900 },  // ₹1,999  (₹400 / meetup)
  pack10: { credits: 10, amount: 299900 }, // ₹2,999  (₹300 / meetup)
} as const;

export type PackId = keyof typeof CREDIT_PACKS;

export const UNLOCK_AMOUNT = 19900;  // ₹199 one-time full unlock
export const PLUS_AMOUNT = 29900;    // ₹299 one-time — Companio Plus (no recurring billing)
export const MEETING_AMOUNT = 49900; // ₹499 — a meeting beyond the free credits

export function isPackId(v: string | undefined): v is PackId {
  return !!v && Object.prototype.hasOwnProperty.call(CREDIT_PACKS, v);
}

// ── Which purchase kinds may actually take money ────────────────────────────
//
// v1 sells the ₹199 unlock ONLY. `booking`, `credits` and `plus` all end with
// Companio collecting a user's money and owing part of it to a companion
// (settlePurchase writes a CompanionPayout). Pooling and settling funds on
// behalf of a third party is exactly what the RBI's Payment Aggregator rules
// licence — ₹15 crore net worth to apply, ₹25 crore within three years.
//
// Until that licence exists (or payouts move to Razorpay Route linked
// accounts, where Razorpay is the aggregator of record), those kinds must be
// unreachable. Supplying a Razorpay key must NOT silently arm them.
//
// Set MARKETPLACE_PAYMENTS_ENABLED=true only when the licence/Route wiring is
// genuinely in place.

/** Kinds that are always sellable — no third-party money is held. */
const ALWAYS_ALLOWED_KINDS: readonly PurchaseKind[] = ['unlock'];

/** Kinds that pool funds owed to a companion, and so need the licence gate. */
const MARKETPLACE_KINDS: readonly PurchaseKind[] = ['booking', 'credits', 'plus'];

export function marketplacePaymentsEnabled(): boolean {
  return process.env.MARKETPLACE_PAYMENTS_ENABLED === 'true';
}

/** True when this purchase kind may legally be charged in the current config. */
export function isPurchaseKindEnabled(kind: PurchaseKind): boolean {
  if (ALWAYS_ALLOWED_KINDS.includes(kind)) return true;
  return MARKETPLACE_KINDS.includes(kind) && marketplacePaymentsEnabled();
}

// ── Variable per-companion pricing ──────────────────────────────────────────
// Companions set an hourly rate. We clamp to a sane band so a bad seed/import
// can never charge ₹5 or ₹50,000. Premium companions get a higher ceiling.

export const HOURLY_MIN = 30000;          // ₹300/hr
export const HOURLY_MAX = 100000;         // ₹1,000/hr
export const HOURLY_MAX_PREMIUM = 200000; // ₹2,000/hr — premium tier

/** Clamp a companion's hourly rate (paise) into the allowed band. */
export function clampHourly(ratePaise: number, premium = false): number {
  const max = premium ? HOURLY_MAX_PREMIUM : HOURLY_MAX;
  return Math.min(Math.max(Math.round(ratePaise), HOURLY_MIN), max);
}

// ── Commission split ────────────────────────────────────────────────────────
// Platform keeps a cut of each booking; the companion is paid the rest. Plus
// members pay a LOWER platform commission (a perk of the subscription). Basis
// points (1% = 100 bps) avoid floating-point drift on money.

export const COMMISSION_STD_BPS = 3000;  // 30% for standard users
export const COMMISSION_PLUS_BPS = 1000; // 10% for Companio Plus users

export interface MoneySplit {
  pricePaid: number;       // what the user paid (paise)
  commissionPaise: number; // platform keeps this
  payoutPaise: number;     // companion earns this
}

/** Split a paid amount into platform commission + companion payout. */
export function splitMoney(pricePaid: number, isPlus: boolean): MoneySplit {
  const bps = isPlus ? COMMISSION_PLUS_BPS : COMMISSION_STD_BPS;
  const commissionPaise = Math.round((pricePaid * bps) / 10000);
  return { pricePaid, commissionPaise, payoutPaise: pricePaid - commissionPaise };
}

// ── Surge + discount + GST (pure math) ──────────────────────────────────────

export const GST_BPS = 1800; // 18% GST (applied once registration is live)

/** Apply a surge multiplier to a base amount, rounded to whole paise. */
export function applySurge(basePaise: number, multiplier: number): number {
  const m = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
  return Math.round(basePaise * m);
}

/** Subtract a 0–100% discount from an amount (clamped, never negative). */
export function applyDiscount(amountPaise: number, pct: number): number {
  const p = Math.min(Math.max(Math.round(pct), 0), 100);
  return Math.round((amountPaise * (100 - p)) / 100);
}

/** The GST component contained within a GST-inclusive amount. */
export function gstComponent(grossPaise: number): number {
  return Math.round((grossPaise * GST_BPS) / (10000 + GST_BPS));
}
