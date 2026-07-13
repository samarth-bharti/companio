// lib/matching.ts
//
// How well a companion fits what the member actually told us.
//
// WHAT THIS REPLACES
//
// `Companion.matchScore` was an authored number between 70 and 98, written by
// hand into the seed file. It drove the "Best match" sort, the "★ Top match"
// ribbon, and the quiz's entire result screen — which always revealed the same
// Mumbai companion (`TOP_MATCH_ID = 'ananya'`) no matter what anyone answered,
// or which city they were in. The quiz asked seven questions and read none of
// them. A member in Indore who asked for gym partners and Marathi was shown a
// museum-loving Tamil speaker in Bandra, and told she was their best match.
//
// The score below is computed from the two things a companion genuinely
// declares and a member genuinely asks for: what they like doing, and what they
// speak. Nothing here is decorative — if we cannot compare it, we do not score
// it, and a member who answered nothing gets a neutral score rather than a
// fabricated one.
//
// Gender is NOT scored. "Same gender only" is a hard filter (a comfort promise),
// never a soft preference that a high activity overlap could outvote.

import type { Companion } from '@/lib/data/companions';
import type { QuizAnswers } from '@/components/quiz/quizData';

/**
 * Quiz activity ids → the activity labels companions actually list.
 *
 * The quiz speaks in moods ("Just talking") and the catalogue speaks in
 * activities ("Café Chat"). This is the only place the two vocabularies meet.
 */
const ACTIVITY_MAP: Record<string, string[]> = {
  walks: ['City Walk', 'Morning Run', 'Photography Walk'],
  gym: ['Gym Buddy', 'Morning Run'],
  cafe: ['Café Chat', 'Book Browsing'],
  events: ['Live Events'],
  exploring: ['City Walk', 'Street Food Tour', 'Museum', 'Photography Walk'],
  talking: ['Café Chat', 'Elder Company', 'Book Browsing'],
};

/** Quiz language ids → the language names on a companion profile. */
const LANGUAGE_MAP: Record<string, string> = {
  hindi: 'Hindi',
  english: 'English',
  marathi: 'Marathi',
  tamil: 'Tamil',
  telugu: 'Telugu',
  bengali: 'Bengali',
  kannada: 'Kannada',
  gujarati: 'Gujarati',
};

/** The activity labels implied by a set of quiz activity ids. */
export function activitiesFor(ids: string[]): string[] {
  return [...new Set(ids.flatMap((id) => ACTIVITY_MAP[id] ?? []))];
}

/** The language names implied by a set of quiz language ids. */
export function languagesFor(ids: string[]): string[] {
  return ids.map((id) => LANGUAGE_MAP[id]).filter((l): l is string => !!l);
}

const NEUTRAL = 50;
const ACTIVITY_WEIGHT = 60;
const LANGUAGE_WEIGHT = 40;

/**
 * 0–100. How much of what this member asked for does this companion cover?
 *
 * Each axis is the fraction of the member's asks that the companion satisfies,
 * so someone who wants three things and offers all three scores higher than
 * someone who offers one. An axis the member left blank is not counted at all —
 * it neither helps nor hurts — and a member who answered nothing scores NEUTRAL
 * for everyone, because we have no basis to rank them and will not invent one.
 */
export function scoreCompanion(companion: Companion, answers: Pick<QuizAnswers, 'activities' | 'languages'>): number {
  let earned = 0;
  let available = 0;

  // Scored per ANSWER, not per expanded label. "Gym & runs" maps to both
  // "Gym Buddy" and "Morning Run", and a companion who offers either has fully
  // satisfied that answer — scoring the fraction of labels covered would mark
  // them half-right for giving the member exactly what they asked for.
  if (answers.activities.length > 0) {
    const hit = answers.activities.filter((id) =>
      activitiesFor([id]).some((label) => companion.activities.includes(label)),
    ).length;
    earned += (hit / answers.activities.length) * ACTIVITY_WEIGHT;
    available += ACTIVITY_WEIGHT;
  }

  if (answers.languages.length > 0) {
    const wanted = languagesFor(answers.languages);
    if (wanted.length > 0) {
      const hit = wanted.filter((l) => companion.languages.includes(l)).length;
      earned += (hit / wanted.length) * LANGUAGE_WEIGHT;
      available += LANGUAGE_WEIGHT;
    }
  }

  if (available === 0) return NEUTRAL;
  return Math.round((earned / available) * 100);
}

/**
 * Everyone in the member's city, best fit first, with the same-gender promise
 * honoured as a filter rather than a preference.
 *
 * `myGender` undefined ⇒ we cannot compare, so we do not pretend to: the filter
 * is skipped rather than silently excluding everyone or no one.
 */
export function rankCompanions(
  companions: Companion[],
  answers: Pick<QuizAnswers, 'activities' | 'languages' | 'comfort'>,
  myGender?: 'male' | 'female' | 'nonbinary',
): Companion[] {
  const sameGenderOnly = answers.comfort?.sameGender && myGender !== undefined;
  const eligible = sameGenderOnly
    ? companions.filter((c) => c.gender === myGender)
    : companions;

  return [...eligible].sort((a, b) => scoreCompanion(b, answers) - scoreCompanion(a, answers));
}
