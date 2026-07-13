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
    review: (b.review as { stars: number; text: string } | null) ?? undefined,
    createdAt: b.createdAt.getTime(),
  };
}

export const toMessage = (m: PMessage): ChatMessage => ({
  id: m.id,
  from: m.from,
  text: m.text,
  ts: Number(m.ts),
});

export const toNotification = (n: PNotification): AppNotification => ({
  id: n.id,
  title: n.title,
  body: n.body,
  ts: Number(n.ts),
  read: n.read,
});

export function toCompanion(c: PCompanion): Companion {
  // reviewsList is stored as Json; the TS Companion type owns its exact shape.
  // createdAt/updatedAt are db-only — destructured out so they don't leak into
  // the frontend shape.
  //
  // `verified` DOES cross to the client: the badge is rendered from it. While it
  // was stripped here, every card drew a hardcoded "Verified" tick regardless of
  // what the column said.
  //
  // `distanceKm` stops here too. The column still exists, but it is an authored
  // constant that was rendered as "3.2 km away" — a distance from a member whose
  // location we have never known. It is not the client's business.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { reviewCount, reviewsList, createdAt, updatedAt, distanceKm, ...rest } = c;
  return {
    ...rest,
    reviews: reviewCount,
    reviewsList: reviewsList as Companion['reviewsList'],
  } as Companion;
}
