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
          // "Every active companion profile carries a blue verified tick. If a
          // profile has no tick, it is not active, report it immediately." No
          // profile carries a tick — the `verified` column is false for all of
          // them — so this told every member that every real companion was a
          // fraud. A safety page that cries wolf teaches people to ignore it.
          heading: 'Match the meetup code',
          body: [
            'Your booking confirmation shows a 4-digit meetup code. Your companion sees the same four digits in their app. Ask them to read it out when you meet, before you go anywhere.',
            'If the digits do not match, or they cannot produce them, you are not meeting the person you booked. Do not continue, and report it to us.',
          ],
        },
        {
          heading: 'Match the face to the profile',
          body: [
            'The photo on the profile is the photo we reviewed. If the person in front of you is not the person in the picture, that is the end of the meetup, and we want to hear about it the same day.',
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
