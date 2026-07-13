import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { COMPANIONS } from '@/lib/data/companions';
import type { Companion } from '@/lib/data/companions';
import { CITIES, DEFAULT_CITY_ID, getCity } from '@/lib/data/cities';
import type { City } from '@/lib/data/cities';
import { useCompanions } from '@/lib/useCompanions';
import { dataClient } from '@/lib/dataClient';
import { getFavorites, toggleFavorite as persistToggle } from '@/lib/appState';
import { getQuiz, isMatchableGender } from '@/lib/journeyState';
import { scoreCompanion } from '@/lib/matching';

/** Accepts either a city id ('indore') or a display name ('Indore'). */
function matchCity(value: string): City | undefined {
  const v = value.trim().toLowerCase();
  return CITIES.find((c) => c.id === v || c.name.toLowerCase() === v);
}

/**
 * 'nearest' is gone. It sorted on `Companion.distanceKm`, an authored constant
 * in the seed file — not a distance from the member, who we cannot locate any
 * closer than the city they picked. It was the DEFAULT sort, so the grid's
 * running order was decided by a number that meant nothing.
 */
export type SortKey = 'top_rated' | 'most_reviewed' | 'price' | 'best_match';
export type Availability = 'any' | 'weekends' | 'evenings';

/** Stable availability slot per companion id: 0=any-time, 1=weekends, 2=evenings. */
function stableSlot(id: string): 0 | 1 | 2 {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) & 0xfff;
  return (h % 3) as 0 | 1 | 2;
}

/**
 * Activity filter options. Derived from the seed catalogue rather than the
 * fetched rows so the filter chips do not pop in after load, and so a city with
 * nobody in it still offers the same vocabulary.
 */
export const ALL_ACTIVITIES = Array.from(
  new Set(COMPANIONS.flatMap((c) => c.activities)),
).sort();

export interface ExploreFiltersState {
  cityId: string;
  setCityId: (id: string) => void;
  selectedCity: City;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activityFilters: string[];
  toggleActivity: (act: string) => void;
  availability: Availability;
  setAvailability: (v: Availability) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  freeNowOnly: boolean;
  setFreeNowOnly: (v: boolean) => void;
  favorites: string[];
  toggleFav: (id: string) => void;
  quizDone: boolean;
  quizName: string | undefined;
  /** "Only companions of my own gender." Persisted on the account. */
  sameGenderOnly: boolean;
  setSameGenderOnly: (v: boolean) => void;
  /**
   * The member's own gender, when it is one we can compare on. Undefined means
   * the filter cannot run — they have not told us, or they self-described /
   * declined, which is not a category any companion can be equal to. The UI
   * disables the toggle and says why rather than silently matching them wrong.
   */
  myGender: 'male' | 'female' | 'nonbinary' | undefined;
  /** Everyone in the selected city, before filters. Empty ⇒ city not served. */
  cityCompanions: Companion[];
  filteredCompanions: Companion[];
  isFiltered: boolean;
  clearFilters: () => void;
  loading: boolean;
  loadError: boolean;
}

