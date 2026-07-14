// lib/meetupTime.ts
//
// When does a meetup actually start?
//
// A Booking stores its day and its slot separately: `dateISO` is "2026-07-15"
// and `time` is a display label like "Evening". Nothing joined them, so the
// countdown pills passed `dateISO` straight to `new Date()`.
//
// Two bugs fell out of that, and both mislead the person who booked:
//
//   1. `new Date("2026-07-15")` is parsed as UTC midnight — 05:30 IST. So an
//      evening meetup counted down to half past five in the MORNING, and every
//      countdown ran up to ~14 hours short.
//   2. A meetup booked for TODAY had a target already in the past, so the
//      countdown returned null and simply vanished — the one day you most want
//      to see it.
//
// Companio operates in India and every place in the catalogue is an Indian city,
// so IST is the meetup's local time by definition. It is fixed at UTC+05:30 with
// no daylight saving, which is why a literal offset is honest here rather than a
// shortcut.

/** Slot start times, matching the labels in BookingStepTime (7-10, 12-3, 5-8). */
const SLOT_START_HOUR: Record<string, number> = {
  morning: 7,
  afternoon: 12,
  evening: 17,
};

const IST_OFFSET = '+05:30';

/**
 * The instant a meetup begins, as a Date.
 *
 * `time` is matched loosely because it is a display string ("Evening",
 * "Evening · 5-8 PM"): we look for the slot name inside it. An unrecognised slot
 * falls back to midday rather than midnight — a meetup with an unknown slot is
 * still a daytime event, and midnight would resurrect bug (2).
 */
export function meetupStart(dateISO: string, time: string | null | undefined): Date {
  const slot = (time ?? '').toLowerCase();
  const hour =
    Object.keys(SLOT_START_HOUR).find((k) => slot.includes(k)) ?? 'afternoon';
  const h = String(SLOT_START_HOUR[hour]).padStart(2, '0');
  return new Date(`${dateISO}T${h}:00:00${IST_OFFSET}`);
}

/** ISO instant for the start of a meetup — what the countdown pills consume. */
export function meetupStartISO(dateISO: string, time: string | null | undefined): string {
  const d = meetupStart(dateISO, time);
  return Number.isNaN(d.getTime()) ? dateISO : d.toISOString();
}
