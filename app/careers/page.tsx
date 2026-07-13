import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Careers, Companio' };

export default function CareersPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Build the antidote to loneliness."
      intro="We're a small team in India building a safe way for people to share everyday moments. If trust, safety, and genuinely useful products are your thing, we'd love to hear from you."
      sections={[
        {
          heading: 'How we work',
          body: [
            'Small teams, real ownership, and an obsession with member safety. Every feature ships behind the same question: does this keep two strangers safer when they meet?',
          ],
        },
        {
          heading: 'Open roles',
          body: [
            'We are not actively hiring for specific roles right now, but we always read thoughtful introductions from trust & safety, engineering, and city-operations people.',
            'Write to careers@companio.example with what you would want to build here. (Demo site, this address is illustrative.)',
          ],
        },
      ]}
    />
  );
}
