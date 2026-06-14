import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Refund policy, Companio' };

export default function RefundsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Refund policy."
      intro="Simple and honest: if you didn't get what you paid for, you get your money back."
      sections={[
        {
          heading: 'Profile unlock (₹199)',
          body: [
            "Didn't find anyone you'd like to meet? Full refund within 7 days of unlocking, no questions asked. One tap from your dashboard.",
          ],
        },
        {
          heading: 'Meetup credits',
          body: [
            'Credits never expire. Unused purchased credits are refundable at the price you paid, pro-rata, within 30 days of purchase.',
          ],
        },
        {
          heading: 'Cancelled meetups',
          body: [
            'If a companion cancels, your credit or payment returns automatically, usually within minutes, at most 48 hours to your original payment method.',
            'If you cancel more than 24 hours before a meetup, the credit returns to your wallet instantly. Inside 24 hours, the meetup counts as used, companions reserve that time for you.',
          ],
        },
        {
          heading: 'Companio Plus',
          body: [
            'Cancel anytime in two taps from your dashboard. Your benefits run to the end of the paid month; we never charge again after you cancel.',
          ],
        },
      ]}
    />
  );
}
