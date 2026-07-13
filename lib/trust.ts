/**
 * What Companio can actually say about companion verification — and nothing more.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 *
 * Fourteen separate places on the site claimed that every companion is
 * "verified against Aadhaar", passes "a live selfie match", and clears "a
 * third-party background check". Two of those places were the Terms of Service
 * and the Privacy Policy.
 *
 * None of it was true. There is no UIDAI integration, no selfie-match model, and
 * no background-check vendor. `app/api/application/upload/route.ts` says so in
 * its own header — it validates the *format* of an ID number and the *bytes* of
 * an image, and it deliberately marks nothing as verified, because only a KYC
 * vendor querying UIDAI can prove a person owns an identity.
 *
 * A safety claim a product cannot keep is the worst kind of lie it can tell: the
 * member who relies on it is the one who gets hurt, and the claim sits in a
 * contract they accepted. So the copy now describes the mechanism that actually
 * runs, and it lives here, once, rather than in fourteen hand-written strings
 * that drifted apart the moment they were written.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * WHEN A KYC VENDOR IS WIRED UP
 *
 * Set KYC_PROVIDER (e.g. 'signzy', 'hyperverge', 'idfy') and implement the check
 * in the approval path. Then — and only then — strengthen these strings. Do not
 * strengthen them first and integrate later; that is exactly how the site came
 * to promise a background check nobody had bought.
 */

import { envValue } from '@/lib/env';

/**
 * True only when a real KYC vendor is configured. Nothing in the app sets this
 * yet, so every claim below stays in its honest form.
 */
export const KYC_VENDOR_ENABLED = Boolean(envValue('KYC_PROVIDER'));

/** The one-line summary used wherever a card or chip needs it. */
export const VERIFICATION_SHORT = KYC_VENDOR_ENABLED
  ? 'Aadhaar KYC verified'
  : 'ID checked, human-reviewed';

/** The chip in the footer / nav trust row. */
export const TRUST_CHIP = KYC_VENDOR_ENABLED ? 'KYC verified' : 'ID checked';

/** The sentence used on marketing sections that describe the funnel. */
export const VERIFICATION_SENTENCE = KYC_VENDOR_ENABLED
  ? 'Every profile is Aadhaar-verified and background-checked before going live.'
  : 'Every companion submits a government ID, and a person on our team reviews it before the profile goes live.';

/**
 * The full explanation, for /trust and /safety. Written as the steps that
 * actually execute, in the order they execute.
 */
export const VERIFICATION_STEPS: { heading: string; body: string[] }[] = KYC_VENDOR_ENABLED
  ? [
      {
        heading: 'Aadhaar & KYC verification',
        body: [
          "Every companion's identity is verified against Aadhaar before activation, name, age, and a live selfie match.",
        ],
      },
    ]
  : [
      {
        heading: 'Government ID, on every application',
        body: [
          'No one can list without uploading a government ID, an Aadhaar or a PAN, alongside their profile photo.',
          'We check that the ID number is structurally valid, that the photo and the document are genuinely two different images, and that neither file has been submitted by anyone else before. This catches a forged or recycled application; it does not, on its own, prove that a person owns the identity they uploaded.',
        ],
      },
      {
        heading: 'A person reviews every application',
        body: [
          'Nothing is approved automatically. A member of our team reads every application, looks at the photo and the document, and decides. A profile that is approved starts suspended and without a photo until the companion completes it.',
          'We can suspend or ban any companion at any time, and a suspended profile disappears from search and cannot be messaged.',
        ],
      },
      {
        heading: 'What we do not do yet, and will not pretend to',
        body: [
          'We do not currently run automated Aadhaar KYC against the UIDAI database, a biometric selfie match, or a third-party criminal background check. Companions consent to a background check when they apply, so that we can run one, and we will add these before Companio opens beyond its first city.',
          'Until then the "Verified" badge is reserved for companions who have passed a full check. No companion carries it today, and we would rather show you an empty badge than a dishonest one.',
        ],
      },
    ];
