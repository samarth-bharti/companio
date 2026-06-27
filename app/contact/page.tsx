import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { COMPANY, COMPANY_DISPLAY } from '@/lib/company';

export const metadata: Metadata = { title: 'Contact us, Companio' };

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Contact us."
      intro="Real people, real replies. Whatever you need — a question, a problem with a meetup, a safety concern, or a privacy request — here's how to reach us."
      sections={[
        {
          heading: 'General support',
          body: [
            `For anything about your account, bookings, payments, or how Companio works, email ${COMPANY.supportEmail}. We aim to reply within one business day.`,
          ],
        },
        {
          heading: 'Safety concern',
          body: [
            'If you ever feel unsafe during a meetup, use the in-app SOS first. To report a person or an incident after the fact, use the report option on their profile, or email us and mark it URGENT — safety reports jump the queue.',
          ],
        },
        {
          heading: 'Privacy & your data',
          body: [
            `To access, correct, or delete your data, or raise any privacy concern under the DPDPA, contact our Grievance Officer, ${COMPANY_DISPLAY.grievanceOfficer.name}, at ${COMPANY_DISPLAY.grievanceOfficer.email}${COMPANY_DISPLAY.grievanceOfficer.phone ? ` (${COMPANY_DISPLAY.grievanceOfficer.phone})` : ''}. General privacy queries: ${COMPANY.privacyEmail}.`,
          ],
        },
        {
          heading: 'Company',
          body: [
            `${COMPANY_DISPLAY.legalName} · ${COMPANY_DISPLAY.registeredAddress}${COMPANY_DISPLAY.llpin ? ` · LLPIN ${COMPANY_DISPLAY.llpin}` : ''}.`,
          ],
        },
      ]}
    />
  );
}
