-- Delete the 22 fictional companions that earlier seeds wrote into the database,
-- and the fictional history hanging off them.
--
-- WHY THIS IS A MIGRATION AND NOT A CODE CHANGE
--
-- lib/data/companions.ts held 22 invented people — Ananya Iyer, Rohan Kapoor,
-- Priya Nair and nineteen more, with Unsplash stock portraits — and
-- `prisma/seed.ts` upserted every one of them into this table. Emptying that
-- array and deleting the seeding loop stops them being written AGAIN; it does
-- nothing about the rows already sitting in every database that was ever seeded,
-- and those rows are what /api/companions actually serves.
--
-- A pass buys exactly one thing: the right to see a companion's photo and
-- contact details. Leaving these rows in place means selling that access to
-- people who cannot be met. The catalogue has to be empty in the DATABASE, not
-- just in the repository.
--
-- WHY IT DELETES BOOKINGS, MESSAGES AND FAVOURITES TOO
--
-- Every FK into `companions` is RESTRICT, so the companion rows cannot go until
-- their children do. That is a guard worth taking seriously rather than working
-- around — but a booking against a companion who does not exist is not history,
-- it is part of the same fixture. Nobody met Ananya. A row saying they did is
-- false in exactly the way this migration exists to fix, and leaving it behind
-- would leave the admin dashboard counting meetups that never happened.
--
-- WHY IT IS SAFE
--
-- Every statement is scoped to `fake` — the 22 known seed ids, AND ONLY while
-- the row still carries an images.unsplash.com photo, which every seed row did
-- and no real profile will. So:
--   * a real companion later given one of these ids is untouched;
--   * a seed row an operator has since repointed at a real person, with a real
--     photo, is untouched — along with all of its bookings;
--   * a real member's booking against a real companion is untouched.
--
-- If the fixture is already gone, every statement matches zero rows and this is
-- a no-op. It is safe to run against a database that has never been seeded.
--
-- `users.companionId` is ON DELETE SET NULL and needs no statement here.
-- `purchases` has no FK to companions and is deliberately left alone: money
-- records survive, exactly as they survive account erasure.

-- The fixture, resolved once. A seed row whose photo has been replaced is NOT in
-- here, and nothing below will touch it or anything referencing it.
CREATE TEMPORARY TABLE fake_companions AS
SELECT "id" FROM "companions"
WHERE "id" IN (
  'ananya', 'rohan', 'priya', 'aarav', 'zara', 'kiran', 'ishaan', 'meena',
  'sahil', 'deepika', 'arjun', 'fatima', 'vivek', 'nisha', 'meghna', 'aditya',
  'sanya', 'kabir', 'ritika', 'farhan', 'nandini', 'vikrant'
)
AND "photo" LIKE '%images.unsplash.com%';

-- Children first — every one of these FKs is RESTRICT.
DELETE FROM "favorites" WHERE "companionId" IN (SELECT "id" FROM fake_companions);
DELETE FROM "messages"  WHERE "companionId" IN (SELECT "id" FROM fake_companions);

-- companion_payouts.bookingId is ON DELETE SET NULL, so a payout row would
-- survive its own booking and sit in /admin/payouts as money owed for a meetup
-- with nobody. Payouts for the fixture go with the fixture.
DELETE FROM "companion_payouts" WHERE "companionId" IN (SELECT "id" FROM fake_companions);
DELETE FROM "bookings"  WHERE "companionId" IN (SELECT "id" FROM fake_companions);

DELETE FROM "companions" WHERE "id" IN (SELECT "id" FROM fake_companions);

DROP TABLE fake_companions;
