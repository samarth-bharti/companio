import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { formatPaise, PASS_TIERS } from '@/lib/money';

export const metadata: Metadata = { title: 'Refund policy, Companio' };

export default function RefundsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Refund policy."
      intro="Simple and honest: if you didn't get what you paid for, you get your money back."
      sections={[
        {
          heading: `The pass (from ${formatPaise(PASS_TIERS.pass1m.amount)})`,
          body: [
            // The dashboard tap now exists (Dashboard → Account → Request a refund).
            // What it does NOT do is move the money by itself, so this no longer
            // implies an instant reversal: it says a person handles it, and by when.
            "Didn't find anyone you'd like to meet? Full refund within 7 days of buying your pass, whichever tier you bought, no questions asked. Request it in one tap from your dashboard, under Account. We refund it to your original payment method within 5 working days and email you when it is done.",
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
            'The meeting included with your pass is not bought separately and has no separate price, so there is nothing to refund on its own — it is covered by the 7-day refund on the pass itself. It never expires, and it survives a pass running out.',
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
