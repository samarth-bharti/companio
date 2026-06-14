'use client';

import { BadgeCheck } from 'lucide-react';
import { CITIES } from '@/lib/data/cities';
import { Button } from '@/components/ui/Button';

export interface PreviewData {
  name: string;
  city: string;
  bio: string;
  activities: string[];
  rate: number;
}

interface Props {
  data: PreviewData;
  onSubmit: () => void;
}

export function WizardStepPreview({ data, onSubmit }: Props) {
  const cityName = CITIES.find((c) => c.id === data.city)?.name ?? 'Your city';
  const initial = data.name.trim()[0]?.toUpperCase() ?? '?';

  return (
    <div>
      <h2 className="font-display text-h2 mb-1" style={{ color: 'var(--color-ink)' }}>
        Here&apos;s how you&apos;ll appear
      </h2>
      <p className="font-sans text-sm mb-8" style={{ color: 'var(--color-ink-muted)' }}>
        This is a preview of your companion card. You can update everything after approval.
      </p>

      {/* Companion card preview */}
      <div
        className="rounded-2xl overflow-hidden mb-8 max-w-xs mx-auto"
        style={{
          border: '1.5px solid rgba(46,107,255,0.14)',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        {/* Avatar */}
        <div
          className="h-48 flex items-center justify-center"
          style={{ background: 'var(--grad-aurora)' }}
          aria-hidden="true"
        >
          <span
            className="font-display font-bold text-white"
            style={{ fontSize: '4rem', opacity: 0.9 }}
          >
            {initial}
          </span>
        </div>

        {/* Body */}
        <div className="p-5 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-sans font-bold text-base" style={{ color: 'var(--color-ink)' }}>
              {data.name || 'Your name'}
            </p>
            <BadgeCheck size={15} strokeWidth={2} style={{ color: 'var(--color-azure)', flexShrink: 0 }} />
          </div>
          <p className="font-sans text-sm mb-3" style={{ color: 'var(--color-ink-muted)' }}>
            {cityName} · ₹{data.rate}/meetup
          </p>

          {(data.activities.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {data.activities.slice(0, 4).map((a) => (
                <span
                  key={a}
                  className="px-2.5 py-1 rounded-pill font-sans text-xs font-medium"
                  style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}
                >
                  {a}
                </span>
              ))}
            </div>
          )}

          {data.bio ? (
            <p className="font-sans text-sm leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
              {data.bio.slice(0, 120)}{data.bio.length > 120 && '…'}
            </p>
          ) : (
            <p className="font-sans text-sm italic" style={{ color: 'rgba(90,99,120,0.5)' }}>
              Your bio will appear here.
            </p>
          )}
        </div>
      </div>

      {/* Submit */}
      <div className="text-center">
        <Button
          variant="cta"
          size="xl"
          onClick={onSubmit}
          className="w-full sm:w-auto"
        >
          Submit application
        </Button>
        <p className="font-sans text-xs mt-3" style={{ color: 'var(--color-ink-muted)' }}>
          Our team reviews every application. Usually 2-3 days.
        </p>
      </div>
    </div>
  );
}
