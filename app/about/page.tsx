import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'About, Companio' };

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Why Companio exists."
      intro="Cities are full of people and still easy to feel alone in. Companio is a safe way to share the ordinary good moments, a walk, a workout, a coffee, a gig, with warm, real company."
      sections={[
        {
          heading: 'The idea',
          body: [
            'Loneliness is not a niche problem. People move cities for work, arrive knowing nobody, and slowly stop doing the things they love because doing them alone feels worse than not doing them at all.',
            'Companio connects you with ID-checked companions for strictly platonic activities, so you never have to skip the gig, the walk, or the museum just because you would have gone alone.',
          ],
        },
        {
          heading: 'What we are not',
          body: [
            'Companio is not a dating or intimacy service of any kind. Every profile is ID-checked, every meetup is platonic, and that line is enforced with zero tolerance. It is what keeps the community safe and trusted.',
          ],
        },
        {
          heading: 'How we make money',
          body: [
            // Was: "a small commission on each booking, optional Companio Plus
            // membership, and credit packs". Companio sells exactly one thing
            // today — the ₹199 unlock. Bookings are not charged for, Plus is not
            // on sale, and the commission is 30%, which is not "small". Describing
            // three revenue streams that do not exist, on the page about being
            // honest, is not a small thing to get wrong.
            'One ₹199 payment, once. It opens every companion profile in your city and includes your first two meetings. There is no subscription, no auto-debit, and nothing else to buy.',
            'We do not sell your data, and we never will. When we start charging a commission on bookings, this page will say what it is before you are asked to pay it.',
          ],
        },
      ]}
    />
  );
}
