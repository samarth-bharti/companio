import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Press, Companio' };

export default function PressPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Press & media."
      intro="Writing about loneliness, the companionship economy, or trust & safety in marketplaces? Here's the essentials."
      sections={[
        {
          heading: 'In one line',
          body: [
            'Companio is a safe, ID-verified marketplace for strictly platonic companionship, city walks, gym sessions, café conversations, live events, and elder company across India.',
          ],
        },
        {
          heading: 'The numbers',
          body: [
            'A growing community across India\'s major cities, every companion identity-verified and background-checked, with a one-time ₹199 unlock that includes your first two meetings.',
          ],
        },
        {
          heading: 'Get in touch',
          body: [
            'For interviews, assets, or fact-checks, write to press@companio.example. (Demo site, this address is illustrative.)',
          ],
        },
      ]}
    />
  );
}
