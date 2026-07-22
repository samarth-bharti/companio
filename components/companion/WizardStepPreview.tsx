'use client';

import { BadgeCheck, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
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
  isUnlocked?: boolean;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function WizardStepPreview({ data, isUnlocked, onSubmit, isSubmitting }: Props) {
  const cityName = CITIES.find((c) => c.id === data.city)?.name ?? 'Your city';
  const initial = data.name.trim()[0]?.toUpperCase() ?? '?';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--color-ink)' }}>
          Here&apos;s how you&apos;ll appear
        </h2>
        <p className="font-sans text-sm" style={{ color: 'var(--color-ink-muted)' }}>
          This is a preview of your companion card. You can update your bio, activities, and rates anytime after activation.
        </p>
      </div>

      {/* Main Responsive Unified Card Container */}
      <div
        className="rounded-3xl p-5 sm:p-7 bg-white shadow-lg space-y-6 border border-slate-200/80"
        style={{
          boxShadow: '0 12px 32px -8px rgba(46,107,255,0.08)',
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] md:grid-cols-[240px_1fr] gap-6 items-start">
          {/* Left: Companion Card Preview */}
          <div
            className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-white mx-auto w-full max-w-[260px] sm:max-w-none"
          >
            {/* Avatar Header */}
            <div
              className="h-44 sm:h-48 flex items-center justify-center relative overflow-hidden"
              style={{ background: 'var(--grad-aurora)' }}
              aria-hidden="true"
            >
              <span
                className="font-display font-bold text-white tracking-widest select-none"
                style={{ fontSize: '4rem', opacity: 0.95 }}
              >
                {initial}
              </span>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="font-sans font-bold text-base truncate" style={{ color: 'var(--color-ink)' }}>
                  {data.name || 'Your name'}
                </p>
                <BadgeCheck size={16} strokeWidth={2.2} className="text-blue-600 flex-shrink-0" />
              </div>
              <p className="font-sans text-xs sm:text-sm font-medium mb-3" style={{ color: 'var(--color-ink-muted)' }}>
                {cityName} · ₹{data.rate}/meetup
              </p>

              {data.activities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {data.activities.slice(0, 4).map((a) => (
                    <span
                      key={a}
                      className="px-2.5 py-0.5 rounded-full font-sans text-xs font-semibold"
                      style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}

              {data.bio ? (
                <p className="font-sans text-xs sm:text-sm leading-relaxed line-clamp-3" style={{ color: 'var(--color-ink-muted)' }}>
                  {data.bio}
                </p>
              ) : (
                <p className="font-sans text-xs italic" style={{ color: 'rgba(90,99,120,0.5)' }}>
                  Your bio will appear here.
                </p>
              )}
            </div>
          </div>

          {/* Right: Platform Subscription & Membership Status */}
          <div className="flex flex-col justify-between h-full space-y-4">
            <div
              className="rounded-2xl p-5 text-left border"
              style={{
                background: isUnlocked
                  ? 'linear-gradient(135deg, rgba(21,122,74,0.06), rgba(16,185,129,0.08))'
                  : 'linear-gradient(135deg, rgba(46,107,255,0.06), rgba(122,79,224,0.08))',
                borderColor: isUnlocked ? 'rgba(21,122,74,0.25)' : 'rgba(46,107,255,0.25)',
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  {isUnlocked ? (
                    <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <ShieldCheck size={20} className="text-blue-600 flex-shrink-0" />
                  )}
                  <h3 className="font-sans font-bold text-sm sm:text-base" style={{ color: 'var(--color-ink)' }}>
                    {isUnlocked ? '✓ Subscription Active' : 'Platform Access Subscription'}
                  </h3>
                </div>
                <span className="font-display font-bold text-base sm:text-lg whitespace-nowrap" style={{ color: isUnlocked ? '#157A4A' : 'var(--color-azure-deep)' }}>
                  ₹199<span className="text-xs font-sans font-normal opacity-75">/mo</span>
                </span>
              </div>

              <p className="font-sans text-xs leading-relaxed mb-3" style={{ color: 'var(--color-ink-muted)' }}>
                {isUnlocked
                  ? 'Your ₹199 monthly platform subscription is active! Your profile will be live on Explore and you have full access to view, message, and receive bookings.'
                  : 'All users — both companions and members — activate the ₹199 monthly platform pass. This unlocks full marketplace access, messaging, and verified profile status.'}
              </p>

              <div className="space-y-1.5 pt-1 border-t border-slate-200/50">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} className="flex-shrink-0" />
                  <span>Keep 88% – 92% of your hourly rate on every meetup</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 size={14} className="flex-shrink-0" />
                  <span>Full access to browse and book companions simultaneously</span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <Button
                variant="cta"
                size="xl"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 text-sm sm:text-base font-bold shadow-md rounded-2xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Activating & Submitting Profile...</span>
                  </>
                ) : isUnlocked ? (
                  'Submit & Activate Companion Profile →'
                ) : (
                  'Pay ₹199 & Activate Companion Profile →'
                )}
              </Button>
              <p className="font-sans text-xs text-center mt-2.5" style={{ color: 'var(--color-ink-muted)' }}>
                Approval by our admin team is usually within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  );
}
