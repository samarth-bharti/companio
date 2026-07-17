import type { Metadata } from 'next';
import { InfoPage } from '@/components/layout/InfoPage';
import { COMPANY, GRIEVANCE_OFFICER_PHRASE } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Community Guidelines, Companio',
  description:
    'What is allowed on Companio and what is not: be real, stay platonic, never exchange money with a member, and how we moderate, ban and hear appeals.',
};

/**
 * Community Guidelines — published because members are bound by them.
 *
 * The sign-up checkbox has always read "I agree to the Terms & Community
 * Guidelines", and the Terms name the Guidelines as part of the agreement. The
 * link went to /terms, and no Guidelines page existed anywhere on the site. A
 * person cannot consent to a document that has never been published, and an
 * intermediary cannot enforce one: every suspension under these rules was being
 * made under rules the member had no way to read.
 *
 * The text follows the executed Community Guidelines. One deviation, deliberate:
 * §3(k) of the document says money on Companio is "only ever for platform
 * features, such as subscriptions, boosts, or gifts bought through the app".
 * Boosts and gifts do not exist and cannot be bought, and lib/server/pricing.ts
 * refuses them outright. Publishing that list would advertise a catalogue that
 * does not exist, so the clause names the one thing that is actually sold. The
 * amendment is logged in docs/PAYMENTS-ACTIVATION.md §4.
 */

const NOT_ALLOWED_CONTENT = [
  'Nudity or sexually explicit content',
  'Hate speech or discrimination',
  'Harassment, bullying, or threats',
  'Soliciting or advertising commercial sexual services',
  'Scams, fraud, or asking a member for money',
  'Pyramid schemes, MLMs, crypto scams, or investment solicitation',
  'Spam, or promoting unrelated apps and services',
  'Anything involving or sexualising minors',
  'Self-harm or suicide-related content',
  'Illegal drugs or weapons, including firearms',
  "Sharing someone else's private information without consent (doxxing)",
];

const NOT_ALLOWED_CONDUCT = [
  'Catfishing or impersonating someone else',
  'Running multiple accounts',
  'Bots or automated use of the app',
  'Asking a member for money, loans, or gifts',
  "Contacting someone after they've blocked or reported you",
  "Sharing screenshots of private chats without the other person's consent",
  'Secretly recording or photographing someone without their consent, including hidden cameras',
  "Recruiting influencers or creators, or arranging commercial shoots, without saying that's what you're doing",
  'Using Companio to arrange anything illegal',
  'Misconduct during a meetup arranged through Companio — treated exactly like misconduct on the app',
];

const ZERO_TOLERANCE = [
  'Any sexualisation of minors, or any sign a user may be a minor',
  'Threats of violence, or a credible safety threat',
  'Soliciting commercial sexual services',
  'Fraud or financial scams',
  'Asking for, or offering, payment for meeting someone or for time spent together, in any form',
];

const SAFETY_TIPS = [
  'Meet in public, especially the first time.',
  "Tell someone you trust who you're meeting, and where.",
  'Never share financial details, OTPs, or money with a member.',
  'Video-chat first if you can, to confirm they match their profile.',
  'Trust your gut. Leave if something feels off, and report it afterwards.',
  'Consider turning on in-app SOS and live-location sharing during the meetup.',
];

/** A list that reads as a list, rather than as a paragraph wearing commas. */
function Rules({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2 list-disc pl-5">
      {items.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  );
}

export default function CommunityGuidelinesPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Community Guidelines."
      intro="Companio exists for genuine, platonic companionship between verified adults. These Guidelines are part of our Terms of Service, and they exist to protect that purpose and your safety — because we help arrange real meetings, with real people."
      sections={[
        {
          heading: '1. Be real',
          body: [
            'Use real, recent photos of yourself. No stock photos, no celebrity photos, and no pictures of anyone else.',
          ],
        },
        {
          heading: '2. Not allowed, anywhere on Companio',
          body: [<Rules key="content" items={NOT_ALLOWED_CONTENT} />],
        },
        {
          heading: '3. Not allowed, in how you behave',
          body: [
            <Rules key="conduct" items={NOT_ALLOWED_CONDUCT} />,
            'Never ask another member for money, and never offer to pay one — not for meeting you, not for their time, not for anything during or after a meetup, and not through some other app afterwards. Money on Companio is only ever for the pass, which is access to the platform. It is never payment for a person.',
          ],
        },
        {
          heading: '4. Zero tolerance — instant, permanent ban',
          body: [
            'These get an immediate and permanent ban with no warning first, and may be reported to the authorities where the law requires or permits it:',
            <Rules key="zero" items={ZERO_TOLERANCE} />,
          ],
        },
        {
          heading: '5. Everything else: warning, then suspension, then ban',
          body: [
            'For anything not in Section 4, we normally warn you first, then suspend for repeat or more serious issues, then ban. A single incident serious enough on its own can skip straight to a suspension or a ban.',
          ],
        },
        {
          heading: '6. Reporting someone',
          body: [
            'Report a profile, a message or a meetup from inside the app — every profile and conversation has a Report control, and you can attach a screenshot.',
            'We aim to review reports within about 48 hours. Reports involving nudity, sexually explicit content, exposure of private areas, or morphed images are prioritised and handled within the timelines the law requires.',
          ],
        },
        {
          heading: '7. Appealing a ban',
          id: 'appeals',
          body: [
            <>
              If you are suspended or banned, you can appeal in writing to our{' '}
              {GRIEVANCE_OFFICER_PHRASE} at{' '}
              <a
                href={`mailto:${COMPANY.grievanceOfficer.email}`}
                className="underline underline-offset-4"
              >
                {COMPANY.grievanceOfficer.email}
              </a>{' '}
              within 15 days, explaining why you think it was a mistake. Zero-tolerance bans are
              reviewed, but rarely reversed without clear evidence of an error.
            </>,
          ],
        },
        {
          heading: '8. How we moderate',
          body: [
            'A mix of automated screening and human review. ID and selfie verification is our team comparing the photo on your document to your selfie by eye.',
            'It is a fraud check, not a criminal-background check. Do not treat a "Verified" badge as a guarantee of anybody\'s character — it means the person is who they say they are, and nothing more.',
          ],
        },
        {
          heading: '9. Staying safe when you meet',
          body: [<Rules key="safety" items={SAFETY_TIPS} />],
        },
        {
          heading: '10. Contact',
          body: [
            <>
              Report a user or a message in-app, or email{' '}
              <a href={`mailto:${COMPANY.supportEmail}`} className="underline underline-offset-4">
                {COMPANY.supportEmail}
              </a>
              .
            </>,
          ],
        },
      ]}
      footnote="These Guidelines form part of the Terms of Service · TRYCOMPANIOLABS LLP"
    />
  );
}
