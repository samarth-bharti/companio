import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Privacy policy, Companio' };

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy policy."
      intro="We collect the minimum needed to keep meetups safe, we never sell your data, and your contact details stay hidden until you choose to meet."
      sections={[
        {
          heading: 'What we collect',
          body: [
            'Account basics (name, email, phone), verification data (ID match result, not the document itself, and a selfie match), and booking history. Companions additionally provide background-check consent.',
          ],
        },
        {
          heading: 'What we never do',
          body: [
            'We never sell or rent your personal data. We never show your phone number or email to another user, coordination happens in-app, and only a first name is shared when a meetup is confirmed.',
          ],
        },
        {
          heading: 'Safety processing',
          body: [
            'Live-share and SOS features process your location only while you activate them during a meetup, and stop the moment the session ends.',
          ],
        },
        {
          heading: 'Your controls',
          body: [
            'You can export or delete your account data anytime from settings. Deleting your account removes your profile, messages, and booking history within 30 days.',
          ],
        },
      ]}
    />
  );
}
