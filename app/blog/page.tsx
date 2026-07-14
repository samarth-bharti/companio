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
            // Was: "ID matching, selfie checks, and background screening". The
            // background screening does not exist — we collect consent to run one
            // and run none, which every other page on this site now says out loud
            // (terms, privacy, trust, safety). This was the last page still
            // advertising it, and a safety claim is the worst possible place to
            // leave one lying around.
            'A behind-the-scenes look at what actually happens before a profile goes live: a government ID, checked against the number the applicant typed; a photo confirmed to be a different image from the document; and a person who reviews every application by hand.',
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
