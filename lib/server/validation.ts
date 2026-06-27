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

export const addCreditsBody = z.object({ count: z.number().int().positive() });

export const boolValueBody = z.object({ value: z.boolean() });

export const userBody = z.object({
  firstName: z.string().min(1),
  city: z.string().optional(),
});

const reviewBody = z.object({ stars: z.number().int().min(1).max(5), text: z.string() });

// pricePaid is always server-computed; review can only be submitted after
// the booking is completed + paid (gated in the patch route). Neither is
// accepted from the client at create time.
export const bookingCreateBody = z.object({
  companionId: z.string().min(1),
  activity: z.string().min(1),
  dateISO: dateOnly,
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
  dateISO: dateOnly.optional(),
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

export const adminEditCompanionBody = z.object({
  name: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  hourlyRate: z.number().int().min(0).optional(), // paise
  premium: z.boolean().optional(),
  bio: z.string().optional(),
  availableNow: z.boolean().optional(),
  verified: z.boolean().optional(),
});

export const adminEditUserBody = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  city: z.string().optional(),
  role: z.enum(['user', 'companion', 'admin']).optional(),
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
