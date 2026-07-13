import { BadgeCheck, Check } from 'lucide-react';

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
 * Booking-confirmed screen — rendered inside the shared phone frame (state 2).
 * Emerald check disc, "Walk confirmed", ticket-style detail row, footer usage line.
 * Pure DOM/CSS, no hooks, no frame border.
 */
export function PhoneConfirmed() {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#F7F8FC' }}>
      <StatusBar />

      <div className="flex flex-col items-center justify-center flex-1 px-5">
        {/* Emerald check disc — Seal-like treatment */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
          style={{ background: 'var(--color-emerald)', boxShadow: '0 8px 24px rgba(31,174,107,0.35)' }}
          aria-hidden="true"
        >
          <Check size={26} strokeWidth={2.5} className="text-white" />
        </div>

        <h3
          className="font-display font-semibold text-xl mb-1.5 text-center"
          style={{ color: 'var(--color-ink)', letterSpacing: '-0.02em' }}
        >
          Walk confirmed
        </h3>

        <p className="font-sans text-xs text-center mb-5" style={{ color: 'var(--color-ink-muted)' }}>
          Sat · 7:00 AM · Marine Drive
        </p>

        {/* Ticket-style row: dashed left border, activity + companion */}
        <div
          className="w-full rounded-xl p-3"
          style={{
            background: '#fff',
            borderLeft: '3px dashed var(--color-emerald)',
            boxShadow: '0 2px 8px rgba(20,26,46,0.06)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-xs font-bold" style={{ color: 'var(--color-ink)' }}>City Walk</p>
              <p className="font-sans text-[10px] mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>with Priya S.</p>
            </div>
            <BadgeCheck size={15} style={{ color: 'var(--color-emerald)' }} aria-hidden="true" />
          </div>
        </div>

        {/* Footer: included-meetup usage */}
        <p className="font-sans text-[10px] mt-4 text-center" style={{ color: 'var(--color-ink-muted)' }}>
          Added to your meetups · 1 of 2 included used
        </p>
      </div>
    </div>
  );
}
