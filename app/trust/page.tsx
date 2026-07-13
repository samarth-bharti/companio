import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { VERIFICATION_STEPS } from '@/lib/trust';

export const metadata: Metadata = { title: 'Trust & verification, Companio' };

export default function TrustPage() {
  return (
    <InfoPage
      eyebrow="Safety"
      title="Trust & verification."
      intro="Exactly what stands behind every profile — including what does not, yet."
      sections={[
        // The three headings this page used to carry ("Aadhaar & KYC
        // verification", "Background checks") described a pipeline that has
        // never been built. VERIFICATION_STEPS describes the one that runs.
        ...VERIFICATION_STEPS,
        {
          heading: 'Money protection',
          body: [
            'One ₹199 fee unlocks every verified profile in your city and includes your first two meetings. You are never charged to meet. If nobody feels like the right fit, ask for a full refund within 7 days.',
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
