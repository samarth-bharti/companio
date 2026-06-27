import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { COMPANY, COMPANY_DISPLAY } from '@/lib/company';

export const metadata: Metadata = { title: 'Privacy policy, Companio' };

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy policy."
      intro="We collect the minimum needed to keep meetups safe, we never sell your data, and your contact details stay hidden until you choose to meet. This policy is published under India's Digital Personal Data Protection Act, 2023 (DPDPA)."
      footnote={`Last updated June 2026 · ${COMPANY.legalName} · Grievance Officer: ${COMPANY.grievanceOfficer.email}`}
      sections={[
        {
          heading: 'What we collect',
          body: [
            'Account basics (name, email, phone), verification data (ID match result, not the document itself, and a selfie match), booking history, in-app messages, device/usage analytics, and — only while you turn them on — live location for SOS/live-share. Companions additionally provide background-check consent.',
            'We collect this on the lawful basis of your consent and to perform the service you ask us for (a safe, verified meetup).',
          ],
        },
        {
          heading: 'Why we use it',
          body: [
            'To verify identity and keep meetups safe, to process payments (via Razorpay), to run the booking and messaging features, to prevent fraud and abuse, and to meet legal obligations. We do not use your data for automated decisions that produce legal effects on you.',
          ],
        },
        {
          heading: 'What we never do',
          body: [
            'We never sell or rent your personal data. We never show your phone number or email to another user — coordination happens in-app, and only a first name is shared when a meetup is confirmed.',
          ],
        },
        {
          heading: 'Who we share it with (processors)',
          body: [
            'We share the minimum necessary with vetted processors who act only on our instructions: Razorpay (payments), our cloud host and database provider (app hosting and storage), an SMS/email provider (OTP and notifications), an identity-verification provider (KYC), and privacy-respecting analytics/error tooling. We do not share data with advertisers.',
          ],
        },
        {
          heading: 'How long we keep it (retention)',
          body: [
            'We keep account data while your account is active. When you delete your account, we remove your profile, messages and booking history within 30 days, except records we must retain by law (for example payment and tax records, typically kept for up to 8 years, and safety/abuse records where there is an open investigation).',
          ],
        },
        {
          heading: 'Safety processing',
          body: [
            'Live-share and SOS features process your location only while you activate them during a meetup, and stop the moment the session ends.',
          ],
        },
        {
          heading: 'Your rights under the DPDPA',
          body: [
            'You have the right to access a copy of your data, to correct or complete it, to withdraw consent, to erase your data, and to nominate someone to exercise these rights if you are unable to. You can export or delete your account data anytime from settings, or by writing to our Grievance Officer.',
          ],
        },
        {
          heading: 'Grievance Officer & contact',
          body: [
            `In line with the DPDPA and the IT Act, you can raise any privacy concern or complaint with our Grievance Officer, ${COMPANY_DISPLAY.grievanceOfficer.name}, at ${COMPANY_DISPLAY.grievanceOfficer.email}${COMPANY_DISPLAY.grievanceOfficer.phone ? ` (${COMPANY_DISPLAY.grievanceOfficer.phone})` : ''}. We acknowledge complaints promptly and aim to resolve them within the timelines the law requires.`,
            `${COMPANY_DISPLAY.legalName}, ${COMPANY_DISPLAY.registeredAddress}.${COMPANY_DISPLAY.llpin ? ` LLPIN: ${COMPANY_DISPLAY.llpin}.` : ''} General privacy queries: ${COMPANY.privacyEmail}.`,
          ],
        },
      ]}
    />
  );
}
