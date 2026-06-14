import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Terms of service, Companio' };

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of service."
      intro="The short version: Companio is a strictly platonic companionship marketplace. Treat people with respect, keep payments on the platform, and we'll all be fine."
      sections={[
        {
          heading: '1. What Companio is',
          body: [
            'Companio connects members with Aadhaar-verified companions for shared activities, city walks, gym sessions, café conversations, live events, elder company, and everyday help.',
            'Companio is not a dating, romance, or intimacy service of any kind. Any solicitation of romantic or sexual services results in an immediate permanent ban and, where applicable, a report to authorities.',
          ],
        },
        {
          heading: '2. Eligibility',
          body: [
            'You must be 18 or older to use Companio. Companions additionally complete identity verification (Aadhaar match, selfie match) and a background check before their profile goes live.',
          ],
        },
        {
          heading: '3. Bookings & payments',
          body: [
            'All payments run through the platform and are held in escrow until your meetup has happened. Companions are paid after the session completes. Paying or accepting payment off-platform breaks these terms and removes every protection we offer.',
            'Meetup credits never expire. The one-time profile unlock is a single payment, there is no auto-debit and no recurring charge unless you explicitly subscribe to Companio Plus, which you can cancel anytime in two taps.',
          ],
        },
        {
          heading: '4. Conduct',
          body: [
            'First meetups happen in public places. Both members and companions can rate each other after a session, report any concern within 24 hours, and use the in-app SOS at any time during a meetup.',
            'Harassment, discrimination, or pressuring anyone to move communication or payment off-platform leads to removal.',
          ],
        },
        {
          heading: '5. Cancellations',
          body: [
            'Cancel free of charge up to 24 hours before a meetup. If a companion cancels, your credit or payment is returned in full, automatically.',
          ],
        },
      ]}
    />
  );
}
