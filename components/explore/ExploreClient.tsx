'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { dataClient } from '@/lib/dataClient';
import { emitDataChange } from '@/lib/dataEvents';
import { track } from '@/lib/analytics';
import type { Companion } from '@/lib/data/companions';
import { CITIES } from '@/lib/data/cities';
import { ExploreHeader } from './ExploreHeader';
import { ExploreFilters } from './ExploreFilters';
import type { ViewMode } from './ExploreFilters';
import { CompanionGrid } from './CompanionGrid';
import { UnlockSheet } from './UnlockSheet';
import { MilestoneSeal } from '@/components/journey/MilestoneSeal';
import { ParticleField } from '@/components/journey/ParticleField';
import { useViewerReady, useViewerResolved } from '@/lib/useViewerReady';
import { useExploreFilters } from './useExploreFilters';
import { WelcomeOverlay } from './WelcomeOverlay';
import { CompareTray } from './CompareTray';
import { MapView } from './MapView';
import { ActivityTicker } from './ActivityTicker';


/**
 * ExploreClient — full explore-page orchestrator (spec §4.1 + §4.4).
 *
 * Rendered inside <Suspense> because useSearchParams() requires it in App Router.
 * All localStorage reads are deferred to useEffect (SSR-safe).
 *
 * Unlock sequence timing (§4.4 B1 — PRESERVED):
 *   t=0     sheet closes + MilestoneSeal presses + confetti
 *   t=200ms develop-wave radiates outward from the tapped card
 *   t=1.6s  ParticleField gold drift mounts (self-fades)
 *   t=2.2s  developing cleared; grid settles
 */
