import { Suspense } from 'react';
import { type Metadata } from 'next';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { AccountGate } from '@/components/auth/AccountGate';

export const metadata: Metadata = {
  title: 'Book a meetup, Companio',
  description: 'Choose your activity, date, time and place. ID-checked companions. Your first two meetings are included.',
};

function BookingLoading() {
  return (
    <main id="main-content"
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
    <>
      <h1 className="sr-only">Book a meetup</h1>
      <Suspense fallback={<BookingLoading />}>
        <AccountGate gate="book">
          <BookingWizard />
        </AccountGate>
      </Suspense>
    </>
  );
}
