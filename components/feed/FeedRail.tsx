import { Zap, TrendingUp } from 'lucide-react';

const NEARBY = [
  { label: 'Morning Run, Juhu Beach',       tag: 'Morning Run',  time: 'Sat 6 AM',     count: 4  },
  { label: 'Café Chat, Blue Tokai, Powai',  tag: 'Café Chat',    time: 'Today 5 PM',   count: 7  },
  { label: 'Photography Walk, Colaba',       tag: 'Photography',  time: 'Sun 7 AM',     count: 3  },
  { label: 'Book Browsing, Kitab Khana',     tag: 'Books',        time: 'Sat 3:30 PM',  count: 6  },
];

const TRENDING = [
  'Café Chat', 'Morning Run', 'Museum', 'Street Food', 'City Walk', 'Yoga', 'Live Events',
];

const PALETTE: Record<string, string> = {
  'Morning Run':  '#1FAE6B',
  'Café Chat':    '#FFB23E',
  'Photography':  '#7A4FE0',
  'Books':        '#7A4FE0',
  'Street Food':  '#FFB23E',
  'Museum':       '#2E6BFF',
  'City Walk':    '#2E6BFF',
  'Yoga':         '#1FAE6B',
  'Live Events':  '#2E6BFF',
};
const c = (tag: string) => PALETTE[tag] ?? '#2E6BFF';

export function FeedRail() {
  return (
    <div className="sticky top-24 flex flex-col gap-4">
      {/* Activities near you */}
      <div
        className="rounded-[var(--radius-lg)] p-4 flex flex-col gap-4"
        style={{
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-1)',
          border: '1px solid rgba(20,26,46,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <Zap size={15} style={{ color: 'var(--color-azure)' }} aria-hidden="true" />
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            Activities near you
          </h2>
        </div>

        <ul className="flex flex-col gap-3" role="list">
          {NEARBY.map(item => (
            <li key={item.label} className="flex flex-col gap-1">
              <span className="text-xs font-medium leading-snug" style={{ color: 'var(--color-ink)' }}>
                {item.label}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className="text-xs px-1.5 py-0.5 rounded-pill font-medium"
                  style={{
                    background: `${c(item.tag)}18`,
                    color: c(item.tag),
                    border: `1px solid ${c(item.tag)}2A`,
                  }}
                >
                  {item.tag}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>
                  {item.time} · {item.count} going
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Trending tags */}
      <div
        className="rounded-[var(--radius-lg)] p-4 flex flex-col gap-3"
        style={{
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-1)',
          border: '1px solid rgba(20,26,46,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={15} style={{ color: 'var(--color-violet)' }} aria-hidden="true" />
          <h2
            className="text-sm font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ink)' }}
          >
            Trending this week
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {TRENDING.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-pill text-xs font-medium"
              style={{
                background: `${c(tag)}12`,
                color: c(tag),
                border: `1px solid ${c(tag)}28`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Platonic community note */}
      <p className="text-xs text-center px-2 leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
        Strictly platonic community · activities only · no contact info shared
      </p>
    </div>
  );
}
