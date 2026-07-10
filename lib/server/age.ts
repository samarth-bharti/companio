// lib/server/age.ts
//
// Companio is 18+. That rule was enforced in exactly one place: a client-side
// check in the register wizard (components/auth/StepAboutYou.tsx), which
// disabled a button and then threw the date of birth away. Nothing persisted it,
// no API asked for it, and Google OAuth does not supply one — so in a live build
// the age gate did not exist at all.
//
// A platonic meetup marketplace putting an adult in a room with a minor is the
// single worst thing this product can do. The gate belongs on the server.

/** Minimum age to use Companio, in years. */
export const MIN_AGE = 18;

/**
 * Whole years elapsed, handling the "birthday hasn't happened yet this year"
 * case that a naive year subtraction gets wrong for up to 364 days.
 * `now` is injectable so tests don't depend on today's date.
 */
export function ageInYears(dob: Date, now: Date = new Date()): number {
  let age = now.getFullYear() - dob.getFullYear();
  const monthDelta = now.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

/**
 * True only for a real, past date of birth of someone at least MIN_AGE.
 * `null`/`undefined` is false: an unknown age is never an adult age.
 */
export function isAdult(dob: Date | null | undefined, now: Date = new Date()): boolean {
  if (!dob) return false;
  if (Number.isNaN(dob.getTime())) return false;
  if (dob.getTime() > now.getTime()) return false; // born in the future
  const age = ageInYears(dob, now);
  // 150 guards a typo'd century ("0198-05-04") reading as a very old adult.
  return age >= MIN_AGE && age <= 150;
}

/** Parse a `YYYY-MM-DD` string to a UTC Date, or null if it isn't one. */
export function parseDateOfBirth(raw: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const d = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  // Rejects 2026-02-31, which Date silently rolls into March.
  if (d.toISOString().slice(0, 10) !== raw) return null;
  return d;
}
