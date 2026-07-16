// lib/server/serialize.ts
//
// Map Prisma rows → the plain TS shapes the frontend already expects
// (lib/appState, lib/journeyState). Two conversions matter:
//   - BigInt `ts` columns → number (BigInt is not JSON-serializable)
//   - DateTime `createdAt` → epoch ms (the frontend uses numbers)

import type {
  Booking as PBooking,
  Message as PMessage,
  Notification as PNotification,
  Wallet as PWallet,
  Companion as PCompanion,
} from '@prisma/client';
import type { Booking, ChatMessage, AppNotification } from '@/lib/appState';
import type { Wallet } from '@/lib/journeyState';
import type { Companion } from '@/lib/data/companions';

export const toWallet = (w: Pick<PWallet, 'credits' | 'used'>): Wallet => ({
  credits: w.credits,
  used: w.used,
});

export function toBooking(b: PBooking): Booking {
  return {
    id: b.id,
    companionId: b.companionId,
    activity: b.activity,
    dateISO: b.dateISO,
    time: b.time,
    place: b.place,
    status: b.status,
    usedCredit: b.usedCredit,
    pricePaid: b.pricePaid,
    meetupCode: b.meetupCode || undefined,
    review: (b.review as { stars: number; text: string } | null) ?? undefined,
    createdAt: b.createdAt.getTime(),
  };
}

export const toMessage = (m: PMessage): ChatMessage => ({
  id: m.id,
  from: m.from,
  text: m.text,
  kind: m.kind,
  reactions: m.reactions,
  ts: Number(m.ts),
});

export const toNotification = (n: PNotification): AppNotification => ({
  id: n.id,
  title: n.title,
  body: n.body,
  ts: Number(n.ts),
  read: n.read,
});

/**
 * A database row → the public Companion shape.
 *
 * THIS IS AN ALLOWLIST, AND IT HAS TO STAY ONE.
 *
 * It used to be `const { reviewCount, createdAt, ...rest } = c; return { ...rest }
 * as Companion` — five named columns removed and everything else forwarded. The
 * callers (lib/server/catalogue.ts, app/api/companions) query with `where` and no
 * `select`, so "everything else" is every column on the table, and the
 * `as Companion` cast is what stopped the compiler from mentioning it.
 *
 * What that shipped to anonymous callers of GET /api/companions:
 *
 *   payoutUpi  — "9876543210@paytm". Where a companion gets PAID. A UPI VPA
 *                normally embeds a phone number or a legal name.
 *   banReason  — an operator's private note about a person.
 *   suspended, bannedAt, hourlyRate — internal moderation and pricing state.
 *
 * redactCompanion() did not save it: that spreads the object and overrides a few
 * keys, so the LOCKED payload carried the UPI id too.
 *
 * A denylist against a table that keeps growing loses by default — every new
 * column is public until somebody remembers. An allowlist fails the other way:
 * a new column is private until somebody adds it here, on purpose, and the type
 * checker points at this function when the shape changes.
 *
 * `verified` DOES cross: the badge renders off it, and while it was stripped
 * every card drew a hardcoded "Verified" tick regardless of the column.
 * `distanceKm` does NOT: an authored constant rendered as "3.2 km away", a
 * distance from a member whose location we have never known.
 */
export function toCompanion(c: PCompanion): Companion {
  return {
    id: c.id,
    name: c.name,
    firstName: c.firstName,
    maskedName: c.maskedName,
    city: c.city,
    area: c.area,
    age: c.age ?? undefined,
    activities: c.activities,
    languages: c.languages,
    rating: c.rating,
    reviews: c.reviewCount,
    ratePerMeeting: c.ratePerMeeting,
    bio: c.bio,
    suggestions: c.suggestions,
    photo: c.photo,
    // Forwarded so redactCompanion can swap it into `photo` for a locked viewer.
    // It is the destroyed copy, so it is safe in an unlocked payload too.
    photoBlurred: c.photoBlurred ?? undefined,
    accent: c.accent,
    gender: (c.gender ?? undefined) as Companion['gender'],
    sameGenderNote: c.sameGenderNote ?? undefined,
    topMatch: c.topMatch ?? undefined,
    verified: c.verified ?? undefined,
    availableNow: c.availableNow,
    availability: c.availability,
    matchScore: c.matchScore,
    reviewsList: c.reviewsList as Companion['reviewsList'],
  };
}