export function ExploreClient() {
  const router = useRouter();
  const params = useSearchParams();
  const reduced = useEffectiveReducedMotion();
  const matched = params.get('matched') === '1';

  // ── Unlock / sheet state (preserved exactly) ──────────────────────────────
  const [unlocked, setUnlocked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seed, setSeed] = useState<Companion | null>(null);
  const [developing, setDeveloping] = useState<{ tappedId: string } | null>(null);
  const [unlockedCount, setUnlockedCount] = useState(1);
  const [showSeal, setShowSeal] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  // ── Account state — unlock (the ₹199 step) requires a free account ────────
  const [signedIn, setSignedIn] = useState(false);

  // ── View mode (grid / map) ────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // ── Compare state ────────────────────────────────────────────────────────
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // ── Surprise me ──────────────────────────────────────────────────────────
  const surpriseIdxRef = useRef(0);
  const [highlightId, setHighlightId] = useState<string | null>(null);


  // ── Filter / city / favorites state (via hook) ────────────────────────────
  const {
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
    allCompanions,
    isFiltered, clearFilters,
    loading, loadError,
  } = useExploreFilters();

  // The one profile a locked visitor sees unblurred, in THIS city. Undefined
  // when the city has no companions — there is nothing to tease.
  const teaserId = cityCompanions.length > 0
    ? (cityCompanions.find((c) => c.topMatch)?.id || cityCompanions.reduce((best, c) => (c.matchScore > best.matchScore ? c : best)).id)
    : undefined;

  const handleSurpriseMe = useCallback(() => {
    // Locked visitors only have the teaser clear — point them at it, which is
    // what drives the unlock. Unlocked visitors cycle through strong candidates
    // in the city they are actually looking at.
    const candidates = unlocked
      ? cityCompanions.filter((c) => c.id !== teaserId).sort((a, b) => b.matchScore - a.matchScore).slice(0, 4)
      : [];
    const id = candidates.length
      ? candidates[surpriseIdxRef.current % candidates.length].id
      : teaserId;
    if (!id) return;
    surpriseIdxRef.current += 1;
    setHighlightId(null);
    // small delay so CompanionGrid sees a fresh id even if it's the same one
    setTimeout(() => setHighlightId(id), 40);
  }, [unlocked, cityCompanions, teaserId]);

  // Whether you have an account, and whether you have paid, are facts the server
  // owns. These were read from localStorage, which the real sign-in never writes:
  // a member who had just registered was still seen as a guest, so the unlock
  // sheet offered to create the account they were already signed into.
  // Explore is a public page. In http mode both endpoints require a session, so
  // for a guest the answer is already known — signed out, not unlocked — and
  // asking would only 401. Re-runs when a session resolves.
  const viewerReady = useViewerReady();
  const viewerResolved = useViewerResolved();

  // `lockKnown` is false until we actually know whether this visitor has paid.
  // Until then the grid stays in its loading state rather than defaulting to
  // "locked" — otherwise every reload flashes the paywall at a member who has
  // already bought the unlock.
  const [lockKnown, setLockKnown] = useState(false);

  useEffect(() => {
    if (!viewerResolved) return; // still unknown — paint nothing, decide nothing

    if (!viewerReady) {
      // Definitely a guest: signed out, not unlocked. No request needed.
      setSignedIn(false);
      setLockKnown(true);
      return;
    }

    let cancelled = false;
    Promise.all([dataClient.getUser(), dataClient.getUnlocked()])
      .then(([user, isUnlocked]) => {
        if (cancelled) return;
        setSignedIn(user !== null);
        if (isUnlocked) setUnlocked(true);
        setLockKnown(true);
      })
      .catch(() => {
        // A failed read must not strand the grid in a skeleton forever. Fail
        // closed: locked is the safe default once we have actually tried.
        if (!cancelled) setLockKnown(true);
      });
    return () => {
      cancelled = true;
    };
  }, [viewerReady, viewerResolved]);

  // The "N of M unlocked" chip counts the city actually on screen. It used to
  // count COMPANIONS.length — every companion everywhere — which meant Jaipur
  // proudly reported 14 unlocked profiles while showing none.
  useEffect(() => {
    setUnlockedCount(unlocked ? cityCompanions.length : Math.min(1, cityCompanions.length));
  }, [unlocked, cityCompanions.length]);

  const openSheet = useCallback((c: Companion) => {
    setSeed(c);
    setSheetOpen(true);
    track('unlock_intent', { companionId: c.id });
  }, []);

  /**
   * `/explore?unlock=<companionId>` — arrive with the unlock sheet already open,
   * seeded with the companion the member was trying to book.
   *
   * The booking wizard's review step sends them here when they have no included
   * meetings because they have never unlocked. Without this the button would have
   * to dump them on a grid and hope they tap the right card — and a query
   * parameter that nothing reads is exactly the bug that left `?welcome=1` inert
   * for the entire life of the app. One-shot: it must not re-open if they close it.
   */
  const unlockParam = params.get('unlock');
  const unlockSeededRef = useRef(false);
  useEffect(() => {
    if (unlockSeededRef.current || !unlockParam || unlocked) return;

    // Look the companion up in the WHOLE catalogue, not just the selected city.
    // Explore defaults to a city the member may never have chosen (Mumbai, for an
    // account with no city set), so scoping this to `cityCompanions` silently
    // found nothing whenever the companion they were booking lived anywhere else
    // — which is most of them. Switch the city to where the companion actually is,
    // so the sheet's "and N more in <city>" is true as well.
    const target = allCompanions.find(c => c.id === unlockParam);
    if (!target) return;

    unlockSeededRef.current = true;
    const cityMatch = CITIES.find((c) => c.name === target.city);
    if (cityMatch && cityMatch.id !== cityId) setCityId(cityMatch.id);
    openSheet(target);
  }, [unlockParam, unlocked, cityId, setCityId, openSheet]);

  // Unlock-sequence timers — tracked so unmount mid-sequence cancels them.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // One-shot guard: the unlock celebration runs exactly once (unlock is
  // idempotent). A boolean is correct here — the old length check never reset.
  const sequenceStartedRef = useRef(false);
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const onSheetSuccess = useCallback(() => {
    if (sequenceStartedRef.current) return; // sequence already ran
    sequenceStartedRef.current = true;
    const tappedId = seed?.id ?? teaserId;
    setSheetOpen(false);
    setUnlocked(true);

    // A verified payment already flipped User.unlocked server-side. Writing the
    // flag from here would be a payment bypass in disguise; just tell the rest
    // of the app to re-read it (Nav's chip, the dashboard, the wallet).
    emitDataChange('unlocked');
    track('unlock_success', { method: 'razorpay' });
    if (tappedId) setDeveloping({ tappedId });

    const later = (fn: () => void, ms: number) =>
      timersRef.current.push(setTimeout(fn, ms));

    setShowSeal(true);
    later(() => setShowSeal(false), reduced ? 1500 : 1100);

    if (!reduced) {
      // Confetti burst at the moment the sheet closes.
      import('canvas-confetti').then((mod) => {
        mod.default({ particleCount: 140, spread: 90, origin: { y: 0.55 }, colors: ['#2E6BFF', '#1FAE6B', '#8B5CF6', '#FFB23E', '#fff'] });
      });
      later(() => setShowParticles(true), 1600);
      later(() => setShowParticles(false), 3500);
    }

    later(() => setDeveloping(null), 2200);
  }, [seed, reduced]);

  // Guest tapped "Pay" — send them to register first, then back to explore.
  const requireAccount = useCallback(() => {
    setSheetOpen(false);
    router.push('/register?next=/explore&gate=unlock');
  }, [router]);

  const onBook = useCallback(
    (c: Companion) => {
      if (!unlocked) openSheet(c);
      else router.push(`/companion/${c.id}`);
    },
    [unlocked, openSheet, router],
  );

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  }, []);

  // Falls back to this city's teaser rather than a hardcoded 'Ananya', who does
  // not exist outside Mumbai.
  const teaser = cityCompanions.find((c) => c.id === teaserId);
  const seedName = seed
    ? (unlocked ? seed.firstName : seed.maskedName)
    : (teaser ? (unlocked ? teaser.firstName : teaser.maskedName) : 'them');
  const sealLabel = `You're in${quizName ? `, ${quizName}.` : '.'}`;

  return (
    <div className="relative">
      <ExploreHeader
        matched={matched}
        name={quizName}
        cityName={selectedCity.name}
        unlockedCount={unlockedCount}
        cityCount={cityCompanions.length}
        selectedCityId={cityId}
        onCityChange={setCityId}
        quizDone={quizDone}
        freeNowCount={cityCompanions.filter(c => c.availableNow).length}
      />

      <ActivityTicker />

      <ExploreFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activityFilters={activityFilters}
        onToggleActivity={toggleActivity}
        availability={availability}
        onAvailabilityChange={setAvailability}
        sort={sort}
        onSortChange={setSort}
        freeNowOnly={freeNowOnly}
        onFreeNowToggle={() => setFreeNowOnly(!freeNowOnly)}
        sameGenderOnly={sameGenderOnly}
        onSameGenderToggle={setSameGenderOnly}
        myGender={myGender}
        resultCount={filteredCompanions.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isFiltered={isFiltered}
        onClearFilters={clearFilters}
        onSurprise={handleSurpriseMe}
      />

      {/* Grid/map wrapper — relative so ParticleField (absolute inset-0) overlays correctly */}
      <div className="relative overflow-hidden">
        {viewMode === 'grid' ? (
          <CompanionGrid
            companions={filteredCompanions}
            unlocked={unlocked}
            developing={developing}
            onUnlockClick={openSheet}
            onBook={onBook}
            favorites={favorites}
            onToggleFavorite={toggleFav}
            quizDone={quizDone}
            compareIds={compareIds}
            onToggleCompare={unlocked ? toggleCompare : undefined}
            highlightId={highlightId}
            cityName={selectedCity.name}
            cityIsEmpty={cityCompanions.length === 0}
            // Stay in the skeleton until the lock state is known, not just until
            // the catalogue arrives: rendering the grid earlier means rendering it
            // locked, and flashing a paywall at someone who has already paid.
            loading={loading || !lockKnown}
            loadError={loadError}
          />
        ) : (
          <MapView companions={filteredCompanions} allCompanions={allCompanions} cityId={cityId} unlocked={unlocked} onCityChange={setCityId} quizDone={quizDone} highlightId={highlightId} />
        )}
        {showParticles && <ParticleField count={20} color="#FFB23E" fade />}
      </div>

      {/* Compare tray — sticky bottom, only when unlocked and companions selected */}
      {unlocked && (
        <CompareTray
          compareIds={compareIds}
          companions={filteredCompanions}
          quizDone={quizDone}
          onToggle={toggleCompare}
          onClear={() => setCompareIds([])}
        />
      )}

      {/* MilestoneSeal overlay — fixed centered, pointer-events-none, z-40 (spec §4.4 step 2) */}
      <AnimatePresence>
        {showSeal && (
          <motion.div
            key="seal"
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.36, ease: [0.7, 0, 0.84, 0] }}
          >
            <MilestoneSeal label={sealLabel} withConfetti />
          </motion.div>
        )}
      </AnimatePresence>

      <UnlockSheet
        open={sheetOpen}
        seedName={seedName}
        city={selectedCity.name}
        count={Math.max(0, cityCompanions.length - 1)}
        isGuest={!signedIn}
        onRequireAccount={requireAccount}
        onClose={() => setSheetOpen(false)}
        onSuccess={onSheetSuccess}
      />


      {/* First-visit welcome overlay — plays once, guarded by localStorage. */}
      <WelcomeOverlay name={quizName || undefined} />
    </div>
  );
}
