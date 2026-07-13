'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { useCompanionDashboard } from '@/lib/useCompanionDashboard';

/**
 * Availability, as the product actually models it.
 *
 * This was a 7×3 grid of day/slot toggles, seeded with a hardcoded default
 * (weekday afternoons, weekend mornings) and captioned "Toggle to update". It
 * updated nothing: there is no weekly-availability model in the schema, nothing
 * read it, and the whole set was discarded on unmount.
 *
 * What genuinely exists, and is genuinely shown to members on the explore grid
 * and the map, is two fields: `availableNow` (the green "Free now" dot) and
 * `availability` (the line of text under it). So we edit those, and they save.
 *
 * A real weekly calendar is a good feature. It needs a table first.
 */

const AVAILABILITY_PRESETS = [
  'Free now',
  'Free this evening',
  'Free tomorrow',
  'Free this weekend',
  'Available tomorrow',
  'Booking a week ahead',
] as const;

export function CompanionDashAvailability() {
  const state = useCompanionDashboard();
  const live = state.status === 'live' ? state.data : null;

  const [availableNow, setAvailableNow] = useState(false);
  const [availability, setAvailability] = useState<string>('Available tomorrow');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!live) return;
    setAvailableNow(live.profile.availableNow);
    setAvailability(live.profile.availability);
  }, [live]);

  const readOnly = state.status !== 'live';

  async function save(next: { availableNow?: boolean; availability?: string }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/companion/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(String(res.status));
      setSaved(true);
      state.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Could not save. Please try again.');
      // Put the switch back where it was — never leave the UI claiming a state
      // the server rejected.
      if (live) {
        setAvailableNow(live.profile.availableNow);
        setAvailability(live.profile.availability);
      }
    } finally {
      setSaving(false);
    }
  }

  function toggleNow() {
    const next = !availableNow;
    setAvailableNow(next); // optimistic; reverted above on failure
    void save({ availableNow: next });
  }

  return (
    <section aria-labelledby="avail-heading">
      <h2 id="avail-heading" className="font-sans font-bold text-base mb-1" style={{ color: 'var(--color-ink)' }}>
        Availability
      </h2>
      <p className="font-sans text-xs mb-4" style={{ color: 'var(--color-ink-muted)' }}>
        Members see this on your card and on the map.
      </p>

      <div
        className="rounded-2xl p-5 flex flex-col gap-5"
        style={{
          background: 'var(--color-surface)',
          border: '1.5px solid rgba(46,107,255,0.1)',
          boxShadow: 'var(--shadow-1)',
        }}
      >
        {/* Free now */}
        <div className="flex items-center gap-3">
          <Zap
            size={18}
            aria-hidden="true"
            style={{ color: availableNow ? 'var(--color-emerald)' : 'var(--color-ink-muted)' }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
              Free right now
            </p>
            <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              Puts a green dot on your profile. Members filter by this.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={availableNow}
            aria-label="Free right now"
            disabled={readOnly || saving}
            onClick={toggleNow}
            className="relative shrink-0 rounded-full transition-colors disabled:opacity-50"
            style={{
              width: 52,
              height: 30,
              background: availableNow ? 'var(--color-emerald)' : 'rgba(20,26,46,0.16)',
            }}
          >
            <span
              className="absolute top-1 rounded-full bg-white transition-transform"
              style={{ width: 22, height: 22, left: 4, transform: `translateX(${availableNow ? 22 : 0}px)` }}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Availability line */}
        <div>
          <label
            htmlFor="availability-line"
            className="font-sans text-sm font-semibold block mb-2"
            style={{ color: 'var(--color-ink)' }}
          >
            When you&rsquo;re next free
          </label>
          <select
            id="availability-line"
            value={availability}
            disabled={readOnly || saving}
            onChange={(e) => {
              setAvailability(e.target.value);
              void save({ availability: e.target.value });
            }}
            className="w-full h-11 px-3 font-sans text-sm disabled:opacity-60"
            style={{
              border: '1.5px solid rgba(46,107,255,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-ink)',
              background: 'var(--color-surface)',
            }}
          >
            {AVAILABILITY_PRESETS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="min-h-[1rem]" aria-live="polite">
          {error && <p role="alert" className="font-sans text-xs" style={{ color: '#C0392B' }}>{error}</p>}
          {saved && !error && <p className="font-sans text-xs font-semibold" style={{ color: '#157A4A' }}>Saved.</p>}
          {readOnly && state.status === 'preview' && (
            <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
              Sign in as a companion to edit.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
