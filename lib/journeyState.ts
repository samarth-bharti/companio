// Pure-function localStorage demo state. SSR-safe: every getter guards
// `typeof window === 'undefined'` and returns the declared default.
// No React, no provider — import freely in client components or server code.

import { canUseStorage, readJSON, writeJSON } from './storage';

export interface Wallet {
  credits: number;
  used: number;
}

export interface QuizResult {
  name: string;
  city: string;
  matchedId: string;
}

export interface DemoUser {
  firstName: string;
  /** Carried from registration so the companion application can pre-fill it
   *  (the two flows are one continuous onboarding, not separate forms). */
  city?: string;
  /**
   * `YYYY-MM-DD`. Collected by the register wizard, which already refuses under
   * 18s in the browser — but the value used to be discarded, so the server had
   * no idea how old anyone was. Booking and companion applications now require
   * it (see lib/server/age.ts). Set-once on the server.
   */
  dateOfBirth?: string;
}

// ── Keys ─────────────────────────────────────────────────────────────────────

const KEY_UNLOCKED      = 'companio_unlocked';
export const KEY_WALLET = 'companio_wallet'; // single source of truth — also used by lib/appState
const KEY_QUIZ      = 'companio_quiz';
const KEY_USER      = 'companio_user';
const KEY_WELCOMED  = 'companio_welcomed';

// Storage helpers (canUseStorage / readJSON / writeJSON) are shared from
// ./storage — see lib/appState for the other consumer.

// ── Unlocked ──────────────────────────────────────────────────────────────────

/** Returns true when the user has paid and unlocked all profiles. */
export function getUnlocked(): boolean {
  if (!canUseStorage()) return false;
  return localStorage.getItem(KEY_UNLOCKED) === '1';
}

export function setUnlocked(v: boolean): void {
  if (!canUseStorage()) return;
  if (v) {
    localStorage.setItem(KEY_UNLOCKED, '1');
  } else {
    localStorage.removeItem(KEY_UNLOCKED);
  }
}

// ── Wallet ────────────────────────────────────────────────────────────────────

const WALLET_DEFAULT: Wallet = { credits: 2, used: 0 };

/** Returns current wallet. Defaults to 2 credits / 0 used for new visitors. */
export function getWallet(): Wallet {
  return readJSON<Wallet>(KEY_WALLET, WALLET_DEFAULT);
}

/**
 * Decrements credits by 1 (never below 0) and increments used by 1.
 * Persists the change. Returns the new wallet state.
 */
export function decrementMeeting(): Wallet {
  const current = getWallet();
  const next: Wallet = {
    credits: Math.max(0, current.credits - 1),
    used: current.used + 1,
  };
  writeJSON(KEY_WALLET, next);
  return next;
}

// ── Quiz result ───────────────────────────────────────────────────────────────

/** Returns the stored quiz result, or null if the quiz hasn't been completed. */
export function getQuiz(): QuizResult | null {
  return readJSON<QuizResult | null>(KEY_QUIZ, null);
}

export function setQuiz(q: QuizResult): void {
  writeJSON(KEY_QUIZ, q);
}

// ── Demo user ─────────────────────────────────────────────────────────────────

/** Returns the stored demo user (from register/quiz name step), or null. */
export function getUser(): DemoUser | null {
  return readJSON<DemoUser | null>(KEY_USER, null);
}

export function setUser(u: DemoUser): void {
  writeJSON(KEY_USER, u);
}

/** Signs the demo user out without touching wallet/unlock/quiz state. */
export function clearUser(): void {
  if (!canUseStorage()) return;
  localStorage.removeItem(KEY_USER);
}

// ── Welcomed ──────────────────────────────────────────────────────────────────

/** Returns true when the first-visit welcome journey has already played. */
export function getWelcomed(): boolean {
  if (!canUseStorage()) return false;
  return localStorage.getItem(KEY_WELCOMED) === '1';
}

export function setWelcomed(v: boolean): void {
  if (!canUseStorage()) return;
  if (v) {
    localStorage.setItem(KEY_WELCOMED, '1');
  } else {
    localStorage.removeItem(KEY_WELCOMED);
  }
}

// ── Reset ─────────────────────────────────────────────────────────────────────

/** Removes all journey keys — useful for dev/test resets. */
export function resetJourney(): void {
  if (!canUseStorage()) return;
  [KEY_UNLOCKED, KEY_WALLET, KEY_QUIZ, KEY_USER, KEY_WELCOMED].forEach((k) =>
    localStorage.removeItem(k)
  );
}
