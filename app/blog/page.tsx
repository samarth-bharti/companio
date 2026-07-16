import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Blog, Companio' };

/**
 * There is no journal yet, so this page says that and nothing else.
 *
 * It used to tease three articles. One of them — "Meetups that became routines:
 * real (anonymised) stories from members who found a regular gym partner" —
 * described members Companio does not have and meetups that have not happened.
 * A "coming soon" page is a fine thing to ship; a "coming soon" page that
 * describes traction as though it already exists is not, and it is the same
 * invented-traction problem that cost this site four fabricated stat counters.
 *
 * Add real entries here when they are written, about things that actually
 * happened.
 */
export default function BlogPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="The Companio journal."
      intro="We haven't written anything yet. When we do, it will be here: safety guides, city notes, and what we learn as Companio gets going."
      sections={[
        {
          heading: 'Nothing published yet',
          body: [
            'Companio is new. Rather than fill this page with placeholder posts, we have left it empty until there is something worth reading.',
            'If you want to know how we verify companions before their profile goes live, that is written up in full on our trust page — it is the one thing we would have written about first anyway.',
          ],
        },
      ]}
    />
  );
}
