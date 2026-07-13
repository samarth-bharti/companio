'use client';

import { useState, useEffect } from 'react';
import { Search, X, Zap, LayoutGrid, Map, SlidersHorizontal, Shuffle, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffectiveReducedMotion } from '@/lib/motionPreference';
import { spring } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Availability, SortKey } from './useExploreFilters';
import { ALL_ACTIVITIES } from './useExploreFilters';

export type ViewMode = 'grid' | 'map';

interface ExploreFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activityFilters: string[];
  onToggleActivity: (act: string) => void;
  availability: Availability;
  onAvailabilityChange: (v: Availability) => void;
  sort: SortKey;
  onSortChange: (v: SortKey) => void;
  freeNowOnly: boolean;
  onFreeNowToggle: () => void;
  sameGenderOnly: boolean;
  onSameGenderToggle: (v: boolean) => void;
  /** Undefined ⇒ we have no comparable gender for this member, so the filter cannot run. */
  myGender: 'male' | 'female' | 'nonbinary' | undefined;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  /** How many companions the current filters return — shown on the Map button. */
  resultCount: number;
  isFiltered: boolean;
  onClearFilters: () => void;
  /** "Surprise me" — highlights a strong match. Rendered in the filter bar. */
  onSurprise?: () => void;
}

const AVAIL_OPTIONS: { value: Availability; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'evenings', label: 'Evenings' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'best_match', label: 'Best match' },
  { value: 'top_rated', label: 'Top rated' },
  { value: 'most_reviewed', label: 'Most reviewed' },
  { value: 'price', label: 'Price' },
];

// Solid frosted-white (no backdrop-blur) — visually ~identical over the light
// page background but far cheaper to paint while scrolling a grid of these.
const pillBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.92)',
  border: '1.5px solid rgba(46,107,255,0.18)',
  color: 'var(--color-ink)',
  outlineColor: 'var(--color-azure)',
};

/**
 * ExploreFilters — search + activity chips + availability + sort + free-now +
 * surprise + view toggle. Desktop shows everything inline; on mobile the filters
 * collapse into a bottom-sheet "Filters" drawer so the bar stays one clean row.
 */
