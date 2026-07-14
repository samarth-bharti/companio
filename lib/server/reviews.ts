// lib/server/reviews.ts
//
// Turning Booking.review rows into a companion's public rating.
//
// The Companion table has carried `rating`, `reviewCount` and `reviewsList`
// since the schema was written, and nothing ever wrote to them. Members were
// asked to rate a meetup, thanked for it, and the answer was stored on the
// booking and read by nobody: every companion sat at rating 0 with an empty
// review list no matter how many five-star meetups they had.
//
// The aggregate is DERIVED, never incremented. Recomputing from the source rows
// costs one query and means an edited, deleted or admin-removed review heals the
// average instead of leaving it permanently skewed — an incremented counter can
// only ever drift away from the truth.

import type { PrismaClient, Prisma } from '@prisma/client';

/** One entry as the profile page renders it (`components/companion/CompanionProfileReviews`). */
type PublicReview = {
  name: string;
  city: string;
  stars: number;
  text: string;
};

/** What a Booking.review JSON blob holds. */
type StoredReview = {
  stars?: unknown;
  text?: unknown;
};

/** The newest N reviews carry the profile; older ones only move the average. */
const MAX_LISTED = 12;

function isValidStars(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 5;
}

/**
 * Recompute one companion's rating, review count and public review list from the
 * bookings that carry a review. Safe to call repeatedly; never throws in a way
 * that should fail the member's request — a rating that is briefly stale is far
 * better than a review submission that errors.
 */
export async function recomputeCompanionReviews(
  prisma: PrismaClient,
  companionId: string,
): Promise<void> {
  try {
    const rows = await prisma.booking.findMany({
      where: { companionId },
      orderBy: { updatedAt: 'desc' },
      select: {
        review: true,
        user: { select: { firstName: true, city: true } },
      },
    });

    const reviewed = rows
      .map((r) => ({ review: r.review as StoredReview | null, user: r.user }))
      .filter((r) => r.review && isValidStars(r.review.stars));

    if (reviewed.length === 0) {
      await prisma.companion.update({
        where: { id: companionId },
        data: { rating: 0, reviewCount: 0, reviewsList: [] },
      });
      return;
    }

    const total = reviewed.reduce((sum, r) => sum + (r.review!.stars as number), 0);
    // One decimal place: "4.8", not "4.799999999999999".
    const rating = Math.round((total / reviewed.length) * 10) / 10;

    // Only reviews with words in them are worth showing. A bare 5-star with no
    // text still counts towards the average — it just has nothing to display.
    const listed: PublicReview[] = reviewed
      .filter((r) => typeof r.review!.text === 'string' && (r.review!.text as string).trim() !== '')
      .slice(0, MAX_LISTED)
      .map((r) => ({
        // The reviewer's real first name, per the intent recorded in
        // lib/data/companions.ts — never an invented one.
        name: r.user?.firstName?.trim() || 'A member',
        city: r.user?.city?.trim() || '',
        stars: r.review!.stars as number,
        text: (r.review!.text as string).trim(),
      }));

    await prisma.companion.update({
      where: { id: companionId },
      data: {
        rating,
        reviewCount: reviewed.length,
        reviewsList: listed as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.warn(
      '[reviews] recompute failed for',
      companionId,
      err instanceof Error ? err.message : err,
    );
  }
}
