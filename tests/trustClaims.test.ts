import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The site once told members, in fourteen places including the Terms of Service,
 * that every companion is "verified against Aadhaar", passes "a live selfie
 * match", and clears "a third-party background check". None of it existed. There
 * is no UIDAI integration, no selfie-match model, and no background-check vendor.
 *
 * A safety claim the product cannot keep is the one lie that can get a member
 * hurt, so this test stands guard over the copy. If you are here because it
 * failed, you have two honest options:
 *
 *   1. Integrate the check, set KYC_PROVIDER, and put the claim behind
 *      KYC_VENDOR_ENABLED in lib/trust.ts.
 *   2. Do not make the claim.
 *
 * Adding the sentence back to a page is not one of them.
 */

// `lib` is swept too. It was not, and the payment receipt in
// lib/server/emailTemplates.ts kept telling customers to write to
// support@trycompanio.com long after every page had dropped it — an email is not
// a page, so nothing that walked the site could ever have caught it.
const ROOTS = ['app', 'components', 'lib'];

/**
 * Phrases the product cannot back up.
 *
 * `allow` is per-rule, not global. It used to be one list covering every rule,
 * which quietly meant a file excused for one claim was excused for all of them —
 * app/terms/page.tsx may truthfully say "we run no background check", and that
 * exemption would have let a refund promise back into the Terms unnoticed. An
 * exemption is granted for a reason, so it is granted against a reason.
 */
const FORBIDDEN: { pattern: RegExp; why: string; allow?: string[] }[] = [
  // Collecting CONSENT for a check is honest — it is how we become able to run
  // one. Asserting that the check has HAPPENED is the lie. So the word is only
  // allowed immediately before "consent", or in the sentence that denies it.
  {
    pattern: /background[-\s]?check(ed|s)?\b(?!\s+(consent|on me))/i,
    why: 'no background-check vendor is integrated',
    allow: [
      join('lib', 'trust.ts'),
      join('app', 'trust', 'page.tsx'),
      join('app', 'terms', 'page.tsx'),
      join('app', 'privacy', 'page.tsx'),
      // "It is a fraud check, not a criminal-background check" — §8 exists to
      // stop a member reading the Verified badge as a safety guarantee.
      join('app', 'community-guidelines', 'page.tsx'),
      join('components', 'safety', 'SafetyJourney.tsx'),
      join('components', 'companion', 'WizardStepVerify.tsx'),
      join('app', 'api', 'application', 'upload', 'route.ts'),
    ],
  },
  // /terms and SafetyJourney name these to DENY them — "we do not currently run
  // an automated Aadhaar KYC check, a biometric selfie match…". Naming the thing
  // you do not do is the honest sentence, not the forbidden one.
  { pattern: /selfie match/i, why: 'no biometric selfie match exists',
    allow: [join('lib', 'trust.ts'), join('app', 'trust', 'page.tsx'),
            join('app', 'terms', 'page.tsx')] },
  { pattern: /verified against Aadhaar/i, why: 'no UIDAI/Aadhaar KYC integration exists',
    allow: [join('lib', 'trust.ts'), join('app', 'trust', 'page.tsx')] },
  { pattern: /Aadhaar[-\s]?(KYC|verified)/i, why: 'no UIDAI/Aadhaar KYC integration exists',
    allow: [join('lib', 'trust.ts'), join('app', 'trust', 'page.tsx'),
            join('app', 'terms', 'page.tsx'),
            join('components', 'safety', 'SafetyJourney.tsx'),
            join('components', 'companion', 'WizardStepVerify.tsx')] },
  { pattern: /verified review/i, why: 'no review has ever been written; there is nothing to verify' },

  // ── The refund promise ──────────────────────────────────────────────────────
  //
  // The site promised "full refund within 7 days, no questions asked" in fifteen
  // places, and backed it with a real route and a dashboard button. The executed
  // Refund Policy §2 offers no cooling-off window, so every one of those was a
  // promise the signed document would not honour — the site was the generous one,
  // which is the pleasant-looking half of the same failure: a page and a contract
  // that disagree about money.
  //
  // "7 business days" is our response time for a billing query and is deliberately
  // not matched here. Only a refund *entitlement* keyed to 7 days is.
  {
    pattern: /7[-\s]day refund|refund[^.]{0,40}\b(within|in) 7 days\b/i,
    why: 'the executed Refund Policy offers no cooling-off window — a pass is non-refundable once active',
  },
  {
    pattern: /refund[^.]{0,30}no questions/i,
    why: 'there is no no-questions-asked refund; refunds are for non-delivery, duplicates, and legal entitlement',
  },

  // ── Contact addresses ───────────────────────────────────────────────────────
  //
  // The executed policies name trycompanio@gmail.com nine times and no other
  // address. support@, privacy@ and grievance@trycompanio.com are mailboxes no
  // document names and nobody reads, and DPDPA 2023 requires the Grievance
  // Officer be *reachable* — so publishing one is not a cosmetic slip.
  //
  // Every contact address must come from lib/company.ts. Hard-coding one is how
  // the receipt email kept a dead address after the whole site had lost it.
  // hello@trycompanio.com is deliberately not matched: it is the EMAIL_FROM
  // sender identity, not somewhere a human is invited to write.
  {
    pattern: /\b(support|privacy|grievance)@trycompanio\.com/i,
    why: 'no executed policy names these mailboxes; contact addresses come from lib/company.ts',
  },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

/**
 * Only what a member can actually read counts. A comment explaining why we do
 * NOT run a background check is the opposite of the lie, and `backgroundConsent`
 * is a field name, not a promise — neither should trip the guard.
 */
function userVisibleText(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')     // block comments
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ')   // line comments (not the // in a URL)
    .replace(/\b\w+Consent\b/g, ' ');      // the consent field name
}

describe('safety and money claims match what the product actually does', () => {
  const files = ROOTS.flatMap((r) => walk(r));

  for (const { pattern, why, allow = [] } of FORBIDDEN) {
    it(`no page claims ${pattern.source} — ${why}`, () => {
      const offenders = files
        .filter((f) => !allow.some((a) => f.endsWith(a)))
        .filter((f) => pattern.test(userVisibleText(readFileSync(f, 'utf8'))));
      expect(offenders, `${offenders.join(', ')} — ${why}`).toEqual([]);
    });
  }
});