export function ExploreFilters({
  searchQuery, onSearchChange,
  activityFilters, onToggleActivity,
  availability, onAvailabilityChange,
  sort, onSortChange,
  freeNowOnly, onFreeNowToggle,
  sameGenderOnly, onSameGenderToggle, myGender,
  viewMode, onViewModeChange, resultCount,
  isFiltered, onClearFilters,
  onSurprise,
}: ExploreFiltersProps) {
  const reduced = useEffectiveReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Count of "extra" filters for the mobile Filters badge.
  const activeCount =
    activityFilters.length +
    (availability !== 'any' ? 1 : 0) +
    (freeNowOnly ? 1 : 0) +
    (sameGenderOnly ? 1 : 0);

  // Lock scroll + Esc-to-close while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  // ── Reusable control bits (rendered in both the desktop bar and the drawer) ─
  const availabilitySelect = (className: string) => (
    <select
      value={availability}
      onChange={(e) => onAvailabilityChange(e.target.value as Availability)}
      aria-label="Filter by availability"
      className={className}
      style={pillBase}
    >
      {AVAIL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  const sortSelect = (className: string) => (
    <select
      value={sort}
      onChange={(e) => onSortChange(e.target.value as SortKey)}
      aria-label="Sort companions"
      className={className}
      style={pillBase}
    >
      {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );

  const freeNowButton = (className: string) => (
    <button
      type="button"
      aria-pressed={freeNowOnly}
      onClick={onFreeNowToggle}
      className={cn('flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1', className)}
      style={
        freeNowOnly
          ? { background: 'var(--color-emerald)', border: '1.5px solid var(--color-emerald)', color: 'white', outlineColor: 'var(--color-emerald)' }
          : { ...pillBase, color: 'var(--color-ink-muted)' }
      }
    >
      <Zap size={13} aria-hidden="true" />
      Free now
    </button>
  );

  // A comfort preference, not a gimmick — so it lives in the open, next to the
  // other filters, and can be turned off as easily as on. It used to be a
  // one-time quiz answer that nothing acted on.
  //
  // Without a gender of our own to compare, the filter is inert. We disable it
  // and say why, instead of leaving it on and showing everyone anyway.
  const sameGenderButton = (className: string) => {
    const usable = myGender !== undefined;
    return (
      <button
        type="button"
        aria-pressed={sameGenderOnly}
        disabled={!usable}
        onClick={() => onSameGenderToggle(!sameGenderOnly)}
        title={usable ? undefined : 'Add your gender in your profile to use this filter.'}
        className={cn(
          'flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
          !usable && 'opacity-50 cursor-not-allowed',
          className,
        )}
        style={
          sameGenderOnly && usable
            ? { background: 'var(--color-violet)', border: '1.5px solid var(--color-violet)', color: 'white', outlineColor: 'var(--color-violet)' }
            : { ...pillBase, color: 'var(--color-ink-muted)' }
        }
      >
        <UserCheck size={13} aria-hidden="true" />
        Same gender
      </button>
    );
  };

  const activityChips = (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by activity">
      {ALL_ACTIVITIES.map((act) => {
        const active = activityFilters.includes(act);
        return (
          <button
            key={act}
            type="button"
            aria-pressed={active}
            onClick={() => onToggleActivity(act)}
            className="rounded-pill px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            style={
              active
                ? { background: 'var(--color-azure)', border: '1.5px solid var(--color-azure)', color: 'white', outlineColor: 'var(--color-azure)' }
                : { background: 'rgba(255,255,255,0.90)', border: '1.5px solid rgba(46,107,255,0.18)', color: 'var(--color-ink-muted)', outlineColor: 'var(--color-azure)' }
            }
          >
            {act}
          </button>
        );
      })}
    </div>
  );

  /**
   * "Where are they, actually?" is the first question anyone asks of a local
   * marketplace, and the answer was hidden behind a 32px pill with a 12px icon,
   * sitting at the end of a row of five other pills. Nobody found it.
   *
   * It is now a real segmented control: 44px tall (the touch target the rest of
   * the app already enforces and this one did not), 16px icons, and the map side
   * carries the number of people it would show — a count is the reason to press
   * a button, and "Map · 8" is a far better invitation than "Map".
   */
  const viewToggle = (
    <div
      className="flex items-center rounded-pill p-1 gap-1 shrink-0"
      style={{ ...pillBase, boxShadow: 'var(--shadow-1)' }}
      role="group"
      aria-label="Switch between grid and map"
    >
      {(['grid', 'map'] as ViewMode[]).map((m) => {
        const active = viewMode === m;
        const isMap = m === 'map';
        return (
          <button
            key={m}
            type="button"
            aria-pressed={active}
            onClick={() => onViewModeChange(m)}
            className="flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-pill text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            style={active
              ? { background: 'var(--color-azure)', color: 'white', outlineColor: 'var(--color-azure)' }
              : { color: 'var(--color-ink)', outlineColor: 'var(--color-azure)' }}
          >
            {isMap ? <Map size={16} aria-hidden /> : <LayoutGrid size={16} aria-hidden />}
            {isMap ? 'Map' : 'Grid'}
            {isMap && resultCount > 0 && (
              <span
                className="text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-full"
                style={active
                  ? { background: 'rgba(255,255,255,0.22)', color: 'white' }
                  : { background: 'var(--color-azure-tint)', color: 'var(--color-azure-deep)' }}
              >
                {resultCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="py-4 border-b" style={{ borderColor: 'rgba(46,107,255,0.10)', background: 'var(--color-bg)' }}>
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-3">

        {/* Top row — always visible */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-xs">
            <Search size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-ink-muted)' }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name or activity…"
              aria-label="Search companions by name or activity"
              className="w-full h-10 rounded-pill pl-8 pr-4 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              style={pillBase}
            />
          </div>

          {/* Desktop inline controls */}
          <div className="hidden md:flex items-center gap-2">
            {availabilitySelect('h-10 rounded-pill px-3 text-sm appearance-none cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1')}
            {sortSelect('h-10 rounded-pill px-3 text-sm appearance-none cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1')}
            {freeNowButton('h-10 px-3 rounded-pill text-sm')}
            {sameGenderButton('h-10 px-3 rounded-pill text-sm')}
            {onSurprise && (
              <button
                type="button"
                onClick={onSurprise}
                className="flex items-center gap-1.5 h-10 px-3 rounded-pill text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                style={{ background: 'rgba(122,79,224,0.08)', border: '1.5px solid rgba(122,79,224,0.22)', color: 'var(--color-violet)', outlineColor: 'var(--color-violet)' }}
              >
                <Shuffle size={13} aria-hidden="true" />
                Surprise me
              </button>
            )}
          </div>

          {/* Mobile Filters button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="md:hidden flex items-center gap-1.5 h-10 px-3 rounded-pill text-sm font-medium shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
            style={pillBase}
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            Filters
            {activeCount > 0 && (
              <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold text-white" style={{ background: 'var(--color-azure)' }}>
                {activeCount}
              </span>
            )}
          </button>

          {viewToggle}

          {/* Desktop clear */}
          {isFiltered && (
            <button
              type="button"
              onClick={onClearFilters}
              className="hidden md:flex items-center gap-1 h-10 px-3 rounded-pill text-sm font-medium transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
              style={{ color: 'var(--color-ink-muted)', outlineColor: 'var(--color-azure)' }}
            >
              <X size={13} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>

        {/* Desktop activity chips */}
        <div className="hidden md:block">{activityChips}</div>
      </div>

      {/* ── Mobile filter drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="md:hidden">
            <motion.div
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(20,26,46,0.5)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl px-5 pt-3 pb-8 flex flex-col gap-5"
              style={{ background: 'var(--color-surface)', boxShadow: '0 -8px 32px -8px rgba(20,26,46,0.25)' }}
              initial={reduced ? { opacity: 0 } : { y: '100%' }}
              animate={reduced ? { opacity: 1 } : { y: 0 }}
              exit={reduced ? { opacity: 0 } : { y: '100%' }}
              transition={reduced ? { duration: 0.18 } : spring.soft}
            >
              <div className="mx-auto h-1 w-10 rounded-full" style={{ background: 'rgba(20,26,46,0.18)' }} aria-hidden="true" />
              <div className="flex items-center justify-between">
                <p className="font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}>Filters</p>
                <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close filters" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5">
                  <X size={18} style={{ color: 'var(--color-ink-muted)' }} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-ink-muted)' }}>Sort by</label>
                {sortSelect('w-full h-11 rounded-xl px-3 text-sm cursor-pointer focus-visible:outline focus-visible:outline-2')}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-ink-muted)' }}>Availability</label>
                {availabilitySelect('w-full h-11 rounded-xl px-3 text-sm cursor-pointer focus-visible:outline focus-visible:outline-2')}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold" style={{ color: 'var(--color-ink-muted)' }}>Comfort</label>
                {sameGenderButton('w-full h-11 rounded-xl text-sm')}
                {myGender === undefined && (
                  <p className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                    Add your gender in your profile to use this filter.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {freeNowButton('flex-1 h-11 rounded-xl text-sm')}
                {onSurprise && (
                  <button
                    type="button"
                    onClick={() => { onSurprise(); setDrawerOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-medium focus-visible:outline focus-visible:outline-2"
                    style={{ background: 'rgba(122,79,224,0.08)', border: '1.5px solid rgba(122,79,224,0.22)', color: 'var(--color-violet)', outlineColor: 'var(--color-violet)' }}
                  >
                    <Shuffle size={13} aria-hidden="true" />
                    Surprise me
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-ink-muted)' }}>Activities</span>
                {activityChips}
              </div>

              <div className="flex items-center gap-2 pt-1">
                {isFiltered && (
                  <button type="button" onClick={onClearFilters} className="h-11 px-4 rounded-xl text-sm font-medium" style={{ color: 'var(--color-ink-muted)', background: 'rgba(20,26,46,0.05)' }}>
                    Clear all
                  </button>
                )}
                <button type="button" onClick={() => setDrawerOpen(false)} className="flex-1 h-11 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}>
                  Show results
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
