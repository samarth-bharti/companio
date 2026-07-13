import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { ContactForm } from '@/components/contact/ContactForm';
import { COMPANY, COMPANY_DISPLAY } from '@/lib/company';

export const metadata: Metadata = { title: 'Contact us, Companio' };

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Support"
      title="Contact us."
      intro="Real people, real replies. Whatever you need — a question, a problem with a meetup, a safety concern, or a privacy request — write to us below and we'll get back to you."
      sections={[
        {
          heading: 'Safety concern',
          body: [
            'If you are in immediate danger, call 112. If you ever feel unsafe during a meetup, use the in-app SOS — it shares your live location with a contact you trust. To report a person or an incident after the fact, use the report option on their profile, or choose "A safety concern" below. Safety reports jump the queue.',
          ],
        },
        {
          heading: 'Privacy & your data',
          body: [
            `To access, correct, or delete your data, or raise any privacy concern under the DPDPA, contact our Grievance Officer, ${COMPANY_DISPLAY.grievanceOfficer.name}, at ${COMPANY_DISPLAY.grievanceOfficer.email}${COMPANY_DISPLAY.grievanceOfficer.phone ? ` (${COMPANY_DISPLAY.grievanceOfficer.phone})` : ''}. You can also delete your account and all its data yourself, from your dashboard, at any time.`,
          ],
        },
        {
          heading: 'Prefer email?',
          body: [
            `Write to ${COMPANY.supportEmail} for anything about your account, bookings or payments, or ${COMPANY.privacyEmail} for privacy queries. We aim to reply within one business day either way.`,
          ],
        },
        {
          heading: 'Company',
          body: [
            `${COMPANY_DISPLAY.legalName} · ${COMPANY_DISPLAY.registeredAddress}${COMPANY_DISPLAY.llpin ? ` · LLPIN ${COMPANY_DISPLAY.llpin}` : ''}.`,
          ],
        },
      ]}
    >
      <ContactForm />
    </InfoPage>
  );
}
