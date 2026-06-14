'use client';

import { CITIES } from '@/lib/data/cities';

const BIO_MAX = 280;

export interface AboutData {
  name: string;
  city: string;
  bio: string;
}

interface Props {
  data: AboutData;
  onChange: (patch: Partial<AboutData>) => void;
}

const fieldStyle = {
  border: '1.5px solid rgba(46,107,255,0.2)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-ink)',
  background: 'var(--color-surface)',
  outline: 'none',
} as const;

export function WizardStepAbout({ data, onChange }: Props) {
  return (
    <div>
      <h2 className="font-display text-h2 mb-1" style={{ color: 'var(--color-ink)' }}>
        Tell us about yourself
      </h2>
      <p className="font-sans text-sm mb-8" style={{ color: 'var(--color-ink-muted)' }}>
        Members see this when they browse companions in their city.
      </p>

      {/* Name */}
      <div className="mb-5">
        <label
          htmlFor="wiz-name"
          className="font-sans text-sm font-semibold block mb-2"
          style={{ color: 'var(--color-ink)' }}
        >
          Your name <span aria-hidden="true" style={{ color: '#C7161A' }}>*</span>
        </label>
        <input
          id="wiz-name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Priya S."
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full h-11 px-4 font-sans text-sm"
          style={fieldStyle}
          required
        />
        <p className="font-sans text-xs mt-1.5" style={{ color: 'var(--color-ink-muted)' }}>
          Use a first name and last initial, shown publicly on your profile.
        </p>
      </div>

      {/* City */}
      <div className="mb-5">
        <label
          htmlFor="wiz-city"
          className="font-sans text-sm font-semibold block mb-2"
          style={{ color: 'var(--color-ink)' }}
        >
          Your city <span aria-hidden="true" style={{ color: '#C7161A' }}>*</span>
        </label>
        <select
          id="wiz-city"
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
          className="w-full h-11 px-4 font-sans text-sm"
          style={fieldStyle}
          required
        >
          <option value="" disabled>
            Select your city
          </option>
          {CITIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}, {c.state}
            </option>
          ))}
        </select>
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="wiz-bio"
          className="font-sans text-sm font-semibold block mb-2"
          style={{ color: 'var(--color-ink)' }}
        >
          About you
        </label>
        <textarea
          id="wiz-bio"
          rows={4}
          maxLength={BIO_MAX}
          placeholder="Tell members what kind of company you bring, your city, favourite spots, what a meetup with you feels like. Warm, honest, and specific works best."
          value={data.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
          className="w-full px-4 py-3 font-sans text-sm resize-none"
          style={{ ...fieldStyle, lineHeight: '1.6' }}
        />
        <div className="flex justify-between mt-1">
          <p className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>
            Optional, you can add this later from your profile.
          </p>
          <span
            className="font-sans text-xs tabular-nums"
            style={{
              color: data.bio.length > BIO_MAX * 0.9 ? '#C7161A' : 'var(--color-ink-muted)',
            }}
          >
            {data.bio.length}/{BIO_MAX}
          </span>
        </div>
      </div>
    </div>
  );
}