export function useExploreFilters(): ExploreFiltersState {
  const { companions, loading, error: loadError } = useCompanions();

  const [cityId, setCityIdState] = useState(DEFAULT_CITY_ID);
  // Once the member picks a city by hand, nothing may pull it back — the
  // account lookup below resolves asynchronously and could otherwise land on
  // top of a choice already made.
  const cityPicked = useRef(false);
  const setCityId = useCallback((id: string) => {
    cityPicked.current = true;
    setCityIdState(id);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilters, setActivityFilters] = useState<string[]>([]);
  const [availability, setAvailability] = useState<Availability>('any');
  // "Best match" for everyone. It is a real score now: computed from the quiz
  // answers when there are any, and neutral-and-equal for everyone when there
  // are not — which leaves the grid in the order the server sent it, rather than
  // ranked by a made-up distance. "Top rated" would be meaningless anyway while
  // no profile has been reviewed.
  const [sort, setSort] = useState<SortKey>('best_match');
  const [freeNowOnly, setFreeNowOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [quizName, setQuizName] = useState<string | undefined>(undefined);
  const [myGender, setMyGender] = useState<'male' | 'female' | 'nonbinary' | undefined>();
  const [quizAnswers, setQuizAnswers] = useState<{ activities: string[]; languages: string[] } | null>(null);
  const [sameGenderOnly, setSameGenderOnlyState] = useState(false);

  // Writing straight through to the account: this is a comfort preference, and
  // it has to hold on the next device, not just this tab.
  const setSameGenderOnly = useCallback((v: boolean) => {
    setSameGenderOnlyState(v);
    void dataClient.setSameGenderOnly(v).catch(() => {});
  }, []);

  // Hydrate from storage after mount — SSR-safe (no localStorage on server).
  useEffect(() => {
    setFavorites(getFavorites());
    const quiz = getQuiz();
    if (quiz) {
      setQuizDone(true);
      if (quiz.name) setQuizName(quiz.name);
      // The answers themselves — "Best match" ranks against these. Before they
      // were stored, the sort had nothing to go on but an authored matchScore.
      setQuizAnswers({
        activities: quiz.activities ?? [],
        languages: quiz.languages ?? [],
      });
      // Default to "Best match" when the quiz has been completed.
      setSort('best_match');
      const match = quiz.city ? matchCity(quiz.city) : undefined;
      if (match) setCityIdState(match.id);
    }
  }, []);

  /**
   * The city on the account outranks the quiz's: it is the answer the member
   * gave while signing up, and it survives a cleared localStorage. Without this
   * a member who registered in Indore landed on Mumbai's roster.
   */
  useEffect(() => {
    let cancelled = false;
    dataClient
      .getUser()
      .then((u) => {
        if (cancelled || !u) return;
        if (!cityPicked.current && u.city) {
          const match = matchCity(u.city);
          if (match) setCityIdState(match.id);
        }
        // The gender the member gave at signup, and whether they asked to see
        // only their own. Both live on the account, not in this tab.
        if (isMatchableGender(u.gender)) setMyGender(u.gender);
        setSameGenderOnlyState(!!u.sameGenderOnly);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCity: City = useMemo(() => getCity(cityId), [cityId]);

  // One neutral sort, quiz or no quiz — it degrades to "everyone scores the
  // same" when there are no answers to rank against.
  const defaultSort: SortKey = 'best_match';

  /**
   * Companions who actually list in the selected city.
   *
   * This replaced `localizedCompanions`, which mapped every companion onto the
   * selected city and swapped their neighbourhood for a local-sounding one. Ten
   * cities, one roster of fourteen Mumbai people, each wearing a different area
   * name. A member in Jaipur was shown someone who lives 900 km away.
   */
  const cityCompanions = useMemo(
    () => companions.filter((c) => c.city === selectedCity.name),
    [companions, selectedCity],
  );

  const toggleActivity = useCallback((act: string) => {
    setActivityFilters((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act],
    );
  }, []);

  const toggleFav = useCallback((id: string) => {
    setFavorites(persistToggle(id));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setActivityFilters([]);
    setAvailability('any');
    setSort('best_match');
    setFreeNowOnly(false);
    setSameGenderOnly(false);
  }, [quizDone, setSameGenderOnly]);

  // The filter can only run when both sides have a category to compare. Asking
  // for it without a gender of your own is not an error — it just cannot narrow
  // anything, and the UI explains that instead of quietly showing you everyone.
  const sameGenderApplies = sameGenderOnly && myGender !== undefined;

  const filteredCompanions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = cityCompanions.filter((c) => {
      if (q) {
        const nameHit = c.name.toLowerCase().includes(q);
        const actHit = c.activities.some((a) => a.toLowerCase().includes(q));
        if (!nameHit && !actHit) return false;
      }
      if (activityFilters.length > 0 && !activityFilters.some((a) => c.activities.includes(a)))
        return false;
      const slot = stableSlot(c.id);
      if (availability === 'weekends' && slot === 2) return false;
      if (availability === 'evenings' && slot === 1) return false;
      if (freeNowOnly && !c.availableNow) return false;
      // The same-gender promise, finally kept. The quiz has told members
      // "same-gender companions only" since day one and nothing filtered —
      // companions did not even have a gender to compare against.
      //
      // A companion who has not declared one is excluded, not assumed: showing
      // someone we are guessing about is exactly the failure this prevents.
      if (sameGenderApplies && c.gender !== myGender) return false;
      return true;
    });

    if (sort === 'most_reviewed') list = [...list].sort((a, b) => b.reviews - a.reviews);
    else if (sort === 'price') list = [...list].sort((a, b) => a.ratePerMeeting - b.ratePerMeeting);
    else if (sort === 'best_match') {
      // Ranked against what the member actually answered. Falls back to the
      // authored matchScore only when there are no answers to rank against —
      // which is also the only case where "best match" means nothing anyway.
      list = quizAnswers
        ? [...list].sort((a, b) => scoreCompanion(b, quizAnswers) - scoreCompanion(a, quizAnswers))
        : [...list].sort((a, b) => b.matchScore - a.matchScore);
    }
    else list = [...list].sort((a, b) => b.rating - a.rating); // top_rated default

    return list;
  }, [cityCompanions, searchQuery, activityFilters, availability, freeNowOnly, sort, sameGenderApplies, myGender, quizAnswers]);

  const isFiltered =
    searchQuery !== '' ||
    activityFilters.length > 0 ||
    availability !== 'any' ||
    sort !== defaultSort ||
    freeNowOnly ||
    sameGenderOnly;

  return {
    cityId, setCityId, selectedCity,
    searchQuery, setSearchQuery,
    activityFilters, toggleActivity,
    availability, setAvailability,
    sort, setSort,
    freeNowOnly, setFreeNowOnly,
    favorites, toggleFav,
    quizDone, quizName,
    sameGenderOnly, setSameGenderOnly, myGender,
    cityCompanions,
    filteredCompanions,
    isFiltered, clearFilters,
    loading, loadError,
  };
}
