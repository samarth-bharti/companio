import { BadgeCheck, ChevronLeft, Star } from 'lucide-react';

const CHIPS = ['City Walk', 'Museum', 'Café'];

const REVIEWS = [
  { author: 'Shreya M.', text: '"Priya knows every quiet lane in Bandra, wonderful company."' },
  { author: 'Rahul D.', text: '"Punctual, warm, and genuinely curious. Will book again."' },
];

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 py-2" style={{ background: '#fff', borderBottom: '1px solid rgba(20,26,46,0.06)' }} aria-hidden="true">
      <span className="font-sans font-semibold text-[10px]" style={{ color: 'var(--color-ink)' }}>9:41</span>
      <div className="flex gap-1 items-center">
        {[14, 10, 6].map((h, i) => <div key={i} className="w-1 rounded-sm" style={{ height: h, background: 'var(--color-ink)' }} />)}
        <div className="ml-1 w-5 h-2.5 rounded-sm border" style={{ borderColor: 'var(--color-ink)' }}>
          <div className="h-full w-[80%] rounded-sm" style={{ background: 'var(--color-emerald)' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Expanded companion profile — rendered inside the shared phone frame (state 1).
 * Pure DOM/CSS, no hooks, no frame border.
 */
export function PhoneProfile() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#F7F8FC' }}>
      <StatusBar />

      {/* Back nav */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#fff', borderBottom: '1px solid rgba(20,26,46,0.06)' }}>
        <ChevronLeft size={16} style={{ color: 'var(--color-azure)' }} aria-hidden="true" />
        <span className="font-sans font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>Profile</span>
      </div>

      {/* Avatar hero */}
      <div className="flex flex-col items-center pt-5 pb-4 px-4" style={{ background: '#fff' }}>
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center font-sans font-bold text-2xl text-white mb-3"
          style={{ background: 'var(--color-azure)' }}
        >
          PS
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="font-sans font-bold text-base" style={{ color: 'var(--color-ink)' }}>Priya S.</span>
          <BadgeCheck size={16} style={{ color: 'var(--color-emerald)' }} aria-label="Verified" />
        </div>
        <div className="flex items-center gap-1 mb-3">
          <Star size={11} fill="var(--color-gold)" strokeWidth={0} aria-hidden="true" />
          <span className="font-sans text-xs font-semibold" style={{ color: 'var(--color-ink)' }}>4.9</span>
          <span className="font-sans text-xs" style={{ color: 'var(--color-ink-muted)' }}>(124 reviews)</span>
        </div>
        {/* Frosted metadata chips */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {CHIPS.map((chip) => (
            <span
              key={chip}
              className="font-sans text-[10px] font-semibold px-2.5 py-1 rounded-pill"
              style={{ background: '#EBF1FF', color: '#2E6BFF', border: '1.5px solid rgba(46,107,255,0.2)' }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div className="flex-1 mx-3 mt-3 overflow-hidden">
        <p className="font-sans font-bold text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--color-azure)' }}>Reviews</p>
        {REVIEWS.map((r) => (
          <div key={r.author} className="mb-3">
            <p className="font-sans text-[10px] font-bold mb-0.5" style={{ color: 'var(--color-ink)' }}>{r.author}</p>
            <p className="font-sans text-[10px] leading-snug" style={{ color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>{r.text}</p>
          </div>
        ))}
      </div>

      {/* Book button */}
      <div className="px-3 pb-5 pt-2">
        <button
          className="w-full py-2.5 rounded-xl font-sans font-bold text-xs text-white"
          style={{ background: 'var(--grad-cta)', boxShadow: 'var(--glow-azure)' }}
        >
          Book a walk
        </button>
      </div>
    </div>
  );
}
