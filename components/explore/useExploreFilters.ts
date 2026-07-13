import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { COMPANIONS } from '@/lib/data/companions';
import type { Companion } from '@/lib/data/companions';
import { CITIES, DEFAULT_CITY_ID, getCity } from '@/lib/data/cities';
import type { City } from '@/lib/data/cities';
import { useCompanions } from '@/lib/useCompanions';
import { dataClient } from '@/lib/dataClient';
import { getFavorites, toggleFavorite as persistToggle } from '@/lib/appState';
import { getQuiz } from '@/lib/journeyState';

/** Accepts either a city id ('indore') or a display name ('Indore'). */
function matchCity(value: string): City | undefined {
  const v = value.trim().toLowerCase();
  return CITIES.find((c) => c.id === v || c.name.toLowerCase() === v);
}

export type SortKey = 'top_rated' | 'most_reviewed' | 'price' | 'best_match' | 'nearest';
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
  // Default to "nearest" for non-quiz users. "Top rated" is meaningless while
  // no profile has been reviewed — every rating is 0.
  const [sort, setSort] = useState<SortKey>('nearest');
  const [freeNowOnly, setFreeNowOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [quizDone, setQuizDone] = useState(false);
  const [quizName, setQuizName] = useState<string | undefined>(undefined);

  // Hydrate from storage after mount — SSR-safe (no localStorage on server).
  useEffect(() => {
    setFavorites(getFavorites());
    const quiz = getQuiz();
    if (quiz) {
      setQuizDone(true);
      if (quiz.name) setQuizName(quiz.name);
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
        if (cancelled || cityPicked.current || !u?.city) return;
        const match = matchCity(u.city);
        if (match) setCityIdState(match.id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCity: City = useMemo(() => getCity(cityId), [cityId]);

  // The "neutral" sort depends on whether the quiz is done.
  const defaultSort: SortKey = quizDone ? 'best_match' : 'nearest';

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
    setSort(quizDone ? 'best_match' : 'nearest');
    setFreeNowOnly(false);
  }, [quizDone]);

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
      return true;
    });

    if (sort === 'most_reviewed') list = [...list].sort((a, b) => b.reviews - a.reviews);
    else if (sort === 'price') list = [...list].sort((a, b) => a.ratePerMeeting - b.ratePerMeeting);
    else if (sort === 'best_match') list = [...list].sort((a, b) => b.matchScore - a.matchScore);
    else if (sort === 'nearest') list = [...list].sort((a, b) => a.distanceKm - b.distanceKm);
    else list = [...list].sort((a, b) => b.rating - a.rating); // top_rated default

    return list;
  }, [cityCompanions, searchQuery, activityFilters, availability, freeNowOnly, sort]);

  const isFiltered =
    searchQuery !== '' ||
    activityFilters.length > 0 ||
    availability !== 'any' ||
    sort !== defaultSort ||
    freeNowOnly;

  return {
    cityId, setCityId, selectedCity,
    searchQuery, setSearchQuery,
    activityFilters, toggleActivity,
    availability, setAvailability,
    sort, setSort,
    freeNowOnly, setFreeNowOnly,
    favorites, toggleFav,
    quizDone, quizName,
    cityCompanions,
    filteredCompanions,
    isFiltered, clearFilters,
    loading, loadError,
  };
}
