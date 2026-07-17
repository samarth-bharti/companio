import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { VERIFICATION_STEPS } from '@/lib/trust';
import { formatPaise, PASS_TIERS } from '@/lib/money';

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
            `A pass, from ${formatPaise(PASS_TIERS.pass1m.amount)}, unlocks every profile in your city and includes your first meeting. You are never charged to meet. Nothing renews and nothing is auto-debited — a pass expires and you decide whether to buy another. A pass is non-refundable once active, but a payment that never activated one, or a duplicate charge, we refund without argument.`,
          ],
        },
        {
          heading: 'During every meetup',
          body: [
            // "Location broadcast" claimed a class of system we have not built:
            // sos.ts calls getCurrentPosition() ONCE and shares a static maps
            // link. Nothing follows you if you move. It also needs a trusted
            // contact saved in advance and location permission granted, so
            // "activates" overstated it too.
            'One-tap SOS sends your current location and your companion’s name to a trusted contact you have saved, over WhatsApp or SMS. It is a snapshot you send, not continuous tracking, and it needs location permission. First meetups happen in public places, and a report/block button is always one tap away.',
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
