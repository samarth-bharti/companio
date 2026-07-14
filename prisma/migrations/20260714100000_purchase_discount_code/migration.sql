-- Discount code applied to a purchase.
--
-- Recorded when the order is created and read back on settle, which is where
-- DiscountCode.usedCount is incremented — an abandoned checkout must never burn
-- a use of a limited code.
--
-- Additive and nullable: existing purchases are unaffected.
ALTER TABLE "purchases" ADD COLUMN "discountCode" TEXT;
