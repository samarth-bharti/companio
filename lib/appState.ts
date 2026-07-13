// Demo app state beyond the core journey keys — bookings, favourites,
// messages, notifications, credits top-ups, membership. All client-side,
// SSR-safe, pure functions (no React). Companion ids reference
// lib/data/companions. Wallet credits live in lib/journeyState (getWallet);
// addCredits below tops that same wallet up.

import { readJSON, writeJSON, canUseStorage } from './storage';
import { getWallet, KEY_WALLET, type GenderId } from './journeyState';

const KEY_BOOKINGS = 'companio_bookings';
const KEY_FAVES = 'companio_favorites';
const KEY_MESSAGES = 'companio_messages';
const KEY_NOTIFS = 'companio_notifications';
const KEY_PLAN = 'companio_plan';
const KEY_APPLICATION = 'companio_companion_application';

// Collision-resistant id. Position-based ids (length + 1) collide when two tabs
// write concurrently or two creates land in the same render; crypto.randomUUID
// (or a time+random fallback) avoids that.
function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}_${rand}`;
}

// ── Bookings ─────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  companionId: string;
  activity: string;
  dateISO: string; // meeting date, e.g. '2026-06-15'
  time: string; // display slot, e.g. 'Morning · 7–9 AM'
  place: string;
  // Mirrors the BookingStatus enum in prisma/schema.prisma. `cancelled` is the
  // member calling it off; `declined` is the companion refusing it, which
  // returns the member's credit.
  status: 'pending_payment' | 'upcoming' | 'completed' | 'cancelled' | 'declined' | 'refunded';
  usedCredit: boolean;
  pricePaid: number; // 0 when a credit was used
  /**
   * The 4-digit code both people read out when they meet, so each knows the
   * other is the person from the app. Optional only for bookings created before
   * the column existed.
   */
  meetupCode?: string;
  review?: { stars: number; text: string };
  createdAt: number; // epoch ms
}

export function getBookings(): Booking[] {
  return readJSON<Booking[]>(KEY_BOOKINGS, []);
}

export function addBooking(b: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
  const all = getBookings();
  const booking: Booking = {
    ...b,
    id: uid('bk'),
    status: 'upcoming',
    createdAt: Date.now(),
  };
  writeJSON(KEY_BOOKINGS, [...all, booking]);
  return booking;
}

export function updateBooking(id: string, patch: Partial<Booking>): void {
  writeJSON(
    KEY_BOOKINGS,
    getBookings().map((b) => (b.id === id ? { ...b, ...patch } : b)),
  );
}

// ── Favourites ───────────────────────────────────────────────────────────────

export function getFavorites(): string[] {
  return readJSON<string[]>(KEY_FAVES, []);
}

export function toggleFavorite(companionId: string): string[] {
  const cur = getFavorites();
  const next = cur.includes(companionId)
    ? cur.filter((x) => x !== companionId)
    : [...cur, companionId];
  writeJSON(KEY_FAVES, next);
  return next;
}

// ── Messages (one thread per companion) ──────────────────────────────────────

export interface ChatMessage {
  id: string;
  from: 'me' | 'them';
  text: string;
  ts: number;
  // Optional, back-compatible extras (older stored messages simply omit them):
  kind?: 'text' | 'sticker'; // 'sticker' → render `text` (a single emoji) large
  reactions?: string[];      // emoji reactions attached to this message
}

type ThreadMap = Record<string, ChatMessage[]>;

export function getThread(companionId: string): ChatMessage[] {
  return readJSON<ThreadMap>(KEY_MESSAGES, {})[companionId] ?? [];
}

export function getThreads(): ThreadMap {
  return readJSON<ThreadMap>(KEY_MESSAGES, {});
}

export function appendMessage(companionId: string, msg: Omit<ChatMessage, 'id' | 'ts'>): ChatMessage {
  const map = getThreads();
  const thread = map[companionId] ?? [];
  const full: ChatMessage = { ...msg, id: uid('m'), ts: Date.now() };
  writeJSON(KEY_MESSAGES, { ...map, [companionId]: [...thread, full] });
  return full;
}

/**
 * Toggle an emoji reaction on a message (tap again to remove — WhatsApp-style).
 * Returns the updated thread so the caller can re-render.
 */
export function reactToMessage(
  companionId: string,
  messageId: string,
  emoji: string,
): ChatMessage[] {
  const map = getThreads();
  const thread = map[companionId] ?? [];
  const updated = thread.map((m) => {
    if (m.id !== messageId) return m;
    const had = m.reactions?.includes(emoji);
    const reactions = had
      ? m.reactions!.filter((e) => e !== emoji)
      : [...(m.reactions ?? []), emoji];
    return { ...m, reactions };
  });
  writeJSON(KEY_MESSAGES, { ...map, [companionId]: updated });
  return updated;
}

// ── Notifications ────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  ts: number;
  read: boolean;
}

export function getNotifications(): AppNotification[] {
  return readJSON<AppNotification[]>(KEY_NOTIFS, []);
}

export function addNotification(n: Pick<AppNotification, 'title' | 'body'>): void {
  const all = getNotifications();
  writeJSON(KEY_NOTIFS, [
    { ...n, id: uid('n'), ts: Date.now(), read: false },
    ...all,
  ]);
}

export function markNotificationsRead(): void {
  writeJSON(KEY_NOTIFS, getNotifications().map((n) => ({ ...n, read: true })));
}

// ── Credits top-up + membership ──────────────────────────────────────────────

/** Adds purchased meetup credits to the journeyState wallet. */
export function addCredits(count: number): void {
  const w = getWallet();
  writeJSON(KEY_WALLET, { credits: w.credits + count, used: w.used });
}

export type Plan = 'plus' | null;

export function getPlan(): Plan {
  if (!canUseStorage()) return null;
  return localStorage.getItem(KEY_PLAN) === 'plus' ? 'plus' : null;
}

export function setPlan(p: Plan): void {
  if (!canUseStorage()) return;
  if (p) localStorage.setItem(KEY_PLAN, p);
  else localStorage.removeItem(KEY_PLAN);
}

// ── Companion application (become-a-companion wizard) ────────────────────────

export interface CompanionApplication {
  name: string;
  city: string;
  /** Carried onto the approved profile — the same-gender filter matches on it. */
  gender?: GenderId;
  activities: string[];
  rate: number;
  bio: string;
  /** Mock verification flags ticked during the wizard. */
  idUploaded: boolean;
  backgroundConsent: boolean;
  status: 'draft' | 'submitted';
}

export function getApplication(): CompanionApplication | null {
  return readJSON<CompanionApplication | null>(KEY_APPLICATION, null);
}

export function saveApplication(a: CompanionApplication): void {
  writeJSON(KEY_APPLICATION, a);
}
