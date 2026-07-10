import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { COMPANY, COMPANY_DISPLAY } from '@/lib/company';

export const metadata: Metadata = { title: 'Terms of service, Companio' };

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms of service."
      intro="The short version: Companio is a strictly platonic companionship marketplace. Treat people with respect, keep payments on the platform, and we'll all be fine."
      footnote={`Last updated June 2026 · ${COMPANY_DISPLAY.legalName} · ${COMPANY_DISPLAY.registeredAddress}`}
      sections={[
        {
          heading: '1. What Companio is',
          body: [
            'Companio connects members with ID-verified companions for shared activities, city walks, gym sessions, café conversations, live events, elder company, and everyday help.',
            'Companio is a neutral intermediary that hosts companion profiles; it is not the employer of companions and is not a party to the meetup itself. Companio is not a dating, romance, or intimacy service of any kind. Any solicitation of romantic or sexual services results in an immediate permanent ban and, where applicable, a report to authorities.',
          ],
        },
        {
          heading: '2. Eligibility',
          body: [
            'You must be 18 or older to use Companio. Companions additionally complete identity verification (ID match, selfie match) and a background check before their profile goes live.',
          ],
        },
        {
          heading: '3. Bookings, payments & fees',
          body: [
            'Companio currently charges a single one-time fee of ₹199, which unlocks every verified companion profile in your city and includes your first two meetings. You are not charged to book or attend those meetings. If you have not found anyone you would like to meet, you may request a full refund of the ₹199 within 7 days of payment.',
            'Payments are processed by Razorpay. Companio does not currently collect, hold, or settle any payment between you and a companion. Companions are compensated by Companio directly. Paying or accepting payment off-platform breaks these terms and removes every protection we offer.',
            'Paid meetups beyond your two included meetings are not yet available. When they launch, the price will always be shown before you book, and these terms will be updated before any such charge is made. Applicable taxes (including GST, once we are registered) will be shown at checkout. Included meetings never expire.',
          ],
        },
        {
          heading: '4. Conduct',
          body: [
            'First meetups happen in public places. Both members and companions can rate each other after a session, report any concern, and use the in-app SOS at any time during a meetup.',
            'Harassment, discrimination, or pressuring anyone to move communication or payment off-platform leads to removal. As an intermediary, Companio is not responsible for the conduct of users or companions during a meetup, but we will act on reports.',
          ],
        },
        {
          heading: '5. Cancellations & refunds',
          body: [
            'Cancel free of charge up to 24 hours before a meetup. If a companion cancels, your credit or payment is returned in full, automatically. Full details are in our Refund Policy.',
          ],
        },
        {
          heading: '6. Weekly spin',
          id: 'spin',
          body: [
            'Eligible signed-in users may spin the wheel once every 7 days. Prizes are discounts on a future booking only — there are no cash prizes and no guaranteed reward; most spins win nothing. A won discount is tied to your account, is non-transferable, has no cash value, and expires 7 days after it is won. The outcome of each spin is determined by Companio on the server and is final. We may change or withdraw the promotion at any time.',
          ],
        },
        {
          heading: '7. Limitation of liability',
          body: [
            'Companio provides the platform "as is" and acts as an intermediary. To the maximum extent permitted by law, Companio is not liable for indirect or consequential losses, or for the acts or omissions of users or companions during a meetup. Our total liability for any claim is limited to the platform fees you paid in the three months before the claim. Nothing here limits liability that cannot be excluded by law.',
          ],
        },
        {
          heading: '8. Suspension & termination',
          body: [
            'We may suspend or terminate an account for breach of these terms, fraud, safety risk, or any conduct that endangers the community, with notice where practical. You may stop using Companio and delete your account at any time from settings.',
          ],
        },
        {
          heading: '9. Governing law & disputes',
          body: [
            `These terms are governed by ${COMPANY.governingLaw}. Any dispute will first be attempted to be resolved amicably; failing that, it will be referred to arbitration by a sole arbitrator under the Arbitration and Conciliation Act, 1996, seated in ${COMPANY.jurisdiction}, and the courts at ${COMPANY.jurisdiction} will have exclusive jurisdiction.`,
          ],
        },
        {
          heading: '10. Changes & contact',
          body: [
            `We may update these terms; material changes will be notified in-app or by email. Questions or grievances: ${COMPANY_DISPLAY.grievanceOfficer.name}, ${COMPANY_DISPLAY.grievanceOfficer.email}. ${COMPANY_DISPLAY.legalName}, ${COMPANY_DISPLAY.registeredAddress}.`,
          ],
        },
      ]}
    />
  );
}
