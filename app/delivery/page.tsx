import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = { title: 'Delivery policy, Companio' };

/**
 * Delivery policy — the page a payment aggregator looks for and calls "shipping".
 *
 * Companio ships nothing. There is no courier, no tracking number and no address
 * to deliver to: a pass is access, granted by the server the moment it verifies
 * the payment signature. That is exactly why this page has to exist and say so.
 * A reviewer working down a checklist reads a missing shipping policy as an
 * unanswered question about physical goods, and the honest answer — "there are
 * none, here is when access actually appears" — is a page, not a silence.
 *
 * Timelines here are commitments, not decoration. Vague policy language is a
 * documented rejection cause, so every claim below names a specific moment.
 */
export default function DeliveryPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Delivery policy."
      intro="Companio sells access, not objects. Nothing is posted to you, and nothing takes days to arrive."
      sections={[
        {
          heading: 'What you receive',
          body: [
            'A Companio pass is a digital product. Buying one lifts the paywall on companion profiles for your chosen city: full photos, unblurred, and the ability to message any companion before you meet. There is no physical item, no packaging and no shipment.',
          ],
        },
        {
          heading: 'When it arrives',
          body: [
            'Immediately. Your pass is active the moment our server verifies the payment signature with Razorpay, which happens during checkout — typically within a few seconds. You are returned to the profile you were viewing and it is already unlocked.',
            'You do not need to wait for an email, and there is nothing to activate or redeem. If your payment succeeded but your pass has not appeared, it is a fault on our side rather than a delay by design — see below.',
          ],
        },
        {
          heading: 'How long it lasts',
          body: [
            'For the length of the tier you bought, counted from the moment it activates. A timed pass bought while you already hold one extends from the later of today and your current expiry, so renewing early never costs you the time you had left. A lifetime pass does not expire and is never downgraded by a later purchase.',
          ],
        },
        {
          heading: 'Delivery charges',
          body: [
            'None. The price shown at checkout is the amount charged. There is no delivery fee, handling fee, or any other charge added afterwards, because there is nothing being delivered in the physical sense.',
          ],
        },
        {
          heading: 'If your pass does not appear',
          body: [
            <>
              Email{' '}
              <a href={`mailto:${COMPANY.supportEmail}`} className="underline underline-offset-4">
                {COMPANY.supportEmail}
              </a>{' '}
              with the payment reference from your bank or UPI app. We reply within one working day. If we cannot activate the pass, we refund it in full. A pass is otherwise non-refundable, but that rule has no bearing here: you never received what you paid for.
            </>,
          ],
        },
        {
          heading: 'Meetings',
          body: [
            'Meetings are arranged between you and a companion through the app; Companio does not deliver, escort or transport anyone. The meeting included with your pass has no separate price and never expires, and it survives your pass running out.',
          ],
        },
      ]}
      footnote="Companio is a digital service. Nothing on this site is shipped."
    />
  );
}
