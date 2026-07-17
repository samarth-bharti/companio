import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { formatPaise, PASS_TIERS } from '@/lib/money';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = { title: 'Refund policy, Companio' };

export default function RefundsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Refund policy."
      intro="If we didn't deliver what you paid for, you get your money back. Beyond that, a pass is non-refundable once it is active."
      sections={[
        {
          heading: `The pass (from ${formatPaise(PASS_TIERS.pass1m.amount)})`,
          body: [
            // This page previously promised a 7-day, no-questions-asked refund on
            // any tier. The executed Refund Policy §2 does not offer a cooling-off
            // window, and the signed document governs. The wording below is the
            // narrower promise, stated plainly rather than buried: a pass unlocks
            // instantly and in full, which is precisely why there is nothing to
            // return once it has been used.
            'A pass is non-refundable once it is active. It delivers everything it promises the moment you buy it — every profile in your city, unblurred — so there is no undelivered portion to return, and no pro-rata refund if you stop using it.',
            'That does not cut into your rights under the Consumer Protection Act, 2019, and it does not apply when the fault is ours. If your payment went through but your pass never activated, that is not a refund request, it is a failure — see below.',
          ],
        },
        {
          heading: 'When we do refund',
          body: [
            <>
              Three cases, and we do not argue about any of them: your payment succeeded but the
              pass never activated; you were charged twice for the same pass; or the law entitles
              you to a refund. Email{' '}
              <a href={`mailto:${COMPANY.supportEmail}`} className="underline underline-offset-4">
                {COMPANY.supportEmail}
              </a>{' '}
              with the payment reference from your bank or UPI app.
            </>,
            'We look into billing problems within 7 business days, and approved refunds go back to your original payment method within 5–7 business days. Your bank or UPI provider may take a little longer to show it.',
          ],
        },
        {
          heading: 'Charged twice, or charged for nothing',
          body: [
            'If a payment fails but money still leaves your account, or you are charged twice — including because of a gateway or settlement glitch — we reverse it. Automatically where we catch it ourselves, on request otherwise. The non-refundable rule above has nothing to do with this: you are getting back money that was never a purchase.',
            'Please contact us before raising a chargeback with your bank. We can usually fix it faster than the dispute process can, and it keeps your account clear.',
          ],
        },
        {
          heading: 'No auto-renewal',
          body: [
            'There is nothing to cancel. A pass does not renew, we never store a mandate against your card or UPI, and no money is ever taken from you without you choosing to buy something. When a timed pass runs out, it simply stops — you are not charged again, and you are not reminded to be.',
          ],
        },
        // A refund policy is a contract, so it may only describe things that can
        // actually be bought. Two sections were deleted here rather than
        // reworded:
        //
        //   "Meetup credits" promised a pro-rata refund on purchased credits.
        //   "Companio Plus" promised a refund if Plus "was charged in error".
        //
        // Neither can be charged at all: lib/server/pricing.ts refuses `credits`
        // and `plus` outright until there is an RBI Payment Aggregator licence,
        // and the pricing page deleted both products rather than leave them
        // dormant. A published promise to refund a purchase nobody can make
        // describes a catalogue that does not exist.
        {
          heading: 'Your included meeting',
          body: [
            'The meeting included with your pass is not bought separately and has no separate price, so there is nothing to refund on its own. It never expires, and it survives a pass running out.',
          ],
        },
        {
          heading: 'Cancelled meetups',
          body: [
            // Was: "your credit or payment returns automatically, usually within
            // minutes, at most 48 hours to your original payment method." The
            // credit half is true and implemented. The payment half never was:
            // paid meetups cannot be booked, and both the cancel and decline
            // routes refuse a cash reversal outright (`refund_not_supported`),
            // because it would need a real refund and a payout reversal and
            // neither exists.
            'If a companion cancels, your included meeting returns to your wallet immediately — you lose nothing. Meetups are not charged for, so there is no payment to reverse.',
            'If you cancel more than 24 hours before a meetup, the meeting returns to your wallet instantly. Inside 24 hours, it counts as used: your companion reserved that time for you.',
          ],
        },
      ]}
    />
  );
}
