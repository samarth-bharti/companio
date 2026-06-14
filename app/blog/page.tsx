import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Blog, Companio' };

export default function BlogPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="The Companio journal."
      intro="Stories, safety guides, and city notes from the Companio community. The full journal is coming soon, here's a taste of what we'll be writing about."
      sections={[
        {
          heading: 'Making a new city feel like home',
          body: [
            'Practical ways to build a routine and a small circle when you have just moved, from morning-walk regulars to the café where they remember your order.',
          ],
        },
        {
          heading: 'How we verify every companion',
          body: [
            'A behind-the-scenes look at ID matching, selfie checks, and background screening, and why every step matters before a profile goes live.',
          ],
        },
        {
          heading: 'Meetups that became routines',
          body: [
            'Real (anonymised) stories from members who found a regular gym partner, a museum buddy, or someone to share the Sunday market with.',
          ],
        },
      ]}
    />
  );
}
