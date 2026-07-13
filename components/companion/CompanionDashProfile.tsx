'use client';

import { useState, useId, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { calm } from '@/lib/motion';
import { HOURLY_MIN, HOURLY_MAX } from '@/lib/server/pricing';
import { useCompanionDashboard } from '@/lib/useCompanionDashboard';

/**
 * Quick profile edit — and it now actually edits.
 *
 * The old version kept the rate, the activities and a "Changes saved" toast in
 * React state. The toast fired on every click. Nothing was ever sent anywhere.
 *
 * The rate band comes from lib/server/pricing.ts rather than the ₹299–₹999
 * literals that used to live here, so the slider can never offer a rate the
 * server would clamp away — and it says "per hour", which is what `hourlyRate`
 * has always meant.
 */

const ALL_ACTIVITIES = ['City Walk', 'Café Chat', 'Gym Buddy', 'Live Events', 'Elder Company', 'Museum Visit'];

// The pricing module speaks paise. The slider speaks rupees.
const RATE_MIN = HOURLY_MIN / 100;
const RATE_MAX = HOURLY_MAX / 100;
const RATE_STEP = 50;

export function CompanionDashProfile() {
  const sliderId = useId();
  const state = useCompanionDashboard();
  const live = state.status === 'live' ? state.data : null;

  const [rate, setRate] = useState(500);
  const [activities, setActivities] = useState<string[]>(['City Walk', 'Café Chat', 'Live Events']);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!live) return;
    setRate(Math.round(live.profile.hourlyRate / 100));
    setActivities(live.profile.activities);
    setBio(live.profile.bio);
  }, [live]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const readOnly = state.status !== 'live';
  const fillPct = ((rate - RATE_MIN) / (RATE_MAX - RATE_MIN)) * 100;

  const toggleActivity = (a: string) => {
    setActivities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  async function save() {
    setError(null);
    if (bio.trim().length < 20) {
      setError('Your bio needs at least 20 characters — members read it before booking.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/companion/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hourlyRate: rate * 100, activities, bio: bio.trim() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      state.refresh();
      setToast('Changes saved');
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setToast(null), 2500);
    } catch {
      setError('We could not save your changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-labelledby="profile-editor-heading"
      className="rounded-2xl p-5 relative"
      style={{
        background: 'var(--color-surface)',
        border: '1.5px solid rgba(46,107,255,0.1)',
        boxShadow: 'var(--shadow-1)',
      }}
    >
      <h2 id="profile-editor-heading" className="font-sans font-bold text-base mb-5" style={{ color: 'var(--color-ink)' }}>
        Quick profile edit
      </h2>

      {/* Rate slider */}
      <div className="mb-5">
        <label htmlFor={sliderId} className="font-sans text-sm font-semibold block mb-1" style={{ color: 'var(--color-ink)' }}>
          Your rate: <span style={{ color: 'var(--color-azure)' }}>₹{rate}</span>
          <span className="font-normal" style={{ color: 'var(--color-ink-muted)' }}> per hour</span>
        </label>
        <div className="relative h-5 flex items-center mt-2">
          <div className="absolute inset-x-0 h-2 rounded-pill"
            style={{ top: '50%', transform: 'translateY(-50%)', background: 'rgba(46,107,255,0.12)' }} />
          <div className="absolute h-2 rounded-pill"
            style={{ left: 0, top: '50%', transform: 'translateY(-50%)', width: `${fillPct}%`, background: 'var(--grad-aurora)', transition: 'width 0.1s ease' }} />
          <input
            id={sliderId}
            type="range"
            min={RATE_MIN} max={RATE_MAX} step={RATE_STEP}
            value={rate}
            disabled={readOnly || saving}
            onChange={(e) => setRate(Number(e.target.value))}
            aria-valuetext={`₹${rate} per hour`}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <div aria-hidden="true" className="absolute w-5 h-5 rounded-full pointer-events-none"
            style={{ left: `calc(${fillPct}% - ${(fillPct / 100) * 20}px)`, top: '50%', transform: 'translateY(-50%)', background: 'var(--color-azure)', boxShadow: 'var(--glow-azure)', transition: 'left 0.1s ease' }} />
        </div>
      </div>

      {/* Activities */}
      <div className="mb-5">
        <p className="font-sans text-sm font-semibold mb-2" style={{ color: 'var(--color-ink)' }}>Activities</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Activities">
          {ALL_ACTIVITIES.map((a) => {
            const on = activities.includes(a);
            return (
              <button
                key={a}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={readOnly || saving}
                onClick={() => toggleActivity(a)}
                className="h-9 px-3.5 rounded-pill font-sans text-xs font-medium transition-colors focus-visible:outline-2 disabled:opacity-60"
                style={{
                  background: on ? 'rgba(46,107,255,0.1)' : 'rgba(46,107,255,0.04)',
                  border: `1.5px solid ${on ? 'var(--color-azure)' : 'rgba(46,107,255,0.15)'}`,
                  color: on ? 'var(--color-azure-deep)' : 'var(--color-ink-muted)',
                  minHeight: 44,
                }}
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bio */}
      <div className="mb-5">
        <label htmlFor="companion-bio" className="font-sans text-sm font-semibold block mb-2" style={{ color: 'var(--color-ink)' }}>
          About you
        </label>
        <textarea
          id="companion-bio"
          rows={4}
          value={bio}
          disabled={readOnly || saving}
          onChange={(e) => { setBio(e.target.value); if (error) setError(null); }}
          placeholder="What would you and a member actually do together?"
          className="w-full px-4 py-3 font-sans text-sm disabled:opacity-60"
          style={{
            border: '1.5px solid rgba(46,107,255,0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-ink)',
            background: 'var(--color-surface)',
            outline: 'none',
          }}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button variant="cta" size="md" onClick={save} disabled={readOnly || saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
        {readOnly && state.status === 'preview' && (
          <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            Sign in as a companion to edit.
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 font-sans text-xs" style={{ color: '#C0392B' }}>{error}</p>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            aria-live="polite"
            className="absolute bottom-4 right-4 px-4 py-2 rounded-xl font-sans text-xs font-semibold"
            style={{ background: 'var(--color-ink)', color: 'var(--color-panel-text)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={calm.base}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
