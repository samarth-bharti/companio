import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';

export const metadata: Metadata = { title: 'Trust & KYC, Companio' };

export default function TrustPage() {
  return (
    <InfoPage
      eyebrow="Safety"
      title="Trust & KYC."
      intro="Every layer of Companio is built so two strangers can meet with total confidence. Here's exactly what stands behind every profile."
      sections={[
        {
          heading: 'Aadhaar & KYC verification',
          body: [
            "Every companion's identity is verified against Aadhaar before activation, name, age, and a live selfie match. No exceptions, no grandfathered accounts.",
          ],
        },
        {
          heading: 'Background checks',
          body: [
            'Companions consent to a third-party background check before their profile goes live. Profiles are also reviewed by our team, photos, bio, and services.',
          ],
        },
        {
          heading: 'Money protection',
          body: [
            'Your payment is locked in escrow until after you meet. No meeting, no charge. Companions are paid only after the session completes.',
          ],
        },
        {
          heading: 'During every meetup',
          body: [
            'One-tap SOS activates emergency contact sharing and location broadcast. First meetups happen in public places, and a report/block button is always one tap away.',
          ],
        },
        {
          heading: 'The platonic promise',
          body: [
            'Companio is for company, never anything else. Zero tolerance for non-platonic conduct, enforced with immediate permanent bans for either side.',
          ],
        },
      ]}
    />
  );
}
