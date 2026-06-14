import { Suspense } from 'react';
import { type Metadata } from 'next';
import { BookingWizard } from '@/components/booking/BookingWizard';

export const metadata: Metadata = {
  title: 'Book a meetup, Companio',
  description: 'Choose your activity, date, time and place. ID-verified companions. ₹ held in escrow.',
};

function BookingLoading() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--grad-hero-bg)' }}
    >
      <div
        className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'var(--color-azure)', borderTopColor: 'transparent' }}
        role="status"
        aria-label="Loading booking form"
      />
    </main>
  );
}

/**
 * BookingWizard uses useSearchParams() internally, which requires a Suspense
 * boundary per the Next.js App Router rules (§6.2).
 */
export default function BookPage() {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingWizard />
    </Suspense>
  );
}
