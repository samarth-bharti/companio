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
            // The dashboard tap now exists (Dashboard → Account → Request a refund).
            // What it does NOT do is move the money by itself, so this no longer
            // implies an instant reversal: it says a person handles it, and by when.
            "Didn't find anyone you'd like to meet? Full refund within 7 days of unlocking, no questions asked. Request it in one tap from your dashboard, under Account. We refund it to your original payment method within 5 working days and email you when it is done.",
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
            'Companio Plus is a one-time purchase, not a subscription — there is no recurring charge and nothing to cancel. If Plus was charged in error, contact support within 7 days for a full refund.',
          ],
        },
      ]}
    />
  );
}
