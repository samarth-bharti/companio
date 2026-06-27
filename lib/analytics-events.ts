// lib/analytics-events.ts
//
// Central event taxonomy. Every product event has exactly ONE typed name and a
// typed payload, so every analytics sink (GA4, PostHog) receives consistent,
// documented events. Adding an event = add a line here; `track()` then enforces
// the payload shape at every call site.

export interface EventMap {
  page_view: { path: string };
  view_companion: { companionId: string };
  search: { query?: string; city?: string };
  unlock_intent: { companionId?: string };
  unlock_success: { method?: string };
  booking_start: { companionId: string };
  booking_complete: { companionId: string; bookingId: string };
  signup: { role?: string };
  login: { method?: string };
  plan_subscribe: { plan: string };
  add_credits: { count: number };
  web_vitals: { metric: string; value: number; rating?: string; id?: string };
}

export type EventName = keyof EventMap;
