// lib/company.ts
//
// SINGLE SOURCE OF TRUTH for company + compliance contact facts. These appear in
// the Privacy Policy, Terms of Service and the site footer.
//
// DPDPA 2023 and the IT Act both REQUIRE a published, reachable Grievance Officer
// and a registered address. Publishing wrong details is worse than publishing none.
//
// Every value here is transcribed from the executed policy documents — the
// Grievance Redressal Policy §2 names the officer, and all six policies give one
// contact address. If a policy is re-issued, this file changes with it: the site
// and the signed documents may never disagree about who to contact.

export const COMPANY = {
  legalName: 'TRYCOMPANIOLABS LLP',
  brand: 'Companio',
  // From the LLP incorporation papers (LLPs have an LLPIN, not a CIN):
  llpin: 'ACY-1464',
  registeredAddress:
    'DPT 808B, F 79–80, 8th Floor, DLF Prime Tower, Okhla Industrial Area Phase-I, New Delhi – 110020, Delhi, India',
  // Contact. One monitored inbox, not three vanity aliases on the domain.
  //
  // This file used to publish support@, privacy@ and grievance@trycompanio.com.
  // None of them are named anywhere in the executed policies, which give this
  // address nine times and no other. An unmonitored grievance inbox is not a
  // cosmetic problem: DPDPA 2023 requires the officer be *reachable*, so a
  // handsome address nobody reads fails the law that a plain one satisfies.
  supportEmail: 'trycompanio@gmail.com',
  privacyEmail: 'trycompanio@gmail.com',
  // DPDPA / IT Act Grievance Officer — Grievance Redressal Policy §2.
  grievanceOfficer: {
    name: 'Prashant Yadav',
    email: 'trycompanio@gmail.com',
    phone: '+91 90399 56337',
  },
  // Legal venue for disputes:
  jurisdiction: 'New Delhi, India',
  governingLaw: 'the laws of India',
} as const;

/** True while a field is still an unfilled [[placeholder]]. */
function unfilled(v: string): boolean {
  return v.includes('[[');
}

/**
 * Display-safe company facts. Any field still holding a [[placeholder]] is
 * swapped for a graceful fallback so a raw "[[CIN]]" can NEVER render to a user.
 * Fill the real values in COMPANY above and these pass straight through.
 *
 * NOTE: a real, reachable Grievance Officer + registered address are LEGALLY
 * required (DPDPA 2023 / IT Act). The fallback is a stopgap to avoid leaking
 * placeholders — it is NOT a substitute for filling in the real details.
 */
export const COMPANY_DISPLAY = {
  legalName: COMPANY.legalName,
  llpin: unfilled(COMPANY.llpin) ? null : COMPANY.llpin,
  registeredAddress: unfilled(COMPANY.registeredAddress)
    ? 'Registered office details available on request'
    : COMPANY.registeredAddress,
  grievanceOfficer: {
    // null, not the string 'Grievance Officer'. Every call site already prints
    // the role as a label, so a generic fallback rendered as
    // "Grievance Officer: Grievance Officer" in the footer of every page.
    // An absent name is honest and reads cleanly; a name that restates the label
    // is neither. Callers must omit the clause when this is null.
    name: unfilled(COMPANY.grievanceOfficer.name) ? null : COMPANY.grievanceOfficer.name,
    email: COMPANY.grievanceOfficer.email,
    phone: unfilled(COMPANY.grievanceOfficer.phone) ? null : COMPANY.grievanceOfficer.phone,
  },
} as const;

/**
 * "Grievance Officer" / "Grievance Officer, Asha Rao" — the label with the name
 * appended only when there is one. Keeps the four places that name the officer
 * from each inventing their own null handling.
 */
export const GRIEVANCE_OFFICER_LABEL = COMPANY_DISPLAY.grievanceOfficer.name
  ? `Grievance Officer, ${COMPANY_DISPLAY.grievanceOfficer.name}`
  : 'Grievance Officer';

/**
 * The same thing, but for the middle of a sentence: "…contact our Grievance
 * Officer at x@y" / "…contact our Grievance Officer, Asha Rao, at x@y".
 *
 * The comma belongs to the name, not to the sentence. Hard-coding it around the
 * label produced "contact our Grievance Officer, at grievance@trycompanio.com"
 * whenever the name was absent — which is today, on three pages.
 */
export const GRIEVANCE_OFFICER_PHRASE = COMPANY_DISPLAY.grievanceOfficer.name
  ? `Grievance Officer, ${COMPANY_DISPLAY.grievanceOfficer.name},`
  : 'Grievance Officer';
