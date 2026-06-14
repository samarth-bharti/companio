import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'About, Companio' };

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Why Companio exists."
      intro="Cities are full of people and still easy to feel alone in. Companio is a safe, verified way to share the ordinary good moments, a walk, a workout, a coffee, a gig, with warm, real company."
      sections={[
        {
          heading: 'The idea',
          body: [
            'Loneliness is not a niche problem. People move cities for work, arrive knowing nobody, and slowly stop doing the things they love because doing them alone feels worse than not doing them at all.',
            'Companio connects you with Aadhaar-verified companions for strictly platonic activities, so you never have to skip the gig, the walk, or the museum just because you would have gone alone.',
          ],
        },
        {
          heading: 'What we are not',
          body: [
            'Companio is not a dating or intimacy service of any kind. Every profile is verified, every meetup is platonic, and that line is enforced with zero tolerance. It is what keeps the community safe and trusted.',
          ],
        },
        {
          heading: 'How we make money',
          body: [
            'Honestly and transparently: a small commission on each booking, optional Companio Plus membership, and credit packs. No selling of your data, no hidden charges, no auto-debits you did not choose.',
          ],
        },
      ]}
    />
  );
}
