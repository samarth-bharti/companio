-- Erasure must not destroy records that belong to someone else.
--
-- Two cascades were wrong:
--
--   purchases.userId          ON DELETE CASCADE -> SET NULL
--     Deleting a member deleted their payments. The privacy policy promises the
--     opposite ("payment and tax records, typically kept for up to 8 years"),
--     and the admin revenue total quietly shrank every time somebody left.
--
--   companion_payouts.bookingId ON DELETE CASCADE -> SET NULL
--     Deleting a member deleted their bookings, and the cascade deleted the
--     companion's *unpaid wage* for a meetup that actually happened. The payout
--     row already carries companionId and amountPaise, so it stands alone.
--
-- Both columns are only relaxed (NOT NULL dropped) and both FKs are only
-- softened, so no existing row changes and no data is lost.

-- purchases.userId
ALTER TABLE "purchases" DROP CONSTRAINT "purchases_userId_fkey";
ALTER TABLE "purchases" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- companion_payouts.bookingId
ALTER TABLE "companion_payouts" DROP CONSTRAINT "companion_payouts_bookingId_fkey";
ALTER TABLE "companion_payouts" ALTER COLUMN "bookingId" DROP NOT NULL;
ALTER TABLE "companion_payouts" ADD CONSTRAINT "companion_payouts_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
