import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Cookie policy, Companio' };

export default function CookiesPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Cookie policy."
      intro="We use a small number of cookies to keep you signed in and make the product work. No third-party ad trackers."
      sections={[
        {
          heading: 'Essential',
          body: [
            'Session and security cookies that keep you signed in and protect your account. The product cannot work without these.',
          ],
        },
        {
          heading: 'Preferences',
          body: [
            'Your chosen city, motion settings, and similar comfort options are stored on your device so the site remembers how you like it.',
          ],
        },
        {
          heading: 'Analytics',
          body: [
            'Privacy-respecting, aggregate-only usage analytics that help us see which features matter. No cross-site tracking, no data sales, and you can opt out in settings.',
          ],
        },
      ]}
    />
  );
}
