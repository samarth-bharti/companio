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
            'Companio is a safe, ID-checked marketplace for strictly platonic companionship, city walks, gym sessions, café conversations, live events, and elder company across India.',
          ],
        },
        {
          heading: 'The model',
          body: [
            // "A growing community across India's major cities" — Companio has
            // not launched. A press page is the one page a journalist will quote
            // back at you, so it states the model, not a community that does not
            // exist yet and a background check nobody runs.
            'A one-time ₹199 unlock opens every companion profile in your city and includes your first two meetings. Every companion submits a government ID that our team reviews by hand before their profile goes live.',
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
