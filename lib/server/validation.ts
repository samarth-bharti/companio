// lib/server/validation.ts
//
// zod schemas for every API write. Routes parse the request body through these
// before touching the DB, so malformed input fails with 400 (never a 500 from
// Prisma). Each schema mirrors the corresponding DataClient method argument.

import { z } from 'zod';

// A calendar date string, exactly 'YYYY-MM-DD'. Enforced so surge lookups and
// the cron's lexicographic date comparison can never receive a full timestamp
// or junk that would silently mis-sort or mis-window a booking.
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'invalid calendar date');

/**
 * A `dateOnly` that has not already happened. A meetup is a future event: a
 * booking for last Tuesday is meaningless, and the cron auto-completes any
 * `upcoming` booking whose date has passed — so a back-dated booking could be
 * created and completed in the same day, skipping the meetup entirely.
 *
 * Compared against today in UTC. Every Indian timezone is ahead of UTC, so a
 * user booking their own "today" always passes; the only slack is that a date
 * up to one day stale may be accepted near midnight UTC. Erring toward
 * accepting is right — rejecting a user's valid "today" would be worse.
 */
const futureDate = dateOnly.refine(
  (s) => s >= new Date().toISOString().slice(0, 10),
  'date cannot be in the past',
);

export const addCreditsBody = z.object({ count: z.number().int().positive() });

export const boolValueBody = z.object({ value: z.boolean() });

export const genderEnum = z.enum([
  'male',
  'female',
  'nonbinary',
  'self_described',
  'prefer_not_to_say',
]);

export const userBody = z.object({
  firstName: z.string().min(1),
  city: z.string().optional(),
  /** `YYYY-MM-DD`. Validated for adulthood in the route, not here. */
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD').optional(),
  gender: genderEnum.optional(),
  /** Meaningful only alongside `gender: 'self_described'`; ignored otherwise. */
  genderSelfDescribed: z.string().trim().min(1).max(60).optional(),
  sameGenderOnly: z.boolean().optional(),
});

const reviewBody = z.object({ stars: z.number().int().min(1).max(5), text: z.string() });

// pricePaid is always server-computed; review can only be submitted after
// the booking is completed + paid (gated in the patch route). Neither is
// accepted from the client at create time.
export const bookingCreateBody = z.object({
  companionId: z.string().min(1),
  activity: z.string().min(1),
  dateISO: futureDate,
  time: z.string().min(1),
  place: z.string().min(1),
  usedCredit: z.boolean(),
});

// Clients may only reschedule (activity/date/time/place), cancel, or submit a
// review (after the booking completes). status is restricted to 'cancelled' —
// 'completed' is server-only (set by settlePurchase / cron). pricePaid and
// usedCredit are set at create time and never mutable by the client.
export const bookingPatchBody = z.object({
  activity: z.string().optional(),
  dateISO: futureDate.optional(),
  time: z.string().optional(),
  place: z.string().optional(),
  status: z.literal('cancelled').optional(),
  review: reviewBody.optional(),
});

export const favoriteToggleBody = z.object({ companionId: z.string().min(1) });

export const messageAppendBody = z.object({
  from: z.enum(['me', 'them']),
  text: z.string().min(1),
});

export const notificationBody = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

export const planBody = z.object({ plan: z.union([z.literal('plus'), z.null()]) });

// Create-order: the client names the purchase; the server prices it. No amount
// field — the price comes from lib/server/pricing.ts, never the request.
export const orderCreateBody = z.object({
  kind: z.enum(['booking', 'credits', 'unlock', 'plus']),
  packId: z.string().optional(),
  bookingId: z.string().optional(),
});

export const applicationBody = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  activities: z.array(z.string()),
  rate: z.number().int().nonnegative(),
  bio: z.string(),
  idUploaded: z.boolean(),
  backgroundConsent: z.boolean(),
  status: z.enum(['draft', 'submitted']),
  // Optional document-verification metadata, computed client-side and confirmed
  // server-side. The raw file goes via FormData to /api/application/upload.
  idDocType: z.enum(['aadhaar', 'pan']).optional(),
  idDocNumber: z.string().optional(), // validated + masked server-side, never stored raw
});

// ── Admin control schemas ──────────────────────────────────────────────────────
// Every admin mutation parses through one of these before touching the DB.

export const adminGrantCreditsBody = z.object({
  userId: z.string().min(1),
  count: z.number().int().refine((n) => n !== 0, 'count must be non-zero'),
  reason: z.string().max(280).optional(),
});

export const adminBanBody = z.object({
  reason: z.string().max(280).optional(),
});

// The editable surface of a companion profile. This deliberately covers every
// field that drives the explore grid, the map and matching — the old schema
// exposed only name/city/hourlyRate/bio, which meant an admin could create a
// companion but never give them activities, languages, a photo or an area, and
// the card rendered blank.
export const adminEditCompanionBody = z.object({
  name: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  area: z.string().min(1).optional(),
  age: z.number().int().min(18).max(100).optional(),
  hourlyRate: z.number().int().min(0).optional(), // paise
  premium: z.boolean().optional(),
  bio: z.string().optional(),
  photo: z.string().url().optional(),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a #rrggbb hex colour').optional(),
  activities: z.array(z.string().min(1)).max(12).optional(),
  languages: z.array(z.string().min(1)).max(12).optional(),
  suggestions: z.array(z.string().min(1)).max(6).optional(),
  availability: z.string().max(80).optional(),
  availableNow: z.boolean().optional(),
  matchScore: z.number().int().min(0).max(100).optional(),
  verified: z.boolean().optional(),
  topMatch: z.boolean().optional(),
});

export const adminEditUserBody = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  role: z.enum(['user', 'companion', 'admin']).optional(),
  // Date of birth is set-once for the user themselves. An admin can correct a
  // genuine mistake — otherwise "contact support" has no mechanism behind it.
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD').optional(),
});

export const discountCreateBody = z.object({
  code: z.string().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/, 'letters, digits, - and _ only'),
  type: z.enum(['percentage', 'fixed']),
  value: z.number().int().positive(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  note: z.string().max(140).optional(),
}).refine(
  (d) => d.type !== 'percentage' || d.value <= 100,
  { message: 'percentage discount cannot exceed 100', path: ['value'] },
);

export const bookingAdminActionBody = z.object({
  reason: z.string().max(280).optional(),
});
