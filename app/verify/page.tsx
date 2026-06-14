import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Verify a companion, Companio' };

export default function VerifyPage() {
  return (
    <InfoPage
      eyebrow="Safety"
      title="Verify a companion."
      intro="Meeting someone from Companio? Here's how to confirm you're meeting exactly who you booked."
      sections={[
        {
          heading: 'Check the badge',
          body: [
            'Every active companion profile carries a blue verified tick. If a profile has no tick, it is not active, report it to us immediately.',
          ],
        },
        {
          heading: 'Match the meetup code',
          body: [
            'Your booking confirmation includes a 4-digit meetup code. Your companion has the same code in their app, compare codes when you meet. They will expect you to ask.',
          ],
        },
        {
          heading: 'Stay in the app',
          body: [
            'All coordination before a meetup happens in Companio chat. Anyone asking to move to another app before you have met, or asking for payment outside the platform, is breaking our rules, report and we investigate within 24 hours.',
          ],
        },
        {
          heading: 'Something feels off?',
          body: [
            'Trust your instincts. End the meetup, use the in-app SOS if you need it, and report within 24 hours, our trust team reviews every report.',
          ],
        },
      ]}
    />
  );
}
