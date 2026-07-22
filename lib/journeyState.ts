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
  /**
   * The companion the quiz actually matched, computed from the answers below.
   * It used to be the constant `TOP_MATCH_ID` — the same Mumbai companion for
   * every member, in every city, whatever they answered.
   *
   * Empty when the chosen city has nobody in it. There is no match to name.
   */
  matchedId: string;
  /**
   * The answers themselves, kept so the explore grid can rank against them.
   * Without these, "Best match" had nothing to sort by but an authored number.
   */
  activities: string[];
  languages: string[];
  sameGender: boolean;
}

/** The four the DB can store, plus the two that carry no matchable category. */
export type GenderId = 'male' | 'female' | 'nonbinary' | 'self_described' | 'prefer_not_to_say';

/** Only these three are a category the same-gender filter can compare on. */
export const MATCHABLE_GENDERS = ['male', 'female', 'nonbinary'] as const;

export function isMatchableGender(g: string | undefined | null): g is 'male' | 'female' | 'nonbinary' {
  return g === 'male' || g === 'female' || g === 'nonbinary';
}

export interface DemoUser {
  firstName: string;
  /** Carried from registration so the companion application can pre-fill it
   *  (the two flows are one continuous onboarding, not separate forms). */
  city?: string;
  /**
   * The register wizard has always asked for this and always thrown it away:
   * StepDone never sent it, the API refused it, and the column stayed null. It
   * is stored now because the same-gender filter is a real promise that needs it.
   */
  gender?: GenderId;
  /** Only ever set when `gender === 'self_described'`. */
  genderSelfDescribed?: string;
  /** "Only show me companions of my own gender." */
  sameGenderOnly?: boolean;
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

/** Returns the stored demo user (from register/quiz name step), or default demo user. */
export function getUser(): DemoUser | null {
  const user = readJSON<DemoUser | null>(KEY_USER, null);
  if (!user && canUseStorage()) {
    const defaultUser: DemoUser = {
      firstName: 'Prashant',
      city: 'indore',
      gender: 'male',
      dateOfBirth: '1998-05-15',
    };
    writeJSON(KEY_USER, defaultUser);
    return defaultUser;
  }
  return user;
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
