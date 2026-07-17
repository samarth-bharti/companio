import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { COMPANY, COMPANY_DISPLAY, GRIEVANCE_OFFICER_LABEL } from '@/lib/company';
import { formatPaise, PASS_TIERS } from '@/lib/money';

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
            'Companio connects members with ID-checked companions for shared activities, city walks, gym sessions, café conversations, live events, elder company, and everyday help.',
            'Companio is a neutral intermediary that hosts companion profiles; it is not the employer of companions and is not a party to the meetup itself. Companio is not a dating, romance, or intimacy service of any kind. Any solicitation of romantic or sexual services results in an immediate permanent ban and, where applicable, a report to authorities.',
          ],
        },
        {
          heading: '2. Eligibility',
          body: [
            'You must be 18 or older to use Companio. Companions additionally submit a government ID, which our team reviews by hand before their profile goes live. We do not currently run an automated Aadhaar KYC check, a biometric selfie match, or a third-party criminal background check, and this clause will be updated when we do. Companio does not warrant the character or conduct of any companion, and meeting one is at your own risk.',
          ],
        },
        {
          heading: '3. Bookings, payments & fees',
          body: [
            `Companio currently sells one thing: a pass, which unlocks every ID-checked companion profile in your city and includes your first meeting. It is offered in four tiers, identical in what they unlock and differing only in how long they last: ${formatPaise(PASS_TIERS.pass1m.amount)} for ${PASS_TIERS.pass1m.label}, ${formatPaise(PASS_TIERS.pass3m.amount)} for ${PASS_TIERS.pass3m.label}, ${formatPaise(PASS_TIERS.pass12m.amount)} for ${PASS_TIERS.pass12m.label}, and ${formatPaise(PASS_TIERS.passlife.amount)} for ${PASS_TIERS.passlife.label.toLowerCase()} access. You are not charged to book or attend your included meeting.`,
            'A pass is not a subscription. It does not renew and we never auto-debit you: a timed pass simply expires at the end of its term, after which profiles are locked again and you may choose to buy another pass or not. Buying a timed pass while one is still active adds its length to the time you have left rather than replacing it, and a lifetime pass is never shortened by a later purchase.',
            'A pass is non-refundable once it is active, because it delivers everything it promises the moment you buy it. We do refund a payment that succeeded without activating your pass, a duplicate charge, and anything the law entitles you to. Our Refund Policy sets this out in full, and nothing here removes your rights under the Consumer Protection Act, 2019.',
            'Payments are processed by Razorpay. Companio does not currently collect, hold, or settle any payment between you and a companion. Companions are compensated by Companio directly. Paying or accepting payment off-platform breaks these terms and removes every protection we offer.',
            'Paid meetups beyond your included meeting are not yet available. When they launch, the price will always be shown before you book, and these terms will be updated before any such charge is made. Applicable taxes (including GST, once we are registered) will be shown at checkout. Your included meeting never expires.',
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
            'Cancel free of charge up to 24 hours before a meetup. If a companion cancels, your included meeting returns to your wallet automatically — meetups are not charged for, so there is no payment to reverse. Full details are in our Refund Policy.',
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
            `We may update these terms; material changes will be notified in-app or by email. Questions or grievances: ${GRIEVANCE_OFFICER_LABEL}, ${COMPANY_DISPLAY.grievanceOfficer.email}. ${COMPANY_DISPLAY.legalName}, ${COMPANY_DISPLAY.registeredAddress}.`,
          ],
        },
      ]}
    />
  );
}
