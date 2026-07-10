import type { Companion } from '@/lib/data/companions';

/**
 * A companion's rating, or the truth that they have none.
 *
 * Every seeded profile carried `rating: 4.9, reviews: 124`. Nobody had met them.
 * Now they carry zeros, which means every star row on the site would have
 * rendered "★ 0 (0)" — worse than the lie it replaced.
 *
 * So: a companion with no reviews is New. That is what every marketplace that
 * has ever launched does, and it is accurate. A companion with reviews shows the
 * average, computed from real Booking.review rows.
 *
 * Import this rather than formatting a rating by hand. There were five separate
 * places doing it, and the point of a single component is that when the first
 * real review lands, all five change together.
 */
export function hasReviews(c: Pick<Companion, 'reviews'>): boolean {
  return c.reviews > 0;
}

export function RatingBadge({
  rating,
  reviews,
  size = 'sm',
}: {
  rating: number;
  reviews: number;
  size?: 'sm' | 'md';
}) {
  const text = size === 'md' ? 'text-sm' : 'text-xs';

  if (reviews === 0) {
    return (
      <span
        className={`inline-flex items-center rounded-pill px-2 py-0.5 font-semibold ${text}`}
        style={{ background: 'rgba(46,107,255,0.08)', color: 'var(--color-azure-deep)' }}
      >
        New
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-bold ${size === 'md' ? 'text-base' : 'text-sm'}`}
      style={{ color: 'var(--color-ink)' }}
      aria-label={`Rated ${rating.toFixed(1)} out of 5, from ${reviews} ${reviews === 1 ? 'review' : 'reviews'}`}
    >
      <span style={{ color: 'var(--color-gold)' }} aria-hidden="true">★</span>
      {rating.toFixed(1)}
      <span className="text-xs font-normal" style={{ color: 'var(--color-ink-muted)' }}>
        ({reviews})
      </span>
    </span>
  );
}
