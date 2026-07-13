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

const ROOTS = ['app', 'components'];

/** Phrases that assert a check nobody runs. */
const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  // Collecting CONSENT for a check is honest — it is how we become able to run
  // one. Asserting that the check has HAPPENED is the lie. So the word is only
  // allowed immediately before "consent", or in the sentence that denies it.
  {
    pattern: /background[-\s]?check(ed|s)?\b(?!\s+(consent|on me))/i,
    why: 'no background-check vendor is integrated',
  },
  { pattern: /selfie match/i, why: 'no biometric selfie match exists' },
  { pattern: /verified against Aadhaar/i, why: 'no UIDAI/Aadhaar KYC integration exists' },
  { pattern: /Aadhaar[-\s]?(KYC|verified)/i, why: 'no UIDAI/Aadhaar KYC integration exists' },
  { pattern: /verified review/i, why: 'no review has ever been written; there is nothing to verify' },
];

/**
 * Files allowed to say these words, because they say them truthfully — either to
 * deny the claim, to name the thing that is missing, or to collect consent for a
 * check that may run later.
 */
const ALLOWED = [
  join('lib', 'trust.ts'),
  join('app', 'trust', 'page.tsx'),
  join('app', 'terms', 'page.tsx'),
  join('app', 'privacy', 'page.tsx'),
  join('components', 'safety', 'SafetyJourney.tsx'),
  join('components', 'companion', 'WizardStepVerify.tsx'),
  join('app', 'api', 'application', 'upload', 'route.ts'),
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

describe('safety claims match what the product actually does', () => {
  const files = ROOTS.flatMap((r) => walk(r)).filter(
    (f) => !ALLOWED.some((a) => f.endsWith(a)),
  );

  for (const { pattern, why } of FORBIDDEN) {
    it(`no page claims ${pattern.source} — ${why}`, () => {
      const offenders = files.filter((f) => pattern.test(userVisibleText(readFileSync(f, 'utf8'))));
      expect(offenders, `${offenders.join(', ')} — ${why}`).toEqual([]);
    });
  }
});
