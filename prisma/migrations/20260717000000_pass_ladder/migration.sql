-- The pass ladder, and a stingier wheel.
--
-- v1 sold one thing: a ₹199 one-time unlock. It now sells the same access at
-- four durations — ₹199/1mo, ₹499/3mo, ₹999/12mo, ₹1999 lifetime — so the
-- unlock needs an expiry and the purchase needs to remember which tier was
-- bought. Nothing else about the paywall changes: `unlock` is still the only
-- purchase kind that may take money without an RBI Payment Aggregator licence,
-- because Companio keeps 100% of it and owes a companion nothing.
--
-- Every change here is additive. No column is dropped, no row is rewritten, and
-- every existing user keeps exactly the access they have.

-- users.unlockedUntil
--
-- Nullable, and NULL means two different things depending on `unlocked`:
--   unlocked = false -> never held a pass
--   unlocked = true  -> LIFETIME
-- That is why lib/server/viewer.ts reads both columns through passIsActive()
-- rather than comparing a date. Backfilling is deliberately NOT done: every
-- pre-ladder unlock was sold as permanent, so leaving `unlockedUntil` NULL
-- correctly grandfathers those buyers into lifetime. Stamping them with a date
-- would retroactively expire access somebody already paid for.
ALTER TABLE "users" ADD COLUMN "unlockedUntil" TIMESTAMP(3);

-- purchases.passTier
--
-- Which tier this order bought: pass1m | pass3m | pass12m | passlife. Written by
-- create-order from the server-side PASS_TIERS table (the client names a tier,
-- never a price and never a duration) and read back by settlePurchase to decide
-- how far to extend the pass. NULL on pre-ladder rows, which settle treats as
-- the one-month tier.
ALTER TABLE "purchases" ADD COLUMN "passTier" TEXT;

-- wallets.credits: 2 -> 1 free included meeting
--
-- DEFAULT only. Existing wallets keep whatever balance they hold — this must not
-- claw back a meeting somebody already has.
ALTER TABLE "wallets" ALTER COLUMN "credits" SET DEFAULT 1;

-- SpinPrize: three new outcomes.
--
-- ADD VALUE cannot run in the same transaction that later uses the new value, so
-- these are separate statements and nothing in this migration references them.
-- 'plus_month' is left in place: it is never drawn, but dropping an enum value
-- would break any historical row still carrying it.
ALTER TYPE "SpinPrize" ADD VALUE IF NOT EXISTS 'discount5';
ALTER TYPE "SpinPrize" ADD VALUE IF NOT EXISTS 'discount15';
ALTER TYPE "SpinPrize" ADD VALUE IF NOT EXISTS 'free_visit';
